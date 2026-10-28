/**
 * Numex Quantum Lab — Durum vektörü simülatörü.
 *
 * Gerçek matematik:
 *   1) N qubit için durum vektörü boyutu 2^N'dir ve TÜM kompleks genlikler tutulur.
 *   2) Tek qubit kapısı: U' = I ⊗ ... ⊗ U ⊗ ... ⊗ I (tensör çarpımı) → matVec.
 *   3) İki qubit kapısı: ilgili iki indekse 4x4 blok matrisi gömülür → matVec.
 *   4) Norm her adımda |psi|^2 = 1 olarak korunur (üniter evrim).
 *
 * SAHTE RANDOM YOK: ölçüm, |genlik|^2 olasılık dağılımından
 * kümülatif dağılım fonksiyonu (CDF) tersine çevrilerek yapılır.
 * Aynı devre + aynı tohum (seed) → aynı sonuç (deterministik PRNG).
 */
import { abs2 } from './complex.js';
import { gateMatrix, gateArity, twoQubitBlock, singleQubitFullMatrix } from './gates.js';
import { matVec, identity } from './matrix.js';

/** Deterministik PRNG (mulberry32) — Math.random KULLANILMAZ. */
export function makeRng(seed = 42) {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** |0...0> durum vektörü (boyut 2^n). */
export function initialState(nQubits) {
  const dim = 1 << nQubits;
  const v = new Array(dim);
  for (let i = 0; i < dim; i++) v[i] = { re: 0, im: 0 };
  v[0] = { re: 1, im: 0 };
  return v;
}

/** nQubits sınır kontrolü (1..8 — 2^8 = 256 genlik). */
export function assertQubitCount(n) {
  if (!Number.isInteger(n) || n < 1 || n > 8) {
    throw new Error(`Geçersiz qubit sayısı: ${n} (1–8 arasında tam sayı olmalı)`);
  }
}

/** Bir qubit indeksinin bu sistemde geçerli olduğunu doğrular. */
export function assertQubitIndex(q, nQubits) {
  if (!Number.isInteger(q) || q < 0 || q >= nQubits) {
    throw new Error(`Geçersiz qubit indeksi: ${q} (0–${nQubits - 1} aralığında olmalı)`);
  }
}

/**
 * TEK QUBIT KAPISI UYGULA (tensör çarpımı yolu — açık ve kanıtlanabilir).
 * U tam uzay matrisi (2^n x 2^n) olarak kurulur ve vektöre uygulanır.
 * 8 qubit'te 256x256 = 65536 girdi; tarayıcıda sorunsuz.
 */
export function applySingleQubitGate(state, nQubits, qubitIndex, gateType, params = {}) {
  assertQubitIndex(qubitIndex, nQubits);
  const U = gateMatrix(gateType, params);
  const full = singleQubitFullMatrix(U, qubitIndex, nQubits);
  return matVec(full, state);
}

/**
 * İKİ QUBIT KAPISI UYGULA.
 *
 * Burada 4x4 blok matrisi tüm uzaya GÖMÜLÜR (embed). q1 < q2 olmak üzere,
 * blok matrisinin satır/sütun indeksi şu iki bitin (q1, q2) değeridir:
 *   blokSatir = b_q1 * 2 + b_q2
 * Yani blok matrisi «q1 yüksek bit, q2 düşük bit» sırasına göre yorumlanır.
 *
 * CNOT için iki seçenek:
 *   control < target  → CNOT matrisinin kendisi (|kontrol, hedef> sırası zaten uyumlu)
 *   control > target  → twoQubitBlock('cnot', lowIsControl=false) ile roller çevrilir
 *
 * Hedef durumdaki genlikleri YERİNDE değiştirir (kopyalama yok).
 */
export function applyTwoQubitGate(state, nQubits, q1, q2, gateType, opts = {}) {
  assertQubitIndex(q1, nQubits);
  assertQubitIndex(q2, nQubits);
  if (q1 === q2) throw new Error('İki-qubit kapısı aynı qubit üzerine uygulanamaz');

  const low = Math.min(q1, q2);
  const high = Math.max(q1, q2);
  const lowIsControl = opts.control === low;

  // Blok matrisi: satır indeksi (b_high * 2 + b_low)
  const block = twoQubitBlockEmbedded(gateType, lowIsControl);

  const dim = 1 << nQubits;
  const out = new Array(dim);

  for (let i = 0; i < dim; i++) {
    const bHigh = (i >> (nQubits - 1 - high)) & 1;
    const bLow = (i >> (nQubits - 1 - low)) & 1;
    const rowIdx = bHigh * 2 + bLow;
    const row = block[rowIdx];

    let re = 0;
    let im = 0;
    for (let k = 0; k < 4; k++) {
      const bHighK = k >> 1;
      const bLowK = k & 1;
      // Hedef indeks: high ve low bitleri k ile, diğer bitler i ile aynı
      let j = i;
      j = setBit(j, nQubits - 1 - high, bHighK);
      j = setBit(j, nQubits - 1 - low, bLowK);

      const amp = state[j];
      if (amp.re === 0 && amp.im === 0) continue;
      const m = row[k];
      re += m.re * amp.re - m.im * amp.im;
      im += m.re * amp.im + m.im * amp.re;
    }
    out[i] = { re, im };
  }
  return out;
}

function setBit(value, bitPos, bitValue) {
  const mask = 1 << bitPos;
  return bitValue ? value | mask : value & ~mask;
}

/**
 * 4x4 blok matrisini, «yüksek indeks = yüksek bit, düşük indeks = düşük bit»
 * sırasına göre döndürür.
 *
 * CNOT/CZ varsayılan matrisleri |kontrol, hedef> sırasına göre yazılıdır ve
 * kontrol ilk (yüksek) konumdur. Eğer kontrol qubit düşük indeksliyse
 * rolleri çevirmemiz gerekir.
 */
function twoQubitBlockEmbedded(gateType, lowIsControl) {
  const M = gateMatrix(gateType);
  if (gateType === 'swap') return M;
  // Varsayılan sıra: ilk konum (yüksek bit) = kontrol, ikinci konum (düşük bit) = hedef.
  if (!lowIsControl) return M;
  // Kontrol düşük bittiyse: basis permütasyonu P·M·P
  return permuteQubits(M);
}

function permuteQubits(M) {
  // P = SWAP matrisi; M' = P·M·P
  const swapRows = (mat) => [
    mat[0],
    mat[2],
    mat[1],
    mat[3],
  ];
  const swapCols = (mat) =>
    mat.map((row) => [row[0], row[2], row[1], row[3]]);
  return swapCols(swapRows(M));
}

/**
 * TÜM DEVREYİ ÇALIŞTIR.
 *
 * @param {object} circuit { nQubits, columns: [{ gates: [{type, qubits, params}] }] }
 *   veya { nQubits, operations: [{type, qubits, params}] }
 * @param {object} opts { seed, shots }
 * @returns {object} { state, nQubits, norm, steps, measurements }
 */
export function runCircuit(circuit, opts = {}) {
  const nQubits = circuit.nQubits ?? circuit.qubitCount;
  assertQubitCount(nQubits);

  const ops = flattenOperations(circuit);
  let state = initialState(nQubits);
  const steps = [];

  for (const op of ops) {
    const t0 = performanceNow();
    state = applyOperation(state, nQubits, op);
    steps.push({
      type: op.type,
      qubits: op.qubits,
      params: op.params ?? {},
      norm: normOf(state),
      ms: performanceNow() - t0,
    });
  }

  // Ölçümler en sonda toplu yapılır (devre ölçümleri opsiyonel — istatistik için)
  const measurements = countMeasurementOps(ops);
  let histogram = null;
  if (opts.shots > 0) {
    histogram = sampleHistogram(state, nQubits, opts.shots, opts.seed ?? 42);
  }

  return {
    state,
    nQubits,
    norm: normOf(state),
    steps,
    operationCount: ops.length,
    gateCount: ops.filter((o) => o.type !== 'measure').length,
    measurementCount: measurements,
    histogram,
  };
}

function performanceNow() {
  return typeof performance !== 'undefined' ? performance.now() : Date.now();
}

function applyOperation(state, nQubits, op) {
  const arity = op.type === 'measure' ? 0 : gateArity(op.type);
  if (arity === 1) {
    return applySingleQubitGate(state, nQubits, op.qubits[0], op.type, op.params ?? {});
  }
  if (arity === 2) {
    return applyTwoQubitGate(state, nQubits, op.qubits[0], op.qubits[1], op.type, {
      control: op.control ?? op.qubits[0],
    });
  }
  // ölçüm — durumu değiştirmez (sonunda toplu örnekleme yapılır)
  return state;
}

function countMeasurementOps(ops) {
  return ops.filter((o) => o.type === 'measure').length;
}

/** Devre girdisini düz operasyon listesine çevirir (columns veya operations). */
export function flattenOperations(circuit) {
  if (circuit.operations) return circuit.operations;
  if (circuit.columns) {
    const ops = [];
    // Sütunlar sıralıdır; aynı sütundaki kapılar kuramsal olarak komütatiftir
    // (farklı qubitlere etki ederler).
    for (const col of circuit.columns) {
      for (const g of col.gates ?? []) ops.push(g);
    }
    return ops;
  }
  return [];
}

/** Durum vektörünün normunu hesaplar: sqrt(sum |amp|^2). */
export function normOf(state) {
  let sum = 0;
  for (const a of state) sum += abs2(a);
  return Math.sqrt(sum);
}

/** Toplam olasılık (norm'un karesi) — 1.0 olmalı. */
export function totalProbability(state) {
  let sum = 0;
  for (const a of state) sum += abs2(a);
  return sum;
}

/** Tek bir basis state indeksinin olasılığı. */
export function probabilityOf(state, index) {
  return abs2(state[index]);
}

/**
 * Ölçüm: |amp|^2 dağılımından CDF ile örnekleme.
 * Rastgelelik TAMAMEN |genlik|^2 dağılımından gelir — başka hiçbir yerden değil.
 */
export function sampleHistogram(state, nQubits, shots, seed = 42) {
  const dim = 1 << nQubits;
  const probs = new Array(dim);
  const cumulative = new Array(dim);
  let acc = 0;
  for (let i = 0; i < dim; i++) {
    probs[i] = abs2(state[i]);
    acc += probs[i];
    cumulative[i] = acc;
  }

  const counts = new Array(dim).fill(0);
  const rng = makeRng(seed);
  for (let s = 0; s < shots; s++) {
    const r = rng() * acc;
    // binary search
    let lo = 0;
    let hi = dim - 1;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (cumulative[mid] < r) lo = mid + 1;
      else hi = mid;
    }
    counts[lo]++;
  }

  return {
    counts,
    shots,
    probabilities: probs,
    labels: Array.from({ length: dim }, (_, i) => basisLabel(i, nQubits)),
  };
}

/** İndeks → bit dizisi etiketi: 5 (3 qubit) -> "101" */
export function basisLabel(index, nQubits) {
  return index.toString(2).padStart(nQubits, '0');
}

/**
 * Durum vektörünü okunabilir satırlara dönüştürür.
 * Sıfır olmayan genlikler öne çıkar (olasılık > esik).
 */
export function stateRows(state, nQubits, esik = 1e-12) {
  const rows = [];
  for (let i = 0; i < state.length; i++) {
    const p = abs2(state[i]);
    if (p < esik) continue;
    rows.push({
      index: i,
      label: `|${basisLabel(i, nQubits)}>`,
      amplitude: state[i],
      probability: p,
    });
  }
  return rows;
}
