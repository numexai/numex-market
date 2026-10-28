import * as THREE from 'three';
import {
  BUILDING, FLOORS, APARTMENTS, APARTMENT_QUADRANTS, CORE,
  type FloorDef, type ApartmentDef, ROOF_ELEVATION,
} from '../data/building';
import { makeBox, makeWall, makeLamp, nextId, tagGroup } from '../core/geometry';

/**
 * Kat kabuğu: döşeme, tavan plakası, dış cephe çerçevesi, balkonlar, koridorlar.
 * Her parça `floorId` taşır → exploded view katla birlikte hareket eder.
 */

export interface FloorShell {
  floor: FloorDef;
  group: THREE.Group; // patlama yönünde Y ekseninde hareket eder
  colliders: THREE.Box3[];
}

const SHELL_HEIGHT_EXTRA = 0.02;

export function buildFloorGroup(floor: FloorDef): THREE.Group {
  const g = new THREE.Group();
  g.name = `floor-${floor.id}`;
  g.position.y = floor.elevation;
  g.userData.floorId = floor.id;
  g.userData.baseY = floor.elevation;
  (g.userData as any).meta = {
    kind: 'floor', id: `floor-${floor.id}`, label: floor.name, floorId: floor.id,
  };
  return g;
}

/** Döşeme + çevre kirişi */
export function addSlab(g: THREE.Group, floor: FloorDef): void {
  const { width, depth, slabThickness } = BUILDING;
  const slab = makeBox(width + 1.2, slabThickness, depth + 1.2, 'concrete', {
    pos: [0, -slabThickness / 2, 0],
    floorId: floor.id,
    name: `slab-${floor.id}`,
    receiveShadow: true,
    meta: {
      kind: 'floor', id: `slab-${floor.id}`, label: `${floor.shortName} Döşemesi`, floorId: floor.id,
      area: width * depth,
      info: [['Betonarme', 'C30/37 (temsili)'], ['Kalınlık', `${slabThickness * 100} cm`], ['Kat alanı', `${width * depth} m²`]],
    },
  });
  slab.userData.roomId = 'slab';
  g.add(slab);

  // çevre kirişi (dışarıdan görünen beyaz bant)
  const band = 0.18;
  for (const [sx, sz, w, d] of [
    [0, -(depth / 2 + 0.6), width + 1.2, band],
    [0, (depth / 2 + 0.6), width + 1.2, band],
    [-(width / 2 + 0.6), 0, band, depth + 1.2],
    [(width / 2 + 0.6), 0, band, depth + 1.2],
  ]) {
    g.add(makeBox(w, 0.22, d, 'marble', { pos: [sx, 0.02, sz], floorId: floor.id, name: `band-${floor.id}` }));
  }
}

/** Cam cephe — kolon ızgarası + cam paneller + yatay bantlar */
export function addFacade(g: THREE.Group, floor: FloorDef): void {
  const { width, depth } = BUILDING;
  const h = floor.height;
  const hw = width / 2;
  const hd = depth / 2;
  const mullionStep = 2.4;

  // Dört yüz için cam paneller ve dikey düşey kasa (mullion)
  const sides: Array<{ dir: 'N' | 'S' | 'E' | 'W'; len: number; cx: number; cz: number; rotY: number }> = [
    { dir: 'N', len: width, cx: 0, cz: -hd, rotY: 0 },
    { dir: 'S', len: width, cx: 0, cz: hd, rotY: 0 },
    { dir: 'W', len: depth, cx: -hw, cz: 0, rotY: Math.PI / 2 },
    { dir: 'E', len: depth, cx: hw, cz: 0, rotY: Math.PI / 2 },
  ];

  // Cam paneller — yüz başına 2 panel (sabit cam + balkon kapısı bölmesi).
  // Panel kalınlığı eksenine göre konum: N/S yüzlerinde Z, W/E yüzlerinde X kaydırılır.
  for (const side of sides) {
    const panelH = h - 0.62;
    const isNS = side.dir === 'N' || side.dir === 'S';
    const halfLen = (side.len - 0.3) / 2;
    // her yüzde 2 panel: sol ve sağ yarı
    for (let seg = 0; seg < 2; seg++) {
      const along = (seg === 0 ? -1 : 1) * halfLen / 2;
      const px = isNS ? along : side.cx;
      const pz = isNS ? side.cz : along;
      const panel = makeBox(
        halfLen - 0.35, panelH, 0.07, 'glass', {
          pos: [px, 0.32 + panelH / 2, pz],
          rotY: side.rotY,
          floorId: floor.id,
          castShadow: false,
          receiveShadow: false,
          name: `facade-${floor.id}-${side.dir}${seg}`,
          meta: {
            kind: 'window', id: `window-${floor.id}-${side.dir}${seg}`,
            label: `${floor.shortName} — ${sideName(side.dir)} Cephe Camı ${seg + 1}`,
            floorId: floor.id,
            info: [['Panel', 'Isı yalıtımlı çift cam'], ['Doğrama', 'Alüminyum, anodize'], ['Not', 'Tıklayın: havalandırma modu']],
          },
        },
      );
      panel.userData.facadeSide = side.dir;
      panel.userData.facadeFloor = floor.id;
      g.add(panel);
    }

    // düşey kasalar (mullion) — yüz boyunca eşit aralıkla
    const count = Math.round(side.len / mullionStep);
    for (let i = 0; i <= count; i++) {
      const t = (i / count - 0.5) * (side.len - 0.2);
      const mx = isNS ? t : side.cx;
      const mz = isNS ? side.cz : t;
      g.add(makeBox(0.1, h, 0.1, 'metalDark', {
        pos: [mx, h / 2, mz],
        floorId: floor.id, name: 'mullion',
      }));
    }
  }

  // ara kat döşeme bandı (cephede yatay çizgi)
  const bandH = 0.3;
  for (const side of sides) {
    g.add(makeBox(
      side.len + 0.16, bandH, 0.34, 'marble', {
        pos: [side.cx, bandH / 2, side.cz], rotY: side.rotY, floorId: floor.id, name: 'floor-band',
      },
    ));
  }
}

function sideName(d: string): string {
  return d === 'N' ? 'Kuzey' : d === 'S' ? 'Güney' : d === 'E' ? 'Doğu' : 'Batı';
}

/** Köşe kolonları — taşıyıcı sistemin görünen kısmı */
export function addColumns(g: THREE.Group, floor: FloorDef): void {
  const h = floor.height;
  const { width, depth } = BUILDING;
  const cols: [number, number][] = [];
  for (const x of [-width / 2, -8, 8, width / 2]) {
    for (const z of [-depth / 2, 0, depth / 2]) {
      if (Math.abs(x) < 4 && Math.abs(z) < 4) continue; // çekirdek kolonları ayrı
      cols.push([x, z]);
    }
  }
  for (const [x, z] of cols) {
    g.add(makeBox(0.42, h, 0.42, 'concreteDark', {
      pos: [x, h / 2, z], floorId: floor.id, name: 'column', collider: true,
      layer: 'structural',
      meta: {
        kind: 'furniture', id: `col-${floor.id}-${x}-${z}`, label: 'Kolon (konsept)',
        floorId: floor.id, layer: 'structural',
        info: [['Kesit', '40 × 40 cm'], ['Malzeme', 'Betonarme C30/37'], ['Not', 'Konsept gösterim']],
      },
    }));
  }
}

/** Balkonlar — her daire için, cephe dışına taşırılmış */
export function addBalconies(g: THREE.Group, floor: FloorDef): void {
  const apts = APARTMENTS.filter((a) => a.floorId === floor.id);
  const hw = BUILDING.width / 2;
  const hd = BUILDING.depth / 2;
  for (const apt of apts) {
    const isNorth = apt.quadrant === 'NW' || apt.quadrant === 'NE';
    const isWest = apt.quadrant === 'NW' || apt.quadrant === 'SW';
    const bw = 5.2, bd = 1.8;
    const px = isWest ? -7.5 : 7.5;
    const pz = isNorth ? -hd - bd / 2 : hd + bd / 2;
    const cx = isWest ? px : px;
    const cz = isNorth ? -(hd + bd / 2) + 0.05 : (hd + bd / 2) - 0.05;
    const bg = new THREE.Group();
    bg.position.set(cx, 0, cz);
    bg.name = `balcony-${apt.id}`;

    // balkon döşemesi
    bg.add(makeBox(bw, 0.16, bd, 'stone', { pos: [0, -0.08, 0], floorId: floor.id, name: 'balcony-slab' }));
    // cam korkuluk
    bg.add(makeBox(bw, 1.0, 0.03, 'glass', {
      pos: [0, 0.5, isNorth ? -bd / 2 + 0.05 : bd / 2 - 0.05], floorId: floor.id,
      castShadow: false, name: 'balcony-rail',
    }));
    // korkuluk üst profili
    bg.add(makeBox(bw, 0.06, 0.08, 'metal', {
      pos: [0, 1.02, isNorth ? -bd / 2 + 0.05 : bd / 2 - 0.05], floorId: floor.id,
    }));
    // balkon mobilyaları: sandalye + masa (yalnız örnek dairede tam detay)
    if (apt.id === 'K1-D1') {
      bg.add(makeBox(0.5, 0.42, 0.5, 'wood', { pos: [-1.6, 0.2, 0.25], floorId: floor.id }));
      bg.add(makeBox(0.5, 0.42, 0.5, 'wood', { pos: [1.6, 0.2, 0.25], floorId: floor.id }));
      bg.add(makeBox(0.7, 0.05, 0.7, 'glassDark', { pos: [0, 0.45, 0.25], floorId: floor.id }));
      bg.add(makeBox(0.05, 0.42, 0.05, 'metal', { pos: [0, 0.22, 0.25], floorId: floor.id }));
    }
    tagGroup(bg, {
      kind: 'room', id: `${apt.id}-balkon`, label: `${apt.no} — Balkon`,
      floorId: floor.id, apartmentId: apt.id, area: 8.5,
      info: [['Alan', '≈ 8.5 m²'], ['Zemin', 'Doğal taş'], ['Korkuluk', 'Temperli cam']],
    }, { floorId: floor.id, apartmentId: apt.id });
    // collider: balkon korkuluğu düşmeyi engellemez — kullanıcı isterse dışarı adım atar (bilinçli sınır)
    g.add(bg);
  }
}

/** Çatı: parapet + teras zemin + pergola */
export function addRoof(g: THREE.Group): void {
  const { width, depth } = BUILDING;
  const hw = width / 2;
  const hd = depth / 2;
  // Teras zemini — K5 kat grubunun içinde. Bu grup K5'in DÖŞEME kotunda duruyor,
  // bu yüzden teras kaplaması döşemenin ÜSTÜNE (kat yüksekliğine) oturur.
  const roofTop = FLOORS.find((f) => f.id === 'K5')!.height;
  g.add(makeBox(width + 1.4, 0.2, depth + 1.4, 'stone', {
    pos: [0, roofTop + 0.1, 0], floorId: 'K5',
    meta: { kind: 'floor', id: 'roof', label: 'Teras → çatı', floorId: 'K5' },
  }));
  // parapet — teras zemininin üstüne oturur
  for (const [w, d, x, z] of [
    [width + 1.4, 0.18, 0, -hd - 0.6],
    [width + 1.4, 0.18, 0, hd + 0.6],
    [0.18, depth + 1.4, -hw - 0.6, 0],
    [0.18, depth + 1.4, hw + 0.6, 0],
  ]) {
    g.add(makeBox(w, 1.05, d, 'marble', { pos: [x, roofTop + 0.62, z], floorId: 'K5', name: 'parapet' }));
    g.add(makeBox(w + 0.06, 0.06, d + 0.06, 'metal', { pos: [x, roofTop + 1.16, z], floorId: 'K5' }));
  }
  // pergola (teras üstü)
  for (let i = 0; i < 7; i++) {
    g.add(makeBox(0.12, 0.12, 6, 'woodDark', { pos: [-3 + i * 1.0, roofTop + 2.9, 6], floorId: 'K5' }));
  }
  g.add(makeBox(7.2, 0.14, 0.14, 'woodDark', { pos: [0, roofTop + 2.9, 3.1], floorId: 'K5' }));
}

/** Koridorlar: çekirdekten dairelere giden yollar */
export function addCorridors(g: THREE.Group, floor: FloorDef): void {
  // çevre koridor: çekirdek ile daire girişleri arası
  const mat = 'marble';
  // kuzey/güney koridor şeritleri
  g.add(makeBox(24, 0.02, 2.4, mat, {
    pos: [0, 0.012, -5.6], floorId: floor.id, name: 'corridor-n', castShadow: false,
    meta: { kind: 'room', id: `corridor-${floor.id}-N`, label: `${floor.shortName} — Koridor (Kuzey)`, floorId: floor.id, area: 57.6, info: [['Genişlik', '2.4 m'], ['Kaplama', 'Mermer']] },
  }));
  g.add(makeBox(24, 0.02, 2.4, mat, {
    pos: [0, 0.012, 5.6], floorId: floor.id, name: 'corridor-s', castShadow: false,
    meta: { kind: 'room', id: `corridor-${floor.id}-S`, label: `${floor.shortName} — Koridor (Güney)`, floorId: floor.id, area: 57.6, info: [['Genişlik', '2.4 m'], ['Kaplama', 'Mermer']] },
  }));
  // batı/doğu bağlantı koridorları
  g.add(makeBox(2.4, 0.02, 11, mat, {
    pos: [-12.5, 0.012, 0], floorId: floor.id, name: 'corridor-w', castShadow: false,
    meta: { kind: 'room', id: `corridor-${floor.id}-W`, label: `${floor.shortName} — Koridor (Batı)`, floorId: floor.id, area: 26.4, info: [['Genişlik', '2.4 m']] },
  }));
  g.add(makeBox(2.4, 0.02, 11, mat, {
    pos: [12.5, 0.012, 0], floorId: floor.id, name: 'corridor-e', castShadow: false,
    meta: { kind: 'room', id: `corridor-${floor.id}-E`, label: `${floor.shortName} — Koridor (Doğu)`, floorId: floor.id, area: 26.4, info: [['Genişlik', '2.4 m']] },
  }));

  // koridor aydınlatma armatürleri
  for (let i = -4; i <= 4; i++) {
    g.add(makeLamp(i * 2.6, floor.height - 0.15, -5.6, 0.6, floor.id, 'corridor'));
    g.add(makeLamp(i * 2.6, floor.height - 0.15, 5.6, 0.6, floor.id, 'corridor'));
  }
  // koridor duvarları (daire cephelerine bakan)
  const wallH = floor.height;
  for (const apt of APARTMENTS.filter((a) => a.floorId === floor.id)) {
    const q = APARTMENT_QUADRANTS[apt.quadrant];
    const az = q.z;
    g.add(makeWall(q.x - 6.5, az, q.x + 6.5, az, wallH, 0.16, 'plaster', {
      floorId: floor.id, apartmentId: apt.id, name: `apt-frontwall-${apt.id}`,
      meta: { kind: 'apartment', id: apt.id, label: `${apt.no} — ${apt.type}`, floorId: floor.id, apartmentId: apt.id, area: apt.area },
    }));
  }
}

/** Kat için tüm kabuk */
export function buildFloorShell(floor: FloorDef): FloorShell {
  const g = buildFloorGroup(floor);
  addSlab(g, floor);
  addColumns(g, floor);
  if (floor.kind !== 'basement') {
    addFacade(g, floor);
    addBalconies(g, floor);
    addCorridors(g, floor);
  }
  return { floor, group: g, colliders: [] };
}

export function buildRoofGroup(): THREE.Group {
  const g = new THREE.Group();
  g.name = 'roof';
  // KONUM VERİLMEZ: bu grup K5 kat grubunun İÇİNE ekleniyor ve kat grubu zaten
  // kendi kotunu (elevation) taşıyor. Burada ayrıca yükseklik yazmak kotu iki kez
  // toplayıp çatıyı gökyüzüne uçuruyordu.
  g.position.y = 0;
  g.userData.floorId = 'K5';
  g.userData.baseY = 0;
  addRoof(g);
  return g;
}

export { sideName };
