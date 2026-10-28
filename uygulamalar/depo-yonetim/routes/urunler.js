// Ürün rotaları
const router = require('express').Router();
const store = require('../models/store');
const urunModel = require('../models/urun');

// Tüm ürünleri listele
router.get('/', (req, res) => {
  res.json(urunModel.tumu());
});

// Tek ürün
router.get('/:id', (req, res) => {
  const urun = urunModel.bul(req.params.id);
  if (!urun) return res.status(404).json({ hata: 'Ürün bulunamadı' });
  res.json(urun);
});

// Yeni ürün ekle
router.post('/', (req, res) => {
  const hatalar = urunModel.dogrula(req.body);
  if (hatalar.length) return res.status(400).json({ hata: hatalar });

  const urunler = urunModel.tumu();
  const yeni = {
    id: store.yeniId('urunler'),
    ad: req.body.ad.trim(),
    birim: (req.body.birim || 'adet').trim(),
    dusukStokEsigi: Number(req.body.dusukStokEsigi) || 0,
    olusturuldu: new Date().toISOString()
  };
  urunler.push(yeni);
  store.yaz('urunler', urunler);
  res.status(201).json(yeni);
});

// Ürün sil
router.delete('/:id', (req, res) => {
  const urunler = urunModel.tumu();
  const urun = urunler.find(x => x.id === Number(req.params.id));
  if (!urun) return res.status(404).json({ hata: 'Ürün bulunamadı' });
  store.yaz('urunler', urunler.filter(x => x.id !== urun.id));

  const stok = store.oku('stok');
  store.yaz('stok', stok.filter(s => s.urunId !== urun.id));
  res.json({ mesaj: 'Ürün silindi', id: urun.id });
});

module.exports = router;
