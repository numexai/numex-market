/* ============================================================================
   NUMEX CORE — SKY COMMAND · 3D sahne
   İSTANBUL HAVALİMANI (LTFM) — kurgusal simülasyon düzeni
   ----------------------------------------------------------------------------
   Geometrinin TAMAMI kodla üretilir — hazır havalimanı sahnesi indirilmez.
   Uçak konumları DOĞRUDAN ortak durum motorundan (window.NUMEX.flights) okunur;
   3D ile radar aynı kaynaktan beslenir, ikinci bir sahte simülasyon yoktur.
   1 birim = 1 km (motor dünyası ile aynı ölçek).
   ========================================================================== */
// NUMEX-DÜZELTME (2026-10-27): 3D modülü kurulum sırasında sessizce düşüyordu (SKY3D hiç tanımlanmıyordu). Kurulum artık hatayı yakalayıp window.__SKY3D_ERR'e yazar — test ve teşhis gerçek nedeni görebilir.
window.__SKY3D_ERR = null;
window.addEventListener('error', (e) => { window.__SKY3D_ERR = (e.message || '') + ' @' + (e.filename || '') + ':' + (e.lineno || ''); });

(function () {
  'use strict';

  const N = window.NUMEX;
  if (!N || !window.THREE) {
    console.warn('[SKY3D] three.js bulunamadı — 3D sekmesi devre dışı.');
    window.__SKY3D_ERR = 'THREE veya NUMEX yok (THREE=' + !!window.THREE + ', NUMEX=' + !!N + ')';
    return;
  }
  const THREE = window.THREE;
  // NUMEX-DÜZELTME (2026-10-27): Kök neden: NUMEX.flights artık getter; nesne yıkımı (destructuring) getter'ı BİR KEZ çağırıp değeri donduruyordu (getFlights bir dizi sanılıp çağrılınca hata). Güncel dizi her seferinde fonksiyonla okunur.
  const { AIRPORT, S } = N;
  const getFlights = () => N.flights;

  // canvas: üretim sayfasında #three; test iskeletinde de bulunur — yoksa 3D kurulmaz
  const canvas = document.getElementById('three');
  const wrap = document.getElementById('threeWrap') || (canvas && canvas.parentElement);
  if (!canvas || !wrap) { console.warn('[SKY3D] canvas bulunamadı — 3D atlandı.'); return; }
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(48, 1, 0.01, 400);

  /* ---------------------------------------------------------------- ışıklar */
  const hemi = new THREE.HemisphereLight(0xa8c8e4, 0x1a2418, 1.0);
  scene.add(hemi);

  const sun = new THREE.DirectionalLight(0xfff0d8, 2.0);
  sun.position.set(-5, 7, -4);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -5; sun.shadow.camera.right = 5;
  sun.shadow.camera.top = 5; sun.shadow.camera.bottom = -5;
  sun.shadow.camera.near = 0.5; sun.shadow.camera.far = 24;
  sun.shadow.bias = -0.0009;
  scene.add(sun);

  const runwayNightLights = [];
  const namedParts = [];

  /* ---------------------------------------------------------------- zemin */
  const groundMat = new THREE.MeshStandardMaterial({ color: 0x2b4a32, roughness: 1, metalness: 0 });
  const groundMat2 = new THREE.MeshStandardMaterial({ color: 0x27422d, roughness: 1, metalness: 0 });

  const ground = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  ground.name = 'zemin_cim';
  scene.add(ground);

  // kodla üretilen çim dokusu
  (() => {
    const c = document.createElement('canvas');
    c.width = c.height = 512;
    const g = c.getContext('2d');
    g.fillStyle = '#2b4a32'; g.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 9000; i++) {
      const v = Math.random();
      g.fillStyle = v > 0.6
        ? `rgba(${52 + Math.random() * 22 | 0},${84 + Math.random() * 34 | 0},${52 + Math.random() * 20 | 0},0.5)`
        : `rgba(${28 + Math.random() * 16 | 0},${54 + Math.random() * 24 | 0},${32 + Math.random() * 14 | 0},0.45)`;
      g.fillRect(Math.random() * 512, Math.random() * 512, 2, 3);
    }
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(26, 26);
    groundMat.map = t;
  })();

  /* ---------------------------------------------------------------- materyaller */
  const M = {
    asphalt: new THREE.MeshStandardMaterial({ color: 0x2a3038, roughness: 0.95, metalness: 0.03 }),
    shoulder: new THREE.MeshStandardMaterial({ color: 0x353c45, roughness: 0.96 }),
    mark: new THREE.MeshStandardMaterial({ color: 0xf2f6fa, roughness: 0.65, emissive: 0x232a31 }),
    markYellow: new THREE.MeshStandardMaterial({ color: 0xe8c34a, roughness: 0.8, emissive: 0x3a2e08 }),
    taxi: new THREE.MeshStandardMaterial({ color: 0x333a43, roughness: 0.95 }),
    apron: new THREE.MeshStandardMaterial({ color: 0x3b424b, roughness: 0.94 }),
    concrete: new THREE.MeshStandardMaterial({ color: 0xb9c3cd, roughness: 0.75, metalness: 0.12 }),
    glass: new THREE.MeshStandardMaterial({
      color: 0x1f4a68, roughness: 0.1, metalness: 0.85,
      emissive: 0x14384d, emissiveIntensity: 0.85,
    }),
    roof: new THREE.MeshStandardMaterial({ color: 0xd8e0e8, roughness: 0.42, metalness: 0.45 }),
    helper: new THREE.MeshStandardMaterial({ color: 0x6b7683, roughness: 0.82 }),
    road: new THREE.MeshStandardMaterial({ color: 0x30363d, roughness: 0.95 }),
  };

  /* ---------------------------------------------------------------- pistler (5 paralel) */
  const RW = AIRPORT.runways;
  const RW_HALF = (RW[0].z1 - RW[0].z0) / 2;

  function buildRunway(rw, idx) {
    const g = new THREE.Group();
    g.name = 'pist_' + rw.short;
    const len = rw.z1 - rw.z0;
    const zc = (rw.z0 + rw.z1) / 2;

    const sh = new THREE.Mesh(new THREE.BoxGeometry(0.135, 0.012, len + 0.16), M.shoulder);
    sh.position.set(rw.x, 0.006, zc);
    sh.receiveShadow = true;
    g.add(sh);

    const strip = new THREE.Mesh(new THREE.BoxGeometry(0.105, 0.015, len), M.asphalt);
    strip.position.set(rw.x, 0.012, zc);
    strip.receiveShadow = true;
    g.add(strip);

    // merkez hattı
    for (let z = rw.z0 + 0.14; z < rw.z1 - 0.14; z += 0.1) {
      const m = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.002, 0.05), M.mark);
      m.position.set(rw.x, 0.021, z);
      g.add(m);
    }
    // eşik barları (iki baş)
    [-1, 1].forEach(side => {
      for (let i = -4; i <= 4; i++) {
        const m = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.002, 0.085), M.mark);
        m.position.set(rw.x + i * 0.013, 0.021, side < 0 ? rw.z0 + 0.1 : rw.z1 - 0.1);
        g.add(m);
      }
    });
    // teğet işaretleri
    [-1, 1].forEach(side => {
      for (let k = 1; k <= 3; k++) {
        for (let s = -1; s <= 1; s += 2) {
          const m = new THREE.Mesh(new THREE.BoxGeometry(0.017, 0.002, 0.065), M.mark);
          m.position.set(rw.x + s * 0.031, 0.021, side < 0 ? rw.z0 + 0.3 + k * 0.1 : rw.z1 - 0.3 - k * 0.1);
          g.add(m);
        }
      }
    });
    // pist numarası (34)
    const numTex = (() => {
      const c = document.createElement('canvas'); c.width = 128; c.height = 72;
      const x = c.getContext('2d');
      x.fillStyle = '#2a3038'; x.fillRect(0, 0, 128, 72);
      x.fillStyle = '#f2f6fa'; x.font = 'bold 54px monospace'; x.textAlign = 'center'; x.textBaseline = 'middle';
      x.fillText('34', 64, 38);
      return new THREE.CanvasTexture(c);
    })();
    const numMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.075, 0.042),
      new THREE.MeshBasicMaterial({ map: numTex, transparent: true }));
    numMesh.rotation.x = -Math.PI / 2;
    numMesh.position.set(rw.x, 0.023, rw.z1 - 0.22);
    g.add(numMesh);

    // pist aydınlatması — kenar ışıkları
    const edgeGeo = new THREE.SphereGeometry(0.007, 6, 6);
    const edgeMat = new THREE.MeshStandardMaterial({
      color: 0xfff4dc, emissive: 0xffd98a, emissiveIntensity: 1.8, roughness: 0.4,
    });
    for (let z = rw.z0; z <= rw.z1 + 0.001; z += 0.14) {
      [-1, 1].forEach(s => {
        const l = new THREE.Mesh(edgeGeo, edgeMat);
        l.position.set(rw.x + s * 0.064, 0.016, z);
        g.add(l);
        runwayNightLights.push(l);
      });
    }
    // eşik ışıkları (kuzey kırmızı / güney yeşil)
    [-1, 1].forEach(side => {
      for (let i = -4; i <= 4; i++) {
        const m = new THREE.Mesh(new THREE.SphereGeometry(0.008, 6, 6),
          new THREE.MeshStandardMaterial({
            color: side < 0 ? 0x39d97b : 0xff4d5e,
            emissive: side < 0 ? 0x39d97b : 0xff4d5e,
            emissiveIntensity: 2.4,
          }));
        m.position.set(rw.x + i * 0.015, 0.018, side < 0 ? rw.z0 : rw.z1);
        g.add(m);
        runwayNightLights.push(m);
      }
    });
    // yaklaşma ışıkları
    for (let k = 1; k <= 9; k++) {
      const m = new THREE.Mesh(new THREE.SphereGeometry(0.007, 5, 5),
        new THREE.MeshStandardMaterial({ color: 0xf3f7ff, emissive: 0xcfe3ff, emissiveIntensity: 2.0 }));
      m.position.set(rw.x, 0.015, rw.z0 - k * 0.09);
      g.add(m);
      runwayNightLights.push(m);
    }
    return g;
  }
  RW.forEach((rw, i) => scene.add(buildRunway(rw, i)));

  /* ---------------------------------------------------------------- taksi yolları */
  const taxiGroup = new THREE.Group();
  taxiGroup.name = 'taksi_yollari';
  // her pistin yanında paralel taksi yolu
  RW.forEach(rw => {
    const t = new THREE.Mesh(new THREE.BoxGeometry(0.032, 0.01, RW_HALF * 2 + 0.1), M.taxi);
    t.position.set(rw.x + 0.105, 0.01, 0);
    t.receiveShadow = true;
    taxiGroup.add(t);
    const line = new THREE.Mesh(new THREE.BoxGeometry(0.005, 0.002, RW_HALF * 2 + 0.05), M.markYellow);
    line.position.set(rw.x + 0.105, 0.017, 0);
    taxiGroup.add(line);
  });
  // enlemesine bağlantı taksi yolları
  [-1.65, -0.55, 0.55, 1.65].forEach(z => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(5.0, 0.01, 0.03), M.taxi);
    m.position.set(0, 0.01, z);
    m.receiveShadow = true;
    taxiGroup.add(m);
    const line = new THREE.Mesh(new THREE.BoxGeometry(5.0, 0.002, 0.005), M.markYellow);
    line.position.set(0, 0.017, z);
    taxiGroup.add(line);
  });
  // doğu-batı ana bağlantı (terminale giden)
  const conn = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.01, 0.04), M.taxi);
  conn.position.set(2.55, 0.01, 0.55);
  taxiGroup.add(conn);
  scene.add(taxiGroup);

  /* ---------------------------------------------------------------- apron (İstanbul: geniş) */
  const apron = new THREE.Mesh(new THREE.BoxGeometry(AIRPORT.apron.w, 0.009, AIRPORT.apron.d), M.apron);
  apron.position.set(AIRPORT.apron.x, 0.009, AIRPORT.apron.z);
  apron.receiveShadow = true;
  apron.name = 'apron';
  scene.add(apron);

  // park pozisyonları (uçak durma barları + yön çizgileri)
  const standPositions = [];
  const standSlots = 8;
  for (let i = 0; i < standSlots; i++) {
    const x = AIRPORT.apron.x - 0.18;
    const z = -1.05 + i * 0.3;
    standPositions.push({ x, z });
    const l = new THREE.Mesh(new THREE.BoxGeometry(0.004, 0.002, 0.34), M.mark);
    l.position.set(x, 0.016, z - 0.14);
    scene.add(l);
    const stop = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.002, 0.007), M.mark);
    stop.position.set(x, 0.016, z + 0.07);
    scene.add(stop);
  }

  /* ---------------------------------------------------------------- ana terminal (İstanbul: uzun) */
  const terminalGroup = new THREE.Group();
  terminalGroup.name = 'terminal';
  const T = AIRPORT.terminal;

  const mainBody = new THREE.Mesh(new THREE.BoxGeometry(T.w, T.h, T.d), M.concrete);
  mainBody.position.set(T.x, T.h / 2 + 0.012, T.z);
  mainBody.castShadow = true; mainBody.receiveShadow = true;
  terminalGroup.add(mainBody);

  // cam cephe (apron tarafı, batı yüzü)
  const glass = new THREE.Mesh(new THREE.BoxGeometry(0.008, T.h * 0.66, T.d * 0.97), M.glass);
  glass.position.set(T.x - T.w / 2 - 0.004, T.h * 0.5, T.z);
  terminalGroup.add(glass);

  // çatı (hafif taşkın, dalgalı kanat)
  const roof = new THREE.Mesh(new THREE.BoxGeometry(T.w * 1.35, 0.004, T.d * 1.04), M.roof);
  roof.position.set(T.x - 0.05, T.h + 0.008, T.z);
  roof.castShadow = true;
  terminalGroup.add(roof);

  // dikey kaburgalar (İstanbul terminalinin ritmi)
  for (let i = 0; i < 46; i++) {
    const rib = new THREE.Mesh(new THREE.BoxGeometry(0.009, T.h * 0.92, 0.014), M.roof);
    rib.position.set(T.x - T.w / 2 - 0.012, T.h * 0.5,
      T.z - T.d / 2 + 0.05 + i * (T.d - 0.1) / 45);
    terminalGroup.add(rib);
  }
  // çatı ışıklık bandı
  const sky = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.002, T.d * 0.9),
    new THREE.MeshStandardMaterial({ color: 0x93d8ee, emissive: 0x5fc4e0, emissiveIntensity: 0.9 }));
  sky.position.set(T.x - 0.08, T.h + 0.011, T.z);
  terminalGroup.add(sky);

  // körükler (jet bridge) — aprondaki park noktalarına
  for (let i = 0; i < standSlots; i++) {
    const bz = -1.05 + i * 0.3;
    const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.028, 0.05),
      new THREE.MeshStandardMaterial({ color: 0x5a6876, roughness: 0.72, metalness: 0.3 }));
    bridge.position.set(T.x - T.w / 2 - 0.075, 0.032, bz);
    bridge.castShadow = true;
    terminalGroup.add(bridge);
  }

  // terminal tabelası
  const signTex = (() => {
    const c = document.createElement('canvas'); c.width = 1024; c.height = 128;
    const x = c.getContext('2d');
    x.fillStyle = '#0c1a26'; x.fillRect(0, 0, 1024, 128);
    x.fillStyle = '#ffb53d'; x.font = 'bold 62px monospace'; x.textAlign = 'center'; x.textBaseline = 'middle';
    x.fillText('İSTANBUL HAVALİMANI', 512, 50);
    x.fillStyle = '#4fd1e0'; x.font = '32px monospace';
    x.fillText('LTFM · SİMÜLASYON', 512, 100);
    return new THREE.CanvasTexture(c);
  })();
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.078),
    new THREE.MeshBasicMaterial({ map: signTex, transparent: true }));
  sign.rotation.y = -Math.PI / 2;
  sign.position.set(T.x - T.w / 2 - 0.02, T.h + 0.055, T.z);
  terminalGroup.add(sign);
  scene.add(terminalGroup);

  /* ---------------------------------------------------------------- 4 uç kule (İstanbul) */
  function buildTower(x, z, h, label) {
    const g = new THREE.Group();
    g.name = 'kule_' + label;

    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.036, 0.05, h * 0.85, 16), M.concrete);
    base.position.set(x, h * 0.425 + 0.012, z);
    base.castShadow = true;
    g.add(base);

    // cam kokpit
    const cab = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.032, 0.026, 14), M.glass);
    cab.position.set(x, h + 0.02, z);
    cab.castShadow = true;
    g.add(cab);

    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.047, 0.047, 0.006, 14), M.roof);
    cap.position.set(x, h + 0.036, z);
    g.add(cap);

    // anten + ikaz ışığı
    const ant = new THREE.Mesh(new THREE.CylinderGeometry(0.0025, 0.0025, 0.034, 6),
      new THREE.MeshStandardMaterial({ color: 0xd0dae4, metalness: 0.85, roughness: 0.25 }));
    ant.position.set(x, h + 0.056, z);
    g.add(ant);

    const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.006, 8, 8),
      new THREE.MeshStandardMaterial({ color: 0xff3b4d, emissive: 0xff3b4d, emissiveIntensity: 3 }));
    beacon.position.set(x, h + 0.076, z);
    g.add(beacon);
    g.userData.beacon = beacon;
    beacons.push(beacon);

    // kule kürsü (beton çevre)
    const pad = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.008, 20),
      new THREE.MeshStandardMaterial({ color: 0x8f9aa6, roughness: 0.9 }));
    pad.position.set(x, 0.014, z);
    pad.receiveShadow = true;
    g.add(pad);
    return g;
  }
  const beacons = [];
  AIRPORT.towers.forEach((t, i) => {
    scene.add(buildTower(t.x, t.z, t.h, 'T' + (i + 1)));
  });

  /* ---------------------------------------------------------------- yardımcı yapılar */
  const helpers = [
    { name: 'hangar_bati', x: -4.2, z: 1.2, w: 0.7, d: 0.45, h: 0.055 },
    { name: 'hangar_bati2', x: -4.2, z: 0.55, w: 0.6, d: 0.4, h: 0.05 },
    { name: 'kargo_dogu', x: 4.55, z: 1.5, w: 0.5, d: 0.55, h: 0.045 },
    { name: 'itfaiye', x: 1.0, z: -2.6, w: 0.22, d: 0.16, h: 0.038 },
    { name: 'yakit_tanki', x: -3.6, z: -2.4, w: 0.3, d: 0.3, h: 0.028 },
  ];
  helpers.forEach(b => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(b.w, b.h, b.d), M.helper);
    m.position.set(b.x, b.h / 2 + 0.012, b.z);
    m.castShadow = true; m.receiveShadow = true;
    m.name = b.name;
    scene.add(m);
  });
  // yakıt tankları (silindir)
  [[-3.62, -2.2], [-3.3, -2.55], [-3.9, -2.55]].forEach(([x, z], i) => {
    const t = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.09, 16),
      new THREE.MeshStandardMaterial({ color: 0xa8b2bc, roughness: 0.55, metalness: 0.4 }));
    t.position.set(x, 0.058, z);
    t.castShadow = true;
    t.name = 'yakit_tank_' + i;
    scene.add(t);
  });

  /* ---------------------------------------------------------------- çevre yolları */
  const road = new THREE.Mesh(new THREE.RingGeometry(4.6, 4.72, 96), M.road);
  road.rotation.x = -Math.PI / 2;
  road.position.y = 0.005;
  road.name = 'cevre_yolu';
  scene.add(road);
  // havalimanına giriş yolu
  const access = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.004, 3.2), M.road);
  access.position.set(5.0, 0.005, 3.4);
  access.name = 'giris_yolu';
  scene.add(access);
  // yol şeritleri (küçük ışıklar)
  for (let a = 0; a < 64; a++) {
    const ang = (a / 64) * Math.PI * 2;
    const l = new THREE.Mesh(new THREE.SphereGeometry(0.006, 5, 5),
      new THREE.MeshStandardMaterial({ color: 0xffcf7a, emissive: 0xffcf7a, emissiveIntensity: 1.4 }));
    l.position.set(Math.cos(ang) * 4.66, 0.012, Math.sin(ang) * 4.66);
    scene.add(l);
    runwayNightLights.push(l);
  }

  /* ---------------------------------------------------------------- uçak modeli */
  // Malzemeler bir kez üretilir, tüm uçaklar paylaşır (performans)
  const PLA = {
    body: new THREE.MeshStandardMaterial({ color: 0xf0f5fa, roughness: 0.38, metalness: 0.3 }),
    belly: new THREE.MeshStandardMaterial({ color: 0xd2dce6, roughness: 0.5, metalness: 0.25 }),
    wing: new THREE.MeshStandardMaterial({ color: 0xc8d2dc, roughness: 0.55, metalness: 0.3 }),
    tail: new THREE.MeshStandardMaterial({ color: 0xe23b4a, roughness: 0.5, metalness: 0.25 }),
    engine: new THREE.MeshStandardMaterial({ color: 0x5a6673, roughness: 0.6, metalness: 0.5 }),
    gear: new THREE.MeshStandardMaterial({ color: 0x2b3138, roughness: 0.8 }),
    navR: new THREE.MeshStandardMaterial({ color: 0xff3b4d, emissive: 0xff3b4d, emissiveIntensity: 3 }),
    navG: new THREE.MeshStandardMaterial({ color: 0x39d97b, emissive: 0x39d97b, emissiveIntensity: 3 }),
  };
  // Geometriler de paylaşılır
  const PG = {
    fus: new THREE.CapsuleGeometry(0.0045, 0.052, 4, 12),
    wing: new THREE.BoxGeometry(0.062, 0.0018, 0.018),
    wingBack: new THREE.BoxGeometry(0.034, 0.0018, 0.012),
    fin: new THREE.BoxGeometry(0.002, 0.016, 0.012),
    hstab: new THREE.BoxGeometry(0.026, 0.0018, 0.008),
    eng: new THREE.CylinderGeometry(0.004, 0.004, 0.015, 8),
    navS: new THREE.SphereGeometry(0.0026, 6, 6),
    gearS: new THREE.SphereGeometry(0.0022, 6, 6),
  };
  const RING_GEO = new THREE.RingGeometry(0.024, 0.029, 30);

  function makePlane(f) {
    const g = new THREE.Group();
    const scale = f.acType === 'B77W' ? 1.55 : f.acType === 'AT76' ? 0.85 : f.acType === 'E195' || f.acType === 'CRJ9' ? 0.88 : 1;

    const fus = new THREE.Mesh(PG.fus, PLA.body);
    fus.rotation.x = Math.PI / 2;
    fus.castShadow = true;
    g.add(fus);

    const wing = new THREE.Mesh(PG.wing, PLA.wing);
    wing.position.set(0, -0.001, 0.004);
    wing.castShadow = true;
    g.add(wing);

    const wing2 = new THREE.Mesh(PG.wingBack, PLA.wing);
    wing2.position.set(0, -0.001, -0.015);
    g.add(wing2);

    const fin = new THREE.Mesh(PG.fin, PLA.tail);
    fin.position.set(0, 0.008, -0.026);
    fin.castShadow = true;
    g.add(fin);

    const hstab = new THREE.Mesh(PG.hstab, PLA.wing);
    hstab.position.set(0, 0.001, -0.025);
    g.add(hstab);

    [-1, 1].forEach(s => {
      const eng = new THREE.Mesh(PG.eng, PLA.engine);
      eng.rotation.x = Math.PI / 2;
      eng.position.set(s * 0.014, -0.003, 0.003);
      g.add(eng);
    });

    // iniş takımı
    const gear = new THREE.Group();
    [[0, 0.014], [-0.009, -0.007], [0.009, -0.007]].forEach(p => {
      const w = new THREE.Mesh(PG.gearS, PLA.gear);
      w.position.set(p[0], -0.006, p[1]);
      gear.add(w);
    });
    g.add(gear);

    // nav ışıkları
    const navL = new THREE.Mesh(PG.navS, PLA.navR);
    navL.position.set(-0.031, -0.001, 0.004);
    g.add(navL);
    const navR = new THREE.Mesh(PG.navS, PLA.navG);
    navR.position.set(0.031, -0.001, 0.004);
    g.add(navR);

    // seçim halkası
    const ring = new THREE.Mesh(RING_GEO, new THREE.MeshBasicMaterial({
      color: 0xffb53d, side: THREE.DoubleSide, transparent: true, opacity: 0.95,
    }));
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = -0.009;
    ring.visible = false;
    g.add(ring);

    // 3D etiket
    const c = document.createElement('canvas');
    c.width = 320; c.height = 80;
    const lctx = c.getContext('2d');
    const tex = new THREE.CanvasTexture(c);
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false }));
    sprite.scale.set(0.19, 0.0475, 1);
    sprite.position.y = 0.035;
    g.add(sprite);

    g.scale.setScalar(scale);
    g.userData = { ring, sprite, label: { c, ctx: lctx, tex }, gear, scale };
    return g;
  }

  function paintLabel(f, lbl) {
    const c = lbl.ctx;
    c.clearRect(0, 0, 320, 80);
    c.fillStyle = 'rgba(5,11,17,0.85)';
    c.fillRect(0, 6, 320, 68);
    c.strokeStyle = f.emergency ? '#ff4d5e' : '#4fd1e0';
    c.lineWidth = 3;
    c.strokeRect(1, 7, 318, 66);
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillStyle = f.emergency ? '#ffd7db' : '#e6f2fb';
    c.font = 'bold 30px monospace';
    c.fillText(f.callsign, 160, 32);
    c.fillStyle = f.emergency ? '#ff8a95' : '#ffb53d';
    c.font = '20px monospace';
    c.fillText(f.state + ' · ' + Math.round(f.altitude) + 'ft', 160, 58);
    lbl.tex.needsUpdate = true;
  }

  /* ---------------------------------------------------------------- uçak havuzu */
  const planeObjs = new Map();
  let selected3dId = null;
  let followTargetId = null;

  function syncPlanes() {
    const list = getFlights();
    list.forEach(f => {
      let g = planeObjs.get(f.id);
      if (!g) {
        g = makePlane(f);
        scene.add(g);
        planeObjs.set(f.id, g);
      }
      if (f.state === S.FINISHED) { g.visible = false; return; }
      g.visible = true;

      // Dünya konumu — motor verisinden (radar ile AYNI kaynak)
      g.position.set(f.x, 0.014 + (f.altitude / 1000) * 0.055, f.z);
      g.rotation.y = f.heading * Math.PI / 180;

      // yerde iniş takımı, havada içeri çekilmiş
      g.userData.gear.visible = f.altitude < 400;

      // yukarı bakan gövde eğimi (tırmanış/alçalma)
      const pitch = f.state === S.TAKEOFF ? -0.16 : f.state === S.APPROACH ? 0.1 : f.state === S.LANDING ? 0.06 : 0;
      g.rotation.x = pitch;

      paintLabel(f, g.userData.label);
      g.userData.ring.visible = f.id === selected3dId;
      g.userData.ring.rotation.z += 0.03;
    });
  }

  /* ---------------------------------------------------------------- kamera */
  const orbit = {
    theta: Math.PI * 0.62,
    phi: 1.06,
    radius: 9.5,
    target: new THREE.Vector3(0.6, 0.06, 0),
  };
  let camMode = 'orbit';

  function applyOrbit() {
    const p = orbit;
    camera.position.set(
      p.target.x + p.radius * Math.sin(p.phi) * Math.sin(p.theta),
      p.target.y + p.radius * Math.cos(p.phi),
      p.target.z + p.radius * Math.sin(p.phi) * Math.cos(p.theta)
    );
    camera.lookAt(p.target);
  }
  applyOrbit();

  /* ---------------------------------------------------------------- fare */
  let dragging = false, btn = 0, lastX = 0, lastY = 0, moved = 0;
  canvas.addEventListener('pointerdown', e => {
    dragging = true; btn = e.button; lastX = e.clientX; lastY = e.clientY; moved = 0;
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener('pointerup', e => {
    dragging = false;
    try { canvas.releasePointerCapture(e.pointerId); } catch (_) { }
  });
  canvas.addEventListener('pointermove', e => {
    if (!dragging) return;
    const dx = e.clientX - lastX, dy = e.clientY - lastY;
    lastX = e.clientX; lastY = e.clientY;
    moved += Math.abs(dx) + Math.abs(dy);
    if (moved < 3) return;
    if (btn === 2) {
      const s = orbit.radius * 0.0016;
      orbit.target.x -= (Math.sin(orbit.theta) * dx + Math.cos(orbit.theta) * dy) * s;
      orbit.target.z -= (Math.cos(orbit.theta) * dx - Math.sin(orbit.theta) * dy) * s;
    } else {
      orbit.theta -= dx * 0.006;
      orbit.phi = Math.max(0.1, Math.min(1.5, orbit.phi + dy * 0.005));
      camMode = 'orbit';
      document.querySelectorAll('.cam').forEach(b => b.classList.toggle('on', b.dataset.cam === 'orbit'));
      followTargetId = null;
    }
    applyOrbit();
  });
  canvas.addEventListener('contextmenu', e => e.preventDefault());
  canvas.addEventListener('wheel', e => {
    e.preventDefault();
    orbit.radius = Math.max(0.6, Math.min(30, orbit.radius * (1 + Math.sign(e.deltaY) * 0.1)));
    applyOrbit();
  }, { passive: false });

  // raycast ile uçak seçimi
  const ray = new THREE.Raycaster();
  const m2 = new THREE.Vector2();
  canvas.addEventListener('click', e => {
    if (moved > 6) return;
    const r = canvas.getBoundingClientRect();
    m2.x = ((e.clientX - r.left) / r.width) * 2 - 1;
    m2.y = -((e.clientY - r.top) / r.height) * 2 + 1;
    ray.setFromCamera(m2, camera);
    const objs = [...planeObjs.values()].filter(g => g.visible);
    const hits = ray.intersectObjects(objs, true);
    if (hits.length) {
      let o = hits[0].object;
      while (o.parent && !o.userData.ring) o = o.parent;
      const entry = [...planeObjs.entries()].find(([, g]) => g === o);
      if (entry) {
        selected3dId = entry[0];
        window.SKY3D.highlight(selected3dId);
        if (window.NUMEX_UI) window.NUMEX_UI.selectFlight(selected3dId);
      }
    }
  });

  /* ---------------------------------------------------------------- kamera hazır ayarları */
  const CAMS = {
    orbit: { theta: Math.PI * 0.62, phi: 1.06, radius: 9.5, t: [0.6, 0.06, 0] },
    tower: { theta: 2.2, phi: 1.34, radius: 0.7, t: [AIRPORT.tower.x, 0.1, AIRPORT.tower.z] },
    runway: { theta: 0.02, phi: 1.4, radius: 3.2, t: [0.15, 0.02, 0.3] },
    apron: { theta: 4.7, phi: 1.24, radius: 1.9, t: [AIRPORT.apron.x, 0.03, AIRPORT.apron.z] },
    top: { theta: 0, phi: 0.14, radius: 11, t: [0.2, 0, 0] },
  };
  document.querySelectorAll('.cam').forEach(b => {
    b.addEventListener('click', () => {
      document.querySelectorAll('.cam').forEach(x => x.classList.remove('on'));
      b.classList.add('on');
      camMode = b.dataset.cam;
      followTargetId = null;
      document.getElementById('followName').textContent = '—';
      const c = CAMS[camMode] || CAMS.orbit;
      orbit.theta = c.theta; orbit.phi = c.phi; orbit.radius = c.radius;
      orbit.target.set(c.t[0], c.t[1], c.t[2]);
      applyOrbit();
    });
  });
  // NUMEX-DÜZELTME (2026-10-27): Kök neden: kamera butonu DOM'da yoksa (test iskeleti / farklı sayfa) null.classList çağrısılıyor ve modülün TAMAMI düşüyordu — 3D hiç kurulmuyordu. Koruma eklendi.
  const orbitBtn = document.querySelector('.cam[data-cam="orbit"]');
  if (orbitBtn) orbitBtn.classList.add('on');

  /* ---------------------------------------------------------------- gece / gündüz */
  let night = false;
  const nightChk = document.getElementById('wxNight');
  if (nightChk) nightChk.addEventListener('change', e => {
    night = e.target.checked;
    N.weather.night = night;
    applyNight();
  });

  function applyNight() {
    if (night) {
      scene.background = new THREE.Color(0x040a16);
      scene.fog = new THREE.FogExp2(0x040a16, 0.05);
      hemi.color.set(0x2a4a72); hemi.groundColor.set(0x05080a); hemi.intensity = 0.28;
      sun.intensity = 0.12; sun.color.set(0x8fb0e0);
      groundMat.color.set(0x0d1a12);
      runwayNightLights.forEach(l => { if (l.material) l.material.emissiveIntensity = 3.4; });
      M.glass.emissiveIntensity = 1.6;
    } else {
      scene.background = new THREE.Color(0x9dc4e0);
      scene.fog = new THREE.FogExp2(0x9dc4e0, 0.012);
      hemi.color.set(0xa8c8e4); hemi.groundColor.set(0x1a2418); hemi.intensity = 1.0;
      sun.intensity = 2.0; sun.color.set(0xfff0d8);
      groundMat.color.set(0xffffff);
      runwayNightLights.forEach(l => { if (l.material) l.material.emissiveIntensity = 1.6; });
      M.glass.emissiveIntensity = 0.85;
    }
  }
  applyNight();

  /* ---------------------------------------------------------------- boyutlandırma */
  function resize() {
    const w = wrap.clientWidth || 800, h = wrap.clientHeight || 500;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', resize);
  resize();

  /* ---------------------------------------------------------------- dışa açık */
  const follow = (id) => {
    followTargetId = id;
    if (id) {
      const f = getFlights().find(x => x.id === id);
      document.getElementById('followName').textContent = f ? f.callsign : '—';
    }
  };
  const highlight = (id) => { selected3dId = id; };

  /* ---------------------------------------------------------------- döngü */
  const tclock = new THREE.Clock();
  let fpsAcc = 0, fpsN = 0, fpsShown = 0, blinkT = 0;

  function update() {
    syncPlanes();

    // takip kamerası
    if (followTargetId) {
      const f = getFlights().find(x => x.id === followTargetId);
      if (f && f.state !== S.FINISHED) {
        const tgt = new THREE.Vector3(f.x, 0.014 + (f.altitude / 1000) * 0.055, f.z);
        orbit.target.lerp(tgt, 0.14);
        const targetR = 0.35 + (f.altitude / 9000) * 1.2;
        orbit.radius += (Math.max(0.3, targetR) - orbit.radius) * 0.06;
        const behind = (f.heading + 195) * Math.PI / 180;
        let d = behind - orbit.theta;
        while (d > Math.PI) d -= Math.PI * 2;
        while (d < -Math.PI) d += Math.PI * 2;
        orbit.theta += d * 0.06;
        orbit.phi += (1.3 - orbit.phi) * 0.06;
        applyOrbit();
      } else if (f && f.state === S.FINISHED) {
        followTargetId = null;
        document.getElementById('followName').textContent = '—';
      }
    }

    // kule ikaz ışıkları
    blinkT += 0.055;
    const v = 1.2 + Math.abs(Math.sin(blinkT)) * 3.2;
    beacons.forEach(b => { b.material.emissiveIntensity = v; });

    renderer.render(scene, camera);

    // gerçek FPS ölçümü
    const dt = tclock.getDelta();
    fpsAcc += dt || 0.016;
    fpsN++;
    if (fpsAcc >= 0.5) {
      fpsShown = Math.round(fpsN / fpsAcc);
      fpsAcc = 0; fpsN = 0;
      const el = document.getElementById('threeFps');
      if (el) {
        el.textContent = fpsShown + ' FPS';
        el.style.color = fpsShown >= 50 ? '#43d17a' : fpsShown >= 30 ? '#ffb53d' : '#ff4d5e';
      }
      window.SKY3D_FPS = fpsShown;
    }
  }

  function rebuild() {
    planeObjs.forEach(g => { scene.remove(g); });
    planeObjs.clear();
    selected3dId = null;
    followTargetId = null;
  }

  window.__SKY3D_ERR = null;
  window.SKY3D = {
    update, follow, highlight, resize, rebuild, scene, camera, renderer,
    get fps() { return fpsShown; },
    get planeCount() { return planeObjs.size; },
    get selectedId() { return selected3dId; },
    get visiblePlaneCount() { return [...planeObjs.values()].filter(g => g.visible).length; },
    /** Test 1: 3D dünya konumu — motor koordinatıyla karşılaştırılır */
    worldPosOf(id) {
      const g = planeObjs.get(id);
      if (!g) return null;
      return { x: g.position.x, y: g.position.y, z: g.position.z };
    },
  };

  console.log('[SKY3D] İstanbul Havalimanı (LTFM) geometrisi kodla üretildi — 5 pist, 4 kule, hazır sahne indirilmedi.');
})();
