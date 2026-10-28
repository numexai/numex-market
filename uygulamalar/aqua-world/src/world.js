import * as THREE from 'three';

/* --------------------------------------------------------------------------
   Numex Aqua World — dünya inşası
   Her şey kodla üretiliyor: doku yok, model yok, görsel yok.
   -------------------------------------------------------------------------- */

export const CITIES = [
  {
    id: 'merkez',
    name: 'Merkez Kubbe',
    sub: 'Yönetim & Yaşam',
    desc: 'Şehrin kalbi. Konsey kulesi, yaşam blokları ve liman girişi tek bir cam zarın altında toplanır.',
    pop: '12.400',
    depth: '240 m',
    state: 'Aktif',
    pos: new THREE.Vector3(0, 0, 0),
    radius: 26,
    tone: 0x5fe4ff,
    height: 30
  },
  {
    id: 'bahce',
    name: 'Mercan Bahçesi',
    sub: 'Tarım & Biyoteknoloji',
    desc: 'Deniz yosunu seraları ve canlı mercan istasyonları. Şehrin oksijeninin üçte biri burada üretilir.',
    pop: '3.100',
    depth: '268 m',
    state: 'Aktif',
    pos: new THREE.Vector3(-72, 0, 22),
    radius: 19,
    tone: 0x7dffc4,
    height: 23
  },
  {
    id: 'sanayi',
    name: 'Derin Sanayi Kubbesi',
    sub: 'Enerji & Üretim',
    desc: 'Jeotermal bacalar ve akıntı türbinleri. Kubbenin camı, içerideki basınç farkı yüzünden sürekli hafifçe titreşir.',
    pop: '2.600',
    depth: '291 m',
    state: 'Aktif',
    pos: new THREE.Vector3(54, 0, -64),
    radius: 17,
    tone: 0xffa657,
    height: 21
  },
  {
    id: 'rasat',
    name: 'Derin Rasathane',
    sub: 'Araştırma',
    desc: 'Şehrin en derin noktası. Tünellerin, karanlık suyun içinden süzülen biyolüminesans izlerini ölçer.',
    pop: '740',
    depth: '312 m',
    state: 'Gözetimde',
    pos: new THREE.Vector3(6, 0, 82),
    radius: 15,
    tone: 0xb78bff,
    height: 19
  }
];

/* --- küçük yardımcılar ---------------------------------------------------- */

function rand(a, b) { return a + Math.random() * (b - a); }

// deterministik gürültü (deniz tabanı için)
function noise2(x, z) {
  const s = Math.sin(x * 0.37 + Math.cos(z * 0.21) * 2.1) * Math.cos(z * 0.29 - Math.sin(x * 0.17) * 1.7);
  const s2 = Math.sin(x * 0.11 - z * 0.13) * 0.6;
  return (s + s2) / 1.6;
}

export function terrainHeight(x, z) {
  let h = noise2(x * 0.9, z * 0.9) * 7.2 + noise2(x * 3.1, z * 3.1) * 1.6;
  // kubbe altlarını düzleştir
  for (const c of CITIES) {
    const d = Math.hypot(x - c.pos.x, z - c.pos.z);
    const flat = THREE.MathUtils.smoothstep(d, c.radius * 0.85, c.radius * 2.3);
    h *= flat;
  }
  return h - 34;
}

/* --- deniz tabanı --------------------------------------------------------- */

function makeSeabed() {
  const geo = new THREE.PlaneGeometry(620, 620, 190, 190);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position;
  const colors = [];
  const sand = new THREE.Color(0x1b3a48);
  const deep = new THREE.Color(0x050f18);
  const tint = new THREE.Color();

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    const h = terrainHeight(x, z);
    pos.setY(i, h);
    const t = THREE.MathUtils.clamp((h + 42) / 18, 0, 1);
    tint.copy(deep).lerp(sand, t * t);
    // hafif benek
    const n = 0.86 + Math.random() * 0.28;
    colors.push(tint.r * n, tint.g * n, tint.b * n);
  }
  geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geo.computeVertexNormals();

  const mat = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 1.0,
    metalness: 0.0,
    flatShading: false
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.receiveShadow = true;
  mesh.name = 'deniz_tabani';
  return mesh;
}

/* --- cam kubbe ------------------------------------------------------------ */

function makeDome(city) {
  const g = new THREE.Group();
  g.position.copy(city.pos);

  const R = city.radius;
  const domeH = city.height;

  // cam zar (kubbe = yarım küre, ölçekle yükseltilmiş)
  const shellGeo = new THREE.SphereGeometry(R, 48, 32, 0, Math.PI * 2, 0, Math.PI / 2);
  const shellMat = new THREE.MeshPhysicalMaterial({
    color: 0x9ad8f5,
    transparent: true,
    opacity: 0.30,
    roughness: 0.10,
    metalness: 0.15,
    transmission: 0,
    side: THREE.DoubleSide,
    depthWrite: false,
    clearcoat: 1,
    clearcoatRoughness: 0.06,
    sheen: 1,
    sheenColor: new THREE.Color(0x8fe6ff)
  });
  const shell = new THREE.Mesh(shellGeo, shellMat);
  // Yarım küreyi y ekseninde büyüt: taban Y=0'da kalır, tepe domeH olur.
  // (Taban halkası ve iç zemin de aynı ölçeğe uyar.)
  shell.scale.y = domeH / R;
  shell.renderOrder = 4;
  g.add(shell);

  // kubbenin ALT gövdesi: yarım küre tek başına havada durur, tabanı deniz
  // tabanına kadar inen kısa bir silindir eklenir (cam eteği).
  const skirtH = Math.max(1.5, 3.2);
  const skirtGeo = new THREE.CylinderGeometry(R, R * 1.02, skirtH, 48, 1, true);
  const skirt = new THREE.Mesh(skirtGeo, shellMat);
  skirt.position.y = -skirtH / 2 + 0.05;
  skirt.renderOrder = 4;
  g.add(skirt);

  // çatı ışığı halkaları (kubbenin kaburgaları)
  const ribMat = new THREE.MeshStandardMaterial({
    color: 0x8fe9ff,
    emissive: new THREE.Color(city.tone),
    emissiveIntensity: 0.9,
    roughness: 0.4,
    metalness: 0.6
  });
  const meridianCount = 16;
  for (let m = 0; m < meridianCount; m++) {
    const curve = new THREE.EllipseCurve(0, 0, 1, 1);
    const pts = [];
    const a = (m / meridianCount) * Math.PI * 2;
    for (let i = 0; i <= 18; i++) {
      const phi = (i / 18) * (Math.PI / 2);
      pts.push(new THREE.Vector3(
        Math.cos(phi) * R * Math.cos(a),
        Math.sin(phi) * domeH,
        Math.cos(phi) * R * Math.sin(a)
      ));
    }
    const curveGeo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 24, 0.12, 5, false);
    g.add(new THREE.Mesh(curveGeo, ribMat));
    void curve;
  }

  // taban halkası
  const ringGeo = new THREE.TorusGeometry(R, 0.55, 10, 96);
  ringGeo.rotateX(Math.PI / 2);
  const ring = new THREE.Mesh(ringGeo, new THREE.MeshStandardMaterial({
    color: 0x0d2b3c, roughness: 0.5, metalness: 0.8,
    emissive: new THREE.Color(city.tone), emissiveIntensity: 0.25
  }));
  g.add(ring);

  // ışıklı dış halka (uzaktan görünen halo)
  const haloGeo = new THREE.TorusGeometry(R * 1.02, 0.18, 6, 96);
  haloGeo.rotateX(Math.PI / 2);
  const halo = new THREE.Mesh(haloGeo, new THREE.MeshBasicMaterial({
    color: city.tone, transparent: true, opacity: 0.8
  }));
  halo.position.y = 0.5;
  g.add(halo);

  // --- içindeki binalar ---
  const inner = new THREE.Group();
  const towerMat = new THREE.MeshStandardMaterial({
    color: 0x27566e, roughness: 0.42, metalness: 0.6,
    emissive: new THREE.Color(0x123a50), emissiveIntensity: 1.1
  });
  const windowMat = new THREE.MeshBasicMaterial({ color: 0xffe2b0, transparent: true, opacity: 0.95 });
  const windowMatCool = new THREE.MeshBasicMaterial({ color: 0x9cefff, transparent: true, opacity: 0.92 });

  const towerCount = city.id === 'merkez' ? 16 : 9;
  for (let i = 0; i < towerCount; i++) {
    const central = i === 0;
    const dist = central ? 0 : rand(R * 0.16, R * 0.68);
    const ang = central ? 0 : rand(0, Math.PI * 2);
    const bx = Math.cos(ang) * dist;
    const bz = Math.sin(ang) * dist;
    const h = central ? domeH * 0.66 : rand(domeH * 0.16, domeH * 0.46);
    const w = central ? R * 0.14 : rand(1.5, 3.6);

    const bodyGeo = central
      ? new THREE.CylinderGeometry(w * 0.5, w, h, 8)
      : new THREE.BoxGeometry(w, h, w * rand(0.8, 1.4));
    const body = new THREE.Mesh(bodyGeo, towerMat);
    body.position.set(bx, h / 2, bz);
    body.castShadow = true;
    inner.add(body);

    // pencereler: ince parlak şeritler
    const stripes = Math.max(2, Math.floor(h / 2.4));
    for (let s = 0; s < stripes; s++) {
      const y = 1.2 + s * (h - 2) / stripes;
      if (y > h - 0.6) break;
      const wm = Math.random() > 0.35 ? windowMat : windowMatCool;
      const strip = new THREE.Mesh(new THREE.BoxGeometry(w * 1.02, 0.16, w * 0.35), wm);
      strip.position.set(bx, y, bz + w * 0.55);
      strip.rotation.y = Math.atan2(bx, bz);
      strip.position.x = bx + Math.sin(strip.rotation.y) * w * 0.55;
      strip.position.z = bz + Math.cos(strip.rotation.y) * w * 0.55;
      inner.add(strip);
    }

    // yanıp sönen tepe ışığı
    if (h > domeH * 0.3) {
      const lampMat = new THREE.MeshBasicMaterial({ color: city.tone });
      const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 8), lampMat);
      lamp.position.set(bx, h + 0.4, bz);
      lamp.userData.blink = rand(0.5, 2.5);
      inner.add(lamp);
    }
  }

  // iç zemin platformu
  const floorGeo = new THREE.CircleGeometry(R * 0.92, 48);
  floorGeo.rotateX(-Math.PI / 2);
  const floor = new THREE.Mesh(floorGeo, new THREE.MeshStandardMaterial({
    color: 0x123243, roughness: 0.7, metalness: 0.4
  }));
  floor.position.y = 0.12;
  inner.add(floor);

  // iç ışık (kubbenin kendi ferahlığı)
  const glow = new THREE.PointLight(city.tone, 46, R * 3.2, 2);
  glow.position.set(0, domeH * 0.45, 0);
  inner.add(glow);

  g.add(inner);

  g.userData.glows = [glow];
  g.userData.city = city;
  g.userData.pickTarget = shell;
  shell.userData.cityId = city.id;

  return g;
}

/* --- tünel ---------------------------------------------------------------- */

function makeTunnel(from, to, tone) {
  // NUMEX-DÜZELTME (2026-10-28): Tüneller havada asılı kalıyordu: uç yükseklikleri sabit 5.5 yazılmış, oysa kubbe kenarı ile deniz tabanı arasında yükseklik farkı var. Kök: uç yüksekliği sabit değil, altındaki zeminden türetilmeli.
  // Tünel kubbe yüzeyinden DENİZ TABANINA iner: uçların yüksekliği verilmez,
  // her ucun altındaki zemin ölçüsünden türetilir. Böylece tünel havada asılı kalmaz.
  const start = from.clone();
  const end = to.clone();
  start.y = terrainHeight(start.x, start.z) + 4.2;
  end.y = terrainHeight(end.x, end.z) + 4.2;
  const dist = start.distanceTo(end);
  const mid = start.clone().add(end).multiplyScalar(0.5);
  // aradaki yükselti: tünel zemine sürtünmesin, dibe de gömülmesin
  const groundMid = terrainHeight(mid.x, mid.z);
  mid.y = Math.max(start.y, end.y) + 2.2;
  // zemin tümseği tünelin üstüne çıkıyorsa kavisi yükselt
  if (mid.y < groundMid + 3.5) mid.y = groundMid + 3.5;

  const curve = new THREE.CatmullRomCurve3([start, mid, end]);
  const group = new THREE.Group();

  // şeffaf tüp — segment sayısı eğri uzunluğuna göre (boğum boğum görünmesin)
  const tubeSegments = Math.max(24, Math.round(dist * 1.6));
  const tubeGeo = new THREE.TubeGeometry(curve, tubeSegments, 2.1, 16, false);
  // transmission KULLANILMIYOR: arka planı olmayan sahnede şeffaf yüzeyi tamamen
  // yutuyordu (cam yok oluyordu). Onun yerine görünür bir camsı zar.
  const tubeMat = new THREE.MeshPhysicalMaterial({
    color: 0xbdeaff, transparent: true, opacity: 0.34, roughness: 0.06,
    metalness: 0.2, side: THREE.DoubleSide, depthWrite: false,
    clearcoat: 1, clearcoatRoughness: 0.04,
    sheen: 1, sheenColor: new THREE.Color(0x9fe8ff)
  });
  const tube = new THREE.Mesh(tubeGeo, tubeMat);
  tube.renderOrder = 3;
  group.add(tube);

  // içinden geçen ışık çizgisi
  const lineGeo = new THREE.TubeGeometry(curve, tubeSegments, 0.13, 6, false);
  group.add(new THREE.Mesh(lineGeo, new THREE.MeshBasicMaterial({ color: tone, transparent: true, opacity: 0.85 })));

  // halka destekleri
  const ringMat = new THREE.MeshStandardMaterial({
    color: 0x1b4356, roughness: 0.4, metalness: 0.8,
    emissive: new THREE.Color(tone), emissiveIntensity: 0.18
  });
  const count = Math.max(4, Math.floor(dist / 8));
  const ringGeo = new THREE.TorusGeometry(2.2, 0.14, 6, 18);
  for (let i = 1; i < count; i++) {
    const t = i / count;
    const p = curve.getPointAt(t);
    const tan = curve.getTangentAt(t);
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.position.copy(p);
    ring.lookAt(p.clone().add(tan));
    group.add(ring);
  }

  // taşıyıcı ayaklar — tünel rengini ALMAZ: koyu, nötr metal
  const legMat = new THREE.MeshStandardMaterial({
    color: 0x2a5468, roughness: 0.68, metalness: 0.5,
    emissive: new THREE.Color(0x0e2a38), emissiveIntensity: 1
  });
  for (let i = 1; i < count; i += 2) {
    const t = i / count;
    const p = curve.getPointAt(t);
    // kubbenin ALTINDA veya ÜSTÜNDEN geçen noktada ayak kurma:
    // kubbe bir yarım küre; o x/z'de kubbenin yüzey yüksekliği hesaba katılır
    let blocked = false;
    for (const c of CITIES) {
      const d = Math.hypot(p.x - c.pos.x, p.z - c.pos.z);
      if (d >= c.radius * 1.15) continue;
      // o noktadaki kubbe yüzeyi (elipsoid)
      const rr = Math.min(1, d / c.radius);
      const domeTop = Math.sqrt(Math.max(0, 1 - rr * rr)) * c.height;
      // ayak kubbenin içinden ya da üstünden geçiyorsa kurma
      if (p.y < domeTop + 3) { blocked = true; break; }
    }
    if (blocked) continue;

    const ground = terrainHeight(p.x, p.z);
    // NUMEX-DÜZELTME (2026-10-28): Ayaklar hiç görünmüyordu: tünel zemine indirildikten sonra ayak yüksekliği 4.2 birime düştü, filtre ise h<=6 istiyordu; yani her ayak eleniyordu. Eşik gerçek geometriye (1.2) çekildi; eski yan payanda da iki kat artıklık yarattığı için kaldırıldı.
    const legHeight = p.y - 2.0 - ground;
    // tünel zemine değiyorsa zaten ayak gerekmez (çok kısa ayak kurma)
    if (legHeight < 1.2) continue;

    // payanda: tünelin alt yüzeyinden başlar, dışa açılarak yere iner
    const legTop = new THREE.Vector3(p.x, p.y - 2.0, p.z);
    const groundP = new THREE.Vector3(p.x, ground + 0.15, p.z);

    // ANA AYAK: tepesi tünelin altına oturan eğik gövde
    const legLen = legTop.distanceTo(groundP);
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.86, legLen, 8), legMat);
    leg.position.copy(legTop).lerp(groundP, 0.5);
    leg.quaternion.setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      groundP.clone().sub(legTop).normalize()
    );
    group.add(leg);

    // ayağın dibinde küçük bir kaide (tek hafif ışıklı nokta)
    const base = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.5, 0.5, 8), legMat);
    base.position.set(p.x, ground + 0.02, p.z);
    group.add(base);
    const beacon = new THREE.Mesh(
      new THREE.SphereGeometry(0.16, 6, 6),
      new THREE.MeshBasicMaterial({ color: tone, transparent: true, opacity: 0.45 })
    );
    beacon.position.set(p.x, ground + 0.42, p.z);
    group.add(beacon);
  }

  return group;
}

/* --- mercan & bitki ------------------------------------------------------- */

function makeCoralCluster(count, spread, opt = {}) {
  const group = new THREE.Group();
  // deniz altında mercan bu kadar canlı olmaz: doygunluğu düşük, toprak tonlu palet
  const palettes = [0xc75f7a, 0xd08a58, 0x8d6fb8, 0x4fb8a4, 0xd9b96a, 0xc06a94];
  const inner = opt.innerRadius ?? 0;
  const center = opt.center;

  for (let i = 0; i < count; i++) {
    const ang = Math.random() * Math.PI * 2;
    const dist = inner + Math.pow(Math.random(), 0.7) * Math.max(1, spread - inner);
    // her öbek 3-6 parçadan oluşur ve birbirine değer (tek başına şeker gibi durmaz)
    const clusterN = 3 + ((Math.random() * 4) | 0);
    const cx0 = (center ? center.x : 0) + Math.cos(ang) * dist;
    const cz0 = (center ? center.z : 0) + Math.sin(ang) * dist;
    const cAng = Math.random() * Math.PI * 2;
    const cSpread = rand(1.0, 2.4);
    for (let ci = 0; ci < clusterN; ci++) {
    const ox = Math.cos(cAng) * cSpread * (ci / clusterN) + rand(-0.5, 0.5);
    const oz = Math.sin(cAng) * cSpread * (ci / clusterN) + rand(-0.5, 0.5);
    const x = cx0 + ox;
    const z = cz0 + oz;
    const y = terrainHeight(x, z);
    const color = palettes[(Math.random() * palettes.length) | 0];
    const mat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(color).lerp(new THREE.Color(0x2a5060), 0.62),
      roughness: 0.92, metalness: 0.02, flatShading: true,
      emissive: new THREE.Color(color).multiplyScalar(0.05)
    });

    const kind = Math.random();
    if (kind < 0.34) {
      // dallanan mercan: birkaç silindir
      const branches = 3 + ((Math.random() * 4) | 0);
      const base = new THREE.Group();
      base.position.set(x, y, z);
      for (let b = 0; b < branches; b++) {
        const h = rand(1.6, 4.6);
        const r = rand(0.14, 0.34);
        const cyl = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.5, r, h, 6), mat);
        cyl.position.set(rand(-0.7, 0.7), h / 2, rand(-0.7, 0.7));
        cyl.rotation.z = rand(-0.42, 0.42);
        cyl.rotation.x = rand(-0.42, 0.42);
        cyl.castShadow = true;
        base.add(cyl);
      }
      group.add(base);
    } else if (kind < 0.62) {
      // beyin mercan
      const r = rand(0.9, 2.2);
      const sph = new THREE.Mesh(new THREE.SphereGeometry(r, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), mat);
      sph.position.set(x, y, z);
      sph.scale.y = rand(0.45, 0.8);
      sph.castShadow = true;
      group.add(sph);
    } else if (kind < 0.82) {
      // deniz yelpazesi
      const h = rand(2, 3.6);
      const fan = new THREE.Mesh(new THREE.CircleGeometry(h * 0.7, 10, 0, Math.PI), mat);
      fan.position.set(x, y + h * 0.45, z);
      fan.rotation.y = rand(0, Math.PI);
      fan.material.side = THREE.DoubleSide;
      group.add(fan);
    } else {
      // deniz hıyarı / küçük yumru
      const r = rand(0.5, 1.1);
      const t = new THREE.Mesh(new THREE.TorusGeometry(r, r * 0.45, 8, 12), mat);
      t.position.set(x, y + r * 0.3, z);
      t.rotation.x = Math.PI / 2.4;
      group.add(t);
    }
    } // ci döngüsü sonu
  }
  return group;
}

function makeSeagrass(count, spread, opt = {}) {
  const group = new THREE.Group();
  const inner = opt.innerRadius ?? 0;
  const center = opt.center;
  const geo = new THREE.PlaneGeometry(0.55, 1, 1, 4);
  // yaprağın ucuna doğru incelmesi için tepe köşelerini daralt
  {
    const p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const t = (p.getY(i) + 0.5); // 0..1
      p.setX(i, p.getX(i) * (1 - t * 0.55));
    }
    geo.computeVertexNormals();
  }
  geo.translate(0, 0.5, 0);

  for (let i = 0; i < count; i++) {
    const ang = Math.random() * Math.PI * 2;
    const dist = inner + Math.pow(Math.random(), 0.6) * Math.max(1, spread - inner);
    const x = (center ? center.x : 0) + Math.cos(ang) * dist;
    const z = (center ? center.z : 0) + Math.sin(ang) * dist;
    const y = terrainHeight(x, z);
    const h = rand(2, 6.5);
    // doğal deniz çayırı: soluk, grimsi yeşil (neon değil)
    const col = new THREE.Color().setHSL(rand(0.26, 0.36), rand(0.22, 0.38), rand(0.10, 0.18));

    const bladeMat = new THREE.MeshStandardMaterial({
      color: col, roughness: 0.95, side: THREE.DoubleSide,
      emissive: col.clone().multiplyScalar(0.05)
    });
    // NUMEX-DÜZELTME (2026-10-28): Yosunu hacimli göstermek için eklenen ikinci kanat gruba eklenmemiş, döndürme de yanlış nesneye (blade) uygulanıyordu — yapraklar hâlâ ince çizgi görünüyordu. Kök: konum/ölçek/rotasyon stem grubuna taşınmalı ve her iki kanat grubun içinde kalmalı.
    // hacim: iki kanat 90° çapraz → ince neon çizgi yerine tutam
    const blade = new THREE.Mesh(geo, bladeMat);
    const blade2 = new THREE.Mesh(geo, bladeMat);
    blade2.rotation.y = Math.PI / 2;
    const stem = new THREE.Group();
    stem.add(blade, blade2);
    stem.position.set(x, y, z);
    stem.scale.set(rand(0.7, 1.4), h, 1);
    stem.rotation.y = Math.random() * Math.PI;
    stem.userData.sway = rand(0.6, 1.7);
    stem.userData.phase = Math.random() * Math.PI * 2;
    stem.userData.baseRot = 0;
    group.add(stem);
  }
  return group;
}

function makeRocks(count, spread) {
  const group = new THREE.Group();
  for (let i = 0; i < count; i++) {
    const ang = Math.random() * Math.PI * 2;
    const dist = Math.pow(Math.random(), 0.5) * spread;
    const x = Math.cos(ang) * dist;
    const z = Math.sin(ang) * dist;
    const y = terrainHeight(x, z);
    const r = rand(1.4, 5.4);
    const geo = new THREE.IcosahedronGeometry(r, 1);
    // köşeleri boz (kaya görünümü)
    const p = geo.attributes.position;
    for (let v = 0; v < p.count; v++) {
      p.setXYZ(v,
        p.getX(v) * rand(0.75, 1.25),
        p.getY(v) * rand(0.55, 1.0),
        p.getZ(v) * rand(0.75, 1.25));
    }
    geo.computeVertexNormals();
    const shade = rand(0.05, 0.14);
    const rock = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({
      color: new THREE.Color(shade, shade * 1.25, shade * 1.5),
      roughness: 0.95, metalness: 0.05, flatShading: true
    }));
    rock.position.set(x, y + r * 0.28, z);
    rock.rotation.set(rand(0, 0.4), rand(0, Math.PI * 2), rand(0, 0.4));
    rock.castShadow = true;
    rock.receiveShadow = true;
    group.add(rock);
  }
  return group;
}

/* --- dışa açılan kurucu --------------------------------------------------- */

export function buildWorld(scene) {
  const world = new THREE.Group();
  scene.add(world);

  const seabed = makeSeabed();
  world.add(seabed);

  // kayalar (şehrin dışına, uzak siluetler)
  world.add(makeRocks(58, 260));

  // şehir çevresinde orta mesafe kaya adaları (taban boş kalmasın)
  world.add(makeRocks(34, 175));

  // kubbeler
  const domes = [];
  for (const city of CITIES) {
    const dome = makeDome(city);
    world.add(dome);
    domes.push(dome);

    // her kubbenin DIŞ çevresine mercan + yosun (kubbenin altı boş kalır)
    const ring = (spread, inner) => {
      // halka biçiminde konum: kubbenin altında hiç öbek olmasın
      const a = Math.random() * Math.PI * 2;
      const d = rand(inner, spread);
      return { x: city.pos.x + Math.cos(a) * d, z: city.pos.z + Math.sin(a) * d };
    };

    const coral = makeCoralCluster(26, city.radius * 1.9, {
      innerRadius: city.radius * 1.05,
      center: city.pos
    });
    world.add(coral);

    const grass = makeSeagrass(110, city.radius * 2.4, {
      innerRadius: city.radius * 1.05,
      center: city.pos
    });
    world.add(grass);
    world.userData.grass = world.userData.grass || [];
    world.userData.grass.push(grass);
    void ring;
  }

  // tüneller (merkez ↔ her kubbe + çevre bağlantısı)
  const merkez = CITIES[0];
  for (let i = 1; i < CITIES.length; i++) {
    const c = CITIES[i];
    const from = merkez.pos.clone();
    const to = c.pos.clone();
    // kubbe yüzeyinden başlat
    const dir = to.clone().sub(from).normalize();
    const startP = from.clone().add(dir.multiplyScalar(merkez.radius * 0.92));
    const dir2 = from.clone().sub(to).normalize();
    const endP = to.clone().add(dir2.multiplyScalar(c.radius * 0.92));
    world.add(makeTunnel(startP, endP, c.tone));
  }
  // çevre halkası: bahçe ↔ sanayi ↔ rasat
  world.add(makeTunnel(
    CITIES[1].pos.clone().add(new THREE.Vector3(0, 0, 0)),
    CITIES[2].pos.clone(),
    0x6fe0d0
  ));
  world.add(makeTunnel(
    CITIES[2].pos.clone(),
    CITIES[3].pos.clone(),
    0x8f7dff
  ));

  // uzak silüetler: karanlıkta kaybolan dev kaya sırtları
  const ridgeMat = new THREE.MeshStandardMaterial({ color: 0x061420, roughness: 1, metalness: 0 });
  for (let i = 0; i < 18; i++) {
    const ang = (i / 18) * Math.PI * 2 + rand(-0.15, 0.15);
    const dist = rand(235, 315);
    const r = rand(22, 50);
    // piramit değil, kütleli kaya sırtı: düşük ve geniş ikosahedron
    const geo = new THREE.IcosahedronGeometry(r, 1);
    {
      const p = geo.attributes.position;
      for (let v = 0; v < p.count; v++) {
        p.setXYZ(v, p.getX(v) * rand(0.9, 1.5), p.getY(v) * rand(0.35, 0.7), p.getZ(v) * rand(0.9, 1.5));
      }
      geo.computeVertexNormals();
    }
    const ridge = new THREE.Mesh(geo, ridgeMat);
    ridge.position.set(Math.cos(ang) * dist, terrainHeight(Math.cos(ang) * dist, Math.sin(ang) * dist) + r * 0.4, Math.sin(ang) * dist);
    ridge.rotation.y = rand(0, Math.PI);
    world.add(ridge);
  }

  return { world, domes, seabed };
}
