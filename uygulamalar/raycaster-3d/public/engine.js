/* =====================================================================
 * engine.js — SAF 2D CANVAS RAYCASTING MOTORU (Wolfenstein 1992 klonu)
 * ---------------------------------------------------------------------
 * Three.js / Babylon.js / WebGL KULLANILMAZ.
 * Tüm "3D" görüntü, ekranın her dikey piksel sütunu için fırlatılan
 * ışınların (DDA) 2D canvas 'fillRect' boyaması ile üretilir.
 * ===================================================================== */

'use strict';

/* ---------------- HARİTA (16 x 16) ----------------
 * 0 = boş      1 = neon mavi      2 = yeşil      3 = kırmızı tuğla
 * Harita dış sınırları her zaman duvarla kaplı (labirent kapalı).     */
const MAP = [
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 3, 0, 0, 0, 1],
  [1, 0, 0, 2, 0, 0, 1, 0, 0, 0, 0, 3, 0, 0, 0, 1],
  [1, 0, 0, 2, 0, 0, 1, 0, 0, 1, 1, 3, 0, 0, 0, 1],
  [1, 0, 0, 2, 0, 0, 1, 0, 0, 1, 0, 0, 0, 2, 0, 1],
  [1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 2, 0, 1],
  [1, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 1],
  [1, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1],
  [1, 0, 2, 0, 0, 0, 0, 0, 3, 0, 0, 0, 0, 1, 0, 1],
  [1, 0, 0, 0, 1, 0, 1, 1, 3, 1, 1, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 1, 0, 0, 1, 1, 0, 1, 0, 0, 3, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 0, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
];

/* Duvar türü -> renk paleti
 * Her duvar: taban renk + yan(kenar) deskendirme vurgusu.            */
const WALL_PALETTE = {
  1: { base: '#2fd4ff', edge: '#17b8e0', dark: '#0a6b86' }, // neon mavi (VFD 'Mavi')
  2: { base: '#4ce06a', edge: '#31c24e', dark: '#167537' }, // yeşil
  3: { base: '#ff5f4d', edge: '#d63f2f', dark: '#8c1f16' }  // kırmızı tuğla tonu
};

const GRID = MAP[0].length;        // 16
const CELL = 1;                    // mantık birimi olarak hücre kenarı = 1

/* ---------------- OYUNCU ----------------
 * Isın sınıfını (NESNE) true dünyada W, S, A, D ve ok tuşlarıyla
 * döndürüp ilerletiyoruz.                                          */
const player = {
  x: 2.5,      // harita birimi cinsinden başlangıç (boş hücre 1.5 civarı)
  y: 2.5,
  angle: 0.52, // radyan cinsinden bakış (sağa)
};

/* Görüntü çözünürlüğü (retro düşük çözünürlük: dilimler görünür olur) */
const RAY_W = 4;            // her sütun genişliği (px) — düşük tut → retro
const FOV = (60 * Math.PI) / 180; // 60 derece görüş alanı

/* Zemin-tavan degrade renkleri */
const CEIL_TOP    = '#14161c'; // koyu gri-siyah
const CEIL_BOTTOM = '#22262e';
const FLOOR_TOP   = '#241f23'; // koyu füme
const FLOOR_BOTTOM= '#120f11';

/* Yön vektörü yardımcıları */
function dirX(a) { return Math.cos(a); }
function dirY(a) { return Math.sin(a); }

/* ---------------- DDA RAYCAST (tek ışın) ----------------
 * Bir sütun için en yakın duvarı DDA algoritması ile arar.
 * Dönüş: { dist (dik mesafe), side(0=N-S,1=E-W), wallTip, cell }
 * side: 0 → duvarın dikey(NS) yüzü, 1 → yatay(EW) yüzü.            */
function castRay(ox, oy, ang, maxDist) {
  const mapX = Math.floor(ox), mapY = Math.floor(oy);
  const dx = dirX(ang), dy = dirY(ang);

  // Başlangıç ışın ~ hücre kenarı mesafeleri (DDA adımları)
  let deltaDistX = Math.abs(dx) < 1e-9 ? 1e9 : Math.abs(1 / dx);
  let deltaDistY = Math.abs(dy) < 1e-9 ? 1e9 : Math.abs(1 / dy);

  let stepX, stepY, sideDistX, sideDistY;
  if (dx < 0)      { stepX = -1; sideDistX = (ox - mapX) * deltaDistX; }
  else             { stepX =  1; sideDistX = (mapX + 1 - ox) * deltaDistX; }
  if (dy < 0)      { stepY = -1; sideDistY = (oy - mapY) * deltaDistY; }
  else             { stepY =  1; sideDistY = (mapY + 1 - oy) * deltaDistY; }

  let side = 0;         // 0=NS duvarı, 1=EW duvarı
  let cellX = mapX, cellY = mapY;
  let tile = 0;
  let guard = 0;

  while (tile === 0) {
    if (sideDistX < sideDistY) {
      sideDistX += deltaDistX;
      cellX += stepX;
      side = 0;
    } else {
      sideDistY += deltaDistY;
      cellY += stepY;
      side = 1;
    }
    if (cellX < 0 || cellY < 0 || cellX >= GRID || cellY >= GRID) break;
    tile = MAP[cellY][cellX];
    if (++guard > GRID * 4) break;   // sonsuz döngü koruması
  }

  // Dik (perpendicular) mesafe — FISHEYE düzeltmesi burada uygulanır.
  let perp = side === 0
    ? (sideDistX - deltaDistX)
    : (sideDistY - deltaDistY);

  if (perp > maxDist) perp = maxDist;
  return { dist: perp, side, wallTip: tile, cellX, cellY };
}

/* ---------------- GÖRÜNTÜLEME ----------------
 * Kanvası her karede, sütun sütun DDA ışın atarak boyar.
 * Fişgözü düzeltmesi: dik mesafe alındığından duvarlar eğri değil.   */
function renderScene(ctx, w, h) {
  ctx.imageSmoothingEnabled = false;

  // ---- Tavan (dikey dilimler halinde koyu gri → siyah degrade) ----
  drawVerticalGradient(ctx, w, 0, h / 2, CEIL_TOP, CEIL_BOTTOM);

  // ---- Zemin (dikey dilimler, koyu füme degrade) ----
  drawVerticalGradient(ctx, w, h / 2, h / 2, FLOOR_TOP, FLOOR_BOTTOM);

  // ---- Duvarlar: her sütun için bir ışın ----
  const numCols = Math.floor(w / RAY_W);
  const halfH = h / 2;
  const planeLen = Math.tan(FOV / 2);   // projeksiyon düzlemi genişliği
  const zBuffer = new Float32Array(numCols).fill(32); // sprite için duvar derinliği

  for (let col = 0; col < numCols; col++) {
    // Sütunun merkez açısı: oyuncu açısı + [(col+0.5)/numCols - 0.5] * FOV
    const f = (col + 0.5) / numCols - 0.5;         // -0.5 .. +0.5
    const rayAng = player.angle + f * FOV;

    const hit = castRay(player.x, player.y, rayAng, 32);
    zBuffer[col] = hit.dist;                        // sprite z-test için kaydet

    // Dik mesafe zaten düzeltilmiş → kavisli görünüm yok.
    // Çizgi yüksekliği perspektif projeksiyonu (w genişliğinde bir
    // ölçek; canvas yüksekliğine oranla kalibreli).
    const wallH = (h * planeLen) / hit.dist;      // pixel
    const drawH = Math.min(wallH, h * 20);
    const topY  = halfH - drawH / 2;

    // Derinlik gölgelendirme: uzak mesafe → koyulaştır.
    const shade = Math.max(0.22, Math.min(1, 1.6 / (0.35 + hit.dist)));

    let clr = WALL_PALETTE[hit.wallTip] || WALL_PALETTE[1];
    let colr;
    if (hit.side === 1) colr = clr.edge;   // EW yüzü biraz koyu (kenar detayı)
    else                colr = clr.base;   // NS yüzü ana renk

    // RGB koyulaştır (z-gölgelendirme)
    const rgb = hexToRgb(colr);
    const r = Math.round(rgb.r * shade);
    const g = Math.round(rgb.g * shade);
    const b = Math.round(rgb.b * shade);
    ctx.fillStyle = `rgb(${r},${g},${b})`;

    const x = col * RAY_W;
    ctx.fillRect(x, topY, RAY_W, drawH);
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    if (col % 4 === 0) {
      ctx.fillRect(x, topY, RAY_W, 1);                 // üst kontur
      ctx.fillRect(x, topY + drawH - 1, RAY_W, 1);     // alt kontur
    }
  }

  // ---- Sprite'lar (duvar dışı dekor) ----
  renderSprites(ctx, w, h, halfH, zBuffer);
}

/* Dikey degrade dolgusu (tavan/zemin dilimleri). */
function drawVerticalGradient(ctx, w, yTop, height, topRGB, botRGB) {
  if (height <= 0) return;
  const g = ctx.createLinearGradient(0, yTop, 0, yTop + height);
  g.addColorStop(0, topRGB);
  g.addColorStop(1, botRGB);
  ctx.fillStyle = g;
  ctx.fillRect(0, yTop, w, height);
}

/* #rrggbb -> {r,g,b} */
function hexToRgb(hex) {
  const m = hex.replace('#', '');
  return {
    r: parseInt(m.substring(0, 2), 16),
    g: parseInt(m.substring(2, 4), 16),
    b: parseInt(m.substring(4, 6), 16)
  };
}

/* =====================================================================
 * SPRITE RENDER (duvar dışı dekor objeleri)
 * Harita hücre merkezlerine konur; z-buffer ile doğru sırada çizilir.
 * ---------------------------------------------------------------------
 * Her sprite: { x, y (harita birimi), color, size (birim, ~0.35) }
 * ===================================================================== */
const SPRITES = [
  { x: 7.5,  y: 3.2, color: '#ffd23c', size: 0.30 }, // sarı kristal
  { x: 12.2, y: 5.4, color: '#ff7ac8', size: 0.30 }, // pembe kristal
  { x: 3.4,  y: 12.6,color: '#9be14d', size: 0.34 }, // yeşil küp (koza)
  { x: 10.4, y: 11.1,color: '#7fd7ff', size: 0.30 }, // buz kristali
];

/* Sprite'ları perspektife göre (en uzaktan en yakına) projekte edip
 * z-buffer (duvar derinliği) karşılaştırmasıyla çizer.
 * - Kamera düzlemi: FOV genişliğindeki sanal projeksiyon.
 * - Her sprite duvarın ARKASINDA kalırsa görünmez → gerçekçi.     */
function renderSprites(ctx, w, h, halfH, zBuffer) {
  const numCols = zBuffer.length;
  const px = player.x, py = player.y, pa = player.angle;

  // Uzaklığa göre sırala (en uzak önce çizilir)
  const ordered = SPRITES
    .map((s) => ({ s, d: Math.hypot(s.x - px, s.y - py) }))
    .sort((a, b) => b.d - a.d);

  for (const { s, d } of ordered) {
    // Oyuncuya göre vektör ve açı
    const rx = s.x - px, ry = s.y - py;
    let relAng = Math.atan2(ry, rx) - pa;
    // radyan normalize: -π..π
    while (relAng > Math.PI) relAng -= Math.PI * 2;
    while (relAng < -Math.PI) relAng += Math.PI * 2;

    // FOV dışına taşan sprite'ı atla
    if (Math.abs(relAng) > FOV / 2 + 0.12) continue;

    // Nokta sprite'ın ekran-X'i: [-1..1] haritasına çevir
    const xN = Math.tan(relAng) / Math.tan(FOV / 2);   // -1..1
    const screenX = (xN * 0.5 + 0.5) * w;
    const col = Math.round(screenX / RAY_W);
    if (col < 0 || col >= numCols) continue;
    // z-test: sprite duvardan UZAKTAYSA (d > wallDist) çizme
    const wallDist = zBuffer[col];
    if (d > wallDist) continue;

    // Perspektif boyut (dikleştirilmiş mesafe kullan)
    const inv = 1 / Math.max(0.1, d * Math.cos(relAng));
    const scale = h * Math.tan(FOV / 2) * inv;  // sprite yüksekliği = scale piksel
    const pxH = Math.round(s.size * scale * 2);
    if (pxH < 2) continue;

    const pxW = pxH; // kare sprite
    const top = halfH - pxH * 0.95;             // yere oturur gibi
    const left = screenX - pxW / 2;

    // uzaklık gölgelendirme (duvarlarla uyumlu)
    const shade = Math.max(0.3, Math.min(1, 1.6 / (0.4 + d)));
    const rgb = hexToRgb(s.color);
    ctx.fillStyle = `rgb(${Math.round(rgb.r * shade)},${Math.round(rgb.g * shade)},${Math.round(rgb.b * shade)})`;
    ctx.fillRect(left, top, pxW, pxH);

    // Geniş yüzeye parlak çekirdek (retro kristal hissi)
    const inner = Math.round(pxW * 0.45);
    ctx.fillStyle = `rgba(255,255,255,${0.35 * shade})`;
    ctx.fillRect(left + (pxW - inner) / 2, top + (pxH - inner) / 2, inner, inner);
  }
}
