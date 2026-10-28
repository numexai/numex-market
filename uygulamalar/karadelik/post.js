// NUMEX CORE — EVENT HORIZON
// Post-process shader'ları: parlaklık ayrıştırma (bright pass), ayrılabilir Gauss bulanıklığı, kompozit.
window.POST_VS = `#version 300 es
precision highp float;
out vec2 vUv;
void main(){
  vec2 p = vec2(
    (gl_VertexID == 1) ? 3.0 : -1.0,
    (gl_VertexID == 2) ? 3.0 : -1.0
  );
  vUv = p * 0.5 + 0.5;
  gl_Position = vec4(p, 0.0, 1.0);
}
`;

// Bloom için parlak bölgeleri ayır (eşik + yumuşak geçiş)
window.BRIGHT_FS = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 fragColor;
uniform sampler2D uTex;
uniform float uThreshold;
uniform float uSoft;
void main(){
  vec3 c = texture(uTex, vUv).rgb;
  float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
  float k = smoothstep(uThreshold, uThreshold + uSoft, l);
  fragColor = vec4(c * k, 1.0);
}
`;

// Ayrılabilir Gaussian (yön uniform ile)
window.BLUR_FS = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 fragColor;
uniform sampler2D uTex;
uniform vec2 uDir;
void main(){
  // 9 tap Gaussian
  float w[5];
  w[0] = 0.227027; w[1] = 0.1945946; w[2] = 0.1216216; w[3] = 0.054054; w[4] = 0.016216;
  vec3 c = texture(uTex, vUv).rgb * w[0];
  for(int i = 1; i < 5; i++){
    vec2 o = uDir * float(i);
    c += texture(uTex, vUv + o).rgb * w[i];
    c += texture(uTex, vUv - o).rgb * w[i];
  }
  fragColor = vec4(c, 1.0);
}
`;

// Ana görüntü + bloom kompoziti
window.COMPOSITE_FS = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 fragColor;
uniform sampler2D uScene;
uniform sampler2D uBloom;
uniform float uBloomAmt;
uniform float uMode;
void main(){
  vec3 scene = texture(uScene, vUv).rgb;
  vec3 bloom = texture(uBloom, vUv).rgb;
  // KRİTİK: bloom gölgeye taşarsa olay ufkunun içi griye döner (fiziksel olarak yanlış).
  // Sahnenin kendi parlaklığı çok düşükse bloom'u da kıs → gölge siyah kalır.
  float sceneLum = dot(scene, vec3(0.2126, 0.7152, 0.0722));
  float shadowMask = smoothstep(0.0, 0.02, sceneLum);
  vec3 c = scene + bloom * uBloomAmt * shadowMask;
  if(uMode > 0.5){
    // sinematik: hafif doygunluk artışı + sıcak gölge
    float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
    c = mix(vec3(l), c, 1.18);
    c *= vec3(1.02, 1.0, 0.97);
  }
  c = clamp(c, 0.0, 1.0);
  // hafif grain (sinematik doku)
  float g = fract(sin(dot(vUv * 1024.0, vec2(12.9898, 78.233))) * 43758.5453);
  c += (g - 0.5) * (uMode > 0.5 ? 0.012 : 0.005);
  fragColor = vec4(c, 1.0);
}
`;
