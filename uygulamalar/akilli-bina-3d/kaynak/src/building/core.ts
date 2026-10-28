import * as THREE from 'three';
import { CORE, BUILDING, FLOORS, type FloorDef } from '../data/building';
import { makeBox, makeCyl, makeWall, nextId } from '../core/geometry';
import { getMaterial } from '../core/materials';

/**
 * Çekirdek: merdiven, 2 asansör kuyusu + hareketli kabinler, yangın çıkışı.
 * Asansör kabinleri `ElevatorCar` sınıfına aittir; gerçek animasyonla hareket eder.
 */

export interface ElevatorCar {
  id: string;
  group: THREE.Group; // kabin grubu (Y ekseninde hareket eder)
  doors: THREE.Mesh[]; // kabin kapıları (X ekseninde açılır)
  shaftX: number;
  shaftZ: number;
  currentY: number;
  targetY: number;
  currentFloor: number;
  doorOpen: number; // 0..1
  dir: number; // +1 yukarı, -1 aşağı, 0 duruyor
  calls: number[]; // çağrı kuyruğu (kat indeksi)
}

export class CoreSystem {
  readonly group = new THREE.Group();
  readonly cars: ElevatorCar[] = [];
  /** Her katın çekirdek içi zemin kotu */
  private floorY(floorIndex: number): number {
    const f = FLOORS.find((x) => x.index === floorIndex);
    return f ? f.elevation : 0;
  }

  constructor() {
    this.group.name = 'core';
    this.buildShafts();
    this.buildStair();
    this.buildLobbyWall();
    this.cars.push(this.buildCar('A', CORE.elevatorA.x, CORE.elevatorA.z));
    this.cars.push(this.buildCar('B', CORE.elevatorB.x, CORE.elevatorB.z));
  }

  private buildShafts(): void {
    const { width, depth, elevatorA, elevatorB } = CORE;
    // kuyu duvarları (zemin kotundan itibaren tüm yükseklik)
    const totalH = 20.2;
    // iki asansör arası bölme
    this.group.add(makeBox(0.16, totalH, elevatorA.d + 0.3, 'concreteDark', {
      pos: [0, totalH / 2 - 3.2, elevatorA.z], name: 'shaft-partition',
    }));
    // kuyu arka duvar
    for (const e of [elevatorA, elevatorB]) {
      this.group.add(makeBox(e.w + 0.32, totalH, 0.16, 'concreteDark', {
        pos: [e.x, totalH / 2 - 3.2, e.z - e.d / 2], name: 'shaft-back',
      }));
    }
    // asansör kapı çerçeveleri, her katta
    for (const f of FLOORS) {
      for (const e of [elevatorA, elevatorB]) {
        const door = makeBox(e.w, f.height - 0.2, 0.06, 'metalDark', {
          pos: [e.x, f.elevation + (f.height - 0.2) / 2, e.z + e.d / 2 + 0.02],
          name: `elevator-door-${f.id}`,
          layer: 'electrical',
          meta: {
            kind: 'elevator', id: `elevator-${e === elevatorA ? 'A' : 'B'}-${f.id}`,
            label: `Asansör ${e === elevatorA ? 'A' : 'B'} — ${f.shortName} kapısı`, floorId: f.id,
            info: [['Kabin', '1.6 × 1.6 m'], ['Kapasite', '8 kişi / 630 kg'], ['Hız', '1.6 m/s']],
          },
        });
        this.group.add(door);
        // kapı çevresi aydınlatması
        this.group.add(makeBox(e.w + 0.3, 0.08, 0.1, 'emissiveCool', {
          pos: [e.x, f.elevation + f.height - 0.25, e.z + e.d / 2 + 0.08], castShadow: false,
        }));
      }
    }
    // merdiven boşluğu çevresi
    this.group.add(makeWall(-width / 2, -depth / 2, width / 2, -depth / 2, 3.0, 0.18, 'plaster', { name: 'core-south' }));
  }

  private buildStair(): void {
    // U dönüşlü merdiven: iki kol, her katta
    for (const f of FLOORS) {
      if (f.index === 5) continue;
      const steps = 17;
      const riser = f.height / steps;
      for (let i = 0; i < steps; i++) {
        const s = makeBox(1.55, riser, 0.29, 'concrete', {
          pos: [CORE.stair.x - 1.0, f.elevation + riser * (i + 0.5), CORE.stair.z - 0.85 + i * 0.28],
          name: 'stair-step', receiveShadow: true,
        });
        this.group.add(s);
      }
      // sahanlık
      this.group.add(makeBox(3.4, 0.18, 1.2, 'concrete', {
        pos: [CORE.stair.x, f.elevation + f.height - 0.09, CORE.stair.z + 1.35], name: 'landing',
      }));
      // korkuluk
      const rail = makeBox(0.05, 1.0, 4.6, 'metal', {
        pos: [CORE.stair.x - 1.85, f.elevation + 0.9, CORE.stair.z - 0.3], name: 'stair-rail',
      });
      this.group.add(rail);
    }
    // yangın çıkışı tabelası
    for (const f of FLOORS) {
      this.group.add(makeBox(0.9, 0.26, 0.05, 'emissiveCool', {
        pos: [CORE.stair.x + 2.2, f.elevation + 2.4, CORE.stair.z + 1.9], castShadow: false,
        meta: {
          kind: 'system', id: `fireexit-${f.id}`, label: 'Yangın Çıkışı (konsept)',
          floorId: f.id, layer: 'fire',
          info: [['Levha', 'Acil çıkış yönlendirmesi'], ['Not', 'Mevzuat uygunluğu doğrulanmamıştır']],
        },
      }));
    }
  }

  private buildLobbyWall(): void {
    // Zemin katta çekirdek duvarı — lobi ile çekirdeği ayırır
    const g = FLOORS[1];
    const h = g.height;
    this.group.add(makeWall(-CORE.width / 2, CORE.depth / 2, CORE.width / 2, CORE.depth / 2, h, 0.2, 'plaster', {
      floorId: 'Z', name: 'core-lobby-wall',
    }));
  }

  private buildCar(id: string, x: number, z: number): ElevatorCar {
    const group = new THREE.Group();
    group.name = `elevator-car-${id}`;
    const w = 1.55, d = 1.55, h = 2.3;
    // kabin zemini
    group.add(makeBox(w, 0.08, d, 'metal', { pos: [0, 0.04, 0], name: 'car-floor' }));
    // tavan
    group.add(makeBox(w, 0.08, d, 'metal', { pos: [0, h, 0], name: 'car-ceiling' }));
    // ayna duvarlar
    group.add(makeBox(0.06, h, d, 'metal', { pos: [-w / 2, h / 2, 0], name: 'car-left' }));
    group.add(makeBox(0.06, h, d, 'metal', { pos: [w / 2, h / 2, 0], name: 'car-right' }));
    group.add(makeBox(w, h, 0.06, 'metalDark', { pos: [0, h / 2, -d / 2], name: 'car-back' }));
    // kabin tavan aydınlatması
    group.add(makeBox(w * 0.7, 0.05, d * 0.7, 'emissiveWarm', { pos: [0, h - 0.06, 0], castShadow: false }));
    // kabin kapıları (iki kanat)
    const doors: THREE.Mesh[] = [];
    for (let i = 0; i < 2; i++) {
      const panel = makeBox(w / 2 - 0.02, h - 0.12, 0.05, 'metalDark', {
        pos: [i === 0 ? -w / 4 : w / 4, (h - 0.12) / 2, d / 2], name: `car-door-${i}`,
      });
      panel.userData.baseX = panel.position.x;
      doors.push(panel);
      group.add(panel);
    }
    // kat göstergesi
    const indicator = new THREE.Mesh(
      new THREE.PlaneGeometry(0.4, 0.16),
      new THREE.MeshBasicMaterial({ color: 0xff9f43 }),
    );
    this.indicatorMaterial = this.indicatorMaterial ?? indicator.material as THREE.MeshBasicMaterial;
    indicator.position.set(0, h - 0.3, -d / 2 + 0.041);
    indicator.name = 'car-indicator';
    group.add(indicator);

    const startY = FLOORS[1].elevation;
    group.position.set(x, startY, z);
    this.group.add(group);

    return {
      id, group, doors, shaftX: x, shaftZ: z,
      currentY: startY, targetY: startY, currentFloor: 0, doorOpen: 0, dir: 0, calls: [],
    };
  }

  indicatorMaterial: THREE.MeshBasicMaterial | null = null;

  /** Kabini bir kata çağır */
  call(carId: string, floorIndex: number): void {
    const car = this.cars.find((c) => c.id === carId);
    if (!car) return;
    if (!car.calls.includes(floorIndex)) car.calls.push(floorIndex);
  }

  /** Her karede çağrılır */
  update(dt: number): void {
    for (const car of this.cars) {
      if (car.calls.length > 0) {
        const next = car.calls[0];
        const targetY = this.floorY(next);
        car.targetY = targetY;
      }
      if (car.doors.some((d) => Math.abs((d.position.x - (d.userData.baseX as number))) > 0.01)) {
        // kapı animasyonu sürüyor
      }
      const dist = car.targetY - car.currentY;
      const speed = 1.6; // m/s (gerçekçi asansör hızı)
      const atTarget = Math.abs(dist) < 0.01;
      if (!atTarget) {
        car.dir = Math.sign(dist);
        const step = Math.min(Math.abs(dist), speed * dt) * car.dir;
        car.currentY += step;
        car.doorOpen = Math.max(0, car.doorOpen - dt * 2.5);
      } else {
        car.currentY = car.targetY;
        car.dir = 0;
        // hedef kata ulaştı: kapıyı aç, kuyruktan çıkar
        if (car.calls.length > 0) {
          const arrived = car.calls[0];
          if (this.floorY(arrived) === car.currentY) {
            car.doorOpen = Math.min(1, car.doorOpen + dt * 2.5);
            if (car.doorOpen >= 0.999) {
              car.calls.shift();
              car.currentFloor = arrived;
              car.doorOpen = 0;
            }
          }
        }
      }
      // kapı açılımını uygula
      const openX = 0.62 * car.doorOpen;
      car.doors[0].position.x = (car.doors[0].userData.baseX as number) - openX;
      car.doors[1].position.x = (car.doors[1].userData.baseX as number) + openX;
      car.group.position.y = car.currentY;
      // kat göstergesi rengi (hareket halinde turuncu, dururken yeşil)
      if (this.indicatorMaterial) {
        this.indicatorMaterial.color.setHex(car.dir !== 0 ? 0xff9f43 : 0x4ade80);
      }
    }
  }

  /** Kabin dünya konumu (kamera içi mod için) */
  getCarPosition(id: string): THREE.Vector3 | null {
    const car = this.cars.find((c) => c.id === id);
    if (!car) return null;
    return new THREE.Vector3(car.shaftX, car.currentY + 1.0, car.shaftZ);
  }

  reset(): void {
    for (const car of this.cars) {
      car.calls.length = 0;
      car.currentY = car.targetY = this.floorY(0);
      car.currentFloor = 0;
      car.doorOpen = 0;
      car.dir = 0;
      car.group.position.y = car.currentY;
      car.doors.forEach((d) => (d.position.x = d.userData.baseX as number));
    }
  }
}
