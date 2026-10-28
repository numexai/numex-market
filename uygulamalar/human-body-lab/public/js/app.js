/**
 * app.js — Uygulama Orkestratoru
 * ---------------------------------------------------------------
 * Fizyoloji cekirdegi + senaryolar + parcaciklar + render'i
 * ayni zaman dongusune baglar. UI olaylarini dinler.
 * ---------------------------------------------------------------
 */
(function () {
  'use strict';

  const Physio = window.NumexPhysiology;
  const Scen = window.NumexScenarios;
  const Part = window.NumexParticles;
  const Render = window.NumexBodyRender;
  const A = window.NumexAnatomy;

  // --- Cekirdek durum ---
  const state = Physio.createState();
  const blood = Part.createBloodSystem(A.VESSELS);
  const signals = [];
  const pulses = [];

  let renderer = null;
  let hoverZone = null;
  let lastPulseBeat = -1;
  const dom = {};

  // =================================================================
  //  BASLATMA
  // =================================================================
  function init() {
    cacheDom();
    renderer = Render.createRenderer(dom.canvas);
    renderer.resize();
    renderer.computeScale();

    bindControls();
    bindCanvas();
    bindKeyboard();
    buildScenarioList();
    buildHistoryCanvases();

    Physio.logEvent(state, 'good', 'Simülasyon başlatıldı — bazal durum: 72 bpm, SpO₂ %98');
    Physio.logEvent(state, 'info', `Kan dolaşımı: ${blood.particles.length} parçacık ${A.VESSELS.length} damarda akıyor`);

    window.addEventListener('resize', () => {
      renderer.resize();
      renderer.computeScale();
      buildHistoryCanvases();
    });

    // 3B oturtma icin API (test/otomasyon kullanir)
    window.__numex = {
      getState: () => state,
      snapshot: () => Physio.snapshot(state),
      setScenario: id => { Scen.setScenario(state, id, Physio); syncScenarioUI(); },
      fireSignal: (targetId) => fireAtTarget(targetId),
      setSpeed: v => { state.speed = Physio.clamp(v, 0.25, 4); dom.speed.value = state.speed; updateSpeedLabel(); },
      toggleRun: () => toggleRun(),
      reset: () => resetSim(),
      particleCount: () => blood.particles.length,
      signalCount: () => signals.length,
      renderer
    };

    requestAnimationFrame(loop);
  }

  function cacheDom() {
    const $ = id => document.getElementById(id);
    dom.canvas = $('body-canvas');
    dom.speed = $('speed');
    dom.speedLabel = $('speed-label');
    dom.btnToggle = $('btn-toggle');
    dom.btnReset = $('btn-reset');
    dom.btnHrUp = $('btn-hr-up');
    dom.btnHrDown = $('btn-hr-down');
    dom.hrSlider = $('hr-slider');
    dom.scenarioList = $('scenario-list');
    dom.scenarioDesc = $('scenario-desc');
    dom.log = $('event-log');
    dom.logCount = $('log-count');
    dom.metrics = {
      hr: $('m-hr'), hrBadge: $('m-hr-badge'),
      bp: $('m-bp'), flow: $('m-flow'), sv: $('m-sv'),
      spo2: $('m-spo2'), pao2: $('m-pao2'), resp: $('m-resp'),
      map: $('m-map'), response: $('m-response'), conduction: $('m-conduction'),
      lastTarget: $('m-last-target')
    };
    dom.spark = {
      hr: $('spark-hr'), spo2: $('spark-spo2'),
      flow: $('spark-flow'), resp: $('spark-resp')
    };
  }

  // =================================================================
  //  KONTROLLER
  // =================================================================
  function bindControls() {
    dom.btnToggle.addEventListener('click', toggleRun);
    dom.btnReset.addEventListener('click', resetSim);

    dom.speed.addEventListener('input', () => {
      state.speed = parseFloat(dom.speed.value);
      updateSpeedLabel();
    });

    dom.btnHrUp.addEventListener('click', () => nudgeHR(6));
    dom.btnHrDown.addEventListener('click', () => nudgeHR(-6));

    dom.hrSlider.addEventListener('input', () => {
      state.hr = parseFloat(dom.hrSlider.value);
      Physio.logEvent(state, 'info', `Kalp hızı manuel: ${Math.round(state.hr)} bpm`);
    });

    updateSpeedLabel();
    updateRunButton();
  }

  function toggleRun() {
    state.running = !state.running;
    Physio.logEvent(
      state,
      state.running ? 'good' : 'warn',
      state.running ? 'Simülasyon devam ediyor' : 'Simülasyon duraklatıldı'
    );
    updateRunButton();
  }

  function updateRunButton() {
    dom.btnToggle.textContent = state.running ? '⏸ Duraklat' : '▶ Devam Et';
    dom.btnToggle.classList.toggle('paused', !state.running);
  }

  function resetSim() {
    const fresh = Physio.createState();
    Object.keys(fresh).forEach(k => {
      if (k === 'history') {
        state.history = { hr: [], spo2: [], flow: [], resp: [] };
      } else if (k !== 'log' && k !== 'logSeq') {
        state[k] = fresh[k];
      }
    });
    signals.length = 0;
    pulses.length = 0;
    hoverZone = null;
    lastPulseBeat = -1;
    Scen.getById('rest').enter(state);
    state.scenario = 'rest';
    syncScenarioUI();

    dom.log.innerHTML = '';
    Physio.logEvent(state, 'info', 'Simülasyon sıfırlandı — tüm parametreler bazal değere döndü');
    updateRunButton();
  }

  function nudgeHR(delta) {
    state.hr = Physio.clamp(state.hr + delta, 30, 200);
    dom.hrSlider.value = Math.round(state.hr);
    Physio.logEvent(
      state,
      state.hr > 120 ? 'warn' : 'info',
      `Kalp hızı ${delta > 0 ? 'artırıldı' : 'azaltıldı'}: ${Math.round(state.hr)} bpm`
    );
  }

  function updateSpeedLabel() {
    dom.speedLabel.textContent = state.speed.toFixed(2).replace(/\.00$/, '') + '×';
  }

  // =================================================================
  //  CANVAS ETKILESIM — kola/bacaga tiklayinca sinyal gonder
  // =================================================================
  function bindCanvas() {
    dom.canvas.addEventListener('mousemove', e => {
      const zone = hitTest(e);
      hoverZone = zone;
      dom.canvas.style.cursor = zone ? 'pointer' : 'default';
    });

    dom.canvas.addEventListener('mouseleave', () => { hoverZone = null; });

    dom.canvas.addEventListener('click', e => {
      const zone = hitTest(e);
      if (zone) fireAtTarget(zone.id);
    });

    // Dokunmatik destek
    dom.canvas.addEventListener('touchstart', e => {
      const t = e.touches[0];
      const zone = hitTest({ clientX: t.clientX, clientY: t.clientY });
      if (zone) { e.preventDefault(); fireAtTarget(zone.id); }
    }, { passive: false });
  }

  function hitTest(e) {
    const rect = dom.canvas.getBoundingClientRect();
    const scale = renderer.drawScale;
    const cx = rect.width / 2;
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    // ekran → normalize
    const nx = 0.5 + (mx - cx) / scale;
    const ny = (my - renderer.pad) / scale;

    let best = null, bestD = Infinity;
    for (const z of A.CLICK_ZONES) {
      const dx = (nx - z.cx) / z.rx;
      const dy = (ny - z.cy) / z.ry;
      const d = dx * dx + dy * dy;
      if (d <= 1 && d < bestD) { bestD = d; best = z; }
    }
    return best;
  }

  /** Hedefe sinyal gonder: fizyolojik gecikme + gorsel paket. */
  function fireAtTarget(targetId) {
    const target = Physio.BODY_TARGETS[targetId];
    if (!target) return null;

    const nerve = A.NERVES.find(n => n.target === targetId);
    if (!nerve) return null;

    const result = Physio.fireSignal(state, target);
    signals.push(Part.createNerveSignal(nerve, nerve.type, result.ms));

    // Ayni hedefe ters yonde ikinci paket (efferent + afferent dongu)
    if (nerve.type === 'motor') {
      const sensoryNerve = A.NERVES.find(n => n.target === targetId && n.type === 'sensory');
      if (sensoryNerve) {
        setTimeout(() => {
          signals.push(Part.createNerveSignal(sensoryNerve, 'sensory', result.ms * 1.4));
        }, result.ms);
      }
    }

    const typeLabel = nerve.type === 'motor' ? 'motor' : 'duyusal';
    const level = result.ms > 120 ? 'warn' : 'good';
    Physio.logEvent(
      state, level,
      `${target.label} uyarıldı — ${typeLabel} sinyal, gecikme ${result.ms} ms (${result.distanceM} m yol, ${result.velocity} m/s)`
    );

    // Sempatik tepki: uzuv uyarimi kalbi hafif hizlandirir
    state.hr = Physio.clamp(state.hr + (result.ms > 100 ? 2 : 1), 30, 200);

    return result;
  }

  // =================================================================
  //  SENARYO LISTESI
  // =================================================================
  function buildScenarioList() {
    dom.scenarioList.innerHTML = '';
    Scen.SCENARIOS.forEach(sc => {
      const btn = document.createElement('button');
      btn.className = 'scenario-btn' + (sc.id === state.scenario ? ' active' : '');
      btn.dataset.id = sc.id;
      btn.innerHTML = `<span class="sc-icon">${sc.icon}</span>
        <span class="sc-body"><strong>${sc.name}</strong><small>${sc.desc}</small></span>`;
      btn.addEventListener('click', () => {
        Scen.setScenario(state, sc.id, Physio);
        syncScenarioUI();
        Physio.logEvent(state, 'info', `Senaryo yüklendi: ${sc.name}`);
      });
      dom.scenarioList.appendChild(btn);
    });
    syncScenarioUI();
  }

  function syncScenarioUI() {
    const cur = Scen.getById(state.scenario);
    dom.scenarioDesc.textContent = cur.desc;
    [...dom.scenarioList.children].forEach(b => {
      b.classList.toggle('active', b.dataset.id === state.scenario);
    });
  }

  // =================================================================
  //  SPARKLINE GECMISI
  // =================================================================
  function buildHistoryCanvases() {
    Object.entries(dom.spark).forEach(([key, cvs]) => {
      if (!cvs) return;
      const rect = cvs.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      cvs.width = Math.max(1, Math.round(rect.width * dpr));
      cvs.height = Math.max(1, Math.round(rect.height * dpr));
    });
  }

  function drawSpark(cvs, data, color, refRange) {
    if (!cvs) return;
    const ctx = cvs.getContext('2d');
    const w = cvs.width, h = cvs.height;
    ctx.clearRect(0, 0, w, h);
    if (data.length < 2) return;

    let min = Math.min(...data), max = Math.max(...data);
    if (refRange) { min = Math.min(min, refRange[0]); max = Math.max(max, refRange[1]); }
    const span = Math.max(max - min, 0.001);

    // referans bandi
    if (refRange) {
      const y1 = h - ((refRange[1] - min) / span) * h;
      const y2 = h - ((refRange[0] - min) / span) * h;
      ctx.fillStyle = 'rgba(74, 222, 128, 0.08)';
      ctx.fillRect(0, y1, w, Math.max(1, y2 - y1));
    }

    ctx.beginPath();
    data.forEach((v, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - ((v - min) / span) * h;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    ctx.strokeStyle = color;
    ctx.lineWidth = Math.max(1.2, cvs.height / 32);
    ctx.stroke();

    // son nokta
    const lx = w, ly = h - ((data[data.length - 1] - min) / span) * h;
    ctx.beginPath();
    ctx.arc(lx - 2, ly, 2.4, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
  }

  // =================================================================
  //  ANA DONGU
  // =================================================================
  let lastFrame = performance.now();

  function loop(now) {
    const dtRaw = (now - lastFrame) / 1000;
    lastFrame = now;
    const dt = Math.min(dtRaw, 0.1); // buyuk sicramalari kirp

    // 1) Fizyoloji adimi (senaryo mudahalesi ile)
    if (state.running) {
      Scen.applyScenario(state, dt * state.speed);
      Physio.step(state, dt);
    }

    // 2) Parcaciklar (duraklatilinca da donmaz)
    const pdt = state.running ? dt * state.speed : 0;
    if (pdt > 0) {
      Part.stepBlood(blood, state, pdt);
      Part.stepSignals(signals, pdt);
      Part.stepPulses(pulses, pdt);
    }

    // 3) Her atimda nabiz dalgasi
    if (state.beatCount !== lastPulseBeat) {
      lastPulseBeat = state.beatCount;
      pulses.push(Part.createPulseWave(A.VESSELS, 'aorta'));
      pulses.push(Part.createPulseWave(A.VESSELS, 'aorta-down'));
      if (pulses.length > 6) pulses.splice(0, pulses.length - 6);
    }

    // 4) Cizim
    renderer.clear();
    renderer.drawBody();
    renderer.drawVessels();
    renderer.drawNerves(state);
    renderer.drawPulses(pulses);
    renderer.drawBlood(blood, state);
    renderer.drawOrgans(state);
    renderer.drawSignals(signals);
    renderer.drawHud(state);

    if (hoverZone) {
      const t = Physio.BODY_TARGETS[hoverZone.id];
      renderer.drawHover(hoverZone, t ? t.label : hoverZone.id);
    }

    // 5) UI guncelleme (her ~100ms)
    uiAcc += dt;
    if (uiAcc > 0.1) { uiAcc = 0; updateUI(); }

    requestAnimationFrame(loop);
  }
  let uiAcc = 0;

  // =================================================================
  //  UI GUNCELLEME
  // =================================================================
  function updateUI() {
    const s = Physio.snapshot(state);

    // --- Kalp ---
    setText(dom.metrics.hr, s.hr);
    dom.hrSlider.value = Math.round(state.hr);
    dom.metrics.hrBadge.className = 'metric-badge ' + hrClass(s.hr);
    dom.metrics.hrBadge.textContent = hrLabel(s.hr);

    // --- Dolasim ---
    setText(dom.metrics.bp, s.bp ? `${s.bp.sys}/${s.bp.dia}` : '—');
    setText(dom.metrics.flow, s.flow.toFixed(2));
    setText(dom.metrics.sv, s.sv);
    setText(dom.metrics.map, s.map);
    dom.metrics.map.className = 'metric-value ' + (s.map > 140 || s.map < 60 ? 'bad' : '');

    // --- Oksijen ---
    setText(dom.metrics.spo2, s.spo2.toFixed(1));
    dom.metrics.spo2.className = 'metric-value big ' + spo2Class(s.spo2);
    setText(dom.metrics.pao2, s.paO2.toFixed(1));
    setText(dom.metrics.resp, s.respRate);

    // --- Sinir ---
    setText(dom.metrics.response, s.responseMs ? s.responseMs + ' ms' : '—');
    setText(dom.metrics.conduction, s.nerveConduction.toFixed(2) + '×');
    const tgt = s.lastTarget ? Physio.BODY_TARGETS[s.lastTarget] : null;
    setText(dom.metrics.lastTarget, tgt ? tgt.label : '—');

    // --- Sparkline ---
    drawSpark(dom.spark.hr, state.history.hr, '#ef4444', [60, 100]);
    drawSpark(dom.spark.spo2, state.history.spo2, '#22d3ee', [95, 100]);
    drawSpark(dom.spark.flow, state.history.flow, '#4ade80', [4, 8]);
    drawSpark(dom.spark.resp, state.history.resp, '#a855f7', [12, 20]);

    // --- Olay gunlugu ---
    renderLog();
  }

  function setText(el, v) { if (el && el.textContent !== String(v)) el.textContent = v; }

  function hrClass(hr) {
    if (hr < 50) return 'bad';
    if (hr < 60) return 'warn';
    if (hr <= 100) return 'good';
    if (hr <= 150) return 'warn';
    return 'bad';
  }
  function hrLabel(hr) {
    if (hr < 50) return 'BRADİKARDİ';
    if (hr < 60) return 'DÜŞÜK';
    if (hr <= 100) return 'NORMAL';
    if (hr <= 150) return 'TAŞİKARDİ';
    return 'KRİTİK';
  }
  function spo2Class(v) {
    if (v >= 95) return 'good';
    if (v >= 90) return 'warn';
    return 'bad';
  }

  let renderedLogId = 0;
  function renderLog() {
    if (!dom.log || state.logSeq === renderedLogId) return;
    renderedLogId = state.logSeq;
    const frag = document.createDocumentFragment();
    state.log.slice(0, 40).forEach(entry => {
      const div = document.createElement('div');
      div.className = 'log-entry log-' + entry.level;
      div.innerHTML = `<span class="log-t">${entry.t.toFixed(1)}s</span>
        <span class="log-msg">${escapeHtml(entry.message)}</span>`;
      frag.appendChild(div);
    });
    dom.log.innerHTML = '';
    dom.log.appendChild(frag);
    if (dom.logCount) dom.logCount.textContent = state.log.length;
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => (
      { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
    ));
  }

  // =================================================================
  //  KLAVYE KISAYOLLARI
  // =================================================================
  function bindKeyboard() {
    document.addEventListener('keydown', e => {
      if (e.target.tagName === 'INPUT') return;
      switch (e.key) {
        case ' ':
          e.preventDefault(); toggleRun(); break;
        case 'r': case 'R':
          resetSim(); break;
        case 'ArrowUp':
          e.preventDefault(); nudgeHR(6); break;
        case 'ArrowDown':
          e.preventDefault(); nudgeHR(-6); break;
        case '1': case '2': case '3':
        case '4': case '5': case '6': {
          const idx = parseInt(e.key, 10) - 1;
          const sc = Scen.SCENARIOS[idx];
          if (sc) {
            Scen.setScenario(state, sc.id, Physio);
            syncScenarioUI();
            Physio.logEvent(state, 'info', `Senaryo: ${sc.name} (kısayol)`);
          }
          break;
        }
      }
    });
  }

  // Baslat
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
