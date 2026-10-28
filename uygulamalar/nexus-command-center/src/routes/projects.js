'use strict';

/**
 * Proje rotaları — /api/projects
 * İlerleme yüzdesi BURADA HESAPLANMAZ, db.projectProgress'ten TÜRETİLİR.
 */

const express = require('express');
const db = require('../store/db');
const { validateProject, fail } = require('../lib/validate');

const router = express.Router();

function decorate(database, project) {
  const p = db.projectProgress(database, project.id);
  return { ...project, progress: p.percent, taskTotal: p.total, taskDone: p.done };
}

/* GET /api/projects?status=&q= */
router.get('/', (req, res) => {
  const database = db.read();
  const { status, q } = req.query;
  let list = database.projects.map((p) => decorate(database, p));
  if (status && status !== 'hepsi') list = list.filter((p) => p.status === status);
  if (q) {
    const needle = String(q).toLocaleLowerCase('tr');
    list = list.filter(
      (p) =>
        p.name.toLocaleLowerCase('tr').includes(needle) ||
        (p.description || '').toLocaleLowerCase('tr').includes(needle)
    );
  }
  res.json({ ok: true, data: list });
});

/* GET /api/projects/:id */
router.get('/:id', (req, res) => {
  const database = db.read();
  const project = database.projects.find((p) => p.id === req.params.id);
  if (!project) return fail(res, 404, 'Proje bulunamadı.');
  res.json({ ok: true, data: decorate(database, project) });
});

/* POST /api/projects */
router.post('/', (req, res) => {
  const v = validateProject(req.body);
  if (!v.ok) return fail(res, 400, v.error);

  const created = db.mutate((database) => {
    const project = {
      id: 'prj-' + Math.random().toString(36).slice(2, 9),
      ...v.value,
      createdAt: new Date().toISOString(),
    };
    database.projects.unshift(project);
    return {
      value: project,
      activity: {
        type: 'proje',
        actor: v.value.owner || 'Bilinmeyen',
        action: 'Proje oluşturuldu',
        detail: `${project.name} · durum: ${project.status}`,
      },
    };
  });

  const database = db.read();
  res.status(201).json({ ok: true, data: decorate(database, created) });
});

/* PUT /api/projects/:id */
router.put('/:id', (req, res) => {
  const v = validateProject(req.body, { partial: true });
  if (!v.ok) return fail(res, 400, v.error);

  const database0 = db.read();
  const exists = database0.projects.some((p) => p.id === req.params.id);
  if (!exists) return fail(res, 404, 'Proje bulunamadı.');

  const updated = db.mutate((database) => {
    const project = database.projects.find((p) => p.id === req.params.id);
    const before = project.status;
    Object.assign(project, v.value);
    const statusChanged = v.value.status && v.value.status !== before;
    return {
      value: project,
      activity: statusChanged
        ? { type: 'proje', actor: project.owner || 'Sistem', action: 'Proje durumu değişti', detail: `${project.name}: ${before} → ${project.status}` }
        : null,
    };
  });

  res.json({ ok: true, data: decorate(db.read(), updated) });
});

/* DELETE /api/projects/:id?tasks=detach|delete */
router.delete('/:id', (req, res) => {
  const mode = req.query.tasks === 'delete' ? 'delete' : 'detach';
  const database0 = db.read();
  const project = database0.projects.find((p) => p.id === req.params.id);
  if (!project) return fail(res, 404, 'Proje bulunamadı.');

  const result = db.mutate((database) => {
    const idx = database.projects.findIndex((p) => p.id === req.params.id);
    const [removed] = database.projects.splice(idx, 1);
    let affected = 0;
    database.tasks.forEach((task) => {
      if (task.projectId === removed.id) {
        affected += 1;
        if (mode === 'delete') task.projectId = null;
        else task.projectId = null; // projesiz görev olarak kalır, veri kaybı yok
      }
    });
    return {
      value: { removed: removed.id, affectedTasks: affected, mode },
      activity: {
        type: 'proje',
        actor: 'Sistem',
        action: 'Proje silindi',
        detail: `${removed.name} (${affected} görev projesiz bırakıldı)`,
      },
    };
  });

  res.json({ ok: true, data: result });
});

module.exports = router;
