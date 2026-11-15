// NUMEX SMART CITY — komuta merkezi bağlantı katmanı

import { SmartCity } from './sim.js';
import { CityRenderer } from './render.js';

const canvas = document.getElementById('map');
const city = new SmartCity({ seed: (Date.now() % 99991) | 0, vehicles: 120 });
const renderer = new CityRenderer(canvas, city);

const $ = (id) => document.getElementById(id);
const hud = {
  clock: $('hud-clock'),
  phase: $('hud-phase'),
  cars: $('hud-cars'),
  moving: $('hud-moving'),
  waiting: $('hud-waiting'),
  cong: $('hud-cong'),
  accidents: $('hud-accidents'),
  closed: $('hud-closed'),
  amb: $('hud-amb'),
  resolved: $('hud-resolved'),
  fps: $('hud-fps'),
  bar: $('cong-bar'),
  mode: $('mode-label'),
};
const logList = $('log-list');

let paused = false;
let speedMul = 1;
let mode = 'accident';
let acc = 0;
let last = performance.now();
let fpsSmooth = 60;

/* ------------------------------------------------------------- günlük */

function renderLog(entries) {
  for (const e of entries) {
    const li = document.createElement('li');
    const mm = String(Math.floor(e.t / 60)).padStart(2, '0');
    const ss = String(Math.floor(e.t % 60)).padStart(2, '0');
    li.innerHTML = `<span class="log-t">${mm}:${ss}</span><span class="log-x"></span>`;
    li.lastChild.textContent = e.text;
    logList.prepend(li);
  }
  while (logList.children.length > 26) logList.lastChild.remove();
}

function log(text) {
  renderLog([{ t: city.time, text }]);
}

/* --------------------------------------------------------- arayüz olayları */

function setMode(m) {
  mode = m;
  document.querySelectorAll('[data-mode]').forEach((b) => {
    b.classList.toggle('on', b.dataset.mode === m);
  });
  hud.mode.textContent = m === 'accident'
    ? 'Haritaya tıkla: o noktada kaza oluşturulur'
    : m === 'close'
      ? 'Haritaya tıkla: yol kapatılır / açılır'
      : 'İzleme modu';
}

document.querySelectorAll('[data-mode]').forEach((b) => {
  b.addEventListener('click', () => setMode(b.dataset.mode));
});

$('btn-pause').addEventListener('click', () => {
  paused = !paused;
  $('btn-pause').textContent = paused ? 'Devam Et' : 'Duraklat';
  $('btn-pause').classList.toggle('on', paused);
});

document.querySelectorAll('[data-speed]').forEach((b) => {
  b.addEventListener('click', () => {
    speedMul = Number(b.dataset.speed);
    document.querySelectorAll('[data-speed]').forEach((x) => x.classList.toggle('on', x === b));
  });
});

$('btn-density-up').addEventListener('click', () => city.setDensity(city.carTarget + 45));
$('btn-density-down').addEventListener('click', () => city.setDensity(city.carTarget - 45));

$('btn-random-accident').addEventListener('click', () => {
  const e = city.randomEdge();
  if (!e) return;
  city.createAccident(e.id, { auto: true });
});

$('btn-triple').addEventListener('click', () => {
  const used = new Set();
  let made = 0;
  for (let i = 0; i < 3; i++) {
    let e = null;
    for (let k = 0; k < 60; k++) {
      const cand = city.randomEdge();
      if (cand && !used.has(cand.id) && !city.edgeMap.get(cand.id).accident) { e = cand; break; }
    }
    if (!e) continue;
    used.add(e.id);
    if (city.createAccident(e.id, { auto: true })) made++;
  }
  log(`Kriz testi: ${made} eşzamanlı kaza oluşturuldu. Sistem çalışmaya devam ediyor.`);
});

$('btn-clear').addEventListener('click', () => {
  let n = 0;
  for (const a of city.accidents.slice()) {
    city.resolveAccident(a, 'kullanıcı olayı kapattı');
    n++;
  }
  for (const e of city.edges) {
    if (e.closed && !e.accident) { e.closed = false; e.closedBy = null; }
  }
  log(`${n} olay kapatıldı, tüm yollar açıldı.`);
});

canvas.addEventListener('click', (ev) => {
  const rect = canvas.getBoundingClientRect();
  const sx = (ev.clientX - rect.left) * (canvas.width / rect.width);
  const sy = (ev.clientY - rect.top) * (canvas.height / rect.height);
  const [wx, wy] = renderer.toWorld(sx, sy);
  const edge = city.nearestEdge(wx, wy, 80);
  if (!edge) { log('Tıklanan noktaya yakın yol bulunamadı.'); return; }

  if (mode === 'accident') {
    if (edge.accident) { log(`${edge.id} hattında zaten aktif bir kaza var.`); return; }
    city.createAccident(edge.id, { auto: false });
  } else if (mode === 'close') {
    city.toggleRoad(edge.id);
  }
});

window.addEventListener('keydown', (e) => {
  if (e.code === 'Space') {
    e.preventDefault();
    $('btn-pause').click();
  }
  if (e.key === '1') setMode('accident');
  if (e.key === '2') setMode('close');
  if (e.key === '3') setMode('none');
});

window.addEventListener('resize', () => renderer.resize());

/* -------------------------------------------------------------- döngü */

function hourLabel(h) {
  const hh = String(Math.floor(h)).padStart(2, '0');
  const mm = String(Math.floor((h % 1) * 60)).padStart(2, '0');
  return `${hh}:${mm}`;
}

function updateHud(raw) {
  const m = city.metrics || city.sample();
  const day = city.dayTime >= 6 && city.dayTime < 19;
  hud.clock.textContent = hourLabel(city.dayTime);
  hud.phase.textContent = day ? 'GÜNDÜZ' : 'GECE';
  hud.phase.classList.toggle('night', !day);
  hud.cars.textContent = m.vehicles;
  hud.moving.textContent = m.moving;
  hud.waiting.textContent = m.waiting;
  hud.cong.textContent = Math.round(m.congestion * 100) + '%';
  hud.accidents.textContent = m.accidents;
  hud.accidents.classList.toggle('alert', m.accidents > 0);
  hud.closed.textContent = m.closed;
  hud.amb.textContent = m.ambulances;
  hud.amb.classList.toggle('alert', m.ambulances > 0);
  hud.resolved.textContent = m.resolved;
  hud.bar.style.width = Math.min(100, Math.round(m.congestion * 100)) + '%';
  hud.bar.style.background = renderer.congestionColor(m.congestion);
  fpsSmooth = fpsSmooth * 0.9 + (1 / Math.max(0.001, raw)) * 0.1;
  hud.fps.textContent = Math.round(fpsSmooth);
}

const STEP = 1 / 60;
function frame(now) {
  const raw = Math.max(0.0001, (now - last) / 1000);
  last = now;
  if (!paused) {
    acc += Math.min(0.1, raw) * speedMul;
    let guard = 0;
    while (acc >= STEP && guard++ < 12) {
      city.step(STEP);
      acc -= STEP;
    }
    if (guard >= 12) acc = 0;
  }
  renderer.draw(now);
  const evs = city.drainEvents();
  if (evs.length) renderLog(evs);
  updateHud(raw);
  requestAnimationFrame(frame);
}

setMode('accident');
document.querySelector('[data-speed="1"]').classList.add('on');
log('Komuta merkezi açıldı. 35 kavşak, 58 hat, 120 araç.');
requestAnimationFrame(frame);

// Dışarıdan test/ölçüm için
window.__NUMEX_CITY__ = { city, renderer };
