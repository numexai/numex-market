# ATELIER — Yaşamın İnce Detayları

Türkçe, premium bir e-ticaret vitrini. **Kurulum yok, derleme yok, harici servis yok.**
Saf HTML + CSS + JavaScript. Tüm veri tarayıcıda (localStorage) saklanır.

## Çalıştırma

**En kolay:** `index.html` dosyasına çift tıkla — tarayıcıda açılır.

**Yerel sunucu (önerilir):**
```powershell
cd c:\testyeni\eticaret
python -m http.server 8123
```
sonra tarayıcıda: <http://127.0.0.1:8123/index.html>

## Sayfalar

| Sayfa | Dosya | Ne yapar |
|---|---|---|
| Ana sayfa | `index.html` | Hero, koleksiyonlar, sezon seçkileri, yeni gelenler, marka hikâyesi, bülten, footer |
| Katalog | `magaza.html` | 24 ürün, kategori / arama / fiyat filtresi, sıralama, favoriler |
| Ürün detayı | `urun.html?id=atl-001` | Galeri, varyant seçimi, stok, adet, sepete ekle, teslimat/iade, ilgili ürünler |
| Sepet | `sepet.html` | Adet, stok sınırı, kupon, kargo, toplam |
| Ödeme | `odeme.html` | Adres formu, doğrulama, kargo yöntemi, sipariş özeti, sahte onay |
| Sipariş tamam | `siparis-tamam.html` | Sipariş numarası ve özet |
| Panel (demo) | `panel.html` | Sipariş listesi/durum, stok/fiyat düzenleme, ürün ekleme, istatistik, JSON dışa aktarma |

## Dosyalar

```
index.html  magaza.html  urun.html  sepet.html  odeme.html  siparis-tamam.html  panel.html
style.css   -> tasarım sistemi (kırık beyaz / kum beji / antrasit / bakır, editoryal tipografi)
app.js      -> sepet motoru, filtreler, ödeme, panel, localStorage
data.js     -> 24 örnek ürün, kupon, kargo kuralları
assets/img/ -> ürün görselleri (yerel; CDN'e bağımlılık yok)
```

## İş kuralları

- **Kupon:** `ATELIER10` → ürün ara toplamı üzerinden %10 indirim (kargo ve indirim düşülmeden önce).
- **Kargo:** Standart 79 TL (2.500 TL üzeri ücretsiz), Hızlı 149 TL (5.000 TL üzeri ücretsiz).
- **Stok:** Varyant bazında değil, ürün bazında. Sepette adet ürün stoğunu geçemez; sipariş sonrası stok düşer.
- **Varyant:** Aynı ürünün farklı varyantı sepette ayrı satırdır.

## Veri saklama

- `atelier.sepet.v1`, `atelier.favoriler.v1`, `atelier.siparisler.v1`, `atelier.urunler.v1`, `atelier.kupon.v1`
- Hiçbir kişisel veri harici sunucuya gönderilmez. Gerçek kart bilgisi istenmez/saklanmaz.
- Panelden **"Tüm örnek verileri sıfırla"** ile başlangıç hâline dönülür.

## Demo sınırları (dürüst liste)

- Ödeme gerçek değildir; banka/PSP bağlantısı yoktur.
- Panelde yönetici kimlik doğrulaması yoktur (demo).
- Siparişler yalnızca bu tarayıcıda tutulur; başka cihazla paylaşılmaz.
- Ürün görselleri temsilîdir (Unsplash, yerel kopya); fiyat/stok/yorumlar kurgusaldır.
- Google Fonts CDN'den yüklenir; çevrimdışıyken sistem serif yazı tipine düşer (düzen bozulmaz).

---

[![StackBlitz'te aç](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/numexai/numex-market/tree/main/uygulamalar/eticaret) [![CodeSandbox'ta aç](https://codesandbox.io/static/img/play-codesandbox.svg)](https://codesandbox.io/s/github/numexai/numex-market/tree/main/uygulamalar/eticaret)

**Kategori:** Diğer · Numex AI tarafından otonom üretildi ve test edildi.

- ▶️ [Canlı demo](https://dene.numexai.com.tr/eticaret/)
- ⚡ Tarayıcıda aç ve düzenle: [StackBlitz](https://stackblitz.com/github/numexai/numex-market/tree/main/uygulamalar/eticaret) · [CodeSandbox](https://codesandbox.io/s/github/numexai/numex-market/tree/main/uygulamalar/eticaret) — kurulum yok
- 🛍️ [Numex Market'te gör](https://market.numexai.com.tr) · 🏗️ [Numex Forge](https://forge.numexai.com.tr/explore/repos)
- 💬 [Numex AI ile kendi uygulamanı yap](https://numexai.com.tr) — Türkçe yapay zekâ asistanı

**Etiketler:** `web sitesi şablonu` · `tanıtım sayfası` · `landing page` · `template` · `açık kaynak` · `türkçe` · `yapay zeka ile yapıldı` · `open source` · `javascript` · `ai generated` · `numex ai`

MIT lisanslıdır — bkz. [../LICENSE](../LICENSE). Beğendiysen [depoya ⭐ ver](https://github.com/numexai/numex-market).
