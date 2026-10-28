/* ==========================================================================
   scripts/serve.js — Sifir bagimlilikli statik dosya sunucusu
   --------------------------------------------------------------------------
   Amac: Okey oyununu yerel olarak servis etmek. Harici npm paketi KULLANMAZ
   (express/http-server GEREKMEZ) - yalnizca Node'un yerlesik 'http'/'fs'
   modulleri ile calisir. Boylece proje sifir-bagimlilik kimligini korur.

   Kullanim:
     node scripts/serve.js            -> http://127.0.0.1:8099
     node scripts/serve.js 3000       -> http://127.0.0.1:3000
     PORT=5000 node scripts/serve.js  -> ortam degiskeni ile port

   Uclar:
     GET /                -> index.html (oyun)
     GET /health          -> {"ok":true,...} saglik kontrolu (JSON)
     GET /api/status      -> oyun/sunucu durumu (JSON)  <-- dogrulanabilir uc
     GET /<statik>        -> css/js/... (MIME tipi ile)
   ========================================================================== */
'use strict';

var http = require('http');
var fs = require('fs');
var path = require('path');
var url = require('url');

var KOK = path.resolve(__dirname, '..');
var PORT = parseInt(process.argv[2] || process.env.PORT || '8099', 10);
var HOST = process.env.HOST || '127.0.0.1';

/* ----------------------------------------------------------------------
   MIME tipleri — tarayicinin dosyalari dogru yorumlamasi icin
   ---------------------------------------------------------------------- */
var MIME = {
  '.html': 'text/html; charset=utf-8',
  '.htm': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.txt': 'text/plain; charset=utf-8',
  '.map': 'application/json; charset=utf-8'
};

/* ----------------------------------------------------------------------
   Guvenlik: yol gezinme (path traversal) korumasi
   KOK disina cikan istekleri (../../etc/passwd gibi) reddeder.
   ---------------------------------------------------------------------- */
function guvenliYol(istenenYol) {
  var temiz = decodeURIComponent(istenenYol.split('?')[0].split('#')[0]);
  if (temiz === '/' || temiz === '') temiz = '/index.html';
  var tamYol = path.join(KOK, path.normalize(temiz));
  var goreli = path.relative(KOK, tamYol);
  // KOK disina cikiyorsa (.. ile basliyorsa veya absolute ise) reddet
  if (goreli.startsWith('..') || path.isAbsolute(goreli)) return null;
  return tamYol;
}

/* ----------------------------------------------------------------------
   JSON yanit yardimcisi
   ---------------------------------------------------------------------- */
function jsonYanit(res, kod, veri) {
  var govde = JSON.stringify(veri, null, 2);
  res.writeHead(kod, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(govde),
    'Cache-Control': 'no-store'
  });
  res.end(govde);
}

/* ----------------------------------------------------------------------
   Proje durumunu incele (test dosyalari, js modulleri)
   ---------------------------------------------------------------------- */
function projeDurumu() {
  var jsDosyalari = ['tiles.js', 'rules.js', 'bot.js', 'game.js', 'ui.js', 'main.js'];
  var mevcut = [];
  var eksik = [];
  jsDosyalari.forEach(function (ad) {
    var p = path.join(KOK, 'js', ad);
    if (fs.existsSync(p)) mevcut.push(ad);
    else eksik.push(ad);
  });

  var indexVar = fs.existsSync(path.join(KOK, 'index.html'));
  var cssVar = fs.existsSync(path.join(KOK, 'css', 'style.css'));
  var testVar = fs.existsSync(path.join(KOK, 'test', 'rules.test.js'));

  return {
    uygulama: 'Okey — Türk Klasik Okey',
    surum: '1.0.0',
    tur: 'tarayici-tarafli-oyun',
    mimari: 'UMD IIFE (window.OkeyX + CommonJS require)',
    hariciBagimlilik: 0,
    dosyalar: {
      indexHtml: indexVar,
      styleCss: cssVar,
      testDosyasi: testVar,
      jsModulleri: mevcut,
      eksikJsModulleri: eksik
    },
    uclar: ['/', '/health', '/api/status', '/css/style.css', '/js/*.js'],
    durum: (indexVar && cssVar && testVar && eksik.length === 0) ? 'hazir' : 'eksik-bilesen'
  };
}

/* ----------------------------------------------------------------------
   HTTP sunucu
   ---------------------------------------------------------------------- */
var sunucu = http.createServer(function (req, res) {
  var parsed = url.parse(req.url);
  var yol = parsed.pathname || '/';

  // Basit istek logu
  var baslangic = Date.now();

  res.on('finish', function () {
    var ms = Date.now() - baslangic;
    console.log(
      '[' + new Date().toISOString() + '] ' +
      req.method + ' ' + yol + ' -> ' + res.statusCode + ' (' + ms + 'ms)'
    );
  });

  // --- Saglik kontrolu ucu ---
  if (yol === '/health') {
    return jsonYanit(res, 200, {
      ok: true,
      servis: 'okey-oyun-sunucusu',
      uptime_sn: Math.round(process.uptime()),
      zaman: new Date().toISOString()
    });
  }

  // --- Durum ucu (dogrulanabilir JSON) ---
  if (yol === '/api/status') {
    return jsonYanit(res, 200, projeDurumu());
  }

  // --- Diger HTTP metodlari ---
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return jsonYanit(res, 405, { ok: false, hata: 'Yalnizca GET/HEAD desteklenir' });
  }

  // --- Statik dosya servisi ---
  var tamYol = guvenliYol(yol);
  if (!tamYol) {
    return jsonYanit(res, 403, { ok: false, hata: 'Yasak yol (path traversal)' });
  }

  fs.stat(tamYol, function (err, stat) {
    if (err || !stat.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
      return res.end(
        '<!DOCTYPE html><html lang="tr"><head><meta charset="utf-8">' +
        '<title>404 — Bulunamadı</title></head><body style="font-family:sans-serif;' +
        'background:#0d3b28;color:#e8f5e9;text-align:center;padding:60px">' +
        '<h1>404</h1><p>Bulunamadı: ' + yol + '</p>' +
        '<p><a href="/" style="color:#ffd54f">Oyunu aç</a></p></body></html>'
      );
    }

    var ext = path.extname(tamYol).toLowerCase();
    var tip = MIME[ext] || 'application/octet-stream';

    res.writeHead(200, {
      'Content-Type': tip,
      'Content-Length': stat.size,
      'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=3600'
    });

    if (req.method === 'HEAD') return res.end();

    var akis = fs.createReadStream(tamYol);
    akis.on('error', function () {
      if (!res.headersSent) res.writeHead(500);
      res.end('Dosya okuma hatasi');
    });
    akis.pipe(res);
  });
});

/* ----------------------------------------------------------------------
   Baslatma + anlamli hata mesajlari
   ---------------------------------------------------------------------- */
sunucu.on('error', function (err) {
  if (err.code === 'EADDRINUSE') {
    console.error('HATA: Port ' + PORT + ' dolu. Baska port dene: node scripts/serve.js 3000');
  } else {
    console.error('Sunucu hatasi:', err.message);
  }
  process.exit(1);
});

sunucu.listen(PORT, HOST, function () {
  var durum = projeDurumu();
  console.log('\n==================================================');
  console.log('  Okey — Türk Klasik Okey  (statik sunucu)');
  console.log('==================================================');
  console.log('  🌐 Oyun    : http://' + HOST + ':' + PORT + '/');
  console.log('  ✅ Saglik  : http://' + HOST + ':' + PORT + '/health');
  console.log('  📊 Durum   : http://' + HOST + ':' + PORT + '/api/status');
  console.log('  📦 Bilesen : ' + durum.durum + ' (js modulu: ' +
              durum.dosyalar.jsModulleri.length + ')');
  console.log('  Bağımlılık : 0 (saf Node http/fs)');
  console.log('==================================================\n');
  console.log('Durdurmak icin: Ctrl+C\n');
});

// Zarif kapanis
process.on('SIGINT', function () {
  console.log('\nSunucu kapatiliyor...');
  sunucu.close(function () {
    console.log('Kapandi. GorUsuruz!');
    process.exit(0);
  });
});

module.exports = sunucu;
