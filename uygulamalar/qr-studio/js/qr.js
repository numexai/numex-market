/* Numex QR Studio — QR çekirdeği
 * Matris üretimi: gömülü qrcode paketi (standart, okunabilir çıktı).
 * Tasarım + vektörel SVG üretimi: bu dosya (kare / yuvarlatılmış / noktalı, gradyan, logo).
 * Veri hiçbir zaman sunucuya gitmez; her şey tarayıcıda üretilir.
 */
(function (kök) {
  "use strict";

  var QR = {};

  // Kütüphane vendor/qrcode-kernel.js ile bundle'a dahildir (module/require ortamı orada).
  function kutuphane() {
    var lib = kök.NumexQRKernel;
    if (!lib || typeof lib.create !== "function") {
      throw new Error("QR kütüphanesi yüklenemedi");
    }
    return lib;
  }

  /* ---------- Matris ---------- */

  QR.matrisUret = function (metin, hataSeviyesi) {
    // NUMEX-DÜZELTME (2026-10-28): Gömülü QR kütüphanesi eski addData/make API'sini değil create(veri, seçenekler)→{modules} API'sini sunuyor; matris bu yüzden üretilemiyordu (her içerik \"çok uzun\" hatasına düşüyordu).
    // Gömülü sürümde create(veri, {version, errorCorrectionLevel}) → {modules}
    var sembol = kutuphane().create(metin, { errorCorrectionLevel: hataSeviyesi || "M" });
    var moduller = sembol.modules;
    var boyut = moduller.size;
    var matris = [];
    for (var r = 0; r < boyut; r++) {
      var satir = [];
      for (var c = 0; c < boyut; c++) satir.push(moduller.get(r, c) ? 1 : 0);
      matris.push(satir);
    }
    return { boyut: boyut, matris: matris, surum: sembol.version };
  };

  /* ---------- Yardımcılar ---------- */

  function koseBulucuMu(r, c, boyut) {
    // Üç köşedeki 7x7 gözdesi (finder pattern) alanını kapsıyor mu?
    var sol = c < 7, sag = c >= boyut - 7;
    var ust = r < 7, alt = r >= boyut - 7;
    return (sol && ust) || (sag && ust) || (sol && alt);
  }

  // Hizalama deseni merkezleri (ISO 18004 Ek E; node-qrcode'un hesabıyla aynı). Sürüm = (boyut - 17) / 4.
  function hizalamaKoordinatlari(boyut) {
    var surum = (boyut - 17) / 4;
    if (surum < 2) return [];
    var adet = Math.floor(surum / 7) + 2;
    var aralik = boyut === 145 ? 26 : Math.ceil((boyut - 13) / (2 * adet - 2)) * 2;
    var konum = [boyut - 7];
    for (var i = 1; i < adet - 1; i++) konum[i] = konum[i - 1] - aralik;
    konum.push(6);
    return konum.reverse();
  }

  // Noktalı stilde kare kalması gereken yapı: zamanlama çizgileri (satır/sütun 6) ve hizalama desenleri.
  // Ölçüldü (bağımsız okuyucu, 3 içerik × 2 çözünürlük): bunlar da nokta olunca hiçbir çapta güvenilir okunmuyor,
  // kare kalınca çap 0.80–1.00 arası hepsi okunuyor.
  function yapiModuluMu(r, c, boyut, hizalama) {
    if (r === 6 || c === 6) return true;
    var son = hizalama.length - 1;
    for (var i = 0; i <= son; i++) {
      for (var j = 0; j <= son; j++) {
        if ((i === 0 && j === 0) || (i === 0 && j === son) || (i === son && j === 0)) continue; // gözdelerle çakışan üç köşe
        if (Math.abs(r - hizalama[i]) <= 2 && Math.abs(c - hizalama[j]) <= 2) return true;
      }
    }
    return false;
  }

  // Merkezi (x+0.5, y+0.5), çapı `cap` olan daire.
  function daireYol(x, y, cap) {
    var r = cap / 2;
    return "M" + (x + 0.5 - r) + " " + (y + 0.5) +
      "a" + r + " " + r + " 0 1 0 " + (2 * r) + " 0" +
      "a" + r + " " + r + " 0 1 0 " + (-2 * r) + " 0z";
  }

  function yuvarlakYol(x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    var sagAlt = r === 0 ? "" :
      "A" + r + " " + r + " 0 0 1 " + (x + w - r) + " " + (y + h) +
      "h" + (-(w - 2 * r)) +
      "A" + r + " " + r + " 0 0 1 " + x + " " + (y + h - r);
    return "M" + (x + r) + " " + y +
      "h" + (w - 2 * r) +
      "A" + r + " " + r + " 0 0 1 " + (x + w) + " " + (y + r) +
      "v" + (h - 2 * r) + sagAlt +
      "v" + (-(h - 2 * r)) +
      "A" + r + " " + r + " 0 0 1 " + (x + r) + " " + y + "z";
  }

  // Ardışık yatay siyah modülleri tek dikdörtgende birleştir (dosya boyutu küçülür).
  function satirlariBirlestir(matris, boyut) {
    var parcalar = [];
    for (var r = 0; r < boyut; r++) {
      var c = 0;
      while (c < boyut) {
        if (!matris[r][c]) { c++; continue; }
        var bas = c;
        while (c < boyut && matris[r][c]) c++;
        parcalar.push({ r: r, c: bas, uzunluk: c - bas });
      }
    }
    return parcalar;
  }

  function hexToRgb(hex) {
    var h = hex.replace("#", "").trim();
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    var n = parseInt(h, 16);
    if (isNaN(n)) n = 0;
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
  }

  /* ---------- Ana render ---------- */

  /**
   * secenekler:
   *  matris, boyut, still ("kare"|"yuvarlak"|"nokta"), renk1, renk2 (gradyan bitişi veya ""),
   *  gradyanYon ("capraz"|"dikey"|"yatay"), zeminRengi ("" = seffaf), kenar (modül cinsinden),
   *  logo (dataURL veya ""), logoBoyut (qr genişliğine oran, 0-0.3), boyutPx
   */
  QR.svgUret = function (secenekler) {
    var matris = secenekler.matris;
    var boyut = secenekler.boyut;
    var still = secenekler.still || "kare";
    var kenar = typeof secenekler.kenar === "number" ? secenekler.kenar : 4;
    var tuval = boyut + kenar * 2;
    var px = secenekler.boyutPx || 1024;

    var renk1 = secenekler.renk1 || "#111827";
    var renk2 = secenekler.renk2 || "";
    var gradyan = !!renk2 && renk2.toLowerCase() !== renk1.toLowerCase();

    var defs = [];
    var dolgu = renk1;

    if (gradyan) {
      var yon = secenekler.gradyanYon || "capraz";
      var c1 = "x1=\"0\" y1=\"0\" x2=\"1\" y2=\"0\"";
      if (yon === "capraz") c1 = "x1=\"0\" y1=\"0\" x2=\"1\" y2=\"1\"";
      if (yon === "dikey") c1 = "x1=\"0\" y1=\"0\" x2=\"0\" y2=\"1\"";
      defs.push(
        "<linearGradient id=\"ngrad\" " + c1 + ">" +
        "<stop offset=\"0\" stop-color=\"" + renk1 + "\"/>" +
        "<stop offset=\"1\" stop-color=\"" + renk2 + "\"/>" +
        "</linearGradient>"
      );
      dolgu = "url(#ngrad)";
    }

    var govde = [];

    if (still === "kare") {
      var parcalar = satirlariBirlestir(matris, boyut);
      var dikdortgenler = "";
      for (var i = 0; i < parcalar.length; i++) {
        var p = parcalar[i];
        dikdortgenler += "M" + (p.c + kenar) + " " + (p.r + kenar) + "h" + p.uzunluk + "v1h" + (-p.uzunluk) + "z";
      }
      govde.push("<path d=\"" + dikdortgenler + "\" fill=\"" + dolgu + "\"/>");
    } else {
      // Yuvarlatılmış ve noktalı stillerde gözdesi (finder) modülleri
      // ayrı çizilir ki köşelerdeki algılama deseni bozulmasın.
      var gozdeYolu = "";
      var modulYolu = "";
      var hizalama = hizalamaKoordinatlari(boyut);
      for (var r = 0; r < boyut; r++) {
        for (var c = 0; c < boyut; c++) {
          if (!matris[r][c]) continue;
          var x = c + kenar, y = r + kenar;
          if (koseBulucuMu(r, c, boyut) || (still === "nokta" && yapiModuluMu(r, c, boyut, hizalama))) {
            gozdeYolu += "M" + x + " " + y + "h1v1h-1z";
          } else if (still === "nokta") {
            // 31.10: eskiden yuvarlatılmış stille BİREBİR aynıydı (nokta okunmuyor sanılmıştı). Kök: zamanlama + hizalama
            // desenleri de nokta yapılıyordu; onlar kare kalınca gerçek daireler okunuyor (tools/olcum-nokta.js).
            modulYolu += daireYol(x, y, 0.86);
          } else {
            modulYolu += yuvarlakYol(x, y, 1, 1, 0.3);
          }
        }
      }
      // İki ayrı path: gözdesi keskin kare kalır (okunabilirlik), gövde seçilen stilde.
      govde.push("<path d=\"" + modulYolu + "\" fill=\"" + dolgu + "\"/>");
      govde.push("<path d=\"" + gozdeYolu + "\" fill=\"" + dolgu + "\" shape-rendering=\"crispEdges\"/>");
    }

    // Logo için zemin (logo varsa arkasına zemin renginde yuvarlak levha)
    var logoEtiketi = "";
    if (secenekler.logo) {
      var oran = typeof secenekler.logoBoyut === "number" ? secenekler.logoBoyut : 0.2;
      var logoKenar = tuval * oran;
      var levha = logoKenar * 1.14;
      var merkez = tuval / 2;
      var levhaRengi = secenekler.zeminRengi || "#ffffff";
      logoEtiketi =
        "<rect x=\"" + (merkez - levha / 2) + "\" y=\"" + (merkez - levha / 2) + "\" width=\"" + levha +
        "\" height=\"" + levha + "\" rx=\"" + (levha * 0.22) + "\" fill=\"" + levhaRengi + "\"/>" +
        "<image href=\"" + secenekler.logo + "\" x=\"" + (merkez - logoKenar / 2) + "\" y=\"" + (merkez - logoKenar / 2) +
        "\" width=\"" + logoKenar + "\" height=\"" + logoKenar +
        "\" preserveAspectRatio=\"xMidYMid meet\"/>";
    }

    var zemin = "";
    if (secenekler.zeminRengi) {
      zemin = "<rect width=\"" + tuval + "\" height=\"" + tuval + "\" fill=\"" + secenekler.zeminRengi + "\"/>";
    }

    var svg =
      "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n" +
      "<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" " +
      "width=\"" + px + "\" height=\"" + px + "\" viewBox=\"0 0 " + tuval + " " + tuval + "\" " +
      "shape-rendering=\"geometricPrecision\">" +
      (defs.length ? "<defs>" + defs.join("") + "</defs>" : "") +
      zemin +
      govde.join("") +
      logoEtiketi +
      "</svg>";

    return svg;
  };

  /* ---------- PNG üretimi ---------- */

  QR.pngUret = function (svg, boyutPx) {
    return new Promise(function (resolve, reject) {
      var blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
      var url = URL.createObjectURL(blob);
      var img = new Image();
      img.onload = function () {
        try {
          var canvas = document.createElement("canvas");
          canvas.width = boyutPx;
          canvas.height = boyutPx;
          var ctx = canvas.getContext("2d");
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = "high";
          ctx.drawImage(img, 0, 0, boyutPx, boyutPx);
          URL.revokeObjectURL(url);
          canvas.toBlob(function (b) {
            if (b) resolve(b);
            else reject(new Error("PNG oluşturulamadı"));
          }, "image/png");
        } catch (e) {
          URL.revokeObjectURL(url);
          reject(e);
        }
      };
      img.onerror = function () {
        URL.revokeObjectURL(url);
        reject(new Error("Görsel yüklenemedi"));
      };
      img.src = url;
    });
  };

  /* ---------- Doğrulama: üretilen matrisi geri oku ---------- */

  // Üretilen matrisin geçerli bir QR olduğunu (boyut + köşe gözdesi) hızlıca denetler.
  QR.matrisGecerliMi = function (matris, boyut) {
    if (!matris || boyut < 21) return false;
    // Sol üst gözde deseni: 7x7 çerçeve + 3x3 merkez
    for (var r = 0; r < 7; r++) {
      for (var c = 0; c < 7; c++) {
        var beklenen = (r === 0 || r === 6 || c === 0 || c === 6 || (r >= 2 && r <= 4 && c >= 2 && c <= 4)) ? 1 : 0;
        if (matris[r][c] !== beklenen) return false;
      }
    }
    return true;
  };

  /* ---------- Kontrast: kod rengi zeminden yeterince ayrışıyor mu ---------- */

  function goreliParlaklik(hex) {
    var h = String(hex || "").replace("#", "");
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    if (!/^[0-9a-fA-F]{6}$/.test(h)) return null;
    var k = [0, 2, 4].map(function (i) {
      var v = parseInt(h.slice(i, i + 2), 16) / 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * k[0] + 0.7152 * k[1] + 0.0722 * k[2];
  }

  // WCAG kontrast oranı (1–21). Okunamayan renk null döner.
  QR.kontrastOrani = function (renkA, renkB) {
    var a = goreliParlaklik(renkA), b = goreliParlaklik(renkB);
    if (a === null || b === null) return null;
    return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
  };

  // Ölçüldü (31.10, bağımsız okuyucu, 3 stil × 2 içerik × 330/512/1024 px, tek renk ve gradyan): oran ≥3.3 hepsi okundu,
  // 3.2 ve altında okumalar düşmeye başladı. Uyarı eşiği pay bırakarak 3.5.
  QR.KONTRAST_ESIK = 3.5;

  // Kodun en zayıf rengi ile zemin arasındaki oran. Şeffaf zemin beyaz üstünde varsayılır (baskıda en sık durum).
  QR.enDusukKontrast = function (renk1, renk2, zemin) {
    var z = zemin || "#ffffff";
    var oranlar = [renk1, renk2].filter(Boolean).map(function (r) { return QR.kontrastOrani(r, z); })
      .filter(function (o) { return o !== null; });
    return oranlar.length ? Math.min.apply(null, oranlar) : null;
  };

  // Hazır şablonlar — her biri KONTRAST_ESIK'in üstünde ve okuyucudan geçer (tools/dogrula.js hepsini sınar).
  // 31.10: Turuncu Alev'in açık ucu #f59e0b (oran 2.15) ve Orman'ınki #84cc16 (1.98) küçük boyutta kare stilde bile okunmuyordu.
  QR.SABLONLAR = [
    { ad: "Gece Mavisi", renk1: "#0f172a", renk2: "#2563eb", zemin: "#ffffff", still: "yuvarlak", yon: "capraz" },
    { ad: "Turuncu Alev", renk1: "#9a3412", renk2: "#ea580c", zemin: "#ffffff", still: "kare", yon: "dikey" },
    { ad: "Orman", renk1: "#065f46", renk2: "#4d7c0f", zemin: "#ffffff", still: "nokta", yon: "capraz" },
    { ad: "Mor Düş", renk1: "#4c1d95", renk2: "#db2777", zemin: "#ffffff", still: "yuvarlak", yon: "capraz" },
    { ad: "Baskı Siyahı", renk1: "#000000", renk2: "", zemin: "#ffffff", still: "kare", yon: "capraz" },
    { ad: "Şeffaf Zemin", renk1: "#111827", renk2: "", zemin: "", still: "nokta", yon: "capraz" }
  ];

  kök.NumexQR = QR;
})(typeof window !== "undefined" ? window : globalThis);
