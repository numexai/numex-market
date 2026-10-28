/* ============================================================
   NUMEX CLOCKWORK — Zamanın İçini Gör
   Tamamen kodla üretilmiş 3D mekanik saat.
   Hazır model / video / dış görsel YOK — her parça matematikle çizilir.
   ============================================================ */

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

/* ============================================================
   0. YARDIMCILAR
   ============================================================ */
const TAU = Math.PI * 2;
const DEG = Math.PI / 180;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const easeInOut = t => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

/* ============================================================
   1. MALZEMELER — altın, bronz, çelik, cam
   ============================================================ */
const MAT = {};

/* ------------------------------------------------------------
   Yüzey pürüz dokusu — kodla üretilir (harici dosya YOK).
   Değer gürültüsü + ince tarama: metali "kesilmiş sac" görünümünden
   çıkarıp torna/freze izli gerçek yüzeye yaklaştırır.
   ------------------------------------------------------------ */
function makeMetalRoughnessTexture(size = 256, base = 150, variance = 46) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  const img = ctx.createImageData(size, size);

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      // eşmerkezli tarama izleri + ince gürültü
      const cx = x / size - 0.5;
      const cy = y / size - 0.5;
      const r = Math.sqrt(cx * cx + cy * cy) * 60;
      const rings = Math.sin(r * Math.PI) * 0.5 + 0.5;
      const noise = Math.random();
      const v = clamp(base + (rings - 0.5) * variance * 1.4 + (noise - 0.5) * variance, 0, 255);
      const i = (y * size + x) * 4;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
      img.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 2);
  tex.colorSpace = THREE.NoColorSpace;
  tex.anisotropy = 4;
  return tex;
}

function buildMaterials() {
  const roughTex = makeMetalRoughnessTexture();

  /* Altın: yüzeyde mikro pürüz (roughnessMap yerine yüksek roughness +
     düşük emissive) — düz "sarı boya" görünümünü kırar. */
  MAT.gold = new THREE.MeshPhysicalMaterial({
    color: 0xc08c33, metalness: 1.0, roughness: 0.42,
    roughnessMap: roughTex,
    clearcoat: 0.35, clearcoatRoughness: 0.45,
    emissive: 0x140c02, emissiveIntensity: 0.25,
  });
  MAT.goldPolished = new THREE.MeshPhysicalMaterial({
    color: 0xe8bd6d, metalness: 1.0, roughness: 0.2,
    roughnessMap: roughTex,
    clearcoat: 0.85, clearcoatRoughness: 0.08,
  });
  MAT.bronze = new THREE.MeshPhysicalMaterial({
    color: 0x6f4520, metalness: 1.0, roughness: 0.56,
    roughnessMap: roughTex,
    clearcoat: 0.2, clearcoatRoughness: 0.6,
    emissive: 0x0e0702, emissiveIntensity: 0.22,
  });
  MAT.copper = new THREE.MeshPhysicalMaterial({
    color: 0xb06a33, metalness: 1.0, roughness: 0.28,
  });
  MAT.steel = new THREE.MeshPhysicalMaterial({
    color: 0x9aa1aa, metalness: 1.0, roughness: 0.24,
    roughnessMap: roughTex,
    clearcoat: 0.6,
  });
  MAT.dark = new THREE.MeshPhysicalMaterial({
    color: 0x2a2118, metalness: 0.85, roughness: 0.5,
  });
  MAT.dialFace = new THREE.MeshPhysicalMaterial({
    color: 0x0e0b08, metalness: 0.35, roughness: 0.62,
    clearcoat: 0.4, clearcoatRoughness: 0.4,
  });
  MAT.enamel = new THREE.MeshPhysicalMaterial({
    color: 0x14100c, metalness: 0.2, roughness: 0.55,
    clearcoat: 0.9, clearcoatRoughness: 0.15,
  });
  /* Cam: yalnızca kenarlarda ince bir yansıma.
     transmission + bloom beyaz leke üretiyordu; additive blending ise
     tüm sahneyi sise boğuyordu. Normal saydamlık + çok düşük opaklık
     sahneyi örtmeden cam hissi verir. */
  MAT.glass = new THREE.MeshPhysicalMaterial({
    color: 0xaec6d6, metalness: 0.0, roughness: 0.06,
    transparent: true, opacity: 0.055,
    clearcoat: 1.0, clearcoatRoughness: 0.02,
    side: THREE.FrontSide, depthWrite: false,
    envMapIntensity: 1.6,
  });
  MAT.glow = new THREE.MeshBasicMaterial({ color: 0xffd699 });
  MAT.ruby = new THREE.MeshPhysicalMaterial({
    color: 0x8e1020, metalness: 0.1, roughness: 0.15,
    clearcoat: 1.0, emissive: 0x3a0510, emissiveIntensity: 0.6,
  });
}

/* ============================================================
   2. EVOLVENT DİŞLİ ÜRETECİ
   Gerçek evolvent profil yerine yüksek kaliteli yaklaşım:
   her diş bir trapez + yuvarlatılmış tepe; silindirik gövde.
   ============================================================ */
function gearShape(teeth, pitchRadius, { module_ = 0.083, hubRatio = 0.34, spokeCount = 0, holeRadius = 0 } = {}) {
  const shape = new THREE.Shape();

  /* DİŞ ÖLÇÜSÜ HATVEYE BAĞLIDIR, YARIÇAPA DEĞİL.
     Eski sürüm toothDepth'ı pitchRadius'un yüzdesi olarak alıyordu; bu yüzden
     44 dişli çarkta dişler iğne gibi ince, 9 dişlide kütük gibi kalıyor ve
     komşu çarka hiç girmiyordu (ekranda "fırça" görünümü). Gerçek çarkta:
       addendum  = 1.00 × m  (hatve dairesinden tepeye)
       dedendum  = 1.25 × m  (hatve dairesinden köke)
     Kök açıklığı bilerek tepe yüksekliğinden büyük: böylece dişler boşluğa
     girer, dipte çakışma olmaz. */
  const m = module_;                       // hatve (modül)
  const rPitch = pitchRadius;
  const rOuter = rPitch + m * 1.00;        // diş üstü dairesi
  const rRoot = rPitch - m * 1.25;         // diş dibi dairesi
  const step = TAU / teeth;                // açısal hatve
  const halfTop = step * 0.21;             // tepe genişliği (hatvenin %42'si)
  const halfRoot = step * 0.29;            // kök genişliği (hatvenin %58'i)

  /* EVOLVENT YAKLAŞIMI: diş yanağı iki nokta arasında düz çizgi değil,
     kökten tepeye doğru DIŞA doğru kıvrılan bir eğri. Gerçek evolventin
     ilk iki terimi (r·(1+t²/2)) yeterli: fark gözle görülür, maliyeti yok. */
  const flank = (side, a, r, k) => {
    // side: -1 sol yanak, +1 sağ yanak; k: 0→kök, 1→tepe
    const t = k;                              // yanak boyunca 0..1
    const ang = a + side * lerp(halfRoot, halfTop, t);
    // evolvent düzeltmesi: yanağın ortası hafifçe dışa taşar
    const bulge = 1 + m * 0.10 * Math.sin(Math.PI * t) / r;
    return [Math.cos(ang) * r * bulge, Math.sin(ang) * r * bulge];
  };

  for (let i = 0; i < teeth; i++) {
    const a = i * step;
    const rootL = a - halfRoot;
    const rootR = a + halfRoot;
    const topL = a - halfTop;
    const topR = a + halfTop;

    // 1) kök yayının sonundan bu dişin sol köküne
    if (i === 0) {
      shape.moveTo(Math.cos(rootL) * rRoot, Math.sin(rootL) * rRoot);
    } else {
      shape.lineTo(Math.cos(rootL) * rRoot, Math.sin(rootL) * rRoot);
    }

    // 2) sol yanak — kökten tepeye eğri (3 ara nokta)
    for (let s = 1; s <= 3; s++) {
      const p = flank(-1, a, lerp(rRoot, rOuter, s / 4), s / 4);
      shape.lineTo(p[0], p[1]);
    }
    shape.lineTo(Math.cos(topL) * rOuter, Math.sin(topL) * rOuter);

    // 3) tepe yayı — bir miktar yuvarlatılmış (gerçek çarkta tepe düzdür,
    //    köşeler faso edilmiştir; burada 2 ara nokta ile taklit edilir)
    shape.absarc(0, 0, rOuter, topL, topR, false);

    // 4) sağ yanak — tepeden köke eğri
    for (let s = 3; s >= 1; s--) {
      const p = flank(1, a, lerp(rRoot, rOuter, s / 4), s / 4);
      shape.lineTo(p[0], p[1]);
    }

    // 5) kök yayı — bir sonraki dişin sol köküne kadar
    const nextRootL = a + step - halfRoot;
    shape.absarc(0, 0, rRoot, rootR, nextRootL, false);
  }
  shape.closePath();

  // merkez deliği
  const hubR = pitchRadius * hubRatio;
  const hole = new THREE.Path();
  hole.absarc(0, 0, hubR, 0, TAU, true);
  shape.holes.push(hole);

  // hafifletme delikleri (büyük dişlilerde "spoke" görünümü)
  if (spokeCount > 0) {
    const holeR = pitchRadius * holeRadius;
    const ringR = (hubR + rRoot) * 0.5;
    for (let s = 0; s < spokeCount; s++) {
      const ang = (s / spokeCount) * TAU + Math.PI / spokeCount;
      const cx = Math.cos(ang) * ringR;
      const cy = Math.sin(ang) * ringR;
      const h = new THREE.Path();
      h.absarc(cx, cy, holeR, 0, TAU, true);
      shape.holes.push(h);
    }
  }
  return shape;
}

function makeGear(teeth, module_, opts = {}) {
  const pitchRadius = (module_ * teeth) / 2;
  const thickness = opts.thickness ?? pitchRadius * 0.22;
  const shape = gearShape(teeth, pitchRadius, { ...opts, module_ });
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: thickness,
    bevelEnabled: true,
    bevelThickness: thickness * 0.08,
    bevelSize: pitchRadius * 0.012,
    bevelSegments: 2,
    curveSegments: Math.max(8, Math.min(30, Math.round(teeth / 2))),
  });
  geo.center();
  geo.rotateX(0);
  const mesh = new THREE.Mesh(geo, opts.material || MAT.gold);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.userData.pitchRadius = pitchRadius;
  mesh.userData.teeth = teeth;
  mesh.userData.thickness = thickness;
  return mesh;
}

/* ------------------------------------------------------------
   MİL, SOMUN, RONDELA
   DÜZELTME (kök neden): Silindir geometrisinin ekseni ZATEN +Y'dir.
   Eski kod `rotation.x = Math.PI/2` uyguluyordu → mil ve somun çark
   düzlemine YATIYOR, çark ekseninde durmuyordu. Ayrıca geo.center()
   sonrası çarkın ön yüzü +thickness/2'de kalırken somun thickness*0.72'ye
   konuyordu → gövdenin İÇİNE gömülüyor, dışarıdan görünmüyordu.
   Doğrusu: çark düzlemi XY, kalınlık Z boyunca. Mil ve somun Z ekseninde
   olmalı → silindiri `rotateX(90°)` ile Y'den Z'ye çevirmek gerekir;
   ama bunu mesh'e DEĞİL geometriye uygulayıp somun konumunu ön yüze taşırız.
   ------------------------------------------------------------ */
function addAxleAndNut(group, radius, thickness, mat = MAT.steel) {
  /* Mil: çark kalınlığından taşar, iki yanda görünür */
  const axleLen = thickness + radius * 0.34;
  const axleGeo = new THREE.CylinderGeometry(radius * 0.085, radius * 0.085, axleLen, 18);
  axleGeo.rotateX(Math.PI / 2);            // Y ekseni → Z ekseni (çark ekseni)
  const axle = new THREE.Mesh(axleGeo, mat);
  axle.castShadow = true;
  group.add(axle);

  /* Rondela: somunun çarka oturduğu pul */
  const washerGeo = new THREE.CylinderGeometry(radius * 0.19, radius * 0.19, thickness * 0.10, 24);
  washerGeo.rotateX(Math.PI / 2);

  /* Altıgen somun: çark ekseninde, çarkın ÖN yüzünün hemen dışında */
  const nutGeo = new THREE.CylinderGeometry(radius * 0.145, radius * 0.145, thickness * 0.30, 6);
  nutGeo.rotateX(Math.PI / 2);

  const faceF = thickness / 2;             // çarkın ön yüzü

  const washerF = new THREE.Mesh(washerGeo, MAT.bronze);
  washerF.position.z = faceF + thickness * 0.05;
  group.add(washerF);

  const nutF = new THREE.Mesh(nutGeo, MAT.goldPolished);
  nutF.position.z = faceF + thickness * 0.10 + thickness * 0.15;
  nutF.castShadow = true;
  group.add(nutF);

  /* Arka yüzde sadece rondela + küçük somun (kasaya bakan taraf) */
  const washerB = new THREE.Mesh(washerGeo, MAT.bronze);
  washerB.position.z = -faceF - thickness * 0.05;
  group.add(washerB);

  const nutB = new THREE.Mesh(nutGeo, MAT.goldPolished);
  nutB.position.z = -faceF - thickness * 0.10 - thickness * 0.15;
  group.add(nutB);

  return group;
}

/* ============================================================
   3. SAHNE KURULUMU
   ============================================================ */
const canvas = document.getElementById('stage');
const renderer = new THREE.WebGLRenderer({
  canvas, antialias: true, alpha: false, powerPreference: 'high-performance',
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x060403);
scene.fog = new THREE.FogExp2(0x060403, 0.028);

const camera = new THREE.PerspectiveCamera(34, window.innerWidth / window.innerHeight, 0.1, 200);
const CAM_TARGET = new THREE.Vector3(0, 0.2, 0);

/* Ev kamerası EKRAN ORANINA göre hesaplanır: dar/dikey ekranda yatay
   görüş açısı küçüldüğü için sabit mesafe kasayı kesiyordu. Kasa yarıçapı
   CASE_R, hem dikey hem yatay eksende sığacak şekilde ölçeklenir. */
const CAM_HOME = new THREE.Vector3();

/* ★28.10 Market hazırlığı: alttaki kontrol paneli kasanın alt üçte birini (sarkaç
   topuzu dahil) örtüyordu — kadraj tüm pencereye göre hesaplanıyordu. Artık SERBEST
   alan (panelin üstü) ölçülür: kamera görüntüsü o alanın ortasına kaydırılır
   (setViewOffset) ve sığdırma mesafesi o alanın yüksekliğine göre bulunur. */
function serbestAlan() {
  const h = window.innerHeight;
  const panel = document.getElementById('panel');
  const alt = panel ? Math.max(0, h - panel.getBoundingClientRect().top + 6) : 0;
  const ust = Math.min(56, h * 0.06);
  return { h, alt, ust, oran: Math.max(0.35, (h - alt - ust) / h) };
}
function kadrajiKaydir() {
  const w = window.innerWidth, { h, alt, ust } = serbestAlan();
  camera.setViewOffset(w, h, 0, Math.round((alt - ust) / 2), w, h);
}
/* yarıçapı R olan daireyi serbest alana sığdıran kamera mesafesi */
function sigmaMesafesi(R, pay) {
  const vFov = Math.atan(Math.tan((camera.fov * DEG) / 2) * serbestAlan().oran);
  const hFov = Math.atan(Math.tan((camera.fov * DEG) / 2) * camera.aspect);
  return (R / Math.tan(Math.min(vFov, hFov))) * pay;   // dar olan eksen belirleyici
}
function computeHomeDistance() {
  const CASE_R_HOME = 5.4;   // kasa yarıçapı (CASE_R sabitinin ev değeri)
  /* %26 nefes payı: %16'da en dıştaki çarklar kadraj kenarına dayanıyordu. */
  return sigmaMesafesi(CASE_R_HOME, 1.26);
}

function resetCameraHome(immediate = false) {
  kadrajiKaydir();
  const d = computeHomeDistance();
  CAM_HOME.set(0, 0.75 * (d / 15.2), d);
  if (immediate) {
    camera.position.copy(CAM_HOME);
    camera.lookAt(CAM_TARGET);
  }
  return CAM_HOME;
}
resetCameraHome(true);

buildMaterials();

/* --- Çevre (metal yansımaları) --- */
const pmrem = new THREE.PMREMGenerator(renderer);
pmrem.compileEquirectangularShader();
const envRT = pmrem.fromScene(new RoomEnvironment(), 0.04);
scene.environment = envRT.texture;

/* ============================================================
   4. IŞIK — sinematik
   ============================================================ */
const lights = new THREE.Group();
scene.add(lights);

const keyLight = new THREE.SpotLight(0xffe3b0, 190, 34, 0.62, 0.45, 1.6);
keyLight.position.set(5.2, 8.6, 7.0);
keyLight.castShadow = true;
keyLight.shadow.mapSize.set(2048, 2048);
keyLight.shadow.camera.near = 1;
keyLight.shadow.camera.far = 40;
keyLight.shadow.bias = -0.0009;
keyLight.target.position.set(0, 0, 0);
lights.add(keyLight, keyLight.target);

const rimLight = new THREE.SpotLight(0x7fb4ff, 120, 34, 0.8, 0.6, 1.5);
rimLight.position.set(-7.2, 4.0, -6.4);
rimLight.target.position.set(0, 0, 0);
lights.add(rimLight, rimLight.target);

const fillLight = new THREE.PointLight(0xff9b4d, 26, 16, 2);
fillLight.position.set(-3.4, -3.2, 5.4);
lights.add(fillLight);

/* Alt dolgu ışığı: sarkaç topuzuna değil, kasanın alt iç yüzüne vurur. */
const underGlow = new THREE.PointLight(0xb8762a, 5.5, 7, 2.4);
underGlow.position.set(0, -3.2, -0.4);
lights.add(underGlow);

const ambient = new THREE.AmbientLight(0x2a1f14, 0.9);
scene.add(ambient);

/* ============================================================
   5. KASA — cam arkasında mekanizma
   ============================================================ */
const clockRoot = new THREE.Group();
scene.add(clockRoot);

const CASE_R = 5.4;
const caseGroup = new THREE.Group();
clockRoot.add(caseGroup);

/* arka plaka */
const backPlate = new THREE.Mesh(
  new THREE.CylinderGeometry(CASE_R, CASE_R, 0.34, 96),
  new THREE.MeshPhysicalMaterial({
    color: 0x12100d, metalness: 0.9, roughness: 0.42,
    clearcoat: 0.3,
  })
);
backPlate.rotation.x = Math.PI / 2;
backPlate.position.z = -1.55;
backPlate.receiveShadow = true;
caseGroup.add(backPlate);

/* arka plakada dekoratif halka */
const plateRing = new THREE.Mesh(
  new THREE.TorusGeometry(CASE_R * 0.82, 0.055, 12, 128),
  MAT.bronze
);
plateRing.position.z = -1.36;
caseGroup.add(plateRing);

/* dış çember / kasa halkası */
const bezel = new THREE.Mesh(
  new THREE.TorusGeometry(CASE_R, 0.36, 22, 128),
  MAT.gold
);
bezel.castShadow = true;
caseGroup.add(bezel);

const bezelInner = new THREE.Mesh(
  new THREE.TorusGeometry(CASE_R - 0.32, 0.09, 12, 128),
  MAT.goldPolished
);
caseGroup.add(bezelInner);

/* cam kapak */
const glassDome = new THREE.Mesh(
  new THREE.SphereGeometry(CASE_R * 0.995, 64, 32, 0, TAU, 0, Math.PI * 0.42),
  MAT.glass
);
glassDome.rotation.x = -Math.PI / 2;
glassDome.position.z = 0.98;
glassDome.renderOrder = 3;
clockRoot.add(glassDome);

/* kasayı tutan ayaklar */
for (let i = 0; i < 4; i++) {
  const a = (i / 4) * TAU + Math.PI / 4;
  const leg = new THREE.Mesh(
    new THREE.CylinderGeometry(0.09, 0.13, 1.5, 12),
    MAT.bronze
  );
  leg.position.set(Math.cos(a) * CASE_R * 0.92, Math.sin(a) * CASE_R * 0.92, -1.2);
  leg.rotation.x = Math.PI / 2;
  caseGroup.add(leg);
  const ball = new THREE.Mesh(new THREE.SphereGeometry(0.17, 20, 16), MAT.gold);
  ball.position.set(Math.cos(a) * CASE_R * 0.92, Math.sin(a) * CASE_R * 0.92, -1.95);
  caseGroup.add(ball);
}

/* ============================================================
   6. DİŞLİ TRENİ — birbirine bağlı, hız oranları fiziksel
   ============================================================ */
/* Modül, kasa çapına göre TÜRETİLİR — sabit vermiyoruz ki dişli treni
   her zaman kasanın içinde kalsın. En büyük çark 44 diş, hatve yarıçapı
   MODULE*44/2 olur; bunun kasa yarıçapının %42'sini aşmaması istenir. */
const MAX_TEETH = 44;
const MODULE = (CASE_R * 0.34 * 2) / MAX_TEETH;   // ≈ 0.083 — tren kasaya rahat sığar

const gearField = new THREE.Group();
gearField.position.z = -0.15;
caseGroup.add(gearField);

const gears = [];   // her dişli: { group, mesh, teeth, pitchRadius, base, omega, explodeDir }

/* ------------------------------------------------------------
   placeGear — bir dişliyi, kendisinden ÖNCE eklenmiş (ebeveyn)
   bir dişliye kavrayacak biçimde yerleştirir.
   Merkez uzaklığı = r1 + r2 (aynı modülde kavrama koşulu).
   ------------------------------------------------------------ */
let gearSeq = 0;
function placeGear(teeth, parentIndex, angleDeg, opts = {}) {
  const pitchRadius = (MODULE * teeth) / 2;
  const mesh = makeGear(teeth, MODULE, opts);
  mesh.name = opts.name || `disli_${gearSeq++}`;

  const group = new THREE.Group();
  group.name = `mil_${mesh.name}`;
  group.add(mesh);
  addAxleAndNut(group, pitchRadius, mesh.userData.thickness, opts.axleMat || MAT.steel);
  gearField.add(group);

  const g = {
    group, mesh, teeth, pitchRadius,
    omega: 0,                 // rad/sn (işaretli)
    base: new THREE.Vector3(),
    explodeDir: new THREE.Vector3(),
    parentIndex: parentIndex ?? null,
    phase: 0,
  };

  if (parentIndex === null || parentIndex === undefined) {
    g.base.set(0, 0, opts.z ?? 0);
  } else {
    const prev = gears[parentIndex];
    /* Kavrama mesafesi: hatve yarıçapları toplamı. Aynı modülde zaten
       r1+r2 = (z1+z2)/2 × m'dir — iki yazım eşdeğer; burada niyeti
       açık etmek için hatve biçiminde yazıldı. Dişler artık gerçekten
       birbirine GİRER (addendum = m, kök boşluğu 1.25m). */
    const dist = (prev.teeth + teeth) / 2 * MODULE;
    const a = angleDeg * DEG;
    g.base.set(
      prev.base.x + Math.cos(a) * dist,
      prev.base.y + Math.sin(a) * dist,
      opts.z ?? prev.base.z
    );
  }
  group.position.copy(g.base);

  gears.push(g);
  return gears.length - 1;
}

/* ------------------------------------------------------------
   DİŞLİ TRENİ
   Merkez çark → 5 ara dişli → 3 ikinci kademe → 2 üçüncü kademe
   Hepsi GERÇEK kavrama geometrisiyle (r1+r2 uzaklık) yerleşir.
   ------------------------------------------------------------ */
const g0 = placeGear(MAX_TEETH, null, 0, {
  name: 'ana_cark',
  thickness: 0.16, spokeCount: 5, hubRatio: 0.30, holeRadius: 0.105,
  material: MAT.gold, z: 0,
});

const sats = [
  { teeth: 22, ang: 168, name: 'ara_a', opts: { material: MAT.bronze, z: 0.05, spokeCount: 4, holeRadius: 0.13, hubRatio: 0.32 } },
  { teeth: 30, ang: 74, name: 'ara_b', opts: { material: MAT.copper, z: 0.10, spokeCount: 5, holeRadius: 0.115, hubRatio: 0.30 } },
  { teeth: 16, ang: 123, name: 'ara_c', opts: { material: MAT.gold, z: 0.02, hubRatio: 0.34 } },
  { teeth: 26, ang: 330, name: 'ara_d', opts: { material: MAT.bronze, z: 0.08, spokeCount: 4, holeRadius: 0.13, hubRatio: 0.32 } },
  { teeth: 18, ang: 215, name: 'ara_e', opts: { material: MAT.steel, z: 0.04, hubRatio: 0.34 } },
];
const satIdx = sats.map(s => placeGear(s.teeth, g0, s.ang, { ...s.opts, name: s.name }));

const secondStage = [
  { parent: satIdx[0], teeth: 12, ang: 221, name: 'kademe2_a', opts: { material: MAT.goldPolished, z: 0.30, hubRatio: 0.32 } },
  { parent: satIdx[2], teeth: 13, ang: 132, name: 'kademe2_b', opts: { material: MAT.copper, z: 0.26, hubRatio: 0.32 } },
  { parent: satIdx[3], teeth: 17, ang: 50,  name: 'kademe2_c', opts: { material: MAT.bronze, z: 0.32, spokeCount: 0, hubRatio: 0.32 } },
];
const secondIdx = secondStage.map(s => placeGear(s.teeth, s.parent, s.ang, { ...s.opts, name: s.name }));

/* üçüncü kademe — ebeveyni doğrudan ikinci kademedir */
const thirdStage = [
  { parent: secondIdx[0], teeth: 9,  ang: 270, name: 'kademe3_a', opts: { material: MAT.steel, z: 0.46, hubRatio: 0.36 } },
  { parent: secondIdx[2], teeth: 11, ang: 85,  name: 'kademe3_b', opts: { material: MAT.gold,  z: 0.54, hubRatio: 0.36 } },
];
const thirdIdx = thirdStage.map(s => placeGear(s.teeth, s.parent, s.ang, { ...s.opts, name: s.name }));

/* ============================================================
   6b. KAÇIŞ ÇARKI — ana çarka kavrar
   ★28.10 Market hazırlığı: eskiden 270°'de ara_d ile üst üste duruyor ve hızı elle
   (-BASE_OMEGA × 7.5) veriliyordu → dişleri ana çarkın içinden geçiyordu. Artık
   boş bir açıda ve hızı/fazı diğer çarklar gibi kavrama oranından gelir.
   Açılar ölçülerek seçildi: bağlı olmayan iki çark arası en az ~0.27 birim,
   hepsi kasanın 0.88R'si içinde, sarkaç koridoru boş.
   ============================================================ */
const escapeWheel = placeGear(15, g0, 25, {
  name: 'escape_wheel', material: MAT.goldPolished, z: 0.44, hubRatio: 0.30,
});

/* ------------------------------------------------------------
   Dönüş hızları — fiziksel kavrama oranı
   w_çocuk = -w_ebeveyn * (z_ebeveyn / z_çocuk)
   ------------------------------------------------------------ */
const BASE_OMEGA = TAU / 72;   // ana çark 72 saniyede bir tur

gears.forEach((g, i) => {
  if (g.parentIndex === null) {
    g.omega = BASE_OMEGA;
    g.phase = 0;
    return;
  }
  const parent = gears[g.parentIndex];
  g.omega = -parent.omega * (parent.teeth / g.teeth);

  /* Dişlerin birbirine geçmesi: çocuk çark, ebeveyne bakan yönde
     yarım diş kaydırılır. Ebeveynin o kavrama açısındaki fazı hesaplanır. */
  /* KAVRAMA FAZI — diş dişe geçsin diye.
     Çocuk çarkın, ebeveyne bakan yönünde (contact açısı) bir DİŞ değil
     bir BOŞLUK gelmelidir. Ebeveynin o açıdaki fazı ölçülüp çocuğun
     fazı yarım hatve kaydırılır. Bu satır olmadan dişler üst üste biner
     (ekranda "birbirine girmemiş" görüntünün ikinci nedeni). */
  const dx = g.base.x - parent.base.x;
  const dy = g.base.y - parent.base.y;
  const contact = Math.atan2(dy, dx);

  // ebeveynin kavrama noktasındaki diş fazı (0 = diş ortası, 1 = boşluk ortası)
  const parentPhaseAtContact =
    (parent.phase * parent.teeth / TAU) + (contact / (TAU / parent.teeth)) + 0.5;

  // çocuk, ebeveynin dişinin karşısına BOŞLUK getirecek şekilde döner
  // NUMEX-DÜZELTME (2026-10-27): teeth bu kapsamda tanımlı değil; çocuk çarkın diş sayısı g.teeth. ReferenceError tüm sahneyi düşürüyordu.
  const childOffset = -(parentPhaseAtContact % 1) * (TAU / g.teeth);
  g.phase = contact + Math.PI + childOffset;
});

/* ============================================================
   7. KADRAN — akrep, yelkovan, saniye
   ============================================================ */
const dialGroup = new THREE.Group();
dialGroup.position.z = 0.92;
dialGroup.visible = false;   // başlangıçta mekanizma modu
clockRoot.add(dialGroup);

const dialR = CASE_R * 0.86;

/* kadran yüzü */
const dialFace = new THREE.Mesh(
  new THREE.CircleGeometry(dialR, 96),
  new THREE.MeshPhysicalMaterial({
    color: 0x0b0906, metalness: 0.25, roughness: 0.68,
    clearcoat: 0.55, clearcoatRoughness: 0.3,
  })
);
dialFace.position.z = 0.30;
dialGroup.add(dialFace);

/* dış ince halka */
const dialRing = new THREE.Mesh(new THREE.TorusGeometry(dialR * 0.985, 0.035, 10, 128), MAT.goldPolished);
dialRing.position.z = 0.34;
dialGroup.add(dialRing);

/* saat çizgileri (12 büyük, 60 ince) */
const tickMat = MAT.goldPolished;
for (let i = 0; i < 60; i++) {
  const major = i % 5 === 0;
  const len = major ? 0.34 : 0.15;
  const w = major ? 0.055 : 0.022;
  const tick = new THREE.Mesh(new THREE.BoxGeometry(w, len, 0.03), tickMat);
  const a = (i / 60) * TAU;
  const r = dialR * 0.9;
  tick.position.set(Math.cos(a) * r, Math.sin(a) * r, 0.36);
  tick.rotation.z = a - Math.PI / 2;
  dialGroup.add(tick);
}

/* Saat rakamları — 12/3/6/9 için gerçek rakam geometrisi.
   Her rakam, kalınlığı sabit parçalardan (segment) kurulur; böylece
   yazı tipi yüklemeden, tamamen kodla okunur rakam elde ederiz. */
const numeralGroup = new THREE.Group();
numeralGroup.position.z = 0.375;
dialGroup.add(numeralGroup);



/* ------------------------------------------------------------
   Saat rakamları — Canvas 2D ile yazı tipinden çizilip dokuya kaplanır.
   Segment yaklaşımı (çubuklardan rakam) bırakıldı: "12" okunmuyor,
   rakamlar perspektifte esniyordu. Burada rakam gerçek bir yazı
   tipiyle, kendi tuvaline çizilir; harici dosya/doku YOK.
   ------------------------------------------------------------ */
function makeNumeralSprite(label, sizeUnits, opacity = 0.95) {
  const S = 256;                        // tuval çözünürlüğü
  const cv = document.createElement('canvas');
  cv.width = cv.height = S;
  const ctx = cv.getContext('2d');

  ctx.clearRect(0, 0, S, S);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  /* altın gradyan dolgu + ince koyu kontur: metal kabartma hissi */
  const grad = ctx.createLinearGradient(0, S * 0.2, 0, S * 0.85);
  grad.addColorStop(0, '#f7e0ab');
  grad.addColorStop(0.45, '#d9ae62');
  grad.addColorStop(1, '#8a5f27');
  ctx.fillStyle = grad;
  ctx.strokeStyle = 'rgba(40,24,8,0.55)';
  ctx.lineWidth = S * 0.018;

  const twoDigits = String(label).length > 1;
  ctx.font = `600 ${S * (twoDigits ? 0.62 : 0.72)}px Georgia, "Times New Roman", serif`;
  ctx.strokeText(String(label), S / 2, S / 2);
  ctx.fillText(String(label), S / 2, S / 2);

  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;

  const mat = new THREE.MeshBasicMaterial({
    map: tex, transparent: true, depthWrite: false,
    opacity,
  });
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(sizeUnits, sizeUnits),
    mat
  );
  return mesh;
}

/* Tüm 12 saat işaretli — 12/3/6/9 büyük ve altın, aradakiler küçük ve sönük.
   Saat yönü (ekran düzlemi, +y yukarı):
     12 → tepe = +π/2 · 3 → sağ = 0 · 6 → alt = -π/2 · 9 → sol = π */
const DIAL_HOURS = [
  [12, 0, true], [1, 1, false], [2, 2, false], [3, 3, true],
  [4, 4, false], [5, 5, false], [6, 6, true], [7, 7, false],
  [8, 8, false], [9, 9, true], [10, 10, false], [11, 11, false],
];

DIAL_HOURS.forEach(([label, hour, major]) => {
  const a = Math.PI / 2 - (hour / 12) * TAU;
  const r = dialR * (major ? 0.745 : 0.775);
  const size = major ? (label > 9 ? 0.64 : 0.46) : (label > 9 ? 0.34 : 0.26);

  const num = makeNumeralSprite(label, size, major ? 0.95 : 0.55);
  num.position.set(Math.cos(a) * r, Math.sin(a) * r, 0.02);
  numeralGroup.add(num);
});


/* marka yazısı yeri: küçük altın plaka */
const plaque = new THREE.Mesh(
  new THREE.CylinderGeometry(0.24, 0.24, 0.02, 32),
  MAT.goldPolished
);
plaque.position.set(0, -dialR * 0.45, 0.37);
dialGroup.add(plaque);

/* --- Kollar --- */
function makeHand(length, width, tail, mat, thick = 0.055) {
  const shape = new THREE.Shape();
  // iğ biçimli kol: tabanda geniş, uçta sivri
  shape.moveTo(-width, -tail);
  shape.lineTo(width, -tail);
  shape.lineTo(width * 0.55, length * 0.72);
  shape.lineTo(0, length);
  shape.lineTo(-width * 0.55, length * 0.72);
  shape.closePath();
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: thick, bevelEnabled: true, bevelThickness: 0.008, bevelSize: 0.008, bevelSegments: 2,
  });
  const hand = new THREE.Mesh(geo, mat);
  hand.castShadow = true;
  return hand;
}

const hourHand = makeHand(dialR * 0.50, 0.075, 0.16, MAT.goldPolished, 0.06);
hourHand.position.z = 0.42;
dialGroup.add(hourHand);

const minuteHand = makeHand(dialR * 0.76, 0.055, 0.20, MAT.gold, 0.055);
minuteHand.position.z = 0.50;
dialGroup.add(minuteHand);

const secondHand = makeHand(dialR * 0.84, 0.018, 0.26, MAT.ruby, 0.035);
secondHand.position.z = 0.57;
dialGroup.add(secondHand);

/* merkez göbek */
const centerCap = new THREE.Mesh(new THREE.SphereGeometry(0.14, 24, 16), MAT.goldPolished);
centerCap.position.z = 0.62;
centerCap.scale.z = 0.6;
dialGroup.add(centerCap);

const centerGem = new THREE.Mesh(new THREE.SphereGeometry(0.06, 16, 12), MAT.ruby);
centerGem.position.z = 0.68;
dialGroup.add(centerGem);

/* ============================================================
   8. SARKAÇ — ritmik hareket
   ============================================================ */
/* Sarkaç kasanın İÇİNDE ve camın arkasında durur — dışına taşmaz. */
/* DÜZELTME (kök neden): sarkaç z=-0.95'te, ana çark z=0'daydı → sarkaç
   dişli treninin ARKASINDA kalıyor, kadrajda gölgeye gömülüyordu.
   Gerçek saatte sarkaç mekanizmanın önünde, ayrı bir bölmede durur.
   z=+0.62: tüm çarkların önü, kadranın (z=0.92) arkası. */
const pendulumPivot = new THREE.Group();
/* Sarkaç derinliği TEK kaynaktan: animasyon döngüsü de bu sabiti kullanır.
   (Eskiden döngüde -1.1 sabit yazılıydı ve buradaki değeri eziyordu.) */
/* KONUM — sarkaç, dişli treninin TAMAMEN ALINDA olmalı.
   Dişli treni yarıçapı: en dış çark merkezi 1.83 + yarıçapı 0.66 ≈ 2.5.
   Sarkaç pivotu y=-1.55'te; çubuk 2.2 aşağı iner → topuz y≈-3.65.
   Kasa yarıçapı 5.4 olduğuna göre topuz kasanın içinde, alt boşlukta,
   hiçbir çarkın önünden geçmeden salınır. (Önceki denemede pivot 4.55'teyken
   topuz y=-3.4'e iniyordu ama çubuk çarkların önünden geçiyordu.) */
const PENDULUM_Z = 0.74;
/* ★28.10: pivot ana çarkın hemen altına (-0.38R); altındaki koridorda hiçbir çark yok. */
pendulumPivot.position.set(0, -CASE_R * 0.38, PENDULUM_Z);
caseGroup.add(pendulumPivot);

/* Çubuk: eski hâli yarıçap 0.035 (14px'te ~1 piksel) — koyu zeminde kayboluyordu.
   Gerçek saat sarkaç çubuğu ince ama PARLAK çelik; ölçüyü büyüttük ve
   malzemeyi cilalı çeliğe çektik ki ışığı yakalayıp görünsün. */
/* Çubuk, pivotun üstündeki kısa boyunduruk + aşağı inen kol olarak kurulur.
   2.1 birim: pivot -1.57'de, topuz -3.67'de → kasanın alt iç kenarına (-5.4)
   rahatça sığar. */
const rodLen = CASE_R * 0.40;
const rod = new THREE.Mesh(
  new THREE.CylinderGeometry(0.055, 0.055, rodLen, 16),
  MAT.steel
);
rod.position.y = -rodLen / 2;
rod.castShadow = true;
pendulumPivot.add(rod);

/* Topuz: çap 0.34 → 0.46. Kasanın içinde kalır. */
const bobR = 0.46;
const bob = new THREE.Mesh(
  new THREE.SphereGeometry(bobR, 36, 26),
  MAT.goldPolished
);
bob.scale.set(1, 1, 0.52);
bob.position.y = -rodLen + 0.10;
bob.castShadow = true;
pendulumPivot.add(bob);

const bobRing = new THREE.Mesh(new THREE.TorusGeometry(bobR * 1.02, 0.05, 12, 56), MAT.bronze);
bobRing.position.copy(bob.position);
bobRing.castShadow = true;
pendulumPivot.add(bobRing);

const pivotPivot = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.5, 16), MAT.steel);
pivotPivot.rotation.x = Math.PI / 2;
pendulumPivot.add(pivotPivot);

/* ============================================================
   9. POST-PROCESS — bloom + vinyet
   ============================================================ */
const composer = new EffectComposer(renderer);
composer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
composer.setSize(window.innerWidth, window.innerHeight);

composer.addPass(new RenderPass(scene, camera));

const bloom = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  0.22,  // strength — kasa çerçevesi bloom'la erimesin
  0.42,  // radius
  0.96   // threshold — yalnız en parlak noktalar taşar
);
composer.addPass(bloom);

const VignetteShader = {
  uniforms: {
    tDiffuse: { value: null },
    offset: { value: 0.92 },
    darkness: { value: 1.15 },
    tint: { value: new THREE.Color(0x2a1a0c) },
    tintAmount: { value: 0.12 },
  },
  vertexShader: /* glsl */`
    varying vec2 vUv;
    void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }
  `,
  fragmentShader: /* glsl */`
    uniform sampler2D tDiffuse;
    uniform float offset;
    uniform float darkness;
    uniform vec3 tint;
    uniform float tintAmount;
    varying vec2 vUv;
    void main(){
      vec4 c = texture2D(tDiffuse, vUv);
      vec2 uv = (vUv - 0.5) * vec2(offset);
      float d = dot(uv, uv);
      c.rgb *= 1.0 - d * darkness * 0.85;
      c.rgb = mix(c.rgb, tint, tintAmount * smoothstep(0.0, 0.6, d));
      gl_FragColor = c;
    }
  `,
};
const vignette = new ShaderPass(VignetteShader);
composer.addPass(vignette);

composer.addPass(new OutputPass());

/* ============================================================
   10. KAMERA KONTROLÜ
   ============================================================ */
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.copy(CAM_TARGET);
controls.enableDamping = true;
controls.dampingFactor = 0.055;
controls.rotateSpeed = 0.7;
controls.zoomSpeed = 0.75;
controls.minDistance = 4.6;
/* ★28.10: sabit 20, ev mesafesini kesip kasayı panelin altına itiyordu → ev mesafesine göre. */
controls.maxDistance = Math.max(20, CAM_HOME.length() * 1.5);
controls.maxPolarAngle = Math.PI * 0.86;
controls.minPolarAngle = Math.PI * 0.06;
controls.enablePan = false;
controls.autoRotate = false;

/* ============================================================
   11. ZAMAN DURUMU
   ============================================================ */
const timeConfig = {
  speed: 1,          // 1, 0.15, 0, 6
  targetSpeed: 1,
  clockAngle: 0,     // mekanizmanın toplam dönüş fazı (rad)
  simTime: 0,        // simülasyon saati (saniye)
};

/* gerçek saatten başlangıç fazı */
const now = new Date();
const startSeconds =
  now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds() + now.getMilliseconds() / 1000;

/* ============================================================
   12. PATLAT / BİRLEŞTİR
   ============================================================ */
const explodeState = { t: 0, target: 0, active: false };

/* her dişli için merkezden dışa doğru yön */
gears.forEach((g, i) => {
  const dir = new THREE.Vector3(g.base.x, g.base.y, 0);
  if (dir.lengthSq() < 0.01) dir.set(0, 0, 1);
  dir.normalize();
  // katmanına göre z derinliği
  const layerZ = g.base.z * 1.6;
  g.explodeDir.set(dir.x * 1.55, dir.y * 1.55, 0.35 + layerZ);
});

pendulumPivot.userData.explodeDir = new THREE.Vector3(-2.4, -1.0, -1.4);
dialGroup.userData.explodeDir = new THREE.Vector3(0, 0, 7.2);
glassDome.userData.explodeDir = new THREE.Vector3(0, 0, 9.6);

/* ============================================================
   13. ARAYÜZ BAĞLANTISI
   ============================================================ */
const ui = {
  segBtns: [...document.querySelectorAll('.seg-btn[data-speed]')],
  explodeBtn: document.getElementById('explode-btn'),
  explodeTxt: document.getElementById('explode-txt'),
  viewMech: document.getElementById('view-mech'),
  viewDial: document.getElementById('view-dial'),
  resetCam: document.getElementById('reset-cam'),
  tourBtn: document.getElementById('tour-btn'),
  hh: document.getElementById('clock-hh'),
  mm: document.getElementById('clock-mm'),
  ss: document.getElementById('clock-ss'),
  mode: document.getElementById('clock-mode'),
  loader: document.getElementById('loader'),
  fill: document.getElementById('loader-fill'),
  hint: document.getElementById('loader-hint'),
};

function setSpeed(v, btn) {
  timeConfig.targetSpeed = v;
  ui.segBtns.forEach(b => {
    const on = b === btn;
    b.classList.toggle('is-active', on);
    b.setAttribute('aria-pressed', String(on));
  });
  ui.mode.textContent =
    v === 0 ? 'zaman durdu' :
    v === 0.15 ? 'ağır çekim' :
    v === 6 ? 'hızlandırılmış' : 'gerçek zaman';
}

ui.segBtns.forEach(btn => {
  btn.addEventListener('click', () => setSpeed(Number(btn.dataset.speed), btn));
});

function toggleExplode() {
  explodeState.active = !explodeState.active;
  explodeState.target = explodeState.active ? 1 : 0;
  ui.explodeBtn.classList.toggle('is-active', explodeState.active);
  ui.explodeBtn.setAttribute('aria-pressed', String(explodeState.active));
  ui.explodeTxt.textContent = explodeState.active ? 'Birleştir' : 'Parçalara Ayır';

  /* Parçalanmış sahne kadraja sığmaz: kamera mekanizma mesafesine çekilir.
     Kadran modundaysak ve kullanıcı parçalıyorsa kadran görünür kalır —
     o durumda da geniş açı gerekir. */
  const fitDist = sigmaMesafesi(CASE_R * 1.25, 1.05);   // parçalar kasanın ~1.2R ötesine açılır
  flyCamera(
    new THREE.Vector3(CAM_HOME.x, CAM_HOME.y + 0.3, explodeState.active ? fitDist : CAM_HOME.z),
    CAM_TARGET.clone(),
    1.1
  );
}
ui.explodeBtn.addEventListener('click', toggleExplode);

let viewMode = 'mech';
function setView(mode) {
  viewMode = mode;
  const isDial = mode === 'dial';
  ui.viewMech.classList.toggle('is-active', !isDial);
  ui.viewDial.classList.toggle('is-active', isDial);
  ui.viewMech.setAttribute('aria-pressed', String(!isDial));
  ui.viewDial.setAttribute('aria-pressed', String(isDial));

  // kadran modunda sarkaç geriye çekilir, kamera kadrana döner
  if (isDial) {
    /* Kadran: tüm yüzü görecek mesafe — kasa yarıçapından türetilir,
       sabit sayı vermiyoruz ki mercek/kasa değişince kadraj kaymasın.
       mesafe = (yarıçap / tan(fov/2)) * 1.18 pay */
    const dist = sigmaMesafesi(CASE_R, 1.18);
    flyCamera(new THREE.Vector3(0, 0, dist), new THREE.Vector3(0, 0, 0.6));
    bloom.strength = 0.20;
    /* Dolgu ışığı kadranın önüne düşüp sol altta turuncu leke bırakıyordu. */
    fillLight.intensity = 6;
  } else {
    flyCamera(CAM_HOME.clone(), CAM_TARGET.clone());
    bloom.strength = 0.22;
    fillLight.intensity = 26;
  }
}
ui.viewMech.addEventListener('click', () => setView('mech'));
ui.viewDial.addEventListener('click', () => setView('dial'));

/* yumuşak kamera geçişi */
const camAnim = { active: false, t: 0, fromPos: new THREE.Vector3(), toPos: new THREE.Vector3(), fromTgt: new THREE.Vector3(), toTgt: new THREE.Vector3() };
function flyCamera(toPos, toTgt, dur = 1.4) {
  camAnim.active = true;
  camAnim.t = 0;
  camAnim.dur = dur;
  camAnim.fromPos.copy(camera.position);
  camAnim.toPos.copy(toPos);
  camAnim.fromTgt.copy(controls.target);
  camAnim.toTgt.copy(toTgt);
}

ui.resetCam.addEventListener('click', () => {
  tour.active = false;
  flyCamera(CAM_HOME.clone(), CAM_TARGET.clone(), 1.2);
});

/* sinematik tur */
const tour = { active: false, t: 0 };
ui.tourBtn.addEventListener('click', () => {
  tour.active = !tour.active;
  tour.t = 0;
  ui.tourBtn.classList.toggle('is-active', tour.active);
});

/* klavye */
window.addEventListener('keydown', (e) => {
  if (e.code === 'Space') {
    e.preventDefault();
    const stopped = timeConfig.targetSpeed === 0;
    setSpeed(stopped ? 1 : 0, ui.segBtns.find(b => Number(b.dataset.speed) === (stopped ? 1 : 0)));
  } else if (e.key === 'e' || e.key === 'E') {
    toggleExplode();
  } else if (e.key === 'r' || e.key === 'R') {
    ui.resetCam.click();
  } else if (e.key === '1') {
    setSpeed(1, ui.segBtns.find(b => Number(b.dataset.speed) === 1));
  } else if (e.key === '2') {
    setSpeed(0.15, ui.segBtns.find(b => Number(b.dataset.speed) === 0.15));
  } else if (e.key === '3') {
    setSpeed(6, ui.segBtns.find(b => Number(b.dataset.speed) === 6));
  }
});

/* ============================================================
   14. ANİMASYON DÖNGÜSÜ
   ============================================================ */
const clock = new THREE.Clock();


/* patlatma sırasında orijinal konumları koru */
const originalZ = gears.map(g => g.base.z);

function updateGears(dt) {
  // yumuşak hız geçişi
  timeConfig.speed = lerp(timeConfig.speed, timeConfig.targetSpeed, 1 - Math.pow(0.001, dt));

  timeConfig.simTime += dt * timeConfig.speed;
  const secs = startSeconds + timeConfig.simTime;

  /* Dişliler: faz + hız * simülasyon zamanı.
     Grup dönmez (mil/montaj sabit kalır), yalnız çark gövdesi döner. */
  gears.forEach((g) => {
    g.mesh.rotation.z = g.phase + g.omega * timeConfig.simTime;
  });

  // kadran kolları — gerçek zaman
  const hAngle = ((secs / 43200) % 1) * TAU;
  const mAngle = ((secs / 3600) % 1) * TAU;
  const sAngle = ((secs / 60) % 1) * TAU;
  /* Kol şekli +Y yönüne (12) uzanıyor; saat yönü için negatif.
     ★28.10: eskiden "+ Math.PI / 2" ekleniyordu → kollar 90° (3 saat / 15 dk) geride; dijital 00:39 iken
     akrep 9'da, yelkovan 24. dakikadaydı. Rakamlar 12 tepede dizildiği için kaydırma gerekmez. */
  hourHand.rotation.z = -hAngle;
  minuteHand.rotation.z = -mAngle;
  secondHand.rotation.z = -sAngle;

  /* SARKAÇ — KAÇIŞ ÇARKINDAN TÜRETİLİR (bağımsız sinüs değil).
     Gerçek saatte sarkaç kaçış çarkını kilitler; ikisi aynı fazdan beslenir.
     Kaçış çarkı bir tam diş attığında sarkaç bir yarım salınım yapar.
     Böylece mekanizma ile sarkaç gözle de aynı ritimde görünür. */
  const escGear = gears[escapeWheel];
  const escPhase = escGear.mesh.rotation.z;
  /* Kaçış çarkının açısal konumu doğrudan salınım açısına çevrilir:
     diş sayısı kadar adım → tam salınım. Genlik 22° (gerçek sarkaç ~±11°
     ama görsel okunabilirlik için abartıldı).
     ★28.10: çapa (anchor) kaçışında bir tam salınımda bir diş geçer → çarpan
     teeth. Kaçış çarkı artık gerçek oranla döndüğü için periyot ≈ 1,6 sn. */
  const swing = Math.sin(escPhase * escGear.teeth) * 22 * DEG;
  pendulumPivot.rotation.z = swing;

  // dijital okuma
  const hh = Math.floor((secs / 3600) % 24);
  const mm = Math.floor((secs / 60) % 60);
  const ss = Math.floor(secs % 60);
  ui.hh.textContent = String(hh).padStart(2, '0');
  ui.mm.textContent = String(mm).padStart(2, '0');
  ui.ss.textContent = String(ss).padStart(2, '0');
}

function updateExplode(dt) {
  if (Math.abs(explodeState.t - explodeState.target) < 0.0005) {
    explodeState.t = explodeState.target;
  } else {
    explodeState.t = lerp(explodeState.t, explodeState.target, 1 - Math.pow(0.0009, dt * 1.6));
  }
  const t = easeInOut(clamp(explodeState.t, 0, 1));

  gears.forEach((g, i) => {
    g.group.position.x = g.base.x + g.explodeDir.x * t;
    g.group.position.y = g.base.y + g.explodeDir.y * t;
    g.group.position.z = originalZ[i] + g.explodeDir.z * t;
  });

  // NUMEX-DÜZELTME (2026-10-27): Her karede sarkaç z'si -1.1'e sabitleniyordu; kurulumda verilen 0.74 değeri eziliyor ve sarkaç görünmüyordu.
  /* DÜZELTME (kök neden): bu satır her karede sarkacın z'sini -1.1'e
     sabitliyordu — kurulumda verilen görünür derinlik (0.74) ilk karede
     eziliyor, sarkaç dişli treninin en arkasına düşüyordu (ekranda yok).
     Artık kurulumdaki z korunuyor, yalnız patlatma ofseti ekleniyor. */
  pendulumPivot.position.z = PENDULUM_Z + pendulumPivot.userData.explodeDir.z * t;
  pendulumPivot.position.x = pendulumPivot.userData.explodeDir.x * t;

  dialGroup.position.z = 0.92 + dialGroup.userData.explodeDir.z * t;
  glassDome.position.z = 0.98 + glassDome.userData.explodeDir.z * t;
  glassDome.scale.setScalar(1 + t * 0.06);

  /* Ayrıkken çarklar hafifçe kendi eksenlerinde yatar (canlı görünür). */
  gears.forEach((g) => {
    g.mesh.rotation.y = t * 0.22;
  });

  /* Kadran yalnızca kadran modunda görünür. Mekanizma modunda
     parçalarken kadran ekranı kapatmasın — yoksa kullanıcı çarkları
     kolların arkasından izlemek zorunda kalır.
     Kadran modunda ise dişli tarlası tamamen gizlenir: çarklar kadran
     yüzünü kirletiyor, rakamların okunurluğunu düşürüyordu. */
  const dialMode = viewMode === 'dial';
  dialGroup.visible = dialMode;
  gearField.visible = !dialMode;
  pendulumPivot.visible = !dialMode;   // sarkaç topuzu kadranın önüne sızıyordu
  gearField.position.z = -0.15;
}

function updateCamera(dt) {
  /* ★28.10: sis yoğunluğu sabit 0.028 iken kamera 20 biriminden uzaklaşınca (dar ekran, parçalanmış görünüm)
     sahne karanlığa gömülüyordu — yoğunluk kamera uzaklığıyla ölçeklenir, 20 birime kadar eskisiyle aynı. */
  scene.fog.density = 0.028 * Math.min(1, 20 / camera.position.distanceTo(controls.target));
  if (camAnim.active) {
    camAnim.t += dt / camAnim.dur;
    const t = easeInOut(clamp(camAnim.t, 0, 1));
    camera.position.lerpVectors(camAnim.fromPos, camAnim.toPos, t);
    controls.target.lerpVectors(camAnim.fromTgt, camAnim.toTgt, t);
    if (camAnim.t >= 1) camAnim.active = false;
  }

  if (tour.active && !camAnim.active) {
    tour.t += dt * 0.18;
    const r = 13.0 + Math.sin(tour.t * 0.7) * 2.2;
    const a = tour.t;
    camera.position.set(
      Math.cos(a) * r,
      1.6 + Math.sin(tour.t * 0.9) * 2.6,
      Math.sin(a) * r
    );
    controls.target.lerp(new THREE.Vector3(0, 0.2, 0), 0.05);
  }

  controls.update();
}

function animate() {
  const dt = Math.min(clock.getDelta(), 0.05);
  updateGears(dt);
  updateExplode(dt);
  updateCamera(dt);
  composer.render();
  requestAnimationFrame(animate);

}

/* ============================================================
   15. BOYUTLANDIRMA
   ============================================================ */
function onResize() {
  const w = window.innerWidth, h = window.innerHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
  composer.setSize(w, h);

  /* Ekran oranı değişti → ev kamerası mesafesi yeniden hesaplanır
     (dikey ekranda kasa kesilmesin). Kullanıcı sahneyi döndürdüyse
     kamerasına dokunulmaz, yalnız referans noktası güncellenir. */
  const near = camera.position.distanceTo(controls.target);
  const oldDist = CAM_HOME.length();
  resetCameraHome(false);
  const newDist = CAM_HOME.length();
  controls.maxDistance = Math.max(20, newDist * 1.5);
  if (Math.abs(near - oldDist) < 0.6 && !camAnim.active) {
    const dir = camera.position.clone().sub(controls.target).normalize();
    camera.position.copy(controls.target).addScaledVector(dir, newDist);
  }
}
window.addEventListener('resize', onResize);

/* ============================================================
   16. YÜKLEYİCİ
   ============================================================ */
function buildLoaderGears() {
  const g1 = document.getElementById('lg1');
  const g2 = document.getElementById('lg2');
  const gearPath = (teeth, r) => {
    let d = '';
    for (let i = 0; i < teeth; i++) {
      const a = (i / teeth) * TAU;
      const step = TAU / teeth;
      const pts = [
        [a - step * 0.3, r * 0.86], [a - step * 0.16, r], [a + step * 0.16, r], [a + step * 0.3, r * 0.86],
      ];
      pts.forEach(([ang, rad], k) => {
        const x = 50 + Math.cos(ang) * rad;
        const y = 50 + Math.sin(ang) * rad;
        d += (i === 0 && k === 0 ? 'M' : 'L') + x.toFixed(2) + ' ' + y.toFixed(2) + ' ';
      });
    }
    return d + 'Z';
  };
  if (g1) g1.innerHTML = `<path d="${gearPath(12, 42)}" fill-rule="evenodd"/><circle cx="50" cy="50" r="12" fill="#0a0805"/>`;
  if (g2) g2.innerHTML = `<path d="${gearPath(9, 40)}" fill-rule="evenodd"/><circle cx="50" cy="50" r="11" fill="#0a0805"/>`;
}

const loaderSteps = [
  [10, 'Mekanizma kuruluyor…'],
  [35, 'Dişliler birbirine geçiriliyor…'],
  [60, 'Kadran ve kollar yerleştiriliyor…'],
  [82, 'Işıklar ayarlanıyor…'],
  [100, 'Hazır'],
];

function runLoader(onDone) {
  let i = 0;
  const tick = () => {
    if (i >= loaderSteps.length) {
      setTimeout(() => {
        ui.loader.classList.add('is-done');
        onDone();
      }, 380);
      return;
    }
    const [pct, txt] = loaderSteps[i++];
    ui.fill.style.width = pct + '%';
    ui.hint.textContent = txt;
    setTimeout(tick, 240);
  };
  tick();
}

/* ============================================================
   17. BAŞLAT
   ============================================================ */
buildLoaderGears();
animate();

runLoader(() => {
  // girişte sinematik yaklaşma: uzaktan sahneye
  camera.position.set(0, 4.0, 24);
  flyCamera(CAM_HOME.clone(), CAM_TARGET.clone(), 2.6);
});

/* vitrin bilgisi (Market meta) */
window.NUMEX_CLOCKWORK = {
  name: 'NUMEX CLOCKWORK',
  slogan: 'Zamanın İçini Gör',
  gears: gears.length,
  version: '1.0.0',
  ready: true,
};
