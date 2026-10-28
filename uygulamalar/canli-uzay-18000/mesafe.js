/* ============================================================
   Güneş Sistemi · Mesafe Haritası
   Saf Canvas 2D · harici kütüphane YOK
   ------------------------------------------------------------
   Ne çizer:
     • Güneş solda, gezegenler yatay eksende sıralı
     • Güneş'e uzaklık çizgileri (AU + km etiketli)
     • Gezegenler arası mesafe çizgileri (AU + km etiketli)
     • Boyutlar oransal (çap log-ölçekli, gerçek sıralama korunur)
     • Hover → bilgi kartı
   Ölçek:
     • 'log'    → karekök sıkıştırma (iç gezegenler okunur kalır)
     • 'gercek' → doğrusal (AU birebir)
   ============================================================ */

(function () {
  'use strict';

  var canvas = document.getElementById('sahne');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');

  var el = function (id) { return document.getElementById(id); };
  var kartBos = el('kartBos');
  var kartIc = el('kartIc');
  var kartAd = el('kartAd');
  var kartNokta = el('kartNokta');
  var kartGunes = el('kartGunes');
  var kartOnceki = el('kartOnceki');
  var kartCap = el('kartCap');
  var kartYil = el('kartYil');
  var olcekNot = el('olcekNot');
  var olcekBtnler = document.querySelectorAll('.olcek-btn');
  var chkGunesCizgi = el('gunesCizgi');
  var chkGezegenCizgi = el('gezegenCizgi');
  var chkBoyutOransal = el('boyutOransal');

  // ---------- SABİTLER ----------
  var AU_KM = 149597870.7;          // 1 astronomik birim (km)
  var GUNES_CAP = 1391400;          // Güneş çapı (km)

  // ---------- VERİ (AU: Güneş'e ortalama uzaklık) ----------
  var PLANETLER = [
    { ad: 'Merkür',  au: 0.387,  cap: 4879,   yil: 0.241, renk: '#b9b2a8' },
    { ad: 'Venüs',   au: 0.723,  cap: 12104,  yil: 0.615, renk: '#ffe6b0' },
    { ad: 'Dünya',   au: 1.000,  cap: 12756,  yil: 1.000, renk: '#7ec8ff' },
    { ad: 'Mars',    au: 1.524,  cap: 6792,   yil: 1.881, renk: '#ff9c6b' },
    { ad: 'Jüpiter', au: 5.203,  cap: 139820, yil: 11.86, renk: '#f4c1a0' },
    { ad: 'Satürn',  au: 9.537,  cap: 116460, yil: 29.45, renk: '#f3d4b0' },
    { ad: 'Üranüs',  au: 19.191, cap: 50724,  yil: 84.02, renk: '#a0e6ff' },
    { ad: 'Neptün',  au: 30.069, cap: 49244,  yil: 164.8, renk: '#91bff8' }
  ];

  // ---------- DURUM ----------
  var W = 0, H = 0, DPR = 1;
  var olcekModu = 'log';
  var gunesCizgi = true, gezegenCizgi = true, boyutOransal = true;
  var yildizlar = [];
  var noktalar = [];   // {x, y, r, p, i}
  var hoverIdx = -1;
  var zaman = 0;

  // ---------- YARDIMCILAR ----------
  function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }
  function yumusak(t) { return t * t * (3 - 2 * t); } // smoothstep

  function kmYaz(km) {
    if (km >= 1e9) return (km / 1e9).toFixed(2).replace('.', ',') + ' milyar km';
    if (km >= 1e6) return Math.round(km / 1e6) + ' milyon km';
    return Math.round(km).toLocaleString('tr-TR') + ' km';
  }

  function yilYaz(y) {
    if (y < 1) return (y * 365.25).toFixed(0) + ' gün';
    return y.toFixed(2).replace('.', ',') + ' yıl';
  }

  // Boyut: çap logaritmik sıkıştırma (küçükler görünür, sıralama doğru)
  function gezegenYaricap(cap) {
    var min = 4879, max = 139820;
    var t = (Math.log(cap) - Math.log(min)) / (Math.log(max) - Math.log(min)); // 0..1
    var taban = clamp(Math.min(W, H) * 0.0075, 3, 9);
    return taban + t * taban * 2.1;
  }

  // Konum: AU → ekran X
  function auToX(au, x0, x1) {
    var maxAu = PLANETLER[PLANETLER.length - 1].au;
    var t;
    if (olcekModu === 'log') {
      // karekök sıkıştırma
      t = Math.sqrt(au) / Math.sqrt(maxAu);
    } else {
      t = au / maxAu;
    }
    return x0 + t * (x1 - x0);
  }

  // ---------- YILDIZ ALANI ----------
  function yildizUret() {
    yildizlar = [];
    var sayi = Math.round((W * H) / 9000);
    sayi = clamp(sayi, 120, 520);
    for (var i = 0; i < sayi; i++) {
      var derinlik = Math.random();           // parallax katmanı
      yildizlar.push({
        x: Math.random() * W,
        y: Math.random() * H,
        r: 0.3 + derinlik * 1.4,
        a: 0.25 + Math.random() * 0.65,
        tw: Math.random() * Math.PI * 2,
        hiz: 0.4 + Math.random() * 1.6
      });
    }
  }

  // ---------- BOYUTLANDIRMA ----------
  function boyutlandir() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = Math.round(W * DPR);
    canvas.height = Math.round(H * DPR);
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    yildizUret();
    yerlesim();
  }

  // Nokta konumlarını (Güneş + gezegenler) hesapla
  function yerlesim() {
    noktalar = [];

    // Yatay yerleşim alanı: HUD ve panel boşlukları hesaba katılır
    var solBosluk = clamp(W * 0.10, 60, 150);
    var sagBosluk = clamp(W * 0.10, 70, 170);
    var x0 = solBosluk;
    var x1 = Math.max(x0 + 60, W - sagBosluk);
    var yOrta = H * 0.54;

    // Güneş
    var gunesR = clamp(Math.min(W, H) * 0.030, 11, 34);
    noktalar.push({ x: x0, y: yOrta, r: gunesR, gunes: true, i: -1 });

    for (var i = 0; i < PLANETLER.length; i++) {
      var p = PLANETLER[i];
      var r = boyutOransal ? gezegenYaricap(p.cap) : clamp(Math.min(W, H) * 0.011, 4, 12);
      noktalar.push({
        x: auToX(p.au, x0, x1),
        y: yOrta,
        r: r,
        p: p,
        au: p.au,
        i: i
      });
    }
  }

  // ---------- ÇİZİM PARÇALARI ----------
  function uzayZemini() {
    var g = ctx.createRadialGradient(W * 0.12, H * 0.5, 0, W * 0.12, H * 0.5, Math.max(W, H) * 0.75);
    g.addColorStop(0, '#0a1530');
    g.addColorStop(0.38, '#050a1c');
    g.addColorStop(1, '#02030a');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    // uzak nebula lekesi
    var n = ctx.createRadialGradient(W * 0.78, H * 0.22, 0, W * 0.78, H * 0.22, Math.max(W, H) * 0.42);
    n.addColorStop(0, 'rgba(80, 60, 180, 0.14)');
    n.addColorStop(1, 'rgba(80, 60, 180, 0)');
    ctx.fillStyle = n;
    ctx.fillRect(0, 0, W, H);
  }

  function yildizlariCiz(dt) {
    for (var i = 0; i < yildizlar.length; i++) {
      var s = yildizlar[i];
      s.tw += dt * s.hiz;
      var parlak = s.a * (0.55 + 0.45 * Math.sin(s.tw));
      ctx.beginPath();
      ctx.fillStyle = 'rgba(200, 222, 255, ' + parlak.toFixed(3) + ')';
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function gunesiCiz(g, t) {
    var nabiz = 1 + 0.018 * Math.sin(t * 1.6);

    // hale
    var halo = ctx.createRadialGradient(g.x, g.y, g.r * 0.6, g.x, g.y, g.r * 7);
    halo.addColorStop(0, 'rgba(255, 200, 90, 0.42)');
    halo.addColorStop(0.32, 'rgba(255, 150, 40, 0.16)');
    halo.addColorStop(1, 'rgba(255, 130, 20, 0)');
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(g.x, g.y, g.r * 7, 0, Math.PI * 2);
    ctx.fill();

    // çekirdek
    var kor = ctx.createRadialGradient(g.x, g.y, 0, g.x, g.y, g.r * nabiz);
    kor.addColorStop(0, '#fffdf0');
    kor.addColorStop(0.5, '#ffd45e');
    kor.addColorStop(1, '#ff8c1a');
    ctx.fillStyle = kor;
    ctx.beginPath();
    ctx.arc(g.x, g.y, g.r * nabiz, 0, Math.PI * 2);
    ctx.fill();

    // ışınlar
    ctx.save();
    ctx.translate(g.x, g.y);
    ctx.rotate(t * 0.14);
    for (var i = 0; i < 12; i++) {
      var a = (i / 12) * Math.PI * 2;
      var uzun = g.r * (1.5 + 0.45 * Math.sin(t * 2 + i));
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(255, 205, 110, ' + (0.16 + 0.12 * Math.sin(t * 2.4 + i)).toFixed(3) + ')';
      ctx.lineWidth = Math.max(1, g.r * 0.13);
      ctx.moveTo(Math.cos(a) * g.r * 1.06, Math.sin(a) * g.r * 1.06);
      ctx.lineTo(Math.cos(a) * g.r * uzun, Math.sin(a) * g.r * uzun);
      ctx.stroke();
    }
    ctx.restore();

    // etiket
    ctx.font = '600 ' + clamp(Math.round(g.r * 0.62), 12, 18) + 'px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = 'rgba(255, 226, 160, 0.95)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('GÜNEŞ', g.x, g.y + g.r * 1.35 + 16);
  }

  // İki nokta arasına çift yönlü ok + ortada etiket
  function olcuCiz(a, b, yKaydir, renk, anaMetin, altMetin) {
    var y = a.y + yKaydir;
    var x1 = a.x, x2 = b.x;
    if (x2 - x1 < 26) return; // sığmıyorsa çizme

    ctx.save();
    ctx.strokeStyle = renk;
    ctx.fillStyle = renk;
    ctx.lineWidth = 1;

    // çizgi
    ctx.beginPath();
    ctx.setLineDash([4, 4]);
    ctx.moveTo(x1, y);
    ctx.lineTo(x2, y);
    ctx.stroke();
    ctx.setLineDash([]);

    // uç okları
    var ok = 5;
    ctx.beginPath();
    ctx.moveTo(x1, y); ctx.lineTo(x1 + ok, y - ok * 0.6); ctx.lineTo(x1 + ok, y + ok * 0.6);
    ctx.closePath(); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x2, y); ctx.lineTo(x2 - ok, y - ok * 0.6); ctx.lineTo(x2 - ok, y + ok * 0.6);
    ctx.closePath(); ctx.fill();

    // bağlantı çizgileri (noktalardan ölçü hattına)
    ctx.globalAlpha = 0.45;
    ctx.beginPath();
    ctx.moveTo(x1, a.y + a.r); ctx.lineTo(x1, y);
    ctx.moveTo(x2, b.y + b.r); ctx.lineTo(x2, y);
    ctx.stroke();
    ctx.globalAlpha = 1;

    // etiket
    var orta = (x1 + x2) / 2;
    var metin = anaMetin + (altMetin ? '  ·  ' + altMetin : '');
    ctx.font = '600 11.5px "Segoe UI", system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    var gen = ctx.measureText(metin).width;
    var px = 7, py = 4, h = 18;
    ctx.globalAlpha = 0.82;
    ctx.fillStyle = '#040814';
    ctx.beginPath();
    var bx = orta - gen / 2 - px, by = y - h / 2;
    var bw = gen + px * 2, bh = h;
    var rr = 6;
    ctx.moveTo(bx + rr, by);
    ctx.arcTo(bx + bw, by, bx + bw, by + bh, rr);
    ctx.arcTo(bx + bw, by + bh, bx, by + bh, rr);
    ctx.arcTo(bx, by + bh, bx, by, rr);
    ctx.arcTo(bx, by, bx + bw, by, rr);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 1;

    ctx.fillStyle = renk;
    ctx.fillText(metin, orta, y + 0.5);
    ctx.restore();
  }

  function gezegeniCiz(np, t) {
    var p = np.p;
    var vurgulu = (np.i === hoverIdx);

    // gezegen gövdesi
    var g = ctx.createRadialGradient(
      np.x - np.r * 0.35, np.y - np.r * 0.35, np.r * 0.1,
      np.x, np.y, np.r
    );
    g.addColorStop(0, '#ffffff');
    g.addColorStop(0.35, p.renk);
    g.addColorStop(1, 'rgba(0,0,0,0.85)');

    // parlama
    ctx.save();
    ctx.shadowColor = p.renk;
    ctx.shadowBlur = vurgulu ? 26 : 12;
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(np.x, np.y, np.r * (vurgulu ? 1.12 : 1), 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // yörünge izi (Güneş'e bağlantı noktası)
    if (vurgulu) {
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(111, 195, 255, 0.5)';
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 5]);
      ctx.moveTo(noktalar[0].x, noktalar[0].y);
      ctx.lineTo(np.x, np.y);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // ad etiketi
    ctx.font = (vurgulu ? '700 ' : '500 ') + clamp(Math.round(np.r * 0.85), 12, 15) + 'px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = vurgulu ? '#ffffff' : 'rgba(223, 233, 255, 0.9)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText(p.ad.toUpperCase(), np.x, np.y - np.r - 9);

    // AU değeri
    ctx.font = '400 10.5px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = 'rgba(143, 163, 200, 0.9)';
    ctx.fillText(p.au.toFixed(2).replace('.', ',') + ' AU', np.x, np.y - np.r - 24);
  }

  // ---------- ANA ÇİZİM ----------
  function ciz(dt) {
    zaman += dt;
    ctx.clearRect(0, 0, W, H);

    uzayZemini();
    yildizlariCiz(dt);

    // ölçek çizgileri
    var g = noktalar[0];
    if (gunesCizgi) {
      for (var i = 1; i < noktalar.length; i++) {
        var np = noktalar[i];
        olcuCiz(
          g, np,
          -Math.max(46, H * 0.15),                 // güneş hattı yukarıda
          np.i === hoverIdx ? 'rgba(160, 220, 255, 0.95)' : 'rgba(111, 195, 255, 0.55)',
          np.p.au.toFixed(3).replace('.', ',') + ' AU',
          kmYaz(np.p.au * AU_KM)
        );
      }
    }

    if (gezegenCizgi) {
      for (var k = 2; k < noktalar.length; k++) {
        var on = noktalar[k - 1];
        var sn = noktalar[k];
        var fark = sn.p.au - on.p.au;
        olcuCiz(
          on, sn,
          Math.max(40, H * 0.13),                  // gezegen arası hat aşağıda
          (sn.i === hoverIdx || on.i === hoverIdx) ? 'rgba(255, 210, 122, 0.95)' : 'rgba(255, 210, 122, 0.5)',
          fark.toFixed(3).replace('.', ',') + ' AU',
          kmYaz(fark * AU_KM)
        );
      }
    }

    // gök cisimleri
    gunesiCiz(g, zaman);
    for (var m = 1; m < noktalar.length; m++) gezegeniCiz(noktalar[m], zaman);

    // alt bilgi
    ctx.font = '400 11px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = 'rgba(143, 163, 200, 0.55)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText(
      '1 AU = ' + kmYaz(AU_KM) + '  ·  ' + (olcekModu === 'log' ? 'sıkıştırılmış ölçek' : 'gerçek oran (doğrusal)'),
      W / 2, H - 10
    );
  }

  // ---------- ETKİLEŞİM ----------
  function hoverBul(mx, my) {
    var en = -1, enMesafe = Infinity;
    for (var i = 1; i < noktalar.length; i++) {
      var np = noktalar[i];
      var dx = mx - np.x, dy = my - np.y;
      var d = Math.sqrt(dx * dx + dy * dy);
      var esik = Math.max(np.r + 14, 20);
      if (d < esik && d < enMesafe) { enMesafe = d; en = np.i; }
    }
    return en;
  }

  function kartiGuncelle(idx) {
    if (idx < 0) {
      kartBos.hidden = false;
      kartIc.hidden = true;
      return;
    }
    var p = PLANETLER[idx];
    var onceki = idx === 0 ? null : PLANETLER[idx - 1];

    kartBos.hidden = true;
    kartIc.hidden = false;
    kartNokta.style.background = p.renk;
    kartNokta.style.color = p.renk;
    kartAd.textContent = p.ad;
    kartGunes.textContent = p.au.toFixed(3).replace('.', ',') + ' AU · ' + kmYaz(p.au * AU_KM);
    kartOnceki.textContent = onceki
      ? onceki.ad + ' → ' + kmYaz((p.au - onceki.au) * AU_KM)
      : 'Güneş\'e en yakın gezegen';
    kartCap.textContent = p.cap.toLocaleString('tr-TR') + ' km' +
      ' (' + (p.cap / GUNES_CAP * 100).toFixed(2).replace('.', ',') + '× Güneş)';
    kartYil.textContent = yilYaz(p.yil);
  }

  canvas.addEventListener('mousemove', function (e) {
    var yeni = hoverBul(e.clientX, e.clientY);
    if (yeni !== hoverIdx) {
      hoverIdx = yeni;
      kartiGuncelle(hoverIdx);
      canvas.style.cursor = hoverIdx >= 0 ? 'pointer' : 'crosshair';
    }
  });

  canvas.addEventListener('mouseleave', function () {
    hoverIdx = -1;
    kartiGuncelle(-1);
  });

  canvas.addEventListener('touchstart', function (e) {
    var t = e.touches[0];
    if (!t) return;
    hoverIdx = hoverBul(t.clientX, t.clientY);
    kartiGuncelle(hoverIdx);
  }, { passive: true });

  // Ölçek butonları
  for (var b = 0; b < olcekBtnler.length; b++) {
    olcekBtnler[b].addEventListener('click', function () {
      var mod = this.getAttribute('data-olcek');
      if (mod === olcekModu) return;
      olcekModu = mod;
      for (var j = 0; j < olcekBtnler.length; j++) {
        olcekBtnler[j].classList.toggle('aktif', olcekBtnler[j] === this);
      }
      olcekNot.textContent = olcekModu === 'log'
        ? 'Sıkıştırılmış ölçek (karekök) — iç gezegenler okunur kalsın diye Neptün mesafesi görsel olarak sıkıştırıldı'
        : 'Gerçek oran — mesafeler AU birebir. Dikkat: iç gezegenler Güneş\'in yanında üst üste biner';
      yerlesim();
    });
  }

  // Onay kutuları
  if (chkGunesCizgi) chkGunesCizgi.addEventListener('change', function () { gunesCizgi = this.checked; });
  if (chkGezegenCizgi) chkGezegenCizgi.addEventListener('change', function () { gezegenCizgi = this.checked; });
  if (chkBoyutOransal) chkBoyutOransal.addEventListener('change', function () {
    boyutOransal = this.checked;
    yerlesim();
  });

  window.addEventListener('resize', boyutlandir);

  // ---------- DÖNGÜ ----------
  var sonZaman = 0;
  function dongu(now) {
    if (!sonZaman) sonZaman = now;
    var dt = Math.min((now - sonZaman) / 1000, 0.05);
    sonZaman = now;
    ciz(dt);
    requestAnimationFrame(dongu);
  }

  // ---------- BAŞLAT ----------
  boyutlandir();
  kartiGuncelle(-1);
  requestAnimationFrame(dongu);

  // Dışa açık sözleşme (doğrulama için)
  window.__mesafeHarita = {
    gezegenSayisi: PLANETLER.length,
    olcek: function () { return olcekModu; },
    hover: function () { return hoverIdx; },
    auKm: AU_KM,
    hazir: true
  };
})();
