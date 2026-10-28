import * as THREE from 'three';
import { BUILDING, FLOORS, HERO_ROOMS, APARTMENT_QUADRANTS, HERO_APARTMENT_ID, APARTMENTS, type RoomDef } from '../data/building';
import { makeBox, makeCyl, makeWall, makeLamp, tagGroup, nextId } from '../core/geometry';

/**
 * Örnek 3+1 daire iç mekânı (K1-D1).
 * Kapılar etkileşimli: aç/kapat. Işıklar anahtarla kontrol edilir.
 * Mobilyalar gerçek ölçülere yakın ve oda kimliklerine bağlı.
 */

export interface DoorHandle {
  id: string;
  pivot: THREE.Group;
  mesh: THREE.Mesh;
  open: boolean;
  angle: number;
  targetAngle: number;
  openAngle: number; // radyan
  label: string;
  roomA?: string;
  roomB?: string;
}

export interface LightHandle {
  id: string;
  room: string;
  floorId: string;
  meshes: THREE.Mesh[];
  pointLight: THREE.PointLight | null;
  on: boolean;
  powerW: number;
}

export interface HeroApartment {
  group: THREE.Group;
  doors: DoorHandle[];
  lights: LightHandle[];
}

const WALL_T = 0.14;

export function buildHeroApartment(): HeroApartment {
  const g = new THREE.Group();
  const apt = APARTMENTS.find((a) => a.id === HERO_APARTMENT_ID)!;
  const q = APARTMENT_QUADRANTS[apt.quadrant];
  // Daire zemini K1 kotunda. Grup konumu = kat + daire konumu.
  g.position.set(q.x, 0, q.z);
  g.name = 'hero-apartment';
  g.userData.apartmentId = HERO_APARTMENT_ID;
  g.userData.floorId = 'K1';

  const doors: DoorHandle[] = [];
  const lights: LightHandle[] = [];

  // ---- Zemin (her oda kendi renk/textüründe) ----
  const roomFloorMat: Record<string, 'wood' | 'marble' | 'ceramic' | 'stone'> = {
    salon: 'wood', mutfak: 'ceramic', yatak1: 'wood', yatak2: 'wood', yatak3: 'wood',
    banyo: 'ceramic', antre: 'marble', balkon: 'stone',
  };

  for (const r of HERO_ROOMS) {
    const mat = roomFloorMat[r.id] ?? 'wood';
    const floor = makeBox(r.w, 0.04, r.d, mat, {
      pos: [r.x, 0.02, r.z], floorId: 'K1', apartmentId: HERO_APARTMENT_ID, roomId: r.id,
      castShadow: false, name: `floor-${r.id}`,
      meta: {
        kind: 'room', id: `${HERO_APARTMENT_ID}-${r.id}`, label: r.name,
        floorId: 'K1', apartmentId: HERO_APARTMENT_ID, area: r.area,
        info: [['Alan', `${r.area} m²`], ['Tavan yüksekliği', `${r.height} m`], ['Ölçü', `${r.w} × ${r.d} m`]],
      },
    });
    g.add(floor);
    // tavanı yalnız iç mekân görünümü için ekle (kat tek modunda gizlenir)
    const ceil = makeBox(r.w, 0.06, r.d, 'plaster', {
      pos: [r.x, r.height - 0.03, r.z], floorId: 'K1', apartmentId: HERO_APARTMENT_ID, roomId: r.id,
      castShadow: false, name: `ceiling-${r.id}`,
    });
    ceil.userData.isCeiling = true;
    g.add(ceil);
  }

  // ---- Dış duvarlar (daire sınırı 12 x 10.5) ----
  const HW = 6.0, HD = 5.25;
  const H = 2.85;
  const outer: Array<[number, number, number, number]> = [
    [-HW, -HD, HW, -HD],
    [-HW, HD, HW, HD],
    [-HW, -HD, -HW, HD],
    [HW, -HD, HW, HD],
  ];
  for (const [x1, z1, x2, z2] of outer) {
    const w = makeWall(x1, z1, x2, z2, H, WALL_T, 'plaster', {
      floorId: 'K1', apartmentId: HERO_APARTMENT_ID, roomId: 'sinir', collider: true, name: 'apt-outer',
      meta: { kind: 'apartment', id: HERO_APARTMENT_ID, label: `${apt.no} — ${apt.type} (örnek daire)`, floorId: 'K1', apartmentId: HERO_APARTMENT_ID, area: apt.area },
    });
    g.add(w);
  }

  // ---- İç duvarlar ----
  const inner: Array<[number, number, number, number]> = [
    // salon ↔ mutfak (dikey)
    [0.6, -0.4, 0.6, 4.0],
    // salon ↔ yatak1
    [1.6, 0.0, 1.6, 4.9],
    // yatak1 ↔ balkon
    [1.6, 4.4, 5.9, 4.4],
    // mutfak ↔ yatak3
    [0.6, -2.7, 1.4, -2.7],
    // mutfak ↔ yatak2
    [0.6, -2.0, 0.6, -4.9],
    // antre ↔ yatak2/banyo
    [-1.4, -1.6, -1.4, -4.9],
    // salon ↔ antre
    [-2.4, -1.4, 0.6, -1.4],
    // banyo ↔ yatak3
    [0.6, -2.9, 2.2, -2.9],
    // banyo ↔ yatak2
    [-1.4, -2.9, -0.9, -2.9],
    // yatak2 ↔ yatak3
    [0.9, -3.9, 0.9, -4.9],
  ];
  inner.forEach(([x1, z1, x2, z2], i) => {
    g.add(makeWall(x1, z1, x2, z2, H, WALL_T, 'plaster', {
      floorId: 'K1', apartmentId: HERO_APARTMENT_ID, roomId: `wall${i}`, collider: true, name: `inner-wall-${i}`,
    }));
  });

  // ---- Kapılar (etkileşimli) ----
  function addDoor(
    id: string, label: string, x: number, z: number, rotY: number, width = 0.9, roomA?: string, roomB?: string,
  ): void {
    const pivot = new THREE.Group();
    pivot.position.set(x, 0, z);
    pivot.rotation.y = rotY;
    const leaf = makeBox(width, 2.1, 0.06, 'woodDark', {
      pos: [width / 2, 1.05, 0], floorId: 'K1', apartmentId: HERO_APARTMENT_ID, name: `door-${id}`,
      meta: { kind: 'door', id, label, floorId: 'K1', apartmentId: HERO_APARTMENT_ID, info: [['Genişlik', `${width * 100} cm`], ['Tür', 'İç mekân kapısı']] },
    });
    leaf.userData.doorId = id;
    pivot.add(leaf);
    // kapı kolu
    pivot.add(makeBox(0.12, 0.03, 0.03, 'metal', {
      pos: [width * 0.82, 1.0, 0.06], floorId: 'K1', apartmentId: HERO_APARTMENT_ID,
    }));
    g.add(pivot);
    doors.push({
      id, pivot, mesh: leaf, open: false, angle: 0, targetAngle: 0,
      openAngle: Math.PI * 0.55, label, roomA, roomB,
    });
  }

  // daire giriş kapısı (antreden)
  addDoor('K1-D1-giris', '101 Daire Girişi', -5.9, -0.2, Math.PI / 2, 1.0, 'antre', 'koridor');
  // salon ↔ antre
  addDoor('K1-D1-salon', 'Salon Kapısı', -2.3, -1.32, 0, 0.9, 'antre', 'salon');
  // salon ↔ mutfak (açık geçiş, kapı yok ama mutfak kapısı)
  addDoor('K1-D1-mutfak', 'Mutfak Kapısı', 0.62, 0.4, Math.PI / 2, 0.85, 'salon', 'mutfak');
  // yatak1
  addDoor('K1-D1-yatak1', 'Ebeveyn Yatak Odası Kapısı', 1.62, 1.4, Math.PI / 2, 0.85, 'salon', 'yatak1');
  // yatak2
  addDoor('K1-D1-yatak2', '2. Yatak Odası Kapısı', -1.38, -2.4, Math.PI / 2, 0.8, 'antre', 'yatak2');
  // banyo
  addDoor('K1-D1-banyo', 'Banyo Kapısı', -0.9, -2.88, 0, 0.75, 'antre', 'banyo');
  // balkon
  addDoor('K1-D1-balkon', 'Balkon Kapısı (Cam)', -3.0, 4.9, 0, 1.1, 'salon', 'balkon');

  // ---- Işıklar: her oda için armatür + point light ----
  for (const r of HERO_ROOMS) {
    const meshCount = r.id === 'banyo' ? 1 : 2;
    const meshes: THREE.Mesh[] = [];
    for (let i = 0; i < meshCount; i++) {
      const off = meshCount === 1 ? 0 : (i === 0 ? -1 : 1) * r.w * 0.22;
      const lamp = makeLamp(r.x + off, r.height - 0.12, r.z, r.id === 'balkon' ? 0.3 : 0.55, 'K1', r.id);
      meshes.push(lamp);
      g.add(lamp);
    }
    // İç mekân sıcak ışığı — daire karanlıkta kalmasın diye mesafesi oda boyutuna göre
    // 22 çok güçlüydü (odalar bembeyaz patlıyordu). 5 ölçülü sıcak ışık verir.
    const pl = new THREE.PointLight(0xffd9a0, r.id === 'balkon' ? 0 : 5, Math.max(r.w, r.d) * 1.9, 1.8);
    pl.position.set(r.x, r.height - 0.3, r.z);
    pl.castShadow = false;
    g.add(pl);
    lights.push({
      id: `K1-D1-light-${r.id}`, room: r.name, floorId: 'K1', meshes, pointLight: pl,
      on: r.id !== 'balkon', powerW: r.id === 'balkon' ? 8 : 24,
    });
  }

  // ---- Mutfak: dolaplar, tezgâh, ankastre, ada ----
  buildKitchen(g);
  // ---- Salon: koltuk, sehpa, TV ünitesi, yemek masası ----
  buildLivingRoom(g);
  // ---- Yatak odaları ----
  buildBedrooms(g);
  // ---- Banyo ----
  buildBathroom(g);
  // ---- Antre ----
  buildEntry(g);

  return { group: g, doors, lights };
}

function furnish(mesh: THREE.Mesh, id: string, label: string, roomId: string, info: Array<[string, string]>): void {
  mesh.userData.meta = {
    kind: 'furniture', id, label, floorId: 'K1', apartmentId: HERO_APARTMENT_ID, roomId, info,
  };
  (mesh.userData as any).ctx = { ...((mesh.userData as any).ctx ?? {}), floorId: 'K1', apartmentId: HERO_APARTMENT_ID, roomId };
}

function buildKitchen(g: THREE.Group): void {
  const x0 = 2.4, z0 = -2.2;
  // alt dolaplar
  const lower = makeBox(4.4, 0.85, 0.6, 'woodDark', {
    pos: [x0, 0.45, z0 - 1.45], floorId: 'K1', apartmentId: HERO_APARTMENT_ID, roomId: 'mutfak', name: 'kitchen-lower',
  });
  furnish(lower, 'K1-D1-mutfak-alt', 'Mutfak Alt Dolabı', 'mutfak', [['Uzunluk', '4.4 m'], ['Yükseklik', '85 cm']]);
  g.add(lower);
  // tezgâh
  const top = makeBox(4.5, 0.05, 0.66, 'marble', {
    pos: [x0, 0.89, z0 - 1.45], floorId: 'K1', apartmentId: HERO_APARTMENT_ID, roomId: 'mutfak', name: 'kitchen-top',
  });
  furnish(top, 'K1-D1-mutfak-tezgah', 'Mutfak Tezgâhı (Mermer)', 'mutfak', [['Malzeme', 'Kompozit mermer'], ['Derinlik', '66 cm']]);
  g.add(top);
  // üst dolaplar
  g.add(makeBox(4.4, 0.72, 0.36, 'wood', {
    pos: [x0, 1.86, z0 - 1.58], floorId: 'K1', apartmentId: HERO_APARTMENT_ID, roomId: 'mutfak', name: 'kitchen-upper',
  }));
  // davlumbaz
  g.add(makeBox(0.9, 0.3, 0.5, 'metal', {
    pos: [x0, 1.62, z0 - 1.35], floorId: 'K1', apartmentId: HERO_APARTMENT_ID, roomId: 'mutfak',
  }));
  // ocak
  g.add(makeBox(0.62, 0.02, 0.5, 'glassDark', {
    pos: [x0 - 0.9, 0.92, z0 - 1.45], floorId: 'K1', apartmentId: HERO_APARTMENT_ID, roomId: 'mutfak',
    meta: { kind: 'furniture', id: 'K1-D1-ocak', label: 'Ankastre Ocak', floorId: 'K1', apartmentId: HERO_APARTMENT_ID, roomId: 'mutfak', info: [['Tip', 'İndüksiyon, 4 gözlü']] },
  }));
  // eviye
  g.add(makeBox(0.7, 0.16, 0.42, 'metal', {
    pos: [x0 + 1.2, 0.85, z0 - 1.45], floorId: 'K1', apartmentId: HERO_APARTMENT_ID, roomId: 'mutfak',
  }));
  // buzdolabı
  g.add(makeBox(0.75, 1.9, 0.7, 'metal', {
    pos: [x0 + 2.4, 0.95, z0 - 1.4], floorId: 'K1', apartmentId: HERO_APARTMENT_ID, roomId: 'mutfak', name: 'fridge',
    meta: { kind: 'furniture', id: 'K1-D1-buzdolabi', label: 'Buzdolabı', floorId: 'K1', apartmentId: HERO_APARTMENT_ID, roomId: 'mutfak', info: [['Hacim', '420 L'], ['Enerji sınıfı', 'A+++']] },
  }));
  // ada tezgâh + 3 tabure
  g.add(makeBox(2.0, 0.9, 0.9, 'woodDark', { pos: [x0 - 0.3, 0.45, z0 + 0.4], floorId: 'K1', apartmentId: HERO_APARTMENT_ID, roomId: 'mutfak' }));
  g.add(makeBox(2.1, 0.06, 1.0, 'marble', { pos: [x0 - 0.3, 0.93, z0 + 0.4], floorId: 'K1', apartmentId: HERO_APARTMENT_ID, roomId: 'mutfak' }));
  for (let i = 0; i < 3; i++) {
    g.add(makeBox(0.34, 0.65, 0.34, 'fabric', { pos: [x0 - 1.1 + i * 0.8, 0.33, z0 + 1.05], floorId: 'K1', apartmentId: HERO_APARTMENT_ID, roomId: 'mutfak' }));
  }
  // mutfak aydınlatma
  g.add(makeLamp(x0, 2.4, z0 - 1.2, 0.9, 'K1', 'mutfak'));
}

function buildLivingRoom(g: THREE.Group): void {
  const x0 = -3.0, z0 = 1.4;
  // halı
  g.add(makeBox(4.4, 0.02, 3.4, 'fabricLight', {
    pos: [x0, 0.04, z0 + 0.3], floorId: 'K1', apartmentId: HERO_APARTMENT_ID, roomId: 'salon', castShadow: false,
    meta: { kind: 'furniture', id: 'K1-D1-hali', label: 'Salon Halısı', floorId: 'K1', apartmentId: HERO_APARTMENT_ID, roomId: 'salon', info: [['Ölçü', '4.4 × 3.4 m']] },
  }));
  // 3'lü koltuk (arkalık + oturak + 2 kol)
  const sofa = makeBox(2.6, 0.44, 0.95, 'fabric', {
    pos: [x0, 0.3, z0 + 2.0], floorId: 'K1', apartmentId: HERO_APARTMENT_ID, roomId: 'salon', name: 'sofa',
  });
  furnish(sofa, 'K1-D1-koltuk', '3\'lü Koltuk', 'salon', [['Ölçü', '2.6 × 0.95 m'], ['Kumaş', 'Bukle dokuma']]);
  g.add(sofa);
  g.add(makeBox(2.6, 0.55, 0.22, 'fabric', { pos: [x0, 0.7, z0 + 2.42], floorId: 'K1', apartmentId: HERO_APARTMENT_ID, roomId: 'salon' }));
  g.add(makeBox(0.2, 0.5, 0.95, 'fabric', { pos: [x0 - 1.4, 0.55, z0 + 2.0], floorId: 'K1', apartmentId: HERO_APARTMENT_ID, roomId: 'salon' }));
  g.add(makeBox(0.2, 0.5, 0.95, 'fabric', { pos: [x0 + 1.4, 0.55, z0 + 2.0], floorId: 'K1', apartmentId: HERO_APARTMENT_ID, roomId: 'salon' }));
  // berjer
  for (const dx of [-2.2, 2.2]) {
    g.add(makeBox(0.85, 0.42, 0.85, 'fabricLight', { pos: [x0 + dx, 0.28, z0 - 0.2], floorId: 'K1', apartmentId: HERO_APARTMENT_ID, roomId: 'salon' }));
    g.add(makeBox(0.85, 0.5, 0.16, 'fabricLight', { pos: [x0 + dx, 0.65, z0 - 0.6], floorId: 'K1', apartmentId: HERO_APARTMENT_ID, roomId: 'salon' }));
  }
  // sehpa
  g.add(makeBox(1.5, 0.06, 0.85, 'wood', { pos: [x0, 0.4, z0 + 0.54], floorId: 'K1', apartmentId: HERO_APARTMENT_ID, roomId: 'salon', name: 'coffee-table' }));
  g.add(makeBox(0.06, 0.38, 0.06, 'metal', { pos: [x0 - 0.6, 0.2, z0 + 0.25], floorId: 'K1', apartmentId: HERO_APARTMENT_ID, roomId: 'salon' }));
  g.add(makeBox(0.06, 0.38, 0.06, 'metal', { pos: [x0 + 0.6, 0.2, z0 + 0.25], floorId: 'K1', apartmentId: HERO_APARTMENT_ID, roomId: 'salon' }));
  // TV ünitesi + TV (duvarda)
  g.add(makeBox(2.6, 0.5, 0.45, 'woodDark', { pos: [x0, 0.25, z0 - 1.05], floorId: 'K1', apartmentId: HERO_APARTMENT_ID, roomId: 'salon', name: 'tv-unit' }));
  const tv = makeBox(1.7, 0.96, 0.05, 'screen', {
    pos: [x0, 1.55, z0 - 1.12], floorId: 'K1', apartmentId: HERO_APARTMENT_ID, roomId: 'salon', name: 'tv',
    meta: { kind: 'furniture', id: 'K1-D1-tv', label: 'Televizyon (65")', floorId: 'K1', apartmentId: HERO_APARTMENT_ID, roomId: 'salon', info: [['Ekran', '65 inç 4K'], ['Not', 'Tıklayın: ekran modu']] },
  });
  g.add(tv);
  // yemek masası + 6 sandalye (salonun mutfak tarafı)
  const tx = x0 + 2.0, tz = z0 - 2.6;
  g.add(makeBox(1.8, 0.06, 0.95, 'wood', { pos: [tx, 0.74, tz], floorId: 'K1', apartmentId: HERO_APARTMENT_ID, roomId: 'salon', name: 'dining-table' }));
  for (let i = 0; i < 4; i++) {
    const sx = tx - 0.65 + (i % 2) * 1.3;
    const sz = tz - 0.8 + Math.floor(i / 2) * 1.6;
    g.add(makeBox(0.45, 0.45, 0.45, 'woodDark', { pos: [sx, 0.22, sz], floorId: 'K1', apartmentId: HERO_APARTMENT_ID, roomId: 'salon' }));
    g.add(makeBox(0.45, 0.5, 0.07, 'woodDark', { pos: [sx, 0.65, sz + (i < 2 ? -0.19 : 0.19)], floorId: 'K1', apartmentId: HERO_APARTMENT_ID, roomId: 'salon' }));
  }
  // tablo
  g.add(makeBox(1.0, 0.7, 0.04, 'fabricLight', { pos: [x0 + 1.2, 1.9, z0 + 2.6], floorId: 'K1', apartmentId: HERO_APARTMENT_ID, roomId: 'salon' }));
  // bitki
  g.add(makeBox(0.5, 0.6, 0.5, 'ceramic', { pos: [x0 + 2.6, 0.3, z0 + 2.2], floorId: 'K1', apartmentId: HERO_APARTMENT_ID, roomId: 'salon' }));
  g.add(makeBox(0.9, 1.2, 0.9, 'foliage', { pos: [x0 + 2.6, 1.3, z0 + 2.2], floorId: 'K1', apartmentId: HERO_APARTMENT_ID, roomId: 'salon' }));
}

function buildBedrooms(g: THREE.Group): void {
  // Yatak odası 1 (ebeveyn) — yatak, gardırop, şifonyer, aplik
  const b1x = 2.6, b1z = 2.6;
  const bed1 = new THREE.Group();
  bed1.add(makeBox(1.8, 0.42, 2.1, 'woodDark', { pos: [b1x, 0.24, b1z] }));
  bed1.add(makeBox(1.72, 0.22, 2.0, 'fabricLight', { pos: [b1x, 0.55, b1z] }));
  bed1.add(makeBox(1.8, 0.9, 0.12, 'woodDark', { pos: [b1x, 0.55, b1z - 1.08] }));
  // yastıklar
  bed1.add(makeBox(0.7, 0.16, 0.42, 'ceramic', { pos: [b1x - 0.42, 0.72, b1z - 0.78] }));
  bed1.add(makeBox(0.7, 0.16, 0.42, 'ceramic', { pos: [b1x + 0.42, 0.72, b1z - 0.78] }));
  // yorgan
  bed1.add(makeBox(1.78, 0.1, 1.2, 'fabric', { pos: [b1x, 0.68, b1z + 0.42] }));
  g.add(bed1);
  bed1.traverse((o) => {
    const m = o as THREE.Mesh;
    if (m.isMesh) furnish(m, 'K1-D1-yatak1', 'Çift Kişilik Yatak (160 × 200)', 'yatak1', [['Ölçü', '1.8 × 2.1 m'], ['Başlık', 'Ahşap panel']]);
  });
  // komodinler
  for (const dx of [-1.25, 1.25]) {
    g.add(makeBox(0.45, 0.5, 0.4, 'wood', { pos: [b1x + dx, 0.25, b1z - 0.85], floorId: 'K1', apartmentId: HERO_APARTMENT_ID, roomId: 'yatak1' }));
    g.add(makeCyl(0.13, 0.16, 0.3, 'ceramic', { pos: [b1x + dx, 0.65, b1z - 0.85], floorId: 'K1', apartmentId: HERO_APARTMENT_ID, roomId: 'yatak1', seg: 10 }));
  }
  // gardırop
  g.add(makeBox(0.6, 2.2, 2.6, 'woodDark', {
    pos: [b1x + 1.7, 1.1, b1z + 0.4], floorId: 'K1', apartmentId: HERO_APARTMENT_ID, roomId: 'yatak1', name: 'wardrobe',
    meta: { kind: 'furniture', id: 'K1-D1-gardirob', label: 'Gardırop (4 kapak)', floorId: 'K1', apartmentId: HERO_APARTMENT_ID, roomId: 'yatak1', info: [['Ölçü', '2.6 × 0.6 m'], ['Yükseklik', '2.2 m']] },
  }));
  // şifonyer
  g.add(makeBox(1.2, 0.8, 0.45, 'wood', { pos: [b1x - 1.0, 0.4, b1z + 1.6], floorId: 'K1', apartmentId: HERO_APARTMENT_ID, roomId: 'yatak1' }));

  // Yatak odası 2
  const b2x = -3.4, b2z = -3.4;
  const bed2 = new THREE.Group();
  bed2.add(makeBox(1.4, 0.4, 2.0, 'wood', { pos: [b2x, 0.22, b2z] }));
  bed2.add(makeBox(1.34, 0.2, 1.9, 'fabricLight', { pos: [b2x, 0.52, b2z] }));
  bed2.add(makeBox(1.4, 0.8, 0.1, 'wood', { pos: [b2x, 0.5, b2z - 1.03] }));
  bed2.add(makeBox(1.3, 0.08, 1.0, 'fabric', { pos: [b2x, 0.64, b2z + 0.4] }));
  g.add(bed2);
  bed2.traverse((o) => { const m = o as THREE.Mesh; if (m.isMesh) furnish(m, 'K1-D1-yatak2', 'Tek Kişilik Yatak (140 × 200)', 'yatak2', [['Ölçü', '1.4 × 2.0 m']]); });
  g.add(makeBox(0.5, 1.9, 1.6, 'woodDark', { pos: [b2x - 1.5, 0.95, b2z + 0.2], floorId: 'K1', apartmentId: HERO_APARTMENT_ID, roomId: 'yatak2' }));
  // çalışma masası
  g.add(makeBox(1.2, 0.05, 0.6, 'wood', { pos: [b2x + 1.4, 0.74, b2z + 1.2], floorId: 'K1', apartmentId: HERO_APARTMENT_ID, roomId: 'yatak2' }));
  g.add(makeBox(0.42, 0.45, 0.42, 'fabric', { pos: [b2x + 1.4, 0.22, b2z + 1.65], floorId: 'K1', apartmentId: HERO_APARTMENT_ID, roomId: 'yatak2' }));

  // Yatak odası 3 (küçük / çocuk)
  const b3x = 0.9, b3z = -4.3;
  g.add(makeBox(1.0, 0.38, 1.9, 'wood', { pos: [b3x, 0.21, b3z], floorId: 'K1', apartmentId: HERO_APARTMENT_ID, roomId: 'yatak3', name: 'bed3' }));
  g.add(makeBox(0.95, 0.16, 1.8, 'fabricLight', { pos: [b3x, 0.48, b3z], floorId: 'K1', apartmentId: HERO_APARTMENT_ID, roomId: 'yatak3' }));
  g.add(makeBox(1.0, 0.7, 0.08, 'wood', { pos: [b3x, 0.5, b3z - 0.98], floorId: 'K1', apartmentId: HERO_APARTMENT_ID, roomId: 'yatak3' }));
  g.add(makeBox(0.5, 1.6, 0.35, 'woodDark', { pos: [b3x + 1.0, 0.8, b3z], floorId: 'K1', apartmentId: HERO_APARTMENT_ID, roomId: 'yatak3' }));
}

function buildBathroom(g: THREE.Group): void {
  const x0 = -0.8, z0 = -3.9;
  // zemin fayansı
  g.add(makeBox(2.2, 0.03, 2.2, 'ceramic', { pos: [x0, 0.03, z0], floorId: 'K1', apartmentId: HERO_APARTMENT_ID, roomId: 'banyo', castShadow: false }));
  // küvet
  g.add(makeBox(1.7, 0.55, 0.75, 'ceramic', {
    pos: [x0, 0.28, z0 - 0.7], floorId: 'K1', apartmentId: HERO_APARTMENT_ID, roomId: 'banyo', name: 'bathtub',
    meta: { kind: 'furniture', id: 'K1-D1-kuvet', label: 'Küvet (170 × 75)', floorId: 'K1', apartmentId: HERO_APARTMENT_ID, roomId: 'banyo', info: [['Ölçü', '1.7 × 0.75 m'], ['Malzeme', 'Akrilik']] },
  }));
  g.add(makeBox(1.5, 0.08, 0.55, 'water', { pos: [x0, 0.5, z0 - 0.7], floorId: 'K1', apartmentId: HERO_APARTMENT_ID, roomId: 'banyo', castShadow: false }));
  // lavabo + ayna
  g.add(makeBox(1.0, 0.16, 0.5, 'ceramic', { pos: [x0 + 0.55, 0.82, z0 + 0.85], floorId: 'K1', apartmentId: HERO_APARTMENT_ID, roomId: 'banyo' }));
  g.add(makeBox(0.06, 0.75, 1.0, 'glass', { pos: [x0 + 1.02, 1.55, z0 + 0.85], rotY: Math.PI / 2, floorId: 'K1', apartmentId: HERO_APARTMENT_ID, roomId: 'banyo', castShadow: false }));
  // klozet
  g.add(makeBox(0.4, 0.42, 0.6, 'ceramic', { pos: [x0 - 0.75, 0.21, z0 + 0.8], floorId: 'K1', apartmentId: HERO_APARTMENT_ID, roomId: 'banyo' }));
  g.add(makeBox(0.4, 0.5, 0.16, 'ceramic', { pos: [x0 - 0.75, 0.6, z0 + 1.02], floorId: 'K1', apartmentId: HERO_APARTMENT_ID, roomId: 'banyo' }));
  // duş başlığı
  g.add(makeCyl(0.04, 0.04, 1.0, 'metal', { pos: [x0 - 0.95, 1.7, z0 - 0.95], floorId: 'K1', apartmentId: HERO_APARTMENT_ID, roomId: 'banyo' }));
  // havluluk
  g.add(makeBox(0.7, 0.04, 0.04, 'metal', { pos: [x0, 1.5, z0 - 1.05], floorId: 'K1', apartmentId: HERO_APARTMENT_ID, roomId: 'banyo' }));
}

function buildEntry(g: THREE.Group): void {
  const x0 = -0.4, z0 = 0.0;
  // ayakkabılık
  g.add(makeBox(0.4, 1.1, 1.6, 'woodDark', {
    pos: [x0 - 0.9, 0.55, z0 - 1.7], floorId: 'K1', apartmentId: HERO_APARTMENT_ID, roomId: 'antre', name: 'shoe-rack',
    meta: { kind: 'furniture', id: 'K1-D1-ayakkabilik', label: 'Ayakkabılık', floorId: 'K1', apartmentId: HERO_APARTMENT_ID, roomId: 'antre', info: [['Yükseklik', '1.1 m']] },
  }));
  // ayna
  g.add(makeBox(0.9, 1.6, 0.04, 'glass', { pos: [x0 + 0.86, 1.5, z0 - 1.6], rotY: Math.PI / 2, floorId: 'K1', apartmentId: HERO_APARTMENT_ID, roomId: 'antre', castShadow: false }));
  // konsol
  g.add(makeBox(0.35, 0.8, 0.9, 'wood', { pos: [x0 + 0.7, 0.4, z0 - 0.3], floorId: 'K1', apartmentId: HERO_APARTMENT_ID, roomId: 'antre' }));
  // balkon mobilyası (sandalyeler balkon grubunda zaten var)
}
