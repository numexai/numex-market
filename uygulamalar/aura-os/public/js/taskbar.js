/* ============================================================
   AURA OS — Görev Çubuğu (Taskbar)
   Sol: Başlat Menüsü · Orta: Açık pencereler · Sağ: Canlı saat
   ============================================================ */

const Taskbar = {
  taskButtons: {},          // id -> { el, record }
  menuOpen: false,
  _clockTimer: null,
};

window.Taskbar = Taskbar;

/* ---------- BAŞLAT: container başlat ---------- */
function initTaskbar() {
  const startBtn = document.getElementById('start-btn');
  const startMenu = document.getElementById('start-menu');
  if (!startBtn || !startMenu) return;

  // Başlat menüsünü aç/kapa
  startBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleStartMenu();
  });

  // Dışarı tıklanınca kapat
  document.addEventListener('click', (event) => {
    if (Taskbar.menuOpen) {
      const menu = document.getElementById('start-menu');
      const btn = document.getElementById('start-btn');
      if (menu && !menu.contains(event.target) && !btn.contains(event.target)) {
        closeStartMenu();
      }
    }
  });

  // Başlat içindeki uygulamaları doldur
  buildStartAppList();

  // Canlı saat başlat
  startClock();

  // OS başlar başlamaz menüyü göster artık kapalı — yalnız render başlangıcı
  Taskbar.render();
}

function toggleStartMenu() {
  const menu = document.getElementById('start-menu');
  const btn = document.getElementById('start-btn');
  if (!menu) return;
  if (Taskbar.menuOpen) {
    closeStartMenu();
  } else {
    menu.classList.remove('hidden');
    btn.classList.add('open');
    Taskbar.menuOpen = true;
  }
}

function closeStartMenu() {
  const menu = document.getElementById('start-menu');
  const btn = document.getElementById('start-btn');
  if (menu) menu.classList.add('hidden');
  if (btn) btn.classList.remove('open');
  Taskbar.menuOpen = false;
}

/* Başlat menüsü listesini tanımlı AuraApps üzerinden doldur */
function buildStartAppList() {
  const listEl = document.getElementById('start-apps-list');
  if (!listEl) return;

  const order = ['notes', 'terminal', 'paint'];
  const labels = {
    notes:   { icon: '📝', name: 'Siber Not Defteri', desc: 'Not yaz & kaydet' },
    terminal:{ icon: '🖥️', name: 'Hacker Terminali', desc: 'CRT komut konsolu' },
    paint:   { icon: '🎨', name: 'Neon Paint', desc: 'Neon canvas çizimi' },
  };

  listEl.innerHTML = '';
  order.forEach(appId => {
    const cfg = AuraApps[appId];
    if (!cfg) return;
    const meta = labels[appId] || { icon: cfg.icon, name: cfg.name, desc: '' };
    const item = document.createElement('div');
    item.className = 'start-app-item';
    item.innerHTML =
      '<span class="sa-icon">' + meta.icon + '</span>' +
      '<div class="sa-meta">' +
        '<span class="sa-name">' + meta.name + '</span>' +
        '<span class="sa-desc">' + meta.desc + '</span>' +
      '</div>';
    item.addEventListener('click', (e) => {
      e.stopPropagation();
      closeStartMenu();
      // Pencere aç
      launchApp(appId);
    });
    listEl.appendChild(item);
  });
}

/* Uygulama başlatıcı — desktop.js'te tanımlı launchApp'e yönlendir */
function launchApp(appId) {
  if (typeof window.launchApp === 'function') {
    window.launchApp(appId);
  }
}
window.launchAppFromTaskbar = launchApp;

/* ---------- AÇIK PENCERE BUTONLARI ---------- */
function addTaskButton(record) {
  const container = document.getElementById('taskbar-windows');
  if (!container) return;

  // Varsa yeniden ekleme
  removeTaskButton(record.id);

  const btn = document.createElement('div');
  btn.className = 'task-window-btn';
  btn.dataset.winId = record.id;
  btn.innerHTML =
    '<span class="tw-icon">' + (record.icon || '🪟') + '</span>' +
    '<span class="tw-label">' + safeTitle(record.title) + '</span>';

  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    const win = window.getWindowRecord ? window.getWindowRecord(record.id) : record;
    if (win.minimized) {
      // Küçültülmüşse geri getir
      window.restoreWindow(record.id);
      // Başlat menüsü kapalı olsun
      closeStartMenu();
    } else {
      // Açık ama aktif değilse odakla; aktifse minimize et
      if (Wm.activeWin && Wm.activeWin.id === record.id) {
        window.minimizeWindow(record.id);
      } else {
        window.focusWindow(record.id);
      }
    }
  });

  container.appendChild(btn);
  Taskbar.taskButtons[record.id] = btn;
}

function removeTaskButton(id) {
  const container = document.getElementById('taskbar-windows');
  const existing = Taskbar.taskButtons[id];
  if (existing) {
    if (container && existing.parentNode) container.removeChild(existing);
    delete Taskbar.taskButtons[id];
  } else if (container) {
    // yedek: data-winId
    const orphan = container.querySelector('[data-win-id="' + id + '"]');
    if (orphan) container.removeChild(orphan);
  }
}

function getTaskBtn(id) {
  return Taskbar.taskButtons[id] || null;
}

function safeTitle(t) {
  if (!t) return '';
  return String(t).replace(/[<>&]/g, '');
}

function refreshTaskButtons() {
  const container = document.getElementById('taskbar-windows');
  if (!container) return;
  // aktif sınıfları güncelle
  Wm.windows.forEach(rec => {
    const btn = Taskbar.taskButtons[rec.id];
    if (btn) {
      const isAct = Wm.activeWin && Wm.activeWin.id === rec.id && !rec.minimized;
      btn.classList.toggle('active', !!isAct);
    }
  });
}

/* ---------- Pencere yöneticisi tarafından çağrılır (render/harici metodlar) ----------
   Taskbar nesnesinin windowManager tarafından beklenen arayüzünü kur: */
Taskbar.addTaskButton = addTaskButton;
Taskbar.removeTaskButton = removeTaskButton;
Taskbar.getTaskBtn = getTaskBtn;
Taskbar.render = function () { refreshTaskButtons(); };

function TaskbarRender() {
  refreshTaskButtons();
}

/* ---------- CANLI SAAT ---------- */
function startClock() {
  const clockEl = document.getElementById('taskbar-clock');
  const dateEl = document.getElementById('taskbar-date');
  const startDateEl = document.getElementById('start-date');

  function tick() {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const ss = String(now.getSeconds()).padStart(2, '0');
    if (clockEl) clockEl.textContent = hh + ':' + mm + ':' + ss;

    const days = ['PAZ', 'PZT', 'SAL', 'ÇAR', 'PER', 'CUM', 'CMT'];
    const months = ['OCA','ŞUB','MAR','NİS','MAY','HAZ','TEM','AĞU','EYL','EKİ','KAS','ARA'];
    const day = days[now.getDay()];
    const dateStr = day + ' ' + now.getDate() + ' ' + months[now.getMonth()] + ' ' + now.getFullYear();
    if (dateEl) dateEl.textContent = dateStr;
    if (startDateEl) startDateEl.textContent = dateStr;

    // Dijital saat yanında saniyenin son hanesi (0-9) neon vuruşu dekoratif değil — boş, saf.
  }

  tick();
  clearInterval(Taskbar._clockTimer);
  Taskbar._clockTimer = setInterval(tick, 1000);
}

/* ---------- AuraOS'un window yönetim arayüzleri taskbar butonlarını kullanırken ----------
   window.focusWindow / minimizeWindow / restoreWindow fonksiyonları windowManager'da 'var' değil
   'function' bildirimiyle tanımlıydı (global scope). Bunları window objesine de bind ediyoruz: */
function exposeWmGlobals() {
  if (typeof focusWindow === 'function') window.focusWindow = focusWindow;
  if (typeof minimizeWindow === 'function') window.minimizeWindow = minimizeWindow;
  if (typeof restoreWindow === 'function') window.restoreWindow = restoreWindow;
  if (typeof closeWindow === 'function') window.closeWindow = closeWindow;
  if (typeof getWindow === 'function') window.getWindowRecord = getWindow;
}
exposeWmGlobals();

/* DOM hazır olduğunda başlat — yükleme sırası: windowManager.js sonra taskbar.js */
window.addEventListener('DOMContentLoaded', initTaskbar);
