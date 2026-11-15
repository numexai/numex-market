/* ==========================================================================
   levels.js — bölümler ve hazır makineler (saf veri)
   Koordinatlar 1600×900 dünya biriminde; zemin yüzeyi y = 878.
   ========================================================================== */
(function (global) {
  'use strict';

  var FLOOR = 878;

  var LEVELS = [
    {
      id: 'l1',
      kicker: 'BÖLÜM 1',
      name: 'Bilyeyi Hedefe Ulaştır',
      desc: 'Rampadan kayan bilye boşluğa düşecek. Rampa ve blok ekleyerek onu sağ alttaki zile ulaştır.',
      goals: ['Bilye hedef ziline değsin', 'Zincir senin parçalarınla kurulsun'],
      rules: { bellByLabel: 'ball', minUserParts: 1, minDominoes: 0 },
      parts: [
        { type: 'ramp', x: 380, y: 300, a: 0.35 },
        { type: 'ball', x: 277, y: 232 },
        { type: 'bell', x: 1330, y: FLOOR - 32 }
      ]
    },
    {
      id: 'l2',
      kicker: 'BÖLÜM 2',
      name: 'Domino Zinciriyle Zili Çal',
      desc: 'Bilye rampaya bırakılınca aşağı inecek. En az 4 domino taşını dizerek düşüşü zile kadar taşı.',
      goals: ['En az 4 domino devrilsin', 'Zincir sonunda zil çalsın'],
      rules: { bellByLabel: 'domino', minUserParts: 4, minDominoes: 4, anyLabelAccepted: true },
      parts: [
        { type: 'ramp', x: 300, y: 320, a: 0.3 },
        { type: 'ball', x: 184, y: 255 },
        { type: 'bell', x: 1200, y: FLOOR - 32 }
      ]
    },
    {
      id: 'l3',
      kicker: 'BÖLÜM 3',
      name: 'Beş Parçalı Makine',
      desc: 'Sahne boş. En az 5 parça kullanarak kendi zincirleme makinanı kur ve zili çaldır. Kaldıraç, dişli, yay, makara — hepsi serbest.',
      goals: ['En az 5 parça yerleştir', 'Zil çalsın'],
      rules: { bellByLabel: null, minUserParts: 5, minDominoes: 0 },
      parts: [
        { type: 'bell', x: 1400, y: FLOOR - 32 }
      ]
    }
  ];

  /* ---------------------------------------------------------------------
     Hazır makineler — "Örnekler"
     --------------------------------------------------------------------- */
  var EXAMPLES = [
    {
      id: 'ex-domino',
      name: 'Domino Çığı',
      desc: 'Rampadan inen bilye domino dizisini devirir, son taş zili çalar.',
      rules: { bellByLabel: null, minUserParts: 0, minDominoes: 0 },
      parts: [
        { type: 'ramp', x: 400, y: 690, a: 0.25 },
        { type: 'ball', x: 295, y: 632 },
        { type: 'domino', x: 640, y: FLOOR - 37, a: 0 },
        { type: 'domino', x: 700, y: FLOOR - 37, a: 0 },
        { type: 'domino', x: 760, y: FLOOR - 37, a: 0 },
        { type: 'domino', x: 820, y: FLOOR - 37, a: 0 },
        { type: 'domino', x: 880, y: FLOOR - 37, a: 0 },
        { type: 'bell', x: 980, y: FLOOR - 32 }
      ]
    },
    {
      id: 'ex-spring',
      name: 'Yay Fırlatıcı',
      desc: 'Sıkışmış yay topu yatay fırlatır; top bloklara çarpıp zile ulaşır.',
      rules: { bellByLabel: null, minUserParts: 0, minDominoes: 0 },
      parts: [
        { type: 'spring', x: 260, y: 760, a: 1.5708 },
        { type: 'domino', x: 700, y: FLOOR - 37, a: 0 },
        { type: 'domino', x: 760, y: FLOOR - 37, a: 0 },
        { type: 'domino', x: 820, y: FLOOR - 37, a: 0 },
        { type: 'bell', x: 900, y: FLOOR - 32 }
      ]
    },
    {
      id: 'ex-machine',
      name: 'Uzun Zincir (9 parça)',
      desc: 'Tek bir bilye yedi domino taşını devirir; son taş zili çalar. Parçaları taşıyıp kendi düzenini kur.',
      rules: { bellByLabel: null, minUserParts: 0, minDominoes: 0 },
      parts: [
        { type: 'ramp', x: 340, y: 700, a: 0.22 },
        { type: 'ball', x: 255, y: 650 },
        { type: 'domino', x: 600, y: FLOOR - 37, a: 0 },
        { type: 'domino', x: 660, y: FLOOR - 37, a: 0 },
        { type: 'domino', x: 720, y: FLOOR - 37, a: 0 },
        { type: 'domino', x: 780, y: FLOOR - 37, a: 0 },
        { type: 'domino', x: 840, y: FLOOR - 37, a: 0 },
        { type: 'domino', x: 900, y: FLOOR - 37, a: 0 },
        { type: 'domino', x: 960, y: FLOOR - 37, a: 0 },
        { type: 'bell', x: 1050, y: FLOOR - 32 }
      ]
    }
  ];

  /* Serbest atölye */
  var SANDBOX = {
    id: 'free',
    kicker: 'SERBEST ATÖLYE',
    name: 'Kendi makinanı kur',
    desc: 'Hiçbir kural yok. Parçaları yerleştir, çalıştır, izle.',
    goals: ['Zili çaldır'],
    rules: { bellByLabel: null, minUserParts: 0, minDominoes: 0 },
    parts: [
      { type: 'bell', x: 1400, y: FLOOR - 32 }
    ]
  };

  global.NumexLevels = { LEVELS: LEVELS, EXAMPLES: EXAMPLES, SANDBOX: SANDBOX, FLOOR: FLOOR };
})(window);
