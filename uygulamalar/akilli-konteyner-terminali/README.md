# NUMEX LİMAN — Akıllı Konteyner Terminali

Türkçe, tek klasörde çalışan, etkileşimli liman operasyon ve konteyner yerleştirme simülatörü.
Sıfır bağımlılık (CDN/npm yok), saf HTML + CSS + ES Module JS.

## Çalıştırma

`index.html` dosyasını çift tıkla — tarayıcıda açılır ve çalışır.

Alternatif (yerel sunucu):

```
python -m http.server 3000
# → http://127.0.0.1:3000
```

## Durum

Tarayıcıda doğrulandı: sahne çiziliyor, vinç/araç animasyonları veri modelinden akıyor,
konteynerler gemiden depolama alanına taşınıyor, **13/13 kabul testi geçiyor**.

## Mimari

```
index.html            sahne canvas'ı + operasyon paneli
styles/main.css       koyu deniz mavisi tema, liman ışıkları, responsive
styles/panel.css      panel kartları, KPI, doluluk çubukları, mobil
src/config.js         tüm sabitler (kapasite, süre, renk, senaryo)
src/util.js           deterministik RNG (mulberry32), format, CSV kaçış
src/model/            container · yard · crane · transport
src/engine/           rules (saf kurallar) · dispatch · world · sim
src/ui/               scene (izometrik canvas) · panel · inspector
src/export.js         JSON / CSV / PNG / operasyon özeti
src/main.js           bootstrap, olay bağlama, döngü
tests/acceptance.js   13 kabul testi (arayüzde "Kabul Testleri" ile çalışır)
```

**Motor/UI ayrımı:** `engine/*` DOM'a dokunmaz; tüm zaman `world.clock`'tan gelir,
`Date.now()` motorda kullanılmaz. Bu yüzden aynı seed aynı planı üretir (test 10).

**Konumun tek kaynağı:** konteyner ekran konumu `zone.slots` (sahada) ve `pos` (taşınırken)
alanlarından okunur — süs amaçlı sabit animasyon yoktur.

## Veri modeli

Konteyner: `id, size (20|40), weight (ton), priority (1..5), type, arrival, departure,
targetZone, status (ship|moving|yard|dispatched|waiting), pos, assignedCrane,
assignedTransport, jobId, placedAt, reason`

## İş kuralları

1. **Kural hiyerarşisi:** yük türü zorunluluğu → kapasite → istif güvenliği → öncelik.
2. **Tehlikeli yük (DG)** yalnız D bölgesine, **reefer** yalnız C bölgesine girer.
3. **İstif güvenliği (basitleştirilmiş):** ağır konteynerin (≥24 t) üstüne yük konmaz;
   üstteki yük alttakinden belirgin biçimde ağır olamaz.
4. **Kapasite:** 40 ft iki slot kaplar; dolan bölgeye yerleştirme reddedilir.
5. **Çift atama yasağı:** bir konteyner aynı anda tek vinç + tek saha aracına atanır.
6. **Vinç kapasitesi:** 40 t / 30 t / 25 t; ağır yükü kaldıramayan vinç iş almaz.
7. **Uygun yer yoksa** konteyner yanlış yere konmaz; kuyrukta bekler ve `reason` alanında
   nedeni hem sahnede (detay kartı) hem panel kuyruğunda görünür.

> Depolama/istif kuralları eğitim amaçlı basitleştirilmiştir; gerçek bir liman güvenlik planı değildir.

## Kriz senaryoları

| Kodu | Senaryo | Davranış |
|---|---|---|
| A | Normal operasyon | Bütün vinçler çalışır |
| B | Vinç arızası | CR-2 kapatılır; işleri kuyruğa döner ve diğer vinçlere yeniden dağıtılır |
| C | Saha doluluğu | D bölgesi doldurulur; yeni yükler en boş uygun bölgeye yönlenir |
| D | Acil yük | Öncelik 5 konteyner kuyruk başına alınır, kuyruk sıralamasında başta kalır |

## Kontroller

Başlat / Durdur / Sıfırla · hız 0.5× / 1× / 2× / 4× · vinç aç-kapat anahtarları ·
senaryo seçimi · acil yük · sahneye tıklayarak konteyner detayı · JSON kaydet/yükle ·
CSV liste · PNG sahne · operasyon özeti · kabul testleri.

Mobilde panel sahnenin altına iner, butonlar ve kaydırıcı dokunmatik kullanıma uyar.

## Kabul testleri (13/13)

1. 60 konteyner doğru oluşuyor
2. ID'ler benzersiz
3. Kapasitesi yetersiz vinç yükü kaldıramıyor
4. Aynı konteyner aynı anda iki araca atanmıyor
5. Bölge kapasitesi aşılmıyor
6. Tehlikeli yükler doğru bölgeye ayrılıyor
7. Vinç arızasında bekleyen işler yeniden planlanıyor
8. Yüksek öncelikli konteyner uygun koşullarda öne alınıyor
9. Başlat/durdur simülasyon zamanını doğru yönetiyor
10. Aynı başlangıç verisi aynı planı üretiyor (seed 42)
11. JSON gidiş-dönüşünde konteyner durumları korunuyor
12. Konteyner gemiden depolama alanına taşınıyor
13. (Ek) Senaryo C: D bölgesi dolar, yeni yükler başka alana yönlenir

---

[![StackBlitz'te aç](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/numexai/numex-market/tree/main/uygulamalar/akilli-konteyner-terminali) [![CodeSandbox'ta aç](https://codesandbox.io/static/img/play-codesandbox.svg)](https://codesandbox.io/s/github/numexai/numex-market/tree/main/uygulamalar/akilli-konteyner-terminali)

**Kategori:** Diğer · Numex AI tarafından otonom üretildi ve test edildi.

- ▶️ [Canlı demo](https://dene.numexai.com.tr/akilli-konteyner-terminali/)
- ⚡ Tarayıcıda aç ve düzenle: [StackBlitz](https://stackblitz.com/github/numexai/numex-market/tree/main/uygulamalar/akilli-konteyner-terminali) · [CodeSandbox](https://codesandbox.io/s/github/numexai/numex-market/tree/main/uygulamalar/akilli-konteyner-terminali) — kurulum yok
- 🛍️ [Numex Market'te gör](https://market.numexai.com.tr) · 🏗️ [Numex Forge](https://forge.numexai.com.tr/explore/repos)
- 💬 [Numex AI ile kendi uygulamanı yap](https://numexai.com.tr) — Türkçe yapay zekâ asistanı

**Etiketler:** `web sitesi şablonu` · `tanıtım sayfası` · `landing page` · `template` · `açık kaynak` · `türkçe` · `yapay zeka ile yapıldı` · `open source` · `javascript` · `ai generated` · `numex ai`

MIT lisanslıdır — bkz. [../LICENSE](../LICENSE). Beğendiysen [depoya ⭐ ver](https://github.com/numexai/numex-market).
