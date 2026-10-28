/* =========================================================
   PulseBoard — Toast bildirimleri
   Küçük, otomatik kapanan bildirimler + isteğe bağlı "Geri Al" aksiyonu.
   ========================================================= */

import { el, kacis } from "./utils.js";

const IKONLAR = {
  basari: '<path d="M20 6 9 17l-5-5"/>',
  hata: '<path d="M12 8v5M12 16.5v.5"/><circle cx="12" cy="12" r="9"/>',
  bilgi: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8v.5"/>',
  geri: '<path d="M9 14 4 9l5-5"/><path d="M4 9h11a5 5 0 0 1 0 10h-3"/>',
  varsayilan: '<path d="M12 5v14M5 12h14"/>',
};

let kok = null;

function kokAl() {
  if (!kok) kok = el("#toastKok");
  return kok;
}

/**
 * Toast gösterir.
 * @param {string} mesaj - Ana metin
 * @param {object} [secenek] - { tur, baslik, aksiyon: { metin, fonksiyon }, sure }
 */
export function toast(mesaj, secenek = {}) {
  const kapsayici = kokAl();
  if (!kapsayici) return null;

  const tur = secenek.tur || "varsayilan";
  const sure = secenek.sure ?? (secenek.aksiyon ? 6000 : 3200);

  const oge = document.createElement("div");
  oge.className = `toast toast-${tur}`;
  oge.setAttribute("role", tur === "hata" ? "alert" : "status");

  const ikon = IKONLAR[tur] || IKONLAR.varsayilan;
  oge.innerHTML = `
    <span class="toast-ikon" aria-hidden="true"><svg viewBox="0 0 24 24">${ikon}</svg></span>
    <div class="toast-govde">
      ${secenek.baslik ? `<strong>${kacis(secenek.baslik)}</strong>` : ""}
      <span>${kacis(mesaj)}</span>
    </div>
    ${secenek.aksiyon ? `<button class="toast-islem" type="button">${kacis(secenek.aksiyon.metin || "Geri Al")}</button>` : ""}
  `;

  kapsayici.appendChild(oge);

  let zaman = null;
  const kapat = () => {
    if (!oge.isConnected) return;
    clearTimeout(zaman);
    oge.classList.add("cikiyor");
    setTimeout(() => oge.remove(), 200);
  };

  if (secenek.aksiyon) {
    const btn = oge.querySelector(".toast-islem");
    btn?.addEventListener("click", () => {
      try {
        secenek.aksiyon.fonksiyon?.();
      } catch (hata) {
        console.error("[PulseBoard] Toast aksiyonu hata verdi:", hata);
      }
      kapat();
    });
  }

  oge.addEventListener("mouseenter", () => clearTimeout(zaman));
  oge.addEventListener("mouseleave", () => {
    zaman = setTimeout(kapat, 1400);
  });

  zaman = setTimeout(kapat, sure);
  return kapat;
}

export const bildir = {
  basari: (mesaj, secenek = {}) => toast(mesaj, { ...secenek, tur: "basari" }),
  hata: (mesaj, secenek = {}) => toast(mesaj, { ...secenek, tur: "hata", sure: secenek.sure ?? 4200 }),
  bilgi: (mesaj, secenek = {}) => toast(mesaj, { ...secenek, tur: "bilgi" }),
  geriAl: (mesaj, fonksiyon, secenek = {}) =>
    toast(mesaj, { ...secenek, tur: "geri", aksiyon: { metin: "Geri Al", fonksiyon } }),
};

export default bildir;
