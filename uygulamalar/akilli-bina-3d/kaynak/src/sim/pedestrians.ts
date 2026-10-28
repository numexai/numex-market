import * as THREE from 'three';
import { getMaterial } from '../core/materials';

/**
 * Yaya simülasyonu: lobide ve bahçe yolunda dolaşan basit karakterler.
 * Instanced değil ama az sayıda (10) → düşük maliyet. Bacak kolları sallanır.
 */

interface Pedestrian {
  root: THREE.Group;
  legs: [THREE.Mesh, THREE.Mesh];
  arms: [THREE.Mesh, THREE.Mesh];
  path: THREE.Vector3[];
  pathIndex: number;
  speed: number;
  phase: number;
  inside: boolean;
}

const SKIN = 0xd9b08c;
const CLOTHES = [0x2f4a63, 0x7a5b3e, 0x3c3c44, 0x8a3f45, 0x4a6b52, 0xb0a08a];

export class PedestrianSystem {
  readonly group = new THREE.Group();
  private people: Pedestrian[] = [];
  private outdoorPaths: THREE.Vector3[][] = [];
  private indoorPaths: THREE.Vector3[][] = [];

  constructor() {
    this.group.name = 'pedestrians';
    this.definePaths();
    this.spawn(10);
  }

  private definePaths(): void {
    // Bahçe dolanma yolu (elips)
    this.outdoorPaths.push(ellipsePath(25, 25, 10));
    this.outdoorPaths.push(ellipsePath(25, 25, 10, Math.PI));
    // Giriş yolu — kapıdan yola
    this.outdoorPaths.push([
      new THREE.Vector3(-1.2, 0, 11.5),
      new THREE.Vector3(-1.2, 0, 20),
      new THREE.Vector3(6, 0, 26),
      new THREE.Vector3(14, 0, 30),
      new THREE.Vector3(-1.2, 0, 20),
    ]);
    // Lobi yolu
    this.indoorPaths.push([
      new THREE.Vector3(0, 0, 10),
      new THREE.Vector3(-6, 0, 7),
      new THREE.Vector3(-11, 0, 0),
      new THREE.Vector3(-6, 0, -4),
      new THREE.Vector3(4, 0, -2),
      new THREE.Vector3(6, 0, 6),
    ]);
    this.indoorPaths.push([
      new THREE.Vector3(-9, 0, -1.5),
      new THREE.Vector3(-2, 0, 2),
      new THREE.Vector3(4, 0, 9),
      new THREE.Vector3(-4, 0, 9),
      new THREE.Vector3(-9, 0, -1.5),
    ]);
  }

  private spawn(count: number): void {
    for (let i = 0; i < count; i++) {
      const inside = i % 3 === 0; // 1/3 lobide
      const paths = inside ? this.indoorPaths : this.outdoorPaths;
      const path = paths[i % paths.length];
      const scale = 0.92 + Math.random() * 0.16;

      const root = new THREE.Group();
      const bodyMat = new THREE.MeshStandardMaterial({
        color: CLOTHES[i % CLOTHES.length], roughness: 0.9, metalness: 0,
      });
      const skinMat = new THREE.MeshStandardMaterial({ color: SKIN, roughness: 0.8 });

      // gövde
      const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.17, 0.42, 4, 8), bodyMat);
      torso.position.y = 1.18;
      torso.castShadow = true;
      root.add(torso);
      // baş
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.13, 10, 8), skinMat);
      head.position.y = 1.62;
      head.castShadow = true;
      root.add(head);
      // bacaklar
      const legGeo = new THREE.CapsuleGeometry(0.075, 0.55, 3, 6);
      const l1 = new THREE.Mesh(legGeo, bodyMat);
      l1.position.set(-0.085, 0.62, 0);
      l1.castShadow = true;
      const l2 = new THREE.Mesh(legGeo, bodyMat);
      l2.position.set(0.085, 0.62, 0);
      l2.castShadow = true;
      root.add(l1, l2);
      // kollar
      const armGeo = new THREE.CapsuleGeometry(0.06, 0.44, 3, 6);
      const a1 = new THREE.Mesh(armGeo, bodyMat);
      a1.position.set(-0.24, 1.2, 0);
      a1.castShadow = true;
      const a2 = new THREE.Mesh(armGeo, bodyMat);
      a2.position.set(0.24, 1.2, 0);
      a2.castShadow = true;
      root.add(a1, a2);

      root.scale.setScalar(scale);
      root.position.copy(path[0]);
      root.name = `pedestrian-${i}`;
      this.group.add(root);

      this.people.push({
        root, legs: [l1, l2], arms: [a1, a2], path, pathIndex: 1,
        speed: 1.1 + Math.random() * 0.7, phase: Math.random() * Math.PI * 2, inside,
      });
    }
  }

  update(dt: number): void {
    for (const p of this.people) {
      const target = p.path[p.pathIndex % p.path.length];
      const dir = target.clone().sub(p.root.position);
      const dist = dir.length();
      if (dist < 0.35) {
        p.pathIndex = (p.pathIndex + 1) % p.path.length;
        continue;
      }
      dir.normalize();
      p.root.position.addScaledVector(dir, p.speed * dt);
      // yön
      const targetAngle = Math.atan2(dir.x, dir.z);
      let diff = targetAngle - p.root.rotation.y;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      p.root.rotation.y += diff * Math.min(1, dt * 4);

      // yürüme animasyonu
      p.phase += dt * p.speed * 4.2;
      const swing = Math.sin(p.phase) * 0.55;
      p.legs[0].rotation.x = swing;
      p.legs[1].rotation.x = -swing;
      p.arms[0].rotation.x = -swing * 0.8;
      p.arms[1].rotation.x = swing * 0.8;
    }
  }

  setVisible(v: boolean): void {
    this.group.visible = v;
  }

  dispose(): void {
    this.people.forEach((p) => {
      p.root.traverse((o) => {
        const m = o as THREE.Mesh;
        if (m.isMesh) {
          m.geometry.dispose();
          (m.material as THREE.Material).dispose();
        }
      });
    });
    this.people = [];
  }
}

function ellipsePath(rx: number, rz: number, segments: number, offset = 0): THREE.Vector3[] {
  const pts: THREE.Vector3[] = [];
  for (let i = 0; i <= segments; i++) {
    const a = (i / segments) * Math.PI * 2 + offset;
    pts.push(new THREE.Vector3(Math.cos(a) * rx, 0, Math.sin(a) * rz + 2));
  }
  return pts;
}
