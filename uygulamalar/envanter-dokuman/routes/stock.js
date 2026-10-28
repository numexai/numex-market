'use strict';

/**
 * routes/stock.js
 * Stok giriş/çıkış hareket rotaları + hareket log sayfası.
 */

const express = require('express');
const router = express.Router();
const productModel = require('../models/productModel');
const stockModel = require('../models/stockModel');
const lowStockService = require('../services/lowStockService');

/** POST /in — stok girişi */
router.post('/in', (req, res) => {
  const { productId, quantity, note } = req.body || {};
  const product = productModel.findById(productId);
  if (!product) return res.status(404).json({ error: 'Ürün bulunamadı' });

  const qty = Number(quantity);
  if (!qty || qty <= 0) {
    return res.status(400).json({ error: 'Geçerli bir miktar girilmelidir.' });
  }

  // Ürün stokunu artır — direct update
  const newStock = Number(product.stock) + qty;
  const updated = productModel.update(product.id, { stock: newStock });

  const movement = stockModel.addMovement({
    productId: product.id,
    type: 'in',
    quantity: qty,
    note,
    remainingStock: newStock
  });

  return res.status(201).json({
    product: updated,
    movement,
    lowStock: Number(updated.stock) <= (Number(updated.minimumStock) || 10)
  });
});

/** POST /out — stok çıkışı */
router.post('/out', (req, res) => {
  const { productId, quantity, note } = req.body || {};
  const product = productModel.findById(productId);
  if (!product) return res.status(404).json({ error: 'Ürün bulunamadı' });

  const qty = Number(quantity);
  if (!qty || qty <= 0) {
    return res.status(400).json({ error: 'Geçerli bir miktar girilmelidir.' });
  }
  if (qty > Number(product.stock)) {
    return res.status(400).json({
      error: `Yetersiz stok! Mevcut stok: ${product.stock} (istenen: ${qty})`
    });
  }

  const newStock = Number(product.stock) - qty;
  const updated = productModel.update(product.id, { stock: newStock });

  const movement = stockModel.addMovement({
    productId: product.id,
    type: 'out',
    quantity: qty,
    note,
    remainingStock: newStock
  });

  return res.status(201).json({
    product: updated,
    movement,
    lowStock: Number(updated.stock) <= (Number(updated.minimumStock) || 10)
  });
});

/** GET /movements — hareket log sayfası (veya ?json=1 ile JSON) */
router.get('/movements', (req, res) => {
  const all = stockModel.getAll();
  const typeFilter = req.query.type || '';
  
  let movements = all;
  if (typeFilter === 'in' || typeFilter === 'out') {
    movements = all.filter((m) => m.type === typeFilter);
  }

  const products = productModel.readAll();
  const nameOf = (id) => {
    const p = products.find((x) => x.id === Number(id));
    return p ? p.name : 'Silinmiş Ürün';
  };
  const enriched = movements.map((m) => ({
    ...m,
    productName: nameOf(m.productId)
  }));

  if (req.query.json !== undefined) {
    return res.json({ movements: enriched, typeFilter });
  }

  const counts = {
    in: all.filter((m) => m.type === 'in').length,
    out: all.filter((m) => m.type === 'out').length,
    total: all.length
  };

  res.render('stock/movements', {
    title: 'Stok Hareketleri',
    movements: enriched,
    typeFilter,
    counts,
    lowStockCount: lowStockService.countLowStock(),
    bodyClass: 'movements-page'
  });
});

/** GET /movements/:productId — ürüne özel hareketler (API JSON) */
router.get('/movements/:productId', (req, res) => {
  const movements = stockModel.getByProduct(req.params.productId);
  return res.json(movements);
});

module.exports = router;
