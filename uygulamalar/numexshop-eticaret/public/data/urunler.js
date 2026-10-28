/* =========================================================
   NumexShop — Ürün verisi (sahte "backend")
   Saf JS: bu dosya tek gerçek veri kaynağıdır.
   ========================================================= */
(function (global) {
  "use strict";

  var KATEGORILER = [
    { id: "tumu",       ad: "Tümü" },
    { id: "elektronik", ad: "Elektronik" },
    { id: "ev",         ad: "Ev & Yaşam" },
    { id: "spor",       ad: "Spor" },
    { id: "kitap",      ad: "Kitap" },
    { id: "kozmetik",   ad: "Kozmetik" }
  ];

  var URUNLER = [
    {
      id: "p-001",
      ad: "Kablosuz Kulaklık Pro",
      kategori: "elektronik",
      ikon: "🎧",
      aciklama: "Aktif gürültü engelleme, 36 saat pil ömrü, şarj kutusu dahil.",
      fiyat: 2499,
      eskiFiyat: 3199,
      stok: 14,
      puan: 4.8,
      yorum: 214,
      etiket: "Çok Satan"
    },
    {
      id: "p-002",
      ad: "Mekanik Klavye TKL",
      kategori: "elektronik",
      ikon: "⌨️",
      aciklama: "Hot-swap switch, RGB aydınlatma, alüminyum gövde, Türkçe Q dizilim.",
      fiyat: 1875,
      eskiFiyat: 0,
      stok: 7,
      puan: 4.6,
      yorum: 98,
      etiket: ""
    },
    {
      id: "p-003",
      ad: "Taşınabilir Şarj 20.000 mAh",
      kategori: "elektronik",
      ikon: "🔋",
      aciklama: "65W hızlı şarj, 3 çıkış, dizüstü bilgisayarı da besler.",
      fiyat: 1149,
      eskiFiyat: 1399,
      stok: 0,
      puan: 4.4,
      yorum: 65,
      etiket: ""
    },
    {
      id: "p-004",
      ad: "Akıllı Saat Fit 3",
      kategori: "elektronik",
      ikon: "⌚",
      aciklama: "AMOLED ekran, SpO2 ve uyku takibi, 5 ATM su direnci.",
      fiyat: 3299,
      eskiFiyat: 0,
      stok: 21,
      puan: 4.7,
      yorum: 312,
      etiket: "Yeni"
    },
    {
      id: "p-005",
      ad: "Zeytinyağı Sabunu (4'lü)",
      kategori: "kozmetik",
      ikon: "🧼",
      aciklama: "Soğuk sıkım zeytinyağı, paraben ve sülfat içermez.",
      fiyat: 289,
      eskiFiyat: 0,
      stok: 120,
      puan: 4.9,
      yorum: 187,
      etiket: ""
    },
    {
      id: "p-006",
      ad: "Cilt Bakım Seti",
      kategori: "kozmetik",
      ikon: "🧴",
      aciklama: "Temizleyici, tonik ve nemlendirici — karma cilt için.",
      fiyat: 749,
      eskiFiyat: 999,
      stok: 34,
      puan: 4.3,
      yorum: 142,
      etiket: "İndirim"
    },
    {
      id: "p-007",
      ad: "El Yapımı Seramik Kupa",
      kategori: "ev",
      ikon: "☕",
      aciklama: "350 ml, bulaşık makinesinde yıkanabilir, kurşunsuz sır.",
      fiyat: 349,
      eskiFiyat: 0,
      stok: 46,
      puan: 4.5,
      yorum: 88,
      etiket: ""
    },
    {
      id: "p-008",
      ad: "Yoga Matı 8 mm",
      kategori: "spor",
      ikon: "🧘",
      aciklama: "Kaymaz yüzey, taşıma kayışı dahil, TPE malzeme.",
      fiyat: 699,
      eskiFiyat: 899,
      stok: 3,
      puan: 4.4,
      yorum: 156,
      etiket: ""
    },
    {
      id: "p-009",
      ad: "Dambıl Seti 20 kg",
      kategori: "spor",
      ikon: "🏋️",
      aciklama: "Kaplamalı plakalar, kilitli ağırlık barı, krom kaplama.",
      fiyat: 4599,
      eskiFiyat: 5299,
      stok: 5,
      puan: 4.6,
      yorum: 41,
      etiket: "İndirim"
    },
    {
      id: "p-010",
      ad: "Numex'e Göre Yazılım",
      kategori: "kitap",
      ikon: "📕",
      aciklama: "Saf mantıkla yazılım tasarımı: 320 sayfa, 2. baskı.",
      fiyat: 429,
      eskiFiyat: 0,
      stok: 62,
      puan: 4.8,
      yorum: 203,
      etiket: ""
    },
    {
      id: "p-011",
      ad: "Masa Lambası LED",
      kategori: "ev",
      ikon: "💡",
      aciklama: "Kademeli parlaklık, USB çıkışlı, göz yormayan ışık.",
      fiyat: 849,
      eskiFiyat: 1099,
      stok: 18,
      puan: 4.2,
      yorum: 74,
      etiket: ""
    },
    {
      id: "p-012",
      ad: "Koşu Ayakkabısı Air",
      kategori: "spor",
      ikon: "👟",
      aciklama: "Nefes alan file üst, jel destekli taban, 285 g (42 numara).",
      fiyat: 2149,
      eskiFiyat: 2799,
      stok: 9,
      puan: 4.7,
      yorum: 265,
      etiket: "Çok Satan"
    }
  ];

  /* KDV oranı (%) */
  var KDV_ORANI = 20;
  /* Kargo ücreti (₺) — 750 TL üzeri bedava */
  var KARGO_UCRETI = 79;
  var KARGO_ESIK = 750;

  /* ---------------- Kupon motoru ---------------- */
  var KUPONLAR = {
    NUMEX10:      { tip: "yuzde",    deger: 10, minSepet: 500,  aciklama: "Sepette %10 indirim (min. 500 TL)" },
    HOSGELDIN15:  { tip: "yuzde",    deger: 15, minSepet: 1500, aciklama: "Sepette %15 indirim (min. 1500 TL)" },
    KARGOBEDAVA:  { tip: "kargo",    deger: 0,  minSepet: 0,    aciklama: "Kargo ücretsiz" },
    ELLI:         { tip: "sabit",    deger: 50, minSepet: 300,  aciklama: "300 TL üzeri 50 TL indirim" }
  };

  /* Uygulanan kuponu sepet toplamlarına göre hesaplar. */
  function kuponHesapla(kod, araToplam) {
    var anahtar = String(kod || "").trim().toUpperCase();
    if (!anahtar) return { gecerli: false, mesaj: "Kupon kodu gir." };
    var kupon = KUPONLAR[anahtar];
    if (!kupon) return { gecerli: false, mesaj: "\"" + anahtar + "\" diye bir kupon yok." };
    if (araToplam < kupon.minSepet) {
      return {
        gecerli: false,
        mesaj: "Bu kupon için en az " + paraBicim(kupon.minSepet) + " sepet gerekiyor."
      };
    }
    var indirim = 0;
    var kargoBedava = false;
    if (kupon.tip === "yuzde") indirim = araToplam * (kupon.deger / 100);
    else if (kupon.tip === "sabit") indirim = Math.min(kupon.deger, araToplam);
    else if (kupon.tip === "kargo") kargoBedava = true;

    indirim = Math.round(indirim * 100) / 100;
    return {
      gecerli: true,
      kod: anahtar,
      tip: kupon.tip,
      aciklama: kupon.aciklama,
      indirim: indirim,
      kargoBedava: kargoBedava,
      mesaj: "Kupon uygulandı: " + kupon.aciklama
    };
  }

  function paraBicim(sayi) {
    var n = Number(sayi) || 0;
    return "₺" + n.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function urunBul(id) {
    for (var i = 0; i < URUNLER.length; i++) {
      if (URUNLER[i].id === id) return URUNLER[i];
    }
    return null;
  }

  global.NumexVeri = {
    KATEGORILER: KATEGORILER,
    URUNLER: URUNLER,
    KUPONLAR: KUPONLAR,
    KDV_ORANI: KDV_ORANI,
    KARGO_UCRETI: KARGO_UCRETI,
    KARGO_ESIK: KARGO_ESIK,
    kuponHesapla: kuponHesapla,
    paraBicim: paraBicim,
    urunBul: urunBul
  };
})(window);
