// Dream City — tren, arabalar, yayalar
// Kural: hepsi kendi yolunda döner; kullanıcı uyurken de şehir yaşamaya devam eder.

import * as THREE from '../vendor/three.module.js';
import { ADIM, YARIM, YOL_GENIS } from './city.js';
import { aralik, sans, sec, rast } from './utils.js';

const KENAR = YARIM * ADIM; // şehrin iç sınırı

export class Hareket {
  constructor(sahne, sehir) {
    this.sahne = sahne;
    this.sehir = sehir;
    this.grup = new THREE.Group();
    sahne.add(this.grup);

    this._raylar();
    this._tren();
    this._arabalar();
    this._yayalar();
  }

  // ---------- raylar (şehrin dış çeperi) ----------
  _raylar() {
    // Raylar şehrin DIŞINDA dolaşsın (blokların üstünden geçmesin)
    const yarı = YARIM * ADIM + ADIM * 0.5 + 4;
    const rayMat = this.sehir.matRay;
    const traversMat = new THREE.MeshStandardMaterial({ color: 0x5a4638, roughness: 1 });

    // dört kenar boyunca çift ray
    const kenarlar = [
      { x: 0, z: -yarı, rot: 0, len: (yarı + 2) * 2 },
      { x: 0, z: yarı, rot: 0, len: (yarı + 2) * 2 },
      { x: -yarı, z: 0, rot: Math.PI / 2, len: (yarı + 2) * 2 },
      { x: yarı, z: 0, rot: Math.PI / 2, len: (yarı + 2) * 2 },
    ];

    for (const k of kenarlar) {
      for (const ofs of [-0.42, 0.42]) {
        const ray = new THREE.Mesh(new THREE.BoxGeometry(k.len, 0.09, 0.13), rayMat);
        ray.position.set(k.x + (k.rot ? ofs : 0), 0.12, k.z + (k.rot ? 0 : ofs));
        ray.rotation.y = k.rot;
        ray.castShadow = false;
        this.grup.add(ray);
      }
      // traversler
      const adet = Math.floor(k.len / 0.85);
      for (let i = 0; i < adet; i++) {
        const t = -k.len / 2 + i * 0.85;
        const tr = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.07, 1.25), traversMat);
        if (k.rot) {
          tr.position.set(k.x, 0.07, k.z + t);
          tr.rotation.y = Math.PI / 2;
        } else {
          tr.position.set(k.x + t, 0.07, k.z);
        }
        this.grup.add(tr);
      }
    }

    // çeper boyunca taş set
    this.rayYari = yarı;
  }

  // ---------- tren ----------
  _tren() {
    const vagonlar = [];
    const lokomotifMat = new THREE.MeshStandardMaterial({ color: 0x2f4f4f, roughness: 0.55, metalness: 0.35 });
    const govdeMat = new THREE.MeshStandardMaterial({ color: 0x93402f, roughness: 0.6, metalness: 0.15 });
    const camMat = new THREE.MeshStandardMaterial({
      color: 0x2a2f3a, emissive: 0xffc27a, emissiveIntensity: 0.9, roughness: 0.3,
    });

    const lokomotif = new THREE.Group();
    const g1 = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.72, 0.92), lokomotifMat);
    g1.position.y = 0.62;
    g1.castShadow = true;
    lokomotif.add(g1);
    const baca = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.18, 0.38, 8), lokomotifMat);
    baca.position.set(0.5, 1.14, 0);
    lokomotif.add(baca);
    const kabin = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.52, 0.86), lokomotifMat);
    kabin.position.set(-0.5, 1.08, 0);
    lokomotif.add(kabin);
    // far
    const far = new THREE.Mesh(
      new THREE.SphereGeometry(0.11, 8, 6),
      new THREE.MeshStandardMaterial({ color: 0xfff2cf, emissive: 0xffe0a0, emissiveIntensity: 2 })
    );
    far.position.set(0.82, 0.66, 0);
    lokomotif.add(far);
    lokomotif.userData.far = far;
    vagonlar.push(lokomotif);

    for (let i = 0; i < 3; i++) {
      const v = new THREE.Group();
      const govde = new THREE.Mesh(new THREE.BoxGeometry(1.25, 0.62, 0.86), govdeMat);
      govde.position.y = 0.6;
      govde.castShadow = true;
      v.add(govde);
      for (let p = -1; p <= 1; p++) {
        const cam = new THREE.Mesh(new THREE.PlaneGeometry(0.28, 0.3), camMat.clone());
        cam.position.set(p * 0.38, 0.72, 0.431);
        v.add(cam);
        const cam2 = cam.clone();
        cam2.position.z = -0.431;
        cam2.rotation.y = Math.PI;
        v.add(cam2);
      }
      const cati = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.1, 0.9), lokomotifMat);
      cati.position.y = 0.95;
      v.add(cati);
      vagonlar.push(v);
    }

    // tekerlekler her vagonda
    const tekerMat = new THREE.MeshStandardMaterial({ color: 0x1d2026, roughness: 0.8 });
    for (const v of vagonlar) {
      for (const wx of [-0.42, 0.42]) {
        for (const wz of [-0.4, 0.4]) {
          const t = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.19, 0.1, 10), tekerMat);
          t.rotation.x = Math.PI / 2;
          t.position.set(wx, 0.19, wz);
          v.add(t);
        }
      }
      v.position.y = 0.16;
      v.userData.ofs = -vagonlar.indexOf(v) * 2.1;
      this.grup.add(v);
    }

    this.tren = {
      vagonlar,
      hiz: 0.075,        // birim/kare
      t: 0,
      rayYari: this.rayYari,
    };
  }

  _trenPozisyonu(t) {
    // kare çevre üzerinde ilerle: 0..1
    const y = this.tren.rayYari;
    const cevre = 8 * y;
    let d = ((t % 1) + 1) % 1 * cevre;
    const kenar = 2 * y;
    if (d < kenar) return { x: -y + d, z: -y, rot: Math.PI / 2 };         // üst kenar → sağa
    d -= kenar;
    if (d < kenar) return { x: y, z: -y + d, rot: 0 };                     // sağ kenar → aşağı
    d -= kenar;
    if (d < kenar) return { x: y - d, z: y, rot: -Math.PI / 2 };           // alt kenar → sola
    d -= kenar;
    return { x: -y, z: y - d, rot: Math.PI };                              // sol kenar → yukarı
  }

  // ---------- arabalar ----------
  _arabalar() {
    const renkler = [0xe05a4a, 0x4a7de0, 0xf0c04a, 0x6ec0a0, 0xf2f2f0, 0xc77bd6, 0x3c4a63];
    const arabaSayisi = 12;

    for (let i = 0; i < arabaSayisi; i++) {
      const a = this._araba(sec(renkler));
      this.grup.add(a);
      this.sehir.arabalar.push(a);
    }
  }

  _araba(renk) {
    const a = new THREE.Group();

    const govde = new THREE.Mesh(
      new THREE.BoxGeometry(0.86, 0.22, 0.44),
      new THREE.MeshStandardMaterial({ color: renk, roughness: 0.45, metalness: 0.25 })
    );
    govde.position.y = 0.2;
    govde.castShadow = true;
    a.add(govde);

    const kabin = new THREE.Mesh(
      new THREE.BoxGeometry(0.44, 0.2, 0.4),
      new THREE.MeshStandardMaterial({ color: 0x2b3444, emissive: 0x6fa2c9, emissiveIntensity: 0.12, roughness: 0.35 })
    );
    kabin.position.set(-0.06, 0.4, 0);
    a.add(kabin);

    const tekerMat = new THREE.MeshStandardMaterial({ color: 0x16181d, roughness: 0.85 });
    const tekerler = [];
    for (const tx of [-0.28, 0.28]) {
      for (const tz of [-0.23, 0.23]) {
        const t = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.07, 8), tekerMat);
        t.rotation.x = Math.PI / 2;
        t.position.set(tx, 0.1, tz);
        a.add(t);
        tekerler.push(t);
      }
    }

    // farlar
    const farMat = new THREE.MeshStandardMaterial({ color: 0xfff4d6, emissive: 0xffe2a8, emissiveIntensity: 1.6 });
    for (const tz of [-0.14, 0.14]) {
      const far = new THREE.Mesh(new THREE.SphereGeometry(0.055, 6, 5), farMat.clone());
      far.position.set(0.44, 0.22, tz);
      a.add(far);
    }

    // araç döngü tanımı
    a.userData =
      sec([
        { eksen: 'x', hat: -YARIM * ADIM - ADIM / 2 + ADIM, yon: 1, serit: -0.7 },
        { eksen: 'x', hat: -YARIM * ADIM - ADIM / 2 + ADIM, yon: -1, serit: 0.7 },
        { eksen: 'z', hat: 0, yon: 1, serit: 0.7 },
        { eksen: 'z', hat: -ADIM / 2, yon: -1, serit: -0.7 },
      ]);
    a.userData.t = rast();
    a.userData.hiz = aralik(0.035, 0.07);
    a.userData.tekerler = tekerler;

    return a;
  }

  // ---------- yayalar ----------
  _yayalar() {
    this.yayaGrubu = new THREE.Group();
    this.grup.add(this.yayaGrubu);

    const siluetMat = new THREE.MeshStandardMaterial({ color: 0x2a2b33, roughness: 0.9 });
    const sapkaMat = new THREE.MeshStandardMaterial({ color: 0x3a3a48, roughness: 0.9 });

    for (let i = 0; i < 16; i++) {
      const y = new THREE.Group();
      const govde = new THREE.Mesh(new THREE.CapsuleGeometry(0.055, 0.18, 4, 6), siluetMat);
      govde.position.y = 0.24;
      y.add(govde);
      const bas = new THREE.Mesh(new THREE.SphereGeometry(0.062, 8, 6), sapkaMat);
      bas.position.y = 0.44;
      y.add(bas);
      const bacakL = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.018, 0.16, 5), siluetMat);
      bacakL.position.set(0, 0.09, 0.035);
      y.add(bacakL);
      const bacakR = bacakL.clone();
      bacakR.position.z = -0.035;
      y.add(bacakR);

      y.userData = {
        bacakL, bacakR,
        eksen: sans(0.5) ? 'x' : 'z',
        hat: (Math.floor(aralik(-YARIM, YARIM))) * ADIM + ADIM / 2,
        ofs: aralik(-1.35, 1.35),
        t: rast(),
        hiz: aralik(0.008, 0.02),
        yon: sans(0.5) ? 1 : -1,
        faz: rast() * 6.28,
      };
      this.yayaGrubu.add(y);
    }
  }

  // ---------- her karede ----------
  guncelle(dt, zaman, gece) {
    // ---- TREN ----
    const tren = this.tren;
    tren.t += dt * tren.hiz * 0.32;
    for (const v of tren.vagonlar) {
      const p = this._trenPozisyonu(tren.t + v.userData.ofs / (8 * tren.rayYari));
      v.position.x = p.x;
      v.position.z = p.z;
      v.rotation.y = -p.rot + Math.PI / 2;
    }
    if (tren.vagonlar[0].userData.far) {
      tren.vagonlar[0].userData.far.material.emissiveIntensity = 1.4 + gece * 1.6;
    }

    // ---- ARABALAR ----
    const sinir = YARIM * ADIM;
    const yolBaslangic = -sinir;
    const yolBitis = sinir;
    for (const a of this.sehir.arabalar) {
      const u = a.userData;
      u.t += dt * u.hiz;
      const donus = (u.t % 1);
      const mesafe = yolBaslangic + donus * (yolBitis - yolBaslangic);
      if (u.eksen === 'x') {
        a.position.set(u.yon > 0 ? mesafe : yolBitis - (mesafe - yolBaslangic), 0, u.hat + u.serit);
        a.rotation.y = u.yon > 0 ? 0 : Math.PI;
      } else {
        a.position.set(u.hat + u.serit, 0, u.yon > 0 ? mesafe : yolBitis - (mesafe - yolBaslangic));
        a.rotation.y = u.yon > 0 ? -Math.PI / 2 : Math.PI / 2;
      }
      for (const t of u.tekerler) t.rotation.y += dt * 9;
    }

    // ---- YAYALAR ----
    const sin = sinir + 1.2;
    for (const y of this.yayaGrubu.children) {
      const u = y.userData;
      u.t += dt * u.hiz;
      const d = (u.t % 1) * (sin * 2) - sin;
      const konum = u.yon > 0 ? d : -d;
      if (u.eksen === 'x') {
        y.position.set(konum, 0.16, u.hat + u.ofs);
        y.rotation.y = u.yon > 0 ? 0 : Math.PI;
      } else {
        y.position.set(u.hat + u.ofs, 0.16, konum);
        y.rotation.y = u.yon > 0 ? -Math.PI / 2 : Math.PI / 2;
      }
      const sal = Math.sin(zaman * 6 + u.faz) * 0.09;
      u.bacakL.rotation.x = sal;
      u.bacakR.rotation.x = -sal;
      // gece silüetleri hafifçe koyulaşsın (ay ışığı altında)
      y.position.y = 0.16;
    }
  }
}
