import * as THREE from 'three';
import { FLOORS, BUILDING, CORE, APARTMENTS, APARTMENT_QUADRANTS, SYSTEM_LAYERS, ROOF_ELEVATION, type SystemLayer } from '../data/building';
import { makeBox, makeCyl, makeWall } from '../core/geometry';

/**
 * X-RAY — teknik sistemler (KAVRAMSAL / EĞİTİMSEL gösterim).
 * Gerçek mühendislik hesabı yapılmamıştır; güzergâhlar şematiktir.
 */

export interface XRaySystem {
  layer: SystemLayer;
  group: THREE.Group;
}

const COLORS: Record<SystemLayer, number> = {
  architectural: 0x9fb3c8,
  structural: 0xf0a04b,
  electrical: 0xf5d547,
  water: 0x4ea8de,
  waste: 0x9d8189,
  hvac: 0x6ee7b7,
  fire: 0xef476f,
};

export function buildXRaySystems(): XRaySystem[] {
  const systems: XRaySystem[] = [];

  // ---- 1) MİMARİ (basit cephe iskeleti) ----
  {
    const g = systemGroup('architectural');
    for (const f of FLOORS) {
      const box = new THREE.LineSegments(
        new THREE.EdgesGeometry(new THREE.BoxGeometry(BUILDING.width, f.height, BUILDING.depth)),
        lineMat(COLORS.architectural, 0.45),
      );
      box.position.set(0, f.elevation + f.height / 2, 0);
      g.add(box);
    }
    systems.push({ layer: 'architectural', group: g });
  }

  // ---- 2) TAŞIYICI SİSTEM (konsept) ----
  {
    const g = systemGroup('structural');
    const mat = new THREE.MeshStandardMaterial({
      color: COLORS.structural, emissive: COLORS.structural, emissiveIntensity: 0.35,
      roughness: 0.4, metalness: 0.3, transparent: true, opacity: 0.85,
    });
    const axesX = [-15, -8, 0, 8, 15];
    const axesZ = [-11, 0, 11];
    // kolonlar
    for (const f of FLOORS) {
      for (const x of axesX) {
        for (const z of axesZ) {
          const col = new THREE.Mesh(new THREE.BoxGeometry(0.45, f.height, 0.45), mat);
          col.position.set(x, f.elevation + f.height / 2, z);
          col.castShadow = false;
          col.userData.layer = 'structural';
          g.add(col);
        }
      }
      // kirişler (kat seviyesinde)
      for (const x of axesX) {
        const beam = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.42, BUILDING.depth), mat);
        beam.position.set(x, f.elevation + f.height - 0.3, 0);
        g.add(beam);
      }
      for (const z of axesZ) {
        const beam = new THREE.Mesh(new THREE.BoxGeometry(BUILDING.width, 0.42, 0.32), mat);
        beam.position.set(0, f.elevation + f.height - 0.3, z);
        g.add(beam);
      }
    }
    // perde duvarlar (çekirdek çevresi)
    for (const [x, z, w, d] of [
      [-CORE.width / 2, 0, 0.4, CORE.depth],
      [CORE.width / 2, 0, 0.4, CORE.depth],
      [0, -CORE.depth / 2, CORE.width, 0.4],
    ]) {
      const wall = new THREE.Mesh(new THREE.BoxGeometry(w, 16.5, d), mat);
      wall.position.set(x, 8.2, z);
      g.add(wall);
    }
    systems.push({ layer: 'structural', group: g });
  }

  // ---- 3) ELEKTRİK ----
  {
    const g = systemGroup('electrical');
    const mat = tubeMat(COLORS.electrical);
    // dikey ana kolon (çekirdek yanında)
    const riserX = -3.2, riserZ = -2.6;
    g.add(verticalTube(riserX, riserZ, -3.2, ROOF_ELEVATION, mat));
    for (const f of FLOORS) {
      // kat panosu
      const panel = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.7, 0.2), mat);
      panel.position.set(riserX + 0.5, f.elevation + 1.8, riserZ + 0.3);
      g.add(panel);
      // yatay kablo güzergâhları (koridor tavanı)
      for (const [dx, dz, len, rotY] of [
        [0, -5.6, 20, 0],
        [0, 5.6, 20, 0],
        [-12.5, 0, 9, Math.PI / 2],
        [12.5, 0, 9, Math.PI / 2],
      ] as Array<[number, number, number, number]>) {
        if (f.index < 0) continue;
        const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, len, 6), mat);
        tube.rotation.z = Math.PI / 2;
        tube.rotation.y = rotY;
        tube.position.set(dx, f.elevation + f.height - 0.4, dz);
        g.add(tube);
      }
    }
    systems.push({ layer: 'electrical', group: g });
  }

  // ---- 4) TEMİZ SU ----
  {
    const g = systemGroup('water');
    const mat = tubeMat(COLORS.water);
    const riserX = 3.0, riserZ = 2.8;
    g.add(verticalTube(riserX, riserZ, -3.2, ROOF_ELEVATION, mat, 0.085));
    // bodrumda su deposu bağlantısı
    const tank = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.1, 1.8, 16), mat);
    tank.position.set(12.0, 0.9, -9.2);
    g.add(tank);
    const feed = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 10, 6), mat);
    feed.rotation.z = Math.PI / 2;
    feed.position.set(7.5, 2.5, -9.2);
    g.add(feed);
    for (const f of FLOORS) {
      if (f.index < 0) continue;
      // kat içi dağıtım
      const dist = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 22, 6), mat);
      dist.rotation.z = Math.PI / 2;
      dist.position.set(0, f.elevation + 2.6, riserZ);
      g.add(dist);
      for (const q of Object.values(APARTMENT_QUADRANTS)) {
        const drop = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 2.2, 6), mat);
        drop.position.set(q.x * 1.1, f.elevation + 1.5, q.z * 0.9);
        g.add(drop);
      }
    }
    systems.push({ layer: 'water', group: g });
  }

  // ---- 5) ATIK SU ----
  {
    const g = systemGroup('waste');
    const mat = tubeMat(COLORS.waste, 0.8);
    const riserX = 3.6, riserZ = 2.2;
    g.add(verticalTube(riserX, riserZ, -3.2, ROOF_ELEVATION, mat, 0.11));
    for (const f of FLOORS) {
      if (f.index < 0) continue;
      const dist = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 18, 6), mat);
      dist.rotation.z = Math.PI / 2;
      dist.position.set(1, f.elevation + 0.25, riserZ - 1.2);
      g.add(dist);
    }
    systems.push({ layer: 'waste', group: g });
  }

  // ---- 6) HAVALANDIRMA ----
  {
    const g = systemGroup('hvac');
    const mat = tubeMat(COLORS.hvac, 0.55);
    const shaftX = -3.9, shaftZ = 3.2;
    // dikey kanal şaftı
    const shaft = new THREE.Mesh(new THREE.BoxGeometry(1.2, ROOF_ELEVATION + 3.2, 1.2), mat);
    shaft.position.set(shaftX, (ROOF_ELEVATION - 3.2) / 2, shaftZ);
    g.add(shaft);
    for (const f of FLOORS) {
      if (f.index < 0) continue;
      // kat ana kanalı
      const duct = new THREE.Mesh(new THREE.BoxGeometry(20, 0.55, 0.75), mat);
      duct.position.set(0, f.elevation + f.height - 0.65, shaftZ);
      g.add(duct);
      // menfezler
      for (let i = -3; i <= 3; i++) {
        const vent = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.14, 0.5), mat);
        vent.position.set(i * 3, f.elevation + f.height - 0.95, shaftZ);
        g.add(vent);
      }
    }
    systems.push({ layer: 'hvac', group: g });
  }

  // ---- 7) YANGIN GÜVENLİĞİ (konsept) ----
  {
    const g = systemGroup('fire');
    const mat = tubeMat(COLORS.fire, 0.7);
    const riserX = -2.0, riserZ = -3.6;
    g.add(verticalTube(riserX, riserZ, -3.2, ROOF_ELEVATION, mat, 0.075));
    for (const f of FLOORS) {
      if (f.index < 0) continue;
      // sprinkler hattı
      const line1 = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 26, 6), mat);
      line1.rotation.z = Math.PI / 2;
      line1.position.set(0, f.elevation + f.height - 0.25, -6.5);
      g.add(line1);
      const line2 = line1.clone();
      line2.position.z = 6.5;
      g.add(line2);
      // sprinkler başlıkları
      for (let i = -5; i <= 5; i++) {
        for (const z of [-6.5, 6.5]) {
          const head = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.03, 0.18, 6), mat);
          head.position.set(i * 2.4, f.elevation + f.height - 0.38, z);
          g.add(head);
        }
      }
      // yangın dolabı
      const cab = new THREE.Mesh(new THREE.BoxGeometry(0.7, 1.0, 0.25), mat);
      cab.position.set(CORE.width / 2 + 0.3, f.elevation + 1.2, CORE.depth / 2 + 0.3);
      g.add(cab);
    }
    systems.push({ layer: 'fire', group: g });
  }

  return systems;
}

function systemGroup(layer: SystemLayer): THREE.Group {
  const g = new THREE.Group();
  g.name = `xray-${layer}`;
  g.visible = false;
  g.userData.layer = layer;
  return g;
}

function tubeMat(color: number, opacity = 0.9): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color, emissive: color, emissiveIntensity: 0.55, roughness: 0.35, metalness: 0.2,
    transparent: true, opacity,
  });
}

function lineMat(color: number, opacity: number): THREE.LineBasicMaterial {
  return new THREE.LineBasicMaterial({ color, transparent: true, opacity });
}

function verticalTube(x: number, z: number, y1: number, y2: number, mat: THREE.Material, r = 0.06): THREE.Mesh {
  const h = y2 - y1;
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 8), mat);
  mesh.position.set(x, y1 + h / 2, z);
  return mesh;
}

/** X-Ray katman sistemlerini yönetir */
export class XRayController {
  private systems: XRaySystem[];
  private activeLayers = new Set<SystemLayer>();
  private facadeMeshes: THREE.Mesh[] = [];
  private outerWalls: THREE.Mesh[] = [];
  private roofGroup: THREE.Object3D | null = null;

  enabled = false;

  constructor(systems: XRaySystem[]) {
    this.systems = systems;
  }

  registerFacade(meshes: THREE.Mesh[]): void {
    this.facadeMeshes.push(...meshes);
  }

  registerRoof(roof: THREE.Object3D): void {
    this.roofGroup = roof;
  }

  registerOuterWalls(meshes: THREE.Mesh[]): void {
    this.outerWalls.push(...meshes);
  }

  setEnabled(on: boolean): void {
    this.enabled = on;
    if (!on) {
      this.systems.forEach((s) => (s.group.visible = false));
      this.activeLayers.clear();
      this.applyFacadeFade(false);
      return;
    }
    // varsayılan: tüm teknik katmanlar açık
    this.activeLayers = new Set(SYSTEM_LAYERS.filter((l) => l.key !== 'architectural').map((l) => l.key));
    this.systems.forEach((s) => (s.group.visible = s.layer === 'architectural' ? true : this.activeLayers.has(s.layer)));
    this.applyFacadeFade(true);
  }

  toggleLayer(layer: SystemLayer, on: boolean): void {
    if (on) this.activeLayers.add(layer);
    else this.activeLayers.delete(layer);
    const sys = this.systems.find((s) => s.layer === layer);
    if (sys) sys.group.visible = on && this.enabled;
    if (layer === 'architectural') this.applyFacadeFade(this.enabled);
  }

  isLayerOn(layer: SystemLayer): boolean {
    return this.enabled && this.activeLayers.has(layer);
  }

  get activeCount(): number {
    return this.enabled ? this.activeLayers.size : 0;
  }

  private applyFacadeFade(on: boolean): void {
    // cephe camını fazla saydamlaştır, dış duvarları soluklaştır
    this.facadeMeshes.forEach((m) => {
      const mat = m.material as THREE.MeshPhysicalMaterial;
      if (!mat.userData.origOpacity) mat.userData.origOpacity = mat.opacity;
      mat.transparent = true;
      // X-Ray'de cam neredeyse tam saydam: iç teknik borular cephenin arkasında kaybolmasın
      mat.opacity = on ? 0.03 : mat.userData.origOpacity;
      mat.depthWrite = !on;
      mat.needsUpdate = true;
    });
    this.outerWalls.forEach((m) => {
      const mat = m.material as THREE.MeshStandardMaterial;
      if (!mat.userData.origOpacity) mat.userData.origOpacity = mat.opacity;
      mat.transparent = true;
      mat.opacity = on ? 0.14 : mat.userData.origOpacity;
      mat.needsUpdate = true;
    });
    if (this.roofGroup) {
      this.roofGroup.visible = !on || !this.activeLayers.has('structural');
    }
  }

  dispose(): void {
    this.systems.forEach((s) => {
      s.group.traverse((o) => {
        const m = o as THREE.Mesh;
        if (m.isMesh) m.geometry.dispose();
      });
    });
  }
}
