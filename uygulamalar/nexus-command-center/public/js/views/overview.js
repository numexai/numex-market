'use strict';

/**
 * Görünüm: Genel Bakış
 * Metrik kartları + proje ilerleme grafiği (canvas) + durum halkası + son aktiviteler.
 * Tüm sayılar /api/summary'den gelir — istemcide sayı uydurulmaz.
 */

const ViewOverview = (() => {

  function render(host) {
    const s = State.data.summary;
    if (!s) {
      host.innerHTML = UI.errorState('Özet verisi alınamadı.');
      return;
    }
    const t = s.totals;

    host.innerHTML = `
      <div class="metrics">
        ${metric('Proje', t.projects, `${t.activeProjects} aktif`, 'blue', '▤')}
        ${metric('Açık Görev', t.openTasks, `${t.inProgress} devam ediyor`, 'amber', '◑')}
        ${metric('Tamamlanan', t.doneTasks, `%${t.completionRate} tamamlanma`, 'green', '✓')}
        ${metric('Geciken', t.overdueTasks, t.overdueTasks ? 'acil ilgi gerekiyor' : 'gecikme yok', t.overdueTasks ? 'red' : 'muted', '⚠')}
      </div>

      <div class="grid-main">
        <section class="card">
          <header class="card-head">
            <h2>Proje İlerlemeleri</h2>
            <span class="card-sub">Görevlerden otomatik hesaplanır</span>
          </header>
          <div class="card-body">
            <canvas id="progressChart" class="chart-canvas"></canvas>
          </div>
        </section>

        <section class="card">
          <header class="card-head"><h2>Görev Dağılımı</h2></header>
          <div class="card-body chart-center">
            <canvas id="donutChart" class="chart-canvas"></canvas>
            <ul class="legend">
              ${legend('Yapılacak', s.statusBuckets.todo, 'var(--todo)')}
              ${legend('Devam Ediyor', s.statusBuckets.in_progress, 'var(--progress)')}
              ${legend('Tamamlandı', s.statusBuckets.done, 'var(--done)')}
            </ul>
          </div>
        </section>
      </div>

      <div class="grid-main">
        <section class="card">
          <header class="card-head">
            <h2>Öncelik Dağılımı</h2>
            <span class="card-sub">Açık görevler</span>
          </header>
          <div class="card-body">
            <div class="priority-bars">
              ${s.byPriority.map((p) => priorityBar(p, s.totals.openTasks + s.totals.doneTasks)).join('')}
            </div>
          </div>
        </section>

        <section class="card">
          <header class="card-head">
            <h2>Son Aktiviteler</h2>
            <button class="link-btn" data-goto="activity">Tümünü gör →</button>
          </header>
          <div class="card-body">
            ${s.recentActivity.length ? `<ul class="log-list">${s.recentActivity.map(logItem).join('')}</ul>` : UI.emptyState('Hareket yok', 'Henüz kaydedilmiş bir olay bulunmuyor.')}
          </div>
        </section>
      </div>

      ${overdueSection(s)}
    `;

    /* Grafikleri çiz */
    const barItems = s.projects.map((p) => ({
      label: p.name,
      value: p.progress,
      color: p.color,
      sub: `${p.taskDone}/${p.taskTotal} görev`,
    }));
    Chart.attach(document.getElementById('progressChart'), () =>
      Chart.barChart(document.getElementById('progressChart'), barItems));

    const donutSlices = [
      { label: 'Yapılacak', value: s.statusBuckets.todo, color: cssVar('--todo') },
      { label: 'Devam Ediyor', value: s.statusBuckets.in_progress, color: cssVar('--progress') },
      { label: 'Tamamlandı', value: s.statusBuckets.done, color: cssVar('--done') },
    ];
    Chart.attach(document.getElementById('donutChart'), () =>
      Chart.donut(document.getElementById('donutChart'), donutSlices, {
        total: s.totals.openTasks + s.totals.doneTasks,
        centerLabel: 'GÖREV',
      }));

    const goto = host.querySelector('[data-goto="activity"]');
    if (goto) goto.addEventListener('click', () => App.navigate('activity'));
  }

  function metric(label, value, sub, tone, icon) {
    return `<article class="metric metric-${tone}">
      <div class="metric-top"><span class="metric-label">${UI.esc(label)}</span><span class="metric-ico">${icon}</span></div>
      <div class="metric-value">${value}</div>
      <div class="metric-sub">${UI.esc(sub)}</div>
    </article>`;
  }

  function legend(label, value, color) {
    return `<li><span class="legend-dot" style="background:${color}"></span>
      <span class="legend-label">${UI.esc(label)}</span>
      <strong>${value}</strong></li>`;
  }

  const PRIORITY_COLOR = { dusuk: 'var(--p-dusuk)', orta: 'var(--p-orta)', yuksek: 'var(--p-yuksek)', kritik: 'var(--p-kritik)' };

  function priorityBar(item, total) {
    const pct = total ? Math.round((item.total / total) * 100) : 0;
    return `<div class="pbar-row">
      <span class="pbar-label">${UI.esc(item.label)}</span>
      <div class="pbar-track"><div class="pbar-fill" style="width:${pct}%;background:${PRIORITY_COLOR[item.key]}"></div></div>
      <span class="pbar-value">${item.open}<small>/${item.total}</small></span>
    </div>`;
  }

  function logItem(a) {
    return `<li class="log-item log-${UI.esc(a.type)}">
      <span class="log-ico">${UI.ACTIVITY_ICON[a.type] || '•'}</span>
      <div class="log-body">
        <div class="log-head"><strong>${UI.esc(a.action)}</strong><time>${UI.relativeTime(a.at)}</time></div>
        <div class="log-detail">${UI.esc(a.detail)}</div>
        <div class="log-actor">${UI.esc(a.actor)}</div>
      </div>
    </li>`;
  }

  function overdueSection(s) {
    const overdue = State.data.tasks.filter((t) => t.overdue);
    if (!overdue.length) {
      return `<section class="card card-ok">
        <div class="card-body inline-ok"><span class="ok-mark">✓</span> Gecikmiş görev yok — takvim kontrol altında.</div>
      </section>`;
    }
    return `<section class="card card-warn">
      <header class="card-head"><h2>Geciken Görevler</h2><span class="card-sub">${overdue.length} kayıt</span></header>
      <div class="card-body">
        <ul class="mini-list">
          ${overdue.map((t) => {
            const d = UI.dueMeta(t);
            return `<li class="mini-item">
              <span class="prio prio-${UI.esc(t.priority)}">${UI.PRIORITY_LABEL[t.priority]}</span>
              <span class="mini-title">${UI.esc(t.title)}</span>
              <span class="mini-assignee">${UI.esc(t.assignee)}</span>
              <span class="due ${d.cls}">${UI.esc(d.text)}</span>
            </li>`;
          }).join('')}
        </ul>
      </div>
    </section>`;
  }

  function cssVar(name) {
    return getComputedStyle(document.body).getPropertyValue(name).trim() || '#4f8cff';
  }

  return { render };
})();
