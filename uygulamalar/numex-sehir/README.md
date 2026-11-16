# Numex Studio — Animasyon Üretim Motoru

Tarayıcıda çalışan, kod yazmadan animasyon üreten ve düzenleyen tek dosyalık stüdyo. Dış bağımlılık yok: `index.html` içinde HTML + CSS + JavaScript.

## Açma

- `index.html` dosyasını çift tıklayın (tamamen çevrimdışı çalışır), veya
- klasörde bir sunucu: `python -m http.server 8123` → http://127.0.0.1:8123

## Arayüz

| Bölge | İçerik |
|---|---|
| Üst bar | Örnekler · JSON Kaydet · JSON Yükle · PNG Kare · WebM |
| Sol | Nesne kütüphanesi (metin, dikdörtgen, elips, üçgen, yıldız, görsel, SVG) + katman listesi + arka plan + dosya yükleme |
| Orta | 960 × 540 çalışma tuvali |
| Sağ | Seçili nesnenin özellikleri (ad, X, Y, genişlik, yükseklik, dönüş, saydamlık, renk, metin, yazı boyutu) |
| Alt | Çok kanallı zaman çizelgesi |

## Nesne ekleme

- Kütüphane öğesini tuvale **sürükleyip bırakın** (bırakılan noktaya yerleşir), veya
- öğeye **tıklayın** (sahne ortasına eklenir).

Tuvalde: gövdeden sürükleyerek **taşı**, köşe tutamaçlarından **ölçekle** (`Shift` = oranı koru), üstteki yuvarlak saptan **döndür** (`Shift` = 15° kilit).

## Anahtar kare mantığı

Motor **kanal bazlı** çalışır. Her nesnenin 7 kanalı vardır:

`Konum X · Konum Y · Genişlik · Yükseklik · Dönüş (°) · Saydamlık · Renk`

- **Kare Ekle** → seçili nesnenin tüm kanallarına, o anki değerlerle anahtar kare yazar.
- Bir kanal satırında **çift tık** → yalnız o kanala, tıklanan zamana kare yazar.
- Kareyi **sürükle** → zamanını değiştir (`Shift` = yarım saniyeye kilitle).
- Kareye **sağ tık** → o kareyi sil.
- Bir kanalda kare varsa, panelden değer değiştirmek **otomatik olarak o ana kare yazar** (After Effects'teki saat simgesi mantığı).

Geçiş eğrileri: `linear`, `ease-in`, `ease-out`, `ease-in-out`. Eğri, araç çubuğundaki menüden seçilir ve **sol anahtar kareye** yazılır (A → B geçişini A'nın eğrisi belirler).

## Zaman çizelgesi

- `▶ / ⏸ / ⏮` oynat · durdur · başa sar — kısayol: `Space`
- Kırmızı **oynatma kafası** cetvelde tıklanıp sürüklenebilir.
- Saniye göstergesi: `2.00 / 6.00 s`
- `Süre` alanı: 0.5 – 120 saniye
- Nesne satırındaki yeşil elmaslar **birleşik** kareleri, kanal satırındaki mavi elmaslar o kanalın karelerini gösterir.
- `◂ ▸` ile nesnenin kanallarını aç/kapat, `👁` ile gizle/göster.

Kısayollar: `K` kare ekle · `Del` kare/nesne sil · `←/→` 0.1 sn (`Shift` ile 0.5 sn) · `Home/End` başa/sona.

## Hazır örnekler

`📁 Örnekler` menüsü:

1. **Hareketli logo tanıtımı** — halka büyür, yazı aşağıdan yükselir, alt yazı belirir.
2. **Animasyonlu reklam afişi** — şerit kayar, `%50` yazısı dönerek büyür, yıldız ve şimşek döner.
3. **Eşzamanlı çoklu nesne** — 4 kutu, 4 farklı easing ile aynı anda bağımsız hareket eder.
4. **Ordinaryüs sınavı** — kutu 0s'de solda kırmızı, 3s'de sağda mavi ve 360° dönmüş.

## Kayıt ve dışa aktarım

- **JSON Kaydet** — tüm sahne + kanallar tek dosyaya.
- **JSON Yükle** — kaydedilmiş projeyi geri açar.
- **Otomatik kayıt** — her değişiklikten ~0.7 sn sonra `localStorage`'a; sayfa yeniden açılınca geri yüklenir.
- **PNG Kare** — o anki kare, 960×540 (2× DPR ile keskin).
- **WebM** — animasyonu baştan sona kaydeder (tarayıcı `MediaRecorder` destekliyorsa).

## Geliştirici / test API'si

`window.Studio` üzerinden motor dışa açıktır:

```js
Studio.loadExample('exam');          // örnek yükle
Studio.seek(2);                      // 2. saniyeye git
Studio.state.objects[0];             // nesne
Studio.computeObject(o, 1.5);        // ara değerler {x,y,w,h,rotation,opacity,color}
Studio.channelValue(o, 'x', 1.5);    // tek kanal
Studio.setKeyframe(o, 'x', 2, 300, 'easeInOut');
Studio.pixel(480, 270);              // canvas pikseli {r,g,b,a}
Studio.snapshot();                   // PNG dataURL
```

---

[![StackBlitz'te aç](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/numexai/numex-market/tree/main/uygulamalar/numex-sehir) [![CodeSandbox'ta aç](https://codesandbox.io/static/img/play-codesandbox.svg)](https://codesandbox.io/s/github/numexai/numex-market/tree/main/uygulamalar/numex-sehir)

**Kategori:** Diğer · Numex AI tarafından otonom üretildi ve test edildi.

- ▶️ [Canlı demo](https://dene.numexai.com.tr/numex-sehir/)
- ⚡ Tarayıcıda aç ve düzenle: [StackBlitz](https://stackblitz.com/github/numexai/numex-market/tree/main/uygulamalar/numex-sehir) · [CodeSandbox](https://codesandbox.io/s/github/numexai/numex-market/tree/main/uygulamalar/numex-sehir) — kurulum yok
- 🛍️ [Numex Market'te gör](https://market.numexai.com.tr) · 🏗️ [Numex Forge](https://forge.numexai.com.tr/explore/repos)
- 💬 [Numex AI ile kendi uygulamanı yap](https://numexai.com.tr) — Türkçe yapay zekâ asistanı

**Etiketler:** `web sitesi şablonu` · `tanıtım sayfası` · `landing page` · `template` · `açık kaynak` · `türkçe` · `yapay zeka ile yapıldı` · `open source` · `javascript` · `ai generated` · `numex ai`

MIT lisanslıdır — bkz. [../LICENSE](../LICENSE). Beğendiysen [depoya ⭐ ver](https://github.com/numexai/numex-market).
