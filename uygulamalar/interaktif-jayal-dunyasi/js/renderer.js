/* Numex Dream Studio — render katmanı.
   Parçacık fiziğini bilmez; sadece engine.groups içindeki konumları çizer. */
(function () {
  'use strict';
  const NS = (window.NDS = window.NDS || {});
  const TAU = Math.PI * 2;
  const LAYER_ALPHA = [0.95, 0.60, 0.28];
  const LAYER_SIZE = [1.15, 0.95, 0.78];

  function Renderer(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false });
    this.dpr = 1;
    this.W = 1;
    this.H = 1;
    this.quality = 1;
    this.cam = { zoom: 1, rotY: 0, rotX: -0.22, panX: 0, panY: 0 };
    this.resize();
  }

  Renderer.prototype.resize = function () {
    const rect = this.canvas.getBoundingClientRect();
    const W = Math.max(320, Math.round(rect.width || window.innerWidth));
    const H = Math.max(320, Math.round(rect.height || window.innerHeight));
    const dpr = Math.min(window.devicePixelRatio || 1, 2) * (this.quality < 0.8 ? 0.85 : 1);
    const safeDpr = Math.max(1, Math.round(dpr * 10) / 10);
    if (this.W === W && this.H === H && this.dpr === safeDpr) return false;
    this.W = W; this.H = H; this.dpr = safeDpr;
    this.canvas.width = Math.round(W * safeDpr);
    this.canvas.height = Math.round(H * safeDpr);
    this.canvas.style.width = W + 'px';
    this.canvas.style.height = H + 'px';
    return true;
  };

  Renderer.prototype.baseScale = function () {
    return Math.min(this.W, this.H) * 0.44 * this.cam.zoom;
  };

  /* Ekran noktası -> dünya noktası (kamera dönüşünün tersi, z=0 düzlemi) */
  Renderer.prototype.screenToWorld = function (sx, sy) {
    const base = this.baseScale();
    if (!base) return { x: 0, y: 0 };
    const cx = this.W * 0.5 + this.cam.panX * this.W;
    const cy = this.H * 0.5 + this.cam.panY * this.H;
    const u = (sx - cx) / base;   // ≈ x1 * persp
    const v = (sy - cy) / base;   // ≈ y2 * persp

    const cosX = Math.cos(this.cam.rotX), sinX = Math.sin(this.cam.rotX);
    const cosY = Math.cos(this.cam.rotY), sinY = Math.sin(this.cam.rotY);

    // z2 ≈ 0 varsayımıyla tilt eksenini geri al
    const y1 = v * cosX;
    const z1 = -v * sinX;
    // Y ekseni dönüşünü geri al
    const x = u * cosY + z1 * sinY;
    const z = -u * sinY + z1 * cosY;
    return { x: x, y: y1, z: z };
  };

  Renderer.prototype.draw = function (engine, palette, opts) {
    this.drawInto(this.ctx, this.W, this.H, this.dpr, engine, palette, opts);
  };

  /* opts: { fade, dt, aura } */
  Renderer.prototype.drawInto = function (ctx, W, H, dpr, engine, palette, opts) {
    const cam = this.cam;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;

    // iz bırakma (trail) — parçacıklar additive çizildiği için sıcak iz oluşur
    if (opts.fade > 0) {
      ctx.fillStyle = 'rgba(' + palette.bgRgb + ',' + opts.fade + ')';
      ctx.fillRect(0, 0, W, H);
    } else {
      ctx.fillStyle = palette.bg;
      ctx.fillRect(0, 0, W, H);
    }

    const cosY = Math.cos(cam.rotY), sinY = Math.sin(cam.rotY);
    const cosX = Math.cos(cam.rotX), sinX = Math.sin(cam.rotX);
    const base = Math.min(W, H) * 0.44 * cam.zoom;
    const cx = W * 0.5 + cam.panX * W;
    const cy = H * 0.5 + cam.panY * H;
    const lut = palette.lut;

    // atmosferik hale (tek gradyan, ucuz)
    if (opts.aura !== 0) {
      const ar = base * 1.25;
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(40, ar));
      const mid = lut[Math.min(lut.length - 1, (lut.length * 0.7) | 0)].css;
      g.addColorStop(0, 'rgba(' + lut[lut.length - 1].rgb.join(',') + ',0.10)');
      g.addColorStop(0.45, 'rgba(' + lut[(lut.length / 2) | 0].rgb.join(',') + ',0.05)');
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = 1;
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
      void mid;
    }

    const groups = engine.groups;
    ctx.globalCompositeOperation = 'lighter';

    for (let gi = 0; gi < groups.length; gi++) {
      const list = groups[gi];
      if (!list || !list.length) continue;
      const ci = (gi / 3) | 0;
      const layer = gi % 3;
      if (!lut[ci]) continue;
      ctx.fillStyle = lut[ci].css;
      ctx.globalAlpha = LAYER_ALPHA[layer];
      ctx.beginPath();
      for (let j = 0; j < list.length; j++) {
        const p = list[j];
        const x1 = p.x * cosY - p.z * sinY;
        const z1 = p.x * sinY + p.z * cosY;
        const y2 = p.y * cosX - z1 * sinX;
        const z2 = p.y * sinX + z1 * cosX;
        const dz = z2 > 1 ? 1 : (z2 < -1 ? -1 : z2);
        const persp = 1 + dz * 0.42;
        const sx = cx + x1 * base * persp;
        const sy = cy + y2 * base * persp;
        const r = p.size * LAYER_SIZE[layer] * persp;
        if (r < 0.25) continue;
        if (sx < -40 || sx > W + 40 || sy < -40 || sy > H + 40) continue;
        ctx.moveTo(sx + r, sy);
        ctx.arc(sx, sy, r, 0, TAU);
      }
      ctx.fill();
    }

    // tıklama şok dalgası parlaması
    if (engine.bursts.length) {
      for (let b = 0; b < engine.bursts.length; b++) {
        const bu = engine.bursts[b];
        const life = bu.age / 0.8;
        const x1 = bu.x * cosY;
        const z1 = bu.x * sinY;
        const y2 = bu.y * cosX - z1 * sinX;
        const z2 = bu.y * sinX + z1 * cosX;
        const persp = 1 + (z2 > 1 ? 1 : z2 < -1 ? -1 : z2) * 0.42;
        const bx = cx + x1 * base * persp;
        const by = cy + y2 * base * persp;
        const rad = (0.10 + life * 1.15) * base * persp;
        const a = Math.max(0, (1 - life) * (1 - life) * 0.55);
        if (a <= 0.002) continue;
        const gg = ctx.createRadialGradient(bx, by, 0, bx, by, Math.max(6, rad));
        const cWhite = lut[lut.length - 1].rgb.join(',');
        gg.addColorStop(0, 'rgba(' + cWhite + ',' + (a).toFixed(3) + ')');
        gg.addColorStop(0.35, 'rgba(' + cWhite + ',' + (a * 0.35).toFixed(3) + ')');
        gg.addColorStop(1, 'rgba(' + cWhite + ',0)');
        ctx.globalAlpha = 1;
        ctx.fillStyle = gg;
        ctx.beginPath();
        ctx.arc(bx, by, Math.max(6, rad), 0, TAU);
        ctx.fill();
      }
    }

    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
  };

  /* PNG çıktısı: ekranı bozmadan ayrı tuvalde tek kare render eder */
  Renderer.prototype.exportPNG = function (engine, palette, callback) {
    const W = this.W, H = this.H;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const c = document.createElement('canvas');
    c.width = Math.round(W * dpr);
    c.height = Math.round(H * dpr);
    const ctx = c.getContext('2d', { alpha: false });
    this.drawInto(ctx, W, H, dpr, engine, palette, { fade: 0, aura: 1 });
    if (c.toBlob) {
      c.toBlob(function (blob) { callback(blob); }, 'image/png');
    } else {
      callback(null);
    }
  };

  NS.Renderer = Renderer;
})();
