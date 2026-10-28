// Dream City — ortak yardımcılar
// Tohumlu rastgelelik: her açılışta AYNI şehir doğsun (güzel olduğu için sabitledik).

export function tohumluRastgele(tohum = 1337) {
  let s = tohum >>> 0;
  return function () {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const rast = tohumluRastgele(20261027);

export const aralik = (a, b) => a + rast() * (b - a);
export const sec = (dizi) => dizi[Math.floor(rast() * dizi.length)];
export const sans = (p) => rast() < p;
export const kis = (v, a, b) => Math.min(b, Math.max(a, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const yumusak = (t) => t * t * (3 - 2 * t);

// Renk tonlarını HSL'den Three.js rengine
import * as THREE from '../vendor/three.module.js';

export function hsl(h, s, l) {
  const c = new THREE.Color();
  c.setHSL((h % 360) / 360, s, l, THREE.SRGBColorSpace);
  return c;
}

export function renkKaris(hedef, kaynak, t) {
  hedef.r += (kaynak.r - hedef.r) * t;
  hedef.g += (kaynak.g - hedef.g) * t;
  hedef.b += (kaynak.b - hedef.b) * t;
  return hedef;
}

export function sikistir(renk, t) {
  return new THREE.Color(renk).lerp(new THREE.Color(renk), t);
}

export function yuvarlak(x, adim = 1) {
  return Math.round(x / adim) * adim;
}
