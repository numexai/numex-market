// Cyber Beats - Express statik sunucu
// Tüm sesler saf Web Audio API ile tarayıcıda sentezlenir (mp3/wav yok).
const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// public/ klasörünü statik servis et
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Cyber Beats sunucusu çalışıyor: http://localhost:${PORT}`);
});
