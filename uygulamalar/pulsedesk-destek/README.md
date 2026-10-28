# PulseDesk — Mini Destek Operasyon Merkezi

Saf HTML + CSS + JavaScript ile yazılmış, **harici bağımlılığı olmayan** destek talebi yönetim paneli. Veriler tarayıcının `localStorage`'ında tutulur; sunucu, veritabanı veya API anahtarı gerekmez.

## Hızlı Başlangıç

`index.html` dosyasını çift tıkla — bu kadar. Tarayıcıda açılır ve çalışır.

Alternatif olarak yerel sunucu ile:

```bash
python -m http.server 8100
# → http://localhost:8100
```

## Özellikler

| Alan | Açıklama |
|---|---|
| **Dashboard** | Toplam / Açık / İşleniyor / Çözüldü / Kritik / Sahipsiz — 6 canlı istatistik kartı. Karta tıklayınca ilgili filtre uygulanır. |
| **Talep listesi** | Tablo ve kart olmak üzere iki görünüm. Sıralama: en yeni, en eski, öncelik, başlık. |
| **Arama** | Başlık, müşteri, talep ID ve sorumlu adı üzerinden canlı arama (140 ms debounce). `Ctrl+K` ile aramaya odaklanır, `Esc` ile temizlenir. |
| **Filtreler** | Durum, öncelik ve kategori bazında birleşik (AND) filtreleme. Aktif filtreler çip olarak gösterilir. |
| **Yeni talep** | Modal form + alan bazlı doğrulama (zorunlu alan, min/max uzunluk). Hatalı alanlar kırmızı işaretlenir. |
| **Talep detayı** | Tam kayıt görünümü, durum/öncelik/sorumlu düzenleme, işlem geçmişi (log) ve silme (onaylı). |
| **Kalıcılık** | Her değişiklik anında `localStorage`'a yazılır. Sayfa yenilense de veri korunur. |
| **Çoklu sekme** | Başka bir sekmede yapılan değişiklik `storage` olayı ile anında yansır. |
| **Tema** | Açık/koyu tema; seçim hatırlanır, ilk açılışta sistem tercihi algılanır. |
| **Erişilebilirlik** | ARIA rolleri, klavye ile gezinme, `Esc` ile modal kapatma, `aria-live` bildirimler. |
| **Responsive** | 1100 / 900 / 640 px kırılımlarında uyarlanır; dar ekranda tablo yerine kart görünümü. |

## Klavye Kısayolları

| Tuş | İşlev |
|---|---|
| `Ctrl+K` | Arama alanına odaklan |
| `Esc` | Açık modalı kapat / aramayı temizle |
| `N` | Yeni talep formunu aç (metin alanında değilken) |

## Dosya Yapısı

```
index.html      Arayüz iskeleti (semantik HTML + ARIA)
style.css       Tüm stiller: tema değişkenleri, bileşenler, responsive
app.js          Çekirdek katman — sabitler, veri modeli, Store (localStorage),
                state, filtreleme/istatistik motoru, yardımcılar  → window.__PD__
ui.js           Render katmanı — tablo, kart, istatistik, çip, boş/loading durumları
                → window.__PD_UI__
main.js         Denetim katmanı — modal yönetimi, form doğrulama, eylemler,
                olay bağlama, demo veri, başlatma  → window.__PD_ACTIONS__
```

Katmanlar `window.__PD__` köprüsü üzerinden konuşur; `index.html` sırası `app.js → ui.js → main.js` şeklindedir.

## Veri Modeli

```js
{
  id:          "t_mu39rh24_72mwan",   // benzersiz kimlik
  title:       "Ödeme ekranında 500 hatası",
  customer:    "Ayşe Yılmaz",
  category:    "Teknik Sorun",
  priority:    "kritik",              // dusuk | orta | yuksek | kritik
  status:      "acik",                // acik | isleniyor | cozuldu
  description: "…",
  owner:       "Mehmet Ali Ceylan",   // veya "Atanmamış"
  createdAt:   "2026-09-15T22:48:00.000Z",
  updatedAt:   "2026-09-15T22:48:00.000Z",
  log:         [{ at: "…", text: "Talep oluşturuldu" }]
}
```

`localStorage` anahtarları: `pulsedesk.tickets.v1`, `pulsedesk.theme.v1`.

## Demo Veri

İlk açılışta 12 adet gerçekçi örnek talep yüklenir (5 açık, 4 işleniyor, 3 çözüldü; 2 kritik, 2 sahipsiz). Üst bardaki **Demo Sıfırla** butonu veriyi başlangıç haline döndürür.

> Not: Kullanıcı kendi kayıtlarını ekledikten sonra demo veri bir daha otomatik yüklenmez — mevcut kayıtlar asla ezilmez.

## Doğrulama

Sunucu bağımlılığı olmadığı için birim testi katmanı yoktur. Kabul testi gerçek tarayıcıda uçtan uca koşturulmuştur:

- İstatistik sayaçları (12/5/4/3/2/2) ✅
- Yeni talep kaydı: 12 → 13, sayaçlar ve `localStorage` güncellendi ✅
- Boş form gönderimi: alan hataları göründü, kayıt oluşmadı ✅
- Durum değişimi: Açık 6→5, İşleniyor 4→5, Çözüldü 3→4 ✅
- Filtreleme: kritik → 2, çözüldü → 3, birleşik filtre → 0 ✅
- Arama: başlık ve müşteri üzerinden doğru eşleşme ✅
- Sayfa yenileme (F5) sonrası veri korundu (13 kayıt) ✅
- Demo sıfırla: 13 → 12, başlangıç hali ✅
- Tema, görünüm geçişi, klavye kısayolları ✅

## Tarayıcı Desteği

Chrome, Edge, Firefox ve Safari'nin güncel sürümleri. Modern JS (ES5 uyumlu yazılmıştır, transpile gerekmez).

---

[![StackBlitz'te aç](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/numexai/numex-market/tree/main/uygulamalar/pulsedesk-destek) [![CodeSandbox'ta aç](https://codesandbox.io/static/img/play-codesandbox.svg)](https://codesandbox.io/s/github/numexai/numex-market/tree/main/uygulamalar/pulsedesk-destek)

**Kategori:** Üretkenlik · Numex AI tarafından otonom üretildi ve test edildi.

- ▶️ [Canlı demo](https://dene.numexai.com.tr/pulsedesk-destek/)
- ⚡ Tarayıcıda aç ve düzenle: [StackBlitz](https://stackblitz.com/github/numexai/numex-market/tree/main/uygulamalar/pulsedesk-destek) · [CodeSandbox](https://codesandbox.io/s/github/numexai/numex-market/tree/main/uygulamalar/pulsedesk-destek) — kurulum yok
- 🛍️ [Numex Market'te gör](https://market.numexai.com.tr) · 🏗️ [Numex Forge](https://forge.numexai.com.tr/explore/repos)
- 💬 [Numex AI ile kendi uygulamanı yap](https://numexai.com.tr) — Türkçe yapay zekâ asistanı

**Etiketler:** `stok takip` · `randevu sistemi` · `productivity` · `business app` · `açık kaynak` · `türkçe` · `yapay zeka ile yapıldı` · `open source` · `javascript` · `ai generated` · `numex ai`

MIT lisanslıdır — bkz. [../LICENSE](../LICENSE). Beğendiysen [depoya ⭐ ver](https://github.com/numexai/numex-market).
