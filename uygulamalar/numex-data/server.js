/**
 * Numex Data Detective — yerel sunucu (bağımlılık yok)
 * Çalıştır:  node server.js      ->  http://localhost:5173
 * ES modülleri ve fetch() file:// üzerinden çalışmadığı için bu sunucu gerekir.
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const KOK = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT || 5173);

const TIPLER = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.csv': 'text/csv; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.pdf': 'application/pdf'
};

const sunucu = http.createServer((istek, cevap) => {
  // Bozuk yüzde-kodlamalı adres (ör. /%E0) decodeURIComponent'i fırlatır ve süreci düşürürdü.
  // Çözümleme hatası artık 400 olarak dönüyor, sunucu ayakta kalıyor.
  let yol;
  try {
    yol = decodeURIComponent((istek.url || '/').split('?')[0]);
  } catch {
    cevap.writeHead(400, { 'content-type': 'text/plain; charset=utf-8' });
    cevap.end('Geçersiz adres');
    return;
  }
  if (yol === '/' || yol === '') yol = '/index.html';

  // GÜVENLİK: proje kökü komple açılmaz. Yalnız arayüz + örnek veri sunulur.
  // Sunucu kodu, testler, paket dosyaları ve nokta ile başlayan yollar (.numex, .env) kapalı.
  const GIZLI = /^\/(server\.js|package(-lock)?\.json|README\.md|dogrulama-raporu\.md)(\?|$)/i;
  const kapali = GIZLI.test(yol) ||
    yol.startsWith('/tests/') ||
    yol.split('/').some(p => p.startsWith('.') && p.length > 1);
  if (kapali) {
    cevap.writeHead(403, { 'content-type': 'text/plain; charset=utf-8' });
    cevap.end('Bu yol sunulmuyor');
    return;
  }

  const dosya = path.join(KOK, yol);
  if (!dosya.startsWith(KOK)) { cevap.writeHead(403); cevap.end('403'); return; }
  fs.readFile(dosya, (hata, veri) => {
    if (hata) {
      cevap.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
      cevap.end('Bulunamadı: ' + yol);
      return;
    }
    cevap.writeHead(200, {
      'content-type': TIPLER[path.extname(dosya).toLowerCase()] || 'application/octet-stream',
      'cache-control': 'no-cache'
    });
    cevap.end(veri);
  });
});

sunucu.listen(PORT, () => {
  console.log(`\n  🕵️  Numex Data Detective\n  → http://localhost:${PORT}\n`);
});
