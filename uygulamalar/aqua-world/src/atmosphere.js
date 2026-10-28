import * as THREE from 'three';

/* --------------------------------------------------------------------------
   Atmosfer: su hacmi, sis, yüzen parçacıklar, ışık huzmeleri
   Gece/gündüz: ışık şiddetleri + renkler yumuşak geçişle değişir.
   -------------------------------------------------------------------------- */

function rand(a, b) { return a + Math.random() * (b - a); }

/* --- parçacık dokusu (kodla üretilen yumuşak yuvarlak) -------------------- */
function makeParticleTexture() {
  const s = 64;
  const c = document.createElement('canvas');
  c.width = c.height = s;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.35, 'rgba(200,240,255,0.55)');
  g.addColorStop(1, 'rgba(160,220,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, s, s);
  const tex = new THREE.CanvasTexture(c);
  tex.needsUpdate = true;
  return tex;
}

export class Particles {
  constructor(count = 2600, spread = 420, height = 190) {
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const phases = new Float32Array(count);
    this.speeds = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      pos[i * 3] = rand(-spread / 2, spread / 2);
      pos[i * 3 + 1] = rand(-38, height);
      pos[i * 3 + 2] = rand(-spread / 2, spread / 2);
      sizes[i] = rand(0.35, 1.9);
      phases[i] = Math.random() * Math.PI * 2;
      this.speeds[i] = rand(0.12, 0.85);
    }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
    geo.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));

    this.uniforms = {
      uTex: { value: makeParticleTexture() },
      uTime: { value: 0 },
      uOpacity: { value: 0.55 },
      uColor: { value: new THREE.Color(0xa8e4ff) },
      uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) }
    };

    const mat = new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexShader: /* glsl */`
        attribute float aSize;
        attribute float aPhase;
        uniform float uTime;
        uniform float uPixelRatio;
        varying float vFade;
        void main(){
          vec3 p = position;
          p.y = mod(p.y + uTime * (0.6 + aPhase * 0.25), 230.0) - 38.0;
          p.x += sin(uTime * 0.35 + aPhase) * 2.4;
          p.z += cos(uTime * 0.28 + aPhase * 1.7) * 2.4;

          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          gl_Position = projectionMatrix * mv;
          gl_PointSize = aSize * uPixelRatio * (190.0 / max(-mv.z, 1.0));
          vFade = smoothstep(240.0, 30.0, -mv.z);
        }
      `,
      fragmentShader: /* glsl */`
        uniform sampler2D uTex;
        uniform float uOpacity;
        uniform vec3 uColor;
        varying float vFade;
        void main(){
          vec4 t = texture2D(uTex, gl_PointCoord);
          float a = t.a * uOpacity * vFade;
          if (a < 0.01) discard;
          gl_FragColor = vec4(uColor, a);
        }
      `
    });

    this.points = new THREE.Points(geo, mat);
    this.points.frustumCulled = false;
  }

  update(dt) {
    this.uniforms.uTime.value += dt;
  }
}

/* --- ışık huzmeleri -------------------------------------------------------- */

export class GodRays {
  constructor(count = 14) {
    this.group = new THREE.Group();
    this.beams = [];

    const tex = (() => {
      const w = 8, h = 256;
      const c = document.createElement('canvas');
      c.width = w; c.height = h;
      const ctx = c.getContext('2d');
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, 'rgba(255,255,255,0.85)');
      g.addColorStop(0.45, 'rgba(200,240,255,0.30)');
      g.addColorStop(1, 'rgba(160,220,255,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      const t = new THREE.CanvasTexture(c);
      return t;
    })();

    for (let i = 0; i < count; i++) {
      const h = rand(120, 210);
      const w = rand(9, 26);
      const geo = new THREE.PlaneGeometry(w, h, 1, 1);
      geo.translate(0, -h / 2, 0);

      const mat = new THREE.MeshBasicMaterial({
        map: tex, transparent: true, depthWrite: false,
        blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
        opacity: rand(0.10, 0.26), color: 0xcdefff
      });

      const mesh = new THREE.Mesh(geo, mat);
      const ang = Math.random() * Math.PI * 2;
      const dist = Math.pow(Math.random(), 0.55) * 210;
      mesh.position.set(Math.cos(ang) * dist, rand(120, 165), Math.sin(ang) * dist);
      mesh.rotation.y = ang + Math.PI / 2;
      mesh.rotation.z = rand(-0.14, 0.14);
      mesh.userData = {
        phase: Math.random() * Math.PI * 2,
        baseOpacity: mat.opacity,
        baseRot: mesh.rotation.z,
        speed: rand(0.3, 0.9)
      };
      this.group.add(mesh);
      this.beams.push(mesh);
    }
  }

  update(dt, t, intensity = 1) {
    for (const b of this.beams) {
      const u = b.userData;
      b.material.opacity = u.baseOpacity * intensity * (0.75 + Math.sin(t * u.speed + u.phase) * 0.25);
      b.rotation.z = u.baseRot + Math.sin(t * 0.25 + u.phase) * 0.03;
      // yavaş dönme
      b.position.x += Math.sin(t * 0.1 + u.phase) * dt * 0.6;
    }
  }
}

/* --- deniz karı (suyun içindeki tortu) ------------------------------------ */

export class MarineSnow {
  constructor(count = 900) {
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    this.baseY = new Float32Array(count);
    this.speed = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = rand(-220, 220);
      pos[i * 3 + 1] = rand(-36, 90);
      pos[i * 3 + 2] = rand(-220, 220);
      this.baseY[i] = pos[i * 3 + 1];
      this.speed[i] = rand(0.25, 0.9);
    }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    this.mat = new THREE.PointsMaterial({
      color: 0xdff6ff, size: 0.32, transparent: true, opacity: 0.5,
      depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true
    });
    this.points = new THREE.Points(geo, this.mat);
    this.points.frustumCulled = false;
  }

  update(dt, t) {
    const p = this.points.geometry.attributes.position;
    for (let i = 0; i < p.count; i++) {
      let y = p.getY(i) - this.speed[i] * dt;
      if (y < -38) y = 92;
      p.setY(i, y);
      p.setX(i, p.getX(i) + Math.sin(t * 0.4 + i) * dt * 0.35);
    }
    p.needsUpdate = true;
  }
}

/* --- atmosfer yöneticisi -------------------------------------------------- */

export class Atmosphere {
  constructor(scene, renderer) {
    this.scene = scene;
    this.renderer = renderer;

    // arka plan gradyanı (tek renk değil, dikey geçişli doku)
    this.bgTex = this.makeGradientTexture('#0a4f6e', '#021019');
    scene.background = this.bgTex;
    scene.fog = new THREE.FogExp2(0x0a3a52, 0.0043);

    // ışıklar
    this.ambient = new THREE.AmbientLight(0x5b98b8, 0.85);
    scene.add(this.ambient);

    this.hemi = new THREE.HemisphereLight(0x8fe4ff, 0x0d2431, 0.9);
    scene.add(this.hemi);

    this.sun = new THREE.DirectionalLight(0xa8e8ff, 2.1);
    this.sun.position.set(40, 130, 30);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(2048, 2048);
    const d = 150;
    this.sun.shadow.camera.left = -d;
    this.sun.shadow.camera.right = d;
    this.sun.shadow.camera.top = d;
    this.sun.shadow.camera.bottom = -d;
    this.sun.shadow.camera.near = 1;
    this.sun.shadow.camera.far = 400;
    this.sun.shadow.bias = -0.0009;
    scene.add(this.sun);

    // su altı serpme ışığı
    this.fill = new THREE.DirectionalLight(0x2f7ba0, 0.7);
    this.fill.position.set(-60, 40, -60);
    scene.add(this.fill);

    // parçacıklar
    this.particles = new Particles();
    scene.add(this.particles.points);

    this.snow = new MarineSnow();
    scene.add(this.snow.points);

    this.rays = new GodRays();
    scene.add(this.rays.group);

    this.night = 0;          // 0 gündüz, 1 gece
    this.target = 0;

    this.dayColors = {
      bg: ['#0a4f6e', '#021019'],
      fog: new THREE.Color(0x0a3a52),
      fogDensity: 0.0043,
      ambient: new THREE.Color(0x5b98b8),
      ambientI: 0.85,
      hemiSky: new THREE.Color(0x8fe4ff),
      hemiI: 0.9,
      sun: new THREE.Color(0xa8e8ff),
      sunI: 2.1,
      particle: new THREE.Color(0xa8e4ff),
      particleOp: 0.55,
      rayI: 1.0
    };

    this.nightColors = {
      bg: ['#052a3e', '#01060c'],
      fog: new THREE.Color(0x03141f),
      fogDensity: 0.0062,
      ambient: new THREE.Color(0x1b3d55),
      ambientI: 0.34,
      hemiSky: new THREE.Color(0x24506b),
      hemiI: 0.3,
      sun: new THREE.Color(0x3f86b8),
      sunI: 0.55,
      particle: new THREE.Color(0x7fe6ff),
      particleOp: 0.95,
      rayI: 0.35
    };
  }

  makeGradientTexture(top, bottom) {
    const c = document.createElement('canvas');
    c.width = 4; c.height = 256;
    const ctx = c.getContext('2d');
    const g = ctx.createLinearGradient(0, 0, 0, 256);
    g.addColorStop(0, top);
    g.addColorStop(0.42, top);
    g.addColorStop(1, bottom);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 4, 256);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }

  setNight(on) {
    this.target = on ? 1 : 0;
  }

  toggleNight() {
    this.target = this.target > 0.5 ? 0 : 1;
    return this.target > 0.5;
  }

  update(dt, t) {
    this.night = THREE.MathUtils.damp(this.night, this.target, 2.2, dt);
    const k = this.night;
    const D = this.dayColors, N = this.nightColors;
    const l = THREE.MathUtils.lerp;

    this.scene.fog.color.copy(D.fog).lerp(N.fog, k);
    this.scene.fog.density = l(D.fogDensity, N.fogDensity, k);

    this.ambient.color.copy(D.ambient).lerp(N.ambient, k);
    this.ambient.intensity = l(D.ambientI, N.ambientI, k);

    this.hemi.color.copy(D.hemiSky).lerp(N.hemiSky, k);
    this.hemi.intensity = l(D.hemiI, N.hemiI, k);

    this.sun.color.copy(D.sun).lerp(N.sun, k);
    this.sun.intensity = l(D.sunI, N.sunI, k);

    this.particles.uniforms.uColor.value.copy(D.particle).lerp(N.particle, k);
    this.particles.uniforms.uOpacity.value = l(D.particleOp, N.particleOp, k);
    this.particles.update(dt);

    this.rays.update(dt, t, l(D.rayI, N.rayI, k));
    this.snow.update(dt, t);
    this.snow.mat.opacity = l(0.32, 0.6, k);
  }

  /** Kubbe içi ışıkları gece/gündüze göre ayarlar */
  applyInterior(cityGroups) {
    const k = this.night;
    for (const g of cityGroups) {
      for (const light of g.userData.glows || []) {
        light.intensity = THREE.MathUtils.lerp(38, 96, k);
      }
    }
  }
}
