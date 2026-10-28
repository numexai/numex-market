import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { WALK_BOUNDS, LEVEL } from '../core/dimensions';

/**
 * Kütüphane kamera sistemi — iki mod:
 *   1) DIŞ: OrbitControls ile 360° döndürme, tekerlek zoom
 *   2) İÇ: WASD ile yürüyüş + fare ile bakış (pointer lock veya sürükleme)
 *
 * Bağımsız yazıldı (mevcut CameraController'a dokunulmadı): o sınıf bina
 * katlarına ve asansöre bağlı; kütüphanede tek bina ve iki kat var.
 */

export type LibCameraMode = 'exterior' | 'interior';

export class LibraryCamera {
  readonly camera: THREE.PerspectiveCamera;
  readonly controls: OrbitControls;

  mode: LibCameraMode = 'exterior';

  /** Yürüyüş durumu */
  private pos = new THREE.Vector3(0, 0, 8);
  private yaw = Math.PI;
  private pitch = -0.05;
  private floor = 0;
  private eye = 1.68;
  private keys = new Set<string>();
  private pointerLocked = false;
  private dragging = false;

  /** Çarpışma kutuları (duvar, kitaplık, masa) */
  private colliders: THREE.Box3[] = [];

  onModeChange: ((mode: LibCameraMode) => void) | null = null;

  constructor(private container: HTMLElement, aspect: number) {
    this.camera = new THREE.PerspectiveCamera(55, aspect, 0.08, 900);
    this.camera.position.set(34, 21, 40);

    // OrbitControls ELEMANA BAĞLANMAZ, canvas'a bağlanır.
    // (İlk yazımda `container` = parentElement idi; HTML'de canvas body'nin
    //  doğrudan çocuğu olduğu için parent BODY oluyordu ve kontrol tüm
    //  sayfayı kaplıyordu — panel butonları "ölü" görünüyordu.)
    this.controls = new OrbitControls(this.camera, container);
    this.controls.target.set(0, 5, 0);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.075;
    this.controls.minDistance = 8;
    this.controls.maxDistance = 160;
    this.controls.maxPolarAngle = Math.PI * 0.492;
    this.controls.minPolarAngle = 0.08;
    this.controls.autoRotate = true;
    this.controls.autoRotateSpeed = 0.4;
    this.controls.update();

    this.bindEvents();
  }

  private bindEvents(): void {
    window.addEventListener('keydown', (e) => {
      this.keys.add(e.code);
      if (e.code === 'Escape' && this.pointerLocked) {
        document.exitPointerLock?.();
        this.pointerLocked = false;
      }
    });
    window.addEventListener('keyup', (e) => this.keys.delete(e.code));

    // İç mekânda tıklayınca fare kilitle (pointer lock)
    this.container.addEventListener('click', () => {
      if (this.mode === 'interior' && !this.pointerLocked) {
        this.container.requestPointerLock?.();
      }
    });
    document.addEventListener('pointerlockchange', () => {
      this.pointerLocked = document.pointerLockElement === this.container;
    });
    this.container.addEventListener('mousedown', () => {
      if (this.mode === 'interior') this.dragging = true;
    });
    window.addEventListener('mouseup', () => (this.dragging = false));
    document.addEventListener('mousemove', (e) => {
      if (this.mode !== 'interior') return;
      if (!this.pointerLocked && !this.dragging) return;
      this.yaw -= e.movementX * 0.0022;
      this.pitch -= e.movementY * 0.0022;
      this.pitch = Math.max(-1.15, Math.min(1.15, this.pitch));
    });
  }

  setColliders(boxes: THREE.Box3[]): void {
    this.colliders = boxes;
  }

  setMode(mode: LibCameraMode): void {
    // DİKKAT: erken `return` YOK. Aynı moda ikinci kez geçiş (ör. UI'dan
    // "İç Mekân"a basıldığında) kamerayı da yerine oturtmalı; erken dönüş
    // yüzünden buton aktif görünüyor ama kamera dışarıda kalıyordu.
    if (this.mode === 'interior' && mode === 'exterior') document.exitPointerLock?.();
    this.mode = mode;

    if (mode === 'exterior') {
      this.controls.enabled = true;
      this.controls.autoRotate = true;
      this.camera.position.set(34, 21, 40);
      this.controls.target.set(0, 5, 0);
      this.controls.update();
    } else {
      this.controls.enabled = false;
      this.controls.autoRotate = false;
      this.setFloor(this.floor ?? 0);
    }
    this.onModeChange?.(mode);
  }

  /** Kat değiştir (iç mekân başlangıç noktası) */
  setFloor(floor: number): void {
    this.floor = Math.max(0, Math.min(1, floor));
    const y = this.floor === 0 ? LEVEL.ground : LEVEL.upper;
    // Başlangıç noktaları SALONUN ORTASINA bakar, boş koridorlara konur.
    // (DÜZELTME: zemin kat 7.4 ve üst kat 9.2 seçildiğinde kamera iç merdivenin
    //  ve altındaki boşluğun içine düşüyordu — ekran görüntüsünde sahne %76
    //  oranında döşemenin alt yüzüydü.)
    if (this.floor === 0) {
      this.pos.set(0, y, 6.2);      // giriş holü, banko ile rafların arası
      this.yaw = Math.PI;
    } else {
      this.pos.set(6.5, y, 6.6);    // üst kat: atrium kenarı, balkona bakar
      this.yaw = Math.PI;
    }
    this.pitch = -0.04;
    this.ensureFree();
    this.applyInterior();
  }

  /** Başlangıç noktası bir duvarın içindeyse en yakın boş noktaya taşı */
  private ensureFree(): void {
    // ÖNCE sinir: ışınla bakılacak yön boş olsun (tek başına kutu boşluğu yetmiyor,
    // kamera bir döşemenin/kitaplığın İÇİNDE kalabiliyordu)
    if (!this.collides(this.pos.x, this.pos.y, this.pos.z) && this.hasClearView()) return;
    const oldX = this.pos.x;
    const oldZ = this.pos.z;
    for (let r = 0.7; r <= 10; r += 0.7) {
      for (let a = 0; a < 20; a++) {
        const ang = (a / 20) * Math.PI * 2;
        const nx = this.pos.x + Math.cos(ang) * r;
        const nz = this.pos.z + Math.sin(ang) * r;
        if (!this.collides(nx, this.pos.y, nz)) {
          this.pos.set(nx, this.pos.y, nz);
          if (this.hasClearView()) return;
          this.pos.set(oldX, this.pos.y, oldZ);
        }
      }
    }
  }

  /**
   * Bakış yönü boş mu? Kamera 1.5 m ileride bir engele çarpıyorsa (yanlış yön)
   * başlangıç noktası geçersiz sayılır. Döşeme altına düşmeyi yakalayan kontrol.
   */
  private hasClearView(): boolean {
    const dir = new THREE.Vector3(
      Math.sin(this.yaw) * Math.cos(this.pitch),
      Math.sin(this.pitch),
      Math.cos(this.yaw) * Math.cos(this.pitch),
    );
    const eyeY = this.pos.y + this.eye;
    for (let d = 0.6; d <= 1.6; d += 0.25) {
      const px = this.pos.x + dir.x * d;
      const py = eyeY + dir.y * d;
      const pz = this.pos.z + dir.z * d;
      for (const b of this.colliders) {
        if (px > b.min.x && px < b.max.x && py > b.min.y && py < b.max.y && pz > b.min.z && pz < b.max.z) {
          return false;
        }
      }
    }
    return true;
  }

  /** Yaya çarpışması: ayak-baş aralığı kesişen kutu var mı? */
  private collides(x: number, y: number, z: number, r = 0.34): boolean {
    const feet = y + 0.15;
    const head = y + 1.75;
    for (const b of this.colliders) {
      if (head < b.min.y || feet > b.max.y) continue;
      if (x + r > b.min.x && x - r < b.max.x && z + r > b.min.z && z - r < b.max.z) return true;
    }
    // İç hacim sınırı
    if (x < WALK_BOUNDS.minX || x > WALK_BOUNDS.maxX) return true;
    if (z < WALK_BOUNDS.minZ || z > WALK_BOUNDS.maxZ) return true;
    return false;
  }

  private applyInterior(): void {
    this.camera.position.set(this.pos.x, this.pos.y + this.eye, this.pos.z);
    const dir = new THREE.Vector3(
      Math.sin(this.yaw) * Math.cos(this.pitch),
      Math.sin(this.pitch),
      Math.cos(this.yaw) * Math.cos(this.pitch),
    );
    this.camera.lookAt(this.camera.position.clone().add(dir));
  }

  private updateInterior(dt: number): void {
    const run = this.keys.has('ShiftLeft') || this.keys.has('ShiftRight');
    const speed = run ? 6.0 : 3.1;

    let fwd = 0, strafe = 0;
    if (this.keys.has('KeyW') || this.keys.has('ArrowUp')) fwd += 1;
    if (this.keys.has('KeyS') || this.keys.has('ArrowDown')) fwd -= 1;
    if (this.keys.has('KeyA') || this.keys.has('ArrowLeft')) strafe -= 1;
    if (this.keys.has('KeyD') || this.keys.has('ArrowRight')) strafe += 1;
    if (this.keys.has('KeyQ')) this.yaw += dt * 1.5;
    if (this.keys.has('KeyE')) this.yaw -= dt * 1.5;

    // İç merdivenden yukarı/aşağı geçiş: Space/Ctrl yerine otomatik rampa
    // (kütüphane içinde zıplamak yerine kat geçişi daha anlamlı)

    if (fwd !== 0 || strafe !== 0) {
      const len = Math.hypot(fwd, strafe) || 1;
      const dirX = Math.sin(this.yaw);
      const dirZ = Math.cos(this.yaw);
      const mx = ((fwd / len) * dirX + (strafe / len) * Math.cos(this.yaw)) * speed * dt;
      const mz = ((fwd / len) * dirZ - (strafe / len) * Math.sin(this.yaw)) * speed * dt;

      if (!this.collides(this.pos.x + mx, this.pos.y, this.pos.z)) this.pos.x += mx;
      if (!this.collides(this.pos.x, this.pos.y, this.pos.z + mz)) this.pos.z += mz;
    }
    this.applyInterior();
  }

  update(dt: number): void {
    if (this.mode === 'exterior') {
      this.controls.update();
      if (this.camera.position.y < 1.4) this.camera.position.y = 1.4;
    } else {
      // DÜZELTME: OrbitControls `enabled=false` olsa bile iç mekân döngüsünde
      // her kare `controls.update()` çağrılmıyordu ama kontrolün kendi
      // `target`'ı kamerayı geri çekiyordu. Şimdi kontrol tamamen durdurulur.
      this.controls.enabled = false;
      this.updateInterior(dt);
    }
  }

  setInteriorEye(y: number): void {
    this.pos.y = y;
    this.applyInterior();
  }

  resize(w: number, h: number): void {
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  reset(): void {
    this.setMode('exterior');
  }

  dispose(): void {
    this.controls.dispose();
  }
}
