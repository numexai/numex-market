/* Numex Little Planet — nesne kütüphanesi (17 tür)
   Her üreteç, tabanı y=0'da duran bir THREE.Group döndürür.
   Konum/hizalama app.js'te yapılır: grup, gezegenin yüzey normaline oturtulur. */

window.NP = window.NP || {};

(function (NP) {
  'use strict';

  const T = THREE;
  const TAU = Math.PI * 2;

  /* Aynı seed her zaman aynı nesneyi üretir: JSON'dan yüklenince renkler de aynı kalır. */
  NP.rng = function (seed) {
    let a = (seed >>> 0) || 1;
    return function () {
      a += 0x6D2B79F5;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };

  const mat = (color, extra) => new T.MeshStandardMaterial(Object.assign({
    color: color, roughness: 0.78, metalness: 0.0
  }, extra || {}));

  const pick = (rnd, list) => list[Math.min(list.length - 1, Math.floor(rnd() * list.length))];

  function M(geo, material, x, y, z) {
    const m = new T.Mesh(geo, material);
    m.position.set(x || 0, y || 0, z || 0);
    m.castShadow = true;
    m.receiveShadow = true;
    return m;
  }

  const WALLS = [0xfff4e2, 0xffe6ef, 0xe9f4ff, 0xfff7d6, 0xe8ffe9];
  const ROOFS = [0xf07b6e, 0x8f7bea, 0x4fb3c9, 0xe86aa3, 0xf0a04b];
  const FOLIAGE = [0x7ccd8b, 0x5cbf7a, 0x9ada9b, 0x6fc99a];
  const PETAL = [0xff8fb1, 0xffd166, 0xb18cf0, 0xff9f6e, 0x8fd6ff];

  /* ---------- 1. Ev ---------- */
  function ev(rnd) {
    const g = new T.Group();
    const wall = mat(pick(rnd, WALLS));
    const roof = mat(pick(rnd, ROOFS));
    g.add(M(new T.BoxGeometry(0.88, 0.74, 0.82), wall, 0, 0.37, 0));
    const top = M(new T.ConeGeometry(0.62, 0.36, 4), roof, 0, 0.92, 0);
    top.rotation.y = Math.PI / 4;
    g.add(top);
    g.add(M(new T.BoxGeometry(0.19, 0.34, 0.04), mat(0x9c7157), 0, 0.17, 0.42));
    const winMat = mat(0xfff7c9, { emissive: 0xffdd88, emissiveIntensity: 0.4 });
    g.add(M(new T.BoxGeometry(0.16, 0.17, 0.04), winMat, -0.27, 0.47, 0.42));
    g.add(M(new T.BoxGeometry(0.16, 0.17, 0.04), winMat, 0.27, 0.47, 0.42));
    g.add(M(new T.CylinderGeometry(0.055, 0.055, 0.2, 8), mat(0xe2a08a), 0.22, 0.9, 0.15));
    return g;
  }

  /* ---------- 2. Ağaç ---------- */
  function agac(rnd) {
    const g = new T.Group();
    const h = 0.42 + rnd() * 0.2;
    g.add(M(new T.CylinderGeometry(0.09, 0.13, h, 8), mat(0xa9784f), 0, h / 2, 0));
    const c = mat(pick(rnd, FOLIAGE));
    const r1 = 0.34 + rnd() * 0.1;
    g.add(M(new T.SphereGeometry(r1, 10, 8), c, 0, h + r1 * 0.72, 0));
    g.add(M(new T.SphereGeometry(r1 * 0.72, 9, 7), c, 0.22, h + r1 * 0.46, 0.1));
    g.add(M(new T.SphereGeometry(r1 * 0.66, 9, 7), c, -0.2, h + r1 * 0.5, -0.08));
    g.userData.anim = { kind: 'sway', amp: 0.018 };
    return g;
  }

  /* ---------- 3. Çiçek ---------- */
  function cicek(rnd) {
    const g = new T.Group();
    const h = 0.36 + rnd() * 0.18;
    g.add(M(new T.CylinderGeometry(0.025, 0.025, h, 6), mat(0x6cbf7a), 0, h / 2, 0));
    const p = mat(pick(rnd, PETAL));
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * TAU;
      g.add(M(new T.SphereGeometry(0.075, 7, 6), p, Math.cos(a) * 0.1, h, Math.sin(a) * 0.1));
    }
    g.add(M(new T.SphereGeometry(0.07, 8, 6), mat(0xffd166), 0, h + 0.02, 0));
    const leaf = M(new T.SphereGeometry(0.09, 7, 5), mat(0x7fd67f), 0.1, h * 0.45, 0.02);
    leaf.scale.set(1.4, 0.45, 0.9);
    g.add(leaf);
    g.userData.anim = { kind: 'sway', amp: 0.1 };
    return g;
  }

  /* ---------- 4. Mantar ---------- */
  function mantar(rnd) {
    const g = new T.Group();
    const h = 0.22 + rnd() * 0.14;
    g.add(M(new T.CylinderGeometry(0.07, 0.09, h, 8), mat(0xfff3e0), 0, h / 2, 0));
    const cap = M(
      new T.SphereGeometry(0.26, 12, 8, 0, TAU, 0, Math.PI / 2),
      mat(pick(rnd, [0xff8d8d, 0xf0a6e0, 0xffb36b])),
      0, h, 0
    );
    cap.scale.y = 0.8;
    g.add(cap);
    const dot = mat(0xffffff);
    for (let i = 0; i < 3; i++) {
      const a = rnd() * TAU;
      const rr = 0.08 + rnd() * 0.11;
      g.add(M(new T.SphereGeometry(0.035, 6, 5), dot, Math.cos(a) * rr, h + 0.15, Math.sin(a) * rr));
    }
    return g;
  }

  /* ---------- 5. Kuş ---------- */
  function kus(rnd) {
    const g = new T.Group();
    const lift = 0.55 + rnd() * 0.55;
    const body = M(new T.SphereGeometry(0.16, 10, 8), mat(pick(rnd, [0x8fd3ff, 0xffd166, 0xff9fb8])), 0, lift, 0);
    body.scale.set(1.3, 1, 1);
    g.add(body);
    g.add(M(new T.SphereGeometry(0.1, 8, 6), mat(0xffffff), 0.17, lift + 0.1, 0));
    const beak = M(new T.ConeGeometry(0.05, 0.13, 6), mat(0xffb347), 0.29, lift + 0.07, 0);
    beak.rotation.z = -Math.PI / 2;
    g.add(beak);
    const wm = mat(0xffffff);
    const w1 = M(new T.BoxGeometry(0.04, 0.15, 0.24), wm, -0.02, lift + 0.02, 0.17);
    w1.rotation.x = 0.3;
    g.add(w1);
    const w2 = M(new T.BoxGeometry(0.04, 0.15, 0.24), wm, -0.02, lift + 0.02, -0.17);
    w2.rotation.x = -0.3;
    g.add(w2);
    const tail = M(new T.BoxGeometry(0.2, 0.03, 0.1), mat(0xf2f2f2), -0.19, lift + 0.02, 0);
    tail.rotation.z = 0.15;
    g.add(tail);
    g.userData.anim = { kind: 'bob', amp: 0.07 };
    return g;
  }

  /* ---------- 6. Tavşan ---------- */
  function tavsan(rnd) {
    const g = new T.Group();
    const fur = mat(0xfff8f2);
    const body = M(new T.SphereGeometry(0.2, 10, 8), fur, 0, 0.2, 0);
    body.scale.set(1, 0.95, 1.2);
    g.add(body);
    g.add(M(new T.SphereGeometry(0.14, 10, 8), fur, 0, 0.4, 0.12));
    const e1 = M(new T.BoxGeometry(0.06, 0.25, 0.04), fur, -0.06, 0.55, 0.12);
    e1.rotation.z = 0.14;
    g.add(e1);
    const e2 = M(new T.BoxGeometry(0.06, 0.25, 0.04), fur, 0.06, 0.55, 0.12);
    e2.rotation.z = -0.14;
    g.add(e2);
    g.add(M(new T.SphereGeometry(0.065, 7, 6), mat(0xffffff), 0, 0.22, -0.25));
    const eye = mat(0x3a3a4a);
    g.add(M(new T.SphereGeometry(0.022, 6, 5), eye, -0.05, 0.44, 0.25));
    g.add(M(new T.SphereGeometry(0.022, 6, 5), eye, 0.05, 0.44, 0.25));
    g.add(M(new T.SphereGeometry(0.02, 6, 5), mat(0xff9fb8), 0, 0.4, 0.27));
    return g;
  }

  /* ---------- 7. Koyun ---------- */
  function koyun(rnd) {
    const g = new T.Group();
    const wool = mat(0xffffff);
    const body = M(new T.SphereGeometry(0.26, 10, 8), wool, 0, 0.26, 0);
    body.scale.set(1.1, 0.95, 1);
    g.add(body);
    g.add(M(new T.SphereGeometry(0.15, 9, 7), wool, 0.08, 0.43, 0.02));
    g.add(M(new T.SphereGeometry(0.14, 9, 7), wool, -0.13, 0.41, -0.05));
    const head = M(new T.SphereGeometry(0.13, 9, 7), mat(0x5a5f73), 0, 0.32, 0.25);
    head.scale.set(0.9, 1, 1.15);
    g.add(head);
    const leg = mat(0x5a5f73);
    [-0.12, 0.12].forEach(function (x) {
      g.add(M(new T.CylinderGeometry(0.03, 0.03, 0.16, 6), leg, x, 0.08, 0.1));
      g.add(M(new T.CylinderGeometry(0.03, 0.03, 0.16, 6), leg, x, 0.08, -0.1));
    });
    return g;
  }

  /* ---------- 8. Bulut (gezegen üstünde süzülür, yavaşça kayar) ---------- */
  function bulut(rnd) {
    const g = new T.Group();
    const y = 0.8 + rnd() * 0.35;
    const m = mat(0xffffff, { roughness: 1, transparent: true, opacity: 0.97 });
    const parts = [
      [0, 0, 0, 0.3], [0.26, 0.03, 0.05, 0.24], [-0.27, 0.02, -0.03, 0.22],
      [0.05, 0.17, 0.08, 0.2], [-0.08, 0.14, -0.12, 0.18]
    ];
    parts.forEach(function (p) {
      const s = M(new T.SphereGeometry(p[3], 9, 7), m, p[0], y + p[1], p[2]);
      s.scale.y = 0.86;
      s.castShadow = false;
      g.add(s);
    });
    g.userData.anim = { kind: 'cloud', speed: 0.035 + rnd() * 0.03 };
    return g;
  }

  /* ---------- 9. Göl (gezegen eğrisine oturan sığ kapak) ---------- */
  function gol(rnd, R) {
    const g = new T.Group();
    const Rr = R || 10;
    const th = 1.25 / Rr;
    const sand = M(new T.SphereGeometry(Rr, 28, 8, 0, TAU, 0, th * 1.18), mat(0xf2e2b8), 0, -Rr, 0);
    sand.castShadow = false;
    g.add(sand);
    const water = M(
      new T.SphereGeometry(Rr * 1.002, 28, 8, 0, TAU, 0, th),
      mat(0x7fd6f0, { roughness: 0.2, metalness: 0.15, transparent: true, opacity: 0.92 }),
      0, -Rr, 0
    );
    water.castShadow = false;
    g.add(water);
    return g;
  }

  /* ---------- 10. Yel değirmeni ---------- */
  function yeldegirmeni(rnd) {
    const g = new T.Group();
    const wall = mat(pick(rnd, [0xfff6e6, 0xffe9ef, 0xeef6ff]));
    g.add(M(new T.CylinderGeometry(0.2, 0.3, 0.9, 12), wall, 0, 0.45, 0));
    g.add(M(new T.ConeGeometry(0.27, 0.3, 12), mat(0xe07b6a), 0, 1.03, 0));
    g.add(M(new T.BoxGeometry(0.12, 0.24, 0.04), mat(0x9c7157), 0, 0.16, 0.28));

    const blades = new T.Group();
    blades.position.set(0, 0.84, 0.3);
    const bm = mat(0xfffaf0);
    for (let i = 0; i < 4; i++) {
      const holder = new T.Group();
      holder.rotation.z = (i * Math.PI) / 2;
      holder.add(M(new T.BoxGeometry(0.07, 0.6, 0.02), bm, 0, 0.33, 0));
      blades.add(holder);
    }
    const hub = M(new T.SphereGeometry(0.06, 8, 6), mat(0xe07b6a), 0, 0, 0);
    hub.castShadow = false;
    blades.add(hub);
    g.add(blades);
    g.userData.anim = { kind: 'windmill', blades: blades };
    return g;
  }

  /* ---------- 11. Kale ---------- */
  function kale(rnd) {
    const g = new T.Group();
    const stone = mat(pick(rnd, [0xe8e6f5, 0xf0e6d8, 0xdfeaf5]));
    const roofMat = mat(pick(rnd, [0xe16b8b, 0x7b7bea, 0x4fb3c9]));
    g.add(M(new T.BoxGeometry(0.9, 0.34, 0.9), stone, 0, 0.17, 0));
    g.add(M(new T.BoxGeometry(0.42, 0.5, 0.42), stone, 0, 0.55, 0));
    [[-0.36, -0.36], [0.36, -0.36], [-0.36, 0.36], [0.36, 0.36]].forEach(function (p) {
      g.add(M(new T.CylinderGeometry(0.13, 0.14, 0.62, 10), stone, p[0], 0.31, p[1]));
      g.add(M(new T.ConeGeometry(0.18, 0.26, 10), roofMat, p[0], 0.75, p[1]));
    });
    g.add(M(new T.BoxGeometry(0.2, 0.24, 0.04), mat(0x7a5230), 0, 0.14, 0.46));
    g.add(M(new T.CylinderGeometry(0.012, 0.012, 0.3, 6), mat(0xdddddd), 0, 0.93, 0));
    const flag = M(new T.BoxGeometry(0.16, 0.1, 0.01), mat(0xffd166), 0.09, 1.03, 0);
    g.add(flag);
    return g;
  }

  /* ---------- 12. Köprü ---------- */
  function kopru(rnd) {
    const g = new T.Group();
    g.add(M(new T.BoxGeometry(1.5, 0.07, 0.44), mat(0xd8a36b), 0, 0.5, 0));
    const rail = mat(0xb9874f);
    [-0.2, 0.2].forEach(function (z) {
      g.add(M(new T.BoxGeometry(1.5, 0.04, 0.05), rail, 0, 0.72, z));
      [-0.6, 0.6].forEach(function (x) {
        g.add(M(new T.BoxGeometry(0.04, 0.24, 0.04), rail, x, 0.61, z));
      });
    });
    [-0.45, 0.45].forEach(function (x) {
      g.add(M(new T.CylinderGeometry(0.05, 0.05, 0.5, 8), mat(0xc0c7d6), x, 0.25, 0));
    });
    return g;
  }

  /* ---------- 13. Lamba ---------- */
  function lamba(rnd) {
    const g = new T.Group();
    g.add(M(new T.CylinderGeometry(0.07, 0.1, 0.06, 8), mat(0x8fa3bb), 0, 0.03, 0));
    g.add(M(new T.CylinderGeometry(0.03, 0.03, 0.9, 8), mat(0x9fb3c9), 0, 0.48, 0));
    const bulbMat = new T.MeshStandardMaterial({
      color: 0xfff3c0, emissive: 0xffd36e, emissiveIntensity: 0.5, roughness: 0.4
    });
    const bulb = M(new T.SphereGeometry(0.11, 10, 8), bulbMat, 0, 0.98, 0);
    bulb.castShadow = false;
    g.add(bulb);
    g.add(M(new T.ConeGeometry(0.16, 0.1, 10), mat(0x8fa3bb), 0, 1.08, 0));
    g.userData.anim = { kind: 'lamp', bulb: bulb };
    return g;
  }

  /* ---------- 14. Hediye kutusu ---------- */
  function hediye(rnd) {
    const g = new T.Group();
    const c = mat(pick(rnd, [0xff8fb1, 0x8fd6ff, 0xb18cf0, 0xffd166]));
    g.add(M(new T.BoxGeometry(0.5, 0.5, 0.5), c, 0, 0.26, 0));
    const rib = mat(0xffffff);
    g.add(M(new T.BoxGeometry(0.52, 0.52, 0.09), rib, 0, 0.26, 0));
    g.add(M(new T.BoxGeometry(0.09, 0.52, 0.52), rib, 0, 0.26, 0));
    g.add(M(new T.TorusGeometry(0.1, 0.035, 6, 12), mat(0xffd166), -0.07, 0.56, 0));
    g.add(M(new T.TorusGeometry(0.1, 0.035, 6, 12), mat(0xffd166), 0.07, 0.56, 0));
    return g;
  }

  /* ---------- 15. Gökkuşağı ---------- */
  function gokkusagi(rnd) {
    const g = new T.Group();
    const cols = [0xff8fa3, 0xffc46b, 0xffe066, 0x8ee08f, 0x8fc9ff, 0xb79cf5];
    cols.forEach(function (c, i) {
      const arc = M(
        new T.TorusGeometry(0.92 - i * 0.11, 0.055, 6, 24, Math.PI),
        mat(c, { emissive: c, emissiveIntensity: 0.14 }),
        0, 0.03, 0
      );
      arc.castShadow = false;
      g.add(arc);
    });
    return g;
  }

  /* ---------- 16. Yol (gezegen eğrisine oturan şerit) ---------- */
  function yol(rnd, R) {
    const g = new T.Group();
    const Rr = R || 10;
    const strip = M(
      new T.SphereGeometry(Rr * 1.002, 26, 8, 0, TAU, 0, 1.15 / Rr),
      mat(0xe8d7b0),
      0, -Rr, 0
    );
    strip.scale.z = 0.42;
    strip.castShadow = false;
    g.add(strip);
    return g;
  }

  /* ---------- 17. Tepe ---------- */
  function tepe(rnd, R) {
    const g = new T.Group();
    const hill = M(new T.SphereGeometry(1.05, 16, 10), mat(pick(rnd, [0x8fd6a0, 0x9ee0a8, 0x7ccf96])), 0, 0, 0);
    hill.scale.set(1, 0.42, 1);
    hill.castShadow = false;
    g.add(hill);
    g.add(M(new T.SphereGeometry(0.18, 8, 6), mat(0x6fbf80), 0.5, 0.42, 0.2));
    g.add(M(new T.SphereGeometry(0.14, 8, 6), mat(0x6fbf80), -0.42, 0.4, -0.25));
    return g;
  }

  NP.TYPES = [
    { t: 'ev', label: 'Ev', icon: '🏠', build: ev },
    { t: 'agac', label: 'Ağaç', icon: '🌳', build: agac },
    { t: 'cicek', label: 'Çiçek', icon: '🌸', build: cicek },
    { t: 'mantar', label: 'Mantar', icon: '🍄', build: mantar },
    { t: 'kus', label: 'Kuş', icon: '🐦', build: kus },
    { t: 'tavsan', label: 'Tavşan', icon: '🐰', build: tavsan },
    { t: 'koyun', label: 'Koyun', icon: '🐑', build: koyun },
    { t: 'bulut', label: 'Bulut', icon: '☁️', build: bulut },
    { t: 'gol', label: 'Göl', icon: '💧', build: gol },
    { t: 'yeldegirmeni', label: 'Yel Değirmeni', icon: '🌀', build: yeldegirmeni },
    { t: 'kale', label: 'Kale', icon: '🏰', build: kale },
    { t: 'kopru', label: 'Köprü', icon: '🌉', build: kopru },
    { t: 'lamba', label: 'Lamba', icon: '💡', build: lamba },
    { t: 'hediye', label: 'Hediye', icon: '🎁', build: hediye },
    { t: 'gokkusagi', label: 'Gökkuşağı', icon: '🌈', build: gokkusagi },
    { t: 'yol', label: 'Yol', icon: '🛤️', build: yol },
    { t: 'tepe', label: 'Tepe', icon: '⛰️', build: tepe }
  ];

  NP.BY_TYPE = {};
  NP.TYPES.forEach(function (d) { NP.BY_TYPE[d.t] = d; });

  NP.labelOf = function (type) {
    return NP.BY_TYPE[type] ? NP.BY_TYPE[type].label : type;
  };

  NP.create = function (type, seed, planetR) {
    const def = NP.BY_TYPE[type] || NP.BY_TYPE.ev;
    const rnd = NP.rng(seed || 1);
    const g = def.build(rnd, planetR || 10);
    g.userData.type = def.t;
    return g;
  };
})(window.NP);
