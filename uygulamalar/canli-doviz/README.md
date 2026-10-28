# Canlı Döviz Kurları

Dolar, Euro, Sterlin ve Gram Altın kurlarını anlık olarak gösteren modern web uygulaması.

## Özellikler

- 💵 Amerikan Doları (USD)
- 💶 Euro (EUR)
- 💷 İngiliz Sterlini (GBP)
- 🪙 Gram Altın (XAU)
- Gerçek zamanlı kur güncellemeleri (3 saniyede bir)
- Neon yeşil vurgulu dark mode tasarım
- Responsive arayüz (mobil uyumlu)
- Yükseliş/düşüş göstergeleri

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
canli-doviz/
├── package.json          # Proje yapılandırması
├── server.js             # Express sunucu
├── routes/
│   └── api.js           # API rotaları
├── public/
│   ├── index.html       # Ana sayfa
│   ├── css/
│   │   └── style.css    # Stil dosyası
│   └── js/
│       └── app.js       # İstemci tarafı JavaScript
└── README.md            # Bu dosya
```

## API Endpoints

- `GET /api/dovizler` - Tüm döviz kurlarını listele
- `GET /api/dovizler/:id` - Tek döviz kuru bilgisi

## Teknolojiler

- **Backend:** Node.js, Express.js
- **Frontend:** Vanilla JavaScript, CSS3
- **Veri:** Simüle edilmiş döviz kurları (gerçek zamanlı dalgalanma)

## Ekran Görüntüsü

- Neon yeşil (#00ff88) vurgular
- Dark mode gradient arka plan
- Hover efektleri ile interaktif kartlar
- Yükseliş (yeşil ▲) ve düşüş (kırmızı ▼) göstergeleri

## Geliştirici

Numex AI - Türkiye'nin Yerli Yapay Zeka Asistanı

---

[![StackBlitz'te aç](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/numexai/numex-market/tree/main/uygulamalar/canli-doviz) [![CodeSandbox'ta aç](https://codesandbox.io/static/img/play-codesandbox.svg)](https://codesandbox.io/s/github/numexai/numex-market/tree/main/uygulamalar/canli-doviz)

**Kategori:** Araçlar · Numex AI tarafından otonom üretildi ve test edildi.

- ▶️ [Canlı demo](https://dene.numexai.com.tr/canli-doviz/)
- ⚡ Tarayıcıda aç ve düzenle: [StackBlitz](https://stackblitz.com/github/numexai/numex-market/tree/main/uygulamalar/canli-doviz) · [CodeSandbox](https://codesandbox.io/s/github/numexai/numex-market/tree/main/uygulamalar/canli-doviz) — kurulum yok
- 🛍️ [Numex Market'te gör](https://market.numexai.com.tr) · 🏗️ [Numex Forge](https://forge.numexai.com.tr/explore/repos)
- 💬 [Numex AI ile kendi uygulamanı yap](https://numexai.com.tr) — Türkçe yapay zekâ asistanı

**Etiketler:** `ücretsiz araç` · `online araç` · `web tool` · `utility` · `açık kaynak` · `türkçe` · `yapay zeka ile yapıldı` · `open source` · `javascript` · `ai generated` · `numex ai`

MIT lisanslıdır — bkz. [../LICENSE](../LICENSE). Beğendiysen [depoya ⭐ ver](https://github.com/numexai/numex-market).
