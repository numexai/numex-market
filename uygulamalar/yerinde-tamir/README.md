# Ömer Kalpat Cep Telefonu Tamiri — Yerinde Servis & Randevu

Sultanbeyli ve çevresinde **yerinde (kapınıza gelerek)** cep telefonu tamiri sunan
dark temalı tanıtım + randevu web uygulaması. Express statik sunucu + veri-odaklı
tek sayfa vitrin (hizmetler, süreç, şeffaf fiyat, iletişim, randevu formu).

## Çalıştır

```bash
npm install
npm start
```

Tarayıcı: http://localhost:3965  (PORT ortam değişkeniyle değiştirilebilir)

## Yapı

```
server.js            Express: statik sunum + JSON API
data/data.json       Vitrin verisi (marka, hizmetler, fiyatlar, adres, saatler, bölgeler)
public/index.html    Tek sayfa: hero + hızlı form, hizmetler, 4-adım süreç, fiyat, iletişim, randevu
public/app.js        /api/data'yı çekip grid'leri doldurur, randevu formunu /api/randevu'ya gönderir
public/style.css     Dark tema, responsive, mobil menü
```

## API

| Uç | Yöntem | Açıklama |
|----|--------|----------|
| `/api/data` | GET | Tüm vitrin verisi (`data/data.json`) |
| `/api/randevu` | POST | Randevu talebi — `ad, telefon, hizmet, adres` zorunlu; doğrular ve onay döner (demo: kalıcı kayıt yok) |
| `/api/health` | GET | Sağlık kontrolü |

> Not: Bu bir tanıtım + randevu-talebi vitrinidir; veritabanı yoktur, randevu POST'u
> doğrulayıp onay mesajı döndürür. İleride kalıcı kayıt/panel eklenebilir — yapı buna açıktır.

---

[![StackBlitz'te aç](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/numexai/numex-market/tree/main/uygulamalar/yerinde-tamir) [![CodeSandbox'ta aç](https://codesandbox.io/static/img/play-codesandbox.svg)](https://codesandbox.io/s/github/numexai/numex-market/tree/main/uygulamalar/yerinde-tamir)

**Kategori:** Araçlar · Numex AI tarafından otonom üretildi ve test edildi.

- ▶️ [Canlı demo](https://dene.numexai.com.tr/yerinde-tamir/)
- ⚡ Tarayıcıda aç ve düzenle: [StackBlitz](https://stackblitz.com/github/numexai/numex-market/tree/main/uygulamalar/yerinde-tamir) · [CodeSandbox](https://codesandbox.io/s/github/numexai/numex-market/tree/main/uygulamalar/yerinde-tamir) — kurulum yok
- 🛍️ [Numex Market'te gör](https://market.numexai.com.tr) · 🏗️ [Numex Forge](https://forge.numexai.com.tr/explore/repos)
- 💬 [Numex AI ile kendi uygulamanı yap](https://numexai.com.tr) — Türkçe yapay zekâ asistanı

**Etiketler:** `ücretsiz araç` · `online araç` · `web tool` · `utility` · `açık kaynak` · `türkçe` · `yapay zeka ile yapıldı` · `open source` · `javascript` · `ai generated` · `numex ai`

MIT lisanslıdır — bkz. [../LICENSE](../LICENSE). Beğendiysen [depoya ⭐ ver](https://github.com/numexai/numex-market).
