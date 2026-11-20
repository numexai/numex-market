// İzometrik liman sahnesi — tüm konumlar veri modelinden okunur.
import { SCENE, TYPES, STATUS, HEAVY_TON } from '../config.js';
import { lerp, clamp, fmtPct } from '../util.js';
import { zoneFill, zoneUsed } from '../model/yard.js';
import { transportVisual } from '../engine/sim.js';

const W = SCENE.tileW;
const H = SCENE.tileH;

export function initScene(canvas, world) {
  const ctx = { canvas, world, dpr: window.devicePixelRatio || 1, w: 0, h: 0, ox: 0, oy: 0, anim: 0 };
  resize(ctx);
  return ctx;
}

export function resize(ctx) {
  const parent = ctx.canvas.parentElement;
  const w = parent ? parent.clientWidth : 960;
  const h = Math.max(420, Math.round(w * 0.58));
  ctx.dpr = window.devicePixelRatio || 1;
  ctx.canvas.width = Math.round(w * ctx.dpr);
  ctx.canvas.height = Math.round(h * ctx.dpr);
  ctx.canvas.style.width = w + 'px';
  ctx.canvas.style.height = h + 'px';
  ctx.w = w;
  ctx.h = h;
  const gw = 20; // dünya genişliği (tile)
  const gh = 12;
  const sceneW = (gw + gh) * (W / 2);
  const sceneH = (gw + gh) * (H / 2);
  const scale = Math.min((w - 40) / sceneW, (h - 60) / sceneH);
  ctx.ox = w / 2;
  ctx.oy = h * 0.5 - sceneH * 0.5 * scale + 40 * scale;
  ctx.scale = clamp(scale, 0.35, 1.6);
}

// İzometrik dönüşüm: dünya (x,y,z) → ekran
export function worldToScreen(ctx, x, y, z = 0) {
  const s = ctx.scale;
  const sx = ctx.ox + (x - y) * (W / 2) * s;
  const sy = ctx.oy + (x + y) * (H / 2) * s - z * H * 0.9 * s;
  return { sx, sy };
}

export function lerp2(a, b, t) {
  return { x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t) };
}

// NUMEX-DÜZELTME (2026-11-20): pts.forEach is not a function: isoPoly çağrılarında ikinci argüman ctx nesnesi, üçüncü argüman nokta dizisi — imza buna göre sabitlendi.
// NUMEX-DÜZELTME (2026-11-20): Çağrılar isoPoly(c, ctx, pts, fill, stroke) biçiminde;
// gövde de bu imzaya hizalandı (daha önce pts yerine ctx nesnesi geliyordu → "pts.forEach is not a function").
function isoPoly(c, ctx, pts, fill, stroke) {
  const s0 = ctx;
  c.beginPath();
  pts.forEach((p, i) => {
    const s = worldToScreen(s0, p.x, p.y, p.z || 0);
    if (i === 0) c.moveTo(s.sx, s.sy);
    else c.lineTo(s.sx, s.sy);
  });
  c.closePath();
  if (fill) {
    c.fillStyle = fill;
    c.fill();
  }
  if (stroke) {
    c.strokeStyle = stroke;
    c.lineWidth = 1;
    c.stroke();
  }
}

// Kutu çizimi (izometrik prizma). NUMEX-DÜZELTME (2026-11-20):
// Gövde hem c (canvas context) hem ctx (sahne bağlamı: scale vb.) gerektiriyor;
// ikisi de parametre olarak alınıyor, dış kapsamdaki cc adı çakışması kaldırıldı.
// NUMEX-DÜZELTME (2026-11-20): Betik düzeltmesi tanım satırını da yakalayıp 'ctx' parametresini iki kez yazmıştı; sözdizimi geçersizdi.
function isoBox(c, ctx, x, y, z, w, d, hgt, color, topColor) {
  const p = (dx, dy, dz) => worldToScreen(ctx, x + dx, y + dy, z + dz);
  const A = p(0, 0, hgt),
    B = p(w, 0, hgt),
    C = p(w, d, hgt),
    D = p(0, d, hgt);
  const B2 = p(w, 0, 0),
    C2 = p(w, d, 0),
    D2 = p(0, d, 0);
  // sol yüz
  c.beginPath();
  c.moveTo(D.sx, D.sy);
  c.lineTo(C.sx, C.sy);
  c.lineTo(C2.sx, C2.sy);
  c.lineTo(D2.sx, D2.sy);
  c.closePath();
  c.fillStyle = shade(color, -28);
  c.fill();
  // sağ yüz
  c.beginPath();
  c.moveTo(C.sx, C.sy);
  c.lineTo(B.sx, B.sy);
  c.lineTo(B2.sx, B2.sy);
  c.lineTo(C2.sx, C2.sy);
  c.closePath();
  c.fillStyle = shade(color, -12);
  c.fill();
  // üst yüz
  c.beginPath();
  c.moveTo(A.sx, A.sy);
  c.lineTo(B.sx, B.sy);
  c.lineTo(C.sx, C.sy);
  c.lineTo(D.sx, D.sy);
  c.closePath();
  c.fillStyle = topColor || shade(color, 18);
  c.fill();
  c.strokeStyle = 'rgba(4,16,26,.55)';
  c.lineWidth = 0.8;
  c.stroke();
}

function shade(hex, amt) {
  const c = hex.replace('#', '');
  const r = clamp(parseInt(c.substring(0, 2), 16) + amt, 0, 255);
  const g = clamp(parseInt(c.substring(2, 4), 16) + amt, 0, 255);
  const b = clamp(parseInt(c.substring(4, 6), 16) + amt, 0, 255);
  return `rgb(${r},${g},${b})`;
}

export function stacksOf(zone) {
  // Konumun tek kaynağı: zone.slots. Kızaklar gerçek yerleşimden türetilir.
  const byStack = new Map();
  zone.slots.forEach((s) => {
    if (!byStack.has(s.stack)) byStack.set(s.stack, []);
    byStack.get(s.stack).push(s);
  });
  const out = [];
  byStack.forEach((items, stack) => {
    out.push({ stack, items });
  });
  return out.sort((a, b) => a.stack - b.stack);
}

export function draw(ctx, world) {
  const c = ctx.canvas.getContext('2d');
  c.setTransform(ctx.dpr, 0, 0, ctx.dpr, 0, 0);
  c.clearRect(0, 0, ctx.w, ctx.h);
  ctx.anim += 0.016;

  drawSea(c, ctx);
  drawQuay(c, ctx, world);
  drawZones(c, ctx, world);
  drawShip(c, ctx, world);
  drawContainers(c, ctx, world);
  for (const crane of world.cranes) drawGantry(c, ctx, crane, world);
  for (const t of world.transports) drawTransport(c, ctx, t, world);
  drawHUD(c, ctx, world);
}

function drawSea(c, ctx) {
  const g = c.createLinearGradient(0, 0, 0, ctx.h);
  g.addColorStop(0, '#061826');
  g.addColorStop(0.45, '#082a3f');
  g.addColorStop(0.75, '#0b1f2c');
  g.addColorStop(1, '#07131c');
  c.fillStyle = g;
  c.fillRect(0, 0, ctx.w, ctx.h);

  // dalga çizgileri (hafif, veri değil zemin dokusu)
  c.strokeStyle = 'rgba(90,170,210,.10)';
  c.lineWidth = 1;
  for (let i = 0; i < 16; i++) {
    const y = 20 + i * 22;
    c.beginPath();
    for (let x = 0; x <= ctx.w; x += 24) {
      const yy = y + Math.sin((x / 60) + ctx.anim * 0.6 + i) * 3;
      if (x === 0) c.moveTo(x, yy);
      else c.lineTo(x, yy);
    }
    c.stroke();
  }
}

function drawQuay(ctx2, ctx, world) {
  const c = ctx2;
  // rıhtım zemini (0..20 x -1..1)
  isoPoly(
    c,
    // NUMEX-DÜZELTME (2026-11-20): drawQuay'deki isoPoly çağrısında ikinci argüman (ctx) eksikti; nokta dizisi pts yerine 2. parametreye düşüyor ve 'pts.forEach is not a function' atıyordu.
    ctx,
    [
      { x: -3, y: -1.2 },
      { x: 21, y: -1.2 },
      { x: 21, y: 1.6 },
      { x: -3, y: 1.6 },
    ],
    '#1b2b36',
    'rgba(120,190,220,.25)'
  );
  // liman ışıkları
  for (let i = 0; i < 9; i++) {
    const s = worldToScreen(ctx, -2 + i * 3, 1.4, 0);
    const r = 22 * ctx.scale;
    const rg = c.createRadialGradient(s.sx, s.sy, 0, s.sx, s.sy, r);
    rg.addColorStop(0, 'rgba(255,196,110,.30)');
    rg.addColorStop(1, 'rgba(255,196,110,0)');
    c.fillStyle = rg;
    c.beginPath();
    c.arc(s.sx, s.sy, r, 0, Math.PI * 2);
    c.fill();
  }
  void world;
}

function drawZones(ctx2, ctx, world) {
  const c = ctx2;
  // NUMEX-DÜZELTME (2026-11-20): bu fonksiyonda canvas context'i 'c' sanılıyordu; gerçek context dışarıdan geliyor.
  for (const z of world.zones) {
    const fill = zoneFill(z);
    const baseColor = fill > 0.95 ? '#4a2320' : fill > 0.7 ? '#3d3420' : '#1d2f3a';
    isoPoly(c, ctx,
      [
        { x: z.gx - 2.2, y: z.gy - 1.5 },
        { x: z.gx + 2.2, y: z.gy - 1.5 },
        { x: z.gx + 2.2, y: z.gy + 2.6 },
        { x: z.gx - 2.2, y: z.gy + 2.6 },
      ],
      baseColor,
      'rgba(120,190,220,.22)'
    );
    // etiket
    const p = worldToScreen(ctx, z.gx - 2, z.gy + 2.5, 0);
    c.font = `${Math.round(11 * ctx.scale)}px 'Segoe UI', system-ui, sans-serif`;
    c.fillStyle = 'rgba(200,230,245,.85)';
    c.textAlign = 'left';
    c.fillText(`${z.id} · ${zoneUsed(z)}/${z.capacity} · ${fmtPct(fill)}`, p.sx - 6 * ctx.scale, p.sy + 14 * ctx.scale);
  }
}

// NUMEX-DÜZELTME (2026-11-20): drawShip'in parametre adı 'c' (canvas context) idi ama gövdesinde ctx.beginPath çağrılıyordu; parametreleri draw(ctx2, ctx, world) yapıp c=ctx2 atandı.
export function drawShip(ctx2, ctx, world) {
  const c = ctx2;
  // NUMEX-DÜZELTME (2026-11-20): Gemide bekleyen konteynerler 'waiting' durumuna geçtiği için gemi boş görünüyordu; iki durum birlikte çiziliyor.
  // Gemidekiler: henüz taşınmamış (ship) + yer/vinç bekleyen (waiting) konteynerler
  const onShip = world.containers.filter((k) => k.status === 'ship' || k.status === 'waiting');
  const bx = 3.2,
    by = -3.4,
    bw = 9,
    bd = 2.2;
  // gövde
  isoBox(c, ctx, bx, by, 0.15, bw, bd, 0.55, '#22323f', '#2b4050');
  // üst güverte
  isoPoly(
    c,
    ctx,
    [
      { x: bx + 0.3, y: by + 0.25, z: 0.72 },
      { x: bx + bw - 0.3, y: by + 0.25, z: 0.72 },
      { x: bx + bw - 0.3, y: by + bd - 0.25, z: 0.72 },
      { x: bx + 0.3, y: by + bd - 0.25, z: 0.72 },
    ],
    '#31485a',
    'rgba(150,200,225,.25)'
  );
  // köprü (bridge)
  isoBox(c, ctx, bx + bw - 1.5, by + 0.5, 0.72, 1.1, 1.2, 1.5, '#3b4f5e', '#4a6273');
  // köprü pencereleri — gece liman ışığı
  const wp = worldToScreen(ctx, bx + bw - 1.35, by + 1.6, 2.1);
  c.fillStyle = 'rgba(255,205,120,.85)';
  c.fillRect(wp.sx - 6 * ctx.scale, wp.sy - 2 * ctx.scale, 12 * ctx.scale, 3 * ctx.scale);

  // gemideki konteynerler — modelden konum türetilir (sıra + kat)
  onShip.forEach((k, i) => {
    const col = i % 14;
    const row = Math.floor(i / 14) % 3;
    const lvl = Math.floor(i / 42);
    const x = bx + 0.55 + col * 0.62;
    const y = by + 0.5 + row * 0.55;
    const z = 0.78 + lvl * 0.62;
    const color = TYPES[k.type].color;
    isoBox(c, ctx, x, y, z, k.size === 40 ? 0.6 : 0.42, 0.5, 0.55, color);
    // seçim vurgusu
    if (ctx.selected === k.id) {
      const p = worldToScreen(ctx, x, y, z + 0.7);
      c.strokeStyle = '#ffd580';
      c.lineWidth = 2;
      c.beginPath();
      c.arc(p.sx, p.sy, 12 * ctx.scale, 0, Math.PI * 2);
      c.stroke();
    }
  });
  // gemi etiketi
  const lp = worldToScreen(ctx, bx + 2, by + bd + 0.4, 0);
  c.font = `600 ${Math.round(12 * ctx.scale)}px 'Segoe UI', system-ui, sans-serif`;
  c.fillStyle = 'rgba(140,200,230,.9)';
  c.textAlign = 'left';
  c.fillText(`MV NUMEX LİMAN · gemide ${onShip.length}`, lp.sx, lp.sy + 16 * ctx.scale);
}

function drawContainers(c, ctx, world) {
  for (const z of world.zones) {
    for (const stack of stacksOf(z)) {
      stack.items.forEach((item) => {
        const k = world.containers.find((x) => x.id === item.containerId);
        if (!k) return;
        const color = TYPES[k.type].color;
        const x = z.gx - 1.6 + (stack.stack % 4) * 0.85;
        const y = z.gy - 1.2 + Math.floor(stack.stack / 4) * 0.85;
        const zPos = 0.15 + item.stack * 0.58;
        isoBox(c, ctx, x, y, zPos, k.size === 40 ? 0.8 : 0.58, 0.5, 0.5, color);
        if (ctx.selected === k.id) {
          const p = worldToScreen(ctx, x, y, zPos + 0.6);
          c.strokeStyle = '#ffd580';
          c.lineWidth = 2;
          c.beginPath();
          c.arc(p.sx, p.sy, 12 * ctx.scale, 0, Math.PI * 2);
          c.stroke();
        }
      });
    }
  }
  // taşınan konteynerler (araç üstünde) — konum gerçek pos'tan
  for (const k of world.containers) {
    if (k.status !== 'moving') continue;
    const color = TYPES[k.type].color;
    isoBox(c, ctx, k.pos.x - 0.25, k.pos.y - 0.2, k.pos.z, 0.55, 0.45, 0.45, color);
  }
}

export function drawGantry(c, ctx, crane, world) {
  const x = crane.gx;
  const y = crane.gy;
  const on = crane.on;
  const col = on ? (crane.status === 'working' ? '#e8b04b' : '#7fa8bf') : '#5a3a3a';
  // bacaklar
  isoBox(c, ctx, x, y, 0, 0.35, 0.35, 3.4, col);
  isoBox(c, ctx, x + 1.9, y, 0, 0.35, 0.35, 3.4, col);
  // kiriş
  isoBox(c, ctx, x, y, 3.4, 2.3, 0.35, 0.22, col);
  // taşıyıcı (progress ile hareket)
  const job = world.jobs.find((j) => j.id === crane.jobId);
  const prog = job ? job.pCrane : 0;
  const gx = x + 0.3 + prog * 1.6;
  isoBox(c, ctx, gx, y, 2.2, 0.4, 0.4, 1.15, on ? '#f0c85e' : '#6b5555');
  // halat
  const top = worldToScreen(ctx, gx + 0.2, y + 0.2, 3.5);
  const bot = worldToScreen(ctx, gx + 0.2, y + 0.2, job ? 1.6 + prog * 0.6 : 2.2);
  c.strokeStyle = on ? 'rgba(255,220,150,.7)' : 'rgba(150,120,120,.5)';
  c.lineWidth = 1.4;
  c.beginPath();
  c.moveTo(top.sx, top.sy);
  c.lineTo(bot.sx, bot.sy);
  c.stroke();
  // etiket
  const p = worldToScreen(ctx, x, y + 0.6, 4.1);
  c.font = `${Math.round(10 * ctx.scale)}px 'Segoe UI', system-ui, sans-serif`;
  c.fillStyle = on ? 'rgba(240,225,190,.95)' : 'rgba(220,150,150,.95)';
  c.textAlign = 'center';
  c.fillText(`${crane.id} · ${crane.capTon}t${on ? '' : ' ⛔'}`, p.sx, p.sy);
}

export function drawTransport(c, ctx, t, world) {
  const v = transportVisual(t);
  const busy = !!t.jobId;
  const col = busy ? '#4f9c74' : '#3a5a6b';
  isoBox(c, ctx, v.x - 0.3, v.y - 0.25, 0.05, 0.75, 0.55, 0.22, col);
  const p = worldToScreen(ctx, v.x - 0.3, v.y + 0.4, 0);
  c.font = `${Math.round(9 * ctx.scale)}px 'Segoe UI', system-ui, sans-serif`;
  c.fillStyle = 'rgba(190,220,235,.8)';
  c.textAlign = 'left';
  c.fillText(t.id, p.sx, p.sy);
  void world;
}

function drawHUD(c, ctx, world) {
  c.textAlign = 'left';
  c.font = `600 ${Math.round(12 * ctx.scale)}px 'Segoe UI', system-ui, sans-serif`;
  c.fillStyle = 'rgba(150,205,235,.75)';
  c.fillText(`SENARYO ${world.scenario} · t=${Math.round(world.clock)}s · hız ${world.speed}×`, 16, 24);
  if (!world.running) {
    c.fillStyle = 'rgba(255,210,130,.9)';
    c.fillText('⏸ DURDURULDU', 16, 44);
  }
  // seçim bilgisi
  if (ctx.selected) {
    const k = world.containers.find((x) => x.id === ctx.selected);
    if (k) {
      c.fillStyle = 'rgba(255,215,140,.95)';
      c.textAlign = 'right';
      c.fillText(`${k.id} · ${k.weight}t · ${STATUS[k.status].label}`, ctx.w - 16, 24);
    }
  }
  void HEAVY_TON;
}

// Tıklama → konteyner id? (ekran uzayında en yakın kutu)
export function pickAt(ctx, mx, my) {
  const world = ctx.world;
  let best = null;
  let bestD = 18 * ctx.scale;
  const consider = (k, x, y, z) => {
    const p = worldToScreen(ctx, x, y, z);
    const d = Math.hypot(p.sx - mx, p.sy - my);
    if (d < bestD) {
      bestD = d;
      best = k.id;
    }
  };
  for (const z of world.zones) {
    for (const stack of stacksOf(z)) {
      stack.items.forEach((item) => {
        const k = world.containers.find((x) => x.id === item.containerId);
        if (!k) return;
        const x = z.gx - 1.6 + (stack.stack % 4) * 0.85;
        const y = z.gy - 1.2 + Math.floor(stack.stack / 4) * 0.85;
        const zPos = 0.15 + item.stack * 0.58;
        consider(k, x + 0.2, y + 0.2, zPos + 0.3);
      });
    }
  }
  for (const k of world.containers) {
    if (k.status === 'moving') consider(k, k.pos.x, k.pos.y, k.pos.z + 0.2);
  }
  const onShip = world.containers.filter((k) => k.status === 'ship');
  onShip.forEach((k, i) => {
    const col = i % 14;
    const row = Math.floor(i / 14) % 3;
    const lvl = Math.floor(i / 42);
    consider(k, 3.2 + 0.55 + col * 0.62 + 0.2, -3.4 + 0.5 + row * 0.55 + 0.2, 0.78 + lvl * 0.62 + 0.28);
  });
  return best;
}

export function lerpAnim(a, b, t) {
  return lerp(a, b, t);
}
