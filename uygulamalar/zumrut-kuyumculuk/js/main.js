/* ============================================================
   ZÜMRÜT KUYUMCULUK — ANA ETKİLEŞİM MODÜLÜ
   Mobil menü · Smooth scroll · Scroll-reveal · Header efekti
   Sayaçlar · Form validasyonu · Aktif nav takibi
   ============================================================ */
'use strict';

/* -------------------- GLOBAL DURUM -------------------- */
var UYGULAMA_STATE = {
  mobilMenuAcik: false,
  aktifBolum: 'hero',
  headerKaydi: false,
  sayacCalisti: false
};

/* -------------------- YARDIMCILAR -------------------- */

/**
 * Ardışık çağrıları sınırlar (scroll performansı için).
 * @param {Function} fn
 * @param {number} ms
 * @returns {Function}
 */
function throttle(fn, ms) {
  var sonCagri = 0;
  var zamanlayici = null;
  return function () {
    var simdi = Date.now();
    var kalan = ms - (simdi - sonCagri);
    var baglam = this;
    var argumanlar = arguments;
    if (kalan <= 0) {
      if (zamanlayici) { clearTimeout(zamanlayici); zamanlayici = null; }
      sonCagri = simdi;
      fn.apply(baglam, argumanlar);
    } else if (!zamanlayici) {
      zamanlayici = setTimeout(function () {
        sonCagri = Date.now();
        zamanlayici = null;
        fn.apply(baglam, argumanlar);
      }, kalan);
    }
  };
}

/**
 * Sadece son çağrıyı belirtilen süre sonra çalıştırır (resize için).
 * @param {Function} fn
 * @param {number} ms
 * @returns {Function}
 */
function debounce(fn, ms) {
  var zamanlayici = null;
  return function () {
    var baglam = this;
    var argumanlar = arguments;
    clearTimeout(zamanlayici);
    zamanlayici = setTimeout(function () {
      fn.apply(baglam, argumanlar);
    }, ms);
  };
}

/**
 * Header yüksekliğini döner (scroll offset hesabı için).
 * @returns {number}
 */
function headerYuksekligi() {
  var header = document.getElementById('header');
  return header ? header.offsetHeight : 78;
}

/* -------------------- 1. MOBİL MENÜ -------------------- */
function initMobilMenu() {
  var toggle = document.getElementById('menu-toggle');
  var nav = document.getElementById('nav');
  if (!toggle || !nav) { return; }

  function kapat() {
    nav.classList.remove('acik');
    toggle.classList.remove('acik');
    toggle.setAttribute('aria-expanded', 'false');
    UYGULAMA_STATE.mobilMenuAcik = false;
  }

  toggle.addEventListener('click', function (e) {
    e.stopPropagation();
    var acik = nav.classList.toggle('acik');
    toggle.classList.toggle('acik', acik);
    toggle.setAttribute('aria-expanded', acik ? 'true' : 'false');
    UYGULAMA_STATE.mobilMenuAcik = acik;
  });

  // Menü içindeki linke tıklanınca kapat
  nav.addEventListener('click', function (e) {
    if (e.target.closest('a')) { kapat(); }
  });

  // Dışına tıklanınca kapat
  document.addEventListener('click', function (e) {
    if (!UYGULAMA_STATE.mobilMenuAcik) { return; }
    if (!nav.contains(e.target) && !toggle.contains(e.target)) { kapat(); }
  });

  // ESC ile kapat
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && UYGULAMA_STATE.mobilMenuAcik) { kapat(); }
  });

  // Masaüstüne dönünce temizle
  window.addEventListener('resize', debounce(function () {
    if (window.innerWidth > 992 && UYGULAMA_STATE.mobilMenuAcik) { kapat(); }
  }, 180));
}

/* -------------------- 2. SMOOTH SCROLL -------------------- */
function initSmoothScroll() {
  var linkler = document.querySelectorAll('a[href^="#"]');
  if (!linkler.length) { return; }

  Array.prototype.forEach.call(linkler, function (link) {
    link.addEventListener('click', function (e) {
      var hedefId = link.getAttribute('href');
      if (!hedefId || hedefId === '#') { return; }
      var hedef = document.querySelector(hedefId);
      if (!hedef) { return; }

      e.preventDefault();
      var ust = hedef.getBoundingClientRect().top + window.pageYOffset - headerYuksekligi() - 8;
      window.scrollTo({ top: ust < 0 ? 0 : ust, behavior: 'smooth' });

      if (history.pushState) {
        history.pushState(null, '', hedefId);
      }
    });
  });
}

/* -------------------- 3. HEADER SCROLL EFEKTİ -------------------- */
function initHeaderScroll() {
  var header = document.getElementById('header');
  if (!header) { return; }

  var islem = throttle(function () {
    var kaydi = window.pageYOffset > 50;
    if (kaydi !== UYGULAMA_STATE.headerKaydi) {
      header.classList.toggle('scrolled', kaydi);
      UYGULAMA_STATE.headerKaydi = kaydi;
    }
  }, 90);

  window.addEventListener('scroll', islem, { passive: true });
  islem();
}

/* -------------------- 4. SCROLL-REVEAL -------------------- */
function initRevealAnimasyon() {
  var ogeler = document.querySelectorAll('.reveal');
  if (!ogeler.length) { return; }

  // IntersectionObserver yoksa hepsini göster (fallback)
  if (!('IntersectionObserver' in window)) {
    Array.prototype.forEach.call(ogeler, function (o) { o.classList.add('gorunur'); });
    return;
  }

  var gozlemci = new IntersectionObserver(function (girisler, obs) {
    girisler.forEach(function (giris, i) {
      if (giris.isIntersecting) {
        // Kademeli giriş — aynı anda görünenler hafif gecikmeli
        setTimeout(function () {
          giris.target.classList.add('gorunur');
        }, Math.min(i * 90, 320));
        obs.unobserve(giris.target);
      }
    });
  }, { threshold: 0.14, rootMargin: '0px 0px -40px 0px' });

  Array.prototype.forEach.call(ogeler, function (o) { gozlemci.observe(o); });
}

/* -------------------- 5. SAYAÇLAR -------------------- */
function sayaciCalistir(el) {
  var hedef = parseFloat(el.getAttribute('data-sayac')) || 0;
  var sonek = el.getAttribute('data-sonek') || '';
  var sure = 1700;
  var baslangic = null;

  function adim(zaman) {
    if (baslangic === null) { baslangic = zaman; }
    var gecen = zaman - baslangic;
    var oran = Math.min(gecen / sure, 1);
    // easeOutCubic
    var kolay = 1 - Math.pow(1 - oran, 3);
    var deger = Math.round(hedef * kolay);
    el.textContent = deger.toLocaleString('tr-TR') + sonek;
    if (oran < 1) {
      requestAnimationFrame(adim);
    } else {
      el.textContent = hedef.toLocaleString('tr-TR') + sonek;
    }
  }

  requestAnimationFrame(adim);
}

function initSayaclar() {
  var sayaclar = document.querySelectorAll('[data-sayac]');
  if (!sayaclar.length) { return; }

  if (!('IntersectionObserver' in window)) {
    Array.prototype.forEach.call(sayaclar, sayaciCalistir);
    return;
  }

  var gozlemci = new IntersectionObserver(function (girisler, obs) {
    girisler.forEach(function (giris) {
      if (giris.isIntersecting) {
        sayaciCalistir(giris.target);
        obs.unobserve(giris.target);
        UYGULAMA_STATE.sayacCalisti = true;
      }
    });
  }, { threshold: 0.4 });

  Array.prototype.forEach.call(sayaclar, function (s) { gozlemci.observe(s); });
}

/* -------------------- 6. FORM VALİDASYONU -------------------- */
function hataGoster(grupId, mesaj) {
  var alan = document.getElementById(grupId);
  if (!alan) { return; }
  var grup = alan.closest('.form-grup');
  if (!grup) { return; }
  grup.classList.add('hatali');
  var hata = grup.querySelector('.form-hata');
  if (hata) { hata.textContent = mesaj; }
}

function hatalariTemizle(form) {
  var gruplar = form.querySelectorAll('.form-grup.hatali');
  Array.prototype.forEach.call(gruplar, function (g) { g.classList.remove('hatali'); });
}

function telefonGecerliMi(deger) {
  // Backend (server/data/iletisim.js) ile AYNI kurallar — sabit hat + mobil + 90 kodlu.
  var rakamlar = (deger || '').replace(/\D/g, '');
  if (rakamlar.length === 12 && rakamlar.indexOf('90') === 0) {
    rakamlar = rakamlar.slice(2);
  } else if (rakamlar.length === 13 && rakamlar.indexOf('090') === 0) {
    rakamlar = rakamlar.slice(2);
  }
  var yerel = rakamlar.charAt(0) === '0' ? rakamlar.slice(1) : rakamlar;
  if (yerel.length !== 10) { return false; }
  return /^[2-589]\d{9}$/.test(yerel);
}

function initFormValidasyon() {
  var form = document.getElementById('iletisim-form');
  if (!form) { return; }
  var bilgi = document.getElementById('form-bilgi');

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    hatalariTemizle(form);
    if (bilgi) { bilgi.textContent = ''; bilgi.className = 'form-bilgi'; }

    var ad = document.getElementById('ad');
    var telefon = document.getElementById('telefon');
    var konu = document.getElementById('konu');
    var mesaj = document.getElementById('mesaj');
    var gecerli = true;

    if (!ad || ad.value.trim().length < 3) {
      hataGoster('ad', 'Lütfen adınızı ve soyadınızı yazın.');
      gecerli = false;
    }
    if (!telefon || !telefonGecerliMi(telefon.value)) {
      hataGoster('telefon', 'Geçerli bir telefon numarası girin (en az 10 hane).');
      gecerli = false;
    }
    // Konu seçimi HTML'de bir <select>; boş bırakılırsa sunucu 422 döner — burada yakala.
    if (!konu || !konu.value) {
      hataGoster('konu', 'Lütfen bir konu seçin.');
      gecerli = false;
    }
    if (!mesaj || mesaj.value.trim().length < 10) {
      hataGoster('mesaj', 'Lütfen mesajınızı en az 10 karakter yazın.');
      gecerli = false;
    }

    if (!gecerli) {
      if (bilgi) {
        bilgi.textContent = 'Lütfen işaretli alanları kontrol edin.';
        bilgi.className = 'form-bilgi hata';
      }
      var ilkHata = form.querySelector('.form-grup.hatali input, .form-grup.hatali textarea');
      if (ilkHata) { ilkHata.focus(); }
      return;
    }

    // Gerçek backend gönderimi — POST /api/iletisim
    var gonderButon = form.querySelector('button[type="submit"]');
    var eskiMetin = gonderButon ? gonderButon.textContent : '';
    if (gonderButon) {
      gonderButon.disabled = true;
      gonderButon.setAttribute('aria-busy', 'true');
      gonderButon.textContent = 'Gönderiliyor…';
    }

    function butonuSifirla() {
      if (gonderButon) {
        gonderButon.disabled = false;
        gonderButon.removeAttribute('aria-busy');
        gonderButon.textContent = eskiMetin || 'Mesajı Gönder';
      }
    }

    fetch('/api/iletisim', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        ad: ad.value.trim(),
        telefon: telefon.value.trim(),
        konu: konu ? konu.value : '',
        mesaj: mesaj.value.trim()
      })
    })
      .then(function (yanit) {
        return yanit
          .json()
          .catch(function () {
            return { basarili: false, hata: { mesaj: 'Sunucu yanıtı okunamadı.' } };
          })
          .then(function (govde) {
            return { durum: yanit.status, basarili: yanit.ok, govde: govde };
          });
      })
      .then(function (sonuc) {
        if (sonuc.basarili && sonuc.govde && sonuc.govde.basarili) {
          // Gönderilen adı, form sıfırlanmadan ÖNCE yakala (mesajda kişiye hitap ediyoruz).
          var gonderilenAd = ad ? ad.value.trim() : '';
          if (bilgi) {
            var sunucuMesaji = sonuc.govde && sonuc.govde.mesaj;
            bilgi.textContent =
              sunucuMesaji ||
              'Teşekkürler ' + (gonderilenAd || 'değerli müşterimiz') +
              '! Mesajınız alındı, en kısa sürede size dönüş yapacağız.';
            // İsmi her durumda görünür kıl (sunucu mesajı adı içermese bile).
            if (gonderilenAd && bilgi.textContent.indexOf(gonderilenAd) === -1) {
              bilgi.textContent = 'Teşekkürler ' + gonderilenAd + '! ' + bilgi.textContent;
            }
            bilgi.className = 'form-bilgi basari';
            bilgi.setAttribute('role', 'status');
          }
          form.reset();
          butonuSifirla();
          return;
        }

        // Sunucu doğrulama hatası (422) — alan bazlı mesajları forma işle
        var ayrintilar = sonuc.govde && sonuc.govde.hata && sonuc.govde.hata.ayrintilar;
        if (ayrintilar && typeof ayrintilar === 'object') {
          Object.keys(ayrintilar).forEach(function (alanAdi) {
            hataGoster(alanAdi, String(ayrintilar[alanAdi]));
          });
          var ilk = form.querySelector('.form-grup.hatali input, .form-grup.hatali textarea');
          if (ilk) { ilk.focus(); }
        }
        if (bilgi) {
          bilgi.textContent =
            (sonuc.govde && sonuc.govde.hata && sonuc.govde.hata.mesaj) ||
            'Mesajınız gönderilemedi. Lütfen bilgileri kontrol edip tekrar deneyin.';
          bilgi.className = 'form-bilgi hata';
        }
        butonuSifirla();
      })
      .catch(function () {
        if (bilgi) {
          bilgi.textContent =
            'Bağlantı kurulamadı. Telefonla ulaşabilirsiniz: 0500 000 00 00';
          bilgi.className = 'form-bilgi hata';
        }
        butonuSifirla();
      });
  });

  // Yazarken hatayı kaldır
  var alanlar = form.querySelectorAll('input, textarea');
  Array.prototype.forEach.call(alanlar, function (alan) {
    alan.addEventListener('input', function () {
      var grup = alan.closest('.form-grup');
      if (grup && grup.classList.contains('hatali')) { grup.classList.remove('hatali'); }
    });
  });
}

/* -------------------- 7. AKTİF NAV TAKİBİ -------------------- */
function initAktifNav() {
  var navLinkler = document.querySelectorAll('.nav-link');
  if (!navLinkler.length) { return; }

  var bolumler = [];
  Array.prototype.forEach.call(navLinkler, function (link) {
    var id = link.getAttribute('href');
    if (!id || id === '#') { return; }
    var bolum = document.querySelector(id);
    if (bolum) { bolumler.push({ id: id, el: bolum, link: link }); }
  });
  if (!bolumler.length) { return; }

  var islem = throttle(function () {
    var konum = window.pageYOffset + headerYuksekligi() + 40;
    var aktif = bolumler[0];
    bolumler.forEach(function (b) {
      if (b.el.offsetTop <= konum) { aktif = b; }
    });
    if (aktif.id === UYGULAMA_STATE.aktifBolum) { return; }
    UYGULAMA_STATE.aktifBolum = aktif.id;
    Array.prototype.forEach.call(navLinkler, function (l) { l.classList.remove('aktif'); });
    aktif.link.classList.add('aktif');
  }, 120);

  window.addEventListener('scroll', islem, { passive: true });
  islem();
}

/* -------------------- 8. YIL GÜNCELLE -------------------- */
function initYil() {
  var el = document.getElementById('yil');
  if (el) { el.textContent = String(new Date().getFullYear()); }
}

/* -------------------- 9. BAŞLAT -------------------- */
document.addEventListener('DOMContentLoaded', function () {
  initMobilMenu();
  initSmoothScroll();
  initHeaderScroll();
  initRevealAnimasyon();
  initSayaclar();
  initFormValidasyon();
  initAktifNav();
  initYil();
});
