/**
 * Stüdyo Teleprompter — Express sunucusu
 * Dizindeki public/ klasörünü servis eder, otomatik boş port seçer (3000+).
 */
const path = require("path");
const http = require("http");
const express = require("express");

const app = express();
const PUBLIC_DIR = path.join(__dirname, "public");

// Statik dosyalar
app.use(express.static(PUBLIC_DIR));

// Kök isteği index.html'e yönlendir
app.get("/", (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, "index.html"));
});

// 3000'den başlayıp boş olan ilk porta bağlanmayı dener
function listenAnywhere(port) {
  const server = http.createServer(app);
  return new Promise((resolve) => {
    const attempt = (p) => {
      const trial = server.listen(p);
      trial.once("listening", () => resolve(server.address().port));
      trial.once("error", (err) => {
        if (err.code === "EADDRINUSE") {
          attempt(p + 1);
        } else {
          console.error("Sunucu hatası:", err);
          process.exit(1);
        }
      });
    };
    attempt(port);
  });
}

listenAnywhere(process.env.PORT ? parseInt(process.env.PORT, 10) : 3000)
  .then((port) => {
    console.log("==============================================");
    console.log("  🎥 Stüdyo Teleprompter çalışıyor");
    console.log(`  📍  http://localhost:${port}`);
    console.log("  🛑 Durdurmak için Ctrl+C");
    console.log("==============================================");
  });
