// Sunucu giriş noktası — açılışta kurtarma rutini çalışır.
import { app, kurtarmaCalistir } from './api.js';
import { db } from './db.js';

const PORT = Number(process.env.PORT || 4173);

const kurtarma = kurtarmaCalistir();
console.log('[KURTARMA]', JSON.stringify(kurtarma));

const server = app.listen(PORT, () => {
  console.log(`[NUMEX ISLETME] http://localhost:${PORT} (pid ${process.pid})`);
});

// Kontrollü kapanış: yeni istek alma, açık istekleri bitir, DB'yi kapat.
for (const sig of ['SIGINT', 'SIGTERM']) {
  process.on(sig, () => {
    console.log('[KAPANIYOR]', sig);
    server.close(() => { db.close(); process.exit(0); });
    setTimeout(() => process.exit(0), 3000);
  });
}
