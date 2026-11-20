// Kural motoru — saf fonksiyonlar, yan etkisiz.
import { craneCanLift } from '../model/crane.js';
import { transportCanCarry, transportIsFree } from '../model/transport.js';
import { zoneAccepts, zoneHasCapacity, stackAllowed, zoneUsed } from '../model/yard.js';
import { DURATIONS, HEAVY_TON } from '../config.js';

// Öncelik puanı: öncelik (1..5) + bekleme cezası + ağırlık hafifletmesi
export function priorityScore(container, now = 0) {
  const wait = Math.max(0, now - (container.arrival || 0));
  const waitBonus = Math.min(wait / 20, 6); // bekleyen iş öne alınır
  return container.priority * 10 + waitBonus + (container.size === 40 ? 1.5 : 0);
}

// Açık + kapasitesi yeten + en az yüklü vinç
export function pickCandidateCrane(world, container) {
  const open = world.cranes.filter((c) => c.on && c.status === 'idle' && !c.jobId);
  const able = open.filter((c) => craneCanLift(c, container));
  if (able.length === 0) return null;
  able.sort((a, b) => a.busyTime - b.busyTime || a.id.localeCompare(b.id));
  return able[0];
}

// Boş + ağırlığı taşıyabilen saha aracı
export function pickCandidateTransport(world, container) {
  const free = world.transports.filter((t) => transportIsFree(t) && transportCanCarry(t, container));
  if (free.length === 0) return null;
  free.sort((a, b) => a.busyTime - b.busyTime || a.id.localeCompare(b.id));
  return free[0];
}

// Hedef bölge: tür zorunluluğu > kapasite > istif güvenliği > doluluk dengesi
export function pickTargetZone(world, container) {
  const candidates = world.zones.slice().sort((a, b) => a.id.localeCompare(b.id));
  const preferred = [];
  const fallback = [];
  for (const z of candidates) {
    const acc = zoneAccepts(z, container);
    if (!acc.ok) continue;
    if (!zoneHasCapacity(z, container)) {
      fallback.push({ zone: z, reason: 'kapasite yok' });
      continue;
    }
    const st = stackAllowed(z, container);
    if (!st.ok) {
      fallback.push({ zone: z, reason: st.reason });
      continue;
    }
    const explicit = container.targetZone === z.id;
    preferred.push({ zone: z, explicit, fill: zoneUsed(z) / z.capacity });
  }
  if (preferred.length === 0) return null;
  preferred.sort((a, b) => {
    if (a.explicit !== b.explicit) return a.explicit ? -1 : 1;
    if (a.fill !== b.fill) return a.fill - b.fill; // en boş bölgeye yönlendir
    return a.zone.id.localeCompare(b.zone.id);
  });
  return { zone: preferred[0].zone, reason: preferred[0].explicit ? 'hedef bölge' : 'en uygun boş bölge' };
}

// Atama geçerliliği (dispatch öncesi son kontrol)
export function validateAssignment(world, job) {
  const c = world.containers.find((x) => x.id === job.containerId);
  if (!c) return { ok: false, reason: 'konteyner yok' };
  const crane = world.cranes.find((x) => x.id === job.craneId);
  if (!crane) return { ok: false, reason: 'vinç yok' };
  if (!crane.on) return { ok: false, reason: `${crane.id} devre dışı` };
  if (!craneCanLift(crane, c)) {
    return { ok: false, reason: `${crane.id} kapasitesi yetersiz (${crane.capTon}t < ${c.weight}t)` };
  }
  const tr = world.transports.find((x) => x.id === job.transportId);
  if (!tr) return { ok: false, reason: 'araç yok' };
  if (!transportCanCarry(tr, c)) {
    return { ok: false, reason: `${tr.id} taşıma kapasitesi yetersiz` };
  }
  if (c.assignedCrane && c.assignedCrane !== crane.id) {
    return { ok: false, reason: 'konteyner başka vince atanmış' };
  }
  if (c.assignedTransport && c.assignedTransport !== tr.id) {
    return { ok: false, reason: 'konteyner başka araca atanmış (çift atama)' };
  }
  if (c.jobId && c.jobId !== job.id) {
    return { ok: false, reason: 'konteynerin aktif işi var (çift atama)' };
  }
  return { ok: true, reason: '' };
}

// Vinç + araç sürelerini ağırlık/boyut/mesafeye göre hesapla
export function estimateDurations(container, crane, transport, distance) {
  const pick =
    DURATIONS.cranePickBase +
    container.weight * DURATIONS.cranePerTon +
    (container.size === 40 ? DURATIONS.cranePer40 : 0);
  const craneTime = Math.max(DURATIONS.minJobTime, pick / (crane ? crane.speed : 1));
  const carry = Math.max(
    DURATIONS.minJobTime,
    (DURATIONS.transportBase + distance * DURATIONS.transportDistance) / (transport ? transport.speed : 1)
  );
  return { craneTime, carryTime: carry, total: craneTime + carry };
}

export function buildJobPlan(world, container) {
  // NUMEX-DÜZELTME: 'boş vinç yok' ile 'kapasite yetersiz' ayrıldı.
  // Önce kapasitesi yeten AÇIK vinç var mı diye bakılır; yoksa bu kalıcı bir
  // engeldir. Boşta olan yoksa ama vinçler meşgulse iş sırada bekler.
  const openCranes = world.cranes.filter((c) => c.on && craneCanLift(c, container));
  if (openCranes.length === 0) {
    return { ok: false, reason: `Hiçbir açık vinç ${container.weight}t kaldıramıyor` };
  }
  const crane = pickCandidateCrane(world, container);
  if (!crane) return { ok: false, reason: 'Tüm vinçler meşgul — sırada bekliyor' };
  const transport = pickCandidateTransport(world, container);
  if (!transport) {
    const anyFree = world.transports.some((t) => transportIsFree(t));
    return {
      ok: false,
      reason: anyFree ? 'Boş saha aracının kapasitesi yetersiz' : 'Boş saha aracı yok',
    };
  }
  const target = pickTargetZone(world, container);
  if (!target) return { ok: false, reason: 'Uygun depolama bölgesi yok' };

  const isHeavyRail = container.weight >= HEAVY_TON;
  const distance = 6 + target.zone.gx * 0.35;
  const d = estimateDurations(container, crane, transport, distance);
  return {
    ok: true,
    plan: {
      craneId: crane.id,
      transportId: transport.id,
      zoneId: target.zone.id,
      targetReason: target.reason,
      distance,
      heavyRail: isHeavyRail,
      craneTime: d.craneTime,
      carryTime: d.carryTime,
      total: d.total,
    },
    reason: '',
  };
}
