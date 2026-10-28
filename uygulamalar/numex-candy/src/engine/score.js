/**
 * Numex Candy — Puanlama ve güçlendirici (booster) modülü
 * ------------------------------------------------------------
 * Puan hesabı, yıldız eşikleri ve güçlendirici kuralları.
 *
 * Numex AI Bilişim Teknolojileri tarafından geliştirildi.
 */

/**
 * Patlayan hücre sayısına ve grup yapısına göre puan hesaplar.
 * Temel kural: her hücre 60 puan. Fazla uzun gruplar bonus alır.
 * Zincirleme (cascade) turlarında çarpan artar — bu, usta oyuncuyu ödüllendirir.
 */
export function puanHesapla(hucreSayisi, gruplar = [], mevcutSkor = 0) {
  const TEMEL = 60;
  let puan = hucreSayisi * TEMEL;

  for (const grup of gruplar) {
    if (grup.yon === 'kare') {
      // KARE 4'lü: normal 4'lüden DAHA DEĞERLİ (yakalanması zor bir diziliş).
      puan += 500;
      continue;
    }
    if (grup.uzunluk === 4) puan += 300;
    else if (grup.uzunluk >= 5) puan += 600;
    if (grup.yon === 'L') puan += 450;
  }

  return puan;
}

/**
 * Zincirleme tur sayısına göre çarpan üretir.
 * 1. tur: x1, 2. tur: x1.5, 3. tur: x2, sonrası x2.5 (tavan)
 */
export function zincirCarpani(tur) {
  if (tur <= 0) return 1;
  if (tur === 1) return 1.5;
  if (tur === 2) return 2;
  return 2.5;
}

/** Puanı yıldız sayısına çevirir. */
export function yildizHesapla(skor, yildizlar) {
  const [b1, b2, b3] = yildizlar;
  if (skor >= b3) return 3;
  if (skor >= b2) return 2;
  if (skor >= b1) return 1;
  return 0;
}

/** Bir sonraki yıldız eşiğine ne kadar kaldı? */
export function sonrakiEsik(skor, yildizlar) {
  for (const esik of yildizlar) {
    if (skor < esik) return esik;
  }
  return null;
}

/**
 * GÜÇLENDİRİCİLER (booster)
 * Her bölüm başında oyuncuya sınırlı sayıda verilir.
 *
 *   cekic    : tek bir şekeri yok eder
 *   karistir : tahtayı yeniden karıştırır (eşleşme garantili)
 *   bomba    : 3x3 alanı temizler
 */
export const BOOSTERS = Object.freeze({
  cekir: {
    id: 'cekir',
    ad: 'Çekiç',
    aciklama: 'Tek bir şekeri tek dokunuşla yok eder.',
    ikon: '🔨',
    adet: 3,
  },
  karistir: {
    id: 'karistir',
    ad: 'Karıştır',
    aciklama: 'Tahtayı yeniden karıştırır. Sıkıştığında hayat kurtarır.',
    ikon: '🔀',
    adet: 2,
  },
  bomba: {
    id: 'bomba',
    ad: 'Bomba',
    aciklama: '3x3 alanı temizler.',
    ikon: '💥',
    adet: 2,
  },
});

/**
 * Bölüm zorluğuna göre booster paketi döner (zor bölümde daha çok).
 *
 * NOT: Dönen anahtarlar BOOSTERS[].id ile BİREBİR aynı olmak zorundadır;
 * arayüz `S.booster[t.id]` şeklinde erişir. Burada bir harf uyuşmazlığı
 * (cekir/cekic) `undefined.adet` → TypeError fırlatıp bolumBaslat()'ı
 * çökertiyor ve oyun hiç açılmıyordu.
 */
export function boosterPaketi(levelId) {
  const carpan = Number(levelId) <= 5 ? 1 : Number(levelId) <= 12 ? 1.5 : 2;

  return {
    cekir: Math.round(BOOSTERS.cekir.adet * carpan),
    karistir: Math.round(BOOSTERS.karistir.adet * carpan),
    bomba: Math.round(BOOSTERS.bomba.adet * carpan),
  };
}

/** Bölüm sonucunu değerlendirir. */
export function bolumDegerlendir(level, skor, hedefDurum) {
  const yildiz = yildizHesapla(skor, level.yildizlar);
  const basarili = hedefDurum.every((h) => h.tamam);

  return {
    basarili,
    yildiz,
    skor,
    sonrakiBolumAcik: basarili && level.id < 20,
    mesaj: basarili ? (yildiz >= 3 ? 'Muhteşem!' : 'Bölüm tamam!') : 'Hedefe ulaşılamadı',
  };
}

/** Bölüm hedeflerinin anlık durumunu üretir. */
export function hedefDurumu(level, skor, sayac, jelSayisi) {
  if (jelSayisi !== undefined && jelSayisi !== null) {
    return level.hedefler.length > 0
      ? level.hedefler.map((h) => hedefTek(level, h, skor, sayac, jelSayisi))
      : [{ tip: 'jel', etiket: `Jel temizle (${jelSayisi} kaldı)`, tamam: jelSayisi === 0, ilerleme: 1 }];
  }
  return level.hedefler.map((h) => hedefTek(level, h, skor, sayac, jelSayisi));
}

function hedefTek(level, h, skor, sayac, jelSayisi) {
  if (h.tip === 'score') {
    return {
      tip: 'score',
      etiket: `Puan: ${skor} / ${h.adet}`,
      tamam: skor >= h.adet,
      ilerleme: Math.min(1, skor / h.adet),
    };
  }
  if (h.tip === 'collect') {
    const toplanan = sayac[h.renk] || 0;
    return {
      tip: 'collect',
      renk: h.renk,
      etiket: `Topla: ${toplanan} / ${h.adet}`,
      tamam: toplanan >= h.adet,
      ilerleme: Math.min(1, toplanan / h.adet),
    };
  }
  if (h.tip === 'jel') {
    return {
      tip: 'jel',
      etiket: `Jel: ${jelSayisi === 0 ? 'temiz!' : jelSayisi + ' kaldı'}`,
      tamam: jelSayisi === 0,
      ilerleme: 0,
    };
  }
  return { tip: 'bilinmeyen', etiket: 'Hedef', tamam: false, ilerleme: 0 };
}
