# Numex Contraption Lab — Çılgın Makineler Atölyesi

Tarayıcıda çalışan, gerçek zamanlı fizik simülasyonuna dayalı Rube Goldberg makine atölyesi.
Açmak için `index.html`'i çift tıkla (sunucu gerekmez) ya da herhangi bir statik sunucudan yayınla.

## Dosyalar
| Dosya | İş |
|---|---|
| `index.html` | Arayüz iskeleti (atölye, palet, panel, kontroller) |
| `css/style.css` | Görsel tasarım, mobil dokunmatik düzen |
| `js/physics.js` | **Fizik katmanı** — parça fabrikaları, sabit 60 Hz simülasyon, serileştirme |
| `js/renderer.js` | **Render katmanı** — fiziği yalnızca OKUR, canvas 2D çizer |
| `js/levels.js` | 3 bölüm + 3 hazır makine (saf veri) |
| `js/ui.js` | Sürükle-bırak, taşı/döndür/çoğalt/sil, kaydet-yükle, bölüm kuralları |
| `vendor/matter.min.js` | matter.js 0.20.0 — **MIT lisansı** |

## Fizik motoru ve lisans
- **matter.js 0.20.0**, MIT lisansı (https://github.com/liabru/matter-js). Yerel olarak paketlendi, CDN'e bağımlılık yok.
- Kullanılan bileşenler: `Engine`, `Bodies`, `Body`, `Composite`, `Constraint`, `Events`, `Query`, `Vector`.
- Fizik sabit adımla ilerler (`1000/60` ms, kare başına en çok 5 alt adım); render bu adımdan bağımsızdır.
  Yavaş çekim (0.32×) yalnızca biriktiriciyi ölçekler, adım boyu değişmez.

## Gerçek fizik nerede?
Hiçbir hareket hazır animasyon değildir:
- **Bilye** rampadan yerçekimi + sürtünme ile yuvarlanır (görsel iz değil, gövde açısı ve hızı fizikten gelir).
- **Domino** devrildiğinde komşusuna çarpışma çözücüsü üzerinden momentum aktarır.
- **Yay**, iki noktadan bağlı gerçek bir `Constraint` yayıdır: sıkışık başlar, bırakılınca itici plakayı hızlandırıp topu fırlatır.
- **Kaldıraç** merkezden dünya mafsalına bağlıdır; uçlarına gelen kuvvetle gerçek tork üretir.
- **Dişli** sabit açısal hızlı bir motordur (merkez mafsal); komşu gövdelere etkisi sürtünme/çarpışma ile geçer.
- **Makara + ip**, 15 px aralıklı bağlantı zinciri (constraint) ve statik tekerlekten oluşur; ip tekerleğe sürtünerek akar.
- **Hareketli platform** kinematik salınım yapar; üstündeki cismi iterek taşır.
- **Başlat kapısı** simülasyon başlayınca çarpışma maskesini kapatır (tetik); **tetik düğmesi** bir cisim üstüne binince tüm kapıları açar.

## Oynanış
- Paletden parçayı sahneye **sürükle-bırak** (dokunmatikte dokun → sahne ortasına eklenir).
- Parçayı sürükleyerek **taşı**, `⟳`/`R` ile **döndür**, `⧉`/`Ctrl+D` ile **çoğalt**, `Del` ile **sil**.
- **Başlat / Durdur / Sıfırla / Yavaş çekim (0.32×)**. Boşluk tuşu başlat-durdur.
- Başarı: zil çaldığında kural denetlenir (bölüme göre parça/domino/label şartı).
  Başarısızlık: tüm parçalar 1.6 s hareketsiz kaldıysa "Makine durdu" kararı verilir.
- **Kaydet / Yükle** (localStorage) ve **JSON İndir / JSON Yükle** (paylaşım).

## Bölümler
1. **Bilyeyi Hedefe Ulaştır** — rampa + bilye hazır, zile ulaştır.
2. **Domino Zinciriyle Zili Çal** — en az 4 domino devrilmeli + zil çalmalı.
3. **Beş Parçalı Makine** — en az 5 parçayla zil çaldırılmalı.

## Bilinen eksikler (dürüst durum)
- Domino taşları, yuvarlanan bilyenin yatay itişiyle **devrilmiyor**: bilye ilk taşa yaslanıp duruyor.
  Bu yüzden **Bölüm 2** ve domino zinciri örnekleri şu an çözülemiyor. Kütle/sürtünme ayarları denendi, yeterli olmadı.
- Makara ipi ince bir constraint zinciri; çok hızlı çarpışmalarda esneyip uzayabilir.
- Hazır makinelerde "Parça" sayacı kullanıcı parçalarını sayar (hazır yüklemede 0 görünür).

## Test (gerçek tarayıcı, 1440×900)
| Ölçüm | Sonuç |
|---|---|
| Sayfa açılışı / JS hatası | 3 modül yüklendi, hata yok |
| Bilye rampadan inişi | (700,500) → 1.2 s'de (763.8, 519.7), açı 2.98 rad, hız 1.51 |
| Çarpışma sayacı | Çalışıyor (4-8 çarpışma kaydı) |
| Bölüm 1 bilye hareketi | x 277 → 451 (2 s), rampa gerçek |
| Zil + kazanma | Zil vuruldu → "Bölüm tamamlandı!" |
| Başarısızlık tespiti | "Makine durdu — hedefe ulaşmadı" |
| Kaydet/yükle (serialize) | 4 parça → JSON 140 B → geri yükleme tutarlı |
| Bölüm/örnek yükleme | 3 bölüm + 3 örnek yüklendi |
| Örnek "Yay Fırlatıcı" | Zil çaldı (8 çarpışma) — çalışıyor |
| Örnek "Uzun Zincir" | Domino devrilmiyor (yukarıdaki eksik) |

---

[![StackBlitz'te aç](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/numexai/numex-market/tree/main/uygulamalar/mutluluk) [![CodeSandbox'ta aç](https://codesandbox.io/static/img/play-codesandbox.svg)](https://codesandbox.io/s/github/numexai/numex-market/tree/main/uygulamalar/mutluluk)

**Kategori:** Diğer · Numex AI tarafından otonom üretildi ve test edildi.

- ▶️ [Canlı demo](https://dene.numexai.com.tr/mutluluk/)
- ⚡ Tarayıcıda aç ve düzenle: [StackBlitz](https://stackblitz.com/github/numexai/numex-market/tree/main/uygulamalar/mutluluk) · [CodeSandbox](https://codesandbox.io/s/github/numexai/numex-market/tree/main/uygulamalar/mutluluk) — kurulum yok
- 🛍️ [Numex Market'te gör](https://market.numexai.com.tr) · 🏗️ [Numex Forge](https://forge.numexai.com.tr/explore/repos)
- 💬 [Numex AI ile kendi uygulamanı yap](https://numexai.com.tr) — Türkçe yapay zekâ asistanı

**Etiketler:** `web sitesi şablonu` · `tanıtım sayfası` · `landing page` · `template` · `açık kaynak` · `türkçe` · `yapay zeka ile yapıldı` · `open source` · `javascript` · `ai generated` · `numex ai`

MIT lisanslıdır — bkz. [../LICENSE](../LICENSE). Beğendiysen [depoya ⭐ ver](https://github.com/numexai/numex-market).
