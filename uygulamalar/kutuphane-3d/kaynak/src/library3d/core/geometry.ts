import * as THREE from 'three';
import { libMat, type LibMat } from './materials';

/**
 * Kütüphane geometri yardımcıları.
 *
 * Ölçü önbelleği: aynı kutu ölçüsü ikinci kez üretilmez → GPU belleği sabit
 * kalır, InstancedMesh içinde de aynı geometri paylaşılır.
 */

const boxCache = new Map<string, THREE.BoxGeometry>();

export function libBox(w: number, h: number, d: number): THREE.BoxGeometry {
  const key = `${w.toFixed(2)}|${h.toFixed(2)}|${d.toFixed(2)}`;
  let g = boxCache.get(key);
  if (!g) {
    g = new THREE.BoxGeometry(w, h, d);
    boxCache.set(key, g);
  }
  return g;
}

const cylCache = new Map<string, THREE.CylinderGeometry>();

export function libCyl(rt: number, rb: number, h: number, seg = 12): THREE.CylinderGeometry {
  const key = `${rt.toFixed(2)}|${rb.toFixed(2)}|${h.toFixed(2)}|${seg}`;
  let g = cylCache.get(key);
  if (!g) {
    g = new THREE.CylinderGeometry(rt, rb, h, seg);
    cylCache.set(key, g);
  }
  return g;
}

export interface LibBoxOpts {
  pos?: [number, number, number];
  rotY?: number;
  rotX?: number;
  rotZ?: number;
  cast?: boolean;
  receive?: boolean;
  name?: string;
}

export function libMakeBox(
  w: number, h: number, d: number, mat: LibMat, opts: LibBoxOpts = {},
): THREE.Mesh {
  const m = new THREE.Mesh(libBox(w, h, d), libMat(mat));
  const [x, y, z] = opts.pos ?? [0, 0, 0];
  m.position.set(x, y, z);
  if (opts.rotY) m.rotation.y = opts.rotY;
  if (opts.rotX) m.rotation.x = opts.rotX;
  if (opts.rotZ) m.rotation.z = opts.rotZ;
  m.castShadow = opts.cast ?? true;
  m.receiveShadow = opts.receive ?? true;
  if (opts.name) m.name = opts.name;
  return m;
}

/** Dikey silindir (lamba direği, ağaç gövdesi, ayak) */
export function libMakeCyl(
  rt: number, rb: number, h: number, mat: LibMat, opts: LibBoxOpts & { seg?: number } = {},
): THREE.Mesh {
  const m = new THREE.Mesh(libCyl(rt, rb, h, opts.seg ?? 10), libMat(mat));
  const [x, y, z] = opts.pos ?? [0, 0, 0];
  m.position.set(x, y, z);
  if (opts.rotY) m.rotation.y = opts.rotY;
  m.castShadow = opts.cast ?? true;
  m.receiveShadow = opts.receive ?? true;
  return m;
}

/**
 * Duvar üretimi — iki nokta arası. Kütüphanenin tüm duvarları bundan geçer:
 * ölçü, kalınlık ve yükseklik tek yerden yönetilir.
 */
export function libMakeWall(
  x1: number, z1: number, x2: number, z2: number,
  height: number, thickness: number, mat: LibMat, y = 0,
): THREE.Mesh {
  const dx = x2 - x1, dz = z2 - z1;
  const len = Math.hypot(dx, dz);
  const angle = Math.atan2(dz, dx);
  return libMakeBox(len, height, thickness, mat, {
    pos: [(x1 + x2) / 2, y + height / 2, (z1 + z2) / 2],
    rotY: -angle,
  });
}

/** Işıksız (emissive) ince panel — tavan armatürü, çalışma lambası başlığı */
export function libLampPanel(w: number, h: number, d: number, pos: [number, number, number]): THREE.Mesh {
  return libMakeBox(w, h, d, 'lampWarm', { pos, cast: false, receive: false });
}

export function disposeLibGeometryCaches(): void {
  boxCache.forEach((g) => g.dispose());
  boxCache.clear();
  cylCache.forEach((g) => g.dispose());
  cylCache.clear();
}
