/* ============================================================
   18.000 ALEM — Canlı Uzay Motoru
   Saf Canvas 2D · harici kütüphane YOK
   ------------------------------------------------------------
   KATMANLAR:
     1. Derin uzay / yıldız alanı (parallax)
     2. Nebula toz bulutları
     3. Güneş (nabız kor + taç + alev dili)
     4. Gezegenler (kendi ekseninde döner + yörüngede dolaşır)
     5. Ay (Dünya'nın etrafında kilitli + kendi ekseninde döner)
     6. İlahi Güç (merkezden yayılan halkalar + aurа)
   ============================================================ */
(function () {
  'use strict';

  var tuval = document.getElementById('evren');
  var ctx = tuval.getContext('2d', { alpha: false });

  /* ---------- AYARLAR (panelden değişir) ---------- */
  var AYAR = {
    hiz: 1.0,          // evren hızı çarpanı
    ilahi: 0.75,       // ilahi güç şiddeti 0..1
    yildizSayisi: 800,
    yorunge: true,
    etiket: false,
    duraklat: false
  };

  /* ---------- ZAMAN ---------- */
  var zaman = 0;        // saniye, hız ile çarpılarak artar
  var sonAn = 0;
  var fpsSayac = 0, fpsZaman = 0, fps = 0;

  /* ---------- BOYUT ---------- */
  var G = 0, Y = 0;     // genişlik, yükseklik (CSS px)
  var merkezX = 0, merkezY = 0;
  var DPR = 1;
  var olcek = 1;        // ekrana göre ölçek (responsive)

  function boyutlandir() {
    G = window.innerWidth;
    Y = window.innerHeight;
    DPR = Math.min(window.devicePixelRatio || 1, 2);

    tuval.width = Math.floor(G * DPR);
    tuval.height = Math.floor(Y * DPR);
    tuval.style.width = G + 'px';
    tuval.style.height = Y + 'px';

    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    merkezX = G / 2;
    merkezY = Y / 2;

    // Uzay haritası ekrana sığsın: kısa kenarı referans al
    olcek = Math.min(G, Y) / 900;
    olcek = Math.max(0.42, Math.min(olcek, 1.45));

    yildizlariUret();
  }

  /* ============================================================
     1) YILDIZ ALANI — derinlikli parallax
     ============================================================ */
  var yildizlar = [];

  function yildizlariUret() {
    yildizlar.length = 0;
    var n = Math.floor(AYAR.yildizSayisi);
    for (var i = 0; i < n; i++) {
      var derinlik = Math.random();               // 0 = uzak, 1 = yakın
      var t = Math.random();
      var tip;
      if (t > 0.965) tip = 'buyuk';
      else if (t > 0.86) tip = 'orta';
      else tip = 'kucuk';

      yildizlar.push({
        x: Math.random() * G,
        y: Math.random() * Y,
        // uzaktaki yıldızlar daha küçük ve sönük (atmosferik derinlik)
        r: (tip === 'buyuk' ? 1.5 : tip === 'orta' ? 1.0 : 0.55) * (0.5 + derinlik * 1.1),
        alfa: 0.25 + derinlik * 0.7,
        derinlik: derinlik,
        // yıldızların kendi rengi: mavi-beyaz / sıcak sarı karışımı
        renk: Math.random() > 0.72
          ? (Math.random() > 0.5 ? [255, 226, 178] : [186, 214, 255])
          : [240, 246, 255],
        // her yıldızın kendi titreme fazı
        faz: Math.random() * Math.PI * 2,
        hiz: 0.25 + Math.random() * 0.9
      });
    }
  }

  function yildizlariCiz(dt) {
    // Parallax: zamanla hafif yana kayar (evren genişliyormuş hissi)
    var kaymaX = Math.sin(zaman * 0.02) * 14;
    var kaymaY = Math.cos(zaman * 0.017) * 10;

    for (var i = 0; i < yildizlar.length; i++) {
      var s = yildizlar[i];
      var px = s.x + kaymaX * s.derinlik;
      var py = s.y + kaymaY * s.derinlik;

      // sarmalama (ekran dışına çıkınca karşıdan gir)
      if (px < -4) px += G + 8; else if (px > G + 4) px -= G + 8;
      if (py < -4) py += Y + 8; else if (py > Y + 4) py -= Y + 8;

      // titreme
      var titrek = 0.68 + 0.32 * Math.sin(zaman * s.hiz + s.faz);
      var a = s.alfa * titrek;
      var r = s.r * (0.92 + 0.08 * titrek);

      ctx.beginPath();
      ctx.fillStyle = 'rgba(' + s.renk[0] + ',' + s.renk[1] + ',' + s.renk[2] + ',' + a.toFixed(3) + ')';
      ctx.arc(px, py, r, 0, 6.2832);
      ctx.fill();

      // parlak büyük yıldızlara ışık halesi
      if (s.r > 1.4 && a > 0.5) {
        var g = ctx.createRadialGradient(px, py, 0, px, py, r * 7);
        g.addColorStop(0, 'rgba(' + s.renk[0] + ',' + s.renk[1] + ',' + s.renk[2] + ',' + (a * 0.30).toFixed(3) + ')');
        g.addColorStop(1, 'rgba(' + s.renk[0] + ',' + s.renk[1] + ',' + s.renk[2] + ',0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(px, py, r * 7, 0, 6.2832);
        ctx.fill();
      }
    }
  }

  /* ============================================================
     2) NEBULA — uzak toz bulutları ve "ilahi ışık" sisi
     ============================================================ */
  var nebulalar = [
    { xf: 0.16, yf: 0.20, r: 300, renk: [150, 92, 255],  a: 0.10 },
    { xf: 0.86, yf: 0.30, r: 260, renk: [58, 140, 255],  a: 0.09 },
    { xf: 0.72, yf: 0.84, r: 330, renk: [255, 118, 190], a: 0.07 },
    { xf: 0.10, yf: 0.80, r: 280, renk: [64, 220, 210],  a: 0.07 },
    { xf: 0.50, yf: 0.05, r: 350, renk: [255, 190, 90],  a: 0.06 }
  ];

  function nebulalariCiz() {
    for (var i = 0; i < nebulalar.length; i++) {
      var nb = nebulalar[i];
      var cx = G * nb.xf + Math.sin(zaman * 0.06 + i) * 26;
      var cy = Y * nb.yf + Math.cos(zaman * 0.05 + i * 1.7) * 22;
      var r = nb.r * (0.6 + olcek * 0.7) * (1 + 0.07 * Math.sin(zaman * 0.1 + i));

      var g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
      var c = nb.renk;
      g.addColorStop(0, 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + (nb.a * 1.5).toFixed(3) + ')');
      g.addColorStop(0.45, 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + (nb.a * 0.55).toFixed(3) + ')');
      g.addColorStop(1, 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, 6.2832);
      ctx.fill();
    }
  }

  /* ============================================================
     3) GÜNEŞ — nabız gibi atan kor + taç + alev dili
     ============================================================ */
  var gunesR = 30;

  function gunesCiz() {
    var R = gunesR * olcek;
    var nabiz = 1 + 0.045 * Math.sin(zaman * 1.5) + 0.022 * Math.sin(zaman * 3.7 + 1.1);
    var r = R * nabiz;

    // --- Dev dış taç (corona) ---
    var tacR = r * 8.5;
    var gt = ctx.createRadialGradient(merkezX, merkezY, r * 0.9, merkezX, merkezY, tacR);
    gt.addColorStop(0.00, 'rgba(255, 226, 160, 0.55)');
    gt.addColorStop(0.12, 'rgba(255, 178, 70, 0.30)');
    gt.addColorStop(0.34, 'rgba(255, 120, 40, 0.13)');
    gt.addColorStop(0.65, 'rgba(190, 90, 255, 0.05)');
    gt.addColorStop(1.00, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = gt;
    ctx.beginPath();
    ctx.arc(merkezX, merkezY, tacR, 0, 6.2832);
    ctx.fill();

    // --- Alev dilleri (dönen ışın demetleri) ---
    var dilSayisi = 14;
    for (var i = 0; i < dilSayisi; i++) {
      var aci = (i / dilSayisi) * 6.2832 + zaman * 0.22;
      var uzunluk = r * (1.5 + 0.85 * (0.5 + 0.5 * Math.sin(zaman * 2.1 + i * 2.4)));
      var genislik = 0.09 + 0.05 * Math.sin(zaman * 1.3 + i);
      ctx.beginPath();
      ctx.moveTo(merkezX + Math.cos(aci - genislik) * r, merkezY + Math.sin(aci - genislik) * r);
      ctx.lineTo(merkezX + Math.cos(aci) * uzunluk, merkezY + Math.sin(aci) * uzunluk);
      ctx.lineTo(merkezX + Math.cos(aci + genislik) * r, merkezY + Math.sin(aci + genislik) * r);
      ctx.closePath();
      ctx.fillStyle = 'rgba(255, 196, 96, ' + (0.045 + AYAR.ilahi * 0.05).toFixed(3) + ')';
      ctx.fill();
    }

    // --- Kor: çekirdek ---
    var gk = ctx.createRadialGradient(merkezX - r * 0.15, merkezY - r * 0.15, r * 0.05, merkezX, merkezY, r);
    gk.addColorStop(0.00, 'rgba(255, 255, 245, 1)');
    gk.addColorStop(0.22, 'rgba(255, 245, 200, 1)');
    gk.addColorStop(0.48, 'rgba(255, 206, 92, 1)');
    gk.addColorStop(0.75, 'rgba(255, 150, 46, 1)');
    gk.addColorStop(1.00, 'rgba(255, 96, 20, 0.95)');
    ctx.fillStyle = gk;
    ctx.beginPath();
    ctx.arc(merkezX, merkezY, r, 0, 6.2832);
    ctx.fill();

    // --- Yüzey granülasyonu (konveksiyon hücreleri) ---
    ctx.save();
    ctx.beginPath();
    ctx.arc(merkezX, merkezY, r, 0, 6.2832);
    ctx.clip();
    for (var j = 0; j < 16; j++) {
      var ja = (j / 16) * 6.2832 + zaman * 0.45;
      var jr = r * (0.25 + ((j * 7919) % 100) / 100 * 0.6);
      var jx = merkezX + Math.cos(ja) * jr;
      var jy = merkezY + Math.sin(ja) * jr;
      var jrad = r * (0.16 + 0.1 * Math.sin(zaman * 1.9 + j));
      var gg = ctx.createRadialGradient(jx, jy, 0, jx, jy, jrad);
      gg.addColorStop(0, 'rgba(255, 255, 230, 0.16)');
      gg.addColorStop(1, 'rgba(255, 140, 40, 0)');
      ctx.fillStyle = gg;
      ctx.beginPath();
      ctx.arc(jx, jy, jrad, 0, 6.2832);
      ctx.fill();
    }
    ctx.restore();
  }

  /* ============================================================
     4) GEZEGENLER — her biri kendi ekseninde döner,
        aynı zamanda güneşin etrafında yörüngede dolaşır.
     ------------------------------------------------------------
     yariBuyuk : yörünge yarıçapı (uzay birimi, olcek ile çarpılır)
     disMerkez : yörüngenin dışmerkezliliği (0 = tam daire)
     periyot   : yörünge tur süresi (saniye)
     gun       : kendi ekseninde bir tur (saniye)
     egim      : eksen eğikliği (derece) — görsel çarpıklık
     egimAcisi : kendi ekseninin ekranda dönüş açısı (rad)
  ============================================================ */
  var gezegenVerisi = [
    { ad: 'Merkür', yariBuyuk: 62,  disMerkez: 0.14, periyot: 9,   gun: 2.0,  egim: 0.5,  yaricap: 4.2,
      renk1: '#b9b2a8', renk2: '#6d655d', leke: 'rgba(255,255,255,0.10)', halka: null },

    { ad: 'Venüs',  yariBuyuk: 88,  disMerkez: 0.08, periyot: 15,  gun: 3.6,  egim: 2.6,  yaricap: 6.6,
      renk1: '#ffe6b0', renk2: '#c98f3c', leke: 'rgba(255,255,255,0.14)', halka: null },

    { ad: 'Dünya',  yariBuyuk: 120, disMerkez: 0.06, periyot: 24,  gun: 5.0,  egim: 23.4, yaricap: 7.0,
      renk1: '#7ec8ff', renk2: '#16407a', leke: 'rgba(120,220,140,0.55)', halka: null,
      ay: true },

    { ad: 'Mars',   yariBuyuk: 156, disMerkez: 0.17, periyot: 38,  gun: 5.1,  egim: 25.2, yaricap: 5.4,
      renk1: '#ff9c6b', renk2: '#8c2f10', leke: 'rgba(255,255,255,0.18)', halka: null,
      uydu: 2 },

    { ad: 'Jüpiter', yariBuyuk: 208, disMerkez: 0.10, periyot: 62, gun: 7.5,  egim: 3.1,  yaricap: 15.0,
      renk1: '#f4d7a8', renk2: '#a97a42', leke: 'rgba(160,110,60,0.55)', halka: null,
      bantli: true, uydu: 4 },

    { ad: 'Satürn', yariBuyuk: 272, disMerkez: 0.12, periyot: 92, gun: 8.6,  egim: 26.7, yaricap: 12.6,
      renk1: '#ffe9b8', renk2: '#b78d3f', leke: 'rgba(255,255,255,0.10)', halka: 'saturn', bantli: true, uydu: 3 },

    { ad: 'Uranüs', yariBuyuk: 330, disMerkez: 0.09, periyot: 124, gun: 9.4, egim: 97.8, yaricap: 9.4,
      renk1: '#bff0ee', renk2: '#2b7f8a', leke: 'rgba(255,255,255,0.08)', halka: 'ince', uydu: 2 },

    { ad: 'Neptün', yariBuyuk: 386, disMerkez: 0.07, periyot: 160, gun: 10.2, egim: 28.3, yaricap: 9.0,
      renk1: '#9db8ff', renk2: '#1f2f8c', leke: 'rgba(255,255,255,0.10)', halka: null, uydu: 2 },

    { ad: 'Plüton', yariBuyuk: 440, disMerkez: 0.24, periyot: 205, gun: 12.0, egim: 119.6, yaricap: 3.6,
      renk1: '#d9cfc4', renk2: '#6b6258', leke: 'rgba(255,255,255,0.12)', halka: null }
  ];

  var gezegenler = [];

  function gezegenleriKur() {
    gezegenler.length = 0;
    for (var i = 0; i < gezegenVerisi.length; i++) {
      var v = gezegenVerisi[i];
      gezegenler.push({
        v: v,
        baslangicAci: (i / gezegenVerisi.length) * 6.2832 + i * 0.35,
        donmeFazi: Math.random() * 6.2832,
        // yörünge düzlemi hafif eğik dursun ki 3B hissi versin
        duzlemEgim: 0.12 + i * 0.028,
        // kendi eksenindeki leke deseni için tohum
        lekeTohum: Math.random() * 1000,
        uydular: [],
        // görsel konum (her karede güncellenir)
        x: 0, y: 0, derinlikZ: 0
      });

      // Güneşe yakın olanlar daha hızlı dönsün (Kepler hissi)
      var g = gezegenler[i];
      var uyduSayisi = v.uydu || 0;
      for (var u = 0; u < uyduSayisi; u++) {
        g.uydular.push({
          uzaklik: (v.yaricap + 8 + u * 7) ,          // olcek ile çarpılır
          periyot: 3.5 + u * 2.3,
          aci: Math.random() * 6.2832,
          yaricap: 1.4 + Math.random() * 1.6,
          egim: (Math.random() - 0.5) * 0.9,
          renk: Math.random() > 0.5 ? '#e8eefc' : '#c9bda8'
        });
      }
    }
    // Ay'ı ayrıca Dünya'ya bağlı olarak da çiziyoruz (aşağıda)
  }

  /* --- Gezegen üzerinde yüzey şeritleri/lekeleri --- */
  function gezegenYuzeyi(g, r, x, y) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, r, 0, 6.2832);
    ctx.clip();

    var v = g.v;

    // Bantlı dev gezegenler (Jüpiter/Satürn) için yatay kuşaklar
    if (v.bantli) {
      var kuşakSayisi = 9;
      for (var b = 0; b < kuşakSayisi; b++) {
        var oran = b / kuşakSayisi;
        var kayma = Math.sin(zaman * 0.35 + g.lekeTohum + b) * r * 0.34;
        var yb = y - r + oran * r * 2;
        ctx.globalAlpha = 0.16 + 0.12 * Math.sin(g.lekeTohum + b * 1.9);
        ctx.fillStyle = b % 2 === 0 ? 'rgba(255,240,210,0.9)' : 'rgba(120,80,40,0.9)';
        ctx.beginPath();
        ctx.ellipse(x + kayma, yb, r * 1.1, r * 0.11, 0, 0, 6.2832);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    // Dünya için kıtalar (yeşil-mavi doku)
    if (v.ad === 'Dünya') {
      for (var k = 0; k < 5; k++) {
        var ka = g.donmeFazi + zaman * 0.5 + k * 1.9;
        var kx = x + Math.cos(ka) * r * 0.5;
        var kgenislik = Math.abs(Math.sin(ka)) * r * 0.42 + 2;
        if (Math.cos(ka) < 0.1) {
          ctx.globalAlpha = 0.55 + 0.3 * Math.abs(Math.sin(ka));
          ctx.fillStyle = 'rgba(96,180,110,0.85)';
          ctx.beginPath();
          ctx.ellipse(kx, y + Math.sin(ka * 1.7) * r * 0.35, kgenislik, kgenislik * 0.62, 0.3, 0, 6.2832);
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
    }

    // Genel yüzey lekeleri (dönüşle birlikte kayar → dönüş hissi)
    for (var i = 0; i < 7; i++) {
      var a = g.donmeFazi + zaman * (6.2832 / v.gun) + i * 1.13;
      var lx = x + Math.cos(a) * r * 0.62;
      var ly = y + Math.sin(i * 2.3 + g.lekeTohum) * r * 0.42;
      var lr = r * (0.10 + 0.06 * Math.sin(i + g.lekeTohum));
      // arka yüzde kalanlar görünmesin
      var onMu = Math.cos(a) > -0.2;
      if (!onMu) continue;
      ctx.globalAlpha = 0.20 * (0.4 + 0.6 * Math.cos(a));
      ctx.fillStyle = v.leke;
      ctx.beginPath();
      ctx.arc(lx, ly, lr, 0, 6.2832);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Gece/gündüz ayrımı (terminatör): güneşe bakan yüz aydınlık
    var gxAcisi = Math.atan2(y - merkezY, x - merkezX);
    var gt = ctx.createLinearGradient(
      x - Math.cos(gxAcisi) * r, y - Math.sin(gxAcisi) * r,
      x + Math.cos(gxAcisi) * r, y + Math.sin(gxAcisi) * r
    );
    gt.addColorStop(0.00, 'rgba(255,255,255,0.30)');
    gt.addColorStop(0.42, 'rgba(255,255,255,0.02)');
    gt.addColorStop(0.58, 'rgba(0,0,10,0.55)');
    gt.addColorStop(1.00, 'rgba(0,0,12,0.88)');
    ctx.fillStyle = gt;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, 6.2832);
    ctx.fill();

    ctx.restore();
  }

  /* --- Halka (Satürn / Uranüs) --- */
  function halkaCiz(g, r, x, y, onTaraf) {
    var v = g.v;
    if (!v.halka) return;

    var egik = 0.42;                    // halkanın dikey ezilme oranı
    var disR = v.halka === 'saturn' ? r * 2.25 : r * 1.55;
    var icR  = v.halka === 'saturn' ? r * 1.38 : r * 1.22;
    var yari = v.halka === 'saturn' ? 0.5 : 0.10;

    ctx.save();
    ctx.globalAlpha = v.halka === 'saturn' ? 0.85 : 0.35;
    ctx.lineWidth = disR - icR;
    ctx.strokeStyle = v.halka === 'saturn'
      ? 'rgba(255, 233, 190, 0.75)'
      : 'rgba(190, 240, 245, 0.6)';
    ctx.beginPath();
    // 0..PI = arka yarı, PI..2PI = ön yarı
    if (onTaraf) ctx.ellipse(x, y, (disR + icR) / 2, ((disR + icR) / 2) * egik, 0, 0, 3.1416);
    else         ctx.ellipse(x, y, (disR + icR) / 2, ((disR + icR) / 2) * egik, 0, 3.1416, 6.2832);
    ctx.stroke();

    // Halka içi ince ayırıcı (Cassini boşluğu)
    if (v.halka === 'saturn') {
      ctx.globalAlpha = 0.5;
      ctx.lineWidth = 1.2;
      ctx.strokeStyle = 'rgba(20, 14, 6, 0.7)';
      ctx.beginPath();
      var orta = icR + (disR - icR) * 0.62;
      if (onTaraf) ctx.ellipse(x, y, orta, orta * egik, 0, 0, 3.1416);
      else         ctx.ellipse(x, y, orta, orta * egik, 0, 3.1416, 6.2832);
      ctx.stroke();
    }
    ctx.restore();
  }

  /* --- Gezegen gövdesi --- */
  function gezegenCiz(g) {
    var v = g.v;
    var x = g.x, y = g.y;
    var r = v.yaricap * olcek * (1 + g.derinlikZ * 0.04);

    // Güneşten gelen aydınlanma halesi
    var gg = ctx.createRadialGradient(x, y, r * 0.85, x, y, r * 2.6);
    gg.addColorStop(0, 'rgba(255, 235, 190, 0.16)');
    gg.addColorStop(1, 'rgba(255, 235, 190, 0)');
    ctx.fillStyle = gg;
    ctx.beginPath();
    ctx.arc(x, y, r * 2.6, 0, 6.2832);
    ctx.fill();

    // Arka halka
    halkaCiz(g, r, x, y, false);

    // Gövde
    var gb = ctx.createRadialGradient(
      x - r * 0.32, y - r * 0.34, r * 0.08,
      x, y, r
    );
    gb.addColorStop(0.00, v.renk1);
    gb.addColorStop(0.55, v.renk1);
    gb.addColorStop(0.86, v.renk2);
    gb.addColorStop(1.00, 'rgba(4,6,18,0.96)');
    ctx.fillStyle = gb;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, 6.2832);
    ctx.fill();

    // Yüzey dokusu
    gezegenYuzeyi(g, r, x, y);

    // Ön halka (gezegenin önünden geçen kısım)
    halkaCiz(g, r, x, y, true);

    // İnce atmosfer kenar ışığı
    ctx.save();
    ctx.globalAlpha = 0.35;
    ctx.lineWidth = Math.max(0.7, r * 0.09);
    ctx.strokeStyle = 'rgba(200, 226, 255, 0.55)';
    ctx.beginPath();
    ctx.arc(x, y, r * 0.99, 0, 6.2832);
    ctx.stroke();
    ctx.restore();

    // Uydular (gezegenin kendi etrafında)
    for (var i = 0; i < g.uydular.length; i++) {
      var u = g.uydular[i];
      var ua = u.aci + zaman * (6.2832 / u.periyot);
      var ur = (r + u.uzaklik * olcek * 0.55);
      var ux = x + Math.cos(ua) * ur;
      var uy = y + Math.sin(ua) * ur * (0.34 + Math.abs(u.egim) * 0.3);
      var uR = Math.max(1, u.yaricap * olcek * 0.55);

      ctx.fillStyle = u.renk;
      ctx.globalAlpha = 0.9;
      ctx.beginPath();
      ctx.arc(ux, uy, uR, 0, 6.2832);
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    // Etiket
    if (AYAR.etiket) {
      ctx.save();
      ctx.font = '600 ' + Math.max(9, 11 * Math.min(olcek * 1.2, 1.3)) + 'px "Segoe UI", system-ui, sans-serif';
      ctx.fillStyle = 'rgba(226, 238, 255, 0.88)';
      ctx.shadowColor = 'rgba(0,0,0,0.9)';
      ctx.shadowBlur = 6;
      ctx.textAlign = 'center';
      ctx.fillText(v.ad, x, y - r - 8);
      ctx.restore();
    }
  }

  /* --- Yörünge çizgileri --- */
  function yorungeleriCiz() {
    if (!AYAR.yorunge) return;
    ctx.save();
    for (var i = 0; i < gezegenler.length; i++) {
      var g = gezegenler[i];
      var v = g.v;
      var a = v.yariBuyuk * olcek;
      var b = a * (0.46 + i * 0.026);       // elips → perspektif hissi
      ctx.beginPath();
      ctx.ellipse(merkezX, merkezY, a, b, 0, 0, 6.2832);
      ctx.strokeStyle = 'rgba(150, 190, 255, 0.11)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Güneşe yakın yörüngeler biraz daha parlak
      if (i < 3) {
        ctx.strokeStyle = 'rgba(255, 210, 140, 0.07)';
        ctx.lineWidth = 2.4;
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  /* --- Gezegenlerin konumunu güncelle --- */
  function gezegenleriGuncelle(dt) {
    for (var i = 0; i < gezegenler.length; i++) {
      var g = gezegenler[i];
      var v = g.v;

      // Yörünge açısı — dışarıdakiler daha yavaş (gerçekçi)
      var aci = g.baslangicAci + (zaman * 6.2832) / v.periyot;

      var A = v.yariBuyuk * olcek;
      var B = A * (0.46 + i * 0.026);

      // Elips üzerinde konum (dışmerkezlik güneşi odak yapar)
      var ex = Math.cos(aci) * A;
      var ey = Math.sin(aci) * B;
      // dışmerkezlik: güneş bir odakta
      var odak = A * v.disMerkez;

      g.x = merkezX + ex + odak;
      g.y = merkezY + ey;

      // derinlik: elipsin alt yarısı "ön", üst yarısı "arka"
      g.derinlikZ = Math.sin(aci);

      // Kendi eksen dönüşü
      g.donmeFazi += dt * (6.2832 / v.gun);

      // uyduların açısı
      for (var u = 0; u < g.uydular.length; u++) {
        g.uydular[u].aci += dt * (6.2832 / g.uydular[u].periyot);
      }
    }

    // Gezegenleri derinliğe göre sırala (arkadakiler önce çizilsin)
    gezegenler.sort(function (a, b) { return a.derinlikZ - b.derinlikZ; });
  }

  /* ============================================================
     5) AY — Dünya'nın etrafında döner (kilitli yörünge),
        aynı zamanda kendi ekseninde döner.
     ============================================================ */
  var ayAcisi = 0;

  function dunyayiBul() {
    for (var i = 0; i < gezegenler.length; i++) {
      if (gezegenler[i].v.ad === 'Dünya') return gezegenler[i];
    }
    return null;
  }

  function ayCiz(dt) {
    var dunya = dunyayiBul();
    if (!dunya) return;

    var dR = dunya.v.yaricap * olcek;
    // Ay yörüngesi: Dünya'nın 3.2 katı uzaklıkta
    var yR = dR * 3.2 + 10 * olcek;
    ayAcisi += dt * (6.2832 / 9.6);          // ~9.6 saniyede bir tur

    var ax = dunya.x + Math.cos(ayAcisi) * yR;
    var ay2 = dunya.y + Math.sin(ayAcisi) * yR * 0.42;   // perspektif eğimi

    var aR = Math.max(2.2, 3.1 * olcek);

    // Yörünge izi
    ctx.save();
    ctx.globalAlpha = 0.16;
    ctx.strokeStyle = 'rgba(210, 226, 255, 0.55)';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.ellipse(dunya.x, dunya.y, yR, yR * 0.42, 0, 0, 6.2832);
    ctx.stroke();
    ctx.restore();

    // Ay ışık halesi
    var gh = ctx.createRadialGradient(ax, ay2, aR * 0.6, ax, ay2, aR * 5);
    gh.addColorStop(0, 'rgba(226, 236, 255, 0.22)');
    gh.addColorStop(1, 'rgba(226, 236, 255, 0)');
    ctx.fillStyle = gh;
    ctx.beginPath();
    ctx.arc(ax, ay2, aR * 5, 0, 6.2832);
    ctx.fill();

    // Ay gövdesi
    var ga = ctx.createRadialGradient(ax - aR * 0.35, ay2 - aR * 0.35, aR * 0.08, ax, ay2, aR);
    ga.addColorStop(0.00, '#ffffff');
    ga.addColorStop(0.55, '#dfe4ee');
    ga.addColorStop(0.88, '#9aa2b4');
    ga.addColorStop(1.00, 'rgba(20,24,36,0.9)');
    ctx.fillStyle = ga;
    ctx.beginPath();
    ctx.arc(ax, ay2, aR, 0, 6.2832);
    ctx.fill();

    // Ay kraterleri — kendi eksen dönüşüyle kayar (dönüş kanıtı)
    ctx.save();
    ctx.beginPath();
    ctx.arc(ax, ay2, aR, 0, 6.2832);
    ctx.clip();
    var ayDonus = zaman * 6.2832 / 6.0;   // ayın kendi eksen dönüşü
    for (var i = 0; i < 5; i++) {
      var ka = ayDonus + i * 1.27;
      if (Math.cos(ka) < -0.25) continue;      // arka yüz
      var kx = ax + Math.cos(ka) * aR * 0.55;
      var ky = ay2 + Math.sin(i * 2.1) * aR * 0.45;
      var kr = aR * (0.13 + 0.07 * Math.sin(i * 3.1));
      ctx.globalAlpha = 0.30 * (0.4 + 0.6 * Math.cos(ka));
      ctx.fillStyle = 'rgba(70, 78, 96, 0.9)';
      ctx.beginPath();
      ctx.arc(kx, ky, kr, 0, 6.2832);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Ay'ın gece/gündüz ayrımı
    var ag = ctx.createLinearGradient(ax - aR * 0.7, ay2 - aR * 0.7, ax + aR * 0.8, ay2 + aR * 0.8);
    ag.addColorStop(0, 'rgba(255,255,255,0.18)');
    ag.addColorStop(0.55, 'rgba(0,0,10,0.30)');
    ag.addColorStop(1, 'rgba(0,0,14,0.62)');
    ctx.fillStyle = ag;
    ctx.beginPath();
    ctx.arc(ax, ay2, aR, 0, 6.2832);
    ctx.fill();
    ctx.restore();

    // "Ay" etiketi
    if (AYAR.etiket) {
      ctx.save();
      ctx.font = '600 10px "Segoe UI", system-ui, sans-serif';
      ctx.fillStyle = 'rgba(226, 238, 255, 0.8)';
      ctx.shadowColor = 'rgba(0,0,0,0.9)';
      ctx.shadowBlur = 5;
      ctx.textAlign = 'center';
      ctx.fillText('Ay', ax, ay2 - aR - 6);
      ctx.restore();
    }
  }

  /* ============================================================
     6) İLAHİ GÜÇ — merkezden yayılan ışık halkaları,
        gezegen auraları ve kutsal ışın sütunları
     ============================================================ */
  var ilahiHalkalar = [];

  function ilahiHalkaSal() {
    ilahiHalkalar.push({
      r: gunesR * olcek * 1.2,
      hiz: 26 + Math.random() * 30,
      a: 0.55 + Math.random() * 0.25,
      kalinlik: 1.2 + Math.random() * 2.4
    });
  }

  function ilahiGucCiz(dt) {
    if (AYAR.ilahi <= 0.01) { ilahiHalkalar.length = 0; return; }

    var siddet = AYAR.ilahi;

    // --- Kutsal ışın sütunları: merkezden dışa yayılan uzun çizgiler ---
    var isinSayisi = 7;
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    for (var i = 0; i < isinSayisi; i++) {
      var a = (i / isinSayisi) * 6.2832 + zaman * 0.09;
      var uzunluk = Math.max(G, Y) * (0.55 + 0.28 * Math.sin(zaman * 0.6 + i * 1.4));
      var gi = ctx.createLinearGradient(
        merkezX, merkezY,
        merkezX + Math.cos(a) * uzunluk, merkezY + Math.sin(a) * uzunluk
      );
      gi.addColorStop(0.00, 'rgba(255, 226, 160, ' + (0.10 * siddet).toFixed(3) + ')');
      gi.addColorStop(0.45, 'rgba(185, 140, 255, ' + (0.045 * siddet).toFixed(3) + ')');
      gi.addColorStop(1.00, 'rgba(185, 140, 255, 0)');
      ctx.strokeStyle = gi;
      ctx.lineWidth = 1.4 + 1.6 * siddet;
      ctx.beginPath();
      ctx.moveTo(merkezX, merkezY);
      ctx.lineTo(merkezX + Math.cos(a) * uzunluk, merkezY + Math.sin(a) * uzunluk);
      ctx.stroke();
    }
    ctx.restore();

    // --- Yayılan halkalar ---
    var salmaAraligi = 1.6 - siddet * 1.0;      // güç arttıkça daha sık salar
    if (!ilahiGucCiz._son || zaman - ilahiGucCiz._son > salmaAraligi) {
      ilahiGucCiz._son = zaman;
      ilahiHalkaSal();
      if (siddet > 0.6) ilahiHalkaSal();       // güçlüyken çift halka
    }

    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    for (var h = ilahiHalkalar.length - 1; h >= 0; h--) {
      var hk = ilahiHalkalar[h];
      hk.r += hk.hiz * dt;
      hk.a -= dt * 0.22;

      var maksR = Math.max(G, Y) * 0.78;
      if (hk.a <= 0 || hk.r > maksR) {
        ilahiHalkalar.splice(h, 1);
        continue;
      }

      var solma = 1 - hk.r / maksR;
      ctx.beginPath();
      ctx.arc(merkezX, merkezY, hk.r, 0, 6.2832);
      ctx.strokeStyle = 'rgba(255, 226, 170, ' + (hk.a * solma * siddet).toFixed(3) + ')';
      ctx.lineWidth = hk.kalinlik * (0.4 + solma);
      ctx.stroke();

      // Halkanın iç kenarında morumsu ikinci çizgi (kutsal hale)
      ctx.beginPath();
      ctx.arc(merkezX, merkezY, hk.r * 0.94, 0, 6.2832);
      ctx.strokeStyle = 'rgba(185, 140, 255, ' + (hk.a * solma * siddet * 0.45).toFixed(3) + ')';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    ctx.restore();

    // --- Gezegen auraları: ilahi güç her aleme dokunur ---
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    for (var g = 0; g < gezegenler.length; g++) {
      var ge = gezegenler[g];
      var gR = ge.v.yaricap * olcek;
      var nabiz = 0.62 + 0.38 * Math.sin(zaman * 1.1 + g * 0.9);
      var auraR = gR * (2.4 + 1.5 * nabiz);

      var ga2 = ctx.createRadialGradient(ge.x, ge.y, gR * 1.05, ge.x, ge.y, auraR);
      ga2.addColorStop(0, 'rgba(255, 226, 170, ' + (0.13 * siddet * nabiz).toFixed(3) + ')');
      ga2.addColorStop(0.6, 'rgba(168, 216, 255, ' + (0.05 * siddet).toFixed(3) + ')');
      ga2.addColorStop(1, 'rgba(168, 216, 255, 0)');
      ctx.fillStyle = ga2;
      ctx.beginPath();
      ctx.arc(ge.x, ge.y, auraR, 0, 6.2832);
      ctx.fill();
    }
    ctx.restore();
  }

  /* ============================================================
     ÇİZİM SIRASI (katman katman)
     ============================================================ */
  function ciz(dt) {
    // Arka plan — tam siyah (canvas alpha:false olduğu için şart)
    ctx.fillStyle = '#02030a';
    ctx.fillRect(0, 0, G, Y);

    // 1) Nebula toz bulutları
    nebulalariCiz();

    // 2) Yıldız alanı (parallax)
    yildizlariCiz(dt);

    // 3) Yörünge çizgileri (gezegenlerden önce)
    yorungeleriCiz();

    // 4) Gezegenlerin konumunu güncelle
    gezegenleriGuncelle(dt);

    // 5) Güneş (merkez)
    gunesCiz();

    // 6) Gezegenler + Ay
    for (var i = 0; i < gezegenler.length; i++) {
      gezegenCiz(gezegenler[i]);
      if (gezegenler[i].v.ad === 'Dünya') ayCiz(dt);
    }

    // 7) İlahi güç (en üstte, screen blend ile)
    ilahiGucCiz(dt);
  }

  /* ============================================================
     ANA DÖNGÜ
     ============================================================ */
  function dongu(an) {
    requestAnimationFrame(dongu);

    if (!sonAn) sonAn = an;
    var gecen = (an - sonAn) / 1000;
    sonAn = an;

    // Sekme arka plana atılınca büyük atlamayı engelle
    if (gecen > 0.12) gecen = 0.12;

    // FPS ölçümü
    fpsSayac++;
    fpsZaman += gecen;
    if (fpsZaman >= 0.5) {
      fps = Math.round(fpsSayac / fpsZaman);
      fpsSayac = 0;
      fpsZaman = 0;
      fpsGuncelle();
    }

    if (AYAR.duraklat) return;

    var dt = gecen * AYAR.hiz;
    zaman += dt;

    ciz(dt);
  }

  /* ============================================================
     PANEL — kontroller
     ============================================================ */
  var els = {
    panelAc: document.getElementById('panelAc'),
    panelGovde: document.getElementById('panelGovde'),
    hiz: document.getElementById('hiz'),
    hizDeger: document.getElementById('hizDeger'),
    ilahi: document.getElementById('ilahi'),
    ilahiDeger: document.getElementById('ilahiDeger'),
    yildiz: document.getElementById('yildiz'),
    yildizDeger: document.getElementById('yildizDeger'),
    yorungeBtn: document.getElementById('yorungeBtn'),
    etiketBtn: document.getElementById('etiketBtn'),
    duraklatBtn: document.getElementById('duraklatBtn'),
    durum: document.getElementById('durum'),
    fps: document.getElementById('fps')
  };

  function fpsGuncelle() {
    if (els.fps) els.fps.textContent = fps + ' fps';
  }

  function durumYaz(t) {
    if (els.durum) els.durum.textContent = t;
  }

  function panelKur() {
    // Aç/kapa
    if (els.panelAc && els.panelGovde) {
      els.panelAc.addEventListener('click', function () {
        els.panelGovde.classList.toggle('gizli');
      });
      // Küçük ekranda başlangıçta kapalı dursun
      if (window.innerWidth < 640) els.panelGovde.classList.add('gizli');
    }

    // Hız
    if (els.hiz) {
      els.hiz.addEventListener('input', function () {
        AYAR.hiz = parseFloat(els.hiz.value);
        if (els.hizDeger) els.hizDeger.textContent = AYAR.hiz.toFixed(1) + '×';
        durumYaz(AYAR.hiz < 0.05 ? 'evren durdu' : 'evren akıyor…');
      });
    }

    // İlahi güç
    if (els.ilahi) {
      els.ilahi.addEventListener('input', function () {
        AYAR.ilahi = parseFloat(els.ilahi.value);
        if (els.ilahiDeger) els.ilahiDeger.textContent = Math.round(AYAR.ilahi * 100) + '%';
        durumYaz(AYAR.ilahi > 0.75 ? 'ilahi güç yükseliyor…'
                : AYAR.ilahi > 0.2  ? 'ilahi güç dengede'
                : 'ilahi güç sönüyor');
      });
    }

    // Yıldız yoğunluğu
    if (els.yildiz) {
      els.yildiz.addEventListener('input', function () {
        AYAR.yildizSayisi = parseInt(els.yildiz.value, 10);
        if (els.yildizDeger) els.yildizDeger.textContent = AYAR.yildizSayisi;
        yildizlariUret();
      });
    }

    // Yörüngeler
    if (els.yorungeBtn) {
      els.yorungeBtn.addEventListener('click', function () {
        AYAR.yorunge = !AYAR.yorunge;
        els.yorungeBtn.classList.toggle('aktif', AYAR.yorunge);
      });
    }

    // İsimler
    if (els.etiketBtn) {
      els.etiketBtn.addEventListener('click', function () {
        AYAR.etiket = !AYAR.etiket;
        els.etiketBtn.classList.toggle('aktif', AYAR.etiket);
      });
    }

    // Duraklat
    if (els.duraklatBtn) {
      els.duraklatBtn.addEventListener('click', function () {
        AYAR.duraklat = !AYAR.duraklat;
        els.duraklatBtn.classList.toggle('aktif', AYAR.duraklat);
        els.duraklatBtn.textContent = AYAR.duraklat ? 'Devam' : 'Duraklat';
        durumYaz(AYAR.duraklat ? 'evren duraklatıldı' : 'evren akıyor…');
      });
    }

    // Klavye kısayolları
    window.addEventListener('keydown', function (e) {
      if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        if (els.duraklatBtn) els.duraklatBtn.click();
      } else if (e.key === 'o' || e.key === 'O') {
        if (els.yorungeBtn) els.yorungeBtn.click();
      } else if (e.key === 'l' || e.key === 'L') {
        if (els.etiketBtn) els.etiketBtn.click();
      } else if (e.key === 'h' || e.key === 'H') {
        if (els.panelAc) els.panelAc.click();
      }
    });
  }

  /* ============================================================
     BAŞLAT
     ============================================================ */
  function baslat() {
    boyutlandir();
    gezegenleriKur();
    panelKur();

    gunesR = 30;               // temel güneş yarıçapı
    durumYaz('18.000 alem canlanıyor…');

    // İlk birkaç ilahi halkayı önceden sal ki sahne boş başlamasın
    for (var i = 0; i < 3; i++) {
      ilahiHalkalar.push({
        r: gunesR * olcek * (1.2 + i * 1.6),
        hiz: 26 + i * 9,
        a: 0.5 - i * 0.1,
        kalinlik: 1.6
      });
    }

    window.addEventListener('resize', boyutlandir);
    // Mobilde adres çubuğu açılıp kapanınca da ölçüyü düzelt
    window.addEventListener('orientationchange', function () {
      setTimeout(boyutlandir, 180);
    });

    requestAnimationFrame(dongu);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', baslat);
  } else {
    baslat();
  }

})();


