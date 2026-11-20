// İş atama döngüsü, yeniden dağıtım, kapanış
import { priorityScore, buildJobPlan, validateAssignment } from './rules.js';
import { placeContainer, zoneById } from '../model/yard.js';
import { craneSetOn } from '../model/crane.js';
import { assignTransport, freeTransport } from '../model/transport.js';
import { TYPES } from '../config.js';

export function enqueue(world, container) {
  if (!world.queue.includes(container.id)) world.queue.push(container.id);
}

export function sortQueue(world) {
  world.queue.sort((a, b) => {
    const ca = world.containers.find((c) => c.id === a);
    const cb = world.containers.find((c) => c.id === b);
    if (!ca) return 1;
    if (!cb) return -1;
    // NUMEX-DÜZELTME: acil yük (urgent) her zaman kuyruk başında kalır,
    // aksi halde her dispatch'te yeniden sıralanıp öne alma kayboluyordu.
    if (!!ca.urgent !== !!cb.urgent) return ca.urgent ? -1 : 1;
    const d = priorityScore(cb, world.clock) - priorityScore(ca, world.clock);
    return d !== 0 ? d : ca.id.localeCompare(cb.id); // deterministik tie-break
  });
}

function newJob(world, container, plan) {
  world.jobSeq = (world.jobSeq || 0) + 1;
  const job = {
    id: 'JOB-' + world.jobSeq,
    containerId: container.id,
    craneId: plan.craneId,
    transportId: plan.transportId,
    zoneId: plan.zoneId,
    phase: 'pick', // pick → carry
    t0: world.clock,
    eta: world.clock + plan.total,
    craneTime: plan.craneTime,
    carryTime: plan.carryTime,
    pCrane: 0,
    pCarry: 0,
  };
  world.jobs.push(job);
  container.jobId = job.id;
  container.assignedCrane = plan.craneId;
  container.assignedTransport = plan.transportId;
  container.status = 'moving';
  container.reason = '';
  const crane = world.cranes.find((c) => c.id === plan.craneId);
  if (crane) {
    crane.jobId = job.id;
    crane.status = 'working';
    crane.progress = 0;
  }
  const tr = world.transports.find((t) => t.id === plan.transportId);
  if (tr) {
    assignTransport(world, tr, { id: job.id, container });
    tr.a = { x: crane ? crane.gx : 0, y: crane ? crane.gy : 0 };
    const z = zoneById(world, plan.zoneId);
    tr.b = { x: z ? z.gx : 0, y: z ? z.gy : 0 };
  }
  container.pos = { x: crane ? crane.gx : 0, y: crane ? crane.gy : 0, z: 1.4 };
  world.log.push(`[${world.clock.toFixed(0)}s] ${container.id} → ${job.id} (${plan.craneId}/${plan.transportId} → ${plan.zoneId})`);
  if (world.log.length > 200) world.log.shift();
  return job;
}

export function dispatchTick(world) {
  sortQueue(world);
  let assigned = 0;
  for (let i = 0; i < world.queue.length; i++) {
    const container = world.containers.find((c) => c.id === world.queue[i]);
    if (!container) continue;
    if (container.jobId || container.status === 'yard' || container.status === 'dispatched') continue;
    const res = buildJobPlan(world, container);
    if (!res.ok) {
      container.reason = res.reason;
      container.status = 'waiting';
      continue;
    }
    const job = newJob(world, container, res.plan);
    const v = validateAssignment(world, job);
    if (!v.ok) {
      // geri al: işi iptal et, konteyneri kuyrukta tut (çift atama olmaz)
      cancelJob(world, job, v.reason);
      container.reason = v.reason;
      container.status = 'waiting';
      continue;
    }
    world.queue.splice(i, 1);
    i--;
    assigned++;
  }
  return assigned;
}

function cancelJob(world, job, reason) {
  const idx = world.jobs.indexOf(job);
  if (idx >= 0) world.jobs.splice(idx, 1);
  const c = world.containers.find((x) => x.id === job.containerId);
  if (c) {
    c.jobId = null;
    c.assignedCrane = null;
    c.assignedTransport = null;
    c.status = 'ship';
    c.reason = reason || '';
  }
  const crane = world.cranes.find((x) => x.id === job.craneId);
  if (crane && crane.jobId === job.id) {
    crane.jobId = null;
    crane.status = crane.on ? 'idle' : 'off';
    crane.progress = 0;
  }
  const tr = world.transports.find((x) => x.id === job.transportId);
  if (tr && tr.jobId === job.id) freeTransport(tr, world.clock);
}

// Senaryo B: arızalı vincin işlerini kuyruğa geri ver, diğer vinçlere dağıt
export function reassignCraneJobs(world, downCraneId) {
  const affected = world.jobs.filter((j) => j.craneId === downCraneId);
  let moved = 0;
  for (const job of affected) {
    const c = world.containers.find((x) => x.id === job.containerId);
    cancelJob(world, job, `${downCraneId} arızası — yeniden planlanıyor`);
    if (c) {
      c.status = 'ship';
      enqueue(world, c);
      moved++;
    }
  }
  if (moved > 0) {
    world.log.push(`[${world.clock.toFixed(0)}s] ${downCraneId} arızası: ${moved} iş yeniden planlanıyor`);
  }
  dispatchTick(world);
  return moved;
}

// Senaryo D: yüksek öncelikli acil konteyner
export function pushUrgent(world, custom) {
  let seq = world.containers.length + 1;
  let id = 'CNT-' + String(seq).padStart(4, '0');
  while (world.containers.some((c) => c.id === id)) {
    seq++;
    id = 'CNT-' + String(seq).padStart(4, '0');
  }
  const c = custom || {
    id,
    size: 20,
    weight: 19.5,
    type: 'general',
    typeLabel: TYPES.general.label,
    priority: 5,
    arrival: world.clock,
    departure: world.clock + 240,
    targetZone: null,
    status: 'ship',
    pos: { x: 0, y: 0, z: 0 },
    assignedCrane: null,
    assignedTransport: null,
    jobId: null,
    placedAt: null,
    releasedAt: null,
    reason: 'ACİL YÜK',
  };
  c.priority = 5;
  c.urgent = true;
  world.containers.push(c);
  world.queue.unshift(c.id); // kuyruk başı
  world.log.push(`[${world.clock.toFixed(0)}s] ACİL YÜK geldi: ${c.id} (öncelik 5)`);
  dispatchTick(world);
  return c;
}

// Teslim: bölgeye yerleştir, araç/vinç serbest
export function closeJob(world, job) {
  const c = world.containers.find((x) => x.id === job.containerId);
  const zone = zoneById(world, job.zoneId);
  const crane = world.cranes.find((x) => x.id === job.craneId);
  const tr = world.transports.find((x) => x.id === job.transportId);

  if (c && zone) {
    const res = placeContainer(zone, c);
    if (res.ok) {
      c.status = 'yard';
      c.placedAt = world.clock;
      c.pos = { x: zone.gx, y: zone.gy + res.slot.stack * 0.35, z: res.slot.stack * 0.9 };
      world.log.push(`[${world.clock.toFixed(0)}s] ${c.id} sahaya yerleşti → ${zone.id}`);
    } else {
      // yer yoksa yanlış yere koymuyoruz: kuyruğa geri döner
      c.status = 'waiting';
      c.reason = res.reason;
      c.jobId = null;
      c.assignedTransport = null;
      c.assignedCrane = null;
      enqueue(world, c);
      world.log.push(`[${world.clock.toFixed(0)}s] ${c.id} beklemeye alındı: ${res.reason}`);
    }
    c.jobId = null;
    c.assignedCrane = null;
    c.assignedTransport = null;
  }
  if (crane && crane.jobId === job.id) {
    crane.jobId = null;
    crane.progress = 0;
    crane.status = crane.on ? 'idle' : 'off';
  }
  if (tr && tr.jobId === job.id) freeTransport(tr, world.clock);

  const i = world.jobs.indexOf(job);
  if (i >= 0) world.jobs.splice(i, 1);
}

export function setCraneSwitch(world, craneId, on) {
  const crane = world.cranes.find((c) => c.id === craneId);
  if (!crane) return;
  craneSetOn(crane, on);
  if (!on) reassignCraneJobs(world, craneId);
}
