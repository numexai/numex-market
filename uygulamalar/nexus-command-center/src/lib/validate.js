'use strict';

/**
 * Doğrulama katmanı — form doğrulaması sunucuda da ZORUNLU.
 * İstemci doğrulaması yalnızca UX içindir; gerçek kapı burasıdır.
 */

const PRIORITIES = ['dusuk', 'orta', 'yuksek', 'kritik'];
const TASK_STATUS = ['todo', 'in_progress', 'done'];
const PROJECT_STATUS = ['planlandi', 'devam', 'tamamlandi'];

function fail(res, code, error, extra) {
  return res.status(code).json({ ok: false, error, ...(extra || {}) });
}

function trim(v) {
  return typeof v === 'string' ? v.trim() : '';
}

function isDate(v) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(v || ''));
}

function validateProject(body = {}, opts = {}) {
  const partial = !!opts.partial;
  const out = {};

  if (!partial || 'name' in body) {
    const name = trim(body.name);
    if (name.length < 2) return { ok: false, error: 'Proje adı en az 2 karakter olmalı.' };
    if (name.length > 80) return { ok: false, error: 'Proje adı 80 karakteri aşamaz.' };
    out.name = name;
  }
  if (!partial || 'description' in body) {
    out.description = trim(body.description).slice(0, 400);
  }
  if (!partial || 'status' in body) {
    const status = trim(body.status) || 'planlandi';
    if (!PROJECT_STATUS.includes(status)) {
      return { ok: false, error: `Geçersiz proje durumu. Seçenekler: ${PROJECT_STATUS.join(', ')}` };
    }
    out.status = status;
  }
  if (!partial || 'owner' in body) {
    const owner = trim(body.owner);
    if (owner.length < 2) return { ok: false, error: 'Sorumlu kişi seçilmeli.' };
    out.owner = owner;
  }
  if (!partial || 'deadline' in body) {
    const deadline = trim(body.deadline);
    if (deadline && !isDate(deadline)) return { ok: false, error: 'Bitiş tarihi GG biçiminde olmalı (YYYY-AA-GG).' };
    out.deadline = deadline || null;
  }
  if (!partial || 'color' in body) {
    const color = trim(body.color) || '#4f8cff';
    if (!/^#[0-9a-fA-F]{6}$/.test(color)) return { ok: false, error: 'Renk geçersiz (örnek: #4f8cff).' };
    out.color = color;
  }

  return { ok: true, value: out };
}

function validateTask(body = {}, opts = {}) {
  const partial = !!opts.partial;
  const out = {};

  if (!partial || 'title' in body) {
    const title = trim(body.title);
    if (title.length < 3) return { ok: false, error: 'Görev başlığı en az 3 karakter olmalı.' };
    if (title.length > 120) return { ok: false, error: 'Görev başlığı 120 karakteri aşamaz.' };
    out.title = title;
  }
  if (!partial || 'description' in body) {
    out.description = trim(body.description).slice(0, 600);
  }
  if (!partial || 'priority' in body) {
    const priority = trim(body.priority) || 'orta';
    if (!PRIORITIES.includes(priority)) {
      return { ok: false, error: `Geçersiz öncelik. Seçenekler: ${PRIORITIES.join(', ')}` };
    }
    out.priority = priority;
  }
  if (!partial || 'assignee' in body) {
    const assignee = trim(body.assignee);
    if (assignee.length < 2) return { ok: false, error: 'Sorumlu kişi seçilmeli.' };
    out.assignee = assignee;
  }
  if (!partial || 'due' in body) {
    const due = trim(body.due);
    if (due && !isDate(due)) return { ok: false, error: 'Son tarih geçersiz (YYYY-AA-GG).' };
    out.due = due || null;
  }
  if (!partial || 'status' in body) {
    const status = trim(body.status) || 'todo';
    if (!TASK_STATUS.includes(status)) {
      return { ok: false, error: `Geçersiz görev durumu. Seçenekler: ${TASK_STATUS.join(', ')}` };
    }
    out.status = status;
  }
  if (!partial || 'projectId' in body) {
    const projectId = trim(body.projectId);
    out.projectId = projectId || null;
  }

  return { ok: true, value: out };
}

module.exports = {
  validateProject,
  validateTask,
  fail,
  PRIORITIES,
  TASK_STATUS,
  PROJECT_STATUS,
};
