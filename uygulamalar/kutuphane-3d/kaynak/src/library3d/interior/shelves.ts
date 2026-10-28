import * as THREE from 'three';
import { libMat } from '../core/materials';
import { SHELVES, CATEGORIES, type ShelfSlot, type ShelfMeta } from '../data/catalog';
import { LEVEL } from '../core/dimensions';

/**
 * Kitaplık + kitap sistemi.
 *
 * PERFORMANS KARARI: 12 kitaplıkta ~1600 kitap var. Her kitabı ayrı Mesh ile
 * çizmek 1600 çizim çağrısı demek — 20 FPS'in altına düşer. Bu yüzden:
 *   • Kitaplık gövdesi (yan panel, raf, arkalık) → ~12 çizim çağrısı
 *   • TÜM kitaplar → TEK InstancedMesh (1 çizim çağrısı, 1600 örnek)
 * Renk çeşitliliği instanceColor ile verilir; böylece tek materyal yeter.
 */

/** Raf bölmesi ölçüleri */
const POST = 0.06;          // raf yan panel kalınlığı
const SHELF_H = 0.42;       // bölme yüksekliği
const SHELF_ROWS = 6;       // dikey bölme sayısı
const BASE_H = 0.12;        // alt süpürgelik
const DEPTH = 0.42;         // kitaplık derinliği
const SIDE_H = 2.62;        // toplam yükseklik

/** Kitap üretim aralığı */
const BOOK_MIN_W = 0.022;
const BOOK_MAX_W = 0.055;
const BOOK_H_RATIO = 0.74;  // bölme yüksekliğine oran (en yüksek kitap)

export interface ShelfBuildResult {
  group: THREE.Group;
  books: number;
  meta: ShelfMeta[];
}

interface BookInstance {
  matrix: THREE.Matrix4;
  color: THREE.Color;
}

/** Kategorilere göre kitap sırtı renk paleti — gerçek kütüphane gibi dağınık */
const PALETTE: number[][] = [
  [0x8e2b2b, 0xb8452f, 0x6b2020, 0xd06a3d, 0xa8352a], // edebiyat: kızıl/turuncu
  [0x6b4a2b, 0x8c6239, 0x4f3722, 0xa8794a, 0x7a5a35], // tarih: kahve
  [0x1f5f8b, 0x2e7ba8, 0x174a6b, 0x3f8fbd, 0x256a94], // bilim: mavi
  [0x5b3b7a, 0x71489b, 0x422b5a, 0x8a5fb0, 0x634080], // felsefe: mor
  [0xc08a1e, 0xd9a534, 0x9c6d14, 0xb8973f, 0xa87a20], // sanat: altın
  [0x24764a, 0x2f8f5c, 0x1b5a37, 0x3fa373, 0x2a7f52], // coğrafya: yeşil
  [0xd1622a, 0xe07f3d, 0xb34d1c, 0xea9455, 0xc25a24], // çocuk: turuncu
  [0x44515d, 0x566572, 0x333d46, 0x687684, 0x4c5a68], // hukuk: gri-mavi
  [0x107a63, 0x169178, 0x0c5c4a, 0x22a68b, 0x13876d], // tıp: turkuaz
  [0x8d7413, 0xa88b1c, 0x6e5a0e, 0xbfa030, 0x9a8018], // dil: hardal
  [0x2a3b4d, 0x354a60, 0x1e2c3a, 0x415a72, 0x2f4356], // bilişim: lacivert
  [0x6f5b12, 0x86701b, 0x56470d, 0x9c8425, 0x7a6415], // referans: koyu altın
];

/** Deterministik rastgele — her yüklemede aynı kitaplık (göz testinde tutarlı) */
function makeRng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/** Kitaplık gövdesini kur: yan paneller, raflar, arkalık, süpürgelik, tepe kapağı */
function buildCarcass(slot: ShelfSlot): THREE.Group {
  const g = new THREE.Group();
  const L = slot.length;
  const y0 = slot.floor === 0 ? LEVEL.ground : LEVEL.upper;

  // Alt süpürgelik
  g.add(new THREE.Mesh(
    new THREE.BoxGeometry(L, BASE_H, DEPTH),
    libMat('woodDark'),
  ).translateY(BASE_H / 2));

  // Yan paneller
  for (const sx of [-1, 1]) {
    const side = new THREE.Mesh(
      new THREE.BoxGeometry(POST, SIDE_H, DEPTH),
      libMat('shelf'),
    );
    side.position.set(sx * (L / 2 - POST / 2), SIDE_H / 2, 0);
    g.add(side);
  }

  // Ara dikmeler: her 1.5 m'de bir (uzun raf sarkmasın)
  const dividers = Math.max(2, Math.round(L / 1.5));
  for (let i = 1; i < dividers; i++) {
    const x = -L / 2 + (L / dividers) * i;
    const d = new THREE.Mesh(
      new THREE.BoxGeometry(POST, SIDE_H, DEPTH),
      libMat('shelf'),
    );
    d.position.set(x, SIDE_H / 2, 0);
    g.add(d);
  }

  // Yatay raflar — her bölmenin altı
  for (let r = 0; r <= SHELF_ROWS; r++) {
    const y = BASE_H + r * SHELF_H;
    const shelf = new THREE.Mesh(
      new THREE.BoxGeometry(L - POST * 2, 0.035, DEPTH),
      libMat('shelf'),
    );
    shelf.position.set(0, y, 0);
    g.add(shelf);
  }

  // Arkalık (ince panel)
  const back = new THREE.Mesh(
    new THREE.BoxGeometry(L - POST * 2, SIDE_H - BASE_H, 0.03),
    libMat('woodDark'),
  );
  back.position.set(0, BASE_H + (SIDE_H - BASE_H) / 2, -DEPTH / 2 + 0.02);
  g.add(back);

  // Tepe kapağı — biraz taşkın
  const cap = new THREE.Mesh(
    new THREE.BoxGeometry(L + 0.06, 0.05, DEPTH + 0.06),
    libMat('wood'),
  );
  cap.position.set(0, SIDE_H + 0.025, 0.01);
  g.add(cap);

  // Kategori etiketi: tepede ince renkli şerit (uzaktan da okunur)
  const cat = CATEGORIES[slot.categoryIndex];
  const tagMat = new THREE.MeshStandardMaterial({
    color: cat.color, roughness: 0.7, metalness: 0,
    emissive: cat.color, emissiveIntensity: 0.12,
  });
  const tag = new THREE.Mesh(new THREE.BoxGeometry(L * 0.42, 0.07, 0.02), tagMat);
  tag.position.set(0, SIDE_H - 0.28, DEPTH / 2 + 0.005);
  tag.name = `tag-${slot.id}`;
  g.add(tag);

  g.position.set(slot.x, y0, slot.z);
  g.rotation.y = slot.rotY;
  return g;
}

/** Tek kitaplığa kitap örnekleri üret (yerel koordinatta, kitaplık ekseninde) */
function collectBooks(slot: ShelfSlot, out: BookInstance[], rng: () => number): number {
  const L = slot.length - POST * 2 - 0.04;
  const palette = PALETTE[slot.categoryIndex % PALETTE.length];
  const y0 = slot.floor === 0 ? LEVEL.ground : LEVEL.upper;
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const s = new THREE.Vector3();
  const p = new THREE.Vector3();
  let count = 0;

  const dividers = Math.max(2, Math.round(slot.length / 1.5));
  const compW = L / dividers;

  for (let d = 0; d < dividers; d++) {
    const compStart = -L / 2 + compW * d;

    for (let r = 0; r < SHELF_ROWS; r++) {
      const shelfY = BASE_H + r * SHELF_H + 0.018;
      // Bazen raf seyrek kalsın (gerçekçilik): rastgele 1/7 ihtimalle boş bölge
      if (rng() < 0.08) continue;

      let cursor = compStart + 0.03 + rng() * 0.04;
      const end = compStart + compW - 0.03;
      // Her bölmede birkaç "seri" (aynı boy kitap) olsun
      let runLeft = 0;
      let runH = 0;

      while (cursor < end) {
        if (runLeft <= 0) {
          runLeft = 2 + Math.floor(rng() * 5);
          runH = (0.14 + rng() * (SHELF_H * BOOK_H_RATIO - 0.14));
        }
        const w = BOOK_MIN_W + rng() * (BOOK_MAX_W - BOOK_MIN_W);
        if (cursor + w > end) break;

        // Hafif öne-arkaya kayma ve eğik kitap (raflar tam hizalı durmaz)
        const lean = rng() < 0.06 ? (rng() - 0.5) * 0.16 : 0;
        const h = runH * (0.92 + rng() * 0.08);
        const depthJitter = (rng() - 0.5) * 0.05;

        q.setFromAxisAngle(new THREE.Vector3(0, 0, 1), lean);
        p.set(cursor + w / 2, shelfY + h / 2, depthJitter);
        s.set(w, h, DEPTH * (0.72 + rng() * 0.2));
        m.compose(p, q, s);

        // Yerel → dünya: kitaplığın dönüşü ve konumu
        m.premultiply(
          new THREE.Matrix4().compose(
            new THREE.Vector3(slot.x, y0, slot.z),
            new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), slot.rotY),
            new THREE.Vector3(1, 1, 1),
          ),
        );

        const base = palette[Math.floor(rng() * palette.length)];
        const col = new THREE.Color(base);
        // parlaklık dağılımı — hepsi aynı tonda durmasın
        const k = 0.82 + rng() * 0.36;
        col.multiplyScalar(k);

        out.push({ matrix: m.clone(), color: col });
        cursor += w + 0.004;
        runLeft--;
        count++;
      }
    }
  }
  return count;
}

/**
 * Tüm kitaplıkları kur. Dönen grup sahneye eklenir; kitaplar tek
 * InstancedMesh olduğu için seçim (raycast) kitaplık gövdesi üzerinden yapılır.
 */
export function buildShelves(): ShelfBuildResult {
  const root = new THREE.Group();
  root.name = 'kitapliklar';

  const instances: BookInstance[] = [];
  const metas: ShelfMeta[] = [];
  let totalBooks = 0;

  for (const slot of SHELVES) {
    const carcass = buildCarcass(slot);
    carcass.name = `shelf-${slot.id}`;

    const cat = CATEGORIES[slot.categoryIndex];
    const bookCount = collectBooks(slot, instances, makeRng(slot.id.charCodeAt(1) * 7919 + slot.id.charCodeAt(2) * 131));
    totalBooks += bookCount;

    // Tıklama için meta: gövde grubunun tamamı aynı kategoriyi temsil eder
    const meta: ShelfMeta = {
      kind: 'shelf',
      id: slot.id,
      label: slot.label,
      categoryId: cat.id,
      categoryLabel: cat.label,
      categoryColor: cat.color,
      range: cat.range,
      desc: cat.desc,
      floor: slot.floor,
      books: bookCount,
      compartments: Math.max(2, Math.round(slot.length / 1.5)) * SHELF_ROWS,
    };
    metas.push(meta);

    carcass.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (mesh.isMesh) {
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.userData.shelf = meta;
      }
    });

    root.add(carcass);
  }

  // ---- TEK InstancedMesh: tüm kitaplar ----
  const bookGeo = new THREE.BoxGeometry(1, 1, 1);
  const bookMat = new THREE.MeshStandardMaterial({
    color: 0xffffff, roughness: 0.82, metalness: 0.02, vertexColors: false,
  });
  const books = new THREE.InstancedMesh(bookGeo, bookMat, instances.length);
  books.name = 'kitaplar';
  books.castShadow = false;      // binlerce kitap gölge üretirse FPS çöker
  books.receiveShadow = true;
  books.instanceMatrix.setUsage(THREE.StaticDrawUsage);

  const colorAttr = new THREE.InstancedBufferAttribute(new Float32Array(instances.length * 3), 3);
  for (let i = 0; i < instances.length; i++) {
    books.setMatrixAt(i, instances[i].matrix);
    const c = instances[i].color;
    colorAttr.setXYZ(i, c.r, c.g, c.b);
  }
  colorAttr.needsUpdate = true;
  books.instanceColor = colorAttr;
  books.instanceMatrix.needsUpdate = true;
  books.computeBoundingSphere();

  root.add(books);

  return { group: root, books: totalBooks, meta: metas };
}
