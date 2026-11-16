/* Numex Little Planet — sahne, yüzey yerleştirmesi, yaşayan dünya, kayıt
   Yerleştirme mantığı: ışın gezegen küresini keser, kesişim noktası gezegenin
   YEREL uzayına çevrilir ve nesne gezegenin çocuğu olarak o noktaya oturtulur.
   Böylece gezegen dönerken nesne yüzeye bağlı kalır; konumu bozulmaz. */

(function () {
  'use strict';

  const $ = function (s) { return document.querySelector(s); };
  const T = window.THREE;
  const TAU = Math.PI * 2;
  const R = 10;
  // NUMEX-DÜZELTME (2026-11-16): THREE bir ad alanı nesnesi, `new T` çağrısı yükleme anında hata fırlatıyordu; doğrusu üçlü operatörle sadece varlık kontrolü.
  const UP = T ? new T.Vector3(0, 1, 0) : null;
  const Z_AXIS = T ? new T.Vector3(0, 0, 1) : null;
  const STORE_KEY = 'numex-little-planet-v1';

  const canvas = $('#scene');

  function gate(msg) {
    if (msg) $('#gateMsg').textContent = msg;
    $('#gate').hidden = false;
    $('#loading').classList.add('hide');
  }

  if (!T) {
    gate('3B motoru (vendor/three.min.js) yüklenemedi. Dosyanın proje klasöründe olduğundan emin ol.');
    return;
  }

  let renderer;
  try {
    renderer = new T.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true, preserveDrawingBuffer: true });
  } catch (err) {
    gate('Tarayıcı WebGL bağlamı açamadı (' + (err && err.message ? err.message : 'bilinmeyen hata') + '). Donanım hızlandırmayı açıp sayfayı yenilemeyi dene.');
    return;
  }

  canvas.addEventListener('webglcontextlost', function (e) {
    e.preventDefault();
    gate('Grafik bağlamı kayboldu. Sayfayı yenilemek yeterli.');
  });

  const LOW = (navigator.deviceMemory && navigator.deviceMemory <= 4) ||
    (navigator.hardwareConcurrency || 8) <= 4 ||
    /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
  const LIMIT = LOW ? 60 : 120;

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = T.PCFSoftShadowMap;
  if ('outputColorSpace' in renderer) renderer.outputColorSpace = T.SRGBColorSpace;

  /* ---------------- durum ---------------- */
  const state = {
    name: 'Bahar Gezegeni',
    surface: 0x9fd8a0,
    atmo: 0xbfe9ff,
    night: false,
    spinning: true,
    placeMode: true,
    tool: 'ev',
    world: 'bahar',
    objects: [],
    selected: null
  };

  let nextId = 1;
  function freshId() { return 'o' + (nextId++); }

  const meshes = new Map();
  const anim = { windmills: [], sways: [], clouds: [], bobs: [], lamps: [] };

  /* ---------------- sahne ---------------- */
  const scene = new T.Scene();
  const camera = new T.PerspectiveCamera(42, 1, 0.1, 400);

  const hemi = new T.HemisphereLight(0xeaf6ff, 0xb6e2a8, 0.9);
  scene.add(hemi);

  const sun = new T.DirectionalLight(0xfff3dc, 1.3);
  sun.position.set(26, 21, 16);
  sun.castShadow = true;
  sun.shadow.mapSize.set(LOW ? 512 : 1024, LOW ? 512 : 1024);
  sun.shadow.bias = -0.0009;
  sun.shadow.normalBias = 0.03;
  const shadowCam = sun.shadow.camera;
  shadowCam.left = -14;
  shadowCam.right = 14;
  shadowCam.top = 14;
  shadowCam.bottom = -14;
  shadowCam.near = 1;
  shadowCam.far = 96;
  shadowCam.updateProjectionMatrix();
  scene.add(sun);
  scene.add(sun.target);

  const fill = new T.DirectionalLight(0xcfe6ff, 0.4);
  fill.position.set(-20, -14, -18);
  scene.add(fill);

  const planetGroup = new T.Group();
  planetGroup.rotation.z = 0.16;
  scene.add(planetGroup);

  const planet = new T.Mesh(
    new T.SphereGeometry(R, 72, 48),
    new T.MeshStandardMaterial({ color: state.surface, roughness: 0.95, metalness: 0.0 })
  );
  planet.receiveShadow = true;
  planet.castShadow = true;
  planetGroup.add(planet);

  const atmo = new T.Mesh(
    new T.SphereGeometry(R * 1.055, 48, 32),
    new T.MeshBasicMaterial({
      color: state.atmo, transparent: true, opacity: 0.26,
      side: T.BackSide, depthWrite: false, blending: T.AdditiveBlending
    })
  );
  planetGroup.add(atmo);

  const halo = new T.Mesh(
    new T.SphereGeometry(R * 1.17, 40, 26),
    new T.MeshBasicMaterial({
      color: state.atmo, transparent: true, opacity: 0.07,
      side: T.BackSide, depthWrite: false, blending: T.AdditiveBlending
    })
  );
  planetGroup.add(halo);

  /* seçim halkası */
  const ring = new T.Mesh(
    new T.TorusGeometry(1, 0.05, 6, 36),
    new T.MeshBasicMaterial({ color: 0xff7fb2, transparent: true, opacity: 0.95 })
  );
  ring.userData.isRing = true;
  ring.visible = false;
  planet.add(ring);

  /* yıldızlar (gece) */
  const starCount = LOW ? 600 : 1300;
  const starPos = new Float32Array(starCount * 3);
  for (let i = 0; i < starCount; i++) {
    const u = Math.random() * 2 - 1;
    const th = Math.random() * TAU;
    const rr = 90 + Math.random() * 50;
    const s = Math.sqrt(1 - u * u);
    starPos[i * 3] = rr * s * Math.cos(th);
    starPos[i * 3 + 1] = rr * u;
    starPos[i * 3 + 2] = rr * s * Math.sin(th);
  }
  const stars = new T.Points(
    new T.BufferGeometry().setAttribute('position', new T.BufferAttribute(starPos, 3)),
    new T.PointsMaterial({ color: 0xffffff, size: 1.7, sizeAttenuation: false, transparent: true, opacity: 0, depthWrite: false })
  );
  stars.frustumCulled = false;
  scene.add(stars);

  /* ---------------- kamera (kendi yörünge kontrolümüz) ---------------- */
  const cam = { theta: 0.95, phi: 1.12, dist: 38, tTheta: 0.95, tPhi: 1.12, tDist: 38 };

  function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }

  function updateCamera(dt) {
    const k = Math.min(1, dt * 10);
    cam.theta += (cam.tTheta - cam.theta) * k;
    cam.phi += (cam.tPhi - cam.phi) * k;
    cam.dist += (cam.tDist - cam.dist) * k;
    const sp = Math.sin(cam.phi);
    camera.position.set(
      cam.dist * sp * Math.cos(cam.theta),
      cam.dist * Math.cos(cam.phi),
      cam.dist * sp * Math.sin(cam.theta)
    );
    camera.lookAt(0, 0, 0);
  }

  /* ---------------- yerleştirme ---------------- */
  /* Nesneler küçük gezegene göre görünür kalsın: üreteçler birim boyda kurulur,
     yerleştirmede bu taban ölçekle büyütülür (kullanıcı ölçeği bunun üzerine biner). */
  const OBJ_BASE = 1.55;

  const _n = new T.Vector3();
  const _q1 = new T.Quaternion();
  const _q2 = new T.Quaternion();

  /* Nesneyi yüzeye oturt: konum = yön * R, yön = yüzey normali, dönüş = normal etrafında spin. */
  function placeMesh(g, rec) {
    _n.set(rec.dir[0], rec.dir[1], rec.dir[2]).normalize();
    g.position.copy(_n).multiplyScalar(R);
    _q1.setFromUnitVectors(UP, _n);
    _q2.setFromAxisAngle(_n, rec.spin || 0);
    g.quaternion.copy(_q1.premultiply(_q2));
    g.scale.setScalar((rec.scale || 1) * OBJ_BASE);

    if (!g.userData.baseQuat) g.userData.baseQuat = new T.Quaternion();
    g.userData.baseQuat.copy(g.quaternion);
    if (!g.userData.normal) g.userData.normal = new T.Vector3();
    g.userData.normal.copy(_n);
    if (!g.userData.basePos) g.userData.basePos = new T.Vector3();
    g.userData.basePos.copy(g.position);
  }

  function registerAnim(g) {
    const a = g.userData.anim;
    if (!a) return;
    if (a.kind === 'windmill') anim.windmills.push(g);
    else if (a.kind === 'sway') {
      g.userData.phase = Math.random() * TAU;
      g.userData.amp = a.amp || 0.04;
      anim.sways.push(g);
    } else if (a.kind === 'cloud') {
      g.userData.speed = a.speed || 0.04;
      g.userData.dir = Math.random() < 0.5 ? 1 : -1;
      anim.clouds.push(g);
    } else if (a.kind === 'bob') {
      g.userData.phase = Math.random() * TAU;
      g.userData.amp = a.amp || 0.05;
      anim.bobs.push(g);
    } else if (a.kind === 'lamp') {
      anim.lamps.push(a.bulb);
    }
  }

  function unregisterAnim(g) {
    ['windmills', 'sways', 'clouds', 'bobs'].forEach(function (k) {
      const i = anim[k].indexOf(g);
      if (i >= 0) anim[k].splice(i, 1);
    });
    const a = g.userData.anim;
    if (a && a.kind === 'lamp') {
      const i = anim.lamps.indexOf(a.bulb);
      if (i >= 0) anim.lamps.splice(i, 1);
    }
  }

  function disposeGroup(g) {
    g.traverse(function (o) {
      if (o.geometry) o.geometry.dispose();
      if (o.material) {
        if (Array.isArray(o.material)) o.material.forEach(function (m) { m.dispose(); });
        else o.material.dispose();
      }
    });
  }

  function buildMesh(rec) {
    const g = NP.create(rec.type, rec.seed, R);
    g.userData.objId = rec.id;
    g.userData.rec = rec;
    placeMesh(g, rec);
    planet.add(g);
    meshes.set(rec.id, g);
    registerAnim(g);
    return g;
  }

  function findRec(id) {
    for (let i = 0; i < state.objects.length; i++) if (state.objects[i].id === id) return state.objects[i];
    return null;
  }

  function addObjectAt(type, localPoint) {
    if (state.objects.length >= LIMIT) {
      toast('Nesne sınırı doldu (' + LIMIT + '). Birkaç nesne silip yeniden dene.', 'warn');
      return null;
    }
    const len = Math.hypot(localPoint.x, localPoint.y, localPoint.z) || 1;
    const rec = {
      id: freshId(),
      type: NP.BY_TYPE[type] ? type : 'ev',
      dir: [localPoint.x / len, localPoint.y / len, localPoint.z / len],
      spin: Math.random() * TAU,
      scale: 1,
      seed: 1 + Math.floor(Math.random() * 1e9)
    };
    state.objects.push(rec);
    buildMesh(rec);
    select(rec.id);
    refreshCount();
    scheduleAutosave();
    return rec;
  }

  function removeObject(id) {
    const idx = state.objects.findIndex(function (o) { return o.id === id; });
    if (idx < 0) return false;
    state.objects.splice(idx, 1);
    const g = meshes.get(id);
    if (g) {
      unregisterAnim(g);
      planet.remove(g);
      disposeGroup(g);
      meshes.delete(id);
    }
    if (state.selected === id) select(null);
    refreshCount();
    scheduleAutosave();
    return true;
  }

  function updateRing(rec) {
    _n.set(rec.dir[0], rec.dir[1], rec.dir[2]).normalize();
    ring.position.copy(_n).multiplyScalar(R + 0.07);
    ring.quaternion.setFromUnitVectors(Z_AXIS, _n);
    ring.scale.setScalar(Math.max(0.9, (rec.scale || 1) * OBJ_BASE * 1.15));
  }

  function select(id) {
    state.selected = id || null;
    const rec = state.selected ? findRec(state.selected) : null;
    const card = $('#selCard');
    if (!rec) {
      ring.visible = false;
      card.hidden = true;
      return;
    }
    updateRing(rec);
    ring.visible = true;
    card.hidden = false;
    $('#selName').textContent = NP.labelOf(rec.type);
    $('#scaleRange').value = Math.round(rec.scale * 100);
    $('#scaleOut').textContent = '%' + Math.round(rec.scale * 100);
  }

  function setScale(id, s) {
    const rec = findRec(id);
    if (!rec) return false;
    rec.scale = clamp(s, 0.5, 2);
    const g = meshes.get(id);
    if (g) placeMesh(g, rec);
    if (state.selected === id) {
      updateRing(rec);
      $('#scaleRange').value = Math.round(rec.scale * 100);
      $('#scaleOut').textContent = '%' + Math.round(rec.scale * 100);
    }
    scheduleAutosave();
    return true;
  }

  function spinBy(id, deg) {
    const rec = findRec(id);
    if (!rec) return false;
    rec.spin = (rec.spin || 0) + (deg * Math.PI) / 180;
    const g = meshes.get(id);
    if (g) placeMesh(g, rec);
    if (state.selected === id) updateRing(rec);
    scheduleAutosave();
    return true;
  }

  /* ---------------- yaşayan dünya ---------------- */
  function animateWorld(dt, t) {
    let i;
    for (i = 0; i < anim.windmills.length; i++) {
      anim.windmills[i].userData.anim.blades.rotation.z += dt * 1.5;
    }
    for (i = 0; i < anim.sways.length; i++) {
      const g = anim.sways[i];
      g.quaternion.copy(g.userData.baseQuat);
      const ph = g.userData.phase;
      const amp = g.userData.amp;
      g.rotateX(Math.sin(t * 1.5 + ph) * amp);
      g.rotateZ(Math.cos(t * 1.15 + ph) * amp * 0.7);
    }
    for (i = 0; i < anim.bobs.length; i++) {
      const g = anim.bobs[i];
      g.position.copy(g.userData.basePos)
        .addScaledVector(g.userData.normal, Math.sin(t * 2 + g.userData.phase) * g.userData.amp);
    }
    for (i = 0; i < anim.clouds.length; i++) {
      const g = anim.clouds[i];
      const rec = g.userData.rec;
      _q2.setFromAxisAngle(UP, dt * g.userData.speed * g.userData.dir);
      _n.set(rec.dir[0], rec.dir[1], rec.dir[2]).applyQuaternion(_q2).normalize();
      rec.dir[0] = _n.x;
      rec.dir[1] = _n.y;
      rec.dir[2] = _n.z;
      placeMesh(g, rec);
    }
  }

  const DAY_SUN = new T.Color(0xfff3dc);
  const NIGHT_SUN = new T.Color(0x93b8ff);
  const DAY_SKY = new T.Color(0xeaf6ff);
  const NIGHT_SKY = new T.Color(0x33456e);
  const DAY_GROUND = new T.Color(0xb6e2a8);
  const NIGHT_GROUND = new T.Color(0x2b3a55);
  let nightMix = 0;
  let nightClass = false;

  function updateSky(dt) {
    const target = state.night ? 1 : 0;
    if (Math.abs(nightMix - target) > 0.001) nightMix += (target - nightMix) * Math.min(1, dt * 3.2);
    else nightMix = target;

    sun.color.copy(DAY_SUN).lerp(NIGHT_SUN, nightMix);
    sun.intensity = 1.3 - nightMix * 1.05;
    hemi.color.copy(DAY_SKY).lerp(NIGHT_SKY, nightMix);
    hemi.groundColor.copy(DAY_GROUND).lerp(NIGHT_GROUND, nightMix);
    hemi.intensity = 0.9 - nightMix * 0.62;
    fill.intensity = 0.4 - nightMix * 0.25;
    stars.material.opacity = nightMix * 0.9;

    const want = nightMix > 0.5;
    if (want !== nightClass) {
      nightClass = want;
      document.body.classList.toggle('night', want);
    }

    const glow = 0.4 + nightMix * 1.9;
    for (let i = 0; i < anim.lamps.length; i++) anim.lamps[i].material.emissiveIntensity = glow;
  }

  /* ---------------- kayıt / yükleme ---------------- */
  function r6(v) { return Math.round(v * 1e6) / 1e6; }

  function serialize() {
    return {
      app: 'numex-little-planet',
      version: 1,
      name: state.name,
      world: state.world,
      surface: state.surface,
      atmo: state.atmo,
      night: state.night,
      objects: state.objects.map(function (o) {
        return {
          id: o.id,
          type: o.type,
          dir: [r6(o.dir[0]), r6(o.dir[1]), r6(o.dir[2])],
          spin: r6(o.spin || 0),
          scale: r6(o.scale || 1),
          seed: o.seed
        };
      })
    };
  }

  function clearPlanet() {
    meshes.forEach(function (g) {
      planet.remove(g);
      disposeGroup(g);
    });
    meshes.clear();
    state.objects.length = 0;
    state.selected = null;
    ring.visible = false;
    $('#selCard').hidden = true;
    anim.windmills.length = 0;
    anim.sways.length = 0;
    anim.clouds.length = 0;
    anim.bobs.length = 0;
    anim.lamps.length = 0;
  }

  function applyData(data) {
    if (!data || !Array.isArray(data.objects)) throw new Error('Geçersiz dünya dosyası: nesne listesi yok.');

    clearPlanet();
    state.name = (typeof data.name === 'string' && data.name.trim()) ? data.name.slice(0, 28) : 'Gezegenim';
    if (typeof data.surface === 'number') state.surface = data.surface;
    if (typeof data.atmo === 'number') state.atmo = data.atmo;
    state.night = !!data.night;
    state.world = typeof data.world === 'string' ? data.world : '';

    data.objects.slice(0, LIMIT).forEach(function (raw) {
      if (!raw || typeof raw.type !== 'string') return;
      const d = (Array.isArray(raw.dir) && raw.dir.length === 3) ? raw.dir : [0, 1, 0];
      const len = Math.hypot(+d[0] || 0, +d[1] || 0, +d[2] || 0) || 1;
      const type = NP.BY_TYPE[raw.type] ? raw.type : 'ev';
      const rec = {
        id: (typeof raw.id === 'string' && raw.id) ? raw.id : freshId(),
        type: type,
        dir: [(+d[0] || 0) / len, (+d[1] || 0) / len, (+d[2] || 0) / len],
        spin: +raw.spin || 0,
        scale: clamp(+raw.scale || 1, 0.5, 2),
        seed: raw.seed ? raw.seed >>> 0 : 1 + Math.floor(Math.random() * 1e9)
      };
      const m = /^o(\d+)$/.exec(rec.id);
      if (m) nextId = Math.max(nextId, +m[1] + 1);
      if (findRec(rec.id)) rec.id = freshId();
      state.objects.push(rec);
      buildMesh(rec);
    });

    syncUi();
    scheduleAutosave();
    return state.objects.length;
  }

  let saveTimer = null;
  function scheduleAutosave() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(function () {
      try {
        localStorage.setItem(STORE_KEY, JSON.stringify(serialize()));
      } catch (e) { /* kota dolu ya da depolama kapalı: sessizce geç */ }
    }, 400);
  }

  function slug(s) {
    const map = { 'ç': 'c', 'ğ': 'g', 'ı': 'i', 'İ': 'i', 'ö': 'o', 'ş': 's', 'ü': 'u' };
    return (s || 'gezegen').toLowerCase().replace(/[çğıİöşü]/g, function (c) { return map[c] || c; })
      .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'gezegen';
  }

  function saveJson() {
    const blob = new Blob([JSON.stringify(serialize(), null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = slug(state.name) + '.json';
    a.click();
    setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
    toast('Dünya JSON olarak kaydedildi: ' + a.download, 'ok');
  }

  function exportPng() {
    renderer.render(scene, camera);
    const w = renderer.domElement.width;
    const h = renderer.domElement.height;
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    const ctx = c.getContext('2d');
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    if (nightMix > 0.5) {
      grad.addColorStop(0, '#16233f');
      grad.addColorStop(0.55, '#2a3f6b');
      grad.addColorStop(1, '#4a5c88');
    } else {
      grad.addColorStop(0, '#bfe6ff');
      grad.addColorStop(0.45, '#dcf3ff');
      grad.addColorStop(1, '#fdf8ef');
    }
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(renderer.domElement, 0, 0);

    const fs = Math.max(14, Math.round(h * 0.026));
    ctx.font = '600 ' + fs + 'px "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = nightMix > 0.5 ? 'rgba(255,255,255,0.86)' : 'rgba(36,64,92,0.72)';
    ctx.fillText(state.name + ' · Numex Little Planet', w / 2, h - Math.round(h * 0.035));

    const a = document.createElement('a');
    a.download = slug(state.name) + '.png';
    a.href = c.toDataURL('image/png');
    a.click();
    toast('PNG indirildi: ' + a.download, 'ok');
  }

  /* ---------------- arayüz ---------------- */
  const nameInput = $('#planetName');
  const placeToggle = $('#placeToggle');
  const scaleRange = $('#scaleRange');
  const scaleOut = $('#scaleOut');

  function toast(msg, kind) {
    const el = $('#toast');
    el.textContent = msg;
    el.className = 'show' + (kind ? ' ' + kind : '');
    clearTimeout(toast._t);
    toast._t = setTimeout(function () { el.className = ''; }, 2800);
  }

  function refreshCount() {
    const el = $('#objCount');
    el.textContent = state.objects.length + ' / ' + LIMIT + ' nesne';
    el.parentElement.classList.toggle('full', state.objects.length >= LIMIT);
  }

  function refreshSwatches() {
    document.querySelectorAll('#surfaceSwatches .swatch').forEach(function (b) {
      b.classList.toggle('active', +b.dataset.color === state.surface);
    });
    document.querySelectorAll('#atmoSwatches .swatch').forEach(function (b) {
      b.classList.toggle('active', +b.dataset.color === state.atmo);
    });
  }

  function markWorldButtons() {
    document.querySelectorAll('.world').forEach(function (b) {
      b.classList.toggle('active', b.dataset.world === state.world);
    });
  }

  function selectTool(type) {
    state.tool = type;
    document.querySelectorAll('.tool').forEach(function (b) {
      b.classList.toggle('active', b.dataset.type === type);
    });
    state.placeMode = true;
    placeToggle.checked = true;
    toast(NP.labelOf(type) + ' seçildi — gezegene tıkla.', '');
  }

  function syncUi() {
    nameInput.value = state.name;
    planet.material.color.setHex(state.surface);
    atmo.material.color.setHex(state.atmo);
    halo.material.color.setHex(state.atmo);

    const btnNight = $('#btnNight');
    btnNight.textContent = state.night ? '☀️ Gündüz' : '🌙 Gece';
    btnNight.classList.toggle('on', state.night);

    const btnRotate = $('#btnRotate');
    btnRotate.textContent = state.spinning ? '⏸ Dönüşü durdur' : '▶ Dönüşü başlat';
    btnRotate.classList.toggle('on', !state.spinning);

    refreshCount();
    refreshSwatches();
    markWorldButtons();
  }

  function loadWorld(i) {
    const w = NP.WORLDS[i];
    if (!w) return false;
    clearPlanet();
    state.name = w.name;
    state.surface = w.surface;
    state.atmo = w.atmo;
    state.world = w.id;

    w.objects.forEach(function (o, idx) {
      const rec = {
        id: freshId(),
        type: o.type,
        dir: o.dir.slice(),
        spin: o.spin || 0,
        scale: o.scale || 1,
        seed: 1013 + i * 7919 + idx * 131
      };
      state.objects.push(rec);
      buildMesh(rec);
    });

    syncUi();
    scheduleAutosave();
    toast(w.name + ' hazır — her nesneyi değiştirebilirsin.', 'ok');
    return true;
  }

  function resetCamera() {
    cam.tTheta = 0.95;
    cam.tPhi = 1.12;
    cam.tDist = 34;
  }

  const armed = {};
  function confirmTwice(key, msg, fn) {
    const now = Date.now();
    if (armed[key] && now - armed[key] < 4500) {
      armed[key] = 0;
      fn();
    } else {
      armed[key] = now;
      toast(msg + ' Onaylamak için düğmeye bir daha bas.', 'warn');
    }
  }

  /* palet */
  NP.TYPES.forEach(function (def) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'tool' + (def.t === state.tool ? ' active' : '');
    b.dataset.type = def.t;
    b.title = def.label;
    const ic = document.createElement('span');
    ic.className = 'ic';
    ic.textContent = def.icon;
    const lb = document.createElement('span');
    lb.textContent = def.label;
    b.appendChild(ic);
    b.appendChild(lb);
    b.addEventListener('click', function () { selectTool(def.t); });
    $('#paletteGrid').appendChild(b);
  });

  /* hazır dünyalar */
  NP.WORLDS.forEach(function (w, i) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'world';
    b.dataset.world = w.id;
    const ic = document.createElement('span');
    ic.className = 'wic';
    ic.textContent = w.icon;
    const txt = document.createElement('span');
    txt.className = 'wtxt';
    const nm = document.createElement('span');
    nm.className = 'wname';
    nm.textContent = w.name;
    const ds = document.createElement('span');
    ds.className = 'wdesc';
    ds.textContent = w.desc;
    txt.appendChild(nm);
    txt.appendChild(ds);
    b.appendChild(ic);
    b.appendChild(txt);
    b.addEventListener('click', function () { loadWorld(i); });
    $('#worldList').appendChild(b);
  });

  /* renk seçenekleri */
  const SURFACES = [0x9fd8a0, 0xa9c8f0, 0xffd6e8, 0xb9e2c8, 0xf7e7a8, 0xd7c8f5, 0xf7c8a8, 0x9fe0d8];
  const ATMOS = [0xbfe9ff, 0xffd0ea, 0xd8c8ff, 0xc8f0e0, 0xffe9b0, 0xffffff, 0xb0d0ff, 0xffc8b0];

  function buildSwatches(container, colors, key) {
    colors.forEach(function (c) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'swatch';
      b.dataset.color = String(c);
      b.style.background = '#' + c.toString(16).padStart(6, '0');
      b.title = '#' + c.toString(16).padStart(6, '0');
      b.addEventListener('click', function () {
        state[key] = c;
        if (key === 'surface') planet.material.color.setHex(c);
        else {
          atmo.material.color.setHex(c);
          halo.material.color.setHex(c);
        }
        refreshSwatches();
        scheduleAutosave();
      });
      container.appendChild(b);
    });
  }

  buildSwatches($('#surfaceSwatches'), SURFACES, 'surface');
  buildSwatches($('#atmoSwatches'), ATMOS, 'atmo');

  /* düğmeler */
  $('#btnRotate').addEventListener('click', function () {
    state.spinning = !state.spinning;
    syncUi();
    scheduleAutosave();
    toast(state.spinning ? 'Gezegen dönüyor.' : 'Gezegen dönüşü durdu.', '');
  });

  $('#btnNight').addEventListener('click', function () {
    state.night = !state.night;
    syncUi();
    scheduleAutosave();
    toast(state.night ? 'Gece oldu — lambalar yanıyor.' : 'Gündüz oldu.', '');
  });

  $('#btnPng').addEventListener('click', exportPng);
  $('#btnSave').addEventListener('click', saveJson);
  $('#btnLoad').addEventListener('click', function () { $('#fileInput').click(); });

  $('#fileInput').addEventListener('change', function (e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function () {
      try {
        const data = JSON.parse(String(reader.result));
        const n = applyData(data);
        toast('Dünya yüklendi: ' + n + ' nesne.', 'ok');
      } catch (err) {
        toast('Dosya okunamadı: ' + (err && err.message ? err.message : 'geçersiz JSON'), 'warn');
      }
      e.target.value = '';
    };
    reader.readAsText(file, 'utf-8');
  });

  $('#btnNew').addEventListener('click', function () {
    confirmTwice('new', 'Yeni gezegen tüm nesneleri siler.', function () {
      clearPlanet();
      state.name = 'Yeni Gezegen';
      state.world = '';
      state.surface = 0xa9c8f0;
      state.atmo = 0xffffff;
      state.night = false;
      resetCamera();
      syncUi();
      scheduleAutosave();
      toast('Boş bir gezegen açıldı.', 'ok');
    });
  });

  $('#btnReset').addEventListener('click', function () {
    confirmTwice('reset', 'Sıfırlama her şeyi başa alır.', function () {
      state.night = false;
      state.spinning = true;
      state.placeMode = true;
      placeToggle.checked = true;
      resetCamera();
      loadWorld(0);
      toast('Başlangıç durumuna dönüldü.', 'ok');
    });
  });

  $('#btnDel').addEventListener('click', function () {
    if (state.selected) {
      removeObject(state.selected);
      toast('Nesne silindi.', '');
    }
  });

  $('#btnRotL').addEventListener('click', function () {
    if (state.selected) spinBy(state.selected, -15);
  });
  $('#btnRotR').addEventListener('click', function () {
    if (state.selected) spinBy(state.selected, 15);
  });

  scaleRange.addEventListener('input', function () {
    if (state.selected) setScale(state.selected, (+scaleRange.value) / 100);
  });

  placeToggle.addEventListener('change', function () {
    state.placeMode = placeToggle.checked;
    toast(state.placeMode ? 'Yerleştirme açık — tıkladığın yere nesne gelir.' : 'Yerleştirme kapalı — tıklama sadece seçer.', '');
  });

  nameInput.addEventListener('input', function () {
    state.name = nameInput.value.slice(0, 28);
    scheduleAutosave();
  });

  /* ---------------- fare ---------------- */
  let drag = null;

  canvas.addEventListener('pointerdown', function (e) {
    if (e.button && e.button !== 0) return;
    drag = { x: e.clientX, y: e.clientY, moved: 0 };
    try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* yok say */ }
  });

  canvas.addEventListener('pointermove', function (e) {
    if (!drag) return;
    const dx = e.clientX - drag.x;
    const dy = e.clientY - drag.y;
    drag.x = e.clientX;
    drag.y = e.clientY;
    drag.moved += Math.abs(dx) + Math.abs(dy);
    cam.tTheta -= dx * 0.006;
    cam.tPhi = clamp(cam.tPhi - dy * 0.006, 0.18, Math.PI - 0.18);
    if (drag.moved > 5) canvas.classList.add('grabbing');
  });

  canvas.addEventListener('pointerup', function (e) {
    const wasDrag = drag && drag.moved > 6;
    drag = null;
    canvas.classList.remove('grabbing');
    if (!wasDrag) pickAt(e.clientX, e.clientY);
  });

  canvas.addEventListener('pointercancel', function () {
    drag = null;
    canvas.classList.remove('grabbing');
  });

  canvas.addEventListener('wheel', function (e) {
    e.preventDefault();
    cam.tDist = clamp(cam.tDist * Math.exp(e.deltaY * 0.0012), 15, 72);
  }, { passive: false });

  const raycaster = new T.Raycaster();
  const ndc = new T.Vector2();

  function findOwner(obj) {
    let o = obj;
    while (o && o !== planet) {
      if (o.userData && o.userData.objId) return o;
      o = o.parent;
    }
    return null;
  }

  function pickAt(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    ndc.set(
      ((clientX - rect.left) / rect.width) * 2 - 1,
      -((clientY - rect.top) / rect.height) * 2 + 1
    );
    raycaster.setFromCamera(ndc, camera);
    const hits = raycaster.intersectObject(planet, true);

    for (let i = 0; i < hits.length; i++) {
      if (hits[i].object.userData && hits[i].object.userData.isRing) continue;
      const owner = findOwner(hits[i].object);
      if (owner) {
        select(owner.userData.objId);
        return;
      }
      if (hits[i].object === planet) {
        if (!state.placeMode) {
          select(null);
          return;
        }
        const local = planet.worldToLocal(hits[i].point.clone());
        addObjectAt(state.tool, local);
        return;
      }
    }
    select(null);
  }

  /* ---------------- boyut / döngü ---------------- */
  function resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', resize);
  resize();

  const clock = new T.Clock();
  let elapsed = 0;

  function frame() {
    const dt = Math.min(clock.getDelta(), 0.05);
    elapsed += dt;
    if (state.spinning) planet.rotation.y += dt * 0.12;
    updateCamera(dt);
    animateWorld(dt, elapsed);
    updateSky(dt);
    renderer.render(scene, camera);
  }

  /* ---------------- başlat ---------------- */
  let restored = false;
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      if (data && Array.isArray(data.objects)) {
        applyData(data);
        restored = true;
        toast('Son dünyan geri yüklendi (' + state.objects.length + ' nesne).', 'ok');
      }
    }
  } catch (err) { restored = false; }

  if (!restored) loadWorld(0);

  syncUi();
  renderer.setAnimationLoop(frame);

  setTimeout(function () { $('#loading').classList.add('hide'); }, 300);

  /* ---------------- ölçüm / test kancası ---------------- */
  function dirFrom(latDeg, lonDeg) {
    const a = (latDeg * Math.PI) / 180;
    const b = (lonDeg * Math.PI) / 180;
    return new T.Vector3(Math.cos(a) * Math.cos(b), Math.sin(a), Math.cos(a) * Math.sin(b));
  }

  window.NP.app = {
    version: '1.0.0',
    limit: LIMIT,
    types: function () { return NP.TYPES.map(function (t) { return t.t; }); },
    save: serialize,
    load: function (data) { return applyData(data); },
    count: function () { return state.objects.length; },
    state: function () {
      return {
        name: state.name, surface: state.surface, atmo: state.atmo,
        night: state.night, spinning: state.spinning, tool: state.tool,
        placeMode: state.placeMode, selected: state.selected, count: state.objects.length
      };
    },
    place: function (type, lat, lon, scale, spinDeg) {
      const p = dirFrom(lat, lon);
      const rec = addObjectAt(type, p);
      if (!rec) return null;
      if (scale) setScale(rec.id, scale);
      if (spinDeg) spinBy(rec.id, spinDeg);
      return rec.id;
    },
    placeAt: function (type, x, y, z) {
      const rec = addObjectAt(type, new T.Vector3(x, y, z));
      return rec ? rec.id : null;
    },
    record: function (id) {
      const r = findRec(id);
      return r ? JSON.parse(JSON.stringify(r)) : null;
    },
    select: function (id) { select(id); return state.selected; },
    remove: function (id) { return removeObject(id); },
    setScale: setScale,
    spinBy: spinBy,
    worldPos: function (id) {
      const g = meshes.get(id);
      if (!g) return null;
      const v = new T.Vector3();
      g.getWorldPosition(v);
      return [v.x, v.y, v.z];
    },
    worldQuat: function (id) {
      const g = meshes.get(id);
      if (!g) return null;
      const q = new T.Quaternion();
      g.getWorldQuaternion(q);
      return [q.x, q.y, q.z, q.w];
    },
    surfaceNormal: function (id) {
      const g = meshes.get(id);
      if (!g) return null;
      const v = new T.Vector3(0, 1, 0).applyQuaternion(g.getWorldQuaternion(new T.Quaternion()));
      return [v.x, v.y, v.z];
    },
    setPlanetSpin: function (deg) { planet.rotation.y = (deg * Math.PI) / 180; },
    planetSpin: function () { return (planet.rotation.y * 180) / Math.PI; },
    camera: function () {
      return { theta: cam.theta, phi: cam.phi, dist: cam.dist, pos: camera.position.toArray() };
    },
    setCamera: function (theta, phi, dist) {
      if (typeof theta === 'number') cam.theta = cam.tTheta = theta;
      if (typeof phi === 'number') cam.phi = cam.tPhi = phi;
      if (typeof dist === 'number') cam.dist = cam.tDist = dist;
      updateCamera(0.2);
    },
    loadWorld: loadWorld,
    worldCount: function () { return NP.WORLDS.length; },
    worldNames: function () { return NP.WORLDS.map(function (w) { return w.name; }); },
    night: function (v) { state.night = !!v; syncUi(); },
    spinning: function (v) { state.spinning = !!v; syncUi(); },
    clear: clearPlanet,
    resetCamera: resetCamera,
    nightMix: function () { return nightMix; }
  };
})();
