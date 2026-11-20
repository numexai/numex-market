// Simülasyon döngüsü: zaman yönetimi, vinç/araç ilerlemesi, metrikler
import { SPEEDS, TICK_CAP_MS } from '../config.js';
import { dispatchTick, reassignCraneJobs, pushUrgent, closeJob, setCraneSwitch } from './dispatch.js';
import { zoneById } from '../model/yard.js';
import { craneSetOn } from '../model/crane.js';

export function start(world) {
  world.running = true;
  return world;
}

export function pause(world) {
  world.running = false;
  return world;
}

export function reset(world, seed) {
  world.running = false;
  return world;
}

export function setSpeed(world, mult) {
  world.speed = SPEEDS.includes(mult) ? mult : mult > 0 ? mult : 1;
  return world.speed;
}

export function recordMetric(world, job) {
  const dur = Math.max(0, world.clock - job.t0);
  world.metrics.completed += 1;
  world.metrics.totalTime += dur;
  world.metrics.avgTime = world.metrics.totalTime / world.metrics.completed;
  const ck = job.craneId;
  const tk = job.transportId;
  world.metrics.byCrane[ck] = (world.metrics.byCrane[ck] || 0) + 1;
  world.metrics.byTransport[tk] = (world.metrics.byTransport[tk] || 0) + 1;
}

export function advanceCrane(world, crane, dt) {
  if (!crane || !crane.on) return;
  const job = world.jobs.find((j) => j.id === crane.jobId);
  if (!job) {
    crane.status = crane.on ? 'idle' : 'off';
    return;
  }
  crane.busyTime += dt;
  job.pCrane = Math.min(1, job.pCrane + dt / Math.max(0.01, job.craneTime));
  crane.progress = job.pCrane;
  if (job.pCrane >= 1 && job.phase === 'pick') job.phase = 'carry';
}

export function advanceTransport(world, t, dt) {
  if (!t) return;
  const job = world.jobs.find((j) => j.id === t.jobId);
  if (!job) {
    if (t.jobId) t.jobId = null;
    t.status = 'idle';
    t.t = 0;
    return;
  }
  if (job.phase !== 'carry') {
    t.status = 'loading';
    return;
  }
  t.status = 'moving';
  t.busyTime += dt;
  job.pCarry = Math.min(1, job.pCarry + dt / Math.max(0.01, job.carryTime));
  t.t = job.pCarry;
  t.totalTime = job.carryTime;
  const c = world.containers.find((x) => x.id === job.containerId);
  if (c) {
    c.pos = {
      x: t.a.x + (t.b.x - t.a.x) * job.pCarry,
      y: t.a.y + (t.b.y - t.a.y) * job.pCarry,
      z: 1.4,
    };
  }
  if (job.pCarry >= 1) {
    const cc = world.containers.find((x) => x.id === job.containerId);
    closeJob(world, job);
    if (cc && cc.status === 'yard') recordMetric(world, job);
  }
}

// Araç görsel konumu (lerp) — sahne çizimi için
export function transportVisual(t) {
  return { x: t.a.x + (t.b.x - t.a.x) * t.t, y: t.a.y + (t.b.y - t.a.y) * t.t };
}

export function tick(world, dtMs) {
  if (!world.running) return;
  const dt = (Math.min(dtMs, TICK_CAP_MS) / 1000) * world.speed;
  world.clock += dt;

  for (const crane of world.cranes) advanceCrane(world, crane, dt);
  for (const t of world.transports) advanceTransport(world, t, dt);

  // İşi bitmiş ama aracı boşta kalmış kayıtları temizle
  world.jobs = world.jobs.filter((j) => world.containers.some((c) => c.id === j.containerId));

  dispatchTick(world);
}

export function computeStats(world) {
  const pending = world.containers.filter((c) => c.status === 'ship' || c.status === 'waiting').length;
  const completed = world.metrics.completed;
  const total = world.containers.length;
  const avg = world.metrics.avgTime || 0;
  const remaining = pending;
  const rate = completed > 0 && world.clock > 0 ? completed / world.clock : 0;
  const eta = rate > 0 ? remaining / rate : null;
  const craneAvg =
    world.cranes.length === 0
      ? 0
      : world.cranes.reduce((s, c) => s + (world.clock > 0 ? Math.min(1, c.busyTime / world.clock) : 0), 0) /
        world.cranes.length;
  const trAvg =
    world.transports.length === 0
      ? 0
      : world.transports.reduce((s, t) => s + (world.clock > 0 ? Math.min(1, t.busyTime / world.clock) : 0), 0) /
        world.transports.length;
  const inYard = world.containers.filter((c) => c.status === 'yard').length;
  return {
    pending,
    completed,
    total,
    avg,
    eta,
    craneAvg,
    transportAvg: trAvg,
    inYard,
    moving: world.containers.filter((c) => c.status === 'moving').length,
    waiting: world.containers.filter((c) => c.status === 'waiting').length,
    progress: total > 0 ? (total - pending) / total : 0,
  };
}

export function applyScenario(world, key) {
  world.scenario = key;
  if (key === 'A') {
    for (const c of world.cranes) {
      craneSetOn(c, true);
    }
    world.log.push(`[${world.clock.toFixed(0)}s] Senaryo A: tüm vinçler çalışıyor`);
    dispatchTick(world);
  } else if (key === 'B') {
    const crane = world.cranes[1];
    if (crane) {
      setCraneSwitch(world, crane.id, false);
      world.log.push(`[${world.clock.toFixed(0)}s] Senaryo B: ${crane.id} devre dışı, işler yeniden dağıtıldı`);
    }
  } else if (key === 'C') {
    // D bölgesini doldur (kapasitesine kadar örnek konteyner yerleştirerek)
    const zone = zoneById(world, 'D');
    if (zone) {
      let n = 0;
      for (const c of world.containers) {
        if (zone.free_ === undefined) zone.free_ = true;
        if (n > 80) break;
        if (zone.slots.some((s) => s.containerId === c.id)) continue;
        if (c.status === 'yard' || c.status === 'moving') continue;
        const used = zone.slots.reduce((s, sl) => s + (sl.size === 40 ? 2 : 1), 0);
        if (used + (c.size === 40 ? 2 : 1) > zone.capacity) break;
        zone.slots.push({ containerId: c.id, stack: n % zone.maxStack, size: c.size, weight: c.weight, type: 'dangerous' });
        c.status = 'yard';
        c.targetZone = 'D';
        c.placedAt = world.clock;
        c.pos = { x: zone.gx, y: zone.gy, z: 0 };
        world.queue = world.queue.filter((id) => id !== c.id);
        n++;
      }
      world.log.push(`[${world.clock.toFixed(0)}s] Senaryo C: D bölgesi dolduruldu (${n} konteyner), yeni yükler diğer alanlara yönlendirilecek`);
    }
    dispatchTick(world);
  } else if (key === 'D') {
    pushUrgent(world);
  }
  return world.scenario;
}

export function reassignAll(world) {
  return reassignCraneJobs(world, null);
}
