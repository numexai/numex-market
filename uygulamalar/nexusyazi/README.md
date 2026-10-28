# ✍️ NexusYazı — Modern Kelime İşlemci

Tarayıcıda çalışan, **Word / Google Docs** havasında modern, sade ve ferah bir zengin metin editörü.
Masaüstü tarayıcılar için tasarlandı; hızlı açılır, ek kurulum gerektirmez.

## Özellikler

- **Zengin metin (contenteditable):** Kalın, italik, altı çizili, üstü çizili
- **Başlık stilleri:** H1, H2, H3, Normal metin, paragraf
- **Listeler:** Madde işaretli ve numaralı liste
- **Hizalama:** Sol, orta, sağ, iki yana yasla
- **Yazı tipi ailesi & boyutu** (Güvenli web fontları + başlık stilleri)
- **Renk & vurgu:** Metin rengi, arka plan (highlight) rengi
- **Geri al / Yinele** (undo / redo)
- **Biçimi temizle**
- **Belge yönetimi:** Yeni belge, Kaydet, Aç (dosyalar tarayıcıda **localStorage**'ta tutulur)
- **Dışa aktarma:** HTML ve TXT olarak indir
- **Canlı kelime & karakter sayacı** (alt durum çubuğu)
- **Otomatik kayıt:** 3 saniyede bir — "Kaydedildi" göstergesi
- **Klavye kısayolları:** `Ctrl+B` / `Ctrl+I` / `Ctrl+U` / `Ctrl+S` (kaydet)
- **Modern arayüz:** Temiz araç çubuğu, düzgün **SVG ikon seti** (emoji değil)
- **Açık / Koyu tema** desteği (kalıcı, sağ üstten değiştirilir)

## Çalıştırma

### 1) En kolay — sunucusuz
`index.html` dosyasını çift tıkla → tarayıcıda açılır.
Her şey client tarafında çalışır; kayıtlar tarayıcının localStorage'ında tutulur.

### 2) Sunucu ile (isteğe bağlı)
```bash
npm start
# → http://localhost:3210
```

## Kısayollar

| Kısayol | İşlev |
|---------|-------|
| `Ctrl + B` | Kalın |
| `Ctrl + I` | İtalik |
| `Ctrl + U` | Altı çizili |
| `Ctrl + S` | Belgeyi kaydet |
| `Ctrl + Z` | Geri al |
| `Ctrl + Y` | Yinele |

## Notlar
- Belge verileri yalnızca **kendi tarayıcında** saklanır (localStorage) — internet/hesap gerekmez, gizlilik dostu.
- "Yeni belge" oluştururken taslağa dönüş onayı sorulur (yanlışlıkla veri kaybını önler).
- Tema tercihi kalıcıdır.

---
**NexusYazı** — Numex AI tarafından geliştirildi.

---

[![StackBlitz'te aç](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/numexai/numex-market/tree/main/uygulamalar/nexusyazi) [![CodeSandbox'ta aç](https://codesandbox.io/static/img/play-codesandbox.svg)](https://codesandbox.io/s/github/numexai/numex-market/tree/main/uygulamalar/nexusyazi)

**Kategori:** Üretkenlik · Numex AI tarafından otonom üretildi ve test edildi.

- ▶️ [Canlı demo](https://dene.numexai.com.tr/nexusyazi/)
- ⚡ Tarayıcıda aç ve düzenle: [StackBlitz](https://stackblitz.com/github/numexai/numex-market/tree/main/uygulamalar/nexusyazi) · [CodeSandbox](https://codesandbox.io/s/github/numexai/numex-market/tree/main/uygulamalar/nexusyazi) — kurulum yok
- 🛍️ [Numex Market'te gör](https://market.numexai.com.tr) · 🏗️ [Numex Forge](https://forge.numexai.com.tr/explore/repos)
- 💬 [Numex AI ile kendi uygulamanı yap](https://numexai.com.tr) — Türkçe yapay zekâ asistanı

**Etiketler:** `stok takip` · `randevu sistemi` · `productivity` · `business app` · `açık kaynak` · `türkçe` · `yapay zeka ile yapıldı` · `open source` · `javascript` · `ai generated` · `numex ai`

MIT lisanslıdır — bkz. [../LICENSE](../LICENSE). Beğendiysen [depoya ⭐ ver](https://github.com/numexai/numex-market).
