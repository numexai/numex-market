// Prosedürel nesne kütüphanesi — 29 nesne, hepsi kodla üretilir.
import * as THREE from 'three';
import { mat, isikMalzeme, hale, haleDoku, ahsapDoku, suMalzemesi, selaleMalzemesi } from './materials.js';

/* ---------- kısayollar ---------- */
const kutu = (w, h, d, m, x = 0, y = 0, z = 0) => {
  const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
  o.position.set(x, y, z); return o;
};
const sil = (rt, rb, h, m, x = 0, y = 0, z = 0, seg = 14) => {
  const o = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), m);
  o.position.set(x, y, z); return o;
};
const kure = (r, m, x = 0, y = 0, z = 0, seg = 16) => {
  const o = new THREE.Mesh(new THREE.SphereGeometry(r, seg, seg), m);
  o.position.set(x, y, z); return o;
};
// üçgen prizma çatı (sırtı Z ekseninde)
function catı(w, h, d, m) {
  const s = new THREE.Shape();
  s.moveTo(-w / 2, 0); s.lineTo(w / 2, 0); s.lineTo(0, h); s.closePath();
  const g = new THREE.ExtrudeGeometry(s, { depth: d, bevelEnabled: false, curveSegments: 1 });
  g.translate(0, 0, -d / 2);
  return new THREE.Mesh(g, m);
}
function parlak(g, liste) { if (liste) g.userData.gece = liste; return g; }

/* =====================  YAPILAR  ===================== */
function ev() {
  const g = new THREE.Group();
  const duvar = mat('#efe3cd', { puruz: 0.9 });
  const catiM = mat('#b4553f', { puruz: 0.85 });
  const ahsap = mat('#8a5a34', { puruz: 0.8, harita: ahsapDoku() });
  const camM = isikMalzeme('#26435c', '#ffca72');
  const gece = [camM];

  g.add(kutu(1.24, 0.72, 1.0, duvar, 0, 0.36, 0));
  const c = catı(1.4, 0.42, 1.12, catiM); c.position.y = 0.72; g.add(c);
  g.add(kutu(0.2, 0.42, 0.06, ahsap, 0, 0.21, 0.52));
  g.add(kutu(0.06, 0.06, 0.02, mat('#e8c477', { metal: 0.4, puruz: 0.4 }), 0.07, 0.21, 0.55));
  [[-0.36, 0.42], [0.36, 0.42]].forEach(([x, y]) => {
    g.add(kutu(0.26, 0.24, 0.04, camM, x, y, 0.51));
    g.add(kutu(0.3, 0.28, 0.03, mat('#f6f1e6'), x, y, 0.5));
  });
  g.add(kutu(0.26, 0.24, 0.04, camM, -0.52, 0.42, 0));
  g.add(kutu(0.24, 0.06, 0.24, mat('#9a9a95'), 0.34, 0.86, -0.18));
  g.add(sil(0.035, 0.035, 0.34, mat('#f2ede2'), -0.3, 0.17, 0.18));
  return parlak(g, gece);
}

function kafe() {
  const g = new THREE.Group();
  const govde = mat('#e7d9c3', { puruz: 0.88 });
  const ahsap = mat('#7b4f2e', { harita: ahsapDoku(), puruz: 0.8 });
  const camM = isikMalzeme('#31566b', '#ffcf7d');
  const gece = [camM];
  g.add(kutu(1.5, 0.78, 1.1, govde, 0, 0.39, 0));
  g.add(kutu(1.58, 0.08, 1.18, mat('#c96b4b'), 0, 0.8, 0));
  // çizgili tente
  const tente = new THREE.Group();
  for (let i = 0; i < 7; i++) {
    const m = mat(i % 2 ? '#f2f0e9' : '#cf5c46');
    const p = kutu(0.2, 0.04, 0.52, m, -0.6 + i * 0.2, 0, 0.26);
    p.rotation.x = -0.28; tente.add(p);
  }
  tente.position.set(0, 0.74, 0.5); g.add(tente);
  g.add(kutu(1.1, 0.4, 0.05, camM, 0, 0.4, 0.56));
  g.add(kutu(1.16, 0.46, 0.03, ahsap, 0, 0.4, 0.55));
  // masalar
  [[-0.95, 0.72], [0.95, 0.72]].forEach(([x, z]) => {
    g.add(sil(0.03, 0.03, 0.24, mat('#4a4a4a', { metal: 0.5, puruz: 0.5 }), x, 0.12, z));
    g.add(sil(0.16, 0.16, 0.03, mat('#f4efe4'), x, 0.25, z));
  });
  // şemsiye
  const s = new THREE.Group();
  s.add(sil(0.02, 0.02, 0.62, mat('#6b6b66'), 0, 0.31, 0));
  const kub = new THREE.Mesh(new THREE.ConeGeometry(0.36, 0.22, 8, 1, true), mat('#d9684f', { cift: true }));
  kub.position.y = 0.66; s.add(kub);
  s.position.set(0.95, 0, 1.05); g.add(s);
  // tabela
  g.add(kutu(0.5, 0.16, 0.03, isikMalzeme('#f0e2c4', '#ffd28a'), 0, 0.98, 0.57));
  return parlak(g, gece);
}

function kulube() {
  const g = new THREE.Group();
  const kütük = mat('#8b5a33', { harita: ahsapDoku(), puruz: 0.9 });
  const koyu = mat('#6d4425', { puruz: 0.9 });
  for (let i = 0; i < 5; i++) {
    const y = 0.1 + i * 0.16;
    const k = sil(0.09, 0.09, 0.9, kütük, 0, y, 0, 8);
    k.rotation.z = Math.PI / 2; g.add(k);
    const k2 = sil(0.09, 0.09, 0.9, kütük, 0, y, 0.36, 8);
    k2.rotation.z = Math.PI / 2; g.add(k2);
    const k3 = sil(0.09, 0.09, 0.9, kütük, 0, y, -0.36, 8);
    k3.rotation.z = Math.PI / 2; g.add(k3);
  }
  g.add(kutu(0.02, 0.8, 0.72, koyu, -0.45, 0.4, 0));
  g.add(kutu(0.02, 0.8, 0.72, koyu, 0.45, 0.4, 0));
  const c = catı(1.1, 0.34, 1.05, mat('#5e4632')); c.position.y = 0.86; g.add(c);
  g.add(kutu(0.22, 0.34, 0.04, mat('#4b3320'), 0, 0.17, 0.37));
  const camM = isikMalzeme('#2c4257', '#ffc266');
  g.add(kutu(0.18, 0.16, 0.03, camM, 0.22, 0.5, 0.37));
  return parlak(g, [camM]);
}

function fener() {
  const g = new THREE.Group();
  const beyaz = mat('#f3f1ea', { puruz: 0.7 });
  const kirmizi = mat('#c9483a', { puruz: 0.7 });
  g.add(sil(0.34, 0.42, 0.2, mat('#8d8b84'), 0, 0.1, 0));
  g.add(sil(0.15, 0.26, 1.25, beyaz, 0, 0.72, 0));
  [0.45, 0.85, 1.12].forEach((y, i) => {
    g.add(sil(0.175 + i * 0.012, 0.2 + i * 0.012, 0.11, kirmizi, 0, y, 0));
  });
  const lamba = isikMalzeme('#ffe9b0', '#ffd27a');
  g.add(kutu(0.24, 0.2, 0.24, lamba, 0, 1.44, 0));
  g.add(sil(0.02, 0.2, 0.16, mat('#3c4048', { metal: 0.6, puruz: 0.4 }), 0, 1.62, 0));
  const h = hale(); h.scale.set(0.85, 0.85, 1); h.position.y = 1.44; g.add(h);
  g.userData.hale = h;
  return parlak(g, [lamba]);
}

function yeldegirmeni() {
  const g = new THREE.Group();
  const govde = mat('#e3d6bd', { puruz: 0.9 });
  g.add(sil(0.2, 0.42, 1.0, govde, 0, 0.5, 0, 10));
  g.add(sil(0.26, 0.24, 0.14, mat('#8a5a34'), 0, 1.05, 0, 10));
  const kanat = new THREE.Group();
  const kol = mat('#6d4425');
  for (let i = 0; i < 4; i++) {
    const k = new THREE.Group();
    k.add(kutu(0.05, 0.62, 0.02, kol, 0, 0.34, 0));
    k.add(kutu(0.16, 0.5, 0.01, mat('#f1e8d6', { cift: true }), 0.11, 0.4, 0));
    k.rotation.z = (i * Math.PI) / 2;
    kanat.add(k);
  }
  kanat.position.set(0, 1.05, 0.2); g.add(kanat);
  g.add(kutu(0.18, 0.32, 0.04, isikMalzeme('#3b3f47', '#ffc26b'), 0, 0.28, 0.19));
  g.userData.hareket = { tip: 'don', hedef: kanat, hiz: 0.9 };
  return g;
}

/* =====================  DOĞA  ===================== */
function agac() {
  const g = new THREE.Group();
  const govde = mat('#6b4a2c', { puruz: 0.95 });
  const y1 = sil(0.07, 0.11, 0.52, govde, 0, 0.26, 0, 8);
  g.add(y1);
  const yaprak = [mat('#4e8a3f', { duz: true, puruz: 0.9 }), mat('#5f9c47', { duz: true }), mat('#3f7436', { duz: true })];
  const tepeler = [
    [0, 0.72, 0, 0.34], [-0.2, 0.6, 0.1, 0.24], [0.21, 0.63, -0.06, 0.22], [0.03, 0.92, 0.02, 0.2],
  ];
  tepeler.forEach(([x, y, z, r], i) => {
    const m = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 1), yaprak[i % 3]);
    m.position.set(x, y, z); g.add(m);
  });
  g.userData.hareket = { tip: 'salinim', siddet: 0.012, faz: Math.random() * 6 };
  return g;
}

function cam() {
  const g = new THREE.Group();
  g.add(sil(0.06, 0.09, 0.3, mat('#5c3f26'), 0, 0.15, 0, 8));
  const m = mat('#2f6b45', { duz: true, puruz: 0.9 });
  [[0.28, 0.42, 0.34], [0.5, 0.30, 0.27], [0.72, 0.22, 0.2]].forEach(([y, r, h]) => {
    const k = new THREE.Mesh(new THREE.ConeGeometry(r, h + 0.24, 9), m);
    k.position.y = y + 0.12; g.add(k);
  });
  return g;
}

function cicek() {
  const g = new THREE.Group();
  g.add(sil(0.014, 0.018, 0.3, mat('#3f7a34'), 0, 0.15, 0, 6));
  g.add(kure(0.05, mat('#3f7a34', { duz: true }), 0.05, 0.16, 0, 8));
  const renk = ['#e86a8a', '#f2c14e', '#d96fd0', '#f0f0f0'][Math.floor(Math.random() * 4)];
  const taç = mat(renk, { duz: true, puruz: 0.6 });
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    const y = kure(0.038, taç, Math.cos(a) * 0.052, 0.31, Math.sin(a) * 0.052, 8);
    y.scale.set(1, 0.6, 1); g.add(y);
  }
  g.add(kure(0.026, mat('#f6d365'), 0, 0.315, 0, 8));
  return g;
}

function cali() {
  const g = new THREE.Group();
  const m = mat('#3f7a3c', { duz: true });
  const m2 = mat('#4f8f45', { duz: true });
  [[0, 0.14, 0, 0.18], [0.13, 0.11, 0.05, 0.12], [-0.12, 0.1, -0.04, 0.13]].forEach(([x, y, z, r], i) => {
    const b = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 1), i % 2 ? m2 : m);
    b.position.set(x, y, z); b.scale.y = 0.85; g.add(b);
  });
  return g;
}

function tas() {
  const g = new THREE.Group();
  const m = mat('#9b9a94', { duz: true, puruz: 0.95 });
  const b = new THREE.Mesh(new THREE.DodecahedronGeometry(0.22, 0), m);
  b.scale.set(1, 0.72, 0.86); b.rotation.set(0.4, 0.9, 0.2); b.position.y = 0.13; g.add(b);
  const k = new THREE.Mesh(new THREE.DodecahedronGeometry(0.11, 0), m);
  k.position.set(0.2, 0.07, 0.12); k.rotation.y = 1.2; g.add(k);
  return g;
}

function golet() {
  const g = new THREE.Group();
  const su = new THREE.Mesh(new THREE.CircleGeometry(0.95, 48), suMalzemesi());
  su.rotation.x = -Math.PI / 2; su.position.y = 0.045; g.add(su);
  // taş bilezik
  const tm = mat('#8d8c86', { duz: true, puruz: 0.95 });
  for (let i = 0; i < 22; i++) {
    const a = (i / 22) * Math.PI * 2;
    const r = 0.95 + (Math.random() - 0.5) * 0.05;
    const t = new THREE.Mesh(new THREE.DodecahedronGeometry(0.08 + Math.random() * 0.05, 0), tm);
    t.position.set(Math.cos(a) * r, 0.03, Math.sin(a) * r);
    t.rotation.set(Math.random(), Math.random(), Math.random());
    g.add(t);
  }
  g.add(sil(0.98, 0.98, 0.04, mat('#4a6b52', { puruz: 0.95 }), 0, 0.015, 0, 32));
  g.userData.su = true;
  return g;
}

function selale() {
  const g = new THREE.Group();
  const kayaM = mat('#7d7b74', { duz: true, puruz: 0.95 });
  for (let i = 0; i < 7; i++) {
    const k = new THREE.Mesh(new THREE.DodecahedronGeometry(0.18 + Math.random() * 0.1, 0), kayaM);
    k.position.set(-0.45 + i * 0.15, 0.12 + Math.random() * 0.25, -0.1 + Math.random() * 0.2);
    k.rotation.set(Math.random(), Math.random(), Math.random());
    k.scale.set(1, 1.4, 0.9); g.add(k);
  }
  const su = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.9, 1, 8), selaleMalzemesi());
  su.position.set(0, 0.45, 0.12); g.add(su);
  // düşüş havuzu
  const havuz = new THREE.Mesh(new THREE.CircleGeometry(0.45, 28), suMalzemesi());
  havuz.rotation.x = -Math.PI / 2; havuz.position.set(0, 0.05, 0.44); g.add(havuz);
  g.userData.su = true;
  return g;
}

/* =====================  KENT  ===================== */
function lamba() {
  const g = new THREE.Group();
  const demir = mat('#2f333a', { metal: 0.65, puruz: 0.42 });
  g.add(sil(0.09, 0.11, 0.06, demir, 0, 0.03, 0, 10));
  g.add(sil(0.03, 0.04, 0.98, demir, 0, 0.52, 0, 10));
  g.add(kutu(0.22, 0.03, 0.03, demir, 0.09, 0.99, 0));
  const ampul = isikMalzeme('#fff0cd', '#ffc470');
  g.add(kutu(0.12, 0.06, 0.12, ampul, 0.18, 0.95, 0));
  g.add(sil(0.1, 0.06, 0.06, demir, 0.18, 1.0, 0, 8));
  const h = hale(); h.scale.set(1.1, 1.1, 1); h.position.set(0.18, 0.93, 0); g.add(h);
  g.userData.hale = h;
  return parlak(g, [ampul]);
}

function bank() {
  const g = new THREE.Group();
  const ahsap = mat('#a9713f', { harita: ahsapDoku(), puruz: 0.8 });
  const demir = mat('#33373d', { metal: 0.6, puruz: 0.45 });
  for (let i = 0; i < 3; i++) g.add(kutu(1.0, 0.05, 0.12, ahsap, 0, 0.24, -0.13 + i * 0.13));
  for (let i = 0; i < 2; i++) g.add(kutu(1.0, 0.1, 0.05, ahsap, 0, 0.42 + i * 0.13, -0.24));
  [[-0.42], [0.42]].forEach(([x]) => {
    g.add(kutu(0.05, 0.26, 0.05, demir, x, 0.12, 0.13));
    g.add(kutu(0.05, 0.26, 0.05, demir, x, 0.12, -0.18));
    g.add(kutu(0.05, 0.3, 0.05, demir, x, 0.4, -0.25));
  });
  return g;
}

function cit() {
  const g = new THREE.Group();
  const m = mat('#e6dfd0', { puruz: 0.85 });
  for (let i = 0; i < 4; i++) {
    g.add(kutu(0.07, 0.42, 0.07, m, -0.9 + i * 0.6, 0.21, 0));
    g.add(kutu(0.07, 0.05, 0.07, m, -0.9 + i * 0.6, 0.44, 0));
  }
  g.add(kutu(1.9, 0.06, 0.04, m, 0, 0.32, 0));
  g.add(kutu(1.9, 0.06, 0.04, m, 0, 0.15, 0));
  return g;
}

function tabela() {
  const g = new THREE.Group();
  g.add(sil(0.03, 0.03, 0.6, mat('#6b4a2c'), 0, 0.3, 0, 8));
  g.add(kutu(0.62, 0.3, 0.04, mat('#f2ead9', { puruz: 0.8 }), 0, 0.62, 0));
  g.add(kutu(0.56, 0.2, 0.05, mat('#8a6a44'), 0, 0.62, 0.02));
  g.add(kutu(0.26, 0.035, 0.06, mat('#f4e6c8'), 0, 0.66, 0.03));
  g.add(kutu(0.34, 0.035, 0.06, mat('#f4e6c8'), 0, 0.58, 0.03));
  return g;
}

function heykel() {
  const g = new THREE.Group();
  const t = mat('#b8b4a8', { puruz: 0.9 });
  g.add(kutu(0.4, 0.16, 0.4, mat('#8f8c84'), 0, 0.08, 0));
  g.add(kutu(0.28, 0.3, 0.28, t, 0, 0.31, 0));
  g.add(sil(0.05, 0.07, 0.34, t, 0, 0.63, 0, 8));
  g.add(kure(0.09, t, 0, 0.86, 0, 12));
  const kol = sil(0.03, 0.03, 0.3, t, -0.12, 0.72, 0, 8); kol.rotation.z = 0.6; g.add(kol);
  return g;
}

function salincak() {
  const g = new THREE.Group();
  const m = mat('#7d5a3c', { harita: ahsapDoku(), puruz: 0.85 });
  [[-0.42], [0.42]].forEach(([x]) => {
    const a = kutu(0.06, 0.8, 0.06, m, x, 0.4, -0.22); a.rotation.x = -0.22; g.add(a);
    const b = kutu(0.06, 0.8, 0.06, m, x, 0.4, 0.22); b.rotation.x = 0.22; g.add(b);
  });
  g.add(kutu(0.96, 0.06, 0.06, m, 0, 0.8, 0));
  const sal = new THREE.Group();
  sal.position.set(0, 0.78, 0);
  const ip1 = kutu(0.015, 0.42, 0.015, mat('#c9c2b2'), -0.16, -0.21, 0);
  const ip2 = kutu(0.015, 0.42, 0.015, mat('#c9c2b2'), 0.16, -0.21, 0);
  sal.add(ip1, ip2, kutu(0.36, 0.04, 0.2, mat('#c96b4b'), 0, -0.44, 0));
  g.add(sal);
  g.userData.hareket = { tip: 'sallan', hedef: sal, hiz: 1.4, genlik: 0.45 };
  return g;
}

function fiskiye() {
  const g = new THREE.Group();
  g.add(sil(0.42, 0.46, 0.16, mat('#a9a69c'), 0, 0.08, 0, 20));
  const su = new THREE.Mesh(new THREE.CircleGeometry(0.36, 24), suMalzemesi());
  su.rotation.x = -Math.PI / 2; su.position.y = 0.14; g.add(su);
  g.add(sil(0.06, 0.1, 0.24, mat('#a9a69c'), 0, 0.24, 0, 12));
  const jet = sil(0.02, 0.055, 0.42, new THREE.MeshStandardMaterial({
    color: 0xbfe6ef, transparent: true, opacity: 0.55, roughness: 0.2,
  }), 0, 0.5, 0, 10);
  g.add(jet);
  g.userData.hareket = { tip: 'nabiz', hedef: jet, hiz: 3.2, genlik: 0.55 };
  g.userData.su = true;
  return g;
}

function kopru() {
  const g = new THREE.Group();
  const ahsap = mat('#8a5c33', { harita: ahsapDoku(), puruz: 0.85 });
  const tas = mat('#8f8d86', { puruz: 0.95 });
  const d = new THREE.Group();
  for (let i = 0; i < 9; i++) d.add(kutu(0.62, 0.05, 0.16, ahsap, 0, Math.sin(i * 0.35) * 0.06, -0.64 + i * 0.16));
  g.add(d);
  [[-0.3], [0.3]].forEach(([x]) => {
    g.add(kutu(0.04, 0.3, 1.6, tas, x, -0.08, 0));
    for (let i = 0; i < 5; i++) g.add(kutu(0.05, 0.22, 0.05, ahsap, x, 0.22, -0.6 + i * 0.3));
    g.add(kutu(0.05, 0.05, 1.5, ahsap, x, 0.33, 0));
  });
  return g;
}

function araba() {
  const g = new THREE.Group();
  const govde = mat('#cf4f3f', { puruz: 0.35, metal: 0.35 });
  g.add(kutu(0.5, 0.16, 0.86, govde, 0, 0.16, 0));
  g.add(kutu(0.44, 0.16, 0.4, mat('#9fb6c4', { puruz: 0.2, metal: 0.2 }), 0, 0.31, -0.02));
  const teker = mat('#26282c', { puruz: 0.85 });
  [[-0.26, 0.28], [0.26, 0.28], [-0.26, -0.28], [0.26, -0.28]].forEach(([x, z]) => {
    const geo = new THREE.CylinderGeometry(0.075, 0.075, 0.07, 12);
    geo.rotateZ(Math.PI / 2);
    const t = new THREE.Mesh(geo, teker); t.position.set(x, 0.075, z); g.add(t);
  });
  const far = isikMalzeme('#fff3cf', '#ffe08a');
  g.add(kutu(0.1, 0.05, 0.03, far, 0.15, 0.18, 0.43));
  g.add(kutu(0.1, 0.05, 0.03, far, -0.15, 0.18, 0.43));
  return parlak(g, [far]);
}

/* =====================  ULAŞIM  ===================== */
function ray() {
  const g = new THREE.Group();
  const maden = mat('#6f7378', { metal: 0.85, puruz: 0.32 });
  const travers = mat('#5b422c', { harita: ahsapDoku(), puruz: 0.9 });
  // balast yatağı
  g.add(kutu(0.86, 0.05, 2.0, mat('#7a6f5e', { duz: true, puruz: 0.98 }), 0, 0.025, 0));
  for (let i = 0; i < 8; i++) g.add(kutu(0.72, 0.045, 0.12, travers, 0, 0.06, -0.875 + i * 0.25));
  g.add(kutu(0.05, 0.06, 2.0, maden, -0.24, 0.11, 0));
  g.add(kutu(0.05, 0.06, 2.0, maden, 0.24, 0.11, 0));
  g.userData.ray = { uzunluk: 2.0 };
  return g;
}

function tekerli(m, r = 0.07, x = 0, z = 0) {
  const geo = new THREE.CylinderGeometry(r, r, 0.05, 12);
  geo.rotateZ(Math.PI / 2);
  const t = new THREE.Mesh(geo, m); t.position.set(x, r, z);
  return t;
}

function lokomotif() {
  const g = new THREE.Group();
  const yesil = mat('#2f6b4f', { puruz: 0.35, metal: 0.25 });
  const siyah = mat('#25272b', { puruz: 0.5, metal: 0.4 });
  const pirinc = mat('#d6a24a', { metal: 0.85, puruz: 0.25 });
  const camM = isikMalzeme('#2b3f4a', '#ffd07a');

  g.add(kutu(0.34, 0.05, 1.1, siyah, 0, 0.12, 0));        // şasi
  g.add(kutu(0.36, 0.26, 0.44, yesil, 0, 0.29, -0.3));    // kabin
  g.add(kutu(0.32, 0.06, 0.4, siyah, 0, 0.44, -0.3));
  g.add(kutu(0.14, 0.12, 0.03, camM, 0, 0.32, -0.075));   // kabin camı
  const kazan = sil(0.115, 0.115, 0.52, yesil, 0, 0.26, 0.16, 14);
  kazan.rotation.x = Math.PI / 2; g.add(kazan);
  g.add(sil(0.05, 0.06, 0.2, siyah, 0, 0.44, 0.3, 10));   // baca
  g.add(kutu(0.3, 0.03, 0.12, pirinc, 0, 0.36, 0.42));     // ön tampon
  g.add(kutu(0.16, 0.1, 0.02, isikMalzeme('#fff2cf', '#ffe08a'), 0, 0.24, 0.52));
  const tekerM = mat('#3a3d42', { metal: 0.6, puruz: 0.4 });
  [-0.24, 0, 0.24].forEach(z => {
    g.add(tekerli(tekerM, 0.075, 0.17, z));
    g.add(tekerli(tekerM, 0.075, -0.17, z));
  });
  g.add(tekerli(tekerM, 0.055, 0.17, -0.36));
  g.add(tekerli(tekerM, 0.055, -0.17, -0.36));
  g.userData.rayAraci = true;
  g.userData.uzunluk = 1.15;
  return parlak(g, [camM]);
}

function vagon() {
  const g = new THREE.Group();
  const govde = mat('#8a4b3a', { harita: ahsapDoku(), puruz: 0.8 });
  const siyah = mat('#25272b', { puruz: 0.5, metal: 0.4 });
  g.add(kutu(0.34, 0.05, 0.96, siyah, 0, 0.12, 0));
  g.add(kutu(0.36, 0.3, 0.8, govde, 0, 0.3, 0));
  g.add(kutu(0.4, 0.05, 0.86, mat('#5f6670', { metal: 0.4, puruz: 0.5 }), 0, 0.47, 0));
  g.add(kutu(0.2, 0.02, 0.02, siyah, 0, 0.22, 0.5));
  const tekerM = mat('#3a3d42', { metal: 0.6, puruz: 0.4 });
  [-0.3, 0.3].forEach(z => {
    g.add(tekerli(tekerM, 0.065, 0.17, z));
    g.add(tekerli(tekerM, 0.065, -0.17, z));
  });
  g.userData.rayAraci = true;
  g.userData.uzunluk = 1.0;
  return g;
}

function kayik() {
  const g = new THREE.Group();
  const govde = mat('#b5643c', { puruz: 0.7 });
  const tekne = new THREE.Mesh(new THREE.CapsuleGeometry(0.12, 0.42, 4, 12), govde);
  tekne.rotation.x = Math.PI / 2; tekne.scale.set(1, 1, 0.62); tekne.position.y = 0.1;
  g.add(tekne);
  g.add(kutu(0.24, 0.03, 0.5, mat('#e0d6c0'), 0, 0.16, 0));
  g.add(sil(0.012, 0.012, 0.5, mat('#6b4a2c'), 0, 0.4, 0, 6));
  const yelken = new THREE.Mesh(new THREE.PlaneGeometry(0.32, 0.4), mat('#f4efe2', { cift: true, puruz: 0.9 }));
  yelken.position.set(0, 0.44, 0.02); yelken.rotation.y = 0.2; g.add(yelken);
  g.userData.hareket = { tip: 'yalpa', hiz: 1.1, genlik: 0.05 };
  return g;
}

/* =====================  CANLI  ===================== */
function insan() {
  const g = new THREE.Group();
  const ten = mat('#e0b08a', { puruz: 0.8 });
  const giysi = mat(['#3f6fa8', '#a8493f', '#4f7f52', '#77548f'][Math.floor(Math.random() * 4)], { puruz: 0.85 });
  const bacakM = mat('#3b4049', { puruz: 0.85 });
  const govde = new THREE.Mesh(new THREE.CapsuleGeometry(0.075, 0.13, 4, 10), giysi);
  govde.position.y = 0.44; g.add(govde);
  g.add(kure(0.075, ten, 0, 0.62, 0, 12));
  const solB = new THREE.Mesh(new THREE.CapsuleGeometry(0.028, 0.14, 3, 6), bacakM);
  solB.position.set(-0.042, 0.17, 0); g.add(solB);
  const sagB = new THREE.Mesh(new THREE.CapsuleGeometry(0.028, 0.14, 3, 6), bacakM);
  sagB.position.set(0.042, 0.17, 0); g.add(sagB);
  const solK = new THREE.Mesh(new THREE.CapsuleGeometry(0.024, 0.12, 3, 6), ten);
  solK.position.set(-0.1, 0.44, 0); g.add(solK);
  const sagK = new THREE.Mesh(new THREE.CapsuleGeometry(0.024, 0.12, 3, 6), ten);
  sagK.position.set(0.1, 0.44, 0); g.add(sagK);
  g.userData.hareket = { tip: 'insan', hedef: g, kollar: [solK, sagK], bacaklar: [solB, sagB], faz: Math.random() * 6 };
  return g;
}

function kopek() {
  const g = new THREE.Group();
  const tuylu = mat('#b98450', { puruz: 0.9 });
  const govde = new THREE.Mesh(new THREE.CapsuleGeometry(0.075, 0.2, 4, 10), tuylu);
  govde.rotation.x = Math.PI / 2; govde.position.y = 0.19; g.add(govde);
  const kafa = kure(0.08, tuylu, 0, 0.28, 0.19, 12); g.add(kafa);
  g.add(kutu(0.07, 0.06, 0.09, mat('#8e6136'), 0, 0.25, 0.27));
  g.add(kure(0.018, mat('#2b2b2b'), -0.03, 0.31, 0.25, 6));
  g.add(kure(0.018, mat('#2b2b2b'), 0.03, 0.31, 0.25, 6));
  [[-0.045, 0.1], [0.045, 0.1], [-0.045, -0.09], [0.045, -0.09]].forEach(([x, z]) => {
    g.add(kutu(0.035, 0.12, 0.035, mat('#a06e3f'), x, 0.07, z));
  });
  const kuyruk = new THREE.Group(); kuyruk.position.set(0, 0.23, -0.16);
  kuyruk.add(kutu(0.03, 0.03, 0.16, tuylu, 0, 0.06, -0.08));
  g.add(kuyruk);
  g.userData.hareket = { tip: 'kuyruk', hedef: kuyruk, hiz: 7, eksen: 'y' };
  return g;
}

function kedi() {
  const g = new THREE.Group();
  const t = mat('#6f6a63', { puruz: 0.9 });
  const govde = new THREE.Mesh(new THREE.CapsuleGeometry(0.055, 0.16, 4, 10), t);
  govde.rotation.x = Math.PI / 2; govde.position.y = 0.12; g.add(govde);
  g.add(kure(0.055, t, 0, 0.18, 0.13, 12));
  [[-0.03, 0.03], [0.03, 0.03]].forEach(([x, y]) => {
    const k = new THREE.Mesh(new THREE.ConeGeometry(0.022, 0.05, 4), t);
    k.position.set(x, y + 0.16, 0.13); g.add(k);
  });
  const kuyruk = new THREE.Group(); kuyruk.position.set(0, 0.13, -0.12);
  kuyruk.add(kutu(0.02, 0.2, 0.02, t, 0, 0.08, -0.02));
  g.add(kuyruk);
  g.userData.hareket = { tip: 'kuyruk', hedef: kuyruk, hiz: 2.6, eksen: 'z' };
  return g;
}

function kus() {
  const g = new THREE.Group();
  const t = mat('#4a6fa8', { puruz: 0.8 });
  const g2 = kure(0.06, t, 0, 0, 0, 10); g2.scale.set(0.9, 0.85, 1.3); g.add(g2);
  g.add(kure(0.042, t, 0, 0.03, 0.07, 10));
  g.add(new THREE.Mesh(new THREE.ConeGeometry(0.012, 0.04, 6), mat('#e0a13c')).translateY(0.03).translateZ(0.12));
  const solK = new THREE.Group(); solK.position.x = -0.03;
  solK.add(kutu(0.14, 0.012, 0.08, mat('#5b83bd', { cift: true }), -0.07, 0, 0));
  const sagK = new THREE.Group(); sagK.position.x = 0.03;
  sagK.add(kutu(0.14, 0.012, 0.08, mat('#5b83bd', { cift: true }), 0.07, 0, 0));
  g.add(solK, sagK);
  g.position.y = 0.9;
  g.userData.hareket = { tip: 'ucus', kanatlar: [solK, sagK], faz: Math.random() * 6 };
  return g;
}

/* =====================  KATALOG  ===================== */
export const KATALOG = [
  { id: 'ev', ad: 'Ev', ikon: '🏠', kat: 'Yapılar', yap: ev },
  { id: 'kafe', ad: 'Kafe', ikon: '☕', kat: 'Yapılar', yap: kafe },
  { id: 'kulube', ad: 'Kulübe', ikon: '🛖', kat: 'Yapılar', yap: kulube },
  { id: 'fener', ad: 'Deniz feneri', ikon: '🗼', kat: 'Yapılar', yap: fener },
  { id: 'yeldegirmeni', ad: 'Yel değirmeni', ikon: '🌬️', kat: 'Yapılar', yap: yeldegirmeni },

  { id: 'agac', ad: 'Ağaç', ikon: '🌳', kat: 'Doğa', yap: agac },
  { id: 'cam', ad: 'Çam', ikon: '🌲', kat: 'Doğa', yap: cam },
  { id: 'cicek', ad: 'Çiçek', ikon: '🌸', kat: 'Doğa', yap: cicek },
  { id: 'cali', ad: 'Çalı', ikon: '🌿', kat: 'Doğa', yap: cali },
  { id: 'tas', ad: 'Taş', ikon: '🪨', kat: 'Doğa', yap: tas },
  { id: 'golet', ad: 'Gölet', ikon: '💧', kat: 'Doğa', yap: golet },
  { id: 'selale', ad: 'Şelale', ikon: '🏞️', kat: 'Doğa', yap: selale },

  { id: 'lamba', ad: 'Sokak lambası', ikon: '🏮', kat: 'Kent', yap: lamba },
  { id: 'bank', ad: 'Bank', ikon: '🪑', kat: 'Kent', yap: bank },
  { id: 'cit', ad: 'Çit', ikon: '🚧', kat: 'Kent', yap: cit },
  { id: 'tabela', ad: 'Tabela', ikon: '🪧', kat: 'Kent', yap: tabela },
  { id: 'heykel', ad: 'Heykel', ikon: '🗿', kat: 'Kent', yap: heykel },
  { id: 'salincak', ad: 'Salıncak', ikon: '🎠', kat: 'Kent', yap: salincak },
  { id: 'fiskiye', ad: 'Fıskiye', ikon: '⛲', kat: 'Kent', yap: fiskiye },
  { id: 'kopru', ad: 'Köprü', ikon: '🌉', kat: 'Kent', yap: kopru },
  { id: 'araba', ad: 'Araba', ikon: '🚗', kat: 'Kent', yap: araba },

  { id: 'ray', ad: 'Tren rayı', ikon: '🛤️', kat: 'Ulaşım', yap: ray },
  { id: 'lokomotif', ad: 'Lokomotif', ikon: '🚂', kat: 'Ulaşım', yap: lokomotif },
  { id: 'vagon', ad: 'Vagon', ikon: '🚃', kat: 'Ulaşım', yap: vagon },
  { id: 'kayik', ad: 'Kayık', ikon: '⛵', kat: 'Ulaşım', yap: kayik },

  { id: 'insan', ad: 'İnsan', ikon: '🧍', kat: 'Canlı', yap: insan },
  { id: 'kopek', ad: 'Köpek', ikon: '🐕', kat: 'Canlı', yap: kopek },
  { id: 'kedi', ad: 'Kedi', ikon: '🐈', kat: 'Canlı', yap: kedi },
  { id: 'kus', ad: 'Kuş', ikon: '🐦', kat: 'Canlı', yap: kus },
];

export const KATEGORILER = ['Yapılar', 'Doğa', 'Kent', 'Ulaşım', 'Canlı'];

/** Türden yeni bir sahne nesnesi üretir. */
export function nesneUret(tur) {
  const kayit = KATALOG.find(k => k.id === tur);
  if (!kayit) throw new Error('Bilinmeyen nesne türü: ' + tur);
  const g = kayit.yap();
  g.name = tur;
  g.traverse(o => {
    if (o.isMesh) {
      o.castShadow = true;
      o.receiveShadow = true;
    }
  });
  return g;
}

/** Gece/gündüz: nesnenin kendi ışıklarını ayarlar. */
export function geceAta(g, katsayi) {
  if (!g) return;
  const liste = g.userData.gece;
  if (liste) liste.forEach(m => { m.emissiveIntensity = katsayi; });
  if (g.userData.hale) {
    g.userData.hale.material.opacity = katsayi > 0.05 ? 0.42 * Math.min(1, katsayi) : 0;
    g.userData.hale.visible = katsayi > 0.05;
  }
}
