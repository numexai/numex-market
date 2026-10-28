'use strict';

/**
 * Görünüm: Projeler
 * Oluşturma / düzenleme / silme + durum değiştirme + arama.
 * İlerleme yüzdesi proje kartında gösterilir ama KAYNAĞI görevlerdir.
 */

const ViewProjects = (() => {
  let query = '';
  let statusFilter = 'hepsi';

  function render(host) {
    const all = State.data.projects;

    host.innerHTML = `
      <div class="toolbar">
        <div class="toolbar-left">
          <div class="search-box">
            <span class="search-ico">⌕</span>
            <input type="search" id="projSearch" placeholder="Proje ara…" value="${UI.esc(query)}" />
          </div>
          <select id="projStatusFilter" class="select-sm">
            ${opt('hepsi', 'Tüm durumlar', statusFilter)}
            ${opt('planlandi', 'Planlandı', statusFilter)}
            ${opt('devam', 'Devam Ediyor', statusFilter)}
            ${opt('tamamlandi', 'Tamamlandı', statusFilter)}
          </select>
        </div>
        <div class="toolbar-right">
          <span class="count-chip" id="projCount"></span>
          <button class="btn btn-primary" id="newProjectBtn">+ Yeni Proje</button>
        </div>
      </div>
      <div id="projectGrid"></div>
    `;

    const search = host.querySelector('#projSearch');
    search.addEventListener('input', (e) => { query = e.target.value; paintGrid(all); });

    host.querySelector('#projStatusFilter').addEventListener('change', (e) => {
      statusFilter = e.target.value;
      paintGrid(all);
    });

    host.querySelector('#newProjectBtn').addEventListener('click', () => App.openProjectForm(null));

    paintGrid(all);
  }

  function paintGrid(all) {
    const grid = document.getElementById('projectGrid');
    const countChip = document.getElementById('projCount');
    if (!grid) return;

    const needle = query.toLocaleLowerCase('tr');
    const list = all.filter((p) => {
      const matchQ = !needle || p.name.toLocaleLowerCase('tr').includes(needle) ||
        (p.description || '').toLocaleLowerCase('tr').includes(needle);
      const matchS = statusFilter === 'hepsi' || p.status === statusFilter;
      return matchQ && matchS;
    });

    if (countChip) countChip.textContent = `${list.length} / ${all.length} proje`;

    if (!list.length) {
      grid.innerHTML = all.length
        ? UI.emptyState('Eşleşen proje yok', 'Arama veya filtreyi değiştirip tekrar dene.',
            '<button class="btn btn-ghost" id="clearProjFilter">Filtreleri temizle</button>')
        : UI.emptyState('Henüz proje yok', 'İlk projeyi oluşturup görevleri bağlamaya başla.',
            '<button class="btn btn-primary" id="emptyNewProject">+ Yeni Proje</button>');
      const clear = grid.querySelector('#clearProjFilter');
      if (clear) clear.addEventListener('click', () => {
        query = ''; statusFilter = 'hepsi';
        const s = document.getElementById('projSearch');
        if (s) s.value = '';
        const f = document.getElementById('projStatusFilter');
        if (f) f.value = 'hepsi';
        paintGrid(all);
      });
      const emptyNew = grid.querySelector('#emptyNewProject');
      if (emptyNew) emptyNew.addEventListener('click', () => App.openProjectForm(null));
      return;
    }

    grid.className = 'project-grid';
    grid.innerHTML = list.map(card).join('');

    grid.querySelectorAll('[data-edit]').forEach((b) =>
      b.addEventListener('click', () => App.openProjectForm(b.dataset.edit)));
    grid.querySelectorAll('[data-del]').forEach((b) =>
      b.addEventListener('click', () => App.deleteProject(b.dataset.del)));
    grid.querySelectorAll('[data-status]').forEach((sel) =>
      sel.addEventListener('change', () => App.changeProjectStatus(sel.dataset.status, sel.value)));
    grid.querySelectorAll('[data-tasks]').forEach((b) =>
      b.addEventListener('click', () => {
        State.setFilter('projectId', b.dataset.tasks);
        State.setFilter('status', 'hepsi');
        App.navigate('tasks');
      }));
  }

  function card(p) {
    const deadlineMeta = p.deadline
      ? (p.deadline < UI.today() && p.status !== 'tamamlandi'
          ? `<span class="due due-over">${UI.formatDate(p.deadline)} · gecikti</span>`
          : `<span class="due due-ok">${UI.formatDate(p.deadline)}</span>`)
      : `<span class="due due-none">Tarih yok</span>`;

    return `<article class="project-card" style="--accent:${UI.esc(p.color)}">
      <div class="pc-top">
        <span class="pc-dot"></span>
        <h3 class="pc-name">${UI.esc(p.name)}</h3>
        <div class="pc-actions">
          <button class="icon-btn sm" data-edit="${UI.esc(p.id)}" title="Düzenle">&#9998;</button>
          <button class="icon-btn sm danger" data-del="${UI.esc(p.id)}" title="Sil">&#10005;</button>
        </div>
      </div>

      <p class="pc-desc">${UI.esc(p.description || 'Açıklama girilmemiş.')}</p>

      <div class="pc-progress">
        <div class="pc-progress-head">
          <span>İlerleme</span><strong>${p.progress}%</strong>
        </div>
        <div class="progress-track"><div class="progress-fill" style="width:${p.progress}%;background:${UI.esc(p.color)}"></div></div>
        <div class="pc-progress-sub">${p.taskDone}/${p.taskTotal} görev tamamlandı${p.overdue ? ' · <span class="text-danger">' + p.overdue + ' geciken</span>' : ''}</div>
      </div>

      <div class="pc-meta">
        <span class="meta-item"><span class="avatar" style="background:${UI.colorFor(p.owner)}">${UI.initials(p.owner)}</span>${UI.esc(p.owner)}</span>
        ${deadlineMeta}
      </div>

      <div class="pc-foot">
        <select class="select-xs" data-status="${UI.esc(p.id)}">
          ${opt('planlandi', 'Planlandı', p.status)}
          ${opt('devam', 'Devam Ediyor', p.status)}
          ${opt('tamamlandi', 'Tamamlandı', p.status)}
        </select>
        <button class="btn btn-ghost sm" data-tasks="${UI.esc(p.id)}">Görevleri gör</button>
      </div>
    </article>`;
  }

  function opt(value, label, current) {
    return `<option value="${UI.esc(value)}"${value === current ? ' selected' : ''}>${UI.esc(label)}</option>`;
  }

  return { render };
})();
