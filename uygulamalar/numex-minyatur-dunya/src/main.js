// Numex Minyatür Dünya — editör, arayüz ve animasyon döngüsü.
import * as THREE from 'three';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js';
import { sahneKur, ATMOSFERLER } from './scene.js';
import { nesneUret, KATALOG, KATEGORILER, geceAta } from './objects.js';
import { RayHatti } from './track.js';
import {
  SABLONLAR, bosSahne, nesneEkle, nesneSil, kopyala, kaydet, yukle, dogrula, kayitVarMi,
} from './state.js';

const $ = (s) => document.querySelector(s);
const $$ = (s) => Array.from(document.querySelectorAll(s));

const ctx = sahneKur($('#sahne'));
const rayHatti = new RayHatti();
const saat = new THREE.Clock();
let zaman = 0;

let sahne = kayitVarMi() ? (yukle() || SABLONLAR[0].kur()) : SABLONLAR[0].kur();
let secili = null;
let mod = 'translate';
let izgaraAcik = true;
let trenMesafe = 0;
const gorunum = new Map();
const gecmis = [];
const gelecek = [];

/* ---------------- dönüşüm aracı ---------------- */
const tc = new TransformControls(ctx.camera, ctx.renderer.domElement);
tc.setSize(0.85);
const tcYardimci = typeof tc.getHelper === 'function' ? tc.getHelper() : tc;
ctx.scene.add(tcYardimci);
tcYardimci.visible = false;

tc.addEventListener('dragging-changed', (e) => {
  ctx.orbit.enabled = !e.value;
  if (e.value) it();
  else { durumdanYaz(); otoKaydet(); }
});
tc.addEventListener('objectChange', () => { durumdanYaz(true); });

/* ---------------- yardımcılar ---------------- */
function it() {
  gecmis.push(JSON.stringify(sahne));
  if (gecmis.length > 60) gecmis.shift();
  gelecek.length = 0;
  dugmeDurum();
}
function geriAl() {
  if (!gecmis.length) return toast('Geri alınacak adım yok');
  gelecek.push(JSON.stringify(sahne));
  sahne = JSON.parse(gecmis.pop());
  senkron(); panelGuncelle(); otoKaydet(); dugmeDurum();
}
function yinele() {
  if (!gelecek.length) return toast('Yinelenecek adım yok');
  gecmis.push(JSON.stringify(sahne));
  sahne = JSON.parse(gelecek.pop());
  senkron(); panelGuncelle(); otoKaydet(); dugmeDurum();
}
function dugmeDurum() {
  $('#btnGeriAl').disabled = gecmis.length === 0;
  $('#btnYinele').disabled = gelecek.length === 0;
}

let toastZaman = null;
function toast(mesaj) {
  const t = $('#toast');
  t.textContent = mesaj;
  t.hidden = false;
  clearTimeout(toastZaman);
  toastZaman = setTimeout(() => { t.hidden = true; }, 2600);
}
function durumYaz(m) { $('#durum').textContent = m; }

const rayAraci = (o) => o && (o.tur === 'lokomotif' || o.tur === 'vagon');
const veri = (id) => sahne.nesneler.find(o => o.id === id);

/* ---------------- görünüm <-> durum ---------------- */
function uygula(g, o) {
  const y = o.tur === 'kus' ? 0.9 : 0;
  g.position.set(o.x, y, o.z);
  g.rotation.y = o.rotY;
  g.scale.setScalar(o.olcek);
  g.userData.temel = new THREE.Vector3(o.x, y, o.z);
  g.userData.faz = g.userData.faz ?? Math.random() * 6.28;
}

function senkron() {
  const idler = new Set(sahne.nesneler.map(o => o.id));
  for (const [id, g] of Array.from(gorunum)) {
    if (!idler.has(id)) {
      ctx.scene.remove(g);
      g.traverse(o => { if (o.isMesh) { o.geometry.dispose?.(); } });
      gorunum.delete(id);
      if (secili === id) secili = null;
    }
  }
  for (const o of sahne.nesneler) {
    let g = gorunum.get(o.id);
    if (!g) {
      g = nesneUret(o.tur);
      g.userData.kok = true;
      g.userData.id = o.id;
      ctx.scene.add(g);
      gorunum.set(o.id, g);
    }
    uygula(g, o);
  }
  hatKur();
  geceUygula();
  gizmoBagla();
  durumYaz(`${sahne.nesneler.length} nesne`);
}

function hatKur() {
  const raylar = sahne.nesneler.filter(o => o.tur === 'ray');
  rayHatti.kur(raylar);
}

function geceUygula() {
  const a = ATMOSFERLER[sahne.atmosfer] || ATMOSFERLER.gunduz;
  for (const g of gorunum.values()) geceAta(g, a.gece);
}

function gizmoBagla() {
  const g = secili ? gorunum.get(secili) : null;
  const o = secili ? veri(secili) : null;
  if (g && o && !rayAraci(o)) {
    tc.attach(g);
    tcYardimci.visible = true;
  } else {
    tc.detach();
    tcYardimci.visible = false;
  }
}

/** mesh -> durum (gizmo sürüklerken) */
function durumdanYaz(sadeceSecili) {
  if (!secili) return;
  const o = veri(secili);
  const g = gorunum.get(secili);
  if (!o || !g) return;
  if (!rayAraci(o)) {
    o.x = +g.position.x.toFixed(3);
    o.z = +g.position.z.toFixed(3);
    o.rotY = +g.rotation.y.toFixed(4);
    o.olcek = +Math.max(0.2, Math.min(4, g.scale.x)).toFixed(3);
  }
  if (sadeceSecili) { panelDegerGuncelle(); durumYaz(`${KATALOG.find(k => k.id === o.tur)?.ad || o.tur} taşınıyor`); }
  else panelGuncelle();
}

/* ---------------- seçim ---------------- */
function sec(id) {
  secili = id;
  gizmoBagla();
  panelGuncelle();
}

const raycaster = new THREE.Raycaster();
const isaretci = new THREE.Vector2();
let baslaX = 0, baslaY = 0, surukleniyor = false;

function sahneNoktasi(olay) {
  const r = ctx.renderer.domElement.getBoundingClientRect();
  isaretci.x = ((olay.clientX - r.left) / r.width) * 2 - 1;
  isaretci.y = -((olay.clientY - r.top) / r.height) * 2 + 1;
  raycaster.setFromCamera(isaretci, ctx.camera);
  return raycaster;
}

function zemineNokta(olay) {
  const ray = sahneNoktasi(olay);
  const kesi = ray.intersectObject(ctx.zeminDuzlem, false);
  if (kesi.length) return kesi[0].point;
  return new THREE.Vector3(0, 0, 0);
}

function nesneBul(olay) {
  const ray = sahneNoktasi(olay);
  const hedefler = [];
  for (const g of gorunum.values()) hedefler.push(g);
  const kesisim = ray.intersectObjects(hedefler, true);
  if (!kesisim.length) return null;
  let o = kesisim[0].object;
  while (o && !o.userData.kok) o = o.parent;
  if (!o) return null;
  const kayit = veri(o.userData.id);
  return kayit ? { o: kayit, g: o } : null;
}

function secimYap(olay) {
  const bul = nesneBul(olay);
  if (!bul) { sec(null); return; }
  sec(bul.o.id);
  durumYaz(`${KATALOG.find(k => k.id === bul.o.tur)?.ad || bul.o.tur} seçildi`);
}

/* doğrudan sürükleme (fareyle tutup bırakma) */
let surukleNesne = null;
const surukleOfset = { x: 0, z: 0 };
let surukleBasladi = false;

ctx.renderer.domElement.addEventListener('pointerdown', (e) => {
  if (e.button !== 0 || tc.dragging) return;
  baslaX = e.clientX; baslaY = e.clientY;
  surukleniyor = true;
  surukleBasladi = false;
  surukleNesne = null;
  if (tc.axis) return;                       // tutamak üzerindeyse gizmo yönetsin
  const bul = nesneBul(e);
  if (!bul) return;
  sec(bul.o.id);
  durumYaz(`${KATALOG.find(k => k.id === bul.o.tur)?.ad || bul.o.tur} seçildi`);
  if (mod === 'translate' && !rayAraci(bul.o)) {
    const p = zemineNokta(e);
    surukleNesne = bul.o;
    surukleOfset.x = bul.o.x - p.x;
    surukleOfset.z = bul.o.z - p.z;
    ctx.orbit.enabled = false;
  }
});

ctx.renderer.domElement.addEventListener('pointermove', (e) => {
  if (!surukleNesne) return;
  const mesafe = Math.hypot(e.clientX - baslaX, e.clientY - baslaY);
  if (mesafe < 4) return;
  if (!surukleBasladi) { it(); surukleBasladi = true; }
  const p = zemineNokta(e);
  let nx = Math.max(-4.4, Math.min(4.4, p.x + surukleOfset.x));
  let nz = Math.max(-4.4, Math.min(4.4, p.z + surukleOfset.z));
  if (izgaraAcik) { nx = Math.round(nx * 2) / 2; nz = Math.round(nz * 2) / 2; }
  surukleNesne.x = +nx.toFixed(3);
  surukleNesne.z = +nz.toFixed(3);
  const g = gorunum.get(surukleNesne.id);
  if (g) g.position.set(surukleNesne.x, g.position.y, surukleNesne.z);
  panelDegerGuncelle();
  durumYaz('taşınıyor');
});

ctx.renderer.domElement.addEventListener('pointerup', (e) => {
  if (!surukleniyor) return;
  surukleniyor = false;
  if (surukleNesne) {
    ctx.orbit.enabled = true;
    surukleNesne = null;
    panelGuncelle();
    otoKaydet();
    durumYaz('bırakıldı');
    return;
  }
  const mesafe = Math.hypot(e.clientX - baslaX, e.clientY - baslaY);
  if (mesafe > 6 || tc.dragging) return;
  if (!nesneBul(e)) sec(null);
});

/* ---------------- ekle / sil / kopyala ---------------- */
function ekle(tur, x, z, rot = 0) {
  it();
  const o = nesneEkle(sahne, tur, x, z, izgaraAcik ? Math.round(rot / (Math.PI / 12)) * (Math.PI / 12) : rot);
  if (tur === 'lokomotif' || tur === 'vagon') {
    const araclar = sahne.nesneler.filter(n => n.rayOfset != null);
    const sonOfset = araclar.length ? Math.max(...araclar.map(n => +n.rayOfset)) : 0;
    o.rayOfset = araclar.length ? +(sonOfset + 1.3).toFixed(2) : 0;
  }
  if (izgaraAcik) { o.x = Math.round(o.x * 2) / 2; o.z = Math.round(o.z * 2) / 2; }
  senkron(); sec(o.id); otoKaydet();
  durumYaz(`${KATALOG.find(k => k.id === tur)?.ad || tur} eklendi`);
  return o;
}

function sil(id = secili) {
  const o = veri(id);
  if (!o) return toast('Önce bir nesne seç');
  it();
  nesneSil(sahne, id);
  if (secili === id) secili = null;
  senkron(); panelGuncelle(); otoKaydet();
  durumYaz('Nesne silindi');
}

function kopyalaSecili() {
  if (!secili) return toast('Kopyalamak için nesne seç');
  it();
  const yeni = kopyala(sahne, secili);
  senkron(); if (yeni) sec(yeni.id); otoKaydet();
  toast('Nesne kopyalandı');
}

/* ---------------- panel ---------------- */
function panelGuncelle() {
  const o = secili ? veri(secili) : null;
  const bas = $('#secBaslik');
  const ic = $('#secIcerik');
  if (!o) {
    bas.textContent = 'Seçili nesne yok';
    ic.innerHTML = '<p class="bos">Sahnede bir nesneye tıkla, ayarları burada açılsın.<br><br>Boş alana tıkla → seçimi bırakır.<br>Sol panelden nesne ekleyebilirsin.</p>';
    return;
  }
  const k = KATALOG.find(x => x.id === o.tur);
  bas.textContent = k ? k.ad : o.tur;
  const ray = rayAraci(o);
  ic.innerHTML = `
    <span class="rozet-tur">${k ? k.ikon + ' ' + k.ad : o.tur}${ray ? ' · ray üzerinde' : ''}</span>
    ${ray ? `
      <div class="alan">
        <label>Tren hattındaki konum <b id="vOf">${(o.rayOfset || 0).toFixed(1)} m</b></label>
        <input type="range" id="rOfset" min="0" max="${Math.max(12, Math.ceil(rayHatti.uzunluk || 12))}" step="0.1" value="${o.rayOfset || 0}">
      </div>` : `
      <div class="alan">
        <label>Döndürme <b id="vRot">${Math.round(o.rotY * 180 / Math.PI)}°</b></label>
        <input type="range" id="rRot" min="-180" max="180" step="1" value="${Math.round(o.rotY * 180 / Math.PI)}">
      </div>
      <div class="alan">
        <label>Boyut <b id="vOlcek">${o.olcek.toFixed(2)}×</b></label>
        <input type="range" id="rOlcek" min="0.4" max="2.4" step="0.02" value="${o.olcek}">
      </div>
      <div class="alan">
        <label>Konum <b id="vKon">${o.x.toFixed(1)}, ${o.z.toFixed(1)}</b></label>
      </div>`}
    <div class="dugme-satir">
      <button id="bKopya">⧉ Kopyala</button>
      <button id="bSil" class="tehlike">🗑 Sil</button>
    </div>
    <p class="not">${ray
      ? 'Tren nesnesi hattı takip eder; konumunu bu kaydırıcıyla hat üzerinde ayarla.'
      : 'Nesneyi sahnede tutup sürükleyebilir, oklarla taşıyabilir, halkalarıyla döndürüp büyütebilirsin.'}</p>`;

  $('#bKopya').onclick = kopyalaSecili;
  $('#bSil').onclick = () => sil();

  const rRot = $('#rRot'), rOlcek = $('#rOlcek'), rOfset = $('#rOfset');
  if (rRot) {
    rRot.addEventListener('pointerdown', it);
    rRot.addEventListener('input', () => {
      const o2 = veri(secili); if (!o2) return;
      o2.rotY = rRot.value * Math.PI / 180;
      const g = gorunum.get(secili); if (g) g.rotation.y = o2.rotY;
      $('#vRot').textContent = Math.round(rRot.value) + '°';
    });
    rRot.addEventListener('change', otoKaydet);
  }
  if (rOlcek) {
    rOlcek.addEventListener('pointerdown', it);
    rOlcek.addEventListener('input', () => {
      const o2 = veri(secili); if (!o2) return;
      o2.olcek = +rOlcek.value;
      const g = gorunum.get(secili); if (g) g.scale.setScalar(o2.olcek);
      $('#vOlcek').textContent = o2.olcek.toFixed(2) + '×';
    });
    rOlcek.addEventListener('change', otoKaydet);
  }
  if (rOfset) {
    rOfset.addEventListener('pointerdown', it);
    rOfset.addEventListener('input', () => {
      const o2 = veri(secili); if (!o2) return;
      o2.rayOfset = +rOfset.value;
      $('#vOf').textContent = (+rOfset.value).toFixed(1) + ' m';
    });
    rOfset.addEventListener('change', otoKaydet);
  }
}

function panelDegerGuncelle() {
  const o = secili ? veri(secili) : null;
  if (!o) return;
  const g = gorunum.get(secili);
  const vRot = $('#vRot'), vOlcek = $('#vOlcek'), vKon = $('#vKon');
  const rRot = $('#rRot'), rOlcek = $('#rOlcek');
  if (vRot) vRot.textContent = Math.round(o.rotY * 180 / Math.PI) + '°';
  if (vOlcek) vOlcek.textContent = o.olcek.toFixed(2) + '×';
  if (vKon) vKon.textContent = o.x.toFixed(1) + ', ' + o.z.toFixed(1);
  if (rRot && document.activeElement !== rRot) rRot.value = Math.round(o.rotY * 180 / Math.PI);
  if (rOlcek && document.activeElement !== rOlcek) rOlcek.value = o.olcek;
  if (g) g.userData.temel.set(o.x, o.tur === 'kus' ? 0.9 : 0, o.z);
}

/* ---------------- kütüphane ---------------- */
let aktifKat = KATEGORILER[0];
function kutuphaneCiz() {
  const katKutu = $('#kategoriler');
  katKutu.innerHTML = '';
  KATEGORILER.forEach(k => {
    const b = document.createElement('button');
    b.className = 'kat' + (k === aktifKat ? ' secili' : '');
    b.textContent = k;
    b.onclick = () => { aktifKat = k; kutuphaneCiz(); };
    katKutu.appendChild(b);
  });
  const kutu = $('#nesneler');
  kutu.innerHTML = '';
  KATALOG.filter(k => k.kat === aktifKat).forEach(k => {
    const b = document.createElement('button');
    b.className = 'nesne';
    b.title = k.ad + ' — sahneye ekle';
    b.dataset.tur = k.id;
    b.innerHTML = `<span class="ikon">${k.ikon}</span><span class="ad">${k.ad}</span>${(k.id === 'lokomotif' || k.id === 'vagon') ? '<span class="rozet">↔</span>' : ''}`;
    b.onclick = () => {
      const merkez = new THREE.Vector3(0, 0, 0);
      const ofset = (Math.random() - 0.5) * 1.2;
      ekle(k.id, +(merkez.x + ofset).toFixed(2), +(merkez.z + ofset).toFixed(2));
    };
    kutu.appendChild(b);
  });
}

/* ---------------- atmosfer ---------------- */
function atmosferSec(ad) {
  if (!ATMOSFERLER[ad]) return;
  sahne.atmosfer = ad;
  ctx.setAtmosfer(ad);
  geceUygula();
  $$('#atmosferler .hava').forEach(b => b.classList.toggle('secili', b.dataset.hava === ad));
  durumYaz(ATMOSFERLER[ad].ad);
  otoKaydet();
}

/* ---------------- kaydet / yükle / dışa aktar ---------------- */
let kayitZaman = null;
function otoKaydet() {
  clearTimeout(kayitZaman);
  kayitZaman = setTimeout(() => { kaydet(sahne); durumYaz('Otomatik kaydedildi'); }, 700);
}

function kaydetTikla() {
  if (kaydet(sahne)) toast('Tarayıcıya kaydedildi');
  else toast('Kaydedilemedi (tarayıcı depolaması kapalı olabilir)');
}
function yukleTikla() {
  const s = yukle();
  if (!s) return toast('Kayıtlı sahne bulunamadı');
  it();
  sahne = s;
  ctx.setAtmosfer(sahne.atmosfer);
  $$('#atmosferler .hava').forEach(b => b.classList.toggle('secili', b.dataset.hava === sahne.atmosfer));
  secili = null;
  senkron(); panelGuncelle();
  toast('Kayıtlı sahne yüklendi');
}
function jsonDisa() {
  const metin = JSON.stringify({ ...sahne, uygulama: 'Numex Minyatür Dünya' }, null, 1);
  const url = URL.createObjectURL(new Blob([metin], { type: 'application/json' }));
  const a = document.createElement('a');
  a.href = url; a.download = 'minyatur-dunyam.json'; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 3000);
  toast('JSON indirildi');
}
function jsonIce(metin) {
  try {
    const s = dogrula(JSON.parse(metin));
    it();
    sahne = s;
    ctx.setAtmosfer(sahne.atmosfer);
    $$('#atmosferler .hava').forEach(b => b.classList.toggle('secili', b.dataset.hava === sahne.atmosfer));
    secili = null;
    senkron(); panelGuncelle(); otoKaydet();
    toast('Sahne içe aktarıldı');
  } catch (e) {
    toast('Dosya okunamadı: ' + e.message);
  }
}
function pngAl() {
  const gorunur = tcYardimci.visible;
  tcYardimci.visible = false;
  const izg = ctx.izgara.visible;
  ctx.izgara.visible = false;
  ctx.renderer.render(ctx.scene, ctx.camera);
  const url = ctx.renderer.domElement.toDataURL('image/png');
  tcYardimci.visible = gorunur;
  ctx.izgara.visible = izg;
  const a = document.createElement('a');
  a.href = url; a.download = 'minyatur-dunyam.png'; a.click();
  toast('PNG indirildi');
  return url;
}
async function paylas() {
  const metin = JSON.stringify(sahne);
  try {
    await navigator.clipboard.writeText(metin);
    toast('Sahnenin JSON’u kopyalandı — paylaşmak istediğine gönderebilirsin');
  } catch (e) {
    jsonDisa();
    toast('Panoya yazılamadı, JSON dosyası indirildi');
  }
}

/* ---------------- şablon ---------------- */
function sablonlariCiz() {
  const k = $('#sablonlar');
  k.innerHTML = '';
  SABLONLAR.forEach(s => {
    const b = document.createElement('button');
    b.className = 'sablon';
    b.innerHTML = `<span class="buyuk">${s.ikon}</span><b>${s.ad}</b><span>${s.aciklama}</span>`;
    b.onclick = () => {
      it();
      sahne = s.kur();
      ctx.setAtmosfer(sahne.atmosfer);
      $$('#atmosferler .hava').forEach(x => x.classList.toggle('secili', x.dataset.hava === sahne.atmosfer));
      secili = null;
      senkron(); panelGuncelle(); otoKaydet();
      $('#sablonOrtu').hidden = true;
      toast(s.ad + ' yüklendi');
      trenMesafe = 0;
    };
    k.appendChild(b);
  });
  const bos = document.createElement('button');
  bos.className = 'sablon';
  bos.innerHTML = '<span class="buyuk">⬜</span><b>Boş platform</b><span>Sıfırdan kendi dünyanı kur.</span>';
  bos.onclick = () => {
    it();
    sahne = bosSahne();
    secili = null; senkron(); panelGuncelle(); otoKaydet();
    $('#sablonOrtu').hidden = true;
    toast('Boş platform hazır');
  };
  k.appendChild(bos);
}

/* ---------------- tren + animasyon ---------------- */
function trenGuncelle(dt) {
  if (!sahne.tren || !rayHatti.hazir) return;
  trenMesafe += dt * 1.35;
  for (const o of sahne.nesneler) {
    if (!rayAraci(o)) continue;
    const g = gorunum.get(o.id); if (!g) continue;
    const r = rayHatti.al(trenMesafe - (o.rayOfset || 0));
    if (!r) continue;
    const onceki = g.userData.sonKonum;
    g.position.set(r.konum.x, 0.02, r.konum.z);
    if (onceki) {
      const dx = r.konum.x - onceki.x, dz = r.konum.z - onceki.z;
      if (Math.hypot(dx, dz) > 0.0005) g.rotation.y = Math.atan2(dx, dz);
    }
    g.userData.sonKonum = r.konum.clone();
  }
}

function animasyon(g, h, t) {
  const temel = g.userData.temel;
  const faz = g.userData.faz || 0;
  switch (h.tip) {
    case 'don':
      if (h.hedef) h.hedef.rotation.z += 0.016 * h.hiz;
      break;
    case 'sallan':
      if (h.hedef) h.hedef.rotation.x = Math.sin(t * h.hiz) * h.genlik;
      break;
    case 'salinim':
      g.rotation.z = Math.sin(t * 1.2 + faz) * h.siddet;
      break;
    case 'insan': {
      g.position.y = temel.y + Math.abs(Math.sin(t * 2 + faz)) * 0.012;
      g.rotation.y += Math.sin(t * 0.6 + faz) * 0.0016;
      if (h.kollar) {
        h.kollar[0].rotation.x = Math.sin(t * 2.4 + faz) * 0.5;
        h.kollar[1].rotation.x = -Math.sin(t * 2.4 + faz) * 0.5;
      }
      if (h.bacaklar) {
        h.bacaklar[0].rotation.x = -Math.sin(t * 2.4 + faz) * 0.32;
        h.bacaklar[1].rotation.x = Math.sin(t * 2.4 + faz) * 0.32;
      }
      break;
    }
    case 'kuyruk':
      if (h.hedef) h.hedef.rotation[h.eksen || 'y'] = Math.sin(t * h.hiz + faz) * 0.55;
      break;
    case 'ucus': {
      g.position.y = temel.y + Math.sin(t * 1.5 + faz) * 0.28;
      g.position.x = temel.x + Math.cos(t * 0.55 + faz) * 1.15;
      g.position.z = temel.z + Math.sin(t * 0.55 + faz) * 1.15;
      g.rotation.y = -t * 0.55 - faz + Math.PI / 2;
      if (h.kanatlar) {
        const k = Math.sin(t * 11 + faz) * 0.7;
        h.kanatlar[0].rotation.z = k;
        h.kanatlar[1].rotation.z = -k;
      }
      break;
    }
    case 'yalpa':
      g.position.y = temel.y + Math.sin(t * 1.6 + faz) * 0.012;
      g.rotation.z = Math.sin(t * h.hiz + faz) * h.genlik;
      break;
    case 'sallan2':
      break;
    case 'nabiz':
      if (h.hedef) {
        const s = 1 + Math.sin(t * h.hiz + faz) * 0.08;
        h.hedef.scale.set(s, 1 + Math.sin(t * h.hiz + faz) * 0.1, s);
      }
      break;
  }
}

/* ---------------- döngü ---------------- */
function dongu() {
  requestAnimationFrame(dongu);
  const dt = Math.min(0.05, saat.getDelta());
  zaman += dt;
  for (const o of sahne.nesneler) {
    if (rayAraci(o)) continue;
    const g = gorunum.get(o.id);
    if (!g) continue;
    const h = g.userData.hareket;
    g.position.set(o.x, o.tur === 'kus' ? 0.9 : 0, o.z);
    g.rotation.z = 0;
    if (h) animasyon(g, h, zaman);
  }
  trenGuncelle(dt);
  ctx.guncelle(dt, zaman);
  ctx.renderer.render(ctx.scene, ctx.camera);
}

/* ---------------- arayüz bağlama ---------------- */
function arayuzKur() {
  kutuphaneCiz();
  sablonlariCiz();
  dugmeDurum();

  $$('#atmosferler .hava').forEach(b => { b.onclick = () => atmosferSec(b.dataset.hava); });
  $$('.arac[data-mod]').forEach(b => {
    b.onclick = () => {
      mod = b.dataset.mod;
      tc.setMode(mod);
      $$('.arac[data-mod]').forEach(x => x.classList.toggle('secili', x === b));
    };
  });

  $('#btnGeriAl').onclick = geriAl;
  $('#btnYinele').onclick = yinele;
  $('#btnKopyala').onclick = kopyalaSecili;
  $('#btnSil').onclick = () => sil();
  $('#btnKamera').onclick = () => { ctx.kameraSifirla(); toast('Kamera sıfırlandı'); };
  $('#btnPng').onclick = pngAl;
  $('#btnKaydet').onclick = kaydetTikla;
  $('#btnIzgara').onclick = () => {
    izgaraAcik = !izgaraAcik;
    ctx.izgara.visible = izgaraAcik;
    $('#btnIzgara').classList.toggle('acik', izgaraAcik);
    tc.setTranslationSnap(izgaraAcik ? 0.5 : null);
    tc.setRotationSnap(izgaraAcik ? THREE.MathUtils.degToRad(15) : null);
    tc.setScaleSnap(izgaraAcik ? 0.1 : null);
    toast(izgaraAcik ? 'Izgaraya hizalama açık (0,5)' : 'Serbest yerleştirme');
  };
  $('#btnTren').onclick = () => {
    sahne.tren = !sahne.tren;
    $('#btnTren').classList.toggle('acik', sahne.tren);
    if (!rayHatti.hazir && sahne.tren) toast('Ray yok — kütüphaneden ray ekle');
    else toast(sahne.tren ? 'Tren çalışıyor' : 'Tren durdu');
    otoKaydet();
  };
  $('#btnSablon').onclick = () => { $('#sablonOrtu').hidden = false; };
  $('#btnSablonKapat').onclick = () => { $('#sablonOrtu').hidden = true; };
  $('#sablonOrtu').addEventListener('click', (e) => { if (e.target.id === 'sablonOrtu') e.target.hidden = true; });

  const menu = $('#menu');
  $('#btnMenu').onclick = () => { menu.hidden = !menu.hidden; };
  document.addEventListener('click', (e) => {
    if (!menu.hidden && !menu.contains(e.target) && e.target.id !== 'btnMenu') menu.hidden = true;
  });
  menu.querySelectorAll('button').forEach(b => {
    b.onclick = () => {
      menu.hidden = true;
      const e = b.dataset.eylem;
      if (e === 'kaydet') kaydetTikla();
      if (e === 'yukle') yukleTikla();
      if (e === 'disa') jsonDisa();
      if (e === 'ice') $('#dosyaGirisi').click();
      if (e === 'paylas') paylas();
      if (e === 'png') pngAl();
      if (e === 'sifirla') {
        it(); sahne = bosSahne(); secili = null; senkron(); panelGuncelle(); otoKaydet();
        toast('Platform temizlendi');
      }
    };
  });
  $('#dosyaGirisi').addEventListener('change', (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const okuyucu = new FileReader();
    okuyucu.onload = () => jsonIce(String(okuyucu.result));
    okuyucu.readAsText(f);
    e.target.value = '';
  });

  // panel katlama
  $('#btnKatlaSol').onclick = () => $('#panelSol').classList.toggle('kapali');
  $('#btnKatlaSag').onclick = () => $('#panelSag').classList.toggle('kapali');

  // klavye
  window.addEventListener('keydown', (e) => {
    const hedef = e.target;
    if (hedef && (hedef.tagName === 'INPUT' || hedef.tagName === 'TEXTAREA')) return;
    const ctrl = e.ctrlKey || e.metaKey;
    if (ctrl && e.key.toLowerCase() === 'z') { e.preventDefault(); geriAl(); }
    else if (ctrl && (e.key.toLowerCase() === 'y' || (e.shiftKey && e.key.toLowerCase() === 'z'))) { e.preventDefault(); yinele(); }
    else if (ctrl && e.key.toLowerCase() === 'd') { e.preventDefault(); kopyalaSecili(); }
    else if (ctrl && e.key.toLowerCase() === 's') { e.preventDefault(); kaydetTikla(); }
    else if (e.key === 'Delete' || e.key === 'Backspace') { if (secili) { e.preventDefault(); sil(); } }
    else if (e.key === 'Escape') { sec(null); $('#sablonOrtu').hidden = true; $('#menu').hidden = true; }
    else if (e.key === '1') $$('.arac[data-mod]')[0].click();
    else if (e.key === '2') $$('.arac[data-mod]')[1].click();
    else if (e.key === '3') $$('.arac[data-mod]')[2].click();
    else if (e.key.toLowerCase() === 'g') $('#btnIzgara').click();
    else if (e.key.toLowerCase() === 'c') $('#btnKamera').click();
    else if (e.key.toLowerCase() === 'p') pngAl();
  });

  window.addEventListener('resize', () => ctx.boyutAyarla());
}

/* ---------------- başlat ---------------- */
arayuzKur();
ctx.setAtmosfer(sahne.atmosfer);
$$('#atmosferler .hava').forEach(b => b.classList.toggle('secili', b.dataset.hava === sahne.atmosfer));
$('#btnTren').classList.toggle('acik', sahne.tren);
ctx.izgara.visible = izgaraAcik;
tc.setTranslationSnap(0.5);
tc.setRotationSnap(THREE.MathUtils.degToRad(15));
tc.setScaleSnap(0.1);
senkron();
panelGuncelle();
dongu();

requestAnimationFrame(() => {
  setTimeout(() => $('#yukleniyor').classList.add('bitti'), 260);
});

/* ---------------- test / otomasyon köprüsü ---------------- */
window.MW = {
  get hazir() { return gorunum.size > 0; },
  durum: () => sahne,
  sayi: () => sahne.nesneler.length,
  turler: () => [...new Set(sahne.nesneler.map(o => o.tur))],
  katalog: () => KATALOG.map(k => k.id),
  ekle, sil, sec, kopyala: kopyalaSecili, geriAl, yinele,
  atmosfer: atmosferSec,
  mod: (m) => { mod = m; tc.setMode(m); },
  kamera: () => ctx.kameraSifirla(),
  kameraPoz: () => ({ x: +ctx.camera.position.x.toFixed(2), y: +ctx.camera.position.y.toFixed(2), z: +ctx.camera.position.z.toFixed(2) }),
  izgara: (v) => { izgaraAcik = v; ctx.izgara.visible = v; tc.setTranslationSnap(v ? 0.5 : null); },
  tren: (v) => { sahne.tren = v; },
  hat: () => ({ hazir: rayHatti.hazir, kapali: rayHatti.kapali, uzunluk: +rayHatti.uzunluk.toFixed(2), parca: rayHatti.parcaSayisi }),
  trenKonum: () => sahne.nesneler.filter(rayAraci).map(o => {
    const g = gorunum.get(o.id);
    return { tur: o.tur, x: +g.position.x.toFixed(2), y: +g.position.y.toFixed(2), z: +g.position.z.toFixed(2), rot: +g.rotation.y.toFixed(2) };
  }),
  kaydet: kaydetTikla,
  yukle: () => { yukleTikla(); return sahne.nesneler.length; },
  json: () => JSON.stringify(sahne),
  iceriAl: jsonIce,
  png: () => pngAl().slice(0, 30),
  sablon: (id) => {
    const s = SABLONLAR.find(x => x.id === id);
    if (!s) return null;
    it(); sahne = s.kur(); ctx.setAtmosfer(sahne.atmosfer); secili = null; senkron(); panelGuncelle();
    return sahne.nesneler.length;
  },
  secili: () => secili,
  seciliNesne: () => (secili ? veri(secili) : null),
  isikDurumu: () => {
    const a = ATMOSFERLER[sahne.atmosfer];
    let yanan = 0;
    for (const g of gorunum.values()) if (g.userData.gece && g.userData.gece[0] && g.userData.gece[0].emissiveIntensity > 0.1) yanan++;
    return { atmosfer: sahne.atmosfer, gece: a.gece, yananNesne: yanan };
  },
  renkOrnek: () => {
    const c = ctx.renderer.domElement;
    const tmp = document.createElement('canvas');
    tmp.width = tmp.height = 8;
    tmp.getContext('2d').drawImage(c, 0, 0, 8, 8);
    return tmp.toDataURL().length;
  },
};
console.log('%cNumex Minyatür Dünya hazır', 'color:#f0b45f;font-weight:bold');
