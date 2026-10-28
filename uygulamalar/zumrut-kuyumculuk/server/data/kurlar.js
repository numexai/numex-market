'use strict';

/**
 * Zümrüt Kuyumculuk — döviz ve altın kurları.
 *
 * DİKKAT: Aşağıdaki değerler DEMO/simülasyon verisidir; gerçek piyasa
 * verisi DEĞİLDİR. Canlıya çıkmadan önce TCMB / serbest piyasa beslemesi
 * bağlanmalıdır (bkz. `kurBeslemesiCek`).
 *
 * Değişim yüzdesi (degisim) yukarı/aşağı yönü belirler; arayüz buna göre
 * yeşil (artış) veya kırmızı (düşüş) ok gösterir.
 */

const KURLAR = [
  { kod: 'USD', ad: 'Amerikan Doları', alis: 41.28, satis: 41.42, degisim: 0.12, birim: '₺' },
  { kod: 'EUR', ad: 'Euro', alis: 44.95, satis: 45.12, degisim: -0.08, birim: '₺' },
  { kod: 'GBP', ad: 'İngiliz Sterlini', alis: 52.6, satis: 52.85, degisim: 0.21, birim: '₺' },
  { kod: 'GA', ad: 'Gram Altın', alis: 3950.0, satis: 3985.0, degisim: 0.35, birim: '₺' },
  { kod: 'CEYREK', ad: 'Çeyrek Altın', alis: 6480.0, satis: 6540.0, degisim: 0.28, birim: '₺' },
  { kod: 'YARIM', ad: 'Yarım Altın', alis: 12960.0, satis: 13080.0, degisim: 0.3, birim: '₺' }
];

/**
 * Değişim yönünü sınıflandırır.
 * @param {number} degisim
 * @returns {'artis'|'dusus'|'sabit'}
 */
function trendHesapla(degisim) {
  const sayi = Number(degisim);
  if (!Number.isFinite(sayi) || sayi === 0) return 'sabit';
  return sayi > 0 ? 'artis' : 'dusus';
}

/**
 * Bir sayıyı Türk Lirası biçiminde (tr-TR) metne çevirir.
 * @param {number} deger
 * @param {string} [birim]
 * @returns {string} örn. "41,28 ₺"
 */
function fiyatFormatla(deger, birim = '₺') {
  const sayi = Number(deger);
  if (!Number.isFinite(sayi)) return '-';
  return `${sayi.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${birim}`;
}

/**
 * Kurları döner; her kayda hesaplanmış `trend` ve `alisMetin`/`satisMetin` ekler.
 * @returns {Array<object>}
 */
function kurlariGetir() {
  return KURLAR.map((k) => ({
    ...k,
    trend: trendHesapla(k.degisim),
    alisMetin: fiyatFormatla(k.alis, k.birim),
    satisMetin: fiyatFormatla(k.satis, k.birim)
  }));
}

/**
 * Tek kur kaydını kod ile bulur (büyük/küçük harf duyarsız).
 * @param {string} kod
 * @returns {object|null}
 */
function kurGetir(kod) {
  if (typeof kod !== 'string') return null;
  const aranan = kod.trim().toUpperCase();
  const bulunan = KURLAR.find((k) => k.kod === aranan);
  return bulunan ? { ...bulunan, trend: trendHesapla(bulunan.degisim) } : null;
}

/**
 * Demo amaçlı kur hareketi simülasyonu — her kaydı ±%0.15 bandında oynatır.
 * Gerçek besleme bağlandığında bu fonksiyon devre dışı bırakılmalıdır.
 * @returns {Array<object>} güncellenmiş kurlar
 */
function kurHareketiniSimuleEt() {
  KURLAR.forEach((k) => {
    const sapma = (Math.random() - 0.5) * 0.3; // -%0.15 .. +%0.15
    const yeniDegisim = Number((k.degisim + sapma).toFixed(2));
    k.degisim = Math.max(-9.99, Math.min(9.99, yeniDegisim));
  });
  return kurlariGetir();
}

module.exports = {
  KURLAR,
  trendHesapla,
  fiyatFormatla,
  kurlariGetir,
  kurGetir,
  kurHareketiniSimuleEt
};
