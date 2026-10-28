// Veri depolama katmanı - JSON dosya tabanlı, basit ve tutarlı
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

// Koleksiyon dosyasının yolunu hesapla
function dosyaYolu(koleksiyon) {
  return path.join(DATA_DIR, koleksiyon + '.json');
}

// Koleksiyon varsa okur, yoksa boş diziye başlar
function oku(koleksiyon) {
  const yol = dosyaYolu(koleksiyon);
  if (!fs.existsSync(yol)) return [];
  try {
    return JSON.parse(fs.readFileSync(yol, 'utf8'));
  } catch (e) {
    return [];
  }
}

// Koleksiyonu diske yazar
function yaz(koleksiyon, veri) {
  const yol = dosyaYolu(koleksiyon);
  fs.writeFileSync(yol, JSON.stringify(veri, null, 2), 'utf8');
}

// Yeni benzersiz kimlik üretir
function yeniId(koleksiyon) {
  const mevcut = oku(koleksiyon);
  return mevcut.length ? Math.max(...mevcut.map(x => x.id)) + 1 : 1;
}

// Bir koleksiyonda id'ye göre kaydı bulur
function bulKoleksiyonda(koleksiyon, id) {
  return oku(koleksiyon).find(x => x.id === id);
}

module.exports = { oku, yaz, yeniId, bulKoleksiyonda, DATA_DIR };
