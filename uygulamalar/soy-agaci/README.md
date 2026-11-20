# Numex Kökler — Etkileşimli Dijital Soyağacı

Tek klasörde çalışan, Türkçe, etkileşimli bir aile tarihi ve soyağacı uygulaması.
Tüm veri tarayıcıda kalır; hiçbir sunucuya gönderilmez.

## Çalıştırma

`index.html` dosyasını çift tıklayın — tarayıcıda açılır. Kurulum gerekmez.
(Alternatif: klasörde `python -m http.server 8099` çalıştırıp `http://localhost:8099` açın.)

## Dosyalar

| Dosya | İçerik |
|---|---|
| `index.html` | Arayüz: SVG ağaç, kişi kartı, paneller, form, dışa aktarma |
| `veri-ornek.js` | 60 kişilik hayalî aile (5 kuşak, 22 evlilik, 3 boşanma) |
| `cekirdek.js` | Akrabalık motoru, doğrulayıcı, GEDCOM, istatistik |
| `yerlesim.js` | Kuşaklara göre yerleşim, satır kırma, çizgi yolları |
| `test.js` | Bağımsız test motoru (26 test) |
| `rapor.txt` | Son test raporu çıktısı |

## Testleri çalıştırma

```
node test.js
```

Sonuç: **26 geçti, 0 kaldı.**

## Örnek aile

- **60 kişi**, **5 kuşak**: 9 → 12 → 18 → 15 → 6 kişi
- **22 evlilik**, **3 boşanma**
- **40 yaşayan**, **20 vefat etmiş**
- 4 ana soyadı: Yılmaz, Kaya, Demir, Çelik
- Tamamen hayalîdir; gerçek kişi, T.C. kimlik numarası veya gerçek aile kaydı **içermez**.
- Soyadı kuralı: kişi, doğum soyadıyla kayıtlıdır (evlenen kadın kendi soyadını korur).
  Akrabalık **hiçbir zaman soyadından** çıkarılmaz; her zaman gerçek aile grafından hesaplanır.

## Akrabalık motoru

Graf üzerinden hesaplanır (BFS + ortak ata analizi):

| İlişki | Nasıl bulunur |
|---|---|
| Anne / Baba | Doğrudan `anneId` / `babaId` |
| Kardeş | **İki** ebeveyn de aynı |
| Üvey kardeş | Yalnız **bir** ebeveyn aynı |
| Dede / Nine / Büyük dede | Ata zinciri uzunluğu (2+, 3+) |
| Amca / Hala | Babanın kardeşi (erkek / kadın) |
| Dayı / Teyze | Annenin kardeşi (erkek / kadın) |
| Yeğen | Ebeveyni, diğerinin kardeşi olan |
| Kuzen | Ortak ataya olan mesafe (2+2 = birinci derece) |
| Eş / Eski eş | Evlilik kaydı (bitiş tarihi varsa eski) |
| Kayınvalide / Kayınpeder | Eşin annesi / babası |
| Kayınbirader / Görümce / Baldız | Eşin kardeşi |

Bulunamayan ilişkide **uydurma cevap üretilmez**: "hesaplanabilir bir akrabalık bulunamadı" denir.

## Doğrulayıcı (Veri → Denetle)

Algıladığı hatalar: kendi ebeveyni olma, ebeveynlik döngüsü, tekrarlanan ID,
var olmayan kişiye bağ, kendisiyle evlilik, geçersiz tarih, ters tarih sırası.
Uyarı olarak bildirdikleri (silmez): 13 yaşından küçük ebeveyn, 60 yaşından büyük ebeveyn,
110 yıldan uzun ömür, gelecek tarih, çakışan evlilik kayıtları.

## Özellikler

- **Ağaç**: yakınlaştır/uzaklaştır (tekerlek ve iki parmak), sürükleyerek gezinme,
  ekrana sığdır, kişiye odaklan, kuşak bantları, eş bağlantı halkaları
- **Kişi kartı**: ad, tarihler, yer, anne/baba, eş(ler) ve eski eş, çocuklar, kardeşler,
  hayat hikâyesi, baş harfli avatar; bağlantılara tıklayınca o kişiye gider
- **Düzenleme**: kişi ekleme ve düzenleme, döngü kontrolüyle korumalı
- **Arama / filtre**: ad-soyad arama, kuşak, kol (baba/anne/evlilik), yaşayan/vefat,
  yalnız atalar, yalnız soy
- **Akrabalık**: iki kişi seçip ilişkiyi hesaplama (Shift + tıklama ile ikinci kişi)
- **Zaman çizelgesi**: doğum, evlilik, boşanma, vefat olayları; türe göre filtre
- **İstatistik**: toplam, kuşak, yaşayan/vefat, evlilik/boşanma, en kalabalık kuşak,
  en uzun yaşam, kuşak ve soyadı dağılımı
- **Veri**: JSON indir/yükle (sürükle-bırak), GEDCOM 5.5.1 dışa aktarma,
  SVG indirme, yazdırma, tarayıcıda yerel kayıt, örnek aileye sıfırlama (Ctrl+Shift+R)
- **Tasarım**: krem / koyu yeşil / bakır, serif başlıklar, yumuşak geçişler, mobil uyumlu

## Bilinen sınırlar

- GEDCOM dışa aktarımı temel alanları kapsar (NAME, SEX, BIRT, DEAT, RESI, NOTE,
  MARR, DIV, FAMC, FAMS); kaynak/alıntı (`SOUR`/`CITN`) yazılmaz.
- Farklı satıra düşen eşler arasında ağaçta çizgi çizilmez (çizgi kutu üstünden
  geçmesin kuralı gereği); eş bağı kişi kartında ve listelerde görünür.
- GEDCOM *içe* aktarma yoktur; JSON içe aktarma vardır.
- Yazdırma, tarayıcının yazdırma penceresini açar; ayrı bir baskı sayfası üretmez
  (SVG indirme bu iş için daha uygundur).

---

[![StackBlitz'te aç](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/numexai/numex-market/tree/main/uygulamalar/soy-agaci) [![CodeSandbox'ta aç](https://codesandbox.io/static/img/play-codesandbox.svg)](https://codesandbox.io/s/github/numexai/numex-market/tree/main/uygulamalar/soy-agaci)

**Kategori:** Diğer · Numex AI tarafından otonom üretildi ve test edildi.

- ▶️ [Canlı demo](https://dene.numexai.com.tr/soy-agaci/)
- ⚡ Tarayıcıda aç ve düzenle: [StackBlitz](https://stackblitz.com/github/numexai/numex-market/tree/main/uygulamalar/soy-agaci) · [CodeSandbox](https://codesandbox.io/s/github/numexai/numex-market/tree/main/uygulamalar/soy-agaci) — kurulum yok
- 🛍️ [Numex Market'te gör](https://market.numexai.com.tr) · 🏗️ [Numex Forge](https://forge.numexai.com.tr/explore/repos)
- 💬 [Numex AI ile kendi uygulamanı yap](https://numexai.com.tr) — Türkçe yapay zekâ asistanı

**Etiketler:** `web sitesi şablonu` · `tanıtım sayfası` · `landing page` · `template` · `açık kaynak` · `türkçe` · `yapay zeka ile yapıldı` · `open source` · `javascript` · `ai generated` · `numex ai`

MIT lisanslıdır — bkz. [../LICENSE](../LICENSE). Beğendiysen [depoya ⭐ ver](https://github.com/numexai/numex-market).
