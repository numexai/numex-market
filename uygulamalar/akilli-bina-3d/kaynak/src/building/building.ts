import * as THREE from 'three';
import {
  FLOORS, APARTMENTS, HERO_APARTMENT_ID, CORE, SYSTEM_LAYERS,
} from '../data/building';
import { buildFloorShell, buildRoofGroup } from './floors';
import { buildBasement, buildGroundFloor } from './ground';
import { CoreSystem } from './core';
import { buildHeroApartment, type DoorHandle, type LightHandle } from '../interior/heroApartment';
import { buildSimplifiedApartments } from '../interior/simplifiedApartments';
import { buildXRaySystems, XRayController } from '../systems/xray';
import { makeBox } from '../core/geometry';

/**
 * Bina montaj katmanı: katları, daireleri, çekirdeği, X-Ray'i bir araya kurar.
 * Exploded view, kat izolasyonu ve çarpışma indeksinin TEK doğruluk kaynağı.
 */

export interface FloorRuntime {
  id: string;
  group: THREE.Group;
  baseY: number;
  height: number;
  index: number;
}

export class BuildingSystem {
  readonly root = new THREE.Group();
  readonly floors = new Map<string, FloorRuntime>();
  readonly core = new CoreSystem();
  readonly heroApartment: ReturnType<typeof buildHeroApartment>;
  readonly xray: XRayController;
  readonly colliders: THREE.Box3[] = [];

  private roofGroup: THREE.Group;
  private exploded = 0;
  private isolated: string | null = null;
  private roofsHidden = false;

  constructor() {
    this.root.name = 'building';
    this.root.position.y = 0;

    // --- Her kat için grup ---
    for (const f of FLOORS) {
      const shell = buildFloorShell(f);
      const g = shell.group;
      // katın özel mekânları
      if (f.kind === 'basement') buildBasement(g);
      if (f.kind === 'ground') buildGroundFloor(g);
      if (f.kind === 'penthouse') {
        // çatı dubleksleri için basit üst hacim
        addPenthouseMass(g);
      }
      this.root.add(g);
      this.floors.set(f.id, {
        id: f.id, group: g, baseY: f.elevation, height: f.height, index: f.index,
      });
    }

    // --- Çekirdek (merdiven + asansör) ---
    this.root.add(this.core.group);

    // --- Örnek daire (K1) ---
    this.heroApartment = buildHeroApartment();
    const k1 = this.floors.get('K1')!;
    // örnek daireyi K1 kat grubuna bağla → ayrıştırmada katla birlikte hareket eder
    k1.group.add(this.heroApartment.group);

    // --- Diğer daireler (instanced) ---
    const simple = buildSimplifiedApartments();
    for (const g of simple.groups) {
      const fr = this.floors.get(g.userData.floorId as string);
      if (fr) fr.group.add(g);
    }
    // instanced meshler sahne köküne eklenir (tek çizim çağrısı), davranışları yok
    simple.meshes.forEach((m) => this.root.add(m));

    // --- Çatı ---
    this.roofGroup = buildRoofGroup();
    const k5 = this.floors.get('K5')!;
    k5.group.add(this.roofGroup);

    // --- X-Ray ---
    const systems = buildXRaySystems();
    systems.forEach((s) => this.root.add(s.group));
    this.xray = new XRayController(systems);
    this.roofGroup.userData.isRoof = true;

    this.collectColliders();
    this.registerFacades();
  }

  /** Cephe camlarını X-Ray'e bildir (saydamlaştırılacak) */
  private registerFacades(): void {
    const facade: THREE.Mesh[] = [];
    this.root.traverse((o) => {
      const m = o as THREE.Mesh;
      if (!m.isMesh) return;
      const ctx = (m.userData as any).ctx as Record<string, unknown> | undefined;
      if (ctx?.collider === true) {
        const box = new THREE.Box3().setFromObject(m);
        if (box.isEmpty()) return;
        // çarpışma kutularını hafif büyüt (oyuncu yarıçapı kadar)
        box.expandByScalar(0.05);
        this.colliders.push(box);
      }
      if (m.name.startsWith('facade-') || m.name === 'balcony-rail') facade.push(m);
    });
    this.xray.registerFacade(facade);
    this.xray.registerRoof(this.roofGroup);
  }

  private collectColliders(): void {
    // duvarlar, kolonlar, mekanik odalar, araçlar: ctx.collider === true
    this.root.traverse((o) => {
      const m = o as THREE.Mesh;
      if (!m.isMesh) return;
      const ctx = (m.userData as any).ctx as Record<string, unknown> | undefined;
      if (ctx?.collider === true) {
        m.updateWorldMatrix(true, true);
        const box = new THREE.Box3().setFromObject(m);
        if (!box.isEmpty()) this.colliders.push(box);
      }
    });
  }

  /** EXPLODED VIEW: 0 = birleşik, 1 = tamamen ayrık */
  setExplode(t: number): void {
    this.exploded = t;
    // bodrum aşağı, üst katlar yukarı: yükseliş kat indisine göre artar
    const gap = 7.5; // tam ayrıkta kat başına ek mesafe
    FLOORS.forEach((f) => {
      const fr = this.floors.get(f.id);
      if (!fr) return;
      const offset = f.kind === 'basement'
        ? -gap * 0.55 * t
        : f.index * gap * t;
      fr.group.position.y = fr.baseY + offset;
    });
    // X-Ray sistemleri sabit kalır (teknik güzergâhlar bütün olarak okunur)
    this.roofGroup.position.y = t > 0.02 ? this.roofGroup.position.y : 0;
  }

  get explodeValue(): number {
    return this.exploded;
  }

  /** Tek kat modu: diğer katlar gizlenir */
  setIsolate(floorId: string | null): void {
    this.isolated = floorId;
    FLOORS.forEach((f) => {
      const fr = this.floors.get(f.id);
      if (!fr) return;
      fr.group.visible = floorId === null ? true : f.id === floorId;
    });
    // merdiven/asansör çekirdeği izolede gizlenir (kat içi okunabilsin)
    this.core.group.visible = floorId === null;
    this.roofGroup.visible = floorId === null || floorId === 'K5';
  }

  get isolatedFloor(): string | null {
    return this.isolated;
  }

  /** Tavanları gizle (tek kat modunda üstten inceleme) */
  setCeilingsHidden(hidden: boolean): void {
    this.roofsHidden = hidden;
    this.heroApartment.group.traverse((o) => {
      if ((o as THREE.Mesh).userData.isCeiling) o.visible = !hidden;
    });
    // kat üst plakaları: K5 hariç döşemeler zaten alt plaka
    this.floors.forEach((fr) => {
      fr.group.traverse((o) => {
        const m = o as THREE.Mesh;
        if (m.isMesh && m.name === 'lobby-ceiling') m.visible = !hidden;
      });
    });
  }

  get ceilingsHidden(): boolean {
    return this.roofsHidden;
  }

  /** Işık toggling — enerji göstergesi bunu kullanır */
  get heroLights(): LightHandle[] {
    return this.heroApartment.lights;
  }

  get heroDoors(): DoorHandle[] {
    return this.heroApartment.doors;
  }

  /** Kapı animasyonu */
  updateDoors(dt: number): void {
    for (const d of this.heroDoors) {
      if (d.targetAngle !== d.angle) {
        const diff = d.targetAngle - d.angle;
        const step = Math.sign(diff) * Math.min(Math.abs(diff), dt * 4.5);
        d.angle += step;
        d.pivot.rotation.y = d.angle + (d.pivot.userData.baseRotY ?? 0);
      }
    }
  }

  /** Toplam kapalı/ açık ışık sayısı (enerji için) */
  lightStats(): { on: number; off: number; watts: number } {
    let on = 0, off = 0, watts = 0;
    for (const l of this.heroApartment.lights) {
      if (l.on) { on++; watts += l.powerW; } else off++;
    }
    return { on, off, watts };
  }

  /** Dağıtım temizliği */
  dispose(): void {
    this.root.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.isMesh && m.geometry) m.geometry.dispose();
    });
    this.xray.dispose();
  }
}

function addPenthouseMass(g: THREE.Group): void {
  const h = FLOORS.find((f) => f.id === 'K5')!.height;
  // çatı dublekslerinin üst hacmi: iki kütle, cam köşe
  for (const [x, z, w, d] of [[-8.5, -6.0, 12.4, 9.6], [8.5, 6.0, 12.4, 9.6]] as Array<[number, number, number, number]>) {
    g.add(makeBox(w, h - 0.4, d, 'plaster', {
      pos: [x, (h - 0.4) / 2, z], floorId: 'K5', name: 'penthouse-mass',
      meta: {
        kind: 'apartment', id: x < 0 ? 'K5-D1' : 'K5-D2',
        label: x < 0 ? '501 — 4+1 Dubleks' : '502 — 4+1 Dubleks', floorId: 'K5',
        apartmentId: x < 0 ? 'K5-D1' : 'K5-D2', area: 248,
        info: [['Tip', '4+1 çatı dubleksi'], ['Brüt', '248 m²'], ['Özellik', 'Teras + çift yükseklik salon']],
      },
    }));
    g.add(makeBox(w * 0.62, h * 0.62, 0.08, 'glass', {
      pos: [x, h * 0.34, z - d / 2], floorId: 'K5', castShadow: false, name: 'penthouse-glass',
    }));
  }
}
