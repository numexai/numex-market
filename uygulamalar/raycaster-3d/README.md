# raycaster-3d

Saf **HTML5 2D Canvas** (`2d` context) üzerine inşa edilmiş, **3D retro FPS raycasting motoru** — *Wolfenstein 3D (1992)* klonu.

> ⛔ **Three.js / Babylon.js / WebGL kullanılmadı.** Tüm "3D" görüntü, ekranın her dikey piksel sütunu için fırlatılan ışınların (DDA) canvas `fillRect` ile boyamasından üretilir: gerçek 3D yok, perspektif illüzyonu var — tıpkı 1992'de olduğu gibi.

## Harita Düzeni (16×16)
| Değer | Anlam |
|-------|-------|
| `0`   | Boş / geçilebilir zemin |
| `1`   | Neon mavi duvar |
| `2`   | Yeşil duvar |
| `3`   | Kırmızı tuğla duvar |

## Teknik Özellikler
- **Raycasting & matematik motoru:** her dikey piksel sütunu için bir ışın; DDA (Digital Differential Analyzer) ışın yürütme.
- **Fisheye düzeltmesi:** `perpDist = dist * Math.cos(rayAngle - playerAngle)` ile kavisli duvar görünümü engellenir.
- **Derinlik gölgelendirme:** uzak dilimler koyu, yakınlar parlak.
- **Tavan/zemin:** gökyüzü kısmen koyu gri→siyah degrade, zemin koyu füme; dikey dilimler hâlinde boyanır.
- **Kontroller:** `W/S` ileri-geri, `A/D` veya `←/→` dönüş.
- **Çarpışma:** oyuncu duvarlardan geçemez (DDA + grid bounding).
- **HUD & Minimap:** sağ üstte grid tabanlı canlı radar (duvarlar + oyuncu + ışın konisi), altta retro durum çubuğu — canlı FPS sayacı, oyuncu `x / y`, retro hedef (crosshair).

## Çalıştırma
```bash
npm install
npm start
# -> http://localhost:4173
```
veya başka port: `PORT=5000 npm start`

## Dosyalar
```
public/
  index.html   — sayfa yapısı, canvas + HUD + minimap
  style.css    — retro arayüz
  engine.js    — raycasting/görüntüleme çekirdeği (saf 2D canvas)
  app.js       — oyun döngüsü, kontroller, fizik, HUD/minimap, minimap ışını
server.js      — Express statik sunucu
```

Oda oklarıyla dön, W/S ile yürü. İyi avlar 👾

---

[![StackBlitz'te aç](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/numexai/numex-market/tree/main/uygulamalar/raycaster-3d) [![CodeSandbox'ta aç](https://codesandbox.io/static/img/play-codesandbox.svg)](https://codesandbox.io/s/github/numexai/numex-market/tree/main/uygulamalar/raycaster-3d)

**Kategori:** Oyunlar · Numex AI tarafından otonom üretildi ve test edildi.

- ▶️ [Canlı demo](https://dene.numexai.com.tr/raycaster-3d/)
- ⚡ Tarayıcıda aç ve düzenle: [StackBlitz](https://stackblitz.com/github/numexai/numex-market/tree/main/uygulamalar/raycaster-3d) · [CodeSandbox](https://codesandbox.io/s/github/numexai/numex-market/tree/main/uygulamalar/raycaster-3d) — kurulum yok
- 🛍️ [Numex Market'te gör](https://market.numexai.com.tr) · 🏗️ [Numex Forge](https://forge.numexai.com.tr/explore/repos)
- 💬 [Numex AI ile kendi uygulamanı yap](https://numexai.com.tr) — Türkçe yapay zekâ asistanı

**Etiketler:** `tarayıcı oyunu` · `html5 oyun` · `browser game` · `html5 game` · `açık kaynak` · `türkçe` · `yapay zeka ile yapıldı` · `open source` · `javascript` · `ai generated` · `numex ai`

MIT lisanslıdır — bkz. [../LICENSE](../LICENSE). Beğendiysen [depoya ⭐ ver](https://github.com/numexai/numex-market).
