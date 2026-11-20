// Dışa aktarma: JSON, CSV, PNG, operasyon özeti
import { snapshot, restoreWorld } from './engine/world.js';
import { computeStats } from './engine/sim.js';
import { zoneUsed, zoneFill } from './model/yard.js';
import { STATUS, TYPES } from './config.js';
import { csvEscape, fmtPct, fmtTime } from './util.js';

function download(filename, content, mime) {
  const blob = content instanceof Blob ? content : new Blob([content], { type: mime || 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

function stamp() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}`;
}

export function exportJSON(world) {
  const data = JSON.stringify(snapshot(world), null, 2);
  download(`numex-liman-${stamp()}.json`, data, 'application/json');
  return data;
}

export function importJSON(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result));
        resolve(restoreWorld(data));
      } catch (e) {
        reject(e);
      }
    };
    reader.onerror = () => reject(new Error('Dosya okunamadı'));
    reader.readAsText(file, 'utf-8');
  });
}

export function exportCSV(world) {
  const head = [
    'ID',
    'Boyut_ft',
    'Agirlik_ton',
    'Oncelik',
    'Yuk_Turu',
    'Hedef_Bolge',
    'Durum',
    'Varis_s',
    'Cikis_s',
    'Vinc',
    'Saha_Araci',
    'Is',
    'Not',
  ];
  const rows = world.containers.map((c) =>
    [
      c.id,
      c.size,
      c.weight,
      c.priority,
      TYPES[c.type].label,
      c.targetZone || '',
      STATUS[c.status]?.label || c.status,
      c.arrival,
      c.departure,
      c.assignedCrane || '',
      c.assignedTransport || '',
      c.jobId || '',
      c.reason || '',
    ]
      .map(csvEscape)
      .join(';')
  );
  const csv = '\uFEFF' + [head.join(';'), ...rows].join('\r\n');
  download(`numex-liman-konteynerler-${stamp()}.csv`, csv, 'text/csv;charset=utf-8');
  return csv;
}

export function exportPNG(canvas) {
  if (!canvas) return;
  canvas.toBlob((blob) => {
    if (blob) download(`numex-liman-sahne-${stamp()}.png`, blob, 'image/png');
  }, 'image/png');
}

export function buildSummary(world) {
  const s = computeStats(world);
  const zones = world.zones
    .map((z) => `  ${z.id} ${z.label.padEnd(12)} ${zoneUsed(z)}/${z.capacity}  ${fmtPct(zoneFill(z))}`)
    .join('\n');
  const cranes = world.cranes
    .map(
      (c) =>
        `  ${c.id}  ${c.capTon}t  ${c.on ? 'açık' : 'KAPALI'}  kullanım ${fmtPct(
          world.clock > 0 ? c.busyTime / world.clock : 0
        )}  iş: ${world.metrics.byCrane[c.id] || 0}`
    )
    .join('\n');
  const trs = world.transports
    .map(
      (t) =>
        `  ${t.id}  ${t.capTon}t  kullanım ${fmtPct(world.clock > 0 ? t.busyTime / world.clock : 0)}  iş: ${
          world.metrics.byTransport[t.id] || 0
        }`
    )
    .join('\n');
  const waiting = world.containers.filter((c) => c.status === 'waiting');
  const reasons = [...new Set(waiting.map((c) => c.reason).filter(Boolean))].slice(0, 6);

  return `NUMEX LİMAN — OPERASYON ÖZETİ
================================
Tarih        : ${new Date().toLocaleString('tr-TR')}
Senaryo      : ${world.scenario}
Simülasyon   : t = ${world.clock.toFixed(0)} sn (hız ${world.speed}×)
Seed         : ${world.seed}

KONTEYNER
  Toplam        : ${s.total}
  Sahada        : ${s.inYard}
  Taşınıyor     : ${s.moving}
  Bekleyen      : ${s.pending} (yer/vinç bekleyen: ${s.waiting})
  Tamamlanan    : ${s.completed}
  Ort. işlem    : ${s.avg ? s.avg.toFixed(2) + ' sn' : '—'}
  Tahmini bitiş : ${s.eta != null ? '+' + fmtTime(s.eta) : '—'}

VİNÇLER
${cranes}

SAHA ARAÇLARI
${trs}

DEPOLAMA BÖLGELERİ
${zones}

BEKLEME NEDENLERİ
${reasons.length ? reasons.map((r) => '  • ' + r).join('\n') : '  (yok)'}

Not: Depolama ve istif kuralları eğitim amaçlı basitleştirilmiştir;
gerçek bir liman güvenlik planı yerine geçmez.
`;
}

export function summaryDownload(world) {
  const text = buildSummary(world);
  download(`numex-liman-ozet-${stamp()}.txt`, text, 'text/plain;charset=utf-8');
  return text;
}
