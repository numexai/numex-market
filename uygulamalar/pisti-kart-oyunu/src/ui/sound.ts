/**
 * Oyun sesleri — Web Audio API ile sentezlenir (dosya bağımlılığı yok).
 * Kullanıcı etkileşiminden sonra başlatılır (tarayıcı politikası).
 */
let ctx: AudioContext | null = null;
let enabled = true;

function ac(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (ctx) return ctx;
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  ctx = new Ctor();
  return ctx;
}

/** Kısa bir ton çalar */
function tone(freq: number, duration: number, type: OscillatorType = 'sine', gain = 0.06): void {
  if (!enabled) return;
  const a = ac();
  if (!a) return;
  if (a.state === 'suspended') void a.resume();
  const osc = a.createOscillator();
  const g = a.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  g.gain.setValueAtTime(gain, a.currentTime);
  g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + duration);
  osc.connect(g);
  g.connect(a.destination);
  osc.start();
  osc.stop(a.currentTime + duration);
}

/** Kart oynama sesi */
export function playCardSound(): void {
  tone(320, 0.08, 'triangle', 0.05);
}

/** Kart alma sesi */
export function playCaptureSound(): void {
  tone(520, 0.1, 'sine', 0.05);
  window.setTimeout(() => tone(660, 0.12, 'sine', 0.04), 70);
}

/** Pişti sesi */
export function playPistiSound(): void {
  tone(660, 0.12, 'sine', 0.07);
  window.setTimeout(() => tone(880, 0.14, 'sine', 0.07), 100);
  window.setTimeout(() => tone(1100, 0.18, 'sine', 0.06), 200);
}

/** Tur sonu sesi */
export function playRoundEndSound(): void {
  tone(440, 0.15, 'sine', 0.05);
  window.setTimeout(() => tone(330, 0.2, 'sine', 0.05), 140);
}

/** Geçersiz hamle sesi */
export function playErrorSound(): void {
  tone(160, 0.15, 'square', 0.04);
}

/** Zafer sesi */
export function playWinSound(): void {
  [523, 659, 784, 1046].forEach((f, i) => {
    window.setTimeout(() => tone(f, 0.25, 'sine', 0.07), i * 130);
  });
}

/** Sesleri aç/kapat */
export function setSoundEnabled(on: boolean): void {
  enabled = on;
}

export function isSoundEnabled(): boolean {
  return enabled;
}
