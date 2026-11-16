/* Numex Little Planet — üç hazır, düzenlenebilir dünya */

window.NP = window.NP || {};

(function (NP) {
  'use strict';

  const D = Math.PI / 180;

  function dir(lat, lon) {
    const a = lat * D;
    const b = lon * D;
    return [Math.cos(a) * Math.cos(b), Math.sin(a), Math.cos(a) * Math.sin(b)];
  }

  function o(type, lat, lon, scale, spin) {
    return {
      type: type,
      dir: dir(lat, lon),
      scale: scale || 1,
      spin: (spin || 0) * D
    };
  }

  NP.WORLDS = [
    {
      id: 'bahar',
      name: 'Bahar Gezegeni',
      icon: '🌷',
      desc: 'Çiçekler, koyunlar, yel değirmeni',
      surface: 0x9fd8a0,
      atmo: 0xbfe9ff,
      objects: [
        o('tepe', 22, 12, 2.1),
        o('tepe', -26, 122, 1.8),
        o('tepe', 48, -70, 1.5),
        o('gol', 4, 52, 1.4),
        o('yol', 12, 34, 1.7, 20),
        o('yol', 15, 8, 1.3, 70),
        o('ev', 20, 20, 1),
        o('ev', 24, 46, 0.86, 35),
        o('ev', 8, 62, 1.05, -20),
        o('yeldegirmeni', 33, 70, 1.1, 10),
        o('agac', 14, 6, 1),
        o('agac', 27, -12, 1.15),
        o('agac', 5, -26, 0.9),
        o('agac', -9, 36, 1.05),
        o('agac', 40, 18, 0.95),
        o('agac', -18, -42, 1.1),
        o('cicek', 11, 12, 1.2),
        o('cicek', 16, 56, 1),
        o('cicek', -2, 16, 1.3),
        o('cicek', 31, 98, 1.1),
        o('cicek', -13, 68, 1),
        o('koyun', 4, -6, 1),
        o('koyun', -7, -10, 0.9),
        o('koyun', 18, 32, 0.95),
        o('tavsan', 22, 38, 1),
        o('tavsan', 28, 58, 0.9),
        o('kus', 16, 82, 1.2),
        o('kus', -11, 22, 1),
        o('kopru', 9, 100, 1.15, 60),
        o('lamba', 13, 42, 1),
        o('lamba', 15, 10, 1),
        o('bulut', 36, 145, 1.2),
        o('bulut', -32, 92, 1.1),
        o('bulut', 22, -60, 1),
        o('bulut', -42, 12, 1.25)
      ]
    },
    {
      id: 'seker',
      name: 'Şeker Gezegeni',
      icon: '🍭',
      desc: 'Hediyeler, mantarlar, gökkuşağı',
      surface: 0xffd6e8,
      atmo: 0xffd0ea,
      objects: [
        o('gol', -8, 20, 1.3),
        o('gokkusagi', 18, 66, 1.5, 15),
        o('gokkusagi', -24, -40, 1.2, 80),
        o('hediye', 12, 8, 1.1, 25),
        o('hediye', -18, 40, 0.9, -15),
        o('hediye', 26, 34, 1.25, 60),
        o('hediye', 4, -30, 1, 10),
        o('ev', 22, -4, 0.95),
        o('ev', -6, 60, 1.05, 30),
        o('ev', 34, 90, 0.9, -25),
        o('mantar', 8, 22, 1.4),
        o('mantar', -14, 8, 1.2),
        o('mantar', 20, 52, 1.5),
        o('mantar', -32, 70, 1.1),
        o('mantar', 40, 12, 1.2),
        o('cicek', 2, 34, 1.3),
        o('cicek', -20, 26, 1.1),
        o('cicek', 30, -20, 1.2),
        o('cicek', 14, 100, 1),
        o('agac', -4, -14, 1),
        o('agac', 44, 40, 0.9),
        o('koyun', 16, -8, 0.9),
        o('tavsan', -10, 82, 1.1),
        o('kus', 24, 120, 1.2),
        o('kus', -28, -60, 1),
        o('bulut', 10, 150, 1.2),
        o('bulut', -40, 110, 1.1),
        o('bulut', 36, -90, 1.3),
        o('lamba', 20, 24, 1),
        o('lamba', -12, 48, 1)
      ]
    },
    {
      id: 'masal',
      name: 'Masal Gezegeni',
      icon: '🏰',
      desc: 'Kale, köprü, sihirli lambalar',
      surface: 0xb9e2c8,
      atmo: 0xd8c8ff,
      objects: [
        o('kale', 16, 30, 1.35, 10),
        o('kopru', 6, 4, 1.2, 75),
        o('gol', 2, -8, 1.5),
        o('tepe', 30, 62, 1.9),
        o('tepe', -20, 10, 1.6),
        o('gokkusagi', -6, 92, 1.4, 40),
        o('agac', 20, 12, 1.2),
        o('agac', 28, 44, 1),
        o('agac', 9, 50, 1.1),
        o('agac', -12, -30, 1.05),
        o('agac', 42, 20, 1.15),
        o('agac', -32, 70, 1),
        o('agac', 12, 108, 0.9),
        o('ev', 24, -14, 1.05, 20),
        o('ev', 4, 74, 0.9, -35),
        o('ev', -26, 46, 1),
        o('mantar', 0, 22, 1.5),
        o('mantar', -8, 58, 1.2),
        o('mantar', 36, 84, 1.3),
        o('lamba', 10, 20, 1.15),
        o('lamba', -2, 42, 1.05),
        o('lamba', 18, 60, 1.1),
        o('lamba', -16, -12, 1),
        o('cicek', -4, 68, 1.2),
        o('cicek', 26, 100, 1),
        o('kus', 22, 132, 1.2),
        o('kus', -34, -50, 1),
        o('bulut', -12, 130, 1.2),
        o('bulut', 34, 150, 1.1),
        o('bulut', -44, 30, 1.25),
        o('bulut', 8, -46, 1.05)
      ]
    }
  ];
})(window.NP);
