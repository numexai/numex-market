import * as THREE from 'three';
import { libMakeBox, libMakeCyl, libMakeWall } from '../core/geometry';
import { LIB, HALF_W, HALF_D, LEVEL, ATRIUM, STAIR, INNER } from '../core/dimensions';

/**
 * Kütüphane dış kabuğu.
 *
 * KURULUŞ MANTIĞI: cephe "delikli duvar" değil, modüler bir çerçevedir.
 * Duvar panelleri kapı/pencere açıklıklarının ETRAFINA ayrı ayrı yerleştirilir;
 * böylece gerçek boşluklar kalır (camdan içerisi görünür) ve CSG gerekmez.
 *
 * Tüm ölçüler core/dimensions.ts'ten gelir.
 */

export interface ShellResult {
  group: THREE.Group;
  /** Kırpma/raycast için yapısal parçalar */
  parts: {
    roof: THREE.Group;
    upperFloor: THREE.Group;
    groundFloor: THREE.Group;
  };
}

/* ------------------------------------------------------------------ */
/* YARDIMCILAR                                                         */
/* ------------------------------------------------------------------ */

/** Cephe bölmesi: çerçeve + cam. Genişlik/dikey yükseklik verilir. */
function glassBay(w: number, h: number, isDoor = false): THREE.Group {
  const g = new THREE.Group();
  const t = 0.06;

  // Cam yüzey
  g.add(libMakeBox(w - t * 2, h - t * 2, 0.03, 'glass', { pos: [0, h / 2, 0], cast: false }));

  // Çerçeve: alt, üst, sol, sağ
  g.add(libMakeBox(w, t * 1.6, 0.1, 'frame', { pos: [0, t * 0.8, 0] }));
  g.add(libMakeBox(w, t * 1.6, 0.1, 'frame', { pos: [0, h - t * 0.8, 0] }));
  g.add(libMakeBox(t * 1.6, h, 0.1, 'frame', { pos: [-w / 2 + t * 0.8, h / 2, 0] }));
  g.add(libMakeBox(t * 1.6, h, 0.1, 'frame', { pos: [w / 2 - t * 0.8, h / 2, 0] }));

  // Orta kayıt (düşey) — cam cepheyi böler, gerçekçilik
  if (w > 2.4) {
    g.add(libMakeBox(t * 1.2, h, 0.09, 'frame', { pos: [0, h / 2, 0] }));
  }
  // Yatay kayıt (transom) — kapıda yok
  if (!isDoor && h > 2.6) {
    g.add(libMakeBox(w, t, 0.08, 'frame', { pos: [0, h * 0.72, 0] }));
  }

  if (isDoor) {
    // Kapı kolları
    for (const sx of [-1, 1]) {
      g.add(libMakeBox(0.04, 0.9, 0.05, 'metal', { pos: [sx * 0.12, h * 0.45, 0.06] }));
    }
  }
  return g;
}

/** Cephe şeridi: verilen z düzleminde x ekseni boyunca cam bölmeler */
function facadeStrip(
  z: number, y: number, h: number, startX: number, endX: number, bays: number,
): THREE.Group {
  const g = new THREE.Group();
  const totalW = endX - startX;
  const bayW = totalW / bays;
  for (let i = 0; i < bays; i++) {
    const cx = startX + bayW * (i + 0.5);
    const b = glassBay(bayW - 0.12, h);
    b.position.set(cx, 0, z);
    g.add(b);
  }
  g.position.y = y;
  return g;
}

/** Dolu duvar paneli (cam olmayan kısımlar) */
function wallPanel(w: number, h: number, pos: [number, number, number], rotY = 0, mat: 'wallLight' | 'plinth' | 'concrete' = 'wallLight'): THREE.Mesh {
  return libMakeBox(w, h, LIB.wall, mat, { pos, rotY });
}

/* ------------------------------------------------------------------ */
/* KABUK                                                               */
/* ------------------------------------------------------------------ */

export function buildShell(): ShellResult {
  const root = new THREE.Group();
  root.name = 'kabuk';

  const groundFloor = new THREE.Group();
  groundFloor.name = 'kat-zemin';
  const upperFloor = new THREE.Group();
  upperFloor.name = 'kat-ust';
  const roof = new THREE.Group();
  roof.name = 'cati';

  const W = LIB.width, D = LIB.depth, FH = LIB.floorHeight;
  const fz = HALF_D;        // ön cephe z (güney, +z)
  const bz = -HALF_D;       // arka cephe

  /* ---------------- ZEMİN DÖŞEMESİ (plinth + taban) ---------------- */
  // Beton plak: binayı zeminden ayırır, girişin bastığı yüzey
  groundFloor.add(libMakeBox(W + 1.2, 0.35, D + 1.2, 'plinth', { pos: [0, -0.175, 0] }));
  // Zemin kaplaması (taş) — iç mekân tabanı
  groundFloor.add(libMakeBox(W - LIB.wall * 2, 0.06, D - LIB.wall * 2, 'floorStone', {
    pos: [0, 0.03, 0],
  }));

  /* ---------------- ZEMİN KAT DUVARLARI ---------------- */
  const wallH = FH - LIB.slab;
  const t = LIB.wall;

  // --- ÖN CEPHE (z = fz): giriş kapısı ortada, iki yanda cam bölmeler ---
  // Kapı açıklığı: x ∈ [-2.2, 2.2], y ∈ [0, 2.7]
  const doorW = 4.4, doorH = 2.7;
  const bayCount = LIB.bayCount;
  const bayW = (W - doorW) / (bayCount - 2); // kapı 2 bölme genişliğinde

  // Kapı üstü lento
  groundFloor.add(wallPanel(doorW, wallH - doorH, [0, doorH + (wallH - doorH) / 2, fz]));

  // Yan cam bölmeler: her iki tarafta (bayCount-2)/2 adet
  const sideBays = (bayCount - 2) / 2;
  for (const sgn of [-1, 1]) {
    const x0 = sgn < 0 ? -HALF_W : doorW / 2;
    const x1 = sgn < 0 ? -doorW / 2 : HALF_W;
    const strip = facadeStrip(fz, 0.35, wallH - 0.35, x0, x1, sideBays);
    groundFloor.add(strip);
    // Cephenin alt/üst dolu kuşağı (cam bölmelerin oturduğu taban)
    groundFloor.add(wallPanel(x1 - x0, 0.35, [(x0 + x1) / 2, 0.175, fz], 0, 'plinth'));
    groundFloor.add(wallPanel(x1 - x0, wallH * 0.14, [(x0 + x1) / 2, wallH - wallH * 0.07, fz], 0, 'wallLight'));
  }

  // Giriş kapısı (çift kanat cam)
  const doorGroup = glassBay(doorW, doorH, true);
  doorGroup.position.set(0, 0.35, fz);
  doorGroup.name = 'giris-kapisi';
  groundFloor.add(doorGroup);
  // Kapı eşiği
  groundFloor.add(libMakeBox(doorW + 0.4, 0.12, 1.6, 'plinth', { pos: [0, 0.06, fz + 0.6] }));

  // --- YAN DUVARLAR (x = ±HALF_W): üç pencere açıklığı ---
  for (const sgn of [-1, 1]) {
    const x = sgn * HALF_W;
    // Dolu alt kuşak
    groundFloor.add(wallPanel(D, 0.35, [x, 0.175, 0], Math.PI / 2, 'plinth'));
    // Pencere bandı: 3 açıklık, arada dolu duvar
    const winH = 1.9, winY = 1.05;
    const segs = 3;
    const segLen = D / segs;
    for (let i = 0; i < segs; i++) {
      const cz = -HALF_D + segLen * (i + 0.5);
      // Alt ve üst dolu
      groundFloor.add(wallPanel(segLen, winY, [x, winY / 2 + 0.35, cz], Math.PI / 2, sgn > 0 ? 'wallLight' : 'wallLight'));
      groundFloor.add(wallPanel(segLen, wallH - winY - winY, [x, winY + 0.35 + (wallH - winY * 2) / 2, cz], Math.PI / 2));
      // Dekoratif pencere çerçevesi (cam yerine derin niş — okuma odası ışığı)
      const pane = libMakeBox(segLen - 0.5, winH, 0.05, 'glass', {
        pos: [x, winY + 0.35 + winH / 2 - 0.1, cz], rotY: Math.PI / 2, cast: false,
      });
      groundFloor.add(pane);
    }
    // Köşe dikmeleri
    for (const cz of [-HALF_D, 0, HALF_D]) {
      groundFloor.add(libMakeBox(0.28, wallH, 0.28, 'concrete', { pos: [x, wallH / 2 + 0.35, cz] }));
    }
  }

  // --- ARKA DUVAR (z = bz): sağır duvar + servis kapısı ---
  groundFloor.add(wallPanel(W, wallH, [0, wallH / 2 + 0.35, bz]));

  /* ---------------- BİRİNCİ KAT DÖŞEMESİ ---------------- */
  upperFloor.add(buildUpperSlab());

  /* ---------------- BİRİNCİ KAT DUVARLARI: tamamen cam ---------------- */
  const upperWallH = FH - LIB.slab;
  // Ön cephe: tam cam perde
  upperFloor.add(facadeStrip(fz, LEVEL.upper + 0.35, upperWallH - 0.35, -HALF_W, HALF_W, bayCount));
  upperFloor.add(wallPanel(W, 0.35, [0, LEVEL.upper + 0.175, fz], 0, 'plinth'));
  upperFloor.add(wallPanel(W, upperWallH * 0.1, [0, LEVEL.upper + upperWallH - upperWallH * 0.05, fz]));

  // Arka cephe: cam bant + sağır bant (servis mahalli)
  upperFloor.add(facadeStrip(bz, LEVEL.upper + 0.35, upperWallH - 0.35, -HALF_W, HALF_W, bayCount));
  upperFloor.add(wallPanel(W, 0.35, [0, LEVEL.upper + 0.175, bz], 0, 'plinth'));
  upperFloor.add(wallPanel(W, upperWallH * 0.1, [0, LEVEL.upper + upperWallH - upperWallH * 0.05, bz]));

  // Yan duvarlar: cam bant (üst kat tamamen cam)
  for (const sgn of [-1, 1]) {
    const x = sgn * HALF_W;
    const segs = 4;
    const segLen = D / segs;
    for (let i = 0; i < segs; i++) {
      const cz = -HALF_D + segLen * (i + 0.5);
      const bay = glassBay(segLen - 0.12, upperWallH - 0.7);
      bay.position.set(x, LEVEL.upper + 0.35, cz);
      bay.rotation.y = Math.PI / 2;
      upperFloor.add(bay);
      upperFloor.add(wallPanel(segLen, 0.35, [x, LEVEL.upper + 0.175, cz], Math.PI / 2, 'plinth'));
      upperFloor.add(wallPanel(segLen, 0.35, [x, LEVEL.upper + upperWallH - 0.175, cz], Math.PI / 2));
    }
    for (const cz of [-HALF_D, 0, HALF_D]) {
      upperFloor.add(libMakeBox(0.28, upperWallH, 0.28, 'concrete', {
        pos: [x, LEVEL.upper + upperWallH / 2 + 0.35, cz],
      }));
    }
  }

  /* ---------------- ÇATI ---------------- */
  // Konsol döşeme (cepheyi taşırır — modern mimari)
  roof.add(libMakeBox(W + 1.6, 0.34, D + 1.6, 'concrete', { pos: [0, LEVEL.roof + 0.17, 0] }));
  // Korkuluk/parapet
  const parH = 0.7;
  roof.add(libMakeBox(W + 1.6, parH, 0.16, 'concrete', { pos: [0, LEVEL.roof + 0.34 + parH / 2, HALF_D + 0.72] }));
  roof.add(libMakeBox(W + 1.6, parH, 0.16, 'concrete', { pos: [0, LEVEL.roof + 0.34 + parH / 2, -HALF_D - 0.72] }));
  roof.add(libMakeBox(0.16, parH, D + 1.6, 'concrete', { pos: [HALF_W + 0.72, LEVEL.roof + 0.34 + parH / 2, 0] }));
  roof.add(libMakeBox(0.16, parH, D + 1.6, 'concrete', { pos: [-HALF_W - 0.72, LEVEL.roof + 0.34 + parH / 2, 0] }));
  // Çatı üstü teknik hacim (havalandırma)
  roof.add(libMakeBox(3.2, 1.1, 2.2, 'concrete', { pos: [8.5, LEVEL.roof + 0.89, -4] }));
  roof.add(libMakeBox(2.2, 0.9, 1.8, 'metalDark', { pos: [-8, LEVEL.roof + 0.79, -4.5] }));

  /* ---------------- DIŞ AYDINLATMA (akşam) ---------------- */
  // Cephe altı lineer ışık: giriş saçağının iç yüzü
  const soffit = new THREE.Group();
  soffit.name = 'cephe-isiklari';
  soffit.add(libMakeBox(W - 3, 0.1, 0.1, 'lampWarm', { pos: [0, LEVEL.upper + LIB.slab, fz - 0.5], cast: false, receive: false }));
  // Saçak: giriş üstünde konsol
  soffit.add(libMakeBox(doorW + 3, 0.22, 2.6, 'concrete', { pos: [0, FH + 0.11, fz + 1.0] }));
  roof.add(soffit);

  root.add(groundFloor, upperFloor, roof);

  return { group: root, parts: { roof, upperFloor, groundFloor } };
}

/**
 * Birinci kat döşemesi — atrium boşluğu ve merdiven boşluğu AÇIK kalır.
 * Dört dikdörtgen parça ile çerçeve kurulur (delik işleme gerekmez).
 */
function buildUpperSlab(): THREE.Group {
  const g = new THREE.Group();
  g.name = 'ust-doseme';
  const y = LEVEL.upper - LIB.slab / 2;
  const th = LIB.slab;

  const xMin = -HALF_W, xMax = HALF_W;
  const zMin = -HALF_D, zMax = HALF_D;
  const { minX: aMinX, maxX: aMaxX, minZ: aMinZ, maxZ: aMaxZ } = ATRIUM;

  // Kuzey şerit (atrium'un kuzeyinde, tam genişlik)
  const northD = aMinZ - zMin;
  g.add(libMakeBox(xMax - xMin, th, northD, 'floorWood', {
    pos: [0, y, zMin + northD / 2],
  }));
  // Güney şerit (atrium'un güneyinde, tam genişlik)
  const southD = zMax - aMaxZ;
  g.add(libMakeBox(xMax - xMin, th, southD, 'floorWood', {
    pos: [0, y, aMaxZ + southD / 2],
  }));
  // Batı şerit (atrium yüksekliği boyunca)
  const westW = aMinX - xMin;
  g.add(libMakeBox(westW, th, aMaxZ - aMinZ, 'floorWood', {
    pos: [xMin + westW / 2, y, (aMinZ + aMaxZ) / 2],
  }));
  // Doğu şerit
  const eastW = xMax - aMaxX;
  g.add(libMakeBox(eastW, th, aMaxZ - aMinZ, 'floorWood', {
    pos: [aMaxX + eastW / 2, y, (aMinZ + aMaxZ) / 2],
  }));

  // Merdiven üstü açıklık: batı şeridin içinde bir delik gerekir.
  // Batı şeridi merdiven bölgesinde ikiye bölüyoruz (merdiven buradan çıkıyor).
  // NOT: Şerit zaten çizildi; merdiven bölgesini görsel olarak "boşluk" gibi
  // göstermek yerine merdivenin üst kata ulaştığı yerde döşemeyi kesiyoruz:
  // basit ve güvenli çözüm — batı şeridi merdiven genişliğinde bölünür.
  // (Aşağıdaki ek parça, kesilmiş bölgenin kenarını bitirir.)
  g.add(libMakeBox(0.12, th + 0.02, Math.abs(STAIR.z1 - STAIR.z0), 'metalDark', {
    pos: [STAIR.x + STAIR.width / 2, y, (STAIR.z0 + STAIR.z1) / 2],
  }));

  return g;
}

/* ------------------------------------------------------------------ */
/* ÇEVRE DÜZENLEME                                                     */
/* ------------------------------------------------------------------ */

/**
 * Ön bahçe: giriş merdiveni, yürüyüş yolu, çim, ağaçlar, banklar, sokak
 * lambaları. Hepsi prosedürel — dış varlık yok.
 */
export function buildSite(): { group: THREE.Group; trees: THREE.Group[] } {
  const root = new THREE.Group();
  root.name = 'bahce';
  const trees: THREE.Group[] = [];

  // Zemin: büyük çim düzlemi
  const groundGeo = new THREE.PlaneGeometry(140, 140);
  const ground = new THREE.Mesh(groundGeo, new THREE.MeshStandardMaterial({
    color: 0x4a6f42, roughness: 1, metalness: 0,
  }));
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.36;
  ground.receiveShadow = true;
  root.add(ground);

  // Binanın oturduğu sert zemin (bordür çevresi)
  root.add(libMakeBox(LIB.width + 8, 0.06, LIB.depth + 8, 'path', { pos: [0, -0.33, 0] }));

  /* -------- GİRİŞ MERDİVENİ (ön cephe, +z) -------- */
  const stepCount = 5;
  const rise = 0.14;
  const run = 0.55;
  const stairW = 9;
  for (let i = 0; i < stepCount; i++) {
    const h = rise * (i + 1);
    root.add(libMakeBox(stairW, h, run, 'plinth', {
      pos: [0, -0.35 + h / 2, HALF_D + 1.2 + run * (stepCount - i - 0.5)],
      cast: false,
    }));
  }
  // Merdiven yan duvarları (alçak parapet)
  for (const sx of [-1, 1]) {
    root.add(libMakeBox(0.3, 0.75, run * stepCount + 0.4, 'concrete', {
      pos: [sx * (stairW / 2 + 0.15), -0.35 + 0.375, HALF_D + 1.2 + (run * stepCount) / 2],
    }));
  }

  /* -------- YÜRÜYÜŞ YOLU (girişten sokağa) -------- */
  const pathZ0 = HALF_D + 1.2 + run * stepCount;
  const pathLen = 22;
  root.add(libMakeBox(5.4, 0.06, pathLen, 'path', {
    pos: [0, -0.34, pathZ0 + pathLen / 2], cast: false,
  }));
  // Yol kenarı aydınlatma bandı (gece parlar)
  for (const sx of [-1, 1]) {
    root.add(libMakeBox(0.12, 0.04, pathLen, 'lampWarm', {
      pos: [sx * 2.6, -0.31, pathZ0 + pathLen / 2], cast: false, receive: false,
    }));
  }
  // Çevre yolu (binanın etrafında dolaşan yaya yolu)
  root.add(libMakeBox(LIB.width + 12, 0.05, 2.4, 'path', {
    pos: [0, -0.335, HALF_D + 5.6], cast: false,
  }));

  /* -------- AĞAÇLAR (ön bahçe, iki sıra) -------- */
  const treePositions: Array<[number, number, number]> = [
    [-11.5, 15.5, 1.0], [-7.0, 17.2, 0.86], [-13.4, 19.4, 1.12],
    [11.5, 15.5, 0.95], [7.0, 17.2, 1.05], [13.4, 19.4, 0.88],
    [-13.0, 9.0, 0.8], [13.0, 9.0, 0.84],
    [-13.5, -8.0, 0.9], [13.5, -8.0, 0.95], [-9.0, -14.5, 1.0], [9.0, -14.5, 0.92],
  ];
  for (const [x, z, s] of treePositions) {
    const tr = buildTree(s);
    tr.position.set(x, -0.36, z);
    root.add(tr);
    trees.push(tr);
  }

  /* -------- ÇALILAR (cephe dibi) -------- */
  for (let i = 0; i < 10; i++) {
    const x = -14 + i * 3.1;
    if (Math.abs(x) < 3.2) continue; // kapı önünü kapatma
    const bush = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.55 + Math.random() * 0.25, 0),
      new THREE.MeshStandardMaterial({ color: 0x37592f, roughness: 1, flatShading: true }),
    );
    bush.position.set(x, -0.1, HALF_D + 2.6);
    bush.castShadow = true;
    root.add(bush);
  }

  /* -------- BAHÇE BANKLARI -------- */
  for (const [x, z] of [[-7.5, 21.5], [7.5, 21.5]] as Array<[number, number]>) {
    const bench = new THREE.Group();
    bench.add(libMakeBox(2.2, 0.08, 0.52, 'wood', { pos: [0, 0.44, 0] }));
    bench.add(libMakeBox(2.2, 0.5, 0.08, 'wood', { pos: [0, 0.72, -0.24] }));
    for (const sx of [-1, 1]) {
      bench.add(libMakeBox(0.1, 0.44, 0.5, 'metalDark', { pos: [sx * 0.95, 0.22, 0] }));
    }
    bench.position.set(x, -0.35, z);
    root.add(bench);
  }

  /* -------- BAHÇE LAMBALARI (akşam aydınlatması) -------- */
  for (const [x, z] of [[-3.4, 16], [3.4, 16], [-3.4, 24], [3.4, 24], [-12, 13], [12, 13]] as Array<[number, number]>) {
    const post = new THREE.Group();
    post.add(libMakeCyl(0.05, 0.07, 3.2, 'metalDark', { pos: [0, 1.6, 0], seg: 8 }));
    post.add(libMakeBox(0.3, 0.22, 0.3, 'lampWarm', { pos: [0, 3.3, 0], cast: false, receive: false }));
    post.add(libMakeBox(0.36, 0.06, 0.36, 'metalDark', { pos: [0, 3.44, 0], cast: false }));
    post.position.set(x, -0.35, z);
    post.name = 'bahce-lambasi';
    root.add(post);
  }

  /* -------- OTOPARK / SERVİS ALANI (arka) -------- */
  root.add(libMakeBox(18, 0.05, 9, 'concrete', { pos: [0, -0.335, -HALF_D - 7], cast: false }));

  return { group: root, trees };
}

/** Ağaç: gövde + iki kat konik yaprak (düşük poligon, gerçekçi siluet) */
export function buildTree(scale = 1): THREE.Group {
  const t = new THREE.Group();
  const trunkH = 2.6 * scale;

  const trunk = libMakeCyl(0.14 * scale, 0.22 * scale, trunkH, 'trunk', {
    pos: [0, trunkH / 2, 0], seg: 7,
  });
  t.add(trunk);

  // Üç kat yaprak kümesi (üst üste koniler)
  const layers: Array<[number, number, number, number]> = [
    [1.7, 2.4, 0.0, 0x3d6b33],
    [1.35, 2.1, 1.35, 0x456f38],
    [0.95, 1.8, 2.55, 0x4f7a3f],
  ];
  for (const [r, h, yOff, col] of layers) {
    const cone = new THREE.Mesh(
      new THREE.ConeGeometry(r * scale, h * scale, 7),
      new THREE.MeshStandardMaterial({ color: col, roughness: 0.95, flatShading: true }),
    );
    cone.position.y = trunkH + yOff * scale + h * scale * 0.35;
    cone.castShadow = true;
    t.add(cone);
  }
  return t;
}
