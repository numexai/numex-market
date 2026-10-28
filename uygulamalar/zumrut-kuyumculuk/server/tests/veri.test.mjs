// Vitrin İstanbul'da; test işçisi farklı saat diliminde koşarsa gün/saat
// hesabı kayar. Beklentileri ortama bağımlı bırakmamak için TZ sabitlenir.
process.env.TZ = 'Europe/Istanbul';

import { describe, it, expect } from 'vitest';
import { kurlariGetir, kurGetir, trendHesapla, fiyatFormatla, kurHareketiniSimuleEt } from '../data/kurlar.js';
import { iletisimFormuDogrula, bugunAcikMi, ISLETME, CALISMA_SAATLERI } from '../data/iletisim.js';

describe('trendHesapla', () => {
  it('pozitif değişimi artis döner', () => {
    expect(trendHesapla(0.5)).toBe('artis');
  });

  it('negatif değişimi dusus döner', () => {
    expect(trendHesapla(-0.2)).toBe('dusus');
  });

  it('sıfır değişimi sabit döner', () => {
    expect(trendHesapla(0)).toBe('sabit');
  });

  it('geçersiz değerde sabit döner', () => {
    expect(trendHesapla('abc')).toBe('sabit');
    expect(trendHesapla(undefined)).toBe('sabit');
  });
});

describe('fiyatFormatla', () => {
  it('Türkçe biçimde virgüllü fiyat üretir', () => {
    expect(fiyatFormatla(41.28)).toBe('41,28 ₺');
  });

  it('binlik ayırıcıyı uygular', () => {
    expect(fiyatFormatla(3950)).toContain('3.950');
  });

  it('geçersiz değerde tire döner', () => {
    expect(fiyatFormatla('abc')).toBe('-');
  });
});

describe('kurlariGetir', () => {
  it('en az 6 kur kaydı döner', () => {
    expect(kurlariGetir().length).toBeGreaterThanOrEqual(6);
  });

  it('her kayıtta trend ve metin alanları hesaplanır', () => {
    for (const kur of kurlariGetir()) {
      expect(['artis', 'dusus', 'sabit']).toContain(kur.trend);
      expect(typeof kur.alisMetin).toBe('string');
      expect(typeof kur.satisMetin).toBe('string');
    }
  });

  it('satış fiyatı alış fiyatından küçük olmaz', () => {
    for (const kur of kurlariGetir()) {
      expect(kur.satis).toBeGreaterThanOrEqual(kur.alis);
    }
  });
});

describe('kurGetir', () => {
  it('kodu büyük/küçük harf duyarsız bulur', () => {
    expect(kurGetir('usd').kod).toBe('USD');
    expect(kurGetir('USD').kod).toBe('USD');
  });

  it('olmayan kod için null döner', () => {
    expect(kurGetir('XYZ')).toBeNull();
    expect(kurGetir(null)).toBeNull();
  });
});

describe('kurHareketiniSimuleEt', () => {
  it('kurları döner ve değişim değerleri sayı kalır', () => {
    const sonuc = kurHareketiniSimuleEt();
    expect(sonuc.length).toBeGreaterThanOrEqual(6);
    for (const kur of sonuc) {
      expect(typeof kur.degisim).toBe('number');
      expect(Number.isFinite(kur.degisim)).toBe(true);
    }
  });
});

describe('iletisimFormuDogrula', () => {
  it('tam geçerli formu onaylar', () => {
    const sonuc = iletisimFormuDogrula({
      ad: 'Ahmet Yılmaz',
      telefon: '0500 000 00 33',
      eposta: 'a@ornek.com',
      mesaj: 'Bilgi almak istiyorum, teşekkürler.'
    });
    expect(sonuc.gecerli).toBe(true);
    expect(sonuc.hatalar).toEqual({});
  });

  it('kısa adı reddeder', () => {
    const sonuc = iletisimFormuDogrula({ ad: 'Al', telefon: '05000000033', mesaj: 'Yeterince uzun bir mesaj.' });
    expect(sonuc.gecerli).toBe(false);
    expect(sonuc.hatalar.ad).toBeTruthy();
  });

  it('geçersiz telefonu reddeder', () => {
    const sonuc = iletisimFormuDogrula({ ad: 'Ahmet Yılmaz', telefon: '12345', mesaj: 'Yeterince uzun bir mesaj.' });
    expect(sonuc.gecerli).toBe(false);
    expect(sonuc.hatalar.telefon).toBeTruthy();
  });

  it('05xx, 5xx ve +90 biçimlerini kabul eder', () => {
    const temel = { ad: 'Ahmet Yılmaz', mesaj: 'Yeterince uzun bir mesaj.' };
    expect(iletisimFormuDogrula({ ...temel, telefon: '05000000033' }).gecerli).toBe(true);
    expect(iletisimFormuDogrula({ ...temel, telefon: '5000000033' }).gecerli).toBe(true);
    expect(iletisimFormuDogrula({ ...temel, telefon: '+905000000033' }).gecerli).toBe(true);
  });

  it('e-posta opsiyoneldir ama girildiyse geçerli olmalı', () => {
    const temel = { ad: 'Ahmet Yılmaz', telefon: '05000000033', mesaj: 'Yeterince uzun bir mesaj.' };
    expect(iletisimFormuDogrula(temel).gecerli).toBe(true);
    expect(iletisimFormuDogrula({ ...temel, eposta: 'bozuk' }).gecerli).toBe(false);
  });

  it('boş veriyle çağrıldığında çökmez ve hata döner', () => {
    const sonuc = iletisimFormuDogrula();
    expect(sonuc.gecerli).toBe(false);
    expect(Object.keys(sonuc.hatalar).length).toBeGreaterThan(0);
  });
});

describe('bugunAcikMi', () => {
  /**
   * NOT: Vitest testleri işçi sürecinde koşar ve bu süreçte saat dilimi UTC
   * olabilir. Bu yüzden hedef günü önce bulup, o günün tarihini ÜRETEREK
   * kuruyoruz — sabit tarih yazmak ortama bağımlı kırılganlık yaratıyordu.
   * @param {number} hedefGun 0=Pazar ... 6=Cumartesi
   * @param {number} saat
   * @param {number} dakika
   * @returns {Date}
   */
  function gunTarihi(hedefGun, saat = 12, dakika = 0) {
    const d = new Date(2026, 2, 1, saat, dakika, 0); // 1 Mart 2026
    const fark = (hedefGun - d.getDay() + 7) % 7;
    return new Date(2026, 2, 1 + fark, saat, dakika, 0);
  }

  it('çalışma saatleri haftanın 7 gününü kapsar', () => {
    expect(CALISMA_SAATLERI.length).toBe(7);
  });

  it('Pazar günü kapalı döner', () => {
    const pazar = gunTarihi(0);
    expect(pazar.getDay()).toBe(0); // test ön kabulü
    const sonuc = bugunAcikMi(pazar);
    expect(sonuc.acik).toBe(false);
    expect(sonuc.acilis).toBeNull();
  });

  it('hafta içi öğle saatinde açık döner', () => {
    const pazartesi = gunTarihi(1);
    expect(pazartesi.getDay()).toBe(1); // test ön kabulü
    const sonuc = bugunAcikMi(pazartesi);
    expect(sonuc.acik).toBe(true);
    expect(sonuc.gun).toBe('Pazartesi');
  });

  it('Cumartesi 17:00 açık, 18:30 kapalı döner (kısa gün)', () => {
    const cumartesiErken = gunTarihi(6, 17, 0);
    const cumartesiGeç = gunTarihi(6, 18, 30);
    expect(cumartesiErken.getDay()).toBe(6);
    expect(bugunAcikMi(cumartesiErken).acik).toBe(true);
    expect(bugunAcikMi(cumartesiGeç).acik).toBe(false);
  });

  it('gece saatinde kapalı döner', () => {
    const pazartesiGece = gunTarihi(1, 23, 30);
    expect(bugunAcikMi(pazartesiGece).acik).toBe(false);
  });

  it('açılış saatinden hemen önce kapalı döner', () => {
    const erken = gunTarihi(1, 8, 0);
    expect(bugunAcikMi(erken).acik).toBe(false);
  });

  it('kapanış saatinde kapalı döner (yarı açık aralık)', () => {
    const kapanis = gunTarihi(1, 19, 30);
    expect(bugunAcikMi(kapanis).acik).toBe(false);
  });
});

describe('İşletme bilgileri', () => {
  it('telefon numarası müşterinin verdiği numarayla eşleşir', () => {
    expect(ISLETME.telefon.gorunur.replace(/\s/g, '')).toBe('05000000000');
  });

  it('tel: bağlantısı uluslararası biçimde', () => {
    expect(ISLETME.telefon.arama).toBe('+905000000000');
  });

  it('adres Merkez/İstanbul içerir', () => {
    expect(ISLETME.adres.tam).toContain('Merkez');
    expect(ISLETME.adres.tam).toContain('İstanbul');
    expect(ISLETME.adres.tam).toContain('Örnek Mahallesi');
    expect(ISLETME.adres.tam).toContain('Çarşı Caddesi');
  });
});
