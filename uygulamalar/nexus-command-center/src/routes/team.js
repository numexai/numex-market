'use strict';

/**
 * Ekip rotaları — /api/team
 * Üyeler görevlerden türetilen yük bilgisiyle birlikte döner (açık/tamamlanan/geciken).
 */

const express = require('express');
const db = require('../store/db');
const { fail } = require('../lib/validate');

const router = express.Router();

function workload(database, name) {
  const mine = database.tasks.filter((t) => t.assignee === name);
  const done = mine.filter((t) => t.status === 'done').length;
  const overdue = mine.filter((t) => db.isOverdue(t)).length;
  const open = mine.length - done;
  return {
    total: mine.length,
    open,
    done,
    overdue,
    loadPercent: mine.length ? Math.round((open / mine.length) * 100) : 0,
  };
}

function decorate(database, member) {
  return { ...member, workload: workload(database, member.name) };
}

/* GET /api/team */
router.get('/', (_req, res) => {
  const database = db.read();
  res.json({ ok: true, data: database.team.map((m) => decorate(database, m)) });
});

/* POST /api/team */
router.post('/', (req, res) => {
  const name = String(req.body && req.body.name || '').trim();
  const role = String(req.body && req.body.role || '').trim() || 'Ekip Üyesi';
  if (name.length < 2) return fail(res, 400, 'Üye adı en az 2 karakter olmalı.');

  const database0 = db.read();
  if (database0.team.some((m) => m.name.toLocaleLowerCase('tr') === name.toLocaleLowerCase('tr'))) {
    return fail(res, 409, 'Bu isimde bir ekip üyesi zaten var.');
  }

  const created = db.mutate((database) => {
    const palette = ['#4f8cff', '#22c55e', '#a855f7', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899'];
    const member = {
      id: 'usr-' + Math.random().toString(36).slice(2, 9),
      name,
      role,
      email: String(req.body.email || '').trim() || name.toLowerCase().replace(/\s+/g, '.') + '@ornek.com',
      color: req.body.color || palette[database.team.length % palette.length],
    };
    database.team.push(member);
    return {
      value: member,
      activity: { type: 'ekip', actor: 'Sistem', action: 'Ekip üyesi eklendi', detail: `${member.name} · ${member.role}` },
    };
  });

  res.status(201).json({ ok: true, data: decorate(db.read(), created) });
});

/* DELETE /api/team/:id — üyeye atanmış görev varsa engellenir (veri tutarlılığı). */
router.delete('/:id', (req, res) => {
  const database0 = db.read();
  const member = database0.team.find((m) => m.id === req.params.id);
  if (!member) return fail(res, 404, 'Üye bulunamadı.');

  const assigned = database0.tasks.filter((t) => t.assignee === member.name && t.status !== 'done');
  if (assigned.length > 0) {
    return fail(res, 409, `${member.name} adına atanmış ${assigned.length} açık görev var. Önce onları devredin.`);
  }

  db.mutate((database) => {
    const idx = database.team.findIndex((m) => m.id === req.params.id);
    const [removed] = database.team.splice(idx, 1);
    return {
      value: removed.id,
      activity: { type: 'ekip', actor: 'Sistem', action: 'Ekip üyesi çıkarıldı', detail: removed.name },
    };
  });

  res.json({ ok: true, data: member.id });
});

module.exports = router;
