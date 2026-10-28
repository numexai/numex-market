'use strict';

/**
 * reportService.js
 * Rapor hesaplama motoru — kategori bazlı raporlar, stok değerleri ve hareket özetleri.
 * Saf fonksiyonlar; test edilebilir, route'tan bağımsız.
 */

const productModel = require('../models/productModel');
const stockModel = require('../models/stockModel');
const categoryModel = require('../models/categoryModel');

/** ISO tarihini Date nesnesine güvenle çevirir (geçersizse boş aralık dönmez). */
function toDate(value) {
  const d = value ? new Date(value) : null;
  return d && !isNaN(d.getTime()) ? d : null;
}

/**
 * Belirli bir kategoriye ait ürünlerin toplam stok değerini hesaplar.
 * @param {number} categoryId kategori ID
 * @returns {number} toplam değer (stock * unitPrice)
 */
function valueByCategory(categoryId) {
  const categories = categoryModel.readAll();
  const catId = Number(categoryId);

  // id:0 / 'all' => tüm kategoriler
  if (catId === 0 || String(categoryId).toLowerCase() === 'all') {
    const products = productModel.readAll();
    return products.reduce((sum, p) => sum + Number(p.stock) * Number(p.unitPrice), 0);
  }

  const cat = categories.find((c) => c.id === catId);
  if (!cat) return 0;

  const products = productModel.findByCategory(catId);
  return products.reduce((sum, p) => sum + Number(p.stock) * Number(p.unitPrice), 0);
}

/**
 * Tarih aralığında kategori ürünlerine ait giriş/çıkış özeti.
 * @param {number|null} categoryId kategori ID (0/null = hepsi)
 * @param {string} fromDate başlangıç tarihi (ISO)
 * @param {string} toDate bitiş tarihi (ISO)
 * @returns {Object} {in, out, net}
 */
function movementSummary(categoryId = null, fromDate = '', toDate = '') {
  const from = toDate(fromDate);
  const to = toDate(toDate);

  // Kategoriye ait ürün ID'lerini bul
  let productIds = new Set();
  const catId = Number(categoryId);
  if (catId && !isNaN(catId) && catId !== 0) {
    productModel.findByCategory(catId).forEach((p) => productIds.add(Number(p.id)));
  } else {
    productModel.readAll().forEach((p) => productIds.add(Number(p.id)));
  }

  const movements = stockModel.readAll().filter((m) => {
    if (!productIds.has(Number(m.productId))) return false;
    const d = new Date(m.date);
    if (from && d < from) return false;
    if (to) {
      // to bitiş gününü kapsar
      const toEnd = new Date(to);
      toEnd.setHours(23, 59, 59, 999);
      if (d > toEnd) return false;
    }
    return true;
  });

  let inQty = 0;
  let outQty = 0;
  for (const m of movements) {
    if (m.type === 'in') inQty += Number(m.quantity) || 0;
    else if (m.type === 'out') outQty += Number(m.quantity) || 0;
  }

  return { in: inQty, out: outQty, net: inQty - outQty, movements };
}

/**
 * Kategori bazlı tam rapor.
 * @param {number|null} categoryId kategori ID
 * @param {Object} opts {fromDate, toDate}
 * @returns {Object} {category, totalProducts, totalStockValue, incomingQty, outgoingQty, movements, lowStockCount}
 */
function categoryReport(categoryId = null, opts = {}) {
  const { fromDate = '', toDate = '' } = opts || {};
  const catId = Number(categoryId);
  const categories = categoryModel.readAll();
  const category =
    (catId && categories.find((c) => c.id === catId)) ||
    (String(categoryId).toLowerCase() === 'all' ? { id: 0, name: 'Tümü' } : null);

  const products = category && category.id !== 0
    ? productModel.findByCategory(catId)
    : productModel.readAll();

  const totalStockValue = products.reduce((s, p) => s + Number(p.stock) * Number(p.unitPrice), 0);
  const summary = movementSummary(catId || 0, fromDate, toDate);

  return {
    category,
    totalProducts: products.length,
    totalStockValue,
    incomingQty: summary.in,
    outgoingQty: summary.out,
    netQty: summary.net,
    movements: summary.movements,
    lowStockCount: products.filter(
      (p) => Number(p.stock) <= (Number(p.minimumStock) || 10)
    ).length
  };
}

/**
 * Tüm kategorilerin özet raporları (dashboard / rapor sayfası tablosu).
 * @returns {Array} [{id, name, totalProducts, totalStockValue, lowStockCount}]
 */
function allCategorySummary() {
  const categories = categoryModel.readAll();
  return categories.map((cat) => {
    const products = productModel.findByCategory(cat.id);
    const totalStockValue = products.reduce((s, p) => s + Number(p.stock) * Number(p.unitPrice), 0);
    return {
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      totalProducts: products.length,
      totalStockValue,
      lowStockCount: products.filter(
        (p) => Number(p.stock) <= (Number(p.minimumStock) || 10)
      ).length
    };
  });
}

module.exports = {
  categoryReport,
  valueByCategory,
  movementSummary,
  allCategorySummary
};
