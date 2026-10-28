/* ============================================================
   PulseDesk — Arayüz (render) katmanı
   app.js'in dışa açtığı window.__PD__ API'sini kullanır.
   ============================================================ */
(function () {
  "use strict";

  var P = window.__PD__;
  if (!P) { console.error("[PulseDesk] Çekirdek (app.js) yüklenmedi."); return; }

  var $ = P.$, $$ = P.$$, el = P.el, esc = P.escapeHtml;
  var state = P.state;
  var UNASSIGNED = P.UNASSIGNED;

  function statusBadge(s) {
    var m = P.STATUSES[s] || P.STATUSES.acik;
    return '<span class="badge badge-' + s + '">' + esc(m.label) + "</span>";
  }

  function priorityBadge(p) {
    var m = P.PRIORITIES[p] || P.PRIORITIES.orta;
    return '<span class="badge badge-' + p + '">' + esc(m.label) + "</span>";
  }

  function ownerCell(name) {
    var n = name || UNASSIGNED;
    var un = n === UNASSIGNED;
    return '<div class="owner-cell">' +
      '<span class="avatar" style="background:' + P.colorFor(n) + '">' + esc(P.initials(n)) + "</span>" +
      '<span' + (un ? ' class="cell-muted"' : "") + ">" + esc(n) + "</span>" +
      "</div>";
  }

  /* ============================================================
     İSTATİSTİK KARTLARI
     ============================================================ */
  function renderStats() {
    var s = P.getStats();
    var map = {
      statTotal: s.total,
      statOpen: s.acik,
      statProgress: s.isleniyor,
      statResolved: s.cozuldu,
      statCritical: s.kritik,
      statUnassigned: s.unassigned
    };
    Object.keys(map).forEach(function (id) {
      var node = document.getElementById(id);
      if (node && node.textContent !== String(map[id])) node.textContent = String(map[id]);
    });
  }

  /* ============================================================
     AKTİF FİLTRE ÇİPLERİ
     ============================================================ */
  function renderChips() {
    var wrap = $("#activeChips");
    if (!wrap) return;
    var f = state.filters;
    wrap.innerHTML = "";

    function addChip(label, key) {
      var chip = el("span", "chip");
      chip.appendChild(document.createTextNode(label));
      var x = el("button", null, "✕");
      x.type = "button";
      x.setAttribute("aria-label", label + " filtresini kaldır");
      x.addEventListener("click", function (ev) {
        ev.stopPropagation();
        state.filters[key] = "";
        if (key === "search") {
          var inp = $("#fSearch");
          if (inp) inp.value = "";
          syncSearchClear();
        } else {
          var sel = { status: "#fStatus", priority: "#fPriority", category: "#fCategory" }[key];
          if (sel && $(sel)) $(sel).value = "";
        }
        render();
      });
      chip.appendChild(x);
      wrap.appendChild(chip);
    }

    if (f.search) addChip('Ara: "' + f.search + '"', "search");
    if (f.status) addChip("Durum: " + P.STATUSES[f.status].label, "status");
    if (f.priority) addChip("Öncelik: " + P.PRIORITIES[f.priority].label, "priority");
    if (f.category) addChip("Kategori: " + f.category, "category");
  }

  /* ============================================================
     TABLO
     ============================================================ */
  function renderTable(list) {
    var tbody = $("#tableBody");
    if (!tbody) return;
    var frag = document.createDocumentFragment();

    list.forEach(function (t) {
      var tr = el("tr");
      tr.dataset.id = t.id;
      tr.tabIndex = 0;
      tr.setAttribute("role", "button");
      tr.setAttribute("aria-label", t.title + " talebini aç");

      var tdId = el("td");
      tdId.innerHTML = '<span class="ticket-id">' + esc(shortId(t.id)) + "</span>";

      var tdTitle = el("td");
      tdTitle.innerHTML =
        '<span class="cell-title">' + esc(t.title) + "</span>" +
        '<span class="cell-sub">' + esc(truncate(t.description, 62) || "—") + "</span>";

      var tdCust = el("td");
      tdCust.innerHTML = '<span class="cell-title" style="font-weight:500">' + esc(t.customer) + "</span>";

      var tdCat = el("td");
      tdCat.innerHTML = '<span class="tag-cat">' + esc(t.category) + "</span>";

      var tdPri = el("td");
      tdPri.innerHTML = priorityBadge(t.priority);

      var tdStatus = el("td");
      tdStatus.innerHTML = statusBadge(t.status);

      var tdDate = el("td", "cell-date");
      tdDate.innerHTML = '<div>' + esc(P.fmtDate(t.createdAt)) + "</div>" +
                         '<div style="font-size:11px;color:var(--text-3)">' + esc(P.fmtRelative(t.createdAt)) + "</div>";

      var tdOwner = el("td");
      tdOwner.innerHTML = ownerCell(t.owner);

      var tdOps = el("td", "col-ops");
      var ops = el("div", "row-actions");

      var nextStatus = nextStatusOf(t.status);
      if (nextStatus) {
        var qb = el("button", "icon-btn", nextStatus === "isleniyor" ? "▶" : "✔");
        qb.type = "button";
        qb.title = "Durumu '" + P.STATUSES[nextStatus].label + "' yap";
        qb.setAttribute("aria-label", qb.title);
        qb.addEventListener("click", function (ev) {
          ev.stopPropagation();
          window.__PD_ACTIONS__.changeStatus(t.id, nextStatus);
        });
        ops.appendChild(qb);
      }

      var del = el("button", "icon-btn danger", "🗑");
      del.type = "button";
      del.title = "Talebi sil";
      del.setAttribute("aria-label", "Talebi sil");
      del.addEventListener("click", function (ev) {
        ev.stopPropagation();
        window.__PD_ACTIONS__.askDelete(t.id);
      });
      ops.appendChild(del);

      tdOps.appendChild(ops);

      tr.appendChild(tdId);
      tr.appendChild(tdTitle);
      tr.appendChild(tdCust);
      tr.appendChild(tdCat);
      tr.appendChild(tdPri);
      tr.appendChild(tdStatus);
      tr.appendChild(tdDate);
      tr.appendChild(tdOwner);
      tr.appendChild(tdOps);

      tr.addEventListener("click", function () {
        window.__PD_ACTIONS__.openDetail(t.id);
      });
      tr.addEventListener("keydown", function (ev) {
        if (ev.key === "Enter" || ev.key === " ") {
          ev.preventDefault();
          window.__PD_ACTIONS__.openDetail(t.id);
        }
      });

      frag.appendChild(tr);
    });

    tbody.innerHTML = "";
    tbody.appendChild(frag);
  }

  /* ============================================================
     KART GÖRÜNÜMÜ
     ============================================================ */
  function renderCards(list) {
    var wrap = $("#cardsWrap");
    if (!wrap) return;
    wrap.innerHTML = "";
    var frag = document.createDocumentFragment();

    list.forEach(function (t) {
      var card = el("article", "ticket-card");
      card.dataset.id = t.id;
      card.dataset.priority = t.priority;
      card.tabIndex = 0;
      card.setAttribute("role", "button");
      card.setAttribute("aria-label", t.title + " talebini aç");

      var top = el("div", "tc-top");
      top.innerHTML = '<span class="ticket-id">' + esc(shortId(t.id)) + "</span>" + priorityBadge(t.priority);

      var title = el("h3", "tc-title", t.title);
      var desc = el("p", "tc-desc", truncate(t.description, 110) || "Açıklama yok");

      var badges = el("div", "tc-badges");
      badges.innerHTML = statusBadge(t.status) + '<span class="tag-cat">' + esc(t.category) + "</span>";

      var meta = el("div", "tc-meta");
      var left = el("div");
      left.innerHTML = '<div style="font-weight:600;color:var(--text-2)">' + esc(t.customer) + "</div>" +
                       "<div>" + esc(P.fmtRelative(t.createdAt)) + "</div>";

      var right = el("div", "tc-actions");
      right.innerHTML = ownerCell(t.owner);

      var nextStatus = nextStatusOf(t.status);
      if (nextStatus) {
        var qb = el("button", "icon-btn", nextStatus === "isleniyor" ? "▶" : "✔");
        qb.type = "button";
        qb.title = "Durumu '" + P.STATUSES[nextStatus].label + "' yap";
        qb.addEventListener("click", function (ev) {
          ev.stopPropagation();
          window.__PD_ACTIONS__.changeStatus(t.id, nextStatus);
        });
        right.appendChild(qb);
      }
      var del = el("button", "icon-btn danger", "🗑");
      del.type = "button";
      del.title = "Talebi sil";
      del.addEventListener("click", function (ev) {
        ev.stopPropagation();
        window.__PD_ACTIONS__.askDelete(t.id);
      });
      right.appendChild(del);

      meta.appendChild(left);
      meta.appendChild(right);

      card.appendChild(top);
      card.appendChild(title);
      card.appendChild(desc);
      card.appendChild(badges);
      card.appendChild(meta);

      card.addEventListener("click", function () {
        window.__PD_ACTIONS__.openDetail(t.id);
      });
      card.addEventListener("keydown", function (ev) {
        if (ev.key === "Enter" || ev.key === " ") {
          ev.preventDefault();
          window.__PD_ACTIONS__.openDetail(t.id);
        }
      });

      frag.appendChild(card);
    });

    wrap.appendChild(frag);
  }

  /* ============================================================
     ANA RENDER
     ============================================================ */
  function render() {
    var list = P.getFiltered();
    var tableWrap = $("#tableWrap");
    var cardsWrap = $("#cardsWrap");
    var empty = $("#emptyState");
    var loading = $("#loadingState");
    var count = $("#resultCount");

    // yükleniyor durumu
    if (loading) loading.hidden = !state.loading;
    if (state.loading) {
      if (tableWrap) tableWrap.hidden = true;
      if (cardsWrap) cardsWrap.hidden = true;
      if (empty) empty.hidden = true;
      renderStats();
      renderChips();
      return;
    }

    // görünüm modu
    var view = state.view;
    if (window.matchMedia("(max-width: 860px)").matches && state.tickets.length) {
      // küçük ekranda tablo gizli, kartlar görünür (CSS ile de desteklenir)
    }

    var isEmpty = list.length === 0;
    if (empty) empty.hidden = !isEmpty;

    if (isEmpty) {
      if (tableWrap) tableWrap.hidden = true;
      if (cardsWrap) cardsWrap.hidden = true;

      var titleNode = $("#emptyTitle");
      var textNode = $("#emptyText");
      var btnClear = $("#btnEmptyClear");
      if (P.hasActiveFilters()) {
        if (titleNode) titleNode.textContent = "Sonuç bulunamadı";
        if (textNode) textNode.textContent = "Arama veya filtre kriterlerinize uyan talep yok. Filtreleri temizleyip tekrar deneyin.";
        if (btnClear) btnClear.hidden = false;
      } else {
        if (titleNode) titleNode.textContent = "Henüz talep yok";
        if (textNode) textNode.textContent = "İlk destek talebini oluşturarak operasyon merkezini kullanmaya başlayın.";
        if (btnClear) btnClear.hidden = true;
      }
    } else {
      if (view === "cards") {
        if (tableWrap) tableWrap.hidden = true;
        if (cardsWrap) { cardsWrap.hidden = false; }
        renderCards(list);
      } else {
        if (cardsWrap) cardsWrap.hidden = true;
        if (tableWrap) tableWrap.hidden = false;
        renderTable(list);
      }
    }

    if (count) {
      count.textContent = isEmpty
        ? "0 talep"
        : list.length + " talep" + (list.length !== state.tickets.length ? " / " + state.tickets.length + " toplam" : "");
    }

    renderStats();
    renderChips();
    syncSearchClear();
  }

  /* ---------------- küçük yardımcılar ---------------- */
  function shortId(id) {
    return id.replace(/^t_/, "#").slice(0, 11).toUpperCase();
  }

  function truncate(s, n) {
    var v = String(s || "").trim();
    if (v.length <= n) return v;
    return v.slice(0, n - 1).trim() + "…";
  }

  function nextStatusOf(status) {
    if (status === "acik") return "isleniyor";
    if (status === "isleniyor") return "cozuldu";
    return null;
  }

  function syncSearchClear() {
    var inp = $("#fSearch");
    var btn = $("#btnClearSearch");
    if (!inp || !btn) return;
    if (inp.value) btn.classList.add("is-visible");
    else btn.classList.remove("is-visible");
  }

  /* dışa aç */
  window.__PD_UI__ = {
    render: render,
    renderTable: renderTable,
    renderCards: renderCards,
    renderStats: renderStats,
    statusBadge: statusBadge,
    priorityBadge: priorityBadge,
    ownerCell: ownerCell,
    shortId: shortId,
    syncSearchClear: syncSearchClear
  };
})();
