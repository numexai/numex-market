/**
 * Numex Quantum Lab — Matris ve vektör işlemleri.
 *
 * Matris gösterimi: satır-major iç içe dizi (number[re/im] DEĞİL, komplex obje).
 *   M[r][c] = { re, im }
 *
 * Tüm işlemler gerçek kompleks çarpma/toplama üzerinden gider.
 */

/** m x n sıfır matrisi. */
export function zeros(rows, cols) {
  return Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => ({ re: 0, im: 0 }))
  );
}

/** Birim matris (identity). */
export function identity(n) {
  const m = zeros(n, n);
  for (let i = 0; i < n; i++) m[i][i] = { re: 1, im: 0 };
  return m;
}

/**
 * Matris çarpımı A·B (kompleks).
 * Klasik üçlü döngü — karmaşıklık O(n^3).
 */
export function matMul(A, B) {
  const n = A.length;
  const k = B.length;
  const m = B[0].length;
  if (A[0].length !== k) {
    throw new Error(`Matris boyutu uyumsuz: A(${n}x${A[0].length}) · B(${k}x${m})`);
  }
  const out = zeros(n, m);
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < m; j++) {
      let re = 0;
      let im = 0;
      for (let p = 0; p < k; p++) {
        const a = A[i][p];
        const b = B[p][j];
        // (a.re + a.im i)(b.re + b.im i)
        re += a.re * b.re - a.im * b.im;
        im += a.re * b.im + a.im * b.re;
      }
      out[i][j] = { re, im };
    }
  }
  return out;
}

/**
 * Matris · vektör çarpımı (kompleks).
 * Kuantum kapısı uygulamanın çekirdeği: |psi'> = U |psi>.
 */
export function matVec(A, v) {
  const n = A.length;
  if (A[0].length !== v.length) {
    throw new Error(`Matris-vektör boyutu uyumsuz: A(${n}x${A[0].length}) · v(${v.length})`);
  }
  const out = new Array(n);
  for (let i = 0; i < n; i++) {
    let re = 0;
    let im = 0;
    const row = A[i];
    for (let j = 0; j < row.length; j++) {
      const a = row[j];
      const b = v[j];
      re += a.re * b.re - a.im * b.im;
      im += a.re * b.im + a.im * b.re;
    }
    out[i] = { re, im };
  }
  return out;
}

/**
 * Tensör (Kronecker) çarpımı A ⊗ B.
 * Çok qubit'li sistemlerin kapı matrislerini kurmanın yolu.
 * boyut(A⊗B) = (rA*rB) x (cA*cB)
 */
export function kron(A, B) {
  const rA = A.length;
  const cA = A[0].length;
  const rB = B.length;
  const cB = B[0].length;
  const out = zeros(rA * rB, cA * cB);
  for (let i = 0; i < rA; i++) {
    for (let j = 0; j < cA; j++) {
      const a = A[i][j];
      for (let k = 0; k < rB; k++) {
        for (let l = 0; l < cB; l++) {
          const b = B[k][l];
          out[i * rB + k][j * cB + l] = {
            re: a.re * b.re - a.im * b.im,
            im: a.re * b.im + a.im * b.re,
          };
        }
      }
    }
  }
  return out;
}

/** Bir dizi matrisin tensör çarpımı: A ⊗ B ⊗ C ⊗ ... */
export function kronAll(mats) {
  if (!mats.length) throw new Error('kronAll: boş matris listesi');
  return mats.reduce((acc, m) => kron(acc, m));
}

/** Matrisin eşlenik devriği (dagger) — üniterlik testi için. */
export function dagger(A) {
  const r = A.length;
  const c = A[0].length;
  const out = zeros(c, r);
  for (let i = 0; i < r; i++) {
    for (let j = 0; j < c; j++) {
      out[j][i] = { re: A[i][j].re, im: -A[i][j].im };
    }
  }
  return out;
}

/** İki matris yaklaşık eşit mi? */
export function matEquals(A, B, eps = 1e-10) {
  if (A.length !== B.length || A[0].length !== B[0].length) return false;
  for (let i = 0; i < A.length; i++) {
    for (let j = 0; j < A[0].length; j++) {
      if (Math.abs(A[i][j].re - B[i][j].re) > eps) return false;
      if (Math.abs(A[i][j].im - B[i][j].im) > eps) return false;
    }
  }
  return true;
}
