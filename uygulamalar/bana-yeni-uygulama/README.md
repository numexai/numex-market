# Fatih Bayraktar — Şiirin Sessiz Dünyası

Numex AI ile geliştirilmiş, üç boyutlu dijital şiir kitabı.
Saf HTML + CSS + JavaScript. Derleme yok, bağımlılık yok, tek klasörde çalışır.

## Nasıl açılır

**En basit:** `index.html` dosyasına çift tıkla — tarayıcıda açılır.

**Yerel sunucu (önerilen, önbellek sorunu yaşamamak için):**

```
cd bana-yeni-uygulama
python -m http.server 8123
```

Sonra tarayıcıdan `http://localhost:8123` adresini aç.

> Not: Yazı tipleri Google Fonts'tan gelir; çevrimdışıyken tasarım bozulmaz,
> yedek sistem yazı tipleri kullanılır.

## Dosya düzeni

| Dosya | Ne iş yapar |
|---|---|
| `index.html` | Sayfa iskeleti: üst bar, 3B kitap kapağı, koleksiyon, hakkında, okuyucu katmanı, favori paneli |
| `css/stil.css` | Tüm tasarım: neumorphism değişkenleri, 3B kitap (perspektif/kapak/sırt), yaprak çevirme animasyonu, gece modu, mobil tek-sayfa düzeni, hareket azaltma |
| `js/app.js` | Tüm mantık: paralaks, kitap açma/kapama, sayfa bölme ve çevirme, favoriler (localStorage), arama, kategori filtresi, tema, yazı boyutu, kopyala/paylaş |
| `veri/siirler.js` | **Şiirler ve şair bilgisi.** İçerik değişikliği yalnızca burada yapılır |
| `gorsel/` | Portre fotoğrafı buraya konur (`fatih-bayraktar.jpg`) |

## İçerik değiştirmek

`veri/siirler.js` içindeki `siirler` dizisine kayıt ekle:

```js
{ id: "benzersiz-kimlik", baslik: "Şiir Adı", kategori: "ask",
  tarih: "2024-03-12", demo: false,
  metre: ["Dize 1", "Dize 2", "", "Yeni kıta"] }
```

`""` = kıta arası boşluk. Gerçek şiirlerde `demo: false` yap — "Örnek metin" etiketi kalkar.

**Fotoğraf:** dosyayı `gorsel/fatih-bayraktar.jpg` olarak koy, `sair` bölümünde
`fotograf: null` satırını `fotograf: "gorsel/fatih-bayraktar.jpg"` yap.
Fotoğraf yoksa "portre eklenecek" çerçevesi gösterilir (uydurma görsel konmaz).

**Biyografi / doğum / eserler:** `sair` bölümündeki `biyografi`, `dogum`, `eserler`
alanları. Boşken arayüzde "Bilgi eklenecek" yazar.

## Bu işte yapılanlar

- Neumorphism tasarım sistemi (buz mavisi + inci beyazı, çift yönlü gölge)
- Çift perspektifli 3B kitap: fareyle eğilme, tıklayınca açılma
- Masaüstünde iki sayfa (giriş kıtaları / devam + künye), mobilde tek sayfa tam metin
- Perspektifli yaprak çevirme animasyonu (ileri/geri)
- 8 demo şiir, hepsi `ÖRNEK METİN` etiketli — gerçek şaire mal edilmemiştir
- Arama (başlık + dize, Türkçe karakter sadeleştirmeli), 5 kategori filtresi
- Favoriler (localStorage, kalıcı), kopyala, paylaş
- Gece/gündüz modu, yazı boyutu (A− / A+), `prefers-reduced-motion` desteği
- Doğrulanmış: masaüstü 1440×900 ve mobil 390×844'te 10 maddelik test listesi geçti

### Düzeltilen hatalar (kayıt için)

1. `[hidden]` özniteliği CSS `display:grid` tarafından eziliyordu → `[hidden]{display:none!important}`
2. Şiir metni sol+sağ sayfada iki kez basılıyordu → iki sayfaya bölündü
3. Mobilde ilk kıtalar kayboluyordu → mobilde tam metin tek sayfaya yazılıyor
4. `satirlar.join is not a function` → metre dizisi yanlış yapıda veriliyordu
5. Mobil okuyucu ekranı doldurmuyordu → `100dvh` + `align-items:stretch`
6. Mobil üst başlıkta iki satır üst üste biniyordu → taşma kısaltması eklendi

## Açık kalanlar / sonraki adım

- **Portre fotoğrafı yok.** Kullanıcının gönderdiği çift fotoğraf masaüstünde bulunamadı
  (o yoldaki dosya ekran görüntüsü çıktı). Doğru dosya verilince `gorsel/` klasörüne konup
  `veri/siirler.js` içindeki `fotograf` alanı açılmalı.
- **Gerçek şiirler yok.** 8 metin demo amaçlı yazılmış özgün örneklerdir; gerçek şiirler
  gelince `veri/siirler.js` değiştirilmeli, `demo: false` yapılmalı.
- Biyografi, doğum tarihi, eser listesi bekliyor (uydurulmadı).
- Masaüstünde "Paylaş" tarayıcı paylaşım menüsünü çağırır; desteklemeyen tarayıcıda panoya kopyalar.

Ayrıntılı dosya haritası: `.numex/PROJECT_MAP.md`

---

[![StackBlitz'te aç](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/numexai/numex-market/tree/main/uygulamalar/bana-yeni-uygulama) [![CodeSandbox'ta aç](https://codesandbox.io/static/img/play-codesandbox.svg)](https://codesandbox.io/s/github/numexai/numex-market/tree/main/uygulamalar/bana-yeni-uygulama)

**Kategori:** Diğer · Numex AI tarafından otonom üretildi ve test edildi.

- ▶️ [Canlı demo](https://dene.numexai.com.tr/bana-yeni-uygulama/)
- ⚡ Tarayıcıda aç ve düzenle: [StackBlitz](https://stackblitz.com/github/numexai/numex-market/tree/main/uygulamalar/bana-yeni-uygulama) · [CodeSandbox](https://codesandbox.io/s/github/numexai/numex-market/tree/main/uygulamalar/bana-yeni-uygulama) — kurulum yok
- 🛍️ [Numex Market'te gör](https://market.numexai.com.tr) · 🏗️ [Numex Forge](https://forge.numexai.com.tr/explore/repos)
- 💬 [Numex AI ile kendi uygulamanı yap](https://numexai.com.tr) — Türkçe yapay zekâ asistanı

**Etiketler:** `web sitesi şablonu` · `tanıtım sayfası` · `landing page` · `template` · `açık kaynak` · `türkçe` · `yapay zeka ile yapıldı` · `open source` · `javascript` · `ai generated` · `numex ai`

MIT lisanslıdır — bkz. [../LICENSE](../LICENSE). Beğendiysen [depoya ⭐ ver](https://github.com/numexai/numex-market).
