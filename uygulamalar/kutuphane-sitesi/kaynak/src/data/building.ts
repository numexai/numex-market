/**
 * Bina veri modeli — veri odaklı mimari.
 * Her kat, daire, oda ve bileşen benzersiz bir `id` taşır.
 * Geometri bu veriden üretilir; ayrıştırma/seçim/X-Ray aynı kimlikler üzerinden çalışır.
 *
 * Ölçüler metre. Bina tabanı 30 x 22 m.
 */

export const BUILDING = {
  width: 30, // X ekseni
  depth: 22, // Z ekseni
  floorHeight: 3.1, // kat yüksekliği
  slabThickness: 0.32,
  basementDepth: 3.2,
  get halfW() { return this.width / 2; },
  get halfD() { return this.depth / 2; },
} as const;

/** Kat seviyeleri: y = katın döşeme üst kotu */
export interface FloorDef {
  id: string;
  index: number; // -1 bodrum, 0 zemin, 1..5 üst katlar
  name: string;
  shortName: string;
  elevation: number; // döşeme üst kotu (m)
  height: number;
  kind: 'basement' | 'ground' | 'typical' | 'penthouse';
  apartments: number;
}

export const FLOORS: FloorDef[] = [
  {
    id: 'B1', index: -1, name: 'Bodrum Kat — Otopark & Teknik', shortName: 'B1',
    elevation: -3.2, height: 3.2, kind: 'basement', apartments: 0,
  },
  {
    id: 'Z', index: 0, name: 'Zemin Kat — Lobi & Sosyal Alan', shortName: 'Z',
    elevation: 0, height: 3.6, kind: 'ground', apartments: 0,
  },
  {
    id: 'K1', index: 1, name: '1. Kat — Daireler', shortName: 'K1',
    elevation: 3.6, height: 3.1, kind: 'typical', apartments: 4,
  },
  {
    id: 'K2', index: 2, name: '2. Kat — Daireler', shortName: 'K2',
    elevation: 6.7, height: 3.1, kind: 'typical', apartments: 4,
  },
  {
    id: 'K3', index: 3, name: '3. Kat — Daireler', shortName: 'K3',
    elevation: 9.8, height: 3.1, kind: 'typical', apartments: 4,
  },
  {
    id: 'K4', index: 4, name: '4. Kat — Daireler', shortName: 'K4',
    elevation: 12.9, height: 3.1, kind: 'typical', apartments: 4,
  },
  {
    id: 'K5', index: 5, name: '5. Kat — Çatı Dubleksleri & Teras', shortName: 'K5',
    elevation: 16.0, height: 3.4, kind: 'penthouse', apartments: 2,
  },
];

export const ROOF_ELEVATION = 19.4; // K5 üst kotu

/** Daire tanımı */
export interface ApartmentDef {
  id: string; // ör. "K1-D1"
  floorId: string;
  no: string; // kapı numarası "101"
  type: string; // "3+1", "2+1", "4+1 dubleks"
  area: number; // brüt m²
  netArea: number;
  rooms: string[];
  quadrant: 'NW' | 'NE' | 'SW' | 'SE';
  balcony: boolean;
}

/** Dairelerin kat üzerindeki yerleşimi: çekirdek ortada, 4 daire köşelerde */
export const APARTMENT_QUADRANTS: Record<'NW' | 'NE' | 'SW' | 'SE', { x: number; z: number }> = {
  NW: { x: -8.0, z: -5.5 },
  NE: { x: 8.0, z: -5.5 },
  SW: { x: -8.0, z: 5.5 },
  SE: { x: 8.0, z: 5.5 },
};

/** 18 daireyi üret */
export function buildApartments(): ApartmentDef[] {
  const list: ApartmentDef[] = [];
  const quads: Array<'NW' | 'NE' | 'SW' | 'SE'> = ['NW', 'NE', 'SW', 'SE'];
  for (let f = 1; f <= 4; f++) {
    quads.forEach((q, qi) => {
      const isCorner = qi % 2 === 0;
      list.push({
        id: `K${f}-D${qi + 1}`,
        floorId: `K${f}`,
        no: `${f}${(qi + 1).toString().padStart(2, '0')}`,
        type: isCorner ? '3+1' : '2+1',
        area: isCorner ? 142 : 98,
        netArea: isCorner ? 118 : 81,
        rooms: isCorner
          ? ['Salon', 'Mutfak', 'Yatak Odası 1', 'Yatak Odası 2', 'Yatak Odası 3', 'Banyo', 'Antre', 'Balkon']
          : ['Salon', 'Mutfak', 'Yatak Odası 1', 'Yatak Odası 2', 'Banyo', 'Antre', 'Balkon'],
        quadrant: q,
        balcony: true,
      });
    });
  }
  // 5. kat: 2 çatı dubleksi
  list.push({
    id: 'K5-D1', floorId: 'K5', no: '501', type: '4+1 Dubleks', area: 248, netArea: 205,
    rooms: ['Salon (çift yükseklik)', 'Mutfak', 'Yatak Odası 1', 'Yatak Odası 2', 'Yatak Odası 3', 'Yatak Odası 4', 'Banyo 1', 'Banyo 2', 'Antre', 'Teras'],
    quadrant: 'NW', balcony: true,
  });
  list.push({
    id: 'K5-D2', floorId: 'K5', no: '502', type: '4+1 Dubleks', area: 248, netArea: 205,
    rooms: ['Salon (çift yükseklik)', 'Mutfak', 'Yatak Odası 1', 'Yatak Odası 2', 'Yatak Odası 3', 'Yatak Odası 4', 'Banyo 1', 'Banyo 2', 'Antre', 'Teras'],
    quadrant: 'SE', balcony: true,
  });
  return list;
}

export const APARTMENTS = buildApartments();

/** Çekirdek (merdiven + 2 asansör + yangın çıkışı) ölçüleri — bina ortasında */
export const CORE = {
  x: 0,
  z: 0,
  width: 7.0,
  depth: 6.0,
  elevatorA: { x: -1.9, z: 0.4, w: 1.7, d: 1.7 },
  elevatorB: { x: 1.9, z: 0.4, w: 1.7, d: 1.7 },
  stair: { x: 0, z: -1.9, w: 4.2, d: 2.0 },
} as const;

/** Örnek 3+1 daire iç mekân oda listesi (K1-D1 = salonu detaylı modellenen daire) */
export const HERO_APARTMENT_ID = 'K1-D1';

export interface RoomDef {
  id: string;
  name: string;
  x: number; z: number; // merkez (daire yerel koordinatı)
  w: number; d: number;
  height: number;
  area: number;
}

/** Örnek daire yerel planı: 0,0 = daire merkezi. Toplam ~12 x 10.5 m */
export const HERO_ROOMS: RoomDef[] = [
  { id: 'salon', name: 'Salon', x: -3.0, z: 1.4, w: 6.0, d: 5.4, height: 2.85, area: 32.4 },
  { id: 'mutfak', name: 'Mutfak', x: 2.4, z: -2.2, w: 4.6, d: 3.4, height: 2.85, area: 15.6 },
  { id: 'yatak1', name: 'Yatak Odası 1 (Ebeveyn)', x: 2.6, z: 2.6, w: 4.2, d: 4.4, height: 2.85, area: 18.5 },
  { id: 'yatak2', name: 'Yatak Odası 2', x: -3.4, z: -3.4, w: 3.8, d: 3.6, height: 2.85, area: 13.7 },
  { id: 'yatak3', name: 'Yatak Odası 3', x: 0.9, z: -4.3, w: 2.6, d: 2.6, height: 2.85, area: 6.8 },
  { id: 'banyo', name: 'Banyo', x: -0.8, z: -3.9, w: 2.2, d: 2.2, height: 2.85, area: 4.8 },
  { id: 'antre', name: 'Antre', x: -0.4, z: 0.0, w: 2.4, d: 3.0, height: 2.85, area: 7.2 },
  { id: 'balkon', name: 'Balkon', x: -3.0, z: 4.9, w: 5.6, d: 1.8, height: 2.85, area: 10.1 },
];

/** Materyal anahtarları — ortak havuz (tekrar kullanım) */
export type MaterialKey =
  | 'concrete' | 'concreteDark' | 'plaster' | 'glass' | 'glassDark'
  | 'wood' | 'woodDark' | 'metal' | 'metalDark' | 'marble' | 'stone'
  | 'fabric' | 'fabricLight' | 'grass' | 'asphalt' | 'foliage' | 'foliageDark'
  | 'emissiveWarm' | 'emissiveCool' | 'water' | 'ceramic' | 'screen';

/** X-Ray katman anahtarları */
export type SystemLayer =
  | 'architectural' | 'structural' | 'electrical'
  | 'water' | 'waste' | 'hvac' | 'fire';

export const SYSTEM_LAYERS: { key: SystemLayer; label: string; color: string; note: string }[] = [
  { key: 'architectural', label: 'Mimari', color: '#9fb3c8', note: 'Duvar, döşeme, cephe' },
  { key: 'structural', label: 'Taşıyıcı Sistem (konsept)', color: '#f0a04b', note: 'Kolon–kiriş ızgarası, perde duvar' },
  { key: 'electrical', label: 'Elektrik', color: '#f5d547', note: 'Kablo güzergâhları, pano' },
  { key: 'water', label: 'Temiz Su', color: '#4ea8de', note: 'Besleme hatları, kolon' },
  { key: 'waste', label: 'Atık Su', color: '#9d8189', note: 'Pis su kolonları, tahliye' },
  { key: 'hvac', label: 'Havalandırma', color: '#6ee7b7', note: 'Kanal şaftı, menfez' },
  { key: 'fire', label: 'Yangın Güvenliği (konsept)', color: '#ef476f', note: 'Sprinkler, yangın çıkışı' },
];
