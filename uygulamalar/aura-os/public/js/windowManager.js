/* ============================================================
   AURA OS — Pencere Yöneticisi (Window Manager)
   createWindow / focus / minimize / restore / close / drag / z-sırası
   ============================================================ */

// Global uygulama kayıt defteri
const AuraApps = {};

// Pencere yöneticisi durumu
const Wm = {
  windows: [],          // tüm pencere kayıtları
  zCounter: 10,         // z-index sayaç (her focus artar)
  activeWin: null,      // şu an üstte olan pencere
  nextId: 1,
};

function registerApp(appId, config) {
  AuraApps[appId] = config;
  // console.log('[AuraApps] kayıtlı:', appId);
}

/**
 * Yeni bir pencere oluşturup ekran katmanına ekler.
 * @param {object} opts
 *   appId: string — uygulama kimliği (AuraApps kaydı)
 *   title: string — başlık
 *   icon:  string — emoji ikon
 *   width,height: pencere boyut
 *   x, y:  başlangıç konumu (opsiyonel)
 *   content: html string (body içeriği)
 *   onReady: function(winBody) — içeriğin DOM'a bağlanmasından sonra çağrılır
 */
function createWindow(opts) {
  const app = AuraApps[opts.appId];
  if (!app) {
    console.error('[WM] Bilinmeyen uygulama:', opts.appId);
    return null;
  }

  // Varsayılanlar
  const width  = opts.width  || app.defaultWidth  || 560;
  const height = opts.height || app.defaultHeight || 400;

  // Konum: verilmediyse kademeli merkez açılım
  const vw = window.innerWidth;
  const vh = window.innerHeight - 50; // taskbar payı
  const baseX = typeof opts.x === 'number' ? opts.x : Math.max(30, Math.round((vw - width) / 2));
  const baseY = typeof opts.y === 'number' ? opts.y : Math.max(20, Math.round((vh - height) / 3));
  const offset = (Wm.windows.length % 8) * 22;
  const x = Math.min(baseX + offset, vw - width - 20);
  const y = Math.min(baseY + offset, vh - height - 20);

  const id = 'win-' + (Wm.nextId++);
  const zIndex = ++Wm.zCounter;

  // Pencere kök elemanı
  const win = document.createElement('div');
  win.className = 'aura-window active';
  win.id = id;
  win.dataset.appId = opts.appId;
  win.style.left = Math.max(6, x) + 'px';
  win.style.top = Math.max(6, y) + 'px';
  win.style.width = width + 'px';
  win.style.height = height + 'px';
  win.style.zIndex = zIndex;

  // Baslık çubuğu
  const titlebar = document.createElement('div');
  titlebar.className = 'window-titlebar';
  titlebar.innerHTML =
    '<span class="win-icon">' + (opts.icon || app.icon || '🪟') + '</span>' +
    '<span class="win-title">' + escapeHtml(opts.title || app.name || opts.appId) + '</span>' +
    '<div class="win-btns">' +
      '<button class="win-btn btn-min" title="Küçült">—</button>' +
      '<button class="win-btn btn-close" title="Kapat">×</button>' +
    '</div>';

  // Gövde
  const body = document.createElement('div');
  body.className = 'window-body';

  win.appendChild(titlebar);
  win.appendChild(body);

  // Kayıt nesnesi
  const record = {
    id,
    appId: opts.appId,
    title: opts.title || app.name,
    icon: opts.icon || app.icon,
    el: win,
    titlebar,
    body,
    minimized: false,
    metadata: opts.metadata || null,
  };

  Wm.windows.push(record);

  // Pencereyi katmana ekle
  const layer = document.getElementById('window-layer');
  layer.appendChild(win);
  record.launchTime = Date.now();

  // ---- Başlık çubuğundan sürükleme ----
  setupDrag(record);

  // ---- Odaklama olayı: pencereye tıklandığında en öne ----
  win.addEventListener('mousedown', (e) => {
    if (record.minimized) return;
    focusWindow(record.id);
  });
  // Başlık çubuğu drag başlarken de öne alınmalı
  titlebar.addEventListener('mousedown', (e) => {
    if (record.minimized) return;
    focusWindow(record.id);
  });

  // ---- Buton davranışları ----
  const minBtn = titlebar.querySelector('.btn-min');
  const closeBtn = titlebar.querySelector('.btn-close');
  minBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    minimizeWindow(record.id);
  });
  closeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    closeWindow(record.id);
  });

  // ---- İçeriği doldur ----
  if (typeof opts.content === 'string') {
    body.innerHTML = opts.content;
  }

  // ---- Görev çubuğu butonunu oluştur ----
  window.Taskbar && window.Taskbar.addTaskButton(record);
  record.taskBtn = window.Taskbar && window.Taskbar.getTaskBtn(record.id);

  // ---- Uygulamanın kurulum çağrısı ----
  if (app.onLaunch) {
    try {
      app.onLaunch(record, body);
    } catch (err) {
      console.error('[WM] onLaunch hatası:', err);
      body.innerHTML = '<div class="note-item"><div class="ni-empty">Hata: ' + escapeHtml(err.message) + '</div></div>';
    }
  }

  // ---- onReady çağrısı ----
  if (typeof opts.onReady === 'function') {
    opts.onReady(record, body);
  }

  window.Taskbar && window.Taskbar.render();
  focusWindow(record.id);

  return { record, bodyEl: body, win };
}

/* ------------ Saydam yardımcı: DOM'a sağlam pencere dış IP arayüzü ------------
   createWindow genel (global) fonksiyon olarak dönecek, alt-scriptler kullanır.
   Diğer modüller window.createWindow ≠ çalışmasın diye: */
window.createWindow = createWindow;

/* ---- Odak (z-sırası) Yönetimi ---- */
function focusWindow(id) {
  const rec = getWindow(id);
  if (!rec) return;

  // Zaten aktifse ama minimize ise restore olur
  if (rec.minimized) return; // taskbar üzerinden restore edilir

  // Aktif pencere sınıfını temizle
  Wm.windows.forEach(w => {
    w.el.classList.remove('active');
    w.taskBtn && w.taskBtn.classList.remove('active');
  });

  rec.el.classList.add('active');
  rec.el.style.zIndex = ++Wm.zCounter;
  Wm.activeWin = rec;

  if (recordBtnById(id)) recordBtnById(id).classList.add('active');
  rec.taskBtn && rec.taskBtn.classList.add('active');

  window.Taskbar && window.Taskbar.render();
  // Pencereyi minimum boyutun üzerinde tutmaz, minimize restore
  if (rec.minimized && rec.__doRestore) topLevelRestore(rec);
}

function topLevelRestore(rec) {
  rec.el.classList.remove('minimized');
  rec.minimized = false;
  rec.el.style.display = 'flex';
}

/* ------------ Küçült ------------ */
function minimizeWindow(id) {
  const rec = getWindow(id);
  if (!rec) return;
  rec.el.classList.add('minimized');
  rec.minimized = true;
  rec.el.classList.remove('active');
  rec.taskBtn && rec.taskBtn.classList.remove('active');

  // Aktifliği bırak
  if (Wm.activeWin && Wm.activeWin.id === id) {
    Wm.activeWin = null;
    // Aktifliği diğer pencereye aktar
    const others = Wm.windows.filter(w => !w.minimized);
    if (others.length) focusWindow(others[others.length - 1].id);
  }
  window.Taskbar && window.Taskbar.render();
}

/* ------------ Geri getir (restore) ------------ */
function restoreWindow(id) {
  const rec = getWindow(id);
  if (!rec) return;
  rec.el.classList.remove('minimized');
  rec.minimized = false;
  rec.el.classList.add('active');
  rec.el.style.zIndex = ++Wm.zCounter;
  Wm.activeWin = rec;
  focusWindow(id);
  window.Taskbar && window.Taskbar.render();
}

/* ------------ Kapat ------------ */
function closeWindow(id) {
  const rec = getWindow(id);
  if (!rec) return;

  const idx = Wm.windows.indexOf(rec);
  if (idx >= 0) Wm.windows.splice(idx, 1);

  // Görev çubuğu butonunu kaldır
  if (window.Taskbar) {
    window.Taskbar.removeTaskButton(id);
  }

  if (rec.el.parentNode) rec.el.parentNode.removeChild(rec.el);

  if (Wm.activeWin && Wm.activeWin.id === id) {
    Wm.activeWin = null;
    const others = Wm.windows.filter(w => !w.minimized);
    if (others.length) focusWindow(others[others.length - 1].id);
  }
  window.Taskbar && window.Taskbar.render();
}

/* ------------ Yardımcı fonksiyonlar ------------ */
function getWindow(id) {
  return Wm.windows.find(w => w.id === id) || null;
}

function recordBtnById(id) {
  const rec = getWindow(id);
  return rec && rec.taskBtn;
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/* ------------ Fareyle sürükleme (drag) ------------ */
function setupDrag(rec) {
  const titlebar = rec.titlebar;
  let isDragging = false;
  let startX, startY, origX, origY, origPointerX, origPointerY;

  titlebar.addEventListener('mousedown', (e) => {
    // Sol tuş; başlık butonlarına tıklanmışsa sürükleme başlatma
    if (e.button !== 0) return;
    if (e.target.closest('.win-btns')) return;

    isDragging = true;
    const rect = rec.el.getBoundingClientRect();
    startX = rect.left;
    startY = rect.top;
    origPointerX = e.clientX;
    origPointerY = e.clientY;

    rec.el.style.transition = 'none';
    e.preventDefault();
  });

  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    const dx = e.clientX - origPointerX;
    const dy = e.clientY - origPointerY;
    let nx = startX + dx;
    let ny = startY + dy;

    // Ekran sınırları içinde tut (kısmen taşmasın)
    const vw = window.innerWidth;
    const vh = window.innerHeight - 50;
    nx = Math.min(nx, vw - 60);
    ny = Math.min(ny, vh - 30);
    nx = Math.max(nx, -rec.el.offsetWidth + 80);
    ny = Math.max(ny, 0);

    rec.el.style.left = nx + 'px';
    rec.el.style.top = ny + 'px';
  });

  document.addEventListener('mouseup', () => {
    if (isDragging) {
      isDragging = false;
      rec.el.style.transition = '';
    }
  });
}

/* ----- Pencere sırasını gösteren API (debug/taskbar) ----- */
window.Wm = Wm;
