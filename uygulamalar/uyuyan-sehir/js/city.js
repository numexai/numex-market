// Dream City — şehir dokusu (binalar, yollar, parklar, lambalar, ağaçlar)
// Izgara: sokaklar arası bloklar; her blokta 2-3 bina.

import * as THREE from '../vendor/three.module.js';
import { aralik, rast, sans, sec, hsl, kis } from './utils.js';

export const ADIM = 8;        // sokak aralığı
export const YARIM = 4;       // ızgara yarısı (blok sayısı)
export const YOL_GENIS = 3.1; // yol şeridi genişliği

// Ghibli paleti — sıcak duvar renkleri (gece lama altında sıcak görünür)
const DUVAR_RENKLERI = [
  0xf3dfc4, 0xeacfb2, 0xdfc7ad, 0xf0e0cc, 0xd9b9a0,
  0xcfd6c9, 0xc9c0b0, 0xe8d3bf, 0xd8c4cd, 0xf2d9b8,
];
const CATI_RENKLERI = [0x7d4b3b, 0x93412f, 0x5d5f7a, 0x7a5b3a, 0x8c5a4a, 0x4f5b62];
const PENCERE_SICAK = [0xffc477, 0xffd9a0, 0xffb066, 0xffe1b8, 0xffcf8a];

export class Sehir {
  constructor(sahne) {
    this.sahne = sahne;
    this.grup = new THREE.Group();
    this.grup.name = 'sehir';
    sahne.add(this.grup);

    this.binalar = [];
    this.arabalar = [];
    this.lambalar = [];
    this.dumanlar = [];
    this.pencereler = [];       // tüm pencere düzlemleri (tek güncelleme döngüsü için)
    this.gunFaktor = 0;         // 0 = gündüz, 1 = tam gece

    this._malzemeleriHazirla();
    this._zemin();
    this._yollar();
    this._bloklar();
    this._lambalar();
    this._agaclar();
    this._bulutlar();
  }

  // ---------- malzemeler ----------
  _malzemeleriHazirla() {
    this.matZemin = new THREE.MeshStandardMaterial({ color: 0x4c5a4a, roughness: 0.95, metalness: 0 });
    this.matYol = new THREE.MeshStandardMaterial({ color: 0x30343f, roughness: 0.9, metalness: 0 });
    this.matYaya = new THREE.MeshStandardMaterial({ color: 0x8b8477, roughness: 0.95 });
    this.matCim = new THREE.MeshStandardMaterial({ color: 0x5f7a4a, roughness: 1, metalness: 0 });
    this.matRay = new THREE.MeshStandardMaterial({ color: 0x9aa0a6, roughness: 0.45, metalness: 0.55 });
    this.matDirek = new THREE.MeshStandardMaterial({ color: 0x2b2f38, roughness: 0.7, metalness: 0.3 });
    this.matLambaCam = new THREE.MeshStandardMaterial({
      color: 0xffd9a0, emissive: 0xffb867, emissiveIntensity: 1.4, roughness: 0.4,
    });
  }

  // ---------- zemin ----------
  _zemin() {
    const boy = ADIM * (YARIM * 2 + 1) + 26;
    const zemin = new THREE.Mesh(
      new THREE.BoxGeometry(boy, 1.6, boy),
      this.matZemin
    );
    zemin.position.y = -0.8;
    zemin.receiveShadow = true;
    this.grup.add(zemin);

    // şehrin altında yumuşak "ada" eğimi — masal kitabı kâğıdı hissi
    const altin = new THREE.Mesh(
      new THREE.CylinderGeometry(boy * 0.72, boy * 0.86, 2.2, 8),
      new THREE.MeshStandardMaterial({ color: 0x3a4638, roughness: 1 })
    );
    altin.position.y = -2.6;
    altin.receiveShadow = true;
    this.grup.add(altin);
  }

  // ---------- yollar ----------
  _yollar() {
    const uzunluk = ADIM * (YARIM * 2 + 1) + 10;
    for (let i = -YARIM; i <= YARIM + 1; i++) {
      const p = i * ADIM - ADIM / 2;

      const yolX = new THREE.Mesh(new THREE.BoxGeometry(uzunluk, 0.1, YOL_GENIS), this.matYol);
      yolX.position.set(0, 0.02, p);
      yolX.receiveShadow = true;
      this.grup.add(yolX);

      const yolZ = new THREE.Mesh(new THREE.BoxGeometry(YOL_GENIS, 0.1, uzunluk), this.matYol);
      yolZ.position.set(p, 0.02, 0);
      yolZ.receiveShadow = true;
      this.grup.add(yolZ);

      // kaldırım şeritleri
      const ky = new THREE.Mesh(new THREE.BoxGeometry(uzunluk, 0.16, 0.9), this.matYaya);
      ky.position.set(0, 0.04, p + YOL_GENIS / 2 + 0.45);
      this.grup.add(ky);
      const kx = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.16, uzunluk), this.matYaya);
      kx.position.set(p + YOL_GENIS / 2 + 0.45, 0.04, 0);
      this.grup.add(kx);
    }

    // orta şerit kesik çizgileri
    const cizgiMat = new THREE.MeshStandardMaterial({ color: 0xd8cfae, roughness: 0.9 });
    const cizgiGeo = new THREE.BoxGeometry(1.4, 0.02, 0.16);
    for (let i = -YARIM; i <= YARIM + 1; i++) {
      const p = i * ADIM - ADIM / 2;
      for (let j = -YARIM - 1; j <= YARIM + 1; j++) {
        const cx = new THREE.Mesh(cizgiGeo, cizgiMat);
        cx.position.set(j * ADIM + 2, 0.09, p);
        cx.rotation.y = Math.PI / 2;
        this.grup.add(cx);
        const cz = new THREE.Mesh(cizgiGeo, cizgiMat);
        cz.position.set(p, 0.09, j * ADIM + 2);
        this.grup.add(cz);
      }
    }
  }

  // ---------- bloklar ----------
  _bloklar() {
    for (let gx = -YARIM; gx < YARIM; gx++) {
      for (let gz = -YARIM; gz < YARIM; gz++) {
        const merkez = new THREE.Vector3(gx * ADIM + ADIM / 2, 0, gz * ADIM + ADIM / 2);
        const tur = this._blokTuru(merkez);

        if (tur === 'park') this._park(merkez);
        else if (tur === 'meydan') this._meydan(merkez);
        else this._binaBlogu(merkez);
      }
    }
  }

  _blokTuru(m) {
    if (Math.abs(m.x) < 5 && Math.abs(m.z) < 5) return 'meydan';
    if (sans(0.24)) return 'park';
    return 'bina';
  }

  _binaBlogu(merkez) {
    const blok = 4.3;
    const yerlesim = sec([
      [[-1, -1], [1, -1], [-1, 1], [1, 1]],
      [[0, -1.1], [0, 1.1]],
      [[-1.1, 0], [1.1, 0]],
    ]);

    for (const [ox, oz] of yerlesim) {
      const pay = yerlesim.length === 2 ? 1.55 : 1.05;
      const w = aralik(2.3, blok * pay);
      const d = aralik(2.3, blok * pay);
      const yakinlik = Math.hypot(merkez.x, merkez.z) / (ADIM * YARIM);
      let h = aralik(2.4, 7.5) * (1.25 - yakinlik * 0.5);
      if (sans(0.1)) h *= 1.55; // ara sıra kule
      h = kis(h, 2.2, 11);
      const x = merkez.x + ox * 2.05;
      const z = merkez.z + oz * 2.05;
      this._bina({ x, z, w: Math.min(w, 4.4), d: Math.min(d, 4.4), h });
    }
  }

  // ---------- tek bina ----------
  _bina({ x, z, w, d, h }) {
    const bina = new THREE.Group();
    bina.position.set(x, 0, z);

    const duvarRenk = sec(DUVAR_RENKLERI);
    const catiRenk = sec(CATI_RENKLERI);

    const govde = new THREE.Mesh(
      new THREE.BoxGeometry(w, h, d),
      new THREE.MeshStandardMaterial({ color: duvarRenk, roughness: 0.88, metalness: 0.02 })
    );
    govde.position.y = h / 2;
    govde.castShadow = true;
    govde.receiveShadow = true;
    bina.add(govde);

    // çatı: piramit ya da düz teras
    const piramit = sans(0.62);
    if (piramit) {
      const cati = new THREE.Mesh(
        new THREE.ConeGeometry(Math.max(w, d) * 0.78, aralik(1.1, 2.1), 4),
        new THREE.MeshStandardMaterial({ color: catiRenk, roughness: 0.8 })
      );
      cati.rotation.y = Math.PI / 4;
      cati.position.y = h + 0.55;
      cati.castShadow = true;
      bina.add(cati);
    } else {
      const teras = new THREE.Mesh(
        new THREE.BoxGeometry(w * 1.06, 0.22, d * 1.06),
        new THREE.MeshStandardMaterial({ color: catiRenk, roughness: 0.85 })
      );
      teras.position.y = h + 0.1;
      bina.add(teras);
    }

    // baca (duman çıksın)
    if (sans(0.42)) {
      const baca = new THREE.Mesh(
        new THREE.BoxGeometry(0.34, 0.8, 0.34),
        new THREE.MeshStandardMaterial({ color: 0x6d5f55, roughness: 0.95 })
      );
      baca.position.set(w * 0.24, h + (piramit ? 1.1 : 0.5), -d * 0.2);
      bina.add(baca);
      this._dumanEkle(bina, baca.position.clone().add(new THREE.Vector3(0, 0.5, 0)));
    }

    // pencere ızgarası
    const katSayisi = Math.max(1, Math.floor((h - 0.9) / 1.35));
    const katYuk = (h - 0.8) / katSayisi;
    const cepheler = [
      { eksen: 'x', yon: 1, gen: w, ofs: d / 2 },
      { eksen: 'x', yon: -1, gen: w, ofs: d / 2 },
      { eksen: 'z', yon: 1, gen: d, ofs: w / 2 },
      { eksen: 'z', yon: -1, gen: d, ofs: w / 2 },
    ];

    const odalar = [];
    for (const cephe of cepheler) {
      const adet = Math.max(1, Math.floor(cephe.gen / 1.05));
      const aralikX = cephe.gen / adet;
      for (let kat = 0; kat < katSayisi; kat++) {
        for (let i = 0; i < adet; i++) {
          if (sans(0.14)) continue; // bazı yuvalar boş kalsın
          const p = -cephe.gen / 2 + aralikX * (i + 0.5);
          const y = 0.85 + katYuk * kat + katYuk * 0.5;

          const geometri = new THREE.PlaneGeometry(0.46, 0.56);
          const malzeme = new THREE.MeshStandardMaterial({
            color: 0x2b2f3a,
            emissive: new THREE.Color(sec(PENCERE_SICAK)),
            emissiveIntensity: 0.1,
            roughness: 0.5,
            metalness: 0,
          });
          const pencere = new THREE.Mesh(geometri, malzeme);

          if (cephe.eksen === 'x') {
            pencere.position.set(p, y, cephe.yon * (cephe.ofs + 0.012));
            pencere.rotation.y = cephe.yon > 0 ? 0 : Math.PI;
          } else {
            pencere.position.set(cephe.yon * (cephe.ofs + 0.012), y, p);
            pencere.rotation.y = cephe.yon > 0 ? Math.PI / 2 : -Math.PI / 2;
          }
          bina.add(pencere);

          const kayit = {
            mesh: pencere,
            acik: sans(0.55),
            hedef: 0,
            hiz: aralik(0.6, 2.2),
            bekleme: aralik(0, 8),
            odaNo: 100 + kat * 10 + i + 1,
          };
          if (sans(0.55)) {
            pencere.material.emissive = new THREE.Color(sec(PENCERE_SICAK));
          }
          if (sans(0.7)) odalar.push(kayit);
          this.pencereler.push(kayit);
          bina.userData.pencereler = bina.userData.pencereler || [];
          bina.userData.pencereler.push(kayit);
        }
      }
    }

    // ---- dükkân vitrini (zemin kat, sıcak ışık) ----
    if (h > 3 && sans(0.55)) {
      const vitrin = new THREE.Mesh(
        new THREE.PlaneGeometry(w * 0.62, 1.05),
        new THREE.MeshStandardMaterial({
          color: 0x2a2118, emissive: 0xffab55, emissiveIntensity: 0.8, roughness: 0.4,
        })
      );
      vitrin.position.set(0, 0.68, d / 2 + 0.015);
      bina.add(vitrin);
      this.pencereler.push({ mesh: vitrin, acik: true, cam: true, hedef: 0, hiz: 0.4, bekleme: 3 + rast() * 6 });
    }

    bina.userData.tip = 'bina';
    bina.userData.ad = sec(['Sıcak Işıklı Ev', 'Kahve Evi', 'Fırın', 'Kunduracı', 'Kitapçı', 'Saatçi', 'Bakkal', 'Çiçekçi', 'Pastane', 'Lokanta', 'Kuyumcu', 'Marangoz', 'Terzi', 'Kitap Kafe', 'Eczane', 'Dondurmacı']);
    bina.userData.h = h;
    bina.userData.temelRenk = new THREE.Color(duvarRenk);

    this.grup.add(bina);
    this.binalar.push(bina);
    return bina;
  }

  // ---------- park ----------
  _park(merkez) {
    const park = new THREE.Group();
    park.position.copy(merkez);

    const cim = new THREE.Mesh(new THREE.BoxGeometry(5.4, 0.12, 5.4), this.matCim);
    cim.position.y = 0.06;
    cim.receiveShadow = true;
    park.add(cim);

    // patika
    const patika = new THREE.Mesh(
      new THREE.BoxGeometry(5.4, 0.02, 0.7),
      new THREE.MeshStandardMaterial({ color: 0xbfa98a, roughness: 1 })
    );
    patika.position.y = 0.13;
    park.add(patika);

    // ağaçlar
    for (let i = 0; i < 5; i++) {
      const t = this._agac();
      t.position.set(aralik(-2.1, 2.1), 0.12, aralik(-2.1, 2.1) * (sans(0.5) ? 1 : -1));
      park.add(t);
    }

    // fener
    const fener = this._lamba();
    fener.position.set(1.6, 0.12, 1.4);
    park.add(fener);

    // bank niteliğinde iki kutu
    const bankMat = new THREE.MeshStandardMaterial({ color: 0x7a5a3c, roughness: 0.9 });
    for (const yon of [-1, 1]) {
      const bank = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.09, 0.36), bankMat);
      bank.position.set(-0.7, 0.36, yon * 0.62);
      park.add(bank);
    }

    this.grup.add(park);
    this.binalar.push(park);
    park.userData.tip = 'park';
    park.userData.ad = 'Küçük Park';
    park.userData.pencereler = [];
  }

  // ---------- meydan (su kulesi + saat) ----------
  _meydan(merkez) {
    const meydan = new THREE.Group();
    meydan.position.copy(merkez);

    const tas = new THREE.Mesh(
      new THREE.CylinderGeometry(3.1, 3.3, 0.2, 12),
      new THREE.MeshStandardMaterial({ color: 0xbdb09a, roughness: 0.95 })
    );
    tas.position.y = 0.1;
    tas.receiveShadow = true;
    meydan.add(tas);

    // su kulesi
    const kule = new THREE.Group();
    const bacakMat = new THREE.MeshStandardMaterial({ color: 0x6a5b4e, roughness: 0.9 });
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
      const bacak = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 2.2, 6), bacakMat);
      bacak.position.set(Math.cos(a) * 0.65, 1.1, Math.sin(a) * 0.65);
      bacak.castShadow = true;
      kule.add(bacak);
    }
    const depo = new THREE.Mesh(
      new THREE.CylinderGeometry(1.05, 1.05, 1.15, 14),
      new THREE.MeshStandardMaterial({ color: 0x8e6f5b, roughness: 0.8 })
    );
    depo.position.y = 2.75;
    depo.castShadow = true;
    kule.add(depo);
    const kubbe = new THREE.Mesh(
      new THREE.ConeGeometry(1.1, 0.75, 14),
      new THREE.MeshStandardMaterial({ color: 0x6f4a3f, roughness: 0.85 })
    );
    kubbe.position.y = 3.7;
    kule.add(kubbe);
    kule.position.set(-1.2, 0.2, -1.1);
    meydan.add(kule);

    // saat direği
    const direk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.09, 0.09, 1.7, 8),
      new THREE.MeshStandardMaterial({ color: 0x2f333d, roughness: 0.6, metalness: 0.4 })
    );
    direk.position.set(1.35, 0.85, 0.9);
    meydan.add(direk);
    const kadran = new THREE.Mesh(
      new THREE.CylinderGeometry(0.44, 0.44, 0.1, 18),
      new THREE.MeshStandardMaterial({
        color: 0xfff0d2, emissive: 0xffca8a, emissiveIntensity: 0.6, roughness: 0.5,
      })
    );
    kadran.rotation.x = Math.PI / 2;
    kadran.position.set(1.35, 1.78, 0.9);
    meydan.add(kadran);

    this.grup.add(meydan);
    this.binalar.push(meydan);
    meydan.userData.tip = 'meydan';
    meydan.userData.ad = 'Şehir Meydanı';
    meydan.userData.pencereler = [];
  }

  // yumuşak kenarlı ışık halkası dokusu (keskin daire kenarı olmasın)
  _haloDokusu() {
    if (this._haloDoku) return this._haloDoku;
    const boy = 128;
    const kanvas = document.createElement('canvas');
    kanvas.width = kanvas.height = boy;
    const c = kanvas.getContext('2d');
    const g = c.createRadialGradient(boy / 2, boy / 2, 0, boy / 2, boy / 2, boy / 2);
    g.addColorStop(0, 'rgba(255,200,140,0.85)');
    g.addColorStop(0.45, 'rgba(255,170,90,0.28)');
    g.addColorStop(1, 'rgba(255,150,70,0)');
    c.fillStyle = g;
    c.fillRect(0, 0, boy, boy);
    const doku = new THREE.CanvasTexture(kanvas);
    doku.colorSpace = THREE.SRGBColorSpace;
    this._haloDoku = doku;
    return doku;
  }

  // ---------- lamba ----------
  _lamba() {
    const lamba = new THREE.Group();
    const direk = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.075, 2.0, 6), this.matDirek);
    direk.position.y = 1.0;
    direk.castShadow = true;
    lamba.add(direk);

    const kol = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.04, 5, 8, Math.PI), this.matDirek);
    kol.position.set(0, 2.0, 0);
    kol.rotation.z = Math.PI;
    lamba.add(kol);

    const cam = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 8), this.matLambaCam.clone());
    cam.position.set(0, 2.05, 0);
    lamba.add(cam);

    // sahte ışık halkası (zemine yumuşak sıcak daire)
    const halo = new THREE.Mesh(
      new THREE.CircleGeometry(0.85, 20),
      new THREE.MeshBasicMaterial({
        color: 0xffb266,
        transparent: true,
        opacity: 0.1,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        map: this._haloDokusu(),
      })
    );
    halo.rotation.x = -Math.PI / 2;
    halo.position.y = 0.075;
    lamba.add(halo);

    lamba.userData.cam = cam;
    lamba.userData.halo = halo;
    this.lambalar.push(lamba);
    return lamba;
  }

  _lambalar() {
    // yol kenarlarına lamba dik
    for (let i = -YARIM; i <= YARIM + 1; i++) {
      const p = i * ADIM - ADIM / 2;
      for (let j = -YARIM; j <= YARIM; j++) {
        if (sans(0.45)) continue;
        const l1 = this._lamba();
        l1.position.set(j * ADIM + ADIM * 0.5 + 1.9, 0, p + YOL_GENIS / 2 + 0.9);
        this.grup.add(l1);
        if (sans(0.55)) {
          const l2 = this._lamba();
          l2.position.set(p + YOL_GENIS / 2 + 0.9, 0, j * ADIM + ADIM * 0.5 - 1.9);
          this.grup.add(l2);
        }
      }
    }
  }

  // ---------- ağaç ----------
  _agac() {
    const agac = new THREE.Group();
    const govde = new THREE.Mesh(
      new THREE.CylinderGeometry(0.11, 0.16, 0.9, 6),
      new THREE.MeshStandardMaterial({ color: 0x6b4a34, roughness: 0.95 })
    );
    govde.position.y = 0.45;
    govde.castShadow = true;
    agac.add(govde);

    const ton = sec([0x4c7a48, 0x557f4a, 0x6b8f4c, 0x3f6b46, 0x7c9a52]);
    for (let i = 0; i < 3; i++) {
      const yaprak = new THREE.Mesh(
        new THREE.IcosahedronGeometry(aralik(0.5, 0.78), 0),
        new THREE.MeshStandardMaterial({ color: ton, roughness: 0.95, flatShading: true })
      );
      yaprak.position.set(aralik(-0.25, 0.25), 1.05 + i * 0.36, aralik(-0.25, 0.25));
      yaprak.castShadow = true;
      agac.add(yaprak);
    }
    return agac;
  }

  _agaclar() {
    // yol kenarlarına serpiştirilmiş ağaçlar
    for (let i = 0; i < 70; i++) {
      const a = this._agac();
      const eksen = sans(0.5);
      const hat = (Math.floor(aralik(-YARIM, YARIM + 1))) * ADIM - ADIM / 2;
      const konum = aralik(-YARIM * ADIM, YARIM * ADIM);
      const kenar = (sans(0.5) ? 1 : -1) * (YOL_GENIS / 2 + 0.55);
      if (eksen) a.position.set(konum, 0, hat + kenar);
      else a.position.set(hat + kenar, 0, konum);
      a.scale.setScalar(aralik(0.75, 1.15));
      this.grup.add(a);
    }
  }

  // ---------- bulut (gökyüzü için, sahnede süzülür) ----------
  _bulutlar() {
    this.bulutGrubu = new THREE.Group();
    this.sahne.add(this.bulutGrubu);
    const bulutMat = new THREE.MeshStandardMaterial({
      color: 0xffffff, roughness: 1, transparent: true, opacity: 0.5, flatShading: true,
    });
    for (let i = 0; i < 7; i++) {
      const bulut = new THREE.Group();
      const parca = 3 + Math.floor(rast() * 3);
      for (let j = 0; j < parca; j++) {
        const s = new THREE.Mesh(new THREE.IcosahedronGeometry(aralik(1.6, 3.2), 0), bulutMat);
        s.position.set(aralik(-3, 3), aralik(-0.3, 0.6), aralik(-1.6, 1.6));
        bulut.add(s);
      }
      bulut.position.set(aralik(-80, 80), aralik(52, 68), aralik(-80, 80));
      bulut.scale.setScalar(aralik(1.6, 2.4));
      this.bulutGrubu.add(bulut);
    }
    this.bulutMat = bulutMat;
  }

  // ---------- duman (baca) ----------
  _dumanEkle(ebeveyn, konum) {
    const dumanMat = new THREE.MeshBasicMaterial({
      color: 0xd8d8e2, transparent: true, opacity: 0.22, depthWrite: false,
    });
    const duman = new THREE.Mesh(new THREE.SphereGeometry(0.18, 6, 5), dumanMat);
    duman.position.copy(konum);
    ebeveyn.add(duman);
    this.dumanlar.push({ mesh: duman, temel: konum.clone(), t: rast() * 6 });
  }

  // ---------- gece/gündüz ----------
  gunFaktoruAyarla(f) {
    this.gunFaktor = f;
    for (const bina of this.binalar) {
      const pen = bina.userData.pencereler || [];
      for (const p of pen) {
        const acikPay = p.cam ? 1 : 1;
        p.mesh.material.emissiveIntensity =
          (p.cam ? 0.12 + f * 1.1 : 0.02 + f * (p.acik ? 1.35 : 0.12)) * acikPay;
      }
      if (bina.userData.tip === 'bina' && bina.userData.malzeme) {
        bina.userData.malzeme.color.copy(bina.userData.temelRenk);
      }
    }
    for (const l of this.lambalar) {
      const c = l.userData.cam.material;
      c.emissiveIntensity = 0.15 + f * 1.7;
      c.color.setHex(f > 0.35 ? 0xffd9a0 : 0xb9b6ad);
      l.userData.halo.material.opacity = 0.01 + f * 0.5;
      l.userData.halo.visible = f > 0.12;
    }
    if (this.bulutMat) {
      this.bulutMat.opacity = 0.28 + f * 0.22;
    }
  }

  // ---------- her karede ----------
  guncelle(dt, zaman) {
    // pencere ışıkları rastgele yanıp söner
    for (const p of this.pencereler) {
      p.bekleme -= dt;
      if (p.bekleme <= 0) {
        p.acik = !p.acik;
        p.bekleme = aralik(4, 16) * (p.cam ? 3 : 1);
      }
      const hedef = p.acik ? 1 : 0.08;
      p.mesh.material.emissiveIntensity += (hedef * (0.12 + this.gunFaktor * 1.35) - p.mesh.material.emissiveIntensity) * Math.min(1, dt * p.hiz);
    }

    // duman
    for (const d of this.dumanlar) {
      d.t += dt;
      const k = (d.t % 5) / 5;
      d.mesh.position.y = d.temel.y + k * 1.5;
      d.mesh.position.x = d.temel.x + Math.sin(d.t * 0.8) * 0.2 + k * 0.35;
      d.mesh.scale.setScalar(0.5 + k * 1.6);
      d.mesh.material.opacity = 0.22 * (1 - k);
    }

    // bulutlar süzülür
    if (this.bulutGrubu) {
      this.bulutGrubu.children.forEach((b, i) => {
        b.position.x += dt * (0.35 + i * 0.06);
        if (b.position.x > 84) b.position.x = -84;
      });
    }
  }
}
