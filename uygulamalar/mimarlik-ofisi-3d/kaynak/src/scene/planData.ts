/**
 * Ortak plan geometrisi — 2D SVG çizimi ile 3D sahne AYNI veriden üretilir,
 * böylece "soldaki plan" ile "sağdaki model" birbiriyle tutarlı kalır.
 * Tüm ölçüler metre cinsindendir; orijin (0,0) planın sol-üst köşesidir.
 */

export type Duvar = {
  /** başlangıç x */ x1: number;
  /** başlangıç z */ z1: number;
  /** bitiş x */ x2: number;
  /** bitiş z */ z2: number;
  /** kalınlık (m) */ t: number;
  /** iç duvar mı */ ic: boolean;
  /** açıklık (kapı/pencere) listesi: başlangıç noktasından uzaklık, genişlik, tip */
  acikliklar?: Aciklik[];
};

export type Aciklik = {
  /** duvar başlangıcından uzaklık (m) */ ofset: number;
  /** genişlik (m) */ genislik: number;
  /** 'kapi' | 'pencere' */ tip: 'kapi' | 'pencere';
  /** pencere denizlik yüksekliği */ taban?: number;
  /** pencere üst kotu */ ust?: number;
};

export type Mahal = {
  ad: string;
  x: number;
  z: number;
  w: number;
  d: number;
  tip: 'yasam' | 'islak' | 'yatak' | 'servis' | 'sirkulasyon' | 'dis';
};

export type KatPlan = {
  ad: string;
  genislik: number;
  derinlik: number;
  yukseklik: number;
  duvarlar: Duvar[];
  mahaller: Mahal[];
  /** mobilya temsilleri (2D'de çizgi, 3D'de basit kütle) */
  mobilyalar?: Mobilya[];
};

export type Mobilya = {
  x: number;
  z: number;
  w: number;
  d: number;
  h: number;
  tip: 'kanepe' | 'masa' | 'yatak' | 'dolap' | 'tezgah' | 'ada';
};

/** Modüler bir ızgara üzerinde duvar üretir */
const duvar = (
  x1: number,
  z1: number,
  x2: number,
  z2: number,
  t = 0.2,
  ic = false,
  acikliklar?: Aciklik[]
): Duvar => ({ x1, z1, x2, z2, t, ic, acikliklar });

/** Kapı: 2,1 m yüksekliğe kadar boşluk */
const kapi = (ofset: number, genislik = 0.9): Aciklik => ({ ofset, genislik, tip: 'kapi' });
/** Pencere: 0,9 m denizlik, 2,4 m üst kot */
const pencere = (ofset: number, genislik = 1.6): Aciklik => ({
  ofset,
  genislik,
  tip: 'pencere',
  taban: 0.9,
  ust: 2.4,
});

/* ---------------------------------------------------------------------------
   ZEMİN KAT — Modern Villa
   Dış ölçü 14 × 11 m
   ------------------------------------------------------------------------ */
const zeminKatDuvar: Duvar[] = [
  // Dış duvarlar (0,4 m)
  // NUMEX-DÜZELTME (2026-10-27, kullanıcı isteği "pencereler hizalı olsun kapı hizalı olsun"):
  // Dış cephe açıklıkları düzenli bir aks ızgarasına oturtuldu. Alt ve ÜST kat pencereleri
  // aynı x/z akslarına denk gelir (2.4 / 7.0 / 11.6); giriş kapısı cephenin tam ortasında,
  // iki pencere arasında simetrik durur.
  duvar(0, 0, 14, 0, 0.4, false, [pencere(2.4, 2.4), pencere(7.0, 2.4), pencere(11.6, 1.8)]),
  duvar(14, 0, 14, 11, 0.4, false, [pencere(1.6, 2.2), pencere(7.0, 2.2)]),
  duvar(14, 11, 0, 11, 0.4, false, [kapi(5.7, 2.6), pencere(2.4, 2.4), pencere(9.0, 2.4)]),
  duvar(0, 11, 0, 0, 0.4, false, [pencere(2.4, 2.2), pencere(7.0, 2.2)]),

  // İç duvarlar (0,15 m)
  duvar(7.4, 0, 7.4, 6.4, 0.15, true, [kapi(2.0, 1.0)]), // salon | mutfak
  duvar(7.4, 6.4, 14, 6.4, 0.15, true, [kapi(0.4, 0.9)]), // mutfak | hol
  duvar(7.4, 6.4, 7.4, 11, 0.15, true, [kapi(2.6, 0.9)]), // salon | oda
  duvar(11.0, 6.4, 11.0, 11, 0.15, true), // oda | banyo
  duvar(0, 7.2, 3.6, 7.2, 0.15, true, [kapi(1.6, 0.9)]), // salon | giriş holü
  duvar(3.6, 7.2, 3.6, 11, 0.15, true), // hol | oda
  duvar(3.6, 8.9, 7.4, 8.9, 0.15, true, [kapi(0.3, 0.85)]), // hol | wc
];

const zeminKatMahal: Mahal[] = [
  { ad: 'Salon', x: 0.2, z: 0.2, w: 7.2, d: 7.0, tip: 'yasam' },
  { ad: 'Mutfak / Yemek', x: 7.55, z: 0.2, w: 6.25, d: 6.2, tip: 'yasam' },
  { ad: 'Giriş Holü', x: 0.2, z: 7.3, w: 3.3, d: 3.5, tip: 'sirkulasyon' },
  { ad: 'WC', x: 3.7, z: 8.95, w: 3.6, d: 1.9, tip: 'islak' },
  { ad: 'Çalışma Odası', x: 3.7, z: 7.3, w: 3.6, d: 1.55, tip: 'yatak' },
  { ad: 'Misafir Odası', x: 0.2, z: 10.8, w: 3.3, d: 0.0, tip: 'yatak' },
  { ad: 'Koridor', x: 7.55, z: 6.55, w: 3.3, d: 4.25, tip: 'sirkulasyon' },
  { ad: 'Banyo', x: 11.15, z: 6.55, w: 2.65, d: 4.25, tip: 'islak' },
];

const zeminKatMobilya: Mobilya[] = [
  { x: 0.9, z: 1.2, w: 2.4, d: 0.9, h: 0.55, tip: 'kanepe' },
  { x: 0.9, z: 3.4, w: 2.4, d: 0.9, h: 0.55, tip: 'kanepe' },
  { x: 2.6, z: 2.6, w: 1.3, d: 0.7, h: 0.42, tip: 'masa' },
  { x: 8.2, z: 0.6, w: 3.4, d: 0.7, h: 0.9, tip: 'tezgah' },
  { x: 8.2, z: 3.2, w: 2.0, d: 0.9, h: 0.9, tip: 'ada' },
  { x: 8.4, z: 5.0, w: 1.6, d: 0.8, h: 0.75, tip: 'masa' },
  { x: 11.6, z: 7.2, w: 1.7, d: 0.6, h: 0.85, tip: 'dolap' },
  { x: 4.0, z: 7.5, w: 1.4, d: 0.6, h: 0.75, tip: 'masa' },
];

/* ---------------------------------------------------------------------------
   ÜST KAT — 14 × 11 m (aynı ayak izi)
   ------------------------------------------------------------------------ */
const ustKatDuvar: Duvar[] = [
  // NUMEX-DÜZELTME (2026-10-27, kullanıcı: "üst pencereler hizasız ön taraftan"): üst katın ÖN
  // (güney, z=11) cephesinde pencere genişlikleri 2.4/2.4/1.8 ve ofsetı 2.4/7.0/11.6 idi; alt
  // katta kapı nedeniyle pencere dizisi farklıydı, gözle bakınca kaçık görünüyordu.
  // Üst kat artık ALT KATIN BİREBİR aynı aks ve genişliklerini kullanıyor (2.4/2.4 + 7.0/2.4 +
  // 11.6/1.8); böylece alt-üst pencereler düşey aksda tam üst üste gelir.
  duvar(0, 0, 14, 0, 0.4, false, [pencere(2.4, 2.4), pencere(7.0, 2.4), pencere(11.6, 1.8)]),
  duvar(14, 0, 14, 11, 0.4, false, [pencere(1.6, 2.2), pencere(7.0, 2.2)]),
  duvar(14, 11, 0, 11, 0.4, false, [pencere(2.4, 2.4), pencere(9.0, 2.4)]),
  duvar(0, 11, 0, 0, 0.4, false, [pencere(2.4, 2.2), pencere(7.0, 2.2)]),

  duvar(0, 4.6, 7.2, 4.6, 0.15, true, [kapi(3.2, 0.9)]), // ebeveyn | koridor
  duvar(7.2, 0, 7.2, 11, 0.15, true, [kapi(6.0, 0.9), kapi(9.2, 0.9)]), // batı | doğu blok
  duvar(7.2, 5.4, 14, 5.4, 0.15, true, [kapi(1.0, 0.9)]), // koridor | çocuk
  duvar(10.6, 5.4, 10.6, 11, 0.15, true), // çocuk | banyo
  duvar(0, 8.2, 7.2, 8.2, 0.15, true, [kapi(1.2, 0.9)]), // ebeveyn | giyinme+banyo
  duvar(3.8, 8.2, 3.8, 11, 0.15, true),
];

const ustKatMahal: Mahal[] = [
  { ad: 'Ebeveyn Yatak Odası', x: 0.2, z: 0.2, w: 6.85, d: 4.25, tip: 'yatak' },
  { ad: 'Giyinme Odası', x: 0.2, z: 8.35, w: 3.45, d: 2.5, tip: 'servis' },
  { ad: 'Ebeveyn Banyo', x: 3.95, z: 8.35, w: 3.1, d: 2.5, tip: 'islak' },
  { ad: 'Koridor / Merdiven', x: 0.2, z: 4.75, w: 6.85, d: 3.3, tip: 'sirkulasyon' },
  { ad: 'Çocuk Odası', x: 7.35, z: 0.2, w: 6.45, d: 5.05, tip: 'yatak' },
  { ad: 'Çalışma', x: 7.35, z: 5.55, w: 3.1, d: 5.3, tip: 'yasam' },
  { ad: 'Banyo', x: 10.75, z: 5.55, w: 3.05, d: 5.3, tip: 'islak' },
];

const ustKatMobilya: Mobilya[] = [
  { x: 2.0, z: 0.6, w: 2.0, d: 1.8, h: 0.55, tip: 'yatak' },
  { x: 0.4, z: 3.2, w: 2.6, d: 0.6, h: 2.2, tip: 'dolap' },
  { x: 8.0, z: 1.0, w: 1.1, d: 2.0, h: 0.5, tip: 'yatak' },
  { x: 11.4, z: 0.8, w: 2.0, d: 0.6, h: 2.2, tip: 'dolap' },
  { x: 7.6, z: 6.0, w: 1.4, d: 0.7, h: 0.75, tip: 'masa' },
  { x: 1.2, z: 5.4, w: 1.1, d: 2.6, h: 0.9, tip: 'tezgah' },
];

export const modernVillaKatlar: KatPlan[] = [
  {
    ad: 'Zemin Kat',
    genislik: 14,
    derinlik: 11,
    yukseklik: 3.05,
    duvarlar: zeminKatDuvar,
    mahaller: zeminKatMahal,
    mobilyalar: zeminKatMobilya,
  },
  {
    ad: 'Üst Kat',
    genislik: 14,
    derinlik: 11,
    yukseklik: 3.05,
    duvarlar: ustKatDuvar,
    mahaller: ustKatMahal,
    mobilyalar: ustKatMobilya,
  },
];

/** Proje slug'ına göre plan katları (şimdilik tüm projeler villa planını temel alır) */
/* ---------------------------------------------------------------------------
   PROJEYE ÖZEL PLANLAR
   NUMEX-DÜZELTME (2026-10-26): planKatlar() slug'ı yok sayıp her projeye aynı
   modern villa planını döndürüyordu; 8 kartın 8'i aynı çizimi gösteriyordu.
   Aşağıda her proje için ayrı ayak izi ve oda kurgusu üretiliyor.
   Hepsi TEMSİLÎ'dir; gerçek bir müşteri projesinin .dwg'si değildir.
   ------------------------------------------------------------------------ */

/** Bir dikdörtgen ayak izinin dış duvarlarını üretir (saat yönü, 4 parça) */
function kabukDuvar(
  w: number,
  d: number,
  giris: { kenar: 'guney' | 'kuzey' | 'dogu' | 'bati'; ofset: number; genislik: number },
  pencereler: { kenar: 'guney' | 'kuzey' | 'dogu' | 'bati'; ofset: number; genislik: number }[],
  t = 0.35
): Duvar[] {
  const ak = (kenar: 'guney' | 'kuzey' | 'dogu' | 'bati'): Aciklik[] => {
    const list: Aciklik[] = [];
    if (giris.kenar === kenar) list.push(kapi(giris.ofset, giris.genislik));
    for (const p of pencereler.filter((x) => x.kenar === kenar)) list.push(pencere(p.ofset, p.genislik));
    return list.sort((a, b) => a.ofset - b.ofset);
  };
  return [
    duvar(0, 0, w, 0, t, false, ak('kuzey')),
    duvar(w, 0, w, d, t, false, ak('dogu')),
    duvar(w, d, 0, d, t, false, ak('guney')),
    duvar(0, d, 0, 0, t, false, ak('bati')),
  ];
}

/** Lüks Konut — 16 × 12, geniş yaşam alanı + iki süit (iç mimari projesi) */
function luksKonut(): KatPlan {
  const w = 16;
  const d = 12;
  const duvarlar: Duvar[] = [
    ...kabukDuvar(
      w,
      d,
      { kenar: 'guney', ofset: 7.4, genislik: 2.4 },
      [
        { kenar: 'guney', ofset: 1.8, genislik: 3.4 },
        { kenar: 'guney', ofset: 11.6, genislik: 2.6 },
        { kenar: 'kuzey', ofset: 2.2, genislik: 3.0 },
        { kenar: 'kuzey', ofset: 7.0, genislik: 3.0 },
        { kenar: 'kuzey', ofset: 12.0, genislik: 2.4 },
        { kenar: 'dogu', ofset: 2.0, genislik: 2.6 },
        { kenar: 'dogu', ofset: 7.0, genislik: 2.6 },
        { kenar: 'bati', ofset: 3.0, genislik: 3.6 },
      ]
    ),
    // servis aksı
    duvar(6.6, 0, 6.6, 7.2, 0.18, true, [kapi(3.4, 0.95)]),
    duvar(11.4, 0, 11.4, 7.2, 0.18, true, [kapi(1.2, 0.9)]),
    duvar(0, 7.2, 16, 7.2, 0.18, true, [kapi(1.4, 0.95), kapi(8.0, 0.95)]),
    duvar(3.4, 7.2, 3.4, 12, 0.18, true, [kapi(1.6, 0.9)]),
    duvar(12.2, 7.2, 12.2, 12, 0.18, true),
  ];
  const mahaller: Mahal[] = [
    { ad: 'SALON', x: 0.2, z: 7.4, w: 3.2, d: 4.4, tip: 'yasam' },
    { ad: 'ANA YAŞAM ALANI', x: 0.2, z: 0.2, w: 11.0, d: 6.8, tip: 'yasam' },
    { ad: 'MUTFAK', x: 6.8, z: 0.2, w: 4.4, d: 6.8, tip: 'servis' },
    { ad: 'SÜİT 1', x: 11.6, z: 0.2, w: 4.2, d: 6.8, tip: 'yatak' },
    { ad: 'SÜİT 2', x: 3.6, z: 7.4, w: 8.4, d: 4.4, tip: 'yatak' },
    { ad: 'BANYO', x: 12.4, z: 7.4, w: 3.4, d: 4.4, tip: 'islak' },
  ];
  const mobilyalar: Mobilya[] = [
    { x: 1.4, z: 1.6, w: 3.4, d: 1.0, h: 0.85, tip: 'kanepe' },
    { x: 5.6, z: 2.4, w: 1.6, d: 0.9, h: 0.75, tip: 'masa' },
    { x: 7.2, z: 1.0, w: 3.2, d: 0.7, h: 0.9, tip: 'tezgah' },
    { x: 12.4, z: 1.2, w: 2.0, d: 2.1, h: 0.55, tip: 'yatak' },
    { x: 5.2, z: 8.6, w: 2.0, d: 2.1, h: 0.55, tip: 'yatak' },
  ];
  return { ad: 'Lüks Konut · Zemin Kat', genislik: w, derinlik: d, yukseklik: 3.4, duvarlar, mahaller, mobilyalar };
}

/** Beş Katlı Apartman — 18 × 13, 4 daire çekirdek etrafında */
function apartman(): KatPlan {
  const w = 18;
  const d = 13;
  const duvarlar: Duvar[] = [
    ...kabukDuvar(
      w,
      d,
      { kenar: 'guney', ofset: 8.2, genislik: 1.8 },
      [
        { kenar: 'guney', ofset: 1.6, genislik: 2.4 },
        { kenar: 'guney', ofset: 4.4, genislik: 2.4 },
        { kenar: 'guney', ofset: 11.0, genislik: 2.4 },
        { kenar: 'guney', ofset: 13.8, genislik: 2.4 },
        { kenar: 'kuzey', ofset: 2.0, genislik: 2.6 },
        { kenar: 'kuzey', ofset: 6.0, genislik: 2.6 },
        { kenar: 'kuzey', ofset: 10.6, genislik: 2.6 },
        { kenar: 'kuzey', ofset: 14.6, genislik: 2.0 },
        { kenar: 'dogu', ofset: 3.0, genislik: 2.4 },
        { kenar: 'dogu', ofset: 8.0, genislik: 2.4 },
        { kenar: 'bati', ofset: 3.0, genislik: 2.4 },
        { kenar: 'bati', ofset: 8.0, genislik: 2.4 },
      ]
    ),
    // çekirdek (merdiven + asansör)
    duvar(7.4, 4.4, 10.6, 4.4, 0.2, true, [kapi(0.6, 1.0)]),
    duvar(7.4, 8.6, 10.6, 8.6, 0.2, true, [kapi(2.0, 1.0)]),
    duvar(7.4, 4.4, 7.4, 8.6, 0.2, true),
    duvar(10.6, 4.4, 10.6, 8.6, 0.2, true),
    // daireler
    duvar(0, 3.2, 7.4, 3.2, 0.18, true, [kapi(1.2, 0.95)]),
    duvar(0, 9.8, 7.4, 9.8, 0.18, true, [kapi(1.2, 0.95)]),
    duvar(10.6, 3.2, 18, 3.2, 0.18, true, [kapi(2.0, 0.95)]),
    duvar(10.6, 9.8, 18, 9.8, 0.18, true, [kapi(2.0, 0.95)]),
    duvar(4.2, 0, 4.2, 3.2, 0.18, true),
    duvar(13.6, 9.8, 13.6, 13, 0.18, true),
  ];
  const mahaller: Mahal[] = [
    { ad: 'DAİRE 1', x: 0.2, z: 0.2, w: 7.0, d: 2.9, tip: 'yasam' },
    { ad: 'DAİRE 2', x: 0.2, z: 9.95, w: 7.0, d: 2.9, tip: 'yasam' },
    { ad: 'DAİRE 3', x: 10.8, z: 0.2, w: 7.0, d: 2.9, tip: 'yasam' },
    { ad: 'DAİRE 4', x: 10.8, z: 9.95, w: 7.0, d: 2.9, tip: 'yasam' },
    { ad: 'ÇEKİRDEK', x: 7.6, z: 4.6, w: 2.8, d: 3.8, tip: 'sirkulasyon' },
    { ad: 'HOL', x: 0.2, z: 3.4, w: 7.0, d: 6.2, tip: 'sirkulasyon' },
    { ad: 'HOL', x: 10.8, z: 3.4, w: 7.0, d: 6.2, tip: 'sirkulasyon' },
  ];
  return { ad: 'Apartman · Tipik Kat', genislik: w, derinlik: d, yukseklik: 2.9, duvarlar, mahaller };
}

/** Ticari Ofis — 22 × 15, açık plan + toplantı odaları */
function ticariOfis(): KatPlan {
  const w = 22;
  const d = 15;
  const duvarlar: Duvar[] = [
    ...kabukDuvar(
      w,
      d,
      { kenar: 'guney', ofset: 3.0, genislik: 3.2 },
      [
        { kenar: 'guney', ofset: 8.0, genislik: 4.0 },
        { kenar: 'guney', ofset: 14.0, genislik: 4.0 },
        { kenar: 'guney', ofset: 19.0, genislik: 2.0 },
        { kenar: 'kuzey', ofset: 3.0, genislik: 4.0 },
        { kenar: 'kuzey', ofset: 9.0, genislik: 4.0 },
        { kenar: 'kuzey', ofset: 15.0, genislik: 4.0 },
        { kenar: 'dogu', ofset: 4.0, genislik: 3.0 },
        { kenar: 'dogu', ofset: 10.0, genislik: 3.0 },
        { kenar: 'bati', ofset: 4.0, genislik: 3.0 },
        { kenar: 'bati', ofset: 10.0, genislik: 3.0 },
      ],
      0.3
    ),
    duvar(0, 5.4, 22, 5.4, 0.16, true, [kapi(2.0, 1.2), kapi(12.0, 1.2)]),
    duvar(14.0, 5.4, 14.0, 15, 0.16, true, [kapi(1.4, 0.95)]),
    duvar(18.0, 10.0, 22, 10.0, 0.16, true, [kapi(0.8, 0.9)]),
    duvar(18.0, 5.4, 18.0, 10.0, 0.16, true),
    duvar(0, 10.4, 8.0, 10.4, 0.16, true, [kapi(2.2, 0.9)]),
    duvar(8.0, 10.4, 8.0, 15, 0.16, true),
  ];
  const mahaller: Mahal[] = [
    { ad: 'AÇIK OFİS', x: 0.2, z: 0.2, w: 21.6, d: 5.0, tip: 'yasam' },
    { ad: 'TOPLANTI', x: 0.2, z: 5.6, w: 7.6, d: 4.6, tip: 'servis' },
    { ad: 'AÇIK ÇALIŞMA', x: 8.2, z: 5.6, w: 5.6, d: 9.2, tip: 'yasam' },
    { ad: 'YÖNETİCİ', x: 14.2, z: 5.6, w: 3.6, d: 4.2, tip: 'servis' },
    { ad: 'TOPLANTI 2', x: 18.2, z: 5.6, w: 3.6, d: 4.2, tip: 'servis' },
    { ad: 'TEKNİK', x: 18.2, z: 10.2, w: 3.6, d: 4.6, tip: 'islak' },
    { ad: 'DİNLENME', x: 0.2, z: 10.6, w: 7.6, d: 4.2, tip: 'sirkulasyon' },
    { ad: 'SİRKÜLASYON', x: 8.2, z: 10.6, w: 5.6, d: 4.2, tip: 'sirkulasyon' },
  ];
  const mobilyalar: Mobilya[] = [
    { x: 1.0, z: 1.0, w: 4.0, d: 1.2, h: 0.75, tip: 'masa' },
    { x: 7.0, z: 1.0, w: 4.0, d: 1.2, h: 0.75, tip: 'masa' },
    { x: 13.0, z: 1.0, w: 4.0, d: 1.2, h: 0.75, tip: 'masa' },
    { x: 1.4, z: 6.4, w: 3.2, d: 1.2, h: 0.75, tip: 'masa' },
  ];
  return { ad: 'Ticari Ofis · Kat Planı', genislik: w, derinlik: d, yukseklik: 3.6, duvarlar, mahaller, mobilyalar };
}

/** Butik Otel — 20 × 14, lobi + 6 oda */
function butikOtel(): KatPlan {
  const w = 20;
  const d = 14;
  const duvarlar: Duvar[] = [
    ...kabukDuvar(
      w,
      d,
      { kenar: 'guney', ofset: 8.6, genislik: 2.8 },
      [
        { kenar: 'guney', ofset: 2.0, genislik: 3.0 },
        { kenar: 'guney', ofset: 13.0, genislik: 3.0 },
        { kenar: 'kuzey', ofset: 2.0, genislik: 2.6 },
        { kenar: 'kuzey', ofset: 7.0, genislik: 2.6 },
        { kenar: 'kuzey', ofset: 12.0, genislik: 2.6 },
        { kenar: 'kuzey', ofset: 16.6, genislik: 2.0 },
        { kenar: 'dogu', ofset: 3.0, genislik: 2.4 },
        { kenar: 'dogu', ofset: 7.6, genislik: 2.4 },
        { kenar: 'bati', ofset: 3.0, genislik: 2.4 },
        { kenar: 'bati', ofset: 7.6, genislik: 2.4 },
      ]
    ),
    duvar(0, 6.4, 20, 6.4, 0.2, true, [kapi(3.0, 1.1), kapi(11.0, 1.1)]),
    duvar(5.0, 0, 5.0, 6.4, 0.18, true, [kapi(1.4, 0.9)]),
    duvar(10.0, 0, 10.0, 6.4, 0.18, true, [kapi(1.4, 0.9)]),
    duvar(15.0, 0, 15.0, 6.4, 0.18, true, [kapi(1.4, 0.9)]),
    duvar(6.4, 6.4, 6.4, 14, 0.18, true, [kapi(2.0, 0.9)]),
    duvar(13.6, 6.4, 13.6, 14, 0.18, true, [kapi(2.0, 0.9)]),
    duvar(0, 10.6, 6.4, 10.6, 0.18, true, [kapi(2.4, 0.9)]),
    duvar(13.6, 10.6, 20, 10.6, 0.18, true, [kapi(2.4, 0.9)]),
  ];
  const mahaller: Mahal[] = [
    { ad: 'ODA 101', x: 0.2, z: 0.2, w: 4.6, d: 6.0, tip: 'yatak' },
    { ad: 'ODA 102', x: 5.2, z: 0.2, w: 4.6, d: 6.0, tip: 'yatak' },
    { ad: 'ODA 103', x: 10.2, z: 0.2, w: 4.6, d: 6.0, tip: 'yatak' },
    { ad: 'ODA 104', x: 15.2, z: 0.2, w: 4.6, d: 6.0, tip: 'yatak' },
    { ad: 'LOBİ', x: 0.2, z: 6.6, w: 6.0, d: 3.8, tip: 'sirkulasyon' },
    { ad: 'KAFE', x: 6.6, z: 6.6, w: 6.8, d: 7.2, tip: 'yasam' },
    { ad: 'RESEPSİYON', x: 13.8, z: 6.6, w: 6.0, d: 3.8, tip: 'sirkulasyon' },
    { ad: 'ODA 201', x: 0.2, z: 10.8, w: 6.0, d: 3.0, tip: 'yatak' },
    { ad: 'ODA 202', x: 13.8, z: 10.8, w: 6.0, d: 3.0, tip: 'yatak' },
  ];
  const mobilyalar: Mobilya[] = [
    { x: 1.2, z: 1.0, w: 2.0, d: 2.2, h: 0.55, tip: 'yatak' },
    { x: 6.2, z: 1.0, w: 2.0, d: 2.2, h: 0.55, tip: 'yatak' },
    { x: 11.2, z: 1.0, w: 2.0, d: 2.2, h: 0.55, tip: 'yatak' },
    { x: 16.2, z: 1.0, w: 2.0, d: 2.2, h: 0.55, tip: 'yatak' },
    { x: 8.0, z: 8.2, w: 3.6, d: 1.0, h: 0.75, tip: 'masa' },
  ];
  return { ad: 'Butik Otel · Zemin Kat', genislik: w, derinlik: d, yukseklik: 3.2, duvarlar, mahaller, mobilyalar };
}

/** Kafe & Restoran — 12 × 9, açık servis alanı + mutfak */
function kafeRestoran(): KatPlan {
  const w = 12;
  const d = 9;
  const duvarlar: Duvar[] = [
    ...kabukDuvar(
      w,
      d,
      { kenar: 'guney', ofset: 1.0, genislik: 2.4 },
      [
        { kenar: 'guney', ofset: 4.6, genislik: 3.2 },
        { kenar: 'guney', ofset: 8.8, genislik: 2.6 },
        { kenar: 'kuzey', ofset: 1.6, genislik: 2.4 },
        { kenar: 'kuzey', ofset: 7.6, genislik: 2.4 },
        { kenar: 'dogu', ofset: 1.6, genislik: 2.6 },
        { kenar: 'dogu', ofset: 5.4, genislik: 2.2 },
        { kenar: 'bati', ofset: 3.0, genislik: 3.6 },
      ]
    ),
    duvar(0, 5.6, 12, 5.6, 0.18, true, [kapi(2.6, 1.0)]),
    duvar(6.4, 5.6, 6.4, 9, 0.18, true, [kapi(0.6, 0.9)]),
  ];
  const mahaller: Mahal[] = [
    { ad: 'SERVİS ALANI', x: 0.2, z: 0.2, w: 11.6, d: 5.2, tip: 'yasam' },
    { ad: 'MUTFAK', x: 0.2, z: 5.8, w: 6.0, d: 3.0, tip: 'islak' },
    { ad: 'DEPO', x: 6.6, z: 5.8, w: 2.6, d: 3.0, tip: 'servis' },
    { ad: 'WC', x: 9.4, z: 5.8, w: 2.4, d: 3.0, tip: 'islak' },
  ];
  const mobilyalar: Mobilya[] = [
    { x: 2.0, z: 1.2, w: 2.2, d: 0.9, h: 0.75, tip: 'masa' },
    { x: 6.0, z: 1.2, w: 2.2, d: 0.9, h: 0.75, tip: 'masa' },
    { x: 2.0, z: 3.4, w: 2.2, d: 0.9, h: 0.75, tip: 'masa' },
    { x: 6.0, z: 3.4, w: 2.2, d: 0.9, h: 0.75, tip: 'masa' },
    { x: 0.6, z: 1.0, w: 0.8, d: 4.2, h: 0.95, tip: 'tezgah' },
  ];
  return { ad: 'Kafe & Restoran · Plan', genislik: w, derinlik: d, yukseklik: 3.6, duvarlar, mahaller, mobilyalar };
}

/** Dubleks Ev — 13 × 10, alt kat yaşam, üst kat yatak */
function dubleksEv(): KatPlan {
  const w = 13;
  const d = 10;
  const duvarlar: Duvar[] = [
    ...kabukDuvar(
      w,
      d,
      { kenar: 'guney', ofset: 5.2, genislik: 2.0 },
      [
        { kenar: 'guney', ofset: 1.4, genislik: 2.6 },
        { kenar: 'guney', ofset: 8.6, genislik: 2.6 },
        { kenar: 'kuzey', ofset: 2.0, genislik: 2.8 },
        { kenar: 'kuzey', ofset: 7.4, genislik: 2.8 },
        { kenar: 'dogu', ofset: 2.4, genislik: 2.8 },
        { kenar: 'dogu', ofset: 6.2, genislik: 2.2 },
        { kenar: 'bati', ofset: 3.0, genislik: 3.0 },
      ]
    ),
    duvar(0, 5.2, 5.4, 5.2, 0.16, true, [kapi(1.2, 0.9)]),
    duvar(5.4, 5.2, 5.4, 10, 0.16, true, [kapi(1.8, 0.9)]),
    duvar(5.4, 5.2, 9.2, 5.2, 0.16, true),
    duvar(9.2, 5.2, 9.2, 10, 0.16, true, [kapi(1.6, 0.85)]),
  ];
  const mahaller: Mahal[] = [
    { ad: 'SALON', x: 0.2, z: 0.2, w: 12.6, d: 4.8, tip: 'yasam' },
    { ad: 'MUTFAK', x: 0.2, z: 5.4, w: 5.0, d: 4.4, tip: 'servis' },
    { ad: 'MERDİVEN', x: 5.6, z: 5.4, w: 3.4, d: 2.4, tip: 'sirkulasyon' },
    { ad: 'WC', x: 5.6, z: 8.0, w: 3.4, d: 1.8, tip: 'islak' },
    { ad: 'ÇALIŞMA', x: 9.4, z: 5.4, w: 3.4, d: 4.4, tip: 'servis' },
  ];
  const mobilyalar: Mobilya[] = [
    { x: 1.2, z: 1.2, w: 3.2, d: 1.0, h: 0.85, tip: 'kanepe' },
    { x: 6.4, z: 1.6, w: 1.8, d: 0.9, h: 0.75, tip: 'masa' },
    { x: 1.0, z: 5.8, w: 2.6, d: 0.7, h: 0.9, tip: 'tezgah' },
  ];
  return { ad: 'Dubleks Ev · Alt Kat', genislik: w, derinlik: d, yukseklik: 3.0, duvarlar, mahaller, mobilyalar };
}

/** Karma Kullanımlı Yapı — 24 × 16, zemin ticaret + üst ofis */
function karmaYapi(): KatPlan {
  const w = 24;
  const d = 16;
  const duvarlar: Duvar[] = [
    ...kabukDuvar(
      w,
      d,
      { kenar: 'guney', ofset: 10.4, genislik: 3.6 },
      [
        { kenar: 'guney', ofset: 2.0, genislik: 4.4 },
        { kenar: 'guney', ofset: 16.6, genislik: 4.4 },
        { kenar: 'kuzey', ofset: 3.0, genislik: 4.4 },
        { kenar: 'kuzey', ofset: 10.0, genislik: 4.4 },
        { kenar: 'kuzey', ofset: 17.0, genislik: 4.4 },
        { kenar: 'dogu', ofset: 4.0, genislik: 3.6 },
        { kenar: 'dogu', ofset: 10.6, genislik: 3.6 },
        { kenar: 'bati', ofset: 4.0, genislik: 3.6 },
        { kenar: 'bati', ofset: 10.6, genislik: 3.6 },
      ],
      0.32
    ),
    duvar(0, 7.0, 24, 7.0, 0.18, true, [kapi(3.0, 1.4), kapi(14.0, 1.4)]),
    duvar(8.0, 7.0, 8.0, 16, 0.18, true, [kapi(2.0, 1.0)]),
    duvar(16.0, 7.0, 16.0, 16, 0.18, true, [kapi(1.4, 1.0)]),
    duvar(8.0, 11.4, 16.0, 11.4, 0.18, true, [kapi(2.4, 1.0)]),
  ];
  const mahaller: Mahal[] = [
    { ad: 'TİCARET 1', x: 0.2, z: 0.2, w: 23.6, d: 6.6, tip: 'yasam' },
    { ad: 'LOBİ', x: 0.2, z: 7.2, w: 7.6, d: 4.0, tip: 'sirkulasyon' },
    { ad: 'OFİS A', x: 8.2, z: 7.2, w: 7.6, d: 4.0, tip: 'servis' },
    { ad: 'OFİS B', x: 16.2, z: 7.2, w: 7.6, d: 8.6, tip: 'servis' },
    { ad: 'SERVİS', x: 0.2, z: 11.6, w: 7.6, d: 4.2, tip: 'islak' },
    { ad: 'TOPLANTI', x: 8.2, z: 11.6, w: 7.6, d: 4.2, tip: 'servis' },
  ];
  const mobilyalar: Mobilya[] = [
    { x: 1.4, z: 1.4, w: 5.0, d: 1.4, h: 0.75, tip: 'masa' },
    { x: 8.0, z: 1.4, w: 5.0, d: 1.4, h: 0.75, tip: 'masa' },
    { x: 15.0, z: 1.4, w: 5.0, d: 1.4, h: 0.75, tip: 'masa' },
  ];
  return { ad: 'Karma Kullanım · Zemin Kat', genislik: w, derinlik: d, yukseklik: 4.2, duvarlar, mahaller, mobilyalar };
}

const PROJE_PLANLARI: Record<string, () => KatPlan[]> = {
  'luks-konut': () => [luksKonut()],
  'bes-katli-apartman': () => [apartman()],
  'ticari-ofis': () => [ticariOfis()],
  'butik-otel': () => [butikOtel()],
  'kafe-restoran': () => [kafeRestoran()],
  'dubleks-ev': () => [dubleksEv()],
  'karma-kullanimli-yapi': () => [karmaYapi()],
};

/** Projeye ait plan katlarını döndürür (slug yoksa modern villa) */
export function planKatlar(slug?: string): KatPlan[] {
  if (slug && PROJE_PLANLARI[slug]) return PROJE_PLANLARI[slug]();
  return modernVillaKatlar;
}

/** Duvar uzunluğu */
export function duvarUzunluk(d: Duvar): number {
  return Math.hypot(d.x2 - d.x1, d.z2 - d.z1);
}

/** Duvar doğrultusundaki birim vektör */
export function duvarYon(d: Duvar): { dx: number; dz: number } {
  const len = duvarUzunluk(d) || 1;
  return { dx: (d.x2 - d.x1) / len, dz: (d.z2 - d.z1) / len };
}

/** Plan üzerindeki bir açıklığın başlangıç/bitiş noktaları */
export function aciklikKonum(d: Duvar, a: Aciklik) {
  const yon = duvarYon(d);
  const s = { x: d.x1 + yon.dx * a.ofset, z: d.z1 + yon.dz * a.ofset };
  const e = { x: s.x + yon.dx * a.genislik, z: s.z + yon.dz * a.genislik };
  return { bas: s, son: e };
}
