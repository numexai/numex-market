'use strict';

const { logger } = require('./logger');

/**
 * Bilinen uygulama hataları için taşıyıcı sınıf.
 * Fırlatıldığında `hataYakalayici` bunu uygun HTTP koduyla JSON'a çevirir.
 */
class UygulamaHatasi extends Error {
  /**
   * @param {string} mesaj
   * @param {number} [durum] HTTP durum kodu
   * @param {Record<string,string>} [ayrintilar] alan bazlı hata mesajları
   */
  constructor(mesaj, durum = 400, ayrintilar = null) {
    super(mesaj);
    this.name = 'UygulamaHatasi';
    this.durum = durum;
    this.ayrintilar = ayrintilar;
    this.beklenen = true;
  }
}

/** 404 — bulunamadı */
function bulunamadi(mesaj = 'Kayıt bulunamadı.') {
  return new UygulamaHatasi(mesaj, 404);
}

/** 422 — doğrulama hatası */
function dogrulamaHatasi(ayrintilar, mesaj = 'Gönderilen veriler geçersiz.') {
  return new UygulamaHatasi(mesaj, 422, ayrintilar);
}

/** 404 — eşleşmeyen API yolu (JSON döner, HTML değil) */
function apiBulunamadi(req, res, next) {
  next(new UygulamaHatasi(`API yolu bulunamadı: ${req.method} ${req.originalUrl}`, 404));
}

/**
 * Merkezî hata yakalayıcı (Express 4 imzası: 4 argüman şart).
 * Bilinmeyen hatalar 500'e düşer; iç yığın izi istemciye SIZDIRILMAZ.
 */
// eslint-disable-next-line no-unused-vars
function hataYakalayici(err, req, res, next) {
  const durum = Number.isInteger(err && err.durum) ? err.durum : 500;
  const beklenen = Boolean(err && err.beklenen);

  if (durum >= 500) {
    logger.error(`Beklenmeyen hata: ${err && err.message ? err.message : err}`, {
      yol: req.originalUrl,
      yigin: err && err.stack ? String(err.stack).split('\n').slice(0, 4) : []
    });
  } else {
    logger.warn(`İstek reddedildi: ${err && err.message ? err.message : err}`, {
      yol: req.originalUrl,
      durum
    });
  }

  const govde = {
    basarili: false,
    hata: {
      mesaj: beklenen || durum < 500 ? String(err && err.message ? err.message : 'Hata') : 'Sunucu tarafında beklenmeyen bir hata oluştu.'
    }
  };
  if (err && err.ayrintilar) govde.hata.ayrintilar = err.ayrintilar;

  res.status(durum).json(govde);
}

/**
 * async route işleyicilerini sarmalar — reddedilen promise'ler
 * Express'in hata zincirine düşsün diye.
 * @param {Function} isleyici
 * @returns {import('express').RequestHandler}
 */
function asyncSar(isleyici) {
  return function (req, res, next) {
    Promise.resolve(isleyici(req, res, next)).catch(next);
  };
}

module.exports = {
  UygulamaHatasi,
  bulunamadi,
  dogrulamaHatasi,
  apiBulunamadi,
  hataYakalayici,
  asyncSar
};
