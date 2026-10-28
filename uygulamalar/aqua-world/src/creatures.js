import * as THREE from 'three';

/* --------------------------------------------------------------------------
   Canlılar: balık sürüleri, vatozlar, denizaltılar
   Balık gövdesi bir kez üretilen geometriden klonlanıyor (InstancedMesh yerine
   ayrı Mesh: kuyruk salınımı için her birinin kendi matrisi gerekiyor).
   -------------------------------------------------------------------------- */

function rand(a, b) { return a + Math.random() * (b - a); }

/* --- balık gövdesi -------------------------------------------------------- */

function makeFishGeometry() {
  // yassı, iğ biçimli gövde: lathe ile üretilip y ekseninde yassılaştırılıyor
  const pts = [];
  const N = 9;
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    // baş: kalın, kuyruğa doğru incelir
    const r = Math.sin(Math.pow(t, 0.62) * Math.PI) * 0.5 + 0.02;
    pts.push(new THREE.Vector2(Math.max(0.02, r * (1 - t * 0.62)), (t - 0.5) * 2.2));
  }
  const geo = new THREE.LatheGeometry(pts, 10);
  geo.rotateX(Math.PI / 2);
  // balık YASƛI olmalı: y ekseninde ince (gövde yüksekliği), x'te geniş
  geo.scale(0.50, 0.95, 1.0);
  return geo;
}

function makeTailGeometry() {
  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  shape.lineTo(0.85, 0.62);
  shape.lineTo(1.12, 0);
  shape.lineTo(0.85, -0.62);
  shape.lineTo(0, 0);
  const geo = new THREE.ShapeGeometry(shape);
  geo.rotateY(Math.PI / 2);
  return geo;
}

const FISH_GEO = makeFishGeometry();
const TAIL_GEO = makeTailGeometry();

export class School {
  /**
   * @param {Object} opt
   * @param {THREE.Vector3} opt.center sürünün dolaştığı merkez
   * @param {number} opt.radius dolaşma yarıçapı
   * @param {number} opt.count balık sayısı
   * @param {number} opt.color renk
   * @param {number} opt.size balık boyu (m)
   */
  constructor(opt) {
    this.center = opt.center.clone();
    this.radius = opt.radius;
    this.count = opt.count;
    this.time = Math.random() * 100;
    this.speed = opt.speed ?? 1;

    this.group = new THREE.Group();
    this.fish = [];

    const bodyMat = new THREE.MeshStandardMaterial({
      color: opt.color,
      roughness: 0.35,
      metalness: 0.55,
      emissive: new THREE.Color(opt.color).multiplyScalar(opt.glow ?? 0.12),
      side: THREE.DoubleSide,
      flatShading: false
    });
    const tailMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(opt.color).multiplyScalar(0.75),
      roughness: 0.5, metalness: 0.3, side: THREE.DoubleSide,
      transparent: true, opacity: 0.9
    });

    const size = (opt.size ?? 1) * 1.35;

    for (let i = 0; i < this.count; i++) {
      const fish = new THREE.Group();

      const body = new THREE.Mesh(FISH_GEO, bodyMat);
      body.scale.setScalar(size * rand(0.85, 1.15));
      fish.add(body);

      const tail = new THREE.Mesh(TAIL_GEO, tailMat);
      tail.scale.setScalar(size * 0.85);
      tail.position.z = -size * 0.86;
      fish.add(tail);

      // yüzgeç çizgisi (çok hafif parlayan)
      const dorsalGeo = new THREE.PlaneGeometry(0.1, size * 0.9);
      const dorsal = new THREE.Mesh(dorsalGeo, tailMat);
      dorsal.position.set(0, size * 0.34, 0);
      dorsal.rotation.y = Math.PI / 2;
      fish.add(dorsal);

      fish.userData = {
        tail,
        // sürü içi konum
        off: new THREE.Vector3(rand(-1, 1), rand(-1, 1), rand(-1, 1)).multiplyScalar(opt.spread ?? 7),
        phase: Math.random() * Math.PI * 2,
        wobble: rand(0.5, 1.4),
        lookAt: new THREE.Vector3()
      };
      this.group.add(fish);
      this.fish.push(fish);
    }
  }

  update(dt, t) {
    this.time += dt * this.speed;
    const T = this.time;

    // sürünün kendisi büyük bir yörüngede dolaşır
    const cx = this.center.x + Math.cos(T * 0.19) * this.radius;
    const cz = this.center.z + Math.sin(T * 0.23) * this.radius;
    const cy = this.center.y + Math.sin(T * 0.31) * this.radius * 0.22;

    // akış yönü (türevden)
    const dirX = -Math.sin(T * 0.19) * 0.19 * this.radius;
    const dirZ = Math.cos(T * 0.23) * 0.23 * this.radius;
    const heading = Math.atan2(dirX, dirZ);

    for (let i = 0; i < this.fish.length; i++) {
      const f = this.fish[i];
      const u = f.userData;

      // sürü içinde yumuşak salınım
      const ox = Math.sin(T * 1.4 + u.phase) * 1.6 + u.off.x;
      const oy = Math.sin(T * 1.1 + u.phase * 1.7) * 1.2 + u.off.y * 0.6;
      const oz = Math.cos(T * 1.3 + u.phase * 0.8) * 1.6 + u.off.z;

      f.position.set(cx + ox, cy + oy, cz + oz);

      // bakış yönü: sürünün gidişi + hafif kişisel sapma
      u.lookAt.set(
        f.position.x + Math.sin(heading) * 4 + Math.cos(T * u.wobble + u.phase) * 1.2,
        f.position.y + Math.sin(T * 2.1 + u.phase) * 0.5,
        f.position.z + Math.cos(heading) * 4
      );
      f.lookAt(u.lookAt);

      // kuyruk salınımı
      u.tail.rotation.y = Math.sin(T * 9 + u.phase) * 0.55;

      // hafif gövde yalpası
      f.rotateZ(Math.sin(T * 5 + u.phase) * 0.09);
    }
  }
}

/* --- vatoz: büyük, süzülen gövde ------------------------------------------ */

export class Ray {
  constructor(center, radius, color = 0x2c6f8a) {
    this.center = center.clone();
    this.radius = radius;
    this.t = Math.random() * 10;

    const group = new THREE.Group();

    // kanat: öne doğru SİVRİLEN, arkaya doğru daralan gerçek vatoz silueti
    // (önceki sürüm elipsti → tabak gibi görünüyordu)
    const shape = new THREE.Shape();
    shape.moveTo(0, 2.1);                       // burun (önde, sivri)
    shape.bezierCurveTo(1.5, 1.6, 2.6, 0.7, 3.1, 0.1);   // sağ kanat ön kenarı
    shape.bezierCurveTo(2.4, -0.5, 1.2, -1.1, 0.75, -1.7); // sağ kanat arka kenarı
    shape.bezierCurveTo(0.4, -2.0, -0.4, -2.0, -0.75, -1.7);
    shape.bezierCurveTo(-1.2, -1.1, -2.4, -0.5, -3.1, 0.1);
    shape.bezierCurveTo(-2.6, 0.7, -1.5, 1.6, 0, 2.1);
    // HACİMLİ gövde: düz levha değil, ince bir mercek.
    // Shape'i extrude edip kalınlık veriyoruz, sonra kenarları inceltiyoruz.
    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: 0.42, bevelEnabled: true, bevelSize: 0.16,
      bevelThickness: 0.14, bevelSegments: 2, curveSegments: 18
    });
    geo.rotateX(-Math.PI / 2);
    geo.translate(0, 0.21 * 0, -0.21);
    // sırt kubbesi + kenar inceltme
    {
      const p = geo.attributes.position;
      for (let i = 0; i < p.count; i++) {
        const x = p.getX(i), z = p.getZ(i);
        const r = Math.min(1, Math.hypot(x / 3.1, z / 2.1));
        p.setY(i, p.getY(i) * (1 - r * 0.85) + (1 - r * r) * 0.85);
      }
      geo.computeVertexNormals();
    }

    // vatoz karanlıkta kaybolmasın: açık gövde + altında yumuşak parıltı
    const mat = new THREE.MeshStandardMaterial({
      color: 0x8fb6c4, roughness: 0.7, metalness: 0.1, side: THREE.DoubleSide,
      emissive: new THREE.Color(0x1d4c5c), emissiveIntensity: 1.1,
      transparent: true, opacity: 0.96, flatShading: false
    });
    this.wing = new THREE.Mesh(geo, mat);
    // NUMEX-DÜZELTME (2026-10-28): Vatoz düz tabak gibi görünüyordu: gövde yalnızca 0.42 kalınlıkta extrude edilip 2.4 kat genişletiliyordu (en/boy oranı 10:1). Kök: hacim veren asıl parça eksikti ve kanat ölçeği aşırıydı.
    this.wing.scale.setScalar(1.55);
    group.add(this.wing);

    // gövde: kanatların birleştiği kalın sırt. Disk görünümünü kıran asıl parça bu —
    // öne doğru uzanan, yandan bakınca hacim veren bir gövde.
    const bodyGeo = new THREE.SphereGeometry(1, 16, 12);
    bodyGeo.scale(0.85, 0.62, 2.3);
    const body = new THREE.Mesh(bodyGeo, mat);
    body.position.set(0, 0.18, 0.15);
    group.add(body);

    // kanat uçları: iki yanda ince, kıvrık uçlar (levha hissini kırar)
    for (const side of [-1, 1]) {
      const tipGeo = new THREE.SphereGeometry(1, 12, 8);
      tipGeo.scale(1.15, 0.22, 1.5);
      const tip = new THREE.Mesh(tipGeo, mat);
      tip.position.set(side * 2.5, 0.06, -0.4);
      tip.rotation.z = side * 0.32;
      group.add(tip);
    }

    // kuyruk
    const tailGeo = new THREE.CylinderGeometry(0.06, 0.02, 5.5, 6);
    tailGeo.rotateX(Math.PI / 2);
    const tail = new THREE.Mesh(tailGeo, mat);
    tail.position.z = -6.5;
    group.add(tail);

    group.scale.setScalar(0.62);
    this.thick = 1.0;

    // gövdenin altında yumuşak parıltı (karanlıkta nerede olduğu görülsün)
    const halo = new THREE.Mesh(
      new THREE.CircleGeometry(2.6, 24),
      new THREE.MeshBasicMaterial({
        color: 0x63c8e0, transparent: true, opacity: 0.09,
        blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide
      })
    );
    halo.rotation.x = -Math.PI / 2;
    halo.position.y = -0.35;
    group.add(halo);
    this.halo = halo;

    // sırt ışığı
    const dotMat = new THREE.MeshBasicMaterial({ color: 0x7fe9ff, transparent: true, opacity: 0.8 });
    for (let i = 0; i < 5; i++) {
      const d = new THREE.Mesh(new THREE.SphereGeometry(0.08, 6, 6), dotMat);
      d.position.set(rand(-1.4, 1.4), 0.06, rand(-1, 1.2));
      group.add(d);
    }

    this.group = group;
    this.spin = rand(0.1, 0.25);
  }

  update(dt, t) {
    this.t += dt;
    const T = this.t;
    const x = this.center.x + Math.cos(T * 0.13) * this.radius;
    const z = this.center.z + Math.sin(T * 0.17) * this.radius;
    const y = this.center.y + Math.sin(T * 0.29) * 5;

    this.group.position.set(x, y, z);
    // gövde ileri baksın: tepe (burun) +z yönünde kalacak şekilde
    this.group.rotation.y = Math.atan2(-Math.sin(T * 0.13), Math.cos(T * 0.17));
    this.group.rotation.x = 0;
    // kanat çırpma (yukarı-aşağı esneme)
    this.wing.scale.set(
      2.4 + Math.sin(T * 1.9) * 0.18,
      1 + Math.sin(T * 1.9) * 0.35,
      2.4 + Math.sin(T * 1.9) * 0.18
    );
    this.group.rotation.z = Math.sin(T * 1.9) * 0.12;
    void t;
  }
}

/* --- denizaltı ------------------------------------------------------------ */

export class Submarine {
  constructor(cities, color = 0xffcf6b) {
    this.cities = cities;
    this.index = 1 + Math.floor(Math.random() * (cities.length - 1));
    this.prev = 0;
    this.t = 0;
    this.travel = 0;
    this.speed = rand(0.010, 0.017);

    const group = new THREE.Group();

    const hullMat = new THREE.MeshStandardMaterial({
      color: 0xdce7ee, roughness: 0.3, metalness: 0.85
    });
    const darkMat = new THREE.MeshStandardMaterial({
      color: 0x14313f, roughness: 0.45, metalness: 0.8
    });

    // gövde
    const hull = new THREE.Mesh(new THREE.CapsuleGeometry(1.1, 3.6, 8, 16), hullMat);
    hull.rotation.x = Math.PI / 2;
    group.add(hull);

    // kuyruk konisi
    const cone = new THREE.Mesh(new THREE.ConeGeometry(1.05, 1.6, 12), darkMat);
    cone.rotation.x = -Math.PI / 2;
    cone.position.z = -3.1;
    group.add(cone);

    // kokpit camı
    const glass = new THREE.Mesh(
      new THREE.SphereGeometry(0.72, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.62),
      new THREE.MeshPhysicalMaterial({
        color: 0x9ff0ff, roughness: 0.05, metalness: 0, transmission: 0.7,
        transparent: true, opacity: 0.85
      })
    );
    glass.position.set(0, 0.55, 1.5);
    glass.rotation.x = -0.25;
    group.add(glass);

    // pervaneler
    this.propellers = [];
    for (const side of [-1, 1]) {
      const pod = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.9, 10), darkMat);
      pod.rotation.z = Math.PI / 2;
      pod.position.set(side * 1.25, -0.15, -2.2);
      group.add(pod);

      const blade = new THREE.Group();
      for (let b = 0; b < 4; b++) {
        const bl = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.6, 0.16), hullMat);
        bl.rotation.x = (b / 4) * Math.PI * 2;
        bl.position.set(0, 0.3, 0);
        bl.rotation.z = 0;
        const wrap = new THREE.Group();
        wrap.rotation.x = 0;
        wrap.add(bl);
        wrap.rotation.z = (b / 4) * Math.PI * 2;
        blade.add(wrap);
      }
      blade.position.set(side * 1.25, -0.15, -2.78);
      blade.rotation.y = Math.PI / 2;
      group.add(blade);
      this.propellers.push(blade);
    }

    // far lambaları
    const lampMat = new THREE.MeshBasicMaterial({ color: 0xfff3d0 });
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.2, 10, 10), lampMat);
    lamp.position.set(0, 0.15, 2.35);
    group.add(lamp);

    this.light = new THREE.SpotLight(0xfff0c4, 90, 58, 0.42, 0.55, 1.4);
    this.light.position.set(0, 0.4, 2.4);
    this.light.target.position.set(0, -1.5, 22);
    group.add(this.light);
    group.add(this.light.target);

    // alt gövde ışıkları
    const strip = new THREE.Mesh(
      new THREE.BoxGeometry(0.16, 0.06, 3.2),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.85 })
    );
    strip.position.set(0, -1.05, 0.2);
    group.add(strip);

    group.userData.color = color;
    this.group = group;

    // yörünge noktaları (kubbelerin üstünden geçen yay)
    this.path = this.buildPath();
  }

  buildPath() {
    const a = this.cities[this.prev];
    const b = this.cities[this.index];
    // rota kubbelerin ÜSTÜNDEN geçmeli: kubbe yüksekliği + pay
    const clearance = Math.max(a.height, b.height) + 14;
    const p0 = a.pos.clone().setY(clearance);
    const p1 = b.pos.clone().setY(clearance);
    const mid = p0.clone().add(p1).multiplyScalar(0.5);
    mid.y += 12;
    this.curve = new THREE.CatmullRomCurve3([p0, mid, p1]);
    return this.curve;
  }

  update(dt, t) {
    this.t += dt * this.speed;

    if (this.t >= 1) {
      this.t = 0;
      this.prev = this.index;
      // başka bir kubbeye geç
      let next = this.index;
      while (next === this.index && this.cities.length > 1) {
        next = Math.floor(Math.random() * this.cities.length);
      }
      this.index = next;
      this.buildPath();
    }

    const p = this.curve.getPointAt(THREE.MathUtils.clamp(this.t, 0, 0.999));
    const tan = this.curve.getTangentAt(THREE.MathUtils.clamp(this.t, 0, 0.999));
    p.y += Math.sin(t * 0.8) * 0.7;

    this.group.position.copy(p);
    this.group.lookAt(p.clone().add(tan));

    // pervaneler
    for (const pr of this.propellers) pr.rotation.y += dt * 26;

    // hafif yalpa
    this.group.rotateZ(Math.sin(t * 1.4) * 0.05);
    this.group.rotateX(Math.sin(t * 1.1) * 0.04);
  }
}

/* --- kurucu --------------------------------------------------------------- */

export function buildCreatures(scene, cities) {
  const group = new THREE.Group();
  scene.add(group);

  const schools = [];

  // merkez çevresinde büyük gümüş sürü
  schools.push(new School({
    center: new THREE.Vector3(0, 12, 0), radius: 52, count: 78,
    color: 0xbcd6e6, size: 0.62, spread: 9, speed: 1
  }));
  // kubbe aralarında parlak turkuaz sürü
  schools.push(new School({
    center: new THREE.Vector3(-30, 22, 34), radius: 34, count: 54,
    color: 0x38d9d2, size: 0.5, spread: 7, speed: 1.25, glow: 0.45
  }));
  // sanayi kubbesi çevresinde sıcak renkli sürü
  schools.push(new School({
    center: new THREE.Vector3(56, 8, -58), radius: 30, count: 46,
    color: 0xffa552, size: 0.55, spread: 6, speed: 1.1, glow: 0.3
  }));
  // rasathane yakını, koyu mavi sürü
  schools.push(new School({
    center: new THREE.Vector3(8, 30, 82), radius: 40, count: 62,
    color: 0x6ea8ff, size: 0.48, spread: 8, speed: 1.4, glow: 0.35
  }));
  // kubbe içlerinde küçük sürüler (yaşam belirtisi)
  // ÖNEMLİ: yarıçap kubbenin %35'i olmalı ve yükseklik kubbe TEPESİNİN altında kalmalı,
  // yoksa sürü camın dışına taşıp "havada uûuşan balık" gibi görünüyor.
  for (const c of cities) {
    schools.push(new School({
      center: c.pos.clone().setY(c.height * 0.30),
      radius: c.radius * 0.30,
      count: 14, color: 0xffe3a8, size: 0.26, spread: 2.6, speed: 1.8, glow: 0.6
    }));
  }
  for (const s of schools) group.add(s.group);

  // vatozlar
  const rays = [
    new Ray(new THREE.Vector3(-38, 34, -46), 40, 0x58889b),
    new Ray(new THREE.Vector3(52, 42, 52), 54, 0x4a7b8e)
  ];
  for (const r of rays) group.add(r.group);

  // denizaltılar
  const subs = [
    new Submarine(cities, 0xffcf6b),
    new Submarine(cities, 0x7be0ff),
    new Submarine(cities, 0x9dffcf)
  ];
  subs.forEach((s, i) => {
    s.t = i * 0.33;
    group.add(s.group);
  });

  return {
    group,
    schools,
    rays,
    subs,
    update(dt, t) {
      for (const s of schools) s.update(dt, t);
      for (const r of rays) r.update(dt, t);
      for (const s of subs) s.update(dt, t);
    }
  };
}
