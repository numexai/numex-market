// Basit yerel statik sunucu — uygulamayı tarayıcıda açmak için.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const KOK = process.cwd();
const PORT = Number(process.argv[2] || 4173);
const TURLER = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.map': 'application/json',
};

http.createServer((req, res) => {
  // NUMEX-DÜZELTME (2026-11-15): Bozuk yüzde kodlu adres (%E0) decodeURIComponent'te URIError fırlatıp süreci çökertiyordu; çözümleme try/catch içine alındı ve 400 dönülüyor.
  let yol;
  try {
    yol = decodeURIComponent((req.url || '/').split('?')[0]);
  } catch {
    res.writeHead(400, { 'content-type': 'text/plain; charset=utf-8' });
    return res.end('bozuk adres');
  }
  if (yol === '/') yol = '/index.html';
  // NUMEX-DÜZELTME (2026-11-15): Statik sunucu proje kökünü olduğu gibi sunuyordu (sunucu kodu, package.json, node_modules dışarıya açık). Yalnız uygulamanın kendi dosyalarına izin veren bir beyaz liste eklendi.
  const IZINLI = /^\/(index\.html|styles\.css|app\.js|app\.js\.map|favicon\.ico|assets\/[\w.-]+)$/;
  if (!IZINLI.test(yol)) { res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' }); return res.end('yok'); }
  const tam = path.join(KOK, yol);
  if (!tam.startsWith(KOK)) { res.writeHead(403); return res.end('yasak'); }
  fs.readFile(tam, (err, veri) => {
    if (err) { res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' }); return res.end('bulunamadı: ' + yol); }
    res.writeHead(200, { 'content-type': TURLER[path.extname(tam).toLowerCase()] || 'application/octet-stream' });
    res.end(veri);
  });
}).listen(PORT, () => console.log('hazır: http://localhost:' + PORT));
