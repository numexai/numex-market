/**
 * Numex Quantum Lab — Kompleks sayı aritmetiği.
 *
 * Tüm kuantum durumu z = a + bi olarak modellenir. Bu modül saf,
 * yan etkisiz (pure) fonksiyonlar içerir; hiçbir yerde Math.random yoktur.
 *
 * Gösterim: { re: number, im: number }
 */

/** Kompleks sayı üretir. */
export function c(re = 0, im = 0) {
  return { re, im };
}

export const ZERO = { re: 0, im: 0 };
export const ONE = { re: 1, im: 0 };
export const I = { re: 0, im: 1 };

/** Toplama: (a+bi) + (c+di) */
export function add(x, y) {
  return { re: x.re + y.re, im: x.im + y.im };
}

/** Çıkarma: (a+bi) - (c+di) */
export function sub(x, y) {
  return { re: x.re - y.re, im: x.im - y.im };
}

/** Çarpma: (a+bi)(c+di) = (ac-bd) + (ad+bc)i */
export function mul(x, y) {
  return {
    re: x.re * y.re - x.im * y.im,
    im: x.re * y.im + x.im * y.re,
  };
}

/**
 * Bölme: (a+bi)/(c+di) = ((ac+bd) + (bc-ad)i) / (c^2+d^2)
 * Sıfıra bölmede hata fırlatır (sessiz NaN üretmez).
 */
export function div(x, y) {
  const den = y.re * y.re + y.im * y.im;
  if (den === 0) throw new Error('Kompleks bölme: sıfıra bölme');
  return {
    re: (x.re * y.re + x.im * y.im) / den,
    im: (x.im * y.re - x.re * y.im) / den,
  };
}

/** Eşlenik (conjugate): (a+bi)* = a-bi */
export function conj(x) {
  return { re: x.re, im: -x.im };
}

/** Modül (mutlak değer): |a+bi| = sqrt(a^2+b^2) */
export function abs(x) {
  return Math.hypot(x.re, x.im);
}

/** Modülün karesi |z|^2 = a^2+b^2 — olasılık hesabında kullanılır. */
export function abs2(x) {
  return x.re * x.re + x.im * x.im;
}

/** Faz açısı (radyan): atan2(b, a) */
export function phase(x) {
  return Math.atan2(x.im, x.re);
}

/** Skaler çarpma. */
export function scale(x, k) {
  return { re: x.re * k, im: x.im * k };
}

/** e^(i*theta) = cos(theta) + i*sin(theta) — faz kapılarının temeli. */
export function expI(theta) {
  return { re: Math.cos(theta), im: Math.sin(theta) };
}

/** Yaklaşık eşitlik (test ve doğrulama kontrolü için). */
export function equals(x, y, eps = 1e-10) {
  return Math.abs(x.re - y.re) < eps && Math.abs(x.im - y.im) < eps;
}

/**
 * Okunabilir biçimlendirme: "0.7071+0.0000i", "0.5-0.8660i" ...
 * Küçük gürültüyü (|v| < 1e-10) sıfıra çeker ki ekranda "0.0000i" görünsün.
 */
export function format(x, digits = 4) {
  const eps = 1e-10;
  const re = Math.abs(x.re) < eps ? 0 : x.re;
  const im = Math.abs(x.im) < eps ? 0 : x.im;
  const sign = im < 0 ? '-' : '+';
  return `${re.toFixed(digits)}${sign}${Math.abs(im).toFixed(digits)}i`;
}
