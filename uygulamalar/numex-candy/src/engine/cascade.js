/**
 * Numex Candy — Yerçekimi ve dolum (cascade) modülü
 * ------------------------------------------------------------
 * Patlayan hücrelerin ardından taşların düşmesini,
 * tepeden yeni şeker gelmesini ve zincirleme patlamayı yönetir.
 *
 * Numex AI Bilişim Teknolojileri tarafından geliştirildi.
 */

import { tahtaKopyala, sekerVar, icerde } from './board.js';
import { eslesmeleriBul, patlamaYayilimi } from './match.js';

/**
 * Tahtaya yerçekimi uygular: boşlukların üstündeki şekerler aşağı kayar,
 * en üstte oluşan boşluklar yeni şekerlerle dolar.
 *
 * @returns {Array} hareketler — UI animasyonu için [{ r, c, kaynak, hedef }]
 */
export function yerCekimiUygula(tahta, tipUretici) {
  const satir = tahta.length;
  const sutun = tahta[0].length;
  const hareketler = [];

  for (let c = 0; c < sutun; c++) {
    // sütunu aşağıdan yukarı tara, boşlukları doldur
    let yazacak = satir - 1;

    for (let r = satir - 1; r >= 0; r--) {
      if (tahta[r][c] === 'block') {
        // blok kalıcı bariyer: altındaki bölge ayrı bir "havuz" değil,
        // basitlik için bloğun üstündeki şekerler bloğun üstünde kalır
        yazacak = r - 1;
        continue;
      }

      if (sekerVar(tahta, r, c)) {
        if (r !== yazacak) {
          tahta[yazacak][c] = tahta[r][c];
          tahta[r][c] = null;
          hareketler.push({ sutun: c, kaynakSatir: r, hedefSatir: yazacak });
        }
        yazacak--;
      }
    }

    // kalan boşluklara yeni şeker üret (tepeden gelir)
    for (let r = yazacak; r >= 0; r--) {
      if (tahta[r][c] === 'block') continue;
      if (tahta[r][c] === null) {
        tahta[r][c] = { tip: tipUretici(), yeni: true };
        hareketler.push({ sutun: c, kaynakSatir: -1, hedefSatir: r });
      }
    }
  }

  return hareketler;
}

/**
 * Bir eşleşme grubunu patlatır, puan döner ve jeli kırar.
 *
 * @param {Array} tahta
 * @param {Array} gruplar — eslesmeleriBul çıktısı
 * @param {Set} jel — kırılacak jel hücreleri ("r:c")
 * @param {Object} sayac — { renk: adet } toplanan şeker sayacı (mutasyona uğrar)
 * @returns {Object} { kazanilanPuan, patlayanHucreler, ozelDogdu, kirilanJel }
 */
export function gruplariPatlat(tahta, gruplar, jel, sayac, puanHesapla, skor) {
  const tumHucreler = new Set();
  let ozelDogdu = [];
  const kirilanJel = [];

  for (const grup of gruplar) {
    for (const [r, c] of grup.hucreler) {
      tumHucreler.add(`${r}:${c}`);
    }
  }

  // özel şekerlerin yayılımını hesapla
  const yayilmis = patlamaYayilimi(tahta, [...tumHucreler].map((k) => k.split(':').map(Number)));
  yayilmis.forEach(([r, c]) => tumHucreler.add(`${r}:${c}`));

  const patlayanHucreler = [...tumHucreler].map((k) => k.split(':').map(Number));

  // sayacı güncelle + jel kır
  for (const [r, c] of patlayanHucreler) {
    if (!sekerVar(tahta, r, c)) continue;
    const tip = tahta[r][c].tip;
    sayac[tip] = (sayac[tip] || 0) + 1;

    const jk = `${r}:${c}`;
    if (jel.has(jk)) {
      jel.delete(jk);
      kirilanJel.push([r, c]);
    }
  }

  // özel şeker doğuşu: grubun merkezine yerleştir (ama patlamasın)
  for (const grup of gruplar) {
    if (!grup.ozel) continue;
    const [mr, mc] = grup.merkez;
    if (!icerde(tahta, mr, mc)) continue;

    // merkez hücre patlama listesinden çıkarılıp özel şekerle değiştirilecek
    const mk = `${mr}:${mc}`;
    const idx = patlayanHucreler.findIndex(([r, c]) => `${r}:${c}` === mk);
    if (idx >= 0) patlayanHucreler.splice(idx, 1);

    let ozelTip = grup.ozel;
    if (ozelTip === 'renkli') {
      tahta[mr][mc] = { tip: grup.tip, ozel: 'renkli', hedefTip: grup.tip };
    } else {
      tahta[mr][mc] = { tip: grup.tip, ozel: ozelTip };
    }
    ozelDogdu.push({ r: mr, c: mc, ozel: ozelTip, tip: grup.tip });
  }

  // patlayanları temizle
  for (const [r, c] of patlayanHucreler) {
    tahta[r][c] = null;
  }

  const kazanilanPuan = puanHesapla(patlayanHucreler.length, gruplar, skor);

  return { kazanilanPuan, patlayanHucreler, ozelDogdu, kirilanJel };
}

/**
 * Zincirleme patlama döngüsü: eşleşme bul → patlat → düşür → tekrar.
 * Sabit noktaya ulaşınca durur.
 *
 * @returns {Object} { turlar: [...], toplamPuan, jeller }
 */
export function zincirlemeCalistir(tahta, jelSet, tipUretici, puanHesapla, sayac, baslangicSkor) {
  const turlar = [];
  let toplamPuan = 0;
  let skor = baslangicSkor;
  let tur = 0;
  const MAX_TUR = 60; // güvenlik valfi — sonsuz döngü koruması

  while (tur < MAX_TUR) {
    const gruplar = eslesmeleriBul(tahta);
    if (gruplar.length === 0) break;

    const sonuc = gruplariPatlat(tahta, gruplar, jelSet, sayac, puanHesapla, skor);
    toplamPuan += sonuc.kazanilanPuan;
    skor += sonuc.kazanilanPuan;

    const hareketler = yerCekimiUygula(tahta, tipUretici);

    turlar.push({
      tur,
      gruplar: gruplar.map((g) => ({ hucreler: g.hucreler, tip: g.tip, ozel: g.ozel, merkez: g.merkez })),
      patlayanlar: sonuc.patlayanHucreler,
      ozelDogdu: sonuc.ozelDogdu,
      kirilanJel: sonuc.kirilanJel,
      hareketler,
      puan: sonuc.kazanilanPuan,
    });

    tur++;
  }

  return { turlar, toplamPuan, skor };
}

/** Tahtanın oynanabilir kalıp kalmadığını kontrol eder; gerekirse karıştırır. */
export function karistirGerekliMi(tahta, hamleVarMi, tahtayiDoldur) {
  if (hamleVarMi(tahta)) return false;
  // eşleşme yaratan hamle yoksa tahtayı yeniden doldur
  const tipUretici = () => Math.floor(Math.random() * 6);
  yerCekimiUygula(tahta, tipUretici);
  return true;
}
