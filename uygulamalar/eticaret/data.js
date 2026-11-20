/* ATELIER — Örnek ürün verisi (tamamen kurgusal: fiyat/stok/yorum).
   GÖRSELLER: projede duran yerel dosyalar (assets/img/*.jpg). Her biri tek tek
   gözle doğrulandı; ürün adı fotoğrafta görünen gerçek nesneyle eşleşir.
   Uzak CDN'e bağımlılık yok — çevrimdışı da açılır. */
const img = (dosya) => 'assets/img/' + dosya;
const G = {
  lambaGri:    img('l1.jpg'),   // gri metal masa/çalışma lambası, beyaz fon
  lambaAsma:   img('l3.jpg'),   // beyaz asma lamba, teal fon
  lambaBakir:  img('l4.jpg'),   // bakır sarkıt lambalar
  lambaSalon:  img('l5.jpg'),   // lambalı sıcak salon köşesi
  seramikSet:  img('s2.jpg'),   // kum + beyaz sırlı kâse/kupa seti
  comlekci:    img('s3.jpg'),   // çömlekçi tezgâhında elle şekillenen gövde
  kumasKanepe: img('s1.jpg'),   // keten yastıklı, hasır süslemeli sakin köşe
  kupa:        img('s4.jpg'),   // beyaz seramik kupa
  masa:        img('a1.jpg'),   // sandalye, yan sehpa, lamba — mobilya köşesi
  yesilKanepe: img('a2.jpg'),   // zeytin yeşili kadife kanepe
  berjer:      img('a3.jpg'),   // krem kapitone berjer
  salon:       img('hero.jpg'), // geniş salon (hero)
  atolye:      img('story.jpg') // atölye/hikâye görseli
};

const CATEGORIES = [
  { id: 'lambalar', ad: 'Masa Lambaları' },
  { id: 'seramik', ad: 'Seramik' },
  { id: 'aksesuar', ad: 'Mobilya Aksesuarları' },
  { id: 'yasan', ad: 'Yaşam Ürünleri' }
];

const PRODUCTS = [
  /* ---- MASA LAMBALARI ---- */
  { id: 'atl-001', ad: 'Lumen Çalışma Lambası', kategori: 'lambalar', fiyat: 2450, stok: 18,
    aciklama: 'Mat gri metal gövde, ayarlanabilir başlık. Işığı doğrudan masaya indirir; gece çalışmasının sessiz arkadaşıdır.',
    gorsel: G.lambaGri, galeri: [G.lambaGri, G.lambaSalon, G.masa],
    varyantlar: [{ tip: 'Renk', secenekler: ['Mat Gri', 'Antrasit', 'Kırık Beyaz'] }],
    puan: 4.8, yorum: 126, yeni: 1, populer: 1 },
  { id: 'atl-002', ad: 'Halo Sarkıt Lamba', kategori: 'lambalar', fiyat: 3190, stok: 9,
    aciklama: 'Beyaz emaye şapka, ince askı. Yemek masasının üstünde tek başına bir odak kurar; ışığı yumuşak bir kubbe gibi açar.',
    gorsel: G.lambaAsma, galeri: [G.lambaAsma, G.lambaBakir, G.lambaSalon],
    varyantlar: [{ tip: 'Renk', secenekler: ['Opal', 'Duman', 'Kum'] }],
    puan: 4.6, yorum: 74, yeni: 1, populer: 1 },
  { id: 'atl-003', ad: 'Bakır Üçlü Sarkıt', kategori: 'lambalar', fiyat: 4890, stok: 6,
    aciklama: 'Üç bakır başlık, farklı yükseklikte. Mutfak adasının üstüne kurulduğunda odaya sıcak bir ritim verir.',
    gorsel: G.lambaBakir, galeri: [G.lambaBakir, G.lambaAsma, G.lambaSalon],
    varyantlar: [{ tip: 'Renk', secenekler: ['Bakır', 'Pirinç'] }, { tip: 'Boy', secenekler: ['90 cm', '120 cm'] }],
    puan: 4.9, yorum: 88, populer: 1 },
  { id: 'atl-004', ad: 'Köşe Işık Seti', kategori: 'lambalar', fiyat: 2790, stok: 12,
    aciklama: 'Zemine yakın duran, yumuşak ışıklı ikili set. Karanlık bir köşeyi okuma köşesine çevirir.',
    gorsel: G.lambaSalon, galeri: [G.lambaSalon, G.lambaGri, G.masa],
    varyantlar: [{ tip: 'Renk', secenekler: ['Pirinç', 'Antrasit'] }],
    puan: 4.5, yorum: 41 },
  { id: 'atl-005', ad: 'Masa Işığı — Gri Seri', kategori: 'lambalar', fiyat: 1990, stok: 0,
    aciklama: 'Kompakt gövde, güçlü ama göz almayan ışık. Küçük masalarda bile yer kaplamaz.',
    gorsel: G.lambaGri, galeri: [G.lambaGri, G.masa, G.lambaSalon],
    varyantlar: [{ tip: 'Renk', secenekler: ['Mat Gri', 'Kum'] }],
    puan: 4.4, yorum: 33 },
  { id: 'atl-006', ad: 'Asma Sade Lamba', kategori: 'lambalar', fiyat: 2290, stok: 21,
    aciklama: 'Tek parça, tek renk, tek amaç: yukarıdan düşen dengeli ışık. Sade olanın uzun ömürlü olduğu yerdeyiz.',
    gorsel: G.lambaAsma, galeri: [G.lambaAsma, G.lambaSalon, G.lambaBakir],
    varyantlar: [{ tip: 'Renk', secenekler: ['Opal', 'Antrasit'] }, { tip: 'Boy', secenekler: ['Ø 30 cm', 'Ø 40 cm'] }],
    puan: 4.3, yorum: 29 },

  /* ---- SERAMİK ---- */
  { id: 'atl-007', ad: 'Kum & Beyaz Kâse Seti', kategori: 'seramik', fiyat: 1240, stok: 22,
    aciklama: 'Altı parça, iki sır: kum beji ve kırık beyaz. Sofraya tek renk yerine bir sohbet getirir.',
    gorsel: G.seramikSet, galeri: [G.seramikSet, G.kupa, G.comlekci],
    varyantlar: [{ tip: 'Boy', secenekler: ['4 parça', '6 parça', '8 parça'] }],
    puan: 4.9, yorum: 211, populer: 1 },
  { id: 'atl-008', ad: 'Mat Sırlı Kâse', kategori: 'seramik', fiyat: 890, stok: 34,
    aciklama: 'Kalın kenar, mat sır, içi hafif pürüzlü. Salatanın da, mendillerin de evi.',
    gorsel: G.seramikSet, galeri: [G.seramikSet, G.kupa, G.comlekci],
    varyantlar: [{ tip: 'Renk', secenekler: ['Kum', 'Kırık Beyaz', 'Antrasit'] }],
    puan: 4.5, yorum: 143, populer: 1 },
  { id: 'atl-009', ad: 'El Yapımı Kupa', kategori: 'seramik', fiyat: 640, stok: 48,
    aciklama: 'İnce kulplu, dengeli ağırlıklı kupa. Sabah kahvesi için tasarlandı; el onu hep aynı yerden tutar.',
    gorsel: G.kupa, galeri: [G.kupa, G.seramikSet, G.comlekci],
    varyantlar: [{ tip: 'Renk', secenekler: ['Beyaz', 'Bej', 'Zeytin'] }, { tip: 'Boy', secenekler: ['200 ml', '350 ml'] }],
    puan: 4.7, yorum: 318, populer: 1 },
  { id: 'atl-010', ad: 'Çömlekçi Serisi Vazo', kategori: 'seramik', fiyat: 1490, stok: 12,
    aciklama: 'Elle çekilmiş gövde, tek renk sır. Her biri biraz farklı — aynı elden çıkmış iki kardeş gibi.',
    gorsel: G.comlekci, galeri: [G.comlekci, G.seramikSet, G.kupa],
    varyantlar: [{ tip: 'Renk', secenekler: ['Toprak', 'Kum'] }],
    puan: 4.6, yorum: 64, yeni: 1 },
  { id: 'atl-011', ad: 'Beyaz Servis Kâsesi', kategori: 'seramik', fiyat: 980, stok: 19,
    aciklama: 'Geniş kenar, derin iç. Makarna, meyve, büyük salata — hepsini taşır, hiçbirini abartmaz.',
    gorsel: G.kupa, galeri: [G.kupa, G.seramikSet, G.comlekci],
    varyantlar: [{ tip: 'Boy', secenekler: ['S 22 cm', 'M 28 cm'] }],
    puan: 4.4, yorum: 42 },
  { id: 'atl-012', ad: 'Kum Sırlı Sunum Seti', kategori: 'seramik', fiyat: 1680, stok: 7,
    aciklama: 'Geniş tabak ve iki küçük kâseden oluşan set. Misafire de, tek başına akşam yemeğine de yetişir.',
    gorsel: G.seramikSet, galeri: [G.seramikSet, G.comlekci, G.kupa],
    varyantlar: [{ tip: 'Renk', secenekler: ['Kum', 'Kırık Beyaz'] }],
    puan: 4.8, yorum: 89, populer: 1 },

  /* ---- MOBİLYA AKSESUARLARI ---- */
  { id: 'atl-013', ad: 'Zeytin Kadife Kanepe', kategori: 'aksesuar', fiyat: 18900, stok: 4,
    aciklama: 'Zeytin tonu kadife, ince ahşap ayak. Odanın merkezini kimseyi zorlamadan alır.',
    gorsel: G.yesilKanepe, galeri: [G.yesilKanepe, G.masa, G.kumasKanepe],
    varyantlar: [{ tip: 'Renk', secenekler: ['Zeytin', 'Kum', 'Antrasit'] }, { tip: 'Boy', secenekler: ['2 kişilik', '3 kişilik'] }],
    puan: 4.9, yorum: 74, populer: 1 },
  { id: 'atl-014', ad: 'Krem Kapitone Berjer', kategori: 'aksesuar', fiyat: 9450, stok: 8,
    aciklama: 'Kapitone sırt, krem kumaş, ince ahşap ayak. Bir köşede okuma isteği uyandıran sandalye.',
    gorsel: G.berjer, galeri: [G.berjer, G.masa, G.kumasKanepe],
    varyantlar: [{ tip: 'Renk', secenekler: ['Krem', 'Kum'] }],
    puan: 4.7, yorum: 52 },
  { id: 'atl-015', ad: 'Keten Ruhlu Köşe', kategori: 'aksesuar', fiyat: 3890, stok: 15,
    aciklama: 'Sakin köşe kompozisyonu: keten yastık, hasır duvar süsü ve dekoratif detaylar. Bir odaya hava katan üçlü.',
    gorsel: G.kumasKanepe, galeri: [G.kumasKanepe, G.masa, G.salon],
    varyantlar: [{ tip: 'Renk', secenekler: ['Kum', 'Zeytin'] }],
    puan: 4.6, yorum: 57, yeni: 1 },
  { id: 'atl-016', ad: 'Ahşap Yan Sehpa', kategori: 'aksesuar', fiyat: 2990, stok: 11,
    aciklama: 'Tek gövde, üç ayak, doğal ahşap. Kitapların ve bir fincanın kendi alanını kurar.',
    gorsel: G.masa, galeri: [G.masa, G.berjer, G.kumasKanepe],
    varyantlar: [{ tip: 'Renk', secenekler: ['Açık Meşe', 'Ceviz'] }],
    puan: 4.8, yorum: 63 },
  { id: 'atl-017', ad: 'Sakin Köşe Kombin', kategori: 'aksesuar', fiyat: 6490, stok: 5,
    aciklama: 'Kanepe, sehpa ve lambayı birlikte düşünen kombin. Parça parça değil, bütün olarak kurulmuş bir oda köşesi.',
    gorsel: G.masa, galeri: [G.masa, G.salon, G.berjer],
    varyantlar: [{ tip: 'Renk', secenekler: ['SıcakTon', 'Nötr'] }],
    puan: 4.5, yorum: 21, yeni: 1 },
  { id: 'atl-018', ad: 'Dokuma Oturma Grubu', kategori: 'aksesuar', fiyat: 12400, stok: 3,
    aciklama: 'Doğal dokular, yumuşak oturma yüzeyi. Kalabalık ailelerin akşamlarını taşıyacak kadar sağlam.',
    gorsel: G.kumasKanepe, galeri: [G.kumasKanepe, G.salon, G.masa],
    varyantlar: [{ tip: 'Boy', secenekler: ['2+1', '3+1'] }],
    puan: 4.6, yorum: 38 },

  /* ---- YAŞAM ÜRÜNLERİ ---- */
  { id: 'atl-019', ad: 'Sabah Kupa İkilisi', kategori: 'yasan', fiyat: 540, stok: 52,
    aciklama: 'İki kupa, bir tabak. Kahvaltıyı yatağa değil, masaya taşıyan küçük bir ritüel.',
    gorsel: G.kupa, galeri: [G.kupa, G.seramikSet, G.kumasKanepe],
    varyantlar: [{ tip: 'Renk', secenekler: ['Beyaz', 'Kum'] }, { tip: 'Boy', secenekler: ['Tekli', 'İkili set'] }],
    puan: 4.8, yorum: 289, populer: 1 },
  { id: 'atl-020', ad: 'Masa Işıklı Akşam Seti', kategori: 'yasan', fiyat: 860, stok: 31,
    aciklama: 'Küçük lamba, sunum tabağı ve keten peçete. Masayı yumuşatan, akşamı uzatan üçlü.',
    // NUMEX-DÜZELTME (2026-11-19): 'Masa Işıklı Akşam Seti' (lamba + tabak + peçete) kartında geniş salon fotoğrafı kullanılıyordu; ürünün asıl nesnesi olan lambayı göstermek için doğrulanmış lamba görseline geçildi. Galeri çeşitliliği korundu.
    gorsel: G.lambaGri, galeri: [G.lambaGri, G.seramikSet, G.kupa],
    varyantlar: [{ tip: 'Renk', secenekler: ['Sıcak', 'Nötr'] }],
    puan: 4.7, yorum: 97, yeni: 1 },
  { id: 'atl-021', ad: 'Keten Sofra Örtüsü', kategori: 'yasan', fiyat: 410, stok: 0,
    aciklama: 'Ağır keten dokuma, sade kenar. Bardak sesini keser; sofrayı yumuşatır.',
    gorsel: G.kumasKanepe, galeri: [G.kumasKanepe, G.seramikSet, G.kupa],
    varyantlar: [{ tip: 'Renk', secenekler: ['Kum', 'Antrasit'] }, { tip: 'Boy', secenekler: ['140x140', '140x220'] }],
    puan: 4.4, yorum: 33 },
  { id: 'atl-022', ad: 'Dekoratif Servis Tepsisi', kategori: 'yasan', fiyat: 590, stok: 28,
    aciklama: 'Derin kenar, sade yüzey. Kahvaltıyı, mumları, dağınık küçük şeyleri toparlar.',
    gorsel: G.kupa, galeri: [G.kupa, G.seramikSet, G.lambaGri],
    varyantlar: [{ tip: 'Boy', secenekler: ['36x26 cm', '44x32 cm'] }],
    puan: 4.5, yorum: 61 },
  { id: 'atl-023', ad: 'Kadife Yastık Takımı', kategori: 'yasan', fiyat: 1290, stok: 10,
    aciklama: 'İki adet zeytin/kum yastık. Kanepenin ifadesini tek hamlede değiştiren küçük müdahale.',
    gorsel: G.yesilKanepe, galeri: [G.yesilKanepe, G.kumasKanepe, G.berjer],
    varyantlar: [{ tip: 'Renk', secenekler: ['Zeytin', 'Kum', 'Antrasit'] }, { tip: 'Boy', secenekler: ['45x45 cm', '50x70 cm'] }],
    puan: 4.4, yorum: 40 },
  { id: 'atl-024', ad: 'Başlangıç Ev Seti', kategori: 'yasan', fiyat: 2380, stok: 6,
    aciklama: 'Kupa, kâse, sürahi ve lambayı bir araya getiren yeni ev hediyesi. İlk akşamı kurmak için yeterli.',
    gorsel: G.seramikSet, galeri: [G.seramikSet, G.kupa, G.lambaSalon],
    varyantlar: [{ tip: 'Boy', secenekler: ['4 parça', '8 parça'] }],
    puan: 4.6, yorum: 24, yeni: 1 }
];

const COUPONS = {
  ATELIER10: { tip: 'yuzde', deger: 10, ad: 'ATELIER10 — uygun ürünlerde %10' }
};

const SHIPPING = {
  standart: { ad: 'Standart kargo (3-5 iş günü)', ucret: 79, esik: 2500 },
  hizli: { ad: 'Hızlı kargo (1-2 iş günü)', ucret: 149, esik: 5000 }
};
