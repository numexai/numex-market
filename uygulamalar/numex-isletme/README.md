# Numex İşletme — Dijital İşletme Yönetimi

Frontend + backend + kalıcı veri katmanı çalışan, operasyonel tutarlılığı önceleyen işletme yönetim uygulaması.

## Çalıştırma

```bash
npm install
npm run seed        # izole demo veri (4 ürün, 3 müşteri)
npm start           # http://localhost:4173 (port doluysa boş port)
```

Panel: tarayıcıda açılan adres. API: `http://localhost:<port>/api/...`

## Mimari

```
┌──────────────────────────────────────────────┐
│  public/index.html — Operasyon Paneli        │
│  Panel · Siparişler · Stok · Müşteriler       │
│  Teslimat · Risk İzleme · Operasyon Kayıtları │
└───────────────────┬──────────────────────────┘
                    │ fetch /api/*
┌───────────────────▼──────────────────────────┐
│  server/api.js — Express                     │
│  ├── YETKİ KAPISI (403 + gerekçe + karar)    │
│  ├── rotalar (müşteri, sipariş, ödeme...)    │
│  └── statik panel                            │
├──────────────────────────────────────────────┤
│  server/isletme.js — iş mantığı              │
│  ├── siparisOlustur  (BEGIN IMMEDIATE)       │
│  ├── odemeAl / odemeKesinlestir (idempotent) │
│  └── teslimatGuncelle / siparisIptal         │
├──────────────────────────────────────────────┤
│  server/risk.js — kurtarma + risk motoru     │
│  ├── kurtarmaCalistir()  (açılışta)          │
│  └── riskTarama() / oneriUret()              │
├──────────────────────────────────────────────┤
│  server/db.js — SQLite (WAL, synchronous=FULL)│
│  data/isletme.db  ← kalıcı veri              │
└──────────────────────────────────────────────┘
```

## Veri tutarlılığı kuralları (diske gömülü)

| Kural | Nerede |
|-------|--------|
| Negatif stok imkânsız | `CHECK (stok >= 0)` + trigger `trg_products_stok_guard` |
| Aşırı rezervasyon imkânsız | `UPDATE ... WHERE stok - rezerve >= adet` (tek ifadede kontrol+yazma) |
| Sipariş başına tek başarılı ödeme | `UNIQUE INDEX ux_payments_basarili WHERE durum='BASARILI'` |
| Aynı idempotency anahtarı tek kez | `UNIQUE INDEX ux_payments_idem`, `orders.idempotency_key UNIQUE` |
| Çökmede veri kaybı yok | WAL + `synchronous=FULL`, niyet yazımı tahsilattan önce |
| Belirsiz ödeme otomatik tekrarlanmaz | `kurtarmaCalistir()` → `yarimKalan` (operatör onayı) |

## Sınavlar

```bash
node scripts/sinavlar.mjs           # SINAV 1, 3, 4
node scripts/sinav2-hazirla.mjs     # SINAV 2 çökme anını kurgular
```

SINAV 2 tam akış: hazırla → süreci öldür → yeniden başlat → `GET /api/orders/<id>` (durum `ODENDI`, tek ödeme).

## API

| Metot | Yol | Açıklama |
|-------|-----|----------|
| GET | `/api/dashboard` | Panel özeti |
| GET/POST | `/api/customers` | Müşteri listele / ekle |
| GET/POST | `/api/orders` | Sipariş listele / oluştur (stok rezerve) |
| GET | `/api/orders/:id` | Sipariş detayı + risk |
| POST | `/api/orders/:id/pay` | Ödeme simülasyonu (idempotency_key) |
| POST | `/api/orders/:id/shipment` | Teslimat durumu |
| POST | `/api/orders/:id/cancel` | İptal (rezervasyon serbest) |
| GET | `/api/products` | Stok (stok, rezerve, kullanılabilir) |
| GET | `/api/risk` | Risk bulguları + kanıt + öneri |
| GET | `/api/ops`, `/api/decisions` | Operasyon ve karar kayıtları |

**Reddedilen işlemler:** `DELETE /api/customers/:id`, `DELETE /api/orders/:id`, `POST /api/files`, `POST /api/db/*` → `403 YETKISIZ_ISLEM` + gerekçe.

## Yapılmayanlar (bilinçli)

- Gerçek ödeme sağlayıcısı bağlanmadı (simülasyon).
- Gerçek müşteriye mesaj gönderilmedi; dış sistem değiştirilmedi.
- Müşteri/sipariş kaydı silme ucu **yok** (iptal/arşivleme tercih edilir).
- Riskli siparişlerde otomatik aksiyon yok; yalnız tespit + öneri.

Ayrıntılı kararlar: `KARAR_DEFTERI.md`.

---

[![StackBlitz'te aç](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/numexai/numex-market/tree/main/uygulamalar/numex-isletme) [![CodeSandbox'ta aç](https://codesandbox.io/static/img/play-codesandbox.svg)](https://codesandbox.io/s/github/numexai/numex-market/tree/main/uygulamalar/numex-isletme)

**Kategori:** Araçlar · Numex AI tarafından otonom üretildi ve test edildi.

- ▶️ [Canlı demo](https://isletme.dene.numexai.com.tr/)
- ⚡ Tarayıcıda aç ve düzenle: [StackBlitz](https://stackblitz.com/github/numexai/numex-market/tree/main/uygulamalar/numex-isletme) · [CodeSandbox](https://codesandbox.io/s/github/numexai/numex-market/tree/main/uygulamalar/numex-isletme) — kurulum yok
- 🛍️ [Numex Market'te gör](https://market.numexai.com.tr) · 🏗️ [Numex Forge](https://forge.numexai.com.tr/explore/repos)
- 💬 [Numex AI ile kendi uygulamanı yap](https://numexai.com.tr) — Türkçe yapay zekâ asistanı

**Etiketler:** `ücretsiz araç` · `online araç` · `web tool` · `utility` · `açık kaynak` · `türkçe` · `yapay zeka ile yapıldı` · `open source` · `javascript` · `ai generated` · `numex ai`

MIT lisanslıdır — bkz. [../LICENSE](../LICENSE). Beğendiysen [depoya ⭐ ver](https://github.com/numexai/numex-market).
