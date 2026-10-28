// admin.js — Admin paneli günlük liste mantığı
(function () {
  const filterDate = document.getElementById('filterDate');
  const refreshBtn = document.getElementById('refreshBtn');
  const listEl = document.getElementById('appointmentList');
  const summaryEl = document.getElementById('summary');

  function todayISO() {
    return new Date().toISOString().split('T')[0];
  }

  // Günün randevularını yükle
  async function loadAppointments(date) {
    listEl.innerHTML = '<p>Yükleniyor...</p>';
    try {
      const res = await fetch(`/api/appointments?date=${encodeURIComponent(date)}`);
      const list = await res.json();
      renderList(list, date);
    } catch (err) {
      listEl.innerHTML = '<p class="empty-state">Liste yüklenemedi.</p>';
      summaryEl.textContent = '';
    }
  }

  function renderList(list, date) {
    if (!Array.isArray(list) || list.length === 0) {
      listEl.innerHTML = '<p class="empty-state">Bu gün için randevu bulunmuyor. 🎉</p>';
      summaryEl.textContent = `${date} — toplam 0 randevu`;
      return;
    }

    summaryEl.textContent = `${date} — toplam ${list.length} randevu`;

    listEl.innerHTML = '';
    list.forEach(a => {
      const item = document.createElement('div');
      item.className = 'appointment-item';

      const timeBadge = document.createElement('span');
      timeBadge.className = 'time-badge';
      timeBadge.textContent = a.time;

      const info = document.createElement('div');
      info.className = 'info';
      info.innerHTML = `
        <div class="name">${escapeHtml(a.name)}</div>
        <div class="detail">${escapeHtml(a.service || 'Genel')} • Tel: ${escapeHtml(a.phone)}</div>
        ${a.notes ? `<div class="detail">📝 ${escapeHtml(a.notes)}</div>` : ''}
      `;

      const actions = document.createElement('div');
      actions.className = 'actions';
      const delBtn = document.createElement('button');
      delBtn.className = 'btn btn-danger';
      delBtn.textContent = 'Sil';
      delBtn.addEventListener('click', () => deleteAppointment(a.id));
      actions.appendChild(delBtn);

      item.appendChild(timeBadge);
      item.appendChild(info);
      item.appendChild(actions);
      listEl.appendChild(item);
    });
  }

  async function deleteAppointment(id) {
    if (!confirm('Bu randevuyu silmek istediğinize emin misiniz?')) return;
    try {
      const res = await fetch(`/api/appointments/${id}`, { method: 'DELETE' });
      if (res.ok) {
        loadAppointments(filterDate.value || todayISO());
      } else {
        alert('Silme sırasında hata oluştu.');
      }
    } catch (err) {
      alert('Bağlantı hatası.');
    }
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // Varsayılan: bugün
  filterDate.value = todayISO();

  refreshBtn.addEventListener('click', () => {
    loadAppointments(filterDate.value || todayISO());
  });

  filterDate.addEventListener('change', () => {
    loadAppointments(filterDate.value || todayISO());
  });

  // İlk yükleme
  loadAppointments(todayISO());
})();
