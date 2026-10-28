'use strict';

/**
 * Nexus Command Center — Veri Katmanı
 * ---------------------------------------------------------------
 * Basit ama gerçek bir kalıcı depo: JSON dosyası.
 * - Okuma/yazma atomik (önce .tmp, sonra rename) → yarım dosya kalmaz.
 * - Tüm mutasyonlar `mutate()` üzerinden geçer; böylece aktivite kaydı
 *   ve ilerleme yüzdesi tek noktadan tutarlı hesaplanır.
 */

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', '..', 'data');
const DB_FILE = path.join(DATA_DIR, 'nexus.json');
const TMP_FILE = path.join(DATA_DIR, 'nexus.json.tmp');

const AYLAR_ONCE = (gun) => {
  const d = new Date();
  d.setDate(d.getDate() + gun);
  return d.toISOString().slice(0, 10);
};

/* ------------------------------------------------------------------ */
/* Varsayılan demo veri                                                */
/* ------------------------------------------------------------------ */

function seedData() {
  const projects = [
    {
      id: 'prj-orion',
      name: 'Orion Web Platformu',
      description: 'Müşteri portalı + yönetim paneli. Kimlik doğrulama ve ödeme entegrasyonu dahil.',
      status: 'devam',
      color: '#4f8cff',
      owner: 'Mehmet Ali',
      deadline: AYLAR_ONCE(21),
      createdAt: new Date().toISOString(),
    },
    {
      id: 'prj-atlas',
      name: 'Atlas Mobil Uygulama',
      description: 'iOS/Android saha ekibi uygulaması. Çevrimdışı senkronizasyon gerektiriyor.',
      status: 'devam',
      color: '#22c55e',
      owner: 'Nurullah',
      deadline: AYLAR_ONCE(45),
      createdAt: new Date().toISOString(),
    },
    {
      id: 'prj-vega',
      name: 'Vega Veri Ambarı',
      description: 'Raporlama için ETL hattı ve analitik şema tasarımı.',
      status: 'planlandi',
      color: '#a855f7',
      owner: 'Elif',
      deadline: AYLAR_ONCE(70),
      createdAt: new Date().toISOString(),
    },
    {
      id: 'prj-lyra',
      name: 'Lyra Tasarım Sistemi',
      description: 'Ortak bileşen kütüphanesi ve marka kılavuzu. İlk sürüm yayınlandı.',
      status: 'tamamlandi',
      color: '#f59e0b',
      owner: 'Zeynep',
      deadline: AYLAR_ONCE(-12),
      createdAt: new Date().toISOString(),
    },
  ];

  const tasks = [
    t('tsk-1001', 'Kimlik doğrulama akışını yaz', 'JWT + yenileme tokenı. Hatalı girişte 3 deneme sınırı olsun.', 'kritik', 'Mehmet Ali', 4, 'in_progress', 'prj-orion'),
    t('tsk-1002', 'Ödeme sağlayıcı entegrasyonu', '3D Secure adımı ve webhook doğrulaması.', 'yuksek', 'Nurullah', 9, 'todo', 'prj-orion'),
    t('tsk-1003', 'Ana sayfa bileşenlerini birleştir', 'Hero, özellik kartları ve fiyat tablosu.', 'orta', 'Zeynep', -2, 'done', 'prj-orion'),
    t('tsk-1004', 'Veritabanı şemasını gözden geçir', 'İndeksler ve yabancı anahtar kısıtları.', 'yuksek', 'Elif', -1, 'done', 'prj-orion'),
    t('tsk-1005', 'Çevrimdışı senkron kuyruğu', 'Bağlantı gelince bekleyen değişiklikleri it.', 'kritik', 'Nurullah', 6, 'in_progress', 'prj-atlas'),
    t('tsk-1006', 'Harita katmanı performansı', 'Düşük donanımda 60fps hedefi.', 'orta', 'Kerem', -3, 'in_progress', 'prj-atlas'),
    t('tsk-1007', 'Bildirim izinleri ekranı', 'Kullanıcı reddederse yönlendirme metni.', 'dusuk', 'Zeynep', 14, 'todo', 'prj-atlas'),
    t('tsk-1008', 'Saha testi geri bildirimleri', '5 pilot kullanıcının notlarını işle.', 'orta', 'Elif', -5, 'done', 'prj-atlas'),
    t('tsk-1009', 'ETL hattı iskeleti', 'Kaynak sistemden çekim + dönüşüm adımları.', 'yuksek', 'Elif', 18, 'todo', 'prj-vega'),
    t('tsk-1010', 'Analitik şema tasarımı', 'Yıldız şema: fact_sales + boyutlar.', 'orta', 'Kerem', 25, 'todo', 'prj-vega'),
    t('tsk-1011', 'Bileşen kütüphanesi dokümantasyonu', 'Kullanım örnekleri + erişilebilirlik notları.', 'dusuk', 'Zeynep', -8, 'done', 'prj-lyra'),
    t('tsk-1012', 'Eski paneli kaldır', 'Yeni sisteme geçiş sonrası temizlik.', 'dusuk', 'Kerem', 11, 'todo', '' /* projesiz görev */),
  ];

  const team = [
    { id: 'usr-1', name: 'Mehmet Ali', role: 'Kurucu / Backend', email: 'mehmet@ornek.com', color: '#4f8cff' },
    { id: 'usr-2', name: 'Nurullah', role: 'Kurucu / Mobil', email: 'nurullah@ornek.com', color: '#22c55e' },
    { id: 'usr-3', name: 'Elif', role: 'Veri Mühendisi', email: 'elif@ornek.com', color: '#a855f7' },
    { id: 'usr-4', name: 'Zeynep', role: 'Tasarım', email: 'zeynep@ornek.com', color: '#f59e0b' },
    { id: 'usr-5', name: 'Kerem', role: 'Frontend', email: 'kerem@ornek.com', color: '#ef4444' },
  ];

  return {
    version: 1,
    projects,
    tasks,
    team,
    activity: [
      log('sistem', 'Sistem', 'Demo veri yüklendi', '4 proje ve ' + tasks.length + ' görev hazır.'),
    ],
  };
}

function t(id, title, description, priority, assignee, dueOffset, status, projectId) {
  return {
    id,
    title,
    description,
    priority,
    assignee,
    due: AYLAR_ONCE(dueOffset),
    status,
    projectId,
    createdAt: new Date().toISOString(),
    completedAt: status === 'done' ? new Date().toISOString() : null,
  };
}

function log(type, actor, action, detail) {
  return {
    id: 'act-' + Math.random().toString(36).slice(2, 10),
    type,
    actor,
    action,
    detail,
    at: new Date().toISOString(),
  };
}

/* ------------------------------------------------------------------ */
/* Depo                                                                */
/* ------------------------------------------------------------------ */

let cache = null;

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function read() {
  if (cache) return cache;
  ensureDir();
  if (!fs.existsSync(DB_FILE)) {
    cache = seedData();
    writeRaw(cache);
    return cache;
  }
  try {
    cache = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    // Eski/eksik alanlara karşı savunma
    cache.projects = cache.projects || [];
    cache.tasks = cache.tasks || [];
    cache.team = cache.team || [];
    cache.activity = cache.activity || [];
    return cache;
  } catch (err) {
    // Bozuk dosya → bozmadan yedekle, temiz başla (dürüst hata izi bırakır)
    const bak = DB_FILE + '.bozuk-' + Date.now();
    try { fs.copyFileSync(DB_FILE, bak); } catch (_) { /* yok say */ }
    cache = seedData();
    cache.activity.unshift(log('hata', 'Sistem', 'Veri dosyası okunamadı', 'Bozuk dosya yedeklendi: ' + path.basename(bak)));
    writeRaw(cache);
    return cache;
  }
}

function writeRaw(data) {
  ensureDir();
  fs.writeFileSync(TMP_FILE, JSON.stringify(data, null, 2), 'utf8');
  fs.renameSync(TMP_FILE, DB_FILE);
}

function write(data) {
  cache = data;
  writeRaw(data);
  return cache;
}

/**
 * Tek noktadan mutasyon. fn(db) mutasyonu yapar, opsiyonel aktivite kaydı döner.
 */
function mutate(fn) {
  const db = read();
  const result = fn(db);
  if (result && result.activity) {
    db.activity.unshift(log(result.activity.type, result.activity.actor, result.activity.action, result.activity.detail));
    if (db.activity.length > 400) db.activity.length = 400; // sınırsız büyümeyi engelle
  }
  write(db);
  return result ? result.value : undefined;
}

function reset() {
  cache = seedData();
  writeRaw(cache);
  return cache;
}

/* ------------------------------------------------------------------ */
/* Türetilmiş değerler (TEK DOĞRULUK KAYNAĞI)                          */
/* ------------------------------------------------------------------ */

/** Proje ilerlemesi görevlerden otomatik hesaplanır — elle yazılmaz. */
function projectProgress(db, projectId) {
  const tasks = db.tasks.filter((x) => x.projectId === projectId);
  if (tasks.length === 0) return { total: 0, done: 0, percent: 0 };
  const done = tasks.filter((x) => x.status === 'done').length;
  return { total: tasks.length, done, percent: Math.round((done / tasks.length) * 100) };
}

function isOverdue(task) {
  if (task.status === 'done' || !task.due) return false;
  const today = new Date().toISOString().slice(0, 10);
  return task.due < today;
}

module.exports = {
  read,
  write,
  mutate,
  reset,
  seedData,
  log,
  projectProgress,
  isOverdue,
  DB_FILE,
  DATA_DIR,
};
