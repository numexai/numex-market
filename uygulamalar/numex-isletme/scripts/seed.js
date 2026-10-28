// Demo veri — YALNIZ izole test verisi (gerçek müşteri/ödeme yok).
import { db, now } from '../server/db.js';
import { musteriOlustur } from '../server/isletme.js';

export function seed() {
  const say = db.prepare('SELECT COUNT(*) AS n FROM products').get().n;
  if (say > 0) return { atlandi: true };

  const urunler = [
    ['KAHVE-250', 'Filtre Kahve 250g', 18500, 10, 2],
    ['CAM-BARDAK', 'Cam Bardak Seti (6lı)', 24900, 4, 5],
    ['TERMOS-1L', 'Termos 1 Litre', 45900, 2, 7],
    ['FİLTRE-KAGIT', 'Filtre Kağıdı 100lü', 6500, 40, 1]
  ];
  const ekle = db.prepare('INSERT INTO products (sku, ad, birim_fiyat, stok, tedarik_gun) VALUES (?,?,?,?,?)');
  for (const u of urunler) ekle.run(...u);

  const m1 = musteriOlustur({ ad: 'Ayşe Yılmaz', telefon: '0500 000 00 01', email: 'ayse@ornek.test', adres: 'Test Mah. 1' });
  const m2 = musteriOlustur({ ad: 'Mehmet Demir', telefon: '0500 000 00 02', email: 'mehmet@ornek.test', adres: 'Test Mah. 2' });
  const m3 = musteriOlustur({ ad: 'Zeynep Kaya', telefon: '0500 000 00 03', email: 'zeynep@ornek.test', adres: 'Test Mah. 3' });

  return { atlandi: false, urunler: urunler.length, musteriler: [m1.id, m2.id, m3.id], zaman: now() };
}

if (process.argv[1] && process.argv[1].endsWith('seed.js')) {
  console.log(JSON.stringify(seed(), null, 2));
}
