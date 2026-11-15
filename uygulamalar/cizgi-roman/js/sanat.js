/* NUMEX STORY FORGE — görsel üretim katmanı
   Tüm çizimler saf SVG'dir; harici görsel, font veya API bağımlılığı yoktur.
   PNG'ye rasterlanabilmesi için bütün stiller satır içi (inline) yazılır. */
(function (global) {
  'use strict';

  var INK = '#141210';
  var KONTUR = ' stroke="' + INK + '" stroke-linejoin="round" stroke-linecap="round" ';

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function rnd(seed) {
    var s = seed;
    return function () { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; };
  }

  /* ---------------------------------------------------------------- BALON */
  function sar(metin, maks) {
    var kelimeler = String(metin || '').replace(/\s+/g, ' ').trim().split(' ');
    var satirlar = [], satir = '';
    for (var i = 0; i < kelimeler.length; i++) {
      var deneme = satir ? satir + ' ' + kelimeler[i] : kelimeler[i];
      if (deneme.length > maks && satir) { satirlar.push(satir); satir = kelimeler[i]; }
      else { satir = deneme; }
    }
    if (satir) satirlar.push(satir);
    return satirlar.length ? satirlar : [''];
  }

  // Satırlar taban çizgisine göre dizilir (dominant-baseline tarayıcılar arası tutarsız).
  function metinBlogu(satirlar, cx, cy, boyut, renk, kalin) {
    var satirY = boyut * 1.2;
    var baslangic = cy - (satirlar.length - 1) * satirY / 2 + boyut * 0.34;
    var out = '<text x="' + cx + '" y="' + baslangic.toFixed(1) + '" text-anchor="middle" font-family="Verdana, Geneva, sans-serif" font-size="' + boyut +
      '" font-weight="' + (kalin ? 700 : 400) + '" fill="' + renk + '">';
    for (var i = 0; i < satirlar.length; i++) {
      out += '<tspan x="' + cx + '"' + (i === 0 ? '' : ' dy="' + satirY.toFixed(1) + '"') + '>' + esc(satirlar[i]) + '</tspan>';
    }
    return out + '</text>';
  }

  // Balon: 260x180 kutu. yon: 'sol' | 'sag' | 'yok'
  function balon(alt, metin, yon) {
    var y = yon || 'sol';
    var g = '<g' + KONTUR + '>';
    var metinKat = '';
    if (alt === 'dusunce') {
      g += '<path d="M130 20 C 66 20 24 48 24 82 C 24 112 58 134 104 136 C 120 158 152 158 168 138 C 214 138 246 116 246 84 C 246 48 198 20 130 20 Z" fill="#fdfbf4" stroke-width="4"/>';
      g += (y === 'sol' ? '<circle cx="70" cy="158" r="12" fill="#fdfbf4" stroke-width="4"/><circle cx="46" cy="176" r="7" fill="#fdfbf4" stroke-width="4"/>'
        : y === 'sag' ? '<circle cx="190" cy="158" r="12" fill="#fdfbf4" stroke-width="4"/><circle cx="214" cy="176" r="7" fill="#fdfbf4" stroke-width="4"/>' : '');
      metinKat = metinBlogu(sar(metin, 22), 134, 82, 19, INK, false);
    } else if (alt === 'efekt') {
      var p = 'M130 6 L152 48 L198 30 L186 74 L242 78 L200 108 L232 148 L178 142 L166 178 L130 146 L94 178 L82 142 L28 148 L60 108 L18 78 L74 74 L62 30 L108 48 Z';
      g += '<path d="' + p + '" fill="#ffd23f" stroke-width="5"/>';
      metinKat = '<text x="130" y="96" text-anchor="middle" font-family="Impact, Haettenschweiler, \'Arial Black\', sans-serif" font-size="34" font-weight="900" fill="#c8342b" dominant-baseline="middle" transform="rotate(-6 130 96)">' + esc(String(metin || '').slice(0, 14).toUpperCase()) + '</text>';
    } else if (alt === 'anlati') {
      g += '<rect x="10" y="22" width="240" height="134" rx="4" fill="#f6e7b8" stroke-width="4"/>';
      metinKat = metinBlogu(sar(metin, 26), 130, 89, 15, '#3a2c12', false);
    } else {
      g += '<path d="M130 18 C 60 18 20 46 20 82 C 20 118 62 142 122 142 C 138 142 152 140 164 136 L 200 168 L 192 126 C 226 112 240 96 240 82 C 240 46 200 18 130 18 Z" fill="#fdfbf4" stroke-width="5"/>';
      if (y === 'sag') g += '<path d="M150 140 L 214 176 L 186 132 Z" fill="#fdfbf4" stroke-width="5"/>';
      if (y === 'sol') g += '<path d="M110 140 L 46 176 L 74 132 Z" fill="#fdfbf4" stroke-width="5"/>';
      metinKat = metinBlogu(sar(metin, 22), 130, 80, 19, INK, false);
    }
    g += metinKat + '</g>';
    return '<svg viewBox="0 0 260 190" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">' + g + '</svg>';
  }

  /* ------------------------------------------------------------- KARAKTER */
  // viewBox: 0 0 200 380 — taban çizgisi y=372
  var POZLAR = {
    ayakta: { kolS: -10, kolD: 10, bacakS: -5, bacakD: 5, egim: 0, otur: false },
    yuruyor: { kolS: -30, kolD: 26, bacakS: -20, bacakD: 18, egim: 2, otur: false },
    kosuyor: { kolS: -58, kolD: 58, bacakS: -36, bacakD: 32, egim: 7, otur: false },
    kollarHavada: { kolS: -148, kolD: 148, bacakS: -10, bacakD: 10, egim: 0, otur: false },
    savasiyor: { kolS: -100, kolD: 22, bacakS: -22, bacakD: 20, egim: 4, otur: false },
    dusunuyor: { kolS: -70, kolD: 12, bacakS: -6, bacakD: 6, egim: 0, otur: false },
    oturuyor: { kolS: -55, kolD: 40, bacakS: -70, bacakD: -60, egim: 0, otur: true }
  };
  var POZ_ADLARI = { ayakta: 'Ayakta', yuruyor: 'Yürüyor', kosuyor: 'Koşuyor', kollarHavada: 'Kollar havada', savasiyor: 'Dövüşüyor', dusunuyor: 'Düşünüyor', oturuyor: 'Oturuyor' };
  var IFADELER = { notr: 'Sakin', mutlu: 'Mutlu', kizgin: 'Kızgın', saskin: 'Şaşkın', uzgun: 'Üzgün', korkmus: 'Korkmuş' };

  var KARAKTERLER = [
    { id: 'kerem', ad: 'Kaptan Kerem', unvan: 'Pilot', ten: '#e8b48a', sac: '#3b2a20', stil: 'kisa', giysi: '#1f3a63', giysi2: '#33477a', aksesuar: ['atki'], atki: '#c8342b' },
    { id: 'zeynep', ad: 'Zeynep Yıldız', unvan: 'Mucit', ten: '#f0c39c', sac: '#7a3f8f', stil: 'topuz', giysi: '#e07a2f', giysi2: '#f2a55c', aksesuar: ['gozluk'] },
    { id: 'bilgin', ad: 'Prof. Bilgin', unvan: 'Bilim insanı', ten: '#dfae87', sac: '#cfcfcf', stil: 'kel', giysi: '#f2f0e8', giysi2: '#d8d4c4', aksesuar: ['sakal', 'yuvarlak'], genis: 0.94 },
    { id: 'demir', ad: 'Demir Kalkan', unvan: 'Koruma', ten: '#c98d63', sac: '#2b2b2b', stil: 'kel', giysi: '#2f5d45', giysi2: '#427a5c', aksesuar: ['yara'], genis: 1.26, agir: true },
    { id: 'leyla', ad: 'Leyla Fırtına', unvan: 'Haberci', ten: '#efc49f', sac: '#191919', stil: 'atkuyrugu', giysi: '#b02a26', giysi2: '#d4433e', aksesuar: [] },
    { id: 'r7', ad: 'R-7 Rüzgâr', unvan: 'Eski robot', ten: '#b9c4cc', sac: '#8d9aa4', stil: 'robot', giysi: '#8d9aa4', giysi2: '#6c7a85', aksesuar: [], agir: true },
    { id: 'ada', ad: 'Ada Deniz', unvan: 'Denizci', ten: '#f2cba9', sac: '#e3b23c', stil: 'uzun', giysi: '#1f6f8b', giysi2: '#2e93b3', aksesuar: ['bant'] },
    { id: 'golge', ad: 'Gölge', unvan: 'Gizemli', ten: '#cba98f', sac: '#1b1230', stil: 'kapuson', giysi: '#4b2d7f', giysi2: '#6a44a8', aksesuar: ['maske', 'pelerin'], pelerin: '#3a2064' },
    { id: 'pamuk', ad: 'Pamuk', unvan: 'Maskot kedi', ten: '#f4efe2', sac: '#d9d0bc', stil: 'kedi', giysi: '#f4efe2', giysi2: '#ded4bf', aksesuar: [], genis: 0.62, kedi: true }
  ];

  function yuz(ifade) {
    var goz = '', agiz = '', kas = '';
    if (ifade === 'mutlu') {
      goz = '<path d="M78 82 q7 -8 14 0" fill="none" stroke-width="4"/><path d="M108 82 q7 -8 14 0" fill="none" stroke-width="4"/>';
      agiz = '<path d="M84 104 q16 14 32 0" fill="none" stroke-width="4"/>';
    } else if (ifade === 'kizgin') {
      goz = '<circle cx="85" cy="84" r="5" fill="' + INK + '"/><circle cx="115" cy="84" r="5" fill="' + INK + '"/>';
      kas = '<path d="M74 68 l18 8" stroke-width="5"/><path d="M126 68 l-18 8" stroke-width="5"/>';
      agiz = '<path d="M84 110 q16 -12 32 0" fill="none" stroke-width="4"/>';
    } else if (ifade === 'saskin') {
      goz = '<circle cx="85" cy="82" r="9" fill="#fff" stroke-width="3"/><circle cx="115" cy="82" r="9" fill="#fff" stroke-width="3"/><circle cx="85" cy="82" r="3.5" fill="' + INK + '"/><circle cx="115" cy="82" r="3.5" fill="' + INK + '"/>';
      agiz = '<ellipse cx="100" cy="108" rx="8" ry="10" fill="#8a3f3f" stroke-width="3"/>';
    } else if (ifade === 'uzgun') {
      goz = '<circle cx="85" cy="85" r="4.5" fill="' + INK + '"/><circle cx="115" cy="85" r="4.5" fill="' + INK + '"/>';
      kas = '<path d="M74 70 l18 -6" stroke-width="4"/><path d="M126 70 l-18 -6" stroke-width="4"/>';
      agiz = '<path d="M84 112 q16 -14 32 0" fill="none" stroke-width="4"/>';
    } else if (ifade === 'korkmus') {
      goz = '<circle cx="85" cy="82" r="8" fill="#fff" stroke-width="3"/><circle cx="115" cy="82" r="8" fill="#fff" stroke-width="3"/><circle cx="85" cy="83" r="2.5" fill="' + INK + '"/><circle cx="115" cy="83" r="2.5" fill="' + INK + '"/>';
      agiz = '<path d="M86 106 q7 8 14 0 q7 -8 14 0" fill="none" stroke-width="3"/>';
    } else {
      goz = '<circle cx="85" cy="84" r="5" fill="' + INK + '"/><circle cx="115" cy="84" r="5" fill="' + INK + '"/>';
      agiz = '<path d="M86 108 h28" fill="none" stroke-width="4"/>';
    }
    return '<g' + KONTUR + '>' + kas + goz + agiz + '</g>';
  }

  function sacStili(k, poz) {
    var s = k.stil, c = k.sac, out = '';
    if (s === 'kel') {
      out += '<path d="M70 62 q4 -22 30 -22 q26 0 30 22 q-10 -10 -30 -10 q-20 0 -30 10 Z" fill="' + c + '" stroke-width="4"/>';
    } else if (s === 'kisa') {
      out += '<path d="M66 66 q0 -34 34 -34 q34 0 34 34 q-8 -16 -34 -16 q-26 0 -34 16 Z" fill="' + c + '" stroke-width="4"/>';
    } else if (s === 'topuz') {
      out += '<circle cx="100" cy="24" r="16" fill="' + c + '" stroke-width="4"/>';
      out += '<path d="M64 68 q-2 -36 36 -36 q38 0 36 36 q-10 -18 -36 -18 q-26 0 -36 18 Z" fill="' + c + '" stroke-width="4"/>';
    } else if (s === 'atkuyrugu') {
      out += '<path d="M66 66 q0 -36 34 -36 q34 0 34 36 q-10 -18 -34 -18 q-24 0 -34 18 Z" fill="' + c + '" stroke-width="4"/>';
      out += '<path d="M134 58 q26 6 22 46 q-2 18 -14 22 q8 -26 -8 -46 Z" fill="' + c + '" stroke-width="4"/>';
    } else if (s === 'uzun') {
      out += '<path d="M64 70 q-4 -40 36 -40 q40 0 36 40 q2 44 -4 62 q-8 -8 -14 -58 q-8 10 -18 10 q-10 0 -18 -10 q-6 50 -14 58 q-6 -18 -4 -62 Z" fill="' + c + '" stroke-width="4"/>';
    } else if (s === 'kapuson') {
      out += '<path d="M56 96 q-8 -70 44 -70 q52 0 44 70 q-6 10 -16 12 q6 -46 -28 -46 q-34 0 -28 46 q-10 -2 -16 -12 Z" fill="' + k.giysi + '" stroke-width="4"/>';
    } else if (s === 'robot') {
      out += '<rect x="66" y="46" width="68" height="20" rx="8" fill="' + k.sac + '" stroke-width="4"/>';
      out += '<rect x="96" y="22" width="8" height="22" rx="4" fill="' + k.giysi2 + '" stroke-width="3"/><circle cx="100" cy="20" r="7" fill="#e0431f" stroke-width="3"/>';
    }
    return out;
  }

  function karakter(k, sec) {
    sec = sec || {};
    var poz = POZLAR[sec.poz] || POZLAR.ayakta;
    var ifade = sec.ifade || 'notr';
    var gen = k.genis || 1;
    var g = '';

    if (k.kedi) {
      // küçük maskot kedi
      g += '<g' + KONTUR + '>';
      g += '<ellipse cx="100" cy="330" rx="52" ry="34" fill="' + k.ten + '" stroke-width="5"/>';
      g += '<circle cx="100" cy="272" r="38" fill="' + k.ten + '" stroke-width="5"/>';
      g += '<path d="M72 250 l-6 -30 l26 14 Z" fill="' + k.sac + '" stroke-width="4"/><path d="M128 250 l6 -30 l-26 14 Z" fill="' + k.sac + '" stroke-width="4"/>';
      g += yuz(ifade);
      g += '<path d="M158 326 q34 -6 26 -40" fill="none" stroke-width="7"/>';
      g += '<path d="M52 336 q-16 6 -24 0" fill="none" stroke-width="4"/><path d="M148 336 q16 6 24 0" fill="none" stroke-width="4"/>';
      g += '</g>';
      return '<svg viewBox="0 0 200 380" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">' + g + '</svg>';
    }

    var egim = poz.egim || 0;
    g += '<g transform="rotate(' + egim + ' 100 330)">';

    // gölge
    g += '<ellipse cx="100" cy="366" rx="' + (52 * gen) + '" ry="10" fill="rgba(20,18,16,0.18)"/>';

    // pelerin (arka)
    if (k.aksesuar.indexOf('pelerin') >= 0) {
      g += '<path d="M74 168 q-34 90 -40 142 q40 16 66 10 q26 6 66 -10 q-6 -52 -40 -142 Z" fill="' + (k.pelerin || '#3a2064') + '"' + KONTUR + ' stroke-width="5"/>';
    }

    // bacaklar
    var bacak = function (x, aci, x2) {
      return '<g transform="rotate(' + aci + ' ' + x + ' 246)">' +
        '<path d="M' + x + ' 244 L' + x2 + ' 340" fill="none" stroke="' + INK + '" stroke-width="' + (26 * gen) + '" stroke-linecap="round"/>' +
        '<path d="M' + x + ' 244 L' + x2 + ' 340" fill="none" stroke="' + k.giysi2 + '" stroke-width="' + (17 * gen) + '" stroke-linecap="round"/>' +
        (poz.otur ? '' : '<ellipse cx="' + (x2 + 6) + '" cy="350" rx="' + (16 * gen) + '" ry="10" fill="' + INK + '"' + KONTUR + ' stroke-width="4"/>') +
        '</g>';
    };
    g += bacak(86, poz.bacakS, 80);
    g += bacak(114, poz.bacakD, 120);

    // gövde
    var gw = 28 * gen;
    g += '<path d="M' + (100 - gw) + ' 160 q' + gw + ' -12 ' + (gw * 2) + ' 0 L' + (100 + gw + 4) + ' 248 q' + (-gw - 4) + ' 12 ' + (-gw * 2 - 8) + ' 0 Z" fill="' + k.giysi + '"' + KONTUR + ' stroke-width="5"/>';
    // göğüs detayı
    if (k.stil === 'robot') {
      g += '<rect x="76" y="182" width="48" height="34" rx="6" fill="' + k.giysi2 + '" stroke="' + INK + '" stroke-width="4"/>' +
        '<circle cx="86" cy="199" r="5" fill="#e0431f"/><circle cx="100" cy="199" r="5" fill="#2f9e5c"/><circle cx="114" cy="199" r="5" fill="#ffd23f"/>';
    } else if (k.aksesuar.indexOf('atki') >= 0) {
      g += '<path d="M76 158 q24 12 48 0 l4 14 q-28 12 -56 0 Z" fill="' + k.atki + '"' + KONTUR + ' stroke-width="4"/>' +
        '<path d="M118 172 l10 46 q-10 6 -16 -2 l-4 -40 Z" fill="' + k.atki + '"' + KONTUR + ' stroke-width="4"/>';
    } else if (k.aksesuar.indexOf('bant') >= 0) {
      g += '<path d="M74 176 h52" stroke="' + INK + '" stroke-width="8"/><path d="M74 176 h52" stroke="#e8e2cf" stroke-width="4" stroke-dasharray="6 6"/>';
    } else {
      g += '<path d="M100 166 v' + (72) + '" stroke="' + INK + '" stroke-width="3" opacity="0.5"/>';
    }

    // kollar
    var kol = function (x, aci, yon) {
      return '<g transform="rotate(' + aci + ' ' + x + ' 172)">' +
        '<path d="M' + x + ' 172 L' + (x + yon * 6) + ' 244" fill="none" stroke="' + INK + '" stroke-width="' + (22 * gen) + '" stroke-linecap="round"/>' +
        '<path d="M' + x + ' 172 L' + (x + yon * 6) + ' 244" fill="none" stroke="' + (k.stil === 'robot' ? k.giysi2 : k.giysi) + '" stroke-width="' + (14 * gen) + '" stroke-linecap="round"/>' +
        '<circle cx="' + (x + yon * 6) + '" cy="248" r="' + (9 * gen) + '" fill="' + k.ten + '"' + KONTUR + ' stroke-width="4"/>' +
        '</g>';
    };
    g += kol(100 - gw + 2, poz.kolS, -1);
    g += kol(100 + gw - 2, poz.kolD, 1);

    // boyun + baş
    g += '<rect x="90" y="132" width="20" height="26" fill="' + k.ten + '"' + KONTUR + ' stroke-width="4"/>';
    g += '<ellipse cx="100" cy="82" rx="' + (34 * (gen > 1.1 ? 1.06 : 1)) + '" ry="40" fill="' + k.ten + '"' + KONTUR + ' stroke-width="5"/>';

    if (k.stil === 'robot') {
      g += '<rect x="70" y="60" width="60" height="26" rx="6" fill="' + INK + '"/>' +
        '<circle cx="86" cy="73" r="6" fill="#7ce0ff"/><circle cx="114" cy="73" r="6" fill="#7ce0ff"/>' +
        '<path d="M88 100 h24" stroke="' + INK + '" stroke-width="4"/>';
    } else {
      g += yuz(ifade);
    }
    g += sacStili(k, poz);

    // aksesuarlar
    if (k.aksesuar.indexOf('gozluk') >= 0) {
      g += '<g' + KONTUR + ' stroke-width="4" fill="rgba(180,225,255,0.55)"><circle cx="85" cy="84" r="15"/><circle cx="115" cy="84" r="15"/><path d="M100 84 h0" fill="none"/><path d="M70 80 L60 74" fill="none"/><path d="M130 80 L140 74" fill="none"/></g>';
    }
    if (k.aksesuar.indexOf('yuvarlak') >= 0) {
      g += '<g' + KONTUR + ' stroke-width="3.5" fill="rgba(200,230,255,0.45)"><circle cx="85" cy="84" r="14"/><circle cx="115" cy="84" r="14"/><path d="M99 84 h2" fill="none"/></g>';
    }
    if (k.aksesuar.indexOf('sakal') >= 0) {
      g += '<path d="M68 96 q4 46 32 46 q28 0 32 -46 q-14 22 -32 22 q-18 0 -32 -22 Z" fill="' + k.sac + '"' + KONTUR + ' stroke-width="4"/>' +
        '<path d="M84 76 q16 -6 32 0" fill="none" stroke="' + INK + '" stroke-width="3"/>';
    }
    if (k.aksesuar.indexOf('maske') >= 0) {
      g += '<path d="M66 66 q34 -14 68 0 q-4 26 -34 26 q-30 0 -34 -26 Z" fill="#2a1a45"' + KONTUR + ' stroke-width="4"/>' +
        '<circle cx="86" cy="78" r="4" fill="#f5f0ff"/><circle cx="114" cy="78" r="4" fill="#f5f0ff"/>';
    }
    if (k.aksesuar.indexOf('yara') >= 0) {
      g += '<path d="M112 60 l10 14 M122 60 l-10 14" stroke="#8a3f3f" stroke-width="3.5" fill="none" stroke-linecap="round"/>';
    }
    g += '</g>';
    return '<svg viewBox="0 0 200 380" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">' + g + '</svg>';
  }

  /* --------------------------------------------------------------- MEKÂN */
  // viewBox: 0 0 400 300
  function mekan(id) {
    var g = '', i;
    var R = rnd(42);
    if (id === 'catilar') {
      g += '<defs><linearGradient id="g-cati" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2b2a63"/><stop offset="0.45" stop-color="#a2486d"/><stop offset="0.78" stop-color="#e8794a"/><stop offset="1" stop-color="#f6b45c"/></linearGradient></defs>';
      g += '<rect width="400" height="300" fill="url(#g-cati)"/>';
      g += '<circle cx="290" cy="180" r="46" fill="#ffe3a3" opacity="0.95"/>';
      for (i = 0; i < 7; i++) g += '<rect x="' + (i * 62 - 10) + '" y="' + (170 + (i % 3) * 22) + '" width="52" height="140" fill="#221a34" opacity="0.92"/>';
      for (i = 0; i < 26; i++) g += '<rect x="' + (R() * 380) + '" y="' + (185 + R() * 100) + '" width="6" height="8" fill="#ffd98a" opacity="0.8"/>';
      g += '<path d="M0 262 h400 v38 H0 Z" fill="#171226"/>';
      g += '<path d="M0 268 q100 -16 200 0 q100 16 200 0" fill="none" stroke="#0d0a17" stroke-width="4"/>';
      g += '<rect x="26" y="196" width="60" height="8" fill="#0d0a17"/><rect x="46" y="150" width="6" height="50" fill="#0d0a17"/><circle cx="49" cy="148" r="9" fill="#ffe3a3"/>';
    } else if (id === 'uzay') {
      g += '<defs><radialGradient id="g-uzay" cx="0.5" cy="0.4" r="0.9"><stop offset="0" stop-color="#1c2a55"/><stop offset="1" stop-color="#070a17"/></radialGradient></defs>';
      g += '<rect width="400" height="300" fill="url(#g-uzay)"/>';
      for (i = 0; i < 90; i++) g += '<circle cx="' + (R() * 400).toFixed(1) + '" cy="' + (R() * 300).toFixed(1) + '" r="' + (0.6 + R() * 1.7).toFixed(1) + '" fill="#fff" opacity="' + (0.4 + R() * 0.6).toFixed(2) + '"/>';
      g += '<circle cx="320" cy="70" r="52" fill="#3f6fb5"/><circle cx="320" cy="70" r="52" fill="none" stroke="#7fb2e8" stroke-width="2" opacity="0.6"/><ellipse cx="320" cy="70" rx="76" ry="14" fill="none" stroke="#9fd0ff" stroke-width="3" opacity="0.75"/>';
      g += '<g opacity="0.9"><rect x="20" y="180" width="120" height="60" rx="6" fill="#43536b" stroke="#8598b0" stroke-width="2"/><rect x="34" y="194" width="30" height="16" fill="#9fe0ff" opacity="0.8"/><rect x="74" y="194" width="30" height="16" fill="#9fe0ff" opacity="0.5"/><path d="M80 180 v-40" stroke="#8598b0" stroke-width="3"/></g>';
      g += '<path d="M0 262 h400 v38 H0 Z" fill="#111a2c" opacity="0.9"/><path d="M0 262 h400" stroke="#5b7ea8" stroke-width="3"/>';
    } else if (id === 'orman') {
      g += '<defs><linearGradient id="g-orman" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#20402e"/><stop offset="0.6" stop-color="#2f6144"/><stop offset="1" stop-color="#16301f"/></linearGradient></defs>';
      g += '<rect width="400" height="300" fill="url(#g-orman)"/>';
      for (i = 0; i < 9; i++) g += '<rect x="' + (i * 46 + 8) + '" y="' + (20 + (i % 4) * 12) + '" width="' + (10 + (i % 3) * 6) + '" height="250" fill="#122a1c" opacity="0.85"/>';
      for (i = 0; i < 5; i++) g += '<path d="M' + (-20 + i * 100) + ' 0 L' + (60 + i * 100) + ' 300 L' + (110 + i * 100) + ' 300 L' + (30 + i * 100) + ' 0 Z" fill="#c9f2c0" opacity="0.07"/>';
      g += '<ellipse cx="200" cy="130" rx="220" ry="46" fill="#cfe9d0" opacity="0.12"/>';
      g += '<path d="M0 266 q100 -22 200 0 q100 22 200 0 v34 H0 Z" fill="#0f2417"/>';
      for (i = 0; i < 14; i++) g += '<path d="M' + (R() * 400) + ' ' + (250 + R() * 40) + ' q6 -10 12 0" fill="none" stroke="#3d7a52" stroke-width="2.5" opacity="0.8"/>';
    } else if (id === 'laboratuvar') {
      g += '<rect width="400" height="300" fill="#dfe6ea"/>';
      for (i = 0; i < 10; i++) g += '<path d="M0 ' + (i * 30) + ' h400" stroke="#c3ced4" stroke-width="1.4"/>';
      g += '<rect x="0" y="0" width="400" height="120" fill="#cdd8de"/>';
      g += '<rect x="24" y="30" width="120" height="74" rx="4" fill="#0f2a38" stroke="#7d8f99" stroke-width="3"/><path d="M32 74 l24 -20 l18 16 l22 -26 l24 30" fill="none" stroke="#41e0a8" stroke-width="3"/>';
      g += '<rect x="176" y="34" width="90" height="66" rx="4" fill="#f7fbfd" stroke="#7d8f99" stroke-width="3"/><rect x="186" y="46" width="70" height="6" fill="#9ad5ef"/><rect x="186" y="60" width="52" height="6" fill="#9ad5ef"/><rect x="186" y="74" width="62" height="6" fill="#9ad5ef"/>';
      g += '<rect x="0" y="212" width="400" height="88" fill="#b8c5cc"/><rect x="0" y="206" width="400" height="10" fill="#8fa1ab"/>';
      g += '<rect x="30" y="160" width="46" height="52" fill="#e8f4fa" stroke="#7d8f99" stroke-width="3"/><rect x="36" y="176" width="34" height="36" fill="#6fd2c0" opacity="0.8"/>';
      g += '<path d="M300 206 v-60 h60 v60" fill="none" stroke="#8fa1ab" stroke-width="6"/><circle cx="330" cy="130" r="16" fill="#ffe9a8" stroke="#8fa1ab" stroke-width="3"/>';
    } else if (id === 'col') {
      g += '<defs><linearGradient id="g-col" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffd99b"/><stop offset="0.55" stop-color="#f4a95f"/><stop offset="1" stop-color="#d98141"/></linearGradient></defs>';
      g += '<rect width="400" height="300" fill="url(#g-col)"/>';
      g += '<circle cx="310" cy="66" r="34" fill="#fff3c9" opacity="0.95"/>';
      g += '<path d="M0 190 q80 -46 170 -6 q70 30 230 -14 v130 H0 Z" fill="#e7b071"/>';
      g += '<path d="M0 226 q120 -34 210 4 q70 24 190 -6 v76 H0 Z" fill="#d99a58"/>';
      g += '<path d="M0 262 q130 -20 240 6 q80 20 160 -2 v34 H0 Z" fill="#c98748"/>';
      g += '<path d="M52 236 v-52 M52 196 h-20 v-18 M52 208 h22 v-16" stroke="#7c5a30" stroke-width="7" fill="none" stroke-linecap="round"/>';
      g += '<path d="M300 250 l18 -34 l18 34 Z" fill="#8a6236" stroke="#6d4c28" stroke-width="3"/>';
      for (i = 0; i < 12; i++) g += '<path d="M' + (R() * 400) + ' ' + (120 + R() * 60) + ' h' + (20 + R() * 40) + '" stroke="#fff1cf" stroke-width="2" opacity="0.5"/>';
    } else if (id === 'denizalti') {
      g += '<defs><linearGradient id="g-deniz" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0f5f8a"/><stop offset="0.6" stop-color="#0a3b5c"/><stop offset="1" stop-color="#04202f"/></linearGradient></defs>';
      g += '<rect width="400" height="300" fill="url(#g-deniz)"/>';
      for (i = 0; i < 5; i++) g += '<path d="M' + (20 + i * 80) + ' 0 L' + (60 + i * 80) + ' 300 L' + (100 + i * 80) + ' 300 L' + (60 + i * 80) + ' 0 Z" fill="#bff0ff" opacity="0.07"/>';
      for (i = 0; i < 26; i++) g += '<circle cx="' + (R() * 400).toFixed(0) + '" cy="' + (R() * 300).toFixed(0) + '" r="' + (1 + R() * 4).toFixed(1) + '" fill="#cdf3ff" opacity="' + (0.2 + R() * 0.5).toFixed(2) + '" stroke="none"/>';
      g += '<path d="M0 254 q60 -30 120 -6 q40 16 90 -4 q60 -22 190 6 v50 H0 Z" fill="#062c3d"/>';
      g += '<path d="M40 256 q12 -46 24 0 Z M300 258 q10 -54 22 0 Z" fill="#0b4557"/>';
      g += '<path d="M150 236 q16 -12 32 0 q-16 12 -32 0 Z" fill="#7fd8e8" opacity="0.8"/>';
      g += '<path d="M210 214 q12 -8 24 0 q-12 8 -24 0 Z" fill="#7fd8e8" opacity="0.7"/>';
    } else {
      // gece sokak
      g += '<defs><linearGradient id="g-sokak" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1a1c3a"/><stop offset="1" stop-color="#3a2f57"/></linearGradient></defs>';
      g += '<rect width="400" height="300" fill="url(#g-sokak)"/>';
      g += '<rect x="10" y="60" width="110" height="210" fill="#161832"/><rect x="140" y="34" width="120" height="236" fill="#1d2038"/><rect x="280" y="76" width="110" height="194" fill="#141530"/>';
      for (i = 0; i < 34; i++) {
        var bx = [18, 148, 288][Math.floor(R() * 3)];
        g += '<rect x="' + (bx + R() * 90).toFixed(0) + '" y="' + (70 + R() * 180).toFixed(0) + '" width="10" height="12" fill="#ffd98a" opacity="' + (0.25 + R() * 0.6).toFixed(2) + '"/>';
      }
      g += '<rect x="0" y="262" width="400" height="38" fill="#0d0e1e"/>';
      g += '<rect x="196" y="150" width="8" height="112" fill="#0d0e1e"/><circle cx="200" cy="146" r="16" fill="#ffeaa7" opacity="0.9"/><path d="M184 146 L216 146 L240 262 L160 262 Z" fill="#ffeaa7" opacity="0.13"/>';
      for (i = 0; i < 40; i++) g += '<path d="M' + (R() * 400).toFixed(0) + ' ' + (R() * 250).toFixed(0) + ' l-6 18" stroke="#9fb8e0" stroke-width="1.6" opacity="0.35"/>';
    }
    return '<svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">' + g + '</svg>';
  }

  /* --------------------------------------------------------------- NESNE */
  // viewBox: 0 0 160 160
  var NESNELER = [
    { id: 'ucanArac', ad: 'Uçan araç' }, { id: 'tabanca', ad: 'Lazer tabanca' },
    { id: 'sandik', ad: 'Hazine sandığı' }, { id: 'kristal', ad: 'Enerji kristali' },
    { id: 'lamba', ad: 'Sokak lambası' }, { id: 'cihaz', ad: 'Radar cihazı' },
    { id: 'kalkan', ad: 'Enerji kalkanı' }, { id: 'roket', ad: 'Roket sırtlığı' }
  ];

  function nesne(id) {
    var g = '<g' + KONTUR + ' stroke-width="4">';
    if (id === 'ucanArac') {
      g += '<path d="M14 96 q10 -30 52 -30 h26 q26 0 40 22 l14 22 q-8 14 -34 14 H44 q-26 0 -30 -28 Z" fill="#c8342b"/>';
      g += '<path d="M58 70 q16 -18 36 -16 q16 2 22 18 Z" fill="#bfe6f7"/>';
      g += '<rect x="120" y="98" width="26" height="10" rx="5" fill="#2b2b2b"/><circle cx="150" cy="92" r="12" fill="#7ce0ff" opacity="0.85" stroke="none"/>';
      g += '<path d="M36 124 v14 M96 126 v14" stroke-width="6"/><ellipse cx="36" cy="146" rx="16" ry="6" fill="#3a3a3a"/><ellipse cx="96" cy="146" rx="16" ry="6" fill="#3a3a3a"/>';
      g += '<circle cx="52" cy="86" r="9" fill="#ffe9a8"/>';
    } else if (id === 'tabanca') {
      g += '<path d="M26 54 h74 q16 0 16 14 v12 q0 12 -16 12 H70 l-8 34 q-4 14 -18 12 l-14 -4 q-12 -4 -8 -16 L40 92 H26 q-12 0 -12 -12 V66 q0 -12 12 -12 Z" fill="#4a5560"/>';
      g += '<rect x="98" y="58" width="22" height="16" rx="4" fill="#7ce0ff" stroke="none"/>';
      g += '<path d="M30 66 h40" stroke="#9fb0bd" stroke-width="4"/>';
    } else if (id === 'sandik') {
      g += '<rect x="18" y="66" width="124" height="66" rx="6" fill="#8a5a2b"/>';
      g += '<path d="M18 78 q62 -34 124 0" fill="#a06a33"/>';
      g += '<rect x="66" y="86" width="28" height="30" rx="4" fill="#ffd23f"/>';
      g += '<path d="M18 96 h124" stroke-width="3" opacity="0.5"/>';
    } else if (id === 'kristal') {
      g += '<path d="M80 16 L112 66 L96 140 L64 140 L48 66 Z" fill="#7ce0ff" opacity="0.92"/>';
      g += '<path d="M80 16 L80 140 M48 66 h64" fill="none" stroke="#2a7a95" stroke-width="2.5"/>';
      g += '<circle cx="80" cy="80" r="52" fill="#a8f0ff" opacity="0.14" stroke="none"/>';
    } else if (id === 'lamba') {
      g += '<rect x="76" y="46" width="8" height="100" fill="#3b4550"/>';
      g += '<path d="M60 46 h40 q-6 -26 -20 -26 q-14 0 -20 26 Z" fill="#ffe9a8"/>';
      g += '<path d="M62 46 q18 10 36 0" fill="none" stroke-width="5"/>';
      g += '<rect x="62" y="140" width="36" height="10" rx="4" fill="#3b4550"/>';
    } else if (id === 'cihaz') {
      g += '<rect x="26" y="52" width="108" height="72" rx="8" fill="#3f4b57"/>';
      g += '<circle cx="80" cy="88" r="30" fill="#0d3b2a"/>';
      g += '<circle cx="80" cy="88" r="20" fill="none" stroke="#41e0a8" stroke-width="3"/><path d="M80 88 L100 70" stroke="#41e0a8" stroke-width="3"/>';
      g += '<rect x="34" y="128" width="92" height="12" rx="6" fill="#2b343d"/>';
    } else if (id === 'kalkan') {
      g += '<path d="M80 18 L130 40 q0 62 -50 104 Q30 102 30 40 Z" fill="#4fa3d8" opacity="0.9"/>';
      g += '<path d="M80 34 L114 50 q0 46 -34 78 Q46 96 46 50 Z" fill="none" stroke="#d8f3ff" stroke-width="3"/>';
      g += '<circle cx="80" cy="72" r="14" fill="#ffd23f"/>';
    } else {
      g += '<path d="M56 24 q24 -14 48 0 q14 10 14 28 v66 q0 18 -18 18 H60 q-18 0 -18 -18 V52 q0 -18 14 -28 Z" fill="#6b7a86"/>';
      g += '<path d="M56 64 h48 M56 100 h48" stroke-width="3" stroke="#3d4854"/>';
      g += '<path d="M62 118 q18 30 36 0" fill="none" stroke="#ff8a3d" stroke-width="7"/>';
    }
    return '<svg viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">' + g + '</g></svg>';
  }

  /* --------------------------------------------------------------- KATALOG */
  function karakterBul(id) {
    for (var i = 0; i < KARAKTERLER.length; i++) if (KARAKTERLER[i].id === id) return KARAKTERLER[i];
    return KARAKTERLER[0];
  }
  function nesneAdi(id) {
    for (var i = 0; i < NESNELER.length; i++) if (NESNELER[i].id === id) return NESNELER[i].ad;
    return id;
  }

  global.Sanat = {
    INK: INK,
    KARAKTERLER: KARAKTERLER,
    NESNELER: NESNELER,
    MEKANLAR: [
      { id: 'catilar', ad: 'Gün batımı çatıları' }, { id: 'uzay', ad: 'Uzay istasyonu' },
      { id: 'orman', ad: 'Sisli orman' }, { id: 'laboratuvar', ad: 'Laboratuvar' },
      { id: 'col', ad: 'Çöl kumulları' }, { id: 'denizalti', ad: 'Denizaltı derinliği' },
      { id: 'geceSokak', ad: 'Gece sokağı' }
    ],
    POZLAR: POZLAR, POZ_ADLARI: POZ_ADLARI, IFADELER: IFADELER,
    karakter: karakter, mekan: mekan, nesne: nesne, balon: balon,
    karakterBul: karakterBul, nesneAdi: nesneAdi, esc: esc, sar: sar, metinBlogu: metinBlogu
  };
})(window);
