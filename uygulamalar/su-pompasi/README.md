# NUMEX ATLAS — Su Şebekesi, Basınç ve Kriz Simülatörü

Tek klasörde çalışan, Türkçe, etkileşimli su dağıtım şebekesi simülatörü.
**Eğitim ve planlama prototipidir.** Gerçek şehir altyapısını, fiziksel pompa veya vanaları kontrol etmez; hiçbir donanıma bağlanmaz. Tüm senaryolar kurgusaldır.

## Çalıştırma

`index.html`'i çift tıkla (ya da klasörde `python -m http.server 8123` çalıştırıp `http://127.0.0.1:8123` aç).
Harici bağımlılık, CDN, derleme adımı yoktur.

## Dosya sorumlulukları

| Dosya | Sorumluluk |
|---|---|
| `js/network.js` | Graf veri modeli: düğüm/hat, kimlik, JSON, silme. Matematik yok. |
| `js/hydraulics.js` | Hidrolik çözüm motoru (doğrusal sistem + basınca bağlı talep), müdahale araması |
| `js/validator.js` | Çözücüden bağımsız denetim: düğüm kütle dengesi, hat yasası, basınç tanımı, kapalı hat, NaN, depo dengesi (Sonuçlar sekmesinde gösterilir) |
| `js/scenarios.js` | Üç hazır kurgusal şebeke |
| `js/report.js` | CSV / SVG / yazdırılabilir mühendislik özeti |
| `js/tests.js` | 12 matematiksel kabul testi |
| `js/ui.js` | Editör, SVG harita, paneller, kriz laboratuvarı |

## Hidrolik model (açıkça belirtilmiş yaklaşım)

Her hat için **Q = g · (h_a − h_b + s)** [L/s] yazılır:

- Boru iletkenliği: **g = 0.005 · D_mm^2.5 / (L_m · k)**
- Vana: açıkken g = 200, kapalıyken g = 0
- Pompa: açıkken g = 150, s = basma yüksekliği (m); durunca g = 0

Düğümlerde kütle korunumu `ΣQ_çıkan − ΣQ_giren = −talep` olarak kurulur.
Rezervuarlar **sabit hidrolik yük** sınır koşuludur. Denklem sistemi düğüm
sayısına göre doğrusaldır; **Gauss eliminasyonu (kısmi pivotlama)** ile çözülür.
Çevrimli (halkalı) şebekeler ağaç dolaşımıyla değil, sistemin tamamı çözülerek
hesaplanır. Tekil matris tespit edilirse sonuç "belirsiz" olarak raporlanır.

Basınç: **p = h − z** (kot). Talep basınca bağlıdır:
`f = clamp(p / p_min, 0, 1)`, `talep_gerçek = talep · f`; sabit nokta yinelemesiyle
(gevşetmeli, en çok 80 adım) yakınsanır. Bu sayede "karşılanamayan talep" uydurulmadan
hesaplanır.

**Sınır:** Bu model Hazen–Williams gibi doğrusal olmayan bir boru yasasının yerini
tutmaz; gerçek su şebekesinin tam fiziksel karşılığı değildir. Yatırım/işletme kararı
için mühendislik yazılımı yerine geçmez.

## Özellikler

- **Editör:** depo, dağıtım düğümü, mahalle, boru, pompa, vana; sürükleme, iki düğüme
  tıklayarak bağlama, seçilen elemanın özelliklerini düzenleme.
- **Sonuçlar:** düğüm yükleri/basınçları, hat debileri ve yönleri, depo çıkışı,
  toplam tüketim, kütle dengesi hatası, kritik ve beslemesiz mahalle sayısı.
- **Kriz laboratuvarı:** A ana boru patladı, B pompa durdu, C tüketim zirvesi (+%60),
  D iki arıza; her olaydan sonra şebeke yeniden çözülür ve önce/sonra karşılaştırılır.
- **Müdahale Öner:** sınırlı sayıda vana/kapalı hat kombinasyonu dener, ölçülen sonucu
  iyileştiren adayı önerir. **Optimal olduğu iddia edilmez**; iyileşme yoksa bunu söyler.
- **Dışa aktarma:** JSON kaydet/yükle, CSV mahalle raporu, SVG çizim, yazdırılabilir özet.

## Kabul testleri

`js/tests.js` uygulamadan bağımsız küçük şebekeler kurar, analitik beklenen değerle
karşılaştırır. Arayüzde **Testler** sekmesinden çalıştırılır; tarayıcı konsolunda
`NumexTests.runAll()` ile de alınabilir. Kapsam: tek boru, paralel boru bölünmesi,
seri kütle korunumu, çevrimli şebeke, kapalı vana, alternatif hat, beslemesiz mahalle,
talep artışı, müdahale önerisi, JSON gidiş-dönüş, negatif basınç, CSV/SVG tutarlılığı.

## Bilinen sınırlar (gizlenmiyor)

- Doğrusal iletkenlik yaklaşımı; basınç düşümü debiyle doğru orantılı varsayılır.
- Pompa tek noktalı basma yüksekliği olarak modellenir; pompa eğrisi yoktur.
- Depo hacmi (kapasite) yalnızca bilgi alanıdır, zaman içinde boşalma simüle edilmez.
- Müdahale araması sezgiseldir ve sınırlı sayıda kombinasyon dener.

## Doğrulanmış davranışlar (tarayıcıda ölçüldü)

| Senaryo | Toplam talep | Karşılanan | Kritik | Kütle hatası | Doğrulayıcı |
|---|---|---|---|---|---|
| Küçük Kasaba | 85.0 L/s | 85.0 L/s | 0 | 0.000000 | 7/7 ✓ |
| Çift Beslemeli Şehir | 127.0 L/s | 127.0 L/s | 0 | 0.000000 | 7/7 ✓ |
| Kriz Sınavı | 152.0 L/s | 152.0 L/s | 0 | 0.000000 | 7/7 ✓ |

Çift Beslemeli Şehir'de depo paylaşımı: **Batı 110.26 L/s + Doğu 16.74 L/s = 127.00 L/s**.

## Sürüm notları (bu koşuda yapılanlar)

- `validator.js` eklendi: çözücüden bağımsız 7 denetim (düğüm kütle dengesi, hat yasası,
  basınç tanımı, kapalı hatta sıfır debi, NaN taraması, depo dengesi, beslemesiz düğümde
  yük uydurulmadığı) ve Sonuçlar sekmesinde gösterimi.
- **Çift Beslemeli Şehir düzeltmesi:** Doğu Deposu hidrolik yükü 66 m iken şebeke basıncı
  daha yüksek olduğu için depo beslemek yerine besleniyordu (çıkış −52.99 L/s). Yük 80 m'ye
  çıkarıldı; artık iki depo da şebekeye su veriyor.
- Test paneli tablo yerine **kart düzenine** geçirildi (dar panelde beklenen/ölçülen
  kolonları kesiliyordu).
- Pompa durduğunda (Olay B) beslemesiz kalan şebekeyi kurtarabilmek için senaryo 1 ve 3'e
  **kapalı yedek gravite vanası** eklendi; "Müdahale Öner" bu vanayı bulup açıyor.

## Açık kalanlar

- Pompa eğrisi, depo boşalma simülasyonu ve doğrusal olmayan boru yasası kapsam dışı.
- Müdahale araması en çok 4 eylemlik alt kümeleri dener; büyük şebekelerde tam arama yok.

Ayrıntılı dosya haritası: `.numex/PROJECT_MAP.md`

---

[![StackBlitz'te aç](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/numexai/numex-market/tree/main/uygulamalar/su-pompasi) [![CodeSandbox'ta aç](https://codesandbox.io/static/img/play-codesandbox.svg)](https://codesandbox.io/s/github/numexai/numex-market/tree/main/uygulamalar/su-pompasi)

**Kategori:** Diğer · Numex AI tarafından otonom üretildi ve test edildi.

- ▶️ [Canlı demo](https://dene.numexai.com.tr/su-pompasi/)
- ⚡ Tarayıcıda aç ve düzenle: [StackBlitz](https://stackblitz.com/github/numexai/numex-market/tree/main/uygulamalar/su-pompasi) · [CodeSandbox](https://codesandbox.io/s/github/numexai/numex-market/tree/main/uygulamalar/su-pompasi) — kurulum yok
- 🛍️ [Numex Market'te gör](https://market.numexai.com.tr) · 🏗️ [Numex Forge](https://forge.numexai.com.tr/explore/repos)
- 💬 [Numex AI ile kendi uygulamanı yap](https://numexai.com.tr) — Türkçe yapay zekâ asistanı

**Etiketler:** `web sitesi şablonu` · `tanıtım sayfası` · `landing page` · `template` · `açık kaynak` · `türkçe` · `yapay zeka ile yapıldı` · `open source` · `javascript` · `ai generated` · `numex ai`

MIT lisanslıdır — bkz. [../LICENSE](../LICENSE). Beğendiysen [depoya ⭐ ver](https://github.com/numexai/numex-market).
