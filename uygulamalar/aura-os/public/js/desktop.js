/* ============================================================
   AURA OS — Masaüstü & Uygulama Başlatıcı
   Simgeler (çift tık → pencere), kayıtlı AuraApps
   ============================================================ */

// Uygulama özellikleri (desktop simgesi için)
const APP_META = {
  notes:    { label: 'Siber Not Defteri', icon: '📝', bg: '#00b34a' },
  terminal: { label: 'Hacker Terminali',  icon: '⌨️', bg: '#889999' },
  paint:    { label: 'Neon Paint',        icon: '🎨', bg: '#ff00ff' },
};

const DESKTOP_APP_ORDER = ['notes', 'terminal', 'paint'];

/* Masaüstü simgelerini çizer (cift tıkla aç) */
function initDesktop() {
  const container = document.getElementById('desktop-icons');
  if (!container) return;

  container.innerHTML = '';
  DESKTOP_APP_ORDER.forEach(appId => {
    const meta = APP_META[appId];
    if (!meta) return;

    const iconEl = document.createElement('div');
    iconEl.className = 'app-icon';
    iconEl.dataset.app = appId;
    iconEl.innerHTML =
      '<div class="icon-img" style="background:linear-gradient(135deg,' + meta.bg + ',#003366);color:#fff">' +
        meta.icon +
      '</div>' +
      '<div class="icon-label">' + meta.label + '</div>';

    // Seçim (tek tık)
    iconEl.addEventListener('click', (e) => {
      e.stopPropagation();
      document.querySelectorAll('.app-icon').forEach(i => i.classList.remove('selected'));
      iconEl.classList.add('selected');
    });

    // Çift tık → uygulamayı aç
    iconEl.addEventListener('dblclick', () => {
      launchApp(appId);
    });

    container.appendChild(iconEl);
  });
}

/**
 * Uygulamayı başlatır (daha önce açıksa öne alır).
 * @param {string} appId
 */
function launchApp(appId) {
  const cfg = AuraApps[appId];
  if (!cfg) {
    console.warn('[Desktop] Başlatılamayan uygulama:', appId);
    return;
  }

  // Zaten açık bir pencere varsa onu öne getir (singleton mantığı yoksa bile pratik)
  const existing = Wm.windows.find(w => w.appId === appId);
  if (existing && !existing.minimized) {
    window.focusWindow(existing.id);
    return;
  }
  if (existing && existing.minimized) {
    window.restoreWindow(existing.id);
    return;
  }

  // Pencere aç
  const winInfo = cfg.windowProps || { width: 560, height: 420 };
  const meta = APP_META[appId] || { icon: cfg.icon || '🪟', label: cfg.name || appId };

  const winRef = createWindow({
    appId,
    title: cfg.windowTitle || meta.label || cfg.name,
    icon: cfg.icon || meta.icon,
    width: winInfo.width || 560,
    height: winInfo.height || 420,
    // İçerik şablonu html — aşağıdaki buildBodyContent
  });

  return winRef;
}

/* launchApp küresel olarak taskbar/başlat menüsünde kullanılsın */
window.launchApp = launchApp;

/* DOM hazır */
window.addEventListener('DOMContentLoaded', () => {
  initDesktop();
});
