/*
 * NUMEX İPEK YOLU — Arayüz (DOM katmanı)
 * Ekonomiyi okur, çizer; karar vermez. Karar/eylem oyun.js'te.
 */
(function (kok) {
  "use strict";
  var E = kok.NumexEkonomi;

  var Arayuz = {};

  function el(id) { return document.getElementById(id); }
  function akce(n) { return Math.round(n).toLocaleString("tr-TR") + " akçe"; }
  function sayi(n, hane) {
    var h = hane == null ? 0 : hane;
    return Number(n).toLocaleString("tr-TR", { minimumFractionDigits: h, maximumFractionDigits: h });
  }
  function saatYazi(s) {
    var h = Math.floor(s), m = Math.floor((s - h) * 60);
    return (h < 10 ? "0" : "") + h + ":" + (m < 10 ? "0" : "") + m;
  }

  Arayuz.baslat = function (oyun) {
    Arayuz.oyun = oyun;
    el("hizGrubu").addEventListener("click", function (e) {
      var b = e.target.closest("[data-hiz]");
      if (!b) return;
      oyun.hizAyarla(Number(b.dataset.hiz));
    });
    el("kaydetBtn").addEventListener("click", function () { oyun.kaydet(); });
    el("yukleBtn").addEventListener("click", function () { oyun.yukle(); });
    el("yardimBtn").addEventListener("click", function () { oyun.perdeGoster("Nasıl oynanır", oyun.yardimMetni()); });
    el("perdeKapat").addEventListener("click", function () { el("perde").classList.add("gizli"); });

    // panel içi olay delegasyonu
    el("sehirListesi").addEventListener("click", function (e) {
      var b = e.target.closest("[data-sehir]");
      if (b) oyun.sehirSec(b.dataset.sehir);
    });
    el("kervanListesi").addEventListener("click", function (e) {
      var b = e.target.closest("[data-kervan]");
      if (b) oyun.kervanSec(b.dataset.kervan);
    });
    el("islemIcerik").addEventListener("click", function (e) {
      var t = e.target.closest("[data-eylem]");
      if (!t) return;
      var eylem = t.dataset.eylem;
      if (eylem === "al" || eylem === "sat") oyun.trade(eylem, t.dataset.urun, Number(t.dataset.miktar));
      else if (eylem === "git") oyun.rotaGit(el("hedefSec").value);
      else if (eylem === "yenikervan") oyun.yeniKervan();
      else if (eylem === "miktar") oyun.miktarAyarla(Number(t.dataset.miktar));
      else if (eylem === "hepsiniSat") oyun.hepsiniSat();
    });
    el("detayIcerik").addEventListener("click", function (e) {
      var t = e.target.closest("[data-eylem]");
      if (!t) return;
      if (t.dataset.eylem === "odak") oyun.kameraOdak(t.dataset.sehir);
      if (t.dataset.eylem === "yolDurum") oyun.yolBilgi(t.dataset.yol);
    });
  };

  Arayuz.ciz = function (sim, secim) {
    var i;
    // üst bar
    el("gunEtiket").textContent = sim.gun + ". Gün";
    el("saatEtiket").textContent = saatYazi(sim.saat);
    var ort = havaOzet(sim);
    el("havaEtiket").textContent = ort.ad + " · " + (sim.hiz === 0 ? "zaman durdu" : "akıyor");
    el("sermayeEtiket").textContent = akce(sim.oyuncu.sermaye);

    // hız butonları
    var btns = el("hizGrubu").querySelectorAll("[data-hiz]");
    for (i = 0; i < btns.length; i++) {
      btns[i].classList.toggle("secili", Number(btns[i].dataset.hiz) === secim.hizGoster);
    }

    cizSehirler(sim, secim);
    cizKervanlar(sim, secim);
    cizDetay(sim, secim);
    cizIslem(sim, secim);
    cizOlaylar(sim);
  };

  function havaOzet(sim) {
    var sayac = {};
    Object.keys(sim.sehirler).forEach(function (sid) {
      var h = sim.sehirler[sid].hava;
      sayac[h] = (sayac[h] || 0) + 1;
    });
    var en = "acik", enCok = 0;
    for (var k in sayac) if (sayac[k] > enCok) { en = k; enCok = sayac[k]; }
    return E.HAVA_HARITA[en] || { ad: "Açık" };
  }

  function cizSehirler(sim, secim) {
    var kutu = el("sehirListesi");
    var html = "";
    Object.keys(sim.sehirler).forEach(function (sid) {
      var s = sim.sehirler[sid];
      var hava = E.HAVA_HARITA[s.hava];
      var kriz = Object.keys(sim.yollar).some(function (i) { var y = sim.yollar[i]; return y.kapali && (y.a === sid || y.b === sid); });
      html += '<button class="sehir-kart' + (secim.sehir === sid ? " secili" : "") + '" data-sehir="' + sid + '">' +
        '<span class="ad"><span class="nokta' + (kriz ? " kriz" : "") + '"></span>' + s.ad + "</span>" +
        '<span class="alt"><span>' + sayi(s.nufus / 1000) + " bin kişi</span><span>" + hava.ad + "</span></span>" +
        "</button>";
    });
    kutu.innerHTML = html;
  }

  function cizKervanlar(sim, secim) {
    var kutu = el("kervanListesi");
    var oyuncuKervanlari = sim.kervanlar.filter(function (k) { return k.sahip === "oyuncu"; });
    var html = "";
    oyuncuKervanlari.forEach(function (k) {
      var durum = k.durum === "yolda" ? (sim.sehirler[k.hedef] ? sim.sehirler[k.hedef].ad + "'a gidiyor" : "yolda") : sim.sehirler[k.sehir].ad;
      var yuk = kervanYuk(k);
      html += '<button class="sehir-kart' + (secim.kervan === k.id ? " secili" : "") + '" data-kervan="' + k.id + '">' +
        '<span class="ad">' + k.ad + "</span>" +
        '<span class="alt"><span>' + durum + "</span><span>" + yuk + " birim yük</span></span>" +
        "</button>";
    });
    kutu.innerHTML = html;
  }

  function kervanYuk(k) {
    var t = 0;
    Object.keys(k.yuk || {}).forEach(function (uid) { t += k.yuk[uid] * (E.URUN_HARITA[uid] ? E.URUN_HARITA[uid].hacim : 1); });
    return Math.round(t);
  }

  function cizDetay(sim, secim) {
    var kutu = el("detayIcerik");
    if (secim.kervan) {
      var k = sim.kervanlar.filter(function (x) { return x.id === secim.kervan; })[0];
      if (k) { kutu.innerHTML = detayKervan(sim, k); return; }
    }
    var s = sim.sehirler[secim.sehir];
    if (!s) { kutu.innerHTML = '<p class="detay-alt">Bir şehir seç.</p>'; return; }

    var html = '<h2 class="detay-baslik">' + s.ad + "</h2>" +
      '<div class="detay-alt">' + s.cografi + " · " + sayi(s.nufus) + " kişi</div>" +
      '<div class="detay-alt">' + s.mimari + "</div>" +
      '<div class="detay-not">' + s.not + "</div>" +
      '<div class="detay-etiket">Pazar</div>' +
      '<table class="detay-sil"><tr><th class="sol">Ürün</th><th>Fiyat</th><th>Stok</th><th>Denge</th></tr>';

    E.URUNLER.forEach(function (u) {
      var fiyat = s.fiyat[u.id];
      var oran = fiyat / u.taban;
      var sinif = oran > 1.25 ? "fiyat-yuksek" : (oran < 0.85 ? "fiyat-dusuk" : "");
      var denge = s.uretimCanli[u.id] - s.tuketimSaat[u.id];
      var dengeYazi = (denge >= 0 ? "+" : "") + sayi(denge, 1) + "/sa";
      html += "<tr><td class=\"sol\"><span class=\"urun-nokta\" style=\"background:" + u.renk + "\"></span>" + u.ad + "</td>" +
        '<td class="' + sinif + '">' + sayi(fiyat, 2) + "</td>" +
        "<td>" + sayi(s.stok[u.id]) + "</td>" +
        "<td>" + dengeYazi + "</td></tr>";
    });
    html += "</table>";

    // şehre bağlı yollar
    html += '<div class="detay-etiket">Yollar</div>';
    sim.yollar.forEach(function (y) {
      if (y.a !== s.id && y.b !== s.id) return;
      var diger = y.a === s.id ? y.b : y.a;
      var durum = y.kapali ? '<span class="fiyat-yuksek">kapalı — ' + (y.kapanmaNeden || "") + "</span>" :
        "güvenlik %" + Math.round(y.guvenlik * 100);
      html += '<div class="etiket-satir"><span class="k">' + sim.sehirler[diger].ad + " · " + y.km + ' km</span><span class="v">' + durum + "</span></div>";
    });

    html += '<div class="detay-etiket">Üretim / tüketim</div>';
    E.URUNLER.forEach(function (u) {
      var uretim = s.uretimSaat[u.id] || 0;
      if (uretim <= 0) return;
      html += '<div class="etiket-satir"><span class="k">' + u.ad + '</span><span class="v">' + sayi(uretim, 1) + " birim/sa üretim</span></div>";
    });
    html += '<div style="margin-top:10px"><button class="mini-btn" data-eylem="odak" data-sehir="' + s.id + '">Kamerayı buraya getir</button></div>';
    kutu.innerHTML = html;
  }

  function detayKervan(sim, k) {
    var html = '<h2 class="detay-baslik">' + k.ad + "</h2>";
    var konum = k.durum === "yolda" ? (sim.sehirler[k.hedef] ? sim.sehirler[k.hedef].ad + " yolunda" : "yolda") : sim.sehirler[k.sehir].ad + "'da";
    html += '<div class="detay-alt">' + konum + " · taşıma kapasitesi " + k.kapasite + " birim</div>";
    if (k.durum === "yolda") {
      html += '<div class="detay-not">Kalan yol: ' + Math.round(k.kalanKm) + " km — varışa yaklaşık " + Math.round(k.kalanKm / (k.hiz * 0.8)) + " saat.</div>";
    }
    html += '<div class="detay-etiket">Yük</div>';
    var bos = true;
    Object.keys(k.yuk || {}).forEach(function (uid) {
      var m = k.yuk[uid];
      if (!m) return;
      bos = false;
      var u = E.URUN_HARITA[uid];
      html += '<div class="etiket-satir"><span class="k"><span class="urun-nokta" style="background:' + u.renk + '"></span> ' + u.ad + "</span><span class=\"v\">" + m + " birim</span></div>";
    });
    if (bos) html += '<div class="detay-alt">Kervan boş. Aşağıdaki panelden mal alabilirsin.</div>';
    html += '<div class="detay-etiket">Defter</div>' +
      '<div class="etiket-satir"><span class="k">Sermaye</span><span class="v">' + akce(sim.oyuncu.sermaye) + "</span></div>" +
      '<div class="etiket-satir"><span class="k">Toplam gelir</span><span class="v">' + akce(sim.oyuncu.gelir) + "</span></div>" +
      '<div class="etiket-satir"><span class="k">Toplam harcama</span><span class="v">' + akce(sim.oyuncu.harcama) + "</span></div>" +
      '<div class="etiket-satir"><span class="k">Net kâr</span><span class="v">' + akce(sim.oyuncu.sermaye - 3000) + "</span></div>";
    return html;
  }

  function cizIslem(sim, secim) {
    var kutu = el("islemIcerik");
    var k = sim.kervanlar.filter(function (x) { return x.id === secim.kervan && x.sahip === "oyuncu"; })[0];
    if (!k) {
      k = sim.kervanlar.filter(function (x) { return x.sahip === "oyuncu"; })[0];
      if (k) secim.kervan = k.id;
    }
    if (!k) {
      kutu.innerHTML = '<div class="islem-baslik">Kervanın yok</div>' +
        '<button class="eylem-btn" data-eylem="yenikervan">Yeni kervan satın al (1.800 akçe)</button>';
      return;
    }
    if (k.durum === "yolda") {
      kutu.innerHTML = '<div class="islem-baslik">' + k.ad + " yolda</div>" +
        '<div class="islem-kirilim"><span>' + (sim.sehirler[k.hedef] ? sim.sehirler[k.hedef].ad : "hedef") + " · kalan " + Math.round(k.kalanKm) + " km</span>" +
        '<div class="yuk-liste">' + yukEtiketleri(k) + "</div></div>";
      return;
    }
    var s = sim.sehirler[k.sehir];
    var html = '<div class="islem-kirilim"><span class="islem-baslik">' + k.ad + " · " + s.ad + "</span>" +
      '<span class="islem-baslik">Miktar:</span>' + [10, 25, 50].map(function (m) {
        return '<button class="adet-btn" data-eylem="miktar" data-miktar="' + m + '">' + m + "</button>";
      }).join("") +
      '<span class="islem-baslik" style="margin-left:6px">Adet: ' + (oyunMiktar()) + "</span></div>";

    html += '<div class="islem-kirilim">';
    E.URUNLER.forEach(function (u) {
      var fiyat = s.fiyat[u.id];
      var stok = Math.floor(s.stok[u.id]);
      var miktar = oyunMiktar();
      html += '<div class="islem-kart">' +
        '<span class="ad"><span class="urun-nokta" style="background:' + u.renk + '"></span> ' + u.ad + "</span>" +
        '<span class="fiyat">' + sayi(fiyat, 2) + "</span>" +
        '<span class="stok">' + sayi(stok) + " adet</span>" +
        '<button class="adet-btn" data-eylem="al" data-urun="' + u.id + '" data-miktar="' + miktar + '" title="Al">Al</button>' +
        '<button class="adet-btn" data-eylem="sat" data-urun="' + u.id + '" data-miktar="' + miktar + '" title="Sat">Sat</button>' +
        "</div>";
    });
    html += "</div>";

    // rota seçimi
    var uygun = [];
    Object.keys(sim.sehirler).forEach(function (sid) {
      if (sid === k.sehir) return;
      var r = sim.rota(k.sehir, sid);
      if (r) uygun.push({ sid: sid, r: r });
    });
    var opts = uygun.map(function (o) {
      var nakliye = k.yuk && Object.keys(k.yuk).length ? 0 : 0;
      return '<option value="' + o.sid + '">' + sim.sehirler[o.sid].ad + " · " + o.r.km + " km" + (o.r.sehirler.length > 2 ? " (aktarmalı)" : "") + "</option>";
    }).join("");

    html += '<div class="islem-kirilim" style="margin-top:4px">' +
      '<span class="islem-baslik">Rota:</span>' +
      '<select id="hedefSec">' + opts + "</select>" +
      '<button class="eylem-btn" data-eylem="git">Kervanı yola çıkar</button>' +
      '<button class="eylem-btn yumusak" data-eylem="hepsiniSat">Yükün hepsini sat</button>' +
      '<span class="islem-baslik" style="margin-left:auto">Sermaye: ' + akce(sim.oyuncu.sermaye) + " · Kervan sayısı: " + sim.oyuncu.kervanSayisi + "</span>" +
      "</div>";
    if (uygun.length && uygun.every(function (o) { return o.r.sehirler.length > 2; })) {
      html += '<div class="islem-kirilim"><span class="fiyat-yuksek">Doğrudan yol kapalı — kervan aktarmalı gidecek, süre ve maliyet arttı.</span></div>';
    }
    kutu.innerHTML = html;
  }

  var _miktar = 10;
  function oyunMiktar() { return _miktar; }
  Arayuz.miktarAyarla = function (m) { _miktar = m; };
  Arayuz.miktar = function () { return _miktar; };

  function yukEtiketleri(k) {
    var html = "";
    Object.keys(k.yuk || {}).forEach(function (uid) {
      var m = k.yuk[uid];
      if (!m) return;
      var u = E.URUN_HARITA[uid];
      html += '<span class="yuk-etiket"><span class="urun-nokta" style="background:' + u.renk + '"></span> ' + u.ad + " × " + m + "</span>";
    });
    return html || '<span class="yuk-etiket">boş</span>';
  }

  function cizOlaylar(sim) {
    var kutu = el("olayListesi");
    var html = "";
    sim.olaylar.slice(0, 14).forEach(function (o) {
      html += '<div class="olay ' + (o.seviye || "bilgi") + '">' +
        '<span class="zaman">' + o.gun + ". gün " + saatYazi(o.saat) + "</span>" +
        '<span class="t">' + o.baslik + "</span>" + o.aciklama + "</div>";
    });
    kutu.innerHTML = html || '<div class="olay">Henüz olay yok.</div>';
  }

  Arayuz.akce = akce;
  Arayuz.sayi = sayi;
  kok.Arayuz = Arayuz;
})(typeof globalThis !== "undefined" ? globalThis : this);
