# Anadolu Atölyesi — Doğrulama Raporu

Tarih: 16 Kasım 2026 · Uygulama: `c:\testyeni\testanadolu\index.html` (saf HTML/CSS/JS, derleme yok)

## Tarayıcıda yapılan gerçek etkileşim testleri

| # | Test | Beklenen | Ölçülen sonuç |
|---|------|----------|----------------|
| 1 | Sayfa açılışı ve arayüz metinleri | Başlık, simetri, motif ekleme bölümleri görünür | Geçti — `metin:true`, 7 motif düğmesi, 3 panel sekmesi |
| 2 | "Örnekler" galerisi | 6 düzenlenebilir kompozisyon | Geçti — `kart:6`, galeri açıldı |
| 3 | Örnek yükleme (İznik Bahçesi) | 3 katman, 6 katlı radyal düzen | Geçti — `katman:3, sim:6, dom:18` |
| 4 | Motif ekleme (rozet / damla / geçme) | Katman sayısı artar | Geçti — 3→4 ve 2→3 |
| 5 | Kat sayısı 8 → 12 değişimi | `n:12`, sahnede 12 kopya | Geçti — `n:12, sim:12` (ilk denemede hata vardı, düzeltildi — aşağıya bakınız) |
| 6 | Palet değişimi (Selçuklu → Gece) | Belge paleti değişir | Geçti — `palet:"gece"` |
| 7 | Katmanı fareyle sürükleme | x/y değişir | Geçti — x 500→561, y 500→615 (radyal dönüş ters çözümlü) |
| 8 | Geri Al düğmesi | Katman sayısı 3→2, durum metni | Geçti — `geriAlSonrasi:2`, "Geri alındı." |
| 9 | Seçim çerçevesi | Seçili katmanın çevresinde | Geçti — çerçeve dönüşümü katmanla birlikte taşınıyor (ekran görüntüsü) |
| 10 | Mobil düzen (390×844) | Panel altta kullanılabilir kalır | Geçti — panel alttan açılır, düğmeler sarar (ekran görüntüsü) |

## Dosya çıktılarının doğrulanması

- **SVG:** `Geçme Kafes` örneğinde 33.700 karakter üretildi; `DOMParser` ile tekrar okunduğunda **parser hatası 0**, kök `svg`, ad alanı `http://www.w3.org/2000/svg`, `viewBox="0 0 1000 1000"`, **207 `path`** düğümü, arka plan `rect` dolgusu doğru. **Gömülü raster: 0** (`image`, `canvas`, `foreignObject` yok) — istenen "PNG'yi SVG'ye gömme" yasağına uyuluyor.
- **PNG:** `pngUret(1024)` → `image/png`, 86.732 bayt, 1024×1024 piksel. Tarayıcı tuvaline SVG vektöründen çizilerek üretiliyor; 2048 px seçeneği arayüzde aynı yoldan çalışıyor.
- **JSON:** Belge `surum`, `simetri`, `karo`, `katmanlar` alanlarıyla serileştiriliyor; içe alma `belgeDogrula()` ile tip/şema denetiminden geçiyor, geçersiz dosyada işlem yapılmıyor ve durum satırında hata bildiriliyor.

## Bulunan ve düzeltilen iki gerçek hata (denetçi kaydı)

1. **Segment düğmelerinde değer okuma hatası.** Kat sayısı/palet/ölçü düğmelerinde `data-deger` alt düğmede taşınıyor, kod ise kapsayıcıdan okuyordu; sonuç `n: NaN`, sahnede 1 kopya. Düzeltildi: değer ve renk artık tıklanan alt öğeden okunuyor. Test 5 bu düzeltmeden sonra geçti.
2. **Seçim çerçevesi yanlış konumda.** `getBBox()` yerel koordinat döndürdüğü için çerçeve sol üstte çiziliyordu. Düzeltildi: çerçeve, katmanın (ve radyal kopya dönüşünün) aynı `transform`'u içinde taşınıyor.

## Kapanış turunda eklenen testler (ikinci tur)

| # | Test | Ölçülen sonuç |
|---|------|----------------|
| 11 | "Katmanlar" sekmesi | Geçti — başlık `Katmanlar (3)`, 3 satır, en üst katman "Çevre damlaları" |
| 12 | Katman satırından seçim | Geçti — "İç rozet" seçildi, tuvalde 1 seçim çerçevesi oluştu |
| 13 | "Belge" sekmesi | Geçti — bölümler: Tuval, Belge işlemleri, Kısayollar, Not; 3 ölçü, 6 arka plan rengi |
| 14 | Ölçü değişimi (Kare → Dikey) | Geçti — `w:1000, h:1400`, `viewBox="0 0 1000 1400"`, üst bilgi "1000 × 1400" |
| 15 | Arka plan rengi `#0f2237` | Geçti — belge ve `bgRect` dolgusu güncellendi |

**Bu turda bulunan ve düzeltilen iki hata:**
3. **Harf kutusu beyaz şeridi.** Dikey/yatay tuvale geçildiğinde `viewBox` dışında kalan alanlar kırık beyaz şerit olarak görünüyordu (`svg` öğesinin CSS arka planı). Arka plan şeffaf yapıldı; kâğıt rengi `bgRect` dolgusundan geliyor. Düzeltme sonrası ölçüm: `svgArka: rgba(0,0,0,0)`, holder koyu.
4. **"Damla Bordür" örneği okunmuyordu.** 12 katlı dönüş, 6 yapraklı damla motifini üst üste bindirip kaotik bir leke üretiyordu. Örnek 6 katlı düzene alındı, boşluk ve çizgi değerleri seyreltildi. Yeni ölçüm: `n:6, sim:6, katman:3`; görüntüde altı belirgin taç yaprağı okunuyor.

## Üçüncü tur: "Katmanlar" sekmesinin ayrıntılı doğrulaması

Sayfaya erken bir `error` dinleyicisi kuruldu; tüm adımlar boyunca konsol hatası **0** (`hatalar: []`).

| # | Test | Ölçülen sonuç |
|---|------|----------------|
| 16 | "Katmanlar" sekmesi içeriği | Geçti — aktif sekme "Katmanlar", başlık `Katmanlar (3)`, 3 satır: Çevre damlaları / İç rozet / Yıldız gövdesi |
| 17 | Göster/gizle düğmesi | Geçti — katman `gorunur:false` oldu, sahnedeki çizilen katman 24→16 düştü (8 radyal kopya × 1 katman) |
| 18 | Sıralama düğmesi (▲) | Geçti — sıra `[Çevre damlaları, Yıldız gövdesi, İç rozet]` olarak değişti, liste anında yenilendi |

Bu üç testte panelin gerçekten katman modelini değiştirdiği görüldü: gizleme yalnız görünümü değil, sahneye çizilen düğüm sayısını etkiliyor.

## Eksik kalan / sınırlar (açıkça)

- **SVG'yi geri içe alma:** Uygulama proje dosyası olarak JSON içe alıyor; SVG dosyasını düzenlenebilir katmana geri çevirme **yok**. SVG çıktısı yeniden açıldığında görsel olarak aynı sonucu verir (aynı geometri, aynı `viewBox`), ancak katman parametrelerine ayrıştırılmaz.
- **Sürükleme testinin ölçümü:** Fare sürüklemesi ilk `.layer` düğümüne uygulandı (seçici 48 eşleşme buldu); değer değişimi doğrulandı, ancak "tam olarak sürüklenen katman" ayrımı bu testte ölçülmedi.
- **Klavye kısayolları** (`Ctrl+Z`, `Delete`, ok tuşları) kodda tanımlı; gerçek klavye basışıyla test edilmedi (yalnız düğme yolu doğrulandı).
- **Dokunmatik (gerçek telefon)** testi yapılmadı; mobil düzen yalnız 390×844 görünüm ölçüsünde doğrulandı.
- **Pasif sağ tık / bağlam menüsü** ve çoklu seçim yok — kapsam dışı bırakıldı.

## Yayın durumu

Uygulama **hiçbir yere yayınlanmadı**. Market veya Vitrin'e gönderim, kullanıcının açık onayı olmadan yapılmayacak.
