// Saha taşıma araçları: atama / serbest bırakma (çift atama yasağı)
import { TRANSPORT_TYPES } from '../config.js';
import { clamp } from '../util.js';

export function createTransports() {
  return TRANSPORT_TYPES.map((t, i) => ({
    id: t.id,
    capTon: t.capTon,
    speed: t.speed,
    status: 'idle', // idle | moving | loading
    jobId: null,
    busyTime: 0,
    totalTime: 1,
    t: 0,
    a: { x: 0, y: 0 },
    b: { x: 0, y: 0 },
    gx: 2 + i * 2.2,
    gy: 4.6,
  }));
}

export function transportIsFree(t) {
  return !t.jobId && t.status === 'idle';
}

export function transportCanCarry(t, container) {
  return !!container && t.capTon >= container.weight;
}

export function assignTransport(world, transport, job) {
  if (!transportIsFree(transport)) return false; // çift atama yasağı
  if (!transportCanCarry(transport, job.container)) return false;
  transport.jobId = job.id;
  transport.status = 'loading';
  transport.t = 0;
  return true;
}

export function freeTransport(transport, clock) {
  transport.jobId = null;
  transport.status = 'idle';
  transport.t = 0;
  transport.totalTime = Math.max(1, transport.totalTime);
  void clock;
}

export function transportUtilization(t, simTime) {
  if (simTime <= 0) return 0;
  return clamp(t.busyTime / simTime, 0, 1);
}

export function transportById(world, id) {
  return world.transports.find((t) => t.id === id) || null;
}
