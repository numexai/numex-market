# Numex — Abonelik, Fatura ve Düzenli Ödeme Dedektifi

"Neye ne kadar ödüyorum?" sorusunu tek ekranda cevaplayan, **tamamen yerel** çalışan Türkçe kişisel gider farkındalık uygulaması.

Hesap yok, sunucu yok, banka/kredi kartı bilgisi yok. Tüm veriler tarayıcınızın `localStorage`'ında tutulur.

---

## Hızlı Başlangıç

`index.html` dosyasını çift tıklayın. Hepsi bu.

> **Not:** Dosya `file://` ile açıldığında ES modülleri bazı tarayıcılarda engellenebilir.
> O durumda klasörde küçük bir sunucu çalıştırın:
> ```
> python -m http.server 8137
> # → http://localhost:8137
> ```

İlk açılışta **32 kurgusal demo kayıt** otomatik yüklenir. `Tümünü sil` ile temizleyip kendi kayıtlarınızı girebilirsiniz.

---

## Özellikler

| Bölüm | Ne yapar |
|---|---|
| **Panel** | 6 canlı özet kartı (aylık yük, 30 gün, yıllık tahmin, aktif abonelik sayısı, kullanılmayan maliyet, geçen aya göre değişim), kategori donut grafiği, 12 aylık nakit akışı, 7/30 günlük yaklaşan ödemeler, gecikmiş kalemler, mini takvim |
| **Takvim** | Aylık ızgara, ay gezinme, gün detayı, ödendi işareti, önümüzdeki 30 gün |
| **Abonelikler** | Tablo + mobil kart görünümü, arama (Ctrl+K), kategori/durum/para birimi/zorunlu filtreleri, 4 sıralama |
| **Analiz** | 5 yorgunluk kuralı + kullanıcı tanımlı kurlar |
| **Senaryo** | Her abonelik için "koru / iptal / ucuz paket" simülasyonu |
| **Araçlar** | JSON dışa/içe aktarma, CSV raporu, demo yükleme, temizleme |

---

## Hesaplama Kuralları

### Aylık / yıllık karşılık
| Sıklık | Aylık karşılığı | Yıllık karşılığı |
|---|---|---|
| Haftalık | `tutar × 52 / 12` | `tutar × 52` |
| Aylık | `tutar` | `tutar × 12` |
| 3 aylık | `tutar / 3` | `tutar × 4` |
| Yıllık | `tutar / 12` | `tutar` |

### Kısa ay güvenliği (`ayEkleGuvenli`)
31 Ocak'ta başlayan aylık ödeme Şubat'ta **28 (artık yılda 29)** Şubat'a yerleşir; Mart'ta tekrar 31'e döner. Orijinal gün numarası saklanır, `Date` nesnesinin taşmasına güvenilmez.

### Seri üretimi (`seriUret`)
Tüm tekrarlayan tarihler `sonOdemeTarihi` çapasından **her seferinde yeniden hesaplanır** — kayıt şişmez, iptal/senaryo değişiminde takvim anında güncellenir. Yıllık bir ödeme yalnızca **gerçek ödeme ayında** nakit akışına girer.

### Para birimleri
Farklı para birimleri **asla** otomatik toplanmaz. Tüm toplamlar `{TRY: …, USD: …}` sözlüğüdür. Kurlar yalnızca sizin girdiğiniz değerlerden gelir (sistem kur bilgisi çekmez); tanımsız kur "çevrilemedi" olarak işaretlenir.

### İptal ve senaryo
- `durum: 'iptal'` → gerçek iptal; gelecek ödemelerden tamamen çıkar.
- `senaryo: 'iptal'` / `'ucuz_paket'` → **yalnız simülasyon**; gerçek kayıt bozulmaz, toplamlar sanal olarak yeniden hesaplanır. `ucuz_paket` %40 düşüş varsayar.

---

## Yorgunluk Analizi — Hüküm Vermez

Sistem **hiçbir hizmeti "gereksiz" ilan etmez**. Yalnızca veriyi ve gerekçeyi gösterir; kararı kullanıcı verir.

| Kural | Ölçüt |
|---|---|
| Kullanılmayan | Son kullanım ≥ 30 gün önce |
| Yaklaşan yenileme | Yıllık ödeme, 30 gün içinde |
| Kategori yığını | Aynı kategoride ≥ 2 aktif hizmet |
| Yüksek yıllık | Yıllık maliyet ≥ ₺3.000 |
| Küçük birikim | Aylık < ₺60 **ve** toplam içindeki payı ≥ %3 |

Eşikler `state.esikler` içinde tanımlıdır.

---

## Kabul Testleri — Gerçek Sonuçlar

Tarayıcı konsolunda ölçüldü (Chrome, 2026-11-20):

| # | Test | Sonuç |
|---|---|---|
| 1 | Aylık 100 TL → yıllık 1.200 TL | ✅ `1200` |
| 2 | Yıllık 1.200 TL yalnız ödeme ayında | ✅ 1 kayıt, `2026-06-15` |
| 3 | Haftalık gerçek takvim | ✅ 5 ödeme, 7'şer gün arayla |
| 4 | 31 Ocak → Şubat | ✅ `2026-02-28` |
| 5 | İptal ileri giderlerden çıkar | ✅ seri uzunluğu `0` |
| 6 | Senaryo toplamları değiştirir | ✅ 300 → 100, tasarruf 200 |
| 7 | Ödendi işareti kaydı günceller | ✅ localStorage'da 1 kayıt, DOM'da işaretli |
| 8 | Para birimleri karışmaz | ✅ `{TRY: 100, USD: 10}` |
| 9 | JSON kaydet/yükle bütünlüğü | ✅ 32/32 kayıt korundu |
| 10 | CSV ekranla tutarlı | ✅ 33 satır (1 başlık + 32), UTF-8 BOM |
| 11 | Boş listede hata yok | ✅ `aylik: {}`, `aktif: 0`, render çökmedi |
| 12 | Mobil 390px kullanılabilir | ✅ yatay taşma yok, form ile kayıt eklendi |

---

## Dosya Yapısı

```
index.html              Tek sayfa iskelet
css/tema.css            Renk değişkenleri, açık/koyu tema
css/duzen.css           Grid yerleşim, 390px kırılımı
css/bilesenler.css      Kart, tablo, takvim, modal, grafik stilleri
js/tarih.js             Takvim matematiği (saf)
js/hesaplayici.js       Aylık/yıllık, özet, para birimi ayrımı
js/yorgunluk.js         5 analiz kuralı
js/senaryo.js           Tasarruf simülasyonu
js/takvim.js            Ödeme takvimi, aylık ızgara
js/grafik.js            SVG donut + bar (harici kütüphane yok)
js/gorunum.js           DOM render katmanı
js/form.js              Abonelik formu + doğrulama
js/ice_disa.js          JSON / CSV dışa-içe aktarma
js/state.js             Merkezi state + localStorage
js/demo.js              32 kurgusal kayıt
js/app.js               Giriş noktası, olay delegasyonu
veri/demo.json          Demo verinin sabit kopyası
```

Bağımlılık yok, derleme adımı yok.

---

## Gizlilik

- Veri yalnız `localStorage` anahtarı `numex_dedektif_v1` altında tutulur.
- Hiçbir ağ isteği yapılmaz; JSON/CSV yalnızca sizin tıkladığınızda dosya olarak indirilir.
- Bozuk şema durumunda eski veri `numex_dedektif_v1_yedek` anahtarına alınır, sessizce silinmez.

---

Numex AI üretimi · Türkçe · açık kaynak

---

[![StackBlitz'te aç](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/numexai/numex-market/tree/main/uygulamalar/numex-abonelik-fatura-ve-duzenli-odeme-dedektifi) [![CodeSandbox'ta aç](https://codesandbox.io/static/img/play-codesandbox.svg)](https://codesandbox.io/s/github/numexai/numex-market/tree/main/uygulamalar/numex-abonelik-fatura-ve-duzenli-odeme-dedektifi)

**Kategori:** Diğer · Numex AI tarafından otonom üretildi ve test edildi.

- ▶️ [Canlı demo](https://dene.numexai.com.tr/numex-abonelik-fatura-ve-duzenli-odeme-dedektifi/)
- ⚡ Tarayıcıda aç ve düzenle: [StackBlitz](https://stackblitz.com/github/numexai/numex-market/tree/main/uygulamalar/numex-abonelik-fatura-ve-duzenli-odeme-dedektifi) · [CodeSandbox](https://codesandbox.io/s/github/numexai/numex-market/tree/main/uygulamalar/numex-abonelik-fatura-ve-duzenli-odeme-dedektifi) — kurulum yok
- 🛍️ [Numex Market'te gör](https://market.numexai.com.tr) · 🏗️ [Numex Forge](https://forge.numexai.com.tr/explore/repos)
- 💬 [Numex AI ile kendi uygulamanı yap](https://numexai.com.tr) — Türkçe yapay zekâ asistanı

**Etiketler:** `web sitesi şablonu` · `tanıtım sayfası` · `landing page` · `template` · `açık kaynak` · `türkçe` · `yapay zeka ile yapıldı` · `open source` · `javascript` · `ai generated` · `numex ai`

MIT lisanslıdır — bkz. [../LICENSE](../LICENSE). Beğendiysen [depoya ⭐ ver](https://github.com/numexai/numex-market).
