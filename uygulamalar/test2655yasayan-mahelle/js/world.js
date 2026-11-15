'use strict';
/* Numex Living Neighborhood — dünya verisi (3B)
   Sokak ızgarası, arsalar, binalar, donatılar. Yapay zekâ yok; saf kural. */

/* ---------- renk yardımcıları ---------- */
function hex(h) {
  const v = parseInt(h.replace('#', ''), 16);
  return [(v >> 16 & 255) / 255, (v >> 8 & 255) / 255, (v & 255) / 255];
}
function shade(c, k) { return [c[0] * k, c[1] * k, c[2] * k]; }
function mixc(a, b, t) {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}

/* ---------- tohumlu rastgele ---------- */
function makeRng(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const R = makeRng(20261115);
const rr = (a, b) => a + (b - a) * R();
const ri = (a, b) => Math.floor(a + (b - a + 1) * R());
const pick = (arr) => arr[Math.floor(R() * arr.length)];

/* ---------- ölçüler (1 birim = 1 metre) ---------- */
const T = {
  roadW: 8,
  walkW: 2.6,
  X: [-140, 140],
  Z: [-115, 115],
  vRoads: [-90, -30, 30, 90],   // Z boyunca uzanan yollar
  hRoads: [-70, 0, 70],         // X boyunca uzanan yollar
  ground: { w: 920, d: 920 },
};

/* Blok sınırları: yollar arası boşluklar */
function edges(min, max, lines) {
  const out = [];
  let from = min;
  const half = T.roadW / 2 + T.walkW; // yol + iki kaldırım
  for (const L of lines) {
    out.push([from, L - half]);
    from = L + half;
  }
  out.push([from, max]);
  return out;
}
const XS = edges(T.X[0], T.X[1], T.vRoads);
const ZS = edges(T.Z[0], T.Z[1], T.hRoads);

/* ---------- palette ---------- */
const PAL = {
  grass: hex('#7ba05b'),
  grassDark: hex('#6c8f4f'),
  asphalt: hex('#3d4247'),
  walk: hex('#b9b3a6'),
  curb: hex('#9a9488'),
  line: hex('#d9d2b8'),
  apartment: ['#e6dcc8', '#dfc9a8', '#e8d3c3', '#d9d3c7', '#e3bfa2', '#cfc6b6'],
  aptRoof: ['#8a6a52', '#7d5c46', '#94806b', '#6f6258'],
  house: ['#f0e6cd', '#e9d7b4', '#f2ded0', '#dfe6cf', '#f0deb9'],
  houseRoof: ['#b4553f', '#a34a38', '#c06a4a', '#96503c'],
  glass: hex('#8fb2c4'),
  door: hex('#6b4a30'),
  trunk: hex('#6b5340'),
  leaf: ['#4f7f3d', '#446f34', '#5a8a45', '#3f6b32'],
  car: ['#c1483c', '#3f6da8', '#d8d3c8', '#3a3f47', '#5c8a4e', '#c9a13e', '#8e5c9e'],
  skin: ['#e6bb94', '#d9a678', '#c58b5f', '#f0c9a4'],
  shirt: ['#c9563f', '#3f7fa8', '#d9b04a', '#7a5c9e', '#4d8a5a', '#c47a3a', '#8a95a3'],
  lamp: hex('#4a4f55'),
  lampGlow: hex('#ffd98a'),
};

/* ---------- binalar ---------- */
const Town = {
  blocks: [],
  buildings: [],
  trees: [],
  lamps: [],
  benches: [],
  cars: [],
  parked: [],
};

const NAME_APT = ['Menekşe', 'Lale', 'Papatya', 'Çınar', 'Gül', 'Kardelen', 'Sümbül', 'Yasemin',
  'Akasya', 'Zambak', 'Fulya', 'İnci', 'Nergis', 'Karanfil', 'Manolya'];
const NAME_FAM = ['Yılmaz', 'Kaya', 'Demir', 'Şahin', 'Çelik', 'Aydın', 'Öztürk', 'Arslan',
  'Doğan', 'Kılıç', 'Aslan', 'Koç', 'Kurt', 'Taş', 'Aksoy'];
const NAME_SHOP = ['Bakkal Hasan', 'Bakkal Nuri', 'Market Emine', 'Fırın Ali Usta',
  'Fırın Hüseyin', 'Kasap Recep', 'Manav Salih', 'Berber İsmail'];

let nameIdx = 0;
function nextName(type) {
  if (type === 'apartman') return NAME_APT[nameIdx++ % NAME_APT.length] + ' Apartmanı';
  if (type === 'ev') return NAME_FAM[nameIdx++ % NAME_FAM.length] + ' Evi';
  return NAME_SHOP[nameIdx++ % NAME_SHOP.length];
}

/**
 * Bir arsaya bina yerleştirir.
 * lx,lz: arsa merkezi — w,d: arsa ölçüsü — face: 0:-Z 1:+X 2:+Z 3:-X
 */
function addBuilding(lx, lz, lotW, lotD, face, type, opts) {
  opts = opts || {};
  const isApt = type === 'apartman';
  const isEv = type === 'ev';
  const isShop = type === 'bakkal' || type === 'firin';

  let w, d, floors, h;
  if (isApt) {
    w = Math.min(lotW - 3, rr(10, 13));
    d = Math.min(lotD - 3, rr(9, 11));
    floors = ri(3, 5);
    h = floors * 3.0;
  } else if (isEv) {
    w = Math.min(lotW - 4, rr(8, 10.5));
    d = Math.min(lotD - 4, rr(7.5, 9.5));
    floors = ri(1, 2);
    h = floors * 2.9;
  } else {
    w = Math.min(lotW - 3, 9);
    d = Math.min(lotD - 3, 7.5);
    floors = 1;
    h = 3.6;
  }

  const wallColor = hex(isApt ? pick(PAL.apartment) : isEv ? pick(PAL.house) : '#f2ead6');
  const roofColor = hex(isApt ? pick(PAL.aptRoof) : pick(PAL.houseRoof));

  const b = {
    x: lx, z: lz, w: w, d: d, h: h, floors: floors, face: face,
    type: type,
    name: opts.name || nextName(type),
    wall: wallColor,
    roof: roofColor,
    doorT: 0,           // kapı açılma oranı 0..1
    residents: isApt ? ri(6, 14) : isEv ? ri(2, 5) : 0,
    litSeed: R(),
  };
  // dünya sınırları
  b.bx0 = b.x - w / 2; b.bx1 = b.x + w / 2;
  b.bz0 = b.z - d / 2; b.bz1 = b.z + d / 2;

  // kapı: ön yüzün ortasında
  const dof = 0.8;
  if (face === 0) { b.door = { x: b.x, z: b.bz0, nx: 0, nz: -1, ox: b.x, oz: b.bz0 - dof }; }
  if (face === 1) { b.door = { x: b.bx1, z: b.z, nx: 1, nz: 0, ox: b.bx1 + dof, oz: b.z }; }
  if (face === 2) { b.door = { x: b.x, z: b.bz1, nx: 0, nz: 1, ox: b.x, oz: b.bz1 + dof }; }
  if (face === 3) { b.door = { x: b.bx0, z: b.z, nx: -1, nz: 0, ox: b.bx0 - dof, oz: b.z }; }

  Town.buildings.push(b);
  return b;
}

/* ---------- arsa bölme ---------- */
function layoutResidential(block) {
  const w = block.x1 - block.x0;
  const d = block.z1 - block.z0;
  const cols = Math.max(1, Math.round(w / 17));
  const rows = Math.max(1, Math.round(d / 15));
  const lotW = w / cols;
  const lotD = d / rows;

  for (let cz = 0; cz < rows; cz++) {
    for (let cx = 0; cx < cols; cx++) {
      // her beş arsadan biri boş kalsın: avlu, ağaç, çamaşırlık
      if (R() < 0.16) continue;

      const lx = block.x0 + lotW * (cx + 0.5);
      const lz = block.z0 + lotD * (cz + 0.5);

      // en yakın sokak kenarı ön yüz olur
      const dists = [lz - block.z0, block.x1 - lx, block.z1 - lz, lx - block.x0];
      let face = 0, best = dists[0];
      for (let i = 1; i < 4; i++) if (dists[i] < best) { best = dists[i]; face = i; }

      const roll = R();
      let type = 'ev';
      if (roll < 0.52) type = 'apartman';
      else if (roll > 0.94) type = R() < 0.5 ? 'bakkal' : 'firin';

      addBuilding(lx, lz, lotW, lotD, face, type);
    }
  }
}

/* ---------- mahalle planı ---------- */
const PLAN = [
  ['res', 'res', 'res', 'res', 'res'],
  ['res', 'mosque', 'res', 'res', 'res'],
  ['res', 'park', 'school', 'firin', 'res'],
  ['res', 'res', 'res', 'res', 'res'],
];

function buildTown() {
  for (let j = 0; j < ZS.length; j++) {
    for (let i = 0; i < XS.length; i++) {
      const block = {
        i: i, j: j,
        x0: XS[i][0], x1: XS[i][1],
        z0: ZS[j][0], z1: ZS[j][1],
        type: (PLAN[j] && PLAN[j][i]) || 'res',
      };
      block.cx = (block.x0 + block.x1) / 2;
      block.cz = (block.z0 + block.z1) / 2;
      Town.blocks.push(block);

      if (block.type === 'park') { block.name = 'Mahalle Parkı'; continue; }
      if (block.type === 'school') { block.name = 'Cumhuriyet İlkokulu'; continue; }
      if (block.type === 'mosque') { block.name = 'Merkez Camii'; continue; }
      layoutResidential(block);
    }
  }
  return Town;
}

/* ------------------------------------------------------------------ */
/*  Özel yapılar                                                      */
/* ------------------------------------------------------------------ */
const Special = { park: null, school: null, mosque: null, play: null, fountain: null, flag: null };

function insideAnyBuilding(x, z, pad) {
  for (const b of Town.buildings) {
    if (x > b.bx0 - pad && x < b.bx1 + pad && z > b.bz0 - pad && z < b.bz1 + pad) return true;
  }
  return false;
}

function specialBuilding(x, z, w, d, h, type, name, face, floors) {
  const b = {
    x: x, z: z, w: w, d: d, h: h,
    floors: floors || 1, face: face === undefined ? 2 : face, type: type, name: name,
    wall: hex('#efe9dc'), roof: hex('#8a8378'),
    doorT: 0, residents: 0, litSeed: R(), special: true,
  };
  b.bx0 = x - w / 2; b.bx1 = x + w / 2;
  b.bz0 = z - d / 2; b.bz1 = z + d / 2;
  if (b.face === 2) b.door = { x: x, z: b.bz1, nx: 0, nz: 1, ox: x, oz: b.bz1 + 1.2 };
  else b.door = { x: x, z: b.bz0, nx: 0, nz: -1, ox: x, oz: b.bz0 - 1.2 };
  Town.buildings.push(b);
  return b;
}

function buildSchool(block) {
  const w = Math.min(block.x1 - block.x0 - 12, 30);
  const d = 11;
  const x = block.cx;
  const z = block.z0 + 7 + d / 2;
  const b = specialBuilding(x, z, w, d, 8.4, 'okul', 'Cumhuriyet İlkokulu', 2, 2);
  b.wall = hex('#f1ebdb');
  b.roof = hex('#79818a');
  Special.school = { block: block, building: b };
  Special.flag = { x: block.cx + w / 2 + 3.5, z: b.bz1 + 6 };
  Town.trees.push({ x: block.x0 + 4, z: block.z1 - 4, s: 1.2, kind: 0 });
  Town.trees.push({ x: block.x1 - 4, z: block.z1 - 4, s: 1.1, kind: 0 });
}

function buildMosque(block) {
  const w = Math.min(block.x1 - block.x0 - 16, 17);
  const d = 17;
  const cz = block.cz + 1;
  const b = specialBuilding(block.cx - 1.5, cz, w, d, 9.5, 'cami', 'Merkez Camii', 2, 1);
  b.wall = hex('#f5f0e4');
  b.roof = hex('#7f9a94');
  Special.mosque = { block: block, building: b };
  Special.minaret = { x: block.cx + w / 2 + 4.5, z: cz - 2, h: 24 };
  Town.trees.push({ x: block.x0 + 4.5, z: block.z0 + 5, s: 1.25, kind: 0 });
  Town.trees.push({ x: block.x0 + 4.5, z: block.z1 - 5, s: 1.15, kind: 0 });
}

function buildPark(block) {
  Special.park = { x0: block.x0, x1: block.x1, z0: block.z0, z1: block.z1, cx: block.cx, cz: block.cz };
  Special.play = { x: block.cx + 7, z: block.cz + 9 };
  Special.fountain = { x: block.cx, z: block.cz - 7 };

  // parkın çevresinde ağaç halkası
  const ring = [
    [block.x0 + 3, block.z0 + 3], [block.cx, block.z0 + 2.5], [block.x1 - 3, block.z0 + 3],
    [block.x0 + 2.5, block.cz], [block.x1 - 2.5, block.cz - 4],
    [block.x0 + 3, block.z1 - 3], [block.cx - 6, block.z1 - 3], [block.x1 - 4, block.z1 - 4],
  ];
  for (const p of ring) Town.trees.push({ x: p[0], z: p[1], s: rr(0.95, 1.4), kind: 0 });

  // park içi ağaç kümeleri (yürüyüş yollarını boş bırakır)
  const clusters = [
    [-14, 17], [-16, -4], [-10, -18], [13, -17],
    [17, 5], [14, 19], [-7, 21], [10, -9],
  ];
  for (const c of clusters) {
    const px = block.cx + c[0], pz = block.cz + c[1];
    if (px < block.x0 + 2 || px > block.x1 - 2) continue;
    if (pz < block.z0 + 2 || pz > block.z1 - 2) continue;
    Town.trees.push({ x: px, z: pz, s: rr(0.9, 1.45), kind: R() < 0.25 ? 1 : 0 });
  }

  // banklar
  Town.benches.push({ x: block.cx - 5, z: block.cz + 2, rot: Math.PI / 2 });
  Town.benches.push({ x: block.cx + 5, z: block.cz + 2, rot: -Math.PI / 2 });
  Town.benches.push({ x: block.cx, z: block.cz - 13, rot: 0 });
  Town.benches.push({ x: block.cx - 12, z: block.cz + 12, rot: Math.PI });
}

/* ------------------------------------------------------------------ */
/*  Donatı serpme                                                     */
/* ------------------------------------------------------------------ */
function scatterTrees() {
  for (const b of Town.blocks) {
    if (b.type !== 'res') continue;
    const n = ri(3, 6);
    for (let i = 0; i < n; i++) {
      for (let t = 0; t < 18; t++) {
        const x = rr(b.x0 + 2, b.x1 - 2);
        const z = rr(b.z0 + 2, b.z1 - 2);
        if (insideAnyBuilding(x, z, 2.4)) continue;
        Town.trees.push({ x: x, z: z, s: rr(0.7, 1.25), kind: R() < 0.22 ? 1 : 0 });
        break;
      }
    }
  }
  // sokak ağaçları: kaldırım kenarı
  for (const z of T.hRoads) {
    for (let x = -130; x <= 130; x += 26) {
      if (Math.abs(x) % 52 < 13) continue;
      Town.trees.push({ x: x, z: z - 6.1, s: rr(0.6, 0.9), kind: 0 });
    }
  }
}

function placeLamps() {
  const off = T.roadW / 2 + T.walkW - 0.7;
  for (const z of T.hRoads) {
    for (let x = -130; x <= 130; x += 22) {
      Town.lamps.push({ x: x, z: z - off });
      if (Math.abs(x) % 44 > 12) Town.lamps.push({ x: x, z: z + off });
    }
  }
  for (const x of T.vRoads) {
    for (let z = -105; z <= 105; z += 22) {
      Town.lamps.push({ x: x - off, z: z });
      if (Math.abs(z) % 44 > 12) Town.lamps.push({ x: x + off, z: z });
    }
  }
}

function placeParkedCars() {
  const off = T.roadW / 2 - 1.3;
  for (const z of T.hRoads) {
    for (let x = -120; x <= 120; x += 15) {
      if (R() < 0.55) continue;
      Town.parked.push({
        x: x + rr(-1, 1), z: z + (R() < 0.5 ? off : -off),
        rot: R() < 0.5 ? 0 : Math.PI,
        color: hex(pick(PAL.car)),
      });
    }
  }
  for (const x of T.vRoads) {
    for (let z = -90; z <= 90; z += 17) {
      if (R() < 0.62) continue;
      Town.parked.push({
        x: x + (R() < 0.5 ? off : -off), z: z + rr(-1, 1),
        rot: R() < 0.5 ? Math.PI / 2 : -Math.PI / 2,
        color: hex(pick(PAL.car)),
      });
    }
  }
}

function buildSpecial() {
  for (const b of Town.blocks) {
    if (b.type === 'park') buildPark(b);
    else if (b.type === 'school') buildSchool(b);
    else if (b.type === 'mosque') buildMosque(b);
  }
  scatterTrees();
  placeLamps();
  placeParkedCars();
}

/* ------------------------------------------------------------------ */
/*  Güzergâhlar                                                       */
/* ------------------------------------------------------------------ */

/** Dikdörtgen çevrim uzunluğu. */
function loopLength(L) {
  return 2 * ((L.x1 - L.x0) + (L.z1 - L.z0));
}

/** Çevrim üzerinde s konumundaki nokta ve yön. */
function loopPoint(L, s) {
  const w = L.x1 - L.x0, d = L.z1 - L.z0;
  const P = 2 * (w + d);
  s = ((s % P) + P) % P;
  if (s < w) return { x: L.x0 + s, z: L.z0, dx: 1, dz: 0 };
  s -= w;
  if (s < d) return { x: L.x1, z: L.z0 + s, dx: 0, dz: 1 };
  s -= d;
  if (s < w) return { x: L.x1 - s, z: L.z1, dx: -1, dz: 0 };
  s -= w;
  return { x: L.x0, z: L.z1 - s, dx: 0, dz: -1 };
}

/** Binaların çevresine kaldırım yürüyüş halkaları. */
function buildWalks() {
  Town.walkLoops = [];
  const m = T.walkW / 2;
  for (const b of Town.blocks) {
    if (b.type === 'park') continue;
    if (b.x1 - b.x0 < 14 || b.z1 - b.z0 < 12) continue;
    const L = {
      x0: b.x0 - m, z0: b.z0 - m,
      x1: b.x1 + m, z1: b.z1 + m,
    };
    L.len = loopLength(L);
    Town.walkLoops.push(L);
  }
}

/** Araç şeritleri — yollar boyunca düz gidiş. */
function buildLanes() {
  Town.lanes = [];
  const lane = 2.4;
  for (const z of T.hRoads) {
    Town.lanes.push({ axis: 'x', fixed: z - lane, dir: 1 });
    Town.lanes.push({ axis: 'x', fixed: z + lane, dir: -1 });
  }
  for (const x of T.vRoads) {
    Town.lanes.push({ axis: 'z', fixed: x + lane, dir: 1 });
    Town.lanes.push({ axis: 'z', fixed: x - lane, dir: -1 });
  }
}

/* ------------------------------------------------------------------ */
/*  Işın–kutu kesişimi (binaya tıklama)                               */
/* ------------------------------------------------------------------ */
Town.rayPick = function (o, d, maxDist) {
  let best = null;
  const md = maxDist || 900;
  for (const b of Town.buildings) {
    let t0 = 0, t1 = md, hit = true;
    const lo = [b.bx0, 0, b.bz0];
    const hi = [b.bx1, b.h, b.bz1];
    const oo = [o[0], o[1], o[2]];
    const dd = [d[0], d[1], d[2]];
    for (let a = 0; a < 3; a++) {
      if (Math.abs(dd[a]) < 1e-6) {
        if (oo[a] < lo[a] || oo[a] > hi[a]) { hit = false; break; }
      } else {
        const inv = 1 / dd[a];
        let ta = (lo[a] - oo[a]) * inv;
        let tb = (hi[a] - oo[a]) * inv;
        if (ta > tb) { const tmp = ta; ta = tb; tb = tmp; }
        if (ta > t0) t0 = ta;
        if (tb < t1) t1 = tb;
        if (t0 > t1) { hit = false; break; }
      }
    }
    if (hit && t0 > 0 && (!best || t0 < best.t)) {
      best = {
        b: b, t: t0,
        point: [o[0] + d[0] * t0, o[1] + d[1] * t0, o[2] + d[2] * t0],
      };
    }
  }
  return best;
};

/** Kadın/erkek değil — sadece görünüm çeşitliliği için rastgele kişi rengi. */
function personColors(rng) {
  return {
    skin: hex(pick(PAL.skin)),
    shirt: hex(pick(PAL.shirt)),
    pants: hex(pick(['#3c4450', '#4a4038', '#2f3a44', '#5b5348'])),
  };
}

/* ------------------------------------------------------------------ */
/*  Kurulum                                                           */
/* ------------------------------------------------------------------ */
Town.init = function () {
  buildTown();
  buildSpecial();
  buildWalks();
  buildLanes();
  return Town;
};
