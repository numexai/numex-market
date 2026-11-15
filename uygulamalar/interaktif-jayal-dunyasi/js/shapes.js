/* Numex Dream Studio — şekil üreticileri.
   Her üretici tam olarak `count` adet hedef nokta döndürür: { x, y, z }
   Dünya uzayı: x/y yaklaşık -1.2..1.2, z -1..1 (derinlik). */
(function () {
  'use strict';
  const NS = (window.NDS = window.NDS || {});
  const TAU = Math.PI * 2;

  function rnd() { return Math.random(); }
  function gauss() {
    let u = 0, v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(TAU * v);
  }

  /* --- Galaksi: 4 sarmal kol + çekirdek şişkinliği --- */
  function galaxy(count) {
    const pts = new Array(count);
    const arms = 4;
    for (let i = 0; i < count; i++) {
      if (rnd() < 0.14) {
        // çekirdek: küresel şişkinlik
        const r = Math.pow(rnd(), 0.55) * 0.24;
        const th = rnd() * TAU;
        const ph = Math.acos(2 * rnd() - 1);
        pts[i] = {
          x: r * Math.sin(ph) * Math.cos(th),
          y: r * Math.sin(ph) * Math.sin(th) * 0.9,
          z: r * Math.cos(ph) * 1.2
        };
      } else {
        const t = Math.pow(rnd(), 0.62);
        const arm = (rnd() * arms) | 0;
        const spread = 0.20 * (1 - t * 0.5);
        // kolun dönüş açısı 1 turu geçerse kollar üst üste binip halka gibi görünür
        const ang = arm * (TAU / arms) + t * 4.6 + gauss() * spread;
        const rad = 0.13 + t * 1.04;
        pts[i] = {
          x: Math.cos(ang) * rad,
          y: Math.sin(ang) * rad,
          z: gauss() * 0.055 * (1.15 - t * 0.7)
        };
      }
    }
    return pts;
  }

  /* --- Kalp: parametrik kalp eğrisi, hacimli dolgu --- */
  function heart(count) {
    const pts = new Array(count);
    for (let i = 0; i < count; i++) {
      const t = rnd() * TAU;
      const hx = 16 * Math.pow(Math.sin(t), 3);
      const hy = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
      const edge = rnd() < 0.3;
      const s = edge ? 1 : Math.pow(rnd(), 0.45);
      const nx = (hx / 16) * s;
      const ny = (-hy / 16) * s;
      const thick = 0.42 * Math.sqrt(Math.max(0, 1 - (nx * nx + ny * ny) * 0.9));
      pts[i] = {
        x: nx * 0.80,
        y: ny * 0.86 - 0.10,
        z: gauss() * thick * 0.5
      };
    }
    return pts;
  }

  /* --- Kelebek: klasik kelebek eğrisi + gövde --- */
  function butterfly(count) {
    const pts = new Array(count);
    const TURNS = 10;
    let peak = 1e-6;
    const raw = new Array(count);
    for (let i = 0; i < count; i++) {
      const t = rnd() * TURNS * TAU;
      // klasik kelebek eğrisi: r = e^sin t - 2cos4t + sin^5((2t-pi)/24)
      const r = Math.exp(Math.sin(t)) - 2 * Math.cos(4 * t) +
        Math.pow(Math.sin((2 * t - Math.PI) / 24), 5);
      // ince bir şerit: dolgu yerine zarif bir dış hat
      const band = 0.93 + rnd() * 0.07;
      const x = Math.sin(t) * r * band;
      const y = Math.cos(t) * r * band;
      raw[i] = { x: x, y: y };
      const m = Math.max(Math.abs(x), Math.abs(y));
      if (m > peak) peak = m;
    }
    const k = 1.02 / peak;
    for (let i = 0; i < count; i++) {
      pts[i] = {
        x: raw[i].x * k,
        y: -raw[i].y * k + 0.02,
        z: gauss() * 0.045
      };
    }
    // gövde ve antenler
    const body = Math.max(10, (count * 0.05) | 0);
    for (let i = 0; i < body; i++) {
      if (i % 7 === 0) {
        const d = (rnd() - 0.5) * 0.5;
        pts[i] = { x: d * 0.34, y: 0.30 + Math.abs(d) * 0.55, z: gauss() * 0.03 };
      } else {
        pts[i] = {
          x: gauss() * 0.012,
          y: (rnd() - 0.5) * 0.42,
          z: gauss() * 0.03
        };
      }
    }
    return pts;
  }

  /* --- Çiçek: 5 yapraklı gül eğrisi + merkez --- */
  function flower(count) {
    const pts = new Array(count);
    const petals = 5;
    for (let i = 0; i < count; i++) {
      const a = rnd() * TAU;
      const shape = Math.pow(Math.abs(Math.cos((petals / 2) * a)), 1.6);
      const edge = rnd() < 0.28;
      const r = edge ? shape : shape * Math.pow(rnd(), 0.5);
      pts[i] = {
        x: Math.cos(a) * r,
        y: Math.sin(a) * r * 0.98,
        z: gauss() * 0.09 * (1 - r * 0.6) + Math.sin(a * 3) * 0.02
      };
    }
    const core = Math.max(10, (count * 0.09) | 0);
    for (let i = 0; i < core; i++) {
      const r = Math.pow(rnd(), 0.7) * 0.17;
      const a = rnd() * TAU;
      pts[i] = { x: Math.cos(a) * r, y: Math.sin(a) * r, z: gauss() * 0.05 };
    }
    return pts;
  }

  /* --- Yıldız: 5 köşeli, keskin uçlu --- */
  function star(count) {
    const pts = new Array(count);
    const points = 5, inner = 0.44;
    const seg = TAU / points;
    for (let i = 0; i < count; i++) {
      const a = -Math.PI / 2 + rnd() * TAU;
      const t = (((a + Math.PI / 2) % seg) + seg) % seg / seg;
      const w = Math.abs(2 * t - 1);          // köşede 1, arada 0
      const R = inner + (1 - inner) * w;
      const edge = rnd() < 0.3;
      const r = edge ? R : R * Math.pow(rnd(), 0.45);
      pts[i] = {
        x: Math.cos(a) * r,
        y: Math.sin(a) * r,
        z: gauss() * 0.10 * (1 - r * 0.7)
      };
    }
    return pts;
  }

  /* --- Girdap: 3B helezon tünel (bonus mod) --- */
  function vortex(count) {
    const pts = new Array(count);
    for (let i = 0; i < count; i++) {
      const t = rnd();
      const a = t * TAU * 3.4 + gauss() * 0.06;
      const R = 0.22 + 0.68 * t;
      pts[i] = {
        x: Math.cos(a) * R,
        y: Math.sin(a) * R * 0.62,
        z: (t - 0.5) * 0.95 + gauss() * 0.05
      };
    }
    return pts;
  }

  /* --- Metin: yazıyı tuvale çizip piksel örnekleme --- */
  function textPoints(str, count) {
    const text = String(str == null ? '' : str).trim();
    if (!text) return star(count);

    const FONT_PX = 200;
    const pad = 24;
    const font = '900 ' + FONT_PX + 'px "Segoe UI", system-ui, Arial, sans-serif';
    const probe = document.createElement('canvas').getContext('2d');
    probe.font = font;
    const meas = probe.measureText(text);
    const w = Math.min(1600, Math.max(64, Math.ceil(meas.width) + pad * 2));
    const h = Math.ceil(FONT_PX * 1.35);

    const cv = document.createElement('canvas');
    cv.width = w; cv.height = h;
    const g = cv.getContext('2d', { willReadFrequently: true });
    g.fillStyle = '#fff';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.font = font;
    g.fillText(text, w / 2, h / 2);

    const data = g.getImageData(0, 0, w, h).data;
    const xs = [], ys = [];
    const step = w > 900 ? 3 : 2;
    for (let y = 0; y < h; y += step) {
      for (let x = 0; x < w; x += step) {
        if (data[(y * w + x) * 4 + 3] > 140) { xs.push(x); ys.push(y); }
      }
    }
    if (!xs.length) return star(count);

    const k = Math.min(2.15 / w, 1.05 / h);
    const pts = new Array(count);
    for (let i = 0; i < count; i++) {
      const idx = (rnd() * xs.length) | 0;
      pts[i] = {
        x: (xs[idx] - w / 2) * k,
        // NUMEX-DÜZELTME (2026-11-15): Render katmanı ekran y'sini cy + y2*base ile çiziyor (dünya y'si negatifken yukarı). Metinde y'yi canvas yönüyle ters çevirdiğim için harfler baş aşağı çıkıyordu; simetrik şekillerde (kalp, yıldız, çiçek) bu fark görünmüyordu. İşaret, çizim hattının beklediği yöne çevrildi.
        // çizim hattı dünya y'sini ekranda aşağı doğru kullanır; bu yüzden
        // canvas'ın yukarıdan aşağı y'sini olduğu gibi aktarıyoruz
        y: (ys[idx] - h / 2) * k,
        z: gauss() * 0.06
      };
    }
    // derinlik hissi: arkada gezinen birkaç toz zerresi
    const dust = Math.max(6, (count * 0.03) | 0);
    for (let i = 0; i < dust; i++) {
      pts[i] = {
        x: (rnd() - 0.5) * 2.2,
        y: (rnd() - 0.5) * 1.2,
        z: -0.4 - rnd() * 0.6
      };
    }
    return pts;
  }

  const BUILDERS = { galaxy, heart, butterfly, flower, star, vortex };
  const LABELS = {
    galaxy: 'Galaksi', heart: 'Kalp', butterfly: 'Kelebek',
    flower: 'Çiçek', star: 'Yıldız', text: 'İsim', vortex: 'Girdap'
  };

  NS.SHAPES = {
    labels: LABELS,
    build: function (name, text, count) {
      count = Math.max(1, count | 0);
      let pts;
      if (name === 'text') pts = textPoints(text, count);
      else pts = (BUILDERS[name] || galaxy)(count);
      if (!pts || pts.length < count) {
        const fill = pts && pts.length ? pts[0] : { x: 0, y: 0, z: 0 };
        pts = pts || [];
        for (let i = pts.length; i < count; i++) pts.push(fill);
      }
      if (pts.length > count) pts.length = count;
      return pts;
    }
  };
})();
