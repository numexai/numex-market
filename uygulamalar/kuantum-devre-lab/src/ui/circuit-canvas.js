/**
 * Numex Quantum Lab — Devre tuvali.
 *
 * Sorumluluk: devreyi görselleştirmek, tıklama/sürükle-bırak ile kapı
 * eklemek, kapı silmek. MATEMATİK BURADA YAPILMAZ — sadece görselleştirme
 * ve kullanıcı niyetini motora aktarma.
 */
import { addGate, removeGate, circuitDepth } from '../circuit/circuit.js';
import { GATE_REGISTRY, gateArity } from '../core/gates.js';
import { el, toast, gateCategory, gateDisplay, aciMetni, aciliModal } from './ui-utils.js';

const SLOT_W = 56;      // CSS ile aynı olmalı (.slot width)
const QUBIT_LABEL_W = 76;

/**
 * Devre tuvali bileşeni.
 * @param {object} opts { getCircuit, onChange, onSelectGate }
 */
export function createCircuitCanvas(opts) {
  const root = el('div', { class: 'circuit-scroll' });
  const grid = el('div', { class: 'circuit-grid' });
  root.appendChild(grid);

  /** Sürükleme sırasında seçili kapı türü (paletten gelir). */
  let suruklenenTur = null;
  /** Tıklanarak seçilmiş kapı türü (palet seçimi kalıcı olabilir). */
  let seciliTur = null;

  /** Tıklama modu: 'tek' | 'cnot-cift' — CNOT için iki qubit seçimi gerekir. */
  let cnotBekleyenQubit = null;

  function setSurukle(tur) {
    suruklenenTur = tur;
  }

  function setSecili(tur) {
    seciliTur = tur;
    render();
  }

  /** Eksen: her qubit için bir satır. */
  function render() {
    const circ = opts.getCircuit();
    grid.innerHTML = '';

    const n = circ.nQubits;
    const derinlik = circuitDepth(circ);
    const sutunSayisi = Math.max(derinlik + 3, 8);

    // Sütun cetveli
    const rulle = el('div', { class: 'col-ruler' });
    for (let c = 0; c < sutunSayisi; c++) {
      rulle.appendChild(el('div', { text: String(c + 1) }));
    }
    grid.appendChild(rulle);

    // İki qubit kapılarının dikey hattı için konum kayıtları
    const hatlar = [];

    for (let q = 0; q < n; q++) {
      const row = el('div', { class: 'qubit-row' });
      row.appendChild(el('div', { class: 'wire' }));

      // Qubit etiketi
      const lbl = el('div', { class: 'qubit-label' }, [
        el('span', { class: 'qname', text: `q${q}` }),
        el('span', { class: 'qprob', text: `|0⟩` }),
      ]);
      row.appendChild(lbl);

      const slots = el('div', { class: 'slots' });

      for (let c = 0; c < sutunSayisi; c++) {
        const slot = el('div', { class: 'slot', dataset: { q: String(q), c: String(c) } });

        // Bu sütunda bu qubit'e etki eden kapı
        const kapilar = circ.columns[c]?.gates.filter((g) => g.qubits.includes(q)) ?? [];

        if (kapilar.length > 0) {
          const g = kapilar[0];
          const arity = gateArity(g.type);
          const isKontrol = g.control === q && g.type !== 'swap';
          const dusukIndeks = g.qubits[0] === q;

          if (arity === 1) {
            slot.appendChild(kapiKutusu(g, false));
          } else if (g.type === 'swap') {
            slot.appendChild(el('div', {
              class: 'swap-mark',
              text: '⇄',
              title: `SWAP q${g.qubits[0]} ↔ q${g.qubits[1]} (sil)`,
              onclick: (e) => {
                e.stopPropagation();
                silDogrula(g.id);
              },
            }));
          } else if (isKontrol) {
            slot.appendChild(el('div', {
              class: 'control-dot',
              title: `Kontrol qubit q${q}`,
              onclick: (e) => {
                e.stopPropagation();
                silDogrula(g.id);
              },
            }));
            hatlar.push({ gate: g, q, c });
          } else {
            slot.appendChild(el('div', {
              class: 'target-circle',
              title: `${g.type.toUpperCase()} hedef qubit q${q} (sil)`,
              onclick: (e) => {
                e.stopPropagation();
                silDogrula(g.id);
              },
            }, [el('span', { text: g.type === 'cnot' ? 'X' : 'Z' })]));
            hatlar.push({ gate: g, q, c });
          }
        } else {
          // Boş slot — tıklama ile kapı ekleme
          slot.addEventListener('click', () => slotTikla(q, c));
          slot.addEventListener('dragover', (e) => {
            if (!suruklenenTur) return;
            e.preventDefault();
            slot.classList.add('droppable');
            const uygun = slotUygunMu(suruklenenTur, q);
            slot.classList.add(uygun ? 'droppable-ok' : 'droppable-no');
          });
          slot.addEventListener('dragleave', () => {
            slot.classList.remove('droppable', 'droppable-ok', 'droppable-no');
          });
          slot.addEventListener('drop', async (e) => {
            e.preventDefault();
            slot.classList.remove('droppable', 'droppable-ok', 'droppable-no');
            if (!suruklenenTur) return;
            await kapiEkle(suruklenenTur, q, c);
          });
        }

        slots.appendChild(slot);
      }

      row.appendChild(slots);
      grid.appendChild(row);

      // Satır yüksekliğini kaydet (dikey hat çizimi için)
    }

    // Kontrol hatlarını çiz (slot konumlarını ölçerek)
    requestAnimationFrame(() => cizKontrolHatlarini(hatlar));

    // Boş devre mesajı
    const toplamKapi = circ.columns.reduce((a, c) => a + c.gates.length, 0);
    if (toplamKapi === 0) {
      grid.appendChild(el('div', { class: 'empty-circuit' }, [
        el('div', {}, [
          el('h3', { text: 'Devre boş — kurmaya başla' }),
          el('p', {
            text:
              'Soldaki paletten bir kapı seç ve bir qubit satırına tıkla. ' +
              'CNOT için önce kontrol qubit\'ini, sonra hedef qubit\'i seç. ' +
              'Hazır deneyler sekmesinden Bell veya GHZ\'yi tek tıkla kurabilirsin.',
          }),
        ]),
      ]));
    }
  }

  /** Tek qubit kapısı kutusu. */
  function kapiKutusu(g, kucuk) {
    const kat = gateCategory(g.type);
    const aci = g.params?.theta !== undefined ? aciMetni(g.params.theta) : null;

    const kutu = el('div', {
      class: `gate-box${kucuk ? ' small' : ''} on-wire`,
      dataset: { cat: kat, gate: g.type },
      title: `${GATE_REGISTRY[g.type]?.name ?? g.type}${aci ? ` — θ=${aci}` : ''}  |  Tıkla: parametre düzenle • Sağ tık/×: sil`,
      text: gateDisplay(g.type, g.params),
      onclick: async (e) => {
        e.stopPropagation();
        if (GATE_REGISTRY[g.type]?.parametreli) {
          await parametreDuzenle(g);
        } else {
          opts.onSelectGate?.(g);
        }
      },
    });

    if (GATE_REGISTRY[g.type]?.parametreli) {
      kutu.appendChild(el('span', { class: 'gate-params', text: aci }));
    }

    kutu.appendChild(el('button', {
      class: 'del',
      text: '\u00d7',
      title: 'Kapıyı sil',
      onclick: (e) => {
        e.stopPropagation();
        silDogrula(g.id);
      },
    }));

    return kutu;
  }

  /** İki qubit kapılarının dikey kontrol hattını DOM ölçümüyle çizer. */
  function cizKontrolHatlarini(hatlar) {
    // Aynı kapıya ait iki satırı grupla
    const gruplar = new Map();
    for (const h of hatlar) {
      const anahtar = h.gate.id;
      if (!gruplar.has(anahtar)) gruplar.set(anahtar, []);
      gruplar.get(anahtar).push(h);
    }

    for (const [, kayitlar] of gruplar) {
      if (kayitlar.length < 2) continue;
      const [a, b] = kayitlar.sort((x, y) => x.q - y.q);
      const slotA = grid.querySelector(`.slot[data-q="${a.q}"][data-c="${a.c}"]`);
      const slotB = grid.querySelector(`.slot[data-q="${b.q}"][data-c="${b.c}"]`);
      if (!slotA || !slotB) continue;

      const gridRect = grid.getBoundingClientRect();
      const rA = slotA.getBoundingClientRect();
      const rB = slotB.getBoundingClientRect();

      const x = rA.left - gridRect.left + rA.width / 2;
      const y1 = rA.top - gridRect.top + rA.height / 2;
      const y2 = rB.top - gridRect.top + rB.height / 2;

      grid.appendChild(el('div', {
        class: 'control-line',
        style: {
          left: `${x}px`,
          top: `${Math.min(y1, y2)}px`,
          height: `${Math.abs(y2 - y1)}px`,
        },
      }));
    }
  }

  /** Slot'a tıklama → kapı ekleme akışı. */
  async function slotTikla(q, c) {
    // 1) CNOT yarıda bekliyorsa: hedef seçimi
    if (cnotBekleyenQubit !== null) {
      const kaynak = cnotBekleyenQubit;
      cnotBekleyenQubit = null;
      render();
      if (kaynak === q) {
        toast('CNOT için kontrol ve hedef farklı qubit olmalı', 'warn');
        return;
      }
      await kapiEkle('cnot', [kaynak, q], c, { control: kaynak });
      return;
    }

    // 2) Paletten kapı seçiliyse
    if (seciliTur) {
      const arity = gateArity(seciliTur);
      if (arity === 1) {
        await kapiEkle(seciliTur, q, c);
      } else if (seciliTur === 'swap') {
        // SWAP: komşu qubit ile
        const hedef = q + 1 < opts.getCircuit().nQubits ? q + 1 : q - 1;
        if (hedef < 0) {
          toast('SWAP için en az 2 qubit gerekir', 'warn');
          return;
        }
        await kapiEkle('swap', [Math.min(q, hedef), Math.max(q, hedef)], c);
      } else {
        // CNOT/CZ: kontrol seçildi, hedefi bekle
        cnotBekleyenQubit = q;
        toast(`Kontrol: q${q} — şimdi hedef qubit'e tıkla`, 'info', 2600);
        render();
      }
      return;
    }

    toast('Önce soldan bir kapı seç veya sürükle', 'info', 2200);
  }

  /** Kapı ekle (tek veya iki qubit). */
  async function kapiEkle(tur, qubits, columnIndex, ekstra = {}) {
    const circ = opts.getCircuit();
    const spec = GATE_REGISTRY[tur];
    const qs = Array.isArray(qubits) ? qubits : [qubits];

    let params = {};
    if (spec.parametreli) {
      const cevap = await aciliModal({
        baslik: `${spec.label} açısı`,
        aciklama: `${spec.name} kapısı için dönme açısı (radyan cinsinden). Örn: π/2 = 1.5708`,
        varsayilan: String(Number((spec.varsayilanAci ?? Math.PI / 2).toFixed(6))),
        hizliSecenekler: [
          { etiket: 'π/4', deger: String(Math.PI / 4) },
          { etiket: 'π/2', deger: String(Math.PI / 2) },
          { etiket: 'π', deger: String(Math.PI) },
          { etiket: '0', deger: '0' },
        ],
      });
      if (cevap === null) return;
      const theta = Number(cevap);
      if (!Number.isFinite(theta)) {
        toast('Geçersiz açı — sayı gir', 'err');
        return;
      }
      params = { theta };
    }

    try {
      const g = addGate(circ, {
        type: tur,
        qubits: qs,
        params,
        columnIndex: typeof columnIndex === 'number' ? columnIndex : null,
        control: ekstra.control ?? null,
      });
      opts.onChange?.({ tip: 'ekle', gate: g });
    } catch (err) {
      toast(err.message, 'err');
    }
  }

  /** Parametreli kapının açısını düzenler (kapıyı silip yeniden ekler). */
  async function parametreDuzenle(g) {
    const spec = GATE_REGISTRY[g.type];
    const cevap = await aciliModal({
      baslik: `${spec.label} açısını düzenle`,
      aciklama: `Mevcut açı: θ = ${aciMetni(g.params.theta)} (${Number(g.params.theta).toFixed(4)} rad)`,
      varsayilan: String(g.params.theta),
      hizliSecenekler: [
        { etiket: 'π/4', deger: String(Math.PI / 4) },
        { etiket: 'π/2', deger: String(Math.PI / 2) },
        { etiket: 'π', deger: String(Math.PI) },
        { etiket: '−π/2', deger: String(-Math.PI / 2) },
      ],
    });
    if (cevap === null) return;
    const theta = Number(cevap);
    if (!Number.isFinite(theta)) {
      toast('Geçersiz açı', 'err');
      return;
    }
    const circ = opts.getCircuit();
    const qubits = [...g.qubits];
    // Aynı sütun indeksini bul
    let colIdx = 0;
    circ.columns.forEach((col, i) => {
      if (col.gates.some((x) => x.id === g.id)) colIdx = i;
    });
    removeGate(circ, g.id);
    try {
      addGate(circ, { type: g.type, qubits, params: { theta }, columnIndex: colIdx });
      opts.onChange?.({ tip: 'guncelle' });
    } catch (err) {
      toast(err.message, 'err');
    }
  }

  /** Kapı silme — kullanıcıya sormadan sil (× butonu zaten bilinçli tıklama). */
  function silDogrula(gateId) {
    const circ = opts.getCircuit();
    if (removeGate(circ, gateId)) {
      opts.onChange?.({ tip: 'sil' });
    }
  }

  /** Sürüklenen kapı bu qubite konabilir mi (sadece görsel ipucu). */
  function slotUygunMu(tur, q) {
    if (tur === 'swap') return opts.getCircuit().nQubits > 1;
    if (gateArity(tur) === 2) return true; // kontrol/hedef ikinci tıklamada
    return true;
  }

  return {
    root,
    render,
    setSurukle,
    setSecili,
    getSecili: () => seciliTur,
    cnotIptal() {
      cnotBekleyenQubit = null;
      render();
    },
  };
}
