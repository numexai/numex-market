'use strict';

/**
 * Zümrüt Kuyumculuk — ürün envanteri.
 *
 * Kök dizindeki `data/urunler.json` dosyası, statik sitenin (file:// ile
 * açıldığında fetch yapamadığı durumlar için) kullandığı kopyadır.
 * Sunucu tarafı tek doğruluk kaynağı bu modüldür; ikisi `data/urunler.json`
 * ile senkron tutulur.
 */

const URUNLER = [
  // ---- Bilezik ----
  { id: 1, ad: '22 Ayar Burgu Bilezik', kategori: 'bilezik', fiyatMetni: 'Has fiyatı ile', gorsel: 'assets/img/bilezik-1.jpg', etiket: 'Çok Satan' },
  { id: 2, ad: '22 Ayar Ajurlu Bilezik', kategori: 'bilezik', fiyatMetni: 'Gram bazlı fiyatlandırma', gorsel: 'assets/img/bilezik-2.jpg', etiket: 'İşçilikli' },
  { id: 3, ad: '22 Ayar Kalın Burma Bilezik', kategori: 'bilezik', fiyatMetni: 'Has fiyatı ile', gorsel: 'assets/img/bilezik-3.jpg', etiket: '' },
  { id: 4, ad: '14 Ayar Mega Bilezik', kategori: 'bilezik', fiyatMetni: 'Gram bazlı fiyatlandırma', gorsel: 'assets/img/bilezik-4.jpg', etiket: '' },

  // ---- Kolye ----
  { id: 5, ad: '22 Ayar İnce Zincir Kolye', kategori: 'kolye', fiyatMetni: 'Has fiyatı ile', gorsel: 'assets/img/kolye-1.jpg', etiket: '' },
  { id: 6, ad: 'Tek Taş Kalpli Kolye Seti', kategori: 'kolye', fiyatMetni: 'Set fiyatı', gorsel: 'assets/img/kolye-2.jpg', etiket: 'Hediye Seti' },
  { id: 7, ad: '22 Ayar İtalyans Set (Kolye + Küpe)', kategori: 'kolye', fiyatMetni: 'Set fiyatı', gorsel: 'assets/img/kolye-3.jpg', etiket: 'Çok Satan' },

  // ---- Yüzük ----
  { id: 8, ad: '22 Ayar Alyans Çifti', kategori: 'yuzuk', fiyatMetni: 'Çift fiyatı', gorsel: 'assets/img/yuzuk-1.jpg', etiket: '' },
  { id: 9, ad: 'Tek Taş Pırlanta Yüzük', kategori: 'yuzuk', fiyatMetni: 'Sertifikalı fiyat', gorsel: 'assets/img/yuzuk-2.jpg', etiket: 'Sertifikalı' },
  { id: 10, ad: '22 Ayar Beştaş Yüzük', kategori: 'yuzuk', fiyatMetni: 'Has fiyatı ile', gorsel: 'assets/img/yuzuk-3.jpg', etiket: '' },

  // ---- Çeyrek / Ata ----
  { id: 11, ad: 'Çeyrek Altın (Kulpsuz)', kategori: 'ceyrek', fiyatMetni: 'Günlük kur ile', gorsel: 'assets/img/ceyrek-1.jpg', etiket: 'Yatırımlık' },
  { id: 12, ad: 'Ata Altın (Tam)', kategori: 'ceyrek', fiyatMetni: 'Günlük kur ile', gorsel: 'assets/img/ceyrek-2.jpg', etiket: 'Yatırımlık' },
  { id: 13, ad: 'Yarım Altın', kategori: 'ceyrek', fiyatMetni: 'Günlük kur ile', gorsel: 'assets/img/ceyrek-3.jpg', etiket: '' },
  { id: 14, ad: 'Ziynet Beşi Bir Yerde', kategori: 'ceyrek', fiyatMetni: 'Günlük kur ile', gorsel: 'assets/img/ceyrek-4.jpg', etiket: 'Yatırımlık' }
];

/** Vitrin filtreleri — hem API hem arayüz bu listeyi kullanır. */
const KATEGORILER = [
  { anahtar: 'tumu', ad: 'Tümü' },
  { anahtar: 'bilezik', ad: 'Bilezik' },
  { anahtar: 'kolye', ad: 'Kolye' },
  { anahtar: 'yuzuk', ad: 'Yüzük' },
  { anahtar: 'ceyrek', ad: 'Çeyrek & Ata' }
];

/**
 * Ürünleri (isteğe bağlı kategori filtresiyle) döner.
 * @param {string} [kategori] 'tumu' veya boş ise tüm liste.
 * @returns {Array<object>} Ürünlerin kopyası (dışarıdan mutasyona karşı korumalı).
 */
function urunleriGetir(kategori) {
  const temiz = typeof kategori === 'string' ? kategori.trim().toLowerCase() : '';
  if (!temiz || temiz === 'tumu') {
    return URUNLER.map((u) => ({ ...u }));
  }
  return URUNLER.filter((u) => u.kategori === temiz).map((u) => ({ ...u }));
}

/**
 * Tek ürünü id ile bulur.
 * @param {number|string} id
 * @returns {object|null}
 */
function urunGetir(id) {
  const sayi = Number(id);
  if (!Number.isInteger(sayi)) return null;
  const bulunan = URUNLER.find((u) => u.id === sayi);
  return bulunan ? { ...bulunan } : null;
}

module.exports = { URUNLER, KATEGORILER, urunleriGetir, urunGetir };
