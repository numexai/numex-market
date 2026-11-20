// Vinç modeli: kapasite ve durum makinesi
import { CRANE_TYPES } from '../config.js';
import { clamp } from '../util.js';

export function createCranes() {
  return CRANE_TYPES.map((c, i) => ({
    id: c.id,
    capTon: c.capTon,
    speed: c.speed,
    on: true,
    status: 'idle', // idle | working | off
    jobId: null,
    progress: 0,
    busyTime: 0,
    totalTime: 1,
    gx: 3 + i * 5.5, // sahne koordinatı (dünya birimi)
    gy: 0.6,
  }));
}

export function craneCanLift(crane, container) {
  return !!container && crane.capTon >= container.weight;
}

export function craneSetOn(crane, on) {
  crane.on = !!on;
  if (!crane.on) {
    crane.status = 'off';
    crane.jobId = null;
    crane.progress = 0;
  } else if (crane.status === 'off') {
    crane.status = 'idle';
  }
}

export function craneUtilization(crane, simTime) {
  if (simTime <= 0) return 0;
  return clamp(crane.busyTime / simTime, 0, 1);
}

export function craneById(world, id) {
  return world.cranes.find((c) => c.id === id) || null;
}
