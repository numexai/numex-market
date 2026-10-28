/**
 * Numex Quantum Lab — Devre modeli.
 *
 * Bir devre:
 *   {
 *     nQubits: 3,
 *     columns: [ { id, gates: [ { id, type, qubits:[0], params:{}, control? } ] } ]
 *   }
 *
 * Sütun (column) modeli: aynı sütundaki kapılar farklı qubitlere etki eder ve
 * komütatiftir; sütun sırası devrenin zaman sırasıdır.
 * Bu model hem UI'da ızgara çizmeyi hem de katman derinliğini doğru hesaplamayı sağlar.
 */
import { GATE_REGISTRY, gateArity } from '../core/gates.js';
import { assertQubitCount, assertQubitIndex } from '../core/simulator.js';

let idSayac = 0;
function yeniId(prefix) {
  idSayac += 1;
  return `${prefix}_${Date.now().toString(36)}_${idSayac}`;
}

/** Boş devre oluşturur. */
export function createCircuit(nQubits = 3) {
  assertQubitCount(nQubits);
  return { nQubits, columns: [] };
}

/**
 * Devreye kapı ekler.
 * - Sütun indeksi verilmezse: kapıyı en erken uygun (çakışmayan) sütuna yerleştirir.
 * - Sütun indeksi verilirse: o sütunun qubitlerini işgal eder (çakışma varsa hata).
 */
export function addGate(circuit, { type, qubits, params = {}, columnIndex = null, control = null }) {
  const spec = GATE_REGISTRY[type];
  if (!spec) throw new Error(`Bilinmeyen kapı türü: ${type}`);

  const arity = gateArity(type);
  const qs = [...qubits];
  if (qs.length !== arity) {
    throw new Error(`${spec.label} kapısı ${arity} qubit gerektirir, ${qs.length} verildi`);
  }
  for (const q of qs) assertQubitIndex(q, circuit.nQubits);
  if (arity === 2 && qs[0] === qs[1]) {
    throw new Error(`${spec.label} aynı qubit üzerine eklenemez`);
  }

  const gate = {
    id: yeniId('g'),
    type,
    qubits: qs.sort((a, b) => a - b),
    params: { ...params },
  };
  if (arity === 2 && spec.kontrollu) {
    gate.control = control ?? qs[0];
  }

  if (columnIndex === null) {
    // KAPILI-BAĞIMLILIK KURALI: Yeni kapı, kendisinden ÖNCE eklenmiş her kapıdan
    // sonra gelmelidir. Yalnızca «qubit çakışması yok» diye boş bir sütuna
    // yerleştirmek devrenin zaman sırasını bozar (ör. GHZ'de CNOT(1,2) yanlışlıkla
    // H ile aynı sütuna düşer). Bu yüzden:
    //   1) En az (son dolu sütun + 1) indeksinden başla — kronoloji korunur.
    //   2) O noktadan sonra qubit'leri boş olan ilk sütunu bul.
    const sonDoluSutun = sonDoluSutunIndeksi(circuit);
    let idx = Math.max(0, sonDoluSutun + 1);
    while (true) {
      while (circuit.columns.length <= idx) {
        circuit.columns.push({ id: yeniId('c'), gates: [] });
      }
      const dolu = circuit.columns[idx].gates.some((g) =>
        g.qubits.some((q) => gate.qubits.includes(q))
      );
      if (!dolu) break;
      idx += 1;
    }
    circuit.columns[idx].gates.push(gate);
  } else {
    if (columnIndex < 0 || columnIndex > circuit.columns.length) {
      throw new Error(`Geçersiz sütun indeksi: ${columnIndex}`);
    }
    while (circuit.columns.length <= columnIndex) {
      circuit.columns.push({ id: yeniId('c'), gates: [] });
    }
    const cakisan = circuit.columns[columnIndex].gates.find((g) =>
      g.qubits.some((q) => gate.qubits.includes(q))
    );
    if (cakisan) {
      throw new Error(`Sütun ${columnIndex} dolu: ${cakisan.type} ile qubit çakışması`);
    }
    circuit.columns[columnIndex].gates.push(gate);
  }

  temizleBosSutunlar(circuit);
  return gate;
}

/** Bir kapıyı id ile siler. */
export function removeGate(circuit, gateId) {
  let bulundu = false;
  for (const col of circuit.columns) {
    const before = col.gates.length;
    col.gates = col.gates.filter((g) => g.id !== gateId);
    if (col.gates.length !== before) bulundu = true;
  }
  temizleBosSutunlar(circuit);
  return bulundu;
}

/** Devreyi temizler (boşaltır) — qubit sayısı korunur. */
export function clearCircuit(circuit) {
  circuit.columns = [];
  return circuit;
}

/** Devredeki en son DOLU sütunun indeksi (hiç dolu sütun yoksa -1). */
function sonDoluSutunIndeksi(circuit) {
  for (let i = circuit.columns.length - 1; i >= 0; i--) {
    if (circuit.columns[i].gates.length > 0) return i;
  }
  return -1;
}

/** Belirtilen qubit'lerin çakışmadığı en erken sütun indeksi. */
function enErkenUygunSutun(circuit, qubits) {
  for (let i = 0; i < circuit.columns.length; i++) {
    const dolu = circuit.columns[i].gates.some((g) => g.qubits.some((q) => qubits.includes(q)));
    if (!dolu) return i;
  }
  return circuit.columns.length;
}

function temizleBosSutunlar(circuit) {
  // Kaydet/yükle tutarlılığı için sondaki boş sütunları düşürür,
  // ortadakileri KORUR (görsel boşluk anlamlı olabilir).
  while (circuit.columns.length && circuit.columns[circuit.columns.length - 1].gates.length === 0) {
    circuit.columns.pop();
  }
}

/** Devre derinliği: dolu sütun sayısı (tüm qubitler boyunca en uzun yol). */
export function circuitDepth(circuit) {
  return circuit.columns.filter((c) => c.gates.length > 0).length;
}

/** Toplam kapı sayısı. */
export function gateCount(circuit) {
  return circuit.columns.reduce((acc, c) => acc + c.gates.length, 0);
}

/** Toplam operasyon sayısı (ölçüm dahil). */
export function operationCount(circuit) {
  return gateCount(circuit);
}

/** Devreyi düz operasyon listesine çevirir (simülatör girdisi). */
export function toOperations(circuit) {
  const ops = [];
  for (const col of circuit.columns) {
    for (const g of col.gates) {
      ops.push({
        type: g.type,
        qubits: [...g.qubits],
        params: { ...g.params },
        control: g.control ?? g.qubits[0],
      });
    }
  }
  return ops;
}

/** Devreyi simülatör formatına (operations) çevirir. */
export function toSimulatorInput(circuit) {
  return { nQubits: circuit.nQubits, operations: toOperations(circuit) };
}

/* ------------------------------------------------------------------ */
/* JSON kaydet / yükle                                                 */
/* ------------------------------------------------------------------ */

export const CIRCUIT_FILE_FORMAT = 'numex-quantum-circuit';
export const CIRCUIT_FILE_VERSION = 1;

/** Devreyi taşınabilir JSON nesnesine çevirir. */
export function serializeCircuit(circuit) {
  return {
    format: CIRCUIT_FILE_FORMAT,
    version: CIRCUIT_FILE_VERSION,
    nQubits: circuit.nQubits,
    depth: circuitDepth(circuit),
    gateCount: gateCount(circuit),
    columns: circuit.columns.map((col) => ({
      gates: col.gates.map((g) => {
        const out = { type: g.type, qubits: [...g.qubits] };
        if (Object.keys(g.params ?? {}).length) out.params = { ...g.params };
        if (g.control !== undefined && g.control !== null && g.control !== g.qubits[0]) {
          out.control = g.control;
        }
        return out;
      }),
    })),
  };
}

export function serializeCircuitToString(circuit) {
  return JSON.stringify(serializeCircuit(circuit), null, 2);
}

/**
 * JSON'dan devre yükler. Bozuk/eksik veri sessizce geçilmez — hata fırlatır.
 * Bu, «yükledim ama boş devre» durumunu engeller.
 */
export function deserializeCircuit(data) {
  const obj = typeof data === 'string' ? JSON.parse(data) : data;
  if (!obj || typeof obj !== 'object') throw new Error('Devre verisi geçersiz (nesne değil)');
  if (obj.format && obj.format !== CIRCUIT_FILE_FORMAT) {
    throw new Error(`Bilinmeyen dosya biçimi: ${obj.format}`);
  }
  assertQubitCount(obj.nQubits);

  const circuit = createCircuit(obj.nQubits);
  const columns = obj.columns ?? [];
  if (!Array.isArray(columns)) throw new Error('Devre verisi geçersiz (columns dizi değil)');

  for (const col of columns) {
    const gates = col?.gates ?? [];
    if (!Array.isArray(gates)) throw new Error('Sütun verisi geçersiz (gates dizi değil)');
    for (const g of gates) {
      if (!g?.type) throw new Error('Kapı verisi geçersiz (type yok)');
      if (!GATE_REGISTRY[g.type]) throw new Error(`Bilinmeyen kapı türü: ${g.type}`);
      const qubits = g.qubits ?? [];
      if (!Array.isArray(qubits) || qubits.length !== gateArity(g.type)) {
        throw new Error(`${g.type} için qubit listesi geçersiz`);
      }
      addGate(circuit, {
        type: g.type,
        qubits,
        params: g.params ?? {},
        control: g.control ?? null,
      });
    }
  }
  return circuit;
}

/* ------------------------------------------------------------------ */
/* Hazır deneyler                                                      */
/* ------------------------------------------------------------------ */

/**
 * Hazır deney kütüphanesi. Her deney fonksiyonu TEMİZ bir devre döndürür.
 * Beklenen sonuçlar analiz katmanında doğrulanır (bkz. src/analysis/validators.js).
 */
export const EXPERIMENTS = [
  {
    id: 'superposition',
    ad: 'Tek Qubit Süperpozisyonu',
    aciklama: 'H kapısı |0> durumunu (|0>+|1>)/√2 süperpozisyonuna çevirir. Ölçümde %50/%50 dağılım beklenir.',
    beklenen: 'Eşit olasılıklı iki durum',
    kur() {
      const c = createCircuit(1);
      addGate(c, { type: 'h', qubits: [0] });
      return c;
    },
  },
  {
    id: 'bell',
    ad: 'Bell State (Φ+)',
    aciklama: 'H + CNOT ile maksimal dolanıklık: (|00>+|11>)/√2. Ölçümde yalnızca 00 ve 11 çıkar.',
    beklenen: '%50 |00>, %50 |11>, diğerleri %0',
    kur() {
      const c = createCircuit(2);
      addGate(c, { type: 'h', qubits: [0] });
      addGate(c, { type: 'cnot', qubits: [0, 1], control: 0 });
      return c;
    },
  },
  {
    id: 'ghz3',
    ad: 'GHZ State (3 qubit)',
    aciklama: 'H + CNOT + CNOT ile üçlü dolanıklık: (|000>+|111>)/√2.',
    beklenen: '%50 |000>, %50 |111>',
    kur() {
      const c = createCircuit(3);
      addGate(c, { type: 'h', qubits: [0] });
      addGate(c, { type: 'cnot', qubits: [0, 1], control: 0 });
      addGate(c, { type: 'cnot', qubits: [1, 2], control: 1 });
      return c;
    },
  },
  {
    id: 'ghz4',
    ad: 'GHZ State (4 qubit)',
    aciklama: 'Dört qubit üzerinde katmanlı CNOT ile GHZ: (|0000>+|1111>)/√2.',
    beklenen: '%50 |0000>, %50 |1111>',
    kur() {
      const c = createCircuit(4);
      addGate(c, { type: 'h', qubits: [0] });
      addGate(c, { type: 'cnot', qubits: [0, 1], control: 0 });
      addGate(c, { type: 'cnot', qubits: [1, 2], control: 1 });
      addGate(c, { type: 'cnot', qubits: [2, 3], control: 2 });
      return c;
    },
  },
  {
    id: 'teleportation',
    ad: 'Quantum Teleportation Gösterimi',
    aciklama:
      '3 qubit: q0 aktarılacak durum, q1-q2 dolanık çift. Bell ölçümü + düzeltme kapılarıyla durum q2\'ye aktarılır. ' +
      'q0\'a X uygulanarak |1> aktarımı gösterilir; devre sonunda q2\'nin |1> olduğu doğrulanır.',
    beklenen: 'q2 aktarılan durumu taşır (ölçümde 100|1> beklenir)',
    kur() {
      const c = createCircuit(3);
      // 1) Aktarılacak durumu hazırla: q0 = |1>
      addGate(c, { type: 'x', qubits: [0] });
      // 2) q1-q2 Bell çifti
      addGate(c, { type: 'h', qubits: [1] });
      addGate(c, { type: 'cnot', qubits: [1, 2], control: 1 });
      // 3) Alice: q0-q1 Bell ölçümü (devre içinde CNOT + H)
      addGate(c, { type: 'cnot', qubits: [0, 1], control: 0 });
      addGate(c, { type: 'h', qubits: [0] });
      // 4) Bob: klasik bitlere koşullu düzeltme (CNOT/CZ ile temsil edilir)
      addGate(c, { type: 'cnot', qubits: [1, 2], control: 1 });
      addGate(c, { type: 'cz', qubits: [0, 2], control: 0 });
      return c;
    },
  },
  {
    id: 'hadamard-measurement',
    ad: 'Hadamard + Ölçüm',
    aciklama: 'H ardından H: durum |0>\'a döner (H² = I). Ölçüm %100 |0> vermelidir.',
    beklenen: '%100 |0> (H·H = I doğrulaması)',
    kur() {
      const c = createCircuit(1);
      addGate(c, { type: 'h', qubits: [0] });
      addGate(c, { type: 'h', qubits: [0] });
      return c;
    },
  },
  {
    id: 'phase-kickback',
    ad: 'Faz Geri Tepmesi (Phase Kickback)',
    aciklama:
      'Hedef |1> iken H→CNOT→H dizisi kontrol qubit\'ine −1 fazı yazar. ' +
      'Sonuçta |-> faz durumu oluşur; Z kapısı ile |0> ve |1> yer değiştirmiş faz gözlenir.',
    beklenen: 'Kontrol qubitinde faz durumu (|0>-|1>)/√2',
    kur() {
      const c = createCircuit(2);
      addGate(c, { type: 'x', qubits: [1] });          // hedef = |1>
      addGate(c, { type: 'h', qubits: [0] });          // kontrol süperpozisyon
      addGate(c, { type: 'cnot', qubits: [0, 1], control: 0 });
      addGate(c, { type: 'h', qubits: [0] });
      addGate(c, { type: 'z', qubits: [0] });
      return c;
    },
  },
];

export function getExperiment(id) {
  return EXPERIMENTS.find((e) => e.id === id) ?? null;
}

/** Deneyi kurup devre döndürür. */
export function buildExperiment(id) {
  const exp = getExperiment(id);
  if (!exp) throw new Error(`Bilinmeyen deney: ${id}`);
  return exp.kur();
}
