// Operasyon paneli: KPI kartları, bölge doluluk çubukları, vinç anahtarları
import { computeStats } from '../engine/sim.js';
import { zoneFill, zoneUsed } from '../model/yard.js';
import { fmtPct, fmtTime } from '../util.js';
import { STATUS, TYPES } from '../config.js';

let bound = false;

export function initPanel(world, handlers) {
  bindControls(handlers);
  renderPanel(world);
}

function $(id) {
  return document.getElementById(id);
}

export function bindControls(handlers) {
  if (bound) return;
  bound = true;
  const b = handlers || {};
  $('btn-start')?.addEventListener('click', () => b.onStart && b.onStart());
  $('btn-pause')?.addEventListener('click', () => b.onPause && b.onPause());
  $('btn-reset')?.addEventListener('click', () => b.onReset && b.onReset());
  // NUMEX-DÜZELTME (2026-11-20): Kaydırıcı değeri 0..3 indeks iken doğrudan çarpan sanılıyordu; hız hiçbir zaman 1×'in üstüne çıkmıyordu.
  $('speed')?.addEventListener('input', (e) => {
    // Kaydırıcı 0..3 indeks verir → SPEEDS[0.5,1,2,4]
    const idx = parseInt(e.target.value, 10) || 0;
    const mult = [0.5, 1, 2, 4][Math.max(0, Math.min(3, idx))];
    if (b.onSpeed) b.onSpeed(mult);
  });
  $('scenario')?.addEventListener('change', (e) => b.onScenario && b.onScenario(e.target.value));
  $('btn-json-save')?.addEventListener('click', () => b.onSaveJSON && b.onSaveJSON());
  $('file-load')?.addEventListener('change', (e) => {
    const f = e.target.files && e.target.files[0];
    if (f && b.onLoadJSON) b.onLoadJSON(f);
  });
  $('btn-csv')?.addEventListener('click', () => b.onCSV && b.onCSV());
  $('btn-png')?.addEventListener('click', () => b.onPNG && b.onPNG());
  $('btn-summary')?.addEventListener('click', () => b.onSummary && b.onSummary());
  $('btn-tests')?.addEventListener('click', () => b.onTests && b.onTests());
}

function statCard(label, value, cls) {
  return `<div class="kpi ${cls || ''}"><span class="kpi-label">${label}</span><span class="kpi-value">${value}</span></div>`;
}

export function renderKPIs(world) {
  const el = $('kpis');
  if (!el) return;
  const s = computeStats(world);
  el.innerHTML = [
    statCard('Bekleyen', s.pending, s.pending > 20 ? 'warn' : ''),
    statCard('Sahada', s.inYard, 'ok'),
    statCard('Taşınıyor', s.moving, 'mid'),
    statCard('Tamamlanan', s.completed, 'ok'),
    statCard('Ort. İşlem', s.avg ? s.avg.toFixed(1) + 's' : '—'),
    statCard('Tahmini Bitiş', s.eta != null ? '+' + fmtTime(s.eta) : '—'),
    statCard('Vinç Kullanımı', fmtPct(s.craneAvg), 'mid'),
    statCard('Saha Aracı', fmtPct(s.transportAvg), 'mid'),
  ].join('');
}

export function renderZones(world) {
  const el = $('zones');
  if (!el) return;
  el.innerHTML = world.zones
    .map((z) => {
      const f = zoneFill(z);
      const cls = f > 0.95 ? 'full' : f > 0.7 ? 'high' : 'normal';
      return `<div class="zone-row ${cls}">
        <div class="zone-head"><b>${z.id}</b> <span>${z.label}</span>
          <em>${zoneUsed(z)}/${z.capacity} · ${fmtPct(f)}</em></div>
        <div class="bar"><i style="width:${Math.min(100, f * 100)}%"></i></div>
      </div>`;
    })
    .join('');
}

export function renderCranes(world) {
  const el = $('cranes');
  if (!el) return;
  el.innerHTML = world.cranes
    .map(
      (c) => `<div class="crane-row ${c.on ? '' : 'off'}">
        <label class="sw"><input type="checkbox" data-crane="${c.id}" ${c.on ? 'checked' : ''}><span>${c.id}</span></label>
        <span class="crane-meta">${c.capTon}t · ${c.status === 'working' ? 'çalışıyor ' + Math.round(c.progress * 100) + '%' : c.on ? 'boşta' : 'KAPALI'}</span>
      </div>`
    )
    .join('');
  el.querySelectorAll('input[data-crane]').forEach((inp) => {
    inp.addEventListener('change', () => {
      const ev = new CustomEvent('crane-toggle', { detail: { id: inp.dataset.crane, on: inp.checked } });
      document.dispatchEvent(ev);
    });
  });
}

export function renderTransports(world) {
  const el = $('transports');
  if (!el) return;
  el.innerHTML = world.transports
    .map(
      (t) => `<div class="tr-row"><b>${t.id}</b><span>${t.capTon}t</span>
        <em class="${t.jobId ? 'busy' : ''}">${t.jobId ? 'görevde' : 'boşta'}</em></div>`
    )
    .join('');
}

export function renderQueue(world) {
  const el = $('queue');
  if (!el) return;
  const items = world.queue
    .slice(0, 8)
    .map((id) => world.containers.find((c) => c.id === id))
    .filter(Boolean);
  el.innerHTML = items.length
    ? items
        .map(
          (c) =>
            `<div class="q-item"><b>${c.id}</b><span>ö:${c.priority}</span><span>${c.weight}t</span>
             <i style="background:${TYPES[c.type].color}"></i>
             <em>${c.reason || STATUS[c.status].label}</em></div>`
        )
        .join('')
    : '<div class="q-empty">Kuyruk boş</div>';
}

export function renderPanel(world) {
  renderKPIs(world);
  renderZones(world);
  renderCranes(world);
  renderTransports(world);
  renderQueue(world);
  const st = $('sim-state');
  if (st) {
    st.textContent = world.running ? 'ÇALIŞIYOR' : 'DURDURULDU';
    st.className = 'sim-state ' + (world.running ? 'run' : 'paused');
  }
  const clk = $('clock');
  if (clk) clk.textContent = 't = ' + world.clock.toFixed(0) + ' sn';
  const bs = $('btn-start');
  const bp = $('btn-pause');
  if (bs) bs.disabled = world.running;
  if (bp) bp.disabled = !world.running;
}
