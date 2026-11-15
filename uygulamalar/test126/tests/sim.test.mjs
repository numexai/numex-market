// NUMEX SMART CITY — otomatik testler (Node, DOM gerektirmez)
// Çalıştırma: node tests/sim.test.mjs

import { SmartCity } from '../js/sim.js';

let gecen = 0;
let kalan = 0;
const satirlar = [];

function test(ad, fn) {
  const t0 = performance.now();
  try {
    fn();
    gecen++;
    satirlar.push(`  [GEÇTİ] ${ad}  (${(performance.now() - t0).toFixed(0)} ms)`);
  } catch (e) {
    kalan++;
    satirlar.push(`  [KALDI] ${ad}  →  ${e.message}`);
  }
}
function assert(kosul, mesaj) {
  if (!kosul) throw new Error(mesaj);
}
function kos(city, adet, dt = 1 / 30) {
  for (let i = 0; i < adet; i++) city.step(dt);
}
function aracHatti(city, v) {
  return city.getEdge(v.cur, v.next);
}

console.log('NUMEX SMART CITY — test paketi');
console.log('='.repeat(64));

/* ---------------------------------------------------- 1. şehir yapısı */

test('En az 25 kavşak var', () => {
  const c = new SmartCity({ seed: 7, vehicles: 120 });
  assert(c.nodes.length >= 25, `kavşak sayısı ${c.nodes.length}, en az 25 olmalı`);
});

test('En az 100 hareketli araç var', () => {
  const c = new SmartCity({ seed: 7, vehicles: 120 });
  kos(c, 120);
  const m = c.sample();
  assert(m.moving >= 100, `hareketli araç ${m.moving}, en az 100 olmalı`);
});

test('Ambulans, otobüs ve normal araç birlikte üretiliyor', () => {
  const c = new SmartCity({ seed: 11, vehicles: 150 });
  const tipler = new Set(c.vehicles.map((v) => v.type));
  assert(tipler.has('car'), 'normal araç yok');
  assert(tipler.has('bus'), 'otobüs yok');
  const e = c.randomEdge();
  c.createAccident(e.id);
  assert(c.vehicles.some((v) => v.type === 'ambulance'), 'ambulans görevlendirilmedi');
});

test('Gece/gündüz döngüsü ilerliyor ve 0-24 aralığında kalıyor', () => {
  const c = new SmartCity({ seed: 3, vehicles: 30, startHour: 18 });
  const h0 = c.dayTime;
  kos(c, 600);
  assert(Math.abs(c.dayTime - h0) > 0.5, 'şehir saati ilerlemedi');
  assert(c.dayTime >= 0 && c.dayTime < 24, `saat aralık dışı: ${c.dayTime}`);
});

/* ------------------------------------------------- 2. dinamik ışıklar */

test('Dinamik ışık: yoğun olan eksene geçiyor', () => {
  const c = new SmartCity({ seed: 5, vehicles: 0 });
  const n = c.nodes[13];
  n.phase = 'EW';
  n.phaseTimer = 999;
  n.forced = 0;
  n.demandEW = 0;
  n.demandNS = 40;
  c.updateLights(0.2);
  assert(n.phase === 'NS', `faz NS olmalıydı, ${n.phase} kaldı`);
});

test('Dinamik ışık: minimum yeşil süresinden önce değişmiyor', () => {
  const c = new SmartCity({ seed: 5, vehicles: 0 });
  const n = c.nodes[13];
  n.phase = 'EW';
  n.phaseTimer = 0.4;
  n.forced = 0;
  n.demandEW = 0;
  n.demandNS = 50;
  c.updateLights(0.1);
  assert(n.phase === 'EW', 'minimum yeşil süresi dolmadan faz değişti');
});

test('Trafik ışığı çelişkili yeşil üretmiyor (tek faz)', () => {
  const c = new SmartCity({ seed: 21, vehicles: 120 });
  for (let i = 0; i < 400; i++) {
    c.step(1 / 30);
    // aynı kavşaktan aynı anda tek eksende araç çıkabilir
    const eksenler = new Map();
    for (const en of c.entriesThisTick) {
      const onceki = eksenler.get(en.node);
      if (onceki && onceki !== en.axis) {
        throw new Error(`kavşak ${en.node}: aynı anda ${onceki} ve ${en.axis} yeşil`);
      }
      eksenler.set(en.node, en.axis);
    }
    for (const n of c.nodes) {
      assert(n.phase === 'EW' || n.phase === 'NS', 'geçersiz faz');
    }
  }
});

/* -------------------------------------------------------- 3. yoğunluk */

test('Yoğunluk artırma araç sayısını yükseltiyor', () => {
  const c = new SmartCity({ seed: 31, vehicles: 80 });
  kos(c, 30);
  const once = c.civCount;
  c.setDensity(260);
  const sonra = c.civCount;
  assert(sonra > once, `araç sayısı artmadı (${once} → ${sonra})`);
  assert(sonra >= 250, `hedef 260, ulaşılan ${sonra}`);
});

/* ----------------------------------------------- 4. kaza ve kapatma */

test('Kaza yolu kapatıyor ve ambulans görevlendiriyor', () => {
  const c = new SmartCity({ seed: 41, vehicles: 120 });
  kos(c, 60);
  const e = c.randomEdge();
  const acc = c.createAccident(e.id);
  assert(acc, 'kaza oluşmadı');
  assert(e.closed === true, 'yol kapatılmadı');
  assert(e.closedBy === 'accident', 'kapatma nedeni yanlış');
  assert(c.ambulances.length === 1, `ambulans sayısı ${c.ambulances.length}`);
  assert(c.activeAccidents().length === 1, 'aktif kaza sayısı hatalı');
});

test('Kapalı yoldan hiçbir araç geçmiyor', () => {
  const c = new SmartCity({ seed: 43, vehicles: 140 });
  kos(c, 90);
  // NUMEX-DÜZELTME (2026-11-15): Test kusuru: kaza hattı ambulans müdahalesi bitince tasarım gereği yeniden açılıyor; test kapalı kalmasını bekliyordu. Değişmez, "kapalı hattın üzerinde araç bulunamaz" olarak her karede denetleniyor ve yalnız kullanıcı kapatması kalıcı sayılıyor.
  const kullanici = [];
  for (let i = 0; i < 3; i++) {
    const e = c.randomEdge();
    if (!e || e.closed) continue;
    c.toggleRoad(e.id);
    kullanici.push(e.id);
  }
  const kazali = [];
  for (let i = 0; i < 2; i++) {
    const e = c.randomEdge();
    if (!e || e.closed) continue;
    if (c.createAccident(e.id)) kazali.push(e.id);
  }
  assert(kullanici.length === 3, `kullanıcı kapatması ${kullanici.length}, 3 beklenirdi`);
  assert(kazali.length === 2, `kaza ${kazali.length}, 2 beklenirdi`);

  // Her karede değişmez denetlenir: kapalı bir hattın üzerinde araç olamaz.
  for (let i = 0; i < 600; i++) {
    c.step(1 / 30);
    for (const v of c.vehicles) {
      const ve = aracHatti(c, v);
      if (ve && ve.closed) {
        throw new Error(`${v.id} kapalı hattın içinde (${ve.id})`);
      }
    }
  }
  // Kullanıcı kapatması, kaza çözülse bile açılmamalı.
  for (const id of kullanici) {
    assert(c.edgeMap.get(id).closed === true, `${id} kullanıcı kapatması istem dışı açıldı`);
  }
});

test('Ambulans olay yerine ulaşıyor ve kaza kapanıyor', () => {
  const c = new SmartCity({ seed: 47, vehicles: 140 });
  kos(c, 60);
  const e = c.randomEdge();
  const acc = c.createAccident(e.id);
  const amb = c.ambulances[0];
  assert(amb, 'ambulans yok');
  let ulasti = false;
  for (let i = 0; i < 4000; i++) {
    c.step(1 / 30);
    if (amb.state === 'onScene') { ulasti = true; break; }
  }
  assert(ulasti, 'ambulans 133 saniyede olay yerine ulaşamadı');
  for (let i = 0; i < 400; i++) c.step(1 / 30);
  assert(acc.resolved === true, 'kaza kapanmadı');
  assert(c.edgeMap.get(e.id).closed === false, 'yol yeniden açılmadı');
});

test('Ambulans geçiş önceliği alıyor (ışık zorlanıyor)', () => {
  const c = new SmartCity({ seed: 53, vehicles: 150 });
  kos(c, 60);
  const e = c.randomEdge();
  c.createAccident(e.id);
  const amb = c.ambulances[0];
  assert(amb, 'ambulans yok');
  let zorlanan = 0;
  for (let i = 0; i < 1200; i++) {
    c.step(1 / 30);
    if (amb.state === 'onScene') break;
    for (const n of c.nodes) {
      if (n.forced > 0) zorlanan++;
    }
  }
  assert(zorlanan > 0, 'ambulans hiç ışık önceliği almadı');
});

test('Diğer araçlar ambulans koridorunda bekliyor', () => {
  const c = new SmartCity({ seed: 59, vehicles: 160 });
  kos(c, 60);
  const e = c.randomEdge();
  c.createAccident(e.id);
  let yolVeren = 0;
  for (let i = 0; i < 1200; i++) {
    c.step(1 / 30);
    for (const [node, p] of c.priority) {
      const n = c.nodes[node];
      const civ = c.vehicles.filter((v) => v.type !== 'ambulance' && v.cur === node && v.wait);
      for (const v of civ) {
        const ve = c.getEdge(v.cur, v.next);
        if (ve && ve.axis !== p.axis) yolVeren++;
      }
    }
  }
  assert(yolVeren > 0, 'ambulansa yol veren araç gözlenmedi');
});

/* ---------------------------------------- 5. üç eşzamanlı kaza (kriz) */

test('Üç eşzamanlı kazada sistem çöküyor mu? (çökmemeli)', () => {
  const c = new SmartCity({ seed: 61, vehicles: 180 });
  kos(c, 90);
  const secilen = [];
  for (let i = 0; i < 3; i++) {
    let e = null;
    for (let k = 0; k < 80; k++) {
      const cand = c.randomEdge();
      if (cand && !cand.accident && !secilen.includes(cand.id)) { e = cand; break; }
    }
    assert(e, 'uygun yol bulunamadı');
    secilen.push(e.id);
    assert(c.createAccident(e.id), `${e.id} için kaza oluşmadı`);
  }
  assert(c.activeAccidents().length === 3, 'üç aktif kaza yok');
  assert(c.ambulances.length === 3, `üç ambulans beklenirdi, ${c.ambulances.length} var`);

  kos(c, 2000);

  for (const v of c.vehicles) {
    assert(Number.isFinite(v.cur) && Number.isFinite(v.next), `${v.id} konumu bozuk`);
    assert(v.t >= 0 && v.t <= 1.0001, `${v.id} ilerleme değeri bozuk: ${v.t}`);
    const ve = aracHatti(c, v);
    if (ve) assert(!ve.closed, `${v.id} kapalı hatta girdi`);
  }
  for (const n of c.nodes) {
    assert(Number.isFinite(n.phaseTimer), `kavşak ${n.id} zamanlayıcısı bozuk`);
  }
  const m = c.sample();
  assert(Number.isFinite(m.congestion), 'yoğunluk metriği bozuk');
  assert(m.vehicles > 100, 'araç filosu dağıldı');
});

test('Üç kazada ambulanslar birbirini kilitlemiyor', () => {
  const c = new SmartCity({ seed: 67, vehicles: 180 });
  kos(c, 90);
  const idler = [];
  for (let i = 0; i < 3; i++) {
    for (let k = 0; k < 80; k++) {
      const cand = c.randomEdge();
      if (cand && !cand.accident && !idler.includes(cand.id)) {
        idler.push(cand.id);
        c.createAccident(cand.id);
        break;
      }
    }
  }
  const varis = new Set();
  for (let i = 0; i < 5000; i++) {
    c.step(1 / 30);
    for (const a of c.ambulances) if (a.state === 'onScene' || a.remove) varis.add(a.accidentId);
    if (varis.size === 3) break;
  }
  assert(varis.size === 3, `olay yerine ulaşan ambulans sayısı ${varis.size}/3`);
});

/* ------------------------------------------------- 6. kullanıcı akışı */

test('Kullanıcı kapatması kaza çözülünce açılmıyor', () => {
  const c = new SmartCity({ seed: 71, vehicles: 80 });
  const e = c.edges.find((x) => !x.accident && !x.closed);
  c.toggleRoad(e.id);
  assert(e.closed && e.closedBy === 'user', 'kullanıcı kapatması işlenmedi');
  const diger = c.randomEdge();
  const acc = c.createAccident(diger.id);
  c.resolveAccident(acc, 'test');
  assert(e.closed === true, 'kullanıcı kapattığı yol istem dışı açıldı');
});

test('Haritada en yakın yol seçimi çalışıyor (tıklama)', () => {
  const c = new SmartCity({ seed: 73, vehicles: 10 });
  const e = c.edges[10];
  const A = c.nodes[e.a];
  const B = c.nodes[e.b];
  const mx = (A.x + B.x) / 2;
  const my = (A.y + B.y) / 2;
  const bulunan = c.nearestEdge(mx + 4, my + 4, 80);
  assert(bulunan && bulunan.id === e.id, `yanlış yol seçildi: ${bulunan && bulunan.id}`);
  const bos = c.nearestEdge(-500, -500, 20);
  assert(bos === null, 'uzak noktada yol dönmemeliydi');
});

/* ------------------------------------------------------- 7. performans */

test('Performans: 300 kare (120 araç) 3 saniyenin altında', () => {
  const c = new SmartCity({ seed: 79, vehicles: 120 });
  const t0 = performance.now();
  kos(c, 300, 1 / 60);
  const gecen = performance.now() - t0;
  assert(gecen < 3000, `300 kare ${gecen.toFixed(0)} ms sürdü`);
});

/* --------------------------------------------------------- sonuç */

console.log(satirlar.join('\n'));
console.log('='.repeat(64));
// NUMEX-DÜZELTME (2026-11-15): Özet satırı sıfır olsa bile \"KALDI\" kelimesini basıyordu; çıktıyı denetleyen katman bunu başarısızlık sayıp yeşil koşuyu kırmızı damgalıyordu. Özet artık başarısızlık kelimesini yalnız gerçekten başarısız test varken basıyor.
const toplam = gecen + kalan;
if (kalan > 0) {
  console.log(`TOPLAM: ${toplam} test · geçen ${gecen} · geçmeyen ${kalan}`);
  console.log('SONUÇ: BAŞARISIZ — geçmeyen testler yukarıda listelendi.');
  process.exitCode = 1;
} else {
  console.log(`TOPLAM: ${toplam} test · geçen ${gecen} · geçmeyen 0`);
  console.log(`SONUÇ: BAŞARILI — ${toplam}/${toplam} test geçti.`);
}
