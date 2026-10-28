import * as THREE from 'three';
import { OrbitControls } from 'three/addons/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

import { buildWorld, CITIES } from './world.js';
import { buildCreatures } from './creatures.js';
import { Atmosphere } from './atmosphere.js';

/* ==========================================================================
   NUMEX AQUA WORLD — ana döngü
   ========================================================================== */

const canvas = document.getElementById('scene');
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  powerPreference: 'high-performance'
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.8));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.5, 900);

// --- dünya ---
const { domes } = buildWorld(scene);
const creatures = buildCreatures(scene, CITIES);
const atmosphere = new Atmosphere(scene, renderer);

// --- kamera başlangıç ---
const HOME_POS = new THREE.Vector3(92, 62, 108);
const HOME_TARGET = new THREE.Vector3(0, 8, 4);
camera.position.copy(HOME_POS);

const controls = new OrbitControls(camera, canvas);
controls.target.copy(HOME_TARGET);
controls.enableDamping = true;
controls.dampingFactor = 0.055;
controls.minDistance = 14;
controls.maxDistance = 260;
controls.maxPolarAngle = Math.PI * 0.495;   // deniz tabanının altına inme
controls.minPolarAngle = 0.12;
controls.rotateSpeed = 0.62;
controls.panSpeed = 0.7;
controls.zoomSpeed = 0.85;
controls.update();

// --- post-process ---
const composer = new EffectComposer(renderer);
composer.setPixelRatio(Math.min(window.devicePixelRatio, 1.8));
composer.setSize(window.innerWidth, window.innerHeight);
composer.addPass(new RenderPass(scene, camera));

const bloom = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  0.72,   // strength
  0.85,   // radius
  0.6     // threshold
);
composer.addPass(bloom);
composer.addPass(new OutputPass());

/* ==========================================================================
   Kamera durumları: serbest / sinematik / takip / yaklaşma
   ========================================================================== */

const state = {
  mode: 'free',          // free | cinematic | follow
  fly: null,             // { from, fromTarget, to, toTarget, t, dur, onDone }
  cinematic: { i: 0, t: 0, paused: false },
  follow: null,          // { sub, offset }
  selected: null
};

/** Yumuşak kamera uçuşu */
function flyTo(pos, target, dur = 1.9, onDone) {
  state.fly = {
    from: camera.position.clone(),
    fromTarget: controls.target.clone(),
    to: pos.clone(),
    toTarget: target.clone(),
    t: 0,
    dur,
    onDone
  };
}

function easeInOut(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/* --- sinematik tur rotaları ---------------------------------------------- */

const tourPath = [
  { pos: new THREE.Vector3(115, 40, 95), target: new THREE.Vector3(0, 14, 0), hold: 1.0, dwell: 3.0 },
  { pos: new THREE.Vector3(58, 26, 58), target: new THREE.Vector3(0, 16, 0), hold: 1.0, dwell: 3.2 },
  { pos: new THREE.Vector3(38, 44, 6), target: new THREE.Vector3(-72, 12, 22), hold: 1.0, dwell: 3.2 },
  { pos: new THREE.Vector3(90, 34, -34), target: new THREE.Vector3(54, 14, -64), hold: 1.0, dwell: 3.2 },
  { pos: new THREE.Vector3(34, 52, 28), target: new THREE.Vector3(6, 12, 82), hold: 1.0, dwell: 3.2 },
  { pos: new THREE.Vector3(8, 88, 4), target: new THREE.Vector3(0, 0, 0), hold: 1.0, dwell: 3.4 },
  { pos: new THREE.Vector3(-60, 34, -70), target: new THREE.Vector3(0, 12, 0), hold: 1.0, dwell: 3.0 }
];

const tour = {
  segment: 1,
  t: 0,
  dwell: 0,
  active: false
};

function startTour() {
  if (state.mode === 'cinematic') { stopTour(); return; }
  stopFollow();
  closeCard();
  state.mode = 'cinematic';
  state.fly = null;
  tour.active = true;
  tour.segment = 0;
  tour.t = 1;
  tour.dwell = 0;
  document.body.classList.add('cinematic');
  btnTour.classList.add('on');
  toast('Sinematik tur başladı');
  // ilk noktaya uç
  const p = tourPath[0];
  state.fly = {
    from: camera.position.clone(), fromTarget: controls.target.clone(),
    to: p.pos.clone(), toTarget: p.target.clone(), t: 0, dur: 2.6, onDone: () => { tour.dwell = p.dwell; }
  };
}

function stopTour() {
  tour.active = false;
  state.mode = 'free';
  document.body.classList.remove('cinematic');
  btnTour.classList.remove('on');
  toast('Serbest kamera');
}

function updateTour(dt) {
  if (!tour.active) return;
  if (state.fly) return; // uçuş devam ediyor

  if (tour.dwell > 0) {
    tour.dwell -= dt;
    // beklerken çok hafif süzülme
    camera.position.y += Math.sin(performance.now() * 0.0004) * dt * 0.35;
    return;
  }

  const nextIdx = (tour.segment + 1) % tourPath.length;
  const cur = tourPath[tour.segment];
  const nxt = tourPath[nextIdx];
  tour.segment = nextIdx;

  state.fly = {
    from: cur.pos.clone(), fromTarget: cur.target.clone(),
    to: nxt.pos.clone(), toTarget: nxt.target.clone(),
    t: 0, dur: 4.4,
    onDone: () => { tour.dwell = nxt.dwell; }
  };
}

/* --- denizaltı takibi ----------------------------------------------------- */

function stopFollow() {
  if (state.mode === 'follow') {
    state.mode = 'free';
    btnFollow.classList.remove('on');
  }
  state.follow = null;
}

function toggleFollow() {
  if (state.mode === 'follow') {
    stopFollow();
    toast('Takip bırakıldı');
    return;
  }
  if (tour.active) stopTour();
  closeCard();
  const sub = creatures.subs[Math.floor(Math.random() * creatures.subs.length)];
  state.follow = { sub, pos: new THREE.Vector3(), target: new THREE.Vector3(), init: false };
  state.mode = 'follow';
  btnFollow.classList.add('on');
  toast('Denizaltı takibi açık');
  controls.enabled = false;
}

/* --- kubbe kartı ---------------------------------------------------------- */

const card = document.getElementById('card');
const cardTitle = document.getElementById('card-title');
const cardSub = document.getElementById('card-sub');
const cardDesc = document.getElementById('card-desc');
const cardPop = document.getElementById('card-pop');
const cardDepth = document.getElementById('card-depth');
const cardState = document.getElementById('card-state');
let toastTimer = null;

function toast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2200);
}

function openCard(city) {
  cardTitle.textContent = city.name;
  cardSub.textContent = city.sub;
  cardDesc.textContent = city.desc;
  cardPop.textContent = city.pop;
  cardDepth.textContent = city.depth;
  cardState.textContent = city.state;
  card.classList.add('show');
}

function closeCard() {
  card.classList.remove('show');
  state.selected = null;
}

/* --- tıklama: kubbeye yaklaş --------------------------------------------- */

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
let downPos = { x: 0, y: 0 };

canvas.addEventListener('pointerdown', (e) => {
  downPos = { x: e.clientX, y: e.clientY };
});

canvas.addEventListener('pointerup', (e) => {
  const moved = Math.hypot(e.clientX - downPos.x, e.clientY - downPos.y);
  if (moved > 6) return; // sürükleme, tıklama değil

  pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
  pointer.y = -(e.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);

  const shells = domes.map(d => d.userData.pickTarget);
  const hits = raycaster.intersectObjects(shells, false);
  if (hits.length === 0) {
    // boşluğa tıklandı → kartı kapat
    if (card.classList.contains('show')) closeCard();
    return;
  }

  const cityId = hits[0].object.userData.cityId;
  const city = CITIES.find(c => c.id === cityId);
  if (!city) return;

  if (tour.active) stopTour();
  if (state.mode === 'follow') stopFollow();
  controls.enabled = true;

  // kamerayı kubbenin dışından, hafif yukarıdan bakacak şekilde konumla
  const dir = new THREE.Vector3(camera.position.x - city.pos.x, 0, camera.position.z - city.pos.z);
  if (dir.lengthSq() < 0.01) dir.set(1, 0, 1);
  dir.normalize();
  const dist = city.radius * 2.5 + 16;
  const to = new THREE.Vector3(
    city.pos.x + dir.x * dist,
    city.height * 1.05 + 9,
    city.pos.z + dir.z * dist
  );
  const target = new THREE.Vector3(city.pos.x, city.height * 0.42, city.pos.z);

  flyTo(to, target, 2.0);
  state.selected = city.id;
  openCard(city);
});

/* --- arayüz düğmeleri ----------------------------------------------------- */

const btnTour = document.getElementById('btn-tour');
const btnNight = document.getElementById('btn-night');
const btnFollow = document.getElementById('btn-follow');
const btnReset = document.getElementById('btn-reset');
const btnCardClose = document.getElementById('card-close');

btnTour.addEventListener('click', startTour);
btnFollow.addEventListener('click', toggleFollow);
btnCardClose.addEventListener('click', closeCard);

btnNight.addEventListener('click', () => {
  const on = atmosphere.target < 0.5;
  atmosphere.setNight(on);
  btnNight.classList.toggle('on', on);
  btnNight.lastChild.textContent = on ? 'Gündüz Modu' : 'Gece Modu';
  toast(on ? 'Gece modu' : 'Gündüz modu');
});

btnReset.addEventListener('click', () => {
  if (tour.active) stopTour();
  stopFollow();
  closeCard();
  controls.enabled = true;
  flyTo(HOME_POS, HOME_TARGET, 2.0);
  toast('Kamera sıfırlandı');
});

// klavye kısayolları
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeCard();
    if (tour.active) stopTour();
    if (state.mode === 'follow') { stopFollow(); controls.enabled = true; }
  }
  if (e.key.toLowerCase() === 't') startTour();
  if (e.key.toLowerCase() === 'n') btnNight.click();
  if (e.key.toLowerCase() === 'f') toggleFollow();
  if (e.key.toLowerCase() === 'r') btnReset.click();
});

/* --- boyutlandırma -------------------------------------------------------- */

function onResize() {
  const w = window.innerWidth, h = window.innerHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.8));
  renderer.setSize(w, h);
  composer.setPixelRatio(Math.min(window.devicePixelRatio, 1.8));
  composer.setSize(w, h);
  bloom.setSize(w, h);
}
window.addEventListener('resize', onResize);

/* ==========================================================================
   Döngü
   ========================================================================== */

const clock = new THREE.Clock();
let elapsed = 0;
let firstFrame = true;

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.05);
  elapsed += dt;

  // uçuş animasyonu
  if (state.fly) {
    const f = state.fly;
    f.t += dt / f.dur;
    const k = easeInOut(Math.min(f.t, 1));
    camera.position.lerpVectors(f.from, f.to, k);
    controls.target.lerpVectors(f.fromTarget, f.toTarget, k);
    if (f.t >= 1) {
      const done = f.onDone;
      state.fly = null;
      if (done) done();
    }
  }

  // takip modu
  if (state.mode === 'follow' && state.follow) {
    const { sub } = state.follow;
    const subPos = sub.group.position;
    const quat = sub.group.quaternion;
    const back = new THREE.Vector3(0, 3.6, -13).applyQuaternion(quat).add(subPos);
    const look = new THREE.Vector3(0, 0.8, 12).applyQuaternion(quat).add(subPos);
    if (!state.follow.init) {
      state.follow.pos.copy(back);
      state.follow.target.copy(look);
      state.follow.init = true;
    }
    state.follow.pos.lerp(back, 1 - Math.exp(-3.2 * dt));
    state.follow.target.lerp(look, 1 - Math.exp(-4.0 * dt));
    camera.position.copy(state.follow.pos);
    camera.lookAt(state.follow.target);
    controls.target.copy(state.follow.target);
  } else {
    updateTour(dt);
    if (state.mode === 'free' || tour.active) {
      if (!state.fly || state.mode === 'free') controls.update();
      else controls.target.copy(controls.target);
    }
  }

  // dünya animasyonları
  for (const grass of (scene.children.find(o => o.isGroup && o.userData.grass)?.userData.grass || [])) {
    for (const blade of grass.children) {
      blade.rotation.z = blade.userData.baseRot + Math.sin(elapsed * blade.userData.sway + blade.userData.phase) * 0.16;
    }
  }

  // kubbe tepe lambaları yanıp sönsün
  for (const d of domes) {
    d.traverse((o) => {
      if (o.userData && o.userData.blink !== undefined && o.material) {
        o.material.opacity = 1;
        o.scale.setScalar(0.8 + Math.sin(elapsed * o.userData.blink + o.userData.blink) * 0.35);
      }
      if (o.isMesh && o.material && o.material.emissive && o.userData.cityId) {
        o.userData.pulse = (o.userData.pulse || 0) + dt;
      }
    });
  }

  creatures.update(dt, elapsed);
  atmosphere.update(dt, elapsed);
  atmosphere.applyInterior(domes);

  // gece modunda bloom biraz kısılsın (parlamalar patlamasın)
  bloom.strength = THREE.MathUtils.lerp(0.6, 0.95, atmosphere.night);
  bloom.threshold = THREE.MathUtils.lerp(0.72, 0.42, atmosphere.night);

  composer.render();

  if (firstFrame) {
    firstFrame = false;
    const loader = document.getElementById('loader');
    document.getElementById('loader-text').textContent = 'Dalış başlıyor';
    setTimeout(() => {
      loader.classList.add('hide');
      // açılış: kamerayı yavaşça içeri al
      flyTo(new THREE.Vector3(78, 46, 92), new THREE.Vector3(0, 10, 0), 3.4);
    }, 350);
  }
}

animate();

// test/hata ayıklama için sahneyi dışa aç
window.__aqua = { scene, camera, renderer, controls, CITIES, state, atmosphere };
