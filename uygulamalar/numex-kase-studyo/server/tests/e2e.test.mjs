/* ============================================================
   NUMEX KAŞE STÜDYO — UÇTAN UCA KABUL TESTLERİ (vitest)
   Çalıştırma: npx vitest run --dir server/tests

   Bu dosya "kağıt üstünde doğru" değil, GERÇEKTEN ÇALIŞIYOR
   kanıtını üretir:
     1) Arayüz <-> sunucu köprüsü (public/js/api.js) sağlık ucuna
        gerçek HTTP ile bağlanır.
     2) Arayüzün index.html'inde köprü dosyası VE G-code butonu
        gerçekten yüklü mü (sözleşme kontrolü).
     3) Metin -> önizleme -> G-code kaydet -> listede gör ->
        indir -> içerik doğru zinciri baştan sona yürür.
     4) Sunucu kapalıyken arayüz çökmez, nazik hata döner.
   ============================================================ */
import { describe, it, expect, beforeAll, afterAll, vi, afterEach } from 'vitest';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { kopruYukle } from './kopru-yardimci.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const KOK = path.resolve(__dirname, '..', '..');
const PUBLIC_DIR = path.join(KOK, 'public');
const CIKTI_DIR = path.join(KOK, 'cikti');

/* Global fetch gibi geçici olarak ezilen maddeleri her testten sonra geri al:
   stub'ın diğer describe bloklarındaki canlı HTTP testlerine sızmasını önler. */
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

let sunucu;
let PORT;
let apiModulu;

/* ---------- Gerçek HTTP yardımcıları ---------- */
function iste(yol, secenek = {}) {
  return new Promise((cozum, red) => {
    const istekNesnesi = http.request(
      {
        host: '127.0.0.1',
        port: PORT,
        path: yol,
        method: secenek.method || 'GET',
        headers: secenek.headers || {}
      },
      (res) => {
        const parcalar = [];
        res.on('data', (p) => parcalar.push(p));
        res.on('end', () => {
          const ham = Buffer.concat(parcalar).toString('utf8');
          let json = null;
          try { json = JSON.parse(ham); } catch { json = null; }
          cozum({ kod: res.statusCode, basliklar: res.headers, ham, json });
        });
      }
    );
    istekNesnesi.on('error', red);
    if (secenek.govde) istekNesnesi.write(secenek.govde);
    istekNesnesi.end();
  });
}
function post(yol, govde) {
  const ham = typeof govde === 'string' ? govde : JSON.stringify(govde);
  return iste(yol, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(ham) },
    govde: ham
  });
}

/* ---------- Sunucuyu gerçekten ayağa kaldır ---------- */
beforeAll(async () => {
  const modul = await import('../server.js');
  /* Sunucuyu HER ZAMAN geçerli bir istek işleyiciyle kur.
     (Daha önce handler'sız kuruluyordu → tüm istekler asılı kalıp
     testleri timeout'a düşürüyordu.) */
  sunucu = await new Promise((cozum) => {
    const s =
      typeof modul.sunucuOlustur === 'function'
        ? modul.sunucuOlustur()
        : typeof modul.olustur === 'function'
          ? modul.olustur()
          : http.createServer(
              modul.istekIsleyici ||
                modul.kaseSunucu ||
                ((req, res) => {
                  res.writeHead(500, { 'Content-Type': 'application/json' });
                  res.end(JSON.stringify({ hata: 'istek işleyici bulunamadı' }));
                })
            );
    s.listen(0, '127.0.0.1', () => cozum(s));
  });
  PORT = sunucu.address().port;

  /* Arayüz köprüsünü Node bağlamında yükle (tarayıcı global'leri taklit).
     location, GERÇEK dinlenen porta bağlanır — köprü göreli yolları bu
     tabandan çözer, aksi halde istekler hedefsiz kalıp sessizce hata döner. */
  apiModulu = kopruYukle({ kokDizin: KOK, port: PORT }).api;
});

afterAll(async () => {
  if (sunucu) await new Promise((r) => sunucu.close(r));
});

/* ============================================================
   1. ARAYÜZ <-> SUNUCU KÖPRÜSÜ GERÇEKTEN BAĞLANIYOR MU
   ============================================================ */
describe('Arayüz köprüsü (public/js/api.js) canlı sunucuya bağlanır', () => {
  it('köprü dosyası vardır ve KaseAPI tanımlar', () => {
    const dosya = path.join(PUBLIC_DIR, 'js', 'api.js');
    expect(fs.existsSync(dosya)).toBe(true);
    expect(typeof apiModulu).toBe('object');
  });

  /* Bu testler köprüyü canlı sunucuya bağlar. Köprü fetch'i ÇAĞRI ANINDA
     çözer (fetchBul) ve gerçek global'e bakar — bu yüzden başka bir test
     bloğunun vi.stubGlobal ile fetch'i ezmesi buraya SIZMAMALIDIR.
     afterEach zaten geri alıyor; ek olarak burada fetch'in canlı olduğunu
     doğrulayıp anlaşılır hata veriyoruz (sessiz "false to be true" yerine). */
  it('KaseAPI.saglik() gerçek HTTP ile 200 ve sürüm bilgisi alır', async () => {
    const canliFetch = globalThis.fetch;
    expect(typeof canliFetch, 'globalThis.fetch yaşamalı (stub sızmış)').toBe('function');

    const s = await apiModulu.saglik();
    expect(s, 'köprü nazik hata döndü — sunucu ayakta mı?').toBeTruthy();
    expect(s.tamam, 'sağlık ucu yanıt vermedi: ' + JSON.stringify(s)).toBe(true);
    expect(s.kod).toBe(200);
    expect(s.veri).toHaveProperty('surum');
    expect(s.veri.durum).toBeTruthy();
  });

  it('KaseAPI.malzemeler() preset listesini arayüze taşır', async () => {
    const s = await apiModulu.malzemeler();
    expect(s.tamam).toBe(true);
    expect(Array.isArray(s.veri.malzemeler)).toBe(true);
    expect(s.veri.malzemeler.length).toBeGreaterThanOrEqual(5);
  });

  it('sunucu kapalıyken köprü ÇÖKMEZ, nazik hata döner', async () => {
    /* DİKKAT — SIZINTI KORUMASI:
       vi.stubGlobal global fetch'i DEĞİŞTİRİR. afterEach temizlese de,
       bu test paralel koşumda AYNI ANDA çalışan diğer test dosyasının
       canlı isteklerini bozabiliyordu ("expected false to be true").
       Çözüm: stub'ı try/finally ile sarmalayıp bu test biter bitmez
       ORİJİNAL fetch'i geri koymak — afterEach'e güvenmeden. */
    const orijinalFetch = globalThis.fetch;
    vi.stubGlobal('fetch', () => Promise.reject(new Error('ECONNREFUSED')));
    try {
      const s = await apiModulu.saglik();
      expect(s.tamam).toBe(false);
      expect(s.hata).toMatch(/ulaşılamadı|Sunucu/i);
    } finally {
      vi.stubGlobal('fetch', orijinalFetch);
      vi.unstubAllGlobals();
    }
  });
});

/* ============================================================
   2. ARAYÜZ DOSYASI KÖPRÜYÜ GERÇEKTEN YÜKLER Mİ
   ============================================================ */
describe('index.html arayüz sözleşmesi', () => {
  let html;
  beforeAll(() => {
    html = fs.readFileSync(path.join(PUBLIC_DIR, 'index.html'), 'utf8');
  });

  it('api.js köprüsünü script olarak yükler', () => {
    expect(html).toMatch(/js\/api\.js/);
  });

  it('G-code üretme butonu ve 400 mm tabla tanımı içerir', () => {
    expect(html).toMatch(/btnGcode/);
    expect(html).toMatch(/400/);
    expect(html).toMatch(/Numex Kaşe Stüdyo/);
  });

  it('statik yol ile gerçekten servis edilir (HTTP 200)', async () => {
    const r = await iste('/js/api.js');
    expect(r.kod).toBe(200);
    expect(r.basliklar['content-type']).toContain('javascript');
    expect(r.ham).toContain('KaseAPI');
  });
});

/* ============================================================
   3. UÇTAN UCA İŞ AKIŞI: metin → önizleme → kaydet → liste → indir
   ============================================================ */
describe('Uçtan uca iş akışı (gerçek dosya sistemiyle)', () => {
  const isAdi = 'kabul-e2e-' + Date.now();

  it('1) metin JSON olarak gönderilince önizleme planı üretilir', async () => {
    const r = await post('/api/kase-onizleme', {
      metin: 'NUMEX E2E',
      font: 'Plaka',
      boy: 20,
      guc: 45,
      hiz: 1100,
      gecis: 2
    });
    expect(r.kod).toBe(200);
    expect(r.json.plan.sureSn).toBeGreaterThan(0);
    expect(r.json.plan.yolMm).toBeGreaterThan(0);
    expect(r.json.plan.satirlar.length).toBeGreaterThanOrEqual(1);
  });

  it('2) üretilen G-code diske yazılır ve gerçekten var olur', async () => {
    const r = await post('/api/gcode-kaydet', {
      ad: isAdi,
      metin: 'NUMEX E2E',
      malzeme: 'paslanmaz',
      guc: 55,
      hiz: 900,
      gecis: 20
    });
    expect(r.kod).toBe(201);
    expect(r.json.tamam).toBe(true);
    expect(r.json.dosya).toBe(isAdi + '.nc');

    const yazilan = path.join(CIKTI_DIR, isAdi + '.nc');
    expect(fs.existsSync(yazilan)).toBe(true);
    const icerik = fs.readFileSync(yazilan, 'utf8');
    expect(icerik).toContain('G21');
    expect(icerik).toContain('G90');
    expect(icerik.trimEnd().endsWith('M2 ; program sonu')).toBe(true);
  });

  it('3) kaydedilen dosya listede görünür', async () => {
    const r = await iste('/api/gcode-liste');
    expect(r.kod).toBe(200);
    const bulunan = r.json.dosyalar.find((d) => d.ad === isAdi + '.nc');
    expect(bulunan).toBeTruthy();
    expect(bulunan.bayt).toBeGreaterThan(100);
  });

  it('4) dosya indirilir ve içerik bozulmamıştır', async () => {
    const r = await iste('/api/gcode-indir?ad=' + isAdi + '.nc');
    expect(r.kod).toBe(200);
    expect(r.ham).toContain('NUMEX E2E');
    expect(r.ham).toContain('G21');
    expect(r.basliklar['content-disposition']).toContain(isAdi);
  });
});

/* ============================================================
   4. GÜVENLİK: dizin kaçışı ve bozuk girdi
   ============================================================ */
describe('Girdi güvenliği', () => {
  it('dizin kaçışı denemesi paket dosyasını sızdırmaz', async () => {
    const r = await iste('/api/gcode-indir?ad=' + encodeURIComponent('../../package.json'));
    expect([400, 404]).toContain(r.kod);
    expect(r.ham).not.toContain('numex-kase-studyosu');
  });

  it('bozuk JSON gövdesi 400 ile karşılanır', async () => {
    const r = await post('/api/kase-onizleme', '{bozuk');
    expect(r.kod).toBe(400);
  });

  it('tabla sınırını aşan yerleşim 422 ile reddedilir', async () => {
    const r = await post('/api/kase-onizleme', { metin: 'X', x: 500, y: 500 });
    expect(r.kod).toBe(422);
  });
});
