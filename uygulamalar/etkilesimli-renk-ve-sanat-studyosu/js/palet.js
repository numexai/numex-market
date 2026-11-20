/* Numex Renk Stüdyosu — palet üretimi ve uyum kuralları */
(function (kok) {
  "use strict";
  var R = kok.RenkMotoru;

  var KURALLAR = [
    { id: "analog", ad: "Analog" },
    { id: "tamamlayici", ad: "Tamamlayıcı" },
    { id: "uclu", ad: "Üçlü" },
    { id: "dortlu", ad: "Dörtlü" },
    { id: "monokrom", ad: "Monokrom" },
    { id: "rastgele", ad: "Rastgele" }
  ];

  // NUMEX-DÜZELTME (2026-11-20): Kök neden: uret'e tek hex de geçilse dizi de geçilse tabanHex doğrudan palete ve hexToHsl'e veriliyordu; dizi gelince paletin ilk elemanı dizi, ikinci rengi #000000 oluyordu (planlanan imza hex dizisi kabul ediyordu). Artık giriş normalize ediliyor: dizi ise ilk geçerli eleman alınıyor, hex dizesi normalize ediliyor, geçersizse varsayılana düşülüyor.
  /* giriş tek hex ("#abc123") ya da hex dizisi olabilir → tek geçerli hex döner */
  function tekHex(girdi) {
    var aday = girdi;
    if (Object.prototype.toString.call(girdi) === "[object Array]") aday = girdi[0];
    if (typeof aday !== "string") return "#ff6b6b";
    aday = aday.trim();
    if (aday.charAt(0) !== "#") aday = "#" + aday;
    if (!/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(aday)) return "#ff6b6b";
    if (aday.length === 4) {
      aday = "#" + aday.charAt(1) + aday.charAt(1) + aday.charAt(2) + aday.charAt(2) + aday.charAt(3) + aday.charAt(3);
    }
    return aday.toLowerCase();
  }

  function uret(kural, tabanHex, adet) {
    tabanHex = tekHex(tabanHex);
    adet = adet || 5;
    var h = R.hexToHsl(tabanHex);
    var renkler;
    switch (kural) {
      case "tamamlayici":
        renkler = [tabanHex, R.hslToHex(h.h + 180, h.s, h.l)];
        renkler.push(R.hslToHex(h.h + 180, h.s, R.kis(h.l + 18, 10, 92)));
        renkler.push(R.hslToHex(h.h, h.s, R.kis(h.l - 20, 8, 92)));
        renkler.push(R.hslToHex(h.h + 180, R.kis(h.s - 25, 10, 100), R.kis(h.l + 30, 10, 94)));
        break;
      case "analog":
        renkler = [];
        for (var i = 0; i < 5; i++) {
          var fark = (i - 2) * 26;
          renkler.push(R.hslToHex(h.h + fark, h.s, R.kis(h.l + (i - 2) * 7, 12, 90)));
        }
        break;
      case "uclu":
        renkler = [tabanHex,
          R.hslToHex(h.h + 120, h.s, h.l),
          R.hslToHex(h.h + 240, h.s, h.l),
          R.hslToHex(h.h + 120, R.kis(h.s - 20, 10, 100), R.kis(h.l + 18, 10, 94)),
          R.hslToHex(h.h + 240, R.kis(h.s - 20, 10, 100), R.kis(h.l + 18, 10, 94))];
        break;
      case "dortlu":
        renkler = [tabanHex,
          R.hslToHex(h.h + 90, h.s, h.l),
          R.hslToHex(h.h + 180, h.s, h.l),
          R.hslToHex(h.h + 270, h.s, h.l),
          R.hslToHex(h.h + 45, R.kis(h.s - 15, 10, 100), R.kis(h.l + 22, 10, 94))];
        break;
      case "monokrom":
        renkler = R.monokrom(tabanHex, 5);
        break;
      case "rastgele":
      default:
        renkler = R.rastgelePalet();
        break;
    }
    while (renkler.length < adet) renkler.push(R.rastgelePalet()[0]);
    renkler = renkler.slice(0, Math.max(adet, 2));
    return { kural: kural, renkler: renkler };
  }

  function yenidenUret(palet, kilitler, kural, tabanHex) {
    kilitler = kilitler || [];
    var yeni = uret(kural || "rastgele", tabanHex || palet[0], palet.length).renkler;
    return palet.map(function (eski, i) {
      return kilitler[i] ? eski : yeni[i];
    });
  }

  function duzenle(palet, indeks, yeniHex) {
    var kopya = palet.slice();
    if (indeks >= 0 && indeks < kopya.length) kopya[indeks] = yeniHex;
    return kopya;
  }

  function karistirmaKarsilastir(c1, c2) {
    var rgbAdim = [c1, R.karistirRgb(c1, c2, 0.5), c2];
    var hslAdim = [c1, R.karistirHsl(c1, c2, 0.5), c2];
    return {
      rgb: R.karistirRgb(c1, c2, 0.5),
      hsl: R.karistirHsl(c1, c2, 0.5),
      rgbAdim: rgbAdim,
      hslAdim: hslAdim
    };
  }

  function cssDegiskenleri(palet) {
    return palet.map(function (renk, i) {
      return "--p" + (i + 1) + ":" + renk + ";";
    }).join("");
  }

  function kopyalaDegeri(palet) {
    return palet.join(", ");
  }

  var api = {
    KURALLAR: KURALLAR, uret: uret, yenidenUret: yenidenUret, duzenle: duzenle,
    karistirmaKarsilastir: karistirmaKarsilastir, cssDegiskenleri: cssDegiskenleri,
    kopyalaDegeri: kopyalaDegeri
  };
  kok.Palet = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
