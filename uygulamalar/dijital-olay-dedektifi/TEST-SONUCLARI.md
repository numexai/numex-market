# Numex Core — Dijital Olay Dedektifi · Test Sonuçları

Tarih: 2026-11-14 · Veri kümesi: 5.600 istek üzerinden 6.707 olay kaydı (seed 20261114)
Test ortamı: Numex Codex IDE, Chromium (gerçek tarayıcı) + http-server

| # | Test | Sonuç | Ölçüm |
|---|------|-------|-------|
| 1 | 5.000+ kayıt üret | ✅ | 6.707 kayıt, 10 servis, 40 dakikalık pencere (12:00–12:39) |
| 2 | Analize yalnızca kayıtlar verildi | ✅ | Motor `state.anahtar` alanına hiç erişmiyor; anahtar ayrı tutuluyor |
| 3 | İlk anomali tespiti | ✅ | `db-pool` · 12:10:05 · `DB_CONN_LEAK` (cevap anahtarı: db-pool, aynı dakika) |
| 4 | Bağlantı havuzu sorunu kök adaylarında | ✅ | `db-pool` 96/100 ile **1. aday**; 2. `payment-service` 81, 3. `api-gateway` 56 |
| 5 | Ödeme hataları neden-sonuç | ✅ | `payment-service` gerekçesi: "İlk anomali servisiyle aynı dakikada bozuldu; ilişki ağında ondan beslendiği için sonuç konumunda"; istek zinciri db-pool → api-gateway → payment-service |
| 6 | İlgisiz hatalar yanlış işaretlenmedi | ✅ | `SEARCH_INDEX_STALE`, `PUSH_TOKEN_INVALID`, `EDGE_CACHE_MISS_BURST`, `CRON_OVERLAP`, `MAIL_SMTP_4XX` → hiçbiri aday listesinde yok |
| 7 | Farklı sıralamayla yükleme | ✅ | Ters sıralı JSON ve CSV içe aktarımında 1. aday ve ilk anomali kodu aynı |
| 8 | Bozuk kayıtlar uygulamayı çökertmedi | ✅ | Arasına `{}`, `null`, bozuk tarih, dizi eklendi → çökme yok, 6.707 geçerli kayıt işlendi |
| 9 | Zaman çizelgesi gerçek tarayıcıda | ✅ | 260 satır + "çöküşten önceki 10 dakika" kaydırıcısı; satıra tıklayınca kanıt paneli aynı istek kimliğine ait 14 kaydı gösterdi |
| 10 | Rapor dışa aktarma + yeniden doğrulama | ✅ | Raporda kök neden, güven düzeyi ve öneriler var; HTML/JSON indirme Blob ile üretiliyor |

## Cevap anahtarı karşılaştırması (motorun görmediği)

```
kokServisBulundu:   true
kokHataKoduBulundu: true
ilkAnomaliDogru:    true
ilgisizYanlisIsaret: []
```

## Denetim koşusu (assertText ile, canlı tarayıcı — 2026-11-14)

Aşağıdaki kontroller `assertText` ile tek koşuda geçti (ekran görüntüsü değil, DOM doğrulaması):

| Kontrol | Beklenen | Sonuç |
|---|---|---|
| Başlık | NUMEX CORE | ✅ |
| İlk anomali hükmü | db-pool | ✅ |
| Birinci aday | skor 96/100 | ✅ |
| Sağlık #1 / #2 / #4 | ÇÖKÜNTÜ / BOZUK / SAĞLIKLI | ✅ |
| 10 dk kısayolu | "Çöküşten önceki 10 dk" + "Tüm olaylara dön" | ✅ |
| Zaman çizelgesi | İLK ANOMALİ + DB_CONN_LEAK | ✅ |
| Kanıt paneli | SEÇİLİ OLAY + 12:10:05 + İLİŞKİLİ KAYITLAR | ✅ |
| Rapor başlıkları | Olayın Başlangıcı / İlk Tespit / Kök Neden Adayları / Güven Düzeyi / Öneriler | ✅ |
| Rapor tablosu | db-pool | ✅ |
| URL | 4173 | ✅ |

### Bu koşuda bulunan ve düzeltilen gerçek hatalar
1. Kanıt panelinde `Invalid Date.NaN` — arayüz ISO metni `Date.parse` ile bekliyordu; `zaman()` dönüşümü tek noktaya alındı.
2. Sağlık etiketi `COKUNTU` — `toUpperCase()` Türkçe "Ç" harfini bozuyordu; sabit Türkçe etiket sözlüğü kullanıldı.
3. 10 dakika filtresi açıkken **İLK ANOMALİ satırı çizelgeden düşüyordu**; ilk anomali kaydı artık her zaman listede tutuluyor.

### Doğrulanmayan (açıkça yapılmadı sayılan)
- Rapor dosyasının diske indirilip yeniden açılarak okunması otomatik test edilmedi (modal içeriği doğrulandı).

## Notlar
- "En çok görünen hata" tuzağı: en fazla ERROR kaydı `search-indexer`/gürültü kaynaklıdır; motor bunları gecikme kanıtı olmadığı için ayıklıyor.
- Motorun kök neden kriteri: kalıcı gecikme sıçraması (3 dakika üst üste ≥1,5× medyan) + aynı dakikada hata sıçraması + ilişki ağında aşağı katmanda olma + yayılan etki.
