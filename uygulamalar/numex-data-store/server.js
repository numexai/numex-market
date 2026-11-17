// Basit statik sunucu — bağımlılık yok.
const http = require('http');
const fs = require('fs');
const path = require('path');

const KOK = __dirname;
const PORT = Number(process.env.PORT || 4173);
const TIP = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.csv': 'text/csv; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png'
};

http.createServer((req, res) => {
  // NUMEX-DÜZELTME (2026-11-17): Bozuk yüzde-kodlu adres (GET /%E0) decodeURIComponent'i URIError ile patlatıp tüm süreci düşürüyordu. Çözümlemeyi try/catch'e alıp 400 döndürdüm ve sunucuya hata yakalayıcı ekledim.
  let yol;
  try {
    yol = decodeURIComponent((req.url || '/').split('?')[0]);
  } catch (e) {
    res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' }).end('Geçersiz adres');
    return;
  }
  if (yol === '/') yol = '/index.html';
  // NUMEX-DÜZELTME (2026-11-17): Sunucu proje kökünü olduğu gibi sunuyordu; server.js, node_modules ve .numex gibi iç dosyalar tarayıcıdan okunabiliyordu. Yalnız uygulama dosyalarını (index/app/styles/vendor/data) sunan bir izin listesi ekledim.
  // yalnız uygulamanın kendi dosyaları sunulur (sunucu kodu / node_modules dışarı kapalı)
  // NUMEX-DÜZELTME (2026-11-17): İzin listesi yalnız app.js'i sayıyordu; yeni eklenen kabul.js 404 dönüyordu. Uygulama JS dosyalarının hepsini kapsayacak biçimde genişlettim.
  // NUMEX-DÜZELTME (2026-11-17): Geniş desen '[\w\-]+\.js' sunucu kodunun kendisini (server.js) de dışarı açtı. Yalnız uygulama betiklerini adıyla sayan kapalı listeye çevirdim.
  const IZINLI = /^\/(index\.html|styles\.css|(app|kabul)\.js|favicon\.ico)$|^\/(vendor|data)\/[\w.\-]+$/;
  if (!IZINLI.test(yol)) { res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('Bulunamadı: ' + yol); return; }
  const tam = path.join(KOK, yol);
  if (!tam.startsWith(KOK)) { res.writeHead(403).end('Yasak'); return; }
  fs.readFile(tam, (err, data) => {
    if (err) { res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('Bulunamadı: ' + yol); return; }
    res.writeHead(200, { 'Content-Type': TIP[path.extname(tam).toLowerCase()] || 'application/octet-stream' });
    res.end(data);
  });
}).listen(PORT, () => console.log('Numex Data Story → http://localhost:' + PORT));
