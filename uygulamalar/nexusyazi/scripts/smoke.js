// NexusYazı smoke testi — npm test ile çalışır (çalışmakta olan sunucuya bağımlı DEĞİLDİR).
// server.js'i `require` edip API uçlarını İÇERİDEN başlatır ve doğrular.
// Böylece "API endpoint bulunamadı / smoke test için endpooint yok" alarmlarına
// tekrarlanabilir, kaynağından (gömülü sunucu) kanıt üretir.
'use strict';
const http = require('http');

// Her çalıştırmada çakışmayı önlemek için rastgele yüksek bir port kullan.
const PORT = 13200 + Math.floor(Math.random() * 500);

// 1) Sunucuyu KENDİ portumuzda başlat (require => module.exports.start).
const { start } = require('../server.js');
start(PORT);

function get(p) {
  return new Promise((resolve, reject) => {
    http.get('http://localhost:' + PORT + p, (res) => {
      let b = '';
      res.setEncoding('utf8');
      res.on('data', (c) => (b += c));
      res.on('end', () => resolve({ status: res.statusCode, body: b }));
    }).on('error', (e) => reject(e));
  });
}

// Sunucunun ayağa kalkmasını bekle (listen callback'ten sonra istek).
function untilUp(attempts) {
  return new Promise((resolve) => {
    const t = () => get('/api/health')
      .then(() => resolve())
      .catch(() => (attempts-- > 0 ? setTimeout(t, 120) : resolve()));
    setTimeout(t, 100);
  });
}

(async () => {
  let fail = 0;

  // 2) Bağlantı kurulana kadar bekle (default 15 x 120ms).
  await untilUp(15);

  // 3) Sağlık ucu
  try {
    const h = await get('/api/health');
    const o = JSON.parse(h.body);
    const ok = h.status === 200 && o.ok === true && o.app === 'nexusyazi';
    console.log((ok ? 'PASS' : 'FAIL') + '  /api/health  -> ' + h.status + ' ' + h.body);
    if (!ok) fail++;
  } catch (e) { console.log('FAIL  /api/health  -> ' + e.message); fail++; }

  // 4) Meta ucu (REST endpoint varligini kanitlar)
  try {
    const m = await get('/api/meta');
    const o = JSON.parse(m.body);
    const ok = m.status === 200 && o.surum && o.ad === 'NexusYazı';
    console.log((ok ? 'PASS' : 'FAIL') + '  /api/meta    -> ' + m.status + ' ' + m.body);
    if (!ok) fail++;
  } catch (e) { console.log('FAIL  /api/meta  -> ' + e.message); fail++; }

  // 5) Ana sayfa (statik arayüz 200 + beklenen iskelet)
  try {
    const r = await get('/');
    const ok = r.status === 200 && /nexusyazi/i.test(r.body) && /btnToc/.test(r.body) && /tocPanel/.test(r.body);
    console.log((ok ? 'PASS' : 'FAIL') + '  GET /        -> ' + r.status + ' (index + toc degiskenleri)');
    if (!ok) fail++;
  } catch (e) { console.log('FAIL  GET /  -> ' + e.message); fail++; }

  console.log(fail === 0 ? '\nSMOKE: TAMAM (3 dogrulama gecti — API uçlari gömülü sunucuda)' : '\nSMOKE: HATA (' + fail + ' dogrulama basarisiz)');
  process.exit(fail === 0 ? 0 : 1);
})();
