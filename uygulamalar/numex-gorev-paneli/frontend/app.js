/* =====================================================================
 * Numex Görev Paneli — istemci mantığı (vanilla JS, bağımlılık yok)
 * ---------------------------------------------------------------------
 * Görevleri (1) REST üzerinden listeler/ekler/günceller/siler,
 * (2) WebSocket üzerinden sistem loglarını canlı izler.
 *
 * Önemli tasarım kararları:
 * - Global scope kirletilmez: her şey IIFE içindedir.
 * - DOM elemanlarına id ile erişilir; HTML'de karşılıkları vardır.
 * - WebSocket koptuğunda üstel geri çekilme (backoff) ile yeniden bağlanır.
 * - Kullanıcı tıkladığı elemana data-action ile işaret konur; olay
 *   delegasyonu kullanılır (her karta ayrı listener eklenmez).
 * ===================================================================== */

(function () {
  "use strict";

  /* ---------------------------------------------------------------- *
   * Yapılandırma ve durum
   * ---------------------------------------------------------------- */
  // Arayüz aynı sunucudan servis edildiği için göreli yol yeterlidir.
  const API_BASE = "/api/v1";
  const WS_URL = (() => {
    const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
    return `${proto}//${window.location.host}/ws/logs`;
  })();

  // Sunucudan gelen görevlerin yerel kopyası (id -> görev)
  const state = {
    tasks: new Map(),
    socket: null,
    reconnectDelay: 1000,   // ms; her denemede iki katına çıkar (max 15s)
    reconnectTimer: null,
    listenersBound: false,
  };

  // Yaygın DOM referansları (tek seferde toplanır)
  const el = {
    form: document.getElementById("task-form"),
    titleInput: document.getElementById("task-title"),
    statusSelect: document.getElementById("task-status"),
    formMessage: document.getElementById("form-message"),
    taskList: document.getElementById("task-list"),
    console: document.getElementById("console"),
    clearConsole: document.getElementById("clear-console"),
    autoscroll: document.getElementById("autoscroll"),
    wsStatus: document.getElementById("ws-status"),
    wsStatusText: document.getElementById("ws-status-text"),
    statTotal: document.getElementById("stat-total"),
    statPending: document.getElementById("stat-pending"),
    statProgress: document.getElementById("stat-progress"),
    statCompleted: document.getElementById("stat-completed"),
    metricCpu: document.getElementById("metric-cpu"),
    metricConn: document.getElementById("metric-conn"),
    metricTime: document.getElementById("metric-time"),
  };

  /* ---------------------------------------------------------------- *
   * Küçük yardımcılar
   * ---------------------------------------------------------------- */

  /**
   * Metni HTML'e güvenle basmak için kaçış yapar.
   * (innerHTML kullanırken XSS'i engellemek için şart.)
   */
  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  /** ISO tarihini saat:dakika:saniye biçimine çevirir. */
  function timeShort(iso) {
    const d = iso ? new Date(iso) : new Date();
    if (Number.isNaN(d.getTime())) return "--:--:--";
    const pad = (n) => String(n).padStart(2, "0");
    return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  }

  /** Tam tarih + saat (kart altında gösterim için). */
  function dateFull(iso) {
    const d = iso ? new Date(iso) : new Date();
    if (Number.isNaN(d.getTime())) return "bilinmiyor";
    return d.toLocaleString("tr-TR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  /** Durum kodunu okunabilir Türkçe etikete çevirir. */
  const STATUS_LABEL = {
    pending: "Bekliyor",
    in_progress: "Devam Ediyor",
    completed: "Tamamlandı",
  };

  /**
   * fetch sarmalayıcı: ağ hatalarını ve HTTP hatalarını tek yerde yönetir.
   * @returns {Promise<any>} Başarılıysa parse edilmiş gövde, 204'te null.
   */
  async function apiFetch(path, options = {}) {
    let response;
    try {
      response = await fetch(`${API_BASE}${path}`, {
        headers: { "Content-Type": "application/json" },
        ...options,
      });
    } catch (networkError) {
      // Sunucu kapalı / ağ koptu
      throw new Error("Sunucuya ulaşılamadı. Bağlantını kontrol et.");
    }

    // 204 No Content: gövde yok
    if (response.status === 204) return null;

    let body = null;
    const text = await response.text();
    if (text) {
      try {
        body = JSON.parse(text);
      } catch {
        body = { detail: text };
      }
    }

    if (!response.ok) {
      // FastAPI hataları { detail: "..." } biçiminde döner.
      // 422'de detail bir dizi olabilir; okunabilir hale getiriyoruz.
      let detail = body && body.detail;
      if (Array.isArray(detail)) {
        detail = detail.map((d) => d.msg || JSON.stringify(d)).join(", ");
      }
      const err = new Error(detail || `İstek başarısız (HTTP ${response.status})`);
      err.status = response.status;
      throw err;
    }

    return body;
  }

  /* ---------------------------------------------------------------- *
   * Form mesajı gösterimi
   * ---------------------------------------------------------------- */
  let messageTimer = null;
  function showMessage(text, type = "info") {
    el.formMessage.textContent = text || "";
    el.formMessage.className = "form-message";
    if (type === "error") el.formMessage.classList.add("is-error");
    if (type === "success") el.formMessage.classList.add("is-success");

    if (messageTimer) clearTimeout(messageTimer);
    if (text) {
      // Mesajı birkaç saniye sonra kendiliğinden sil
      messageTimer = setTimeout(() => {
        el.formMessage.textContent = "";
        el.formMessage.className = "form-message";
      }, 3500);
    }
  }

  /* ---------------------------------------------------------------- *
   * GÖRÜNÜM: istatistikler
   * ---------------------------------------------------------------- */
  function renderStats() {
    const counts = { pending: 0, in_progress: 0, completed: 0 };
    state.tasks.forEach((task) => {
      if (counts[task.status] !== undefined) counts[task.status] += 1;
    });

    el.statTotal.textContent = String(state.tasks.size);
    el.statPending.textContent = String(counts.pending);
    el.statProgress.textContent = String(counts.in_progress);
    el.statCompleted.textContent = String(counts.completed);
  }

  /* ---------------------------------------------------------------- *
   * GÖRÜNÜM: görev kartları
   * ---------------------------------------------------------------- */

  /** Tek bir görev kartının HTML'ini üretir. */
  function taskCardHtml(task) {
    const tamam = task.status === "completed" ? "is-completed" : "";
    const durumSecenekleri = Object.entries(STATUS_LABEL)
      .map(
        ([value, label]) =>
          `<option value="${value}"${task.status === value ? " selected" : ""}>${label}</option>`
      )
      .join("");

    return `
      <article class="task-card ${tamam}" data-status="${escapeHtml(task.status)}" data-id="${escapeHtml(task.id)}">
        <div class="task-main">
          <h3 class="task-title">${escapeHtml(task.title)}</h3>
          <div class="task-meta">
            <span title="Oluşturulma zamanı">🕒 ${escapeHtml(dateFull(task.created_at))}</span>
            <label class="visually-hidden" for="status-${escapeHtml(task.id)}">Durum</label>
            <select class="status-select" id="status-${escapeHtml(task.id)}" data-action="status">
              ${durumSecenekleri}
            </select>
          </div>
        </div>
        <div class="task-actions">
          <button type="button" class="icon-btn" data-action="delete" title="Görevi sil" aria-label="Görevi sil: ${escapeHtml(task.title)}">🗑</button>
        </div>
      </article>
    `;
  }

  /** Tüm görev listesini yeniden çizer. */
  function renderTasks() {
    if (state.tasks.size === 0) {
      el.taskList.innerHTML =
        '<p class="empty-state">Henüz görev yok. Yukarıdaki formdan ilk görevini ekle.</p>';
      return;
    }

    // Map'i diziye çevirip oluşturulma tarihine göre (yeni -> eski) sırala
    const gorevler = Array.from(state.tasks.values()).sort(
      (a, b) => new Date(b.created_at) - new Date(a.created_at)
    );

    el.taskList.innerHTML = gorevler.map(taskCardHtml).join("");
  }

  /* ---------------------------------------------------------------- *
   * API İŞLEMLERİ (CRUD)
   * ---------------------------------------------------------------- */

  /** Sunucudan görevleri çeker ve görünümü günceller. */
  async function loadTasks() {
    try {
      const gorevler = await apiFetch("/tasks");
      state.tasks.clear();
      (gorevler || []).forEach((t) => state.tasks.set(t.id, t));
      renderTasks();
      renderStats();
    } catch (err) {
      el.taskList.innerHTML = `<p class="empty-state is-error">Görevler yüklenemedi: ${escapeHtml(err.message)}</p>`;
    }
  }

  /** Formdan yeni görev oluşturur. */
  async function createTask(event) {
    event.preventDefault();

    const title = el.titleInput.value.trim();
    if (!title) {
      showMessage("Görev başlığı boş olamaz.", "error");
      el.titleInput.focus();
      return;
    }

    const submitBtn = el.form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;

    try {
      const yeni = await apiFetch("/tasks", {
        method: "POST",
        body: JSON.stringify({ title, status: el.statusSelect.value }),
      });

      state.tasks.set(yeni.id, yeni);
      renderTasks();
      renderStats();

      // Formu temizle ve odaklanmayı koru (hızlı ardışık giriş için)
      el.titleInput.value = "";
      el.titleInput.focus();
      showMessage(`"${yeni.title}" görevi eklendi.`, "success");

      kLog(`Görev oluşturuldu: ${yeni.title}`, "system");
    } catch (err) {
      showMessage(err.message, "error");
    } finally {
      submitBtn.disabled = false;
    }
  }

  /** Kart üzerindeki durum seçicisi değişince görevi günceller (PUT). */
  async function updateTaskStatus(taskId, newStatus) {
    try {
      const guncel = await apiFetch(`/tasks/${encodeURIComponent(taskId)}`, {
        method: "PUT",
        body: JSON.stringify({ status: newStatus }),
      });
      state.tasks.set(guncel.id, guncel);
      renderTasks();
      renderStats();
      kLog(`Görev durumu güncellendi: ${guncel.title} → ${STATUS_LABEL[guncel.status] || guncel.status}`, "system");
    } catch (err) {
      // 404 ise yerel kopyayı da temizle (sunucuda yok demek)
      if (err.status === 404) {
        state.tasks.delete(taskId);
        renderTasks();
        renderStats();
        showMessage("Bu görev sunucuda bulunamadı, listeden kaldırıldı.", "error");
      } else {
        showMessage(err.message, "error");
      }
    }
  }

  /** Görevi siler (DELETE). Onay ister. */
  async function deleteTask(taskId) {
    const gorev = state.tasks.get(taskId);
    const ad = gorev ? gorev.title : "Bu görev";

    if (!window.confirm(`"${ad}" görevini silmek istediğine emin misin?`)) return;

    try {
      await apiFetch(`/tasks/${encodeURIComponent(taskId)}`, { method: "DELETE" });
      state.tasks.delete(taskId);
      renderTasks();
      renderStats();
      showMessage("Görev silindi.", "success");
      kLog(`Görev silindi: ${ad}`, "system");
    } catch (err) {
      if (err.status === 404) {
        // Sunucuda zaten yok — arayüzü gerçekle hizala
        state.tasks.delete(taskId);
        renderTasks();
        renderStats();
        showMessage("Bu görev sunucuda bulunamadı, listeden kaldırıldı.", "error");
      } else {
        showMessage(err.message, "error");
      }
    }
  }

  /* ---------------------------------------------------------------- *
   * Görev listesi olay delegasyonu
   * (Her kart için ayrı listener eklemek yerine tek listener ile yönetilir.)
   * ---------------------------------------------------------------- */
  function bindTaskListEvents() {
    if (state.listenersBound) return;
    state.listenersBound = true;

    // Durum değişikliği: select "change" olayı
    el.taskList.addEventListener("change", (event) => {
      const target = event.target;
      if (!(target instanceof HTMLSelectElement)) return;
      if (target.dataset.action !== "status") return;

      const kart = target.closest(".task-card");
      if (!kart) return;
      updateTaskStatus(kart.dataset.id, target.value);
    });

    // Silme: buton "click" olayı
    el.taskList.addEventListener("click", (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      const btn = target.closest('[data-action="delete"]');
      if (!btn) return;

      const kart = btn.closest(".task-card");
      if (!kart) return;
      deleteTask(kart.dataset.id);
    });
  }

  /* ---------------------------------------------------------------- *
   * CANLI KONSOL
   * ---------------------------------------------------------------- */

  /**
   * Konsola satır ekler ve (istenirse) en alta kaydırır.
   * @param {string} text   Gösterilecek metin
   * @param {string} level  info | warn | error | system
   * @param {string} time   Görünecek saat (verilmezse şimdi)
   */
  function kLog(text, level = "info", time = null) {
    const satir = document.createElement("div");
    satir.className = "log-line" + (level === "system" ? " is-system" : "");
    satir.dataset.level = level;

    const seviyeEtiket = level === "system" ? "bilgi" : level;

    satir.innerHTML =
      `<span class="log-time">${escapeHtml(time || timeShort())}</span>` +
      `<span class="log-level">${escapeHtml(seviyeEtiket)}</span>` +
      `<span class="log-msg">${escapeHtml(text)}</span>`;

    el.console.appendChild(satir);

    // Bellek şişmesin: 400 satırdan fazlasını tutma
    const MAX_LINES = 400;
    while (el.console.childElementCount > MAX_LINES) {
      el.console.removeChild(el.console.firstElementChild);
    }

    // Auto-scroll açıksa en alta in
    if (el.autoscroll.checked) {
      el.console.scrollTop = el.console.scrollHeight;
    }
  }

  /** WebSocket bağlantı durumunu üst bardaki rozete yansıtır. */
  function setWsStatus(statusKey, text) {
    el.wsStatus.dataset.state = statusKey;
    el.wsStatusText.textContent = text;
  }

  /** Bağlantı kurulunca sunucudan gelen her sistem logunu işler. */
  function handleLogMessage(raw) {
    let data;
    try {
      data = JSON.parse(raw);
    } catch {
      return; // Bozuk JSON gelirse sessizce yut
    }

    const saat = timeShort(data.timestamp);
    const cpu = typeof data.cpu_usage === "number" ? data.cpu_usage.toFixed(1) : null;
    const baglanti = data.active_connections;

    // Konsola insan okunur satır
    const metin =
      data.message +
      (cpu !== null ? ` · CPU: ${cpu}%` : "") +
      (baglanti !== undefined ? ` · bağlı istemci: ${baglanti}` : "") +
      (data.task_count !== undefined ? ` · görev: ${data.task_count}` : "");

    kLog(metin, data.level || "info", saat);

    // Metrik şeridini güncelle
    if (cpu !== null) el.metricCpu.textContent = `${cpu}%`;
    if (baglanti !== undefined) el.metricConn.textContent = String(baglanti);
    el.metricTime.textContent = saat;
  }

  /** WebSocket'e bağlanır; koparsa backoff ile tekrar dener. */
  function connectWebSocket() {
    if (state.socket && state.socket.readyState <= WebSocket.OPEN) return;

    setWsStatus("connecting", "Bağlanıyor…");
    let socket;
    try {
      socket = new WebSocket(WS_URL);
    } catch {
      setWsStatus("closed", "Bağlantı hatası");
      scheduleReconnect();
      return;
    }
    state.socket = socket;

    socket.addEventListener("open", () => {
      setWsStatus("open", "Canlı yayın açık");
      state.reconnectDelay = 1000; // başarılı bağlantıda gecikmeyi sıfırla
      kLog("WebSocket bağlantısı kuruldu — canlı log akışı başladı.", "system");
    });

    socket.addEventListener("message", (event) => handleLogMessage(event.data));

    socket.addEventListener("close", () => {
      setWsStatus("closed", "Bağlantı koptu");
      kLog("WebSocket bağlantısı kapandı. Yeniden bağlanılıyor…", "system");
      scheduleReconnect();
    });

    socket.addEventListener("error", () => {
      // 'error' olayı genelde 'close' ile birlikte gelir; ekstra iş yapmıyoruz
      setWsStatus("closed", "Bağlantı hatası");
    });
  }

  /** Üstel geri çekilme ile yeniden bağlanma planlar (1s → 2s → 4s … max 15s). */
  function scheduleReconnect() {
    if (state.reconnectTimer) return; // zaten planlanmış
    state.reconnectTimer = setTimeout(() => {
      state.reconnectTimer = null;
      connectWebSocket();
    }, state.reconnectDelay);

    state.reconnectDelay = Math.min(state.reconnectDelay * 2, 15000);
  }

  /* ---------------------------------------------------------------- *
   * Olay bağlamaları (uygulama başlangıcı)
   * ---------------------------------------------------------------- */
  function bind() {
    el.form.addEventListener("submit", createTask);
    bindTaskListEvents();

    el.clearConsole.addEventListener("click", () => {
      el.console.innerHTML = "";
      kLog("Konsol temizlendi.", "system");
    });

    // Sekme tekrar görünür olduğunda bağlantı koptuysa hemen toparlan
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") {
        if (!state.socket || state.socket.readyState > WebSocket.OPEN) {
          state.reconnectDelay = 1000;
          connectWebSocket();
        }
      }
    });

    // Sayfa kapanırken socket'i düzgün kapat (sunucuda hayalet bağlantı kalmasın)
    window.addEventListener("beforeunload", () => {
      if (state.socket) {
        try { state.socket.close(); } catch { /* yoksay */ }
      }
    });
  }

  /* ---------------------------------------------------------------- *
   * Başlangıç
   * ---------------------------------------------------------------- */
  async function init() {
    bind();
    kLog("Arayüz hazır. Sunucudan görevler çekiliyor…", "system");
    await loadTasks();
    connectWebSocket();
  }

  // DOM hazır olduğunda başlat (script defer ile yükleniyor ama garanti olsun)
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
