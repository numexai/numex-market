/* Numex Dream Studio — uygulama durumu ve sahne yönetimi.
   Mod geçişi, sinematik gösterim, ayar dışa/içe aktarma, otomatik kalite. */
(function () {
  'use strict';
  const NS = window.NDS;
  const $ = function (id) { return document.getElementById(id); };

  const MAX_PARTICLES = 11000;
  const MODE_ORDER = ['galaxy', 'heart', 'butterfly', 'flower', 'star', 'text', 'vortex'];
  const STORE_KEY = 'nds.settings.v1';

  const state = {
    mode: 'galaxy',
    text: 'DREAM',
    palette: 0,
    density: 0.60,
    speed: 1.0,
    zoom: 1.0,
    cinematic: false
  };

  const canvas = $('scene');
  const renderer = new NS.Renderer(canvas);
  const engine = new NS.Engine(MAX_PARTICLES);
  const perf = new NS.Perf();
  let palette = NS.PALETTES[state.palette];
  let breath = 1;
  let running = true;

  const cine = { t: 0, modeT: 0, paletteT: 0, burstT: 0 };

  /* ---------------- yardımcılar ---------------- */
  function toast(msg) {
    const el = $('toast');
    if (!el) return;
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toast._t);
    toast._t = setTimeout(function () { el.classList.remove('show'); }, 2200);
  }

  function targetCount() {
    const base = MAX_PARTICLES * state.density * (0.55 + 0.45 * perf.level);
    return Math.max(300, Math.round(base));
  }

  function syncCamera() {
    renderer.cam.zoom = state.zoom * breath * controls.zoomMul;
    if (!cineOn()) {
      // sinematik kapalıyken kamera yumuşakça dinlenme açısına döner
      renderer.cam.rotY += (0 - renderer.cam.rotY) * 0.04;
      renderer.cam.rotX += (-0.22 - renderer.cam.rotX) * 0.04;
    }
  }

  function cineOn() { return state.cinematic; }

  /* ---------------- sahne kurulumu ---------------- */
  function applyShape() {
    engine.setShape(state.mode, state.text, targetCount());
    $('hudMode').textContent = NS.SHAPES.labels[state.mode] || 'Galaksi';
    document.querySelectorAll('.mode').forEach(function (b) {
      b.classList.toggle('is-active', b.getAttribute('data-mode') === state.mode);
    });
  }

  function applyPalette(index, silent) {
    state.palette = ((index % NS.PALETTES.length) + NS.PALETTES.length) % NS.PALETTES.length;
    palette = NS.PALETTES[state.palette];
    engine.setPalette(palette);
    document.querySelectorAll('.swatch').forEach(function (s, i) {
      s.classList.toggle('is-active', i === state.palette);
    });
    if (!silent) toast(palette.name);
    save();
  }

  function setDensity(v) {
    state.density = Math.max(0.15, Math.min(1, v));
    engine.setCount(targetCount());
    $('densityVal').textContent = Math.round(state.density * 100) + '%';
    save();
  }

  function setSpeed(v) {
    state.speed = Math.max(0.15, Math.min(2.5, v));
    $('speedVal').textContent = state.speed.toFixed(1).replace('.', ',') + '×';
    save();
  }

  function setZoom(v) {
    state.zoom = Math.max(0.4, Math.min(2.6, v));
    $('zoomVal').textContent = Math.round(state.zoom * 100) + '%';
    save();
  }

  /* ---------------- kalıcılık (dışa/içe aktarma) ---------------- */
  function snapshot() {
    return {
      app: 'numex-dream-studio',
      version: 1,
      mode: state.mode,
      text: state.text,
      palette: palette.id,
      density: Math.round(state.density * 100),
      speed: state.speed,
      zoom: state.zoom,
      createdAt: new Date().toISOString()
    };
  }

  function download(filename, blob) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
  }

  function exportJSON() {
    const data = JSON.stringify(snapshot(), null, 2);
    download('numex-dream-' + palette.id + '-' + state.mode + '.json',
      new Blob([data], { type: 'application/json' }));
    toast('Kompozisyon JSON olarak indirildi');
  }

  function applySettings(obj) {
    if (!obj || typeof obj !== 'object') throw new Error('geçersiz dosya');
    if (obj.mode && MODE_ORDER.indexOf(obj.mode) >= 0) state.mode = obj.mode;
    if (typeof obj.text === 'string' && obj.text.trim()) state.text = obj.text.trim();
    $('textInput').value = state.text;

    if (obj.palette != null) {
      let idx = typeof obj.palette === 'number' ? obj.palette : -1;
      if (idx < 0) {
        for (let i = 0; i < NS.PALETTES.length; i++) if (NS.PALETTES[i].id === obj.palette) idx = i;
      }
      if (idx >= 0 && idx < NS.PALETTES.length) applyPalette(idx, true);
    }

    if (typeof obj.density === 'number') {
      const d = obj.density > 1 ? obj.density / 100 : obj.density;
      $('density').value = Math.round(Math.max(0.15, Math.min(1, d)) * 100);
      setDensity(d);
    }
    if (typeof obj.speed === 'number') {
      $('speed').value = Math.round(Math.max(0.15, Math.min(2.5, obj.speed)) * 100);
      setSpeed(obj.speed);
    }
    if (typeof obj.zoom === 'number') {
      $('zoom').value = Math.round(Math.max(0.4, Math.min(2.6, obj.zoom)) * 100);
      setZoom(obj.zoom);
    }
    if (obj.cinematic === true) setCinema(true);

    applyShape();
    save();
  }

  function importJSON(file) {
    const reader = new FileReader();
    reader.onload = function () {
      try {
        const obj = JSON.parse(String(reader.result));
        applySettings(obj);
        toast('Kompozisyon geri yüklendi');
      } catch (err) {
        toast('Dosya okunamadı — geçerli bir JSON seç');
      }
    };
    reader.onerror = function () { toast('Dosya okunamadı'); };
    reader.readAsText(file);
  }

  let saveTimer = 0;
  function save() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(function () {
      try { localStorage.setItem(STORE_KEY, JSON.stringify(snapshot())); } catch (e) { /* sessiz */ }
    }, 350);
  }

  function loadStored() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (!raw) return false;
      const obj = JSON.parse(raw);
      if (!obj || obj.app !== 'numex-dream-studio') return false;
      state.mode = MODE_ORDER.indexOf(obj.mode) >= 0 ? obj.mode : 'galaxy';
      state.text = obj.text || 'DREAM';
      if (typeof obj.speed === 'number') state.speed = obj.speed;
      if (typeof obj.zoom === 'number') state.zoom = obj.zoom;
      if (typeof obj.density === 'number') state.density = obj.density > 1 ? obj.density / 100 : obj.density;
      let idx = 0;
      for (let i = 0; i < NS.PALETTES.length; i++) if (NS.PALETTES[i].id === obj.palette) idx = i;
      state.palette = idx;
      return true;
    } catch (e) { return false; }
  }

  /* ---------------- sinematik ---------------- */
  function setCinema(on) {
    state.cinematic = !!on;
    cine.modeT = 0; cine.paletteT = 0; cine.burstT = 0;
    const btn = $('btnCinema');
    btn.classList.toggle('is-on', state.cinematic);
    btn.textContent = state.cinematic ? 'Sinematik ✓' : 'Sinematik';
    if (state.cinematic) toast('Sinematik gösterim başladı');
  }

  function nextMode() {
    const i = MODE_ORDER.indexOf(state.mode);
    state.mode = MODE_ORDER[(i + 1) % MODE_ORDER.length];
    if (state.mode === 'text') state.mode = MODE_ORDER[(i + 2) % MODE_ORDER.length];
    applyShape();
  }

  function randomWorld() {
    const a = Math.random() * Math.PI * 2;
    const r = 0.25 + Math.random() * 0.5;
    return { x: Math.cos(a) * r, y: Math.sin(a) * r };
  }

  /* ---------------- kontroller ---------------- */
  const controls = new NS.Controls(canvas, {
    toWorld: function (sx, sy) { return renderer.screenToWorld(sx, sy); },
    onBurst: function (wp) {
      engine.burst(wp.x, wp.y, 1);
    },
    onZoom: function () {
      const zf = state.zoom * controls.zoomMul;
      if (zf > 3.2) controls.zoomMul = 3.2 / state.zoom;
      if (zf < 0.3) controls.zoomMul = 0.3 / state.zoom;
    },
    onPinch: function (ratio) {
      controls.zoomMul = Math.max(0.35, Math.min(3.4, controls.zoomMul * ratio));
    },
    onInteract: function () {
      if (state.cinematic) cine.modeT = 0;
    },
    onKeyMode: function (i) {
      if (MODE_ORDER[i]) {
        state.mode = MODE_ORDER[i];
        applyShape();
        cine.modeT = 0;
      }
    },
    onCinema: function () { setCinema(!state.cinematic); },
    onPng: function () { savePNG(); },
    onPanel: function () { togglePanel(); }
  });

  function togglePanel() {
    const closed = document.body.classList.toggle('panel-closed');
    const btn = $('panelToggle');
    if (btn) btn.setAttribute('aria-expanded', String(!closed));
  }

  function savePNG() {
    renderer.exportPNG(engine, palette, function (blob) {
      if (!blob) { toast('PNG oluşturulamadı'); return; }
      download('numex-dream-' + state.mode + '-' + Date.now() + '.png', blob);
      toast('PNG kaydedildi');
    });
  }

  /* ---------------- arayüz bağlantıları ---------------- */
  function buildPaletteSwatches() {
    const host = $('palettes');
    host.innerHTML = '';
    NS.PALETTES.forEach(function (p, i) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'swatch' + (i === state.palette ? ' is-active' : '');
      b.title = p.name;
      b.setAttribute('aria-label', p.name);
      b.style.background = 'linear-gradient(140deg,' + p.stops.join(',') + ')';
      b.addEventListener('click', function () { applyPalette(i); });
      host.appendChild(b);
    });
  }

  function bindUI() {
    document.querySelectorAll('.mode').forEach(function (b) {
      b.addEventListener('click', function () {
        state.mode = b.getAttribute('data-mode');
        applyShape();
        cine.modeT = 0;
      });
    });

    const input = $('textInput');
    input.value = state.text;
    function commitText() {
      const raw = input.value.trim();
      const val = (raw || 'DREAM').toLocaleUpperCase('tr-TR');
      state.text = val;
      input.value = val;
      state.mode = 'text';
      applyShape();
      cine.modeT = 0;
      toast('Yazı: ' + val);
    }
    $('textApply').addEventListener('click', commitText);
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); commitText(); }
    });

    $('density').addEventListener('input', function (e) { setDensity(e.target.value / 100); });
    $('speed').addEventListener('input', function (e) { setSpeed(e.target.value / 100); });
    $('zoom').addEventListener('input', function (e) { setZoom(e.target.value / 100); });

    $('btnCinema').addEventListener('click', function () { setCinema(!state.cinematic); });
    $('btnPng').addEventListener('click', savePNG);
    $('btnExport').addEventListener('click', exportJSON);
    $('btnImport').addEventListener('click', function () { $('fileImport').click(); });
    $('fileImport').addEventListener('change', function (e) {
      const f = e.target.files && e.target.files[0];
      if (f) importJSON(f);
      e.target.value = '';
    });
    $('panelToggle').addEventListener('click', togglePanel);

    window.addEventListener('resize', function () { renderer.resize(); });
    document.addEventListener('visibilitychange', function () {
      running = !document.hidden;
      if (running) { last = performance.now(); requestAnimationFrame(frame); }
    });
  }

  /* ---------------- ana döngü ---------------- */
  let last = performance.now();
  let hudTimer = 0;

  function frame(now) {
    const raw = (now - last) / 1000;
    last = now;
    const dt = Math.min(0.05, Math.max(0.001, raw || 0.016));

    const fps = perf.tick(dt);
    if (perf.changed) {
      renderer.quality = perf.level;
      renderer.resize();
      engine.setCount(targetCount());
      $('hudCount').textContent = engine.count.toLocaleString('tr-TR');
    }

    // sinematik
    if (state.cinematic) {
      cine.t += dt;
      cine.modeT += dt; cine.paletteT += dt; cine.burstT += dt;
      if (cine.modeT > 7.5) { cine.modeT = 0; nextMode(); }
      if (cine.paletteT > 5.5) { cine.paletteT = 0; applyPalette(state.palette + 1, true); }
      if (cine.burstT > 3.6) { cine.burstT = 0; const w = randomWorld(); engine.burst(w.x, w.y, 0.7); }
      renderer.cam.rotY = Math.sin(cine.t * 0.22) * 0.32;
      renderer.cam.rotX = -0.22 + Math.sin(cine.t * 0.17) * 0.15;
      breath = 1 + Math.sin(cine.t * 0.33) * 0.06;
    } else {
      breath += (1 - breath) * Math.min(1, dt * 2);
    }

    syncCamera();

    const env = {
      speed: state.speed,
      pointer: controls.force(),
      vortex: controls.vortex,
      radius: 0.44
    };

    engine.update(dt, env);
    renderer.draw(engine, palette, { fade: 0.30, aura: 1 });

    hudTimer += dt;
    if (hudTimer > 0.25) {
      hudTimer = 0;
      $('hudFps').textContent = Math.round(fps);
      $('hudCount').textContent = engine.count.toLocaleString('tr-TR');
    }

    requestAnimationFrame(frame);
  }

  /* ---------------- başlat ---------------- */
  function boot() {
    const restored = loadStored();
    buildPaletteSwatches();
    $('textInput').value = state.text;
    $('density').value = Math.round(state.density * 100);
    $('speed').value = Math.round(state.speed * 100);
    $('zoom').value = Math.round(state.zoom * 100);
    $('densityVal').textContent = Math.round(state.density * 100) + '%';
    $('speedVal').textContent = state.speed.toFixed(1).replace('.', ',') + '×';
    $('zoomVal').textContent = Math.round(state.zoom * 100) + '%';

    palette = NS.PALETTES[state.palette];
    engine.setPalette(palette);
    applyShape();

    if (window.innerWidth < 860) {
      document.body.classList.add('panel-closed');
      $('panelToggle').setAttribute('aria-expanded', 'false');
    }

    bindUI();
    renderer.resize();
    // ilk kare: ekran asla boş kalmasın
    renderer.draw(engine, palette, { fade: 0, aura: 1 });
    if (restored) toast('Son kompozisyon geri yüklendi');

    window.NDS.app = {
      state: state, engine: engine, renderer: renderer, perf: perf, controls: controls,
      applyShape: applyShape, applyPalette: applyPalette, savePNG: savePNG,
      exportJSON: exportJSON, applySettings: applySettings, setCinema: setCinema
    };

    requestAnimationFrame(frame);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
