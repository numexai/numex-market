/**
 * Numex Quantum Circuit Laboratory — Ana uygulama.
 *
 * Bu dosya YALNIZCA orkestrasyondur: parçaları bağlar, olayları yönlendirir.
 * Matematik src/core/*'ta, devre modeli src/circuit/*'te, kurallar
 * src/analysis/*'ta, görsel parçalar src/ui/*'ta yaşar.
 */
import './styles.css';

import {
  createCircuit, buildExperiment, serializeCircuit, serializeCircuitToString,
  deserializeCircuit, gateCount, circuitDepth, clearCircuit, addGate,
} from './circuit/circuit.js';
import { runCircuit, assertQubitCount } from './core/simulator.js';
import { validateRun } from './analysis/validators.js';
import { createGatePalette, createSidebarBottom } from './ui/gate-palette.js';
import { createCircuitCanvas } from './ui/circuit-canvas.js';
import { createAnalysisPanel } from './ui/analysis-panel.js';
import { createHistogramPanel } from './ui/histogram.js';
import { el, $, toast, dosyaIndir, dosyaSec } from './ui/ui-utils.js';

/* ------------------------------------------------------------------ */
/* Durum                                                               */
/* ------------------------------------------------------------------ */

const state = {
  circuit: createCircuit(2),
  result: null,          // son simülasyon sonucu (state vektörü dahil)
  shots: 1024,
  seed: 42,
  /** Kapı sayacı animasyonu için önceki değer */
  sonKapi: 0,
};

/* ------------------------------------------------------------------ */
/* Header                                                              */
/* ------------------------------------------------------------------ */

const headerStats = {
  qubit: el('span', { text: '2' }),
  kapi: el('span', { text: '0' }),
  derinlik: el('span', { text: '0' }),
  norm: el('span', { text: '—' }),
};

function headerStat(etiket, degerNode) {
  return el('div', { class: 'header-stat' }, [
    el('span', { text: etiket }),
    degerNode,
  ]);
}

const header = el('header', { class: 'app-header' }, [
  el('div', { class: 'brand' }, [
    el('div', { class: 'brand-logo', text: 'Ψ' }),
    el('div', { class: 'brand-text' }, [
      el('h1', { text: 'Quantum Circuit Laboratory' }),
      el('p', { text: 'Numex AI · gerçek durum vektörü simülasyonu' }),
    ]),
  ]),
  el('div', { class: 'header-spacer' }),
  headerStat('qubit', headerStats.qubit),
  headerStat('kapı', headerStats.kapi),
  headerStat('derinlik', headerStats.derinlik),
  headerStat('norm', headerStats.norm),
]);

/* ------------------------------------------------------------------ */
/* Bileşenler                                                          */
/* ------------------------------------------------------------------ */

const palette = createGatePalette({
  onGateSelect: (tur) => {
    canvas.setSecili(tur);
    canvas.cnotIptal();
    toast(`${tur.toUpperCase()} seçildi — bir qubit'e tıkla`, 'info', 1800);
  },
  onGateDragStart: (tur) => canvas.setSurukle(tur),
  onGateDragEnd: () => canvas.setSurukle(null),
  onDeney: (id) => deneyKur(id),
  onQubitChange: (n) => qubitSayisiDegistir(n),
  getQubitCount: () => state.circuit.nQubits,
});

const canvas = createCircuitCanvas({
  getCircuit: () => state.circuit,
  onChange: () => {
    state.result = null; // devre değişti → eski sonuç geçersiz
    yenile();
  },
  onSelectGate: (g) => {
    toast(`${g.type.toUpperCase()} · q[${g.qubits.join(', ')}] seçildi`, 'info', 1800);
  },
});

const analiz = createAnalysisPanel({
  getResult: () => state.result,
  getCircuit: () => state.circuit,
  onKapiSec: (g) => toast(`${g.type.toUpperCase()} · q[${g.qubits.join(', ')}]`, 'info', 1600),
});

const histogram = createHistogramPanel();

const sidebarBottom = createSidebarBottom({
  onQubitChange: (n) => qubitSayisiDegistir(n),
  onDeney: (id) => deneyKur(id),
  getQubitCount: () => state.circuit.nQubits,
});

const solKol = el('div', { class: 'lab-col' }, [palette.head, palette.body, sidebarBottom.root]);

/* ------------------------------------------------------------------ */
/* Orta kolon: devre + araç çubuğu                                     */
/* ------------------------------------------------------------------ */

const btnCalistir = el('button', { class: 'btn btn-primary', text: '▶ Çalıştır' });
const btnTemizle = el('button', { class: 'btn btn-danger', text: 'Devreyi Temizle' });
const btnKaydet = el('button', { class: 'btn', text: '↓ Kaydet' });
const btnYukle = el('button', { class: 'btn', text: '↑ Yükle' });

const shotsSecim = el('select', {
  onchange: (e) => {
    state.shots = Number(e.target.value);
    if (state.result) calistir();
  },
});
for (const s of [100, 512, 1024, 4096, 8192]) {
  shotsSecim.appendChild(el('option', { value: String(s), text: `${s} ölçüm`, selected: s === 1024 }));
}

const seedInput = el('input', {
  type: 'number', value: '42', min: '0', step: '1',
  style: { width: '68px' },
  title: 'Ölçüm tohumu — aynı tohum aynı histogramı verir (deterministik)',
  onchange: (e) => {
    state.seed = Number(e.target.value) || 0;
    if (state.result) calistir();
  },
});

const toolbar = el('div', { class: 'circuit-toolbar' }, [
  btnCalistir,
  btnTemizle,
  el('div', { class: 'toolbar-sep' }),
  btnKaydet,
  btnYukle,
  el('div', { class: 'toolbar-sep' }),
  el('div', { class: 'field' }, [el('label', { text: 'Ölçüm' }), shotsSecim]),
  el('div', { class: 'field' }, [el('label', { text: 'Tohum' }), seedInput]),
]);

const ortaKol = el('div', { class: 'lab-col' }, [
  el('div', { class: 'panel-head' }, [
    el('h2', { text: 'Devre Tuvali' }),
    el('span', { class: 'badge', id: 'kanvas-rozet', text: 'boş' }),
  ]),
  toolbar,
  canvas.root,
]);

/* ------------------------------------------------------------------ */
/* İşlemler                                                            */
/* ------------------------------------------------------------------ */

function calistir() {
  try {
    const simGirdi = {
      nQubits: state.circuit.nQubits,
      columns: state.circuit.columns,
    };

    const t0 = performance.now();
    const sonuc = runCircuit(simGirdi, { shots: state.shots, seed: state.seed });
    const sure = performance.now() - t0;

    // Analiz katmanının devreye erişmesi için (salt okuma) iliştiriyoruz.
    sonuc._circuit = state.circuit;
    sonuc._json = JSON.stringify(serializeCircuit(state.circuit), null, 2);
    sonuc._sure = sure;
    sonuc.measurementTotal = state.shots;

    state.result = sonuc;

    // Konsol kanıtı — doğrulama için okunabilir özet
    const rapor = validateRun(sonuc, state.circuit);
    console.log(
      `[Numex Quantum] ${state.circuit.nQubits} qubit · ${gateCount(state.circuit)} kapı · ${sure.toFixed(2)} ms\n` +
      `Norm: ${sonuc.norm.toFixed(12)} · Kontroller: ${rapor.ok ? 'TÜMÜ GEÇTİ' : 'BAŞARISIZ'}\n` +
      rapor.checks.map((c) => `  ${c.ok ? '✓' : '✗'} ${c.ad}: ${c.detay}`).join('\n')
    );

    if (rapor.ok) {
      toast(`Simülasyon tamam — ${sure.toFixed(1)} ms, tüm kontroller geçti`, 'ok', 2600);
    } else {
      const hatali = rapor.checks.filter((c) => !c.ok).map((c) => c.ad).join(', ');
      toast(`Dikkat: bazı kontroller başarısız → ${hatali}`, 'warn', 4200);
    }

    yenile();
  } catch (err) {
    toast(`Simülasyon hatası: ${err.message}`, 'err', 4200);
    console.error('[Numex Quantum] Simülasyon hatası:', err);
  }
}

function qubitSayisiDegistir(n) {
  try {
    assertQubitCount(n);
  } catch (e) {
    toast(e.message, 'err');
    return;
  }
  if (state.circuit.columns.some((c) => c.gates.some((g) => g.qubits.some((q) => q >= n)))) {
    if (!confirm(`Qubit sayısını ${n} yaparsan ${n} ve üzeri qubit'lerdeki kapılar silinecek. Devam?`)) {
      sidebarBottom.qSecimYenile(state.circuit.nQubits);
      return;
    }
  }
  // Yeni devre, qubit sayısı korunarak kurulur; sığan kapılar taşınır
  const eski = state.circuit;
  const yeni = createCircuit(n);
  for (const col of eski.columns) {
    for (const g of col.gates) {
      if (g.qubits.every((q) => q < n)) {
        try {
          addGate(yeni, {
            type: g.type,
            qubits: [...g.qubits],
            params: { ...g.params },
            control: g.control ?? null,
          });
        } catch { /* sığmayan kapı atlanır */ }
      }
    }
  }
  state.circuit = yeni;
  state.result = null;
  sidebarBottom.qSecimYenile(n);
  yenile();
  toast(`Qubit sayısı ${n} yapıldı`, 'info', 2000);
}

function deneyKur(id) {
  const devre = buildExperiment(id);
  state.circuit = devre;
  state.result = null;
  sidebarBottom.qSecimYenile(devre.nQubits);
  palette.secimiTemizle();
  canvas.cnotIptal();
  yenile();
  toast(`Deney kuruldu: ${id} — "Çalıştır" tuşuna bas`, 'ok', 2800);
}

async function kaydet() {
  const json = serializeCircuitToString(state.circuit);
  const ad = `numex-quantum-${state.circuit.nQubits}q-${gateCount(state.circuit)}kapi.json`;
  dosyaIndir(json, ad);
  toast(`Devre kaydedildi: ${ad}`, 'ok', 2400);
}

async function yukle() {
  const dosya = await dosyaSec('.json');
  if (!dosya) return;
  try {
    const devre = deserializeCircuit(dosya.icerik);
    state.circuit = devre;
    state.result = null;
    sidebarBottom.qSecimYenile(devre.nQubits);
    canvas.cnotIptal();
    yenile();
    toast(`Devre yüklendi: ${dosya.ad} (${gateCount(devre)} kapı)`, 'ok', 2600);
  } catch (err) {
    toast(`Yükleme hatası: ${err.message}`, 'err', 4200);
  }
}

function temizle() {
  clearCircuit(state.circuit);
  state.result = null;
  yenile();
  toast('Devre temizlendi', 'info', 1800);
}

/* ------------------------------------------------------------------ */
/* Yeniden çizim                                                       */
/* ------------------------------------------------------------------ */

function yenile() {
  const kap = gateCount(state.circuit);
  const der = circuitDepth(state.circuit);

  headerStats.qubit.textContent = String(state.circuit.nQubits);
  headerStats.kapi.textContent = String(kap);
  headerStats.derinlik.textContent = String(der);

  const rozet = $('kanvas-rozet');
  if (rozet) rozet.textContent = kap === 0 ? 'boş' : `${kap} kapı · ${der} derinlik`;

  if (state.result) {
    const n = state.result.norm;
    headerStats.norm.textContent = n.toFixed(6);
    headerStats.norm.style.color = Math.abs(n - 1) < 1e-9 ? 'var(--ok)' : 'var(--warn)';
  } else {
    headerStats.norm.textContent = '—';
    headerStats.norm.style.color = 'var(--accent-2)';
  }

  btnCalistir.disabled = kap === 0;

  canvas.render();
  analiz.render();
  histogram.render(state.result?.histogram ?? null, state.circuit.nQubits);

  // Analiz panelini sonuca göre akıllı sekme seçimi (ilk çalıştırmada)
  if (state.result && analiz.getAktif() === 'deneyler') {
    analiz.setAktif('durum');
  }
}

/* ------------------------------------------------------------------ */
/* Kurulum                                                             */
/* ------------------------------------------------------------------ */

btnCalistir.addEventListener('click', calistir);
btnTemizle.addEventListener('click', temizle);
btnKaydet.addEventListener('click', kaydet);
btnYukle.addEventListener('click', yukle);

// Klavye kısayolları
document.addEventListener('keydown', (e) => {
  if (e.ctrlKey && e.key === 'Enter') {
    e.preventDefault();
    if (!btnCalistir.disabled) calistir();
  }
  if (e.key === 'Escape') {
    canvas.cnotIptal();
    palette.secimiTemizle();
    canvas.setSecili(null);
  }
});

// Uygulamayı DOM'a kur
const app = $('app');
app.appendChild(header);
app.appendChild(el('div', { class: 'lab-main' }, [solKol, ortaKol, analiz.root]));
app.appendChild(histogram.root);

// Başlangıç: Bell state deneyi kurulu gelsin — kullanıcı hemen çalıştırabilsin
state.circuit = buildExperiment('bell');
histogram.render(null, state.circuit.nQubits);
yenile();

console.log(
  '%cNumex Quantum Circuit Laboratory',
  'color:#22d3ee;font-weight:700;font-size:14px'
);
console.log(
  'Konsoldan erişim: window.numexQuantum.state (devre + sonuç), window.numexQuantum.calistir()'
);

// Hata ayıklama / canlı doğrulama için global erişim
window.numexQuantum = {
  state,
  calistir,
  deneyKur,
  yenile,
  get circuit() { return state.circuit; },
  get result() { return state.result; },
};
