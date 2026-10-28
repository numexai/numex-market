/* =========================================================
   PulseBoard — Veri katmanı
   Tek kaynak: localStorage. Backend yok.
   Tüm yazma işlemleri sürüm damgası (rev) ve olay yayını yapar.
   ========================================================= */

import {
  bugunISO, gunEkle, gunFarki, benzersizId, VARSAYILAN_KATEGORILER, isoToDate,
} from "./utils.js";

const ANAHTAR = "pulseboard:v1";
const SURUM = 1;

/* --- Varsayılan (boş ama şekilli) durum --- */
function varsayilanDurum() {
  return {
    surum: SURUM,
    tema: "koyu",
    gorevler: [],
    aliskanliklar: [],
    kategoriler: VARSAYILAN_KATEGORILER.map((k) => ({ ...k, ozel: false })),
    olusturma: new Date().toISOString(),
    gorulenGun: bugunISO(),
  };
}

/* --- Okuma / yazma --- */
let durum = null;
const dinleyiciler = new Set();

function derinKopya(veri) {
  return JSON.parse(JSON.stringify(veri));
}

function normalizeDurum(ham) {
  const temel = varsayilanDurum();
  if (!ham || typeof ham !== "object") return temel;

  const birlesik = {
    ...temel,
    ...ham,
    gorevler: Array.isArray(ham.gorevler) ? ham.gorevler : [],
    aliskanliklar: Array.isArray(ham.aliskanliklar) ? ham.aliskanliklar : [],
    kategoriler: Array.isArray(ham.kategoriler) && ham.kategoriler.length
      ? ham.kategoriler
      : temel.kategoriler,
  };

  birlesik.gorevler = birlesik.gorevler
    .filter((g) => g && typeof g === "object" && typeof g.ad === "string")
    .map((g) => ({
      id: g.id || benzersizId(birlesik.gorevler, "gorev"),
      ad: g.ad,
      aciklama: typeof g.aciklama === "string" ? g.aciklama : "",
      oncelik: ["dusuk", "orta", "yuksek"].includes(g.oncelik) ? g.oncelik : "orta",
      kategori: typeof g.kategori === "string" ? g.kategori : "genel",
      teslim: typeof g.teslim === "string" ? g.teslim : "",
      tamam: Boolean(g.tamam),
      olusturmaTarihi: g.olusturmaTarihi || new Date().toISOString(),
      tamamlanmaTarihi: g.tamamlanmaTarihi || null,
    }));

  birlesik.aliskanliklar = birlesik.aliskanliklar
    .filter((a) => a && typeof a === "object" && typeof a.ad === "string")
    .map((a) => ({
      id: a.id || benzersizId(birlesik.aliskanliklar, "aliskanlik"),
      ad: a.ad,
      emoji: typeof a.emoji === "string" && a.emoji ? a.emoji : "🎯",
      renk: typeof a.renk === "string" && a.renk ? a.renk : "#2dd4bf",
      hedefHafta: Number.isFinite(a.hedefHafta) ? Math.min(7, Math.max(1, a.hedefHafta)) : 7,
      yapilanGunler: Array.isArray(a.yapilanGunler)
        ? [...new Set(a.yapilanGunler.filter((t) => typeof t === "string"))].sort()
        : [],
      olusturmaTarihi: a.olusturmaTarihi || new Date().toISOString(),
    }));

  return birlesik;
}

function yukle() {
  try {
    const ham = localStorage.getItem(ANAHTAR);
    durum = ham ? normalizeDurum(JSON.parse(ham)) : varsayilanDurum();
  } catch (hata) {
    console.warn("[PulseBoard] Veri okunamadı, sıfırdan başlanıyor.", hata);
    durum = varsayilanDurum();
  }
  return durum;
}

function kaydet() {
  try {
    localStorage.setItem(ANAHTAR, JSON.stringify(durum));
    return true;
  } catch (hata) {
    console.error("[PulseBoard] Kaydetme başarısız (depolama dolu olabilir).", hata);
    return false;
  }
}

/** Değişiklikten sonra depola + abonelere bildir */
function degisti(olay = "genel", detay = null) {
  kaydet();
  const anlik = { durum: derinKopya(durum), olay, detay };
  dinleyiciler.forEach((fn) => {
    try {
      fn(anlik);
    } catch (hata) {
      console.error("[PulseBoard] Dinleyici hatası:", hata);
    }
  });
}

/* --- Store API --- */
export const store = {
  baslat() {
    if (!durum) yukle();
    return derinKopya(durum);
  },

  al() {
    if (!durum) yukle();
    return derinKopya(durum);
  },

  /** Anlık (kopyasız) referans — yalnızca okuma amaçlı hızlı erişim */
  ham() {
    if (!durum) yukle();
    return durum;
  },

  aboneOl(fn) {
    dinleyiciler.add(fn);
    return () => dinleyiciler.delete(fn);
  },

  /* ---------- GÖREVLER ---------- */

  gorevEkle(girdi) {
    const ad = String(girdi?.ad || "").trim();
    if (!ad) return null;
    const yeni = {
      id: benzersizId(durum.gorevler, "gorev"),
      ad,
      aciklama: String(girdi?.aciklama || "").trim(),
      oncelik: ["dusuk", "orta", "yuksek"].includes(girdi?.oncelik) ? girdi.oncelik : "orta",
      kategori: String(girdi?.kategori || "genel"),
      teslim: String(girdi?.teslim || ""),
      tamam: false,
      olusturmaTarihi: new Date().toISOString(),
      tamamlanmaTarihi: null,
    };
    durum.gorevler.unshift(yeni);
    degisti("gorev:eklendi", { id: yeni.id });
    return derinKopya(yeni);
  },

  gorevDuzenle(id, yamalar) {
    const g = durum.gorevler.find((x) => x.id === id);
    if (!g) return null;
    if (typeof yamalar.ad === "string" && yamalar.ad.trim()) g.ad = yamalar.ad.trim();
    if (typeof yamalar.aciklama === "string") g.aciklama = yamalar.aciklama.trim();
    if (["dusuk", "orta", "yuksek"].includes(yamalar.oncelik)) g.oncelik = yamalar.oncelik;
    if (typeof yamalar.kategori === "string") g.kategori = yamalar.kategori;
    if (typeof yamalar.teslim === "string") g.teslim = yamalar.teslim;
    degisti("gorev:duzenlendi", { id });
    return derinKopya(g);
  },

  gorevTamamla(id, deger = true) {
    const g = durum.gorevler.find((x) => x.id === id);
    if (!g) return null;
    g.tamam = Boolean(deger);
    g.tamamlanmaTarihi = g.tamam ? new Date().toISOString() : null;
    degisti("gorev:tamamlandi", { id, tamam: g.tamam });
    return derinKopya(g);
  },

  gorevDegistir(id) {
    const g = durum.gorevler.find((x) => x.id === id);
    if (!g) return null;
    return this.gorevTamamla(id, !g.tamam);
  },

  gorevSil(id) {
    const i = durum.gorevler.findIndex((x) => x.id === id);
    if (i < 0) return null;
    const [silinen] = durum.gorevler.splice(i, 1);
    degisti("gorev:silindi", { id });
    return derinKopya(silinen);
  },

  /** Geri alınabilir silme — silinen görevi eski konumuna geri koyar */
  gorevGeriKoy(gorev, indeks = 0) {
    if (!gorev) return null;
    const kopya = derinKopya(gorev);
    const index = Math.min(Math.max(0, indeks), durum.gorevler.length);
    durum.gorevler.splice(index, 0, kopya);
    degisti("gorev:geri-alindi", { id: kopya.id });
    return kopya;
  },

  gorevIndeks(id) {
    return durum.gorevler.findIndex((x) => x.id === id);
  },

  /* ---------- ALIŞKANLIKLAR ---------- */

  aliskanlikEkle(girdi) {
    const ad = String(girdi?.ad || "").trim();
    if (!ad) return null;
    const yeni = {
      id: benzersizId(durum.aliskanliklar, "aliskanlik"),
      ad,
      emoji: String(girdi?.emoji || "🎯"),
      renk: String(girdi?.renk || "#2dd4bf"),
      hedefHafta: Math.min(7, Math.max(1, Number(girdi?.hedefHafta) || 7)),
      yapilanGunler: [],
      olusturmaTarihi: new Date().toISOString(),
    };
    durum.aliskanliklar.unshift(yeni);
    degisti("aliskanlik:eklendi", { id: yeni.id });
    return derinKopya(yeni);
  },

  aliskanlikDuzenle(id, yamalar) {
    const a = durum.aliskanliklar.find((x) => x.id === id);
    if (!a) return null;
    if (typeof yamalar.ad === "string" && yamalar.ad.trim()) a.ad = yamalar.ad.trim();
    if (typeof yamalar.emoji === "string" && yamalar.emoji) a.emoji = yamalar.emoji;
    if (typeof yamalar.renk === "string" && yamalar.renk) a.renk = yamalar.renk;
    if (Number.isFinite(Number(yamalar.hedefHafta))) {
      a.hedefHafta = Math.min(7, Math.max(1, Number(yamalar.hedefHafta)));
    }
    degisti("aliskanlik:duzenlendi", { id });
    return derinKopya(a);
  },

  aliskanlikSil(id) {
    const i = durum.aliskanliklar.findIndex((x) => x.id === id);
    if (i < 0) return null;
    const [silinen] = durum.aliskanliklar.splice(i, 1);
    degisti("aliskanlik:silindi", { id });
    return derinKopya(silinen);
  },

  aliskanlikGeriKoy(aliskanlik, indeks = 0) {
    if (!aliskanlik) return null;
    const kopya = derinKopya(aliskanlik);
    const index = Math.min(Math.max(0, indeks), durum.aliskanliklar.length);
    durum.aliskanliklar.splice(index, 0, kopya);
    degisti("aliskanlik:geri-alindi", { id: kopya.id });
    return kopya;
  },

  aliskanlikIndeks(id) {
    return durum.aliskanliklar.findIndex((x) => x.id === id);
  },

  /** Belirtilen günü işaretler / işareti kaldırır */
  aliskanlikIsaretle(id, iso = bugunISO()) {
    const a = durum.aliskanliklar.find((x) => x.id === id);
    if (!a) return null;
    const varMi = a.yapilanGunler.includes(iso);
    if (varMi) {
      a.yapilanGunler = a.yapilanGunler.filter((t) => t !== iso);
    } else {
      a.yapilanGunler = [...new Set([...a.yapilanGunler, iso])].sort();
    }
    degisti(varMi ? "aliskanlik:geri-alindi" : "aliskanlik:isaretlendi", { id, iso, yapildi: !varMi });
    return { yapildi: !varMi, gunler: [...a.yapilanGunler] };
  },

  /**
   * Ardışık gün serisi: bugünden geriye kesintisiz zincir.
   * Bugün henüz işaretlenmediyse dünden başlayarak sayar (seri kırılmaz).
   */
  seri(id) {
    const a = durum.aliskanliklar.find((x) => x.id === id);
    if (!a || !a.yapilanGunler.length) return 0;
    const kume = new Set(a.yapilanGunler);
    const bugun = bugunISO();
    let baslangic = kume.has(bugun) ? bugun : gunEkle(bugun, -1);
    if (!kume.has(baslangic)) return 0;
    let sayac = 0;
    let imlec = baslangic;
    while (kume.has(imlec)) {
      sayac += 1;
      imlec = gunEkle(imlec, -1);
    }
    return sayac;
  },

  /** En uzun seri (tüm zamanlar) */
  enUzunSeri(id) {
    const a = durum.aliskanliklar.find((x) => x.id === id);
    if (!a || !a.yapilanGunler.length) return 0;
    const gunler = [...a.yapilanGunler].sort();
    let enIyi = 1;
    let anlik = 1;
    for (let i = 1; i < gunler.length; i++) {
      if (gunFarki(gunler[i - 1], gunler[i]) === 1) {
        anlik += 1;
        enIyi = Math.max(enIyi, anlik);
      } else {
        anlik = 1;
      }
    }
    return enIyi;
  },

  /** Belirli bir haftadaki (7 ISO günü) işaretli gün sayısı */
  haftaTamam(id, gunler) {
    const a = durum.aliskanliklar.find((x) => x.id === id);
    if (!a) return 0;
    const kume = new Set(a.yapilanGunler);
    return gunler.filter((g) => kume.has(g)).length;
  },

  /** Verilen ISO gününde kaç alışkanlık işaretli */
  gundeTamamlananAliskanlik(iso) {
    return durum.aliskanliklar.filter((a) => a.yapilanGunler.includes(iso)).length;
  },

  /* ---------- KATEGORİLER ---------- */

  kategoriEkle(ad) {
    const temiz = String(ad || "").trim();
    if (!temiz) return null;
    const varOlan = durum.kategoriler.find(
      (k) => k.ad.toLocaleLowerCase("tr") === temiz.toLocaleLowerCase("tr"),
    );
    if (varOlan) return derinKopya(varOlan);
    const palet = ["#38bdf8", "#a855f7", "#34d399", "#fbbf24", "#fb923c", "#f87171", "#818cf8", "#2dd4bf"];
    const yeni = {
      id: `kat_${temiz.toLocaleLowerCase("tr").replace(/[^a-z0-9]+/g, "-").slice(0, 22)}_${Math.random().toString(36).slice(2, 5)}`,
      ad: temiz,
      renk: palet[durum.kategoriler.length % palet.length],
      ozel: true,
    };
    durum.kategoriler.push(yeni);
    degisti("kategori:eklendi", { id: yeni.id });
    return derinKopya(yeni);
  },

  kategoriBilgi(id) {
    return durum.kategoriler.find((k) => k.id === id) || { id, ad: "Genel", renk: "#38bdf8" };
  },

  /* ---------- ÖZET / İSTATİSTİK ---------- */

  bugunGorevleri() {
    const bugun = bugunISO();
    return durum.gorevler.filter((g) => {
      if (g.tamam) return false;
      if (!g.teslim) return true;
      return g.teslim <= bugun;
    });
  },

  gorevIstatistigi() {
    const liste = durum.gorevler;
    const bugun = bugunISO();
    const tamam = liste.filter((g) => g.tamam);
    const acik = liste.length - tamam.length;
    const gecikmis = liste.filter((g) => !g.tamam && g.teslim && g.teslim < bugun);
    const bugunTeslim = liste.filter((g) => !g.tamam && g.teslim === bugun);
    return {
      toplam: liste.length,
      tamamlanan: tamam.length,
      acik,
      gecikmis: gecikmis.length,
      bugunTeslim: bugunTeslim.length,
      oran: liste.length ? Math.round((tamam.length / liste.length) * 100) : 0,
    };
  },

  /** Günlük ilerleme: bugüne ait (teslimi bugün veya gecikmiş) görevlerin tamamlanma oranı */
  gunlukIlerleme() {
    const bugun = bugunISO();
    const ilgili = durum.gorevler.filter((g) =>
      (g.teslim && g.teslim <= bugun) ||
      (g.tamamlanmaTarihi && g.tamamlanmaTarihi.slice(0, 10) === bugun) ||
      (!g.teslim && !g.tamam),
    );
    if (!ilgili.length) return { oran: 0, toplam: 0, tamamlanan: 0 };
    const tamamlanan = ilgili.filter((g) => g.tamam).length;
    return {
      oran: Math.round((tamamlanan / ilgili.length) * 100),
      toplam: ilgili.length,
      tamamlanan,
    };
  },

  /** Belirli bir günde tamamlanan görev sayısı (tamamlanma tarihinden) */
  gundeTamamlananGorev(iso) {
    return durum.gorevler.filter(
      (g) => g.tamam && g.tamamlanmaTarihi && g.tamamlanmaTarihi.slice(0, 10) === iso,
    ).length;
  },

  /** Son n günün görev tamamlama serisi */
  sonGunSerisi(n = 7) {
    const sonuc = [];
    for (let i = n - 1; i >= 0; i--) {
      const iso = gunEkle(bugunISO(), -i);
      sonuc.push({ tarih: iso, adet: this.gundeTamamlananGorev(iso) });
    }
    return sonuc;
  },

  istatistikOzeti() {
    const son7 = this.sonGunSerisi(7);
    const toplamTamam = son7.reduce((t, g) => t + g.adet, 0);
    const enYogun = son7.reduce(
      (enIyi, g) => (g.adet > enIyi.adet ? g : enIyi),
      { tarih: null, adet: 0 },
    );
    const aktifAliskanlik = durum.aliskanliklar.filter((a) => {
      const son7gun = son7.map((g) => g.tarih);
      return son7gun.some((g) => a.yapilanGunler.includes(g));
    }).length;

    const gs = this.gorevIstatistigi();
    const gunlukOrtalama = Math.round((toplamTamam / 7) * 10) / 10;

    const oncelikDagilim = ["dusuk", "orta", "yuksek"].map((p) => ({
      id: p,
      adet: durum.gorevler.filter((g) => g.oncelik === p).length,
      acik: durum.gorevler.filter((g) => g.oncelik === p && !g.tamam).length,
    }));

    const kategoriDagilim = durum.kategoriler
      .map((k) => ({
        id: k.id,
        ad: k.ad,
        renk: k.renk,
        adet: durum.gorevler.filter((g) => g.kategori === k.id).length,
        tamam: durum.gorevler.filter((g) => g.kategori === k.id && g.tamam).length,
      }))
      .filter((k) => k.adet > 0)
      .sort((a, b) => b.adet - a.adet);

    return {
      son7,
      toplamTamam,
      gunlukOrtalama,
      enYogun,
      aktifAliskanlik,
      toplamAliskanlik: durum.aliskanliklar.length,
      gorevOran: gs.oran,
      gecikmis: gs.gecikmis,
      bugunTeslim: gs.bugunTeslim,
      oncelikDagilim,
      kategoriDagilim,
    };
  },

  /** 12 haftalık ısı haritası verisi (84 gün) */
  isiHaritasi() {
    const gunler = [];
    for (let i = 83; i >= 0; i--) {
      const iso = gunEkle(bugunISO(), -i);
      gunler.push({
        tarih: iso,
        gorev: this.gundeTamamlananGorev(iso),
        aliskanlik: this.gundeTamamlananAliskanlik(iso),
      });
    }
    return gunler;
  },

  /* ---------- TEMA ---------- */

  temaAl() {
    return durum.tema === "acik" ? "acik" : "koyu";
  },

  temaAyarla(tema) {
    durum.tema = tema === "acik" ? "acik" : "koyu";
    degisti("tema:degisti", { tema: durum.tema });
  },

  /* ---------- DIŞA / İÇE AKTARMA ---------- */

  disaAktar() {
    return JSON.stringify(
      {
        uygulama: "PulseBoard",
        surum: SURUM,
        olusturma: new Date().toISOString(),
        veri: durum,
      },
      null,
      2,
    );
  },

  iceAktar(metin, birles = false) {
    const parsed = typeof metin === "string" ? JSON.parse(metin) : metin;
    const kaynak = parsed && parsed.veri ? parsed.veri : parsed;
    if (!kaynak || typeof kaynak !== "object") throw new Error("Geçersiz veri dosyası.");
    if (!Array.isArray(kaynak.gorevler) && !Array.isArray(kaynak.aliskanliklar)) {
      throw new Error("Dosyada görev veya alışkanlık listesi bulunamadı.");
    }

    const gelen = normalizeDurum(kaynak);

    if (birles) {
      const mevcutGorevId = new Set(durum.gorevler.map((g) => g.id));
      const mevcutAlisId = new Set(durum.aliskanliklar.map((a) => a.id));
      gelen.gorevler.forEach((g) => {
        if (!mevcutGorevId.has(g.id)) durum.gorevler.push(g);
      });
      gelen.aliskanliklar.forEach((a) => {
        if (!mevcutAlisId.has(a.id)) durum.aliskanliklar.push(a);
      });
      gelen.kategoriler.forEach((k) => {
        if (!durum.kategoriler.some((x) => x.id === k.id)) durum.kategoriler.push(k);
      });
    } else {
      durum.gorevler = gelen.gorevler;
      durum.aliskanliklar = gelen.aliskanliklar;
      durum.kategoriler = gelen.kategoriler;
    }

    degisti("veri:ice-aktarildi", {
      gorev: gelen.gorevler.length,
      aliskanlik: gelen.aliskanliklar.length,
      birles,
    });
    return { gorev: gelen.gorevler.length, aliskanlik: gelen.aliskanliklar.length };
  },

  tumunuSifirla() {
    durum = varsayilanDurum();
    degisti("veri:sifirlandi");
  },

  /** Uygulama ilk kez mi açılmış */
  bosMu() {
    return durum.gorevler.length === 0 && durum.aliskanliklar.length === 0;
  },

  /** Demo verisi — kullanıcı isterse yükler */
  ornekVeriYukle() {
    const bugun = bugunISO();
    const d = (n) => gunEkle(bugun, n);

    const gorevler = [
      { ad: "Haftalık planı gözden geçir", aciklama: "Önümüzdeki haftanın önceliklerini netleştir.", oncelik: "yuksek", kategori: "is", teslim: bugun, tamam: false },
      { ad: "30 dakika yürüyüş yap", aciklama: "", oncelik: "orta", kategori: "saglik", teslim: bugun, tamam: true },
      { ad: "Kitap: 40 sayfa oku", aciklama: "Kaldığın yerden devam et.", oncelik: "orta", kategori: "kisisel", teslim: bugun, tamam: false },
      { ad: "Fatura ödemelerini kontrol et", aciklama: "", oncelik: "yuksek", kategori: "kisisel", teslim: d(-1), tamam: false },
      { ad: "Proje dokümanını güncelle", aciklama: "Yeni API uçlarını ekle.", oncelik: "yuksek", kategori: "is", teslim: d(1), tamam: false },
      { ad: "İngilizce kelime tekrarı", aciklama: "50 kelime.", oncelik: "dusuk", kategori: "egitim", teslim: d(2), tamam: false },
      { ad: "Spor salonu kaydı", aciklama: "", oncelik: "orta", kategori: "saglik", teslim: d(-2), tamam: true },
      { ad: "Ekip toplantı notlarını paylaş", aciklama: "", oncelik: "orta", kategori: "is", teslim: d(-3), tamam: true },
    ];

    const aliskanliklar = [
      { ad: "Su iç (2 litre)", emoji: "💧", renk: "#38bdf8", yapilanGunler: [d(0), d(-1), d(-2), d(-3), d(-4)] },
      { ad: "Kitap oku", emoji: "📚", renk: "#a855f7", yapilanGunler: [d(-1), d(-2), d(-4)] },
      { ad: "Günlük yürüyüş", emoji: "🏃", renk: "#34d399", yapilanGunler: [d(0), d(-1), d(-2), d(-3)] },
      { ad: "Meditasyon", emoji: "🧘", renk: "#2dd4bf", yapilanGunler: [d(0), d(-2)] },
    ];

    durum.gorevler = gorevler.map((g, i) => ({
      id: `ornek_gorev_${i}_${Math.random().toString(36).slice(2, 6)}`,
      aciklama: "",
      oncelik: "orta",
      kategori: "genel",
      teslim: "",
      tamamlanmaTarihi: null,
      olusturmaTarihi: new Date(Date.now() - i * 3600000).toISOString(),
      ...g,
      tamamlanmaTarihi: g.tamam ? new Date(Date.now() - i * 7200000).toISOString() : null,
    }));

    durum.aliskanliklar = aliskanliklar.map((a, i) => ({
      id: `ornek_aliskanlik_${i}_${Math.random().toString(36).slice(2, 6)}`,
      hedefHafta: 7,
      olusturmaTarihi: new Date(Date.now() - i * 86400000).toISOString(),
      ...a,
    }));

    durum.kategoriler = VARSAYILAN_KATEGORILER.map((k) => ({ ...k, ozel: false }));
    degisti("veri:ornek-yuklendi");
  },

  /* ---------- DEPOLAMA BİLGİSİ ---------- */

  depolamaBilgisi() {
    try {
      const ham = localStorage.getItem(ANAHTAR) || "";
      const bayt = new Blob([ham]).size;
      return {
        bayt,
        kb: (bayt / 1024).toFixed(1),
        yuzde: Math.min(100, Math.round((bayt / (5 * 1024 * 1024)) * 1000) / 10),
        gorev: durum.gorevler.length,
        aliskanlik: durum.aliskanliklar.length,
      };
    } catch {
      return { bayt: 0, kb: "0", yuzde: 0, gorev: durum.gorevler.length, aliskanlik: durum.aliskanliklar.length };
    }
  },

  /** Gün değiştiyse görülenGun'u güncelle ve bayrak döndür */
  gunDegisimKontrolu() {
    const bugun = bugunISO();
    if (durum.gorulenGun !== bugun) {
      durum.gorulenGun = bugun;
      kaydet();
      return true;
    }
    return false;
  },

  /** Bugün için görevi olmayan gecikmiş görevleri bugüne taşır (opsiyonel yardımcı) */
  gecikmisleriBuguneTasi() {
    const bugun = bugunISO();
    let sayac = 0;
    durum.gorevler.forEach((g) => {
      if (!g.tamam && g.teslim && g.teslim < bugun) {
        g.teslim = bugun;
        sayac += 1;
      }
    });
    if (sayac) degisti("gorev:tasindi", { adet: sayac });
    return sayac;
  },

  /* --- Yardımcı okuma --- */
  kategoriListesi() {
    return derinKopya(durum.kategoriler);
  },

  oncelikSirasi: { dusuk: 1, orta: 2, yuksek: 3 },
};

export default store;
