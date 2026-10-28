const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Statik dosyaları public klasöründen servis et
app.use(express.static(path.join(__dirname, 'public')));

app.listen(PORT, () => {
  console.log(`Pathfinder AI çalışıyor → http://localhost:${PORT}`);
});
