'use strict';

/**
 * Genel Bakış (Dashboard) — /api/summary
 * Tüm sayılar TEK yerde, canlı veriden türetilir. İstemci kendi başına
 * sayı uydurmaz; sayfayı yenilediğinde bu uç nokta tekrar çağrılır.
 */

const express = require('express');
const db = require('../store/db');

const router = express.Router();

const PRIORITY_LABEL = { dusuk: 'Düşük', orta: 'Orta', yuksek: 'Yüksek', kritik: 'Kritik' };

router.get('/', (_req, res) => {
  const database = db.read();

  const openTasks = database.tasks.filter((t) => t.status !== 'done').length;
  const doneTasks = database.tasks.filter((t) => t.status === 'done').length;
  const overdueTasks = database.tasks.filter((t) => db.isOverdue(t)).length;
  const inProgress = database.tasks.filter((t) => t.status === 'in_progress').length;

  const byPriority = Object.keys(PRIORITY_LABEL).map((key) => ({
    key,
    label: PRIORITY_LABEL[key],
    total: database.tasks.filter((t) => t.priority === key).length,
    open: database.tasks.filter((t) => t.priority === key && t.status !== 'done').length,
  }));

  const projects = database.projects.map((p) => {
    const prog = db.projectProgress(database, p.id);
    return {
      id: p.id,
      name: p.name,
      color: p.color,
      status: p.status,
      owner: p.owner,
      deadline: p.deadline,
      progress: prog.percent,
      taskTotal: prog.total,
      taskDone: prog.done,
      overdue: database.tasks.filter((t) => t.projectId === p.id && db.isOverdue(t)).length,
    };
  });

  const statusBuckets = {
    todo: database.tasks.filter((t) => t.status === 'todo').length,
    in_progress: inProgress,
    done: doneTasks,
  };

  res.json({
    ok: true,
    data: {
      totals: {
        projects: database.projects.length,
        activeProjects: database.projects.filter((p) => p.status === 'devam').length,
        openTasks,
        doneTasks,
        overdueTasks,
        inProgress,
        completionRate: database.tasks.length ? Math.round((doneTasks / database.tasks.length) * 100) : 0,
      },
      statusBuckets,
      byPriority,
      projects,
      recentActivity: database.activity.slice(0, 8),
      generatedAt: new Date().toISOString(),
    },
  });
});

module.exports = router;
