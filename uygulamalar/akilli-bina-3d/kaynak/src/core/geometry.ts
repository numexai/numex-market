import * as THREE from 'three';
import type { MaterialKey, SystemLayer } from '../data/building';
import { getMaterial } from './materials';

/** Tıklanabilir nesne meta verisi */
export interface PickMeta {
  kind: 'apartment' | 'room' | 'door' | 'light' | 'window' | 'elevator' | 'floor' | 'material' | 'furniture' | 'system';
  id: string;
  label: string;
  floorId?: string;
  apartmentId?: string;
  roomId?: string;
  area?: number;
  materialKey?: MaterialKey;
  /** X-Ray katmanı — bu parça hangi teknik sisteme ait */
  layer?: SystemLayer;
  /** Ekstra bilgi satırları */
  info?: Array<[string, string]>;
}

export interface BuildContext {
  /** Bu parçanın bağlı olduğu kat (exploded view bunu kullanır) */
  floorId?: string;
  apartmentId?: string;
  roomId?: string;
  /** Tıklanabilir meta */
  meta?: PickMeta;
  /** Gölge al/verme */
  castShadow?: boolean;
  receiveShadow?: boolean;
  /** Oyuncu (insan) çarpışmasını engeller mi */
  collider?: boolean;
  /** X-Ray katmanı */
  layer?: SystemLayer;
  /** Nesne adı — adlandırılmış (seçilemeyen) yapısal parçalar için */
  name?: string;
}

let uid = 0;
export function nextId(prefix = 'obj'): string {
  return `${prefix}-${(++uid).toString(36)}`;
}

/** Ortak BoxGeometry önbelleği — aynı ölçüde kutu tekrar üretilmez */
const boxCache = new Map<string, THREE.BoxGeometry>();
export function boxGeometry(w: number, h: number, d: number): THREE.BoxGeometry {
  const key = `${w.toFixed(3)}|${h.toFixed(3)}|${d.toFixed(3)}`;
  let g = boxCache.get(key);
  if (!g) {
    g = new THREE.BoxGeometry(w, h, d);
    boxCache.set(key, g);
  }
  return g;
}

const cylinderCache = new Map<string, THREE.CylinderGeometry>();
export function cylinderGeometry(rt: number, rb: number, h: number, seg = 12): THREE.CylinderGeometry {
  const key = `${rt.toFixed(3)}|${rb.toFixed(3)}|${h.toFixed(3)}|${seg}`;
  let g = cylinderCache.get(key);
  if (!g) {
    g = new THREE.CylinderGeometry(rt, rb, h, seg);
    cylinderCache.set(key, g);
  }
  return g;
}

export function disposeGeometryCaches(): void {
  boxCache.forEach((g) => g.dispose());
  boxCache.clear();
  cylinderCache.forEach((g) => g.dispose());
  cylinderCache.clear();
}

export interface BoxOpts extends BuildContext {
  pos?: [number, number, number];
  rotY?: number;
  rotX?: number;
  rotZ?: number;
  /** Tıklanabilir */
  pickable?: boolean;
  /** Nesne adı (koridor/merdiven gibi seçilemeyen parçalar için) */
  name?: string;
}

/** Kutu parça */
export function makeBox(
  w: number, h: number, d: number, matKey: MaterialKey, opts: BoxOpts = {},
): THREE.Mesh {
  const mesh = new THREE.Mesh(boxGeometry(w, h, d), getMaterial(matKey));
  const [x, y, z] = opts.pos ?? [0, 0, 0];
  mesh.position.set(x, y, z);
  if (opts.rotY) mesh.rotation.y = opts.rotY;
  if (opts.rotX) mesh.rotation.x = opts.rotX;
  if (opts.rotZ) mesh.rotation.z = opts.rotZ;
  mesh.castShadow = opts.castShadow ?? true;
  mesh.receiveShadow = opts.receiveShadow ?? true;
  mesh.name = opts.name ?? nextId('box');
  (mesh.userData as any).ctx = opts;
  if (opts.meta) (mesh.userData as any).meta = opts.meta;
  return mesh;
}

/** Silindir parça */
export function makeCyl(
  rt: number, rb: number, h: number, matKey: MaterialKey, opts: BoxOpts & { seg?: number } = {},
): THREE.Mesh {
  const mesh = new THREE.Mesh(cylinderGeometry(rt, rb, h, opts.seg ?? 12), getMaterial(matKey));
  const [x, y, z] = opts.pos ?? [0, 0, 0];
  mesh.position.set(x, y, z);
  if (opts.rotY) mesh.rotation.y = opts.rotY;
  if (opts.rotX) mesh.rotation.x = opts.rotX;
  if (opts.rotZ) mesh.rotation.z = opts.rotZ;
  mesh.castShadow = opts.castShadow ?? true;
  mesh.receiveShadow = opts.receiveShadow ?? true;
  mesh.name = opts.name ?? nextId('cyl');
  (mesh.userData as any).ctx = opts;
  if (opts.meta) (mesh.userData as any).meta = opts.meta;
  return mesh;
}

/** Işık yayan yüzey (lamba) */
export function makeLamp(x: number, y: number, z: number, size = 0.5, floorId?: string, roomId?: string): THREE.Mesh {
  const m = makeBox(size, 0.06, size, 'emissiveWarm', {
    pos: [x, y, z], floorId, roomId, castShadow: false,
    meta: {
      kind: 'light', id: `light-${floorId ?? 'x'}-${roomId ?? ''}-${Math.round(x * 10)}-${Math.round(z * 10)}`,
      label: 'Aydınlatma Armatürü', floorId, info: [['Tip', 'LED panel / spot'], ['Güç (temsili)', '12 W']],
    },
  });
  m.name = 'lamp';
  return m;
}

/** Duvar üret: iki nokta arası, verilen kalınlık/yükseklik */
export function makeWall(
  x1: number, z1: number, x2: number, z2: number,
  height: number, thickness: number, matKey: MaterialKey, opts: BuildContext = {},
): THREE.Mesh {
  const dx = x2 - x1, dz = z2 - z1;
  const len = Math.hypot(dx, dz);
  const angle = Math.atan2(dz, dx);
  const mesh = makeBox(len, height, thickness, matKey, {
    ...opts,
    pos: [(x1 + x2) / 2, height / 2, (z1 + z2) / 2],
    rotY: -angle,
    castShadow: opts.castShadow ?? true,
    receiveShadow: true,
  });
  mesh.name = nextId('wall');
  mesh.userData.wallLength = len;
  return mesh;
}

/** Grup içindeki tüm mesh'lere meta ekle */
export function tagGroup(group: THREE.Object3D, meta: PickMeta, ctx: Partial<BuildContext> = {}): void {
  group.traverse((o) => {
    if ((o as THREE.Mesh).isMesh) {
      (o.userData as any).meta = { ...meta, ...((o.userData as any).meta ?? {}) };
      const c = (o.userData as any).ctx ?? {};
      (o.userData as any).ctx = { ...c, ...ctx, floorId: ctx.floorId ?? meta.floorId };
    }
  });
}

/** Sahne temizliği: grubu at ve geometri/materyalleri elden çıkar (önbellektekiler hariç) */
export function disposeObject(root: THREE.Object3D): void {
  root.traverse((o) => {
    const m = o as THREE.Mesh;
    if (m.isMesh && m.geometry) {
      // önbellekteki paylaşılan geometrileri silme
      const cached = [...boxCache.values(), ...cylinderCache.values()];
      if (!cached.includes(m.geometry as THREE.BoxGeometry & THREE.CylinderGeometry)) m.geometry.dispose();
    }
    if ((o as any).isInstancedMesh) (o as any).dispose?.();
  });
}
