'use strict';
/* Numex Living Neighborhood — sahne kurucu ve çizici */

/* Dikey dörtgen: normal +Z'den ry kadar döner. */
const FACE_RY = [0, -Math.PI / 2, Math.PI, Math.PI / 2];

function vquad(mb, x, y, z, w, h, ry, color) {
  const m = M4.mulAll(M4.trans(x, y, z), M4.rotY(ry || 0), M4.rotX(-Math.PI / 2));
  MB.add(mb, Geo.plane(w, h), m, color);
}

const WALL_DARK = hex('#2a2f36');
const GLOW_WARM = hex('#ffcf7a');
const GLOW_COOL = hex('#cfe6ff');

const Scene = {
  mesh: null,
  glow: null,
  personGeo: null,
  carGeo: null,

  /* ---------------------------------------------------------------- */
  /*  statik dünya                                                     */
  /* ---------------------------------------------------------------- */
  build() {
    const mb = MB.create();
    const glow = MB.create();

    buildGround(mb);
    buildRoads(mb);
    for (const b of Town.buildings) buildBuilding(mb, glow, b);
    for (const t of Town.trees) buildTree(mb, t);
    for (const l of Town.lamps) buildLamp(mb, glow, l);
    for (const bn of Town.benches) buildBench(mb, bn);
    for (const c of Town.parked) buildCarMesh(mb, c.x, c.z, c.rot, c.color);
    buildParkExtras(mb, glow);
    buildSchoolExtras(mb);
    buildMosqueExtras(mb, glow);

    this.mesh = GL.upload(mb);
    this.glow = GL.upload(glow);
    this.personGeo = [];
    this.carGeo = [];
    return this;
  },

  /* dinamik nesne meshleri (her kişi/araç için bir kez) */
  prepareActors() {
    this.personGeo = Life.walkers.map(w => buildPersonMesh(w, w.child ? 0.68 : 1, w.hat));
    this.kidGeo = Life.kids.map(k => buildPersonMesh(k, 0.62, false));
    this.carGeo = Life.cars.map(c => {
      const tmp = MB.create();
      buildCarMesh(tmp, 0, 0, 0, c.color);
      return GL.upload(tmp);
    });
  },
};

/* ------------------------------------------------------------------ */
/*  zemin                                                             */
/* ------------------------------------------------------------------ */
function buildGround(mb) {
  const tile = 23;
  const nx = Math.ceil(T.ground.w / tile);
  const nz = Math.ceil(T.ground.d / tile);
  const g = Geo.plane(tile, tile);
  for (let i = 0; i < nx; i++) {
    for (let j = 0; j < nz; j++) {
      const x = -T.ground.w / 2 + tile * (i + 0.5);
      const z = -T.ground.d / 2 + tile * (j + 0.5);
      const n = Math.sin(i * 0.9) * Math.cos(j * 1.3) * 0.5 + 0.5;
      const c = mixc(PAL.grassDark, PAL.grass, 0.35 + n * 0.55);
      MB.add(mb, g, M4.trans(x, 0, z), c);
    }
  }
}

/* ------------------------------------------------------------------ */
/*  yollar                                                            */
/* ------------------------------------------------------------------ */
function buildRoads(mb) {
  const half = T.roadW / 2;
  const walk = T.walkW;
  const L = 920, V = 920;

  for (const z of T.hRoads) {
    MB.box(mb, PAL.asphalt, 0, 0, z, L, 0.08, T.roadW);
    MB.box(mb, PAL.walk, 0, 0, z - half - walk / 2, L, 0.18, walk);
    MB.box(mb, PAL.walk, 0, 0, z + half + walk / 2, L, 0.18, walk);
    MB.box(mb, PAL.curb, 0, 0, z - half - walk, L, 0.22, 0.25);
    MB.box(mb, PAL.curb, 0, 0, z + half + walk, L, 0.22, 0.25);
    // orta çizgi
    for (let x = -440; x <= 440; x += 9) {
      MB.box(mb, PAL.line, x, 0.08, z, 3.4, 0.02, 0.22);
    }
  }

  for (const x of T.vRoads) {
    MB.box(mb, PAL.asphalt, x, 0, 0, T.roadW, 0.1, V);
    MB.box(mb, PAL.walk, x - half - walk / 2, 0, 0, walk, 0.19, V);
    MB.box(mb, PAL.walk, x + half + walk / 2, 0, 0, walk, 0.19, V);
    MB.box(mb, PAL.curb, x - half - walk, 0, 0, 0.25, 0.23, V);
    MB.box(mb, PAL.curb, x + half + walk, 0, 0, 0.25, 0.23, V);
    for (let z = -440; z <= 440; z += 9) {
      MB.box(mb, PAL.line, x, 0.1, z, 0.22, 0.02, 3.4);
    }
  }
}

/* ------------------------------------------------------------------ */
/*  bina                                                              */
/* ------------------------------------------------------------------ */
function buildBuilding(mb, glow, b) {
  const x = b.x, z = b.z, w = b.w, d = b.d, h = b.h;

  // temel/gövde
  MB.box(mb, b.wall, x, 0, z, w, h, d);
  // taban silmesi
  MB.box(mb, shade(b.wall, 0.82), x, 0, z, w + 0.28, 0.6, d + 0.28);

  if (b.type === 'ev') {
    const rh = Math.min(2.6, Math.max(1.6, w * 0.26));
    MB.add(mb, Geo.prism(w + 0.9, rh, d + 0.9), M4.trans(x, h, z), b.roof);
    // baca
    MB.box(mb, shade(b.roof, 0.7), x + w * 0.25, h + rh * 0.5, z + d * 0.2, 0.7, 1.5, 0.7);
  } else if (b.type === 'cami') {
    // kubbe
    MB.add(mb, Geo.sphere(w * 0.44, 14, 9), M4.trans(x, h, z), b.roof);
    MB.box(mb, shade(b.wall, 0.95), x, h - 0.4, z, w + 0.6, 0.5, d + 0.6);
  } else {
    // düz çatı + korkuluk
    MB.box(mb, shade(b.roof, 0.9), x, h, z, w + 0.3, 0.35, d + 0.3);
    const par = shade(b.roof, 0.78);
    MB.box(mb, par, x, h + 0.35, z - d / 2, w + 0.3, 0.5, 0.28);
    MB.box(mb, par, x, h + 0.35, z + d / 2, w + 0.3, 0.5, 0.28);
    MB.box(mb, par, x - w / 2, h + 0.35, z, 0.28, 0.5, d);
    MB.box(mb, par, x + w / 2, h + 0.35, z, 0.28, 0.5, d);
    // çatı donatısı
    if (b.type === 'apartman') {
      MB.box(mb, shade(b.wall, 0.9), x + w * 0.22, h + 0.35, z - d * 0.1, 2.2, 1.7, 2.0);
      MB.add(mb, Geo.cyl(0.85, 1.5, 10), M4.trans(x - w * 0.26, h + 0.35, z + d * 0.15), hex('#9aa3ab'));
    } else if (b.type === 'bakkal' || b.type === 'firin') {
      // tabela
      MB.box(mb, hex('#c9563f'), x, h + 1.2, z + (b.face === 2 ? d / 2 + 0.22 : -d / 2 - 0.22), w * 0.7, 1.1, 0.16);
    }
  }

  addWindows(mb, glow, b);
  addDoor(mb, b);
}

function addWindows(mb, glow, b) {
  const floorH = b.h / b.floors;
  const isHouse = b.type === 'ev';
  const nFront = Math.max(2, Math.floor((isHouse ? b.w : b.w) / 3.1));
  const nSide = Math.max(2, Math.floor(b.d / 3.3));
  const winW = isHouse ? 1.0 : 1.25;
  const winH = isHouse ? 1.15 : 1.35;
  const ryF = FACE_RY[b.face];

  const lit = (bx, by, bz) => {
    const n = Math.sin(bx * 12.9898 + bz * 78.233 + b.litSeed * 43.7) * 43758.5453;
    return (n - Math.floor(n)) > 0.34;
  };

  for (let f = 0; f < b.floors; f++) {
    const y = f * floorH + floorH * 0.58;
    if (y > b.h - 0.9) continue;

    for (let i = 0; i < nFront; i++) {
      const t = (i + 0.5) / nFront - 0.5;
      const off = t * (b.w - 1.2);
      let wx, wz, ry = ryF;
      if (b.face === 0) { wx = b.x + off; wz = b.bz0 - 0.05; }
      else if (b.face === 1) { wx = b.bx1 + 0.05; wz = b.z - off; }
      else if (b.face === 2) { wx = b.x - off; wz = b.bz1 + 0.05; }
      else { wx = b.bx0 - 0.05; wz = b.z + off; }

      vquad(mb, wx, y, wz, winW, winH, ry, hex('#33414d'));
      if (lit(wx, y, wz)) {
        // ışık dörtgeni camın önüne alınır — aynı düzlemde kalırsa z-fighting olur
        const gx = wx + (b.face === 1 ? 0.09 : b.face === 3 ? -0.09 : 0);
        const gz = wz + (b.face === 2 ? 0.09 : b.face === 0 ? -0.09 : 0);
        vquad(glow, gx, y, gz, winW * 0.94, winH * 0.9, ry, GLOW_WARM);
      }
      // pencere çerçevesi
      vquad(mb, wx, y + winH / 2 + 0.06, wz, winW + 0.18, 0.12, ry, hex('#e9e4d8'));
    }

    // yan yüz
    for (let i = 0; i < nSide; i++) {
      const t = (i + 0.5) / nSide - 0.5;
      const off = t * (b.d - 1.2);
      const wx = b.face === 1 || b.face === 3 ? b.x + (b.face === 3 ? -1 : 1) * 0 : b.bx0 - 0.05;
      const side = b.face === 1 ? b.bx0 - 0.05 : b.bx1 + 0.05;
      const ry = b.face === 1 ? Math.PI / 2 : -Math.PI / 2;
      const wz = b.z + off;
      const px = b.face === 1 ? side : side;
      vquad(mb, px, y, wz, winW * 0.9, winH, ry, hex('#33414d'));
      if (lit(px, y, wz)) {
        const gpx = px + (b.face === 1 ? -0.09 : 0.09);
        vquad(glow, gpx, y, wz, winW * 0.84, winH * 0.88, ry, GLOW_WARM);
      }
      void wx;
    }
  }
}

function addDoor(mb, b) {
  const dw = 1.25, dh = 2.15;
  const ry = FACE_RY[b.face];
  const dt = b.door;
  const px = dt.x + dt.nx * 0.06;
  const pz = dt.z + dt.nz * 0.06;
  // kapı boşluğu (koyu)
  vquad(mb, px, dh / 2, pz, dw, dh, ry, WALL_DARK);
  // basamak
  MB.box(mb, hex('#b0a99c'), dt.ox, 0, dt.oz, dw + 0.9, 0.18, 1.0, ry);
  // saçak
  MB.box(mb, shade(b.wall, 0.85), px + dt.nx * 0.35, dh + 0.42, pz + dt.nz * 0.35, dw + 0.7, 0.14, 0.9, ry);
}

/* ------------------------------------------------------------------ */
/*  daire (ışık gölü, çeşme suyu)                                     */
/* ------------------------------------------------------------------ */
function discGeo(r, seg) {
  const pos = [], nrm = [], idx = [];
  pos.push(0, 0, 0); nrm.push(0, 1, 0);
  for (let i = 0; i <= seg; i++) {
    const a = (i / seg) * Math.PI * 2;
    pos.push(Math.cos(a) * r, 0, Math.sin(a) * r);
    nrm.push(0, 1, 0);
  }
  for (let i = 1; i <= seg; i++) idx.push(0, i + 1, i);
  return { pos, nrm, idx };
}

/* ------------------------------------------------------------------ */
/*  ağaç, lamba, bank                                                 */
/* ------------------------------------------------------------------ */
function buildTree(mb, t) {
  const s = t.s || 1;
  MB.add(mb, Geo.cyl(0.16 * s, 1.9 * s, 6), M4.trans(t.x, 0, t.z), PAL.trunk);
  if (t.kind === 1) {
    MB.add(mb, Geo.cone(1.25 * s, 3.1 * s, 8), M4.trans(t.x, 1.5 * s, t.z), hex('#3d6b35'));
  } else {
    const leaf = hex(pick(PAL.leaf));
    MB.add(mb, Geo.sphere(1.15 * s, 9, 7), M4.trans(t.x, 2.65 * s, t.z), leaf);
    MB.add(mb, Geo.sphere(0.78 * s, 8, 6), M4.trans(t.x + 0.55 * s, 3.25 * s, t.z - 0.35 * s), shade(leaf, 1.12));
    MB.add(mb, Geo.sphere(0.66 * s, 8, 6), M4.trans(t.x - 0.6 * s, 3.05 * s, t.z + 0.4 * s), shade(leaf, 0.9));
    // gölge halkası
    MB.add(mb, discGeo(1.5 * s, 10), M4.trans(t.x, 0.03, t.z), hex('#5f7f49'));
  }
}

function buildLamp(mb, glow, l) {
  MB.add(mb, Geo.cyl(0.075, 4.3, 6), M4.trans(l.x, 0, l.z), PAL.lamp);
  MB.box(mb, PAL.lamp, l.x, 4.3, l.z, 0.42, 0.16, 0.42);
  MB.add(mb, Geo.sphere(0.26, 8, 6), M4.trans(l.x, 4.36, l.z), PAL.lampGlow);
  // gece ışık gölü
  MB.add(glow, discGeo(3.8, 14), M4.trans(l.x, 0.13, l.z), hex('#ffcf78'));
  MB.add(glow, Geo.sphere(0.3, 6, 5), M4.trans(l.x, 4.36, l.z), GLOW_WARM);
}

function buildBench(mb, b) {
  const m = M4.trs(b.x, 0, b.z, b.rot || 0);
  const put = (w, h, d, x, y, z, c) =>
    MB.add(mb, Geo.box(w, h, d), M4.mul(m, M4.trans(x, y, z)), c);
  put(1.9, 0.09, 0.52, 0, 0.46, 0, hex('#8a6a46'));
  put(1.9, 0.09, 0.46, 0, 0.92, -0.26, hex('#8a6a46'));
  put(0.11, 0.46, 0.46, -0.78, 0.23, 0, hex('#4a4a4a'));
  put(0.11, 0.46, 0.46, 0.78, 0.23, 0, hex('#4a4a4a'));
}

/* ------------------------------------------------------------------ */
/*  park                                                              */
/* ------------------------------------------------------------------ */
function buildParkExtras(mb, glow) {
  const P = Special.park;
  if (!P) return;

  // çim parçası (hafif farklı ton)
  MB.box(mb, hex('#6f9451'), P.cx, 0.02, P.cz, P.x1 - P.x0 - 1, 0.06, P.z1 - P.z0 - 1);

  // yürüyüş yolları
  const pathC = hex('#c9bfa6');
  MB.box(mb, pathC, P.cx, 0.1, P.cz, 4.2, 0.06, P.z1 - P.z0 - 2);
  MB.box(mb, pathC, P.cx, 0.1, P.cz + 2, P.x1 - P.x0 - 2, 0.06, 4.2);

  // çeşme
  const F = Special.fountain;
  if (F) {
    MB.add(mb, Geo.cyl(2.2, 0.85, 14), M4.trans(F.x, 0, F.z), hex('#bdb5a4'));
    MB.add(mb, Geo.cyl(1.85, 0.7, 14), M4.trans(F.x, 0.2, F.z), hex('#7fb3c9'));
    MB.add(mb, Geo.cyl(0.36, 1.5, 8), M4.trans(F.x, 0.8, F.z), hex('#cfc7b6'));
    MB.add(glow, Geo.sphere(0.42, 8, 6), M4.trans(F.x, 2.2, F.z), hex('#9fd8ea'));
  }

  // oyun grubu
  const S = Special.play;
  if (S) {
    // salıncak
    const sw = hex('#c9563f');
    MB.add(mb, Geo.cyl(0.09, 2.4, 6), M4.trans(S.x - 2.2, 0, S.z - 1.2), sw);
    MB.add(mb, Geo.cyl(0.09, 2.4, 6), M4.trans(S.x - 2.2, 0, S.z + 1.2), sw);
    MB.add(mb, Geo.cyl(0.09, 2.4, 6), M4.trans(S.x + 0.4, 0, S.z - 1.2), sw);
    MB.add(mb, Geo.cyl(0.09, 2.4, 6), M4.trans(S.x + 0.4, 0, S.z + 1.2), sw);
    MB.box(mb, hex('#e0e6ea'), S.x - 0.9, 2.35, S.z, 2.9, 0.16, 2.6);
    MB.box(mb, hex('#4a6fa8'), S.x - 1.4, 1.55, S.z, 0.09, 0.9, 0.09);
    MB.box(mb, hex('#4a6fa8'), S.x - 0.4, 1.55, S.z, 0.09, 0.9, 0.09);
    MB.box(mb, hex('#d8b24a'), S.x - 0.9, 1.5, S.z, 1.1, 0.1, 0.44);

    // kaydırak
    const sx = S.x + 5.5;
    MB.box(mb, hex('#4a7fb8'), sx, 0, S.z + 2, 1.5, 2.0, 1.5);
    MB.add(mb, Geo.box(1.3, 0.16, 4.2), M4.mulAll(M4.trans(sx - 1.6, 1.15, S.z + 2), M4.rotZ(0.42)), hex('#e0b03f'));

    // kum havuzu
    MB.box(mb, hex('#8a6a46'), S.x - 6.5, 0, S.z + 3.5, 4.6, 0.3, 4.6);
    MB.box(mb, hex('#d9c7a0'), S.x - 6.5, 0.28, S.z + 3.5, 4.2, 0.06, 4.2);
  }
}

function buildSchoolExtras(mb) {
  const S = Special.school;
  if (!S) return;
  const b = S.building;
  // avlu
  MB.box(mb, hex('#8f9188'), b.x, 0.06, b.bz1 + 7, b.w - 2, 0.06, 13);
  // bayrak direği
  const F = Special.flag;
  if (F) {
    MB.add(mb, Geo.cyl(0.08, 7.5, 6), M4.trans(F.x, 0, F.z), hex('#c8ccd0'));
    MB.box(mb, hex('#c0392b'), F.x + 0.7, 6.6, F.z, 1.4, 0.9, 0.06);
  }
  // giriş saçağı
  MB.box(mb, hex('#c9d2d8'), b.x, 3.4, b.bz1 + 1.1, 6, 0.22, 2.4);
  MB.add(mb, Geo.cyl(0.12, 3.4, 6), M4.trans(b.x - 2.6, 0, b.bz1 + 2.1), hex('#c9d2d8'));
  MB.add(mb, Geo.cyl(0.12, 3.4, 6), M4.trans(b.x + 2.6, 0, b.bz1 + 2.1), hex('#c9d2d8'));
}

function buildMosqueExtras(mb, glow) {
  const m = Special.minaret;
  if (!m) return;
  MB.add(mb, Geo.cyl(1.0, m.h, 12), M4.trans(m.x, 0, m.z), hex('#efe8d8'));
  MB.add(mb, Geo.cyl(1.35, 0.9, 12), M4.trans(m.x, m.h * 0.66, m.z), hex('#e2d9c6'));
  MB.add(mb, Geo.cone(1.15, 4.2, 12), M4.trans(m.x, m.h, m.z), hex('#6f8f8a'));
  MB.add(glow, Geo.sphere(0.24, 6, 5), M4.trans(m.x, m.h * 0.66 + 1.15, m.z), hex('#a8e0c0'));
}

/* ------------------------------------------------------------------ */
/*  insan ve araç                                                     */
/* ------------------------------------------------------------------ */
function buildPersonMesh(o, s, hat) {
  const mb = MB.create();
  const put = (w, h, d, x, y, z, c) =>
    MB.box(mb, c, x * s, y * s, z * s, w * s, h * s, d * s);

  const pants = o.pants || hex('#3c4450');
  put(0.32, 0.76, 0.24, 0, 0, 0, pants);            // bacaklar
  put(0.40, 0.54, 0.26, 0, 0.76, 0, o.shirt);       // gövde
  put(0.11, 0.46, 0.13, -0.25, 0.80, 0, o.shirt);   // sol kol
  put(0.11, 0.46, 0.13, 0.25, 0.80, 0, o.shirt);    // sağ kol
  MB.add(mb, Geo.sphere(0.145 * s, 8, 6), M4.trans(0, 1.44 * s, 0), o.skin);
  if (hat) {
    put(0.30, 0.10, 0.30, 0, 1.55, 0, hex('#3a3f47'));
    put(0.26, 0.02, 0.36, 0, 1.62, 0.10, hex('#3a3f47'));
  }
  return GL.upload(mb);
}

function buildCarMesh(mb, x, z, rot, color) {
  const base = M4.trs(x, 0, z, rot || 0);
  const put = (w, h, d, lx, ly, lz, c) =>
    MB.add(mb, Geo.box(w, h, d), M4.mul(base, M4.trans(lx, ly + h / 2, lz)), c);

  put(1.78, 0.56, 4.05, 0, 0.30, 0, color);                 // gövde
  put(1.62, 0.14, 3.6, 0, 0.86, 0, shade(color, 0.92));     // tavan çıtası
  put(1.52, 0.52, 1.95, 0, 0.84, -0.18, hex('#3a4750'));    // kabin camı
  put(1.94, 0.20, 0.32, 0, 0.42, 2.0, hex('#d9dde0'));      // ön tampon
  put(1.94, 0.20, 0.32, 0, 0.42, -2.0, hex('#d9dde0'));     // arka tampon
  put(0.30, 0.16, 0.12, -0.6, 0.66, 2.03, hex('#fff0c0'));  // far
  put(0.30, 0.16, 0.12, 0.6, 0.66, 2.03, hex('#fff0c0'));
  put(0.26, 0.14, 0.10, -0.62, 0.66, -2.03, hex('#a03028')); // stop
  put(0.26, 0.14, 0.10, 0.62, 0.66, -2.03, hex('#a03028'));

  const wheel = (lx, lz) => {
    const m = M4.mulAll(base, M4.trans(lx, 0.33, lz), M4.rotZ(Math.PI / 2));
    MB.add(mb, Geo.cyl(0.33, 0.22, 10), M4.mul(m, M4.trans(0, -0.11, 0)), hex('#1e2226'));
  };
  wheel(-0.86, 1.32); wheel(0.86, 1.32);
  wheel(-0.86, -1.32); wheel(0.86, -1.32);
}

/* ------------------------------------------------------------------ */
/*  sahneyi çiz                                                       */
/* ------------------------------------------------------------------ */
Scene.draw = function (view, L) {
  const gl = GL.gl;
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // Yakın kırpma 0.8: 0.12 iken uzak binalarda derinlik hassasiyeti yetmiyor, pencerelerde z-fighting oluyordu.
  const proj = M4.perspective(view.fov, view.aspect, 0.8, 950);
  const vmat = M4.lookAt(view.eye, view.target, [0, 1, 0]);
  const vp = M4.mul(proj, vmat);

  GL.setScene(L);
  gl.disable(gl.BLEND);
  gl.depthMask(true);

  // statik mahalle
  GL.setEmissive(0, 1);
  GL.draw(this.mesh, vp, M4.ident());

  // hareketli kalabalık ve trafik
  drawActors(vp);

  // açık kapı (geçiş anında)
  if (Scene.activeDoor) drawDoor(vp, L);

  // gece ışıkları: pencereler + sokak lambaları
  if (L.lights > 0.02) {
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
    gl.depthMask(false);
    GL.setEmissive(1, Math.min(1, L.lights));
    GL.draw(this.glow, vp, M4.ident());
    gl.depthMask(true);
    gl.disable(gl.BLEND);
  }
};

function drawActors(vp) {
  const n = Life.walkers.length;
  for (let i = 0; i < n; i++) {
    const w = Life.walkers[i];
    const mesh = Scene.personGeo[i];
    if (!mesh) continue;
    const bob = Math.abs(Math.sin(w.bob)) * 0.045;
    const m = M4.trs(w.x, bob, w.z, w.rot);
    GL.draw(mesh, M4.mul(vp, m), m);
  }

  const dayKids = Life.hour > 6.2 && Life.hour < 20.8;
  if (dayKids) {
    for (let i = 0; i < Life.kids.length; i++) {
      const k = Life.kids[i];
      const mesh = Scene.kidGeo && Scene.kidGeo[i];
      if (!mesh) continue;
      const hop = Math.max(0, Math.sin(k.jump)) * 0.22;
      const rot = Math.atan2(k.vx, k.vz);
      const m = M4.trs(k.x, hop, k.z, rot);
      GL.draw(mesh, M4.mul(vp, m), m);
    }
  }

  for (let i = 0; i < Life.cars.length; i++) {
    const c = Life.cars[i];
    const mesh = Scene.carGeo[i];
    if (!mesh) continue;
    const m = M4.trs(c.x, 0, c.z, c.rot);
    GL.draw(mesh, M4.mul(vp, m), m);
  }
}

/* açılan kapı kanadı */
Scene.makeDoor = function () {
  const mb = MB.create();
  MB.add(mb, Geo.box(1.18, 2.08, 0.09), M4.trans(0.59, 1.04, 0), hex('#8a5f3c'));
  MB.add(mb, Geo.sphere(0.05, 6, 5), M4.trans(1.08, 1.05, 0.08), hex('#d8b24a'));
  Scene.doorMesh = GL.upload(mb);
};

function drawDoor(vp, L) {
  if (!Scene.doorMesh) Scene.makeDoor();
  const d = Scene.activeDoor;
  const ry = FACE_RY[d.b.face] + Math.PI / 2 * d.open;
  const m = M4.mulAll(M4.trans(d.ox, 0, d.oz), M4.rotY(ry));
  GL.setEmissive(0, 1);
  GL.draw(Scene.doorMesh, M4.mul(vp, m), m);
  // kapıdan taşan sıcak ışık
  if (d.open > 0.15) {
    const P = GL.gl;
    P.enable(P.BLEND);
    P.blendFunc(P.SRC_ALPHA, P.ONE);
    P.depthMask(false);
    GL.setEmissive(1, Math.min(1, d.open));
    const g = M4.mulAll(M4.trans(d.ox + d.nx * 1.2, 0.9, d.oz + d.nz * 1.2),
                        M4.rotX(-Math.PI / 2));
    GL.draw(Scene.doorGlow, M4.mul(vp, g), g);
    P.depthMask(true);
    P.disable(P.BLEND);
  }
}

Scene.makeDoorGlow = function () {
  const mb = MB.create();
  MB.add(mb, Geo.sphere(0.9, 10, 7), M4.ident(), hex('#ffd79a'));
  Scene.doorGlow = GL.upload(mb);
};

/* ------------------------------------------------------------------ */
/*  iç mekân                                                          */
/* ------------------------------------------------------------------ */
Scene.buildRoom = function (b) {
  const mb = MB.create();
  const W = 6.4, D = 5.6, H = 2.9;
  const wallC = b ? mixc(b.wall, hex('#f6f1e6'), 0.55) : hex('#efe6d5');
  const floorC = hex('#9c7048');

  // zemin: tahta şeritler
  const strips = 10;
  for (let i = 0; i < strips; i++) {
    const sz = -D / 2 + (D / strips) * (i + 0.5);
    MB.add(mb, Geo.plane(W, D / strips - 0.02), M4.trans(0, 0.002 + (i % 2) * 0.002, sz),
      shade(floorC, i % 2 ? 1 : 0.9));
  }
  // tavan
  MB.add(mb, Geo.plane(W, D), M4.mulAll(M4.trans(0, H, 0), M4.rotX(Math.PI)), shade(wallC, 0.88));

  // duvarlar (kutu olarak — iç yüzleri görünsün diye ince)
  const t = 0.16;
  MB.box(mb, wallC, 0, 0, -D / 2 - t / 2, W + t * 2, H, t);   // arka
  MB.box(mb, shade(wallC, 0.96), -W / 2 - t / 2, 0, 0, t, H, D); // sol
  MB.box(mb, shade(wallC, 0.98), W / 2 + t / 2, 0, 0, t, H, D);  // sağ
  MB.box(mb, shade(wallC, 0.94), 0, 0, D / 2 + t / 2, W + t * 2, H, t); // ön (kapı duvarı)

  // süpürgelik ve halı
  MB.box(mb, hex('#efe9dc'), 0, 0, -D / 2 + 0.04, W, 0.14, 0.07);
  MB.box(mb, hex('#9c4a3f'), 0, 0.02, -0.2, 3.4, 0.03, 2.6);
  MB.box(mb, hex('#c9953f'), 0, 0.04, -0.2, 2.9, 0.02, 2.1);

  // kanepe: sırtı sol duvara, yüzü +X'e dönük
  const sofa = hex('#4f6b8a'), sofa2 = hex('#5b7a9c');
  MB.box(mb, sofa, -2.35, 0, 0.2, 1.15, 0.42, 2.4);
  MB.box(mb, sofa2, -2.85, 0, 0.2, 0.32, 0.92, 2.4);
  MB.box(mb, sofa2, -2.35, 0.42, -0.95, 1.15, 0.42, 0.28);
  MB.box(mb, sofa2, -2.35, 0.42, 1.35, 1.15, 0.42, 0.28);
  MB.box(mb, hex('#e6dcc6'), -2.25, 0.42, 0.2, 0.9, 0.12, 2.0);

  // sehpa
  MB.box(mb, hex('#8a6a46'), 0.1, 0.4, 0.05, 1.5, 0.08, 0.9);
  MB.box(mb, hex('#6f5334'), 0.1, 0, 0.05, 1.25, 0.4, 0.22);
  MB.box(mb, hex('#c9563f'), -0.35, 0.44, 0.05, 0.42, 0.05, 0.5);
  MB.add(mb, Geo.cyl(0.09, 0.15, 8), M4.trans(0.5, 0.44, 0.05), hex('#e8e0cc'));

  // televizyon: arka duvarda
  MB.box(mb, hex('#6b533c'), 0, 0, -D / 2 + 0.3, 2.3, 0.5, 0.5);
  MB.box(mb, hex('#1c2024'), 0, 0.78, -D / 2 + 0.22, 1.62, 0.9, 0.08);
  MB.box(mb, hex('#2b3a45'), 0, 0.83, -D / 2 + 0.17, 1.5, 0.78, 0.02);

  // kitaplık: sağ duvarda
  MB.box(mb, hex('#7a5a3c'), W / 2 - 0.3, 0, -1.5, 0.5, 1.95, 1.5);
  for (let i = 0; i < 4; i++) {
    MB.box(mb, hex(['#c9563f', '#3f7fa8', '#d9b04a', '#4d8a5a'][i]),
      W / 2 - 0.3, 0.4 + i * 0.42, -1.5, 0.42, 0.3, 1.25);
  }

  // pencere: sağ duvarda
  vquad(mb, W / 2 - 0.06, 1.72, 0.9, 1.7, 1.35, Math.PI / 2, hex('#bfdcee'));
  vquad(mb, W / 2 - 0.04, 2.44, 0.9, 1.9, 0.1, Math.PI / 2, hex('#f2ece0'));
  vquad(mb, W / 2 - 0.04, 1.0, 0.9, 1.9, 0.1, Math.PI / 2, hex('#f2ece0'));
  vquad(mb, W / 2 - 0.05, 1.72, 0.9, 0.05, 1.3, Math.PI / 2, hex('#f2ece0'));

  // tavan lambası (sehpanın üstünde, bakış hattını kapatmayacak yerde)
  MB.add(mb, Geo.cyl(0.015, 0.42, 6), M4.trans(-1.55, H - 0.42, -1.5), hex('#4a4f55'));
  MB.add(mb, Geo.cone(0.30, 0.26, 12), M4.trans(-1.55, H - 0.68, -1.5), hex('#f0d79a'));

  // saksı: arka sol köşe
  MB.add(mb, Geo.cyl(0.26, 0.45, 8), M4.trans(-2.5, 0, -2.3), hex('#a86a4a'));
  MB.add(mb, Geo.sphere(0.42, 8, 6), M4.trans(-2.5, 0.8, -2.3), hex('#3f7a3c'));

  // duvar tablosu
  MB.box(mb, hex('#6b4a30'), 1.75, 1.42, -D / 2 + 0.05, 0.92, 0.72, 0.05);
  MB.box(mb, hex('#8fbfd0'), 1.75, 1.47, -D / 2 + 0.08, 0.78, 0.6, 0.02);

  // kapı çerçevesi: ön duvar (izleyicinin arkası)
  MB.box(mb, hex('#6b4a30'), 0, 0, D / 2 - 0.08, 1.5, 2.3, 0.1);

  Scene.roomMesh = GL.upload(mb);

  const g = MB.create();
  MB.add(g, Geo.sphere(0.13, 8, 6), M4.trans(-1.55, H - 0.80, -1.5), hex('#ffe3a8'));
  Scene.roomGlow = GL.upload(g);
  Scene.roomDims = { W: W, D: D, H: H };
  return Scene.roomMesh;
};

Scene.drawInterior = function (view, L) {
  const gl = GL.gl;
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  const proj = M4.perspective(view.fov, view.aspect, 0.05, 60);
  const vmat = M4.lookAt(view.eye, view.target, [0, 1, 0]);
  const vp = M4.mul(proj, vmat);

  GL.setScene({
    lightDir: [0.25, 0.9, 0.35],
    sunColor: [0.52, 0.50, 0.46],
    ambient: [0.46, 0.44, 0.42],
    tint: mixc([0.72, 0.74, 0.92], [1, 0.98, 0.94], L.dayF),
    fogColor: [0.1, 0.1, 0.12],
    fogNear: 30, fogFar: 80, fogAmount: 0.15,
  });

  gl.disable(gl.BLEND);
  GL.setEmissive(0, 1);
  GL.draw(Scene.roomMesh, vp, M4.ident());

  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
  gl.depthMask(false);
  GL.setEmissive(1, 0.35 + L.lights * 0.6);
  GL.draw(Scene.roomGlow, vp, M4.ident());
  gl.depthMask(true);
  gl.disable(gl.BLEND);
};
