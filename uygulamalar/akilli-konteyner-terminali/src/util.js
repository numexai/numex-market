// Numex Liman — yardımcı fonksiyonlar (deterministik RNG dahil)

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function clamp(v, min, max) {
  return v < min ? min : v > max ? max : v;
}

export function lerp(a, b, t) {
  return a + (b - a) * clamp(t, 0, 1);
}

export function fmtTime(sec) {
  const s = Math.max(0, Math.round(sec));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return String(m).padStart(2, '0') + ':' + String(r).padStart(2, '0');
}

export function fmtPct(v) {
  return Math.round(clamp(v, 0, 1) * 100) + '%';
}

export function csvEscape(s) {
  const str = String(s == null ? '' : s);
  if (/[",;\n]/.test(str)) return '"' + str.replace(/"/g, '""') + '"';
  return str;
}

export function uid(prefix, n) {
  return prefix + '-' + String(n).padStart(4, '0');
}

export function pick(rng, arr) {
  return arr[Math.floor(rng() * arr.length) % arr.length];
}

export function round(v, d = 1) {
  const f = Math.pow(10, d);
  return Math.round(v * f) / f;
}
