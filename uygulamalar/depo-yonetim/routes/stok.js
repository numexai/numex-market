// Stok rotaları - lokasyon bazlı stok seviyesi ve düşük stok uyarısı
const router = require('express').Router();
const store = require('../models/store');
const stokModel = require('../models/stok');
const lokasyonModel = require('../models/lokasyon');
const urunModel = require('../models/urun');

// Tüm lokasyonların stok durumu (ürün isimleriyle)
router.get('/', (req, res) => {
  const stok = store.oku('stok');
  const lokasyonlar = lokasyonModel.tumu();
  const urunler = urunModel.tumu();

  const cikti = lokasyonlar.map(l => {
    const kayitlar = stok.filter(s => s.lokasyonId === l.id);
    return {
      lokasyonId: l.id,
      lokasyonAd: l.ad,
      sehir: l.sehir,
      stok: kayitlar.map(k => {
        const urun = urunler.find(u => u.id === k.urunId);
        return {
          urunId: k.urunId,
          urunAd: (urun || {}).ad || 'Silindi',
          birim: (urun || {}).birim || 'adet',
          miktar: k.miktar,
          dusukStokEsigi: (urun || {}).dusukStokEsigi || 0
        };
      })
    };
  });
  res.json(cikti);
});

// Tek lokasyonun stok durumu
router.get('/:lokasyonId', (req, res) => {
  const lok = lokasyonModel.bul(req.params.lokasyonId);
  if (!lok) return res.status(404).json({ hata: 'Lokasyon bulunamadı' });
  const urunler = urunModel.tumu();
  const stok = stokModel.stokGetir(req.params.lokasyonId);

  const detayli = stok.map(k => {
    const urun = urunler.find(u => u.id === k.urunId);
    return { ...k, urunAd: (urun || {}).ad || 'Silindi', birim: (urun || {}).birim || 'adet' };
  });
  res.json({ lokasyon: lok, stok: detayli });
});

// Düşük stok uyarısı (lokasyon bazlı, opsiyonel filtre)
router.get('/uyari/dusuk', (req, res) => {
  const stok = store.oku('stok');
  const urunler = urunModel.tumu();
  const lokasyonlar = lokasyonModel.tumu();

  const uyarilar = [];
  for (const lok of lokasyonlar) {
    for (const urun of urunler) {
      if (urun.dusukStokEsigi > 0) {
        const miktar = stokModel.urunMiktar(lok.id, urun.id, stok);
        if (miktar <= urun.dusukStokEsigi) {
          uyarilar.push({
            lokasyonId: lok.id,
            lokasyonAd: lok.ad,
            urunId: urun.id,
            urunAd: urun.ad,
            miktar,
            dusukStokEsigi: urun.dusukStokEsigi
          });
        }
      }
    }
  }
  res.json(uyarilar);
});

// Bir ürüne stok girişi yap (manuel stok ekleme)
router.post('/giris', (req, res) => {
  const { lokasyonId, urunId, miktar } = req.body;
  if (!lokasyonId || !urunId || !miktar) {
    return res.status(400).json({ hata: 'lokasyonId, urunId ve miktar zorunludur' });
  }
  if (!lokasyonModel.bul(lokasyonId)) return res.status(404).json({ hata: 'Lokasyon bulunamadı' });
  if (!urunModel.bul(urunId)) return res.status(404).json({ hata: 'Ürün bulunamadı' });
  if (Number(miktar) <= 0) return res.status(400).json({ hata: 'Miktar pozitif olmalıdır' });

  const sonuc = stokModel.stokGuncelle(Number(lokasyonId), Number(urunId), Number(miktar));
  res.json({ mesaj: 'Stok girişi yapıldı', miktar: sonuc.miktar });
});

module.exports = router;
