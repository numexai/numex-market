/* =====================================================================
 * app.js — OYUN DÖNGÜSÜ • KONTROLLER • FİZİK • HUD • MİNİMAP
 * Saf 2D canvas arayüz katmanı (engine.js'i kullanır).
 * ===================================================================== */
'use strict';

/* ---------- Canvas bağlantıları ---------- */
const screenCanvas = document.getElementById('game');   // 3D görünüm
const mapCanvas    = document.getElementById('minimap'); // radar

const ctx  = screenCanvas.getContext('2d');
const mctx = mapCanvas.getContext('2d');

/* ---------- HUD elemanları ---------- */
const hudFps   = document.getElementById('hud-fps');
const hudX     = document.getElementById('hud-x');
const hudY     = document.getElementById('hud-y');
const hudAng   = document.getElementById('hud-ang');

/* ---------- Çözünürlük (retro ~640x360) ---------- */
function resize() {
  // CSS ile dolu kare; iç canvas piksel sayısını retro tutalım
  if (screenCanvas.width !== 640) screenCanvas.width = 640;
  if (screenCanvas.height !== 360) screenCanvas.height = 360;
  // CSS ölçeği: genişlikte taşmasın
  const cssW = Math.min(window.innerWidth - 24, 900);
  const cssH = cssW * (360 / 640);
  screenCanvas.style.width = cssW + 'px';
  screenCanvas.style.height = cssH + 'px';
}
resize();
window.addEventListener('resize', resize);

/* ---------- Yer kaplama (collider) ---------- */
const WALL = {
  isWall(x, y) {
    const ix = Math.floor(x), iy = Math.floor(y);
    if (ix < 0 || iy < 0 || ix >= GRID || iy >= GRID) return true; // kapalı alan
    return MAP[iy][ix] !== 0;
  },
  /* Yarıçap radius'lı (oyuncu gövdesi) çarpışma testi */
  canMove(nx, ny, radius) {
    // Köşeleri test et
    return !(this.isWall(nx - radius, ny - radius) ||
             this.isWall(nx + radius, ny - radius) ||
             this.isWall(nx - radius, ny + radius) ||
             this.isWall(nx + radius, ny + radius));
  }
};
const PLAYER_R = 0.22; // hücre birimi cinsinden oyuncu gövde yarıçapı

/* ---------- Tuş durumu ---------- */
const keys = {};
const MOVE_SPEED  = 3.2;  // saniyede hücre
const TURN_SPEED  = 2.6;  // radyan/saniye

document.addEventListener('keydown', (e) => { keys[e.code] = true; });
document.addEventListener('keyup',   (e) => { keys[e.code] = false; });

/* ---------- Fizik + giriş (her kare) ---------- */
function update(player_, dt) {
  // Dönüş: sola/sağa (A / D veya ok tuşları)
  let turn = 0;
  if (keys['KeyA'] || keys['ArrowLeft'])  turn -= 1;
  if (keys['KeyD'] || keys['ArrowRight']) turn += 1;
  player_.angle += turn * TURN_SPEED * dt;

  // İleri / geri
  let move = 0;
  if (keys['KeyW'] || keys['ArrowUp'])    move += 1;
  if (keys['KeyS'] || keys['ArrowDown'])  move -= 1;

  if (move !== 0) {
    const step = move * MOVE_SPEED * dt;
    const nx = player_.x + dirX(player_.angle) * step;
    const ny = player_.y + dirY(player_.angle) * step;

    // Eksen bağımsız çarpışma (duvarlara sürtünerek kayma)
    if (WALL.canMove(nx, player_.y, PLAYER_R)) player_.x = nx;
    if (WALL.canMove(player_.x, ny, PLAYER_R)) player_.y = ny;
  }

  // Açı periyodik tut (0..2π)
  player_.angle = ((player_.angle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
}

/* ---------- Minimap / radar (sağ üst) ---------- */
const CELL_PX = 10;             // harita hücre başına px
function renderMinimap() {
  const mw = GRID * CELL_PX;
  const mh = GRID * CELL_PX;
  mapCanvas.width = mw;
  mapCanvas.height = mh;
  mctx.clearRect(0, 0, mw, mh);

  // Duvarları çiz
  for (let yy = 0; yy < GRID; yy++) {
    for (let xx = 0; xx < GRID; xx++) {
      const tile = MAP[yy][xx];
      if (tile === 0) continue;
      const pal = WALL_PALETTE[tile] || WALL_PALETTE[1];
      mctx.fillStyle = pal.base;
      mctx.fillRect(xx * CELL_PX + 1, yy * CELL_PX + 1, CELL_PX - 2, CELL_PX - 2);
    }
  }

  // Sprite dekor objeleri (minimap: küçük beyaz nokta)
  if (typeof SPRITES !== 'undefined') {
    mctx.fillStyle = '#ffffff';
    for (const sp of SPRITES) {
      mctx.fillRect(sp.x * CELL_PX - 1, sp.y * CELL_PX - 1, 2, 2);
    }
  }


  // Işın konisi (oyuncu görüşü): FOV kadar saçılan ışınlar
  mctx.strokeStyle = 'rgba(255,220,80,0.75)';
  mctx.lineWidth = 1;
  const coneSteps = 24;
  for (let i = 0; i <= coneSteps; i++) {
    const a = player.angle - FOV / 2 + (i / coneSteps) * FOV;
    // duvara kadar çek (basit + ince DDA render'ı tekrar dene, görsel için yeterli)
    const hit = castRay(player.x, player.y, a, 14);
    const ex = player.x + dirX(a) * hit.dist;
    const ey = player.y + dirY(a) * hit.dist;
    mctx.beginPath();
    mctx.moveTo(player.x * CELL_PX, player.y * CELL_PX);
    mctx.lineTo(ex * CELL_PX, ey * CELL_PX);
    mctx.stroke();
  }

  // Oyuncu noktası
  mctx.fillStyle = '#ffe14d';
  mctx.beginPath();
  mctx.arc(player.x * CELL_PX, player.y * CELL_PX, 3, 0, Math.PI * 2);
  mctx.fill();
  // Bakış yönü kısa çizgi
  mctx.strokeStyle = '#ffffff';
  mctx.lineWidth = 1.5;
  mctx.beginPath();
  mctx.moveTo(player.x * CELL_PX, player.y * CELL_PX);
  mctx.lineTo((player.x + dirX(player.angle) * 0.45) * CELL_PX,
              (player.y + dirY(player.angle) * 0.45) * CELL_PX);
  mctx.stroke();
}

/* ---------- HUD ---------- */
function updateHUD(fps) {
  hudFps.textContent = String(Math.round(fps));
  hudX.textContent   = player.x.toFixed(2);
  hudY.textContent   = player.y.toFixed(2);
  hudAng.textContent = ((player.angle * 180) / Math.PI).toFixed(0) + '°';
}

/* ---------- Oyun döngüsü ---------- */
let lastT = performance.now();
let frameCount = 0;
let fpsTimer = lastT;
let fpsValue = 60;

function loop(now) {
  let dt = (now - lastT) / 1000;
  lastT = now;
  if (dt > 0.05) dt = 0.05;   // sekme arka plana geçtiyse sınırla

  // FPS sayacı
  frameCount++;
  if (now - fpsTimer >= 500) {
    fpsValue = (frameCount * 1000) / (now - fpsTimer);
    frameCount = 0;
    fpsTimer = now;
  }

  update(player, dt);
  renderScene(ctx, screenCanvas.width, screenCanvas.height);
  renderMinimap();
  updateHUD(fpsValue);

  requestAnimationFrame(loop);
}

/* ---------- Başlat ---------- */
requestAnimationFrame(loop);
