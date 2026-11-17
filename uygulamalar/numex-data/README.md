# 🕵️ Numex Data Detective

Verilerin içindeki gizli hataları bulan akıllı dedektif. İki dosyayı (CSV / XLSX) karşılaştırır; eksik ödemeyi, çift kaydı, tutar ve tarih uyuşmazlığını, yanlış eşleştirmeyi **kaynak satırlarıyla** gösterir.

## Çalıştırma

```bash
node server.js          # http://localhost:5173
```

Tarayıcıda `http://localhost:5173` açın. (ES modülleri ve `fetch()` için yerel sunucu gerekir; `index.html`'i çift tıklayarak açmak çalışmaz.)

Sunucu yoksa alternatif: `python -m http.server 5173`

## Kullanım

1. **Dosyaları yükleyin** — A: kaynak kayıtlar (satış/stok/personel), B: karşılaştırma (banka/mağaza/ödeme). Sürükle-bırak veya tıkla-seç.
2. Sütunlar otomatik tanınır (kimlik / tutar / tarih / açıklama). Yanlışsa açılır listeden değiştirin — sonuç anında yeniden hesaplanır.
3. **Karşılaştır** — toleransları (kuruş, gün) ve benzerlik eşiğini ayarlayabilirsiniz.
4. **Dedektif** sekmesinde sorunu seçin: açıklama, iki kaydın yan yana karşılaştırması, beklenen/mevcut değer, güven yüzdesi, önerilen düzeltme.
5. Şüpheli eşleşmeleri **Eşleştir** / **Yok say** ile siz karara bağlarsınız; her karar geri alınabilir (Ctrl+Z).
6. **Rapor** sekmesinden PDF, CSV, JSON dışa aktarın.

## Örnek senaryolar (menüden tek tıkla)

| # | Senaryo | Dosyalar |
|---|---|---|
| 1 | Banka & satış mutabakatı | `data/senaryo1-satis.csv` ↔ `data/senaryo1-banka.csv` |
| 2 | Depo & mağaza stok (adet) | `data/senaryo2-depo.csv` ↔ `data/senaryo2-magaza.csv` |
| 3 | Personel maaş & ödeme | `data/senaryo3-personel.csv` ↔ `data/senaryo3-odeme.csv` |

Her sette kasıtlı hatalar vardır: eksik kayıt, çift kayıt, tutar/tarih farkı, `00123 ↔ 123` format farkı, transpoze kimlik.

## Testler

```bash
npm test                 # motor testleri (63)
npm run test:tarayici    # gerçek Chromium kabul testleri (19)
npm run test:arayuz      # CSS sınıf kapsaması + medya sorguları
tests/ekran.mjs          # 3 kırılımda ekran görüntüsü (masaüstü/tablet/mobil)
tests/tasma-bul.mjs      # yatay taşma yapan öğeyi bulur
```

Sonuçlar: `dogrulama-raporu.md`

## Mimari

```
index.html            arayüz iskeleti
assets/style.css      beyaz zemin + turkuaz / mor / mercan tema
js/core.js            para (kuruş tamsayı), tarih, CSV, sütun otomatik tanıma
js/engine.js          eşleştirme + hata tespit motoru (saf fonksiyon, DOM'suz)
js/ui.js              yükleme, dedektif ekranı, kararlar, geri alma, dışa aktarma
server.js             bağımlılıksız statik sunucu
vendor/               xlsx (XLSX okuma), jsPDF + html2canvas (PDF) — yerel
data/                 üç örnek senaryo (6 dosya)
tests/                motor + tarayıcı testleri
```

### Motorun ilkeleri

- **Para:** kayan nokta yok; her tutar kuruş bazlı tamsayı (`paraKurus("1.234,56") === 123456`).
- **Kimlik:** birebir (`kırp + boşluk sadeleştir + büyük harf`). `00123` ile `123` **asla** eşitlenmez; yalnız "format farkı" olarak onaya sunulur.
- **Eşleştirme:** önce birebir kimlik, sonra (kalanlar için) benzerlik + tutar + tarih skoru. Şüpheli eşleşme onay olmadan kesinleşmez.
- **Sıra:** elle onaylar → dosya içi yinelenenler → kesin eşleşme → tutar/tarih denetimi → şüpheli adaylar → eksik/karşılıksız.
- **Sayısal güvenlik:** telefon/IBAN/TC gibi sütunlar tutar olarak seçilmez (`YASAK_TUTAR`), toplamlara katılmaz.

## Arayüz ve tasarım

Beyaz ağırlıklı, açık tema (karanlık geliştirici paneli yok); turkuaz / mor / mercan vurgular.

| Kırılım | Davranış |
|---|---|
| ≥1500px | ferah yerleşim, hero iki kolon |
| 1180–1500px | özet 6 → 3 kolon, ayarlar 2 kolon |
| ≤1180px | hero tek kolon, rapor tek kolon |
| ≤900px (tablet) | dosya kartları alt alta, detay tam ekran çekmece, eşleşme tablosu kart görünümü, sabit alt eylem çubuğu |
| ≤640px (telefon) | tek kolon, ikon düğmeler, 16px form alanları (iOS yakınlaşması yok), başlıkta kısaltılmış ad |
| ≤400px | özet tek kolon |

Ek olarak: `prefers-reduced-motion` desteği, `hover:none` (dokunmatik) hedef büyütme, klavye odak halkaları, `aria-live` bildirim, "içeriğe geç" bağlantısı, yazdırma stili.

> Tasarım tuzağı notu: CSS grid'de `1fr`, `minmax(auto,1fr)` demektir ve içeriğin `min-content`'inden küçülemez — mobilde 8px yatay taşmaya yol açtı. Tüm kırılımlarda `minmax(0,1fr)` kullanıldı, taşma `tests/tarayici.mjs` test 16–17 ile korunuyor.

## Gizlilik

Dosyalar cihazdan çıkmaz; ağ isteği yoktur (yalnız yerel `vendor/` dosyaları). Tarayıcı testleri dışında hiçbir uzak bağlantı kurulmaz.

---

Numex AI · 2026

---

[![StackBlitz'te aç](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/numexai/numex-market/tree/main/uygulamalar/numex-data) [![CodeSandbox'ta aç](https://codesandbox.io/static/img/play-codesandbox.svg)](https://codesandbox.io/s/github/numexai/numex-market/tree/main/uygulamalar/numex-data)

**Kategori:** Diğer · Numex AI tarafından otonom üretildi ve test edildi.

- ▶️ [Canlı demo](https://dene.numexai.com.tr/numex-data/)
- ⚡ Tarayıcıda aç ve düzenle: [StackBlitz](https://stackblitz.com/github/numexai/numex-market/tree/main/uygulamalar/numex-data) · [CodeSandbox](https://codesandbox.io/s/github/numexai/numex-market/tree/main/uygulamalar/numex-data) — kurulum yok
- 🛍️ [Numex Market'te gör](https://market.numexai.com.tr) · 🏗️ [Numex Forge](https://forge.numexai.com.tr/explore/repos)
- 💬 [Numex AI ile kendi uygulamanı yap](https://numexai.com.tr) — Türkçe yapay zekâ asistanı

**Etiketler:** `web sitesi şablonu` · `tanıtım sayfası` · `landing page` · `template` · `açık kaynak` · `türkçe` · `yapay zeka ile yapıldı` · `open source` · `javascript` · `ai generated` · `numex ai`

MIT lisanslıdır — bkz. [../LICENSE](../LICENSE). Beğendiysen [depoya ⭐ ver](https://github.com/numexai/numex-market).
