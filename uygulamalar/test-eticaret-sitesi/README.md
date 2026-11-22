# ATELIER — Yaşamın İnce Detayları

Türkçe, tam çalışan bir demo e-ticaret mağazası. Kurulum yok, sunucu yok, veritabanı yok:
**`index.html` dosyasına çift tıklayın** — tarayıcıda açılır.

> Bu bir demodur. Gerçek ödeme alınmaz, kart bilgisi istenmez, hiçbir veri harici sunucuya gönderilmez.
> Tüm ürün, fiyat ve stok verileri örnektir.

---

## Çalıştırma

| Yol | Adım |
|---|---|
| **En kolay** | `index.html` dosyasına çift tıkla |
| Yerel sunucu (önerilen) | Klasörde `python -m http.server 4321` → `http://localhost:4321` |
| VS Code | Live Server eklentisi → `index.html` → "Go Live" |

Görseller ve yazı tipleri gerekli değil: yazı tipleri Google Fonts'tan (internet varsa) yüklenir,
yoksa sistem fontlarına düşer. Ürün görselleri proje içinde (`assets/img/`) — **çevrimdışı da görünür**.

---

## Sayfalar

| Dosya | Ne yapar |
|---|---|
| `index.html` | Ana sayfa: hero, koleksiyonlar, sezon seçkisi, popüler ürünler, marka hikâyesi, editoryal alanlar, bülten, footer |
| `magaza.html` | Katalog: 24 ürün, kategori/arama/fiyat/stok filtreleri, fiyat sıralaması, favoriler |
| `urun.html?id=...` | Ürün detay: galeri, renk/boyut varyantı, stok, adet, sepete ekle, teslimat-iade, ilgili ürünler |
| `sepet.html` | Sepet: adet, kaldırma, kupon, kargo, toplam |
| `odeme.html` | Ödeme simülasyonu: form doğrulama, kargo yöntemi, sipariş özeti |
| `siparis-tamam.html` | Sipariş onayı, sipariş numarası |
| `hesap.html` | Demo yönetim paneli: siparişler, stok, ürün ekle/düzenle, istatistik, JSON dışa aktarma |

---

## Dosya yapısı

```
index.html  magaza.html  urun.html  sepet.html  odeme.html
siparis-tamam.html  hesap.html
assets/
  css/style.css          Tasarım sistemi (renk, tipografi, bileşenler, mobil)
  js/products.js         24 ürün + kategoriler + kuponlar + kargo kuralları
  js/store.js            Sepet/stok/kupon/sipariş motoru + localStorage
  js/ui.js               Ortak bileşenler, sepet çekmecesi, bildirimler
  img/                   Ürün + editoryal fotoğraflar (24 adet)
```

---

## Alışveriş motoru

| Kural | Değer |
|---|---|
| İndirim kodu | **`ATELIER10`** → ürün toplamı üzerinden %10 |
| Kupon 2 | `HOSGELDIN` → 2.500 TL üzeri 250 TL |
| Kupon 3 | `KARGOBEDAVA` → kargo ücretsiz |
| Kargo | Standart 89 TL, hızlı 189 TL |
| Ücretsiz kargo | İndirimli ara toplam 2.500 TL ve üzeri |
| Stok | Sepet adedi stok sınırını **aşamaz**; aşılınca stok kadar eklenir ve uyarı verilir |
| Varyant | Aynı ürünün farklı varyantları sepette **ayrı satır**dır |
| Kalıcılık | Sepet, sipariş, favori ve stok düzeltmeleri `localStorage`'da |

> **Önemli:** İndirim, *ürün toplamı* üzerinden düşülür; kargo ücreti indirimden **sonra** eklenir.
> Ekranda "İndirim, ürün toplamı üzerinden hesaplandı" notu iki yerde gösterilir.

---

## Kabul testleri — son koşu

Tarayıcıda (Chrome, gerçek DOM) çalıştırıldı:

| # | Test | Sonuç | Kanıt |
|---|---|---|---|
| 1 | 24 ürün doğru yükleniyor | ✅ | 24 kart, 24 ürün |
| 2 | Kategori filtresi | ✅ | Seramik 6/6 |
| 3 | Arama filtresi | ✅ | "keten" → 4 ürün |
| 4 | Fiyat sıralaması (artan) | ✅ | ₺480 → ₺890 → ₺960 … |
| 5 | Varyant seçimi | ✅ | Antrasit seçildi: stok 2, fiyat +₺150 |
| 6 | Stok sınırı aşılamıyor | ✅ | 95 adet istendi → **2'ye kırpıldı**, +1 reddedildi |
| 7 | Varyantlar sepette ayrı | ✅ | 2 ayrı satır (Antrasit / Kireç Beyazı) |
| 8 | Geçersiz kupon | ✅ | "Geçersiz indirim kodu." |
| 9 | Kupon indirimi | ✅ | ₺16.550 → %10 = **₺1.655** |
| 10 | Kargo + toplam | ✅ | ₺14.895 + kargo 0 = ₺14.895 |
| 11 | Boş form doğrulama | ✅ | 9 alan hatası |
| 12 | Sipariş oluşturma | ✅ | **ATL-01043** |
| 13 | Panelde görünme | ✅ | Satır + ciro ₺16.650 |
| 14 | Stok düşümü | ✅ | Antrasit 2→**0**, Krem 8→**5** |
| 15 | Yenilemede sepet korunuyor | ✅ | localStorage |
| 16 | Mobil (390px) | ✅ | Yatay taşma **0px**, menü çalışıyor |
| 17 | Kırık görsel | ✅ | **0** kırık görsel |
| 18 | Konsol hatası | ⚠️ | Yalnız `favicon.ico` 404 (zararsız) |
| 19 | **İçerik gerçekten görünüyor** (boş panel yok) | ✅ | `.reveal` **18/18 görünür**, opaklık 0'da kalan **0** öğe |
| 20 | Tipografi gerçekten yüklendi | ✅ | Cormorant Garamond (h1 99.2px / w300), Jost — `document.fonts.check` = true |
| 21 | Katalogda görünmez kart yok | ✅ | 24 kart, görünmez **0** |
| 22 | Yatay kaydırma (gerçek) | ✅ | `scrollWidth − clientWidth = **0**`, hero görseli kırpılıyor |
| 23 | Kapalı çekmeceler gizli | ✅ | Sepet + menü `visibility: hidden`; açılınca `visible`, boş sepet mesajı doğru |
| 24 | Erişilebilirlik | ✅ | 32px altı dokunma hedefi **0**, etiketsiz form alanı **0** |

**Ekran görüntüleri:** `assets/img/ekran-katalog.png`, `ekran-mobil-urun.png`

---

## Eksik / sınırlı kalanlar (açıkça)

1. **Gerçek ödeme yok** — istendi, simülasyon. Kart bilgisi hiç istenmez.
2. **Kimlik doğrulama yok** — panel demo; gerçek yayında sunucu taraflı yetki gerekir.
3. **Görsel eşleşmesi %100 değil** — 3 ürün (Keten Masa Runner, Keten Perde, Meşe Yan Sehpa)
   stok fotoğraf kısıtından dolayı tam "ürün çekimi" değil, yaşam sahnesi fotoğrafı kullanıyor.
   Ürün metinleri görsellerle çelişmeyecek şekilde düzenlendi.
4. **Varyant stoğu stok panelinden toplu güncellenir** — varyant bazlı stok düzenleme arayüzü yok.
5. **Sepet/demo verileri tarayıcıya bağlı** — başka cihazda görünmez (tasarım gereği).
6. **Kargo/teslimat simülasyon** — gerçek entegrasyon yok.
7. **Bülten kaydı** yalnız arayüzde; e-posta toplanmaz, gönderilmez.

---

## Fotoğraflar

`assets/img/` içindeki fotoğraflar Unsplash / Pexels (ücretsiz kullanım) ve Openverse (CC BY) kaynaklıdır.
Toplanan küçük bir bölümünün atıfları `assets/img/KAYNAKLAR.md` dosyasındadır.

---

[![StackBlitz'te aç](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/numexai/numex-market/tree/main/uygulamalar/test-eticaret-sitesi) [![CodeSandbox'ta aç](https://codesandbox.io/static/img/play-codesandbox.svg)](https://codesandbox.io/s/github/numexai/numex-market/tree/main/uygulamalar/test-eticaret-sitesi)

**Kategori:** Diğer · Numex AI tarafından otonom üretildi ve test edildi.

- ▶️ [Canlı demo](https://dene.numexai.com.tr/test-eticaret-sitesi/)
- ⚡ Tarayıcıda aç ve düzenle: [StackBlitz](https://stackblitz.com/github/numexai/numex-market/tree/main/uygulamalar/test-eticaret-sitesi) · [CodeSandbox](https://codesandbox.io/s/github/numexai/numex-market/tree/main/uygulamalar/test-eticaret-sitesi) — kurulum yok
- 🛍️ [Numex Market'te gör](https://market.numexai.com.tr) · 🏗️ [Numex Forge](https://forge.numexai.com.tr/explore/repos)
- 💬 [Numex AI ile kendi uygulamanı yap](https://numexai.com.tr) — Türkçe yapay zekâ asistanı

**Etiketler:** `web sitesi şablonu` · `tanıtım sayfası` · `landing page` · `template` · `açık kaynak` · `türkçe` · `yapay zeka ile yapıldı` · `open source` · `javascript` · `ai generated` · `numex ai`

MIT lisanslıdır — bkz. [../LICENSE](../LICENSE). Beğendiysen [depoya ⭐ ver](https://github.com/numexai/numex-market).
