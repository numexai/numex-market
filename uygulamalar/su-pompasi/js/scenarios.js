/* Numex Atlas — hazır senaryolar (tamamı kurgusal, gerçek şehir verisi değil) */
(function (global) {
  'use strict';
  const Network = global.NumexNetwork.Network;

  function build(def) {
    const net = new Network(def.name);
    const map = {};
    def.nodes.forEach(n => {
      const o = Object.assign({}, n);
      delete o.k;
      map[n.k] = net.addNode(o);
    });
    def.edges.forEach(e => {
      const o = Object.assign({}, e);
      const from = map[o.from], to = map[o.to];
      delete o.from; delete o.to; delete o.k;
      net.addEdge(Object.assign({ from: from.id, to: to.id }, o));
    });
    return net;
  }

  /* ---------------- Senaryo 1: Küçük Kasaba ---------------- */
  const S1 = {
    key: 's1',
    name: 'Küçük Kasaba',
    desc: '1 depo, 1 pompa, 8 mahalle, 14 boru — tek besleme, halkalı dağıtım.',
    nodes: [
      { k: 'R1', type: 'reservoir', x: 150, y: 180, name: 'Merkez Depo', head: 62, capacity: 4000 },
      { k: 'J1', type: 'junction', x: 400, y: 180, name: 'Düğüm 1', elevation: 8 },
      { k: 'J2', type: 'junction', x: 650, y: 180, name: 'Düğüm 2', elevation: 12 },
      { k: 'J3', type: 'junction', x: 900, y: 180, name: 'Düğüm 3', elevation: 14 },
      { k: 'J4', type: 'junction', x: 400, y: 450, name: 'Düğüm 4', elevation: 16 },
      { k: 'J5', type: 'junction', x: 650, y: 450, name: 'Düğüm 5', elevation: 18 },
      { k: 'J6', type: 'junction', x: 900, y: 450, name: 'Düğüm 6', elevation: 20 },
      { k: 'N1', type: 'neighborhood', x: 150, y: 700, name: 'Bahçelievler', demand: 10, minPressure: 20, elevation: 26 },
      { k: 'N2', type: 'neighborhood', x: 400, y: 700, name: 'Cumhuriyet', demand: 12, minPressure: 20, elevation: 30 },
      { k: 'N3', type: 'neighborhood', x: 650, y: 700, name: 'Sanayi', demand: 9, minPressure: 20, elevation: 32 },
      { k: 'N4', type: 'neighborhood', x: 900, y: 700, name: 'Yeni Mahalle', demand: 11, minPressure: 20, elevation: 34 },
      { k: 'N5', type: 'neighborhood', x: 1200, y: 180, name: 'Kuzey', demand: 13, minPressure: 20, elevation: 28 },
      { k: 'N6', type: 'neighborhood', x: 1200, y: 450, name: 'İstasyon', demand: 10, minPressure: 20, elevation: 30 },
      { k: 'N7', type: 'neighborhood', x: 1200, y: 700, name: 'Tepe', demand: 8, minPressure: 20, elevation: 32 },
      { k: 'N8', type: 'neighborhood', x: 150, y: 450, name: 'Çarşı', demand: 12, minPressure: 20, elevation: 24 }
    ],
    edges: [
      { type: 'pump', from: 'R1', to: 'J1', pumpHead: 18 },
      { type: 'valve', from: 'R1', to: 'J4', open: false },
      { type: 'pipe', from: 'J1', to: 'J2', length: 320, diameter: 250 },
      { type: 'pipe', from: 'J2', to: 'J3', length: 320, diameter: 250 },
      { type: 'pipe', from: 'J3', to: 'N5', length: 300, diameter: 200 },
      { type: 'pipe', from: 'J1', to: 'J4', length: 280, diameter: 250 },
      { type: 'pipe', from: 'J2', to: 'J5', length: 280, diameter: 200 },
      { type: 'pipe', from: 'J3', to: 'J6', length: 280, diameter: 200 },
      { type: 'pipe', from: 'J4', to: 'J5', length: 320, diameter: 200 },
      { type: 'pipe', from: 'J5', to: 'J6', length: 320, diameter: 200 },
      { type: 'pipe', from: 'J4', to: 'N2', length: 260, diameter: 150 },
      { type: 'pipe', from: 'J5', to: 'N3', length: 260, diameter: 150 },
      { type: 'pipe', from: 'J6', to: 'N4', length: 260, diameter: 150 },
      { type: 'pipe', from: 'J4', to: 'N1', length: 300, diameter: 150 },
      { type: 'pipe', from: 'J6', to: 'N6', length: 320, diameter: 150 },
      { type: 'pipe', from: 'J6', to: 'N7', length: 380, diameter: 150 },
      { type: 'pipe', from: 'J4', to: 'N8', length: 240, diameter: 150 }
    ]
  };

  /* ---------------- Senaryo 2: Çift Beslemeli Şehir ---------------- */
  const S2 = {
    key: 's2',
    name: 'Çift Beslemeli Şehir',
    desc: '2 depo, 1 pompa, 12 mahalle, yedek çapraz hatlar (biri kapalı).',
    nodes: [
      { k: 'R1', type: 'reservoir', x: 110, y: 250, name: 'Batı Deposu', head: 72, capacity: 6000 },
      // NUMEX-DÜZELTME (2026-11-19): Doğu Deposu yükü (66 m) şebeke basıncının altında kaldığı için depo beslemek yerine besleniyordu (çıkış -52.99 L/s) — 'çift beslemeli' senaryo tek beslemeye düşüyordu. Yük 80 m'ye çıkarıldı, ölçümde her iki depo da şebekeye su veriyor.
      { k: 'R2', type: 'reservoir', x: 1290, y: 560, name: 'Doğu Deposu', head: 80, capacity: 5000 },
      { k: 'J1', type: 'junction', x: 380, y: 250, name: 'Düğüm 1', elevation: 12 },
      { k: 'J2', type: 'junction', x: 700, y: 250, name: 'Düğüm 2', elevation: 16 },
      { k: 'J3', type: 'junction', x: 1020, y: 250, name: 'Düğüm 3', elevation: 20 },
      { k: 'J4', type: 'junction', x: 380, y: 560, name: 'Düğüm 4', elevation: 18 },
      { k: 'J5', type: 'junction', x: 700, y: 560, name: 'Düğüm 5', elevation: 22 },
      { k: 'J6', type: 'junction', x: 1020, y: 560, name: 'Düğüm 6', elevation: 24 },
      { k: 'N1', type: 'neighborhood', x: 500, y: 110, name: 'Kuzeybatı', demand: 11, minPressure: 20, elevation: 34 },
      { k: 'N2', type: 'neighborhood', x: 760, y: 110, name: 'Merkez', demand: 14, minPressure: 20, elevation: 30 },
      { k: 'N3', type: 'neighborhood', x: 1020, y: 110, name: 'Kuzeydoğu', demand: 10, minPressure: 20, elevation: 36 },
      { k: 'N4', type: 'neighborhood', x: 150, y: 430, name: 'Batı Yakası', demand: 9, minPressure: 20, elevation: 26 },
      { k: 'N5', type: 'neighborhood', x: 1250, y: 430, name: 'Doğu Yakası', demand: 10, minPressure: 20, elevation: 28 },
      { k: 'N6', type: 'neighborhood', x: 150, y: 800, name: 'Güneybatı', demand: 8, minPressure: 20, elevation: 22 },
      { k: 'N7', type: 'neighborhood', x: 380, y: 800, name: 'Pazar', demand: 12, minPressure: 20, elevation: 24 },
      { k: 'N8', type: 'neighborhood', x: 700, y: 800, name: 'Güney', demand: 13, minPressure: 20, elevation: 26 },
      { k: 'N9', type: 'neighborhood', x: 1020, y: 800, name: 'Güneydoğu', demand: 9, minPressure: 20, elevation: 30 },
      { k: 'N10', type: 'neighborhood', x: 1250, y: 800, name: 'Liman', demand: 11, minPressure: 20, elevation: 20 },
      { k: 'N11', type: 'neighborhood', x: 1250, y: 640, name: 'Sanayi Bölgesi', demand: 12, minPressure: 20, elevation: 24 },
      { k: 'N12', type: 'neighborhood', x: 150, y: 640, name: 'Bağlar', demand: 8, minPressure: 20, elevation: 28 }
    ],
    edges: [
      { type: 'pump', from: 'R1', to: 'J1', pumpHead: 14 },
      { type: 'pipe', from: 'R2', to: 'J6', length: 320, diameter: 250 },
      { type: 'pipe', from: 'J1', to: 'J2', length: 340, diameter: 250 },
      { type: 'pipe', from: 'J2', to: 'J3', length: 340, diameter: 250 },
      { type: 'pipe', from: 'J4', to: 'J5', length: 340, diameter: 200 },
      { type: 'pipe', from: 'J5', to: 'J6', length: 340, diameter: 200 },
      { type: 'pipe', from: 'J1', to: 'J4', length: 320, diameter: 250 },
      { type: 'pipe', from: 'J2', to: 'J5', length: 320, diameter: 200 },
      { type: 'pipe', from: 'J3', to: 'J6', length: 320, diameter: 200 },
      { type: 'pipe', from: 'J3', to: 'J5', length: 420, diameter: 150, open: false, coeff: 1.1 },
      { type: 'pipe', from: 'J4', to: 'J2', length: 420, diameter: 150, open: false, coeff: 1.1 },
      { type: 'pipe', from: 'J1', to: 'N1', length: 260, diameter: 150 },
      { type: 'pipe', from: 'J2', to: 'N2', length: 220, diameter: 200 },
      { type: 'pipe', from: 'J3', to: 'N3', length: 260, diameter: 150 },
      { type: 'pipe', from: 'J4', to: 'N4', length: 240, diameter: 150 },
      { type: 'pipe', from: 'J6', to: 'N5', length: 240, diameter: 150 },
      { type: 'pipe', from: 'J4', to: 'N6', length: 300, diameter: 150 },
      { type: 'pipe', from: 'J4', to: 'N7', length: 220, diameter: 200 },
      { type: 'pipe', from: 'J5', to: 'N8', length: 240, diameter: 200 },
      { type: 'pipe', from: 'J6', to: 'N9', length: 260, diameter: 150 },
      { type: 'pipe', from: 'J6', to: 'N10', length: 320, diameter: 150 },
      { type: 'pipe', from: 'J6', to: 'N11', length: 200, diameter: 150 },
      { type: 'pipe', from: 'J4', to: 'N12', length: 280, diameter: 150 }
    ]
  };

  /* ---------------- Senaryo 3: Kriz Sınavı ---------------- */
  const S3 = {
    key: 's3',
    name: 'Kriz Sınavı',
    desc: '1 depo, 1 pompa, 15 mahalle, 26+ hat, kapalı yedek hatlar ve darboğazlar.',
    nodes: [
      { k: 'R1', type: 'reservoir', x: 120, y: 160, name: 'Ana Depo', head: 72, capacity: 8000 },
      { k: 'J1', type: 'junction', x: 360, y: 160, name: 'Düğüm 1', elevation: 14 },
      { k: 'J2', type: 'junction', x: 620, y: 160, name: 'Düğüm 2', elevation: 18 },
      { k: 'J3', type: 'junction', x: 880, y: 160, name: 'Düğüm 3', elevation: 22 },
      { k: 'J4', type: 'junction', x: 1140, y: 160, name: 'Düğüm 4', elevation: 26 },
      { k: 'J5', type: 'junction', x: 360, y: 380, name: 'Düğüm 5', elevation: 20 },
      { k: 'J6', type: 'junction', x: 620, y: 380, name: 'Düğüm 6', elevation: 24 },
      { k: 'J7', type: 'junction', x: 880, y: 380, name: 'Düğüm 7', elevation: 28 },
      { k: 'J8', type: 'junction', x: 1140, y: 380, name: 'Düğüm 8', elevation: 32 },
      { k: 'N1', type: 'neighborhood', x: 140, y: 560, name: 'A Mahallesi', demand: 9, minPressure: 20, elevation: 34 },
      { k: 'N2', type: 'neighborhood', x: 400, y: 560, name: 'B Mahallesi', demand: 10, minPressure: 20, elevation: 32 },
      { k: 'N3', type: 'neighborhood', x: 660, y: 560, name: 'C Mahallesi', demand: 11, minPressure: 20, elevation: 36 },
      { k: 'N4', type: 'neighborhood', x: 920, y: 560, name: 'D Mahallesi', demand: 10, minPressure: 20, elevation: 38 },
      { k: 'N5', type: 'neighborhood', x: 1180, y: 560, name: 'E Mahallesi', demand: 12, minPressure: 20, elevation: 40 },
      { k: 'N6', type: 'neighborhood', x: 140, y: 700, name: 'F Mahallesi', demand: 8, minPressure: 20, elevation: 30 },
      { k: 'N7', type: 'neighborhood', x: 400, y: 700, name: 'G Mahallesi', demand: 11, minPressure: 20, elevation: 34 },
      { k: 'N8', type: 'neighborhood', x: 660, y: 700, name: 'H Mahallesi', demand: 9, minPressure: 20, elevation: 38 },
      { k: 'N9', type: 'neighborhood', x: 920, y: 700, name: 'I Mahallesi', demand: 13, minPressure: 20, elevation: 42 },
      { k: 'N10', type: 'neighborhood', x: 1180, y: 700, name: 'J Mahallesi', demand: 10, minPressure: 20, elevation: 44 },
      { k: 'N11', type: 'neighborhood', x: 140, y: 830, name: 'K Mahallesi', demand: 7, minPressure: 20, elevation: 28 },
      { k: 'N12', type: 'neighborhood', x: 400, y: 830, name: 'L Mahallesi', demand: 9, minPressure: 20, elevation: 32 },
      { k: 'N13', type: 'neighborhood', x: 660, y: 830, name: 'M Mahallesi', demand: 10, minPressure: 20, elevation: 36 },
      { k: 'N14', type: 'neighborhood', x: 920, y: 830, name: 'N Mahallesi', demand: 11, minPressure: 20, elevation: 40 },
      { k: 'N15', type: 'neighborhood', x: 1180, y: 830, name: 'O Mahallesi', demand: 12, minPressure: 20, elevation: 42 }
    ],
    edges: [
      { type: 'pump', from: 'R1', to: 'J1', pumpHead: 26 },
      { type: 'valve', from: 'R1', to: 'J5', open: false },
      { type: 'pipe', from: 'J1', to: 'J2', length: 280, diameter: 250 },
      { type: 'pipe', from: 'J2', to: 'J3', length: 280, diameter: 250 },
      { type: 'pipe', from: 'J3', to: 'J4', length: 280, diameter: 200 },
      { type: 'pipe', from: 'J1', to: 'J5', length: 180, diameter: 200 },
      { type: 'pipe', from: 'J2', to: 'J6', length: 180, diameter: 200 },
      { type: 'pipe', from: 'J3', to: 'J7', length: 180, diameter: 200 },
      { type: 'pipe', from: 'J4', to: 'J8', length: 180, diameter: 200 },
      { type: 'pipe', from: 'J5', to: 'J6', length: 240, diameter: 200 },
      { type: 'pipe', from: 'J6', to: 'J7', length: 240, diameter: 200 },
      { type: 'pipe', from: 'J7', to: 'J8', length: 240, diameter: 150 },
      { type: 'valve', from: 'J1', to: 'J6', open: false },
      { type: 'valve', from: 'J2', to: 'J7', open: false },
      { type: 'pipe', from: 'J4', to: 'J5', length: 520, diameter: 150, open: false, coeff: 1.1 },
      { type: 'pipe', from: 'J5', to: 'N1', length: 300, diameter: 150 },
      { type: 'pipe', from: 'J5', to: 'N2', length: 240, diameter: 150 },
      { type: 'pipe', from: 'J6', to: 'N3', length: 240, diameter: 150 },
      { type: 'pipe', from: 'J7', to: 'N4', length: 240, diameter: 150 },
      { type: 'pipe', from: 'J8', to: 'N5', length: 240, diameter: 150 },
      { type: 'pipe', from: 'J5', to: 'N6', length: 340, diameter: 150 },
      { type: 'pipe', from: 'J6', to: 'N7', length: 340, diameter: 150 },
      { type: 'pipe', from: 'J6', to: 'N8', length: 340, diameter: 150 },
      { type: 'pipe', from: 'J7', to: 'N9', length: 340, diameter: 150 },
      { type: 'pipe', from: 'J8', to: 'N10', length: 340, diameter: 150 },
      { type: 'pipe', from: 'J5', to: 'N11', length: 380, diameter: 100 },
      { type: 'pipe', from: 'J6', to: 'N12', length: 380, diameter: 100 },
      { type: 'pipe', from: 'J7', to: 'N13', length: 380, diameter: 100 },
      { type: 'pipe', from: 'J8', to: 'N14', length: 380, diameter: 100 },
      { type: 'pipe', from: 'J8', to: 'N15', length: 420, diameter: 100 }
    ]
  };

  const DEFS = { s1: S1, s2: S2, s3: S3 };

  const NumexScenarios = {
    list: [
      { key: 's1', name: S1.name, desc: S1.desc },
      { key: 's2', name: S2.name, desc: S2.desc },
      { key: 's3', name: S3.name, desc: S3.desc }
    ],
    create: function (key) {
      const def = DEFS[key] || S1;
      const net = build(def);
      net.desc = def.desc;
      return net;
    },
    empty: function () {
      return new Network('Yeni Şebeke');
    }
  };

  global.NumexScenarios = NumexScenarios;
})(window);
