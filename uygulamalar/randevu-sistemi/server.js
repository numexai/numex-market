// server.js — Express backend
// Randevu sistemi: müşteri kaydı + çakışma kontrolü + günlük liste

const express = require('express');
const path = require('path');
const storage = require('./storage');

const app = express();
const PORT = process.env.PORT || 3000;

// Çalışma saatleri (09:00 - 18:00, her saat başı slot)
const OPEN_HOUR = 9;
const CLOSE_HOUR = 18;
const SLOT_MINUTES = 60;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// --- Yardımcılar ---

// Tarihi "YYYY-MM-DD" biçimine getirir
function normalizeDate(date) {
  return date; // beklenen format zaten "YYYY-MM-DD"
}

// Saati "HH:MM" dakikaya çevirir (çakışma için)
function toMinutes(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

// Belirtilen günde belirtilen zaman aralığına çakışan randevu var mı?
function isConflict(list, date, startMin, durationMin) {
  const end = startMin + durationMin;
  return list.some(a => {
    if (a.date !== date) return false;
    const aStart = toMinutes(a.time);
    const aEnd = aStart + (a.duration || 0);
    // Çakışma: iki aralık birbirine giriyorsa
    return startMin < aEnd && end > aStart;
  });
}

// Beklenen çalışma saati içinde mi?
function withinHours(startMin) {
  return startMin >= OPEN_HOUR * 60 && (startMin + SLOT_MINUTES) <= CLOSE_HOUR * 60;
}

// --- API ---

// Sağlık kontrolü
app.get('/api/health', (req, res) => {
  res.json({ ok: true, service: 'randevu-sistemi' });
});

// Boş slotları döndürür (bugünün veya istenen günün)
app.get('/api/slots', (req, res) => {
  const date = req.query.date || null;
  const list = storage.getAll();

  const slots = [];
  for (let m = OPEN_HOUR * 60; m < CLOSE_HOUR * 60; m += SLOT_MINUTES) {
    const hh = String(Math.floor(m / 60)).padStart(2, '0');
    const mm = String(m % 60).padStart(2, '0');
    const time = `${hh}:${mm}`;
    // Belirli gün verildiyse o günkü çakışmaları, yoksa genel geçmiş/tekrarı kontrol etme
    const busy = date ? isConflict(list, date, m, SLOT_MINUTES) : false;
    if (!busy) {
      slots.push(time);
    }
  }
  // date verilmediyse tüm saat dilimlerini döndür
  if (!date) return res.json(slots);
  res.json(slots);
});

// Yeni randevu oluştur (çakışma kontrolü ile)
app.post('/api/appointments', (req, res) => {
  const { name, phone, date, time, service, notes } = req.body;

  // Doğrulama
  if (!name || !phone || !date || !time) {
    return res.status(400).json({ error: 'Ad, telefon, tarih ve saat zorunludur.' });
  }

  // Tarih formatı "YYYY-MM-DD", saat "HH:MM"
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({ error: 'Geçersiz tarih formatı. YYYY-MM-DD kullanın.' });
  }
  if (!/^\d{2}:\d{2}$/.test(time)) {
    return res.status(400).json({ error: 'Geçersiz saat formatı. HH:MM kullanın.' });
  }

  const startMin = toMinutes(time);
  if (!withinHours(startMin)) {
    return res.status(400).json({
      error: `Randevular yalnızca ${String(OPEN_HOUR).padStart(2,'0')}:00 - ${String(CLOSE_HOUR).padStart(2,'0')}:00 arası alınabilir.`
    });
  }

  // Çakışma kontrolü
  const list = storage.getAll();
  if (isConflict(list, date, startMin, SLOT_MINUTES)) {
    return res.status(409).json({ error: 'Bu saat dilimi dolu. Lütfen başka bir saat seçin.' });
  }

  const record = storage.add({
    name,
    phone,
    date,
    time,
    service: service || 'Genel',
    notes: notes || '',
    duration: SLOT_MINUTES,
    createdAt: new Date().toISOString()
  });

  res.status(201).json({ ok: true, appointment: record });
});

// Belirli bir günün randevularını döndürür (admin)
app.get('/api/appointments', (req, res) => {
  const date = req.query.date;
  let list = storage.getAll();
  if (date) {
    list = list.filter(a => a.date === date);
  }
  // Tarihe ve saate göre sırala
  list.sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  res.json(list);
});

// Belirli bir randevuyu sil (admin)
app.delete('/api/appointments/:id', (req, res) => {
  const ok = storage.remove(req.params.id);
  if (!ok) {
    return res.status(404).json({ error: 'Randevu bulunamadı.' });
  }
  res.json({ ok: true });
});

// --- Sunucuyu başlat ---
storage.init();
app.listen(PORT, () => {
  console.log(`Randevu sistemi çalışıyor: http://localhost:${PORT}`);
});
