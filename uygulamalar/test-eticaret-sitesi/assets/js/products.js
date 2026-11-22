/* ==========================================================================
   ATELIER — Ürün kataloğu (demo veri)
   Tüm ürünler, fiyatlar ve stoklar örnek veridir.
   ========================================================================== */

const CATEGORIES = [
  { id: 'aydinlatma', name: 'Aydınlatma', desc: 'Işığın sıcak hâli — masa, zemin ve sarkıt lambalar.' },
  { id: 'seramik', name: 'Seramik & Sofra', desc: 'Elde şekillenen toprak; vazo, kâse ve kupalar.' },
  { id: 'tekstil', name: 'Tekstil', desc: 'Keten, yün ve pamuk; dokunun sadeliği.' },
  { id: 'mobilya', name: 'Mobilya Aksesuarı', desc: 'Oturma, sehpa ve saklama parçaları.' },
  { id: 'koku', name: 'Koku & Atmosfer', desc: 'Mum, difüzör ve mekânın hafızası.' },
  { id: 'dekor', name: 'Dekor & Obje', desc: 'Boşluğu tamamlayan ince detaylar.' }
];

const PRODUCTS = [
  /* ---------------- AYDINLATMA ---------------- */
  {
    id: 'atl-001',
    name: 'Sarnıç Masa Lambası',
    category: 'aydinlatma',
    price: 3250,
    oldPrice: 3800,
    stock: 14,
    featured: true,
    bestseller: true,
    rating: 4.8,
    reviews: 42,
    short: 'Kırık beyaz opal cam gövde, sıcak 2700K ışık.',
    description:
      'Sarnıç, Anadolu’nun su kuyularındaki yumuşak yansımayı bir masa üstünde yeniden kuruyor. El üflemesi opal cam gövde, ışığı göz almayacak biçimde dağıtır; kubbe formu gece boyunca okumak için sakin bir aydınlık bırakır. Pirinç detaylar zamanla kendi patinasını kazanır.',
    images: [
      'assets/img/p-lamp-terracotta.jpg',
      'assets/img/p-lamp-ceramic.jpg',
      'assets/img/p-candle.jpg'
    ],
    variantType: 'color',
    variants: [
      { id: 'krem', label: 'Kireç Beyazı', color: '#efe9dc', stock: 8, priceDiff: 0 },
      { id: 'kum', label: 'Kum Beji', color: '#d8c7ae', stock: 4, priceDiff: 0 },
      { id: 'antrasit', label: 'Antrasit', color: '#2b2a27', stock: 2, priceDiff: 150 }
    ],
    material: 'Opal cam, pirinç, tekstil kablo',
    dimensions: 'Ø 24 cm · Y 36 cm',
    care: 'Nemli bezle siliniz. Aşındırıcı temizleyici kullanmayınız.'
  },
  {
    id: 'atl-002',
    name: 'Sahil Pirinç Aplik',
    category: 'aydinlatma',
    price: 2890,
    stock: 22,
    rating: 4.6,
    reviews: 28,
    short: 'Duvarda yumuşak bir çizgi bırakan sıcak pirinç aplik.',
    description:
      'Sahil, el işçiliğiyle dövülmüş ince pirinç gövdesi ve keten abajuruyla duvar yüzeyine yumuşak bir ışık çizgisi bırakır. Koridor ve başucu kullanımı için tasarlandı; kablosuz montaj aparatı ile birlikte gelir.',
    images: [
      'assets/img/p-lamp-brass.jpg',
      'assets/img/p-tray.jpg',
      'assets/img/p-mirror.jpg'
    ],
    variantType: 'size',
    variants: [
      { id: 'kucuk', label: 'Küçük · 22 cm', stock: 12, priceDiff: 0 },
      { id: 'orta', label: 'Orta · 30 cm', stock: 10, priceDiff: 320 }
    ],
    material: 'Pirinç, keten abajur',
    dimensions: 'G 22–30 cm · Y 26 cm',
    care: 'Pirinç parçayı kuru bezle siliniz; patina doğal sürecin parçasıdır.'
  },
  {
    id: 'atl-003',
    name: 'Terzi Çalışma Lambası',
    category: 'aydinlatma',
    price: 4180,
    oldPrice: 4650,
    stock: 9,
    featured: true,
    rating: 4.9,
    reviews: 61,
    short: 'Ayarlanabilir kol, deri kaplı gövde, odaklanmış ışık.',
    description:
      'Terzi, atölyelerdeki eski makas lambalarından ilham alıyor. Eklemli pirinç kol, istediğiniz noktaya yönlenir; deri kaplı sap elinizde sıcak bir his bırakır. Çalışma masası ve başucu için ideal; 5 kademeli ışık ayarına sahiptir.',
    images: [
      'assets/img/p-lamp-arc.jpg',
      'assets/img/p-lamp-terracotta.jpg',
      'assets/img/p-lamp-ceramic.jpg'
    ],
    variantType: 'color',
    variants: [
      { id: 'bakir', label: 'Sıcak Bakır', color: '#a8643c', stock: 5, priceDiff: 0 },
      { id: 'yesil-pirinc', label: 'Adaçayı Pirinç', color: '#7e8a75', stock: 3, priceDiff: 0 },
      { id: 'siyah', label: 'Mat Siyah', color: '#211f1d', stock: 1, priceDiff: 0 }
    ],
    material: 'Pirinç, dana derisi, tekstil kablo',
    dimensions: 'Y 42 cm · Kol 55 cm',
    care: 'Deri kısmı nemli bezle siliniz, doğrudan güneş ışığından koruyunuz.'
  },
  {
    id: 'atl-004',
    name: 'Hale Sarkıt',
    category: 'aydinlatma',
    price: 5400,
    stock: 0,
    rating: 4.7,
    reviews: 19,
    short: 'Kağıt inceliğinde abajur; yemek masasının üzerinde bir hale.',
    description:
      'Hale, yemek masasının üstünde neredeyse hiç ağırlık hissi bırakmayan bir sarkıt. Titanyum kaplı ince abajur, ışığı yumuşak bir disk hâlinde aşağı bırakır. Yükseklik ayarlı askı sistemi ve dokuma kablo ile gelir.',
    images: [
      'assets/img/p-lamp-ceramic.jpg',
      'assets/img/p-lamp-brass.jpg',
      'assets/img/p-tray.jpg'
    ],
    variantType: 'size',
    variants: [
      { id: 's-45', label: 'Ø 45 cm', stock: 0, priceDiff: 0 },
      { id: 'm-60', label: 'Ø 60 cm', stock: 0, priceDiff: 890 }
    ],
    material: 'Titanyum kaplı alüminyum, dokuma kablo',
    dimensions: 'Ø 45–60 cm',
    care: 'Tozunu yumuşak bir bezle alınız.'
  },
  {
    id: 'atl-005',
    name: 'Şafak Zemin Lambası',
    category: 'aydinlatma',
    price: 6750,
    stock: 6,
    featured: true,
    rating: 4.8,
    reviews: 33,
    short: 'İnce kemerli gövde, yukarıdan yayılan sıcak ışık.',
    description:
      'Salonun bir köşesinde duran, ama akşamla birlikte ruhu değişen bir zemin lambası. İnce kemerli metal gövde yükseldikçe hafifler; abajurundan yayılan ışık, koltuğun arkasında yumuşak bir hale bırakır. Kitap okurken ya da sadece otururken odayı tamamlar.',
    // NUMEX-DÜZELTME (2026-11-22): Metin görseldeki kemerli zemin lambasına uymuyordu (anodize/aşağı bakan); ürünün gerçek görünümüne göre yazıldı.
    images: [
      'assets/img/p-throw-cls.jpg',
      'assets/img/p-mirror.jpg',
      'assets/img/p-cup-set.jpg'
    ],
    variantType: 'color',
    variants: [
      { id: 'antrasit', label: 'Antrasit', color: '#2b2a27', stock: 4, priceDiff: 0 },
      { id: 'kum', label: 'Kum Beji', color: '#cdbb9f', stock: 2, priceDiff: 0 }
    ],
    material: 'Anodize alüminyum, pamuk kablo',
    dimensions: 'Y 148 cm · Ø 34 cm',
    care: 'Kuru bezle siliniz.'
  },

  /* ---------------- SERAMİK & SOFRA ---------------- */
  {
    id: 'atl-006',
    name: 'Toprak Vazo — Uzun',
    category: 'seramik',
    price: 1780,
    stock: 26,
    featured: true,
    bestseller: true,
    rating: 4.9,
    reviews: 74,
    short: 'Elde çekilmiş, kırık beyaz sırlı uzun vazo.',
    description:
      'Çanak çömlek tezgâhında tek tek çekilen Toprak Vazo, dalgalı yüzeyiyle zanaatkârın ellerinin izini taşır. Mat kırık beyaz sır, ışığı yumuşak tutar. Kurutulmuş dallar ya da tek bir dal için biçilmiş kaftan.',
    images: [
      'assets/img/p-vase-cer.jpg',
      'assets/img/p-vase-matte.jpg',
      'assets/img/p-tray.jpg'
    ],
    variantType: 'size',
    variants: [
      { id: 'kisa', label: 'Kısa · 28 cm', stock: 13, priceDiff: -280 },
      { id: 'uzun', label: 'Uzun · 42 cm', stock: 13, priceDiff: 0 }
    ],
    material: 'Stoneware kil, mat sır',
    dimensions: '28 ve 42 cm · Ø 16 cm',
    care: 'El yıkaması önerilir. Bulaşık makinesi için uygun değildir.'
  },
  {
    id: 'atl-007',
    name: 'Kum Kâse Seti',
    category: 'seramik',
    price: 2240,
    stock: 18,
    rating: 4.7,
    reviews: 51,
    short: 'Dört parça, kum dokulu servis kâsesi.',
    description:
      'Sabah yulafından akşam meyvesine kadar masanın sürekli kullanılan dört kâsesi. Kum dokulu dış yüzey avuca oturur, iç yüzey parlak sır ile kolayca temizlenir. Her sette ton farkı, el işinin doğal imzasıdır.',
    images: [
      'assets/img/p-bowl-set.jpg',
      'assets/img/p-plate.jpg',
      'assets/img/p-cup2.jpg'
    ],
    variantType: 'color',
    variants: [
      { id: 'kum', label: 'Kum Beji', color: '#d8c7ae', stock: 10, priceDiff: 0 },
      { id: 'kireç', label: 'Kireç Beyazı', color: '#efe9dc', stock: 5, priceDiff: 0 },
      { id: 'kil', label: 'Kil Kırmızısı', color: '#a8664e', stock: 3, priceDiff: 120 }
    ],
    material: 'Stoneware kil, reaktif sır',
    dimensions: 'Ø 14 cm · 4 parça',
    care: 'Bulaşık makinesinde yıkanabilir.'
  },
  {
    id: 'atl-008',
    name: 'Kupa Takımı — İkili',
    category: 'seramik',
    price: 1290,
    oldPrice: 1490,
    stock: 31,
    bestseller: true,
    rating: 4.6,
    reviews: 96,
    short: 'Sabah kahvesi için kalın kenarlı, iki kupa.',
    description:
      'Kalın kenarı ile ısıyı uzun süre koruyan, avuca tam oturan iki kupa. Pürüzsüz gövde, hafif dışa kıvrımlı ağız ile fincandan çıkarken yudumu yönlendirir. Filtre kahve ve Türk kahvesi için ideal hacim.',
    images: [
      'assets/img/p-cup-set.jpg',
      'assets/img/p-cup2.jpg',
      'assets/img/p-plate.jpg'
    ],
    variantType: 'color',
    variants: [
      { id: 'kireç', label: 'Kireç Beyazı', color: '#efe9dc', stock: 16, priceDiff: 0 },
      { id: 'halo', label: 'Halo Mavi', color: '#8fa6b4', stock: 9, priceDiff: 0 },
      { id: 'toprak', label: 'Toprak', color: '#8c6247', stock: 6, priceDiff: 80 }
    ],
    material: 'Porselen, parlak sır',
    dimensions: '220 ml · 2 parça',
    care: 'Bulaşık makinesi ve mikrodalga uygundur.'
  },
  {
    id: 'atl-009',
    name: 'Sini Servis Tabağı',
    category: 'seramik',
    price: 1680,
    stock: 12,
    rating: 4.5,
    reviews: 24,
    short: 'Geniş, düşük kenarlı sunum tabağı.',
    description:
      'Sini, ortaya konan her yemeği bir sunuma dönüştürür. Düşük kenar, mezelerin ve meyvelerin tabağın sınırlarını aşmasına izin verir. Hafif eğimli yüzey, yemeğin suyunu tabağın ortasında tutar.',
    images: [
      'assets/img/p-plate.jpg',
      'assets/img/p-bowl-set.jpg',
      'assets/img/p-cup-set.jpg'
    ],
    variantType: 'size',
    variants: [
      { id: 'orta', label: 'Ø 28 cm', stock: 7, priceDiff: 0 },
      { id: 'buyuk', label: 'Ø 36 cm', stock: 5, priceDiff: 420 }
    ],
    material: 'Stoneware kil, mat sır',
    dimensions: 'Ø 28–36 cm',
    care: 'Bulaşık makinesinde yıkanabilir; ani ısı değişiminden kaçınınız.'
  },
  {
    id: 'atl-010',
    name: 'Küp Vazo',
    category: 'seramik',
    price: 1450,
    stock: 20,
    rating: 4.7,
    reviews: 37,
    short: 'Sade form, geniş gövde; tek dal için.',
    description:
      'Küp Vazo, sade bir formun ne kadar çok şey anlatabileceğinin kanıtı. Geniş gövdesi suyun hacmini artırır, dar boynu dalları düzenli tutar. Tek bir kuru dal için tasarlanmış, sakin bir obje.',
    images: [
      'assets/img/p-vase-matte.jpg',
      'assets/img/p-vase-bud2.jpg',
      'assets/img/p-candle.jpg'
    ],
    variantType: 'color',
    variants: [
      { id: 'kireç', label: 'Kireç Beyazı', color: '#efe9dc', stock: 12, priceDiff: 0 },
      { id: 'antrasit', label: 'Antrasit', color: '#3a3833', stock: 8, priceDiff: 0 }
    ],
    material: 'El yapımı stoneware',
    dimensions: 'Y 24 cm · Ø 15 cm',
    care: 'Ilık suyla elde yıkayınız.'
  },
  {
    id: 'atl-011',
    name: 'Tomurcuk Vazo',
    category: 'seramik',
    price: 890,
    stock: 4,
    rating: 4.4,
    reviews: 15,
    short: 'Tek çiçek için küçük, mat seramik vazo.',
    description:
      'Bir tek çiçeğin bile bir mekânı değiştirdiğine inananlar için. Tomurcuk, başucunda ya da çalışma masasında duran küçük bir vazo. Mat yüzeyi toz tutmaz, sade formu her stille uyum sağlar.',
    images: [
      'assets/img/p-vase-bud2.jpg',
      'assets/img/p-vase-cer.jpg',
      'assets/img/p-candle.jpg'
    ],
    variantType: 'color',
    variants: [
      { id: 'kireç', label: 'Kireç Beyazı', color: '#f0ebe0', stock: 3, priceDiff: 0 },
      { id: 'kil', label: 'Kil Kırmızısı', color: '#a8664e', stock: 1, priceDiff: 0 }
    ],
    material: 'Stoneware kil, mat sır',
    dimensions: 'Y 15 cm · Ø 8 cm',
    care: 'Ilık suyla elde yıkayınız.'
  },

  /* ---------------- TEKSTİL ---------------- */
  {
    id: 'atl-012',
    name: 'Keten Yastık Kılıfı',
    category: 'tekstil',
    price: 720,
    stock: 40,
    featured: true,
    rating: 4.8,
    reviews: 112,
    short: 'Yıkanmış keten, çift dikiş; her yıkamada daha yumuşak.',
    description:
      'Yıkanmış keten, ilk kullanımda değil, her yıkamada daha çok sevilen bir malzeme. Çift dikişli kenarları yıllarca formunu korur; gizli fermuar çıkarılıp takmayı kolaylaştırır. Yastık içi ayrıca satılır, kılıf tek olarak gönderilir.',
    images: [
      'assets/img/p-cushion2.jpg',
      'assets/img/p-chair.jpg',
      'assets/img/p-throw3.jpg'
    ],
    variantType: 'color',
    variants: [
      { id: 'kum', label: 'Kum Beji', color: '#d8c7ae', stock: 15, priceDiff: 0 },
      { id: 'kireç', label: 'Kireç Beyazı', color: '#efe9dc', stock: 14, priceDiff: 0 },
      { id: 'antrasit', label: 'Antrasit', color: '#33312d', stock: 11, priceDiff: 0 }
    ],
    material: '%100 keten',
    dimensions: '50×50 cm',
    care: '30°C’de yıkayınız, düşük ısıda ütüleyiniz.'
  },
  {
    id: 'atl-013',
    name: 'Dokuma Örtü',
    category: 'tekstil',
    price: 1650,
    stock: 15,
    bestseller: true,
    rating: 4.7,
    reviews: 58,
    short: 'El tezgâhında dokunmuş, yumuşak yün karışımı örtü.',
    description:
      'Dokuma Örtü, elde çalışan tezgâhlarda yapılan hafif dokulu bir örtü. Koltuk arkalığına atıldığında ya da yatak ucunda katlandığında mekâna sıcaklık katar. Yün-pamuk karışımı iplik, yıllar içinde daha da yumuşar. Ambalajında katlı olarak gönderilir.',
    // NUMEX-DÜZELTME (2026-11-22): 'çizgili/püsküllü' tanımı elde püskül detayı olmayan görselle çelişiyordu.
    // NUMEX-DÜZELTME (2026-11-22): Örtü görseli çizgili/püsküllü olduğu için tanım buna göre netleştirildi.
    images: [
      'assets/img/p-throw3.jpg',
      'assets/img/p-cushion2.jpg',
      'assets/img/p-side-table.jpg'
    ],
    variantType: 'size',
    variants: [
      { id: 'koltuk', label: '130×180 cm', stock: 9, priceDiff: 0 },
      { id: 'yatak', label: '180×240 cm', stock: 6, priceDiff: 640 }
    ],
    material: '%70 yün, %30 pamuk',
    dimensions: '130×180 · 180×240 cm',
    care: 'Kuru temizleme önerilir.'
  },
  {
    id: 'atl-014',
    name: 'Pamuk Banyo Havlusu',
    category: 'tekstil',
    price: 590,
    stock: 52,
    rating: 4.6,
    reviews: 84,
    short: 'Uzun elyaflı pamuk, hızlı kuruyan dokuma.',
    description:
      'Uzun elyaflı Türk pamuğundan dokunan havlu, ilk dokunuşta yumuşak, kullanımda emici. Sık dokuması sayesinde çabuk kurur, günlerce nem tutmaz. Günlük kullanım için ideal gramaj; yıkandıkça tüy dökmez, rengini korur.',
    // NUMEX-DÜZELTME (2026-11-22): 'bakır çizgi' iddiası görselde yok; dokunun gerçek özelliklerine göre yazıldı.
    images: [
      'assets/img/p-throw-cls.jpg',
      'assets/img/p-throw3.jpg',
      'assets/img/p-cushion2.jpg'
    ],
    variantType: 'color',
    variants: [
      { id: 'kireç', label: 'Kireç Beyazı', color: '#f3efe6', stock: 20, priceDiff: 0 },
      { id: 'kum', label: 'Kum Beji', color: '#d6c4a9', stock: 18, priceDiff: 0 },
      { id: 'bakir', label: 'Bakır Şerit', color: '#a8643c', stock: 14, priceDiff: 60 }
    ],
    material: '%100 Türk pamuğu',
    dimensions: '70×140 cm',
    care: '60°C’de yıkayınız; yumuşatıcı kullanmayınız.'
  },

  /* ---------------- MOBİLYA AKSESUARI ---------------- */
  {
    id: 'atl-015',
    name: 'Hasır Berjer',
    category: 'mobilya',
    price: 12400,
    oldPrice: 13900,
    stock: 5,
    featured: true,
    rating: 4.9,
    reviews: 27,
    short: 'Meşe iskelet, hasır örgü sırt; krem kumaş minder.',
    description:
      'Hasır Berjer, geleneksel örgü tekniğini çağdaş bir oturma ölçüsüyle birleştiriyor. Meşe iskelet, elle örülmüş hasır sırt ve çıkarılabilir kılıflı krem minder. Köşede okumak için tasarlandı; oturma yüksekliği ergonomik.',
    images: [
      'assets/img/p-chair.jpg',
      'assets/img/p-throw3.jpg',
      'assets/img/p-mirror.jpg'
    ],
    variantType: 'color',
    variants: [
      { id: 'krem', label: 'Krem Keten', color: '#e8e1d2', stock: 3, priceDiff: 0 },
      { id: 'antrasit', label: 'Antrasit Keten', color: '#3a3833', stock: 2, priceDiff: 0 }
    ],
    material: 'Meşe, doğal hasır, keten kılıf',
    dimensions: 'G 72 · D 78 · Y 84 cm',
    care: 'Hasır kısmı yumuşak fırça ile tozdan arındırınız.'
  },
  {
    id: 'atl-016',
    name: 'Meşe Yan Sehpa',
    category: 'mobilya',
    price: 3680,
    stock: 11,
    rating: 4.7,
    reviews: 44,
    short: 'Masif meşe, yağ cilalı; üç ayaklı denge.',
    description:
      'Meşe Yan Sehpa, kanepeden çok uzakta olmayan, çayınızı ve kitabınızı yanınızda tutan bir parça. Masif meşenin damarı her parçada farklıdır; yağ cilası dokunun sıcak kalmasını sağlar. Üç ayaklı taban, sarsıntısız durur.',
    images: [
      'assets/img/p-throw3.jpg',
      'assets/img/p-chair.jpg',
      'assets/img/p-cushion2.jpg'
    ],
    variantType: 'size',
    variants: [
      { id: 'kucuk', label: 'Ø 40 cm', stock: 6, priceDiff: 0 },
      { id: 'buyuk', label: 'Ø 52 cm', stock: 5, priceDiff: 780 }
    ],
    material: 'Masif meşe, doğal yağ cilası',
    dimensions: 'Y 52 cm · Ø 40–52 cm',
    care: 'Nemli bezle siliniz; su lekelerini hemen kurulayınız.'
  },

  /* ---------------- KOKU & ATMOSFER ---------------- */
  {
    id: 'atl-017',
    name: 'Reçine & Sedir Mumu',
    category: 'koku',
    price: 640,
    stock: 64,
    bestseller: true,
    featured: true,
    rating: 4.8,
    reviews: 168,
    short: 'Soya mumu, pamuk fitil; 45 saat yanma.',
    description:
      'Reçine & Sedir, evin kapısından girildiğinde ilk hissedilen kokuyu hatırlatır: çam ormanından gelen nemli hava. Soya mumu, pamuk fitil ve el dökümü seramik kap. Fitili kısa tutmak yanma süresini uzatır.',
    images: [
      'assets/img/p-candle.jpg',
      'assets/img/p-diffuser.jpg',
      'assets/img/p-vase-cer.jpg'
    ],
    variantType: 'size',
    variants: [
      { id: 'kucuk', label: '180 g · 30 saat', stock: 34, priceDiff: -190 },
      { id: 'buyuk', label: '320 g · 45 saat', stock: 30, priceDiff: 0 }
    ],
    material: 'Soya mumu, pamuk fitil, seramik kap',
    dimensions: '180 g / 320 g',
    care: 'Her yakışta yüzey tamamen eriyene kadar bekleyiniz.'
  },
  {
    id: 'atl-018',
    name: 'Amber Oda Difüzörü',
    category: 'koku',
    price: 960,
    stock: 28,
    rating: 4.6,
    reviews: 52,
    short: 'Amber, vanilya ve sandal; 90 gün süren koku.',
    description:
      'Amber difüzör, kokusunu acele etmeden yayan bir parça. Rattan çubuklar doğal buharlaşmayla havayı yumuşatır; amber ve sandal notaları mekânı bir süre sonra kendi havasıyla sarar. Cam şişe, kapağıyla birlikte yeniden kullanılabilir.',
    images: [
      'assets/img/p-diffuser.jpg',
      'assets/img/p-candle.jpg',
      'assets/img/p-tray.jpg'
    ],
    variantType: 'color',
    variants: [
      { id: 'amber', label: 'Amber', color: '#b07d4a', stock: 16, priceDiff: 0 },
      { id: 'tutsu', label: 'Tütsü', color: '#6d6156', stock: 12, priceDiff: 0 }
    ],
    material: 'Parfüm yağı, rattan, cam',
    dimensions: '200 ml',
    care: 'Doğrudan güneş ışığından uzak tutunuz.'
  },

  /* ---------------- DEKOR & OBJE ---------------- */
  {
    id: 'atl-019',
    name: 'Pirinç Servis Tepsisi',
    category: 'dekor',
    price: 1890,
    oldPrice: 2100,
    stock: 16,
    rating: 4.7,
    reviews: 39,
    short: 'Elle dövülmüş pirinç, yükseltilmiş kenar.',
    description:
      'Pirinç Servis Tepsisi, sabah kahvesini yatağa taşımanın en zarif yolu. Elle dövülmüş yüzeyi ışığı parçalı yansıtır; yükseltilmiş kenar fincanların kaymasını önler. Yıllar içinde koyulaşan patina doğaldır.',
    images: [
      'assets/img/p-tray.jpg',
      'assets/img/editorial-2.jpg',
      'assets/img/p-mirror.jpg'
    ],
    variantType: 'color',
    variants: [
      { id: 'pirinc', label: 'Pirinç', color: '#b08b57', stock: 10, priceDiff: 0 },
      { id: 'gumus', label: 'Mat Gümüş', color: '#b8b6b0', stock: 6, priceDiff: 140 }
    ],
    material: 'Pirinç / bakır alaşım',
    dimensions: '42×28 cm',
    care: 'Ilık sabunlu suyla silinip hemen kurulanmalıdır.'
  },
  {
    id: 'atl-020',
    name: 'Sessiz Duvar Aynası',
    category: 'dekor',
    price: 4950,
    stock: 7,
    rating: 4.8,
    reviews: 21,
    short: 'İnce pirinç çerçeve, yumuşak kenar.',
    description:
      'Sessiz Ayna, mekânı büyütmenin en çok bilinen ama en az uygulanan yolunu hatırlatır. İnce pirinç çerçeve, aynayı bir mobilyadan çok bir pencereye yaklaştırır. Arka askı sistemi ile duvara tam oturur.',
    images: [
      'assets/img/p-mirror.jpg',
      'assets/img/p-throw-cls.jpg',
      'assets/img/p-tray.jpg'
    ],
    variantType: 'size',
    variants: [
      { id: 'dikey', label: '60×90 cm', stock: 4, priceDiff: 0 },
      { id: 'genis', label: '90×120 cm', stock: 3, priceDiff: 1450 }
    ],
    material: 'Pirinç çerçeve, gümüş kaplama cam',
    dimensions: '60×90 · 90×120 cm',
    care: 'Cam için alkolsüz temizleyici kullanınız.'
  },
  {
    id: 'atl-021',
    name: 'Oyulmuş Köşe Objesi',
    category: 'dekor',
    price: 1120,
    stock: 2,
    rating: 4.3,
    reviews: 11,
    short: 'Elde oyulmuş ceviz; kitapların arasında bir sır.',
    description:
      'Köşe Objesi, bir kitabın sayfaları arasında kalmaktansa masanın üzerinde durmayı seçer. Elde oyulan ceviz, yüzeyindeki ince çizgilerle ışığı kırar. Tekil üretim olduğu için her parça biraz farklı.',
    images: [
      'assets/img/p-vase-cer.jpg',
      'assets/img/p-vase-matte.jpg',
      'assets/img/p-vase-bud2.jpg'
    ],
    variantType: null,
    variants: [],
    material: 'Masif ceviz',
    dimensions: '12×9×6 cm',
    care: 'Ara sıra doğal yağ ile besleyiniz.'
  },
  {
    id: 'atl-022',
    name: 'Keten Masa Runner',
    category: 'tekstil',
    price: 480,
    stock: 0,
    rating: 4.5,
    reviews: 33,
    short: 'Ham keten, düz dikiş; masanın ortasına bir çizgi.',
    description:
      'Masa Runner, sofranın ortasından geçen sade bir keten çizgisi. Ham keten, kırışmayı bir kusur değil, karakter olarak taşır. Yemek sonrası makinaya atılır, kurutmaya gerek kalmadan düzleşir.',
    images: [
      'assets/img/p-throw-cls.jpg',
      'assets/img/p-cushion2.jpg',
      'assets/img/p-throw3.jpg'
    ],
    variantType: 'color',
    variants: [
      { id: 'ham', label: 'Ham Keten', color: '#cbb9a0', stock: 0, priceDiff: 0 },
      { id: 'antrasit', label: 'Antrasit', color: '#3a3833', stock: 0, priceDiff: 0 }
    ],
    material: '%100 keten',
    dimensions: '40×180 cm',
    care: '30°C’de yıkayınız.'
  },

  /* ---------------- AYDINLATMA (devam) ---------------- */
  {
    id: 'atl-023',
    name: 'Çalışma Masası Lambası — Mat',
    category: 'aydinlatma',
    price: 2340,
    stock: 19,
    rating: 4.5,
    reviews: 47,
    short: 'Açık renkli gövde, yumuşak ışıklı masa lambası.',
    description:
      'Sade bir form, doğru açıyla yerleştirildiğinde bir çalışma masasının en önemli parçası olabilir. Açık renkli gövde ışığı yumuşatır, masanın üzerinde sakin bir aydınlık bırakır. Okumak, yazmak ya da sadece düşünmek için.',
    // NUMEX-DÜZELTME (2026-11-22): 'Mat metal gövde' tanımı görseldeki açık renkli lambayla çelişiyordu.
    images: [
      'assets/img/p-lamp-arc.jpg',
      'assets/img/p-lamp-terracotta.jpg',
      'assets/img/p-lamp-paper.jpg'
    ],
    variantType: 'color',
    variants: [
      { id: 'antrasit', label: 'Antrasit', color: '#2b2a27', stock: 11, priceDiff: 0 },
      { id: 'kireç', label: 'Kireç Beyazı', color: '#efe9dc', stock: 8, priceDiff: 0 }
    ],
    material: 'Mat boyalı metal, dokunmatik dimmer',
    dimensions: 'Y 45 cm · Ø 14 cm',
    care: 'Kuru bezle siliniz.'
  },
  {
    id: 'atl-024',
    name: 'Keten Perde — Çift Kanat',
    category: 'tekstil',
    price: 1180,
    stock: 23,
    rating: 4.4,
    reviews: 29,
    short: 'Işığı süzen hafif keten; iki kanat.',
    description:
      'Keten Perde, gün ışığını kesmek yerine yumuşatır. Hafif dokusu sayesinde odanın içine bir sis inceliği katar. Pile bandı ile monte edilir; çift kanat olarak gönderilir. Yıkandıkça yumuşar, rengini korur.',
    images: [
      'assets/img/p-throw-cls.jpg',
      'assets/img/p-cushion2.jpg',
      'assets/img/p-mirror.jpg'
    ],
    variantType: 'size',
    variants: [
      { id: '140', label: '140×260 cm', stock: 12, priceDiff: 0 },
      { id: '200', label: '200×260 cm', stock: 11, priceDiff: 380 }
    ],
    material: '%100 keten',
    dimensions: '140 / 200 × 260 cm',
    care: '30°C hassas yıkama; hafif nemli ütüleyiniz.'
  }
];

/* Kampanyalar — indirim kodu demo amaçlıdır */
const COUPONS = [
  { code: 'ATELIER10', type: 'percent', value: 10, label: 'Tüm sepet', minTotal: 0 },
  { code: 'HOSGELDIN', type: 'fixed', value: 250, label: '250 TL indirim', minTotal: 2500 },
  { code: 'KARGOBEDAVA', type: 'shipping', value: 0, label: 'Kargo ücretsiz', minTotal: 0 }
];

/* Kargo kuralları */
const SHIPPING = {
  freeThreshold: 2500,       // bu tutar ve üzeri standart kargo ücretsiz
  standard: 89,
  express: 189,
  standardDays: '2–4 iş günü',
  expressDays: '1–2 iş günü'
};

function getProduct(id) {
  return PRODUCTS.find(p => p.id === id);
}

function getCategory(id) {
  return CATEGORIES.find(c => c.id === id);
}

function variantTotalStock(product) {
  if (!product.variants || !product.variants.length) return product.stock;
  return product.variants.reduce((s, v) => s + v.stock, 0);
}

function priceFor(product, variantId) {
  const v = (product.variants || []).find(x => x.id === variantId);
  return product.price + (v && v.priceDiff ? v.priceDiff : 0);
}

function stockFor(product, variantId) {
  if (!product.variants || !product.variants.length) return product.stock;
  const v = product.variants.find(x => x.id === variantId);
  return v ? v.stock : 0;
}

function formatTL(n) {
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(Math.round(n));
}

function formatTL2(n) {
  return new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n) + ' TL';
}
