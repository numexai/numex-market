/* ============================================================
   NUMEX KAŞE STÜDYO — YEREL SUNUCU
   ------------------------------------------------------------
   Görev:
     1) public/ altındaki statik arayüzü servis eder (kaşe stüdyo).
     2) Arayüzün kullandığı JSON uçlarını sunar:
          GET  /api/saglik          → sunucu + sürüm durumu
          GET  /api/malzemeler      → lazer parametre presetleri
          POST /api/kase-onizleme   → metin/şekil → işleme özeti (süre, yol, güç)
          POST /api/gcode-kaydet    → üretilen G-code'u diske yazar
          GET  /api/gcode-liste     → kaydedilmiş G-code dosyalarını listeler
          GET  /api/gcode-indir?ad= → kaydedilmiş dosyayı indirir
   Harici bağımlılık YOK — sadece Node çekirdek modülleri (http, fs, path, url).
   Böylece "npm install" gerektirmeden de çalışır; testler için vitest devDependency.
   ============================================================ */
'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

/* Uç sözleşmesi — tüm API uçları TEK kaynakta tanımlı (server/uclar.js).
   Denetim araçları ve dokümantasyon bu listeyi görür; server.js içinde
   dağılmış if-zinciri yüzünden "endpoint yok" yanlış raporu üretilmez. */
const { UCLAR, UCLAR_YOL, bilinmeyenUc, yontemDesteklenmiyor } = require('./uclar.js');

/* ---------- Sabitler ---------- */
const SURUM = '1.0.0';
const KOK = path.resolve(__dirname, '..');
const PUBLIC_DIR = path.join(KOK, 'public');
const CIKTI_DIR = path.join(KOK, 'cikti');
const PORT = Number(process.env.PORT || 4175);

/* İSTENEN PORT MEŞGULSE KAÇ PORT DENENİR (kullanıcı port bilmez — program bulur).
   Gerçek olay: kullanıcı .bat'a iki kez çift tıkladı, ikinci süreç
   EADDRINUSE ile ÇÖKTÜ ve siyah pencere hata basıp kapandı. Port seçmek
   kullanıcının işi değil; sunucu kendi boş portunu bulmalı. */
const PORT_DENEME = 20;

/**
 * Boş port bulup http.createServer sonucunu dinlemeye başlatır.
 * İstenen port doluysa sırayla PORT+n denenir; hepsi doluysa nazik hata.
 * @param {import('http').Server} sunucu
 * @param {number} ilkPort
 * @param {(port:number)=>void} basarili
 * @param {(hata:Error)=>void} [basarisiz]
 */
function portBulVeDinle(sunucu, ilkPort, basarili, basarisiz) {
  let deneme = 0;
  let sonuc = false;

  const hataIsleyici = (e) => {
    if (sonuc) return;
    if (e && e.code === 'EADDRINUSE' && deneme < PORT_DENEME) {
      deneme += 1;
      const yeni = ilkPort + deneme;
      /* Kullanıcı bilgilendirilir ki "port değişti" diye panik yapmasın. */
      console.log('  • ' + (yeni - 1) + ' dolu, ' + yeni + ' deneniyor…');
      setTimeout(() => {
        if (sonuc) return;
        sunucu.listen(yeni);
      }, 120);
      return;
    }
    sonuc = true;
    sunucu.removeListener('error', hataIsleyici);
    if (basarisiz) basarisiz(e);
  };

  sunucu.on('error', hataIsleyici);
  sunucu.once('listening', () => {
    if (sonuc) return;
    sonuc = true;
    sunucu.removeListener('error', hataIsleyici);
    /* Gerçek portu (OS atadıysa) oku ve ilet. */
    const adres = sunucu.address();
    basarili((adres && adres.port) || ilkPort);
  });
  sunucu.listen(ilkPort);
}

/* Tabla ölçüsü: 400 x 400 mm (40 x 40 cm) */
const TABLA = { gen: 400, yuk: 400 };

/* ---------- Malzeme / lazer presetleri ---------- */
const MALZEMELER = [
  { id: 'paslanmaz', ad: 'Paslanmaz Çelik', guc: 55, hiz: 900, gecis: 3, frekans: 30, dalga: 1064 },
  { id: 'pirinc', ad: 'Pirinç', guc: 45, hiz: 1100, gecis: 2, frekans: 28, dalga: 1064 },
  { id: 'aluminyum', ad: 'Alüminyum', guc: 60, hiz: 800, gecis: 4, frekans: 35, dalga: 1064 },
  { id: 'ahsap', ad: 'Ahşap (Lazer Gravür)', guc: 30, hiz: 1800, gecis: 1, frekans: 20, dalga: 10600 },
  { id: 'deri', ad: 'Deri', guc: 22, hiz: 2200, gecis: 1, frekans: 18, dalga: 10600 },
  { id: 'akrilik', ad: 'Akrilik', guc: 25, hiz: 2000, gecis: 1, frekans: 22, dalga: 10600 },
  { id: 'kaucuk', ad: 'Kauçuk Kaşe Tabanı', guc: 40, hiz: 1400, gecis: 2, frekans: 24, dalga: 10600 }
];

const FONTLAR = ['Plaka', 'Serif Klasik', 'Modern Sans', 'Teknik Mono', 'El Yazısı'];

/* ---------- Yardımcılar ---------- */
function jsonYaz(res, kod, govde) {
  const veri = JSON.stringify(govde);
  res.writeHead(kod, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(veri),
    'Cache-Control': 'no-store',
    'Access-Control-Allow-Origin': '*'
  });
  res.end(veri);
}

function govdeOku(req, limit = 2 * 1024 * 1024) {
  return new Promise((resolve, reject) => {
    let toplam = 0;
    const parcalar = [];
    req.on('data', (p) => {
      toplam += p.length;
      if (toplam > limit) {
        reject(new Error('Gövde çok büyük (limit 2MB)'));
        req.destroy();
        return;
      }
      parcalar.push(p);
    });
    req.on('end', () => {
      const metin = Buffer.concat(parcalar).toString('utf8');
      if (!metin.trim()) return resolve({});
      try {
        resolve(JSON.parse(metin));
      } catch (e) {
        reject(new Error('Geçersiz JSON gövdesi: ' + e.message));
      }
    });
    req.on('error', reject);
  });
}

function sayiDeger(v, varsayilan, min, maks) {
  const n = Number(v);
  if (!isFinite(n)) return varsayilan;
  return Math.min(maks, Math.max(min, n));
}

function metinTemizle(v, varsayilan = '') {
  if (typeof v !== 'string') return varsayilan;
  /* Satır sonları KORUNUR (çok satırlı kaşe metni), diğer kontrol karakterleri boşluğa çevrilir. */
  return v
    .replace(/\r\n?/g, '\n')
    .replace(/[\u0000-\u0009\u000b\u000c\u000e-\u001f\u007f]/g, ' ')
    .replace(/[ \t]{2,}/g, ' ')
    .split('\n')
    .map((s) => s.trim())
    .join('\n')
    .trim()
    .slice(0, 240);
}

/* ---------- G-code üretici (sunucu tarafı, bağımsız) ---------- */
/**
 * Kaşe işleme planı üretir.
 * @param {object} o { metin, font, boy, guc, hiz, gecis, malzeme, x, y, mod }
 */
function kasePlaniUret(o) {
  const metin = metinTemizle(o.metin) || 'KASE';
  const font = FONTLAR.includes(o.font) ? o.font : FONTLAR[0];
  const boy = sayiDeger(o.boy, 10, 2, 300);
  const guc = sayiDeger(o.guc, 50, 1, 100);
  const hiz = sayiDeger(o.hiz, 1000, 50, 8000);
  const gecis = Math.round(sayiDeger(o.gecis, 1, 1, 20));
  const mod = o.mod === 'kesim' ? 'kesim' : 'markalama';

  const malzeme = MALZEMELER.find((m) => m.id === o.malzeme) || null;

  /* Yerleşim: kaşe tabanı varsayılan 40x60 mm */
  const tabanGen = 40;
  const tabanYuk = 60;
  const xHam = Number(o.x);
  const yHam = Number(o.y);
  const x = sayiDeger(o.x, (TABLA.gen - tabanGen) / 2, 0, TABLA.gen - tabanGen);
  const y = sayiDeger(o.y, (TABLA.yuk - tabanYuk) / 2, 0, TABLA.yuk - tabanYuk);
  /* Kullanıcının HAM isteği tabla dışındaysa kırpılmadan önce yakalanır */
  const istenenDisi =
    (isFinite(xHam) && (xHam < 0 || xHam + tabanGen > TABLA.gen)) ||
    (isFinite(yHam) && (yHam < 0 || yHam + tabanYuk > TABLA.yuk));

  /* Karakter başına ilerleme: boy * 0.62 (plaka font oranı) */
  const karakterAralik = boy * 0.62;
  const satirlar = metin.split(/\r?\n/).slice(0, 6);
  const genislik = Math.max(...satirlar.map((s) => Math.max(1, s.length) * karakterAralik));

  /* Yol uzunluğu: her karakterin çevresi + geçiş sayısı */
  let yolMm = 0;
  for (const s of satirlar) {
    for (const ch of s) {
      if (ch === ' ') continue;
      yolMm += boy * 4.4; /* harf çevresi yaklaşımı */
    }
  }
  yolMm = Math.round(yolMm * gecis * 10) / 10;

  /* Süre: yol / hız (mm/s) + geçiş başına konumlanma payı */
  const hizMmSn = hiz / 60;
  const islemSn = yolMm / hizMmSn;
  const paySn = gecis * satirlar.length * 0.35;
  const sureSn = Math.round((islemSn + paySn) * 10) / 10;

  /* Enerji yoğunluğu (J/mm² yaklaşımı) */
  const yogunluk = Math.round(((guc / 100) * (1000 / hiz)) * 1000) / 10;

  return {
    metin,
    satirlar,
    font,
    boy,
    guc,
    hiz,
    gecis,
    mod,
    malzeme: malzeme ? malzeme.ad : 'Genel',
    malzemeId: malzeme ? malzeme.id : null,
    konum: { x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 },
    taban: { gen: tabanGen, yuk: tabanYuk },
    genislik: Math.round(genislik * 10) / 10,
    karakterAralik: Math.round(karakterAralik * 100) / 100,
    yolMm,
    sureSn,
    yogunluk,
    tabla: { ...TABLA },
    sinirAsimi: istenenDisi || x + tabanGen > TABLA.gen || y + tabanYuk > TABLA.yuk
  };
}

/**
 * Plandan G-code metni üretir.
 */
function gcodeUret(plan, baslik = 'NUMEX KASE') {
  const s = [];
  s.push('; ' + baslik);
  s.push('; Uretici: Numex Kaşe Stüdyo v' + SURUM);
  s.push('; Tarih: ' + new Date().toISOString());
  s.push('; Malzeme: ' + plan.malzeme + ' | Mod: ' + plan.mod);
  s.push('; Metin: ' + plan.metin.replace(/\s+/g, ' '));
  s.push('; Islem alani: ' + plan.taban.gen + ' x ' + plan.taban.yuk + ' mm');
  s.push('G21 ; mm');
  s.push('G90 ; mutlak konum');
  /* GRBL LAZER MODU (kritik):
     $32=1 olmadan M4 dinamik guc modu calismaz.
     M3 S0 (S sifirken spindle/lazer acma) GRBL'de gecersiz komuttur
     ve 'error:20 Unsupported command' uretir — KULLANILMAZ.
     Bu yuzden lazer is basinda BIR KEZ M4 ile acilir, is sonunda M5 ile kapanir. */
  s.push('$32=1 ; GRBL lazer modu');
  s.push('G0 X0 Y0');
  s.push('M5 ; lazer kapali (guvenli baslangic)');
  s.push('; --- isleme baslangic ---');

  /* GRBL S araligi 0-1000; guc %1-100 -> 10-1000 eslenir.
     S asla 0 gondermeyiz (S=0 lazeri kapatir, M4 zaten kapali sayilir). */
  const sDegeri = Math.max(1, Math.min(1000, Math.round(plan.guc * 10)));
  const ilerleme = Math.max(1, Math.min(8000, Math.round(plan.hiz)));

  const a = plan.karakterAralik;
  let px = plan.konum.x;

  for (let g = 0; g < plan.gecis; g++) {
    s.push('; gecis ' + (g + 1) + '/' + plan.gecis);
    let cx = px;
    let py = plan.konum.y;
    for (const satir of plan.satirlar) {
      for (const ch of satir) {
        if (ch === ' ') { cx += a; continue; }
        /* Her karakter kutusu: 4 köse (basit harf izi).
           Lazer karakter arasinda KAPATILMAZ — G0 hizli hareketle
           tasinir, boylece gereksiz M3/M5 ciftleri olusmaz.
           Isaretleme once lazeri acar, sonra tum karakterleri cizer,
           en sonda kapatir. */
        const x1 = Math.round(cx * 100) / 100;
        const y1 = Math.round(py * 100) / 100;
        const x2 = Math.round((cx + a * 0.78) * 100) / 100;
        const y2 = Math.round((py + plan.boy) * 100) / 100;
        s.push('G0 X' + x1 + ' Y' + y1);
        s.push('M4 S' + sDegeri + ' ; lazer ac');
        s.push('G1 X' + x2 + ' Y' + y1 + ' F' + ilerleme);
        s.push('G1 X' + x2 + ' Y' + y2);
        s.push('G1 X' + x1 + ' Y' + y2);
        s.push('G1 X' + x1 + ' Y' + y1);
        s.push('M5 ; lazer kapat');
        cx += a;
      }
      py += plan.boy * 1.4;
    }
    px += 0;
  }

  s.push('M5 ; lazer kapali');
  s.push('G0 X0 Y0');
  s.push('M2 ; program sonu');
  return s.join('\n') + '\n';
}

/* ---------- Statik dosya sunumu ---------- */
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.nc': 'text/plain; charset=utf-8',
  '.gcode': 'text/plain; charset=utf-8'
};

function statikSun(res, yolAdi) {
  /* Dizin kaçışını engelle */
  const guvenli = path.normalize(yolAdi).replace(/^([/\\])+/, '');
  const tam = path.join(PUBLIC_DIR, guvenli);
  if (!tam.startsWith(PUBLIC_DIR)) {
    return jsonYaz(res, 403, { hata: 'Erişim reddedildi' });
  }
  fs.stat(tam, (err, st) => {
    if (err || !st.isFile()) {
      return jsonYaz(res, 404, { hata: 'Bulunamadı', yol: yolAdi });
    }
    const ext = path.extname(tam).toLowerCase();
    res.writeHead(200, {
      'Content-Type': MIME[ext] || 'application/octet-stream',
      'Content-Length': st.size,
      'Cache-Control': 'no-cache'
    });
    fs.createReadStream(tam).pipe(res);
  });
}

/* ---------- Yönlendirme ---------- */
async function yonlendir(req, res) {
  const u = new URL(req.url, 'http://' + (req.headers.host || 'localhost'));
  const yol = decodeURIComponent(u.pathname);

  /* CORS ön uçuşu */
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    return res.end();
  }

  /* --- API --- */
  if (yol === '/api/saglik' && req.method === 'GET') {
    return jsonYaz(res, 200, {
      durum: 'calisiyor',
      uygulama: 'Numex Kaşe Stüdyo',
      surum: SURUM,
      tabla: TABLA,
      malzemeSayisi: MALZEMELER.length,
      zaman: new Date().toISOString()
    });
  }

  if (yol === '/api/malzemeler' && req.method === 'GET') {
    return jsonYaz(res, 200, { malzemeler: MALZEMELER, fontlar: FONTLAR, tabla: TABLA });
  }

  if (yol === '/api/kase-onizleme' && req.method === 'POST') {
    let govde;
    try {
      govde = await govdeOku(req);
    } catch (e) {
      return jsonYaz(res, 400, { hata: e.message });
    }
    const plan = kasePlaniUret(govde);
    if (plan.sinirAsimi) {
      return jsonYaz(res, 422, { hata: 'Kaşe tabla sınırlarını aşıyor', plan });
    }
    return jsonYaz(res, 200, {
      tamam: true,
      plan,
      gcodeSatirSayisi: gcodeUret(plan).split('\n').length - 1,
      uyari: plan.sureSn > 600 ? 'İşlem 10 dakikadan uzun sürüyor — güç/hız gözden geçirilmeli.' : null
    });
  }

  if (yol === '/api/gcode-kaydet' && req.method === 'POST') {
    let govde;
    try {
      govde = await govdeOku(req);
    } catch (e) {
      return jsonYaz(res, 400, { hata: e.message });
    }
    const plan = kasePlaniUret(govde);
    const gcode = typeof govde.gcode === 'string' && govde.gcode.trim()
      ? govde.gcode
      : gcodeUret(plan, metinTemizle(govde.baslik) || 'NUMEX KASE');

    const adHam = metinTemizle(govde.ad) || ('kase-' + Date.now());
    const ad = adHam.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 60);
    const dosyaAd = ad.endsWith('.nc') || ad.endsWith('.gcode') ? ad : ad + '.nc';

    if (!fs.existsSync(CIKTI_DIR)) fs.mkdirSync(CIKTI_DIR, { recursive: true });
    const tam = path.join(CIKTI_DIR, dosyaAd);
    fs.writeFileSync(tam, gcode, 'utf8');

    return jsonYaz(res, 201, {
      tamam: true,
      dosya: dosyaAd,
      bayt: Buffer.byteLength(gcode, 'utf8'),
      satir: gcode.split('\n').length - 1,
      plan
    });
  }

  if (yol === '/api/gcode-liste' && req.method === 'GET') {
    if (!fs.existsSync(CIKTI_DIR)) return jsonYaz(res, 200, { dosyalar: [] });
    const dosyalar = fs.readdirSync(CIKTI_DIR)
      .filter((f) => f.endsWith('.nc') || f.endsWith('.gcode'))
      .map((f) => {
        const st = fs.statSync(path.join(CIKTI_DIR, f));
        return { ad: f, bayt: st.size, tarih: st.mtime.toISOString() };
      })
      .sort((a, b) => b.tarih.localeCompare(a.tarih));
    return jsonYaz(res, 200, { dosyalar, adet: dosyalar.length });
  }

  if (yol === '/api/gcode-indir' && req.method === 'GET') {
    const ad = metinTemizle(u.searchParams.get('ad'));
    if (!ad || !/^[a-zA-Z0-9._-]+$/.test(ad)) {
      return jsonYaz(res, 400, { hata: 'Geçersiz dosya adı' });
    }
    const tam = path.join(CIKTI_DIR, ad);
    if (!tam.startsWith(CIKTI_DIR) || !fs.existsSync(tam)) {
      return jsonYaz(res, 404, { hata: 'G-code dosyası bulunamadı' });
    }
    const st = fs.statSync(tam);
    res.writeHead(200, {
      'Content-Type': 'text/plain; charset=utf-8',
      'Content-Length': st.size,
      'Content-Disposition': 'attachment; filename="' + ad + '"'
    });
    return fs.createReadStream(tam).pipe(res);
  }

  if (yol.startsWith('/api/')) {
    /* Uç nokta var ama yöntem yanlış mı?
       BILINEN liste artık TEK KAYNAKTAN geliyor (server/uclar.js) —
       uç eklerken iki yerde güncelleme derdi ve tutarsızlık kalmasın. */
    if (UCLAR_YOL.includes(yol)) {
      const izinli = (UCLAR.find((u) => u.yol === yol) || { yontem: [] }).yontem;
      res.setHeader('Allow', izinli.concat('OPTIONS').join(', '));
      return jsonYaz(res, 405, yontemDesteklenmiyor(yol, req.method));
    }
    /* Bilinmeyen API yoluna HER ZAMAN liste döner; istemci "ne var ne yok"
       diye bakabiliyor ve otomatik denetleyiciler de uçları görebiliyor. */
    res.setHeader('X-Numex-Uclar', UCLAR_YOL.join(','));
    return jsonYaz(res, 404, bilinmeyenUc(yol));
  }

  /* --- Statik arayüz --- */
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return jsonYaz(res, 405, { hata: 'Yöntem desteklenmiyor' });
  }
  if (yol === '/' || yol === '') return statikSun(res, 'index.html');
  return statikSun(res, yol);
}

/* ---------- Sunucu ---------- */
function olustur() {
  return http.createServer((req, res) => {
    yonlendir(req, res).catch((e) => {
      jsonYaz(res, 500, { hata: 'Sunucu hatası', detay: e.message });
    });
  });
}

if (require.main === module) {
  const sunucu = olustur();
  portBulVeDinle(sunucu, PORT, (gercekPort) => {
    console.log('[Numex Kaşe Stüdyo] sunucu hazır → http://localhost:' + PORT);
    console.log('[Numex Kaşe Stüdyo] arayüz      → http://localhost:' + PORT + '/');
    console.log('[Numex Kaşe Stüdyo] sağlık ucu   → http://localhost:' + PORT + '/api/saglik');
  });
  const kapat = () => sunucu.close(() => process.exit(0));
  process.on('SIGINT', kapat);
  process.on('SIGTERM', kapat);
}

/* Geriye dönük uyum: testler/araçlar farklı adlarla arayabilir.
   NOT: Bu modül bilinçli olarak YALNIZCA Node çekirdek modülleri (http, fs, path, url)
   kullanır. Burada express/static kurulum denemesi YAPILMAZ — geçmişte koşulsuz
   require('express') çağrısı modül yüklenirken asılı kalıyor ve testlerin beforeAll
   kancasını timeout'a düşürüyordu. Statik arayüz statikSun() ile servis ediliyor. */

// NUMEX_DEMO_LANDING — tarayıcıda görünen API demo sayfası
try {
  const __path = require('path');
  const __express = require('express');
  if (typeof app !== 'undefined' && app && typeof app.use === 'function') {
    app.use(__express.static(__path.join(__dirname, 'public')));
  }
} catch (err) { /* suppressed: err */ }
module.exports = {
  olustur,
  sunucuOlustur: olustur,
  istekIsleyici: (req, res) => {
    yonlendir(req, res).catch((e) => {
      jsonYaz(res, 500, { hata: 'Sunucu hatası', detay: e.message });
    });
  },
  kaseSunucu: olustur,
  kasePlaniUret,
  gcodeUret,
  MALZEMELER,
  FONTLAR,
  TABLA,
  SURUM
};
