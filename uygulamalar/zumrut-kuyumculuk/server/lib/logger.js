'use strict';

/**
 * Basit, bağımlılıksız istek/olay kaydedici.
 * Üretimde bir log toplayıcıya (dosya/ELK) yönlendirilebilir.
 */

const SEVIYELER = { debug: 10, info: 20, warn: 30, error: 40 };

function zamanDamgasi() {
  return new Date().toISOString();
}

function bicimle(seviye, mesaj, ek) {
  const temel = `[${zamanDamgasi()}] ${seviye.toUpperCase()} ${mesaj}`;
  if (ek === undefined) return temel;
  try {
    return `${temel} ${JSON.stringify(ek)}`;
  } catch {
    return `${temel} [serileştirilemeyen veri]`;
  }
}

const logger = {
  debug(mesaj, ek) {
    if (process.env.NUMEX_LOG_SEVIYE === 'debug') console.log(bicimle('debug', mesaj, ek));
  },
  info(mesaj, ek) {
    console.log(bicimle('info', mesaj, ek));
  },
  warn(mesaj, ek) {
    console.warn(bicimle('warn', mesaj, ek));
  },
  error(mesaj, ek) {
    console.error(bicimle('error', mesaj, ek));
  }
};

/**
 * Express istek kaydedici (middleware).
 * Her istek için yöntem, yol, durum kodu ve süre kaydeder.
 * @returns {import('express').RequestHandler}
 */
function istekKaydedici() {
  return function (req, res, next) {
    const baslangic = process.hrtime.bigint();
    res.on('finish', () => {
      const sureMs = Number(process.hrtime.bigint() - baslangic) / 1e6;
      const satir = `${req.method} ${req.originalUrl} → ${res.statusCode} (${sureMs.toFixed(1)}ms)`;
      if (res.statusCode >= 500) logger.error(satir);
      else if (res.statusCode >= 400) logger.warn(satir);
      else logger.info(satir);
    });
    next();
  };
}

module.exports = { logger, istekKaydedici, SEVIYELER };
