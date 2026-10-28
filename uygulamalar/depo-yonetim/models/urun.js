// Ürün modeli
const store = require('./store');

function dogrula(veri) {
  const hatalar = [];
  if (!veri.ad || veri.ad.trim() === '') hatalar.push('Ürün adı zorunludur');
  return hatalar;
}

function tumu() {
  return store.oku('urunler');
}

function bul(id) {
  return store.bulKoleksiyonda('urunler', Number(id));
}

module.exports = { dogrula, tumu, bul };
