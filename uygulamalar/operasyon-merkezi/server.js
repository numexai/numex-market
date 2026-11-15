'use strict';
/** Numex Core — Mini Fabrika Yönetim Merkezi (sıfır bağımlılık HTTP sunucusu) */
const http = require('http');
const fs = require('fs');
const path = require('path');
const { DB } = require('./db');
const { Motor, Hata } = require('./engine');

const PORT = Number(process.env.PORT) || 5481;
const DB_YOLU = process.env.NUMEX_DB || path.join(__dirname, 'veri', 'fabrika.json');
const PUBLIC = path.join(__dirname, 'public');

const db = new DB(DB_YOLU);
const motor = new Motor(db);

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.json': 'application/json; charset=utf-8'
};

function json(res, kod, govde) {
  const s = JSON.stringify(govde);
  res.writeHead(kod, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(s);
}

function govdeOku(req) {
  return new Promise((resolve, reject) => {
    let veri = '';
    req.on('data', (c) => {
      veri += c;
      if (veri.length > 1e6) reject(new Hata(413, 'Gövde çok büyük.'));
    });
    req.on('end', () => {
      if (!veri) return resolve({});
      try {
        resolve(JSON.parse(veri));
      } catch {
        reject(new Hata(400, 'Geçersiz JSON.'));
      }
    });
    req.on('error', reject);
  });
}

function gecikme(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

const rotalar = [
  ['GET', /^\/api\/durum$/, async () => motor.durum()],
  ['GET', /^\/api\/ozet$/, async () => motor.ozet()],
  ['GET', /^\/api\/urunler$/, async () => motor.v.urunler],
  ['GET', /^\/api\/stok$/, async () => motor.durum().stok],
  ['GET', /^\/api\/hareketler$/, async () => [...motor.v.hareketler].reverse().slice(0, 200)],
  ['GET', /^\/api\/emirler$/, async () => ({
    aktif: [...motor.v.emirler].reverse(),
    arsiv: motor.v.emirlerArsiv.slice(0, 100)
  })],
  [
    'POST',
    /^\/api\/planla$/,
    async (b) => motor.planla(b.urunId, b.adet, b.musteri)
  ],
  [
    'POST',
    /^\/api\/siparis$/,
    async (b) => {
      if (b.yavas) await gecikme(250); // hızlı çift tıklama testi için gerçekçi gecikme
      return motor.siparisOlustur(b);
    }
  ],
  ['POST', /^\/api\/emir\/([\w-]+)\/baslat$/, async (b, p) => motor.emriBaslat(p[0])],
  ['POST', /^\/api\/emir\/([\w-]+)\/ilerlet$/, async (b, p) => motor.ilerlet(p[0], b.oran)],
  ['POST', /^\/api\/emir\/([\w-]+)\/iptal$/, async (b, p) => motor.emirIptal(p[0], b.neden)],
  ['POST', /^\/api\/stok\/giris$/, async (b) => motor.stokGirisi(b.malzemeId, b.miktar, b.aciklama)],
  ['POST', /^\/api\/stok\/cikis$/, async (b) => motor.stokCikisi(b.malzemeId, b.miktar, b.aciklama)],
  ['POST', /^\/api\/stok\/fiyat$/, async (b) => motor.fiyatGuncelle(b.malzemeId, b.birimFiyat)],
  ['POST', /^\/api\/istasyon\/([\w-]+)\/kapasite$/, async (b, p) => motor.kapasiteGuncelle(p[0], b.kapasite)],
  ['POST', /^\/api\/sim$/, async (b) => {
    const hiz = Math.max(1, Math.min(300, Number(b.hiz) || 60));
    motor.v.simAyar.hiz = hiz;
    db.kaydet();
    return motor.v.simAyar;
  }],
  ['POST', /^\/api\/sifirla$/, async () => {
    db.sifirla();
    return { ok: true, durum: motor.durum() };
  }]
];

function dosyaSun(req, res) {
  // NUMEX-DÜZELTME (2026-11-14): Bozuk yüzde kodlaması decodeURIComponent'te URIError fırlatıp süreci kapatıyordu; çözümleme try/catch içine alınıp 400 dönüldü.
  // NUMEX-DÜZELTME (2026-11-14): bozuk yüzde-kodlamalı adres (ör. /%E0) decodeURIComponent'te
  // URIError atıp süreci çökertiyordu. Çözümleme hatasında 400 dönüyoruz, süreç ayakta kalıyor.
  let yol;
  try {
    yol = decodeURIComponent((req.url || '/').split('?')[0]);
  } catch {
    res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
    return res.end('Geçersiz adres');
  }
  if (yol === '/' || yol === '') yol = '/index.html';
  const tam = path.normalize(path.join(PUBLIC, yol));
  if (!tam.startsWith(PUBLIC)) {
    res.writeHead(403);
    return res.end('Yasak');
  }
  fs.readFile(tam, (err, icerik) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      return res.end('Bulunamadı: ' + yol);
    }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(tam)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
    res.end(icerik);
  });
}

const sunucu = http.createServer(async (req, res) => {
  const url = (req.url || '/').split('?')[0];
  if (!url.startsWith('/api/')) return dosyaSun(req, res);

  try {
    const yontem = req.method;
    let eslesti = false;
    for (const [m, re, isleyici] of rotalar) {
      if (m !== yontem) continue;
      const p = url.match(re);
      if (!p) continue;
      eslesti = true;
      const b = yontem === 'POST' ? await govdeOku(req) : {};
      const sonuc = await isleyici(b, p.slice(1));
      return json(res, 200, { ok: true, veri: sonuc });
    }
    if (!eslesti) return json(res, 404, { ok: false, hata: 'Endpoint bulunamadı.' });
  } catch (e) {
    if (e instanceof Hata) {
      return json(res, e.status || 400, { ok: false, hata: e.message, detay: e.detay || null });
    }
    console.error('[api]', e);
    return json(res, 500, { ok: false, hata: 'Sunucu hatası: ' + e.message });
  }
});

function baslat(port = PORT) {
  return new Promise((resolve) => {
    sunucu.listen(port, () => {
      const adres = `http://localhost:${sunucu.address().port}`;
      console.log(`\n  NUMEX CORE — Operasyon Smart Factory\n  Çalışıyor: ${adres}\n  Veri dosyası: ${DB_YOLU}\n`);
      resolve(adres);
    });
  });
}

if (require.main === module) baslat();

module.exports = { baslat, motor, sunucu, db };
