/* KAYIP ESER DOSYASI — oynanış
   Saf JavaScript. Derleme yok, sunucu yok; index.html çift tıklayla açılır. */

(function () {
  'use strict';

  var KEY = 'kayip-eser-v1';
  var HEDEF_CIKARIM = 4;

  var D_MAP = new Map(DELILLER.map(function (d) { return [d.id, d]; }));
  var I_MAP = new Map(IFADELER.map(function (i) { return [i.id, i]; }));
  var S_MAP = new Map(SUPHELILER.map(function (s) { return [s.id, s]; }));
  var B_MAP = new Map(BAGLANTILAR.map(function (b) { return [cift(b.a, b.b), b]; }));

  var $ = function (s, k) { return (k || document).querySelector(s); };
  var $$ = function (s, k) { return Array.prototype.slice.call((k || document).querySelectorAll(s)); };

  function cift(a, b) { return [a, b].sort().join('|'); }

  /* ---------- DURUM ---------- */
  function bosDurum() {
    return {
      incelenen: [], pano: {}, baglar: [], cikarimlar: [],
      seciliSupheli: null, seciliDeliller: [], sure: 0, ses: true,
      mod: 'tasi', cozuldu: false
    };
  }

  var state = (function () {
    var bos = bosDurum();
    try {
      var ham = localStorage.getItem(KEY);
      if (!ham) return bos;
      var v = JSON.parse(ham);
      if (!v || typeof v !== 'object') return bos;
      ['incelenen', 'baglar', 'cikarimlar', 'seciliDeliller'].forEach(function (k) {
        if (!Array.isArray(v[k])) v[k] = bos[k];
      });
      if (!v.pano || typeof v.pano !== 'object') v.pano = {};
      return Object.assign(bos, v, { mod: 'tasi' });
    } catch (e) { return bos; }
  })();

  function kaydet() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* kota dolu */ }
  }

  /* ---------- SES ---------- */
  var ctx = null;
  function ton(frekans, sure, guc) {
    if (!state.ses) return;
    try {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      ctx = ctx || new AC();
      var o = ctx.createOscillator();
      var g = ctx.createGain();
      o.type = 'triangle';
      o.frequency.value = frekans;
      g.gain.value = guc == null ? 0.05 : guc;
      o.connect(g); g.connect(ctx.destination);
      o.start();
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + (sure || 0.09));
      o.stop(ctx.currentTime + (sure || 0.09));
    } catch (e) { /* ses yoksa sessiz devam */ }
  }

  var bildirimZaman = null;
  function bildir(metin) {
    var el = $('#bildirim');
    el.textContent = metin;
    el.classList.add('gorunur');
    clearTimeout(bildirimZaman);
    bildirimZaman = setTimeout(function () { el.classList.remove('gorunur'); }, 3400);
  }

  /* ---------- DELİL ÇİZİMLERİ (SVG) ---------- */
  function fotoSVG(tur) {
    var cizgi = '#d9bc86', vurgu = '#f2b45c', zemin = '#150e08';
    function kap(ic) {
      return '<svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" aria-hidden="true">' +
        '<rect width="400" height="300" fill="' + zemin + '"/>' + ic +
        '<rect x="0" y="0" width="400" height="300" fill="none" stroke="rgba(242,180,92,.18)" stroke-width="10"/></svg>';
    }
    if (tur === 'cam') {
      return kap('<rect x="30" y="22" width="340" height="256" fill="#231a12" stroke="' + cizgi + '" stroke-width="3" opacity=".95"/>' +
        '<path d="M118 22 L94 278 M236 22 L212 278" stroke="#3b2a1b" stroke-width="2"/>' +
        '<path d="M216 40 L268 104 L238 158 L292 218 L252 278" fill="none" stroke="' + vurgu + '" stroke-width="1.8"/>' +
        '<path d="M268 104 L306 80 M238 158 L196 140 M292 218 L334 204" stroke="' + vurgu + '" stroke-width="1.1" opacity=".65" fill="none"/>' +
        '<circle cx="82" cy="238" r="17" fill="none" stroke="' + cizgi + '" stroke-width="1.3" opacity=".55"/>' +
        '<circle cx="82" cy="238" r="5" fill="' + vurgu + '" opacity=".8"/>');
    }
    if (tur === 'obje') {
      var meridyen = '';
      for (var i = 1; i < 5; i++) {
        var rx = 96 * Math.cos(i * Math.PI / 5);
        meridyen += '<ellipse cx="200" cy="128" rx="' + Math.abs(rx).toFixed(0) + '" ry="96" fill="none" stroke="' + cizgi + '" stroke-width="1" opacity=".5"/>';
      }
      return kap('<ellipse cx="200" cy="128" r="96" fill="#2a2016" stroke="' + vurgu + '" stroke-width="2"/>' +
        '<circle cx="200" cy="128" r="96" fill="none" stroke="' + cizgi + '" stroke-width="1.4"/>' +
        '<line x1="104" y1="128" x2="296" y2="128" stroke="' + cizgi + '" stroke-width="1.2" opacity=".7"/>' + meridyen +
        '<path d="M148 218 h104 l18 40 h-140 z" fill="#33251a" stroke="' + cizgi + '" stroke-width="1.6"/>' +
        '<path d="M118 268 h164" stroke="' + vurgu + '" stroke-width="2"/>');
    }
    if (tur === 'foto') {
      return kap('<rect x="52" y="40" width="296" height="200" fill="#0f0a06" stroke="' + cizgi + '" stroke-width="2"/>' +
        '<path d="M52 176 L348 176" stroke="' + cizgi + '" stroke-width="1.2" opacity=".7"/>' +
        '<rect x="150" y="120" width="100" height="56" fill="none" stroke="' + vurgu + '" stroke-width="1.6"/>' +
        '<circle cx="200" cy="146" r="18" fill="none" stroke="' + vurgu + '" stroke-width="1.4"/>' +
        '<circle cx="200" cy="146" r="5" fill="' + vurgu + '" opacity=".8"/>' +
        '<path d="M60 250 h280" stroke="' + cizgi + '" stroke-width="1" opacity=".4"/>' +
        '<text x="330" y="232" fill="' + vurgu + '" font-family="monospace" font-size="14" opacity=".8">06.11</text>');
    }
    if (tur === 'belge') {
      var satir = '';
      for (var s = 0; s < 9; s++) {
        satir += '<rect x="76" y="' + (72 + s * 19) + '" width="' + (150 + (s % 4) * 34) + '" height="4" fill="' + cizgi + '" opacity="' + (0.5 - s * 0.03) + '"/>';
      }
      return kap('<rect x="62" y="34" width="276" height="232" fill="#e7dcc4" stroke="#9c8a6b" stroke-width="1.5" transform="rotate(-2 200 150)"/>' +
        '<g transform="rotate(-2 200 150)">' + satir +
        '<circle cx="286" cy="222" r="30" fill="none" stroke="' + vurgu + '" stroke-width="2" opacity=".85"/>' +
        '<text x="262" y="228" fill="' + vurgu + '" font-family="monospace" font-size="12" opacity=".9">SM-0412</text>' +
        '<path d="M92 244 q16 -18 30 0 t28 -8 t20 6" fill="none" stroke="#3a2b1b" stroke-width="1.8"/></g>');
    }
    if (tur === 'kart') {
      return kap('<rect x="96" y="86" width="208" height="132" rx="8" fill="#2b2218" stroke="' + cizgi + '" stroke-width="1.6"/>' +
        '<rect x="96" y="112" width="208" height="18" fill="' + vurgu + '" opacity=".55"/>' +
        '<rect x="114" y="146" width="44" height="34" rx="4" fill="none" stroke="' + cizgi + '" stroke-width="1.2"/>' +
        '<rect x="122" y="154" width="28" height="18" fill="' + cizgi + '" opacity=".25"/>' +
        '<text x="114" y="202" fill="' + cizgi + '" font-family="monospace" font-size="13" opacity=".8">KNS-2</text>' +
        '<circle cx="286" cy="100" r="8" fill="' + vurgu + '" opacity=".7"/>');
    }
    if (tur === 'kamera') {
      var kutular = '';
      for (var k = 0; k < 6; k++) {
        var bosluk = (k === 2 || k === 3);
        kutular += '<rect x="' + (74 + k * 42) + '" y="168" width="34" height="26" fill="' + (bosluk ? 'none' : '#2b2116') + '" stroke="' + (bosluk ? '#7a5f3f' : cizgi) + '" stroke-width="1" stroke-dasharray="' + (bosluk ? '3 3' : '0') + '"/>';
      }
      return kap('<rect x="86" y="52" width="228" height="96" rx="6" fill="#241a12" stroke="' + cizgi + '" stroke-width="1.6"/>' +
        '<circle cx="146" cy="100" r="24" fill="none" stroke="' + vurgu + '" stroke-width="1.6"/>' +
        '<circle cx="146" cy="100" r="9" fill="' + vurgu + '" opacity=".7"/>' +
        '<rect x="196" y="84" width="92" height="14" fill="' + cizgi + '" opacity=".35"/>' +
        '<rect x="196" y="108" width="60" height="10" fill="' + cizgi + '" opacity=".22"/>' +
        '<text x="74" y="152" fill="' + vurgu + '" font-family="monospace" font-size="12" opacity=".8">22:38 - 22:44</text>' + kutular);
    }
    if (tur === 'alet') {
      return kap('<rect x="74" y="76" width="252" height="156" rx="6" fill="#2a2016" stroke="' + cizgi + '" stroke-width="1.8"/>' +
        '<rect x="88" y="90" width="224" height="128" fill="#1a1209" stroke="' + cizgi + '" stroke-width="1"/>' +
        '<rect x="102" y="104" width="76" height="26" rx="3" fill="#33261a" stroke="' + cizgi + '" stroke-width="1"/>' +
        '<rect x="192" y="104" width="106" height="26" rx="3" fill="none" stroke="' + vurgu + '" stroke-width="1.4" stroke-dasharray="5 4"/>' +
        '<text x="206" y="122" fill="' + vurgu + '" font-family="monospace" font-size="11">DEMİRBAŞ 88</text>' +
        '<rect x="102" y="146" width="60" height="22" rx="3" fill="#33261a" stroke="' + cizgi + '" stroke-width="1"/>' +
        '<rect x="176" y="146" width="60" height="22" rx="3" fill="#33261a" stroke="' + cizgi + '" stroke-width="1"/>' +
        '<path d="M184 250 h40" stroke="' + vurgu + '" stroke-width="2"/>');
    }
    /* arac */
    return kap('<rect x="60" y="150" width="240" height="58" rx="14" fill="#251b12" stroke="' + cizgi + '" stroke-width="1.8"/>' +
      '<path d="M100 150 l34 -38 h96 l34 38" fill="#251b12" stroke="' + cizgi + '" stroke-width="1.8"/>' +
      '<circle cx="120" cy="212" r="20" fill="#120c07" stroke="' + cizgi + '" stroke-width="2"/>' +
      '<circle cx="244" cy="212" r="20" fill="#120c07" stroke="' + cizgi + '" stroke-width="2"/>' +
      '<path d="M320 96 v130" stroke="' + vurgu + '" stroke-width="3"/>' +
      '<path d="M320 118 h56" stroke="' + vurgu + '" stroke-width="3"/>' +
      '<path d="M312 132 h16" stroke="' + vurgu + '" stroke-width="2" opacity=".7"/>' +
      '<text x="60" y="266" fill="' + vurgu + '" font-family="monospace" font-size="13" opacity=".8">22:05 / 23:10</text>');
  }

  /* ---------- DELİL MASASI ---------- */
  var EGIM = [-1.4, 0.9, -0.6, 1.4, -1.1, 0.7, -1.7, 1.1, -0.4, 1.5, -0.9, 0.6];

  function renderMasa() {
    var kutu = $('#delilIzgara');
    kutu.innerHTML = DELILLER.map(function (d, i) {
      var incelendi = state.incelenen.indexOf(d.id) >= 0;
      var panoda = !!state.pano[d.id];
      return '<article class="delil' + (incelendi ? ' incelendi' : '') + '" data-id="' + d.id + '" tabindex="0" role="button" ' +
        'aria-label="' + d.ad + ' dosyasını aç" style="--egim:' + EGIM[i % EGIM.length] + 'deg">' +
        '<div class="foto-plaka">' + fotoSVG(d.tur) + '</div>' +
        (panoda ? '<span class="rozet">PANODA</span>' : '') +
        '<span class="yer">' + d.yer + '</span>' +
        '<h3>' + d.ad + '</h3>' +
        '<p class="ozet">' + d.ozet + '</p>' +
        (incelendi ? '<span class="damga">İNCELENDİ</span>' : '') +
        '</article>';
    }).join('');
    $('#sayacIncelenen').textContent = state.incelenen.length + ' / ' + DELILLER.length + ' incelendi';
  }

  /* ---------- DOSYA KATMANI ---------- */
  var aktifDelil = null;

  function dosyaAc(id) {
    var d = D_MAP.get(id);
    if (!d) return;
    aktifDelil = id;
    var incelendi = state.incelenen.indexOf(id) >= 0;
    var kagit = $('#dosyaKagidi');
    kagit.classList.toggle('incelenmemis', !incelendi);
    $('#dkFoto').innerHTML = fotoSVG(d.tur);
    $('#dkFoto').className = 'foto-plaka dk';
    $('#dkMeta').innerHTML = d.yer + '<br>DOSYA: ' + d.id.toUpperCase() + ' · ' + VAKA.olay;
    $('#dkEtiket').textContent = incelendi ? 'DELİL · İNCELENDİ' : 'DELİL · İNCELENMEDİ';
    $('#dkBaslik').textContent = d.ad;
    $('#dkOzet').textContent = d.ozet;
    $('#dkBulgular').innerHTML = d.bulgular.map(function (b) { return '<li>' + b + '</li>'; }).join('');
    $('#dkDikkat').textContent = 'Not: ' + d.dikkat;
    $('#btnIncele').textContent = incelendi ? 'İnceleme tamamlandı' : 'İncelemeyi tamamla';
    $('#btnIncele').disabled = incelendi;
    var asili = !!state.pano[id];
    $('#btnAs').textContent = asili ? 'Panodan kaldır' : 'Panoya as';
    $('#btnAs').className = 'dugme buyuk';
    $('#perde').hidden = false;
    document.body.style.overflow = 'hidden';
    $('#btnKapat').focus();
  }

  function dosyaKapat() {
    $('#perde').hidden = true;
    document.body.style.overflow = '';
    aktifDelil = null;
  }

  function inceleTamamla() {
    if (!aktifDelil) return;
    if (state.incelenen.indexOf(aktifDelil) < 0) state.incelenen.push(aktifDelil);
    kaydet();
    ton(520, 0.07);
    var d = D_MAP.get(aktifDelil);
    bildir('İnceleme tamamlandı: ' + d.ad);
    renderMasa(); renderSecim(); hud();
    dosyaAc(aktifDelil);
  }

  function panoyaAs(id) {
    if (state.pano[id]) {
      delete state.pano[id];
      state.baglar = state.baglar.filter(function (b) { return b.a !== id && b.b !== id; });
      bildir('Kart panodan alındı.');
    } else {
      state.pano[id] = bosYer();
      if (state.incelenen.indexOf(id) < 0 && D_MAP.has(id)) state.incelenen.push(id);
      bildir('Kart panoya asıldı: ' + (D_MAP.get(id) ? D_MAP.get(id).ad : (I_MAP.get(id) ? I_MAP.get(id).kim : id)));
      ton(680, 0.06);
    }
    kaydet();
    renderMasa(); renderPano(); renderSecim(); hud();
  }

  /* ---------- PANO ---------- */
  var YERLER = [[16, 22], [44, 18], [72, 24], [26, 50], [55, 46], [80, 52], [18, 78], [46, 76], [72, 78]];

  function bosYer() {
    var mevcut = Object.keys(state.pano).map(function (k) { return state.pano[k]; });
    for (var i = 0; i < 40; i++) {
      var p = YERLER[i % YERLER.length];
      var x = Math.max(9, Math.min(91, p[0] + ((i * 11) % 13) - 6));
      var y = Math.max(11, Math.min(89, p[1] + ((i * 7) % 13) - 6));
      var yakin = mevcut.some(function (q) { return Math.abs(q.x - x) < 11 && Math.abs(q.y - y) < 13; });
      if (!yakin) return { x: x, y: y };
    }
    return { x: 20 + Math.random() * 60, y: 20 + Math.random() * 60 };
  }

  function kartBilgi(id) {
    if (D_MAP.has(id)) {
      var d = D_MAP.get(id);
      return { tur: 'DELİL · ' + d.id.toUpperCase(), baslik: d.ad, foto: d.tur, metin: d.ozet };
    }
    var i = I_MAP.get(id);
    if (!i) return { tur: 'KAYIT', baslik: id, metin: '' };
    return { tur: 'İFADE · ' + i.saat, baslik: i.kim + ' — ' + i.rol, metin: i.metin };
  }

  var seciliKart = null;

  function renderPano() {
    var mantar = $('#mantar');
    $$('.pano-kart', mantar).forEach(function (el) { el.remove(); });
    var idler = Object.keys(state.pano);
    $('#panoBos').hidden = idler.length > 0;

    idler.forEach(function (id) {
      var b = kartBilgi(id);
      var p = state.pano[id];
      var el = document.createElement('div');
      el.className = 'pano-kart' + (seciliKart === id ? ' secili' : '');
      el.dataset.id = id;
      el.tabIndex = 0;
      el.style.left = p.x + '%';
      el.style.top = p.y + '%';
      el.innerHTML = '<button class="kart-kaldir" type="button" title="Panodan kaldır" aria-label="Panodan kaldır">×</button>' +
        (b.foto ? '<div class="foto-plaka kart-foto">' + fotoSVG(b.foto) + '</div>' : '') +
        '<span class="kart-tur">' + b.tur + '</span>' +
        '<span class="kart-baslik">' + b.baslik + '</span>' +
        (b.metin ? '<p class="kart-metin">' + b.metin + '</p>' : '');
      mantar.appendChild(el);
    });
    ipCiz();
    renderCikarim();
  }

  function ipCiz() {
    var svg = $('#ipler');
    var mantar = $('#mantar');
    if (!svg || !mantar) return;
    var r = mantar.getBoundingClientRect();
    if (!r.width) return;
    svg.setAttribute('viewBox', '0 0 ' + r.width + ' ' + r.height);
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    var NS = 'http://www.w3.org/2000/svg';

    state.baglar.forEach(function (b) {
      var p1 = state.pano[b.a], p2 = state.pano[b.b];
      if (!p1 || !p2) return;
      var x1 = p1.x / 100 * r.width, y1 = p1.y / 100 * r.height;
      var x2 = p2.x / 100 * r.width, y2 = p2.y / 100 * r.height;
      var mx = (x1 + x2) / 2, my = (y1 + y2) / 2 + Math.min(80, Math.abs(x2 - x1) * 0.16 + 20);

      var yol = document.createElementNS(NS, 'path');
      yol.setAttribute('d', 'M' + x1 + ' ' + y1 + ' Q' + mx + ' ' + my + ' ' + x2 + ' ' + y2);
      yol.setAttribute('fill', 'none');
      yol.setAttribute('stroke', b.ok ? '#c8382f' : '#8b6a48');
      yol.setAttribute('stroke-width', b.ok ? '2.6' : '1.4');
      yol.setAttribute('opacity', b.ok ? '0.95' : '0.5');
      if (!b.ok) yol.setAttribute('stroke-dasharray', '6 5');
      svg.appendChild(yol);

      [[x1, y1], [x2, y2]].forEach(function (n) {
        var c = document.createElementNS(NS, 'circle');
        c.setAttribute('cx', n[0]); c.setAttribute('cy', n[1]);
        c.setAttribute('r', b.ok ? '4' : '3');
        c.setAttribute('fill', b.ok ? '#f2b45c' : '#9b7b54');
        svg.appendChild(c);
      });
    });
  }

  function ipTikla(id) {
    if (!seciliKart) {
      seciliKart = id;
      renderPano();
      bildir('İlk kart seçildi. Bağlamak istediğin ikinci karta dokun.');
      ton(600, 0.05);
      return;
    }
    if (seciliKart === id) {
      seciliKart = null;
      renderPano();
      return;
    }
    var a = seciliKart, b = id;
    seciliKart = null;
    var anahtar = cift(a, b);
    var mevcut = state.baglar.findIndex(function (x) { return cift(x.a, x.b) === anahtar; });

    if (mevcut >= 0) {
      state.baglar.splice(mevcut, 1);
      bildir('Bağ kaldırıldı.');
      ton(320, 0.05);
    } else {
      var bag = B_MAP.get(anahtar);
      state.baglar.push({ a: a, b: b, ok: !!bag });
      if (bag) {
        if (state.cikarimlar.indexOf(bag.baslik) < 0) {
          state.cikarimlar.push(bag.baslik);
          bildir('Yeni çıkarım: ' + bag.baslik);
          ton(760, 0.12, 0.06);
          setTimeout(function () { ton(980, 0.1, 0.05); }, 120);
        } else {
          bildir('Bu çıkarım dosyada zaten kayıtlı.');
        }
      } else {
        bildir('İp çekildi; ancak bu iki kayıt arasında doğrudan bir çıkarım yok.');
        ton(280, 0.06);
      }
    }
    kaydet();
    renderPano();
    hud();
  }

  function renderCikarim() {
    var liste = $('#cikarimListe');
    if (!state.cikarimlar.length) {
      liste.innerHTML = '<li class="bos">Henüz çıkarım yok. Panoda iki kartı "İp bağla" modunda birleştir.</li>';
      return;
    }
    liste.innerHTML = state.cikarimlar.map(function (baslik) {
      var b = BAGLANTILAR.find(function (x) { return x.baslik === baslik; });
      return '<li class="' + (b && b.cekirdek ? 'cekirdek' : '') + '"><strong>' + baslik + '</strong>' +
        '<span>' + (b ? b.metin : '') + '</span></li>';
    }).join('');
  }

  /* ---------- ŞÜPHELİ / TANIK ---------- */
  function renderIfade() {
    $('#supheliIzgara').innerHTML = SUPHELILER.map(function (s) {
      return '<article class="supheli-kart">' +
        '<header><div class="supheli-vesika" aria-hidden="true">' + s.ad.split(' ').map(function (x) { return x[0]; }).join('') + '</div>' +
        '<div><h4>' + s.ad + '</h4><span class="rol">' + s.rol + '</span>' +
        '<div class="kayit"><span>' + s.yas + ' yaş</span><span>' + s.hizmet + '</span></div></div></header>' +
        '<blockquote>“' + s.ifade + '”</blockquote>' +
        '<p class="arka">' + s.arka + '</p>' +
        '<p class="not">Not: ' + s.not + '</p>' +
        '</article>';
    }).join('');

    $('#tanikIzgara').innerHTML = IFADELER.map(function (i) {
      var panoda = !!state.pano[i.id];
      return '<article class="tanik-kart">' +
        '<span class="saat">' + i.saat + '</span>' +
        '<h4>' + i.kim + '</h4><span class="rol">' + i.rol + '</span>' +
        '<blockquote>“' + i.metin + '”</blockquote>' +
        '<button class="dugme sessiz" type="button" data-as="' + i.id + '">' + (panoda ? 'Panodan kaldır' : 'Panoya as') + '</button>' +
        '</article>';
    }).join('');
  }

  /* ---------- ZAMAN ---------- */
  function renderZaman() {
    var n = state.cikarimlar.length;
    $('#zamanCizgi').innerHTML = ZAMAN.map(function (z) {
      var acik = n >= z.kilit;
      return '<li class="' + (acik ? '' : 'kilitli') + '">' +
        '<span class="saat">' + z.saat + '</span>' +
        (acik ? z.olay : 'Bu saat aralığındaki olay henüz kanıtlanmadı.') + '</li>';
    }).join('');
  }

  /* ---------- SUÇLAMA ---------- */
  function renderSecim() {
    var sec = $('#supheliSecim');
    if (!sec) return;
    sec.innerHTML = SUPHELILER.map(function (s) {
      return '<button class="sec-kart' + (state.seciliSupheli === s.id ? ' secili' : '') + '" type="button" data-sup="' + s.id + '">' +
        '<b>' + s.ad + '</b><span>' + s.rol + ' · ' + s.hizmet + '</span></button>';
    }).join('');

    var ds = $('#delilSecim');
    ds.innerHTML = DELILLER.map(function (d) {
      var incelendi = state.incelenen.indexOf(d.id) >= 0;
      var secili = state.seciliDeliller.indexOf(d.id) >= 0;
      return '<button class="delil-sec' + (secili ? ' secili' : '') + '" type="button" data-del="' + d.id + '"' +
        (incelendi ? '' : ' disabled title="Önce delil masasında incele"') + '>' + d.ad + '</button>';
    }).join('');

    $('#delilSecimSayaci').textContent = '(' + state.seciliDeliller.length + ' / 3)';
    var oran = Math.min(1, state.cikarimlar.length / HEDEF_CIKARIM);
    $('#hazirlikCubuk').style.width = (oran * 100) + '%';
    var kalan = Math.max(0, HEDEF_CIKARIM - state.cikarimlar.length);
    $('#hazirlikNot').textContent = kalan > 0
      ? 'Dosya hazırlığı: ' + state.cikarimlar.length + ' / ' + HEDEF_CIKARIM + ' çıkarım. En az ' + kalan + ' çıkarım daha gerekli.'
      : 'Dosya savcılığa gönderilebilir: ' + state.cikarimlar.length + ' çıkarım kayıtlı.';
    $('#btnSucla').disabled = kalan > 0 || !state.seciliSupheli;
  }

  function delilSec(id) {
    var i = state.seciliDeliller.indexOf(id);
    if (i >= 0) state.seciliDeliller.splice(i, 1);
    else {
      if (state.seciliDeliller.length >= 3) {
        bildir('En fazla üç delil ekleyebilirsin. Birini çıkarıp yeniden dene.');
        return;
      }
      state.seciliDeliller.push(id);
    }
    kaydet(); renderSecim(); ton(560, 0.04);
  }

  function sonuclariGoster(tip, baslik, paragraflar, damga) {
    $('#sonucPerde').hidden = false;
    $('#sonucBaslik').textContent = baslik;
    $('#sonucDamga').textContent = damga || 'DOSYA';
    $('#sonucDamga').className = 'sonuc-damga' + (tip === 'win' ? '' : ' red');
    $('#sonucMetin').innerHTML = paragraflar.map(function (p) { return '<p>' + p + '</p>'; }).join('');
    var oran = sureMetin(state.sure);
    $('#sonucIstatistik').innerHTML = [
      ['Geçen süre', oran],
      ['İncelenen delil', state.incelenen.length + ' / ' + DELILLER.length],
      ['Çıkarım', state.cikarimlar.length + ' / ' + BAGLANTILAR.length],
      ['Panodaki bağ', state.baglar.length],
      ['Suçlama denemesi', String(state.denemeler || 1)]
    ].map(function (x) { return '<div>' + x[0] + '<b>' + x[1] + '</b></div>'; }).join('');
  }

  function sucla() {
    if (!state.seciliSupheli) { bildir('Önce bir şüpheli seçmelisin.'); return; }
    if (state.cikarimlar.length < HEDEF_CIKARIM) {
      bildir('Dosya henüz olgun değil: en az ' + HEDEF_CIKARIM + ' çıkarım gerekiyor.');
      return;
    }
    state.denemeler = (state.denemeler || 0) + 1;
    kaydet();
    var sup = S_MAP.get(state.seciliSupheli);
    var secili = state.seciliDeliller.slice();

    if (sup.id !== COZUM.supheli) {
      ton(200, 0.3, 0.05);
      var temiz = sup.temizleyen ? D_MAP.get(sup.temizleyen.delil) : null;
      var ifade = sup.temizleyen ? I_MAP.get(sup.temizleyen.ifade) : null;
      sonuclariGoster('fail', 'Dosya geri çevrildi — ' + sup.ad,
        ['Savcılık, ' + sup.ad + ' hakkındaki suçlamayı kanıtsız buldu. ' +
          (temiz ? '“' + temiz.ad + '” kaydı ve ' + (ifade ? ifade.kim + '’in ifadesi' : 'tanık beyanı') + ' bu kişiyi olay saatinde başka bir yerde gösteriyor.' : '') +
          ' Zaman çizelgesi tutmuyor; suçlama düşüyor.',
          'Dosya kapanmadı. Elindeki bağlantıları gözden geçir: hangi delil, hangi kişiyi hangi dakikada nereye koyuyor?'],
        'RED');
      return;
    }

    var dayanak = secili.filter(function (id) { return COZUM.kanit.indexOf(id) >= 0; });
    if (dayanak.length < 2) {
      ton(240, 0.25, 0.05);
      sonuclariGoster('weak', 'Suçlama tutmadı — dayanak zayıf',
        ['Şüpheli doğru: Kerem Ünsal. Ancak dosyaya koyduğun deliller zinciri kurmuyor. ' +
          'Savunma, “kürenin ne zaman değiştirildiğini ve kamerayı kimin kapattığını göstermiyorsunuz” diyerek dosyayı çürüttü.',
          'Vitrindeki cismin ne olduğunu, atölye kayıtlarını, kapı kartını ve kamera boşluğunu birlikte kullanman gerekiyor.'],
        'EKSİK');
      return;
    }

    ton(760, 0.16, 0.06);
    setTimeout(function () { ton(1020, 0.22, 0.05); }, 160);
    state.cozuldu = true;
    kaydet();
    sonuclariGoster('win', COZUM.baslik, COZUM.metin, 'ÇÖZÜLDÜ');
  }

  /* ---------- HUD ---------- */
  function sureMetin(sn) {
    var d = Math.floor(sn / 60), s = sn % 60;
    return (d < 10 ? '0' : '') + d + ':' + (s < 10 ? '0' : '') + s;
  }

  function hud() {
    $('#hudCikarim').textContent = state.cikarimlar.length + ' / ' + BAGLANTILAR.length;
    $('#hudSure').textContent = sureMetin(state.sure);
    $('#hudSaat').textContent = '22:47';
  }

  /* ---------- GÖRÜNÜM DEĞİŞTİR ---------- */
  function gorunumAc(ad) {
    $$('.sekme').forEach(function (b) { b.classList.toggle('aktif', b.dataset.gorunum === ad); });
    $$('.gorunum').forEach(function (g) { g.classList.toggle('aktif', g.id === 'gorunum-' + ad); });
    if (ad === 'zaman') renderZaman();
    if (ad === 'pano') { renderPano(); ipCiz(); }
    if (ad === 'suclama') renderSecim();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /* ---------- OLAY BAĞLARI ---------- */
  function bagla() {
    $$('.sekme').forEach(function (b) {
      b.addEventListener('click', function () { gorunumAc(b.dataset.gorunum); ton(440, 0.03, 0.03); });
    });

    $('#delilIzgara').addEventListener('click', function (e) {
      var kart = e.target.closest('.delil');
      if (kart) dosyaAc(kart.dataset.id);
    });
    $('#delilIzgara').addEventListener('keydown', function (e) {
      var kart = e.target.closest('.delil');
      if (kart && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); dosyaAc(kart.dataset.id); }
    });

    $('#btnKapat').addEventListener('click', dosyaKapat);
    $('#perde').addEventListener('click', function (e) { if (e.target.id === 'perde') dosyaKapat(); });
    $('#btnIncele').addEventListener('click', inceleTamamla);
    $('#btnAs').addEventListener('click', function () {
      if (!aktifDelil) return;
      panoyaAs(aktifDelil);
      var asili = !!state.pano[aktifDelil];
      $('#btnAs').textContent = asili ? 'Panodan kaldır' : 'Panoya as';
    });

    $('#btnHepsi').addEventListener('click', function () {
      var eklenen = 0;
      DELILLER.forEach(function (d) {
        if (!state.pano[d.id]) { state.pano[d.id] = bosYer(); eklenen++; }
      });
      kaydet(); renderMasa(); renderPano(); hud();
      bildir(eklenen ? eklenen + ' delil panoya asıldı. Bağ kurmak için “İp bağla” moduna geç.' : 'Tüm deliller zaten panoda.');
    });

    $('#btnModTasi').addEventListener('click', function () {
      state.mod = 'tasi'; seciliKart = null;
      this.classList.add('aktif'); $('#btnModIp').classList.remove('aktif');
      renderPano();
    });
    $('#btnModIp').addEventListener('click', function () {
      state.mod = 'ip';
      this.classList.add('aktif'); $('#btnModTasi').classList.remove('aktif');
      bildir('İp modu: iki karta sırayla dokun.');
    });
    $('#btnPanoyuBosalt').addEventListener('click', function () {
      if (!Object.keys(state.pano).length) { bildir('Pano zaten boş.'); return; }
      if (!window.confirm('Panodaki tüm kartlar ve ipler kaldırılsın mı? Çıkarımlar dosyada kalır.')) return;
      state.pano = {}; state.baglar = []; seciliKart = null;
      kaydet(); renderPano(); renderMasa(); hud();
    });

    /* pano sürükleme */
    var mantar = $('#mantar');
    var suruk = null;

    mantar.addEventListener('pointerdown', function (e) {
      var kart = e.target.closest('.pano-kart');
      if (!kart) return;
      if (e.target.closest('.kart-kaldir')) {
        var kid = kart.dataset.id;
        if (state.pano[kid]) {
          delete state.pano[kid];
          state.baglar = state.baglar.filter(function (b) { return b.a !== kid && b.b !== kid; });
          kaydet(); renderPano(); renderMasa(); hud();
          bildir('Kart panodan alındı.');
        }
        return;
      }
      var id = kart.dataset.id;
      if (state.mod === 'ip') { ipTikla(id); return; }
      if (!state.pano[id]) return;
      var r = mantar.getBoundingClientRect();
      var p = state.pano[id];
      suruk = {
        id: id, el: kart, pid: e.pointerId,
        dx: e.clientX - (r.left + p.x / 100 * r.width),
        dy: e.clientY - (r.top + p.y / 100 * r.height)
      };
      kart.style.zIndex = 6;
      try { kart.setPointerCapture(e.pointerId); } catch (err) { /* yok say */ }
      e.preventDefault();
    });

    window.addEventListener('pointermove', function (e) {
      if (!suruk) return;
      var r = mantar.getBoundingClientRect();
      var x = (e.clientX - suruk.dx - r.left) / r.width * 100;
      var y = (e.clientY - suruk.dy - r.top) / r.height * 100;
      x = Math.max(6, Math.min(94, x));
      y = Math.max(6, Math.min(94, y));
      state.pano[suruk.id] = { x: x, y: y };
      suruk.el.style.left = x + '%';
      suruk.el.style.top = y + '%';
      ipCiz();
    });

    window.addEventListener('pointerup', function () {
      if (!suruk) return;
      suruk.el.style.zIndex = '';
      suruk = null;
      kaydet();
    });

    window.addEventListener('resize', function () { ipCiz(); });

    $('#tanikIzgara').addEventListener('click', function (e) {
      var b = e.target.closest('[data-as]');
      if (!b) return;
      panoyaAs(b.dataset.as);
      renderIfade();
    });

    $('#supheliSecim').addEventListener('click', function (e) {
      var b = e.target.closest('[data-sup]');
      if (!b) return;
      state.seciliSupheli = b.dataset.sup;
      kaydet(); renderSecim(); ton(500, 0.05);
    });

    $('#delilSecim').addEventListener('click', function (e) {
      var b = e.target.closest('[data-del]');
      if (!b || b.disabled) return;
      delilSec(b.dataset.del);
    });

    $('#btnSucla').addEventListener('click', sucla);

    $('#btnSonucKapat').addEventListener('click', function () {
      $('#sonucPerde').hidden = true;
      document.body.style.overflow = '';
    });

    $('#btnYeniden').addEventListener('click', function () { sifirla(true); });

    $('#btnSes').addEventListener('click', function () {
      state.ses = !state.ses;
      this.textContent = 'Ses: ' + (state.ses ? 'açık' : 'kapalı');
      kaydet();
      if (state.ses) ton(640, 0.07);
    });

    $('#btnSifirla').addEventListener('click', function () { sifirla(false); });

    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape') return;
      if (!$('#perde').hidden) dosyaKapat();
      if (!$('#sonucPerde').hidden) { $('#sonucPerde').hidden = true; document.body.style.overflow = ''; }
    });
  }

  function sifirla(yeniden) {
    if (!yeniden && !window.confirm('Dosya sıfırlanacak: incelenen deliller, pano ve çıkarımlar silinecek. Emin misin?')) return;
    state = bosDurum();
    try { localStorage.removeItem(KEY); } catch (e) { /* yok say */ }
    seciliKart = null; aktifDelil = null;
    $('#perde').hidden = true;
    $('#sonucPerde').hidden = true;
    document.body.style.overflow = '';
    kaydet();
    renderHepsi();
    gorunumAc('masa');
    bildir('Yeni dosya açıldı. Delil masasından başla.');
  }

  function renderHepsi() {
    renderMasa();
    renderPano();
    renderIfade();
    renderZaman();
    renderSecim();
    hud();
    $('#btnSes').textContent = 'Ses: ' + (state.ses ? 'açık' : 'kapalı');
  }

  /* ---------- BAŞLAT ---------- */
  var seciliKartEl = null;

  document.addEventListener('DOMContentLoaded', function () {
    $('#vakaBaslik').textContent = VAKA.baslik;
    $('#dosyaNo').textContent = VAKA.dosyaNo;
    $('#muzeAdi').textContent = VAKA.altBaslik.split('—')[0].trim();
    $('#eserAdi').textContent = VAKA.eser;

    bagla();
    renderHepsi();
    gorunumAc('masa');

    setInterval(function () {
      state.sure += 1;
      $('#hudSure').textContent = sureMetin(state.sure);
      if (state.sure % 15 === 0) kaydet();
    }, 1000);

    window.addEventListener('beforeunload', kaydet);

    setTimeout(function () {
      if (!state.incelenen.length && !state.cikarimlar.length) {
        bildir('Dosya açıldı. Delil kartlarına tıklayarak incelemeye başla; bulguları okuduktan sonra panoya as.');
      }
    }, 900);
  });
})();
