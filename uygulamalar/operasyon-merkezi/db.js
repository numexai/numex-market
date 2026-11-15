'use strict';
/**
 * Yerel kalıcılık katmanı.
 * Bağımlılık yok: veri tek JSON dosyasında atomik (tmp + rename) yazılır.
 * Testler LAZY veritabanı kullanır (dosya yolu verilmez, bellekte kalır),
 * böylece gerçek ekran verisi ile test verisi birbirine karışmaz.
 */
const fs = require('fs');
const path = require('path');

function bugunBaslangic() {
  const t = new Date();
  return new Date(t.getFullYear(), t.getMonth(), t.getDate()).getTime();
}

function tohumVerisi() {
  return {
    surum: 1,
    simAyar: { hiz: 60 }, // 1 saniye gerçek = 60 saniye simülasyon
    sayac: { siparis: 0, emir: 0, hareket: 0 },
    siparisler: [],
    emirler: [],
    emirlerArsiv: [],
    stok: [
      { id: 'M1', ad: 'Kereste (sandalye profili)', birim: 'adet', stok: 240, min: 100, birimFiyat: 38 },
      { id: 'M2', ad: 'Kereste (masa tablası)', birim: 'adet', stok: 70, min: 40, birimFiyat: 210 },
      { id: 'M3', ad: 'Kereste (raf paneli)', birim: 'adet', stok: 160, min: 60, birimFiyat: 62 },
      { id: 'M4', ad: 'Vida ve bağlantı seti', birim: 'set', stok: 1500, min: 400, birimFiyat: 4.5 },
      { id: 'M5', ad: 'Tutkal (kg)', birim: 'kg', stok: 85, min: 25, birimFiyat: 46 },
      { id: 'M6', ad: 'Ahşap verniği (kg)', birim: 'kg', stok: 60, min: 20, birimFiyat: 92 },
      { id: 'M7', ad: 'Zımpara kağıdı', birim: 'adet', stok: 300, min: 80, birimFiyat: 3.5 }
    ],
    urunler: [
      {
        id: 'P1',
        ad: 'Ahşap Sandalye',
        birimFiyat: 1850, // satış fiyatı (KDV hariç talebi karşılamak için)
        iscilikSaat: 1.5,
        iscilikUcreti: 420, // saat başı işçilik
        bom: [
          { malzemeId: 'M1', miktar: 4 },
          { malzemeId: 'M4', miktar: 12 },
          { malzemeId: 'M5', miktar: 0.3 },
          { malzemeId: 'M6', miktar: 0.25 },
          { malzemeId: 'M7', miktar: 1 }
        ],
        rotalar: [
          { istasyonId: 'S1', sureDk: 6 },
          { istasyonId: 'S2', sureDk: 10 },
          { istasyonId: 'S3', sureDk: 5 }
        ]
      },
      {
        id: 'P2',
        ad: 'Ahşap Masa',
        birimFiyat: 6400,
        iscilikSaat: 3,
        iscilikUcreti: 480,
        bom: [
          { malzemeId: 'M2', miktar: 1 },
          { malzemeId: 'M4', miktar: 24 },
          { malzemeId: 'M5', miktar: 0.6 },
          { malzemeId: 'M6', miktar: 0.8 },
          { malzemeId: 'M7', miktar: 2 }
        ],
        rotalar: [
          { istasyonId: 'S1', sureDk: 15 },
          { istasyonId: 'S2', sureDk: 22 },
          { istasyonId: 'S3', sureDk: 12 }
        ]
      },
      {
        id: 'P3',
        ad: 'Ahşap Raf',
        birimFiyat: 2250,
        iscilikSaat: 1,
        iscilikUcreti: 400,
        bom: [
          { malzemeId: 'M3', miktar: 3 },
          { malzemeId: 'M4', miktar: 8 },
          { malzemeId: 'M5', miktar: 0.2 },
          { malzemeId: 'M6', miktar: 0.2 },
          { malzemeId: 'M7', miktar: 1 }
        ],
        rotalar: [
          { istasyonId: 'S1', sureDk: 5 },
          { istasyonId: 'S2', sureDk: 7 },
          { istasyonId: 'S3', sureDk: 4 }
        ]
      }
    ],
    istasyonlar: [
      { id: 'S1', ad: 'Kesim', kapasite: 2, durum: 'hazir', baslayanSaat: 8, bitenSaat: 18 },
      { id: 'S2', ad: 'Montaj', kapasite: 3, durum: 'hazir', baslayanSaat: 8, bitenSaat: 18 },
      { id: 'S3', ad: 'Boyama', kapasite: 2, durum: 'hazir', baslayanSaat: 8, bitenSaat: 18 }
    ],
    hareketler: [
      { id: 'H0', tarih: Date.now(), malzemeId: 'M1', tip: 'giris', miktar: 240, aciklama: 'Açılış stoğu' },
      { id: 'H00', tarih: Date.now(), malzemeId: 'M2', tip: 'giris', miktar: 70, aciklama: 'Açılış stoğu' }
    ],
    // NUMEX-DÜZELTME (2026-11-14): Takvimde "bugün 10 adet" yazıyordu ama hiç üretim tamamlanmamıştı; bu, tohumdaki uydurma açılış verisinden geliyordu ve gerçek üretimi yanıltıcı biçimde şişiriyordu.
    // Günlük üretim BOŞ başlar: sayılar yalnız gerçekten tamamlanan emirlerden gelir.
    gunlukUretim: []
  };
}

class DB {
  constructor(dosyaYolu = null) {
    this.yol = dosyaYolu;
    this.veri = null;
    this.yukle();
  }

  yukle() {
    if (this.yol && fs.existsSync(this.yol)) {
      try {
        const ham = JSON.parse(fs.readFileSync(this.yol, 'utf8'));
        if (ham && ham.surum === 1) {
          this.veri = ham;
          return;
        }
      } catch (e) {
        console.error('[db] Veri dosyası okunamadı, tohum verisi ile başlanıyor:', e.message);
      }
    }
    this.veri = tohumVerisi();
    this.kaydet();
  }

  kaydet() {
    if (!this.yol) return;
    const gecici = this.yol + '.tmp';
    fs.mkdirSync(path.dirname(this.yol), { recursive: true });
    fs.writeFileSync(gecici, JSON.stringify(this.veri, null, 2), 'utf8');
    fs.renameSync(gecici, this.yol); // atomik yazma
  }

  sifirla() {
    this.veri = tohumVerisi();
    this.kaydet();
  }

  siparisNoUret() {
    const t = new Date();
    const yil = t.getFullYear();
    this.veri.sayac.siparis += 1;
    return `SIP-${yil}-${String(this.veri.sayac.siparis).padStart(4, '0')}`;
  }

  emirNoUret() {
    this.veri.sayac.emir += 1;
    return `IE-${String(this.veri.sayac.emir).padStart(4, '0')}`;
  }

  hareketNoUret() {
    this.veri.sayac.hareket += 1;
    return `H${String(this.veri.sayac.hareket).padStart(4, '0')}`;
  }
}

module.exports = { DB, tohumVerisi };
