/* NUMEX KÖKLER — Yerleşim motoru (v2: kompakt, satır kıran)
   - Kutular kompakt (140×64).
   - Bir kuşakta çok kişi varsa (eşik aşılırsa) kuşak içi 2 satıra kırılır.
     Böylece 23 kişilik bir kuşak 4.600px yerine ~1.900px yer kaplar.
   - Eşler bitişik, kardeşler aynı satırda ve yan yana.
   - Bağlantı çizgileri kutu içinden geçmez: ebeveyn → ray → çocuk. */
(function (kok) {
  'use strict';

  const KUTU_G = 152;    // kutu aralığı (kutu genişliği = KUTU_G-10)
  const KUTU_Y = 62;     // kutu yüksekliği
  const ARA_KARDES = 30; // kardeş grupları arası
  const KUSAK_Y = 132;   // kuşaklar arası dikey
  const SATIR_Y = 74;    // kuşak içi ikinci satır aralığı
  const KIRILMA_ESIGI = 850; // kuşak bandı bu genişliği aşarsa satır kır

  function yerlesimKur(veri, NK) {
    const ix = NK.indeksKur(veri);
    const kusak = NK.kusakHaritasi(veri);

    const satirlar = new Map();
    ix.kisiler.forEach((k) => {
      const n = kusak.get(k.id) || 0;
      if (!satirlar.has(n)) satirlar.set(n, []);
      satirlar.get(n).push(k.id);
    });

    const konum = new Map();
    const bantGenisligi = new Map();
    let toplamY = 0;
    let kusakBaslaY = 0;

    [...satirlar.keys()].sort((a, b) => a - b).forEach((kusakNo) => {
      const idler = satirlar.get(kusakNo);
      const yerlesen = new Set();
      const gruplar = [];

      // 1) Eş çiftleri bir arada
      idler.forEach((id) => {
        if (yerlesen.has(id)) return;
        const esler = (ix.esler.get(id) || []).filter((e) => idler.includes(e) && !yerlesen.has(e));
        if (esler.length) {
          const grup = [id, ...esler];
          grup.forEach((g) => yerlesen.add(g));
          gruplar.push(grup);
        }
      });

      // 2) Kardeş grupları bir arada (aynı ebeveyn seti)
      const yalnizlar = idler.filter((id) => !yerlesen.has(id));
      const kardesGruplari = new Map();
      yalnizlar.forEach((id) => {
        const k = ix.kisiler.get(id);
        const anahtar = [k.anneId, k.babaId].filter(Boolean).sort().join('|') || ('tek-' + id);
        if (!kardesGruplari.has(anahtar)) kardesGruplari.set(anahtar, []);
        kardesGruplari.get(anahtar).push(id);
      });
      kardesGruplari.forEach((liste) => gruplar.push(liste));

      // 3) Doğum yılına göre sırala
      gruplar.sort((g1, g2) => {
        const y1 = Math.min(...g1.map((i) => NK.yil((ix.kisiler.get(i) || {}).dogum) || 9999));
        const y2 = Math.min(...g2.map((i) => NK.yil((ix.kisiler.get(i) || {}).dogum) || 9999));
        return y1 - y2;
      });

      // 4) Grup genişliklerini önce hesapla (satır kırma kararı için)
      const genislik = (g) => (g.length - 1) * KUTU_G + (KUTU_G - 10) + ARA_KARDES;
      const toplamGen = gruplar.reduce((t, g) => t + genislik(g), 0);

      // 5) Satırlara böl: bant eşiği aşılırsa dengeli iki satır
      let satirlarGruplar = [gruplar];
      if (toplamGen > KIRILMA_ESIGI && gruplar.length > 2) {
        const hedef = toplamGen / 2;
        const s1 = []; const s2 = [];
        let acc = 0;
        gruplar.forEach((g) => {
          if (acc < hedef) { s1.push(g); acc += genislik(g); }
          else s2.push(g);
        });
        if (s1.length && s2.length) satirlarGruplar = [s1, s2];
      }

      // 6) Yerleştir
      let bantEn = 0;
      satirlarGruplar.forEach((grupListe, si) => {
        let x = 0;
        const y = kusakBaslaY + si * SATIR_Y;
        grupListe.forEach((grup, gi) => {
          grup.forEach((id, i) => {
            konum.set(id, { x: x + i * KUTU_G, y: y, kusak: kusakNo, satir: si });
          });
          x += genislik(grup);
          if (gi === grupListe.length - 1) x -= ARA_KARDES;
        });
        bantEn = Math.max(bantEn, x);
      });

      bantGenisligi.set(kusakNo, Math.max(bantEn, 1));
      toplamY = Math.max(toplamY, kusakBaslaY + (satirlarGruplar.length - 1) * SATIR_Y + KUTU_Y);
      kusakBaslaY += (satirlarGruplar.length > 1 ? SATIR_Y : 0) + KUSAK_Y;
    });

    // Kuşakları yatayda ortala
    const genislik = Math.max(...[...bantGenisligi.values()], 600);
    satirlar.forEach((idler, kusakNo) => {
      const bant = bantGenisligi.get(kusakNo) || 0;
      const kaydir = (genislik - bant) / 2;
      idler.forEach((id) => {
        const p = konum.get(id);
        if (p) p.x += kaydir;
      });
    });

    // ---- Evlilik bağlantıları ----
    const evlilikCizgileri = [];
    ix.evlilikler.forEach((e) => {
      const pa = konum.get(e.a), pb = konum.get(e.b);
      if (!pa || !pb) return;
      const ayniSatir = pa.y === pb.y;
      if (ayniSatir) {
        const sol = pa.x < pb.x ? pa : pb, sag = pa.x < pb.x ? pb : pa;
        evlilikCizgileri.push({
          x1: sol.x + (KUTU_G - 10), y1: sol.y + KUTU_Y / 2,
          x2: sag.x, y2: sag.y + KUTU_Y / 2,
          bosanma: !!e.bitis, id: e.id, ailesi: e.a, cift: [e.a, e.b],
          orta: { x: (sol.x + (KUTU_G - 10) + sag.x) / 2, y: sol.y + KUTU_Y / 2 }
        });
      }
      // NOT: Eşler farklı satıra düştüyse ARAYA AĞAÇ ÇİZGİSİ ÇEKİLMEZ.
      // Kullanıcının açık kuralı: çizgiler kişilerin arasından rastgele geçmesin.
      // Eş bağı kişi kartında ve listelerde gösterilir.
    });

    // ---- Ebeveyn → çocuk ----
    const cizgiler = [];
    const cocukGruplari = new Map();
    ix.kisiler.forEach((k) => {
      const ebeveynler = [k.anneId, k.babaId].filter((p) => p && konum.has(p));
      if (!ebeveynler.length) return;
      const anahtar = ebeveynler.slice().sort().join('|');
      if (!cocukGruplari.has(anahtar)) cocukGruplari.set(anahtar, { ebeveynler, cocuklar: [] });
      cocukGruplari.get(anahtar).cocuklar.push(k.id);
    });

    cocukGruplari.forEach(({ ebeveynler, cocuklar }) => {
      const pKonum = ebeveynler.map((p) => konum.get(p)).filter(Boolean);
      if (!pKonum.length || !cocuklar.length) return;

      let ortaX;
      if (pKonum.length >= 2) {
        const xs = pKonum.map((p) => p.x);
        ortaX = (Math.min(...xs) + Math.max(...xs) + (KUTU_G - 10)) / 2;
      } else {
        ortaX = pKonum[0].x + (KUTU_G - 10) / 2;
      }
      const ebeveynY = Math.max(...pKonum.map((p) => p.y)) + KUTU_Y;
      const cocukYler = cocuklar.map((c) => konum.get(c).y);
      const enYakinCocukY = Math.min(...cocukYler);
      const rayY = ebeveynY + Math.max(14, (enYakinCocukY - ebeveynY) * 0.5);

      cizgiler.push({ tip: 'ebeveyn-dikey', x1: ortaX, y1: ebeveynY, x2: ortaX, y2: rayY, kaynak: ebeveynler[0] });
      cocuklar.forEach((c) => {
        const cp = konum.get(c);
        const cx = cp.x + (KUTU_G - 10) / 2;
        cizgiler.push({ tip: 'cocuk-yatay', x1: ortaX, y1: rayY, x2: cx, y2: rayY, kaynak: ebeveynler[0] });
        cizgiler.push({ tip: 'cocuk-dikey', x1: cx, y1: rayY, x2: cx, y2: cp.y, kaynak: ebeveynler[0] });
      });
    });

    return {
      konum, kusak, genislik, kutuG: KUTU_G, kutuY: KUTU_Y, kusakY: KUSAK_Y,
      evlilikCizgileri, cizgiler, satirlar,
      yukseklik: toplamY + 70
    };
  }

  function basHarfler(k) {
    const a = (k.ad || '').trim().charAt(0) || '?';
    const s = (k.soyad || '').trim().charAt(0) || '';
    return (a + s).toLocaleUpperCase('tr-TR');
  }

  const Y = { yerlesimKur, basHarfler, KUTU_G, KUTU_Y };
  if (typeof module !== 'undefined' && module.exports) module.exports = Y;
  if (typeof window !== 'undefined') window.NK_YERLESIM = Y;
})(typeof globalThis !== 'undefined' ? globalThis : this);
