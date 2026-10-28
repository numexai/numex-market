// NUMEX CORE — EVENT HORIZON
// Schwarzschild kara delik ışın izleme motoru (GLSL ES 3.00).
//
// FİZİK
//   Foton yörüngesi merkezle kendi düzleminde kalır. u = 1/r ile:
//        d²u/dφ² = -u + (3/2) r_s u²
//   RK4 ile değişken adımda integre edilir, ışın kameradan GERİYE izlenir.
//   r_s = 1 birim · olay ufku r ≤ r_s · foton küresi r_ph = 1.5 r_s.
//
// YAKLAŞIMLAR
//   • Dönmeyen kara delik (Schwarzschild, a = 0)
//   • Disk geometrik olarak ince ve opak (y = 0 düzleminde)
//   • Doppler/beaming: Kepler hızı β = √(r_s/2r), klasik D³ faktörü
//   • Sonlu adım integrasyonu
window.FS_SOURCE = `#version 300 es
precision highp float;

in vec2 vUv;
out vec4 fragColor;

uniform vec2  uRes;
uniform float uTime;
uniform vec3  uCamPos;
uniform mat3  uCamBasis;
uniform float uTanHalfFov;
uniform float uDiskInner;
uniform float uDiskOuter;
uniform float uTempScale;
uniform float uSpin;
uniform float uTurb;
uniform float uDoppler;
uniform float uLensing;
uniform float uExposure;
uniform float uMode;
uniform float uRadii;
uniform float uQuality;
uniform int   uMaxSteps;

const float RS = 1.0;

// ---- hash (yalın float tabanlı; derleyiciyi zorlamaz) ----
float hash1(vec2 p){
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float noise2(vec2 p){
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  // 4 köşe hash'i tek vektör işleminde
  vec4 h = vec4(
    fract(sin(dot(i,                        vec2(127.1, 311.7))) * 43758.5453),
    fract(sin(dot(i + vec2(1.0, 0.0),      vec2(127.1, 311.7))) * 43758.5453),
    fract(sin(dot(i + vec2(0.0, 1.0),      vec2(127.1, 311.7))) * 43758.5453),
    fract(sin(dot(i + vec2(1.0, 1.0),      vec2(127.1, 311.7))) * 43758.5453)
  );
  return mix(mix(h.x, h.y, u.x), mix(h.z, h.w, u.x), u.y);
}

float fbm2(vec2 p){
  // 3 oktav yeterli (4. oktav görsel fark yaratmıyor, 2 kat pahalı)
  float s = 0.0;
  float a = 0.5;
  for(int i = 0; i < 3; i++){
    s += a * noise2(p);
    p *= 2.07;
    a *= 0.5;
  }
  return s;
}

// ---- yıldız alanı: küresel yön → hücre ızgarası ----
vec3 starLayer(vec3 dir, float density, float tight, float seed, float gain){
  float phi   = atan(dir.z, dir.x);
  float theta = acos(clamp(dir.y, -1.0, 1.0));
  vec2  uv    = vec2(phi, theta) * density + seed;
  vec2  cell  = floor(uv);
  vec2  f     = fract(uv);

  float h1 = hash1(cell + seed);
  float h2 = hash1(cell + seed + 17.3);
  float h3 = hash1(cell + seed + 41.7);

  vec2  pos = vec2(h2, h3) * 0.7 + 0.15;
  float d   = length(f - pos);
  float present = step(0.5, h1);
  float b = present * exp(-d * d * tight);

  vec3 col = mix(vec3(1.0, 0.72, 0.50), vec3(0.68, 0.82, 1.0), h3);
  return col * b * (0.25 + h2 * h2 * 2.0) * gain;
}

// Arka plan: 2 yıldız katmanı + ucuz galaksi izi (3. katman görsel fark yaratmıyordu)
vec3 skyColor(vec3 dir){
  vec3 c = starLayer(dir, 30.0, 900.0, 0.0, 1.5);
  c += starLayer(dir, 64.0, 1800.0, 3.1, 0.55);
  float g = noise2(dir.xz * 4.0 + dir.yy * 2.6);
  c += vec3(0.26, 0.30, 0.50) * pow(max(g - 0.66, 0.0) * 2.4, 2.0);
  c += vec3(0.005, 0.007, 0.014);
  return c;
}

// ---- disk ----
float diskTemp(float r){
  float x = max(r / uDiskInner, 1.0);
  return pow(max(r, 1e-4), -0.75) * pow(max(1.0 - sqrt(1.0 / x), 0.0), 0.25) * uTempScale;
}

vec3 blackbody(float t){
  t = clamp(t, 0.0, 1.0);
  vec3 c;
  c.r = 0.05 + 0.95 * smoothstep(0.0, 0.42, t);
  c.g = 0.98 * smoothstep(0.04, 0.62, t);
  c.b = smoothstep(0.30, 0.92, t);
  return mix(vec3(0.75, 0.16, 0.03), c, smoothstep(0.0, 0.22, t));
}

vec3 diskColor(float rr, vec3 hitPos){
  float tnorm = (rr - uDiskInner) / max(uDiskOuter - uDiskInner, 1e-3);
  if(tnorm < 0.0 || tnorm > 1.0) return vec3(0.0);

  vec3 d = normalize(hitPos);
  float ang = atan(d.z, d.x);
  float omega = uSpin * pow(max(rr, 1.0), -1.5);
  float phase = ang - uTime * omega * 0.55;

  // spiral türbülans (2B, ucuz)
  vec2 np = vec2(cos(phase), sin(phase)) * (2.0 + rr * 0.6) + vec2(log(rr + 1.0) * 4.0, 0.0);
  float n1 = fbm2(np);
  float n2 = fbm2(np * 3.1 + vec2(uTime * 0.09, 0.0));
  float turb = mix(1.0, (0.40 + 1.30 * n1) * (0.65 + 0.65 * n2), uTurb);
  turb = max(turb, 0.03);

  float t = diskTemp(rr);
  float ts = clamp(t * 2.2, 0.0, 1.0);
  // Siyah cisim rengi: iç bölge beyaz-mavi, dış bölge turuncu-kırmızı
  vec3 col = blackbody(clamp(ts * 1.05 + 0.02, 0.0, 1.0));
  float intensity = pow(ts, 2.1) * 1.9;

  if(uDoppler > 0.5){
    vec3 tangent = normalize(cross(d, vec3(0.0, 1.0, 0.0)));
    float beta = min(sqrt(RS / (2.0 * max(rr, 1.25))), 0.7);
    vec3 toCam = normalize(uCamPos - hitPos);
    float mu = dot(tangent * sign(uSpin + 0.0001), toCam);
    float dop = 1.0 / max(1.0 - beta * mu, 0.20);
    intensity *= clamp(pow(dop, 2.6), 0.10, 9.0);
    col = mix(col, vec3(0.62, 0.80, 1.0), clamp((dop - 1.0) * 0.40, 0.0, 0.55));
    col = mix(col, vec3(1.0, 0.38, 0.13), clamp((1.0 - dop) * 0.55, 0.0, 0.65));
  }

  // Kenar geçişleri sıkı: disk İNCE bir yapı olmalı, kalın bir halka değil
  float edge = smoothstep(0.0, 0.05, tnorm) * (1.0 - smoothstep(0.42, 0.92, tnorm));
  float ring = 1.0 + 1.5 * exp(-pow((rr - 1.62) * 2.2, 2.0));
  return col * intensity * edge * turb * ring;
}

// ---- ışın izleme ----
vec3 traceRay(vec3 ro, vec3 rd, out float hitR, out vec3 hitPos){
  hitR = -1.0;
  hitPos = vec3(0.0);

  float r0 = length(ro);
  vec3 e1 = ro / r0;
  float vr = dot(rd, e1);
  vec3 perp = rd - e1 * vr;
  float vT = length(perp);
  vec3 e2;
  if(vT < 1e-6){
    e2 = normalize(cross(e1, vec3(0.0, 1.0, 0.0001)));
    vT = 1e-6;
  } else {
    e2 = perp / vT;
  }

  float u  = 1.0 / r0;
  float du = -u * vr / vT;
  float phi = 0.0;
  float dphi = 0.02;

  vec3 pos = ro;
  float prevY = ro.y;

  for(int i = 0; i < 500; i++){
    if(i >= uMaxSteps) break;

    float h = dphi;
    float k1u = du,           k1d = -u + 1.5 * u * u;
    float ua = u + 0.5*h*k1u, da  = du + 0.5*h*k1d;
    float k2u = da,           k2d = -ua + 1.5 * ua * ua;
    float ub = u + 0.5*h*k2u, db  = du + 0.5*h*k2d;
    float k3u = db,           k3d = -ub + 1.5 * ub * ub;
    float uc = u + h*k3u,     dc  = du + h*k3d;
    float k4u = dc,           k4d = -uc + 1.5 * uc * uc;

    float un  = u  + (h/6.0)*(k1u + 2.0*k2u + 2.0*k3u + k4u);
    float dun = du + (h/6.0)*(k1d + 2.0*k2d + 2.0*k3d + k4d);
    float phiN = phi + h;

    if(un >= 1.0) return vec3(0.0);           // olay ufku — kesin siyah (ışın kaçamaz)
    if(un <= 1e-4){                            // kaçtı
      // İPUCU: disk hitR her zaman diskColor ile ANINDA dönüldüğü için burada hitR > 0 olamaz.
      // Bu dal bir kez skyColor hesaplar ve biter → maliyet tek seferlik.
      return skyColor(e1 * cos(phiN) + e2 * sin(phiN));
    }

    float r = 1.0 / un;
    vec3 newPos = (e1 * cos(phiN) + e2 * sin(phiN)) * r;

    if(prevY * newPos.y < 0.0){
      float tt = prevY / (prevY - newPos.y);
      vec3 hp = mix(pos, newPos, tt);
      float hr = length(hp);
      if(hr > uDiskInner && hr < uDiskOuter){
        hitR = hr; hitPos = hp;
        return diskColor(hr, hp);
      }
    }

    pos = newPos; prevY = newPos.y;
    u = un; du = dun; phi = phiN;

    if(r > 200.0 && du < 0.0){
      return skyColor(newPos);
    }

    // Adım boyu — sürekli ölçekleme (sıçrama yok, bant artefaktı oluşmaz):
    //   uzakta ışın düz gider → büyük adım; ufka yakın güçlü bükülme → küçük adım.
    //   r^(-0.75) yumuşak geçiş verir; üst sınır 0.16 ile blok artefaktı engellenir.
    dphi = clamp(0.42 * pow(max(r, 1.0), -0.75), 0.010, 0.16);
  }

  return skyColor(normalize(pos));
}

vec3 drawRing(vec3 col, vec3 ro, vec3 rd, float rTarget, vec3 tint, float w){
  float b = dot(ro, rd);
  float d2 = max(dot(ro, ro) - b * b, 0.0);
  float rmin = sqrt(d2);
  float e = abs(rmin - rTarget) / w;
  return col + tint * exp(-e * e * 1.5) * 0.25;
}

void main(){
  vec2 uv = (vUv * 2.0 - 1.0);
  uv.x *= uRes.x / uRes.y;

  vec3 ro = uCamPos;

  vec3 rd = normalize(uCamBasis * vec3(uv.x * uTanHalfFov, uv.y * uTanHalfFov, 1.0));

  float hitR; vec3 hitPos;
  vec3 col = traceRay(ro, rd, hitR, hitPos);

  // Merceklenme kapalıysa: ışını bükmeden doğrudan arka plana bak (TEST 1 karşılaştırması)
  if(uLensing < 0.5){
    col = skyColor(rd);
    if(rd.y < -1e-5){
      vec3 hp = ro + rd * (-ro.y / rd.y);
      float hr = length(hp);
      if(hr > uDiskInner && hr < uDiskOuter) col = diskColor(hr, hp);
    }
  }

  if(uRadii > 0.5){
    col = drawRing(col, ro, rd, 1.0, vec3(1.0, 0.22, 0.22), 0.035);
    col = drawRing(col, ro, rd, 1.5, vec3(0.30, 1.0, 0.45), 0.035);
    col = drawRing(col, ro, rd, 3.0, vec3(1.0, 0.85, 0.25), 0.04);
  }

  col *= uExposure;
  if(uMode > 0.5){
    col *= vec3(1.05, 1.0, 0.95);
    col = pow(max(col, 0.0), vec3(0.94));
  }
  col = (col * (2.51 * col + 0.03)) / (col * (2.43 * col + 0.59) + 0.14);
  col = clamp(col, 0.0, 1.0);
  col *= 1.0 - 0.20 * pow(length(vUv - 0.5) * 1.4, 2.4);

  fragColor = vec4(col, 1.0);
}
`;
