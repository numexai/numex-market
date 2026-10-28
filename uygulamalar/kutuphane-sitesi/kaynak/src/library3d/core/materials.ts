import * as THREE from 'three';

/**
 * Kütüphane malzeme havuzu — TEK örnek, her yerde paylaşılır.
 *
 * Mevcut binanın materyallerine (src/core/materials.ts) DOKUNULMAZ; kütüphane
 * kendi paletini kurar. Paylaşım performans için zorunlu: aynı ahşabı 300 kez
 * yeni MeshStandardMaterial ile yaratmak 300 ayrı shader derlemesi demektir.
 */

export type LibMat =
  | 'wallLight' | 'wallWarm' | 'concrete' | 'plinth' | 'floorStone' | 'floorWood'
  | 'ceiling' | 'glass' | 'frame' | 'metal' | 'metalDark' | 'wood' | 'woodDark'
  | 'shelf' | 'desk' | 'fabric' | 'fabricDark' | 'grass' | 'path' | 'grave'
  | 'foliage' | 'foliageDark' | 'trunk' | 'lampWarm' | 'screen' | 'screenOff'
  | 'counter' | 'paper' | 'rail' | 'bookSpine' | 'sign';

const cache = new Map<LibMat, THREE.Material>();

function std(
  color: number,
  roughness: number,
  metalness = 0,
  extra: Partial<THREE.MeshStandardMaterialParameters> = {},
): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness, ...extra });
}

const defs: Record<LibMat, () => THREE.Material> = {
  wallLight: () => std(0xf2efe8, 0.92),
  wallWarm: () => std(0xe4d9c8, 0.94),
  concrete: () => std(0xc8c4bc, 0.9),
  plinth: () => std(0x8f8b84, 0.95),
  floorStone: () => std(0xd9d5cc, 0.55),
  floorWood: () => std(0xb98b5c, 0.6),
  ceiling: () => std(0xf7f5f1, 0.95),
  // NUMEX-DÜZELTME (2026-10-26): cam, iç mekândan bakıldığında SÜT BEYAZ
  // opak bir yüzey gibi görünüyordu; dışarısı (ağaçlar, yol, gökyüzü) hiç
  // görünmüyordu. Kök neden: envMapIntensity 2.2 + metalness 0.35 + clearcoat
  // kombinasyonu — ortam haritası olmadığında bu ayarlar yüzeyi ortam rengiyle
  // doldurup opaklaştırıyor. Gerçek cam davranışı için opaklık düşürüldü,
  // metalness kaldırıldı ve yansıma ölçülü tutuldu. Ayrıca cam artık
  // derinlik yazmıyor (depthWrite:false) → arkadaki bahçe doğru sıralanır.
  glass: () => new THREE.MeshPhysicalMaterial({
    color: 0xcfe3ef, roughness: 0.06, metalness: 0,
    transparent: true, opacity: 0.14, side: THREE.DoubleSide,
    clearcoat: 0.6, clearcoatRoughness: 0.08, reflectivity: 0.35,
    envMapIntensity: 0.6, depthWrite: false,
  }),
  frame: () => std(0x3a3f45, 0.42, 0.7),
  metal: () => std(0xa9adb3, 0.3, 0.9),
  metalDark: () => std(0x2c3137, 0.45, 0.75),
  wood: () => std(0xb08050, 0.62),
  woodDark: () => std(0x6b4a32, 0.6),
  shelf: () => std(0x8a6540, 0.68),
  desk: () => std(0xc9a06a, 0.55),
  fabric: () => std(0x40566b, 0.95),
  fabricDark: () => std(0x2b3a47, 0.95),
  grass: () => std(0x4c7440, 1),
  path: () => std(0xb9b2a4, 0.9),
  grave: () => std(0x9c968c, 0.95),
  foliage: () => std(0x3d6b33, 0.95, 0, { flatShading: true }),
  foliageDark: () => std(0x2b5224, 0.95, 0, { flatShading: true }),
  trunk: () => std(0x5d4630, 0.9),
  lampWarm: () => std(0xfff4dc, 0.5, 0, { emissive: 0xffcf8f, emissiveIntensity: 1.8 }),
  screen: () => std(0x0d1218, 0.2, 0.4, { emissive: 0x1d4a6b, emissiveIntensity: 0.85 }),
  screenOff: () => std(0x11161b, 0.3, 0.35),
  counter: () => std(0xa8825a, 0.5),
  paper: () => std(0xf3efe4, 0.95),
  rail: () => std(0x9aa0a6, 0.25, 0.85),
  bookSpine: () => std(0xffffff, 0.86),
  sign: () => std(0x1f2933, 0.6, 0.2),
};

export function libMat(key: LibMat): THREE.Material {
  let m = cache.get(key);
  if (!m) {
    m = defs[key]();
    cache.set(key, m);
  }
  return m;
}

export function allLibMaterials(): THREE.Material[] {
  (Object.keys(defs) as LibMat[]).forEach(libMat);
  return [...cache.values()];
}

export function disposeLibMaterials(): void {
  cache.forEach((m) => m.dispose());
  cache.clear();
}
