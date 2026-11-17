# Numex Data Story

CSV / XLSX dosyalarını içe aktarıp üzerinde çalışan, veri kalitesini denetleyen ve sürükle-bırak rapor paneline dönüştüren tek sayfalık web uygulaması.
Arayüz tamamen beyaz zemin üzerine **mercan (#FF6B5B)** ve **turkuaz (#0FC2B4)** paletiyle kuruludur; koyu panel yoktur.

## Çalıştırma

```bash
node server.js          # http://localhost:4173
```

Derleme adımı yoktur; `index.html` tarayıcıda doğrudan da açılabilir (XLSX/PDF için `vendor/` klasörünün yanında olması gerekir).

## Yetenekler

| Alan | Ayrıntı |
|---|---|
| İçe aktarma | CSV (`,` `;` `\t` ayırt edilir, BOM temizlenir, tırnaklı alan desteği), XLSX/XLS (tek sayfa), JSON yedek |
| Tablo | Hücre içi düzenleme (contenteditable), arama filtresi, satır ekleme, sayısal/tarih otomatik tip çıkarımı |
| Otomatik toplam | Alt bilgi satırı (Σ) her düzenlemeden sonra anında tazelenir; **kuruş cinsinden tam sayı aritmetiği** kullanılır, kayan nokta hatası birikmez |
| Formül | Satırda `Adet` veya `Birim Fiyat` değişirse `Tutar` = Adet × Birim Fiyat olarak yeniden hesaplanır |
| Kimlik kolonları | Telefon, sipariş no, TCKN, IBAN, plaka gibi alanlar **toplanmaz** (alt bilgide “n tekil”), “Değer (Y)” listesine girmez, yalnız kırılım (X) olarak kullanılır; değer olarak istenirse kayıt sayısı hesaplanır. Ada ve değere göre otomatik tanınır (baştaki 0, boşluk/parantez, yüksek benzersizlik, tarih koruması) |
| Kalite | Kolon bazında eksik değer sayımı, yinelenen satır grupları, “sayısal boşlukları 0 yap”, “kategorik boşlukları doldur”, yinelenenleri sil |
| Grafikler | Sütun / çizgi / pasta; kırılım + değer + işlem (toplam, ortalama, kayıt sayısı); SVG ile çizilir (harici grafik kütüphanesi yok) |
| Rapor paneli | Grafikler kart olarak eklenir, kartlar HTML5 sürükle-bırak ile sıralanır, kaldırılabilir |
| Dışa aktarma | CSV (noktalı virgül + BOM, Türkçe Excel uyumlu, son satırda TOPLAMLAR), PDF (yatay A4, tablo + panel özeti, Türkçe karakter desteği) |
| Kalıcılık | `Kaydet` → `localStorage` (`numex.datastory.v1`); sayfa yeniden açıldığında son kayıt geri yüklenir. `Yükle` → dışa aktarılmış `.json` |

## Dosyalar

```
index.html      arayüz iskeleti
styles.css      tema (beyaz zemin, mercan + turkuaz)
app.js          tüm uygulama mantığı (modülsüz IIFE, window.App test API'si)
server.js       bağımlılıksız statik sunucu (yalnız uygulama dosyalarını sunar)
vendor/         xlsx.full.min.js · pdfmake 0.2.20 + vfs_fonts (yerel, CDN bağımlılığı yok)
data/satis.csv  örnek 102 satırlık satış dosyası (3 eksik hücre + 2 yinelenen satır içerir)
scripts/gen-data.js  örnek veriyi üreten betik
test/           tarayıcı testlerinden alınan ekran görüntüleri
```

## Kabul testi — çıktının doğruluğu (uygulamanın içinde)

`✅ Kabul Testi` sekmesindeki **▶ Testleri çalıştır** düğmesi 20 denetim koşar. Kural: kabul prompta değil **çıktının kendisine** bağlıdır. Her satırda “beklenen” değer uygulamadan **bağımsız** hesaplanır (ham CSV metni son alanından ya da kuruş aritmetiğiyle), “çıkan” uygulamanın ürettiği değerdir.

Denetlenenler: satır sayısı · Tutar ve Adet toplamı (bağımsız CSV hesabı) · kimlik kolonlarının sınıflandırılması · kimlik kolonunun toplanmaması (alt bilgi “tekil”, `kolonToplami()` boş) · kimlik kolonunun Y listesinde olmaması · kimlik değer seçilirse sayılması · kırılım kayıt sayısı tutarlılığı · hücre düzenleme sonrası toplam farkının tam `(yeni−eski)×fiyat` olması · CSV gidiş-dönüş (toplam + satır) · PDF ham tablo satır sayısı (başlık + satır + TOPLAM) · PDF’te panel özeti olmaması · PDF TOPLAM satırının uygulama toplamına eşitliği · PDF’in gerçekten `%PDF-` üretmesi · kaydet→saklanan toplam · yinelenen silmede satır ve tutar farkının kopya tutarına eşitliği.

Özet satırı “20 / 20 test geçti — çıktı doğru, rapor yayınlanabilir.” demiyorsa rapor yayınlanmamalıdır; kalan testler tek tek listelenir.

## PDF biçimi

PDF **ham tablo dökümüdür**: yatay A4, tüm satırlar (kesme yok), tek satırlık başlık, ham tablonun kendi **TOPLAM** satırı (kimlik kolonlarında “n tekil”), sayfa numaralı alt bilgi. Grafik/panel özeti bilinçli olarak PDF’e konmaz.

## Tarayıcı testleri (12/12 geçti — ilk tur)

1. Sayfa yükleme — başlık, 4 sekme, XLSX/PDF motorları yüklü
2. “Örnek 100 Satır” → 100 satır, 7 kolon
3. `data/satis.csv` dosyasının gerçek dosya bırakma ile içe aktarılması → 102 satır, Tutar toplamı **837.890,25** (dosyadan bağımsız hesaplanan değerle fark **0,00**), Adet 1.421
4. Hücre düzenleme (Adet 18 → 30) → satır Tutarı 23.700,60 ve genel toplam 847.370,49 anında güncellendi, beklenen değerle fark 0,00
5. Kalite paneli → 3 eksik hücre, 2 yinelenen satır doğru tespit edildi
6. “Sayısal boşlukları 0 yap” → sayısal eksik kapandı, toplam bozulmadı
7. Yinelenenleri sil → 102 satırdan 100 satıra indi
8. Grafik üretimi → panelde 2 kart, 2 SVG çizildi
9. Sürükle-bırak → kart sırası değişti (`Kanal — Tutar` öne geçti)
10. CSV dışa aktarma → 104 satır, BOM var, son satır `TOPLAMLAR;;;;1421;58828,05;837890,25`
11. XLSX gidiş-dönüş → 41 KB dosya yazılıp yeniden içe aktarıldı, toplam korundu (fark 0)
12. PDF üretimi → 36.268 bayt, `%PDF-` başlığı; Kaydet + sayfa yenileme → 102 satır, 2 kart geri yüklendi

## Bilinen sınırlar

- Metin alanları `contenteditable` ile düzenlenir; çok satırlı hücre içeriği desteklenmez.
- PDF çıktısı ilk 300 satırı içerir (özet bilgiler tüm veriden hesaplanır).
- XLSX içe aktarma ilk çalışma sayfasını okur; birden çok sayfa birleştirilmez.

---

[![StackBlitz'te aç](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/numexai/numex-market/tree/main/uygulamalar/numex-data-store) [![CodeSandbox'ta aç](https://codesandbox.io/static/img/play-codesandbox.svg)](https://codesandbox.io/s/github/numexai/numex-market/tree/main/uygulamalar/numex-data-store)

**Kategori:** Diğer · Numex AI tarafından otonom üretildi ve test edildi.

- ▶️ [Canlı demo](https://dene.numexai.com.tr/numex-data-store/)
- ⚡ Tarayıcıda aç ve düzenle: [StackBlitz](https://stackblitz.com/github/numexai/numex-market/tree/main/uygulamalar/numex-data-store) · [CodeSandbox](https://codesandbox.io/s/github/numexai/numex-market/tree/main/uygulamalar/numex-data-store) — kurulum yok
- 🛍️ [Numex Market'te gör](https://market.numexai.com.tr) · 🏗️ [Numex Forge](https://forge.numexai.com.tr/explore/repos)
- 💬 [Numex AI ile kendi uygulamanı yap](https://numexai.com.tr) — Türkçe yapay zekâ asistanı

**Etiketler:** `web sitesi şablonu` · `tanıtım sayfası` · `landing page` · `template` · `açık kaynak` · `türkçe` · `yapay zeka ile yapıldı` · `open source` · `javascript` · `ai generated` · `numex ai`

MIT lisanslıdır — bkz. [../LICENSE](../LICENSE). Beğendiysen [depoya ⭐ ver](https://github.com/numexai/numex-market).
