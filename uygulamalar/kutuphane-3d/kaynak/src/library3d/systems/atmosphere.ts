import * as THREE from 'three';

/**
 * Kütüphane atmosferi: gökyüzü gradyanı, güneş/ay yönü, gün/gece geçişi.
 *
 * Mevcut binanın Atmosphere sınıfından bağımsızdır (o sınıf bina verisine,
 * hava durumuna ve PMREM üretimine bağlı). Kütüphane daha yalın bir yol
 * izler: tek shader küre + iki ışık + ışık yoğunluk eğrisi.
 */

export type DayPhase = 'day' | 'sunset' | 'night';

export class LibraryAtmosphere {
  readonly sun: THREE.DirectionalLight;
  readonly hemi: THREE.HemisphereLight;
  readonly ambient: THREE.AmbientLight;
  /** Gece iç mekân dolgu ışığı (sun sönerken içeriyi aydınlatır) */
  readonly interiorFill: THREE.PointLight;

  private sky: THREE.Mesh;
  private skyMat: THREE.ShaderMaterial;
  private sunDir = new THREE.Vector3(0.6, 0.7, 0.45).normalize();

  hour = 17.5;
  phase: DayPhase = 'sunset';
  onChange: ((hour: number, phase: DayPhase) => void) | null = null;

  /** Sahne sisi — rengini ufuk renginden alır (gökyüzüyle bütünleşsin) */
  fog: THREE.FogExp2 | null = null;

  constructor(scene: THREE.Scene) {
    /* --- Gökyüzü küresi --- */
    const skyGeo = new THREE.SphereGeometry(320, 32, 20);
    this.skyMat = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      uniforms: {
        uTop: { value: new THREE.Color(0x2a6fb0) },
        uHorizon: { value: new THREE.Color(0xd8ecff) },
        uBottom: { value: new THREE.Color(0xb8c4cc) },
        uSunColor: { value: new THREE.Color(0xfff4d8) },
        uSunDir: { value: this.sunDir.clone() },
        uSunStrength: { value: 1.0 },
      },
      vertexShader: /* glsl */ `
        varying vec3 vDir;
        void main() {
          vec4 wp = modelMatrix * vec4(position, 1.0);
          vDir = normalize(wp.xyz - cameraPosition);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: /* glsl */ `
        uniform vec3 uTop;
        uniform vec3 uHorizon;
        uniform vec3 uBottom;
        uniform vec3 uSunColor;
        uniform vec3 uSunDir;
        uniform float uSunStrength;
        varying vec3 vDir;

        void main() {
          vec3 d = normalize(vDir);
          float h = d.y;
          vec3 col = mix(uHorizon, uTop, pow(clamp(h, 0.0, 1.0), 0.6));
          col = mix(col, uBottom, pow(clamp(-h, 0.0, 1.0), 1.6) * 0.9);

          // güneş diski + halo
          float sun = dot(d, normalize(uSunDir));
          float disc = smoothstep(0.9975, 0.9995, sun);
          float halo = pow(max(sun, 0.0), 48.0) * 0.6 + pow(max(sun, 0.0), 6.0) * 0.10;
          col += uSunColor * ((disc * 3.0) + halo) * uSunStrength;

          gl_FragColor = vec4(col, 1.0);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }
      `,
    });
    this.sky = new THREE.Mesh(skyGeo, this.skyMat);
    this.sky.name = 'gokyuzu';
    this.sky.frustumCulled = false;
    scene.add(this.sky);

    /* --- Işıklar --- */
    this.sun = new THREE.DirectionalLight(0xfff1d8, 2.6);
    this.sun.position.copy(this.sunDir.clone().multiplyScalar(60));
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(2048, 2048);
    this.sun.shadow.camera.near = 1;
    this.sun.shadow.camera.far = 160;
    const S = 30;
    this.sun.shadow.camera.left = -S;
    this.sun.shadow.camera.right = S;
    this.sun.shadow.camera.top = S;
    this.sun.shadow.camera.bottom = -S;
    this.sun.shadow.bias = -0.0012;
    this.sun.shadow.normalBias = 0.02;
    scene.add(this.sun);
    scene.add(this.sun.target);

    this.hemi = new THREE.HemisphereLight(0xcfe4f5, 0x4a5a42, 0.85);
    scene.add(this.hemi);

    this.ambient = new THREE.AmbientLight(0xffffff, 0.22);
    scene.add(this.ambient);

    // İç mekân dolgu: gece dışarısı kararınca okuma salonları görünür kalsın
    this.interiorFill = new THREE.PointLight(0xffd9a8, 0, 42, 1.6);
    this.interiorFill.position.set(0, 7, 0);
    scene.add(this.interiorFill);

    this.setHour(17.5);
  }

  setHour(hour: number): void {
    this.hour = Math.max(0, Math.min(24, hour));
    const h = this.hour;
    const u = this.skyMat.uniforms;

    /* --- Güneş yönü: saat → açı (06 doğuş, 12 tepe, 19 batış) --- */
    const dayT = (h - 6) / 13; // 0..1 arası gündüz
    const elev = Math.sin(Math.PI * Math.max(0, Math.min(1, dayT))) * 1.15;
    const azim = Math.PI * (dayT - 0.5) * 1.1;
    this.sunDir.set(Math.sin(azim), Math.max(-0.35, elev), Math.cos(azim) * 0.75 + 0.25).normalize();
    u.uSunDir.value.copy(this.sunDir);

    /* --- Aydınlanma eğrisi --- */
    // Gece oranı: güneş yüksekliği 0'ın altına indikçe koyulaşır.
    // (Önceki formül `dayness`e bağlıydı ve 17:30'da bile "gündüz" sayıyordu;
    //  bu yüzden akşam sahnesi menekşe/gündüz karışımı görünüyordu.)
    const elevPos = Math.max(0, Math.min(1, elev / 1.15));       // 0 = ufuk, 1 = tepe
    const nightF = Math.pow(1 - elevPos, 1.6);
    const dayness = elevPos;
    // Gün batımı: ufka yakın + öğleden sonra
    const sunsetF = Math.max(0, 1 - Math.abs(elevPos - 0.18) * 3.4) * (h > 12 ? 1 : 0.3);

    // Gökyüzü renkleri
    const cTopDay = new THREE.Color(0x2a6fb0);
    const cTopSet = new THREE.Color(0x1d3b63);
    const cTopNight = new THREE.Color(0x050b18);
    const cHorDay = new THREE.Color(0xd8ecff);
    const cHorSet = new THREE.Color(0xff9d5c);
    const cHorNight = new THREE.Color(0x111d33);

    const top = cTopDay.clone().lerp(cTopSet, sunsetF).lerp(cTopNight, nightF);
    const hor = cHorDay.clone().lerp(cHorSet, sunsetF).lerp(cHorNight, nightF);
    u.uTop.value.copy(top);
    u.uHorizon.value.copy(hor);
    u.uBottom.value.copy(hor.clone().multiplyScalar(0.75));
    u.uSunColor.value.copy(new THREE.Color(0xfff4d8).lerp(new THREE.Color(0xff8a3c), sunsetF));
    u.uSunStrength.value = dayness * (1 - nightF) + sunsetF * 0.4;

    // Işıklar
    this.sun.intensity = 3.1 * dayness;
    this.sun.color.setHex(sunsetF > 0.35 ? 0xffd0a0 : 0xfff6e8);
    this.sun.position.copy(this.sunDir.clone().multiplyScalar(60));
    this.sun.visible = dayness > 0.02;

    this.hemi.intensity = 0.3 + 0.7 * dayness;
    // Gökyüzü yarımküre rengi: gündüz NÖTR beyaz-mavi (mavi ton verme —
    // ilk ölçümde bina duvarları leylak/mor çıkıyordu)
    this.hemi.color.setHex(nightF > 0.5 ? 0x2a3a55 : 0xf0f5ff);
    this.hemi.groundColor.setHex(nightF > 0.5 ? 0x141a20 : 0x4a5a42);

    this.ambient.intensity = 0.1 + 0.2 * dayness;
    this.ambient.color.setHex(nightF > 0.5 ? 0x9fb4d0 : 0xffffff);

    // Gece iç dolgu (okuma salonları sıcak ışıkla parlar)
    this.interiorFill.intensity = 24 * nightF;

    // Sis rengi ufuk rengiyle aynı → uzak yüzeyler gökyüzüne karışır,
    // ayrı bir perde olarak görünmez. Yoğunluk gece azalır (şehir ışığı).
    if (this.fog) {
      this.fog.color.copy(hor);
      this.fog.density = 0.0011 + nightF * 0.0006;
    }

    this.phase = nightF > 0.55 ? 'night' : (sunsetF > 0.3 ? 'sunset' : 'day');
    this.onChange?.(this.hour, this.phase);
  }

  get isNight(): boolean {
    return this.phase === 'night';
  }

  /** Gökyüzü küresini kameraya sabitle (sonsuz uzaklık hissi) */
  update(camera: THREE.Camera): void {
    // Gökyüzü küresini kameraya sabitle — gölgelendirici zaten yön tabanlı,
    // ama küre kameradan uzaklaşırsa near/far kırpmasına takılabilir.
    this.sky.position.copy(camera.position);
    // Ufuk rengi aradaki geçişte donmasın: saat değiştiğinde yeniden uygula.
    if (this.dirty) {
      this.dirty = false;
      this.setHour(this.hour);
    }
  }

  /** Saat değiştiğinde renkleri yeniden hesaplat */
  private dirty = false;
  markDirty(): void { this.dirty = true; }

  dispose(): void {
    this.sky.geometry.dispose();
    this.skyMat.dispose();
  }
}
