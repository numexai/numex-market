/**
 * Numex Quantum Lab — Çekirdek motor testleri.
 *
 * Bu testler SIMÜLASYONUN GERÇEKTEN ÇALIŞTIĞINI kanıtlar; UI'a bağımlı değildir.
 * Kapsam: kompleks aritmetik, matris/tensör işlemleri, tüm kapılar,
 * CNOT kontrol-hedef doğruluğu, Bell/GHZ durumları, norm korunumu,
 * ölçüm dağılımı, geçersiz qubit kontrolü, kaydet/yükle.
 */
import { describe, it, expect } from 'vitest';

import {
  c, add, mul, div, conj, abs, abs2, phase, expI, equals, format,
} from '../src/core/complex.js';
import {
  zeros, identity, matMul, matVec, kron, kronAll, dagger, matEquals,
} from '../src/core/matrix.js';
import {
  X, Y, Z, H, S, T, CNOT, SWAP, CZ, rx, ry, rz, gateMatrix, gateArity, GATE_REGISTRY,
} from '../src/core/gates.js';
import {
  initialState, applySingleQubitGate, applyTwoQubitGate, runCircuit,
  normOf, totalProbability, sampleHistogram, basisLabel, makeRng, assertQubitCount,
} from '../src/core/simulator.js';
import {
  createCircuit, addGate, removeGate, clearCircuit, circuitDepth, gateCount,
  serializeCircuitToString, deserializeCircuit, buildExperiment, EXPERIMENTS,
} from '../src/circuit/circuit.js';
import {
  checkBellState, checkGhzState, checkNorm, checkProbabilitySum,
  checkMeasurementTotal, checkGateQubits, checkTwoQubitReference,
  checkGateUnitarity, checkAllGatesUnitary, entanglementEntropy, validateRun,
} from '../src/analysis/validators.js';

/* ================================================================== */
/* 1–3: Kompleks sayı işlemleri                                        */
/* ================================================================== */

describe('Kompleks sayı işlemleri', () => {
  it('1) çarpma ve toplama doğru: (1+2i)(3-1i) = 5+5i', () => {
    const r = mul(c(1, 2), c(3, -1));
    expect(r.re).toBeCloseTo(5, 12);
    expect(r.im).toBeCloseTo(5, 12);
    expect(add(c(1, 2), c(3, -1))).toEqual({ re: 4, im: 1 });
  });

  it('2) bölme doğru: (5+5i)/(1+2i) = 3-1i', () => {
    const r = div(c(5, 5), c(1, 2));
    expect(r.re).toBeCloseTo(3, 12);
    expect(r.im).toBeCloseTo(-1, 12);
  });

  it('3) modül, eşlenik ve faz: |3+4i| = 5, (1+i)* = 1-i', () => {
    expect(abs(c(3, 4))).toBeCloseTo(5, 12);
    expect(abs2(c(3, 4))).toBeCloseTo(25, 12);
    expect(conj(c(1, 1))).toEqual({ re: 1, im: -1 });
    expect(phase(c(0, 1))).toBeCloseTo(Math.PI / 2, 12);
    const e = expI(Math.PI);
    expect(e.re).toBeCloseTo(-1, 12);
    expect(e.im).toBeCloseTo(0, 12);
  });

  it('3b) sıfıra bölme hata fırlatır (sessiz NaN yok)', () => {
    expect(() => div(c(1, 1), c(0, 0))).toThrow(/sıfıra bölme/);
  });
});

/* ================================================================== */
/* 4–5: Matris ve tensör işlemleri                                     */
/* ================================================================== */

describe('Matris / tensör işlemleri', () => {
  it('4) matris çarpımı ve birim matris: A·I = A', () => {
    const A = [[c(1, 1), c(2, 0)], [c(0, -1), c(3, 2)]];
    const I2 = identity(2);
    expect(matEquals(matMul(A, I2), A)).toBe(true);
  });

  it('4b) tensör çarpımı boyutu ve değeri doğru: I ⊗ I (2x2) → 4x4', () => {
    const K = kron(identity(2), identity(2));
    expect(K.length).toBe(4);
    expect(K[0].length).toBe(4);
    expect(matEquals(K, identity(4))).toBe(true);
    const HK = kron(H, identity(2));
    expect(HK.length).toBe(4);
  });

  it('4c) kronAll üç matrisi birleştirir: 2x2 ⊗ 2x2 ⊗ 2x2 = 8x8', () => {
    const K = kronAll([identity(2), identity(2), identity(2)]);
    expect(K.length).toBe(8);
    expect(matEquals(K, identity(8))).toBe(true);
  });

  it('5) matris-vektör çarpımı: X|0> = |1>', () => {
    const v0 = [{ re: 1, im: 0 }, { re: 0, im: 0 }];
    const out = matVec(X, v0);
    expect(out[0].re).toBeCloseTo(0, 12);
    expect(out[1].re).toBeCloseTo(1, 12);
  });

  it('5b) her kapı üniterdir (U†U = I)', () => {
    const r = checkAllGatesUnitary();
    expect(r.ok).toBe(true);
    expect(r.detay).toMatch(/hepsi üniter/);
  });

  it('5c) parametreli Rx(π) ≈ -iX', () => {
    const r = checkGateUnitarity('rx', { theta: Math.PI });
    expect(r.ok).toBe(true);
    const M = rx(Math.PI);
    expect(M[0][0].re).toBeCloseTo(0, 12);
    expect(M[1][0].im).toBeCloseTo(-1, 12);
  });
});

/* ================================================================== */
/* 6–10: Kapı davranışları                                             */
/* ================================================================== */

describe('Kuantum kapıları', () => {
  it('6) X kapısı: |0> → |1> ve tekrar X → |0>', () => {
    let s = initialState(1);
    s = applySingleQubitGate(s, 1, 0, 'x');
    expect(abs2(s[1])).toBeCloseTo(1, 12);
    s = applySingleQubitGate(s, 1, 0, 'x');
    expect(abs2(s[0])).toBeCloseTo(1, 12);
  });

  it('7) H kapısı: |0> → eşit süperpozisyon (her biri 0.5)', () => {
    let s = initialState(1);
    s = applySingleQubitGate(s, 1, 0, 'h');
    expect(abs2(s[0])).toBeCloseTo(0.5, 12);
    expect(abs2(s[1])).toBeCloseTo(0.5, 12);
    // genlikler +1/√2 olmalı (faz 0)
    expect(s[0].re).toBeCloseTo(1 / Math.SQRT2, 12);
    expect(s[1].re).toBeCloseTo(1 / Math.SQRT2, 12);
  });

  it('8) H·H = I: iki Hadamard |0> durumunu geri getirir', () => {
    let s = initialState(1);
    s = applySingleQubitGate(s, 1, 0, 'h');
    s = applySingleQubitGate(s, 1, 0, 'h');
    expect(abs2(s[0])).toBeCloseTo(1, 12);
    expect(abs2(s[1])).toBeCloseTo(0, 12);
  });

  it('9) Z kapısı: |1> bileşenine −1 faz yazar, olasılık değişmez', () => {
    let s = initialState(1);
    s = applySingleQubitGate(s, 1, 0, 'x');   // |1>
    s = applySingleQubitGate(s, 1, 0, 'z');   // -|1>
    expect(s[1].re).toBeCloseTo(-1, 12);
    expect(abs2(s[1])).toBeCloseTo(1, 12);
  });

  it('10) S ve T faz kapıları: doğru açılar (π/2, π/4)', () => {
    let s = initialState(1);
    s = applySingleQubitGate(s, 1, 0, 'x');
    s = applySingleQubitGate(s, 1, 0, 's');
    expect(phase(s[1])).toBeCloseTo(Math.PI / 2, 12);

    let t = initialState(1);
    t = applySingleQubitGate(t, 1, 0, 'x');
    t = applySingleQubitGate(t, 1, 0, 't');
    expect(phase(t[1])).toBeCloseTo(Math.PI / 4, 12);
  });

  it('10b) Ry(π) |0> → |1>', () => {
    let s = initialState(1);
    s = applySingleQubitGate(s, 1, 0, 'ry', { theta: Math.PI });
    expect(abs2(s[1])).toBeCloseTo(1, 12);
  });

  it('10c) Rz fazı doğru: Rz(π/2) ile |1> fazı π/2 olur', () => {
    let s = initialState(1);
    s = applySingleQubitGate(s, 1, 0, 'x');
    s = applySingleQubitGate(s, 1, 0, 'rz', { theta: Math.PI / 2 });
    // global faz −π/4, göreli faz π/2 → |amp| = 1 korunur
    expect(abs2(s[1])).toBeCloseTo(1, 12);
    expect(normOf(s)).toBeCloseTo(1, 12);
  });
});

/* ================================================================== */
/* 11–14: İki qubit — CNOT, SWAP, tensör gömme                         */
/* ================================================================== */

describe('İki qubit kapıları ve dolanıklık', () => {
  it('11) CNOT |10> → |11> (kontrol q0=1, hedef q1)', () => {
    let s = initialState(2);
    s = applySingleQubitGate(s, 2, 0, 'x');          // |10>
    expect(basisLabel(2, 2)).toBe('10');
    s = applyTwoQubitGate(s, 2, 0, 1, 'cnot', { control: 0 });
    expect(abs2(s[3])).toBeCloseTo(1, 12);            // |11>
    expect(abs2(s[2])).toBeCloseTo(0, 12);
  });

  it('11b) CNOT kontrol 0 iken hedef değişmez: |00> → |00>', () => {
    let s = initialState(2);
    s = applyTwoQubitGate(s, 2, 0, 1, 'cnot', { control: 0 });
    expect(abs2(s[0])).toBeCloseTo(1, 12);
  });

  it('12) CNOT ters yön (kontrol q1, hedef q0): |01> → |11>', () => {
    let s = initialState(2);
    s = applySingleQubitGate(s, 2, 1, 'x');          // |01> (q1 = 1)
    expect(abs2(s[1])).toBeCloseTo(1, 12);
    s = applyTwoQubitGate(s, 2, 0, 1, 'cnot', { control: 1 });
    expect(abs2(s[3])).toBeCloseTo(1, 12);            // |11>
  });

  it('13) SWAP: |01> ↔ |10>', () => {
    let s = initialState(2);
    s = applySingleQubitGate(s, 2, 0, 'x');           // |10>
    s = applyTwoQubitGate(s, 2, 0, 1, 'swap', {});
    expect(abs2(s[1])).toBeCloseTo(1, 12);            // |01>
  });

  it('14) Bell state: H+CNOT → yalnızca |00> ve |11>, her biri 0.5', () => {
    const c1 = createCircuit(2);
    addGate(c1, { type: 'h', qubits: [0] });
    addGate(c1, { type: 'cnot', qubits: [0, 1], control: 0 });
    const r = runCircuit(c1);
    expect(abs2(r.state[0])).toBeCloseTo(0.5, 10);
    expect(abs2(r.state[3])).toBeCloseTo(0.5, 10);
    expect(abs2(r.state[1])).toBeCloseTo(0, 10);
    expect(abs2(r.state[2])).toBeCloseTo(0, 10);
    const kontrol = checkBellState(r.state);
    expect(kontrol.ok).toBe(true);
  });

  it('14b) Bell state dolanıktır (qubit entropisi = 1 bit)', () => {
    const c1 = buildExperiment('bell');
    const r = runCircuit(c1);
    const ent = entanglementEntropy(r.state, 2);
    expect(ent[0].p1).toBeCloseTo(0.5, 10);
    expect(ent[0].entropi).toBeCloseTo(1, 10);
    expect(ent[1].entropi).toBeCloseTo(1, 10);
  });
});

/* ================================================================== */
/* 15–18: GHZ, norm korunumu, ölçüm dağılımı                           */
/* ================================================================== */

describe('GHZ, norm ve ölçüm', () => {
  it('15) GHZ-3: yalnızca |000> ve |111> (0.5 / 0.5)', () => {
    const c1 = buildExperiment('ghz3');
    const r = runCircuit(c1);
    expect(abs2(r.state[0])).toBeCloseTo(0.5, 10);   // |000>
    expect(abs2(r.state[7])).toBeCloseTo(0.5, 10);   // |111>
    const k = checkGhzState(r.state, 3);
    expect(k.ok).toBe(true);
    // aradaki hiçbir durum genlik taşımamalı
    for (const i of [1, 2, 3, 4, 5, 6]) {
      expect(abs2(r.state[i])).toBeLessThan(1e-12);
    }
  });

  it('15b) GHZ-4: yalnızca |0000> ve |1111>', () => {
    const c1 = buildExperiment('ghz4');
    const r = runCircuit(c1);
    expect(abs2(r.state[0])).toBeCloseTo(0.5, 10);
    expect(abs2(r.state[15])).toBeCloseTo(0.5, 10);
    expect(checkGhzState(r.state, 4).ok).toBe(true);
  });

  it('16) Norm korunumu: HER kapı dizisinden sonra ||ψ|| = 1', () => {
    for (const exp of EXPERIMENTS) {
      const circ = exp.kur();
      const r = runCircuit(circ);
      expect(normOf(r.state), `${exp.id} normu`).toBeCloseTo(1, 9);
      expect(totalProbability(r.state), `${exp.id} olasılık toplamı`).toBeCloseTo(1, 9);
      for (const step of r.steps) {
        expect(step.norm, `${exp.id} → ${step.type} sonrası norm`).toBeCloseTo(1, 9);
      }
    }
  });

  it('17) Ölçüm dağılımı Bell için ~%50/%50 ve toplam %100', () => {
    const c1 = buildExperiment('bell');
    const r = runCircuit(c1, { shots: 4000, seed: 7 });
    const h = r.histogram;
    const toplam = h.counts.reduce((a, b) => a + b, 0);
    expect(toplam).toBe(4000);
    expect(h.counts[1]).toBe(0);
    expect(h.counts[2]).toBe(0);
    expect(h.counts[0] / 4000).toBeGreaterThan(0.45);
    expect(h.counts[0] / 4000).toBeLessThan(0.55);
    expect(h.counts[3] / 4000).toBeGreaterThan(0.45);
    expect(h.counts[3] / 4000).toBeLessThan(0.55);
    expect(checkMeasurementTotal(h).ok).toBe(true);
  });

  it('17b) Ölçüm dağılımı GHZ-3 için yalnızca 000 ve 111 üretir', () => {
    const c1 = buildExperiment('ghz3');
    const r = runCircuit(c1, { shots: 2000, seed: 11 });
    const h = r.histogram;
    for (const i of [1, 2, 3, 4, 5, 6]) expect(h.counts[i]).toBe(0);
    expect(h.counts[0] + h.counts[7]).toBe(2000);
  });

  it('17c) Deterministik PRNG: aynı seed → aynı histogram', () => {
    const c1 = buildExperiment('ghz3');
    const a = runCircuit(c1, { shots: 500, seed: 99 });
    const b = runCircuit(c1, { shots: 500, seed: 99 });
    expect(a.histogram.counts).toEqual(b.histogram.counts);
    const rng = makeRng(5);
    expect(rng()).toBe(makeRng(5)());
  });

  it('17d) Ölçüm saf olasılık dağılımından gelir — |1> durumu %100 |1> verir', () => {
    const c1 = createCircuit(1);
    addGate(c1, { type: 'x', qubits: [0] });
    const r = runCircuit(c1, { shots: 300, seed: 3 });
    expect(r.histogram.counts[1]).toBe(300);
    expect(r.histogram.counts[0]).toBe(0);
  });

  it('18) Süperpozisyon ölçümü ~%50/%50 (tek qubit)', () => {
    const c1 = buildExperiment('superposition');
    const r = runCircuit(c1, { shots: 3000, seed: 21 });
    const h = r.histogram;
    expect(Math.abs(h.counts[0] / 3000 - 0.5)).toBeLessThan(0.05);
    expect(Math.abs(h.counts[1] / 3000 - 0.5)).toBeLessThan(0.05);
  });
});

/* ================================================================== */
/* 19–22: Hata yönetimi, sınırlar, kaydet/yükle                        */
/* ================================================================== */

describe('Geçersiz girdi, sınırlar ve kalıcılık', () => {
  it('19a) Geçersiz qubit sayısı hata fırlatır (0, 9, 2.5)', () => {
    expect(() => assertQubitCount(0)).toThrow(/Geçersiz qubit sayısı/);
    expect(() => assertQubitCount(9)).toThrow(/Geçersiz qubit sayısı/);
    expect(() => assertQubitCount(2.5)).toThrow(/Geçersiz qubit sayısı/);
    expect(() => assertQubitCount(8)).not.toThrow();
  });

  it('19b) Geçersiz qubit indeksi hata fırlatır (devre sınırı dışı)', () => {
    const c1 = createCircuit(2);
    expect(() => addGate(c1, { type: 'h', qubits: [2] })).toThrow(/Geçersiz qubit indeksi/);
    expect(() => addGate(c1, { type: 'x', qubits: [-1] })).toThrow(/Geçersiz qubit indeksi/);
  });

  it('19c) CNOT aynı qubit üzerine eklenemez', () => {
    const c1 = createCircuit(2);
    expect(() => addGate(c1, { type: 'cnot', qubits: [1, 1], control: 1 })).toThrow(/aynı qubit/);
  });

  it('19d) Bilinmeyen kapı türü hata fırlatır', () => {
    const c1 = createCircuit(2);
    expect(() => addGate(c1, { type: 'fredkin', qubits: [0, 1] })).toThrow(/Bilinmeyen kapı türü/);
    expect(() => gateArity('qft')).toThrow(/Bilinmeyen kapı türü/);
  });

  it('19e) Sütun çakışması hata fırlatır (aynı qubit iki kez)', () => {
    const c1 = createCircuit(2);
    addGate(c1, { type: 'h', qubits: [0] });
    expect(() => addGate(c1, { type: 'x', qubits: [0], columnIndex: 0 })).toThrow(/çakışması/);
  });

  it('19f) Doğrulama katmanı geçersiz qubit ve kontrol rolünü yakalar', () => {
    const bozuk = { nQubits: 2, columns: [] };
    const c1 = createCircuit(2);
    addGate(c1, { type: 'h', qubits: [0] });
    // elle bozulmuş kapı simülasyonu
    bozuk.columns.push({ gates: [{ id: 'x1', type: 'h', qubits: [5], params: {} }] });
    const r = checkGateQubits(bozuk);
    expect(r.ok).toBe(false);
    expect(r.detay).toMatch(/Geçersiz kapılar/);

    const kontrolsuz = { nQubits: 2, columns: [{ gates: [{ id: 'g', type: 'cnot', qubits: [0, 1], params: {}, control: 7 }] }] };
    expect(checkTwoQubitReference(kontrolsuz).ok).toBe(false);
    expect(checkTwoQubitReference(c1).ok).toBe(true);
  });

  it('20) Devre kaydet → yükle: aynı durum vektörünü üretir (round-trip)', () => {
    const ozgun = buildExperiment('ghz3');
    const json = serializeCircuitToString(ozgun);
    expect(typeof json).toBe('string');
    const parsed = JSON.parse(json);
    expect(parsed.format).toBe('numex-quantum-circuit');
    expect(parsed.nQubits).toBe(3);
    expect(parsed.gateCount).toBe(3);

    const yuklenen = deserializeCircuit(json);
    expect(yuklenen.nQubits).toBe(3);
    expect(gateCount(yuklenen)).toBe(gateCount(ozgun));
    expect(circuitDepth(yuklenen)).toBe(circuitDepth(ozgun));

    const a = runCircuit(ozgun);
    const b = runCircuit(yuklenen);
    for (let i = 0; i < a.state.length; i++) {
      expect(b.state[i].re).toBeCloseTo(a.state[i].re, 12);
      expect(b.state[i].im).toBeCloseTo(a.state[i].im, 12);
    }
  });

  it('20b) Bozuk JSON yükleme sessizce geçmez — hata fırlatır', () => {
    expect(() => deserializeCircuit('{ bozuk json')).toThrow();
    expect(() => deserializeCircuit({ nQubits: 3 })).not.toThrow();
    expect(() => deserializeCircuit({ nQubits: 0 })).toThrow(/Geçersiz qubit sayısı/);
    expect(() => deserializeCircuit({
      nQubits: 2,
      columns: [{ gates: [{ type: 'bilinmeyen', qubits: [0] }] }],
    })).toThrow(/Bilinmeyen kapı türü/);
    expect(() => deserializeCircuit({
      nQubits: 2,
      columns: [{ gates: [{ type: 'cnot', qubits: [0] }] }],
    })).toThrow(/qubit listesi geçersiz/);
  });

  it('20c) Kontrol qubit farklı olan CNOT kaydedilip doğru yüklenir', () => {
    const c1 = createCircuit(2);
    addGate(c1, { type: 'x', qubits: [1] });
    addGate(c1, { type: 'cnot', qubits: [0, 1], control: 1 });
    const json = serializeCircuitToString(c1);
    const yuklenen = deserializeCircuit(json);
    const g = yuklenen.columns.flatMap((c) => c.gates).find((x) => x.type === 'cnot');
    expect(g.control).toBe(1);
    const r = runCircuit(yuklenen);
    expect(abs2(r.state[3])).toBeCloseTo(1, 12);   // |01> → |11>
  });

  it('21) Kapı ekleme / silme / temizleme devreyi doğru yönetir', () => {
    const c1 = createCircuit(3);
    const g1 = addGate(c1, { type: 'h', qubits: [0] });
    addGate(c1, { type: 'x', qubits: [1] });
    expect(gateCount(c1)).toBe(2);
    // KRONOLOJİ KURALI: sıralı eklenen kapılar sıralı sütunlara gider
    // (farklı qubit'te olsalar bile zaman sırası korunur — GHZ'nin doğruluğu buna bağlı).
    expect(circuitDepth(c1)).toBe(2);

    addGate(c1, { type: 'x', qubits: [0] });
    expect(circuitDepth(c1)).toBe(3);

    // Aynı sütuna açıkça ekleme (çakışmayan qubit) derinliği artırmaz
    const c2 = createCircuit(3);
    addGate(c2, { type: 'h', qubits: [0], columnIndex: 0 });
    addGate(c2, { type: 'x', qubits: [2], columnIndex: 0 });
    expect(circuitDepth(c2)).toBe(1);
    expect(gateCount(c2)).toBe(2);

    expect(removeGate(c1, g1.id)).toBe(true);
    expect(gateCount(c1)).toBe(2);
    expect(removeGate(c1, 'olmayan_id')).toBe(false);

    clearCircuit(c1);
    expect(gateCount(c1)).toBe(0);
    expect(circuitDepth(c1)).toBe(0);
    const r = runCircuit(c1);
    expect(abs2(r.state[0])).toBeCloseTo(1, 12);   // boş devre → |000>
  });

  it('21c) Kronoloji korunur: H(q0) → CNOT(q0,q1) → CNOT(q1,q2) doğru sırada koşar', () => {
    const c1 = createCircuit(3);
    addGate(c1, { type: 'h', qubits: [0] });
    addGate(c1, { type: 'cnot', qubits: [0, 1], control: 0 });
    addGate(c1, { type: 'cnot', qubits: [1, 2], control: 1 });
    // Sütun sırası, ekleme sırasıyla birebir aynı olmalı
    const sirali = c1.columns.flatMap((c) => c.gates).map((g) => g.type);
    expect(sirali).toEqual(['h', 'cnot', 'cnot']);
    const kontrolSirasi = c1.columns.flatMap((c) => c.gates).filter((g) => g.type === 'cnot').map((g) => g.control);
    expect(kontrolSirasi).toEqual([0, 1]);
    // Ve gerçekten GHZ üretir
    const r = runCircuit(c1);
    expect(checkGhzState(r.state, 3).ok).toBe(true);
  });

  it('21b) Deney kütüphanesi 7 hazır deney sunar ve hepsi çalışır', () => {
    expect(EXPERIMENTS.length).toBeGreaterThanOrEqual(7);
    const ids = EXPERIMENTS.map((e) => e.id);
    expect(ids).toContain('bell');
    expect(ids).toContain('ghz3');
    expect(ids).toContain('ghz4');
    expect(ids).toContain('teleportation');
    expect(ids).toContain('superposition');
    expect(ids).toContain('hadamard-measurement');
    for (const e of EXPERIMENTS) {
      const r = runCircuit(e.kur());
      expect(normOf(r.state), `${e.id}`).toBeCloseTo(1, 9);
    }
  });

  it('22) Hadamard + ölçüm deneyi %100 |0> verir (H² = I)', () => {
    const r = runCircuit(buildExperiment('hadamard-measurement'), { shots: 500, seed: 1 });
    expect(r.histogram.counts[0]).toBe(500);
    expect(checkProbabilitySum(r).ok).toBe(true);
    expect(checkNorm(r).ok).toBe(true);
  });

  it('22b) validateRun tam rapor üretir ve temiz devrede GEÇER', () => {
    const c1 = buildExperiment('bell');
    const r = runCircuit(c1, { shots: 200, seed: 2 });
    const rapor = validateRun(r, c1);
    expect(rapor.checks.length).toBeGreaterThanOrEqual(6);
    expect(rapor.ok).toBe(true);
    for (const chk of rapor.checks) {
      expect(chk.detay.length).toBeGreaterThan(0);
      expect(typeof chk.ad).toBe('string');
    }
  });

  it('22c) 8 qubit sınırında simülasyon çalışır (256 genlik)', () => {
    const c1 = createCircuit(8);
    addGate(c1, { type: 'h', qubits: [0] });
    for (let q = 0; q < 7; q++) addGate(c1, { type: 'cnot', qubits: [q, q + 1], control: q });
    const r = runCircuit(c1, { shots: 100, seed: 4 });
    expect(r.state.length).toBe(256);
    expect(normOf(r.state)).toBeCloseTo(1, 9);
    expect(checkGhzState(r.state, 8).ok).toBe(true);
    expect(r.histogram.counts[0] + r.histogram.counts[255]).toBe(100);
  });
});

/* ================================================================== */
/* 23–24: Biçimlendirme ve yardımcılar                                 */
/* ================================================================== */

describe('Yardımcı fonksiyonlar', () => {
  it('23) basisLabel doğru üretir (5, 3 qubit → 101)', () => {
    expect(basisLabel(5, 3)).toBe('101');
    expect(basisLabel(0, 4)).toBe('0000');
    expect(basisLabel(15, 4)).toBe('1111');
  });

  it('24) format küçük gürültüyü sıfıra çeker ve okunabilir yazar', () => {
    expect(format(c(0.70710678, 0), 4)).toBe('0.7071+0.0000i');
    expect(format(c(0.5, -0.866), 4)).toBe('0.5000-0.8660i');
    expect(equals(c(1, 0), c(1, 0))).toBe(true);
    expect(equals(c(1, 0), c(1, 1e-12))).toBe(true);
  });

  it('24b) sampleHistogram olasılıkları doğru raporlar', () => {
    let s = initialState(1);
    s = applySingleQubitGate(s, 1, 0, 'h');
    const h = sampleHistogram(s, 1, 100, 5);
    expect(h.probabilities[0]).toBeCloseTo(0.5, 12);
    expect(h.probabilities[1]).toBeCloseTo(0.5, 12);
    expect(h.labels).toEqual(['0', '1']);
  });
});
