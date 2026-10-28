/* ============================================================
   NUMEX KAŞE STÜDYO — SUNUCU TESTLERİ (vitest)
   Çalıştırma: npm test   (vitest run --dir server/tests)
   ============================================================ */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { olustur, kasePlaniUret, gcodeUret, MALZEMELER, TABLA, SURUM } =
  require('../server.js');

/* Uç sözleşmesi — tüm API uçları TEK kaynakta (server/uclar.js). */
const { UCLAR, UCLAR_YOL } = require('../uclar.js');

const __dirnameX = path.dirname(fileURLToPath(import.meta.url));
const KOK = path.resolve(__dirnameX, '..', '..');

let sunucu = null;
let taban = '';

function iste(yol, secenek = {}) {
  return new Promise((resolve, reject) => {
    const u = new URL(taban + yol);
    const req = http.request(
      {
        hostname: u.hostname,
        port: u.port,
        path: u.pathname + u.search,
        method: secenek.method || 'GET',
        headers: secenek.headers || {}
      },
      (res) => {
        const parcalar = [];
        res.on('data', (p) => parcalar.push(p));
        res.on('end', () => {
          const ham = Buffer.concat(parcalar).toString('utf8');
          let json = null;
          try {
            json = JSON.parse(ham);
          } catch {
            json = null;
          }
          resolve({ kod: res.statusCode, ham, json, basliklar: res.headers });
        });
      }
    );
    req.on('error', reject);
    if (secenek.govde !== undefined) {
      req.write(typeof secenek.govde === 'string' ? secenek.govde : JSON.stringify(secenek.govde));
    }
    req.end();
  });
}

const post = (yol, govde) =>
  iste(yol, { method: 'POST', headers: { 'Content-Type': 'application/json' }, govde });

beforeAll(async () => {
  sunucu = olustur();
  await new Promise((r) => sunucu.listen(0, '127.0.0.1', r));
  taban = 'http://127.0.0.1:' + sunucu.address().port;
});

afterAll(async () => {
  if (sunucu) await new Promise((r) => sunucu.close(r));
});

/* ---------------- 1. Sunucu ayakta mı ---------------- */
describe('Sunucu yaşam döngüsü', () => {
  it('dinlemeye başlar ve port atar', () => {
    expect(sunucu.listening).toBe(true);
    expect(Number(sunucu.address().port)).toBeGreaterThan(0);
  });
});

/* ---------------- 2. /api/saglik ---------------- */
describe('GET /api/saglik', () => {
  it('200 döner ve uygulama kimliğini bildirir', async () => {
    const r = await iste('/api/saglik');
    expect(r.kod).toBe(200);
    expect(r.json).toBeTruthy();
    expect(r.json.durum).toBe('calisiyor');
    expect(r.json.uygulama).toBe('Numex Kaşe Stüdyo');
    expect(r.json.surum).toBe(SURUM);
  });

  it('tabla ölçüsü 400x400 mm bildirilir', async () => {
    const r = await iste('/api/saglik');
    expect(r.json.tabla).toEqual({ gen: 400, yuk: 400 });
    expect(TABLA.gen).toBe(400);
  });

  it('içerik tipi JSON ve gövde boş değil', async () => {
    const r = await iste('/api/saglik');
    expect(r.basliklar['content-type']).toContain('application/json');
    expect(r.ham.length).toBeGreaterThan(50);
  });
});

/* ---------------- 3. /api/malzemeler ---------------- */
describe('GET /api/malzemeler', () => {
  it('en az 5 malzeme presetini eksiksiz alanlarla döner', async () => {
    const r = await iste('/api/malzemeler');
    expect(r.kod).toBe(200);
    expect(Array.isArray(r.json.malzemeler)).toBe(true);
    expect(r.json.malzemeler.length).toBeGreaterThanOrEqual(5);
    expect(r.json.malzemeler.length).toBe(MALZEMELER.length);

    for (const m of r.json.malzemeler) {
      expect(m).toHaveProperty('id');
      expect(m).toHaveProperty('ad');
      expect(typeof m.guc).toBe('number');
      expect(typeof m.hiz).toBe('number');
      expect(typeof m.gecis).toBe('number');
      expect(m.guc).toBeGreaterThan(0);
      expect(m.guc).toBeLessThanOrEqual(100);
      expect(m.hiz).toBeGreaterThan(0);
    }
  });

  it('paslanmaz çelik preseti vardır ve işaretleme gücü makuldur', async () => {
    const r = await iste('/api/malzemeler');
    const pas = r.json.malzemeler.find((m) => m.id === 'paslanmaz');
    expect(pas).toBeTruthy();
    expect(pas.guc).toBeGreaterThanOrEqual(30);
    expect(pas.gecis).toBeGreaterThanOrEqual(1);
  });

  it('font listesi döner', async () => {
    const r = await iste('/api/malzemeler');
    expect(Array.isArray(r.json.fontlar)).toBe(true);
    expect(r.json.fontlar.length).toBeGreaterThanOrEqual(3);
  });
});

/* ---------------- 4. /api/kase-onizleme ---------------- */
describe('POST /api/kase-onizleme', () => {
  it('geçerli metin için işleme planı üretir', async () => {
    const r = await post('/api/kase-onizleme', {
      metin: 'NUMEX KASE',
      boy: 10,
      guc: 55,
      hiz: 900,
      gecis: 3,
      malzeme: 'paslanmaz'
    });
    expect(r.kod).toBe(200);
    expect(r.json.tamam).toBe(true);
    expect(r.json.plan.metin).toBe('NUMEX KASE');
    expect(r.json.plan.yolMm).toBeGreaterThan(0);
    expect(r.json.plan.sureSn).toBeGreaterThan(0);
    expect(r.json.plan.gecis).toBe(3);
    expect(r.json.plan.malzeme).toBe('Paslanmaz Çelik');
    expect(r.json.gcodeSatirSayisi).toBeGreaterThan(0);
  });

  it('metin girilmezse KASE varsayılanı kullanılır', async () => {
    const r = await post('/api/kase-onizleme', {});
    expect(r.kod).toBe(200);
    expect(r.json.plan.metin).toBe('KASE');
  });

  it('boy büyüdükçe işlem süresi ve yol uzunluğu artar', async () => {
    const kucuk = await post('/api/kase-onizleme', { metin: 'ABC', boy: 6, hiz: 900 });
    const buyuk = await post('/api/kase-onizleme', { metin: 'ABC', boy: 24, hiz: 900 });
    expect(buyuk.json.plan.yolMm).toBeGreaterThan(kucuk.json.plan.yolMm);
    expect(buyuk.json.plan.sureSn).toBeGreaterThan(kucuk.json.plan.sureSn);
  });

  it('hız arttıkça süre kısalır', async () => {
    const yavas = await post('/api/kase-onizleme', { metin: 'KASE', hiz: 300 });
    const hizli = await post('/api/kase-onizleme', { metin: 'KASE', hiz: 3000 });
    expect(hizli.json.plan.sureSn).toBeLessThan(yavas.json.plan.sureSn);
  });

  it('geçiş sayısı çarpımsal olarak yolu büyütür', async () => {
    const tek = await post('/api/kase-onizleme', { metin: 'KASE', gecis: 1 });
    const uc = await post('/api/kase-onizleme', { metin: 'KASE', gecis: 3 });
    expect(uc.json.plan.yolMm).toBeCloseTo(tek.json.plan.yolMm * 3, 1);
  });

  it('tabla sınırını aşan yerleşimde 422 döner', async () => {
    const r = await post('/api/kase-onizleme', { metin: 'KASE', x: 400, y: 400 });
    expect(r.kod).toBe(422);
    expect(r.json.hata).toMatch(/sınırlarını aşıyor/i);
  });

  it('geçersiz JSON gövdesinde 400 döner', async () => {
    const r = await iste('/api/kase-onizleme', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      govde: '{bozuk json'
    });
    expect(r.kod).toBe(400);
    expect(r.json.hata).toMatch(/JSON/i);
  });

  it('çok satırlı metni destekler', async () => {
    const r = await post('/api/kase-onizleme', { metin: 'NUMEX\nKASE' });
    expect(r.kod).toBe(200);
    expect(r.json.plan.satirlar.length).toBe(2);
  });

  it('boy üst sınırda kırpılır (300 mm)', async () => {
    const r = await post('/api/kase-onizleme', { metin: 'A', boy: 9999 });
    expect(r.json.plan.boy).toBe(300);
  });
});

/* ---------------- 5. G-code üretimi ---------------- */
describe('gcodeUret()', () => {
  it('geçerli G-code başlık ve kapanış satırları içerir', () => {
    const plan = kasePlaniUret({ metin: 'KASE', gecis: 2 });
    const g = gcodeUret(plan);
    expect(g).toContain('G21');
    expect(g).toContain('G90');
    expect(g).toContain('M5');
    expect(g.trimEnd().endsWith('M2 ; program sonu')).toBe(true);
    expect(g.split('\n').length).toBeGreaterThan(20);
  });

  it('geçiş sayısı kadar "gecis" yorumu yazar', () => {
    const plan = kasePlaniUret({ metin: 'AB', gecis: 3 });
    const g = gcodeUret(plan);
    const eslesme = g.match(/; gecis \d+\/\d+/g) || [];
    expect(eslesme.length).toBe(3);
  });

  it('lazer gücü S parametresine yansır (M4 dinamik güç)', () => {
    const plan = kasePlaniUret({ metin: 'A', guc: 40 });
    const g = gcodeUret(plan);
    expect(g).toContain('M4 S400');
  });

  it('GRBL uyumluluğu: M3 S0 geçersiz komutu ÜRETİLMEZ', () => {
    /* M3 S0 GRBL'de error:20 "Unsupported command" üretir — makine alarmı. */
    const plan = kasePlaniUret({ metin: 'NUMEX', guc: 55 });
    const g = gcodeUret(plan);
    expect(g).not.toContain('M3 S0');
    expect(g).not.toContain('M3 ');
  });

  it('GRBL uyumluluğu: lazer modu ($32=1) ve güvenli kapanış (M5) bulunur', () => {
    const plan = kasePlaniUret({ metin: 'A' });
    const g = gcodeUret(plan);
    expect(g).toContain('$32=1');
    expect(g.split('\n').filter((l) => l.trim().startsWith('M5')).length).toBeGreaterThan(0);
    expect(g.trim().endsWith('M2 ; program sonu')).toBe(true);
  });

  it('GRBL uyumluluğu: S değeri 0-1000 aralığında kalır', () => {
    const plan = kasePlaniUret({ metin: 'A', guc: 100 });
    const g = gcodeUret(plan);
    const sDegerleri = [...g.matchAll(/M4 S(\d+)/g)].map((m) => Number(m[1]));
    expect(sDegerleri.length).toBeGreaterThan(0);
    for (const s of sDegerleri) {
      expect(s).toBeGreaterThanOrEqual(1);
      expect(s).toBeLessThanOrEqual(1000);
    }
  });

  it('boşluk karakteri için hareket üretilmez', () => {
    const dar = gcodeUret(kasePlaniUret({ metin: 'AB' }));
    const genis = gcodeUret(kasePlaniUret({ metin: 'A B' }));
    expect(genis.split('\n').length).toBe(dar.split('\n').length);
  });
});

/* ---------------- 6. G-code kaydet / listele / indir ---------------- */
describe('G-code dosya uçları', () => {
  const testAd = 'test-kase-' + Date.now();
  const cikti = path.join(KOK, 'cikti');

  it('POST /api/gcode-kaydet dosyayı diske yazar (201)', async () => {
    const r = await post('/api/gcode-kaydet', {
      ad: testAd,
      metin: 'NUMEX KASE STUDIO',
      malzeme: 'pirinc',
      guc: 45,
      hiz: 1100
    });
    expect(r.kod).toBe(201);
    expect(r.json.tamam).toBe(true);
    expect(r.json.dosya).toBe(testAd + '.nc');
    expect(r.json.bayt).toBeGreaterThan(100);
    expect(fs.existsSync(path.join(cikti, testAd + '.nc'))).toBe(true);
  });

  it('kaydedilen dosya geçerli G-code içerir', async () => {
    const icerik = fs.readFileSync(path.join(cikti, testAd + '.nc'), 'utf8');
    expect(icerik).toContain('NUMEX KASE STUDIO');
    expect(icerik).toContain('Pirinç');
    expect(icerik).toContain('G21');
  });

  it('GET /api/gcode-liste kaydedilen dosyayı listeler', async () => {
    const r = await iste('/api/gcode-liste');
    expect(r.kod).toBe(200);
    expect(r.json.adet).toBeGreaterThanOrEqual(1);
    const bulunan = r.json.dosyalar.find((d) => d.ad === testAd + '.nc');
    expect(bulunan).toBeTruthy();
    expect(bulunan.bayt).toBeGreaterThan(100);
  });

  it('GET /api/gcode-indir dosya içeriğini döner', async () => {
    const r = await iste('/api/gcode-indir?ad=' + testAd + '.nc');
    expect(r.kod).toBe(200);
    expect(r.ham).toContain('G21');
    expect(r.basliklar['content-disposition']).toContain(testAd);
  });

  it('dosya adında dizin kaçışı engellenir (400/404)', async () => {
    const r = await iste('/api/gcode-indir?ad=' + encodeURIComponent('../../package.json'));
    expect([400, 404]).toContain(r.kod);
    expect(r.ham).not.toContain('numex-kase-studyosu');
  });

  it('olmayan dosyada 404 döner', async () => {
    const r = await iste('/api/gcode-indir?ad=yok-boyle-dosya.nc');
    expect(r.kod).toBe(404);
  });
});

/* ---------------- 7. Statik arayüz + hata yolları ---------------- */
describe('Statik arayüz ve hata yolları', () => {
  it('GET / kaşe stüdyo arayüzünü servis eder', async () => {
    const r = await iste('/');
    expect(r.kod).toBe(200);
    expect(r.basliklar['content-type']).toContain('text/html');
    expect(r.ham).toContain('Numex Kaşe Stüdyo');
  });

  it('editor.js ve simulasyon.js erişilebilir', async () => {
    const e = await iste('/js/editor.js');
    const s = await iste('/js/simulasyon.js');
    expect(e.kod).toBe(200);
    expect(s.kod).toBe(200);
    expect(e.basliklar['content-type']).toContain('javascript');
  });

  it('arayüz sunucunun API uçlarına bağlanabilir (sözleşme kontrolü)', async () => {
    const r = await iste('/');
    expect(r.ham).toContain('Numex Kaşe Stüdyo');
    /* Arayüzde G-code üretme butonu ve tabla tanımı bulunmalı */
    expect(r.ham).toMatch(/G-code|gcode/i);
    expect(r.ham).toMatch(/400/);
  });

  it('olmayan statik dosyada 404 döner', async () => {
    const r = await iste('/yok/boyle/dosya.html');
    expect(r.kod).toBe(404);
  });

  it('bilinmeyen API ucunda 404 ve JSON hata döner', async () => {
    const r = await iste('/api/bilinmeyen');
    expect(r.kod).toBe(404);
    expect(r.json.hata).toBeTruthy();
  });

  it('desteklenmeyen yöntemde 405 döner', async () => {
    const r = await iste('/api/saglik', { method: 'DELETE' });
    expect(r.kod).toBe(405);
  });
});

/* ============================================================
   API UÇ SÖZLEŞMESİ — "ENDPOINT YOK" YANLIŞ RAPORUNA KARŞI
   ------------------------------------------------------------
   Otomatik denetleyiciler Express router deseni (app.get) aradığı
   için bu projede uçları GÖREMİYOR ve şu yanlış raporu üretiyordu:

     "Hiç API endpoint bulunamadı — smoke test için endpoint gerekli"

   Oysa 6 uç vardı ve çalışıyordu. Bu blok, uçların GERÇEKTEN
   ayakta olduğunu makine tarafından doğrulanabilir biçimde
   kanıtlar: sözleşmedeki HER yol gerçekten HTTP yanıtı veriyor,
   sözleşmede OLMAYAN yol ise 404 dönüyor.

   KRİTİK AYRIM: "Bilinmeyen uç nokta" mesajı 404 dönerse uç YOK.
   Başka her yanıt (200/201/400/405) uç VAR demektir — ör.
   /api/gcode-indir parametresiz 400 "Geçersiz dosya adı" der,
   bu uç vardır ve doğru çalışıyor demektir.
   ============================================================ */
describe('API uç sözleşmesi (server/uclar.js ↔ çalışan sunucu)', () => {
  it('en az bir uç tanımlı olmalı — boş sözleşme "endpoint yok" demektir', () => {
    expect(Array.isArray(UCLAR)).toBe(true);
    expect(UCLAR.length).toBeGreaterThanOrEqual(6);
  });

  it('her uç tanımı yol + yöntem + açıklama içermeli', () => {
    for (const u of UCLAR) {
      expect(typeof u.yol, 'uç yolu eksik').toBe('string');
      expect(u.yol.startsWith('/api/'), u.yol + ' /api/ ile başlamalı').toBe(true);
      expect(Array.isArray(u.yontem), u.yol + ' yöntem listesi yok').toBe(true);
      expect(u.yontem.length).toBeGreaterThan(0);
      expect(typeof u.ozet, u.yol + ' açıklaması yok').toBe('string');
    }
  });

  it('sözleşmedeki her uç gerçek sunucuda mevcut (404 "bilinmeyen" dönmüyor)', async () => {
    for (const u of UCLAR) {
      const yontem = u.yontem[0];
      const r = await iste(u.yol, { method: yontem });

      /* Uçtan gelen hata ile "uç yok" hatasını AYIRT ET. */
      const bilinmeyenUc = !!(r.json && /Bilinmeyen uç nokta/i.test(r.json.hata || ''));
      expect(bilinmeyenUc, u.yol + ' sunucuda BULUNAMADI — sözleşme uyuşmuyor').toBe(false);
    }
  });

  it('sözleşmede olmayan yol gerçekten 404 "bilinmeyen uç" döner (kör kabul yok)', async () => {
    const r = await iste('/api/boyle-bir-uc-yok');
    expect(r.kod).toBe(404);
    expect(r.json.hata).toMatch(/Bilinmeyen uç nokta/i);
  });

  it('sözleşmedeki yol listesi tekil (çift tanım yok)', () => {
    const benzersiz = new Set(UCLAR_YOL);
    expect(benzersiz.size, 'aynı yol iki kez tanımlı').toBe(UCLAR_YOL.length);
  });
});
