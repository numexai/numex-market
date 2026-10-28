/* =========================================================
   NumexShop — Ödeme katmanı (saf mantık validasyon + sipariş)
   Gerçek ödeme YOK: kart bilgisi hiçbir yere gönderilmez.
   ========================================================= */
(function (global) {
  "use strict";

  var SIPARIS_DEPO = "numexshop:siparisler:v1";

  /* ---------------- Alan doğrulayıcılar ---------------- */
  var kurallar = {
    ad: function (v) {
      var t = v.trim();
      if (t.length < 3) return "Ad soyad en az 3 karakter olmalı.";
      if (t.indexOf(" ") === -1) return "Hem ad hem soyad gir.";
      if (/\d/.test(t)) return "Ad soyad sayı içermemeli.";
      return "";
    },
    eposta: function (v) {
      var t = v.trim();
      if (!t) return "E-posta gerekli.";
      if (!/^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/.test(t)) return "Geçerli bir e-posta gir (ornek@site.com).";
      return "";
    },
    telefon: function (v) {
      var rakam = v.replace(/\D/g, "");
      if (rakam.length === 10 && rakam.charAt(0) === "5") return "";           /* 5XXXXXXXXX */
      if (rakam.length === 11 && rakam.charAt(0) === "0") return "";          /* 05XXXXXXXXX */
      if (rakam.length === 12 && rakam.indexOf("90") === 0) return "";        /* 905XXXXXXXXX */
      return "Telefon 10-11 haneli olmalı (05XX XXX XX XX).";
    },
    adres: function (v) {
      var t = v.trim();
      if (t.length < 10) return "Adres en az 10 karakter olmalı.";
      if (!/\d/.test(t)) return "Adreste kapı/bina numarası bulunmalı.";
      return "";
    },
    kartno: function (v) {
      var rakam = v.replace(/\D/g, "");
      if (rakam.length < 15 || rakam.length > 16) return "Kart numarası 15-16 haneli olmalı.";
      if (!luhnGecerli(rakam)) return "Kart numarası geçersiz (Luhn kontrolü).";
      return "";
    },
    sonkullanma: function (v) {
      var t = v.trim().replace(/\s/g, "");
      var m = t.match(/^(\d{2})\s*\/?\s*(\d{2})$/);
      if (!m) return "AA/YY biçiminde gir (ör. 09/28).";
      var ay = parseInt(m[1], 10);
      var yil = 2000 + parseInt(m[2], 10);
      if (ay < 1 || ay > 12) return "Ay 01 ile 12 arasında olmalı.";
      var simdi = new Date();
      /* Kart, içinde bulunduğumuz ayın son gününe kadar geçerlidir. */
      var sonGun = new Date(yil, ay, 1);
      if (sonGun <= simdi) return "Kartın süresi dolmuş.";
      if (yil > simdi.getFullYear() + 20) return "Yıl çok ileride görünüyor.";
      return "";
    },
    cvv: function (v) {
      var rakam = v.replace(/\D/g, "");
      if (rakam.length < 3 || rakam.length > 4) return "CVV 3-4 haneli olmalı.";
      return "";
    }
  };

  /* Luhn (mod 10) algoritması — kart numarası kontrol basamağı */
  function luhnGecerli(rakam) {
    var toplam = 0;
    var cift = false;
    for (var i = rakam.length - 1; i >= 0; i--) {
      var n = parseInt(rakam.charAt(i), 10);
      if (isNaN(n)) return false;
      if (cift) {
        n *= 2;
        if (n > 9) n -= 9;
      }
      toplam += n;
      cift = !cift;
    }
    return toplam % 10 === 0;
  }

  /* Kart markası — yalnızca görsel ipucu */
  function kartMarkasi(rakam) {
    if (/^4/.test(rakam)) return "Visa";
    if (/^(5[1-5]|2[2-7])/.test(rakam)) return "Mastercard";
    if (/^3[47]/.test(rakam)) return "Amex";
    if (/^9/.test(rakam)) return "Troy";
    return "";
  }

  function tekAlanDogrula(alan, deger) {
    var f = kurallar[alan];
    return f ? f(String(deger || "")) : "";
  }

  /* Tüm adımı doğrular → { gecerli, hatalar: {alan: mesaj} } */
  function adimDogrula(adim, veri) {
    var alanlar = adim === 1 ? ["ad", "eposta", "telefon", "adres"] : ["kartno", "sonkullanma", "cvv"];
    var hatalar = {};
    var gecerli = true;
    alanlar.forEach(function (a) {
      var h = tekAlanDogrula(a, veri[a]);
      if (h) { hatalar[a] = h; gecerli = false; }
    });
    return { gecerli: gecerli, hatalar: hatalar };
  }

  /* ---------------- Biçimlendirme (input maskesi) ---------------- */
  function kartBicimle(deger) {
    var rakam = String(deger).replace(/\D/g, "").slice(0, 16);
    return rakam.replace(/(.{4})/g, "$1 ").trim();
  }

  function sonKullanmaBicimle(deger) {
    var rakam = String(deger).replace(/\D/g, "").slice(0, 4);
    if (rakam.length <= 2) return rakam;
    return rakam.slice(0, 2) + "/" + rakam.slice(2);
  }

  function telefonBicimle(deger) {
    var rakam = String(deger).replace(/\D/g, "").slice(0, 11);
    if (rakam.length <= 4) return rakam;
    if (rakam.length <= 7) return rakam.slice(0, 4) + " " + rakam.slice(4);
    if (rakam.length <= 9) return rakam.slice(0, 4) + " " + rakam.slice(4, 7) + " " + rakam.slice(7);
    return rakam.slice(0, 4) + " " + rakam.slice(4, 7) + " " + rakam.slice(7, 9) + " " + rakam.slice(9);
  }

  /* ---------------- Sipariş ---------------- */
  function siparisKoduUret() {
    var harfler = "ABCDEFGHJKLMNPRSTUVYZ";
    var kod = "NX-";
    for (var i = 0; i < 4; i++) kod += harfler.charAt(Math.floor(Math.random() * harfler.length));
    kod += "-";
    for (var j = 0; j < 4; j++) kod += Math.floor(Math.random() * 10);
    return kod;
  }

  /* Maskeli kart: yalnız son 4 hane saklanır. */
  function kartMaskele(kartno) {
    var rakam = String(kartno).replace(/\D/g, "");
    return "•••• •••• •••• " + rakam.slice(-4);
  }

  function siparisOlustur(form, sepetOzet, satirlar, musteri) {
    var siparis = {
      kod: siparisKoduUret(),
      tarih: new Date().toISOString(),
      musteri: {
        ad: form.ad.trim(),
        eposta: form.eposta.trim().toLowerCase(),
        telefon: form.telefon.trim(),
        adres: form.adres.trim()
      },
      kart: kartMaskele(form.kartno),
      kartMarka: kartMarkasi(String(form.kartno).replace(/\D/g, "")),
      urunler: satirlar.map(function (s) {
        return { id: s.id, ad: s.ad, adet: s.adet, fiyat: s.fiyat, toplam: s.toplam };
      }),
      araToplam: sepetOzet.araToplam,
      indirim: sepetOzet.indirim,
      kuponKodu: sepetOzet.kuponKodu || "",
      kargo: sepetOzet.kargo,
      kdv: sepetOzet.kdv,
      genelToplam: sepetOzet.genelToplam,
      durum: "Hazırlanıyor",
      tahminiTeslim: tahminiTeslim()
    };
    return siparis;
  }

  function tahminiTeslim() {
    var d = new Date();
    d.setDate(d.getDate() + 3);
    return d.toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });
  }

  function siparisKaydet(siparis, dusenStoklar) {
    var liste = siparisleriVer();
    liste.unshift(siparis);
    if (liste.length > 50) liste = liste.slice(0, 50);
    try {
      global.localStorage.setItem(SIPARIS_DEPO, JSON.stringify(liste));
    } catch (e) { /* depolama yoksa geçici olarak devam */ }
    siparis.stokDurumu = dusenStoklar || [];
    return siparis;
  }

  function siparisleriVer() {
    try {
      var ham = global.localStorage.getItem(SIPARIS_DEPO);
      var liste = ham ? JSON.parse(ham) : [];
      return Array.isArray(liste) ? liste : [];
    } catch (e) {
      return [];
    }
  }

  global.NumexOdeme = {
    kurallar: kurallar,
    luhnGecerli: luhnGecerli,
    kartMarkasi: kartMarkasi,
    tekAlanDogrula: tekAlanDogrula,
    adimDogrula: adimDogrula,
    kartBicimle: kartBicimle,
    sonKullanmaBicimle: sonKullanmaBicimle,
    telefonBicimle: telefonBicimle,
    siparisOlustur: siparisOlustur,
    siparisKaydet: siparisKaydet,
    siparisleriVer: siparisleriVer,
    kartMaskele: kartMaskele
  };
})(window);
