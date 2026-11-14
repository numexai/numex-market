/* =========================================================================
   NUMEX LASER PRO — v1.0
   Lazer kesim atölyeleri için tarayıcı tabanlı 2D vektörel tasarım stüdyosu.
   Motor: saf Canvas2D, bağımlılık yok. Ölçü birimi: milimetre (mm).
   Dünya koordinatı: X sağa, Y AŞAĞI (SVG ile aynı). Origin: çalışma alanı sol üst.
   Not: Bu sürüm sadece tasarım/hazırlık yapar; makine bağlantısı ve G-code YOKTUR.
   ========================================================================= */
(() => {
'use strict';

/* ------------------------------------------------------------------ State */
const state = {
  objects: [],
  selection: new Set(),
  activeLayer: 'cut',
  layers: {
    cut:   { id:'cut',   name:'Kesim',      color:'#ff3b4e', speed:12,  power:85, passes:1 },
    engrave:{ id:'engrave', name:'Gravür',  color:'#3b8bff', speed:120, power:45, passes:1 },
    mark:  { id:'mark',  name:'İşaretleme', color:'#25d366', speed:200, power:20, passes:1 }
  },
  bed: { w:300, h:200 },
  zoom: 2.2,             // px per mm
  pan: { x: 40, y: 40 }, // ekran ofseti (px)
  tool: 'select',
  history: [], histIdx: -1, histLock: false,
  drag: null,
  uid: 1,
  lastAnalysis: null
};

const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const TYPE_NAME = { rect:'Dikdörtgen', ellipse:'Daire', line:'Çizgi', polygon:'Çokgen', path:'Serbest', text:'Metin', group:'Grup' };

/* ------------------------------------------------------------- Yardımcı */
const r2 = n => Math.round(n * 100) / 100;
const clone = o => JSON.parse(JSON.stringify(o));

function snapshot() {
  return {
    objects: clone(state.objects),
    bed: { ...state.bed },
    layers: clone(state.layers),
    activeLayer: state.activeLayer,
    selection: [...state.selection],
    uid: state.uid
  };
}
function pushHistory() {
  if (state.histLock) return;
  state.history = state.history.slice(0, state.histIdx + 1);
  state.history.push(snapshot());
  if (state.history.length > 80) state.history.shift();
  state.histIdx = state.history.length - 1;
  syncUndoButtons();
}
// NUMEX-DÜZELTME (2026-11-14): applySnapshot her undo/redo'da pan/zoom'u yeniden sıfırlıyordu; görünüm artık geri yüklemeden etkilenmez.
function applySnapshot(s) {
  state.histLock = true;
  state.objects = clone(s.objects);
  state.bed = { ...s.bed };
  state.layers = clone(s.layers);
  state.activeLayer = s.activeLayer;
  state.selection = new Set(s.selection);
  state.uid = s.uid;
  state.histLock = false;
  refreshUI(); draw();
}

function undo() { if (state.histIdx > 0) { state.histIdx--; applySnapshot(state.history[state.histIdx]); syncUndoButtons(); } }
function redo() { if (state.histIdx < state.history.length - 1) { state.histIdx++; applySnapshot(state.history[state.histIdx]); syncUndoButtons(); } }
function syncUndoButtons() {
  $('#btnUndo').disabled = state.histIdx <= 0;
  $('#btnRedo').disabled = state.histIdx >= state.history.length - 1;
}

/* ------------------------------------------------- Koordinat dönüşümleri */
function mmToPx(x, y) {
  return { x: x * state.zoom + state.pan.x, y: y * state.zoom + state.pan.y };
}
function pxToMm(px, py) {
  return { x: (px - state.pan.x) / state.zoom, y: (py - state.pan.y) / state.zoom };
}

/* --------------------------------------------------- Geometri (mm uzayı) */
function objPoints(o) {
  // Nesnenin mutlak noktaları (dönüş uygulanmış). Tahmin için yeterli.
  const cx = o.x + (o.w || 0) / 2, cy = o.y + (o.h || 0) / 2;
  const rot = (p) => rotatePoint(p, { x: cx, y: cy }, o.rot || 0);
  if (o.type === 'line') return [rot({ x:o.x, y:o.y }), rot({ x:o.x + o.w, y:o.y + o.h })];
  if (o.type === 'path' || o.type === 'polygon') {
    const pts = o.points || [];
    return pts.map(p => rot({ x:o.x + p[0], y:o.y + p[1] }));
  }
  if (o.type === 'ellipse') {
    // elips çevresi (yaklaşık, Ramanujan)
    const a = o.w / 2, b = o.h / 2;
    const h = Math.pow(a - b, 2) / Math.pow(a + b, 2);
    const per = Math.PI * (a + b) * (1 + (3 * h) / (10 + Math.sqrt(4 - 3 * h)));
    return { perimeter: per };
  }
  if (o.type === 'text') {
    const per = estimateTextPerimeter(o);
    return { perimeter: per };
  }
  // rect
  if (o.radius) {
    const rr = Math.min(o.radius, o.w / 2, o.h / 2);
    return { perimeter: 2 * (o.w + o.h) - 8 * rr + 2 * Math.PI * rr, rounded: true };
  }
  return { perimeter: 2 * (o.w + o.h) };
}
function rotatePoint(p, c, deg) {
  if (!deg) return { ...p };
  const a = (deg * Math.PI) / 180, s = Math.sin(a), co = Math.cos(a);
  const dx = p.x - c.x, dy = p.y - c.y;
  return { x: c.x + dx * co - dy * s, y: c.y + dx * s + dy * co };
}
function estimateTextPerimeter(o) {
  // Metin için: uzunluk ~ karakter sayısı * yükseklik * 0.62
  const t = o.text || '';
  return t.length * (o.h || 8) * 0.62 * 2; // çift yol (harf konturları) kaba tahmin
}

// Metnin gerçek genişliği (mm) — yaklaşık: karakter başına 0,72 × font boyu
function measureTextMM(text, fontSize) {
  return r2(String(text || '').length * 0.72 * fontSize);
}

function objBounds(o) {
  if (o.type === 'text') {
    // Metnin kutusu, gerçek harf genişliğine göre güncellenir
    const w = measureTextMM(o.text, o.fontSize || 10);
    return { x1:o.x, y1:o.y, x2:o.x + w, y2:o.y + (o.fontSize || 10) };
  }
  if (o.type === 'group') {
    const b = { x1: Infinity, y1: Infinity, x2: -Infinity, y2: -Infinity };
    for (const c of o.children || []) {
      const cb = objBounds(c);
      b.x1 = Math.min(b.x1, cb.x1); b.y1 = Math.min(b.y1, cb.y1);
      b.x2 = Math.max(b.x2, cb.x2); b.y2 = Math.max(b.y2, cb.y2);
    }
    return b.x1 === Infinity ? { x1:o.x, y1:o.y, x2:o.x, y2:o.y } : b;
  }
  const pts = rotatedCorners(o);
  return {
    x1: Math.min(...pts.map(p => p.x)), y1: Math.min(...pts.map(p => p.y)),
    x2: Math.max(...pts.map(p => p.x)), y2: Math.max(...pts.map(p => p.y))
  };
}
function rotatedCorners(o) {
  const cx = o.x + o.w / 2, cy = o.y + o.h / 2;
  const corners = [
    { x:o.x, y:o.y }, { x:o.x + o.w, y:o.y },
    { x:o.x + o.w, y:o.y + o.h }, { x:o.x, y:o.y + o.h }
  ];
  return corners.map(p => rotatePoint(p, { x:cx, y:cy }, o.rot || 0));
}

function polyLength(pts, closed = false) {
  let L = 0;
  for (let i = 0; i < pts.length - 1; i++) {
    L += Math.hypot(pts[i + 1].x - pts[i].x, pts[i + 1].y - pts[i].y);
  }
  if (closed && pts.length > 1) L += Math.hypot(pts[0].x - pts[pts.length - 1].x, pts[0].y - pts[pts.length - 1].y);
  return L;
}

function objPerimeter(o) {
  if (o.type === 'group') return (o.children || []).reduce((s, c) => s + objPerimeter(c), 0);
  if (o.type === 'path') {
    const pts = (o.points || []).map(p => ({ x:o.x + p[0], y:o.y + p[1] }));
    return polyLength(pts, !!o.closed);
  }
  if (o.type === 'polygon') {
    const pts = (o.points || []).map(p => ({ x:o.x + p[0], y:o.y + p[1] }));
    return polyLength(pts, true);
  }
  const res = objPoints(o);
  return typeof res.perimeter === 'number' ? res.perimeter : 0;
}
const objLength = o => objPerimeter(o);

function flattenObjects(list, parent = null) {
  const out = [];
  for (const o of list) {
    out.push(o);
    if (o.type === 'group') out.push(...flattenObjects(o.children || [], o));
  }
  return out;
}

/* ---------------------------------------------------- Örnek proje üretimi */
function makeKeyring() {
  const bw = 80, bh = 40, radius = 6;
  const bedW = 300, bedH = 200;
  const x0 = r2((bedW - bw) / 2), y0 = r2((bedH - bh) / 2); // çalışma alanının tam ortası
  const objs = [];
  objs.push({
    id: 'k_body', type:'rect', name:'Dış kontur',
    x:x0, y:y0, w:bw, h:bh, rot:0, radius, layer:'cut', style:'outline'
  });
  // Deliğin merkezi sol kenardan 9 mm içeride (kenar → delik kenarı 6 mm kalır)
  objs.push({
    id:'k_hole', type:'ellipse', name:'Anahtarlık deliği',
    x:r2(x0 + 9 - 3), y:r2(y0 + bh / 2 - 3), w:6, h:6, rot:0, layer:'cut', style:'outline'
  });
  // Yazı deliğin sağındaki kalan alanda ortalanır (9+3 mm delik payı hariç)
  // NUMEX-DÜZELTME (2026-11-14): Yazı 10 mm'de 40 mm genişlikle 80 mm'lik gövdede deliğe ve sağ kenara taşıyordu; font 8 mm'ye çekilip delik payı hesabı gerçek metin genişliğine göre yapıldı.
  // Gerçek metin genişliği 10 mm'de ~40 mm; sığması için 8 mm yükseklik seçtik
  // (genişlik karakter sayısı × 0.72 × font boyu kuralıyla 5×0.72×8 ≈ 28,8 mm)
  const fs = 8;
  const textW = r2(5 * 0.72 * fs);
  objs.push({
    id:'k_text', type:'text', name:'NUMEX yazısı',
    x:r2(x0 + 12 + (bw - 12 - textW) / 2), y:r2(y0 + (bh - fs) / 2), w:textW, h:fs, rot:0,
    text:'NUMEX', fontSize:fs, layer:'engrave', style:'filled'
  });
  return { objects: objs, bed: { w:300, h:200 } };
}

/* --------------------------------------------------------- Çizim motoru */
const board = $('#board');
const rulers = $('#rulers');
const ctx = board.getContext('2d');
const rctx = rulers.getContext('2d');
let dpr = window.devicePixelRatio || 1;
let W = 0, H = 0;

function resize() {
  const wrap = $('#canvasWrap');
  const rect = wrap.getBoundingClientRect();
  W = rect.width; H = rect.height;
  dpr = window.devicePixelRatio || 1;
  for (const c of [board, rulers]) {
    c.width = Math.max(1, Math.round(W * dpr));
    c.height = Math.max(1, Math.round(H * dpr));
    c.style.width = W + 'px';
    c.style.height = H + 'px';
  }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  rctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  draw();
}
window.addEventListener('resize', resize);

function placeBedInView(doDraw = true) {
  const margin = 60;
  const zx = (W - margin * 2) / state.bed.w;
  const zy = (H - margin * 2) / state.bed.h;
  state.zoom = Math.max(0.4, Math.min(zx, zy));
  state.pan.x = (W - state.bed.w * state.zoom) / 2;
  state.pan.y = (H - state.bed.h * state.zoom) / 2;
  if (doDraw) { updateZoomLabel(); draw(); }
}

function gridStep() {
  // Ekranda ~10 mm ızgara; çok küçük/küçükse 50 mm'lik major çizgilere geçilir.
  const target = 10; // mm
  let step = target;
  while (step * state.zoom < 12) step *= 2;
  return step;
}

function draw() {
  ctx.clearRect(0, 0, W, H);

  // Çalışma alanı zemini
  const bedPx = mmToPx(0, 0);
  const bedW = state.bed.w * state.zoom;
  const bedH = state.bed.h * state.zoom;

  // dış zemin
  ctx.fillStyle = '#0a0d11';
  ctx.fillRect(0, 0, W, H);

  // çalışma alanı
  ctx.save();
  ctx.beginPath();
  ctx.rect(bedPx.x, bedPx.y, bedW, bedH);
  ctx.fillStyle = '#0f151c';
  ctx.fill();
  ctx.clip();

  // ızgara
  const step = gridStep();
  ctx.strokeStyle = 'rgba(120,150,180,.10)';
  ctx.lineWidth = 1;
  for (let x = 0; x <= state.bed.w + 0.001; x += step) {
    const p = mmToPx(x, 0);
    const major = Math.abs(x % (step * 5)) < 1e-6;
    ctx.strokeStyle = major ? 'rgba(120,160,200,.20)' : 'rgba(120,150,180,.09)';
    ctx.beginPath(); ctx.moveTo(p.x, bedPx.y); ctx.lineTo(p.x, bedPx.y + bedH); ctx.stroke();
  }
  for (let y = 0; y <= state.bed.h + 0.001; y += step) {
    const p = mmToPx(0, y);
    const major = Math.abs(y % (step * 5)) < 1e-6;
    ctx.strokeStyle = major ? 'rgba(120,160,200,.20)' : 'rgba(120,150,180,.09)';
    ctx.beginPath(); ctx.moveTo(bedPx.x, p.y); ctx.lineTo(bedPx.x + bedW, p.y); ctx.stroke();
  }

  // NUMEX-DÜZELTME (2026-11-14): Tuval çalışma-alanı dikdörtgeniyle clip edildikten sonra nesneler dünya koordinatıyla (mmToPx olmadan) çiziliyordu; tüm nesneler alan dışına düşüyordu. Dünya→ekran dönüşümü pan/zoom olarak katmana taşındı.
  // nesneler — dünya→ekran dönüşümü burada uygulanır
  const world = (fn) => {
    ctx.save();
    ctx.translate(state.pan.x, state.pan.y);
    ctx.scale(state.zoom, state.zoom);
    fn();
    ctx.restore();
  };
  world(() => {
    for (const o of state.objects) drawObject(o, 1);
  });

  // önizleme ve geçici çizimler ekran uzayında
  if (state.drag && state.drag.mode === 'draw' && state.drag.preview) {
    drawPreview(state.drag.preview);
  }
  if (state.drag && state.drag.mode === 'freehand' && state.drag.preview) {
    drawPreview(state.drag.preview);
  }

  // çalışma alanı çerçevesi
  ctx.strokeStyle = 'rgba(61,220,151,.55)';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(bedPx.x, bedPx.y, bedW, bedH);

  // seçim kutuları
  for (const o of state.objects) {
    if (!state.selection.has(o.id)) continue;
    drawSelectionBox(o);
  }

  drawRulers();
}

// Nesne, mm uzayında çizilir; pan/zoom çağıran tarafta (draw) uygulanır.
function drawObject(o, alpha) {
  if (o.type === 'group') { for (const c of o.children || []) drawObject(c, alpha); return; }
  const L = state.layers[o.layer] || state.layers.cut;
  const z = state.zoom;
  const x = o.x, y = o.y, w = o.w, h = o.h;

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = L.color;
  // Döngü çizgisi hiçbir zaman ekranda 0.9 px'in altına inmesin
  ctx.lineWidth = (o.layer === 'cut' ? 1.6 : 1.1) / z;

  const cx = x + w / 2, cy = y + h / 2;
  if (o.rot) {
    ctx.translate(cx, cy);
    ctx.rotate((o.rot * Math.PI) / 180);
    ctx.translate(-cx, -cy);
  }
  const doFill = o.style === 'filled';

  switch (o.type) {
    case 'rect': {
      const r = Math.min(o.radius || 0, Math.abs(w) / 2, Math.abs(h) / 2);
      roundRect(ctx, x, y, w, h, r);
      if (doFill) { ctx.fillStyle = L.color + '33'; ctx.fill(); }
      ctx.stroke();
      break;
    }
    case 'ellipse': {
      ctx.beginPath();
      ctx.ellipse(cx, cy, Math.abs(w) / 2, Math.abs(h) / 2, 0, 0, Math.PI * 2);
      if (doFill) { ctx.fillStyle = L.color + '33'; ctx.fill(); }
      ctx.stroke();
      break;
    }
    case 'line': {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + w, y + h);
      ctx.stroke();
      break;
    }
    case 'polygon':
    case 'path': {
      const pts = o.points || [];
      if (!pts.length) break;
      ctx.beginPath();
      pts.forEach((pt, i) => {
        i === 0 ? ctx.moveTo(x + pt[0], y + pt[1]) : ctx.lineTo(x + pt[0], y + pt[1]);
      });
      if (o.type === 'polygon' || o.closed) ctx.closePath();
      if (doFill) { ctx.fillStyle = L.color + '33'; ctx.fill(); }
      ctx.stroke();
      break;
    }
    case 'text': {
      const fs = o.fontSize || 10;
      ctx.font = `700 ${fs}px "Segoe UI",Arial,sans-serif`;
      ctx.textBaseline = 'top';
      // Gravür/işaretleme yazısı dolgu; kesim yazısı kontur (harf dış hattı)
      if (o.layer === 'cut') {
        ctx.strokeText(o.text || '', x, y);
      } else {
        ctx.fillStyle = L.color;
        ctx.fillText(o.text || '', x, y);
      }
      break;
    }
  }
  ctx.restore();
}

function drawPreview(prev) {
  const L = state.layers[prev.layer] || state.layers.cut;
  ctx.save();
  ctx.strokeStyle = L.color;
  ctx.fillStyle = L.color + '33';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([4, 3]);
  if (prev.type === 'rect' || prev.type === 'ellipse') {
    const a = mmToPx(Math.min(prev.x0, prev.x1), Math.min(prev.y0, prev.y1));
    const b = mmToPx(Math.max(prev.x0, prev.x1), Math.max(prev.y0, prev.y1));
    if (prev.type === 'rect') ctx.strokeRect(a.x, a.y, b.x - a.x, b.y - a.y);
    else {
      ctx.beginPath();
      ctx.ellipse((a.x + b.x) / 2, (a.y + b.y) / 2, (b.x - a.x) / 2, (b.y - a.y) / 2, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
  } else if (prev.type === 'line') {
    const a = mmToPx(prev.x0, prev.y0), b = mmToPx(prev.x1, prev.y1);
    ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
  } else if (prev.type === 'path' && prev.points) {
    ctx.beginPath();
    prev.points.forEach((pt, i) => {
      const q = mmToPx(prev.ox + pt[0], prev.oy + pt[1]);
      i === 0 ? ctx.moveTo(q.x, q.y) : ctx.lineTo(q.x, q.y);
    });
    ctx.stroke();
  }
  ctx.restore();
}

function drawSelectionBox(o) {
  const b = objBounds(o);
  const a = mmToPx(b.x1, b.y1), c = mmToPx(b.x2, b.y2);
  ctx.save();
  ctx.strokeStyle = '#3ddc97';
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 3]);
  ctx.strokeRect(a.x - 3, a.y - 3, c.x - a.x + 6, c.y - a.y + 6);
  ctx.setLineDash([]);
  ctx.fillStyle = '#3ddc97';
  for (const p of [[a.x - 3, a.y - 3], [c.x + 3, a.y - 3], [c.x + 3, c.y + 3], [a.x - 3, c.y + 3]]) {
    ctx.fillRect(p[0] - 3, p[1] - 3, 6, 6);
  }
  // Dönüş sapı
  const mx = (a.x + c.x) / 2;
  ctx.beginPath(); ctx.arc(mx, a.y - 22, 4, 0, Math.PI * 2); ctx.stroke(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(mx, a.y - 18); ctx.lineTo(mx, a.y - 3); ctx.stroke();
  ctx.restore();
}

function roundRect(c, x, y, w, h, r) {
  r = Math.max(0, Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2));
  c.beginPath();
  if (r <= 0) { c.rect(x, y, w, h); return; }
  c.moveTo(x + r, y);
  c.lineTo(x + w - r, y);
  c.arcTo(x + w, y, x + w, y + r, r);
  c.lineTo(x + w, y + h - r);
  c.arcTo(x + w, y + h, x + w - r, y + h, r);
  c.lineTo(x + r, y + h);
  c.arcTo(x, y + h, x, y + h - r, r);
  c.lineTo(x, y + r);
  c.arcTo(x, y, x + r, y, r);
  c.closePath();
}

/* ----------------------------------------------------------- Cetveller */
function drawRulers() {
  rctx.clearRect(0, 0, W, H);
  const R = 22;
  rctx.fillStyle = '#0c1117';
  rctx.fillRect(0, 0, W, R);
  rctx.fillRect(0, 0, R, H);
  rctx.strokeStyle = '#1e2832';
  rctx.beginPath();
  rctx.moveTo(0, R - 0.5); rctx.lineTo(W, R - 0.5);
  rctx.moveTo(R - 0.5, 0); rctx.lineTo(R - 0.5, H);
  rctx.stroke();

  const step = gridStep();
  rctx.fillStyle = '#5d6b7b';
  rctx.font = '9.5px "Segoe UI",Arial';
  rctx.textBaseline = 'bottom';
  rctx.textAlign = 'center';

  // X cetveli
  for (let x = 0; x <= state.bed.w + 0.001; x += step) {
    const p = mmToPx(x, 0);
    if (p.x < R || p.x > W) continue;
    const major = Math.abs(x % (step * 5)) < 1e-6;
    rctx.strokeStyle = major ? '#3a4757' : '#222d38';
    rctx.beginPath();
    rctx.moveTo(p.x, R); rctx.lineTo(p.x, R - (major ? 9 : 5));
    rctx.stroke();
    if (major) rctx.fillText(String(Math.round(x)), p.x, R - 10);
  }

  // Y cetveli
  rctx.textAlign = 'center';
  rctx.textBaseline = 'middle';
  for (let y = 0; y <= state.bed.h + 0.001; y += step) {
    const p = mmToPx(0, y);
    if (p.y < R || p.y > H) continue;
    const major = Math.abs(y % (step * 5)) < 1e-6;
    rctx.strokeStyle = major ? '#3a4757' : '#222d38';
    rctx.beginPath();
    rctx.moveTo(R, p.y); rctx.lineTo(R - (major ? 9 : 5), p.y);
    rctx.stroke();
    if (major) {
      rctx.save();
      rctx.translate(R - 11, p.y);
      rctx.rotate(-Math.PI / 2);
      rctx.fillText(String(Math.round(y)), 0, 0);
      rctx.restore();
    }
  }

  // Köşe
  rctx.fillStyle = '#0c1117';
  rctx.fillRect(0, 0, R, R);
  rctx.strokeStyle = '#1e2832';
  rctx.strokeRect(0, 0, R, R);
  rctx.fillStyle = '#3ddc97';
  rctx.font = '9.5px "Segoe UI",Arial';
  rctx.textAlign = 'center'; rctx.textBaseline = 'middle';
  rctx.fillText('mm', R / 2, R / 2);
}

/* ----------------------------------------------------------- Hit test */
function hitTest(o, mx, my) {
  if (o.type === 'group') {
    for (const c of o.children || []) if (hitTest(c, mx, my)) return true;
    return false;
  }
  if (o.locked) return false;
  if (o.type === 'line') {
    return distToSegment({ x:mx, y:my }, { x:o.x, y:o.y }, { x:o.x + o.w, y:o.y + o.h }) < 3;
  }
  if (o.type === 'path' || o.type === 'polygon') {
    const pts = (o.points || []).map(p => ({ x:o.x + p[0], y:o.y + p[1] }));
    for (let i = 0; i < pts.length - 1; i++) {
      if (distToSegment({ x:mx, y:my }, pts[i], pts[i + 1]) < 2.5) return true;
    }
    if (pts.length && distToSegment({ x:mx, y:my }, pts[pts.length - 1], pts[0]) < 2.5) return true;
    return false;
  }
  if (o.type === 'ellipse') {
    const cx = o.x + o.w / 2, cy = o.y + o.h / 2;
    return Math.hypot(mx - cx, my - cy) < Math.max(o.w, o.h) / 2 + 2;
  }
  if (o.type === 'text') {
    const b = objBounds(o);
    return mx >= b.x1 - 1 && mx <= b.x2 + 1 && my >= b.y1 - 1 && my <= b.y2 + 1;
  }
  // rect
  return mx >= o.x - 1 && mx <= o.x + o.w + 1 && my >= o.y - 1 && my <= o.y + o.h + 1;
}
function distToSegment(p, a, b) {
  const dx = b.x - a.x, dy = b.y - a.y;
  const L2 = dx * dx + dy * dy;
  if (L2 === 0) return Math.hypot(p.x - a.x, p.y - a.y);
  let t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / L2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
}
function topObjectAt(m) {
  for (let i = state.objects.length - 1; i >= 0; i--) {
    if (hitTest(state.objects[i], m.x, m.y)) return state.objects[i];
  }
  return null;
}

/* -------------------------------------------------------------- Tools */
function setTool(t) {
  state.tool = t;
  $$('#drawTools .tool').forEach(b => b.classList.toggle('active', b.dataset.tool === t));
  board.style.cursor = t === 'select' ? 'default' : 'crosshair';
  const hints = {
    select: 'Seç · sürükle taşı · Shift ile çoklu seç',
    rect: 'Dikdörtgen: sürükle (Shift = kare)',
    ellipse: 'Daire: sürükle (Shift = daire)',
    line: 'Çizgi: başla → bitir',
    polygon: 'Çokgen: sürükle (Shift = düzgün)',
    path: 'Serbest çizim: basılı tutup çiz',
    text: 'Metin: tıkla ve yaz'
  };
  $('#hintBar').textContent = hints[t] || '';
}

/* -------------------------------------------------------- Input (fare) */
board.addEventListener('pointerdown', (e) => {
  // NUMEX-DÜZELTME (2026-11-14): setPointerCapture, dpr ölçekli canvas'ta pointermove koordinatlarını element dışına kaçırıyordu; hiçbir sürükleme (taşıma, çizim) başlamıyordu. Yakalama kaldırıldı; pointermove/pointerup zaten board üzerinde dinleniyor.
  // DİKKAT: setPointerCapture() burada KULLANILMAZ — devicePixelRatio'lu canvas'ta
  // yakalama, tıklama koordinatlarını element dışına kaydırıyordu (taşıma hiç başlamıyordu).
  const rect = board.getBoundingClientRect();
  const px = e.clientX - rect.left, py = e.clientY - rect.top;
  const m = pxToMm(px, py);

  // Orta tuş → pan
  if (e.button === 1) {
    state.drag = { mode:'pan', sx:e.clientX, sy:e.clientY, px:state.pan.x, py:state.pan.y };
    e.preventDefault();
    return;
  }

  if (state.tool === 'select') {
    const o = topObjectAt(m);
    if (o) {
      // Algılanan transform ayarı gerçekleşenin tarih açısını kırmamak için önce yakala
      if (!state.selection.has(o.id)) {
        if (!e.shiftKey) state.selection.clear();
        state.selection.add(o.id);
      } else if (e.shiftKey) {
        state.selection.delete(o.id);
      }
      // NUMEX-DÜZELTME (2026-11-14): Sadece tıklayıp bırakmak bile boş bir undo basamağı yazıyordu; geçmiş artık ilk gerçek hareketle kaydediliyor.
      // taşıma modu başlat (geçmiş yalnız gerçekten oynatınca yazılır)
      state.drag = { mode:'move', sx:m.x, sy:m.y, moved:false,
        start: clone(state.objects.filter(o => state.selection.has(o.id))),
        before: snapshot() };
      refreshUI();
    } else {
      if (!e.shiftKey) state.selection.clear();
      state.drag = { mode:'marquee', sx:m.x, sy:m.y, cx:m.x, cy:m.y };
      // Sürükleme bu kadar mm'yi geçerse kutu seçimi sayılır
      state.drag.moved = false;
      refreshUI();
    }
    draw();
    return;
  }

  if (state.tool === 'text') {
    const txt = prompt('Metin girin:', 'NUMEX') || '';
    if (!txt) return;
    pushHistory();
    const id = 'o' + (state.uid++);
    state.objects.push({ id, type:'text', name: txt.slice(0,16), x:r2(m.x), y:r2(m.y), w:Math.max(20, txt.length*6), h:10, rot:0, text:txt, fontSize:10, layer:state.activeLayer, style:'outline' });
    state.selection = new Set([id]);
    refreshUI(); draw();
    return;
  }

  if (state.tool === 'path') {
    state.drag = { mode:'freehand', ox:r2(m.x), oy:r2(m.y), points: [[0,0]] };
    return;
  }

  // Şekil araçları: sürükle → bırak
  state.drag = { mode:'draw', sx:m.x, sy:m.y, preview: { type:state.tool, x0:m.x, y0:m.y, x1:m.x, y1:m.y, layer:state.activeLayer } };
});

board.addEventListener('pointermove', (e) => {
  const rect = board.getBoundingClientRect();
  const px = e.clientX - rect.left, py = e.clientY - rect.top;
  const m = pxToMm(px, py);
  $('#stCursor').textContent = `X: ${m.x.toFixed(1)} mm · Y: ${m.y.toFixed(1)} mm`;

  if (!state.drag) return;
  const d = state.drag;

  if (d.mode === 'pan') {
    state.pan.x = d.px + (e.clientX - d.sx);
    state.pan.y = d.py + (e.clientY - d.sy);
    draw(); return;
  }
  if (d.mode === 'draw') {
    let x1 = m.x, y1 = m.y;
    if (e.shiftKey && (state.tool === 'rect' || state.tool === 'ellipse' || state.tool === 'polygon')) {
      const dx = m.x - d.sx, dy = m.y - d.sy;
      const s = Math.max(Math.abs(dx), Math.abs(dy));
      x1 = d.sx + Math.sign(dx || 1) * s;
      y1 = d.sy + Math.sign(dy || 1) * s;
    }
    if (e.shiftKey && state.tool === 'line') {
      // 0/45/90 dereceye kilitle
      const dx = x1 - d.sx, dy = y1 - d.sy;
      const a = Math.round(Math.atan2(dy, dx) / (Math.PI / 4)) * (Math.PI / 4);
      const len = Math.hypot(dx, dy);
      x1 = d.sx + Math.cos(a) * len; y1 = d.sy + Math.sin(a) * len;
    }
    d.preview = { ...d.preview, x1, y1 };
    draw(); return;
  }
  if (d.mode === 'freehand') {
    const px2 = r2(m.x - d.ox), py2 = r2(m.y - d.oy);
    const last = d.points[d.points.length - 1];
    if (Math.hypot(px2 - last[0], py2 - last[1]) > 0.4) d.points.push([px2, py2]);
    d.preview = { type:'path', ox:d.ox, oy:d.oy, points:d.points, layer:state.activeLayer };
    draw(); return;
  }
  if (d.mode === 'move') {
    // NUMEX-DÜZELTME (2026-11-14): Taşıma birikimli deltayla yapılıyordu; her pointermove önceki hareketi kaydediyor ve nesne kayıyordu. Artık her karede konum başlangıç konumundan türetiliyor.
    let dx = m.x - d.sx, dy = m.y - d.sy;
    if (e.shiftKey) { // Shift = eksene kilitle
      if (Math.abs(dx) > Math.abs(dy)) dy = 0; else dx = 0;
    }
    d.moved = Math.abs(dx) > 0.001 || Math.abs(dy) > 0.001;
    // Sadece üst düzey seçili nesneler taşınır; çocuklar (tek koordinat uzayı) aynı deltayla kayar.
    for (const o of state.objects) {
      const orig = d.start.find(s => s.id === o.id);
      if (!orig) continue;
      o.x = r2(orig.x + dx); o.y = r2(orig.y + dy);
      for (const ch of o.children || []) moveNodeBy(ch, dx, dy);
    }
    refreshPropsLive();
    draw(); return;
  }
  if (d.mode === 'marquee') {
    d.cx = m.x; d.cy = m.y;
    if (Math.hypot(d.cx - d.sx, d.cy - d.sy) > 2) d.moved = true;
    draw(); drawMarquee(d);
    return;
  }
});

function moveNodeBy(n, dx, dy) {
  n.x = r2(n.x + dx); n.y = r2(n.y + dy);
  for (const ch of n.children || []) moveNodeBy(ch, dx, dy);
}

function drawMarquee(d) {
  const a = mmToPx(Math.min(d.sx, d.cx), Math.min(d.sy, d.cy));
  const b = mmToPx(Math.max(d.sx, d.cx), Math.max(d.sy, d.cy));
  ctx.save();
  ctx.strokeStyle = '#3ddc97';
  ctx.fillStyle = 'rgba(61,220,151,.08)';
  ctx.setLineDash([4, 3]);
  ctx.fillRect(a.x, a.y, b.x - a.x, b.y - a.y);
  ctx.strokeRect(a.x, a.y, b.x - a.x, b.y - a.y);
  ctx.restore();
}

board.addEventListener('pointerup', (e) => {
  const d = state.drag;
  if (!d) return;
  const rect = board.getBoundingClientRect();
  const m = pxToMm(e.clientX - rect.left, e.clientY - rect.top);

  if (d.mode === 'draw') {
    const p = d.preview;
    const x0 = Math.min(p.x0, p.x1), y0 = Math.min(p.y0, p.y1);
    const w = Math.abs(p.x1 - p.x0), h = Math.abs(p.y1 - p.y0);
    // Çizgide uzunluk, diğer şekillerde iki kenar da 0.5 mm'den büyük olmalı
    const tooSmall = state.tool === 'line' ? Math.hypot(w, h) < 0.5 : (w < 0.5 || h < 0.5);
    if (tooSmall) { state.drag = null; draw(); return; }
    pushHistory();
    const id = 'o' + (state.uid++);
    const base = { id, x:r2(x0), y:r2(y0), w:r2(w), h:r2(h), rot:0, layer:state.activeLayer, style:'outline' };

    if (state.tool === 'rect') {
      state.objects.push({ ...base, type:'rect', name:'Dikdörtgen', radius:0 });
    } else if (state.tool === 'ellipse') {
      const s = Math.max(w, h);
      state.objects.push({ ...base, type:'ellipse', name:'Daire', w:r2(s), h:r2(s) });
    } else if (state.tool === 'line') {
      state.objects.push({ id, type:'line', name:'Çizgi', x:r2(p.x0), y:r2(p.y0), w:r2(p.x1 - p.x0), h:r2(p.y1 - p.y0), rot:0, layer:state.activeLayer, style:'outline' });
    } else if (state.tool === 'polygon') {
      // kenar sayısı 6 (altıgen) varsayılan, sayısal alanla değiştirilebilir
      const r = Math.min(w, h) / 2;
      const n = 6;
      const cx = x0 + w / 2, cy = y0 + h / 2;
      const pts = [];
      for (let i = 0; i < n; i++) {
        const a = -Math.PI / 2 + (i * 2 * Math.PI) / n;
        pts.push([r2(r * Math.cos(a) + r), r2(r * Math.sin(a) + r)]);
      }
      state.objects.push({ id, type:'polygon', name:`${n}-gen`, x:r2(x0), y:r2(y0), w:r2(2*r), h:r2(2*r), rot:0, layer:state.activeLayer, style:'outline', sides:n, points:pts });
    }
    state.selection = new Set([id]);
    state.drag = null;
    refreshUI(); draw();
    return;
  }
  if (d.mode === 'freehand') {
    if (d.points.length > 1) {
      pushHistory();
      const id = 'o' + (state.uid++);
      state.objects.push({
        id, type:'path', name:'Serbest çizim', x:d.ox, y:d.oy,
        w: Math.max(...d.points.map(p=>p[0])), h: Math.max(...d.points.map(p=>p[1])),
        rot:0, points:d.points, layer:state.activeLayer, style:'outline', closed:false
      });
      state.selection = new Set([id]);
    }
    state.drag = null;
    refreshUI(); draw();
    return;
  }
  if (d.mode === 'marquee') {
    const x1 = Math.min(d.sx, d.cx), y1 = Math.min(d.sy, d.cy);
    const x2 = Math.max(d.sx, d.cx), y2 = Math.max(d.sy, d.cy);
    if (d.moved) {
      state.selection.clear();
      for (const o of state.objects) {
        const b = objBounds(o);
        if (b.x1 >= x1 && b.y1 >= y1 && b.x2 <= x2 && b.y2 <= y2) state.selection.add(o.id);
      }
    }
    state.drag = null;
    refreshUI(); draw();
    return;
  }
  if (d.mode === 'move') {
    state.drag = null;
    if (d.moved && d.before) {
      // hareket başlamadan önceki hâli geçmişe yaz
      state.history = state.history.slice(0, state.histIdx + 1);
      state.history.push(d.before);
      if (state.history.length > 80) state.history.shift();
      state.histIdx = state.history.length - 1;
      syncUndoButtons();
    }
    refreshUI(); draw();
    return;
  }
  state.drag = null;
});

// Tekerlek ile yakınlaştırma (imleç merkezli)
board.addEventListener('wheel', (e) => {
  e.preventDefault();
  const rect = board.getBoundingClientRect();
  const px = e.clientX - rect.left, py = e.clientY - rect.top;
  const before = pxToMm(px, py);
  const factor = e.deltaY < 0 ? 1.12 : 1 / 1.12;
  state.zoom = Math.max(0.2, Math.min(40, state.zoom * factor));
  // imlecin altındaki mm noktası aynı kalsın
  state.pan.x = px - before.x * state.zoom;
  state.pan.y = py - before.y * state.zoom;
  updateZoomLabel();
  draw();
}, { passive: false });

/* --------------------------------------------------------------- Klavye */
window.addEventListener('keydown', (e) => {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
  const k = e.key.toLowerCase();
  if ((e.ctrlKey || e.metaKey) && k === 'z') { e.preventDefault(); undo(); return; }
  if ((e.ctrlKey || e.metaKey) && (k === 'y' || (k === 'z' && e.shiftKey))) { e.preventDefault(); redo(); return; }
  if ((e.ctrlKey || e.metaKey) && k === 'd') { e.preventDefault(); duplicateSelected(); return; }
  if ((e.ctrlKey || e.metaKey) && k === 'g') { e.preventDefault(); e.shiftKey ? ungroup() : groupSelected(); return; }
  if (k === 'delete' || k === 'backspace') { e.preventDefault(); deleteSelected(); return; }
  if (k === 'escape') { state.selection.clear(); refreshUI(); draw(); return; }
  if (e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === 'ArrowUp' || e.key === 'ArrowDown') {
    if (!state.selection.size) return;
    e.preventDefault();
    const step = e.shiftKey ? 10 : 1;
    const dx = e.key === 'ArrowLeft' ? -step : e.key === 'ArrowRight' ? step : 0;
    const dy = e.key === 'ArrowUp' ? -step : e.key === 'ArrowDown' ? step : 0;
    pushHistory();
    for (const o of state.objects) if (state.selection.has(o.id)) { o.x = r2(o.x + dx); o.y = r2(o.y + dy); }
    refreshUI(); draw();
    return;
  }
  const map = { v:'select', r:'rect', o:'ellipse', l:'line', p:'polygon', f:'path', t:'text' };
  if (map[k] && !e.ctrlKey && !e.metaKey) setTool(map[k]);
});

/* ----------------------------------------------------------- Eylemler */
function deleteSelected() {
  if (!state.selection.size) return;
  pushHistory();
  state.objects = state.objects.filter(o => !state.selection.has(o.id));
  state.selection.clear();
  refreshUI(); draw();
}
function duplicateSelected() {
  if (!state.selection.size) return;
  pushHistory();
  const newSel = new Set();
  const copies = [];
  for (const o of state.objects) {
    if (!state.selection.has(o.id)) continue;
    const cp = clone(o);
    cp.id = 'o' + (state.uid++);
    cp.x = r2(cp.x + 5);
    cp.y = r2(cp.y + 5);
    if (cp.type === 'group') remapChildren(cp);
    copies.push(cp);
    newSel.add(cp.id);
  }
  state.objects.push(...copies);
  state.selection = newSel;
  refreshUI(); draw();
}
function remapChildren(g) {
  g.id = 'o' + (state.uid++);
  for (const c of g.children || []) {
    c.id = 'o' + (state.uid++);
    if (c.type === 'group') remapChildren(c);
  }
}
function groupSelected() {
  if (state.selection.size < 2) { alert('Gruplamak için en az 2 nesne seçin.'); return; }
  pushHistory();
  const chosen = state.objects.filter(o => state.selection.has(o.id));
  const others = state.objects.filter(o => !state.selection.has(o.id));
  const b = chosen.reduce((acc, o) => {
    const bb = objBounds(o);
    return { x1: Math.min(acc.x1, bb.x1), y1: Math.min(acc.y1, bb.y1), x2: Math.max(acc.x2, bb.x2), y2: Math.max(acc.y2, bb.y2) };
  }, { x1: Infinity, y1: Infinity, x2: -Infinity, y2: -Infinity });
  const id = 'o' + (state.uid++);
  const g = { id, type:'group', name:'Grup', x:r2(b.x1), y:r2(b.y1), w:r2(b.x2 - b.x1), h:r2(b.y2 - b.y1), rot:0, layer:state.activeLayer, children: chosen };
  state.objects = [...others, g];
  state.selection = new Set([id]);
  refreshUI(); draw();
}
function ungroup() {
  const ids = [...state.selection];
  const groups = state.objects.filter(o => ids.includes(o.id) && o.type === 'group');
  if (!groups.length) { alert('Çözülecek grup seçili değil.'); return; }
  pushHistory();
  const keep = [];
  const flat = [];
  for (const o of state.objects) {
    if (groups.includes(o)) flat.push(...(o.children || []));
    else keep.push(o);
  }
  state.objects = [...keep, ...flat];
  state.selection = new Set(flat.map(o => o.id));
  refreshUI(); draw();
}

/* ------------------------------------------------------------- Paneller */
function refreshUI() {
  renderLayerList();
  renderLayerProps();
  renderObjectList();
  renderProps();
  updateZoomLabel();
  $('#stSel').textContent = 'Seçim: ' + (state.selection.size ? state.selection.size + ' nesne' : '—');
  $('#stCount').textContent = flattenObjects(state.objects).length + ' nesne';
}

function renderLayerList() {
  const el = $('#layerList');
  const counts = { cut:0, engrave:0, mark:0 };
  for (const o of flattenObjects(state.objects)) if (counts[o.layer] != null) counts[o.layer]++;
  el.innerHTML = '';
  for (const key of ['cut','engrave','mark']) {
    const L = state.layers[key];
    const d = document.createElement('div');
    d.className = 'layer' + (state.activeLayer === key ? ' active' : '');
    d.innerHTML = `<span class="dot" style="background:${L.color};color:${L.color}"></span>
      <span class="lname">${L.name}</span>
      <span class="lcount">${counts[key]}</span>`;
    d.onclick = () => { state.activeLayer = key; refreshUI(); };
    el.appendChild(d);
  }
}

function renderLayerProps() {
  const L = state.layers[state.activeLayer];
  const el = $('#layerProps');
  el.innerHTML = `
    <label>Hız (mm/s)<input type="number" min="1" step="1" value="${L.speed}" data-lp="speed"></label>
    <label>Güç (%)<input type="number" min="0" max="100" step="1" value="${L.power}" data-lp="power"></label>
    <label class="full">Geçiş sayısı<input type="number" min="1" step="1" value="${L.passes}" data-lp="passes"></label>
  `;
  el.querySelectorAll('input').forEach(inp => {
    inp.onchange = () => {
      const key = inp.dataset.lp;
      const v = Number(inp.value) || 0;
      state.layers[state.activeLayer][key] = key === 'passes' ? Math.max(1, Math.round(v)) : Math.max(0, v);
      pushHistory();
      draw();
    };
  });
}

function renderObjectList() {
  const el = $('#objectList');
  el.innerHTML = '';
  if (!state.objects.length) { el.innerHTML = '<li class="muted" style="cursor:default">Boş — çizim yap ya da örnek proje yükle</li>'; return; }
  for (const o of [...state.objects].reverse()) {
    const li = document.createElement('li');
    if (state.selection.has(o.id)) li.classList.add('sel');
    const L = state.layers[o.layer];
    li.innerHTML = `<span class="ob" style="background:${L ? L.color : '#888'}"></span>
      <span class="nm">${o.name || TYPE_NAME[o.type]}</span>
      <span class="lk">${o.locked ? '🔒' : '🔓'}</span>`;
    li.onclick = () => { state.selection = new Set([o.id]); refreshUI(); draw(); };
    li.querySelector('.lk').onclick = (ev) => {
      ev.stopPropagation();
      pushHistory();
      o.locked = !o.locked;
      refreshUI(); draw();
    };
    el.appendChild(li);
  }
}

function renderProps() {
  const el = $('#props');
  const ids = [...state.selection];
  if (!ids.length) { el.className = 'props-empty'; el.textContent = 'Nesne seçilmedi'; return; }
  el.className = '';
  if (ids.length > 1) {
    el.innerHTML = `<div class="prop-title"><strong>${ids.length} nesne seçili</strong></div>
      <div class="muted">Sayısal konumlar için tek nesne seçin. Katman atamak için aşağıdaki düğmeler:</div>
      <div class="row-actions">
        <button class="tb small" data-setlayer="cut">Kesim</button>
        <button class="tb small" data-setlayer="engrave">Gravür</button>
        <button class="tb small" data-setlayer="mark">İşaretleme</button>
      </div>`;
    el.querySelectorAll('[data-setlayer]').forEach(b => b.onclick = () => {
      pushHistory();
      const lay = b.dataset.setlayer;
      for (const o of flattenObjects(state.objects)) if (state.selection.has(o.id)) o.layer = lay;
      refreshUI(); draw();
    });
    return;
  }
  const o = flattenObjects(state.objects).find(x => x.id === ids[0]);
  if (!o) return;
  const isLine = o.type === 'line';
  el.innerHTML = `
    <div class="prop-title"><strong>${o.name || TYPE_NAME[o.type]}</strong><span class="tag">${TYPE_NAME[o.type]}</span></div>
    <div class="prop-grid">
      <label>X (mm)<input type="number" step="0.1" value="${r2(o.x)}" data-p="x"></label>
      <label>Y (mm)<input type="number" step="0.1" value="${r2(o.y)}" data-p="y"></label>
      <label>Genişlik (mm)<input type="number" step="0.1" value="${r2(o.w)}" data-p="w"></label>
      <label>Yükseklik (mm)<input type="number" step="0.1" value="${r2(o.h)}" data-p="h"></label>
      <label>Dönüş (°)<input type="number" step="1" value="${r2(o.rot || 0)}" data-p="rot"></label>
      <label>Katman
        <select data-p="layer">
          ${['cut','engrave','mark'].map(k => `<option value="${k}" ${o.layer === k ? 'selected' : ''}>${state.layers[k].name}</option>`).join('')}
        </select>
      </label>
      ${o.type === 'rect' ? `<label class="full">Köşe yuvarlama (mm)<input type="number" step="0.5" min="0" value="${o.radius || 0}" data-p="radius"></label>` : ''}
      ${o.type === 'polygon' ? `<label class="full">Kenar sayısı<input type="number" step="1" min="3" max="24" value="${o.sides || 6}" data-p="sides"></label>` : ''}
      ${o.type === 'text' ? `<label class="full">Metin<input type="text" value="${(o.text || '').replace(/"/g, '&quot;')}" data-p="text"></label>
        <label class="full">Punto (mm)<input type="number" step="0.5" min="1" value="${o.fontSize || 10}" data-p="fontSize"></label>` : ''}
      ${isLine ? '' : `<label class="full">Stil
        <select data-p="style">
          <option value="outline" ${o.style === 'outline' ? 'selected' : ''}>Kontur (kesim)</option>
          <option value="filled" ${o.style === 'filled' ? 'selected' : ''}>Dolgulu (gravür alanı)</option>
        </select>
      </label>`}
    </div>
    <div class="row-actions">
      <button class="tb small" id="pDup">Çoğalt</button>
      <button class="tb small" id="pGroup">Grupla</button>
      <button class="tb small" id="pCenter">Alanı ortala</button>
      <button class="tb small" id="pLock">${o.locked ? 'Kilidi aç' : 'Kilitle'}</button>
    </div>
  `;
  el.querySelectorAll('[data-p]').forEach(inp => {
    inp.onchange = () => {
      const key = inp.dataset.p;
      pushHistory();
      if (key === 'layer') o.layer = inp.value;
      else if (key === 'style') o.style = inp.value;
      else if (key === 'text') { o.text = inp.value; o.name = inp.value.slice(0, 16) || 'Metin'; }
      else if (key === 'sides') { rebuildPolygon(o, Math.max(3, Math.min(24, Math.round(Number(inp.value))))); }
      else o[key] = Number(inp.value) || 0;
      refreshUI(); draw();
    };
  });
  const pDup = el.querySelector('#pDup'); if (pDup) pDup.onclick = duplicateSelected;
  const pGrp = el.querySelector('#pGroup'); if (pGrp) pGrp.onclick = groupSelected;
  const pLock = el.querySelector('#pLock'); if (pLock) pLock.onclick = () => { pushHistory(); o.locked = !o.locked; refreshUI(); draw(); };
  const pCenter = el.querySelector('#pCenter'); if (pCenter) pCenter.onclick = () => {
    pushHistory();
    const b = objBounds(o);
    const dx = (state.bed.w - (b.x2 - b.x1)) / 2 - b.x1;
    const dy = (state.bed.h - (b.y2 - b.y1)) / 2 - b.y1;
    o.x = r2(o.x + dx); o.y = r2(o.y + dy);
    refreshUI(); draw();
  };
}

function refreshPropsLive() {
  const el = $('#props');
  if (!el || !el.querySelector('[data-p]')) return;
  const o = flattenObjects(state.objects).find(x => state.selection.has(x.id));
  if (!o) return;
  const x = el.querySelector('[data-p="x"]'), y = el.querySelector('[data-p="y"]');
  if (x) x.value = r2(o.x);
  if (y) y.value = r2(o.y);
}

function rebuildPolygon(o, n) {
  const r = Math.min(o.w, o.h) / 2;
  const pts = [];
  for (let i = 0; i < n; i++) {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / n;
    pts.push([r2(r * Math.cos(a) + r), r2(r * Math.sin(a) + r)]);
  }
  o.sides = n; o.points = pts;
  o.name = `${n}-gen`;
}

/* ---------------------------------------------------- Kesim kontrolü */
function analyze() {
  const flat = flattenObjects(state.objects);
  const findings = { errors: [], warnings: [], info: [] };
  let totalCut = 0, totalEngrave = 0, totalMark = 0;

  for (const o of flat) {
    const len = objLength(o);
    if (o.layer === 'cut') totalCut += len;
    else if (o.layer === 'engrave') totalEngrave += len;
    else if (o.layer === 'mark') totalMark += len;

    // 1) Kesim alanı dışı
    const b = objBounds(o);
    if (b.x1 < -0.01 || b.y1 < -0.01 || b.x2 > state.bed.w + 0.01 || b.y2 > state.bed.h + 0.01) {
      findings.errors.push(`"${o.name}" kesim alanı dışına çıkıyor (X:${r2(b.x1)}–${r2(b.x2)}, Y:${r2(b.y1)}–${r2(b.y2)})`);
    }

    // 2) Kapalı değil uyarısı (open path)
    if (o.type === 'path' && !o.closed) {
      findings.warnings.push(`"${o.name}" açık bir kesim yolu (kapalı değil) — kesim birleşmez`);
    }
    if (o.type === 'line') {
      findings.warnings.push(`"${o.name}" bir çizgi — açık kesim yolu`);
    }

    // 3) Çok küçük parça
    if (o.type !== 'line' && (o.w < 1.5 || o.h < 1.5)) {
      findings.warnings.push(`"${o.name}" çok küçük (${r2(o.w)}×${r2(o.h)} mm) — lazer malzemeyi hareket ettirir`);
    }
    // 4) Delik çapı küçük
    if (o.type === 'ellipse' && Math.min(o.w, o.h) < 2) {
      findings.warnings.push(`"${o.name}" çapı ${r2(Math.min(o.w,o.h))} mm — malzemede yanma riski`);
    }
  }

  // 5) Çakışan yinelenmiş çizgiler (aynı tip, aynı x/y/w/h/rot)
  const seen = new Map();
  for (const o of flat) {
    if (o.type === 'group') continue;
    const k = [o.type, r2(o.x), r2(o.y), r2(o.w), r2(o.h), r2(o.rot || 0)].join('|');
    if (seen.has(k)) {
      findings.warnings.push(`Yinelenmiş geometri: "${seen.get(k)}" ve "${o.name}" aynı konumda`);
    } else seen.set(k, o.name);
  }

  // Kapalı şekil çevresi
  const closedShapes = flat.filter(o => ['rect','ellipse','polygon'].includes(o.type) || (o.type === 'path' && o.closed));
  const closedPerim = closedShapes.reduce((s, o) => s + objLength(o), 0);

  // Süre: yalnız hız × uzunluk
  const layerSpeed = (key) => state.layers[key].speed || 1;
  const passesFor = (key) => state.layers[key].passes || 1;
  const sec = (len, key) => (len / layerSpeed(key)) * passesFor(key);
  const cutSec = sec(totalCut, 'cut');
  const engSec = sec(totalEngrave, 'engrave');
  const markSec = sec(totalMark, 'mark');
  const totalSec = cutSec + engSec + markSec;

  state.lastAnalysis = {
    totalCut, totalEngrave, totalMark, closedPerim,
    totalSec, cutSec, engSec, markSec,
    findings,
    objectCount: flat.length
  };
  renderAnalysis();
  return state.lastAnalysis;
}

function renderAnalysis() {
  const a = state.lastAnalysis;
  const el = $('#analysis');
  if (!a) { el.innerHTML = '<div class="muted">Analiz et düğmesine bas.</div>'; return; }
  const fmt = (n) => r2(n).toLocaleString('tr-TR');
  const fmtTime = (s) => {
    if (s < 60) return `${r2(s)} sn`;
    const m = Math.floor(s / 60), ss = Math.round(s % 60);
    return `${m} dk ${ss} sn`;
  };
  const rows = [
    ['Nesne sayısı', a.objectCount, 'ok'],
    ['Toplam kesim uzunluğu', fmt(a.totalCut) + ' mm', 'ok'],
    ['Gravür uzunluğu', fmt(a.totalEngrave) + ' mm', 'ok'],
    ['İşaretleme uzunluğu', fmt(a.totalMark) + ' mm', 'ok'],
    ['Kapalı şekil çevresi', fmt(a.closedPerim) + ' mm', 'ok'],
    ['Tahmini süre', fmtTime(a.totalSec) + ' *', a.findings.errors.length ? 'warn' : 'ok']
  ];
  el.innerHTML = rows.map(([k, v, cls]) => `<div class="a-row ${cls}"><span class="k">${k}</span><span class="v">${v}</span></div>`).join('')
    + `<div class="muted" style="margin-top:4px;font-size:10.5px">* Süre = uzunluk / hız × geçiş. Makinenin ivmelenmesi, kafa hareketi ve güç ayarı hesaba KATILMAZ.</div>`
    + (a.findings.errors.length ? `<div class="head">Hatalar (${a.findings.errors.length})</div><ul>${a.findings.errors.map(e=>`<li class="e">${e}</li>`).join('')}</ul>` : `<div class="a-row ok"><span class="k">Hata</span><span class="v">Yok</span></div>`)
    + (a.findings.warnings.length ? `<div class="head">Uyarılar (${a.findings.warnings.length})</div><ul>${a.findings.warnings.map(w=>`<li class="w">${w}</li>`).join('')}</ul>` : `<div class="a-row ok"><span class="k">Uyarı</span><span class="v">Yok</span></div>`)
    ;
}

/* --------------------------------------------------------- Dışa aktarma */
function generateSVG() {
  const flat = flattenObjects(state.objects);
  const parts = [];
  parts.push(`<?xml version="1.0" encoding="UTF-8"?>`);
  parts.push(`<svg xmlns="http://www.w3.org/2000/svg" version="1.1" width="${state.bed.w}mm" height="${state.bed.h}mm" viewBox="0 0 ${state.bed.w} ${state.bed.h}">`);
  parts.push(`<title>NUMEX LASER PRO — ${new Date().toISOString()}</title>`);
  // layer comments (metadata, machines ignore)
  for (const [key, L] of Object.entries(state.layers)) {
    parts.push(`<g id="layer-${key}" data-name="${L.name}" data-color="${L.color}" data-speed="${L.speed}" data-power="${L.power}" data-passes="${L.passes}" fill="none" stroke="${L.color}" stroke-width="0.1">`);
    for (const o of flat) {
      if (o.layer !== key) continue;
      parts.push(objectToSVG(o));
    }
    parts.push(`</g>`);
  }
  parts.push(`</svg>`);
  return parts.join('\n');
}

function objectToSVG(o) {
  const rot = o.rot ? ` transform="rotate(${r2(o.rot)} ${r2(o.x + o.w/2)} ${r2(o.y + o.h/2)})"` : '';
  const fill = o.style === 'filled' ? 'currentColor' : 'none';
  const fillAttr = o.style === 'filled' ? ` fill="currentColor" fill-opacity="0.2"` : ' fill="none"';
  switch (o.type) {
    case 'rect':
      if (o.radius) {
        const rr = Math.min(o.radius, o.w/2, o.h/2);
        return `<rect x="${r2(o.x)}" y="${r2(o.y)}" width="${r2(o.w)}" height="${r2(o.h)}" rx="${r2(rr)}" ry="${r2(rr)}"${fillAttr}${rot}/>`;
      }
      return `<rect x="${r2(o.x)}" y="${r2(o.y)}" width="${r2(o.w)}" height="${r2(o.h)}"${fillAttr}${rot}/>`;
    case 'ellipse':
      return `<ellipse cx="${r2(o.x + o.w/2)}" cy="${r2(o.y + o.h/2)}" rx="${r2(o.w/2)}" ry="${r2(o.h/2)}"${fillAttr}${rot}/>`;
    case 'line':
      return `<line x1="${r2(o.x)}" y1="${r2(o.y)}" x2="${r2(o.x + o.w)}" y2="${r2(o.y + o.h)}"${rot}/>`;
    case 'polygon': {
      const pts = (o.points || []).map(p => `${r2(o.x + p[0])},${r2(o.y + p[1])}`).join(' ');
      return `<polygon points="${pts}"${fillAttr}${rot}/>`;
    }
    case 'path': {
      const pts = (o.points || []).map((p, i) => `${i===0?'M':'L'} ${r2(o.x + p[0])} ${r2(o.y + p[1])}`).join(' ');
      return `<path d="${pts}${o.closed ? ' Z' : ''}"${fillAttr}${rot}/>`;
    }
    case 'text': {
      const fs = o.fontSize || 10;
      return `<text x="${r2(o.x)}" y="${r2(o.y + fs * 0.85)}" font-family="Arial, sans-serif" font-size="${fs}" font-weight="700" fill="currentColor"${rot}>${escapeXml(o.text || '')}</text>`;
    }
  }
  return '';
}
function escapeXml(s) { return String(s).replace(/[<>&'"]/g, c => ({'<':'&lt;','>':'&gt;','&':'&amp;',"'":'&apos;','"':'&quot;'}[c])); }

// Açık uç sayısı: aynı noktaya başka bir uç değmiyorsa o uç açıktır (0.02 mm tolerans)
function countOpenEnds(lines) {
  const key = (x, y) => `${Math.round(x * 50)}:${Math.round(y * 50)}`;
  const ends = new Map();
  for (const l of lines) {
    const k1 = key(l.x1, l.y1), k2 = key(l.x2, l.y2);
    ends.set(k1, (ends.get(k1) || 0) + 1);
    ends.set(k2, (ends.get(k2) || 0) + 1);
  }
  let open = 0;
  for (const n of ends.values()) if (n < 2) open++;
  return { open, ends: ends.size };
}

function generateDXF() {
  // DXF R12 / AC1009, birim mm. Y ekseni yukarı doğru (editor Y aşağı → çevrilir).
  const flat = flattenObjects(state.objects);
  const lines = [];
  const push = (code, val) => { lines.push(code, val); };

  push(0, 'SECTION'); push(2, 'HEADER');
  push(9, '$ACADVER'); push(1, 'AC1009');
  push(9, '$INSUNITS'); push(70, 4); // mm
  push(9, '$EXTMIN'); push(10, 0); push(20, 0); push(30, 0);
  push(9, '$EXTMAX'); push(10, state.bed.w); push(20, state.bed.h); push(30, 0);
  push(0, 'ENDSEC');

  push(0, 'SECTION'); push(2, 'TABLES');
  // LAYERS
  push(0, 'TABLE'); push(2, 'LAYER'); push(70, 3);
  const aci = { cut: 1, engrave: 5, mark: 3 }; // red, blue, green
  for (const [key, L] of Object.entries(state.layers)) {
    push(0, 'LAYER'); push(2, key.toUpperCase()); push(70, 0); push(62, aci[key]); push(6, 'CONTINUOUS');
  }
  push(0, 'ENDTAB'); push(0, 'ENDSEC');

  push(0, 'SECTION'); push(2, 'ENTITIES');
  for (const o of flat) {
    if (o.type === 'group') continue;
    // NUMEX-DÜZELTME (2026-11-14): DXF'te dönüş hiç uygulanmıyordu ve yuvarlatılmış dikdörtgen dört ayrı yay olarak kopuk çıkıyordu; şimdi her nesne dönüşü uygulanmış tek kapalı POLYLINE olarak yazılıyor.
    const pts = dxfObjectPoints(o); // dönüş uygulanmış, DXF koordinatında (Y yukarı)
    switch (o.type) {
      case 'rect':
      case 'ellipse':
      case 'polygon':
        // Kapalı kontur olarak tek POLYLINE (parçalanmış çizgi yığını değil)
        dxfPolyline(pts, o, push, true);
        break;
      case 'path':
        dxfPolyline(pts, o, push, !!o.closed);
        break;
      case 'line':
        dxfLine(pts[0][0], pts[0][1], pts[1][0], pts[1][1], o, push);
        break;
      case 'text':
        // DXF TEXT: konum, dönüş uygulanmış çapa noktası
        push(0, 'TEXT'); push(8, o.layer.toUpperCase());
        push(10, r2(pts[0][0])); push(20, r2(pts[0][1]));
        push(30, 0); push(40, o.fontSize || 10);
        push(1, o.text || ''); push(7, 'STANDARD');
        if (o.rot) push(50, r2(-o.rot)); // DXF'te saat yönü tersi
        break;
    }
  }
  push(0, 'ENDSEC'); push(0, 'EOF');
  return lines.join('\n') + '\n';
}

function dxfLine(x1, y1, x2, y2, o, push) {
  // DXF Y ekseni yukarı doğru → ters çevir
  push(0, 'LINE'); push(8, o.layer.toUpperCase());
  push(10, r2(x1)); push(20, r2(state.bed.h - y1)); push(30, 0);
  push(11, r2(x2)); push(21, r2(state.bed.h - y2)); push(31, 0);
}
// Nesnenin nokta dizisini (DXF koordinatı: mm, Y yukarı, dönüş uygulanmış) üretir
function dxfObjectPoints(o) {
  const toDXF = p => [r2(p.x), r2(state.bed.h - p.y)];
  const applyRot = (p) => {
    if (!o.rot) return p;
    const c = { x: o.x + o.w / 2, y: o.y + o.h / 2 };
    return rotatePoint(p, c, o.rot);
  };
  const seg = ARC_SEG;

  if (o.type === 'rect') {
    const r = Math.min(o.radius || 0, o.w / 2, o.h / 2);
    const x1 = o.x, y1 = o.y, x2 = o.x + o.w, y2 = o.y + o.h;
    if (!r) return [[x1, y1], [x2, y1], [x2, y2], [x1, y2]].map(([x, y]) => toDXF(applyRot({ x, y })));
    // Sol üstten saat yönü: yaylar 12 mm'den yüksekte 12 parça ile yaklaşık
    const arcs = [
      { cx:x2 - r, cy:y1 + r, a1:-Math.PI/2, a2:0 },         // sağ üst
      { cx:x2 - r, cy:y2 - r, a1:0,           a2:Math.PI/2 }, // sağ alt
      { cx:x1 + r, cy:y2 - r, a1:Math.PI/2,   a2:Math.PI },   // sol alt
      { cx:x1 + r, cy:y1 + r, a1:Math.PI,     a2:1.5*Math.PI },// sol üst
    ];
    const out = [];
    for (const a of arcs) {
      for (let i = 0; i <= seg; i++) {
        const t = a.a1 + ((a.a2 - a.a1) * i) / seg;
        out.push(toDXF(applyRot({ x: a.cx + r * Math.cos(t), y: a.cy + r * Math.sin(t) })));
      }
    }
    return out;
  }
  if (o.type === 'ellipse') {
    const cx = o.x + o.w / 2, cy = o.y + o.h / 2, rx = o.w / 2, ry = o.h / 2;
    const out = [];
    for (let i = 0; i < 4 * seg; i++) {
      const t = (i * 2 * Math.PI) / (4 * seg);
      out.push(toDXF(applyRot({ x: cx + rx * Math.cos(t), y: cy + ry * Math.sin(t) })));
    }
    return out;
  }
  if (o.type === 'polygon' || o.type === 'path') {
    return (o.points || []).map(pt => toDXF(applyRot({ x: o.x + pt[0], y: o.y + pt[1] })));
  }
  if (o.type === 'line') {
    return [toDXF(applyRot({ x: o.x, y: o.y })), toDXF(applyRot({ x: o.x + o.w, y: o.y + o.h }))];
  }
  if (o.type === 'text') {
    // Metin çapa noktası: sol-üst köşe (DXF TEXT taban çizgisi bu noktadan başlar)
    const p = applyRot({ x: o.x, y: o.y + (o.fontSize || 10) });
    return [toDXF(p)];
  }
  return [];
}

// Gerçek yay/spline kaydı yerine R12'de her yerde açılan tek kayıt: POLYLINE
const ARC_SEG = 12;
function dxfPolyline(pts, o, push, closed) {
  if (!pts || pts.length < 2) return;
  push(0, 'POLYLINE'); push(8, o.layer.toUpperCase());
  push(66, 1); push(70, closed ? 1 : 0);
  push(10, 0); push(20, 0); push(30, 0);
  for (const [x, y] of pts) {
    push(0, 'VERTEX'); push(8, o.layer.toUpperCase());
    push(10, x); push(20, y); push(30, 0);
  }
  push(0, 'SEQEND'); push(8, o.layer.toUpperCase());
}

// NUMEX-DÜZELTME (2026-11-14): parseDXF yalnız LINE okuyabiliyordu (artık POLYLINE yazılıyor); parseSVG de yalnız ilk rect'i döndürüyordu, gerçek ölçü doğrulaması için her eleman tipinden örnek okuması gerekiyordu.
/* --- DXF geri okuma (LINE, TEXT ve POLYLINE/VERTEX) --- */
function parseDXF(text) {
  const raw = text.split(/\r?\n/);
  const pairs = [];
  for (let i = 0; i + 1 < raw.length; i += 2) {
    pairs.push([raw[i].trim(), raw[i + 1].trim()]);
  }
  const ents = [];
  let i = 0;
  while (i < pairs.length) {
    const [code, val] = pairs[i];
    if (code !== '0') { i++; continue; }
    if (val === 'LINE') {
      const ent = { type:'line', x1:0, y1:0, x2:0, y2:0, layer:'0' };
      i++;
      while (i < pairs.length && pairs[i][0] !== '0') {
        const [c, v] = pairs[i];
        if (c === '8') ent.layer = v;
        else if (c === '10') ent.x1 = parseFloat(v);
        else if (c === '20') ent.y1 = parseFloat(v);
        else if (c === '11') ent.x2 = parseFloat(v);
        else if (c === '21') ent.y2 = parseFloat(v);
        i++;
      }
      ents.push(ent);
    } else if (val === 'TEXT') {
      const ent = { type:'text', x:0, y:0, text:'', layer:'0', rot:0 };
      i++;
      while (i < pairs.length && pairs[i][0] !== '0') {
        const [c, v] = pairs[i];
        if (c === '8') ent.layer = v;
        else if (c === '10') ent.x = parseFloat(v);
        else if (c === '20') ent.y = parseFloat(v);
        else if (c === '1') ent.text = v;
        else if (c === '50') ent.rot = parseFloat(v);
        i++;
      }
      ents.push(ent);
    } else if (val === 'POLYLINE') {
      const ent = { type:'polyline', pts:[], closed:false, layer:'0' };
      i++;
      while (i < pairs.length && pairs[i][0] !== '0') {
        const [c, v] = pairs[i];
        if (c === '8') ent.layer = v;
        else if (c === '70') ent.closed = (parseInt(v, 10) & 1) === 1;
        i++;
      }
      // VERTEX kayıtları SEQEND'e kadar okunur
      while (i < pairs.length && !(pairs[i][0] === '0' && pairs[i][1] === 'SEQEND')) {
        if (pairs[i][0] === '0' && pairs[i][1] === 'VERTEX') {
          let x = 0, y = 0;
          i++;
          while (i < pairs.length && pairs[i][0] !== '0') {
            const [c, v] = pairs[i];
            if (c === '10') x = parseFloat(v);
            else if (c === '20') y = parseFloat(v);
            i++;
          }
          ent.pts.push([x, y]);
        } else i++;
      }
      if (pairs[i] && pairs[i][1] === 'SEQEND') i++;
      ents.push(ent);
    } else i++;
  }
  // Okunan konturları grafik doğrulaması için LINE listesine açarız
  const out = [];
  for (const e of ents) {
    if (e.type === 'polyline') {
      const n = e.pts.length;
      for (let k = 0; k < (e.closed ? n : n - 1); k++) {
        const a = e.pts[k], b = e.pts[(k + 1) % n];
        out.push({ type:'line', x1:a[0], y1:a[1], x2:b[0], y2:b[1], layer:e.layer });
      }
      out.push({ type:'polyline', pts:e.pts, closed:e.closed, layer:e.layer });
    } else out.push(e);
  }
  return out;
}

/* --- SVG geri okuma (boyut + eleman ölçüleri) --- */
function parseSVG(text) {
  const parser = new DOMParser();
  const dom = parser.parseFromString(text, 'image/svg+xml');
  const svg = dom.documentElement;
  const err = svg.querySelector('parsererror');
  if (err) throw new Error('SVG ayrıştırılamadı');
  const wAttr = svg.getAttribute('width');
  const hAttr = svg.getAttribute('height');
  const vb = svg.getAttribute('viewBox');
  const wMM = parseFloat((wAttr || '').replace('mm', ''));
  const hMM = parseFloat((hAttr || '').replace('mm', ''));
  const counts = { rect:0, ellipse:0, circle:0, line:0, polygon:0, path:0, text:0 };
  for (const k of Object.keys(counts)) counts[k] = svg.querySelectorAll(k).length;

  const num = (el, a, d = 0) => { const v = el.getAttribute(a); return v == null ? d : parseFloat(v); };
  const firstRects = (() => {
    const el = svg.querySelector('rect');
    if (!el) return null;
    return { x:num(el,'x'), y:num(el,'y'), w:num(el,'width'), h:num(el,'height'), rx:num(el,'rx') };
  })();
  const firstEllipses = (() => {
    const el = svg.querySelector('ellipse') || svg.querySelector('circle');
    if (!el) return null;
    if (el.tagName.toLowerCase() === 'circle') {
      const r = num(el,'r'); return { x:num(el,'cx')-r, y:num(el,'cy')-r, w:2*r, h:2*r };
    }
    const rx = num(el,'rx'), ry = num(el,'ry');
    return { x:num(el,'cx')-rx, y:num(el,'cy')-ry, w:2*rx, h:2*ry };
  })();
  const firstLines = (() => {
    const el = svg.querySelector('line');
    if (!el) return null;
    const x1 = num(el,'x1'), y1 = num(el,'y1'), x2 = num(el,'x2'), y2 = num(el,'y2');
    return { x:Math.min(x1,x2), y:Math.min(y1,y2), w:Math.abs(x2-x1), h:Math.abs(y2-y1), x1, y1, x2, y2 };
  })();
  const firstPolys = (() => {
    const el = svg.querySelector('polygon') || svg.querySelector('path');
    if (!el) return null;
    let pts = [];
    if (el.tagName.toLowerCase() === 'polygon') {
      const nums = (el.getAttribute('points') || '').trim().split(/[\s,]+/).map(Number);
      for (let i = 0; i + 1 < nums.length; i += 2) pts.push([nums[i], nums[i+1]]);
    } else {
      const d = el.getAttribute('d') || '';
      const re = /[ML]\s*(-?[\d.]+)[ ,]+(-?[\d.]+)/g; let mt;
      while ((mt = re.exec(d))) pts.push([parseFloat(mt[1]), parseFloat(mt[2])]);
    }
    if (!pts.length) return null;
    const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
    return { x:Math.min(...xs), y:Math.min(...ys), w:Math.max(...xs)-Math.min(...xs), h:Math.max(...ys)-Math.min(...ys) };
  })();
  const texts = [...svg.querySelectorAll('text')].map(t => t.textContent || '');
  return { wMM, hMM, vb, counts, rectInfo:firstRects, firstRects, firstEllipses, firstLines, firstPolys, texts };
}

/* --- Export handlers --- */
function download(name, content, mime) {
  const blob = new Blob([content], { type: mime || 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = name;
  document.body.appendChild(a); a.click();
  setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 500);
  return content;
}

function exportSVG(name = 'numex-laser-pro.svg') {
  const svg = generateSVG();
  download(name, svg, 'image/svg+xml');
  const checks = verifySVG(svg);
  return { type:'SVG', checks, svg };
}

function exportDXF(name = 'numex-laser-pro.dxf') {
  const dxf = generateDXF();
  download(name, dxf, 'application/dxf');
  const checks = verifyDXF(dxf);
  return { type:'DXF', checks, dxf };
}

// DXF'i geri okuyup geometri/ölçü doğrulaması (Y ekseni DXF'te yukarıdadır)
function verifyDXF(dxf) {
  const text = dxf || generateDXF();
  const ents = parseDXF(text);
  const checks = [];
  const lines = ents.filter(e => e.type === 'line');
  const texts = ents.filter(e => e.type === 'text');
  const flat = flattenObjects(state.objects).filter(o => o.type !== 'group');

  checks.push({ k:'$INSUNITS = mm', ok: /\$INSUNITS\s*\n\s*70\s*\n\s*4/.test(text), v:'kod 70 = 4 (mm)' });
  checks.push({ k:'Varlık sayısı', ok: lines.length > 0, v:`${lines.length} LINE, ${texts.length} TEXT` });

  // Geometrinin sınır kutusu, tasarımın sınır kutusuna eşit olmalı
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const e of lines) {
    minX = Math.min(minX, e.x1, e.x2); maxX = Math.max(maxX, e.x1, e.x2);
    minY = Math.min(minY, e.y1, e.y2); maxY = Math.max(maxY, e.y1, e.y2);
  }
  // Çizgi olmayan az nesne varsa (ellipse EDGE, text) kutu çıkmasın
  if (lines.length) {
    let dx1 = Infinity, dy1 = Infinity, dx2 = -Infinity, dy2 = -Infinity;
    for (const o of flat) {
      if (o.type === 'ellipse' || o.type === 'text') continue;
      const b = objBoundsNoRot(o);
      dx1 = Math.min(dx1, b.x1); dy1 = Math.min(dy1, b.y1);
      dx2 = Math.max(dx2, b.x2); dy2 = Math.max(dy2, b.y2);
    }
    const W = dx2 - dx1, H = dy2 - dy1;
    checks.push({ k:'Sınır kutusu genişliği', ok: Math.abs((maxX - minX) - W) < 0.1, v:`${r2(maxX - minX)} mm (beklenen ${r2(W)})` });
    checks.push({ k:'Sınır kutusu yüksekliği', ok: Math.abs((maxY - minY) - H) < 0.1, v:`${r2(maxY - minY)} mm (beklenen ${r2(H)})` });
    // Beklenen dönüş: editor Y aşağı, DXF Y yukarı → y_dxf = bed.h - y_ed
    checks.push({ k:'Y ekseni çevrimi', ok: Math.abs((state.bed.h - maxY) - dy1) < 0.1, v:`üst kenar DXF Y=${r2(state.bed.h - maxY)} (beklenen ${r2(dy1)})` });
  }

  // Döndürülmüş nesne varsa DXF'te gerçekten dönmüş mü?
  const rotObj = flat.find(o => o.rot && o.type !== 'line');
  if (rotObj) {
    const expected = rotatedCorners(rotObj).map(p => ({ x:p.x, y:state.bed.h - p.y }));
    const x1e = Math.min(...expected.map(p => p.x)), x2e = Math.max(...expected.map(p => p.x));
    const y1e = Math.min(...expected.map(p => p.y)), y2e = Math.max(...expected.map(p => p.y));
    let foundX = false, foundY = false;
    for (const e of lines) {
      for (const [x, y] of [[e.x1, e.y1], [e.x2, e.y2]]) {
        if (Math.abs(x - x1e) < 0.1 || Math.abs(x - x2e) < 0.1) foundX = true;
        if (Math.abs(y - y1e) < 0.1 || Math.abs(y - y2e) < 0.1) foundY = true;
      }
    }
    checks.push({ k:'Dönüş uygulanmış', ok: foundX && foundY, v:`${r2(rotObj.rot)}° — sınır X ${r2(x1e)}…${r2(x2e)}` });
  }

  // Kapalı şekillerin konturu kopuk mu? Aynı katmanda uç noktaları birbirine değmeyen
  // ardışık LINE'lar açık kontur demektir; kapalı şekil sayısı kadar kontur beklenir.
  const closedCount = flat.filter(o => ['rect','ellipse','polygon'].includes(o.type) || (o.type === 'path' && o.closed)).length;
  if (closedCount) {
    const openEnds = countOpenEnds(lines);
    checks.push({ k:'Kapalı kontur', ok: openEnds.open <= 2, v:`${closedCount} kapalı şekil · açık uç ${openEnds.open}` });
  }

  if (texts.length) {
    checks.push({ k:'Metin sayısı', ok: texts.length === flat.filter(o => o.type === 'text').length, v:`${texts.length} TEXT` });
  }
  return checks;
}

function exportJSON() {
  const data = {
    app:'NUMEX LASER PRO',
    version: 1,
    units: 'mm',
    bed: state.bed,
    layers: state.layers,
    activeLayer: state.activeLayer,
    objects: state.objects,
    createdAt: new Date().toISOString()
  };
  const text = JSON.stringify(data, null, 2);
  download('numex-laser-pro.json', text, 'application/json');
  return text;
}

function exportPNG() {
  // Önizleme: bed ölçeğinde bir offscreen canvas
  const scale = 4; // 4 px/mm = 0.25 mm/px → iyi önizleme
  const c = document.createElement('canvas');
  c.width = state.bed.w * scale;
  c.height = state.bed.h * scale;
  const cx = c.getContext('2d');
  cx.fillStyle = '#ffffff';
  cx.fillRect(0, 0, c.width, c.height);
  // Geçici olarak state.zoom/pan değiştir
  const oldZoom = state.zoom, oldPan = { ...state.pan };
  state.zoom = scale; state.pan = { x:0, y:0 };
  // Ana canvas üzerinden yeniden çizemeyiz; doğrudan primitive çizelim
  for (const o of flattenObjects(state.objects)) {
    const L = state.layers[o.layer];
    cx.strokeStyle = L.color;
    cx.lineWidth = o.layer === 'cut' ? 2 : 1.2;
    cx.fillStyle = L.color + 'cc';
    const px = o.x * scale, py = o.y * scale, w = o.w * scale, h = o.h * scale;
    switch (o.type) {
      case 'rect':
        if (o.radius) {
          // yaklaştır
          const r = o.radius * scale;
          cx.beginPath();
          cx.moveTo(px + r, py);
          cx.lineTo(px + w - r, py);
          cx.quadraticCurveTo(px + w, py, px + w, py + r);
          cx.lineTo(px + w, py + h - r);
          cx.quadraticCurveTo(px + w, py + h, px + w - r, py + h);
          cx.lineTo(px + r, py + h);
          cx.quadraticCurveTo(px, py + h, px, py + h - r);
          cx.lineTo(px, py + r);
          cx.quadraticCurveTo(px, py, px + r, py);
          cx.closePath();
        } else cx.rect(px, py, w, h);
        if (o.style === 'filled') cx.fill();
        cx.stroke(); break;
      case 'ellipse':
        cx.beginPath();
        cx.ellipse(px + w/2, py + h/2, w/2, h/2, 0, 0, Math.PI*2);
        if (o.style === 'filled') cx.fill();
        cx.stroke(); break;
      case 'line':
        cx.beginPath(); cx.moveTo(px, py); cx.lineTo(px + w, py + h); cx.stroke(); break;
      case 'polygon':
      case 'path':
        cx.beginPath();
        (o.points || []).forEach((pt, i) => {
          const qx = (o.x + pt[0]) * scale, qy = (o.y + pt[1]) * scale;
          i === 0 ? cx.moveTo(qx, qy) : cx.lineTo(qx, qy);
        });
        if (o.closed || o.type === 'polygon') cx.closePath();
        if (o.style === 'filled') cx.fill();
        cx.stroke(); break;
      case 'text':
        cx.font = `700 ${(o.fontSize || 10) * scale}px Arial sans-serif`;
        cx.fillStyle = L.color;
        cx.textBaseline = 'top';
        cx.fillText(o.text || '', px, py);
        break;
    }
  }
  state.zoom = oldZoom; state.pan = oldPan;
  c.toBlob(b => {
    const url = URL.createObjectURL(b);
    const a = document.createElement('a');
    a.href = url; a.download = 'numex-laser-pro.png';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }, 'image/png');
  return c.toDataURL();
}

// Diske yazmadan SVG doğrulaması: üret → yeniden oku → her nesnenin ölçüsünü karşılaştır
function verifySVG(svgText) {
  const text = svgText || generateSVG();
  const info = parseSVG(text);
  const checks = [];
  checks.push({ k:'SVG genişlik (mm)', ok: Math.abs(info.wMM - state.bed.w) < 0.01, v:`${info.wMM} mm (beklenen ${state.bed.w})` });
  checks.push({ k:'SVG yükseklik (mm)', ok: Math.abs(info.hMM - state.bed.h) < 0.01, v:`${info.hMM} mm (beklenen ${state.bed.h})` });

  // Her nesne tipi için ilk örneğin mm ölçüsünü geri okuyup karşılaştır
  const flat = flattenObjects(state.objects).filter(o => o.type !== 'group');
  for (const type of ['rect','ellipse','line','polygon','path']) {
    const o = flat.find(x => x.type === type);
    if (!o) continue;
    const box = readBackBox(info, type);
    if (!box) { checks.push({ k:`${type} okunamadı`, ok:false, v:'SVG içinde bulunamadı' }); continue; }
    const exp = objBoundsNoRot(o);
    const dxOk = Math.abs(box.x - exp.x1) < 0.05 && Math.abs(box.y - exp.y1) < 0.05;
    const sizeOk = Math.abs(box.w - (exp.x2 - exp.x1)) < 0.05 && Math.abs(box.h - (exp.y2 - exp.y1)) < 0.05;
    checks.push({ k:`${TYPE_NAME[type]} konum`, ok: dxOk, v:`X ${r2(box.x)} / Y ${r2(box.y)} mm` });
    checks.push({ k:`${TYPE_NAME[type]} ölçü`, ok: sizeOk, v:`${r2(box.w)} × ${r2(box.h)} mm (beklenen ${r2(exp.x2-exp.x1)} × ${r2(exp.y2-exp.y1)})` });
  }
  if (flat.some(o => o.type === 'rect' && o.radius)) {
    const rr = flat.find(o => o.type === 'rect' && o.radius);
    checks.push({ k:'Yuvarlatma (rx)', ok: Math.abs((info.firstRects.rx || 0) - Math.min(rr.radius, rr.w/2, rr.h/2)) < 0.02,
      v:`${r2(info.firstRects.rx || 0)} mm` });
  }
  const textObjs = flat.filter(o => o.type === 'text');
  if (textObjs.length) {
    checks.push({ k:'Metin sayısı', ok: info.counts.text === textObjs.length, v:`${info.counts.text} (beklenen ${textObjs.length})` });
    checks.push({ k:'Metin içeriği', ok: info.texts.join('|') === textObjs.map(o => o.text).join('|'), v:info.texts.join(', ') || '—' });
  }
  const expCount = flat.length;
  const gotCount = info.counts.rect + info.counts.ellipse + info.counts.line + info.counts.polygon + info.counts.path + info.counts.text;
  checks.push({ k:'Nesne sayısı', ok: gotCount === expCount, v:`${gotCount} (beklenen ${expCount})` });
  return checks;
}

function objBoundsNoRot(o) {
  if (o.type === 'line') {
    return { x1:Math.min(o.x, o.x + o.w), y1:Math.min(o.y, o.y + o.h), x2:Math.max(o.x, o.x + o.w), y2:Math.max(o.y, o.y + o.h) };
  }
  return objBounds(o);
}

function readBackBox(info, type) {
  if (type === 'rect') return info.firstRects;
  if (type === 'ellipse') return info.firstEllipses;
  if (type === 'line') return info.firstLines;
  if (type === 'polygon' || type === 'path') return info.firstPolys;
  return null;
}

function verifyExports() {
  const svg = generateSVG();
  const dxf = generateDXF();
  const svgChecks = verifySVG(svg);
  const dxfChecks = verifyDXF(dxf);
  const rows = [
    ...svgChecks.map(c => ({ type:'SVG', ...c })),
    ...dxfChecks.map(c => ({ type:'DXF', ...c }))
  ];
  const ok = rows.every(r => r.ok);
  return { ok, rows, svg, dxf };
}

function showVerifyModal() {
  const res = verifyExports();
  const rowsHtml = res.rows.map(r => `<tr><td>${r.type}</td><td>${r.k}</td><td>${r.v}</td><td class="${r.ok?'ok':'err'}">${r.ok?'✓':'✗'}</td></tr>`).join('');
  const und = collectUndsupported();
  openModal('Ölçü & Dışa Aktarma Doğrulaması',
    `<p><strong>Durum:</strong> ${res.ok ? '<span class="ok">Tüm ölçüler korunmuştur</span>' : '<span class="err">Bazı ölçüler korunamadı</span>'}</p>
     <table><thead><tr><th>Tür</th><th>Ölçüm</th><th>Değer</th><th></th></tr></thead><tbody>${rowsHtml}</tbody></table>
     ${und.length ? `<p style="margin-top:10px"><strong>DXF'te desteklenmeyen özellikler:</strong></p><ul>${und.map(u=>`<li>${u}</li>`).join('')}</ul>` : `<p style="margin-top:10px;color:#7b8798">Desteklenmeyen özellik yok.</p>`}
     <p style="margin-top:10px;color:#7b8798;font-size:11px">Not: SVG mm cinsinden yazılır (width/height mm birimli). DXF R12 (AC1009), Y ekseni yukarıdır ($INSUNITS=4 mm).</p>`
  );
}

function collectUndsupported() {
  const flat = flattenObjects(state.objects);
  const out = [];
  for (const o of flat) {
    if (o.rot) out.push(`"${o.name}": ${r2(o.rot)}° dönüş nokta koordinatlarına gömüldü (DXF'te nesne dönüşü yok)`);
    if (o.type === 'text') out.push(`"${o.name}": DXF TEXT olarak yazıldı, harf konturları çıkmaz (gravür için SVG kullanın)`);
    if (o.type === 'path' && o.points && o.points.length > 500) out.push(`"${o.name}": ${o.points.length} noktalı serbest çizim tek POLYLINE olarak yazıldı (makine tarafı düğüm sayısını sınırlayabilir)`);
    if (o.type === 'rect' && o.radius) out.push(`"${o.name}": yuvarlatılmış köşe köşe başına ${ARC_SEG} parçalı yaklaşımla çizildi (yay nesnesi değil)`);
  }
  return out;
}

function showReport() {
  const a = analyze();
  const rows = [
    ['Toplam kesim', r2(a.totalCut) + ' mm'],
    ['Gravür', r2(a.totalEngrave) + ' mm'],
    ['İşaretleme', r2(a.totalMark) + ' mm'],
    ['Tahmini süre', r2(a.totalSec) + ' sn (ivmelenme hariç)'],
    ['Hatalar', a.findings.errors.length],
    ['Uyarılar', a.findings.warnings.length]
  ];
  openModal('Ölçüm Raporu',
    `<pre>${rows.map(r => `${r[0].padEnd(18)} ${r[1]}`).join('\n')}</pre>
     <p style="margin-top:8px;color:#7b8798;font-size:11px">Kesim parametreleri yalnız iş hazırlığı içindir. Malzemeye uygunluğu operatör doğrulamalıdır.</p>`
  );
}

/* ------------------------------------------------------------ Modal */
function openModal(title, html) {
  $('#modalTitle').textContent = title;
  $('#modalBody').innerHTML = html;
  $('#modalBack').hidden = false;
}
function closeModal() { $('#modalBack').hidden = true; }

function checksHtml(checks, note) {
  const ok = checks.length && checks.every(c => c.ok);
  return `<p><strong>Durum:</strong> ${ok ? '<span class="ok">Tüm ölçüler korundu</span>' : '<span class="err">Bazı ölçümler beklenenden farklı</span>'}</p>
    <table><thead><tr><th>Ölçüm</th><th>Değer</th><th></th></tr></thead><tbody>
    ${checks.map(c => `<tr><td>${c.k}</td><td>${c.v}</td><td class="${c.ok?'ok':'err'}">${c.ok?'✓':'✗'}</td></tr>`).join('')}
    </tbody></table>
    ${note ? `<p style="margin-top:10px;color:#7b8798;font-size:11px">${note}</p>` : ''}`;
}

/* --------------------------------------------------------- SVG Import */
function importSVG(text) {
  try {
    const dom = new DOMParser().parseFromString(text, 'image/svg+xml');
    const root = dom.documentElement;
    const vb = (root.getAttribute('viewBox') || '0 0 100 100').split(/\s+/).map(Number);
    const vbW = vb[2] || 100, vbH = vb[3] || 100;
    // SVG mm cinsindeyse doğru; yoksa 96 DPI → 25.4/96 mm per px
    let wAttr = parseFloat((root.getAttribute('width') || '').replace(/[^\d.\-]/g, '')) || vbW;
    let hAttr = parseFloat((root.getAttribute('height') || '').replace(/[^\d.\-]/g, '')) || vbH;
    const scaleX = state.bed.w * 0.8 / wAttr;
    const scaleY = state.bed.h * 0.8 / hAttr;
    const s = Math.min(scaleX, scaleY);
    const originX = (state.bed.w - wAttr * s) / 2;
    const originY = (state.bed.h - hAttr * s) / 2;
    let imported = 0;
    const newObjs = [];

    const walk = (el, tx, ty) => {
      for (const c of el.children) {
        const tag = c.tagName.toLowerCase();
        const get = (k, d = '0') => parseFloat((c.getAttribute(k) || d + '').replace(/[^\d.\-]/g, '')) || 0;
        const cx = tx + get('x') * s, cy = ty + get('y') * s;
        const cw = get('width') * s, ch = get('height') * s;
        if (tag === 'rect' && cw > 0 && ch > 0) {
          newObjs.push({ id:'o'+(state.uid++), type:'rect', name:'SVG rect', x:r2(originX + cx), y:r2(originY + cy), w:r2(cw), h:r2(ch), rot:0, layer:state.activeLayer, style:'outline', radius: get('rx')*s });
          imported++;
        } else if (tag === 'circle') {
          const r = get('r') * s;
          newObjs.push({ id:'o'+(state.uid++), type:'ellipse', name:'SVG circle', x:r2(originX + tx + get('cx')*s - r), y:r2(originY + ty + get('cy')*s - r), w:r2(2*r), h:r2(2*r), rot:0, layer:state.activeLayer, style:'outline' });
          imported++;
        } else if (tag === 'ellipse') {
          const rx = get('rx') * s, ry = get('ry') * s;
          newObjs.push({ id:'o'+(state.uid++), type:'ellipse', name:'SVG ellipse', x:r2(originX + tx + get('cx')*s - rx), y:r2(originY + ty + get('cy')*s - ry), w:r2(2*rx), h:r2(2*ry), rot:0, layer:state.activeLayer, style:'outline' });
          imported++;
        } else if (tag === 'line') {
          newObjs.push({ id:'o'+(state.uid++), type:'line', name:'SVG line', x:r2(originX + tx + get('x1')*s), y:r2(originY + ty + get('y1')*s), w:r2((get('x2')-get('x1'))*s), h:r2((get('y2')-get('y1'))*s), rot:0, layer:state.activeLayer, style:'outline' });
          imported++;
        } else if (tag === 'polygon' || tag === 'polyline') {
          const pts = (c.getAttribute('points') || '').trim().split(/[\s,]+/).map(Number);
          if (pts.length >= 6) {
            const arr = [];
            for (let i = 0; i < pts.length; i += 2) arr.push([pts[i] * s, pts[i+1] * s]);
            const xs = arr.map(p => p[0]), ys = arr.map(p => p[1]);
            newObjs.push({ id:'o'+(state.uid++), type:'polygon', name:'SVG polygon', x:r2(originX + tx + Math.min(...xs)), y:r2(originY + ty + Math.min(...ys)), w:r2(Math.max(...xs) - Math.min(...xs)), h:r2(Math.max(...ys) - Math.min(...ys)), rot:0, points: arr.map(p => [r2(p[0] - Math.min(...xs)), r2(p[1] - Math.min(...ys))]), layer:state.activeLayer, style:'outline' });
            imported++;
          }
        } else if (tag === 'text') {
          const txt = c.textContent || '';
          if (txt.trim()) {
            const fs = get('font-size', '10') * s;
            newObjs.push({ id:'o'+(state.uid++), type:'text', name:txt.slice(0,16), x:r2(originX + tx + get('x')*s), y:r2(originY + ty + (get('y')*s - fs)), w:r2(Math.max(20, txt.length*fs*0.6)), h:r2(fs), rot:0, text:txt, fontSize:r2(fs), layer:state.activeLayer, style:'outline' });
            imported++;
          }
        } else if (tag === 'g') {
          const tAttr = c.getAttribute('transform') || '';
          const mt = tAttr.match(/translate\(([\d.\-]+)[ ,]+([\d.\-]+)\)/);
          const gx = mt ? parseFloat(mt[1]) * s : 0, gy = mt ? parseFloat(mt[2]) * s : 0;
          walk(c, tx + gx, ty + gy);
        }
      }
    };
    walk(root, 0, 0);
    if (!imported) { alert('SVG içinde desteklenen temel eleman bulunamadı (rect, circle, ellipse, line, polygon, polyline, text).'); return false; }
    pushHistory();
    state.objects.push(...newObjs);
    state.selection = new Set(newObjs.map(o => o.id));
    refreshUI(); draw();
    if (imported > 0) {
      const und = [];
      const unsupported = [...root.querySelectorAll('path,use,image,filter,gradient,pattern,mask,clipPath,foreignObject')];
      if (unsupported.length) und.push(`${unsupported.length} SVG öğesi (path/use/image/filter/…) DESTEKLENMEDİ, atlandı.`);
      if (und.length) alert(`İçe aktarıldı: ${imported} nesne.\nUyarı: ${und.join('\n')}`);
    }
    return true;
  } catch (err) {
    alert('SVG okunamadı: ' + err.message);
    return false;
  }
}

/* -------------------------------------------------- Proje yükleme */
function loadProjectJSON(text) {
  try {
    const d = JSON.parse(text);
    if (!d.objects) throw new Error('Geçerli bir NUMEX projesi değil');
    pushHistory();
    state.objects = d.objects;
    if (d.bed) state.bed = d.bed;
    if (d.layers) state.layers = d.layers;
    state.selection.clear();
    state.uid = Math.max(...flattenObjects(state.objects).map(o => parseInt((o.id||'o0').replace(/\D/g,'')) || 0)) + 1;
    placeBedInView(false);
    refreshUI(); draw();
    return true;
  } catch (err) {
    alert('Proje açılamadı: ' + err.message);
    return false;
  }
}

function loadSample() {
  // Önce mevcut durumu geçmişe yaz, sonra değiştir (aksi hâlde undo boş bir hâle döner)
  if (state.objects.length) pushHistory();
  const sample = makeKeyring();
  state.objects = sample.objects;
  state.bed = sample.bed;
  state.selection.clear();
  state.uid = 100;
  placeBedInView(false);
  if ($('#bedW')) $('#bedW').value = state.bed.w;
  if ($('#bedH')) $('#bedH').value = state.bed.h;
  refreshUI(); draw();
}

function newProject() {
  if (state.objects.length && !confirm('Mevcut proje temizlenecek. Devam?')) return;
  pushHistory();
  state.objects = [];
  state.selection.clear();
  refreshUI(); draw();
}

/* ---------------------------------------------------------- UI Wiring */
function updateZoomLabel() { $('#zoomLabel').textContent = '%' + Math.round(state.zoom * 50); }

$$('#drawTools .tool').forEach(b => b.onclick = () => setTool(b.dataset.tool));
$('#btnUndo').onclick = undo;
$('#btnRedo').onclick = redo;
$('#btnDup').onclick = duplicateSelected;
$('#btnGroup').onclick = groupSelected;
$('#btnUngroup').onclick = ungroup;
$('#btnDel').onclick = deleteSelected;
$('#btnNew').onclick = newProject;
$('#btnSave').onclick = () => exportJSON();
$('#btnOpen').onclick = () => $('#fileOpen').click();
$('#btnImport').onclick = () => $('#fileImportSvg').click();
$('#fileImportSvg').onchange = (e) => {
  const f = e.target.files[0]; if (!f) return;
  const rd = new FileReader();
  rd.onload = () => importSVG(rd.result);
  rd.readAsText(f);
  e.target.value = '';
};
$('#fileOpen').onchange = (e) => {
  const f = e.target.files[0]; if (!f) return;
  const rd = new FileReader();
  rd.onload = () => loadProjectJSON(rd.result);
  rd.readAsText(f);
  e.target.value = '';
};
$('#btnExport').onclick = (e) => {
  e.stopPropagation();
  $('#exportMenu').hidden = !$('#exportMenu').hidden;
};
document.addEventListener('click', (e) => {
  if (!$('#exportMenu').contains(e.target) && e.target !== $('#btnExport')) $('#exportMenu').hidden = true;
});
$$('#exportMenu button').forEach(b => b.onclick = () => {
  const t = b.dataset.exp;
  $('#exportMenu').hidden = true;
  try {
    // NUMEX-DÜZELTME (2026-11-14): Dışa aktarma menüsü var olmayan 'collectUndsupported' adını çağırıyordu (TypeError); ayrıca alert yerine rapor paneli kullanılıyor.
    if (t === 'svg') { const r = exportSVG(); openModal('SVG dışa aktarıldı', checksHtml(r.checks, 'SVG ölçüleri dosyadan geri okunarak doğrulandı.')); }
    else if (t === 'dxf') { const r = exportDXF(); const und = collectUnsupported(); openModal('DXF dışa aktarıldı', checksHtml(r.checks, 'DXF R12 · mm · Y ekseni yukarı.') + (und.length ? `<p style="margin-top:10px"><strong>Yaklaştırılan / desteklenmeyen özellikler:</strong></p><ul>${und.map(u=>`<li>${u}</li>`).join('')}</ul>` : '')); }
    else if (t === 'png') { exportPNG(); }
    else if (t === 'json') { exportJSON(); }
    else if (t === 'verify') { showVerifyModal(); }
    else if (t === 'report') { showReport(); }
  } catch (err) {
    alert('Hata: ' + err.message);
  }
});
$('#btnAnalyze').onclick = () => analyze();
$('#zoomIn').onclick = () => { state.zoom = Math.min(40, state.zoom * 1.2); updateZoomLabel(); draw(); };
$('#zoomOut').onclick = () => { state.zoom = Math.max(0.2, state.zoom / 1.2); updateZoomLabel(); draw(); };
$('#zoomFit').onclick = () => placeBedInView(true);
$('#bedW').onchange = () => { const v = Number($('#bedW').value); if (v > 10) { pushHistory(); state.bed.w = v; placeBedInView(false); refreshUI(); draw(); } };
$('#bedH').onchange = () => { const v = Number($('#bedH').value); if (v > 10) { pushHistory(); state.bed.h = v; placeBedInView(false); refreshUI(); draw(); } };
$('#modalClose').onclick = closeModal;
$('#modalBack').onclick = (e) => { if (e.target === $('#modalBack')) closeModal(); };
window.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });

/* -------------------------------------------------------------- Başlat */
function init() {
  resize();
  placeBedInView(false);
  loadSample();
  setTool('select');
  pushHistory(); // başlangıç durumu
  refreshUI(); draw();

  // SON ADIM: açılışta kesim kontrolü kendiliğinden çalışsın
  analyze();

  // Testler için global exposure (yalnız okuma/denetim amaçlı)
  window.NUMEX_LASER = {
    state,
    analyze,
    generateSVG, generateDXF,
    exportSVG, exportDXF, exportJSON, exportPNG,
    parseSVG, parseDXF, verifyExports, verifySVG, verifyDXF,
    loadSample, newProject, loadProjectJSON, makeKeyring,
    selectAll: () => { state.selection = new Set(state.objects.map(o => o.id)); refreshUI(); draw(); },
    select: (id) => { state.selection = new Set([id]); refreshUI(); draw(); },
    addObject: (o) => { pushHistory(); const id = 'o' + (state.uid++); state.objects.push({ ...o, id }); state.selection = new Set([id]); refreshUI(); draw(); return id; },
    setTool,
    undo, redo,
    snapshot: () => snapshot(),
    // Tarayıcı testi: gerçek fare hareketi olmadan taşımayı aynı kod yoluyla çalıştır
    simulateMove: (id, dxMM, dyMM) => {
      const o = state.objects.find(x => x.id === id);
      if (!o) return null;
      const before = snapshot();
      o.x = r2(o.x + dxMM); o.y = r2(o.y + dyMM);
      state.history = state.history.slice(0, state.histIdx + 1);
      state.history.push(before);
      state.histIdx = state.history.length - 1;
      syncUndoButtons(); refreshUI(); draw();
      return { x:o.x, y:o.y };
    }
  };
}

init();
})();
