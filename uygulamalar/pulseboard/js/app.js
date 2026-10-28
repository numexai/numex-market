/* =========================================================
   PulseBoard — Uygulama çekirdeği
   Hash router, selamlama, günlük ilerleme göstergesi,
   tema yönetimi, mobil çekmece ve klavye kısayolları.
   ========================================================= */

import store from "./store.js";
import bildir from "./toast.js";
import { modalKapat } from "./modal.js";
import { el, uzunTarih, bugunISO, normalize, geciktir } from "./utils.js";

import dashboard from "./views/dashboard.js";
import tasksView from "./views/tasks.js";
import habitsView from "./views/habits.js";
import statsView from "./views/stats.js";
import settingsView from "./views/settings.js";
import { gorevFormAc } from "./tasks.js";

/* ---------- Rotalar ---------- */

const ROTALAR = {
  "genel-bakis": { baslik: "Genel Bakış", gorunum: dashboard },
  gorevler: { baslik: "Görevler", gorunum: tasksView },
  aliskanliklar: { baslik: "Alışkanlıklar", gorunum: habitsView },
  istatistikler: { baslik: "İstatistikler", gorunum: statsView },
  ayarlar: { baslik: "Ayarlar", gorunum: settingsView },
};

const VARSAYILAN_ROTA = "genel-bakis";

let aktifRota = null;
let yenidenCizZamanlayici = null;

function aktifRotaAl() {
  const ham = (location.hash || "").replace(/^#\/?/, "").split("?")[0];
  return ROTALAR[ham] ? ham : VARSAYILAN_ROTA;
}

/* ---------- Router ---------- */

let henuzBaglanmadi = true;

export function router(force = false) {
  const rota = aktifRotaAl();
  let gorunumKok = el("#gorunum");
  if (!gorunumKok) return;

  // Aynı rotada sadece yeniden çizim gerekiyorsa
  if (rota === aktifRota && !force) {
    gorunumKok = ciz(rota, gorunumKok) || gorunumKok;
    return;
  }

  aktifRota = rota;
  gorunumKok = ciz(rota, gorunumKok) || gorunumKok;

  const hedef = ROTULAR_BASLIK(rota);
  document.title = `${hedef} — PulseBoard`;

  // Menü vurgusu
  document.querySelectorAll(".menu-ogesi").forEach((a) => {
    const aktif = a.dataset.rota === rota;
    a.classList.toggle("aktif", aktif);
    if (aktif) a.setAttribute("aria-current", "page");
    else a.removeAttribute("aria-current");
  });

  // Mobil çekmeceyi kapat
  cekmeceKapat();

  // Erişilebilirlik: içerik değiştiğinde duyur
  gorunumKok.classList.add("gorunum-girisi");
  setTimeout(() => gorunumKok.classList.remove("gorunum-girisi"), 400);
}

function ROTULAR_BASLIK(rota) {
  return ROTALAR[rota]?.baslik || "PulseBoard";
}

function ciz(rota, gorunumKok) {
  const tanim = ROTALAR[rota] || ROTALAR[VARSAYILAN_ROTA];
  const yeniIcerik = tanim.gorunum.render();

  // Kökü yeni içerikle değiştirirken ESKİ düğümü klonlayıp kullanıyoruz:
  // `#gorunum` kalıcı bir düğüm olduğu ve her çizimde `bagla()` ona dinleyici
  // eklediği için, klonlamazsak dinleyiciler birikir ve tek tık N kez tetiklenir
  // (görev düzenleme/silme akışının bozulmasının asıl sebebi buydu).
  const temizKok = gorunumKok.cloneNode(false);
  temizKok.innerHTML = yeniIcerik;

  // `cloneNode(false)` attribute'ları KOPYALAR — eski bağlama bayraklarını
  // mutlaka temizle; yoksa yeni düğüm "zaten bağlıyım" sanıp olayları atlar.
  delete temizKok.dataset.gorevBagli;
  delete temizKok.dataset.gorevViewBagli;
  temizKok.dataset.bagliRota = rota;

  gorunumKok.replaceWith(temizKok);

  tanim.gorunum.bagla(temizKok, () => {
    yenidenCizPlanla();
  });

  ustBilgileriGuncelle();
  return temizKok;
}

/** Aynı rotayı yeniden çizer (filtre/veri değişikliklerinde) */
export function yenidenCiz() {
  const gorunumKok = el("#gorunum");
  if (!gorunumKok || !aktifRota) return;
  ciz(aktifRota, gorunumKok);
}

function yenidenCizPlanla() {
  clearTimeout(yenidenCizZamanlayici);
  yenidenCizZamanlayici = setTimeout(() => yenidenCiz(), 16);
}

/* ---------- Üst bilgiler ---------- */

export function selamlamaUret(tarih = new Date()) {
  const saat = tarih.getHours();
  if (saat >= 5 && saat < 12) return "Günaydın";
  if (saat >= 12 && saat < 18) return "İyi günler";
  if (saat >= 18 && saat < 23) return "İyi akşamlar";
  return "İyi geceler";
}

export function tarihBasligiGuncelle() {
  const tarihMetin = el("#tarihMetin");
  if (tarihMetin) tarihMetin.textContent = uzunTarih();
}

export function gunlukIlerlemeGuncelle() {
  const ilerleme = store.gunlukIlerleme();
  const daireselCevre = 2 * Math.PI * 18; // halka r=18

  const halka = el("#halkaDolgu");
  if (halka) {
    halka.style.strokeDasharray = daireselCevre.toFixed(2);
    halka.style.strokeDashoffset = (daireselCevre * (1 - ilerleme.oran / 100)).toFixed(2);
    halka.style.stroke = ilerleme.oran >= 100 ? "var(--yesil)" : "var(--teal)";
  }

  const ustYuzde = el("#ustYuzde");
  if (ustYuzde) ustYuzde.textContent = `%${ilerleme.oran}`;

  const sidebarYuzde = el("#sidebarYuzde");
  if (sidebarYuzde) sidebarYuzde.textContent = `%${ilerleme.oran}`;

  const sidebarBar = el("#sidebarBar");
  if (sidebarBar) sidebarBar.style.width = `${ilerleme.oran}%`;

  const kapsayici = el("#sidebarBarKapsayici");
  if (kapsayici) kapsayici.setAttribute("aria-valuenow", String(ilerleme.oran));

  const durumMetin = el("#bugunlukDurum");
  if (durumMetin) {
    const gs = store.gorevIstatistigi();
    if (ilerleme.toplam === 0 && gs.acik === 0) {
      durumMetin.textContent = "Bugün için planın hazır — bir görev ekle";
    } else if (ilerleme.toplam === 0) {
      durumMetin.textContent = "Bugüne tarihli görev yok";
    } else if (ilerleme.oran === 100) {
      durumMetin.textContent = "Bugünün tüm görevleri tamam 🎉";
    } else {
      durumMetin.textContent = `${ilerleme.tamamlanan}/${ilerleme.toplam} görev tamamlandı · ${gs.gecikmis > 0 ? `${gs.gecikmis} gecikmiş` : "gecikme yok"}`;
    }
  }

  // Sidebar görev rozeti
  const rozet = el("#rozetGorevler");
  if (rozet) {
    const adet = store.gorevIstatistigi().acik;
    rozet.textContent = String(adet);
    rozet.hidden = adet === 0;
  }
}

export function ustBilgileriGuncelle() {
  const selamlama = el("#selamlama");
  if (selamlama) selamlama.textContent = selamlamaUret();
  tarihBasligiGuncelle();
  gunlukIlerlemeGuncelle();
}

/* ---------- Tema ---------- */

export function temaUygula() {
  const tema = store.temaAl();
  document.documentElement.setAttribute("data-tema", tema);
  const metin = el("#temaToggleMetin");
  if (metin) metin.textContent = tema === "acik" ? "Koyu temaya geç" : "Açık temaya geç";
  return tema;
}

export function temaToggle() {
  const yeni = store.temaAl() === "acik" ? "koyu" : "acik";
  store.temaAyarla(yeni);
  temaUygula();
  bildir.bilgi(yeni === "acik" ? "Açık tema açıldı." : "Koyu tema açıldı.", { sure: 1800 });
  if (aktifRota === "ayarlar") yenidenCiz();
}

/* ---------- Mobil çekmece ---------- */

export function mobilDrawerToggle(acikMi) {
  const sidebar = el("#sidebar");
  const perde = el("#perde");
  const btn = el("#drawerBtn");
  if (!sidebar || !perde) return;

  const acilacak = typeof acikMi === "boolean" ? acikMi : !sidebar.classList.contains("acik");

  sidebar.classList.toggle("acik", acilacak);
  btn?.setAttribute("aria-expanded", String(acilacak));

  if (acilacak) {
    perde.hidden = false;
    requestAnimationFrame(() => perde.classList.add("acik"));
    // Odağı çekmeceye taşı
    setTimeout(() => {
      sidebar.querySelector(".menu-ogesi.aktif, .menu-ogesi")?.focus();
    }, 180);
  } else {
    perde.classList.remove("acik");
    setTimeout(() => {
      perde.hidden = true;
    }, 200);
  }

  document.body.style.overflow = acilacak ? "hidden" : "";
}

function cekmeceKapat() {
  const sidebar = el("#sidebar");
  if (sidebar?.classList.contains("acik")) mobilDrawerToggle(false);
}

/* ---------- Klavye kısayolları ---------- */

function yazmaAlaniMi(hedef) {
  if (!hedef) return false;
  const etiket = hedef.tagName;
  return (
    etiket === "INPUT" ||
    etiket === "TEXTAREA" ||
    etiket === "SELECT" ||
    hedef.isContentEditable
  );
}

export function globalKisayolHandler(olay) {
  const modalAcik = !el("#modalKok")?.hidden;

  if (olay.key === "Escape") {
    if (modalAcik) {
      modalKapat();
      return;
    }
    cekmeceKapat();
    return;
  }

  if (modalAcik || yazmaAlaniMi(olay.target)) return;
  if (olay.ctrlKey || olay.metaKey || olay.altKey) return;

  const tus = olay.key.toLocaleLowerCase("tr");

  if (tus === "n") {
    olay.preventDefault();
    gorevFormAc(null, yenidenCiz);
  } else if (tus === "g") {
    olay.preventDefault();
    location.hash = "#/gorevler";
  } else if (tus === "/") {
    olay.preventDefault();
    if (aktifRota !== "gorevler") location.hash = "#/gorevler";
    setTimeout(() => el("#gorevArama")?.focus(), 120);
  } else if (tus === "1") {
    location.hash = "#/genel-bakis";
  } else if (tus === "2") {
    location.hash = "#/aliskanliklar";
  } else if (tus === "3") {
    location.hash = "#/istatistikler";
  } else if (tus === "4") {
    location.hash = "#/ayarlar";
  }
}

/* ---------- Hızlı görev ekleme ---------- */

function hizliGorevEklemeKur() {
  el("#hizliEkleBtn")?.addEventListener("click", () => {
    gorevFormAc(null, yenidenCiz);
  });
}

/* ---------- Gün değişimi ---------- */

let sonGun = bugunISO();

function gunDegisimKontrolu() {
  const simdi = bugunISO();
  if (simdi !== sonGun) {
    sonGun = simdi;
    store.gunDegisimKontrolu();
    ustBilgileriGuncelle();
    yenidenCiz();
    bildir.bilgi("Yeni gün başladı. Selam, yeni plan!", { baslik: "Gün güncellendi" });
  } else {
    // Selamlama saate göre değişebilir
    const selamlama = el("#selamlama");
    const beklenen = selamlamaUret();
    if (selamlama && selamlama.textContent !== beklenen) selamlama.textContent = beklenen;
  }
}

/* ---------- Init ---------- */

export function init() {
  store.baslat();
  temaUygula();
  ustBilgileriGuncelle();

  // Router
  window.addEventListener("hashchange", () => router());
  if (!location.hash) location.hash = `#/${VARSAYILAN_ROTA}`;
  router(true);

  // Sidebar tema düğmesi + mobil tema düğmesi
  el("#temaToggle")?.addEventListener("click", temaToggle);
  el("#mobilTemaBtn")?.addEventListener("click", temaToggle);

  // Mobil çekmece
  el("#drawerBtn")?.addEventListener("click", () => mobilDrawerToggle());
  el("#drawerKapat")?.addEventListener("click", () => mobilDrawerToggle(false));
  el("#perde")?.addEventListener("click", () => mobilDrawerToggle(false));

  // Hızlı görev ekleme
  hizliGorevEklemeKur();

  // Klavye
  document.addEventListener("keydown", globalKisayolHandler);

  // Store değişikliklerinde üst bilgileri tazele
  store.aboneOl(() => {
    gunlukIlerlemeGuncelle();
  });

  // Dış olaylar
  document.addEventListener("pb:yeniden-ciz", () => {
    temaUygula();
    yenidenCiz();
  });

  // Görünümlerin kendi içinden istediği yenileme isteği (görev ekle/sil/düzenle,
  // filtre değişimi vb.). "pb:yeniden-ciz" ile aynı işi yapar; ayrı tutuluyor
  // çünkü görünümler tema/sidebar işine karışmaz.
  document.addEventListener("pb:yenile", () => {
    yenidenCizPlanla();
  });

  // Gün değişimi denetimi
  setInterval(gunDegisimKontrolu, 30000);
  window.addEventListener("focus", gunDegisimKontrolu);

  // Sistem teması değişimi (yalnızca kullanıcı sistem tercihini seçmişse uygulanır)
  window.matchMedia?.("(prefers-color-scheme: dark)")?.addEventListener?.("change", () => {
    temaUygula();
  });

  // İlk yükleme bildirimi (yalnızca ilk kez)
  if (store.bosMu() && !sessionStorage.getItem("pb-hosgeldin")) {
    sessionStorage.setItem("pb-hosgeldin", "1");
    setTimeout(() => {
      bildir.bilgi("Görev veya alışkanlık ekleyerek başla. Kısayollar için Ayarlar'a bakabilirsin.", {
        baslik: "PulseBoard'a hoş geldin",
        sure: 5000,
      });
    }, 700);
  }

  window.addEventListener("resize", geciktir(() => {
    if (window.innerWidth > 900) cekmeceKapat();
  }, 200));

  console.info("%cPulseBoard%c v1.0.0 — hazır.", "font-weight:bold;color:#2dd4bf", "color:#8899aa");
}

/* Otomatik başlat */
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init, { once: true });
} else {
  init();
}

export default { init, router, yenidenCiz };
