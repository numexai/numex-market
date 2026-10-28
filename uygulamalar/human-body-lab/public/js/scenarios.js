/**
 * scenarios.js — Klinik Senaryo Motoru
 * ---------------------------------------------------------------
 * Her senaryo, physiology cekirdeginin PARAMETRELERINE zamanla
 * mudahale eder. Boylece metrikler gercekten degisir; sadece
 * gorsel animasyon degildir.
 *
 * apply(st, dt) her simule adimda cagrilir.
 * enter(st) senaryo baslangicinda, exit(st) bitisinde.
 * ---------------------------------------------------------------
 */
(function (root) {
  'use strict';

  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;

  /** Hedef degere yumusak yaklasim. */
  function approach(cur, target, rate, dt) {
    return lerp(cur, target, clamp(rate * dt, 0, 1));
  }

  const SCENARIOS = [
    {
      id: 'rest',
      name: 'Dinlenme',
      icon: '🛋️',
      desc: 'Bazal metabolizma. Kalp 72 bpm, oksijen dengesi tam.',
      enter(st) {
        st.hrSet = 72; st.respRate = 14; st.vascularTone = 1.0;
        st.o2Load = 1.0; st.nerveConduction = 1.0; st.neuralTone = 1.0;
      },
      apply(st, dt) {
        st.hr = approach(st.hr, 72, 0.6, dt);
        st.respRate = approach(st.respRate, 14, 0.5, dt);
        st.spo2 = clamp(st.spo2 + dt * 0.15, 0, 99.9);
        st.nerveConduction = approach(st.nerveConduction, 1.0, 0.4, dt);
      }
    },

    {
      id: 'exercise',
      name: 'Egzersiz',
      icon: '🏃',
      desc: 'Kaslar O2 cekiyor. Kalp hizi ve debisi tavan yapar, damarlar genisler.',
      enter(st) {
        st.hrSet = 150; st.respRate = 32; st.vascularTone = 0.82;
        st.o2Load = 1.05; st.nerveConduction = 1.25; st.neuralTone = 1.5;
      },
      apply(st, dt) {
        st.hr = approach(st.hr, 150, 0.35, dt);
        st.respRate = approach(st.respRate, 32, 0.4, dt);
        st.vascularTone = approach(st.vascularTone, 0.82, 0.5, dt);
        st.o2Load = approach(st.o2Load, 1.05, 0.3, dt);
        st.nerveConduction = approach(st.nerveConduction, 1.25, 0.3, dt);
      }
    },

    {
      id: 'stress',
      name: 'Stres / Adrenalin',
      icon: '⚡',
      desc: 'Sempatik ates. Damarlar daralir, kalp hizlanir, tansiyon yukselir.',
      enter(st) {
        st.hrSet = 118; st.respRate = 22; st.vascularTone = 1.35;
        st.o2Load = 1.0; st.nerveConduction = 1.15; st.neuralTone = 2.2;
      },
      apply(st, dt) {
        st.hr = approach(st.hr, 118, 0.5, dt);
        st.respRate = approach(st.respRate, 22, 0.5, dt);
        st.vascularTone = approach(st.vascularTone, 1.35, 0.6, dt);
        st.nerveConduction = approach(st.nerveConduction, 1.15, 0.5, dt);
        st.neuralTone = approach(st.neuralTone, 2.2, 0.6, dt);
      }
    },

    {
      id: 'hypoxia',
      name: 'Oksijen Dususu',
      icon: '🫁',
      desc: 'Akciger verimi dustu (yuksek irtifa / tikali hava yolu). SpO2 cokuyor.',
      enter(st) {
        st.o2Load = 0.45; st.hrSet = 108; st.respRate = 26;
        st.vascularTone = 1.1; st.neuralTone = 1.6;
      },
      apply(st, dt) {
        st.o2Load = approach(st.o2Load, 0.45, 0.4, dt);
        st.hr = approach(st.hr, 108, 0.4, dt);
        st.respRate = approach(st.respRate, 26, 0.4, dt);
        // hipoksi geri beslemesi: SpO2 < 90 ise kalp daha da zorlanir
        if (st.spo2 < 90) st.hr = approach(st.hr, 118, 0.3, dt);
      }
    },

    {
      id: 'arrhythmia',
      name: 'Ritim Bozuklugu',
      icon: '💔',
      desc: 'Atriyal fibrilasyon simulasyonu. Ritim duzensiz, debi dalgalanir.',
      enter(st) {
        st.hrSet = 132; st.respRate = 18; st.vascularTone = 1.0;
        st.nerveConduction = 0.95;
      },
      apply(st, dt) {
        // Duzensiz ritim: hedef surekli zipluyor (AF benzeri)
        const jitter = Math.sin(st.t * 3.1) * 26 + Math.sin(st.t * 7.7) * 14;
        st.hr = approach(st.hr, clamp(132 + jitter, 70, 190), 1.8, dt);
        st.respRate = approach(st.respRate, 18, 0.5, dt);
        // Etkin debi dusuk — her atim tam dolmaz
        st.sv = clamp(st.sv * 0.82, 30, 130);
      }
    },

    {
      id: 'nerve-delay',
      name: 'Sinir Iletim Gecikmesi',
      icon: '🐌',
      desc: 'Miyelin hasari (MS benzeri). Sinir hizi duser, tepki suresi uzar.',
      enter(st) {
        st.hrSet = 78; st.respRate = 15; st.nerveConduction = 0.35;
        st.vascularTone = 1.0;
      },
      apply(st, dt) {
        st.hr = approach(st.hr, 78, 0.5, dt);
        st.respRate = approach(st.respRate, 15, 0.5, dt);
        st.nerveConduction = approach(st.nerveConduction, 0.35, 0.4, dt);
        st.neuralTone = approach(st.neuralTone, 0.85, 0.5, dt);
      }
    }
  ];

  function getById(id) {
    return SCENARIOS.find(s => s.id === id) || SCENARIOS[0];
  }

  /** Senaryoyu uygula (her frame cagrilir). */
  function applyScenario(st, dt) {
    const sc = getById(st.scenario);
    sc.apply(st, dt);
    st.hrSet = Math.round(st.hr);
    return sc;
  }

  /** Senaryo degistir; gecis olayini logla. */
  function setScenario(st, id, physio) {
    const prev = getById(st.scenario);
    const next = getById(id);
    if (prev.id === next.id) return next;

    st.scenario = id;
    st.scenarioT = 0;
    if (next.enter) next.enter(st);

    if (physio) {
      physio.logEvent(st, 'info', `Senaryo: ${prev.name} → ${next.name}`);
    }
    return next;
  }

  const api = { SCENARIOS, getById, applyScenario, setScenario };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.NumexScenarios = api;
})(typeof window !== 'undefined' ? window : globalThis);
