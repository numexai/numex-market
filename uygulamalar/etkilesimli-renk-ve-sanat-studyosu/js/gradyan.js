/* Numex Renk Stüdyosu — gradyan modeli, CSS/SVG üretimi */
(function (kok) {
  "use strict";

  function olustur() {
    return [
      { renk: "#ff6b6b", konum: 0 },
      { renk: "#feca57", konum: 25 },
      { renk: "#48dbfb", konum: 50 },
      { renk: "#1dd1a1", konum: 75 },
      { renk: "#5f27cd", konum: 100 }
    ];
  }

  function kis(x, a, b) { return Math.min(b, Math.max(a, x)); }

  function sirala(duraklar) {
    return duraklar.slice().sort(function (a, b) { return a.konum - b.konum; });
  }

  function durakEkle(duraklar, durak) {
    var yeni = duraklar.slice();
    yeni.push({ renk: durak.renk || "#ffffff", konum: kis(typeof durak.konum === "number" ? durak.konum : 50, 0, 100) });
    return sirala(yeni);
  }

  function durakSil(duraklar, indeks) {
    if (duraklar.length <= 2) return duraklar.slice();
    return duraklar.filter(function (_, i) { return i !== indeks; });
  }

  function durakTasi(duraklar, indeks, yeniKonum) {
    var kopya = duraklar.map(function (d) { return { renk: d.renk, konum: d.konum }; });
    if (indeks < 0 || indeks >= kopya.length) return kopya;
    kopya[indeks].konum = Math.round(kis(Number(yeniKonum) || 0, 0, 100) * 10) / 10;
    return kopya;
  }

  function durakRenk(duraklar, indeks, renk) {
    var kopya = duraklar.map(function (d) { return { renk: d.renk, konum: d.konum }; });
    if (indeks >= 0 && indeks < kopya.length) kopya[indeks].renk = renk;
    return kopya;
  }

  function renkDuraklari(duraklar) {
    return sirala(duraklar).map(function (d) { return d.renk + " " + d.konum + "%"; }).join(", ");
  }

  function cssUret(duraklar, tip, aci) {
    tip = tip || "linear";
    aci = typeof aci === "number" ? aci : 135;
    var liste = renkDuraklari(duraklar);
    if (tip === "radial") return "radial-gradient(circle at 50% 50%, " + liste + ")";
    if (tip === "conic") return "conic-gradient(from " + aci + "deg at 50% 50%, " + liste + ")";
    return "linear-gradient(" + aci + "deg, " + liste + ")";
  }

  function onizlemeStili(duraklar, tip, aci) {
    return { backgroundImage: cssUret(duraklar, tip, aci) };
  }

  function aciDegistir(tip, aci) {
    var yeni = Number(aci);
    if (isNaN(yeni)) yeni = 0;
    if (yeni < 0) yeni += 360;
    return yeni % 360;
  }

  function polarNokta(cx, cy, aciDeg, uzaklik) {
    var rad = (aciDeg - 90) * Math.PI / 180;
    return { x: cx + Math.cos(rad) * uzaklik, y: cy + Math.sin(rad) * uzaklik };
  }

  function svgUret(duraklar, tip, aci, w, h) {
    tip = tip || "linear";
    aci = aciDeg(aci);
    w = w || 800; h = h || 500;
    var sirali = sirala(duraklar);
    var bas = "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"" + w + "\" height=\"" + h + "\" viewBox=\"0 0 " + w + " " + h + "\">";
    var defs = "<defs>";
    if (tip === "radial") {
      defs += "<radialGradient id=\"g\" cx=\"50%\" cy=\"50%\" r=\"70%\">" + durakSvg(sirali) + "</radialGradient>";
    } else if (tip === "conic") {
      /* SVG'de conic yok: eşit dilimler hâlinde <path> olarak çiziyoruz */
      defs += "";
    } else {
      var a = aciDeg(aci), p1 = polarNokta(w / 2, h / 2, a, Math.max(w, h) / 2), p2 = polarNokta(w / 2, h / 2, a + 180, Math.max(w, h) / 2);
      defs += "<linearGradient id=\"g\" gradientUnits=\"userSpaceOnUse\" x1=\"" + p1.x.toFixed(1) + "\" y1=\"" + p1.y.toFixed(1) + "\" x2=\"" + p2.x.toFixed(1) + "\" y2=\"" + p2.y.toFixed(1) + "\">" + durakSvg(sirali) + "</linearGradient>";
    }
    defs += "</defs>";

    var govde;
    if (tip === "conic") {
      var dilim = [];
      var adet = sirali.length;
      var cx = w / 2, cy = h / 2, yari = Math.max(w, h) * 0.75;
      for (var i = 0; i < adet; i++) {
        var d0 = (i / adet) * 360 + aci, d1 = ((i + 1) / adet) * 360 + aci;
        var s0 = polarNokta(cx, cy, d0, yari), s1 = polarNokta(cx, cy, d1, yari);
        dilim.push("<path d=\"M" + cx.toFixed(1) + " " + cy.toFixed(1) + " L" + s0.x.toFixed(1) + " " + s0.y.toFixed(1) +
          " A" + yari.toFixed(1) + " " + yari.toFixed(1) + " 0 0 1 " + s1.x.toFixed(1) + " " + s1.y.toFixed(1) + " Z\" fill=\"" +
          sirali[i].renk + "\"/>");
      }
      govde = dilim.join("");
    } else {
      govde = "<rect width=\"" + w + "\" height=\"" + h + "\" fill=\"url(#g)\"/>";
    }
    return bas + defs + govde + "</svg>";
  }

  function aciDeg(aci) {
    var n = Number(aci);
    return isNaN(n) ? 135 : n;
  }

  function durakSvg(sirali) {
    return sirali.map(function (d) {
      return "<stop offset=\"" + (d.konum / 100).toFixed(3) + "\" stop-color=\"" + d.renk + "\"/>";
    }).join("");
  }

  var api = {
    olustur: olustur, durakEkle: durakEkle, durakSil: durakSil, durakTasi: durakTasi,
    durakRenk: durakRenk, sirala: sirala, cssUret: cssUret, svgUret: svgUret,
    onizlemeStili: onizlemeStili, aciDegistir: aciDegistir, renkDuraklari: renkDuraklari
  };
  kok.Gradyan = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
