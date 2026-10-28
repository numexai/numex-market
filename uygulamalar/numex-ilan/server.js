const express = require('express');
const path = require('path');
const db = require('./server/data/db');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ===== KATEGORİLER =====
app.get('/api/kategoriler', (req, res) => {
  res.json(db.hepsiniGetir('kategoriler'));
});

// ===== İLANLAR =====
app.get('/api/ilanlar', (req, res) => {
  let ilanlar = db.hepsiniGetir('ilanlar');
  const { kategori, il, min, max, arama, model, km } = req.query;

  if (kategori) ilanlar = ilanlar.filter((i) => String(i.kategoriId) === String(kategori));
  if (il) ilanlar = ilanlar.filter((i) => i.il === il);
  if (min) ilanlar = ilanlar.filter((i) => i.fiyat >= Number(min));
  if (max) ilanlar = ilanlar.filter((i) => i.fiyat <= Number(max));
  if (km) ilanlar = ilanlar.filter((i) => i.ozellikler?.km && i.ozellikler.km <= Number(km));
  if (arama) {
    const q = arama.toLowerCase();
    ilanlar = ilanlar.filter((i) =>
      (i.baslik + ' ' + i.aciklama + ' ' + (i.kategori || '')).toLowerCase().includes(q)
    );
  }
  res.json(ilanlar);
});

app.get('/api/ilanlar/:id', (req, res) => {
  const ilan = db.idIleGetir('ilanlar', req.params.id);
  if (!ilan) return res.status(404).json({ hata: 'İlan bulunamadı' });
  res.json(ilan);
});

app.post('/api/ilanlar', (req, res) => {
  const gerekli = ['baslik', 'fiyat', 'kategoriId', 'il', 'sahip', 'telefon'];
  for (const alan of gerekli) {
    if (!req.body[alan]) return res.status(400).json({ hata: `${alan} zorunludur` });
  }
  const kategori = db.hepsiniGetir('kategoriler').find((k) => k.id === Number(req.body.kategoriId));
  const yeniIlan = {
    ...req.body,
    kategori: kategori ? kategori.ad : 'Diğer',
    fiyat: Number(req.body.fiyat),
    kainat: req.body.aciklama || '',
    tarih: new Date().toISOString().slice(0, 10),
  };
  const cevap = db.ekle('ilanlar', yeniIlan);
  res.status(201).json(cevap);
});

app.put('/api/ilanlar/:id', (req, res) => {
  const guncel = db.guncelle('ilanlar', req.params.id, req.body);
  if (!guncel) return res.status(404).json({ hata: 'İlan bulunamadı' });
  res.json(guncel);
});

app.delete('/api/ilanlar/:id', (req, res) => {
  const silindi = db.sil('ilanlar', req.params.id);
  if (!silindi) return res.status(404).json({ hata: 'İlan bulunamadı' });
  res.json({ mesaj: 'İlan silindi', id: Number(req.params.id) });
});

// ===== MESAJLAR =====
app.get('/api/mesajlar/:ilanId', (req, res) => {
  const mesajlar = db.hepsiniGetir('mesajlar').filter((m) => String(m.ilanId) === String(req.params.ilanId));
  res.json(mesajlar);
});

app.post('/api/mesajlar', (req, res) => {
  const { ilanId, gonderen, mesaj } = req.body;
  if (!ilanId || !mesaj) return res.status(400).json({ hata: 'ilanId ve mesaj zorunludur' });
  const kayit = db.ekle('mesajlar', {
    ilanId,
    gonderen: gonderen || 'Anonim',
    mesaj,
    tarih: new Date().toISOString(),
  });
  res.status(201).json(kayit);
});

// ===== FAVORİLER (session-free: localStorage tabanlı, sunucu uçları da açık) =====
app.get('/api/favoriler', (req, res) => {
  res.json(db.hepsiniGetir('favoriler'));
});

app.post('/api/favoriler', (req, res) => {
  const { ilanId } = req.body;
  if (!ilanId) return res.status(400).json({ hata: 'ilanId zorunludur' });
  const mevcut = db.hepsiniGetir('favoriler').some((f) => String(f.ilanId) === String(ilanId));
  if (mevcut) return res.status(409).json({ hata: 'İlan zaten favoride' });
  const kayit = db.ekle('favoriler', { ilanId, tarih: new Date().toISOString() });
  res.status(201).json(kayit);
});

app.delete('/api/favoriler/:ilanId', (req, res) => {
  const favoriler = db.hepsiniGetir('favoriler');
  const kayit = favoriler.find((f) => String(f.ilanId) === String(req.params.ilanId));
  if (kayit) db.sil('favoriler', kayit.id);
  res.json({ mesaj: 'Favoriden çıkarıldı' });
});

// ===== ANA SAYFA =====
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const server = app.listen(PORT);

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ ${PORT} portu zaten kullanımda. Çözüm: portu tutan süreci kapatın ya da:\n   set PORT=4000&& node server.js`);
  } else {
    console.error('❌ Sunucu başlatılamadı:', err.message);
  }
  process.exit(1);
});

server.on('listening', () => {
  console.log(`🚀 Numex İlan Platformu ${PORT} portunda çalışıyor`);
  console.log(`   → http://localhost:${PORT}`);
});
