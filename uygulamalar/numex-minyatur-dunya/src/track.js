// Ray hattı: kullanıcının yerleştirdiği ray parçalarından kesintisiz hat çıkarır,
// tren bu hattın üzerinde gerçekten hareket eder.
import * as THREE from 'three';

const RAY_BOY = 2.0;      // bir ray parçası (objects.js ile aynı)
const TOLERANS = 0.55;    // uç birleştirme toleransı

export class RayHatti {
  constructor() {
    this.egri = null;
    this.kapali = false;
    this.uzunluk = 0;
    this.parcaSayisi = 0;
    this.noktalar = [];
  }

  /** raylar: [{x, z, rotY}] */
  kur(raylar) {
    this.egri = null; this.kapali = false; this.uzunluk = 0; this.parcaSayisi = 0;
    if (!raylar || raylar.length < 2) return this;

    const parcalar = raylar.map(r => {
      const dx = Math.sin(r.rotY || 0), dz = Math.cos(r.rotY || 0);
      return {
        a: new THREE.Vector3(r.x - dx * (RAY_BOY / 2), 0, r.z - dz * (RAY_BOY / 2)),
        b: new THREE.Vector3(r.x + dx * (RAY_BOY / 2), 0, r.z + dz * (RAY_BOY / 2)),
      };
    });

    const kullanilan = new Array(parcalar.length).fill(false);

    const enYakin = (nokta) => {
      let en = -1, mesafe = TOLERANS;
      for (let i = 0; i < parcalar.length; i++) {
        if (kullanilan[i]) continue;
        const d = Math.min(parcalar[i].a.distanceTo(nokta), parcalar[i].b.distanceTo(nokta));
        if (d < mesafe) { mesafe = d; en = i; }
      }
      return en;
    };

    // zincirleri topla, en uzununu seç
    let enIyi = { noktalar: [], kapali: false, adet: 0 };

    for (let bas = 0; bas < parcalar.length; bas++) {
      if (kullanilan[bas]) continue;
      kullanilan[bas] = true;
      const zincir = [parcalar[bas].a.clone(), parcalar[bas].b.clone()];
      let adet = 1;

      // ileri
      let son = zincir[zincir.length - 1];
      let kapali = false;
      for (let adim = 0; adim < parcalar.length; adim++) {
        const i = enYakin(son);
        if (i < 0) {
          if (zincir.length > 2 && zincir[0].distanceTo(son) < TOLERANS) kapali = true;
          break;
        }
        kullanilan[i] = true;
        adet++;
        const p = parcalar[i];
        if (p.a.distanceTo(son) < p.b.distanceTo(son)) { zincir.push(p.b.clone()); son = p.b; }
        else { zincir.push(p.a.clone()); son = p.a; }
      }

      // geriye doğru (kapalı değilse baştan geriye ekle)
      if (!kapali) {
        let ilk = zincir[0];
        for (let adim = 0; adim < parcalar.length; adim++) {
          const i = enYakin(ilk);
          if (i < 0) break;
          kullanilan[i] = true;
          adet++;
          const p = parcalar[i];
          if (p.b.distanceTo(ilk) < p.a.distanceTo(ilk)) { zincir.unshift(p.a.clone()); ilk = p.a; }
          else { zincir.unshift(p.b.clone()); ilk = p.b; }
        }
      }

      if (adet > enIyi.adet) enIyi = { noktalar: zincir, kapali, adet };
    }

    if (enIyi.noktalar.length < 2) return this;

    // yinelenen ardışık noktaları at
    const noktalar = [];
    for (const n of enIyi.noktalar) {
      if (noktalar.length === 0 || noktalar[noktalar.length - 1].distanceTo(n) > 0.02) noktalar.push(n);
    }
    if (enIyi.kapali && noktalar.length > 2) noktalar.pop(); // kapalıda son = ilk

    const egri = new THREE.CatmullRomCurve3(noktalar, enIyi.kapali, 'centripetal', 0.5);
    this.egri = egri;
    this.kapali = enIyi.kapali;
    this.noktalar = noktalar;
    this.parcaSayisi = enIyi.adet;
    this.uzunluk = egri.getLength();
    return this;
  }

  get hazir() { return !!this.egri && this.uzunluk > 1.5; }

  /** mesafe (m) -> konum + yön */
  al(mesafe) {
    if (!this.hazir) return null;
    let u;
    if (this.kapali) {
      u = ((mesafe % this.uzunluk) + this.uzunluk) % this.uzunluk / this.uzunluk;
    } else {
      const tur = this.uzunluk * 2;
      let m = ((mesafe % tur) + tur) % tur;
      if (m > this.uzunluk) m = tur - m;
      u = m / this.uzunluk;
    }
    const konum = this.egri.getPointAt(Math.min(0.999999, Math.max(0, u)));
    const yon = this.egri.getTangentAt(Math.min(0.999999, Math.max(0, u)));
    return { konum, yon };
  }

  /** verilen dünya noktasına en yakın hat mesafesi (m) */
  enYakinMesafe(nokta) {
    if (!this.hazir) return 0;
    let en = Infinity, enM = 0;
    const adim = 120;
    for (let i = 0; i <= adim; i++) {
      const m = (i / adim) * this.uzunluk;
      const p = this.al(m).konum;
      const d = p.distanceToSquared(nokta);
      if (d < en) { en = d; enM = m; }
    }
    return enM;
  }
}
