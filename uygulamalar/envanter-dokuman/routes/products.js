'use strict';

/**
 * routes/products.js
 * Ürün CRUD rotaları — hem HTML sayfa görünümleri hem REST API.
 */

const express = require('express');
const router = express.Router();
const productModel = require('../models/productModel');
const categoryModel = require('../models/categoryModel');
const stockModel = require('../models/stockModel');
const lowStockService = require('../services/lowStockService');

/** Ürün listesini kategori adıyla zenginleştirir. */
function enrich(products) {
  const categories = categoryModel.readAll();
  return products.map((p) => {
    const cat = categories.find((c) => c.id === Number(p.categoryId));
    return {
      ...p,
      categoryName: cat ? cat.name : 'Kategori Yok',
      lowStock: Number(p.stock) <= (Number(p.minimumStock) || 10)
    };
  });
}

// --- Sayfa görünümleri ---

/** GET /new — yeni ürün formu sayfası */
router.get('/new', (req, res) => {
  const categories = categoryModel.readAll();
  res.render('products/form', {
    title: 'Yeni Ürün',
    product: null,
    categories,
    action: '/api/products',
    bodyClass: 'form-page'
  });
});

/** GET /:id/edit — ürün düzenleme formu */
router.get('/:id/edit', (req, res) => {
  const product = productModel.findById(req.params.id);
  if (!product) return res.status(404).send('Ürün bulunamadı');
  const categories = categoryModel.readAll();
  res.render('products/form', {
    title: 'Ürünü Düzenle',
    product,
    categories,
    action: `/api/products/${product.id}`,
    bodyClass: 'form-page'
  });
});

/** GET /:id — ürün detay sayfası */
router.get('/:id', (req, res) => {
  const product = productModel.findById(req.params.id);
  if (!product) return res.status(404).send('Ürün bulunamadı');
  const categories = categoryModel.readAll();
  const cat = categories.find((c) => c.id === Number(product.categoryId));
  const movements = stockModel.getByProduct(product.id).slice().reverse();
  const lowStock = Number(product.stock) <= (Number(product.minimumStock) || 10);
  res.render('products/detail', {
    title: product.name,
    product: { ...product, categoryName: cat ? cat.name : '—' },
    movements,
    lowStock,
    bodyClass: 'detail-page'
  });
});

/** GET / — ürün listesi (filtre destekli) */
router.get('/', (req, res) => {
  const search = (req.query.search || '').toString().trim().toLowerCase();
  const category = req.query.category;

  let products = productModel.readAll();
  if (search) {
    products = products.filter(
      (p) =>
        p.name.toLowerCase().includes(search) ||
        String(p.id).includes(search)
    );
  }
  if (category) {
    products = products.filter((p) => String(p.categoryId) === String(category));
  }
  const categories = categoryModel.readAll();
  const enriched = enrich(products);
  const lowStockCount = lowStockService.countLowStock();

  res.render('products/list', {
    title: 'Ürünler',
    products: enriched,
    categories,
    search,
    selectedCategory: category || '',
    lowStockCount,
    bodyClass: 'list-page'
  });
});

// --- REST API ---

/** POST / — yeni ürün oluşturur */
router.post('/', (req, res) => {
  const { name, categoryId, unitPrice, stock, minimumStock } = req.body || {};
  if (!name || !String(name).trim()) {
    return res.status(400).json({ error: 'Ürün adı zorunludur.' });
  }
  if (Number(unitPrice) < 0 || (Number(unitPrice) !== 0 && isNaN(Number(unitPrice)))) {
    return res.status(400).json({ error: 'Birim fiyat geçerli bir sayı olmalıdır.' });
  }
  if (Number(stock) < 0) {
    return res.status(400).json({ error: 'Stok miktarı negatif olamaz.' });
  }
  // Kategori varlığını kontrol et (0 değilse)
  if (categoryId && Number(categoryId) !== 0 && !categoryModel.findById(categoryId)) {
    return res.status(400).json({ error: 'Geçersiz kategori.' });
  }

  const product = productModel.create({
    name,
    categoryId,
    unitPrice,
    stock,
    minimumStock
  });

  if (req.get('Accept') === 'application/json' || req.xhr || req.body._api) {
    return res.status(201).json(product);
  }
  res.redirect('/api/products');
});

/** PUT /:id — ürün günceller */
router.put('/:id', (req, res) => {
  const product = productModel.findById(req.params.id);
  if (!product) return res.status(404).json({ error: 'Ürün bulunamadı' });

  const { name, categoryId, unitPrice, stock, minimumStock } = req.body || {};
  const updates = {};
  if (name !== undefined && !String(name).trim()) {
    return res.status(400).json({ error: 'Ürün adı boş olamaz.' });
  }
  if (name !== undefined) updates.name = name;
  if (categoryId !== undefined) updates.categoryId = categoryId;
  if (unitPrice !== undefined && Number(unitPrice) < 0) {
    return res.status(400).json({ error: 'Birim fiyat negatif olamaz.' });
  }
  if (unitPrice !== undefined) updates.unitPrice = unitPrice;
  if (stock !== undefined && Number(stock) < 0) {
    return res.status(400).json({ error: 'Stok miktarı negatif olamaz.' });
  }
  if (stock !== undefined) updates.stock = stock;
  if (minimumStock !== undefined) updates.minimumStock = minimumStock;

  const updated = productModel.update(product.id, updates);
  return res.json(updated);
});

/** DELETE /:id — ürün siler */
router.delete('/:id', (req, res) => {
  const ok = productModel.remove(req.params.id);
  if (!ok) return res.status(404).json({ error: 'Ürün bulunamadı' });
  return res.status(204).end();
});

// API varyantları (HTML yerine JSON döndürme için bazı ekstra uçlar)
router.get('/api/all', (req, res) => {
  res.json(enrich(productModel.readAll()));
});

module.exports = router;
