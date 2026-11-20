// NUMEX PRİZMA — render.js
// Kamera (zoom/pan), canvas çizimi, kesişim noktaları, ölçümler, SVG/PNG export, rapor.

import { elementVertices, elementEdges, transformDir, vec, len, sub, deg, angleOf } from './geometry.js';
import { wavelengthColor } from './optics.js';

export const KAMERA = { minZoom: 0.15, maxZoom: 8 };

export function ekranDonusum(state, canvas) {
  const cw = canvas.clientWidth || canvas.width;
  const ch = canvas.clientHeight || canvas.height;
  const cam = state.camera;
  const zoom = cam.zoom;
  const toScreen = (p) => ({
    x: (p.x - cam.x) * zoom + cw / 2,
    y: (p.y - cam.y) * zoom + ch / 2
  });
  const toWorld = (p) => ({
    x: (p.x - cw / 2) / zoom + cam.x,
    y: (p.y - ch / 2) / zoom + cam.y
  });
  return { toScreen, toWorld, cw, ch, zoom };
}

export function ekranTemizle(ctx, canvas) {
  const g = ctx.createLinearGradient(0, 0, 0, canvas.height);
  g.addColorStop(0, '#080c18');
  g.addColorStop(1, '#05070f');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function cizGrid(ctx, tr, canvas) {
  const step = 50 * tr.zoom;
  if (step < 8) return;
  const sol = tr.toWorld({ x: 0, y: 0 });
  const sag = tr.toWorld({ x: tr.cw, y: tr.ch });
  ctx.save();
  ctx.lineWidth = 1;
  ctx.strokeStyle = 'rgba(90,130,200,0.10)';
  ctx.beginPath();
  for (let x = Math.floor(sol.x / 50) * 50; x <= sag.x; x += 50) {
    const s = tr.toScreen({ x, y: 0 }).x;
    ctx.moveTo(s, 0); ctx.lineTo(s, tr.ch);
  }
  for (let y = Math.floor(sol.y / 50) * 50; y <= sag.y; y += 50) {
    const s = tr.toScreen({ x: 0, y }).y;
    ctx.moveTo(0, s); ctx.lineTo(tr.cw, s);
  }
  ctx.stroke();
  // eksen
  ctx.strokeStyle = 'rgba(120,180,255,0.28)';
  ctx.beginPath();
  const o = tr.toScreen({ x: 0, y: 0 });
  ctx.moveTo(o.x, 0); ctx.lineTo(o.x, tr.ch);
  ctx.moveTo(0, o.y); ctx.lineTo(tr.cw, o.y);
  ctx.stroke();
  ctx.restore();
}

const TIP_RENK = {
  pointSource: '#fbbf24',
  parallelSource: '#fbbf24',
  planeMirror: '#67e8f9',
  concaveMirror: '#67e8f9',
  convexMirror: '#67e8f9',
  convergingLens: '#a78bfa',
  divergingLens: '#a78bfa',
  prism: '#e2e8f0',
  screen: '#94a3b8',
  wall: '#94a3b8'
};

export function cizEleman(ctx, el, secili, tr) {
  const verts = elementVertices(el).map(tr.toScreen);
  ctx.save();
  ctx.lineJoin = 'round';

  if (el.tip === 'pointSource') {
    const c = tr.toScreen({ x: el.x, y: el.y });
    const grd = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, 34 * tr.zoom);
    grd.addColorStop(0, 'rgba(255,240,170,0.95)');
    grd.addColorStop(0.25, 'rgba(255,215,90,0.45)');
    grd.addColorStop(1, 'rgba(255,200,60,0)');
    ctx.fillStyle = grd;
    ctx.beginPath(); ctx.arc(c.x, c.y, 34 * tr.zoom, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff8d0';
    ctx.beginPath(); ctx.arc(c.x, c.y, 5, 0, Math.PI * 2); ctx.fill();
    // yön oku
    const a = el.angle || 0;
    const u = { x: c.x + Math.cos(a) * 26, y: c.y + Math.sin(a) * 26 };
    ctx.strokeStyle = 'rgba(255,230,140,0.7)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 3]);
    ctx.beginPath(); ctx.moveTo(c.x, c.y); ctx.lineTo(u.x, u.y); ctx.stroke();
    ctx.setLineDash([]);
  } else if (el.tip === 'parallelSource') {
    // kaynak çubuğu + ışın yönü oku
    const a = el.angle || 0;
    const d = { x: Math.cos(a), y: Math.sin(a) };
    const perp = { x: -d.y, y: d.x };
    const half = (el.length ?? 160) / 2;
    const p1 = tr.toScreen({ x: el.x + perp.x * half, y: el.y + perp.y * half });
    const p2 = tr.toScreen({ x: el.x - perp.x * half, y: el.y - perp.y * half });
    ctx.strokeStyle = '#fde68a';
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.stroke();
    ctx.strokeStyle = 'rgba(253,230,138,0.6)';
    ctx.lineWidth = 1.5;
    const c = tr.toScreen({ x: el.x, y: el.y });
    ctx.beginPath(); ctx.moveTo(c.x, c.y); ctx.lineTo(c.x + d.x * 40, c.y + d.y * 40); ctx.stroke();
  } else if (el.tip === 'screen' || el.tip === 'wall') {
    const p1 = verts[0], p2 = verts[verts.length - 1];
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 6;
    ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.stroke();
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.stroke();
  } else if (el.tip === 'prism') {
    ctx.beginPath();
    verts.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
    ctx.closePath();
    const g = ctx.createLinearGradient(verts[0].x, verts[0].y, verts[2].x, verts[2].y);
    g.addColorStop(0, 'rgba(148,196,255,0.24)');
    g.addColorStop(1, 'rgba(196,160,255,0.18)');
    ctx.fillStyle = g;
    ctx.fill();
    ctx.strokeStyle = '#a5c8ff';
    ctx.lineWidth = 2.5;
    ctx.stroke();
  } else if (el.tip === 'convergingLens' || el.tip === 'divergingLens') {
    const p1 = verts[0], p2 = verts[1];
    const mid = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
    const hgt = len(sub(p2, p1));
    const bulge = (el.tip === 'convergingLens' ? 1 : -1) * Math.min(26, hgt * 0.16) * tr.zoom;
    const dir = transformDir(vec(0, 1), el);
    const nx = -dir.y, ny = dir.x;
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.quadraticCurveTo(mid.x + nx * bulge * 2, mid.y + ny * bulge * 2, p2.x, p2.y);
    ctx.quadraticCurveTo(mid.x - nx * bulge * 2, mid.y - ny * bulge * 2, p1.x, p1.y);
    ctx.fillStyle = el.tip === 'convergingLens' ? 'rgba(167,139,250,0.22)' : 'rgba(96,165,250,0.18)';
    ctx.fill();
    ctx.strokeStyle = '#c4b5fd';
    ctx.lineWidth = 2;
    ctx.stroke();
    // odak noktaları
    const f = el.f ?? 120;
    const nAxis = transformDir(vec(1, 0), el);
    if (isFinite(f)) {
      for (const s of [1, -1]) {
        const fp = tr.toScreen({ x: el.x + nAxis.x * f * s, y: el.y + nAxis.y * f * s });
        ctx.fillStyle = 'rgba(196,181,253,0.9)';
        ctx.beginPath(); ctx.arc(fp.x, fp.y, 3, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = 'rgba(196,181,253,0.65)';
        ctx.font = '10px system-ui';
        ctx.fillText('F', fp.x + 5, fp.y - 5);
      }
    }
  } else {
    // aynalar
    const gc = el.angle || 0;
    const dir = { x: Math.cos(gc), y: Math.sin(gc) };
    const nx = -dir.y, ny = dir.x;
    ctx.beginPath();
    verts.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
    ctx.strokeStyle = '#7dd3fc';
    ctx.lineWidth = 3;
    ctx.stroke();
    // arka taraf tarama (ayna sırtı)
    ctx.beginPath();
    verts.forEach((p, i) => {
      const ex = p.x + nx * 6, ey = p.y + ny * 6;
      i ? ctx.lineTo(ex, ey) : ctx.moveTo(ex, ey);
    });
    ctx.strokeStyle = 'rgba(125,211,252,0.35)';
    ctx.lineWidth = 5;
    ctx.stroke();
  }

  if (secili) {
    const xs = verts.map((p) => p.x), ys = verts.map((p) => p.y);
    const c = tr.toScreen({ x: el.x, y: el.y });
    ctx.strokeStyle = 'rgba(94,234,212,0.9)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 4]);
    ctx.strokeRect(Math.min(...xs) - 14, Math.min(...ys) - 14,
      Math.max(...xs) - Math.min(...xs) + 28, Math.max(...ys) - Math.min(...ys) + 28);
    ctx.setLineDash([]);
    // döndürme tutamacı
    ctx.fillStyle = 'rgba(94,234,212,0.95)';
    ctx.beginPath();
    ctx.arc(c.x, Math.min(...ys) - 34, 6, 0, Math.PI * 2);
    ctx.fill();
  }
  void TIP_RENK[el.tip];
  ctx.restore();
}

/** Işını animasyonlu ilerlemeyle çizer: progress 0..1 arası kesir. */
export function cizIsin(ctx, path, progress, izAcik, tr) {
  const pts = path.points;
  if (!pts || pts.length < 2) return;
  const uzunluklar = [];
  let toplam = 0;
  for (let i = 1; i < pts.length; i++) {
    const l = len(sub(pts[i], pts[i - 1]));
    uzunluklar.push(l); toplam += l;
  }
  const hedef = toplam * Math.max(0.0001, Math.min(1, progress));
  const cizilecek = [tr.toScreen(pts[0])];
  let acc = 0;
  for (let i = 1; i < pts.length; i++) {
    if (acc + uzunluklar[i - 1] <= hedef) {
      cizilecek.push(tr.toScreen(pts[i]));
      acc += uzunluklar[i - 1];
    } else {
      const t = (hedef - acc) / (uzunluklar[i - 1] || 1);
      const a = pts[i - 1], b = pts[i];
      cizilecek.push(tr.toScreen({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t }));
      break;
    }
  }
  if (cizilecek.length < 2) return;

  ctx.save();
  ctx.lineCap = 'round';
  const renk = path.color || wavelengthColor(path.nm) || '#cfe8ff';

  if (izAcik) {
    ctx.strokeStyle = renk;
    ctx.globalAlpha = 0.18;
    ctx.lineWidth = 6;
    ctx.beginPath();
    cizilecek.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  ctx.strokeStyle = renk;
  ctx.lineWidth = 1.6;
  ctx.shadowColor = renk;
  ctx.shadowBlur = 8;
  ctx.beginPath();
  cizilecek.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
  ctx.stroke();
  ctx.shadowBlur = 0;

  // uç ışıması
  const son = cizilecek[cizilecek.length - 1];
  ctx.globalAlpha = 0.9;
  ctx.fillStyle = renk;
  ctx.beginPath(); ctx.arc(son.x, son.y, 2.2, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

function cizKesisimler(ctx, paths, tr, seciliId) {
  ctx.save();
  for (const p of paths) {
    for (const h of p.hits) {
      const s = tr.toScreen(h);
      const on = h.elementId === seciliId;
      ctx.fillStyle = h.kind === 'mirror' ? 'rgba(125,211,252,0.95)'
        : h.kind === 'refract' ? 'rgba(253,224,71,0.95)'
        : h.kind === 'tir' ? 'rgba(248,113,113,0.95)'
        : h.kind === 'lens' ? 'rgba(167,139,250,0.95)' : 'rgba(148,163,184,0.9)';
      ctx.beginPath(); ctx.arc(s.x, s.y, on ? 4.5 : 3, 0, Math.PI * 2); ctx.fill();
    }
  }
  ctx.restore();
}

function cizOlcumler(ctx, state, paths, tr) {
  ctx.save();
  ctx.font = '11px ui-monospace, monospace';
  const el = state.elements.find((e) => e.id === state.seciliId);
  if (!el) { ctx.restore(); return; }
  for (const p of paths.slice(0, 24)) {
    for (const h of p.hits) {
      if (h.elementId !== el.id) continue;
      if (h.kind === 'mirror') {
        const s = tr.toScreen(h);
        ctx.fillStyle = 'rgba(125,211,252,0.95)';
        ctx.fillText(`${h.angleIn.toFixed(1)}° / ${h.angleOut.toFixed(1)}°`, s.x + 8, s.y - 8);
      } else if (h.kind === 'refract') {
        const s = tr.toScreen(h);
        ctx.fillStyle = 'rgba(253,224,71,0.95)';
        ctx.fillText(`${h.angleIn.toFixed(1)}°→${h.angleOut.toFixed(1)}°`, s.x + 8, s.y - 8);
      } else if (h.kind === 'tir') {
        const s = tr.toScreen(h);
        ctx.fillStyle = 'rgba(248,113,113,0.95)';
        ctx.fillText('TIR', s.x + 8, s.y - 8);
      }
    }
  }
  // mesafe ölçümü: seçili elemandan sahne merkezine
  const o = tr.toScreen({ x: 0, y: 0 });
  const c = tr.toScreen({ x: el.x, y: el.y });
  ctx.strokeStyle = 'rgba(94,234,212,0.35)';
  ctx.setLineDash([4, 4]);
  ctx.beginPath(); ctx.moveTo(o.x, o.y); ctx.lineTo(c.x, c.y); ctx.stroke();
  ctx.setLineDash([]);
  const mesafe = Math.hypot(el.x, el.y);
  ctx.fillStyle = 'rgba(94,234,212,0.9)';
  ctx.fillText(`${mesafe.toFixed(0)} px`, (o.x + c.x) / 2 + 6, (o.y + c.y) / 2 - 6);
  ctx.restore();
}

export function cizSahne(ctx, state, canvas) {
  const tr = ekranDonusum(state, canvas);
  ekranTemizle(ctx, canvas);
  cizGrid(ctx, tr, canvas);

  const paths = state.sonuclar?.paths || [];
  const prog = state.animasyon?.acik ? Math.min(1, state.animasyon.progress) : 1;

  for (const el of state.elements) cizEleman(ctx, el, el.id === state.seciliId, tr);
  for (const p of paths) cizIsin(ctx, p, prog, state.izAcik, tr);
  if (state.kesismNoktalari !== false) cizKesisimler(ctx, paths, tr, state.seciliId);
  cizOlcumler(ctx, state, paths, tr);

  // sahne ölçek göstergesi
  ctx.save();
  ctx.fillStyle = 'rgba(148,163,184,0.75)';
  ctx.font = '11px ui-monospace, monospace';
  ctx.fillText(`zoom ${tr.zoom.toFixed(2)}×`, 12, tr.ch - 12);
  ctx.restore();
  return tr;
}

export function ekranaSigdir(state, canvas) {
  const cw = canvas.clientWidth || canvas.width;
  const ch = canvas.clientHeight || canvas.height;
  const noktalar = [];
  // NUMEX-DÜZELTME (2026-11-19): Sığdır, sonsuza giden ışın uçlarını da kutuya kattığı için sahneyi gereksiz küçültüyordu. Kutu önce yalnız elemanlardan kurulur, ışın noktaları ancak bu kutunun makul (3 kat) çevresindeyse katılır.
  const elemanNoktalari = [];
  for (const el of state.elements) {
    if (el.tip === 'pointSource' || el.tip === 'parallelSource') {
      elemanNoktalari.push({ x: el.x, y: el.y });
    } else {
      elemanNoktalari.push(...elementVertices(el));
    }
  }
  if (!elemanNoktalari.length) {
    state.camera = { x: 0, y: 0, zoom: 1 };
    return state.camera;
  }
  const eMinX = Math.min(...elemanNoktalari.map((p) => p.x));
  const eMaxX = Math.max(...elemanNoktalari.map((p) => p.x));
  const eMinY = Math.min(...elemanNoktalari.map((p) => p.y));
  const eMaxY = Math.max(...elemanNoktalari.map((p) => p.y));
  const pay = Math.max(180, (eMaxX - eMinX + eMaxY - eMinY) * 0.35);
  const kirp = (q) => q.x > eMinX - pay * 2 && q.x < eMaxX + pay * 2 && q.y > eMinY - pay * 2 && q.y < eMaxY + pay * 2;
  noktalar.push(...elemanNoktalari);
  for (const p of state.sonuclar?.paths || []) {
    for (const q of p.points) if (kirp(q)) noktalar.push(q);
  }
  if (!noktalar.length) {
    state.camera = { x: 0, y: 0, zoom: 1 };
    return state.camera;
  }
  const minX = Math.min(...noktalar.map((p) => p.x));
  const maxX = Math.max(...noktalar.map((p) => p.x));
  const minY = Math.min(...noktalar.map((p) => p.y));
  const maxY = Math.max(...noktalar.map((p) => p.y));
  const w = Math.max(60, maxX - minX);
  const h = Math.max(60, maxY - minY);
  // NUMEX-DÜZELTME (2026-11-19): Sığdır, ışınların 4000 px'lik sonsuz uçlarını da hesaba kattığı için sahneyi 0.5×'e küçültüyordu. Eleman kutusu ile ışın noktaları ayrı hesaplanır; ışın uçları kırpılır.
  void w; void h;
  const zoom = Math.max(KAMERA.minZoom, Math.min(KAMERA.maxZoom, Math.min(cw / (w * 1.25), ch / (h * 1.25))));
  state.camera = { x: (minX + maxX) / 2, y: (minY + maxY) / 2, zoom: Math.max(zoom, 0.6) };
  return state.camera;
}

export function zoomUygula(state, { factor = 1, cx = null, cy = null } = {}, canvas) {
  const cam = state.camera;
  const onceki = cam.zoom;
  cam.zoom = Math.max(KAMERA.minZoom, Math.min(KAMERA.maxZoom, cam.zoom * factor));
  if (cx !== null && canvas) {
    // imleç sabit kalsın
    const cw = canvas.clientWidth, ch = canvas.clientHeight;
    const wx = (cx - cw / 2) / onceki + cam.x;
    const wy = (cy - ch / 2) / onceki + cam.y;
    cam.x = wx - (cx - cw / 2) / cam.zoom;
    cam.y = wy - (cy - ch / 2) / cam.zoom;
  }
  return cam;
}

export function panUygula(state, dx, dy) {
  state.camera.x -= dx / state.camera.zoom;
  state.camera.y -= dy / state.camera.zoom;
  return state.camera;
}

export function vurusEleman(state, screenPoint, canvas, tol = 16) {
  const tr = ekranDonusum(state, canvas);
  const w = tr.toWorld(screenPoint);
  let best = null;
  for (const el of state.elements) {
    let d;
    if (el.tip === 'pointSource' || el.tip === 'parallelSource') {
      d = Math.hypot(w.x - el.x, w.y - el.y);
    } else {
      const edges = elementEdges(el);
      d = Math.min(...edges.map((e) => distToSeg(w, e.a, e.b)), 1e9);
    }
    const esik = tol / tr.zoom;
    if (d < esik && (!best || d < best.d)) best = { id: el.id, d };
  }
  return best ? best.id : null;
}

function distToSeg(p, a, b) {
  const abx = b.x - a.x, aby = b.y - a.y;
  const l2 = abx * abx + aby * aby;
  let t = l2 ? ((p.x - a.x) * abx + (p.y - a.y) * aby) / l2 : 0;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(p.x - (a.x + abx * t), p.y - (a.y + aby * t));
}

/** Sahnenin SVG karşılığı — canvas ile aynı dünya koordinatları. */
export function toSVG(state) {
  const paths = state.sonuclar?.paths || [];
  const W = 1400, H = 900;
  const parca = [];
  parca.push(`<rect width="${W}" height="${H}" fill="#070b14"/>`);
  const els = [];
  for (const el of state.elements) {
    if (el.tip === 'pointSource') {
      els.push(`<circle cx="${el.x}" cy="${el.y}" r="7" fill="#fff3b0" stroke="#fbbf24" stroke-width="2"/>`);
      continue;
    }
    if (el.tip === 'parallelSource') {
      const a = el.angle || 0;
      const d = { x: Math.cos(a), y: Math.sin(a) };
      const perp = { x: -d.y, y: d.x };
      const half = (el.length ?? 160) / 2;
      els.push(`<line x1="${(el.x + perp.x * half).toFixed(2)}" y1="${(el.y + perp.y * half).toFixed(2)}" x2="${(el.x - perp.x * half).toFixed(2)}" y2="${(el.y - perp.y * half).toFixed(2)}" stroke="#fde68a" stroke-width="3"/>`);
      continue;
    }
    const v = elementVertices(el);
    const pts = v.map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' ');
    if (el.tip === 'prism') {
      els.push(`<polygon points="${pts}" fill="rgba(148,196,255,0.18)" stroke="#a5c8ff" stroke-width="2"/>`);
    } else if (el.tip === 'screen' || el.tip === 'wall') {
      els.push(`<polyline points="${pts}" fill="none" stroke="#cbd5e1" stroke-width="3"/>`);
    } else if (el.tip === 'convergingLens' || el.tip === 'divergingLens') {
      els.push(`<polyline points="${pts}" fill="none" stroke="#c4b5fd" stroke-width="3"/>`);
    } else {
      els.push(`<polyline points="${pts}" fill="none" stroke="#7dd3fc" stroke-width="3"/>`);
    }
  }
  parca.push(`<g id="elemanlar">${els.join('')}</g>`);
  const isinlar = paths.map((p) => {
    const pts = p.points.map((q) => `${q.x.toFixed(2)},${q.y.toFixed(2)}`).join(' ');
    return `<polyline points="${pts}" fill="none" stroke="${p.color || '#cfe8ff'}" stroke-width="1.6" opacity="0.95"/>`;
  });
  parca.push(`<g id="isinlar">${isinlar.join('')}</g>`);
  const noktalar = [];
  for (const p of paths) for (const h of p.hits) noktalar.push(`<circle cx="${h.x.toFixed(2)}" cy="${h.y.toFixed(2)}" r="3" fill="#fde047"/>`);
  parca.push(`<g id="kesisimler">${noktalar.join('')}</g>`);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">${parca.join('\n')}</svg>`;
}

export function toPNG(canvas) {
  return new Promise((resolve) => canvas.toBlob((b) => resolve(b), 'image/png'));
}

export function raporOlustur(state) {
  const s = state.sonuclar?.stats || {};
  const { paths } = state.sonuclar || { paths: [] };
  const elSatir = state.elements.map((e) =>
    `<tr><td>${e.id}</td><td>${e.tip}</td><td>${e.x.toFixed(0)}</td><td>${e.y.toFixed(0)}</td><td>${deg(e.angle || 0).toFixed(1)}°</td></tr>`
  ).join('');
  const hitler = [];
  for (const p of paths.slice(0, 40)) for (const h of p.hits) {
    hitler.push(`<tr><td>${p.id}</td><td>${h.elementId}</td><td>${h.kind}</td><td>${(h.angleIn ?? 0).toFixed(2)}°</td><td>${(h.angleOut ?? 0).toFixed(2)}°</td></tr>`);
  }
  return `<!doctype html><html lang="tr"><head><meta charset="utf-8"><title>Numex Prizma — Deney Raporu</title>
<style>body{font-family:system-ui,sans-serif;color:#111;padding:28px;max-width:900px;margin:auto}
h1{font-size:20px}h2{font-size:15px;margin-top:22px;border-bottom:1px solid #ccc;padding-bottom:4px}
table{border-collapse:collapse;width:100%;font-size:12px;margin-top:8px}
td,th{border:1px solid #ccc;padding:4px 6px;text-align:left}th{background:#f2f2f2}
.meta{font-size:12px;color:#444}</style></head><body>
<h1>NUMEX PRİZMA — Deney Raporu</h1>
<p class="meta">Deney: <b>${state.meta?.ad || '—'}</b> · Tarih: ${new Date().toLocaleString('tr-TR')} · Ortam: ${state.ortam?.ad} (n=${state.ortam?.n})</p>
<h2>Ölçüm Özeti</h2>
<table><tr><th>Kaynak ışın</th><th>Yol</th><th>Yansıma</th><th>Kırılma</th><th>TIR</th><th>Sonlanma</th></tr>
<tr><td>${s.kaynakIsin ?? 0}</td><td>${s.yolSayisi ?? 0}</td><td>${s.yansima ?? 0}</td><td>${s.kirilma ?? 0}</td><td>${s.tir ?? 0}</td><td>${s.sonlanma ?? 0}</td></tr></table>
<h2>Elemanlar</h2>
<table><tr><th>ID</th><th>Tip</th><th>x</th><th>y</th><th>Açı</th></tr>${elSatir}</table>
<h2>Etkileşimler (ilk 40)</h2>
<table><tr><th>Işın</th><th>Eleman</th><th>Tür</th><th>Gelme</th><th>Çıkış</th></tr>${hitler.join('')}</table>
<p class="meta" style="margin-top:20px">Bu rapor Numex Prizma tarafından üretildi. İnce mercek paraksiyel yaklaşımı kullanılır; sonuçlar öğretim amaçlıdır.</p>
</body></html>`;
}

export { angleOf };
