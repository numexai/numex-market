# 🍬 Numex Candy

Candy Crush tarzı, **20 bölümlük**, profesyonel şeker eşleştirme (match-3) oyunu.
Tarayıcıda çalışır; oyun mantığı sunucu tarafında test edilebilir saf modüllere ayrılmıştır.

> **Numex Codex tarafından oluşturulmuştur.**

---

## Özellikler

| Özellik | Açıklama |
| --- | --- |
| 🎯 20 bölüm | Kademeli zorluk eğrisi, her bölümde farklı tahta düzeni |
| 🎨 Saf CSS şekerler | Emoji yok; 6 tip, 3 şekil, gradyanlı gövde |
| ✨ Özel şekerler | 4'lü → çizgili, 5'li → renkli, L/T → bomba |
| 🔗 Zincirleme | Art arda patlamalar `x1.5 → x2 → x2.5` çarpanla ödüllenir |
| 🔨 Güçlendiriciler | Çekiç, Karıştır, Bomba — bölüm zorluğuna göre sayı artar |
| 🧊 Jel hedefleri | Bazı bölümlerde zemin temizleme görevi |
| ⭐ Yıldız sistemi | Her bölümde 3 yıldız eşiği |
| 🏆 Skor tablosu | Bölüm başına en iyi 10 skor (sunucu tarafı) |
| 💾 İlerleme kaydı | `localStorage` ile bölüm kilidi ve yıldızlar saklanır |
| 🔊 Ses | WebAudio ile sentezlenmiş efektler (harici dosya yok) |
| 📱 Responsive | Mobil öncelikli; dokunma ve sürükleme desteği |

---

## Kurulum

```bash
npm install
npm start
```

Ardından tarayıcıda: **http://localhost:4321**

Geliştirme (dosya değişince otomatik yeniden başlatma):

```bash
npm run dev
```

Testler:

```bash
npm test
```

---

## Mimari

```
┌──────────────────────────────────────────────────────────┐
│                        Tarayıcı                          │
│  public/index.html  →  public/css/style.css              │
│  public/js/oyun.js  →  arayüz denetleyicisi              │
│         │                                                │
│         └── src/engine/*  (motoru doğrudan import eder)  │
└────────────────────────┬─────────────────────────────────┘
                         │ fetch /api/...
┌────────────────────────▼─────────────────────────────────┐
│                    Node + Express                        │
│  server/index.js       → uçlar + statik servis           │
│  server/levels.js      → 20 bölüm tanımı                 │
│  server/leaderboard.js → skor tablosu (bellek içi)       │
└──────────────────────────────────────────────────────────┘
```

Motor **DOM'dan tamamen bağımsızdır** — bu sayede hem tarayıcıda hem
`node --test` altında aynı kod doğrulanabilir.

### Klasör yapısı

```
numex-candy/
├── package.json
├── README.md
├── server/
│   ├── index.js          Express sunucusu ve API uçları
│   ├── levels.js         20 bölüm tanımı + tahta üreticileri
│   └── leaderboard.js    skor tablosu deposu
├── src/
│   └── engine/
│       ├── board.js      tahta temsili, dolum, takas, hamle kontrolü
│       ├── match.js      eşleşme bulma, özel şeker kararı, yayılım
│       ├── cascade.js    yerçekimi, zincirleme döngüsü
│       └── score.js      puanlama, yıldız, booster, hedef durumu
├── public/
│   ├── index.html        arayüz iskeleti
│   ├── css/style.css     tema ve şeker çizimleri
│   └── js/oyun.js        oyun denetleyicisi
└── test/
    └── engine.test.js    motor testleri (20 test)
```

---

## API

| Metot | Uç | Açıklama |
| --- | --- | --- |
| `GET` | `/api/saglik` | Sunucu sağlık kontrolü |
| `GET` | `/api/sekerler` | Şeker tipi listesi |
| `GET` | `/api/levels` | Tüm bölümlerin meta bilgisi |
| `GET` | `/api/levels/:id` | Tek bölüm (meta + tahta düzeni) |
| `GET` | `/api/levels/:id/board` | Bölümün başlangıç tahtası |
| `GET` | `/api/leaderboard/:id` | Bölüm skor tablosu |
| `POST` | `/api/leaderboard` | Skor kaydet |

`POST /api/leaderboard` gövdesi:

```json
{ "levelId": 1, "isim": "Oyuncu", "skor": 4250, "yildiz": 2 }
```

---

## Oyun kuralları

- **3'lü eşleşme** → şekerler patlar, temel puan
- **4'lü eşleşme** → çizgili şeker doğar (satır veya sütun temizler)
- **5'li eşleşme** → renkli şeker doğar (tahtadaki tüm aynı renkleri siler)
- **L / T şekli** → bomba doğar (3x3 alanı temizler)
- **Zincirleme patlama** → ardışık turlar çarpanla çarpılır
- Geçersiz takas **hamle harcamaz** (takas geri alınır)

### Bölüm hedef tipleri

| Tip | Anlamı |
| --- | --- |
| `score` | Belirtilen puana ulaş |
| `collect` | Belirtilen renkten N adet topla |
| `jel` | Tahtadaki tüm jelleri kır |

---

## Kontroller

| Girdi | İşlev |
| --- | --- |
| Tıkla → tıkla | İki komşu şekeri takas et |
| Sürükle | Şekeri yönüne doğru takas et |
| `Esc` | Seçimi / aktif güçlendiriciyi iptal et |
| `Ctrl + R` | Bölümü yeniden başlat |

---

## Teknolojiler

- **Node.js** ≥ 18 (ES Modules)
- **Express 4** — sunucu ve API
- **Saf JavaScript** — oyun motoru (bağımlılık yok)
- **Saf CSS** — şeker çizimleri, animasyonlar (harici kütüphane yok)
- **WebAudio API** — sentezlenmiş ses efektleri
- **node:test** — birim testleri

---

## Lisans

MIT — Numex AI Bilişim Teknolojileri

---

[![StackBlitz'te aç](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/numexai/numex-market/tree/main/uygulamalar/numex-candy) [![CodeSandbox'ta aç](https://codesandbox.io/static/img/play-codesandbox.svg)](https://codesandbox.io/s/github/numexai/numex-market/tree/main/uygulamalar/numex-candy)

**Kategori:** Oyunlar · Numex AI tarafından otonom üretildi ve test edildi.

- ⚡ Tarayıcıda aç ve düzenle: [StackBlitz](https://stackblitz.com/github/numexai/numex-market/tree/main/uygulamalar/numex-candy) · [CodeSandbox](https://codesandbox.io/s/github/numexai/numex-market/tree/main/uygulamalar/numex-candy) — kurulum yok
- 🛍️ [Numex Market'te gör](https://market.numexai.com.tr) · 🏗️ [Numex Forge](https://forge.numexai.com.tr/explore/repos)
- 💬 [Numex AI ile kendi uygulamanı yap](https://numexai.com.tr) — Türkçe yapay zekâ asistanı

**Etiketler:** `tarayıcı oyunu` · `html5 oyun` · `browser game` · `html5 game` · `açık kaynak` · `türkçe` · `yapay zeka ile yapıldı` · `open source` · `javascript` · `ai generated` · `numex ai`

MIT lisanslıdır — bkz. [../LICENSE](../LICENSE). Beğendiysen [depoya ⭐ ver](https://github.com/numexai/numex-market).
