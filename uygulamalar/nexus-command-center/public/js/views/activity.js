'use strict';

/**
 * Görünüm: Aktivite Günlüğü
 * Tüm mutasyonların izi: görev oluşturma/taşıma/tamamlama, proje oluşturma/silme,
 * ekip değişiklikleri, sistem olayları. Tür bazında filtrelenebilir.
 */

const ViewActivity = (() => {
  let typeFilter = 'hepsi';

  function render(host) {
    host.innerHTML = `
      <div class="toolbar">
        <div class="toolbar-left">
          <div class="seg" id="activityFilter">
            ${seg('hepsi', 'Tümü', typeFilter)}
            ${seg('gorev', 'Görev', typeFilter)}
            ${seg('proje', 'Proje', typeFilter)}
            ${seg('ekip', 'Ekip', typeFilter)}
            ${seg('sistem', 'Sistem', typeFilter)}
          </div>
        </div>
        <div class="toolbar-right">
          <span class="count-chip" id="activityCount"></span>
        </div>
      </div>
      <div class="card">
        <div class="card-body" id="activityHost"></div>
      </div>
    `;

    host.querySelectorAll('[data-type]').forEach((b) =>
      b.addEventListener('click', () => {
        typeFilter = b.dataset.type;
        host.querySelectorAll('[data-type]').forEach((x) => x.classList.toggle('is-active', x === b));
        paint();
      }));

    paint();
  }

  function paint() {
    const host = document.getElementById('activityHost');
    const count = document.getElementById('activityCount');
    if (!host) return;

    const all = State.data.activity || [];
    const list = typeFilter === 'hepsi' ? all : all.filter((a) => a.type === typeFilter);

    if (count) count.textContent = `${list.length} kayıt`;

    if (!list.length) {
      host.innerHTML = UI.emptyState(
        typeFilter === 'hepsi' ? 'Günlük boş' : 'Bu türde kayıt yok',
        'Görev oluşturduğunda, taşıdığında veya proje eklediğinde burada görünecek.'
      );
      return;
    }

    host.innerHTML = `<ul class="log-list log-list-full">${list.map(item).join('')}</ul>`;
  }

  function item(a) {
    const d = new Date(a.at);
    const dayLabel = d.toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' });
    return `<li class="log-item log-${UI.esc(a.type)}">
      <span class="log-ico">${UI.ACTIVITY_ICON[a.type] || '•'}</span>
      <div class="log-body">
        <div class="log-head">
          <strong>${UI.esc(a.action)}</strong>
          <time title="${UI.esc(dayLabel + ' ' + d.toLocaleTimeString('tr-TR'))}">${UI.relativeTime(a.at)}</time>
        </div>
        <div class="log-detail">${UI.esc(a.detail)}</div>
        <div class="log-actor">${UI.esc(a.actor)} · ${UI.esc(dayLabel)}</div>
      </div>
    </li>`;
  }

  function seg(value, label, current) {
    return `<button class="seg-btn${value === current ? ' is-active' : ''}" data-type="${UI.esc(value)}">${UI.esc(label)}</button>`;
  }

  return { render };
})();
