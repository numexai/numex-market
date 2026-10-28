import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { FLOORS, CORE, BUILDING } from '../data/building';

/**
 * Kamera sistemi — üç mod:
 *  1) DIŞ MEKÂN: OrbitControls (360°, zoom, pan)
 *  2) İÇ MEKÂN: WASD + fare ile bakış + duvar çarpışması (AABB)
 *  3) SİNEMATİK: spline yolu üzerinde otomatik tur
 */

export type CameraMode = 'exterior' | 'interior' | 'cinematic';

export interface CollisionBox {
  minX: number; maxX: number; minZ: number; maxZ: number; minY: number; maxY: number;
}

export class CameraController {
  readonly camera: THREE.PerspectiveCamera;
  readonly controls: OrbitControls;
  private renderer: THREE.WebGLRenderer;
  private containerEl: HTMLElement;

  mode: CameraMode = 'exterior';

  // iç mekân durumu
  private walkPos = new THREE.Vector3(-8, 0, 10);
  private walkYaw = 0;
  private walkPitch = 0;
  private walkFloorId = 'Z';
  private keys = new Set<string>();
  private colliders: CollisionBox[] = [];
  private pointerLocked = false;
  private dragging = false;

  // sinematik durumu
  private cineCurve: THREE.CatmullRomCurve3 | null = null;
  private cineLook: THREE.CatmullRomCurve3 | null = null;
  private cineT = 0;
  private cinePlaying = false;
  private cineDuration = 42; // saniye

  onModeChange: ((mode: CameraMode) => void) | null = null;
  onCinematicProgress: ((t: number) => void) | null = null;

  constructor(renderer: THREE.WebGLRenderer, container: HTMLElement) {
    this.renderer = renderer;
    this.containerEl = container;
    this.camera = new THREE.PerspectiveCamera(52, 1, 0.1, 900);
    this.camera.position.set(52, 30, 58);

    this.controls = new OrbitControls(this.camera, renderer.domElement);
    this.controls.target.set(0, 9, 0);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.06;
    this.controls.minDistance = 14;
    this.controls.maxDistance = 190;
    this.controls.maxPolarAngle = Math.PI * 0.495;
    this.controls.minPolarAngle = 0.06;
    this.controls.autoRotate = true;
    this.controls.autoRotateSpeed = 0.35;
    this.controls.update();

    this.buildCinematicPath();
    this.bindEvents();
    this.resize();
  }

  private buildCinematicPath(): void {
    // Dış cepheden başla → lobiye in → asansöre → 3. kat daireye → terasa çık
    const pts: THREE.Vector3[] = [
      new THREE.Vector3(58, 34, 64),      // 0 geniş dış görünüm
      new THREE.Vector3(40, 22, 42),      // 1 yaklaşma
      new THREE.Vector3(12, 15, 30),      // 2 giriş cephesi
      new THREE.Vector3(0, 6.4, 22),      // 3 giriş saçağı altı
      new THREE.Vector3(0, 2.1, 14),      // 4 girişe yaklaşma
      new THREE.Vector3(0, 2.0, 4.5),     // 5 lobi içi
      new THREE.Vector3(-4.5, 1.9, 3.2),  // 6 lobi gezintisi
      new THREE.Vector3(CORE.elevatorA.x, 2.4, CORE.elevatorA.z + 1.6), // 7 asansör önü
      new THREE.Vector3(CORE.elevatorA.x, FLOORS[3].elevation + 2.0, CORE.elevatorA.z + 1.4), // 8 3. kat asansör
      new THREE.Vector3(-6, FLOORS[3].elevation + 2.0, -5.0), // 9 koridor
      new THREE.Vector3(-8, FLOORS[1].elevation + 2.2, -3.5), // 10 K1 daire salonu
      new THREE.Vector3(-5, FLOORS[1].elevation + 2.0, 4.5), // 11 salon/balkon
      new THREE.Vector3(-10, FLOORS[5].elevation + 3.0, 6.5), // 12 teras
      new THREE.Vector3(-4, FLOORS[5].elevation + 3.4, 12), // 13 teras üstü
      new THREE.Vector3(26, 24, 40),      // 14 kapanış geniş
    ];
    this.cineCurve = new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.35);

    const lookPts: THREE.Vector3[] = [
      new THREE.Vector3(0, 12, 0),
      new THREE.Vector3(0, 12, 0),
      new THREE.Vector3(0, 10, 0),
      new THREE.Vector3(0, 3.5, 6),
      new THREE.Vector3(0, 2.6, 0),
      new THREE.Vector3(-2, 2.2, -1),
      new THREE.Vector3(CORE.elevatorA.x, 2.0, CORE.elevatorA.z),
      new THREE.Vector3(CORE.elevatorA.x, 2.2, CORE.elevatorA.z),
      new THREE.Vector3(-4, FLOORS[3].elevation + 1.6, -3),
      new THREE.Vector3(-6, FLOORS[3].elevation + 1.8, -6),
      new THREE.Vector3(-6, FLOORS[1].elevation + 1.6, 2),
      new THREE.Vector3(-3, FLOORS[1].elevation + 1.4, 8),
      new THREE.Vector3(-8, FLOORS[5].elevation + 2.0, 4),
      new THREE.Vector3(-8, FLOORS[5].elevation + 2.2, 9),
      new THREE.Vector3(0, 10, 0),
    ];
    this.cineLook = new THREE.CatmullRomCurve3(lookPts, false, 'catmullrom', 0.35);
  }

  private bindEvents(): void {
    const el = this.renderer.domElement;

    window.addEventListener('keydown', (e) => {
      this.keys.add(e.code);
      if (e.code === 'Escape' && this.pointerLocked) {
        document.exitPointerLock?.();
        this.pointerLocked = false;
      }
    });
    window.addEventListener('keyup', (e) => this.keys.delete(e.code));

    // İç mekân bakış: pointerlock veya sürükleme
    el.addEventListener('click', () => {
      if (this.mode === 'interior' && !this.pointerLocked) {
        el.requestPointerLock?.();
      }
    });
    document.addEventListener('pointerlockchange', () => {
      this.pointerLocked = document.pointerLockElement === el;
    });
    el.addEventListener('mousedown', () => {
      if (this.mode === 'interior') this.dragging = true;
    });
    window.addEventListener('mouseup', () => (this.dragging = false));
    document.addEventListener('mousemove', (e) => {
      if (this.mode !== 'interior') return;
      if (!this.pointerLocked && !this.dragging) return;
      this.walkYaw -= e.movementX * 0.0022;
      this.walkPitch -= e.movementY * 0.0022;
      this.walkPitch = Math.max(-1.2, Math.min(1.2, this.walkPitch));
    });

    // dokunmatik bakış
    let lastTouchX = 0, lastTouchY = 0;
    el.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1 && this.mode === 'interior') {
        lastTouchX = e.touches[0].clientX;
        lastTouchY = e.touches[0].clientY;
      }
    }, { passive: true });
    el.addEventListener('touchmove', (e) => {
      if (this.mode !== 'interior' || !this.pointerLocked) return;
      const t = e.touches[0];
      this.walkYaw -= (t.clientX - lastTouchX) * 0.005;
      this.walkPitch -= (t.clientY - lastTouchY) * 0.005;
      this.walkPitch = Math.max(-1.2, Math.min(1.2, this.walkPitch));
      lastTouchX = t.clientX;
      lastTouchY = t.clientY;
    }, { passive: true });
  }

  resize(): void {
    const w = this.containerEl.clientWidth || window.innerWidth;
    const h = this.containerEl.clientHeight || window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  setColliders(boxes: CollisionBox[]): void {
    this.colliders = boxes;
  }

  setMode(mode: CameraMode): void {
    if (mode === this.mode) {
      if (mode !== 'cinematic') return;
    }
    // mevcut moddan çıkış
    if (this.mode === 'interior') document.exitPointerLock?.();

    this.mode = mode;
    if (mode === 'exterior') {
      this.controls.enabled = true;
      this.controls.autoRotate = true;
      this.camera.position.set(52, 30, 58);
      this.controls.target.set(0, 9, 0);
      this.controls.update();
    } else if (mode === 'interior') {
      this.controls.enabled = false;
      this.controls.autoRotate = false;
      // Başlangıç noktası: son izole edilen kat, yoksa zemin kat. Lobi İÇİNDE.
      this.setInteriorStart(this.walkFloorId ?? 'Z');
    } else if (mode === 'cinematic') {
      this.controls.enabled = false;
      this.controls.autoRotate = false;
      this.cineT = 0;
      this.cinePlaying = true;
    }
    this.onModeChange?.(mode);
  }

  /** İç mekân başlangıç noktasını kat seçimi için ayarla */
  setInteriorStart(floorId: string): void {
    const f = FLOORS.find((x) => x.id === floorId);
    if (!f) return;
    this.walkFloorId = floorId;
    if (f.kind === 'basement') {
      this.walkPos.set(-6, f.elevation, 0);
      this.walkYaw = Math.PI * 0.5;
    } else if (f.kind === 'ground') {
      // Lobi açık alanı: resepsiyon/sosyal alanların arasındaki boş koridor.
      this.walkPos.set(-1.5, f.elevation, 8.6);
      this.walkYaw = Math.PI; // kuzeye, çekirdeğe doğru bak
    } else {
      // KORİDOR: bina sınırı x=±15, daire cepheleri x≈±10.5. -11.5 duvara çok
      // yakındı; spiral arama kamerayı duvar dibine bırakıyordu → orta şerit.
      this.walkPos.set(-12.6, f.elevation, 0);
      this.walkYaw = Math.PI * 0.5; // doğuya, dairelere/çekirdeğe doğru
    }
    this.walkPitch = -0.04;
    this.ensureFreeStart();
    // Konum değişti → kamerayı HEMEN güncelle (yoksa eski konumda kalır)
    this.updateInteriorCamera();
  }

  /**
   * Başlangıç noktası bir duvarın/mobilyanın içine denk gelirse kamerayı
   * en yakın boş noktaya taşı. Aksi hâlde ekran tamamen duvarla kaplanır.
   */
  private ensureFreeStart(): void {
    const y = this.walkPos.y;
    if (!this.collides(this.walkPos.x, y, this.walkPos.z)) return;
    // spiral arama: artan yarıçapla boş bir nokta bul
    for (let r = 0.6; r <= 9; r += 0.6) {
      for (let a = 0; a < 16; a++) {
        const ang = (a / 16) * Math.PI * 2;
        const nx = this.walkPos.x + Math.cos(ang) * r;
        const nz = this.walkPos.z + Math.sin(ang) * r;
        if (!this.collides(nx, y, nz)) {
          this.walkPos.set(nx, y, nz);
          return;
        }
      }
    }
  }

  private updateInteriorCamera(): void {
    this.camera.position.set(this.walkPos.x, this.walkPos.y + 1.68, this.walkPos.z);
    const dir = new THREE.Vector3(
      Math.sin(this.walkYaw) * Math.cos(this.walkPitch),
      Math.sin(this.walkPitch),
      Math.cos(this.walkYaw) * Math.cos(this.walkPitch),
    );
    this.camera.lookAt(this.camera.position.clone().add(dir));
  }

  /** Oyuncu çarpışma testi */
  private collides(x: number, y: number, z: number, radius = 0.42): boolean {
    const feet = y + 0.1;
    const head = y + 1.8;
    for (const b of this.colliders) {
      if (head < b.minY || feet > b.maxY) continue;
      if (x + radius > b.minX && x - radius < b.maxX && z + radius > b.minZ && z - radius < b.maxZ) {
        return true;
      }
    }
    // bina dışına çıkmayı engelle (güvenlik alanı)
    if (Math.abs(x) > 90 || Math.abs(z) > 90) return true;
    return false;
  }

  private updateInterior(dt: number): void {
    const speed = (this.keys.has('ShiftLeft') || this.keys.has('ShiftRight')) ? 6.2 : 3.0;
    let fwd = 0, strafe = 0;
    if (this.keys.has('KeyW') || this.keys.has('ArrowUp')) fwd += 1;
    if (this.keys.has('KeyS') || this.keys.has('ArrowDown')) fwd -= 1;
    if (this.keys.has('KeyA') || this.keys.has('ArrowLeft')) strafe -= 1;
    if (this.keys.has('KeyD') || this.keys.has('ArrowRight')) strafe += 1;
    if (this.keys.has('KeyQ')) this.walkYaw += dt * 1.4;
    if (this.keys.has('KeyE')) this.walkYaw -= dt * 1.4;
    if (this.keys.has('Space')) this.walkPos.y += dt * 2.2;
    if (this.keys.has('ControlLeft')) this.walkPos.y -= dt * 2.2;

    if (fwd !== 0 || strafe !== 0) {
      const len = Math.hypot(fwd, strafe) || 1;
      const dirX = Math.sin(this.walkYaw);
      const dirZ = Math.cos(this.walkYaw);
      const moveX = (fwd / len) * dirX + (strafe / len) * Math.cos(this.walkYaw);
      const moveZ = (fwd / len) * dirZ - (strafe / len) * Math.sin(this.walkYaw);
      const nx = this.walkPos.x + moveX * speed * dt;
      const nz = this.walkPos.z + moveZ * speed * dt;
      // X ekseni ve Z ekseni ayrı denenir — duvar boyunca kayma sağlar
      if (!this.collides(nx, this.walkPos.y, this.walkPos.z)) this.walkPos.x = nx;
      if (!this.collides(this.walkPos.x, this.walkPos.y, nz)) this.walkPos.z = nz;
    }
    this.updateInteriorCamera();
  }

  private updateCinematic(dt: number): void {
    if (!this.cineCurve || !this.cineLook || !this.cinePlaying) return;
    this.cineT += dt / this.cineDuration;
    if (this.cineT >= 1) {
      this.cineT = 1;
      this.cinePlaying = false;
    }
    // yumuşak giriş/çıkış
    const t = this.cineT;
    const pos = this.cineCurve.getPointAt(Math.min(1, Math.max(0, t)));
    const look = this.cineLook.getPointAt(Math.min(1, Math.max(0, t)));
    this.camera.position.lerp(pos, Math.min(1, dt * 6));
    const currentLook = this.camera.position.clone().add(
      new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion).multiplyScalar(5),
    );
    this.camera.lookAt(currentLook.lerp(look, Math.min(1, dt * 4)));
    this.onCinematicProgress?.(t);
  }

  get cinematicProgress(): number {
    return this.cineT;
  }

  get cinematicPlaying(): boolean {
    return this.cinePlaying;
  }

  pauseCinematic(): void {
    this.cinePlaying = false;
  }

  update(dt: number): void {
    if (this.mode === 'exterior') {
      this.controls.update();
      // zemin altına inmesin
      if (this.camera.position.y < 1.2) this.camera.position.y = 1.2;
    } else if (this.mode === 'interior') {
      this.updateInterior(dt);
    } else if (this.mode === 'cinematic') {
      this.updateCinematic(dt);
    }
  }

  /** Kamera sıfırlama */
  reset(): void {
    this.setMode('exterior');
    this.cineT = 0;
    this.cinePlaying = false;
    this.walkPitch = 0;
    this.walkYaw = 0;
  }

  /** Bir noktaya yaklaş (seçim/kat odaklama için) */
  focusOn(target: THREE.Vector3, distance = 18): void {
    if (this.mode === 'interior') {
      this.walkPos.set(target.x, target.y - 1.68, target.z + 4);
      this.walkYaw = Math.PI;
      this.walkPitch = -0.1;
      return;
    }
    if (this.mode === 'cinematic') this.setMode('exterior');
    this.controls.autoRotate = false;
    const dir = this.camera.position.clone().sub(target).normalize();
    if (dir.lengthSq() < 0.01) dir.set(0.6, 0.5, 0.6).normalize();
    this.camera.position.copy(target.clone().add(dir.multiplyScalar(distance)));
    this.controls.target.copy(target);
    this.controls.update();
  }

  dispose(): void {
    this.controls.dispose();
  }
}
