'use strict';

/**
 * Zümrüt Kuyumculuk — kurumsal iletişim bilgileri ve açılış saatleri.
 * Tek doğruluk kaynağı: arayüz de bu veriyi API üzerinden çeker.
 */

const ISLETME = {
  ad: 'Zümrüt Kuyumculuk',
  slogan: 'Altın ve dövizde güvenin adresi',
  adres: {
    mahalle: 'Örnek Mahallesi',
    cadde: 'Çarşı Caddesi',
    no: 'No: 1',
    ilce: 'Merkez',
    il: 'İstanbul',
    tam: 'Örnek Mahallesi, Çarşı Caddesi No: 1, Merkez / İstanbul'
  },
  telefon: {
    gorunur: '0500 000 00 00',
    // tel: bağlantısı için uluslararası biçim (arama başlatır)
    arama: '+905000000000'
  },
  whatsapp: '905000000000',
  eposta: 'info@ornek.com',
  kurulusYili: 1998,
  haritaSorgu: 'Örnek Mahallesi Çarşı Caddesi No 1 Merkez İstanbul'
};

/**
 * Haftanın günleri — indeks sırası `Date.prototype.getDay()` ile BİREBİR aynı olmalı:
 * 0: Pazar, 1: Pazartesi, 2: Salı, 3: Çarşamba, 4: Perşembe, 5: Cuma, 6: Cumartesi.
 * (Bu sıra bozulursa gün eşlemesi kayar — testler bunu korur.)
 */
const CALISMA_SAATLERI = [
  { gun: 'Pazar', acilis: null, kapanis: null }, // kapalı
  { gun: 'Pazartesi', acilis: '09:30', kapanis: '19:30' },
  { gun: 'Salı', acilis: '09:30', kapanis: '19:30' },
  { gun: 'Çarşamba', acilis: '09:30', kapanis: '19:30' },
  { gun: 'Perşembe', acilis: '09:30', kapanis: '19:30' },
  { gun: 'Cuma', acilis: '09:30', kapanis: '19:30' },
  { gun: 'Cumartesi', acilis: '09:30', kapanis: '18:00' }
];

/** Hizmet başlıkları — site ve API aynı listeyi kullanır. */
const HIZMETLER = [
  {
    anahtar: 'altin-alim-satim',
    baslik: 'Altın Alım & Satım',
    aciklama: 'Has, bilezik, çeyrek ve ziynet altında günün serbest piyasa kuru üzerinden şeffaf işlem.'
  },
  {
    anahtar: 'doviz',
    baslik: 'Döviz İşlemleri',
    aciklama: 'Dolar, euro ve sterlin alım-satımında hızlı, belgeli ve kurumsal hizmet.'
  },
  {
    anahtar: 'kuyum-urunleri',
    baslik: 'Kuyum Ürünleri',
    aciklama: '22 ayar bilezik, kolye, yüzük ve setlerde geniş vitrin; özel sipariş imkânı.'
  },
  {
    anahtar: 'danismanlik',
    baslik: 'Yatırım Danışmanlığı',
    aciklama: 'Altın ve döviz yatırımı planlaması için birebir yönlendirme ve portföy takibi.'
  }
];

/**
 * Bugün açık mıyız? Sunucu saatine göre hesaplar.
 * @param {Date} [tarih] test edilebilirlik için dışarıdan verilebilir
 * @returns {{acik: boolean, gun: string, acilis: string|null, kapanis: string|null}}
 */
/**
 * Verilen anı sunucunun YEREL saatine göre gün/saat parçalarına ayırır.
 * Not: Vitrin İstanbul'da; sunucu İstanbul saat diliminde çalışır. Test
 * ortamında tutarlılık için `TZ=Europe/Istanbul` ayarlanır (bkz. vitest.config.js).
 * @param {Date} tarih
 * @returns {{gun: number, saat: number, dakika: number}} gun: 0=Pazar ... 6=Cumartesi
 */
function zamaniParcala(tarih) {
  return { gun: tarih.getDay(), saat: tarih.getHours(), dakika: tarih.getMinutes() };
}

function bugunAcikMi(tarih = new Date()) {
  const { gun, saat, dakika } = zamaniParcala(tarih);
  const kayit = CALISMA_SAATLERI[gun];
  const saatMetni = `${String(saat).padStart(2, '0')}:${String(dakika).padStart(2, '0')}`;

  if (!kayit || !kayit.acilis) {
    return { acik: false, gun: kayit ? kayit.gun : '-', acilis: null, kapanis: null, saat: saatMetni };
  }
  const acik = saatMetni >= kayit.acilis && saatMetni < kayit.kapanis;
  return { acik, gun: kayit.gun, acilis: kayit.acilis, kapanis: kayit.kapanis, saat: saatMetni };
}

/**
 * İletişim formu girişini doğrular.
 * @param {{ad?:string, telefon?:string, eposta?:string, mesaj?:string}} veri
 * @returns {{gecerli: boolean, hatalar: Record<string,string>}}
 */
function iletisimFormuDogrula(veri = {}) {
  const hatalar = {};
  const ad = typeof veri.ad === 'string' ? veri.ad.trim() : '';
  const telefon = typeof veri.telefon === 'string' ? veri.telefon.trim() : '';
  const eposta = typeof veri.eposta === 'string' ? veri.eposta.trim() : '';
  const mesaj = typeof veri.mesaj === 'string' ? veri.mesaj.trim() : '';

  if (ad.length < 3) {
    hatalar.ad = 'Ad soyad en az 3 karakter olmalıdır.';
  }

  // Türkiye telefon biçimleri: sabit hat (021x/022x/03xx...) VE mobil (05xx),
  // ayrıca +90 / 90 ülke kodlu yazımlar. Rakam dışını at, uluslararası kodu soy.
  let rakamlar = telefon.replace(/\D/g, '');
  if (rakamlar.length === 12 && rakamlar.startsWith('90')) {
    rakamlar = rakamlar.slice(2); // 90 → yerel 10/11 haneli biçime indir
  } else if (rakamlar.length === 13 && rakamlar.startsWith('090')) {
    rakamlar = rakamlar.slice(2); // 0902... → 02...
  }
  // 11 hane 0 ile başlıyorsa yerel biçim (0 + 10 hane). Kalanı 10 haneli olmalı.
  const yerel = rakamlar.startsWith('0') ? rakamlar.slice(1) : rakamlar;
  const gecerliTelefon =
    yerel.length === 10 &&
    (/^5\d{9}$/.test(yerel) || // mobil: 5xx xxx xx xx
      /^2\d{9}$/.test(yerel) || // sabit hat: 212/216/222...
      /^3\d{9}$/.test(yerel) || // sabit hat: 312/342/362...
      /^4\d{9}$/.test(yerel) || // sabit hat: 412/422...
      /^8\d{9}$/.test(yerel)); // coğrafi olmayan: 800/850...
  if (!gecerliTelefon) {
    hatalar.telefon = 'Geçerli bir telefon numarası giriniz (örn. 0500 000 00 00 veya 05xx xxx xx xx).';
  }

  if (eposta && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(eposta)) {
    hatalar.eposta = 'Geçerli bir e-posta adresi giriniz.';
  }

  if (mesaj.length < 10) {
    hatalar.mesaj = 'Mesajınız en az 10 karakter olmalıdır.';
  }

  return { gecerli: Object.keys(hatalar).length === 0, hatalar };
}

module.exports = {
  ISLETME,
  CALISMA_SAATLERI,
  HIZMETLER,
  bugunAcikMi,
  iletisimFormuDogrula
};
