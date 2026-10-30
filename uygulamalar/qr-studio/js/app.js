/* Numex QR Studio — uygulama mantığı */
(function () {
  "use strict";

  var $ = function (s, k) { return (k || document).querySelector(s); };
  var $$ = function (s, k) { return Array.prototype.slice.call((k || document).querySelectorAll(s)); };

  /* ---------------- Tür tanımları ---------------- */

  var TURLER = [
    { id: "url", ad: "Bağlantı", ikon: "🔗" },
    { id: "metin", ad: "Metin", ikon: "📝" },
    { id: "tel", ad: "Telefon", ikon: "📞" },
    { id: "eposta", ad: "E-posta", ikon: "✉️" },
    { id: "wifi", ad: "Wi-Fi", ikon: "📶" }
  ];

  var SABLONLAR = NumexQR.SABLONLAR; // qr.js'te: ölçüm aracı (tools/dogrula.js) aynı listeyi okutur

  /* ---------------- Durum ---------------- */

  var durum = {
    tur: "url",
    still: "yuvarlak",
    renk1: "#0f172a",
    renk2: "#2563eb",
    yon: "capraz",
    zemin: "#ffffff",
    logo: "",
    logoBoyut: 0.2,
    kenar: 4,
    boyutPx: 1024,
    sonSvg: "",
    sonMetin: "",
    sonHata: "M"
  };

  /* ---------------- İçerik üretimi ---------------- */

  function alanDegeri(ad) {
    var el = $('[name="' + ad + '"]');
    return el ? el.value.trim() : "";
  }

  function wifiKacis(s) {
    return s.replace(/([\\;,:\"'])/g, "\\$1");
  }

  function icerikUret() {
    switch (durum.tur) {
      case "url": {
        var u = alanDegeri("url");
        if (!u) return { hata: "Bağlantı adresi gir." };
        if (!/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(u)) u = "https://" + u;
        return { metin: u };
      }
      case "metin": {
        var t = $('[name="metin"]').value;
        if (!t.trim()) return { hata: "Bir metin yaz." };
        return { metin: t };
      }
      case "tel": {
        var tel = alanDegeri("tel").replace(/\s+/g, "");
        if (!tel) return { hata: "Telefon numarası gir." };
        return { metin: "tel:" + tel };
      }
      case "eposta": {
        var adres = alanDegeri("eposta");
        if (!adres) return { hata: "E-posta adresi gir." };
        var konu = alanDegeri("epostaKonu");
        var govde = alanDegeri("epostaGovde");
        var q = [];
        if (konu) q.push("subject=" + encodeURIComponent(konu));
        if (govde) q.push("body=" + encodeURIComponent(govde));
        return { metin: "mailto:" + adres + (q.length ? "?" + q.join("&") : "") };
      }
      case "wifi": {
        var ssid = alanDegeri("wifiAd");
        if (!ssid) return { hata: "Ağ adını (SSID) gir." };
        var sifre = $('[name="wifiSifre"]').value;
        var guvenlik = alanDegeri("wifiGuvenlik") || "WPA";
        var gizli = $('[name="wifiGizli"]').checked ? "true" : "false";
        var parca = "WIFI:T:" + guvenlik + ";S:" + wifiKacis(ssid) + ";";
        if (guvenlik !== "nopass") parca += "P:" + wifiKacis(sifre) + ";";
        parca += "H:" + gizli + ";;";
        return { metin: parca };
      }
    }
    return { hata: "Tür seçilmedi." };
  }

  /* ---------------- Çizim ---------------- */

  var onizlemeKutusu = $("#onizlemeKutusu");
  var onizlemeSvg = $("#onizleme");
  var hataKutusu = $("#hataKutusu");
  var kontrastUyari = $("#kontrastUyari");
  var boyutEtiket = $("#boyutEtiket");
var durumCubugu = $("#durumCubugu");
  var icerikOnizleme = $("#icerikOnizleme");

  function ciz() {
    var sonuc = icerikUret();
    if (sonuc.hata) {
      hataKutusu.textContent = sonuc.hata;
      hataKutusu.hidden = false;
      return;
    }
    hataKutusu.hidden = true;

    // Logo varsa hata düzeltme seviyesi H, yoksa M (M standart, daha küçük kod üretir)
    var seviye = durum.logo ? "H" : "M";

    var m;
    try {
      m = NumexQR.matrisUret(sonuc.metin, seviye);
    } catch (e) {
      hataKutusu.textContent = "Metin QR kod için çok uzun. Kısaltmayı dene.";
      hataKutusu.hidden = false;
      return;
    }

    if (!NumexQR.matrisGecerliMi(m.matris, m.boyut)) {
      hataKutusu.textContent = "QR matrisi doğrulanamadı, metni kısaltıp tekrar dene.";
      hataKutusu.hidden = false;
      return;
    }

    var svg = NumexQR.svgUret({
      matris: m.matris,
      boyut: m.boyut,
      still: durum.still,
      renk1: durum.renk1,
      renk2: durum.renk2,
      gradyanYon: durum.yon,
      zeminRengi: durum.zemin,
      kenar: durum.kenar,
      logo: durum.logo,
      logoBoyut: durum.logoBoyut,
      boyutPx: 1024
    });

    durum.sonSvg = svg;
    durum.sonMetin = sonuc.metin;
    durum.sonHata = seviye;

    onizlemeSvg.innerHTML = svg.replace(/^<\?xml[^>]*\?>\s*/, "");
    onizlemeKutusu.classList.toggle("seffaf", !durum.zemin);
    boyutEtiket.textContent = m.boyut + "×" + m.boyut + " modül · " + seviye + " hata düzeltme";
    icerikOnizleme.textContent = sonuc.metin.length > 90 ? sonuc.metin.slice(0, 90) + "…" : sonuc.metin;

    var stilAdi = { kare: "Kare", yuvarlak: "Yuvarlatılmış", nokta: "Noktalı" }[durum.still] || durum.still;
    durumCubugu.textContent = m.boyut + "×" + m.boyut + " · " + seviye + " · " + stilAdi;

    // Kontrast: güzel görünen ama okutulamayan kodu önceden söyle (engellemez)
    var oran = NumexQR.enDusukKontrast(durum.renk1, durum.renk2, durum.zemin);
    var zayif = oran !== null && oran < NumexQR.KONTRAST_ESIK;
    kontrastUyari.hidden = !zayif;
    if (zayif) {
      kontrastUyari.textContent = "Kod rengi zeminden yeterince ayrışmıyor (kontrast " + oran.toFixed(1).replace(".", ",") +
        ", en az " + String(NumexQR.KONTRAST_ESIK).replace(".", ",") + " önerilir). Telefonlar okumakta zorlanabilir — " +
        (durum.renk2 ? "renklerden açık olanı" : "rengi") + " koyulaştır.";
    }
  }

  /* ---------------- İndirme ---------------- */

  function indir(blob, dosyaAdi) {
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = dosyaAdi;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1500);
  }

  function dosyaTabanAdi() {
    var t = new Date();
    var p = function (n) { return String(n).padStart(2, "0"); };
    return "numex-qr-" + t.getFullYear() + p(t.getMonth() + 1) + p(t.getDate()) + "-" + p(t.getHours()) + p(t.getMinutes());
  }

  function svgIndir() {
    if (!durum.sonSvg) { ciz(); if (!durum.sonSvg) return; }
    var svg = durum.sonSvg.replace(
      /width="\d+" height="\d+"/,
      'width="' + durum.boyutPx + '" height="' + durum.boyutPx + '"'
    );
    indir(new Blob([svg], { type: "image/svg+xml;charset=utf-8" }), dosyaTabanAdi() + ".svg");
    bildir("SVG indirildi · vektörel, baskıya hazır");
  }

  function pngIndir() {
    if (!durum.sonSvg) { ciz(); if (!durum.sonSvg) return; }
    var svg = durum.sonSvg.replace(
      /width="\d+" height="\d+"/,
      'width="' + durum.boyutPx + '" height="' + durum.boyutPx + '"'
    );
    NumexQR.pngUret(svg, durum.boyutPx).then(function (blob) {
      indir(blob, dosyaTabanAdi() + "-" + durum.boyutPx + "px.png");
      bildir("PNG indirildi · " + durum.boyutPx + "×" + durum.boyutPx + " px");
    }).catch(function (e) {
      console.error(e);
      bildir("PNG oluşturulamadı", true);
    });
  }

  function kopyala() {
    if (!durum.sonSvg) { ciz(); if (!durum.sonSvg) return; }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(durum.sonSvg).then(function () {
        bildir("SVG kodu panoya kopyalandı");
      }).catch(function () { bildir("Kopyalanamadı", true); });
    } else {
      bildir("Tarayıcı panoya yazmaya izin vermiyor", true);
    }
  }

  /* ---------------- Bildirim ---------------- */

  var bildirimZaman;
  function bildir(mesaj, hata) {
    var el = $("#bildirim");
    el.textContent = mesaj;
    el.classList.toggle("hata", !!hata);
    el.classList.add("gorunur");
    clearTimeout(bildirimZaman);
    bildirimZaman = setTimeout(function () { el.classList.remove("gorunur"); }, 2600);
  }

  /* ---------------- Sekmeler ---------------- */

  function turSec(id) {
    durum.tur = id;
    $$(".sekme").forEach(function (b) { b.classList.toggle("aktif", b.dataset.tur === id); });
    $$(".panel").forEach(function (p) { p.hidden = p.dataset.panel !== id; });
    ciz();
  }

  /* ---------------- Kontroller ---------------- */

  function kontrolKur() {
    // Sekmeler
    $$(".sekme").forEach(function (b) {
      b.addEventListener("click", function () { turSec(b.dataset.tur); });
    });

    // Tür içeriği değişince anında güncelle
    $("#formAlanlari").addEventListener("input", ciz);
    $("#formAlanlari").addEventListener("change", function (e) {
      if (e.target.name === "wifiGuvenlik") {
        $("#wifiSifreAlani").hidden = e.target.value === "nopass";
      }
      ciz();
    });

    // Stil (kare / yuvarlak / noktalı)
    $$("[data-still]").forEach(function (b) {
      b.addEventListener("click", function () {
        durum.still = b.dataset.still;
        $$("[data-still]").forEach(function (x) { x.classList.toggle("aktif", x === b); });
        ciz();
      });
    });

    // Renkler
    $("#renk1").addEventListener("input", function () {
      durum.renk1 = this.value;
      $("#renk1Deger").textContent = this.value.toUpperCase();
      ciz();
    });
    $("#renk2").addEventListener("input", function () {
      durum.renk2 = this.value;
      $("#renk2Deger").textContent = this.value.toUpperCase();
      ciz();
    });
    $("#gradyanKapat").addEventListener("change", function () {
      durum.renk2 = this.checked ? "" : $("#renk2").value;
      $("#renk2").disabled = this.checked;
      ciz();
    });
    $("#gradyanYon").addEventListener("change", function () {
      durum.yon = this.value;
      ciz();
    });

    // Zemin
    $$("[data-zemin]").forEach(function (b) {
      b.addEventListener("click", function () {
        durum.zemin = b.dataset.zemin;
        $$("[data-zemin]").forEach(function (x) { x.classList.toggle("aktif", x === b); });
        ciz();
      });
    });
    var zeminRenk = $("#zeminRenk");
    zeminRenk.addEventListener("input", function () {
      durum.zemin = this.value;
      $("#zeminRenkNokta rect").setAttribute("fill", this.value);
      $$("[data-zemin]").forEach(function (x) { x.classList.toggle("aktif", x.dataset.zemin === durum.zemin); });
      ciz();
    });

    // Logo
    $("#logoDosya").addEventListener("change", function (e) {
      var dosya = e.target.files && e.target.files[0];
      if (!dosya) return;
      if (dosya.size > 600 * 1024) { bildir("Logo 600 KB'tan küçük olmalı", true); return; }
      var okuyucu = new FileReader();
      okuyucu.onload = function () {
        durum.logo = okuyucu.result;
        $("#logoKaldir").hidden = false;
        $("#logoBilgi").textContent = dosya.name;
        ciz();
        bildir("Logo eklendi · hata düzeltme H'ye yükseltildi");
      };
      okuyucu.readAsDataURL(dosya);
    });
    $("#logoKaldir").addEventListener("click", function () {
      durum.logo = "";
      $("#logoDosya").value = "";
      $("#logoBilgi").textContent = "";
      $("#logoKaldir").hidden = true;
      ciz();
    });
    $("#logoBoyut").addEventListener("input", function () {
      durum.logoBoyut = Number(this.value) / 100;
      $("#logoBoyutDeger").textContent = this.value + "%";
      if (durum.logo) ciz();
    });

    // Kenar boşluğu ve çözünürlük
    $("#kenar").addEventListener("input", function () {
      durum.kenar = Number(this.value);
      $("#kenarDeger").textContent = this.value + " modül";
      ciz();
    });
    $("#cozunurluk").addEventListener("change", function () {
      durum.boyutPx = Number(this.value);
    });

    // Şablonlar
    $$("[data-sablon]").forEach(function (b) {
      b.addEventListener("click", function () {
        var s = SABLONLAR[Number(b.dataset.sablon)];
        durum.renk1 = s.renk1;
        durum.renk2 = s.renk2;
        durum.zemin = s.zemin;
        durum.still = s.still;
        durum.yon = s.yon;
        senkronizeEt();
        ciz();
        bildir("Şablon uygulandı: " + s.ad);
      });
    });

    // İndirme
    $("#svgIndir").addEventListener("click", svgIndir);
    $("#pngIndir").addEventListener("click", pngIndir);
    $("#kopyala").addEventListener("click", kopyala);
    $("#sifirla").addEventListener("click", function () {
      durum.still = "yuvarlak";
      durum.renk1 = "#0f172a";
      durum.renk2 = "#2563eb";
      durum.zemin = "#ffffff";
      durum.yon = "capraz";
      durum.logo = "";
      durum.kenar = 4;
      $("#logoBilgi").textContent = "";
      $("#logoKaldir").hidden = true;
      $("#logoDosya").value = "";
      senkronizeEt();
      ciz();
      bildir("Ayarlar sıfırlandı");
    });
  }

  // durum -> arayüz (şablon/sıfırlama sonrası)
  function senkronizeEt() {
    $("#renk1").value = durum.renk1;
    $("#renk1Deger").textContent = durum.renk1.toUpperCase();
    $("#renk2").value = durum.renk2 || "#2563eb";
    $("#renk2Deger").textContent = (durum.renk2 || "#2563eb").toUpperCase();
    $("#renk2").disabled = !durum.renk2;
    $("#gradyanKapat").checked = !durum.renk2;
    $("#gradyanYon").value = durum.yon;
    $("#kenar").value = durum.kenar;
    $("#kenarDeger").textContent = durum.kenar + " modül";
    $$("[data-still]").forEach(function (x) { x.classList.toggle("aktif", x.dataset.still === durum.still); });
    $$("[data-zemin]").forEach(function (x) { x.classList.toggle("aktif", x.dataset.zemin === durum.zemin); });
    if (durum.zemin) {
      $("#zeminRenk").value = durum.zemin;
      $("#zeminRenkNokta rect").setAttribute("fill", durum.zemin);
    }
  }

  /* ---------------- Başlat ---------------- */

  document.addEventListener("DOMContentLoaded", function () {
    // Şablon önizlemeleri
    $$("[data-sablon]").forEach(function (b, i) {
      var s = SABLONLAR[i];
      if (!s) return;
      if (!s.zemin) {
        // Zemin şeffaf şablonu: dama tahtası + desen (CSS'te tanımlı)
        b.classList.add("seffaf-ornek");
        return;
      }
      b.style.background = s.renk2
        ? "linear-gradient(135deg," + s.renk1 + "," + s.renk2 + ")"
        : s.renk1;
    });

    kontrolKur();
    $$("[data-still]").forEach(function (x) { x.classList.toggle("aktif", x.dataset.still === durum.still); });
    $$("[data-zemin]").forEach(function (x) { x.classList.toggle("aktif", x.dataset.zemin === durum.zemin); });
    turSec(durum.tur);

    // Test/otomasyon için küçük kanca
    window.__numexQR = { durum: durum, ciz: ciz, icerikUret: icerikUret };
  });
})();
