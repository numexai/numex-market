// Malzemeler ve prosedürel dokular — hepsi tarayıcıda üretilir, dış dosya yok.
import * as THREE from 'three';

const dokuOnbellek = new Map();
const malzemeOnbellek = new Map();

/* ---------- prosedürel dokular ---------- */
function tuval(boy = 512) {
  const c = document.createElement('canvas');
  c.width = c.height = boy;
  return { c, x: c.getContext('2d') };
}
function doku(c, tekrar = 1) {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(tekrar, tekrar);
  t.anisotropy = 8;
  return t;
}

export function ahsapDoku() {
  if (dokuOnbellek.has('ahsap')) return dokuOnbellek.get('ahsap');
  const { c, x } = tuval(512);
  x.fillStyle = '#6b4526';
  x.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 220; i++) {
    const y = Math.random() * 512;
    const h = 1 + Math.random() * 6;
    const a = 0.04 + Math.random() * 0.16;
    x.fillStyle = Math.random() > 0.45 ? `rgba(48,29,14,${a})` : `rgba(160,112,64,${a})`;
    x.beginPath();
    x.moveTo(0, y);
    for (let px = 0; px <= 512; px += 32) {
      x.lineTo(px, y + Math.sin((px + i * 21) * 0.018) * 4 + Math.sin(px * 0.09) * 1.2);
    }
    x.lineTo(512, y + h);
    for (let px = 512; px >= 0; px -= 32) {
      x.lineTo(px, y + h + Math.sin((px + i * 21) * 0.018) * 4);
    }
    x.closePath();
    x.fill();
  }
  // budaklar
  for (let i = 0; i < 14; i++) {
    const bx = Math.random() * 512, by = Math.random() * 512, r = 3 + Math.random() * 9;
    const g = x.createRadialGradient(bx, by, 0, bx, by, r * 2.4);
    g.addColorStop(0, 'rgba(38,22,10,.55)');
    g.addColorStop(1, 'rgba(38,22,10,0)');
    x.fillStyle = g;
    x.beginPath(); x.arc(bx, by, r * 2.4, 0, 7); x.fill();
  }
  const t = doku(c, 3);
  dokuOnbellek.set('ahsap', t);
  return t;
}

export function cimDoku() {
  if (dokuOnbellek.has('cim')) return dokuOnbellek.get('cim');
  const { c, x } = tuval(512);
  x.fillStyle = '#5c8a45';
  x.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 26000; i++) {
    const r = Math.random();
    x.fillStyle = r > 0.72 ? 'rgba(122,163,86,.55)' : r > 0.4 ? 'rgba(70,112,52,.5)' : 'rgba(48,80,38,.45)';
    x.fillRect(Math.random() * 512, Math.random() * 512, 1.6, 1.6 + Math.random() * 3);
  }
  const t = doku(c, 6);
  dokuOnbellek.set('cim', t);
  return t;
}

export function tasDoku() {
  if (dokuOnbellek.has('tas')) return dokuOnbellek.get('tas');
  const { c, x } = tuval(512);
  x.fillStyle = '#8c8b86';
  x.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 5000; i++) {
    const a = Math.random() * 0.28;
    x.fillStyle = Math.random() > 0.5 ? `rgba(255,255,255,${a})` : `rgba(40,40,44,${a})`;
    const r = 1 + Math.random() * 6;
    x.beginPath(); x.arc(Math.random() * 512, Math.random() * 512, r, 0, 7); x.fill();
  }
  const t = doku(c, 2);
  dokuOnbellek.set('tas', t);
  return t;
}

/* ---------- parıltı dokusu (lamba halesi) ---------- */
export function haleDoku() {
  if (dokuOnbellek.has('hale')) return dokuOnbellek.get('hale');
  const { c, x } = tuval(128);
  const g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, 'rgba(255,232,180,1)');
  g.addColorStop(0.32, 'rgba(255,205,120,.55)');
  g.addColorStop(1, 'rgba(255,190,90,0)');
  x.fillStyle = g;
  x.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  dokuOnbellek.set('hale', t);
  return t;
}

/* ---------- malzeme ---------- */
export function mat(renk, s = {}) {
  const anahtar = renk + '|' + JSON.stringify(s);
  if (malzemeOnbellek.has(anahtar)) return malzemeOnbellek.get(anahtar);
  const m = new THREE.MeshStandardMaterial({
    color: new THREE.Color(renk),
    roughness: s.puruz ?? 0.78,
    metalness: s.metal ?? 0.0,
    flatShading: !!s.duz,
    side: s.cift ? THREE.DoubleSide : THREE.FrontSide,
    transparent: !!s.seffaf,
    opacity: s.opaklik ?? 1,
    map: s.harita ?? null,
  });
  if (s.isik) {
    m.emissive = new THREE.Color(s.isik);
    m.emissiveIntensity = s.isikGuc ?? 0;
  }
  if (s.ortam) m.envMapIntensity = 1;
  malzemeOnbellek.set(anahtar, m);
  return m;
}

/** Gece yanan malzeme (kendi kopyası — nesneye özel). */
export function isikMalzeme(renk, isik, guc = 0) {
  const m = new THREE.MeshStandardMaterial({
    color: new THREE.Color(renk), roughness: 0.5, metalness: 0.0,
    emissive: new THREE.Color(isik), emissiveIntensity: guc,
  });
  return m;
}

export function hale(texture) {
  const m = new THREE.SpriteMaterial({
    map: texture || haleDoku(), color: 0xffd79a, transparent: true,
    opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending,
  });
  return new THREE.Sprite(m);
}

/* ---------- su ---------- */
export const suUniformlari = [];   // animasyon döngüsü zamanı buraya yazar

export function suMalzemesi() {
  const u = {
    uTime: { value: 0 },
    uDerin: { value: new THREE.Color('#1f5f6b') },
    uSig: { value: new THREE.Color('#8fd6dd') },
    uGok: { value: new THREE.Color('#cfe6ff') },
  };
  suUniformlari.push(u);
  return new THREE.ShaderMaterial({
    uniforms: u,
    transparent: true,
    vertexShader: /* glsl */`
      uniform float uTime;
      varying vec3 vDunya; varying vec3 vNormalD; varying vec2 vUv;
      void main(){
        vUv = uv;
        vec3 p = position;
        float d = sin(p.x*3.1 + uTime*1.7)*0.012 + sin(p.z*4.3 - uTime*1.3)*0.010;
        p.y += d;
        vec4 wp = modelMatrix * vec4(p,1.0);
        vDunya = wp.xyz;
        vNormalD = normalize(mat3(modelMatrix) * normal);
        gl_Position = projectionMatrix * viewMatrix * wp;
      }`,
    fragmentShader: /* glsl */`
      uniform float uTime; uniform vec3 uDerin; uniform vec3 uSig; uniform vec3 uGok;
      varying vec3 vDunya; varying vec3 vNormalD; varying vec2 vUv;
      void main(){
        vec2 uv = vDunya.xz;
        float w1 = sin(uv.x*7.0 + uTime*1.6);
        float w2 = cos(uv.y*8.5 - uTime*1.9);
        float w3 = sin((uv.x+uv.y)*5.0 + uTime*1.1);
        vec3 n = normalize(vNormalD + vec3(w1*0.11, 0.0, w2*0.11));
        vec3 bak = normalize(cameraPosition - vDunya);
        float fres = pow(1.0 - max(dot(bak, n), 0.0), 2.4);
        vec3 isikYon = normalize(vec3(0.45, 0.85, 0.32));
        float parlak = pow(max(dot(reflect(-isikYon, n), bak), 0.0), 46.0);
        float cizgi = smoothstep(0.55, 1.0, w3*0.5+0.5) * 0.14;
        vec3 renk = mix(uDerin, uSig, 0.34 + 0.3*w1) + uGok * fres * 0.5
                  + vec3(1.0,0.96,0.88) * parlak * 0.75 + uSig * cizgi;
        gl_FragColor = vec4(renk, 0.94);
      }`,
  });
}

export function selaleMalzemesi() {
  const u = { uTime: { value: 0 }, uOpak: { value: 0.86 } };
  suUniformlari.push(u);
  return new THREE.ShaderMaterial({
    uniforms: u, transparent: true, side: THREE.DoubleSide, depthWrite: false,
    vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: /* glsl */`
      uniform float uTime; uniform float uOpak; varying vec2 vUv;
      void main(){
        float y = vUv.y;
        float s1 = sin((vUv.x*13.0) + uTime*3.4 + y*6.0);
        float s2 = sin((vUv.x*27.0) - uTime*5.1 + y*11.0);
        float ak = fract(vUv.y*3.0 + uTime*1.35 + s1*0.05 + s2*0.03);
        float cizgi = smoothstep(0.35, 1.0, ak);
        vec3 renk = mix(vec3(0.62,0.79,0.85), vec3(1.0), cizgi*0.85);
        float kenar = smoothstep(0.0,0.14,vUv.x) * smoothstep(1.0,0.86,vUv.x);
        float alt = mix(0.55, 1.0, smoothstep(0.0, 0.7, y));
        gl_FragColor = vec4(renk, uOpak * kenar * alt);
      }`,
  });
}
