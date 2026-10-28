# 🛰️ MISSION CONTROL — Siber Sunucu DevOps İzleme Kokpiti

Cyber / sci-fi temalı, gerçek zamanlı (her saniye dalgalanan) bir sunucu izleme paneli.
**Express** backend sahte telemetri üretir; **saf HTML5 Canvas** frontend (harici grafik kütüphanesi YOK) çizer.

---

## Özellikler

### Bakckend (`server.js`)
- **`GET /metrics`** — her saniye dalgalanan **CPU / RAM / Disk / Ağ** kullanımı + son 30 sn CPU geçmişi + olay konsolu verisi.
- **`GET /processes`** — `nginx`, `postgresql`, `redis`, `auth-service`, `payment-worker`, `analytics` → 6 sahte proses (running listesi).
- **`DELETE /processes/:id`** — pid veya servis adı ile prosesi **durdurur**; durunca listeden düşer (`404`/`409` güvenli debug).
- 1 saniyelik kalp atışı döngüsü → rastgele CPU spike, bellek tırmanışı, arka plan olayları (`nginx 200 OK`, `redis cache hit`…).

### Frontend (`public/`)
- Koyu cam (glassmorphism) cyber tema — **camgöbeği / neon yeşil / kehribar / kritik kırmızı** uyarı renkleri, neon glow, tarama çizgileri.
- **3 dolan (arc) gösterge** — CPU / Memory / Network (değere göre yeşil→kehribar→kırmızı).
- **Çember yüzük disk göstergesi**.
- **Akan neon CPU çizgi grafiği** (saf canvas, izgaralı, degradeli dolgu, %80 kehribar eşik çizgisi).
- **Canlı proses tablosu** — her satırda kırmızı **✕ KILL** butonu → `DELETE` isteği → anında satır silinir.
- **Akan olay konsolu** — ok/uyarı/kritik renk kodlu, üste eklenen mini terminal.

---

## Çalıştırma

```bash
# 1) Bu klasörde (mission-control/) bağımlılıkları kur
npm install

# 2) Sunucuyu başlat
npm start
#   → http://localhost:5000

# İstersen farklı port
PORT=7000 node server.js
```

Tarayıcıda **http://localhost:5000** aç → panel canlı akar. Tablodaki `✕ KILL` butonları gerçekten prosesi durdurur ve satırı siler.

---

## API Özeti

| Method | Yol | Açıklama |
|---|---|---|
| GET | `/` | Kokpit UI |
| GET | `/metrics` | Anlık cpu/ram/disk/ağ + 30sn cpu geçmişi + olaylar |
| GET | `/processes` | Running proses listesi `[{pid,service,cpu,memMB,status}]` |
| GET | `/events` | Olay konsolu geçmişi |
| DELETE | `/processes/:id` | Prosesi durdur (`200 {ok:true}` / `404`) |

---

## Proje Yapısı

```
mission-control/
├── package.json       # express bağımlılığı & start scripti
├── server.js          # Express backend + sahte telemetri + REST API
├── public/
│   ├── index.html     # kokpit tek sayfa iskeleti
│   ├── style.css      # cyber neon cam teması
│   └── app.js         # polling · canvas gauge & grafik · tablo · konsol
└── README.md
```

Made with ❤️ by **Numex AI**.

---

[![StackBlitz'te aç](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/numexai/numex-market/tree/main/uygulamalar/mission-control) [![CodeSandbox'ta aç](https://codesandbox.io/static/img/play-codesandbox.svg)](https://codesandbox.io/s/github/numexai/numex-market/tree/main/uygulamalar/mission-control)

**Kategori:** Araçlar · Numex AI tarafından otonom üretildi ve test edildi.

- ▶️ [Canlı demo](https://dene.numexai.com.tr/mission-control/)
- ⚡ Tarayıcıda aç ve düzenle: [StackBlitz](https://stackblitz.com/github/numexai/numex-market/tree/main/uygulamalar/mission-control) · [CodeSandbox](https://codesandbox.io/s/github/numexai/numex-market/tree/main/uygulamalar/mission-control) — kurulum yok
- 🛍️ [Numex Market'te gör](https://market.numexai.com.tr) · 🏗️ [Numex Forge](https://forge.numexai.com.tr/explore/repos)
- 💬 [Numex AI ile kendi uygulamanı yap](https://numexai.com.tr) — Türkçe yapay zekâ asistanı

**Etiketler:** `ücretsiz araç` · `online araç` · `web tool` · `utility` · `açık kaynak` · `türkçe` · `yapay zeka ile yapıldı` · `open source` · `javascript` · `ai generated` · `numex ai`

MIT lisanslıdır — bkz. [../LICENSE](../LICENSE). Beğendiysen [depoya ⭐ ver](https://github.com/numexai/numex-market).
