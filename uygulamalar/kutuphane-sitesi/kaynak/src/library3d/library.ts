import * as THREE from 'three';
import { buildShell, buildSite } from './building/shell';
import { buildShelves } from './interior/shelves';
import { buildInteriorFurniture } from './interior/furniture';
import { LibraryAtmosphere } from './systems/atmosphere';
import { LibraryCamera } from './systems/camera';
import { LibraryInteraction } from './systems/interaction';
import { FpsMeter } from './systems/fps';
import { LibraryUI } from './ui/ui';
import { LEVEL, STAIR, ATRIUM, HALF_W, HALF_D } from './core/dimensions';
import { SHELVES } from './data/catalog';

/**
 * NUMEX KÜTÜPHANE 3D — bağımsız uygulama girişi.
 *
 * Mevcut Architect uygulamasına (src/main.ts, src/building/*, src/systems/*)
 * hiçbir bağımlılık yoktur; yalnızca three.js ve kendi modülleri kullanılır.
 * Böylece 5199/5299'daki mevcut uygulama bu dosyadan etkilenmez.
 */

class LibraryApp {
  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private cam!: LibraryCamera;
  private atmo!: LibraryAtmosphere;
  private inter!: LibraryInteraction;
  private fps!: FpsMeter;
  private ui!: LibraryUI;
  private canvas!: HTMLCanvasElement;

  private clock = new THREE.Clock();
  private roofGroup: THREE.Object3D | null = null;
  private roofVisible = true;
  private colliders: THREE.Box3[] = [];
  private running = false;
  /** Çekim modu: kamera güncellemesi dursun (verilen açı ezilmesin) */
  private frozen = false;

  init(): void {
    const t0 = performance.now();

    this.canvas = document.getElementById('nx-lib-canvas') as HTMLCanvasElement;

    /* ---- RENDERER ---- */
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    /* ---- SAHNE ---- */
    this.scene = new THREE.Scene();
    // Sis rengi sabit DEĞİL: gökyüzü her saat değişiyor, sis sabit kalırsa
    // uzak yüzeyler gökyüzünden kopuk, leylak-pembe bir perde olarak görünür
    // (ilk ölçümde gündüz sahnesi komple yıkanmıştı). Atmosfer saati sis
    // rengini kendi ufuk renginden günceller.
    this.scene.fog = new THREE.FogExp2(0xc8dcef, 0.0015);

    const aspect = window.innerWidth / window.innerHeight;
    // Kontrol canvas'a bağlanır — parentElement (body) verilirse OrbitControls
    // tüm sayfayı dinler ve arayüz butonlarını yutar.
    this.cam = new LibraryCamera(this.canvas, aspect);
    this.cam.resize(window.innerWidth, window.innerHeight);

    this.atmo = new LibraryAtmosphere(this.scene);
    // Atmosfer sisin rengini/younluğunu kendi ufuk renginden yönetsin
    this.atmo.fog = this.scene.fog as THREE.FogExp2;
    this.atmo.setHour(17.5);

    /* ---- ARAYÜZ ---- */
    this.ui = new LibraryUI({
      onCameraMode: (m) => this.cam.setMode(m),
      onFloor: (f) => this.onFloorChange(f),
      onRoofToggle: (v) => this.setRoofVisible(v),
      onHour: (h) => this.atmo.setHour(h),
      onReset: () => this.resetView(),
    });

    this.fps = new FpsMeter(this.renderer);
    this.inter = new LibraryInteraction(this.canvas, this.cam.camera);

    this.inter.onShelfPick = (meta) => this.ui.showCard(meta);
    this.inter.onFurniturePick = (meta) => this.ui.showGenericCard(meta.label, meta.info);
    this.inter.onEmptyPick = () => this.ui.hideCard();

    this.cam.onModeChange = (m) => {
      this.ui.setCameraMode(m);
      this.inter.setEnabled(true);
    };

    /* ---- GEOMETRİ ÜRETİMİ (aşamalı, yükleme çubuğu için) ---- */
    this.ui.setLoading(0.08, 'Zemin hazırlanıyor…');
    this.buildWorld();

    this.ui.finishLoading();

    // İlk kare
    this.resize();
    window.addEventListener('resize', () => this.resize());

    this.running = true;
    this.clock.start();
    this.renderer.setAnimationLoop(() => this.tick());

    // Ölçüm için dışa aç (tarayıcı doğrulaması okur)
    (window as any).__NX_LIB = {
      scene: this.scene,
      renderer: this.renderer,
      camera: this.cam.camera,
      fps: () => ({
        fps: this.fps.fps,
        avg: this.fps.average,
        min: this.fps.minFps,
        drawCalls: this.fps.drawCalls,
        triangles: this.fps.triangles,
      }),
      setCamMode: (m: 'exterior' | 'interior') => this.cam.setMode(m),
      setHour: (h: number) => this.atmo.setHour(h),
      shelfCount: SHELVES.length,
      buildMs: Math.round(performance.now() - t0),
      /** Çekim modu: kamerayı serbest konumlandır (tanıtım görselleri için) */
      shot: (o: { pos: [number, number, number]; look: [number, number, number]; fov?: number }) =>
        this.applyShot(o),
    };

    this.applyUrlShot();
    this.applyUrlInside();
  }

  /**
   * Tanıtım/çekim modu — URL parametreleriyle sahneyi temiz bir kareye ayarlar.
   *
   * Kullanım: `library.html?shot=1&px=34&py=16&pz=44&tx=0&ty=5&tz=0&hour=16&ui=0`
   *   shot=1  → OrbitControls kapanır, kamera sabitlenir (otomatik dönüş durur)
   *   ui=0    → arayüz katmanı gizlenir (vitrin görselinde panel/çubuk olmasın)
   *   hour=16 → gün ışığı saati
   * Bu mod yalnız parametre verildiğinde devreye girer; normal ziyaretçi
   * deneyimini hiç etkilemez ve üretimde de aynı dosya çalışır.
   */
  private applyUrlShot(): void {
    const p = new URLSearchParams(location.search);
    if (p.get('shot') !== '1') return;

    const num = (k: string, d: number) => {
      const v = Number(p.get(k));
      return Number.isFinite(v) ? v : d;
    };
    const hour = p.get('hour');
    if (hour !== null) this.atmo.setHour(Number(hour));

    if (p.get('ui') === '0') {
      document.getElementById('nx-lib-ui')?.remove();
      document.body.style.background = '#0d1117';
    }

    // Çatı gizleme — iç mekân kuşbakışı çekimlerinde tavan görüşü kapatmasın
    if (p.get('roof') === '0' && this.roofGroup) this.roofGroup.visible = false;

    this.applyShot({
      pos: [num('px', 34), num('py', 16), num('pz', 44)],
      look: [num('tx', 0), num('ty', 5), num('tz', 0)],
      fov: num('fov', 42),
    });
  }

  /**
   * İç mekân çekimi — kamerayı salonun içine, göz hizasına yerleştirir.
   *
   * Kullanım: `?shot=1&ui=0&inside=1&px=0&py=1.68&pz=9&yaw=3.14&pitch=-0.05`
   *   inside=1 → iç mod; yaw/pitch bakış yönü (yaw π = -z yönüne, salonun içine)
   */
  private applyUrlInside(): void {
    const p = new URLSearchParams(location.search);
    if (p.get('inside') !== '1') return;

    const num = (k: string, d: number) => {
      const v = Number(p.get(k));
      return Number.isFinite(v) ? v : d;
    };

    const x = num('px', 0);
    const z = num('pz', 9);
    const y = num('py', LEVEL.ground);
    const yaw = num('yaw', Math.PI);
    const pitch = num('pitch', -0.05);

    this.frozen = true;
    this.cam.setMode('interior');
    this.cam.setFloor(num('floor', 0));
    // setFloor'un ensureFree()'si oyuncak konumu değiştirir; çekimde verilen
    // noktayı AYNEN kullanmak için doğrudan yerleştiriyoruz.
    const cam = this.cam.camera;
    cam.fov = num('fov', 62);
    cam.updateProjectionMatrix();
    cam.position.set(x, y + num('eye', 1.68), z);
    const dir = new THREE.Vector3(
      Math.sin(yaw) * Math.cos(pitch),
      Math.sin(pitch),
      Math.cos(yaw) * Math.cos(pitch),
    );
    cam.lookAt(cam.position.clone().add(dir));
  }

  private applyShot(o: { pos: [number, number, number]; look: [number, number, number]; fov?: number }): void {
    this.frozen = true;
    this.cam.setMode('exterior');
    this.cam.controls.autoRotate = false;
    this.cam.controls.enabled = false;
    const cam = this.cam.camera;
    cam.fov = o.fov ?? 42;
    cam.updateProjectionMatrix();
    cam.position.set(o.pos[0], o.pos[1], o.pos[2]);
    cam.lookAt(o.look[0], o.look[1], o.look[2]);
    this.cam.controls.target.set(o.look[0], o.look[1], o.look[2]);
  }

  /* ---------------------------------------------------------------- */
  /* DÜNYA KURULUMU                                                    */
  /* ---------------------------------------------------------------- */

  private buildWorld(): void {
    /* --- Dış kabuk --- */
    const shell = buildShell();
    this.scene.add(shell.group);
    this.roofGroup = shell.parts.roof;

    /* --- Çevre düzenleme --- */
    this.ui.setLoading(0.3, 'Bahçe ve ağaçlar…');
    const site = buildSite();
    this.scene.add(site.group);

    /* --- Kitaplıklar + kitaplar --- */
    this.ui.setLoading(0.52, 'Kitaplıklar ve kitaplar…');
    const shelves = buildShelves();
    this.scene.add(shelves.group);
    this.ui.setCollectionSummary(shelves.books);

    /* --- Mobilya --- */
    this.ui.setLoading(0.72, 'Masa, banko ve bilgisayar alanı…');
    const furniture = buildInteriorFurniture();
    this.scene.add(furniture.group);

    /* --- Raycast hedefleri --- */
    this.inter.register([shelves.group]);
    for (const p of furniture.pickups) {
      p.group.traverse((o) => {
        o.userData.furnitureMeta = p.meta;
      });
    }
    this.inter.registerFurniture(furniture.pickups.map((p) => p.group));

    /* --- Çarpışma kutuları --- */
    this.ui.setLoading(0.88, 'Çarpışma ve ışıklar…');
    this.buildColliders(shelves.group, furniture.group, shell.group);
    this.cam.setColliders(this.colliders);

    /* --- İç mekân arka plan ışıkları (tavan armatürleri) --- */
    this.buildCeilingLights();
  }

  /**
   * Çarpışma kutuları: duvarlar, kitaplıklar, mobilya, kat döşemeleri.
   *
   * NOT: Döşemeler yatay kutu olarak eklenmez (yaya yürüyüşünde yalnız
   * dikey engeller işe yarar). Kamera yüksekliği kat bazlıdır; kat geçişi
   * iç merdivenle yapılır.
   */
  private buildColliders(shelfGroup: THREE.Object3D, furnitureGroup: THREE.Object3D, shellGroup: THREE.Object3D): void {
    const push = (b: THREE.Box3) => {
      // Aşırı büyük kutular (tüm bina kabuğu) yürüyüşü kilitlemesin
      const size = b.getSize(new THREE.Vector3());
      if (size.x > 40 || size.z > 40) return;
      this.colliders.push(b);
    };

    // Dış duvarlar (4 yüz) — kalın kutular
    const wallT = 0.5;
    for (const [cx, cz, sx, sz] of [
      [0, HALF_D, HALF_W * 2, wallT],
      [0, -HALF_D, HALF_W * 2, wallT],
      [HALF_W, 0, wallT, HALF_D * 2],
      [-HALF_W, 0, wallT, HALF_D * 2],
    ] as Array<[number, number, number, number]>) {
      this.colliders.push(new THREE.Box3(
        new THREE.Vector3(cx - sx / 2, -1, cz - sz / 2),
        new THREE.Vector3(cx + sx / 2, LEVEL.roof + 1, cz + sz / 2),
      ));
    }

    // Kitaplıklar: her rafın kapladığı hacim
    for (const slot of SHELVES) {
      const y0 = slot.floor === 0 ? LEVEL.ground : LEVEL.upper;
      const halfL = slot.length / 2;
      const halfD = 0.35;
      const cos = Math.cos(slot.rotY);
      const sin = Math.sin(slot.rotY);
      // Döndürülmüş kutu → eksen hizalı en-boy
      const ex = Math.abs(cos) * halfL + Math.abs(sin) * halfD;
      const ez = Math.abs(sin) * halfL + Math.abs(cos) * halfD;
      this.colliders.push(new THREE.Box3(
        new THREE.Vector3(slot.x - ex, y0, slot.z - ez),
        new THREE.Vector3(slot.x + ex, y0 + 2.7, slot.z + ez),
      ));
    }

    // Mobilya gruplarından gerçek sınır kutuları
    furnitureGroup.updateMatrixWorld(true);
    furnitureGroup.traverse((o) => {
      const m = o as THREE.Mesh;
      if (!m.isMesh || !m.geometry) return;
      const bb = new THREE.Box3().setFromObject(m);
      const s = bb.getSize(new THREE.Vector3());
      // Çok ince/küçük parçalar (kalem, kitap) engel olmasın
      if (s.x < 0.15 || s.z < 0.15) return;
      push(bb);
    });

    // Atrium boşluğu: üst katta düşmeyi engelle (kenar korkulukları zaten var,
    // ama yaya güvenliği için 4 kenara ince kutu)
    const { minX, maxX, minZ, maxZ } = ATRIUM;
    const rail = 0.12;
    const ey = LEVEL.upper;
    for (const [cx, cz, sx, sz] of [
      [0, minZ, maxX - minX, rail],
      [0, maxZ, maxX - minX, rail],
      [minX, 0, rail, maxZ - minZ],
      [maxX, 0, rail, maxZ - minZ],
    ] as Array<[number, number, number, number]>) {
      this.colliders.push(new THREE.Box3(
        new THREE.Vector3(cx - sx / 2, ey, cz - sz / 2),
        new THREE.Vector3(cx + sx / 2, ey + 1.1, cz + sz / 2),
      ));
    }

    // İç merdiven yanları (düşmeyi engelle)
    for (const sx of [-1, 1]) {
      this.colliders.push(new THREE.Box3(
        new THREE.Vector3(STAIR.x + sx * (STAIR.width / 2) - 0.08, 0, Math.min(STAIR.z0, STAIR.z1)),
        new THREE.Vector3(STAIR.x + sx * (STAIR.width / 2) + 0.08, LEVEL.upper + 1, Math.max(STAIR.z0, STAIR.z1)),
      ));
    }

    void shellGroup;
  }

  /**
   * Tavan armatürleri — görsel disk + ölçülü ışık.
   *
   * PERFORMANS: 40+ nokta ışık gölge hesaplarsa FPS çöker. Bu yüzden yalnız
   * emissive diskler çoğunlukta; gerçek PointLight sayısı 6 ile sınırlı.
   */
  private buildCeilingLights(): void {
    const discGeo = new THREE.CylinderGeometry(0.34, 0.34, 0.05, 14);
    const discMat = new THREE.MeshStandardMaterial({
      color: 0xfff3e0, emissive: 0xffd9a8, emissiveIntensity: 1.5, roughness: 0.5,
    });

    const spots: Array<[number, number, number]> = [];
    // Zemin kat: 4 sıra × 4
    for (let ix = 0; ix < 4; ix++) {
      for (let iz = 0; iz < 4; iz++) {
        spots.push([-9.5 + ix * 6.4, LEVEL.ground + LIB_CEILING, -7.5 + iz * 5.2]);
      }
    }
    // Üst kat: 3 sıra × 3
    for (let ix = 0; ix < 3; ix++) {
      for (let iz = 0; iz < 3; iz++) {
        spots.push([-7.5 + ix * 7.2, LEVEL.upper + LIB_CEILING, -7.0 + iz * 8.0]);
      }
    }

    const inst = new THREE.InstancedMesh(discGeo, discMat, spots.length);
    inst.name = 'tavan-armaturleri';
    const m = new THREE.Matrix4();
    spots.forEach((p, i) => {
      m.makeTranslation(p[0], p[1], p[2]);
      inst.setMatrixAt(i, m);
    });
    inst.instanceMatrix.needsUpdate = true;
    this.scene.add(inst);

    // Gerçek ışıklar: az sayıda, büyük yarıçaplı
    const lightSpots = [
      [0, LEVEL.ground + 3.2, 4],
      [-8, LEVEL.ground + 3.2, -4],
      [8, LEVEL.ground + 3.2, -4],
      [0, LEVEL.upper + 3.2, 8],
      [-8, LEVEL.upper + 3.2, 2],
      [8, LEVEL.upper + 3.2, -4],
    ] as Array<[number, number, number]>;
    for (const [x, y, z] of lightSpots) {
      const l = new THREE.PointLight(0xffe0b8, 9, 18, 1.8);
      l.position.set(x, y, z);
      this.scene.add(l);
    }
  }

  /* ---------------------------------------------------------------- */
  /* ETKİLEŞİM                                                         */
  /* ---------------------------------------------------------------- */

  private onFloorChange(floor: number): void {
    if (this.cam.mode !== 'interior') {
      this.cam.setMode('interior');
      this.ui.setCameraMode('interior');
    }
    this.cam.setFloor(floor);
  }

  private setRoofVisible(visible: boolean): void {
    if (!this.roofGroup) return;
    this.roofVisible = visible;
    this.roofGroup.visible = visible;
  }

  private resetView(): void {
    this.cam.reset();
    this.ui.setCameraMode('exterior');
    this.ui.hideCard();
    if (this.roofGroup) {
      this.roofGroup.visible = true;
      this.ui.setFloorActive(0);
    }
  }

  private resize(): void {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.renderer.setSize(w, h, false);
    this.cam.resize(w, h);
  }

  /* ---------------------------------------------------------------- */
  /* DÖNGÜ                                                             */
  /* ---------------------------------------------------------------- */

  private tick(): void {
    if (!this.running) return;
    const dt = Math.min(this.clock.getDelta(), 0.1);

    // Çekim modunda kamera sabittir: update() iç mekân modunda pozisyonu kendi
    // `pos` alanından yeniden yazar ve verilen çekim açısını ezerdi.
    if (!this.frozen) this.cam.update(dt);
    this.atmo.update(this.cam.camera);

    this.renderer.render(this.scene, this.cam.camera);

    if (this.fps.update(dt)) {
      const s = this.fps;
      this.ui.updateFps(s.fps, s.drawCalls, s.triangles, s.minFps);
    }
  }
}

/** Tavan yüksekliği (armatür yerleşimi) */
const LIB_CEILING = 3.28;

const app = new LibraryApp();
app.init();
