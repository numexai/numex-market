/* =========================================================
   NUMEX CORE — Flow Engine
   Yürütme motoru: DAG, topolojik sıralama, döngü algılama,
   hata izolasyonu, SÜRELİ BAĞLANTI denetimi.

   SÜRELİ BAĞLANTI KURALI:
   Bir bağlantı `sure` (saniye) ve `bitis` (epoch ms) taşıyorsa geçicidir.
   Geçerlilik, çalıştırma başında DEĞİL, her veri aktarımı ANINDA yeniden
   kontrol edilir. Böylece önüne 5 sn gecikme konmuş 3 sn'lik bir hat,
   veri taşınırken süresi bittiği için veriyi hedefe ULAŞTIRMAZ.
   ========================================================= */

import { CALISTIRICILAR, DUGUM_TIPLERI } from "./dugumler.js";

export const DURUM = {
  BEKLIYOR: "bekliyor",
  CALISIYOR: "calisiyor",
  BASARILI: "basarili",
  HATALI: "hatali",
  ATLANDI: "atlandi"
};

/** Son bu eşiğin altındaysa bağlantı "son 5 saniye" uyarı durumundadır. */
export const UYARI_ESIGI_MS = 5000;

/**
 * Bağlantının veri aktarım ANINDAKİ geçerliliği.
 * @param {object} b bağlantı { sure?, bitis? }
 * @param {number} simdi epoch ms
 * @returns {{gecerli:boolean, kalanMs:number|null, neden?:string, sureli:boolean}}
 */
export function baglantiDurumu(b, simdi = Date.now()) {
  const sureli = !!(b && b.sure !== undefined && b.sure !== null && b.sure !== "kalici");
  if (!sureli) return { gecerli: true, kalanMs: null, sureli: false };
  if (!Number.isFinite(b.bitis)) return { gecerli: true, kalanMs: null, sureli: false };
  const kalanMs = b.bitis - simdi;
  if (kalanMs <= 0) {
    return { gecerli: false, kalanMs: 0, sureli: true, neden: "Bağlantının süresi doldu — veri aktarılmadı" };
  }
  return { gecerli: true, kalanMs, sureli: true };
}

/** Bağlantı geçerlilik durumunun görsel sınıfı: aktif / uyari / doldu */
export function baglantiSinifi(kalanMs) {
  if (kalanMs === null) return "kalici";
  if (kalanMs <= 0) return "doldu";
  if (kalanMs <= UYARI_ESIGI_MS) return "uyari";
  return "aktif";
}

/**
 * Grafı doğrular: döngü, eksik uçlar, geçersiz bağlantılar.
 * Döner: { gecerli, hatalar: [{kod, mesaj, dugumId?}], sira }
 */
export function grafiDogrula(graf) {
  const hatalar = [];
  const dugumIdKume = new Set(graf.dugumler.map(d => d.id));

  const gecerliBaglanti = [];
  for (const b of graf.baglantilar) {
    if (!dugumIdKume.has(b.kaynak) || !dugumIdKume.has(b.hedef)) {
      hatalar.push({ kod: "EKSIK_UC", mesaj: `Bağlantının ucu yok (${b.kaynak} → ${b.hedef})`, baglantiId: b.id });
      continue;
    }
    if (b.kaynak === b.hedef) {
      hatalar.push({ kod: "OZ_DONGU", mesaj: `Düğüm kendine bağlanamaz (${b.kaynak})`, baglantiId: b.id });
      continue;
    }
    gecerliBaglanti.push(b);
  }

  // Kahn topolojik sıralama + döngü tespiti
  const girisSayisi = new Map(graf.dugumler.map(d => [d.id, 0]));
  const komsu = new Map(graf.dugumler.map(d => [d.id, []]));
  for (const b of gecerliBaglanti) {
    girisSayisi.set(b.hedef, (girisSayisi.get(b.hedef) || 0) + 1);
    komsu.get(b.kaynak).push(b.hedef);
  }

  const kuyruk = [];
  for (const [id, sayi] of girisSayisi) if (sayi === 0) kuyruk.push(id);

  const sira = [];
  const sayac = new Map(girisSayisi);
  while (kuyruk.length) {
    const id = kuyruk.shift();
    sira.push(id);
    for (const hedef of komsu.get(id)) {
      const yeni = (sayac.get(hedef) || 0) - 1;
      sayac.set(hedef, yeni);
      if (yeni === 0) kuyruk.push(hedef);
    }
  }

  if (sira.length !== graf.dugumler.length) {
    const dongude = graf.dugumler.filter(d => !sira.includes(d.id)).map(d => d.id);
    hatalar.push({
      kod: "DONGU",
      mesaj: `Döngü algılandı: ${dongude.join(" → ")} — akış çalıştırılamaz`,
      dugumler: dongude
    });
  }

  return { gecerli: hatalar.length === 0, hatalar, sira, topolojikSira: sira };
}

/** Yürütücü — olay tabanlı, iptal edilebilir */
export class Motor {
  constructor() {
    this.calisiyor = false;
    this.ctrl = null;
  }

  durdur() {
    if (this.ctrl) this.ctrl.abort();
  }

  /**
   * @param {object} graf { dugumler:[{id,tip,ayar}], baglantilar:[{id,kaynak,hedef,sure?,bitis?}] }
   * @param {object} olaylar { dugumBasliyor, dugumBitti, dugumAtlandi, dugumHata, baglantiSuresiDoldu, bitti }
   */
  async calistir(graf, olaylar = {}) {
    if (this.calisiyor) throw new Error("Zaten çalışan bir akış var");
    this.calisiyor = true;
    this.ctrl = new AbortController();
    const sinyal = this.ctrl.signal;

    const baslangic = performance.now();
    const kayitlar = new Map();
    const sonuc = {
      baslangic: new Date().toISOString(),
      bitis: null,
      toplamMs: 0,
      durum: "basarili",
      hatalar: [],
      dugumler: [],
      ciktilar: {},
      sira: [],
      suresiDolanBaglantilar: [],
      iptal: false
    };

    try {
      const dogrulama = grafiDogrula(graf);

      if (!dogrulama.gecerli) {
        sonuc.durum = "basarisiz";
        sonuc.hatalar = dogrulama.hatalar;
        sonuc.bitis = new Date().toISOString();
        sonuc.toplamMs = Math.round(performance.now() - baslangic);
        olaylar.bitti?.(sonuc, "dogrulama");
        return sonuc;
      }

      const harita = new Map(graf.dugumler.map(d => [d.id, d]));

      // Hedef → gelen bağlantı nesneleri (kaynak id değil, HAT'ın kendisi tutulur:
      // süre kontrolü için sure/bitis alanlarına ihtiyacımız var)
      const girisler = new Map(graf.dugumler.map(d => [d.id, []]));
      for (const b of graf.baglantilar) girisler.get(b.hedef)?.push(b);

      // Başlat düğümü önce çalışsın
      const sirali = [...dogrulama.sira];
      const baslatId = sirali.find(id => harita.get(id)?.tip === "baslat");
      if (baslatId) {
        const i = sirali.indexOf(baslatId);
        if (i > 0) { sirali.splice(i, 1); sirali.unshift(baslatId); }
      }
      sonuc.sira = sirali;

      for (const id of sirali) {
        if (sinyal.aborted) {
          sonuc.iptal = true;
          sonuc.durum = "iptal";
          break;
        }

        const dugum = harita.get(id);
        const tip = DUGUM_TIPLERI[dugum.tip];
        if (!tip) {
          kayitlar.set(id, { durum: DURUM.HATALI, hata: `Bilinmeyen düğüm tipi: ${dugum.tip}`, sureMs: 0 });
          sonuc.hatalar.push({ dugumId: id, mesaj: `Bilinmeyen düğüm tipi: ${dugum.tip}` });
          sonuc.dugumler.push({ id, durum: DURUM.HATALI, hata: `Bilinmeyen düğüm tipi: ${dugum.tip}`, sureMs: 0 });
          continue;
        }

        const calistirici = CALISTIRICILAR[dugum.tip];
        if (!calistirici) {
          kayitlar.set(id, { durum: DURUM.HATALI, hata: "Çalıştırıcı tanımlı değil", sureMs: 0 });
          sonuc.hatalar.push({ dugumId: id, mesaj: "Çalıştırıcı tanımlı değil" });
          sonuc.dugumler.push({ id, durum: DURUM.HATALI, hata: "Çalıştırıcı tanımlı değil", sureMs: 0 });
          continue;
        }

        // ---- VERİ AKTARIM ANI: gelen hatların geçerliliğini ŞİMDİ kontrol et ----
        const gelenler = girisler.get(id) || [];
        const ustCiktilar = [];
        const dolanHatlar = [];

        for (const hat of gelenler) {
          const durumHat = baglantiDurumu(hat, Date.now());
          if (!durumHat.gecerli) {
            dolanHatlar.push(hat);
            if (!sonuc.suresiDolanBaglantilar.includes(hat.id)) sonuc.suresiDolanBaglantilar.push(hat.id);
            olaylar.baglantiSuresiDoldu?.(hat, id);
            continue;
          }
          const k = kayitlar.get(hat.kaynak);
          if (!k) continue;
          if (k.durum === DURUM.BASARILI) {
            ustCiktilar.push({ dugumId: hat.kaynak, deger: k.cikti });
          }
        }

        // Hiç veri gelmediyse: süresi dolan hat varsa nedeni o, yoksa üst düğüm sorunlu
        if (gelenler.length > 0 && ustCiktilar.length === 0) {
          const not = dolanHatlar.length
            ? "Süresi dolmuş bağlantı — veri aktarımı engellendi"
            : "Üst düğümlerden veri gelmedi";
          kayitlar.set(id, { durum: DURUM.ATLANDI, girdi: null, cikti: null, sureMs: 0, not });
          sonuc.dugumler.push({ id, durum: DURUM.ATLANDI, not });
          olaylar.dugumAtlandi?.(id, not);
          continue;
        }

        // Filtre engeli: üst filtrelerden biri gecti=false ise bu düğüm çalışmaz
        const engel = gelenler.some(hat => {
          const k = kayitlar.get(hat.kaynak);
          return k && k.durum === DURUM.BASARILI && k.gecti === false;
        });
        if (engel && dugum.tip !== "filtre") {
          kayitlar.set(id, { durum: DURUM.ATLANDI, girdi: null, cikti: null, sureMs: 0, not: "Üst filtreden geçmedi" });
          sonuc.dugumler.push({ id, durum: DURUM.ATLANDI, not: "Üst filtreden geçmedi" });
          olaylar.dugumAtlandi?.(id, "Üst filtreden geçmedi");
          continue;
        }

        let girdi;
        if (gelenler.length === 0) girdi = null;
        else if (ustCiktilar.length === 1) girdi = ustCiktilar[0].deger;
        else girdi = ustCiktilar.map(x => x.deger);

        const t0 = performance.now();
        olaylar.dugumBasliyor?.(id, girdi);

        try {
          const sonucD = await calistirici(girdi, dugum.ayar || {}, { sinyal });
          const ms = Math.round(performance.now() - t0);
          const kayit = {
            durum: DURUM.BASARILI,
            girdi,
            cikti: sonucD.deger,
            gecti: sonucD.gecti,
            not: sonucD.not,
            sureMs: ms
          };
          kayitlar.set(id, kayit);
          sonuc.ciktilar[id] = sonucD.deger;
          sonuc.dugumler.push({ id, durum: DURUM.BASARILI, sureMs: ms });
          olaylar.dugumBitti?.(id, sonucD, ms);
        } catch (e) {
          const ms = Math.round(performance.now() - t0);
          const mesaj = String(e?.message || e);
          const kayit = { durum: DURUM.HATALI, girdi, cikti: null, hata: mesaj, sureMs: ms };
          kayitlar.set(id, kayit);
          sonuc.hatalar.push({ dugumId: id, mesaj, dugumAd: dugum.ad });
          sonuc.dugumler.push({ id, durum: DURUM.HATALI, hata: mesaj, sureMs: ms });
          olaylar.dugumHata?.(id, mesaj);

          if (sinyal.aborted) { sonuc.iptal = true; sonuc.durum = "iptal"; break; }
        }
      }

      if (sonuc.durum === "basarili" && sonuc.hatalar.length > 0) sonuc.durum = "kismen";
      if (sonuc.dugumler.length && sonuc.dugumler.every(d => d.durum === DURUM.HATALI)) sonuc.durum = "basarisiz";

    } catch (e) {
      sonuc.durum = "basarisiz";
      sonuc.hatalar.push({ dugumId: null, mesaj: String(e?.message || e) });
    } finally {
      sonuc.bitis = new Date().toISOString();
      sonuc.toplamMs = Math.round(performance.now() - baslangic);
      this.calisiyor = false;
      this.ctrl = null;
      olaylar.bitti?.(sonuc, "tamam");
    }

    return sonuc;
  }
}
