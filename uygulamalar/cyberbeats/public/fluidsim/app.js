/* FluidSim — Navier–Stokes 2D sıvı simülatörü
 * ---
 * Sıfır kütüphane · saf Canvas 2D · tek dosya
 * Çekirdek: Jos Stam "Real-Time Fluid Dynamics for Games" (2003) uyarlaması.
 *   - diffuse : viskozite & yayılım → Gauss–Seidel iterasyonu
 *   - project : basınç (Poisson) çözümü → divergence düzeltme (20 iterasyon)
 *   - advect  : semi-Lagrangian geriye-akış + bilineer interpolasyon
 * Alanlar: global u,v (hız), dens (yoğunluk) — 128×128 grid (sınır hücresi dahil S=N+2).
 *
 * Etkileşim: sürükle → kuvvet+renk; W rüzgar, V vortex, C renk modu, R reset.
 * Görsel: putImageData ile TEK blit (fillRect kullanılmıyor). Parçacık izleri
 * overlay canvas'ta yaşar (%solma ile kuyruk). 60 FPS hedefi; altına düşünce
 * grid otomatik 128→96→64 küçülür.
 */
(function () {
  'use strict';

  /* ────────────────────── DOM ────────────────────── */
  var canvas = document.getElementById('fluidCanvas');
  var pwrap = canvas.parentNode;
  var ctx = canvas.getContext('2d', { alpha: false });

  var fpsEl = document.getElementById('fpsReadout');
  var gridEl = document.getElementById('gridReadout');
  var modeEl = document.getElementById('modeReadout');
  var partEl = document.getElementById('partReadout');
  var outVis = document.getElementById('viscosityOut');
  var outDiff = document.getElementById('diffusionOut');
  var outParts = document.getElementById('partsOut');
  var stVort = document.getElementById('stVortex');
  var stIter = document.getElementById('stIter');
  var stAuto = document.getElementById('stAuto');

  // Görünüm modu butonları
  var modeItems = Array.prototype.slice.call(
    document.querySelectorAll('.ml-item[data-mode]')
  );

  /* ───────────────── grid / alanlar ───────────────── */
  var GRIDS = [128, 96, 64];
  var N = GRIDS[0], S = N + 2, SIZE = S * S;
  var iterProject = 20;

  var u = new Float32Array(SIZE);   // yatay hız
  var v = new Float32Array(SIZE);   // dikey hız
  var u0 = new Float32Array(SIZE);  // u kaynak (kuvvet tamponu)
  var v0 = new Float32Array(SIZE);
  var dens = new Float32Array(SIZE);
  var dens0 = new Float32Array(SIZE);
  var div = new Float32Array(SIZE); // project yardımcı (p)
  var psc = new Float32Array(SIZE);

  var visc = 0.0002;    // viskozite (slider)
  var diffu = 0.0002;   // diffusion
  var dtStep = 0.16;

  var renderModeState = 'velocity'; // 'density' | 'velocity' | 'magnitude'
  var allowParticles = true;

  function IX(i, j) { return i + S * j; }
  function CLAMP(x, lo, hi) { return x < lo ? lo : (x > hi ? hi : x); }

  /* ──────── sınır koşulları (duvara sıkış) ──────── */
  function set_bnd(b, x) {
    for (var j = 1; j <= N; j++) {
      x[IX(0, j)]     = b === 2 ? -x[IX(1, j)] : x[IX(1, j)];
      x[IX(N + 1, j)] = b === 2 ? -x[IX(N, j)] : x[IX(N, j)];
      x[IX(j, 0)]     = b === 1 ? -x[IX(j, 1)] : x[IX(j, 1)];
      x[IX(j, N + 1)] = b === 1 ? -x[IX(j, N)] : x[IX(j, N)];
    }
    x[IX(0, 0)]         = 0.5 * (x[IX(1, 0)] + x[IX(0, 1)]);
    x[IX(0, N + 1)]     = 0.5 * (x[IX(1, N + 1)] + x[IX(0, N)]);
    x[IX(N + 1, 0)]     = 0.5 * (x[IX(N, 0)] + x[IX(N + 1, 1)]);
    x[IX(N + 1, N + 1)] = 0.5 * (x[IX(N, N + 1)] + x[IX(N + 1, N)]);
  }

  /* ────────────────── çekirdek ───────────────────── */
  function addSource(x, s, dt0) {
    for (var i = 0; i < SIZE; i++) x[i] += dt0 * s[i];
  }

  // Gauss–Seidel yumuşatma (diffuse / project ortak)
  function linSolve(b, x, x0, a, c) {
    var cr = 1 / c;
    for (var k = 0; k < iterProject; k++) {
      for (var j = 1; j <= N; j++) {
        for (var i = 1; i <= N; i++) {
          x[IX(i, j)] = (x0[IX(i, j)] +
            a * (x[IX(i + 1, j)] + x[IX(i - 1, j)] +
                 x[IX(i, j + 1)] + x[IX(i, j - 1)])) * cr;
        }
      }
      set_bnd(b, x);
    }
  }

  // viskozite difüzyonu (x kaynağı x0'dan)
  function diffuse(b, x, x0, diff, dt0) {
    var a = dt0 * diff * N * N;
    linSolve(b, x, x0, a, 1 + 4 * a);
  }

  // semi-Lagrangian advect (geriye iz + bilineer interpolasyon)
  function advect(b, d, d0, uu, vv, dt0) {
    var dt0x = dt0 * N;
    for (var j = 1; j <= N; j++) {
      for (var i = 1; i <= N; i++) {
        var xp = i - dt0x * uu[IX(i, j)];
        var yp = j - dt0x * vv[IX(i, j)];
        if (xp < 0.5) xp = 0.5; else if (xp > N + 0.5) xp = N + 0.5;
        if (yp < 0.5) yp = 0.5; else if (yp > N + 0.5) yp = N + 0.5;
        var i0 = xp | 0, i1 = i0 + 1;
        var j0 = yp | 0, j1 = j0 + 1;
        var s1 = xp - i0, s0 = 1 - s1;
        var t1 = yp - j0, t0 = 1 - t1;
        d[IX(i, j)] = s0 * (t0 * d0[IX(i0, j0)] + t1 * d0[IX(i0, j1)]) +
                       s1 * (t0 * d0[IX(i1, j0)] + t1 * d0[IX(i1, j1)]);
      }
    }
    set_bnd(b, d);
  }

  // basınç projeksiyonu — divergence temizliği (Poisson yaklaşımı)
  function project(uu, vv, p, divv) {
    for (var j = 1; j <= N; j++) {
      for (var i = 1; i <= N; i++) {
        divv[IX(i, j)] = -0.5 * (uu[IX(i + 1, j)] - uu[IX(i - 1, j)] +
                                  vv[IX(i, j + 1)] - vv[IX(i, j - 1)]) / N;
        p[IX(i, j)] = 0;
      }
    }
    set_bnd(0, divv);
    set_bnd(0, p);
    // Poisson çözümü (Gauss–Seidel) — 20 iterasyon
    for (var k = 0; k < iterProject; k++) {
      for (var j = 1; j <= N; j++) {
        for (var i = 1; i <= N; i++) {
          p[IX(i, j)] = (divv[IX(i, j)] +
            p[IX(i + 1, j)] + p[IX(i - 1, j)] +
            p[IX(i, j + 1)] + p[IX(i, j - 1)]) * 0.25;
        }
      }
      set_bnd(0, p);
    }
    // basınç gradyanı çıkar → divergence'suz hız
    for (var j = 1; j <= N; j++) {
      for (var i = 1; i <= N; i++) {
        uu[IX(i, j)] -= 0.5 * (p[IX(i + 1, j)] - p[IX(i - 1, j)]) * N;
        vv[IX(i, j)] -= 0.5 * (p[IX(i, j + 1)] - p[IX(i, j - 1)]) * N;
      }
    }
    set_bnd(1, uu);
    set_bnd(2, vv);
  }

  // bir tam hız adımı — sequence: source→diffuse→project→advect→project
  function stepVel() {
    var dt0 = dtStep;
    addSource(u, u0, dt0);
    addSource(v, v0, dt0);
    diffuse(1, u0, u, visc, dt0);
    diffuse(2, v0, v, visc, dt0);
    u.set(u0); v.set(v0);
    // clear accumulation (u0/v0 artık geçici)
    u0.fill(0); v0.fill(0);
    project(u, v, psc, div);
    // advect — iki pass'i tek geçiş (çift tampon uzun)
    // advect(1, u, u_old, u_vect, v_vect)
    // Önce u'yu tmp'ye kopyalamak istiyoruz: burada global tampon tek yeterli.
    // JS'te diziyi kendi kaynağından okumak "in-place" çalışır ama doğruluk için
    // hedefe ayrı tampon veriyoruz (üst sınır S*S copy, 60fps'de kabul).
    /* semi-lagrangian eşzamanlı : d = F(u), kaynağı d0 ver. Güncelleneni d0,
       sonra ana dizgeye geri koy */
    // u_hızları eşzamanlı erişim: Şu an u projekte edilmiş; advect için
    // ESEK: kaynak(eski u) ile hedef(yeni u) ayrı olmalı. u'yu advect etmeden
    // önce eski halini yedeğe alalım:
    var uOld = u.slice(0);
    var vOld = v.slice(0);
    advect(1, u, uOld, uOld, vOld, dt0); // hedef u ← trac(uOld, uOld,vOld)
    advect(2, v, vOld, uOld, vOld, dt0);
    project(u, v, psc, div);
  }

  // yoğunluk adımı: source → diffuse → advect
  function stepDens() {
    var dt0 = dtStep;
    addSource(dens, dens0, dt0);
    dens0.fill(0);              // dens0 = diffusion için kaynak tamponu olacak
    // diffüz: dens ← yumuşat(dens)
    var dOld = dens.slice(0);
    diffuse(0, dens, dOld, diffu, dt0);
    advect(0, dens, dOld, u, v, dt0);
  }

  /* ────────────── Koordinat / ölçek ────────────── */
  function canvasRect() {
    var r = canvas.getBoundingClientRect();
    return r;
  }
  function canvasToGridPx() {
    // grid cell coords → canvas piksel
    var w = canvas.width, h = canvas.height;
    return { pw: w / S, ph: h / S };
  }

  /* ────────────── GÖRSEL (putImageData) ────────── */
  var img = null;
  function paint() {
    if (!img || img.width !== canvas.width || img.height !== canvas.height) {
      img = ctx.createImageData(canvas.width, canvas.height);
    }
    var data = img.data;
    var st = canvasToGridPx();
    var pw = st.pw, ph = st.ph;

    for (var j = 1; j <= N; j++) {
      var py0 = ((j - 1) * ph) | 0;
      var py1 = (j * ph) | 0;
      for (var i = 1; i <= N; i++) {
        var px0 = ((i - 1) * pw) | 0;
        var px1 = (i * pw) | 0;
        var idxCell = IX(i, j);
        var r0, g0, b0, a0;

        if (renderModeState === 'density') {
          var d = dens[idxCell];
          var gv = Math.min(1, d);
          var vv = 255 * gv;
          a0 = (gv * 255) | 0;          // alpha = density (bulanık görünüm)
          // sarı-yeşil neon, alfa ile görünürlük
          r0 = (180 * gv) | 0;
          g0 = 255;
          b0 = (90 * gv) | 0;
        } else if (renderModeState === 'velocity') {
          var uu = u[idxCell], vv2 = v[idxCell];
          var sp = Math.sqrt(uu * uu + vv2 * vv2);
          var hue = (Math.atan2(vv2, uu) * 57.2958 + 180 + 360) % 360;
          var sat = Math.min(100, 60 + sp * 10);
          var lit = Math.min(55, 14 + sp * 8);
          var c = hslToRgb(hue, sat, lit);
          r0 = c[0]; g0 = c[1]; b0 = c[2]; a0 = 255;
        } else { // magnitude — heatmap (sıcak-soğuk)
          var s = Math.sqrt(u[idxCell] * u[idxCell] + v[idxCell] * v[idxCell]);
          var t = Math.min(1, s / 12);
          // koyu mavi → camgöbeği → sarı-beyaz
          r0 = (20 + t * 235) | 0;
          g0 = (60 + t * 160) | 0;
          b0 = (240 - t * 150) | 0;
          a0 = 255;
        }

        for (var py = py0; py < py1; py++) {
          var row = py * canvas.width;
          for (var px = px0; px < px1; px++) {
            var o = (row + px) << 2;
            data[o] = r0; data[o + 1] = g0;
            data[o + 2] = b0; data[o + 3] = a0;
          }
        }
      }
    }
    ctx.putImageData(img, 0, 0);
  }

  function hslToRgb(h, s, l) {
    h = h / 360;
    s = s / 100; l = l / 100;
    var m;
    if (s === 0) { m = l; return [m * 255, m * 255, m * 255]; }
    var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    var p = 2 * l - q;
    function hu2(h4) {
      if (h4 < 0) h4 += 1;
      if (h4 > 1) h4 -= 1;
      if (h4 < 1 / 6) return p + (q - p) * 6 * h4;
      if (h4 < 1 / 2) return q;
      if (h4 < 2 / 3) return p + (q - p) * (2 / 3 - h4) * 6;
      return p;
    }
    return [hu2(h + 1 / 3) * 255, hu2(h) * 255, hu2(h - 1 / 3) * 255];
  }

  /* ───────────── PARÇACIK İZLERİ (overlay) ──────── */
  var pctx = null;
  var particles = [];
  var partCount = 200;

  function ensureOverlay() {
    if (!pctx) {
      var pc = document.createElement('canvas');
      pc.style.cssText =
        'position:absolute;left:0;top:0;width:100%;height:100%;' +
        'pointer-events:none;mix-blend-mode:screen;';
      pwrap.appendChild(pc);
      pctx = pc.getContext('2d');
      pctx.canvas.width = canvas.width;
      pctx.canvas.height = canvas.height;
    }
    if (pctx.canvas.width !== canvas.width) {
      pctx.canvas.width = canvas.width;
      pctx.canvas.height = canvas.height;
    }
  }

  function resetParticles() {
    particles = [];
    var n = partCount;
    for (var k = 0; k < n; k++) {
      particles.push({
        x: Math.random(), y: Math.random(), // 0..1 sahnede
        px: 0, py: 0
      });
    }
  }

  function drawParticles() {
    if (!allowParticles) { pctx.clearRect && pctx.clearRect(0, 0, pctx.canvas.width, pctx.canvas.height); return; }
    var n = Math.min(partCount, particles.length);
    ensureOverlay();
    // fade: kuyruk bırak (önceki + hafif silik likit)
    pctx.globalCompositeOperation = 'destination-out';
    pctx.fillStyle = 'rgba(0,0,0,0.10)';
    pctx.fillRect(0, 0, pctx.canvas.width, pctx.canvas.height);
    pctx.globalCompositeOperation = 'lighter';
    pctx.globalAlpha = 0.85;

    for (var k = 0; k < n; k++) {
      var pt = particles[k];
      pt.px = pt.x; pt.py = pt.y;
      // velocity'den advect (sahne 0..1 → hücre)
      var gx = CLAMP(Math.floor(pt.x * N) + 1, 1, N);
      var gy = CLAMP(Math.floor(pt.y * N) + 1, 1, N);
      var idx = IX(gx, gy);
      var cn = N;   // hücre boyutu 1/.. — normalize
      // hareket (uygun hız sabitleri — görsel ahenk için)
      pt.x += u[idx] * 0.004;
      pt.y += v[idx] * 0.004;
      if (pt.x < 0 ) pt.x = 1;
      else if (pt.x > 1) pt.x = 0;
      if (pt.y < 0) pt.y = 1;
      else if (pt.y > 1) pt.y = 0;
      var X = pt.x * pctx.canvas.width;
      var Y = pt.y * pctx.canvas.height;
      var col = hslToRgb2((k * 3) % 360, 90, 60);
      pctx.strokeStyle = 'rgba(' + col[0] + ',' + col[1] + ',' + col[2] + ',0.9)';
      pctx.lineWidth = 1;
      pctx.beginPath();
      pctx.moveTo(pt.px * pctx.canvas.width, pt.py * pctx.canvas.height);
      pctx.lineTo(X, Y);
      pctx.stroke();
    }
    pctx.globalAlpha = 1;
    pctx.globalCompositeOperation = 'source-over';
  }
  function hslToRgb2(h, s, l) {
    // h[0,360] s,l[0,100] — basit rgb
    h = (h % 360 + 360) % 360 / 360; s/=100; l/=100;
    var r,g,b;
    if (s===0){r=g=b=l;}
    else{function hue2giu(p,q,t){if(t<0)t+=1;if(t>1)t-=1;if(t<1/6)return p+(q-p)*6*t;if(t<1/2)return q;if(t<2/3)return p+(q-p)*(2/3-t)*6;return p;}
      var q = l<0.5? l*(1+s): l+s-l*s; var p = 2*l-q;
      r=hue2giu(p,q,h+1/3); g=hue2giu(p,q,h); b=hue2giu(p,q,h-1/3);}
    return [r*255|0,g*255|0,b*255|0];
  }

  /* ───────────── güçler: mouse/W/V ─────────────── */
  function splat(x, y, r, cu, cv) {
    // halkasal değil: Gaussian etkisi yaklaşımı
    var d2 = r * r;
    var xi = Math.floor(x * N) + 1, yi = Math.floor(y * N) + 1;
    for (var j = -2; j <= 2; j++) {
      for (var i = -2; i <= 2; i++) {
        var gx = xi + i, gy = yi + j;
        if (gx < 1 || gx > N || gy < 1 || gy > N) continue;
        var idx = IX(gx, gy);
        var w = Math.max(0, 1 - (i * i + j * j) / (r * r * 0.8));
        u[idx] += cu * w * 0.5;
        v[idx] += cv * w * 0.5;
        dens[idx] += 0.8 * w * 0.5;
      }
    }
  }

  var windOn = false, vortexOn = false;
  var refX = 0, refY = 0;

  canvas.addEventListener('pointerdown', function (e) {
    e.preventDefault();
    var r = canvas.getBoundingClientRect();
    refX = (e.clientX - r.left) / r.width;
    refY = (e.clientY - r.top) / r.height;
    try { canvas.setPointerCapture(e.pointerId); } catch (err) {}
  });
  canvas.addEventListener('pointermove', function (e) {
    if (e.buttons !== 1) return;
    var r = canvas.getBoundingClientRect();
    var nx = (e.clientX - r.left) / r.width;
    var ny = (e.clientY - r.top) / r.height;
    // sürükleme yön vektörü
    var dx = nx - refX, dy = ny - refY;
    splat(nx, ny, 0.03, dx * 40, dx * 40);  // kuvvet hıza: x dominant
    splat(nx, ny, 0.02, 0, 0);              // ayrı yoğunluk damlası
    splat(nx, ny, 0.025, dx * 200, dy * 200);
    refX = nx; refY = ny;
  });

  function frameAmbient() {
    if (windOn) {
      // soldan sürekli sağa kuvvet (30px kalın sütun)
      for (var j = 1; j <= N; j++) {
        var wf = 0.6 + 0.5 * Math.sin(j / N * Math.PI * 2);
        for (var i = 1; i <= Math.floor(N * 0.15); i++) {
          var idx = IX(i, j);
          u[idx] += (14 + 9 * wf);
        }
      }
    }
    if (vortexOn) {
      // merkez çevresine dönel kuvvet
      var cx = N * 0.5, cy = N * 0.5;
      for (var j = 1; j <= N; j++) {
        for (var i = 1; i <= N; i++) {
          var dx = (i - cx), dy = (j - cy);
          var rr = Math.sqrt(dx * dx + dy * dy);
          if (rr < 4 || rr > N * 0.4) continue;
          // teğet kuvvet (saat yönü)
          var tang = 18 / (rr + 2);
          var idx = IX(i, j);
          u[idx] += -dy / rr * tang;
          v[idx] +=  dx / rr * tang;
        }
      }
    }
  }

  /* ──── ANA DÖNGÜ / FPS / grid-oupdate ────  */
  var fpsSum = 0, fpsCount = 0, fpsShow = 0;
  var downTicks = 0;
  var RaF = requestAnimationFrame.bind(window);

  function frameSizeSync() {
    // canvas fiziksel boyutunu aspect + panel ölçüsüne eşle (devicePixelRatio 1)
    var w = canvas.clientWidth;
    var area = canvas.clientHeight || 420; // css
    if (w > 0 && canvas.width !== w) canvas.width = w;
    if (area > 0 && canvas.height !== area) canvas.height = area;
  }

  function resetScene() {
    u.fill(0); v.fill(0); u0.fill(0); v0.fill(0);
    dens.fill(0.0001); dens0.fill(0);
    windOn = false; vortexOn = false;
    if (stVort) stVort.textContent = '';
  }

  function doFrame(now) {
    RaF(doFrame);
    // canlı yeniden boyut + FPS
    frameSizeSync();
    // FPS hesapla: her kare akümülasyon
    if (now - (window.__lu || 0) > 500) {
      fpsShow = fpsCount * 1000 / (now - (window.__lu || 1));
      fpsEl.textContent = Math.round(fpsShow);
      // auto-grid (60 hedefin altına ≤ %52 : düşür)
      if (fpsShow < 52) { downTicks++; if (downTicks > 20) downscale(); }
      else downTicks = 0;
      fpsCount = 0; window.__lu = now;
    }
    fpsCount++;

    frameAmbient();

    // fizik adımları — dt tipik performans için 0.5 (adım başına yarım çevrim)
    stepVel();
    stepDens();

    paint();
    drawParticles();
  }

  function downscale() {
    var ci = GRIDS.indexOf(N);
    if (ci < GRIDS.length - 1) {
      N = GRIDS[ci + 1];
      S = N + 2; SIZE = S * S;
      u = new Float32Array(SIZE); v = new Float32Array(SIZE);
      u0 = new Float32Array(SIZE); v0 = new Float32Array(SIZE);
      dens = new Float32Array(SIZE); dens0 = new Float32Array(SIZE);
      div = new Float32Array(SIZE); psc = new Float32Array(SIZE);
      dens.fill(0.001);
      gridEl.textContent = N;
      resetParticles();
    }
    downTicks = 0;
  }

  /* ─────────────── KONTROLLER ─────────────── */
  function setupModeButtons() {
    modeEl.textContent = renderModeState.toUpperCase();
    modeItems.forEach(function (el) {
      el.addEventListener('click', function () {
        renderModeState = el.getAttribute('data-mode');
        modeEl.textContent = renderModeState.toUpperCase();
        modeItems.forEach(function (o) { o.classList.remove('active'); });
        el.classList.add('active');
      });
    });
  }

  window.addEventListener('keydown', function (e) {
    var k = e.key.toLowerCase();
    if (k === 'w') { windOn = true; }
    else if (k === 'v') { vortexOn = true; }
    else if (k === 'c') {
      // döngü modu
      var modes = ['density', 'velocity', 'magnitude'];
      var ci = modes.indexOf(renderModeState);
      var nx = modes[(ci + 1) % modes.length];
      renderModeState = nx;
      modeEl.textContent = nx.toUpperCase();
      modeItems.forEach(function (o) { o.classList.remove('active');
        if (o.getAttribute('data-mode') === nx) o.classList.add('active');
      });
    }
    else if (k === 'r') resetScene();
  });
  window.addEventListener('keyup', function (e) {
    var k = e.key.toLowerCase();
    if (k === 'w') windOn = false;
    else if (k === 'v') vortexOn = false;
  });

  // slider bağlama — 0..200 → 0.00001..0.001 scale
  function bindSlider(id, outId, setter, scale) {
    var el = document.getElementById(id);
    var out = document.getElementById(outId);
    if (!el || !out) return;
    function upd() {
      var raw = parseInt(el.value, 10);
      var val = raw * scale;
      setter(val);
      out.textContent = val.toFixed(5).replace(/0+$/, '').replace(/\.$/, '');
    }
    el.addEventListener('input', upd);
    upd();
  }
  bindSlider('viscosity', 'viscosityOut', function (x) { visc = x; }, 0.00001);
  bindSlider('diffusion', 'diffusionOut', function (x) { diffu = x; }, 0.00001);

  // parçacık sayısı
  var partsSep = document.getElementById('particles');
  partsSep && partsSep.addEventListener('input', function () {
    partCount = parseInt(partsSep.value, 10);
    partEl.textContent = partCount;
    resetParticles();
  });

  /* ─────────────── BAŞLAT ─────────────── */
  function boot() {
    outParts && (outParts.textContent = partCount);
    partEl.textContent = partCount;
    gridEl.textContent = N;
    fpsEl.textContent = '0';
    stIter && (stIter.textContent = iterProject);
    stAuto && (stAuto.textContent = N + ' (otomatik)');
    setupModeButtons();
    resetScene();
    resetParticles();
    ensureOverlay();
    RaF(doFrame);
  }

  boot();
})();
