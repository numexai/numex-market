'use strict';
/* Numex Living Neighborhood — WebGL çekirdeği
   Kendi matris matematiği, kendi gölgelendiricileri. Harici kütüphane yok. */

/* ------------------------------------------------------------------ */
/*  mat4 — sütun düzenli (WebGL standardı)                             */
/* ------------------------------------------------------------------ */
const M4 = {
  ident() {
    const o = new Float32Array(16);
    o[0] = o[5] = o[10] = o[15] = 1;
    return o;
  },

  mul(a, b) {
    const o = new Float32Array(16);
    for (let c = 0; c < 4; c++) {
      const b0 = b[c * 4], b1 = b[c * 4 + 1], b2 = b[c * 4 + 2], b3 = b[c * 4 + 3];
      o[c * 4]     = a[0] * b0 + a[4] * b1 + a[8]  * b2 + a[12] * b3;
      o[c * 4 + 1] = a[1] * b0 + a[5] * b1 + a[9]  * b2 + a[13] * b3;
      o[c * 4 + 2] = a[2] * b0 + a[6] * b1 + a[10] * b2 + a[14] * b3;
      o[c * 4 + 3] = a[3] * b0 + a[7] * b1 + a[11] * b2 + a[15] * b3;
    }
    return o;
  },

  mulAll(...list) {
    return list.reduce((acc, m) => M4.mul(acc, m), M4.ident());
  },

  perspective(fovyRad, aspect, near, far) {
    const f = 1 / Math.tan(fovyRad / 2);
    const nf = 1 / (near - far);
    const o = new Float32Array(16);
    o[0] = f / aspect;
    o[5] = f;
    o[10] = (far + near) * nf;
    o[11] = -1;
    o[14] = 2 * far * near * nf;
    return o;
  },

  lookAt(eye, center, up) {
    let zx = eye[0] - center[0], zy = eye[1] - center[1], zz = eye[2] - center[2];
    let len = Math.hypot(zx, zy, zz) || 1;
    zx /= len; zy /= len; zz /= len;

    let xx = up[1] * zz - up[2] * zy;
    let xy = up[2] * zx - up[0] * zz;
    let xz = up[0] * zy - up[1] * zx;
    len = Math.hypot(xx, xy, xz) || 1;
    xx /= len; xy /= len; xz /= len;

    const yx = zy * xz - zz * xy;
    const yy = zz * xx - zx * xz;
    const yz = zx * xy - zy * xx;

    const o = new Float32Array(16);
    o[0] = xx; o[1] = yx; o[2] = zx; o[3] = 0;
    o[4] = xy; o[5] = yy; o[6] = zy; o[7] = 0;
    o[8] = xz; o[9] = yz; o[10] = zz; o[11] = 0;
    o[12] = -(xx * eye[0] + xy * eye[1] + xz * eye[2]);
    o[13] = -(yx * eye[0] + yy * eye[1] + yz * eye[2]);
    o[14] = -(zx * eye[0] + zy * eye[1] + zz * eye[2]);
    o[15] = 1;
    return o;
  },

  trans(x, y, z) {
    const o = M4.ident();
    o[12] = x; o[13] = y; o[14] = z;
    return o;
  },

  scale(x, y, z) {
    const o = M4.ident();
    o[0] = x; o[5] = y; o[10] = z;
    return o;
  },

  rotY(a) {
    const c = Math.cos(a), s = Math.sin(a), o = M4.ident();
    o[0] = c; o[2] = -s; o[8] = s; o[10] = c;
    return o;
  },

  rotX(a) {
    const c = Math.cos(a), s = Math.sin(a), o = M4.ident();
    o[5] = c; o[6] = s; o[9] = -s; o[10] = c;
    return o;
  },

  rotZ(a) {
    const c = Math.cos(a), s = Math.sin(a), o = M4.ident();
    o[0] = c; o[1] = s; o[4] = -s; o[5] = c;
    return o;
  },

  /** Ölçek → Y dönüşü → öteleme sırasıyla tek matris. */
  trs(x, y, z, ry, sx, sy, sz) {
    const m = M4.rotY(ry || 0);
    m[0] *= sx === undefined ? 1 : sx;
    m[1] *= sx === undefined ? 1 : sx;
    m[2] *= sx === undefined ? 1 : sx;
    m[4] *= sy === undefined ? 1 : sy;
    m[5] *= sy === undefined ? 1 : sy;
    m[6] *= sy === undefined ? 1 : sy;
    m[8] *= sz === undefined ? 1 : sz;
    m[9] *= sz === undefined ? 1 : sz;
    m[10] *= sz === undefined ? 1 : sz;
    m[12] = x; m[13] = y; m[14] = z;
    return m;
  },

  /** Noktayı dönüştür (w=1). */
  point(m, p) {
    return [
      m[0] * p[0] + m[4] * p[1] + m[8]  * p[2] + m[12],
      m[1] * p[0] + m[5] * p[1] + m[9]  * p[2] + m[13],
      m[2] * p[0] + m[6] * p[1] + m[10] * p[2] + m[14],
    ];
  },
};

/* ------------------------------------------------------------------ */
/*  GL — bağlam, gölgelendirici, tampon                                */
/* ------------------------------------------------------------------ */
const GL = {
  gl: null,
  canvas: null,
  prog: null,
  uni: {},
  ready: false,
  width: 1,
  height: 1,
  dpr: 1,

  init(canvas) {
    this.canvas = canvas;
    let gl = canvas.getContext('webgl2', { antialias: true, alpha: true, premultipliedAlpha: false });
    this.ver2 = !!gl;
    if (!gl) gl = canvas.getContext('webgl', { antialias: true, alpha: true, premultipliedAlpha: false });
    if (!gl) return false;
    this.gl = gl;

    const vs = `
      attribute vec3 aPos;
      attribute vec3 aNrm;
      attribute vec3 aCol;
      uniform mat4 uMVP;
      uniform mat4 uModel;
      varying vec3 vN;
      varying vec3 vC;
      void main() {
        vN = mat3(uModel) * aNrm;
        vC = aCol;
        gl_Position = uMVP * vec4(aPos, 1.0);
      }`;

    const fs = `
      precision mediump float;
      uniform vec3 uLightDir;
      uniform vec3 uSunColor;
      uniform vec3 uAmbient;
      uniform vec3 uTint;
      uniform vec3 uFogColor;
      uniform float uFogNear;
      uniform float uFogFar;
      uniform float uFogAmount;
      uniform float uEmissive;
      uniform float uAlpha;
      varying vec3 vN;
      varying vec3 vC;
      void main() {
        vec3 n = normalize(vN);
        float d = max(dot(n, normalize(uLightDir)), 0.0);
        float sky = 0.5 + 0.5 * n.y;
        vec3 lit = vC * (uAmbient + uSunColor * d + vec3(0.10, 0.12, 0.16) * sky);
        lit = mix(lit, vC, uEmissive);
        vec3 c = lit * uTint;
        float dist = gl_FragCoord.z / gl_FragCoord.w;
        float f = clamp((dist - uFogNear) / max(uFogFar - uFogNear, 0.001), 0.0, 1.0);
        c = mix(c, uFogColor, f * uFogAmount);
        gl_FragColor = vec4(c, uAlpha);
      }`;

    const p = this._compile(vs, fs);
    if (!p) return false;
    this.prog = p;
    gl.useProgram(p);
    this.attrib = {
      pos: gl.getAttribLocation(p, 'aPos'),
      nrm: gl.getAttribLocation(p, 'aNrm'),
      col: gl.getAttribLocation(p, 'aCol'),
    };
    ['uMVP', 'uModel', 'uLightDir', 'uSunColor', 'uAmbient', 'uTint',
     'uFogColor', 'uFogNear', 'uFogFar', 'uFogAmount', 'uEmissive', 'uAlpha']
      .forEach(n => { this.uni[n] = gl.getUniformLocation(p, n); });

    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);
    gl.clearColor(0, 0, 0, 0);

    this.indexType = this.ver2 ? gl.UNSIGNED_INT : gl.UNSIGNED_SHORT;
    this.ready = true;
    return true;
  },

  _compile(vsSrc, fsSrc) {
    const gl = this.gl;
    const mk = (type, src) => {
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        console.error('[shader]', gl.getShaderInfoLog(s));
        return null;
      }
      return s;
    };
    const v = mk(gl.VERTEX_SHADER, vsSrc);
    const f = mk(gl.FRAGMENT_SHADER, fsSrc);
    if (!v || !f) return null;
    const p = gl.createProgram();
    gl.attachShader(p, v);
    gl.attachShader(p, f);
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
      console.error('[link]', gl.getProgramInfoLog(p));
      return null;
    }
    return p;
  },

  resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.floor(window.innerWidth * dpr);
    const h = Math.floor(window.innerHeight * dpr);
    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.canvas.width = w;
      this.canvas.height = h;
    }
    this.dpr = dpr;
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.gl.viewport(0, 0, w, h);
  },

  /** MeshBuilder içeriğini GPU'ya yükle. */
  upload(mb) {
    const gl = this.gl;
    const verts = mb.pos.length / 3;
    if (!verts || !mb.idx.length) return null;

    const vao = this.ver2 ? gl.createVertexArray() : null;
    if (vao) gl.bindVertexArray(vao);

    const vbo = gl.createBuffer();
    // Köşe başına 9 float: konum(3) + normal(3) + renk(3) — aralıklı (interleaved)
    const data = new Float32Array(verts * 9);
    for (let i = 0; i < verts; i++) {
      const s3 = i * 3, o = i * 9;
      data[o]     = mb.pos[s3];
      data[o + 1] = mb.pos[s3 + 1];
      data[o + 2] = mb.pos[s3 + 2];
      data[o + 3] = mb.nrm[s3];
      data[o + 4] = mb.nrm[s3 + 1];
      data[o + 5] = mb.nrm[s3 + 2];
      data[o + 6] = mb.col[s3];
      data[o + 7] = mb.col[s3 + 1];
      data[o + 8] = mb.col[s3 + 2];
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);

    const stride = 9 * 4;
    const A = this.attrib;
    gl.enableVertexAttribArray(A.pos);
    gl.vertexAttribPointer(A.pos, 3, gl.FLOAT, false, stride, 0);
    gl.enableVertexAttribArray(A.nrm);
    gl.vertexAttribPointer(A.nrm, 3, gl.FLOAT, false, stride, 3 * 4);
    gl.enableVertexAttribArray(A.col);
    gl.vertexAttribPointer(A.col, 3, gl.FLOAT, false, stride, 6 * 4);

    const ibo = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
    const idx = this.indexType === gl.UNSIGNED_INT
      ? new Uint32Array(mb.idx)
      : new Uint16Array(mb.idx);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, idx, gl.STATIC_DRAW);

    if (vao) gl.bindVertexArray(null);

    return { vao, vbo, ibo, count: mb.idx.length, type: this.indexType };
  },

  draw(mesh, mvp, model) {
    if (!mesh) return;
    const gl = this.gl;
    if (mesh.vao) {
      gl.bindVertexArray(mesh.vao);
    } else {
      // WebGL1 yedeği: nitelik işaretçilerini yeniden bağla
      const A = this.attrib, stride = 9 * 4;
      gl.bindBuffer(gl.ARRAY_BUFFER, mesh.vbo);
      gl.enableVertexAttribArray(A.pos);
      gl.vertexAttribPointer(A.pos, 3, gl.FLOAT, false, stride, 0);
      gl.enableVertexAttribArray(A.nrm);
      gl.vertexAttribPointer(A.nrm, 3, gl.FLOAT, false, stride, 3 * 4);
      gl.enableVertexAttribArray(A.col);
      gl.vertexAttribPointer(A.col, 3, gl.FLOAT, false, stride, 6 * 4);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, mesh.ibo);
    }
    gl.uniformMatrix4fv(this.uni.uMVP, false, mvp);
    gl.uniformMatrix4fv(this.uni.uModel, false, model || M4.ident());
    gl.drawElements(gl.TRIANGLES, mesh.count, mesh.type, 0);
    if (mesh.vao) gl.bindVertexArray(null);
  },

  /* sahne sabitleri */
  setScene(o) {
    const gl = this.gl, u = this.uni;
    gl.uniform3fv(u.uLightDir, o.lightDir || [0.45, 0.82, 0.35]);
    gl.uniform3fv(u.uSunColor, o.sunColor || [1, 1, 1]);
    gl.uniform3fv(u.uAmbient, o.ambient || [0.34, 0.36, 0.40]);
    gl.uniform3fv(u.uTint, o.tint || [1, 1, 1]);
    gl.uniform3fv(u.uFogColor, o.fogColor || [1, 1, 1]);
    gl.uniform1f(u.uFogNear, o.fogNear === undefined ? 60 : o.fogNear);
    gl.uniform1f(u.uFogFar, o.fogFar === undefined ? 420 : o.fogFar);
    gl.uniform1f(u.uFogAmount, o.fogAmount === undefined ? 0.55 : o.fogAmount);
  },

  setEmissive(v, alpha) {
    const gl = this.gl;
    gl.uniform1f(this.uni.uEmissive, v);
    gl.uniform1f(this.uni.uAlpha, alpha === undefined ? 1 : alpha);
  },
};

/* ------------------------------------------------------------------ */
/*  Geo — temel şekiller (normal + indeks)                             */
/* ------------------------------------------------------------------ */
const Geo = {
  _quad(pos, nrm, idx, a, b, c, d, n) {
    const base = pos.length / 3;
    for (const p of [a, b, c, d]) {
      pos.push(p[0], p[1], p[2]);
      nrm.push(n[0], n[1], n[2]);
    }
    idx.push(base, base + 1, base + 2, base, base + 2, base + 3);
  },

  box(w, h, d) {
    const hx = w / 2, hy = h / 2, hz = d / 2;
    const pos = [], nrm = [], idx = [];
    const q = (a, b, c, dd, n) => Geo._quad(pos, nrm, idx, a, b, c, dd, n);
    q([hx, -hy, hz], [hx, -hy, -hz], [hx, hy, -hz], [hx, hy, hz], [1, 0, 0]);
    q([-hx, -hy, -hz], [-hx, -hy, hz], [-hx, hy, hz], [-hx, hy, -hz], [-1, 0, 0]);
    q([-hx, hy, hz], [hx, hy, hz], [hx, hy, -hz], [-hx, hy, -hz], [0, 1, 0]);
    q([-hx, -hy, -hz], [hx, -hy, -hz], [hx, -hy, hz], [-hx, -hy, hz], [0, -1, 0]);
    q([-hx, -hy, hz], [hx, -hy, hz], [hx, hy, hz], [-hx, hy, hz], [0, 0, 1]);
    q([hx, -hy, -hz], [-hx, -hy, -hz], [-hx, hy, -hz], [hx, hy, -hz], [0, 0, -1]);
    return { pos, nrm, idx };
  },

  /** Beşik çatı: taban y=0, mahya z ekseni boyunca, yükseklik h. */
  prism(w, h, d) {
    const hx = w / 2, hz = d / 2;
    const pos = [], nrm = [], idx = [];
    const slope = Math.hypot(hx, h);
    const nL = [-h / slope, hx / slope, 0];
    const nR = [h / slope, hx / slope, 0];

    // sol eğim
    Geo._quad(pos, nrm, idx,
      [-hx, 0, hz], [0, h, hz], [0, h, -hz], [-hx, 0, -hz], nL);
    // sağ eğim
    Geo._quad(pos, nrm, idx,
      [0, h, hz], [hx, 0, hz], [hx, 0, -hz], [0, h, -hz], nR);
    // ön üçgen (+z)
    let b = pos.length / 3;
    pos.push(-hx, 0, hz, hx, 0, hz, 0, h, hz);
    for (let i = 0; i < 3; i++) nrm.push(0, 0, 1);
    idx.push(b, b + 1, b + 2);
    // arka üçgen (-z)
    b = pos.length / 3;
    pos.push(hx, 0, -hz, -hx, 0, -hz, 0, h, -hz);
    for (let i = 0; i < 3; i++) nrm.push(0, 0, -1);
    idx.push(b, b + 1, b + 2);
    return { pos, nrm, idx };
  },

  cyl(r, h, seg) {
    seg = seg || 12;
    const pos = [], nrm = [], idx = [];
    for (let i = 0; i < seg; i++) {
      const a0 = (i / seg) * Math.PI * 2;
      const a1 = ((i + 1) / seg) * Math.PI * 2;
      const x0 = Math.cos(a0) * r, z0 = Math.sin(a0) * r;
      const x1 = Math.cos(a1) * r, z1 = Math.sin(a1) * r;
      const base = pos.length / 3;
      pos.push(x0, 0, z0, x1, 0, z1, x1, h, z1, x0, h, z0);
      nrm.push(Math.cos(a0), 0, Math.sin(a0), Math.cos(a1), 0, Math.sin(a1),
               Math.cos(a1), 0, Math.sin(a1), Math.cos(a0), 0, Math.sin(a0));
      idx.push(base, base + 1, base + 2, base, base + 2, base + 3);
      // kapaklar
      const bc = pos.length / 3;
      pos.push(0, h, 0, x0, h, z0, x1, h, z1);
      nrm.push(0, 1, 0, 0, 1, 0, 0, 1, 0);
      idx.push(bc, bc + 1, bc + 2);
      const bb = pos.length / 3;
      pos.push(0, 0, 0, x1, 0, z1, x0, 0, z0);
      nrm.push(0, -1, 0, 0, -1, 0, 0, -1, 0);
      idx.push(bb, bb + 1, bb + 2);
    }
    return { pos, nrm, idx };
  },

  cone(r, h, seg) {
    seg = seg || 12;
    const pos = [], nrm = [], idx = [];
    const sl = Math.hypot(r, h);
    for (let i = 0; i < seg; i++) {
      const a0 = (i / seg) * Math.PI * 2;
      const a1 = ((i + 1) / seg) * Math.PI * 2;
      const x0 = Math.cos(a0) * r, z0 = Math.sin(a0) * r;
      const x1 = Math.cos(a1) * r, z1 = Math.sin(a1) * r;
      const b = pos.length / 3;
      pos.push(x0, 0, z0, x1, 0, z1, 0, h, 0);
      const am = (a0 + a1) / 2;
      nrm.push(Math.cos(am) * h / sl, r / sl, Math.sin(am) * h / sl);
      nrm.push(Math.cos(am) * h / sl, r / sl, Math.sin(am) * h / sl);
      nrm.push(Math.cos(am) * h / sl, r / sl, Math.sin(am) * h / sl);
      idx.push(b, b + 1, b + 2);
      const bb = pos.length / 3;
      pos.push(0, 0, 0, x1, 0, z1, x0, 0, z0);
      nrm.push(0, -1, 0, 0, -1, 0, 0, -1, 0);
      idx.push(bb, bb + 1, bb + 2);
    }
    return { pos, nrm, idx };
  },

  sphere(r, seg, rings) {
    seg = seg || 12; rings = rings || 8;
    const pos = [], nrm = [], idx = [];
    for (let y = 0; y <= rings; y++) {
      const v = y / rings, phi = v * Math.PI;
      for (let x = 0; x <= seg; x++) {
        const u = x / seg, theta = u * Math.PI * 2;
        const nx = Math.sin(phi) * Math.cos(theta);
        const ny = Math.cos(phi);
        const nz = Math.sin(phi) * Math.sin(theta);
        pos.push(nx * r, ny * r, nz * r);
        nrm.push(nx, ny, nz);
      }
    }
    for (let y = 0; y < rings; y++) {
      for (let x = 0; x < seg; x++) {
        const a = y * (seg + 1) + x;
        const b = a + seg + 1;
        idx.push(a, b, a + 1, a + 1, b, b + 1);
      }
    }
    return { pos, nrm, idx };
  },

  plane(w, d) {
    const pos = [], nrm = [], idx = [];
    Geo._quad(pos, nrm, idx,
      [-w / 2, 0, d / 2], [w / 2, 0, d / 2], [w / 2, 0, -d / 2], [-w / 2, 0, -d / 2], [0, 1, 0]);
    return { pos, nrm, idx };
  },
};

/* ------------------------------------------------------------------ */
/*  MB — birleşik mesh kurucusu (statik dünya tek tamponda)            */
/* ------------------------------------------------------------------ */
const MB = {
  create() { return { pos: [], nrm: [], col: [], idx: [] }; },

  /** geo'yu mat ile dönüştürüp mb'ye ekler. color: [r,g,b] ya da fonksiyon. */
  add(mb, geo, mat, color) {
    const base = mb.pos.length / 3;
    const isFn = typeof color === 'function';
    const p = geo.pos, n = geo.nrm;
    for (let i = 0; i < p.length; i += 3) {
      const x = p[i], y = p[i + 1], z = p[i + 2];
      const wx = mat[0] * x + mat[4] * y + mat[8] * z + mat[12];
      const wy = mat[1] * x + mat[5] * y + mat[9] * z + mat[13];
      const wz = mat[2] * x + mat[6] * y + mat[10] * z + mat[14];
      mb.pos.push(wx, wy, wz);

      const nx = n[i], ny = n[i + 1], nz = n[i + 2];
      let tx = mat[0] * nx + mat[4] * ny + mat[8] * nz;
      let ty = mat[1] * nx + mat[5] * ny + mat[9] * nz;
      let tz = mat[2] * nx + mat[6] * ny + mat[10] * nz;
      const len = Math.hypot(tx, ty, tz) || 1;
      mb.nrm.push(tx / len, ty / len, tz / len);

      const c = isFn ? color(wx, wy, wz) : color;
      mb.col.push(c[0], c[1], c[2]);
    }
    for (let i = 0; i < geo.idx.length; i++) mb.idx.push(geo.idx[i] + base);
    return mb;
  },

  /** Kısayol: kutu yerleştir. */
  box(mb, color, x, y, z, w, h, d, ry) {
    return MB.add(mb, Geo.box(w, h, d), M4.trs(x, y + h / 2, z, ry || 0), color);
  },
};
