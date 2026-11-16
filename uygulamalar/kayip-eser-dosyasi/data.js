/* KAYIP ESER DOSYASI — vaka verisi
   Tüm içerik kurgusaldır. Sarnıç Müzesi ve kişiler gerçek değildir. */

const VAKA = {
  dosyaNo: "114",
  baslik: "KAYIP ESER DOSYASI",
  altBaslik: "Sarnıç Müzesi — Doğu Salonu",
  eser: "Yıldız Küresi",
  eserDetay: "12. yüzyıl, gümüş işlemeli gök küresi · envanter no. SM-0412",
  olay: "14 Kasım Pazar, 22:47 — vitrin alarmı",
  supheliSayisi: 4,
  delilSayisi: 12,
  ifadeSayisi: 6
};

const SUPHELILER = [
  {
    id: "s1",
    ad: "Nazlı Erdem",
    rol: "Gece Bekçisi",
    yas: 34,
    hizmet: "6 yıl",
    oda: "Güvenlik kulübesi / devriye",
    ifade: "22:30'da turum başladı. 22:40'ta Doğu Salonu'nu kontrol ettim, küre vitrinde duruyordu. Ardından Batı kapısına indim.",
    arka: "Kira borcu nedeniyle iki kez avans talebi var. Kayıtlarında disiplin cezası yok.",
    not: "Devriye defterindeki 22:40 satırı sonradan düşülmüş görünüyor.",
    temizleyen: { delil: "e10", ifade: "w4" }
  },
  {
    id: "s2",
    ad: "Kerem Ünsal",
    rol: "Konservatör (eser bakım uzmanı)",
    yas: 41,
    hizmet: "11 yıl",
    oda: "Konservasyon atölyesi, 2. kat",
    ifade: "22:10'dan 23:00'e kadar atölyede kürenin ayağını temizliyordum. Kimse gelmedi, ben de aşağı inmediм.".replace("inmediм", "inmedim"),
    arka: "Dört ay önce açtığı kişisel sergi zararla kapandı. 260.000 TL kredi borcu bulunuyor. Kürenin restorasyonunu tek başına yürüttü.",
    not: "Atölye kartı 22:36'da Doğu Salonu kapısında okutulmuş.",
    temizleyen: null
  },
  {
    id: "s3",
    ad: "Selin Aydın",
    rol: "Küratör Yardımcısı",
    yas: 38,
    hizmet: "9 yıl",
    oda: "Fuaye / sergi koordinasyonu",
    ifade: "Açılış konuşmasını ben yaptım. 22:20'den 23:05'e kadar fuayeden ayrılmadım, kırk kişi beni gördü.",
    arka: "Sergi bütçesinde 18.000 TL'lik açık tespit edildi; müfettiş raporu henüz kapanmadı.",
    not: "Açılış konuşması tutanağında imzası var.",
    temizleyen: { delil: "e11", ifade: "w2" }
  },
  {
    id: "s4",
    ad: "Ruhi Demirbaş",
    rol: "Antika taciri / koleksiyoner",
    yas: 56,
    hizmet: "Davetli",
    oda: "Otopark / resepsiyon",
    ifade: "Açılışa 22:05'te geldim. Arabamda iki telefon görüşmesi yaptım. Küreye talibim, evet; ama hırsız değilim.",
    arka: "Küre için mart ayında 4,2 milyon TL teklif verdi, reddedildi. Yurt dışına satış geçmişi var.",
    not: "Müze yönetimi teklifi 'bilimsel değer' gerekçesiyle geri çevirdi.",
    temizleyen: { delil: "e12", ifade: "w3" }
  }
];

const DELILLER = [
  {
    id: "e1",
    ad: "Vitrin Camındaki Kesik",
    tur: "cam",
    yer: "Doğu Salonu, 2 numaralı vitrin",
    ozet: "Vitrin camında 34 cm'lik tek bir kesik var. Kilit sağlam, kapak zorlanmamış.",
    bulgular: [
      "Kesik tek harekette açılmış; kenar profili camın iç yüzünden başlıyor, dış yüzeyde çizik yok.",
      "Camda kesim anında oluşan ince toz, ölçüme göre 22:41 civarına denk geliyor.",
      "Alarm 22:47'de çalmış: kesimden altı dakika sonra."
    ],
    dikkat: "Dışarıdan giren biri camı dıştan çizer. Bu kesik içeriden açılmış."
  },
  {
    id: "e2",
    ad: "Vitrindeki Küre",
    tur: "obje",
    yer: "Doğu Salonu, vitrin içi",
    ozet: "Vitrinde duran cisim gümüş kaplama alçı kopya. Ağırlık 3,1 kg; orijinal 11,4 kg.",
    bulgular: [
      "Yüzeyde gümüş boya var; mıknatıs tutmuyor, kazıntı alçı tozu veriyor.",
      "Ekvator hizasında 1 mm'lik kalıp dikişi bulunuyor.",
      "İçi boş; tabanında kurşun denge levhası yerine demir pul yerleştirilmiş."
    ],
    dikkat: "Kopya, sergiye konmadan önce hazırlanmış olmalı: boya ve dikiş zamana yayılmış işçilik gösteriyor."
  },
  {
    id: "e3",
    ad: "Sergi Fotoğrafı — 6 Kasım",
    tur: "foto",
    yer: "Müze arşivi, tanıtım çekimi",
    ozet: "6 Kasım'da çekilen tanıtım fotoğrafında kürenin ekvatorunda dikiş çizgisi görünüyor.",
    bulgular: [
      "Aynı açıdan 4 Kasım'da çekilen katalog fotoğrafında dikiş yok, yüzey tek parça.",
      "Fotoğrafın çekim saati kayıtlı: 6 Kasım 11:20, sergi salonu.",
      "Küre 5 Kasım'da atölyeden sergiye teslim edilmişti."
    ],
    dikkat: "Değişim, hırsızlık gecesinden en az dokuz gün önce yapılmış."
  },
  {
    id: "e4",
    ad: "Restorasyon Teslim Tutanağı — 5 Kasım",
    tur: "belge",
    yer: "Konservasyon atölyesi dosyası",
    ozet: "Küre 5 Kasım 17:40'ta atölyeden sergiye teslim edilmiş. Teslim eden: Kerem Ünsal.",
    bulgular: [
      "\"Yüzey temizliği ve ayak onarımı tamamlandı\" notu düşülmüş.",
      "Tutanağın altında tek imza var: K. Ünsal. Teslim alan görevlinin imzası eksik.",
      "Aynı gün 16:20'de atölyede alçı ve pigment sarfiyatı kaydedilmiş."
    ],
    dikkat: "Küre en son 5 Kasım'da onun elinden geçti."
  },
  {
    id: "e5",
    ad: "Atölye Sarf Malzeme Kaydı",
    tur: "belge",
    yer: "Konservasyon atölyesi, sarf defteri",
    ozet: "5 Kasım 16:20: 4 kg alçı torbası açıldı, kadmiyum sarısı pigmenti kullanıldı. İmza: K.Ü.",
    bulgular: [
      "Sarf defterindeki imza, teslim tutanağındaki imzayla aynı el.",
      "Pigment, vitrindeki kopyanın alt katmanında tespit edildi.",
      "Alçı torbası hâlâ atölyede; ağırlığı 800 gram eksik."
    ],
    dikkat: "Kopyanın malzemesi bu defterdeki satırdan çıkmış."
  },
  {
    id: "e6",
    ad: "Mağaza Sipariş Formu — 2 Kasım",
    tur: "belge",
    yer: "Müze mağazası",
    ozet: "2 Kasım: mağaza için 20 adet alçı küre kopyası sipariş edilmiş; üretim: K. Ünsal.",
    bulgular: [
      "Teslim tarihi 20 Aralık; teslim edilen kopya sayısı henüz sıfır.",
      "Sipariş birim fiyatı 450 TL, toplam 9.000 TL.",
      "Formda 'vitrin için değil, satış için' ibaresi var."
    ],
    dikkat: "Atölyede alçı bulunmasının masum bir açıklaması da var. Bu kayıt tek başına suç kanıtı değil."
  },
  {
    id: "e7",
    ad: "Kapı Kartı Kaydı — 22:36",
    tur: "kart",
    yer: "Güvenlik sistemi dökümü",
    ozet: "KNS-2 numaralı kart 22:36'da Doğu Salonu'na giriş, 22:52'de çıkış yapmış.",
    bulgular: [
      "KNS-2 kartı konservasyon atölyesine tanımlı; kart sahibi Kerem Ünsal.",
      "Aynı kart o gece atölye kapısını 21:58'de açmış, 22:36'dan sonra atölyeye dönmemiş.",
      "Salon kapısında başka kart okutulmamış."
    ],
    dikkat: "22:36 ile 22:52 arasında salonda konservasyon kartı taşıyan biri var."
  },
  {
    id: "e8",
    ad: "Kamera Boşluğu ve Bakım Defteri",
    tur: "kamera",
    yer: "Güvenlik odası / atölye defteri",
    ozet: "Doğu Salonu kamerası 22:38–22:44 arası kayıt yapmamış. Defterde 22:30 notu: \"panel testi — K.Ü.\"",
    bulgular: [
      "Kayıt boşluğu manuel panel müdahalesiyle oluşmuş; parola 4471 girilmiş.",
      "Bakım defterinde 14 Kasım 22:30 satırı ve K.Ü. kısaltması var.",
      "Panel testi için yazılı izin istenmesi gerekirken izin formu yok."
    ],
    dikkat: "Kameraları kapatma yetkisi atölye personelinde; kayıt boşluğu tesadüf değil."
  },
  {
    id: "e9",
    ad: "Atölye Alet Çantası",
    tur: "alet",
    yer: "Konservasyon atölyesi, 3 numaralı çekmece",
    ozet: "Elmas uçlu cam keskisi yerinde değil. Köpük yuvada boş iz ve etiket duruyor.",
    bulgular: [
      "Etiket: \"ELMAS UÇLU CAM KESKİSİ — DEMİRBAŞ 88\".",
      "Alet çıkış kaydı yok; envanterde 'mevcut' görünüyor.",
      "Kesik genişliği bu tipte bir uçla uyumlu."
    ],
    dikkat: "Camı kesen alet, atölyenin kendi çekmecesinden çıkmış."
  },
  {
    id: "e10",
    ad: "Kargo Teslim Tutanağı — 22:41",
    tur: "belge",
    yer: "Batı kapısı, güvenlik noktası",
    ozet: "22:41'de Batı kapısında kargo teslim edilmiş; teslim alan: N. Erdem, bekçi.",
    bulgular: [
      "Tutanakta saat ve imza birlikte var: 22:41, N. Erdem.",
      "Kargo görevlisinin ifadesi saatle uyumlu.",
      "Batı kapısı ile Doğu Salonu arası yürüme mesafesi üç dakika."
    ],
    dikkat: "Bekçi 22:41'de Doğu Salonu'nda olamaz."
  },
  {
    id: "e11",
    ad: "Resepsiyon Fotoğrafı — 22:44",
    tur: "foto",
    yer: "Fuaye, açılış resepsiyonu",
    ozet: "22:44'te çekilen fotoğrafta Selin Aydın kürsüde konuşuyor; duvar saati 22:44.",
    bulgular: [
      "Fotoğraf müze fotoğrafçısının makinesinden, zaman damgası işlenmiş.",
      "Arka planda en az otuz davetli görünüyor.",
      "Kürsü ile Doğu Salonu arasında iki kat var."
    ],
    dikkat: "Küratör yardımcısı o dakikada salonda değil."
  },
  {
    id: "e12",
    ad: "Otopark ve Telefon Kaydı",
    tur: "arac",
    yer: "Otopark bariyeri / operatör kaydı",
    ozet: "Ruhi Demirbaş'ın aracı 22:05'te girmiş, 23:10'da çıkmış. 22:39–22:47 arası iki arama yapmış.",
    bulgular: [
      "Aramaların baz istasyonu müze otoparkı; sinyal salon binasına geçmiyor.",
      "Bariyer kaydı plaka ile eşleşiyor.",
      "Otopark görevlisinin ifadesi kaydı doğruluyor."
    ],
    dikkat: "Tacirin o dakikalarda binada olduğuna dair kanıt yok."
  }
];

const IFADELER = [
  {
    id: "w1",
    kim: "Elif Sarı",
    rol: "Temizlik görevlisi",
    saat: "22:20",
    metin: "Doğu Salonu'nu temizliyordum, küre vitrinde duruyordu. Konservasyon görevlisi Kerem Bey merdivenlerden atölyeye çıkıyordu; elinde siyah bir çanta vardı."
  },
  {
    id: "w2",
    kim: "Murat Kılıç",
    rol: "Kafeterya sorumlusu",
    saat: "22:44",
    metin: "Selin Hanım kürsüde konuşurken saat 22:44'tü; fotoğrafçı da çekti. Konuşma yirmi dakika sürdü, fuayeden ayrılmadı."
  },
  {
    id: "w3",
    kim: "Hüseyin Toprak",
    rol: "Otopark görevlisi",
    saat: "22:41",
    metin: "Ruhi Bey'in arabası 22:05'te girdi. 22:41'de aracının yanında telefonda konuşuyordu; yanına gittim, selam verdi."
  },
  {
    id: "w4",
    kim: "Bekir Aslan",
    rol: "Güvenlik yardımcısı",
    saat: "22:31–22:45",
    metin: "Nazlı'nın turu 22:31'de bitti. 22:41'de Batı kapısında kargoyu teslim aldı, tutanağı imzaladı. Defterdeki 22:40 notu sonradan yazılmış olabilir; o saatte kulübedeydi."
  },
  {
    id: "w5",
    kim: "Deniz Aksoy",
    rol: "Müze mağazası sorumlusu",
    saat: "2 Kasım",
    metin: "Yirmi adet alçı küre kopyası siparişi verdik, üretimi Kerem Bey yapacaktı. Aralık teslimi. Vitrindeki kopyayla ilgisi yok, onlar satış için."
  },
  {
    id: "w6",
    kim: "Prof. Dr. Aylin Tunç",
    rol: "Müze müdürü",
    saat: "21:30",
    metin: "Açılışta konuşmayı Selin yaptı. Ruhi Bey bana küreyi yeniden satın almak istediğini söyledi; teklifini yine reddettim. Kürenin sigorta değeri mayısta iki katına çıkarıldı."
  }
];

/* İp bağlanınca açılan çıkarımlar. a/b: delil ya da ifade kimliği. */
const BAGLANTILAR = [
  {
    a: "e2", b: "e3",
    baslik: "Değişim Tarihi",
    metin: "Vitrindeki cisim alçı kopya; 6 Kasım fotoğrafında dikiş var, 4 Kasım kataloğunda yok. Değişim 5–6 Kasım arasında yapılmış. Yani 14 Kasım gecesi bir eser çalınmadı; zaten kopya olan bir şeyin etrafında hırsızlık sahnelendi.",
    cekirdek: true
  },
  {
    a: "e4", b: "e5",
    baslik: "Atölyede Döküm",
    metin: "5 Kasım'da küreyi atölyeden sergiye teslim eden de, aynı gün alçıyı ve pigmenti açan da Kerem Ünsal. Kopyanın malzemesi onun defterindeki satırdan çıkmış.",
    cekirdek: true
  },
  {
    a: "e1", b: "e9",
    baslik: "Sahnelenmiş Hırsızlık",
    metin: "Cam içeriden, atölyeden eksik olan elmas uçla kesilmiş. Kesim 22:41, alarm 22:47. Vitrin kırılması gerçek bir girişin değil, sahnenin parçası.",
    cekirdek: true
  },
  {
    a: "e7", b: "e8",
    baslik: "Karanlık Altı Dakika",
    metin: "22:36'da salona giren kart KNS-2, yani atölye kartı. Kamera 22:38–22:44 arası bakım parolasıyla kapatılmış, defterde K.Ü. imzası var. Salonda bulunan kişi konservasyon personeli.",
    cekirdek: true
  },
  {
    a: "e6", b: "w5",
    baslik: "Alçının Masum Yanı",
    metin: "Alçı siparişi gerçek: mağaza için yirmi satış kopyası. Ama teslim edilen sıfır ve vitrindeki kopya bu siparişin parçası değil. Savunmanın en güçlü dayanağı burada çürüyor.",
    cekirdek: false
  },
  {
    a: "e10", b: "w4",
    baslik: "Bekçinin Alibisi",
    metin: "Bekçi 22:41'de Batı kapısında kargo tutanağı imzalamış; turu 22:31'de bitmiş. Defterdeki '22:40 normal' satırı sonradan düşülmüş. Nazlı Erdem dosyadan çıkıyor.",
    cekirdek: false
  },
  {
    a: "e11", b: "w2",
    baslik: "Küratörün Alibisi",
    metin: "22:44'te kürsüde konuşan Selin Aydın, Doğu Salonu'nda olamaz. Tanık ifadesi ve zaman damgalı fotoğraf birbirini tutuyor.",
    cekirdek: false
  },
  {
    a: "e12", b: "w3",
    baslik: "Tacirin Alibisi",
    metin: "Bariyer kaydı, baz istasyonu ve otopark görevlisi aynı şeyi söylüyor: Ruhi Demirbaş o dakikalarda otoparkta. Motifi var, imkânı yok.",
    cekirdek: false
  }
];

const ZAMAN = [
  { saat: "21:30", olay: "Açılış resepsiyonu başlar. Dört şüpheli de müzede.", kilit: 0 },
  { saat: "22:05", olay: "Ruhi Demirbaş'ın aracı otoparka girer.", kilit: 0 },
  { saat: "22:20", olay: "Temizlik görevlisi Doğu Salonu'nda; küre vitrinde.", kilit: 0 },
  { saat: "22:36", olay: "KNS-2 (atölye) kartı Doğu Salonu'na girer.", kilit: 2 },
  { saat: "22:38", olay: "Kamera kaydı kesilir; boşluk altı dakika sürer.", kilit: 3 },
  { saat: "22:41", olay: "Cam içeriden kesilir; bekçi Batı kapısında kargo teslim alır.", kilit: 3 },
  { saat: "22:44", olay: "Küratör yardımcısı fuayede kürsüde konuşur.", kilit: 1 },
  { saat: "22:47", olay: "Vitrin alarmı çalar. Salonda kimse yok.", kilit: 0 },
  { saat: "22:52", olay: "KNS-2 kartı salondan çıkış yapar.", kilit: 2 },
  { saat: "23:10", olay: "Tacirin aracı otoparktan çıkar.", kilit: 0 }
];

const COZUM = {
  supheli: "s2",
  baslik: "Dosya Kapandı — Kerem Ünsal",
  metin: [
    "Yıldız Küresi 14 Kasım gecesi çalınmadı. Küre 5 Kasım'da, kendi restorasyonunun son gününde atölyede alçı bir kopyayla değiştirildi. Sarf defterindeki alçı ve pigment, teslim tutanağındaki tek imza ve 6 Kasım fotoğrafındaki kalıp dikişi aynı günü işaret ediyor.",
    "14 Kasım gecesi yapılan tek şey, hırsızlık görüntüsünü kurmaktı. 22:36'da atölye kartıyla salona girdi, 22:38'de bakım parolasıyla kamerayı altı dakika kapattı, 22:41'de camı atölyeden aldığı elmas uçla içeriden kesti ve 22:47'de alarmı çaldırdı.",
    "Gerçek küre şu an atölyenin zemin kaplaması altındaki boşlukta, yağlı kâğıda sarılı hâlde duruyor. Kopya, satış siparişi verilen yirmi alçı kopyadan biri değil; ayrı bir döküm.",
    "Motif: 260.000 TL kredi borcu ve bir koleksiyonere verilmiş söz. Dosya savcılığa bu hâliyle gidiyor."
  ],
  kanit: ["e2", "e3", "e4", "e5", "e7", "e8", "e9", "e1"]
};
