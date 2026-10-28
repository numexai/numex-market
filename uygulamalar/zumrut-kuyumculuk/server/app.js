'use strict';

const path = require('path');
const express = require('express');
const { istekKaydedici } = require('./lib/logger');
const { apiBulunamadi, hataYakalayici } = require('./lib/hataYonetimi');

const urunlerRoute = require('./routes/urunler');
const kurlarRoute = require('./routes/kurlar');
const iletisimRoute = require('./routes/iletisim');

/**
 * Express uygulamasını kurar ve döner.
 * Sunucudan ayrı tutulur ki testler (supertest) doğrudan kullanabilsin.
 * @returns {import('express').Express}
 */
function uygulamaOlustur() {
  const app = express();

  // Statik site kökü: index.html, css/, js/, data/, assets/
  const KOK = path.resolve(__dirname, '..');

  app.disable('x-powered-by');
  app.use(express.json({ limit: '100kb' }));
  app.use(express.urlencoded({ extended: false }));
  app.use(istekKaydedici());

  // --- API katmanı ---
  app.get('/api/saglik', (req, res) => {
    res.json({
      basarili: true,
      durum: 'calisiyor',
      uygulama: 'Zümrüt Kuyumculuk',
      surum: require('../package.json').version,
      zaman: new Date().toISOString()
    });
  });

  app.use('/api/urunler', urunlerRoute);
  app.use('/api/kurlar', kurlarRoute);
  app.use('/api/iletisim', iletisimRoute);

  // Eşleşmeyen /api/* yolları JSON 404 döner (HTML fallback'e düşmesin)
  app.use('/api', apiBulunamadi);

  // --- Statik arayüz ---
  app.use(
    express.static(KOK, {
      extensions: ['html'],
      maxAge: process.env.NODE_ENV === 'production' ? '1d' : 0
    })
  );

  // Bilinmeyen sayfa yolları için ana sayfa (tek sayfa site)
  app.get('*', (req, res) => {
    res.sendFile(path.join(KOK, 'index.html'));
  });

  app.use(hataYakalayici);

  return app;
}

module.exports = { uygulamaOlustur };
