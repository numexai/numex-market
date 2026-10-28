'use strict';

/**
 * Nexus Command Center — Uygulama Denetleyicisi
 * Yönlendirme, görünüm yaşam döngüsü, modal/form yönetimi ve tüm API eylemleri.
 * Görünüm modülleri yalnızca çizer; iş mantığı BURADA toplanır.
 */

const App = (() => {

  const VIEW_META = {
    overview: { title: 'Genel Bakış', subtitle: 'Operasyonun tek ekranda özeti', view: ViewOverview },
    projects: { title: 'Projeler', subtitle: 'Kapsam, durum ve otomatik ilerleme', view: ViewProjects },
    tasks: { title: 'Görevler', subtitle: 'Kanban panosu · sürükle-bırak ile durum değiştir', view: ViewTasks },
    team: { title: 'Ekip', subtitle: 'Kişi başı iş yükü ve tamamlanma', view: ViewTeam },
    activity: { title: 'Aktivite Günlüğü', subtitle: 'Sistemde olan her şeyin kaydı', view: ViewActivity },
  };

  let currentView = null;
  let editingTaskId = null;
  let editingProjectId = null;

  function host() { return document.getElementById('viewHost'); }

  /* ---------------- Yönlendirme ---------------- */

  function navigate(view) {
    if (!VIEW_META[view]) view = 'overview';
    currentView = view;
    State.setView(view);

    document.querySelectorAll('.nav-item').forEach((b) =>
      b.classList.toggle('is-active', b.dataset.view === view));

    document.getElementById('viewTitle').textContent = VIEW_META[view].title;
    document.getElementById('viewSubtitle').textContent = VIEW_META[view].subtitle;
    document.getElementById('quickTaskBtn').hidden = view !== 'tasks' && view !== 'overview';

    closeSidebar();
    renderCurrent();
  }

  function renderCurrent() {
    const meta = VIEW_META[currentView];
    if (meta) meta.view.render(host());
  }

  function showLoading() {
    host().innerHTML = UI.skeleton(6);
  }

  /* ---------------- Veri senkronizasyonu ---------------- */

  async function loadAll(reason) {
    showLoading();
    try {
      await State.refresh(reason);
      paintChrome();
      renderCurrent();
      // Grafikler yeniden çizilsin (canvas boyutu değişmiş olabilir)
      setTimeout(() => Chart.refreshAll(), 60);
    } catch (err) {
      // Hata raporlama zinciri kendi içinde de güvenli olmalı:
      // burada bir istisna daha fırlarsa sayfa "Veri yükleniyor…" da kalır ve
      // kök neden görünmez olur. Bu yüzden her adım ayrı korunur.
      try {
        host().innerHTML = UI.errorState(err.message);
        const retry = host().querySelector('[data-retry]');
        if (retry) retry.addEventListener('click', () => loadAll('retry'));
      } catch (renderErr) {
        host().textContent = 'Hata: ' + err.message;
      }
      try { paintChrome(); } catch (_) { /* chrome çizilemedi, önemli değil */ }
      try { UI.toast(err.message, 'err'); } catch (_) { /* toast yoksa sessiz geç */ }
    }
  }

  function paintChrome() {
    const d = State.data;
    const nProjects = document.getElementById('navCountProjects');
    const nTasks = document.getElementById('navCountTasks');
    const nTeam = document.getElementById('navCountTeam');
    if (nProjects) nProjects.textContent = d.projects.length;
    if (nTasks) nTasks.textContent = d.tasks.length;
    if (nTeam) nTeam.textContent = d.team.length;

    const dot = document.getElementById('sysDot');
    const text = document.getElementById('sysText');
    if (dot && text) {
      dot.classList.toggle('ok', d.serverOk);
      dot.classList.toggle('bad', !d.serverOk);
      text.textContent = d.serverOk
        ? `Bağlı · ${d.summary ? d.summary.totals.projects : d.projects.length} proje`
        : 'Bağlantı yok';
    }

    const sync = document.getElementById('lastSync');
    if (sync) sync.textContent = d.lastSync
      ? 'Son güncelleme: ' + d.lastSync.toLocaleTimeString('tr-TR')
      : '—';
  }

  /* ---------------- Görev formu ---------------- */

  function fillSelects() {
    const teamSel = document.getElementById('taskAssignee');
    teamSel.innerHTML = State.data.team.map((m) =>
      `<option value="${UI.esc(m.name)}">${UI.esc(m.name)} — ${UI.esc(m.role)}</option>`).join('');

    const projSel = document.getElementById('taskProject');
    projSel.innerHTML = '<option value="">— Projesiz —</option>' +
      State.data.projects.map((p) =>
        `<option value="${UI.esc(p.id)}">${UI.esc(p.name)}</option>`).join('');

    const ownerSel = document.getElementById('projectOwner');
    ownerSel.innerHTML = State.data.team.map((m) =>
      `<option value="${UI.esc(m.name)}">${UI.esc(m.name)} — ${UI.esc(m.role)}</option>`).join('');
  }

  function openTaskForm(taskId, presetStatus) {
    editingTaskId = taskId || null;
    const form = document.getElementById('taskForm');
    UI.clearErrors(form);
    fillSelects();

    if (taskId) {
      const t = State.data.tasks.find((x) => x.id === taskId);
      if (!t) { UI.toast('Görev bulunamadı, liste tazeleniyor.', 'warn'); loadAll('stale'); return; }
      document.getElementById('taskModalTitle').textContent = 'Görevi Düzenle';
      document.getElementById('taskSubmitBtn').textContent = 'Güncelle';
      form.id.value = t.id;
      form.title.value = t.title;
      form.description.value = t.description || '';
      form.priority.value = t.priority;
      form.status.value = t.status;
      form.assignee.value = t.assignee;
      form.due.value = t.due || '';
      form.projectId.value = t.projectId || '';
    } else {
      document.getElementById('taskModalTitle').textContent = 'Yeni Görev';
      document.getElementById('taskSubmitBtn').textContent = 'Oluştur';
      form.reset();
      form.id.value = '';
      form.status.value = presetStatus || 'todo';
      if (State.data.filters.projectId !== 'hepsi' && State.data.filters.projectId !== 'yok') {
        form.projectId.value = State.data.filters.projectId;
      }
    }
    UI.openModal('taskModal');
  }

  /** İstemci tarafı form doğrulaması — sunucu doğrulamasının aynası. */
  function validateTaskForm(values) {
    const errors = {};
    if (!values.title || values.title.length < 3) errors.title = 'Başlık en az 3 karakter olmalı.';
    else if (values.title.length > 120) errors.title = 'Başlık 120 karakteri aşamaz.';
    if (!values.assignee) errors.assignee = 'Sorumlu seçilmeli.';
    if (values.due && !/^\d{4}-\d{2}-\d{2}$/.test(values.due)) errors.due = 'Geçersiz tarih.';
    return errors;
  }

  async function submitTaskForm(e) {
    e.preventDefault();
    const form = e.target;
    const values = {
      title: form.title.value.trim(),
      description: form.description.value.trim(),
      priority: form.priority.value,
      status: form.status.value,
      assignee: form.assignee.value,
      due: form.due.value,
      projectId: form.projectId.value,
    };

    const errors = validateTaskForm(values);
    if (Object.keys(errors).length) { UI.showErrors(form, errors); return; }

    const btn = document.getElementById('taskSubmitBtn');
    btn.disabled = true;
    btn.textContent = 'Kaydediliyor…';

    try {
      if (editingTaskId) {
        await API.updateTask(editingTaskId, values);
        UI.toast('Görev güncellendi.', 'ok');
      } else {
        await API.createTask(values);
        UI.toast('Görev oluşturuldu.', 'ok');
      }
      UI.closeModal('taskModal');
      await State.refresh('task-saved');
      paintChrome();
      renderCurrent();
    } catch (err) {
      if (err.payload && err.payload.error) UI.showErrors(form, { title: err.payload.error });
      UI.toast(err.message, 'err');
    } finally {
      btn.disabled = false;
      btn.textContent = editingTaskId ? 'Güncelle' : 'Oluştur';
    }
  }

  /* ---------------- Proje formu ---------------- */

  function openProjectForm(projectId) {
    editingProjectId = projectId || null;
    const form = document.getElementById('projectForm');
    UI.clearErrors(form);
    fillSelects();

    if (projectId) {
      const p = State.data.projects.find((x) => x.id === projectId);
      if (!p) { UI.toast('Proje bulunamadı, liste tazeleniyor.', 'warn'); loadAll('stale'); return; }
      document.getElementById('projectModalTitle').textContent = 'Projeyi Düzenle';
      document.getElementById('projectSubmitBtn').textContent = 'Güncelle';
      form.id.value = p.id;
      form.name.value = p.name;
      form.description.value = p.description || '';
      form.status.value = p.status;
      form.owner.value = p.owner;
      form.deadline.value = p.deadline || '';
      form.color.value = /^#[0-9a-fA-F]{6}$/.test(p.color) ? p.color : '#4f8cff';
    } else {
      document.getElementById('projectModalTitle').textContent = 'Yeni Proje';
      document.getElementById('projectSubmitBtn').textContent = 'Oluştur';
      form.reset();
      form.id.value = '';
      form.color.value = '#4f8cff';
      if (State.data.team.length) form.owner.value = State.data.team[0].name;
    }
    UI.openModal('projectModal');
  }

  function validateProjectForm(values) {
    const errors = {};
    if (!values.name || values.name.length < 2) errors.name = 'Proje adı en az 2 karakter olmalı.';
    else if (values.name.length > 80) errors.name = 'Proje adı 80 karakteri aşamaz.';
    if (!values.owner) errors.owner = 'Sorumlu seçilmeli.';
    return errors;
  }

  async function submitProjectForm(e) {
    e.preventDefault();
    const form = e.target;
    const values = {
      name: form.name.value.trim(),
      description: form.description.value.trim(),
      status: form.status.value,
      owner: form.owner.value,
      deadline: form.deadline.value,
      color: form.color.value,
    };

    const errors = validateProjectForm(values);
    if (Object.keys(errors).length) { UI.showErrors(form, errors); return; }

    const btn = document.getElementById('projectSubmitBtn');
    btn.disabled = true;
    btn.textContent = 'Kaydediliyor…';

    try {
      if (editingProjectId) {
        await API.updateProject(editingProjectId, values);
        UI.toast('Proje güncellendi.', 'ok');
      } else {
        await API.createProject(values);
        UI.toast('Proje oluşturuldu.', 'ok');
      }
      UI.closeModal('projectModal');
      await State.refresh('project-saved');
      paintChrome();
      renderCurrent();
    } catch (err) {
      if (err.payload && err.payload.error) UI.showErrors(form, { name: err.payload.error });
      UI.toast(err.message, 'err');
    } finally {
      btn.disabled = false;
      btn.textContent = editingProjectId ? 'Güncelle' : 'Oluştur';
    }
  }

  /* ---------------- Görev taşıma (drag&drop hedefi) ---------------- */

  async function moveTask(taskId, newStatus) {
    const task = State.data.tasks.find((t) => t.id === taskId);
    if (!task || task.status === newStatus) return;

    const oldStatus = task.status;
    task.status = newStatus;                    // İyimser güncelleme
    ViewTasks.paint();

    try {
      const res = await API.moveTask(taskId, newStatus);
      const label = UI.STATUS_LABEL[newStatus];
      UI.toast(newStatus === 'done' ? `"${task.title}" tamamlandı.` : `"${task.title}" → ${label}`, 'ok');
      await State.refresh('task-moved');
      paintChrome();
      renderCurrent();
    } catch (err) {
      task.status = oldStatus;                  // Geri al
      ViewTasks.paint();
      UI.toast('Taşıma başarısız: ' + err.message, 'err');
    }
  }

  /* ---------------- Silme işlemleri ---------------- */

  async function deleteTask(taskId) {
    const t = State.data.tasks.find((x) => x.id === taskId);
    if (!t) return;
    const ok = await UI.confirmDialog(`"${t.title}" görevi kalıcı olarak silinsin mi?`, 'Görevi Sil');
    if (!ok) return;
    try {
      await API.deleteTask(taskId);
      UI.toast('Görev silindi.', 'ok');
      await State.refresh('task-deleted');
      paintChrome();
      renderCurrent();
    } catch (err) { UI.toast(err.message, 'err'); }
  }

  async function deleteProject(projectId) {
    const p = State.data.projects.find((x) => x.id === projectId);
    if (!p) return;
    const ok = await UI.confirmDialog(
      `"${p.name}" projesi silinsin mi? Bağlı görevler silinmez, "Projesiz" olarak kalır.`, 'Projeyi Sil');
    if (!ok) return;
    try {
      await API.deleteProject(projectId);
      UI.toast('Proje silindi.', 'ok');
      await State.refresh('project-deleted');
      paintChrome();
      renderCurrent();
    } catch (err) { UI.toast(err.message, 'err'); }
  }

  async function deleteMember(memberId) {
    const m = State.data.team.find((x) => x.id === memberId);
    if (!m) return;
    const ok = await UI.confirmDialog(`${m.name} ekipten çıkarılsın mı?`, 'Üyeyi Çıkar');
    if (!ok) return;
    try {
      await API.deleteMember(memberId);
      UI.toast(m.name + ' çıkarıldı.', 'ok');
      await State.refresh('member-deleted');
      paintChrome();
      renderCurrent();
    } catch (err) { UI.toast(err.message, 'err'); }
  }

  async function changeProjectStatus(projectId, status) {
    try {
      await API.updateProject(projectId, { status });
      UI.toast('Proje durumu güncellendi.', 'ok');
      await State.refresh('project-status');
      paintChrome();
      renderCurrent();
    } catch (err) { UI.toast(err.message, 'err'); }
  }

  /* ---------------- Kenar çubuğu (mobil) ---------------- */

  function openSidebar() {
    document.getElementById('sidebar').classList.add('open');
    document.getElementById('scrim').classList.add('show');
  }
  function closeSidebar() {
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('scrim').classList.remove('show');
  }

  /* ---------------- Başlatma ---------------- */

  function bindGlobal() {
    document.querySelectorAll('.nav-item').forEach((b) =>
      b.addEventListener('click', () => navigate(b.dataset.view)));

    document.querySelectorAll('[data-close]').forEach((b) =>
      b.addEventListener('click', () => UI.closeModal(b.dataset.close)));

    document.querySelectorAll('.modal-backdrop').forEach((m) =>
      m.addEventListener('mousedown', (e) => { if (e.target === m) UI.closeModal(m.id); }));

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        document.querySelectorAll('.modal-backdrop.open').forEach((m) => UI.closeModal(m.id));
      }
      if (e.key === 'n' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); openTaskForm(null); }
    });

    document.getElementById('menuBtn').addEventListener('click', openSidebar);
    document.getElementById('sidebarClose').addEventListener('click', closeSidebar);
    document.getElementById('scrim').addEventListener('click', closeSidebar);

    document.getElementById('refreshBtn').addEventListener('click', () => loadAll('manual'));
    document.getElementById('quickTaskBtn').addEventListener('click', () => openTaskForm(null));

    document.getElementById('taskForm').addEventListener('submit', submitTaskForm);
    document.getElementById('projectForm').addEventListener('submit', submitProjectForm);

    UI.initConfirm();
    fillSelects();
  }

  async function init() {
    bindGlobal();
    try {
      await loadAll('init');
    } catch (err) {
      // Beklenmedik istemci hatası: sessizce donma yerine görünür rapor
      console.error('[nexus] init hatası:', err);
      host().innerHTML = UI.errorState('Beklenmedik hata: ' + err.message +
        ' — lütfen bu mesajı bildir, kök nedeni düzeltelim.');
      UI.toast('İstemci hatası: ' + err.message, 'err');
    }
    navigate(State.data.view || 'overview');
  }

  return { init, navigate, host, loadAll, renderCurrent, paintChrome, openTaskForm, openProjectForm, moveTask, deleteTask, deleteProject, deleteMember, changeProjectStatus };
})();

document.addEventListener('DOMContentLoaded', () => App.init());
