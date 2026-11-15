/* =========================================================
   NUMEX MAGIC LETTER — uygulama çekirdeği
   Harici bağımlılık yok. Tüm veri tarayıcıda kalır.
   ========================================================= */
(function () {
  'use strict';

  /* ---------------- yardımcılar ---------------- */
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.prototype.slice.call(r.querySelectorAll(s));
  const bekle = (ms) => new Promise((r) => setTimeout(r, ms));
  const esc = (s) =>
    String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const DUSUK_HAREKET = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const HIZ = DUSUK_HAREKET ? 0.35 : 1;
  const bekleH = (ms) => bekle(Math.round(ms * HIZ));

  /* ---------------- sabitler ---------------- */
  const TEMALAR = {
    gece: { ad: 'Romantik gece', kagit: '#f7ebe4', zarf: '#7d2b45', mum: '#8d1b31' },
    nostalji: { ad: 'Altın nostalji', kagit: '#f6ecd2', zarf: '#8a6a2f', mum: '#a8761f' },
    bahce: { ad: 'Çiçek bahçesi', kagit: '#fbf7ea', zarf: '#4f7f5c', mum: '#6d2f2f' },
    gokyuzu: { ad: 'Yıldızlı gökyüzü', kagit: '#eef2fb', zarf: '#31406e', mum: '#2c3f7a' }
  };

  const KAGITLAR = ['#f7ebe4', '#f6ecd2', '#fbf7ea', '#eef2fb', '#f3e9f4', '#e9f2ec'];
  const ZARFLAR = ['#7d2b45', '#8a6a2f', '#4f7f5c', '#31406e', '#5a2e3a', '#2f4a52'];

  const FONTLAR = [
    { id: 'serif', ad: 'Klasik', yigin: 'Georgia,"Times New Roman",Cambria,serif' },
    { id: 'script', ad: 'El yazısı', yigin: '"Segoe Script","Brush Script MT","Lucida Handwriting",cursive' },
    { id: 'sans', ad: 'Modern', yigin: '"Segoe UI",system-ui,-apple-system,"Trebuchet MS",sans-serif' },
    { id: 'mono', ad: 'Daktilo', yigin: 'Consolas,"Courier New",monospace' }
  ];

  const SUSLER = [
    { id: 'yok', ad: 'Sade', sembol: '' },
    { id: 'cicek', ad: 'Çiçek', sembol: '❀' },
    { id: 'yildiz', ad: 'Yıldız', sembol: '✦' },
    { id: 'kalp', ad: 'Kalp', sembol: '♥' },
    { id: 'isik', ad: 'Işık', sembol: '' }
  ];

  const MUHURLER = {
    gul: {
      ad: 'Gül',
      s: [{ d: 'M50 50 C50 45 55 45 55 50 C55 57 45 57 45 50 C45 40 60 40 60 50 C60 63 40 63 40 50 C40 34 66 34 66 50', m: 'stroke', w: 2.6 }]
    },
    kalp: {
      ad: 'Kalp',
      s: [{ d: 'M50 78 C20 58 22 32 40 30 C48 29 50 36 50 40 C50 36 52 29 60 30 C78 32 80 58 50 78 Z', m: 'both', w: 2.4 }]
    },
    yildiz: {
      ad: 'Yıldız',
      s: [{ d: 'M50 14 L60.5 40.5 L89 41.5 L66.5 59.5 L74 87 L50 71 L26 87 L33.5 59.5 L11 41.5 L39.5 40.5 Z', m: 'both', w: 2.2 }]
    },
    dal: {
      ad: 'Zeytin',
      s: [
        { d: 'M50 88 C50 66 50 44 50 18', m: 'stroke', w: 2.4 },
        { d: 'M50 40 C36 40 28 32 28 22 C42 22 50 30 50 40 Z', m: 'both', w: 1.8 },
        { d: 'M50 62 C64 62 72 54 72 44 C58 44 50 52 50 62 Z', m: 'both', w: 1.8 }
      ]
    }
  };

  const ORNEK_METIN =
    'Bu mektubu yazmak için doğru zamanı bekledim; sonra anladım ki "doğru zaman" diye bir şey yok. İnsan bazen sadece oturup yazmalı.\n\n' +
    'Bugün pencereden yağmuru izlerken aklıma geldin. Hani şu, hiçbir şey söylemeden yan yana oturabildiğimiz günler... Onları çok özledim.\n\n' +
    'Bu kâğıt, bu mürekkep, bu mum kokusu; hepsi senin adına bir araya geldi. Umarım eline geçtiğinde kendine bir fincan çay koyar, acele etmeden okursun.\n\n' +
    'Sana söyleyecek çok sözüm var ama en önemlisi şu: iyi ki varsın.';

  const VARSAYILAN = {
    alici: 'Ayşe',
    baslik: 'Sana dair birkaç satır',
    metin: ORNEK_METIN,
    imza: 'Seni çok seven',
    font: 'script',
    kagit: '#f7ebe4',
    zarf: '#7d2b45',
    muhur: 'gul',
    sus: 'cicek',
    tema: 'gece'
  };

  const DEPO = 'nml.mektup.v1';
  let state = Object.assign({}, VARSAYILAN);

  /* ---------------- mühür svg ---------------- */
  function muhurSVG(id) {
    const m = MUHURLER[id] || MUHURLER.gul;
    const ic = m.s
      .map((s) => {
        const dolgu = s.m === 'stroke' ? 'none' : 'currentColor';
        const op = s.m === 'stroke' ? 0 : 0.16;
        return `<path d="${s.d}" fill="${dolgu}" fill-opacity="${op}" stroke="currentColor" stroke-width="${s.w}" stroke-linejoin="round" stroke-linecap="round"/>`;
      })
      .join('');
    return `<svg viewBox="0 0 100 100" class="muhur-svg" aria-hidden="true">
      <circle cx="50" cy="50" r="44" fill="none" stroke="currentColor" stroke-width="1.1" stroke-dasharray="1.6 5.4" opacity=".7"/>
      ${ic}</svg>`;
  }

  /* ---------------- mektup html ---------------- */
  function rastgele(seed) {
    let s = seed || 987654321;
    return function () {
      s = (s * 16807) % 2147483647;
      return s / 2147483647;
    };
  }

  function susHTML(tip) {
    if (!tip || tip === 'yok') return '';
    if (tip === 'isik') return '<div class="sus-isik" aria-hidden="true"><i></i><i></i><i></i></div>';
    const s = SUSLER.filter((x) => x.id === tip)[0];
    if (!s) return '';
    const r = rastgele(tip.charCodeAt(0) * 7919);
    let html = '<div class="sus-kat" aria-hidden="true">';
    for (let i = 0; i < 9; i++) {
      const x = 7 + r() * 86;
      const y = 5 + r() * 90;
      const boy = 0.5 + r() * 0.85;
      const gecikme = (r() * 6).toFixed(1);
      const aci = (r() * 50 - 25).toFixed(0);
      html += `<span class="sus sus-${tip}" style="left:${x.toFixed(1)}%;top:${y.toFixed(1)}%;font-size:${boy.toFixed(2)}em;animation-delay:${gecikme}s;--r:${aci}deg">${s.sembol}</span>`;
    }
    return html + '</div>';
  }

  function mektupHTML(st) {
    const paragraf = String(st.metin || '')
      .split(/\n{2,}/)
      .map((p) => '<p>' + esc(p).replace(/\n/g, '<br>') + '</p>')
      .join('');
    return (
      '<div class="mektup-doku"></div>' +
      '<div class="mektup-kenar"></div>' +
      susHTML(st.sus) +
      '<div class="mektup-icerik">' +
      '<p class="m-alici">Sevgili ' + esc(st.alici) + ',</p>' +
      '<h2 class="m-baslik">' + esc(st.baslik) + '</h2>' +
      '<div class="m-govde">' + (paragraf || '<p></p>') + '</div>' +
      '<p class="m-imza">' + esc(st.imza) + '</p>' +
      '</div>'
    );
  }

  function fontYigin(id) {
    const f = FONTLAR.filter((x) => x.id === id)[0];
    return f ? f.yigin : FONTLAR[1].yigin;
  }

  /* ---------------- sığdırma ---------------- */
  function sigdir(kok) {
    if (!kok || kok.dataset.sigdir === '0') return;
    const ic = kok.querySelector('.mektup-icerik');
    const gov = kok.querySelector('.m-govde');
    if (!ic || !gov) return;
    let fs = 15;
    let n = 0;
    ic.style.setProperty('--fs', fs + 'px');
    while (gov.scrollHeight > gov.clientHeight + 1 && fs > 8 && n < 60) {
      fs -= 0.5;
      n++;
      ic.style.setProperty('--fs', fs + 'px');
    }
  }

  /* ---------------- sahne referansları ---------------- */
  const sahne = $('#sahne');
  const komp = $('#sahneKomp');
  const zarf = komp.querySelector('.zarf');
  const mektup = komp.querySelector('.mektup');
  const muhur = komp.querySelector('.zarf-muhur');
  const girisMektup = $('#girisMektup');

  /* ---------------- çizim ---------------- */
  const kokStil = document.documentElement;

  function ciz(hepsi) {
    const t = TEMALAR[state.tema] || TEMALAR.gece;
    kokStil.dataset.tema = state.tema;
    kokStil.style.setProperty('--kagit', state.kagit);
    kokStil.style.setProperty('--zarf', state.zarf);
    kokStil.style.setProperty('--mum', t.mum);
    kokStil.style.setProperty('--mfont', fontYigin(state.font));

    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', t.kagit);

    // sahne mektubu
    mektup.innerHTML = mektupHTML(state);
    mektup.style.fontFamily = fontYigin(state.font);
    sigdir(mektup);

    // mühür
    muhur.innerHTML = muhurSVG(state.muhur);

    // giriş mektubu
    if (hepsi) {
      girisMektup.innerHTML = mektupHTML(VARSAYILAN_DEMO());
      girisMektup.style.fontFamily = fontYigin(VARSAYILAN.font);
      $('#girisMuhur').innerHTML = muhurSVG('gul');
    }

    // panel seçimleri
    secimGuncelle();
    sayacGuncelle();
  }

  function VARSAYILAN_DEMO() {
    return {
      alici: 'Ayşe',
      baslik: 'Sana dair birkaç satır',
      metin:
        'Bu mektubu yazmak için doğru zamanı bekledim; sonra anladım ki "doğru zaman" diye bir şey yok.\n\n' +
        'Bugün pencereden yağmuru izlerken aklıma geldin. Hani şu, hiçbir şey söylemeden yan yana oturabildiğimiz günler...',
      imza: 'Seni çok seven',
      sus: 'cicek'
    };
  }

  function secimGuncelle() {
    $$('#fontlar [data-id]').forEach((b) => b.classList.toggle('sec', b.dataset.id === state.font));
    $$('#kagitlar [data-id]').forEach((b) => b.classList.toggle('sec', b.dataset.id.toLowerCase() === String(state.kagit).toLowerCase()));
    $$('#zarflar [data-id]').forEach((b) => b.classList.toggle('sec', b.dataset.id.toLowerCase() === String(state.zarf).toLowerCase()));
    $$('#muhurler [data-id]').forEach((b) => b.classList.toggle('sec', b.dataset.id === state.muhur));
    $$('#susler [data-id]').forEach((b) => b.classList.toggle('sec', b.dataset.id === state.sus));
    $$('#temalar [data-tema]').forEach((b) => b.classList.toggle('sec', b.dataset.tema === state.tema));
  }

  function sayacGuncelle() {
    const el = $('#sayac');
    if (el) el.textContent = String(state.metin || '').length + ' / 2600';
  }

  /* ---------------- panel kurulumu ---------------- */
  function uiKur() {
    $('#fontlar').innerHTML = FONTLAR.map(
      (f) => `<button type="button" class="sec-btn" data-id="${f.id}" style="font-family:${f.yigin}">${f.ad}</button>`
    ).join('');

    $('#kagitlar').innerHTML = KAGITLAR.map(
      (c) => `<button type="button" class="renk" data-id="${c}" style="--c:${c}" aria-label="Kâğıt ${c}" title="${c}"></button>`
    ).join('');

    $('#zarflar').innerHTML = ZARFLAR.map(
      (c) => `<button type="button" class="renk" data-id="${c}" style="--c:${c}" aria-label="Zarf ${c}" title="${c}"></button>`
    ).join('');

    $('#muhurler').innerHTML = Object.keys(MUHURLER)
      .map((k) => `<button type="button" class="muhur-btn" data-id="${k}"><span class="muhur-mini">${muhurSVG(k)}</span>${MUHURLER[k].ad}</button>`)
      .join('');

    $('#susler').innerHTML = SUSLER.map((s) => `<button type="button" class="sec-btn" data-id="${s.id}">${s.ad}</button>`).join('');

    $('#fontlar').addEventListener('click', (e) => {
      const b = e.target.closest('[data-id]');
      if (!b) return;
      state.font = b.dataset.id;
      ciz();
      kaydet();
    });

    $('#kagitlar').addEventListener('click', (e) => {
      const b = e.target.closest('[data-id]');
      if (!b) return;
      state.kagit = b.dataset.id;
      ciz();
      kaydet();
    });

    $('#zarflar').addEventListener('click', (e) => {
      const b = e.target.closest('[data-id]');
      if (!b) return;
      state.zarf = b.dataset.id;
      ciz();
      kaydet();
    });

    $('#muhurler').addEventListener('click', (e) => {
      const b = e.target.closest('[data-id]');
      if (!b) return;
      state.muhur = b.dataset.id;
      ciz();
      kaydet();
    });

    $('#susler').addEventListener('click', (e) => {
      const b = e.target.closest('[data-id]');
      if (!b) return;
      state.sus = b.dataset.id;
      ciz();
      kaydet();
    });

    $('#temalar').addEventListener('click', (e) => {
      const b = e.target.closest('[data-tema]');
      if (!b) return;
      const t = TEMALAR[b.dataset.tema];
      if (!t) return;
      state.tema = b.dataset.tema;
      state.kagit = t.kagit;
      state.zarf = t.zarf;
      ciz();
      kaydet();
    });

    const alanlar = [
      ['#fAlici', 'alici'],
      ['#fBaslik', 'baslik'],
      ['#fMetin', 'metin'],
      ['#fImza', 'imza']
    ];
    alanlar.forEach(function (pair) {
      const el = $(pair[0]);
      el.value = state[pair[1]] || '';
      el.addEventListener('input', function () {
        state[pair[1]] = el.value;
        mektup.innerHTML = mektupHTML(state);
        mektup.style.fontFamily = fontYigin(state.font);
        sigdir(mektup);
        sayacGuncelle();
        kaydet();
      });
    });
  }

  /* ---------------- kayıt / yükleme ---------------- */
  let kayitZaman = null;
  function kaydet() {
    clearTimeout(kayitZaman);
    kayitZaman = setTimeout(function () {
      try {
        localStorage.setItem(DEPO, JSON.stringify(state));
      } catch (e) {
        /* kota dolu ya da kapalı — sessiz geç */
      }
    }, 350);
  }

  function yukle() {
    try {
      const ham = localStorage.getItem(DEPO);
      if (!ham) return false;
      const v = JSON.parse(ham);
      if (v && typeof v === 'object' && v.metin) {
        state = Object.assign({}, VARSAYILAN, v);
        return true;
      }
    } catch (e) {
      /* bozuk kayıt — varsayılana dön */
    }
    return false;
  }

  /* ---------------- ölçek ---------------- */
  function olcekle() {
    // giriş kompozisyonu
    const gk = $('#girisKomp');
    if (gk) {
      const yer = Math.min(window.innerWidth - 40, 560);
      const s = Math.max(0.52, Math.min(1, yer / 520));
      gk.style.setProperty('--s', s.toFixed(3));
    }
    // sahne kompozisyonları
    $$('.sahne-perde').forEach(function (perde) {
      const kompo = perde.querySelector('.sahne-komp');
      if (!kompo) return;
      const gen = perde.clientWidth || window.innerWidth;
      const yuk = window.innerHeight - 210;
      const s = Math.max(0.42, Math.min(1, gen / 580, yuk / 640));
      kompo.style.setProperty('--s', s.toFixed(3));
    });
  }

  /* ---------------- parçacık motoru ---------------- */
  const pc = $('#parcacik');
  const px = pc.getContext('2d');
  let parcalar = [];
  let dpr = Math.min(window.devicePixelRatio || 1, 1.75);
  let calisiyor = false;

  function katmanBoyut() {
    pc.width = Math.floor(window.innerWidth * dpr);
    pc.height = Math.floor(window.innerHeight * dpr);
    pc.style.width = window.innerWidth + 'px';
    pc.style.height = window.innerHeight + 'px';
  }

  function isikRengi() {
    const v = getComputedStyle(document.documentElement).getPropertyValue('--isik').trim();
    return v || '#ffd9ec';
  }

  function patlat(x, y, olcu) {
    const renk = isikRengi();
    const adet = DUSUK_HAREKET ? 10 : 46;
    const guc = olcu || 1;
    for (let i = 0; i < adet; i++) {
      const a = Math.random() * Math.PI * 2;
      const h = (0.6 + Math.random() * 3.2) * guc;
      parcalar.push({
        x: x * dpr,
        y: y * dpr,
        vx: Math.cos(a) * h * dpr,
        vy: (Math.sin(a) * h - 1.1) * dpr,
        yas: 0,
        omur: 60 + Math.random() * 55,
        r: (0.9 + Math.random() * 2.4) * dpr * guc,
        renk: renk
      });
    }
    donguBaslat();
  }

  function donguBaslat() {
    if (calisiyor) return;
    calisiyor = true;
    requestAnimationFrame(dongu);
  }

  function dongu() {
    px.clearRect(0, 0, pc.width, pc.height);
    for (let i = parcalar.length - 1; i >= 0; i--) {
      const p = parcalar[i];
      p.yas++;
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.045 * dpr;
      p.vx *= 0.985;
      p.vy *= 0.988;
      const kalan = 1 - p.yas / p.omur;
      if (kalan <= 0) {
        parcalar.splice(i, 1);
        continue;
      }
      px.globalAlpha = Math.max(0, kalan) * 0.9;
      px.fillStyle = p.renk;
      px.beginPath();
      px.arc(p.x, p.y, p.r * (0.4 + kalan * 0.8), 0, Math.PI * 2);
      px.fill();
    }
    px.globalAlpha = 1;
    if (parcalar.length) {
      requestAnimationFrame(dongu);
    } else {
      calisiyor = false;
      px.clearRect(0, 0, pc.width, pc.height);
    }
  }

  /* ---------------- ortam (yıldız/toz) ---------------- */
  const oc = $('#ortam');
  const ox = oc.getContext('2d');
  let tozlar = [];
  let ortamCalisiyor = true;

  function ortamKur() {
    oc.width = Math.floor(window.innerWidth * dpr);
    oc.height = Math.floor(window.innerHeight * dpr);
    oc.style.width = window.innerWidth + 'px';
    oc.style.height = window.innerHeight + 'px';
    const adet = DUSUK_HAREKET ? 24 : Math.min(90, Math.round((window.innerWidth * window.innerHeight) / 22000));
    tozlar = [];
    for (let i = 0; i < adet; i++) {
      tozlar.push({
        x: Math.random() * oc.width,
        y: Math.random() * oc.height,
        r: (0.4 + Math.random() * 1.5) * dpr,
        hiz: (0.08 + Math.random() * 0.35) * dpr,
        sal: Math.random() * Math.PI * 2,
        alfa: 0.12 + Math.random() * 0.5
      });
    }
  }

  function ortamCiz() {
    if (!ortamCalisiyor) return;
    ox.clearRect(0, 0, oc.width, oc.height);
    const renk = isikRengi();
    ox.fillStyle = renk;
    for (let i = 0; i < tozlar.length; i++) {
      const t = tozlar[i];
      t.y -= t.hiz;
      t.sal += 0.008;
      t.x += Math.sin(t.sal) * 0.22 * dpr;
      if (t.y < -8) {
        t.y = oc.height + 8;
        t.x = Math.random() * oc.width;
      }
      ox.globalAlpha = t.alfa * (0.55 + 0.45 * Math.sin(t.sal * 1.7));
      ox.beginPath();
      ox.arc(t.x, t.y, t.r, 0, Math.PI * 2);
      ox.fill();
    }
    ox.globalAlpha = 1;
    requestAnimationFrame(ortamCiz);
  }

  /* ---------------- mühürleme / açma ---------------- */
  let mesgul = false;

  function mektupBaslangic(m) {
    m.style.transition = '';
    m.style.transform = '';
    m.style.opacity = '';
  }

  async function muhurle(z, m, mu) {
    if (mesgul) return;
    mesgul = true;
    const ipucu = $('#sahneIpucu');
    if (ipucu) ipucu.textContent = 'Mektup katlanıyor...';

    z.classList.remove('muhurlu', 'kiriliyor');
    z.classList.remove('acik');
    await bekleH(60);

    // 1) katlanma
    m.style.transition = 'transform 230ms cubic-bezier(.4,0,.7,1)';
    m.style.transform = 'translateY(0px) scale(.98,.76)';
    await bekleH(240);
    m.style.transform = 'translateY(0px) scale(.96,.54)';
    await bekleH(240);
    m.style.transform = 'translateY(0px) scale(.94,.42)';
    await bekleH(240);

    if (ipucu) ipucu.textContent = 'Zarfın içine giriyor...';

    // 2) zarfın içine
    m.style.transition = 'transform 850ms cubic-bezier(.55,0,.25,1), opacity 780ms ease-in 60ms';
    m.style.transform = 'translateY(150px) scale(.9,.26)';
    m.style.opacity = '0';
    await bekleH(560);

    if (ipucu) ipucu.textContent = 'Zarf kapanıyor...';
    await bekleH(440);

    // 3) mühür + parçacık
    z.classList.add('muhurlu');
    await bekleH(90);
    const r = mu.getBoundingClientRect();
    if (r.width > 0) patlat(r.left + r.width / 2, r.top + r.height / 2, 1);
    await bekleH(140);
    const r2 = mu.getBoundingClientRect();
    if (r2.width > 0) patlat(r2.left + r2.width * 0.3, r2.top + r2.height * 0.6, 0.6);

    if (ipucu) ipucu.textContent = 'Mühürlendi. Bağlantıyı paylaşabilirsin.';
    await bekleH(520);
    mesgul = false;
    paylasimAc();
  }

  async function acilis(z, m, mu) {
    if (mesgul) return;
    mesgul = true;
    const ipucu = $('#gelenAlt');

    // mühür kırılıyor
    const r = mu.getBoundingClientRect();
    if (r.width > 0) patlat(r.left + r.width / 2, r.top + r.height / 2, 1);
    z.classList.add('kiriliyor');
    if (ipucu) ipucu.textContent = 'Mühür kırıldı...';
    await bekleH(330);
    z.classList.remove('muhurlu', 'kiriliyor');
    await bekleH(200);

    // kapak açılıyor
    z.classList.add('acik');
    if (ipucu) ipucu.textContent = 'Zarf açılıyor...';
    await bekleH(520);

    // mektup çıkıyor
    m.style.transition = 'transform 520ms cubic-bezier(.2,1,.3,1), opacity 380ms';
    m.style.opacity = '1';
    m.style.transform = 'translateY(-46px) scale(.96,.46)';
    await bekleH(540);
    m.style.transform = 'translateY(-14px) scale(.98,.78)';
    await bekleH(250);
    m.style.transform = 'translateY(0px) scale(1,1)';
    if (ipucu) ipucu.textContent = 'Mektup açılıyor...';
    await bekleH(420);
    m.style.transition = '';
    mesgul = false;
  }

  /* ---------------- okuma ---------------- */
  function okumaAc() {
    const kutu = $('#okuma');
    const el = $('#okumaMektup');
    el.innerHTML = mektupHTML(state);
    el.style.fontFamily = fontYigin(state.font);
    el.dataset.fs = '17';
    kutu.classList.remove('gizli');
    document.body.style.overflow = 'hidden';
    // yumuşak sığdırma (uzun metinler kaydırılır)
    requestAnimationFrame(function () {
      el.querySelector('.mektup-icerik').scrollTop = 0;
    });
  }

  function okumaKapat() {
    $('#okuma').classList.add('gizli');
    document.body.style.overflow = '';
  }

  /* ---------------- paylaşım ---------------- */
  function b64yaz(str) {
    const bayt = new TextEncoder().encode(str);
    let bin = '';
    for (let i = 0; i < bayt.length; i++) bin += String.fromCharCode(bayt[i]);
    return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  function b64oku(s) {
    let t = s.replace(/-/g, '+').replace(/_/g, '/');
    const kalan = t.length % 4;
    if (kalan) t += '='.repeat(4 - kalan);
    const bin = atob(t);
    const bayt = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bayt[i] = bin.charCodeAt(i);
    return new TextDecoder().decode(bayt);
  }

  function baglanti() {
    const p = {
      v: 1,
      a: state.alici,
      b: state.baslik,
      m: state.metin,
      i: state.imza,
      f: state.font,
      k: state.kagit,
      z: state.zarf,
      u: state.muhur,
      s: state.sus,
      t: state.tema
    };
    return location.origin + location.pathname + '#m=' + b64yaz(JSON.stringify(p));
  }

  function paylasimAc() {
    const url = baglanti();
    const girdi = $('#paylasUrl');
    const uyari = $('#paylasUyari');
    girdi.value = url;

    const uzun = url.length;
    if (uzun > 7000) {
      uyari.className = 'uyari kotu';
      uyari.textContent = 'Bağlantı çok uzun (' + uzun + ' karakter). Tarayıcılar ve mesaj uygulamaları bu adresi kesebilir. Mektubu kısalt ya da PNG olarak indir.';
    } else if (uzun > 2000) {
      uyari.className = 'uyari orta';
      uyari.textContent = 'Bağlantı uzun (' + uzun + ' karakter). Bazı mesaj uygulamaları kesebilir; kopyaladıktan sonra bağlantının tamamının gittiğini kontrol et.';
    } else {
      uyari.className = 'uyari iyi';
      uyari.textContent = 'Bağlantı hazır (' + uzun + ' karakter).';
    }

    $('#paylasim').classList.remove('gizli');
    document.body.style.overflow = 'hidden';
  }

  function paylasimKapat() {
    $('#paylasim').classList.add('gizli');
    document.body.style.overflow = '';
  }

  async function kopyala() {
    const girdi = $('#paylasUrl');
    const metin = girdi.value;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(metin);
      } else {
        throw new Error('pano yok');
      }
    } catch (e) {
      girdi.focus();
      girdi.select();
      try {
        document.execCommand('copy');
      } catch (e2) {
        /* elle kopyalama */
      }
    }
    const b = $('#kopyalaBtn');
    const eski = b.textContent;
    b.textContent = 'Kopyalandı';
    setTimeout(function () {
      b.textContent = eski;
    }, 1600);
  }

  /* ---------------- PNG ---------------- */
  async function pngUret() {
    const btn = $('#pngBtn');
    const eski = btn.textContent;
    btn.textContent = 'Hazırlanıyor...';
    btn.disabled = true;
    try {
      const blob = await pngBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const ad = (state.alici || 'mektup').toLowerCase().replace(/[^a-z0-9çğıöşü]+/gi, '-').replace(/^-+|-+$/g, '');
      a.href = url;
      a.download = 'numex-mektup-' + (ad || 'mektup') + '.png';
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(function () {
        URL.revokeObjectURL(url);
      }, 4000);
    } catch (e) {
      alert('PNG oluşturulamadı: ' + e.message);
    } finally {
      btn.textContent = eski;
      btn.disabled = false;
    }
  }

  async function pngBlob() {
    {
      if (document.fonts && document.fonts.ready) await document.fonts.ready;
      const W = 1000;
      const H = 1414;
      const c = document.createElement('canvas');
      c.width = W;
      c.height = H;
      const x = c.getContext('2d');
      const kagit = state.kagit || '#f7ebe4';
      const murekkep = '#3a2b2f';
      const vurgu = getComputedStyle(document.documentElement).getPropertyValue('--vurgu').trim() || '#7d2b45';

      // kâğıt + doku
      x.fillStyle = kagit;
      x.fillRect(0, 0, W, H);
      for (let i = 0; i < 3400; i++) {
        x.fillStyle = 'rgba(130,100,68,' + (0.012 + Math.random() * 0.035).toFixed(3) + ')';
        x.beginPath();
        x.arc(Math.random() * W, Math.random() * H, Math.random() * 1.7 + 0.3, 0, Math.PI * 2);
        x.fill();
      }
      const g = x.createRadialGradient(W / 2, H / 2, H * 0.12, W / 2, H / 2, H * 0.78);
      g.addColorStop(0, 'rgba(255,255,255,.28)');
      g.addColorStop(1, 'rgba(120,90,60,.18)');
      x.fillStyle = g;
      x.fillRect(0, 0, W, H);

      // çerçeve
      x.strokeStyle = 'rgba(120,92,62,.34)';
      x.lineWidth = 2;
      x.strokeRect(48, 48, W - 96, H - 96);
      x.strokeStyle = 'rgba(120,92,62,.16)';
      x.lineWidth = 1;
      x.strokeRect(62, 62, W - 124, H - 124);

      // süsleme
      if (state.sus && state.sus !== 'yok' && state.sus !== 'isik') {
        const s = SUSLER.filter((q) => q.id === state.sus)[0];
        if (s && s.sembol) {
          x.fillStyle = vurgu;
          const noktalar = [
            [90, 110], [910, 120], [110, 1300], [890, 1290],
            [500, 96], [500, 1320], [96, 560], [904, 780]
          ];
          noktalar.forEach(function (p, idx) {
            x.globalAlpha = 0.32 + (idx % 3) * 0.08;
            x.font = (30 + (idx % 2) * 12) + 'px ' + fontYigin(state.font);
            x.textAlign = 'center';
            x.textBaseline = 'middle';
            x.fillText(s.sembol, p[0], p[1]);
          });
          x.globalAlpha = 1;
        }
      }

      // metin ölçüleri
      const sol = 118;
      const sag = W - 118;
      const genislik = sag - sol;
      const fYigin = fontYigin(state.font);
      const paragraflar = String(state.metin || '').split(/\n{2,}/);

      let boyut = 27;
      let duzen = null;

      function sarmala(metin, px2) {
        x.font = px2 + 'px ' + fYigin;
        const kelimeler = metin.split(/\s+/).filter(Boolean);
        const satirlar = [];
        let satir = '';
        kelimeler.forEach(function (k) {
          const deneme = satir ? satir + ' ' + k : k;
          if (x.measureText(deneme).width > genislik && satir) {
            satirlar.push(satir);
            satir = k;
          } else {
            satir = deneme;
          }
        });
        if (satir) satirlar.push(satir);
        return satirlar;
      }

      function kur(px2) {
        const satirY = px2 * 1.72;
        const bloklar = [];
        let y = 300;
        x.font = (px2 * 1.02) + 'px ' + fYigin;
        bloklar.push({ tip: 'alici', y: y, boyut: px2 * 1.02 });
        y += satirY * 1.5;
        x.font = '600 ' + (px2 * 1.42) + 'px Georgia,"Times New Roman",serif';
        const basSatir = sarmala(state.baslik || '', px2 * 1.42);
        bloklar.push({ tip: 'baslik', y: y, satirlar: basSatir, boyut: px2 * 1.42 });
        y += basSatir.length * px2 * 1.34 + satirY * 0.7;
        paragraflar.forEach(function (p) {
          const satirlar = sarmala(p.replace(/\n/g, ' '), px2);
          bloklar.push({ tip: 'govde', y: y, satirlar: satirlar, boyut: px2 });
          y += satirlar.length * satirY + satirY * 0.55;
        });
        y += satirY * 0.3;
        bloklar.push({ tip: 'imza', y: y, boyut: px2 * 1.05 });
        y += satirY * 1.6;
        return { bloklar: bloklar, son: y };
      }

      const altSinir = H - 210;
      let deneme = 0;
      while (boyut > 12 && deneme < 40) {
        duzen = kur(boyut);
        if (duzen.son <= altSinir) break;
        boyut -= 1;
        deneme++;
      }
      if (!duzen) duzen = kur(boyut);

      // çiz
      x.textAlign = 'left';
      x.textBaseline = 'alphabetic';
      x.fillStyle = murekkep;

      duzen.bloklar.forEach(function (b) {
        if (b.tip === 'alici') {
          x.font = b.boyut + 'px ' + fYigin;
          x.globalAlpha = 0.92;
          x.fillText('Sevgili ' + (state.alici || '') + ',', sol, b.y);
          x.globalAlpha = 1;
        } else if (b.tip === 'baslik') {
          x.font = '600 ' + b.boyut + 'px Georgia,"Times New Roman",serif';
          b.satirlar.forEach(function (s, i) {
            x.fillText(s, sol, b.y + i * b.boyut * 1.34);
          });
          const altY = b.y + (b.satirlar.length - 1) * b.boyut * 1.34 + b.boyut * 0.9;
          const gr = x.createLinearGradient(sol, 0, sol + 90, 0);
          gr.addColorStop(0, 'rgba(120,80,60,.55)');
          gr.addColorStop(1, 'rgba(120,80,60,0)');
          x.fillStyle = gr;
          x.fillRect(sol, altY, 90, 1.2);
          x.fillStyle = murekkep;
        } else if (b.tip === 'govde') {
          x.font = b.boyut + 'px ' + fYigin;
          x.globalAlpha = 0.94;
          b.satirlar.forEach(function (s, i) {
            x.fillText(s, sol, b.y + i * b.boyut * 1.72);
          });
          x.globalAlpha = 1;
        } else if (b.tip === 'imza') {
          x.font = b.boyut + 'px ' + fYigin;
          x.textAlign = 'right';
          x.globalAlpha = 0.9;
          x.fillText(state.imza || '', sag, b.y);
          x.globalAlpha = 1;
          x.textAlign = 'left';
        }
      });

      // mum mühür
      const mR = 62;
      const mX = sag - 30;
      const mY = H - 150;
      const mumRenk = getComputedStyle(document.documentElement).getPropertyValue('--mum').trim() || '#8d1b31';
      const mg = x.createRadialGradient(mX - mR * 0.35, mY - mR * 0.35, mR * 0.15, mX, mY, mR);
      mg.addColorStop(0, mumRenk);
      mg.addColorStop(0.72, mumRenk);
      mg.addColorStop(1, 'rgba(0,0,0,.35)');
      x.save();
      x.beginPath();
      const dilimler = 18;
      for (let i = 0; i <= dilimler; i++) {
        const a = (i / dilimler) * Math.PI * 2;
        const rr = mR * (0.94 + Math.sin(a * 5 + 1.3) * 0.06);
        const px2 = mX + Math.cos(a) * rr;
        const py = mY + Math.sin(a) * rr;
        if (i === 0) x.moveTo(px2, py);
        else x.lineTo(px2, py);
      }
      x.closePath();
      x.fillStyle = mg;
      x.shadowColor = 'rgba(0,0,0,.4)';
      x.shadowBlur = 18;
      x.shadowOffsetY = 8;
      x.fill();
      x.restore();

      // mühür deseni
      const desen = MUHURLER[state.muhur] || MUHURLER.gul;
      x.save();
      x.translate(mX - mR, mY - mR);
      x.scale((mR * 2) / 100, (mR * 2) / 100);
      x.strokeStyle = 'rgba(255,255,255,.82)';
      x.fillStyle = 'rgba(255,255,255,.82)';
      x.lineWidth = 2;
      x.beginPath();
      x.arc(50, 50, 44, 0, Math.PI * 2);
      x.setLineDash([1.6, 5.4]);
      x.stroke();
      x.setLineDash([]);
      desen.s.forEach(function (s) {
        const yol = new Path2D(s.d);
        if (s.m !== 'stroke') {
          x.globalAlpha = 0.18;
          x.fill(yol);
          x.globalAlpha = 1;
        }
        x.lineWidth = s.w;
        x.stroke(yol);
      });
      x.restore();

      // imza altı
      x.fillStyle = 'rgba(120,92,62,.4)';
      x.font = '13px "Segoe UI",sans-serif';
      x.textAlign = 'center';
      x.fillText('Numex Magic Letter', W / 2, H - 78);

      const blob = await new Promise(function (res) {
        c.toBlob(res, 'image/png');
      });
      if (!blob) throw new Error('png üretilemedi');
      return blob;
    }
  }

  /* ---------------- görünüm geçişleri ---------------- */
  function goster(id) {
    ['giris', 'gelen', 'atolye'].forEach(function (k) {
      const el = document.getElementById(k);
      if (el) el.classList.toggle('gizli', k !== id);
    });
    document.body.style.overflow = id === 'atolye' ? '' : '';
    if (id === 'atolye') {
      setTimeout(olcekle, 30);
      setTimeout(function () {
        sigdir(mektup);
      }, 60);
    }
    if (id === 'gelen') setTimeout(olcekle, 30);
  }

  /* ---------------- gelen mektup ---------------- */
  let gelenSahneRef = null;

  function gelenKur(veri) {
    state = Object.assign({}, VARSAYILAN, veri || {});
    const gl = gelenSahneRef;
    const z = gl.zarf;
    const m = gl.mektup;
    const mu = gl.muhur;

    z.classList.add('muhurlu');
    z.classList.remove('acik', 'kiriliyor');
    m.innerHTML = mektupHTML(state);
    m.style.fontFamily = fontYigin(state.font);
    m.style.transition = '';
    m.style.transform = 'translateY(150px) scale(.9,.26)';
    m.style.opacity = '0';
    mu.innerHTML = muhurSVG(state.muhur);

    const t = TEMALAR[state.tema] || TEMALAR.gece;
    kokStil.dataset.tema = state.tema;
    kokStil.style.setProperty('--kagit', state.kagit);
    kokStil.style.setProperty('--zarf', state.zarf);
    kokStil.style.setProperty('--mum', t.mum);
    kokStil.style.setProperty('--mfont', fontYigin(state.font));

    $('#gelenAlt').textContent = 'Mum mühürü kırmak için düğmeye dokun.';
    goster('gelen');
    setTimeout(olcekle, 40);
  }

  /* ---------------- başlat ---------------- */
  function baslat() {
    uiKur();

    // gelen sahne referansları
    const gk = $('#gelenKomp');
    gelenSahneRef = {
      zarf: gk.querySelector('.zarf'),
      mektup: gk.querySelector('.mektup'),
      muhur: gk.querySelector('.zarf-muhur')
    };

    const hash = location.hash || '';
    let gelenVeri = null;
    if (hash.indexOf('#m=') === 0) {
      try {
        gelenVeri = JSON.parse(b64oku(hash.slice(3)));
        if (!gelenVeri || typeof gelenVeri !== 'object' || typeof gelenVeri.m !== 'string') gelenVeri = null;
      } catch (e) {
        gelenVeri = null;
      }
    }

    if (gelenVeri) {
      gelenKur(gelenVeri);
    } else {
      yukle();
      ciz(true);
      goster('giris');
      $('#fAlici').value = state.alici || '';
      $('#fBaslik').value = state.baslik || '';
      $('#fMetin').value = state.metin || '';
      $('#fImza').value = state.imza || '';
      ciz();
    }

    // katmanlar
    katmanBoyut();
    ortamKur();
    requestAnimationFrame(ortamCiz);

    let boyutZaman = null;
    window.addEventListener('resize', function () {
      clearTimeout(boyutZaman);
      boyutZaman = setTimeout(function () {
        dpr = Math.min(window.devicePixelRatio || 1, 1.75);
        katmanBoyut();
        ortamKur();
        olcekle();
        sigdir(mektup);
      }, 160);
    });

    // giriş
    $('#girisBtn').addEventListener('click', function () {
      goster('atolye');
      const r = $('#girisBtn').getBoundingClientRect();
      patlat(r.left + r.width / 2, r.top + r.height / 2, 0.7);
    });

    $('#markaBtn').addEventListener('click', function () {
      goster('giris');
    });

    // mühürle
    $('#muhurleBtn').addEventListener('click', function () {
      muhurle(zarf, mektup, muhur);
    });

    $('#onizleBtn').addEventListener('click', function () {
      okumaAc();
    });

    // paylaşım
    $('#kopyalaBtn').addEventListener('click', kopyala);
    $('#pngBtn').addEventListener('click', pngUret);
    $('#kapatBtn').addEventListener('click', paylasimKapat);
    $('#acilisBtn').addEventListener('click', async function () {
      paylasimKapat();
      await bekleH(120);
      await acilis(zarf, mektup, muhur);
      okumaAc();
    });
    $('#paylasim').addEventListener('click', function (e) {
      if (e.target === $('#paylasim')) paylasimKapat();
    });

    // okuma
    $('#okumaKapat').addEventListener('click', okumaKapat);
    $('#okuma').addEventListener('click', function (e) {
      if (e.target === $('#okuma') || e.target.classList.contains('okuma-icerik')) okumaKapat();
    });

    // gelen mektup
    $('#gelenBtn').addEventListener('click', async function () {
      const b = $('#gelenBtn');
      b.disabled = true;
      await acilis(gelenSahneRef.zarf, gelenSahneRef.mektup, gelenSahneRef.muhur);
      okumaAc();
      b.disabled = false;
    });

    $('#gelenYeni').addEventListener('click', function () {
      history.replaceState(null, '', location.pathname);
      state = Object.assign({}, VARSAYILAN);
      ciz();
      $('#fAlici').value = state.alici;
      $('#fBaslik').value = state.baslik;
      $('#fMetin').value = state.metin;
      $('#fImza').value = state.imza;
      goster('atolye');
    });

    // adres çubuğunda yalnız hash değişirse (aynı sekmede bağlantı açma) sayfa yenilenmez —
    // bu yüzden gelen mektubu hashchange ile ayrıca karşılıyoruz.
    window.addEventListener('hashchange', function () {
      const h = location.hash || '';
      if (h.indexOf('#m=') !== 0) return;
      try {
        const v = JSON.parse(b64oku(h.slice(3)));
        if (v && typeof v.m === 'string') {
          okumaKapat();
          paylasimKapat();
          gelenKur(v);
        }
      } catch (e) {
        /* bozuk bağlantı — mevcut ekranda kal */
      }
    });

    // klavye
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        if (!$('#okuma').classList.contains('gizli')) okumaKapat();
        else if (!$('#paylasim').classList.contains('gizli')) paylasimKapat();
      }
    });

    olcekle();

    // test/hata ayıklama kancası
    window.__nml = {
      durum: function () { return JSON.parse(JSON.stringify(state)); },
      pngBlob: pngBlob,
      mektupEl: mektup,
      zarfEl: zarf
    };
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', baslat);
  } else {
    baslat();
  }
})();
