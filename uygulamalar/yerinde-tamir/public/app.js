/* ============================================================
   ÖMER KALPAT CEP TELEFONU TAMİRİ — Yerinde Servis Vitrin
   app.js: nav/scroll, mobil menü, data.json'dan kart doldurma,
   hızlı + tam randevu formu (/api/randevu), aktif bölüm izleme
   ============================================================ */
'use strict';

(function () {
  const API_DATA = '/api/data';
  const API_RANDEVU = '/api/randevu';

  /* ---------- Navbar scroll durumu ---------- */
  const header = document.getElementById('header');
  function onScroll() {
    if (header) header.classList.toggle('scrolled', window.scrollY > 30);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Mobil menü ---------- */
  const menuBtn = document.getElementById('menuBtn');
  const nav = document.getElementById('navbar');
  if (menuBtn && nav) {
    menuBtn.addEventListener('click', function () {
      const open = nav.classList.toggle('open');
      menuBtn.classList.toggle('active', open);
      menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
      menuBtn.setAttribute('aria-label', open ? 'Menüyü kapat' : 'Menüyü aç');
    });
    nav.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        nav.classList.remove('open');
        menuBtn.classList.remove('active');
        menuBtn.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* ---------- Yardımcılar ---------- */
  function setMsg(id, text, ok) {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = text || '';
    el.className = 'form-msg ' + (ok ? 'ok' : 'err');
  }

  /* Türkçe telefon normalizasyon + basit doğrulama */
  function normalizeTel(v) {
    return (v || '').replace(/[\s().\-]/g, '');
  }
  function telGecerli(v) {
    const t = normalizeTel(v);
    return /^(\+?90|0)?5\d{9}$/.test(t);
  }

  /* ---------- data.json'dan hizmet + fiyat kartlarını doldur ---------- */
  async function yukle() {
    let data = null;
    try {
      const res = await fetch(API_DATA);
      if (!res.ok) throw new Error('HTTP ' + res.status);
      data = await res.json();
    } catch (err) {
      console.error('data yüklenemedi, yedek içerik kullanılıyor:', err);
      data = null;
    }

    // Hizmet kartları
    const hizmetGrid = document.getElementById('hizmetGrid');
    const hizmetler = (data && data.hizmetler.length)
      ? data.hizmetler
      : [
          { ad: 'Ekran Değişimi', ikon: '📱', aciklama: 'Kırık ve çatlak ekranları kaliteli parçayla değiştiriyoruz.', etiketler: [] },
          { ad: 'Batarya Değişimi', ikon: '🔋', aciklama: 'Hızlı biten bataryaları güvenli şekilde yeniliyoruz.', etiketler: [] },
          { ad: 'Yazılım & Format', ikon: '💾', aciklama: 'Donma ve kilitlenmelerde veri yedekli yazılım çözümü.', etiketler: [] },
          { ad: 'Diğer Arızalar', ikon: '🛠️', aciklama: 'Kamera, ses ve bağlantı sorunlarında yerinde onarım.', etiketler: [] }
        ];

    if (hizmetGrid) {
      hizmetGrid.innerHTML = hizmetler.map(function (h) {
        return (
          '<article class="svc-card">' +
          '<div class="svc-ic">' + (h.ikon || '🔧') + '</div>' +
          '<h3>' + h.ad + '</h3>' +
          '<p>' + h.aciklama + '</p>' +
          (h.etiketler && h.etiketler.length
            ? '<span class="svc-more">' + h.etiketler.join(' · ') + '</span>'
            : '<a class="svc-more" href="#randevu">Randevu al →</a>') +
          '</article>'
        );
      }).join('');
    }

    // Fiyat kartları
    const priceGrid = document.getElementById('priceGrid');
    const fiyatlar = (data && data.fiyatlar.length) ? data.fiyatlar : [];
    if (priceGrid && fiyatlar.length) {
      priceGrid.innerHTML = fiyatlar.map(function (f) {
        const feat = f.oncelik
          ? ' featured'
          : '';
        const badge = f.oncelik ? '<span class="badge-feat">En çok tercih edilen</span>' : '';
        return (
          '<article class="price-card' + feat + '">' +
          badge +
          '<h3>' + f.hizmet + '</h3>' +
          '<div class="prc">' + f.fiyat + '<small> ' + (f.not || '') + '</small></div>' +
          '</article>'
        );
      }).join('');
    }
  }

  /* ---------- Ortak form gönderimi ---------- */
  async function gonderRandevu(payload, msgId) {
    setMsg(msgId, 'Gönderiliyor…', true);
    try {
      const res = await fetch(API_RANDEVU, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const out = await res.json().catch(function () { return { mesaj: 'Beklenmeyen yanıt.' }; });
      if (res.ok && out.ok) {
        setMsg(msgId, '✔ ' + out.mesaj, true);
        return true;
      }
      setMsg(msgId, '⚠ ' + (out.mesaj || 'İşlem başarısız, lütfen tekrar deneyin.'), false);
      return false;
    } catch (err) {
      console.error(err);
      setMsg(msgId, '⚠ Sunucuya ulaşılamadı. Lütfen daha sonra deneyin ya da arayın.', false);
      return false;
    }
  }

  /* ---------- Hızlı form (hero) ---------- */
  const quickForm = document.getElementById('quickForm');
  if (quickForm) {
    quickForm.addEventListener('submit', function (e) {
      e.preventDefault();
      const ad = document.getElementById('qAd').value.trim();
      const tel = document.getElementById('qTel').value.trim();
      const hizmet = document.getElementById('qHizmet').value;
      const adresEl = document.getElementById('qAdres');
      const adres = adresEl.value.trim();

      if (!ad || !hizmet || !adres) {
        setMsg('quickMsg', 'Lütfen ad, hizmet ve adres alanlarını doldurun.', false);
        return;
      }
      if (!telGecerli(tel)) {
        setMsg('quickMsg', 'Lütfen geçerli bir cep telefonu girin (05xx…).', false);
        return;
      }
      if (gonderRandevu({ ad: ad, telefon: tel, hizmet: hizmet, ilce: 'Sultanbeyli', adres: adres }, 'quickMsg')) {
        quickForm.reset();
      }
    });
  }

  /* ---------- Detaylı randevu formu ---------- */
  const appForm = document.getElementById('appForm');
  if (appForm) {
    appForm.addEventListener('submit', function (e) {
      e.preventDefault();
      const fd = new FormData(appForm);
      const payload = Object.fromEntries(fd.entries());

      if (!payload.ad || !payload.telefon || !payload.hizmet || !payload.adres) {
        setMsg('appMsg', 'Lütfen zorunlu (*) alanları doldurun.', false);
        return;
      }
      if (!telGecerli(payload.telefon)) {
        setMsg('appMsg', 'Lütfen geçerli bir cep telefonu girin (05xx…).', false);
        return;
      }
      gonderRandevu(payload, 'appMsg').then(function (tamam) {
        if (tamam) appForm.reset();
      });
    });
  }

  /* ---------- Aktif bölüm vurgusu ---------- */
  const navLinks = document.querySelectorAll('.nav-link');
  const sections = ['hizmetler', 'yerinde', 'fiyat', 'iletisim'];
  function aktifIle() {
    const y = window.scrollY + 120;
    let tersil = 'hizmetler';
    sections.forEach(function (id) {
      const el = document.getElementById(id);
      if (el && el.offsetTop <= y) tersil = id;
    });
    navLinks.forEach(function (a) {
      const ok = a.getAttribute('href') === '#' + tersil;
      a.style.color = ok ? 'var(--accent)' : '';
    });
  }
  window.addEventListener('scroll', aktifIle, { passive: true });

  /* ---------- Başlat ---------- */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', yukle);
  } else {
    yukle();
  }
})();
