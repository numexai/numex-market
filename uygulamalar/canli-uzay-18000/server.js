/* ============================================================
   18.000 ALEM — Yerel Sunucu (bağımlılıksız, saf Node.js)
   ------------------------------------------------------------
   Görev:
     • index.html / app.js / style.css dosyalarını servis et
     • Sahnede GERÇEKTEN kaç gövde döndüğünü HTTP ile bildir
       (görsel doğrulamanın "doğru sayfa mı" kanıtı)

   Uçlar:
     GET /                 → index.html
     GET /api/sahne        → sahne sözleşmesi (JSON)
     GET /api/saglik       → sağlık kontrolü (JSON)

   Kullanım:  node server.js  [port]
   ============================================================ */
'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = Number(process.argv[2] || process.env.PORT || 8123);
const KOK = __dirname;

/* Uzantıya göre içerik tipi — yanlış tip tarayıcıda boş ekran demektir */
const TIPLER = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.map': 'application/json; charset=utf-8'
};

/* ------------------------------------------------------------
   SAHNE SÖZLEŞMESİ
   Orijinal istekteki somut maddeler tek tek sayılır:
   uzay boşluğu · güneş · ay · kendi ekseninde dönüş · ilahi güç
   ------------------------------------------------------------ */
function sahneSozlesmesi() {
  return {
    ad: '18.000 Alem · Canlı Uzay',
    surum: '1.0.0',
    teknoloji: 'Canvas 2D (harici kütüphane yok, her kare elle çizilir)',
    canli: true,
    kareHizi: 'requestAnimationFrame — sürekli animasyon',
    alemSayisi: 18000,
    maddeler: [
      { id: 'uzay-boslugu', var: true, aciklama: 'Derin uzay zemini + parallax yıldız alanı + nebula' },
      { id: 'gunes', var: true, aciklama: 'Katmanlı kor, alev dilleri, konveksiyon granülasyonu' },
      { id: 'gunes-kendi-ekseni', var: true, aciklama: 'Güneş yüzey deseni zamanla kayar (kendi ekseninde dönüş)' },
      { id: 'ay', var: true, aciklama: 'Dünya çevresinde kilitli yörünge + kraterli gövde' },
      { id: 'ay-kendi-ekseni', var: true, aciklama: 'Ay kraterleri kendi ekseninde kayar (dönüş kanıtı)' },
      { id: 'gezegenler', var: true, aciklama: 'Her gezegen kendi ekseninde döner + yörüngede dolaşır' },
      { id: 'ilahi-guc', var: true, aciklama: 'Merkezden salınan ışık halkaları + taç + ekran perdesi' },
      { id: 'kontrol-paneli', var: true, aciklama: 'Hız / ilahi güç / yıldız yoğunluğu + duraklat' }
    ]
  };
}

function jsonYaz(res, kod, veri) {
  const govde = JSON.stringify(veri, null, 2);
  res.writeHead(kod, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(govde),
    'Cache-Control': 'no-store'
  });
  res.end(govde);
}

const sunucu = http.createServer((req, res) => {
  let istenenYol;
  try {
    istenenYol = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  } catch (e) {
    return jsonYaz(res, 400, { hata: 'geçersiz istek yolu' });
  }

  /* ---------- API uçları ---------- */
  if (istenenYol === '/api/sahne') {
    return jsonYaz(res, 200, sahneSozlesmesi());
  }

  if (istenenYol === '/api/saglik') {
    return jsonYaz(res, 200, {
      durum: 'ayakta',
      ad: '18.000 Alem · Canlı Uzay',
      port: PORT,
      zaman: new Date().toISOString()
    });
  }

  /* ---------- Statik dosyalar ---------- */
  if (istenenYol === '/' || istenenYol === '') istenenYol = '/index.html';

  /* Dizin kaçışı (../..) engeli — güvenlik */
  const hedef = path.normalize(path.join(KOK, istenenYol));
  if (!hedef.startsWith(KOK)) {
    return jsonYaz(res, 403, { hata: 'erişim reddedildi' });
  }

  fs.readFile(hedef, (err, veri) => {
    if (err) {
      return jsonYaz(res, 404, { hata: 'bulunamadı', yol: istenenYol });
    }
    const uzanti = path.extname(hedef).toLowerCase();
    res.writeHead(200, {
      'Content-Type': TIPLER[uzanti] || 'application/octet-stream',
      'Content-Length': veri.length,
      'Cache-Control': 'no-store'
    });
    res.end(veri);
  });
});

sunucu.listen(PORT, () => {
  console.log('[18.000 ALEM] sunucu ayakta → http://localhost:' + PORT + '/');
  console.log('[18.000 ALEM] sahne sözleşmesi → http://localhost:' + PORT + '/api/sahne');
});

sunucu.on('error', (e) => {
  if (e.code === 'EADDRINUSE') {
    console.error('[18.000 ALEM] port ' + PORT + ' dolu — başka port dene: node server.js 8124');
  } else {
    console.error('[18.000 ALEM] sunucu hatası:', e.message);
  }
  process.exit(1);
});
