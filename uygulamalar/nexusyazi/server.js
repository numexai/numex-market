// NexusYazı — basit statik sunucu (isteğe bağlı).
// Uygulama client tarafında (localStorage) çalışır; sunucu sadece dosyaları servis eder.
const http = require('http');
const fs = require('fs');
const path = require('path');

const BASE_PORT = parseInt(process.env.PORT, 10) || 3210;
// Canlı (düzenlenebilir) arayüz kopyası public/ içindedir; sunucu onu servis eder.
// (Kök-kopya eski yedektir; NB: motorun yazma kökü public olduğu için bu tutarlıdır.)
const ROOT = path.join(__dirname, 'public');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.md': 'text/markdown; charset=utf-8'
};

// Küçük JSON uçları — smoke test / canlılık doğrulaması için.
function js(res, code, obj) {
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(obj));
}

function start(onPort) {
  const server = http.createServer((req, res) => {
    // ---- API uçları (dosya servisinden önce yakala) ----
    const p = (req.url || '').split('?')[0];
    if (p === '/api/health') return js(res, 200, { ok: true, app: 'nexusyazi', uptime: Math.round(process.uptime()) });
    if (p === '/api/meta')     return js(res, 200, { app: 'nexusyazi', ad: 'NexusYazı', surum: '1.0.0', aciklama: 'Word benzeri, güvenli, çevrimdışı kelime işlemci' });

    let urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
    if (urlPath === '/') urlPath = '/index.html';

    // Basit yol güvenliği: kök dışına çıkma
    const filePath = path.normalize(path.join(ROOT, urlPath));
    if (!filePath.startsWith(ROOT)) {
      res.writeHead(403);
      return res.end('Erisim engellendi');
    }

    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        return res.end('Bulunamadi: ' + urlPath);
      }
      const ext = path.extname(filePath).toLowerCase();
      // no-cache: tarayici eski index.html/app.js eslesmesini onbellekte tutmasin
      // (gelistirme sirasinda eski HTML + yeni JS "eleman null" hatalarina yol aciyordu)
      res.writeHead(200, {
        'Content-Type': MIME[ext] || 'application/octet-stream',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      });
      res.end(data);
    });
  });

  // Port doluysa (EADDRINUSE) cokmek yerine otomatik bir sonraki bos porta gec.
  // Boylece kalinti node surecleri olsa bile sunucu asla kilitlenmez.
  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log('— Port ' + onPort + ' dolu, ' + (onPort + 1) + ' deneniyor…');
      start(onPort + 1);
    } else {
      throw err;
    }
  });

  server.listen(onPort, () => {
    console.log('✅ NexusYazı hazır: http://localhost:' + onPort);
  });
}

// Hem doğrudan çalıştırmaya (node server.js) hem de test/smoke senaryolarının
// gömülü başlatmasına izin ver: require eden akış kendi PORT'unu verebilir.
module.exports = { start, BASE_PORT };

if (require.main === module) {
  start(BASE_PORT);
}
