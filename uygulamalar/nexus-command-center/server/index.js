'use strict';

/**
 * Nexus Command Center — Sunucu
 * Statik arayüz + JSON API. Port dinamiktir (PORT env veya boş port arayışı),
 * sabit 3000 hardcode edilmez.
 */

const path = require('path');
const http = require('http');
const express = require('express');

const projects = require('../src/routes/projects');
const tasks = require('../src/routes/tasks');
const team = require('../src/routes/team');
const activity = require('../src/routes/activity');
const dashboard = require('../src/routes/dashboard');
const db = require('../src/store/db');

const app = express();
const ROOT = path.join(__dirname, '..');

app.use(express.json({ limit: '1mb' }));

/* İstek günlüğü — sessiz hataları görünür kılar */
app.use((req, _res, next) => {
  if (req.path.startsWith('/api')) {
    console.log(`[api] ${req.method} ${req.path}`);
  }
  next();
});

/* --- API --- */
app.get('/api/health', (_req, res) => {
  const database = db.read();
  res.json({
    ok: true,
    data: {
      service: 'nexus-command-center',
      projects: database.projects.length,
      tasks: database.tasks.length,
      team: database.team.length,
      dbFile: db.DB_FILE,
      uptime: Math.round(process.uptime()),
    },
  });
});

app.use('/api/summary', dashboard);
app.use('/api/projects', projects);
app.use('/api/tasks', tasks);
app.use('/api/team', team);
app.use('/api/activity', activity);

/* Bilinmeyen API yolu → 404 (HTML döndürmesin) */
app.use('/api', (req, res) => {
  res.status(404).json({ ok: false, error: `API yolu bulunamadı: ${req.method} ${req.originalUrl}` });
});

/* --- Statik arayüz --- */
app.use(express.static(path.join(ROOT, 'public')));
app.get('*', (_req, res) => {
  res.sendFile(path.join(ROOT, 'public', 'index.html'));
});

/* --- Hata yakalayıcı (JSON) --- */
app.use((err, _req, res, _next) => {
  console.error('[hata]', err);
  res.status(500).json({ ok: false, error: 'Sunucu hatası: ' + err.message });
});

/* --- Port: dinamik --- */
const BASE_PORT = Number(process.env.PORT) || 4173;

function listenWithFallback(port, attemptsLeft = 25) {
  const server = http.createServer(app);

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE' && attemptsLeft > 0) {
      console.log(`[port] ${port} dolu, ${port + 1} deneniyor...`);
      listenWithFallback(port + 1, attemptsLeft - 1);
    } else {
      console.error('[port] HATA:', err.message);
      process.exit(1);
    }
  });

  server.listen(port, () => {
    console.log('┌────────────────────────────────────────────┐');
    console.log('│  NEXUS COMMAND CENTER  ·  hazır            │');
    console.log('└────────────────────────────────────────────┘');
    console.log(`  Adres : http://localhost:${port}`);
    console.log(`  API   : http://localhost:${port}/api/health`);
    console.log(`  Veri  : ${db.DB_FILE}`);
  });
}

listenWithFallback(BASE_PORT);
