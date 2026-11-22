/* =========================================================================
   ŞİİR VERİSİ — Fatih Bayraktar / Şiirin Sessiz Dünyası
   -------------------------------------------------------------------------
   ÖNEMLİ: Bu dosyadaki tüm şiirler, gerçek bir şaire ait DEĞİLDİR.
   Demo/tasarım amaçlı, bu proje için özgün olarak yazılmış ÖRNEK metinlerdir.
   Site arayüzünde de "Örnek metin" etiketiyle görünür.

   Gerçek şiirler geldiğinde YALNIZCA bu dosyadaki "siirler" dizisini
   değiştirmek yeterlidir; tasarıma (HTML/CSS/JS) dokunmaya gerek yoktur.

   Her şiir kaydı:
   {
     id:       "benzersiz-kisa-kimlik",
     baslik:   "Şiir başlığı",
     kategori: "ask" | "ozlem" | "hayat" | "yalnizlik" | "umut",
     tarih:    "2024-03-12"  (bilinmiyorsa null)
     demo:     true  (gerçek şiir eklenince false yapın veya alanı silin)
     metre:    [ "dize 1", "dize 2", "", ... ]  ("" = kıta arası boşluk)
   }
   ========================================================================= */

window.SIIR_VERISI = {

  /* ---- Şairin profili: doğrulanmamış bilgi YOK, boş alanlar arayüzde
         "bilgi eklenecek" olarak görünür. ---------------------------------- */
  sair: {
    ad: "Fatih Bayraktar",
    altBaslik: "Şiirin Sessiz Dünyası",
    slogan: "Bazen bir kelime, bir ömrün sustuklarını anlatır.",
    sloganNot: "Demo amaçlı özgün tasarım metnidir; şaire ait bir alıntı değildir.",
    /* Fotoğraf: kendi portrenizi "gorsel/fatih-bayraktar.jpg" olarak koyun,
       aşağıdaki satırdaki yolu açın (yorumdan çıkarın) — gerisi otomatik. */
    fotograf: null,    // ör. "gorsel/fatih-bayraktar.jpg"
    fotografNot: "Portre fotoğrafı eklenecek.",
    biyografi: null,   // doğrulanmış biyografi geldiğinde buraya düz metin yazın
    eserler: [],       // ör. [{ ad: "...", yil: 2013, yayinevi: "..." }]
    dogum: null
  },

  kategoriler: [
    { id: "ask",       ad: "Aşk",       aciklama: "Kalbin en yüksek sesle sustuğu yer." },
    { id: "ozlem",     ad: "Özlem",     aciklama: "Uzağın kokusunu taşıyan satırlar." },
    { id: "hayat",     ad: "Hayat",     aciklama: "Gündelik telaşın içinden süzülenler." },
    { id: "yalnizlik", ad: "Yalnızlık", aciklama: "Tenha odalarda yankılanan ses." },
    { id: "umut",      ad: "Umut",      aciklama: "Sabahın ilk ışığına yazılmış." }
  ],

  siirler: [
    {
      id: "gece-yarisi-mektubu",
      baslik: "Gece Yarısı Mektubu",
      kategori: "ozlem",
      tarih: null,
      demo: true,
      metre: [
        "Saat üçte bir mektup yazdım sana,",
        "Kâğıt beyaz, kelimeler ürkek.",
        "Her satırda bir kapı araladım",
        "ve her kapının ardında sen.",
        "",
        "Sokak lambası camda bekliyor,",
        "bir de ben bekliyorum.",
        "Uzak dediğin şey aslında",
        "iki kelime arasındaki mesafe.",
        "",
        "Göndermedim. Postaneler kapalı;",
        "kalbim değil ama, o hep açık."
      ]
    },
    {
      id: "sessiz-oda",
      baslik: "Sessiz Oda",
      kategori: "yalnizlik",
      tarih: null,
      demo: true,
      metre: [
        "Duvarlar benden önce öğrendi",
        "adımın yankısını.",
        "Bir sandalye, bir masa,",
        "bir de bütün dünyayı taşıyan pencere.",
        "",
        "Kimse gelmedi bugün.",
        "Bu, kimsenin suçu değil;",
        "ben de gitmedim kimseye.",
        "",
        "Akşam oldu. Işık sarardı.",
        "Bir çay demledim kendime —",
        "iki bardak."
      ]
    },
    {
      id: "ilkbahar-sonrasi",
      baslik: "İlkbahar Sonrası",
      kategori: "umut",
      tarih: null,
      demo: true,
      metre: [
        "Bir fidan düşün, betonun ortasında",
        "kimseden izin almadan büyüyor.",
        "Böyle başlar iyileşme:",
        "gürültü çıkarmadan.", "",
        "Yarın diye bir kelime var ya,",
        "küçük ama ağır bir kelime.",
        "Onu avucunda taşı,", 
        "düşürme.",
        "",
        "Bahar bitti sanırsın;",
        "oysa bazı çiçekler",
        "sadece geç açar."
      ]
    },
    {
      id: "eski-sokak",
      baslik: "Eski Sokak",
      kategori: "hayat",
      tarih: null,
      demo: true,
      metre: [
        "Çocukluğumun sokağına döndüm:",
        "taşlar aynı, evler küçülmüş.",
        "Demek büyümek böyle bir şey,",
        "gittiğin yer senden geride kalırmış.",
        "",
        "Bakkaldan bir şeker aldım,",
        "cüzdanımda paranın en küçüğüyle.",
        "Ağızda eridi;",
        "ben hiçbir yere gitmedim, o gitti.",
        "",
        "Hayat bu işte: bir dükkân vitrini",
        "ve içinden geçen insanlar."
      ]
    },
    {
      id: "susmayi-ogrendim",
      baslik: "Susmayı Öğrendim",
      kategori: "ask",
      tarih: null,
      demo: true,
      metre: [
        "Bana susmayı öğrettin,",
        "önce sitemle, sonra sessizlikle.",
        "Ben de sustum, uzun uzun,",
        "bir şairin gereksiz şiiri gibi.",
        "",
        "Bazen konuşmak isterim,",
        "kelimeler ağzımda düğümlenir.",
        "Bir sevgi ne zaman dilimizde",
        "kırık bir cam olur?",
        "",
        "Yine de söylüyorum, geç de olsa:",
        "seni sevmek bir alışkanlık değil;",
        "her sabah yeniden seçtiğim",
        "bir uyanış."
      ]
    },
    {
      id: "tozlu-raf",
      baslik: "Tozlu Raf",
      kategori: "yalnizlik",
      tarih: null,
      demo: true,
      metre: [
        "Rafta bir kitap var, tozlu,",
        "kimse okumadı, kimseyi incitmedi.",
        "Ben de öyleydim bir ara:",
        "çok satmadım, çok kırıldım.",
        "",
        "Sayfalar salındı, cilt durdu.",
        "Bazı hikâyeler sonuna kadar",
        "kalmayı başaramaz da",
        "iyi bir yarım kalmayı öğrenir.",
        "",
        "Bir gün biri uzanır belki,",
        "üfle, toz gitsin;",
        "başla."
      ]
    },
    {
      id: "uzak-liman",
      baslik: "Uzak Liman",
      kategori: "ozlem",
      tarih: null,
      demo: true,
      metre: [
        "Haritada bir nokta buldum,",
        "adı olmayan, ışığı uzak.",
        "Adını senin bıraktığın yer değil,",
        "ben senin yerine koydum.",
        "",
        "Gemiler geçiyor gecede;",
        "kimse dönmüyor geri.",
        "Beklemek de bir meslek olsaydı",
        "ben kalfası olurdum.",
        "",
        "Liman sessiz.", 
        "Deniz bugün bir mazeret sundu:",
        "gelgit dedi, bir şey dedi,",
        "duymadım."
      ]
    },
    {
      id: "lacivert-sabah",
      baslik: "Lacivert Sabah",
      kategori: "hayat",
      tarih: null,
      demo: true,
      metre: [
        "Perdeyi araladım az önce;",
        "şehir henüz kendine gelmemiş.",
        "Ekmek fırını açılmış,",
        "sıcak bir sözdür bu.",
        "",
        "İnsanlar yürüyor, aynı yönde",
        "farklı hayatlara doğru.",
        "Hepimiz bir sabaha borçluyuz;",
        "bazıları öder, bazıları erteler.",
        "",
        "Ben de bu borcun",
        "bir kelimesini yazıyorum."
      ]
    }
  ]
};
