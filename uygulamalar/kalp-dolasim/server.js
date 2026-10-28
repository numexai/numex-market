// İnsan Dolaşım & Sinir Sistemi Simülasyonu — statik sunucu
// public/ klasöründeki canvas uygulamasını servis eder.
// Port: işletim sistemi otomatik boş port atar (EADDRINUSE imkânsız).
const express = require('express');
const path = require('path');

const app = express();

// Statik dosyalar (index.html, app.js, style.css)
app.use(express.static(path.join(__dirname, 'public')));

// Health check — sunucunun ayakta olduğunu doğrulamak için
app.get('/api/health', (req, res) => {
  res.json({ durum: 'ok', zaman: new Date().toISOString() });
});

// Ana sayfa
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 0 = boş bir port ver — gerçek portu address().port'tan al
const server = app.listen(0, () => {
  const port = server.address().port;
  console.log(`♥ Kalp & Dolaşım Simülasyonu http://localhost:${port}`);
});
