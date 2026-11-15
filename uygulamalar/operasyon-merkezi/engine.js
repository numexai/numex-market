'use strict';
/**
 * ÜRETİM MOTORU
 * Sipariş -> planlama (BOM, stok, maliyet, makine kapasitesi) -> iş emri -> rezervasyon
 * -> simülasyon eşiği -> hammadde düşümü -> üretim geçmişi
 *
 * Kilit kurallar:
 *  - Aynı (istasyon, zaman dilimi) iki emre birden tahsis edilmez (kesin çakışma kontrolü).
 *  - Stok eksiye düşmez; emir iptali rezervasyonu birebir serbest bırakır.
 *  - İşlemler idempotan: aynı sipariş/emir iki kez işlenirse çift düşüm olmaz.
 */

const EPS = 1e-9;

function round(n, hane = 2) {
  const k = Math.pow(10, hane);
  return Math.round((n + Number.EPSILON) * k) / k;
}

function simTime(db) {
  return Date.now() * (db.veri.simAyar.hiz || 1);
}

const durumAdi = {
  kuyrukta: 'Kuyrukta',
  calisiyor: 'Çalışıyor',
  tamamlandi: 'Tamamlandı',
  iptal: 'İptal Edildi'
};

class Motor {
  constructor(db) {
    this.db = db;
  }

  get v() {
    return this.db.veri;
  }

  // ---------- yardımcılar ----------
  urun(id) {
    return this.v.urunler.find((u) => u.id === id);
  }
  malzeme(id) {
    return this.v.stok.find((m) => m.id === id);
  }
  istasyon(id) {
    return this.v.istasyonlar.find((s) => s.id === id);
  }
  emirBul(id) {
    return this.v.emirler.find((e) => e.id === id) || this.v.emirlerArsiv.find((e) => e.id === id);
  }

  /** Her malzeme için rezerve edilmiş (henüz tüketilmemiş) miktar */
  rezerveHaritasi() {
    const harita = {};
    for (const m of this.v.stok) harita[m.id] = 0;
    for (const e of this.v.emirler) {
      if (e.durum === 'tamamlandi' || e.durum === 'iptal') continue;
      for (const r of e.rezervasyon) harita[r.malzemeId] = round((harita[r.malzemeId] || 0) + r.miktar, 4);
    }
    return harita;
  }

  /** İstasyonun [bas, bit] aralığında dolu olan dakikaları */
  doluDakikalar(emir, istasyonId, bas, bit) {
    const dolu = [];
    for (const e of this.v.emirler) {
      if (e.id === emir.id) continue;
      if (e.durum !== 'kuyrukta' && e.durum !== 'calisiyor') continue;
      for (const a of e.adimlar) {
        if (a.istasyonId !== istasyonId) continue;
        const aBas = Math.max(bas, a.baslangicSim);
        const aBit = Math.min(bit, a.bitisSim);
        if (aBit > aBas) dolu.push([aBas, aBit]);
      }
    }
    dolu.sort((x, y) => x[0] - y[0]);
    return dolu;
  }

  /**
   * "Bu istasyonda `enErken`den sonra ilk boş an" = istasyonda rezerve edilmiş en geç bitiş.
   * Emirler aynı istasyonda kesinlikle çakışmadığı için tek sayı yeterlidir.
   */
  bosZaman(istasyonId, enErken) {
    let t = enErken;
    for (const e of this.v.emirler) {
      if (e.durum === 'iptal' || e.durum === 'tamamlandi') continue;
      for (const a of e.adimlar) {
        if (a.istasyonId === istasyonId && a.bitisSim > t) t = a.bitisSim;
      }
    }
    return t;
  }

  /** İstasyon programında boş slot arayan basit sığdırma (dokunulan emri yerleştirmez) */
  bosaYerlestir(emir, istasyonId, sure, enErken) {
    let bas = enErken;
    const dolu = this.doluDakikalar(emir, istasyonId, enErken, enErken + 60 * 24 * 30);
    // var olan bloklarla çakışmayacak ilk boşluğu bul
    for (const [dBas, dBit] of dolu) {
      if (bas + sure <= dBas) return bas;
      if (bas < dBit) bas = dBit;
    }
    return bas;
  }

  /**
   * Sipariş için tam plan çıkarır — HİÇBİR ŞEY YAZMAZ.
   * Kullanıcıya "siparişi oluşturmadan önce ne olacak" bilgisini verir.
   */
  planla(urunId, adet, musteri = '') {
    const urun = this.urun(urunId);
    if (!urun) throw new Hata(404, 'Ürün bulunamadı.');
    adet = Number(adet);
    if (!Number.isFinite(adet) || adet <= 0 || !Number.isInteger(adet)) {
      throw new Hata(400, 'Adet pozitif tam sayı olmalı.');
    }

    const rezerve = this.rezerveHaritasi();
    const ihtiyaclar = urun.bom.map((b) => {
      const m = this.malzeme(b.malzemeId);
      const gereken = round(b.miktar * adet, 4);
      const kullanilabilir = round(m.stok - (rezerve[m.id] || 0), 4);
      return {
        malzemeId: m.id,
        ad: m.ad,
        birim: m.birim,
        birimMiktar: b.miktar,
        gereken,
        stok: m.stok,
        rezerve: rezerve[m.id] || 0,
        kullanilabilir,
        eksik: gereken > kullanilabilir + EPS ? round(gereken - kullanilabilir, 4) : 0,
        birimFiyat: m.birimFiyat,
        maliyet: round(gereken * m.birimFiyat)
      };
    });

    const eksikler = ihtiyaclar.filter((i) => i.eksik > 0);

    // Makine kapasitesi planı — mevcut emir takvimine çakışmasız yerleştirilir
    const enErken = this.bosZaman('S1', simTime(this.db));
    const makinePlan = [];
    const kapasiteCakismasi = [];
    for (const r of urun.rotalar) {
      const ist = this.istasyon(r.istasyonId);
      const sure = r.sureDk * adet;
      const slotSayisi = Math.ceil(sure / ist.kapasite);
      const bloklar = [];
      // Aynı parça blokları kapasite kadar paralel işlenir: süre = ceil(toplam / kapasite).
      // Her rota, bir önceki istasyonun bitişinden sonra, o istasyonun ilk boş anından başlar.
      const ilkBos = this.bosZaman(ist.id, makinePlan.length ? makinePlan[makinePlan.length - 1].bitisSim : enErken);
      let bas = ilkBos;
      let kalan = sure;
      while (kalan > EPS) {
        const blok = Math.min(ist.kapasite, Math.ceil(kalan - EPS));
        bloklar.push({ bas, bit: bas + 1, doluluk: blok });
        bas += 1;
        kalan -= blok;
      }
      if (!bloklar.length) bloklar.push({ bas: ilkBos, bit: ilkBos, doluluk: 0 });
      const basT = bloklar[0].bas;
      const bitT = bloklar[bloklar.length - 1].bit;
      const dolu = this.doluDakikalar({ id: ` PLAN-${r.istasyonId}` }, ist.id, basT, bitT + 1);
      if (dolu.length) kapasiteCakismasi.push({ istasyonId: ist.id, istasyon: ist.ad, blokSayisi: dolu.length });
      makinePlan.push({
        istasyonId: ist.id,
        istasyon: ist.ad,
        kapasite: ist.kapasite,
        birimSureDk: r.sureDk,
        toplamDk: sure,
        slotSayisi,
        baslangicSim: basT,
        bitisSim: bitT,
        baslangicGercek: basT / (this.v.simAyar.hiz || 1),
        bitisGercek: bitT / (this.v.simAyar.hiz || 1)
      });
    }

    const malzemeMaliyeti = round(ihtiyaclar.reduce((t, i) => t + i.maliyet, 0));
    const iscilikMaliyeti = round(urun.iscilikSaat * adet * urun.iscilikUcreti);
    const toplamMaliyet = round(malzemeMaliyeti + iscilikMaliyeti);
    const birimMaliyet = round(toplamMaliyet / adet);
    const satisGeliri = round(urun.birimFiyat * adet);
    const tahminiKar = round(satisGeliri - toplamMaliyet);
    const toplamSureDk = makinePlan.reduce((t, p) => t + p.toplamDk, 0);
    const imalatBasSim = Math.min(...makinePlan.map((p) => p.baslangicSim));
    const imalatBitSim = Math.max(...makinePlan.map((p) => p.bitisSim));

    return {
      urun: { id: urun.id, ad: urun.ad },
      adet,
      musteri,
      ihtiyaclar,
      eksikler,
      stokYeterli: eksikler.length === 0,
      makinePlan,
      kapasiteCakismasi,
      toplamParcaSuresiDk: round(toplamSureDk),
      tahminiUretimDk: round(imalatBitSim - imalatBasSim),
      malzemeMaliyeti,
      iscilikMaliyeti,
      toplamMaliyet,
      birimMaliyet,
      satisGeliri,
      tahminiKar,
      simAyar: this.v.simAyar.hiz,
      simZaman: enErken
    };
  }

  /** Sipariş + üretim emri oluşturur (kapasite ayırır, stok rezerve eder) */
  siparisOlustur({ urunId, adet, musteri }) {
    const plan = this.planla(urunId, adet, musteri || '');
    if (plan.eksikler.length) {
      const h = new Hata(409, 'Stok yetersiz — üretim engellendi.');
      h.detay = { eksikler: plan.eksikler, plan };
      throw h;
    }

    const urun = this.urun(urunId);
    const simdi = simTime(this.db);

    // Rezervasyonlar (aynı işlemde stok ayır → paralel istek çift düşürmesin)
    const rezervasyon = plan.ihtiyaclar.map((i) => ({ malzemeId: i.malzemeId, miktar: i.gereken }));
    // Stok kontrolü tekrar: plan ile rezervasyon arasında başka bir istek girdiyse engelle
    const rezerve = this.rezerveHaritasi();
    for (const r of rezervasyon) {
      const m = this.malzeme(r.malzemeId);
      if (m.stok - (rezerve[r.malzemeId] || 0) < r.miktar - EPS) {
        const h = new Hata(409, `Stok yetersiz — ${m.ad} için eşzamanlı rezervasyon var.`);
        h.detay = { eksikler: [{ malzemeId: m.id, ad: m.ad, eksik: round(r.miktar - (m.stok - (rezerve[m.id] || 0)), 4) }] };
        throw h;
      }
    }

    const siparisNo = this.db.siparisNoUret();
    const siparis = {
      id: siparisNo,
      urunId,
      urunAd: urun.ad,
      adet,
      musteri: musteri || 'İç Sipariş',
      birimFiyat: urun.birimFiyat,
      toplamTutar: round(urun.birimFiyat * adet),
      malzemeMaliyeti: plan.malzemeMaliyeti,
      iscilikMaliyeti: plan.iscilikMaliyeti,
      toplamMaliyet: plan.toplamMaliyet,
      birimMaliyet: plan.birimMaliyet,
      tahminiKar: plan.tahminiKar,
      durum: 'kuyrukta',
      tarih: Date.now(),
      emirId: null
    };

    // İş emri — adımlar sırayla, kapasite blokları arasında boşluk yok
    const emirNo = this.db.emirNoUret();
    const emirTaslak = { id: emirNo, siparisId: siparis.id, adimlar: [] };
    const simBaslangic = simTime(this.db);
    const adimlar = [];
    let oncekiBitis = simBaslangic;
    for (const rota of urun.rotalar) {
      const ist = this.istasyon(rota.istasyonId);
      // Bu istasyonun ilk boş anı (önceki istasyonun bitişinden önce başlayamaz)
      const imleç = this.bosZaman(ist.id, oncekiBitis);
      const toplamDk = rota.sureDk * adet;
      // Kapasite blokları: aynı anda en fazla `kapasite` parça. Her blok üst üste binmeyen
      // ardışık zaman dilimidir → iki emir aynı istasyonda asla çakışmaz.
      let kalanAdet = adet;
      let bas = imleç;
      const dilimler = [];
      while (kalanAdet > 0) {
        // Bir dakikada en fazla `kapasite` parça işlenir — blok = 1 simülasyon dakikası
        const dilimAdet = Math.min(ist.kapasite, kalanAdet);
        dilimler.push({ bas, bit: bas + 1, adet: dilimAdet });
        bas += 1;
        kalanAdet -= dilimAdet;
      }
      const blokBas = dilimler[0].bas;
      const parcalar = dilimler;
      const blokBit = parcalar[parcalar.length - 1].bit;
      const donmus = this.doluDakikalar(emirTaslak, ist.id, blokBas, blokBit);
      if (donmus.length) {
        const h = new Hata(409, `${ist.ad} istasyonunda seçilen zaman aralığı dolu — aynı kapasite iki emre tahsis edilemez.`);
        throw h;
      }
      adimlar.push({
        istasyonId: ist.id,
        istasyon: ist.ad,
        baslangicSim: blokBas,
        bitisSim: blokBit,
        planlananDk: toplamDk,
        tamamlananDk: 0,
        durum: 'kuyrukta',
        parcalar
      });
      oncekiBitis = blokBit;
    }

    const emir = {
      id: emirNo,
      siparisId: siparis.id,
      urunId,
      urunAd: urun.ad,
      adet,
      durum: 'kuyrukta',
      olusturmaSim: simBaslangic,
      baslangicSim: adimlar[0].baslangicSim,
      bitisSim: adimlar[adimlar.length - 1].bitisSim,
      tahminiToplamDk: plan.tahminiUretimDk,
      gercekBaslangicMs: null,
      gercekBitisMs: null,
      adimlar,
      rezervasyon,
      malzemeDusuldu: false,
      toplamMaliyet: plan.toplamMaliyet,
      malzemeMaliyeti: plan.malzemeMaliyeti,
      iscilikMaliyeti: plan.iscilikMaliyeti,
      iptalNedeni: null
    };

    this.v.siparisler.push(siparis);
    this.v.emirler.push(emir);
    siparis.emirId = emir.id;
    this.db.kaydet();

    return { siparis, emir, plan: this.planla(urunId, adet) };
  }

  /** Emri başlat: en erken başlangıçtan önce başlatılamaz (kapasite kilidi) */
  emriBaslat(emirId) {
    const emir = this.emirBul(emirId);
    if (!emir) throw new Hata(404, 'Üretim emri bulunamadı.');
    if (emir.durum === 'calisiyor') return { emir, mesaj: 'Zaten çalışıyor.' };
    if (emir.durum !== 'kuyrukta') throw new Hata(409, `Bu emir başlatılamaz: ${durumAdi[emir.durum]}.`);

    // Kontrol: gerçek stok (rezerve edilmiş olsa bile) hâlâ yeter mi?
    for (const r of emir.rezervasyon) {
      const m = this.malzeme(r.malzemeId);
      if (m.stok < r.miktar - EPS) {
        throw new Hata(409, `Başlatma engellendi — ${m.ad} stoğu ${m.stok} ${m.birim}, gereken ${r.miktar}.`);
      }
    }

    // Kapasite: aynı istasyonda aynı dakikada çalışan başka emir var mı?
    const calisanlar = this.v.emirler.filter((e) => e.durum === 'calisiyor' && e.id !== emir.id);
    for (const a of emir.adimlar) {
      for (const c of calisanlar) {
        for (const ca of c.adimlar) {
          if (ca.istasyonId !== a.istasyonId) continue;
          // aynı istasyon iki emre birden tahsis edilemez (kesin kural)
          if (c.adimlar.some((x) => x.istasyonId === a.istasyonId)) {
            const ist = this.istasyon(a.istasyonId);
            throw new Hata(409, `${ist.ad} istasyonu şu an ${c.id} emrine tahsisli — bu emir kuyruğa alındı.`);
          }
        }
      }
    }

    emir.durum = 'calisiyor';
    emir.gercekBaslangicMs = Date.now();
    // Sıradaki adım "çalışıyor", kalan adımlar "kuyrukta" — makine paneli bunu okur
    for (const a of emir.adimlar) a.durum = 'kuyrukta';
    emir.adimlar[0].durum = 'calisiyor';
    const sip = this.v.siparisler.find((s) => s.id === emir.siparisId);
    if (sip) sip.durum = 'calisiyor';
    this.db.kaydet();
    return { emir, mesaj: 'Üretim başladı.' };
  }

  /** Simülasyon ilerletme: emrin yüzde N'i tamamlandıysa stoğu düş ve geçmişe yaz */
  ilerlet(emirId, oran) {
    const emir = this.emirlerArsivdeAra(emirId);
    if (!emir) throw new Hata(404, 'Üretim emri bulunamadı.');
    if (emir.durum === 'tamamlandi') return { emir, mesaj: 'Zaten tamamlandı — ikinci kez işlenmedi (idempotan).' };
    if (emir.durum === 'iptal') throw new Hata(409, 'İptal edilmiş emir ilerletilemez.');
    if (emir.durum !== 'calisiyor') throw new Hata(409, 'Önce emri başlatın.');

    oran = Math.max(0, Math.min(1, Number(oran) || 0));
    const toplam = emir.adimlar.reduce((t, a) => t + a.planlananDk, 0);
    let hedef = toplam * oran;
    for (const a of emir.adimlar) {
      const kalanAdim = Math.max(0, hedef - (a.tamamlananDk || 0));
      const eklenen = Math.min(kalanAdim, a.planlananDk);
      if (eklenen > 0) {
        a.tamamlananDk = round(Math.min(a.planlananDk, (a.tamamlananDk || 0) + eklenen), 3);
      }
      if (a.tamamlananDk >= a.planlananDk - EPS) a.durum = 'tamamlandi';
      else if (a.durum === 'kuyrukta' && a.tamamlananDk > 0) a.durum = 'calisiyor';
      hedef -= a.tamamlananDk;
      if (hedef <= 0) break;
    }
    const ilkCalisan = emir.adimlar.find((a) => a.durum === 'calisiyor');
    if (ilkCalisan) ilkCalisan.durum = 'calisiyor';

    if (oran >= 1) {
      this.emriTamamla(emir);
    }
    this.db.kaydet();
    return { emir };
  }

  emirlerArsivdeAra(id) {
    return this.v.emirler.find((e) => e.id === id) || this.v.emirlerArsiv.find((e) => e.id === id);
  }

  emriTamamla(emir) {
    if (emir.durum === 'tamamlandi') return emir; // idempotan
    // Rezervasyonu hammadde hareketine dönüştür — stok ASLA eksiye düşmez
    for (const r of emir.rezervasyon) {
      const m = this.malzeme(r.malzemeId);
      const dusulecek = Math.min(m.stok, r.miktar);
      if (dusulecek > 0) {
        m.stok = round(m.stok - dusulecek, 4);
        this.hareketEkle({
          malzemeId: m.id,
          tip: 'cikis',
          miktar: dusulecek,
          aciklama: `${emir.id} / ${emir.urunAd} üretimi — hammadde tüketimi`
        });
      }
    }
    emir.adimlar.forEach((a) => {
      a.tamamlananDk = a.planlananDk;
      a.durum = 'tamamlandi';
    });
    emir.durum = 'tamamlandi';
    emir.gercekBitisMs = Date.now();
    emir.malzemeDusuldu = true;

    const sip = this.v.siparisler.find((s) => s.id === emir.siparisId);
    if (sip) sip.durum = 'tamamlandi';

    // günlük üretim ve geçmiş
    this.gunlukUretimEkle(emir.urunAd, emir.adet);
    this.v.hareketler.push({
      id: this.db.hareketNoUret(),
      tarih: Date.now(),
      malzemeId: null,
      tip: 'uretim',
      miktar: emir.adet,
      aciklama: `${emir.id} tamamlandı — ${emir.adet} adet ${emir.urunAd} (maliyet ${emir.toplamMaliyet.toFixed(2)} TL)`
    });
    // Çalışan listeden arşive taşı
    const i = this.v.emirler.findIndex((e) => e.id === emir.id);
    if (i >= 0) {
      this.v.emirler.splice(i, 1);
      this.v.emirlerArsiv.unshift(emir);
    }
    return emir;
  }

  gunlukUretimEkle(urunAd, adet) {
    const t = new Date();
    const gun = new Date(t.getFullYear(), t.getMonth(), t.getDate()).getTime();
    const kayit = this.v.gunlukUretim.find((g) => g.gun === gun && g.urunAd === urunAd);
    if (kayit) kayit.adet += adet;
    else this.v.gunlukUretim.push({ gun, urunAd, adet });
  }

  emirIptal(emirId, neden = 'Kullanıcı iptali') {
    const emir = this.emirlerArsivdeAra(emirId);
    if (!emir) throw new Hata(404, 'Üretim emri bulunamadı.');
    if (emir.durum === 'iptal') return { emir, mesaj: 'Zaten iptal edilmiş — ikinci kez işlenmedi (idempotan).' };
    if (emir.durum === 'tamamlandi') throw new Hata(409, 'Tamamlanmış emir iptal edilemez.');

    // Rezervasyonları serbest bırak (stok bu noktada henüz düşülmemişti)
    const serbest = emir.rezervasyon.map((r) => {
      const m = this.malzeme(r.malzemeId);
      return { malzemeId: m.id, ad: m.ad, miktar: r.miktar };
    });
    emir.durum = 'iptal';
    emir.iptalNedeni = neden;
    emir.rezervasyonSerbest = serbest;
    emir.rezervasyon = [];
    emir.gercekBitisMs = Date.now();
    emir.adimlar.forEach((a) => (a.durum = 'iptal'));

    const sip = this.v.siparisler.find((s) => s.id === emir.siparisId);
    if (sip) sip.durum = 'iptal';

    this.v.hareketler.push({
      id: this.db.hareketNoUret(),
      tarih: Date.now(),
      malzemeId: null,
      tip: 'iptal',
      miktar: 0,
      aciklama: `${emir.id} iptal edildi — rezervasyon serbest bırakıldı`
    });

    const i = this.v.emirler.findIndex((e) => e.id === emir.id);
    if (i >= 0) {
      this.v.emirler.splice(i, 1);
      this.v.emirlerArsiv.unshift(emir);
    }
    this.db.kaydet();
    return { emir, serbest };
  }

  // ---------- stok ----------
  hareketEkle({ malzemeId, tip, miktar, aciklama }) {
    const m = this.malzeme(malzemeId);
    const h = {
      id: this.db.hareketNoUret(),
      tarih: Date.now(),
      malzemeId,
      tip,
      miktar: round(miktar, 4),
      aciklama: aciklama || ''
    };
    this.v.hareketler.push(h);
    return h;
  }

  stokGirisi(malzemeId, miktar, aciklama) {
    const m = this.malzeme(malzemeId);
    if (!m) throw new Hata(404, 'Malzeme bulunamadı.');
    miktar = Number(miktar);
    if (!Number.isFinite(miktar) || miktar <= 0) throw new Hata(400, 'Miktar pozitif olmalı.');
    m.stok = round(m.stok + miktar, 4);
    const h = this.hareketEkle({ malzemeId, tip: 'giris', miktar, aciklama: aciklama || 'Hammadde girişi' });
    this.db.kaydet();
    return { malzeme: m, hareket: h };
  }

  stokCikisi(malzemeId, miktar, aciklama) {
    const m = this.malzeme(malzemeId);
    if (!m) throw new Hata(404, 'Malzeme bulunamadı.');
    miktar = Number(miktar);
    if (!Number.isFinite(miktar) || miktar <= 0) throw new Hata(400, 'Miktar pozitif olmalı.');
    const rezerve = this.rezerveHaritasi()[m.id] || 0;
    const kullanilabilir = round(m.stok - rezerve, 4);
    if (miktar > kullanilabilir + EPS) {
      throw new Hata(409, `Stok yetersiz — kullanılabilir ${kullanilabilir} ${m.birim} (rezerve ${rezerve}). Stok eksiye düşürülemez.`);
    }
    m.stok = round(m.stok - miktar, 4);
    const h = this.hareketEkle({ malzemeId, tip: 'cikis', miktar, aciklama: aciklama || 'Manuel stok çıkışı' });
    this.db.kaydet();
    return { malzeme: m, hareket: h };
  }

  /** Malzeme fiyatı güncelle — mevcut emirlerin maliyeti değişmez (planlama anında sabitlenir) */
  fiyatGuncelle(malzemeId, birimFiyat) {
    const m = this.malzeme(malzemeId);
    if (!m) throw new Hata(404, 'Malzeme bulunamadı.');
    birimFiyat = Number(birimFiyat);
    if (!Number.isFinite(birimFiyat) || birimFiyat < 0) throw new Hata(400, 'Fiyat geçersiz.');
    m.birimFiyat = round(birimFiyat);
    this.db.kaydet();
    return m;
  }

  /** Makine kapasitesi güncelle — çalışan emirlerin zaman planı değişmez */
  kapasiteGuncelle(istasyonId, kapasite) {
    const ist = this.istasyon(istasyonId);
    if (!ist) throw new Hata(404, 'İstasyon bulunamadı.');
    kapasite = Number(kapasite);
    if (!Number.isInteger(kapasite) || kapasite < 1 || kapasite > 20) throw new Hata(400, 'Kapasite 1-20 arası tam sayı olmalı.');
    ist.kapasite = kapasite;
    this.db.kaydet();
    return ist;
  }

  // ---------- özet ----------
  ozet() {
    const rezerve = this.rezerveHaritasi();
    const simdi = simTime(this.db);
    const aktif = this.v.emirler.filter((e) => e.durum === 'calisiyor' || e.durum === 'kuyrukta');
    const calisan = this.v.emirler.filter((e) => e.durum === 'calisiyor');
    const bugun = new Date();
    const gunBas = new Date(bugun.getFullYear(), bugun.getMonth(), bugun.getDate()).getTime();
    const gunluk = this.v.gunlukUretim
      .filter((g) => g.gun === gunBas)
      .reduce((t, g) => t + g.adet, 0);

    let toplamMaliyet = 0;
    let toplamSatis = 0;
    for (const s of this.v.siparisler) {
      if (s.durum === 'iptal') continue;
      toplamMaliyet += s.toplamMaliyet;
      toplamSatis += s.toplamTutar;
    }
    const tamamlananMaliyet = this.v.emirlerArsiv
      .filter((e) => e.durum === 'tamamlandi')
      .reduce((t, e) => t + e.toplamMaliyet, 0);
    const kritik = this.v.stok
      .map((m) => ({ ...m, kullanilabilir: round(m.stok - (rezerve[m.id] || 0), 4) }))
      .filter((m) => m.stok <= m.min);

    const takvim = this.takvim(gunBas, 14);

    return {
      simAyar: this.v.simAyar,
      olcu: {
        toplamSiparis: this.v.siparisler.filter((s) => s.durum !== 'iptal').length,
        aktifEmir: aktif.length,
        calisanEmir: calisan.length,
        gunlukUretim: gunluk,
        kritikStok: kritik.length,
        toplamMaliyet: round(toplamMaliyet),
        toplamSatis: round(toplamSatis),
        tahminiKar: round(toplamSatis - toplamMaliyet),
        tamamlananMaliyet: round(tamamlananMaliyet)
      },
      istasyonlar: this.v.istasyonlar.map((ist) => {
        const aktifAdim = [];
        for (const e of this.v.emirler) {
          for (const a of e.adimlar) {
            if (a.istasyonId === ist.id) aktifAdim.push({ emirId: e.id, durum: e.durum });
          }
        }
        // "Çalışıyor" sayısı kanalları doldurur; kuyrukta emirler ayrı sayılır
        const calisiyor = aktifAdim.filter((x) => x.durum === 'calisiyor').length;
        const kuyrukta = aktifAdim.filter((x) => x.durum === 'kuyrukta').length;
        // "Çalışan makine" = o istasyonda gerçekten çalışan emir var mı (kanal doluluğu değil)
        const calisiyorMu = this.v.emirler.some((e) => e.durum === 'calisiyor' && e.adimlar.some((a) => a.istasyonId === ist.id));
        return { ...ist, calisiyor, kuyrukta, calisiyorMu, doluluk: calisiyor ? 1 : 0 };
      }),
      takvim
    };
  }

  takvim(gunBas, gunSayisi) {
    const sonuc = [];
    const gunMs = 24 * 60 * 60 * 1000;
    for (let i = 0; i < gunSayisi; i++) {
      const gun = gunBas + i * gunMs;
      const uretim = this.v.gunlukUretim.filter((g) => g.gun === gun).reduce((t, g) => t + g.adet, 0);
      sonuc.push({ gun, uretim });
    }
    return sonuc;
  }

  // ---------- tam durum ----------
  durum() {
    const rezerve = this.rezerveHaritasi();
    return {
      stok: this.v.stok.map((m) => ({
        ...m,
        rezerve: rezerve[m.id] || 0,
        kullanilabilir: round(m.stok - (rezerve[m.id] || 0), 4),
        kritik: m.stok <= m.min
      })),
      urunler: this.v.urunler,
      istasyonlar: this.v.istasyonlar,
      siparisler: [...this.v.siparisler].reverse(),
      emirler: [...this.v.emirler].reverse().concat(this.v.emirlerArsiv.slice(0, 50)),
      hareketler: [...this.v.hareketler].reverse().slice(0, 80),
      simAyar: this.v.simAyar,
      simZaman: simTime(this.db),
      gercekZaman: Date.now(),
      ozet: this.ozet()
    };
  }
}

class Hata extends Error {
  constructor(kod, mesaj) {
    super(mesaj);
    this.status = kod;
  }
}

module.exports = { Motor, Hata, round, simTime, durumAdi };
