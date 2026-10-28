// Lokasyon (depo/şube) rotaları
const router = require('express').Router();
const store = require('../models/store');
const lokasyonModel = require('../models/lokasyon');

// Tüm lokasyonları listele
router.get('/', (req, res) => {
  res.json(lokasyonModel.tumu());
});

// Tek lokasyon
router.get('/:id', (req, res) => {
  const lok = lokasyonModel.bul(req.params.id);
  if (!lok) return res.status(404).json({ hata: 'Lokasyon bulunamadı' });
  res.json(lok);
});

// Yeni lokasyon ekle
router.post('/', (req, res) => {
  const hatalar = lokasyonModel.dogrula(req.body);
  if (hatalar.length) return res.status(400).json({ hata: hatalar });

  const lokasyonlar = lokasyonModel.tumu();
  const yeni = {
    id: store.yeniId('lokasyonlar'),
    ad: req.body.ad.trim(),
    sehir: (req.body.sehir || '').trim(),
    olusturuldu: new Date().toISOString()
  };
  lokasyonlar.push(yeni);
  store.yaz('lokasyonlar', lokasyonlar);
  res.status(201).json(yeni);
});

// Lokasyon sil
router.delete('/:id', (req, res) => {
  const lokasyonlar = lokasyonModel.tumu();
  const lok = lokasyonlar.find(x => x.id === Number(req.params.id));
  if (!lok) return res.status(404).json({ hata: 'Lokasyon bulunamadı' });
  store.yaz('lokasyonlar', lokasyonlar.filter(x => x.id !== lok.id));

  // Bu lokasyona ait stokları da sil
  const stok = store.oku('stok');
  store.yaz('stok', stok.filter(s => s.lokasyonId !== lok.id));
  res.json({ mesaj: 'Lokasyon silindi', id: lok.id });
});

module.exports = router;
