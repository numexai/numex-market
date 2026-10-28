'use strict';

/**
 * stockModel.js
 * Stok hareketleri veri katmanı — JSON dosya depolama.
 * Her giriş/çıkış hareketini log'lar; ürün güncellemesi productModel'e bırakılır.
 */

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const FILE_PATH = path.join(DATA_DIR, 'stockMovements.json');

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

/**
 * Tüm hareket kayıtlarını okur.
 * @returns {Array} hareket listesi
 */
function readMovements() {
  try {
    ensureDir();
    if (!fs.existsSync(FILE_PATH)) return [];
    const raw = fs.readFileSync(FILE_PATH, 'utf8');
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.error('Stok hareket dosyası okunamadı:', err.message);
    return [];
  }
}

/**
 * Hareket listesini yazar.
 * @param {Array} movements hareket listesi
 */
function writeMovements(movements) {
  ensureDir();
  fs.writeFileSync(FILE_PATH, JSON.stringify(movements, null, 2), 'utf8');
}

/**
 * Sonraki hareket ID'si.
 * @param {Array} movements hareket listesi
 * @returns {number} yeni id
 */
function _nextId(movements) {
  if (!movements.length) return 1;
  return Math.max(...movements.map((m) => Number(m.id) || 0)) + 1;
}

/**
 * Yeni stok hareketi oluşturur ve kaydeder.
 * @param {Object} params {productId, type, quantity, note, remainingStock}
 * @returns {Object} hareket kaydı
 */
function addMovement({ productId, type, quantity, note, remainingStock }) {
  const movements = readMovements();
  const movement = {
    id: _nextId(movements),
    productId: Number(productId),
    type: type === 'in' || type === 'out' ? type : 'in',
    quantity: Number(quantity) || 0,
    note: note ? String(note).trim() : '',
    remainingStock: Number(remainingStock) !== undefined ? Number(remainingStock) : 0,
    date: new Date().toISOString()
  };
  movements.push(movement);
  writeMovements(movements);
  return movement;
}

/**
 * Ürüne ait hareketleri tarih sıralı getirir (eski→yeni).
 * @param {number} productId ürün ID
 * @returns {Array} hareket listesi
 */
function getByProduct(productId) {
  const movements = readMovements();
  return movements
    .filter((m) => m.productId === Number(productId))
    .sort((a, b) => new Date(a.date) - new Date(b.date));
}

/**
 * Tüm hareketleri en yeni üstte getirir.
 * @returns {Array} hareket listesi
 */
function getAll() {
  const movements = readMovements();
  return movements.sort((a, b) => new Date(b.date) - new Date(a.date));
}

module.exports = {
  readMovements,
  addMovement,
  getByProduct,
  getAll,
  _nextId
};
