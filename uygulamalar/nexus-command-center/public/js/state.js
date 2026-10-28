'use strict';

/**
 * İstemci durumu — tek bir merkezde tutulur, görünümler bunu okur.
 * Sunucu tek doğruluk kaynağıdır; burada tutulan yalnızca son çekilen
 * verinin kopyası + aktif filtrelerdir.
 */

const State = (() => {
  const listeners = new Set();

  const data = {
    view: 'overview',
    projects: [],
    tasks: [],
    team: [],
    activity: [],
    summary: null,
    filters: {
      q: '',
      priority: 'hepsi',
      projectId: 'hepsi',
      status: 'hepsi',
      assignee: 'hepsi',
      sort: 'default',
    },
    loading: false,
    lastSync: null,
    serverOk: false,
    serverMessage: '',
  };

  /** localStorage'a yalnızca kullanıcı tercihleri yazılır (filtreler, aktif görünüm). */
  const PREF_KEY = 'nexus.prefs.v1';

  function loadPrefs() {
    try {
      const raw = localStorage.getItem(PREF_KEY);
      if (!raw) return;
      const prefs = JSON.parse(raw);
      if (prefs.view) data.view = prefs.view;
      if (prefs.filters) data.filters = { ...data.filters, ...prefs.filters };
    } catch (_) { /* bozuk tercih → varsayılan */ }
  }

  function savePrefs() {
    try {
      localStorage.setItem(PREF_KEY, JSON.stringify({ view: data.view, filters: data.filters }));
    } catch (_) { /* depolama kapalı olabilir */ }
  }

  function subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); }

  function emit(reason) { listeners.forEach((fn) => fn(reason)); }

  function set(patch, reason = 'update') {
    Object.assign(data, patch);
    emit(reason);
  }

  function setView(view) {
    data.view = view;
    savePrefs();
    emit('view');
  }

  function setFilter(key, value) {
    data.filters[key] = value;
    savePrefs();
    emit('filters');
  }

  function resetFilters() {
    data.filters = { q: '', priority: 'hepsi', projectId: 'hepsi', status: 'hepsi', assignee: 'hepsi', sort: 'default' };
    savePrefs();
    emit('filters');
  }

  /** Herhangi bir filtre aktif mi? Değilse sunucuya boş sorgu gider (tüm liste). */
  function hasActiveFilters() {
    const f = data.filters;
    return Boolean(f.q) ||
      f.priority !== 'hepsi' ||
      f.projectId !== 'hepsi' ||
      f.status !== 'hepsi' ||
      f.assignee !== 'hepsi' ||
      (f.sort && f.sort !== 'default');
  }

  /** Sunucudan her şeyi tazele. Hata durumunda state'e düşer, uygulama çökmez. */
  async function refresh(reason = 'manual') {
    data.loading = true;
    emit('loading');
    try {
      const [summary, projects, tasks, team, activity] = await Promise.all([
        API.summary(),
        API.projects(),
        API.tasks(hasActiveFilters() ? data.filters : {}),
        API.team(),
        API.activity({ limit: 100 }),
      ]);
      Object.assign(data, {
        summary,
        projects,
        tasks,
        team,
        activity: activity.data || activity,
        activityCounts: activity.counts || {},
        activityTotal: activity.total || 0,
        lastSync: new Date(),
        serverOk: true,
        serverMessage: 'Bağlı · ' + projects.length + ' proje / ' + tasks.length + ' görev',
      });
      emit(reason);
      return true;
    } catch (err) {
      data.serverOk = false;
      data.serverMessage = err.message;
      emit('error');
      throw err;
    } finally {
      data.loading = false;
      emit('loading');
    }
  }

  loadPrefs();

  return { data, subscribe, emit, set, setView, setFilter, resetFilters, hasActiveFilters, refresh, savePrefs };
})();
