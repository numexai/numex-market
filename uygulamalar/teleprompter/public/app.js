/* =====================================================================
   STÜDYO TELEPROMPTER — Tarayıcı Motoru (app.js)
   - requestAnimationFrame tabanlı pürüzsüz kaydırma (gerçek delta süre)
   - Kaydırma, .content üzerindeki transform'a tek --scr CSS değişkeniyle uygulanır
   - Klavye: Space=Oynat/Duraklat, A=Geri sayımlı başlat, F=Tam ekran,
             M=Ayna, V=Dikey kayma, ↑/↓=hız, +/-=yazı boyutu, HOME=başa dön
   - Geri sayım: 3 → 2 → 1, ardından A sekron başlar
   - 2 hazır örnek konuşma metni gömülü; kullanıcı kendi metnini yapıştırıp
     canlı yansıtabilir (live edit) veya ekrana tek seferde aktarabilir.
   ===================================================================== */

"use strict";

document.addEventListener("DOMContentLoaded", () => {
  // =========================================================== STATE
  const state = {
    scr: 0,              // son --scr değeri (px)
    scrPos: 0,           // mevcut kaydırma konumu (px) — ana ilerleme değişkeni
    playing: false,
    countdownActive: false,
    speed: 180,          // px / saniye
    baseSize: 48,        // px
    mirrored: false,
    verticalScroll: true,
    liveEdit: true,
    lastTime: null,      // rAF delta hesabı
    title: "",
    text: "",
    maxScroll: 0,        // en çok kaydırılabilecek px
    currentPreset: "yeni",
    pristine: true,      // ekrana aktarılmış metin değişti mi
  };
  let rafActive = false;
  let toastTimer = null;

  // =========================================================== DOM
  const $ = (id) => document.getElementById(id);
  const contentEl = $("scrollContent");
  const speechTextEl = $("speechText");
  const speechTitleEl = $("speechTitle");
  const teleprompterEl = $("teleprompter");
  const progressBar = $("seekSlider");
  const elapsedEl = $("elapsed");
  const statusBadge = $("statusBadge");
  const playBtn = $("btnPlay");
  const playIcon = $("playIcon");
  const playLabel = $("playLabel");
  const toastEl = $("toast");
  const editor = $("textEditor");
  const wordCountEl = $("wordCount");
  const titleInput = $("speechTitleInput");
  const countdownEl = $("countdown");
  const countdownNumber = $("countdownNumber");
  const presetSel = $("presetSelect");
  const btnApply = $("btnApplyText");
  const btnLive = $("btnLiveEdit");
  const btnHome = $("btnHome");
  const btnCount = $("btnCountdown");
  const btnPlayCtl = $("btnPlay");
  const btnFull = $("btnFullscreen");
  const btnMirrorCtl = $("btnMirror");
  const btnVScrollCtl = $("btnVScroll");
  const btnSizePlus = $("btnSizePlus");
  const btnSizeMinus = $("btnSizeMinus");
  const speedSlider = $("speedSlider");
  const speedValue = $("speedValue");
  const sizeSlider = $("sizeSlider");
  const sizeValue = $("sizeValue");

  // =========================================================== HAZIR ÖRNEK METİNLER
  const SAMPLE = {
    cumhuriyet: {
      title: "CUMHURİYET BAYRAMI KONUŞMASI",
      body:
`Sevgili vatandaşlarım, kıymetli konuklar, değerli basın mensupları,

Bugün burada, Cumhuriyetimizin kuruluşunun yıl dönümünü kutlamak üzere bir araya geldik. Yüzüncü yıla ulaşmış bir irade, sönmeyen bir meşalenin ışığında buluşuyoruz.

Cumhuriyet, yalnızca bir yönetim biçimi değildir; bir milletin yeniden doğuşudur. Ulu Önder Mustafa Kemal Atatürk'ün önderliğinde, çelikten bir iradeyle kazanılan bu zafer, milletimizin azim ve kararlılığının en büyük nişanesidir. Dumlupınar'dan Büyük Taarruz'a, her cephede canını ortaya koyan kahramanlarımız bugün bu bayrağın dalgalanmasını sağlamıştır.

Bizlere düşen görev, bu mirası hak ettiği biçimde geleceğe taşımaktır. Bilimde, sanatta, teknolojide ve eğitimde çağın ötesine geçmeyi hedeflemeliyiz. Yarınlarımızın teminatı olan gençlerimize güveniyorum; onların gözlerindeki ışık, yolumuzu aydınlatmaya devam edecektir.

Bu duygu ve düşüncelerle Cumhuriyet Bayramı'nı kutluyor; başta Gazi Mustafa Kemal Atatürk olmak üzere, vatanı uğruna can veren tüm şehitlerimizi rahmetle, gazilerimizi minnetle anıyorum. Cumhuriyetimiz nice yüzyıllara, daima ilelebet yaşasın.
Ne mutlu Türküm diyene!`
    },
    lansman: {
      title: "ÜRÜN LANSMAN SUNUMU — GELECEĞE AÇILAN KAPI",
      body:
`Herkese merhaba ve hoş geldiniz. Bugün sizlere, son üç yıldır gece gündüz üzerinde çalıştığımız ve bugüne dek hayata geçirdiğimiz en kapsamlı projeyi tanıtmak için buradayız: Akıllı Platform.

Öncelikle seyircilerimize kısaca bir perspektif vermek istiyorum. Dünya çapında milyonlarca kullanıcı, her gün yüzlerce farklı işlemi tek bir noktadan, hızlı ve güvenilir şekilde yönetmeye ihtiyaç duyuyor. Biz de bu ihtiyacı görerek yola çıktık ve kullanıcının hayatını kolaylaştıracak, uçtan uca bir deneyim tasarladık.

İşte tam bu noktada, ekibimizin geliştirdiği yenilikçi yapay zekâ motoru devreye giriyor. Üç temel güç üzerine inşa edildik: Yüksek hız, ölçeklenebilirlik ve kullanıcı dostu arayüz.

Hız dediğimizde abartmıyoruz; platformumuz rakiplerine kıyasla on kat daha kısa sürede üretken sonuçlar sunuyor. Bunu, uçtan uca en yeni mikro-mimariyi kullanarak sağlıyoruz. Ölçeklenebilirlik, müşterilerimizin büyüme kaygısı duymadan operasyonlarını büyütebilmesi anlamına geliyor.

Elbette teknolojinin gücü, insan merkezli tasarımla birleştiğinde anlam kazanır. Bu yüzden platformumuzu sıfır eğitim gerektirir şekilde tasarladık. İlk dakikadan itibaren kullanıcılarımız akıcı bir şekilde üretim yapmaya başlıyor.

Şimdi canlı bir gösterimle platformumuzun neler yapabildiğini hep birlikte göreceğiz. Lütfen ekran görüntülerine dikkat edin. Buradaki her panel, gerçek kullanıcı verisiyle çalışmaktadır.

Bugün yaptığımız bu tanıtımın, önümüzdeki dönem yazacağımız hikâyenin yalnızca bir başlangıcı olduğuna inanıyoruz. Geleceğe açılan bu kapıda sizlerle birlikte yürümekten büyük mutluluk duyuyoruz. Sorularınızı memnuniyetle bekliyorum. Hepinize katılımınız için teşekkür ederim.

Bu yeni dönemi birlikte inşa edelim. Yardımlarınız, geri bildirimleriniz ve bitmek bilmeyen enerjiniz için şimdiden minnettarım. Görüşmek dileğiyle.`
    }
  };

  // =========================================================== YARDIMCILAR
  function showToast(msg, kind) {
    toastEl.textContent = msg;
    toastEl.className = "toast show" + (kind ? " " + kind : "");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove("show"), 2200);
  }

  function fmtTime(sec) {
    const m = Math.floor(sec / 60).toString().padStart(2, "0");
    const s = Math.floor(sec % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  }

  function updateStatus() {
    if (!state.verticalScroll) { statusBadge.textContent = "DİKEY KAYMA KAPALI"; statusBadge.className = "status-badge scr paused"; return; }
    statusBadge.textContent = state.playing ? "● KAYITTA" : (state.countdownActive ? "GERİ SAYIM…" : "HAZIR");
    statusBadge.className = "status-badge scr " + (state.playing ? "running" : "paused");
  }

  // =========================================================== GÖRÜNÜM (--scr) UYGULA
  // scrollY px değerini clamp'layıp .content'in CSS değişkenine yazar.
  function pushScrollY(y) {
    if (!state.verticalScroll) { contentEl.style.setProperty("--scr", "0px"); progressBar.value = 0; renderElapsed(0); return; }
    const clamped = Math.max(0, Math.min(y, state.maxScroll));
    contentEl.style.setProperty("--scr", (-clamped) + "px");
    // konum çubuğu + süre geri bildirimi
    if (state.maxScroll > 0) {
      const pct = clamped / state.maxScroll;
      progressBar.value = Math.round(pct * 1000);
      const sec = clamped / state.speed;
      renderElapsed(sec);
    }
  }

  function renderElapsed(sec) {
    elapsedEl.textContent = fmtTime(sec);
  }

  // =========================================================== METİN / REFLOW
  function applyBaseSize(px) {
    state.baseSize = px;
    sizeValue.textContent = px + " px";
    sizeSlider.value = px;
    // CSS değişkenleri üzerinden tipografi + başlık oranı
    contentEl.style.setProperty("--base", px + "px");
  }

  function reflow() {
    const winH = window.innerHeight;
    const height = contentEl.scrollHeight || 0;
    // Metin sonunun ekranın ~%26 üst noktasında durması için gerekli yol.
    // height içerisindeki üst 14vh padding kaydırma öncesi okuma payıdır.
    const tailEnd = winH * 0.26 + winH * 0.60; // alt 60vh kuyruk + son konum payı
    state.maxScroll = Math.max(0, height - tailEnd);
    if (!state.verticalScroll) state.maxScroll = 0;
  }

  function setActiveText(title, body) {
    speechTitleEl.textContent = title || "";
    speechTitleEl.style.display = title ? "" : "none";
    // body'yi biçimli aktar (paragrafları koru)
    speechTextEl.textContent = body || "";
    state.title = title || "";
    state.text = body || "";
    // Sıfırdan
    state.scrPos = 0;
    pushScrollY(0);
    reflow();
    updateStatus();
  }

  function setMirror(v) {
    state.mirrored = v;
    contentEl.classList.toggle("mirrored", v);
    btnMirrorCtl.setAttribute("aria-pressed", String(v));
    showToast(v ? "🪞 Ayna modu açık" : "👁 Ayna modu kapalı", v ? "cyan" : "");
  }

  function setVerticalScroll(v) {
    state.verticalScroll = v;
    btnVScrollCtl.setAttribute("aria-pressed", String(v));
    if (!v) { if (state.playing) pauseNow(); state.scr = 0; pushScrollY(0); }
    else reflow();
    updateStatus();
    showToast(v ? "↕ Dikey kayma: AÇIK" : "— Dikey kayma: KAPALI", v ? "" : "warn");
  }

  function updateWordCount() {
    const text = editor.value.trim();
    const words = text ? text.split(/\s+/).length : 0;
    wordCountEl.textContent = `${words} kelime · ${editor.value.length} karakter`;
  }

  // =========================================================== OYNATMA
  function playNow() {
    if (state.countdownActive) return;
    if (!state.verticalScroll || state.maxScroll <= 0) {
      showToast("Bir konuşma metni ve dikey kayma gerekiyor", "warn");
      return;
    }
    state.playing = true;
    renderPlayPause();
    updateStatus();
    startRaf();
    showToast("▶ Akış başladı");
  }

  function pauseNow() {
    state.playing = false;
    renderPlayPause();
    updateStatus();
    showToast("⏸ Duraklatıldı");
  }

  function setPlaying(v) { v ? playNow() : pauseNow(); }

  function renderPlayPause() {
    playIcon.textContent = state.playing ? "❚❚" : "▶";
    playLabel.textContent = state.playing ? "Duraklat" : "Başlat";
    btnPlayCtl.classList.toggle("playing", state.playing);
  }

  function clickTransport(fromSpace) {
    if (state.countdownActive) return;
    setPlaying(!state.playing);
  }

  // =========================================================== rAF DÖNGÜSÜ
  function startRaf() {
    if (rafActive) return;
    rafActive = true;
    state.lastTime = null;
    requestAnimationFrame(tick);
  }

  function tick(now) {
    if (!state.playing) { rafActive = false; return; }
    if (state.lastTime == null) { state.lastTime = now; rafActive = true; requestAnimationFrame(tick); return; }
    const dt = Math.min((now - state.lastTime) / 1000, 0.1);
    state.lastTime = now;

    const old = (typeof state.scrPos === "number") ? state.scrPos : 0;
    // (auditor: 'storedOldScr' tanımsız global'a atama ReferenceError üretir — kaldırıldı)
    // maxScroll bitti → otomatik duraksat
    state.scrPos = old + state.speed * dt;
    if (state.scrPos >= state.maxScroll) {
      state.scrPos = state.maxScroll;
      pushScrollY(state.scrPos);
      const done = state.playing;
      state.playing = false;
      renderPlayPause();
      updateStatus();
      if (done) showToast("🏁 Sonuna ulaşıldı", "cyan");
      rafActive = false;
      return;
    }
    pushScrollY(state.scrPos);
    rafActive = true;
    requestAnimationFrame(tick);
  }

  function jumpTo(pct) {
    state.scrPos = Math.max(0, Math.min(pct, 1)) * state.maxScroll;
    pushScrollY(state.scrPos);
    reflowNonIntrusive();
  }

  function reflowNonIntrusive() {
    const cur = Math.abs(parseFloat(contentEl.style.getPropertyValue("--scr") || "0"));
    const oldMax = state.maxScroll;
    reflow();
    if (oldMax > 0 && state.maxScroll > 0) {
      const ratio = cur / oldMax;
      state.scrPos = ratio * state.maxScroll;
    }
    pushScrollY(state.scrPos);
  }

  // =========================================================== GERİ SAYIM (A)
  function startCountdown() {
    if (state.countdownActive) return;
    if (!state.verticalScroll || state.maxScroll <= 0) {
      showToast("Önce bir konuşma metni ve dikey kayma gerekli", "warn");
      return;
    }
    // Zaten oynuyorsa geri sayım taze başlasın diye duraklat
    if (state.playing) pauseNow();

    state.countdownActive = true;
    btnCount.classList.add("counting");
    const overlay = countdownEl;
    const num = countdownNumber;
    const label = document.createElement("div");
    label.className = "cd-label";
    label.textContent = "KAYIT BAŞLIYOR";
    overlay.appendChild(label);

    overlay.classList.add("active");
    overlay.setAttribute("aria-hidden", "false");
    updateStatus();

    // 3 → 2 → 1 → GO → oynat (basit setTimeOut zinciri)
    function playNumber(n) {
      num.classList.remove("count-cyan");
      num.textContent = String(n);
      num.style.animation = "none";
      void num.offsetWidth; // reflow tetikle → animasyon yeniden başlar
      num.style.animation = "";
    }
    function showGo() {
      num.classList.add("count-cyan");
      num.textContent = "GO!";
      num.style.animation = "none";
      void num.offsetWidth;
      num.style.animation = "";
      setTimeout(goLive, 620);
    }
    function goLive() {
      // overlay'i kapar, en başa döner, oynatmayı başlatır
      label.remove();
      overlay.classList.remove("active");
      overlay.setAttribute("aria-hidden", "true");
      num.classList.remove("count-cyan");
      num.textContent = "3";
      btnCount.classList.remove("counting");

      state.countdownActive = false;
      state.scrPos = 0;
      pushScrollY(0);
      playNow();
    }

    playNumber(3);
    setTimeout(() => { playNumber(2); }, 1000);
    setTimeout(() => { playNumber(1); }, 2000);
    setTimeout(showGo, 3000);
  }

  // =========================================================== BOYUT / HIZ
  function changeBaseSize(delta) {
    let n = (typeof sizeSlider.value === "string" ? parseFloat(sizeSlider.value) : state.baseSize) + delta;
    n = Math.max(20, Math.min(120, n));
    applyBaseSize(n);
    reflowNonIntrusive();
  }

  function changeSpeed(delta) {
    let n = state.speed + delta;
    n = Math.max(10, Math.min(500, n));
    state.speed = n;
    speedSlider.value = n;
    speedValue.textContent = n + " px/s";
  }

  // =========================================================== TAM EKRAN
  function toggleFullscreen() {
    try {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().then(() => showToast("⛶ Tam ekran açık", "cyan"));
      } else {
        document.exitFullscreen();
      }
    } catch (e) {
      showToast("Tarayıcı tam ekranı reddetti", "warn");
    }
  }

  function goHome() {
    state.scrPos = 0;
    contentEl.classList.add("jumping");
    pushScrollY(0);
    setTimeout(() => contentEl.classList.remove("jumping"), 450);
    if (!state.verticalScroll) setVerticalScroll(true);
    showToast("⟲ En başa dönüldü");
  }

  // =========================================================== METİN YÖNETİMİ
  function loadPresetToEditor(key) {
    if (key === "yeni" || !SAMPLE[key]) {
      editor.value = "";
      titleInput.value = "";
      state.currentPreset = "yeni";
      updateWordCount();
      showToast("📝 Boş metin hazırlanıyor");
      return;
    }
    const s = SAMPLE[key];
    editor.value = s.body;
    titleInput.value = s.title;
    state.currentPreset = key;
    updateWordCount();
    if (state.liveEdit) applyEditorToPrompt(false);
    showToast("📄 Örnek metin yüklendi", "cyan");
  }

  function applyEditorToPrompt(silent) {
    const title = titleInput.value.trim();
    const body = editor.value;
    setActiveText(title, body);
    state.pristine = true;
    renderPlayPause(); // playing durumuna göre buton
    if (!silent) showToast("📋 Metin ekrana aktarıldı");
  }

  // Canlı yansı (live mirror) — metin yazılırken ekranı güncelle
  function handleLiveEdit() {
    if (!state.liveEdit) return;
    const body = editor.value;
    speechTextEl.textContent = body;
    // canlı yazarken çok hızlı reflow olmasını istemeyiz; gelince sakla ve yeniden ölç
    if (!body) return;
    const title = state.pristine ? speechTitleEl.textContent : titleInput.value.trim();
    speechTitleEl.textContent = title || "";
    speechTitleEl.style.display = title ? "" : "none";
    // reflow'u bir sonraki rAF'a it (throttle)
    requestAnimationFrame(reflowNonIntrusive);
  }

  // =========================================================== KLAVYE
  function handleKey(ev) {
    const tag = (ev.target.tagName || "").toLowerCase();
    const isEditing = tag === "input" || tag === "textarea" || tag === "select";
    const k = ev.key;

    // Ayrı ayrı her kısayol — input'ta isen sadece global olmayanlar pasif
    if (k === " ") {
      if (isEditing) return;
      ev.preventDefault();
      clickTransport();
      return;
    }
    if (isEditing) return; // düzenleme alanındayken diğer kısayollar pasif

    switch (k) {
      case "a": case "A": ev.preventDefault(); startCountdown(); break;
      case "f": case "F": toggleFullscreen(); break;
      case "m": case "M": setMirror(!state.mirrored); break;
      case "v": case "V": setVerticalScroll(!state.verticalScroll); break;
      case "ArrowUp": ev.preventDefault(); changeSpeed(15); break;
      case "ArrowDown": ev.preventDefault(); changeSpeed(-15); break;
      case "+": case "=": changeBaseSize(3); break;
      case "-": case "_": changeBaseSize(-3); break;
      case "Home": goHome(); break;
      default: break;
    }
  }

  // =========================================================== BİNDİNG
  function bind() {
    playBtn.addEventListener("click", () => { if (!state.countdownActive) setPlaying(!state.playing); });
    btnCount.addEventListener("click", startCountdown);
    btnHome.addEventListener("click", goHome);
    btnFull.addEventListener("click", toggleFullscreen);
    btnMirrorCtl.addEventListener("click", () => setMirror(!state.mirrored));
    btnVScrollCtl.addEventListener("click", () => setVerticalScroll(!state.verticalScroll));
    btnSizePlus.addEventListener("click", () => changeBaseSize(6));
    btnSizeMinus.addEventListener("click", () => changeBaseSize(-6));

    // Hız slider
    speedSlider.addEventListener("input", () => {
      state.speed = parseFloat(speedSlider.value);
      speedValue.textContent = state.speed + " px/s";
    });
    speedValue.textContent = state.speed + " px/s";

    // Boyut slider
    sizeSlider.addEventListener("input", () => {
      const v = parseFloat(sizeSlider.value);
      applyBaseSize(v);
      reflowNonIntrusive();
    });

    // Konum çubuğu
    progressBar.addEventListener("input", () => {
      state.playing = false;
      renderPlayPause();
      updateStatus();
      const pct = parseFloat(progressBar.value) / 1000;
      jumpTo(pct);
    });

    // Metni ekrana aktar
    btnApply.addEventListener("click", () => applyEditorToPrompt());

    // Canlı yansı aç-kapat
    btnLive.addEventListener("click", () => {
      state.liveEdit = !state.liveEdit;
      btnLive.setAttribute("aria-pressed", String(state.liveEdit));
      btnLive.textContent = state.liveEdit ? "⚡ Canlı Yansı AÇIK" : "— Canlı Yansı KAPALI";
      showToast(state.liveEdit ? "⚡ Canlı yansıma açık" : "— Canlı yansıma kapalı", state.liveEdit ? "" : "warn");
    });

    // Editor input
    editor.addEventListener("input", () => {
      updateWordCount();
      if (state.liveEdit) handleLiveEdit();
    });

    // Başlık input
    titleInput.addEventListener("input", () => {
      if (state.liveEdit) {
        const t = titleInput.value.trim();
        speechTitleEl.textContent = t;
        speechTitleEl.style.display = t ? "" : "none";
      }
    });

    // Hazır şablon seç
    presetSel.addEventListener("change", () => loadPresetToEditor(presetSel.value));

    document.addEventListener("keydown", handleKey);
    window.addEventListener("resize", () => { reflowNonIntrusive(); });

    // Fare ile drag-to-scroll (klavye destekli cihazlarda yardımcı)
    let dragging = false, startY = 0, startScr = 0;
    contentEl.addEventListener("mousedown", (e) => {
      dragging = true; startY = e.clientY;
      startScr = (typeof state.scrPos === "number") ? state.scrPos : 0;
      contentEl.classList.add("dragging");
      if (state.playing) { pauseNow(); }
    });
    document.addEventListener("mousemove", (e) => {
      if (!dragging) return;
      const dy = startY - e.clientY;
      state.scrPos = Math.max(0, Math.min(startScr + dy, state.maxScroll));
      pushScrollY(state.scrPos);
    });
    document.addEventListener("mouseup", () => {
      if (!dragging) return;
      dragging = false;
      contentEl.classList.remove("dragging");
    });

    // Tam ekran değişince yeniden ölç
    document.addEventListener("fullscreenchange", () => setTimeout(reflowNonIntrusive, 60));
  }

  // =========================================================== BAŞLAT
  function boot() {
    applyBaseSize(state.baseSize);
    setMirror(false);
    pushScrollY(0);
    updateStatus();
    renderPlayPause();
    bind();
    // İlk şablonu yükle (Cumhuriyet Bayramı) — uzun metin kaymayı hemen göstersin
    loadPresetToEditor("cumhuriyet");
    applyEditorToPrompt(true);
  }

  boot();
});
