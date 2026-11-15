/*
 * NUMEX İPEK YOLU — Dünya (render katmanı)
 * Ekonomi mantığına dokunmaz; yalnız okur. three.js (WebGL).
 * Ölçek: 1 sahne birimi = 20 km.
 */
(function (kok) {
  "use strict";

  var OLCEK = 1 / 20; // km -> sahne birimi

  function Dunya(canvas) {
    this.canvas = canvas;
    this.hazir = false;
    this.seciliSehir = null;
    this.seciliKervan = null;
    this.tiklaGeriCagri = null;
    this.kervanGruplari = {};
    this.sehirObjeleri = {};
    this.yolObjeleri = {};
    this.hareketli = [];
    this._saat = 7;
    this._havaAnahtar = "";
  }

  Dunya.prototype.baslat = function (sim) {
    if (!kok.THREE) {
      console.error("three.js yüklenemedi — 3B katman kapalı.");
      return false;
    }
    var THREE = kok.THREE;
    this.THREE = THREE;

    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true, powerPreference: "high-performance" });
    this.renderer.setPixelRatio(Math.min(kok.devicePixelRatio || 1, 1.8));
    this.renderer.setSize(kok.innerWidth, kok.innerHeight, false);

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0b1018);
    this.scene.fog = new THREE.Fog(0x0b1018, 80, 340);

    this.camera = new THREE.PerspectiveCamera(50, kok.innerWidth / kok.innerHeight, 0.5, 1200);

    // kamera yörünge durumu
    this.hedef = new THREE.Vector3(-12, 0, 4);
    this.kure = { theta: -0.62, phi: 1.0, yaricap: 64 };
    this._kameraUygula();

    this._isiklar();
    this._zemin();
    this._yildizlar();
    this._yagmur();

    var self = this;
    (sim ? Object.keys(sim.sehirler) : Object.keys(kok.NumexEkonomi.SEHIR_HARITA)).forEach(function (sid) {
      self._sehirKur(sim ? sim.sehirler[sid] : kok.NumexEkonomi.SEHIR_HARITA[sid]);
    });
    this._yollarKur(sim);
    this._olayDinle();
    this.hazir = true;
    return true;
  };

  /* --------------------------------------------------------------- sahne parçaları */
  Dunya.prototype._isiklar = function () {
    var THREE = this.THREE;
    this.ambient = new THREE.AmbientLight(0xffe9c8, 0.42);
    this.scene.add(this.ambient);

    this.gunes = new THREE.DirectionalLight(0xfff0d0, 0.95);
    this.gunes.position.set(60, 90, 40);
    this.scene.add(this.gunes);

    this.ay = new THREE.DirectionalLight(0x8fa9d8, 0.0);
    this.ay.position.set(-50, 70, -30);
    this.scene.add(this.ay);

    this.gokyuzuIsik = new THREE.HemisphereLight(0x9fc4e0, 0x6b5236, 0.35);
    this.scene.add(this.gokyuzuIsik);
  };

  Dunya.prototype._zemin = function () {
    var THREE = this.THREE;
    var zemin = new THREE.Mesh(
      new THREE.PlaneGeometry(3200, 2200, 1, 1),
      new THREE.MeshLambertMaterial({ color: 0x8d7048 })
    );
    zemin.rotation.x = -Math.PI / 2;
    zemin.position.y = -0.05;
    this.scene.add(zemin);

    // kum tepeleri ve dağlar (sabit tohumlu, deterministik dekor)
    var r = new kok.NumexEkonomi.Rastgele(77);
    var kumMat = new THREE.MeshLambertMaterial({ color: 0xa08053 });
    var dagMat = new THREE.MeshLambertMaterial({ color: 0x6f6357 });
    var karMat = new THREE.MeshLambertMaterial({ color: 0xcfd6e0 });

    for (var i = 0; i < 130; i++) {
      var x = r.aralik(-90, 62);
      var z = r.aralik(-52, 52);
      // şehir merkezlerine çok yaklaşma
      var yakin = false;
      Object.keys(kok.NumexEkonomi.SEHIR_HARITA).forEach(function (sid) {
        var s = kok.NumexEkonomi.SEHIR_HARITA[sid];
        var sx = s.x * OLCEK, sz = s.z * OLCEK;
        if (Math.sqrt((x - sx) * (x - sx) + (z - sz) * (z - sz)) < 9) yakin = true;
      });
      if (yakin) continue;
      if (r.sonraki() < 0.45) {
        var tepe = new THREE.Mesh(new THREE.SphereGeometry(r.aralik(1.6, 4.2), 10, 7), kumMat);
        tepe.scale.y = r.aralik(0.12, 0.3);
        tepe.position.set(x, 0, z);
        this.scene.add(tepe);
      } else {
        var yuk = r.aralik(3, 10);
        var dag = new THREE.Mesh(new THREE.ConeGeometry(r.aralik(2.5, 6.5), yuk, 7), dagMat);
        dag.position.set(x, yuk / 2, z);
        dag.rotation.y = r.aralik(0, 3);
        this.scene.add(dag);
        if (yuk > 7.5) {
          var kar = new THREE.Mesh(new THREE.ConeGeometry(dag.geometry.parameters.radius * 0.4, yuk * 0.28, 7), karMat);
          kar.position.set(x, yuk - yuk * 0.14, z);
          this.scene.add(kar);
        }
      }
    }

    // dağ sırası (kuzey ve güney kenarı) — ufuk hissi
    for (var j = 0; j < 26; j++) {
      var bx = -120 + j * 7 + r.aralik(-2, 2);
      var by = r.aralik(9, 20);
      var bdag = new THREE.Mesh(new THREE.ConeGeometry(r.aralik(5, 9), by, 6), dagMat);
      bdag.position.set(bx, by / 2, -62 + r.aralik(-3, 3));
      this.scene.add(bdag);
      var bkar = new THREE.Mesh(new THREE.ConeGeometry(bdag.geometry.parameters.radius * 0.38, by * 0.26, 6), karMat);
      bkar.position.set(bx, by - by * 0.13, bdag.position.z);
      this.scene.add(bkar);
    }
  };

  Dunya.prototype._yildizlar = function () {
    var THREE = this.THREE;
    var n = 900, konum = new Float32Array(n * 3);
    var r = new kok.NumexEkonomi.Rastgele(9);
    for (var i = 0; i < n; i++) {
      var aci = r.aralik(0, Math.PI * 2), yuk = r.aralik(0.15, 1);
      var yari = Math.sqrt(1 - yuk * yuk) * 420;
      konum[i * 3] = Math.cos(aci) * yari;
      konum[i * 3 + 1] = yuk * 320 + 30;
      konum[i * 3 + 2] = Math.sin(aci) * yari;
    }
    var geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(konum, 3));
    this.yildizlar = new THREE.Points(geo, new THREE.PointsMaterial({ color: 0xdfe6f5, size: 1.6, transparent: true, opacity: 0 }));
    this.scene.add(this.yildizlar);
  };

  Dunya.prototype._yagmur = function () {
    var THREE = this.THREE;
    var n = 700, konum = new Float32Array(n * 3);
    var r = new kok.NumexEkonomi.Rastgele(21);
    for (var i = 0; i < n; i++) {
      konum[i * 3] = r.aralik(-70, 55);
      konum[i * 3 + 1] = r.aralik(0, 45);
      konum[i * 3 + 2] = r.aralik(-45, 45);
    }
    var geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(konum, 3));
    this.yagmur = new THREE.Points(geo, new THREE.PointsMaterial({ color: 0xa8c4de, size: 0.35, transparent: true, opacity: 0 }));
    this.scene.add(this.yagmur);
  };

  /* --------------------------------------------------------------------- şehir */
  Dunya.prototype._sehirKur = function (s) {
    var THREE = this.THREE;
    var grup = new THREE.Group();
    grup.position.set(s.x * OLCEK, 0, s.z * OLCEK);

    var dis = s.id === "konstantinopolis";
    var kuzey = s.id === "kasgar";

    // şehir zemini (hafif yükselti + sulak yeşillik)
    var zeminMat = new THREE.MeshLambertMaterial({ color: dis ? 0x7c8f74 : (kuzey ? 0x8a7d63 : 0x8f7f52) });
    var zemin = new THREE.Mesh(new THREE.CylinderGeometry(6.4, 6.8, 0.28, 26), zeminMat);
    zemin.position.y = 0.14;
    grup.add(zemin);

    // sur
    var surMat = new THREE.MeshLambertMaterial({ color: 0xb59c72 });
    var sur = new THREE.Mesh(new THREE.CylinderGeometry(6.2, 6.2, 0.9, 26, 1, true), surMat);
    sur.position.y = 0.6;
    sur.material.side = THREE.DoubleSide;
    grup.add(sur);

    // kuleler
    for (var t = 0; t < 6; t++) {
      var aci = (t / 6) * Math.PI * 2;
      var kule = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.6, 2.1, 8), surMat);
      kule.position.set(Math.cos(aci) * 6.1, 1.35, Math.sin(aci) * 6.1);
      grup.add(kule);
    }

    // binalar (deterministik)
    var r = new kok.NumexEkonomi.Rastgele(s.id.length * 31 + s.nufus % 977);
    var duvarRenkleri = [0xd8c3a2, 0xc9ab7f, 0xe0cfae, 0xb99c76];
    var kubbeRenkleri = dis ? [0x4f7f8f, 0x6b8f7a] : (kuzey ? [0x6f8f9a, 0x8a7f6a] : [0x4f9d95, 0x3f7f8f, 0x8f6f4f]);

    for (var i = 0; i < 16; i++) {
      var a = r.aralik(0, Math.PI * 2);
      var rad = r.aralik(1.2, 4.9);
      var bx = Math.cos(a) * rad, bz = Math.sin(a) * rad;
      var yuk = r.aralik(0.9, 2.6);
      var w = r.aralik(0.8, 1.5);
      var d = r.aralik(0.8, 1.5);
      var bina = new THREE.Mesh(new THREE.BoxGeometry(w, yuk, d), new THREE.MeshLambertMaterial({ color: duvarRenkleri[Math.floor(r.sonraki() * duvarRenkleri.length)] }));
      bina.position.set(bx, yuk / 2 + 0.28, bz);
      grup.add(bina);

      if (r.sonraki() < 0.6) {
        var kubbeYari = Math.min(w, d) * 0.62;
        var kubbe = new THREE.Mesh(new THREE.SphereGeometry(kubbeYari, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2 * 1.25), new THREE.MeshLambertMaterial({ color: kubbeRenkleri[Math.floor(r.sonraki() * kubbeRenkleri.length)] }));
        kubbe.position.set(bx, yuk + 0.28, bz);
        grup.add(kubbe);
      }
    }

    // minare / işaret kulesi
    var minareMat = new THREE.MeshLambertMaterial({ color: 0xe3d5b8 });
    var minare = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.38, 4.6, 10), minareMat);
    minare.position.set(1.4, 2.6, -1.6);
    grup.add(minare);
    var serefe = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.16, 10), minareMat);
    serefe.position.set(1.4, 4.2, -1.6);
    grup.add(serefe);
    var konik = new THREE.Mesh(new THREE.ConeGeometry(0.4, 1.2, 10), new THREE.MeshLambertMaterial({ color: 0x4f9d95 }));
    konik.position.set(1.4, 5.4, -1.6);
    grup.add(konik);

    // kervansaray (sur dışında)
    var ksMat = new THREE.MeshLambertMaterial({ color: 0xc6ad86 });
    var ks = new THREE.Group();
    ks.position.set(-8.2, 0, 3.5);
    var avlu = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.2, 3.4), new THREE.MeshLambertMaterial({ color: 0xa78f66 }));
    avlu.position.y = 0.1;
    ks.add(avlu);
    [[0, 1.7], [0, -1.7]].forEach(function (p) {
      var duvar = new THREE.Mesh(new THREE.BoxGeometry(3.6, 1.1, 0.25), ksMat);
      duvar.position.set(p[0], 0.65, p[1]);
      ks.add(duvar);
    });
    [[1.7, 0], [-1.7, 0]].forEach(function (p) {
      var duvar = new THREE.Mesh(new THREE.BoxGeometry(0.25, 1.1, 3.6), ksMat);
      duvar.position.set(p[0], 0.65, p[1]);
      ks.add(duvar);
    });
    grup.add(ks);

    // pazar çadırları (renkli koniler)
    var cadirRenkleri = [0xb5482f, 0x2f6f8f, 0xd8a544, 0x4f8f6f, 0x8f4f7f];
    for (var c = 0; c < 7; c++) {
      var ca = r.aralik(0, Math.PI * 2), cr = r.aralik(6.8, 8.6);
      var cadir = new THREE.Mesh(new THREE.ConeGeometry(0.55, 0.95, 8), new THREE.MeshLambertMaterial({ color: cadirRenkleri[c % cadirRenkleri.length] }));
      cadir.position.set(Math.cos(ca) * cr, 0.48, Math.sin(ca) * cr);
      grup.add(cadir);
      var direk = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.5, 5), new THREE.MeshLambertMaterial({ color: 0x5a4630 }));
      direk.position.set(cadir.position.x, 0.25, cadir.position.z);
      grup.add(direk);
    }

    // ağaçlar
    var agacMat = new THREE.MeshLambertMaterial({ color: 0x4a6b3f });
    for (var g = 0; g < 10; g++) {
      var ga = r.aralik(0, Math.PI * 2), gr = r.aralik(7.2, 10.5);
      var govde = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.14, 1.3, 5), new THREE.MeshLambertMaterial({ color: 0x5a4630 }));
      govde.position.set(Math.cos(ga) * gr, 0.65, Math.sin(ga) * gr);
      grup.add(govde);
      var tac = new THREE.Mesh(new THREE.ConeGeometry(0.62, 1.6, 7), agacMat);
      tac.position.set(govde.position.x, 1.9, govde.position.z);
      grup.add(tac);
    }

    // tıklama hitbox + şehir etiketi
    var hit = new THREE.Mesh(new THREE.CylinderGeometry(8.5, 8.5, 3, 12), new THREE.MeshBasicMaterial({ visible: false }));
    hit.position.y = 1.5;
    hit.userData = { tip: "sehir", id: s.id };
    grup.add(hit);

    var etiket = this._etiket(s.ad, "#e9dcc2");
    etiket.position.set(0, 7.4, 0);
    grup.add(etiket);

    // seçim halkası
    var halka = new THREE.Mesh(new THREE.RingGeometry(7.6, 8.4, 40), new THREE.MeshBasicMaterial({ color: 0xd8a544, transparent: true, opacity: 0, side: THREE.DoubleSide }));
    halka.rotation.x = -Math.PI / 2;
    halka.position.y = 0.35;
    grup.add(halka);

    // gece fenerleri
    var fener = new THREE.PointLight(0xffb066, 0, 26);
    fener.position.set(0, 3, 0);
    grup.add(fener);

    this.scene.add(grup);
    this.sehirObjeleri[s.id] = { grup: grup, hit: hit, halka: halka, fener: fener, etiket: etiket, veri: s };
    this.tiklanabilir = this.tiklanabilir || [];
    this.tiklanabilir.push(hit);
  };

  Dunya.prototype._etiket = function (metin, renk) {
    var THREE = this.THREE;
    var c = document.createElement("canvas");
    c.width = 512; c.height = 128;
    var ctx = c.getContext("2d");
    ctx.clearRect(0, 0, 512, 128);
    ctx.font = "600 54px Georgia, serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.shadowColor = "rgba(0,0,0,0.85)";
    ctx.shadowBlur = 12;
    ctx.fillStyle = renk || "#e9dcc2";
    ctx.fillText(metin, 256, 64);
    var doku = new THREE.CanvasTexture(c);
    doku.minFilter = THREE.LinearFilter;
    var sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: doku, transparent: true, depthTest: false }));
    sprite.scale.set(9, 2.25, 1);
    return sprite;
  };

  /* -------------------------------------------------------------------- yollar */
  Dunya.prototype._yollarKur = function (sim) {
    var THREE = this.THREE;
    var self = this;
    var yollar = sim ? sim.yollar : kok.NumexEkonomi.YOLLAR;
    yollar.forEach(function (y, i) {
      var aId = y.a || y.a === 0 ? y.a : y.a;
      var A = self.sehirObjeleri[y.a], B = self.sehirObjeleri[y.b];
      if (!A || !B) return;
      var pa = A.grup.position, pb = B.grup.position;
      var dx = pb.x - pa.x, dz = pb.z - pa.z;
      var uzunluk = Math.sqrt(dx * dx + dz * dz);
      var geo = new THREE.PlaneGeometry(uzunluk, 0.7);
      var mat = new THREE.MeshLambertMaterial({ color: 0xc9ae82, transparent: true, opacity: 0.55 });
      var yol = new THREE.Mesh(geo, mat);
      yol.rotation.x = -Math.PI / 2;
      yol.rotation.z = -Math.atan2(dz, dx);
      yol.position.set((pa.x + pb.x) / 2, 0.02, (pa.z + pb.z) / 2);
      self.scene.add(yol);
      self.yolObjeleri[y.id || ("yol" + i)] = { mesh: yol, veri: y };
    });
  };

  /* ------------------------------------------------------------------- kervanlar */
  Dunya.prototype._deve = function (renk) {
    var THREE = this.THREE;
    var g = new THREE.Group();
    var deri = new THREE.MeshLambertMaterial({ color: renk });
    var govde = new THREE.Mesh(new THREE.SphereGeometry(0.42, 10, 8), deri);
    govde.scale.set(1.35, 0.95, 0.75);
    govde.position.y = 0.78;
    g.add(govde);

    var horguc = new THREE.Mesh(new THREE.SphereGeometry(0.26, 8, 6), deri);
    horguc.position.set(-0.1, 1.1, 0);
    g.add(horguc);

    var boyun = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.16, 0.85, 6), deri);
    boyun.position.set(0.52, 1.05, 0);
    boyun.rotation.z = -0.55;
    g.add(boyun);

    var bas = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.22, 0.2), deri);
    bas.position.set(0.78, 1.42, 0);
    g.add(bas);

    [[0.3, 0.26], [0.3, -0.26], [-0.34, 0.24], [-0.34, -0.24]].forEach(function (p) {
      var bacak = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.055, 0.72, 5), deri);
      bacak.position.set(p[0], 0.36, p[1]);
      g.add(bacak);
    });

    var yuk = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.34, 0.5), new THREE.MeshLambertMaterial({ color: 0x8f5f3f }));
    yuk.position.set(-0.08, 1.22, 0);
    g.add(yuk);
    return g;
  };

  Dunya.prototype.kervanGuncelle = function (kervanlar, seciliId) {
    var THREE = this.THREE;
    var self = this;
    var gorulen = {};
    kervanlar.forEach(function (k, i) {
      gorulen[k.id] = true;
      var g = self.kervanGruplari[k.id];
      if (!g) {
        // NOT: yerel grup değişkeni ayrı tutulur; sarmalayıcı nesne ile karışmaz
        var yeniGrup = new THREE.Group();
        yeniGrup.name = "kervan_" + k.id;
        var renk = k.sahip === "oyuncu" ? 0x6f4a2f : 0x8a6a4a;
        var deveSayisi = k.sahip === "oyuncu" ? 3 : 2;
        for (var d = 0; d < deveSayisi; d++) {
          var deve = self._deve(renk);
          deve.position.set(-d * 1.5, 0, d % 2 === 0 ? 0 : 0.45);
          deve.scale.setScalar(0.95);
          deve.name = "deve_" + k.id + "_" + d;
          yeniGrup.add(deve);
          // bacak sallanması için referans
          self.hareketli.push({ grup: deve, faz: i * 0.7 + d * 1.3, tur: "deve" });
        }
        var bayrak = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.5), new THREE.MeshBasicMaterial({ color: k.sahip === "oyuncu" ? 0xd8a544 : 0x9d7f4f, side: THREE.DoubleSide }));
        bayrak.position.set(0.9, 1.8, 0);
        yeniGrup.add(bayrak);

        var hitK = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, 2.4, 8), new THREE.MeshBasicMaterial({ visible: false }));
        hitK.position.y = 1.2;
        hitK.userData = { tip: "kervan", id: k.id };
        yeniGrup.add(hitK);
        self.tiklanabilir = self.tiklanabilir || [];
        self.tiklanabilir.push(hitK);

        self.scene.add(yeniGrup);
        g = { grup: yeniGrup, hit: hitK };
        self.kervanGruplari[k.id] = g;
      }
      g.grup.position.set(k.konum.x * OLCEK, 0.1, k.konum.z * OLCEK);
      // yön: kervan yoldaysa rotasına göre
      if (k.durum === "yolda" && k.rota) {
        var son = k.rota.sehirler[Math.min(k.rotaIndex + 1, k.rota.sehirler.length - 1)];
        var hedefS = self.sehirObjeleri[son];
        if (hedefS) {
          var dx = hedefS.grup.position.x - g.grup.position.x;
          var dz = hedefS.grup.position.z - g.grup.position.z;
          if (Math.abs(dx) + Math.abs(dz) > 0.001) {
            var aci = Math.atan2(dx, dz) - Math.PI / 2;
            g.grup.rotation.y += ((aci - g.grup.rotation.y + Math.PI * 3) % (Math.PI * 2) - Math.PI) * 0.15;
          }
        }
      }
      // seçim vurgusu
      if (seciliId === k.id) {
        g.grup.scale.setScalar(1.15);
      } else {
        g.grup.scale.setScalar(1);
      }
    });
    // silinen kervan grupları
    Object.keys(self.kervanGruplari).forEach(function (id) {
      if (!gorulen[id]) {
        var g = self.kervanGruplari[id];
        self.scene.remove(g.grup);
        self.tiklanabilir = (self.tiklanabilir || []).filter(function (o) { return o !== g.hit; });
        delete self.kervanGruplari[id];
      }
    });
  };

  /* ------------------------------------------------------------------- görünüm */
  Dunya.prototype.guncelle = function (sim, seciliSehir, seciliKervan, dtSn) {
    if (!this.hazir) return;
    var THREE = this.THREE;

    this.kervanGuncelle(sim.kervanlar, seciliKervan);

    // seçim halkaları
    var self = this;
    Object.keys(this.sehirObjeleri).forEach(function (sid) {
      var o = self.sehirObjeleri[sid];
      var hedefOp = sid === seciliSehir ? 0.9 : 0;
      o.halka.material.opacity += (hedefOp - o.halka.material.opacity) * 0.15;
      o.etiket.material.opacity = sid === seciliSehir ? 1 : 0.78;
    });

    // yollar: kapalı olan kırmızı, açık olan kum
    Object.keys(this.yolObjeleri).forEach(function (id) {
      var yo = self.yolObjeleri[id];
      var veri = yo.veri;
      if (veri.kapali) {
        yo.mesh.material.color.setHex(0xc4553c);
        yo.mesh.material.opacity = 0.85;
      } else {
        yo.mesh.material.color.setHex(0xc9ae82);
        yo.mesh.material.opacity = 0.55 - (1 - (veri.guvenlik || 1)) * 0.3;
      }
    });

    // gece-gündüz
    var saat = sim.saat;
    this._saat = saat;
    var gunduz = Math.max(0, Math.sin(((saat - 6) / 12) * Math.PI));
    var geceAgirlik = 1 - Math.min(1, gunduz * 1.6);
    var gokyuzu = new THREE.Color(0x0a0f1c).lerp(new THREE.Color(0x9fc4e0), gunduz);
    // şafak / akşam kızıllığı
    var tanVakti = Math.max(0, 1 - Math.abs(gunduz - 0.15) * 6) * (saat < 12 ? 0.6 : 0.7);
    gokyuzu.lerp(new THREE.Color(0xb5714a), tanVakti * 0.5);
    this.scene.background.copy(gokyuzu);
    this.scene.fog.color.copy(gokyuzu);

    this.gunes.intensity = 0.35 + gunduz * 0.9;
    this.gunes.position.set(Math.cos((saat / 24) * Math.PI * 2) * 90, 30 + gunduz * 90, Math.sin((saat / 24) * Math.PI * 2) * 70);
    this.ay.intensity = geceAgirlik * 0.35;
    this.ambient.intensity = 0.3 + gunduz * 0.32;
    this.gokyuzuIsik.intensity = 0.22 + gunduz * 0.26;
    this.yildizlar.material.opacity = geceAgirlik * 0.9;

    Object.keys(this.sehirObjeleri).forEach(function (sid) {
      var o = self.sehirObjeleri[sid];
      o.fener.intensity = geceAgirlik * 2.2;
    });

    // hava: yağmur/sis
    var ortHava = "acik", sayac = {};
    Object.keys(sim.sehirler).forEach(function (sid) {
      var h = sim.sehirler[sid].hava;
      sayac[h] = (sayac[h] || 0) + 1;
    });
    for (var h in sayac) if (sayac[h] > (sayac[ortHava] || 0)) ortHava = h;

    var yagmurVar = ortHava === "yagmur" || ortHava === "firtina";
    this.yagmur.material.opacity += ((yagmurVar ? 0.75 : 0) - this.yagmur.material.opacity) * 0.05;
    if (yagmurVar) {
      var pos = this.yagmur.geometry.attributes.position;
      for (var i = 0; i < pos.count; i++) {
        var y = pos.getY(i) - (ortHava === "firtina" ? 34 : 20) * dtSn;
        if (y < 0) y = 45;
        pos.setY(i, y);
      }
      pos.needsUpdate = true;
    }
    var sisli = ortHava === "sis" || ortHava === "kar";
    var fogHedef = sisli ? 60 : 90;
    this.scene.fog.near += (fogHedef - this.scene.fog.near) * 0.03;

    // hareketli parçalar (bacak salınımı)
    var t = kok.performance.now() / 1000;
    this.hareketli.forEach(function (h) {
      if (!h.grup.parent) return;
      h.grup.rotation.z = Math.sin(t * 6 + h.faz) * 0.04;
      h.grup.position.y = 0.1 + Math.abs(Math.sin(t * 6 + h.faz)) * 0.05;
    });

    this.renderer.render(this.scene, this.camera);
  };

  /* -------------------------------------------------------------------- kamera */
  Dunya.prototype._kameraUygula = function () {
    var c = this.kure;
    c.phi = Math.max(0.18, Math.min(1.45, c.phi));
    c.yaricap = Math.max(14, Math.min(190, c.yaricap));
    var x = this.hedef.x + c.yaricap * Math.sin(c.phi) * Math.cos(c.theta);
    var z = this.hedef.z + c.yaricap * Math.sin(c.phi) * Math.sin(c.theta);
    var y = this.hedef.y + c.yaricap * Math.cos(c.phi);
    this.camera.position.set(x, y, z);
    this.camera.lookAt(this.hedef);
  };

  Dunya.prototype.kameraGit = function (sehirId) {
    var o = this.sehirObjeleri[sehirId];
    if (!o) return;
    this.kameraHedef = { x: o.grup.position.x, z: o.grup.position.z, yaricap: 34 };
  };

  Dunya.prototype._olayDinle = function () {
    var self = this;
    var bas = null, basHedef = null, tasima = null;

    this.canvas.addEventListener("pointerdown", function (e) {
      self.canvas.setPointerCapture && self.canvas.setPointerCapture(e.pointerId);
      if (e.button === 2 || e.shiftKey) {
        tasima = { x: e.clientX, y: e.clientY, hedef: { x: self.hedef.x, z: self.hedef.z } };
      } else {
        bas = { x: e.clientX, y: e.clientY };
      }
    });

    this.canvas.addEventListener("pointermove", function (e) {
      if (tasima) {
        var olcek = self.kure.yaricap * 0.0022;
        var dx = e.clientX - tasima.x, dy = e.clientY - tasima.y;
        self.hedef.x = tasima.hedef.x - (dx * Math.cos(self.kure.theta) - dy * Math.sin(self.kure.theta)) * olcek;
        self.hedef.z = tasima.hedef.z - (dx * Math.sin(self.kure.theta) + dy * Math.cos(self.kure.theta)) * olcek;
        self._kameraUygula();
        return;
      }
      if (bas) {
        self.kure.theta -= (e.clientX - bas.x) * 0.006;
        self.kure.phi -= (e.clientY - bas.y) * 0.004;
        bas = { x: e.clientX, y: e.clientY };
        self._kameraUygula();
      }
    });

    this.canvas.addEventListener("pointerup", function (e) {
      if (bas) {
        var hareket = Math.abs(e.clientX - bas.x) + Math.abs(e.clientY - bas.y);
        if (hareket < 5) self._tiklama(e);
      }
      bas = null; tasima = null;
    });

    this.canvas.addEventListener("wheel", function (e) {
      e.preventDefault();
      self.kure.yaricap *= (1 + Math.sign(e.deltaY) * 0.1);
      self._kameraUygula();
    }, { passive: false });

    this.canvas.addEventListener("contextmenu", function (e) { e.preventDefault(); });

    kok.addEventListener("resize", function () {
      if (!self.renderer) return;
      self.camera.aspect = kok.innerWidth / kok.innerHeight;
      self.camera.updateProjectionMatrix();
      self.renderer.setSize(kok.innerWidth, kok.innerHeight, false);
    });
  };

  Dunya.prototype._tiklama = function (e) {
    if (!this.raycaster) {
      this.raycaster = new this.THREE.Raycaster();
      this.fare = new this.THREE.Vector2();
    }
    var r = this.canvas.getBoundingClientRect();
    this.fare.x = ((e.clientX - r.left) / r.width) * 2 - 1;
    this.fare.y = -((e.clientY - r.top) / r.height) * 2 + 1;
    this.raycaster.setFromCamera(this.fare, this.camera);
    var hedefler = this.tiklanabilir || [];
    var kesisim = this.raycaster.intersectObjects(hedefler, false);
    if (kesisim.length) {
      var veri = kesisim[0].object.userData;
      if (this.tiklaGeriCagri) this.tiklaGeriCagri(veri.tip, veri.id);
    } else if (this.tiklaGeriCagri) {
      this.tiklaGeriCagri("bos", null);
    }
  };

  // kamera yumuşak geçiş (oyun döngüsünde çağrılır)
  Dunya.prototype.kameraAdim = function () {
    if (!this.kameraHedef) return;
    var h = this.kameraHedef;
    this.hedef.x += (h.x - this.hedef.x) * 0.08;
    this.hedef.z += (h.z - this.hedef.z) * 0.08;
    this.kure.yaricap += (h.yaricap - this.kure.yaricap) * 0.08;
    if (Math.abs(h.x - this.hedef.x) < 0.05 && Math.abs(h.z - this.hedef.z) < 0.05 && Math.abs(h.yaricap - this.kure.yaricap) < 0.1) {
      this.hedef.x = h.x; this.hedef.z = h.z; this.kure.yaricap = h.yaricap;
      this.kameraHedef = null;
    }
    this._kameraUygula();
  };

  kok.Dunya = Dunya;
})(typeof globalThis !== "undefined" ? globalThis : this);
