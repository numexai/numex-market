/* NUMEX RESCUE — kritik davranış testleri (node test.js) */
const R = require('./sim.js');
const { Sim, findPath, isBlocked, buildBlocked, CELL, WORLD } = R;

let pass = 0, fail = 0;
const results = [];

function test(name, fn) {
  try { fn(); pass++; results.push('  [GEÇTİ]  ' + name); }
  catch (e) { fail++; results.push('  [KALDI]  ' + name + '  →  ' + e.message); }
}
function assert(cond, msg) { if (!cond) throw new Error(msg || 'koşul sağlanmadı'); }
function near(a, b, tol) { return Math.abs(a - b) <= (tol === undefined ? 0.5 : tol); }

/* 1 — aynı seed aynı sonucu üretir */
test('seed tekrarlanabilirlik: aynı seed → aynı durum', () => {
  const a = new Sim(4242), b = new Sim(4242);
  for (let i = 0; i < 900; i++) { a.update(0.1); b.update(0.1); }
  assert(a.stats.rescued === b.stats.rescued, 'kurtarılan farklı: ' + a.stats.rescued + ' / ' + b.stats.rescued);
  assert(a.calls.length === b.calls.length, 'çağrı sayısı farklı');
  assert(a.stats.callsSpawned === b.stats.callsSpawned, 'üretilen çağrı farklı');
  for (let i = 0; i < a.drones.length; i++) {
    assert(near(a.drones[i].x, b.drones[i].x, 0.01) && near(a.drones[i].y, b.drones[i].y, 0.01), 'drone konumu ayrıştı: ' + a.drones[i].id);
    assert(near(a.drones[i].battery, b.drones[i].battery, 0.01), 'batarya ayrıştı');
  }
});

/* 2 — farklı seed farklı akış */
test('farklı seed → farklı olay akışı', () => {
  const a = new Sim(11), b = new Sim(9999);
  for (let i = 0; i < 400; i++) { a.update(0.1); b.update(0.1); }
  const pa = a.calls.map(c => Math.round(c.x) + ':' + Math.round(c.y)).join('|');
  const pb = b.calls.map(c => Math.round(c.x) + ':' + Math.round(c.y)).join('|');
  assert(pa !== pb, 'iki farklı seed aynı çağrıları üretti');
});

/* 3 — duraklatma zamanı durdurur */
test('duraklat/devam: paused iken zaman ilerlemez', () => {
  const s = new Sim(7);
  s.update(10);
  const t0 = s.t;
  s.paused = true;
  s.update(20);
  assert(s.t === t0, 'duraklatılmışken zaman ilerledi: ' + s.t + ' != ' + t0);
  s.paused = false;
  s.update(1);
  assert(s.t > t0, 'devam ettirilince zaman ilerlemedi');
});

/* 4 — sıfırlama */
test('sıfırla: durum tamamen temizlenir', () => {
  const s = new Sim(3);
  s.update(30);
  s.reset(55);
  assert(s.t === 0 && s.calls.length === 0 && s.stats.rescued === 0, 'sıfırlama eksik');
  assert(s.drones.length === 6, 'drone sayısı 6 değil');
  assert(s.drones.every(d => d.battery > 0 && d.state === 'idle'), 'dronlar temiz durumda değil');
});

/* 5 — aynı çağrıya iki drone atanamaz */
test('atama tekilliği: bir çağrıya tek drone, bir drone tek görev', () => {
  const s = new Sim(123);
  for (let i = 0; i < 600; i++) {
    s.update(0.1);
    const byDrone = new Set();
    for (const d of s.drones) if (d.missionId) {
      assert(!byDrone.has(d.missionId), 'iki drone aynı göreve atandı: ' + d.missionId);
      byDrone.add(d.missionId);
    }
    for (const c of s.calls) {
      if (!c.droneId) continue;
      const owners = s.drones.filter(d => d.missionId === c.id);
      assert(owners.length <= 1, c.id + ' için ' + owners.length + ' drone sahibi var');
    }
  }
});

/* 6 — uçuşa yasak bölge rotayı gerçekten etkiler */
test('yasak bölge: rota içinden geçmez, alternatif üretir', () => {
  const blocked = new Uint8Array(60 * 40);
  const cx = 600, cy = 400, rr = 140;
  for (let y = 0; y < 40; y++) for (let x = 0; x < 60; x++) {
    const px = x * CELL + CELL / 2, py = y * CELL + CELL / 2;
    if (Math.hypot(px - cx, py - cy) <= rr) blocked[y * 60 + x] = 1;
  }
  const p = findPath(blocked, 380, 400, 820, 400);
  assert(p && p.points.length > 1, 'alternatif rota bulunamadı');
  for (let i = 1; i < p.points.length; i++) {
    const a = p.points[i - 1], b = p.points[i];
    const steps = Math.max(1, Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / 4));
    for (let k = 1; k <= steps; k++) {
      const t = k / steps;
      const x = a.x + (b.x - a.x) * t, y = a.y + (b.y - a.y) * t;
      const inside = Math.hypot(x - cx, y - cy) < rr - 2;
      assert(!inside, 'rota yasak bölgenin içinden geçiyor (' + Math.round(x) + ',' + Math.round(y) + ')');
    }
  }
  const direct = findPath(new Uint8Array(2400), 380, 400, 820, 400);
  assert(p.length >= direct.length, 'yasaklı rota doğrudan rotadan kısa olamaz');
});

/* 7 — hedef yasak bölgedeyse en yakın serbest hücreye yönelir */
test('hedef yasak bölge içindeyse rota yine üretilir', () => {
  const blocked = buildBlocked([{ x: 600, y: 400, r: 120 }]);
  const p = findPath(blocked, 200, 200, 600, 400);
  assert(p && p.points.length > 0, 'rota üretilemedi');
});

/* 8 — yetersiz bataryalı drone göreve gönderilmez */
test('batarya: yetersiz drone yeni göreve atanmaz', () => {
  const s = new Sim(2026);
  s.calls.length = 0;
  for (const d of s.drones) { d.state = 'failed'; }
  const d0 = s.drones[0];
  d0.state = 'idle'; d0.missionId = null; d0.battery = 8;
  const c = s.spawnCall(WORLD.w - 120, WORLD.h - 120, 'red');
  s.dispatch();
  assert(c.droneId === null && c.status === 'pending', 'yetersiz bataryalı drone göreve atandı');
});

/* 9 — batarya rezervi düşünce görev iptal + istasyona dönüş */
test('batarya rezervi: görev iptal, çağrı kuyruğa döner, drone eve döner', () => {
  const s = new Sim(31);
  s.calls.length = 0;
  for (const d of s.drones) d.state = 'failed';
  const d0 = s.drones[1];
  d0.state = 'idle'; d0.missionId = null; d0.battery = 100;
  const c = s.spawnCall(d0.home.x + 260, d0.home.y, 'orange');
  s.dispatch();
  assert(c.droneId === d0.id, 'görev atanamadı');
  d0.battery = 6; /* uçuş sırasında rezerv altına düştü */
  s.update(0.3);
  assert(c.droneId === null && c.status === 'pending', 'görev kuyruğa dönmedi');
  /* Park yeri istasyona yakınsa dönüş kısa sürer: dönüş tamamlanıp şarja geçmiş olabilir. */
  assert(d0.state === 'returning' || d0.state === 'charging', 'drone eve dönmüyor: ' + d0.state);
});

/* 10 — hedefe ulaşmadan kurtarma tamamlanmaz */
test('kurtarma: hedefe varmadan ve süre dolmadan tamamlanmaz', () => {
  const s = new Sim(77);
  s.calls.length = 0;
  for (const d of s.drones) d.state = 'failed';
  const d0 = s.drones[2];
  d0.state = 'idle'; d0.missionId = null; d0.battery = 100; d0.speed = 100;
  const c = s.spawnCall(d0.home.x + 300, d0.home.y, 'red');
  s.dispatch();
  assert(c.droneId === d0.id, 'görev atanamadı');
  /* yolun ilk yarısında kurtarma tamamlanmamalı */
  for (let i = 0; i < 15; i++) s.update(0.1);
  assert(s.stats.rescued === 0, 'yolda kurtarma tamamlandı');
  assert(d0.state === 'enroute', 'drone yolda değil: ' + d0.state);
  /* varışa kadar ilerle */
  let reached = false;
  for (let i = 0; i < 200; i++) {
    s.update(0.1);
    if (d0.state === 'rescuing') { reached = true; assert(s.stats.rescued === 0, 'kurtarma süresi dolmadan kredi verildi'); break; }
  }
  assert(reached, 'drone hedefe ulaşmadı');
  for (let i = 0; i < 40; i++) s.update(0.1);
  assert(s.stats.rescued === c.people, 'kurtarılan kişi sayısı yanlış: ' + s.stats.rescued + ' != ' + c.people);
  assert(c.status === 'done', 'çağrı tamamlanmadı');
});

/* 11 — arıza: görev başka drone'a devredilir */
test('arıza: görev başka uygun drone\'a devredilir', () => {
  const s = new Sim(8080);
  s.calls.length = 0;
  const c = s.spawnCall(400, 400, 'red');
  s.dispatch();
  assert(c.droneId, 'ilk atama yapılamadı');
  const first = c.droneId;
  s.forceFault(first);
  assert(c.droneId === null && c.status === 'pending', 'arıza sonrası çağrı serbest kalmadı');
  assert(s.droneById(first).state === 'failed', 'drone arızalı işaretlenmedi');
  s.update(1.2);
  assert(c.droneId && c.droneId !== first, 'görev başka drone\'a devredilmedi');
});

/* 12 — çağrı üretim temposu */
test('çağrı temposu: 10 saniyede bir yeni çağrı', () => {
  const s = new Sim(5);
  s.update(5.05);
  assert(s.stats.callsSpawned === 1, 'ilk çağrı zamanı hatalı: ' + s.stats.callsSpawned);
  s.update(10.05);
  assert(s.stats.callsSpawned === 2, 'ikinci çağrı gelmedi: ' + s.stats.callsSpawned);
  s.update(30.0);
  assert(s.stats.callsSpawned === 5, 'tempo kaydı: ' + s.stats.callsSpawned);
});

/* 13 — öncelik seviyeleri */
test('öncelik: çağrılar üç seviyeden birinde', () => {
  const s = new Sim(91);
  s.update(200);
  const set = new Set(s.calls.map(c => c.priority));
  for (const p of set) assert(['red', 'orange', 'yellow'].includes(p), 'geçersiz öncelik: ' + p);
  assert(s.calls.length > 5, 'yeterli çağrı üretilmedi');
  assert(set.has('red') || set.has('orange') || set.has('yellow'), 'hiç öncelik yok');
});

/* 14 — çalışan drone/görev akışı: uzun koşuda ilerleme */
test('uzun koşu: simülasyon tıkanmadan kurtarma üretir', () => {
  const s = new Sim(2026);
  s.update(300);
  assert(s.stats.rescued > 0, 'hiç kurtarma tamamlanmadı');
  assert(s.calls.length >= 25, 'çağrı üretimi yetersiz: ' + s.calls.length);
  assert(s.metrics().nfz >= 3, 'uçuşa yasak bölgeler yok');
  assert(s.drones.length === 6, 'drone sayısı değişti');
});

console.log('\nNUMEX RESCUE — OTOMATİK TEST RAPORU');
console.log('='.repeat(58));
results.forEach(r => console.log(r));
console.log('-'.repeat(58));
console.log('Toplam: ' + (pass + fail) + '  ·  geçen: ' + pass + '  ·  kalan: ' + fail);
console.log('='.repeat(58) + '\n');
process.exit(fail === 0 ? 0 : 1);
