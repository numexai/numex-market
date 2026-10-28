// Lokasyon (depo / şube) modeli
const store = require('./store');

// Geçerli lokasyon mu kontrol et
function dogrula(veri) {
  const hatalar = [];
  if (!veri.ad || veri.ad.trim() === '') hatalar.push('Lokasyon adı zorunludur');
  return hatalar;
}

function tumu() {
  return store.oku('lokasyonlar');
}

function bul(id) {
  return store.bulKoleksiyonda('lokasyonlar', Number(id));
}

module.exports = { dogrula, tumu, bul };
