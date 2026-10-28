'use strict';

/**
 * Görev rotaları — /api/tasks
 * Kanban drag&drop buradaki PATCH /:id/status ile durum değiştirir.
 * Her durum değişimi aktivite günlüğüne düşer.
 */

const express = require('express');
const db = require('../store/db');
const { validateTask, fail } = require('../lib/validate');

const router = express.Router();

const PRIORITY_RANK = { kritik: 0, yuksek: 1, orta: 2, dusuk: 3 };

function decorate(database, task) {
  const project = database.projects.find((p) => p.id === task.projectId) || null;
  return {
    ...task,
    overdue: db.isOverdue(task),
    projectName: project ? project.name : null,
    projectColor: project ? project.color : null,
  };
}

/* GET /api/tasks?q=&priority=&projectId=&status=&assignee=&overdue=&sort= */
router.get('/', (req, res) => {
  const database = db.read();
  const { q, priority, projectId, status, assignee, overdue, sort } = req.query;

  let list = database.tasks.map((t) => decorate(database, t));

  if (q) {
    const needle = String(q).toLocaleLowerCase('tr');
    list = list.filter(
      (t) =>
        (t.title || '').toLocaleLowerCase('tr').includes(needle) ||
        (t.description || '').toLocaleLowerCase('tr').includes(needle) ||
        (t.assignee || '').toLocaleLowerCase('tr').includes(needle) ||
        (t.projectName || '').toLocaleLowerCase('tr').includes(needle)
    );
  }
  if (priority && priority !== 'hepsi') list = list.filter((t) => t.priority === priority);
  if (projectId && projectId !== 'hepsi') {
    list = projectId === 'yok' ? list.filter((t) => !t.projectId) : list.filter((t) => t.projectId === projectId);
  }
  if (status && status !== 'hepsi') list = list.filter((t) => t.status === status);
  if (assignee && assignee !== 'hepsi') list = list.filter((t) => t.assignee === assignee);
  if (overdue === '1') list = list.filter((t) => t.overdue);

  if (sort === 'priority') list.sort((a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority]);
  else if (sort === 'due') list.sort((a, b) => String(a.due || '9999').localeCompare(String(b.due || '9999')));
  else if (sort === 'title') list.sort((a, b) => a.title.localeCompare(b.title, 'tr'));

  res.json({ ok: true, data: list });
});

/* POST /api/tasks */
router.post('/', (req, res) => {
  const v = validateTask(req.body);
  if (!v.ok) return fail(res, 400, v.error);

  const database0 = db.read();
  if (v.value.projectId && !database0.projects.some((p) => p.id === v.value.projectId)) {
    return fail(res, 400, 'Seçilen proje bulunamadı.');
  }

  const created = db.mutate((database) => {
    const task = {
      id: 'tsk-' + Math.random().toString(36).slice(2, 9),
      ...v.value,
      createdAt: new Date().toISOString(),
      completedAt: v.value.status === 'done' ? new Date().toISOString() : null,
    };
    database.tasks.unshift(task);
    return {
      value: task,
      activity: {
        type: 'gorev',
        actor: task.assignee,
        action: 'Görev oluşturuldu',
        detail: `${task.title} · öncelik: ${task.priority}`,
      },
    };
  });

  res.status(201).json({ ok: true, data: decorate(db.read(), created) });
});

/* PUT /api/tasks/:id — genel güncelleme (form düzenleme) */
router.put('/:id', (req, res) => {
  const v = validateTask(req.body, { partial: true });
  if (!v.ok) return fail(res, 400, v.error);

  const database0 = db.read();
  const current = database0.tasks.find((t) => t.id === req.params.id);
  if (!current) return fail(res, 404, 'Görev bulunamadı.');
  if (v.value.projectId && !database0.projects.some((p) => p.id === v.value.projectId)) {
    return fail(res, 400, 'Seçilen proje bulunamadı.');
  }

  const updated = db.mutate((database) => {
    const task = database.tasks.find((t) => t.id === req.params.id);
    const wasDone = task.status === 'done';
    Object.assign(task, v.value);
    if (task.status === 'done' && !wasDone) task.completedAt = new Date().toISOString();
    if (task.status !== 'done') task.completedAt = null;

    let activity = null;
    if (v.value.status && v.value.status !== current.status) {
      activity =
        v.value.status === 'done'
          ? { type: 'gorev', actor: task.assignee, action: 'Görev tamamlandı', detail: task.title }
          : { type: 'gorev', actor: task.assignee, action: 'Görev durumu değişti', detail: `${task.title}: ${current.status} → ${task.status}` };
    } else {
      activity = { type: 'gorev', actor: task.assignee, action: 'Görev güncellendi', detail: task.title };
    }
    return { value: task, activity };
  });

  res.json({ ok: true, data: decorate(db.read(), updated) });
});

/* PATCH /api/tasks/:id/status — Kanban sürükle-bırak hedefi.
   Aynı kolona bırakılırsa no-op döner (gereksiz aktivite kaydı yok). */
router.patch('/:id/status', (req, res) => {
  const status = String(req.body && req.body.status || '').trim();
  const allowed = ['todo', 'in_progress', 'done'];
  if (!allowed.includes(status)) return fail(res, 400, `Geçersiz durum. Seçenekler: ${allowed.join(', ')}`);

  const database0 = db.read();
  const current = database0.tasks.find((t) => t.id === req.params.id);
  if (!current) return fail(res, 404, 'Görev bulunamadı.');

  if (current.status === status) {
    return res.json({ ok: true, data: decorate(database0, current), changed: false });
  }

  const updated = db.mutate((database) => {
    const task = database.tasks.find((t) => t.id === req.params.id);
    const from = task.status;
    task.status = status;
    task.completedAt = status === 'done' ? new Date().toISOString() : null;
    return {
      value: task,
      activity:
        status === 'done'
          ? { type: 'gorev', actor: task.assignee, action: 'Görev tamamlandı', detail: task.title }
          : { type: 'gorev', actor: task.assignee, action: 'Görev taşındı', detail: `${task.title}: ${from} → ${status}` },
    };
  });

  res.json({ ok: true, data: decorate(db.read(), updated), changed: true });
});

/* DELETE /api/tasks/:id */
router.delete('/:id', (req, res) => {
  const database0 = db.read();
  const task = database0.tasks.find((t) => t.id === req.params.id);
  if (!task) return fail(res, 404, 'Görev bulunamadı.');

  const result = db.mutate((database) => {
    const idx = database.tasks.findIndex((t) => t.id === req.params.id);
    const [removed] = database.tasks.splice(idx, 1);
    return {
      value: removed.id,
      activity: { type: 'gorev', actor: 'Sistem', action: 'Görev silindi', detail: removed.title },
    };
  });

  res.json({ ok: true, data: result });
});

module.exports = router;
