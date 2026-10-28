'use strict';

/**
 * routes/reports.js
 * Kategori bazlı raporlama — API ucu + HTML rapor sayfası.
 */

const express = require('express');
const router = express.Router();
const reportService = require('../services/reportService');
const categoryModel = require('../models/categoryModel');

/** GET /category — raporlama sayfası (tüm kategori özetleri + seçim) */
router.get('/category', (req, res) => {
  const categories = categoryModel.readAll();
  const summaries = reportService.allCategorySummary();
  res.render('reports/category', {
    title: 'Kategori Raporu',
    categories,
    summaries,
    bodyClass: 'reports-page'
  });
});

/** GET /api/category/:id — JSON rapor ucu */
router.get('/api/category/:id', (req, res) => {
  const { from, to } = req.query;
  const idParam = req.params.id;
  const catId = idParam === 'all' ? 0 : Number(idParam);
  if (isNaN(catId) && idParam !== 'all') {
    return res.status(400).json({ error: 'Geçersiz kategori ID' });
  }
  const report = reportService.categoryReport(catId, {
    fromDate: from || '',
    toDate: to || ''
  });
  res.json(report);
});

/** GET /api/all — tüm kategorilerin özet raporu (JSON) */
router.get('/api/all', (req, res) => {
  res.json(reportService.allCategorySummary());
});

module.exports = router;
