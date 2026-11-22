/* ==========================================================================
   ATELIER — Alışveriş motoru
   Sepet, stok, kupon, kargo, sipariş ve localStorage kalıcılığı.
   ========================================================================== */

const Store = (() => {
  const KEY = {
    cart: 'atelier_cart_v1',
    orders: 'atelier_orders_v1',
    favs: 'atelier_favs_v1',
    stock: 'atelier_stock_v1',
    counter: 'atelier_counter_v1'
  };

  const read = (k, fallback) => {
    try {
      const raw = localStorage.getItem(k);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      console.warn('localStorage okunamadı:', k, e);
      return fallback;
    }
  };
  const write = (k, v) => {
    try {
      localStorage.setItem(k, JSON.stringify(v));
    } catch (e) {
      console.warn('localStorage yazılamadı:', k, e);
    }
  };

  /* ---------- Stok ek düzeltmeleri (panelden yapılan değişiklikler) ---------- */
  // Varyant bazında stok değişiklikleri: { "atl-001::krem": 5 }
  let stockOverride = read(KEY.stock, {});

  const stockKey = (pid, vid) => `${pid}::${vid || '__base'}`;

  function getStock(pid, vid) {
    const product = getProduct(pid);
    if (!product) return 0;
    const k = stockKey(pid, vid);
    if (Object.prototype.hasOwnProperty.call(stockOverride, k)) return Math.max(0, stockOverride[k]);
    return stockFor(product, vid);
  }

  function setStock(pid, vid, n) {
    stockOverride[stockKey(pid, vid)] = Math.max(0, Math.floor(n));
    write(KEY.stock, stockOverride);
  }

  function bumpStock(pid, vid, delta) {
    setStock(pid, vid, getStock(pid, vid) + delta);
  }

  /* ---------- Sepet ---------- */
  let cart = read(KEY.cart, []);

  // Satır anahtarı: ürün + varyant → farklı varyantlar sepette ayrı kalır
  const lineId = (pid, vid) => `${pid}::${vid || '__base'}`;

  function getCart() { return cart.slice(); }
  function cartCount() { return cart.reduce((s, l) => s + l.qty, 0); }
  function cartLines() {
    return cart.map(l => {
      const product = getProduct(l.pid);
      const variant = (product.variants || []).find(v => v.id === l.vid) || null;
      const unit = priceFor(product, l.vid);
      return {
        ...l,
        product,
        variant,
        unit,
        lineTotal: unit * l.qty,
        stock: getStock(l.pid, l.vid)
      };
    });
  }

  const listeners = [];
  function onChange(fn) { listeners.push(fn); }
  function emit() { listeners.forEach(fn => fn()); persist(); }
  function persist() { write(KEY.cart, cart); }

  /**
   * Sepete ürün ekler. Stok sınırını aşmaz.
   * @returns {{ok:boolean, reason?:string, added?:number, max?:number}}
   */
  function addToCart(pid, vid, qty = 1) {
    const product = getProduct(pid);
    if (!product) return { ok: false, reason: 'Ürün bulunamadı.' };

    const stock = getStock(pid, vid);
    if (stock <= 0) return { ok: false, reason: 'Bu ürün şu anda stokta yok.' };

    const key = lineId(pid, vid);
    const existing = cart.find(l => l.id === key);
    const current = existing ? existing.qty : 0;
    const room = stock - current;

    if (room <= 0) {
      return { ok: false, reason: `Stokta en fazla ${stock} adet var.`, max: stock };
    }
    const add = Math.min(qty, room);

    if (existing) existing.qty += add;
    else cart.push({ id: key, pid, vid: vid || null, qty: add, addedAt: Date.now() });

    emit();
    return { ok: true, added: add, max: stock, partial: add < qty };
  }

  function setQty(lineKey, qty) {
    const line = cart.find(l => l.id === lineKey);
    if (!line) return { ok: false };
    const stock = getStock(line.pid, line.vid);
    const target = Math.max(0, Math.min(qty, stock));
    if (target === 0) {
      removeLine(lineKey);
      return { ok: true, qty: 0 };
    }
    line.qty = target;
    emit();
    return { ok: true, qty: target, capped: qty > stock };
  }

  function incLine(lineKey) {
    const line = cart.find(l => l.id === lineKey);
    if (!line) return { ok: false };
    const stock = getStock(line.pid, line.vid);
    if (line.qty >= stock) return { ok: false, reason: `Stok sınırı: ${stock} adet.` };
    line.qty += 1;
    emit();
    return { ok: true };
  }

  function decLine(lineKey) {
    const line = cart.find(l => l.id === lineKey);
    if (!line) return { ok: false };
    line.qty -= 1;
    if (line.qty <= 0) cart = cart.filter(l => l.id !== lineKey);
    emit();
    return { ok: true };
  }

  function removeLine(lineKey) {
    cart = cart.filter(l => l.id !== lineKey);
    emit();
  }

  function clearCart() {
    cart = [];
    emit();
  }

  /* ---------- Kupon ---------- */
  let couponCode = null;

  function applyCoupon(raw) {
    const code = String(raw || '').trim().toUpperCase();
    if (!code) return { ok: false, message: 'Lütfen bir indirim kodu girin.' };
    const c = COUPONS.find(x => x.code === code);
    if (!c) return { ok: false, message: 'Geçersiz indirim kodu.' };

    const sub = subtotal();
    if (sub <= 0) return { ok: false, message: 'Sepetiniz boş.' };
    if (sub < (c.minTotal || 0)) {
      return { ok: false, message: `Bu kod için en az ${formatTL(c.minTotal)} ürün toplamı gerekir.` };
    }
    couponCode = code;
    emit();
    return { ok: true, message: `“${c.code}” uygulandı — ${c.label}.`, coupon: c };
  }

  function removeCoupon() { couponCode = null; emit(); }
  function getCoupon() { return COUPONS.find(x => x.code === couponCode) || null; }

  /* ---------- Hesaplama ---------- */
  function subtotal() {
    return cartLines().reduce((s, l) => s + l.lineTotal, 0);
  }

  function discountAmount() {
    const c = getCoupon();
    const sub = subtotal();
    if (!c || sub <= 0) return 0;
    if (sub < (c.minTotal || 0)) return 0;
    if (c.type === 'percent') return Math.round(sub * c.value / 100);
    if (c.type === 'fixed') return Math.min(c.value, sub);
    return 0;
  }

  function discountedSubtotal() {
    return Math.max(0, subtotal() - discountAmount());
  }

  /**
   * Kargo ücreti.
   * Standart: indirimli ara toplam 2.500 TL ve üzeri ise ücretsiz.
   * KARGOBEDAVA kuponu kargo ücretini sıfırlar.
   */
  function shippingCost(method = 'standard') {
    const c = getCoupon();
    const base = method === 'express' ? SHIPPING.express : SHIPPING.standard;
    const ds = discountedSubtotal();

    if (cart.length === 0) return 0;
    if (c && c.type === 'shipping') return 0;
    if (method === 'express') return ds >= SHIPPING.freeThreshold ? Math.max(0, SHIPPING.express - SHIPPING.standard) : SHIPPING.express;
    return ds >= SHIPPING.freeThreshold ? 0 : SHIPPING.standard;
  }

  function freeShippingRemaining() {
    const ds = discountedSubtotal();
    return Math.max(0, SHIPPING.freeThreshold - ds);
  }

  function total(method = 'standard') {
    return discountedSubtotal() + shippingCost(method);
  }

  /* ---------- Siparişler ---------- */
  let orders = read(KEY.orders, []);

  function getOrders() { return orders.slice().reverse(); }

  function createOrder(customer, shippingMethod = 'standard') {
    if (cart.length === 0) return { ok: false, message: 'Sepetiniz boş.' };

    // Stok son kontrolü (yarış/eskimiş veri ihtimaline karşı)
    for (const l of cartLines()) {
      const live = getStock(l.pid, l.vid);
      if (l.qty > live) {
        return { ok: false, message: `“${l.product.name}” için stok yetersiz (${live} adet kaldı).` };
      }
    }

    const sub = subtotal();
    const disc = discountAmount();
    const ship = shippingCost(shippingMethod);
    const totalAmount = sub - disc + ship;
    const counter = read(KEY.counter, 1042) + 1;
    write(KEY.counter, counter);

    const order = {
      id: 'ATL-' + String(counter).padStart(5, '0'),
      createdAt: new Date().toISOString(),
      customer,
      shippingMethod,
      shippingLabel: shippingMethod === 'express' ? 'Hızlı Kargo' : 'Standart Kargo',
      items: cartLines().map(l => ({
        pid: l.pid,
        vid: l.vid,
        name: l.product.name,
        variantLabel: l.variant ? l.variant.label : null,
        image: l.product.images[0],
        qty: l.qty,
        unit: l.unit,
        lineTotal: l.lineTotal
      })),
      subtotal: sub,
      discount: disc,
      coupon: getCoupon() ? getCoupon().code : null,
      shipping: ship,
      total: totalAmount,
      status: 'yeni',
      payment: { method: 'demo', status: 'onaylandı' },
      note: ''
    };

    // Stokları düş
    order.items.forEach(it => bumpStock(it.pid, it.vid, -it.qty));

    orders.push(order);
    write(KEY.orders, orders);
    cart = [];
    couponCode = null;
    emit();
    return { ok: true, order };
  }

  const STATUS = {
    yeni: 'Yeni',
    hazirlaniyor: 'Hazırlanıyor',
    kargoda: 'Kargoda',
    teslim: 'Teslim edildi',
    iptal: 'İptal'
  };

  function setOrderStatus(orderId, status) {
    const o = orders.find(x => x.id === orderId);
    if (!o) return false;
    const previous = o.status;
    o.status = status;
    // İptalde stoğu geri ver (yalnız bir kez)
    if (status === 'iptal' && previous !== 'iptal') {
      o.items.forEach(it => bumpStock(it.pid, it.vid, it.qty));
    }
    // İptalden geri dönüşte stoğu tekrar düş
    if (previous === 'iptal' && status !== 'iptal') {
      o.items.forEach(it => bumpStock(it.pid, it.vid, -it.qty));
    }
    write(KEY.orders, orders);
    emit();
    return true;
  }

  function getOrder(id) { return orders.find(o => o.id === id); }

  /* ---------- Favoriler ---------- */
  let favs = read(KEY.favs, []);
  function getFavs() { return favs.slice(); }
  function isFav(pid) { return favs.includes(pid); }
  function toggleFav(pid) {
    if (favs.includes(pid)) favs = favs.filter(x => x !== pid);
    else favs.push(pid);
    write(KEY.favs, favs);
    return favs.includes(pid);
  }

  /* ---------- Dışa aktarma / sıfırlama ---------- */
  function exportJSON() {
    return {
      marka: 'ATELIER',
      aciklama: 'Demo e-ticaret verisi — kişisel veri içermez.',
      olusturma: new Date().toISOString(),
      urunler: PRODUCTS.map(p => ({
        ...p,
        stokGuncel: variantTotalStock({ ...p, variants: (p.variants || []).map(v => ({ ...v, stock: getStock(p.id, v.id) })), stock: p.stock })
      })),
      siparisler: orders,
      sepet: cart
    };
  }

  function resetAll() {
    cart = [];
    orders = [];
    favs = [];
    couponCode = null;
    stockOverride = {};
    write(KEY.cart, []);
    write(KEY.orders, []);
    write(KEY.favs, []);
    write(KEY.stock, {});
    write(KEY.counter, 1042);
    emit();
  }

  return {
    // sepet
    getCart, cartLines, cartCount, addToCart, setQty, incLine, decLine, removeLine, clearCart,
    onChange, getStock, setStock, bumpStock, lineId,
    // kupon
    applyCoupon, removeCoupon, getCoupon,
    // hesap
    subtotal, discountAmount, discountedSubtotal, shippingCost, total, freeShippingRemaining,
    // sipariş
    getOrders, createOrder, setOrderStatus, getOrder, STATUS,
    // diğer
    getFavs, isFav, toggleFav, exportJSON, resetAll
  };
})();
