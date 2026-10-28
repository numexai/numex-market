import * as THREE from 'three';
import { libMakeBox, libMakeCyl } from '../core/geometry';
import { LEVEL, ATRIUM, STAIR, INNER, WALK_BOUNDS } from '../core/dimensions';
import { DESKS, type DeskSlot } from '../data/catalog';

/**
 * İç mekân mobilyası: okuma masaları, sandalyeler, danışma bankosu,
 * bilgisayar istasyonları, iç merdiven, balkon korkuluğu, çalışma lambaları.
 *
 * Her mobilya kendi grubunda döner: konumu (x,z) ve katı (floor) verilir,
 * geometri yerel koordinatta kurulur. Böylece aynı masa 7 kez kopyalanabilir.
 */

export interface InteriorPickup {
  group: THREE.Group;
  meta: { kind: 'desk' | 'counter' | 'computer' | 'stair'; id: string; label: string; info: Array<[string, string]> };
}

/** Okuma masası: 1.8 × 0.9 tabla + 4 ayak + üstünde çalışma lambası + 2 sandalye */
function buildDesk(slot: DeskSlot): THREE.Group {
  const g = new THREE.Group();
  const y0 = slot.floor === 0 ? LEVEL.ground : LEVEL.upper;
  const topY = 0.75;
  const W = 1.9, D = 0.95;

  // Tabla
  g.add(libMakeBox(W, 0.06, D, 'desk', { pos: [0, topY, 0] }));

  // Ayaklar (metal, ince)
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      g.add(libMakeCyl(0.028, 0.032, topY, 'metalDark', {
        pos: [sx * (W / 2 - 0.14), topY / 2, sz * (D / 2 - 0.14)], seg: 8,
      }));
    }
  }

  // Masa üstü çalışma lambası: direk + kol + karpuz başlık + ışık paneli
  g.add(libMakeCyl(0.02, 0.025, 0.62, 'metalDark', { pos: [-W / 2 + 0.22, topY + 0.31, -D / 2 + 0.18], seg: 8 }));
  g.add(libMakeBox(0.42, 0.03, 0.03, 'metalDark', {
    pos: [-W / 2 + 0.42, topY + 0.61, -D / 2 + 0.18],
  }));
  const shade = new THREE.Mesh(
    new THREE.ConeGeometry(0.16, 0.17, 12, 1, true),
    new THREE.MeshStandardMaterial({ color: 0x1f5f57, roughness: 0.55, metalness: 0.35, side: THREE.DoubleSide }),
  );
  shade.position.set(-W / 2 + 0.62, topY + 0.55, -D / 2 + 0.18);
  shade.castShadow = true;
  g.add(shade);
  // Ampul yüzeyi (emissive) — çalışma lambasının ışığı buradan okunur
  g.add(libMakeBox(0.13, 0.02, 0.13, 'lampWarm', {
    pos: [-W / 2 + 0.62, topY + 0.47, -D / 2 + 0.18], cast: false, receive: false,
  }));

  // Masada açık kitap + kalem (yakın planda canlılık)
  g.add(libMakeBox(0.32, 0.02, 0.24, 'paper', { pos: [0.25, topY + 0.04, 0.1], rotY: 0.2 }));

  // İki sandalye (masanın ön ve arka yüzü)
  for (const sz of [-1, 1]) {
    const chair = buildChair();
    chair.position.set(0, 0, sz * (D / 2 + 0.42));
    chair.rotation.y = sz > 0 ? Math.PI : 0;
    g.add(chair);
  }

  g.position.set(slot.x, y0, slot.z);
  g.rotation.y = slot.rotY;
  g.name = `desk-${slot.id}`;
  return g;
}

/** Sandalye: oturak + 4 ince ayak + arkalık */
function buildChair(): THREE.Group {
  const c = new THREE.Group();
  const seatY = 0.45;
  c.add(libMakeBox(0.44, 0.05, 0.44, 'woodDark', { pos: [0, seatY, 0] }));
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      c.add(libMakeCyl(0.018, 0.022, seatY, 'metalDark', {
        pos: [sx * 0.18, seatY / 2, sz * 0.18], seg: 6,
      }));
    }
  }
  // Arkalık
  c.add(libMakeBox(0.42, 0.34, 0.05, 'woodDark', { pos: [0, seatY + 0.36, -0.2] }));
  return c;
}

/** Danışma bankosu: L formunda, ön yüz ahşap, üst mermer, arkasında raf */
function buildCounter(): THREE.Group {
  const g = new THREE.Group();
  const y0 = LEVEL.ground;
  const H = 1.05;

  // Ana gövde
  g.add(libMakeBox(3.4, H, 0.7, 'counter', { pos: [0, H / 2, 0] }));
  // Mermer tabla (taşkın)
  g.add(libMakeBox(3.6, 0.07, 0.86, 'metalDark', { pos: [0, H + 0.035, 0] }));
  // Ön yüzde ince dikey kanallar (modern görünüm)
  for (let i = -7; i <= 7; i++) {
    g.add(libMakeBox(0.03, H - 0.12, 0.02, 'woodDark', {
      pos: [i * 0.22, H / 2, 0.36], cast: false,
    }));
  }
  // Banko üstü: monitör (danışma ekranı) ve evrak
  g.add(libMakeBox(0.5, 0.32, 0.05, 'screen', { pos: [-0.9, H + 0.26, -0.16] }));
  g.add(libMakeBox(0.06, 0.16, 0.06, 'metalDark', { pos: [-0.9, H + 0.09, -0.16] }));
  g.add(libMakeBox(0.28, 0.03, 0.2, 'paper', { pos: [0.7, H + 0.09, 0.1], rotY: -0.12 }));

  g.position.set(0, y0, -6.9);
  g.name = 'danisma-bankosu';
  return g;
}

/** Bilgisayar istasyonu: uzun masa + 4 monitör + kasa + sandalyeler */
function buildComputerArea(): THREE.Group {
  const g = new THREE.Group();
  const y0 = LEVEL.upper;
  const H = 0.76;
  const W = 6.2, D = 0.8;

  // Masa
  g.add(libMakeBox(W, 0.06, D, 'desk', { pos: [0, H, 0] }));
  g.add(libMakeBox(W - 0.1, 0.5, 0.04, 'fabricDark', { pos: [0, H - 0.3, -D / 2 + 0.05] }));
  // Ayaklar
  for (const sx of [-1, 1]) {
    g.add(libMakeBox(0.06, H, D - 0.1, 'metalDark', { pos: [sx * (W / 2 - 0.1), H / 2, 0] }));
  }

  // 4 istasyon
  for (let i = 0; i < 4; i++) {
    const x = -W / 2 + 0.95 + i * 1.45;
    // Monitör paneli
    g.add(libMakeBox(0.62, 0.38, 0.03, 'screen', { pos: [x, H + 0.34, -0.22], rotY: -0.05 }));
    // Monitör ayağı
    g.add(libMakeBox(0.05, 0.16, 0.05, 'metalDark', { pos: [x, H + 0.1, -0.22] }));
    // Klavye
    g.add(libMakeBox(0.4, 0.02, 0.14, 'metalDark', { pos: [x, H + 0.05, 0.06] }));
    // Kasa (yerde)
    g.add(libMakeBox(0.2, 0.42, 0.42, 'metalDark', { pos: [x + 0.5, 0.21, -0.05] }));
    // Sandalye
    const chair = buildChair();
    chair.position.set(x, 0, 0.75);
    g.add(chair);
  }

  // Masa üstü aydınlatma çubuğu
  g.add(libMakeBox(W - 0.4, 0.04, 0.08, 'lampWarm', { pos: [0, H + 0.78, -0.3], cast: false, receive: false }));

  g.position.set(4.4, y0, -7.4);
  g.name = 'bilgisayar-alani';
  return g;
}

/**
 * İç merdiven — zemin kattan birinci kata.
 *
 * Basamaklar tek InstancedMesh yerine düz kutu: 20 basamak × 4 çizim çağrısı
 * kabul edilebilir; küpeşte 2 çizim. Toplam ~6 çağrı.
 */
function buildStair(): THREE.Group {
  const g = new THREE.Group();
  const { x, z0, z1, width, steps } = STAIR;
  const totalRise = LEVEL.upper;
  const run = (z1 - z0) / steps;
  const rise = totalRise / steps;

  for (let i = 0; i < steps; i++) {
    const h = rise * (i + 1);
    // Basamak: yüksekliği adım adım artan blok (alttan dolu → sağlam görünür)
    g.add(libMakeBox(width, rise, Math.abs(run) + 0.02, 'floorStone', {
      pos: [x, h - rise / 2, z0 + run * (i + 0.5)],
    }));
  }

  // Küpeşte (her iki yan) — eğik çubuk
  const len = Math.hypot(totalRise, z1 - z0);
  const angle = Math.atan2(totalRise, z1 - z0);
  for (const sx of [-1, 1]) {
    const rail = libMakeBox(0.05, 0.05, len, 'rail', {
      pos: [x + sx * (width / 2 - 0.06), totalRise / 2 + 0.95, (z0 + z1) / 2],
      rotX: -angle,
    });
    g.add(rail);
    // Dikmeler
    for (let i = 0; i <= 8; i++) {
      const t = i / 8;
      const zz = z0 + (z1 - z0) * t;
      const yy = totalRise * t;
      g.add(libMakeCyl(0.02, 0.02, 0.95, 'rail', {
        pos: [x + sx * (width / 2 - 0.06), yy + 0.48, zz], seg: 6,
      }));
    }
  }

  // Merdiven boşluğu kenar koruması (üst kat döşemesinde açıklık çevresi)
  g.name = 'ic-merdiven';
  return g;
}

/** Balkon korkuluğu — atrium boşluğunun çevresinde cam + metal küpeşte */
function buildBalconyRail(): THREE.Group {
  const g = new THREE.Group();
  const y = LEVEL.upper;
  const { minX, maxX, minZ, maxZ } = ATRIUM;
  const H = 1.05;

  const segs: Array<[number, number, number, number]> = [
    [minX, minZ, maxX, minZ],   // kuzey
    [minX, maxZ, maxX, maxZ],   // güney
    [minX, minZ, minX, maxZ],   // batı
    [maxX, minZ, maxX, maxZ],   // doğu
  ];

  for (const [x1, z1, x2, z2] of segs) {
    const dx = x2 - x1, dz = z2 - z1;
    const len = Math.hypot(dx, dz);
    const cx = (x1 + x2) / 2, cz = (z1 + z2) / 2;
    const rotY = -Math.atan2(dz, dx);

    // Cam panel (şeffaf)
    g.add(libMakeBox(len, H - 0.12, 0.03, 'glass', {
      pos: [cx, y + (H - 0.12) / 2 + 0.06, cz], rotY, cast: false,
    }));
    // Üst metal küpeşte
    g.add(libMakeBox(len, 0.05, 0.08, 'rail', { pos: [cx, y + H + 0.02, cz], rotY }));
    // Alt süpürgelik
    g.add(libMakeBox(len, 0.08, 0.06, 'metalDark', { pos: [cx, y + 0.04, cz], rotY }));
  }

  g.position.set(0, 0, 0);
  g.name = 'balkon-korkuluk';
  return g;
}

/** Tüm zemin/üst kat mobilyasını kur */
export function buildInteriorFurniture(): { group: THREE.Group; pickups: InteriorPickup[] } {
  const root = new THREE.Group();
  root.name = 'ic-mekan';
  const pickups: InteriorPickup[] = [];

  for (const desk of DESKS) {
    const d = buildDesk(desk);
    root.add(d);
    pickups.push({
      group: d,
      meta: {
        kind: 'desk', id: `desk-${desk.id}`,
        label: `Okuma Masası ${desk.id}`,
        info: [
          ['Kat', desk.floor === 0 ? 'Zemin Kat' : 'Birinci Kat'],
          ['Kapasite', '2 kişi'],
          ['Donanım', 'Çalışma lambası, priz, sandalye'],
        ],
      },
    });
  }

  const counter = buildCounter();
  root.add(counter);
  pickups.push({
    group: counter,
    meta: {
      kind: 'counter', id: 'danisma', label: 'Danışma Bankosu',
      info: [['Kat', 'Zemin Kat'], ['Hizmet', 'Üye kaydı, ödünç verme, bilgi'], ['Personel', '2 kütüphaneci']],
    },
  });

  const comp = buildComputerArea();
  root.add(comp);
  pickups.push({
    group: comp,
    meta: {
      kind: 'computer', id: 'bilgisayar-alani', label: 'Bilgisayar Çalışma Alanı',
      info: [['Kat', 'Birinci Kat'], ['İstasyon', '4 terminal'], ['Hizmet', 'Katalog tarama, internet, dijital arşiv']],
    },
  });

  const stair = buildStair();
  root.add(stair);
  pickups.push({
    group: stair,
    meta: {
      kind: 'stair', id: 'ic-merdiven', label: 'İç Merdiven',
      info: [['Bağlantı', 'Zemin ↔ Birinci Kat'], ['Basamak', String(STAIR.steps)], ['Genişlik', '3 m']],
    },
  });

  root.add(buildBalconyRail());

  // Sınır kontrolü: mobilya iç hacimden taşmasın (geliştirme sırasında uyarı)
  root.traverse((o) => {
    const m = o as THREE.Mesh;
    if (!m.isMesh) return;
    m.castShadow = true;
    m.receiveShadow = true;
  });

  return { group: root, pickups };
}

/** Yürüyüş sınırları — kamera modülü kullanır */
export const LIB_WALK = WALK_BOUNDS;
export const LIB_INNER = INNER;
