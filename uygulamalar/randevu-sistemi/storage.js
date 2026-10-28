// storage.js — JSON tabanlı veri katmanı
// Randevu kayıtlarını appointments.json dosyasında tutar.

const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, 'data', 'appointments.json');

// Veri dizinini ve dosyayı hazırla
function init() {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2));
  }
}

// Tüm randevuları oku
function getAll() {
  init();
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  } catch (e) {
    return [];
  }
}

// Yeni randevu ekler, eşsiz id üretir
function add(appointment) {
  const list = getAll();
  const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const record = { id, ...appointment };
  list.push(record);
  save(list);
  return record;
}

// Randevu siler, true/false döner
function remove(id) {
  const list = getAll();
  const filtered = list.filter(a => a.id !== id);
  if (filtered.length === list.length) return false;
  save(filtered);
  return true;
}

function save(list) {
  init();
  fs.writeFileSync(DATA_FILE, JSON.stringify(list, null, 2));
}

module.exports = { init, getAll, add, remove };
