/* ═══════════════════════════════════════════════
   Pathfinder AI — A* Görsel Labirent Çözücü
   Grid: 25x25 | Duvar çizme, start/goal sürükleme,
   açık mavi ziyaret animasyonu, sarı en-kısa-yol
   ve "Yol Bulunamadı" kırmızı neon tostu.
   ═══════════════════════════════════════════════ */

const SIZE = 25;

// ─── Grid State ───
let grid = [];          // 2D: 0 = boş, 1 = duvar
let startPos = { r: 0, c: 2 };
let goalPos = { r: SIZE - 1, c: SIZE - 2 };
let cells = [];         // DOM referansları (2D)

// ─── Animasyon State ───
let animRunning = false;
let animTimer = null;
let animSpeed = 6;      // hücre / kare
let visitedQueue = [];  // ziyaret edilecek hücreler sırası
let currentQueue = [];
let pathCells = [];
let stateLocked = false; // animasyon sırasında grid kilitli

// ─── DOM ───
const gridEl = document.getElementById('grid');
const statsVisited = document.getElementById('visited-count');
const statsPath = document.getElementById('path-length');
const toast = document.getElementById('toast');
const btnBul = document.getElementById('btn-bul');
const btnSifirla = document.getElementById('btn-sifirla');
const btnTemizle = document.getElementById('btn-temizle');
const speedSlider = document.getElementById('speed');
const speedValue = document.getElementById('speed-value');

// ─── Grid Oluştur ───
function initGrid() {
  gridEl.innerHTML = '';
  grid = [];
  cells = [];
  for (let r = 0; r < SIZE; r++) {
    grid[r] = [];
    cells[r] = [];
    for (let c = 0; c < SIZE; c++) {
      grid[r][c] = 0;
      const cell = document.createElement('div');
      cell.className = 'cell';
      cell.dataset.r = r;
      cell.dataset.c = c;
      gridEl.appendChild(cell);
      cells[r][c] = cell;
    }
  }
  placeAgent(startPos, 'start');
  placeAgent(goalPos, 'goal');
  bindGridEvents();
}

function placeAgent(pos, type) {
  // Diğer agenti temizle
  document.querySelectorAll('.cell.start').forEach(x => x.classList.remove('start', 'dragging'));
  document.querySelectorAll('.cell.goal').forEach(x => x.classList.remove('goal', 'dragging'));
  const cell = cells[pos.r] ? cells[pos.r][pos.c] : undefined;
  if (!cell) return;
  cell.classList.add(type);
  if (type === 'start') startPos = { ...pos };
  else goalPos = { ...pos };
}

// ─── Hücre sınıfını temizle (renkleri) ───
function clearVisuals() {
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      cells[r][c].classList.remove('visited', 'current', 'path', 'wall', 'start', 'goal');
    }
  }
  placeAgent(startPos, 'start');
  placeAgent(goalPos, 'goal');
  statsPath.textContent = 'Yol: —';
}

function removeVisualsOnly() {
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      cells[r][c].classList.remove('visited', 'current', 'path');
    }
  }
}

// ─── Surükleyerek Duvar Çizme + Start/Goal Taşıma ───
function bindGridEvents() {
  let isMouseDown = false;
  let paintMode = 'wall';   // wall paint
  let draggingAgent = null; // 'start' | 'goal'
  let lastPainted = null;

  gridEl.addEventListener('pointerdown', (e) => {
    if (stateLocked) return;
    const cell = e.target.closest('.cell');
    if (!cell) return;
    isMouseDown = true;

    if (cell.classList.contains('start')) {
      draggingAgent = 'start';
      cell.classList.add('dragging');
      return;
    }
    if (cell.classList.contains('goal')) {
      draggingAgent = 'goal';
      cell.classList.add('dragging');
      return;
    }

    e.preventDefault();
    const r = +cell.dataset.r, c = +cell.dataset.c;
    // duvarı çiz ya da sil
    const isWall = cell.classList.contains('wall');
    paintSet(cell, r, c, isWall);
    lastPainted = cell.dataset.r + ',' + cell.dataset.c;
  });

  gridEl.addEventListener('pointermove', (e) => {
    if (!isMouseDown) return;
    if (stateLocked) return;
    const cell = e.target.closest('.cell');
    if (!cell) return;

    // Start/Goal sürükleniyor → konumunu ara
    if (draggingAgent) {
      const r = +cell.dataset.r, c = +cell.dataset.c;
      // hedef hücre duvar SAKIZMAZ; start/goal kendi yeriyse dokunma
      if (cell.classList.contains('wall')) {
        // duvar üzerine bırakmaya çalışma: duvarı çıkarıp agenti koy
        cell.classList.remove('wall');
        grid[r][c] = 0;
      }
      // kendi agent'inin yeri değişir
      if (draggingAgent === 'start' && (r !== startPos.r || c !== startPos.c)) {
        removeClassAt(startPos, 'start');
        startPos = { r, c };
        cell.classList.add('start');
      } else if (draggingAgent === 'goal' && (r !== goalPos.r || c !== goalPos.c)) {
        removeClassAt(goalPos, 'goal');
        goalPos = { r, c };
        cell.classList.add('goal');
      }
      return;
    }

    // Duvar boyama / silme (dedup: aynı hücreye sürekli tetiklenmesin)
    const key = cell.dataset.r + ',' + cell.dataset.c;
    if (key === lastPainted) return;
    lastPainted = key;

    // Agent hücresinin üzerinden boyamayı engelle
    if (cell.classList.contains('start') || cell.classList.contains('goal')) return;

    const r = +cell.dataset.r, c = +cell.dataset.c;
    const isWallNow = cell.classList.contains('wall');
    paintSet(cell, r, c, isWallNow);
  });

  // Mouse kaldırma (dokunma dahil)
  window.addEventListener('pointerup', () => {
    isMouseDown = false;
    draggingAgent = null;
    document.querySelectorAll('.cell.dragging').forEach(x => x.classList.remove('dragging'));
  });

  // Sürükleme başlarken global varsayılanı engelle
  gridEl.addEventListener('dragstart', (e) => e.preventDefault());
}

function removeClassAt(pos, cls) {
  const c = cells[pos.r] ? cells[pos.r][pos.c] : undefined;
  if (c) c.classList.remove(cls);
}

function paintSet(cell, r, c, erase) {
  const isAgentCell = cell.classList.contains('start') || cell.classList.contains('goal');
  if (isAgentCell) return;

  if (erase) {
    cell.classList.remove('wall');
    grid[r][c] = 0;
  } else {
    cell.classList.add('wall');
    grid[r][c] = 1;
  }
}

// ─── A* Algoritması (iteratif, yolu + ziyaret sırasını döndürür) ───
function astar() {
  // Ön koşul: start/goal koordinatları
  const sr = startPos.r, sc = startPos.c;
  const gr = goalPos.r, gc = goalPos.c;

  // Start veya goal duvar üzerindeyse → anında "yol yok"
  if (grid[sr][sc] === 1 || grid[gr][gc] === 1) return { found: false, visitedSeq: [] };

  // open, closed, g, f, came-from
  const open = new Map();   // "r,c" → f
  const closed = new Set();
  const g = new Map();
  const f = new Map();
  const came = new Map();

  const key = (r, c) => r + ',' + c;
  const h = (r, c) => Math.abs(r - gr) + Math.abs(c - gc); // Manhattan

  const sk = key(sr, sc);
  g.set(sk, 0);
  f.set(sk, h(sr, sc));
  open.set(sk, f.get(sk));

  const visitedSeq = [];
  const dirs = [[1,0],[-1,0],[0,1],[0,-1]];

  while (open.size > 0) {
    // En küçük f'li düğümü seç
    let bestK = null, bestF = Infinity;
    for (const [k, val] of open) {
      if (val < bestF) { bestF = val; bestK = k; }
    }

    const [cr, cc] = bestK.split(',').map(Number);
    open.delete(bestK);
    closed.add(bestK);
    visitedSeq.push({ r: cr, c: cc });

    if (cr === gr && cc === gc) {
      // Yolu geri izle
      const path = [];
      let cur = bestK;
      while (cur !== undefined) {
        const [pr, pc] = cur.split(',').map(Number);
        path.push({ r: pr, c: pc });
        cur = came.get(cur);
      }
      path.reverse();
      return { found: true, visitedSeq, path };
    }

    for (const [dr, dc] of dirs) {
      const nr = cr + dr, nc = cc + dc;
      if (nr < 0 || nc < 0 || nr >= SIZE || nc >= SIZE) continue;
      if (grid[nr][nc] === 1) continue; // duvar
      const nk = key(nr, nc);
      if (closed.has(nk)) continue;

      const tentativeG = g.get(bestK) + 1;
      if (!open.has(nk) || tentativeG < (g.get(nk) ?? Infinity)) {
        came.set(nk, bestK);
        g.set(nk, tentativeG);
        const nf = tentativeG + h(nr, nc);
        f.set(nk, nf);
        open.set(nk, nf);
      }
    }
  }

  return { found: false, visitedSeq };
}

// ─── Animasyon Motoru ───
function startFind() {
  if (stateLocked) return;

  // Önceki animasyonu temizle
  stopAnim();
  removeVisualsOnly();
  hideToast();

  const result = astar();

  if (!result.found) {
    // Yol yok → kırmızı neon tost; grid kilidi açık kalsın
    statsVisited.textContent = 'Ziyaret: 0';
    statsPath.textContent = 'Yol: —';
    showToast();
    return;
  }

  // Bulundu — animasyon kuyruklarını kur
  visitedQueue = result.visitedSeq;
  pathCells = result.path || [];
  currentQueue = [];
  animRunning = true;

  const vCountEl = document.getElementById('visited-count');
  let idx = 0;
  const totalVisited = visitedQueue.length;
  const finalPath = result.path;

  animTimer = setInterval(() => {
    if (!animRunning) { clearInterval(animTimer); return; }
    // Ziyaret edilenleri kademeli mavi yap
    for (let step = 0; step < animSpeed && idx < totalVisited; step++, idx++) {
      const { r, c } = visitedQueue[idx];
      // start/goal/path hücrelerini ezme
      if (finalPath && finalPath.some(p => p.r === r && p.c === c)) continue;
      if (cells[r][c].classList.contains('start') || cells[r][c].classList.contains('goal')) continue;
      if (!cells[r][c].classList.contains('visited')) {
        // "current" flash: önce eski current'ı temizle
        document.querySelectorAll('.cell.current').forEach(x => x.classList.remove('current'));
        cells[r][c].classList.add('current');
        // kısa sonra visited olsun
        setTimeout(() => {
          cells[r][c].classList.remove('current');
          if (!cells[r][c].classList.contains('path') &&
              !cells[r][c].classList.contains('start') &&
              !cells[r][c].classList.contains('goal')) {
            cells[r][c].classList.add('visited');
          }
        }, 50);
      }
    }

    statsVisited.textContent = `Ziyaret: ${Math.min(idx, totalVisited)}`;

    // Ziyaret bitti mi?
    if (idx >= totalVisited) {
      clearInterval(animTimer);
      animTimer = null;

      // Yolu çiz (sarı parlak)
      setTimeout(() => {
        statsPath.textContent = `Yol uzunluğu: ${finalPath.length - 1} adım`;
        for (const { r, c } of finalPath) {
          if (cells[r][c].classList.contains('start') || cells[r][c].classList.contains('goal')) continue;
          cells[r][c].classList.add('path');
        }
        animRunning = false;
        stateLocked = false;
        btnBul.disabled = false;
        btnBul.textContent = '🚀 Yolu Bul';
      }, 120);
    }
  }, 30);
}

function stopAnim() {
  if (animTimer) { clearInterval(animTimer); animTimer = null; }
  animRunning = false;
  currentQueue = [];
  visitedQueue = [];
  document.querySelectorAll('.cell.current').forEach(x => x.classList.remove('current'));
  stateLocked = false;
}

// ─── Toast ───
function showToast() {
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 4200);
}
function hideToast() { toast.classList.remove('show'); }

// ─── Reset / Temizle ───
function resetAll() {
  stopAnim();
  hideToast();
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      cells[r][c].classList.remove('wall', 'visited', 'current', 'path', 'start', 'goal');
      grid[r][c] = 0;
    }
  }
  startPos = { r: 0, c: 2 };
  goalPos = { r: SIZE - 1, c: SIZE - 2 };
  placeAgent(startPos, 'start');
  placeAgent(goalPos, 'goal');
  statsVisited.textContent = 'Ziyaret: 0';
  statsPath.textContent = 'Yol: —';
}

function clearWalls() {
  stopAnim();
  hideToast();
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      cells[r][c].classList.remove('wall');
      grid[r][c] = 0;
    }
  }
  removeVisualsOnly();
  statsPath.textContent = 'Yol: —';
}

// ─── Kontrol Butonları ───
btnBul.addEventListener('click', () => {
  if (btnBul.disabled) return;
  startFind();
});

btnSifirla.addEventListener('click', () => {
  resetAll();
  hideToast();
});

btnTemizle.addEventListener('click', clearWalls);

speedSlider.addEventListener('input', (e) => {
  animSpeed = +e.target.value;
  speedValue.textContent = e.target.value;
});

// ─── Başlat ───
initGrid();
