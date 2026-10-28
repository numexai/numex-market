import * as THREE from 'three';
import type { MaterialKey } from '../data/building';

/**
 * Materyal havuzu — TEK örnek, her yerde tekrar kullanılır.
 * Yeni materyal yaratmak yasak: getMaterial(key) ile alınır.
 */
const cache = new Map<string, THREE.Material>();

function pmremEnv(): THREE.Texture | null {
  return null; // env map sonradan atanır (materials.setEnv)
}

function makeConcrete(color: number, rough: number, tex?: THREE.Texture): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color, roughness: rough, metalness: 0.02, map: tex ?? null, envMapIntensity: 0.55,
  });
}

let concreteTex: THREE.Texture | null = null;
let asphaltTex: THREE.Texture | null = null;
let woodTex: THREE.Texture | null = null;

/** Prosedürel beton dokusu (canvas) — tek seferlik üretim */
function makeConcreteTexture(): THREE.Texture {
  const s = 256;
  const c = document.createElement('canvas');
  c.width = c.height = s;
  const g = c.getContext('2d')!;
  g.fillStyle = '#b9b6b0';
  g.fillRect(0, 0, s, s);
  for (let i = 0; i < 9000; i++) {
    const x = Math.random() * s, y = Math.random() * s;
    const v = Math.random();
    g.fillStyle = `rgba(${v > 0.5 ? 255 : 60},${v > 0.5 ? 255 : 60},${v > 0.5 ? 255 : 60},${0.03 + Math.random() * 0.05})`;
    g.fillRect(x, y, 1 + Math.random() * 2, 1 + Math.random() * 2);
  }
  // ince çatlaklar
  g.strokeStyle = 'rgba(90,88,84,0.12)';
  for (let i = 0; i < 14; i++) {
    g.beginPath();
    let x = Math.random() * s, y = Math.random() * s;
    g.moveTo(x, y);
    for (let k = 0; k < 5; k++) {
      x += (Math.random() - 0.5) * 40;
      y += (Math.random() - 0.5) * 40;
      g.lineTo(x, y);
    }
    g.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(2, 2);
  t.anisotropy = 4;
  return t;
}

function makeAsphaltTexture(): THREE.Texture {
  const s = 256;
  const c = document.createElement('canvas');
  c.width = c.height = s;
  const g = c.getContext('2d')!;
  g.fillStyle = '#3a3c40';
  g.fillRect(0, 0, s, s);
  for (let i = 0; i < 14000; i++) {
    const v = Math.random() * 255;
    g.fillStyle = `rgba(${v},${v},${v},${0.04 + Math.random() * 0.08})`;
    g.fillRect(Math.random() * s, Math.random() * s, 1.5, 1.5);
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(12, 12);
  return t;
}

function makeWoodTexture(): THREE.Texture {
  const s = 256;
  const c = document.createElement('canvas');
  c.width = c.height = s;
  const g = c.getContext('2d')!;
  g.fillStyle = '#a97c4f';
  g.fillRect(0, 0, s, s);
  for (let i = 0; i < 60; i++) {
    g.strokeStyle = `rgba(${80 + Math.random() * 40},${50 + Math.random() * 30},${25 + Math.random() * 20},${0.08 + Math.random() * 0.12})`;
    g.lineWidth = 1 + Math.random() * 2;
    g.beginPath();
    const y0 = Math.random() * s;
    g.moveTo(0, y0);
    for (let x = 0; x <= s; x += 16) {
      g.lineTo(x, y0 + Math.sin(x * 0.05 + i) * 3);
    }
    g.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(2, 2);
  return t;
}

/** Materyal tanımları */
const defs: Record<MaterialKey, () => THREE.Material> = {
  concrete: () => {
    concreteTex ??= makeConcreteTexture();
    return makeConcrete(0xd8d5cf, 0.86, concreteTex);
  },
  concreteDark: () => makeConcrete(0x8b8983, 0.9),
  plaster: () => new THREE.MeshStandardMaterial({ color: 0xefeae2, roughness: 0.94, metalness: 0 }),
  // Cephe camı: yansıtıcı, hafif koyu mavi-yeşil (böylece cephe cam gibi okunur).
  // Transmission kullanılmıyor — WebGL'de transmission arkasındaki nesneleri
  // göstermek için ekstra render hedefi ister ve performansı yarıya indirir.
  glass: () => new THREE.MeshPhysicalMaterial({
    // Normal modda cam daha opak olmalı: 0.28'de bina "iskelet" gibi görünüyordu.
    // Yansıma güçlü, geçirgenlik düşük → gerçek cam cephe okunur.
    // Denge: 0.28 "iskelet" gibi, 0.62 "beyaz panel" gibi görünüyordu.
    // 0.46 + güçlü yansıma → cam cephe okunur, iç mekân silueti de sezilir.
    color: 0x7ea6bc, roughness: 0.04, metalness: 0.42, transparent: true, opacity: 0.46,
    envMapIntensity: 3.0, side: THREE.DoubleSide,
    clearcoat: 1, clearcoatRoughness: 0.02, reflectivity: 1.0,
  }),
  glassDark: () => new THREE.MeshPhysicalMaterial({
    color: 0x2c3a44, roughness: 0.12, metalness: 0.35, transparent: true, opacity: 0.72,
    envMapIntensity: 1.2, side: THREE.DoubleSide,
  }),
  wood: () => {
    woodTex ??= makeWoodTexture();
    return new THREE.MeshStandardMaterial({ color: 0xbf9468, roughness: 0.62, metalness: 0.04, map: woodTex });
  },
  woodDark: () => new THREE.MeshStandardMaterial({ color: 0x5a4030, roughness: 0.55, metalness: 0.05 }),
  metal: () => new THREE.MeshStandardMaterial({ color: 0xa9adb3, roughness: 0.28, metalness: 0.92, envMapIntensity: 1.1 }),
  metalDark: () => new THREE.MeshStandardMaterial({ color: 0x2f3338, roughness: 0.42, metalness: 0.85 }),
  marble: () => new THREE.MeshStandardMaterial({ color: 0xe9e6e1, roughness: 0.2, metalness: 0.06, envMapIntensity: 0.9 }),
  stone: () => new THREE.MeshStandardMaterial({ color: 0x9a9488, roughness: 0.92, metalness: 0.02 }),
  fabric: () => new THREE.MeshStandardMaterial({ color: 0x6f7b88, roughness: 0.98, metalness: 0 }),
  fabricLight: () => new THREE.MeshStandardMaterial({ color: 0xc9c3b8, roughness: 0.98, metalness: 0 }),
  grass: () => new THREE.MeshStandardMaterial({ color: 0x4f7a3f, roughness: 1, metalness: 0 }),
  asphalt: () => {
    asphaltTex ??= makeAsphaltTexture();
    return new THREE.MeshStandardMaterial({ color: 0x55585d, roughness: 0.95, metalness: 0.02, map: asphaltTex });
  },
  foliage: () => new THREE.MeshStandardMaterial({ color: 0x3f6b34, roughness: 0.95, metalness: 0, flatShading: true }),
  foliageDark: () => new THREE.MeshStandardMaterial({ color: 0x2c4f26, roughness: 0.95, metalness: 0, flatShading: true }),
  emissiveWarm: () => new THREE.MeshStandardMaterial({
    color: 0xfff1d6, emissive: 0xffc477, emissiveIntensity: 1.6, roughness: 0.6, metalness: 0,
  }),
  emissiveCool: () => new THREE.MeshStandardMaterial({
    color: 0xe8f4ff, emissive: 0xa8d8ff, emissiveIntensity: 1.2, roughness: 0.4, metalness: 0,
  }),
  water: () => new THREE.MeshPhysicalMaterial({
    color: 0x21657f, roughness: 0.08, metalness: 0.1, transparent: true, opacity: 0.82,
    envMapIntensity: 1.4,
  }),
  ceramic: () => new THREE.MeshStandardMaterial({ color: 0xf7f7f5, roughness: 0.18, metalness: 0.02 }),
  screen: () => new THREE.MeshStandardMaterial({
    color: 0x0b0f14, emissive: 0x1b3b57, emissiveIntensity: 0.7, roughness: 0.2, metalness: 0.4,
  }),
};

export function getMaterial(key: MaterialKey): THREE.Material {
  let m = cache.get(key);
  if (!m) {
    m = defs[key]();
    cache.set(key, m);
  }
  return m;
}

/** Tüm materyal listesi (env map ataması ve x-ray için) */
export function allMaterials(): THREE.Material[] {
  (Object.keys(defs) as MaterialKey[]).forEach((k) => getMaterial(k));
  return [...cache.values()];
}

export function setEnvMap(env: THREE.Texture | null): void {
  allMaterials().forEach((m) => {
    const mm = m as THREE.MeshStandardMaterial;
    if ('envMap' in mm) {
      mm.envMap = env;
      mm.needsUpdate = true;
    }
  });
}

export function disposeMaterials(): void {
  cache.forEach((m) => m.dispose());
  cache.clear();
  concreteTex?.dispose();
  asphaltTex?.dispose();
  woodTex?.dispose();
  concreteTex = asphaltTex = woodTex = null;
}
