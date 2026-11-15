# Numex Dream Studio — İnteraktif Hayal Atölyesi

Tarayıcıda çalışan, tamamen yerel (model API'si gerektirmeyen) parçacık sanatı uygulaması.
Numex Market'te sergilenmek üzere geliştirildi.

## Açılış

`index.html` dosyasını çift tıklayın. Sunucu, kurulum veya internet bağlantısı gerekmez.

## Şekil modları (7)

| Mod | Ne üretir |
| --- | --- |
| Galaksi | 4 sarmal kol + küresel çekirdek şişkinliği |
| Kalp | Parametrik kalp eğrisi, hacimli dolgu (kenar yoğun) |
| Kelebek | Klasik kelebek eğrisi, ince şerit + gövde ve antenler |
| Çiçek | 5 yapraklı gül eğrisi + çiçek merkezi |
| Yıldız | 5 köşeli, keskin uçlu yıldız |
| İsim | Kullanıcının yazdığı kelime — tuval üzerine çizilip pikselden örneklenir |
| Girdap | 3B helezon tünel (ek mod) |

Mod değişiminde parçacıklar hedeflerini anında değiştirir; yay fiziği sayesinde eski şekilden
yeni şekle akıcı biçimde akar. Geçiş ayrı bir animasyon değil, fiziğin doğal sonucudur.

## Etkileşim

- **Fare hareketi** — imleç çevresindeki parçacıkları iter, imleç hızı akış yönü yaratır.
- **Tıklama** — ışık patlaması (şok dalgası parlaması + parçacık itkisi).
- **Sürükleme** — imleç çevresinde girdap; bırakınca parçacıklar hedeflerine döner.
- **Tekerlek / iki parmak** — yakınlaşma-uzaklaşma (0,35× – 3,4×).
- **Sinematik** — 7,5 sn'de bir mod, 5,5 sn'de bir palet, 3,6 sn'de bir patlama; kamera salınımı.
- **Klavye** — `1`–`7` mod, `Boşluk` sinematik, `P` PNG, `H` panel, `F` tam ekran.

## Kişiselleştirme

- Kelime/isim girişi: Türkçe karakterler (Ç Ğ İ Ö Ş Ü) desteklenir; metin `toLocaleUpperCase('tr-TR')` ile büyütülür.
- 7 renk paleti.
- Yoğunluk (15–100), hareket hızı (0,15–2,5×), yakınlaşma (%40–260) kaydırıcıları.
- **PNG kaydet** — ekranı bozmadan ayrı tuvalde tek kare render edilip indirilir.
- **JSON dışa/içe** — şekil, metin, palet, yoğunluk, hız ve yakınlaşma saklanır; aynı kompozisyon yeniden açılır.
- Son durum `localStorage`'a yazılır, sayfa açılışında geri yüklenir.

## Mimari (sorumluluklar ayrı)

```
index.html          sahne + arayüz iskeleti
css/style.css       arayüz ve tema (render'dan bağımsız)
js/palettes.js      renk paletleri, 16 kademeli renk LUT'u
js/shapes.js        şekil üreticileri (hedef noktalar)
js/particle.js      fizik motoru: yay, sönümleme, itme, girdap, patlama, gruplama
js/renderer.js      çizim katmanı: dönüş, perspektif, iz, hale, PNG çıktısı
js/controls.js      fare/dokunmatik/klavye girdisi
js/perf.js          FPS ölçümü ve otomatik kalite
js/app.js           durum, mod geçişi, sinematik, dışa/içe aktarma, arayüz bağlantıları
```

Motor hiçbir çizim çağrısı yapmaz; renderer parçacık fiziğini bilmez. Girdi katmanı yalnızca
anlamlı sahne sinyalleri (itme kuvveti, girdap şiddeti, patlama noktası) üretir.

## Performans

- Varsayılan 6.600 parçacık; üst sınır 11.000 (`MAX_PARTICLES`).
- Parçacıklar renk katmanına göre gruplanır; her grup tek `fill()` ile çizilir (48 grup).
- `perf.js` FPS'i ölçer: 34 FPS altında parçacık sayısı ve çözünürlük düşer, 56 FPS üstünde geri yükselir.
- Cihaz piksel oranı en fazla 2 ile sınırlıdır.

## Bilinen sınırlar

- Girdap (vortex) modu kameraya dönük bakıldığında disk gibi okunur; yandan daha belirgindir.
- Çok uzun kelimelerde harf aralığı daralır (ölçek küçülür).
- PNG çıktısı ekran çözünürlüğündedir (baskı için 2× DPI ile alınır).

---

[![StackBlitz'te aç](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/numexai/numex-market/tree/main/uygulamalar/interaktif-jayal-dunyasi) [![CodeSandbox'ta aç](https://codesandbox.io/static/img/play-codesandbox.svg)](https://codesandbox.io/s/github/numexai/numex-market/tree/main/uygulamalar/interaktif-jayal-dunyasi)

**Kategori:** Diğer · Numex AI tarafından otonom üretildi ve test edildi.

- ▶️ [Canlı demo](https://dene.numexai.com.tr/interaktif-jayal-dunyasi/)
- ⚡ Tarayıcıda aç ve düzenle: [StackBlitz](https://stackblitz.com/github/numexai/numex-market/tree/main/uygulamalar/interaktif-jayal-dunyasi) · [CodeSandbox](https://codesandbox.io/s/github/numexai/numex-market/tree/main/uygulamalar/interaktif-jayal-dunyasi) — kurulum yok
- 🛍️ [Numex Market'te gör](https://market.numexai.com.tr) · 🏗️ [Numex Forge](https://forge.numexai.com.tr/explore/repos)
- 💬 [Numex AI ile kendi uygulamanı yap](https://numexai.com.tr) — Türkçe yapay zekâ asistanı

**Etiketler:** `web sitesi şablonu` · `tanıtım sayfası` · `landing page` · `template` · `açık kaynak` · `türkçe` · `yapay zeka ile yapıldı` · `open source` · `javascript` · `ai generated` · `numex ai`

MIT lisanslıdır — bkz. [../LICENSE](../LICENSE). Beğendiysen [depoya ⭐ ver](https://github.com/numexai/numex-market).
