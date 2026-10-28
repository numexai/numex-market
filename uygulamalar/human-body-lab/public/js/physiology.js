/**
 * physiology.js — Fizyoloji Cekirdegi
 * ---------------------------------------------------------------
 * Bu modul UI'dan TAMAMEN bagimsizdir. Sadece sayilar ve durum
 * yonetir. Render katmani buradan okur, buradan yazmaz.
 *
 * Temel model:
 *   Kalp -> atim hacmi (SV) x kalp hizi (HR) = kalp debisi (CO)
 *   CO -> dokuya O2 tasima -> oksijen saturasyonu (SpO2)
 *   Sinir -> lif hizi x yol uzunlugu -> tepki suresi (ms)
 * ---------------------------------------------------------------
 */
(function (root) {
  'use strict';

  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;

  /** Simulasyon durumu. Tum metrikler burada yasar. */
  function createState() {
    const st = {
      t: 0,
      running: true,
      speed: 1,

      // --- Kalp ---
      hr: 72,
      hrSet: 72,
      sv: 70,
      contract: 0,
      beatPhase: 0,
      beatCount: 0,
      lastBP: { sys: 120, dia: 80 },

      // --- Dolasim ---
      vascularTone: 1.0,
      map: 93,
      flow: 5.0,
      flowRate: 1.0,

      // --- Solunum / Oksijen ---
      spo2: 98,
      paO2: 95,
      respRate: 14,
      respPhase: 0,
      o2Load: 1.0,

      // --- Sinir sistemi ---
      nerveConduction: 1.0,
      neuralTone: 1.0,
      responseMs: 0,
      lastTarget: null,
      spinalLoad: 0,

      // --- Senaryo ---
      scenario: 'rest',
      scenarioT: 0,

      // --- Olay gunlugu ---
      log: [],
      logSeq: 0,

      // --- Gecmis (sparkline) ---
      history: { hr: [], spo2: [], flow: [], resp: [] },
      _histAcc: 0
    };
    return st;
  }

  /** Gunluge olay ekle. */
  function logEvent(st, level, message) {
    st.logSeq++;
    st.log.unshift({ id: st.logSeq, t: +st.t.toFixed(1), level, message });
    if (st.log.length > 120) st.log.pop();
    return st.log[0];
  }

  /**
   * Kalp kasilma dongusu.
   * Atim suresi RR = 60 / HR.
   * Sistol dongunun ilk ~%38'i; kalp hizi arttikca sistol kisalir.
   */
  function stepCardiac(st, dt) {
    const hr = clamp(st.hr, 20, 240);
    const rr = 60 / hr;

    st.beatPhase += dt / rr;
    while (st.beatPhase >= 1) {
      st.beatPhase -= 1;
      st.beatCount++;
      onBeat(st);
    }

    const sysFrac = clamp(0.38 * (1 - (hr - 60) / 400), 0.22, 0.42);
    if (st.beatPhase < sysFrac) {
      const p = st.beatPhase / sysFrac;
      st.contract = Math.pow(Math.sin(p * Math.PI), 0.7);
    } else {
      st.contract = 0;
    }
  }

  /** Her atimda: atim hacmi ve kan basinci dalgasi. */
  function onBeat(st) {
    const preload = clamp(1.0 - (st.vascularTone - 1) * 0.15, 0.7, 1.3);
    const fill = clamp(st.o2Load * 0.5 + 0.5, 0.6, 1.15);
    st.sv = clamp(70 * preload * fill, 35, 130);

    const pulsePressure = clamp(st.sv * 0.6 * st.vascularTone, 25, 90);
    st.lastBP = {
      sys: Math.round(st.map + pulsePressure * 0.6),
      dia: Math.round(st.map - pulsePressure * 0.4)
    };
  }

  /** Hemodinamik: CO = HR x SV / 1000, MAP = CO x SVR. */
  function stepHemodynamics(st, dt) {
    const co = (st.hr * st.sv) / 1000;
    st.flow = co;
    st.flowRate = lerp(st.flowRate, co / 5.0, clamp(dt * 2.5, 0, 1));

    // MAP = CO x SVR. Normal: 5 L/dk x 18.6 = 93 mmHg.
    const svr = 18.6 * st.vascularTone;
    let mapTarget = co * svr;

    // Baroreseptor refleksi: CO cok artinca damarlar genisler,
    // MAP lineer degil (CO^0.65) buyur. Egzersizde MAP ~140'ta kalir.
    if (co > 5) {
      mapTarget = 5 * svr + (Math.pow(co / 5, 0.65) - 1) * 5 * svr * 0.55;
    }
    mapTarget = clamp(mapTarget, 40, 190);
    st.map = lerp(st.map, mapTarget, clamp(dt * 1.2, 0, 1));
  }

  /**
   * Gaz degisimi. Alveoler PO2 -> arteriyel PO2 -> SpO2.
   * Oksihemoglobin dissosiyasyon egrisi Hill yaklasimi (n=2.7, P50=26.8).
   */
  function stepOxygen(st, dt) {
    const rr = clamp(st.respRate, 4, 60);
    st.respPhase = (st.respPhase + dt / (60 / rr)) % 1;

    const ventFactor = clamp(st.respRate / 14, 0.5, 2.0);
    let pao2 = 100 * st.o2Load * (0.85 + 0.15 * Math.min(ventFactor, 1.6));

    // V/Q uyumsuzlugu: CO cok dusukse difuzyon bozulur
    const vq = clamp(0.7 + 0.3 * Math.min(st.flowRate, 1.5), 0.7, 1.15);
    pao2 = clamp(pao2 * vq, 25, 125);

    st.paO2 = lerp(st.paO2, pao2, clamp(dt * 0.6, 0, 1));

    const p50 = 26.8, n = 2.7;
    const sat = clamp(
      (Math.pow(st.paO2, n) / (Math.pow(st.paO2, n) + Math.pow(p50, n))) * 100,
      20, 99.9
    );
    st.spo2 = lerp(st.spo2, sat, clamp(dt * 0.9, 0, 1));
  }

  /** Sinir iletim hizi (goreli): normal 50 m/s referans. */
  function nerveVelocity(st) {
    return 50 * st.nerveConduction;
  }

  /**
   * Hedefe sinyal gonder; tepki suresini milisaniye cinsinden hesapla.
   * 1 goreli yol birimi = 0.45 m; +8 ms sinaptik gecikme.
   */
  function fireSignal(st, target) {
    const distanceM = (target.pathLength || 1) * 0.45;
    const v = nerveVelocity(st);
    const latency = (distanceM / v) * 1000 + 8;
    const toneFactor = clamp(1 / st.neuralTone, 0.85, 1.25);

    st.responseMs = Math.round(latency * toneFactor);
    st.lastTarget = target.id;
    st.spinalLoad = 1.0;

    return {
      ms: st.responseMs,
      distanceM: +distanceM.toFixed(3),
      velocity: +v.toFixed(1),
      target
    };
  }

  function stepNeural(st, dt) {
    st.spinalLoad = Math.max(0, st.spinalLoad - dt * 0.9);
    st.neuralTone = lerp(st.neuralTone, 1.0, clamp(dt * 0.15, 0, 1));
  }

  function stepHistory(st, dt) {
    st._histAcc += dt;
    if (st._histAcc < 0.25) return;
    st._histAcc = 0;
    push(st.history.hr, st.hr);
    push(st.history.spo2, st.spo2);
    push(st.history.flow, st.flow);
    push(st.history.resp, st.respRate);
  }
  function push(arr, v) {
    arr.push(v);
    if (arr.length > 120) arr.shift();
  }

  /** ANA ADIM. dt = gercek saniye; speed ile olceklenir. */
  function step(st, dt) {
    if (!st.running) return;
    const simDt = clamp(dt, 0, 0.1) * st.speed;
    st.t += simDt;
    st.scenarioT += simDt;

    stepCardiac(st, simDt);
    stepHemodynamics(st, simDt);
    stepOxygen(st, simDt);
    stepNeural(st, simDt);
    stepHistory(st, simDt);
  }

  /** Anlik metrik demeti — API ve UI ayni sekli kullanir. */
  function snapshot(st) {
    return {
      t: +st.t.toFixed(2),
      running: st.running,
      speed: st.speed,
      hr: Math.round(st.hr),
      sv: Math.round(st.sv),
      contract: +st.contract.toFixed(3),
      beatPhase: +st.beatPhase.toFixed(3),
      beatCount: st.beatCount,
      flow: +st.flow.toFixed(2),
      flowRate: +st.flowRate.toFixed(2),
      map: Math.round(st.map),
      bp: st.lastBP,
      spo2: +st.spo2.toFixed(1),
      paO2: +st.paO2.toFixed(1),
      respRate: Math.round(st.respRate),
      respPhase: +st.respPhase.toFixed(3),
      nerveConduction: +st.nerveConduction.toFixed(2),
      neuralTone: +st.neuralTone.toFixed(2),
      responseMs: st.responseMs,
      lastTarget: st.lastTarget,
      scenario: st.scenario
    };
  }

  /** Vucut bolgeleri: sinir yolu uzunluklari (goreli birim). */
  const BODY_TARGETS = {
    head:  { id: 'head',  label: 'Bas / Yuz',    pathLength: 0.6, type: 'sensory' },
    larm:  { id: 'larm',  label: 'Sol Kol',      pathLength: 1.0, type: 'motor' },
    rarm:  { id: 'rarm',  label: 'Sag Kol',      pathLength: 1.0, type: 'motor' },
    lhand: { id: 'lhand', label: 'Sol El',       pathLength: 1.4, type: 'sensory' },
    rhand: { id: 'rhand', label: 'Sag El',       pathLength: 1.4, type: 'sensory' },
    chest: { id: 'chest', label: 'Gogus / Kalp', pathLength: 0.7, type: 'sensory' },
    lleg:  { id: 'lleg',  label: 'Sol Bacak',    pathLength: 1.9, type: 'motor' },
    rleg:  { id: 'rleg',  label: 'Sag Bacak',    pathLength: 1.9, type: 'motor' },
    lfoot: { id: 'lfoot', label: 'Sol Ayak',     pathLength: 2.3, type: 'sensory' },
    rfoot: { id: 'rfoot', label: 'Sag Ayak',     pathLength: 2.3, type: 'sensory' }
  };

  const api = {
    createState, step, snapshot, fireSignal, nerveVelocity, logEvent,
    BODY_TARGETS, clamp, lerp
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.NumexPhysiology = api;
})(typeof window !== 'undefined' ? window : globalThis);
