/* ===================================================================
   NUMEX NÖBET — Hazır senaryolar (A mobilya, B matbaa, C kaos)
   =================================================================== */
(function (global) {
  'use strict';
  var H = function (s) { return s; };

  function A() {
    var makineler = [
      { id: 'K1', name: 'Kesim 1', types: ['Kesim'], start: 480, end: 1080, available: true,
        maintenance: [{ start: 780, end: 840, reason: 'Bıçak değişimi' }] },
      { id: 'K2', name: 'Kesim 2 / Zımpara', types: ['Kesim', 'Zımpara'], start: 480, end: 1080, available: true, maintenance: [] },
      { id: 'Z1', name: 'Zımpara / Boya', types: ['Zımpara', 'Boya'], start: 480, end: 1140, available: true, maintenance: [] },
      { id: 'M1', name: 'Montaj Tezgâhı', types: ['Montaj', 'Zımpara'], start: 480, end: 1080, available: true, maintenance: [] }
    ];
    var isler = [
      { id: 'A1', name: 'Sandalye — kesim', type: 'Kesim', duration: 45, priority: 3, due: 630, machines: [], deps: [] },
      { id: 'A2', name: 'Sandalye — zımpara', type: 'Zımpara', duration: 30, priority: 3, due: 700, machines: [], deps: ['A1'] },
      { id: 'A3', name: 'Sandalye — boya', type: 'Boya', duration: 60, priority: 4, due: 800, machines: [], deps: ['A2'] },
      { id: 'A4', name: 'Sandalye — montaj', type: 'Montaj', duration: 40, priority: 3, due: 870, machines: [], deps: ['A3'] },
      { id: 'A5', name: 'Masa tablası — kesim', type: 'Kesim', duration: 60, priority: 2, due: 700, machines: [], deps: [] },
      { id: 'A6', name: 'Masa — zımpara', type: 'Zımpara', duration: 40, priority: 2, due: 780, machines: [], deps: ['A5'] },
      { id: 'A7', name: 'Masa — boya', type: 'Boya', duration: 50, priority: 2, due: 880, machines: [], deps: ['A6'] },
      { id: 'A8', name: 'Masa — montaj', type: 'Montaj', duration: 50, priority: 2, due: 960, machines: [], deps: ['A7'] },
      { id: 'A9', name: 'Dolap gövdesi — kesim', type: 'Kesim', duration: 90, priority: 5, due: 660, machines: [], deps: [] },
      { id: 'A10', name: 'Dolap — zımpara', type: 'Zımpara', duration: 45, priority: 5, due: 800, machines: [], deps: ['A9'] },
      { id: 'A11', name: 'Dolap — boya', type: 'Boya', duration: 70, priority: 5, due: 900, machines: [], deps: ['A10'] },
      { id: 'A12', name: 'Dolap — montaj', type: 'Montaj', duration: 60, priority: 5, due: 1020, machines: [], deps: ['A11'] }
    ];
    return { ad: 'Mobilya Atölyesi', jobs: isler, machines: makineler };
  }

  function B() {
    var makineler = [
      { id: 'TS', name: 'Tasarım İstasyonu', types: ['Tasarım'], start: 540, end: 1080, available: true, maintenance: [] },
      { id: 'BS1', name: 'Baskı 1', types: ['Baskı'], start: 480, end: 1080, available: true,
        maintenance: [{ start: 900, end: 960, reason: 'Kalibrasyon' }] },
      { id: 'BS2', name: 'Baskı 2', types: ['Baskı'], start: 480, end: 1080, available: true, maintenance: [] },
      { id: 'LM', name: 'Laminasyon', types: ['Laminasyon'], start: 480, end: 1140, available: true, maintenance: [] },
      { id: 'PK', name: 'Paketleme', types: ['Paketleme', 'Laminasyon'], start: 480, end: 1140, available: true, maintenance: [] }
    ];
    var isler = [
      { id: 'B1', name: 'Katalog — tasarım', type: 'Tasarım', duration: 90, priority: 4, due: 660, machines: [], deps: [] },
      { id: 'B2', name: 'Katalog — baskı', type: 'Baskı', duration: 120, priority: 4, due: 840, machines: [], deps: ['B1'] },
      { id: 'B3', name: 'Katalog — laminasyon', type: 'Laminasyon', duration: 60, priority: 4, due: 930, machines: [], deps: ['B2'] },
      { id: 'B4', name: 'Katalog — paketleme', type: 'Paketleme', duration: 45, priority: 4, due: 1020, machines: [], deps: ['B3'] },
      { id: 'B5', name: 'Broşür — tasarım', type: 'Tasarım', duration: 60, priority: 2, due: 660, machines: [], deps: [] },
      { id: 'B6', name: 'Broşür — baskı', type: 'Baskı', duration: 90, priority: 2, due: 780, machines: [], deps: ['B5'] },
      { id: 'B7', name: 'Broşür — laminasyon', type: 'Laminasyon', duration: 45, priority: 2, due: 900, machines: [], deps: ['B6'] },
      { id: 'B8', name: 'Broşür — paketleme', type: 'Paketleme', duration: 30, priority: 2, due: 960, machines: [], deps: ['B7'] },
      { id: 'B9', name: 'Afiş — tasarım', type: 'Tasarım', duration: 75, priority: 5, due: 720, machines: [], deps: [] },
      { id: 'B10', name: 'Afiş — baskı', type: 'Baskı', duration: 100, priority: 5, due: 900, machines: [], deps: ['B9'] },
      { id: 'B11', name: 'Afiş — paketleme', type: 'Paketleme', duration: 35, priority: 5, due: 1020, machines: [], deps: ['B10'] },
      { id: 'B12', name: 'Etiket — tasarım', type: 'Tasarım', duration: 45, priority: 3, due: 780, machines: [], deps: [] },
      { id: 'B13', name: 'Etiket — baskı', type: 'Baskı', duration: 70, priority: 3, due: 960, machines: [], deps: ['B12'] }
    ];
    return { ad: 'Matbaa', jobs: isler, machines: makineler };
  }

  function C() {
    var makineler = [
      { id: 'K1', name: 'Hücre 1', types: ['Kesim', 'Montaj'], start: 480, end: 1080, available: true, maintenance: [] },
      { id: 'K2', name: 'Hücre 2', types: ['Kesim', 'Boya'], start: 480, end: 1080, available: true, maintenance: [] },
      { id: 'K3', name: 'Hücre 3', types: ['Boya', 'Paket'], start: 480, end: 1140, available: true,
        maintenance: [{ start: 600, end: 660, reason: 'Arıza (10:00–11:00)' }] },
      { id: 'K4', name: 'Hücre 4', types: ['Montaj', 'Paket'], start: 420, end: 1020, available: true, maintenance: [] }
    ];
    var turler = ['Kesim', 'Boya', 'Montaj', 'Paket'];
    var isler = [];
    for (var i = 1; i <= 20; i++) {
      var tur = turler[(i - 1) % 4];
      isler.push({
        id: 'J' + i,
        name: 'Kaos işi ' + i,
        type: tur,
        duration: 20 + ((i * 17) % 60),
        priority: 1 + ((i * 7) % 5),
        due: 540 + i * 25,
        machines: [],
        deps: i > 4 ? ['J' + (i - 4)] : []
      });
    }
    return { ad: 'Kaos Testi (20 iş / 4 makine)', jobs: isler, machines: makineler };
  }

  global.NumexSenaryolar = { A: A, B: B, C: C };
})(typeof window !== 'undefined' ? window : globalThis);
