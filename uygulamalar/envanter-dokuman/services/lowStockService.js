'use strict';

/**
 * lowStockService.js
 * Düşük stok tespiti — ürünlerin stok değerini minimumStock eşiğiyle karşılaştırır.
 */

const productModel = require('../models/productModel');

/**
 * Düşük stoklu ürünleri bulur.
 * @param {number} threshold eşik (varsayılan 10) — minimumStock'a göre değil, genel eşik
 * @returns {Array} [{product, remaining}] listesi
 */
function findLowStock(threshold = 10) {
  const products = productModel.readAll();
  // İki eşik mantığı: ya ürünün kendi minimumStock değeri altında ya da verilen global eşiğin altında
  const t = Number(threshold) || 10;
  return products
    .filter((p) => Number(p.stock) <= (Number(p.minimumStock) || t))
    .map((p) => ({ product: p, remaining: Number(p.stock) }));
}

/**
 * Düşük stok aslında ürünün kendi minimumStock değerinin altına inmesidir.
 * Global eşik dönüşümü: countLowStock ve findLowStock tutarlı olsun diye
 * ürün bazlı minimumStock eşiğini kullanıyoruz; threshold parametresi yedek eşiktir.
 */

/**
 * Düşük stoklu ürün sayısı (dashboard rozeti için).
 * @param {number} threshold yedek eşik
 * @returns {number} sayaç
 */
function countLowStock(threshold = 10) {
  return findLowStock(threshold).length;
}

module.exports = {
  findLowStock,
  countLowStock
};
