# Lazer Bağlantısı — Kullanıcı İçin Basit Anlatım

Bu dosya teknik değil. Makineyi takıp çalıştırmak isteyen kişi içindir.

## Özet

Program lazerin portunu kendisi arar. Kullanıcıdan port, COM numarası
veya hız (baud) bilgisi **istenmez**.

## İlk sefer

1. Lazeri USB ile bilgisayara tak.
2. Lazeri kendi düğmesinden aç.
3. Programda **"Lazere Bağlan"** düğmesine bas.

Tarayıcı ilk seferde küçük bir liste gösterebilir. Bu liste tarayıcının
kendi güvenlik kuralıdır; hiçbir program bunu atlayamaz. Listede lazerin
adını seç — tek tıklama yeter. Bu seçim **sadece ilk seferde** çıkar.

## Sonraki seferler

Seçilen cihaz hatırlanır. Program açıldığında kendiliğinden bağlanır ve
ekranda "✓ Lazer otomatik bağlandı — hazır" yazar. Düğmeye basmak bile
gerekmez.

## Uyarı mesajları ne demek

- **"Lazer aranıyor…"** → program cihazı arıyor, biraz bekle.
- **"Cihaz bulunamadı"** → USB takılı mı, makine açık mı diye bak.
- **"Bağlantı kurulamadı"** → USB kablosunu çıkar-tak, tekrar dene.

## Markalama ayarı (önemli)

Tek geçişte iz çıkmaz — ışık geçer gider. Panelde **"Pas"** değerini
malzemeye göre yükselt:

- Ahşap / kauçuk kaşe: **2 pas**
- Paslanmaz (sprey/bant ile): **3 pas**
- Alüminyum (anodize): **3-4 pas**

Önce **"TEST"** düğmesiyle yerini kontrol et, sonra **"Lazere Gönder"**.

## Programı açma

Klasördeki **`KASE-STUDYO.bat`** dosyasına çift tıkla. Tarayıcı kendi
açılır. Kapatmak için açılan siyah pencereyi kapat veya Ctrl+C bas.

## Makine hangi programla sürülür

Bu program G-code üretir ve doğrudan lazere gönderir. Makineni ayrıca
bir başka programa bağlaman gerekmez.

## Sık sorulan

**"Lazer ışık veriyor ama iz bırakmıyor."**
Pas değerini yükselt. Tek geçişte diyot lazer iz bırakmaz. Ayrıca hızı
düşür — yavaş geçiş daha koyu iz yapar.

**"Aynı yere iki kez çiziyor."**
Normal. Pas değeri kadar üst üste geçer; izin koyulaşması bu yüzdendir.

**"Makine hata veriyor / duruyor."**
USB'yi çıkar-tak, makineyi kapat-aç, sonra tekrar "Lazere Bağlan"a bas.

**"Hangi malzemeyi işleyebilirim?"**
Diyot lazer (455nm) ahşap, MDF, kauçuk, deri, anodize alüminyum ve
sprey/bant sürülmüş metallerde iz bırakır. Şeffaf cam ve paslanmaz çelik
bu makineyle işlenmez.

## Teknik ayrıntı (meraklısına)

- Protokol: GRBL 1.1 seri haberleşme
- Lazer modu: `$32=1` (program otomatik gönderir)
- Güç komutu: `M4 S<1..1000>` — dinamik güç
- Kapanma: `M5` — iş bitince lazer tamamen kapanır
- Bağlantı hızı: 115200 baud (program otomatik ayarlar)
- Satır gönderimi: `ok` el sıkışmalı, tampon taşmasına izin verilmez

Bu satırları bilmene gerek yok. Program hepsini kendisi yapar.
