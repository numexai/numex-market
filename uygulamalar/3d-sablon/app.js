/* ============================================================
   NUMEX SOFT ID — Durum makinesi
   LOGIN → VERIFY → SUCCESS
   Demo amaçlıdır; parola ve kod hiçbir yere gönderilmez/saklanmaz.
   ============================================================ */
(function () {
  "use strict";

  /* ---------- 1. DEMO SABİTLERİ ---------- */
  const DEMO = {
    email: "demo@numex.ai",
    password: "Numex2026!",
    otp: "482913",
    maxOtpAttempts: 5,
    resendCooldown: 30
  };

  const PWD_MIN = 8;
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;

  /* ---------- 2. DURUM ---------- */
  const state = {
    phase: "LOGIN",      // LOGIN | VERIFY | SUCCESS
    email: "",
    busy: false,
    otpAttempts: 0,
    otpValue: "",
    resendLeft: 0
  };

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  /* ---------- 3. ELEMANLAR ---------- */
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const el = {
    body: document.body,
    cardLogin: $("#cardLogin"),
    cardVerify: $("#cardVerify"),
    cardSuccess: $("#cardSuccess"),
    loginForm: $("#loginForm"),
    loginBtn: $("#loginBtn"),
    email: $("#email"),
    password: $("#password"),
    emailError: $("#emailError"),
    passwordError: $("#passwordError"),
    formNote: $("#formNote"),
    togglePassword: $("#togglePassword"),
    remember: $("#remember"),
    forgot: $("#forgot"),
    createAccount: $("#createAccount"),
    verifyMail: $("#verifyMail"),
    otpForm: $("#otpForm"),
    otpGroup: $("#otpGroup"),
    otpCells: $$(".otp__cell"),
    otpError: $("#otpError"),
    verifyBtn: $("#verifyBtn"),
    resendBtn: $("#resendBtn"),
    resendTimer: $("#resendTimer"),
    backBtn: $("#backBtn"),
    successMail: $("#successMail"),
    sessionId: $("#sessionId"),
    logoutBtn: $("#logoutBtn"),
    lock: $("#lock"),
    lockWrap: $("#lockWrap"),
    shapes: $$(".shape"),
    glow: $("#pointerGlow")
  };

  /* ---------- 4. YARDIMCILAR ---------- */
  const wait = (ms) => new Promise((r) => setTimeout(r, reducedMotion.matches ? 0 : ms));

  function setFieldError(fieldName, message) {
    const field = $(`[data-field="${fieldName}"]`);
    const errorEl = fieldName === "email" ? el.emailError : el.passwordError;
    if (message) {
      field.classList.add("has-error");
      errorEl.textContent = message;
      errorEl.classList.add("is-shown");
    } else {
      field.classList.remove("has-error");
      errorEl.textContent = "";
      errorEl.classList.remove("is-shown");
    }
  }

  function setNote(text, kind) {
    el.formNote.textContent = text || "";
    el.formNote.classList.toggle("is-error", kind === "error");
    el.formNote.classList.toggle("is-ok", kind === "ok");
  }

  function setLoading(btn, on) {
    btn.classList.toggle("is-loading", on);
    btn.disabled = on;
  }

  function setLockState(which) {
    el.lock.dataset.lock = which; // locked | open
    el.lock.setAttribute("aria-label",
      which === "open" ? "Üç boyutlu kilit simgesi — açık" : "Üç boyutlu kilit simgesi — kilitli");
  }

  function randomSessionId() {
    const bytes = new Uint8Array(8);
    if (window.crypto && crypto.getRandomValues) crypto.getRandomValues(bytes);
    else for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
    return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("").toUpperCase().match(/.{1,4}/g).join("-");
  }

  /* ---------- 5. EKRAN GEÇİŞLERİ ---------- */
  const cards = { LOGIN: el.cardLogin, VERIFY: el.cardVerify, SUCCESS: el.cardSuccess };

  async function goTo(phase, opts = {}) {
    if (state.phase === phase && !opts.force) return;
    const from = cards[state.phase];
    const to = cards[phase];

    if (!reducedMotion.matches && !opts.instant) {
      from.classList.remove("is-entering");
      from.classList.add("is-leaving");
      // NUMEX-DÜZELTME (2026-11-22): Kart geçişinde .is-leaving animasyonu 470ms'de bitiyordu ama wait(360) ile erken kesiliyordu; kesilen animasyonun son karesi (blur + düşük opacity) bırakılan kartın inline stiline yapışıp sayfa buğulu kalıyordu. Bekleme süresi animasyon süresine eşitlendi, sınıf temizliği ve inline --rx/--ry sıfırlaması eklendi.
      await wait(470);
    }

    // Kartın eğimi (inline custom property) bırakılan kartta kalmasın; animasyon yarıda kalmasın.
    from.classList.remove("is-leaving", "is-entering");
    from.hidden = true;
    from.setAttribute("aria-hidden", "true");
    from.style.removeProperty("--rx");
    from.style.removeProperty("--ry");

    to.hidden = false;
    to.removeAttribute("aria-hidden");
    state.phase = phase;
    el.body.dataset.state = phase.toLowerCase();

    if (!reducedMotion.matches && !opts.instant) {
      // Kart girişi .is-entering animasyonuyla; animasyon bitince sınıf düşer,
      // aksi hâlde animasyonun son karesi (blur/opacity) kartı buğulu bırakır.
      to.classList.add("is-entering");
      await wait(40);
      void to.offsetWidth;
      window.setTimeout(() => to.classList.remove("is-entering"), 700);
    }
    if (phase === "VERIFY") focusFirstEmptyCell();
    if (phase === "LOGIN") el.email.focus({ preventScroll: true });
  }

  /* ---------- 6. GİRİŞ FORMU ---------- */
  function validateLogin() {
    let ok = true;
    const email = el.email.value.trim();
    const pwd = el.password.value;

    if (!email) {
      setFieldError("email", "E-posta adresi gerekli.");
      ok = false;
    } else if (!EMAIL_RE.test(email)) {
      setFieldError("email", "Geçerli bir e-posta adresi gir (ör. ad@alan.com).");
      ok = false;
    } else {
      setFieldError("email", "");
    }

    if (!pwd) {
      setFieldError("password", "Şifre gerekli.");
      ok = false;
    } else if (pwd.length < PWD_MIN) {
      setFieldError("password", `Şifre en az ${PWD_MIN} karakter olmalı.`);
      ok = false;
    } else {
      setFieldError("password", "");
    }

    return ok;
  }

  el.loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (state.busy) return;
    setNote("");

    if (!validateLogin()) {
      const bad = $(".field.has-error .field__input");
      if (bad) bad.focus({ preventScroll: true });
      return;
    }

    state.busy = true;
    setLoading(el.loginBtn, true);
    setNote("Kimlik bilgileri kontrol ediliyor…");
    await wait(750);

    const email = el.email.value.trim();
    const pwd = el.password.value;
    const matches = email.toLowerCase() === DEMO.email && pwd === DEMO.password;

    if (!matches) {
      setLoading(el.loginBtn, false);
      state.busy = false;
      setNote("E-posta veya şifre hatalı. Demo bilgilerini kullanabilirsin.", "error");
      setFieldError("password", "Kimlik bilgileri eşleşmedi.");
      el.cardLogin.classList.add("is-entering");
      await wait(10);
      el.cardLogin.classList.remove("is-entering");
      return;
    }

    /* --- Doğru giriş: kilit öne gelir ve açılır --- */
    state.email = email;
    state.otpAttempts = 0;
    setNote("Doğrulama kodu hazırlanıyor…", "ok");

    el.lockWrap.classList.add("is-unlocking");
    await wait(280);
    setLockState("open");
    await wait(560);
    el.lockWrap.classList.remove("is-unlocking");

    setLoading(el.loginBtn, false);
    state.busy = false;

    el.verifyMail.textContent = state.email;
    resetOtp();
    startResendCooldown();
    el.password.value = "";
    await goTo("VERIFY");
    startResendTimer();
  });

  /* Giriş alanları: anlık doğrulama temizliği + odak ışığı */
  ["email", "password"].forEach((name) => {
    const input = el[name];
    const field = input.closest(".field");
    const shell = input.closest(".field__shell");

    input.addEventListener("focus", () => field.classList.add("is-focus"));
    input.addEventListener("blur", () => field.classList.remove("is-focus"));
    input.addEventListener("input", () => {
      if (field.classList.contains("has-error")) setFieldError(name, "");
      setNote("");
    });
    shell.addEventListener("pointermove", (ev) => {
      const r = shell.getBoundingClientRect();
      shell.style.setProperty("--fx", `${((ev.clientX - r.left) / r.width) * 100}%`);
    });
  });

  el.togglePassword.addEventListener("click", () => {
    const show = el.password.type === "password";
    el.password.type = show ? "text" : "password";
    el.togglePassword.setAttribute("aria-pressed", String(show));
    el.togglePassword.setAttribute("aria-label", show ? "Şifreyi gizle" : "Şifreyi göster");
    el.password.focus({ preventScroll: true });
  });

  $$("[data-fill]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const key = btn.dataset.fill;
      el[key].value = DEMO[key];
      setFieldError(key, "");
      setNote("");
      el[key].focus({ preventScroll: true });
    });
  });

  el.forgot.addEventListener("click", (e) => {
    e.preventDefault();
    setNote("Demo modunda parola sıfırlama kapalı. Demo şifresi: Numex2026!", "ok");
  });
  el.createAccount.addEventListener("click", (e) => {
    e.preventDefault();
    setNote("Demoda yalnızca hazır demo hesabı vardır — Hesap oluşturma canlı ortamda sunucu gerektirir.", "ok");
  });

  /* ---------- 7. OTP MANTIĞI ---------- */
  function otpString() {
    return el.otpCells.map((c) => c.value).join("");
  }

  function refreshOtpVisual() {
    el.otpCells.forEach((c) => {
      c.classList.toggle("is-filled", c.value !== "");
      c.classList.toggle("is-active", document.activeElement === c);
    });
    el.otpGroup.classList.remove("is-error");
    el.otpError.textContent = "";
    el.otpError.classList.remove("is-shown");
  }

  function resetOtp() {
    el.otpCells.forEach((c) => (c.value = ""));
    el.otpGroup.classList.remove("is-ok", "is-error", "is-shake");
    el.otpError.textContent = "";
    el.otpError.classList.remove("is-shown");
    refreshOtpVisual();
    state.otpValue = "";
  }

  function focusFirstEmptyCell() {
    const empty = el.otpCells.find((c) => c.value === "");
    (empty || el.otpCells[el.otpCells.length - 1]).focus({ preventScroll: true });
  }

  el.otpCells.forEach((cell, i) => {
    cell.addEventListener("focus", () => {
      cell.select();
      refreshOtpVisual();
    });
    cell.addEventListener("blur", () => cell.classList.remove("is-active"));

    cell.addEventListener("input", (e) => {
      const digits = e.target.value.replace(/\D/g, "");
      if (!digits) { e.target.value = ""; refreshOtpVisual(); return; }

      /* Yapıştırma / otomatik doldurma: birden çok hane birden gelirse dağıt */
      if (digits.length > 1) {
        fillFrom(i, digits);
        return;
      }
      e.target.value = digits.slice(-1);
      refreshOtpVisual();
      if (i < el.otpCells.length - 1) el.otpCells[i + 1].focus({ preventScroll: true });
      maybeAutoSubmit();
    });

    cell.addEventListener("keydown", (e) => {
      if (e.key === "Backspace") {
        if (cell.value) {
          cell.value = "";
          refreshOtpVisual();
        } else if (i > 0) {
          e.preventDefault();
          el.otpCells[i - 1].focus({ preventScroll: true });
          el.otpCells[i - 1].value = "";
          refreshOtpVisual();
        }
        if (el.otpGroup.classList.contains("is-error")) refreshOtpVisual();
        return;
      }
      if (e.key === "Delete") { cell.value = ""; refreshOtpVisual(); return; }
      if (e.key === "ArrowLeft" && i > 0) { e.preventDefault(); el.otpCells[i - 1].focus(); }
      if (e.key === "ArrowRight" && i < el.otpCells.length - 1) { e.preventDefault(); el.otpCells[i + 1].focus(); }
      if (e.key === "Enter") { e.preventDefault(); el.otpForm.requestSubmit(); }
    });

    cell.addEventListener("paste", (e) => {
      const text = (e.clipboardData || window.clipboardData).getData("text") || "";
      const digits = text.replace(/\D/g, "");
      if (!digits) return;
      e.preventDefault();
      fillFrom(0, digits);
    });
  });

  function fillFrom(startIndex, rawDigits) {
    const digits = rawDigits.replace(/\D/g, "").slice(0, el.otpCells.length);
    digits.split("").forEach((d, k) => {
      const idx = startIndex + k;
      if (idx < el.otpCells.length) el.otpCells[idx].value = d;
    });
    const nextIdx = Math.min(startIndex + digits.length, el.otpCells.length - 1);
    el.otpCells[nextIdx].focus({ preventScroll: true });
    refreshOtpVisual();
    maybeAutoSubmit();
  }

  function maybeAutoSubmit() {
    if (otpString().length === el.otpCells.length && !state.busy) {
      window.setTimeout(() => el.otpForm.requestSubmit(), 160);
    }
  }

  el.otpForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (state.busy) return;
    if (state.otpAttempts >= DEMO.maxOtpAttempts) {
      showOtpError("Çok fazla deneme. Giriş ekranına dönüp yeniden başla.");
      return;
    }
    el.otpError.style.color = "";

    const code = otpString();
    if (code.length < el.otpCells.length) {
      showOtpError(`Kod ${el.otpCells.length} haneli olmalı — ${code.length}/${el.otpCells.length} girildi.`);
      return;
    }

    state.busy = true;
    setLoading(el.verifyBtn, true);
    await wait(680);

    if (code !== DEMO.otp) {
      state.otpAttempts += 1;
      setLoading(el.verifyBtn, false);
      state.busy = false;

      const left = DEMO.maxOtpAttempts - state.otpAttempts;
      el.otpGroup.classList.add("is-error", "is-shake");
      showOtpError(left > 0
        ? `Kod hatalı. ${left} deneme hakkın kaldı.`
        : "Deneme hakkı doldu. Giriş ekranına dönüp yeniden başla.");
      window.setTimeout(() => el.otpGroup.classList.remove("is-shake"), 520);
      window.setTimeout(() => {
        if (state.otpAttempts < DEMO.maxOtpAttempts) {
          resetOtp();
          el.otpCells[0].focus({ preventScroll: true });
        }
      }, 620);
      return;
    }

    /* --- Doğru kod: kilit açılır, ışık yayılır --- */
    el.otpGroup.classList.add("is-ok");
    setLoading(el.verifyBtn, false);
    state.busy = false;

    el.lockWrap.classList.add("is-unlocking");
    await wait(200);
    setLockState("open");
    await wait(520);
    el.lockWrap.classList.remove("is-unlocking");

    el.successMail.textContent = state.email;
    el.sessionId.textContent = randomSessionId();
    await goTo("SUCCESS");
    ripple(el.cardSuccess);
  });

  function showOtpError(msg) {
    el.otpError.textContent = msg;
    el.otpError.classList.add("is-shown");
  }

  function ripple(host) {
    if (reducedMotion.matches) return;
    const r = document.createElement("span");
    r.className = "ripple";
    host.appendChild(r);
    window.setTimeout(() => r.remove(), 1300);
  }

  /* ---------- 8. TEKRAR GÖNDERME ---------- */
  let resendInterval = null;

  function startResendCooldown() {
    state.resendLeft = DEMO.resendCooldown;
    el.resendBtn.disabled = true;
    el.resendBtn.style.opacity = ".45";
    el.resendBtn.style.cursor = "default";
    el.resendTimer.hidden = false;
  }

  function startResendTimer() {
    clearInterval(resendInterval);
    el.resendTimer.textContent = `(${state.resendLeft}s)`;
    resendInterval = setInterval(() => {
      state.resendLeft -= 1;
      el.resendTimer.textContent = `(${Math.max(state.resendLeft, 0)}s)`;
      if (state.resendLeft <= 0) {
        clearInterval(resendInterval);
        el.resendTimer.hidden = true;
        el.resendBtn.disabled = false;
        el.resendBtn.style.opacity = "";
        el.resendBtn.style.cursor = "";
      }
    }, 1000);
  }

  el.resendBtn.addEventListener("click", async () => {
    if (el.resendBtn.disabled) return;
    state.otpAttempts = 0;
    resetOtp();
    el.otpError.textContent = "Yeni kod gönderildi (demo: 482913).";
    el.otpError.style.color = "var(--ok)";
    el.otpError.classList.add("is-shown");
    startResendCooldown();
    startResendTimer();
    el.otpCells[0].focus({ preventScroll: true });
    window.setTimeout(() => {
      el.otpError.style.color = "";
      if (state.phase === "VERIFY") el.otpError.classList.remove("is-shown");
    }, 3200);
  });

  /* ---------- 9. GERİ / ÇIKIŞ ---------- */
  el.backBtn.addEventListener("click", async () => {
    clearInterval(resendInterval);
    state.otpAttempts = 0;
    resetOtp();
    setLockState("locked");
    await goTo("LOGIN");
  });

  el.logoutBtn.addEventListener("click", async () => {
    setLockState("locked");
    el.email.value = "";
    el.password.value = "";
    setFieldError("email", "");
    setFieldError("password", "");
    setNote("");
    await goTo("LOGIN");
  });

  /* ---------- 10. FARE PARALAKSI / KART EĞİMİ ---------- */
  let pointer = { x: 0.5, y: 0.5 };
  let rafId = null;

  function applyPointer() {
    rafId = null;
    if (reducedMotion.matches) return;
    const { x, y } = pointer;

    /* Kart eğimi */
    const rx = (0.5 - y) * 6;   // -3..3 deg
    const ry = (x - 0.5) * 7;   // -3.5..3.5 deg
    const activeCard = cards[state.phase];
    if (activeCard) {
      activeCard.style.setProperty("--rx", `${rx.toFixed(2)}deg`);
      activeCard.style.setProperty("--ry", `${ry.toFixed(2)}deg`);
      activeCard.style.setProperty("--mx", `${(x * 100).toFixed(1)}%`);
      activeCard.style.setProperty("--my", `${(y * 100).toFixed(1)}%`);
    }

    /* Kilit paralaksı */
    el.lock.style.setProperty("--lx", `${(rx * 1.4).toFixed(2)}deg`);
    el.lock.style.setProperty("--ly", `${(ry * 1.6).toFixed(2)}deg`);

    /* Arka plan şekilleri */
    el.shapes.forEach((s) => {
      const depth = Number(s.dataset.depth || 30);
      const tx = (x - 0.5) * depth * -1;
      const ty = (y - 0.5) * depth * -1;
      s.style.setProperty("--tx", `${tx.toFixed(1)}px`);
      s.style.setProperty("--ty", `${ty.toFixed(1)}px`);
    });

    /* Işık lekesi */
    el.glow.style.transform = `translate3d(${x * 100}vw, ${y * 100}vh, 0)`;
  }

  window.addEventListener("pointermove", (e) => {
    if (e.pointerType === "touch") return; // dokunmatikte paralaks yok
    pointer.x = e.clientX / window.innerWidth;
    pointer.y = e.clientY / window.innerHeight;
    if (rafId === null) rafId = requestAnimationFrame(applyPointer);
  }, { passive: true });

  /* Cihaz eğimi (mobil — izin varsa) */
  window.addEventListener("deviceorientation", (e) => {
    if (e.gamma === null || reducedMotion.matches) return;
    pointer.x = Math.min(1, Math.max(0, 0.5 + e.gamma / 90));
    pointer.y = Math.min(1, Math.max(0, 0.5 + (e.beta - 45) / 120));
    if (rafId === null) rafId = requestAnimationFrame(applyPointer);
  }, { passive: true });

  /* Sıfırla (fare çıkınca) */
  document.addEventListener("pointerleave", () => {
    pointer.x = 0.5; pointer.y = 0.5;
    if (rafId === null) rafId = requestAnimationFrame(applyPointer);
  });

  /* ---------- 11. KLAVYE / ERİŞİLEBİLİRLİK ---------- */
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && state.phase === "VERIFY") el.backBtn.click();
  });

  /* ---------- 12. BAŞLANGIÇ ---------- */
  function init() {
    setLockState("locked");
    el.cardVerify.hidden = true;
    el.cardVerify.setAttribute("aria-hidden", "true");
    el.cardSuccess.hidden = true;
    el.cardSuccess.setAttribute("aria-hidden", "true");

    /* Kayıtlı e-posta varsa hatırla (yalnızca demo alanı, parola asla) */
    try {
      const saved = localStorage.getItem("numex.softid.email");
      if (saved && EMAIL_RE.test(saved)) {
        el.email.value = saved;
        el.remember.checked = true;
        el.password.focus({ preventScroll: true });
      } else {
        el.email.focus({ preventScroll: true });
      }
    } catch (_) { /* localStorage kapalı olabilir */ }

    el.remember.addEventListener("change", () => {
      try {
        if (el.remember.checked && EMAIL_RE.test(el.email.value.trim())) {
          localStorage.setItem("numex.softid.email", el.email.value.trim().toLowerCase());
        } else {
          localStorage.removeItem("numex.softid.email");
        }
      } catch (_) { /* yoksay */ }
    });
  }

  init();
})();
