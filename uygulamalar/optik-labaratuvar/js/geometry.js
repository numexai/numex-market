// NUMEX PRİZMA — geometry.js
// Saf 2B geometri: vektörler, ışın/kesişim, eleman yüzeyleri.
// DOM yok, yan etki yok.

export const EPS = 1e-9;

export const vec = (x, y) => ({ x, y });
export const add = (a, b) => ({ x: a.x + b.x, y: a.y + b.y });
export const sub = (a, b) => ({ x: a.x - b.x, y: a.y - b.y });
export const mul = (v, s) => ({ x: v.x * s, y: v.y * s });
export const dot = (a, b) => a.x * b.x + a.y * b.y;
export const cross = (a, b) => a.x * b.y - a.y * b.x;
export const len = (v) => Math.hypot(v.x, v.y);

export function norm(v) {
  const l = Math.hypot(v.x, v.y);
  if (l < 1e-12) return { x: 0, y: 0 };
  return { x: v.x / l, y: v.y / l };
}

export function rot(v, rad) {
  const c = Math.cos(rad), s = Math.sin(rad);
  return { x: v.x * c - v.y * s, y: v.x * s + v.y * c };
}

export const angleOf = (v) => Math.atan2(v.y, v.x);

/** İki vektör arasındaki dar açı (0..PI), yönden bağımsız. */
export function angleBetween(a, b) {
  const na = norm(a), nb = norm(b);
  const d = Math.min(1, Math.max(-1, dot(na, nb)));
  return Math.acos(d);
}

export const deg = (rad) => (rad * 180) / Math.PI;
export const rad = (d) => (d * Math.PI) / 180;

/** Ayna yansıması: d - 2*(d·n)*n ; n birim olmalı. */
export function reflect(dir, normal) {
  const n = norm(normal);
  const d = dot(dir, n);
  return norm({ x: dir.x - 2 * d * n.x, y: dir.y - 2 * d * n.y });
}

/**
 * Snell kırılması. n yüzey normali (gelen ışığa BAKAN taraf, dot(dir,n)<0).
 * Tam iç yansımada null döner.
 */
export function refract(dir, normal, n1, n2) {
  const d = norm(dir);
  let n = norm(normal);
  let eta = n1 / n2;
  let cosI = -dot(d, n);
  if (cosI < 0) { // normal ters yöndeyse çevir
    n = mul(n, -1);
    cosI = -dot(d, n);
  }
  const sin2T = eta * eta * (1 - cosI * cosI);
  if (sin2T > 1) return null; // tam iç yansıma
  const cosT = Math.sqrt(Math.max(0, 1 - sin2T));
  return norm({
    x: eta * d.x + (eta * cosI - cosT) * n.x,
    y: eta * d.y + (eta * cosI - cosT) * n.y
  });
}

/** Kritik açı (radyan). n1<=n2 ise null. */
export function criticalAngle(n1, n2) {
  if (!(n1 > 0) || !(n2 > 0) || n1 <= n2) return null;
  return Math.asin(n2 / n1);
}

export function closestPointOnSegment(p, a, b, { clamp = true } = {}) {
  const ab = sub(b, a);
  const l2 = dot(ab, ab);
  if (l2 < 1e-12) return { x: a.x, y: a.y };
  let t = dot(sub(p, a), ab) / l2;
  if (clamp) t = Math.min(1, Math.max(0, t));
  return { x: a.x + ab.x * t, y: a.y + ab.y * t };
}

export function closestPointOnRay(p, origin, dir) {
  const d = norm(dir);
  const t = dot(sub(p, origin), d);
  return { t, point: { x: origin.x + d.x * t, y: origin.y + d.y * t } };
}

export function distancePointToSegment(p, a, b) {
  const c = closestPointOnSegment(p, a, b);
  return Math.hypot(p.x - c.x, p.y - c.y);
}

/**
 * Işın–segment kesişimi.
 * Dönüş: {t, point, normal, s} | null  — s: segment parametresi 0..1
 */
export function raySegmentHit(origin, dir, a, b) {
  const d = dir;
  const e = sub(b, a);
  const den = cross(d, e);
  if (Math.abs(den) < 1e-12) return null; // paralel
  const diff = sub(a, origin);
  const t = cross(diff, e) / den;
  const s = cross(diff, d) / den;
  if (t < EPS || s < -1e-9 || s > 1 + 1e-9) return null;
  const point = { x: origin.x + d.x * t, y: origin.y + d.y * t };
  // segment normali
  let n = norm({ x: e.y, y: -e.x });
  if (dot(d, n) > 0) n = mul(n, -1); // ışığa bakan taraf
  return { t, point, normal: n, s };
}

/** Işın–daire kesişimi (en yakın pozitif kök). */
export function rayCircleHit(origin, dir, center, radius) {
  const oc = sub(origin, center);
  const d = norm(dir);
  const b = dot(oc, d);
  const c = dot(oc, oc) - radius * radius;
  const disc = b * b - c;
  if (disc < 0) return null;
  const sq = Math.sqrt(disc);
  let t = -b - sq;
  if (t < EPS) t = -b + sq;
  if (t < EPS) return null;
  const point = { x: origin.x + d.x * t, y: origin.y + d.y * t };
  let n = norm(sub(point, center));
  if (dot(d, n) > 0) n = mul(n, -1);
  return { t, point, normal: n };
}

/** Işın–sonsuz çizgi (p noktası, d yönü) kesişimi. */
export function rayLineHit(origin, dir, p, dLine) {
  const den = cross(dir, dLine);
  if (Math.abs(den) < 1e-12) return null;
  // NUMEX-DÜZELTME (2026-11-19): rayLineHit'te pay orijine göre alınmıyordu: cross(dir, dLine) yerine cross(diff, dir) olmalı. Bu yüzden origin'den geçen doğruya paralel olmayan ışınlar bile 'paralel' sayılıp null dönüyordu ve mercek kesişimi hiç bulunamıyordu.
  // NUMEX-DÜZELTME: pay orijine göre alınmıyordu (origin hesaba katılmıyordu).
  const diff = sub(p, origin);
  const t = cross(diff, dir) / den;
  if (t < EPS) return null;
  return { t, point: { x: origin.x + dir.x * t, y: origin.y + dir.y * t } };
}

export function segmentBoundingBox(a, b) {
  return {
    minX: Math.min(a.x, b.x), minY: Math.min(a.y, b.y),
    maxX: Math.max(a.x, b.x), maxY: Math.max(a.y, b.y)
  };
}

export function pointInPolygon(p, pts) {
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const xi = pts[i].x, yi = pts[i].y, xj = pts[j].x, yj = pts[j].y;
    const intersect = ((yi > p.y) !== (yj > p.y)) &&
      (p.x < ((xj - xi) * (p.y - yi)) / (yj - yi + 1e-18) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

/** Elemanın yerel noktasını dünya koordinatına çevirir. */
export function transformPoint(p, el) {
  const r = rot(p, el.angle || 0);
  return { x: el.x + r.x, y: el.y + r.y };
}

/** Yerel eksenden dünya yönüne döndürme. */
export function transformDir(v, el) {
  return rot(v, el.angle || 0);
}

const clampArc = (val) => Math.min(1, Math.max(-1, val));

/**
 * Elemanın dünya koordinatlı köşe/örnek noktaları.
 * Eğri aynalarda yay polyline'ı döner.
 */
export function elementVertices(el) {
  const L = el.length ?? 180;
  const half = L / 2;
  const local = [];
  switch (el.tip) {
    case 'planeMirror':
    case 'screen':
    case 'wall':
      local.push({ x: -half, y: 0 }, { x: half, y: 0 });
      break;
    case 'concaveMirror':
    case 'convexMirror': {
      const R = Math.abs(el.radius ?? 200);
      const h = Math.min(half, R * 0.98);
      const alpha = Math.asin(clampArc(h / R));
      const sign = el.tip === 'concaveMirror' ? 1 : -1;
      const N = 24;
      for (let i = 0; i <= N; i++) {
        const a = -alpha + (2 * alpha * i) / N;
        // merkez (0, sign*R) → yay noktası
        local.push({ x: R * Math.sin(a), y: sign * R - sign * R * Math.cos(a) });
      }
      break;
    }
    case 'convergingLens':
    case 'divergingLens':
      local.push({ x: 0, y: -(el.size ?? 160) / 2 }, { x: 0, y: (el.size ?? 160) / 2 });
      break;
    case 'prism': {
      const size = el.size ?? 160;
      const apex = rad(el.apex ?? 60);
      const base = 2 * size * Math.sin(apex / 2);
      const height = size * Math.cos(apex / 2);
      local.push({ x: 0, y: -height * 0.66 }, { x: base / 2, y: height * 0.34 }, { x: -base / 2, y: height * 0.34 });
      break;
    }
    case 'pointSource':
    case 'parallelSource':
      local.push({ x: 0, y: 0 });
      break;
    default:
      local.push({ x: -half, y: 0 }, { x: half, y: 0 });
  }
  return local.map((p) => transformPoint(p, el));
}

/** Poligonal elemanın dünya kenar listesi: [{a,b}] */
export function elementEdges(el) {
  if (el.tip === 'pointSource' || el.tip === 'parallelSource') return [];
  if (el.tip === 'convergingLens' || el.tip === 'divergingLens') return []; // mercek özel işlenir
  const v = elementVertices(el);
  if (v.length === 2) return [{ a: v[0], b: v[1] }];
  const edges = [];
  const closed = el.tip === 'prism';
  const n = closed ? v.length : v.length - 1;
  for (let i = 0; i < n; i++) edges.push({ a: v[i], b: v[(i + 1) % v.length] });
  return edges;
}
