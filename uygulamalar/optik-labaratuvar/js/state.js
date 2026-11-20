// NUMEX PRİZMA — state.js
// Tek doğruluk kaynağı: elemanlar, ortam, kamera, undo/redo, kaydet/yükle.

import { ORTAMLAR, validateMediumIndex, traceAll } from './optics.js';

export const MAX_UNDO = 50;
export const STORAGE_KEY = 'numex_prizma_deney_v1';

const VARSAYILAN = {
  pointSource: { rays: 9, spread: 60, wavelength: 550, color: '#fff3b0' },
  parallelSource: { rays: 7, length: 160, wavelength: 0, color: '#ffffff' },
  planeMirror: { length: 180 },
  concaveMirror: { length: 160, radius: 220 },
  convexMirror: { length: 160, radius: 220 },
  convergingLens: { size: 170, f: 120, n: 1.52 },
  divergingLens: { size: 170, f: -120, n: 1.52 },
  prism: { size: 160, apex: 60, n: 1.52 },
  screen: { length: 180 },
  wall: { length: 180 }
};

let sayac = 1;

export function makeElement(tip, x = 0, y = 0) {
  const base = {
    id: 'el_' + sayac++,
    tip, x, y, angle: 0,
    visible: true, locked: false,
    ...(VARSAYILAN[tip] || {})
  };
  if (tip === 'planeMirror' || tip === 'screen' || tip === 'wall') base.length = VARSAYILAN[tip].length;
  return base;
}

export function makeState() {
  return {
    elements: [],
    seciliId: null,
    ortam: { ad: 'hava', n: ORTAMLAR.hava, hedefAd: 'cam', hedefN: 1.5 },
    camera: { x: 0, y: 0, zoom: 1 },
    izAcik: true,
    animasyon: { acik: true, progress: 1, hiz: 900 },
    sonuclar: { paths: [], stats: { kaynakIsin: 0, yolSayisi: 0, yansima: 0, kirilma: 0, sonlanma: 0, tir: 0 } },
    undo: [], redo: [],
    dirty: true,
    meta: { deneyId: null, ad: 'Yeni Deney', olusturma: Date.now() }
  };
}

const snapshot = (state) => ({
  elements: JSON.parse(JSON.stringify(state.elements)),
  seciliId: state.seciliId,
  ortam: JSON.parse(JSON.stringify(state.ortam)),
  meta: JSON.parse(JSON.stringify(state.meta))
});

function restore(state, snap) {
  state.elements = JSON.parse(JSON.stringify(snap.elements));
  state.seciliId = snap.seciliId;
  state.ortam = JSON.parse(JSON.stringify(snap.ortam));
  state.meta = JSON.parse(JSON.stringify(snap.meta));
  state.dirty = true;
}

export function pushUndo(state) {
  state.undo.push(snapshot(state));
  if (state.undo.length > MAX_UNDO) state.undo.shift();
  state.redo.length = 0;
}

export function undo(state) {
  if (!state.undo.length) return false;
  state.redo.push(snapshot(state));
  restore(state, state.undo.pop());
  return true;
}

export function redo(state) {
  if (!state.redo.length) return false;
  state.undo.push(snapshot(state));
  restore(state, state.redo.pop());
  return true;
}

export function addElement(state, tip, x = 0, y = 0) {
  pushUndo(state);
  const el = makeElement(tip, x, y);
  state.elements.push(el);
  state.seciliId = el.id;
  state.dirty = true;
  return el;
}

export function removeElement(state, id) {
  const i = state.elements.findIndex((e) => e.id === id);
  if (i < 0) return false;
  pushUndo(state);
  state.elements.splice(i, 1);
  if (state.seciliId === id) state.seciliId = null;
  state.dirty = true;
  return true;
}

export function updateElement(state, id, patch, { pushUndo: doUndo = true } = {}) {
  const el = state.elements.find((e) => e.id === id);
  if (!el) return false;
  // doğrulama: kırılma indisi alanları
  if ('f' in patch && (patch.f === 0 || !isFinite(patch.f))) return false;
  if ('n' in patch) validateMediumIndex(patch.n);
  if (doUndo) pushUndo(state);
  Object.assign(el, patch);
  state.dirty = true;
  return true;
}

export function setOrtam(state, ad, n) {
  validateMediumIndex(n);
  pushUndo(state);
  state.ortam.ad = ad ?? 'özel';
  state.ortam.n = n;
  state.dirty = true;
  return true;
}

export function secimAyarla(state, id) {
  state.seciliId = id;
}

export function sifirla(state) {
  pushUndo(state);
  state.elements = [];
  state.seciliId = null;
  state.meta = { deneyId: null, ad: 'Yeni Deney', olusturma: Date.now() };
  state.dirty = true;
}

export function kaydetJSON(state) {
  return JSON.stringify({
    surum: 1,
    meta: state.meta,
    ortam: state.ortam,
    camera: state.camera,
    izAcik: state.izAcik,
    elements: state.elements
  }, null, 2);
}

export function yukleJSON(jsonStr) {
  let data;
  try {
    data = typeof jsonStr === 'string' ? JSON.parse(jsonStr) : jsonStr;
  } catch (e) {
    throw new Error('JSON çözümlenemedi: ' + e.message);
  }
  if (!data || !Array.isArray(data.elements)) throw new Error('Geçersiz deney dosyası: "elements" dizisi yok.');
  const st = makeState();
  st.elements = data.elements.map((e) => ({ ...e }));
  st.ortam = data.ortam && typeof data.ortam.n === 'number' ? data.ortam : st.ortam;
  validateMediumIndex(st.ortam.n);
  st.camera = data.camera || st.camera;
  st.izAcik = data.izAcik !== false;
  st.meta = data.meta || st.meta;
  // id sayacını ileri al
  for (const e of st.elements) {
    const m = /el_(\d+)/.exec(e.id || '');
    if (m) sayac = Math.max(sayac, parseInt(m[1], 10) + 1);
  }
  st.dirty = true;
  return st;
}

export function localStorageKaydet(state) {
  try { localStorage.setItem(STORAGE_KEY, kaydetJSON(state)); return true; } catch { return false; }
}

export function localStorageYukle() {
  try {
    const s = localStorage.getItem(STORAGE_KEY);
    if (!s) return null;
    return yukleJSON(s);
  } catch { return null; }
}

/** Sonuçları tazeler (dirty ise). */
export function yenidenHesapla(state) {
  state.sonuclar = traceAll(state);
  state.dirty = false;
  return state.sonuclar;
}
