'use strict';

/**
 * Görünüm: Ekip
 * Üye listesi + görev yükü (açık / tamamlanan / geciken) + üye ekleme.
 * Yük bilgisi görevlerden TÜRETİLİR, elle girilmez.
 */

const ViewTeam = (() => {

  function render(host) {
    const team = State.data.team;

    host.innerHTML = `
      <div class="toolbar">
        <div class="toolbar-left">
          <span class="count-chip">${team.length} kişi</span>
        </div>
        <div class="toolbar-right">
          <button class="btn btn-primary" id="newMemberBtn">+ Üye Ekle</button>
        </div>
      </div>

      <form class="inline-form" id="memberForm" hidden>
        <input name="name" placeholder="Ad Soyad" maxlength="60" />
        <input name="role" placeholder="Rol (ör. Frontend)" maxlength="60" />
        <button type="submit" class="btn btn-primary">Ekle</button>
        <button type="button" class="btn btn-ghost" id="memberCancel">Vazgeç</button>
        <small class="field-error" data-error="member"></small>
      </form>

      <div id="teamHost"></div>
    `;

    const form = host.querySelector('#memberForm');
    host.querySelector('#newMemberBtn').addEventListener('click', () => {
      form.hidden = false;
      form.querySelector('input[name=name]').focus();
    });
    host.querySelector('#memberCancel').addEventListener('click', () => { form.hidden = true; form.reset(); });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = form.name.value.trim();
      const role = form.role.value.trim();
      const errSlot = form.querySelector('[data-error="member"]');
      errSlot.textContent = '';
      if (name.length < 2) { errSlot.textContent = 'Ad en az 2 karakter olmalı.'; return; }
      try {
        await API.createMember({ name, role });
        UI.toast(name + ' ekibe eklendi.', 'ok');
        form.reset();
        form.hidden = true;
        await State.refresh('team');
        render(App.host());
      } catch (err) {
        errSlot.textContent = err.message;
      }
    });

    paint(team);
  }

  function paint(team) {
    const host = document.getElementById('teamHost');
    if (!team.length) {
      host.innerHTML = UI.emptyState('Ekip boş', 'Görev atayabilmek için önce bir üye ekle.');
      return;
    }

    host.className = 'team-grid';
    host.innerHTML = team.map(card).join('');

    host.querySelectorAll('[data-del-member]').forEach((b) =>
      b.addEventListener('click', () => App.deleteMember(b.dataset.delMember)));

    /* Kişi kartına tıklayınca görevleri filtrelenir */
    host.querySelectorAll('[data-filter-assignee]').forEach((el) =>
      el.addEventListener('click', (e) => {
        if (e.target.closest('[data-del-member]')) return;
        State.setFilter('assignee', el.dataset.filterAssignee);
        State.setFilter('status', 'hepsi');
        App.navigate('tasks');
      }));
  }

  function card(m) {
    const w = m.workload;
    const donePct = w.total ? Math.round((w.done / w.total) * 100) : 0;
    return `<article class="team-card" data-filter-assignee="${UI.esc(m.name)}" title="Bu kişinin görevlerini gör">
      <div class="tc-head">
        <span class="avatar lg" style="background:${UI.esc(m.color || UI.colorFor(m.name))}">${UI.initials(m.name)}</span>
        <div class="tc-id">
          <h3>${UI.esc(m.name)}</h3>
          <span class="tc-role">${UI.esc(m.role)}</span>
        </div>
        <button class="icon-btn sm danger" data-del-member="${UI.esc(m.id)}" title="Üyeyi çıkar">&#10005;</button>
      </div>

      <div class="tc-stats">
        <div class="tc-stat"><strong>${w.open}</strong><span>açık</span></div>
        <div class="tc-stat"><strong>${w.done}</strong><span>tamamlanan</span></div>
        <div class="tc-stat ${w.overdue ? 'danger' : ''}"><strong>${w.overdue}</strong><span>geciken</span></div>
      </div>

      <div class="tc-load">
        <div class="tc-load-head"><span>Tamamlanma</span><strong>${donePct}%</strong></div>
        <div class="progress-track"><div class="progress-fill" style="width:${donePct}%;background:${UI.esc(m.color || '#4f8cff')}"></div></div>
      </div>

      <div class="tc-mail">${UI.esc(m.email || '')}</div>
    </article>`;
  }

  return { render };
})();
