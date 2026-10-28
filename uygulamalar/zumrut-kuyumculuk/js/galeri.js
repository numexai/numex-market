/* ============================================================
   ZÜMRÜT KUYUMCULUK — VİTRİN GALERİSİ
   Ürün yükleme · Kategori filtreleme · Lightbox büyütme
   ============================================================ */
'use strict';

/* -------------------- DURUM -------------------- */
var aktifKategori = 'tumu';
var urunler = [];
var gorunenUrunler = [];
var lightboxIndex = 0;

/* Kategori görünen adları */
var KATEGORI_ADLARI = {
  bilezik: 'Bilezik',
  kolye: 'Kolye & Set',
  yuzuk: 'Yüzük',
  ceyrek: 'Çeyrek & Ata'
};

/* Kategori simgesi (SVG path) */
var KATEGORI_IKON = {
  bilezik: 'M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16zm0 4a4 4 0 1 1 0 8 4 4 0 0 1 0-8z',
  kolye:   'M12 3v6m-5 1a5 5 0 0 0 10 0M9 14l3 6 3-6',
  yuzuk:   'M12 8a5 5 0 1 1 0 10 5 5 0 0 1 0-10zm0-5l3 5H9l3-5z',
  ceyrek:  'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zm0 4a5 5 0 1 1 0 10 5 5 0 0 1 0-10z'
};

/* -------------------- VERİ -------------------- */

/**
 * Ürün verisini JSON'dan yükler; hata olursa boş dizi döner.
 * @returns {Promise<Array>}
 */
function urunleriYukle() {
  if (typeof fetch !== 'function') {
    return Promise.resolve([]);
  }
  return fetch('data/urunler.json')
    .then(function (yanit) {
      if (!yanit.ok) { throw new Error('urunler.json yüklenemedi: ' + yanit.status); }
      return yanit.json();
    })
    .then(function (veri) {
      if (!Array.isArray(veri)) { return []; }
      return veri;
    })
    .catch(function (hata) {
      console.warn('[Zümrüt Galeri] Ürün verisi okunamadı:', hata.message);
      return [];
    });
}

/* -------------------- DOM ÜRETİMİ -------------------- */

/**
 * Ürün görsel yer tutucusu (görsel yoksa altın elmas ikonu).
 * @param {string} kategori
 * @returns {SVGElement}
 */
function ikonOlustur(kategori) {
  var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('aria-hidden', 'true');
  var path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', KATEGORI_IKON[kategori] || KATEGORI_IKON.bilezik);
  path.setAttribute('fill', 'none');
  path.setAttribute('stroke', 'currentColor');
  path.setAttribute('stroke-width', '1.2');
  path.setAttribute('stroke-linecap', 'round');
  path.setAttribute('stroke-linejoin', 'round');
  svg.appendChild(path);
  return svg;
}

/**
 * Tek bir ürün kartı üretir.
 * @param {Object} urun
 * @param {number} index
 * @returns {HTMLElement}
 */
function urunKartOlustur(urun, index) {
  var kart = document.createElement('article');
  kart.className = 'urun-kart';
  kart.setAttribute('data-kategori', urun.kategori || 'diger');
  kart.setAttribute('data-id', String(urun.id));
  kart.setAttribute('data-index', String(index));
  kart.setAttribute('tabindex', '0');
  kart.setAttribute('role', 'button');
  kart.setAttribute('aria-label', (urun.ad || 'Ürün') + ' — büyütmek için tıklayın');
  kart.style.animationDelay = Math.min(index * 60, 480) + 'ms';

  // Görsel alanı
  var gorselKap = document.createElement('div');
  gorselKap.className = 'urun-gorsel';

  var img = document.createElement('img');
  img.setAttribute('alt', urun.ad || 'Kuyum ürünü');
  img.setAttribute('loading', 'lazy');
  img.setAttribute('decoding', 'async');
  img.src = urun.gorsel || '';

  // Görsel yüklenemezse ikona düş
  img.addEventListener('error', function () {
    img.remove();
    gorselKap.appendChild(ikonOlustur(urun.kategori));
  });

  gorselKap.appendChild(img);

  // Etiket
  if (urun.etiket) {
    var etiketEl = document.createElement('span');
    etiketEl.className = 'urun-etiket';
    etiketEl.textContent = urun.etiket;
    gorselKap.appendChild(etiketEl);
  }

  // Zoom ikonu
  var zoom = document.createElement('span');
  zoom.className = 'urun-zoom';
  zoom.setAttribute('aria-hidden', 'true');
  zoom.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5M11 8v6M8 11h6"/></svg>';
  gorselKap.appendChild(zoom);

  // Bilgi alanı
  var bilgi = document.createElement('div');
  bilgi.className = 'urun-bilgi';

  var katEl = document.createElement('span');
  katEl.className = 'urun-kategori';
  katEl.textContent = KATEGORI_ADLARI[urun.kategori] || 'Koleksiyon';

  var adEl = document.createElement('h3');
  adEl.textContent = urun.ad || 'Ürün';

  var fiyatEl = document.createElement('span');
  fiyatEl.className = 'urun-fiyat';
  fiyatEl.textContent = urun.fiyatMetni || urun.fiyat || 'Fiyat için arayın';

  bilgi.appendChild(katEl);
  bilgi.appendChild(adEl);
  bilgi.appendChild(fiyatEl);

  kart.appendChild(gorselKap);
  kart.appendChild(bilgi);

  // Tıklama / klavye
  kart.addEventListener('click', function () {
    var idx = parseInt(kart.getAttribute('data-index'), 10);
    var urunVeri = urunler[idx];
    if (urunVeri) { lightboxAc(urunVeri, idx); }
  });
  kart.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      kart.click();
    }
  });

  return kart;
}

/**
 * Ürün listesini grid'e basar.
 * @param {Array} liste
 */
function urunleriCiz(liste) {
  var grid = document.getElementById('urun-grid');
  if (!grid) { return; }
  grid.innerHTML = '';

  if (!liste || !liste.length) {
    var bos = document.createElement('p');
    bos.className = 'vitrin-bos';
    bos.textContent = 'Vitrin ürünleri şu anda yüklenemiyor. Lütfen daha sonra tekrar deneyin veya bizi arayın: 0500 000 00 00';
    grid.appendChild(bos);
    return;
  }

  var parca = document.createDocumentFragment();
  liste.forEach(function (urun, i) {
    parca.appendChild(urunKartOlustur(urun, i));
  });
  grid.appendChild(parca);
}

/* -------------------- FİLTRELEME -------------------- */

/**
 * Seçilen kategoriye göre kartları gösterir/gizler.
 * @param {string} kategori 'tumu' | 'bilezik' | 'kolye' | 'yuzuk' | 'ceyrek'
 */
function filtreUygula(kategori) {
  aktifKategori = kategori || 'tumu';
  var kartlar = document.querySelectorAll('#urun-grid .urun-kart');
  var sayi = 0;

  Array.prototype.forEach.call(kartlar, function (kart) {
    var kartKat = kart.getAttribute('data-kategori');
    var goster = (aktifKategori === 'tumu' || kartKat === aktifKategori);
    kart.classList.toggle('gizli', !goster);
    if (goster) {
      sayi++;
      // giriş animasyonunu yeniden tetikle
      kart.style.animation = 'none';
      void kart.offsetWidth;
      kart.style.animation = '';
    }
  });

  // Görünen ürünleri güncelle (lightbox gezinmesi için)
  gorunenUrunler = urunler.filter(function (u) {
    return aktifKategori === 'tumu' || u.kategori === aktifKategori;
  });

  // Sonuç yoksa bilgi mesajı
  var grid = document.getElementById('urun-grid');
  if (grid) {
    var mesaj = grid.querySelector('.vitrin-filtre-bos');
    if (sayi === 0 && kartlar.length > 0) {
      if (!mesaj) {
        mesaj = document.createElement('p');
        mesaj.className = 'vitrin-bos vitrin-filtre-bos';
        mesaj.textContent = 'Bu kategoride şu anda ürün bulunmuyor.';
        grid.appendChild(mesaj);
      }
    } else if (mesaj) {
      mesaj.remove();
    }
  }
}

/**
 * Filtre butonlarını bağlar.
 */
function filtreButonlariniBagla() {
  var butonlar = document.querySelectorAll('#vitrin-filtre .filtre-btn');
  if (!butonlar.length) { return; }

  Array.prototype.forEach.call(butonlar, function (btn) {
    btn.addEventListener('click', function () {
      Array.prototype.forEach.call(butonlar, function (b) {
        b.classList.remove('aktif');
        b.setAttribute('aria-selected', 'false');
      });
      btn.classList.add('aktif');
      btn.setAttribute('aria-selected', 'true');
      filtreUygula(btn.getAttribute('data-kategori'));
    });
  });
}

/* -------------------- LIGHTBOX -------------------- */

/**
 * Lightbox'ı verilen ürünle açar.
 * @param {Object} urun
 * @param {number} index
 */
function lightboxAc(urun, index) {
  var lb = document.getElementById('lightbox');
  var gorselKap = document.getElementById('lightbox-gorsel');
  var baslik = document.getElementById('lightbox-baslik');
  if (!lb || !gorselKap || !baslik) { return; }

  lightboxIndex = (typeof index === 'number') ? index : 0;
  gorselKap.innerHTML = '';

  if (urun.gorsel) {
    var img = document.createElement('img');
    img.setAttribute('alt', urun.ad || 'Kuyum ürünü');
    img.src = urun.gorsel;
    img.addEventListener('error', function () {
      img.remove();
      gorselKap.appendChild(ikonOlustur(urun.kategori));
    });
    gorselKap.appendChild(img);
  } else {
    gorselKap.appendChild(ikonOlustur(urun.kategori));
  }

  baslik.textContent = (urun.ad || 'Ürün') +
    (urun.fiyatMetni ? '  ·  ' + urun.fiyatMetni : '');

  lb.hidden = false;
  document.body.classList.add('kilitli');
  // opacity geçişi için bir sonraki frame
  requestAnimationFrame(function () { lb.classList.add('gorunur'); });

  var kapatBtn = document.getElementById('lightbox-kapat');
  if (kapatBtn) { kapatBtn.focus(); }
}

/**
 * Lightbox'ı kapatır.
 */
function lightboxKapat() {
  var lb = document.getElementById('lightbox');
  if (!lb) { return; }
  lb.classList.remove('gorunur');
  document.body.classList.remove('kilitli');
  setTimeout(function () { lb.hidden = true; }, 280);
}

/**
 * Lightbox açıkken sonraki/önceki ürüne geçer.
 * @param {number} yon +1 sonraki, -1 önceki
 */
function lightboxGezin(yon) {
  var lb = document.getElementById('lightbox');
  if (!lb || lb.hidden) { return; }
  var liste = gorunenUrunler.length ? gorunenUrunler : urunler;
  if (!liste.length) { return; }

  var mevcut = urunler[lightboxIndex];
  var sira = liste.indexOf(mevcut);
  if (sira === -1) { sira = 0; }
  var yeniSira = (sira + yon + liste.length) % liste.length;
  var yeniUrun = liste[yeniSira];
  var yeniIndex = urunler.indexOf(yeniUrun);
  lightboxAc(yeniUrun, yeniIndex < 0 ? 0 : yeniIndex);
}

/**
 * Klavye ve buton kontrollerini bağlar.
 */
function klavyeKontrol() {
  var kapatBtn = document.getElementById('lightbox-kapat');
  var oncekiBtn = document.getElementById('lightbox-onceki');
  var sonrakiBtn = document.getElementById('lightbox-sonraki');
  var lb = document.getElementById('lightbox');

  if (kapatBtn) { kapatBtn.addEventListener('click', lightboxKapat); }
  if (oncekiBtn) { oncekiBtn.addEventListener('click', function () { lightboxGezin(-1); }); }
  if (sonrakiBtn) { sonrakiBtn.addEventListener('click', function () { lightboxGezin(1); }); }

  // Arka plana tıklayınca kapat
  if (lb) {
    lb.addEventListener('click', function (e) {
      if (e.target === lb) { lightboxKapat(); }
    });
  }

  document.addEventListener('keydown', function (e) {
    var acik = lb && !lb.hidden;
    if (!acik) { return; }
    if (e.key === 'Escape') { lightboxKapat(); }
    else if (e.key === 'ArrowRight') { lightboxGezin(1); }
    else if (e.key === 'ArrowLeft') { lightboxGezin(-1); }
  });
}

/* -------------------- BAŞLAT -------------------- */

/**
 * Galeriyi başlatır: veriyi yükler, çizer, filtreleri bağlar.
 */
function galeriBaslat() {
  if (!document.getElementById('urun-grid')) { return; }

  filtreButonlariniBagla();
  klavyeKontrol();

  urunleriYukle().then(function (veri) {
    urunler = veri;
    gorunenUrunler = urunler.slice();
    urunleriCiz(urunler);

    if (!urunler.length) {
      console.warn('[Zümrüt Galeri] Gösterilecek ürün bulunamadı.');
      return;
    }
    filtreUygula(aktifKategori);
  });
}

document.addEventListener('DOMContentLoaded', galeriBaslat);
