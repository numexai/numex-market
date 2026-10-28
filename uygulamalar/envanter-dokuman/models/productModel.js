'use strict';

/**
 * productModel.js
 * Ürün veri erişim katmanı — JSON dosya depolama.
 * data/products.json üzerinde okuma/yazma işlemlerini soyutlar.
 */

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const FILE_PATH = path.join(DATA_DIR, 'products.json');

/** Dizin yoksa oluşturur. */
function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

/**
 * Tüm ürünleri okur.
 * @returns {Array} Ürün listesi (dosya yoksa / bozuksa boş dizi)
 */
function readAll() {
  try {
    ensureDir();
    if (!fs.existsSync(FILE_PATH)) return [];
    const raw = fs.readFileSync(FILE_PATH, 'utf8');
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.error('Ürün dosyası okunamadı:', err.message);
    return [];
  }
}

/**
 * Tüm ürün listesini JSON'a yazar.
 * @param {Array} products ürün listesi
 */
function writeAll(products) {
  ensureDir();
  fs.writeFileSync(FILE_PATH, JSON.stringify(products, null, 2), 'utf8');
}

/**
 * ID'ye göre ürün bulur.
 * @param {number} id ürün ID
 * @returns {Object|null} ürün veya null
 */
function findById(id) {
  const products = readAll();
  return products.find((p) => p.id === Number(id)) || null;
}

/**
 * Kategoriye göre ürünleri listeler.
 * @param {number} catId kategori ID
 * @returns {Array} ürün listesi
 */
function findByCategory(catId) {
  const products = readAll();
  return products.filter((p) => p.categoryId === Number(catId));
}

/**
 * Sonraki otomatik ID'yi hesaplar (maks + 1).
 * @param {Array} products ürün listesi
 * @returns {number} yeni id
 */
function _nextId(products) {
  if (!products.length) return 1;
  return Math.max(...products.map((p) => Number(p.id) || 0)) + 1;
}

/**
 * Yeni ürün oluşturur ve kaydeder.
 * @param {Object} productData ürün alanları {name, categoryId, unitPrice, stock, minimumStock}
 * @returns {Object} oluşturulan ürün
 */
function create(productData) {
  const products = readAll();
  const now = new Date().toISOString();
  const product = {
    id: _nextId(products),
    name: String(productData.name || '').trim(),
    categoryId: Number(productData.categoryId) || 0,
    unitPrice: Number(productData.unitPrice) || 0,
    stock: Number(productData.stock) || 0,
    minimumStock: Number(productData.minimumStock) || 10,
    createdAt: now,
    updatedAt: now
  };
  products.push(product);
  writeAll(products);
  return product;
}

/**
 * Ürünü kısmi günceller.
 * @param {number} id ürün ID
 * @param {Object} updates güncellenecek alanlar
 * @returns {Object|null} güncellenmiş ürün veya null
 */
function update(id, updates) {
  const products = readAll();
  const idx = products.findIndex((p) => p.id === Number(id));
  if (idx === -1) return null;

  const allowed = ['name', 'categoryId', 'unitPrice', 'minimumStock'];
  for (const key of allowed) {
    if (updates[key] !== undefined) {
      products[idx][key] = key === 'name' ? String(updates[key]).trim() : Number(updates[key]);
    }
  }
  // stok ayrıca stockModel üzerinden değişir, ama izin verilen doğrudan güncellemeye açalım
  if (updates.stock !== undefined) products[idx].stock = Number(updates.stock);
  products[idx].updatedAt = new Date().toISOString();
  writeAll(products);
  return products[idx];
}

/**
 * Ürünü siler.
 * @param {number} id ürün ID
 * @returns {boolean} silinip silinmediği
 */
function remove(id) {
  const products = readAll();
  const filtered = products.filter((p) => p.id !== Number(id));
  if (filtered.length === products.length) return false;
  writeAll(filtered);
  return true;
}

module.exports = {
  readAll,
  writeAll,
  findById,
  findByCategory,
  create,
  update,
  remove,
  _nextId
};
