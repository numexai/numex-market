/**
 * Kütüphane ölçüleri — tek kaynak.
 *
 * Tüm modüller buradan beslenir; hiçbir modülde gömülü sihirli sayı yok.
 * Dış kabuk 32 × 22 m (kullanıcı şartı), iki kat, kat yüksekliği 3.6 m.
 */

export const LIB = {
  /** Dış ölçüler (metre) */
  width: 32,
  depth: 22,
  /** Kat yüksekliği (döşeme üstünden döşeme üstüne) */
  floorHeight: 3.6,
  /** Dış duvar kalınlığı */
  wall: 0.35,
  /** Döşeme kalınlığı */
  slab: 0.3,
  /** Giriş cephesi z = +depth/2 tarafı (güney) */
  facadeZ: 11,
  /** Cephe cam bölme aralığı */
  bayCount: 8,
} as const;

export const HALF_W = LIB.width / 2;   // 16
export const HALF_D = LIB.depth / 2;   // 11

/** Kat seviyeleri: 0 = zemin, 1 = birinci kat */
export const LEVEL = {
  ground: 0,
  upper: LIB.floorHeight,
  roof: LIB.floorHeight * 2,
} as const;

/** İç kullanılabilir alan (duvar iç yüzleri) */
export const INNER = {
  minX: -HALF_W + LIB.wall,
  maxX: HALF_W - LIB.wall,
  minZ: -HALF_D + LIB.wall,
  maxZ: HALF_D - LIB.wall,
} as const;

/** Yaya yürüyüş sınırı (iç hacim, biraz daraltılmış) */
export const WALK_BOUNDS = {
  minX: INNER.minX + 0.5,
  maxX: INNER.maxX - 0.5,
  minZ: INNER.minZ + 0.5,
  maxZ: INNER.maxZ - 0.5,
} as const;

/** İkinci kat balkonunun açık olduğu boşluk (atrium) */
export const ATRIUM = {
  minX: -9,
  maxX: 9,
  minZ: -5,
  maxZ: 4,
} as const;

/**
 * İç mekân kamera başlangıç noktaları (tek kaynak).
 *
 * NUMEX-DÜZELTME (2026-10-26): eskiden bu değerler camera.ts içinde gömülüydü
 * ve z=6.2 noktası S4 kitaplığının gövdesine, sonra z=1.6 noktası bir okuma
 * masasının dibine düşüyordu. mobilya/raf yerleşimi catalog.ts'te tanımlı
 * olduğu için başlangıç noktası da ONUNLA aynı yerde tutulur: giriş holünde,
 * bankonun önünde, hiçbir masa/rafın içinde olmayan serbest koridor.
 */
export const START_POINT = {
  // NUMEX-DÜZELTME (2026-10-26, 2. tur): z=4.9 noktası S4 kitaplığının
  // (x -4.9..+1.1, z 3.2) TAM ÖNÜNE düşüyordu. ensureFree burayı "ferah"
  // sayıyordu (raf 1.7 m ileride) ama rafın çarpışma kutusu ileri yolu
  // kapatıyordu → W tuşu hiçbir şey yapmıyordu ("WASD çalışmıyor"un kökü).
  // Yeni nokta giriş holünde: masaların (z 7.4) ve rafların arkasında,
  // bankonun karşısında; önünde salon boyunca 6+ m boş koridor var.
  ground: { x: 0, z: 8.6, yaw: Math.PI },
  // Üst kat: balkon korkuluğunun 1.5 m GERİSİNDE, balkondan atriyuma bakar.
  // (z=3.2 korkuluğa çok yakındı; ekranın alt yarısı döşeme altıyla kaplanıyordu.)
  upper: { x: 0, z: 6.4, yaw: Math.PI },
} as const;

/** İç merdiven yerleşimi (sol arka) */
export const STAIR = {
  x: -12.2,
  z0: -8.6,
  z1: -2.4,
  width: 3.0,
  steps: 20,
} as const;
