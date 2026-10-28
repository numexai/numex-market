# Nexus Command Center

Proje yönetimi ve operasyon paneli. **Gerçekten çalışır** — mockup değil: veri modeli, durum yönetimi, kalıcılık, filtreleme, sürükle-bırak ve aktivite günlüğü dahil.

## Çalıştırma

```bash
npm install
npm start
```

Terminalde çıkan adresi aç (örn. `http://localhost:4173`). Port doluysa sunucu otomatik olarak bir sonraki boş porta geçer.

Demo veriyi başlangıç haline döndürmek için:

```bash
npm run reset
```

## Mimari

```
┌─────────────────────────────────────────────────────────────┐
│  Tarayıcı  (public/)                                        │
│   index.html                                                │
│   ├── js/api.js         fetch sarmalayıcı (tek hata biçimi) │
│   ├── js/state.js       istemci durumu + filtreler (LS)     │
│   ├── js/ui.js          DOM/kaçış/toast/modal/doğrulama UI  │
│   ├── js/chart.js       Canvas grafikler (harici lib YOK)   │
│   ├── js/dnd.js         HTML5 sürükle-bırak + klavye        │
│   ├── js/views/*.js     5 görünüm modülü                    │
│   └── js/app.js         denetleyici: yönlendirme + eylemler │
└──────────────────────────┬──────────────────────────────────┘
                           │  /api/*  (JSON)
┌──────────────────────────▼──────────────────────────────────┐
│  server/index.js   Express — statik + API, dinamik port     │
│   ├── src/routes/dashboard.js  /api/summary  (türetilmiş)   │
│   ├── src/routes/projects.js   /api/projects CRUD           │
│   ├── src/routes/tasks.js      /api/tasks    CRUD + move    │
│   ├── src/routes/team.js       /api/team     CRUD           │
│   ├── src/routes/activity.js   /api/activity günlük         │
│   ├── src/lib/validate.js      sunucu tarafı doğrulama      │
│   └── src/store/db.js          JSON depo (atomik yazma)     │
└──────────────────────────┬──────────────────────────────────┘
                           ▼
                    data/nexus.json
```

## Tasarım kararları

**Tek doğruluk kaynağı sunucudur.** İstemci sayı uydurmaz; metrikler `/api/summary`'den gelir. Sayfa yenilenince her şey yeniden türetilir.

**İlerleme yüzdesi türetilir, saklanmaz.** Bir projenin ilerlemesi `done` görev sayısı / toplam görev sayısıdır (`db.projectProgress`). Görev taşıdığında proje ilerlemesi kendiliğinden değişir — çift veri tutarlılığı sorunu oluşmaz.

**Aktivite kaydı tek noktadan düşer.** Tüm mutasyonlar `db.mutate()` üzerinden geçer; fonksiyon hem değişikliği uygular hem günlük satırını üretir. Böylece "kaydı unutulan olay" olmaz.

**Doğrulama iki katmanda.** İstemci doğrulaması UX içindir (anında geri bildirim), gerçek kapı `src/lib/validate.js`'tedir. API'ye doğrudan kötü veri gönderilemez.

**Yüzdeler `null`'a dayanıklı.** Görevi olmayan proje `%0` döner, sıfıra bölme hatası yok.

**Atomik yazma.** Veri önce `nexus.json.tmp`'ye yazılıp `rename` ile yerine konur; süreç yarıda kesilse bile bozuk JSON kalmaz. Bozuk dosya tespit edilirse yedeklenir ve temiz tohum veriyle başlanır.

**Filtreler iki taraflı tutarlı.** Arama/filtre sunucuya sorgu parametresi olarak gider; kanban ve liste görünümü **aynı** sonucu gösterir (iki ayrı filtre mantığı yok).

**Sürükle-bırak iyimser çalışır.** Kart anında taşınır, sunucu reddederse eski yerine geri döner. Klavye ile de taşınabilir: kartı seç, `←` / `→`.

## API

| Yöntem | Yol | Açıklama |
|---|---|---|
| GET | `/api/health` | Servis durumu + veri sayıları |
| GET | `/api/summary` | Dashboard metrikleri, proje ilerlemeleri |
| GET | `/api/projects` | `?status=&q=` |
| POST | `/api/projects` | Yeni proje |
| PUT | `/api/projects/:id` | Güncelle |
| DELETE | `/api/projects/:id` | Sil (görevler "Projesiz" kalır) |
| GET | `/api/tasks` | `?q=&priority=&projectId=&status=&assignee=&sort=` |
| POST | `/api/tasks` | Yeni görev |
| PUT | `/api/tasks/:id` | Güncelle |
| PATCH | `/api/tasks/:id/status` | Kanban taşıma |
| DELETE | `/api/tasks/:id` | Sil |
| GET | `/api/team` | Kişi başı iş yükü ile |
| POST | `/api/team` | Üye ekle |
| DELETE | `/api/team/:id` | Üye çıkar (açık görevi varsa engellenir) |
| GET | `/api/activity` | `?type=&limit=` |

Tüm yanıtlar `{ ok: true, data }` veya `{ ok: false, error }` biçimindedir.

## Klavye kısayolları

- `Ctrl/Cmd + N` — yeni görev
- `Esc` — açık modalı kapat
- Kanban kartı seçili iken `←` / `→` — kolon değiştir

## Veri modeli

```js
Project { id, name, description, status: planlandi|devam|tamamlandi,
          color, owner, deadline, createdAt }

Task    { id, title, description, priority: dusuk|orta|yuksek|kritik,
          assignee, due, status: todo|in_progress|done,
          projectId|null, createdAt, completedAt }

Member  { id, name, role, email, color }

Activity{ id, type: gorev|proje|ekip|sistem|hata,
          actor, action, detail, at }
```

## Sınırlamalar

- Kimlik doğrulama yok — tek kullanıcılı, yerel/ekip içi kullanım için tasarlandı.
- Veri deposu tek JSON dosyası; çok yazarlı eşzamanlı kullanım için veritabanına taşınmalı (`src/store/db.js` arayüzü bunu kolaylaştırır).
- Aktivite günlüğü son 400 kaydı tutar (sınırsız büyümeyi engellemek için).

---

[![StackBlitz'te aç](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/numexai/numex-market/tree/main/uygulamalar/nexus-command-center) [![CodeSandbox'ta aç](https://codesandbox.io/static/img/play-codesandbox.svg)](https://codesandbox.io/s/github/numexai/numex-market/tree/main/uygulamalar/nexus-command-center)

**Kategori:** Üretkenlik · Numex AI tarafından otonom üretildi ve test edildi.

- ▶️ [Canlı demo](https://komuta.dene.numexai.com.tr/)
- ⚡ Tarayıcıda aç ve düzenle: [StackBlitz](https://stackblitz.com/github/numexai/numex-market/tree/main/uygulamalar/nexus-command-center) · [CodeSandbox](https://codesandbox.io/s/github/numexai/numex-market/tree/main/uygulamalar/nexus-command-center) — kurulum yok
- 🛍️ [Numex Market'te gör](https://market.numexai.com.tr) · 🏗️ [Numex Forge](https://forge.numexai.com.tr/explore/repos)
- 💬 [Numex AI ile kendi uygulamanı yap](https://numexai.com.tr) — Türkçe yapay zekâ asistanı

**Etiketler:** `stok takip` · `randevu sistemi` · `productivity` · `business app` · `açık kaynak` · `türkçe` · `yapay zeka ile yapıldı` · `open source` · `javascript` · `ai generated` · `numex ai`

MIT lisanslıdır — bkz. [../LICENSE](../LICENSE). Beğendiysen [depoya ⭐ ver](https://github.com/numexai/numex-market).
