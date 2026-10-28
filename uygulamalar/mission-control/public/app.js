/* =====================================================================
   MISSION CONTROL — frontend mantığı
   Saf HTML5 canvas (harici kütüphane yok):
    · 3 dolan (gauge) göstergesi — CPU, MEMORY, NET
    · disk yüzük göstergesi
    · 30 saniyelik akan neon CPU çizgi grafiği (izgara + glow)
    · canlı proses tablosu + KİLL (DELETE)
    · akan olay konsolu (ok/warn/crit)
   ===================================================================== */
'use strict';

/* ---------- kısa yardımcılar ---------- */
const $ = (id) => document.getElementById(id);
const clampV = (v, lo, hi) => v < lo ? lo : (v > hi ? hi : v);
const mapRange = (v, inMin, inMax, outMin, outMax) =>
  outMin + ((v - inMin) / (inMax - inMin)) * (outMax - outMin);

const sys = {
  cpu: 0,
  cpuHistory: [],          // son 30 sn cpu % (frontend ring)
  memPct: 0, memUsedMB: 0,
  diskPct: 0, diskUsedMB: 0,
  netIn: 0, netOut: 0,
  rowMap: new Map(),       // pid -> <tr>
  lastLogTs: 0,            // olay konsolu için karşılaştırma
  lastCpuTick: Date.now(),
};

const HISTORY_LEN = 30;    // saniye
const LOG_MAX = 40;        // konsol satır limiti

/* =====================================================================
   GAUGE ÇİZİMİ (dairesel/dolan)
   value 0..1, renk scale'le birlikte değişir
   ===================================================================== */
const GAUGE_KIND_TO_COLORS = {
  cpu:  ['#00e5ff', '#ffb020', '#ff3550'],
  mem:  ['#39ff88', '#ffb020', '#ff3550'],
  net:  ['#00e5ff', '#39ff88', '#ff3550'],
};
const GAUGE_CENTER = { cpu: $('gaugeCpu'), mem: $('gaugeMem'), net: $('gaugeNet') };

function colorForWarning(c, i) {
  // alt sınır yeşil/camgöbeği değil, % value'ya göre seçim yapalım
  if (c.warn >= 0.9) return '#ff3550';
  if (c.warn >= 0.65) return '#ffb020';
  return c.base;
}

function drawArcBar(canvas, frac, baseColor, tick) {
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas._logW || canvas.width, canvas._logH || canvas.height);
  const w = canvas._logW || canvas.width, h = canvas._logH || canvas.height;
  const cx = w / 2, cy = h / 2;
  const R = Math.min(w, h) / 2 - 20;
  ctx.clearRect(0, 0, w, h);

  const start = Math.PI * 0.75;               // başlangıç (220°)
  const end = Math.PI * 0.25;                 // bitiş
  const sweep = Math.PI * 1.5;                // 270° dairesel yay
  const fracC = clampV(frac, 0, 1);
  const angleFrom = start;
  const angleTo = start + sweep * fracC;

  // taban kemer
  ctx.lineWidth = 13; ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(cx, cy, R, start, end, false);
  ctx.strokeStyle = 'rgba(80, 120, 160, 0.18)';
  ctx.stroke();

  // dolan kemer degrade
  const safeColor = colorForWarning({
    base: baseColor, warn: fracC
  }, 0);
  const grad = ctx.createLinearGradient(cx - R, cy - R, cx + R, cy);
  grad.addColorStop(0, safeColor);
  grad.addColorStop(1, lighten(safeColor, 0.35));

  ctx.shadowColor = safeColor;
  ctx.shadowBlur = 12;
  ctx.beginPath();
  ctx.arc(cx, cy, R, angleFrom, angleTo, false);
  ctx.strokeStyle = grad;
  ctx.lineWidth = 13;
  ctx.stroke();
  ctx.shadowBlur = 0;

  // uçta parlak "damla" nokta
  const tipX = cx + Math.cos(angleTo) * R;
  const tipY = cy + Math.sin(angleTo) * R;
  ctx.beginPath(); ctx.arc(tipX, tipY, 7, 0, Math.PI * 2);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.shadowColor = safeColor; ctx.shadowBlur = 14;
  ctx.fillStyle = safeColor;
  ctx.beginPath(); ctx.arc(tipX, tipY, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  // merkezde yüzde
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.font = 'bold 34px Consolas, monospace';
  ctx.fillStyle = safeColor;
  ctx.fillText(String(Math.round(fracC * 100)) + '%', cx, cy - 10);
  ctx.font = '10px Consolas, monospace';
  ctx.fillStyle = 'rgba(120,190,255,0.5)';
  ctx.fillText(tick, cx, cy + 18);
}

function lighten(hex, amt) {
  const c = hex.replace('#', '');
  const r = parseInt(c.slice(0, 2), 16), g = parseInt(c.slice(2, 4), 16), b = parseInt(c.slice(4, 6), 16);
  const L = (v) => Math.round(clampV(v + (255 - v) * amt, 0, 255));
  return '#' + [L(r), L(g), L(b)].map(x => x.toString(16).padStart(2, '0')).join('');
}

/* =====================================================================
   DISK YÜZÜK GÖSTERGESİ (tam çember yüzdelik kullanım)
   ===================================================================== */
function drawDiskGauge(canvas, frac) {
  const ctx = canvas.getContext('2d');
  const w = canvas._logW || canvas.width, h = canvas._logH || canvas.height;
  const cx = w / 2, cy = h / 2;
  const outer = Math.min(w, h) / 2 - 10;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const f = clampV(frac, 0, 1);
  // renk: %70 altı yeşil, %70-90 amber, üstü kırmızı
  const color = f > 0.9 ? '#ff3550' : (f > 0.7 ? '#ffb020' : '#39ff88');

  // taban
  ctx.lineWidth = 12; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.arc(cx, cy, outer, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(80,120,160,0.16)'; ctx.stroke();

  // dolan çember (yukarıdan başla)
  ctx.shadowColor = color; ctx.shadowBlur = 10;
  ctx.beginPath(); ctx.arc(cx, cy, outer, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * f);
  ctx.strokeStyle = color; ctx.lineWidth = 12; ctx.stroke();
  ctx.shadowBlur = 0;

  // uç nokta
  const a = -Math.PI / 2 + Math.PI * 2 * f;
  ctx.beginPath();
  ctx.arc(cx + Math.cos(a) * outer, cy + Math.sin(a) * outer, 6, 0, Math.PI * 2);
  ctx.fillStyle = '#fff'; ctx.fill();
}

/* =====================================================================
   CPU GRAFİK — akan neon çizgi, izgara, degradeli dolgu
   ===================================================================== */
const chartCanvas = $('cpuChart');
let gridReady = false;

function drawChartBG(ctx, W, H) {
  if (gridReady) return;       // izgarayı sadece 1 kez çiz (arka katman)
  // dikey çizgiler
  const cols = 6, rows = 5;
  ctx.strokeStyle = 'rgba(0,180,255,0.08)';
  ctx.lineWidth = 1;
  for (let i = 0; i <= cols; i++) {
    const x = Math.round(mapRange(i, 0, cols, 14, W - 10));
    ctx.beginPath(); ctx.moveTo(x, 8); ctx.lineTo(x, H - 20); ctx.stroke();
  }
  for (let j = 0; j <= rows; j++) {
    const y = Math.round(mapRange(j, 0, rows, 8, H - 20));
    ctx.beginPath(); ctx.moveTo(14, y); ctx.lineTo(W - 10, y); ctx.stroke();
  }
  // y eksen etiketleri
  ctx.fillStyle = 'rgba(120,190,255,0.4)';
  ctx.font = '10px Consolas, monospace'; ctx.textAlign = 'left'; ctx.textBaseline = 'bottom';
  ctx.fillText('100%', 14, 8);
  ctx.fillStyle = 'rgba(120,190,255,0.25)';
  ctx.fillText('cpu load', W - 70, 14);
  gridReady = true;
}

function pushHistoryAndDraw() {
  const c = chartCanvas.getContext('2d');
  const W = chartCanvas._logW || chartCanvas.width;
  const H = chartCanvas._logH || chartCanvas.height;
  c.clearRect(0, 0, chartCanvas.width, chartCanvas.height);
  drawChartBG(c, W, H);

  if (sys.cpuHistory.length < 2) return;

  const plotW = W - 24, plotH = H - 28;
  const n = HISTORY_LEN, maxVal = 100;

  // verinin son n noktası
  const arr = sys.cpuHistory.slice(-n);
  const px = (i) => 14 + (i / Math.max(1, n - 1)) * plotW;
  const py = (v) => 8 + (1 - clampV(v, 0, maxVal) / maxVal) * plotH;

  // degradeli dolgu
  const col = arr[arr.length - 1] > 85 ? '#ff3550' : '#00e5ff';
  c.beginPath();
  c.moveTo(px(0), py(arr[0]));
  for (let i = 1; i < arr.length; i++) c.lineTo(px(i), py(arr[i]));
  c.lineTo(px(arr.length - 1), H - 12);
  c.lineTo(px(0), H - 12);
  c.closePath();
  const g = c.createLinearGradient(0, 8, 0, H - 12);
  g.addColorStop(0, 'rgba(0,229,255,0.28)');
  g.addColorStop(1, 'rgba(0,229,255,0.0)');
  c.fillStyle = col[0] === '#ff' ? 'rgba(255,53,80,0.22)' : g;
  c.fill();

  // neon çizgi
  c.beginPath();
  c.moveTo(px(0), py(arr[0]));
  for (let i = 1; i < arr.length; i++) c.lineTo(px(i), py(arr[i]));
  c.strokeStyle = col;
  c.lineWidth = 2.5;
  c.shadowColor = col; c.shadowBlur = 12;
  c.stroke();
  c.shadowBlur = 0;

  // son nokta glow damlası
  const lx = px(arr.length - 1), ly = py(arr[arr.length - 1]);
  c.beginPath(); c.arc(lx, ly, 5, 0, Math.PI * 2);
  c.fillStyle = '#fff'; c.fill();
  c.shadowColor = col; c.shadowBlur = 10;
  c.fillStyle = col;
  c.beginPath(); c.arc(lx, ly, 3.5, 0, Math.PI * 2); c.fill();
  c.shadowBlur = 0;

  // %80 eşik çizgisi (kehribar kesikli)
  const tY = py(80);
  c.save();
  c.strokeStyle = 'rgba(255,176,32,0.4)';
  c.setLineDash([5, 4]); c.lineWidth = 1;
  c.shadowBlur = 0;
  c.beginPath(); c.moveTo(14, tY); c.lineTo(W - 10, tY); c.stroke();
  c.restore();

  // /dross: değer etiketi üst solda
  c.fillStyle = col; c.font = 'bold 13px Consolas, monospace';
  c.textAlign = 'left'; c.textBaseline = 'top';
  c.fillText('CPU  ' + Math.max(0, arr[arr.length - 1]).toFixed(1) + '%', 18, 42);
}

/* =====================================================================
   METRİKLERİ ÇEK & RENDER
   ===================================================================== */
async function refreshMetrics() {
  let data;
  try {
    const r = await fetch('/metrics');
    data = await r.json();
  } catch (e) {
    setServerDown();
    return;
  }
  sys.cpu = data.cpu;
  sys.memPct = data.memory.percent;
  sys.memUsedMB = data.memory.usedMB;
  sys.diskPct = data.disk.percent;
  sys.diskUsedMB = data.disk.usedMB;
  sys.netIn = data.network.inMbps;
  sys.netOut = data.network.outMbps;
  sys.processesRunning = data.processesRunning;

  // gauge güncelle
  drawArcBar(GAUGE_CENTER.cpu, sys.cpu / 100, '#00e5ff', 'consolidated');
  drawArcBar(GAUGE_CENTER.mem, sys.memPct / 100, '#39ff88', 'of 8192 MB');
  drawArcBar(GAUGE_CENTER.net, (clampV(sys.netIn, 0, 80) / 80), '#00e5ff', 'ingress Mbps');
  drawDiskGauge($('diskGauge'), sys.diskPct / 100);

  // etiketler
  $('cpuPct').textContent = Math.round(sys.cpu) + '%';
  $('memPct').textContent = sys.memPct + '%';
  $('memText').textContent = fmtMB(sys.memUsedMB);
  $('netVal').textContent = sys.netIn.toFixed(1);
  $('netIn').textContent = sys.netIn.toFixed(1);
  $('netOut').textContent = sys.netOut.toFixed(1);
  $('diskScore').textContent = sys.diskPct;
  $('diskText').textContent = fmtMB(sys.diskUsedMB);

  // istatistik üst
  $('serverStatus').textContent = data.uptimeSec ? 'ONLINE' : 'ONLINE';
  $('runCount').textContent = data.processesRunning;
  $('uptime').textContent = fmtUp(data.uptimeSec);
  $('procBadge').textContent = data.processesRunning + ' online';

  // canvas cpu geçmişini besle
  if (data.cpuHistory && Array.isArray(data.cpuHistory)) {
    sys.cpuHistory = data.cpuHistory.slice();
  } else {
    sys.cpuHistory.push(sys.cpu);
    if (sys.cpuHistory.length > HISTORY_LEN) sys.cpuHistory.shift();
  }
  pushHistoryAndDraw();

  // olayları işle
  if (data.events) consumeEvents(data.events);
}

function setServerDown() {
  $('serverStatus').textContent = 'OFFLINE';
  $('serverStatus').style.color = 'var(--red)';
}

function fmtMB(mb) {
  if (mb >= 1024) return (mb / 1024).toFixed(2) + ' GB';
  return mb.toFixed(0) + ' MB';
}
function fmtUp(sec) {
  if (!sec) return '—';
  const m = Math.floor(sec / 60), s = sec % 60;
  return m + 'm ' + String(s).padStart(2, '0') + 's';
}

/* =====================================================================
   OLAY KONSOLU
   ===================================================================== */
const consoleEl = $('logConsole');
const seenLog = new Set();   // aynı olayı tekrar basmasın (sürece)

function consumeEvents(events) {
  for (const e of events) {
    const key = e.time + '|' + e.tag + '|' + e.message;
    if (seenLog.has(key)) continue;
    seenLog.add(key);
    if (seenLog.size > 120) seenLog.clear();
    appendLog(e);
  }
}

function appendLog(e) {
  const line = document.createElement('div');
  line.className = 'line type-' + (e.type || 'info');
  const t = document.createElement('span'); t.className = 't'; t.textContent = e.time + ' ▸';
  const tag = document.createElement('span'); tag.className = 'tag'; tag.textContent = e.tag.toUpperCase();
  const msg = document.createElement('span'); msg.className = 'msg'; msg.textContent = e.message;
  line.appendChild(t); line.appendChild(tag); line.appendChild(msg);
  consoleEl.prepend(line);

  // max liste buda
  while (consoleEl.children.length > LOG_MAX) consoleEl.removeChild(consoleEl.lastChild);
}

/* =====================================================================
   PROSES TABLOSU
   ===================================================================== */
const procBody = $('procBody');

async function loadProcesses() {
  let data;
  try { const r = await fetch('/processes'); data = await r.json(); }
  catch (err) { return; }
  const list = data.processes || [];

  // mevcut gösterilen pids
  const shownPids = new Set();
  for (const p of list) {
    shownPids.add(p.pid);
    if (sys.rowMap.has(p.pid)) {
      updateRow(p, sys.rowMap.get(p.pid));
    } else {
      renderRow(p);
    }
  }
  // listede artık yoksa (kill/durable) kaldır
  for (const pid of [...sys.rowMap.keys()]) {
    if (!shownPids.has(pid)) {
      const row = sys.rowMap.get(pid);
      row.remove();
      sys.rowMap.delete(pid);
    }
  }
  $('procEmpty').classList.toggle('hidden', list.length > 0);
  $('procBadge').textContent = list.length + ' online';
}

function renderRow(p) {
  const row = document.createElement('tr');
  row.dataset.pid = p.pid;
  let html = '';
  html += '<td class="pid">' + p.pid + '</td>';
  html += '<td class="svc">' + escapeHtml(p.service) + '</td>';
  html += '<td class="cpu-cell">' + p.cpu.toFixed(1) + '%</td>';
  html += '<td class="mem-cell">' + fmtMB(p.memMB) + '</td>';
  html += '<td><span class="status-pill">RUNNING</span></td>';
  html += '<td class="td-action"><button class="kill" data-pid="' + p.pid + '">✕ KILL</button></td>';
  row.innerHTML = html;
  procBody.appendChild(row);
  sys.rowMap.set(p.pid, row);
}

function updateRow(p, row) {
  const cells = row.querySelectorAll('td');
  if (cells.length >= 4) {
    cells[2].textContent = p.cpu.toFixed(1) + '%';
    cells[2].classList.toggle('hot', p.cpu > 85 || p.cpu > (p.maxCpu || 90));
    cells[3].textContent = fmtMB(p.memMB);
  }
}

function escapeHtml(x) { return String(x).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }

/* KİLL — DELETE isteği → satırı sil */
async function killProcess(pid, btn) {
  if (btn) { btn.disabled = true; btn.textContent = '…'; }
  try {
    const res = await fetch('/processes/' + encodeURIComponent(pid), { method: 'DELETE' });
    const data = await res.json();
    if (data.ok) {
      const row = sys.rowMap.get(data.pid);
      if (row) { row.remove(); sys.rowMap.delete(data.pid); }
      appendLog({ time: tsNow(), type: 'crit', tag: 'SYS', message: 'process ' + data.service + ' terminated by operator (pid ' + data.pid + ')' });
      $('procEmpty').classList.toggle('hidden', sys.rowMap.size > 0);
    } else {
      if (btn) { btn.disabled = false; btn.textContent = '✕ KILL'; }
      appendLog({ time: tsNow(), type: 'warn', tag: 'SYS', message: 'kill failed — ' + (data.error || 'unknown') });
    }
  } catch (e) {
    if (btn) { btn.disabled = false; btn.textContent = '✕ KILL'; }
    appendLog({ time: tsNow(), type: 'warn', tag: 'ERR', message: 'network error on terminate' });
  }
}

function tsNow() {
  const d = new Date(), p = (n) => String(n).padStart(2, '0');
  return p(d.getHours()) + ':' + p(d.getMinutes()) + ':' + p(d.getSeconds());
}

/* event delegation — dinamik butonlar için */
function bindKillButtons() {
  procBody.addEventListener('click', (e) => {
    const btn = e.target.closest('.kill');
    if (!btn) return;
    e.stopPropagation();
    killProcess(btn.dataset.pid, btn);
  });
}

/* =====================================================================
   GÖREV DÖNGÜSÜ (1 sn'de 1)
   ===================================================================== */
function tick() {
  refreshMetrics();          // /metrics → gauge + grafik + olaylar
  loadProcesses();           // /processes → tablo yansıt
}

function init() {
  // kartuş değerleri sıfır göster → hızlı ilk boya
  drawArcBar(GAUGE_CENTER.cpu, 0, '#00e5ff', 'consolidated');
  drawArcBar(GAUGE_CENTER.mem, 0, '#39ff88', 'of 8192 MB');
  drawArcBar(GAUGE_CENTER.net, 0, '#00e5ff', 'ingress Mbps');
  drawDiskGauge($('diskGauge'), 0);
  pushHistoryAndDraw();

  bindKillButtons();
  tick();
  setInterval(tick, 1000);
}

// Canvas'ları yüksek dpi çözünürlüğe uyarla (keskin çizgi, boyutlar tutarlı kalır)
function setupHiDPI() {
  const dpr = window.devicePixelRatio || 1;
  const setCanvas = (c, logW, logH) => {
    c.width = Math.round(logW * dpr);
    c.height = Math.round(logH * dpr);
    c.style.width = (c.id === 'cpuChart' ? '100%' : logW + 'px');
    c.style.height = logH + 'px';
    // DRAW fonksiyonları çizim alanını CSS/cihaz px cinsinden bilsin:
    // CSS koordinatlarına geri dönmek için scale store
    c._logW = logW; c._logH = logH; c._dpr = dpr;
    const ctx = c.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  setCanvas(chartCanvas, 980, 240);
  setCanvas(GAUGE_CENTER.cpu, 220, 220);
  setCanvas(GAUGE_CENTER.mem, 220, 220);
  setCanvas(GAUGE_CENTER.net, 220, 220);
  setCanvas($('diskGauge'), 200, 200);
  gridReady = false;
}

window.addEventListener('load', () => {
  setupHiDPI();
  init();
});
