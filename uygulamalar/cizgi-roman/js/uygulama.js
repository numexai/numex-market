/* NUMEX STORY FORGE — editör çekirdeği
   Durum, çizim, etkileşim, okuma modu, dışa aktarma. Harici kütüphane yok. */
(function () {
  'use strict';
  var S = window.Sanat;
  var SABIT = { SAYFA_W: 800, SAYFA_H: 1180,     DEPO: 'numex-story-forge-v3', MAX_GECMIS: 60 };
  var INK = S.INK;

  /* --------------------------------------------------------------- DURUM */
  var D = {
    surum: 1,
    baslik: 'Gökyüzü Korsanları',
    yazar: 'Numex Story Forge',
    sayfalar: [],
    aktifSayfa: 0,
    secim: { panelId: null, ogeId: null }
  };
  var GECMIS = [];

  var DUZENLER = {
    tek: [[0, 0, 1, 1]],
    ikili: [[0, 0, 1, 0.48], [0, 0.5, 1, 0.5]],
    serit3: [[0, 0, 1, 0.31], [0, 0.345, 1, 0.31], [0, 0.69, 1, 0.31]],
    dortlu: [[0, 0, 0.49, 0.49], [0.51, 0, 0.49, 0.49], [0, 0.51, 0.49, 0.49], [0.51, 0.51, 0.49, 0.49]],
    sinematik: [[0, 0, 1, 0.46], [0, 0.48, 0.49, 0.52], [0.51, 0.48, 0.49, 0.52]],
    buyukSol: [[0, 0, 0.63, 1], [0.65, 0, 0.35, 0.49], [0.65, 0.51, 0.35, 0.49]],
    altigen: [[0, 0, 0.49, 0.32], [0.51, 0, 0.49, 0.32], [0, 0.345, 0.49, 0.32], [0.51, 0.345, 0.49, 0.32], [0, 0.69, 0.49, 0.31], [0.51, 0.69, 0.49, 0.31]],
    dorDikey: [[0, 0, 0.24, 1], [0.253, 0, 0.24, 1], [0.507, 0, 0.24, 1], [0.76, 0, 0.24, 1]]
  };
  var DUZEN_ADLARI = { tek: 'Tek panel', ikili: 'İkili', serit3: 'Üç şerit', dortlu: 'Dörtlü', sinematik: 'Sinematik', buyukSol: 'Büyük sol', altigen: 'Altılı', dorDikey: 'Dört dikey' };

  var sayac = 1;
  function kimlik(on) { return (on || 'x') + '-' + (sayac++) + '-' + Math.floor(Math.random() * 9999); }
  function kopya(o) { return JSON.parse(JSON.stringify(o)); }
  function mekanAdi(id) {
    if (!id) return 'Boş panel';
    var m = S.MEKANLAR.filter(function (x) { return x.id === id; })[0];
    return m ? m.ad : 'Boş panel';
  }

  /* ---------------------------------------------------------- ÖRNEK İÇERİK */
  function oge(tip, ayar) {
    ayar = ayar || {};
    if (tip === 'balon') { ayar.y = Math.max(0.24, Math.min(0.7, ayar.y == null ? 0.3 : ayar.y)); }
    var o = { id: kimlik(tip), tip: tip, x: 0.5, y: 0.97, olcek: 1, don: 0, ayna: false, katman: 1 };
    if (tip === 'karakter') { o.ref = 'kerem'; o.ifade = 'notr'; o.poz = 'ayakta'; o.referans = 'taban'; }
    if (tip === 'nesne') { o.ref = 'kristal'; o.referans = 'taban'; o.y = 0.9; }
    if (tip === 'balon') { o.alt = 'konusma'; o.metin = 'Merhaba!'; o.yon = 'sol'; o.referans = 'merkez'; o.y = 0.3; o.x = 0.35; o.olcek = 1; }
    for (var k in ayar) o[k] = ayar[k];
    return o;
  }

  function ornekProje() {
    var s1 = {
      id: kimlik('sayfa'), duzen: 'sinematik', paneller: [
        { id: kimlik('panel'), duzen: 'sinematik', x: 0, y: 0, w: 1, h: 0.46, mekan: 'catilar', ogeler: [
          oge('karakter', { ref: 'kerem', ifade: 'saskin', poz: 'kollarHavada', x: 0.3, y: 1.02, olcek: 1.05 }),
          oge('karakter', { ref: 'zeynep', ifade: 'mutlu', poz: 'savasiyor', x: 0.66, y: 1.03, olcek: 0.98 }),
          oge('balon', { alt: 'anlati', metin: 'Gün batımında şehir sessizliğe gömülmüştü.', x: 0.34, y: 0.26, olcek: 0.9, yon: 'yok' }),
          oge('balon', { alt: 'konusma', metin: 'Kerem, o ışık ne? Gökyüzünde bir şey var!', x: 0.74, y: 0.62, olcek: 0.78, yon: 'sol' })
        ] },
        { id: kimlik('panel'), duzen: 'sinematik', x: 0, y: 0.48, w: 0.49, h: 0.52, mekan: 'geceSokak', ogeler: [
          oge('karakter', { ref: 'golge', ifade: 'kizgin', poz: 'ayakta', x: 0.5, y: 1.0, olcek: 1.1 }),
          oge('balon', { alt: 'efekt', metin: 'GÜMM!', x: 0.72, y: 0.3, olcek: 0.85, yon: 'yok' })
        ] },
        { id: kimlik('panel'), duzen: 'sinematik', x: 0.51, y: 0.48, w: 0.49, h: 0.52, mekan: 'laboratuvar', ogeler: [
          oge('karakter', { ref: 'bilgin', ifade: 'kizgin', poz: 'savasiyor', x: 0.36, y: 1.0, olcek: 1.0 }),
          oge('nesne', { ref: 'kristal', x: 0.76, y: 0.92, olcek: 1.0 }),
          oge('balon', { alt: 'dusunce', metin: 'Kristal titreşiyor... Bu bir tesadüf olamaz.', x: 0.4, y: 0.28, olcek: 0.92, yon: 'sag' })
        ] }
      ]
    };
    var s2 = {
      id: kimlik('sayfa'), duzen: 'dortlu', paneller: [
        { id: kimlik('panel'), duzen: 'dortlu', x: 0, y: 0, w: 0.49, h: 0.49, mekan: 'uzay', ogeler: [
          oge('karakter', { ref: 'r7', ifade: 'saskin', poz: 'kollarHavada', x: 0.4, y: 1.0, olcek: 1.0 }),
          oge('nesne', { ref: 'ucanArac', x: 0.78, y: 0.8, olcek: 0.95 }),
          oge('balon', { alt: 'konusma', metin: 'İstasyon bizi bekliyor. Kalkıyoruz!', x: 0.36, y: 0.24, olcek: 0.82, yon: 'sol' })
        ] },
        { id: kimlik('panel'), duzen: 'dortlu', x: 0.51, y: 0, w: 0.49, h: 0.49, mekan: 'denizalti', ogeler: [
          oge('karakter', { ref: 'ada', ifade: 'mutlu', poz: 'yuruyor', x: 0.5, y: 1.0, olcek: 1.05 }),
          oge('balon', { alt: 'dusunce', metin: 'Derinlerde bir sinyal var...', x: 0.42, y: 0.26, olcek: 0.85, yon: 'yok' })
        ] },
        { id: kimlik('panel'), duzen: 'dortlu', x: 0, y: 0.51, w: 0.49, h: 0.49, mekan: 'orman', ogeler: [
          oge('karakter', { ref: 'leyla', ifade: 'korkmus', poz: 'kosuyor', x: 0.46, y: 1.02, olcek: 1.0 }),
          oge('balon', { alt: 'efekt', metin: 'PAT!', x: 0.74, y: 0.34, olcek: 0.7, yon: 'yok' })
        ] },
        { id: kimlik('panel'), duzen: 'dortlu', x: 0.51, y: 0.51, w: 0.49, h: 0.49, mekan: 'col', ogeler: [
          oge('karakter', { ref: 'demir', ifade: 'kizgin', poz: 'savasiyor', x: 0.48, y: 1.02, olcek: 1.0 }),
          oge('nesne', { ref: 'tabanca', x: 0.78, y: 0.86, olcek: 0.9 }),
          oge('balon', { alt: 'konusma', metin: 'Geri çekil, burası benim bölgem.', x: 0.36, y: 0.24, olcek: 0.82, yon: 'sag' })
        ] }
      ]
    };
    return { surum: 1, baslik: 'Gökyüzü Korsanları', yazar: 'Numex Story Forge', sayfalar: [s1, s2], aktifSayfa: 0, secim: { panelId: null, ogeId: null } };
  }

  /* ------------------------------------------------------------ YARDIMCI */
  function aktifSayfa() { return D.sayfalar[D.aktifSayfa] || null; }
  function panelBul(id) {
    var s = aktifSayfa(); if (!s) return null;
    for (var i = 0; i < s.paneller.length; i++) if (s.paneller[i].id === id) return s.paneller[i];
    return null;
  }
  function seciliOge() {
    var p = panelBul(D.secim.panelId); if (!p) return null;
    for (var i = 0; i < p.ogeler.length; i++) if (p.ogeler[i].id === D.secim.ogeId) return p.ogeler[i];
    return null;
  }
  function anlikGoruntu() {
    GECMIS.push(JSON.stringify(D.sayfalar));
    if (GECMIS.length > SABIT.MAX_GECMIS) GECMIS.shift();
  }

  /* ---------------------------------------------------------------- ÇİZİM */
  function ogeKutusu(o, p) {
    var pw = p.w * SABIT.SAYFA_W, ph = p.h * SABIT.SAYFA_H;
    var W, H, merkez = o.referans === 'merkez';
    if (o.tip === 'karakter') { H = 0.62 * ph * (o.olcek || 1); W = H * (200 / 380); }
    else if (o.tip === 'nesne') { H = 0.34 * Math.min(pw, ph) * (o.olcek || 1); W = H; }
    else { W = 0.62 * pw * (o.olcek || 1); H = W * (190 / 260); }
    return { W: W, H: H, cx: o.x * pw, cy: o.y * ph, merkez: merkez };
  }

  function ogeSvg(o, p) {
    var b = ogeKutusu(o, p);
    var icerik;
    if (o.tip === 'karakter') {
      icerik = S.karakter(S.karakterBul(o.ref), { ifade: o.ifade, poz: o.poz });
    } else if (o.tip === 'nesne') {
      icerik = S.nesne(o.ref);
    } else {
      icerik = S.balon(o.alt, o.metin, o.yon);
    }
    var y = b.merkez ? -b.H / 2 : -b.H;
    var konum = icerik.replace('width="100%" height="100%"', '')
      .replace('<svg ', '<svg x="' + (-b.W / 2).toFixed(2) + '" y="' + y.toFixed(2) + '" width="' + b.W.toFixed(2) + '" height="' + b.H.toFixed(2) + '" ');
    var ayna = o.ayna ? ' scale(-1,1)' : '';
    return '<g class="oge" data-oge="' + o.id + '" data-panel="' + p.id + '" transform="translate(' + b.cx.toFixed(2) + ',' + b.cy.toFixed(2) + ') rotate(' + (o.don || 0) + ')' + ayna + '">' + konum + '</g>';
  }

  function sayfaSvg(sayfa, secenek) {
    secenek = secenek || {};
    var W = SABIT.SAYFA_W, H = SABIT.SAYFA_H;
    var out = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + W + ' ' + H + '" width="100%" height="100%" preserveAspectRatio="xMidYMid meet" class="sahne-svg" font-family="Georgia, serif">';
    out += '<rect width="' + W + '" height="' + H + '" fill="#f4ead6"/>';
    // kâğıt dokusu
    var R = (function (s) { return function () { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; }; })(7);
    for (var i = 0; i < 240; i++) {
      out += '<circle cx="' + (R() * W).toFixed(0) + '" cy="' + (R() * H).toFixed(0) + '" r="' + (R() * 1.4 + 0.3).toFixed(1) + '" fill="#c9b48c" opacity="0.18"/>';
    }
    out += '<defs>';
    sayfa.paneller.forEach(function (p) {
      out += '<clipPath id="klip-' + p.id + '"><rect x="' + (p.x * W) + '" y="' + (p.y * H) + '" width="' + (p.w * W) + '" height="' + (p.h * H) + '" rx="3"/></clipPath>';
    });
    out += '</defs>';

    sayfa.paneller.forEach(function (p, idx) {
      var px = p.x * W, py = p.y * H, pw = p.w * W, ph = p.h * H;
      var secili = !secenek.sade && D.secim.panelId === p.id;
      out += '<g class="panel' + (secili && !D.secim.ogeId ? ' secili' : '') + '" data-panel="' + p.id + '" data-sira="' + idx + '">';
      out += '<rect x="' + px + '" y="' + py + '" width="' + pw + '" height="' + ph + '" fill="#ddd0b4"/>';
      out += '<g clip-path="url(#klip-' + p.id + ')">';
      out += '<g transform="translate(' + px + ',' + py + ')">';
      if (p.mekan) {
        // NUMEX-DÜZELTME (2026-11-15): İç içe mekân SVG'sine konum/boyut eklenirken özgün width="100%" height="100%" nitelikleri kaldırılmıyordu; aynı öznitelik iki kez tanımlandığı için SVG geçersiz XML oluyor ve PNG/PDF üretimi (görüntüye çevirme) başarısız oluyordu.
        var mMek = S.mekan(p.mekan).replace('width="100%" height="100%"', '')
          .replace('<svg ', '<svg x="0" y="0" width="400" height="300" preserveAspectRatio="none" ');
        out += '<g transform="scale(' + (pw / 400).toFixed(4) + ',' + (ph / 300).toFixed(4) + ')">' + mMek + '</g>';
      }
      // panel içi ışık/gölge
      out += '<rect width="' + pw + '" height="' + ph + '" fill="url(#panelGolge)" opacity="0.22"/>';
      out += '<defs><linearGradient id="panelGolge" x1="0" y1="0" x2="0" y2="1"><stop offset="0.55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.55"/></linearGradient></defs>';
      p.ogeler.slice().sort(function (a, b) { return (a.katman || 1) - (b.katman || 1); }).forEach(function (o) {
        out += ogeSvg(o, p);
      });
      out += '</g></g>';
      // çerçeve
      out += '<rect x="' + px + '" y="' + py + '" width="' + pw + '" height="' + ph + '" fill="none" stroke="' + INK + '" stroke-width="7"/>';
      if (secili) out += '<rect x="' + (px - 5) + '" y="' + (py - 5) + '" width="' + (pw + 10) + '" height="' + (ph + 10) + '" fill="none" stroke="#c8342b" stroke-width="3" stroke-dasharray="10 7"/>';
      out += '</g>';
    });
    out += '</svg>';
    return out;
  }

  /* ------------------------------------------------------------- ARAYÜZ */
  var el = {};
  function $(s) { return document.querySelector(s); }

  function durumYaz(metin) {
    if (!el.durum) return;
    el.durum.textContent = metin;
    el.durum.classList.add('parla');
    clearTimeout(el.durumZaman);
    el.durumZaman = setTimeout(function () { el.durum.classList.remove('parla'); }, 1200);
  }

  function kaydet(sessiz) {
    try {
      localStorage.setItem(SABIT.DEPO, JSON.stringify({ surum: D.surum, baslik: D.baslik, yazar: D.yazar, sayfalar: D.sayfalar, aktifSayfa: D.aktifSayfa }));
      if (!sessiz) durumYaz('Kaydedildi · ' + new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }));
    } catch (e) {
      if (!sessiz) durumYaz('Yerel kayıt başarısız: depolama dolu olabilir');
    }
  }
  var kaydetZaman;
  function otomatikKaydet() {
    clearTimeout(kaydetZaman);
    durumYaz('Kaydediliyor…');
    kaydetZaman = setTimeout(function () { kaydet(false); }, 450);
  }

  function yukle() {
    try {
      var ham = localStorage.getItem(SABIT.DEPO);
      if (!ham) return false;
      var v = JSON.parse(ham);
      if (!v || !Array.isArray(v.sayfalar) || !v.sayfalar.length) return false;
      D.surum = v.surum || 1; D.baslik = v.baslik || 'Adsız çizgi roman'; D.yazar = v.yazar || '';
      D.sayfalar = v.sayfalar; D.aktifSayfa = Math.min(v.aktifSayfa || 0, D.sayfalar.length - 1);
      D.secim = { panelId: null, ogeId: null };
      return true;
    } catch (e) { return false; }
  }

  /* ---------- Kütüphane ---------- */
  var aktifSekme = 'karakter';
  function kutuphaneCiz() {
    var html = '';
    if (aktifSekme === 'karakter') {
      html = '<div class="kart-izgara">' + S.KARAKTERLER.map(function (k) {
        return '<button class="kart" data-ekle="karakter" data-ref="' + k.id + '" title="' + S.esc(k.ad) + ' — sahneye ekle">' +
          '<span class="kart-gorsel">' + S.karakter(k, { ifade: 'mutlu', poz: 'ayakta' }) + '</span>' +
          '<span class="kart-ad">' + S.esc(k.ad) + '</span><span class="kart-alt">' + S.esc(k.unvan) + '</span></button>';
      }).join('') + '</div>';
    } else if (aktifSekme === 'mekan') {
      html = '<div class="kart-izgara genis">' + S.MEKANLAR.map(function (m) {
        return '<button class="kart manzara" data-mekan="' + m.id + '" title="' + S.esc(m.ad) + ' — seçili panele uygula">' +
          '<span class="kart-gorsel">' + S.mekan(m.id) + '</span><span class="kart-ad">' + S.esc(m.ad) + '</span></button>';
      }).join('') + '</div>' +
        '<p class="ipucu">Bir mekâna tıklayınca seçili panele uygulanır. Panel seçili değilse önce panelin üzerine tıklayın.</p>';
    } else if (aktifSekme === 'nesne') {
      html = '<div class="kart-izgara">' + S.NESNELER.map(function (n) {
        return '<button class="kart" data-ekle="nesne" data-ref="' + n.id + '" title="' + S.esc(n.ad) + ' — sahneye ekle">' +
          '<span class="kart-gorsel kucuk">' + S.nesne(n.id) + '</span><span class="kart-ad">' + S.esc(n.ad) + '</span></button>';
      }).join('') + '</div>';
    } else {
      html = '<div class="kart-izgara">' +
        ['konusma|Konuşma balonu|Merhaba!', 'dusunce|Düşünce balonu|Acaba…', 'efekt|Efekt yazısı|GÜMM!', 'anlati|Anlatı kutusu|Bir zamanlar…']
          .map(function (s) {
            var a = s.split('|');
            return '<button class="kart" data-ekle="balon" data-ref="' + a[0] + '" data-alt="' + a[0] + '">' +
              '<span class="kart-gorsel kucuk">' + S.balon(a[0], a[2], 'sol') + '</span><span class="kart-ad">' + a[1] + '</span></button>';
          }).join('') + '</div>';
    }
    el.kutuphane.innerHTML = html;
    document.querySelectorAll('#sekmeler [data-sekme]').forEach(function (b) {
      b.classList.toggle('aktif', b.dataset.sekme === aktifSekme);
    });
  }

  /* ---------- Özellikler ---------- */
  function ozellikCiz() {
    var o = seciliOge(), p = panelBul(D.secim.panelId), s = aktifSayfa();
    var h = '';
    if (!s) { el.ozellik.innerHTML = '<p class="bos">Sayfa yok.</p>'; return; }

    if (o) {
      var baslik = o.tip === 'karakter' ? S.karakterBul(o.ref).ad : o.tip === 'nesne' ? S.nesneAdi(o.ref) : (o.alt === 'dusunce' ? 'Düşünce balonu' : o.alt === 'efekt' ? 'Efekt yazısı' : o.alt === 'anlati' ? 'Anlatı kutusu' : 'Konuşma balonu');
      h += '<div class="oz-baslik"><span class="etiket">' + (o.tip === 'karakter' ? 'Karakter' : o.tip === 'nesne' ? 'Nesne' : 'Balon') + '</span><h2>' + S.esc(baslik) + '</h2></div>';

      if (o.tip === 'karakter') {
        h += alan('İfade', '<div class="cip-grup">' + Object.keys(S.IFADELER).map(function (k) {
          return '<button class="cip" data-ayar="ifade" data-deger="' + k + '"' + (o.ifade === k ? ' aria-pressed="true"' : '') + '>' + S.IFADELER[k] + '</button>';
        }).join('') + '</div>');
        h += alan('Poz', '<div class="cip-grup">' + Object.keys(S.POZLAR).map(function (k) {
          return '<button class="cip" data-ayar="poz" data-deger="' + k + '"' + (o.poz === k ? ' aria-pressed="true"' : '') + '>' + S.POZ_ADLARI[k] + '</button>';
        }).join('') + '</div>');
        h += alan('Karakteri değiştir', '<select data-ayar="ref">' + S.KARAKTERLER.map(function (k) {
          return '<option value="' + k.id + '"' + (o.ref === k.id ? ' selected' : '') + '>' + S.esc(k.ad) + '</option>';
        }).join('') + '</select>');
      }
      if (o.tip === 'nesne') {
        h += alan('Nesneyi değiştir', '<select data-ayar="ref">' + S.NESNELER.map(function (n) {
          return '<option value="' + n.id + '"' + (o.ref === n.id ? ' selected' : '') + '>' + S.esc(n.ad) + '</option>';
        }).join('') + '</select>');
      }
      if (o.tip === 'balon') {
        h += alan('Balon tipi', '<div class="cip-grup">' + [['konusma', 'Konuşma'], ['dusunce', 'Düşünce'], ['efekt', 'Efekt'], ['anlati', 'Anlatı']].map(function (a) {
          return '<button class="cip" data-ayar="alt" data-deger="' + a[0] + '"' + (o.alt === a[0] ? ' aria-pressed="true"' : '') + '>' + a[1] + '</button>';
        }).join('') + '</div>');
        h += alan('Metin', '<textarea data-ayar="metin" rows="3" maxlength="220">' + S.esc(o.metin || '') + '</textarea>');
        if (o.alt === 'konusma' || o.alt === 'dusunce') {
          h += alan('Kuyruk yönü', '<div class="cip-grup">' + [['sol', 'Sol'], ['sag', 'Sağ'], ['yok', 'Yok']].map(function (a) {
            return '<button class="cip" data-ayar="yon" data-deger="' + a[0] + '"' + (o.yon === a[0] ? ' aria-pressed="true"' : '') + '>' + a[1] + '</button>';
          }).join('') + '</div>');
        }
      }
      h += alan('Boyut', '<input type="range" min="30" max="260" value="' + Math.round((o.olcek || 1) * 100) + '" data-ayar="olcek"><span class="deger">' + Math.round((o.olcek || 1) * 100) + '%</span>');
      h += alan('Döndürme', '<input type="range" min="-45" max="45" value="' + (o.don || 0) + '" data-ayar="don"><span class="deger">' + (o.don || 0) + '°</span>');
      h += alan('Katman', '<div class="cip-grup"><button class="cip" data-ayar="katman" data-deger="-1">Arkaya</button><button class="cip" data-ayar="katman" data-deger="1">Öne</button></div>');
      h += alan('', '<div class="satir"><button class="dugme" data-ayar="ayna">Yatay çevir</button><button class="dugme tehlike" data-ayar="sil">Sil</button></div>');
    } else if (p) {
      h += '<div class="oz-baslik"><span class="etiket">Panel</span><h2>Panel ayarları</h2></div>';
      h += alan('Arka plan (mekân)', '<select data-panel-ayar="mekan"><option value="">— boş —</option>' + S.MEKANLAR.map(function (m) {
        return '<option value="' + m.id + '"' + (p.mekan === m.id ? ' selected' : '') + '>' + S.esc(m.ad) + '</option>';
      }).join('') + '</select>');
      h += alan('Paneli böl', '<div class="satir"><button class="dugme" data-panel-ayar="bol-dikey">Dikey böl</button><button class="dugme" data-panel-ayar="bol-yatay">Yatay böl</button></div>');
      h += alan('Sıra', '<div class="satir"><button class="dugme" data-panel-ayar="geri">◀ Öne al</button><button class="dugme" data-panel-ayar="ileri">İleri al ▶</button></div>');
      h += alan('', '<button class="dugme tehlike" data-panel-ayar="panel-sil">Paneli sil</button>');
      h += '<p class="ipucu">Paneli tıklayıp seçin, sonra kütüphaneden karakter veya balon ekleyin. Sürükleyerek taşıyın.</p>';
    } else {
      h += '<div class="oz-baslik"><span class="etiket">Sayfa</span><h2>Sayfa ayarları</h2></div>';
      h += alan('Sayfa düzeni', '<div class="duzen-izgara">' + Object.keys(DUZENLER).map(function (k) {
        return '<button class="duzen" data-duzen="' + k + '"' + (s.duzen === k ? ' aria-pressed="true"' : '') + '>' + duzenOnizleme(k) + '<span>' + DUZEN_ADLARI[k] + '</span></button>';
      }).join('') + '</div>');
      h += alan('Hikâye başlığı', '<input type="text" data-proje="baslik" value="' + S.esc(D.baslik) + '">');
      h += alan('Yazar', '<input type="text" data-proje="yazar" value="' + S.esc(D.yazar) + '">');
      h += '<p class="ipucu">Hiçbir şey seçili değilken sayfa ayarları görünür. Panel seçmek için panele tıklayın.</p>';
    }
    el.ozellik.innerHTML = h;
  }

  function alan(ad, icerik) {
    return '<div class="alan">' + (ad ? '<label>' + ad + '</label>' : '') + '<div class="alan-ic">' + icerik + '</div></div>';
  }
  function duzenOnizleme(k) {
    return '<svg viewBox="0 0 100 100" class="duzen-svg">' + DUZENLER[k].map(function (r) {
      return '<rect x="' + (r[0] * 100 + 2) + '" y="' + (r[1] * 100 + 2) + '" width="' + (r[2] * 100 - 4) + '" height="' + (r[3] * 100 - 4) + '" fill="none" stroke="currentColor" stroke-width="4"/>';
    }).join('') + '</svg>';
  }

  /* ---------- Sayfa şeridi + zaman çizelgesi ---------- */
  function altCiz() {
    if (!el.sayfaSeridi) return;
    el.sayfaSeridi.innerHTML = D.sayfalar.map(function (s, i) {
      return '<button class="serit-sayfa' + (i === D.aktifSayfa ? ' aktif' : '') + '" data-sayfa="' + i + '" title="Sayfa ' + (i + 1) + '">' +
        '<span class="serit-gorsel">' + sayfaSvg(s, { sade: true }) + '</span><span class="serit-no">' + (i + 1) + '</span></button>';
    }).join('') + '<button class="serit-ekle" data-sayfa-ekle title="Yeni sayfa ekle">+<span>Sayfa</span></button>';

    var s = aktifSayfa();
    if (!s) { el.zaman.innerHTML = ''; return; }
    el.zaman.innerHTML = '<div class="zaman-baslik"><span>Sahne zaman çizelgesi</span><span class="soluk">' + s.paneller.length + ' panel · sayfa ' + (D.aktifSayfa + 1) + '</span></div>' +
      '<div class="zaman-serit">' + s.paneller.map(function (p, i) {
        return '<button class="zaman-panel' + (D.secim.panelId === p.id ? ' aktif' : '') + '" data-zaman-panel="' + p.id + '">' +
          '<span class="zp-gorsel">' + (p.mekan ? S.mekan(p.mekan) : '<div style="width:100%;height:100%;background:#ddd0b4"></div>') + '</span>' +
          '<span class="zp-no">' + (i + 1) + '</span><span class="zp-bilgi">' + mekanAdi(p.mekan) + ' · ' + p.ogeler.length + ' öğe</span>' +
          '</button>';
      }).join('') + '</div>';
  }

  /* ---------- Ana çizim ---------- */
  function ciz() {
    var s = aktifSayfa();
    if (!s) { el.sahne.innerHTML = ''; return; }
    if (el.baslikGiris && document.activeElement !== el.baslikGiris) el.baslikGiris.value = D.baslik;
    el.sahne.innerHTML = sayfaSvg(s);
    kutuphaneCiz();
    ozellikCiz();
    altCiz();
    el.sayfaEtiket.textContent = 'Sayfa ' + (D.aktifSayfa + 1) + ' / ' + D.sayfalar.length;
    el.geriAl.disabled = GECMIS.length === 0;
  }

  /* --------------------------------------------------------- ETKİLEŞİM */
  var surukle = null;

  function sahneNoktasi(evt) {
    var svg = el.sahne.querySelector('svg');
    var r = svg.getBoundingClientRect();
    var olcek = Math.min(r.width / SABIT.SAYFA_W, r.height / SABIT.SAYFA_H);
    var bosX = (r.width - SABIT.SAYFA_W * olcek) / 2, bosY = (r.height - SABIT.SAYFA_H * olcek) / 2;
    return { x: (evt.clientX - r.left - bosX) / olcek, y: (evt.clientY - r.top - bosY) / olcek };
  }

  function sahneTikla(evt) {
    var ogeG = evt.target.closest ? evt.target.closest('.oge') : null;
    var panelG = evt.target.closest ? evt.target.closest('.panel') : null;
    if (ogeG) {
      D.secim = { panelId: ogeG.dataset.panel, ogeId: ogeG.dataset.oge };
    } else if (panelG) {
      D.secim = { panelId: panelG.dataset.panel, ogeId: null };
    } else {
      D.secim = { panelId: null, ogeId: null };
    }
    ciz();
  }

  function surukleBasla(evt) {
    var ogeG = evt.target.closest ? evt.target.closest('.oge') : null;
    if (!ogeG) return;
    var p = panelBul(ogeG.dataset.panel); if (!p) return;
    var o = null;
    p.ogeler.forEach(function (x) { if (x.id === ogeG.dataset.oge) o = x; });
    if (!o) return;
    D.secim = { panelId: p.id, ogeId: o.id };
    var nokta = sahneNoktasi(evt);
    var pw = p.w * SABIT.SAYFA_W, ph = p.h * SABIT.SAYFA_H;
    surukle = { o: o, p: p, g: ogeG, pw: pw, ph: ph, farkX: nokta.x - (p.x * SABIT.SAYFA_W + o.x * pw), farkY: nokta.y - (p.y * SABIT.SAYFA_H + o.y * ph), tasindi: false };
    ogeG.setAttribute('style', 'cursor:grabbing');
    evt.preventDefault();
  }

  function surukleHareket(evt) {
    if (!surukle) return;
    var n = sahneNoktasi(evt);
    var o = surukle.o, p = surukle.p;
    var nx = Math.max(-0.1, Math.min(1.1, (n.x - surukle.farkX - p.x * SABIT.SAYFA_W) / surukle.pw));
    var ny = Math.max(-0.1, Math.min(1.15, (n.y - surukle.farkY - p.y * SABIT.SAYFA_H) / surukle.ph));
    o.x = nx; o.y = ny;
    var b = ogeKutusu(o, p);
    surukle.g.setAttribute('transform', 'translate(' + b.cx.toFixed(2) + ',' + b.cy.toFixed(2) + ') rotate(' + (o.don || 0) + ')' + (o.ayna ? ' scale(-1,1)' : ''));
    surukle.tasindi = true;
  }

  function surukleBitir() {
    if (!surukle) return;
    if (surukle.tasindi) { otomatikKaydet(); ciz(); }
    surukle = null;
  }

  function tekerlek(evt) {
    var o = seciliOge();
    if (!o) return;
    evt.preventDefault();
    var yon = evt.deltaY > 0 ? -0.06 : 0.06;
    o.olcek = Math.max(0.3, Math.min(2.6, (o.olcek || 1) + yon));
    otomatikKaydet();
    ciz();
    durumYaz('Boyut ' + Math.round(o.olcek * 100) + '%');
  }

  /* ------------------------------------------------------- KOMUT İŞLEYİCİ */
  function ogeEkle(tip, ref, alt) {
    var p = panelBul(D.secim.panelId) || (aktifSayfa() && aktifSayfa().paneller[0]);
    if (!p) return;
    anlikGoruntu();
    var yeni = oge(tip, tip === 'balon' ? { alt: alt || 'konusma', metin: alt === 'efekt' ? 'GÜMM!' : alt === 'anlati' ? 'Bir zamanlar…' : alt === 'dusunce' ? 'Acaba…' : 'Yeni replik' } : {});
    if (tip === 'karakter') yeni.ref = ref;
    if (tip === 'nesne') yeni.ref = ref;
    yeni.katman = p.ogeler.length + 1;
    // üst üste binmesin
    yeni.x = 0.25 + (p.ogeler.length % 4) * 0.16;
    if (tip === 'balon') { yeni.x = 0.34; yeni.y = 0.24 + (p.ogeler.length % 3) * 0.18; }
    p.ogeler.push(yeni);
    D.secim = { panelId: p.id, ogeId: yeni.id };
    otomatikKaydet(); ciz();
    durumYaz(tip === 'karakter' ? S.karakterBul(ref).ad + ' sahneye eklendi' : tip === 'nesne' ? S.nesneAdi(ref) + ' eklendi' : 'Balon eklendi');
  }

  function panelAyar(komut) {
    var s = aktifSayfa(), p = panelBul(D.secim.panelId);
    if (!s) return;
    if (komut === 'bol-dikey' || komut === 'bol-yatay') {
      if (!p) { durumYaz('Önce bir panel seçin'); return; }
      anlikGoruntu();
      var idx = s.paneller.indexOf(p);
      var yeni;
      if (komut === 'bol-dikey') {
        var yari = p.w / 2;
        p.w = yari - 0.005;
        yeni = { id: kimlik('panel'), x: p.x + yari + 0.005, y: p.y, w: yari - 0.005, h: p.h, mekan: p.mekan, ogeler: [] };
      } else {
        var yarik = p.h / 2;
        p.h = yarik - 0.005;
        yeni = { id: kimlik('panel'), x: p.x, y: p.y + yarik + 0.005, w: p.w, h: yarik - 0.005, mekan: p.mekan, ogeler: [] };
      }
      s.paneller.splice(idx + 1, 0, yeni);
      D.secim = { panelId: yeni.id, ogeId: null };
      otomatikKaydet(); ciz(); durumYaz('Panel bölündü');
      return;
    }
    if (!p) return;
    if (komut === 'panel-sil') {
      if (s.paneller.length <= 1) { durumYaz('Son panel silinemez'); return; }
      anlikGoruntu();
      s.paneller = s.paneller.filter(function (x) { return x.id !== p.id; });
      D.secim = { panelId: null, ogeId: null };
      otomatikKaydet(); ciz(); durumYaz('Panel silindi — geri almak için Ctrl+Z');
      return;
    }
    if (komut === 'geri' || komut === 'ileri') {
      var i = s.paneller.indexOf(p), j = komut === 'geri' ? i - 1 : i + 1;
      if (j < 0 || j >= s.paneller.length) return;
      anlikGoruntu();
      s.paneller.splice(i, 1); s.paneller.splice(j, 0, p);
      // konumları sırayla yeniden dağıt
      var yerler = s.paneller.map(function (x) { return [x.x, x.y, x.w, x.h]; });
      var tmp = yerler[i]; yerler[i] = yerler[j]; yerler[j] = tmp;
      s.paneller.forEach(function (x, k) { x.x = yerler[k][0]; x.y = yerler[k][1]; x.w = yerler[k][2]; x.h = yerler[k][3]; });
      otomatikKaydet(); ciz(); durumYaz('Panel sırası değişti');
    }
  }

  function duzenUygula(anahtar) {
    var s = aktifSayfa(); if (!s) return;
    anlikGoruntu();
    var yerlesim = DUZENLER[anahtar];
    var eskiOgeler = [];
    s.paneller.forEach(function (p) { p.ogeler.forEach(function (o) { eskiOgeler.push(o); }); });
    var eskiMekanlar = s.paneller.map(function (p) { return p.mekan; });
    s.duzen = anahtar;
    s.paneller = yerlesim.map(function (r, i) {
      return { id: kimlik('panel'), x: r[0], y: r[1], w: r[2], h: r[3], mekan: eskiMekanlar[i] || null, ogeler: [] };
    });
    eskiOgeler.forEach(function (o, i) {
      var hedef = s.paneller[Math.min(i, s.paneller.length - 1)];
      o.katman = hedef.ogeler.length + 1;
      hedef.ogeler.push(o);
    });
    D.secim = { panelId: null, ogeId: null };
    otomatikKaydet(); ciz(); durumYaz('Düzen: ' + DUZEN_ADLARI[anahtar]);
  }

  function sayfaEkle() {
    anlikGoruntu();
    var s = aktifSayfa();
    var yeni = { id: kimlik('sayfa'), duzen: 'tek', paneller: [{ id: kimlik('panel'), x: 0, y: 0, w: 1, h: 1, mekan: s && s.paneller[0] ? s.paneller[0].mekan : 'catilar', ogeler: [] }] };
    D.sayfalar.splice(D.aktifSayfa + 1, 0, yeni);
    D.aktifSayfa = D.aktifSayfa + 1;
    D.secim = { panelId: null, ogeId: null };
    otomatikKaydet(); ciz(); durumYaz('Yeni sayfa ' + (D.aktifSayfa + 1));
  }

  function sayfaSil() {
    if (D.sayfalar.length <= 1) { durumYaz('Son sayfa silinemez'); return; }
    anlikGoruntu();
    var no = D.aktifSayfa + 1;
    D.sayfalar.splice(D.aktifSayfa, 1);
    D.aktifSayfa = Math.max(0, D.aktifSayfa - 1);
    D.secim = { panelId: null, ogeId: null };
    otomatikKaydet(); ciz(); durumYaz('Sayfa ' + no + ' silindi — Ctrl+Z ile geri alınır');
  }

  function sayfaGit(i) {
    if (i < 0 || i >= D.sayfalar.length) return false;
    D.aktifSayfa = i; D.secim = { panelId: null, ogeId: null };
    ciz(); return true;
  }

  function geriAl() {
    if (!GECMIS.length) { durumYaz('Geri alınacak adım yok'); return; }
    D.sayfalar = JSON.parse(GECMIS.pop());
    D.aktifSayfa = Math.min(D.aktifSayfa, D.sayfalar.length - 1);
    D.secim = { panelId: null, ogeId: null };
    otomatikKaydet(); ciz(); durumYaz('Geri alındı');
  }

  /* ------------------------------------------------------- DIŞA AKTARMA */
  function svgMetni(sayfa) {
    return sayfaSvg(sayfa, { sade: true });
  }

  function svgPng(sayfa, olcek) {
    return new Promise(function (resolve, reject) {
      olcek = olcek || 2;
      var svg = svgMetni(sayfa);
      // data URL: blob URL'e göre daha geniş tarayıcı desteği, ağ isteği yok
      var url = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
      var img = new Image();
      img.onload = function () {
        var c = document.createElement('canvas');
        c.width = SABIT.SAYFA_W * olcek; c.height = SABIT.SAYFA_H * olcek;
        var ctx = c.getContext('2d');
        ctx.fillStyle = '#f4ead6'; ctx.fillRect(0, 0, c.width, c.height);
        ctx.drawImage(img, 0, 0, c.width, c.height);
        try { resolve(c.toDataURL('image/png')); } catch (e) { reject(e); }
      };
      img.onerror = function () {
        var ayrinti = '';
        try {
          var belge = new DOMParser().parseFromString(svg, 'image/svg+xml');
          var hata = belge.querySelector('parsererror');
          if (hata) ayrinti = ' — XML: ' + hata.textContent.replace(/\s+/g, ' ').slice(0, 160);
        } catch (e2) { }
        reject(new Error('SVG görüntüye çevrilemedi' + ayrinti));
      };
      img.src = url;
    });
  }

  function indir(veri, ad, tip) {
    var a = document.createElement('a');
    a.href = veri; a.download = ad; document.body.appendChild(a); a.click();
    setTimeout(function () { a.remove(); }, 1500);
  }
  function dosyaAdi(uzanti) {
    var temel = (D.baslik || 'cizgi-roman').toLowerCase()
      .replace(/[çğıöşü]/g, function (h) { return { 'ç': 'c', 'ğ': 'g', 'ı': 'i', 'ö': 'o', 'ş': 's', 'ü': 'u' }[h]; })
      .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'cizgi-roman';
    return temel + '.' + uzanti;
  }

  function pngIndir() {
    var s = aktifSayfa();
    durumYaz('PNG hazırlanıyor…');
    svgPng(s, 2).then(function (url) {
      indir(url, dosyaAdi('png'), 'image/png');
      durumYaz('PNG indirildi');
    }).catch(function (e) { durumYaz('PNG hatası: ' + e.message); });
  }

  function jpegBase64(sayfa, kalite) {
    return new Promise(function (resolve, reject) {
      svgPng(sayfa, 2).then(function (pngUrl) {
        var img = new Image();
        img.onload = function () {
          var c = document.createElement('canvas');
          c.width = img.width; c.height = img.height;
          var ctx = c.getContext('2d');
          ctx.fillStyle = '#f4ead6'; ctx.fillRect(0, 0, c.width, c.height);
          ctx.drawImage(img, 0, 0);
          resolve({ data: c.toDataURL('image/jpeg', kalite || 0.9).split(',')[1], w: c.width, h: c.height });
        };
        img.onerror = function () { reject(new Error('Sayfa görüntüye çevrilemedi')); };
        img.src = pngUrl;
      }).catch(reject);
    });
  }

  /* PDF: elle yazılmış, bağımlılıksız çok sayfalı PDF (sayfa başına JPEG gömülür) */
  function pdfOlustur(goruntuler) {
    var parcalar = [], ofset = 0;
    function ekle(veri) {
      parcalar.push(veri);
      ofset += typeof veri === 'string' ? new TextEncoder().encode(veri).length : veri.length;
    }
    var ORAN = 0.678;
    var PW = 420, PH = Math.round(PW / ORAN); // 420 x 619 pt
    ekle('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n');
    var nesneler = [];
    var sayfaSayisi = goruntuler.length;
    var idPages = 2, idCatalog = 1, ilkId = 3;
    var sayfaIdleri = [];
    for (var i = 0; i < sayfaSayisi; i++) sayfaIdleri.push(ilkId + i * 3);

    function nesneBas(id) { nesneler[id] = ofset; ekle(id + ' 0 obj\n'); }
    function nesneSon() { ekle('endobj\n'); }

    nesneBas(idCatalog);
    ekle('<< /Type /Catalog /Pages ' + idPages + ' 0 R >>\n'); nesneSon();

    nesneBas(idPages);
    ekle('<< /Type /Pages /Count ' + sayfaSayisi + ' /Kids [' + sayfaIdleri.map(function (x) { return x + ' 0 R'; }).join(' ') + '] >>\n'); nesneSon();

    goruntuler.forEach(function (g, i) {
      var idSayfa = ilkId + i * 3, idIcerik = idSayfa + 1, idGorsel = idSayfa + 2;
      var ikili = Uint8Array.from(atob(g.data), function (c) { return c.charCodeAt(0); });

      nesneBas(idSayfa);
      ekle('<< /Type /Page /Parent ' + idPages + ' 0 R /MediaBox [0 0 ' + PW + ' ' + PH + '] /Resources << /XObject << /Im0 ' + idGorsel + ' 0 R >> >> /Contents ' + idIcerik + ' 0 R >>\n'); nesneSon();

      var akis = 'q\n' + PW + ' 0 0 ' + PH + ' 0 0 cm\n/Im0 Do\nQ\n';
      nesneBas(idIcerik);
      ekle('<< /Length ' + new TextEncoder().encode(akis).length + ' >>\nstream\n' + akis + 'endstream\n'); nesneSon();

      nesneBas(idGorsel);
      ekle('<< /Type /XObject /Subtype /Image /Width ' + g.w + ' /Height ' + g.h + ' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ' + ikili.length + ' >>\nstream\n');
      ekle(ikili); // bayt olarak eklenmeli
      ekle('\nendstream\n'); nesneSon();
    });

    var xrefKonum = ofset;
    var toplam = ilkId + sayfaSayisi * 3;
    var xref = 'xref\n0 ' + toplam + '\n0000000000 65535 f \n';
    for (var n = 1; n < toplam; n++) {
      xref += ('0000000000' + (nesneler[n] || 0)).slice(-10) + ' 00000 n \n';
    }
    ekle(xref);
    ekle('trailer\n<< /Size ' + toplam + ' /Root ' + idCatalog + ' 0 R >>\nstartxref\n' + xrefKonum + '\n%%EOF\n');

    var blobParcalari = parcalar.map(function (p) {
      return typeof p === 'string' ? new TextEncoder().encode(p) : p;
    });
    return new Blob(blobParcalari, { type: 'application/pdf' });
  }

  function pdfIndir() {
    durumYaz('PDF hazırlanıyor…');
    var isler = D.sayfalar.map(function (s) { return jpegBase64(s, 0.9); });
    Promise.all(isler).then(function (goruntuler) {
      var blob = pdfOlustur(goruntuler);
      var url = URL.createObjectURL(blob);
      indir(url, dosyaAdi('pdf'), 'application/pdf');
      setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
      durumYaz('PDF indirildi · ' + goruntuler.length + ' sayfa');
    }).catch(function (e) { durumYaz('PDF hatası: ' + e.message); });
  }

  function jsonIndir() {
    var veri = JSON.stringify({ uygulama: 'Numex Story Forge', surum: 1, baslik: D.baslik, yazar: D.yazar, sayfalar: D.sayfalar }, null, 2);
    var url = URL.createObjectURL(new Blob([veri], { type: 'application/json' }));
    indir(url, dosyaAdi('json'), 'application/json');
    setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
    durumYaz('JSON indirildi');
  }

  function jsonYukle(dosya) {
    var okuyucu = new FileReader();
    okuyucu.onload = function () {
      try {
        var v = JSON.parse(okuyucu.result);
        if (!v.sayfalar || !Array.isArray(v.sayfalar) || !v.sayfalar.length) throw new Error('Geçerli sayfa bulunamadı');
        anlikGoruntu();
        D.sayfalar = v.sayfalar;
        D.baslik = v.baslik || 'İçe aktarılan çizgi roman';
        D.yazar = v.yazar || '';
        D.aktifSayfa = 0; D.secim = { panelId: null, ogeId: null };
        otomatikKaydet(); ciz(); durumYaz('JSON içe aktarıldı · ' + v.sayfalar.length + ' sayfa');
      } catch (e) { durumYaz('JSON okunamadı: ' + e.message); }
    };
    okuyucu.readAsText(dosya);
  }

  /* ------------------------------------------------------------ OKUMA MODU */
  var okuma = { acik: false, sayfa: 0, panel: 0 };

  function okumaCiz() {
    var s = D.sayfalar[okuma.sayfa];
    if (!s) return;
    el.okumaSahne.innerHTML = sayfaSvg(s, { sade: true });
    var sayfaEl = el.okumaSahne.firstElementChild;
    sayfaEl.classList.add('okuma-sayfa');
    var paneller = sayfaEl.querySelectorAll('.panel');
    paneller.forEach(function (p, i) {
      p.classList.add('okuma-panel');
      if (i === okuma.panel) p.classList.add('vurgu');
      else if (okuma.panel >= 0) p.classList.add('solgun');
    });
    el.okumaSayaci.textContent = 'Sayfa ' + (okuma.sayfa + 1) + ' / ' + D.sayfalar.length + ' · Panel ' + (okuma.panel + 1) + ' / ' + s.paneller.length;
    // animasyon
    el.okumaSahne.classList.remove('giris');
    void el.okumaSahne.offsetWidth;
    el.okumaSahne.classList.add('giris');
  }

  function okumaAc() {
    okuma = { acik: true, sayfa: D.aktifSayfa, panel: -1 };
    el.okuma.classList.add('acik');
    document.body.classList.add('okuma-acik');
    el.okumaBaslik.textContent = D.baslik + (D.yazar ? ' · ' + D.yazar : '');
    okumaCiz();
    durumYaz('Okuma modu');
  }
  function okumaKapat() {
    okuma.acik = false;
    el.okuma.classList.remove('acik');
    document.body.classList.remove('okuma-acik');
  }
  function okumaIleri() {
    var s = D.sayfalar[okuma.sayfa];
    if (!s) return;
    if (okuma.panel < s.paneller.length - 1) { okuma.panel++; okumaCiz(); return; }
    if (okuma.sayfa < D.sayfalar.length - 1) { okuma.sayfa++; okuma.panel = 0; okumaCiz(); }
  }
  function okumaGeri() {
    if (okuma.panel > 0) { okuma.panel--; okumaCiz(); return; }
    if (okuma.sayfa > 0) { okuma.sayfa--; okuma.panel = D.sayfalar[okuma.sayfa].paneller.length - 1; okumaCiz(); }
  }

  /* --------------------------------------------------------------- OLAYLAR */
  function olaylariBagla() {
    el.sahne.addEventListener('click', sahneTikla);
    el.sahne.addEventListener('pointerdown', surukleBasla);
    window.addEventListener('pointermove', surukleHareket);
    window.addEventListener('pointerup', surukleBitir);
    el.sahne.addEventListener('wheel', tekerlek, { passive: false });

    el.sekmeler.addEventListener('click', function (e) {
      var sekme = e.target.closest('[data-sekme]');
      if (sekme) { aktifSekme = sekme.dataset.sekme; D.secim = D.secim; kutuphaneCiz(); }
    });
    el.kutuphane.addEventListener('click', function (e) {
      var kart = e.target.closest('[data-ekle]');
      if (kart) { ogeEkle(kart.dataset.ekle, kart.dataset.ref, kart.dataset.alt); return; }
      var mek = e.target.closest('[data-mekan]');
      if (mek) {
        var p = panelBul(D.secim.panelId) || (aktifSayfa() && aktifSayfa().paneller[0]);
        if (!p) return;
        anlikGoruntu();
        p.mekan = mek.dataset.mekan;
        D.secim = { panelId: p.id, ogeId: null };
        otomatikKaydet(); ciz();
        durumYaz(S.MEKANLAR.filter(function (m) { return m.id === mek.dataset.mekan; })[0].ad + ' uygulandı');
      }
    });

    el.ozellik.addEventListener('input', function (e) {
      var t = e.target;
      var o = seciliOge();
      if (t.dataset.proje) { D[t.dataset.proje] = t.value; otomatikKaydet(); return; }
      if (t.dataset.panelAyar === 'mekan') {
        var p = panelBul(D.secim.panelId); if (!p) return;
        p.mekan = t.value || null; otomatikKaydet(); ciz(); return;
      }
      if (!o || !t.dataset.ayar) return;
      var a = t.dataset.ayar;
      if (a === 'metin') { o.metin = t.value; }
      else if (a === 'olcek') { o.olcek = parseFloat(t.value) / 100; var d = t.parentNode.querySelector('.deger'); if (d) d.textContent = t.value + '%'; }
      else if (a === 'don') { o.don = parseFloat(t.value); var d2 = t.parentNode.querySelector('.deger'); if (d2) d2.textContent = t.value + '°'; }
      else { return; }
      otomatikKaydet();
      // canlı: sadece sahneyi yenile (forma dokunma)
      var s = aktifSayfa();
      var odak = document.activeElement === t;
      var secim = t.selectionStart;
      el.sahne.innerHTML = sayfaSvg(s);
      if (odak && t.selectionStart !== null) { try { t.setSelectionRange(secim, secim); } catch (err) { } }
      altCiz();
    });

    el.ozellik.addEventListener('change', function (e) {
      var t = e.target;
      if (t.dataset.panelAyar === 'mekan') return;
      if (t.tagName === 'SELECT' && t.dataset.ayar === 'ref') {
        var o = seciliOge(); if (!o) return;
        anlikGoruntu(); o.ref = t.value; otomatikKaydet(); ciz(); return;
      }
      if (t.dataset.proje) { D[t.dataset.proje] = t.value; otomatikKaydet(); return; }
    });

    el.ozellik.addEventListener('click', function (e) {
      var b = e.target.closest('button');
      if (!b) return;
      if (b.dataset.duzen) { duzenUygula(b.dataset.duzen); return; }
      if (b.dataset.panelAyar) { panelAyar(b.dataset.panelAyar); return; }
      if (!b.dataset.ayar) return;
      var o = seciliOge(); if (!o) return;
      var a = b.dataset.ayar;
      if (a === 'sil') {
        var p = panelBul(D.secim.panelId);
        anlikGoruntu();
        p.ogeler = p.ogeler.filter(function (x) { return x.id !== o.id; });
        D.secim = { panelId: p.id, ogeId: null };
        otomatikKaydet(); ciz(); durumYaz('Öğe silindi');
        return;
      }
      if (a === 'ayna') { anlikGoruntu(); o.ayna = !o.ayna; otomatikKaydet(); ciz(); return; }
      if (a === 'katman') { anlikGoruntu(); o.katman = (o.katman || 1) + parseInt(b.dataset.deger, 10); otomatikKaydet(); ciz(); return; }
      anlikGoruntu();
      o[a] = b.dataset.deger;
      otomatikKaydet(); ciz();
    });

    el.alt.addEventListener('click', function (e) {
      var sf = e.target.closest('[data-sayfa]');
      if (sf) { sayfaGit(parseInt(sf.dataset.sayfa, 10)); return; }
      if (e.target.closest('[data-sayfa-ekle]')) { sayfaEkle(); return; }
      var zp = e.target.closest('[data-zaman-panel]');
      if (zp) { D.secim = { panelId: zp.dataset.zamanPanel, ogeId: null }; ciz(); }
    });

    el.ekleSayfa.addEventListener('click', sayfaEkle);
    el.silSayfa.addEventListener('click', sayfaSil);
    el.geriAl.addEventListener('click', geriAl);
    el.pngIndir.addEventListener('click', pngIndir);
    el.pdfIndir.addEventListener('click', pdfIndir);
    el.jsonIndir.addEventListener('click', jsonIndir);
    el.jsonYukle.addEventListener('change', function (e) { if (e.target.files[0]) jsonYukle(e.target.files[0]); e.target.value = ''; });
    el.okumaAc.addEventListener('click', okumaAc);
    el.okumaKapat.addEventListener('click', okumaKapat);
    el.okumaIleri.addEventListener('click', okumaIleri);
    el.okumaGeri.addEventListener('click', okumaGeri);
    el.okumaSahne.addEventListener('click', okumaIleri);

    // mobil çekmeceler
    document.querySelectorAll('[data-cekmece]').forEach(function (b) {
      b.addEventListener('click', function () {
        var hedef = b.dataset.cekmece === 'kutuphane' ? el.kutuphaneKutu : el.ozellikKutu;
        var acik = hedef.classList.contains('acik');
        el.kutuphaneKutu.classList.remove('acik'); el.ozellikKutu.classList.remove('acik');
        if (!acik) hedef.classList.add('acik');
      });
    });

    document.addEventListener('keydown', function (e) {
      if (okuma.acik) {
        if (e.key === 'Escape') { okumaKapat(); return; }
        if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') { e.preventDefault(); okumaIleri(); return; }
        if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); okumaGeri(); return; }
        if (e.key === 'Home') { okuma.sayfa = 0; okuma.panel = 0; okumaCiz(); return; }
        return;
      }
      var yaziyor = /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName);
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); geriAl(); return; }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') { e.preventDefault(); kaydet(false); return; }
      if (yaziyor) return;
      if (e.key === 'Delete' || e.key === 'Backspace') {
        var o = seciliOge();
        if (o) {
          e.preventDefault();
          var p = panelBul(D.secim.panelId);
          anlikGoruntu();
          p.ogeler = p.ogeler.filter(function (x) { return x.id !== o.id; });
          D.secim = { panelId: p.id, ogeId: null };
          otomatikKaydet(); ciz(); durumYaz('Öğe silindi');
        }
      }
      if (e.key === 'ArrowLeft') { sayfaGit(D.aktifSayfa - 1); }
      if (e.key === 'ArrowRight') { sayfaGit(D.aktifSayfa + 1); }
    });

    window.addEventListener('beforeunload', function () { kaydet(true); });
  }

  /* --------------------------------------------------------------- BAŞLAT */
  function baslat() {
    el = {
      sahne: $('#sahne'), kutuphane: $('#kutuphane'), ozellik: $('#ozellikler'), alt: $('#alt'),
      sayfaSeridi: $('#sayfa-serif'), zaman: $('#zaman'), durum: $('#durum'), baslikGiris: $('#proje-baslik'),
      sayfaEtiket: $('#sayfa-etiket'), geriAl: $('#geri-al'),
      ekleSayfa: $('#ekle-sayfa'), silSayfa: $('#sil-sayfa'),
      pngIndir: $('#png-indir'), pdfIndir: $('#pdf-indir'), jsonIndir: $('#json-indir'), jsonYukle: $('#json-yukle'),
      okuma: $('#okuma'), okumaSahne: $('#okuma-sahne'), okumaBaslik: $('#okuma-baslik'), okumaSayaci: $('#okuma-sayaci'),
      okumaKapat: $('#okuma-kapat'), okumaIleri: $('#okuma-ileri'), okumaGeri: $('#okuma-geri'), okumaAc: $('#okuma-ac'),
      kutuphaneKutu: $('#kutuphane-kutu'), ozellikKutu: $('#ozellik-kutu'), sekmeler: $('#sekmeler')
    };
    if (!yukle()) { D = ornekProje(); kaydet(true); }
    olaylariBagla();
    ciz();
    durumYaz('Örnek çizgi roman yüklendi — düzenlemeye hazır');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', baslat);
  else baslat();

  window.StoryForge = { durum: D, sahneCiz: ciz, pngIndir: pngIndir, pdfIndir: pdfIndir };
})();
