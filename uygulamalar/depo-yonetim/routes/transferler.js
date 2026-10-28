// Depolar arası transfer rotaları - transfer geçmişi kayıtlı
const router = require('express').Router();
const store = require('../models/store');
const stokModel = require('../models/stok');
const lokasyonModel = require('../models/lokasyon');
const urunModel = require('../models/urun');

// Tüm transfer geçmişi (detaylı - isimlerle)
router.get('/', (req, res) => {
  const transferler = store.oku('transferler');
  const lokasyonlar = lokasyonModel.tumu();
  const urunler = urunModel.tumu();

  const detayli = transferler.map(t => ({
    ...t,
    kaynakAd: (lokasyonlar.find(l => l.id === t.kaynakId) || {}).ad || 'Silindi',
    hedefAd: (lokasyonlar.find(l => l.id === t.hedefId) || {}).ad || 'Silindi',
    urunAd: (urunler.find(u => u.id === t.urunId) || {}).ad || 'Silindi'
  }));
  res.json(detayli);
});

// Transfer oluştur (kaynak -> hedef)
router.post('/', (req, res) => {
  const { kaynakId, hedefId, urunId, miktar } = req.body;

  // Doğrulamalar
  if (!kaynakId || !hedefId || !urunId || !miktar) {
    return res.status(400).json({ hata: 'kaynakId, hedefId, urunId ve miktar zorunludur' });
  }
  if (Number(kaynakId) === Number(hedefId)) {
    return res.status(400).json({ hata: 'Kaynak ve hedef lokasyon aynı olamaz' });
  }
  if (!lokasyonModel.bul(kaynakId)) return res.status(404).json({ hata: 'Kaynak lokasyon bulunamadı' });
  if (!lokasyonModel.bul(hedefId)) return res.status(404).json({ hata: 'Hedef lokasyon bulunamadı' });
  if (!urunModel.bul(urunId)) return res.status(404).json({ hata: 'Ürün bulunamadı' });
  if (Number(miktar) <= 0) return res.status(400).json({ hata: 'Miktar pozitif olmalıdır' });

  // Kaynaktan düş
  const kaynakGuncelle = stokModel.stokGuncelle(Number(kaynakId), Number(urunId), -Number(miktar));
  if (!kaynakGuncelle.ok) {
    return res.status(400).json({ hata: kaynakGuncelle.hata, lokasyon: kaynakId });
  }
  // Hedefe ekle
  stokModel.stokGuncelle(Number(hedefId), Number(urunId), Number(miktar));

  // Transfer geçmişine kaydet
  const transferler = store.oku('transferler');
  const yeni = {
    id: store.yeniId('transferler'),
    kaynakId: Number(kaynakId),
    hedefId: Number(hedefId),
    urunId: Number(urunId),
    miktar: Number(miktar),
    tarih: new Date().toISOString()
  };
  transferler.push(yeni);
  store.yaz('transferler', transferler);

  res.status(201).json(yeni);
});

module.exports = router;
