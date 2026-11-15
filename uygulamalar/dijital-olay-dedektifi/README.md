# Numex Core — Dijital Olay Dedektifi

Sıfırdan yazılmış, tarayıcıda çalışan olay analizi ve kök neden araştırma platformu.
Bağımlılık yok: saf HTML + CSS + JS. `index.html`'i çift tıklayarak açabilirsin.

## Dosyalar
- `generator.js` — sentetik veri üretim motoru (5.600 istek → 6.707 olay kaydı, 10 servis, 40 dakika)
- `analyzer.js` — analiz motoru: CSV/JSON içe aktarma, zaman çizelgesi, istek kimliği ilişkilendirme,
  örüntü tespiti, ilk anomali, kök neden sıralaması + güven
- `app.js` — arayüz, yeniden oynat, kanıt paneli, rapor üretimi (HTML/JSON)
- `style.css` — koyu temalı adli analiz arayüzü (responsive)
- `TEST-SONUCLARI.md` — 10 maddelik gerçek test kaydı

## Analiz mantığı (özet)
1. Servis × dakika matrisi çıkarılır (hata sayısı, yanıt süresi medyanı).
2. Anomali = **kalıcı gecikme sıçraması** (3 dakika üst üste referans medyanın ≥1,5 katı)
   + aynı dakikada hata sıçraması + bir önceki dakikanın normal olması.
   Tek başına hata sayısı anomali sayılmaz → "en çok görünen hata kök neden değildir" kuralı.
3. Aynı `istekId` ile geçen kayıtlar servis zincirine bağlanır (ilişki ağı).
4. Kök neden skoru: erkenlik + yayılan etki (ağda besleme yönü) + hata hacmi
   + katman konumu (aşağı katman daha çok puan) → 0–100.
5. Kanıt zayıfsa "yetersiz kanıt, kesin hüküm yok" denir.

## Cevap anahtarı
Üretici `anahtar` nesnesini ayrı döndürür ve analiz motoruna **verilmez**
(yalnız test köprüsü `window.__numex.anahtarKiyas()` karşılaştırır).

## Bilinen sınırlar
- Analiz tarayıcıda, bellek içinde çalışır (≈50 bin kayda kadar rahat).
- Servis bağımlılık grafiği yalnızca log kanıtından (istek kimliği) çıkarılır; APM verisi yoktur.
- Veri üretimi tek senaryo (bağlantı sızıntısı) içindir; başka arıza tipleri için tohum/senaryo eklenmeli.

---

[![StackBlitz'te aç](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/numexai/numex-market/tree/main/uygulamalar/dijital-olay-dedektifi) [![CodeSandbox'ta aç](https://codesandbox.io/static/img/play-codesandbox.svg)](https://codesandbox.io/s/github/numexai/numex-market/tree/main/uygulamalar/dijital-olay-dedektifi)

**Kategori:** Diğer · Numex AI tarafından otonom üretildi ve test edildi.

- ▶️ [Canlı demo](https://dene.numexai.com.tr/dijital-olay-dedektifi/)
- ⚡ Tarayıcıda aç ve düzenle: [StackBlitz](https://stackblitz.com/github/numexai/numex-market/tree/main/uygulamalar/dijital-olay-dedektifi) · [CodeSandbox](https://codesandbox.io/s/github/numexai/numex-market/tree/main/uygulamalar/dijital-olay-dedektifi) — kurulum yok
- 🛍️ [Numex Market'te gör](https://market.numexai.com.tr) · 🏗️ [Numex Forge](https://forge.numexai.com.tr/explore/repos)
- 💬 [Numex AI ile kendi uygulamanı yap](https://numexai.com.tr) — Türkçe yapay zekâ asistanı

**Etiketler:** `web sitesi şablonu` · `tanıtım sayfası` · `landing page` · `template` · `açık kaynak` · `türkçe` · `yapay zeka ile yapıldı` · `open source` · `javascript` · `ai generated` · `numex ai`

MIT lisanslıdır — bkz. [../LICENSE](../LICENSE). Beğendiysen [depoya ⭐ ver](https://github.com/numexai/numex-market).
