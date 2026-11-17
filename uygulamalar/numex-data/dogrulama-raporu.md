# Numex Data Detective — Doğrulama Raporu

**Tarih:** 17 Kasım 2026
**Kapsam:** İki dosyanın (satış ↔ ödeme, depo ↔ mağaza, personel ↔ maaş) karşılaştırılması ve gizli hataların kaynak satırlarıyla raporlanması.
**Çalıştırma:** `node server.js` → http://localhost:5173 · `npm test` (motor) · `npm run test:tarayici` (gerçek tarayıcı)

---

## 1. Test özeti

| Paket | Test sayısı | Sonuç |
|---|---|---|
| Motor testleri (`tests/test.mjs`) | 63 | ✅ 63 / 63 geçti |
| Gerçek tarayıcı kabul testleri (`tests/tarayici.mjs`, Chromium) | 19 | ✅ 19 / 19 geçti |
| Arayüz tutarlılık (`tests/sinif-kontrol.mjs`) | 148 sınıf | ✅ eksik sınıf yok · 8 medya sorgusu |

> Not: İlk koşuda 2 motor testi ve 5 tarayıcı testi kırmızıydı. Kırmızıların 6'sı test beklentisi (Excel seri tarihi, uppercase `innerText`, ESM/CJS yükleme, `data-durum` seçicisi), 1'i **gerçek kod hatası** (ui.js'te eksik `paraKurus` import'u) idi. Hepsi düzeltildi, sonra tekrar koşuldu — geçmeyen test geçti gösterilmedi.

---

## 2. Bilinen sonuçlu veri setleri (kritik mühendislik sınavı)

### Senaryo 1 — Banka & satış mutabakatı (`data/senaryo1-satis.csv` ↔ `data/senaryo1-banka.csv`)

| # | Beklenen hata | Kaynak satır | Uygulama çıktısı |
|---|---|---|---|
| 1 | Ödemesi gelmemiş satış | satış satır 6 (S-1005) | ✅ tespit · 2.780,25 TL açık |
| 2 | Aynı ödeme iki kez | banka satır 6 ve 7 (S-1006) | ✅ tespit · "yinelenen", güven %99 |
| 3 | Kuruş farkı | satış 3 ↔ banka 3 (S-1002) | ✅ 875,50 ↔ 875,05 · 0,45 TL |
| 4 | Büyük tutar farkı | satış 4 ↔ banka 4 (S-1003) | ✅ 12.400,00 ↔ 12.040,00 · 360,00 TL |
| 5 | Tarih farkı | satış 5 ↔ banka 5 (S-1004) | ✅ 14 gün |
| 6 | Benzer ama farklı kimlik | satış 9 (S-00123) ↔ banka 9 (S-123) | ✅ "kimlik formatı" · **otomatik eşleşmedi** |
| 7 | Yanlış eşleştirme adayı | satış 12 (S-1008) ↔ banka 12 (S-1080) | ✅ "şüpheli eşleşme" · onaya sunuldu |
| 8 | Karşılığı olmayan ödeme | banka 13 (S-2001) | ✅ tespit · 950,00 TL |

**Toplam:** 11 satış ↔ 12 banka hareketi · 8 kesin eşleşme · 8 sorun (3 kritik + 5 uyarı)
**Toplamlar:** A 30.616,25 TL · B 29.675,55 TL · eşleşen çiftlerde net fark −360,45 TL

### Senaryo 2 — Depo & mağaza stok (`Adet` birimiyle)

Beklenen 7 sorun: U-101 (−2 adet), U-107 (+2 adet), U-104 (4 gün), U-105 depoda var/mağazada yok, U-110 mağazada var/depoda yok, U-106 yinelenen sayım, U-00108 ↔ U-108 format farkı. **Uygulama: 7/7 doğru.**

### Senaryo 3 — Personel maaş & ödeme

Beklenen: P-1045 180,00 TL eksik, P-1047 çift maaş (satır 7-8), P-0048 ↔ P-048 format farkı, P-1049 4 gün geç, P-1099 karşılıksız. **Uygulama: 7 kesin eşleşme + 6 sorun, tümü doğru; P-0048 "ödemesi gelmemiş" diye ayrıca damgalanmadı (şüpheli aday olarak sunuldu).**

---

## 3. Kritik kurallar — kanıtlanmış davranış

| Kural | Nasıl kanıtlandı |
|---|---|
| `00123` ≠ `123` | Motor testi + tarayıcı testi 5: kimlikler birebir karşılaştırılır, sadece "format farkı" uyarısı çıkar, `eslesmeler` dizisinde yer almaz |
| Telefon/hesap/kimlik parasal toplanmaz | `sutunTani` testi: "Telefon" başlıklı sayısal sütun tutar olarak seçilmiyor (ceza katsayısı 0,15); 05551234567 ham sayı olarak büyük çıkar ama toplamlara girmez |
| Kayan nokta yok | `paraKurus` tüm tutarları **kuruş bazlı tamsayı** yapar; `0,1 + 0,2 === 0,3` testi geçti; 30.616,25 TL toplamı birebir |
| Şüpheli eşleşme onaysız kesinleşmez | Tarayıcı testi 9: "Eşleştir" tıklanmadan eşleşme sayısı 8; onaydan sonra 9 |
| Geri alınabilirlik | Tarayıcı testi 10: geri al → eşleşme 8'e döner, uyarı kartı geri gelir |
| Onay reddi | Tarayıcı testi 11: "Yok say" → aday kaybolur, iki kayıt ayrı ayrı "ödemesi gelmemiş" / "karşılığı yok" olur |

---

## 4. Tarayıcı kabul testleri (14/14)

1. Sayfa hatasız açılıyor, iki yükleme alanı var, konsol temiz
2. Örnek senaryo: 8 sorun · 8 eşleşme · özet kartları · dosya rozeti 2/2
3. Eşleştirme sütunu değiştirilince sonuç yeniden hesaplanıyor, geri alınınca 8'e dönüyor
4. Detay paneli: açıklama, kaynak satırlar, beklenen/mevcut, güven çubuğu, iki yan yana kayıt kutusu
5. `S-00123 ↔ S-123` otomatik eşleşmiyor, "aynı görünen farklı kimlik" uyarısı veriyor
6. CSV indirme: UTF-8 BOM, `;` ayraç, eşleşmeler + sorunlar + öneriler
7. Proje JSON kaydet (11 + 12 satır, eşleştirme dahil) ve geri yükle → 8 sorun
8. PDF indirme: geçerli `%PDF-` imzası, Türkçe karakterler bozulmuyor (html2canvas + jsPDF), >20 KB
9. Şüpheli eşleşme onayı → 9 eşleşme, uyarı kalkıyor
10. Geri al → karar iptal
11. Yok say → kayıtlar ayrı sorunlara dönüşüyor
12. Tutar toleransı 100 kuruş → 45 kuruşluk fark susuyor, 360 TL kalıyor; 0'a dönünce 2 fark
13. Çözüldü işaretle → sayaç ve özet güncelleniyor, çözüm geri alınabiliyor
14. XLSX yükleme → 2 satır, tutar sütunu otomatik tanındı (index 3)

---

## 4b. Arayüz ve responsive (tasarım kalitesi turu)

İlk teslimde arayüz "orta" bulundu (ret gerekçesi). Bu turda tasarım sistemi baştan kuruldu:

- **Giriş (hero) kartı**: üç adımlı akış, canlı örnek hata kartları, tek tıkla örnek senaryo.
- **Görsel dil**: değişken tabanlı tasarım sistemi (renk/ölçü/gölge/geçiş), katmanlı gölgeler, yumuşak gradyan arka plan, cam görünümlü üst çubuk.
- **Mikro etkileşim**: kart kaldırma, odak halkaları, sekme alt çizgisi animasyonu, çekmece geçişi.
- **Mobil**: tam ekran detay çekmecesi + "listeye dön", sabit alt eylem çubuğu, eşleşme tablosunun kart görünümüne dönüşmesi (hücrelerde `data-label`), 44px dokunma hedefleri.
- **Erişilebilirlik**: `prefers-reduced-motion`, `hover:none`, `aria-live` bildirim, "içeriğe geç" bağlantısı, yazdırma stili.

| Test | Sonuç |
|---|---|
| 15. Giriş kartı boşta görünür, dosya yüklenince gizlenir | ✅ |
| 16. Mobil 390px: yatay taşma yok, mobil çubuk var, çekmece açılıp kapanıyor | ✅ |
| 17. Mobil: tablo kart görünümü (thead gizli, hücre etiketli), taşma yok | ✅ |
| 18. Tablet 820px: özet 2 kolon, taşma yok, filtreler erişilebilir | ✅ |
| 14b. Yükleme sonrası sürükle-bırak alanı gizli, dosya içeriği görünür (regresyon) | ✅ |
| CSS sınıf kapsaması: index.html + ui.js'teki 148 sınıf | ✅ eksiksiz |

**Bulunan gerçek kusur 1:** mobilde 8px yatay taşma. Kök neden: `grid-template-columns:1fr` (= `minmax(auto,1fr)`) içeriğin `min-content`'inden küçülemiyordu. `minmax(0,1fr)` yapıldı; ölçümle doğrulandı (scrollWidth 398 → 390).

**Bulunan gerçek kusur 2 (canlı tarayıcı denetimi):** dosya yüklendikten sonra sürükle-bırak alanı ekranda kalıyordu. Kök neden: `[hidden]` niteliğinin tarayıcı varsayılanı (`display:none`) düşük özgüllüktedir, `.birak-alani{display:flex}` kuralı onu eziyordu. CSS'e `[hidden]{display:none!important}` eklendi; `getComputedStyle` ölçümüyle doğrulandı (`display:none`) ve test 14b kalıcı korumaya alındı.

## 5. Bilinen sınırlar (dürüst notlar)

- **XLSX'te yalnız ilk sayfa** okunur (`SheetNames[0]`). Çok sayfalı dosyada sayfa seçimi yok.
- **Şüpheli eşleşme skoru** sezgisel: Levenshtein benzerliği (%52) + tutar eşitliği (%32) + tarih yakınlığı (%16). Bir eşleşme birden çok adaya uyuyorsa yalnız en iyisi önerilir, geri kalanı ayrı sorun olarak listelenir.
- **Format farkı (00123/123) güveni en fazla %72** gösterilir; sistem bu çifti asla kendi kararıyla kesinleştirmez.
- **PDF** görüntü tabanlı üretilir (metin seçilemez); Türkçe karakter garantisi için bu tercih edildi.
- Tarih ayrıştırmada `01/02/2026` gibi belirsiz gün/ay durumlarında **Türkçe sıralama (gün.ay.yıl)** esas alınır; ay > 12 ise otomatik takas edilir.
- Tarayıcı testleri Chromium ile koşuldu; Firefox/Safari doğrulanmadı. Responsive 390 / 820 / 1440 px kırılımlarında doğrulandı, arası genişlikler türetilmiş kurallarla karşılanıyor.
- Mobil eylem çubuğu `env(safe-area-inset-bottom)` ile çentikli ekranlara pay bırakır; çok eski tarayıcılarda pay 0 olur.
- Uygulama hiçbir veriyi sunucuya göndermez; tüm hesaplama tarayıcıda.
