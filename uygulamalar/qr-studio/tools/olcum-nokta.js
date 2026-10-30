/* Numex QR Studio — noktalı stil ölçümü (geliştirme aracı)
 * Aynı matrisi farklı modül geometrileriyle üretip hangisinin bağımsız okuyucudan geçtiğini ölçer.
 * Kullanım: node tools/olcum-nokta.js
 */
"use strict";

const fs = require("fs");
const path = require("path");
const { createCanvas, loadImage } = require("canvas");
const jsQR = require("jsqr");

const KOK = path.join(__dirname, "..");
global.window = global;
global.document = { currentScript: null };
for (const dosya of ["vendor/qrcode-kernel.js", "js/qr.js"]) {
  new Function("window", "document", fs.readFileSync(path.join(KOK, dosya), "utf8"))(global.window, global.document);
}
const NumexQR = global.NumexQR;

const METIN = "https://www.numexai.com.tr";

async function okuVeKaydet(svg, px) {
  const boyut = px || 1024;
  const img = await loadImage(Buffer.from(svg, "utf8"));
  const tuval = createCanvas(boyut, boyut);
  const ctx = tuval.getContext("2d");
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, boyut, boyut);
  ctx.drawImage(img, 0, 0, boyut, boyut);
  const veri = ctx.getImageData(0, 0, boyut, boyut);
  return { sonuc: jsQR(veri.data, boyut, boyut), tuval };
}

// qr.js dışında, ölçüm için özel geometri üreteci
function svgNoktaGeometri(matris, boyut, kenar, kapi, yuvarlak) {
  function yol(x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    if (r <= 0) return "M" + x + " " + y + "h" + w + "v" + h + "h" + (-w) + "z";
    return "M" + (x + r) + " " + y +
      "h" + (w - 2 * r) +
      "a" + r + " " + r + " 0 0 1 " + r + " " + r +
      "v" + (h - 2 * r) +
      "a" + r + " " + r + " 0 0 1 " + (-r) + " " + r +
      "h" + (-(w - 2 * r)) +
      "a" + r + " " + r + " 0 0 1 " + (-r) + " " + (-r) +
      "v" + (-(h - 2 * r)) +
      "a" + r + " " + r + " 0 0 1 " + r + " " + (-r) + "z";
  }
  const fark = (1 - kapi) / 2;
  let govde = "", gozde = "";
  for (let r = 0; r < boyut; r++) {
    for (let c = 0; c < boyut; c++) {
      if (!matris[r][c]) continue;
      const sol = c < 7, sag = c >= boyut - 7, ust = r < 7, alt = r >= boyut - 7;
      const kose = (sol && ust) || (sag && ust) || (sol && alt);
      const x = c + kenar, y = r + kenar;
      if (kose) gozde += "M" + x + " " + y + "h1v1h-1z";
      else govde += yol(x + fark, y + fark, kapi, kapi, yuvarlak);
    }
  }
  return "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"1024\" height=\"1024\" viewBox=\"0 0 " +
    (boyut + kenar * 2) + " " + (boyut + kenar * 2) + "\">" +
    "<rect width=\"100%\" height=\"100%\" fill=\"#fff\"/>" +
    "<path d=\"" + govde + "\" fill=\"#065f46\"/>" +
    "<path d=\"" + gozde + "\" fill=\"#065f46\"/></svg>";
}

(async function () {
  const m = NumexQR.matrisUret(METIN, "M");
  // Çap 1.00 = modüller bitişik. NOT (31.10): bu araç zamanlama/hizalama desenlerini de nokta yapar — ayrık dairelerin okunmamasının kökü
  // oydu; js/qr.js o desenleri kare tutar ve gerçek daireler (çap 0.86) okunur (tools/dogrula.js).
  const denemeler = [
    [1.0, 0], [1.0, 0.30], [1.0, 0.50], [1.0, 0.20], [1.0, 0.40],
    [0.98, 0.49], [1.0, 0.15]
  ];
  console.log("Noktalı stil — modül geometrisi ölçümü (" + m.boyut + "×" + m.boyut + " modül)\n");
  for (const [kapi, yuvarlak] of denemeler) {
    const svg = svgNoktaGeometri(m.matris, m.boyut, 4, kapi, yuvarlak);
    const { sonuc, tuval } = await okuVeKaydet(svg);
    const ad = "cikti-kapi" + String(kapi).replace(".", "") + "-r" + String(yuvarlak).replace(".", "") + ".png";
    if (!sonuc) fs.writeFileSync(path.join(__dirname, ad), tuval.toBuffer("image/png"));
    console.log(
      "  " + (sonuc ? "✓" : "✗") + " çap=" + kapi.toFixed(2) + " yuvarlaklık=" + yuvarlak.toFixed(2) +
      (sonuc ? " → okundu" : " → okunamadı (" + ad + ")")
    );
  }
})();
