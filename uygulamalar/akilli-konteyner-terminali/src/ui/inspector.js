// Konteyner detay kartı
import { STATUS, TYPES } from '../config.js';
import { fmtTime } from '../util.js';

export function showContainer(world, id) {
  const box = document.getElementById('inspector');
  if (!box) return;
  const c = world.containers.find((x) => x.id === id);
  if (!c) return hide();
  renderDetail(c, world);
  box.classList.add('open');
}

export function hide() {
  const box = document.getElementById('inspector');
  if (box) box.classList.remove('open');
}

export function renderDetail(c, world) {
  const box = document.getElementById('inspector');
  if (!box) return;
  const job = c.jobId ? world.jobs.find((j) => j.id === c.jobId) : null;
  const zone = c.targetZone ? world.zones.find((z) => z.id === c.targetZone) : null;
  box.innerHTML = `
    <button class="insp-close" id="insp-close" aria-label="Kapat">×</button>
    <h3>${c.id} ${c.urgent ? '<span class="tag dg">ACİL</span>' : ''}</h3>
    <div class="insp-row"><span>Tür</span><b style="color:${TYPES[c.type].color}">${c.typeLabel}</b></div>
    <div class="insp-row"><span>Boyut</span><b>${c.size} ft</b></div>
    <div class="insp-row"><span>Ağırlık</span><b>${c.weight} ton</b></div>
    <div class="insp-row"><span>Öncelik</span><b>${c.priority} / 5</b></div>
    <div class="insp-row"><span>Durum</span><b style="color:${STATUS[c.status]?.color || '#ccc'}">${STATUS[c.status]?.label || c.status}</b></div>
    <div class="insp-row"><span>Varış</span><b>${fmtTime(c.arrival)}</b></div>
    <div class="insp-row"><span>Çıkış</span><b>${fmtTime(c.departure)}</b></div>
    <div class="insp-row"><span>Hedef Bölge</span><b>${zone ? zone.label : '—'}</b></div>
    <div class="insp-row"><span>Vinç</span><b>${c.assignedCrane || '—'}</b></div>
    <div class="insp-row"><span>Saha Aracı</span><b>${c.assignedTransport || '—'}</b></div>
    <div class="insp-row"><span>İş</span><b>${c.jobId ? c.jobId + (job ? ' · ' + job.phase : '') : '—'}</b></div>
    ${c.reason ? `<div class="insp-reason">${c.reason}</div>` : ''}
  `;
  const close = document.getElementById('insp-close');
  if (close) close.addEventListener('click', hide);
}
