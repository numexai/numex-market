/**
 * particles.js — Parcacik Motoru
 * ---------------------------------------------------------------
 * Iki parcacik ailesi:
 *  1) Kan parcaciklari  → damar yollari uzerinde akar.
 *     Atardamar: kalpten dista (kirmizi), toplardamar: kalbe (mavi).
 *  2) Sinir paketleri   → sinir yolu uzerinde beyin<->hedef arasi
 *     gider; motor ve duyusal ayri renk.
 *
 * Hiz, physiology state'indeki flowRate'e BAGLIDIR — kalp
 * hizlandiginda kan gercekten hizlanir.
 * ---------------------------------------------------------------
 */
(function (root) {
  'use strict';

  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  /** Yol uzerinde t'ye (0..1) karsilik gelen konum. */
  function pointAt(pts, t) {
    const n = pts.length - 1;
    if (n <= 0) return { x: pts[0][0], y: pts[0][1] };
    const seg = clamp(t, 0, 1) * n;
    const i = Math.min(Math.floor(seg), n - 1);
    const f = seg - i;
    const a = pts[i], b = pts[i + 1];
    return {
      x: a[0] + (b[0] - a[0]) * f,
      y: a[1] + (b[1] - a[1]) * f
    };
  }

  /** Yol toplam uzunlugu (normalize uzayda). */
  function pathLength(pts) {
    let len = 0;
    for (let i = 1; i < pts.length; i++) {
      const dx = pts[i][0] - pts[i - 1][0];
      const dy = pts[i][1] - pts[i - 1][1];
      len += Math.sqrt(dx * dx + dy * dy);
    }
    return len;
  }

  /**
   * Kan parcacik sistemi.
   * Her damar icin N parcacik; t degeri ilerler.
   * Atardamarda t artar (kalp→uc), toplardamarda t azalir (uc→kalp).
   */
  function createBloodSystem(VESSELS) {
    const particles = [];

    VESSELS.forEach(v => {
      const len = pathLength(v.pts);
      // Parcacik sayisi damar uzunlugu ve capina bagli
      const count = Math.max(3, Math.round(len * 90 * (v.calibre / 2)));
      for (let i = 0; i < count; i++) {
        particles.push({
          vesselId: v.id,
          type: v.type,
          calibre: v.calibre,
          t: i / count + (Math.random() - 0.5) * 0.01,
          // akis yonu: atardamar ileri, toplardamar geri
          dir: v.type === 'artery' ? 1 : -1,
          size: 0.8 + Math.random() * 1.4,
          alpha: 0.55 + Math.random() * 0.45,
          jitter: (Math.random() - 0.5) * 0.006,
          // parcacigin akis boyunca hafif hiz farki (laminar akis)
          speedMul: 0.75 + Math.random() * 0.5
        });
      }
    });

    return { particles, vesselMap: buildMap(VESSELS) };
  }

  function buildMap(VESSELS) {
    const m = {};
    VESSELS.forEach(v => { m[v.id] = v; });
    return m;
  }

  /**
   * Kan parcaciklarini ilerlet.
   * Fizyoloji: debi (CO) artinca damar capi da vazodilatasyonla buyur,
   * bu yuzden akis hizi yaklasik debi ile ORANTILI kalir (Q = A x v).
   * Vaskuler tonus yalnizca kucuk bir duzeltme yapar (sert 1/tone degil).
   */
  function stepBlood(sys, st, dt) {
    const base = 0.055 * st.flowRate;          // taban ilerleme hizi
    const tone = clamp(1 / Math.sqrt(clamp(st.vascularTone, 0.6, 1.8)), 0.8, 1.2);

    for (let i = 0; i < sys.particles.length; i++) {
      const p = sys.particles[i];
      // Daralmis damarda akis hizlanir (Bernoulli benzeri etki)
      const v = base * p.speedMul * tone * (p.type === 'artery' ? 1.15 : 0.85);
      p.t += v * dt * p.dir;

      // Dongu: uctan bitince basa don
      if (p.t > 1) p.t -= 1;
      if (p.t < 0) p.t += 1;
    }
  }

  /**
   * Sinir sinyal paketi.
   * Omurilik/beyinden cikip hedefe ilerler, sonra kisa sure kaybolur.
   */
  function createNerveSignal(nerve, type, responseMs) {
    return {
      nerveId: nerve.id,
      target: nerve.target,
      type: type || nerve.type,
      t: 0,
      age: 0,
      // Ilerleme hizi: fizyolojik tepki suresi ile TERS orantili.
      // Gercek 20ms'lik bir sinyal gozle gorulemedigi icin animasyon
      // olceklenir: hizli sinyal ~0.35s, yavas sinyal ~2.5s surer.
      // sinir iletim senaryosu (gecikme) boylece EKRANDA gorunur olur.
      speed: clamp(2.6 * (60 / Math.max(responseMs, 12)), 0.4, 7.5),
      responseMs: responseMs,
      done: false,
      life: 0
    };
  }

  /** Sinyalleri ilerlet. */
  function stepSignals(signals, dt) {
    for (let i = signals.length - 1; i >= 0; i--) {
      const s = signals[i];
      s.age += dt;
      if (!s.done) {
        s.t += s.speed * dt;
        if (s.t >= 1) { s.t = 1; s.done = true; }
      } else {
        s.life += dt;
        if (s.life > 0.55) signals.splice(i, 1);
      }
    }
  }

  /**
   * Nabiz dalgasi: her kalp atiminda atardamarlarda basinc dalgasi
   * yayilir. Gorsel: damar uzerinde ilerleyen parlak halka.
   */
  function createPulseWave(VESSELS, vesselId) {
    return { vesselId, t: 0, speed: 1.6, life: 0 };
  }

  function stepPulses(pulses, dt) {
    for (let i = pulses.length - 1; i >= 0; i--) {
      const w = pulses[i];
      w.t += w.speed * dt;
      w.life += dt;
      if (w.t > 1) pulses.splice(i, 1);
    }
  }

  const api = {
    pointAt, pathLength,
    createBloodSystem, stepBlood,
    createNerveSignal, stepSignals,
    createPulseWave, stepPulses
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.NumexParticles = api;
})(typeof window !== 'undefined' ? window : globalThis);
