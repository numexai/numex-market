# Hava Durumu Uygulaması

İstanbul, Ankara, İzmir ve Antalya şehirlerinin canlı hava durumunu gösteren modern web uygulaması.

## Özellikler

- 4 şehir: İstanbul, Ankara, İzmir, Antalya
- Gerçek zamanlı sıcaklık, nem ve rüzgar verileri
- 2x2 ızgara düzeni
- Koyu mavi temalı modern arayüz
- Her 3 saniyede otomatik güncelleme
- Responsive tasarım (mobil uyumlu)

## Kurulum

1. Bağımlılıkları yükle:
```bash
npm install
```

2. Sunucuyu başlat:
```bash
npm start
```

3. Tarayıcıda aç:
```
http://localhost:3000
```

## Proje Yapısı

```
hava-durumu/
├── package.json          # Proje yapılandırması
├── server.js             # Express sunucu
├── routes/
│   └── api.js           # Hava durumu API rotaları
├── public/
│   ├── index.html       # Ana sayfa (2x2 grid)
│   ├── css/
│   │   └── style.css    # Koyu mavi tema stilleri
│   └── js/
│       └── app.js       # Canlı güncelleme mantığı
└── README.md            # Bu dosya
```

## API Endpoints

- `GET /api/hava` - Tüm şehirlerin hava durumunu getir
- `GET /api/hava/:id` - Tek şehir hava durumu (istanbul, ankara, izmir, antalya)

## Teknolojiler

- **Backend:** Node.js, Express.js
- **Frontend:** Vanilla JavaScript, CSS3
- **Veri:** Simüle edilmiş hava durumu verileri (gerçek zamanlı dalgalanma)

## Ekran Görüntüsü

- Koyu mavi gradient arka plan
- Mavi (#4a9eff) vurgular
- Hover efektleri ile interaktif kartlar
- Her kartta sıcaklık, nem ve rüzgar bilgisi

## Geliştirici

Numex AI - Türkiye'nin Yerli Yapay Zeka Asistanı

---

[![StackBlitz'te aç](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/numexai/numex-market/tree/main/uygulamalar/hava-durumu) [![CodeSandbox'ta aç](https://codesandbox.io/static/img/play-codesandbox.svg)](https://codesandbox.io/s/github/numexai/numex-market/tree/main/uygulamalar/hava-durumu)

**Kategori:** Araçlar · Numex AI tarafından otonom üretildi ve test edildi.

- ▶️ [Canlı demo](https://dene.numexai.com.tr/hava-durumu/)
- ⚡ Tarayıcıda aç ve düzenle: [StackBlitz](https://stackblitz.com/github/numexai/numex-market/tree/main/uygulamalar/hava-durumu) · [CodeSandbox](https://codesandbox.io/s/github/numexai/numex-market/tree/main/uygulamalar/hava-durumu) — kurulum yok
- 🛍️ [Numex Market'te gör](https://market.numexai.com.tr) · 🏗️ [Numex Forge](https://forge.numexai.com.tr/explore/repos)
- 💬 [Numex AI ile kendi uygulamanı yap](https://numexai.com.tr) — Türkçe yapay zekâ asistanı

**Etiketler:** `ücretsiz araç` · `online araç` · `web tool` · `utility` · `açık kaynak` · `türkçe` · `yapay zeka ile yapıldı` · `open source` · `javascript` · `ai generated` · `numex ai`

MIT lisanslıdır — bkz. [../LICENSE](../LICENSE). Beğendiysen [depoya ⭐ ver](https://github.com/numexai/numex-market).
