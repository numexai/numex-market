/**
 * Numex Quantum Lab — Kapı paleti (sol kolon).
 *
 * Kapıları kategorilere göre gruplayıp sürükle-bırak / tıkla-seç
 * etkileşimini kurar. Kapı tanımları GATE_REGISTRY'den gelir — UI ve motor
 * tek kaynaktan beslenir.
 */
import { GATE_REGISTRY } from '../core/gates.js';
import { EXPERIMENTS } from '../circuit/circuit.js';
import { el, gateCategory } from './ui-utils.js';

/** Palet grupları — sıralama bilinçli: sık kullanılan üstte. */
const GRUPLAR = [
  { ad: 'Pauli', turler: ['x', 'y', 'z'] },
  { ad: 'Süperpozisyon', turler: ['h'] },
  { ad: 'Faz', turler: ['s', 't'] },
  { ad: 'Dönme (parametreli)', turler: ['rx', 'ry', 'rz'] },
  { ad: 'Dolanıklık', turler: ['cnot', 'cz'] },
  { ad: 'Değiş Tokuş', turler: ['swap'] },
  { ad: 'Referans', turler: ['i'] },
];

/**
 * @param {object} opts {
 *   onGateSelect: (tur) => void,   // paletten seçim (tıkla)
 *   onGateDragStart: (tur) => void,
 *   onGateDragEnd: () => void,
 *   onDeney: (id) => void,
 *   onQubitChange: (n) => void,
 *   getQubitCount: () => number,
 *   getSeciliTur: () => string|null,
 * }
 */
export function createGatePalette(opts) {
  const root = el('div', { class: 'lab-col' });

  const head = el('div', { class: 'panel-head' }, [
    el('h2', { text: 'Kapı Paleti' }),
    el('span', { class: 'badge', text: 'sürükle / tıkla' }),
  ]);

  const body = el('div', { class: 'panel-body' });

  // Kapı grupları
  for (const grup of GRUPLAR) {
    const g = el('div', { class: 'gate-group' });
    g.appendChild(el('div', { class: 'gate-group-title', text: grup.ad }));

    const grid = el('div', { class: 'gate-grid' });
    for (const tur of grup.turler) {
      const spec = GATE_REGISTRY[tur];
      if (!spec) continue;

      const btn = el('button', {
        class: 'gate-btn',
        draggable: 'true',
        dataset: { cat: gateCategory(tur), gate: tur },
        title: `${spec.name} — ${spec.description}\n${spec.arity} qubit`,
      }, [
        el('span', { class: 'gate-symbol', text: tur.toUpperCase() }),
        el('span', { class: 'gate-sub', text: spec.arity === 2 ? `${spec.arity}q` : spec.name.split(' ')[0] }),
      ]);

      btn.addEventListener('click', () => {
        opts.onGateSelect?.(tur);
        vurgula(tur);
      });

      btn.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', tur);
        e.dataTransfer.effectAllowed = 'copy';
        btn.classList.add('dragging');
        opts.onGateDragStart?.(tur);
      });
      btn.addEventListener('dragend', () => {
        btn.classList.remove('dragging');
        opts.onGateDragEnd?.();
      });

      grid.appendChild(btn);
    }
    g.appendChild(grid);
    body.appendChild(g);
  }

  function vurgula(tur) {
    for (const b of body.querySelectorAll('.gate-btn')) {
      b.classList.toggle('selected', b.dataset.gate === tur);
    }
  }

  function secimiTemizle() {
    for (const b of body.querySelectorAll('.gate-btn')) b.classList.remove('selected');
  }

  return { root, vurgula, secimiTemizle, head, body };
}

/**
 * Sol panelin alt bölümü: hazır deneyler + qubit sayısı.
 * Palet ile aynı kolonda alt alta durur.
 */
export function createSidebarBottom(opts) {
  const root = el('div', { class: 'panel-body', style: { flex: '0 0 auto', borderTop: '1px solid var(--border)', maxHeight: '46%' } });

  // Qubit sayısı
  const qSecim = el('select', {
    onchange: (e) => opts.onQubitChange?.(Number(e.target.value)),
  });
  for (let n = 1; n <= 8; n++) {
    qSecim.appendChild(el('option', { value: String(n), text: `${n} qubit`, selected: n === opts.getQubitCount() }));
  }

  root.appendChild(el('div', { class: 'gate-group-title', text: 'Qubit sayısı (1–8)' }));
  root.appendChild(el('div', { class: 'field', style: { marginBottom: '16px' } }, [qSecim]));

  // Hazır deneyler
  root.appendChild(el('div', { class: 'gate-group-title', text: 'Hazır deneyler' }));
  const liste = el('div', { class: 'experiment-list' });
  for (const exp of EXPERIMENTS) {
    liste.appendChild(el('button', {
      class: 'exp-btn',
      title: exp.aciklama,
      onclick: () => opts.onDeney?.(exp.id),
    }, [
      el('div', { class: 'exp-name', text: exp.ad }),
      el('div', { class: 'exp-expect', text: exp.beklenen }),
    ]));
  }
  root.appendChild(liste);

  return { root, qSecimYenile: (n) => { qSecim.value = String(n); } };
}
