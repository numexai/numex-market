/* Numex Renk Stüdyosu — canvas sanat modları + interaktif tuval */
(function (kok) {
  "use strict";
  var R = kok.RenkMotoru;

  var canvas = null, ctx = null, renkler = [], ayar = { hiz: 1, yogunluk: 0.6, calisiyor: true };
  var t = 0, son = 0, raf = null, mod = "dalga";
  var imlec = { x: 0.5, y: 0.5, aktif: false, enerji: 0 };

  var MODLAR = [
    { id: "dalga", ad: "Dalga" },
    { id: "aurora", ad: "Aurora" },
    { id: "bulut", ad: "Akışkan Bulut" },
    { id: "geometrik", ad: "Geometrik" },
    { id: "halka", ad: "Işık Halkaları" }
  ];

  function boyutlandir() {
    if (!canvas) return;
    var dpr = Math.min(kok.devicePixelRatio || 1, 2);
    var w = canvas.clientWidth || 800, h = canvas.clientHeight || 480;
    canvas.width = Math.max(1, Math.round(w * dpr));
    canvas.height = Math.max(1, Math.round(h * dpr));
    ctx = canvas.getContext("2d");
    if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ciz();
  }

  function baslat(c, r, a) {
    canvas = c;
    renkler = (r || []).slice();
    if (a) ayar = Object.assign(ayar, a);
    boyutlandir();
    son = 0;
    if (raf) cancelAnimationFrame(raf);
    raf = requestAnimationFrame(dongu);
  }

  function dongu(zaman) {
    var dt = son ? Math.min((zaman - son) / 1000, 0.05) : 0.016;
    son = zaman;
    if (ayar.calisiyor) {
      t += dt * ayar.hiz;
      imlec.enerji *= 0.94;
      ciz();
    }
    raf = requestAnimationFrame(dongu);
  }

  function ciz() {
    if (!ctx || !canvas) return;
    var w = canvas.clientWidth || 800, h = canvas.clientHeight || 480;
    ctx.save();
    // NUMEX-DÜZELTME (2026-11-20): Mod değişiminde canvas tam boyutlu (DPR ölçekli) temizlenmiyordu; yalnız CSS piksel alanı clearRect ile siliniyor ve globalCompositeOperation 'lighter' modundan çıkış garantisi yoktu. Sonuç: yeni modun arka planı eskisini tamamen örtmüyor, sol üstte önceki karenin izi kalıyordu (canlı ekran görüntüsünde görüldü). Tam transform + kaynak-normal karışım moduyla temizlendi.
    /* kök düzeltme: mod değişiminde önceki karenin artığı kalmasın */
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 1;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    var dpr = canvas.width / Math.max(w, 1);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (!renkler.length) renkler = ["#ff6b6b", "#48dbfb"];
    var fn = { dalga: cizDalga, aurora: cizAurora, bulut: cizBulut, geometrik: cizGeometrik, halka: cizHalka }[mod] || cizDalga;
    fn(ctx, t, renkler, ayar, w, h);
    ctx.restore();
  }

  function durdur() { ayar.calisiyor = false; ciz(); }
  function devam() { ayar.calisiyor = true; son = 0; }
  function modDegistir(m) { mod = m; ciz(); }
  function ayarGuncelle(yeni) { ayar = Object.assign(ayar, yeni || {}); ciz(); }
  function renkAyarla(r) { renkler = (r || []).slice(); ciz(); }
  function imlecGuncelle(x, y) { imlec.x = x; imlec.y = y; imlec.enerji = 1; }

  /* ---------- mod çizimleri ---------- */
  function cizDalga(c, zaman, rk, ay, w, h) {
    var yog = ay.yogunluk;
    var arka = c.createLinearGradient(0, 0, w, h);
    arka.addColorStop(0, rk[0]);
    arka.addColorStop(1, rk[rk.length - 1]);
    c.globalAlpha = 0.14;
    c.fillStyle = arka;
    c.fillRect(0, 0, w, h);
    c.globalAlpha = 1;

    var katman = 7;
    for (var i = 0; i < katman; i++) {
      var renk = rk[i % rk.length];
      var faz = zaman * (0.6 + i * 0.13) + i * 0.9;
      var genlik = h * (0.06 + yog * 0.16) * (1 + i * 0.08) * (1 + imlec.enerji * 0.3);
      var taban = h * (0.18 + (i / katman) * 0.72);
      c.beginPath();
      c.moveTo(0, h);
      for (var x = 0; x <= w; x += 6) {
        var nx = x / w;
        var y = taban + Math.sin(nx * 5.5 + faz) * genlik + Math.sin(nx * 11 - faz * 0.6) * genlik * 0.35;
        var mesafe = Math.hypot(nx - imlec.x, (y / h) - imlec.y);
        y -= Math.exp(-mesafe * 4) * imlec.enerji * 34;
        c.lineTo(x, y);
      }
      c.lineTo(w, h);
      c.closePath();
      var g = c.createLinearGradient(0, taban - genlik, w, h);
      g.addColorStop(0, hexA(renk, 0.78));
      g.addColorStop(1, hexA(renk, 0.12));
      c.fillStyle = g;
      c.fill();
      c.strokeStyle = hexA(renk, 0.55);
      c.lineWidth = 1.2;
      c.stroke();
    }
  }

  function cizAurora(c, zaman, rk, ay, w, h) {
    c.fillStyle = "#04060f";
    c.fillRect(0, 0, w, h);
    c.globalCompositeOperation = "lighter";
    var serit = 5;
    for (var i = 0; i < serit; i++) {
      var renk = rk[i % rk.length];
      var cx = w * (0.15 + 0.7 * ((i + 0.5) / serit)) + Math.sin(zaman * 0.5 + i) * w * 0.06;
      var g = c.createRadialGradient(cx, h * 0.25, 0, cx, h * 0.4, w * (0.22 + ay.yogunluk * 0.4));
      g.addColorStop(0, hexA(renk, 0.55));
      g.addColorStop(0.5, hexA(renk, 0.2));
      g.addColorStop(1, hexA(renk, 0));
      c.fillStyle = g;
      c.beginPath();
      c.ellipse(cx, h * (0.42 + Math.sin(zaman * 0.7 + i * 1.3) * 0.08), w * (0.2 + ay.yogunluk * 0.34), h * (0.5 + ay.yogunluk * 0.5), 0, 0, Math.PI * 2);
      c.fill();
    }
    for (var y = 0; y < h; y += 3) {
      c.fillStyle = "rgba(0,0,0," + (0.05 + (y / h) * 0.22) + ")";
      c.fillRect(0, y, w, 2);
    }
    c.globalCompositeOperation = "source-over";
  }

  function cizBulut(c, zaman, rk, ay, w, h) {
    var g0 = c.createLinearGradient(0, 0, w, h);
    g0.addColorStop(0, hexA(rk[0], 1));
    g0.addColorStop(1, hexA(rk[rk.length - 1], 1));
    c.fillStyle = g0;
    c.fillRect(0, 0, w, h);
    c.globalCompositeOperation = "lighter";
    var lekeler = 9;
    for (var i = 0; i < lekeler; i++) {
      var renk = rk[i % rk.length];
      var faz = zaman * (0.35 + i * 0.05) + i * 1.7;
      var x = w * (0.5 + 0.42 * Math.sin(faz * 0.8 + i));
      var y = h * (0.5 + 0.4 * Math.cos(faz * 0.6 + i * 2));
      var r = w * (0.12 + ay.yogunluk * 0.26) * (0.7 + 0.5 * Math.sin(faz + i));
      var g = c.createRadialGradient(x, y, 0, x, y, Math.max(r, 1));
      g.addColorStop(0, hexA(renk, 0.75));
      g.addColorStop(1, hexA(renk, 0));
      c.fillStyle = g;
      c.beginPath();
      c.arc(x, y, Math.max(r, 1), 0, Math.PI * 2);
      c.fill();
    }
    c.globalCompositeOperation = "source-over";
  }

  function cizGeometrik(c, zaman, rk, ay, w, h) {
    c.fillStyle = "#0a0a12";
    c.fillRect(0, 0, w, h);
    var adet = Math.round(10 + ay.yogunluk * 30);
    var boy = Math.min(w, h) / 9;
    c.save();
    for (var i = 0; i < adet; i++) {
      var renk = rk[i % rk.length];
      var aci = zaman * (0.25 + (i % 5) * 0.07) + i;
      var merkezX = w / 2 + Math.cos(aci + i) * w * 0.32;
      var merkezY = h / 2 + Math.sin(aci * 1.3 + i) * h * 0.32;
      c.save();
      c.translate(merkezX, merkezY);
      c.rotate(aci);
      c.strokeStyle = hexA(renk, 0.75);
      c.lineWidth = 2;
      c.fillStyle = hexA(renk, 0.12);
      c.beginPath();
      var kenar = 3 + (i % 4);
      for (var k = 0; k < kenar; k++) {
        var a = (k / kenar) * Math.PI * 2;
        var px = Math.cos(a) * boy, py = Math.sin(a) * boy;
        if (k === 0) c.moveTo(px, py); else c.lineTo(px, py);
      }
      c.closePath();
      c.fill();
      c.stroke();
      c.restore();
    }
    c.restore();
  }

  function cizHalka(c, zaman, rk, ay, w, h) {
    c.fillStyle = "#05040a";
    c.fillRect(0, 0, w, h);
    c.globalCompositeOperation = "lighter";
    var adet = Math.round(6 + ay.yogunluk * 16);
    var cx = w / 2 + Math.sin(zaman * 0.4) * w * 0.05;
    var cy = h / 2 + Math.cos(zaman * 0.33) * h * 0.05;
    for (var i = 0; i < adet; i++) {
      var renk = rk[i % rk.length];
      var faz = zaman * (0.5 + (i % 3) * 0.2) + i * 0.6;
      var r = (Math.min(w, h) * 0.06) * (i + 1) * (0.7 + 0.3 * Math.sin(faz));
      c.strokeStyle = hexA(renk, 0.45 + 0.3 * Math.sin(faz * 1.4));
      c.lineWidth = 1 + (i % 4);
      c.beginPath();
      c.arc(cx, cy, Math.max(r, 1), 0, Math.PI * 2);
      c.stroke();
    }
    var g = c.createRadialGradient(cx, cy, 0, cx, cy, Math.min(w, h) * 0.4);
    g.addColorStop(0, hexA(rk[0], 0.5));
    g.addColorStop(1, hexA(rk[0], 0));
    c.fillStyle = g;
    c.beginPath();
    c.arc(cx, cy, Math.min(w, h) * 0.4, 0, Math.PI * 2);
    c.fill();
    c.globalCompositeOperation = "source-over";
  }

  function hexA(hex, alfa) {
    var c = R.hexToRgb(hex);
    return "rgba(" + c.r + "," + c.g + "," + c.b + "," + alfa + ")";
  }

  var api = {
    MODLAR: MODLAR, baslat: baslat, durdur: durdur, devam: devam, modDegistir: modDegistir,
    ayarGuncelle: ayarGuncelle, boyutlandir: boyutlandir, renkAyarla: renkAyarla,
    imlecGuncelle: imlecGuncelle, ciz: ciz,
    cizDalga: cizDalga, cizAurora: cizAurora, cizBulut: cizBulut, cizGeometrik: cizGeometrik, cizHalka: cizHalka,
    durum: function () { return { mod: mod, ayar: ayar }; }
  };
  kok.Sanat = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
