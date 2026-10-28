/**
 * Numex Quantum Lab — Kuantum kapıları.
 *
 * Tüm kapılar 2x2 (tek qubit) veya 4x4 (iki qubit) kompleks üniter matrislerdir.
 * Matrisler kompleks obje ({re, im}) formatındadır — bkz. src/core/complex.js.
 *
 * Rx/Ry/Rz dışındaki tüm kapılar sabittir ve asla yeniden hesaplanmaz.
 */
import { kron } from './matrix.js';

const C = (re, im = 0) => ({ re, im });
const S2 = 1 / Math.SQRT2; // 1/sqrt(2) ≈ 0.7071067811865476

/* ------------------------------------------------------------------ */
/* Tek qubit kapıları                                                  */
/* ------------------------------------------------------------------ */

/** Pauli-X (NOT): |0> -> |1>, |1> -> |0> */
export const X = [
  [C(0), C(1)],
  [C(1), C(0)],
];

/** Pauli-Y: ısırgan i'li bit çevirme */
export const Y = [
  [C(0), C(0, -1)],
  [C(0, 1), C(0)],
];

/** Pauli-Z: |1> bileşenine -1 faz */
export const Z = [
  [C(1), C(0)],
  [C(0), C(-1)],
];

/** Hadamard: süperpozisyon üretir (H|0> = (|0>+|1>)/sqrt(2)) */
export const H = [
  [C(S2), C(S2)],
  [C(S2), C(-S2)],
];

/** S kapısı = sqrt(Z) — pi/2 faz */
export const S = [
  [C(1), C(0)],
  [C(0), C(0, 1)],
];

/** T kapısı = sqrt(S) — pi/4 faz */
export const T = [
  [C(1), C(0)],
  [C(0), C(Math.cos(Math.PI / 4), Math.sin(Math.PI / 4))],
];

/** Genel faz kapısı: diag(1, e^{i*theta}) */
export function phaseGate(theta) {
  return [
    [C(1), C(0)],
    [C(0), C(Math.cos(theta), Math.sin(theta))],
  ];
}

/** Rx(theta) = cos(t/2) I - i sin(t/2) X */
export function rx(theta) {
  const ct = Math.cos(theta / 2);
  const st = Math.sin(theta / 2);
  return [
    [C(ct), C(0, -st)],
    [C(0, -st), C(ct)],
  ];
}

/** Ry(theta) = cos(t/2) I - i sin(t/2) Y */
export function ry(theta) {
  const ct = Math.cos(theta / 2);
  const st = Math.sin(theta / 2);
  return [
    [C(ct), C(-st)],
    [C(st), C(ct)],
  ];
}

/**
 * Rz(theta) = e^{-i t/2} diag(1, e^{i t})
 * Global faz fiziksel olarak gözlenmez ama vektörü temsil ettiğimiz için korunur.
 */
export function rz(theta) {
  // e^{-i t/2} = cos(t/2) - i sin(t/2)
  const g = { re: Math.cos(theta / 2), im: -Math.sin(theta / 2) };
  // e^{+i t} = cos(t) + i sin(t)
  const p = { re: Math.cos(theta), im: Math.sin(theta) };
  // alt köşegen girdisi = e^{-i t/2} · e^{i t} = (g.re*p.re - g.im*p.im) + i(g.re*p.im + g.im*p.re)
  const ust = { re: g.re, im: g.im };
  const alt = {
    re: g.re * p.re - g.im * p.im,
    im: g.re * p.im + g.im * p.re,
  };
  return [
    [ust, C(0)],
    [C(0), alt],
  ];
}

/* ------------------------------------------------------------------ */
/* İki qubit kapıları                                                  */
/* ------------------------------------------------------------------ */

/**
 * CNOT (controlled-X): kontrol qubit 1 ise hedefe X uygular.
 * Basis sırası |kontrol, hedef>:
 *   |00>->|00>, |01>->|01>, |10>->|11>, |11>->|10>
 */
export const CNOT = [
  [C(1), C(0), C(0), C(0)],
  [C(0), C(1), C(0), C(0)],
  [C(0), C(0), C(0), C(1)],
  [C(0), C(0), C(1), C(0)],
];

/**
 * CZ (controlled-Z): kontrol 1 ise hedefe Z.
 * Diag(1, 1, 1, -1)
 */
export const CZ = [
  [C(1), C(0), C(0), C(0)],
  [C(0), C(1), C(0), C(0)],
  [C(0), C(0), C(1), C(0)],
  [C(0), C(0), C(0), C(-1)],
];

/**
 * SWAP: iki qubit'in durumunu değiş tokuş eder (simetrik, kontrol/hedef yok).
 * |01> <-> |10>
 */
export const SWAP = [
  [C(1), C(0), C(0), C(0)],
  [C(0), C(0), C(1), C(0)],
  [C(0), C(1), C(0), C(0)],
  [C(0), C(0), C(0), C(1)],
];

/**
 * Kontrollü-U: keyfi tek qubit üniterini kontrol qubit ile birleştirir.
 * C_U = |0><0| ⊗ I + |1><1| ⊗ U
 * CNOT = controlledGate(X); CZ = controlledGate(Z)
 */
export function controlledGate(U) {
  const z = C(0);
  const one = C(1);
  return [
    [one, z, z, z],
    [z, U[0][0], z, U[0][1]],
    [z, z, one, z],
    [z, U[1][0], z, U[1][1]],
  ];
}

/* ------------------------------------------------------------------ */
/* Registry — UI ve motor aynı tanımı kullanır                         */
/* ------------------------------------------------------------------ */

/**
 * Kapı kayıt tablosu.
 *  - arity: kaç qubit yer kaplar (1 veya 2)
 *  - matris: (opsiyonel) sabit matris
 *  - matrisUret: (opsiyonel) parametreli matris üretici
 *  - rolSabit: iki-qubit kapılarda kontrol/hedef rolü kullanıcı tarafından değiştirilebilir mi
 */
export const GATE_REGISTRY = {
  i: {
    label: 'I',
    name: 'Identity',
    arity: 1,
    description: 'Hiçbir şey yapmaz — referans/kimlik kapısı.',
    matris: [
      [C(1), C(0)],
      [C(0), C(1)],
    ],
  },
  x: { label: 'X', name: 'Pauli-X', arity: 1, description: 'Bit çevirme (NOT). |0>↔|1>', matris: X },
  y: { label: 'Y', name: 'Pauli-Y', arity: 1, description: 'Bit + faz çevirme.', matris: Y },
  z: { label: 'Z', name: 'Pauli-Z', arity: 1, description: '|1> bileşenine −1 faz.', matris: Z },
  h: { label: 'H', name: 'Hadamard', arity: 1, description: 'Süperpozisyon üretir.', matris: H },
  s: { label: 'S', name: 'S (√Z)', arity: 1, description: 'π/2 faz kapısı.', matris: S },
  t: { label: 'T', name: 'T (√S)', arity: 1, description: 'π/4 faz kapısı.', matris: T },
  rx: {
    label: 'Rx',
    name: 'Rotation-X',
    arity: 1,
    description: 'X ekseninde θ açısı kadar döndürme.',
    parametreli: true,
    varsayilanAci: Math.PI / 2,
    matrisUret: rx,
  },
  ry: {
    label: 'Ry',
    name: 'Rotation-Y',
    arity: 1,
    description: 'Y ekseninde θ açısı kadar döndürme.',
    parametreli: true,
    varsayilanAci: Math.PI / 2,
    matrisUret: ry,
  },
  rz: {
    label: 'Rz',
    name: 'Rotation-Z',
    arity: 1,
    description: 'Z ekseninde θ açısı kadar döndürme.',
    parametreli: true,
    varsayilanAci: Math.PI / 2,
    matrisUret: rz,
  },
  cnot: {
    label: 'CNOT',
    name: 'Controlled-NOT',
    arity: 2,
    description: 'Kontrol qubit 1 ise hedefe X uygular (dolanıklaştırıcı).',
    matris: CNOT,
    kontrollu: true,
  },
  cz: {
    label: 'CZ',
    name: 'Controlled-Z',
    arity: 2,
    description: 'Kontrol qubit 1 ise hedefe Z uygular.',
    matris: CZ,
    kontrollu: true,
  },
  swap: {
    label: 'SWAP',
    name: 'Swap',
    arity: 2,
    description: 'İki qubit durumunu yer değiştirir.',
    matris: SWAP,
    kontrollu: false,
  },
};

/** Bir kapının verilen parametreyle matrisini döndürür. */
export function gateMatrix(gateType, params = {}) {
  const spec = GATE_REGISTRY[gateType];
  if (!spec) throw new Error(`Bilinmeyen kapı türü: ${gateType}`);
  if (spec.matrisUret) {
    const theta = params.theta ?? spec.varsayilanAci ?? Math.PI / 2;
    return spec.matrisUret(theta);
  }
  return spec.matris;
}

/** Kapının kaç qubit yer kapladığı. */
export function gateArity(gateType) {
  const spec = GATE_REGISTRY[gateType];
  if (!spec) throw new Error(`Bilinmeyen kapı türü: ${gateType}`);
  return spec.arity;
}

/**
 * İki-qubit kapı matrisini, kontrol/hedef rolleri verilen qubit sırasına göre döndürür.
 *
 * ÖNEMLİ: Bir kapı iki qubit'e etki ederken matrisin tensör sırası
 * (yüksek qubit solda) ile bizim qubit indeksleme sıramız (q0 en solda = en anlamlı bit)
 * uyuşmalıdır. CNOT için bu ters çevirme hayati önemdedir:
 *   CNOT(q0=kontrol, q1=hedef) -> CNOT matrisinin kendisi
 *   CNOT(q1=kontrol, q0=hedef) -> X ⊗ P1 projeksiyonlu ters düzen
 *
 * Burada iki-qubit blok matrisini 4x4 olarak, İLGİLİ qubitlerin
 * (yuksekIndeks, dusukIndeks) sırasına göre inşa ederiz; sonra çağıran taraf
 * (simulator) bu bloğu tüm sisteme gömülür.
 */
export function twoQubitBlock(gateType, lowIsControl) {
  const mat = gateMatrix(gateType);
  if (gateType === 'swap') return mat; // simetrik, rol yok
  if (gateType === 'cnot') {
    // Varsayılan CNOT matrisi «yüksek indeks = kontrol, düşük indeks = hedef» sırasına göredir.
    return lowIsControl ? swapQubitRoles(mat) : mat;
  }
  if (gateType === 'cz') {
    return lowIsControl ? swapQubitRoles(mat) : mat;
  }
  return mat;
}

/**
 * 4x4 iki-qubit matrisini qubit rollerini yer değiştirerek yeniden yazar.
 * Basis sırası |a,b> -> |b,a> permütasyonu ile M' = P M P (P = SWAP).
 */
export function swapQubitRoles(M) {
  const P = SWAP;
  // P·M
  const PM = [
    [M[0][0], M[0][1], M[0][2], M[0][3]],
    [M[2][0], M[2][1], M[2][2], M[2][3]],
    [M[1][0], M[1][1], M[1][2], M[1][3]],
    [M[3][0], M[3][1], M[3][2], M[3][3]],
  ];
  // (P·M)·P
  return PM.map((row) => [row[0], row[2], row[1], row[3]]);
}

/** N-qubit sistemde tek qubit kapısının tam uzay matrisi (I ⊗ ... ⊗ U ⊗ ... ⊗ I). */
export function singleQubitFullMatrix(U, qubitIndex, nQubits) {
  const parts = [];
  for (let q = 0; q < nQubits; q++) {
    parts.push(q === qubitIndex ? U : [
      [C(1), C(0)],
      [C(0), C(1)],
    ]);
  }
  return kronAllParts(parts);
}

function kronAllParts(parts) {
  return parts.reduce((acc, m) => kron(acc, m));
}
