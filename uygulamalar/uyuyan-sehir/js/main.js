// Dream City — ana motor
// Sahne, kamera, tıklama, sinematik tur, otomatik gün döngüsü, ses.

import * as THREE from '../vendor/three.module.js';
import { OrbitControls } from '../vendor/jsm/controls/OrbitControls.js';
import { EffectComposer } from '../vendor/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from '../vendor/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from '../vendor/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from '../vendor/jsm/postprocessing/OutputPass.js';

import { Sehir } from './city.js';
import { Hareket } from './motion.js';
import { Atmosfer, ZAMANLAR } from './atmosfer.js';
import { aralik, rast } from './utils.js';

const kanvas = document.getElementById('scene');

// ---------- hata yakalayıcı ----------
function hataGoster(mesaj) {
  const kutu = document.getElementById('hata');
  kutu.textContent = mesaj;
  kutu.classList.remove('gizli');
  document.getElementById('intro')?.classList.add('kalkti');
}
window.addEventListener('error', (e) => {
  if (e.message) hataGoster('Bir sorun oluştu: ' + e.message);
});

// ---------- sahneler ----------
const sahne = new THREE.Scene();
const kamera = new THREE.PerspectiveCamera(38, window.innerWidth / window.innerHeight, 0.1, 1200);
kamera.position.set(34, 28, 38);

const renderer = new THREE.WebGLRenderer({
  canvas: kanvas,
  antialias: true,
  powerPreference: 'high-performance',
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
renderer.outputColorSpace = THREE.SRGBColorSpace;

// ---------- kamera kontrolü ----------
const kontrol = new OrbitControls(kamera, kanvas);
kontrol.target.set(0, 2, 0);
kontrol.enableDamping = true;
kontrol.dampingFactor = 0.055;
kontrol.minDistance = 16;
kontrol.maxDistance = 135;
kontrol.maxPolarAngle = Math.PI * 0.44;
kontrol.minPolarAngle = 0.35;
kontrol.enablePan = true;
kontrol.panSpeed = 0.7;
kontrol.rotateSpeed = 0.62;
kontrol.zoomSpeed = 0.85;
kontrol.autoRotate = false;
kontrol.autoRotateSpeed = 0.22;
kontrol.update();

// ---------- bloom (gece ışıkları için) ----------
const besteci = new EffectComposer(renderer);
besteci.addPass(new RenderPass(sahne, kamera));
const bloom = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  0.55,
  0.55,
  0.72
);
besteci.addPass(bloom);
besteci.addPass(new OutputPass());
// Not: Three.js Renderer nesnesinde userData yok — bloom'u kendi değişkenimizde taşıyoruz.
globalThis.__dreamBloom = bloom;

// ---------- dünya ----------
const atmosfer = new Atmosfer(sahne, renderer);
const sehir = new Sehir(sahne);
const hareket = new Hareket(sahne, sehir);

// ---------- arayüz ----------
const saatEl = document.getElementById('saat');
const havaEl = document.getElementById('hava');
const kart = document.getElementById('kart');
const kartAd = document.getElementById('kartAd');
const kartAlt = document.getElementById('kartAlt');

let otomatikDongu = true;
let turdaMi = false;

function zamanDugmesiGuncelle(anahtar) {
  document.querySelectorAll('[data-zaman]').forEach((b) => {
    b.classList.toggle('aktif', b.dataset.zaman === anahtar);
  });
}

function havaDugmesiGuncelle(tur) {
  document.querySelectorAll('[data-hava]').forEach((b) => {
    b.classList.toggle('aktif', b.dataset.hava === tur);
  });
  havaEl.textContent = tur === 'yagmur' ? 'Yağmurlu' : tur === 'kar' ? 'Karlı' : 'Açık';
}

document.querySelectorAll('[data-zaman]').forEach((btn) => {
  btn.addEventListener('click', () => {
    atmosfer.zamanAyarla(btn.dataset.zaman);
    zamanDugmesiGuncelle(btn.dataset.zaman);
    if (turdaMi) turuBitir();
  });
});

document.querySelectorAll('[data-hava]').forEach((btn) => {
  btn.addEventListener('click', () => {
    atmosfer.havaAyarla(btn.dataset.hava);
    havaDugmesiGuncelle(btn.dataset.hava);
    sesiHavaAyarla(btn.dataset.hava);
  });
});

// gece/gündüz otomatik döngü
const otoBtn = document.getElementById('otoBtn');
otoBtn.addEventListener('click', () => {
  otomatikDongu = !otomatikDongu;
  otoBtn.classList.toggle('aktif', otomatikDongu);
  otoBtn.setAttribute('aria-pressed', String(otomatikDongu));
});
otoBtn.classList.toggle('aktif', otomatikDongu);
otoBtn.setAttribute('aria-pressed', 'true');

// ipucu
const ipucu = document.getElementById('ipucu');
document.getElementById('ipucuKapat').addEventListener('click', () => ipucu.classList.add('kalkti'));
setTimeout(() => ipucu.classList.add('kalkti'), 16000);

// ---------- tıklama: bina seç, oda ışıkları ----------
const isinici = new THREE.Raycaster();
const fare = new THREE.Vector2();
let seciliBina = null;
let surukleme = false;

kanvas.addEventListener('pointerdown', () => { surukleme = false; });
kanvas.addEventListener('pointermove', (e) => {
  if (e.buttons === 1) surukleme = true;
  if (!kart.classList.contains('gizli')) return;
});

kanvas.addEventListener('pointerup', (e) => {
  if (surukleme) return;
  fare.x = (e.clientX / window.innerWidth) * 2 - 1;
  fare.y = -(e.clientY / window.innerHeight) * 2 + 1;
  isinici.setFromCamera(fare, kamera);

  const hedefler = [];
  for (const b of sehir.binalar) {
    b.traverse((o) => { if (o.isMesh) hedefler.push(o); });
  }
  const kesisim = isinici.intersectObjects(hedefler, false);
  if (!kesisim.length) { secimiTemizle(); return; }

  // ait olduğu binayı bul
  let o = kesisim[0].object;
  while (o && !o.userData.tip) o = o.parent;
  if (!o) { secimiTemizle(); return; }

  // pencerelere tıklandıysa yalnız o oda değişir
  const tiklamaPenceresi = o.userData.pencereler?.find((p) => p.mesh === kesisim[0].object);
  if (tiklamaPenceresi && !tiklamaPenceresi.cam) {
    tiklamaPenceresi.acik = !tiklamaPenceresi.acik;
    tiklamaPenceresi.bekleme = aralik(8, 20);
    tiklamaPenceresi.mesh.material.emissive.setHex(tiklamaPenceresi.acik ? 0xffc477 : 0x2b2f3a);
    kartAlt.textContent = `Oda ${tiklamaPenceresi.odaNo} — ışık ${tiklamaPenceresi.acik ? 'yanıyor' : 'kapalı'}.`;
    binayiSec(o, false);
    return;
  }

  binayiSec(o, true);
});

function secimiTemizle() {
  seciliBina = null;
  kart.classList.add('gizli');
}

function binayiSec(bina, tumunuDegistir) {
  seciliBina = bina;
  kart.classList.remove('gizli');
  kartAd.textContent = bina.userData.ad || 'Bir Yapı';
  if (tumunuDegistir) {
    const pen = bina.userData.pencereler || [];
    const acilacak = pen.filter((p) => !p.acik).length >= pen.length / 2;
    pen.forEach((p, i) => {
      p.acik = acilacak;
      p.bekleme = aralik(6, 18) + i * 0.02;
      if (!p.cam) p.mesh.material.emissive.setHex(acilacak ? 0xffc477 : 0x2b2f3a);
    });
    if (pen.length) {
      kartAlt.textContent = `${pen.length} pencerenin ışığı ${acilacak ? 'yandı' : 'söndü'}. İçeride biri var gibi.`;
    } else if (bina.userData.tip === 'park') {
      kartAlt.textContent = 'Ağaçlar, banklar ve bir fener. Şehrin nefes aldığı yer.';
    } else {
      kartAlt.textContent = 'Meydandaki su kulesi ve saat kulesi; akşamları burada insanlar dolaşır.';
    }
  } else if (!kartAlt.textContent) {
    kartAlt.textContent = 'Pencerelere tıkla, odaların ışığı değişsin.';
  }
}

document.getElementById('kartKapat').addEventListener('click', secimiTemizle);
document.getElementById('kartIsik').addEventListener('click', () => {
  if (seciliBina) binayiSec(seciliBina, true);
});

// ---------- sinematik tur ----------
const turBtn = document.getElementById('turBtn');
const turDuraklari = [
  { hedef: new THREE.Vector3(0, 2, 0), uzak: 62, aci: 0.9, yuk: 0.62, sure: 7 },
  { hedef: new THREE.Vector3(-14, 1.5, 8), uzak: 26, aci: -0.6, yuk: 0.32, sure: 6 },
  { hedef: new THREE.Vector3(12, 2, -6), uzak: 22, aci: 2.2, yuk: 0.22, sure: 6 },
  { hedef: new THREE.Vector3(0, 3, 0), uzak: 34, aci: -1.9, yuk: 0.9, sure: 5 },
  { hedef: new THREE.Vector3(0, 2, 0), uzak: 58, aci: 3.6, yuk: 0.5, sure: 8 },
];

let tur = { aktif: false, idx: 0, t: 0, basla: null, bitis: null };

turBtn.addEventListener('click', () => {
  if (tur.aktif) turuBitir();
  else turuBaslat();
});

function turuBaslat() {
  tur.aktif = true;
  tur.idx = 0;
  tur.t = 0;
  turBtn.classList.add('aktif');
  turBtn.innerHTML = '<svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true"><rect x="6" y="5" width="4" height="14" fill="currentColor"/><rect x="14" y="5" width="4" height="14" fill="currentColor"/></svg> Turu Bitir';
  kontrol.autoRotate = false;
  kontrol.enabled = false;
  secimiTemizle();
  ipucu.classList.add('kalkti');

  // tur sırasında şehir kendiliğinden geceye doğru kayar
  turPlan = ['gunbatimi', 'gece', 'gece', 'gunbatimi', 'gunduz'];
}

let turPlan = [];

function turuBitir() {
  tur.aktif = false;
  turBtn.classList.remove('aktif');
  turBtn.innerHTML = '<svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true"><path d="M8 5v14l11-7z" fill="currentColor"/></svg> Şehir Turu';
  kontrol.enabled = true;
  turdaMi = false;
}

function turAdimi(dt) {
  const d = turDuraklari[tur.idx];
  if (!d) { turuBitir(); return; }

  if (tur.t === 0) {
    // hedef zaman dilimini tur başına değiştir
    const z = turPlan[tur.idx];
    if (z) { atmosfer.zamanAyarla(z); zamanDugmesiGuncelle(z); }
    // kamera başlangıç
    const kure = new THREE.Spherical(d.uzak * 1.45, Math.PI * (0.5 - d.yuk * 0.38), d.aci - 0.7);
    const baslaPoz = new THREE.Vector3().setFromSpherical(kure).add(d.hedef);
    tur.basla = { poz: kamera.position.clone(), hedef: kontrol.target.clone() };
  }

  tur.t += dt;
  const oran = Math.min(1, tur.t / d.sure);
  const e = oran < 0.5 ? 2 * oran * oran : 1 - Math.pow(-2 * oran + 2, 2) / 2;

  // polar açı: yuk=1 → tepeye yakın, yuk=0 → ufka yakın (sinematik alçak açı)
  const polar = Math.PI * (0.5 - d.yuk * 0.38);
  const sonPoz = new THREE.Vector3().setFromSphericalCoords(d.uzak, polar, d.aci).add(d.hedef);

  kamera.position.lerpVectors(tur.basla.poz, sonPoz, e);
  kontrol.target.lerpVectors(tur.basla.hedef, d.hedef, e);
  kamera.lookAt(kontrol.target);

  if (oran >= 1) {
    tur.idx++;
    tur.t = 0;
  }
}
kontrol.addEventListener('start', () => {
  if (tur.aktif) turuBitir();
  ipucu.classList.add('kalkti');
});

// ---------- ses (WebAudio ile üretilen ortam) ----------
const sesBtn = document.getElementById('sesBtn');
let sesAktif = false;
let sesBaglam = null;
let sesDugum = null;
let yagmurSes = null;

function sesiKur() {
  if (sesBaglam) return;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  sesBaglam = new AC();

  // yumuşak rüzgâr: kahverengi gürültü
  const uzunluk = sesBaglam.sampleRate * 4;
  const tampon = sesBaglam.createBuffer(1, uzunluk, sesBaglam.sampleRate);
  const veri = tampon.getChannelData(0);
  let son = 0;
  for (let i = 0; i < uzunluk; i++) {
    const beyaz = Math.random() * 2 - 1;
    son = (son + 0.02 * beyaz) / 1.02;
    veri[i] = son * 3.2;
  }

  const kaynak = sesBaglam.createBufferSource();
  kaynak.buffer = tampon;
  kaynak.loop = true;

  const filtre = sesBaglam.createBiquadFilter();
  filtre.type = 'lowpass';
  filtre.frequency.value = 620;

  const kazanc = sesBaglam.createGain();
  kazanc.gain.value = 0;

  kaynak.connect(filtre).connect(kazanc).connect(sesBaglam.destination);
  kaynak.start();
  sesDugum = kazanc;

  yagmurSes = sesBaglam.createBufferSource();
  yagmurSes.buffer = tampon;
  yagmurSes.loop = true;
  const yagmurFiltre = sesBaglam.createBiquadFilter();
  yagmurFiltre.type = 'highpass';
  yagmurFiltre.frequency.value = 1400;
  const yagmurKazanc = sesBaglam.createGain();
  yagmurKazanc.gain.value = 0;
  yagmurSes.connect(yagmurFiltre).connect(yagmurKazanc).connect(sesBaglam.destination);
  yagmurSes.start();
  yagmurSes = yagmurKazanc;
}

sesBtn.addEventListener('click', async () => {
  sesAktif = !sesAktif;
  sesBtn.classList.toggle('aktif', sesAktif);
  sesBtn.setAttribute('aria-pressed', String(sesAktif));
  if (sesAktif) {
    sesiKur();
    if (sesBaglam && sesBaglam.state === 'suspended') await sesBaglam.resume();
    sesDugum.gain.cancelScheduledValues(sesBaglam.currentTime);
    sesDugum.gain.linearRampToValueAtTime(0.055, sesBaglam.currentTime + 2.2);
  } else if (sesDugum) {
    sesDugum.gain.cancelScheduledValues(sesBaglam.currentTime);
    sesDugum.gain.linearRampToValueAtTime(0, sesBaglam.currentTime + 0.8);
  }
  sesiHavaAyarla(atmosfer.hava);
});

function sesiHavaAyarla(tur) {
  if (!sesBaglam || !yagmurSes) return;
  const hedef = !sesAktif ? 0 : tur === 'yagmur' ? 0.09 : tur === 'kar' ? 0.018 : 0;
  yagmurSes.gain.cancelScheduledValues(sesBaglam.currentTime);
  yagmurSes.gain.linearRampToValueAtTime(hedef, sesBaglam.currentTime + (hedef ? 1.6 : 0.8));
}

// ---------- pencere boyutu ----------
function boyutla() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  kamera.aspect = w / h;
  kamera.updateProjectionMatrix();
  renderer.setSize(w, h);
  besteci.setSize(w, h);
  bloom.setSize(w, h);
}
window.addEventListener('resize', boyutla);

// ---------- döngü ----------
const saat = new THREE.Clock();
let zaman = 0;
let otomatikSayac = 0;

const donguSirası = ['gunbatimi', 'gece', 'gunduz'];
let donguIdx = 1;

function dongu() {
  requestAnimationFrame(dongu);

  const dt = Math.min(0.06, saat.getDelta());
  zaman += dt;

  const gece = atmosfer.guncelle(dt);
  sehir.guncelle(dt, zaman);
  sehir.gunFaktoruAyarla(gece);
  hareket.guncelle(dt, zaman, gece);

  // otomatik gün döngüsü: her ~45 sn'de bir zaman dilimi değişir
  if (otomatikDongu && !tur.aktif) {
    otomatikSayac += dt;
    if (otomatikSayac > 45) {
      otomatikSayac = 0;
      donguIdx = (donguIdx + 1) % donguSirası.length;
      const z = donguSirası[donguIdx];
      atmosfer.zamanAyarla(z);
      zamanDugmesiGuncelle(z);
    }
  }

  if (tur.aktif) {
    turdaMi = true;
    turAdimi(dt);
  } else {
    kontrol.update();
  }

  // saat göstergesi: zaman dilimine göre akar
  const z = ZAMANLAR[atmosfer.zaman];
  const [ss, dd] = z.saat.split(':').map(Number);
  const akan = (ss * 60 + dd + (zaman * 1.5)) % 1440;
  saatEl.textContent =
    String(Math.floor(akan / 60)).padStart(2, '0') + ':' + String(Math.floor(akan % 60)).padStart(2, '0');

  besteci.render();
}

// ---------- başlat ----------
atmosfer.zamanAyarla('gece');
zamanDugmesiGuncelle('gece');
havaDugmesiGuncelle('yok');
boyutla();
dongu();

// açılış perdesini kaldır
setTimeout(() => {
  document.getElementById('intro')?.classList.add('kalkti');
  // ilk bakışta hafif kamera kayması (masal girişi) — geniş, izometrik bakış
  const baslangic = new THREE.Spherical(78, Math.PI * 0.30, 0.85);
  kamera.position.setFromSpherical(baslangic).add(kontrol.target);
}, 1450);

console.log('[Dream City] hazır — binalar:', sehir.binalar.length, '· pencereler:', sehir.pencereler.length);
