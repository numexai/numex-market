// Sahne: render, masa, platform, ışıklar, atmosferler, hava parçacıkları.
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { ahsapDoku, cimDoku, tasDoku, suUniformlari, haleDoku } from './materials.js';

export const ATMOSFERLER = {
  gunduz: {
    ad: 'Gündüz', gokUst: '#8fc6f0', gokAlt: '#e8f2f7', sis: '#cfe2ee', sisYog: 0.012,
    gunRenk: '#fff3dd', gunGuc: 3.3, gunPoz: [6, 10, 5], dolgu: 0.42, gokIsik: '#cfe8ff', yerIsik: '#7a6a52',
    pozlama: 1.02, gece: 0, parçacik: null,
  },
  gunbatimi: {
    ad: 'Gün batımı', gokUst: '#3b4a78', gokAlt: '#f5a15c', sis: '#e2a074', sisYog: 0.016,
    gunRenk: '#ffb066', gunGuc: 3.1, gunPoz: [-7.5, 2.4, -3.5], dolgu: 0.42, gokIsik: '#ffc7a0', yerIsik: '#4a3a55',
    pozlama: 1.06, gece: 0.55, parçacik: null,
  },
  gece: {
    ad: 'Gece', gokUst: '#070c1d', gokAlt: '#1d2a4d', sis: '#101a33', sisYog: 0.02,
    gunRenk: '#8fa8de', gunGuc: 0.62, gunPoz: [-4, 7, -6], dolgu: 0.30, gokIsik: '#5a76b4', yerIsik: '#161d33',
    pozlama: 1.26, gece: 1, parçacik: null,
  },
  yagmur: {
    ad: 'Yağmur', gokUst: '#4e5a68', gokAlt: '#8d98a3', sis: '#7b8794', sisYog: 0.03,
    gunRenk: '#cdd8e2', gunGuc: 1.05, gunPoz: [3, 9, 4], dolgu: 0.34, gokIsik: '#9fb0c0', yerIsik: '#3e4348',
    pozlama: 1.0, gece: 0.28, parçacik: 'yagmur',
  },
  kar: {
    ad: 'Kar', gokUst: '#9fb3c9', gokAlt: '#e6eef6', sis: '#d3e0ea', sisYog: 0.022,
    gunRenk: '#eaf3ff', gunGuc: 1.9, gunPoz: [5, 9, -3], dolgu: 0.55, gokIsik: '#dfeaff', yerIsik: '#8b98a5',
    pozlama: 1.08, gece: 0.2, parçacik: 'kar',
  },
};

function gokMalzemesi() {
  return new THREE.ShaderMaterial({
    uniforms: {
      uUst: { value: new THREE.Color('#8fc6f0') },
      uAlt: { value: new THREE.Color('#e8f2f7') },
      uIsik: { value: new THREE.Vector3(0.5, 0.8, 0.5) },
      uGece: { value: 0 },
    },
    side: THREE.BackSide, depthWrite: false,
    vertexShader: `varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: /* glsl */`
      uniform vec3 uUst; uniform vec3 uAlt; uniform vec3 uIsik; uniform float uGece; varying vec3 vP;
      void main(){
        vec3 d = normalize(vP);
        float h = clamp(d.y*0.5+0.5, 0.0, 1.0);
        vec3 renk = mix(uAlt, uUst, pow(h, 0.85));
        // ufkun altı: stüdyo zemini — diorama havada yüzmesin, masaya otursun
        float studio = smoothstep(0.035, -0.10, d.y);
        renk = mix(renk, vec3(0.055, 0.060, 0.072), studio);
        float gunes = pow(max(dot(d, normalize(uIsik)), 0.0), 8.0);
        renk += vec3(1.0,0.86,0.62) * gunes * 0.33;
        float yildiz = 0.0;
        if (uGece > 0.4) {
          vec3 p = floor(d * 220.0);
          float n = fract(sin(dot(p, vec3(12.9898,78.233,45.164))) * 43758.5453);
          yildiz = smoothstep(0.9975, 1.0, n) * smoothstep(0.0, 0.35, d.y);
        }
        renk += vec3(yildiz) * uGece;
        gl_FragColor = vec4(renk, 1.0);
      }`,
  });
}

function parcacikDoku() {
  const c = document.createElement('canvas');
  c.width = c.height = 32;
  const x = c.getContext('2d');
  const g = x.createRadialGradient(16, 16, 0, 16, 16, 16);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.5, 'rgba(255,255,255,.65)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = g; x.fillRect(0, 0, 32, 32);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function havaParcaciklari(tur) {
  const adet = tur === 'yagmur' ? 2600 : 1800;
  const geo = new THREE.BufferGeometry();
  const konum = new Float32Array(adet * 3);
  const hiz = new Float32Array(adet);
  for (let i = 0; i < adet; i++) {
    konum[i * 3] = (Math.random() - 0.5) * 12;
    konum[i * 3 + 1] = Math.random() * 8;
    konum[i * 3 + 2] = (Math.random() - 0.5) * 12;
    hiz[i] = tur === 'yagmur' ? 3.2 + Math.random() * 2.4 : 0.32 + Math.random() * 0.4;
  }
  geo.setAttribute('position', new THREE.BufferAttribute(konum, 3));
  const m = new THREE.PointsMaterial({
    size: tur === 'yagmur' ? 0.035 : 0.075,
    map: parcacikDoku(),
    color: tur === 'yagmur' ? 0xbfd4e4 : 0xffffff,
    transparent: true,
    opacity: tur === 'yagmur' ? 0.55 : 0.92,
    depthWrite: false,
    sizeAttenuation: true,
  });
  const p = new THREE.Points(geo, m);
  p.frustumCulled = false;
  p.userData = { tur, hiz };
  return p;
}

export function sahneKur(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.02;

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0xcfe2ee, 0.012);

  const camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.1, 200);
  const kameraBaslangic = new THREE.Vector3(7.6, 6.4, 8.6);
  const hedefBaslangic = new THREE.Vector3(0, 0.35, 0);
  camera.position.copy(kameraBaslangic);

  const orbit = new OrbitControls(camera, renderer.domElement);
  orbit.target.copy(hedefBaslangic);
  orbit.enableDamping = true;
  orbit.dampingFactor = 0.062;
  orbit.minDistance = 3.2;
  orbit.maxDistance = 24;
  orbit.maxPolarAngle = Math.PI * 0.495;
  orbit.minPolarAngle = 0.12;
  orbit.zoomSpeed = 0.85;
  orbit.panSpeed = 0.7;
  orbit.screenSpacePanning = false;
  orbit.update();

  /* ---- ışıklar ---- */
  const gokIsik = new THREE.HemisphereLight(0xcfe8ff, 0x7a6a52, 0.55);
  scene.add(gokIsik);

  const gunes = new THREE.DirectionalLight(0xfff3dd, 2.5);
  gunes.position.set(6, 10, 5);
  gunes.castShadow = true;
  gunes.shadow.mapSize.set(2048, 2048);
  gunes.shadow.camera.near = 1;
  gunes.shadow.camera.far = 32;
  gunes.shadow.camera.left = -7.5;
  gunes.shadow.camera.right = 7.5;
  gunes.shadow.camera.top = 7.5;
  gunes.shadow.camera.bottom = -7.5;
  gunes.shadow.bias = -0.0006;
  gunes.shadow.normalBias = 0.022;
  gunes.shadow.radius = 3;
  scene.add(gunes);
  scene.add(gunes.target);

  const dolgu = new THREE.DirectionalLight(0xbfd8ff, 0.5);
  dolgu.position.set(-7, 4.5, -5);
  scene.add(dolgu);

  const tepe = new THREE.DirectionalLight(0xffe6c0, 0.35);
  tepe.position.set(0, 8, -7);
  scene.add(tepe);

  /* ---- gök ---- */
  const gok = new THREE.Mesh(new THREE.SphereGeometry(80, 32, 20), gokMalzemesi());
  gok.frustumCulled = false;
  scene.add(gok);

  /* ---- masa + platform ---- */
  const masaGrup = new THREE.Group();
  scene.add(masaGrup);

  const masaMalzeme = new THREE.MeshStandardMaterial({
    map: ahsapDoku(), color: 0x8f6a48, roughness: 0.62, metalness: 0.02,
  });
  masaMalzeme.map.repeat.set(2.2, 1.6);
  const masa = new THREE.Mesh(new THREE.BoxGeometry(19, 0.55, 13.5), masaMalzeme);
  masa.position.set(0, -1.12, 0);
  masa.receiveShadow = true;
  masaGrup.add(masa);

  // masa kenar pervazı (kaliteli mobilya hissi)
  const pervaz = new THREE.MeshStandardMaterial({ color: 0x6a4c33, roughness: 0.55, metalness: 0.03 });
  masaGrup.add(new THREE.Mesh(new THREE.BoxGeometry(19.25, 0.1, 13.75), pervaz).translateY(-0.87));

  // diorama kaidesi (ceviz)
  const kaide = new THREE.MeshStandardMaterial({
    map: ahsapDoku(), color: 0x6f4a2c, roughness: 0.5, metalness: 0.04,
  });
  kaide.map.repeat.set(1.4, 1.4);
  const taban = new THREE.Mesh(new THREE.BoxGeometry(9.5, 0.62, 9.5), kaide);
  taban.position.y = -0.44;
  taban.castShadow = true; taban.receiveShadow = true;
  masaGrup.add(taban);

  // çim yüzeyi (dünya zemini y=0)
  const cimM = new THREE.MeshStandardMaterial({ map: cimDoku(), color: 0x9dbb7e, roughness: 0.95 });
  cimM.map.repeat.set(4, 4);
  const cim = new THREE.Mesh(new THREE.BoxGeometry(9.0, 0.16, 9.0), cimM);
  cim.position.y = -0.08;
  cim.receiveShadow = true;
  masaGrup.add(cim);

  // görünmez yer düzlemi (raycast)
  const zeminDuzlem = new THREE.Mesh(
    new THREE.PlaneGeometry(9.0, 9.0),
    new THREE.MeshBasicMaterial({ visible: false })
  );
  zeminDuzlem.rotation.x = -Math.PI / 2;
  zeminDuzlem.position.y = 0.001;
  scene.add(zeminDuzlem);

  /* ---- ızgara (hizalama göstergesi) ---- */
  const izgara = new THREE.GridHelper(9, 18, 0xffffff, 0xffffff);
  izgara.material.opacity = 0.038;
  izgara.material.transparent = true;
  izgara.position.y = 0.006;
  izgara.visible = false;
  scene.add(izgara);

  /* ---- durum ---- */
  const ctx = {
    renderer, scene, camera, orbit, gunes, dolgu, gokIsik, tepe, gok, izgara,
    zeminDuzlem, masaGrup, kaide, taban, cim,
    atmosfer: 'gunduz',
    hava: null,
    kameraBaslangic, hedefBaslangic,
  };

  let havaNesne = null;

  ctx.setAtmosfer = (ad) => {
    const a = ATMOSFERLER[ad] || ATMOSFERLER.gunduz;
    ctx.atmosfer = ad;
    const u = ctx.gok.material.uniforms;
    u.uUst.value.set(a.gokUst);
    u.uAlt.value.set(a.gokAlt);
    u.uGece.value = a.gece;
    const yon = new THREE.Vector3(...a.gunPoz).normalize();
    u.uIsik.value.copy(yon);

    gunes.color.set(a.gunRenk);
    gunes.intensity = a.gunGuc;
    gunes.position.set(...a.gunPoz);
    gunes.target.position.set(0, 0, 0);
    gokIsik.color.set(a.gokIsik);
    gokIsik.groundColor.set(a.yerIsik);
    gokIsik.intensity = a.dolgu;
    dolgu.intensity = a.dolgu * 0.42;
    tepe.intensity = a.dolgu * 0.5;
    scene.fog.color.set(a.sis);
    scene.fog.density = a.sisYog;
    renderer.toneMappingExposure = a.pozlama;

    // kar: zemini ve kaideyi soğut
    if (a.parçacik === 'kar') {
      ctx.cim.material.color.set(0xdfe9ef);
      ctx.cim.material.map = null; ctx.cim.material.needsUpdate = true;
    } else {
      ctx.cim.material.color.set(0x9dbb7e);
      if (!ctx.cim.material.map) { ctx.cim.material.map = cimDoku(); ctx.cim.material.needsUpdate = true; }
    }

    if (havaNesne) { scene.remove(havaNesne); havaNesne.geometry.dispose(); havaNesne = null; }
    if (a.parçacik) { havaNesne = havaParcaciklari(a.parçacik); scene.add(havaNesne); }
    ctx.hava = a.parçacik;
    return a;
  };

  ctx.setAtmosfer('gunduz');

  ctx.kameraSifirla = () => {
    camera.position.copy(kameraBaslangic);
    orbit.target.copy(hedefBaslangic);
    orbit.update();
  };

  ctx.boyutAyarla = () => {
    const w = window.innerWidth, h = window.innerHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
  };

  ctx.guncelle = (dt, t) => {
    suUniformlari.forEach(u => { if (u.uTime) u.uTime.value = t; });
    orbit.update();
    if (havaNesne) {
      const p = havaNesne.geometry.attributes.position;
      const hz = havaNesne.userData.hiz;
      const yagmur = havaNesne.userData.tur === 'yagmur';
      for (let i = 0; i < p.count; i++) {
        let y = p.getY(i) - hz[i] * dt * (yagmur ? 1 : 1);
        if (yagmur) p.setX(i, p.getX(i) + dt * 0.35);
        else p.setX(i, p.getX(i) + Math.sin(t * 0.7 + i) * dt * 0.18);
        if (y < -0.6) {
          y = 7 + Math.random() * 2;
          p.setX(i, (Math.random() - 0.5) * 12);
          p.setZ(i, (Math.random() - 0.5) * 12);
        }
        p.setY(i, y);
      }
      p.needsUpdate = true;
    }
  };

  return ctx;
}
