/* NUMEX FLOORPLAN — 3D görünüm
 * 2D ile AYNI veri modelinden (NF.project) üretilir. Ayrı sahte sahne yoktur.
 * Duvar boşlukları (kapı/pencere) duvar geometrisinden gerçekten kesilir.
 */
(function (global) {
  'use strict';
  const NF = global.NF;
  const G = NF.G;

  const V3 = {
    canvas: null, renderer: null, scene: null, camera: null, root: null,
    target: null, az: -Math.PI * 0.28, pol: 0.86, radius: 18,
    _raf: null, visible: false, _drag: null, _dirty: true,

    init(canvas) {
      this.canvas = canvas;
      if (!global.THREE) {
        console.error('Three.js yüklenemedi');
        return;
      }
      this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      if ('outputEncoding' in this.renderer) this.renderer.outputEncoding = THREE.sRGBEncoding;

      this.scene = new THREE.Scene();
      this.scene.background = new THREE.Color(0x0f141b);

      this.camera = new THREE.PerspectiveCamera(50, 1, 0.1, 400);
      this.target = new THREE.Vector3(3, 0.9, 3);

      const hemi = new THREE.HemisphereLight(0xdff1ff, 0x4a453c, 0.72);
      this.scene.add(hemi);

      const sun = new THREE.DirectionalLight(0xfff3e0, 0.95);
      sun.position.set(14, 20, 9);
      sun.castShadow = true;
      sun.shadow.mapSize.set(2048, 2048);
      const d = 22;
      sun.shadow.camera.left = -d; sun.shadow.camera.right = d;
      sun.shadow.camera.top = d; sun.shadow.camera.bottom = -d;
      sun.shadow.camera.near = 1; sun.shadow.camera.far = 80;
      sun.shadow.bias = -0.0006;
      this.scene.add(sun);
      this.sun = sun;

      const fill = new THREE.DirectionalLight(0xcfe4ff, 0.22);
      fill.position.set(-10, 8, -8);
      this.scene.add(fill);

      this.root = new THREE.Group();
      this.scene.add(this.root);

      this.bindControls();
      this.resize();
      window.addEventListener('resize', () => this.resize());
      if (window.ResizeObserver) new ResizeObserver(() => this.resize()).observe(canvas.parentElement);
      NF.on('model', () => this.update());
      // 2D'de yapılan her model değişikliği 3D sahneye de yansır (kare başına bir kez)
      NF.on('change', () => this.scheduleUpdate());
      this.update();
      this.loop();
    },

    resize() {
      if (!this.renderer) return;
      const r = this.canvas.parentElement.getBoundingClientRect();
      const w = Math.max(1, Math.round(r.width)), h = Math.max(1, Math.round(r.height));
      this.renderer.setSize(w, h, false);
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
    },

    scheduleUpdate() {
      if (this._pending) return;
      this._pending = true;
      requestAnimationFrame(() => {
        this._pending = false;
        if (this.visible) this.update();
      });
    },

    setVisible(v) {
      this.visible = v;
      if (v) { this.resize(); this.update(); }
    },

    /* ---------- kamera ---------- */
    updateCamera() {
      const p = this.pol, a = this.az;
      const cp = Math.cos(p), sp = Math.sin(p);
      const x = this.target.x + this.radius * cp * Math.sin(a);
      const z = this.target.z + this.radius * cp * Math.cos(a);
      const y = this.target.y + this.radius * sp;
      this.camera.position.set(x, y, z);
      this.camera.lookAt(this.target);
    },

    fitCamera() {
      const b = NF.bounds(NF.project);
      this.target.set(b.x + b.w / 2, Math.max(0.8, NF.project.wallHeight * 0.32), b.y + b.h / 2);
      this.radius = Math.max(5, Math.max(b.w, b.h) * 1.55);
      this.updateCamera();
    },

    bindControls() {
      const cv = this.canvas;
      cv.addEventListener('pointerdown', e => {
        cv.setPointerCapture(e.pointerId);
        this._drag = {
          x: e.clientX, y: e.clientY, button: e.button,
          az: this.az, pol: this.pol, target: this.target.clone()
        };
        cv.style.cursor = 'grabbing';
      });
      cv.addEventListener('pointermove', e => {
        if (!this._drag) return;
        const dx = e.clientX - this._drag.x, dy = e.clientY - this._drag.y;
        if (this._drag.button === 0 && !e.shiftKey) {
          this.az = this._drag.az - dx * 0.0065;
          this.pol = G.clamp(this._drag.pol + dy * 0.0055, 0.12, 1.48);
        } else {
          // kaydırma: kameranın sağ ve ileri vektörleri boyunca hedefi taşı
          const right = new THREE.Vector3();
          this.camera.getWorldDirection(right);
          const up = new THREE.Vector3(0, 1, 0);
          const side = new THREE.Vector3().crossVectors(right, up).normalize();
          const forward = new THREE.Vector3().crossVectors(up, side).normalize();
          const k = this.radius * 0.0016;
          this.target.copy(this._drag.target)
            .addScaledVector(side, dx * k)
            .addScaledVector(forward, -dy * k);
        }
        this.updateCamera();
      });
      const end = () => { this._drag = null; cv.style.cursor = 'grab'; };
      cv.addEventListener('pointerup', end);
      cv.addEventListener('pointercancel', end);
      cv.addEventListener('contextmenu', e => e.preventDefault());
      cv.addEventListener('wheel', e => {
        e.preventDefault();
        this.radius = G.clamp(this.radius * (e.deltaY > 0 ? 1.1 : 1 / 1.1), 2.2, 160);
        this.updateCamera();
      }, { passive: false });
      cv.style.cursor = 'grab';
    },

    loop() {
      const tick = () => {
        this._raf = requestAnimationFrame(tick);
        if (!this.visible) return;
        this.renderer.render(this.scene, this.camera);
      };
      tick();
    },

    /* ---------- sahne kurulumu ---------- */
    clearRoot() {
      const kill = o => {
        if (o.geometry) o.geometry.dispose();
        if (o.material) {
          if (Array.isArray(o.material)) o.material.forEach(m => m.dispose());
          else o.material.dispose();
        }
      };
      while (this.root.children.length) {
        const c = this.root.children.pop();
        c.traverse(kill);
      }
    },

    update() {
      if (!this.renderer) return;
      this.clearRoot();
      const p = NF.project;
      const H = p.wallHeight || 2.8;

      /* zemin */
      const groundMat = new THREE.MeshStandardMaterial({ color: 0x2b333e, roughness: 1, metalness: 0 });
      const b = NF.bounds(p);
      const gsize = Math.max(20, Math.max(b.w, b.h) * 2.4);
      const ground = new THREE.Mesh(new THREE.PlaneGeometry(gsize, gsize), groundMat);
      ground.rotation.x = -Math.PI / 2;
      ground.position.set(b.x + b.w / 2, -0.02, b.y + b.h / 2);
      ground.receiveShadow = true;
      this.root.add(ground);

      const grid = new THREE.GridHelper(gsize, Math.round(gsize / 0.5), 0x3a4a5c, 0x2f3a48);
      grid.position.set(b.x + b.w / 2, -0.015, b.y + b.h / 2);
      grid.material.opacity = 0.5; grid.material.transparent = true;
      this.root.add(grid);

      /* oda zeminleri */
      const roomList = NF.rooms(p);
      const floorMats = [
        new THREE.MeshStandardMaterial({ color: 0xc9a97c, roughness: 0.72, metalness: 0.02 }),
        new THREE.MeshStandardMaterial({ color: 0xb9b3a6, roughness: 0.85, metalness: 0.02 }),
        new THREE.MeshStandardMaterial({ color: 0xa9bfc9, roughness: 0.7, metalness: 0.03 }),
        new THREE.MeshStandardMaterial({ color: 0xc6bda9, roughness: 0.8, metalness: 0.02 })
      ];
      roomList.forEach((r, i) => {
        const shape = new THREE.Shape();
        r.poly.forEach((q, k) => { k ? shape.lineTo(q.x, -q.y) : shape.moveTo(q.x, -q.y); });
        shape.closePath();
        const geo = new THREE.ShapeGeometry(shape);
        const mesh = new THREE.Mesh(geo, floorMats[i % floorMats.length]);
        mesh.rotation.x = -Math.PI / 2;
        mesh.position.y = 0.012;
        mesh.receiveShadow = true;
        this.root.add(mesh);
      });

      /* duvarlar + boşluklar */
      const wallMat = new THREE.MeshStandardMaterial({ color: 0xe8e3d8, roughness: 0.9, metalness: 0 });
      const box = (w, h, d, x, y, z, ry, mat) => {
        if (h <= 0.001 || w <= 0.001) return;
        const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
        m.position.set(x, y, z);
        m.rotation.y = ry;
        m.castShadow = true; m.receiveShadow = true;
        this.root.add(m);
      };

      p.walls.forEach(wl => {
        const L = G.len(wl);
        // NUMEX-DÜZELTME (2026-11-16): forEach geri çağrısı döngü değildir; continue sözdizimi hatası verip dosyanın tamamını geçersiz kılıyordu (V3 tanımsız kalıyordu). Doğrusu return.
        if (L < 0.02) return;
        const ang = G.angle(wl);
        const ry = -ang;
        const t = wl.t || 0.2;
        const at = d => G.pointAt(wl, d);
        const ops = NF.openingsOf(p, wl.id)
          .map(o => ({
            ...o,
            start: G.clamp(o.d - o.w / 2, 0, L),
            end: G.clamp(o.d + o.w / 2, 0, L)
          }))
          .sort((a, c) => a.start - c.start);

        let cursor = 0;
        const addSeg = (from, to, y0, y1) => {
          if (to - from < 0.011 || y1 - y0 < 0.01) return;
          const mid = (from + to) / 2;
          const pt = at(mid);
          box(to - from, y1 - y0, t, pt.x, y0 + (y1 - y0) / 2, pt.y, ry, wallMat);
        };

        ops.forEach(op => {
          addSeg(cursor, op.start, 0, H);
          if (op.type === 'door') {
            addSeg(op.start, op.end, Math.min(op.h, H), H);   // kapı üstü lento
          } else {
            addSeg(op.start, op.end, 0, Math.min(op.sill, H));            // denizlik altı
            addSeg(op.start, op.end, Math.min(op.sill + op.h, H), H);     // pencere üstü
          }
          cursor = Math.max(cursor, op.end);
        });
        addSeg(cursor, L, 0, H);

        /* kapı kanadı + cam */
        ops.forEach(op => {
          if (op.type === 'door') {
            const leafMat = new THREE.MeshStandardMaterial({ color: 0xb98a52, roughness: 0.6, metalness: 0.05 });
            const hx = op.d - op.w / 2;
            const hinge = at(G.clamp(hx, 0, L));
            const openAng = ang + 0.95;
            const cx = hinge.x + Math.cos(openAng) * (op.w / 2);
            const cz = hinge.y + Math.sin(openAng) * (op.w / 2);
            box(op.w * 0.98, Math.min(op.h, H) - 0.04, 0.045, cx, (Math.min(op.h, H) - 0.04) / 2 + 0.02, cz, -openAng, leafMat);
          } else {
            const glassMat = new THREE.MeshStandardMaterial({
              color: 0x9fd0e8, roughness: 0.08, metalness: 0.1,
              transparent: true, opacity: 0.38
            });
            const c = at(op.d);
            box(op.w * 0.96, Math.min(op.h, H - op.sill), 0.05,
              c.x, Math.min(op.sill, H) + Math.min(op.h, H - op.sill) / 2, c.y, ry, glassMat);
            const frameMat = new THREE.MeshStandardMaterial({ color: 0x8d99a6, roughness: 0.5, metalness: 0.2 });
            box(op.w * 0.98, 0.05, (t || 0.2) + 0.02, c.x, Math.min(op.sill, H) + 0.02, c.y, ry, frameMat);
          }
        });
      });

      /* mobilya */
      p.furniture.forEach(f => {
        const cat = NF.CAT[f.type] || { h: 0.75, color: '#8b98a8' };
        const col = new THREE.Color(cat.color || '#8b98a8');
        const mat = new THREE.MeshStandardMaterial({ color: col, roughness: 0.72, metalness: 0.03 });
        const h = cat.h || 0.75;
        const mesh = new THREE.Mesh(new THREE.BoxGeometry(f.w, h, f.d), mat);
        mesh.position.set(f.x, h / 2, f.y);
        mesh.rotation.y = -f.rot;
        mesh.castShadow = true; mesh.receiveShadow = true;
        this.root.add(mesh);

        // sırt / başlık detayı: mobilyayı düz kutudan ayırt etmek için
        if (f.type === 'sofa' || f.type === 'bed' || f.type === 'tv' || f.type === 'bookshelf') {
          const topMat = new THREE.MeshStandardMaterial({
            color: col.clone().multiplyScalar(1.16), roughness: 0.65, metalness: 0.04
          });
          const bh = f.type === 'bed' ? 0.18 : (f.type === 'tv' ? 0.12 : 0.4);
          const bd = f.type === 'sofa' ? f.d * 0.24 : f.d * 0.5;
          const off = -(f.d / 2 - bd / 2);                    // yerel -z (arka) yönünde
          const lzX = -Math.sin(f.rot), lzZ = Math.cos(f.rot); // yerel +z ekseninin dünya karşılığı
          const back = new THREE.Mesh(new THREE.BoxGeometry(f.w, bh, bd), topMat);
          back.position.set(f.x + lzX * off, h + bh / 2 - 0.02, f.y + lzZ * off);
          back.rotation.y = -f.rot;
          back.castShadow = true; back.receiveShadow = true;
          this.root.add(back);
        }
      });

      this.fitCamera();
    }
  };

  global.V3 = V3;
})(window);
