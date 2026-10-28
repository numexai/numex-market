/* ============================================================
   PulseDesk — Mini Destek Operasyon Merkezi
   Saf JS · localStorage kalıcılığı · harici bağımlılık yok
   ============================================================ */
(function () {
  "use strict";

  /* ---------------- Sabitler ---------------- */
  var STORAGE_KEY = "pulsedesk.tickets.v1";
  var THEME_KEY   = "pulsedesk.theme.v1";
  var SEED_KEY    = "pulsedesk.seeded.v1";

  var STATUSES = {
    acik:      { label: "Açık",      order: 0 },
    isleniyor: { label: "İşleniyor", order: 1 },
    cozuldu:   { label: "Çözüldü",   order: 2 }
  };

  var PRIORITIES = {
    dusuk:  { label: "Düşük",  order: 0 },
    orta:   { label: "Orta",   order: 1 },
    yuksek: { label: "Yüksek", order: 2 },
    kritik: { label: "Kritik", order: 3 }
  };

  var CATEGORIES = [
    "Teknik Sorun",
    "Faturalama",
    "Hesap İşlemleri",
    "Öneri / İstek",
    "Kargo & Teslimat",
    "Genel Soru"
  ];

  var OWNERS = [
    { name: "Mehmet Ali Ceylan", color: "#4f46e5" },
    { name: "Nurullah Şahin",    color: "#0891b2" },
    { name: "Zeynep Kaya",       color: "#059669" },
    { name: "Burak Demir",       color: "#d97706" },
    { name: "Elif Yıldız",       color: "#7c3aed" },
    { name: "Can Öztürk",        color: "#db2777" }
  ];

  var AVATAR_COLORS = ["#4f46e5", "#0891b2", "#059669", "#d97706", "#7c3aed", "#db2777", "#dc2626", "#0d9488"];
  var UNASSIGNED = "Atanmamış";

  /* ---------------- Yardımcılar ---------------- */
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined && text !== null) n.textContent = String(text);
    return n;
  }

  function escapeHtml(s) {
    return String(s === undefined || s === null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  function pad2(n) { return n < 10 ? "0" + n : "" + n; }

  function fmtDate(iso) {
    var d = new Date(iso);
    if (isNaN(d.getTime())) return "-";
    return pad2(d.getDate()) + "." + pad2(d.getMonth() + 1) + "." + d.getFullYear() +
           " " + pad2(d.getHours()) + ":" + pad2(d.getMinutes());
  }

  function fmtRelative(iso) {
    var d = new Date(iso);
    if (isNaN(d.getTime())) return "-";
    var diff = Date.now() - d.getTime();
    var min = Math.floor(diff / 60000);
    if (min < 1) return "az önce";
    if (min < 60) return min + " dk önce";
    var hr = Math.floor(min / 60);
    if (hr < 24) return hr + " saat önce";
    var day = Math.floor(hr / 24);
    if (day < 30) return day + " gün önce";
    return fmtDate(iso);
  }

  function initials(name) {
    if (!name || name === UNASSIGNED) return "?";
    var parts = String(name).trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  function colorFor(name) {
    if (!name || name === UNASSIGNED) return "#94a3b8";
    var found = OWNERS.filter(function (o) { return o.name === name; })[0];
    if (found) return found.color;
    var sum = 0;
    for (var i = 0; i < name.length; i++) sum += name.charCodeAt(i);
    return AVATAR_COLORS[sum % AVATAR_COLORS.length];
  }

  function uid() {
    return "t_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 8);
  }

  function norm(s) {
    return String(s || "")
      .toLocaleLowerCase("tr-TR")
      .replace(/ı/g, "i").replace(/İ/g, "i")
      .replace(/ş/g, "s").replace(/ğ/g, "g")
      .replace(/ü/g, "u").replace(/ö/g, "o").replace(/ç/g, "c")
      .trim();
  }

  /* ============================================================
     KALICI DEPO (localStorage) — bozuk veriye dayanıklı
     ============================================================ */
  var Store = {
    available: (function () {
      try {
        var k = "__pd_test__";
        window.localStorage.setItem(k, "1");
        window.localStorage.removeItem(k);
        return true;
      } catch (e) { return false; }
    })(),

    read: function () {
      if (!this.available) return null;
      var raw;
      try { raw = window.localStorage.getItem(STORAGE_KEY); }
      catch (e) { return null; }
      if (!raw) return null;

      var parsed;
      try { parsed = JSON.parse(raw); }
      catch (e) {
        console.warn("[PulseDesk] Bozuk localStorage verisi bulundu, yok sayıldı.", e);
        return null;
      }
      if (!Array.isArray(parsed)) return null;

      var clean = parsed.filter(function (t) {
        return t && typeof t === "object" && typeof t.title === "string" && t.title.trim();
      }).map(DB.normalize);
      return clean;
    },

    write: function (list) {
      if (!this.available) return false;
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
        return true;
      } catch (e) {
        console.warn("[PulseDesk] Kayıt başarısız (kota?).", e);
        return false;
      }
    },

    clear: function () {
      if (!this.available) return;
      try { window.localStorage.removeItem(STORAGE_KEY); } catch (e) {}
    },

    bytes: function () {
      if (!this.available) return 0;
      try { return (window.localStorage.getItem(STORAGE_KEY) || "").length; } catch (e) { return 0; }
    }
  };

  /* ============================================================
     VERİ KATMANI — kayıt normalize + tohum (demo) veri
     ============================================================ */
  var DB = {
    normalize: function (t) {
      var now = new Date().toISOString();
      var status = STATUSES[t.status] ? t.status : "acik";
      var priority = PRIORITIES[t.priority] ? t.priority : "orta";
      var owner = (typeof t.owner === "string" && t.owner.trim()) ? t.owner.trim() : UNASSIGNED;

      return {
        id:          t.id || uid(),
        title:       String(t.title || "Başlıksız talep").trim().slice(0, 120),
        customer:    String(t.customer || "Bilinmeyen müşteri").trim().slice(0, 80),
        category:    CATEGORIES.indexOf(t.category) >= 0 ? t.category : "Genel Soru",
        priority:    priority,
        status:      status,
        description: String(t.description || "").trim().slice(0, 600),
        owner:       owner,
        createdAt:   t.createdAt || now,
        updatedAt:   t.updatedAt || t.createdAt || now,
        log:         Array.isArray(t.log) ? t.log.slice(0, 30) : []
      };
    },

    seed: function () {
      var H = 3600000;
      var now = Date.now();
      function at(hoursAgo) { return new Date(now - hoursAgo * H).toISOString(); }

      var rows = [
        {
          title: "Ödeme ekranında 500 hatası alıyorum",
          customer: "Ayşe Yılmaz",
          category: "Teknik Sorun",
          priority: "kritik",
          status: "acik",
          owner: "Mehmet Ali Ceylan",
          description: "Kredi kartı ile ödeme adımına geçtiğimde sayfa tamamen boş kalıyor ve konsolda 500 hatası görüyorum. Sipariş tamamlanmıyor, acil çözüm gerekiyor.",
          createdAt: at(3), updatedAt: at(3)
        },
        {
          title: "Fatura PDF'i indirilemiyor",
          customer: "Kadir Aslan",
          category: "Faturalama",
          priority: "yuksek",
          status: "isleniyor",
          owner: "Nurullah Şahin",
          description: "Geçmiş dönem faturalarımı PDF olarak indirmek istediğimde 'dosya bulunamadı' uyarısı çıkıyor. Muhasebe için faturaya ihtiyacım var.",
          createdAt: at(8), updatedAt: at(2)
        },
        {
          title: "Hesabıma giriş yapamıyorum, şifre sıfırlama maili gelmiyor",
          customer: "Merve Şen",
          category: "Hesap İşlemleri",
          priority: "kritik",
          status: "acik",
          owner: "Zeynep Kaya",
          description: "Şifremi sıfırlamak istiyorum ancak e-posta adresime hiçbir sıfırlama bağlantısı gelmiyor. Spam klasörünü de kontrol ettim, orada da yok.",
          createdAt: at(5), updatedAt: at(5)
        },
        {
          title: "Kargo takip numarası güncellenmiyor",
          customer: "Hasan Kurt",
          category: "Kargo & Teslimat",
          priority: "orta",
          status: "isleniyor",
          owner: "Burak Demir",
          description: "Siparişim kargoya verildi olarak görünüyor ama takip numarası iki gündür aynı. Kargom nerede bilmiyorum.",
          createdAt: at(26), updatedAt: at(6)
        },
        {
          title: "Karanlık tema talebi",
          customer: "Elif Doğan",
          category: "Öneri / İstek",
          priority: "dusuk",
          status: "cozuldu",
          owner: "Elif Yıldız",
          description: "Uygulamayı gece kullanırken gözlerim yoruluyor. Karanlık tema seçeneği eklenirse çok iyi olur.",
          createdAt: at(72), updatedAt: at(20)
        },
        {
          title: "Mobil uygulamada bildirim gelmiyor",
          customer: "Onur Taş",
          category: "Teknik Sorun",
          priority: "yuksek",
          status: "acik",
          owner: UNASSIGNED,
          description: "Android cihazımda uygulama bildirimleri hiç düşmüyor. Bildirim izinlerini kontrol ettim, açık görünüyor.",
          createdAt: at(11), updatedAt: at(11)
        },
        {
          title: "Abonelik iptali yansımadı",
          customer: "Selin Arı",
          category: "Hesap İşlemleri",
          priority: "yuksek",
          status: "isleniyor",
          owner: "Can Öztürk",
          description: "Aboneliğimi iptal ettim ancak kartımdan bu ay yine çekim yapılmış. İadenin yapılmasını talep ediyorum.",
          createdAt: at(30), updatedAt: at(9)
        },
        {
          title: "Ürün görselleri yüklenmiyor",
          customer: "Gökhan Er",
          category: "Teknik Sorun",
          priority: "orta",
          status: "acik",
          owner: "Nurullah Şahin",
          description: "Kategori sayfasına girdiğimde ürün görselleri gri kutu olarak görünüyor. İnternet bağlantım normal.",
          createdAt: at(14), updatedAt: at(14)
        },
        {
          title: "İade süreci çok uzun sürüyor",
          customer: "Deniz Polat",
          category: "Kargo & Teslimat",
          priority: "orta",
          status: "cozuldu",
          owner: "Burak Demir",
          description: "İade talebi oluşturalı iki hafta oldu, hâlâ sonuçlanmadı. Sürecin hızlandırılmasını rica ediyorum.",
          createdAt: at(96), updatedAt: at(48)
        },
        {
          title: "API dokümantasyonu güncel değil",
          customer: "Burak Çetin",
          category: "Genel Soru",
          priority: "dusuk",
          status: "cozuldu",
          owner: "Mehmet Ali Ceylan",
          description: "Dokümandaki bazı endpoint'ler artık çalışmıyor, yeni alanlar da eksik. Güncellenmesi geliştiriciler için faydalı olur.",
          createdAt: at(120), updatedAt: at(60)
        },
        {
          title: "Şirket hesabına ek kullanıcı eklenemiyor",
          customer: "Zehra Aydın",
          category: "Hesap İşlemleri",
          priority: "yuksek",
          status: "acik",
          owner: UNASSIGNED,
          description: "Ekip yöneticisi yetkisiyle yeni kullanıcı davet ediyorum ancak davet maili karşı tarafa ulaşmıyor.",
          createdAt: at(7), updatedAt: at(7)
        },
        {
          title: "Otomatik ödeme talimatı kurulamıyor",
          customer: "Serkan Yalçın",
          category: "Faturalama",
          priority: "orta",
          status: "isleniyor",
          owner: "Zeynep Kaya",
          description: "Otomatik ödeme talimatı vermek istiyorum fakat form gönderilemiyor, son adımda takılı kalıyor.",
          createdAt: at(19), updatedAt: at(4)
        }
      ];

      return rows.map(function (r) {
        var t = DB.normalize(r);
        t.log = [{ at: t.createdAt, text: "Talep oluşturuldu (demo veri)" }];
        return t;
      });
    }
  };

  /* ============================================================
     UYGULAMA DURUMU
     ============================================================ */
  var state = {
    tickets: [],
    filters: { search: "", status: "", priority: "", category: "", sort: "newest" },
    view: "table",
    detailId: null,
    pendingDeleteId: null,
    loading: false
  };

  function commit() {
    // tüm değişiklikler burada kalıcı hale gelir + arayüz tazelenir
    var ok = Store.write(state.tickets);

    // Arayüz tazeleme ui.js katmanına delege edilir (yükleme sırası bağımsız).
    if (window.__PD_UI__ && typeof window.__PD_UI__.render === "function") {
      try {
        window.__PD_UI__.render();
      } catch (e) {
        console.error("[PulseDesk] Arayüz yenilenemedi:", e);
      }
    }

    if (typeof window.__PD_UPDATE_STORAGE_INFO__ === "function") {
      try { window.__PD_UPDATE_STORAGE_INFO__(); } catch (e) {}
    }

    return ok;
  }

  function findTicket(id) {
    for (var i = 0; i < state.tickets.length; i++) {
      if (state.tickets[i].id === id) return state.tickets[i];
    }
    return null;
  }

  function addLog(t, text) {
    t.log = t.log || [];
    t.log.unshift({ at: new Date().toISOString(), text: text });
    if (t.log.length > 30) t.log.length = 30;
  }

  /* ---------------- Filtre + sıralama motoru ---------------- */
  function getFiltered() {
    var f = state.filters;
    var q = norm(f.search);

    var list = state.tickets.filter(function (t) {
      if (f.status && t.status !== f.status) return false;
      if (f.priority && t.priority !== f.priority) return false;
      if (f.category && t.category !== f.category) return false;

      if (q) {
        var hay = norm([t.id, t.title, t.customer, t.owner, t.category, t.description].join(" "));
        if (hay.indexOf(q) === -1) return false;
      }
      return true;
    });

    var sorters = {
      newest:      function (a, b) { return new Date(b.createdAt) - new Date(a.createdAt); },
      oldest:      function (a, b) { return new Date(a.createdAt) - new Date(b.createdAt); },
      updated:     function (a, b) { return new Date(b.updatedAt) - new Date(a.updatedAt); },
      priority:    function (a, b) { return PRIORITIES[b.priority].order - PRIORITIES[a.priority].order; },
      priorityAsc: function (a, b) { return PRIORITIES[a.priority].order - PRIORITIES[b.priority].order; },
      title:       function (a, b) { return a.title.localeCompare(b.title, "tr"); }
    };

    list.sort(sorters[f.sort] || sorters.newest);
    return list;
  }

  function getStats() {
    var s = { total: state.tickets.length, acik: 0, isleniyor: 0, cozuldu: 0, kritik: 0, unassigned: 0 };
    state.tickets.forEach(function (t) {
      if (s[t.status] !== undefined) s[t.status]++;
      if (t.priority === "kritik") s.kritik++;
      if (!t.owner || t.owner === UNASSIGNED) s.unassigned++;
    });
    return s;
  }

  function hasActiveFilters() {
    var f = state.filters;
    return !!(f.search || f.status || f.priority || f.category);
  }

  /* dışa açılan API (diğer bölümler bunu kullanır) */
  window.__PD__ = {
    state: state,
    STORAGE_KEY: STORAGE_KEY,
    THEME_KEY: THEME_KEY,
    SEED_KEY: SEED_KEY,
    STATUSES: STATUSES,
    PRIORITIES: PRIORITIES,
    CATEGORIES: CATEGORIES,
    OWNERS: OWNERS,
    UNASSIGNED: UNASSIGNED,
    Store: Store,
    DB: DB,
    $: $, $$: $$, el: el,
    escapeHtml: escapeHtml,
    fmtDate: fmtDate,
    fmtRelative: fmtRelative,
    initials: initials,
    colorFor: colorFor,
    uid: uid,
    norm: norm,
    commit: commit,
    findTicket: findTicket,
    addLog: addLog,
    getFiltered: getFiltered,
    getStats: getStats,
    hasActiveFilters: hasActiveFilters
  };
})();
