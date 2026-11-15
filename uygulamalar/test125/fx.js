/* NUMEX RESCUE — görsel katman (fx.js)
   Sahnenin tüm canvas çizimi burada. Karar mantığına (sim.js) dokunmaz;
   yalnız simülasyon durumunu okur ve ekrana çizer. */
(function (global) {
  'use strict';

  var TAU = Math.PI * 2;

  var STATE_COL = {
    idle: '#35e08a',
    enroute: '#38e1ff',
    rescuing: '#ffd93d',
    returning: '#a8b8cf',
    charging: '#79c7e0',
    failed: '#ff3b5c'
  };

  /* ---------- yardımcılar ---------- */

  function hash(a, b) {
    var x = Math.sin(a * 127.1 + b * 311.7) * 43758.5453;
    return x - Math.floor(x);
  }

  function rgba(hex, a) {
    var h = hex.replace('#', '');
    var r = parseInt(h.substring(0, 2), 16);
    var g = parseInt(h.substring(2, 4), 16);
    var b = parseInt(h.substring(4, 6), 16);
    return 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')';
  }

  function roundRect(c, x, y, w, h, r) {
    r = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
    c.beginPath();
    c.moveTo(x + r, y); c.lineTo(x + w - r, y); c.quadraticCurveTo(x + w, y, x + w, y + r);
    c.lineTo(x + w, y + h - r); c.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    c.lineTo(x + r, y + h); c.quadraticCurveTo(x, y + h, x, y + h - r);
    c.lineTo(x, y + r); c.quadraticCurveTo(x, y, x + r, y); c.closePath();
  }

  /* ---------- renderer ---------- */

  function Renderer(ctx, canvas, sim, view) {
    this.ctx = ctx;
    this.canvas = canvas;
    this.sim = sim;
    this.view = view;
    this.trails = {};
    this.smoke = [];
    this.sparks = [];
    this.grain = this.buildGrain();
    this.seedSmoke();
    this.shake = 0;
    this.lastBurst = 0;
  }

  Renderer.prototype.reset = function () {
    this.trails = {};
    this.smoke = [];
    this.sparks = [];
    this.seedSmoke();
  };

  /* film grain dokusu: bir kez üretilir, her karede döşenir */
  Renderer.prototype.buildGrain = function () {
    var size = 128;
    var c = document.createElement('canvas');
    c.width = size; c.height = size;
    var g = c.getContext('2d');
    var img = g.createImageData(size, size);
    for (var i = 0; i < img.data.length; i += 4) {
      var v = 120 + Math.random() * 135;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
      img.data[i + 3] = 14;
    }
    g.putImageData(img, 0, 0);
    return c;
  };

  Renderer.prototype.seedSmoke = function () {
    var self = this;
    this.sim.city.debris.forEach(function (d, i) {
      for (var k = 0; k < 8; k++) {
        self.smoke.push(self.newPuff(d, i * 7 + k, true));
      }
    });
  };

  Renderer.prototype.newPuff = function (d, salt, preroll) {
    var a = hash(d.seed || 1, salt) * TAU;
    var rad = hash(d.seed || 2, salt + 3) * d.r * 0.6;
    return {
      x: d.x + Math.cos(a) * rad,
      y: d.y + Math.sin(a) * rad * 0.6,
      r: 7 + hash(d.seed || 3, salt + 5) * 14,
      life: preroll ? hash(d.seed || 4, salt + 9) * 3 : 0,
      max: 3.4 + hash(d.seed || 5, salt + 11) * 2.4,
      vy: -(5 + hash(d.seed || 6, salt + 13) * 10),
      vx: (hash(d.seed || 7, salt + 15) - 0.5) * 6,
      grow: 4 + hash(d.seed || 8, salt + 17) * 8,
      src: d
    };
  };

  /* ---------- parçacık güncelleme ---------- */

  Renderer.prototype.updateParticles = function (dt, paused) {
    if (paused) return;
    var sim = this.sim, i;

    /* duman: enkaz kaynaklarından doğ, yukarı süzül, genişleyerek solar */
    for (i = this.smoke.length - 1; i >= 0; i--) {
      var p = this.smoke[i];
      p.life += dt;
      p.x += p.vx * dt + Math.sin((sim.t + p.max) * 0.8) * 2.2 * dt;
      p.y += p.vy * dt;
      p.r += p.grow * dt;
      if (p.life > p.max) {
        this.smoke.splice(i, 1);
        if (this.smoke.length < this.sim.city.debris.length * 7) {
          this.smoke.push(this.newPuff(p.src, Math.floor(Math.random() * 900), false));
        }
      }
    }

    /* kıvılcım: patlama anlarında fışkırır */
    for (i = this.sparks.length - 1; i >= 0; i--) {
      var s = this.sparks[i];
      s.life -= dt;
      if (s.life <= 0) { this.sparks.splice(i, 1); continue; }
      s.x += s.vx * dt; s.y += s.vy * dt;
      s.vx *= 0.965; s.vy = s.vy * 0.965 + 12 * dt;
    }

    if (this.shake > 0) this.shake = Math.max(0, this.shake - dt * 3.4);
  };

  Renderer.prototype.burst = function (x, y, color, n) {
    for (var i = 0; i < (n || 14); i++) {
      var a = Math.random() * TAU, sp = 30 + Math.random() * 90;
      this.sparks.push({
        x: x, y: y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 20,
        life: 0.4 + Math.random() * 0.7, max: 1, color: color, r: 1 + Math.random() * 1.8
      });
    }
    this.shake = Math.min(1, this.shake + 0.55);
  };

  /* ---------- zemin katmanları ---------- */

  Renderer.prototype.drawGround = function (ctx) {
    var W = this.sim.WORLD || { w: 1200, h: 800 };
    var g = ctx.createRadialGradient(W.w / 2, W.h * 0.34, 40, W.w / 2, W.h / 2, W.w * 0.86);
    g.addColorStop(0, '#0b1828');
    g.addColorStop(0.55, '#071020');
    g.addColorStop(1, '#04070d');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W.w, W.h);

    /* blok dokusu: çok hafif ızgara */
    ctx.strokeStyle = 'rgba(56,225,255,.032)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (var x = 0; x <= W.w; x += 60) { ctx.moveTo(x, 0); ctx.lineTo(x, W.h); }
    for (var y = 0; y <= W.h; y += 60) { ctx.moveTo(0, y); ctx.lineTo(W.w, y); }
    ctx.stroke();
  };

  Renderer.prototype.drawSectorLabels = function (ctx) {
    var W = 1200, H = 800;
    ctx.font = '600 10px ui-monospace, monospace';
    ctx.fillStyle = 'rgba(56,225,255,.16)';
    ctx.textAlign = 'left';
    var cols = 'ABCDEF', rows = 4, stepX = W / 6, stepY = H / rows;
    for (var c = 0; c < 6; c++) {
      for (var r = 0; r < rows; r++) {
        ctx.fillText(cols[c] + (r + 1), c * stepX + 10, r * stepY + 16);
      }
    }
  };

  Renderer.prototype.drawRoads = function (ctx) {
    var roads = this.sim.city.roads;
    ctx.lineCap = 'round';

    /* asfalt taban */
    ctx.strokeStyle = '#0a1421';
    ctx.lineWidth = 19;
    ctx.beginPath();
    roads.forEach(function (r) { ctx.moveTo(r.x1, r.y1); ctx.lineTo(r.x2, r.y2); });
    ctx.stroke();

    /* asfalt iç dokusu */
    ctx.strokeStyle = 'rgba(20,36,56,.9)';
    ctx.lineWidth = 13;
    ctx.beginPath();
    roads.forEach(function (r) { ctx.moveTo(r.x1, r.y1); ctx.lineTo(r.x2, r.y2); });
    ctx.stroke();

    /* orta şerit */
    ctx.strokeStyle = 'rgba(120,180,220,.14)';
    ctx.lineWidth = 1;
    ctx.setLineDash([7, 12]);
    ctx.beginPath();
    roads.forEach(function (r) { ctx.moveTo(r.x1, r.y1); ctx.lineTo(r.x2, r.y2); });
    ctx.stroke();
    ctx.setLineDash([]);

    /* kenar neonu */
    ctx.strokeStyle = 'rgba(56,225,255,.05)';
    ctx.lineWidth = 21;
    ctx.beginPath();
    roads.forEach(function (r) { ctx.moveTo(r.x1, r.y1); ctx.lineTo(r.x2, r.y2); });
    ctx.stroke();
  };

  Renderer.prototype.drawBuildings = function (ctx) {
    var t = this.sim.t;
    this.sim.city.buildings.forEach(function (b, i) {
      var tone = b.tone;
      var nearDebris = false;
      /* enkaz yakınındaki binalar hasarlı görünür */
      for (var k = 0; k < this.sim.city.debris.length; k++) {
        var d = this.sim.city.debris[k];
        if (Math.hypot(b.x + b.w / 2 - d.x, b.y + b.h / 2 - d.y) < d.r + 55) { nearDebris = true; break; }
      }

      var base = tone > 0.78 ? '#22375a' : (tone > 0.45 ? '#1a2c46' : '#14223a');
      var top = tone > 0.78 ? '#2d4870' : (tone > 0.45 ? '#243a5c' : '#1c2e4a');

      var g = ctx.createLinearGradient(b.x, b.y, b.x + b.w * 0.4, b.y + b.h);
      g.addColorStop(0, top);
      g.addColorStop(1, base);
      ctx.fillStyle = g;
      roundRect(ctx, b.x, b.y, b.w, b.h, 2.5);
      ctx.fill();

      /* çatı ışığı (üst-sol) */
      ctx.strokeStyle = 'rgba(140,205,255,.30)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(b.x + 1, b.y + b.h - 2);
      ctx.lineTo(b.x + 1, b.y + 1.5);
      ctx.lineTo(b.x + b.w - 1, b.y + 1.5);
      ctx.stroke();

      /* pencere ışıkları: bina başına deterministik */
      if (b.w > 34 && b.h > 30) {
        var cols = Math.max(2, Math.floor(b.w / 16));
        var rows = Math.max(2, Math.floor(b.h / 16));
        var px = (b.w - cols * 9) / 2 + 2, py = (b.h - rows * 9) / 2 + 2;
        for (var cx = 0; cx < cols; cx++) {
          for (var cy = 0; cy < rows; cy++) {
            var h = hash(i * 13 + cx, cy * 7 + 1);
            if (h < 0.55) continue;
            var lit = h > 0.86;
            var blink = lit ? 0.35 + 0.3 * Math.sin(t * 1.3 + h * 30) : 0;
            ctx.fillStyle = nearDebris
              ? 'rgba(255,130,70,' + (0.30 + h * 0.35) + ')'
              : (lit ? 'rgba(135,225,255,' + (0.30 + blink) + ')' : 'rgba(120,175,220,.20)');
            ctx.fillRect(b.x + px + cx * 9, b.y + py + cy * 9, 4, 4);
          }
        }
      }

      /* hasarlı bina: çatlak */
      if (nearDebris) {
        ctx.strokeStyle = 'rgba(255,110,60,.35)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        var sx = b.x + b.w * 0.3, sy = b.y + b.h * 0.15;
        ctx.moveTo(sx, sy);
        ctx.lineTo(sx + b.w * 0.16, sy + b.h * 0.28);
        ctx.lineTo(sx + b.w * 0.05, sy + b.h * 0.5);
        ctx.lineTo(sx + b.w * 0.22, sy + b.h * 0.72);
        ctx.stroke();
      }

      ctx.strokeStyle = nearDebris ? 'rgba(255,140,80,.20)' : 'rgba(56,225,255,.10)';
      ctx.lineWidth = 1;
      roundRect(ctx, b.x, b.y, b.w, b.h, 2.5);
      ctx.stroke();
    }, this);
  };

  Renderer.prototype.drawDebris = function (ctx) {
    var t = this.sim.t;
    this.sim.city.debris.forEach(function (d) {
      var pulse = 0.5 + 0.5 * Math.sin(t * 1.1 + d.seed);

      var g = ctx.createRadialGradient(d.x, d.y, 0, d.x, d.y, d.r * 1.3);
      g.addColorStop(0, 'rgba(255,130,55,' + (0.10 + pulse * 0.05) + ')');
      g.addColorStop(0.5, 'rgba(190,80,40,.06)');
      g.addColorStop(1, 'rgba(120,50,30,0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(d.x, d.y, d.r * 1.3, 0, TAU); ctx.fill();

      /* moloz yığını: düzensiz poligon */
      ctx.beginPath();
      /* Moloz yığını: az dalgalanan dış hat — yıldız gibi değil, yıkık kütle gibi okunsun. */
      for (var i = 0; i <= 22; i++) {
        var a = (i / 22) * TAU;
        var rr = d.r * (0.80 + hash(d.seed, i % 11) * 0.20) * (1 - Math.max(0, Math.sin(a)) * 0.12);
        var px = d.x + Math.cos(a) * rr, py = d.y + Math.sin(a) * rr * 0.85;
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.closePath();
      /* beton/moloz gövdesi: kahverengi taş değil, kırık beton kütlesi */
      var bg = ctx.createLinearGradient(d.x - d.r * 0.7, d.y - d.r * 0.8, d.x + d.r * 0.6, d.y + d.r);
      bg.addColorStop(0, 'rgba(92,94,104,.95)');
      bg.addColorStop(0.55, 'rgba(58,60,70,.95)');
      bg.addColorStop(1, 'rgba(30,31,38,.97)');
      ctx.fillStyle = bg; ctx.fill();
      ctx.strokeStyle = 'rgba(255,150,90,' + (0.30 + pulse * 0.22) + ')';
      ctx.lineWidth = 1.1; ctx.stroke();

      /* kırık beton plakaları: hafif açılı dörtgenler */
      for (var q = 0; q < 5; q++) {
        var qa = hash(d.seed + 21, q) * TAU;
        var qd = hash(d.seed + 33, q) * d.r * 0.5;
        var qx = d.x + Math.cos(qa) * qd, qy = d.y + Math.sin(qa) * qd * 0.85;
        var qw = 7 + hash(d.seed + 41, q) * 12, qh = 4 + hash(d.seed + 51, q) * 7;
        ctx.save();
        ctx.translate(qx, qy);
        ctx.rotate(hash(d.seed + 61, q) * 1.2 - 0.6);
        ctx.fillStyle = 'rgba(146,148,160,.55)';
        ctx.fillRect(-qw / 2, -qh / 2, qw, qh);
        ctx.strokeStyle = 'rgba(210,215,228,.34)';
        ctx.lineWidth = 0.8;
        ctx.strokeRect(-qw / 2, -qh / 2, qw, qh);
        ctx.restore();
      }

      /* sıcak çatlaklar */
      ctx.strokeStyle = 'rgba(255,140,70,' + (0.18 + pulse * 0.2) + ')';
      ctx.lineWidth = 0.9;
      ctx.beginPath();
      var cx0 = d.x - d.r * 0.4, cy0 = d.y - d.r * 0.2;
      ctx.moveTo(cx0, cy0);
      ctx.lineTo(cx0 + d.r * 0.3, cy0 + d.r * 0.16);
      ctx.lineTo(cx0 + d.r * 0.45, cy0 + d.r * 0.42);
      ctx.stroke();

      /* iç moloz parçaları */
      for (var k = 0; k < 14; k++) {
        var ha = hash(d.seed + 5, k) * TAU;
        var hr = hash(d.seed + 9, k) * d.r * 0.55;
        var hx = d.x + Math.cos(ha) * hr, hy = d.y + Math.sin(ha) * hr;
        var hs = 2 + hash(d.seed + 11, k) * 5;
        ctx.fillStyle = 'rgba(20,16,18,.75)';
        ctx.fillRect(hx, hy, hs, hs * 0.8);
        ctx.strokeStyle = 'rgba(255,170,110,.18)';
        ctx.lineWidth = 1;
        ctx.strokeRect(hx, hy, hs, hs * 0.8);
      }
    }, this);
  };

  Renderer.prototype.drawSmoke = function (ctx) {
    var self = this;
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    this.smoke.forEach(function (p) {
      var k = p.life / p.max;
      var a = Math.sin(Math.min(1, k) * Math.PI) * 0.22;
      if (a <= 0.002) return;
      var g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
      g.addColorStop(0, 'rgba(190,200,215,' + a + ')');
      g.addColorStop(0.6, 'rgba(120,130,150,' + (a * 0.5) + ')');
      g.addColorStop(1, 'rgba(90,100,120,0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, TAU); ctx.fill();
    });
    ctx.restore();
  };

  Renderer.prototype.drawSparks = function (ctx) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    this.sparks.forEach(function (s) {
      ctx.globalAlpha = Math.max(0, s.life);
      ctx.fillStyle = s.color;
      ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, TAU); ctx.fill();
    });
    ctx.restore();
  };

  Renderer.prototype.drawHospitals = function (ctx) {
    var t = this.sim.t;
    this.sim.city.hospitals.forEach(function (h, i) {
      ctx.save();
      ctx.translate(h.x, h.y);

      var pulse = 0.5 + 0.5 * Math.sin(t * 2 + i);
      var g = ctx.createRadialGradient(0, 0, 0, 0, 0, 34);
      g.addColorStop(0, 'rgba(53,224,138,' + (0.10 + pulse * 0.06) + ')');
      g.addColorStop(1, 'rgba(53,224,138,0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(0, 0, 34, 0, TAU); ctx.fill();

      ctx.fillStyle = 'rgba(8,32,26,.96)';
      roundRect(ctx, -15, -15, 30, 30, 7); ctx.fill();
      ctx.strokeStyle = 'rgba(53,224,138,.65)'; ctx.lineWidth = 1.3; ctx.stroke();

      ctx.fillStyle = '#35e08a';
      ctx.fillRect(-2.2, -8.5, 4.4, 17);
      ctx.fillRect(-8.5, -2.2, 17, 4.4);

      ctx.font = '600 8px ui-monospace, monospace';
      ctx.fillStyle = 'rgba(53,224,138,.65)';
      ctx.textAlign = 'center';
      ctx.fillText('H' + (i + 1), 0, 26);
      ctx.restore();
    }, this);
  };

  Renderer.prototype.drawStations = function (ctx) {
    var t = this.sim.t;
    this.sim.city.stations.forEach(function (s, idx) {
      ctx.save();
      ctx.translate(s.x, s.y);

      /* dış radar halkaları */
      for (var r = 0; r < 2; r++) {
        var ph = ((t * 0.45 + r * 0.5) % 1);
        ctx.beginPath();
        ctx.arc(0, 0, 24 + ph * 34, 0, TAU);
        ctx.strokeStyle = 'rgba(56,225,255,' + (0.16 * (1 - ph)) + ')';
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      /* dönen hizmet halkası */
      ctx.save();
      ctx.rotate(t * 0.6 + idx * 1.7);
      ctx.setLineDash([9, 7]);
      ctx.beginPath(); ctx.arc(0, 0, 27, 0, TAU);
      ctx.strokeStyle = 'rgba(56,225,255,.28)'; ctx.lineWidth = 1.2; ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();

      /* gövde altıgeni */
      ctx.beginPath();
      for (var i = 0; i < 6; i++) {
        var a = Math.PI / 6 + i * Math.PI / 3;
        var x = Math.cos(a) * 17, y = Math.sin(a) * 17;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.closePath();
      var g = ctx.createLinearGradient(-17, -17, 17, 17);
      g.addColorStop(0, 'rgba(20,74,96,.95)');
      g.addColorStop(1, 'rgba(8,30,42,.95)');
      ctx.fillStyle = g; ctx.fill();
      ctx.strokeStyle = 'rgba(56,225,255,.8)'; ctx.lineWidth = 1.5; ctx.stroke();

      /* iç "H" platform işareti */
      ctx.beginPath(); ctx.arc(0, 0, 6.5, 0, TAU);
      ctx.strokeStyle = 'rgba(56,225,255,.8)'; ctx.lineWidth = 1.2; ctx.stroke();
      ctx.beginPath(); ctx.arc(0, 0, 2.2, 0, TAU);
      ctx.fillStyle = '#9ceeff'; ctx.fill();

      ctx.font = '700 8.5px ui-monospace, monospace';
      ctx.fillStyle = 'rgba(139,233,255,.85)';
      ctx.textAlign = 'center';
      ctx.fillText('ÜS-' + s.id, 0, 33);
      ctx.restore();
    }, this);
  };

  Renderer.prototype.drawNfz = function (ctx) {
    var t = this.sim.t;
    this.sim.city.nfz.forEach(function (z) {
      var grow = Math.min(1, (t - z.born) / 0.9);
      var isNew = z.born > 0 && grow < 1;

      if (isNew) {
        ctx.beginPath(); ctx.arc(z.x, z.y, z.r * (1.5 - grow * 0.5), 0, TAU);
        ctx.strokeStyle = 'rgba(255,59,92,' + (1 - grow) * 0.8 + ')';
        ctx.lineWidth = 2.2; ctx.stroke();
      }

      /* dolgu + çapraz tarama */
      ctx.save();
      ctx.beginPath(); ctx.arc(z.x, z.y, z.r, 0, TAU); ctx.clip();

      var g = ctx.createRadialGradient(z.x, z.y, z.r * 0.1, z.x, z.y, z.r);
      g.addColorStop(0, 'rgba(255,59,92,.055)');
      g.addColorStop(0.7, 'rgba(255,59,92,.045)');
      g.addColorStop(1, 'rgba(255,59,92,.14)');
      ctx.fillStyle = g;
      ctx.fillRect(z.x - z.r, z.y - z.r, z.r * 2, z.r * 2);

      ctx.strokeStyle = 'rgba(255,59,92,.065)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (var i = -z.r; i < z.r * 2; i += 12) {
        ctx.moveTo(z.x - z.r + i, z.y - z.r);
        ctx.lineTo(z.x - z.r + i - z.r * 2, z.y + z.r);
      }
      ctx.stroke();
      ctx.restore();

      /* dönen kesikli sınır */
      ctx.setLineDash([9, 8]);
      ctx.lineDashOffset = -t * 22;
      ctx.strokeStyle = 'rgba(255,59,92,.65)'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(z.x, z.y, z.r, 0, TAU); ctx.stroke();
      ctx.setLineDash([]);
      ctx.lineDashOffset = 0;

      /* merkez uyarı üçgeni */
      ctx.save();
      ctx.translate(z.x, z.y);
      var a = 0.35 + 0.25 * Math.sin(t * 3);
      ctx.beginPath();
      ctx.moveTo(0, -7); ctx.lineTo(6.5, 5); ctx.lineTo(-6.5, 5); ctx.closePath();
      ctx.strokeStyle = 'rgba(255,140,160,' + a + ')'; ctx.lineWidth = 1.3; ctx.stroke();
      ctx.font = '600 7.5px ui-monospace, monospace';
      ctx.fillStyle = 'rgba(255,140,160,.8)'; ctx.textAlign = 'center';
      ctx.fillText('YASAK', 0, 16);
      ctx.restore();
    }, this);
  };

  Renderer.prototype.drawCalls = function (ctx) {
    var t = this.sim.t, PRI = this.sim.PRIORITY || global.RescueSim.PRIORITY;

    this.sim.calls.forEach(function (c) {
      if (c.status === 'done') return;
      var p = PRI[c.priority];
      var assigned = c.status !== 'pending';
      var age = t - c.createdAt;

      ctx.save();
      ctx.translate(c.x, c.y);
      ctx.globalAlpha = assigned ? 0.9 : 1;

      /* radar halkaları */
      if (!assigned) {
        for (var r = 0; r < 2; r++) {
          var ph = ((age * 0.75 + r * 0.5) % 1);
          ctx.beginPath();
          ctx.arc(0, 0, 8 + ph * 22, 0, TAU);
          ctx.strokeStyle = rgba(p.color, 0.28 * (1 - ph));
          ctx.lineWidth = 1.2;
          ctx.stroke();
        }
      }

      /* dikey ışık sütunu */
      var lg = ctx.createLinearGradient(0, -40, 0, 4);
      lg.addColorStop(0, rgba(p.color, 0));
      lg.addColorStop(1, rgba(p.color, assigned ? 0.10 : 0.22));
      ctx.fillStyle = lg;
      ctx.fillRect(-1.2, -40, 2.4, 44);

      /* pin gövdesi */
      ctx.beginPath();
      ctx.moveTo(0, 4);
      ctx.lineTo(-7.6, -8.5); ctx.lineTo(7.6, -8.5);
      ctx.closePath();
      ctx.fillStyle = p.color;
      ctx.fill();

      /* dış hale: karanlık sahrede pin uzaktan da seçilsin */
      var hg = ctx.createRadialGradient(0, -9, 0, 0, -9, 17);
      hg.addColorStop(0, rgba(p.color, assigned ? 0.24 : 0.38));
      hg.addColorStop(1, rgba(p.color, 0));
      ctx.fillStyle = hg;
      ctx.beginPath(); ctx.arc(0, -9, 17, 0, TAU); ctx.fill();

      /* baş */
      ctx.beginPath(); ctx.arc(0, -9, 8.2, 0, TAU);
      ctx.fillStyle = p.color; ctx.fill();
      ctx.strokeStyle = 'rgba(3,8,14,.65)'; ctx.lineWidth = 1.4; ctx.stroke();

      /* iç halka */
      ctx.beginPath(); ctx.arc(0, -9, 3.4, 0, TAU);
      ctx.strokeStyle = 'rgba(3,8,14,.45)'; ctx.lineWidth = 1; ctx.stroke();

      if (!assigned) {
        ctx.font = '700 9.5px ui-monospace, monospace';
        ctx.fillStyle = 'rgba(6,12,20,.95)';
        ctx.textAlign = 'center';
        ctx.fillText(c.people, 0, -5.9);
      }

      /* yaş etiketi */
      if (age > 20 && !assigned) {
        ctx.font = '600 8px ui-monospace, monospace';
        ctx.fillStyle = 'rgba(255,170,185,.95)';
        ctx.textAlign = 'center';
        ctx.fillText(Math.floor(age) + 's', 0, -20);
      }

      /* atanmış drone bağlantısı */
      if (assigned && c.droneId) {
        ctx.setLineDash([2, 5]);
        ctx.strokeStyle = rgba(p.color, 0.3);
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(0, -9, 11.5, 0, TAU); ctx.stroke();
        ctx.setLineDash([]);
      }

      ctx.restore();
    }, this);
  };

  Renderer.prototype.drawDrone = function (ctx, d) {
    var sim = this.sim;
    var col = STATE_COL[d.state] || '#35e08a';
    var t = sim.t;

    /* iz kaydı */
    var tr = this.trails[d.id] || (this.trails[d.id] = []);
    var lastPt = tr[tr.length - 1];
    if (!lastPt || Math.hypot(lastPt.x - d.x, lastPt.y - d.y) > 1.2) {
      tr.push({ x: d.x, y: d.y, t: t });
      if (tr.length > 42) tr.shift();
    }

    /* iz: solan çizgi */
    if (tr.length > 1 && d.state !== 'failed') {
      for (var i = 1; i < tr.length; i++) {
        var k = i / tr.length;
        ctx.beginPath();
        ctx.moveTo(tr[i - 1].x, tr[i - 1].y);
        ctx.lineTo(tr[i].x, tr[i].y);
        ctx.strokeStyle = rgba(col, 0.03 + k * 0.16);
        ctx.lineWidth = 0.7 + k * 1.6;
        ctx.stroke();
      }
    }

    /* planlanan rota (uçuş hattı) */
    if ((d.state === 'enroute' || d.state === 'returning') && d.path) {
      ctx.setLineDash([4, 7]);
      ctx.lineDashOffset = -t * 26;
      ctx.strokeStyle = rgba(col, 0.20);
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.moveTo(d.x, d.y);
      for (var p = d.pathIdx || 0; p < d.path.length; p++) ctx.lineTo(d.path[p].x, d.path[p].y);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.lineDashOffset = 0;
    }

    /* hedefe bağlantı */
    if (d.state === 'enroute' && d.missionId) {
      var call = sim.callById(d.missionId);
      if (call) {
        ctx.setLineDash([2, 8]);
        ctx.strokeStyle = 'rgba(56,225,255,.16)';
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(d.x, d.y); ctx.lineTo(call.x, call.y); ctx.stroke();
        ctx.setLineDash([]);
      }
    }

    ctx.save();
    ctx.translate(d.x, d.y);

    /* arama ışığı konisi */
    if (d.state === 'enroute' || d.state === 'rescuing') {
      ctx.save();
      ctx.rotate(d.heading);
      var lg = ctx.createRadialGradient(0, 0, 2, 0, 0, 46);
      lg.addColorStop(0, rgba(d.state === 'rescuing' ? '#ffd93d' : '#38e1ff', 0.22));
      lg.addColorStop(1, rgba(d.state === 'rescuing' ? '#ffd93d' : '#38e1ff', 0));
      ctx.fillStyle = lg;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, 46, -0.42, 0.42);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    /* neon hale */
    if (d.state !== 'failed') {
      var g = ctx.createRadialGradient(0, 0, 0, 0, 0, 24);
      g.addColorStop(0, rgba(col, 0.42));
      g.addColorStop(0.45, rgba(col, 0.14));
      g.addColorStop(1, rgba(col, 0));
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(0, 0, 24, 0, TAU); ctx.fill();
    }

    /* rotorlar (dönen) */
    ctx.save();
    ctx.rotate(d.heading + Math.PI / 2);
    var spin = t * 26;
    ctx.strokeStyle = d.state === 'failed' ? 'rgba(120,50,60,.5)' : 'rgba(200,235,255,.5)';
    ctx.lineWidth = 1;
    var rotors = [[-7.5, -7], [7.5, -7], [-7.5, 7], [7.5, 7]];
    for (var r = 0; r < 4; r++) {
      var rx = rotors[r][0], ry = rotors[r][1];
      ctx.beginPath();
      ctx.arc(rx, ry, 4.6, 0, TAU);
      ctx.strokeStyle = rgba(col, d.state === 'failed' ? 0.2 : 0.32);
      ctx.stroke();
      var ang = spin + r * 1.4;
      ctx.beginPath();
      ctx.moveTo(rx + Math.cos(ang) * 4.4, ry + Math.sin(ang) * 4.4);
      ctx.lineTo(rx - Math.cos(ang) * 4.4, ry - Math.sin(ang) * 4.4);
      ctx.strokeStyle = d.state === 'failed' ? 'rgba(150,70,80,.6)' : 'rgba(225,245,255,.75)';
      ctx.lineWidth = 1.1;
      ctx.stroke();
    }
    /* gövde */
    ctx.beginPath();
    ctx.moveTo(0, -8.5); ctx.lineTo(5.2, 5); ctx.lineTo(0, 2.4); ctx.lineTo(-5.2, 5);
    ctx.closePath();
    ctx.fillStyle = d.state === 'failed' ? '#3a1620' : col;
    ctx.fill();
    ctx.strokeStyle = 'rgba(3,9,16,.85)'; ctx.lineWidth = 1.1; ctx.stroke();
    ctx.restore();

    /* arıza işareti */
    if (d.state === 'failed') {
      ctx.beginPath(); ctx.arc(0, 0, 13, 0, TAU);
      ctx.strokeStyle = 'rgba(255,59,92,.5)'; ctx.lineWidth = 1.2;
      ctx.setLineDash([3, 4]); ctx.stroke(); ctx.setLineDash([]);
      ctx.font = '700 12px system-ui';
      ctx.fillStyle = '#ff3b5c'; ctx.textAlign = 'center';
      ctx.fillText('✕', 0, 4);
    }

    /* batarya yayı */
    var battCol = d.battery > 45 ? '#35e08a' : (d.battery > 20 ? '#ff9f1c' : '#ff3b5c');
    ctx.beginPath();
    ctx.arc(0, 0, 16, -Math.PI / 2, -Math.PI / 2 + Math.max(0, d.battery) / 100 * TAU);
    ctx.strokeStyle = battCol; ctx.lineWidth = 2;
    ctx.globalAlpha = 0.85; ctx.stroke(); ctx.globalAlpha = 1;
    ctx.beginPath();
    ctx.arc(0, 0, 16, 0, TAU);
    ctx.strokeStyle = 'rgba(150,190,220,.08)'; ctx.lineWidth = 2; ctx.stroke();

    /* kimlik rozeti — aynı üsteki drone'ların etiketleri üst üste binmesin diye dikey kaydırma */
    var label = d.id;
    var slot = (parseInt(d.id.slice(-2), 10) || 0) % 3;
    var ly = -30 - slot * 13;
    ctx.font = '700 8.5px ui-monospace, monospace';
    var wLabel = ctx.measureText(label).width + 10;
    ctx.fillStyle = 'rgba(4,10,18,.82)';
    roundRect(ctx, -wLabel / 2, ly, wLabel, 13, 4); ctx.fill();
    ctx.strokeStyle = rgba(col, 0.45); ctx.lineWidth = 1; ctx.stroke();
    ctx.fillStyle = rgba(col, 0.95);
    ctx.textAlign = 'center';
    ctx.fillText(label, 0, ly + 9.5);

    ctx.restore();
  };

  Renderer.prototype.drawDrones = function (ctx) {
    var self = this;
    this.sim.drones.forEach(function (d) { self.drawDrone(ctx, d); });
  };

  /* ---------- HUD (ekran uzayı) ---------- */

  Renderer.prototype.drawHud = function (ctx, w, h) {
    var view = this.view, W = 1200, H = 800;

    /* vinyet */
    var vg = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.32, w / 2, h / 2, Math.max(w, h) * 0.78);
    vg.addColorStop(0, 'rgba(0,0,0,0)');
    vg.addColorStop(1, 'rgba(0,0,0,.55)');
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, w, h);

    /* film grain */
    ctx.save();
    ctx.globalAlpha = 0.5;
    var pattern = ctx.createPattern(this.grain, 'repeat');
    if (pattern) { ctx.fillStyle = pattern; ctx.fillRect(0, 0, w, h); }
    ctx.restore();

    /* ölçek çubuğu — lejantın üstünde kalır, çakışmaz */
    var barPx = 200 * view.scale;
    var bx = view.ox + 24, by = h - 52;
    ctx.strokeStyle = 'rgba(139,233,255,.45)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(bx, by); ctx.lineTo(bx + barPx, by);
    ctx.moveTo(bx, by - 4); ctx.lineTo(bx, by + 4);
    ctx.moveTo(bx + barPx, by - 4); ctx.lineTo(bx + barPx, by + 4);
    ctx.stroke();
    ctx.font = '600 9px ui-monospace, monospace';
    ctx.fillStyle = 'rgba(139,233,255,.55)';
    ctx.textAlign = 'left';
    ctx.fillText('200 px', bx + barPx + 8, by + 3);

    /* pusula */
    var cx = view.ox + W * view.scale - 44, cy = view.oy + 46;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.beginPath(); ctx.arc(0, 0, 17, 0, TAU);
    ctx.strokeStyle = 'rgba(139,233,255,.28)'; ctx.lineWidth = 1; ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, -11); ctx.lineTo(4, 5); ctx.lineTo(0, 2.5); ctx.lineTo(-4, 5); ctx.closePath();
    ctx.fillStyle = 'rgba(56,225,255,.55)'; ctx.fill();
    ctx.font = '700 7.5px ui-monospace, monospace';
    ctx.fillStyle = 'rgba(139,233,255,.6)';
    ctx.textAlign = 'center';
    ctx.fillText('K', 0, -13);
    ctx.restore();
  };

  /* ---------- ana çizim ---------- */

  Renderer.prototype.draw = function (dt, hover, paused) {
    var ctx = this.ctx, canvas = this.canvas, view = this.view, sim = this.sim;
    var w = canvas.width / view.dpr, h = canvas.height / view.dpr;

    this.updateParticles(dt, paused);

    ctx.setTransform(view.dpr, 0, 0, view.dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    /* sahne zemini (ekran uzayı) */
    var bg = ctx.createRadialGradient(w * 0.5, h * 0.35, 40, w * 0.5, h * 0.5, Math.max(w, h) * 0.85);
    bg.addColorStop(0, '#08111f');
    bg.addColorStop(1, '#04070d');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    /* harita dışına taşan soluk ızgara */
    ctx.strokeStyle = 'rgba(56,225,255,.032)';
    ctx.lineWidth = 1;
    var stepPx = 60 * view.scale;
    if (stepPx > 2) {
      var gx0 = view.ox % stepPx, gy0 = view.oy % stepPx;
      ctx.beginPath();
      for (var gx = gx0; gx <= w; gx += stepPx) { ctx.moveTo(gx, 0); ctx.lineTo(gx, h); }
      for (var gy = gy0; gy <= h; gy += stepPx) { ctx.moveTo(0, gy); ctx.lineTo(w, gy); }
      ctx.stroke();
    }

    /* dünya uzayı */
    ctx.save();
    var sh = this.shake;
    var ox = sh > 0 ? (Math.random() - 0.5) * sh * 4 : 0;
    var oy = sh > 0 ? (Math.random() - 0.5) * sh * 4 : 0;
    ctx.translate(view.ox + ox, view.oy + oy);
    ctx.scale(view.scale, view.scale);
    ctx.beginPath(); ctx.rect(0, 0, 1200, 800); ctx.clip();

    this.drawGround(ctx);
    this.drawSectorLabels(ctx);
    this.drawRoads(ctx);
    this.drawBuildings(ctx);
    this.drawDebris(ctx);
    this.drawNfz(ctx);
    this.drawHospitals(ctx);
    this.drawStations(ctx);
    this.drawSmoke(ctx);

    /* bağlantı çizgileri ve çağrılar */
    this.drawCalls(ctx);
    this.drawDrones(ctx);
    this.drawSparks(ctx);

    /* imleç nişangâhı */
    if (hover) {
      ctx.save();
      ctx.translate(hover.x, hover.y);
      var pulse = 0.5 + 0.5 * Math.sin(sim.t * 5);
      ctx.strokeStyle = 'rgba(56,225,255,' + (0.35 + pulse * 0.35) + ')';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(0, 0, 13, 0, TAU); ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-19, 0); ctx.lineTo(-7, 0);
      ctx.moveTo(7, 0); ctx.lineTo(19, 0);
      ctx.moveTo(0, -19); ctx.lineTo(0, -7);
      ctx.moveTo(0, 7); ctx.lineTo(0, 19);
      ctx.stroke();
      ctx.setLineDash([3, 4]);
      ctx.beginPath(); ctx.arc(0, 0, 5, 0, TAU); ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    }

    ctx.restore();

    /* sektör çerçevesi */
    ctx.strokeStyle = 'rgba(56,225,255,.14)';
    ctx.lineWidth = 1;
    ctx.strokeRect(view.ox + 0.5, view.oy + 0.5, 1200 * view.scale - 1, 800 * view.scale - 1);

    /* köşe braketler */
    var bl = 26;
    var x0 = view.ox, y0 = view.oy, x1 = view.ox + 1200 * view.scale, y1 = view.oy + 800 * view.scale;
    ctx.strokeStyle = 'rgba(56,225,255,.45)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x0, y0 + bl); ctx.lineTo(x0, y0); ctx.lineTo(x0 + bl, y0);
    ctx.moveTo(x1 - bl, y0); ctx.lineTo(x1, y0); ctx.lineTo(x1, y0 + bl);
    ctx.moveTo(x0, y1 - bl); ctx.lineTo(x0, y1); ctx.lineTo(x0 + bl, y1);
    ctx.moveTo(x1 - bl, y1); ctx.lineTo(x1, y1); ctx.lineTo(x1, y1 - bl);
    ctx.stroke();

    this.drawHud(ctx, w, h);
  };

  global.RescueFX = { Renderer: Renderer, STATE_COL: STATE_COL };
})(typeof window !== 'undefined' ? window : globalThis);
