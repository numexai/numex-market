/**
 * anatomy.js — Anatomik Yerlesim Verisi
 * ---------------------------------------------------------------
 * Vucut silueti, organ konumlari, damar yollari ve sinir yollari.
 * TUM koordinatlar 0..1 normalize "sahne uzayinda" tanimlidir;
 * render katmani bunlari canvas boyutuna olcekler.
 * 0,0 = sol-ust; 0.5,0 = vucudun dikey orta ekseni.
 * ---------------------------------------------------------------
 */
(function (root) {
  'use strict';

  // --- Vucut silueti (kapali path, saat yonu) ---
  const BODY_OUTLINE = [
    [0.500, 0.030], // bas tepesi
    [0.548, 0.038],
    [0.572, 0.062],
    [0.578, 0.092], // sag yanak
    [0.568, 0.118],
    [0.552, 0.132], // cene alti
    [0.560, 0.148], // boyun
    [0.585, 0.158], // sag omuz baslangic
    [0.635, 0.178],
    [0.658, 0.232], // sag omuz bitis
    [0.648, 0.300], // sag kol ust
    [0.632, 0.395],
    [0.618, 0.470], // dirsek
    [0.606, 0.560],
    [0.598, 0.640], // bilek
    [0.612, 0.680], // sag el
    [0.588, 0.700],
    [0.566, 0.660],
    [0.572, 0.560],
    [0.584, 0.450],
    [0.596, 0.360],
    [0.610, 0.300], // sag kol ic
    [0.596, 0.268], // koltuk alti
    [0.588, 0.330],
    [0.596, 0.420], // bel
    [0.600, 0.520], // kalca
    [0.612, 0.600],
    [0.616, 0.700], // sag bacak
    [0.618, 0.800],
    [0.612, 0.880], // ayak bilegi
    [0.640, 0.915], // sag ayak
    [0.628, 0.940],
    [0.578, 0.930],
    [0.566, 0.860],
    [0.556, 0.760],
    [0.548, 0.660],
    [0.540, 0.590], // kasik
    [0.500, 0.600],
    [0.460, 0.590],
    [0.452, 0.660],
    [0.444, 0.760],
    [0.434, 0.860],
    [0.422, 0.930],
    [0.372, 0.940],
    [0.360, 0.915],
    [0.388, 0.880], // sol ayak bilegi
    [0.382, 0.800],
    [0.384, 0.700],
    [0.388, 0.600],
    [0.400, 0.520], // kalca
    [0.404, 0.420], // bel
    [0.412, 0.330],
    [0.404, 0.268], // koltuk alti
    [0.390, 0.300],
    [0.404, 0.360],
    [0.416, 0.450],
    [0.428, 0.560],
    [0.434, 0.660],
    [0.412, 0.700],
    [0.388, 0.680], // sol el
    [0.402, 0.640],
    [0.394, 0.560],
    [0.382, 0.470], // dirsek
    [0.368, 0.395],
    [0.352, 0.300],
    [0.342, 0.232],
    [0.365, 0.178],
    [0.415, 0.158],
    [0.440, 0.148],
    [0.448, 0.132],
    [0.432, 0.118],
    [0.422, 0.092],
    [0.428, 0.062],
    [0.452, 0.038]
  ];

  // --- Organlar ---
  const ORGANS = {
    brain: {
      cx: 0.500, cy: 0.078, rx: 0.052, ry: 0.045,
      label: 'Beyin'
    },
    cerebellum: {
      cx: 0.500, cy: 0.112, rx: 0.032, ry: 0.016,
      label: 'Beyincik'
    },
    spinalCord: {
      x: 0.500, y1: 0.132, y2: 0.560, width: 0.014,
      label: 'Omurilik'
    },
    heart: {
      cx: 0.478, cy: 0.262, r: 0.036,
      label: 'Kalp'
    },
    lungL: {
      cx: 0.428, cy: 0.248, rx: 0.048, ry: 0.062,
      label: 'Sol Akciger'
    },
    lungR: {
      cx: 0.556, cy: 0.248, rx: 0.048, ry: 0.062,
      label: 'Sag Akciger'
    },
    diaphragm: {
      cx: 0.500, cy: 0.322, rx: 0.088, ry: 0.020,
      label: 'Diyafram'
    }
  };

  // --- Kan dolasim yollari (normalize nokta dizileri) ---
  // tip: 'artery' (kirmizi, kalpten dista) | 'vein' (mavi, kalbe donus)
  const VESSELS = [
    {
      id: 'aorta',
      type: 'artery',
      calibre: 3.2,
      pts: [
        [0.478, 0.255], [0.486, 0.215], [0.494, 0.180], [0.498, 0.150],
        [0.500, 0.140]
      ]
    },
    {
      id: 'aorta-down',
      type: 'artery',
      calibre: 3.0,
      pts: [
        [0.478, 0.270], [0.478, 0.310], [0.480, 0.380], [0.484, 0.460],
        [0.490, 0.545], [0.492, 0.580]
      ]
    },
    {
      id: 'carotid',
      type: 'artery',
      calibre: 1.6,
      pts: [[0.498, 0.148], [0.499, 0.128], [0.500, 0.116]]
    },
    {
      id: 'arm-r',
      type: 'artery',
      calibre: 1.5,
      pts: [[0.494, 0.175], [0.540, 0.200], [0.590, 0.238], [0.628, 0.290]]
    },
    {
      id: 'arm-r-low',
      type: 'artery',
      calibre: 1.1,
      pts: [[0.628, 0.290], [0.640, 0.372], [0.628, 0.462], [0.614, 0.560]]
    },
    {
      id: 'arm-l',
      type: 'artery',
      calibre: 1.5,
      pts: [[0.462, 0.175], [0.416, 0.200], [0.366, 0.238], [0.328, 0.290]]
    },
    {
      id: 'arm-l-low',
      type: 'artery',
      calibre: 1.1,
      pts: [[0.328, 0.290], [0.316, 0.372], [0.328, 0.462], [0.342, 0.560]]
    },
    {
      id: 'leg-r',
      type: 'artery',
      calibre: 2.0,
      pts: [[0.494, 0.582], [0.560, 0.610], [0.600, 0.660], [0.608, 0.750]]
    },
    {
      id: 'leg-r-low',
      type: 'artery',
      calibre: 1.2,
      pts: [[0.608, 0.750], [0.610, 0.820], [0.606, 0.878]]
    },
    {
      id: 'leg-l',
      type: 'artery',
      calibre: 2.0,
      pts: [[0.486, 0.582], [0.440, 0.610], [0.400, 0.660], [0.392, 0.750]]
    },
    {
      id: 'leg-l-low',
      type: 'artery',
      calibre: 1.2,
      pts: [[0.392, 0.750], [0.390, 0.820], [0.394, 0.878]]
    },

    // --- Toplardamarlar (mavi, kalbe donus) ---
    {
      id: 'vena-cava',
      type: 'vein',
      calibre: 3.2,
      pts: [
        [0.516, 0.140], [0.518, 0.190], [0.520, 0.262]
      ]
    },
    {
      id: 'vena-cava-down',
      type: 'vein',
      calibre: 2.6,
      pts: [[0.522, 0.268], [0.524, 0.360], [0.522, 0.460], [0.516, 0.575]]
    },
    {
      id: 'jugular',
      type: 'vein',
      calibre: 1.4,
      pts: [[0.514, 0.140], [0.514, 0.122], [0.512, 0.112]]
    },
    {
      id: 'varm-r',
      type: 'vein',
      calibre: 1.3,
      pts: [[0.512, 0.180], [0.556, 0.206], [0.604, 0.244], [0.634, 0.296]]
    },
    {
      id: 'varm-r-low',
      type: 'vein',
      calibre: 1.0,
      pts: [[0.634, 0.296], [0.644, 0.378], [0.634, 0.468], [0.620, 0.564]]
    },
    {
      id: 'varm-l',
      type: 'vein',
      calibre: 1.3,
      pts: [[0.488, 0.180], [0.444, 0.206], [0.396, 0.244], [0.366, 0.296]]
    },
    {
      id: 'varm-l-low',
      type: 'vein',
      calibre: 1.0,
      pts: [[0.366, 0.296], [0.356, 0.378], [0.366, 0.468], [0.380, 0.564]]
    },
    {
      id: 'vleg-r',
      type: 'vein',
      calibre: 1.8,
      pts: [[0.516, 0.578], [0.572, 0.606], [0.612, 0.664], [0.618, 0.752]]
    },
    {
      id: 'vleg-r-low',
      type: 'vein',
      calibre: 1.1,
      pts: [[0.618, 0.752], [0.620, 0.822], [0.616, 0.880]]
    },
    {
      id: 'vleg-l',
      type: 'vein',
      calibre: 1.8,
      pts: [[0.484, 0.578], [0.428, 0.606], [0.388, 0.664], [0.382, 0.752]]
    },
    {
      id: 'vleg-l-low',
      type: 'vein',
      calibre: 1.1,
      pts: [[0.382, 0.752], [0.380, 0.822], [0.384, 0.880]]
    },
    {
      id: 'pulmonary',
      type: 'vein',
      calibre: 2.0,
      pts: [[0.456, 0.250], [0.428, 0.240], [0.428, 0.262], [0.456, 0.268]]
    },
    {
      id: 'pulmonary-r',
      type: 'vein',
      calibre: 2.0,
      pts: [[0.500, 0.250], [0.540, 0.240], [0.556, 0.262], [0.512, 0.272]]
    }
  ];

  // --- Sinir yollari (beyinden/omurilikten cikip hedefe gider) ---
  // Duyusal = beyinden disa giden algilama; motor = komut yolu.
  const NERVES = [
    {
      id: 'n-head',
      target: 'head',
      type: 'sensory',
      pts: [[0.500, 0.100], [0.500, 0.078], [0.512, 0.065]]
    },
    {
      id: 'n-chest',
      target: 'chest',
      type: 'sensory',
      pts: [[0.500, 0.200], [0.500, 0.240], [0.482, 0.262]]
    },
    {
      id: 'n-rarm',
      target: 'rarm',
      type: 'motor',
      pts: [[0.500, 0.190], [0.556, 0.212], [0.606, 0.252], [0.634, 0.300]]
    },
    {
      id: 'n-larm',
      target: 'larm',
      type: 'motor',
      pts: [[0.500, 0.190], [0.444, 0.212], [0.394, 0.252], [0.366, 0.300]]
    },
    {
      id: 'n-rhand',
      target: 'rhand',
      type: 'sensory',
      pts: [[0.500, 0.190], [0.556, 0.212], [0.618, 0.290], [0.646, 0.392],
            [0.632, 0.480], [0.616, 0.572], [0.600, 0.640]]
    },
    {
      id: 'n-lhand',
      target: 'lhand',
      type: 'sensory',
      pts: [[0.500, 0.190], [0.444, 0.212], [0.382, 0.290], [0.354, 0.392],
            [0.368, 0.480], [0.384, 0.572], [0.400, 0.640]]
    },
    {
      id: 'n-rleg',
      target: 'rleg',
      type: 'motor',
      pts: [[0.500, 0.400], [0.516, 0.480], [0.536, 0.560], [0.584, 0.632],
            [0.606, 0.720], [0.610, 0.800]]
    },
    {
      id: 'n-lleg',
      target: 'lleg',
      type: 'motor',
      pts: [[0.500, 0.400], [0.484, 0.480], [0.464, 0.560], [0.416, 0.632],
            [0.394, 0.720], [0.390, 0.800]]
    },
    {
      id: 'n-rfoot',
      target: 'rfoot',
      type: 'sensory',
      pts: [[0.500, 0.400], [0.516, 0.480], [0.548, 0.575], [0.602, 0.660],
            [0.616, 0.770], [0.614, 0.868], [0.632, 0.908]]
    },
    {
      id: 'n-lfoot',
      target: 'lfoot',
      type: 'sensory',
      pts: [[0.500, 0.400], [0.484, 0.480], [0.452, 0.575], [0.398, 0.660],
            [0.384, 0.770], [0.386, 0.868], [0.368, 0.908]]
    }
  ];

  /** Hedefe tiklanabilir bolge (organ veya sinir yolu ucu). */
  const CLICK_ZONES = [
    { id: 'head',  cx: 0.500, cy: 0.078, rx: 0.075, ry: 0.070 },
    { id: 'chest', cx: 0.478, cy: 0.262, rx: 0.070, ry: 0.055 },
    { id: 'rarm',  cx: 0.632, cy: 0.300, rx: 0.032, ry: 0.075 },
    { id: 'larm',  cx: 0.368, cy: 0.300, rx: 0.032, ry: 0.075 },
    { id: 'rhand', cx: 0.606, cy: 0.660, rx: 0.038, ry: 0.045 },
    { id: 'lhand', cx: 0.394, cy: 0.660, rx: 0.038, ry: 0.045 },
    { id: 'rleg',  cx: 0.606, cy: 0.740, rx: 0.034, ry: 0.090 },
    { id: 'lleg',  cx: 0.394, cy: 0.740, rx: 0.034, ry: 0.090 },
    { id: 'rfoot', cx: 0.600, cy: 0.918, rx: 0.045, ry: 0.028 },
    { id: 'lfoot', cx: 0.400, cy: 0.918, rx: 0.045, ry: 0.028 }
  ];

  const api = { BODY_OUTLINE, ORGANS, VESSELS, NERVES, CLICK_ZONES };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.NumexAnatomy = api;
})(typeof window !== 'undefined' ? window : globalThis);
