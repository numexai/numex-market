import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';

import './ui/style.css';
import { APARTMENTS, APARTMENT_QUADRANTS, FLOORS, HERO_APARTMENT_ID, SYSTEM_LAYERS, type SystemLayer, type MaterialKey } from './data/building';
import { BuildingSystem } from './building/building';
import { buildSite } from './world/site';
import { Atmosphere } from './systems/atmosphere';
import { CameraController, type CameraMode } from './systems/camera';
import { InteractionSystem, type SelectionInfo } from './systems/interaction';
import { PedestrianSystem } from './sim/pedestrians';
import { PerformanceMonitor } from './sim/performance';
import { UIManager } from './ui/ui';
import { getMaterial } from './core/materials';

/**
 * NUMEX ARCHITECT 3D — giriş noktası.
 * Modüller: data → building → systems → sim → ui. Her biri tek sorumluluk.
 */

const viewport = document.getElementById('viewport') as HTMLElement;
const canvas = document.getElementById('scene') as HTMLCanvasElement;

// ---------- RENDERER ----------
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  powerPreference: 'high-performance',
  alpha: false,
});
renderer.setSize(viewport.clientWidth, viewport.clientHeight, false);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.outputColorSpace = THREE.SRGBColorSpace;
// Post-processing birden fazla pass çalıştırır; sayaçları pass'ler boyunca topla
renderer.info.autoReset = false;

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0xa8c0d0, 120, 340);

// ---------- PERFORMANS (erken — pixel ratio için) ----------
const perf = new PerformanceMonitor(renderer);

// ---------- ATMOSFER ----------
const atmosphere = new Atmosphere(scene, renderer);
atmosphere.setHour(17.5);

// ---------- SAHNE İÇERİĞİ ----------
const building = new BuildingSystem();
scene.add(building.root);

const site = buildSite();
scene.add(site);

const pedestrians = new PedestrianSystem();
scene.add(pedestrians.group);

// ---------- KAMERA ----------
const camController = new CameraController(renderer, viewport);
camController.setColliders(building.colliders.map((b) => ({
  minX: b.min.x, maxX: b.max.x, minZ: b.min.z, maxZ: b.max.z, minY: b.min.y, maxY: b.max.y,
})));
scene.add(camController.camera);

// ---------- POST-PROCESSING (yumuşak bloom — gece ışıkları için) ----------
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camController.camera));
const bloom = new UnrealBloomPass(
  new THREE.Vector2(viewport.clientWidth, viewport.clientHeight),
  0.42, // strength
  0.85, // radius
  0.86, // threshold
);
composer.addPass(bloom);
composer.addPass(new OutputPass());
composer.setSize(viewport.clientWidth, viewport.clientHeight);

// ---------- DURUM ----------
const state = {
  xrayOn: false,
  ceilingsHidden: false,
  exploded: 0,
  selectedDoorIds: new Set<string>(),
  lastMode: 'exterior' as CameraMode,
  materialTarget: null as THREE.Object3D | null,
};

// ---------- UI ----------
let interaction: InteractionSystem;

const ui = new UIManager({
  onFloorSelect: (floorId) => {
    if (!floorId) {
      building.setIsolate(null);
      ui.setCeilingUI(state.ceilingsHidden, false);
      if (state.ceilingsHidden) {
        state.ceilingsHidden = false;
        building.setCeilingsHidden(false);
      }
      camController.focusOn(new THREE.Vector3(0, 9, 0), 62);
      return;
    }
    isolateFloor(floorId);
  },
  onFloorToggleVisible: (floorId) => {
    const rt = building.floors.get(floorId);
    if (!rt) return;
    rt.group.visible = !rt.group.visible;
    ui.setFloorHidden(floorId, !rt.group.visible);
    ui.toast(`${floorId} katı ${rt.group.visible ? 'gösterildi' : 'gizlendi'}`);
  },
  onApartmentSelect: (aptId) => focusApartment(aptId),
  onIsolateClear: () => {
    building.setIsolate(null);
    state.ceilingsHidden = false;
    building.setCeilingsHidden(false);
    ui.setCeilingUI(false, false);
    ui.setActiveFloorUI(null);
    camController.focusOn(new THREE.Vector3(0, 9, 0), 62);
  },
  onLayerToggle: (layer: SystemLayer, on) => {
    if (!state.xrayOn && on) {
      setXray(true);
    }
    building.xray.toggleLayer(layer, on);
  },
  onModeSelect: (mode) => setCameraMode(mode),
  onExplodeChange: (v) => {
    state.exploded = v;
    building.setExplode(v);
  },
  onTimeChange: (h) => {
    atmosphere.setHour(h);
    // gece → iç ışıkları yak (kullanıcı kapatmadıysa)
    updateNightInterior(h);
  },
  onWeatherChange: (w) => {
    atmosphere.setWeather(w);
    scene.fog!.color.copy(w === 'sunny' ? new THREE.Color(0x9fb8c8) : new THREE.Color(0x8895a0));
    ui.toast(w === 'sunny' ? 'Hava: Güneşli' : w === 'rain' ? 'Hava: Yağmurlu' : 'Hava: Karlı');
  },
  onXrayToggle: () => setXray(!state.xrayOn),
  onCeilingToggle: () => {
    state.ceilingsHidden = !state.ceilingsHidden;
    building.setCeilingsHidden(state.ceilingsHidden);
    ui.setCeilingUI(state.ceilingsHidden, building.isolatedFloor !== null);
    ui.toast(state.ceilingsHidden ? 'Tavanlar gizlendi — üstten inceleme' : 'Tavanlar görünür');
  },
  onElevatorCall: (floorIndex) => {
    const a = building.core.cars[0];
    // Boş olan kabine ver, dolu ise A'ya
    const car = a.calls.length === 1 && building.core.cars[1].calls.length === 0 ? building.core.cars[1] : a;
    building.core.call(car.id, floorIndex);
    const f = FLOORS.find((x) => x.index === floorIndex);
    ui.toast(`Asansör ${car.id} → ${f?.shortName ?? floorIndex} çağrıldı`);
  },
  onReset: () => resetAll(),
  onDoorToggle: (id) => interaction.toggleDoor(id),
  onLightToggle: (id) => {
    const light = building.heroLights.find((l) => id.includes(l.id) || l.id.endsWith(id.split('-').slice(-1)[0]));
    if (light) {
      interaction.setLight(light.id, !light.on);
      refreshEnergy();
      ui.toast(`${light.room}: ışık ${light.on ? 'açık' : 'kapalı'}`);
    }
  },
  onMaterialSelect: (key: MaterialKey) => applyMaterial(key),
  onFocusApartment: (aptId) => focusApartment(aptId),
  onIsolateFloor: (floorId) => isolateFloor(floorId),
  onCinematicStop: () => setCameraMode('exterior'),
});

// Sağ paneldeki kapı listesi bina sisteminden beslenir
ui.doorProvider = () => building.heroDoors.map((d) => ({ id: d.id, label: d.label, open: d.open }));

interaction = new InteractionSystem(building, camController.camera, renderer.domElement, {
  onSelect: (info) => {
    ui.renderSelection(info);
    // mobilde seçim yapılınca sağ paneli aç
    if (info && window.innerWidth <= 940) {
      document.getElementById('panel-right')?.classList.add('open');
    }
  },
  onFloorPick: (floorId) => {
    ui.setActiveFloorUI(floorId);
    isolateFloor(floorId);
  },
  onToast: (msg) => ui.toast(msg),
  onLightChange: () => refreshEnergy(),
  onDoorChange: (id, open) => {
    if (open) state.selectedDoorIds.add(id);
    else state.selectedDoorIds.delete(id);
  },
  onElevatorChange: () => {},
  onWindowChange: () => {},
  onMaterialChange: () => {},
});

// iç modda tıklama seçim için çalışsın ama pointer lock da olsun
camController.onModeChange = (mode) => {
  state.lastMode = mode;
  ui.setModeUI(mode);
  interaction.setEnabled(mode !== 'cinematic');
};

let lastScene = new THREE.Scene();
void lastScene;

// ---------- KAT İZOLE ----------
function isolateFloor(floorId: string): void {
  building.setIsolate(floorId);
  ui.setActiveFloorUI(floorId);
  const f = FLOORS.find((x) => x.id === floorId);
  if (!f) return;
  // Tek kat modunda tavan varsayılan olarak GİZLİ: iç mimari yukarıdan okunur.
  // (Kullanıcı alt bardaki "Tavan" düğmesiyle geri açabilir.)
  if (!state.ceilingsHidden) {
    state.ceilingsHidden = true;
    building.setCeilingsHidden(true);
  }
  ui.setCeilingUI(state.ceilingsHidden, true);
  const y = f.elevation + building.explodeValue * (f.kind === 'basement' ? -7.5 * 0.55 : f.index * 7.5);
  // İzolasyonda kamerayı katın DIŞINA, üst-eğik açıya al: yalnız bir kat görünürken
  // içeri girmek geometriyi parçalı ("uçan platform") gösteriyordu.
  const target = new THREE.Vector3(0, y + 1.2, 0);
  camController.focusOn(target, 42);
  camController.controls.target.copy(target);
  camController.camera.position.set(26, y + 26, 34);
  camController.controls.update();
  ui.toast(`${f.name} izole edildi — diğer katlar gizli`);
}

// ---------- DAİRE ODAK ----------
function focusApartment(aptId: string): void {
  const apt = APARTMENTS.find((a) => a.id === aptId);
  if (!apt) return;
  const q = APARTMENT_QUADRANTS[apt.quadrant];
  const floor = FLOORS.find((f) => f.id === apt.floorId);
  if (!floor) return;

  // izolasyonu kaldır, bu katı göster
  building.setIsolate(apt.floorId);
  ui.setActiveFloorUI(apt.floorId);

  const explodeOffset = floor.kind === 'basement' ? -7.5 * 0.55 * building.explodeValue : floor.index * 7.5 * building.explodeValue;
  const baseY = floor.elevation + explodeOffset;
  ui.setActiveApartment(aptId);
  // Daire seçimi sağ paneli de açar (malzeme/etkileşim seçenekleri buradadır)
  ui.renderAparmentInfo(apt);
  ui.toast(`${apt.no} — ${apt.type} · ${apt.area} m²`);

  if (aptId === HERO_APARTMENT_ID) {
    // ÖRNEK DAİRE: tavanlar gizlenip ÜSTTEN, eğik açıyla bakılır → tüm odalar
    // (salon, mutfak, yataklar, banyo) tek karede okunur. Yan/duvar hizasından
    // bakmak düz duvardan başka bir şey göstermiyordu.
    state.ceilingsHidden = true;
    building.setCeilingsHidden(true);
    ui.setCeilingUI(true, true);
    const target = new THREE.Vector3(q.x, baseY + 1.0, q.z);
    camController.focusOn(target, 18);
    camController.controls.target.copy(target);
    camController.camera.position.set(q.x + 2, baseY + 14, q.z + 12);
    camController.controls.update();
  } else if (apt.floorId === 'K5') {
    // K5 basit kütle: çok yaklaşmak duvarın içine sokar
    const target = new THREE.Vector3(q.x, baseY + 2, q.z);
    camController.focusOn(target, 30);
  } else {
    // Temsilî daireler: katın TAMAMINI görecek mesafeden bak (20 m çok yakındı,
    // kamera katın içine girip geometriyi parçalı gösteriyordu).
    const target = new THREE.Vector3(q.x, baseY + 1.2, q.z);
    camController.focusOn(target, 34);
    camController.controls.target.copy(target);
    camController.camera.position.set(q.x + 6, baseY + 20, q.z + 26);
    camController.controls.update();
  }
}

// ---------- KAMERA MODU ----------
function setCameraMode(mode: CameraMode): void {
  // İç mekân DIŞINDA iken izolasyonu kaldırma: kullanıcı kat seçip içeri giriyorsa
  // o kat korunmalı. Dış mekâna dönerken tüm katlar tekrar görünür olur.
  if (mode === 'exterior') {
    building.setIsolate(null);
    ui.setActiveFloorUI(null);
  }
  camController.setMode(mode);
  ui.setModeUI(mode);
  interaction.setEnabled(mode !== 'cinematic');
  if (mode === 'interior') {
    // İç mekânda yalnız o kat görünmeli; aksi hâlde üst katların döşemeleri
    // ile cephe camı kamerayı örter ve "içerideyim" hissi kaybolur.
    const startFloor = building.isolatedFloor ?? 'Z';
    building.setIsolate(startFloor);
    ui.setActiveFloorUI(startFloor);
    building.setCeilingsHidden(false);
    camController.setInteriorStart(startFloor);
    ui.toast('İç mekân modu — WASD ile yürüyün, duvarlardan geçmezsiniz');
    // mobilde panelleri kapat
    if (window.innerWidth <= 940) {
      document.getElementById('panel-left')?.classList.remove('open');
      document.getElementById('panel-right')?.classList.remove('open');
    }
  } else if (mode === 'cinematic') {
    ui.toast('Sinematik tur başladı — dış cephe → lobi → asansör → daire → teras');
  }
}

// ---------- X-RAY ----------
function setXray(on: boolean): void {
  state.xrayOn = on;
  building.xray.setEnabled(on);
  ui.setXrayUI(on);
  if (on) {
    ui.toast('X-RAY: teknik sistemler açık (kavramsal gösterim)');
    // saydam duvarlar için dış kabuğu da yumuşat
    scene.fog = null;
  } else {
    ui.toast('X-RAY kapalı — mimari görünüm');
    scene.fog = new THREE.Fog(0xa8c0d0, 120, 340);
    // katman UI sıfırla
    SYSTEM_LAYERS.forEach((l) => ui.setLayerUI(l.key, false));
  }
}

// ---------- MALZEME ----------
const MATERIAL_VARIANTS: Record<string, MaterialKey> = {
  marble: 'marble', wood: 'wood', concrete: 'concrete',
  fabric: 'fabric', stone: 'stone', woodDark: 'woodDark',
};

function applyMaterial(key: MaterialKey): void {
  const sel = interaction.selection;
  if (!sel) {
    ui.toast('Önce bir yüzey seçin');
    return;
  }
  // tüm alt parçaları değiştir (aynı ailede olanlar)
  const obj = sel.object as THREE.Mesh;
  const matKey = MATERIAL_VARIANTS[key] ?? key;
  // Havuzdaki materyalden klon üret (havuz örneği korunur, önbellek bozulmaz)
  const src = getMaterial(matKey) as THREE.MeshStandardMaterial;
  if (obj.material instanceof THREE.Material) {
    const clone = src.clone();
    clone.transparent = false;
    (obj.material as THREE.Material).dispose?.();
    obj.material = clone;
    ui.toast(`Malzeme değişti: ${key}`);
  }
}

// ---------- ENERJİ ----------
function refreshEnergy(): void {
  const s = building.lightStats();
  // kat bazlı temsilî tüketim: seçili daire ışıkları + koridor sabit yük
  const corridorBase = 420; // W (temsili)
  const total = s.watts + corridorBase;
  ui.setEnergy(total, s.on, s.on + s.off);
}

// ---------- GECE İÇ IŞIK ----------
function updateNightInterior(hour: number): void {
  const night = hour < 6.5 || hour > 18.2;
  if (night) {
    building.heroLights.forEach((l) => {
      if (!l.on && l.room !== 'Balkon') {
        interaction.setLight(l.id, true);
      }
    });
  } else if (hour > 7 && hour < 17) {
    // gündüz: sadece salon ve mutfak açık kalsın
    building.heroLights.forEach((l) => {
      const keep = l.id.includes('salon') || l.id.includes('mutfak');
      if (!keep && l.on) interaction.setLight(l.id, false);
    });
  }
  refreshEnergy();
}

// ---------- SIFIRLA ----------
function resetAll(): void {
  // ayrıştırma
  state.exploded = 0;
  building.setExplode(0);
  ui.setExplodeUI(0);
  // izolasyon
  building.setIsolate(null);
  ui.setActiveFloorUI(null);
  state.ceilingsHidden = false;
  building.setCeilingsHidden(false);
  ui.setCeilingUI(false, false);
  // tüm katlar görünür
  building.floors.forEach((rt, id) => {
    rt.group.visible = true;
    ui.setFloorHidden(id, false);
  });
  // kapılar kapansın
  building.heroDoors.forEach((d) => {
    d.open = false;
    d.targetAngle = 0;
  });
  // ışıklar varsayılan
  building.heroLights.forEach((l) => interaction.setLight(l.id, l.room !== 'Balkon'));
  // X-Ray kapalı
  if (state.xrayOn) setXray(false);
  // asansörler zemine
  building.core.reset();
  // kamera
  camController.reset();
  ui.setModeUI('exterior');
  // zaman
  atmosphere.setHour(17.5);
  atmosphere.setWeather('sunny');
  ui.setTimeUI(17.5);
  document.querySelectorAll('#weather-group .weather-btn').forEach((b) => {
    b.classList.toggle('active', (b as HTMLElement).dataset.w === 'sunny');
  });
  // seçim
  interaction.clearSelection();
  ui.setActiveApartment(null);
  refreshEnergy();
  ui.toast('Sahne başlangıç durumuna döndürüldü');
  perf.resetMin();
}

// ---------- RESIZE ----------
function onResize(): void {
  const w = viewport.clientWidth;
  const h = viewport.clientHeight;
  if (w === 0 || h === 0) return;
  camController.camera.aspect = w / h;
  camController.camera.updateProjectionMatrix();
  camController.resize();
  renderer.setSize(w, h, false);
  composer.setSize(w, h);
  bloom.setSize(w, h);
}
window.addEventListener('resize', onResize);
window.addEventListener('orientationchange', () => setTimeout(onResize, 120));

// ---------- ANA DÖNGÜ ----------
const clock = new THREE.Clock();
let frameCount = 0;
let uiTick = 0;

function animate(): void {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.06);

  // sistemler
  camController.update(dt);
  building.updateDoors(dt);
  building.core.update(dt);
  atmosphere.update(dt);
  pedestrians.update(dt);
  perf.update(dt);

  // sinematik ilerleme
  if (camController.mode === 'cinematic') {
    ui.setCinematicProgress(camController.cinematicProgress);
    if (!camController.cinematicPlaying && camController.cinematicProgress >= 1) {
      setCameraMode('exterior');
    }
  }

  // bloom yoğunluğu gece artar
  bloom.strength = 0.32 + atmosphere.interiorLightFactor * 0.55;

  renderer.info.reset();
  composer.render();
  frameCount++;

  // UI güncellemeleri (her 12 karede ~5Hz)
  uiTick++;
  if (uiTick % 12 === 0) {
    ui.setFps(perf.stats);
    // asansör göstergeleri
    const cars = building.core.cars;
    ui.setElevatorStatus(
      { floor: floorShort(cars[0].currentFloor), moving: cars[0].dir !== 0 },
      { floor: floorShort(cars[1].currentFloor), moving: cars[1].dir !== 0 },
    );
    ui.setElevatorButtonsCurrent(cars[0].currentFloor);
  }
  if (uiTick % 60 === 0) {
    refreshEnergy();
  }
}

function floorShort(index: number): string {
  return FLOORS.find((f) => f.index === index)?.shortName ?? 'Z';
}

// ---------- BAŞLAT ----------
ui.setLoading(0.2, 'Kütüphane hazır');
requestAnimationFrame(() => {
  ui.setLoading(0.55, 'Bina geometrisi oluşturuluyor');
  requestAnimationFrame(() => {
    ui.setLoading(0.85, 'Gölgeler ve materyaller');
    // gölge kalitesini cihaza göre ayarla
    atmosphere.setShadowQuality(perf.recommendedShadowSize);
    atmosphere.apply();
    refreshEnergy();
    onResize();
    animate();
    setTimeout(() => {
      ui.finishLoading();
      ui.toast('Hazır — bir nesneye tıklayın veya kat seçin');
    }, 450);
  });
});

// sahne istatistikleri (konsoldan doğrulama için)
(window as any).__NUMEX__ = {
  scene, renderer, building, camController, atmosphere, perf, interaction, ui,
  stats: () => ({
    meshes: countMeshes(scene),
    floors: FLOORS.length,
    apartments: APARTMENTS.length,
    fps: perf.stats,
  }),
};

function countMeshes(root: THREE.Object3D): number {
  let n = 0;
  root.traverse((o) => {
    if ((o as THREE.Mesh).isMesh) n++;
  });
  return n;
}
