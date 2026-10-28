/**
 * Numex Quantum Lab — Analiz paneli.
 *
 * Durum vektörünü basis state / kompleks genlik / olasılık yüzdesi / faz açısı
 * olarak tablolar; simülasyonun doğruluk kontrollerini (norm, olasılık toplamı,
 * boyut, kontrol-hedef) listeler; dolanıklık entropisini gösterir.
 *
 * Hesaplama BURADA yapılmaz — src/analysis/validators.js sonuçlarını sunar.
 */
import { analyze, validateRun, checkBellState, checkGhzState } from '../analysis/validators.js';
import { EXPERIMENTS } from '../circuit/circuit.js';
import { el, num, pct, derece } from './ui-utils.js';

/**
 * @param {object} opts { getResult, getCircuit, onKapiSec, onDeneyKur }
 */
export function createAnalysisPanel(opts) {
  const root = el('div', { class: 'lab-col' });

  // Sekmeler
  const sekmeler = [
    { id: 'durum', ad: 'Durum Vektörü' },
    { id: 'kontrol', ad: 'Doğrulama' },
    { id: 'devre', ad: 'Devre' },
    { id: 'deneyler', ad: 'Deneyler' },
  ];
  let aktif = 'durum';

  const tabBar = el('div', { class: 'tabs' });
  const body = el('div', { class: 'panel-body' });

  function sekmeleriCiz() {
    tabBar.innerHTML = '';
    for (const s of sekmeler) {
      tabBar.appendChild(el('button', {
        class: `tab${aktif === s.id ? ' active' : ''}`,
        text: s.ad,
        onclick: () => {
          aktif = s.id;
          render();
        },
      }));
    }
  }

  function render() {
    sekmeleriCiz();
    body.innerHTML = '';
    const res = opts.getResult();

    if (aktif === 'durum') renderDurum(body, res);
    else if (aktif === 'kontrol') renderKontrol(body, res);
    else if (aktif === 'devre') renderDevre(body, res);
    else renderDeneyler(body);
  }

  return { root, render, tabBar, body, setAktif: (v) => { aktif = v; render(); }, getAktif: () => aktif };
}

/* ------------------------------------------------------------------ */
/* Durum Vektörü sekmesi                                               */
/* ------------------------------------------------------------------ */

function renderDurum(body, res) {
  const circ = null;

  if (!res) {
    body.appendChild(bosMesaj(
      'Henüz simülasyon çalıştırılmadı',
      'Devreyi kurup "Çalıştır" tuşuna bas. Durum vektörü, olasılıklar ve faz açıları burada görünecek.'
    ));
    return;
  }

  const a = analyze(res, res._circuit);

  // Üst istatistik kartları
  body.appendChild(el('div', { class: 'stat-grid' }, [
    kart('Qubit', String(a.nQubits)),
    kart('Boyut (2^n)', `${a.dim}`),
    kart('Aktif durum', `${a.aktifDurumSayisi} / ${a.dim}`),
    kart('Norm ‖ψ‖', num(a.norm, 6), Math.abs(a.norm - 1) < 1e-9 ? 'ok' : 'warn'),
  ]));

  // Durum vektörü tablosu
  body.appendChild(el('div', { class: 'section-title', text: 'Durum Vektörü (|ψ⟩ = Σ αᵢ|i⟩)' }));

  const table = el('table', { class: 'state-table' });
  table.appendChild(el('thead', {}, [
    el('tr', {}, [
      el('th', { text: 'Basis' }),
      el('th', { text: 'Kompleks genlik' }),
      el('th', { text: 'Olasılık' }),
      el('th', { text: 'Faz' }),
    ]),
  ]));

  const tbody = el('tbody');
  if (a.satirlar.length === 0) {
    tbody.appendChild(el('tr', {}, [
      el('td', { colspan: '4', text: 'Hiç genlik yok — devre boş olabilir.', style: { color: 'var(--text-faint)', padding: '12px 7px' } }),
    ]));
  }
  for (const s of a.satirlar) {
    tbody.appendChild(el('tr', {}, [
      el('td', {}, [el('span', { class: 'basis-tag', text: s.label })]),
      el('td', { class: 'amp-cell', text: s.amplitudeText }),
      el('td', {}, [
        el('div', { class: 'prob-bar-wrap' }, [
          el('div', { class: 'prob-bar' }, [
            el('i', { style: { width: `${Math.max(s.probabilityPercent, 0.6)}%` } }),
          ]),
          el('span', { class: 'prob-pct', text: pct(s.probability, 2) }),
        ]),
      ]),
      el('td', {}, [
        el('span', {
          class: 'phase-pill',
          text: s.phaseDeg === 0 ? '0°' : derece(s.phaseRad),
          title: `${s.phaseRad.toFixed(6)} rad`,
        }),
      ]),
    ]));
  }
  table.appendChild(tbody);
  body.appendChild(table);

  // Olasılık toplamı
  body.appendChild(el('div', { class: 'section-title', text: 'Normalizasyon' }));
  body.appendChild(el('div', { class: 'stat-grid' }, [
    kart('Σ|α|²', num(a.totalProbability, 9), Math.abs(a.totalProbability - 1) < 1e-9 ? 'ok' : 'warn'),
    kart('Norm kare', num(a.norm * a.norm, 9), Math.abs(a.norm * a.norm - 1) < 1e-9 ? 'ok' : 'warn'),
  ]));

  // Dolanıklık entropisi
  body.appendChild(el('div', { class: 'section-title', text: 'Dolanıklık entropisi (qubit bazında)' }));
  const entWrap = el('div');
  for (const e of a.dolaniklik) {
    entWrap.appendChild(el('div', { class: 'entropy-row' }, [
      el('span', { class: 'lbl', text: `q${e.qubit}` }),
      el('div', { class: 'entropy-bar' }, [
        el('i', { style: { width: `${(e.entropi / 1) * 100}%` } }),
      ]),
      el('span', { class: 'entropy-val', text: `${e.entropi.toFixed(3)} bit` }),
    ]));
  }
  body.appendChild(entWrap);
  body.appendChild(el('p', {
    text: 'S = 0 ayrışabilir (dolanık değil), S = 1 maksimal dolanık (Bell durumu).',
    style: { fontSize: '10.5px', color: 'var(--text-faint)', marginTop: '6px', lineHeight: '1.5' },
  }));
}

/* ------------------------------------------------------------------ */
/* Doğrulama sekmesi                                                   */
/* ------------------------------------------------------------------ */

function renderKontrol(body, res) {
  if (!res) {
    body.appendChild(bosMesaj(
      'Doğrulama için simülasyon gerekli',
      'Devreyi çalıştırdığında norm korunumu, boyut doğruluğu ve kontrol-hedef rolleri burada denetlenir.'
    ));
    return;
  }

  const rapor = validateRun(res, res._circuit);

  // Genel durum
  body.appendChild(el('div', {
    class: 'stat-grid',
    style: { gridTemplateColumns: '1fr' },
  }, [
    kart('Genel sonuç', rapor.ok ? 'TÜM KONTROLLER GEÇTİ' : 'BAZI KONTROLLER BAŞARISIZ',
      rapor.ok ? 'ok' : 'warn'),
  ]));

  body.appendChild(el('div', { class: 'section-title', text: `Temel doğruluk kontrolleri (${rapor.checks.length})` }));

  const liste = el('div', { class: 'check-list' });
  for (const c of rapor.checks) {
    liste.appendChild(el('div', { class: `check-item ${c.ok ? 'pass' : 'fail'}` }, [
      el('span', { class: 'check-icon', text: c.ok ? '\u2713' : '\u2717' }),
      el('div', { class: 'check-body' }, [
        el('div', { class: 'check-name', text: c.ad }),
        el('div', { class: 'check-detail', text: c.detay }),
      ]),
    ]));
  }
  body.appendChild(liste);

  // Deneye özgü beklenen sonuç kontrolü
  const beklenenler = deneyBeklenenKontroller(res);
  if (beklenenler.length) {
    body.appendChild(el('div', { class: 'section-title', text: 'Beklenen sonuç karşılaştırması' }));
    const l2 = el('div', { class: 'check-list' });
    for (const c of beklenenler) {
      l2.appendChild(el('div', { class: `check-item ${c.ok ? 'pass' : 'fail'}` }, [
        el('span', { class: 'check-icon', text: c.ok ? '\u2713' : '\u2717' }),
        el('div', { class: 'check-body' }, [
          el('div', { class: 'check-name', text: c.ad }),
          el('div', { class: 'check-detail', text: c.detay }),
        ]),
      ]));
    }
    body.appendChild(l2);
  } else {
    body.appendChild(el('p', {
      text: 'Bu devre bilinen bir hazır deneyle örtüşmüyor — yalnızca genel matematiksel değişmezler denetlendi.',
      style: { fontSize: '10.5px', color: 'var(--text-faint)', marginTop: '10px', lineHeight: '1.5' },
    }));
  }

  // Ölçüm kontrolü
  if (res.measurementTotal !== undefined || res.histogram) {
    body.appendChild(el('div', { class: 'section-title', text: 'Ölçüm bütünlüğü' }));
    const h = res.histogram;
    const satirlar = [];
    if (h) {
      const toplam = h.counts.reduce((a, b) => a + b, 0);
      satirlar.push(['Ölçüm sayısı (shot)', String(h.shots)]);
      satirlar.push(['Sayılan toplam', String(toplam)]);
      satirlar.push(['Simetri', toplam === h.shots ? 'TAM (%100)' : 'UYUŞMAZLIK VAR']);
      satirlar.push(['Sıfır olmayan sonuç', `${h.counts.filter((c) => c > 0).length} adet`]);
    }
    for (const [k, v] of satirlar) {
      body.appendChild(el('div', { class: 'gate-list-row' }, [
        el('span', { class: 'gname', text: k, style: { minWidth: '130px' } }),
        el('span', { class: 'gq', text: v }),
      ]));
    }
  }
}

/** Devre, bilinen bir hazır deneyle eşleşiyorsa beklenen sonucu doğrular. */
function deneyBeklenenKontroller(res) {
  const circ = res._circuit;
  if (!circ) return [];
  const sonuclar = [];
  const desen = devreDeseni(circ);

  for (const exp of EXPERIMENTS) {
    const refDesen = devreDeseni(exp.kur());
    if (desen === refDesen) {
      if (exp.id === 'bell') sonuclar.push(checkBellState(res.state));
      else if (exp.id === 'ghz3') sonuclar.push(checkGhzState(res.state, 3));
      else if (exp.id === 'ghz4') sonuclar.push(checkGhzState(res.state, 4));
      else if (exp.id === 'superposition') {
        sonuclar.push(basitKontrol(
          'Süperpozisyon: |α₀|² = |α₁|² = 0.5',
          Math.abs(Math.abs(res.state[0].re) ** 2 - 0.5) < 1e-6 &&
          Math.abs(Math.abs(res.state[1].re) ** 2 - 0.5) < 1e-6,
          `|α₀|²=${(Math.abs(res.state[0].re) ** 2).toFixed(6)}, |α₁|²=${(Math.abs(res.state[1].re) ** 2).toFixed(6)}`
        ));
      } else if (exp.id === 'hadamard-measurement') {
        sonuclar.push(basitKontrol(
          'H·H = I → %100 |0⟩ dönüşü',
          Math.abs(res.state[0].re - 1) < 1e-9,
          `α₀ = ${res.state[0].re.toFixed(9)}`
        ));
      }
      break;
    }
  }
  return sonuclar;
}

function basitKontrol(ad, ok, detay) {
  return { id: ad, ad, ok, detay };
}

/** Devreyi karşılaştırılabilir bir metin imzasına çevirir. */
function devreDeseni(circ) {
  return circ.columns
    .flatMap((c) => c.gates)
    .map((g) => `${g.type}:${g.qubits.join(',')}:${g.control ?? ''}`)
    .join('|');
}

/* ------------------------------------------------------------------ */
/* Devre sekmesi                                                       */
/* ------------------------------------------------------------------ */

function renderDevre(body, res) {
  const circ = res?._circuit ?? null;
  if (!circ) {
    body.appendChild(bosMesaj('Devre yok', 'Sol panelden kapı ekleyerek başla.'));
    return;
  }

  const kapilar = circ.columns.flatMap((c, ci) => c.gates.map((g) => ({ ...g, sutun: ci })));

  body.appendChild(el('div', { class: 'stat-grid' }, [
    kart('Qubit', String(circ.nQubits)),
    kart('Kapı', String(kapilar.length)),
    kart('Derinlik', String(circ.columns.filter((c) => c.gates.length > 0).length)),
    kart('Sütun', String(circ.columns.length)),
  ]));

  body.appendChild(el('div', { class: 'section-title', text: `Kapı listesi (${kapilar.length})` }));
  const liste = el('div', { class: 'gate-list' });

  if (kapilar.length === 0) {
    liste.appendChild(el('p', { text: 'Henüz kapı yok.', style: { color: 'var(--text-faint)', fontSize: '12px' } }));
  }

  kapilar.forEach((g, i) => {
    const step = res?.steps?.[i];
    liste.appendChild(el('div', {
      class: 'gate-list-row',
      title: 'Bu kapıyı seçmek için tıkla',
      style: { cursor: 'pointer' },
      onclick: () => opts?.onKapiSec?.(g),
    }, [
      el('span', { class: 'idx', text: `${i + 1}.` }),
      el('span', { class: 'gname', text: g.type.toUpperCase() }),
      el('span', { class: 'gq', text: `q[${g.qubits.join(', ')}]${g.control !== undefined && g.control !== g.qubits[0] ? ` (kontrol q${g.control})` : ''}` }),
      g.params?.theta !== undefined
        ? el('span', { class: 'gtime', text: `θ=${g.params.theta.toFixed(4)}` })
        : null,
      step ? el('span', { class: 'gtime', text: `${step.ms.toFixed(2)} ms` }) : null,
    ]));
  });
  body.appendChild(liste);

  // JSON görünümü
  body.appendChild(el('div', { class: 'section-title', text: 'Devre JSON (kaydet/yükle biçimi)' }));
  body.appendChild(el('pre', {
    text: res?._json ?? '',
    style: {
      fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--text-dim)',
      background: 'var(--bg-2)', padding: '10px', borderRadius: '6px',
      overflow: 'auto', maxHeight: '280px', border: '1px solid var(--border)',
      lineHeight: '1.5',
    },
  }));
}

/* ------------------------------------------------------------------ */
/* Deneyler sekmesi                                                    */
/* ------------------------------------------------------------------ */

function renderDeneyler(body) {
  body.appendChild(el('p', {
    text: 'Hazır deneyler gerçek kuantum devreleri kurar — hesaplanmış sonuç değil, simülasyonla üretilir.',
    style: { fontSize: '11.5px', color: 'var(--text-faint)', marginBottom: '12px', lineHeight: '1.55' },
  }));

  const liste = el('div', { class: 'experiment-list' });
  for (const exp of EXPERIMENTS) {
    liste.appendChild(el('button', {
      class: 'exp-btn',
      onclick: () => optsKur(exp.id),
    }, [
      el('div', { class: 'exp-name', text: exp.ad }),
      el('div', { class: 'exp-desc', text: exp.aciklama }),
      el('div', { class: 'exp-expect', text: `Beklenen: ${exp.beklenen}` }),
    ]));
  }
  body.appendChild(liste);
}

/* ------------------------------------------------------------------ */
/* Ortak yardımcılar                                                   */
/* ------------------------------------------------------------------ */

function kart(k, v, tip) {
  return el('div', { class: 'stat-card' }, [
    el('div', { class: 'k', text: k }),
    el('div', { class: `v${tip ? ' ' + tip : ''}`, text: v }),
  ]);
}

function bosMesaj(baslik, aciklama) {
  return el('div', {
    style: { textAlign: 'center', padding: '40px 16px', color: 'var(--text-faint)' },
  }, [
    el('div', { text: baslik, style: { fontSize: '13px', fontWeight: '600', color: 'var(--text-dim)', marginBottom: '6px' } }),
    el('div', { text: aciklama, style: { fontSize: '11.5px', lineHeight: '1.6' } }),
  ]);
}

// Deney kurma callback'i — createAnalysisPanel dışından atanır
let optsKur = () => {};
export function setDeneyKurHandler(fn) {
  optsKur = fn;
}
