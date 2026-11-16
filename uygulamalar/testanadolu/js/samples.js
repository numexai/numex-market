/* Anadolu Atölyesi — hazır kompozisyonlar
   Her örnek, katmanları tek tek düzenlenebilir gerçek bir belgedir (düz görüntü değil). */

(function (global) {
  'use strict';

  function k(tip, ek) {
    return Object.assign({
      tip: tip,
      ad: null,
      x: 500, y: 500, r: 160, olcek: 1, aci: 0,
      cizgi: 3, bosluk: 8,
      dolgu: '#1e5f9e', cizgiRenk: '#123a63',
      gorunur: true
    }, ek || {});
  }

  const ORNEKLER = [
    {
      id: 'selcuklu-yildizi',
      ad: 'Selçuklu Yıldızı',
      aciklama: 'Sekiz katlı radyal düzende yıldız ve rozet katmanları.',
      belge: { ad: 'Selçuklu Yıldızı', arka: '#f6f3ea', palet: 'selcuklu', simetri: { mod: 'radyal', n: 8, aci: 0 } },
      katmanlar: [
        k('yildiz8', { ad: 'Yıldız gövdesi', x: 500, y: 500, r: 260, cizgi: 4, bosluk: 10, dolgu: '#f3ead8', cizgiRenk: '#0d5c53' }),
        k('rozet', { ad: 'İç rozet', x: 500, y: 500, r: 96, cizgi: 2.6, bosluk: 6, dolgu: '#b8892b', cizgiRenk: '#0d5c53' }),
        k('damla', { ad: 'Çevre damlaları', x: 500, y: 500, r: 78, olcek: 1, aci: 0, cizgi: 2, bosluk: 5, dolgu: '#1f8f86', cizgiRenk: '#0d5c53' })
      ]
    },
    {
      id: 'iznik-bahcesi',
      ad: 'İznik Bahçesi',
      aciklama: 'Çini kompozisyonu düzeninde çiçek ve bordür.',
      belge: { ad: 'İznik Bahçesi', arka: '#f6f3ea', palet: 'iznik', simetri: { mod: 'radyal', n: 6, aci: 0 } },
      katmanlar: [
        k('cini', { ad: 'Çiçek', x: 500, y: 500, r: 200, cizgi: 3, bosluk: 8, dolgu: '#2b8ec4', cizgiRenk: '#1e5f9e' }),
        k('halka', { ad: 'Halka bordür', x: 500, y: 500, r: 300, cizgi: 2.2, bosluk: 10, dolgu: '#f6f3ea', cizgiRenk: '#1e5f9e' }),
        k('cini', { ad: 'Dış çiçekler', x: 300, y: 300, r: 84, cizgi: 2, bosluk: 4, dolgu: '#c9a227', cizgiRenk: '#123a63' })
      ]
    },
    {
      id: 'gecme-kafes',
      ad: 'Geçme Kafes',
      aciklama: 'Karo tekrarıyla döşenmiş geometrik geçme ızgarası.',
      belge: { ad: 'Geçme Kafes', arka: '#f6f3ea', palet: 'selcuklu', simetri: { mod: 'karo', n: 8, aci: 0 }, karo: { kol: 3, sat: 3 } },
      katmanlar: [
        k('gecme', { ad: 'Geçme birimi', x: 500, y: 500, r: 150, cizgi: 3.2, bosluk: 6, dolgu: '#1f8f86', cizgiRenk: '#0d5c53' }),
        k('baklava', { ad: 'Merkez baklava', x: 500, y: 500, r: 46, cizgi: 1.8, bosluk: 2, dolgu: '#b8892b', cizgiRenk: '#0d5c53' })
      ]
    },
    {
      id: 'gece-rozeti',
      ad: 'Gece Rozeti',
      aciklama: 'On iki katlı simetride ince çizgili rozet kompozisyonu.',
      belge: { ad: 'Gece Rozeti', arka: '#eef2f6', palet: 'gece', simetri: { mod: 'radyal', n: 12, aci: 0 } },
      katmanlar: [
        k('rozet', { ad: 'Büyük rozet', x: 500, y: 500, r: 240, cizgi: 2.4, bosluk: 14, dolgu: '#2f6d8c', cizgiRenk: '#1b3b5f' }),
        k('yildiz8', { ad: 'Yıldız çekirdek', x: 500, y: 500, r: 120, cizgi: 2, bosluk: 5, dolgu: '#c9a227', cizgiRenk: '#1b3b5f' }),
        k('halka', { ad: 'Halka hattı', x: 500, y: 500, r: 330, cizgi: 1.6, bosluk: 12, dolgu: '#eef2f6', cizgiRenk: '#1b3b5f' })
      ]
    },
    {
      id: 'toprak-baklavasi',
      ad: 'Toprak Baklavası',
      aciklama: 'İkiye iki karo düzeninde dörtgen ızgara ve çevre yıldızları.',
      belge: { ad: 'Toprak Baklavası', arka: '#f2e7d8', palet: 'toprak', simetri: { mod: 'karo', n: 8, aci: 0 }, karo: { kol: 2, sat: 2 } },
      katmanlar: [
        k('baklava', { ad: 'Dörtgen ızgara', x: 500, y: 500, r: 220, cizgi: 3, bosluk: 12, dolgu: '#b9723f', cizgiRenk: '#5d3a26' }),
        k('yildiz8', { ad: 'Köşe yıldızı', x: 140, y: 140, r: 70, cizgi: 2, bosluk: 4, dolgu: '#d9a35f', cizgiRenk: '#8a4b2a' })
      ]
    },
    {
      id: 'damla-bordur',
      ad: 'Damla Bordür',
      aciklama: 'On iki katlı düzende damla ve halka bordür kurgusu.',
      belge: { ad: 'Damla Bordür', arka: '#f6f3ea', palet: 'iznik', simetri: { mod: 'radyal', n: 6, aci: 0 } },
      katmanlar: [
        k('damla', { ad: 'Damla halkası', x: 500, y: 500, r: 300, cizgi: 1.8, bosluk: 16, dolgu: '#2b8ec4', cizgiRenk: '#1e5f9e' }),
        k('halka', { ad: 'Merkez halka', x: 500, y: 500, r: 120, cizgi: 1.6, bosluk: 14, dolgu: '#f6f3ea', cizgiRenk: '#1e5f9e' }),
        k('rozet', { ad: 'Küçük rozet', x: 500, y: 500, r: 62, cizgi: 1.4, bosluk: 4, dolgu: '#c9a227', cizgiRenk: '#123a63' })
      ]
    }
  ];

  global.Ornekler = ORNEKLER;
})(window);
