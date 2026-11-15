/* Numex Dream Studio — parçacık fiziği motoru.
   Render'dan tamamen bağımsız: sadece konum/hız hesaplar. */
(function () {
  'use strict';
  const NS = (window.NDS = window.NDS || {});
  const TAU = Math.PI * 2;

  function makeParticle() {
    return {
      x: (Math.random() - 0.5) * 1.6,
      y: (Math.random() - 0.5) * 1.6,
      z: (Math.random() - 0.5) * 1.6,
      vx: 0, vy: 0, vz: 0,
      tx: 0, ty: 0, tz: 0,
      size: 1, colorIndex: 0, layer: 1,
      phase: Math.random() * TAU,
      jitter: 0.35 + Math.random() * 0.95
    };
  }

  function Engine(max) {
    this.max = max;
    this.particles = new Array(max);
    for (let i = 0; i < max; i++) this.particles[i] = makeParticle();
    this.count = 0;
    this.groups = [];          // colorIndex*3 + layer -> parçacık listesi
    this.time = 0;
    this.bursts = [];          // { x, y, age }
    this.shape = 'galaxy';
    this.text = 'DREAM';
    this.palette = NS.PALETTES[0];
  }

  Engine.prototype.setPalette = function (palette) {
    this.palette = palette;
    this.assignColors(0, this.count);
    this.buildGroups();
  };

  Engine.prototype.assignColors = function (from, to) {
    const lutLen = this.palette.lut.length;
    for (let i = from; i < to; i++) {
      const p = this.particles[i];
      // parlak uçlara hafif eğilimli rastgele renk
      let c = (Math.random() * lutLen) | 0;
      if (Math.random() < 0.25) c = Math.min(lutLen - 1, c + 2);
      if (Math.random() < 0.12) c = Math.max(0, c - 5);
      p.colorIndex = c;
      p.layer = p.tz > 0.2 ? 0 : (p.tz > -0.2 ? 1 : 2);
      p.size = 0.8 + Math.random() * 1.35;
      p.jitter = 0.35 + Math.random() * 0.95;
    }
  };

  Engine.prototype.buildGroups = function () {
    const total = this.palette.lut.length * 3;
    const g = new Array(total);
    for (let i = 0; i < total; i++) g[i] = [];
    const n = this.count;
    for (let i = 0; i < n; i++) {
      const p = this.particles[i];
      let k = p.colorIndex * 3 + p.layer;
      if (k < 0 || k >= total) k = 0;
      g[k].push(p);
    }
    this.groups = g;
  };

  /* Şekli ata: hedefler + renkler. Parçacıklar mevcut yerlerinden yeni
     şekle akıcı biçimde akar (geçiş animasyonu buradan doğar). */
  Engine.prototype.setShape = function (name, text, count) {
    this.shape = name;
    this.text = text;
    this.count = Math.max(200, Math.min(this.max, Math.round(count)));
    const pts = NS.SHAPES.build(name, text, this.count);
    for (let i = 0; i < this.count; i++) {
      const p = this.particles[i], q = pts[i] || { x: 0, y: 0, z: 0 };
      p.tx = q.x; p.ty = q.y; p.tz = q.z;
    }
    this.assignColors(0, this.count);
    // metin modunda harfler okunaklı kalsın: daha küçük ve daha düz tanecikler
    if (name === 'text') {
      for (let i = 0; i < this.count; i++) {
        const p = this.particles[i];
        p.size *= 0.62;
        p.tz *= 0.35;
        p.z *= 0.35;
      }
    }
    this.buildGroups();
  };

  /* Yoğunluk değişimi: mevcut şekli bozmadan parçacık ekle/çıkar. */
  Engine.prototype.setCount = function (n) {
    n = Math.max(200, Math.min(this.max, Math.round(n)));
    if (n === this.count) return;
    if (n > this.count && this.count > 0) {
      for (let i = this.count; i < n; i++) {
        const src = this.particles[(Math.random() * this.count) | 0];
        const p = this.particles[i];
        p.tx = src.tx + (Math.random() - 0.5) * 0.03;
        p.ty = src.ty + (Math.random() - 0.5) * 0.03;
        p.tz = src.tz + (Math.random() - 0.5) * 0.05;
        p.x = src.x + (Math.random() - 0.5) * 0.06;
        p.y = src.y + (Math.random() - 0.5) * 0.06;
        p.z = src.z + (Math.random() - 0.5) * 0.06;
        p.vx = p.vy = p.vz = 0;
        p.colorIndex = src.colorIndex;
        p.layer = src.layer;
        p.size = src.size * 0.92;
        p.phase = Math.random() * TAU;
        p.jitter = 0.35 + Math.random() * 0.95;
      }
    }
    this.count = n;
    this.buildGroups();
  };

  /* Tıklama: anlık itki + görsel şok dalgası kaydı */
  Engine.prototype.burst = function (x, y, power) {
    power = power || 1;
    this.bursts.push({ x: x, y: y, age: 0, power: power });
    const R = 0.95;
    const n = this.count;
    for (let i = 0; i < n; i++) {
      const p = this.particles[i];
      const dx = p.x - x, dy = p.y - y;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d < R) {
        const fall = 1 - d / R;
        const k = fall * fall * (2.8 * power) + 0.18 * power;
        const nx = d > 1e-4 ? dx / d : Math.random() - 0.5;
        const ny = d > 1e-4 ? dy / d : Math.random() - 0.5;
        p.vx += nx * k;
        p.vy += ny * k;
        p.vz += (Math.random() - 0.5) * k * 0.7;
      }
    }
  };

  /* env: { speed, pointer:{x,y,vx,vy,strength}, vortex, radius } */
  Engine.prototype.update = function (dt, env) {
    const spd = env.speed;
    this.time += dt * spd;
    const t = this.time;
    const n = this.count;
    const P = this.particles;
    const k = 9.5 * (0.55 + 0.45 * spd);
    const damp = Math.pow(0.865, dt * 60);

    const ptr = env.pointer;
    const px = ptr.x, py = ptr.y, pstr = ptr.strength;
    const pr = env.radius;
    const vortex = env.vortex;
    let pvx = 0, pvy = 0;
    if (pstr > 0) {
      pvx = Math.max(-6, Math.min(6, ptr.vx)) * 0.09;
      pvy = Math.max(-6, Math.min(6, ptr.vy)) * 0.09;
    }

    for (let i = 0; i < n; i++) {
      const p = P[i];

      // 1) hedefe yay
      p.vx += (p.tx - p.x) * k * dt;
      p.vy += (p.ty - p.y) * k * dt;
      p.vz += (p.tz - p.z) * k * dt;

      // 2) organik nefes (şekil canlı kalsın)
      const wob = 0.55 * p.jitter * spd;
      p.vx += Math.cos(t * 0.9 + p.phase) * 0.06 * wob * dt;
      p.vy += Math.sin(t * 1.13 + p.phase * 1.4) * 0.06 * wob * dt;
      p.vz += Math.sin(t * 0.7 + p.phase * 0.6) * 0.05 * wob * dt;

      // 3) işaretçi itmesi + akış sürüklemesi
      if (pstr > 0) {
        const dx = p.x - px, dy = p.y - py;
        const d2 = dx * dx + dy * dy;
        if (d2 < pr * pr && d2 > 1e-7) {
          const d = Math.sqrt(d2);
          const f = 1 - d / pr;
          const acc = f * f * 5.4 * pstr;
          const nx = dx / d, ny = dy / d;
          p.vx += nx * acc * dt;
          p.vy += ny * acc * dt;
          p.vx += pvx * f * dt * 10;
          p.vy += pvy * f * dt * 10;
        }
      }

      // 4) girdap (sürükleme)
      if (vortex > 0) {
        const dx = p.x - px, dy = p.y - py;
        const R = pr * 1.7;
        const d2 = dx * dx + dy * dy;
        if (d2 < R * R && d2 > 1e-7) {
          const d = Math.sqrt(d2);
          const f = 1 - d / R;
          const sw = vortex * 30 * f * f;
          p.vx += (-dy / d) * sw * dt;
          p.vy += (dx / d) * sw * dt;
          p.vz += (Math.random() - 0.5) * sw * dt * 0.3;
        }
      }

      // 5) sönümleme + integral
      p.vx *= damp; p.vy *= damp; p.vz *= damp;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.z += p.vz * dt;
    }

    // şok dalgalarının ömrü
    for (let b = this.bursts.length - 1; b >= 0; b--) {
      this.bursts[b].age += dt;
      if (this.bursts[b].age > 0.8) this.bursts.splice(b, 1);
    }
  };

  NS.Engine = Engine;
})();
