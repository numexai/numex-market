import '../site/site.css';
import { CATEGORIES, SHELVES } from '../library3d/data/catalog';

/**
 * ATAŞEHİR KÜTÜPHANESİ — tanıtım sitesi etkileşim katmanı.
 *
 * Koleksiyon kartları ve sayaçlar MEVCUT katalog verisinden (library3d/data)
 * beslenir; böylece sitedeki sayılar 3D sahnedeki raflarla her zaman aynıdır.
 * Bu dosya three.js import ETMEZ — tanıtım sayfası 3B motoru yüklemez,
 * yalnız saf DOM işi yapar (hafif ve hızlı açılır).
 */

/* --------------------------------------------------------------------------
   KOLEKSİYON KARTLARI — katalogdan üretilir
   -------------------------------------------------------------------------- */

interface CategoryView {
  id: string;
  label: string;
  color: number;
  range: string;
  desc: string;
  /** Bu kategoriye düşen raf sayısı */
  shelfCount: number;
}

function buildCategoryViews(): CategoryView[] {
  return CATEGORIES.map((c, index) => ({
    ...c,
    shelfCount: SHELVES.filter((s) => s.categoryIndex === index).length,
  }));
}

function renderCollections(): void {
  const grid = document.getElementById('colGrid');
  if (!grid) return;

  const views = buildCategoryViews();
  const frag = document.createDocumentFragment();

  for (const c of views) {
    const hex = `#${c.color.toString(16).padStart(6, '0')}`;

    const li = document.createElement('li');
    li.className = 'col-card reveal';
    li.style.setProperty('--cat', hex);

    const top = document.createElement('div');
    top.className = 'col-top';

    const name = document.createElement('h3');
    name.className = 'col-name';
    name.textContent = c.label;

    const range = document.createElement('span');
    range.className = 'col-range';
    range.textContent = c.range;

    top.append(name, range);

    const desc = document.createElement('p');
    desc.className = 'col-desc';
    desc.textContent = c.desc;

    const count = document.createElement('span');
    count.className = 'col-count';
    count.textContent = c.shelfCount > 0
      ? `${c.shelfCount} kitaplık`
      : 'Referans salonu';

    li.append(top, desc, count);
    frag.appendChild(li);
  }

  grid.appendChild(frag);
}

/* --------------------------------------------------------------------------
   HİZMET KARTLARI
   -------------------------------------------------------------------------- */

interface ServiceView {
  title: string;
  text: string;
  icon: string;
}

const SERVICES: ServiceView[] = [
  {
    title: 'Sessiz çalışma alanı',
    text: 'Zemin katta pencere boyunca uzanan okuma masaları. Her masada okuma lambası ve priz.',
    icon: '<path d="M4 18h16M6 18V9l6-4 6 4v9M9 18v-5h6v5"/>',
  },
  {
    title: 'Çocuk bölümü',
    text: 'Alt raf yüksekliğinde, renkli sırtlı kitaplarla ayrılmış okuma köşesi ve minderler.',
    icon: '<circle cx="12" cy="8" r="3.2"/><path d="M5.5 19c0-3.3 2.9-5.5 6.5-5.5s6.5 2.2 6.5 5.5"/>',
  },
  {
    title: 'Referans kaynaklar',
    text: 'Ansiklopedi, sözlük ve atlas rafları. Yerinde kullanım; fotokopi için danışma bankosu.',
    icon: '<path d="M5 4h9a3 3 0 013 3v13H8a3 3 0 00-3 3V4z"/><path d="M5 4v13"/>',
  },
  {
    title: 'Dijital erişim',
    text: 'Üst katta altı istasyon: katalog tarama, e-kitap erişimi ve internet.',
    icon: '<rect x="3" y="5" width="18" height="12" rx="2"/><path d="M8 21h8M12 17v4"/>',
  },
  {
    title: 'Etkinlik alanı',
    text: 'Üst kat balkonunun arkasında seminer ve atölye için esnek oturma düzeni.',
    icon: '<path d="M4 20V9l8-4 8 4v11"/><path d="M9 20v-6h6v6"/>',
  },
  {
    title: 'Katalog tarama',
    text: 'Raf kodu ve Dewey aralığına göre arama. 3D gezintide her raf tıklanabilir.',
    icon: '<circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/>',
  },
];

function renderServices(): void {
  const grid = document.getElementById('svcGrid');
  if (!grid) return;

  const frag = document.createDocumentFragment();

  for (const s of SERVICES) {
    const card = document.createElement('article');
    card.className = 'svc-card reveal';

    const icon = document.createElement('div');
    icon.className = 'svc-icon';
    icon.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${s.icon}</svg>`;

    const h = document.createElement('h3');
    h.textContent = s.title;

    const p = document.createElement('p');
    p.textContent = s.text;

    card.append(icon, h, p);
    frag.appendChild(card);
  }

  grid.appendChild(frag);
}

/* --------------------------------------------------------------------------
   ÜST GEZİNME — katılaşma + mobil menü
   -------------------------------------------------------------------------- */

function initNav(): void {
  const nav = document.getElementById('nav');
  const toggle = document.getElementById('navToggle');
  if (!nav) return;

  const syncSolid = () => {
    nav.classList.toggle('is-solid', window.scrollY > 24);
  };

  syncSolid();
  window.addEventListener('scroll', syncSolid, { passive: true });

  if (!toggle) return;

  const setOpen = (open: boolean) => {
    nav.classList.toggle('menu-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Menüyü kapat' : 'Menüyü aç');
  };

  toggle.addEventListener('click', () => {
    setOpen(!nav.classList.contains('menu-open'));
  });

  // Menüden bir bağlantıya tıklanınca kapat
  nav.querySelectorAll('.nav-links a').forEach((a) => {
    a.addEventListener('click', () => setOpen(false));
  });

  // Escape ile kapat
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && nav.classList.contains('menu-open')) {
      setOpen(false);
      toggle.focus();
    }
  });
}

/* --------------------------------------------------------------------------
   SAYAÇLAR — hero istatistikleri (görünür olunca artar)
   -------------------------------------------------------------------------- */

function initCounters(): void {
  const nodes = Array.from(document.querySelectorAll<HTMLElement>('[data-count]'));
  if (nodes.length === 0) return;

  /*
   * NUMEX-DÜZELTME (2026-10-26): sayaçlar önce 1.1 sn'lik bir animasyonla
   * artırılıyordu ve ekran görüntüsü/ilk bakış animasyonun ORTASINI
   * yakalıyordu ("11 kitaplık / 7.711 kitap" — doğrusu 12 / 8.573).
   * Hero istatistikleri güven göstergesidir; yanlış ara değer gösterilemez.
   * Değerler artık HTML'de yazılı olduğu gibi bırakılır, JS ile yalnız
   * tr-TR biçimine (binlik ayırıcı) normalize edilir.
   */
  for (const el of nodes) {
    const target = Number(el.dataset.count ?? '0');
    if (!Number.isFinite(target) || target <= 0) continue;
    el.textContent = target.toLocaleString('tr-TR');
  }
}


/* --------------------------------------------------------------------------
   GÖRÜNÜR OLUNCA BELİRME
   -------------------------------------------------------------------------- */

function initReveal(): void {
  const items = Array.from(document.querySelectorAll<HTMLElement>('.reveal'));
  if (items.length === 0) return;

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) {
    items.forEach((el) => el.classList.add('in-view'));
    return;
  }

  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('in-view');
        io.unobserve(entry.target);
      }
    },
    { threshold: 0.12, rootMargin: '0px 0px -8% 0px' },
  );

  items.forEach((el) => io.observe(el));
}

/* --------------------------------------------------------------------------
   BAŞLAT
   -------------------------------------------------------------------------- */

function boot(): void {
  renderCollections();
  renderServices();
  initNav();
  initCounters();
  initReveal();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot, { once: true });
} else {
  boot();
}
