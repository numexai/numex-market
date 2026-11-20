// Konteyner veri modeli + 60'lık filo üretimi (deterministik)
import { TYPES, FLEET_SIZE } from '../config.js';
import { mulberry32, uid, pick, round } from '../util.js';

export function containerKinds() {
  return {
    // ağırlıklar ton
    sizePool: [20, 20, 20, 40, 40],
    weight: { 20: [8, 28], 40: [10, 32] },
    typePool: ['general', 'general', 'general', 'reefer', 'dangerous', 'heavy', 'empty'],
    priorityPool: [1, 1, 2, 2, 2, 3, 3, 4, 5],
  };
}

export function makeContainer(id, rng) {
  const k = containerKinds();
  const size = pick(rng, k.sizePool);
  const type = pick(rng, k.typePool);
  const [lo, hi] = k.weight[size];
  let weight = round(lo + rng() * (hi - lo), 1);
  if (type === 'heavy') weight = round(Math.max(25, weight), 1);
  if (type === 'empty') weight = round(3 + rng() * 2, 1);
  const priority = pick(rng, k.priorityPool);
  const arrival = round(rng() * 240, 1);
  return {
    id,
    size,
    weight,
    type,
    typeLabel: TYPES[type].label,
    priority,
    arrival,
    departure: round(arrival + 600 + rng() * 900, 1),
    targetZone: null,
    status: 'ship',
    pos: { x: 0, y: 0, z: 0 },
    assignedCrane: null,
    assignedTransport: null,
    jobId: null,
    placedAt: null,
    releasedAt: null,
    reason: '',
  };
}

export function targetZoneFor(type) {
  if (type === 'dangerous') return 'D';
  if (type === 'reefer') return 'C';
  if (type === 'heavy') return 'E';
  return null; // genel/boş → genel bölgelerden boş olan
}

export function generateFleet(count = FLEET_SIZE, seed = 42) {
  const rng = mulberry32(seed);
  const list = [];
  for (let i = 1; i <= count; i++) {
    const c = makeContainer(uid('CNT', i), rng);
    c.targetZone = targetZoneFor(c.type);
    list.push(c);
  }
  return list;
}

export function containerById(world, id) {
  return world.containers.find((c) => c.id === id) || null;
}
