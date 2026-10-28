/**
 * Numex Candy — Bölüm (seviye) tanımları
 * ------------------------------------------------------------
 * Her bölüm bir hedef, bir hamle bütçesi ve tahta düzeni tanımlar.
 * Zorluk eğrisi kademeli: ilk bölümler rahat, sona doğru sıkışır.
 *
 * Hedef tipleri:
 *   - "score"  : belirtilen puana ulaş
 *   - "collect": belirtilen renkten N adet topla
 *   - "clear"  : belirtilen sayıda buz/engel kır
 *
 * Engel tipleri (hücre üzerinde):
 *   - "jelly"  : hücrenin üstündeki jel; o hücrede eşleşme olursa kırılır (1 kat)
 *   - "block"  : tamamen kapalı hücre, oyun alanı dışı
 *
 * Numex AI Bilişim Teknolojileri tarafından geliştirildi.
 */

// Şeker renkleri — tahtada kullanılan temel çeşitler
export const CANDY_TYPES = Object.freeze([
  { id: 0, ad: 'yakut', renk: '#ef4444', sekil: 'kare' },
  { id: 1, ad: 'limon', renk: '#facc15', sekil: 'daire' },
  { id: 2, ad: 'nane', renk: '#22c55e', sekil: 'baklava' },
  { id: 3, ad: 'gok', renk: '#3b82f6', sekil: 'kare' },
  { id: 4, ad: 'uzum', renk: '#a855f7', sekil: 'daire' },
  { id: 5, ad: 'portakal', renk: '#f97316', sekil: 'baklava' },
]);

const T = (id) => id;

/**
 * Bölüm üretim yardımcıları.
 * `alan(...)` bir dikdörtgen hücre bloğunu açar,
 * `engel(...)` ise alanı bloklar. Satır satır harita gibi.
 */
function bosTahta(satir, sutun) {
  return Array.from({ length: satir }, () =>
    Array.from({ length: sutun }, () => null)
  );
}

/** Dikdörtgen içindeki tüm hücreleri verilen tiple doldurur. */
function doldur(tahta, r1, c1, r2, c2, tip = 'normal') {
  for (let r = r1; r <= r2; r++) {
    for (let c = c1; c <= c2; c++) {
      if (tahta[r] && tahta[r][c] !== undefined) tahta[r][c] = tip;
    }
  }
}

/** Belirtilen hücreleri "block" yapar (oyun alanı dışı). */
function blokla(tahta, hucreler) {
  for (const [r, c] of hucreler) {
    if (tahta[r] && tahta[r][c] !== undefined) tahta[r][c] = 'block';
  }
}

/** Jel döşer — kırılması gereken hedef hücreler. */
function jelDose(tahta, r1, c1, r2, c2) {
  const jel = [];
  for (let r = r1; r <= r2; r++) {
    for (let c = c1; c <= c2; c++) {
      if (tahta[r] && tahta[r][c] === 'normal') jel.push(`${r}:${c}`);
    }
  }
  return jel;
}

/**
 * BÖLÜMLER
 * satir/sutun: tahta boyutu
 * hamle: oyuncunun hamle bütçesi
 * hedefler: [{ tip, renk?, adet }]
 * yildizlar: [1, 2, 3 yıldız puan eşikleri]
 */
export const LEVELS = [
  {
    id: 1,
    ad: 'İlk Şeker',
    satir: 8,
    sutun: 8,
    hamle: 25,
    yildizlar: [2000, 4000, 6000],
    hedefler: [{ tip: 'score', adet: 2000 }],
    uret: () => {
      const t = bosTahta(8, 8);
      doldur(t, 0, 0, 7, 7, 'normal');
      return { tahta: t, jel: [] };
    },
  },
  {
    id: 2,
    ad: 'İkili Hedef',
    satir: 8,
    sutun: 8,
    hamle: 22,
    yildizlar: [3000, 5500, 8000],
    hedefler: [{ tip: 'score', adet: 3000 }],
    uret: () => {
      const t = bosTahta(8, 8);
      doldur(t, 0, 0, 7, 7, 'normal');
      return { tahta: t, jel: [] };
    },
  },
  {
    id: 3,
    ad: 'Yakut Avı',
    satir: 8,
    sutun: 8,
    hamle: 20,
    yildizlar: [3000, 6000, 9000],
    hedefler: [{ tip: 'collect', renk: T(0), adet: 20 }],
    uret: () => {
      const t = bosTahta(8, 8);
      doldur(t, 0, 0, 7, 7, 'normal');
      return { tahta: t, jel: [] };
    },
  },
  {
    id: 4,
    ad: 'Jel Bahçesi',
    satir: 9,
    sutun: 9,
    hamle: 24,
    yildizlar: [4000, 7500, 11000],
    hedefler: [],
    uret: () => {
      const t = bosTahta(9, 9);
      doldur(t, 0, 0, 8, 8, 'normal');
      const jel = jelDose(t, 0, 0, 8, 8);
      return { tahta: t, jel };
    },
  },
  {
    id: 5,
    ad: 'Dar Geçit',
    satir: 9,
    sutun: 9,
    hamle: 22,
    yildizlar: [4500, 8000, 12000],
    hedefler: [{ tip: 'score', adet: 4500 }],
    uret: () => {
      const t = bosTahta(9, 9);
      doldur(t, 0, 0, 8, 8, 'normal');
      // ortadaki 3x3 bölgeyi blokla — oyuncu kenarlardan oynamak zorunda
      blokla(t, [
        [3, 3], [3, 4], [3, 5],
        [4, 3], [4, 4], [4, 5],
        [5, 3], [5, 4], [5, 5],
      ]);
      return { tahta: t, jel: [] };
    },
  },
  {
    id: 6,
    ad: 'Portakal Hasadı',
    satir: 9,
    sutun: 9,
    hamle: 20,
    yildizlar: [4000, 7000, 10500],
    hedefler: [{ tip: 'collect', renk: T(5), adet: 25 }],
    uret: () => {
      const t = bosTahta(9, 9);
      doldur(t, 0, 0, 8, 8, 'normal');
      return { tahta: t, jel: [] };
    },
  },
  {
    id: 7,
    ad: 'Dama Deseni',
    satir: 9,
    sutun: 9,
    hamle: 23,
    yildizlar: [5000, 9000, 13000],
    hedefler: [{ tip: 'score', adet: 5000 }],
    uret: () => {
      const t = bosTahta(9, 9);
      doldur(t, 0, 0, 8, 8, 'normal');
      // satranç deseni engel
      const engeller = [];
      for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
          if ((r + c) % 4 === 0 && r % 3 !== 0) engeller.push([r, c]);
        }
      }
      blokla(t, engeller);
      return { tahta: t, jel: [] };
    },
  },
  {
    id: 8,
    ad: 'Yeşil Vadi',
    satir: 9,
    sutun: 9,
    hamle: 21,
    yildizlar: [5000, 8500, 12500],
    hedefler: [{ tip: 'collect', renk: T(2), adet: 28 }],
    uret: () => {
      const t = bosTahta(9, 9);
      doldur(t, 0, 0, 8, 8, 'normal');
      return { tahta: t, jel: [] };
    },
  },
  {
    id: 9,
    ad: 'Halka',
    satir: 9,
    sutun: 9,
    hamle: 22,
    yildizlar: [5500, 9500, 14000],
    hedefler: [{ tip: 'score', adet: 5500 }],
    uret: () => {
      const t = bosTahta(9, 9);
      doldur(t, 0, 0, 8, 8, 'normal');
      // ortada halka şeklinde blok
      blokla(t, [
        [2, 2], [2, 3], [2, 4], [2, 5], [2, 6],
        [3, 2], [3, 6],
        [4, 2], [4, 6],
        [5, 2], [5, 6],
        [6, 2], [6, 3], [6, 4], [6, 5], [6, 6],
      ]);
      return { tahta: t, jel: [] };
    },
  },
  {
    id: 10,
    ad: 'Çift Jel',
    satir: 9,
    sutun: 9,
    hamle: 24,
    yildizlar: [6000, 10000, 15000],
    hedefler: [],
    uret: () => {
      const t = bosTahta(9, 9);
      doldur(t, 0, 0, 8, 8, 'normal');
      const jel = jelDose(t, 2, 2, 6, 6);
      return { tahta: t, jel };
    },
  },
  {
    id: 11,
    ad: 'Koridor',
    satir: 10,
    sutun: 9,
    hamle: 23,
    yildizlar: [6000, 10500, 15500],
    hedefler: [{ tip: 'score', adet: 6000 }],
    uret: () => {
      const t = bosTahta(10, 9);
      doldur(t, 0, 0, 9, 8, 'normal');
      // dikey iki blok sütun, ortada koridor
      for (let r = 0; r < 10; r++) {
        if (r % 5 !== 4) {
          t[r][1] = 'block';
          t[r][7] = 'block';
        }
      }
      return { tahta: t, jel: [] };
    },
  },
  {
    id: 12,
    ad: 'Mavi Fırtına',
    satir: 9,
    sutun: 9,
    hamle: 20,
    yildizlar: [5500, 9500, 14000],
    hedefler: [{ tip: 'collect', renk: T(3), adet: 30 }],
    uret: () => {
      const t = bosTahta(9, 9);
      doldur(t, 0, 0, 8, 8, 'normal');
      return { tahta: t, jel: [] };
    },
  },
  {
    id: 13,
    ad: 'Kırık Tahta',
    satir: 10,
    sutun: 10,
    hamle: 25,
    yildizlar: [7000, 12000, 17000],
    hedefler: [{ tip: 'score', adet: 7000 }],
    uret: () => {
      const t = bosTahta(10, 10);
      doldur(t, 0, 0, 9, 9, 'normal');
      const engeller = [];
      for (let r = 1; r < 9; r += 2) {
        for (let c = 1; c < 9; c += 2) {
          if ((r + c) % 4 === 0) engeller.push([r, c]);
        }
      }
      blokla(t, engeller);
      return { tahta: t, jel: [] };
    },
  },
  {
    id: 14,
    ad: 'Mor Girdap',
    satir: 9,
    sutun: 9,
    hamle: 21,
    yildizlar: [6000, 10000, 14500],
    hedefler: [{ tip: 'collect', renk: T(4), adet: 32 }],
    uret: () => {
      const t = bosTahta(9, 9);
      doldur(t, 0, 0, 8, 8, 'normal');
      return { tahta: t, jel: [] };
    },
  },
  {
    id: 15,
    ad: 'Jel Labirenti',
    satir: 10,
    sutun: 10,
    hamle: 26,
    yildizlar: [7500, 12500, 18000],
    hedefler: [],
    uret: () => {
      const t = bosTahta(10, 10);
      doldur(t, 0, 0, 9, 9, 'normal');
      blokla(t, [[4, 4], [4, 5], [5, 4], [5, 5]]);
      const jel = jelDose(t, 0, 0, 9, 9);
      return { tahta: t, jel };
    },
  },
  {
    id: 16,
    ad: 'Çift Görev',
    satir: 10,
    sutun: 10,
    hamle: 24,
    yildizlar: [7500, 13000, 18500],
    hedefler: [
      { tip: 'collect', renk: T(0), adet: 22 },
      { tip: 'score', adet: 6000 },
    ],
    uret: () => {
      const t = bosTahta(10, 10);
      doldur(t, 0, 0, 9, 9, 'normal');
      return { tahta: t, jel: [] };
    },
  },
  {
    id: 17,
    ad: 'Köşe Kapmaca',
    satir: 10,
    sutun: 10,
    hamle: 23,
    yildizlar: [7500, 12500, 18000],
    hedefler: [{ tip: 'score', adet: 7500 }],
    uret: () => {
      const t = bosTahta(10, 10);
      doldur(t, 0, 0, 9, 9, 'normal');
      // dört köşeyi blokla
      blokla(t, [
        [0, 0], [0, 1], [1, 0],
        [0, 8], [0, 9], [1, 9],
        [8, 0], [9, 0], [9, 1],
        [8, 9], [9, 8], [9, 9],
      ]);
      return { tahta: t, jel: [] };
    },
  },
  {
    id: 18,
    ad: 'Limon Tarlası',
    satir: 10,
    sutun: 10,
    hamle: 22,
    yildizlar: [7000, 12000, 17000],
    hedefler: [{ tip: 'collect', renk: T(1), adet: 35 }],
    uret: () => {
      const t = bosTahta(10, 10);
      doldur(t, 0, 0, 9, 9, 'normal');
      return { tahta: t, jel: [] };
    },
  },
  {
    id: 19,
    ad: 'Kule',
    satir: 11,
    sutun: 9,
    hamle: 26,
    yildizlar: [8500, 14000, 19500],
    hedefler: [{ tip: 'score', adet: 8500 }],
    uret: () => {
      const t = bosTahta(11, 9);
      doldur(t, 0, 0, 10, 8, 'normal');
      // iki kule: her 3 satırda bir ortada blok
      for (let r = 1; r < 11; r += 3) {
        t[r][2] = 'block';
        t[r][6] = 'block';
      }
      return { tahta: t, jel: [] };
    },
  },
  {
    id: 20,
    ad: 'Final: Şeker Kralı',
    satir: 10,
    sutun: 10,
    hamle: 28,
    yildizlar: [10000, 17000, 24000],
    hedefler: [
      { tip: 'score', adet: 9000 },
      { tip: 'collect', renk: T(2), adet: 30 },
    ],
    uret: () => {
      const t = bosTahta(10, 10);
      doldur(t, 0, 0, 9, 9, 'normal');
      blokla(t, [[4, 4], [4, 5], [5, 4], [5, 5]]);
      const jel = jelDose(t, 3, 3, 6, 6);
      return { tahta: t, jel };
    },
  },
  {
    id: 21,
    ad: 'Jel Labirenti',
    satir: 10,
    sutun: 10,
    hamle: 26,
    yildizlar: [11000, 18000, 25000],
    hedefler: [{ tip: 'score', adet: 10000 }],
    uret: () => {
      const t = bosTahta(10, 10);
      doldur(t, 0, 0, 9, 9, 'normal');
      // labirent duvarları — köşegenlerde bloklar
      blokla(t, [[2, 2], [2, 7], [7, 2], [7, 7], [4, 4], [4, 5], [5, 4], [5, 5]]);
      const jel = jelDose(t, 1, 1, 8, 8);
      return { tahta: t, jel };
    },
  },
  {
    id: 22,
    ad: 'Üzüm Bağı',
    satir: 10,
    sutun: 10,
    hamle: 22,
    yildizlar: [10500, 17000, 23500],
    hedefler: [{ tip: 'collect', renk: T(4), adet: 28 }],
    uret: () => {
      const t = bosTahta(10, 10);
      doldur(t, 0, 0, 9, 9, 'normal');
      // dağınık engeller — toplamayı zorlaştırır
      for (let r = 0; r < 10; r += 3) {
        t[r][0] = 'block';
        t[r][9] = 'block';
      }
      return { tahta: t, jel: [] };
    },
  },
  {
    id: 23,
    ad: 'Çifte Kuşatma',
    satir: 10,
    sutun: 10,
    hamle: 25,
    yildizlar: [12000, 19500, 27000],
    hedefler: [
      { tip: 'score', adet: 11000 },
      { tip: 'collect', renk: T(0), adet: 25 },
    ],
    uret: () => {
      const t = bosTahta(10, 10);
      doldur(t, 0, 0, 9, 9, 'normal');
      blokla(t, [[0, 0], [0, 9], [9, 0], [9, 9]]);
      const jel = jelDose(t, 2, 2, 7, 7);
      return { tahta: t, jel };
    },
  },
  {
    id: 24,
    ad: 'Yıldırım Koridoru',
    satir: 11,
    sutun: 9,
    hamle: 24,
    yildizlar: [12500, 20000, 28000],
    hedefler: [{ tip: 'score', adet: 12000 }],
    uret: () => {
      const t = bosTahta(11, 9);
      doldur(t, 0, 0, 10, 8, 'normal');
      // ortada uzun dikey duvar, iki yan koridor
      for (let r = 0; r < 11; r++) {
        if (r % 4 !== 2) t[r][4] = 'block';
      }
      return { tahta: t, jel: [] };
    },
  },
  {
    id: 25,
    ad: 'Nane Tarlası',
    satir: 10,
    sutun: 10,
    hamle: 21,
    yildizlar: [12000, 19000, 26500],
    hedefler: [{ tip: 'collect', renk: T(2), adet: 32 }],
    uret: () => {
      const t = bosTahta(10, 10);
      doldur(t, 0, 0, 9, 9, 'normal');
      const jel = jelDose(t, 0, 0, 9, 9);
      return { tahta: t, jel };
    },
  },
  {
    id: 26,
    ad: 'Kale Kuşatması',
    satir: 11,
    sutun: 11,
    hamle: 27,
    yildizlar: [13500, 21500, 30000],
    hedefler: [{ tip: 'score', adet: 13000 }],
    uret: () => {
      const t = bosTahta(11, 11);
      doldur(t, 0, 0, 10, 10, 'normal');
      // dört köşe kalesi
      const kale = [];
      for (let r = 1; r <= 2; r++) {
        for (let c = 1; c <= 2; c++) {
          kale.push([r, c], [r, 10 - c], [10 - r, c], [10 - r, 10 - c]);
        }
      }
      blokla(t, kale);
      const jel = jelDose(t, 4, 4, 6, 6);
      return { tahta: t, jel };
    },
  },
  {
    id: 27,
    ad: 'Üçlü Hedef',
    satir: 10,
    sutun: 10,
    hamle: 28,
    yildizlar: [14500, 23000, 32000],
    hedefler: [
      { tip: 'score', adet: 13000 },
      { tip: 'collect', renk: T(1), adet: 22 },
      { tip: 'collect', renk: T(5), adet: 22 },
    ],
    uret: () => {
      const t = bosTahta(10, 10);
      doldur(t, 0, 0, 9, 9, 'normal');
      // artı biçimli blok
      for (let i = 0; i < 10; i++) {
        if (i !== 4 && i !== 5) {
          t[4][i] = 'block';
          t[5][i] = 'block';
        }
      }
      return { tahta: t, jel: [] };
    },
  },
  {
    id: 28,
    ad: 'Buz Aynası',
    satir: 11,
    sutun: 11,
    hamle: 26,
    yildizlar: [15000, 24000, 33000],
    hedefler: [{ tip: 'score', adet: 14000 }],
    uret: () => {
      const t = bosTahta(11, 11);
      doldur(t, 0, 0, 10, 10, 'normal');
      // simetrik blok aynası
      for (let r = 1; r <= 9; r += 2) {
        t[r][1] = 'block';
        t[r][9] = 'block';
      }
      t[5][5] = 'block';
      const jel = jelDose(t, 2, 2, 8, 8);
      return { tahta: t, jel };
    },
  },
  {
    id: 29,
    ad: 'Kırmızı Alarm',
    satir: 10,
    sutun: 10,
    hamle: 23,
    yildizlar: [15000, 23500, 32500],
    hedefler: [
      { tip: 'collect', renk: T(0), adet: 30 },
      { tip: 'collect', renk: T(3), adet: 30 },
    ],
    uret: () => {
      const t = bosTahta(10, 10);
      doldur(t, 0, 0, 9, 9, 'normal');
      blokla(t, [[0, 4], [0, 5], [9, 4], [9, 5]]);
      const jel = jelDose(t, 3, 0, 6, 9);
      return { tahta: t, jel };
    },
  },
  {
    id: 30,
    ad: 'Efsane: Numex Şeker Ustası',
    satir: 11,
    sutun: 11,
    hamle: 30,
    yildizlar: [20000, 32000, 45000],
    hedefler: [
      { tip: 'score', adet: 18000 },
      { tip: 'collect', renk: T(4), adet: 35 },
      { tip: 'collect', renk: T(2), adet: 35 },
    ],
    uret: () => {
      const t = bosTahta(11, 11);
      doldur(t, 0, 0, 10, 10, 'normal');
      // final kalesi — merkez blok + köşe bloklar
      blokla(t, [
        [5, 5], [5, 4], [5, 6], [4, 5], [6, 5],
        [0, 0], [0, 10], [10, 0], [10, 10],
      ]);
      const jel = jelDose(t, 1, 1, 9, 9);
      return { tahta: t, jel };
    },
  },
];

/** Bölümü dışarıya verirken `uret` fonksiyonunu çıkarır (JSON güvenliği). */
export function levelMeta(level) {
  return {
    id: level.id,
    ad: level.ad,
    satir: level.satir,
    sutun: level.sutun,
    hamle: level.hamle,
    yildizlar: level.yildizlar,
    hedefler: level.hedefler.map((h) => ({ ...h })),
  };
}

/** Tahta düzenini (block/jel) ayrıca üretir — istemci tarafına gider. */
export function levelBoard(level) {
  const { tahta, jel } = level.uret();
  return { tahta, jel };
}

export function getLevel(id) {
  return LEVELS.find((l) => l.id === Number(id)) || null;
}

export function allLevels() {
  return LEVELS.map(levelMeta);
}
