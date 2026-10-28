import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { uygulamaOlustur } from '../app.js';

const app = uygulamaOlustur();

describe('GET /api/saglik', () => {
  it('200 döner ve çalışma durumunu bildirir', async () => {
    const yanit = await request(app).get('/api/saglik');
    expect(yanit.status).toBe(200);
    expect(yanit.body.basarili).toBe(true);
    expect(yanit.body.durum).toBe('calisiyor');
    expect(yanit.body.uygulama).toBe('Zümrüt Kuyumculuk');
  });

  it('JSON içerik tipi döner', async () => {
    const yanit = await request(app).get('/api/saglik');
    expect(yanit.headers['content-type']).toMatch(/application\/json/);
  });
});

describe('GET /api/urunler', () => {
  it('tüm ürünleri listeler', async () => {
    const yanit = await request(app).get('/api/urunler');
    expect(yanit.status).toBe(200);
    expect(yanit.body.basarili).toBe(true);
    expect(Array.isArray(yanit.body.veri)).toBe(true);
    expect(yanit.body.veri.length).toBeGreaterThan(0);
    expect(yanit.body.adet).toBe(yanit.body.veri.length);
  });

  it('kategori filtresi uygular', async () => {
    const yanit = await request(app).get('/api/urunler?kategori=bilezik');
    expect(yanit.status).toBe(200);
    expect(yanit.body.veri.length).toBeGreaterThan(0);
    expect(yanit.body.veri.every((u) => u.kategori === 'bilezik')).toBe(true);
  });

  it('bilinmeyen kategori boş liste döner (hata değil)', async () => {
    const yanit = await request(app).get('/api/urunler?kategori=olmayan');
    expect(yanit.status).toBe(200);
    expect(yanit.body.veri).toEqual([]);
    expect(yanit.body.adet).toBe(0);
  });

  it('tek ürünü id ile getirir', async () => {
    const yanit = await request(app).get('/api/urunler/1');
    expect(yanit.status).toBe(200);
    expect(yanit.body.veri.id).toBe(1);
    expect(typeof yanit.body.veri.ad).toBe('string');
  });

  it('olmayan ürün için 404 ve başarısız gövde döner', async () => {
    const yanit = await request(app).get('/api/urunler/99999');
    expect(yanit.status).toBe(404);
    expect(yanit.body.basarili).toBe(false);
    expect(yanit.body.hata.mesaj).toBeTruthy();
  });

  it('her ürün beklenen alanları taşır', async () => {
    const yanit = await request(app).get('/api/urunler');
    for (const urun of yanit.body.veri) {
      expect(urun).toHaveProperty('id');
      expect(urun).toHaveProperty('ad');
      expect(urun).toHaveProperty('kategori');
      expect(urun).toHaveProperty('gorsel');
    }
  });
});

describe('GET /api/kurlar', () => {
  it('döviz ve altın kurlarını listeler', async () => {
    const yanit = await request(app).get('/api/kurlar');
    expect(yanit.status).toBe(200);
    expect(yanit.body.basarili).toBe(true);
    expect(yanit.body.veri.length).toBeGreaterThanOrEqual(6);
  });

  it('her kurda alış, satış ve trend bilgisi bulunur', async () => {
    const yanit = await request(app).get('/api/kurlar');
    for (const kur of yanit.body.veri) {
      expect(typeof kur.alis).toBe('number');
      expect(typeof kur.satis).toBe('number');
      expect(['artis', 'dusus', 'sabit']).toContain(kur.trend);
      expect(kur.satis).toBeGreaterThanOrEqual(kur.alis);
    }
  });

  it('tek kuru kod ile getirir (küçük harf duyarsız)', async () => {
    const yanit = await request(app).get('/api/kurlar/usd');
    expect(yanit.status).toBe(200);
    expect(yanit.body.veri.kod).toBe('USD');
  });

  it('olmayan kur için 404 döner', async () => {
    const yanit = await request(app).get('/api/kurlar/xyz');
    expect(yanit.status).toBe(404);
    expect(yanit.body.basarili).toBe(false);
  });
});

describe('GET /api/iletisim', () => {
  it('adres, telefon ve çalışma saatlerini döner', async () => {
    const yanit = await request(app).get('/api/iletisim');
    expect(yanit.status).toBe(200);
    expect(yanit.body.veri.isletme.adres.tam).toContain('Merkez');
    expect(yanit.body.veri.isletme.adres.tam).toContain('Çarşı Caddesi');
    expect(yanit.body.veri.isletme.telefon.arama).toBe('+905000000000');
    expect(yanit.body.veri.calismaSaatleri.length).toBe(7);
    expect(yanit.body.veri.hizmetler.length).toBe(4);
  });

  it('görünen telefon numarası istenen numarayı içerir', async () => {
    const yanit = await request(app).get('/api/iletisim');
    expect(yanit.body.veri.isletme.telefon.gorunur).toBe('0500 000 00 00');
  });
});

describe('POST /api/iletisim', () => {
  it('geçerli formu kaydeder ve 201 döner', async () => {
    const yanit = await request(app).post('/api/iletisim').send({
      ad: 'Ahmet Yılmaz',
      telefon: '0500 000 00 33',
      eposta: 'ahmet@ornek.com',
      mesaj: 'Çeyrek altın fiyatı hakkında bilgi almak istiyorum.'
    });
    expect(yanit.status).toBe(201);
    expect(yanit.body.basarili).toBe(true);
    expect(yanit.body.veri.id).toMatch(/^MSG-/);
  });

  it('eksik alanlarda 422 ve alan bazlı hata döner', async () => {
    const yanit = await request(app).post('/api/iletisim').send({
      ad: 'A',
      telefon: '123',
      mesaj: 'kısa'
    });
    expect(yanit.status).toBe(422);
    expect(yanit.body.basarili).toBe(false);
    expect(yanit.body.hata.ayrintilar.ad).toBeTruthy();
    expect(yanit.body.hata.ayrintilar.telefon).toBeTruthy();
    expect(yanit.body.hata.ayrintilar.mesaj).toBeTruthy();
  });

  it('geçersiz e-posta 422 döner', async () => {
    const yanit = await request(app).post('/api/iletisim').send({
      ad: 'Zeynep Kaya',
      telefon: '0500 000 00 33',
      eposta: 'bozuk-eposta',
      mesaj: 'Bilezik fiyatları için bilgi rica ediyorum.'
    });
    expect(yanit.status).toBe(422);
    expect(yanit.body.hata.ayrintilar.eposta).toBeTruthy();
  });

  it('+90 biçimli telefonu kabul eder', async () => {
    const yanit = await request(app).post('/api/iletisim').send({
      ad: 'Mehmet Demir',
      telefon: '+90 500 000 00 33',
      mesaj: 'Döviz kuru hakkında bilgi almak istiyorum.'
    });
    expect(yanit.status).toBe(201);
  });
});

describe('Statik arayüz', () => {
  it('ana sayfa 200 ve HTML döner', async () => {
    const yanit = await request(app).get('/');
    expect(yanit.status).toBe(200);
    expect(yanit.headers['content-type']).toMatch(/text\/html/);
  });

  it('ana sayfa Zümrüt Kuyumculuk içeriğini taşır', async () => {
    const yanit = await request(app).get('/');
    expect(yanit.text).toContain('Zümrüt');
  });

  it('CSS dosyası servis edilir', async () => {
    const yanit = await request(app).get('/css/style.css');
    expect(yanit.status).toBe(200);
    expect(yanit.headers['content-type']).toMatch(/text\/css/);
  });

  it('JS dosyası servis edilir', async () => {
    const yanit = await request(app).get('/js/main.js');
    expect(yanit.status).toBe(200);
    expect(yanit.headers['content-type']).toMatch(/javascript/);
  });
});

describe('Bilinmeyen API yolu', () => {
  it('404 JSON döner (HTML değil)', async () => {
    const yanit = await request(app).get('/api/boyle-bir-yol-yok');
    expect(yanit.status).toBe(404);
    expect(yanit.body.basarili).toBe(false);
    expect(yanit.headers['content-type']).toMatch(/application\/json/);
  });
});
