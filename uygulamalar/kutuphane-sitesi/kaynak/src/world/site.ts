import * as THREE from 'three';
import { makeBox, makeCyl, nextId } from '../core/geometry';
import { getMaterial } from '../core/materials';

/**
 * Çevre: zemin, yol, yürüyüş yolları, peyzaj, ağaçlar (instanced), banklar,
 * havuz, komşu binalar ve otopark rampası girişi.
 */

export function buildSite(): THREE.Group {
  const g = new THREE.Group();
  g.name = 'site';

  // büyük zemin düzlemi
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), getMaterial('grass'));
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.01;
  ground.receiveShadow = true;
  ground.name = 'ground';
  g.add(ground);

  // çevre yolu (bina etrafında L)
  const roadA = makeBox(160, 0.02, 9, 'asphalt', {
    pos: [0, 0.005, 34], receiveShadow: true, castShadow: false, name: 'road-main',
    meta: { kind: 'floor', id: 'road', label: 'Çevre Yolu', info: [['Genişlik', '9 m']] },
  });
  g.add(roadA);
  const roadB = makeBox(9, 0.02, 70, 'asphalt', {
    pos: [-40, 0.005, 0], receiveShadow: true, castShadow: false, name: 'road-side',
  });
  g.add(roadB);
  // yol çizgileri
  for (let i = -9; i <= 9; i++) {
    g.add(makeBox(2.4, 0.02, 0.14, 'plaster', {
      pos: [i * 8, 0.02, 34], castShadow: false, receiveShadow: false, name: 'road-line',
    }));
  }

  // yürüyüş yolları (beton plaka)
  const paths: Array<[number, number, number, number]> = [
    [0, 19, 3.2, 22], // güney giriş yolu
    [0, -16.5, 3.2, 10], // kuzey yolu
    [-19, 0, 4.0, 3.0], // batı
    [19, 0, 4.0, 3.0], // doğu
  ];
  for (const [x, z, w, d] of paths) {
    g.add(makeBox(w, 0.06, d, 'stone', {
      pos: [x, 0.03, z], receiveShadow: true, castShadow: false, name: 'path',
      meta: { kind: 'floor', id: `path-${x}-${z}`, label: 'Yürüyüş Yolu', info: [['Genişlik', `${w} m`], ['Kaplama', 'Bazalt plaka']] },
    }));
  }
  // çevre dolanma yolu (ring)
  const ring = new THREE.Mesh(new THREE.RingGeometry(24, 26.4, 64), getMaterial('stone'));
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.04;
  ring.receiveShadow = true;
  ring.name = 'perimeter-path';
  g.add(ring);

  // bahçe peyzajı: çim alanlar
  for (const [x, z, w, d] of [[-20, 15, 14, 12], [20, 15, 14, 12], [-20, -14, 12, 10], [20, -14, 12, 10]]) {
    g.add(makeBox(w, 0.04, d, 'grass', { pos: [x, 0.02, z], castShadow: false, receiveShadow: true, name: 'lawn' }));
  }

  // ---- Ağaçlar (instanced: gövde + taç) ----
  const treePositions: Array<[number, number, number]> = [];
  const rng = mulberry32(1337);
  for (let i = 0; i < 46; i++) {
    const angle = rng() * Math.PI * 2;
    const radius = 20 + rng() * 26;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    // bina ve yol üstüne koyma
    if (Math.abs(x) < 20 && Math.abs(z) < 16) continue;
    if (Math.abs(z - 34) < 7) continue;
    treePositions.push([x, 0, z, ]);
  }
  // Elle yerleştirilen ön bahçe ağaçları
  const manualTrees: Array<[number, number]> = [
    [-12, 16], [-7, 17.5], [7, 17.5], [12, 16], [-14, -16], [14, -16],
    [-24, 6], [-24, -6], [24, 6], [24, -6],
  ];
  manualTrees.forEach(([x, z]) => treePositions.push([x, 0, z]));

  const trunkGeo = new THREE.CylinderGeometry(0.16, 0.26, 4.2, 6);
  const crownGeo = new THREE.IcosahedronGeometry(1.9, 0);
  const trunkMesh = new THREE.InstancedMesh(trunkGeo, getMaterial('woodDark'), treePositions.length);
  const crownMesh = new THREE.InstancedMesh(crownGeo, getMaterial('foliage'), treePositions.length);
  const crownMesh2 = new THREE.InstancedMesh(crownGeo, getMaterial('foliageDark'), treePositions.length);
  const m4 = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const s = new THREE.Vector3();
  treePositions.forEach(([x, , z], i) => {
    const scale = 0.8 + rng() * 0.7;
    m4.compose(new THREE.Vector3(x, 2.1 * scale, z), q, s.set(scale, scale, scale));
    trunkMesh.setMatrixAt(i, m4);
    m4.compose(new THREE.Vector3(x, 4.4 * scale, z), q, s.set(scale, scale * 0.86, scale));
    crownMesh.setMatrixAt(i, m4);
    const off = 0.9 * scale;
    m4.compose(new THREE.Vector3(x + off, 3.5 * scale, z + off * 0.6), q, s.set(scale * 0.7, scale * 0.62, scale * 0.7));
    crownMesh2.setMatrixAt(i, m4);
  });
  [trunkMesh, crownMesh, crownMesh2].forEach((im) => {
    im.castShadow = true;
    im.receiveShadow = true;
    im.instanceMatrix.needsUpdate = true;
    g.add(im);
  });

  // ---- Banklar ----
  const benchPositions: Array<[number, number, number]> = [
    [-6, 0, 15], [6, 0, 15], [-18, 0, 8], [18, 0, 8], [-10, 0, -15], [10, 0, -15],
  ];
  for (const [x, , z] of benchPositions) {
    const bench = new THREE.Group();
    bench.position.set(x, 0, z);
    bench.add(makeBox(1.8, 0.07, 0.5, 'wood', { pos: [0, 0.45, 0], name: 'bench-seat' }));
    bench.add(makeBox(1.8, 0.45, 0.07, 'wood', { pos: [0, 0.68, -0.22], name: 'bench-back' }));
    bench.add(makeBox(0.08, 0.45, 0.45, 'metal', { pos: [-0.75, 0.22, 0], name: 'bench-leg' }));
    bench.add(makeBox(0.08, 0.45, 0.45, 'metal', { pos: [0.75, 0.22, 0], name: 'bench-leg' }));
    bench.traverse((o) => {
      const mm = o as THREE.Mesh;
      if (mm.isMesh) mm.userData.meta = {
        kind: 'furniture', id: `bench-${x}-${z}`, label: 'Bahçe Bankı',
        info: [['Ölçü', '1.8 m'], ['Malzeme', 'Teak + dökme demir']],
      };
    });
    g.add(bench);
  }

  // ---- Havuz (güney bahçe) ----
  const poolX = 0, poolZ = 27.5;
  g.add(makeBox(14, 0.4, 6, 'marble', { pos: [poolX, 0.2, poolZ], name: 'pool-deck' }));
  g.add(makeBox(12.4, 0.3, 4.4, 'water', {
    pos: [poolX, 0.36, poolZ], castShadow: false, name: 'pool-water',
    meta: { kind: 'floor', id: 'pool', label: 'Yüzme Havuzu', info: [['Ölçü', '12.4 × 4.4 m'], ['Derinlik', '1.4 m']] },
  }));

  // ---- Otopark rampası girişi ----
  g.add(makeBox(5.0, 0.12, 9, 'asphalt', {
    pos: [-13.5, 0.02, -17.5], rotX: 0.04, name: 'ramp-entry', castShadow: false,
    meta: { kind: 'floor', id: 'ramp-entry', label: 'Otopark Girişi', info: [['Genişlik', '5 m'], ['Not', 'Bodrum otoparka iniş']] },
  }));

  // ---- Komşu binalar (sade kütleler) ----
  // Komşu binalar: ana binaya (x ±15, z ±11) ve yollara çarpmayacak mesafede.
  const neighbors: Array<[number, number, number, number, number, string]> = [
    [-72, -38, 18, 14, 16, 'concreteDark'],
    [-74, 48, 16, 12, 22, 'plaster'],
    [70, -36, 20, 16, 12, 'concrete'],
    [78, 50, 22, 14, 28, 'concreteDark'],
    [0, -70, 26, 18, 18, 'plaster'],
  ];
  for (const [x, z, w, d, h, mat] of neighbors) {
    g.add(makeBox(w, h, d, mat as any, {
      pos: [x, h / 2, z], name: 'neighbor-building', castShadow: true, receiveShadow: true,
      meta: { kind: 'floor', id: `neighbor-${x}-${z}`, label: 'Komşu Yapı', info: [['Yükseklik', `${h} m`], ['Not', 'Çevre bağlamı için sade kütle']] },
    }));
    // cam şeritleri
    for (let i = 1; i < Math.floor(h / 3.4); i++) {
      g.add(makeBox(w + 0.06, 1.3, d + 0.06, 'glassDark', {
        pos: [x, i * 3.4, z], castShadow: false, receiveShadow: false, name: 'neighbor-glass',
      }));
    }
  }

  // ---- Sokak lambaları ----
  for (let i = -4; i <= 4; i++) {
    const x = i * 16;
    g.add(makeCyl(0.08, 0.1, 6, 'metalDark', { pos: [x, 3, 29], name: 'streetlamp-pole' }));
    g.add(makeBox(1.0, 0.12, 0.4, 'metalDark', { pos: [x, 6.0, 28.7], name: 'streetlamp-arm' }));
    const lamp = makeBox(0.7, 0.1, 0.3, 'emissiveCool', { pos: [x, 5.92, 28.4], castShadow: false, name: 'streetlamp-head' });
    lamp.userData.isStreetLamp = true;
    g.add(lamp);
  }

  return g;
}

/** Deterministik rastgele */
function mulberry32(a: number): () => number {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
