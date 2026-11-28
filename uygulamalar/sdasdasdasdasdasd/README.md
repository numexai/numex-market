# Minik Yıldızlar — Anaokulu Tanıtım Sitesi

Rengârenk, hareketli ve oynanabilir bir anaokulu tanıtım sitesi. Okul yönetim sistemi değildir; kayıt, ödeme, veli paneli veya veritabanı yoktur. Çocuklardan kişisel bilgi toplanmaz.

## Nasıl açılır

Kurulum gerekmez, bağımlılık yoktur. `index.html` dosyasını tarayıcıda açman yeterli.

Yerel sunucuyla bakmak istersen (önerilir, dosya yolları sorunsuz çalışır):

```
python -m http.server 4177
```

Sonra tarayıcıda `http://127.0.0.1:4177` adresini aç.

## Dosya düzeni

| Dosya | Ne iş yapar |
|---|---|
| `index.html` | Tüm sayfa yapısı: üst menü, karşılama alanı, bölümler, alt bilgi. Tüm çizimler (güneş, bulut, karakterler, balonlar, ikonlar) satır içi SVG'dir. |
| `css/style.css` | Tema değişkenleri (`:root` — renk paleti, köşe yarıçapı, yazı tipleri), tüm bölüm stilleri, animasyonlar, mobil kırılımlar, hareket azaltma. |
| `js/app.js` | Mobil menü, yapışkan menü gölgesi, bölüm bağlantılarında menü payı hesabı, kaydırınca belirme (IntersectionObserver), sayaç animasyonu. |
| `js/oyun.js` | "Renkleri Yakala" oyunu: balon üretimi/yükselmesi, patlama, renk adı, kıvılcım, skor, ses (AudioContext ilk etkileşimde kurulur). |

Yazı tipleri Google Fonts'tan (Baloo 2 + Nunito) gelir — internet yoksa sistem yazı tipine düşer, site yine çalışır.

## Bölümler

Ana Sayfa (karşılama) · Hakkımızda/Okulumuz · Sınıflarımız · Etkinliklerimiz · Veliler İçin · Renkleri Yakala (oyun) · İletişim.

İletişim bilgileri (adres, telefon, e-posta) **tamamen temsilîdir** ve sayfada bu açıkça yazar. Gerçek bir kurumun bilgisi değildir; öğretmen adı hiç kullanılmamıştır.

## Yapılanlar

- Karşılama alanı: renk geçişli başlık, animasyonlu güneş/bulut/yıldız/balon, dört SVG karakter (ayı, tavşan, kedi, civciv).
- Okulumuz: bina çizimi, dört değer kartı, canlı sayaçlar.
- Sınıflar: Minik Kâşifler, Renkli Kelebekler, Neşeli Yıldızlar.
- Etkinlikler: resim, müzik, doğa, oyun, hikâye, hareket — altı renkli kart.
- Veliler: eğitim yaklaşımı, örnek günlük program, hızlı bağlantılar.
- Renkleri Yakala: 7 renkli balon, patlama animasyonu, renk adı ekranda, skor, ses aç/kapat.
- Kaydırınca belirme, hover tepkileri, `prefers-reduced-motion` desteği.

## Doğrulanan

- Oyun gerçek fareyle oynandı: balon patladı, renk adı göründü, skor arttı.
- 1440×900 ve 390×844 ekranlarda yatay taşma yok; mobil menü açılıp kapanıyor, kapanınca ilgili bölüme gidiyor.
- Menüden bölüme atlarken başlık yapışkan menünün altında kalmıyor.

## Açık kalanlar / sonraki adım

- İçerik temsilîdir: gerçek okul bilgileri (adres, telefon, sınıf mevcutları, ücretler) girilmedi — bilinçli olarak uydurulmadı.
- Renk adları, ses seviyesi ve oyun hızı tek yerden ayarlanabilir: `js/oyun.js` içindeki `renkler` dizisi ve `balonYap` süreleri.
- İstenirse eklenebilecekler: gerçek fotoğraf galerisi, etkinlik takvimi sayfası, çoklu dil. (Şu an yoktur.)

Ayrıntılı dosya haritası: `.numex/PROJECT_MAP.md`

---

[![StackBlitz'te aç](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/numexai/numex-market/tree/main/uygulamalar/sdasdasdasdasdasd) [![CodeSandbox'ta aç](https://codesandbox.io/static/img/play-codesandbox.svg)](https://codesandbox.io/s/github/numexai/numex-market/tree/main/uygulamalar/sdasdasdasdasdasd)

**Kategori:** Diğer · Numex AI tarafından otonom üretildi ve test edildi.

- ▶️ [Canlı demo](https://dene.numexai.com.tr/sdasdasdasdasdasd/)
- ⚡ Tarayıcıda aç ve düzenle: [StackBlitz](https://stackblitz.com/github/numexai/numex-market/tree/main/uygulamalar/sdasdasdasdasdasd) · [CodeSandbox](https://codesandbox.io/s/github/numexai/numex-market/tree/main/uygulamalar/sdasdasdasdasdasd) — kurulum yok
- 🛍️ [Numex Market'te gör](https://market.numexai.com.tr) · 🏗️ [Numex Forge](https://forge.numexai.com.tr/explore/repos)
- 💬 [Numex AI ile kendi uygulamanı yap](https://numexai.com.tr) — Türkçe yapay zekâ asistanı

**Etiketler:** `web sitesi şablonu` · `tanıtım sayfası` · `landing page` · `template` · `açık kaynak` · `türkçe` · `yapay zeka ile yapıldı` · `open source` · `javascript` · `ai generated` · `numex ai`

MIT lisanslıdır — bkz. [../LICENSE](../LICENSE). Beğendiysen [depoya ⭐ ver](https://github.com/numexai/numex-market).
