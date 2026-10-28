/* =========================================================
   NumexShop — Sepet motoru (saf mantık, sıfır bağımlılık)
   Kalıcılık: localStorage · Olay: CustomEvent("sepet:degisti")
   ========================================================= */
(function (global) {
  "use strict";

  var DEPO_ANAHTARI = "numexshop:sepet:v1";
  var KUPON_ANAHTARI = "numexshop:kupon:v1";

  /* satirlar: [{ id, adet }] — fiyat/stok her zaman veriden okunur (tek doğruluk kaynağı) */
  var durum = {
    satirlar: [],
    kuponKodu: ""
  };

  var V = global.NumexVeri;

  /* ---------------- Kalıcılık ---------------- */
  function yukle() {
    try {
      var ham = global.localStorage.getItem(DEPO_ANAHTARI);
      if (ham) {
        var veri = JSON.parse(ham);
        if (veri && Array.isArray(veri.satirlar)) {
          durum.satirlar = veri.satirlar
            .filter(function (s) { return s && V.urunBul(s.id); })
            .map(function (s) {
              return { id: s.id, adet: Math.max(1, Math.floor(Number(s.adet) || 1)) };
            });
        }
      }
      durum.kuponKodu = global.localStorage.getItem(KUPON_ANAHTARI) || "";
    } catch (e) {
      durum.satirlar = [];
      durum.kuponKodu = "";
    }
    stokKirp();
  }

  function kaydet() {
    try {
      global.localStorage.setItem(DEPO_ANAHTARI, JSON.stringify({ satirlar: durum.satirlar }));
      if (durum.kuponKodu) global.localStorage.setItem(KUPON_ANAHTARI, durum.kuponKodu);
      else global.localStorage.removeItem(KUPON_ANAHTARI);
    } catch (e) { /* kota dolu / gizli mod — sessizce devam */ }
  }

  /* Sepetteki adetler stok sınırını aşarsa kırp. */
  function stokKirp() {
    var degisti = false;
    durum.satirlar.forEach(function (s) {
      var urun = V.urunBul(s.id);
      var ust = urun ? urun.stok : 0;
      if (s.adet > ust) { s.adet = Math.max(1, ust); degisti = true; }
      if (ust <= 0) { s.adet = 0; degisti = true; }
    });
    durum.satirlar = durum.satirlar.filter(function (s) { return s.adet > 0; });
    return degisti;
  }

  /* ---------------- Yardımcılar ---------------- */
  /* Kartta/sepette gösterilecek stok durumu (sipariş öncesi rezerve dahil) */
  function kalanStok(id) {
    var urun = V.urunBul(id);
    if (!urun) return 0;
    return Math.max(0, urun.stok - adetGetir(id));
  }

  function satirBul(id) {
    for (var i = 0; i < durum.satirlar.length; i++) {
      if (durum.satirlar[i].id === id) return durum.satirlar[i];
    }
    return null;
  }

  function adetGetir(id) {
    var s = satirBul(id);
    return s ? s.adet : 0;
  }

  /* ---------------- Değişim bildirimi ---------------- */
  function yayinla(sebep) {
    kaydet();
    try {
      global.dispatchEvent(new CustomEvent("sepet:degisti", { detail: { sebep: sebep, ozet: ozet() } }));
    } catch (e) {
      /* CustomEvent desteklenmiyorsa sessiz geç */
    }
  }

  /* ---------------- İşlemler ---------------- */
  function ekle(id, adet) {
    adet = Math.max(1, Math.floor(Number(adet) || 1));
    var urun = V.urunBul(id);
    if (!urun) return { basarili: false, mesaj: "Ürün bulunamadı." };
    if (urun.stok <= 0) return { basarili: false, mesaj: urun.ad + " stokta yok." };

    var s = satirBul(id);
    var mevcut = s ? s.adet : 0;
    var istenen = mevcut + adet;

    if (istenen > urun.stok) {
      var eklenebilir = urun.stok - mevcut;
      if (eklenebilir <= 0) {
        return { basarili: false, mesaj: "Stok sınırı: " + urun.ad + " için en fazla " + urun.stok + " adet alabilirsin." };
      }
      s.adet = urun.stok;
      yayinla("stok-sinir");
      return { basarili: true, kismi: true, mesaj: "Stok kadar eklendi (" + eklenebilir + " adet kaldı sınırına)." };
    }

    if (s) s.adet = istenen;
    else durum.satirlar.push({ id: id, adet: adet });

    yayinla("ekle");
    return { basarili: true, mesaj: urun.ad + " sepete eklendi." };
  }

  function adetDegistir(id, yeniAdet) {
    yeniAdet = Math.floor(Number(yeniAdet) || 0);
    var urun = V.urunBul(id);
    var s = satirBul(id);
    if (!s || !urun) return { basarili: false, mesaj: "Sepette bu ürün yok." };

    if (yeniAdet <= 0) return sil(id);

    if (yeniAdet > urun.stok) {
      s.adet = urun.stok;
      yayinla("stok-sinir");
      return { basarili: false, mesaj: "Stokta en fazla " + urun.stok + " adet var." };
    }

    s.adet = yeniAdet;
    yayinla("adet");
    return { basarili: true };
  }

  function artir(id) { return adetDegistir(id, adetGetir(id) + 1); }
  function azalt(id) { return adetDegistir(id, adetGetir(id) - 1); }

  function sil(id) {
    var onceki = durum.satirlar.length;
    durum.satirlar = durum.satirlar.filter(function (s) { return s.id !== id; });
    if (durum.satirlar.length === onceki) return { basarili: false, mesaj: "Ürün sepette yok." };
    /* Sepet boşaldıysa kupon da düşsün (min. sepet şartı zaten tutmaz) */
    if (durum.satirlar.length === 0) durum.kuponKodu = "";
    yayinla("sil");
    return { basarili: true, mesaj: "Ürün sepetten çıkarıldı." };
  }

  function temizle() {
    durum.satirlar = [];
    durum.kuponKodu = "";
    yayinla("temizle");
    return { basarili: true, mesaj: "Sepet boşaltıldı." };
  }

  /* ---------------- Kupon ---------------- */
  function kuponUygula(kod) {
    var sonuc = V.kuponHesapla(kod, araToplam());
    if (!sonuc.gecerli) return sonuc;
    durum.kuponKodu = sonuc.kod;
    yayinla("kupon");
    return sonuc;
  }

  function kuponKaldir() {
    if (!durum.kuponKodu) return { basarili: false, mesaj: "Uygulanmış kupon yok." };
    durum.kuponKodu = "";
    yayinla("kupon-kaldir");
    return { basarili: true, mesaj: "Kupon kaldırıldı." };
  }

  /* ---------------- Hesaplamalar ---------------- */
  function araToplam() {
    return durum.satirlar.reduce(function (t, s) {
      var urun = V.urunBul(s.id);
      return t + (urun ? urun.fiyat * s.adet : 0);
    }, 0);
  }

  function toplamAdet() {
    return durum.satirlar.reduce(function (t, s) { return t + s.adet; }, 0);
  }

  /* Tüm sipariş matematiği TEK yerde: indirim, kargo, KDV, genel toplam. */
  function ozet() {
    var ara = araToplam();
    var indirim = 0;
    var kargoBedava = false;
    var kupon = null;

    if (durum.kuponKodu) {
      var h = V.kuponHesapla(durum.kuponKodu, ara);
      if (h.gecerli) {
        kupon = h;
        indirim = h.indirim;
        kargoBedava = h.kargoBedava;
      } else {
        /* Şart artık sağlanmıyorsa kuponu düşür */
        durum.kuponKodu = "";
      }
    }

    var indirimliAra = Math.max(0, ara - indirim);
    var kargo = 0;
    if (toplamAdet() > 0 && !kargoBedava && indirimliAra < V.KARGO_ESIK) kargo = V.KARGO_UCRETI;

    /* KDV, indirimli ara toplamın İÇİNDE gösterilir (bilgilendirme) */
    var kdv = indirimliAra - (indirimliAra / (1 + V.KDV_ORANI / 100));
    var genel = indirimliAra + kargo;

    return {
      kalemSayisi: durum.satirlar.length,
      adet: toplamAdet(),
      araToplam: ara,
      indirim: indirim,
      indirimliAra: indirimliAra,
      kargo: kargo,
      kargoBedava: kargoBedava,
      kargoEsikKalan: Math.max(0, V.KARGO_ESIK - indirimliAra),
      kdv: Math.round(kdv * 100) / 100,
      genelToplam: Math.round(genel * 100) / 100,
      kupon: kupon,
      kuponKodu: kupon ? kupon.kod : ""
    };
  }

  /* Sipariş tamamlandığında stokları düşürür (gerçek backend yerine). */
  function stokDus() {
    var dusenler = [];
    durum.satirlar.forEach(function (s) {
      var urun = V.urunBul(s.id);
      if (urun) {
        urun.stok = Math.max(0, urun.stok - s.adet);
        dusenler.push({ id: urun.id, ad: urun.ad, adet: s.adet, kalan: urun.stok });
      }
    });
    return dusenler;
  }

  /* Doğrulama: ödeme öncesi stok hâlâ yeterli mi? */
  function stokDogrula() {
    var eksikler = [];
    durum.satirlar.forEach(function (s) {
      var urun = V.urunBul(s.id);
      if (!urun) { eksikler.push({ id: s.id, mesaj: "Ürün artık satışta değil." }); return; }
      if (urun.stok < s.adet) {
        eksikler.push({ id: urun.id, mesaj: urun.ad + " için stok yetersiz (kalan: " + urun.stok + ")." });
      }
    });
    return eksikler;
  }

  function satirlariVer() {
    return durum.satirlar.map(function (s) {
      var urun = V.urunBul(s.id);
      return {
        id: s.id,
        adet: s.adet,
        ad: urun ? urun.ad : "Bilinmeyen ürün",
        ikon: urun ? urun.ikon : "❔",
        fiyat: urun ? urun.fiyat : 0,
        stok: urun ? urun.stok : 0,
        toplam: urun ? urun.fiyat * s.adet : 0
      };
    });
  }

  /* ---------------- Başlat ---------------- */
  yukle();

  global.NumexSepet = {
    durum: durum,
    ekle: ekle,
    artir: artir,
    azalt: azalt,
    adetDegistir: adetDegistir,
    sil: sil,
    temizle: temizle,
    adetGetir: adetGetir,
    kalanStok: kalanStok,
    kuponUygula: kuponUygula,
    kuponKaldir: kuponKaldir,
    araToplam: araToplam,
    toplamAdet: toplamAdet,
    ozet: ozet,
    stokDogrula: stokDogrula,
    stokDus: stokDus,
    satirlariVer: satirlariVer,
    yayinla: yayinla
  };
})(window);
