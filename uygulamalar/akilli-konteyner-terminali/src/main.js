// Uygulama girişi: bootstrap, döngü, olay bağlama
import { createWorld, resetWorld, restoreWorld } from './engine/world.js';
import { tick, start, pause, setSpeed, applyScenario, computeStats } from './engine/sim.js';
import { setCraneSwitch, dispatchTick, pushUrgent } from './engine/dispatch.js';
import { initScene, resize, draw, pickAt } from './ui/scene.js';
import { initPanel, renderPanel } from './ui/panel.js';
import { showContainer, hide as hideInspector } from './ui/inspector.js';
import { exportJSON, importJSON, exportCSV, exportPNG, summaryDownload } from './export.js';
import { SCENARIOS } from './config.js';

let world = null;
let sceneCtx = null;
let lastTs = 0;
let frame = 0;

function $(id) {
  return document.getElementById(id);
}

export function showToast(msg, kind) {
  const box = $('toast');
  if (!box) return;
  box.textContent = msg;
  box.className = 'toast show ' + (kind || '');
  clearTimeout(box._t);
  box._t = setTimeout(() => {
    box.className = 'toast';
  }, 3200);
}

export function wireEvents() {
  const handlers = {
    onStart: () => {
      start(world);
      renderPanel(world);
      showToast('Simülasyon başladı — gemiyi bekletmiyoruz.', 'ok');
    },
    onPause: () => {
      pause(world);
      renderPanel(world);
      showToast('Simülasyon duraklatıldı.', '');
    },
    onReset: () => {
      world = resetWorld(world, world.seed);
      sceneCtx.world = world;
      sceneCtx.selected = null;
      hideInspector();
      renderPanel(world);
      showToast('Sıfırlandı (aynı seed → aynı başlangıç).', '');
    },
    onSpeed: (v) => {
      setSpeed(world, v);
      const lbl = $('speed-label');
      if (lbl) lbl.textContent = v + '×';
      renderPanel(world);
    },
    onScenario: (key) => {
      applyScenario(world, key);
      const d = $('scenario-desc');
      if (d) d.textContent = SCENARIOS[key] ? SCENARIOS[key].desc : '';
      renderPanel(world);
      showToast('Senaryo ' + key + ' uygulandı.', 'mid');
    },
    onSaveJSON: () => {
      exportJSON(world);
      showToast('Proje JSON olarak kaydedildi.', 'ok');
    },
    onLoadJSON: (file) => {
      importJSON(file)
        .then((w) => {
          world = w;
          sceneCtx.world = world;
          renderPanel(world);
          showToast('Proje yüklendi: ' + world.containers.length + ' konteyner.', 'ok');
        })
        .catch((e) => showToast('Yükleme hatası: ' + e.message, 'err'));
    },
    onCSV: () => {
      exportCSV(world);
      showToast('CSV indirildi.', 'ok');
    },
    onPNG: () => {
      exportPNG($('scene'));
      showToast('Sahne PNG olarak alındı.', 'ok');
    },
    onSummary: () => {
      const txt = summaryDownload(world);
      const box = $('summary-box');
      if (box) {
        box.textContent = txt;
        box.classList.add('open');
      }
      showToast('Operasyon özeti hazır.', 'ok');
    },
    onTests: () => runTests(),
  };
  initPanel(world, handlers);

  document.addEventListener('crane-toggle', (e) => {
    setCraneSwitch(world, e.detail.id, e.detail.on);
    renderPanel(world);
    showToast(`${e.detail.id} ${e.detail.on ? 'açıldı' : 'kapatıldı — işler yeniden dağıtıldı'}.`, 'mid');
  });

  $('btn-urgent')?.addEventListener('click', () => {
    const c = pushUrgent(world);
    renderPanel(world);
    showToast('Acil yük geldi: ' + c.id, 'mid');
  });

  const canvas = $('scene');
  canvas.addEventListener('click', (ev) => {
    const r = canvas.getBoundingClientRect();
    const id = pickAt(sceneCtx, ev.clientX - r.left, ev.clientY - r.top);
    if (id) {
      sceneCtx.selected = id;
      showContainer(world, id);
    } else {
      sceneCtx.selected = null;
      hideInspector();
    }
  });

  window.addEventListener('resize', () => {
    if (sceneCtx) {
      resize(sceneCtx);
      draw(sceneCtx, world);
    }
  });

  $('inspector')?.addEventListener('click', (e) => {
    if (e.target.id === 'inspector') hideInspector();
  });
}

export function loop(ts) {
  const dt = lastTs ? ts - lastTs : 16;
  lastTs = ts;
  if (world.running) {
    tick(world, dt);
    if (frame % 8 === 0) renderPanel(world);
    if (sceneCtx.selected) showContainer(world, sceneCtx.selected);
  }
  draw(sceneCtx, world);
  frame++;
  requestAnimationFrame(loop);
}

async function runTests() {
  const box = $('test-results');
  if (!box) return;
  box.classList.add('open');
  box.innerHTML = '<p class="muted">Testler çalışıyor…</p>';
  try {
    const mod = await import('../tests/acceptance.js');
    const results = mod.runAcceptance();
    const passed = results.filter((r) => r.pass).length;
    box.innerHTML =
      `<h3>Kabul Testleri — ${passed}/${results.length} geçti</h3><ol class="tests">` +
      results
        .map(
          (r) =>
            `<li class="${r.pass ? 'pass' : 'fail'}"><b>${r.pass ? '✔' : '✘'}</b> ${r.name}<span>${r.note || ''}</span></li>`
        )
        .join('') +
      '</ol>';
    showToast(`${passed}/${results.length} test geçti.`, passed === results.length ? 'ok' : 'mid');
  } catch (e) {
    box.innerHTML = '<p class="err">Test yüklenemedi: ' + e.message + '</p>';
  }
}

export function boot() {
  world = createWorld(42);
  sceneCtx = initScene($('scene'), world);
  sceneCtx.selected = null;
  wireEvents();
  const d = $('scenario-desc');
  if (d) d.textContent = SCENARIOS.A.desc;
  renderPanel(world);
  requestAnimationFrame(loop);
  // Konsoldan inceleme / test için
  window.NUMEX_LIMAN = {
    get world() {
      return world;
    },
    setWorld(w) {
      world = w;
      sceneCtx.world = w;
      renderPanel(w);
    },
    restore: restoreWorld,
    dispatchTick,
    computeStats,
    runTests,
  };
  const first = computeStats(world);
  showToast(`Liman hazır: ${first.total} konteyner, 3 vinç, 4 saha aracı.`, 'ok');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
