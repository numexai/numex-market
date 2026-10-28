import * as THREE from 'three';
import { setEnvMap, getMaterial } from '../core/materials';

/**
 * Atmosfer: gökyüzü shader'ı, güneş yönü, renk sıcaklığı, gölge kalitesi,
 * gün/gece geçişi, hava durumu (yağmur/kar) ve PMREM ortam haritası.
 */

export type Weather = 'sunny' | 'rain' | 'snow';

const SKY_VERT = /* glsl */ `
varying vec3 vWorldDir;
void main() {
  vec4 worldPos = modelMatrix * vec4(position, 1.0);
  vWorldDir = normalize(worldPos.xyz - cameraPosition);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const SKY_FRAG = /* glsl */ `
uniform vec3 uTopColor;
uniform vec3 uHorizonColor;
uniform vec3 uBottomColor;
uniform vec3 uSunColor;
uniform vec3 uSunDir;
uniform float uSunIntensity;
uniform float uSunSize;
varying vec3 vWorldDir;

void main() {
  vec3 dir = normalize(vWorldDir);
  float h = clamp(dir.y * 1.4, -1.0, 1.0);
  // gök gradyanı
  vec3 col = mix(uHorizonColor, uTopColor, pow(clamp(h, 0.0, 1.0), 0.55));
  // ufkun ALTINDA yalnızca çok yakın bant koyulaşır (zemin zaten opak, kubbe görünmez)
  col = mix(col, uBottomColor, pow(clamp(-h, 0.0, 1.0), 2.5) * 0.85);

  // güneş diski + halo
  float d = dot(dir, normalize(uSunDir));
  float disc = smoothstep(1.0 - uSunSize, 1.0 - uSunSize * 0.55, d);
  float halo = pow(max(d, 0.0), 22.0) * 0.55 + pow(max(d, 0.0), 4.0) * 0.12;
  col += uSunColor * (disc * 2.4 + halo) * uSunIntensity;

  // hafif atmosferik bant
  col += uSunColor * 0.04 * pow(max(0.0, 1.0 - abs(h - 0.05) * 4.0), 2.0) * uSunIntensity;

  gl_FragColor = vec4(col, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`;

export interface AtmosphereState {
  hour: number; // 0..24
  weather: Weather;
}

export class Atmosphere {
  readonly sunLight: THREE.DirectionalLight;
  readonly hemi: THREE.HemisphereLight;
  readonly ambient: THREE.AmbientLight;
  private sky: THREE.Mesh;
  private skyMat: THREE.ShaderMaterial;
  private sunDir = new THREE.Vector3(0.5, 0.8, 0.3);
  private pmrem: THREE.PMREMGenerator;
  private envRT: THREE.WebGLRenderTarget | null = null;
  private envScene: THREE.Scene;
  private envSphere: THREE.Mesh;
  private rain: THREE.Points | null = null;
  private snow: THREE.Points | null = null;
  private rainVel: Float32Array | null = null;
  private snowVel: Float32Array | null = null;
  private time = 0;

  hour = 17.5;
  weather: Weather = 'sunny';

  private scene: THREE.Scene;
  private renderer: THREE.WebGLRenderer;

  constructor(scene: THREE.Scene, renderer: THREE.WebGLRenderer) {
    this.scene = scene;
    this.renderer = renderer;

    // 1) Gökyüzü kubbesi
    this.skyMat = new THREE.ShaderMaterial({
      uniforms: {
        uTopColor: { value: new THREE.Color(0x2a6bb0) },
        uHorizonColor: { value: new THREE.Color(0xbdd7e8) },
        uBottomColor: { value: new THREE.Color(0x5f6a70) },
        uSunColor: { value: new THREE.Color(0xffd8a8) },
        uSunDir: { value: new THREE.Vector3(0.4, 0.6, 0.3) },
        uSunIntensity: { value: 1.0 },
        uSunSize: { value: 0.0009 },
      },
      vertexShader: SKY_VERT,
      fragmentShader: SKY_FRAG,
      side: THREE.BackSide,
      depthWrite: false,
    });
    // Gök kubbesi: kamera uzağı (far=900) içinde kalmalı, yoksa gök hiç görünmez
    const skyGeo = new THREE.SphereGeometry(600, 40, 20);
    this.sky = new THREE.Mesh(skyGeo, this.skyMat);
    this.sky.name = 'sky';
    this.sky.frustumCulled = false;
    scene.add(this.sky);

    // 2) Işıklar
    this.sunLight = new THREE.DirectionalLight(0xfff0d8, 3.2);
    this.sunLight.castShadow = true;
    const size = 2048;
    this.sunLight.shadow.mapSize.set(size, size);
    this.sunLight.shadow.camera.near = 1;
    this.sunLight.shadow.camera.far = 140;
    const s = 45;
    this.sunLight.shadow.camera.left = -s;
    this.sunLight.shadow.camera.right = s;
    this.sunLight.shadow.camera.top = s;
    this.sunLight.shadow.camera.bottom = -s;
    this.sunLight.shadow.bias = -0.0004;
    this.sunLight.shadow.normalBias = 0.03;
    scene.add(this.sunLight);
    scene.add(this.sunLight.target);

    this.hemi = new THREE.HemisphereLight(0xbcd8f0, 0x4a4638, 0.55);
    scene.add(this.hemi);
    this.ambient = new THREE.AmbientLight(0xffffff, 0.18);
    scene.add(this.ambient);

    // 3) Ortam haritası için küçük sahne
    this.pmrem = new THREE.PMREMGenerator(renderer);
    this.pmrem.compileEquirectangularShader();
    this.envScene = new THREE.Scene();
    this.envSphere = new THREE.Mesh(skyGeo.clone(), this.skyMat);
    this.envSphere.frustumCulled = false;
    this.envScene.add(this.envSphere);

    this.buildNightFacadeLights();
    this.buildWeather();
    this.apply();
  }

  /** Gece cephe aydınlatması — bina dışarıdan ışıklı görünsün */
  private nightLights: THREE.PointLight[] = [];

  private buildNightFacadeLights(): void {
    const spots: Array<[number, number, number]> = [
      [0, 1.6, 14], [0, 1.6, -14], [-17.5, 1.6, 0], [17.5, 1.6, 0],
    ];
    for (const [x, y, z] of spots) {
      const l = new THREE.PointLight(0xffc98a, 0, 26, 2);
      l.position.set(x, y, z);
      l.castShadow = false;
      this.scene.add(l);
      this.nightLights.push(l);
    }
  }

  /** Gece ışık yoğunluğunu ayarla (sahne gece moduna geçtiğinde) */
  private applyNightLights(): void {
    const on = this.isNight ? 1 : 0;
    this.nightLights.forEach((l) => {
      l.intensity += (on * 30 - l.intensity) * 0.18;
    });
    // Pencerelerdeki sıcak parlama: cephe camının kendi emissive kanalı.
    // Cam materyali havuzda TEK örnek olduğu için tüm cephe birlikte parlar.
    const glassMat = getMaterial('glass') as THREE.MeshPhysicalMaterial;
    if (glassMat) {
      if (!glassMat.emissive) glassMat.emissive = new THREE.Color(0xffb765);
      // Düşük yoğunluk: cam "turuncu blok" gibi değil, arkadan ışık sızmış gibi parlar
      const target = this.isNight ? 0.11 : 0.0;
      glassMat.emissiveIntensity += (target - glassMat.emissiveIntensity) * 0.1;
      glassMat.emissive.setHex(this.isNight ? 0xffa94d : 0x000000);
      glassMat.needsUpdate = true;
    }
  }

  /** Saat ve hava durumuna göre tüm ışıkları ayarla */
  apply(): void {
    const h = this.hour;
    // güneş açısı: 6'da doğar (doğu), 12'de tepe, 18'de batı
    const dayT = (h - 6) / 12; // 0..1 gündüz dilimi
    const elevation = Math.sin(Math.max(0, Math.min(1, dayT)) * Math.PI);
    const azimuth = (dayT * Math.PI) - Math.PI / 2;
    const isNight = h < 6 || h > 18.6;

    const sx = Math.cos(azimuth) * 60;
    const sz = Math.sin(azimuth) * 40 + 8;
    const sy = Math.max(0.6, elevation * 70);

    if (isNight) {
      // gece: ay ışığı
      const nightT = h < 6 ? (h + 6) / 12 : (h - 18) / 6;
      const na = nightT * Math.PI;
      this.sunDir.set(Math.cos(na) * 60, 35 + Math.sin(na) * 20, Math.sin(na) * 30);
    } else {
      this.sunDir.set(sx, sy, sz);
    }

    const sunPos = this.sunDir.clone();
    this.sunLight.position.copy(sunPos);
    this.sunLight.target.position.set(0, 8, 0);
    this.sunLight.target.updateMatrixWorld();

    // renkler
    const topDay = new THREE.Color(0x2f6fb5);
    const topDusk = new THREE.Color(0x1b2a4a);
    const topNight = new THREE.Color(0x05080f);
    const horDay = new THREE.Color(0xcfe3f0);
    const horDusk = new THREE.Color(0xf2915a);
    const horNight = new THREE.Color(0x0d1420);
    const botDay = new THREE.Color(0x8a8f92);
    const botDusk = new THREE.Color(0x4a3b3a);
    const botNight = new THREE.Color(0x070a0e);

    const sunsetFactor = Math.max(0, 1 - Math.abs(h - 18) / 2.2) * (h <= 19 ? 1 : 0.4);
    const dawnFactor = Math.max(0, 1 - Math.abs(h - 6.4) / 2.0);

    let top = topDay.clone(), hor = horDay.clone(), bot = botDay.clone();
    const sunny = this.weather === 'sunny';
    if (this.weather !== 'sunny') {
      top.lerp(new THREE.Color(0x6b7684), 0.75);
      hor.lerp(new THREE.Color(0xa8b0b8), 0.75);
      bot.lerp(new THREE.Color(0x5d636a), 0.7);
    }

    if (isNight) {
      const t = Math.min(1, h < 6 ? (6 - h) / 3 : (h - 18.4) / 2.5);
      top.lerp(topNight, t * 0.95);
      hor.lerp(horNight, t * 0.95);
      bot.lerp(botNight, t * 0.95);
    } else if (sunsetFactor > 0.01) {
      top.lerp(topDusk, sunsetFactor * 0.7);
      hor.lerp(horDusk, sunsetFactor * 0.85);
      bot.lerp(botDusk, sunsetFactor * 0.6);
    } else if (dawnFactor > 0.01) {
      top.lerp(topDusk, dawnFactor * 0.45);
      hor.lerp(new THREE.Color(0xf6b98d), dawnFactor * 0.6);
    }

    this.skyMat.uniforms.uTopColor.value.copy(top);
    this.skyMat.uniforms.uHorizonColor.value.copy(hor);
    this.skyMat.uniforms.uBottomColor.value.copy(bot);
    this.skyMat.uniforms.uSunDir.value.copy(this.sunDir).normalize();

    const sunColor = new THREE.Color(0xfff2d8);
    if (sunsetFactor > 0.01) sunColor.lerp(new THREE.Color(0xff8f4a), sunsetFactor * 0.85);
    this.skyMat.uniforms.uSunColor.value.copy(sunColor);
    this.skyMat.uniforms.uSunIntensity.value = isNight ? 0.35 : 1.0;
    this.skyMat.uniforms.uSunSize.value = isNight ? 0.00025 : 0.0007;

    // güneş ışığı yoğunluğu
    const dayIntensity = Math.max(0.05, elevation) * 3.6 * (sunny ? 1 : 0.32);
    // gece ay ışığı çok zayıf (0.28 → gündüz gibi görünmesine yol açıyordu)
    this.sunLight.intensity = isNight ? 0.075 : dayIntensity;
    this.sunLight.color.copy(isNight ? new THREE.Color(0x8fa8d8) : sunColor);

    // GECE: gökyüzü ışığı çok düşük olmalı, yoksa gece gündüz gibi görünür.
    // Aydınlatmayı yapay kaynaklar (bina içi + sokak lambaları) taşır.
    // gece 0.045 çok karanlıktı: bahçe/çim tamamen kayboluyordu. 0.13 dengeli.
    this.hemi.intensity = isNight ? 0.13 : (0.45 + elevation * 0.35) * (sunny ? 1 : 0.75);
    this.hemi.color.copy(isNight ? new THREE.Color(0x1a2438) : new THREE.Color(0xbcd8f0));
    this.hemi.groundColor.copy(isNight ? new THREE.Color(0x0a0c10) : new THREE.Color(0x4a4638));
    this.ambient.intensity = isNight ? 0.035 : 0.16;

    this.renderer.toneMappingExposure = isNight ? 1.35 : 0.95 + elevation * 0.15;

    // ortam haritası güncelle (pahalı iş — sadece saat/hava değişince)
    this.updateEnv();
    this.updateWeatherVisibility();
  }

  private updateEnv(): void {
    this.envRT?.dispose();
    this.envRT = this.pmrem.fromScene(this.envScene, 0, 0.1, 500);
    setEnvMap(this.envRT.texture);
    this.scene.environment = this.envRT.texture;
  }

  setHour(h: number): void {
    this.hour = ((h % 24) + 24) % 24;
    this.apply();
    this.updateLightsByHour();
  }

  setWeather(w: Weather): void {
    this.weather = w;
    this.updateWeatherVisibility();
    this.apply();
  }

  /** Gece olduğunda bina içi/dışı aydınlatma yoğunluğunu arttır */
  private nightBoost = 0;
  get isNight(): boolean {
    return this.hour < 6.4 || this.hour > 18.2;
  }

  private updateLightsByHour(): void {
    const target = this.isNight ? 1 : 0.55;
    this.nightBoost += (target - this.nightBoost) * 0.5;
  }

  private buildWeather(): void {
    // yağmur
    const rainCount = 2600;
    const rainGeo = new THREE.BufferGeometry();
    const rp = new Float32Array(rainCount * 3);
    const rv = new Float32Array(rainCount);
    for (let i = 0; i < rainCount; i++) {
      rp[i * 3] = (Math.random() - 0.5) * 120;
      rp[i * 3 + 1] = Math.random() * 45;
      rp[i * 3 + 2] = (Math.random() - 0.5) * 120;
      rv[i] = 22 + Math.random() * 16;
    }
    rainGeo.setAttribute('position', new THREE.BufferAttribute(rp, 3));
    this.rainVel = rv;
    const rainMat = new THREE.PointsMaterial({
      color: 0xbfd8ea, size: 0.09, transparent: true, opacity: 0.55, sizeAttenuation: true, depthWrite: false,
    });
    this.rain = new THREE.Points(rainGeo, rainMat);
    this.rain.name = 'rain';
    this.rain.visible = false;
    this.scene.add(this.rain);

    // kar
    const snowCount = 1800;
    const snowGeo = new THREE.BufferGeometry();
    const sp = new Float32Array(snowCount * 3);
    const sv = new Float32Array(snowCount);
    for (let i = 0; i < snowCount; i++) {
      sp[i * 3] = (Math.random() - 0.5) * 120;
      sp[i * 3 + 1] = Math.random() * 45;
      sp[i * 3 + 2] = (Math.random() - 0.5) * 120;
      sv[i] = 1.2 + Math.random() * 1.8;
    }
    snowGeo.setAttribute('position', new THREE.BufferAttribute(sp, 3));
    this.snowVel = sv;
    const snowMat = new THREE.PointsMaterial({
      color: 0xffffff, size: 0.16, transparent: true, opacity: 0.9, sizeAttenuation: true, depthWrite: false,
    });
    this.snow = new THREE.Points(snowGeo, snowMat);
    this.snow.name = 'snow';
    this.snow.visible = false;
    this.scene.add(this.snow);
  }

  private updateWeatherVisibility(): void {
    if (this.rain) this.rain.visible = this.weather === 'rain';
    if (this.snow) this.snow.visible = this.weather === 'snow';
  }

  update(dt: number): void {
    this.time += dt;
    // yağmur animasyonu
    if (this.rain && this.rain.visible && this.rainVel) {
      const pos = this.rain.geometry.getAttribute('position') as THREE.BufferAttribute;
      const arr = pos.array as Float32Array;
      for (let i = 0; i < arr.length / 3; i++) {
        arr[i * 3 + 1] -= this.rainVel[i] * dt;
        if (arr[i * 3 + 1] < 0) {
          arr[i * 3 + 1] = 45;
          arr[i * 3] = (Math.random() - 0.5) * 120;
          arr[i * 3 + 2] = (Math.random() - 0.5) * 120;
        }
      }
      pos.needsUpdate = true;
    }
    // kar animasyonu
    if (this.snow && this.snow.visible && this.snowVel) {
      const pos = this.snow.geometry.getAttribute('position') as THREE.BufferAttribute;
      const arr = pos.array as Float32Array;
      for (let i = 0; i < arr.length / 3; i++) {
        arr[i * 3 + 1] -= this.snowVel[i] * dt;
        arr[i * 3] += Math.sin(this.time * 0.8 + i) * dt * 0.35;
        if (arr[i * 3 + 1] < 0) {
          arr[i * 3 + 1] = 45;
          arr[i * 3] = (Math.random() - 0.5) * 120;
          arr[i * 3 + 2] = (Math.random() - 0.5) * 120;
        }
      }
      pos.needsUpdate = true;
    }
    // gece aydınlatma düzeyi yumuşak geçiş
    const target = this.isNight ? 1 : 0.5;
    this.nightBoost += (target - this.nightBoost) * Math.min(1, dt * 2);
    this.applyNightLights();
  }

  get interiorLightFactor(): number {
    return this.nightBoost;
  }

  /** Gölge kalitesini cihaza göre ayarla */
  setShadowQuality(mapSize: number): void {
    this.sunLight.shadow.mapSize.set(mapSize, mapSize);
    this.sunLight.shadow.map?.dispose();
    this.sunLight.shadow.map = null;
  }

  dispose(): void {
    this.envRT?.dispose();
    this.pmrem.dispose();
    this.sky.geometry.dispose();
    this.skyMat.dispose();
    this.rain?.geometry.dispose();
    (this.rain?.material as THREE.Material | undefined)?.dispose();
    this.snow?.geometry.dispose();
    (this.snow?.material as THREE.Material | undefined)?.dispose();
  }
}
