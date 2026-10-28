# Numex Deep Blue

**Okyanusun karanlığında yaşayan ışıklar.**

Tamamen kodla üretilmiş, etkileşimli bir denizanası akvaryumu. Hazır video, hazır animasyon, hazır model yok — her şey Three.js ile canlı olarak hesaplanıyor.

## Çalıştırma

`index.html` dosyasını çift tıklayın, tarayıcıda açılır. Sunucu gerekmez.

Yerel sunucuyla açmak isterseniz bu klasörün içinde:

```bash
py -m http.server 5179
```

sonra `http://localhost:5179` adresine gidin.

## Kontroller

| Ne | Nasıl |
|---|---|
| Kamerayı döndür | Fareyle sürükle / tek parmakla sürükle |
| Yakınlaş / uzaklaş | Fare tekerleği / iki parmakla aç-kapa |
| Denizanası rengini değiştir | Denizanasına tıkla |
| Işık şiddeti | Paneldeki **Işık** kaydırıcısı |
| Yüzme hızı | Paneldeki **Hız** kaydırıcısı |
| Denizanası sayısı | Paneldeki **Sayı** kaydırıcısı (8–24) |
| Sinematik tur | **Tur** düğmesi (tekrar basınca durur) |
| Kamerayı sıfırla | Yandaki hedef simgesi |
| Paneli gizle | Sağ alttaki menü düğmesi |

## Neler var

- 24 denizanası (varsayılan 12 görünür), her biri kendi ritminde atan çan gövdesi ve dalgalanan dokunaçlarla
- 6 renk paleti: turkuaz, mor, pembe, mint, mavi, açık pembe
- 1.800 biyolüminesans parçacık — yukarı süzülür, ışıkla parlar
- 7 ışık huzmesi, üstel sis, bloom (yumuşak parlama)
- Altıgen olmayan, prosedürel deniz tabanı ve kayalar
- Masaüstünde bloom açık; mobilde performans için kapatılır

## Dosyalar

```
deep-blue/
└── index.html   (tek dosya — HTML + CSS + JS)
```

## Numex Market

Tek dosya, harici bağımlılık yok (Three.js CDN'den yüklenir), lisans sorunu yok.
Market'e yüklemek için bu klasörü olduğu gibi paketleyebilirsiniz.

## Lisans

Numex AI tarafından üretildi. Serbestçe kullanılabilir.
