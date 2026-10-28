/* ============================================================
   PulseDesk — Ana modül: modallar, form doğrulama, eylemler, olaylar
   ============================================================ */
(function () {
  "use strict";

  var P = window.__PD__;
  var UI = window.__PD_UI__;
  if (!P || !UI) { console.error("[PulseDesk] Bağımlılıklar yüklenmedi (app.js / ui.js)."); return; }

  var $ = P.$, $$ = P.$$, el = P.el, esc = P.escapeHtml;
  var state = P.state;

  /* ============================================================
     TOAST (bildirim) — Stack yönetimi + güvenli kapatma
     ============================================================ */
  var toastTimers = new WeakMap();

  function toast(msg, type, ms) {
    var box = $("#toastContainer");
    if (!box) return;

    var icons = { success: "✅", error: "⛔", warn: "⚠️", info: "ℹ️" };
    var t = el("div", "toast toast-" + (type || "info"));
    t.setAttribute("role", type === "error" ? "alert" : "status");

    var ico = el("span", "toast-ico", icons[type] || icons.info);
    var txt = el("span", "toast-msg", msg);
    t.appendChild(ico);
    t.appendChild(txt);
    box.appendChild(t);

    // stack'i 4 ile sınırla
    var all = $$(".toast", box);
    if (all.length > 4) removeToast(all[0]);

    var timer = setTimeout(function () { removeToast(t); }, ms || 2800);
    toastTimers.set(t, timer);

    t.addEventListener("click", function () { removeToast(t); });
  }

  function removeToast(t) {
    if (!t || !t.parentNode) return;
    var timer = toastTimers.get(t);
    if (timer) { clearTimeout(timer); toastTimers.delete(t); }
    t.classList.add("is-out");
    setTimeout(function () {
      if (t.parentNode) t.parentNode.removeChild(t);
    }, 200);
  }

  /* ============================================================
     MODAL YÖNETİMİ
     ============================================================ */
  var openModals = [];

  function openModal(id) {
    var m = document.getElementById(id);
    if (!m) return;
    m.hidden = false;
    if (openModals.indexOf(id) === -1) openModals.push(id);
    document.body.style.overflow = "hidden";

    // ilk odaklanabilir alana odaklan
    setTimeout(function () {
      var focusable = m.querySelector("input:not([type=hidden]), select, textarea, button");
      if (focusable) focusable.focus();
    }, 40);
  }

  function closeModal(id) {
    var m = document.getElementById(id);
    if (!m || m.hidden) return;
    m.hidden = true;
    openModals = openModals.filter(function (x) { return x !== id; });
    if (!openModals.length) document.body.style.overflow = "";
  }

  function closeTopModal() {
    if (!openModals.length) return false;
    closeModal(openModals[openModals.length - 1]);
    return true;
  }

  /* ============================================================
     EYLEMLER (ui.js bu nesneyi çağırır)
     ============================================================ */
  var Actions = {

    /* ---------- durum değiştir ---------- */
    changeStatus: function (id, newStatus, silent) {
      var t = P.findTicket(id);
      if (!t || !P.STATUSES[newStatus]) return;
      if (t.status === newStatus) return;

      var oldLabel = P.STATUSES[t.status].label;
      t.status = newStatus;
      t.updatedAt = new Date().toISOString();
      P.addLog(t, "Durum: " + oldLabel + " → " + P.STATUSES[newStatus].label);

      var ok = P.commit();
      if (state.detailId === id) Actions.fillDetail(t);

      if (!silent) {
        if (ok) toast("Durum güncellendi: " + P.STATUSES[newStatus].label, "success");
        else toast("Durum değişti ama kalıcı kaydedilemedi.", "warn");
      }
    },

    /* ---------- detay modal aç ---------- */
    openDetail: function (id) {
      var t = P.findTicket(id);
      if (!t) { toast("Talep bulunamadı.", "error"); return; }
      state.detailId = id;
      Actions.fillDetail(t);
      openModal("detailModal");
    },

    /* ---------- detay doldur ---------- */
    fillDetail: function (t) {
      $("#detailId").textContent = UI.shortId(t.id);
      $("#detailTitle").textContent = t.title;
      $("#detailCustomer").textContent = t.customer;
      $("#detailCategory").textContent = t.category;
      $("#detailCreated").textContent = P.fmtDate(t.createdAt);
      $("#detailUpdated").textContent = P.fmtDate(t.updatedAt) + " (" + P.fmtRelative(t.updatedAt) + ")";
      $("#detailDescription").textContent = t.description || "Açıklama girilmemiş.";

      $("#detailBadges").innerHTML =
        UI.statusBadge(t.status) + UI.priorityBadge(t.priority) +
        '<span class="tag-cat">' + esc(t.category) + "</span>";

      $("#dStatus").value = t.status;
      $("#dPriority").value = t.priority;
      fillOwnerSelect($("#dOwner"), t.owner);

      // geçmiş
      var logBox = $("#detailLog");
      logBox.innerHTML = "";
      if (!t.log || !t.log.length) {
        logBox.appendChild(el("li", "log-empty", "Henüz işlem kaydı yok."));
      } else {
        t.log.forEach(function (entry) {
          var li = el("li", "log-item");
          li.appendChild(el("span", "log-dot"));
          li.appendChild(el("span", null, entry.text));
          li.appendChild(el("span", "log-time", P.fmtRelative(entry.at)));
          logBox.appendChild(li);
        });
      }
    },

    /* ---------- detaydaki değişiklikleri kaydet ---------- */
    saveDetail: function () {
      var id = state.detailId;
      var t = P.findTicket(id);
      if (!t) return;

      var newStatus = $("#dStatus").value;
      var newPriority = $("#dPriority").value;
      var newOwner = $("#dOwner").value;

      var changes = [];
      if (P.STATUSES[newStatus] && newStatus !== t.status) {
        changes.push("Durum: " + P.STATUSES[t.status].label + " → " + P.STATUSES[newStatus].label);
        t.status = newStatus;
      }
      if (P.PRIORITIES[newPriority] && newPriority !== t.priority) {
        changes.push("Öncelik: " + P.PRIORITIES[t.priority].label + " → " + P.PRIORITIES[newPriority].label);
        t.priority = newPriority;
      }
      if (newOwner !== t.owner) {
        var from = (t.owner === P.UNASSIGNED ? "atanmamış" : t.owner);
        var to = (newOwner === P.UNASSIGNED ? "atanmamış" : newOwner);
        changes.push("Sorumlu: " + from + " → " + to);
        t.owner = newOwner;
      }

      if (!changes.length) {
        toast("Değişiklik yapılmadı.", "info");
        return;
      }

      t.updatedAt = new Date().toISOString();
      changes.forEach(function (c) { P.addLog(t, c); });

      var ok = P.commit();
      Actions.fillDetail(t);
      toast(ok ? "Talep güncellendi." : "Değişiklik kalıcı kaydedilemedi.", ok ? "success" : "warn");
    },

    /* ---------- silme onayı iste ---------- */
    askDelete: function (id) {
      var t = P.findTicket(id);
      if (!t) return;
      state.pendingDeleteId = id;
      $("#confirmText").textContent =
        '"' + t.title + '" talebini kalıcı olarak silmek üzeresiniz. Bu işlem geri alınamaz.';
      openModal("confirmModal");
    },

    /* ---------- silmeyi onayla ---------- */
    confirmDelete: function () {
      var id = state.pendingDeleteId;
      state.pendingDeleteId = null;
      if (!id) { closeModal("confirmModal"); return; }

      var t = P.findTicket(id);
      if (!t) { closeModal("confirmModal"); toast("Talep zaten silinmiş.", "info"); return; }

      var title = t.title;

      // satır/kart için çıkış animasyonu
      var row = document.querySelector('[data-id="' + cssEscape(id) + '"]');

      // veriyi anında kaldır (çift silme imkânsız — kayıt listede yok)
      state.tickets = state.tickets.filter(function (x) { return x.id !== id; });
      state.tickets = state.tickets.slice();
      var ok = P.commit();

      if (state.detailId === id) {
        state.detailId = null;
        closeModal("detailModal");
      }
      closeModal("confirmModal");

      if (row && row.classList) row.classList.add("is-removing");
      setTimeout(UI.render, 230);

      toast(ok ? 'Talep silindi: "' + title + '"' : "Silindi ama kalıcı kayıt başarısız.", ok ? "success" : "warn");
    },

    /* ---------- filtreleri sıfırla ---------- */
    clearFilters: function () {
      state.filters.search = "";
      state.filters.status = "";
      state.filters.priority = "";
      state.filters.category = "";
      var s = $("#fSearch"); if (s) s.value = "";
      var a = $("#fStatus"); if (a) a.value = "";
      var b = $("#fPriority"); if (b) b.value = "";
      var c = $("#fCategory"); if (c) c.value = "";
      UI.render();
      toast("Filtreler temizlendi.", "info", 1600);
    },

    /* ---------- istatistik kartına tıkla → ilgili filtre ---------- */
    applyStatFilter: function (key) {
      var f = state.filters;
      f.search = ""; var si = $("#fSearch"); if (si) si.value = "";
      f.status = ""; f.priority = ""; f.category = "";
      var a = $("#fStatus"), b = $("#fPriority"), c = $("#fCategory");
      if (a) a.value = ""; if (b) b.value = ""; if (c) c.value = "";

      var label = "";
      if (key === "unassigned") {
        // sahipsiz: özel durum, sadece listeyi uyar
        var n = P.getStats().unassigned;
        toast(n ? n + " sahipsiz talep var (sorumlu filtresiyle görüntüleyin)." : "Sahipsiz talep yok.", "info", 2600);
        f.sort = "newest";
        UI.render();
        return;
      } else if (key === "total") {
        f.sort = "newest";
        label = "Tüm talepler gösteriliyor";
      } else if (P.STATUSES[key]) {
        f.status = key;
        if (a) a.value = key;
        label = "Filtre: " + P.STATUSES[key].label;
      } else if (P.PRIORITIES[key]) {
        f.priority = key;
        if (b) b.value = key;
        label = "Filtre: " + P.PRIORITIES[key].label + " öncelik";
      }

      UI.render();
      if (label) toast(label, "info", 1800);
    }
  };

  window.__PD_ACTIONS__ = Actions;

  /* ============================================================
     YARDIMCILAR
     ============================================================ */
  function cssEscape(s) {
    if (window.CSS && window.CSS.escape) return window.CSS.escape(s);
    return String(s).replace(/"/g, '\\"');
  }

  function fillOwnerSelect(sel, current) {
    if (!sel) return;
    sel.innerHTML = "";
    var optNone = el("option", null, P.UNASSIGNED);
    optNone.value = P.UNASSIGNED;
    sel.appendChild(optNone);

    P.OWNERS.forEach(function (o) {
      var op = el("option", null, o.name);
      op.value = o.name;
      sel.appendChild(op);
    });

    // listede olmayan eski bir sorumlu varsa koru
    if (current && current !== P.UNASSIGNED) {
      var exists = P.OWNERS.some(function (o) { return o.name === current; });
      if (!exists) {
        var extra = el("option", null, current);
        extra.value = current;
        sel.appendChild(extra);
      }
      sel.value = current;
    } else {
      sel.value = P.UNASSIGNED;
    }
  }

  function fillCategorySelect(sel) {
    if (!sel) return;
    var cur = sel.value;
    sel.innerHTML = "";
    var first = el("option", null, "Seçiniz...");
    first.value = "";
    sel.appendChild(first);
    P.CATEGORIES.forEach(function (c) {
      var o = el("option", null, c);
      o.value = c;
      sel.appendChild(o);
    });
    if (cur) sel.value = cur;
  }

  function updateStorageInfo() {
    var node = $("#storageInfo");
    if (!node) return;
    if (!P.Store.available) {
      node.textContent = "⚠️ localStorage kullanılamıyor — veriler bu oturumla sınırlı.";
      return;
    }
    var kb = Math.max(1, Math.round(P.Store.bytes() / 1024));
    node.textContent = state.tickets.length + " kayıt · ~" + kb + " KB depolama";
  }

  // app.js katmanındaki commit() bu kancayı çağırır (yükleme sırası bağımsız)
  window.__PD_UPDATE_STORAGE_INFO__ = updateStorageInfo;

  /* ============================================================
     TEMA
     ============================================================ */
  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    var ico = $("#themeIcon");
    if (ico) ico.textContent = theme === "dark" ? "☀️" : "🌙";
    try { window.localStorage.setItem(P.THEME_KEY, theme); } catch (e) {}
  }

  function initTheme() {
    var saved = null;
    try { saved = window.localStorage.getItem(P.THEME_KEY); } catch (e) {}
    if (!saved) {
      saved = (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) ? "dark" : "light";
    }
    applyTheme(saved);
  }
  function initTheme() {
    var saved = null;
    try { saved = window.localStorage.getItem(P.THEME_KEY); } catch (e) {}
    if (!saved) {
      saved = (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) ? "dark" : "light";
    }
    applyTheme(saved);
  }

  /* ============================================================
     FORM DOĞRULAMA
     ============================================================ */
  function setFieldError(fieldName, message) {
    var errNode = document.querySelector('[data-err="' + fieldName + '"]');
    var input = document.getElementById("n" + fieldName.charAt(0).toUpperCase() + fieldName.slice(1));
    if (errNode) errNode.textContent = message || "";
    if (input) {
      var field = input.closest(".field");
      if (field) {
        if (message) field.classList.add("has-error");
        else field.classList.remove("has-error");
      }
    }
  }

  function clearFormErrors() {
    ["title", "customer", "category", "priority", "owner", "description"].forEach(function (f) {
      setFieldError(f, "");
    });
    var banner = $("#formBanner");
    if (banner) { banner.hidden = true; banner.textContent = ""; }
  }

  function validateNewForm() {
    var v = {
      title: $("#nTitle").value.trim(),
      customer: $("#nCustomer").value.trim(),
      category: $("#nCategory").value,
      priority: $("#nPriority").value,
      owner: $("#nOwner").value,
      description: $("#nDescription").value.trim()
    };

    var errors = {};

    if (!v.title) errors.title = "Başlık zorunludur.";
    else if (v.title.length < 3) errors.title = "Başlık en az 3 karakter olmalı.";
    else if (v.title.length > 120) errors.title = "Başlık en fazla 120 karakter olabilir.";

    if (!v.customer) errors.customer = "Müşteri adı zorunludur.";
    else if (v.customer.length < 2) errors.customer = "Müşteri adı en az 2 karakter olmalı.";

    if (!v.category) errors.category = "Kategori seçmelisiniz.";
    if (!v.priority) errors.priority = "Öncelik seçmelisiniz.";
    if (!v.owner) errors.owner = "Sorumlu kişi seçmelisiniz.";

    if (!v.description) errors.description = "Açıklama zorunludur.";
    else if (v.description.length < 10) errors.description = "Açıklama en az 10 karakter olmalı.";

    // alanları işaretle
    clearFormErrors();
    var keys = Object.keys(errors);
    keys.forEach(function (k) { setFieldError(k, errors[k]); });

    if (keys.length) {
      var banner = $("#formBanner");
      if (banner) {
        banner.hidden = false;
        banner.textContent = "Form gönderilemedi: " + keys.length + " alan hatalı. Lütfen işaretli alanları düzeltin.";
      }
      var firstInput = document.querySelector(".field.has-error input, .field.has-error select, .field.has-error textarea");
      if (firstInput) firstInput.focus();
      return null;
    }

    return v;
  }

  /* ============================================================
     YENİ TALEP
     ============================================================ */
  function resetNewForm() {
    var form = $("#newForm");
    if (form) form.reset();
    clearFormErrors();
    var c = $("#descCount");
    if (c) c.textContent = "0";
    var sel = $("#nOwner");
    fillOwnerSelect(sel, P.UNASSIGNED);
    fillCategorySelect($("#nCategory"));
  }

  function openNewModal() {
    resetNewForm();
    openModal("newModal");
    setTimeout(function () {
      var inp = $("#nTitle");
      if (inp) inp.focus();
    }, 60);
  }

  var saving = false;

  function submitNewTicket(ev) {
    if (ev) ev.preventDefault();

    // çift gönderim koruması
    if (saving) return;
    saving = true;

    var btn = $("#btnSaveTicket");
    if (btn) { btn.disabled = true; btn.textContent = "Kaydediliyor..."; }

    try {
      var data = validateNewForm();
      if (!data) {
        toast("Lütfen zorunlu alanları doldurun.", "error");
        return;
      }

      var now = new Date().toISOString();
      var ticket = P.DB.normalize({
        id: P.uid(),
        title: data.title,
        customer: data.customer,
        category: data.category,
        priority: data.priority,
        status: "acik",
        description: data.description,
        owner: data.owner,
        createdAt: now,
        updatedAt: now,
        log: [{ at: now, text: "Talep oluşturuldu" }]
      });

      state.tickets.unshift(ticket);
      var ok = P.commit();

      closeModal("newModal");
      resetNewForm();
      window.scrollTo({ top: 0, behavior: "smooth" });

      toast(
        ok ? 'Talep kaydedildi: "' + ticket.title + '"' : "Talep eklendi ancak kalıcı kaydedilemedi.",
        ok ? "success" : "warn"
      );
    } catch (err) {
      console.error("[PulseDesk] Kayıt hatası:", err);
      toast("Beklenmeyen bir hata oluştu, kayıt yapılamadı.", "error");
    } finally {
      saving = false;
      if (btn) { btn.disabled = false; btn.textContent = "Talebi Kaydet"; }
    }
  }

  /* ============================================================
     DEMO VERİ
     ============================================================ */
  function loadInitialData() {
    state.loading = true;
    UI.render();

    var existing = P.Store.read();

    if (existing && existing.length) {
      // kullanıcı verisi var → ASLA ezme
      state.tickets = existing;
      state.loading = false;
      P.commit();
      return;
    }

    if (P.Store.available && existing && existing.length === 0) {
      // bilinçli olarak boş bırakılmış
      state.tickets = [];
      state.loading = false;
      P.commit();
      return;
    }

    // ilk açılış (veya veri yok) → demo veri
    state.tickets = P.DB.seed();
    state.loading = false;
    var ok = P.commit();
    if (ok) toast(state.tickets.length + " demo talep yüklendi.", "info", 2400);
  }

  function resetDemoData() {
    var n = P.DB.seed();
    state.tickets = n;
    state.filters = { search: "", status: "", priority: "", category: "", sort: "newest" };
    var s = $("#fSearch"); if (s) s.value = "";
    var a = $("#fStatus"); if (a) a.value = "";
    var b = $("#fPriority"); if (b) b.value = "";
    var c = $("#fCategory"); if (c) c.value = "";
    var d = $("#fSort"); if (d) d.value = "newest";
    P.commit();
    toast("Demo veriler sıfırlandı (" + n.length + " talep).", "success");
  }

  /* ============================================================
     OLAY BAĞLAMA
     ============================================================ */
  function bindEvents() {
    // ---- üst bar ----
    $("#btnNew").addEventListener("click", openNewModal);
    $("#btnEmptyNew").addEventListener("click", openNewModal);

    $("#btnTheme").addEventListener("click", function () {
      var cur = document.documentElement.getAttribute("data-theme");
      applyTheme(cur === "dark" ? "light" : "dark");
    });

    $("#btnReset").addEventListener("click", function () {
      state.pendingDeleteId = null;
      $("#confirmTitle").textContent = "Demo verileri sıfırla";
      $("#confirmText").textContent =
        "Mevcut tüm talepler silinip " + P.DB.seed().length + " adet demo talep yeniden yüklenecek. Devam edilsin mi?";
      var yes = $("#btnConfirmYes");
      yes.textContent = "Evet, Sıfırla";
      yes.dataset.mode = "reset";
      openModal("confirmModal");
    });

    // ---- arama ----
    var searchInput = $("#fSearch");
    var searchTimer = null;
    searchInput.addEventListener("input", function () {
      var val = searchInput.value;
      UI.syncSearchClear();
      clearTimeout(searchTimer);
      searchTimer = setTimeout(function () {
        state.filters.search = val;
        UI.render();
      }, 140);
    });
    searchInput.addEventListener("keydown", function (ev) {
      if (ev.key === "Escape") {
        searchInput.value = "";
        state.filters.search = "";
        UI.syncSearchClear();
        UI.render();
      }
    });

    $("#btnClearSearch").addEventListener("click", function () {
      searchInput.value = "";
      state.filters.search = "";
      UI.syncSearchClear();
      UI.render();
      searchInput.focus();
    });

    // ---- filtreler ----
    $("#fStatus").addEventListener("change", function () {
      state.filters.status = this.value; UI.render();
    });
    $("#fPriority").addEventListener("change", function () {
      state.filters.priority = this.value; UI.render();
    });
    $("#fCategory").addEventListener("change", function () {
      state.filters.category = this.value; UI.render();
    });
    $("#fSort").addEventListener("change", function () {
      state.filters.sort = this.value; UI.render();
    });

    $("#btnClearFilters").addEventListener("click", Actions.clearFilters);
    $("#btnEmptyClear").addEventListener("click", Actions.clearFilters);

    // ---- görünüm değiştir ----
    $$(".vt-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        $$(".vt-btn").forEach(function (b) { b.classList.remove("is-active"); });
        btn.classList.add("is-active");
        state.view = btn.dataset.view;
        UI.render();
      });
    });

    // ---- istatistik kartları ----
    $$(".stat-card").forEach(function (card) {
      card.addEventListener("click", function () {
        Actions.applyStatFilter(card.dataset.stat);
      });
    });

    // ---- yeni talep formu ----
    $("#newForm").addEventListener("submit", submitNewTicket);

    $("#nDescription").addEventListener("input", function () {
      var c = $("#descCount");
      if (c) c.textContent = String(this.value.length);
    });

    // alan düzeltilince hatayı kaldır
    ["nTitle", "nCustomer", "nCategory", "nPriority", "nOwner", "nDescription"].forEach(function (id) {
      var node = document.getElementById(id);
      if (!node) return;
      var evt = node.tagName === "SELECT" ? "change" : "input";
      node.addEventListener(evt, function () {
        var name = id.slice(1).toLowerCase();
        setFieldError(name, "");
      });
    });

    // ---- detay modal ----
    $("#btnSaveDetail").addEventListener("click", Actions.saveDetail);
    $("#btnDeleteTicket").addEventListener("click", function () {
      if (state.detailId) Actions.askDelete(state.detailId);
    });

    $$("[data-set-status]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        if (!state.detailId) return;
        Actions.changeStatus(state.detailId, btn.dataset.setStatus, true);
        var sel = $("#dStatus");
        if (sel) sel.value = btn.dataset.setStatus;
        toast("Durum: " + P.STATUSES[btn.dataset.setStatus].label, "success", 1600);
      });
    });

    // ---- onay modal ----
    $("#btnConfirmYes").addEventListener("click", function () {
      if (this.dataset.mode === "reset") {
        this.dataset.mode = "";
        closeModal("confirmModal");
        resetDemoData();
        $("#confirmTitle").textContent = "Emin misiniz?";
        $("#confirmText").textContent = "Bu işlem geri alınamaz.";
        this.textContent = "Evet, Sil";
        return;
      }
      Actions.confirmDelete();
    });

    $("#btnConfirmNo").addEventListener("click", function () {
      state.pendingDeleteId = null;
      closeModal("confirmModal");
      var yes = $("#btnConfirmYes");
      yes.dataset.mode = "";
      yes.textContent = "Evet, Sil";
      $("#confirmTitle").textContent = "Emin misiniz?";
      $("#confirmText").textContent = "Bu işlem geri alınamaz.";
      toast("Silme işlemi iptal edildi.", "info", 1800);
    });

    // ---- tüm kapatma butonları ----
    $$("[data-close]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var id = btn.dataset.close;
        if (id === "confirmModal") {
          state.pendingDeleteId = null;
          var yes = $("#btnConfirmYes");
          yes.dataset.mode = "";
          yes.textContent = "Evet, Sil";
          $("#confirmTitle").textContent = "Emin misiniz?";
          $("#confirmText").textContent = "Bu işlem geri alınamaz.";
        }
        closeModal(id);
      });
    });

    // overlay'e tıklayınca kapat
    $$(".modal-overlay").forEach(function (ov) {
      ov.addEventListener("mousedown", function (ev) {
        if (ev.target === ov) {
          if (ov.id === "confirmModal") state.pendingDeleteId = null;
          closeModal(ov.id);
        }
      });
    });

    // ---- klavye: ESC ile en üstteki modalı kapat ----
    document.addEventListener("keydown", function (ev) {
      if (ev.key === "Escape") {
        if (closeTopModal()) {
          state.pendingDeleteId = null;
          ev.preventDefault();
          return;
        }
      }

      // Ctrl/Cmd + K → aramaya odaklan
      if ((ev.ctrlKey || ev.metaKey) && ev.key.toLowerCase() === "k") {
        ev.preventDefault();
        var s = $("#fSearch");
        if (s) { s.focus(); s.select(); }
        return;
      }

      // "n" tuşu → yeni talep (input içinde değilken)
      var tag = (document.activeElement && document.activeElement.tagName) || "";
      var typing = tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
      if (!typing && (ev.key === "n" || ev.key === "N") && !openModals.length) {
        ev.preventDefault();
        openNewModal();
      }
    });

    // ---- sekme görünür olunca depoyu yeniden oku (başka sekmede değişiklik olabilir) ----
    window.addEventListener("storage", function (ev) {
      if (ev.key !== P.STORAGE_KEY) return;
      var fresh = P.Store.read();
      if (fresh) {
        state.tickets = fresh;
        UI.render();
        toast("Veriler başka bir sekmede güncellendi.", "info", 2000);
      }
    });

    // ---- hata yakalama (runtime error olsa bile uygulama çökmesin) ----
    window.addEventListener("error", function (ev) {
      console.error("[PulseDesk] Runtime hata:", ev.message);
    });
  }

  /* ============================================================
     BAŞLAT
     ============================================================ */
  function boot() {
    try {
      initTheme();
      fillCategorySelect($("#nCategory"));
      fillOwnerSelect($("#nOwner"), P.UNASSIGNED);
      bindEvents();
      loadInitialData();
      updateStorageInfo();
      console.log("%cPulseDesk hazır ✓", "color:#4f46e5;font-weight:bold", state.tickets.length + " talep yüklendi.");
    } catch (err) {
      console.error("[PulseDesk] Başlatma hatası:", err);
      var tbody = $("#tableBody");
      if (tbody) {
        tbody.innerHTML = '<tr><td colspan="9" style="padding:24px;text-align:center;color:var(--danger)">' +
          "Uygulama başlatılamadı. Konsol kayıtlarını kontrol edin.</td></tr>";
      }
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
