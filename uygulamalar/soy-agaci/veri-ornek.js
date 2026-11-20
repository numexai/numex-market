/* NUMEX KÖKLER — Örnek aile verisi (tamamen hayalî, tam 60 kişi, 5 kuşak)
   Gerçek kişi, gerçek TC kimlik veya gerçek aile kaydı İÇERMEZ.
   Şema:
     kisi: { id, ad, soyad, cinsiyet:'E'|'K', dogum, olum|null, yer, anneId, babaId, hikaye }
       dogum/olum: "YYYY" ya da "YYYY-AA-GG"
     evlilik: { id, a, b, baslangic, bitis|null }   // bitis dolu ise boşanma
   Soyadı kuralı: doğum soyadı, babanın soyadıdır (evlenen kadın kayıtta kendi
   doğum soyadıyla görünür) — böylece soy ağacı soyadından değil graftan okunur.
*/
const ORNEK_AILE = (function () {
  const k = (id, ad, soyad, cinsiyet, dogum, olum, yer, anneId, babaId, hikaye) =>
    ({ id, ad, soyad, cinsiyet, dogum, olum, yer, anneId, babaId, hikaye });

  const kisiler = [
    /* ================= KUŞAK 1 — 1899-1910, büyük büyük ebeveynler ================= */
    k('k1', 'Hüseyin', 'Yılmaz', 'E', '1901', '1974', 'Kastamonu, Taşköprü', null, null,
      'Kastamonu’nun Taşköprü ilçesinde doğdu. Kurtuluş Savaşı yıllarında cephe gerisinde kağnı kollarında çalıştı, sonra kasabada demirci ustası oldu. Örsünün sesiyle büyüyen mahallede “Demirci Hüseyin” diye anılırdı.'),
    k('k2', 'Meryem', 'Yılmaz', 'K', '1904', '1969', 'Kastamonu, Taşköprü', null, null,
      'Hüseyin’in eşi. Altı çocuk büyüttü; yaz akşamları evin avlusunda komşulara Kuran okurdu. Elleriyle işlediği yorgan yüzleri hâlâ torunlarının sandığında saklı.'),
    k('k3', 'Ahmet', 'Demir', 'E', '1899', '1966', 'Kastamonu, Boyabat', null, null,
      'Boyabat’ta kereste tüccarıydı. Nehir kıyısındaki kerestehanesi kasabanın en eski işletmesiydi; oğluna da mesleği öğretti.'),
    k('k4', 'Hatice', 'Demir', 'K', '1903', '1978', 'Sinop, Durağan', null, null,
      'Ahmet’in eşi, Sinop’un köyünden gelin geldi. Küçük bir mandıra işletti; mahallenin çocukları onun sütüyle büyüdü.'),
    k('k5', 'Mehmet', 'Kaya', 'E', '1905', '1981', 'Kastamonu, Hanönü', null, null,
      'Köyün en eski arıcısıydı; oğlu Hasan’a hem kovanı hem sabrı miras bıraktı. Ormanın neresinde hangi çiçeğin açtığını takvimden iyi bilirdi.'),
    k('k6', 'Zeynep', 'Kaya', 'K', '1908', '1987', 'Kastamonu, Hanönü', null, null,
      'Mehmet’in eşi. Dokumacılıkla uğraştı; bez dokuyup köy pazarında satardı. Torunlarına “kızım, sabır bez dokur” derdi.'),
    k('k7', 'Ali', 'Çelik', 'E', '1902', '1971', 'Çankırı, Ilgaz', null, null,
      'Ilgaz dağlarında orman muhafızıydı. Yıllarca dağ yolunu, ağacı, ayıyı ve karı anlattı; köy odasının en çok dinlenen adamıydı.'),
    k('k8', 'Emine', 'Çelik', 'K', '1906', '1985', 'Çankırı, Ilgaz', null, null,
      'Ali’nin eşi. Dağ köyünde ebe kadınlık yaptı; bölgede doğan çocukların yarısının doğumunda eli vardı.'),

    /* ================= KUŞAK 2 — 1926-1945, büyük ebeveynler ================= */
    k('k9', 'Yusuf', 'Yılmaz', 'E', '1928', '2004', 'Kastamonu, Taşköprü', 'k2', 'k1',
      'Demirci Hüseyin’in oğlu. Babasının atölyesini devraldı ve 1960’larda motorlu aletlere geçen ilk kasaba ustası oldu. “Demir de insan gibi, kızdırırsan dövülür” derdi.'),
    k('k10', 'Fatma', 'Demir', 'K', '1931', '2016', 'Sinop, Durağan', 'k4', 'k3',
      'Boyabat’tan Taşköprü’ye gelin gitti. Uzun yıllar ilkokulda aşçılık yaptı; kasabanın öğretmenleri onun çorbasıyla büyüdü.'),
    k('k11', 'İsmail', 'Yılmaz', 'E', '1934', '1999', 'Kastamonu, Taşköprü', 'k2', 'k1',
      'Yusuf’un kardeşi. 1950’lerde İstanbul’a gidip terzilik öğrendi, sonra memlekete dönüp kasabanın ilk hazır giyim dükkânını açtı.'),
    k('k12', 'Nazmiye', 'Yılmaz', 'K', '1937', null, 'Kastamonu, Taşköprü', null, null,
      'İsmail’in eşi. Kırk yıl mahalle düğünlerinde sofra kurdu; kasabanın en genç düğün ustasıydı. Hâlâ dükkânın kapısındaki sandalyede oturur, gelene geçene hal hatır sorar.'),
    k('k13', 'Hasan', 'Kaya', 'E', '1930', '2009', 'Kastamonu, Hanönü', 'k6', 'k5',
      'Arıcı oğlu arıcı. Babasının kovanlarına 1970’te yirmi kovan daha ekledi; kestane balıyla ilçe pazarında nam saldı.'),
    k('k14', 'Ayşe', 'Çelik', 'K', '1933', '2019', 'Çankırı, Ilgaz', 'k8', 'k7',
      'Orman muhafızının kızı. Ilgaz’dan Hanönü’ye gelin gitti, köyde dikiş kursu açtı; üç kuşağın gelinliğini dikti.'),
    k('k15', 'Hüseyin', 'Kaya', 'E', '1938', '2011', 'Kastamonu, Hanönü', 'k6', 'k5',
      'Hasan’ın kardeşi. İstanbul’da şoförlük yaptı, emekli olunca köye dönüp muhtarlığa seçildi.'),
    k('k16', 'Sultan', 'Kaya', 'K', '1941', null, 'Samsun, Vezirköprü', null, null,
      'Hüseyin’in eşi. Vezirköprü pazarında kırk yıl manifatura tezgâhı işletti; köyde her düğünün çeyiz alışverişi onun tezgâhından geçti.'),
    k('k17', 'Hüseyin', 'Çelik', 'E', '1926', '1993', 'Çankırı, Ilgaz', 'k8', 'k7',
      'Orman muhafızı Ali’nin oğlu. Ilgaz’da tek katlı bir kereste atölyesi kurdu, sonra büyütüp ilçenin ilk marangozhanesine çevirdi.'),
    k('k18', 'Hatice', 'Çelik', 'K', '1929', '1998', 'Kastamonu, Tosya', null, null,
      'Hüseyin’in eşi, Tosya’nın pirinç tarlalarının kızı. Marangozhanenin hesaplarını kırk yıl defterde tuttu.'),
    k('k19', 'Mustafa', 'Çelik', 'E', '1935', '2007', 'Çankırı, Ilgaz', 'k8', 'k7',
      'Hüseyin’in kardeşi. Ilgaz’da uzun yıllar fırıncılık yaptı; ocağı sabah ezanından önce yanardı.'),
    k('k20', 'Faruk', 'Kaya', 'E', '1940', '2015', 'Kastamonu, Hanönü', 'k6', 'k5',
      'Hasan ile Hüseyin’in en küçük kardeşi. Taşköprü’de ilk motosiklet tamircisini açtı; ailenin bütün eski motorlarını o ayakta tuttu.'),
    k('k21', 'Gülizar', 'Kaya', 'K', '1942', null, 'Kastamonu, Taşköprü', null, null,
      'Faruk’un eşi. Taşköprü’de otuz yıl eczane işletti; köyde kim hastalansa ilk kapı onun eczanesine çalınır.'),

    /* ================= KUŞAK 3 — 1951-1970, anne-baba ve kardeşleri ================= */
    k('k22', 'Mehmet', 'Yılmaz', 'E', '1955', null, 'Kastamonu, Taşköprü', 'k10', 'k9',
      'Demircinin torunu, ailenin merkezindeki adam. Taşköprü’de doğdu, İstanbul’da makine mühendisliği okudu. Emekli olunca köye döndü; sabah kahvesini hâlâ kendi pişirir.'),
    k('k23', 'Emine', 'Kaya', 'K', '1958', null, 'Kastamonu, Hanönü', 'k14', 'k13',
      'Mehmet’in eşi. Arıcı kızı olarak büyüdü, öğretmen oldu; otuz yıl köy okullarında sınıf öğretmenliği yaptı. “Sınıfın en yaramazı en çok ilgi isteyendir” derdi.'),
    k('k24', 'Zeynep', 'Yılmaz', 'K', '1959', null, 'Kastamonu, Taşköprü', 'k12', 'k11',
      'Mehmet’in kız kardeşi. Terzi amcasının dükkânında büyüdü, Ankara’da tekstil mühendisliği okudu. Uzun yıllar bir konfeksiyon atölyesinin başında durdu; şimdi hobi olarak kumaş boyuyor.'),
    k('k25', 'Murat', 'Yılmaz', 'E', '1962', null, 'Kastamonu, Taşköprü', 'k12', 'k11',
      'Mehmet’in küçük kardeşi. Babasının hazır giyim dükkânını büyütüp zincir mağazaya çevirdi. İstanbul’da yaşıyor; her bayram memlekete çıkıp köy kahvesinde yarım gün oturur.'),
    k('k26', 'Selin', 'Yılmaz', 'K', '1965', null, 'İstanbul, Kadıköy', null, null,
      'Murat’ın ilk eşi, 1994’te ayrıldılar. Mimarlık okudu; kendi atölyesinde mobilya tasarlıyor.'),
    k('k27', 'Fatma', 'Kaya', 'K', '1961', null, 'Kastamonu, Hanönü', 'k14', 'k13',
      'Mehmet ve Emine’nin yan komşusu, sonra ahbabı. Emine’ye “kız kardeşten ileri” der. Taşköprü’de pastane işletiyor; ailenin bütün doğum günü pastaları onun tezgâhından çıkar.'),
    k('k28', 'Zeynep', 'Kaya', 'K', '1967', null, 'Kastamonu, Hanönü', 'k14', 'k13',
      'Emine’nin kız kardeşi. Sağlık meslek lisesini bitirip hemşire oldu; yıllarca Kastamonu Devlet Hastanesi’nde çalıştı. Ailenin bütün doğum ve ameliyat hikâyeleri onun hafızasındadır.'),
    k('k29', 'Yusuf', 'Kaya', 'E', '1970', null, 'Kastamonu, Hanönü', 'k14', 'k13',
      'Emine’nin en küçük kardeşi. Kastamonu’da orman mühendisi oldu; ailenin dağ, ağaç ve hava durumu sorularını o yanıtlar.'),
    k('k30', 'Hakan', 'Kaya', 'E', '1964', null, 'Ankara, Çankaya', null, null,
      'Yusuf’un eşi. Ankara’da büyüdü, harita mühendisi oldu; eşinin orman işlerinde ölçüm ve harita tarafını tutuyor.'),
    k('k31', 'Cem', 'Şahin', 'E', '1968', null, 'Kastamonu, Taşköprü', null, null,
      'Fatma’nın eşi. Taşköprü’de büyüdü, diş hekimi oldu; ailenin diş ağrısı gece yarısı da olsa ona gelir.'),
    k('k32', 'Mehmet', 'Kaya', 'E', '1972', null, 'Kastamonu, Hanönü', 'k23', 'k22',
      'Mehmet ve Emine’nin tek oğlu, Ayşe ile Selin’in abisi. Kastamonu’da büyüdü, orman mühendisliği okudu. Ailenin arazi, ağaç ve hava durumu soruları artık ona da geliyor.'),
    k('k33', 'Merve', 'Kaya', 'K', '1974', null, 'Ankara, Keçiören', null, null,
      'Mehmet’in eşi. Keçiören’de büyüdü; gıda mühendisi. Ailenin mutfak hesaplarını ve bayram menülerini o tutuyor.'),
    k('k34', 'Sema', 'Demir', 'K', '1966', null, 'Çankırı, Ilgaz', null, 'k17',
      'Hüseyin ve Hatice’nin kızı, Furkan’ın kız kardeşi. Ilgaz’da büyüdü, ilkokul öğretmeni oldu; kardeşinin çocuklarını da o okuttu.'),
    k('k35', 'Tolga', 'Demir', 'E', '1963', null, 'Ankara, Mamak', null, null,
      'Sema’nın eşi. Ankara’da büyüdü, tornacılık öğrendi; kayınpederinin marangozhanesinde yıllarca çalıştı.'),
    k('k36', 'Nurullah', 'Şahin', 'E', '1969', '2022', 'Kastamonu, Hanönü', 'k21', 'k20',
      'Arıcı Faruk’un oğlu, Fatma’nın kardeşi. Babasının motor tamirhanesini devraldı, sonra taş binada kendi atölyesini açtı. 2022’de bir trafik kazasında vefat etti; dükkânın kepenkleri hâlâ onun ismini taşır.'),
    k('k37', 'Özlem', 'Şahin', 'K', '1972', null, 'Samsun, Bafra', null, null,
      'Nurullah’ın eşi. Bafra’nın tütün tarlalarında büyüdü, eczacı oldu; kayınvalidesinin eczanesini o sürdürüyor.'),
    k('k38', 'Hasan', 'Kaya', 'E', '1953', '2021', 'Kastamonu, Hanönü', 'k14', 'k13',
      'Emine ile Zeynep’in ağabeyi, arıcılığı sürdüren üçüncü kuşak. Balını kestane ve ıhlamur diye ayırır, kavanozları elle etiketlerdi. 2021’de kovanların başında geçirdiği kalp kriziyle vefat etti.'),
    k('k39', 'Saniye', 'Kaya', 'K', '1956', null, 'Kastamonu, Abana', null, null,
      'Hasan’ın eşi. Abana’nın sahil köyünden gelin geldi; köy okulunun ilk kütüphanesini kendi elleriyle kurdu.'),

    /* ================= KUŞAK 4 — 1978-1998, torunlar ve kuzenler ================= */
    k('k40', 'Ayşe', 'Yılmaz', 'K', '1982', null, 'İstanbul, Kadıköy', 'k23', 'k22',
      'Mehmet ve Emine’nin büyük kızı. Kadıköy’de doğdu, mimarlık okudu, restorasyon alanında çalışıyor. Kastamonu’daki eski konakların rölövesini çıkarırken büyük dedesinin atölyesinden kalan demir işleri belgeliyor.'),
    k('k41', 'Selin', 'Yılmaz', 'K', '1985', null, 'İstanbul, Kadıköy', 'k23', 'k22',
      'Mehmet ve Emine’nin küçük kızı. Psikolog; bir çocuk ve ergen danışma merkezinde çalışıyor. Ailede en çok dinleyen, en az konuşan kişi.'),
    k('k42', 'Cem', 'Yılmaz', 'E', '1987', null, 'İstanbul, Kadıköy', 'k26', 'k25',
      'Murat ve Selin’in oğlu. Bilgisayar mühendisliği okudu, oyun stüdyosunda yazılım geliştirici. Ailenin dijital arşivini o kurdu; büyük dedesinin örsünü 3B taramayla belgeledi.'),
    k('k43', 'Buse', 'Yılmaz', 'K', '1990', null, 'Ankara, Çankaya', null, null,
      'Cem’in eşi. Ankara’da büyüdü, görsel iletişim tasarımı okudu; ailenin düğün ve bayram fotoğraflarını o arşivliyor.'),
    k('k44', 'Ali', 'Kaya', 'E', '1980', null, 'Kastamonu, Hanönü', 'k39', 'k38',
      'Hasan ve Saniye’nin oğlu. Babasının kovanlarını devraldı; kestane balı üretimini kooperatife taşıyor. Yaz kahvaltılarının ev sahibi.'),
    k('k45', 'Sema', 'Kaya', 'K', '1983', null, 'İstanbul, Üsküdar', null, null,
      'Ali’nin eşi. Üsküdar’da büyüdü; gıda mühendisi. Bal üretiminin analizlerini o takip ediyor.'),
    k('k46', 'Elif', 'Kaya', 'K', '1984', null, 'Kastamonu, Hanönü', 'k39', 'k38',
      'Ali’nin kız kardeşi. Ziraat fakültesini bitirdi, tarım danışmanı oldu; köydeki çiftçilere yıllardır ücretsiz danışmanlık veriyor.'),
    k('k47', 'Sami', 'Kaya', 'E', '1986', null, 'Kastamonu, Hanönü', 'k39', 'k38',
      'Ali’nin küçük kardeşi. Turizm ve otelcilik okudu; Kastamonu’da bir dağ pansiyonu işletiyor, ailenin bütün uzak misafirleri orada kalır.'),
    k('k48', 'Deniz', 'Aydın', 'E', '1992', null, 'İstanbul, Beşiktaş', 'k27', 'k31',
      'Fatma ve Cem’in oğlu. Galatasaray Lisesi’ni bitirdi, hukuk okudu; şimdi avukat.'),
    k('k49', 'Sena', 'Aydın', 'K', '1994', null, 'Kastamonu, Taşköprü', null, null,
      'Deniz’in eşi. Taşköprü’de büyüdü, diyetisyen oldu; ailenin sağlıklı tarifleri onun imzasını taşır.'),
    k('k50', 'Yusuf', 'Kaya', 'E', '1994', null, 'Kastamonu, Hanönü', 'k28', 'k29',
      'Yusuf ve Hakan’ın oğlu, Nisa ile Mert’in ağabeyi. Kastamonu’da büyüdü, orman mühendisliği okudu. Babasıyla aynı işi seçmesini şöyle anlatır: “Babam ağaca bakınca hava durumunu görür, ben de onu görmek istedim.”'),
    k('k51', 'Furkan', 'Demir', 'E', '1978', null, 'Çankırı, Ilgaz', 'k18', 'k17',
      'Hüseyin ve Hatice’nin oğlu, Sema’nın ağabeyi. Babasının marangozhanesinde çırak olarak başladı, sonra Çankırı’da kendi fırınını açtı; ailenin bütün bayram simidi ondan çıkar.'),
    k('k52', 'Hale', 'Demir', 'K', '1975', null, 'İstanbul, Fatih', null, null,
      'Furkan’ın eşi. Fatih’te büyüdü, ilkokul öğretmeni oldu.'),
    k('k53', 'Yasemin', 'Kaya', 'K', '1997', null, 'İstanbul, Kadıköy', 'k45', 'k44',
      'Ali ve Sema’nın kızı, Efe’nin ablası. Kadıköy’de doğdu, mimarlık okudu; aile albümündeki eski ev fotoğraflarını bulup konağın rölövesine katkı verdi.'),
    k('k54', 'Nisa', 'Kaya', 'K', '1999', null, 'Kastamonu, Hanönü', 'k28', 'k29',
      'Yusuf ve Hakan’ın kızı, Yusuf’un kız kardeşi. Tıp fakültesini bitirdi; İstanbul’da çalışan genç bir hekim. Ailenin sağlık soruları artık ona geliyor.'),
    k('k55', 'Mert', 'Kaya', 'E', '2001', null, 'Kastamonu, Hanönü', 'k28', 'k29',
      'Yusuf ve Hakan’ın oğlu. Mühendislik okuyor; yaz tatillerinde kovanların başında amcası Ali’ye yardım ediyor.'),

    /* ================= KUŞAK 5 — 2003-2018, torunların torunları ================= */
    k('k56', 'Mehmet', 'Yılmaz', 'E', '2009', null, 'İstanbul, Üsküdar', 'k41', null,
      'Selin’in oğlu, Mert’in ağabeyi. On yedisinde; lise öğrencisi, ailenin en meraklısı. Soyağacını ilk o yazmaya başladı, tabloları bilgisayarda kurdu.'),
    k('k57', 'Mert', 'Yılmaz', 'E', '2012', null, 'İstanbul, Üsküdar', 'k41', null,
      'Selin’in küçük oğlu. Büyük dedesinin örs fotoğrafını odasının duvarında tutuyor.'),
    k('k58', 'Efe', 'Kaya', 'E', '2001', null, 'Kastamonu, Hanönü', 'k45', 'k44',
      'Ali ve Sema’nın oğlu, Yasemin’in kardeşi. Mühendislik okuyor; yaz tatillerinde kovanların başında babasına yardım ediyor.'),
    k('k59', 'Beren', 'Yılmaz', 'K', '2013', null, 'İstanbul, Kadıköy', 'k43', 'k42',
      'Cem ve Buse’nin kızı. Hukuk okuyor; ailenin düğün fotoğraflarını dijital arşive aktaran kişi.'),
    k('k60', 'Can', 'Yılmaz', 'E', '2006', null, 'İstanbul, Üsküdar', 'k40', null,
      'Ayşe’nin oğlu. Lise öğrencisi; dedesinin atölyesinden çıkan demir bir anahtarlığı boynunda taşıyor.')
  ];

  /* Evlilikler — bitis dolu olanlar boşanma */
  const evlilikler = [
    { id: 'e1', a: 'k1', b: 'k2', baslangic: '1923', bitis: null },
    { id: 'e2', a: 'k3', b: 'k4', baslangic: '1926', bitis: null },
    { id: 'e3', a: 'k5', b: 'k6', baslangic: '1927', bitis: null },
    { id: 'e4', a: 'k7', b: 'k8', baslangic: '1924', bitis: null },
    { id: 'e5', a: 'k9', b: 'k10', baslangic: '1952', bitis: null },
    { id: 'e6', a: 'k11', b: 'k12', baslangic: '1956', bitis: null },
    { id: 'e7', a: 'k13', b: 'k14', baslangic: '1951', bitis: null },
    { id: 'e8', a: 'k17', b: 'k18', baslangic: '1950', bitis: 1990 },
    { id: 'e9', a: 'k20', b: 'k21', baslangic: '1957', bitis: null },
    { id: 'e10', a: 'k22', b: 'k23', baslangic: '1981', bitis: null },
    { id: 'e11', a: 'k25', b: 'k26', baslangic: '1985', bitis: 1994 },
    { id: 'e12', a: 'k31', b: 'k27', baslangic: '1986', bitis: null },
    { id: 'e13', a: 'k38', b: 'k39', baslangic: '1979', bitis: null },
    { id: 'e14', a: 'k29', b: 'k30', baslangic: '1989', bitis: null },
    { id: 'e15', a: 'k34', b: 'k35', baslangic: '1988', bitis: null },
    { id: 'e16', a: 'k32', b: 'k33', baslangic: '2003', bitis: null },
    { id: 'e17', a: 'k36', b: 'k37', baslangic: '1995', bitis: null },
    { id: 'e18', a: 'k42', b: 'k43', baslangic: '2014', bitis: null },
    { id: 'e19', a: 'k44', b: 'k45', baslangic: '2016', bitis: null },
    { id: 'e20', a: 'k47', b: 'k49', baslangic: '2015', bitis: null },
    { id: 'e21', a: 'k48', b: 'k46', baslangic: '2013', bitis: null },
    { id: 'e22', a: 'k51', b: 'k52', baslangic: '2000', bitis: 2016 }
  ];

  return { kisiler, evlilikler };
})();

if (typeof module !== 'undefined' && module.exports) module.exports = ORNEK_AILE;
if (typeof window !== 'undefined') window.ORNEK_AILE = ORNEK_AILE;
