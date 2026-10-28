'use strict';

const express = require('express');
const { urunleriGetir, urunGetir, KATEGORILER } = require('../data/urunler');
const { bulunamadi } = require('../lib/hataYonetimi');

const router = express.Router();

/**
 * GET /api/urunler
 * Query: ?kategori=bilezik|kolye|yuzuk|ceyrek|tumu
 */
router.get('/', (req, res) => {
  const kategori = typeof req.query.kategori === 'string' ? req.query.kategori : 'tumu';
  const liste = urunleriGetir(kategori);

  res.json({
    basarili: true,
    kategori,
    kategoriBilgisi: KATEGORILER,
    adet: liste.length,
    veri: liste
  });
});

/**
 * GET /api/urunler/:id
 */
router.get('/:id', (req, res, next) => {
  const urun = urunGetir(req.params.id);
  if (!urun) return next(bulunamadi(`Ürün bulunamadı: ${req.params.id}`));
  res.json({ basarili: true, veri: urun });
});

module.exports = router;
