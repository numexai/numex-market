/* =====================================================================
 * MISSION CONTROL — Siber Sunucu DevOps İzleme Kokpiti
 * Express backend + sahte telemetri üretici + REST API
 *
 * Uçlar:
 *   GET    /metrics                → anlık dalgalanan cpu/ram/disk/ağ + olaylar
 *   GET    /processes              → 6 sahte prosesin running listesi
 *   DELETE /processes/:id          → bir prosesi durdurup listeden düşürür
 *   GET    /events                 → olay konsolu geçmişi (ön veri)
 *   (statik) static /public        → single-page kokpit
 * ===================================================================== */
'use strict';

const path = require('path');
const express = require('express');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const PORT = process.env.PORT || 5000;
const TICK_MS = 1000;          // her saniye kalp atışı
const EVENT_BUF = 60;          // olay konsolu ring buffer boyutu
const CPU_HISTORY_LEN = 30;    // son 30 saniyelik CPU geçmişi (sunucu tarafı da tutar)

/* ---------------------------------------------------------------------
 * Yardımcılar
 * ------------------------------------------------------------------- */
function clamp(v, lo, hi) { return v < lo ? lo : (v > hi ? hi : v); }
function rnd(min, max) { return min + Math.random() * (max - min); }

function formatTime(d) {
  const p = (n) => String(n).padStart(2, '0');
  return `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

/* ---------------------------------------------------------------------
 * Metro: rastgele dalgalanan sahte metrikler
 * ------------------------------------------------------------------- */
const metrics = {
  cpu:     { value: 36,  min: 4,  max: 96, step: 8, chance: 0.07 },
  memory:  { usedMB: 3920, totalMB: 8192, step: 90, chance: 0.02, spikeTo: 7100 },
  disk:    { usedMB: 638,  totalMB: 1024, step: 2,  chance: 0.01, spikeTo: 995 },
  network: { inMbps: 12.4, outMbps: 3.2, step: 4,  min: 0.2, max: 70, chance: 0.12 },
  ts: Date.now(),
};
const cpuHistory = [];   // son 30 sn cpu yüzdesi
metrics.cpu.value = 36;

function randomWalk(key) {
  const m = metrics[key];
  const delta = rnd(-m.step, m.step);
  let v = m.value;
  if (Array.isArray(v)) v = v[0]; // güvenlik — network nesne değil
  return Number(clamp(v + delta, m.min ?? 0, m.max ?? 100).toFixed(1));
}

/* Tüm metrikleri tek tıkta dalgalandır (1 saniyede 1) */
function tickMetrics() {
  // CPU — brownian benzeri yürüyüş + nadir spike
  metrics.cpu.value = clamp(
    Number((metrics.cpu.value + rnd(-metrics.cpu.step, metrics.cpu.step)).toFixed(1)),
    metrics.cpu.min, metrics.cpu.max
  );
  if (Math.random() < metrics.cpu.chance) {
    metrics.cpu.value = clamp(metrics.cpu.value + rnd(25, 45), metrics.cpu.min, metrics.cpu.max);
    metrics.cpu.value = Number(metrics.cpu.value.toFixed(1));
    logEvent('warn', 'CPU', `cpu spike detected (${metrics.cpu.value.toFixed(0)}%)`);
  }
  cpuHistory.push(metrics.cpu.value);
  if (cpuHistory.length > CPU_HISTORY_LEN) cpuHistory.shift();

  // Memory — ılımlı dalgalanma + nadir yüksek ani bellecek
  const memDelta = rnd(-metrics.memory.step, metrics.memory.step);
  metrics.memory.usedMB = clamp(metrics.memory.usedMB + memDelta, 1500, 7800);
  if (Math.random() < metrics.memory.chance) {
    metrics.memory.usedMB = clamp(metrics.memory.usedMB + rnd(400, 1200), 1500, 7800);
    logEvent('warn', 'MEM', `memory usage climbing (${pctMemory()}%)`);
  }

  // Disk — yüksek sabit + cılız drift
  metrics.disk.usedMB = clamp(
    metrics.disk.usedMB + rnd(-metrics.disk.step, metrics.disk.step), 300, 1000
  );
  if (Math.random() < metrics.disk.chance * 0.3) {
    metrics.disk.usedMB = clamp(metrics.disk.usedMB + rnd(20, 60), 300, 1005);
    if (metrics.disk.usedMB > 990) logEvent('crit', 'DISK', 'disk near full — threshold 98%');
  }

  // Ağ — sürekli iniş çıkış
  metrics.network.inMbps = clamp(
    Number((metrics.network.inMbps + rnd(-metrics.network.step, metrics.network.step)).toFixed(2)),
    metrics.network.min, metrics.network.max
  );
  metrics.network.outMbps = clamp(
    Number((metrics.network.outMbps + rnd(-metrics.network.step * 0.6, metrics.network.step * 0.6)).toFixed(2)),
    0.2, metrics.network.max
  );

  metrics.ts = Date.now();
}

function pctMemory() {
  return Math.round((metrics.memory.usedMB / metrics.memory.totalMB) * 100);
}
function pctDisk() {
  return Math.round((metrics.disk.usedMB / metrics.disk.totalMB) * 100);
}
function fmtGB(mb) { return (mb / 1024).toFixed(2) + ' GB'; }
function fmtMBVal(mb) { return mb.toFixed(0) + ' MB'; }

/* ---------------------------------------------------------------------
 * Metro: olay günlüğü (ring buffer)
 * ------------------------------------------------------------------- */
const events = [];
function logEvent(type, tag, message) {
  events.push({
    time: formatTime(new Date()),
    type: type || 'info',        // ok | warn | crit | info
    tag: tag || 'SYS',
    message: String(message),
  });
  if (events.length > EVENT_BUF) events.shift();
}

/* Açılışta kokpiti dolduran başlangıç olayları */
function seedEvents() {
  logEvent('ok',   'nginx',      'request GET /api/v1/orders 200 OK (12ms)');
  logEvent('ok',   'redis',      'cache hit key:user:5842 (0.4ms)');
  logEvent('ok',   'postgresql', 'connection pool healthy (24/25 conn)');
  logEvent('info', 'auth',       'token refresh for operator session');
  logEvent('warn', 'analytics',  'slow query detected — 1.8s (threshold 1.5s)');
  logEvent('info', 'SYS',        'mission-control uplink established');
  logEvent('ok',   'payment',    'webhook acknowledged (evt_8f2a)');
}

/* ---------------------------------------------------------------------
 * Metro: 6 sahte proses
 * ------------------------------------------------------------------- */
const processes = new Map();   // key: pid
let _nextPid = 1101;

function spawnDefaultProcesses() {
  const defs = [
    { service: 'nginx',              baseCpu: 14, maxCpu: 22, baseMem: 210 },
    { service: 'postgresql',         baseCpu: 22, maxCpu: 40, baseMem: 980 },
    { service: 'redis',              baseCpu: 8,  maxCpu: 15, baseMem: 320 },
    { service: 'auth-service',       baseCpu: 16, maxCpu: 30, baseMem: 460 },
    { service: 'payment-worker',     baseCpu: 11, maxCpu: 26, baseMem: 540 },
    { service: 'analytics',          baseCpu: 24, maxCpu: 48, baseMem: 1280 },
  ];
  for (const d of defs) {
    const pid = _nextPid++;
    processes.set(pid, {
      pid,
      service: d.service,
      cpu: clamp(d.baseCpu + rnd(-4, 4), 1, d.maxCpu),
      memMB: clamp(d.baseMem + rnd(-30, 30), 20, d.baseMem + 200),
      status: 'running',
      baseCpu: d.baseCpu,
      maxCpu: d.maxCpu,
      baseMem: d.baseMem,
    });
  }
}

/* Her saniye proseslerin cpu/mem değerlerini hafif oynat */
function tickProcesses() {
  for (const p of processes.values()) {
    if (p.status !== 'running') continue;
    const nc = clamp(
      Number((p.cpu + rnd(-6, 6)).toFixed(1)),
      2, p.maxCpu + 12
    );
    if (Math.random() < 0.03 && p.cpu > p.maxCpu) {
      logEvent('warn', p.service, `cpu spike on ${p.service} (${nc.toFixed(0)}%)`);
    }
    p.cpu = nc;
    p.memMB = clamp(
      Number((p.memMB + rnd(-40, 40)).toFixed(0)),
      25, p.baseMem + 300
    );
  }
}

function runningProcesses() {
  const list = [...processes.values()].filter(p => p.status === 'running');
  return list.sort((a, b) => a.pid - b.pid);
}

/* ---------------------------------------------------------------------
 * Metro: seyrek otomatik arka plan olayları (canlılık hissi)
 * ------------------------------------------------------------------- */
function maybeAutoLog() {
  const roll = Math.random();
  if (roll < 0.22) {
    const pool = [
      ['ok',   'nginx',      'request GET /api/v1/health 200 OK (9ms)'],
      ['ok',   'nginx',      'request POST /api/v1/webhooks 201 Created (34ms)'],
      ['ok',   'redis',      'cache hit key:session:9912 (0.3ms)'],
      ['ok',   'redis',      'SET cache miss → stored key:flight:77 (0.6ms)'],
      ['ok',   'auth',       'login success op:sektor (2FA ok)'],
      ['info', 'payment',    'transaction 0x41c..f2 confirmed (12 confirmations)'],
      ['info', 'analytics',  'aggregation window closing… writing 12.4k rows'],
      ['ok',   'postgresql', 'checkpoint complete (wal flushed)'],
      ['info', 'nginx',      'reload config — zero downtime'],
      ['warn', 'auth',       'brute-force attempt blocked ip:203.0.113.99'],
    ];
    const picked = pool[Math.floor(Math.random() * pool.length)];
    logEvent(picked[0], picked[1], picked[2]);
  } else if (roll < 0.30) {
    // Nadiren bir ağ veya cpu normalleştirme bildirimi
    const type = Math.random() < 0.5 ? 'ok' : 'warn';
    const tag = Math.random() < 0.5 ? 'NET' : 'CPU';
    const msg = type === 'ok'
      ? `traffic normalized — in ${metrics.network.inMbps.toFixed(1)} Mbps`
      : `load average rising — cpu ${metrics.cpu.value.toFixed(0)}%`;
    logEvent(type, tag, msg);
  }
}

/* ---------------------------------------------------------------------
 * REST API uçları
 * ------------------------------------------------------------------- */
app.get('/metrics', (req, res) => {
  res.json({
    ts: metrics.ts,
    cpu: Number(metrics.cpu.value),
    cpuHistory: cpuHistory.slice(),
    memory: {
      usedMB: Math.round(metrics.memory.usedMB),
      totalMB: metrics.memory.totalMB,
      percent: pctMemory(),
      usedText: fmtMBVal(metrics.memory.usedMB),
    },
    disk: {
      usedMB: Math.round(metrics.disk.usedMB),
      totalMB: metrics.disk.totalMB,
      percent: pctDisk(),
      usedText: fmtMBVal(metrics.disk.usedMB),
    },
    network: {
      inMbps: Number(metrics.network.inMbps),
      outMbps: Number(metrics.network.outMbps),
    },
    processesRunning: runningProcesses().length,
    events: events.slice(-EVENT_BUF),
    uptimeSec: Math.round(process.uptime()),
  });
});

app.get('/processes', (req, res) => {
  res.json({ processes: runningProcesses() });
});

app.get('/events', (req, res) => {
  res.json({ events: events.slice(-EVENT_BUF) });
});

app.delete('/processes/:id', (req, res) => {
  const raw = req.params.id;
  const pid = Number(raw);
  let target = null;

  if (!Number.isNaN(pid)) {
    target = processes.get(pid) || null;
  } else {
    // servis adıyla da bulabiliriz
    for (const p of processes.values()) {
      if (p.service === raw && p.status === 'running') { target = p; break; }
    }
  }

  if (!target) {
    return res.status(404).json({ ok: false, error: 'process not found' });
  }
  if (target.status !== 'running') {
    return res.status(409).json({ ok: false, error: 'process already stopped' });
  }

  target.status = 'stopped';
  // Prosesi haritadan kalıcı çıkar ki restart edilmemiş saysın
  // (isteğe göre durumda tutmak da yeterli; running listesinden düşer zaten)
  logEvent('crit', 'SYS', `process ${target.service} (pid ${target.pid}) terminated by operator`);
  res.json({ ok: true, pid: target.pid, service: target.service, status: 'stopped' });
});

/* ---------------------------------------------------------------------
 * Kalp atışı döngüsü + başlat
 * ------------------------------------------------------------------- */
spawnDefaultProcesses();
seedEvents();
for (let i = 0; i < CPU_HISTORY_LEN; i++) cpuHistory.push(metrics.cpu.value); // ön doldur

setInterval(() => {
  tickMetrics();
  tickProcesses();
  maybeAutoLog();
}, TICK_MS);

app.listen(PORT, () => {
  console.log('==================================================');
  console.log('  MISSION CONTROL — uplink established');
  console.log(`  API + UI   : http://localhost:${PORT}`);
  console.log('  endpoints  : GET /metrics, GET /processes,');
  console.log('               GET /events, DELETE /processes/:id');
  console.log(`  heartbeat  : ${TICK_MS}ms`);
  console.log('==================================================');
});
