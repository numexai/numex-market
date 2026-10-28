// app.js — Müşteri tarafı form mantığı
(function () {
  const form = document.getElementById('appointmentForm');
  const timeSelect = document.getElementById('time');
  const dateInput = document.getElementById('date');
  const slotHint = document.getElementById('slotHint');
  const resultBox = document.getElementById('result');
  const submitBtn = document.getElementById('submitBtn');

  // Bugünü varsayılan yap
  (function setDefaultDate() {
    const today = new Date().toISOString().split('T')[0];
    dateInput.value = today;
    dateInput.min = today;
  })();

  // Slotları yükle (belirli günün boş saatleri backend'den çekilir)
  async function loadSlots(date) {
    try {
      const res = await fetch(`/api/slots?date=${encodeURIComponent(date)}`);
      const slots = await res.json();
      if (!Array.isArray(slots)) throw new Error('Slot hatası');

      timeSelect.innerHTML = '';
      if (slots.length === 0) {
        timeSelect.innerHTML = '<option value="">Bu gün boş slot yok</option>';
        slotHint.textContent = 'Başka bir gün seçmeyi deneyin.';
      } else {
        timeSelect.innerHTML = '<option value="">Saat seçin...</option>';
        slots.forEach(t => {
          const opt = document.createElement('option');
          opt.value = t;
          opt.textContent = t;
          timeSelect.appendChild(opt);
        });
        slotHint.textContent = `${slots.length} uygun saat var.`;
      }
    } catch (err) {
      timeSelect.innerHTML = '<option value="">Slotlar yüklenemedi</option>';
      slotHint.textContent = 'Sunucuya bağlanılamadı.';
    }
  }

  // Tarih değişince slotları tazele
  dateInput.addEventListener('change', () => {
    if (dateInput.value) loadSlots(dateInput.value);
  });

  // İlk yüklemede bugünün slotları
  loadSlots(dateInput.value);

  // Form gönderimi
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    resultBox.hidden = true;

    const payload = {
      name: document.getElementById('name').value.trim(),
      phone: document.getElementById('phone').value.trim(),
      date: dateInput.value,
      time: timeSelect.value,
      service: document.getElementById('service').value,
      notes: document.getElementById('notes').value.trim()
    };

    if (!payload.time) {
      showResult('Lütfen bir saat seçin.', false);
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Kaydediliyor...';

    try {
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (res.ok) {
        showResult(`Randevunuz alındı! ${data.appointment.date} ${data.appointment.time} — ${data.appointment.service}`, true);
        form.reset();
        submitBtn.disabled = false;
        submitBtn.textContent = 'Randevu Al';
        // Bugünün slotlarını tazele
        loadSlots(dateInput.value);
      } else {
        showResult(data.error || 'Bir hata oluştu.', false);
        submitBtn.disabled = false;
        submitBtn.textContent = 'Randevu Al';
      }
    } catch (err) {
      showResult('Sunucuya bağlanılamadı. Lütfen tekrar deneyin.', false);
      submitBtn.disabled = false;
      submitBtn.textContent = 'Randevu Al';
    }
  });

  function showResult(msg, ok) {
    resultBox.hidden = false;
    resultBox.textContent = msg;
    resultBox.className = 'result ' + (ok ? 'success' : 'error');
  }
})();
