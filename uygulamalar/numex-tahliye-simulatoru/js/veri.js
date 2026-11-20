// Numex Afet — kurgusal şehir veri modeli
export function olusturSehir() {
  const kavsaklar = [], yollar = [];
  // 6x6 ızgara = 36 kavşak
  for (let r = 0; r < 6; r++) for (let c = 0; c < 6; c++) {
    kavsaklar.push({ id: `K${r}${c}`, x: 90 + c * 110, y: 80 + r * 95 });
  }
  let n = 0;
  const ekle = (a, b, uzunluk, sure, kapasite) => {
    yollar.push({ id: `Y${++n}`, a, b, uzunluk, sure, kapasite, kapali: false });
  };
  // yatay yollar
  for (let r = 0; r < 6; r++) for (let c = 0; c < 5; c++) {
    ekle(`K${r}${c}`, `K${r}${c + 1}`, 1.1, 2 + (r % 3), 400 + (c * 50));
  }
  // dikey yollar
  for (let c = 0; c < 6; c++) for (let r = 0; r < 5; r++) {
    ekle(`K${r}${c}`, `K${r + 1}${c}`, 1.0, 2 + ((c + 1) % 3), 380 + (r * 40));
  }
  // köprü / ana bağlantılar (çapraz, 6 adet)
  ekle('K00', 'K11', 1.6, 3, 240);
  ekle('K05', 'K14', 1.6, 3, 240);
  ekle('K30', 'K41', 1.6, 3, 220);
  ekle('K35', 'K44', 1.6, 3, 220);
  ekle('K12', 'K23', 1.5, 3, 260);
  ekle('K42', 'K53', 1.5, 3, 260);
  const bolgeler = [
    { id: 'B1', ad: 'Yeşiltepe', kavsakId: 'K00', nufus: 4200 },
    { id: 'B2', ad: 'Liman Mah.', kavsakId: 'K05', nufus: 3600 },
    { id: 'B3', ad: 'Sanayi Bölgesi', kavsakId: 'K30', nufus: 5100 },
    { id: 'B4', ad: 'Kuzey Konutları', kavsakId: 'K35', nufus: 2800 },
    { id: 'B5', ad: 'Eski Çarşı', kavsakId: 'K12', nufus: 3300 },
    { id: 'B6', ad: 'Çamlık', kavsakId: 'K42', nufus: 2400 },
  ];
  const alanlar = [
    { id: 'A1', ad: 'Stadyum Meydanı', kavsakId: 'K03', kapasite: 6000, dolu: 0 },
    { id: 'A2', ad: 'Fuar Parkı', kavsakId: 'K52', kapasite: 8000, dolu: 0 },
    { id: 'A3', ad: 'Okul Bahçesi', kavsakId: 'K24', kapasite: 4500, dolu: 0 },
    { id: 'A4', ad: 'Sahil Toplanma', kavsakId: 'K20', kapasite: 3000, dolu: 0 },
  ];
  const hastaneler = [
    { id: 'H1', ad: 'Merkez Hastanesi', kavsakId: 'K21' },
    { id: 'H2', ad: 'Kuzey Devlet Hastanesi', kavsakId: 'K43' },
  ];
  const araclar = [
    { id: 'T1', ad: 'Ambulans-1', kavsakId: 'K21', rota: [], ilerleme: 0 },
    { id: 'T2', ad: 'Kurtarma-2', kavsakId: 'K43', rota: [], ilerleme: 0 },
    { id: 'T3', ad: 'İtfaiye-3', kavsakId: 'K14', rota: [], ilerleme: 0 },
  ];
  return { kavsaklar, yollar, bolgeler, alanlar, hastaneler, araclar };
}
export function olusturSenaryolar() {
  return {
    A: { ad: 'A — Normal Durum', aciklama: 'Tüm yollar açık, kapasite yeterli.', kapaliYollar: [], alanKapasiteleri: {}, bolgeNufuslari: {} },
    B: { ad: 'B — Köprü Kapandı', aciklama: 'Ana köprü bağlantısı kesildi, alternatif rota aranır.', kapaliYollar: ['Y61', 'Y63'], alanKapasiteleri: {}, bolgeNufuslari: {} },
    C: { ad: 'C — Toplanma Alanı Doldu', aciklama: 'Stadyum Meydanı kapasitesi düştü, dağıtım yeniden yapılır.', kapaliYollar: [], alanKapasiteleri: { A1: 500 }, bolgeNufuslari: {} },
    D: { ad: 'D — Çoklu Yol Kapanması', aciklama: 'Birden çok yol kapandı; bazı bölgeler erişilemez olabilir.', kapaliYollar: ['Y1', 'Y2', 'Y7', 'Y25', 'Y26', 'Y31', 'Y44'], alanKapasiteleri: {}, bolgeNufuslari: {} },
  };
}
export function varsayilanDurum() {
  return {
    sehir: olusturSehir(), senaryolar: olusturSenaryolar(), senaryoId: 'A',
    simule: { calisiyor: false, hiz: 1, sonZaman: 0 },
    plan: { atamalar: [], yerlesen: 0, yerlesemeyen: 0, ulasilamayan: [], alanDoluluk: {}, ortSure: 0, uyarilar: [] },
    seciliYol: null, yenidenPlanlamaSayisi: 0,
  };
}
export function kavsakBul(sehir, id) { return sehir.kavsaklar.find(k => k.id === id) || null; }
