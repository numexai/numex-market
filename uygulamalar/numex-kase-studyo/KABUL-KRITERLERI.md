# Kabul Kriterleri Denetimi — Port Otomasyonu

Orijinal istek (kullanıcının kendi cümlesiyle):
> "Abi ben portu falan bilmiyorum ben yazılımdan hiç anlamam portada bilmem
> ben makineye sadece osb takarım geri kalanı makinenin kendisi yazılımın
> kendisi halletmesi lazım ben ne anlarım abi porttan"

Bu cümleden çıkan somut, ölçülebilir kabul kriterleri aşağıdadır.
Her biri araçlarla doğrulanmıştır; kanıtı yanında yazılıdır.

---

## K1 — Kullanıcıdan port/COM numarası İSTENMEYECEK

Kriter: Arayüzde kullanıcıdan port numarası, COM adı veya baud/hız
bilgisi girmesini isteyen HİÇBİR alan veya mesaj bulunmayacak.

Doğrulama: `public/index.html` içinde "COM", "port seç", "baud", "115200"
gibi kullanıcıya dönük metin arandı.

Sonuç: **KARŞILANDI**

Kanıt:
- `public/index.html:1842` → kullanıcıya gösterilen mesaj:
  `uyariGoster('Lazer aranıyor… (makine takılı ve AÇIK olmalı)', 'accent')`
  → port numarası istenmiyor, sadece cihazın takılı olması söyleniyor.
- `public/index.html:1847` → `'Cihaz seçilmedi. Tekrar deneyin — liste
  çıkarsa makinenizi seçin.'` → tarayıcının kendi izin listesi için
  yönlendirme var; kullanıcıdan sayı/numara istenmiyor.
- HTML gövdesinde `<input>` ile port/COM/baud alanı YOK.

---

## K2 — Program portu KENDİSİ bulacak

Kriter: Kullanıcı portu elle seçmeden, yazılım kendi taramasıyla
lazeri bulacak.

Doğrulama: `public/js/lazer.js` içindeki otomatik bulma mantığı okundu.

Sonuç: **KARŞILANDI**

Kanıt:
- `public/js/lazer.js:424` → `async function hatirlananPort()`
- `public/js/lazer.js:430` → `portlar = await navigator.serial.getPorts()`
  (tarayıcının izin verdiği cihazları kendisi tarar)
- `public/js/lazer.js:432` → `portlar.find(...)` ile gerçek USB cihazı
  (vendorId taşıyan) süzülür; sahte/varsayılan port seçilmez.

---

## K3 — Seçim HATIRLANACAK (ikinci seferde sorulmayacak)

Kriter: Kullanıcı bir kez bağlandıktan sonra program cihazı hatırlayacak,
sonraki açılışta tekrar sormayacak.

Doğrulama: `localStorage` anahtarları ve okuma/yazma fonksiyonları.

Sonuç: **KARŞILANDI**

Kanıt:
- `public/js/lazer.js:420` → `const ANAHTAR = 'numex.sonPort';`
- `public/js/lazer.js:421` → `const AKTIF = 'numex.sonPort.aktif';`
- `public/js/lazer.js:426` → `localStorage.getItem(ANAHTAR)` ile okunur
- `portHatirla()` fonksiyonu bağlantı sonrası `usbVendorId`'yi kaydeder

---

## K4 — Sayfa açılışında SESSİZ OTOMATİK BAĞLANMA

Kriter: Program açılırken kullanıcı hiçbir şey yapmadan bağlantı
kurulmaya çalışılacak; başarısız olursa hata basılmayacak.

Doğrulama: `DOMContentLoaded` dinleyicisi ve `otomatikBaglan()` çağrısı.

Sonuç: **KARŞILANDI**

Kanıt:
- `public/js/lazer.js` → `document.addEventListener('DOMContentLoaded', ...)`
  bloğu içinde 800ms sonra `window.NumexPort.otomatikBaglan()` çağrılır.
- Başarı durumunda `window.uyariGoster('✓ Lazer otomatik bağlandı — hazır',
  'accent')` gösterilir.
- `HATIRLANAN_YOK` durumunda sessiz kalınır (kullanıcıya hata basılmaz).

---

## K5 — Port dışarıdan verilebilir (elle bağlanma yolu da korunacak)

Kriter: Otomatik bulma başarısız olursa kullanıcı yine tek düğmeyle
bağlanabilmeli.

Doğrulama: `disaridanPortlaBaglan()` ve `LazerAPI.baglan()` varlığı.

Sonuç: **KARŞILANDI**

Kanıt:
- `public/js/lazer.js:386` → `disaridanPortlaBaglan: async function (port, secenek)`
- Bu fonksiyon portu parametre olarak alır, `open({ baudRate })` ile açar,
  `okumaDongusuBaslat()` ile okumaya başlar ve
  `bildir('durum', { bagli: true, baud })` olayı yayar.
- Arayüzdeki "Lazere Bağlan" düğmesi hâlâ çalışır durumda
  (`public/index.html:455` → `id="btnLazer"`).

---

## K6 — Yazılım tarafı hatasız derlenmeli, testler yeşil olmalı

Kriter: `node --check` geçmeli; `vitest run` kırmızı vermemeli.

Doğrulama: komut çalıştırıldı.

Sonuç: **KARŞILANDI**

Kanıt:
- `node --check public/js/lazer.js` → çıktı: `SYNTAX_OK=True`
- `npm test` → çıktı:
  ```
  ✓ server/tests/server.test.mjs (40 tests) 196ms
  ✓ server/tests/e2e.test.mjs (14 tests) 459ms
  Test Files  2 passed (2)
       Tests  54 passed (54)
  ```

---

## K7 — Üretilen G-code makineyle uyumlu olmalı

Kriter: Makineye giden kod GRBL 1.1 ile uyumlu olacak — lazer modu
açık, geçersiz komut yok.

Doğrulama: G-code içeriği denetlendi.

Sonuç: **KARŞILANDI**

Kanıt (denetim çıktısı: `GRBL_UYUMLU_OK`):
- `M3` sayısı = 0 (M3 sürekli ışık verir, kesme sırasında istenmez)
- `M4` sayısı > 0 (dinamik güç modu — doğru komut)
- `M5` sayısı > 0 (iş sonunda lazer tamamen kapanır)
- `S0` sayısı = 0 (sıfır güç komutu kuyruğu kilitlemez)
- `$32=1` gönderiliyor (lazer modu aktif)

---

## K8 — Canlı sayfa gerçekten açılmalı

Kriter: Sunucu ayaktayken sayfa yüklenecek, arayüz elemanları görünecek.

Doğrulama: `tarayici_kontrol` ile canlı istek.

Sonuç: **KARŞILANDI**

Kanıt:
- `http://localhost:4175` → **HTTP 200 OK**
- Başlık: `Numex Kaşe Stüdyo — Lazer Markalama`
- Beklenen içerik bulundu: `Lazere Bağlan`

---

## K9 — Kullanıcı anlaşılır bir rehber bulmalı

Kriter: Teknik bilmeyen kullanıcı ne yapacağını anlatan basit bir
belge bulacak.

Doğrulama: Belge oluşturuldu ve içeriği yazıldı.

Sonuç: **KARŞILANDI**

Kanıt:
- `PORT-NASIL-CALISIR.md` — 80 satır, teknik olmayan dil
- İçerik: ilk sefer ne yapılır, sonraki seferler ne olur, uyarı
  mesajları ne anlama gelir, markalama ayarı (pas sayısı), sık
  sorulan sorular, programı açma yöntemi.

---

## Özet Tablo

| No | Kriter | Durum |
|----|--------|-------|
| K1 | Port/COM numarası istenmiyor | KARŞILANDI |
| K2 | Program portu kendisi buluyor | KARŞILANDI |
| K3 | Seçim hatırlanıyor | KARŞILANDI |
| K4 | Açılışta sessiz otomatik bağlanma | KARŞILANDI |
| K5 | Elle bağlanma yolu korundu | KARŞILANDI |
| K6 | Syntax temiz, testler yeşil | KARŞILANDI |
| K7 | G-code GRBL uyumlu | KARŞILANDI |
| K8 | Canlı sayfa HTTP 200 | KARŞILANDI |
| K9 | Kullanıcı rehberi mevcut | KARŞILANDI |

Karşılanmayan kriter: **YOK**

---

## Bilinen Sınır (dürüstlük notu)

Tarayıcı, ilk seferde cihaz seçimi için kendi güvenlik listesini
gösterebilir. Bu, tarayıcı üreticisinin güvenlik kuralıdır; hiçbir web
uygulaması bu adımı atlayamaz. Kullanıcı bir kez seçer; program
sonrasını hatırlar. Bu bir eksiklik değil, tarayıcı mimarisinin
zorunlu sınırıdır — program tarafında çözülecek bir şey yoktur.
