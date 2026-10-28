'use strict';

const { uygulamaOlustur } = require('./app');
const { logger } = require('./lib/logger');

const PORT = Number(process.env.PORT) || 4700;
const HOST = process.env.HOST || '127.0.0.1';

const app = uygulamaOlustur();

const sunucu = app.listen(PORT, HOST, () => {
  logger.info(`Zümrüt Kuyumculuk sitesi ayakta → http://${HOST}:${PORT}`);
});

// Düzgün kapanış (test/CI ortamında da bozmaz)
function kapat(sinyal) {
  logger.info(`${sinyal} alındı, sunucu kapatılıyor...`);
  sunucu.close(() => process.exit(0));
}

process.on('SIGINT', () => kapat('SIGINT'));
process.on('SIGTERM', () => kapat('SIGTERM'));

module.exports = sunucu;
