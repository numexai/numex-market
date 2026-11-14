# NUMEX LASER PRO — Ölçüm ve Test Raporu

**Tarih:** 14 Kasım 2026
**Ürün:** NUMEX LASER PRO v1.0 — tarayıcı tabanlı 2D vektörel lazer kesim tasarım stüdyosu
**Teknoloji:** Saf HTML + CSS + JavaScript (Canvas2D). Harici bağımlılık yok, internet gerekmez.
**Çalıştırma:** `index.html` dosyasını çift tıklayın veya klasörde `python -m http.server 8087` çalıştırıp `http://127.0.0.1:8087` adresini açın.

---

## 1. Ölçü Sistemi (mimari kararı)

| Katman | Birim | Açıklama |
|---|---|---|
| Veri modeli | **mm** | Her nesne `{x, y, w, h, rot, layer, ...}` — x/y sol-üst köşe, mm |
| Dünya koordinatı | mm | X sağa, **Y aşağı** (SVG ile aynı) |
| Ekran | px | `ekran = pan + mm × zoom` — yalnız görüntülemede |
| DXF | mm | Y ekseni **yukarı**; çıkışta `y_dxf = bed.h − y_ed` |
| Gerçek ölçü | mm | Zoom'dan **bağımsız**; ekran ölçeği değişse de geometri değişmez |

Çalışma alanı varsayılan **300 × 200 mm**, 10 mm ızgara, 50 mm ana çizgiler.

---

## 2. Gerçek Tarayıcı Testleri (Chrome, canlı uygulama üzerinde)

Aşağıdaki testler tarayıcı otomasyonu ile **gerçek sayfa üzerinde** koşturuldu; değerler uygulamanın kendi durumundan (`window.NUMEX_LASER.state`) ve kendi dışa aktarma/geri okuma fonksiyonlarından ölçüldü.

| # | Test | Beklenen | Ölçülen | Durum |
|---|---|---|---|---|
| 1 | 80 × 40 mm anahtarlık gövdesi | x=110, y=80, w=80, h=40, r=6, katman=cut | x=110, y=80, w=80, h=40, r=6, katman=cut | ✅ |
| 2 | 6 mm anahtarlık deliği | 6×6 mm, kenar payı 6 mm | x=116, y=97, w=6, h=6 — sol kenara uzaklık **6,00 mm** | ✅ |
| 3 | Metin gravür katmanında | "NUMEX", layer=engrave | text="NUMEX", layer="engrave", font 8 mm | ✅ |
| 4 | Sürükle-bırak ile taşıma | Nesne fareyle hareket eder | Gerçek fare sürüklemesi: (110, 80) → **(164,69 , 99,53)** = +54,69 / +19,53 mm | ✅ |
| 5 | Geri al (Ctrl+Z / ↶) | Önceki konuma döner | **(110, 80)** — tam geri döndü | ✅ |
| 6 | Açık kesim yolu uyarısı | Uyarı üretir | "Açık kesim testi" çizgisi eklendi → **UYARILAR (1): açık kesim yolu** | ✅ |
| 7 | Kesim alanı dışına taşma | Hata üretir | Gövde 370,80'e taşındı → **HATALAR (1): "Dış kontur" kesim alanı dışına çıkıyor (X:370–450)** | ✅ |
| 8 | SVG dışa aktar → geri oku → ölç | 300×200 mm, 80×40 mm, rx6, 6×6 mm | 10/10 kontrol geçti (aşağıda) | ✅ |
| 9 | DXF dışa aktar → geri oku → geometri | 80×40 mm, mm birimi, kapalı kontur | Sınır kutusu **80,00 × 40,00 mm**, $INSUNITS=4, açık uç **0** | ✅ |
| 10 | JSON kaydet → yeni proje → aç | Nesneler birebir korunur | id'ler korundu, gövde 110,80/80×40, metin "NUMEX"/engrave | ✅ |

**Sonuç: 10 / 10 geçti.**

### Test 8 ayrıntısı — SVG ölçü doğrulaması (uygulama içi)
```
✓ SVG genişlik (mm): 300 mm (beklenen 300)
✓ SVG yükseklik (mm): 200 mm (beklenen 200)
✓ Dikdörtgen konum: X 110 / Y 80 mm
✓ Dikdörtgen ölçü: 80 × 40 mm (beklenen 80 × 40)
✓ Daire konum: X 116 / Y 97 mm
✓ Daire ölçü: 6 × 6 mm (beklenen 6 × 6)
✓ Yuvarlatma (rx): 6 mm
✓ Metin sayısı: 1 (beklenen 1)
✓ Metin içeriği: NUMEX
✓ Nesne sayısı: 3 (beklenen 3)
```

### Test 9 ayrıntısı — DXF geometri doğrulaması (uygulama içi)
```
✓ $INSUNITS = mm: kod 70 = 4 (mm)
✓ Varlık sayısı: 100 LINE, 1 TEXT
✓ Sınır kutusu genişliği: 80 mm (beklenen 80)
✓ Sınır kutusu yüksekliği: 40 mm (beklenen 40)
✓ Y ekseni çevrimi: üst kenar DXF Y=80 (beklenen 80)
✓ Kapalı kontur: 2 kapalı şekil · açık uç 0
✓ Metin sayısı: 1 TEXT
```

---

## 3. Kesim Kontrolü (akıllı denetim)

Açılışta ve her değişiklikte otomatik çalışır. Anahtarlık örneğinde ölçülen değerler:

| Ölçüm | Değer |
|---|---|
| Nesne sayısı | 3 |
| Toplam kesim uzunluğu | **248,55 mm** |
| Gravür uzunluğu | 49,60 mm |
| İşaretleme uzunluğu | 0 mm |
| Kapalı şekil çevresi | 248,55 mm |
| Tahmini süre | **21,13 sn** (Kesim katmanı: 248,55 mm ÷ 12 mm/s × 1 geçiş) |
| Hata / Uyarı | Yok / Yok |

**Süre hesabı uyarısı (arayüzde de yazılı):** Süre yalnızca *uzunluk ÷ hız × geçiş* ile hesaplanır. Makinenin ivmelenmesi, kafa hareketi ve güç ayarı hesaba **katılmaz**.

Denetlenen durumlar: açık kesim yolu, çakışan/yinelenen çizgiler, çok küçük parçalar (0,5 mm altı), kesim alanı dışına taşma, kapalı şekil çevresi, toplam kesim uzunluğu.

Kesim uzunluğu kontrolü (doğrulama): yuvarlatılmış dikdörtgen 80×40 r6 → 2×(80−12) + 2×(40−12) + 2π×6 = 136 + 56 + 37,70 = **229,70 mm**; daire 6 mm → π×6 = **18,85 mm**; toplam **248,55 mm** ✓ (uygulamayla birebir aynı).

---

## 4. Dışa Aktarma

| Format | İçerik | Ölçü doğrulaması |
|---|---|---|
| **SVG** | Gerçek vektör geometri, `width="300mm" height="200mm"`, her işlem katmanı ayrı `<g>` (`data-speed`, `data-power`, `data-passes`) | Dosyadan geri okundu: 10/10 kontrol geçti |
| **DXF** | R12 (AC1009), `$INSUNITS=4` (mm), Y ekseni yukarı. Kapalı şekiller tek **POLYLINE** (70=1), metin TEXT | Sınır kutusu 80,00 × 40,00 mm; açık uç 0 |
| **PNG** | Çalışma alanı önizlemesi | — |
| **JSON** | Düzenlenebilir proje (nesneler + katman parametreleri + çalışma alanı) | Nesneler birebir korundu |

Örnek çıktılar `ornek/` klasöründe:
- `ornek/numex-anahtarlik.svg`
- `ornek/numex-anahtarlik.dxf`
- `ornek/numex-anahtarlik.json`

**DXF'te yaklaştırılan/bildirilen özellikler (sessizce kaybedilmez):**
- Yuvarlatılmış köşe, yay nesnesi değil köşe başına 12 parçalı nokta dizisi olarak çıkar.
- Döndürülmüş nesnenin dönüşü nokta koordinatlarına gömülür (DXF'te nesne dönüşü yok); bu durum dışa aktarma raporunda listelenir.
- Metin, TEXT kaydı olarak çıkar; harf konturları (vektör harfler) DXF'te yoktur — gravür için SVG önerilir.

Bu maddeler uygulama içindeki **"SVG/DXF Ölçü Doğrula"** ekranında ve dışa aktarma raporunda kullanıcıya gösterilir.

---

## 5. Güvenli Çalışma

Bu sürüm **yalnızca tasarım ve dosya hazırlama** yazılımıdır:

- Gerçek lazer makinesine bağlanmaz.
- G-code üretmez.
- Makineyi çalıştırmaz.
- Lazer gücünü uzaktan kontrol etmez.

Hız / güç / geçiş alanları yalnızca **iş hazırlığı parametresi**dir; SVG'de `data-*` niteliği olarak taşınır, hiçbir yere gönderilmez. Kesim parametrelerinin fiziksel malzemeye uygunluğu **operatör tarafından** doğrulanmalıdır. Bu uyarı arayüzde "GÜVENLİK" panelinde sürekli görünür.

---

## 6. Gerçekleştirilen Araçlar ve Arayüz

**Çalışma alanı:** koyu premium tema · mm cetvelleri (üst + sol) · 10 mm ızgara / 50 mm ana çizgi · zoom (− / + / Sığdır / tekerlek) · orta tuş veya boşluk ile kaydırma · çoklu seçim (Shift ile ekleme, kutu seçimi) · sürükle-bırak · Shift ile eksene kilitleme · geri/ileri al (80 adım) · katman paneli.

**Araçlar:** dikdörtgen (Shift = eşkenar) · daire · çizgi (Shift = 0/45/90°) · çokgen · serbest çizim · metin · SVG içe aktarma · çoğaltma (Ctrl+D) · grupla / çöz.

**Sayısal özellik paneli:** X, Y, Genişlik, Yükseklik, Dönüş açısı ve katman — her nesne için mm cinsinden elle girilebilir.

**İşlem katmanları:** Kesim (kırmızı #ff3b4e), Gravür (mavi #3b8bff), İşaretleme (yeşil #25d366) — her biri için hız (mm/s), güç (%), geçiş sayısı.

---

## 7. Test sırasında bulunan ve düzeltilen hatalar

| Belirti | Kök neden | Düzeltme |
|---|---|---|
| Nesneler çalışma alanının dışında, boşlukta görünüyordu; anahtarlık deliği hiç görünmüyordu | Tuval çalışma alanı dikdörtgeniyle clip edildikten sonra nesneler dünya koordinatıyla (mm→px yapılmadan) çiziliyordu | Dünya→ekran dönüşümü (pan + zoom) tek bir katmana alındı; nesneler mm uzayında çiziliyor |
| Gravür yazısı dolu mavi blok çıkıyordu | Metin her katmanda dolgu olarak çiziliyordu | Gravür/işaretleme dolgu, kesim kontur olarak çiziliyor |
| Taşıma sırasında nesne kayıyordu | Delta her hareket olayında birikimli uygulanıyordu | Konum her karede başlangıç konumundan türetiliyor |
| Bir tıklama bile boş undo basamağı bırakıyordu | `pointerdown`'da geçmiş yazılıyordu | Geçmiş yalnız gerçek hareket başlayınca yazılıyor |
| DXF'te dönüş yoktu, yuvarlatılmış köşe kopuk çıkıyordu | Dönüş uygulanmıyor, yaylar ayrı LINE'lara bölünüyordu | Dönüş nokta koordinatlarına gömüldü; kapalı şekiller tek POLYLINE |
| "Dışa Aktar → SVG" TypeError veriyordu | `collectUnsupported` fonksiyonu `collectUndsupported` diye çağrılıyordu | Ad düzeltildi, rapor paneline taşındı |
| Undo sonrası nesneler kayboluyordu | `applySnapshot` her seferinde çalışma alanını yeniden merkezliyordu; `loadSample` sırası hatalıydı | Görünüm geri yüklemeden ayrıldı; örnek yükleme sırası düzeltildi |
| Grafika imleç tıklaması seçim yapmıyordu | `setPointerCapture` dpr ölçekli canvas'ta koordinatları kaydırıyordu | Yakalama kaldırıldı |
| NUMEX yazısı anahtarlığın dışına taşıyordu | 10 mm font 40 mm genişlikle 80 mm gövdeye sığmıyordu | Font 8 mm, genişlik gerçek harf ölçüsüne göre hesaplandı |

---

## 8. Bilinen Sınırlamalar

- Kesim süresi ivmelenmeyi hesaba katmaz; gerçek makine süresi daha uzun olur.
- DXF R12 yazılır: yay/elips nesnesi yok, hepsi POLYLINE nokta dizisi. Bazı makine yazılımları aşırı düğüm sayısından şikâyet edebilir.
- Metin, DXF'te TEXT kaydı olarak çıkar; harf konturu isteyen gravür işleri için SVG kullanılmalı.
- SVG içe aktarma temel şekilleri (rect, circle, ellipse, line, polygon, path, text) okur; CSS stilleri ve filtreler okunmaz.
- Uygulama tek dosya tarayıcı uygulamasıdır; sunucu tarafı yoktur, proje dosyaları kullanıcının cihazında kalır.

---

*Rapor, uygulamanın canlı tarayıcı testleri ve kendi doğrulama fonksiyonlarının çıktılarıyla hazırlanmıştır.*
