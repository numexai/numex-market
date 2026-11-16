# Doğrulama Raporu — NUMEX FLOORPLAN

Tarih: 16 Kasım 2026 · Ortam: gerçek tarayıcı (Chromium, 1440×900), `http://127.0.0.1:4173`
Yöntem: gerçek fare olayları (sürükleme/tıklama) + sayfa içi ölçüm. Aşağıdaki sayılar test sırasında okunan gerçek değerlerdir.

## Kabul testleri

| # | Test | Sonuç | Ölçüm |
|---|---|---|---|
| 1 | Duvar çiz, ölçüsünü kontrol et | ✅ | 4 duvar: 3,50 m / 3,00 m / 3,50 m / 3,00 m — çizilen piksel (245 px @ 70 px/m) ile birebir |
| 2 | Kapalı oda oluştur, alanı hesapla | ✅ | Oda 1 = **10,50 m²** (3,50 × 3,00). Hazır projeler: 1+1 → 3 oda / 42,00 m², 2+1 → 5 oda / 90,00 m², stüdyo → 2 oda / 48,00 m² |
| 3 | Duvara kapı ekle | ✅ | Kapı `d=1,75 m`, `w=0,90 m`, duvara bağlı (`wallId`), duvar 3,50 m |
| 4 | Pencere ekle | ✅ | Pencere `w=1,20 m`, denizlik `0,90 m`, aynı duvarda kapıyla çakışmıyor |
| 5 | Mobilya sürükle ve döndür | ✅ | Koltuk (1,75; 1,50) → sürükleme sonrası (2,10; 1,65) = 0,35/0,15 m (70/35 px, 0,05 m ızgara); `R` ile 90° |
| 6 | 2D→3D geçişte nesneler aynı mı | ✅ | Sahne modelden kurulur: mobilya eklenince parça 20 → 22; yatak sahnede x=1,50 / z=1,00 (model x=1,50 y=1,50). Duvarlar boşluklarından kesilmiş: 3,50 m duvar 1,30 + 1,15 m parçalara ayrılmış, kapı üstü lento 0,90 × 0,70 m |
| 7 | Projeyi JSON kaydet ve yeniden aç | ✅ | Aç/kaydet sonrası: duvar 4, mobilya 1, oda alanları [10,50], duvar kalınlığı 0,20, köşe x=0 — **birebir aynı** |
| 8 | Geri al/yinele + SVG dışa aktarma | ✅ | Duvar 5 → geri al 4 → yinele 5. SVG 3.064 karakter, `</svg>` kapanıyor, 9 `<line>`; PNG `data:image/png;base64,…` üretildi |

## Bina sınavı (SCENARIO) testleri — 16 Kasım 2026

| # | Test | Sonuç | Ölçüm |
|---|---|---|---|
| 9 | Motor üç hazır planda koşuyor | ✅ | 1+1: 3 oda, 1 dış çıkış, en uzun tahliye **10,88 m**, 2 bulgu · 2+1: 5 oda, **14,96 m**, 4 bulgu · stüdyo: 2 oda, **8,54 m**, 1 bulgu — çökme yok |
| 10 | Alan hesabı elle doğrulama | ✅ | 1+1 oda alanları toplamı 42,00 m² = `NF.totalArea` = bina dış ölçüsü 6,00 × 7,00 m |
| 11 | Sınır durumları | ✅ | Boş proje: 1 bulgu (ODA_YOK) · tek duvar: 0 oda, 1 bulgu — ikisinde de çökme yok |
| 12 | Tarayıcıda panel | ✅ | `SCENARIO`/`EXAM` yüklü, **5** senaryo kartı, 4 kanıt satırı, karar "KOŞULLU GEÇTİ — 3/5 senaryo kaldı" |
| 13 | Harita ↔ panel bağlantısı | ✅ | Haritadaki 4 numaralı işarete tıklama → `examFocus=3`, panelde "Pencere yok" satırı seçildi |
| 14 | Canlı yeniden ölçüm | ✅ | Örnek plan 2+1 → stüdyo: oda 5→2, bulgu 4→1, düğme "Bina Sınavı · 1" |
| 15 | Tarayıcı ↔ Node aynı sayı | ✅ | Stüdyo ofis tahliye 7,21 m / 8,54 m — iki ortamda birebir aynı |

## Ek doğrulamalar

- Tema: koyu → açık geçişi, `localStorage`'a yazıldı (`light`), 2B ve 3B aynı temada.
- Otomatik kayıt: sayfa yenilendiğinde son proje geri yüklendi ("Son çalışman geri yüklendi").
- Hizalama: duvar uçlarına ve ızgaraya oturma, ekran görüntüsünde "ızgaraya hizalı (0,05 m)" durum çubuğunda göründü.
- 2B ölçüler: duvar etiketleri metre ("3,50 m"), mobilya paneli cm ("210 × 90 cm"), oda alanı m².

## Bulunan ve düzeltilen hatalar (test sırasında)

1. **3B modülü hiç yüklenmiyordu** — `forEach` içinde `continue` sözdizimi hatası dosyayı geçersiz kılıyordu (`V3 is not defined`). → `return` yapıldı, 3B ayağa kalktı.
2. **JSON açma çöküyordu** — `openJSON` içinde var olmayan `this.$` alanına yazılıyordu (TypeError). → satır kaldırıldı.
3. **Sayı alanları boş görünüyordu** — `type="number"` alanlarına virgüllü değer yazılıyordu; tarayıcı reddediyordu. → değerler noktaya çevriliyor, panelde onarım yapılıyor.
4. **3B canlı güncellenmiyordu** — model değişince sahne yalnız mod değişiminde yeniden kuruluyordu. → `change` olayı kare başına bir kez sahne yenilemesi tetikliyor (ölçüm: 20 → 22 parça).
5. **Senaryo motoru tarayıcıya hiç girmiyordu** — `index.html` `scenario.js`'i çağırmıyordu; panel boş kalırdı. → script eklendi, `exam.js` paneli bağlandı.
6. **`dist` gölgelemesi** — `evacuationFrom` içindeki yerel `dist` nesnesi modül düzeyindeki `dist(a,b)` fonksiyonunu eziyordu (TypeError: dist is not a function). → mesafe haritasının adı `distMap` yapıldı.
7. **Karar senaryolarla çelişiyordu** — 3 senaryo "KALDI" iken başlık "SINAVI GEÇTİ" yazıyordu. → karar artık senaryo sonuçlarından türüyor: temiz / koşullu geçti / kaldı.
8. **Sayı alanlarında virgül uyarısı** — `type="number"` alanlarına `fmt()` ile virgüllü değer yazılıyordu. → ölçü alanları `fmtv()` (noktalı) kullanıyor; konsol uyarısı bitti.

## Bilinen eksikler (gizlenmiyor)

- **Kapı kanadı yönü:** varsayılan açılım duvarın a→b yönüne göre belirlenir; "odaya doğru açılsın" otomatik seçimi yok. Yön, duvarın çiziliş yönüne göre değişir.
- **3B'de etiket yok:** oda adı, alan ve ölçü etiketleri yalnız 2B'de çizilir; 3B sadece geometri/malzeme/gölge gösterir.
- **3B mobilya sadeleştirilmiş:** gerçek ölçüde kutu + sırt/başlık detayı; kanepe kıvrımı, kulp gibi model detayı yok.
- **3B duvar birleşimleri:** aynı düğümde birleşen duvarlar ayrı kutular olarak çizilir; köşelerde iç içe geçme olur (görsel olarak temiz, geometrik olarak mükerrer hacim).
- **Dokunmatik:** masaüstü fare için tasarlandı; tablet/telefon için çift parmak jestleri yok.
- **Erişilebilirlik:** klavye kısayolları var, ekran okuyucu etiketleri ve odak halkaları eksik.
- **Sınav katmanı yalnız 2B'de:** bulgu işaretleri ve tahliye yolları 3B görünümde çizilmez.
- **Tahliye yolu şematik:** oda merkezleri ara nokta olarak kullanılır; duvarlardan kaçınan gerçek koridor yolu hesaplanmaz. Mesafe değerleri kapı noktaları arası gerçek ölçüdür, yol çizimi yön gösterir.
- **Etiket çakışması:** birden çok tahliye yolu üst üste çizilir; dar planlarda mesafe etiketleri birbirine yaklaşabilir.
- **Oda adları tahmini:** Banyo/Yatak Odası/Mutfak/Salon mobilyadan çıkarılır; eşya yoksa "Oda N" yazılır.
- **Sınırlar sabit:** 20 m tahliye ve 80 cm kapı sınırları yönetmelik seçimine bağlı değil; tek bir varsayılan kullanılıyor.

## Sınır durumları

- 0 duvarlı proje: oda listesi boş, alan 0,00 m², uygulama çökmez.
- Çok kısa duvar (< 0,10 m) çizilmez; kapı/pencere sığmayan duvara eklenmez, kullanıcıya uyarı verilir.
- Boşluk, duvardan uzun olamaz: konum ve genişlik duvar boyuna göre kırpılır.
- Bozuk/eksik JSON: "Dosya okunamadı" mesajı; mevcut proje korunur.
