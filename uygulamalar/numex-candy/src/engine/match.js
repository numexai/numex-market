/**
 * Numex Candy — Eşleşme (match) modülü
 * ------------------------------------------------------------
 * Tahtadaki 3'lü ve üzeri eşleşmeleri bulur, gruplar ve özel
 * şeker oluşumunu belirler.
 *
 * Kurallar (klasik match-3):
 *   3'lü  → normal patlama
 *   4'lü  → çizgili şeker (patlarsa satır/sütun temizler)
 *   5+    → renkli şeker (aynı renkteki her şeyi temizler)
 *   L/T   → bomba (3x3 alan temizler)
 *   2x2   → KARE şeker (anında patlar, 2x2 bloğu + çevresini temizler)
 *
 * Numex AI Bilişim Teknolojileri tarafından geliştirildi.
 */

import { icerde, sekerVar } from './board.js';

/**
 * Bir noktadan başlayarak yatay ve dikey aynı-renk koşuları bulur.
 * Dönen: { yatay: [...hücre], dikey: [...hücre] }
 */
export function kosular(tahta, r, c) {
  const h = tahta[r][c];
  if (!h || h === 'block' || typeof h !== 'object') return { yatay: [], dikey: [] };

  const satir = tahta.length;
  const sutun = tahta[0].length;
  const tip = h.tip;

  const ayniMi = (rr, cc) => sekerVar(tahta, rr, cc) && tahta[rr][cc].tip === tip;

  // yatay koşu
  let solC = c;
  while (solC - 1 >= 0 && ayniMi(r, solC - 1)) solC--;
  let sagC = c;
  while (sagC + 1 < sutun && ayniMi(r, sagC + 1)) sagC++;
  const yatay = [];
  for (let cc = solC; cc <= sagC; cc++) yatay.push([r, cc]);

  // dikey koşu
  let ustR = r;
  while (ustR - 1 >= 0 && ayniMi(ustR - 1, c)) ustR--;
  let altR = r;
  while (altR + 1 < satir && ayniMi(altR + 1, c)) altR++;
  const dikey = [];
  for (let rr = ustR; rr <= altR; rr++) dikey.push([rr, c]);

  return { yatay, dikey };
}

/**
 * Tahtadaki TÜM eşleşmeleri gruplar halinde bulur.
 * Aynı hücre birden fazla grupta görünmesin diye birleştirme yapılır.
 *
 * Dönen: [
 *   { hucreler: [[r,c],...], tip, uzunluk, yon: 'yatay'|'dikey'|'L', ozel: null|'cizgili'|'bomba'|'renkli' }
 * ]
 */
export function eslesmeleriBul(tahta) {
  const satir = tahta.length;
  const sutun = tahta[0].length;
  const anahtar = (r, c) => `${r}:${c}`;

  // 1. ADIM: yatay ve dikey tüm geçerli koşuları topla.
  // Burada satır/sütun bazlı tarama yapıyoruz ki L ve T şekilleri
  // kesişim noktasından bağımsız olarak yakalanabilsin.
  const kosuListesi = [];

  // yatay koşular
  for (let r = 0; r < satir; r++) {
    let baslangic = 0;
    while (baslangic < sutun) {
      if (!sekerVar(tahta, r, baslangic)) {
        baslangic++;
        continue;
      }
      const tip = tahta[r][baslangic].tip;
      let bitis = baslangic;
      while (
        bitis + 1 < sutun &&
        sekerVar(tahta, r, bitis + 1) &&
        tahta[r][bitis + 1].tip === tip
      ) {
        bitis++;
      }
      const uzunluk = bitis - baslangic + 1;
      if (uzunluk >= 3) {
        const hucreler = [];
        for (let cc = baslangic; cc <= bitis; cc++) hucreler.push([r, cc]);
        kosuListesi.push({ hucreler, tip, yon: 'yatay', uzunluk });
      }
      baslangic = bitis + 1;
    }
  }

  // dikey koşular
  for (let c = 0; c < sutun; c++) {
    let baslangic = 0;
    while (baslangic < satir) {
      if (!sekerVar(tahta, baslangic, c)) {
        baslangic++;
        continue;
      }
      const tip = tahta[baslangic][c].tip;
      let bitis = baslangic;
      while (
        bitis + 1 < satir &&
        sekerVar(tahta, bitis + 1, c) &&
        tahta[bitis + 1][c].tip === tip
      ) {
        bitis++;
      }
      const uzunluk = bitis - baslangic + 1;
      if (uzunluk >= 3) {
        const hucreler = [];
        for (let rr = baslangic; rr <= bitis; rr++) hucreler.push([rr, c]);
        kosuListesi.push({ hucreler, tip, yon: 'dikey', uzunluk });
      }
      baslangic = bitis + 1;
    }
  }

  // 1.5 ADIM: KARE (2x2) TARAMASI
  // 2x2 blok halinde 4 aynı renk şeker, klasik yatay/dikey koşu taramasıyla
  // YAKALANMAZ (her koşu en fazla 2 uzunluğunda kalır). Bu yüzden burada
  // ayrı bir tarama yapıp her kareyi kendi grubu olarak ekliyoruz.
  const kareGruplari = karelerBul(tahta);

  if (kosuListesi.length === 0 && kareGruplari.length === 0) return [];

  // 2. ADIM: aynı renkte ve kesişen koşuları birleştir (L / T şekilleri).
  // Union-Find benzeri basit gruplama: aynı tip + paylaşılan hücre → aynı grup.
  const gruplar = [];
  const kullanildi = new Array(kosuListesi.length).fill(false);

  const hücreSeti = (k) => new Set(k.hucreler.map(([r, c]) => anahtar(r, c)));

  for (let i = 0; i < kosuListesi.length; i++) {
    if (kullanildi[i]) continue;

    const grupKosulari = [kosuListesi[i]];
    kullanildi[i] = true;
    let genisledi = true;

    while (genisledi) {
      genisledi = false;
      const birlesikSet = new Set();
      for (const k of grupKosulari) {
        for (const h of hücreSeti(k)) birlesikSet.add(h);
      }

      for (let j = 0; j < kosuListesi.length; j++) {
        if (kullanildi[j]) continue;
        const aday = kosuListesi[j];
        // sadece aynı renk birleşir
        if (aday.tip !== grupKosulari[0].tip) continue;

        // en az bir hücre paylaşıyor mu?
        const paylasiyor = aday.hucreler.some(([r, c]) => birlesikSet.has(anahtar(r, c)));
        if (paylasiyor) {
          grupKosulari.push(aday);
          kullanildi[j] = true;
          genisledi = true;
        }
      }
    }

    // grubu tek hücre listesine indir
    const hucreSet = new Set();
    for (const k of grupKosulari) {
      for (const [r, c] of k.hucreler) hucreSet.add(anahtar(r, c));
    }
    const hucreler = [...hucreSet].map((k) => k.split(':').map(Number));
    const tip = grupKosulari[0].tip;
    const uzunluk = hucreler.length;

    // yön belirleme: hem yatay hem dikey koşu varsa L/T
    const yatayVar = grupKosulari.some((k) => k.yon === 'yatay');
    const dikeyVar = grupKosulari.some((k) => k.yon === 'dikey');
    const tekYon = grupKosulari[0].yon;

    let yon;
    if (yatayVar && dikeyVar) yon = 'L';
    else yon = tekYon;

    // merkez: en çok komşusu olan hücre (patlama görseli oraya otursun)
    const merkez = merkezBul(tahta, hucreler);

    // özel şeker kararı:
    // - L/T şekli (iki yön birleşmiş) → bomba
    // - düz 4'lü → çizgili
    // - düz 5+ → renkli
    let ozel;
    if (yon === 'L') ozel = 'bomba';
    else ozel = ozelSekerKarari(uzunluk, tekYon);

    gruplar.push({ hucreler, tip, uzunluk, yon, merkez, ozel });
  }

  // 2x2 kareleri de sonuca kat (kendi grubu, özel: 'kare')
  for (const kare of kareGruplari) gruplar.push(kare);

  return gruplar;
}

/** Grubun merkez hücresini bulur (kesişim/orta nokta önceliği). */
function merkezBul(tahta, hucreler) {
  const anahtar = (r, c) => `${r}:${c}`;
  const set = new Set(hucreler.map(([r, c]) => anahtar(r, c)));
  let enIyi = hucreler[0];
  let enIyiKomsu = -1;

  for (const [r, c] of hucreler) {
    let komsu = 0;
    for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
      if (set.has(anahtar(r + dr, c + dc))) komsu++;
    }
    if (komsu > enIyiKomsu) {
      enIyiKomsu = komsu;
      enIyi = [r, c];
    }
  }
  return enIyi;
}

/**
 * Eşleşme uzunluğuna göre hangi özel şeker doğar?
 */
export function ozelSekerKarari(uzunluk, yon) {
  if (uzunluk >= 5) return 'renkli';
  if (uzunluk === 4) return yon === 'dikey' ? 'cizgili-dikey' : 'cizgili-yatay';
  if (yon === 'L') return 'bomba';
  return null;
}

/**
 * Takas sonrası oluşan eşleşmeleri döndürür.
 * Geçersiz hamlede (eşleşme yoksa) null döner — takas geri alınmalıdır.
 */
export function takasSonucuEslesme(tahta, r1, c1, r2, c2) {
  const ilgili = [
    ...eslesmeleriBul(tahta).filter((g) =>
      g.hucreler.some(([r, c]) => (r === r1 && c === c1) || (r === r2 && c === c2))
    ),
  ];
  return ilgili.length > 0 ? ilgili : null;
}

/**
 * Özel şekerin patlama etkisini hesaplar.
 * Dönen: temizlenecek hücre koordinatları listesi.
 */
export function ozelPatlama(tahta, r, c) {
  const h = tahta[r][c];
  const hedefler = [];

  if (!h || h === 'block' || typeof h !== 'object' || !h.ozel) return hedefler;

  if (h.ozel === 'cizgili-yatay') {
    for (let cc = 0; cc < tahta[0].length; cc++) {
      if (sekerVar(tahta, r, cc)) hedefler.push([r, cc]);
    }
  } else if (h.ozel === 'cizgili-dikey') {
    for (let rr = 0; rr < tahta.length; rr++) {
      if (sekerVar(tahta, rr, c)) hedefler.push([rr, c]);
    }
  } else if (h.ozel === 'bomba') {
    for (let rr = r - 1; rr <= r + 1; rr++) {
      for (let cc = c - 1; cc <= c + 1; cc++) {
        if (icerde(tahta, rr, cc) && sekerVar(tahta, rr, cc)) hedefler.push([rr, cc]);
      }
    }
  } else if (h.ozel === 'kare') {
    // KARE şeker: kendi 2x2 bloğu + çevresindeki bir halka komşuyu temizler.
    // Merkez olarak (r,c) verilir; 2x2 bloğun sol-üst köşesini referans alır.
    // Kare şeker 2x2 bloğun sol-üst hücresinde yaşar; güvenli olması için
    // 3x3'lük alanı tararız (blok + bir halka çevre = 9 hücreye kadar).
    for (let rr = r - 1; rr <= r + 2; rr++) {
      for (let cc = c - 1; cc <= c + 2; cc++) {
        if (icerde(tahta, rr, cc) && sekerVar(tahta, rr, cc)) hedefler.push([rr, cc]);
      }
    }
  } else if (h.ozel === 'renkli') {
    // renkli şeker: tahtadaki TÜM aynı tipi siler (tetiklendiği tip)
    const hedefTip = h.hedefTip !== undefined ? h.hedefTip : h.tip;
    for (let rr = 0; rr < tahta.length; rr++) {
      for (let cc = 0; cc < tahta[0].length; cc++) {
        if (sekerVar(tahta, rr, cc) && tahta[rr][cc].tip === hedefTip) hedefler.push([rr, cc]);
      }
    }
  }

  return hedefler;
}

/**
 * Zincirleme patlama: bir hücre setindeki özel şekerler patlayınca
 * yeni hücreler tetiklenir. Sabit noktaya ulaşana kadar döner.
 */
export function patlamaYayilimi(tahta, baslangicHucreleri) {
  const temizlenecek = new Set();
  const kuyruk = [...baslangicHucreleri];

  while (kuyruk.length > 0) {
    const [r, c] = kuyruk.shift();
    const k = `${r}:${c}`;
    if (temizlenecek.has(k)) continue;
    if (!sekerVar(tahta, r, c)) continue;

    temizlenecek.add(k);

    // bu hücredeki özel şeker varsa etkisini yay
    const etki = ozelPatlama(tahta, r, c);
    for (const [rr, cc] of etki) {
      const kk = `${rr}:${cc}`;
      if (!temizlenecek.has(kk)) kuyruk.push([rr, cc]);
    }
  }

  return [...temizlenecek].map((k) => k.split(':').map(Number));
}

/** Bir hücrenin tipini güvenli şekilde okur. */
export function hucreTipi(tahta, r, c) {
  if (!sekerVar(tahta, r, c)) return null;
  return tahta[r][c].tip;
}

/**
 * Tahtadaki 2x2 KARE eşleşmelerini bulur.
 * ------------------------------------------------------------
 * 2x2 blok halinde 4 aynı renk şeker, klasik yatay/dikey koşu
 * taramasından kaçabilir (her koşu en fazla 2 uzunlukta kalır).
 * Bu fonksiyon o boşluğu kapatır: satırları çiftler halinde gezip
 * aynı renk 2x2 blokları toplar.
 *
 * Kural (kullanıcı isteği): Kare 4'lü ANINDA sayılır ve patlar;
 * patlama 2x2 bloğun kendisi + çevresindeki komşu şekerleri temizler.
 *
 * Dönen: [{ hucreler: [[r,c],...4 adet], tip, uzunluk: 4, yon: 'kare',
 *           merkez, ozel: 'kare' }]
 */
export function karelerBul(tahta) {
  const satir = tahta.length;
  const sutun = tahta[0].length;
  const kareler = [];

  for (let r = 0; r < satir - 1; r++) {
    for (let c = 0; c < sutun - 1; c++) {
      // 2x2 bloğun 4 hücresi de şeker olmalı ve aynı tipte olmalı
      if (
        !sekerVar(tahta, r, c) ||
        !sekerVar(tahta, r, c + 1) ||
        !sekerVar(tahta, r + 1, c) ||
        !sekerVar(tahta, r + 1, c + 1)
      ) {
        continue;
      }

      const tip = tahta[r][c].tip;
      const ayniRenk =
        tahta[r][c + 1].tip === tip &&
        tahta[r + 1][c].tip === tip &&
        tahta[r + 1][c + 1].tip === tip;

      if (!ayniRenk) continue;

      kareler.push({
        hucreler: [
          [r, c],
          [r, c + 1],
          [r + 1, c],
          [r + 1, c + 1],
        ],
        tip,
        uzunluk: 4,
        yon: 'kare',
        merkez: [r, c], // sol üst köşe referans (patlama görseli buraya)
        ozel: 'kare',
      });
    }
  }

  return kareler;
}
