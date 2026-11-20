// Numex — 32 kayıtlık tamamen kurgusal demo veri
// Tarihler bugüne göre göreli üretilir; toplamlar kod içinde hesaplanır (tutarlılık).
import { bugun as bugunFn, gunEkle, tarihYaz, ayEkleGuvenli, tarihAyikla } from './tarih.js';

export const KATEGORILER = [
  'Elektrik', 'Su', 'Doğalgaz', 'İnternet', 'Telefon', 'Bulut Depolama',
  'Yapay Zekâ', 'Yayın Platformu', 'Müzik', 'Yazılım', 'Alan Adı', 'Sunucu', 'Diğer'
];

export function kategoriRenk(kat) {
  const m = {
    'Elektrik': '#f5b544', 'Su': '#38bdf8', 'Doğalgaz': '#fb7185', 'İnternet': '#2dd4bf',
    'Telefon': '#a78bfa', 'Bulut Depolama': '#34d399', 'Yapay Zekâ': '#22d3ee',
    'Yayın Platformu': '#f472b6', 'Müzik': '#818cf8', 'Yazılım': '#4ade80',
    'Alan Adı': '#fbbf24', 'Sunucu': '#60a5fa', 'Diğer': '#94a3b8'
  };
  return m[kat] || '#94a3b8';
}

let sayac = 0;
function id() {
  sayac++;
  return `ab_demo_${String(sayac).padStart(2, '0')}`;
}

export function demoVeriUret(bugunT = bugunFn()) {
  sayac = 0;
  // Demo tarihleri: son ödeme tarihi HER ZAMAN bugün veya ileride olacak şekilde
  // (seri motoru çapadan geriye de ürettiği için geçmiş çapa, geçen ayın ödemesini
  //  "gecikmiş" gibi gösteriyordu — demo veride bu gürültüyü istemiyoruz).
  const g = (n) => tarihYaz(gunEkle(bugunT, n));
  const ay = (n) => tarihYaz(ayEkleGuvenli(bugunT, n, bugunT.getDate()));
  const ileri = (gun) => tarihYaz(gunEkle(bugunT, ((gun % 27) + 27) % 27 + 1));

  // [ad, kategori, tutar, paraBirimi, siklik, sonOdeme, otomatik, sonKullanim, zorunlu, not, durum]
  const ham = [
    ['Marmara Elektrik A.Ş.', 'Elektrik', 1240.50, 'TRY', 'aylik', g(9), true, g(-2), true, 'Tedarikçi: kurgusal. Ortalama tüketim 240 kWh.', 'aktif'],
    ['İSKİ Su Faturası', 'Su', 385.75, 'TRY', 'aylik', g(14), true, g(-1), true, 'Kurgusal su idaresi.', 'aktif'],
    ['Boğaziçi Doğalgaz', 'Doğalgaz', 2180.00, 'TRY', 'aylik', g(21), true, g(-3), true, 'Kış aylarında artıyor.', 'aktif'],
    ['FiberNet İnternet 1000 Mbps', 'İnternet', 949.90, 'TRY', 'aylik', g(4), true, g(-1), true, 'Taahhüt 2027 Mart sonu.', 'aktif'],
    ['YazlıkEv ADSL 35 Mbps', 'İnternet', 420.00, 'TRY', 'aylik', g(18), true, g(-98), false, 'Yazlıkta kullanılıyor, kışın kapalı.', 'aktif'],
    ['TürkHücresel Faturalı XL', 'Telefon', 780.00, 'TRY', 'aylik', g(11), true, g(-1), true, '20 GB + sınırsız konuşma (kurgusal).', 'aktif'],
    ['Yedek Hat Mini', 'Telefon', 145.00, 'TRY', 'aylik', g(26), true, g(-140), false, 'Araçta acil durum hattı.', 'aktif'],
    ['BulutDepo Pro 2 TB', 'Bulut Depolama', 299.00, 'TRY', 'aylik', g(7), true, g(-2), false, 'Aile fotoğraf arşivi.', 'aktif'],
    ['Fotoğraf Yedek Plus', 'Bulut Depolama', 89.99, 'USD', 'yillik', g(24), true, g(-45), false, 'Sadece fotoğraf yedeği.', 'aktif'],
    ['KodArşiv Depo 500 GB', 'Bulut Depolama', 12.00, 'USD', 'aylik', g(3), true, g(-6), false, 'Repo arşivi.', 'aktif'],
    ['Numex Benzeri AI Asistan Pro', 'Yapay Zekâ', 799.00, 'TRY', 'aylik', g(6), true, g(-1), false, 'Kurgusal AI asistanı.', 'aktif'],
    ['Görsel AI Studio', 'Yapay Zekâ', 24.00, 'USD', 'aylik', g(16), true, g(-52), false, 'Görsel üretim kredisi.', 'aktif'],
    ['Transkript AI Yıllık', 'Yapay Zekâ', 199.00, 'USD', 'yillik', g(19), true, g(-88), false, 'Ses metne çevirme.', 'aktif'],
    ['Kod Tamamlama AI Ekip', 'Yapay Zekâ', 420.00, 'TRY', 'aylik', g(27), true, g(-4), false, 'Ekip lisansı (2 koltuk).', 'aktif'],
    ['SinemaPlus 4K', 'Yayın Platformu', 229.00, 'TRY', 'aylik', g(12), true, g(-36), false, 'Dizi arşivi.', 'aktif'],
    ['DiziDünyası Standart', 'Yayın Platformu', 159.00, 'TRY', 'aylik', g(2), true, g(-64), false, 'Belgesel odaklı.', 'aktif'],
    ['SporExtra Yıllık', 'Yayın Platformu', 1299.00, 'TRY', 'yillik', g(112), true, g(-20), false, 'Maç paketi.', 'aktif'],
    ['MüzikAkış Premium', 'Müzik', 99.00, 'TRY', 'aylik', g(8), true, g(-1), false, 'Aile planı.', 'aktif'],
    ['KahveRadyo Yıllık', 'Müzik', 349.00, 'TRY', 'yillik', g(28), true, g(-210), false, 'Ofis müziği.', 'aktif'],
    ['TasarımPaketi Pro', 'Yazılım', 1099.00, 'TRY', 'yillik', g(163), true, g(-5), false, 'Grafik tasarım lisansı.', 'aktif'],
    ['Ofis Bulut Lisansı', 'Yazılım', 249.90, 'TRY', 'aylik', g(15), true, g(-2), true, 'Belge üretimi.', 'aktif'],
    ['MuhasebePro Aylık', 'Yazılım', 349.00, 'TRY', 'aylik', g(22), true, g(-7), true, 'Ön muhasebe.', 'aktif'],
    ['Ekran Kayıt Studio', 'Yazılım', 59.00, 'TRY', 'aylik', g(13), true, g(-40), false, 'Küçük tutar, birikiyor.', 'aktif'],
    ['numexmarketim.com', 'Alan Adı', 45.00, 'USD', 'yillik', g(4), true, null, false, 'Kurgusal alan adı.', 'aktif'],
    ['kurgusalblog.net', 'Alan Adı', 18.00, 'USD', 'yillik', g(29), true, g(-300), false, 'Blog alan adı.', 'aktif'],
    ['aileagaci.org', 'Alan Adı', 320.00, 'TRY', 'yillik', g(17), false, g(-400), false, 'Aile arşivi alan adı.', 'aktif'],
    ['VPS Frankfurt 4 GB', 'Sunucu', 18.00, 'EUR', 'aylik', g(5), true, g(-1), false, 'Kurgusal sunucu.', 'aktif'],
    ['VPS İstanbul 8 GB', 'Sunucu', 649.00, 'TRY', 'aylik', g(20), true, g(-9), false, 'Proje sunucusu.', 'aktif'],
    ['Depolama Sunucusu 1 TB', 'Sunucu', 96.00, 'USD', 'yillik', g(23), true, g(-150), false, 'Yedek sunucu.', 'aktif'],
    ['Spor Salonu Üyeliği', 'Diğer', 950.00, 'TRY', 'aylik', g(10), true, g(-75), false, 'Kurgusal spor salonu.', 'aktif'],
    ['Kargo Aboneliği Plus', 'Diğer', 79.00, 'TRY', 'aylik', g(25), true, g(-3), false, 'Ücretsiz kargo paketi.', 'aktif'],
    ['Eski Nota Uygulaması', 'Yazılım', 129.00, 'TRY', 'aylik', g(1), true, g(-240), false, 'Artık kullanılmıyor.', 'iptal']
  ];

  // Demo gerçekçi olsun: bugünden ÖNCEKİ tüm vadeler "ödenmiş" işaretlenir
  // (geçmiş ayların ödenmemiş görünmesi gerçek dışı bir "gecikmiş" gürültüsü üretiyordu).
  const gecmisOdemeleriIsaretle = (a) => {
    const bugunIso = tarihYaz(bugunT);
    const capa = tarihAyikla(a.sonOdemeTarihi);
    if (!capa) return a;
    const odemeler = {};
    // çapadan en fazla 24 ay geriye kadar vadeleri ödenmiş say
    let g = new Date(capa);
    for (let i = 0; i < 24 && g > new Date(bugunT.getFullYear() - 3, 0, 1, 12); i++) {
      if (a.siklik === 'haftalik') g = gunEkle(g, -7);
      else if (a.siklik === 'aylik') g = ayEkleGuvenli(capa, -i, capa.getDate());
      else if (a.siklik === '3aylik') g = ayEkleGuvenli(capa, -i * 3, capa.getDate());
      else g = ayEkleGuvenli(capa, -i * 12, capa.getDate());
      const iso = tarihYaz(g);
      if (iso < bugunIso) odemeler[iso] = true;
    }
    a.odemeler = odemeler;
    return a;
  };

  return ham.map((s, i) => ({
    id: id(),
    hizmetAdi: s[0],
    kategori: s[1],
    tutar: s[2],
    paraBirimi: s[3],
    siklik: s[4],
    sonOdemeTarihi: s[5],
    otomatikYenileme: s[6],
    sonKullanimTarihi: s[7],
    zorunlu: s[8],
    not: s[9],
    durum: s[10],
    senaryo: 'koru',
    olusturmaSirasi: i,
    odemeler: {}
  })).map(gecmisOdemeleriIsaretle);
}
