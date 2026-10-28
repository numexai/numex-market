import * as THREE from 'three';
import type { ShelfMeta } from '../data/catalog';

/**
 * Kütüphane etkileşimi: kitaplığa/mobilyaya tıklama.
 *
 * Raycast yalnız "seçilebilir" nesneleri tarar (kitaplık gövdesi, mobilya
 * grupları). Binlerce kitap örneğine ve cama dokunulmaz — maliyet düşük kalır.
 */

export interface PickTarget {
  object: THREE.Object3D;
  onPick: (hit: THREE.Intersection) => void;
}

export class LibraryInteraction {
  private raycaster = new THREE.Raycaster();
  private mouse = new THREE.Vector2();
  private targets: THREE.Object3D[] = [];
  private hovered: THREE.Object3D | null = null;
  private enabled = true;

  onShelfPick: ((meta: ShelfMeta) => void) | null = null;
  onFurniturePick: ((meta: { label: string; info: Array<[string, string]> }) => void) | null = null;
  onEmptyPick: (() => void) | null = null;

  constructor(private dom: HTMLElement, private camera: THREE.PerspectiveCamera) {
    dom.addEventListener('pointerdown', this.onDown, { passive: true });
    dom.addEventListener('pointermove', this.onMove, { passive: true });
  }

  /** Seçilebilir nesneleri kaydet (kitaplık grupları, mobilya grupları) */
  register(objects: THREE.Object3D[]): void {
    for (const o of objects) {
      o.traverse((c) => {
        const m = c as THREE.Mesh;
        if (m.isMesh && m.userData.shelf) this.targets.push(m);
      });
    }
  }

  /** Mobilya gruplarını ayrı kaydet — bunlar meta taşır */
  registerFurniture(groups: THREE.Object3D[]): void {
    for (const g of groups) {
      g.traverse((c) => {
        const m = c as THREE.Mesh;
        if (m.isMesh) this.targets.push(m);
      });
      // grubun kendisi de hedef olsun (raycast çocukları da döner)
      this.targets.push(g);
    }
  }

  setEnabled(on: boolean): void {
    this.enabled = on;
    if (!on) document.body.style.cursor = 'default';
  }

  private updateMouse(e: PointerEvent | MouseEvent): void {
    const r = this.dom.getBoundingClientRect();
    this.mouse.x = ((e.clientX - r.left) / r.width) * 2 - 1;
    this.mouse.y = -((e.clientY - r.top) / r.height) * 2 + 1;
  }

  private onDown = (e: PointerEvent): void => {
    if (!this.enabled) return;
    // Sürükleme (kamera döndürme) ile tıklamayı ayır
    const startX = e.clientX, startY = e.clientY;
    const up = (ev: PointerEvent) => {
      this.dom.removeEventListener('pointerup', up);
      if (Math.hypot(ev.clientX - startX, ev.clientY - startY) > 6) return;
      this.pick(ev);
    };
    this.dom.addEventListener('pointerup', up, { once: true });
  };

  private onMove = (e: PointerEvent): void => {
    if (!this.enabled) return;
    this.updateMouse(e);
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const hits = this.raycaster.intersectObjects(this.targets, false);
    const first = hits.find((h) => this.isPickable(h.object));
    if (first) {
      document.body.style.cursor = 'pointer';
      this.hovered = first.object;
    } else {
      document.body.style.cursor = 'default';
      this.hovered = null;
    }
  };

  private isPickable(o: THREE.Object3D): boolean {
    let n: THREE.Object3D | null = o;
    while (n) {
      if (n.userData.pickable === false) return false;
      n = n.parent;
    }
    return true;
  }

  private pick(e: PointerEvent): void {
    this.updateMouse(e);
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const hits = this.raycaster.intersectObjects(this.targets, false);
    const hit = hits.find((h) => this.isPickable(h.object));

    if (!hit) {
      this.onEmptyPick?.();
      return;
    }

    // Kitaplık gövdesi: en yakın üst düğümde userData.shelf var
    let n: THREE.Object3D | null = hit.object;
    while (n) {
      const shelf = n.userData.shelf as ShelfMeta | undefined;
      if (shelf) {
        this.onShelfPick?.(shelf);
        return;
      }
      n = n.parent;
    }

    // Mobilya: `furnitureMeta` taşıyan grup
    n = hit.object;
    while (n) {
      const fm = n.userData.furnitureMeta as { label: string; info: Array<[string, string]> } | undefined;
      if (fm) {
        this.onFurniturePick?.(fm);
        return;
      }
      n = n.parent;
    }

    this.onEmptyPick?.();
  }

  dispose(): void {
    this.dom.removeEventListener('pointerdown', this.onDown);
    this.dom.removeEventListener('pointermove', this.onMove);
  }
}
