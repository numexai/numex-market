// Dünya durumu: kurulum, anlık görüntü, geri yükleme
import { DEFAULT_SEED, FLEET_SIZE } from '../config.js';
import { generateFleet } from '../model/container.js';
import { createZones } from '../model/yard.js';
import { createCranes } from '../model/crane.js';
import { createTransports } from '../model/transport.js';
import { sortQueue } from './dispatch.js';

export function createWorld(seed = DEFAULT_SEED) {
  const containers = generateFleet(FLEET_SIZE, seed);
  const world = {
    seed,
    clock: 0,
    running: false,
    speed: 1,
    containers,
    zones: createZones(),
    cranes: createCranes(),
    transports: createTransports(),
    jobs: [],
    queue: containers.map((c) => c.id),
    jobSeq: 0,
    metrics: { completed: 0, totalTime: 0, avgTime: 0, byCrane: {}, byTransport: {} },
    scenario: 'A',
    log: [],
  };
  sortQueue(world);
  return world;
}

export function snapshot(world) {
  return {
    version: 1,
    seed: world.seed,
    clock: world.clock,
    running: false,
    speed: world.speed,
    scenario: world.scenario,
    jobSeq: world.jobSeq,
    containers: world.containers.map((c) => ({ ...c, pos: { ...c.pos } })),
    zones: world.zones.map((z) => ({ ...z, slots: z.slots.map((s) => ({ ...s })) })),
    cranes: world.cranes.map((c) => ({ ...c })),
    transports: world.transports.map((t) => ({ ...t, a: { ...t.a }, b: { ...t.b } })),
    jobs: world.jobs.map((j) => ({ ...j })),
    queue: world.queue.slice(),
    metrics: JSON.parse(JSON.stringify(world.metrics)),
    log: world.log.slice(),
  };
}

export function restoreWorld(data) {
  if (!data || !Array.isArray(data.containers)) throw new Error('Geçersiz proje dosyası');
  const base = createWorld(data.seed != null ? data.seed : DEFAULT_SEED);
  const world = Object.assign(base, {
    seed: data.seed != null ? data.seed : DEFAULT_SEED,
    clock: data.clock || 0,
    running: false,
    speed: data.speed || 1,
    scenario: data.scenario || 'A',
    jobSeq: data.jobSeq || 0,
    containers: data.containers,
    zones: data.zones || base.zones,
    cranes: data.cranes || base.cranes,
    transports: data.transports || base.transports,
    jobs: data.jobs || [],
    queue: data.queue || [],
    metrics: data.metrics || base.metrics,
    log: data.log || [],
  });
  return world;
}

export function resetWorld(world, seed) {
  return createWorld(seed != null ? seed : world.seed);
}
