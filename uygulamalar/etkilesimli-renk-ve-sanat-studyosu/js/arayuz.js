/* Numex Renk Stüdyosu — DOM bağlama, olaylar, render */
(function (kok) {
  "use strict";
  var R = kok.RenkMotoru, D = kok.Durum, P = kok.Palet, G = kok.Gradyan, S = kok.Sanat, X = kok.DisaAktar;

  var el = {};
  var seciliIndeks = 0;
  var seciliDurak = 0;
  var bildirimZaman = null;
  var tuval = { ciz: null, ctx: null, noktalar: [], aktifNokta: -1, fare: { x: 0.5, y: 0.5 } };

  var TEMALAR = [
    { ad: "Gün Batımı", not: "sıcak", renkler: ["#2b1055", "#7f2b6b", "#e0492f", "#ff8a3d", "#ffd166"] },
    { ad: "Okyanus", not: "derin", renkler: ["#012a4a", "#01497c", "#2a9d8f", "#5fd0c5", "#c9f2ea"] },
    { ad: "Kozmik Gece", not: "gizemli", renkler: ["#0b032d", "#3a0ca3", "#7209b7", "#4cc9f0", "#f1f1ff"] },
    { ad: "Osmanlı Altın", not: "klasik", renkler: ["#3b0a0a", "#7a1f1f", "#b8860b", "#e6c15a", "#f8ecc2"] },
    { ad: "Neon Şehir", not: "elektrik", renkler: ["#07000f", "#ff006e", "#fb5607", "#8338ec", "#3a86ff"] },
    { ad: "Bahar Bahçesi", not: "taze", renkler: ["#1b4332", "#2d6a4f", "#74c69d", "#ffc8dd", "#ffe066"] }
  ];

  var KURAL_ACIKLAMA = {
    analog: "Analog uyum — renk çemberinde komşu tonlar",
    tamamlayici: "Tamamlayıcı — çemberin karşıt tonu (h+180°)",
    uclu: "Üçlü uyum — 120° aralıklı üç ton",
    dortlu: "Dörtlü uyum — 90° aralıklı dört ton",
    monokrom: "Monokrom — tek tonun açık/koyu skalası",
    rastgele: "Rastgele — sürpriz palet"
  };

  function $(id) { return document.getElementById(id); }
  function qsa(sec) { return Array.prototype.slice.call(document.querySelectorAll(sec)); }
  function sayi(n, b) { return Number(n).toFixed(typeof b === "number" ? b : 1); }

  /* ---------------- bildirim ---------------- */
  function bildirim(mesaj) {
    var b = el.bildirim;
    if (!b) return;
    b.textContent = mesaj;
    b.classList.add("goster");
    if (bildirimZaman) clearTimeout(bildirimZaman);
    bildirimZaman = setTimeout(function () { b.classList.remove("goster"); }, 1900);
  }

  /* ---------------- tema (açık/koyu) ---------------- */
  function temaDegistir(tema) {
    var t = tema || (D.al().tema === "koyu" ? "acik" : "koyu");
    document.documentElement.setAttribute("data-tema", t);
    if (el.btnTema) el.btnTema.textContent = t === "koyu" ? "🌙 Tema" : "☀️ Tema";
    if (D.al().tema !== t) D.guncelle({ tema: t });
    cizTumunu();
  }

  /* ---------------- tam ekran ---------------- */
  function tamEkran() {
    var kok = document.documentElement;
    if (!document.fullscreenElement) {
      if (kok.requestFullscreen) kok.requestFullscreen().then(function () { boyutlariYenile(); }).catch(function () { bildirim("Tam ekran açılamadı"); });
    } else if (document.exitFullscreen) {
      document.exitFullscreen().then(function () { boyutlariYenile(); }).catch(function () { });
    }
  }

  /* ---------------- interaktif tuval ---------------- */
  function tuvalKur() {
    var kap = el.tuvalKap, canvas = el.tuval;
    if (!kap || !canvas) return;
    tuval.ctx = canvas.getContext("2d");
    tuval.ciz = canvas;

    var noktalar = D.al().tuvalNoktalari || [];
    kap.querySelectorAll(".nokta").forEach(function (n) { n.remove(); });
    tuval.noktalar = noktalar.map(function (n) { return Object.assign({}, n); });
    tuval.noktalar.forEach(function (n, i) {
      var d = document.createElement("div");
      d.className = "nokta";
      d.style.width = "26px";
      d.style.height = "26px";
      d.style.background = n.renk;
      d.dataset.indeks = String(i);
      d.title = n.renk + " — sürükle";
      kap.appendChild(d);
      d.addEventListener("pointerdown", function (ev) {
        ev.preventDefault();
        tuval.aktifNokta = i;
        // NUMEX-DÜZELTME (2026-11-20): Sürükleme yalnız noktanın kendi pointermove olayına bağlıydı; setPointerCapture desteklenmeyen/headless durumda fare noktadan çıkınca hareket olayı kesiliyor ve nokta yerinde kalıyordu (gerçek fare testinde x sabit kaldı). Hareket ve bırakma pencere düzeyine taşındı — sürükleme artık imleç nerede olursa olsun takip ediyor.
        try { d.setPointerCapture(ev.pointerId); } catch (e) { /* desteklenmiyorsa pencere dinleyicisi devralır */ }
      });
    });

    kap.addEventListener("pointermove", function (ev) {
      var r = kap.getBoundingClientRect();
      tuval.fare.x = (ev.clientX - r.left) / Math.max(r.width, 1);
      tuval.fare.y = (ev.clientY - r.top) / Math.max(r.height, 1);
      if (tuval.aktifNokta < 0) cizTuval();
    });

    /* nokta sürükleme: hareket/bırakma pencere düzeyinde — imleç noktadan çıksa da takip eder */
    if (!tuval.pencereDinliyor) {
      tuval.pencereDinliyor = true;
      window.addEventListener("pointermove", function (ev) {
        if (tuval.aktifNokta < 0) return;
        noktaSurukle(tuval.aktifNokta, ev.clientX, ev.clientY);
      });
      window.addEventListener("pointerup", function () {
        if (tuval.aktifNokta < 0) return;
        tuval.aktifNokta = -1;
        D.guncelle({ tuvalNoktalari: tuval.noktalar.map(function (x) { return Object.assign({}, x); }) });
      });
      window.addEventListener("pointercancel", function () {
        if (tuval.aktifNokta < 0) return;
        tuval.aktifNokta = -1;
        D.guncelle({ tuvalNoktalari: tuval.noktalar.map(function (x) { return Object.assign({}, x); }) });
      });
    }

    kap.addEventListener("dblclick", function (ev) {
      var r = kap.getBoundingClientRect();
      var x = R.kis((ev.clientX - r.left) / Math.max(r.width, 1), 0.05, 0.95);
      var y = R.kis((ev.clientY - r.top) / Math.max(r.height, 1), 0.05, 0.95);
      noktaEkle({ x: x, y: y, renk: D.al().palet[tuval.noktalar.length % D.al().palet.length], r: 150 });
    });

    boyutlariYenile();
  }

  function boyutlariYenile() {
    if (!tuval.ciz || !el.tuvalKap) return;
    var dpr = Math.min(kok.devicePixelRatio || 1, 2);
    var w = el.tuvalKap.clientWidth || 640, h = el.tuvalKap.clientHeight || 340;
    tuval.ciz.width = Math.max(1, Math.round(w * dpr));
    tuval.ciz.height = Math.max(1, Math.round(h * dpr));
    tuval.ctx = tuval.ciz.getContext("2d");
    tuval.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    noktaKonumlari();
    cizTuval();
  }

  function noktaKonumlari() {
    if (!el.tuvalKap) return;
    var w = el.tuvalKap.clientWidth, h = el.tuvalKap.clientHeight;
    el.tuvalKap.querySelectorAll(".nokta").forEach(function (d) {
      var i = Number(d.dataset.indeks);
      var n = tuval.noktalar[i];
      if (!n) return;
      d.style.left = (n.x * w) + "px";
      d.style.top = (n.y * h) + "px";
      d.style.background = n.renk;
    });
  }

  function noktaSurukle(indeks, istemciX, istemciY) {
    if (!el.tuvalKap) return;
    var r = el.tuvalKap.getBoundingClientRect();
    var n = tuval.noktalar[indeks];
    if (!n) return;
    n.x = R.kis((istemciX - r.left) / Math.max(r.width, 1), 0, 1);
    n.y = R.kis((istemciY - r.top) / Math.max(r.height, 1), 0, 1);
    noktaKonumlari();
    cizTuval();
  }

  function noktaEkle(nokta) {
    tuval.noktalar.push(Object.assign({ r: 150 }, nokta));
    D.guncelle({ tuvalNoktalari: tuval.noktalar.map(function (x) { return Object.assign({}, x); }) });
    tuvalKur();
    bildirim("Renk noktası eklendi");
  }

  // NUMEX-DÜZELTME (2026-11-20): Denetim, planlanan "tuvalCiz" fonksiyonunu isimle arıyordu;
  // fonksiyon cizTuval adıyla vardı ama arayüzdeki tuvalCiz kancası tanımıyla eşleşmiyordu.
  // Tek kanonik ad (tuvalCiz) + geriye dönük takma ad ile çağıranlar korunuyor.
  function tuvalCiz() {
    var ctx = tuval.ctx;
    if (!ctx || !el.tuvalKap) return;
    var w = el.tuvalKap.clientWidth, h = el.tuvalKap.clientHeight;
    var palet = D.al().palet;
    ctx.clearRect(0, 0, w, h);

    var arka = ctx.createLinearGradient(0, 0, w, h);
    arka.addColorStop(0, palet[0]);
    arka.addColorStop(0.5, palet[Math.min(2, palet.length - 1)]);
    arka.addColorStop(1, palet[palet.length - 1]);
    ctx.fillStyle = arka;
    ctx.fillRect(0, 0, w, h);

    ctx.globalCompositeOperation = "lighter";
    var t = Date.now() / 1400;
    tuval.noktalar.forEach(function (n, i) {
      var faz = t + i * 1.7;
      var x = n.x * w + Math.sin(faz) * 14 + (tuval.fare.x - 0.5) * 26;
      var y = n.y * h + Math.cos(faz * 0.8) * 14 + (tuval.fare.y - 0.5) * 26;
      var yaricap = (n.r || 150) * (0.6 + 0.12 * Math.sin(faz * 1.2));
      var g = ctx.createRadialGradient(x, y, 0, x, y, Math.max(yaricap, 1));
      g.addColorStop(0, hexA(n.renk, 0.86));
      g.addColorStop(0.55, hexA(n.renk, 0.34));
      g.addColorStop(1, hexA(n.renk, 0));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, Math.max(yaricap, 1), 0, Math.PI * 2);
      ctx.fill();
    });

    /* hafif renk dalgalanması katmanı */
    ctx.globalCompositeOperation = "soft-light";
    for (var k = 0; k < 3; k++) {
      var renk = palet[k % palet.length];
      ctx.strokeStyle = hexA(renk, 0.35);
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (var x2 = 0; x2 <= w; x2 += 8) {
        var nx = x2 / w;
        var y2 = h * (0.5 + 0.16 * Math.sin(nx * 6 + t * 0.9 + k * 1.4) + (tuval.fare.y - 0.5) * 0.12);
        if (x2 === 0) ctx.moveTo(x2, y2); else ctx.lineTo(x2, y2);
      }
      ctx.stroke();
    }
    ctx.globalCompositeOperation = "source-over";

    /* karışma anı: renklerin birbirine geçtiği vinyet */
    var v = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.2, w / 2, h / 2, Math.max(w, h) * 0.78);
    v.addColorStop(0, "rgba(0,0,0,0)");
    v.addColorStop(1, "rgba(0,0,0,0.35)");
    ctx.fillStyle = v;
    ctx.fillRect(0, 0, w, h);
  }

  var cizTuval = tuvalCiz;

  /* geçerli bir #rrggbb ise normalize edilmiş halini, değilse null döner */
  function gecerliTaban(hex) {
    if (typeof hex !== "string") return null;
    var h = hex.trim();
    if (!/^#?[0-9a-fA-F]{6}$/.test(h) && !/^#?[0-9a-fA-F]{3}$/.test(h)) return null;
    if (h.charAt(0) !== "#") h = "#" + h;
    var c = R.hexToRgb(h);
    if (!c || isNaN(c.r) || isNaN(c.g) || isNaN(c.b)) return null;
    return R.rgbToHex(c.r, c.g, c.b);
  }

  function hexA(hex, a) {
    var c = R.hexToRgb(hex);
    return "rgba(" + c.r + "," + c.g + "," + c.b + "," + a + ")";
  }

  /* ---------------- palet ---------------- */
  function paletCiz() {
    var s = D.al();
    var satir = el.paletSatiri;
    if (!satir) return;
    satir.innerHTML = "";
    s.palet.forEach(function (renk, i) {
      var kart = document.createElement("div");
      kart.className = "palet-kart";
      kart.style.background = renk;
      kart.style.color = R.metinRengi(renk);
      kart.dataset.indeks = String(i);
      kart.innerHTML = "<div>" + renk.toUpperCase() + "</div>";

      var kilit = document.createElement("button");
      kilit.className = "kilit" + (s.kilitler[i] ? " kilitli" : "");
      kilit.type = "button";
      kilit.textContent = s.kilitler[i] ? "🔒" : "🔓";
      kilit.title = s.kilitler[i] ? "Kilidi aç" : "Kilitle";
      kilit.addEventListener("click", function (ev) {
        ev.stopPropagation();
        var k = s.kilitler.slice();
        k[i] = !k[i];
        D.guncelle({ kilitler: k });
        bildirim(k[i] ? "Renk kilitlendi" : "Kilit açıldı");
      });
      kart.appendChild(kilit);

      kart.addEventListener("click", function () {
        seciliIndeks = i;
        X.panoyaMetin(renk).then(function (ok) {
          bildirim(ok ? renk.toUpperCase() + " kopyalandı" : "Kopyalanamadı");
        });
        kart.classList.add("kopyalandi");
        setTimeout(function () { kart.classList.remove("kopyalandi"); }, 400);
        gecmiseEkle(renk);
        D.guncelle({ tabanRenk: renk, karistirici: { a: renk, b: s.karistirici.b, t: s.karistirici.t } });
        seciliDetayCiz(renk);
      });

      satir.appendChild(kart);
    });

    qsa("#kuralSatiri .kural").forEach(function (b) {
      b.classList.toggle("aktif", b.dataset.kural === s.kural);
    });
    if (el.kuralAciklama) el.kuralAciklama.textContent = KURAL_ACIKLAMA[s.kural] || "";
    seciliDetayCiz(s.palet[seciliIndeks] || s.palet[0]);
    cssDegiskenleriUygula();
  }

  function seciliDetayCiz(renk) {
    var kap = el.seciliDetay;
    if (!kap) return;
    var rgb = R.hexToRgb(renk), hsl = R.rgbToHsl(rgb.r, rgb.g, rgb.b), hsv = R.rgbToHsv(rgb.r, rgb.g, rgb.b);
    var karsi = R.tamamlayici(renk);
    var kont = R.kontrastOrani(renk, "#ffffff");
    kap.innerHTML =
      '<div class="renk-secici-kart" style="justify-content:flex-start">' +
        '<div style="height:132px;width:100%;border-radius:10px;background:' + renk + ';border:1px solid var(--cizgi-guclu)"></div>' +
        '<div class="deger-satiri"><span>HEX</span><b class="mono">' + renk.toUpperCase() + "</b></div>" +
        '<div class="deger-satiri"><span>RGB</span><b class="mono">' + rgb.r + ", " + rgb.g + ", " + rgb.b + "</b></div>" +
      "</div>" +
      '<div class="renk-secici-kart">' +
        '<div class="deger-satiri"><span>HSL</span><b class="mono">' + sayi(hsl.h, 0) + "°, " + sayi(hsl.s, 0) + "%, " + sayi(hsl.l, 0) + "%</b></div>" +
        '<div class="deger-satiri"><span>HSV</span><b class="mono">' + sayi(hsv.h, 0) + "°, " + sayi(hsv.s, 0) + "%, " + sayi(hsv.v, 0) + "%</b></div>" +
        '<div class="deger-satiri"><span>Tamamlayıcı</span><b class="mono">' + karsi.toUpperCase() + "</b></div>" +
        '<div class="deger-satiri"><span>Beyaza kontrast</span><b class="mono">' + sayi(kont, 2) + ":1</b></div>" +
      "</div>";
  }

  function cssDegiskenleriUygula() {
    var s = D.al();
    s.palet.forEach(function (renk, i) {
      document.documentElement.style.setProperty("--p" + (i + 1), renk);
    });
    // NUMEX-DÜZELTME (2026-11-20): Kök neden: arayüz vurgu renklerini (--vurgu/--vurgu-2/--vurgu-3) kullanıcı paletinden türetiyordu. Palet gri/soluk tonlara çekilince aktif sekme, düğmeler ve tüm vurgular okunmaz hâle geliyordu (ekran görüntüsünde aktif sekme beyaz/soluk kutu göründü). Vurgu artık temanın sabit renkleri; palet yalnız --p1..--p5 örneklerini besliyor.
    /* NUMEX-DÜZELTME: vurgu renkleri paletten TÜRETİLMEZ (gri/soluk palet arayüzü okunmaz yapıyordu) */
    document.documentElement.style.removeProperty("--vurgu");
    document.documentElement.style.removeProperty("--vurgu-2");
    document.documentElement.style.removeProperty("--vurgu-3");
  }

  function paletYenile() {
    var s = D.al();
    var yeni = P.yenidenUret(s.palet, s.kilitler, s.kural, s.tabanRenk);
    var kural = s.kural === "rastgele" ? "rastgele" : s.kural;
    D.guncelle({ palet: yeni, kural: kural });
    bildirim("Palet yeniden üretildi");
  }

  /* ---------------- geçmiş ---------------- */
  function gecmiseEkle(renk) {
    var g = D.al().gecmis.slice();
    g.unshift(renk);
    var tekil = [];
    g.forEach(function (r) { if (tekil.indexOf(r) === -1) tekil.push(r); });
    D.guncelle({ gecmis: tekil.slice(0, 24) });
  }

  function gecmisCiz() {
    var kap = el.gecmisSerit;
    if (!kap) return;
    var g = D.al().gecmis;
    if (!g.length) { kap.innerHTML = '<span class="ipucu">Henüz renk seçilmedi.</span>'; return; }
    kap.innerHTML = "";
    g.forEach(function (renk) {
      var d = document.createElement("div");
      d.className = "gecmis-parca";
      d.style.background = renk;
      d.title = renk;
      d.addEventListener("click", function () {
        D.guncelle({ palet: P.duzenle(D.al().palet, seciliIndeks, renk) });
        X.panoyaMetin(renk).then(function () { bildirim(renk.toUpperCase() + " kopyalandı"); });
      });
      kap.appendChild(d);
    });
  }

  /* ---------------- favoriler ---------------- */
  function favoriCiz() {
    var kap = el.favoriListe;
    if (!kap) return;
    var f = D.al().favoriler;
    if (!f.length) { kap.innerHTML = '<span class="ipucu">Henüz favori yok — palet panelinden ekleyin.</span>'; return; }
    kap.innerHTML = "";
    f.forEach(function (fav, i) {
      var satir = document.createElement("div");
      satir.className = "favori-satiri";
      var ad = document.createElement("div");
      ad.className = "favori-ad";
      ad.textContent = fav.ad;
      var serit = document.createElement("div");
      serit.className = "favori-renkler";
      fav.renkler.forEach(function (r) {
        var p = document.createElement("div");
        p.style.background = r;
        p.title = r;
        serit.appendChild(p);
      });
      var uygula = document.createElement("button");
      uygula.className = "dugme minik";
      uygula.textContent = "Uygula";
      uygula.addEventListener("click", function () {
        D.guncelle({ palet: fav.renkler.slice() });
        bildirim(fav.ad + " uygulandı");
      });
      var sil = document.createElement("button");
      sil.className = "dugme minik";
      sil.textContent = "Sil";
      sil.addEventListener("click", function () {
        var kopya = D.al().favoriler.slice();
        kopya.splice(i, 1);
        D.guncelle({ favoriler: kopya });
      });
      satir.appendChild(ad); satir.appendChild(serit); satir.appendChild(uygula); satir.appendChild(sil);
      kap.appendChild(satir);
    });
  }

  /* ---------------- karıştırıcı ---------------- */
  function karistiriciCiz() {
    var s = D.al(), k = s.karistirici;
    if (el.karistirA) el.karistirA.value = k.a;
    if (el.karistirB) el.karistirB.value = k.b;
    if (el.karistirT) el.karistirT.value = String(Math.round(k.t * 100));
    if (el.tDeger) el.tDeger.textContent = sayi(k.t, 2);
    yazDeger("a", k.a);
    yazDeger("b", k.b);

    var cmp = P.karistirmaKarsilastir(k.a, k.b);
    if (el.rgbSerit) el.rgbSerit.innerHTML = cmp.rgbAdim.map(function (r) { return '<div style="background:' + r + '"></div>'; }).join("");
    if (el.hslSerit) el.hslSerit.innerHTML = cmp.hslAdim.map(function (r) { return '<div style="background:' + r + '"></div>'; }).join("");
    if (el.rgbSonuc) el.rgbSonuc.textContent = cmp.rgb.toUpperCase();
    if (el.hslSonuc) el.hslSonuc.textContent = cmp.hsl.toUpperCase();
  }

  function yazDeger(onEk, hex) {
    var rgb = R.hexToRgb(hex), hsl = R.rgbToHsl(rgb.r, rgb.g, rgb.b), hsv = R.rgbToHsv(rgb.r, rgb.g, rgb.b);
    var eHex = $(onEk + "Hex"), eRgb = $(onEk + "Rgb"), eHsl = $(onEk + "Hsl"), eHsv = $(onEk + "Hsv");
    if (eHex) eHex.textContent = hex.toUpperCase();
    if (eRgb) eRgb.textContent = rgb.r + ", " + rgb.g + ", " + rgb.b;
    if (eHsl) eHsl.textContent = sayi(hsl.h, 0) + "°, " + sayi(hsl.s, 0) + "%, " + sayi(hsl.l, 0) + "%";
    if (eHsv) eHsv.textContent = sayi(hsv.h, 0) + "°, " + sayi(hsv.s, 0) + "%, " + sayi(hsv.v, 0) + "%";
  }

  /* ---------------- gradyan ---------------- */
  function gradyanCiz() {
    var s = D.al(), g = s.gradyan;
    var css = G.cssUret(g.duraklar, g.tip, g.aci);
    if (el.gradyanOnizleme) el.gradyanOnizleme.style.backgroundImage = css;
    if (el.cssCiktisi) {
      el.cssCiktisi.textContent = ".gradyan {\n  background: " + css + ";\n}";
    }
    if (el.aciDeger) el.aciDeger.textContent = g.aci + "°";
    if (el.aciKaydirici) el.aciKaydirici.value = String(g.aci);
    qsa("#gradyanTipSatiri .kural").forEach(function (b) {
      b.classList.toggle("aktif", b.dataset.tip === g.tip);
    });

    /* durak şeridi */
    if (el.durakSerit) {
      el.durakSerit.style.backgroundImage = css;
      el.durakSerit.querySelectorAll(".durak-tutamac").forEach(function (n) { n.remove(); });
      g.duraklar.forEach(function (d, i) {
        var t = document.createElement("div");
        t.className = "durak-tutamac" + (i === seciliDurak ? " secili" : "");
        t.style.left = d.konum + "%";
        t.style.background = d.renk;
        t.dataset.indeks = String(i);
        t.addEventListener("pointerdown", function (ev) {
          ev.preventDefault();
          seciliDurak = i;
          t.setPointerCapture(ev.pointerId);
          surukleBasla(ev);
        });
        t.addEventListener("pointermove", function (ev) {
          if (!surukleDurum.aktif) return;
          var r = el.durakSerit.getBoundingClientRect();
          var konum = R.kis(((ev.clientX - r.left) / Math.max(r.width, 1)) * 100, 0, 100);
          var duraklar = G.durakTasi(D.al().gradyan.duraklar, surukleDurum.indeks, konum);
          D.guncelle({ gradyan: { tip: D.al().gradyan.tip, aci: D.al().gradyan.aci, duraklar: duraklar } }, { kaydet: false });
        });
        t.addEventListener("pointerup", function () {
          if (surukleDurum.aktif) {
            surukleDurum.aktif = false;
            D.guncelle({ gradyan: D.al().gradyan });
          }
        });
        el.durakSerit.appendChild(t);
      });
      el.durakSerit.onpointerdown = function (ev) {
        if (ev.target !== el.durakSerit) return;
        var r = el.durakSerit.getBoundingClientRect();
        var konum = R.kis(((ev.clientX - r.left) / Math.max(r.width, 1)) * 100, 0, 100);
        var renk = R.hexToRgb(D.al().palet[D.al().gradyan.duraklar.length % D.al().palet.length]);
        var hex = R.rgbToHex(renk.r, renk.g, renk.b);
        var duraklar = G.durakEkle(D.al().gradyan.duraklar, { renk: hex, konum: konum });
        D.guncelle({ gradyan: { tip: D.al().gradyan.tip, aci: D.al().gradyan.aci, duraklar: duraklar } });
        bildirim("Durak eklendi");
      };
    }

    /* durak listesi */
    if (el.durakListe) {
      el.durakListe.innerHTML = "";
      g.duraklar.forEach(function (d, i) {
        var satir = document.createElement("div");
        satir.className = "durak-satir";
        var renkInput = document.createElement("input");
        renkInput.type = "color";
        renkInput.value = d.renk;
        renkInput.addEventListener("input", function () {
          var duraklar = G.durakRenk(D.al().gradyan.duraklar, i, renkInput.value);
          D.guncelle({ gradyan: { tip: D.al().gradyan.tip, aci: D.al().gradyan.aci, duraklar: duraklar } }, { kaydet: false });
        });

        var kod = document.createElement("span");
        kod.className = "mono";
        kod.textContent = d.renk.toUpperCase();

        var konum = document.createElement("input");
        konum.type = "number";
        konum.min = "0"; konum.max = "100"; konum.value = d.konum;
        konum.addEventListener("input", function () {
          var duraklar = G.durakTasi(D.al().gradyan.duraklar, i, Number(konum.value));
          D.guncelle({ gradyan: { tip: D.al().gradyan.tip, aci: D.al().gradyan.aci, duraklar: duraklar } }, { kaydet: false });
        });
        konum.addEventListener("change", function () {
          D.guncelle({ gradyan: D.al().gradyan });
        });

        var yuzde = document.createElement("span");
        yuzde.className = "mono";
        yuzde.textContent = "%";

        var sil = document.createElement("button");
        sil.className = "durak-sil";
        sil.type = "button";
        sil.textContent = "✕";
        sil.title = "Durağı sil";
        sil.addEventListener("click", function () {
          var duraklar = G.durakSil(D.al().gradyan.duraklar, i);
          D.guncelle({ gradyan: { tip: D.al().gradyan.tip, aci: D.al().gradyan.aci, duraklar: duraklar } });
        });

        satir.appendChild(renkInput);
        satir.appendChild(kod);
        satir.appendChild(konum);
        satir.appendChild(yuzde);
        satir.appendChild(sil);
        el.durakListe.appendChild(satir);
      });
    }
  }

  var surukleDurum = { aktif: false, indeks: 0 };
  function surukleBasla(ev) {
    var hedef = ev.currentTarget || ev.target;
    surukleDurum.aktif = true;
    surukleDurum.indeks = Number(hedef.dataset.indeks);
    /* tek tıkla renk seçici aç (çift tık) */
    if (ev.detail === 2) {
      var yeni = prompt("Durak rengi (HEX):", D.al().gradyan.duraklar[surukleDurum.indeks].renk);
      if (yeni && /^#?[0-9a-fA-F]{3,6}$/.test(yeni.trim())) {
        var hex = yeni.trim();
        if (hex[0] !== "#") hex = "#" + hex;
        var duraklar = G.durakRenk(D.al().gradyan.duraklar, surukleDurum.indeks, hex);
        D.guncelle({ gradyan: { tip: D.al().gradyan.tip, aci: D.al().gradyan.aci, duraklar: duraklar } });
      }
    }
  }

  /* ---------------- sanat ---------------- */
  function sanatPaneliCiz() {
    var s = D.al();
    if (el.hizKaydirici) el.hizKaydirici.value = String(Math.round(s.sanat.hiz * 100));
    if (el.hizDeger) el.hizDeger.textContent = s.sanat.hiz.toFixed(1) + "×";
    if (el.yogunlukKaydirici) el.yogunlukKaydirici.value = String(Math.round(s.sanat.yogunluk * 100));
    if (el.yogunlukDeger) el.yogunlukDeger.textContent = s.sanat.yogunluk.toFixed(2);
    qsa("#modSatiri .mod-dugme").forEach(function (b) {
      b.classList.toggle("aktif", b.dataset.mod === s.sanat.mod);
    });
    if (el.btnSanatDurdur) el.btnSanatDurdur.textContent = s.sanat.calisiyor ? "⏸ Durdur" : "▶ Devam";
    if (el.sanatTuval && !el.sanatTuval.dataset.baslatildi) {
      el.sanatTuval.dataset.baslatildi = "1";
      S.baslat(el.sanatTuval, s.palet, s.sanat);
      S.modDegistir(s.sanat.mod);
      if (!s.sanat.calisiyor) S.durdur();
    } else {
      S.renkAyarla(s.palet);
      S.modDegistir(s.sanat.mod);
      S.ayarGuncelle({ hiz: s.sanat.hiz, yogunluk: s.sanat.yogunluk, calisiyor: s.sanat.calisiyor });
    }
  }

  /* ---------------- kontrast ---------------- */
  function kontrastCiz() {
    var s = D.al(), k = s.kontrast;
    if (el.kontrastA) el.kontrastA.value = k.a;
    if (el.kontrastB) el.kontrastB.value = k.b;
    if (el.kontrastAHex) el.kontrastAHex.textContent = k.a.toUpperCase();
    if (el.kontrastBHex) el.kontrastBHex.textContent = k.b.toUpperCase();
    var oran = R.kontrastOrani(k.a, k.b);
    var seviye = R.wcagSeviye(oran);
    if (el.kontrastOran) el.kontrastOran.textContent = oran.toFixed(2) + ":1";
    rozetAyarla(el.wcagAA, "AA (4.5:1)", seviye.aa);
    rozetAyarla(el.wcagAAA, "AAA (7:1)", seviye.aaa);
    rozetAyarla(el.wcagBuyuk, "AA Büyük (3:1)", seviye.aaBuyuk);
    if (el.kontrastOrnek) {
      el.kontrastOrnek.style.color = k.a;
      el.kontrastOrnek.style.background = k.b;
    }
  }

  function rozetAyarla(dugum, etiket, gecti) {
    if (!dugum) return;
    dugum.textContent = etiket + (gecti ? " ✓" : " ✕");
    dugum.classList.toggle("gecti", !!gecti);
    dugum.classList.toggle("kaldi", !gecti);
  }

  /* ---------------- temalar ---------------- */
  function temaIzgaraCiz() {
    if (!el.temaIzgara) return;
    el.temaIzgara.innerHTML = "";
    TEMALAR.forEach(function (t) {
      var b = document.createElement("button");
      b.className = "tema-kart";
      b.type = "button";
      var onizleme = document.createElement("div");
      onizleme.className = "onizleme";
      onizleme.style.background = G.cssUret(
        t.renkler.map(function (r, i) { return { renk: r, konum: Math.round((i / (t.renkler.length - 1)) * 100) }; }),
        "linear", 135
      );
      var etiket = document.createElement("div");
      etiket.className = "etiket";
      etiket.innerHTML = "<span>" + t.ad + "</span><small>" + t.not + "</small>";
      b.appendChild(onizleme);
      b.appendChild(etiket);
      b.addEventListener("click", function () { temaUygula(t); });
      if (D.al().palet.join() === t.renkler.join()) b.classList.add("aktif");
      el.temaIzgara.appendChild(b);
    });
  }

  function temaUygula(t) {
    var duraklar = t.renkler.map(function (r, i) {
      return { renk: r, konum: Math.round((i / (t.renkler.length - 1)) * 100) };
    });
    D.guncelle({
      palet: t.renkler.slice(),
      tabanRenk: t.renkler[0],
      gradyan: { tip: D.al().gradyan.tip, aci: D.al().gradyan.aci, duraklar: duraklar },
      karistirici: { a: t.renkler[0], b: t.renkler[2] || t.renkler[1], t: 0.5 },
      kontrast: { a: t.renkler[4] || "#ffffff", b: t.renkler[0] },
      tuvalNoktalari: t.renkler.map(function (r, i) {
        return { x: 0.2 + 0.6 * ((i * 0.37) % 1), y: 0.25 + 0.5 * ((i * 0.61) % 1), renk: r, r: 170 };
      })
    });
    tuvalKur();
    temaIzgaraCiz();
    bildirim(t.ad + " uygulandı");
  }

  /* ---------------- dışa aktarma eylemleri ---------------- */
  function pngIndir() {
    var g = D.al().gradyan;
    var gecici = document.createElement("canvas");
    gecici.width = 1200; gecici.height = 750;
    var c = gecici.getContext("2d");
    var css = G.cssUret(g.duraklar, g.tip, g.aci);
    var ilk = G.sirala(g.duraklar);
    if (g.tip === "linear") {
      var rad = (g.aci - 90) * Math.PI / 180;
      var x1 = 600 - Math.cos(rad) * 700, y1 = 375 - Math.sin(rad) * 700;
      var x2 = 600 + Math.cos(rad) * 700, y2 = 375 + Math.sin(rad) * 700;
      var grd = c.createLinearGradient(x1, y1, x2, y2);
      ilk.forEach(function (d) { grd.addColorStop(R.kis(d.konum / 100, 0, 1), d.renk); });
      c.fillStyle = grd;
      c.fillRect(0, 0, 1200, 750);
    } else if (g.tip === "radial") {
      var rg = c.createRadialGradient(600, 375, 0, 600, 375, 620);
      ilk.forEach(function (d) { rg.addColorStop(R.kis(d.konum / 100, 0, 1), d.renk); });
      c.fillStyle = rg;
      c.fillRect(0, 0, 1200, 750);
    } else {
      var adet = ilk.length;
      for (var i = 0; i < adet; i++) {
        var a0 = ((i / adet) * 360 + g.aci) * Math.PI / 180;
        var a1 = (((i + 1) / adet) * 360 + g.aci) * Math.PI / 180;
        c.beginPath();
        c.moveTo(600, 375);
        c.arc(600, 375, 900, a0 - Math.PI / 2, a1 - Math.PI / 2);
        c.closePath();
        c.fillStyle = ilk[i].renk;
        c.fill();
      }
    }
    var ok = X.png(gecici, X.zamanAdi("png"));
    bildirim(ok ? "PNG indirildi (" + css.slice(0, 0) + ")" : "PNG oluşturulamadı");
  }

  function cssDegiskenKopyala() {
    var metin = P.cssDegiskenleri(D.al().palet);
    X.panoyaMetin(metin).then(function (ok) { bildirim(ok ? "CSS değişkenleri kopyalandı" : "Kopyalanamadı"); });
  }

  /* ---------------- klavye ---------------- */
  function klavyeKisayollari() {
    document.addEventListener("keydown", function (ev) {
      var etiket = (ev.target.tagName || "").toLowerCase();
      if (etiket === "input" || etiket === "textarea") return;
      if ((ev.ctrlKey || ev.metaKey) && ev.key.toLowerCase() === "z") {
        ev.preventDefault();
        if (ev.shiftKey) { D.ileriAl() ? bildirim("İleri alındı") : bildirim("İleri alınacak adım yok"); }
        else { D.geriAl() ? bildirim("Geri alındı") : bildirim("Geri alınacak adım yok"); }
      } else if (ev.key.toLowerCase() === "f") {
        tamEkran();
      } else if (ev.key.toLowerCase() === "t") {
        temaDegistir();
      } else if (ev.key.toLowerCase() === "r") {
        paletYenile();
      }
    });
  }

  /* ---------------- sekme ---------------- */
  function sekmeDegistir(id) {
    qsa(".sekme").forEach(function (b) { b.classList.toggle("aktif", b.dataset.sekme === id); });
    qsa(".panel").forEach(function (p) { p.classList.toggle("aktif", p.id === "panel-" + id); });
    D.guncelle({ aktifSekme: id }, { kaydet: false, kalici: false });
    if (id === "sanat") sanatPaneliCiz();
    if (id === "arac") { gecmisCiz(); favoriCiz(); kontrastCiz(); }
    if (id === "temalar") temaIzgaraCiz();
  }

  function cizTumunu() {
    paletCiz();
    karistiriciCiz();
    gradyanCiz();
    sanatPaneliCiz();
    gecmisCiz();
    favoriCiz();
    kontrastCiz();
    cizTuval();
    var y = D.yiginDurumu();
    if (el.btnGeriAl) el.btnGeriAl.disabled = y.geri === 0;
    if (el.btnIleriAl) el.btnIleriAl.disabled = y.ileri === 0;
  }

  /* ---------------- bağlama ---------------- */
  function baglan() {
    el = {
      bildirim: $("bildirim"), btnTema: $("btnTema"), btnGeriAl: $("btnGeriAl"), btnIleriAl: $("btnIleriAl"),
      tuvalKap: $("tuvalKap"), tuval: $("tuval"), paletSatiri: $("paletSatiri"), kuralAciklama: $("kuralAciklama"),
      seciliDetay: $("seciliDetay"), gecmisSerit: $("gecmisSerit"), favoriListe: $("favoriListe"),
      karistirA: $("karistirA"), karistirB: $("karistirB"), karistirT: $("karistirT"), tDeger: $("tDeger"),
      rgbSerit: $("rgbSerit"), hslSerit: $("hslSerit"), rgbSonuc: $("rgbSonuc"), hslSonuc: $("hslSonuc"),
      gradyanOnizleme: $("gradyanOnizleme"), aciKaydirici: $("aciKaydirici"), aciDeger: $("aciDeger"),
      durakSerit: $("durakSerit"), durakListe: $("durakListe"), cssCiktisi: $("cssCiktisi"),
      sanatTuval: $("sanatTuval"), hizKaydirici: $("hizKaydirici"), hizDeger: $("hizDeger"),
      yogunlukKaydirici: $("yogunlukKaydirici"), yogunlukDeger: $("yogunlukDeger"), btnSanatDurdur: $("btnSanatDurdur"),
      kontrastA: $("kontrastA"), kontrastB: $("kontrastB"), kontrastAHex: $("kontrastAHex"),
      kontrastBHex: $("kontrastBHex"), kontrastOran: $("kontrastOran"), wcagAA: $("wcagAA"),
      wcagAAA: $("wcagAAA"), wcagBuyuk: $("wcagBuyuk"), kontrastOrnek: $("kontrastOrnek"),
      temaIzgara: $("temaIzgara")
    };

    /* kural butonları */
    var kuralSatiri = $("kuralSatiri");
    if (kuralSatiri) {
      P.KURALLAR.forEach(function (k) {
        var b = document.createElement("button");
        b.className = "kural";
        b.type = "button";
        b.dataset.kural = k.id;
        b.textContent = k.ad;
        b.addEventListener("click", function () {
          var s = D.al();
          // NUMEX-DÜZELTME (2026-11-20): Kök neden: palet üretiminde tabanRenk state'te hiç güncellenmiyordu; geri-al/geçmiş sonrası eski ya da geçersiz taban renk kalıcı hale gelip kural butonlarının aynı renkleri üretmesine yol açıyordu. Taban rengi artık kullanıcının gerçek seçiminden türetiliyor ve geçersizse paletin ilk rengine düşüyor.
          /* taban renk daima kullanıcının gerçek seçiminden gelir */
          var taban = gecerliTaban(s.tabanRenk) || gecerliTaban(s.palet[0]) || "#ff6b6b";
          var yeni = P.uret(k.id, taban, s.palet.length);
          var birlesik = s.palet.map(function (eski, i) { return s.kilitler[i] ? eski : yeni.renkler[i]; });
          D.guncelle({ kural: k.id, tabanRenk: taban, palet: birlesik });
          bildirim(k.ad + " paleti üretildi");
        });
        kuralSatiri.appendChild(b);
      });
    }

    /* sanat mod butonları */
    var modSatiri = $("modSatiri");
    if (modSatiri) {
      S.MODLAR.forEach(function (m) {
        var b = document.createElement("button");
        b.className = "mod-dugme";
        b.type = "button";
        b.dataset.mod = m.id;
        b.textContent = m.ad;
        b.addEventListener("click", function () {
          var s = D.al();
          D.guncelle({ sanat: Object.assign({}, s.sanat, { mod: m.id }) });
        });
        modSatiri.appendChild(b);
      });
    }

    /* sekmeler */
    qsa(".sekme").forEach(function (b) {
      b.addEventListener("click", function () { sekmeDegistir(b.dataset.sekme); });
    });

    /* tema / tam ekran / geri-ileri */
    if (el.btnTema) el.btnTema.addEventListener("click", function () { temaDegistir(); });
    var btnTam = $("btnTamEkran");
    if (btnTam) btnTam.addEventListener("click", tamEkran);
    if (el.btnGeriAl) el.btnGeriAl.addEventListener("click", function () {
      bildirim(D.geriAl() ? "Geri alındı" : "Geri alınacak adım yok");
    });
    if (el.btnIleriAl) el.btnIleriAl.addEventListener("click", function () {
      bildirim(D.ileriAl() ? "İleri alındı" : "İleri alınacak adım yok");
    });

    /* palet eylemleri */
    var bp = $("btnPaletYenile"); if (bp) bp.addEventListener("click", paletYenile);
    var bk = $("btnKaristir"); if (bk) bk.addEventListener("click", function () {
      var s = D.al();
      var yeni = P.uret("rastgele", s.palet[0], 5).renkler;
      D.guncelle({ palet: s.palet.map(function (e, i) { return s.kilitler[i] ? e : yeni[i]; }) });
      bildirim("Renkler karıştırıldı");
    });
    var bpc = $("btnPaletKopyala"); if (bpc) bpc.addEventListener("click", function () {
      var metin = P.kopyalaDegeri(D.al().palet);
      X.panoyaMetin(metin).then(function (ok) { bildirim(ok ? "Palet kopyalandı" : "Kopyalanamadı"); });
    });
    var bcc = $("btnPaletCss"); if (bcc) bcc.addEventListener("click", cssDegiskenKopyala);
    var bfe = $("btnFavoriEkle"); if (bfe) bfe.addEventListener("click", function () {
      var s = D.al();
      var ad = "Palet " + (s.favoriler.length + 1) + " · " + s.kural;
      var fav = s.favoriler.concat([{ ad: ad, renkler: s.palet.slice() }]);
      D.guncelle({ favoriler: fav });
      bildirim("Favorilere eklendi");
    });

    /* karıştırıcı */
    if (el.karistirA) el.karistirA.addEventListener("input", function () {
      D.guncelle({ karistirici: Object.assign({}, D.al().karistirici, { a: el.karistirA.value }) }, { kaydet: false });
    });
    if (el.karistirA) el.karistirA.addEventListener("change", function () {
      gecmiseEkle(el.karistirA.value); D.guncelle({});
    });
    if (el.karistirB) el.karistirB.addEventListener("input", function () {
      D.guncelle({ karistirici: Object.assign({}, D.al().karistirici, { b: el.karistirB.value }) }, { kaydet: false });
    });
    if (el.karistirB) el.karistirB.addEventListener("change", function () {
      gecmiseEkle(el.karistirB.value); D.guncelle({});
    });
    if (el.karistirT) el.karistirT.addEventListener("input", function () {
      var t = Number(el.karistirT.value) / 100;
      D.guncelle({ karistirici: Object.assign({}, D.al().karistirici, { t: t }) }, { kaydet: false });
    });
    var bku = $("btnKaristirUygula"); if (bku) bku.addEventListener("click", function () {
      var s = D.al();
      var cmp = P.karistirmaKarsilastir(s.karistirici.a, s.karistirici.b);
      var palet = s.palet.slice();
      palet[seciliIndeks % palet.length] = cmp.hsl;
      D.guncelle({ palet: palet });
      bildirim("Karışım palete uygulandı: " + cmp.hsl.toUpperCase());
    });

    /* gradyan */
    qsa("#gradyanTipSatiri .kural").forEach(function (b) {
      b.addEventListener("click", function () {
        var s = D.al();
        D.guncelle({ gradyan: Object.assign({}, s.gradyan, { tip: b.dataset.tip }) });
      });
    });
    if (el.aciKaydirici) el.aciKaydirici.addEventListener("input", function () {
      var s = D.al();
      D.guncelle({ gradyan: Object.assign({}, s.gradyan, { aci: G.aciDegistir(s.gradyan.tip, el.aciKaydirici.value) }) }, { kaydet: false });
    });
    if (el.aciKaydirici) el.aciKaydirici.addEventListener("change", function () { D.guncelle({}); });
    var bde = $("btnDurakEkle"); if (bde) bde.addEventListener("click", function () {
      var s = D.al();
      var son = G.sirala(s.gradyan.duraklar);
      var orta = Math.round((son[0].konum + son[son.length - 1].konum) / 2);
      var duraklar = G.durakEkle(s.gradyan.duraklar, { renk: s.palet[s.gradyan.duraklar.length % s.palet.length], konum: orta });
      D.guncelle({ gradyan: Object.assign({}, s.gradyan, { duraklar: duraklar }) });
      bildirim("Durak eklendi");
    });
    var bdt = $("btnDurakTemizle"); if (bdt) bdt.addEventListener("click", function () {
      var s = D.al();
      var duraklar = s.palet.slice(0, 5).map(function (r, i, arr) {
        return { renk: r, konum: Math.round((i / Math.max(arr.length - 1, 1)) * 100) };
      });
      D.guncelle({ gradyan: Object.assign({}, s.gradyan, { duraklar: duraklar }) });
      bildirim("Gradyan 5 durağa sıfırlandı");
    });
    var bck = $("btnCssKopyala"); if (bck) bck.addEventListener("click", function () {
      var g = D.al().gradyan;
      X.panoyaMetin(G.cssUret(g.duraklar, g.tip, g.aci)).then(function (ok) {
        bildirim(ok ? "CSS kopyalandı" : "Kopyalanamadı");
      });
    });

    /* sanat */
    if (el.hizKaydirici) el.hizKaydirici.addEventListener("input", function () {
      var s = D.al();
      D.guncelle({ sanat: Object.assign({}, s.sanat, { hiz: Number(el.hizKaydirici.value) / 100 }) }, { kaydet: false });
    });
    if (el.yogunlukKaydirici) el.yogunlukKaydirici.addEventListener("input", function () {
      var s = D.al();
      D.guncelle({ sanat: Object.assign({}, s.sanat, { yogunluk: Number(el.yogunlukKaydirici.value) / 100 }) }, { kaydet: false });
    });
    if (el.btnSanatDurdur) el.btnSanatDurdur.addEventListener("click", function () {
      var s = D.al();
      var calisiyor = !s.sanat.calisiyor;
      D.guncelle({ sanat: Object.assign({}, s.sanat, { calisiyor: calisiyor }) });
      bildirim(calisiyor ? "Animasyon devam ediyor" : "Animasyon durduruldu (performans)");
    });
    var bsp = $("btnSanatPng"); if (bsp) bsp.addEventListener("click", function () {
      var ok = X.png(el.sanatTuval, X.zamanAdi("png"));
      bildirim(ok ? "Sanat görseli indirildi" : "Görsel oluşturulamadı");
    });

    /* geçmiş / favori */
    var bgt = $("btnGecmisTemizle"); if (bgt) bgt.addEventListener("click", function () {
      D.guncelle({ gecmis: [] });
      bildirim("Geçmiş temizlendi");
    });

    /* kontrast */
    if (el.kontrastA) el.kontrastA.addEventListener("input", function () {
      D.guncelle({ kontrast: { a: el.kontrastA.value, b: D.al().kontrast.b } }, { kaydet: false });
    });
    if (el.kontrastB) el.kontrastB.addEventListener("input", function () {
      D.guncelle({ kontrast: { a: D.al().kontrast.a, b: el.kontrastB.value } }, { kaydet: false });
    });
    if (el.kontrastA) el.kontrastA.addEventListener("change", function () { D.guncelle({}); });
    if (el.kontrastB) el.kontrastB.addEventListener("change", function () { D.guncelle({}); });

    /* dışa aktarma */
    function disaAktarBagla(id, fn) { var b = $(id); if (b) b.addEventListener("click", fn); }
    disaAktarBagla("btnPng", pngIndir);
    disaAktarBagla("btnPng2", pngIndir);
    disaAktarBagla("btnSvg", function () {
      var g = D.al().gradyan;
      X.svg(g.duraklar, g.tip, g.aci);
      bildirim("SVG gradyan indirildi");
    });
    disaAktarBagla("btnSvg2", function () {
      var g = D.al().gradyan;
      X.svg(g.duraklar, g.tip, g.aci);
      bildirim("SVG gradyan indirildi");
    });
    disaAktarBagla("btnCss", function () {
      var g = D.al().gradyan;
      X.css(g.duraklar, g.tip, g.aci);
      bildirim("CSS indirildi");
    });
    disaAktarBagla("btnCss2", function () {
      var g = D.al().gradyan;
      X.css(g.duraklar, g.tip, g.aci);
      bildirim("CSS indirildi");
    });
    disaAktarBagla("btnJson", function () { X.json(D.al()); bildirim("Proje JSON olarak kaydedildi"); });
    disaAktarBagla("btnJson2", function () { X.json(D.al()); bildirim("Proje JSON olarak kaydedildi"); });
    disaAktarBagla("btnJsonYukle", function () { var f = $("jsonDosya"); if (f) f.click(); });
    disaAktarBagla("btnJsonYukle2", function () { var f = $("jsonDosya"); if (f) f.click(); });

    var dosya = $("jsonDosya");
    if (dosya) dosya.addEventListener("change", function () {
      var f = dosya.files && dosya.files[0];
      if (!f) return;
      X.jsonYukle(f).then(function (veri) {
        var yama = {};
        if (Array.isArray(veri.palet) && veri.palet.length >= 2) yama.palet = veri.palet;
        if (Array.isArray(veri.kilitler)) yama.kilitler = veri.kilitler;
        if (veri.gradyan && Array.isArray(veri.gradyan.duraklar) && veri.gradyan.duraklar.length >= 2) yama.gradyan = veri.gradyan;
        if (veri.karistirici) yama.karistirici = veri.karistirici;
        if (veri.sanat) yama.sanat = veri.sanat;
        if (Array.isArray(veri.favoriler)) yama.favoriler = veri.favoriler;
        if (Array.isArray(veri.gecmis)) yama.gecmis = veri.gecmis;
        if (veri.kural) yama.kural = veri.kural;
        D.guncelle(yama);
        tuvalKur();
        bildirim("Proje yüklendi");
      }).catch(function () { bildirim("JSON okunamadı"); });
      dosya.value = "";
    });

    /* pencere olayları */
    window.addEventListener("resize", function () {
      clearTimeout(baglan._zaman);
      baglan._zaman = setTimeout(function () {
        boyutlariYenile();
        S.boyutlandir();
      }, 140);
    });
    document.addEventListener("fullscreenchange", boyutlariYenile);
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) S.durdur(); else if (D.al().sanat.calisiyor) S.devam();
    });

    D.abone(function (s) {
      paletCiz();
      karistiriciCiz();
      gradyanCiz();
      sanatPaneliCiz();
      gecmisCiz();
      favoriCiz();
      kontrastCiz();
      cizTuval();
      var y = D.yiginDurumu();
      if (el.btnGeriAl) el.btnGeriAl.disabled = y.geri === 0;
      if (el.btnIleriAl) el.btnIleriAl.disabled = y.ileri === 0;
    });

    klavyeKisayollari();
    tuvalKur();
    cizTumunu();
    var s = D.al();
    if (s.aktifSekme && s.aktifSekme !== "palet") sekmeDegistir(s.aktifSekme);
  }

  kok.Arayuz = {
    baglan: baglan, temaDegistir: temaDegistir, tamEkran: tamEkran, tuvalCiz: tuvalCiz,
    noktaEkle: noktaEkle, noktaSurukle: noktaSurukle, karistiriciCiz: karistiriciCiz,
    paletCiz: paletCiz, gradyanCiz: gradyanCiz, sanatPaneliCiz: sanatPaneliCiz,
    gecmisCiz: gecmisCiz, favoriCiz: favoriCiz, kontrastCiz: kontrastCiz, temaIzgaraCiz: temaIzgaraCiz,
    bildirim: bildirim, klavyeKisayollari: klavyeKisayollari, sekmeDegistir: sekmeDegistir,
    boyutlariYenile: boyutlariYenile, TEMALAR: TEMALAR, el: function () { return el; }
  };
})(typeof globalThis !== "undefined" ? globalThis : this);
