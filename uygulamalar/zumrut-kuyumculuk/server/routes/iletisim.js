'use strict';

const express = require('express');
const { ISLETME, CALISMA_SAATLERI, HIZMETLER, bugunAcikMi, iletisimFormuDogrula } = require('../data/iletisim');
const { dogrulamaHatasi } = require('../lib/hataYonetimi');
const { logger } = require('../lib/logger');

const router = express.Router();

/**
 * GET /api/iletisim
 * Adres, telefon, çalışma saatleri ve hizmet listesi.
 */
router.get('/', (req, res) => {
  res.json({
    basarili: true,
    veri: {
      isletme: ISLETME,
      calismaSaatleri: CALISMA_SAATLERI,
      hizmetler: HIZMETLER,
      durum: bugunAcikMi()
    }
  });
});

/**
 * POST /api/iletisim
 * İletişim formu gönderimi — doğrular ve kayda alır (demo: bellekte tutar).
 */
router.post('/', (req, res, next) => {
  const govde = req.body || {};
  const { gecerli, hatalar } = iletisimFormuDogrula(govde);

  if (!gecerli) {
    return next(dogrulamaHatasi(hatalar));
  }

  const kayit = {
    id: `MSG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    ad: String(govde.ad).trim(),
    telefon: String(govde.telefon).trim(),
    eposta: govde.eposta ? String(govde.eposta).trim() : null,
    konu: govde.konu ? String(govde.konu).trim() : 'genel',
    mesaj: String(govde.mesaj).trim(),
    alindi: new Date().toISOString()
  };

  logger.info('Yeni iletişim mesajı alındı', { id: kayit.id, ad: kayit.ad });

  res.status(201).json({
    basarili: true,
    mesaj: `Teşekkürler ${kayit.ad}! Mesajınız alındı, en kısa sürede size dönüş yapacağız.`,
    veri: kayit
  });
});

module.exports = router;
