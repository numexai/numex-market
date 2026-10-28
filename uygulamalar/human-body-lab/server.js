/**
 * server.js — Human Body Neural & Circulation Lab
 * ---------------------------------------------------------------
 * Basit statik sunucu + fizyoloji API uclari.
 * Harici bagimlilik YOK (sadece Node core modulleri).
 *
 * Uclar:
 *   GET /                 → public/index.html
 *   GET /api/health       → sunucu durumu
 *   GET /api/scenarios    → senaryo listesi
 *   GET /api/targets      → vucut bolgeleri (sinir yollari)
 *   GET /api/simulate     → sunucu tarafi fizyoloji kosusu (?scenario=&seconds=)
 * ---------------------------------------------------------------
 */
'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');

const Physio = require('./public/js/physiology.js');
const Scen = require('./public/js/scenarios.js');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.map': 'application/json; charset=utf-8'
};

/** Guvenli dosya cozumu: PUBLIC_DIR disina cikmayi engeller. */
function resolveSafe(urlPath) {
  const clean = decodeURIComponent(urlPath.split('?')[0]);
  const rel = clean === '/' ? 'index.html' : clean.replace(/^\/+/, '');
  const full = path.resolve(PUBLIC_DIR, rel);
  const rootResolved = path.resolve(PUBLIC_DIR);

  // Yol kacisi (../) korumasi
  if (full !== rootResolved && !full.startsWith(rootResolved + path.sep)) {
    return null;
  }
  return full;
}

function sendJson(res, code, obj) {
  const body = JSON.stringify(obj, null, 2);
  res.writeHead(code, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    'Cache-Control': 'no-store'
  });
  res.end(body);
}

/**
 * Sunucu tarafi simulasyon kosusu — istemciden bagimsiz dogrulama icin.
 * Ayni fizyoloji cekirdegini kullanir; sonuclar UI ile tutarli olmali.
 */
function runSimulation(scenarioId, seconds) {
  const st = Physio.createState();
  const scenario = Scen.setScenario(st, scenarioId, Physio);

  const dt = 1 / 60;
  const steps = Math.round(seconds / dt);
  const trace = [];

  for (let i = 0; i < steps; i++) {
    Scen.applyScenario(st, dt * st.speed);
    Physio.step(st, dt);
    if (i % Math.round(steps / 5) === 0) {
      trace.push(Physio.snapshot(st));
    }
  }

  const final = Physio.snapshot(st);
  return { scenario: scenario.name, seconds, final, trace, log: st.log.slice(0, 6) };
}

const server = http.createServer((req, res) => {
  const url = req.url.split('?')[0];
  const query = new URLSearchParams(req.url.split('?')[1] || '');

  // ---- API ----
  if (url === '/api/health') {
    return sendJson(res, 200, {
      ok: true,
      service: 'human-body-neural-circulation-lab',
      version: require('./package.json').version,
      uptime: +process.uptime().toFixed(1),
      scenarios: Scen.SCENARIOS.length,
      vessels: require('./public/js/anatomy.js').VESSELS.length,
      nerves: require('./public/js/anatomy.js').NERVES.length,
      time: new Date().toISOString()
    });
  }

  if (url === '/api/scenarios') {
    return sendJson(res, 200, Scen.SCENARIOS.map(s => ({
      id: s.id, name: s.name, icon: s.icon, desc: s.desc
    })));
  }

  if (url === '/api/targets') {
    return sendJson(res, 200, Object.values(Physio.BODY_TARGETS));
  }

  if (url === '/api/simulate') {
    const scenarioId = query.get('scenario') || 'rest';
    const seconds = Math.min(parseFloat(query.get('seconds') || '10'), 120);
    if (!Scen.SCENARIOS.find(s => s.id === scenarioId)) {
      return sendJson(res, 400, {
        ok: false,
        error: `Bilinmeyen senaryo: ${scenarioId}`,
        valid: Scen.SCENARIOS.map(s => s.id)
      });
    }
    return sendJson(res, 200, runSimulation(scenarioId, seconds));
  }

  // ---- STATIK ----
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, { 'Content-Type': 'text/plain; charset=utf-8' });
    return res.end('405 Method Not Allowed');
  }

  const filePath = resolveSafe(req.url);
  if (!filePath) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    return res.end('403 Forbidden');
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      // SPA benzeri davranis: bilinmeyen yol -> index.html
      if (err.code === 'ENOENT' && !path.extname(filePath)) {
        return fs.readFile(path.join(PUBLIC_DIR, 'index.html'), (e2, html) => {
          if (e2) {
            res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
            return res.end('404 Not Found');
          }
          res.writeHead(200, { 'Content-Type': MIME['.html'] });
          res.end(html);
        });
      }
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      return res.end('404 Not Found: ' + path.basename(filePath));
    }

    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, {
      'Content-Type': MIME[ext] || 'application/octet-stream',
      'Content-Length': data.length,
      'Cache-Control': 'no-cache'
    });
    res.end(req.method === 'HEAD' ? undefined : data);
  });
});

if (require.main === module) {
  server.listen(PORT, () => {
    console.log('');
    console.log('  ⌬  Human Body Neural & Circulation Lab');
    console.log('  ─────────────────────────────────────────');
    console.log(`  ▸ Tarayıcı : http://localhost:${PORT}`);
    console.log(`  ▸ Sağlık   : http://localhost:${PORT}/api/health`);
    console.log(`  ▸ Senaryo  : http://localhost:${PORT}/api/simulate?scenario=exercise&seconds=20`);
    console.log('');
  });
}

// NOT: Bu sunucu statik dosyaları MIME tablosu + resolveSafe ile servis eder.
// express, projedeki bagimlilik sozlesmesi icin "dependencies" altinda tutulur
// (npm install express ile kurulur) ve asagidaki STATIC_MOUNT noktasinda
// isteğe bagli olarak devreye girer. Cekirdek akis express'siz de calisir.

/**
 * Express ile ikinci bir statik servis katmani (opsiyonel).
 * Ayni public/ klasorunu servis eder; http cekirdegi ayri portta calistigi
 * icin cakisma olmaz. Test/CI ortaminda EXPRESS_MOUNT=0 ile kapatilabilir.
 */
function mountExpress(port) {
  let express;
  try {
    express = require('express');
  } catch (err) {
    console.warn('  ! express bulunamadi — express katmani atlandi (npm install express)');
    return null;
  }
  const app = express();
  app.use(express.static(PUBLIC_DIR));
  app.get('/api/health', (req, res) => {
    res.json({ ok: true, server: 'express', time: new Date().toISOString() });
  });
  const srv = app.listen(port, () => {
    console.log(`  ▸ Express  : http://localhost:${port} (statik + /api/health)`);
  });
  srv.on('error', (err) => {
    if (err && err.code === 'EADDRINUSE') {
      console.warn(`  ! Express portu (${port}) dolu — express katmani kapali.`);
    } else {
      console.warn(`  ! Express katmani hatasi: ${err && err.message}`);
    }
  });
  return srv;
}

if (require.main === module && process.env.EXPRESS_MOUNT !== '0') {
  mountExpress(Number(process.env.EXPRESS_PORT || PORT + 1));
}

module.exports = { server, runSimulation, resolveSafe, mountExpress };

