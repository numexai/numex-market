# Numex Dream City — Uyuyan Şehir

Kodla üretilmiş, kendi kendine yaşayan sinematik bir minyatür şehir.
Hazır görsel, video veya dış model dosyası kullanılmadı: **her şey kodla çizildi.**

> Küçük bir şehir, kocaman bir hayal.

---

## Çalıştırma

Klasörde bir yerel sunucu açıp `index.html`'i tarayıcıda açın:

```bash
npx http-server . -p 8199
# → http://127.0.0.1:8199
```

> Not: `file://` ile açmayın — ES modülleri (`import`) ve WebGL dokuları için HTTP gerekir.

## Kontroller

| Eylem | Sonuç |
|---|---|
| Fare sürükle | Kamerayı döndür |
| Tekerlek / iki parmak | Yakınlaş – uzaklaş |
| Sağ tık sürükle | Kaydır |
| Bir binaya tıkla | O binanın tüm pencere ışıkları yanar/söner + bilgi kartı |
| Bir pencereye tıkla | Yalnız o odanın ışığı değişir (kartta "Oda 12 — ışık yanıyor") |
| **Gündüz / Gün Batımı / Gece** | Zaman dilimi (ışık, gökyüzü, sis, yıldızlar) |
| **Açık / Yağmur / Kar** | Hava durumu |
| **Şehir Turu** | 5 duraklı sinematik kamera turu; zaman dilimi de kendiliğinden değişir |
| **Oto** | 45 saniyede bir zaman dilimini otomatik döndürür |
| Ses düğmesi | WebAudio ile üretilen rüzgâr + yağmur ortam sesi (tarayıcı kuralı gereği tıklama ister) |

## Ne var?

- **153 bina**, 3.259 pencere, 100 sokak lambası, su kulesi + saat kulesi olan meydan, parklar
- **Gündüz / gün batımı / gece** — yumuşak geçişli ışık, gökyüzü shader'ı, ay, yıldızlar, sis
- **Yağmur** (ince çizgisel damlalar) ve **kar** (süzülen taneler)
- **12 araba**, raylarda dolaşan **tren** (lokomotif + 3 vagon), **16 yaya silüeti** — hepsi kendi yolunda döner
- Pencerelerde **rastgele yanan/sönen ışıklar**, bacalardan duman
- Bloom (ışık taşması) ile gece ışıkları
- Responsive arayüz; mobilde 44px dokunma hedefleri

## Teknik

- Three.js 0.160.0 — **proje içinde** (`vendor/`), CDN'e bağımlı değil, çevrimdışı çalışır
- Modüller: `city.js` (şehir dokusu), `motion.js` (tren/araba/yaya), `atmosfer.js` (ışık+hava), `main.js` (motor), `utils.js` (tohumlu rastgele)
- Şehir **tohumlu rastgelelikle** (seed 20261027) üretilir — her açılışta aynı güzel şehir doğar

## Dosyalar

```
index.html          arayüz + import haritası
css/style.css       arayüz stili
js/main.js          motor, kamera, etkileşim, tur, ses
js/city.js          binalar, yollar, parklar, lambalar, bulutlar
js/motion.js        tren, arabalar, yayalar, raylar
js/atmosfer.js      gündüz/gece/batım, yağmur, kar, yıldızlar
js/utils.js         tohumlu rastgele + yardımcılar
vendor/             three.module.js + jsm (OrbitControls, bloom, composer)
```

## Lisans / kaynak

Tüm kod bu proje için yazıldı. Three.js MIT lisanslıdır (`vendor/` içinde).
Numex Market'e yüklenmeye hazırdır.

---

[![StackBlitz'te aç](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/numexai/numex-market/tree/main/uygulamalar/uyuyan-sehir) [![CodeSandbox'ta aç](https://codesandbox.io/static/img/play-codesandbox.svg)](https://codesandbox.io/s/github/numexai/numex-market/tree/main/uygulamalar/uyuyan-sehir)

**Kategori:** Simülasyon · Numex AI tarafından otonom üretildi ve test edildi.

- ▶️ [Canlı demo](https://dene.numexai.com.tr/uyuyan-sehir/)
- ⚡ Tarayıcıda aç ve düzenle: [StackBlitz](https://stackblitz.com/github/numexai/numex-market/tree/main/uygulamalar/uyuyan-sehir) · [CodeSandbox](https://codesandbox.io/s/github/numexai/numex-market/tree/main/uygulamalar/uyuyan-sehir) — kurulum yok
- 🛍️ [Numex Market'te gör](https://market.numexai.com.tr) · 🏗️ [Numex Forge](https://forge.numexai.com.tr/explore/repos)
- 💬 [Numex AI ile kendi uygulamanı yap](https://numexai.com.tr) — Türkçe yapay zekâ asistanı

**Etiketler:** `simülasyon` · `görselleştirme` · `simulation` · `visualization` · `açık kaynak` · `türkçe` · `yapay zeka ile yapıldı` · `open source` · `javascript` · `ai generated` · `numex ai`

MIT lisanslıdır — bkz. [../LICENSE](../LICENSE). Beğendiysen [depoya ⭐ ver](https://github.com/numexai/numex-market).
