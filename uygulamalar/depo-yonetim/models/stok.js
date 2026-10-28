// Transfer ve stok işleme modeli
const store = require('./store');

// Bir lokasyonun stok seviyesini döner (urunId -> miktar)
function stokGetir(lokasyonId) {
  const stokKayit = store.oku('stok');
  return stokKayit.filter(s => s.lokasyonId === Number(lokasyonId));
}

// Bir lokasyonda belirli ürünün miktarını döner
function urunMiktar(lokasyonId, urunId, stokKayit = null) {
  const kayit = (stokKayit || stokGetir(lokasyonId))
    .find(s => s.urunId === Number(urunId));
  return kayit ? kayit.miktar : 0;
}

// Stok kaydını günceller (yoksa oluşturur, negatife düşerse reddeder)
function stokGuncelle(lokasyonId, urunId, delta) {
  const stokKayit = store.oku('stok');
  const mevcut = stokKayit.find(s => s.lokasyonId === Number(lokasyonId) && s.urunId === Number(urunId));
  let yeniMiktar = delta;
  if (mevcut) yeniMiktar = mevcut.miktar + delta;
  if (yeniMiktar < 0) return { ok: false, hata: 'Yetersiz stok' };

  if (mevcut) {
    mevcut.miktar = yeniMiktar;
  } else {
    stokKayit.push({ lokasyonId: Number(lokasyonId), urunId: Number(urunId), miktar: yeniMiktar });
  }
  store.yaz('stok', stokKayit);
  return { ok: true, miktar: yeniMiktar };
}

module.exports = { stokGetir, urunMiktar, stokGuncelle };
