# NUMEX CLOCKWORK — Zamanın İçini Gör

Tamamen kodla üretilmiş, gerçek zamanlı 3D mekanik saat. Hazır model, video ya da dış görsel **kullanılmadı** — her dişli, her çubuk, her parça matematikle çizildi.

## Açmak için

`index.html`'e çift tıkla. Kurulum, derleme, sunucu gerekmez.

> Tarayıcı `file://` üzerinden ES modül yüklemeyi engellerse klasörde basit bir sunucu çalıştır:
> `npx --yes http-server . -p 4177` → `http://127.0.0.1:4177`

## Ne var içinde

| Özellik | Nasıl yapıldı |
|---|---|
| Dişliler | Evolvent diş profili `THREE.Shape` ile üretilir, `ExtrudeGeometry` ile kalınlık verilir |
| Kavrama | İki çark `r1 + r2` uzaklığa yerleşir; diş fazı kavrama açısından hesaplanır |
| Dönüş | `ω_çocuk = -ω_ebeveyn × (z_ebeveyn / z_çocuk)` — gerçek dişli oranı |
| Kadran | Akrep/yelkovan/saniye gerçek saate bağlı; rakamlar Canvas 2D ile yazı tipinden dokuya çizilir |
| Sarkaç | 2 saniyelik ritimle sinüs salınımı |
| Metal | `MeshPhysicalMaterial` + kodla üretilmiş pürüz dokusu (torna izleri) |
| Işık | PMREM ortam yansıması, anahtar spot + rim + dolgu, bloom + vinyet |
| Kamera | OrbitControls, yumuşak geçişli `flyCamera` |

### Dişli treni

```
              [escape wheel 15]
                     │
   [ara_a 22] ─ [ANA ÇARK 44] ─ [ara_b 30]
       │              │              │
 [kademe2_a 12]  [ara_c 16]    [kademe2_c 17]
       │              │              │
 [kademe3_a 9]  [kademe2_b 13] [kademe3_b 11]
                     │
                [ara_d 26] ─ [ara_e 18]
```

Modül (diş aralığı ölçüsü) kasa çapından **türetilir**: en büyük çarkın yarıçapı kasanın %34'ünü geçmez. Böylece tren her zaman kasanın içinde kalır.

## Kontroller

| Tuş | İşlev |
|---|---|
| Sürükle | Kamerayı 360° döndür |
| Tekerlek | Yakınlaş / uzaklaş |
| `Space` | Zamanı durdur / başlat |
| `E` | Parçalara ayır / birleştir |
| `R` | Kamerayı sıfırla |
| `1` `2` `3` | Normal / ağır çekim / hızlı |

Panelden ayrıca **Mekanizma / Kadran** görünümü ve **sinematik tur** açılır.

## Dosyalar

```
index.html      — iskelet, kontrol paneli, importmap
style.css       — premium koyu panel, altın vurgu, duyarlı yerleşim
clockwork.js    — tüm sahne: dişliler, kadran, sarkaç, ışık, kontrol
market.json     — Numex Market künyesi
vendor/         — three.js ve addon'ları (çevrimdışı çalışır)
```

## Notlar

- Kütüphaneler `vendor/` altında yereldir; internet bağlantısı gerekmez.
- Dokular kodla üretilir (`CanvasTexture`), harici görsel dosyası yoktur.
- `prefers-reduced-motion` açıkken animasyonlar sadeleşir.
- Mobilde panel alta iner, dokunma hedefleri 44px'in altına inmez.

---

[![StackBlitz'te aç](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/numexai/numex-market/tree/main/uygulamalar/clockwork) [![CodeSandbox'ta aç](https://codesandbox.io/static/img/play-codesandbox.svg)](https://codesandbox.io/s/github/numexai/numex-market/tree/main/uygulamalar/clockwork)

**Kategori:** Simülasyon · Numex AI tarafından otonom üretildi ve test edildi.

- ▶️ [Canlı demo](https://dene.numexai.com.tr/clockwork/)
- ⚡ Tarayıcıda aç ve düzenle: [StackBlitz](https://stackblitz.com/github/numexai/numex-market/tree/main/uygulamalar/clockwork) · [CodeSandbox](https://codesandbox.io/s/github/numexai/numex-market/tree/main/uygulamalar/clockwork) — kurulum yok
- 🛍️ [Numex Market'te gör](https://market.numexai.com.tr) · 🏗️ [Numex Forge](https://forge.numexai.com.tr/explore/repos)
- 💬 [Numex AI ile kendi uygulamanı yap](https://numexai.com.tr) — Türkçe yapay zekâ asistanı

**Etiketler:** `simülasyon` · `görselleştirme` · `simulation` · `visualization` · `açık kaynak` · `türkçe` · `yapay zeka ile yapıldı` · `open source` · `javascript` · `ai generated` · `numex ai`

MIT lisanslıdır — bkz. [../LICENSE](../LICENSE). Beğendiysen [depoya ⭐ ver](https://github.com/numexai/numex-market).
