# NUMEX AFET — Akıllı Acil Durum ve Tahliye Simülatörü

Kurgusal bir şehirde afet senaryosu ve tahliye planlaması yapan, **tamamen yerel** çalışan statik web uygulaması.
Sunucu, veritabanı, API anahtarı veya hesap gerekmez.

---

## Hızlı Başlangıç

`index.html` dosyasını çift tıkla — tarayıcıda açılır ve çalışır.

> **Not:** Uygulama ES modülleri (`<script type="module">`) kullanır. Bazı tarayıcılar `file://`
> üzerinden modül yüklemeyi engeller. O durumda klasörde yerel bir sunucu başlat:
>
> ```
> python -m http.server 8412
> # → http://localhost:8412
> ```

Kabul testleri: `test/test.html` (aynı adresten: `http://localhost:8412/test/test.html`)
Node üzerinde mantık testleri: `node test/calistir.js`

---

## Ne Yapar

| Alan | Açıklama |
|---|---|
| **Şehir ağı** | 36 kavşak, 60 yol (biri darboğaz köprü), 6 yerleşim bölgesi, 4 toplanma alanı, 2 hastane, 3 yardım aracı |
| **Rota motoru** | Dijkstra; `süre` / `uzunluk` / `kapasite` ağırlığı seçilebilir. Kapalı yollar **asla** kullanılmaz |
| **Tahliye** | Bölge nüfusu, en kısa süreli alandan başlanarak kapasite sığdıkça **birden fazla alana** dağıtılır |
| **Ulaşılamazlık** | Erişilebilir alan yoksa bölge `ERİŞİLEMEZ` işaretlenir, atama yapılmaz, uydurma rota üretilmez |
| **Senaryolar** | A Normal · B Köprü Kapandı · C Toplanma Alanı Doldu · D Çoklu Yol Kapanması |
| **Ekipler** | 3 araca en yakın erişilebilir hedef atanır; kapalı yoldan geçmez; hareket animasyonla gösterilir |
| **KPI** | Toplam nüfus, yerleştirilen, yerleştirilemeyen, kullanılan alan, kapalı yol, ort. rota süresi, yeniden planlama sayısı |
| **Dışa aktarma** | JSON proje kaydet/yükle · CSV tahliye planı · SVG harita · metin operasyon raporu |

### Etkileşim

- **Düğüm sürükle** → kavşak konumu değişir, harita yeniden çizilir
- **Yola tıkla** → sağ panelde detay + "Yolu Kapat / Aç" düğmesi
- **Senaryo seç** → kapalı yollar/kapasiteler uygulanır, yeniden planlanır
- **Nüfus / kapasite alanları** → değişince otomatik yeniden planlama
- **Hız** 0.5x / 1x / 2x / 4x · **Başlat/Durdur** araç animasyonunu yönetir

Haritadaki turkuaz çizgiler **algoritmanın gerçekten hesapladığı** rotalardır; ayrı bir çizim katmanı değildir.

---

## Mimari

```
index.html
css/stil.css
js/veri.js        kurgusal şehir verisi + senaryo tanımları
js/graf.js        komşuluk, yol kapat/aç
js/motor.js       Dijkstra (ağırlıklı), rota maliyeti
js/tahliye.js     kapasite dağıtımı, çoklu alan, ulaşılamazlık, nüfus korunumu
js/ekipler.js     görev atama, animasyon konumu
js/senaryolar.js  A/B/C/D uygulayıcıları
js/harita.js      SVG çizim, sürükleme, seçim, akış animasyonu
js/panel.js       KPI + kontrol paneli + tablolar
js/disaaktar.js   JSON / CSV / SVG / rapor
js/uygulama.js    merkezi state, orkestrasyon, simülasyon döngüsü
test/test.js      12 kabul testi (43 doğrulama)
test/test.html    tarayıcı test koşucusu
```

**Render = f(state):** Her planlamadan sonra harita state'ten yeniden çizilir; ekran ile hesap ayrışmaz.
**Deterministik:** `Math.random` yok, sabit sıralama → aynı girdi aynı çıktı.

---

## Kabul Testleri (12 madde → 43 doğrulama)

| # | Test | Durum |
|---|---|---|
| 1 | Kapalı yol rotaya alınmıyor | ✅ |
| 2 | En kısa yol beklenen sonucu veriyor | ✅ |
| 3 | Toplanma alanı kapasitesi aşılmıyor | ✅ |
| 4 | Bölge gerektiğinde iki alana dağıtılıyor | ✅ |
| 5 | Erişilemeyen bölge güvenli gösterilmiyor | ✅ |
| 6 | Köprü kapanınca rota değişiyor | ✅ |
| 7 | Alternatif yoksa sistem açıkça uyarıyor | ✅ |
| 8 | Nüfus korunumu: yerleşen + yerleşemeyen = toplam (A/B/C/D) | ✅ |
| 9 | Yardım aracı kapalı yola girmiyor | ✅ |
| 10 | Aynı veri aynı sonucu üretiyor | ✅ |
| 11 | JSON kaydet/yükle sonrası ağ değişmiyor | ✅ |
| 12 | Gerçek tarayıcıda yol kapatıp yeniden planlama | ✅ (iframe ile canlı uygulamada ölçülür) |

Son ölçüm: **43/43 başarılı (%100)** — `test/test.html` üzerinden gerçek tarayıcıda, uygulama iframe içinde yüklenerek doğrulandı.

---

## SINIR BİLDİRİMİ

Bu uygulama **kurgusal veriyle çalışan bir simülasyon laboratuvarıdır**.

- Gerçek afet güvenliği, bina tahliyesi veya resmî acil durum yönetimi için **uygun değildir**.
- Gerçek nüfus, gerçek harita veya gerçek trafik verisi kullanmaz.
- Gerçek acil müdahale süreleri hakkında **güvenlik garantisi vermez**.
- Yol uzunluğu (m) ve geçiş süresi (dk) değerleri kurgusal model parametreleridir.

Numex Market'e yayın, kullanıcı onayı olmadan yapılmaz.

---

[![StackBlitz'te aç](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/numexai/numex-market/tree/main/uygulamalar/numex-tahliye-simulatoru) [![CodeSandbox'ta aç](https://codesandbox.io/static/img/play-codesandbox.svg)](https://codesandbox.io/s/github/numexai/numex-market/tree/main/uygulamalar/numex-tahliye-simulatoru)

**Kategori:** Diğer · Numex AI tarafından otonom üretildi ve test edildi.

- ▶️ [Canlı demo](https://dene.numexai.com.tr/numex-tahliye-simulatoru/)
- ⚡ Tarayıcıda aç ve düzenle: [StackBlitz](https://stackblitz.com/github/numexai/numex-market/tree/main/uygulamalar/numex-tahliye-simulatoru) · [CodeSandbox](https://codesandbox.io/s/github/numexai/numex-market/tree/main/uygulamalar/numex-tahliye-simulatoru) — kurulum yok
- 🛍️ [Numex Market'te gör](https://market.numexai.com.tr) · 🏗️ [Numex Forge](https://forge.numexai.com.tr/explore/repos)
- 💬 [Numex AI ile kendi uygulamanı yap](https://numexai.com.tr) — Türkçe yapay zekâ asistanı

**Etiketler:** `web sitesi şablonu` · `tanıtım sayfası` · `landing page` · `template` · `açık kaynak` · `türkçe` · `yapay zeka ile yapıldı` · `open source` · `javascript` · `ai generated` · `numex ai`

MIT lisanslıdır — bkz. [../LICENSE](../LICENSE). Beğendiysen [depoya ⭐ ver](https://github.com/numexai/numex-market).
