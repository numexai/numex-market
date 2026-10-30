/* Numex QR Studio — yerel önizleme sunucusu (geliştirme kolaylığı)
 *
 * Uygulama sunucusuz da çalışır: index.html dosyasını çift tıklamak yeter.
 * Bu betik yalnız dosya:// kısıtlarından kaçınmak isteyene basit bir yerel sunucu açar.
 *
 * Kullanım: node serve.js  (varsayılan port 8000, doluysa boş port bulur)
 */
"use strict";

const http = require("http");
const fs = require("fs");
const path = require("path");

const KOK = __dirname;
const TIPLER = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".json": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json"
};

const sunucu = http.createServer((istek, yanit) => {
  // NUMEX-DÜZELTME (2026-10-28): decodeURIComponent hata yakalamasının dışındaydı; bozuk yüzde kodlamalı tek bir istek sunucuyu çökertiyordu. Artık 400 dönüp ayakta kalıyor.
  let temiz;
  try {
    // Bozuk yüzde kodlaması (ör. /%E0) URIError fırlatır; sunucu çökmemeli.
    temiz = decodeURIComponent(istek.url.split("?")[0]);
  } catch (e) {
    yanit.writeHead(400, { "Content-Type": "text/plain; charset=utf-8" }).end("Geçersiz adres");
    return;
  }

  const hedef = path.join(KOK, temiz === "/" ? "index.html" : temiz);

  // Klasör dışına çıkma girişimini engelle.
  if (!hedef.startsWith(KOK)) {
    yanit.writeHead(403).end("Yasak");
    return;
  }

  // NUMEX-DÜZELTME (2026-10-28): Sunucu proje kökünün tamamını sunuyordu; serve.js, package.json ve tools/ herkese açıktı. Yalnız index/hakkinda.html, css/, js/ ve QR çekirdeği sunuluyor.
  // Yalnız uygulamanın gerçekten ihtiyaç duyduğu dosyaları sun:
  // serve.js, package.json, build.js, README, tools/ ve vendor/qrcode-lib/ dışarıda kalır.
  // NUMEX-DÜZELTME (2026-10-28): Beyaz listede kök adres ("/") hiçbir kurala uymuyordu, ana sayfa 404 dönüyordu; "/" isteği index.html'e çevriliyor.
  // NUMEX-DÜZELTME (2026-10-28): Yeni değişken adı (istek) işleyicinin parametresiyle çakışıp SyntaxError veriyordu; istenenYol olarak yeniden adlandırıldı.
  const istenenYol = temiz === "/" ? "/index.html" : temiz;
  const izinli =
    /^\/(index|hakkinda)\.html$/.test(istenenYol) ||
    /^\/css\/[\w.-]+\.css$/.test(istenenYol) ||
    /^\/js\/[\w.-]+\.js$/.test(istenenYol) ||
    istenenYol === "/vendor/qrcode-kernel.js";
  if (!izinli) {
    yanit.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" }).end("Bulunamadı");
    return;
  }

  fs.readFile(hedef, (hata, veri) => {
    if (hata) {
      yanit.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" }).end("Bulunamadı");
      return;
    }
    yanit.writeHead(200, { "Content-Type": TIPLER[path.extname(hedef).toLowerCase()] || "application/octet-stream" });
    yanit.end(veri);
  });
});

const istenenPort = Number(process.argv[2]) || 8000;

sunucu.listen(istenenPort, () => {
  console.log("Numex QR Studio → http://localhost:" + sunucu.address().port + "/");
}).on("error", (hata) => {
  if (hata.code === "EADDRINUSE") {
    sunucu.listen(0, () => console.log("Port dolu; boş port kullanılıyor → http://localhost:" + sunucu.address().port + "/"));
  } else {
    throw hata;
  }
});
