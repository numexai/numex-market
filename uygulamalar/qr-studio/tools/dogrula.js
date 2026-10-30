/* Numex QR Studio — bağımsız doğrulama (yalnız geliştirme için, teslimde silinir)
 *
 * Ürettiğimiz SVG'yi bağımsız bir QR okuyucu (jsQR) ile geri okur.
 * Amaç: "QR çizildi" ile "QR gerçekten okutuluyor" arasındaki farkı ölçmek.
 *
 * Kullanım: node tools/dogrula.js
 */
"use strict";

const fs = require("fs");
const path = require("path");
const { createCanvas, loadImage } = require("canvas");
const jsQR = require("jsqr");

const KOK = path.join(__dirname, "..");

// Tarayıcı betiklerini Node ortamında çalıştır (aynı kaynak, aynı mantık).
global.window = global;
global.document = { currentScript: null };

function betik(yol) {
  const kod = fs.readFileSync(path.join(KOK, yol), "utf8");
  new Function("window", "document", kod)(global.window, global.document);
}

betik("vendor/qrcode-kernel.js");
betik("js/qr.js");

const NumexQR = global.NumexQR;

async function oku(svg, px) {
  // SVG'yi PNG'ye çevir, jsQR ile oku.
  const boyut = px || 1024;
  const png = await NumexQR.pngUretNode
    ? await NumexQR.pngUretNode(svg, boyut)
    : null;

  if (!png) {
    // pngUret tarayıcı API'si kullanır; burada canvas ile yapıyoruz.
    const gecici = svg.replace(/width="\d+" height="\d+"/, `width="${boyut}" height="${boyut}"`);
    const img = await loadImage(Buffer.from(gecici, "utf8"));
    const tuval = createCanvas(boyut, boyut);
    const ctx = tuval.getContext("2d");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, boyut, boyut);
    ctx.drawImage(img, 0, 0, boyut, boyut);
    const veri = ctx.getImageData(0, 0, boyut, boyut);
    if (process.env.DEBUG_QR) fs.writeFileSync(path.join(KOK, "tools", "onizleme.png"), tuval.toBuffer("image/png"));
    return jsQR(veri.data, boyut, boyut);
  }
}

async function dene(ad, secenekler, beklenen) {
  let matris;
  try {
    matris = NumexQR.matrisUret(beklenen, secenekler.hata || "M");
  } catch (e) {
    return { ad, basarili: false, sebep: "matris: " + e.message };
  }

  if (!NumexQR.matrisGecerliMi(matris.matris, matris.boyut)) {
    return { ad, basarili: false, sebep: "gözdesi deseni bozuk" };
  }

  const svg = NumexQR.svgUret(
    Object.assign({ matris: matris.matris, boyut: matris.boyut }, secenekler)
  );

  const sonuc = await oku(svg, secenekler.px);
  if (!sonuc) return { ad, basarili: false, sebep: "okuyucu QR bulamadı", boyut: matris.boyut };
  if (sonuc.data !== beklenen) {
    return { ad, basarili: false, sebep: "içerik uyuşmuyor: " + sonuc.data.slice(0, 40), boyut: matris.boyut };
  }
  return { ad, basarili: true, boyut: matris.boyut, surum: matris.surum };
}

(async function () {
  const url = "https://www.numexai.com.tr";
  const wifi = "WIFI:T:WPA;S:EvWifi;P:gizli123;;";
  const uzun = "Numex QR Studio ile üretilen bu kod, Türkçe karakterleri de taşır: çğıİöşü ÇĞİÖŞÜ — 1234567890";

  const denemeler = [
    ["URL · kare · siyah", { still: "kare", renk1: "#000000", zeminRengi: "#ffffff" }, url],
    ["URL · yuvarlatılmış · gradyan", { still: "yuvarlak", renk1: "#0f172a", renk2: "#2563eb", zeminRengi: "#ffffff" }, url],
    ["URL · noktalı · gradyan", { still: "nokta", renk1: "#065f46", renk2: "#4d7c0f", zeminRengi: "#ffffff" }, url],
    ["URL · şeffaf zemin (beyaz üstüne)", { still: "yuvarlak", renk1: "#111827", zeminRengi: "" }, url],
    ["URL · 4 modül kenar", { still: "kare", renk1: "#9a3412", renk2: "#ea580c", zeminRengi: "#ffffff" }, url],
    ["Wi-Fi · H seviyesi", { still: "yuvarlak", renk1: "#0f172a", renk2: "#2563eb", zeminRengi: "#ffffff", hata: "H" }, wifi],
    ["Türkçe metin · noktalı", { still: "nokta", renk1: "#4c1d95", renk2: "#db2777", zeminRengi: "#ffffff" }, uzun],
    ["Logo %20 · H seviyesi", { still: "yuvarlak", renk1: "#0f172a", renk2: "#2563eb", zeminRengi: "#ffffff", hata: "H", logoBoyut: 0.2, logo: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%230f172a'/%3E%3Ccircle cx='50' cy='50' r='26' fill='%2338bdf8'/%3E%3C/svg%3E" }, url],
    ["Logo %28 · H seviyesi", { still: "kare", renk1: "#111827", zeminRengi: "#ffffff", hata: "H", logoBoyut: 0.28, logo: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' rx='18' fill='%230f172a'/%3E%3Ccircle cx='50' cy='50' r='30' fill='%2338bdf8'/%3E%3C/svg%3E" }, url],
    // 31.10: çok hizalama desenli büyük sürüm + logo — noktalı stil gerçek daire olduğundan ayrıca sınanır
    ["Uzun metin · noktalı · H (çok hizalama)", { still: "nokta", renk1: "#0f172a", renk2: "#2563eb", zeminRengi: "#ffffff", hata: "H" }, uzun.repeat(3)],
    ["Logo %20 · noktalı · H", { still: "nokta", renk1: "#0f172a", renk2: "#2563eb", zeminRengi: "#ffffff", hata: "H", logoBoyut: 0.2, logo: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%230f172a'/%3E%3Ccircle cx='50' cy='50' r='26' fill='%2338bdf8'/%3E%3C/svg%3E" }, url]
  ];

  // 31.10: "üç stil" sözü — noktalı çıktı yuvarlatılmışla BİREBİR aynıydı (düğme hiçbir şey yapmıyordu). Stiller birbirinden farklı olmalı.
  const m = NumexQR.matrisUret(url, "M");
  const stilSvg = (still) => NumexQR.svgUret({ matris: m.matris, boyut: m.boyut, still, renk1: "#000000", zeminRengi: "#ffffff" });
  const [kare, yuvarlak, nokta] = ["kare", "yuvarlak", "nokta"].map(stilSvg);
  const stilFarkli = kare !== yuvarlak && yuvarlak !== nokta && kare !== nokta;
  console.log(`${stilFarkli ? "✓" : "✗"} üç stil birbirinden farklı çiziliyor (kare / yuvarlatılmış / noktalı)`);

  // 31.10: hazır şablonlar uygulamanın kullandığı listeden — her biri kontrast eşiğinin üstünde ve kendi stilinde küçük boyutta da okunur.
  let sablonKontrastTamam = true;
  for (const s of NumexQR.SABLONLAR) {
    const oran = NumexQR.enDusukKontrast(s.renk1, s.renk2, s.zemin);
    const tamam = oran !== null && oran >= NumexQR.KONTRAST_ESIK;
    if (!tamam) sablonKontrastTamam = false;
    console.log(`${tamam ? "✓" : "✗"} şablon "${s.ad}" kontrast ${oran.toFixed(2)} (eşik ${NumexQR.KONTRAST_ESIK})`);
    for (const px of [330, 512, 1024]) {
      denemeler.push([`Şablon "${s.ad}" · ${px} px`, { still: s.still, renk1: s.renk1, renk2: s.renk2, gradyanYon: s.yon, zeminRengi: s.zemin, px }, url]);
    }
  }
  const kontrastBirim = Math.abs(NumexQR.kontrastOrani("#000000", "#ffffff") - 21) < 1e-9 && NumexQR.kontrastOrani("#777", "#777") === 1;
  console.log(`${kontrastBirim ? "✓" : "✗"} kontrast oranı: siyah/beyaz 21, aynı renk 1\n`);

  console.log("Numex QR Studio — okunabilirlik ölçümü\n");
  let basarili = 0;
  for (const [ad, secenekler, beklenen] of denemeler) {
    const s = await dene(ad, secenekler, beklenen);
    if (s.basarili) {
      basarili++;
      console.log(`  ✓ ${ad} — ${s.boyut}×${s.boyut} modül okundu`);
    } else {
      console.log(`  ✗ ${ad} — ${s.sebep}`);
    }
  }
  console.log(`\nSonuç: ${basarili}/${denemeler.length} yapılandırma bağımsız okuyucuyla okundu`);
  process.exit(basarili === denemeler.length && stilFarkli && sablonKontrastTamam && kontrastBirim ? 0 : 1);
})();
