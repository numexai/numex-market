/* ==========================================================================
   ATELIER — Arayüz yardımcıları ve ortak bileşenler
   ========================================================================== */

/* ---------- İkonlar ---------- */
const ICON = {
  cart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>',
  heart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1L12 21.2l7.7-7.8 1.1-1a5.5 5.5 0 0 0 0-7.8z"/></svg>',
  search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
  menu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"><path d="M3 7h18M3 12h18M3 17h12"/></svg>',
  close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>',
  star: '<svg viewBox="0 0 24 24"><path d="m12 2 2.9 6.3 6.9.8-5.1 4.7 1.4 6.8L12 17.3 5.9 20.6l1.4-6.8L2.2 9.1l6.9-.8z"/></svg>',
  arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
  arrowUp: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17 17 7M9 7h8v8"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="m4 12.5 5 5L20 6.5"/></svg>',
  plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
  minus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"><path d="M5 12h14"/></svg>',
  truck: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><path d="M1 3h13v13H1z"/><path d="M14 8h4l3 3v5h-7z"/><circle cx="5.5" cy="18.5" r="1.8"/><circle cx="17.5" cy="18.5" r="1.8"/></svg>',
  refresh: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 0 1 15.5-6.2L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-15.5 6.2L3 16"/><path d="M3 21v-5h5"/></svg>',
  shield: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2 4 6v6c0 5 3.5 8.7 8 10 4.5-1.3 8-5 8-10V6z"/><path d="m8.5 12 2.5 2.5 4.5-4.5"/></svg>',
  info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"><circle cx="12" cy="12" r="9.5"/><path d="M12 11v6M12 7.6v.2"/></svg>',
  bag: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><path d="M5 7h14l-1.2 13.2a1.5 1.5 0 0 1-1.5 1.3H7.7a1.5 1.5 0 0 1-1.5-1.3z"/><path d="M9 9V6a3 3 0 0 1 6 0v3"/></svg>',
  download: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12M7 11l5 5 5-5"/><path d="M4 20h16"/></svg>'
};

/* ---------- Küçük yardımcılar ---------- */
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

const esc = (s) => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

function starsHTML(rating, reviews) {
  const full = Math.round(rating);
  let s = '';
  for (let i = 0; i < 5; i++) s += `<span style="opacity:${i < full ? 1 : .25}">${ICON.star}</span>`;
  return `<span class="stars" aria-label="${rating} üzerinden 5 puan, ${reviews} değerlendirme">${s}${reviews != null ? `<span>${rating.toFixed(1)} (${reviews})</span>` : ''}</span>`;
}

/* ---------- Bildirimler ---------- */
function toast(message, type = 'ok') {
  let stack = $('.toast-stack');
  if (!stack) {
    stack = document.createElement('div');
    stack.className = 'toast-stack';
    stack.setAttribute('role', 'status');
    stack.setAttribute('aria-live', 'polite');
    document.body.appendChild(stack);
  }
  const el = document.createElement('div');
  el.className = 'toast' + (type === 'bad' ? ' toast--bad' : '');
  el.innerHTML = `<span>${type === 'bad' ? ICON.info : ICON.check}</span><span>${esc(message)}</span>`;
  stack.appendChild(el);
  requestAnimationFrame(() => el.classList.add('is-on'));
  setTimeout(() => {
    el.classList.remove('is-on');
    setTimeout(() => el.remove(), 500);
  }, 3400);
}

/* ---------- Ürün kartı ---------- */
function productCard(p) {
  const totalStock = variantTotalStock(p);
  const fav = Store.isFav(p.id);
  let tag = '';
  if (totalStock === 0) tag = '<span class="tag tag--out">Tükendi</span>';
  else if (p.oldPrice) tag = `<span class="tag tag--copper">%${Math.round((1 - p.price / p.oldPrice) * 100)} indirim</span>`;
  else if (p.bestseller) tag = '<span class="tag">Çok satan</span>';

  const hasVariants = (p.variants || []).length > 0;
  const priceHTML = p.oldPrice
    ? `${formatTL(p.price)}<s>${formatTL(p.oldPrice)}</s>`
    : formatTL(p.price);

  return `
  <article class="prod-card reveal" data-pid="${p.id}">
    <div class="prod-card__media">
      ${tag}
      <button class="fav-btn ${fav ? 'is-on' : ''}" data-fav="${p.id}"
        aria-label="${esc(p.name)} favorilere ${fav ? 'eklendi' : 'ekle'}"
        aria-pressed="${fav}">${ICON.heart}</button>
      <a href="urun.html?id=${p.id}" aria-label="${esc(p.name)} ürün detayına git">
        <img src="${p.images[0]}" alt="${esc(p.name)}" loading="lazy" width="400" height="500">
      </a>
      ${totalStock > 0
        ? `<button class="quick-add" data-quick="${p.id}">${hasVariants ? 'Seçenekleri gör' : 'Sepete ekle'}</button>`
        : `<span class="quick-add" style="pointer-events:none;transform:none;opacity:1;color:var(--muted)">Stokta yok</span>`}
    </div>
    <div class="prod-card__body">
      <span class="prod-card__cat">${esc(getCategory(p.category).name)}</span>
      <a class="prod-card__name" href="urun.html?id=${p.id}">${esc(p.name)}</a>
      <div class="prod-card__meta">
        <span class="prod-card__price">${priceHTML}</span>
        ${starsHTML(p.rating, p.reviews)}
      </div>
    </div>
  </article>`;
}

/* ---------- Mobil menü & sepet çekmecesi (ortak kabuk) ---------- */
function mountShell() {
  // Sepet çekmecesi HTML'i tüm sayfalara enjekte edilir
  if (!$('#cartDrawer')) {
    const el = document.createElement('div');
    el.innerHTML = `
      <div class="overlay" id="overlay"></div>
      <aside class="cart-drawer" id="cartDrawer" aria-hidden="true" aria-label="Alışveriş sepeti" role="dialog">
        <div class="cart-drawer__head">
          <h3>Sepet <span class="small" id="cartDrawerCount"></span></h3>
          <button class="icon-btn" id="cartClose" aria-label="Sepeti kapat">${ICON.close}</button>
        </div>
        <div class="cart-drawer__body" id="cartBody"></div>
        <div class="cart-drawer__foot" id="cartFoot"></div>
      </aside>`;
    document.body.appendChild(el);
  }

  $('#overlay').addEventListener('click', closeAll);
  $('#cartClose').addEventListener('click', closeCart);

  // Menü butonu
  const toggle = $('#menuToggle');
  if (toggle) toggle.addEventListener('click', () => {
    $('#drawerNav').classList.add('is-open');
    $('#overlay').classList.add('is-open');
    document.body.classList.add('no-scroll');
  });
  const navClose = $('#drawerNavClose');
  if (navClose) navClose.addEventListener('click', closeAll);

  // Sepet açıcılar
  $$('[data-open-cart]').forEach(b => b.addEventListener('click', (e) => {
    e.preventDefault();
    openCart();
  }));

  Store.onChange(() => {
    renderCartDrawer();
    updateCartBadge();
  });
  renderCartDrawer();
  updateCartBadge();
}

function openCart() {
  $('#cartDrawer').classList.add('is-open');
  $('#cartDrawer').setAttribute('aria-hidden', 'false');
  $('#overlay').classList.add('is-open');
  document.body.classList.add('no-scroll');
}
function closeCart() {
  $('#cartDrawer').classList.remove('is-open');
  $('#cartDrawer').setAttribute('aria-hidden', 'true');
  if (!$('#drawerNav').classList.contains('is-open')) {
    $('#overlay').classList.remove('is-open');
    document.body.classList.remove('no-scroll');
  }
}
function closeAll() {
  closeCart();
  const nav = $('#drawerNav');
  if (nav) nav.classList.remove('is-open');
  $('#overlay').classList.remove('is-open');
  document.body.classList.remove('no-scroll');
  const f = $('.filters');
  if (f) f.classList.remove('is-open');
}

function updateCartBadge() {
  const n = Store.cartCount();
  $$('[data-cart-badge]').forEach(b => {
    b.textContent = n;
    b.classList.toggle('is-on', n > 0);
  });
}

function renderCartDrawer() {
  const body = $('#cartBody');
  const foot = $('#cartFoot');
  if (!body) return;
  const lines = Store.cartLines();
  $('#cartDrawerCount').textContent = lines.length ? `(${Store.cartCount()} ürün)` : '';

  if (!lines.length) {
    body.innerHTML = `
      <div class="empty">
        ${ICON.bag}
        <h4>Sepetiniz henüz boş</h4>
        <p>Koleksiyonumuza göz atın; sıcak bir lamba iyi gelir.</p>
        <a href="magaza.html" class="btn btn--ghost btn--sm">Koleksiyonu gez</a>
      </div>`;
    foot.innerHTML = '';
    return;
  }

  body.innerHTML = lines.map(l => `
    <div class="cart-line">
      <a href="urun.html?id=${l.pid}"><img class="cart-line__img" src="${l.product.images[0]}" alt="${esc(l.product.name)}"></a>
      <div>
        <div class="cart-line__top">
          <div>
            <a href="urun.html?id=${l.pid}" class="cart-line__name">${esc(l.product.name)}</a>
            <div class="cart-line__var">${l.variant ? esc(l.variant.label) : 'Tek seçenek'}</div>
          </div>
          <span class="cart-line__price">${formatTL(l.lineTotal)}</span>
        </div>
        <div class="cart-line__bottom">
          <div class="qty">
            <button data-dec="${l.id}" aria-label="Adet azalt">${ICON.minus}</button>
            <span aria-live="polite">${l.qty}</span>
            <button data-inc="${l.id}" aria-label="Adet artır" ${l.qty >= l.stock ? 'disabled' : ''}>${ICON.plus}</button>
          </div>
          <button class="cart-line__remove" data-remove="${l.id}">Kaldır</button>
        </div>
        ${l.qty >= l.stock ? `<div class="small" style="margin-top:6px;color:var(--copper)">Stok sınırına ulaşıldı (${l.stock})</div>` : ''}
      </div>
    </div>`).join('');

  const sub = Store.subtotal();
  const disc = Store.discountAmount();
  const ship = Store.shippingCost('standard');
  const total = Store.total('standard');
  const remaining = Store.freeShippingRemaining();
  const coupon = Store.getCoupon();

  foot.innerHTML = `
    <div class="sum-row"><span>Ürün toplamı</span><span>${formatTL(sub)}</span></div>
    ${disc > 0 ? `<div class="sum-row sum-row--discount"><span>İndirim (${esc(coupon.code)})</span><span>−${formatTL(disc)}</span></div>` : ''}
    <div class="sum-row"><span>Kargo</span><span>${ship === 0 ? 'Ücretsiz' : formatTL(ship)}</span></div>
    ${remaining > 0 ? `<p class="ship-note">Ücretsiz kargo için <b>${formatTL(remaining)}</b> daha ekleyin.</p>` : `<p class="ship-note"><b>Kargonuz ücretsiz.</b></p>`}
    <div class="sum-row sum-row--total"><span>Toplam</span><strong>${formatTL(total)}</strong></div>
    <a href="odeme.html" class="btn btn--block" style="margin-top:16px">Ödemeye geç ${ICON.arrow}</a>
    <a href="sepet.html" class="link-u" style="margin-top:14px;justify-content:center;width:100%">Sepeti görüntüle</a>`;

  body.querySelectorAll('[data-inc]').forEach(b => b.onclick = () => {
    const r = Store.incLine(b.dataset.inc);
    if (!r.ok && r.reason) toast(r.reason, 'bad');
  });
  body.querySelectorAll('[data-dec]').forEach(b => b.onclick = () => Store.decLine(b.dataset.dec));
  body.querySelectorAll('[data-remove]').forEach(b => b.onclick = () => {
    Store.removeLine(b.dataset.remove);
    toast('Ürün sepetten kaldırıldı.');
  });
}

/* ---------- Sepet butonları global (kart / hızlı ekle / favori) ---------- */
document.addEventListener('click', (e) => {
  const fav = e.target.closest('[data-fav]');
  if (fav) {
    e.preventDefault();
    const on = Store.toggleFav(fav.dataset.fav);
    fav.classList.toggle('is-on', on);
    fav.setAttribute('aria-pressed', String(on));
    toast(on ? 'Favorilere eklendi.' : 'Favorilerden çıkarıldı.');
    return;
  }
  const quick = e.target.closest('[data-quick]');
  if (quick) {
    e.preventDefault();
    const p = getProduct(quick.dataset.quick);
    if (!p) return;
    if ((p.variants || []).length > 0) {
      location.href = `urun.html?id=${p.id}`;
      return;
    }
    const r = Store.addToCart(p.id, null, 1);
    if (r.ok) { toast(`${p.name} sepete eklendi.`); openCart(); }
    else toast(r.reason, 'bad');
  }
});

/* ---------- Görünürlük animasyonu ---------- */
// NUMEX-DÜZELTME (2026-11-22): Kök neden: index.html'de ürün kartları innerHTML ile observeReveals()'ten ÖNCE ekleniyordu ve tek bir gözlemci nesnesi paylaşılmıyordu; ayrıca eşik .12 ve negatif rootMargin yüzünden animasyon hiç tetiklenmiyordu — 18 öğenin 0'ı görünür kaldı ve sayfanın ortası boş göründü. Artık tek gözlemci yeniden kullanılıyor, her render sonrası yeniden bağlanıyor ve 1.2 sn'lik emniyet ağı içeriği her koşulda 
let revealObserver = null;

function observeReveals(root = document) {
  const els = $$('.reveal', root).filter(el => !el.classList.contains('is-in'));
  if (!els.length) return;

  if (!('IntersectionObserver' in window)) { els.forEach(el => el.classList.add('is-in')); return; }

  if (!revealObserver) {
    revealObserver = new IntersectionObserver((entries) => {
      entries.forEach(en => {
        if (en.isIntersecting) { en.target.classList.add('is-in'); revealObserver.unobserve(en.target); }
      });
    }, { threshold: 0.01, rootMargin: '0px 0px 0px 0px' });
  }
  els.forEach(el => revealObserver.observe(el));

  // NUMEX-DÜZELTME (2026-11-22): Emniyet ağı yalnız görünüm penceresindeki öğeleri açıyordu; ekran dışındaki bölümler (koleksiyonlar, ürün ızgaraları, hikâye) opaklık 0'da kalıp sayfa boş görünüyordu. Artık 900 ms sonra tüm .reveal öğeleri görünür kabul edilir — animasyon süs, görünürlük garanti.
  // Emniyet ağı: animasyon hiç tetiklenmezse (gizli sekme, ekran görüntüsü, eski tarayıcı,
  // tam sayfa yakalama) 900 ms sonra TÜM içerik görünür kabul edilir.
  // Animasyon yalnız ilk bakıştaki zarafettir; içeriğin görünürlüğü buna bağlı olamaz.
  setTimeout(() => {
    els.forEach(el => el.classList.add('is-in'));
  }, 900);
}

/* ---------- JSON indirme ---------- */
function downloadJSON(data, filename) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

document.addEventListener('DOMContentLoaded', () => {
  mountShell();
  observeReveals();
});
