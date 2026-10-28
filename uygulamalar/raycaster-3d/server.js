/*
 * raycaster-3d — statik dosya sunucusu (Express)
 * ==============================================
 * Saf 2D canvas raycasting motorunu tarayiciya sunar.
 * Bagimlilik: express  (npm install)
 */
const path = require('path');
const express = require('express');

const PORT = process.env.PORT || 4173;
const app = express();

// /public ve kok icerisindeki static dosyalar (index.html, curl olmasin diye kokte de durur)
app.use(express.static(path.join(__dirname, 'public')));
// Kokten de acilabilsin (index.html kokte ise)
app.use(express.static(__dirname));

// Tum bilinmeyen istekleri index'e yonlendir
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`[raycaster-3d] Sunucu ayakta -> http://localhost:${PORT}`);
});
