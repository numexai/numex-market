const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 5000;

// notes.json dosyasının yolu (sunucu dizininde)
const DATA_DIR = __dirname;
const NOTES_FILE = path.join(DATA_DIR, 'notes.json');

// Middleware: JSON gövde okuma
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ---- Yardımcı Fonksiyonlar ----
function loadNotes() {
  try {
    if (fs.existsSync(NOTES_FILE)) {
      const raw = fs.readFileSync(NOTES_FILE, 'utf-8');
      const data = JSON.parse(raw);
      return Array.isArray(data.notes) ? data.notes : [];
    }
    return [];
  } catch (err) {
    console.error('Notlar okunurken hata:', err.message);
    return [];
  }
}

function saveNotes(notes) {
  try {
    fs.writeFileSync(NOTES_FILE, JSON.stringify({ notes }, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Notlar yazılırken hata:', err.message);
    return false;
  }
}

// ---- API Uç Noktaları ----

// GET /api/notes -> kayıtlı notları listeler
app.get('/api/notes', (req, res) => {
  const notes = loadNotes();
  res.json({ notes });
});

// POST /api/notes -> yeni not kaydeder. Gövde: { text }
app.post('/api/notes', (req, res) => {
  const text = (req.body && typeof req.body.text === 'string')
    ? req.body.text
    : '';

  if (!text.trim()) {
    return res.status(400).json({ error: 'Not metni (text) boş olamaz. Örnek: {"text": "Merhaba"} ' });
  }

  const notes = loadNotes();
  const note = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
    text: text.trim(),
    createdAt: new Date().toISOString()
  };
  notes.unshift(note); // en yeni en üstte

  const ok = saveNotes(notes);
  if (!ok) {
    return res.status(500).json({ error: 'Notlar diske yazılamadı.' });
  }

  // 201 Created
  res.status(201).json({ note, notes });
});

// Sağlık kontrolü
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', app: 'Aura OS', time: new Date().toISOString() });
});

// ---- Statik Dosyalar (public klasörü) ----
app.use(express.static(path.join(__dirname, 'public')));

// ---- Sunucuyu Başlat ----
app.listen(PORT, () => {
  console.log('========================================');
  console.log('  AURA OS - Sanal Siber Web OS');
  console.log('  http://localhost:' + PORT);
  console.log('========================================');
  console.log('  API uçları:');
  console.log('    GET  /api/notes    -> notları listele');
  console.log('    POST /api/notes    -> not kaydet');
  console.log('========================================');
});
