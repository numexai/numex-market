// Dream City — atmosfer: gündüz / gün batımı / gece, yağmur, kar, sis, ay ve yıldızlar
// Renkler Ghibli paletinden: sıcak kehribar, şeftali, derin lacivert.

import * as THREE from '../vendor/three.module.js';
import { aralik, sans, rast } from './utils.js';

// Anahtar kareler: her zaman diliminin ışık ve gökyüzü değerleri
export const ZAMANLAR = {
  gunduz: {
    ad: 'Gündüz', saat: '13:20',
    gokyuzuUst: 0x5fa8dd, gokyuzuAlt: 0xbfe0f2,
    gunes: 0xffe9b8, gunesGuc: 2.9, gunesKonum: [28, 42, 20],
    ortam: 0xbfd9ea, ortamGuc: 0.92,
    sis: 0xbcd9e6, sisYakin: 78, sisUzak: 240,
    gece: 0, yildiz: 0, bloom: 0.16, doygunluk: 1.06,
  },
  gunbatimi: {
    ad: 'Gün Batımı', saat: '19:05',
    gokyuzuUst: 0x6a3f7a, gokyuzuAlt: 0xffb072,
    gunes: 0xffb06b, gunesGuc: 2.2, gunesKonum: [-48, 12, 26],
    ortam: 0xffd0b0, ortamGuc: 0.85,
    sis: 0xe8a276, sisYakin: 62, sisUzak: 195,
    gece: 0.45, yildiz: 0.12, bloom: 0.4, doygunluk: 1.22,
  },
  gece: {
    ad: 'Gece', saat: '22:40',
    gokyuzuUst: 0x070d22, gokyuzuAlt: 0x1d2a4e,
    gunes: 0x9db6ff, gunesGuc: 0.55, gunesKonum: [-26, 34, -18],
    ortam: 0x3a4a7a, ortamGuc: 0.55,
    sis: 0x121a33, sisYakin: 55, sisUzak: 190,
    gece: 1, yildiz: 1, bloom: 0.62, doygunluk: 1.12,
  },
};

export class Atmosfer {
  constructor(sahne, renderer) {
    this.sahne = sahne;
    this.renderer = renderer;
    this.zaman = 'gece';
    this.hava = 'yok';
    this.gecis = 0; // 0→1 yumuşak geçiş
    this.hedef = { ...ZAMANLAR.gece };
    this.mevcut = this._kopyala(ZAMANLAR.gece);

    this._isiklar();
    this._gokyuzu();
    this._yagmur();
    this._kar();
    this._uygula(1);
  }

  _kopyala(k) {
    const o = {};
    for (const [anahtar, deger] of Object.entries(k)) {
      o[anahtar] = Array.isArray(deger) ? [...deger] : deger;
    }
    return o;
  }

  // ---------- ışıklar ----------
  _isiklar() {
    const ambiyans = new THREE.AmbientLight(0xcfe3ef, 0.8);
    this.sahne.add(ambiyans);
    this.ambiyans = ambiyans;

    const ana = new THREE.DirectionalLight(0xffffff, 2.2);
    ana.position.set(20, 30, 16);
    ana.castShadow = true;
    ana.shadow.mapSize.set(2048, 2048);
    const b = 42;
    ana.shadow.camera.left = -b;
    ana.shadow.camera.right = b;
    ana.shadow.camera.top = b;
    ana.shadow.camera.bottom = -b;
    ana.shadow.camera.near = 1;
    ana.shadow.camera.far = 140;
    ana.shadow.bias = -0.0008;
    ana.shadow.normalBias = 0.02;
    this.sahne.add(ana);
    this.ana = ana;

    // sıcak dolgu ışığı (şehre masal havası veren kehribar)
    const dolgu = new THREE.PointLight(0xffb066, 0, 90, 2);
    dolgu.position.set(0, 12, 0);
    this.sahne.add(dolgu);
    this.dolgu = dolgu;
  }

  // ---------- gökyüzü + yıldızlar + ay ----------
  _gokyuzu() {
    const geometri = new THREE.SphereGeometry(420, 24, 16);
    const malzeme = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      uniforms: {
        ust: { value: new THREE.Color(0x070d22) },
        alt: { value: new THREE.Color(0x1d2a4e) },
      },
      vertexShader: `
        varying vec3 vPoz;
        void main() {
          vPoz = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 ust;
        uniform vec3 alt;
        varying vec3 vPoz;
        void main() {
          float h = clamp((normalize(vPoz).y + 0.35) / 1.35, 0.0, 1.0);
          vec3 renk = mix(alt, ust, pow(h, 0.85));
          // ufukta hafif sıcak parıltı
          float ufuk = pow(1.0 - clamp(abs(normalize(vPoz).y) * 3.2, 0.0, 1.0), 4.0);
          renk += alt * ufuk * 0.35;
          gl_FragColor = vec4(renk, 1.0);
        }
      `,
    });
    this.gokyuzu = new THREE.Mesh(geometri, malzeme);
    this.sahne.add(this.gokyuzu);

    // yıldızlar
    const yildizSayi = 1100;
    const konum = new Float32Array(yildizSayi * 3);
    for (let i = 0; i < yildizSayi; i++) {
      const r = 380;
      const teta = rast() * Math.PI * 2;
      const phi = Math.acos(aralik(0.05, 1));
      konum[i * 3] = r * Math.sin(phi) * Math.cos(teta);
      konum[i * 3 + 1] = r * Math.cos(phi) * 0.9 + 30;
      konum[i * 3 + 2] = r * Math.sin(phi) * Math.sin(teta);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(konum, 3));
    const mat = new THREE.PointsMaterial({
      color: 0xfff2d0, size: 1.9, sizeAttenuation: true, transparent: true, opacity: 0, depthWrite: false,
    });
    this.yildizlar = new THREE.Points(geo, mat);
    this.sahne.add(this.yildizlar);

    // ay
    const ay = new THREE.Mesh(
      new THREE.SphereGeometry(9, 24, 18),
      new THREE.MeshBasicMaterial({ color: 0xfff3d0, transparent: true, opacity: 0.9 })
    );
    ay.position.set(-95, 98, -110);
    this.ay = ay;
    this.sahne.add(ay);

    const ayHale = new THREE.Mesh(
      new THREE.SphereGeometry(17, 24, 18),
      new THREE.MeshBasicMaterial({
        color: 0xffe6b0, transparent: true, opacity: 0.12, depthWrite: false,
        blending: THREE.AdditiveBlending,
      })
    );
    ayHale.position.copy(ay.position);
    this.ayHale = ayHale;
    this.sahne.add(ayHale);

    this.sahne.fog = new THREE.Fog(0x121a33, 40, 150);
  }

  // ---------- yağmur ----------
  _yagmur() {
    const adet = 4200;
    const konum = new Float32Array(adet * 3);
    const hiz = new Float32Array(adet);
    for (let i = 0; i < adet; i++) {
      konum[i * 3] = aralik(-48, 48);
      konum[i * 3 + 1] = aralik(0, 44);
      konum[i * 3 + 2] = aralik(-48, 48);
      hiz[i] = aralik(15, 26);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(konum, 3));
    const mat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      opacity: 0,
      uniforms: {
        renk: { value: new THREE.Color(0xbcd8ee) },
        saydam: { value: 0 },
      },
      vertexShader: `
        void main() {
          gl_PointSize = 9.0;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 renk;
        uniform float saydam;
        void main() {
          // ince dikey çizgi: yatayda dar, dikeyde uzun
          float dx = abs(gl_PointCoord.x - 0.5);
          float dy = abs(gl_PointCoord.y - 0.5);
          float alfa = smoothstep(0.16, 0.0, dx) * smoothstep(0.5, 0.15, dy) * saydam;
          if (alfa < 0.02) discard;
          gl_FragColor = vec4(renk, alfa);
        }
      `,
    });
    this.yagmur = new THREE.Points(geo, mat);
    this.yagmur.visible = false;
    this.sahne.add(this.yagmur);
    this.yagmurHiz = hiz;
  }

  // ---------- kar ----------
  _kar() {
    const adet = 2600;
    const konum = new Float32Array(adet * 3);
    const faz = new Float32Array(adet);
    for (let i = 0; i < adet; i++) {
      konum[i * 3] = aralik(-48, 48);
      konum[i * 3 + 1] = aralik(0, 46);
      konum[i * 3 + 2] = aralik(-48, 48);
      faz[i] = rast() * 6.28;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(konum, 3));
    const mat = new THREE.PointsMaterial({
      color: 0xffffff, size: 0.24, transparent: true, opacity: 0, depthWrite: false,
    });
    this.kar = new THREE.Points(geo, mat);
    this.kar.visible = false;
    this.sahne.add(this.kar);
    this.karFaz = faz;
  }

  // ---------- dışa açık ----------
  zamanAyarla(anahtar) {
    if (!ZAMANLAR[anahtar]) return;
    this.zaman = anahtar;
    this.hedef = this._kopyala(ZAMANLAR[anahtar]);
  }

  havaAyarla(tur) {
    this.hava = tur;
    this.yagmur.visible = tur === 'yagmur';
    if (this.yildizlar) this.yildizlar.visible = this.mevcut.yildiz > 0.02 && tur !== 'yagmur';
    this.kar.visible = tur === 'kar';
  }

  _uygula(yumusak = 0.06) {
    const m = this.mevcut;
    const h = this.hedef;
    const t = yumusak;

    // renkler
    for (const anahtar of ['gokyuzuUst', 'gokyuzuAlt', 'gunes', 'ortam', 'sis']) {
      m[anahtar] = m[anahtar] ?? 0;
    }
    const karis = (a, b, tt) => new THREE.Color(a).lerp(new THREE.Color(b), tt);

    // skaler değerleri yumuşat
    for (const anahtar of ['gunesGuc', 'ortamGuc', 'sisYakin', 'sisUzak', 'gece', 'yildiz', 'bloom', 'doygunluk']) {
      if (typeof h[anahtar] === 'number' && typeof m[anahtar] === 'number') {
        m[anahtar] += (h[anahtar] - m[anahtar]) * t;
      } else if (typeof h[anahtar] === 'number') {
        m[anahtar] = h[anahtar];
      }
    }
    for (const anahtar of ['gokyuzuUst', 'gokyuzuAlt', 'gunes', 'ortam', 'sis']) {
      m[anahtar] = karis(m[anahtar] || h[anahtar], h[anahtar], t).getHex();
    }
    // konum
    m.gunesKonum = m.gunesKonum ? m.gunesKonum : [...h.gunesKonum];
    for (let i = 0; i < 3; i++) m.gunesKonum[i] += (h.gunesKonum[i] - m.gunesKonum[i]) * t;

    // uygula
    this.gokyuzu.material.uniforms.ust.value.setHex(m.gokyuzuUst);
    this.gokyuzu.material.uniforms.alt.value.setHex(m.gokyuzuAlt);

    this.ana.color.setHex(m.gunes);
    this.ana.intensity = m.gunesGuc;
    this.ana.position.set(m.gunesKonum[0], m.gunesKonum[1], m.gunesKonum[2]);

    this.ambiyans.color.setHex(m.ortam);
    this.ambiyans.intensity = m.ortamGuc;

    this.dolgu.intensity = m.gece * 30;
    this.dolgu.position.set(0, 10, 0);

    this.sahne.fog.color.setHex(m.sis);
    this.sahne.fog.near = m.sisYakin;
    this.sahne.fog.far = m.sisUzak;

    this.yildizlar.material.opacity = m.yildiz;
    this.yildizlar.visible = m.yildiz > 0.02;
    this.ay.material.opacity = 0.25 + m.gece * 0.7;
    this.ayHale.material.opacity = 0.02 + m.gece * 0.12;

    this.renderer.toneMappingExposure = 0.95 + m.gece * 0.1;
    const bloom = globalThis.__dreamBloom;
    if (bloom) {
      bloom.strength = m.bloom * (this.hava === 'yok' ? 1 : 1.15);
    }

    return m.gece;
  }

  guncelle(dt) {
    const gece = this._uygula(Math.min(1, dt * 1.8));

    // yağmur damlaları
    if (this.yagmur.visible) {
      const p = this.yagmur.geometry.attributes.position;
      for (let i = 0; i < p.count; i++) {
        let y = p.getY(i) - this.yagmurHiz[i] * dt;
        if (y < 0) {
          y = 44;
          p.setX(i, aralik(-48, 48));
          p.setZ(i, aralik(-48, 48));
        }
        p.setY(i, y);
      }
      p.needsUpdate = true;
      const u = this.yagmur.material.uniforms.saydam;
      u.value += (0.5 - u.value) * Math.min(1, dt * 2);
    } else {
      const u = this.yagmur.material.uniforms.saydam;
      u.value += (0 - u.value) * Math.min(1, dt * 3);
    }

    // kar taneleri
    if (this.kar.visible) {
      const p = this.kar.geometry.attributes.position;
      const z = performance.now() * 0.001;
      for (let i = 0; i < p.count; i++) {
        let y = p.getY(i) - dt * 1.6;
        if (y < 0) y = 46;
        p.setY(i, y);
        p.setX(i, p.getX(i) + Math.sin(z + this.karFaz[i]) * dt * 0.5);
      }
      p.needsUpdate = true;
      this.kar.material.opacity += (0.85 - this.kar.material.opacity) * Math.min(1, dt * 2);
    } else {
      this.kar.material.opacity += (0 - this.kar.material.opacity) * Math.min(1, dt * 3);
    }

    return gece;
  }
}
