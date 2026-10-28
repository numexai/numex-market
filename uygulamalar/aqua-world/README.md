# Numex Aqua World

**Gelecek, denizin altında.**

Tarayıcıda çalışan, tamamen kodla üretilmiş etkileşimli 3D su altı şehri.
Hazır 3D model, doku, arka plan görseli ya da video **kullanılmadı** — bütün
nesneler Three.js geometrisiyle sıfırdan inşa edildi.

## Çalıştırma

Kurulum gerekmez. İki yol var:

1. **Çift tıkla:** `index.html` dosyasını tarayıcıda aç.
2. **Yerel sunucu (önerilen):** klasörün içinde
   `python -m http.server 8000` çalıştır, `http://localhost:8000` adresine git.

> Three.js ve yardımcı modüller `vendor/` klasöründe duruyor; sayfa **çevrimdışı**
> çalışır, CDN'e ihtiyaç duymaz.

## Kontroller

| Girdi | Ne yapar |
|---|---|
| Fare sürükleme | 360° kamera döndürme |
| Tekerlek / iki parmak | Yakınlaştırma, uzaklaştırma |
| Kubbeye tıklama | Kamera o kubbeye yaklaşır, bilgi kartı açılır |
| `T` | Sinematik şehir turu |
| `N` | Gece / gündüz aydınlatması |
| `F` | Denizaltı takip kamerası |
| `R` | Kamerayı başlangıca döndür |
| `Esc` | Açık kartı / modu kapat |

Aynı işlemler sağ üstteki panelden de yapılabilir.

## Şehir

| Kubbe | Rol | Ton |
|---|---|---|
| Merkez Kubbe | Yönetim ve yaşam | Turkuaz |
| Mercan Bahçesi | Tarım ve biyoteknoloji | Yeşil |
| Derin Sanayi Kubbesi | Enerji ve üretim | Altın |
| Derin Rasathane | Araştırma | Mor |

Kubbeler şeffaf cam tünellerle birbirine bağlı; içlerinde kuleler, ışıklı
pencereler ve gece modunda parlayan iç aydınlatma var.

## Dosya yapısı

```
aqua-world/
├── index.html          arayüz, stiller, import map
├── market.json         Numex Market meta verisi
├── README.md
├── LICENSE
├── src/
│   ├── main.js         sahne kurulumu, kamera modları, arayüz, döngü
│   ├── world.js        deniz tabanı, kubbeler, tüneller, mercan, kayalar
│   ├── creatures.js    balık sürüleri, vatozlar, denizaltılar
│   └── atmosphere.js   ışıklar, sis, parçacıklar, ışık huzmeleri, gece/gündüz
└── vendor/             three.js 0.160.0 + gerekli modüller (yerel kopya)
```

## Teknik notlar

- **Deniz tabanı** gürültü fonksiyonuyla kabartılmış tek bir düzlem; kubbe
  altları düzleştiriliyor.
- **Kubbeler** yarım küre + cam etek; kaburgalar `TubeGeometry` eğrileri.
- **Tüneller** kedi mullu eğri (`CatmullRomCurve3`) üzerinde `TubeGeometry`;
  uç yükseklikleri altlarındaki zemin ölçüsünden türetiliyor, ayaklar tünelin
  alt yüzeyine oturuyor.
- **Balık sürüleri**: sürü merkezi büyük bir yörüngede dolaşıyor, her balık
  kendi fazıyla salınıyor; kuyruk hareketi ayrı bir mesh ile canlandırılıyor.
- **Denizaltılar** kubbe yüksekliğinin üstünden geçen yay rotalarında seyrediyor;
  `SpotLight` farları sahneyi gerçekten aydınlatıyor.
- **Atmosfer**: `FogExp2` sisi, özel shader'lı parçacık sistemi, additive
  karışımlı ışık huzmeleri, `UnrealBloomPass` parlaması.
- Gece/gündüz geçişi bütün ışık ve renk değerlerini üstel sönümlemeyle
  (`MathUtils.damp`) yumuşak biçimde değiştiriyor.

## Lisans

Kod MIT lisanslıdır (bkz. `LICENSE`). Three.js kendi MIT lisansıyla `vendor/`
altında yer alır.

---

**Numex AI** · Gelecek, denizin altında.

---

[![StackBlitz'te aç](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/numexai/numex-market/tree/main/uygulamalar/aqua-world) [![CodeSandbox'ta aç](https://codesandbox.io/static/img/play-codesandbox.svg)](https://codesandbox.io/s/github/numexai/numex-market/tree/main/uygulamalar/aqua-world)

**Kategori:** Simülasyon · Numex AI tarafından otonom üretildi ve test edildi.

- ▶️ [Canlı demo](https://dene.numexai.com.tr/aqua-world/)
- ⚡ Tarayıcıda aç ve düzenle: [StackBlitz](https://stackblitz.com/github/numexai/numex-market/tree/main/uygulamalar/aqua-world) · [CodeSandbox](https://codesandbox.io/s/github/numexai/numex-market/tree/main/uygulamalar/aqua-world) — kurulum yok
- 🛍️ [Numex Market'te gör](https://market.numexai.com.tr) · 🏗️ [Numex Forge](https://forge.numexai.com.tr/explore/repos)
- 💬 [Numex AI ile kendi uygulamanı yap](https://numexai.com.tr) — Türkçe yapay zekâ asistanı

**Etiketler:** `simülasyon` · `görselleştirme` · `simulation` · `visualization` · `açık kaynak` · `türkçe` · `yapay zeka ile yapıldı` · `open source` · `javascript` · `ai generated` · `numex ai`

MIT lisanslıdır — bkz. [../LICENSE](../LICENSE). Beğendiysen [depoya ⭐ ver](https://github.com/numexai/numex-market).
