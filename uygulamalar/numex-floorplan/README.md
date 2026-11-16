# NUMEX FLOORPLAN

Tarayıcıda çalışan 2D/3D iç mekân planlama stüdyosu. Kendi evinizin planını çizer, mobilya yerleştirir, 3B görünümde gezer ve projeyi kaydedersiniz.

## Çalıştırma

Kurulum yok, derleme yok. `index.html` dosyasını çift tıklayın ya da bir yerel sunucu açın:

```bash
python -m http.server 4173
# http://127.0.0.1:4173
```

Three.js (yalnızca 3B render için) `vendor/three.min.js` içinde yereldir; internet gerekmez.

## Veri modeli

Tek merkezi koordinat sistemi: **metre**, x sağa, y aşağı (plan düzlemi). 2D ve 3D aynı `NF.project` nesnesini okur; ayrı/sahte veri yoktur.

```js
project = {
  name, wallHeight, grid,
  walls:     [{ id, ax, ay, bx, by, t }],                    // duvar: iki uç + kalınlık
  openings:  [{ id, type:'door'|'window', wallId, d, w, h, sill }], // d = duvar başlangıcından uzaklık
  furniture: [{ id, type, x, y, w, d, rot }]
}
```

Boşluk (kapı/pencere) duvara `wallId` ile bağlıdır; duvar taşınınca/silinince onunla birlikte hareket eder, kopmaz.

## Oda algılama (gerçek poligon alanı)

1. Duvar uçları düğüm (mm hassasiyetinde birleştirilir), duvarlar kenardır.
2. T-kavşakları otomatik bölünür (bir duvarın ortasına gelen uç, o duvarı ikiye ayırır).
3. Her yönlü kenardan yüz dolaşılır; **pozitif işaretli kapalı yüzler** oda sayılır.
4. Alan, poligonun ayakkabı bağı (shoelace) formülüyle hesaplanır — piksel sayımı değil.

## Kullanım

| İş | Yol |
|---|---|
| Duvar çiz | `W` → tıkla-tıkla veya bas-sürükle; zincir devam eder, `Esc` bitirir |
| Kapı / pencere | `D` / `P` → duvara tıkla |
| Seç / taşı | `V` → nesneye tıkla, sürükle |
| Duvar ucunu düzenle | Duvarı seç, uç tutamacını sürükle |
| Döndür | `R` (Shift+R ters), mobilya panelinde ±90° |
| Çoğalt / sil | `Ctrl+D` / `Del` |
| Geri al / yinele | `Ctrl+Z` / `Ctrl+Y` |
| Sığdır, yakınlaş | `F`, tekerlek (imlece doğru), orta/sağ tuş kaydır |
| 3B | Üstten **3D Görünüm**: sol tık döndür, sağ tık kaydır, tekerlek yaklaş |
| Kaydet / aç | `JSON Kaydet` / `JSON Aç` (`Ctrl+S` de kaydeder) |
| Dışa aktar | `Dışa Aktar → SVG` veya `PNG` |
| Bina sınavı | Üstten **Bina Sınavı** — 5 senaryo canlı ölçülür; kanıt satırına ya da haritadaki numaralı işarete tıkla |

Hizalama: duvar uçlarına ve orta noktalarına öncelikli, sonra ızgaraya (5/10/25/50 cm seçilebilir). Çizim sırasında eksen kilidi (yakın eksene oturtma) ve `Shift` ile zorunlu eksen çalışır.

Otomatik kayıt: her değişiklikten sonra `localStorage`'a yazılır, sayfa açılışında geri yüklenir.

## Dosyalar

```
index.html          arayüz iskeleti
css/app.css          tema (koyu/açık) ve yerleşim
js/core.js           veri modeli, geometri, oda algılama, örnek projeler, geçmiş
js/editor2d.js       2B tuval: çizim, hizalama, seçim, sürükleme, SVG/PNG dışa aktarma, sınav katmanı
js/view3d.js         3B sahne: duvarları boşluklarından kesme, kapı/cam, ışık, orbit kamera
js/scenario.js       bina senaryosu ölçüm motoru (tahliye, çıkış, erişim, ışık, ıslak hacim)
js/exam.js           sınav paneli: 5 senaryo, karar, kanıt satırları, harita bağlantısı
js/app.js            panel bağlantıları, klavye, kaydet/aç, tema
tools/senaryo-olcum.js  motoru Node'da hazır planlarla koşan ölçüm aracı (`node tools/senaryo-olcum.js`)
vendor/three.min.js  3B render kütüphanesi (yerel)
```

## Bina sınavı (5 senaryo)

Planın içinde yaşayan insanların sorunlarını ölçer. Sonuç uydurulmaz: duvar, kapı ve oda verisinden hesaplanır. Üstteki **Bina Sınavı** düğmesi paneli açar; her düzenlemeden ~130 ms sonra canlı yeniden koşar.

| Senaryo | Neyi ölçer | Sınır |
|---|---|---|
| Yangın tahliyesi | Odanın **en uzak köşesinden** dış çıkışa en kısa yol (oda↔kapı grafı, Dijkstra) | 20 m kritik, 14 m uyarı |
| Çıkış yeterliliği | Dışarıya açılan kapı sayısı, çıkış önündeki oda | en az 2 çıkış |
| Erişilebilirlik | Kapı genişlikleri | 80 cm |
| Gün ışığı / havalandırma | Penceresi olmayan yaşam odası | her odada ≥1 pencere |
| Islak hacim | Kapısız ıslak hacim, yatak odasıyla ortak duvar | — |

Karar senaryolardan türer: hepsi temizse **geçti**, yalnız uyarı varsa **koşullu geçti**, kritik varsa **kaldı**. Paneldeki bir kanıt satırına ya da haritadaki numaralı işarete tıklayınca harita o bulguya odaklanır; "tahliye yolları" kutusu katmanı kapatır.

## Hazır projeler

1+1 küçük daire (3 oda, 42,00 m²) · 2+1 aile dairesi (5 oda, 90,00 m²) · stüdyo ofis (2 oda, 48,00 m²). Hepsi boş projeyle aynı araçları kullanır, düzenlenebilir.

---

[![StackBlitz'te aç](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/numexai/numex-market/tree/main/uygulamalar/numex-floorplan) [![CodeSandbox'ta aç](https://codesandbox.io/static/img/play-codesandbox.svg)](https://codesandbox.io/s/github/numexai/numex-market/tree/main/uygulamalar/numex-floorplan)

**Kategori:** Diğer · Numex AI tarafından otonom üretildi ve test edildi.

- ▶️ [Canlı demo](https://dene.numexai.com.tr/numex-floorplan/)
- ⚡ Tarayıcıda aç ve düzenle: [StackBlitz](https://stackblitz.com/github/numexai/numex-market/tree/main/uygulamalar/numex-floorplan) · [CodeSandbox](https://codesandbox.io/s/github/numexai/numex-market/tree/main/uygulamalar/numex-floorplan) — kurulum yok
- 🛍️ [Numex Market'te gör](https://market.numexai.com.tr) · 🏗️ [Numex Forge](https://forge.numexai.com.tr/explore/repos)
- 💬 [Numex AI ile kendi uygulamanı yap](https://numexai.com.tr) — Türkçe yapay zekâ asistanı

**Etiketler:** `web sitesi şablonu` · `tanıtım sayfası` · `landing page` · `template` · `açık kaynak` · `türkçe` · `yapay zeka ile yapıldı` · `open source` · `javascript` · `ai generated` · `numex ai`

MIT lisanslıdır — bkz. [../LICENSE](../LICENSE). Beğendiysen [depoya ⭐ ver](https://github.com/numexai/numex-market).
