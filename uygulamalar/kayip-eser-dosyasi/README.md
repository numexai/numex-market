# Kayıp Eser Dosyası

Sarnıç Müzesi'nin Doğu Salonu'ndan çalınan **Yıldız Küresi** vakasını çözdüğün, tarayıcıda oynanan tek kişilik dedektiflik oyunu. Kurulum, derleme ve sunucu gerekmez.

## Açma

`index.html` dosyasına çift tıkla. Oyun herhangi bir güncel tarayıcıda (Chrome, Edge, Firefox) `file://` üzerinden çalışır.

## Oynanış

1. **Delil masası** — 12 delil kartını aç, bulguları oku, "İncelemeyi tamamla" ile dosyayı işaretle, panoya as.
2. **Mantar pano** — kartları sürükleyerek yerleştir. "İp bağla" modunda iki karta sırayla dokunarak bağ kur. Doğru çiftler çıkarım açar, yanlış çiftler yalnızca ip çizer.
3. **Şüpheli ve tanık** — 4 şüpheli dosyası ve 6 tanık ifadesi. İfade kartlarını da panoya asıp delillerle birleştirebilirsin.
4. **Zaman çizelgesi** — çıkarım açtıkça kilitli saat aralıkları çözülür.
5. **Suçlama** — en az 4 çıkarım gerekiyor. Şüpheliyi ve en çok üç dayanak delili seç; dosya savcılığa gönderilir.

İlerleme `localStorage` içinde `kayip-eser-v1` anahtarıyla saklanır; sayfa kapansa da kalır. "Dosyayı sıfırla" ile temizlenir.

## Dosyalar

| Dosya | İçerik |
|---|---|
| `index.html` | Ekran iskeleti (delil masası, pano, ifadeler, zaman çizelgesi, suçlama, katmanlar) |
| `styles.css` | Görünüm; palet ve tipografi `:root` değişkenlerinde |
| `data.js` | Vaka verisi: 12 delil, 4 şüpheli, 6 ifade, 8 bağlantı, zaman çizelgesi, çözüm |
| `game.js` | Oynanış: inceleme, sürükleme, ip bağlama, çıkarım, suçlama, kayıt |

Tasarım: kömür ceviz masa, tek vurgu masa lambası sarısı (`--lamba`), kitap serif başlık, monospace dosya etiketleri. Renk değişikliği için `styles.css` başındaki değişkenler yeterli.

## Vaka mantığı

Küre hırsızlık gecesinden dokuz gün önce, restorasyon sırasında alçı kopyayla değiştirilmiştir. 14 Kasım gecesi sahnelenen tek şey vitrinin kırılmasıdır: atölye kapı kartı (22:36), kapatılan kamera (22:38–22:44) ve içeriden kesilen cam (22:41) aynı kişiyi gösterir. Diğer üç şüphelinin alibisi zaman damgalı kayıtlarla doğrulanır.

Çözüm `data.js` içindeki `COZUM` nesnesinde; oyuncuya gösterilmez.

## Kapsam

- Yalnızca masaüstü ve mobil tarayıcı; ses efektleri Web Audio ile üretilir, ayrı dosya yoktur.
- Görseller SVG çizimdir; dış kaynak, ağ isteği veya CDN yoktur.
- Oyun tek vaka içerir; ikinci vaka ve çoklu dil kapsam dışıdır.

---

[![StackBlitz'te aç](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/numexai/numex-market/tree/main/uygulamalar/kayip-eser-dosyasi) [![CodeSandbox'ta aç](https://codesandbox.io/static/img/play-codesandbox.svg)](https://codesandbox.io/s/github/numexai/numex-market/tree/main/uygulamalar/kayip-eser-dosyasi)

**Kategori:** Diğer · Numex AI tarafından otonom üretildi ve test edildi.

- ▶️ [Canlı demo](https://dene.numexai.com.tr/kayip-eser-dosyasi/)
- ⚡ Tarayıcıda aç ve düzenle: [StackBlitz](https://stackblitz.com/github/numexai/numex-market/tree/main/uygulamalar/kayip-eser-dosyasi) · [CodeSandbox](https://codesandbox.io/s/github/numexai/numex-market/tree/main/uygulamalar/kayip-eser-dosyasi) — kurulum yok
- 🛍️ [Numex Market'te gör](https://market.numexai.com.tr) · 🏗️ [Numex Forge](https://forge.numexai.com.tr/explore/repos)
- 💬 [Numex AI ile kendi uygulamanı yap](https://numexai.com.tr) — Türkçe yapay zekâ asistanı

**Etiketler:** `web sitesi şablonu` · `tanıtım sayfası` · `landing page` · `template` · `açık kaynak` · `türkçe` · `yapay zeka ile yapıldı` · `open source` · `javascript` · `ai generated` · `numex ai`

MIT lisanslıdır — bkz. [../LICENSE](../LICENSE). Beğendiysen [depoya ⭐ ver](https://github.com/numexai/numex-market).
