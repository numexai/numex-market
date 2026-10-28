'use strict';

/**
 * Aktivite günlüğü — /api/activity
 * Tüm mutasyonlar db.mutate() içinde kayıt düşer; burada sadece okunur ve filtrelenir.
 */

const express = require('express');
const db = require('../store/db');

const router = express.Router();

/* GET /api/activity?type=&limit= */
router.get('/', (req, res) => {
  const database = db.read();
  const { type } = req.query;
  const limit = Math.min(Number(req.query.limit) || 60, 300);

  let list = database.activity.slice();
  if (type && type !== 'hepsi') list = list.filter((a) => a.type === type);

  const counts = database.activity.reduce((acc, a) => {
    acc[a.type] = (acc[a.type] || 0) + 1;
    return acc;
  }, {});

  res.json({ ok: true, data: list.slice(0, limit), counts, total: database.activity.length });
});

module.exports = router;
