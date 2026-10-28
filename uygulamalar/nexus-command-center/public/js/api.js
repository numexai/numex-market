'use strict';

/**
 * API istemcisi — tüm sunucu iletişimi buradan geçer.
 * Sunucu hataları tek biçimde fırlatılır; çağıran taraf mesajı kullanıcıya gösterir.
 */

const API = (() => {
  const BASE = '/api';

  async function request(method, path, body) {
    let res;
    try {
      res = await fetch(BASE + path, {
        method,
        headers: body ? { 'Content-Type': 'application/json' } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });
    } catch (netErr) {
      throw new Error('Sunucuya ulaşılamıyor. Terminalde "npm start" çalışıyor mu?');
    }

    let payload = null;
    try {
      payload = await res.json();
    } catch (_) {
      throw new Error(`Sunucu geçersiz yanıt verdi (HTTP ${res.status}).`);
    }

    if (!res.ok || payload.ok === false) {
      const err = new Error(payload.error || `İstek başarısız (HTTP ${res.status}).`);
      err.status = res.status;
      err.payload = payload;
      throw err;
    }
    return payload.data;
  }

  const qs = (params) => {
    const p = new URLSearchParams();
    Object.entries(params || {}).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '' && v !== 'hepsi') p.set(k, v);
    });
    const s = p.toString();
    return s ? '?' + s : '';
  };

  return {
    health: () => request('GET', '/health'),
    summary: () => request('GET', '/summary'),

    projects: (filters) => request('GET', '/projects' + qs(filters)),
    createProject: (data) => request('POST', '/projects', data),
    updateProject: (id, data) => request('PUT', '/projects/' + id, data),
    deleteProject: (id) => request('DELETE', '/projects/' + id),

    tasks: (filters) => request('GET', '/tasks' + qs(filters)),
    createTask: (data) => request('POST', '/tasks', data),
    updateTask: (id, data) => request('PUT', '/tasks/' + id, data),
    moveTask: (id, status) => request('PATCH', '/tasks/' + id + '/status', { status }),
    deleteTask: (id) => request('DELETE', '/tasks/' + id),

    team: () => request('GET', '/team'),
    createMember: (data) => request('POST', '/team', data),
    deleteMember: (id) => request('DELETE', '/team/' + id),

    activity: (filters) => request('GET', '/activity' + qs(filters)),
  };
})();
