// 100 satırlık örnek satış dosyası üretir + bağımsız toplamları yazar.
// Toplamlar kuruş hassasiyetinde tam sayı (kuruş) üzerinden hesaplanır.
// Telefon ve Sipariş No bilinçli olarak KİMLİK kolonlarıdır: toplanmaz, yalnız kırılım olur.
const fs = require('fs');
const path = require('path');

const bolgeler = ['Marmara', 'Ege', 'Akdeniz', 'İç Anadolu', 'Karadeniz', 'Doğu Anadolu', 'Güneydoğu'];
const urunler = ['Kahve Makinesi', 'Blender', 'Tost Makinesi', 'Su Isıtıcısı', 'Ekmek Kızartma', 'Mikser'];
const kanallar = ['Mağaza', 'Online', 'Toptan'];
const alanKodlari = ['532', '533', '542', '555', '505', '507'];

// deterministik üretici (tohum sabit) — test tekrarlanabilir olsun
let seed = 42;
function rnd() { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; }
function pick(a) { return a[Math.floor(rnd() * a.length)]; }
function pad(n, w) { return String(n).padStart(w, '0'); }

const rows = [];
let kalanKurus = 0n;
for (let i = 0; i < 100; i++) {
  const ay = pad((i % 12) + 1, 2);
  const gun = pad((i % 27) + 1, 2);
  const tarih = `2026-${ay}-${gun}`;
  const bolge = pick(bolgeler);
  const urun = pick(urunler);
  const kanal = pick(kanallar);
  const adet = 1 + Math.floor(rnd() * 25);
  const birimFiyat = Math.round((149.9 + rnd() * 850) * 100) / 100; // TL, kuruş net
  const fiyatKurus = BigInt(Math.round(birimFiyat * 100));
  const tutarKurus = fiyatKurus * BigInt(adet);
  kalanKurus += tutarKurus;
  const telefon = '0' + pick(alanKodlari) + ' ' + pad(100 + Math.floor(rnd() * 900), 3) + ' ' + pad(Math.floor(rnd() * 100), 2) + ' ' + pad(Math.floor(rnd() * 100), 2);
  rows.push({
    tarih,
    siparis: 'SP-' + pad(1000 + i, 6),
    bolge, urun, kanal, telefon, adet, birimFiyat, tutarKurus
  });
}

// Kasıtlı veri kirliliği: 3 eksik hücre + 2 yinelenen satır (kalite paneli görünsün)
rows[7].bolge = '';
rows[23].birimFiyat = null;
rows[61].kanal = '';
const kopya1 = { ...rows[15] };
const kopya2 = { ...rows[45] };
rows.splice(70, 0, kopya1);
rows.splice(88, 0, kopya2);

const header = ['Tarih', 'Sipariş No', 'Bölge', 'Ürün', 'Kanal', 'Telefon', 'Adet', 'Birim Fiyat', 'Tutar'];
const csv = [header.join(',')];
for (const r of rows) {
  const tutar = (Number(r.tutarKurus) / 100).toFixed(2);
  const birim = r.birimFiyat == null ? '' : r.birimFiyat.toFixed(2);
  csv.push([r.tarih, r.siparis, r.bolge, `"${r.urun}"`, r.kanal, `"${r.telefon}"`, r.adet, birim, tutar].join(','));
}
const outDir = path.join(__dirname, '..', 'data');
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'satis.csv'), '\uFEFF' + csv.join('\r\n'), 'utf8');

const toplamTutar = (Number(kalanKurus) / 100).toFixed(2);
console.log('satır:', rows.length);
console.log('toplam tutar:', toplamTutar);
console.log('adet toplamı:', rows.reduce((a, r) => a + r.adet, 0));
console.log('tekil telefon:', new Set(rows.map(r => r.telefon)).size);
