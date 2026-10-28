import * as THREE from 'three';
import { BUILDING, FLOORS, CORE } from '../data/building';
import { makeBox, makeWall, makeLamp } from '../core/geometry';

/**
 * Zemin kat ve bodrum özel mekânları:
 * - Bodrum: otopark (park yerleri + araç silüetleri), teknik odalar
 * - Zemin: lobi, resepsiyon, güvenlik, sosyal alan, giriş kapısı + basamaklar
 */

export function buildBasement(group: THREE.Group): void {
  const floor = FLOORS[0]; // B1
  const { width, depth } = BUILDING;

  // bodrum zemin (asfalt)
  group.add(makeBox(width + 1.2, 0.1, depth + 1.2, 'asphalt', {
    pos: [0, 0.05, 0], floorId: 'B1', name: 'basement-floor', castShadow: false,
    meta: { kind: 'floor', id: 'B1-slab', label: 'Bodrum — Otopark Zemini', floorId: 'B1', area: width * depth },
  }));

  // park yerleri — 2 sıra, çekirdeğin iki yanında
  const stallW = 2.5;
  const stallD = 5.0;
  for (let row = 0; row < 2; row++) {
    const z = row === 0 ? -7.2 : 7.2;
    for (let i = 0; i < 5; i++) {
      const x = -12 + i * (stallW + 0.15);
      // park çizgisi: 3 kenar çizgisi
      group.add(makeBox(stallW, 0.02, 0.1, 'plaster', {
        pos: [x, 0.11, z - stallD / 2], floorId: 'B1', castShadow: false, name: 'park-line',
      }));
      group.add(makeBox(0.1, 0.02, stallD, 'plaster', {
        pos: [x - stallW / 2, 0.11, z], floorId: 'B1', castShadow: false, name: 'park-line',
      }));
      // araç silüetleri (her ikinci yerde)
      if (i % 2 === 0) {
        group.add(makeBox(1.8, 0.75, 4.3, 'metalDark', {
          pos: [x, 0.48, z], floorId: 'B1', name: 'car-body', collider: true,
          meta: {
            kind: 'furniture', id: `car-${row}-${i}`, label: 'Otopark — Araç', floorId: 'B1',
            info: [['Park yeri', '2.5 × 5.0 m'], ['Alan', `${stallW * stallD} m²`]],
          },
        }));
        group.add(makeBox(1.6, 0.55, 2.2, 'glassDark', {
          pos: [x, 1.12, z + 0.2], floorId: 'B1', name: 'car-cabin',
        }));
      }
    }
    // ikinci sıra (sağ taraf)
    for (let i = 0; i < 3; i++) {
      const x = 6 + i * (stallW + 0.15);
      group.add(makeBox(stallW, 0.02, 0.1, 'plaster', {
        pos: [x, 0.11, z - stallD / 2], floorId: 'B1', castShadow: false, name: 'park-line',
      }));
    }
  }

  // teknik odalar
  const rooms: Array<[string, number, number, number, number]> = [
    ['Elektrik Odası', -12.5, -9.2, 4.5, 3.2],
    ['Mekanik (Kazan)', -7.5, -9.2, 4.5, 3.2],
    ['Su Deposu', 12.0, -9.2, 4.5, 3.2],
    ['Atık / Çöp Odası', 12.0, 9.2, 4.5, 3.2],
  ];
  for (const [name, x, z, w, d] of rooms) {
    const h = 2.9;
    // duvarlar
    group.add(makeBox(w, h, 0.14, 'concreteDark', { pos: [x, h / 2, z - d / 2], floorId: 'B1', collider: true }));
    group.add(makeBox(w, h, 0.14, 'concreteDark', { pos: [x, h / 2, z + d / 2], floorId: 'B1', collider: true }));
    group.add(makeBox(0.14, h, d, 'concreteDark', { pos: [x - w / 2, h / 2, z], floorId: 'B1', collider: true }));
    group.add(makeBox(0.14, h, d, 'concreteDark', { pos: [x + w / 2, h / 2, z], floorId: 'B1', collider: true }));
    // kapı
    group.add(makeBox(0.9, 2.1, 0.06, 'metalDark', {
      pos: [x, 1.05, z + d / 2 - 0.02], floorId: 'B1', name: `tech-door-${name}`,
      meta: { kind: 'door', id: `tech-${name}`, label: `${name} Kapısı`, floorId: 'B1', info: [['Genişlik', '90 cm']] },
    }));
    group.add(makeBox(w - 1.2, 0.05, d - 0.6, 'stone', {
      pos: [x, 0.06, z], floorId: 'B1', castShadow: false,
      meta: { kind: 'room', id: `tech-${name}`, label: name, floorId: 'B1', area: w * d, info: [['Alan', `${(w * d).toFixed(1)} m²`]] },
    }));
    group.add(makeLamp(x, 2.5, z, 0.5, 'B1', name));
  }

  // otopark aydınlatması
  for (let i = -2; i <= 2; i++) {
    group.add(makeLamp(i * 5.5, 2.7, -3.4, 0.7, 'B1', 'park'));
    group.add(makeLamp(i * 5.5, 2.7, 3.4, 0.7, 'B1', 'park'));
  }

  // otopark rampası (bina güney-batı köşesi)
  const rampX = -12.5;
  group.add(makeBox(4.4, 0.1, 7.0, 'asphalt', {
    pos: [rampX, 0.12, -12.5], rotX: -0.09, floorId: 'B1', castShadow: false, name: 'ramp',
    meta: { kind: 'floor', id: 'B1-ramp', label: 'Otopark Rampası', floorId: 'B1', info: [['Eğim', '≈ %12 (konsept)'], ['Genişlik', '4.4 m']] },
  }));
}

export function buildGroundFloor(group: THREE.Group): void {
  const floor = FLOORS[1]; // Z
  const h = floor.height;
  const { width, depth } = BUILDING;

  // lobi zemini (mermer)
  group.add(makeBox(width, 0.03, depth, 'marble', {
    pos: [0, 0.015, 0], floorId: 'Z', castShadow: false, name: 'lobby-floor',
    meta: {
      kind: 'room', id: 'Z-lobi', label: 'Zemin — Lobi', floorId: 'Z', area: 420,
      info: [['Zemin', 'Cilalı mermer'], ['Yükseklik', `${h} m`], ['Brüt alan', '≈ 660 m² (kat)']],
    },
  }));

  // lobi tavan (iç mekân ayrımı için)
  group.add(makeBox(width - 1.0, 0.14, depth - 1.0, 'plaster', {
    pos: [0, h - 0.09, 0], floorId: 'Z', name: 'lobby-ceiling',
    meta: { kind: 'floor', id: 'lobby-ceiling', label: 'Lobi Tavanı', floorId: 'Z' },
  }));

  // resepsiyon bankosu
  const rec = new THREE.Group();
  rec.position.set(-6, 0, 6.5);
  rec.add(makeBox(4.2, 1.05, 0.75, 'marble', { pos: [0, 0.53, 0], floorId: 'Z', name: 'reception-body' }));
  rec.add(makeBox(4.3, 0.07, 0.85, 'woodDark', { pos: [0, 1.08, 0], floorId: 'Z' }));
  rec.add(makeBox(3.0, 0.9, 0.06, 'glass', { pos: [0, 1.55, -0.3], floorId: 'Z', castShadow: false }));
  group.add(rec);
  rec.traverse((o) => {
    const m = o as THREE.Mesh;
    if (m.isMesh) {
      m.userData.meta = {
        kind: 'furniture', id: 'Z-resepsiyon', label: 'Resepsiyon Bankosu', floorId: 'Z',
        area: 3.2, info: [['Ölçü', '4.2 × 0.75 m'], ['Malzeme', 'Mermer + ahşap kaplama']],
      };
    }
  });

  // güvenlik noktası
  group.add(makeBox(1.6, 1.1, 0.7, 'metalDark', {
    pos: [5.5, 0.55, 7.2], floorId: 'Z', name: 'security-desk',
    meta: { kind: 'furniture', id: 'Z-guvenlik', label: 'Güvenlik Noktası', floorId: 'Z', info: [['Ekipman', 'Kartlı geçiş, kamera monitörü']] },
  }));
  group.add(makeBox(0.6, 0.35, 0.05, 'screen', { pos: [5.5, 1.4, 7.5], floorId: 'Z', rotX: -0.2 }));

  // sosyal alan: koltuk takımı + sehpa + halı
  const social = new THREE.Group();
  social.position.set(-9, 0, -1.5);
  social.add(makeBox(6.0, 0.02, 5.0, 'fabricLight', { pos: [0, 0.02, 0], floorId: 'Z', castShadow: false }));
  // L koltuk
  social.add(makeBox(3.2, 0.42, 1.0, 'fabric', { pos: [0, 0.28, -1.6], floorId: 'Z' }));
  social.add(makeBox(3.2, 0.5, 0.22, 'fabric', { pos: [0, 0.62, -2.0], floorId: 'Z' }));
  social.add(makeBox(1.0, 0.42, 2.2, 'fabric', { pos: [-1.9, 0.28, -0.4], floorId: 'Z' }));
  social.add(makeBox(0.22, 0.5, 2.2, 'fabric', { pos: [-2.3, 0.62, -0.4], floorId: 'Z' }));
  // sehpa
  social.add(makeBox(1.6, 0.06, 0.9, 'wood', { pos: [0.2, 0.4, -0.4], floorId: 'Z' }));
  social.add(makeBox(0.08, 0.4, 0.08, 'metal', { pos: [-0.5, 0.2, -0.4], floorId: 'Z' }));
  social.add(makeBox(0.08, 0.4, 0.08, 'metal', { pos: [0.9, 0.2, -0.4], floorId: 'Z' }));
  group.add(social);
  social.traverse((o) => {
    const m = o as THREE.Mesh;
    if (m.isMesh) m.userData.meta = { kind: 'room', id: 'Z-sosyal', label: 'Zemin — Sosyal Alan', floorId: 'Z', area: 30, info: [['Kullanım', 'Sakinler salonu'], ['Kapasite', '≈ 12 kişi']] };
  });

  // asma bitkiler / dekoratif saksılar
  for (const [x, z] of [[-3.5, 7.6], [2.5, 7.6], [-12, 3], [12, -3]]) {
    group.add(makeBox(0.7, 0.75, 0.7, 'ceramic', { pos: [x, 0.37, z], floorId: 'Z', name: 'planter' }));
    group.add(makeBox(1.1, 1.0, 1.1, 'foliage', { pos: [x, 1.35, z], floorId: 'Z', name: 'plant' }));
  }

  // giriş kapısı (otomatik, etkileşimli)
  const doorGroup = new THREE.Group();
  doorGroup.position.set(0, 0, depth / 2);
  (doorGroup.userData as any).meta = {
    kind: 'door', id: 'Z-giris-kapisi', label: 'Ana Giriş Kapısı (Cam)', floorId: 'Z',
    info: [['Tip', 'Otomatik kayar kanat'], ['Genişlik', '2.4 m'], ['Durum', 'Kapalı']],
  };
  const dl = makeBox(1.18, 2.5, 0.08, 'glass', {
    pos: [-0.6, 1.25, 0], floorId: 'Z', castShadow: false, name: 'entrance-door-L',
  });
  const dr = makeBox(1.18, 2.5, 0.08, 'glass', {
    pos: [0.6, 1.25, 0], floorId: 'Z', castShadow: false, name: 'entrance-door-R',
  });
  dl.userData.baseX = -0.6;
  dr.userData.baseX = 0.6;
  doorGroup.add(dl, dr);
  doorGroup.add(makeBox(2.5, 0.1, 0.14, 'metal', { pos: [0, 2.55, 0], floorId: 'Z' }));
  group.add(doorGroup);

  // giriş sahanlığı ve basamaklar
  for (let i = 0; i < 3; i++) {
    group.add(makeBox(6.0, 0.16, 1.0, 'stone', {
      pos: [0, -0.08 - i * 0.16, depth / 2 + 0.6 + i * 1.0], floorId: 'Z', name: 'entrance-step',
    }));
  }
  // Giriş saçağı: gövdenin dışında (z = +11'den öte) asılı durmalı, ama çatıda
  // değil. Z katı elevation 0 taşıdığı için y=3.3 doğru; konum z ile dışarı taşınır.
  group.add(makeBox(7.0, 0.18, 3.2, 'marble', {
    pos: [0, 3.3, depth / 2 + 1.4], floorId: 'Z', name: 'canopy',
  }));
  // saçak aydınlatma (saçağın hemen altı)
  for (let i = -2; i <= 2; i++) {
    group.add(makeLamp(i * 1.3, 3.18, depth / 2 + 1.2, 0.28, 'Z', 'giris'));
  }

  // lobi aydınlatması
  for (let i = -3; i <= 3; i++) {
    for (let j = -2; j <= 2; j++) {
      if (Math.abs(i) < 2 && Math.abs(j) < 2) continue; // çekirdek
      group.add(makeLamp(i * 3.2, h - 0.2, j * 3.6, 0.5, 'Z', 'lobi'));
    }
  }

  // asansör çağrı panelleri
  for (const ex of [CORE.elevatorA.x, CORE.elevatorB.x]) {
    group.add(makeBox(0.16, 0.4, 0.1, 'metal', {
      pos: [ex + 1.05, 1.3, CORE.elevatorA.z + CORE.elevatorA.d / 2 + 0.1], floorId: 'Z', name: 'call-panel',
      meta: {
        kind: 'elevator', id: `elevator-call-${ex < 0 ? 'A' : 'B'}`, label: `Asansör ${ex < 0 ? 'A' : 'B'} Çağrı Paneli`, floorId: 'Z',
        info: [['Not', 'Paneli tıklayıp kat seçin']],
      },
    }));
  }
}
