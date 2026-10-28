'use strict';

/**
 * routes/categories.js
 * Kategori yönetim rotaları — CRUD + ürün sayısı.
 */

const express = require('express');
const router = express.Router();
const categoryModel = require('../models/categoryModel');
const productModel = require('../models/productModel');

/** Kategorilere ürün sayısını ekler. */
function withCounts(categories) {
  const products = productModel.readAll();
  return categories.map((c) => ({
    ...c,
    products: products.filter((p) => Number(p.categoryId) === Number(c.id)).length
  }));
}

/** GET /new — kategori ekleme formu */
router.get('/new', (req, res) => {
  res.render('categories/new', {
    title: 'Yeni Kategori',
    bodyClass: 'form-page'
  });
});

/** GET / — tüm kategoriler + ürün sayıları */
router.get('/', (req, res) => {
  const categories = withCounts(categoryModel.readAll());
  if (req.query.json !== undefined) {
    return res.json(categories);
  }
  res.render('categories/list', {
    title: 'Kategoriler',
    categories,
    bodyClass: 'list-page'
  });
});

/** POST / — yeni kategori ekler */
router.post('/', (req, res) => {
  const { name } = req.body || {};
  if (!name || !String(name).trim()) {
    return res.status(400).json({ error: 'Kategori adı zorunludur.' });
  }
  const existing = categoryModel.readAll().find(
    (c) => c.name.toLowerCase() === String(name).trim().toLowerCase()
  );
  if (existing) {
    return res.status(400).json({ error: 'Bu isimde bir kategori zaten var.' });
  }
  const category = categoryModel.create(name);
  res.status(201).json(category);
});

/** PUT /:id — kategori günceller */
router.put('/:id', (req, res) => {
  const { name } = req.body || {};
  if (!name || !String(name).trim()) {
    return res.status(400).json({ error: 'Kategori adı boş olamaz.' });
  }
  const updated = categoryModel.update(req.params.id, name);
  if (!updated) return res.status(404).json({ error: 'Kategori bulunamadı' });
  res.json(updated);
});

/** DELETE /:id — kategori siler (ürünü varsa engeller) */
router.delete('/:id', (req, res) => {
  const id = Number(req.params.id);
  const usedProducts = productModel
    .readAll()
    .filter((p) => Number(p.categoryId) === id).length;
  if (usedProducts > 0) {
    return res.status(400).json({
      error: `Bu kategoriye ait ${usedProducts} ürün var. Önce ürünleri taşıyın/silin.`
    });
  }
  const ok = categoryModel.remove(id);
  if (!ok) return res.status(404).json({ error: 'Kategori bulunamadı' });
  res.status(204).end();
});

module.exports = router;
