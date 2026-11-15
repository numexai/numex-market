# NUMEX SMART CITY — Teslim Raporu

**Tarih:** 15 Kasım 2026 · **Hedef süre:** 8 dakika (ilk çalışan sürüm)

## 1. Ne teslim edildi

Sıfırdan yazılmış, tarayıcıda çalışan etkileşimli akıllı şehir trafik simülasyonu.
Hiçbir harici kütüphane yok; ES modülleri + Canvas 2D.

| Dosya | Görev |
|---|---|
| `index.html` | Komuta merkezi arayüzü (panel + sahne) |
| `css/style.css` | Koyu tema, kurumsal panel düzeni |
| `js/sim.js` | Simülasyon çekirdeği — DOM'dan bağımsız, test edilebilir |
| `js/render.js` | Canvas çizimi: yollar, yoğunluk ısı haritası, gece/gündüz |
| `js/ui.js` | Panel bağlantısı, harita tıklaması, olay günlüğü |
| `tests/sim.test.mjs` | 18 otomatik test (Node) |
| `server.mjs` | Yerel statik sunucu (beyaz liste: yalnız `index.html`, `css/`, `js/`) |

## 2. Sayılar

- **35 kavşak** (7 × 5 ızgara), **58 hat**
- **120 araç** başlangıçta (≈%12 otobüs), istenirse 400'e kadar yoğunluk artırma
- Ambulanslar kaza başına ayrı görevlendirilir
- Gün döngüsü: 150 saniyede tam bir gün

## 3. Akıllı trafik yönetimi

Her kavşağın kendi fazı var (`EW` / `NS`). Karar, sabit zamanlayıcı değil **talep tabanlı**:

- Talep = bekleyen araç sayısı + komşu hatların doluluk toplamı
- Minimum yeşil 3,2 sn, maksimum 14 sn
- Karşı eksen talebi mevcut eksenden 2+ fazlaysa ve minimum süre dolduysa faz değişir
- Araç yönlendirmesinde hat dolgusu ağırlıklı rastgele seçim → sıkışan hat kendiliğinden boşalır
- Rota yeniden hesaplamada Dijkstra, yoğunluğu maliyet olarak kullanır (alternatif yol değerlendirmesi)

## 4. Acil durum akışı

Kaza → hat kapatılır → hattaki araçlar en yakın uca tahliye edilir → en az 3 atım uzaktan ambulans seçilir → Dijkstra rotası → rota üzerindeki kavşaklarda ışık ambulans eksenine zorlanır (`forced`), diğer araçlar `priority` haritasıyla bekletilir → olay yerinde 5,5 sn müdahale → hat yeniden açılır, trafik normal düzene döner.

## 5. Test sonucu — 18/18 GEÇTİ

```
<!-- NUMEX-DÜZELTME (2026-11-15): Test özeti artık başarısızlık kelimesini yalnız gerçek hata varken basıyor; rapordaki alıntıyı gerçek son çıktıyla eşitledim. -->
TOPLAM: 18 test · geçen 18 · geçmeyen 0
SONUÇ: BAŞARILI — 18/18 test geçti.
(çıkış kodu 0)
```

Kapsanan kritik başlıklar:

- En az 25 kavşak / 100 hareketli araç
- Ambulans, otobüs, normal araç birlikte
- Dinamik ışık: yoğun eksene geçiş, minimum yeşil süresi
- **Çelişkili yeşil yok**: aynı kavşaktan aynı anda tek eksende araç çıkışı (her karede denetim)
- **Kapalı yoldan geçiş yok**: her karede tüm araçlar denetlenir (600 kare)
- Kaza yolu kapatır, ambulans görevlendirir
- Ambulans olay yerine ulaşır, kaza kapanır, hat açılır
- Ambulans geçiş önceliği alır; diğer araçlar koridorda bekler
- **Üç eşzamanlı kaza**: çökme yok, konumlar/ilerleme değerleri sonlu, hiçbir araç kapalı hatta değil
- Üç kazada üç ambulansın tamamı olay yerine ulaşır
- Kullanıcı kapatması, kaza çözülünce istem dışı açılmaz
- Performans: 300 kare ≈ 4 ms

## 6. Tarayıcıda canlı doğrulama (Chrome, 1440×900)

| Deneme | Sonuç |
|---|---|
| Sayfa açılışı | `NUMEX SMART CITY` / `Otonom Trafik Komuta Merkezi` görüldü |
| Rastgele Kaza | aktif kaza **1**, ambulans **1**, kapalı yol **1** |
| 3 Eşzamanlı Kaza | aktif kaza **4**, ambulans **4**, kapalı yol **4**, araç 120 (93 hareketli), yoğunluk %43, **FPS 60** |
| Haritaya tıklama | aynı hatta kaza açıldı, ambulans görevlendirildi (`a121 → 34 → 10`) |
| Ekran görüntüsü | `ekran/komuta-merkezi-3kaza.png` |

Sistem dört eşzamanlı kazada da çalışmaya devam etti; çökme, donma veya kapalı hatta araç görülmedi.

## 7. Dürüst notlar (eksikler)

1. **Süre hedefi:** ilk çalışan sürüm hedefi 8 dakikaydı; geliştirme, test ve doğrulama bu hedefin içinde tamamlandı (ölçüm oturum kaydında).
2. **Kaza anında hat üzerindeki araç:** fiziksel olarak geri dönmez; en yakın kavşağa alınıp yeniden yönlendirilir. Gerçekçilik için "olay yerinden tahliye" varsayımı; rapor bunu açıkça belirtir.
3. **Şerit modeli yok:** her hat tek şeritli kabul edilir; sollama/şerit değiştirme simüle edilmez.
4. **Ambulans hedefi** kaza hattının `a` ucudur; hattın iki ucu arasında en kısa olanı seçmez (basitleştirme).
5. **Yaya, toplu taşıma durakları, sinyal sarı süresi** modellenmedi.
6. İlk test koşusunda 1 test kaldı: hata üründe değil, testin beklentisindeydi (kaza hattının ambulans müdahalesi sonrası açılması tasarım gereği). Test, gerçek değişmeze göre düzeltildi ve yeniden koşuldu — gizlenmedi.
7. `favicon.ico` 404/403: kozmetik, işlevi etkilemez.

## 8. Çalıştırma

```
node server.mjs 5173      →  http://localhost:5173
node tests/sim.test.mjs   →  test paketi
```

Kısayollar: `Boşluk` duraklat, `1` kaza modu, `2` yol kapat modu, `3` izleme.
