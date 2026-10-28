'use strict';

/**
 * categoryModel.js
 * Kategori veri katmanı — JSON dosya depolama.
 * data/categories.json üzerinde CRUD işlemleri.
 */

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const FILE_PATH = path.join(DATA_DIR, 'categories.json');

const DEFAULT_CATEGORIES = [
  { id: 1, name: 'Elektronik', slug: 'elektronik' },
  { id: 2, name: 'Gıda', slug: 'gida' },
  { id: 3, name: 'Giyim', slug: 'giyim' },
  { id: 4, name: 'Diğer', slug: 'diger' }
];

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

/** Türkçe karakterleri güvenli slug'a çevirir. */
function slugify(name) {
  return String(name)
    .toLowerCase()
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Tüm kategorileri okur; dosya yoksa varsayılan kategorileri oluşturur.
 * @returns {Array} kategori listesi
 */
function readAll() {
  try {
    ensureDir();
    if (!fs.existsSync(FILE_PATH)) {
      writeAll(DEFAULT_CATEGORIES);
      return DEFAULT_CATEGORIES;
    }
    const raw = fs.readFileSync(FILE_PATH, 'utf8');
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.error('Kategori dosyası okunamadı:', err.message);
    return [];
  }
}

/**
 * Kategori listesini yazar.
 * @param {Array} categories kategori listesi
 */
function writeAll(categories) {
  ensureDir();
  fs.writeFileSync(FILE_PATH, JSON.stringify(categories, null, 2), 'utf8');
}

/**
 * ID'ye göre kategori bulur.
 * @param {number} id kategori ID
 * @returns {Object|null}
 */
function findById(id) {
  const categories = readAll();
  return categories.find((c) => c.id === Number(id)) || null;
}

/**
 * Yeni kategori ekler.
 * @param {string} name kategori adı
 * @returns {Object} oluşturulan kategori
 */
function create(name) {
  const categories = readAll();
  const nextId =
    categories.length > 0 ? Math.max(...categories.map((c) => Number(c.id) || 0)) + 1 : 1;
  const category = { id: nextId, name: String(name).trim(), slug: slugify(name) };
  categories.push(category);
  writeAll(categories);
  return category;
}

/**
 * Kategori adını günceller.
 * @param {number} id kategori ID
 * @param {string} name yeni ad
 * @returns {Object|null}
 */
function update(id, name) {
  const categories = readAll();
  const idx = categories.findIndex((c) => c.id === Number(id));
  if (idx === -1) return null;
  categories[idx].name = String(name).trim();
  categories[idx].slug = slugify(name);
  writeAll(categories);
  return categories[idx];
}

/**
 * Kategoriyi siler.
 * @param {number} id kategori ID
 * @returns {boolean}
 */
function remove(id) {
  const categories = readAll();
  const filtered = categories.filter((c) => c.id !== Number(id));
  if (filtered.length === categories.length) return false;
  writeAll(filtered);
  return true;
}

module.exports = {
  readAll,
  writeAll,
  findById,
  create,
  update,
  remove
};
