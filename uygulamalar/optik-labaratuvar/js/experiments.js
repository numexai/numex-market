// NUMEX PRİZMA — experiments.js
// A–E hazır deneyler. Her deney deterministik eleman listesi üretir.

import { makeState, makeElement } from './state.js';

const el = (tip, x, y, extra = {}) => {
  const e = makeElement(tip, x, y);
  return Object.assign(e, extra);
};

/** Dünya koordinatı: 0,0 sahne merkezi. Genişlik ~1400, yükseklik ~900 varsayımı. */
const DENEYLER = [
  {
    id: 'A',
    ad: 'Düzlem Ayna',
    aciklama: '30° gelme → 30° yansıma',
    beklenti: { gelmeDerece: 30, yansimaDerece: 30 },
    kur() {
      const st = makeState();
      st.meta.deneyId = 'A';
      st.meta.ad = 'Deney A — Düzlem Ayna';
      st.ortam = { ad: 'hava', n: 1.0003, hedefAd: 'cam', hedefN: 1.5 };
      // Ayna düşey (90°), ışın 30° gelme açısıyla çarpar
      st.elements.push(el('planeMirror', 0, 0, { angle: Math.PI / 2, length: 460 }));
      // Noktasal kaynak: normalle 30° açı → gelen ışın yönü sola doğru
      // NUMEX-DÜZELTME (2026-11-19): Deney A sahnesi görsel olarak kötü kurulmuştu: ayna sahnenin sağına düşüyor, ışın çok kısa kalıyor ve ölçüm okunmuyordu. Ayna merkeze, kaynak yeterince uzağa alınır.
      // ayna düşey (normal soldan bakar), merkezde; ışın normalle tam 30° gelir:
      // 360 px solda başlar, 360·tan30° = 207.8 px yukarıda
      st.elements.push(el('parallelSource', -360, -207.85, {
        // NUMEX-DÜZELTME (2026-11-19): Kaynağın yönü 0 (tam yatay) verilmişti; ışın aynaya paralel gidip hiç çarpmıyordu (yansıma 0). Normal ile 30 derece gelme için yön 30 derece aşağı olmalı.
        angle: Math.PI / 6, rays: 1, length: 1, wavelength: 532, color: '#7ef7a8'
      }));
      st.camera = { x: 0, y: 60, zoom: 1 };
      st.dirty = true;
      return st;
    }
  },
  {
    id: 'B',
    ad: 'Mercek ve Odak',
    aciklama: 'Paralel ışınlar yakınsak mercekte odak bölgesinde birleşir',
    beklenti: { odakMesafe: 120, paralelGiris: true },
    kur() {
      const st = makeState();
      st.meta.deneyId = 'B';
      st.meta.ad = 'Deney B — Mercek ve Odak';
      // NUMEX-DÜZELTME (2026-11-19): Deney B'de mercek 90 derece döndürülmüştü; o hâlde optik eksen düşey olur ve yatay gelen ışınlar mercek düzlemine paralel kalıp hiç kırılmıyordu (ekranda düz çizgiler, kırılma 0). Işınlar yatay olduğu için mercek açısı 0, ekran da ışınları karşılayacak düşey konumda olmalı.
      // ışınlar yatay (+x) gelir → mercek düzlemi düşey olmalı: mercek açısı 0 (düzlem x=0)
      st.elements.push(el('convergingLens', 0, 0, { f: 120, size: 240, angle: 0 }));
      st.elements.push(el('parallelSource', -380, 0, {
        angle: 0, rays: 7, length: 200, wavelength: 0
      }));
      // odak x=f=120'de; ekran odağın biraz ötesinde, ışınları düşey keser
      st.elements.push(el('screen', 300, 0, { angle: 0, length: 260 }));
      st.camera = { x: 0, y: 0, zoom: 1 };
      st.dirty = true;
      return st;
    }
  },
  {
    id: 'C',
    ad: 'Prizma',
    aciklama: 'Beyaz ışık üç renk bileşenine ayrılır (kırmızı/yeşil/mavi)',
    beklenti: { renkSayisi: 3, ayrismaVar: true },
    kur() {
      const st = makeState();
      st.meta.deneyId = 'C';
      st.meta.ad = 'Deney C — Prizma Dispersiyonu';
      // NUMEX-DÜZELTME (2026-11-19): Deney C'de ışın prizmanın tepe bölgesine çok yakın geçip sahnenin dışına çıkıyordu; ayrışan renkler ekranda okunmuyordu. Işın prizmanın ortasına, ekran da ayrışan demetin yoluna alınır; prizma biraz büyütülür.
      // NUMEX-DÜZELTME (2026-11-19): Aynı sahneye iki prizma eklenmişti (eski angle:0 satırı silinmemişti); üst üste binen iki cam gövde ışını 12 kez kırıp ayrışmayı sıfırlıyordu (ayrışma 0.000°). Tek prizma bırakıldı.
      // prizma ters (tepe aşağı) → ışın üst yüzden girer, demet aşağı-sağa sapar
      st.elements.push(el('prism', 0, 0, { size: 300, apex: 60, angle: Math.PI, n: 1.52 }));
      st.elements.push(el('parallelSource', -430, -40, {
        angle: 0, rays: 1, length: 1, wavelength: 0
      }));
      // ayrışan demet aşağı-sağa gider; ekran onu karşılar
      st.elements.push(el('screen', 400, 230, { angle: Math.PI / 2 + 0.5, length: 520 }));
      st.camera = { x: 0, y: 20, zoom: 1 };
      st.dirty = true;
      return st;
    }
  },
  {
    id: 'D',
    ad: 'Tam İç Yansıma',
    aciklama: 'Kritik açı aşılınca ışık yüzeyden tamamen yansır',
    beklenti: { kritikAci: 41.81 },
    kur() {
      const st = makeState();
      st.meta.deneyId = 'D';
      st.meta.ad = 'Deney D — Tam İç Yansıma';
      // prizma yüzeyine yüksek indisli ortamdan iki ışın: biri kritik altı, biri üstü
      st.elements.push(el('prism', 0, 0, { size: 300, apex: 90, angle: 0, n: 1.62 }));
      st.elements.push(el('pointSource', -200, -110, {
        angle: 0, spread: 70, rays: 11, wavelength: 470, color: '#7cc8ff'
      }));
      st.elements.push(el('wall', 240, 0, { angle: Math.PI / 2, length: 340 }));
      st.camera = { x: 30, y: 0, zoom: 1 };
      st.dirty = true;
      return st;
    }
  },
  {
    id: 'E',
    ad: 'Çoklu Optik Sistem',
    aciklama: 'Kaynak → mercek → ayna → ekran zinciri',
    beklenti: { elemanZinciri: ['lens', 'mirror', 'screen'] },
    kur() {
      const st = makeState();
      st.meta.deneyId = 'E';
      st.meta.ad = 'Deney E — Çoklu Optik Sistem';
      st.elements.push(el('parallelSource', -420, 0, { angle: 0, rays: 5, length: 160, wavelength: 0 }));
      // NUMEX-DÜZELTME (2026-11-19): Deney E zinciri kopuktu: mercek açısı π/2 iken optik ekseni düşey olduğundan yatay ışınlar merceği kesmiyordu; ayna ve ekran da ışın yolunun dışında kalıyordu. Mercek açısı 0 (eksen yatay), ayna ışınları karşılayacak konumda, ekran yansıyan demetin yolunda.
      // mercek açısı 0 → optik eksen yatay (+x), düzlem x=-140
      st.elements.push(el('convergingLens', -140, 0, { f: 150, size: 220, angle: 0 }));
      // ayna 45°: gelen +x ışınlarını aşağıya (+y) yansıtır
      st.elements.push(el('planeMirror', 220, 0, { angle: Math.PI / 4, length: 340 }));
      // ekran yansıyan demetin altında, yatay
      st.elements.push(el('screen', 220, 300, { angle: 0, length: 360 }));
      st.camera = { x: 0, y: 40, zoom: 1 };
      st.dirty = true;
      return st;
    }
  }
];

export { DENEYLER };

export function deneyListesi() {
  return DENEYLER.map((d) => ({ id: d.id, ad: d.ad, aciklama: d.aciklama }));
}

export function deneyBeklentisi(id) {
  const d = DENEYLER.find((x) => x.id === id);
  return d ? d.beklenti : null;
}

export function deneyYukle(id) {
  const d = DENEYLER.find((x) => x.id === id);
  if (!d) throw new Error('Bilinmeyen deney: ' + id);
  return d.kur();
}

export function bosDeney() {
  const st = makeState();
  st.meta.ad = 'Boş Deney';
  st.elements.push(el('parallelSource', -380, 0, { angle: 0, rays: 5, length: 160, wavelength: 0 }));
  st.dirty = true;
  return st;
}
