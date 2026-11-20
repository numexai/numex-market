# Kuaför Randevu

15 dakikalık dilimlerle çalışan, çakışma korumalı basit bir kuaför randevu uygulaması.
Node sunucusu (harici bağımlılık yok) + tek sayfa arayüz; tüm veriler `data.json` içinde tutulur.

## Çalıştırma

```bash
npm start          # http://localhost:4174
npm test           # testler (node --test)
```

- Müşteri ekranı: `http://localhost:4174/`
- Yönetici ekranı: `http://localhost:4174/#yonetici`
- Port doluysa sunucu bir sonraki boş porta geçer; sabit port için `PORT=5000 npm start`.
- Veri dosyası yolu `VERI_YOLU` ortam değişkeniyle değiştirilebilir (testler geçici dosya kullanır).

## Dosya düzeni

| Dosya | İşi |
|---|---|
| `server.js` | HTTP sunucusu: `/api/*` uçları ve `public/` altındaki statik dosyalar. Yazma işlemleri tek kuyrukta (`kilitli()`), dosyaya yazma geçici dosya + `rename` ile atomik. |
| `lib/randevu.js` | Saf iş mantığı (sunucudan bağımsız): hizmet/çalışan listesi, 15 dk dilimler, çakışma kontrolü, boş saat üretimi, randevu kuralları. |
| `public/index.html` | Tüm arayüz tek dosyada (CSS + JS dahili): müşteri formu ve yönetici listesi. |
| `data.json` | Randevu kayıtları. İptal edilen kayıt silinmez, `iptal: true` işaretlenir. |
| `test/randevu.test.js` | İş mantığı testleri (çakışma, sınır saatler, Pazar kapalı, geçmiş tarih, sıralama). |
| `test/api.test.js` | Gerçek HTTP testleri (randevu al → çakışma → yönetici listesi → iptal → saatin boşa dönmesi, eşzamanlı istek, hata kodları). |

## Kurallar

- Çalışma saatleri 09:00–19:00, 15 dakikalık dilimler; **Pazar kapalı**.
- Hizmetler: Saç Kesimi (30 dk), Boya (90 dk), Fön (45 dk). Çalışanlar: Ayşe, Mehmet, Zeynep.
- Çakışma yalnızca başlangıç saatine değil, hizmetin kapladığı **tüm dilimlere** bakılarak engellenir.
- İşlem gün sonuna sığmıyorsa (ör. 18:00'de boya) reddedilir.
- Geçmiş tarihe randevu alınamaz.

## API

| Yöntem | Yol | Açıklama |
|---|---|---|
| GET | `/api/hizmetler` | Hizmet ve çalışan listesi |
| GET | `/api/saatler?calisan=&tarih=&hizmet=` | O gün için boş başlangıç saatleri |
| POST | `/api/randevu` | Randevu oluştur (`musteri`, `telefon`, `calisan`, `hizmet`, `tarih`, `saat`) |
| GET | `/api/randevular?tarih=` | Günün randevuları, saat sırasıyla |
| DELETE | `/api/randevu/:id` | İptal (kayıt silinmez, işaretlenir) |

## Durum

- Testler: `node --test "test/*.test.js"` → 16/16 geçiyor (son kod üzerinde koşuldu).
- Tarayıcıda uçtan uca doğrulandı: randevu alındı, yönetici ekranında görüldü, iptal edildi, saat yeniden boşa düştü.

## Açık kalanlar / sonraki adım

- Yönetici ekranı için giriş/kimlik doğrulama yok — herkes `#yonetici` adresinden açabilir.
- Randevu değiştirme (erteleme) yok; iptal + yeni kayıt gerekiyor.
- Geçmiş saat kontrolü yalnızca tarih bazında; aynı gün geçmiş saate randevu alınabiliyor.
- Çalışan izin günü / mola aralığı tanımlı değil.
- Veri tek JSON dosyasında; eşzamanlı yazan birden çok sunucu süreci için kilit dosya bazlı değil, süreç içi.

Ayrıntılı dosya haritası: `.numex/PROJECT_MAP.md`

---

[![StackBlitz'te aç](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/numexai/numex-market/tree/main/uygulamalar/testyeniiii) [![CodeSandbox'ta aç](https://codesandbox.io/static/img/play-codesandbox.svg)](https://codesandbox.io/s/github/numexai/numex-market/tree/main/uygulamalar/testyeniiii)

**Kategori:** Diğer · Numex AI tarafından otonom üretildi ve test edildi.

- ▶️ [Canlı demo](https://dene.numexai.com.tr/testyeniiii/)
- ⚡ Tarayıcıda aç ve düzenle: [StackBlitz](https://stackblitz.com/github/numexai/numex-market/tree/main/uygulamalar/testyeniiii) · [CodeSandbox](https://codesandbox.io/s/github/numexai/numex-market/tree/main/uygulamalar/testyeniiii) — kurulum yok
- 🛍️ [Numex Market'te gör](https://market.numexai.com.tr) · 🏗️ [Numex Forge](https://forge.numexai.com.tr/explore/repos)
- 💬 [Numex AI ile kendi uygulamanı yap](https://numexai.com.tr) — Türkçe yapay zekâ asistanı

**Etiketler:** `web sitesi şablonu` · `tanıtım sayfası` · `landing page` · `template` · `açık kaynak` · `türkçe` · `yapay zeka ile yapıldı` · `open source` · `javascript` · `ai generated` · `numex ai`

MIT lisanslıdır — bkz. [../LICENSE](../LICENSE). Beğendiysen [depoya ⭐ ver](https://github.com/numexai/numex-market).
