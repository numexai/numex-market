// SVG harita çizimi, sürükleme, seçim, akış animasyonu
const NS = 'http://www.w3.org/2000/svg';
const el = (ad, nit = {}) => {
  const e = document.createElementNS(NS, ad);
  for (const k in nit) e.setAttribute(k, nit[k]);
  return e;
};

export function ekranDonusum(olay, svgEl) {
  const p = svgEl.createSVGPoint();
  p.x = olay.clientX; p.y = olay.clientY;
  const m = svgEl.getScreenCTM();
  if (!m) return { x: 0, y: 0 };
  const r = p.matrixTransform(m.inverse());
  return { x: r.x, y: r.y };
}

export function haritaCiz(svgEl, durum, plan) {
  svgEl.innerHTML = '';
  const gYol = el('g', { class: 'katman-yol' });
  const gRota = el('g', { class: 'katman-rota' });
  const gBolg = el('g', { class: 'katman-bolge' });
  const gAlan = el('g', { class: 'katman-alan' });
  const gKavs = el('g', { class: 'katman-kavsak' });
  const gArac = el('g', { class: 'katman-arac' });
  svgEl.append(gYol, gRota, gBolg, gAlan, gKavs, gArac);
  yollariCiz(gYol, durum);
  if (plan) rotalariCiz(gRota, durum, plan);
  bolgeleriCiz(gBolg, durum);
  alanlariCiz(gAlan, durum);
  kavsaklariCiz(gKavs, durum);
  araclariCiz(gArac, durum);
  akisAnimasyonuBaslat(svgEl);
  return svgEl;
}

function kavsakXY(durum, id) {
  const k = durum.sehir.kavsaklar.find(x => x.id === id);
  return k ? { x: k.x, y: k.y } : { x: 0, y: 0 };
}

export function yollariCiz(kap, durum) {
  for (const y of durum.sehir.yollar) {
    const a = kavsakXY(durum, y.a), b = kavsakXY(durum, y.b);
    const cizgi = el('line', {
      x1: a.x, y1: a.y, x2: b.x, y2: b.y,
      class: 'yol' + (y.kapali ? ' kapali' : '') + (durum.seciliYol === y.id ? ' secili' : ''),
      'data-yol': y.id, 'stroke-width': y.kapali ? 3 : 6,
    });
    const baslik = el('title');
    baslik.textContent = `${y.id} · ${y.uzunluk} km · ${y.sure} dk · kapasite ${y.kapasite}${y.kapali ? ' · KAPALI' : ''}`;
    cizgi.appendChild(baslik);
    kap.appendChild(cizgi);
  }
}

export function rotalariCiz(kap, durum, plan) {
  const renkler = ['#22d3ee', '#38bdf8', '#a78bfa', '#f472b6', '#34d399', '#fbbf24'];
  plan.atamalar.forEach((at, i) => {
    if (!at.rota || at.rota.length < 2) return;
    const noktalar = at.rota.map(id => { const p = kavsakXY(durum, id); return `${p.x},${p.y}`; }).join(' ');
    kap.appendChild(el('polyline', {
      points: noktalar, class: 'rota-cizgi akis', stroke: renkler[i % renkler.length],
    }));
  });
}

export function bolgeleriCiz(kap, durum) {
  for (const b of durum.sehir.bolgeler) {
    const p = kavsakXY(durum, b.kavsakId);
    const g = el('g', { class: 'bolge', 'data-bolge': b.id });
    g.appendChild(el('rect', { x: p.x - 26, y: p.y - 46, width: 52, height: 20, rx: 5, class: 'bolge-kutu' }));
    const t = el('text', { x: p.x, y: p.y - 32, class: 'bolge-yazi' });
    t.textContent = `${b.ad} · ${b.nufus}`;
    g.appendChild(t);
    kap.appendChild(g);
  }
}

export function alanlariCiz(kap, durum) {
  for (const a of durum.sehir.alanlar) {
    const p = kavsakXY(durum, a.kavsakId);
    const dolu = (durum.plan && durum.plan.alanDoluluk[a.id]) || 0;
    const g = el('g', { class: 'alan', 'data-alan': a.id });
    g.appendChild(el('circle', { cx: p.x, cy: p.y, r: 14, class: 'alan-halka' }));
    const t = el('text', { x: p.x, y: p.y + 32, class: 'alan-yazi' });
    t.textContent = `${a.ad} ${dolu}/${a.kapasite}`;
    g.appendChild(t);
    kap.appendChild(g);
  }
}

export function kavsaklariCiz(kap, durum) {
  for (const k of durum.sehir.kavsaklar) {
    kap.appendChild(el('circle', { cx: k.x, cy: k.y, r: 5, class: 'kavsak', 'data-kavsak': k.id }));
  }
  for (const h of durum.sehir.hastaneler) {
    const p = kavsakXY(durum, h.kavsakId);
    const g = el('g', { class: 'hastane' });
    g.appendChild(el('rect', { x: p.x - 9, y: p.y - 9, width: 18, height: 18, rx: 4, class: 'hastane-kutu' }));
    kap.appendChild(g);
  }
}

export function araclariCiz(kap, durum) {
  for (const a of durum.sehir.araclar) {
    const p = a.konum || kavsakXY(durum, a.kavsakId);
    kap.appendChild(el('circle', { cx: p.x, cy: p.y, r: 7, class: 'arac', 'data-arac': a.id }));
  }
}

export function rotaCiz(svgEl, rota, renk = '#22d3ee') {
  const durum = svgEl.__durum;
  if (!durum) return null;
  const noktalar = rota.map(id => { const p = kavsakXY(durum, id); return `${p.x},${p.y}`; }).join(' ');
  const c = el('polyline', { points: noktalar, class: 'rota-cizgi', stroke: renk });
  svgEl.appendChild(c);
  return c;
}

export function akisAnimasyonuBaslat(svgEl) {
  svgEl.classList.add('akis-acik');
  for (const s of svgEl.querySelectorAll('.akis')) s.classList.add('akis-acik');
}
export function akisAnimasyonuDurdur(svgEl) {
  if (!svgEl) return;
  svgEl.classList.remove('akis-acik');
  for (const s of svgEl.querySelectorAll('.akis')) s.classList.remove('akis-acik');
}

export function suruklemeBagla(svgEl, durum, geriCagri) {
  let suruklenen = null;
  svgEl.addEventListener('pointerdown', (e) => {
    const t = e.target.closest('[data-kavsak]');
    if (!t) return;
    suruklenen = t.getAttribute('data-kavsak');
    svgEl.setPointerCapture(e.pointerId);
  });
  svgEl.addEventListener('pointermove', (e) => {
    if (!suruklenen) return;
    const p = ekranDonusum(e, svgEl);
    const k = durum.sehir.kavsaklar.find(x => x.id === suruklenen);
    if (k) { k.x = Math.max(20, Math.min(740, p.x)); k.y = Math.max(20, Math.min(620, p.y)); }
    if (geriCagri) geriCagri();
  });
  const bitir = () => { suruklenen = null; };
  svgEl.addEventListener('pointerup', bitir);
  svgEl.addEventListener('pointercancel', bitir);
}

export function yolTiklamaBagla(svgEl, geriCagri) {
  svgEl.addEventListener('click', (e) => {
    const t = e.target.closest('[data-yol]');
    if (!t) return;
    geriCagri(t.getAttribute('data-yol'));
  });
}
