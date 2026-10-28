/**
 * Numex Candy — Sunucu / API entegrasyon testleri
 * ------------------------------------------------------------
 * Express uçlarını GERÇEK bir HTTP sunucusu üzerinden (rastgele boş port)
 * uçtan uca doğrular: durum kodları, JSON şemaları, doğrulama reddi,
 * 404/400 dönüşleri ve statik dosya servisi.
 *
 * Motor testlerinin (engine.test.js) kapsamadığı sunucu katmanını kapatır.
 *
 * Çalıştırma: npm test
 * Bağımlılık: YOK — node:test (yerleşik) + global fetch (Node 18+) + express.
 */

import { test, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

import uygulamaOlustur, { uygulamaOlustur as uygulamaYap } from '../server/index.js';
import { tabloyuSifirla } from '../server/leaderboard.js';
import { allLevels, getLevel } from '../server/levels.js';

let sunucu;
let kok;

/** Sunucuyu 0. portta (işletim sistemi boş port seçer) başlatır. */
before(async () => {
  const app = uygulamaYap();
  await new Promise((cozumle) => {
    sunucu = app.listen(0, '127.0.0.1', cozumle);
  });
  kok = `http://127.0.0.1:${sunucu.address().port}`;
});

after(async () => {
  await new Promise((cozumle) => sunucu.close(cozumle));
});

beforeEach(() => {
  tabloyuSifirla();
});

/** Kısa yardımcı: JSON isteği at, { durum, govde } döner. */
async function iste(yol, secenekler = {}) {
  const yanit = await fetch(kok + yol, secenekler);
  const tip = yanit.headers.get('content-type') || '';
  const govde = tip.includes('application/json') ? await yanit.json() : await yanit.text();
  return { durum: yanit.status, govde, yanit };
}

/** JSON gövdesiyle POST. */
function postJson(yol, govde) {
  return iste(yol, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(govde),
  });
}

// ---------------------------------------------------------------
// Sağlık & temel uçlar
// ---------------------------------------------------------------

test('GET /api/saglik → 200 ve çalışıyor durumu', async () => {
  const { durum, govde } = await iste('/api/saglik');
  assert.equal(durum, 200);
  assert.equal(govde.durum, 'calisiyor');
  assert.equal(govde.oyun, 'Numex Candy');
  assert.equal(govde.bolumSayisi, allLevels().length);
});

test('GET /api/sekerler → 6 şeker tipi ve zaruri alanlar', async () => {
  const { durum, govde } = await iste('/api/sekerler');
  assert.equal(durum, 200);
  assert.ok(Array.isArray(govde));
  assert.equal(govde.length, 6);
  for (const s of govde) {
    assert.equal(typeof s.id, 'number');
    assert.equal(typeof s.ad, 'string');
    assert.match(s.renk, /^#[0-9a-f]{6}$/i);
  }
});

test('GET /api/levels → tüm bölümlerin metası (30 adet)', async () => {
  const { durum, govde } = await iste('/api/levels');
  assert.equal(durum, 200);
  assert.ok(Array.isArray(govde));
  assert.equal(govde.length, 30);
  // `uret` fonksiyonu JSON'a sızmamalı (levelMeta sözleşmesi)
  for (const l of govde) {
    assert.equal(typeof l.id, 'number');
    assert.equal(typeof l.ad, 'string');
    assert.equal(l.uret, undefined, 'iç fonksiyon istemciye sızdı');
    assert.equal(l.yildizlar.length, 3);
  }
});

// ---------------------------------------------------------------
// Tek bölüm ve tahta uçları
// ---------------------------------------------------------------

test('GET /api/levels/:id → 200, tahta düzeni ve jel döner', async () => {
  const { durum, govde } = await iste('/api/levels/1');
  assert.equal(durum, 200);
  assert.equal(govde.id, 1);
  assert.ok(Array.isArray(govde.tahtaDuzeni));
  assert.ok(Array.isArray(govde.jel));
  const level = getLevel(1);
  assert.equal(govde.tahtaDuzeni.length, level.satir);
  assert.equal(govde.tahtaDuzeni[0].length, level.sutun);
});

test('GET /api/levels/:id/board → tahta + jel, levelId doğru', async () => {
  const { durum, govde } = await iste('/api/levels/5/board');
  assert.equal(durum, 200);
  assert.equal(govde.levelId, 5);
  assert.ok(Array.isArray(govde.tahta));
  assert.ok(Array.isArray(govde.jel));
});

test('GET /api/levels/999 → 404 Bölüm bulunamadı', async () => {
  const { durum, govde } = await iste('/api/levels/999');
  assert.equal(durum, 404);
  assert.equal(govde.hata, 'Bölüm bulunamadı');
});

test('GET /api/levels/abc → 404 (sayısal olmayan id)', async () => {
  const { durum } = await iste('/api/levels/abc');
  assert.equal(durum, 404);
});

test('GET /api/levels/0 → 404 (sıfır geçerli bölüm değil)', async () => {
  const { durum } = await iste('/api/levels/0');
  assert.equal(durum, 404);
});

// ---------------------------------------------------------------
// Skor tablosu (leaderboard) — okuma
// ---------------------------------------------------------------

test('GET /api/leaderboard/:id → başlangıçta boş liste', async () => {
  const { durum, govde } = await iste('/api/leaderboard/3');
  assert.equal(durum, 200);
  assert.equal(govde.levelId, 3);
  assert.deepEqual(govde.kayitlar, []);
});

test('GET /api/leaderboard/999 → 404', async () => {
  const { durum } = await iste('/api/leaderboard/999');
  assert.equal(durum, 404);
});

// ---------------------------------------------------------------
// Skor tablosu — yazma (POST) doğrulamaları
// ---------------------------------------------------------------

test('POST /api/leaderboard geçerli kaydı 201 ile ekler', async () => {
  const { durum, govde } = await postJson('/api/leaderboard', {
    levelId: 1,
    isim: 'NumexOyuncu',
    skor: 4200,
    yildiz: 2,
  });
  assert.equal(durum, 201);
  assert.equal(govde.basarili, true);
  assert.equal(govde.kayitlar.length, 1);
  assert.equal(govde.kayitlar[0].isim, 'NumexOyuncu');
  assert.equal(govde.kayitlar[0].skor, 4200);
  assert.equal(govde.kayitlar[0].yildiz, 2);
});

test('POST kaydı skor azalan sırada döner', async () => {
  await postJson('/api/leaderboard', { levelId: 2, isim: 'A', skor: 100, yildiz: 0 });
  await postJson('/api/leaderboard', { levelId: 2, isim: 'B', skor: 900, yildiz: 3 });
  const { govde } = await postJson('/api/leaderboard', { levelId: 2, isim: 'C', skor: 500, yildiz: 1 });
  const skorlar = govde.kayitlar.map((k) => k.skor);
  assert.deepEqual(skorlar, [...skorlar].sort((a, b) => b - a));
  assert.equal(skorlar[0], 900);
});

test('POST negatif skor 400 ile reddedilir', async () => {
  const { durum, govde } = await postJson('/api/leaderboard', {
    levelId: 1,
    isim: 'Hileci',
    skor: -50,
    yildiz: 3,
  });
  assert.equal(durum, 400);
  assert.equal(govde.hata, 'Geçersiz skor');
});

test('POST skoru sayı olmayan değer 400 ile reddedilir', async () => {
  const { durum, govde } = await postJson('/api/leaderboard', {
    levelId: 1,
    isim: 'Metin',
    skor: '9999',
    yildiz: 3,
  });
  assert.equal(durum, 400);
  assert.equal(govde.hata, 'Geçersiz skor');
});

test('POST Infinity skoru 400 ile reddedilir', async () => {
  // JSON.stringify(Infinity) → null üretir; bunun yerine NaN benzeri
  // özel olmayan bir gönderimle sınırı sınarız: sonsuz JSON'da temsil edilemez.
  const { durum } = await postJson('/api/leaderboard', {
    levelId: 1,
    isim: 'Infinity',
    skor: null,
    yildiz: 1,
  });
  assert.equal(durum, 400);
});

test('POST geçersiz bölüm 400 ile reddedilir', async () => {
  const { durum, govde } = await postJson('/api/leaderboard', {
    levelId: 999,
    isim: 'Kayıp',
    skor: 100,
    yildiz: 1,
  });
  assert.equal(durum, 400);
  assert.equal(govde.hata, 'Geçersiz bölüm');
});

test('POST levelId eksikse 400 ile reddedilir', async () => {
  const { durum } = await postJson('/api/leaderboard', { isim: 'X', skor: 10, yildiz: 0 });
  assert.equal(durum, 400);
});

test('POST isim yoksa "Gizli Şeker" atanır', async () => {
  const { durum, govde } = await postJson('/api/leaderboard', {
    levelId: 1,
    skor: 250,
    yildiz: 1,
  });
  assert.equal(durum, 201);
  assert.equal(govde.kayitlar[0].isim, 'Gizli Şeker');
});

test('POST uzun isim 20 karaktere kırpılır', async () => {
  const uzun = 'A'.repeat(80);
  const { durum, govde } = await postJson('/api/leaderboard', {
    levelId: 1,
    isim: uzun,
    skor: 300,
    yildiz: 1,
  });
  assert.equal(durum, 201);
  assert.equal(govde.kayitlar[0].isim.length, 20);
});

test('POST boşluklardan oluşan isim "Gizli Şeker" olur', async () => {
  const { govde } = await postJson('/api/leaderboard', {
    levelId: 1,
    isim: '     ',
    skor: 300,
    yildiz: 1,
  });
  assert.equal(govde.kayitlar[0].isim, 'Gizli Şeker');
});

test('skor tablosu en fazla 10 kayıt tutar', async () => {
  for (let i = 0; i < 14; i++) {
    await postJson('/api/leaderboard', { levelId: 4, isim: `P${i}`, skor: i * 10, yildiz: 0 });
  }
  const { govde } = await iste('/api/leaderboard/4');
  assert.equal(govde.kayitlar.length, 10);
  // en yüksek skorlar kalmış olmalı → en düşük kalan 40
  assert.equal(govde.kayitlar[9].skor, 40);
});

// ---------------------------------------------------------------
// Statik dosya sunumu ve SPA yönlendirmesi
// ---------------------------------------------------------------

test('GET / → ana arayüz (HTML) servis edilir', async () => {
  const { durum, govde, yanit } = await iste('/');
  assert.equal(durum, 200);
  assert.match(yanit.headers.get('content-type') || '', /text\/html/);
  assert.match(govde, /<html/i);
});

test('statik js/css no-cache başlığıyla sunulur', async () => {
  const { durum, yanit } = await iste('/js/oyun.js');
  assert.equal(durum, 200);
  assert.match(yanit.headers.get('cache-control') || '', /no-cache/);
});

test('ana arayüz (index.html) no-cache ile sunulur', async () => {
  const { yanit } = await iste('/');
  assert.match(yanit.headers.get('cache-control') || '', /no-cache/);
});

test('motor modülleri /engine üzerinden servis edilir (tek kaynak)', async () => {
  const { durum, yanit } = await iste('/engine/board.js');
  assert.equal(durum, 200);
  assert.match(yanit.headers.get('content-type') || '', /javascript/);
});

test('bilinmeyen API yolu SPA index.html düşürmez (404)', async () => {
  const { durum } = await iste('/api/olmayan-uc');
  assert.equal(durum, 404);
});

test('bilinmeyen arayüz yolu index.html düşer (SPA)', async () => {
  const { durum, govde } = await iste('/nasil-oynanir');
  assert.equal(durum, 200);
  assert.match(govde, /<html/i);
});

test('64kb üzeri JSON gövdesi 413 ile JSON hata döner', async () => {
  const buyuk = 'x'.repeat(80 * 1024);
  const { durum, govde } = await postJson('/api/leaderboard', {
    levelId: 1,
    isim: buyuk,
    skor: 1,
    yildiz: 0,
  });
  assert.equal(durum, 413);
  assert.equal(govde.hata, 'Gönderilen veri çok büyük');
});

test('bozuk JSON gövdesi 400 ve JSON hata döner (HTML değil)', async () => {
  const yanit = await fetch(kok + '/api/leaderboard', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{ bu bozuk bir json',
  });
  assert.equal(yanit.status, 400);
  assert.match(yanit.headers.get('content-type') || '', /application\/json/);
  const govde = await yanit.json();
  assert.ok(govde.hata, 'hata mesajı boş olmamalı');
});

test('hata yanıtlarında yığın izi (stack) sızmaz', async () => {
  const { govde } = await postJson('/api/leaderboard', { levelId: 1, skor: -1 });
  const metin = JSON.stringify(govde);
  assert.ok(!/at Object|node_modules|\\\\|\.js:\d+/.test(metin), 'yanıt iç yığın izi sızdırıyor');
});

// ---------------------------------------------------------------
// Varsayılan dışa aktarım — iki import da aynı fabrikayı vermeli
// ---------------------------------------------------------------

test('varsayılan ve isimli dışa aktarım aynı fabrikayı verir', () => {
  assert.equal(typeof uygulamaOlustur, 'function');
  assert.equal(uygulamaOlustur, uygulamaYap);
  const app = uygulamaOlustur();
  assert.equal(typeof app, 'function'); // Express app çağrılabilir
  assert.equal(typeof app.use, 'function');
});
