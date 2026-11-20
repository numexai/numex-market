// Numex Liman — tüm sabitler. Motor bu dosyadan başka yerde sayı uydurmaz.

export const DEFAULT_SEED = 42;
export const FLEET_SIZE = 60;

export const SIZES = { 20: { teu: 1, w: 1, h: 1 }, 40: { teu: 2, w: 2, h: 1 } };

export const TYPES = {
  general: { label: 'Genel Yük', color: '#3d7ea6', dg: false, reefer: false },
  reefer: { label: 'Soğutmalı (Reefer)', color: '#2fa89e', dg: false, reefer: true },
  dangerous: { label: 'Tehlikeli (DG)', color: '#d4573f', dg: true, reefer: false },
  heavy: { label: 'Ağır Sanayi', color: '#c9973f', dg: false, reefer: false },
  empty: { label: 'Boş Konteyner', color: '#6f7d8c', dg: false, reefer: false },
};

export const STATUS = {
  ship: { label: 'Gemide', color: '#4a7ea8' },
  moving: { label: 'Taşınıyor', color: '#e0a33c' },
  yard: { label: 'Sahada', color: '#3fae7a' },
  dispatched: { label: 'Sevk Edildi', color: '#8b6bb1' },
  waiting: { label: 'Bekliyor (yer yok)', color: '#c9553f' },
};

export const CRANE_TYPES = [
  { id: 'CR-1', capTon: 40, speed: 1.15 },
  { id: 'CR-2', capTon: 30, speed: 1.0 },
  { id: 'CR-3', capTon: 25, speed: 0.85 },
];

export const TRANSPORT_TYPES = [
  { id: 'TR-1', capTon: 35, speed: 1.0 },
  { id: 'TR-2', capTon: 35, speed: 1.1 },
  { id: 'TR-3', capTon: 28, speed: 0.9 },
  { id: 'TR-4', capTon: 32, speed: 1.05 },
];

// 6 depolama bölgesi. Kapasiteler 20/40 ayak slot sayısıdır.
export const ZONE_TYPES = [
  // NUMEX-DÜZELTME (2026-11-20): Depolama kapasiteleri 60 konteynerin tamamını alacak şekilde dengelendi (toplam 66 slot); 3 kat sınırı yüzünden bölgeler erken doluyordu.
  { id: 'A', label: 'Genel A', capacity: 14, maxStack: 5, dgOk: false, reeferOk: false, x: 2, y: 2 },
  { id: 'B', label: 'Genel B', capacity: 14, maxStack: 5, dgOk: false, reeferOk: false, x: 8, y: 2 },
  { id: 'C', label: 'Soğutmalı C', capacity: 9, maxStack: 4, dgOk: false, reeferOk: true, x: 14, y: 2 },
  { id: 'D', label: 'Tehlikeli D', capacity: 8, maxStack: 4, dgOk: true, reeferOk: false, x: 2, y: 7 },
  { id: 'E', label: 'Ağır E', capacity: 10, maxStack: 3, dgOk: false, reeferOk: false, x: 8, y: 7 },
  { id: 'F', label: 'Genel F', capacity: 12, maxStack: 5, dgOk: false, reeferOk: false, x: 14, y: 7 },
];

// Ağır yük eşiği (ton) — istif güvenlik kuralı: ağır altta, hafif üstte.
export const HEAVY_TON = 24;
export const DG_TON_LIMIT = 26;

export const DURATIONS = {
  // saniye cinsinden; gerçek zaman × speed çarpanı ile akar
  cranePickBase: 5.5,
  cranePerTon: 0.12,
  cranePer40: 1.2,
  transportBase: 6,
  transportDistance: 0.55,
  minJobTime: 4,
};

export const SPEEDS = [0.5, 1, 2, 4];
export const TICK_CAP_MS = 100; // sekme arkaplandığında dev adım atmayı engelle

export const SCENARIOS = {
  A: { label: 'A — Normal Operasyon', desc: 'Bütün vinçler çalışıyor.' },
  B: { label: 'B — Vinç Arızası', desc: 'Vinç CR-2 devre dışı; bekleyen işler diğer vinçlere dağıtılır.' },
  C: { label: 'C — Saha Doluluğu', desc: 'D bölgesi dolar; yeni yükler uygun başka alana yönlendirilir.' },
  D: { label: 'D — Acil Yük', desc: 'Yüksek öncelikli konteyner gelir; plan öne alınır.' },
};

export const SCENE = {
  tileW: 46,
  tileH: 23,
  originX: 120,
  originY: 120,
  seaTop: 0,
  seaBottom: 190,
};
