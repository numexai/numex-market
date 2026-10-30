/* Numex QR Studio — derleme betiği
 *
 * Kullanım: node build.js
 *
 * vendor/qrcode-lib/ altındaki gömülü qrcode kütüphanesini (CommonJS) tek bir
 * tarayıcı betiğine (vendor/qrcode-kernel.js) paketler. Böylece uygulama hiçbir
 * çalışma anı yüklemesi yapmaz: çevrimdışı da, ters bölü yol/derinlik sorunu
 * olmadan da çalışır. Kütüphane kaynağı DEĞİŞTİRİLMEZ, yalnız module/require
 * ortamı enjekte edilir.
 */
"use strict";

const fs = require("fs");
const path = require("path");

const KOK = __dirname;
const LIB = path.join(KOK, "vendor", "qrcode-lib");
const CIKTI = path.join(KOK, "vendor", "qrcode-kernel.js");
const GIRIS = "browser"; // tarayıcı için create + SVG çıktısı

const moduller = new Map(); // mutlak yol -> { kod, id }

function uzantiCoz(temel) {
  const adaylar = [temel + ".js", path.join(temel, "index.js"), temel];
// NUMEX-DÜZELTME (2026-10-28): Paket çözümü package.json "main" alanını okumuyordu; dijkstrajs gibi main'i kök .js olan paketler bulunamıyordu.

  // Paket klasörü ise package.json'daki main alanına da bak.
  try {
    if (fs.statSync(temel).isDirectory()) {
      const paket = JSON.parse(fs.readFileSync(path.join(temel, "package.json"), "utf8"));
      if (paket.main) adaylar.unshift(path.join(temel, paket.main));
    }
  } catch (e) { /* package.json yok */ }

  for (const a of adaylar) {
    try {
      if (fs.statSync(a).isFile()) return a;
    } catch (e) { /* yok, sıradakine bak */ }
  }
  return null;
}

// require("...") çağrılarını topla
function bagimliliklar(kod) {
  const sonuc = [];
  const re = /require\(\s*["']([^"']+)["']\s*\)/g;
  let m;
  while ((m = re.exec(kod)) !== null) sonuc.push(m[1]);
  return sonuc;
}

// node_modules altındaki bir modülü kimliğiyle pakete ekler.
function disModulAl(tam) {
  if (moduller.has(tam)) return moduller.get(tam);
  const kod = fs.readFileSync(tam, "utf8");
  const id = "node_modules/" + path.basename(path.dirname(tam)) + "/" + path.basename(tam);
  const kayit = { kod, id, yol: tam, bagimliliklar: [] };
  moduller.set(tam, kayit);

  const klasor = path.dirname(tam);
  for (const bagimli of bagimliliklar(kod)) {
    if (bagimli.charAt(0) === ".") {
      const yerel = uzantiCoz(path.join(klasor, bagimli));
      if (!yerel) throw new Error("Modül bulunamadı: " + bagimli);
      kayit.bagimliliklar.push(disModulAl(yerel).id);
    } else {
      const disYol = uzantiCoz(path.join(KOK, "node_modules", bagimli));
      if (!disYol) throw new Error("Bağımlılık bulunamadı: " + bagimli);
      kayit.bagimliliklar.push(disModulAl(disYol).id);
    }
  }
  return kayit;
}

function topla(yol) {
  const tam = uzantiCoz(path.resolve(LIB, yol));
  if (!tam) throw new Error("Modül bulunamadı: " + yol);
  if (moduller.has(tam)) return moduller.get(tam);

  const kod = fs.readFileSync(tam, "utf8");
  const id = path.relative(LIB, tam).replace(/\\/g, "/");
  const kayit = { kod, id, yol: tam, bagimliliklar: [] };
  moduller.set(tam, kayit); // döngü koruması

  const klasor = path.dirname(tam);
  for (const bagimli of bagimliliklar(kod)) {
    // NUMEX-DÜZELTME (2026-10-28): Paketleme dış bağımlılıkta (dijkstrajs) duruyordu; node_modules'taki modüller de pakete katılarak tek dosyada çevrimdışı çalışma sağlandı.
    let hedef;
    if (bagimli.charAt(0) === ".") {
      hedef = topla(path.relative(LIB, path.join(klasor, bagimli)));
    } else {
      // Paket dışı bağımlılık (ör. dijkstrajs) → node_modules içinden alınır.
      const disYol = uzantiCoz(path.join(KOK, "node_modules", bagimli));
      if (!disYol) throw new Error("Bağımlılık bulunamadı: " + bagimli + " (" + id + ")");
      hedef = disModulAl(disYol);
    }
    kayit.bagimliliklar.push(hedef.id);
    // Uzantısız require("./x") çağrılarını paket içindeki kimliğe bağla.
    kayit.eslesme = kayit.eslesme || {};
    kayit.eslesme[bagimli] = hedef.id;
  }
  return kayit;
}

const giris = topla(GIRIS);

const parcalar = [];
parcalar.push("/* Numex QR Studio — gömülü QR çekirdeği (otomatik üretildi, elle düzenlemeyin).");
parcalar.push(" * Kaynak: vendor/qrcode-lib (MIT). Üretim: node build.js");
parcalar.push(" */");
parcalar.push("(function (kök) {");
parcalar.push('  "use strict";');
parcalar.push("  var tanimlar = {}, onbellek = {};");

for (const m of moduller.values()) {
  // NUMEX-DÜZELTME (2026-10-28): Paketteki require, uzantısız istekleri ("./can-promise") kimliğe çeviremediği için kütüphane çalışma anında patlıyordu; her modülün bağımlılık eşlemesi pakete yazılıp require bu eşlemeyi kullanıyor.
  parcalar.push("  tanimlar[" + JSON.stringify(m.id) + "] = {");
  parcalar.push("    eslesme: " + JSON.stringify(m.eslesme || {}) + ",");
  parcalar.push("    calistir: function (module, exports, require) {");
  parcalar.push(m.kod);
  parcalar.push("    }");
  parcalar.push("  };");
}

parcalar.push("  function yukle(id) {");
parcalar.push("    if (onbellek[id]) return onbellek[id].exports;");
parcalar.push("    var modul = { exports: {} };");
parcalar.push("    onbellek[id] = modul;");
parcalar.push("    var tanim = tanimlar[id];");
parcalar.push("    tanim.calistir(modul, modul.exports, function (hedef) {");
parcalar.push("      var paketli = tanim.eslesme[hedef];");
parcalar.push("      if (!paketli) throw new Error(\"Numex QR: paketlenmemiş modül isteniyor → \" + hedef);");
parcalar.push("      return yukle(paketli);");
parcalar.push("    });");
parcalar.push("    return modul.exports;");
parcalar.push("  }");
parcalar.push("  kök.NumexQRKernel = yukle(" + JSON.stringify(giris.id) + ");");
parcalar.push("})(typeof window !== \"undefined\" ? window : globalThis);");
parcalar.push("");

fs.writeFileSync(CIKTI, parcalar.join("\n"), "utf8");

const boyutKb = (fs.statSync(CIKTI).size / 1024).toFixed(1);
console.log("Paketlendi: " + path.relative(KOK, CIKTI) + " (" + moduller.size + " modül, " + boyutKb + " KB)");
for (const m of moduller.values()) {
  console.log("  · " + m.id + " → " + (m.bagimliliklar.join(", ") || "(bağımsız)"));
}
