/* Numex Renk Stüdyosu — renk matematiği (DOM'suz, saf fonksiyonlar) */
(function (kok) {
  "use strict";

  function kis(x, a, b) { return Math.min(b, Math.max(a, x)); }
  function yuvarla(x) { return Math.round(x); }
  function mod(n, m) { return ((n % m) + m) % m; }

  function hexToRgb(hex) {
    if (typeof hex !== "string") return { r: 0, g: 0, b: 0 };
    var h = hex.trim().replace(/^#/, "");
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    if (!/^[0-9a-fA-F]{6}$/.test(h)) return { r: 0, g: 0, b: 0 };
    return {
      r: parseInt(h.slice(0, 2), 16),
      g: parseInt(h.slice(2, 4), 16),
      b: parseInt(h.slice(4, 6), 16)
    };
  }

  function rgbToHex(r, g, b) {
    r = kis(yuvarla(r), 0, 255); g = kis(yuvarla(g), 0, 255); b = kis(yuvarla(b), 0, 255);
    return "#" + [r, g, b].map(function (v) {
      return v.toString(16).padStart(2, "0");
    }).join("");
  }

  function rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    var max = Math.max(r, g, b), min = Math.min(r, g, b);
    var h = 0, s = 0, l = (max + min) / 2, d = max - min;
    if (d !== 0) {
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      if (max === r) h = ((g - b) / d) % 6;
      else if (max === g) h = (b - r) / d + 2;
      else h = (r - g) / d + 4;
      h *= 60;
      if (h < 0) h += 360;
    }
    return { h: h, s: s * 100, l: l * 100 };
  }

  function hue2rgb(p, q, t) {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  }

  function hslToRgb(h, s, l) {
    h = mod(h, 360) / 360; s = kis(s, 0, 100) / 100; l = kis(l, 0, 100) / 100;
    var r, g, b;
    if (s === 0) { r = g = b = l; }
    else {
      var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      var p = 2 * l - q;
      r = hue2rgb(p, q, h + 1 / 3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1 / 3);
    }
    return { r: yuvarla(r * 255), g: yuvarla(g * 255), b: yuvarla(b * 255) };
  }

  function rgbToHsv(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    var max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
    var h = 0;
    if (d !== 0) {
      if (max === r) h = ((g - b) / d) % 6;
      else if (max === g) h = (b - r) / d + 2;
      else h = (r - g) / d + 4;
      h *= 60;
      if (h < 0) h += 360;
    }
    return { h: h, s: max === 0 ? 0 : (d / max) * 100, v: max * 100 };
  }

  function hsvToRgb(h, s, v) {
    h = mod(h, 360); s = kis(s, 0, 100) / 100; v = kis(v, 0, 100) / 100;
    var c = v * s, x = c * (1 - Math.abs(((h / 60) % 2) - 1)), m = v - c;
    var rr = 0, gg = 0, bb = 0;
    if (h < 60) { rr = c; gg = x; }
    else if (h < 120) { rr = x; gg = c; }
    else if (h < 180) { gg = c; bb = x; }
    else if (h < 240) { gg = x; bb = c; }
    else if (h < 300) { rr = x; bb = c; }
    else { rr = c; bb = x; }
    return { r: yuvarla((rr + m) * 255), g: yuvarla((gg + m) * 255), b: yuvarla((bb + m) * 255) };
  }

  function hexToHsl(hex) { var c = hexToRgb(hex); return rgbToHsl(c.r, c.g, c.b); }
  function hslToHex(h, s, l) { var c = hslToRgb(h, s, l); return rgbToHex(c.r, c.g, c.b); }
  function hexToHsv(hex) { var c = hexToRgb(hex); return rgbToHsv(c.r, c.g, c.b); }
  function hsvToHex(h, s, v) { var c = hsvToRgb(h, s, v); return rgbToHex(c.r, c.g, c.b); }

  function karistirRgb(c1, c2, t) {
    var a = hexToRgb(c1), b = hexToRgb(c2);
    t = kis(t, 0, 1);
    return rgbToHex(a.r + (b.r - a.r) * t, a.g + (b.g - a.g) * t, a.b + (b.b - a.b) * t);
  }

  function karistirHsl(c1, c2, t) {
    var a = hexToHsl(c1), b = hexToHsl(c2);
    t = kis(t, 0, 1);
    var dh = b.h - a.h;
    if (dh > 180) dh -= 360;
    if (dh < -180) dh += 360;
    return hslToHex(a.h + dh * t, a.s + (b.s - a.s) * t, a.l + (b.l - a.l) * t);
  }

  function parlaklik(r, g, b) {
    function kanal(c) {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    }
    return 0.2126 * kanal(r) + 0.7152 * kanal(g) + 0.0722 * kanal(b);
  }

  function kontrastOrani(hex1, hex2) {
    var a = hexToRgb(hex1), b = hexToRgb(hex2);
    var l1 = parlaklik(a.r, a.g, a.b), l2 = parlaklik(b.r, b.g, b.b);
    var acik = Math.max(l1, l2), koyu = Math.min(l1, l2);
    return (acik + 0.05) / (koyu + 0.05);
  }

  function wcagSeviye(oran) {
    return { aa: oran >= 4.5, aaa: oran >= 7, aaBuyuk: oran >= 3 };
  }

  function tamamlayici(hex) {
    var h = hexToHsl(hex);
    return hslToHex(h.h + 180, h.s, h.l);
  }

  function analog(hex, adim) {
    adim = typeof adim === "number" ? adim : 30;
    var h = hexToHsl(hex);
    return [hslToHex(h.h - adim, h.s, h.l), hex, hslToHex(h.h + adim, h.s, h.l)];
  }

  function uclu(hex) {
    var h = hexToHsl(hex);
    return [hex, hslToHex(h.h + 120, h.s, h.l), hslToHex(h.h + 240, h.s, h.l)];
  }

  function dortlu(hex) {
    var h = hexToHsl(hex);
    return [hex, hslToHex(h.h + 90, h.s, h.l), hslToHex(h.h + 180, h.s, h.l), hslToHex(h.h + 270, h.s, h.l)];
  }

  function monokrom(hex, adet) {
    adet = adet || 5;
    var h = hexToHsl(hex), out = [];
    for (var i = 0; i < adet; i++) {
      var oran = adet === 1 ? 0.5 : i / (adet - 1);
      out.push(hslToHex(h.h, h.s, 92 - oran * 68));
    }
    return out;
  }

  function rastgelePalet() {
    var taban = Math.random() * 360;
    var out = [];
    for (var i = 0; i < 5; i++) {
      var h = taban + i * (20 + Math.random() * 55);
      var s = 60 + Math.random() * 35;
      var l = 32 + Math.random() * 46;
      out.push(hslToHex(h, s, l));
    }
    return out;
  }

  function metinRengi(hex) {
    return kontrastOrani(hex, "#ffffff") >= kontrastOrani(hex, "#111111") ? "#ffffff" : "#111111";
  }

  var api = {
    hexToRgb: hexToRgb, rgbToHex: rgbToHex, rgbToHsl: rgbToHsl, hslToRgb: hslToRgb,
    rgbToHsv: rgbToHsv, hsvToRgb: hsvToRgb, hexToHsl: hexToHsl, hslToHex: hslToHex,
    hexToHsv: hexToHsv, hsvToHex: hsvToHex, karistirRgb: karistirRgb, karistirHsl: karistirHsl,
    parlaklik: parlaklik, kontrastOrani: kontrastOrani, wcagSeviye: wcagSeviye,
    tamamlayici: tamamlayici, analog: analog, uclu: uclu, dortlu: dortlu,
    monokrom: monokrom, rastgelePalet: rastgelePalet, metinRengi: metinRengi,
    kis: kis, mod: mod
  };

  kok.RenkMotoru = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
