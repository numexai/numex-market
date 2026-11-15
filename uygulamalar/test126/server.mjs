// Basit statik sunucu — ES modüllerinin file:// altında çalışmaması nedeniyle.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';

const root = process.cwd();
const port = Number(process.argv[2] || 5173);
const tipler = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
};

createServer(async (req, res) => {
  try {
    const yol = decodeURIComponent((req.url || '/').split('?')[0]);
    const dosya = normalize(join(root, yol === '/' ? '/index.html' : yol));
    if (!dosya.startsWith(root)) {
      res.writeHead(403).end('403');
      return;
    }
    // Yalnız uygulama dosyaları sunulur: sunucu kodu, testler ve .env dışarıya açılmaz.
    const izinli = yol === '/' || yol === '/index.html' || yol.startsWith('/css/') || yol.startsWith('/js/');
    if (!izinli) {
      res.writeHead(403, { 'content-type': 'text/plain; charset=utf-8' }).end('403');
      return;
    }
    const veri = await readFile(dosya);
    res.writeHead(200, {
      'content-type': tipler[extname(dosya)] || 'application/octet-stream',
      'cache-control': 'no-store',
    });
    res.end(veri);
  } catch {
    res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' }).end('404');
  }
}).listen(port, () => console.log(`NUMEX SMART CITY → http://localhost:${port}`));
