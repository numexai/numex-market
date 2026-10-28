import * as THREE from 'three';
import { APARTMENTS, APARTMENT_QUADRANTS, HERO_APARTMENT_ID, type ApartmentDef } from '../data/building';
import { getMaterial } from '../core/materials';
import { tagGroup } from '../core/geometry';

/**
 * Diğer daireler — performans için basitleştirilmiş + InstancedMesh.
 * Örnek daire (K1-D1) tam detaylı; diğerleri blok mobilya silüetleriyle
 * "boş kutu" görünmesin diye temel eşyalarla donatılır.
 * Her daire grubu `floorId` + `apartmentId` taşır → ayrıştırma ve seçim çalışır.
 */

interface InstanceBatch {
  geo: THREE.BufferGeometry;
  matKey: string;
  matrices: THREE.Matrix4[];
}

const batches = new Map<string, InstanceBatch>();

function pushInstance(key: string, geo: THREE.BufferGeometry, matKey: string, m: THREE.Matrix4): void {
  let b = batches.get(key);
  if (!b) {
    b = { geo, matKey, matrices: [] };
    batches.set(key, b);
  }
  b.matrices.push(m.clone());
}

export function buildSimplifiedApartments(): {
  groups: THREE.Group[];
  meshes: THREE.InstancedMesh[];
} {
  const groups: THREE.Group[] = [];
  batches.clear();

  const otherApts = APARTMENTS.filter((a) => a.id !== HERO_APARTMENT_ID);

  for (const apt of otherApts) {
    const g = new THREE.Group();
    const q = APARTMENT_QUADRANTS[apt.quadrant];
    g.position.set(q.x, 0, q.z);
    g.name = `apt-${apt.id}`;
    g.userData.apartmentId = apt.id;
    g.userData.floorId = apt.floorId;
    (g.userData as any).meta = {
      kind: 'apartment', id: apt.id, label: `${apt.no} — ${apt.type}`, floorId: apt.floorId,
      apartmentId: apt.id, area: apt.area,
    };

    // daire plan bölmeleri: 4 oda duvarı
    addPartitionWalls(g, apt);
    // temel mobilya silüetleri (instanced)
    addFurnitureInstances(g, apt);

    tagGroup(g, {
      kind: 'apartment', id: apt.id, label: `${apt.no} — ${apt.type}`, floorId: apt.floorId,
      apartmentId: apt.id, area: apt.area,
      info: [
        ['Tip', apt.type], ['Brüt alan', `${apt.area} m²`], ['Net alan', `${apt.netArea} m²`],
        ['Oda sayısı', `${apt.rooms.length}`], ['Balkon', apt.balcony ? 'Var' : 'Yok'],
        ['Not', 'Bu daire temsilî donatılmıştır'],
      ],
    }, { floorId: apt.floorId, apartmentId: apt.id });

    groups.push(g);
  }

  // Batch'leri InstancedMesh'e çevir
  const meshes: THREE.InstancedMesh[] = [];
  batches.forEach((b) => {
    if (b.matrices.length === 0) return;
    const im = new THREE.InstancedMesh(b.geo, getMaterial(b.matKey as any), b.matrices.length);
    b.matrices.forEach((m, i) => im.setMatrixAt(i, m));
    im.instanceMatrix.needsUpdate = true;
    im.castShadow = true;
    im.receiveShadow = true;
    im.name = `instanced-${b.matKey}`;
    meshes.push(im);
  });

  return { groups, meshes };
}

function addPartitionWalls(g: THREE.Group, apt: ApartmentDef): void {
  // 12 x 10.5 daire planı içinde 4 oda
  const H = 2.85, T = 0.12;
  const walls: Array<[number, number, number, number]> = [
    [-2, -5.1, -2, 5.1], // dikey ayırıcı
    [-6, 0.9, 6, 0.9], // yatay ayırıcı
    [-6, -1.6, -2, -1.6], // banyo
    [1.9, -5.1, 1.9, -1.6], // mutfak/banyo
  ];
  for (const [x1, z1, x2, z2] of walls) {
    const dx = x2 - x1, dz = z2 - z1;
    const len = Math.hypot(dx, dz);
    const angle = Math.atan2(dz, dx);
    const geo = new THREE.BoxGeometry(len, H, T);
    const m = new THREE.Matrix4().makeRotationY(-angle).setPosition((x1 + x2) / 2, H / 2, (z1 + z2) / 2);
    // grup yerel konumu + kat kotu → dünya matrisi
    const world = new THREE.Matrix4().makeTranslation(g.position.x, g.position.y, g.position.z).multiply(m);
    pushInstance(`wall-${len.toFixed(2)}`, geo, 'plaster', world);
  }
}

function addFurnitureInstances(g: THREE.Group, apt: ApartmentDef): void {
  const baseY = g.position.y;
  const ox = g.position.x, oz = g.position.z;
  const place = (
    geo: THREE.BufferGeometry, mat: string,
    x: number, y: number, z: number, ry = 0,
  ) => {
    const m = new THREE.Matrix4().makeRotationY(ry).setPosition(ox + x, baseY + y, oz + z);
    pushInstance(`${mat}-${geo.type}-${(geo as any).parameters?.width ?? 0}`, geo, mat, m);
  };
  // koltuk
  place(new THREE.BoxGeometry(2.4, 0.55, 0.95), 'fabric', 0, 0.3, 3.2);
  // sehpa
  place(new THREE.BoxGeometry(1.3, 0.42, 0.8), 'wood', 0, 0.21, 1.7);
  // yatak (2 adet)
  place(new THREE.BoxGeometry(1.7, 0.5, 2.0), 'fabricLight', -3.8, 0.25, -3.0);
  place(new THREE.BoxGeometry(1.4, 0.45, 1.9), 'fabricLight', -3.8, 0.22, 3.0);
  // gardırop
  place(new THREE.BoxGeometry(0.55, 2.1, 2.2), 'woodDark', 5.2, 1.05, 2.6);
  // mutfak tezgâh
  place(new THREE.BoxGeometry(2.6, 0.9, 0.6), 'woodDark', 3.6, 0.45, -4.6);
  // yemek masası + sandalyeler
  place(new THREE.BoxGeometry(1.6, 0.74, 0.9), 'wood', 3.4, 0.37, 0.6);
  place(new THREE.BoxGeometry(0.42, 0.45, 0.42), 'woodDark', 2.6, 0.22, 1.4);
  place(new THREE.BoxGeometry(0.42, 0.45, 0.42), 'woodDark', 4.2, 0.22, 1.4);
  // TV
  place(new THREE.BoxGeometry(1.4, 0.8, 0.05), 'screen', 0, 1.5, 4.9);
  // banyo donanımı
  place(new THREE.BoxGeometry(1.5, 0.55, 0.7), 'ceramic', -4.6, 0.28, -4.4);
}

/** Instanced meshlere tıklanabilirlik için meta etiketi verilemez (tek mesh) —
 *  raycast'te yakalanan instance'a en yakın daireyi bulmak için merkez listesi döner. */
export function apartmentIndex(): Array<{ apt: ApartmentDef; x: number; z: number; y: number }> {
  return APARTMENTS.filter((a) => a.id !== HERO_APARTMENT_ID).map((apt) => {
    const q = APARTMENT_QUADRANTS[apt.quadrant];
    return { apt, x: q.x, z: q.z, y: 0 };
  });
}
