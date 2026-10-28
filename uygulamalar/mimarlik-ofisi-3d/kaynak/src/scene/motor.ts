/**
 * İzole 3D motor katmanı — three.js üzerine kurulu, proje içinde tek motor.
 * Hem 2D/3D karşılaştırma paneli hem İnteraktif Mimari Keşif sayfası bunu kullanır.
 * Hazır model dosyası kullanılmaz: tüm geometri plandan kodla üretilir.
 */

import * as THREE from 'three';
import type { KatPlan, Duvar, Mobilya } from './planData';
import { aciklikKonum, duvarUzunluk } from './planData';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export type MalzemeSecim = 'krem-siva' | 'antrasit-tas' | 'meşe-panel';
export type Gorunum = 'dis' | 'ic' | 'ust';

/** Paylaşılan malzemeler — her nesne için yeni malzeme üretilmez */
export class MalzemeKutuphanesi {
  private onbellek = new Map<string, THREE.Material>();

  al(anahtar: string, yapici: () => THREE.Material): THREE.Material {
    let m = this.onbellek.get(anahtar);
    if (!m) {
      m = yapici();
      this.onbellek.set(anahtar, m);
    }
    return m;
  }

  cephe(tip: MalzemeSecim): THREE.Material {
    return this.al(`cephe-${tip}`, () => {
      switch (tip) {
        case 'antrasit-tas':
          return new THREE.MeshStandardMaterial({ color: 0x3a3733, roughness: 0.85, metalness: 0.05 });
        case 'meşe-panel':
          return new THREE.MeshStandardMaterial({ color: 0xa9793f, roughness: 0.62, metalness: 0.08 });
        default:
          return new THREE.MeshStandardMaterial({ color: 0xe8e0d1, roughness: 0.9, metalness: 0.02 });
      }
    });
  }

  icDuvar(): THREE.Material {
    return this.al('ic-duvar', () =>
      new THREE.MeshStandardMaterial({ color: 0xf2ece1, roughness: 0.95, metalness: 0 })
    );
  }

  zemin(): THREE.Material {
    return this.al('zemin', () =>
      new THREE.MeshStandardMaterial({ color: 0xcfc4b0, roughness: 0.92, metalness: 0 })
    );
  }

  /** Dış cephede ikinci ton (kat silmesi / alt kat farkı) — kütleyi okutur */
  cepheAlt(tip: MalzemeSecim): THREE.Material {
    return this.al(`cephe-alt-${tip}`, () => {
      switch (tip) {
        case 'antrasit-tas':
          return new THREE.MeshStandardMaterial({ color: 0x2f2c29, roughness: 0.9, metalness: 0.04 });
        case 'meşe-panel':
          return new THREE.MeshStandardMaterial({ color: 0x91662f, roughness: 0.7, metalness: 0.06 });
        default:
          return new THREE.MeshStandardMaterial({ color: 0xd9d0be, roughness: 0.93, metalness: 0.02 });
      }
    });
  }

  doseme(): THREE.Material {
    return this.al('doseme', () =>
      new THREE.MeshStandardMaterial({ color: 0xded5c5, roughness: 0.88, metalness: 0 })
    );
  }

  cam(): THREE.Material {
    // NUMEX-DUZELTME (2026-10-27, "biraz gerçekçilik payı olsun"): cam tek başına leke
    // gibi duruyordu; metalness ve daha düşük opaklıkla gerçek cam yansıması verildi.
    return this.al('cam', () =>
      new THREE.MeshPhysicalMaterial({
        color: 0x9fbccb,
        roughness: 0.06,
        metalness: 0.36,
        transparent: true,
        opacity: 0.34,
        transmission: 0.62,
        ior: 1.5,
        reflectivity: 0.7,
        side: THREE.DoubleSide,
      })
    );
  }

  /** Pencere çerçevesi — camın etrafına ince profil (gerçekçilik) */
  cerceve(): THREE.Material {
    return this.al('cerceve', () =>
      new THREE.MeshStandardMaterial({ color: 0x4a443c, roughness: 0.55, metalness: 0.25 })
    );
  }

  /** Söve / denizlik — pencerenin alt ve yan bitişleri */
  sova(): THREE.Material {
    return this.al('sova', () =>
      new THREE.MeshStandardMaterial({ color: 0xdfd7c7, roughness: 0.78, metalness: 0.03 })
    );
  }

  kapi(): THREE.Material {
    return this.al('kapi', () =>
      new THREE.MeshStandardMaterial({ color: 0x8a6a44, roughness: 0.55, metalness: 0.1 })
    );
  }

  mobilya(tip: Mobilya['tip']): THREE.Material {
    const renk =
      tip === 'kanepe'
        ? 0x8d8577
        : tip === 'yatak'
        ? 0xe3dbcd
        : tip === 'tezgah' || tip === 'ada'
        ? 0x6e655a
        : tip === 'dolap'
        ? 0xb9a887
        : 0x9c8b73;
    return this.al(`mob-${tip}`, () =>
      new THREE.MeshStandardMaterial({ color: renk, roughness: 0.72, metalness: 0.04 })
    );
  }

  temizle(): void {
    this.onbellek.forEach((m) => m.dispose());
    this.onbellek.clear();
  }
}

/** Duvarı açıklıklarıyla birlikte kutu parçalarına böler (paylaşılan geometri) */
function duvarParcalari(d: Duvar): { genislik: number; yukseklik: number; derinlik: number; konum: THREE.Vector3 }[] {
  const len = duvarUzunluk(d);
  const yonx = len ? (d.x2 - d.x1) / len : 1;
  const yonz = len ? (d.z2 - d.z1) / len : 0;
  const aci = Math.atan2(yonz, yonx);
  const parcalar: { genislik: number; yukseklik: number; derinlik: number; konum: THREE.Vector3 }[] = [];

  const acikliklar = (d.acikliklar ?? []).slice().sort((a, b) => a.ofset - b.ofset);
  let imlec = 0;
  for (const a of acikliklar) {
    if (a.ofset > imlec) {
      const uzun = a.ofset - imlec;
      const orta = imlec + uzun / 2;
      parcalar.push({
        genislik: uzun,
        yukseklik: 3.05,
        derinlik: d.t,
        konum: new THREE.Vector3(d.x1 + yonx * orta, 3.05 / 2, d.z1 + yonz * orta),
      });
    }
    const k = aciklikKonum(d, a);
    const orta = { x: (k.bas.x + k.son.x) / 2, z: (k.bas.z + k.son.z) / 2 };
    if (a.tip === 'pencere') {
      // alt ve üst parça
      const taban = a.taban ?? 0.9;
      const ust = a.ust ?? 2.4;
      parcalar.push({
        genislik: a.genislik,
        yukseklik: taban,
        derinlik: d.t,
        konum: new THREE.Vector3(orta.x, taban / 2, orta.z),
      });
      parcalar.push({
        genislik: a.genislik,
        yukseklik: 3.05 - ust,
        derinlik: d.t,
        konum: new THREE.Vector3(orta.x, ust + (3.05 - ust) / 2, orta.z),
      });
    } else {
      // kapı üstü lento
      const kapiH = 2.1;
      parcalar.push({
        genislik: a.genislik,
        yukseklik: 3.05 - kapiH,
        derinlik: d.t,
        konum: new THREE.Vector3(orta.x, kapiH + (3.05 - kapiH) / 2, orta.z),
      });
    }
    imlec = a.ofset + a.genislik;
  }
  if (imlec < len) {
    const uzun = len - imlec;
    const orta = imlec + uzun / 2;
    parcalar.push({
      genislik: uzun,
      yukseklik: 3.05,
      derinlik: d.t,
      konum: new THREE.Vector3(d.x1 + yonx * orta, 3.05 / 2, d.z1 + yonz * orta),
    });
  }
  // döndürme açısını konumla birlikte taşımak için özel alan
  return parcalar.map((p) => Object.assign(p, { aci }));
}

/** Bir katı sahneye ekler */
export function katEkle(
  kat: KatPlan,
  mat: MalzemeKutuphanesi,
  cepheTip: MalzemeSecim,
  katYuksekligi = 0,
  secenek: { icDuvar?: boolean; doseme?: boolean; mobilya?: boolean } = {}
): THREE.Group {
  const icDuvar = secenek.icDuvar ?? true;
  const doseme = secenek.doseme ?? true;
  const mobilya = secenek.mobilya ?? true;

  const grup = new THREE.Group();
  grup.name = `kat-${kat.ad}`;
  grup.position.y = katYuksekligi;

  const kutu = new THREE.BoxGeometry(1, 1, 1);

  for (const d of kat.duvarlar) {
    if (d.ic && !icDuvar) continue;
    const malzeme = d.ic ? mat.icDuvar() : mat.cephe(cepheTip);
    for (const p of duvarParcalari(d)) {
      const mesh = new THREE.Mesh(kutu, malzeme);
      mesh.scale.set(p.genislik, p.yukseklik, p.derinlik);
      mesh.position.copy(p.konum);
      mesh.rotation.y = -(p as unknown as { aci: number }).aci;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.name = d.ic ? 'ic-duvar' : 'dis-duvar';
      grup.add(mesh);

      // pencere camı
      const penc = (d.acikliklar ?? []).filter((a) => a.tip === 'pencere');
      void penc;
    }
    // pencerelere cam ekle
    // NUMEX-DUZELTME (2026-10-27, kullanıcı isteği \"pencereleri tak\"): cam tek başına
    // yapıştırılmış leke gibi duruyordu. Artık her pencere gerçek bir kurulum:
    // denizlik (alt söve) + yan söveler + üst lento + cam + ince kayıt profili.
    for (const a of d.acikliklar ?? []) {
      if (a.tip !== 'pencere') continue;
      const k = aciklikKonum(d, a);
      const orta = { x: (k.bas.x + k.son.x) / 2, z: (k.bas.z + k.son.z) / 2 };
      const taban = a.taban ?? 0.9;
      const ust = a.ust ?? 2.4;
      const yonAci = -(Math.atan2(d.z2 - d.z1, d.x2 - d.x1));
      const yuk = ust - taban;
      const disari = d.t / 2;

      // cam yüzeyi (duvar kalınlığının ortasında)
      const cam = new THREE.Mesh(kutu, mat.cam());
      cam.scale.set(a.genislik - 0.1, yuk - 0.1, 0.03);
      cam.position.set(orta.x, taban + yuk / 2, orta.z);
      cam.rotation.y = yonAci;
      cam.name = 'pencere-cam';
      grup.add(cam);

      // denizlik: alt söve, dışa taşar
      const denizlik = new THREE.Mesh(kutu, mat.sova());
      denizlik.scale.set(a.genislik + 0.16, 0.08, d.t + 0.12);
      denizlik.position.set(orta.x, taban - 0.04, orta.z);
      denizlik.rotation.y = yonAci;
      denizlik.name = 'pencere-denizlik';
      grup.add(denizlik);

      // sol ve sağ dikey profil
      const cerceveMat = mat.cerceve();
      for (const yon of [-1, 1]) {
        const dikey = new THREE.Mesh(kutu, cerceveMat);
        dikey.scale.set(0.07, yuk, d.t + 0.02);
        dikey.position.set(
          orta.x + Math.cos(Math.atan2(d.z2 - d.z1, d.x2 - d.x1)) * yon * (a.genislik / 2),
          taban + yuk / 2,
          orta.z + Math.sin(Math.atan2(d.z2 - d.z1, d.x2 - d.x1)) * yon * (a.genislik / 2)
        );
        dikey.rotation.y = yonAci;
        dikey.name = 'pencere-cerceve';
        grup.add(dikey);
      }
      // üst ve alt yatay profil
      for (const [yy, hh] of [
        [taban + 0.03, 0.06],
        [ust - 0.03, 0.06],
      ] as [number, number][]) {
        const yatay = new THREE.Mesh(kutu, cerceveMat);
        yatay.scale.set(a.genislik, hh, d.t + 0.02);
        yatay.position.set(orta.x, yy, orta.z);
        yatay.rotation.y = yonAci;
        yatay.name = 'pencere-cerceve';
        grup.add(yatay);
      }
      // orta kayıt (düşey) — pencereyi iki kanada böler
      if (a.genislik > 1.4) {
        const kayit = new THREE.Mesh(kutu, cerceveMat);
        kayit.scale.set(0.05, yuk, d.t + 0.02);
        kayit.position.set(orta.x, taban + yuk / 2, orta.z);
        kayit.rotation.y = yonAci;
        kayit.name = 'pencere-kayit';
        grup.add(kayit);
      }
      void disari;
    }
    // kapı kanadı
    // NUMEX-DUZELTME (2026-10-27, kullanıcı: "kapı detayı yok"): kapı düz kahverengi bir
    // dikdörtgenden ibaretti. Artık gerçek bir kapı kurulumu: kasa (çevre çerçevesi),
    // kanat, üst ışıklık (tepe camı), kol/pasparı ve eşik taşı.
    for (const a of d.acikliklar ?? []) {
      if (a.tip !== 'kapi') continue;
      const k = aciklikKonum(d, a);
      const orta = { x: (k.bas.x + k.son.x) / 2, z: (k.bas.z + k.son.z) / 2 };
      const aci = -(Math.atan2(d.z2 - d.z1, d.x2 - d.x1));
      const yonx = Math.cos(Math.atan2(d.z2 - d.z1, d.x2 - d.x1));
      const yonz = Math.sin(Math.atan2(d.z2 - d.z1, d.x2 - d.x1));
      const kapYuk = 2.1;

      // kanat
      const kanat = new THREE.Mesh(kutu, mat.kapi());
      kanat.scale.set(a.genislik - 0.12, kapYuk - 0.08, 0.07);
      kanat.position.set(orta.x, (kapYuk - 0.08) / 2 + 0.04, orta.z);
      kanat.rotation.y = aci;
      kanat.name = 'kapi';
      grup.add(kanat);

      // kasa: iki yan dikme + üst lento (dışa taşan çerçeve)
      const kasaMat = mat.cerceve();
      for (const yon of [-1, 1]) {
        const dikme = new THREE.Mesh(kutu, kasaMat);
        dikme.scale.set(0.1, kapYuk + 0.1, d.t + 0.06);
        dikme.position.set(
          orta.x + yonx * yon * (a.genislik / 2),
          (kapYuk + 0.1) / 2,
          orta.z + yonz * yon * (a.genislik / 2)
        );
        dikme.rotation.y = aci;
        dikme.name = 'kapi-kasa';
        grup.add(dikme);
      }
      const lento = new THREE.Mesh(kutu, kasaMat);
      lento.scale.set(a.genislik + 0.1, 0.1, d.t + 0.06);
      lento.position.set(orta.x, kapYuk + 0.05, orta.z);
      lento.rotation.y = aci;
      lento.name = 'kapi-lento';
      grup.add(lento);

      // üst ışıklık (tepe camı) — kapının üstünde kalan boşluk
      const isiklikYuk = Math.max(0.2, 2.55 - kapYuk);
      const isiklik = new THREE.Mesh(kutu, mat.cam());
      isiklik.scale.set(a.genislik - 0.16, isiklikYuk, 0.04);
      isiklik.position.set(orta.x, kapYuk + 0.06 + isiklikYuk / 2, orta.z);
      isiklik.rotation.y = aci;
      isiklik.name = 'kapi-isiklik';
      grup.add(isiklik);

      // kol / pasparı (bronz)
      const kolMat = new THREE.MeshStandardMaterial({ color: 0xa8813f, roughness: 0.35, metalness: 0.75 });
      const kol = new THREE.Mesh(kutu, kolMat);
      kol.scale.set(0.06, 0.26, 0.09);
      kol.position.set(
        orta.x + yonx * (a.genislik / 2 - 0.16),
        1.05,
        orta.z + yonz * (a.genislik / 2 - 0.16)
      );
      kol.rotation.y = aci;
      kol.name = 'kapi-kol';
      grup.add(kol);

      // eşik taşı
      const esik = new THREE.Mesh(kutu, mat.sova());
      esik.scale.set(a.genislik + 0.2, 0.06, d.t + 0.2);
      esik.position.set(orta.x, 0.03, orta.z);
      esik.rotation.y = aci;
      esik.name = 'kapi-esik';
      grup.add(esik);
    }
  }

  // döşeme
  if (doseme) {
    const plaka = new THREE.Mesh(kutu, mat.doseme());
    plaka.scale.set(kat.genislik, 0.22, kat.derinlik);
    plaka.position.set(kat.genislik / 2, -0.11, kat.derinlik / 2);
    plaka.receiveShadow = true;
    plaka.name = 'doseme';
    grup.add(plaka);
  }

  // mobilya
  if (mobilya) {
    for (const f of kat.mobilyalar ?? []) {
      const m = new THREE.Mesh(kutu, mat.mobilya(f.tip));
      m.scale.set(f.w, f.h, f.d);
      m.position.set(f.x + f.w / 2, f.h / 2 + 0.11, f.z + f.d / 2);
      m.castShadow = f.h > 0.6;
      m.receiveShadow = true;
      m.name = `mobilya-${f.tip}`;
      grup.add(m);
    }
  }

  return grup;
}

/**
 * Beşik çatı üretir — iki eğik plaka mahyada birleşir, alınlık kalkanları
 * üçgen boşlukları kapatır.
 *
 * NUMEX-DÜZELTME (2026-10-27, kullanıcı: "çatının altı hâlâ açık"): bu fonksiyon
 * yalnız keşif sayfasında vardı; ana sayfadaki hero sahnesi katEkle() ile kurulduğu
 * için ÇATISIZ bir kütle gösteriyordu. Çatı artık motorda: iki sahne de aynı
 * geometriyi kullanıyor.
 *
 * NOT (geometri): konum, eğik plakanın YATAY İZDÜŞÜMÜNÜN yarısıyla verilir —
 * eğik uzunluğun yarısıyla verilirse iki plaka toplamı binadan kısa kalır ve
 * saçakta boşluk açılır. Bu, ölçümle doğrulanmış tek doğru hesaptır.
 */
export function catiEkle(
  kat: KatPlan,
  mat: MalzemeKutuphanesi,
  cepheTip: MalzemeSecim,
  tabanY: number,
  secenek: { egimDerece?: number; sacak?: number } = {}
): THREE.Group {
  const grup = new THREE.Group();
  grup.name = 'cati';

  const egim = THREE.MathUtils.degToRad(secenek.egimDerece ?? 16);
  const sacak = secenek.sacak ?? 0.9;

  const genislik = kat.genislik + sacak * 2;
  const derinlik = kat.derinlik + sacak * 2;
  const merkezX = kat.genislik / 2;
  const merkezZ = kat.derinlik / 2;

  const yarimYatay = genislik / 2;
  const egikUzunluk = yarimYatay / Math.cos(egim);
  const yatayIzdusum = egikUzunluk * Math.cos(egim); // = yarimYatay
  const duseyYukselme = yarimYatay * Math.tan(egim);

  const sacakKotu = tabanY + 0.06;

  const malzeme = mat.cephe(cepheTip);
  const plakaGeo = new THREE.BoxGeometry(egikUzunluk, 0.22, derinlik);
  for (const yon of [-1, 1]) {
    const p = new THREE.Mesh(plakaGeo, malzeme);
    p.position.set(merkezX + (yon * yatayIzdusum) / 2, sacakKotu + duseyYukselme / 2, merkezZ);
    p.rotation.z = -yon * egim;
    p.castShadow = true;
    p.receiveShadow = false;
    p.name = 'cati-plaka';
    grup.add(p);
  }

  // alınlık kalkanları: çatı ile duvar arasındaki üçgen boşluğu kapatır
  const kalkanYuk = duseyYukselme + 0.12;
  const sekil = new THREE.Shape();
  sekil.moveTo(-kat.genislik / 2 - 0.05, 0);
  sekil.lineTo(kat.genislik / 2 + 0.05, 0);
  sekil.lineTo(0, kalkanYuk);
  sekil.closePath();
  const kalkanMat = new THREE.MeshStandardMaterial({ color: 0xe8e0d1, roughness: 0.87 });
  for (const z of [kat.derinlik + 0.02, -0.12]) {
    const kalkan = new THREE.Mesh(
      new THREE.ExtrudeGeometry(sekil, { depth: 0.24, bevelEnabled: false }),
      kalkanMat
    );
    kalkan.position.set(merkezX, tabanY - 0.02, z);
    kalkan.castShadow = true;
    kalkan.receiveShadow = true;
    kalkan.name = 'cati-alinlik';
    grup.add(kalkan);
  }

  // NUMEX-DÜZELTME (2026-10-27, kullanıcı: "çatının altındaki kahverengi tahtayı kaldır"):
  // mahya kirişi plakaların ALTINDAN sarkıyor, çatının alt yüzünde kahverengi bir çubuk
  // olarak görünüyordu. Plakalar zaten mahyada birleşiyor; ayrı kirişe gerek yok.
  // Kaldırıldı — çatı üstten temiz tek kütle olarak okunuyor.

  return grup;
}

export type SahneSecenek = {
  /** sahne kapsayıcısı */ kap: HTMLElement;
  /** arka plan rengi */ arka?: number;
  /** gölge aktif mi */ golge?: boolean;
  /** otomatik döndürme */ don?: boolean;
};

/** Sahne kurulumu — tek yerden yönetilir */
export class MimariSahne {
  readonly sahne: THREE.Scene;
  readonly kamera: THREE.PerspectiveCamera;
  readonly renderci: THREE.WebGLRenderer;
  readonly kontroller: OrbitControls;
  private mat = new MalzemeKutuphanesi();
  private kok = new THREE.Group();
  /** geçici (bosalt ile silinecek) katmanlar */
  private gecici: THREE.Group[] = [];
  private raf = 0;
  private yasam = true;
  private isikGrup = new THREE.Group();

  constructor(private sec: SahneSecenek) {
    this.sahne = new THREE.Scene();
    this.sahne.background = new THREE.Color(sec.arka ?? 0xf4f0e9);

    const w = sec.kap.clientWidth || 800;
    const h = sec.kap.clientHeight || 520;

    this.kamera = new THREE.PerspectiveCamera(42, w / h, 0.1, 400);
    this.kamera.position.set(-16, 16, 22);

    this.renderci = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    this.renderci.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderci.setSize(w, h);
    this.renderci.shadowMap.enabled = sec.golge ?? true;
    this.renderci.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderci.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderci.toneMappingExposure = 1.05;
    sec.kap.appendChild(this.renderci.domElement);

    this.kontroller = new OrbitControls(this.kamera, this.renderci.domElement);
    this.kontroller.enableDamping = true;
    this.kontroller.dampingFactor = 0.08;
    this.kontroller.minDistance = 4;
    this.kontroller.maxDistance = 90;
    this.kontroller.maxPolarAngle = Math.PI / 2 - 0.04;
    this.kontroller.autoRotate = sec.don ?? false;
    this.kontroller.autoRotateSpeed = 0.6;
    this.kontroller.target.set(7, 1.4, 5.5);

    this.sahne.add(this.kok);
    this.isiklar();
    this.zemin();

    this.dongu();
  }

  private isiklar(): void {
    const hemisfer = new THREE.HemisphereLight(0xfff6e6, 0x8a8272, 1.15);
    this.sahne.add(hemisfer);

    const gunes = new THREE.DirectionalLight(0xfff1d8, 2.4);
    gunes.position.set(-24, 34, 18);
    gunes.castShadow = true;
    gunes.shadow.mapSize.set(1024, 1024);
    gunes.shadow.camera.left = -40;
    gunes.shadow.camera.right = 40;
    gunes.shadow.camera.top = 40;
    gunes.shadow.camera.bottom = -40;
    gunes.shadow.bias = -0.0007;
    this.isikGrup.add(gunes);

    const dolgu = new THREE.DirectionalLight(0xdfe8ee, 0.55);
    dolgu.position.set(20, 12, -18);
    this.isikGrup.add(dolgu);

    this.sahne.add(this.isikGrup);
  }

  private zemin(): void {
    const z = new THREE.Mesh(
      new THREE.PlaneGeometry(240, 240),
      new THREE.MeshStandardMaterial({ color: 0xd8d1c3, roughness: 1 })
    );
    z.rotation.x = -Math.PI / 2;
    z.position.y = -0.24;
    z.receiveShadow = true;
    z.name = 'arsa';
    this.sahne.add(z);
  }

  /** Gece / gündüz ışık ayarı */
  gece(deger: boolean): void {
    if (deger) {
      this.sahne.background = new THREE.Color(0x14161c);
      const [h, g, d] = this.isikGrup.children as THREE.Light[];
      if (h) (h as THREE.HemisphereLight).intensity = 0.35;
      h.color = new THREE.Color(0x2b3f5c);
      if (g) g.intensity = 0.5;
      g.color = new THREE.Color(0x9fb8e0);
      if (d) d.intensity = 0.2;
      this.renderci.toneMappingExposure = 0.95;
    } else {
      this.sahne.background = new THREE.Color(0xf4f0e9);
      const [h, g, d] = this.isikGrup.children as THREE.Light[];
      if (h) (h as THREE.HemisphereLight).intensity = 1.15;
      h.color = new THREE.Color(0xfff6e6);
      if (g) g.intensity = 2.4;
      g.color = new THREE.Color(0xfff1d8);
      if (d) d.intensity = 0.55;
      this.renderci.toneMappingExposure = 1.05;
    }
  }

  /**
   * Sahne içeriğini temizler.
   * NUMEX-DÜZELTME (2026-10-26): eski sürüm `this.kok.clear()` çağırıyordu; bu, kalıcı olarak
   * eklenen grupları (çatı/pergola) da sahneden koparıyordu — çatı yenilemeden sonra kayboluyordu.
   * Artık yalnızca `ekle()` ile gelen geçici katmanlar silinir; kalıcı gruplar korunur.
   */
  bosalt(): void {
    for (const g of this.gecici) {
      this.kok.remove(g);
      g.traverse((o) => {
        const m = o as THREE.Mesh;
        if (m.isMesh) m.geometry?.dispose?.();
      });
    }
    this.gecici = [];
  }

  /** Kalıcı grup ekler (temizlemeden etkilenmez) */
  kaliciEkle(grup: THREE.Group): void {
    this.kok.add(grup);
  }

  /** Geçici katman ekle — bosalt() ile birlikte silinir */
  ekle(grup: THREE.Group): void {
    this.kok.add(grup);
    this.gecici.push(grup);
  }

  malzemeler(): MalzemeKutuphanesi {
    return this.mat;
  }

  kameraAyarla(g: Gorunum): void {
    if (g === 'ust') {
      this.kamera.position.set(7, 42, 5.6);
      this.kontroller.target.set(7, 0, 5.5);
    } else if (g === 'ic') {
      this.kamera.position.set(3.2, 1.65, 4.6);
      this.kontroller.target.set(10.5, 1.5, 5.2);
      this.kontroller.maxPolarAngle = Math.PI - 0.1;
    } else {
      this.kamera.position.set(-17, 15, 23);
      this.kontroller.target.set(7, 1.4, 5.5);
      this.kontroller.maxPolarAngle = Math.PI / 2 - 0.04;
    }
    this.kamera.updateProjectionMatrix();
    this.kontroller.update();
  }

  boyutla(): void {
    const w = this.sec.kap.clientWidth;
    const h = this.sec.kap.clientHeight;
    if (!w || !h) return;
    this.kamera.aspect = w / h;
    this.kamera.updateProjectionMatrix();
    this.renderci.setSize(w, h, false);
  }

  private dongu = (): void => {
    if (!this.yasam) return;
    this.raf = requestAnimationFrame(this.dongu);
    this.kontroller.update();
    this.renderci.render(this.sahne, this.kamera);
  };

  yokEt(): void {
    this.yasam = false;
    cancelAnimationFrame(this.raf);
    this.kontroller.dispose();
    this.mat.temizle();
    this.renderci.dispose();
    this.renderci.domElement.remove();
  }
}
