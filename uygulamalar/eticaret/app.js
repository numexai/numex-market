/* ATELIER — Çekirdek uygulama. Tüm sayfalar aynı dosyayı yükler,
   hangi sayfada olduğunu <body data-page="..."> üzerinden anlar. */

/* ---------- Depolama ---------- */
const DB = {
  sep: 'atelier.sepet.v1',
  fav: 'atelier.favoriler.v1',
  sip: 'atelier.siparisler.v1',
  urun: 'atelier.urunler.v1',
  kupon: 'atelier.kupon.v1'
};
const oku = (k, varsayilan) => {
  try { const v = JSON.parse(localStorage.getItem(k)); return v ?? varsayilan; }
  catch { return varsayilan; }
};
const yaz = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };

let urunler = oku(DB.urun, null) || JSON.parse(JSON.stringify(PRODUCTS));
let sepet = oku(DB.sep, []);
let favoriler = oku(DB.fav, []);
let siparisler = oku(DB.sip, []);
let kupon = oku(DB.kupon, '');

const urunBul = (id) => urunler.find(p => p.id === id);
const para = (n) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', minimumFractionDigits: 0 }).format(n);
const yildiz = (p) => '★★★★★'.slice(0, Math.round(p)) + '☆☆☆☆☆'.slice(0, 5 - Math.round(p));

/* ---------- Sepet motoru ---------- */
const sepKey = (id, varyant) => id + '|' + varyant;

function sepeteEkle(id, varyant, adet = 1) {
  const p = urunBul(id); if (!p) return;
  const v = varyant || (p.varyantlar[0].secenekler.join(' / '));
  const m = sepet.find(s => s.key === sepKey(id, v));
  const mevcut = m ? m.adet : 0;
  const yeni = Math.min(mevcut + adet, p.stok);
  if (yeni === mevcut) { toast(p.stok === 0 ? 'Bu ürün stok dışı.' : 'Stok sınırına ulaştın.', true); return; }
  if (m) m.adet = yeni; else sepet.push({ key: sepKey(id, v), id, varyant: v, adet: yeni });
  kaydetSepet(); toast('Sepete eklendi');
  sepetCiz();
}
function adetAyarla(key, delta) {
  const s = sepet.find(x => x.key === key); if (!s) return;
  const p = urunBul(s.id);
  const yeni = s.adet + delta;
  if (yeni > p.stok) { toast('Stok sınırı: ' + p.stok + ' adet', true); return; }
  if (yeni < 1) { sepetSil(key); return; }
  s.adet = yeni; kaydetSepet(); sepetCiz();
}
function sepetSil(key) {
  sepet = sepet.filter(s => s.key !== key);
  kaydetSepet(); sepetCiz(); toast('Ürün sepetten çıkarıldı');
}
function kaydetSepet() { yaz(DB.sep, sepet); rozetGuncelle(); }

function sepetTutar() {
  const kalemler = sepet.map(s => {
    const p = urunBul(s.id); if (!p) return null;
    return { ...s, urun: p, toplam: p.fiyat * s.adet };
  }).filter(Boolean);
  const ara = kalemler.reduce((t, k) => t + k.toplam, 0);

  let indirim = 0, kuponGecerli = false;
  if (kupon && COUPONS[kupon] && ara > 0) {
    const c = COUPONS[kupon];
    indirim = c.tip === 'yuzde' ? Math.round(ara * c.deger / 100) : c.deger;
    indirim = Math.min(indirim, ara);
    kuponGecerli = true;
  }
  const indirimliAra = ara - indirim;
  const kargoYontem = window.__kargoYontem || 'standart';
  const S = SHIPPING[kargoYontem];
  const kargo = ara === 0 ? 0 : (indirimliAra >= S.esik ? 0 : S.ucret);
  const toplam = indirimliAra + kargo;
  const adet = kalemler.reduce((t, k) => t + k.adet, 0);
  return { kalemler, ara, indirim, kuponGecerli, kargo, kargoYontem, toplam, adet };
}

/* ---------- Favoriler ---------- */
function favToggle(id) {
  if (favoriler.includes(id)) { favoriler = favoriler.filter(x => x !== id); toast('Favorilerden çıkarıldı'); }
  else { favoriler.push(id); toast('Favorilere eklendi'); }
  yaz(DB.fav, favoriler); rozetGuncelle();
  document.querySelectorAll('[data-fav="' + id + '"]').forEach(b => b.classList.toggle('aktif', favoriler.includes(id)));
}

/* ---------- Ortak parçalar ---------- */
function toast(mesaj, hata = false) {
  let t = document.querySelector('.toast');
  if (!t) { t = document.createElement('div'); t.className = 'toast'; document.body.appendChild(t); }
  t.textContent = mesaj;
  t.classList.toggle('hata', hata);
  t.classList.add('gorunur');
  clearTimeout(t._z); t._z = setTimeout(() => t.classList.remove('gorunur'), 2600);
}
function rozetGuncelle() {
  const n = sepet.reduce((t, s) => t + s.adet, 0);
  document.querySelectorAll('[data-cart-count]').forEach(e => {
    e.textContent = n;
    e.classList.toggle('sifir', n === 0);
  });
  document.querySelectorAll('[data-fav-count]').forEach(e => e.textContent = favoriler.length || '');
}

function urunKarti(p) {
  const f = favoriler.includes(p.id);
  const kategori = CATEGORIES.find(c => c.id === p.kategori)?.ad || '';
  return `
  <article class="urun-kart" data-id="${p.id}">
    <a class="urun-kart-gorsel" href="urun.html?id=${p.id}" aria-label="${p.ad}">
      <img src="${p.gorsel}" alt="${p.ad} — ${kategori}" loading="lazy">
      ${p.stok === 0 ? '<span class="etiket tukendi">Tükendi</span>' : p.yeni ? '<span class="etiket yeni">Yeni</span>' : ''}
      <button class="fav-btn ${f ? 'aktif' : ''}" data-fav="${p.id}" type="button" aria-label="Favorilere ekle" aria-pressed="${f}">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20.5 4.7 13.4a4.8 4.8 0 0 1 0-6.9 4.9 4.9 0 0 1 6.9 0l.4.4.4-.4a4.9 4.9 0 0 1 6.9 0 4.8 4.8 0 0 1 0 6.9Z"/></svg>
      </button>
    </a>
    <div class="urun-kart-bilgi">
      <p class="mini-kategori">${kategori}</p>
      <h3><a href="urun.html?id=${p.id}">${p.ad}</a></h3>
      <p class="kart-puan"><span aria-hidden="true">${yildiz(p.puan)}</span> <span class="solgun">${p.puan.toFixed(1)} (${p.yorum})</span></p>
      <div class="kart-alt">
        <span class="fiyat">${para(p.fiyat)}</span>
        <button class="ikincil-btn kucuk" data-ekle="${p.id}" ${p.stok === 0 ? 'disabled' : ''}>${p.stok === 0 ? 'Tükendi' : 'Sepete Ekle'}</button>
      </div>
    </div>
  </article>`;
}

// Karttaki "Sepete Ekle" -> ilk varyantla ekler
document.addEventListener('click', (e) => {
  const ek = e.target.closest('[data-ekle]');
  if (ek) { sepeteEkle(ek.dataset.ekle, null, 1); return; }
  const fv = e.target.closest('[data-fav]');
  if (fv) { e.preventDefault(); fv.classList.add('pulse'); setTimeout(() => fv.classList.remove('pulse'), 320); favToggle(fv.dataset.fav); }
});

/* ---------- Sepet çekmecesi ---------- */
function sepetCiz() {
  const d = sepetTutar();
  const govde = document.querySelector('[data-cart-body]');
  if (!govde) return;
  if (d.kalemler.length === 0) {
    govde.innerHTML = `<div class="bos-durum">
      <p>Sepetin şu an boş — henüz bir sofra kurulmadı.</p>
      <a class="birincil-btn" href="magaza.html">Koleksiyona Göz At</a></div>`;
  } else {
    govde.innerHTML = d.kalemler.map(k => `
      <div class="cekmec-kalem">
        <img src="${k.urun.gorsel}" alt="">
        <div class="cekmec-bilgi">
          <p class="ad">${k.urun.ad}</p>
          <p class="varyant">${k.varyant}</p>
          <div class="adet-kontrol" role="group" aria-label="Adet">
            <button data-azalt="${k.key}" aria-label="Azalt">−</button>
            <span aria-live="polite">${k.adet}</span>
            <button data-artir="${k.key}" aria-label="Artır">+</button>
          </div>
        </div>
        <div class="cekmec-sag">
          <span class="fiyat">${para(k.toplam)}</span>
          <button class="link-sil" data-sil="${k.key}">Sil</button>
        </div>
      </div>`).join('');
  }
  const ozet = document.querySelector('[data-cart-summary]');
  if (ozet) ozet.innerHTML = `
    <div class="satir"><span>Ara toplam (${d.adet} ürün)</span><span>${para(d.ara)}</span></div>
    ${d.indirim > 0 ? `<div class="satir iyi"><span>İndirim</span><span>−${para(d.indirim)}</span></div>` : ''}
    <div class="satir"><span>Kargo</span><span>${d.ara === 0 ? '—' : d.kargo === 0 ? 'Ücretsiz' : para(d.kargo)}</span></div>
    <div class="satir toplam"><span>Toplam</span><span>${para(d.toplam)}</span></div>`;
  document.querySelectorAll('[data-cart-link]').forEach(a => a.classList.toggle('solgun', d.adet === 0));
  rozetGuncelle();
  // NUMEX-DÜZELTME (2026-11-19): Sepet sayfası kendi listesini ayrı çiziyordu; çekmeceden yapılan adet/sil değişikliği sayfaya yansımıyordu. sepete bağlı tazeleme eklendi.
  if (window.__sepetSayfaCiz) window.__sepetSayfaCiz();
}

document.addEventListener('click', (e) => {
  const az = e.target.closest('[data-azalt]'); if (az) return adetAyarla(az.dataset.azalt, -1);
  const ar = e.target.closest('[data-artir]'); if (ar) return adetAyarla(ar.dataset.artir, +1);
  const sl = e.target.closest('[data-sil]'); if (sl) return sepetSil(sl.dataset.sil);
});

function cekmeceAc(kapat = false) {
  const c = document.querySelector('[data-cart-drawer]'); if (!c) return;
  c.classList.toggle('acik', !kapat);
  document.body.classList.toggle('scroll-kilit', !kapat);
  const ov = document.querySelector('[data-drawer-overlay]');
  if (ov) ov.classList.toggle('acik', !kapat);
}

/* ---------- Üst bar / menus ---------- */
function ustBarKur() {
  document.querySelectorAll('[data-open-cart]').forEach(b => b.addEventListener('click', () => cekmeceAc()));
  document.querySelectorAll('[data-close-cart]').forEach(b => b.addEventListener('click', () => cekmeceAc(true)));
  const ov = document.querySelector('[data-drawer-overlay]');
  if (ov) ov.addEventListener('click', () => cekmeceAc(true));
  const mob = document.querySelector('[data-mobile-toggle]');
  if (mob) mob.addEventListener('click', () => {
    const m = document.querySelector('[data-mobile-nav]');
    const acik = m.classList.toggle('acik');
    mob.setAttribute('aria-expanded', acik);
    document.body.classList.toggle('scroll-kilit', acik);
  });
  document.querySelectorAll('[data-mobile-nav] a').forEach(a => a.addEventListener('click', () => {
    document.querySelector('[data-mobile-nav]').classList.remove('acik');
    document.querySelector('[data-mobile-toggle]').setAttribute('aria-expanded', 'false');
    document.body.classList.remove('scroll-kilit');
  }));
  // aktif nav
  const sayfa = document.body.dataset.page;
  document.querySelectorAll('[data-nav]').forEach(a => a.classList.toggle('aktif', a.dataset.nav === sayfa));

  // Bülten
  const nl = document.querySelector('[data-newsletter]');
  if (nl) nl.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!nl.checkValidity()) return;
    nl.reset(); toast('Bülten kaydın alındı — teşekkürler!');
  });

  // Global arama
  document.querySelectorAll('[data-search-form]').forEach(f => f.addEventListener('submit', (e) => {
    e.preventDefault();
    const q = f.querySelector('input').value.trim();
    location.href = 'magaza.html' + (q ? '?q=' + encodeURIComponent(q) : '');
  }));

  // Scroll reveal
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((ents) => {
      ents.forEach(en => { if (en.isIntersecting) { en.target.classList.add('gorundu'); io.unobserve(en.target); } });
    }, { threshold: 0.12 });
    document.querySelectorAll('[data-reveal]').forEach(el => io.observe(el));
  } else {
    document.querySelectorAll('[data-reveal]').forEach(el => el.classList.add('gorundu'));
  }
  // Yıl
  document.querySelectorAll('[data-yil]').forEach(e => e.textContent = new Date().getFullYear());
}

/* ---------- Ana sayfa ---------- */
function anaSayfaKur() {
  const one = document.querySelector('[data-populer]');
  if (one) one.innerHTML = urunler.filter(p => p.populer).slice(0, 4).map(urunKarti).join('') ||
    urunler.slice(0, 4).map(urunKarti).join('');
  // NUMEX-DÜZELTME (2026-11-19): Ana sayfada "Sezonun seçkileri" ve "Yeni Gelenler" blokları aynı ürünleri gösteriyordu; yeni gelenler artık popüler blokta gösterilmeyen ürünlerden seçiliyor.
  // Yeni Gelenler: popüler bloktaki ürünleri TEKRAR etmesin
  const sec = document.querySelector('[data-secim]');
  if (sec) {
    const populerIdler = (one ? [...one.querySelectorAll('.urun-kart')] : []).map(c => c.dataset.id);
    const secili = urunler.filter(p => p.yeni && !populerIdler.includes(p.id)).slice(0, 4);
    const doldur = secili.length < 4
      ? secili.concat(urunler.filter(p => !populerIdler.includes(p.id) && !secili.includes(p)).slice(0, 4 - secili.length))
      : secili;
    sec.innerHTML = doldur.map(urunKarti).join('');
  }
}

/* ---------- Katalog ---------- */
function katalogKur() {
  const sp = new URLSearchParams(location.search);
  const state = {
    q: sp.get('q') || '',
    kat: sp.get('kategori') || 'tumu',
    siralama: sp.get('sirala') || 'onerilen',
    fmin: '', fmax: '', favoriler: sp.get('favoriler') === '1'
  };
  if (state.q) document.querySelector('[data-q]').value = state.q;
  if (state.siralama !== 'onerilen') document.querySelector('[data-siralama]').value = state.siralama;
  if (state.favoriler) document.querySelector('[data-favori-filtre]').classList.add('aktif');

  const liste = document.querySelector('[data-urun-liste]');
  const sayac = document.querySelector('[data-sayac]');
  const bos = document.querySelector('[data-bos]');

  function uygula() {
    let d = urunler.slice();
    if (state.kat !== 'tumu' && state.kat !== 'favoriler') d = d.filter(p => p.kategori === state.kat);
    if (state.favoriler) d = d.filter(p => favoriler.includes(p.id));
    if (state.q) {
      const q = state.q.toLocaleLowerCase('tr');
      d = d.filter(p => (p.ad + ' ' + p.aciklama + ' ' + p.kategori).toLocaleLowerCase('tr').includes(q));
    }
    if (state.fmin !== '') d = d.filter(p => p.fiyat >= +state.fmin);
    if (state.fmax !== '') d = d.filter(p => p.fiyat <= +state.fmax);
    switch (state.siralama) {
      case 'artan': d.sort((a, b) => a.fiyat - b.fiyat); break;
      case 'azalan': d.sort((a, b) => b.fiyat - a.fiyat); break;
      case 'puan': d.sort((a, b) => b.puan - a.puan); break;
      case 'yeni': d.sort((a, b) => (b.yeni || 0) - (a.yeni || 0)); break;
      default: d.sort((a, b) => (b.populer || 0) - (a.populer || 0));
    }
    liste.innerHTML = d.map(urunKarti).join('');
    sayac.textContent = d.length + ' ürün';
    bos.style.display = d.length === 0 ? '' : 'none';
    // çip durumları
    document.querySelectorAll('[data-kat-btn]').forEach(b => b.classList.toggle('aktif', b.dataset.katBtn === state.kat && !state.favoriler));
  }

  document.querySelectorAll('[data-kat-btn]').forEach(b => b.addEventListener('click', () => {
    state.kat = b.dataset.katBtn; state.favoriler = false; uygula();
  }));
  const araInp = document.querySelector('[data-q]');
  araInp.addEventListener('input', () => { state.q = araInp.value; uygula(); });
  document.querySelector('[data-siralama]').addEventListener('change', e => { state.siralama = e.target.value; uygula(); });
  document.querySelector('[data-fmin]').addEventListener('input', e => { state.fmin = e.target.value; uygula(); });
  document.querySelector('[data-fmax]').addEventListener('input', e => { state.fmax = e.target.value; uygula(); });
  document.querySelector('[data-favori-filtre]').addEventListener('click', (e) => {
    state.favoriler = !state.favoriler;
    e.currentTarget.classList.toggle('aktif', state.favoriler);
    uygula();
  });
  document.querySelector('[data-filtre-temizle]').addEventListener('click', () => {
    state.q = ''; state.kat = 'tumu'; state.fmin = ''; state.fmax = ''; state.favoriler = false; state.siralama = 'onerilen';
    araInp.value = ''; document.querySelector('[data-fmin]').value = ''; document.querySelector('[data-fmax]').value = '';
    document.querySelector('[data-siralama]').value = 'onerilen';
    document.querySelector('[data-favori-filtre]').classList.remove('aktif');
    uygula();
  });
  uygula();
}

/* ---------- Ürün detay ---------- */
function detayKur() {
  const id = new URLSearchParams(location.search).get('id');
  const p = urunBul(id);
  const kok = document.querySelector('[data-detay]');
  if (!p) { kok.innerHTML = `<div class="bos-durum geniş"><h2>Ürün bulunamadı</h2><a class="birincil-btn" href="magaza.html">Kataloğa dön</a></div>`; return; }
  document.title = p.ad + ' — ATELIER';
  const kategori = CATEGORIES.find(c => c.id === p.kategori)?.ad || '';
  let secili = p.varyantlar.map(v => v.secenekler[0]);
  let adet = 1;

  kok.innerHTML = `
  <nav class="kirinti" aria-label="Yol"><a href="index.html">Ana Sayfa</a> / <a href="magaza.html">Mağaza</a> / <a href="magaza.html?kategori=${p.kategori}">${kategori}</a> / <span>${p.ad}</span></nav>
  <div class="detay-izgara">
    <div class="galeri">
      <div class="galeri-buyuk"><img data-buyuk src="${p.galeri[0]}" alt="${p.ad}"></div>
      <div class="galeri-kucuk">${p.galeri.map((g, i) => `<button class="kucuk-img ${i === 0 ? 'aktif' : ''}" data-img="${g}" aria-label="Görsel ${i + 1}"><img src="${g}" alt=""></button>`).join('')}</div>
    </div>
    <div class="detay-bilgi">
      <p class="mini-kategori">${kategori}</p>
      <h1>${p.ad}</h1>
      <p class="puan-buyuk"><span aria-hidden="true">${yildiz(p.puan)}</span> <span class="solgun">${p.puan.toFixed(1)} · ${p.yorum} değerlendirme</span></p>
      <p class="detay-fiyat" data-fiyat>${para(p.fiyat)}</p>
      <p class="stok-durum" data-stok>${p.stok === 0 ? 'Tükendi' : p.stok <= 5 ? 'Son ' + p.stok + ' adet' : 'Stokta ' + p.stok + ' adet'}</p>
      <p class="aciklama-metin">${p.aciklama}</p>

      ${p.varyantlar.map((v, vi) => `
        <div class="varyant-grup" data-varyant-grup="${vi}" role="group" aria-label="${v.tip} seçimi">
          <p class="varyant-baslik">${v.tip}: <strong data-varyant-deger="${vi}">${v.secenekler[0]}</strong></p>
          <div class="varyant-secenekler">
            ${v.secenekler.map((s, si) => `<button type="button" class="cip ${si === 0 ? 'aktif' : ''}" data-varyant="${vi}" data-sec="${s}">${s}</button>`).join('')}
          </div>
        </div>`).join('')}

      <div class="adet-satir">
        <div class="adet-buyuk" role="group" aria-label="Adet">
          <button data-adet-azalt aria-label="Adet azalt" ${p.stok === 0 ? 'disabled' : ''}>−</button>
          <span data-adet-deger>1</span>
          <button data-adet-artir aria-label="Adet artır" ${p.stok === 0 ? 'disabled' : ''}>+</button>
        </div>
        <button class="birincil-btn buyuk geniş" data-sepete ${p.stok === 0 ? 'disabled' : ''}>${p.stok === 0 ? 'Tükendi' : 'Sepete Ekle'}</button>
      </div>
      <button class="ikincil-btn geniş" data-fav-detay>${favoriler.includes(p.id) ? '♥ Favorilerde' : '♡ Favorilere Ekle'}</button>

      <div class="bilgi-kutulari">
        <details open><summary>Teslimat</summary><p>1-2 iş günü içinde kargoya verilir. 2.500 TL ve üzeri standart kargo ücretsizdir. Hızlı kargo seçeneği ödeme adımında sunulur.</p></details>
        <details><summary>İade & Değişim</summary><p>Teslimattan itibaren 14 gün içinde, kullanılmamış ürünler için koşulsuz iade. Varyant hatalarında kargo ücreti bizden.</p></details>
        <details><summary>Bakım</summary><p>Yumuşak, kuru bezle silin. Doğrudan öğle güneşinden uzak tutun; sırlı seramiği bulaşık makinesinde değil elde yıkayın.</p></details>
      </div>
    </div>
  </div>

  <section class="ilgili">
    <h2>Bunlar da ilgini çekebilir</h2>
    <div class="urun-izgara">${urunler.filter(x => x.kategori === p.kategori && x.id !== p.id).slice(0, 4).map(urunKarti).join('') ||
      urunler.filter(x => x.id !== p.id).slice(0, 4).map(urunKarti).join('')}</div>
  </section>`;

  // Galeri
  kok.querySelectorAll('[data-img]').forEach(b => b.addEventListener('click', () => {
    kok.querySelector('[data-buyuk]').src = b.dataset.img;
    kok.querySelectorAll('.kucuk-img').forEach(x => x.classList.toggle('aktif', x === b));
  }));
  // Varyant
  kok.querySelectorAll('[data-varyant]').forEach(b => b.addEventListener('click', () => {
    const vi = +b.dataset.varyant;
    secili[vi] = b.dataset.sec;
    kok.querySelectorAll(`[data-varyant="${vi}"]`).forEach(x => x.classList.toggle('aktif', x === b));
    kok.querySelector(`[data-varyant-deger="${vi}"]`).textContent = b.dataset.sec;
  }));
  // Adet
  const adetDeger = kok.querySelector('[data-adet-deger]');
  kok.querySelector('[data-adet-artir]').addEventListener('click', () => {
    if (adet >= p.stok) { toast('Stok sınırı: ' + p.stok + ' adet', true); return; }
    adetDeger.textContent = ++adet;
  });
  kok.querySelector('[data-adet-azalt]').addEventListener('click', () => {
    if (adet <= 1) return; adetDeger.textContent = --adet;
  });
  // Sepete
  kok.querySelector('[data-sepete]').addEventListener('click', () => {
    sepeteEkle(p.id, secili.join(' / '), adet);
    cekmeceAc();
  });
  // Favori
  kok.querySelector('[data-fav-detay]').addEventListener('click', (e) => {
    favToggle(p.id);
    e.currentTarget.textContent = favoriler.includes(p.id) ? '♥ Favorilerde' : '♡ Favorilere Ekle';
  });
}

/* ---------- Sepet sayfası ---------- */
function sepetSayfaKur() {
  const kok = document.querySelector('[data-sepet-sayfa]');
  if (!kok) return;
  function ciz() {
    const d = sepetTutar();
    if (d.kalemler.length === 0) {
      kok.innerHTML = `<div class="bos-durum geniş">
        <h2>Sepetin boş</h2>
        <p>Henüz bir sofra kurulmadı. Koleksiyona dönüp bir parça seç.</p>
        <a class="birincil-btn" href="magaza.html">Koleksiyona Göz At</a></div>`;
      return;
    }
    kok.innerHTML = `
      <div class="sepet-duzen">
        <div class="sepet-liste">
          ${d.kalemler.map(k => `
            <div class="sepet-kalem">
              <img src="${k.urun.gorsel}" alt="${k.urun.ad}">
              <div>
                <p class="mini-kategori">${CATEGORIES.find(c => c.id === k.urun.kategori)?.ad}</p>
                <h3><a href="urun.html?id=${k.urun.id}">${k.urun.ad}</a></h3>
                <p class="varyant">${k.varyant}</p>
                <p class="solgun kucuk-yazi">Birim: ${para(k.urun.fiyat)} · Stok: ${k.urun.stok}</p>
                <div class="adet-kontrol" role="group" aria-label="Adet">
                  <button data-azalt="${k.key}" aria-label="Azalt">−</button><span>${k.adet}</span><button data-artir="${k.key}" aria-label="Artır">+</button>
                </div>
              </div>
              <div class="sepet-sag">
                <span class="fiyat">${para(k.toplam)}</span>
                <button class="link-sil" data-sil="${k.key}">Çıkar</button>
              </div>
            </div>`).join('')}
        </div>
        <aside class="ozet-kart">
          <h2>Sipariş Özeti</h2>
          <div class="satir"><span>Ara toplam (${d.adet} ürün)</span><span>${para(d.ara)}</span></div>
          ${d.indirim > 0 ? `<div class="satir iyi"><span>ATELIER10 indirimi (ürünlerin %10'u)</span><span>−${para(d.indirim)}</span></div>` : ''}
          <div class="satir"><span>Kargo (${SHIPPING[d.kargoYontem].ad.split(' ')[0]})</span><span>${d.kargo === 0 ? 'Ücretsiz' : para(d.kargo)}</span></div>
          <div class="satir toplam"><span>Ödenecek</span><span>${para(d.toplam)}</span></div>
          <form class="kupon-form" data-kupon-form>
            <label for="kupon-inp" class="solgun kucuk-yazi">İndirim kodu</label>
            <div><input id="kupon-inp" placeholder="ATELIER10" value="${kupon}" autocomplete="off"><button class="ikincil-btn kucuk" type="submit">Uygula</button></div>
          </form>
          ${kupon && !d.kuponGecerli ? '<p class="hata-yazi">Geçersiz kupon kodu.</p>' : ''}
          ${d.indirim > 0 ? `<p class="kucuk-yazi solgun">İndirim, indirim öncesi ürün toplamı ${para(d.ara)} üzerinden hesaplandı.</p>` : ''}
          <a class="birincil-btn buyuk geniş" href="odeme.html">Ödemeye Geç</a>
          <p class="kucuk-yazi solgun">Kargo ücretsiz eşiği: ${para(SHIPPING.standart.esik)}</p>
        </aside>
      </div>`;
    kok.querySelector('[data-kupon-form]').addEventListener('submit', (e) => {
      e.preventDefault();
      const kod = e.target.querySelector('input').value.trim().toUpperCase();
      if (!kod) { kupon = ''; yaz(DB.kupon, ''); ciz(); return; }
      if (COUPONS[kod]) { kupon = kod; yaz(DB.kupon, kod); toast('Kupon uygulandı: −%' + COUPONS[kod].deger); }
      else { kupon = kod; yaz(DB.kupon, kod); toast('Geçersiz kupon kodu', true); }
      ciz();
    });
    // adet/sil olayları ana listener'da yakalanıyor; ama sepet sayfası içi listeyi yenileyelim
    kok.querySelectorAll('[data-azalt],[data-artir],[data-sil]').forEach(b => b.addEventListener('click', () => setTimeout(ciz, 0)));
  }
  ciz();
  // çekmecedeki adet/sil işlemleri de bu listeyi tazelesin
  window.__sepetSayfaCiz = ciz;
}

/* ---------- Ödeme ---------- */
function odemeKur() {
  const form = document.querySelector('[data-odeme-form]');
  // NUMEX-DÜZELTME (2026-11-19): Sepet boşken ödeme sayfası forma hiç bağlanmıyor, boş bir kutuda kalıyordu; artık ne olduğunu söyleyen ve çıkış yolu (mağaza / son sipariş) sunan bir ekran gösteriyor.
  const d = sepetTutar();
  if (d.kalemler.length === 0) {
    // boş sepet: forma hiç girme, kullanıcıyı ne yapacağı belli bir ekranla karşıla
    const sonSiparis = siparisler[0];
    document.querySelector('[data-odeme-kok]').innerHTML = `<div class="bos-durum geniş">
      <h2>Sepetin boş</h2>
      <p>Ödeme yapabilmek için önce sepete bir parça eklemelisin.</p>
      <div class="tamam-aksiyon">
        <a class="birincil-btn" href="magaza.html">Mağazaya Git</a>
        ${sonSiparis ? `<a class="ikincil-btn" href="siparis-tamam.html?no=${sonSiparis.no}">Son Siparişi Gör (${sonSiparis.no})</a>` : ''}
      </div></div>`;
    return;
  }
  if (!form) return;
  // kargo yöntemi
  let kargoYontem = 'standart';
  window.__kargoYontem = kargoYontem;
  function kargoCiz() {
    const t = sepetTutar();
    document.querySelector('[data-odeme-ozet]').innerHTML = `
      <h2>Sipariş Özeti</h2>
      ${t.kalemler.map(k => `<div class="satir mini"><span>${k.urun.ad} × ${k.adet}<br><small class="solgun">${k.varyant}</small></span><span>${para(k.toplam)}</span></div>`).join('')}
      <hr>
      <div class="satir"><span>Ara toplam</span><span>${para(t.ara)}</span></div>
      ${t.indirim > 0 ? `<div class="satir iyi"><span>İndirim (${kupon})</span><span>−${para(t.indirim)}</span></div>` : ''}
      <div class="satir"><span>Kargo</span><span>${t.kargo === 0 ? 'Ücretsiz' : para(t.kargo)}</span></div>
      <div class="satir toplam"><span>Toplam</span><span>${para(t.toplam)}</span></div>`;
  }
  kargoCiz();
  form.querySelectorAll('[name="kargo"]').forEach(r => r.addEventListener('change', () => {
    kargoYontem = form.querySelector('[name="kargo"]:checked').value;
    window.__kargoYontem = kargoYontem; kargoCiz();
  }));

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!form.checkValidity()) { form.querySelectorAll(':invalid')[0]?.focus(); toast('Lütfen zorunlu alanları doldur.', true); return; }
    const fd = new FormData(form);
    const t = sepetTutar();
    // kart son 4 hanesi yalnız simülasyon için; tam kart bilgisi istenmez
    const siparis = {
      no: 'ATL-' + String(Date.now()).slice(-6),
      tarih: new Date().toISOString(),
      musteri: { ad: fd.get('ad'), soyad: fd.get('soyad'), email: fd.get('email'), telefon: fd.get('telefon') },
      adres: { il: fd.get('il'), ilce: fd.get('ilce'), adres: fd.get('adres'), posta: fd.get('posta') },
      kargo: SHIPPING[t.kargoYontem].ad,
      kalemler: t.kalemler.map(k => ({ id: k.urun.id, ad: k.urun.ad, varyant: k.varyant, adet: k.adet, birim: k.urun.fiyat, toplam: k.toplam })),
      ara: t.ara, indirim: t.indirim, kargoUcret: t.kargo, toplam: t.toplam,
      durum: 'Yeni', odeme: 'Simülasyon (kart bilgisi saklanmadı)'
    };
    siparisler.unshift(siparis); yaz(DB.sip, siparisler);
    // stok düş
    siparis.kalemler.forEach(k => { const p = urunBul(k.id); if (p) p.stok = Math.max(0, p.stok - k.adet); });
    yaz(DB.urun, urunler);
    sepet = []; kupon = ''; yaz(DB.sep, sepet); yaz(DB.kupon, '');
    location.href = 'siparis-tamam.html?no=' + siparis.no;
  });
}

function siparisTamamKur() {
  const no = new URLSearchParams(location.search).get('no');
  // NUMEX-DÜZELTME (2026-11-19): Sayfa `no` parametresi olmadan açıldığında sipariş bulunamıyordu; kok elemanı erken bağlanıp son siparişe düşülmesi sağlandı.
  const kok = document.querySelector('[data-tamam]'); if (!kok) return;
  const s = (no && siparisler.find(x => x.no === no)) || siparisler[0];
  if (!s) { kok.innerHTML = '<div class="bos-durum geniş"><h2>Sipariş bulunamadı</h2><a class="birincil-btn" href="index.html">Ana sayfa</a></div>'; return; }
  kok.innerHTML = `
    <div class="tamam-kart">
      <p class="tamam-ikon">✓</p>
      <h1>Teşekkürler${s.musteri.ad ? ', ' + s.musteri.ad : ''}!</h1>
      <p class="solgun">Siparişin alındı. Bu bir demo simülasyonudur — gerçek ödeme alınmadı.</p>
      <p class="siparis-no">Sipariş No: <strong>${s.no}</strong></p>
      <div class="tamam-ozet">
        ${s.kalemler.map(k => `<div class="satir"><span>${k.ad} × ${k.adet}<br><small class="solgun">${k.varyant}</small></span><span>${para(k.toplam)}</span></div>`).join('')}
        <hr>
        <div class="satir"><span>Ara toplam</span><span>${para(s.ara)}</span></div>
        ${s.indirim ? `<div class="satir iyi"><span>İndirim</span><span>−${para(s.indirim)}</span></div>` : ''}
        <div class="satir"><span>Kargo</span><span>${s.kargoUcret === 0 ? 'Ücretsiz' : para(s.kargoUcret)}</span></div>
        <div class="satir toplam"><span>Toplam</span><span>${para(s.toplam)}</span></div>
      </div>
      <div class="tamam-aksiyon">
        <a class="birincil-btn" href="magaza.html">Alışverişe Devam</a>
        <a class="ikincil-btn" href="panel.html">Siparişleri Gör (Panel)</a>
      </div>
    </div>`;
}

/* ---------- Yönetim paneli ---------- */
function panelKur() {
  const kok = document.querySelector('[data-panel]'); if (!kok) return;
  function ciz() {
    const gelir = siparisler.filter(s => s.durum !== 'İptal').reduce((t, s) => t + s.toplam, 0);
    const satilanAdet = siparisler.reduce((t, s) => t + s.kalemler.reduce((a, k) => a + k.adet, 0), 0);
    const dusukStok = urunler.filter(p => p.stok <= 5).length;
    kok.innerHTML = `
      <div class="panel-uyari">⚠ Bu bir <strong>demo panelidir</strong>. Gerçek yönetici kimlik doğrulaması yoktur ve veriler tarayıcınızda saklanır. Gerçek mağaza yayınına alınmadan önce kimlik doğrulama ve sunucu tarafı eklenmelidir.</div>
      <div class="istatistik-izgara">
        <div class="istat"><p class="etiket">Toplam Sipariş</p><p class="deger">${siparisler.length}</p></div>
        <div class="istat"><p class="etiket">Toplam Gelir</p><p class="deger">${para(gelir)}</p></div>
        <div class="istat"><p class="etiket">Satılan Ürün</p><p class="deger">${satilanAdet}</p></div>
        <div class="istat"><p class="etiket">Düşük Stok (≤5)</p><p class="deger">${dusukStok}</p></div>
      </div>

      <section class="panel-bolum">
        <div class="bolum-baslik"><h2>Siparişler</h2><span class="solgun">${siparisler.length} kayıt</span></div>
        ${siparisler.length === 0 ? '<p class="solgun">Henüz sipariş yok. Ödeme adımından bir sipariş oluştur.</p>' : `
        <div class="tablo-sar">
        <table class="panel-tablo">
          <thead><tr><th>Sipariş</th><th>Tarih</th><th>Müşteri</th><th>Ürün</th><th>Toplam</th><th>Durum</th><th></th></tr></thead>
          <tbody>
            ${siparisler.map(s => `<tr>
              <td><strong>${s.no}</strong></td>
              <td>${new Date(s.tarih).toLocaleDateString('tr-TR')}</td>
              <td>${s.musteri.ad} ${s.musteri.soyad}</td>
              <td>${s.kalemler.reduce((a, k) => a + k.adet, 0)}</td>
              <td>${para(s.toplam)}</td>
              <td><select data-durum="${s.no}" aria-label="Sipariş durumu">
                ${['Yeni', 'Hazırlanıyor', 'Kargoda', 'Teslim edildi', 'İptal'].map(x => `<option ${s.durum === x ? 'selected' : ''}>${x}</option>`).join('')}
              </select></td>
              <td><button class="link-btn" data-detay="${s.no}">Detay</button></td>
            </tr>`).join('')}
          </tbody>
        </table></div>`}
      </section>

      <section class="panel-bolum">
        <div class="bolum-baslik"><h2>Ürün Stokları</h2><span class="solgun">${urunler.length} ürün</span></div>
        <div class="tablo-sar">
        <table class="panel-tablo">
          <thead><tr><th>Ürün</th><th>Kategori</th><th>Fiyat</th><th>Stok</th><th></th></tr></thead>
          <tbody>
            ${urunler.map(p => `<tr>
              <td><img class="mini-img" src="${p.gorsel}" alt=""> ${p.ad}</td>
              <td>${CATEGORIES.find(c => c.id === p.kategori)?.ad || ''}</td>
              <td><input class="kucuk-inp" type="number" min="0" step="10" value="${p.fiyat}" data-fiyat-inp="${p.id}" aria-label="${p.ad} fiyat"></td>
              <td><input class="kucuk-inp" type="number" min="0" value="${p.stok}" data-stok-inp="${p.id}" aria-label="${p.ad} stok"></td>
              <td><button class="link-btn" data-urun-yil="${p.id}">Kaydet</button></td>
            </tr>`).join('')}
          </tbody>
        </table></div>
      </section>

      <section class="panel-bolum">
        <div class="bolum-baslik"><h2>Yeni Ürün Ekle</h2></div>
        <form class="panel-form" data-urun-form>
          <div class="alan"><label for="nu-ad">Ürün adı</label><input id="nu-ad" name="ad" required></div>
          <div class="alan"><label for="nu-kat">Kategori</label><select id="nu-kat" name="kategori">${CATEGORIES.map(c => `<option value="${c.id}">${c.ad}</option>`).join('')}</select></div>
          <div class="alan"><label for="nu-fiyat">Fiyat (TL)</label><input id="nu-fiyat" name="fiyat" type="number" min="1" required></div>
          <div class="alan"><label for="nu-stok">Stok</label><input id="nu-stok" name="stok" type="number" min="0" required></div>
          <div class="alan geniş"><label for="nu-ac">Açıklama</label><textarea id="nu-ac" name="aciklama" rows="2"></textarea></div>
          <div class="alan geniş"><button class="birincil-btn" type="submit">Ürünü Ekle</button></div>
        </form>
      </section>

      <section class="panel-bolum">
        <div class="bolum-baslik"><h2>Veri Yönetimi</h2></div>
        <div class="veri-aksiyon">
          <button class="ikincil-btn" data-disa-urun>Ürünleri JSON indir</button>
          <button class="ikincil-btn" data-disa-sip>Siparişleri JSON indir</button>
          <button class="ikincil-btn tehlike" data-sifirla>Tüm örnek verileri sıfırla</button>
        </div>
      </section>`;

    // olaylar
    kok.querySelectorAll('[data-durum]').forEach(sel => sel.addEventListener('change', () => {
      const s = siparisler.find(x => x.no === sel.dataset.durum); if (s) s.durum = sel.value;
      yaz(DB.sip, siparisler); toast('Durum güncellendi');
    }));
    kok.querySelectorAll('[data-detay]').forEach(b => b.addEventListener('click', () => {
      const s = siparisler.find(x => x.no === b.dataset.detay); if (!s) return;
      alert(`Sipariş ${s.no}\n\nMüşteri: ${s.musteri.ad} ${s.musteri.soyad}\nE-posta: ${s.musteri.email}\nAdres: ${s.adres.il} / ${s.adres.ilce}\n${s.adres.adres}\nKargo: ${s.kargo}\n\n${s.kalemler.map(k => `• ${k.ad} (${k.varyant}) × ${k.adet} — ${para(k.toplam)}`).join('\n')}\n\nToplam: ${para(s.toplam)}`);
    }));
    kok.querySelectorAll('[data-urun-yil]').forEach(b => b.addEventListener('click', () => {
      const id = b.dataset.urun-yil;
      const p = urunBul(id); if (!p) return;
      p.fiyat = Math.max(0, +kok.querySelector('[data-fiyat-inp="' + id + '"]').value || 0);
      p.stok = Math.max(0, +kok.querySelector('[data-stok-inp="' + id + '"]').value || 0);
      yaz(DB.urun, urunler); toast('Ürün güncellendi'); ciz();
    }));
    kok.querySelector('[data-urun-form]').addEventListener('submit', (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const yeni = {
        id: 'atl-' + Date.now().toString().slice(-5),
        ad: fd.get('ad'), kategori: fd.get('kategori'),
        fiyat: +fd.get('fiyat'), stok: +fd.get('stok'),
        aciklama: fd.get('aciklama') || 'Yeni ürün.', gorsel: U('1493106641515-6b5631de4bb9'),
        galeri: [U('1493106641515-6b5631de4bb9'), U('1578500494198-246f612d3b3d')],
        varyantlar: [{ tip: 'Renk', secenekler: ['Standart'] }],
        puan: 5, yorum: 0, yeni: 1
      };
      urunler.push(yeni); yaz(DB.urun, urunler); toast('Ürün eklendi'); ciz();
    });
    kok.querySelector('[data-disa-urun]').addEventListener('click', () => jsonIndir('atelier-urunler.json', urunler));
    kok.querySelector('[data-disa-sip]').addEventListener('click', () => jsonIndir('atelier-siparisler.json', siparisler));
    kok.querySelector('[data-sifirla]').addEventListener('click', () => {
      if (!confirm('Tüm sepet, sipariş, favori ve ürün değişiklikleri silinecek. Emin misin?')) return;
      [DB.sep, DB.fav, DB.sip, DB.urun, DB.kupon].forEach(k => localStorage.removeItem(k));
      location.reload();
    });
  }
  ciz();
}

function jsonIndir(ad, veri) {
  const blob = new Blob([JSON.stringify(veri, null, 2)], { type: 'application/json' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = ad;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  toast('JSON dosyası indiriliyor');
}

/* ---------- Başlat ---------- */
document.addEventListener('DOMContentLoaded', () => {
  ustBarKur();
  sepetCiz();
  const sayfa = document.body.dataset.page;
  if (sayfa === 'ana') anaSayfaKur();
  if (sayfa === 'magaza') katalogKur();
  if (sayfa === 'urun') detayKur();
  if (sayfa === 'sepet') sepetSayfaKur();
  if (sayfa === 'odeme') odemeKur();
  if (sayfa === 'tamam') siparisTamamKur();
  if (sayfa === 'panel') panelKur();
});
