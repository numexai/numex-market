'use strict';

const express = require('express');
const { kurlariGetir, kurGetir } = require('../data/kurlar');
const { bulunamadi } = require('../lib/hataYonetimi');

const router = express.Router();

/**
 * GET /api/kurlar
 * Güncel (demo) döviz ve altın kurlarını döner.
 */
router.get('/', (req, res) => {
  const liste = kurlariGetir();
  res.json({
    basarili: true,
    guncellemeZamani: new Date().toISOString(),
    kaynak: 'demo-simulasyon',
    adet: liste.length,
    veri: liste
  });
});

/**
 * GET /api/kurlar/:kod  (usd, eur, gbp, ga, ceyrek, yarim)
 */
router.get('/:kod', (req, res, next) => {
  const kur = kurGetir(req.params.kod);
  if (!kur) return next(bulunamadi(`Kur bulunamadı: ${req.params.kod}`));
  res.json({ basarili: true, veri: kur });
});

module.exports = router;
