# Numex Renk Stüdyosu — Etkileşimli Renk ve Sanat Atölyesi

Tek klasörde çalışan, bağımlılığı olmayan renk tasarım uygulaması. `index.html` çift tıklanınca açılır — sunucu, kurulum, internet gerekmez.

## Nasıl çalıştırılır

`index.html` dosyasını çift tıkla. (İstersen `python -m http.server 8123` ile de servis edilebilir.)

## Dosya yapısı

```
index.html            Tüm bölümlerin iskeleti
css/tema.css          Renk değişkenleri, açık/koyu tema
css/duzen.css         Grid düzen, kartlar, responsive (390px)
css/animasyon.css     Mikroanimasyonlar, keyframe'ler
js/renk-motoru.js     Saf renk matematiği (DOM'suz) — RenkMotoru
js/durum.js           Merkezî state, undo/redo, localStorage — Durum
js/palet.js           Uyum kuralları, palet üretimi — Palet
js/gradyan.js         Durak modeli, CSS/SVG üretimi — Gradyan
js/sanat.js           Canvas animasyon modları — Sanat
js/disa-aktar.js      PNG / SVG / CSS / JSON — DisaAktar
js/arayuz.js          DOM bağlama, tüm olaylar, render — Arayuz
js/uygulama.js        Başlatma
```

## Özellikler

**Tuval:** Canlı renk geçişleri, fare hareketiyle dalgalanma, sürüklenebilir renk noktaları (çift tıkla yeni nokta), açık/koyu tema, tam ekran.

**Karıştırma laboratuvarı:** HEX · RGB · HSL · HSV değerleri anlık. RGB ve HSL karışım yolları ayrı hesaplanır ve yan yana karşılaştırılır.

**Akıllı palet:** Analog, tamamlayıcı, üçlü, dörtlü, monokrom, rastgele. Renk kilitlenebilir; kilitli renkler yeniden üretimde korunur. Renk tıklayınca HEX kopyalanır.

**Gradyan:** Linear / radial / conic, açı ayarı, sürüklenebilir durak tutamaçları, şerit üzerine tıklayarak durak ekleme, canlı CSS çıktısı.

**Hareketli sanat:** Dalga, Aurora, Akışkan Bulut, Geometrik, Işık Halkaları — hız ve yoğunluk ayarlı, durdurulabilir.

**Araçlar:** Renk geçmişi, favori paletler, geri al/ileri al, kontrast ölçer (WCAG AA/AAA).

**Dışa aktarma:** PNG, SVG gradyan, CSS, JSON kaydet/yükle, palet kopyalama.

**Hazır temalar:** Gün Batımı, Okyanus, Kozmik Gece, Osmanlı Altın, Neon Şehir, Bahar Bahçesi.

## Klavye kısayolları

| Tuş | İşlev |
|---|---|
| `Ctrl+Z` | Geri al |
| `Ctrl+Shift+Z` | İleri al |
| `F` | Tam ekran |
| `T` | Tema değiştir |
| `R` | Paleti yeniden üret |

## Renk matematiği

Tüm dönüşümler gerçek formüllerle yapılır, sabit tablo yok:

- **HEX ↔ RGB:** 16'lık taban, 3 haneli kısa HEX genişletilir.
- **RGB ↔ HSL:** max/min/delta ve hue sektörü; `hue2rgb` yardımcısıyla geri dönüş.
- **RGB ↔ HSV:** `max`, `s = (max-min)/max`, sektör ayrımı.
- **Kontrast (WCAG):** `0.2126R + 0.7152G + 0.0722B`; kanal ≤ 0.03928 ise `c/12.92`, değilse `((c+0.055)/1.055)^2.4`; oran `(L1+0.05)/(L2+0.05)`.
- **Karışım:** RGB'de her kanal lineer; HSL'de hue kısa yay üzerinden, s/l lineer.

## Doğrulanan kabul testleri

Tarayıcıda gerçek ölçümle koşuldu, hepsi geçti:

| # | Test | Sonuç |
|---|---|---|
| 1 | HEX → RGB dönüşümü (`#ff8a3d` → 255,138,61) | ✅ |
| 2 | RGB → HEX gidiş-dönüşü | ✅ |
| 3 | HSL ve HSV dönüşümü tutarlı (roundtrip) | ✅ |
| 4 | Tamamlayıcı renk (`#ff0000` → `#00ffff`) | ✅ |
| 5 | Beş renk durağı gradyanda doğru işleniyor (linear/radial/conic) | ✅ |
| 6 | Renk değişince CSS çıktısı güncelleniyor | ✅ |
| 7 | Renk kilidi yeniden üretimde korunuyor | ✅ |
| 8 | Undo/redo durumu doğru geri getiriyor | ✅ |
| 9 | Kontrast oranı WCAG formülüyle (`#777`/`#fff` = 4.48) | ✅ |
| 10 | PNG (dataURL) ve SVG çıktıları oluşuyor | ✅ |
| 11 | JSON kaydet/yükle paleti koruyor | ✅ |
| 12 | Mobil 390px'te düzen çalışıyor (taşma yok, 2 sütun palet) | ✅ |

## Geliştirme sırasında bulunup düzeltilen gerçek hatalar

1. **Sanat canvas'ında kalıntı:** Mod değişiminde kare tam boyutlu temizlenmiyordu, önceki çizim sol üstte kalıyordu → tam transform + source-over ile temizlendi.
2. **Nokta sürükleme çalışmıyordu:** `pointermove` yalnız nokta öğesinde dinleniyordu, imleç noktadan çıkınca sürükleme kopuyordu → hareket/bırakma pencere düzeyine alındı (gerçek fare testiyle doğrulandı: x 0.366 → 0.475).
3. **Palet arayüz vurgularını ele geçiriyordu:** Gri bir palet seçilince aktif sekme ve düğmeler okunmaz hâle geliyordu → vurgu renkleri tema sabitlerine bağlandı.

## Bilinen sınırlar

- SVG conic gradyanı SVG'de yerel olmadığı için eşit açılı dilimler (`<path>`) hâlinde üretilir — görünüm CSS conic'e yakındır, birebir aynı değildir.
- Durak rengini değiştirmek için listedeki renk seçici kullanılır; tutamaç üzerinde çift tık tarayıcının `prompt` penceresini açar.
- Sanat modu `requestAnimationFrame` ile çalışır; sekme arka plana atılınca otomatik durur.

---

[![StackBlitz'te aç](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/numexai/numex-market/tree/main/uygulamalar/etkilesimli-renk-ve-sanat-studyosu) [![CodeSandbox'ta aç](https://codesandbox.io/static/img/play-codesandbox.svg)](https://codesandbox.io/s/github/numexai/numex-market/tree/main/uygulamalar/etkilesimli-renk-ve-sanat-studyosu)

**Kategori:** Diğer · Numex AI tarafından otonom üretildi ve test edildi.

- ▶️ [Canlı demo](https://dene.numexai.com.tr/etkilesimli-renk-ve-sanat-studyosu/)
- ⚡ Tarayıcıda aç ve düzenle: [StackBlitz](https://stackblitz.com/github/numexai/numex-market/tree/main/uygulamalar/etkilesimli-renk-ve-sanat-studyosu) · [CodeSandbox](https://codesandbox.io/s/github/numexai/numex-market/tree/main/uygulamalar/etkilesimli-renk-ve-sanat-studyosu) — kurulum yok
- 🛍️ [Numex Market'te gör](https://market.numexai.com.tr) · 🏗️ [Numex Forge](https://forge.numexai.com.tr/explore/repos)
- 💬 [Numex AI ile kendi uygulamanı yap](https://numexai.com.tr) — Türkçe yapay zekâ asistanı

**Etiketler:** `web sitesi şablonu` · `tanıtım sayfası` · `landing page` · `template` · `açık kaynak` · `türkçe` · `yapay zeka ile yapıldı` · `open source` · `javascript` · `ai generated` · `numex ai`

MIT lisanslıdır — bkz. [../LICENSE](../LICENSE). Beğendiysen [depoya ⭐ ver](https://github.com/numexai/numex-market).
