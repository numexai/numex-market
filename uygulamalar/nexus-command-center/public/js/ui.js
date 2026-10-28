'use strict';

/**
 * UI yardımcıları — DOM kurma, kaçış, bildirim, modal, tarih biçimleme.
 * Tüm görünümler bu yardımcıları kullanır; innerHTML'e ham veri basılmaz.
 */

const UI = (() => {
  const PRIORITY_LABEL = { dusuk: 'Düşük', orta: 'Orta', yuksek: 'Yüksek', kritik: 'Kritik' };
  const STATUS_LABEL = { todo: 'Yapılacak', in_progress: 'Devam Ediyor', done: 'Tamamlandı' };
  const PROJECT_STATUS_LABEL = { planlandi: 'Planlandı', devam: 'Devam Ediyor', tamamlandi: 'Tamamlandı' };
  const ACTIVITY_ICON = { gorev: '☰', proje: '▤', ekip: '◉', sistem: '⚙', hata: '⚠' };

  /** HTML kaçışı — XSS'e karşı zorunlu. */
  function esc(value) {
    if (value === null || value === undefined) return '';
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function el(html) {
    const tpl = document.createElement('template');
    tpl.innerHTML = html.trim();
    return tpl.content.firstElementChild;
  }

  /** HTML string → DOM (çok köklü olabilir) */
  function nodes(html) {
    const tpl = document.createElement('template');
    tpl.innerHTML = html.trim();
    return tpl.content;
  }

  function today() {
    return new Date().toISOString().slice(0, 10);
  }

  function formatDate(iso) {
    if (!iso) return '—';
    const d = new Date(iso.length <= 10 ? iso + 'T00:00:00' : iso);
    if (isNaN(d)) return '—';
    return d.toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  function formatDateTime(iso) {
    if (!iso) return '—';
    const d = new Date(iso);
    if (isNaN(d)) return '—';
    return d.toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  }

  function relativeTime(iso) {
    const d = new Date(iso);
    const diff = Math.floor((Date.now() - d.getTime()) / 1000);
    if (diff < 60) return 'az önce';
    if (diff < 3600) return Math.floor(diff / 60) + ' dk önce';
    if (diff < 86400) return Math.floor(diff / 3600) + ' sa önce';
    if (diff < 604800) return Math.floor(diff / 86400) + ' gün önce';
    return formatDate(iso);
  }

  function dueMeta(task) {
    if (!task.due) return { text: 'Tarih yok', cls: 'due-none' };
    const overdue = task.overdue;
    const days = Math.ceil((new Date(task.due + 'T00:00:00') - new Date(today() + 'T00:00:00')) / 86400000);
    if (task.status === 'done') return { text: formatDate(task.due), cls: 'due-done' };
    if (overdue) return { text: `${formatDate(task.due)} · ${Math.abs(days)} gün gecikti`, cls: 'due-over' };
    if (days === 0) return { text: 'Bugün', cls: 'due-today' };
    if (days === 1) return { text: 'Yarın', cls: 'due-soon' };
    if (days <= 3) return { text: `${days} gün kaldı`, cls: 'due-soon' };
    return { text: formatDate(task.due), cls: 'due-ok' };
  }

  function initials(name) {
    if (!name) return '?';
    return name.trim().split(/\s+/).slice(0, 2).map((w) => w[0].toUpperCase()).join('');
  }

  function colorFor(name) {
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) % 360;
    return `hsl(${hash} 62% 52%)`;
  }

  /* ---------------- Bildirimler ---------------- */

  function toast(message, type = 'info') {
    const host = document.getElementById('toastHost');
    const icons = { ok: '✓', err: '!', info: 'i', warn: '⚠' };
    const node = el(`<div class="toast toast-${esc(type)}">
      <span class="toast-ico">${icons[type] || 'i'}</span>
      <span class="toast-msg">${esc(message)}</span>
    </div>`);
    host.appendChild(node);
    requestAnimationFrame(() => node.classList.add('in'));
    setTimeout(() => {
      node.classList.remove('in');
      setTimeout(() => node.remove(), 260);
    }, 3200);
  }

  /* ---------------- Modal ---------------- */

  function openModal(id) {
    const m = document.getElementById(id);
    if (!m) return;
    m.hidden = false;
    requestAnimationFrame(() => m.classList.add('open'));
    const first = m.querySelector('input:not([type=hidden]), select, textarea');
    if (first) setTimeout(() => first.focus(), 80);
  }

  function closeModal(id) {
    const m = document.getElementById(id);
    if (!m) return;
    m.classList.remove('open');
    setTimeout(() => { m.hidden = true; }, 180);
  }

  let confirmResolve = null;

  function confirmDialog(message, okLabel = 'Sil') {
    document.getElementById('confirmMessage').textContent = message;
    document.getElementById('confirmOk').textContent = okLabel;
    openModal('confirmModal');
    return new Promise((resolve) => { confirmResolve = resolve; });
  }

  function initConfirm() {
    document.getElementById('confirmOk').addEventListener('click', () => {
      closeModal('confirmModal');
      if (confirmResolve) { confirmResolve(true); confirmResolve = null; }
    });
    document.getElementById('confirmCancel').addEventListener('click', () => {
      closeModal('confirmModal');
      if (confirmResolve) { confirmResolve(false); confirmResolve = null; }
    });
  }

  /* ---------------- Form doğrulama gösterimi ---------------- */

  function clearErrors(form) {
    form.querySelectorAll('.field-error').forEach((e) => { e.textContent = ''; });
    form.querySelectorAll('.field.has-error').forEach((f) => f.classList.remove('has-error'));
  }

  function showErrors(form, errors) {
    clearErrors(form);
    Object.entries(errors).forEach(([field, message]) => {
      const slot = form.querySelector(`[data-error="${field}"]`);
      if (slot) {
        slot.textContent = message;
        const wrap = slot.closest('.field');
        if (wrap) wrap.classList.add('has-error');
      }
    });
    const first = form.querySelector('.field.has-error input, .field.has-error select, .field.has-error textarea');
    if (first) first.focus();
  }

  function emptyState(title, text, actionHtml = '') {
    return `<div class="empty">
      <div class="empty-ico">◌</div>
      <h3>${esc(title)}</h3>
      <p>${esc(text)}</p>
      ${actionHtml}
    </div>`;
  }

  function errorState(message, retryHtml = '<button class="btn btn-primary" data-retry="1">Tekrar dene</button>') {
    return `<div class="empty empty-error">
      <div class="empty-ico">⚠</div>
      <h3>Bir şeyler ters gitti</h3>
      <p>${esc(message)}</p>
      ${retryHtml}
    </div>`;
  }

  function skeleton(rows = 4) {
    return `<div class="skeleton-wrap">${Array.from({ length: rows })
      .map(() => '<div class="skeleton-row"></div>')
      .join('')}</div>`;
  }

  return {
    esc, el, nodes, toast, openModal, closeModal, confirmDialog, initConfirm,
    clearErrors, showErrors, emptyState, errorState, skeleton,
    formatDate, formatDateTime, relativeTime, dueMeta, initials, colorFor, today,
    PRIORITY_LABEL, STATUS_LABEL, PROJECT_STATUS_LABEL, ACTIVITY_ICON,
  };
})();
