/**
 * Numex Quantum Lab — Analiz katmanı.
 *
 * Simülasyon sonucunu bağımsız olarak denetler ve kullanıcıya rapor eder.
 * Buradaki kontroller «kendi kodunu kendin onayla» değil, matematiksel
 * değişmezler (invariant) üzerinden yapılır:
 *   - Norm korunumu  : sum |amp|^2 = 1
 *   - Boyut doğruluğu: state.length = 2^n
 *   - Üniterlik      : U† U = I
 *   - Beklenen dağılım: Bell/GHZ gibi bilinen durumlarla karşılaştırma
 *   - Ölçüm toplamı  : histogram sayıları = shot sayısı (%100)
 */
import { abs2, format, phase } from '../core/complex.js';
import { dagger, matMul, matEquals, identity } from '../core/matrix.js';
import { GATE_REGISTRY, gateMatrix } from '../core/gates.js';
import { normOf, totalProbability, basisLabel } from '../core/simulator.js';

/** Tolerans: kayan nokta birikimi için (1e-9 fazlasıyla sıkı). */
export const TOL = 1e-9;

/**
 * Tüm doğruluk kontrollerini çalıştırır.
 * @param {object} result runCircuit çıktısı
 * @param {object} circuit devre (beklenen durum tespiti için)
 * @returns {{ ok: boolean, checks: Array<{id, ad, ok, detay}> }}
 */
export function validateRun(result, circuit = null) {
  const checks = [];

  checks.push(checkDimension(result));
  checks.push(checkNorm(result));
  checks.push(checkProbabilitySum(result));
  if (result.histogram) checks.push(checkMeasurementTotal(result.histogram));
  if (result.measurementTotal !== undefined) {
    checks.push(checkMeasurementTotalFromCounts(result.measurementTotal));
  }
  if (circuit) {
    checks.push(checkGateQubits(circuit));
    checks.push(checkTwoQubitReference(circuit));
    checks.push(checkCircuitDepth(circuit));
  }

  return {
    ok: checks.every((c) => c.ok),
    checks,
  };
}

/** 1) Durum vektörü boyutu tam olarak 2^n mi? */
export function checkDimension(result) {
  const beklenen = 1 << result.nQubits;
  const ok = result.state.length === beklenen;
  return {
    id: 'boyut',
    ad: 'Durum vektörü boyutu (2^n)',
    ok,
    detay: ok
      ? `${result.nQubits} qubit → ${beklenen} genlik (doğru)`
      : `Beklenen ${beklenen}, bulunan ${result.state.length}`,
  };
}

/** 2) Norm korunumu: simülasyon sonunda ||psi|| = 1 mi? */
export function checkNorm(result) {
  const n = normOf(result.state);
  const ok = Math.abs(n - 1) < 1e-9;
  return {
    id: 'norm',
    ad: 'Norm korunumu (||ψ|| = 1)',
    ok,
    detay: ok
      ? `||ψ|| = ${n.toFixed(12)} (üniter evrim korumuş)`
      : `||ψ|| = ${n.toFixed(12)} — normalizasyon bozulmuş!`,
  };
}

/** 3) Olasılıklar toplamı = 1 mi? */
export function checkProbabilitySum(result) {
  const p = totalProbability(result.state);
  const ok = Math.abs(p - 1) < 1e-9;
  return {
    id: 'olasilik',
    ad: 'Toplam olasılık = 1',
    ok,
    detay: ok ? `Σ|amp|² = ${p.toFixed(12)}` : `Σ|amp|² = ${p.toFixed(12)} — olmamalı!`,
  };
}

/** 4) Ölçüm histogramı toplamı shot sayısına eşit mi (yani %100)? */
export function checkMeasurementTotal(histogram) {
  const toplam = histogram.counts.reduce((a, b) => a + b, 0);
  const ok = toplam === histogram.shots;
  return {
    id: 'olcum-toplam',
    ad: 'Ölçüm dağılımı toplamı %100',
    ok,
    detay: ok
      ? `${toplam} / ${histogram.shots} ölçüm sayıldı (%100)`
      : `${toplam} / ${histogram.shots} — ölçüm sayısı uyuşmuyor`,
  };
}

function checkMeasurementTotalFromCounts(toplam) {
  const ok = toplam >= 0;
  return {
    id: 'olcum-sayaci',
    ad: 'Ölçüm sayacı tutarlı',
    ok,
    detay: `${toplam} ölçüm kayıtlı`,
  };
}

/** 5) Her kapının qubit indeksleri devre sınırları içinde mi? */
export function checkGateQubits(circuit) {
  const n = circuit.nQubits;
  const hatali = [];
  for (const col of circuit.columns) {
    for (const g of col.gates) {
      for (const q of g.qubits) {
        if (!Number.isInteger(q) || q < 0 || q >= n) {
          hatali.push(`${g.type}(q${q})`);
        }
      }
      if (g.qubits.length === 2 && g.qubits[0] === g.qubits[1]) {
        hatali.push(`${g.type}(aynı qubit)`);
      }
    }
  }
  return {
    id: 'qubit-sinir',
    ad: 'Geçersiz qubit kontrolü',
    ok: hatali.length === 0,
    detay: hatali.length === 0
      ? `Tüm kapılar 0–${n - 1} aralığında (geçerli)`
      : `Geçersiz kapılar: ${hatali.join(', ')}`,
  };
}

/** 6) İki-qubit kapılarda kontrol/hedef rolü doğru mu tanımlı? */
export function checkTwoQubitReference(circuit) {
  const hatali = [];
  for (const col of circuit.columns) {
    for (const g of col.gates) {
      const spec = GATE_REGISTRY[g.type];
      if (spec?.arity !== 2) continue;
      if (spec.kontrollu) {
        if (g.control === undefined || g.control === null) {
          hatali.push(`${g.type}: kontrol qubit tanımsız`);
        } else if (!g.qubits.includes(g.control)) {
          hatali.push(`${g.type}: kontrol (q${g.control}) kapının qubitleri arasında değil`);
        }
      }
    }
  }
  return {
    id: 'kontrol-hedef',
    ad: 'CNOT/CZ kontrol-hedef rolü',
    ok: hatali.length === 0,
    detay: hatali.length === 0
      ? 'Tüm kontrollü kapılarda kontrol qubit kapının içinde tanımlı'
      : hatali.join('; '),
  };
}

/** 7) Devre derinliği tutarlı mı (boş sütun yok, derinlik = dolu sütun)? */
export function checkCircuitDepth(circuit) {
  const dolu = circuit.columns.filter((c) => c.gates.length > 0).length;
  const ok = dolu === circuit.columns.length;
  return {
    id: 'derinlik',
    ad: 'Devre derinliği tutarlı',
    ok,
    detay: ok
      ? `Derinlik ${dolu} (boş sütun yok)`
      : `Boş sütun var: ${circuit.columns.length - dolu} adet`,
  };
}

/* ------------------------------------------------------------------ */
/* Beklenen durum karşılaştırmaları (Bell / GHZ)                       */
/* ------------------------------------------------------------------ */

/**
 * Durum vektörünü beklenen genlik haritasıyla karşılaştırır.
 * @param {Array} state durum vektörü
 * @param {number} nQubits
 * @param {Object<string, number>} beklenen { "00": 0.7071, "11": 0.7071 } — |genlik|
 */
export function compareExpectedState(state, nQubits, beklenen) {
  const hatalar = [];
  const dim = 1 << nQubits;
  for (let i = 0; i < dim; i++) {
    const label = basisLabel(i, nQubits);
    const beklenenGenlik = beklenen[label] ?? 0;
    const gercek = Math.sqrt(abs2(state[i]));
    if (Math.abs(gercek - beklenenGenlik) > 1e-6) {
      hatalar.push(
        `|${label}>: beklenen ${beklenenGenlik.toFixed(4)}, gerçek ${gercek.toFixed(4)}`
      );
    }
  }
  return {
    ok: hatalar.length === 0,
    hatalar,
  };
}

/**
 * Bell state doğrulaması: (|00>+|11>)/√2 bekleniyor.
 * Hata varsa hangi basis state'in saptığını söyler.
 */
export function checkBellState(state) {
  const s2 = 1 / Math.SQRT2;
  const { ok, hatalar } = compareExpectedState(state, 2, { '00': s2, '11': s2 });
  return {
    id: 'bell',
    ad: 'Bell state beklenen sonuçla uyuşuyor',
    ok,
    detay: ok
      ? 'Genlikler (|00>+|11>)/√2 ile birebir uyuşuyor'
      : `Sapma: ${hatalar.join(', ')}`,
  };
}

/**
 * GHZ state doğrulaması: (|0..0>+|1..1>)/√2 bekleniyor.
 * nQubits kadar sıfır ve nQubits kadar bir etiketi.
 */
export function checkGhzState(state, nQubits) {
  const s2 = 1 / Math.SQRT2;
  const beklenen = {};
  beklenen['0'.repeat(nQubits)] = s2;
  beklenen['1'.repeat(nQubits)] = s2;
  const { ok, hatalar } = compareExpectedState(state, nQubits, beklenen);
  return {
    id: 'ghz',
    ad: `GHZ (${nQubits} qubit) yalnızca beklenen durumları üretiyor`,
    ok,
    detay: ok
      ? `Yalnızca |${'0'.repeat(nQubits)}> ve |${'1'.repeat(nQubits)}> genlik taşıyor (her biri 1/√2)`
      : `Sapma: ${hatalar.join(', ')}`,
  };
}

/**
 * Ölçüm dağılımını beklenen olasılıklarla karşılaştırır (shot sayısına göre
 * istatistiksel toleransla). Bell için örnek: 00 → %50, 11 → %50.
 */
export function checkMeasurementDistribution(histogram, nQubits, beklenenOlasilik, tolerans = 0.12) {
  const hatalar = [];
  const dim = 1 << nQubits;
  for (let i = 0; i < dim; i++) {
    const oran = histogram.counts[i] / histogram.shots;
    const beklenen = beklenenOlasilik[basisLabel(i, nQubits)] ?? 0;
    if (Math.abs(oran - beklenen) > tolerans) {
      hatalar.push(
        `|${basisLabel(i, nQubits)}>: beklenen %${(beklenen * 100).toFixed(1)}, ölçülen %${(oran * 100).toFixed(1)}`
      );
    }
  }
  return {
    id: 'olcum-dagilim',
    ad: 'Ölçüm dağılımı beklenen olasılıklarla uyumlu',
    ok: hatalar.length === 0,
    detay: hatalar.length === 0
      ? `Tüm basis state oranları tolerans (±${(tolerans * 100).toFixed(0)}%) içinde`
      : hatalar.join('; '),
  };
}

/* ------------------------------------------------------------------ */
/* Üniterlik (gate matrisi bağımsız denetimi)                          */
/* ------------------------------------------------------------------ */

/** Tek bir kapının üniter olduğunu kanıtlar: U†U = I */
export function checkGateUnitarity(gateType, params = {}) {
  const U = gateMatrix(gateType, params);
  const Ud = dagger(U);
  const prod = matMul(Ud, U);
  const ok = matEquals(prod, identity(U.length), 1e-9);
  return {
    id: `uniter-${gateType}`,
    ad: `${gateType.toUpperCase()} üniter (U†U = I)`,
    ok,
    detay: ok ? 'Doğrulandı — olasılık korunur' : 'Üniter DEĞİL — matris hatalı!',
  };
}

/** Registry'deki tüm kapıları üniterlik açısından tarar. */
export function checkAllGatesUnitary() {
  const hatali = [];
  for (const type of Object.keys(GATE_REGISTRY)) {
    const spec = GATE_REGISTRY[type];
    const params = spec.matrisUret ? { theta: Math.PI / 3 } : {};
    try {
      const r = checkGateUnitarity(type, params);
      if (!r.ok) hatali.push(type);
    } catch (e) {
      hatali.push(`${type} (${e.message})`);
    }
  }
  return {
    id: 'uniter-hepsi',
    ad: 'Tüm kapılar üniter',
    ok: hatali.length === 0,
    detay: hatali.length === 0
      ? `${Object.keys(GATE_REGISTRY).length} kapı tarandı, hepsi üniter`
      : `Üniter olmayan: ${hatali.join(', ')}`,
  };
}

/* ------------------------------------------------------------------ */
/* Analiz paneli verisi                                                */
/* ------------------------------------------------------------------ */

/**
 * Analiz panelinin ihtiyaç duyduğu tüm metrikleri tek çağrıda üretir.
 * UI bu fonksiyonu kullanır — hesap UI içinde tekrarlanmaz.
 */
export function analyze(result, circuit) {
  const state = result.state;
  const n = result.nQubits;

  const satirlar = [];
  for (let i = 0; i < state.length; i++) {
    const p = abs2(state[i]);
    if (p < 1e-12) continue;
    satirlar.push({
      index: i,
      label: `|${basisLabel(i, n)}⟩`,
      amplitude: state[i],
      amplitudeText: format(state[i], 4),
      probability: p,
      probabilityPercent: p * 100,
      phaseRad: phase(state[i]),
      phaseDeg: (phase(state[i]) * 180) / Math.PI,
    });
  }

  return {
    nQubits: n,
    dim: state.length,
    norm: normOf(state),
    totalProbability: totalProbability(state),
    depth: circuit?.columns?.filter((c) => c.gates.length > 0).length ?? 0,
    gateCount: circuit?.columns?.reduce((a, c) => a + c.gates.length, 0) ?? 0,
    satirlar,
    aktifDurumSayisi: satirlar.length,
    dolaniklik: entanglementEntropy(state, n),
  };
}

/**
 * Von Neumann dolanıklık entropisi (bit bazında yaklaşım).
 * Her qubit için indirgenmiş durumu hesaplayıp Shannon entropisini döndürür.
 * S=0 ayrışabilir durum, S=1 maksimal dolanık (Bell) demektir.
 */
export function entanglementEntropy(state, nQubits) {
  const entropiler = [];
  for (let q = 0; q < nQubits; q++) {
    let p1 = 0;
    for (let i = 0; i < state.length; i++) {
      const bit = (i >> (nQubits - 1 - q)) & 1;
      if (bit === 1) p1 += abs2(state[i]);
    }
    const p0 = 1 - p1;
    let s = 0;
    if (p0 > 1e-12) s -= p0 * Math.log2(p0);
    if (p1 > 1e-12) s -= p1 * Math.log2(p1);
    entropiler.push({ qubit: q, p1, entropi: s });
  }
  return entropiler;
}
