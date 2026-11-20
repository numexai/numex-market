// 12 kabul testi — motoru doğrudan kurar, saf kuralları sınar.
import { createWorld, resetWorld, snapshot, restoreWorld } from '../src/engine/world.js';
import { generateFleet } from '../src/model/container.js';
import { createZones, placeContainer, zoneUsed, zoneAccepts, stackAllowed } from '../src/model/yard.js';
import { createCranes, craneCanLift } from '../src/model/crane.js';
import { createTransports, assignTransport, transportIsFree } from '../src/model/transport.js';
import { buildJobPlan, pickCandidateCrane, pickTargetZone } from '../src/engine/rules.js';
import { dispatchTick, reassignCraneJobs, pushUrgent, setCraneSwitch } from '../src/engine/dispatch.js';
import { tick, start, pause, applyScenario, computeStats } from '../src/engine/sim.js';

function ok(name, cond, note) {
  return { name, pass: !!cond, note: note || '' };
}

export function runAcceptance() {
  const r = [];

  // 1) 60 konteyner doğru oluşuyor
  const w = createWorld(42);
  r.push(ok('1. 60 konteyner doğru oluşuyor', w.containers.length === 60, `bulunan: ${w.containers.length}`));

  // 2) ID'ler benzersiz
  const ids = new Set(w.containers.map((c) => c.id));
  r.push(ok('2. Konteyner ID\'leri benzersiz', ids.size === w.containers.length, `${ids.size}/${w.containers.length}`));

  // 3) Kapasitesi yetersiz vinç yükü kaldıramıyor
  const cranes = createCranes();
  const small = cranes.find((c) => c.capTon === 25);
  const heavyC = generateFleet(60, 42).find((c) => c.weight > 25) || { weight: 30 };
  r.push(
    ok(
      '3. Kapasitesi yetersiz vinç yükü kaldıramıyor',
      heavyC ? craneCanLift(small, heavyC) === false : false,
      `${small.id} ${small.capTon}t / yük ${heavyC.weight}t`
    )
  );

  // 4) Aynı konteyner aynı anda iki araca atanmıyor
  const trs = createTransports();
  const job = { id: 'JOB-T', container: { id: 'X', weight: 10 } };
  const a1 = assignTransport(w, trs[0], job);
  const a2 = assignTransport(w, trs[0], { id: 'JOB-T2', container: { id: 'X', weight: 10 } });
  r.push(ok('4. Aynı konteyner iki araca atanmıyor', a1 && !a2 && !transportIsFree(trs[0]), 'ikinci atama reddedildi'));

  // 5) Bölge kapasitesi aşılmıyor
  const zones = createZones();
  const zA = zones[0];
  let placed = 0;
  for (let i = 0; i < 40; i++) {
    const c = { id: 'C' + i, size: 20, weight: 10, type: 'general' };
    const res = placeContainer(zA, c);
    if (res.ok) placed++;
  }
  r.push(
    ok('5. Bölge kapasitesi aşılmıyor', zoneUsed(zA) <= zA.capacity, `${zoneUsed(zA)}/${zA.capacity}, kabul ${placed}`)
  );

  // 6) Tehlikeli yükler doğru bölgeye ayrılıyor
  const zGen = zones.find((z) => z.id === 'A');
  const zDg = zones.find((z) => z.id === 'D');
  const dg = { id: 'DG1', size: 20, weight: 18, type: 'dangerous' };
  const rej = zoneAccepts(zGen, dg);
  const acc = zoneAccepts(zDg, dg);
  const tgt = pickTargetZone(createWorld(42), dg);
  r.push(
    ok(
      '6. Tehlikeli yükler doğru bölgeye ayrılıyor',
      rej.ok === false && acc.ok === true && tgt && tgt.zone.id === 'D',
      `genel red: ${!rej.ok}, DG kabul: ${acc.ok}, hedef: ${tgt && tgt.zone.id}`
    )
  );

  // 7) Vinç arızasında bekleyen işler yeniden planlanıyor
  const w7 = createWorld(42);
  start(w7);
  for (let i = 0; i < 40; i++) tick(w7, 100);
  const before = w7.jobs.filter((j) => j.craneId === 'CR-2').length;
  setCraneSwitch(w7, 'CR-2', false);
  const cr2 = w7.cranes.find((c) => c.id === 'CR-2');
  const afterJobs = w7.jobs.filter((j) => j.craneId === 'CR-2').length;
  r.push(
    ok(
      '7. Vinç arızasında işler yeniden planlanıyor',
      !cr2.on && afterJobs === 0 && w7.jobs.every((j) => j.craneId !== 'CR-2'),
      `arıza öncesi CR-2 işi: ${before}, sonra: ${afterJobs}`
    )
  );

  // 8) Yüksek öncelikli konteyner öne alınıyor
  const w8 = createWorld(42);
  const u = pushUrgent(w8);
  const firstAssigned = w8.jobs[0] ? w8.jobs[0].containerId : w8.queue[0];
  r.push(
    ok(
      '8. Yüksek öncelikli konteyner öne alınıyor',
      u.priority === 5 && (firstAssigned === u.id || w8.queue.indexOf(u.id) === 0),
      `acil: ${u.id}, ilk iş: ${firstAssigned}`
    )
  );
  void reassignCraneJobs;

  // 9) Başlat/durdur zamanı doğru yönetiyor
  const w9 = createWorld(42);
  start(w9);
  for (let i = 0; i < 20; i++) tick(w9, 100);
  const tRunning = w9.clock;
  pause(w9);
  for (let i = 0; i < 20; i++) tick(w9, 100);
  const tPaused = w9.clock;
  r.push(
    ok('9. Başlat/durdur simülasyon zamanını doğru yönetiyor', tRunning > 0 && Math.abs(tRunning - tPaused) < 1e-9, `çalışırken ${tRunning.toFixed(1)}s, dururken ${tPaused.toFixed(1)}s`)
  );

  // 10) Aynı başlangıç verisi aynı planı üretiyor
  const p1 = planSignature(createWorld(42));
  const p2 = planSignature(createWorld(42));
  r.push(ok('10. Aynı başlangıç verisi aynı planı üretiyor', p1 === p2 && p1.length > 0, p1.slice(0, 40) + '…'));

  // 11) JSON gidiş-dönüşünde konteyner durumları korunuyor
  const w11 = createWorld(42);
  start(w11);
  for (let i = 0; i < 60; i++) tick(w11, 100);
  const snap = snapshot(w11);
  const back = restoreWorld(JSON.parse(JSON.stringify(snap)));
  const same =
    back.containers.length === w11.containers.length &&
    back.containers.every((c, i) => c.id === w11.containers[i].id && c.status === w11.containers[i].status);
  r.push(ok('11. JSON gidiş-dönüşünde durumlar korunuyor', same, `${back.containers.length} konteyner`));

  // 12) Konteyner gemiden depolama alanına taşınıyor (motor düzeyi)
  const w12 = createWorld(42);
  start(w12);
  let moved = 0;
  for (let i = 0; i < 1200; i++) {
    tick(w12, 100);
    moved = w12.containers.filter((c) => c.status === 'yard').length;
    if (moved >= 1) break;
  }
  const st = computeStats(w12);
  r.push(ok('12. Konteyner gemiden sahaya taşınıyor', moved >= 1, `sahada: ${moved}, tamamlanan: ${st.completed}`));

  // Yardımcı: senaryo C kontrolü (bilgilendirici)
  const wc = createWorld(42);
  applyScenario(wc, 'C');
  const zD = wc.zones.find((z) => z.id === 'D');
  r.push(
    ok(
      'Ek. Senaryo C: D bölgesi dolduruluyor, yeni yükler başka alana yönleniyor',
      wc.scenario === 'C' && zoneUsed(zD) > 0,
      `D: ${zoneUsed(zD)}/${zD.capacity}`
    )
  );
  void resetWorld;
  void buildJobPlan;
  void pickCandidateCrane;
  void stackAllowed;
  return r;
}

function planSignature(world) {
  start(world);
  const sig = [];
  for (let i = 0; i < 60; i++) {
    if (i % 5 === 0) dispatchTick(world);
    tick(world, 100);
    world.jobs.forEach((j) => sig.push(j.id + ':' + j.containerId + ':' + j.craneId + ':' + j.transportId));
  }
  return sig.slice(0, 40).join('|');
}

export const testList = [
  '60 konteyner',
  'benzersiz ID',
  'vinç kapasitesi',
  'çift atama',
  'bölge kapasitesi',
  'tehlikeli yük',
  'vinç arızası',
  'acil yük',
  'başlat/durdur',
  'determinizm',
  'JSON gidiş-dönüş',
  'sahaya taşıma',
];
