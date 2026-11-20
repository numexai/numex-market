# NUMEX ÇİZGİ — Akıllı Kesim ve Fire Optimizasyonu

Levha (stok) ve parça listesinden **gerçek, deterministik bir 2B yerleşim** üreten
tarayıcı uygulaması. Kutucuk süsü değil: üç ayrı yerleştirme algoritması, bağımsız
doğrulayıcı, kerf (kesim payı) geometrisi ve fire muhasebesi içerir.

Sürüm: **1.0.0** · Türkçe · tek klasör · derleme adımı yok · harici bağımlılık yok.

## Çalıştırma

- **En kolay:** `index.html` dosyasına çift tıkla (script'ler klasik `<script>`, ES modülü değil — `file://` üzerinde de çalışır).
- **Sunucuyla:** klasörde `python -m http.server 8123` → <http://127.0.0.1:8123>

## Dosya haritası

| Dosya | İş |
|---|---|
| `index.html` | Arayüz iskeleti (form, sekmeler, paneller) |
| `assets/style.css` | Tema, ekran uyumu, yazdırma stilleri |
| `js/core.js` | **Motor.** DOM'suz, saf: normalizasyon, üç strateji, doğrulayıcı, istatistik, senaryolar, SVG üretici |
| `js/tests.js` | 8 kabul testi (arayüzden bağımsız çalışır) |
| `js/ui.js` | Görüntüleme, giriş, dışa aktarma (hesaplama yapmaz) |

## Geometri kuralları

- **Koordinat:** levhanın sol-üst köşesi (0,0), tüm değerler mm.
- **Kenar boşluğu (margin):** dört kenardan düşülür → kullanılabilir alan `[m, W−m] × [m, H−m]`.
- **Kerf (kesim payı):** her parça yerleşimde `(w+kerf) × (h+kerf)` büyüklüğünde bir **ayak izi** kaplar. Böylece iki parça arasında her zaman en az kerf kadar malzeme kalır; parçanın kendi çizimi `w × h` olarak ayrı tutulur. Kerf gerçekten sonucu değiştirir: 1000×1000 levhada 4 × 500×500 parça kerf 0'da **1 levhaya**, kerf 5'te **4 levhaya** sığar (505+505 = 1010 > 1000).

## Stratejiler (aynı veri üzerinde yarışır)

| Strateji | Mantık |
|---|---|
| **First Fit Decreasing (raf)** | Yükseklikçe azalan sıra; levhada yatay raflar; parça açık rafa sığmazsa yeni raf, sonra sıradaki levha (ilk uyan). |
| **MaxRects — BSSF** | Serbest dikdörtgen listesi; artan kenarı en kısa konuma yerleştirir; artığı dört yönden bölerek delikleri değerlendirir. |
| **Guillotine — BAF** | Serbest alanı tek düz kesimle ikiye böler (düz testerede gerçekten kesilebilir plan), artan alanı en küçük bölgeyi seçer. |

`Otomatik` mod üçünü de koşar; **en az yerleşmeyen → en az levha → en düşük fire** sırasıyla en iyisini seçer. Karşılaştırma sekmesi üçünü yan yana gösterir.

## Fire muhasebesi

```
kullanılan levha alanı = kullanılan levha sayısı × (W × H)
parça alanı            = Σ (w × h)
ayak izi alanı         = Σ (w+kerf)(h+kerf)
kesim payı kaybı       = ayak izi alanı − parça alanı
artık alan             = kullanılan levha alanı − ayak izi alanı   (kenar boşlukları + boş köşeler)
FİRE                   = kullanılan levha alanı − parça alanı
fire %                 = FİRE / kullanılan levha alanı × 100
maliyet                = kullanılan levha sayısı × levha maliyeti
```

Yalnızca **fiilen kullanılan** levhalar maliyete girer; stokta kalan levhalar maliyete eklenmez, ayrıca bilgi olarak gösterilir. Kenara dayanan parçada sağındaki/altındaki kerf payı fiilen kesim payı değildir; muhafazakâr kural gereği firede kalır (bunu gizlemiyoruz).

## Yerleşmeyen parçalar

Sonuç asla yuvarlanmaz. Parça listesi gerekçesiyle raporlanır:

- `levhaya sığmıyor` — kerf ve kenar boşluğu dahil hiçbir yönde sığmıyor
- `stok bitti` — parça sığardı ama stok adedi tükendi
- `malzeme uyuşmuyor` — parçanın malzemesi levhanınkinden farklı
- `ölçü geçersiz` — genişlik veya yükseklik ≤ 0

## Bağımsız doğrulayıcı

Motor kendini denetler (`S.verify`): her parçanın levha + kenar boşluğu sınırında olduğunu, izinsiz döndürme yapılmadığını ve **kerf dahil ayak izlerinin çakışmadığını** sıfırdan kontrol eder. Ayak izi çakışmıyorsa hem bindirme yoktur hem de arada en az kerf kadar malzeme vardır. Hata bulunursa arayüzde kırmızı uyarı çıkar.

## Kabul testleri (`Kabul testleri` sekmesi)

8/8 geçiyor — bu ölçüm tarayıcıda çalıştırılarak alındı:

| # | Test | Sonuç |
|---|---|---|
| 1 | Çakışma/taşma/izinsiz dönme (3 senaryo × 3 strateji, 105 yerleşim) | 0 ihlal |
| 2 | Kerf 0 → 5 yeniden hesaplanıyor mu | 1 levha → 4 levha |
| 3 | Döndürme kapalıyken yön kısıtı | 300×900 sığmadı; açıkken 900×300 yerleşti |
| 4 | Stok yetersizliği listeleniyor mu | 1 yerleşti, 2 "stok bitti" |
| 5 | 1001×500 → 1000×1000 | reddedildi (kerf 5'te tam 1000×500 bile sığmıyor) |
| 6 | Stratejiler gerçekten farklı mı | FFD 2 levha, MaxRects 1 levha |
| 7 | JSON gidiş-dönüş | parmak izi birebir aynı |
| 8 | SVG koordinatları sonuçla örtüşüyor mu | 12 dikdörtgen, 0 uyuşmazlık |

Konsoldan da koşulabilir: `CIZGI.runTests()`.

## Dışa aktarma

- **SVG** — tüm levhalar alt alta, başlıklı; ölçekli, yazdırmaya uygun
- **JSON** — `{format:"numex-cizgi", version, strategy, stock, parts}` (yükle → aynı plan)
- **CSV** — kesim listesi (`;` ayraçlı, UTF-8 BOM'lu; Excel'de Türkçe karakterler bozulmaz)
- **Yazdır** — tarayıcı yazdırma görünümü (tüm levhalar + yerleşmeyenler)

## Determinizm

Rastgelelik yok. Parçalar toplam bir sıralamayla dizilir (eşitlikte parça kimliği).
Aynı girdi + aynı strateji → aynı yerleşim. Bu yüzden JSON kaydedip geri yüklediğinde
plan birebir aynı çıkar (test 7).

## Bilinen sınırlar (dürüst liste)

- **Sezgisel (heuristik) çözücü** — optimal yerleşim garantisi yoktur; NP-zor bir problemdir. MaxRects/Guillotine iyi sonuç verir, "en iyi" değil.
- **Damar yönü (grain) ve desen yönü** kısıtı yok: döndürme ikili bir anahtar.
- **Tek stok tipi** — aynı anda farklı levha ölçüsü/malzemesi karıştırılmaz (parça malzemesi levhayla uyuşmazsa listelenir).
- **Kesim sırası / takım yolu (nesting sırası)** üretilmez; Guillotine planı düz kesimlere uygundur ama makine sırası vermez.
- **CNC/lazer çıktısı yok** — G-code, DXF veya makine komutu üretmez. Bu bir üretim prototipidir; sahada kesimden önce operatör onayı gerekir.
- Çok büyük girdilerde (binlerce parça) arayüz yavaşlayabilir; motor tek iş parçacığında çalışır.

## Arayüz ipuçları

- Parça tablosunda **çift tık** → satırı kopyalar. `✕` → siler.
- Toplu ekle: her satır `Ad;Genişlik;Yükseklik;Adet;Döndür(0/1)`.
- Plan üzerinde parçaya **tıkla** → sağdaki ayrıntı paneli (ham ölçü, döndürme, konum, alan).
- `Kesim payını göster` → parçaların ayak izini kırmızı bant olarak çizer.
- Yerleşim otomatik kaydedilir (`localStorage`); sayfayı kapatıp açsan da iş durur.
- Değişiklikler 180 ms sonra kendiliğinden yeniden hesaplanır; `Optimize Et` hemen çalıştırır.

---

[![StackBlitz'te aç](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/numexai/numex-market/tree/main/uygulamalar/testdusunce) [![CodeSandbox'ta aç](https://codesandbox.io/static/img/play-codesandbox.svg)](https://codesandbox.io/s/github/numexai/numex-market/tree/main/uygulamalar/testdusunce)

**Kategori:** Diğer · Numex AI tarafından otonom üretildi ve test edildi.

- ▶️ [Canlı demo](https://dene.numexai.com.tr/testdusunce/)
- ⚡ Tarayıcıda aç ve düzenle: [StackBlitz](https://stackblitz.com/github/numexai/numex-market/tree/main/uygulamalar/testdusunce) · [CodeSandbox](https://codesandbox.io/s/github/numexai/numex-market/tree/main/uygulamalar/testdusunce) — kurulum yok
- 🛍️ [Numex Market'te gör](https://market.numexai.com.tr) · 🏗️ [Numex Forge](https://forge.numexai.com.tr/explore/repos)
- 💬 [Numex AI ile kendi uygulamanı yap](https://numexai.com.tr) — Türkçe yapay zekâ asistanı

**Etiketler:** `web sitesi şablonu` · `tanıtım sayfası` · `landing page` · `template` · `açık kaynak` · `türkçe` · `yapay zeka ile yapıldı` · `open source` · `javascript` · `ai generated` · `numex ai`

MIT lisanslıdır — bkz. [../LICENSE](../LICENSE). Beğendiysen [depoya ⭐ ver](https://github.com/numexai/numex-market).
