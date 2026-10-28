/**
 * Numex Candy — Tahta (board) modülü
 * ------------------------------------------------------------
 * Tahta temsilini, hücre erişimini ve başlangıç dolumunu yönetir.
 * Saf fonksiyonlar — DOM'a hiç dokunmaz, test edilebilir.
 *
 * Tahta hücresi:
 *   null            → boş hücre (yerçekimi sonrası geçici)
 *   'block'         → kalıcı engel (oyun alanı dışı)
 *   { tip: number } → şeker
 *   { tip, ozel }   → özel şeker ( 'cizgili' | 'bomba' | 'renkli' )
 *
 * Numex AI Bilişim Teknolojileri tarafından geliştirildi.
 */

/**
 * Şeker tipi sayısı. Motorun sunucuya bağımlı olmaması için burada
 * sabit tutulur; sunucudaki CANDY_TYPES listesiyle eşleşir (6 tip).
 */
export const TIP_SAYISI = 6;

/** Boş bir tahta üretir. */
export function tahtaOlustur(satir, sutun) {
  return Array.from({ length: satir }, () => Array.from({ length: sutun }, () => null));
}

/** Tahtayı klonlar (derin — hücre nesneleri de kopyalanır). */
export function tahtaKopyala(tahta) {
  return tahta.map((satir) => satir.map((h) => (h && typeof h === 'object' ? { ...h } : h)));
}

/** Hücre koordinatı tahta sınırları içinde mi? */
export function icerde(tahta, r, c) {
  return r >= 0 && c >= 0 && r < tahta.length && c < tahta[0].length;
}

/** Hücre oynanabilir mi (blok değil mi)? */
export function oynanabilir(tahta, r, c) {
  if (!icerde(tahta, r, c)) return false;
  return tahta[r][c] !== 'block';
}

/** Hücrede şeker var mı? */
export function sekerVar(tahta, r, c) {
  if (!icerde(tahta, r, c)) return false;
  const h = tahta[r][c];
  return h !== null && h !== 'block' && typeof h === 'object';
}

/**
 * Yeni tahtayı doldurur. Kritik kural: başlangıçta HİÇBİR hazır eşleşme olmamalı,
 * yoksa oyun kendiliğinden patlar ve oyuncu haksız puan kazanır.
 */
export function tahtayiDoldur(tahta, rastgele = Math.random) {
  for (let r = 0; r < tahta.length; r++) {
    for (let c = 0; c < tahta[0].length; c++) {
      if (tahta[r][c] === 'block') continue;
      tahta[r][c] = { tip: guvenliTip(tahta, r, c, rastgele) };
    }
  }
  return tahta;
}

/**
 * Bir hücre için, sola ve yukarıya bakarak eşleşme yaratmayacak tip seçer.
 * Deneme-yanılma yerine yasaklı tipleri çıkarıp kalanlardan seçer — daha hızlı.
 */
function guvenliTip(tahta, r, c, rastgele) {
  const yasak = new Set();

  // yatay: soldaki iki komşu aynıysa o tipi yasakla
  const s1 = tahta[r][c - 1];
  const s2 = tahta[r][c - 2];
  if (s1 && s2 && typeof s1 === 'object' && typeof s2 === 'object' && s1.tip === s2.tip) {
    yasak.add(s1.tip);
  }

  // dikey: üstteki iki komşu aynıysa o tipi yasakla
  const u1 = icerde(tahta, r - 1, c) ? tahta[r - 1][c] : null;
  const u2 = icerde(tahta, r - 2, c) ? tahta[r - 2][c] : null;
  if (u1 && u2 && typeof u1 === 'object' && typeof u2 === 'object' && u1.tip === u2.tip) {
    yasak.add(u1.tip);
  }

  const secenekler = [];
  for (let t = 0; t < TIP_SAYISI; t++) {
    if (!yasak.has(t)) secenekler.push(t);
  }

  // teorik olarak boş kalmaz (6 tip, en fazla 2 yasak) ama güvence olsun
  if (secenekler.length === 0) {
    return Math.floor(rastgele() * TIP_SAYISI);
  }

  // tür çeşitliliği için rastgele seç
  return secenekler[Math.floor(rastgele() * secenekler.length)];
}

/** Tahtada herhangi bir geçerli hamle kaldı mı? */
export function hamleVarMi(tahta) {
  for (let r = 0; r < tahta.length; r++) {
    for (let c = 0; c < tahta[0].length; c++) {
      if (!sekerVar(tahta, r, c)) continue;
      // sağa takas
      if (c + 1 < tahta[0].length && sekerVar(tahta, r, c + 1)) {
        const kopya = tahtaKopyala(tahta);
        takasEt(kopya, r, c, r, c + 1);
        if (eslesmeVarMi(kopya)) return true;
      }
      // aşağı takas
      if (r + 1 < tahta.length && sekerVar(tahta, r + 1, c)) {
        const kopya = tahtaKopyala(tahta);
        takasEt(kopya, r, c, r + 1, c);
        if (eslesmeVarMi(kopya)) return true;
      }
    }
  }
  return false;
}

/** İki komşu hücreyi yer değiştirir (tahtayı mutasyona uğratır). */
export function takasEt(tahta, r1, c1, r2, c2) {
  const gecici = tahta[r1][c1];
  tahta[r1][c1] = tahta[r2][c2];
  tahta[r2][c2] = gecici;
  return tahta;
}

/** Tahtada en az bir eşleşme var mı? (hızlı kontrol) */
export function eslesmeVarMi(tahta) {
  const satir = tahta.length;
  const sutun = tahta[0].length;

  for (let r = 0; r < satir; r++) {
    for (let c = 0; c < sutun; c++) {
      const h = tahta[r][c];
      if (!h || h === 'block' || typeof h !== 'object') continue;

      // yatay 3'lü
      if (c + 2 < sutun) {
        const a = tahta[r][c + 1];
        const b = tahta[r][c + 2];
        if (a && b && a !== 'block' && b !== 'block' && a.tip === h.tip && b.tip === h.tip) {
          return true;
        }
      }
      // dikey 3'lü
      if (r + 2 < satir) {
        const a = tahta[r + 1][c];
        const b = tahta[r + 2][c];
        if (a && b && a !== 'block' && b !== 'block' && a.tip === h.tip && b.tip === h.tip) {
          return true;
        }
      }
    }
  }
  return false;
}

/** Tahtadaki şeker sayısı (teşhis/UI için). */
export function sekerSayisi(tahta) {
  let n = 0;
  for (const satir of tahta) {
    for (const h of satir) {
      if (h && h !== 'block' && typeof h === 'object') n++;
    }
  }
  return n;
}

/** Tahtayı okunabilir stringe çevirir (hata ayıklama). */
export function tahtaYazdir(tahta) {
  return tahta
    .map((satir) =>
      satir
        .map((h) => {
          if (h === 'block') return '##';
          if (h === null) return '..';
          if (h.ozel) return `*${h.tip}`;
          return ` ${h.tip}`;
        })
        .join('')
    )
    .join('\n');
}
