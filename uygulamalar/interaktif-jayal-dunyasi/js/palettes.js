/* Numex Dream Studio — renk paletleri (veri katmanı) */
(function () {
  'use strict';
  const NS = (window.NDS = window.NDS || {});

  function hexToRgb(hex) {
    let h = hex.replace('#', '');
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    const v = parseInt(h, 16);
    return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
  }
  function lerp(a, b, t) { return a + (b - a) * t; }

  const RAW = [
    { id: 'nebula',   name: 'Nebula',        bg: '#07040f', stops: ['#ff2fb0', '#a855f7', '#5b7cfa', '#22d3ee', '#ffd6f5'] },
    { id: 'gold',     name: 'Altın Tozu',    bg: '#0b0703', stops: ['#9a5614', '#e8a33d', '#ffd479', '#fff3c4', '#ff8a3d'] },
    { id: 'ice',      name: 'Buz',           bg: '#03080f', stops: ['#0e4a7a', '#2ea8ff', '#7fe8ff', '#eafcff', '#4b6bff'] },
    { id: 'rose',     name: 'Gül',           bg: '#0d0409', stops: ['#7a0b3d', '#e01f6b', '#ff6f9c', '#ffd0dd', '#b41d9c'] },
    { id: 'emerald',  name: 'Zümrüt',        bg: '#030c08', stops: ['#0b5c42', '#17b978', '#6ef7c0', '#e8fff5', '#128f9e'] },
    { id: 'sunset',   name: 'Gün Batımı',    bg: '#0d0507', stops: ['#ff5a3c', '#ff9a3c', '#ffd166', '#ff4d8d', '#8a2be2'] },
    { id: 'aurora',   name: 'Kutup Işığı',   bg: '#040a10', stops: ['#00ffc6', '#3ddc97', '#4b8bff', '#b06bff', '#e9fff9'] }
  ];

  const LUT_SIZE = 16;

  function build(p) {
    const rgbs = p.stops.map(hexToRgb);
    const lut = [];
    for (let i = 0; i < LUT_SIZE; i++) {
      const t = (i / (LUT_SIZE - 1)) * (rgbs.length - 1);
      const i0 = Math.floor(t);
      const i1 = Math.min(rgbs.length - 1, i0 + 1);
      const f = t - i0;
      const c = [0, 1, 2].map(k => Math.round(lerp(rgbs[i0][k], rgbs[i1][k], f)));
      lut.push({ rgb: c, css: 'rgb(' + c[0] + ',' + c[1] + ',' + c[2] + ')' });
    }
    const bg = hexToRgb(p.bg);
    return {
      id: p.id,
      name: p.name,
      // NUMEX-DÜZELTME (2026-11-15): buildPaletteSwatches p.stops.join(',') çağırıyordu ama üretilen palet nesnesi stops alanını taşımıyordu → TypeError ile boot yarıda kalıyor, sahne boş kalıyordu (0 parçacık). stops alanını taşıyarak düzeltildi.
      stops: p.stops.slice(),   // arayüz palet kutularını bundan üretir
      bg: p.bg,
      bgRgb: bg[0] + ',' + bg[1] + ',' + bg[2],
      lut: lut
    };
  }

  NS.PALETTES = RAW.map(build);
})();
