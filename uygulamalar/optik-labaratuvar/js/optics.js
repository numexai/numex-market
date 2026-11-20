// NUMEX PRİZMA — optics.js
// Gerçek ışın izleme motoru: yansıma, Snell kırılması, TIR, ince mercek, prizma dispersiyonu.

import {
  EPS, vec, add, sub, mul, dot, len, norm, rot, angleOf, deg, rad,
  reflect, refract, criticalAngle, raySegmentHit, rayCircleHit,
  rayLineHit, pointInPolygon, transformPoint, transformDir, elementVertices
} from './geometry.js';

/** Işın–düzlem kesişimi: düzlem (p noktası, nrm NORMALİ) ile verilir. */
export function rayPlaneHit(origin, dir, p, nrm) {
  const den = dot(dir, nrm);
  if (Math.abs(den) < 1e-12) return null; // düzleme paralel
  const t = dot(sub(p, origin), nrm) / den;
  if (t < EPS) return null;
  return { t, point: { x: origin.x + dir.x * t, y: origin.y + dir.y * t } };
}

export const MAX_BOUNCE = 40;

export const ORTAMLAR = { hava: 1.0003, su: 1.333, cam: 1.5, elmas: 2.42 };

// Cauchy dispersiyon: n(λ) = n₀ · (1 + B·(1/λ² − 1/λ₀²)), λ nm.
const CAUCHY_B = 4200;
const LAMBDA0 = 550;
const N_REF = 1.52;

export class ValidationError extends Error {
  constructor(m) { super(m); this.name = 'ValidationError'; }
}

export function validateMediumIndex(n) {
  if (typeof n !== 'number' || !isFinite(n) || Number.isNaN(n) || n <= 0) {
    throw new ValidationError('Kırılma indisi 0 veya negatif olamaz: "' + n + '"');
  }
  return true;
}

export function cauchyIndex(nBase, nm) {
  validateMediumIndex(nBase);
  const l = nm > 0 ? nm : LAMBDA0;
  return nBase * (1 + CAUCHY_B * (1 / (l * l) - 1 / (LAMBDA0 * LAMBDA0)));
}

/** Dalga boyuna göre görünür renk (görsel amaçlı). */
export function wavelengthColor(nm) {
  if (!nm || nm <= 0) return '#ffffff';
  if (nm < 450) return '#8b5cf6';
  if (nm < 490) return '#3b82f6';
  if (nm < 520) return '#22d3ee';
  if (nm < 570) return '#22c55e';
  if (nm < 600) return '#eab308';
  if (nm < 640) return '#f97316';
  return '#ef4444';
}

export const SPEKTRUM = [
  { ad: 'kırmızı', nm: 650 },
  { ad: 'yeşil', nm: 550 },
  { ad: 'mavi', nm: 450 }
];

/** Tüm optik yüzeyleri üretir (mercekler ayrı işlenir). */
export function buildSurfaces(state) {
  const out = [];
  for (const el of state.elements) {
    if (el.visible === false) continue;
    const t = el.tip;
    if (t === 'pointSource' || t === 'parallelSource') continue;
    if (t === 'convergingLens' || t === 'divergingLens') continue;
    const verts = elementVertices(el);

    if (t === 'prism') {
      for (let i = 0; i < verts.length; i++) {
        out.push({
          kind: 'prism', a: verts[i], b: verts[(i + 1) % verts.length],
          elementId: el.id, element: el
        });
      }
      continue;
    }
    if (t === 'screen' || t === 'wall') {
      out.push({ kind: 'screen', a: verts[0], b: verts[1], elementId: el.id, element: el });
      continue;
    }
    for (let i = 0; i < verts.length - 1; i++) {
      out.push({ kind: 'mirror', a: verts[i], b: verts[i + 1], elementId: el.id, element: el });
    }
  }
  return out;
}

// Yüzey etkileşimi tek girişten: yansıma / kırılma / TIR / soğurma kararı burada verilir.
// applySurface — merkezî etkileşim kararı (tek kaynak; traceRay bunu çağırır)
export function applySurface(origin, dir, hit, nMedium = 1.0003) {
  const s = hit.surface;
  const nm = s.material ? (s.material.n ?? nMedium) : nMedium;
  if (s.kind === 'screen') return { dir: null, nMedium, kind: 'screen', tir: false };
  if (s.kind === 'mirror') return { dir: reflect(dir, s.normal), nMedium, kind: 'mirror', tir: false };
  const out = refract(dir, s.normal, nMedium, nm);
  if (!out) return { dir: reflect(dir, s.normal), nMedium, kind: 'mirror', tir: true };
  return { dir: out, nMedium: nm, kind: 'refract', tir: false };
}

export function nearestHit(origin, dir, surfaces, ignoreIds = null) {
  let best = null;
  for (const s of surfaces) {
    if (ignoreIds && ignoreIds.has(s.elementId)) continue;
    const h = raySegmentHit(origin, dir, s.a, s.b);
    if (!h) continue;
    if (!best || h.t < best.t) best = { ...h, surface: s };
  }
  return best;
}

/** Mercek odak uzaklığı (px). f verilmişse o; yoksa üretici denklemi. */
export function lensFocalLength(el, state) {
  if (typeof el.f === 'number' && isFinite(el.f) && el.f !== 0) return el.f;
  const n = el.n ?? 1.5;
  const R1 = el.R1 ?? 60, R2 = el.R2 ?? -60;
  const inv = (n - 1) * (1 / R1 - 1 / R2);
  return Math.abs(inv) < 1e-12 ? Infinity : 1 / inv;
}

/**
 * İnce mercek yaklaşımı (paraksiyel).
 * Mercek düzlemi: merkez el.(x,y), normali (1,0)'ın döndürülmüş hâli.
 * Optik eksen = düzlem normali; düzlem boyunca koordinat = h (yükseklik).
 * Kural: tan β′ = tan β − h/f  (β: ışının düzlem/eksen eğimi)
 */
export function applyLens(origin, dir, lensEl, state, nm) {
  const nBase = state.ortam?.n ?? ORTAMLAR.hava;
  let f = lensFocalLength(lensEl, state);

  // Renk başına odak: f(λ) = f · (n_ref − 1)/(n(λ) − 1)
  if (lensEl.dispersion !== false && isFinite(f) && nm) {
    const lensMat = lensEl.n ?? N_REF;
    const nCol = cauchyIndex(lensMat, nm);
    f = (f * (N_REF - 1)) / Math.max(1e-6, nCol - 1);
  }

  const center = { x: lensEl.x, y: lensEl.y };
  const planeNormal = transformDir(vec(1, 0), lensEl);  // düzleme dik (optik eksen)
  const planeDir = transformDir(vec(0, 1), lensEl);     // düzlem boyunca

  const hit = rayPlaneHit(origin, dir, center, planeNormal);
  if (!hit) return null;
  const p = hit.point;
  const h = dot(sub(p, center), planeDir);              // optik eksenden yükseklik
  const aperture = (lensEl.size ?? 160) / 2;
  if (Math.abs(h) > aperture) {
    return { dirs: [dir], nMedium: nBase, point: p, hit: false };
  }

  const d = norm(dir);
  const alongAxis = dot(d, planeNormal);
  const alongPlane = dot(d, planeDir);
  const dSign = alongAxis >= 0 ? 1 : -1;

  const tanB = alongPlane / Math.max(1e-12, Math.abs(alongAxis));
  const tanB2 = tanB - h / f;
  // NUMEX-DÜZELTME (2026-11-19): Yön vektörü norm() ile normalize ediliyordu; 1e-12 koruması sayesinde çıktı sıfırlanabiliyordu ve yakınsak mercek odağa getirmiyordu. Yön, birim vektör olarak doğrudan kurulur.
  // Birim yön (düzlem koordinatlarında), sonra dünyaya döndürülür.
  const yerel = { x: dSign, y: tanB2 };
  const uz = Math.hypot(yerel.x, yerel.y) || 1;
  const newDir = norm(add(
    mul(planeNormal, yerel.x / uz),
    mul(planeDir, yerel.y / uz)
  ));
  return { dirs: [newDir], nMedium: nBase, point: p, hit: true, h, f };
}

function nearestLensHit(origin, dir, elements) {
  let best = null;
  for (const el of elements) {
    if (el.visible === false) continue;
    if (el.tip !== 'convergingLens' && el.tip !== 'divergingLens') continue;
    const planeNormal = transformDir(vec(1, 0), el);
    const h = rayPlaneHit(origin, dir, { x: el.x, y: el.y }, planeNormal);
    if (!h) continue;
    if (!best || h.t < best.t) best = { t: h.t, point: h.point, el };
  }
  return best;
}

/** Tek ışını izler. */
export function traceRay(origin, dir, state, surfaces, opts = {}) {
  const color = opts.color || { hex: '#ffffff', nm: 0 };
  const nStart = opts.nMedium ?? (state.ortam?.n ?? ORTAMLAR.hava);
  let nMedium = nStart;
  let p = { x: origin.x, y: origin.y };
  let d = norm(dir);
  const points = [{ x: p.x, y: p.y }];
  const hits = [];
  let bounces = 0, refractions = 0, tir = 0;
  let ended = 'maxBounce';
  const prismIndex = color.nm ? cauchyIndex(opts.prismBase ?? N_REF, color.nm) : (opts.prismBase ?? N_REF);

  for (let i = 0; i < MAX_BOUNCE; i++) {
    const lensHit = nearestLensHit(p, d, state.elements);
    const surfHit = nearestHit(p, d, surfaces);
    const takeLens = lensHit && (!surfHit || lensHit.t < surfHit.t);

    if (takeLens) {
      const res = applyLens(p, d, lensHit.el, state, color.nm);
      if (!res) { ended = 'outOfBounds'; break; }
      points.push(res.point);
      const aIn = deg(Math.abs(Math.atan2(
        dot(d, transformDir(vec(0, 1), lensHit.el)),
        dot(d, transformDir(vec(1, 0), lensHit.el))
      )));
      const aOut = deg(Math.abs(Math.atan2(
        dot(res.dirs[0], transformDir(vec(0, 1), lensHit.el)),
        dot(res.dirs[0], transformDir(vec(1, 0), lensHit.el))
      )));
      hits.push({
        x: res.point.x, y: res.point.y, elementId: lensHit.el.id,
        kind: 'lens', angleIn: aIn, angleOut: aOut, f: res.f, h: res.h
      });
      if (res.hit) refractions++;
      p = res.point;
      d = res.dirs[0];
      continue;
    }

    if (!surfHit) {
      p = add(p, mul(d, 4000));
      points.push(p);
      ended = 'outOfBounds';
      break;
    }

    points.push(surfHit.point);
    const s = surfHit.surface;
    const nrm = surfHit.normal;

    if (s.kind === 'screen') {
      hits.push({ x: surfHit.point.x, y: surfHit.point.y, elementId: s.elementId, kind: 'screen' });
      ended = 'screen';
      p = surfHit.point;
      break;
    }

    if (s.kind === 'mirror') {
      const angIn = deg(Math.acos(Math.min(1, Math.max(-1, -dot(d, nrm)))));
      d = reflect(d, nrm);
      const angOut = deg(Math.acos(Math.min(1, Math.max(-1, dot(d, nrm)))));
      bounces++;
      hits.push({
        x: surfHit.point.x, y: surfHit.point.y, elementId: s.elementId,
        kind: 'mirror', angleIn: angIn, angleOut: angOut
      });
      p = add(surfHit.point, mul(d, 1e-6));
      continue;
    }

    if (s.kind === 'prism') {
      const inside = pointInPolygon(add(surfHit.point, mul(d, 0.5)), elementVertices(s.element));
      const n1 = inside ? prismIndex : nMedium;
      const n2 = inside ? nMedium : prismIndex;
      const nRefr = refract(d, nrm, n1, n2);
      const angIn = deg(Math.acos(Math.min(1, Math.max(-1, -dot(d, nrm)))));
      if (!nRefr) {
        d = reflect(d, nrm);
        tir++;
        hits.push({
          x: surfHit.point.x, y: surfHit.point.y, elementId: s.elementId,
          kind: 'tir', angleIn: angIn, angleOut: angIn, n1, n2
        });
      } else {
        d = nRefr;
        refractions++;
        hits.push({
          x: surfHit.point.x, y: surfHit.point.y, elementId: s.elementId,
          kind: 'refract', angleIn: angIn,
          angleOut: deg(Math.acos(Math.min(1, Math.max(-1, -dot(d, nrm))))),
          n1, n2
        });
      }
      p = add(surfHit.point, mul(d, 1e-6));
      continue;
    }
  }

  return { points, hits, bounces, refractions, tir, ended, color: color.hex, nm: color.nm || 0 };
}

/** Kaynaklardan ışın demeti üretip hepsini izler. */
export function traceAll(state) {
  const surfaces = buildSurfaces(state);
  const paths = [];
  const stats = { kaynakIsin: 0, yolSayisi: 0, yansima: 0, kirilma: 0, sonlanma: 0, tir: 0 };
  const nMed = state.ortam?.n ?? ORTAMLAR.hava;
  let pid = 0;

  const ekle = (path) => {
    path.id = 'p' + (pid++);
    paths.push(path);
    stats.yansima += path.bounces;
    stats.kirilma += path.refractions;
    stats.tir += path.tir;
    if (path.ended === 'screen') stats.sonlanma++;
  };

  for (const el of state.elements) {
    if (el.visible === false) continue;
    const white = !el.wavelength || el.wavelength === 0;

    if (el.tip === 'pointSource') {
      const rayN = Math.max(1, Math.min(241, el.rays ?? 9));
      const spread = rad(el.spread ?? 60);
      const base = el.angle ?? 0;
      const cols = white
        ? [{ hex: '#ffffff', nm: 0 }]
        : [{ hex: el.color || wavelengthColor(el.wavelength), nm: el.wavelength }];
      for (let i = 0; i < rayN; i++) {
        const a = base - spread / 2 + (spread * i) / Math.max(1, rayN - 1);
        for (const c of cols) {
          stats.kaynakIsin++;
          ekle(traceRay({ x: el.x, y: el.y }, { x: Math.cos(a), y: Math.sin(a) }, state, surfaces, { color: c, nMedium: nMed }));
        }
      }
    } else if (el.tip === 'parallelSource') {
      const rayN = Math.max(1, Math.min(241, el.rays ?? 9));
      const L = el.length ?? 160;
      const half = L / 2;
      const a = el.angle ?? 0;
      const d = { x: Math.cos(a), y: Math.sin(a) };
      const perp = { x: -d.y, y: d.x };
      const cols = white
        ? SPEKTRUM.map((s) => ({ hex: wavelengthColor(s.nm), nm: s.nm }))
        : [{ hex: el.color || wavelengthColor(el.wavelength), nm: el.wavelength }];
      for (let i = 0; i < rayN; i++) {
        const off = rayN === 1 ? 0 : -half + (L * i) / (rayN - 1);
        const o = { x: el.x + perp.x * off, y: el.y + perp.y * off };
        for (const c of cols) {
          stats.kaynakIsin++;
          ekle(traceRay(o, d, state, surfaces, { color: c, nMedium: nMed }));
        }
      }
    }
  }
  stats.yolSayisi = paths.length;
  return { paths, stats };
}

export function getStats(paths) {
  const stats = { kaynakIsin: paths.length, yolSayisi: paths.length, yansima: 0, kirilma: 0, sonlanma: 0, tir: 0 };
  for (const p of paths) {
    stats.yansima += p.bounces || 0;
    stats.kirilma += p.refractions || 0;
    stats.tir += p.tir || 0;
    if (p.ended === 'screen') stats.sonlanma++;
  }
  return stats;
}

/** Yansıma açısı = gelme açısı doğruluğu (derece). */
export function hitFidelity(paths, tolerance = 0.5) {
  let maxSapma = 0, toplam = 0, adet = 0;
  for (const p of paths) {
    for (const h of p.hits || []) {
      if (h.kind !== 'mirror') continue;
      if (typeof h.angleIn !== 'number' || typeof h.angleOut !== 'number') continue;
      const s = Math.abs(h.angleIn - h.angleOut);
      maxSapma = Math.max(maxSapma, s);
      toplam += s; adet++;
    }
  }
  return { maxSapma, ortalamaSapma: adet ? toplam / adet : 0, tolerance };
}

/** Prizmada renklerin sapma açısı farkı (derece). */
export function prismDeviation(paths) {
  const byNm = new Map();
  for (const p of paths) {
    if (!p.nm) continue;
    if (!p.hits.some((h) => h.kind === 'refract')) continue;
    if (p.points.length < 3) continue;
    const a = angleOf(sub(p.points[1], p.points[0]));
    const b = angleOf(sub(p.points[p.points.length - 1], p.points[p.points.length - 2]));
    let dev = deg(a - b);
    while (dev > 180) dev -= 360;
    while (dev < -180) dev += 360;
    byNm.set(p.nm, Math.abs(dev));
  }
  if (byNm.size < 2) return null;
  const vals = [...byNm.values()];
  return {
    min: Math.min(...vals), max: Math.max(...vals),
    delta: Math.max(...vals) - Math.min(...vals),
    values: Object.fromEntries(byNm)
  };
}

export { criticalAngle, refract, reflect, rad, deg, len, sub, add, mul, dot, norm, rot, EPS };
