# Zümrüt Kuyumculuk — Kurumsal Web Sitesi + İçerik API'si

Altın ve döviz işlemleri yapan **Zümrüt Kuyumculuk** için hazırlanmış kurumsal web sitesi ve
bu siteyi besleyen Node.js/Express içerik API'si.

Tema: siyah zemin (#0a0a0a) üzerine altın vurgular (#d4af37) — ürünlerin siyah içinde
"vitrindeymiş" gibi görünmesi için tasarlandı.

---

## Hızlı Başlangıç

```bash
npm install
npm start
```

Sunucu `http://127.0.0.1:4700` adresinde açılır. Tarayıcıda açmanız yeterli.

Farklı port kullanmak için:

```bash
# PowerShell
$env:PORT=8080; npm start

# CMD
set PORT=8080 && npm start
```

Testleri çalıştırmak için:

```bash
npm test
```

---

## Dizin Yapısı

```
zumrut-kuyumculuk/
│
├── index.html              → Ana sayfa (tek sayfa, bölümlere kaydırmalı)
├── css/
│   ├── style.css           → Siyah/altın tema, tipografi, kart, buton
│   └── responsive.css      → 1200 / 992 / 768 / 480px kırılımları
├── js/
│   ├── main.js             → Mobil menü, scroll animasyon, sayaç, form doğrulama
│   ├── kur.js              → Döviz/altın kur bandı (API'den beslenir, yedeği var)
│   └── galeri.js           → Vitrin filtreleme + lightbox
├── data/
│   └── urunler.json        → Ürün verisi (statik site için yedek kopya)
├── assets/
│   └── img/                → Ürün fotoğrafları (müşteri buraya ekler)
├── vendor/                 → Yerelleştirilmiş font dosyaları
│
├── server/                 → Node.js / Express katmanı
│   ├── server.js           → Giriş noktası (port dinler)
│   ├── app.js              → Express uygulaması (statik + API)
│   ├── data/
│   │   ├── urunler.js      → Ürün envanteri + filtreleme
│   │   ├── kurlar.js       → Döviz/altın kurları + biçimlendirme
│   │   └── iletisim.js     → Adres, telefon, saatler, form doğrulama
│   ├── lib/
│   │   ├── logger.js       → İstek kaydedici + seviyeli log
│   │   └── hataYonetimi.js → Merkezî hata yakalayıcı + doğrulama hataları
│   ├── routes/
│   │   ├── urunler.js      → /api/urunler
│   │   ├── kurlar.js       → /api/kurlar
│   │   └── iletisim.js     → /api/iletisim
│   └── tests/              → Vitest + Supertest testleri
│       ├── api.test.js
│       ├── urunler.test.js
│       └── veri.test.js
│
└── package.json
```

---

## API Uç Noktaları

Tüm yanıtlar JSON'dur ve `basarili` alanı içerir.

| Yöntem | Yol | Açıklama |
|---|---|---|
| GET | `/api/saglik` | Servis ayakta mı, sürüm bilgisi |
| GET | `/api/urunler` | Tüm ürünler |
| GET | `/api/urunler?kategori=bilezik` | Kategoriye göre filtreli ürünler |
| GET | `/api/urunler/:id` | Tek ürün |
| GET | `/api/kurlar` | Döviz + altın kurları (alış/satış/trend) |
| GET | `/api/kurlar/:kod` | Tek kur (usd, eur, gbp, ga, ceyrek, yarim) |
| GET | `/api/iletisim` | Adres, telefon, çalışma saatleri, hizmetler |
| POST | `/api/iletisim` | İletişim formu gönderimi (doğrulamalı) |

### Örnek yanıt — `GET /api/kurlar`

```json
{
  "basarili": true,
  "guncellemeZamani": "2026-01-01T10:00:00.000Z",
  "kaynak": "demo-simulasyon",
  "adet": 6,
  "veri": [
    { "kod": "USD", "ad": "Amerikan Doları", "alis": 41.28, "satis": 41.42,
      "degisim": 0.12, "trend": "artis", "alisMetin": "41,28 ₺", "satisMetin": "41,42 ₺" }
  ]
}
```

### Örnek istek — `POST /api/iletisim`

```json
{
  "ad": "Ahmet Yılmaz",
  "telefon": "0500 000 00 01",
  "eposta": "ahmet@ornek.com",
  "mesaj": "Çeyrek altın fiyatı hakkında bilgi almak istiyorum."
}
```

Geçersiz veride `422` ve alan bazlı hata listesi döner:

```json
{
  "basarili": false,
  "hata": {
    "mesaj": "Gönderilen veriler geçersiz.",
    "ayrintilar": { "telefon": "Geçerli bir telefon numarası giriniz (örn. 05xx xxx xx xx)." }
  }
}
```

---

## İşletme Bilgileri

- **Adres:** Örnek Mahallesi, Çarşı Caddesi No: 1, Merkez / İstanbul
- **Telefon:** 0500 000 00 00
- **Çalışma saatleri:** Hafta içi 09:30–19:30, Cumartesi 09:30–18:00, Pazar kapalı

> Telefon numarası `tel:+905000000000` olarak bağlanmıştır — mobilde dokununca arama başlatır.

---

## Müşterinin Yapması Gerekenler

1. **Ürün fotoğrafları:** Kendi çekimlerinizi `assets/img/` klasörüne koyun.
   Beklenen dosya adları `data/urunler.json` içindeki `gorsel` alanında yazılıdır
   (örn. `bilezik-1.jpg`, `kolye-2.jpg`). Fotoğraf yoksa arayüz otomatik olarak
   şık bir yer tutucu gösterir — site bozuk görünmez.
2. **Ürün listesi:** Yeni ürün eklemek için `server/data/urunler.js` (ve statik kopya
   `data/urunler.json`) dosyasına kayıt ekleyin.
3. **Kurlar:** Şu an **demo/simülasyon** verisidir. Gerçek piyasa verisi için
   `server/data/kurlar.js` içindeki `KURLAR` beslemesinin TCMB veya serbest piyasa
   API'sine bağlanması gerekir.
4. **Domain/e-posta:** `info@ornek.com` varsayılan olarak yazıldı;
   gerçek adres farklıysa `server/data/iletisim.js` içinden güncellenir.

---

## Geliştirme Notları

- **Framework kullanılmadı** (React/Vue yok): kurumsal statik site için gereksiz ağırlık;
  hızlı açılış ve kolay bakım hedeflendi.
- **Tema tek merkezden yönetilir:** Tüm renkler `css/style.css` başındaki CSS
  değişkenlerinde tanımlı. Marka rengi değişirse tek yerden dönülür.
- **Erişilebilirlik:** Semantik HTML5, `aria-label`, `alt` metinleri, 44px dokunma
  hedefleri, klavye ile gezilebilir lightbox (ESC ile kapanır).
- **Sunucu güvenliği:** `x-powered-by` kapalı, gövde boyutu 100KB ile sınırlı,
  hata yığın izleri istemciye sızdırılmaz.
- **Loglama:** Her istek süre ve durum koduyla kaydedilir; 4xx uyarı, 5xx hata seviyesinde.

### Test kapsamı

`npm test` komutu 55+ testi çalıştırır:

- **api.test.js** — tüm uç noktalar, hata durumları (404/422), statik dosya servisi
- **urunler.test.js** — filtreleme, id arama, veri bütünlüğü
- **veri.test.js** — kur/fiyat biçimlendirme, çalışma saati mantığı, form doğrulama

---

© Zümrüt Kuyumculuk

---

[![StackBlitz'te aç](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/numexai/numex-market/tree/main/uygulamalar/zumrut-kuyumculuk) [![CodeSandbox'ta aç](https://codesandbox.io/static/img/play-codesandbox.svg)](https://codesandbox.io/s/github/numexai/numex-market/tree/main/uygulamalar/zumrut-kuyumculuk)

**Kategori:** Web / OS · Numex AI tarafından otonom üretildi ve test edildi.

- ▶️ [Canlı demo](https://dene.numexai.com.tr/zumrut-kuyumculuk/)
- ⚡ Tarayıcıda aç ve düzenle: [StackBlitz](https://stackblitz.com/github/numexai/numex-market/tree/main/uygulamalar/zumrut-kuyumculuk) · [CodeSandbox](https://codesandbox.io/s/github/numexai/numex-market/tree/main/uygulamalar/zumrut-kuyumculuk) — kurulum yok
- 🛍️ [Numex Market'te gör](https://market.numexai.com.tr) · 🏗️ [Numex Forge](https://forge.numexai.com.tr/explore/repos)
- 💬 [Numex AI ile kendi uygulamanı yap](https://numexai.com.tr) — Türkçe yapay zekâ asistanı

**Etiketler:** `web işletim sistemi` · `web masaüstü` · `web os` · `web desktop` · `açık kaynak` · `türkçe` · `yapay zeka ile yapıldı` · `open source` · `javascript` · `ai generated` · `numex ai`

MIT lisanslıdır — bkz. [../LICENSE](../LICENSE). Beğendiysen [depoya ⭐ ver](https://github.com/numexai/numex-market).
