// Numex Kozmik Çekirdek — Aşama 1
// Üç boyutlu, gerçek parçacık geometrisiyle kurulmuş tek bir enerji çekirdeği.
// Dış bağımlılık: sadece three.js (vendor/three.module.js). Ek katman yok.

import * as THREE from './vendor/three.module.js';

// ---------------------------------------------------------------------------
// Sahne kurulumu
// ---------------------------------------------------------------------------
const kanvas = document.getElementById('sahne');
const durumEtiketi = document.getElementById('durum');

const renderer = new THREE.WebGLRenderer({
  canvas: kanvas,
  antialias: true,
  alpha: false,
  powerPreference: 'high-performance'
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x01030a, 1);

const sahne = new THREE.Scene();
sahne.fog = new THREE.FogExp2(0x01030a, 0.055);

const kamera = new THREE.PerspectiveCamera(
  52,
  window.innerWidth / window.innerHeight,
  0.1,
  100
);
kamera.position.set(0, 0.6, 9.4);

// ---------------------------------------------------------------------------
// Parçacık sayısı — performansa göre ölçeklenir
// ---------------------------------------------------------------------------
const dokunmatikYaDaDar = window.innerWidth < 760;
let PARCACIK_SAYISI = dokunmatikYaDaDar ? 9000 : 18000;

// ---------------------------------------------------------------------------
// Çekirdek verisi
// ---------------------------------------------------------------------------
// Her parçacık: birim küre üzerinde yön (yön), taban yarıçap, kişisel faz,
// dönüş hızı, titreşim genliği. Hepsi baştan üretilir, kare içinde hesaplanmaz.
const yonler = new Float32Array(PARCACIK_SAYISI * 3);
const renkler = new Float32Array(PARCACIK_SAYISI * 3);
const boyutlar = new Float32Array(PARCACIK_SAYISI);
const fazlar = new Float32Array(PARCACIK_SAYISI);
const hizlar = new Float32Array(PARCACIK_SAYISI);
const genlikler = new Float32Array(PARCACIK_SAYISI);
const disariItki = new Float32Array(PARCACIK_SAYISI); // tıklama anında 0 → 1 → 0
const tabanYaricap = new Float32Array(PARCACIK_SAYISI);

const geciciRenk = new THREE.Color();

function uret() {
  for (let i = 0; i < PARCACIK_SAYISI; i++) {
    // Eş dağılımlı rastgele birim vektör
    const u = Math.random() * 2 - 1;
    const teta = Math.random() * Math.PI * 2;
    const s = Math.sqrt(1 - u * u);
    const x = s * Math.cos(teta);
    const y = u;
    const z = s * Math.sin(teta);

    yonler[i * 3] = x;
    yonler[i * 3 + 1] = y;
    yonler[i * 3 + 2] = z;

    // Kabuk içinde kademeli dağılım: çoğu yüzeyde, bir kısmı içeride
    const derinlik = Math.pow(Math.random(), 0.65); // 0 = merkez, 1 = yüzey
    const yaricap = 2.35 + derinlik * 0.6;
    tabanYaricap[i] = yaricap;

    // Turkuaz ↔ mavi arası renk: derinlik arttıkça maviye kayar
    const karisim = Math.random() * 0.65 + derinlik * 0.35;
    geciciRenk.setHSL(
      THREE.MathUtils.lerp(0.50, 0.42, karisim),   // mavi → turkuaz
      THREE.MathUtils.lerp(0.85, 1.0, derinlik),
      THREE.MathUtils.lerp(0.42, 0.72, Math.random())
    );
    renkler[i * 3] = geciciRenk.r;
    renkler[i * 3 + 1] = geciciRenk.g;
    renkler[i * 3 + 2] = geciciRenk.b;

    boyutlar[i] = 0.045 + Math.random() * 0.075;
    fazlar[i] = Math.random() * Math.PI * 2;
    hizlar[i] = 0.35 + Math.random() * 0.9;
    genlikler[i] = 0.035 + Math.random() * 0.11;
    disariItki[i] = 0;
  }
}
uret();

const geometri = new THREE.BufferGeometry();
const konumlar = new Float32Array(PARCACIK_SAYISI * 3);
geometri.setAttribute('position', new THREE.BufferAttribute(konumlar, 3));
geometri.setAttribute('color', new THREE.BufferAttribute(renkler, 3));
geometri.setAttribute('size', new THREE.BufferAttribute(boyutlar, 1));

// Yuvarlak, yumuşak kenarlı parçacık dokusu — harici dosya yok, kodla üretiliyor
function yumusakDoku() {
  const boy = 64;
  const c = document.createElement('canvas');
  c.width = c.height = boy;
  const g = c.getContext('2d');
  const gradyan = g.createRadialGradient(boy / 2, boy / 2, 0, boy / 2, boy / 2, boy / 2);
  gradyan.addColorStop(0, 'rgba(255,255,255,1)');
  gradyan.addColorStop(0.28, 'rgba(255,255,255,0.85)');
  gradyan.addColorStop(0.6, 'rgba(255,255,255,0.22)');
  gradyan.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gradyan;
  g.fillRect(0, 0, boy, boy);
  const doku = new THREE.CanvasTexture(c);
  doku.colorSpace = THREE.SRGBColorSpace;
  return doku;
}

const malzeme = new THREE.PointsMaterial({
  size: 0.12,
  map: yumusakDoku(),
  vertexColors: true,
  transparent: true,
  opacity: 0.95,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
  sizeAttenuation: true
});

const noktalar = new THREE.Points(geometri, malzeme);
noktalar.name = 'cekirdek';
sahne.add(noktalar);

// Çekirdek grubu: dönüş ve fare eğilmesi burada
const cekirdek = new THREE.Group();
cekirdek.add(noktalar);
sahne.add(cekirdek);

// Parlak merkez: derinlik hissi için hafif bir hale
const haleDoku = yumusakDoku();
const hale = new THREE.Sprite(new THREE.SpriteMaterial({
  map: haleDoku,
  color: 0x1aa4c8,
  transparent: true,
  opacity: 0.42,
  blending: THREE.AdditiveBlending,
  depthWrite: false
}));
hale.scale.set(6.4, 6.4, 1);
sahne.add(hale);

// ---------------------------------------------------------------------------
// Fare / dokunma girdisi
// ---------------------------------------------------------------------------
const fare = new THREE.Vector2(0, 0);       // -1..1
const fareYumusak = new THREE.Vector2(0, 0);

window.addEventListener('pointermove', (e) => {
  fare.x = (e.clientX / window.innerWidth) * 2 - 1;
  fare.y = (e.clientY / window.innerHeight) * 2 - 1;
}, { passive: true });

// ---------------------------------------------------------------------------
// Tıklama: parçacıklar dışa yayılır, yumuşakça geri döner
// ---------------------------------------------------------------------------
const raycaster = new THREE.Raycaster();
const isaretci = new THREE.Vector2();
const kirilma = [];   // tıklama dalgaları: { t, x, y, z }
let kirilmaBas = 0;

function patlat(x, y) {
  isaretci.x = (x / window.innerWidth) * 2 - 1;
  isaretci.y = -(y / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(isaretci, kamera);

  // Yönü kameradan bakan bir ışınla kesişim noktasına doğru al
  const nokta = new THREE.Vector3();
  raycaster.ray.at(8.4, nokta);
  nokta.normalize();

  kirilma.push({
    baslangic: performance.now(),
    x: nokta.x,
    y: nokta.y,
    z: nokta.z
  });
  if (kirilma.length > 4) kirilma.shift();

  durumEtiketi.textContent = 'ENERJİ BOŞALDI';
  durumEtiketi.classList.add('aktif');
  setTimeout(() => {
    durumEtiketi.textContent = 'DENGE';
    durumEtiketi.classList.remove('aktif');
  }, 1400);
}

kanvas.addEventListener('pointerdown', (e) => patlat(e.clientX, e.clientY));

// ---------------------------------------------------------------------------
// Animasyon döngüsü — her karede geçen zamana bağlı hesap
// ---------------------------------------------------------------------------
const saat = new THREE.Clock();
let sonKare = performance.now();
let fps = 60;
const konumVek = new THREE.Vector3();
const titreşimHatasi = new Float32Array(PARCACIK_SAYISI);

function caprazHesapla(ds, dx, dy, dz, index) {
  // Parçacığın yönü ile tıklama yönüne dik bir düzlemde kıvrım
  const d = yonler[index * 3] * dx + yonler[index * 3 + 1] * dy + yonler[index * 3 + 2] * dz;
  return (d + 1) * 0.5; // 0..1, tıklama yönüne yakın parçacıklar 1
}

function kare() {
  requestAnimationFrame(kare);

  const suan = performance.now();
  const gecenMs = Math.min(suan - sonKare, 50);
  sonKare = suan;
  const delta = gecenMs / 1000;
  const t = saat.getElapsedTime();

  // FPS ölçümü (ortalama)
  fps = fps * 0.92 + (1000 / Math.max(gecenMs, 1)) * 0.08;

  // Fare eğilmesi yumuşatılır
  fareYumusak.x += (fare.x - fareYumusak.x) * Math.min(1, delta * 4);
  fareYumusak.y += (fare.y - fareYumusak.y) * Math.min(1, delta * 4);

  // Yavaş kendi ekseni etrafında dönüş + fare salınımı
  cekirdek.rotation.y += delta * 0.16;
  cekirdek.rotation.x = Math.sin(t * 0.23) * 0.16 + fareYumusak.y * 0.10;
  cekirdek.rotation.z = Math.cos(t * 0.19) * 0.06;

  // Çekirdek grubu hafifçe fareye doğru eğilir
  cekirdek.position.x = fareYumusak.x * 0.12;
  cekirdek.position.y = -fareYumusak.y * 0.12;

  // Hale nabzı
  const nabiz = 1 + Math.sin(t * 1.4) * 0.045;
  hale.scale.set(6.4 * nabiz, 6.4 * nabiz, 1);
  hale.material.opacity = 0.30 + Math.sin(t * 1.4) * 0.08;

  // Parçacıkların yarıçapını ve titreşimini hesapla
  // NUMEX-DÜZELTME (2026-11-26): Dalgalar döngü başında temizleniyordu ama iç döngüde kirilma[k].baslangic okunurken dizi aynı karede boşalabiliyordu; süre kontrolünü tek yerde ve döngüden önce yaparak kök nedeni kaldırdım.
  const sure = 2400;          // dalga ömrü (ms)

  // Süresi dolan dalgalar önce atılır; sonra güncel liste ile hesap yapılır.
  // (Eski kod: süresi dolan dalgalar döngü içinde okunuyordu → undefined hatası.)
  while (kirilma.length > 0 && suan - kirilma[0].baslangic > sure) {
    kirilma.shift();
  }

  for (let i = 0; i < PARCACIK_SAYISI; i++) {
    const xi = i * 3;
    const dx = yonler[xi];
    const dy = yonler[xi + 1];
    const dz = yonler[xi + 2];

    // Yumuşak titreşim: iki farklı sinüs üst üste
    const faz = fazlar[i];
    const hiz = hizlar[i];
    const genlik = genlikler[i];
    titreşimHatasi[i] =
      Math.sin(t * hiz + faz) * genlik +
      Math.sin(t * hiz * 1.71 + faz * 1.3) * genlik * 0.45;

    // Tıklama dalgaları
    let itki = 0;
    if (kirilma.length > 0) {
      for (let k = 0; k < kirilma.length; k++) {
        const dalga = kirilma[k];
        const yas = suan - dalga.baslangic;
        if (yas < 0 || yas > sure) continue;
        // Dalga ömrü boyunca büyüyüp sönen bir zarf
        const normal = yas / sure;
        const zarf = Math.sin(Math.min(normal, 1) * Math.PI); // 0 → 1 → 0
        const huzme = caprazHesapla(suan, dalga.x, dalga.y, dalga.z, i);
        itki += zarf * (0.35 + huzme * 1.2);
      }
    }

    const yaricap = tabanYaricap[i] + titreşimHatasi[i] + itki * 1.35;
    konumlar[xi] = dx * yaricap;
    konumlar[xi + 1] = dy * yaricap;
    konumlar[xi + 2] = dz * yaricap;
  }

  geometri.attributes.position.needsUpdate = true;

  // Fareye doğru hafif kamera göz kayması
  kamera.position.x += (fareYumusak.x * 0.45 - kamera.position.x) * Math.min(1, delta * 2.2);
  kamera.position.y += (0.6 - fareYumusak.y * 0.45 - kamera.position.y) * Math.min(1, delta * 2.2);
  kamera.lookAt(0, 0, 0);

  renderer.render(sahne, kamera);
}

// ---------------------------------------------------------------------------
// Ekran boyutu değişimi
// ---------------------------------------------------------------------------
function boyutlandir() {
  const g = window.innerWidth;
  const y = window.innerHeight;
  kamera.aspect = g / y;
  kamera.updateProjectionMatrix();
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(g, y);
  // Dar ekranlarda çekirdek sığsın diye kamera biraz geri çekilir
  kamera.position.z = g < 620 ? 12.2 : (g < 900 ? 10.6 : 9.4);
}
window.addEventListener('resize', boyutlandir);
boyutlandir();

// ---------------------------------------------------------------------------
// İlk kare: konumları doldur ve sahneyi başlat
// ---------------------------------------------------------------------------
for (let i = 0; i < PARCACIK_SAYISI; i++) {
  const xi = i * 3;
  const r = tabanYaricap[i];
  konumlar[xi] = yonler[xi] * r;
  konumlar[xi + 1] = yonler[xi + 1] * r;
  konumlar[xi + 2] = yonler[xi + 2] * r;
}
geometri.attributes.position.needsUpdate = true;
geometri.computeBoundingSphere();

durumEtiketi.textContent = 'DENGE';
requestAnimationFrame(kare);

// Test ve ölçüm için dışa açılan kapı (yalnız okuma amaçlı)
window.__numexCekirdek = {
  get parcaSayisi() { return PARCACIK_SAYISI; },
  get fps() { return Math.round(fps); },
  get donus() { return cekirdek.rotation.y; },
  get itkiSayisi() { return kirilma.length; },
  get mesafe() {
    let toplam = 0;
    for (let i = 0; i < PARCACIK_SAYISI; i++) {
      const xi = i * 3;
      const x = konumlar[xi], y = konumlar[xi + 1], z = konumlar[xi + 2];
      toplam += Math.sqrt(x * x + y * y + z * z);
    }
    return toplam / PARCACIK_SAYISI;
  },
  patlat
};
