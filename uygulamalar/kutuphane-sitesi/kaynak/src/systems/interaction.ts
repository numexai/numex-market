import * as THREE from 'three';
import type { BuildingSystem } from '../building/building';
import type { PickMeta, } from '../core/geometry';
import type { MaterialKey } from '../data/building';
import type { CameraMode } from './camera';

/**
 * Etkileşim: raycast ile nesne seçimi, kapı/ışık/pencere/asansör tıklamaları,
 * malzeme değiştirme. Tüm state değişiklikleri UI'ya bildirilir.
 */

export interface SelectionInfo {
  meta: PickMeta;
  object: THREE.Object3D;
  worldPos: THREE.Vector3;
}

export interface InteractionEvents {
  onSelect: (info: SelectionInfo | null) => void;
  onFloorPick: (floorId: string) => void;
  onToast: (message: string) => void;
  onLightChange: () => void;
  onDoorChange: (id: string, open: boolean) => void;
  onElevatorChange: () => void;
  onWindowChange: (id: string, open: boolean) => void;
  onMaterialChange: (key: MaterialKey) => void;
}

const MATERIAL_CYCLE: MaterialKey[] = ['marble', 'wood', 'concrete', 'fabric', 'stone', 'woodDark'];

export class InteractionSystem {
  private raycaster = new THREE.Raycaster();
  private pointer = new THREE.Vector2();
  private downPos = new THREE.Vector2();
  private selected: SelectionInfo | null = null;
  private hovered: THREE.Object3D | null = null;
  private events: InteractionEvents;
  private building: BuildingSystem;
  private camera: THREE.Camera;
  private dom: HTMLElement;
  private enabled = true;
  windowStates = new Map<string, boolean>();

  constructor(
    building: BuildingSystem,
    camera: THREE.Camera,
    dom: HTMLElement,
    events: InteractionEvents,
  ) {
    this.building = building;
    this.camera = camera;
    this.dom = dom;
    this.events = events;

    dom.addEventListener('pointerdown', (e) => {
      this.downPos.set(e.clientX, e.clientY);
    });
    dom.addEventListener('pointerup', (e) => {
      const dist = this.downPos.distanceTo(new THREE.Vector2(e.clientX, e.clientY));
      if (dist > 6) return; // sürükleme = orbit, tıklama değil
      this.handleClick(e);
    });
    dom.addEventListener('pointermove', (e) => {
      if (e.buttons !== 0) return;
      this.handleHover(e);
    });
  }

  setEnabled(on: boolean): void {
    this.enabled = on;
    this.dom.style.cursor = 'default';
  }

  private setPointer(e: PointerEvent | MouseEvent): void {
    const rect = this.dom.getBoundingClientRect();
    this.pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
  }

  private pick(e: PointerEvent | MouseEvent): THREE.Intersection[] {
    this.setPointer(e);
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const hits: THREE.Intersection[] = [];
    const roots: THREE.Object3D[] = [this.building.root];
    roots.forEach((r) => {
      hits.push(...this.raycaster.intersectObject(r, true));
    });
    // gizli olanları ele
    return hits.filter((h) => {
      let o: THREE.Object3D | null = h.object;
      while (o) {
        if (!o.visible) return false;
        o = o.parent;
      }
      return true;
    });
  }

  private handleHover(e: PointerEvent): void {
    if (!this.enabled) return;
    const hits = this.pick(e);
    const pickable = hits.find((h) => (h.object.userData as any).meta);
    if (pickable) {
      this.dom.style.cursor = 'pointer';
    } else {
      this.dom.style.cursor = 'grab';
    }
  }

  private handleClick(e: PointerEvent): void {
    if (!this.enabled) return;
    const hits = this.pick(e);
    if (hits.length === 0) {
      this.clearSelection();
      return;
    }
    const hit = hits.find((h) => (h.object.userData as any).meta) ?? hits[0];
    const obj = hit.object;
    const meta = (obj.userData as any).meta as PickMeta | undefined;

    // kat zeminini tıklama → kat izole
    if (meta?.kind === 'floor' && meta.floorId && (obj as THREE.Mesh).name.startsWith('slab-')) {
      this.events.onFloorPick(meta.floorId);
    }

    if (!meta) {
      this.clearSelection();
      return;
    }

    // meta türüne göre etkileşim
    switch (meta.kind) {
      case 'door':
        this.toggleDoor(meta.id);
        break;
      case 'light':
        this.toggleLightInRoom(meta);
        break;
      case 'window':
        this.toggleWindow(meta, obj as THREE.Mesh);
        break;
      case 'elevator':
        this.events.onToast('Asansör çağrı paneli — sağ paneldeki kat listesinden kat seçin.');
        break;
      default:
        break;
    }

    this.selected = { meta, object: obj, worldPos: hit.point.clone() };
    this.applyHighlight(obj);
    this.events.onSelect(this.selected);
  }

  // --- HIGHLIGHT ---
  private highlightTargets: Array<{ mesh: THREE.Mesh; orig: number }> = [];

  private applyHighlight(obj: THREE.Object3D): void {
    this.clearHighlight();
    const box = new THREE.Box3().setFromObject(obj);
    // seçili nesnenin çevresine ışıklı çerçeve
    const helper = new THREE.Box3Helper(box, new THREE.Color(0x6ee7b7));
    helper.name = '__selectionHelper';
    (helper.material as THREE.LineBasicMaterial).depthTest = false;
    (helper.material as THREE.LineBasicMaterial).transparent = true;
    (helper.material as THREE.LineBasicMaterial).opacity = 0.9;
    this.building.root.add(helper);
  }

  private clearHighlight(): void {
    const found = this.building.root.getObjectByName('__selectionHelper');
    if (found) {
      this.building.root.remove(found);
      (found as THREE.Box3Helper).geometry.dispose();
      ((found as THREE.Box3Helper).material as THREE.Material).dispose();
    }
  }

  clearSelection(): void {
    this.clearHighlight();
    this.selected = null;
    this.events.onSelect(null);
  }

  get selection(): SelectionInfo | null {
    return this.selected;
  }

  // --- ETKİLEŞİMLER ---

  toggleDoor(id: string): void {
    const door = this.building.heroDoors.find((d) => d.id === id);
    if (!door) return;
    door.open = !door.open;
    door.targetAngle = door.open ? door.openAngle : 0;
    const info = (door.mesh.userData as any).meta as PickMeta | undefined;
    if (info) {
      info.info = [
        ['Genişlik', (info.info?.find((i) => i[0] === 'Genişlik')?.[1]) ?? '90 cm'],
        ['Durum', door.open ? 'Açık' : 'Kapalı'],
      ];
    }
    this.events.onDoorChange(id, door.open);
    this.events.onToast(`${door.label}: ${door.open ? 'açıldı' : 'kapandı'}`);
    if (this.selected?.meta.id === id) {
      this.selected.meta.info = [['Genişlik', '90–110 cm'], ['Durum', door.open ? 'Açık' : 'Kapalı']];
      this.events.onSelect(this.selected);
    }
  }

  toggleLightInRoom(meta: PickMeta): void {
    const lamps = this.building.heroLights.filter((l) => meta.id.startsWith(l.id) || l.meshes.some((m) => (m.userData as any).meta?.id === meta.id));
    // meta.id formatı: light-<floor>-<room>-<x>-<z>
    const target = this.building.heroLights.find((l) => meta.id.startsWith(`light-${l.floorId}-`) && this.extractRoomFromLightId(meta.id) === l.id.split('-').pop());
    const lights = target ? [target] : lamps;
    if (lights.length === 0) return;
    lights.forEach((l) => this.setLight(l.id, !l.on));
    this.events.onLightChange();
    this.events.onToast(`Işık: ${lights[0].room} — ${lights[0].on ? 'açık' : 'kapalı'}`);
  }

  private extractRoomFromLightId(id: string): string {
    // "light-K1-salon-12-4" → "salon"
    const parts = id.split('-');
    return parts[2] ?? '';
  }

  setLight(lightId: string, on: boolean): void {
    const l = this.building.heroLights.find((x) => x.id === lightId);
    if (!l) return;
    l.on = on;
    l.meshes.forEach((m) => {
      const mat = m.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = on ? 1.6 : 0.04;
      mat.color.setHex(on ? 0xfff1d6 : 0x8a8578);
      mat.needsUpdate = true;
    });
    if (l.pointLight) l.pointLight.intensity = on ? 5 : 0;
  }

  toggleWindow(meta: PickMeta, mesh: THREE.Mesh): void {
    const cur = this.windowStates.get(meta.id) ?? false;
    const next = !cur;
    this.windowStates.set(meta.id, next);
    this.events.onWindowChange(meta.id, next);
    this.events.onToast(`${meta.label}: ${next ? 'açık' : 'kapalı'}`);
    if (this.selected?.meta.id === meta.id) {
      this.selected.meta.info = [['Panel', 'Isı yalıtımlı çift cam'], ['Durum', next ? 'Açık (havalandırma)' : 'Kapalı']];
      this.events.onSelect(this.selected);
    }
  }

  cycleMaterial(key: MaterialKey): void {
    this.events.onMaterialChange(key);
  }
}

/** Kat kodundan gösterim adı */
export function modeLabel(mode: CameraMode): string {
  switch (mode) {
    case 'exterior': return 'Dış Mekân';
    case 'interior': return 'İç Mekân';
    case 'cinematic': return 'Sinematik';
  }
}
