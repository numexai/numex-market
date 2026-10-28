/* =========================================================
   PulseBoard — Modal & onay diyalogları
   Odak tuzağı, ESC ile kapatma, erişilebilir ARIA rolleri.
   ========================================================= */

import { el, kacis } from "./utils.js";

let kok = null;
let kapatmaFn = null;
let sonOdak = null;

function kokAl() {
  if (!kok) kok = el("#modalKok");
  return kok;
}

const ODAKLANABILIR = 'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

function odakTuzagi(olay) {
  if (olay.key !== "Tab" || !kok) return;
  const odaklar = Array.from(kok.querySelectorAll(ODAKLANABILIR)).filter(
    (o) => o.offsetParent !== null || o === document.activeElement,
  );
  if (!odaklar.length) return;
  const ilk = odaklar[0];
  const son = odaklar[odaklar.length - 1];
  if (olay.shiftKey && document.activeElement === ilk) {
    olay.preventDefault();
    son.focus();
  } else if (!olay.shiftKey && document.activeElement === son) {
    olay.preventDefault();
    ilk.focus();
  }
}

function tusHandler(olay) {
  if (olay.key === "Escape") {
    olay.preventDefault();
    modalKapat();
    return;
  }
  odakTuzagi(olay);
}

/**
 * Modal açar.
 * @param {object} secenek
 * @param {string} secenek.baslik
 * @param {string} [secenek.altBaslik]
 * @param {string} secenek.govde - HTML içerik
 * @param {string} [secenek.genislik] - '' | 'genis' | 'dar'
 * @param {string} [secenek.onayMetni]
 * @param {string} [secenek.onaySinifi]
 * @param {Function} [secenek.onOnay] - (modalElement) => boolean|void; false dönerse kapanmaz
 * @param {Function} [secenek.acildi] - (modalElement) => void
 * @param {boolean} [secenek.kapatilabilir] - dış tıklama/ESC (varsayılan true)
 */
export function modalAc(secenek) {
  const kapsayici = kokAl();
  if (!kapsayici) return null;

  modalKapat(true);
  sonOdak = document.activeElement;
  kapsayici.hidden = false;
  kapsayici.innerHTML = "";

  const genislikSinif = secenek.genislik ? ` modal-${secenek.genislik}` : "";
  const kapatilabilir = secenek.kapatilabilir !== false;

  kapsayici.innerHTML = `
    <div class="modal-perde" data-perde></div>
    <div class="modal${genislikSinif}" role="dialog" aria-modal="true" aria-labelledby="modalBaslik">
      <div class="modal-ust">
        <div>
          <h2 id="modalBaslik">${kacis(secenek.baslik || "")}</h2>
          ${secenek.altBaslik ? `<p>${kacis(secenek.altBaslik)}</p>` : ""}
        </div>
        ${kapatilabilir ? `<button class="ikon-btn kucuk" type="button" data-kapat aria-label="Kapat">
          <svg viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12"/></svg>
        </button>` : ""}
      </div>
      <div class="modal-govde" data-govde>${secenek.govde || ""}</div>
      <div class="modal-eylemler${secenek.onayMetni ? "" : " gizli"}">
        ${kapatilabilir ? `<button class="btn btn-sade" type="button" data-vazgec>Vazgeç</button>` : ""}
        ${secenek.onayMetni ? `<button class="btn ${secenek.onaySinifi || "btn-ana"}" type="button" data-onay>${kacis(secenek.onayMetni)}</button>` : ""}
      </div>
      ${secenek.altEylem ? `<div class="modal-eylemler iki-uclu gizli-sonra">${secenek.altEylem}</div>` : ""}
    </div>
  `;

  const modalEl = kapsayici.querySelector(".modal");

  // Kapatma yolları
  kapsayici.querySelector("[data-kapat]")?.addEventListener("click", () => modalKapat());
  kapsayici.querySelector("[data-vazgec]")?.addEventListener("click", () => modalKapat());
  const perde = kapsayici.querySelector("[data-perde]");
  if (kapatilabilir && perde) perde.addEventListener("click", () => modalKapat());

  // Onay
  const onay = kapsayici.querySelector("[data-onay]");
  if (onay && secenek.onOnay) {
    onay.addEventListener("click", () => {
      const sonuc = secenek.onOnay(modalEl);
      if (sonuc !== false) modalKapat();
    });
  }

  document.addEventListener("keydown", tusHandler);
  document.body.style.overflow = "hidden";
  kapatmaFn = () => modalKapat();

  // İlk odaklanabilir alana odaklan
  requestAnimationFrame(() => {
    const hedef = modalEl.querySelector("input, textarea, select") ||
      modalEl.querySelector("[autofocus]") ||
      modalEl.querySelector(ODAKLANABILIR);
    hedef?.focus();
    if (hedef && hedef.tagName === "INPUT" && hedef.type !== "date") hedef.select?.();
  });

  secenek.acildi?.(modalEl);
  return modalEl;
}

export function modalKapat(sessiz = false) {
  const kapsayici = kokAl();
  if (!kapsayici || kapsayici.hidden) return;
  kapsayici.hidden = true;
  kapsayici.innerHTML = "";
  document.removeEventListener("keydown", tusHandler);
  document.body.style.overflow = "";
  kapatmaFn = null;
  if (!sessiz && sonOdak && document.contains(sonOdak)) {
    try {
      sonOdak.focus();
    } catch {
      /* yoksay */
    }
  }
}

/**
 * Onay diyaloğu (özellikle yıkıcı işlemler).
 * @returns {Promise<boolean>}
 */
export function onayIste(secenek = {}) {
  return new Promise((cozumle) => {
    let karar = false;
    modalAc({
      baslik: secenek.baslik || "Emin misin?",
      altBaslik: secenek.altBaslik,
      genislik: "dar",
      govde: `
        <p style="color:var(--metin-2);font-size:.92rem;line-height:1.6">
          ${secenek.mesaj || "Bu işlem geri alınabilir, ancak devam etmek istediğine emin ol."}
        </p>
        ${secenek.ekstraHtml || ""}
      `,
      onayMetni: secenek.onayMetni || "Onayla",
      onaySinifi: secenek.tehlike ? "btn btn-tehlike" : "btn btn-ana",
      kapatilabilir: true,
      onOnay: () => {
        karar = true;
      },
      acildi: (modalEl) => {
        modalEl.dataset.onayIstek = "1";
      },
    });

    const kapsayici = kokAl();
    const gozlemci = new MutationObserver(() => {
      if (kapsayici.hidden) {
        gozlemci.disconnect();
        cozumle(karar);
      }
    });
    gozlemci.observe(kapsayici, { attributes: true, attributeFilter: ["hidden"] });
  });
}

export default { modalAc, modalKapat, onayIste };
