# Numex QR Studio

**Tasarla, okut, paylaş.** Bağlantı, metin, telefon, e-posta ve Wi-Fi için QR kod üreten; renk, gradyan, logo ve hazır şablonlarla tasarlanan, tarayıcıda çalışan araç.

## Hızlı başlangıç

Kurulum yok. `index.html` dosyasını çift tıkla, tarayıcıda açılır. İnternet de gerekmez.

Yerel sunucu tercih edersen:

```bash
node serve.js          # http://localhost:8000
```

## Ne var

- **Beş QR türü:** bağlantı, metin, telefon, e-posta (konu + mesaj), Wi-Fi (güvenlik tipi + gizli ağ).
- **Canlı önizleme:** her tuş vuruşunda yeniden çizilir.
- **Üç stil:** kare, yuvarlatılmış, gerçek noktalı (daire). Köşe gözdeleri her stilde keskin kalır; noktalıda zamanlama ve hizalama desenleri de kare kalır (okunabilirlik için).
- **Renk ve gradyan:** iki renk, üç yön (çapraz/dikey/yatay), gradyanı kapatma seçeneği.
- **Logo:** orta alana görsel; hata düzeltme otomatik **H** seviyesine yükselir, boyut %10–28.
- **Zemin:** beyaz, şeffaf veya özel renk. Kenar boşluğu 0–8 modül.
- **Çıktı:** vektörel **SVG** ve **1024 / 2048 / 4096 px PNG**; ayrıca SVG kodunu panoya kopyalama.
- **Hazır şablonlar:** Gece Mavisi, Turuncu Alev, Orman, Mor Düş, Baskı Siyahı, Şeffaf Zemin — her biri küçük boyutta da okunur.
- **Kontrast uyarısı:** kod rengi zeminden yeterince ayrışmıyorsa (oran 3,5 altı) önizlemenin altında söylenir.
- **Gizlilik:** üretim tamamen tarayıcıda. Hiçbir içerik sunucuya gönderilmez (uygulamanın ağı kullandığı tek yer yok).

## Okunabilirlik — ölçüldü

Göze güzel görünmek yetmez; kod okutulabilmeli. Üretilen çıktı bağımsız bir QR okuyucuyla (jsQR) geri okunarak sınandı:

```bash
npm install        # yalnız ölçüm araçları için (canvas, jsqr, qrcode)
npm run olcum      # 29 yapılandırmanın tamamı okundu + stil farkı + şablon kontrastı
```

| Yapılandırma | Sonuç |
|---|---|
| Kare, siyah | ✓ 25×25 |
| Yuvarlatılmış, gradyanlı | ✓ 25×25 |
| Noktalı, gradyanlı | ✓ 25×25 |
| Şeffaf zemin | ✓ 25×25 |
| Wi-Fi, H seviyesi | ✓ 33×33 |
| Türkçe metin, noktalı | ✓ 45×45 |
| Logo %20 ve %28, H (noktalı dahil) | ✓ okundu |
| Uzun metin, noktalı, H (çok hizalama deseni) | ✓ 93×93 |
| 6 hazır şablon × 330 / 512 / 1024 px | ✓ 18/18 |

Ölçümün bulduğu kurallar (kodda sabitlendi):

1. **Noktalı stilde yapı desenleri kare kalmalı.** Zamanlama çizgileri ve hizalama desenleri de nokta yapılınca okuyucu kodu bulamıyor; onlar kare kalınca gerçek daireler (çap 0,80–1,00) hepsi okunuyor. Uygulama çap 0,86 kullanır.
2. **Logo varsa H seviyesi zorunlu.** M seviyesinde %20 logo bile payı aşıyor.
3. **Kontrast en az ~3,3.** Kod rengi/zemin oranı 3,2 ve altında küçük boyutta kare stil bile okunmuyor (açık turuncu, açık yeşil); uyarı eşiği 3,5.

## Dosyalar

```
hakkinda.html           Tanıtım/künye sayfası
index.html             Uygulamanın kendisi
css/style.css          Arayüz stilleri (duyarlı, koyu/açık tek palet)
js/qr.js               Matris üretimi + vektörel SVG çizimi (stil, gradyan, logo)
js/app.js              Arayüz mantığı, içerik kodlama (URL/tel/mailto/WIFI), indirme
vendor/qrcode-kernel.js  Gömülü QR çekirdeği (build.js ile üretilir — ELLE DÜZENLEME)
vendor/qrcode-lib/       Paketlenecek kütüphane kaynağı (MIT)
build.js               Kütüphaneyi tek dosyaya paketler
serve.js               Basit yerel sunucu
tools/dogrula.js       Okunabilirlik ölçümü (29 yapılandırma, stil farkı, şablon kontrastı)
tools/olcum-nokta.js   Noktalı stil geometri ölçümü
```

`vendor/qrcode-kernel.js` üretilmiş dosyadır. Kütüphane güncellenirse `npm run build` çalıştırılmalı; dosya elle düzenlenmemeli.

## Teknik notlar

- QR matrisi standart bir kütüphaneyle üretilir; stil/tasarım katmanı bize aittir ve çıktı **vektörel SVG**'dir (pikselleşmez, baskıya uygundur).
- PNG, SVG'nin canvas üzerinde yüksek çözünürlükte çizilmesiyle üretilir (yumuşatma açık).
- Sayfa hiçbir CDN'e bağlı değildir; tüm bağımlılıklar yereldir.
- Türkçe karakterler UTF-8 olarak korunur (QR içeriği dahil).

## Lisans

Numex AI tarafından geliştirildi. Gömülü QR kütüphanesi MIT lisanslı `qrcode` paketidir (Ryan Day ve katkıcıları); içindeki `dijkstrajs` de MIT. Lisans metinleri `UCUNCU-TARAF-LISANSLAR.txt` dosyasında.

---

[![StackBlitz'te aç](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/numexai/numex-market/tree/main/uygulamalar/qr-studio) [![CodeSandbox'ta aç](https://codesandbox.io/static/img/play-codesandbox.svg)](https://codesandbox.io/s/github/numexai/numex-market/tree/main/uygulamalar/qr-studio)

**Kategori:** Araçlar · Numex AI tarafından otonom üretildi ve test edildi.

- ▶️ [Canlı demo](https://dene.numexai.com.tr/qr-studio/)
- ⚡ Tarayıcıda aç ve düzenle: [StackBlitz](https://stackblitz.com/github/numexai/numex-market/tree/main/uygulamalar/qr-studio) · [CodeSandbox](https://codesandbox.io/s/github/numexai/numex-market/tree/main/uygulamalar/qr-studio) — kurulum yok
- 🛍️ [Numex Market'te gör](https://market.numexai.com.tr) · 🏗️ [Numex Forge](https://forge.numexai.com.tr/explore/repos)
- 💬 [Numex AI ile kendi uygulamanı yap](https://numexai.com.tr) — Türkçe yapay zekâ asistanı

**Etiketler:** `ücretsiz araç` · `online araç` · `web tool` · `utility` · `açık kaynak` · `türkçe` · `yapay zeka ile yapıldı` · `open source` · `javascript` · `ai generated` · `numex ai`

MIT lisanslıdır — bkz. [../LICENSE](../LICENSE). Beğendiysen [depoya ⭐ ver](https://github.com/numexai/numex-market).
