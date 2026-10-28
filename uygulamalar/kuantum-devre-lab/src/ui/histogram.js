/**
 * Numex Quantum Lab — Ölçüm histogramı paneli.
 *
 * runCircuit'in ürettiği GERÇEK ölçüm sayımlarını (|genlik|² dağılımından
 * CDF ile örneklenmiş) çubuk grafiğe döker. Burada hiçbir olasılık
 * yeniden hesaplanmaz, uydurulmaz.
 */
import { el, pct } from './ui-utils.js';

export function createHistogramPanel() {
  const root = el('div', { class: 'histogram-panel' });

  const meta = el('span', { class: 'meta', text: 'ölçüm yok' });
  const toggle = el('span', { class: 'hist-toggle', text: '▾' });

  const head = el('div', {
    class: 'hist-head',
    onclick: () => {
      root.classList.toggle('collapsed');
      toggle.textContent = root.classList.contains('collapsed') ? '▸' : '▾';
    },
  }, [
    el('h2', { text: 'Ölçüm Histogramı' }),
    meta,
    toggle,
  ]);

  const body = el('div', { class: 'hist-body' });
  root.appendChild(head);
  root.appendChild(body);

  /**
   * Histogramı çizer.
   * @param {object|null} histogram sampleHistogram çıktısı { counts, shots, probabilities, labels }
   * @param {number} nQubits
   */
  function render(histogram, nQubits) {
    body.innerHTML = '';

    if (!histogram) {
      meta.textContent = 'ölçüm yok';
      body.appendChild(el('div', { class: 'hist-empty' }, [
        el('div', {}, [
          el('div', { text: 'Devreyi çalıştır ve ölçüm tekrarı seç', style: { marginBottom: '4px' } }),
          el('div', {
            text: 'Her çubuk, |genlik|² dağılımından gerçek örnekleme ile üretilir.',
            style: { fontSize: '10.5px', opacity: 0.75 },
          }),
        ]),
      ]));
      return;
    }

    const enBuyuk = Math.max(...histogram.counts, 1);
    const sifirOlmayan = histogram.counts.filter((c) => c > 0).length;
    meta.textContent = `${histogram.shots} ölçüm · ${sifirOlmayan} farklı sonuç · ${histogram.counts.length} basis`;

    const bars = el('div', { class: 'hist-bars' });

    for (let i = 0; i < histogram.counts.length; i++) {
      const sayi = histogram.counts[i];
      const oran = sayi / histogram.shots;
      const yukseklik = (sayi / enBuyuk) * 100;
      const beklenenOlasilik = histogram.probabilities[i];

      const bar = el('div', {
        class: `hist-bar${sayi === 0 ? ' zero' : ''}`,
        style: { height: `${Math.max(yukseklik, sayi > 0 ? 2 : 1.5)}%` },
        title:
          `|${histogram.labels[i]}⟩\n` +
          `Ölçülen: ${sayi} / ${histogram.shots} (${pct(oran, 2)})\n` +
          `Teorik: ${pct(beklenenOlasilik, 2)}`,
      });

      bars.appendChild(el('div', { class: 'hist-bar-wrap' }, [
        el('span', { class: 'hist-count', text: sayi > 0 ? String(sayi) : '' }),
        bar,
        el('span', { class: 'hist-label', text: `|${histogram.labels[i]}⟩` }),
      ]));
    }

    // Çok dar olduğunda yatay kaydırma için sarmalayıcı
    const sarmal = el('div', { style: { minWidth: 'min-content', paddingBottom: '4px' } }, [bars]);
    body.appendChild(sarmal);
  }

  return { root, render };
}
