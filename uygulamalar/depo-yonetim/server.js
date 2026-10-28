const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Rotalar
app.use('/api/lokasyonlar', require('./routes/lokasyonlar'));
app.use('/api/urunler', require('./routes/urunler'));
app.use('/api/transferler', require('./routes/transferler'));
app.use('/api/stok', require('./routes/stok'));

// API kök
app.get('/api', (req, res) => {
  res.json({
    ad: 'Çok Lokasyonlu Depo Yönetim Sistemi',
    uclar: [
      '/api/lokasyonlar',
      '/api/urunler',
      '/api/transferler',
      '/api/stok'
    ]
  });
});

// 404
app.use((req, res) => {
  res.status(404).json({ hata: 'Bulunamadı' });
});

app.listen(PORT, () => {
  console.log(`Depo yönetim sistemi ${PORT} portunda çalışıyor`);
});
