/**
 * ATELIER MİMARLIK — İçerik verisi
 *
 * ÖNEMLİ: Buradaki projeler TEMSİLÎ portfolyo örnekleridir. Gerçek müşteri işi
 * olarak tanıtılmaz; site üzerinde her proje "Temsilî örnek" etiketiyle gösterilir.
 */

export interface Olcu {
  ad: string;
  deger: string;
}

export interface Asama {
  ad: string;
  aciklama: string;
  durum: string;
}

export interface Proje {
  slug: string;
  ad: string;
  tur: string;
  konum: string;
  yil: string;
  alan: string;
  kat: string;
  ozet: string;
  yaklasim: string[];
  olculer: Olcu[];
  teknikler: string[];
  asamalar: Asama[];
  /** 2D plan çizimi için modül ölçüleri (metre) */
  plan: { genislik: number; derinlik: number };
  palet: { zemin: string; duvar: string; vurgu: string };
}

export const projeler: Proje[] = [
  {
    slug: 'modern-villa',
    ad: 'Modern Villa',
    tur: 'Mimari Tasarım',
    konum: 'Temsilî — Ege kıyısı',
    yil: '2025',
    alan: '340 m²',
    kat: '2 kat + teras',
    ozet:
      'Eğimli araziye oturan, avluya açılan iki katlı bir villa önerisi. Salon ve mutfak zemin katta tek bir akışta birleşir; üst kat yatak odalarına ve çalışma mekânına ayrılır. Teras, güneşin batış yönüne doğru uzatılmıştır.',
    yaklasim: [
      'Arazi eğimi, kot farkı ile değil yatay düzlemlerle karşılandı; giriş kotu avluya bağlandı.',
      'Salon-cephe ilişkisi tam boy camla kuruldu, saçak derinliği yaz güneşini içeri almıyor.',
      'Mutfak adası, yemek ve salon arasında geçiş eşiği olarak çalışıyor; servis hattı arka cepheye alındı.',
      'Terasta gölgelenme, pergola ve doğal taş döşemenin ısı kütlesi üzerinden sağlandı.',
    ],
    olculer: [
      { ad: 'Salon', deger: '42 m² · 6,0 × 7,0 m' },
      { ad: 'Mutfak', deger: '18 m² · 4,5 × 4,0 m' },
      { ad: 'Ebeveyn yatak odası', deger: '22 m² · 4,6 × 4,8 m' },
      { ad: 'Çocuk odası', deger: '14 m² · 3,6 × 3,9 m' },
      { ad: 'Teras', deger: '36 m²' },
      { ad: 'Kat yüksekliği', deger: '3,05 m (net)' },
    ],
    teknikler: [
      'AutoCAD kat planı ve kesit paftaları (1/50)',
      'Cephe görünüşleri ve malzeme paftası',
      'Pergola detay kesitleri',
      'Yerleşim (vaziyet) planı',
      '3D kütle ve dış mekân modellemesi',
    ],
    asamalar: [
      { ad: 'İhtiyaç analizi', aciklama: 'Aile yapısı, günlük akış ve depolama ihtiyacı çıkarıldı.', durum: 'Tamamlandı' },
      { ad: 'Ön tasarım', aciklama: 'Üç alternatif kütle ve iki plan şeması üretildi.', durum: 'Tamamlandı' },
      { ad: 'Teknik çizim', aciklama: '1/50 plan, kesit ve cepheler AutoCAD üzerinde çizildi.', durum: 'Tamamlandı' },
      { ad: '3D sunum', aciklama: 'Dış mekân ve ana iç mekân görselleri hazırlandı.', durum: 'Tamamlandı' },
      { ad: 'Revizyon', aciklama: 'Teras genişliği ve mutfak adası konumu güncellendi.', durum: 'Tamamlandı' },
      { ad: 'Teslim', aciklama: 'Pafta seti, ölçü listesi ve malzeme föyü teslim edildi.', durum: 'Teslim edildi' },
    ],
    plan: { genislik: 14, derinlik: 11 },
    palet: { zemin: '#efe7d9', duvar: '#3a3733', vurgu: '#9a6f3f' },
  },
  {
    slug: 'luks-konut',
    ad: 'Lüks Konut',
    tur: 'İç Mimari',
    konum: 'Temsilî — şehir merkezi rezidans',
    yil: '2025',
    alan: '210 m²',
    kat: 'Tek kat (dubleks üst)',
    ozet:
      'Rezidans dairesinde iç mekân bütünlüğü üzerine kurulu bir düzenleme. Giriş holünden başlayan aks, salon boyunca devam edip manzaraya açılır; yatak odaları bu akstan ayrı bir koridorla koparılır.',
    yaklasim: [
      'Mevcut taşıyıcı akslar korunarak yalnızca bölücü duvarlar yeniden düzenlendi.',
      'Doğal taş, meşe kaplama ve patinajlı pirinç yüzeyler sınırlı sayıda malzemeyle birleştirildi.',
      'Aydınlatma üç katmanda kuruldu: genel, vurgu ve dolaylı (kartonpiyer içi).',
      'Depolama, duvar yüzeylerine gömülerek hacimden çalıntı yapılmadı.',
    ],
    olculer: [
      { ad: 'Salon', deger: '38 m² · 5,8 × 6,6 m' },
      { ad: 'Ana süit', deger: '26 m² · 4,4 × 6,0 m' },
      { ad: 'Giyinme odası', deger: '8 m² · 2,2 × 3,6 m' },
      { ad: 'Mutfak + ada', deger: '16 m²' },
      { ad: 'Hol / koridor', deger: '11 m²' },
      { ad: 'Tavan yüksekliği', deger: '2,85 m' },
    ],
    teknikler: [
      'Mobilya planı ve yerleşim paftası',
      'İç cephe açılımları (elevation)',
      'Tavan planı ve aydınlatma şeması',
      'Malzeme ve renk föyü',
      'Priz/anahtar elektrik yerleşimi',
    ],
    asamalar: [
      { ad: 'Ölçüm', aciklama: 'Yerinde ölçü alındı, mevcut durum planı çizildi.', durum: 'Tamamlandı' },
      { ad: 'İhtiyaç analizi', aciklama: 'Kullanıcı profili ve yaşam senaryosu belirlendi.', durum: 'Tamamlandı' },
      { ad: 'Ön tasarım', aciklama: 'Yerleşim alternatifleri ve malzeme yönü sunuldu.', durum: 'Tamamlandı' },
      { ad: 'Teknik çizim', aciklama: 'Mobilya planı ve iç cepheler çizildi.', durum: 'Tamamlandı' },
      { ad: 'Revizyon', aciklama: 'Mutfak adası ve oturma grubu yerleşimi revize edildi.', durum: 'Tamamlandı' },
      { ad: 'Teslim', aciklama: 'Uygulama paftaları ve metraj listesi teslim edildi.', durum: 'Teslim edildi' },
    ],
    plan: { genislik: 13, derinlik: 9.5 },
    palet: { zemin: '#e8e0d2', duvar: '#4a443d', vurgu: '#b08a52' },
  },
  {
    slug: 'bes-katli-apartman',
    ad: 'Beş Katlı Apartman',
    tur: 'Uygulama Projesi',
    konum: 'Temsilî — Anadolu yakası',
    yil: '2024',
    alan: '1.240 m²',
    kat: '5 kat + zemin',
    ozet:
      'Dar parsel üzerinde, her katta iki daire olacak şekilde kurgulanmış bir apartman uygulama projesi. Yangın merdiveni ve asansör çekirdeği ortak alanda toplandı; daireler iki cepheden ışık alıyor.',
    yaklasim: [
      'Parsef genişliği 11 m olduğundan derin plan tipolojisi yerine çift yönlü cephe kullanıldı.',
      'Islak hacimler çekirdeğe yakın toplandı, tesisat şaftları üst üste getirildi.',
      'Asansör holü ve merdiven, gün ışığı alan bir aydınlıkla desteklendi.',
      'Kot almaşık düzeni ile kütle hareketi elde edildi, balkonlar cepheden okunur hale getirildi.',
    ],
    olculer: [
      { ad: 'A tipi daire', deger: '96 m² · 3+1' },
      { ad: 'B tipi daire', deger: '84 m² · 2+1' },
      { ad: 'Salon', deger: '21 m² · 4,2 × 5,0 m' },
      { ad: 'Ortak çekirdek', deger: '28 m²' },
      { ad: 'Balkon', deger: '5,5 m² ila 7 m²' },
      { ad: 'Kat yüksekliği', deger: '3,00 m (döşeme dahil)' },
    ],
    teknikler: [
      'Kot ve aks planı, vaziyet planı',
      'Kalıp planı ile uyumlu mimari planlar',
      'Yangın kaçış şeması',
      'Kesit ve görünüşler (1/100)',
      'Islak hacim detayları',
    ],
    asamalar: [
      { ad: 'Ön tasarım', aciklama: 'Parsel verileri ve emsal hesabı üzerinden kütle çalışıldı.', durum: 'Tamamlandı' },
      { ad: 'Teknik çizim', aciklama: '1/50 planlar ve 1/100 görünüşler üretildi.', durum: 'Tamamlandı' },
      { ad: 'Uygulama projesi', aciklama: 'Detay ve mahal listeleri hazırlandı.', durum: 'Tamamlandı' },
      { ad: 'Koordinasyon', aciklama: 'Statik ve mekanik projelerle çakışma kontrolü yapıldı.', durum: 'Tamamlandı' },
      { ad: 'Teslim', aciklama: 'Ruhsat pafta seti düzenlendi.', durum: 'Teslim edildi' },
    ],
    plan: { genislik: 11, derinlik: 16 },
    palet: { zemin: '#ece6db', duvar: '#3f3b36', vurgu: '#8f6b3e' },
  },
  {
    slug: 'ticari-ofis',
    ad: 'Ticari Ofis',
    tur: 'Planlama',
    konum: 'Temsilî — iş merkezi katı',
    yil: '2025',
    alan: '480 m²',
    kat: 'Tek kat',
    ozet:
      'Açık ofis, toplantı odaları ve odak çalışma bölmeleri arasında denge kurulmuş bir kat planı. Dolaşım omurgası cephe boyunca kurgulandı; kapalı hacimler çekirdeğe alınarak gün ışığı maksimum kullanıldı.',
    yaklasim: [
      'Kapalı hacimler çekirdek çevresinde toplandı, açık ofis cepheye taşındı.',
      'Dolaşım omurgası cephe boyunca ilerletilerek gün ışığı koridora taşındı.',
      'Akustik, toplantı odalarında çift cam ara bölme ile çözüldü.',
      'Kablolama ve veri hattı, yükseltilmiş döşeme ile zeminde toplandı.',
    ],
    olculer: [
      { ad: 'Açık ofis', deger: '210 m² · yaklaşık 42 çalışma noktası' },
      { ad: 'Büyük toplantı odası', deger: '34 m² · 5,0 × 6,8 m' },
      { ad: 'Odak bölmeleri', deger: '4 × 4,5 m²' },
      { ad: 'Resepsiyon / karşılama', deger: '26 m²' },
      { ad: 'Dinlenme alanı', deger: '32 m²' },
      { ad: 'Akustik tavan yüksekliği', deger: '3,1 m (net)' },
    ],
    teknikler: [
      'Yerleşim ve dolaşım şeması',
      'Aks ve modülerlik planı (1,2 m ofis modülü)',
      'Elektrik ve veri yerleşim şeması',
      'Tavan planı ve aydınlatma hesabı',
      'Metraj ve mahal listesi',
    ],
    asamalar: [
      { ad: 'İhtiyaç analizi', aciklama: 'Departman sayıları ve çalışma biçimi haritalandı.', durum: 'Tamamlandı' },
      { ad: 'Planlama', aciklama: 'Üç bölge şeması karşılaştırıldı.', durum: 'Tamamlandı' },
      { ad: 'Teknik çizim', aciklama: '1/50 plan, tavan ve elektrik paftaları çizildi.', durum: 'Tamamlandı' },
      { ad: 'Revizyon', aciklama: 'Toplantı odası sayısı 3’ten 4’e çıkarıldı.', durum: 'Tamamlandı' },
      { ad: 'Teslim', aciklama: 'Uygulama seti ve metraj teslim edildi.', durum: 'Teslim edildi' },
    ],
    plan: { genislik: 24, derinlik: 20 },
    palet: { zemin: '#efeae1', duvar: '#35322f', vurgu: '#a37844' },
  },
  {
    slug: 'butik-otel',
    ad: 'Butik Otel',
    tur: 'Konsept Tasarım',
    konum: 'Temsilî — tarihi doku yakını',
    yil: '2026',
    alan: '760 m²',
    kat: '3 kat',
    ozet:
      'Avlulu bir taş yapının butik otele dönüşümü için konsept öneri. 14 oda, ortak avlu ve kahvaltı salonu; mevcut taş duvarlar açıkta bırakılarak yeni ekler bağımsız (beyaz/bronz) tutuldu.',
    yaklasim: [
      'Mevcut taş duvarlar korunarak yeni ekler ayrıştırıldı (kontrast ilkesi).',
      'Avlu, giriş ve kahvaltı arasında dağıtıcı çekirdek olarak çalışıyor.',
      'Her odada farklı bir pencere tipolojisi; tekrar değil çeşitlilik hedeflendi.',
      'Servis dolaşımı, misafir dolaşımından tamamen ayrıldı.',
    ],
    olculer: [
      { ad: 'Standart oda', deger: '22 m² · 3,6 × 6,1 m' },
      { ad: 'Süit', deger: '34 m² · 4,6 × 7,4 m' },
      { ad: 'Avlu', deger: '96 m²' },
      { ad: 'Kahvaltı salonu', deger: '58 m² · 6,6 × 8,8 m' },
      { ad: 'Resepsiyon', deger: '18 m²' },
      { ad: 'Oda sayısı', deger: '14 (12 standart + 2 süit)' },
    ],
    teknikler: [
      'Mevcut durum rölöve planı',
      'Konsept plan ve malzeme panosu',
      'Oda tipolojileri paftası',
      'Cephe müdahale şeması (korunacak / eklenecek)',
      '3D kütle ve avlu görselleri',
    ],
    asamalar: [
      { ad: 'Rölöve', aciklama: 'Mevcut yapı ölçülendirilerek sayısallaştırıldı.', durum: 'Tamamlandı' },
      { ad: 'Konsept', aciklama: 'İki farklı konfor düzeyi önerisi hazırlandı.', durum: 'Tamamlandı' },
      { ad: 'Teknik çizim', aciklama: 'Oda tipleri ve avlu planı çizildi.', durum: 'Tamamlandı' },
      { ad: '3D sunum', aciklama: 'Avlu ve süit görselleri üretildi.', durum: 'Tamamlandı' },
    ],
    plan: { genislik: 18, derinlik: 22 },
    palet: { zemin: '#e6dfd3', duvar: '#45403a', vurgu: '#b1874d' },
  },
  {
    slug: 'kafe-restoran',
    ad: 'Kafe ve Restoran',
    tur: 'İç Mekân',
    konum: 'Temsilî — kent merkezi',
    yil: '2024',
    alan: '180 m²',
    kat: 'Tek kat',
    ozet:
      'Mutfak-salon ilişkisini açık servis hattı üzerinden kuran bir kafe-restoran düzeni. Bar, giriş aksının sonunda konumlandırıldı; koltuk düzeni üç bölgede farklı oturma sürelerine göre ayrıldı.',
    yaklasim: [
      'Mutfak ile salon arasında geçirgen bir servis hattı kuruldu; sıcak servis kokusu bölgesi ayrıldı.',
      'Bar, mekânın odak noktası ve giriş aksının son durağı olarak konumlandı.',
      'Oturma bölgeleri ayrıldı: hızlı tüketim, uzun oturum, grup masaları.',
      'Akustik, ahşap lamel tavan ve yumuşak yüzeylerle dengelendi.',
    ],
    olculer: [
      { ad: 'Salon', deger: '96 m² · 8,0 × 12,0 m' },
      { ad: 'Bar', deger: '12 m uzunlukta tezgâh' },
      { ad: 'Mutfak', deger: '44 m²' },
      { ad: 'Depo / soğuk oda', deger: '12 m²' },
      { ad: 'WC bloğu', deger: '16 m² (2 engelli dahil)' },
      { ad: 'Kişi kapasitesi', deger: '68 (iç mekân)' },
    ],
    teknikler: [
      'Mobilya yerleşim planı',
      'Mutfak teçhizat planı ve servis akış şeması',
      'Aydınlatma ve tavan detayı',
      'Elektrik ve havalandırma koordinasyonu',
      'İç cephe ve bar detay çizimleri',
    ],
    asamalar: [
      { ad: 'Ölçüm', aciklama: 'Mevcut mekân ve tesisat altyapısı ölçüldü.', durum: 'Tamamlandı' },
      { ad: 'İhtiyaç analizi', aciklama: 'Menü yapısı ve servis yoğunluğu çıkarıldı.', durum: 'Tamamlandı' },
      { ad: 'Teknik çizim', aciklama: 'Yerleşim, tavan ve elektrik paftaları çizildi.', durum: 'Tamamlandı' },
      { ad: 'Revizyon', aciklama: 'Bar yüksekliği ve tezgâh derinliği ergonomiye göre düzeltildi.', durum: 'Tamamlandı' },
      { ad: 'Teslim', aciklama: 'Uygulama paftaları ve ekipman listesi teslim edildi.', durum: 'Teslim edildi' },
    ],
    plan: { genislik: 16, derinlik: 12 },
    palet: { zemin: '#eee5d7', duvar: '#312e2a', vurgu: '#a87c45' },
  },
  {
    slug: 'dubleks-ev',
    ad: 'Dubleks Ev',
    tur: 'Tadilat Projesi',
    konum: 'Temsilî — banliyö',
    yil: '2024',
    alan: '265 m²',
    kat: '2 kat (dubleks)',
    ozet:
      'Mevcut bir dubleksin taşıyıcı sisteme dokunmadan yeniden düzenlenmesi. Alt katta mutfak-salon bütünleşmesi, üst katta ebeveyn süiti ve çalışma odası yeniden kurgulandı; merdiven konumu korundu.',
    yaklasim: [
      'Taşıyıcı duvarlar sabit tutuldu; yalnızca dolgu duvarlar kaldırıldı.',
      'Merdiven korkuluğu camla yenilendi, iki kat arasında görsel süreklilik kuruldu.',
      'Alt kat ıslak hacimleri mevcut şaftlara bağlı kalarak büyütüldü.',
      'Enerji performansı için cephede yalıtım ve pencere değişimi önerildi.',
    ],
    olculer: [
      { ad: 'Salon + yemek', deger: '46 m²' },
      { ad: 'Mutfak', deger: '15 m² · 3,5 × 4,3 m' },
      { ad: 'Ebeveyn süiti', deger: '28 m² (oda + banyo + giyinme)' },
      { ad: 'Çalışma odası', deger: '12 m² · 3,0 × 4,0 m' },
      { ad: 'Merdiven', deger: '2,4 × 1,1 m · 16 rıht' },
      { ad: 'Toplam net alan', deger: '231 m²' },
    ],
    teknikler: [
      'Rölöve planı ve mevcut durum kesiti',
      'Yıkım / yapım paftası (renk kodlu)',
      'Yeni yerleşim planları (1/50)',
      'Cephe iyileştirme detayı',
      'Elektrik ve tesisat yenileme şeması',
    ],
    asamalar: [
      { ad: 'Rölöve', aciklama: 'Mevcut yapı iç ölçüleriyle belgelendi.', durum: 'Tamamlandı' },
      { ad: 'İhtiyaç analizi', aciklama: 'Aile ihtiyaçları ve sirkülasyon problemleri tespit edildi.', durum: 'Tamamlandı' },
      { ad: 'Ön tasarım', aciklama: 'Yıkım/yapım sınırları belirlendi.', durum: 'Tamamlandı' },
      { ad: 'Teknik çizim', aciklama: 'Yeni yerleşim ve detay paftaları çizildi.', durum: 'Tamamlandı' },
      { ad: 'Teslim', aciklama: 'Uygulama seti ve iş programı teslim edildi.', durum: 'Teslim edildi' },
    ],
    plan: { genislik: 15, derinlik: 10 },
    palet: { zemin: '#f0e9dd', duvar: '#3c3833', vurgu: '#94693c' },
  },
  {
    slug: 'karma-kullanimli-yapi',
    ad: 'Karma Kullanımlı Yapı',
    tur: 'Cephe Tasarımı',
    konum: 'Temsilî — ana arter köşesi',
    yil: '2026',
    alan: '2.850 m²',
    kat: '7 kat (zemin + 6)',
    ozet:
      'Zemin katta ticari, üst katta ofis kullanımı olan köşe parsel yapısının cephe tasarımı. Cephe, kullanım farkını ritim ve malzemeyle ayırır; köşe, kütlenin okunurluğunu artıracak biçimde boşaltılmıştır.',
    yaklasim: [
      'Zemin kat ve üst katlar cephede farklı ritimle ayrıştırıldı.',
      'Köşe boşaltılarak giriş ve dükkân vitrini görünür hale getirildi.',
      'İkinci cephede güneş kırıcı lameller, ısı yükünü azaltacak biçimde boyutlandırıldı.',
      'Kontrast malzeme (taş/dolgu panel) ile yapı ölçeği okunur kılındı.',
    ],
    olculer: [
      { ad: 'Ticari alan (zemin)', deger: '410 m²' },
      { ad: 'Ofis katı tipik', deger: '385 m² · kat başına' },
      { ad: 'Modül genişliği', deger: '1,35 m' },
      { ad: 'Kat yüksekliği', deger: '3,6 m (tipik)' },
      { ad: 'Güneş kırıcı derinliği', deger: '0,60 m' },
      { ad: 'Toplam inşaat alanı', deger: '2.850 m²' },
    ],
    teknikler: [
      'Cephe görünüşleri (1/50 ve 1/20 detay)',
      'Cephe kaplama ve birleşim detayları',
      'Lamel/kırıcı hesap tablosu',
      'Köşe detay ve düğüm çözümleri',
      '3D cephe ve gölge çalışması',
    ],
    asamalar: [
      { ad: 'Ön tasarım', aciklama: 'Üç cephe senaryosu kütle üzerinde denendi.', durum: 'Tamamlandı' },
      { ad: 'Teknik çizim', aciklama: '1/50 görünüşler ve 1/20 düğüm detayları çizildi.', durum: 'Tamamlandı' },
      { ad: 'Revizyon', aciklama: 'Lamel aralığı güneş açısına göre yeniden hesaplandı.', durum: 'Tamamlandı' },
      { ad: '3D sunum', aciklama: 'Köşe perspektifi ve gölge simülasyonu üretildi.', durum: 'Tamamlandı' },
      { ad: 'Teslim', aciklama: 'Cephe pafta seti ve malzeme tarifi teslim edildi.', durum: 'Teslim edildi' },
    ],
    plan: { genislik: 26, derinlik: 18 },
    palet: { zemin: '#eae3d8', duvar: '#2f2d29', vurgu: '#ab8049' },
  },
];

export function projeBul(slug: string): Proje | undefined {
  return projeler.find((p) => p.slug === slug);
}

export const hizmetler = [
  {
    ad: 'Mimari Proje Tasarımı',
    aciklama:
      'Arsa verisi ve kullanıcı ihtiyacından başlayan, kütle ve plan kararlarını birlikte kuran tasarım süreci. Avan proje ve uygulama aşamaları tek elden yürütülür.',
  },
  {
    ad: 'AutoCAD Teknik Çizimi',
    aciklama:
      'Kat planı, kesit, görünüş ve detay paftalarının ölçekli, katmanlı ve ölçülendirilmiş biçimde hazırlanması; pafta seti teslime hazır hale getirilir.',
  },
  {
    ad: '3D Modelleme ve Sunum',
    aciklama:
      'Kütle, dış mekân ve iç mekân modelleri; malzeme ve ışık denemeleriyle sunum görselleri. Karar vermeyi kolaylaştıran açı ve ışık varyasyonları.',
  },
  {
    ad: 'İç Mimari',
    aciklama:
      'Mobilya yerleşimi, malzeme seçimi, tavan ve aydınlatma planları; iç cephe açılımları ve uygulama detayları.',
  },
  {
    ad: 'Renovasyon ve Tadilat',
    aciklama:
      'Mevcut yapının rölövesi, yıkım-yapım sınırlarının belirlenmesi ve taşıyıcı sisteme dokunmadan yeni yerleşim kurgusu.',
  },
  {
    ad: 'Uygulama Projesi',
    aciklama:
      'İmalata esas ölçü, detay ve mahal listelerinin üretilmesi; statik ve mekanik projelerle koordinasyon kontrolü.',
  },
  {
    ad: 'Keşif ve Metraj',
    aciklama:
      'Paftalar üzerinden malzeme miktarlarının çıkarılması, mahal listesi ve yaklaşık maliyet tablosunun hazırlanması.',
  },
  {
    ad: 'Danışmanlık ve Proje Takibi',
    aciklama:
      'Tasarım kararlarında ikinci görüş, ruhsat sürecinde pafta kontrolü ve şantiye uyum takibi.',
  },
];

export const surec = [
  {
    ad: 'İlk Görüşme',
    aciklama: 'Beklenti, bütçe aralığı ve takvim konuşulur; işin kapsamı netleştirilir.',
  },
  {
    ad: 'İhtiyaç Analizi',
    aciklama: 'Kullanıcı profili, mekân ihtiyaçları ve arsa/yapı verileri çıkarılır.',
  },
  {
    ad: 'Ön Tasarım',
    aciklama: 'Kütle ve plan alternatifleri üretilir; iki ya da üç yön karşılaştırılır.',
  },
  {
    ad: 'Teknik Çizim',
    aciklama: 'Seçilen yön, ölçekli plan, kesit ve görünüşlere dönüştürülür.',
  },
  {
    ad: '3D Sunum',
    aciklama: 'Model ve görseller hazırlanır; tasarım mekân olarak okunur hale gelir.',
  },
  {
    ad: 'Revizyon',
    aciklama: 'Geri bildirimle ölçü, malzeme ve yerleşim düzeltmeleri yapılır.',
  },
  {
    ad: 'Proje Teslimi',
    aciklama: 'Pafta seti, metraj ve malzeme föyü teslim edilir; uygulama takibi başlar.',
  },
];

export const teknikCizimler = [
  {
    id: 'kat-plani',
    ad: 'Kat Planı',
    tur: 'Plan',
    aciklama: '1/50 ölçekli kat planı; aks çizgileri, duvar kalınlıkları ve mahal isimleri.',
  },
  {
    id: 'vaziyet-plani',
    ad: 'Vaziyet Planı',
    tur: 'Plan',
    aciklama: '1/500 ölçekli yerleşim planı; parsel sınırı, yapı oturumu ve kot bilgileri.',
  },
  {
    id: 'kesit',
    ad: 'Kesit Çizimi',
    tur: 'Kesit',
    aciklama: 'A-A kesiti; kat yükseklikleri, döşeme ve çatı kotları ölçülendirilmiş.',
  },
  {
    id: 'cephe',
    ad: 'Cephe Görünüşü',
    tur: 'Görünüş',
    aciklama: 'Kuzey cephesi görünüşü; kaplama ayrımı ve doğrama yerleşimi.',
  },
  {
    id: 'olculendirme',
    ad: 'Ölçülendirme Paftası',
    tur: 'Detay',
    aciklama: 'Genel ölçü çizgileri, modül ve aks aralıkları; ölçü zinciri kuralı.',
  },
  {
    id: 'kapi-pencere',
    ad: 'Kapı-Pencere Yerleşimi',
    tur: 'Detay',
    aciklama: 'Doğrama listesi, açılış yönleri ve denizlik kotları.',
  },
  {
    id: 'mobilya-plani',
    ad: 'Mobilya Planı',
    tur: 'Plan',
    aciklama: 'Sabit ve hareketli mobilya yerleşimi; kullanım mesafeleri.',
  },
  {
    id: 'elektrik',
    ad: 'Elektrik Yerleşim Şeması',
    tur: 'Tesisat',
    aciklama: 'Priz, anahtar, aydınlatma ve veri noktalarının yerleşimi.',
  },
];

export const iletisimBilgi = {
  eposta: 'studio@ateliermimarlik.example',
  telefon: '+90 (000) 000 00 00',
  adres: 'Temsilî stüdyo adresi — İstanbul',
  saatler: 'Pazartesi – Cuma, 09:00 – 18:00',
};
