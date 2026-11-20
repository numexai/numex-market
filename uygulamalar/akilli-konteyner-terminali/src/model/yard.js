// Depolama bölgeleri: kapasite, istif güvenliği, tehlikeli yük ayrımı
import { ZONE_TYPES, TYPES, HEAVY_TON, DG_TON_LIMIT } from '../config.js';
import { clamp } from '../util.js';

export function createZones() {
  return ZONE_TYPES.map((z) => ({
    id: z.id,
    label: z.label,
    capacity: z.capacity,
    maxStack: z.maxStack,
    dgOk: z.dgOk,
    reeferOk: z.reeferOk,
    gx: z.x,
    gy: z.y,
    color: TYPES.general.color,
    slots: [], // { containerId, stack, size, weight, type }
  }));
}

export function zoneUsed(zone) {
  // 40 ayak konteyner 2 slot kaplar (basitleştirilmiş TEU yerleşimi)
  return zone.slots.reduce((s, sl) => s + (sl.size === 40 ? 2 : 1), 0);
}

export function zoneFill(zone) {
  return zone.capacity === 0 ? 1 : clamp(zoneUsed(zone) / zone.capacity, 0, 1);
}

export function zoneHasCapacity(zone, container) {
  const need = container ? (container.size === 40 ? 2 : 1) : 1;
  return zoneUsed(zone) + need <= zone.capacity;
}

// Bir bölge bu konteyneri tür olarak kabul eder mi?
export function zoneAccepts(zone, container) {
  const t = TYPES[container.type];
  if (t.dg && !zone.dgOk) {
    return { ok: false, reason: 'Tehlikeli yük yalnız D bölgesine girebilir' };
  }
  if (t.dg && container.weight > DG_TON_LIMIT) {
    return { ok: false, reason: `DG ağırlık sınırı ${DG_TON_LIMIT}t aşılıyor` };
  }
  if (t.reefer && !zone.reeferOk) {
    return { ok: false, reason: 'Soğutmalı yük yalnız C bölgesine girebilir' };
  }
  if (!t.dg && zone.dgOk) {
    return { ok: false, reason: 'D bölgesi yalnız tehlikeli yüke ayrılmıştır' };
  }
  if (t.reefer && container.size === 40 && zone.maxStack < 2) {
    return { ok: false, reason: 'Reefer 40 ft için bölge uygun değil' };
  }
  return { ok: true, reason: '' };
}

// İstif güvenlik kuralı (eğitim amaçlı, basitleştirilmiş):
// ağır konteyner (>= HEAVY_TON) üstüne hiçbir şey konmaz; hafif yük ağır yükün üstüne konmaz.
export function stackAllowed(zone, container) {
  if (zone.slots.length === 0) return { ok: true, reason: '' };
  // NUMEX-DÜZELTME (2026-11-20): İlk konteynerde bile ağırlık karşılaştırması yapılıyordu: bölgeye yeni bir konteyner konurken 'below' yanlış eşleşiyor ve tüm yerleştirmeler reddediliyordu (sahada 0 kalıyordu). Ayrıca her istekte istif yüksekliği hesabı bozuktu; kat sayısı doğru sayılıyor.
  // Aynı bölgede katman sayısı: en yüksek istif + 1
  const nextStack = Math.max(...zone.slots.map((s) => s.stack)) + 1;
  if (nextStack >= zone.maxStack) {
    return { ok: false, reason: `İstif sınırı (${zone.maxStack}) dolu` };
  }
  // Doğrudan altındaki katman (varsa) güvenlik kontrolü
  const below = zone.slots.filter((s) => s.stack === nextStack - 1);
  const heaviestBelow = below.reduce((m, s) => Math.max(m, s.weight), 0);
  if (below.length > 0 && heaviestBelow >= HEAVY_TON) {
    return { ok: false, reason: 'Ağır konteynerin üstüne yük konmaz (güvenlik kuralı)' };
  }
  if (below.length > 0 && container.weight > heaviestBelow + 2) {
    return { ok: false, reason: 'Ağırdan hafif istif kuralı: üstteki yük daha ağır olamaz' };
  }
  return { ok: true, reason: '' };
}

export function placeContainer(zone, container) {
  if (!zoneHasCapacity(zone, container)) {
    return { ok: false, reason: `${zone.label} kapasitesi dolu (${zoneUsed(zone)}/${zone.capacity})` };
  }
  const st = stackAllowed(zone, container);
  if (!st.ok) return { ok: false, reason: st.reason };
  const stack = zone.slots.length === 0 ? 0 : Math.max(...zone.slots.map((s) => s.stack)) + 1;
  const slot = {
    containerId: container.id,
    stack,
    size: container.size,
    weight: container.weight,
    type: container.type,
  };
  zone.slots.push(slot);
  container.targetZone = zone.id;
  container.reason = '';
  return { ok: true, slot, reason: '' };
}

export function releaseSlot(zone, container) {
  const i = zone.slots.findIndex((s) => s.containerId === container.id);
  if (i >= 0) zone.slots.splice(i, 1);
}

export function zoneById(world, id) {
  return world.zones.find((z) => z.id === id) || null;
}
