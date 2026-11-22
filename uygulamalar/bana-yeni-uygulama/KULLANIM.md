# Fatih Bayraktar — Şiirin Sessiz Dünyası

Numex AI tarafından geliştirilmiş, üç boyutlu dijital şiir kitabı.
Tek klasörde çalışır; derleme, kurulum, bağımlılık gerekmez.

## Açmak

`index.html` dosyasını çift tıklayın — tarayıcıda açılır.
(Tarayıcı güvenliği nedeniyle harici yazı tipi için internet gerekir;
internet yoksa yedek sistem yazı tipleri devreye girer.)

## Dosya düzeni

```
index.html            sayfa iskeleti
css/stil.css          tasarım (neumorphism, 3B kitap, sayfa çevirme)
js/app.js             tüm etkileşim mantığı
veri/siirler.js       ŞİİRLER VE ŞAİR BİLGİSİ (yalnızca burayı düzenleyin)
gorsel/               fotoğraf buraya konur
```

## Şiir eklemek / değiştirmek

`veri/siirler.js` dosyasındaki `siirler` listesine yeni bir kayıt ekleyin:

```js
{
  id: "benzersiz-bir-kimlik",       // bağlantı paylaşımı için, boşluksuz
  baslik: "Şiirin Adı",
  kategori: "ask",                  // ask | ozlem | hayat | yalnizlik | umut
  tarih: "2024-03-12",              // bilinmiyorsa null
  demo: false,                       // GERÇEK şiirde false yapın ("Örnek metin" etiketi kalkar)
  metre: [
    "Birinci dize,",
    "İkinci dize.",
    "",                             // boş dize = kıta arası
    "Yeni kıta."
  ]
}
```

Kaydettikten sonra sayfayı yenilemeniz yeterli — tasarıma dokunmak gerekmez.

> **Önemli:** Dosyada hazır gelen 8 şiir, gerçek bir şaire ait DEĞİLDİR.
> Tasarımı göstermek için yazılmış özgün örnek metinlerdir ve arayüzde
> "Örnek metin" etiketiyle görünür. Gerçek şiirlerinizi eklerken `demo: false`
> yapın; etiket kendiliğinden kalkar.

## Fotoğraf eklemek

1. Portre fotoğrafınızı `gorsel/fatih-bayraktar.jpg` adıyla bu klasöre koyun.
2. `veri/siirler.js` içinde `fotograf: null,` satırını şöyle değiştirin:
   ```js
   fotograf: "gorsel/fatih-bayraktar.jpg",
   ```
Fotoğraf yoksa sitede uydurma bir görsel yerine zarif bir "portre eklenecek"
çerçevesi gösterilir.

## Biyografi eklemek

`veri/siirler.js` içinde `sair` bölümünde:

- `biyografi: null` → düz metin yazın.
- `dogum: null` → ör. `"1978"`.
- `eserler: []` → ör. `[{ ad: "Kitap Adı", yil: 2013, yayinevi: "Yayınevi" }]`.

Doğrulanmamış doğum tarihi, ödül veya yayın bilgisi bilerek eklenmemiştir;
site bunları uydurmaz, eklenene kadar "Bilgi eklenecek" gösterir.

## Kullanım

- **Kitap:** Fareyle gezdirin, kitap eğilir. Tıklayın (veya Enter) — açılır.
- **Sayfa:** "Önceki / Sonraki" düğmeleri, ← → tuşları, mobilde sağa-sola kaydırma.
- **Favori:** Okurken kalp ikonuna basın; üst bardaki kalpten listeye ulaşın.
- **Arama:** Koleksiyon bölümünde başlık veya dizeye göre arama.
- **Kopyala / Paylaş:** Okuma ekranının alt barından.
- **Gece modu:** Ay ikonu (tercih tarayıcıda saklanır).
- **Yazı boyutu:** A− / A+ düğmeleri (okuma ekranında).
- **Hareket azaltma:** İşletim sistemi "hareketi azalt" tercihine otomatik uyulur.

## Bilinen sınırlar

- Paylaşma, tarayıcının kendi paylaşım menüsünü kullanır; desteklemeyen
  tarayıcılarda metni panoya kopyalar.
- Harici yazı tipleri internetten gelir (Google Fonts); çevrimdışıyken
  tasarım bozulmaz, yedek yazı tipleri kullanılır.
