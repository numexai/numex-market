'use strict';
/* Numex Paper World — kâğıt nesne kütüphanesi
   26 hazır kâğıt nesnesi + renk tonu motoru. Her nesne vektör (SVG) olarak
   tanımlıdır; renkler tek bir ana renkten türetilir, böylece renk seçici
   tüm gölge/açık tonları birlikte günceller. */

/* ---------- renk motoru ---------- */
function hexToHsl(hex) {
  hex = String(hex || '#cccccc').replace('#', '').trim();
  if (hex.length === 3) hex = hex.split('').map(function (c) { return c + c; }).join('');
  if (hex.length !== 6 || /[^0-9a-f]/i.test(hex)) hex = 'cccccc';
  var r = parseInt(hex.slice(0, 2), 16) / 255;
  var g = parseInt(hex.slice(2, 4), 16) / 255;
  var b = parseInt(hex.slice(4, 6), 16) / 255;
  var mx = Math.max(r, g, b), mn = Math.min(r, g, b);
  var h = 0, s = 0, l = (mx + mn) / 2;
  if (mx !== mn) {
    var d = mx - mn;
    s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
    if (mx === r) h = (g - b) / d + (g < b ? 6 : 0);
    else if (mx === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
  }
  return [Math.round(h), Math.round(s * 100), Math.round(l * 100)];
}

function hslToHex(h, s, l) {
  h = ((h % 360) + 360) % 360;
  s = Math.max(0, Math.min(100, s)) / 100;
  l = Math.max(0, Math.min(100, l)) / 100;
  var a = s * Math.min(l, 1 - l);
  function f(n) {
    var k = (n + h / 30) % 12;
    return l - a * Math.max(-1, Math.min(k - 3, Math.min(9 - k, 1)));
  }
  function t(n) { return Math.round(255 * f(n)).toString(16).padStart(2, '0'); }
  return '#' + t(0) + t(8) + t(4);
}

/* ana renkten 5 ton: a=ana, b=koyu, c=açık, d=gölge/çizgi, e=vurgu */
function tonlar(hex) {
  var hsl = hexToHsl(hex), h = hsl[0], s = hsl[1], l = hsl[2];
  s = Math.max(10, Math.min(92, s));
  l = Math.max(30, Math.min(96, l));
  return {
    a: hslToHex(h, s, l),
    b: hslToHex(h, Math.min(96, s + 8), Math.max(20, l - 16)),
    c: hslToHex(h, Math.max(10, s - 12), Math.min(95, l + 17)),
    d: hslToHex(h, Math.min(96, s + 4), Math.max(14, l - 28)),
    e: hslToHex(h + 165, Math.min(80, s + 6), Math.min(92, l + 10))
  };
}

/* ---------- nesne kütüphanesi ----------
   vb    : viewBox (kullanıcı birimi)
   en    : piksel genişliği (yükseklik vb'den orantılanır)
   anim  : dış hareket  suzul | salla | nefes | don | yok
   kat   : palet kategorisi
   ic    : svg içeriği (c = ton nesnesi)
----------------------------------------- */
var KAGITLAR = {

  tepe: {
    ad: 'Tepe', kat: 'Manzara', vb: [200, 100], en: 520, anim: 'yok', renk: '#9adfa0',
    ic: function (c) {
      return '<path d="M0 100C18 58 46 26 82 30 122 34 152 66 200 100Z" fill="' + c.b + '"/>' +
        '<path d="M0 100C24 64 52 36 86 40 124 44 156 74 200 100Z" fill="' + c.a + '"/>' +
        '<path d="M0 100C24 64 52 36 86 40 124 44 156 74 200 100" fill="none" stroke="' + c.c + '" stroke-width="1.2" opacity=".75"/>';
    }
  },

  bulut: {
    ad: 'Bulut', kat: 'Gökyüzü', vb: [200, 120], en: 235, anim: 'suzul', renk: '#f7fcff',
    ic: function (c) {
      return '<ellipse cx="62" cy="86" rx="52" ry="26" fill="' + c.b + '" opacity=".28"/>' +
        '<ellipse cx="70" cy="70" rx="52" ry="32" fill="' + c.a + '"/>' +
        '<ellipse cx="112" cy="58" rx="42" ry="36" fill="' + c.a + '"/>' +
        '<ellipse cx="150" cy="76" rx="38" ry="26" fill="' + c.a + '"/>' +
        '<ellipse cx="104" cy="88" rx="58" ry="16" fill="' + c.c + '" opacity=".85"/>';
    }
  },

  gunes: {
    ad: 'Güneş', kat: 'Gökyüzü', vb: [120, 120], en: 195, anim: 'yok', renk: '#ffd76a',
    ic: function (c) {
      var isin = '';
      for (var i = 0; i < 12; i++) {
        var a = i * 30 * Math.PI / 180;
        var x1 = (60 + Math.cos(a) * 31).toFixed(1), y1 = (60 + Math.sin(a) * 31).toFixed(1);
        var x2 = (60 + Math.cos(a) * 47).toFixed(1), y2 = (60 + Math.sin(a) * 47).toFixed(1);
        isin += '<line x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 +
          '" stroke="' + c.c + '" stroke-width="6" stroke-linecap="round"/>';
      }
      return '<g class="ic-don" style="transform-origin:60px 60px">' + isin + '</g>' +
        '<circle cx="60" cy="60" r="30" fill="' + c.b + '" opacity=".55"/>' +
        '<circle cx="60" cy="60" r="28" fill="' + c.a + '"/>' +
        '<circle cx="52" cy="52" r="11" fill="' + c.c + '" opacity=".6"/>';
    }
  },

  ev: {
    ad: 'Ev', kat: 'Yapı', vb: [120, 114], en: 185, anim: 'nefes', renk: '#ffc9b8',
    ic: function (c) {
      return '<rect x="26" y="54" width="70" height="58" rx="5" fill="' + c.b + '" opacity=".5"/>' +
        '<rect x="24" y="52" width="72" height="58" rx="5" fill="' + c.a + '"/>' +
        '<path d="M12 54 60 14 108 54Z" fill="' + c.b + '"/>' +
        '<path d="M12 54 60 14 108 54" fill="none" stroke="' + c.d + '" stroke-width="1.4" opacity=".35"/>' +
        '<rect x="52" y="76" width="18" height="34" rx="3" fill="' + c.d + '" opacity=".8"/>' +
        '<circle cx="66" cy="93" r="1.6" fill="' + c.c + '"/>' +
        '<rect x="31" y="64" width="16" height="14" rx="3" fill="' + c.c + '"/>' +
        '<rect x="73" y="64" width="16" height="14" rx="3" fill="' + c.c + '"/>' +
        '<rect x="31" y="64" width="16" height="14" rx="3" fill="none" stroke="' + c.d + '" stroke-width="1" opacity=".5"/>' +
        '<rect x="73" y="64" width="16" height="14" rx="3" fill="none" stroke="' + c.d + '" stroke-width="1" opacity=".5"/>';
    }
  },

  agac: {
    ad: 'Ağaç', kat: 'Doğa', vb: [100, 134], en: 155, anim: 'yok', renk: '#7fcf8e',
    ic: function (c) {
      return '<path d="M44 132 47 84h7l2 48Z" fill="#a07d5c"/>' +
        '<path d="M47 84h7l2 48h-4Z" fill="#8a6a4b" opacity=".55"/>' +
        '<g class="ic-salla" style="transform-origin:50px 88px">' +
        '<circle cx="50" cy="56" r="32" fill="' + c.b + '"/>' +
        '<circle cx="31" cy="68" r="22" fill="' + c.b + '"/>' +
        '<circle cx="69" cy="68" r="22" fill="' + c.b + '"/>' +
        '<circle cx="50" cy="50" r="30" fill="' + c.a + '"/>' +
        '<circle cx="33" cy="64" r="20" fill="' + c.a + '"/>' +
        '<circle cx="67" cy="64" r="20" fill="' + c.a + '"/>' +
        '<circle cx="41" cy="44" r="11" fill="' + c.c + '" opacity=".7"/>' +
        '</g>';
    }
  },

  cicek: {
    ad: 'Çiçek', kat: 'Doğa', vb: [80, 116], en: 84, anim: 'yok', renk: '#ff9ec4',
    ic: function (c) {
      var y = '';
      for (var i = 0; i < 5; i++) {
        y += '<ellipse cx="40" cy="24" rx="11" ry="15" fill="' + c.a + '" transform="rotate(' + (i * 72) + ' 40 42)"/>';
      }
      var sap = '#6db87a', yaprak = '#7cc98a';
      return '<path d="M40 116V54" stroke="' + sap + '" stroke-width="4" stroke-linecap="round"/>' +
        '<path d="M40 90c-13 0-19-8-19-15 11 0 19 7 19 15Z" fill="' + yaprak + '"/>' +
        '<path d="M40 76c13 0 19-8 19-15-11 0-19 7-19 15Z" fill="' + yaprak + '" opacity=".85"/>' +
        '<g class="ic-salla" style="transform-origin:40px 52px">' + y +
        '<circle cx="40" cy="42" r="10" fill="' + c.c + '"/>' +
        '<circle cx="40" cy="42" r="4.5" fill="' + c.b + '" opacity=".65"/></g>';
    }
  },

  kus: {
    ad: 'Kuş', kat: 'Hayvan', vb: [100, 60], en: 108, anim: 'suzul', renk: '#7fb4ff',
    ic: function (c) {
      return '<path d="M6 42C18 20 34 20 46 38" fill="none" stroke="' + c.b + '" stroke-width="9" stroke-linecap="round"/>' +
        '<path d="M94 42C82 20 66 20 54 38" fill="none" stroke="' + c.b + '" stroke-width="9" stroke-linecap="round"/>' +
        '<path d="M6 42C18 24 34 24 46 40" fill="none" stroke="' + c.a + '" stroke-width="5.5" stroke-linecap="round"/>' +
        '<path d="M94 42C82 24 66 24 54 40" fill="none" stroke="' + c.a + '" stroke-width="5.5" stroke-linecap="round"/>' +
        '<ellipse cx="50" cy="41" rx="9" ry="7" fill="' + c.a + '"/>' +
        '<circle cx="50" cy="38" r="2" fill="' + c.d + '" opacity=".7"/>';
    }
  },

  kelebek: {
    ad: 'Kelebek', kat: 'Hayvan', vb: [100, 90], en: 100, anim: 'suzul', renk: '#c9a7ff',
    ic: function (c) {
      return '<g class="ic-cirp" style="transform-origin:50px 46px">' +
        '<path d="M48 42C34 14 12 10 10 30c-2 16 12 26 26 26Z" fill="' + c.a + '"/>' +
        '<path d="M52 42C66 14 88 10 90 30c2 16-12 26-26 26Z" fill="' + c.a + '"/>' +
        '<path d="M48 48C34 70 16 78 14 64c-2-12 12-18 24-18Z" fill="' + c.b + '" opacity=".9"/>' +
        '<path d="M52 48C66 70 84 78 86 64c2-12-12-18-24-18Z" fill="' + c.b + '" opacity=".9"/>' +
        '<circle cx="30" cy="30" r="5" fill="' + c.c + '" opacity=".85"/>' +
        '<circle cx="70" cy="30" r="5" fill="' + c.c + '" opacity=".85"/>' +
        '</g>' +
        '<ellipse cx="50" cy="46" rx="3.2" ry="15" fill="' + c.d + '"/>' +
        '<path d="M50 33c-4-8-9-10-12-10M50 33c4-8 9-10 12-10" stroke="' + c.d + '" stroke-width="1.5" fill="none" stroke-linecap="round"/>';
    }
  },

  cali: {
    ad: 'Çalı', kat: 'Doğa', vb: [140, 100], en: 155, anim: 'nefes', renk: '#8ed9a6',
    ic: function (c) {
      return '<ellipse cx="70" cy="86" rx="62" ry="14" fill="' + c.d + '" opacity=".2"/>' +
        '<circle cx="42" cy="70" r="28" fill="' + c.b + '"/>' +
        '<circle cx="96" cy="70" r="30" fill="' + c.b + '"/>' +
        '<circle cx="70" cy="58" r="30" fill="' + c.b + '"/>' +
        '<circle cx="44" cy="68" r="26" fill="' + c.a + '"/>' +
        '<circle cx="96" cy="68" r="28" fill="' + c.a + '"/>' +
        '<circle cx="70" cy="56" r="28" fill="' + c.a + '"/>' +
        '<circle cx="62" cy="48" r="10" fill="' + c.c + '" opacity=".65"/>';
    }
  },

  mantar: {
    ad: 'Mantar', kat: 'Doğa', vb: [100, 110], en: 96, anim: 'nefes', renk: '#ff8f8f',
    ic: function (c) {
      return '<path d="M40 108V66h20v42Z" fill="#f6ead8"/>' +
        '<path d="M40 108V66h20v42Z" fill="none" stroke="#d9c6ab" stroke-width="1.2" opacity=".8"/>' +
        '<path d="M10 62C10 34 30 16 50 16s40 18 40 46Z" fill="' + c.a + '"/>' +
        '<path d="M10 62C10 34 30 16 50 16s40 18 40 46Z" fill="none" stroke="' + c.b + '" stroke-width="1.6" opacity=".55"/>' +
        '<circle cx="36" cy="42" r="6" fill="' + c.c + '"/>' +
        '<circle cx="60" cy="34" r="5" fill="' + c.c + '"/>' +
        '<circle cx="72" cy="50" r="4" fill="' + c.c + '"/>';
    }
  },

  kedi: {
    ad: 'Kedi', kat: 'Hayvan', vb: [100, 120], en: 108, anim: 'nefes', renk: '#ffb877',
    ic: function (c) {
      return '<path d="M74 108c14-6 16-20 8-24-6-3-10 2-8 8" fill="none" stroke="' + c.b + '" stroke-width="7" stroke-linecap="round"/>' +
        '<ellipse cx="50" cy="88" rx="30" ry="24" fill="' + c.a + '"/>' +
        '<ellipse cx="50" cy="92" rx="18" ry="16" fill="' + c.c + '" opacity=".8"/>' +
        '<circle cx="50" cy="44" r="26" fill="' + c.a + '"/>' +
        '<path d="M28 26 22 6l16 12Z" fill="' + c.a + '"/>' +
        '<path d="M72 26 78 6 62 18Z" fill="' + c.a + '"/>' +
        '<path d="M28 24 25 12l10 8Z" fill="' + c.c + '" opacity=".85"/>' +
        '<path d="M72 24 75 12 65 20Z" fill="' + c.c + '" opacity=".85"/>' +
        '<circle cx="40" cy="42" r="3.4" fill="' + c.d + '"/>' +
        '<circle cx="60" cy="42" r="3.4" fill="' + c.d + '"/>' +
        '<path d="M50 52l-4 4h8Z" fill="' + c.d + '"/>' +
        '<path d="M50 56c0 4 5 5 7 2M50 56c0 4-5 5-7 2" stroke="' + c.d + '" stroke-width="1.4" fill="none" opacity=".7"/>' +
        '<path d="M30 48h-12M30 53l-12 4M70 48h12M70 53l12 4" stroke="' + c.d + '" stroke-width="1.2" opacity=".55"/>';
    }
  },

  kopek: {
    ad: 'Köpek', kat: 'Hayvan', vb: [120, 110], en: 128, anim: 'nefes', renk: '#e0b083',
    ic: function (c) {
      return '<path d="M92 84c14-4 18-16 10-20" fill="none" stroke="' + c.b + '" stroke-width="7" stroke-linecap="round"/>' +
        '<ellipse cx="56" cy="76" rx="34" ry="24" fill="' + c.a + '"/>' +
        '<rect x="34" y="92" width="9" height="16" rx="4" fill="' + c.b + '"/>' +
        '<rect x="70" y="92" width="9" height="16" rx="4" fill="' + c.b + '"/>' +
        '<circle cx="34" cy="46" r="22" fill="' + c.a + '"/>' +
        '<ellipse cx="18" cy="50" rx="9" ry="15" fill="' + c.b + '"/>' +
        '<ellipse cx="34" cy="62" rx="14" ry="12" fill="' + c.c + '"/>' +
        '<circle cx="28" cy="42" r="3.2" fill="' + c.d + '"/>' +
        '<circle cx="44" cy="44" r="3.2" fill="' + c.d + '"/>' +
        '<ellipse cx="34" cy="58" rx="5" ry="4" fill="' + c.d + '"/>' +
        '<path d="M34 62c0 4-5 5-7 2M34 62c0 4 5 5 7 2" stroke="' + c.d + '" stroke-width="1.3" fill="none" opacity=".7"/>';
    }
  },

  tavsan: {
    ad: 'Tavşan', kat: 'Hayvan', vb: [90, 130], en: 96, anim: 'nefes', renk: '#f7d6e6',
    ic: function (c) {
      return '<ellipse cx="46" cy="100" rx="28" ry="24" fill="' + c.a + '"/>' +
        '<circle cx="46" cy="56" r="22" fill="' + c.a + '"/>' +
        '<ellipse cx="34" cy="24" rx="8" ry="24" fill="' + c.a + '" transform="rotate(-8 34 24)"/>' +
        '<ellipse cx="58" cy="24" rx="8" ry="24" fill="' + c.a + '" transform="rotate(8 58 24)"/>' +
        '<ellipse cx="34" cy="26" rx="4" ry="17" fill="' + c.c + '" transform="rotate(-8 34 26)"/>' +
        '<ellipse cx="58" cy="26" rx="4" ry="17" fill="' + c.c + '" transform="rotate(8 58 26)"/>' +
        '<circle cx="39" cy="54" r="3" fill="' + c.d + '"/>' +
        '<circle cx="53" cy="54" r="3" fill="' + c.d + '"/>' +
        '<path d="M46 62l-3 3h6Z" fill="' + c.b + '"/>' +
        '<circle cx="70" cy="104" r="8" fill="' + c.c + '"/>';
    }
  },

  balon: {
    ad: 'Balon', kat: 'Süs', vb: [80, 140], en: 84, anim: 'suzul', renk: '#ff9ec4',
    ic: function (c) {
      return '<path d="M40 96c-16-6-26-22-26-40C14 34 26 12 40 12s26 22 26 44c0 18-10 34-26 40Z" fill="' + c.a + '"/>' +
        '<path d="M40 96c-16-6-26-22-26-40C14 34 26 12 40 12" fill="' + c.c + '" opacity=".45"/>' +
        '<path d="M40 96l-4 8h8Z" fill="' + c.b + '"/>' +
        '<path d="M40 104c6 6-6 10 0 16" stroke="' + c.d + '" stroke-width="1.6" fill="none" opacity=".6"/>' +
        '<rect x="30" y="120" width="20" height="14" rx="4" fill="' + c.b + '"/>';
    }
  },

  yeldegirmeni: {
    ad: 'Yel Değirmeni', kat: 'Yapı', vb: [120, 160], en: 160, anim: 'yok', renk: '#ffd6a8',
    ic: function (c) {
      return '<path d="M48 156 52 74h16l4 82Z" fill="' + c.a + '"/>' +
        '<path d="M48 156 52 74h16l4 82Z" fill="none" stroke="' + c.d + '" stroke-width="1.2" opacity=".35"/>' +
        '<path d="M46 76 60 44 74 76Z" fill="' + c.b + '"/>' +
        '<rect x="56" y="118" width="10" height="20" rx="3" fill="' + c.d + '" opacity=".7"/>' +
        '<g class="ic-don-yavas" style="transform-origin:60px 74px">' +
        '<rect x="58" y="26" width="4" height="48" rx="2" fill="' + c.b + '"/>' +
        '<rect x="58" y="26" width="26" height="4" rx="2" fill="' + c.b + '" transform="rotate(90 60 74)" opacity="0"/>' +
        '<rect x="36" y="72" width="48" height="4" rx="2" fill="' + c.b + '"/>' +
        '<rect x="58" y="72" width="4" height="48" rx="2" fill="' + c.b + '"/>' +
        '<rect x="36" y="72" width="48" height="4" rx="2" fill="' + c.c + '" opacity=".5"/>' +
        '</g>' +
        '<circle cx="60" cy="74" r="4" fill="' + c.d + '"/>';
    }
  },

  kopru: {
    ad: 'Köprü', kat: 'Yapı', vb: [200, 100], en: 230, anim: 'yok', renk: '#e8c9a0',
    ic: function (c) {
      return '<path d="M4 52h192v10H4Z" fill="' + c.b + '"/>' +
        '<path d="M4 96c0-30 42-50 96-50s96 20 96 50Z" fill="' + c.a + '"/>' +
        '<path d="M4 96c0-30 42-50 96-50s96 20 96 50" fill="none" stroke="' + c.d + '" stroke-width="1.6" opacity=".4"/>' +
        '<path d="M34 62 34 40M62 54 62 34M100 50 100 30M138 54 138 34M166 62 166 40" stroke="' + c.b + '" stroke-width="3" stroke-linecap="round"/>' +
        '<rect x="4" y="34" width="192" height="7" rx="3.5" fill="' + c.b + '"/>';
    }
  },

  cit: {
    ad: 'Çit', kat: 'Yapı', vb: [180, 100], en: 178, anim: 'yok', renk: '#ffe0b5',
    ic: function (c) {
      var p = '';
      for (var i = 0; i < 6; i++) {
        var x = 6 + i * 30;
        p += '<path d="M' + x + ' 96V30l8-14 8 14v66Z" fill="' + c.a + '" stroke="' + c.d + '" stroke-width="1" opacity=".95"/>';
      }
      return p +
        '<rect x="2" y="46" width="176" height="9" rx="4" fill="' + c.b + '"/>' +
        '<rect x="2" y="72" width="176" height="9" rx="4" fill="' + c.b + '"/>';
    }
  },

  tas: {
    ad: 'Taş', kat: 'Manzara', vb: [100, 70], en: 96, anim: 'yok', renk: '#cfd6e0',
    ic: function (c) {
      return '<path d="M12 64C8 46 22 24 44 20c22-4 44 8 46 26 2 14-10 24-30 24S16 76 12 64Z" fill="' + c.b + '"/>' +
        '<path d="M16 60C13 45 25 27 44 24c20-3 38 8 40 24 2 12-9 20-27 20S19 70 16 60Z" fill="' + c.a + '"/>' +
        '<path d="M34 40c6-5 14-6 20-3" stroke="' + c.c + '" stroke-width="3" fill="none" stroke-linecap="round" opacity=".8"/>';
    }
  },

  yildiz: {
    ad: 'Yıldız', kat: 'Gökyüzü', vb: [100, 100], en: 84, anim: 'nefes', renk: '#ffe07a',
    ic: function (c) {
      return '<path d="M50 8 62 38 94 40 69 61 77 92 50 74 23 92 31 61 6 40 38 38Z" fill="' + c.a + '" stroke="' + c.b + '" stroke-width="1.6" stroke-linejoin="round"/>' +
        '<path d="M50 22 57 40 76 41 61 54 66 72 50 62 34 72 39 54 24 41 43 40Z" fill="' + c.c + '" opacity=".55"/>';
    }
  },

  ay: {
    ad: 'Ay', kat: 'Gökyüzü', vb: [100, 100], en: 84, anim: 'suzul', renk: '#fff0b8',
    ic: function (c) {
      return '<path d="M66 12a40 40 0 1 0 0 76 32 32 0 1 1 0-76Z" fill="' + c.a + '"/>' +
        '<path d="M66 12a40 40 0 1 0 0 76 32 32 0 1 1 0-76Z" fill="none" stroke="' + c.b + '" stroke-width="1.6" opacity=".5"/>' +
        '<circle cx="42" cy="34" r="5" fill="' + c.b + '" opacity=".35"/>' +
        '<circle cx="38" cy="60" r="7" fill="' + c.b + '" opacity=".3"/>';
    }
  },

  gokkusagi: {
    ad: 'Gökkuşağı', kat: 'Gökyüzü', vb: [200, 110], en: 270, anim: 'yok', renk: '#ffa8c4',
    ic: function (c) {
      var renkler = [c.a, c.b, '#ffd76a', '#9fe0a8', '#a8c8f5'];
      var s = '';
      for (var i = 0; i < renkler.length; i++) {
        var r = 96 - i * 11;
        s += '<path d="M' + (100 - r) + ' 108a' + r + ' ' + r + ' 0 0 1 ' + (2 * r) + ' 0" fill="none" stroke="' + renkler[i] + '" stroke-width="11" stroke-linecap="round"/>';
      }
      return s;
    }
  },

  tekne: {
    ad: 'Tekne', kat: 'Süs', vb: [140, 120], en: 148, anim: 'nefes', renk: '#8fc6e8',
    ic: function (c) {
      return '<path d="M20 88h100l-14 26H34Z" fill="' + c.a + '"/>' +
        '<path d="M20 88h100l-14 26H34Z" fill="none" stroke="' + c.d + '" stroke-width="1.4" opacity=".35"/>' +
        '<rect x="66" y="16" width="4" height="72" rx="2" fill="' + c.d + '"/>' +
        '<path d="M70 20 70 82 116 82Z" fill="' + c.c + '"/>' +
        '<path d="M64 26 64 82 30 82Z" fill="' + c.b + '"/>' +
        '<path d="M20 88h100" stroke="' + c.c + '" stroke-width="4"/>';
    }
  },

  seker: {
    ad: 'Şeker', kat: 'Süs', vb: [120, 120], en: 92, anim: 'suzul', renk: '#ffb3d1',
    ic: function (c) {
      return '<path d="M36 40 14 26l6 26-6 26 22-14Z" fill="' + c.c + '"/>' +
        '<path d="M84 40l22-14-6 26 6 26-22-14Z" fill="' + c.c + '"/>' +
        '<circle cx="60" cy="52" r="32" fill="' + c.a + '"/>' +
        '<circle cx="60" cy="52" r="32" fill="none" stroke="' + c.b + '" stroke-width="1.6" opacity=".5"/>' +
        '<path d="M32 52a28 28 0 0 1 56 0" fill="none" stroke="' + c.c + '" stroke-width="6" opacity=".8"/>' +
        '<path d="M36 66a28 28 0 0 0 48 0" fill="none" stroke="' + c.b + '" stroke-width="6" opacity=".55"/>';
    }
  },

  bina: {
    ad: 'Bina', kat: 'Yapı', vb: [100, 160], en: 128, anim: 'yok', renk: '#b7c9f0',
    ic: function (c) {
      var w = '';
      for (var r = 0; r < 4; r++) {
        for (var k = 0; k < 3; k++) {
          w += '<rect x="' + (18 + k * 24) + '" y="' + (46 + r * 24) + '" width="14" height="14" rx="3" fill="' + c.c + '"/>';
        }
      }
      return '<rect x="12" y="38" width="76" height="118" rx="6" fill="' + c.a + '"/>' +
        '<rect x="12" y="38" width="76" height="118" rx="6" fill="none" stroke="' + c.d + '" stroke-width="1.2" opacity=".3"/>' +
        '<path d="M8 40 50 12 92 40Z" fill="' + c.b + '"/>' + w +
        '<rect x="40" y="128" width="20" height="28" rx="3" fill="' + c.d + '" opacity=".7"/>';
    }
  },

  gol: {
    ad: 'Göl', kat: 'Manzara', vb: [200, 80], en: 250, anim: 'yok', renk: '#8fd4f0',
    ic: function (c) {
      return '<ellipse cx="100" cy="46" rx="94" ry="30" fill="' + c.b + '" opacity=".8"/>' +
        '<ellipse cx="100" cy="44" rx="88" ry="26" fill="' + c.a + '"/>' +
        '<path d="M46 40c14-4 24 4 38 0M108 52c14-4 24 4 38 0M70 58c12-3 20 3 32 0" stroke="' + c.c + '" stroke-width="3" fill="none" stroke-linecap="round" opacity=".85"/>';
    }
  },

  kaktus: {
    ad: 'Kaktüs', kat: 'Doğa', vb: [90, 130], en: 100, anim: 'nefes', renk: '#7fd6b0',
    ic: function (c) {
      return '<rect x="34" y="24" width="24" height="100" rx="12" fill="' + c.a + '"/>' +
        '<path d="M34 72c-12 0-18-8-18-20v-8c0-4 6-4 6 0v8c0 8 4 12 12 12Z" fill="' + c.a + '"/>' +
        '<path d="M58 58c12 0 18-8 18-18v-6c0-4-6-4-6 0v6c0 6-4 10-12 10Z" fill="' + c.a + '"/>' +
        '<path d="M46 34v84" stroke="' + c.c + '" stroke-width="3" opacity=".6"/>' +
        '<path d="M26 46v-8M30 54v-6M62 40v-6M66 30v-6" stroke="' + c.d + '" stroke-width="2" stroke-linecap="round" opacity=".5"/>' +
        '<circle cx="46" cy="24" r="5" fill="' + c.c + '"/>';
    }
  }
};

/* viewBox sarmalayıcı — DOM ve dışa aktarma aynı metni kullanır */
function tamSvg(tip, c) {
  return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + tip.vb[0] + ' ' + tip.vb[1] +
    '" width="' + tip.vb[0] + '" height="' + tip.vb[1] + '" preserveAspectRatio="xMidYMid meet" overflow="visible">' +
    tip.ic(c) + '</svg>';
}

function tipBoyut(tip) {
  return [tip.en, Math.round(tip.en * tip.vb[1] / tip.vb[0])];
}

var PALET_RENKLERI = [
  '#ff9ec4', '#ff8a72', '#ffd76a', '#ffe9a8', '#9adfa0', '#7fd6b0',
  '#8fd4f0', '#7fb4ff', '#c9a7ff', '#ffb3d1', '#e0b083', '#f7d6e6',
  '#b7c9f0', '#ffffff', '#cfd6e0', '#e8c9a0'
];
