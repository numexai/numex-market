// JSON dosya tabanlı basit veri katmanı (repository)
// İleride MongoDB/Postgres'e geçilecekse sadece bu katman değiştirilir.
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname);
const db = {}; // { dosyaAdi: [kayıtlar] } cache

// Koleksiyon adı -> dosya yolu
function dosyaYolu(koleksiyon) {
  return path.join(DATA_DIR, `${koleksiyon}.json`);
}

function yukle(koleksiyon) {
  if (db[koleksiyon]) return db[koleksiyon];
  const yol = dosyaYolu(koleksiyon);
  let veri = [];
  if (fs.existsSync(yol)) {
    try {
      veri = JSON.parse(fs.readFileSync(yol, 'utf8'));
    } catch (e) {
      console.error(`[db] ${koleksiyon}.json okunamadı, boş liste ile başlanıyor:`, e.message);
      veri = [];
    }
  }
  db[koleksiyon] = veri;
  return veri;
}

function kaydet(koleksiyon) {
  const yol = dosyaYolu(koleksiyon);
  fs.writeFileSync(yol, JSON.stringify(db[koleksiyon] || [], null, 2), 'utf8');
}

// ---- CRUD ----
function hepsiniGetir(koleksiyon) {
  return yukle(koleksiyon);
}

function idIleGetir(koleksiyon, id) {
  return yukle(koleksiyon).find((k) => String(k.id) === String(id)) || null;
}

function ekle(koleksiyon, kayit) {
  const liste = yukle(koleksiyon);
  if (kayit.id === undefined) {
    // sonraki id
    const maxId = liste.reduce((m, k) => Math.max(m, Number(k.id) || 0), 0);
    kayit.id = maxId + 1;
  }
  liste.push(kayit);
  kaydet(koleksiyon);
  return kayit;
}

function guncelle(koleksiyon, id, yeniAlanlar) {
  const liste = yukle(koleksiyon);
  const idx = liste.findIndex((k) => String(k.id) === String(id));
  if (idx === -1) return null;
  liste[idx] = { ...liste[idx], ...yeniAlanlar, id: liste[idx].id };
  kaydet(koleksiyon);
  return liste[idx];
}

function sil(koleksiyon, id) {
  const liste = yukle(koleksiyon);
  const idx = liste.findIndex((k) => String(k.id) === String(id));
  if (idx === -1) return false;
  liste.splice(idx, 1);
  kaydet(koleksiyon);
  return true;
}

module.exports = { hepsiniGetir, idIleGetir, ekle, guncelle, sil, yukle };
