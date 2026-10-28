'use strict';

/**
 * Görünüm: Görevler
 * - Kanban (todo / in_progress / done) + sürükle-bırak
 * - Canlı arama + öncelik / proje / durum / sorumlu filtreleri
 * - Görev oluştur / düzenle / sil
 * Filtreler sunucuya gönderilir; böylece liste ve kanban TUTARLI olur.
 */

const ViewTasks = (() => {
  const COLUMNS = [
    { key: 'todo', label: 'Yapılacak', color: 'var(--todo)' },
    { key: 'in_progress', label: 'Devam Ediyor', color: 'var(--progress)' },
    { key: 'done', label: 'Tamamlandı', color: 'var(--done)' },
  ];

  let searchTimer = null;

  function render(host) {
    const f = State.data.filters;

    host.innerHTML = `
      <div class="toolbar toolbar-wrap">
        <div class="toolbar-left">
          <div class="search-box">
            <span class="search-ico">⌕</span>
            <input type="search" id="taskSearch" placeholder="Görev, açıklama, kişi veya proje ara…" value="${UI.esc(f.q)}" />
            <button class="search-clear" id="taskSearchClear" title="Temizle"${f.q ? '' : ' hidden'}>+</button>
          </div>
        </div>
        <div class="toolbar-right">
          <select id="fPriority" class="select-sm" title="Öncelik filtresi">
            ${opt('hepsi', 'Tüm öncelikler', f.priority)}
            ${opt('kritik', 'Kritik', f.priority)}
            ${opt('yuksek', 'Yüksek', f.priority)}
            ${opt('orta', 'Orta', f.priority)}
            ${opt('dusuk', 'Düşük', f.priority)}
          </select>
          <select id="fProject" class="select-sm" title="Proje filtresi">
            ${opt('hepsi', 'Tüm projeler', f.projectId)}
            ${opt('yok', 'Projesiz', f.projectId)}
            ${State.data.projects.map((p) => opt(p.id, p.name, f.projectId)).join('')}
          </select>
          <select id="fStatus" class="select-sm" title="Durum filtresi">
            ${opt('hepsi', 'Tüm durumlar', f.status)}
            ${opt('todo', 'Yapılacak', f.status)}
            ${opt('in_progress', 'Devam Ediyor', f.status)}
            ${opt('done', 'Tamamlandı', f.status)}
          </select>
          <select id="fAssignee" class="select-sm" title="Sorumlu filtresi">
            ${opt('hepsi', 'Tüm sorumlular', f.assignee)}
            ${State.data.team.map((m) => opt(m.name, m.name, f.assignee)).join('')}
          </select>
          <select id="fSort" class="select-sm" title="Sıralama">
            ${opt('default', 'Sıralama: varsayılan', f.sort)}
            ${opt('priority', 'Sıralama: öncelik', f.sort)}
            ${opt('due', 'Sıralama: son tarih', f.sort)}
            ${opt('title', 'Sıralama: başlık', f.sort)}
          </select>
          <button class="btn btn-ghost" id="resetFiltersBtn">Sıfırla</button>
          <button class="btn btn-primary" id="newTaskBtn">+ Yeni Görev</button>
        </div>
      </div>

      <div class="filter-summary" id="filterSummary"></div>
      <div id="kanbanHost"></div>
      <div id="listHost"></div>
    `;

    /* Canlı arama — 300ms debounce, sunucuya filtre olarak gider */
    const search = host.querySelector('#taskSearch');
    const clearBtn = host.querySelector('#taskSearchClear');
    search.addEventListener('input', (e) => {
      const val = e.target.value;
      clearBtn.hidden = !val;
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => {
        State.setFilter('q', val);
        refreshData();
      }, 300);
    });
    clearBtn.addEventListener('click', () => {
      search.value = '';
      clearBtn.hidden = true;
      State.setFilter('q', '');
      refreshData();
    });

    host.querySelector('#fPriority').addEventListener('change', (e) => { State.setFilter('priority', e.target.value); refreshData(); });
    host.querySelector('#fProject').addEventListener('change', (e) => { State.setFilter('projectId', e.target.value); refreshData(); });
    host.querySelector('#fStatus').addEventListener('change', (e) => { State.setFilter('status', e.target.value); refreshData(); });
    host.querySelector('#fAssignee').addEventListener('change', (e) => { State.setFilter('assignee', e.target.value); refreshData(); });
    host.querySelector('#fSort').addEventListener('change', (e) => { State.setFilter('sort', e.target.value); refreshData(); });
    host.querySelector('#resetFiltersBtn').addEventListener('click', () => {
      State.resetFilters();
      render(App.host());
    });
    host.querySelector('#newTaskBtn').addEventListener('click', () => App.openTaskForm(null));

    paint();
  }

  /** Filtre değişince görünümü yeniden çiz, DOM'u bozmadan. */
  async function refreshData() {
    try {
      await State.refresh('filters');
      paint();
    } catch (err) {
      UI.toast(err.message, 'err');
    }
  }

  function paint() {
    const kanbanHost = document.getElementById('kanbanHost');
    if (!kanbanHost) return;

    const tasks = State.data.tasks;
    const f = State.data.filters;

    /* Aktif filtre özeti */
    const chips = [];
    if (f.q) chips.push('arama: "' + f.q + '"');
    if (f.priority !== 'hepsi') chips.push('öncelik: ' + UI.PRIORITY_LABEL[f.priority]);
    if (f.projectId !== 'hepsi') {
      const p = State.data.projects.find((x) => x.id === f.projectId);
      chips.push('proje: ' + (f.projectId === 'yok' ? 'Projesiz' : (p ? p.name : '?')));
    }
    if (f.status !== 'hepsi') chips.push('durum: ' + UI.STATUS_LABEL[f.status]);
    if (f.assignee !== 'hepsi') chips.push('sorumlu: ' + f.assignee);

    const summary = document.getElementById('filterSummary');
    if (summary) {
      summary.innerHTML = chips.length
        ? `<span class="chip-label">Aktif filtreler:</span> ${chips.map((c) => `<span class="filter-chip">${UI.esc(c)}</span>`).join('')}
           <span class="filter-total">${tasks.length} görev listeleniyor</span>`
        : `<span class="filter-total">${tasks.length} görev · ${State.data.projects.length} proje</span>`;
    }

    if (!tasks.length) {
      kanbanHost.innerHTML = '';
      document.getElementById('listHost').innerHTML = UI.emptyState(
        'Eşleşen görev yok',
        chips.length ? 'Filtreleri gevşetip tekrar dene.' : 'İlk görevi oluşturarak başla.',
        chips.length
          ? '<button class="btn btn-ghost" id="clearTaskFilters">Filtreleri sıfırla</button>'
          : '<button class="btn btn-primary" id="emptyNewTask">+ Yeni Görev</button>'
      );
      const c = document.getElementById('clearTaskFilters');
      if (c) c.addEventListener('click', () => { State.resetFilters(); render(App.host()); });
      const n = document.getElementById('emptyNewTask');
      if (n) n.addEventListener('click', () => App.openTaskForm(null));
      return;
    }

    /* --- Kanban --- */
    kanbanHost.className = 'kanban';
    kanbanHost.innerHTML = COLUMNS.map((col) => {
      const items = tasks.filter((t) => t.status === col.key);
      return `<section class="kanban-col" data-status="${col.key}">
        <header class="kanban-head" style="--col:${col.color}">
          <span class="kanban-dot"></span>
          <h3>${UI.esc(col.label)}</h3>
          <span class="kanban-count">${items.length}</span>
        </header>
        <div class="kanban-body">
          ${items.length ? items.map(card).join('') : '<div class="kanban-empty">Buraya sürükle</div>'}
        </div>
      </section>`;
    }).join('');

    if (!kanbanHost.dataset.dndBound) {
      DnD.attach(kanbanHost, { onDrop: App.moveTask });
      kanbanHost.dataset.dndBound = '1';
    }

    kanbanHost.querySelectorAll('[data-edit-task]').forEach((b) =>
      b.addEventListener('click', (e) => { e.stopPropagation(); App.openTaskForm(b.dataset.editTask); }));
    kanbanHost.querySelectorAll('[data-del-task]').forEach((b) =>
      b.addEventListener('click', (e) => { e.stopPropagation(); App.deleteTask(b.dataset.delTask); }));

    /* --- Detaylı liste görünümü (aynı veri, tablo halinde) --- */
    document.getElementById('listHost').innerHTML = `
      <details class="list-details">
        <summary>Liste görünümü · ${tasks.length} kayıt</summary>
        <div class="table-wrap">
          <table class="table">
            <thead><tr>
              <th>Başlık</th><th>Öncelik</th><th>Sorumlu</th><th>Proje</th><th>Durum</th><th>Son Tarih</th><th></th>
            </tr></thead>
            <tbody>
              ${tasks.map(row).join('')}
            </tbody>
          </table>
        </div>
      </details>`;

    document.querySelectorAll('[data-row-edit]').forEach((b) =>
      b.addEventListener('click', () => App.openTaskForm(b.dataset.rowEdit)));
    document.querySelectorAll('[data-row-del]').forEach((b) =>
      b.addEventListener('click', () => App.deleteTask(b.dataset.rowDel)));
    document.querySelectorAll('[data-row-status]').forEach((sel) =>
      sel.addEventListener('change', () => App.moveTask(sel.dataset.rowStatus, sel.value)));
  }

  function card(t) {
    const d = UI.dueMeta(t);
    return `<article class="kanban-card prio-${UI.esc(t.priority)}" draggable="true"
        data-id="${UI.esc(t.id)}" data-status="${UI.esc(t.status)}" title="Sürükle veya seçip ← → tuşlarıyla taşı">
      <div class="kc-top">
        <span class="prio prio-${UI.esc(t.priority)}">${UI.PRIORITY_LABEL[t.priority]}</span>
        <div class="kc-actions">
          <button class="icon-btn xs" data-edit-task="${UI.esc(t.id)}" title="Düzenle">&#9998;</button>
          <button class="icon-btn xs danger" data-del-task="${UI.esc(t.id)}" title="Sil">&#10005;</button>
        </div>
      </div>
      <h4 class="kc-title">${UI.esc(t.title)}</h4>
      ${t.description ? `<p class="kc-desc">${UI.esc(t.description)}</p>` : ''}
      ${t.projectName
        ? `<span class="kc-project" style="--pc:${UI.esc(t.projectColor || '#4f8cff')}">${UI.esc(t.projectName)}</span>`
        : '<span class="kc-project kc-noproject">Projesiz</span>'}
      <div class="kc-foot">
        <span class="meta-item"><span class="avatar" style="background:${UI.colorFor(t.assignee)}">${UI.initials(t.assignee)}</span>${UI.esc(t.assignee)}</span>
        <span class="due ${d.cls}">${UI.esc(d.text)}</span>
      </div>
    </article>`;
  }

  function row(t) {
    const d = UI.dueMeta(t);
    return `<tr>
      <td class="td-title">${UI.esc(t.title)}${t.overdue ? ' <span class="tag-over">gecikti</span>' : ''}</td>
      <td><span class="prio prio-${UI.esc(t.priority)}">${UI.PRIORITY_LABEL[t.priority]}</span></td>
      <td>${UI.esc(t.assignee)}</td>
      <td>${t.projectName ? UI.esc(t.projectName) : '<span class="text-muted">—</span>'}</td>
      <td>
        <select class="select-xs" data-row-status="${UI.esc(t.id)}">
          ${opt('todo', 'Yapılacak', t.status)}
          ${opt('in_progress', 'Devam', t.status)}
          ${opt('done', 'Tamamlandı', t.status)}
        </select>
      </td>
      <td><span class="due ${d.cls}">${UI.esc(d.text)}</span></td>
      <td class="td-actions">
        <button class="icon-btn xs" data-row-edit="${UI.esc(t.id)}" title="Düzenle">&#9998;</button>
        <button class="icon-btn xs danger" data-row-del="${UI.esc(t.id)}" title="Sil">&#10005;</button>
      </td>
    </tr>`;
  }

  function opt(value, label, current) {
    return `<option value="${UI.esc(value)}"${value === current ? ' selected' : ''}>${UI.esc(label)}</option>`;
  }

  return { render, paint, COLUMNS };
})();
