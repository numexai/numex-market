/* =========================================================
   PulseBoard — Görev modülü
   Görev ekleme/düzenleme modalı, liste satırı üretimi, silme + geri alma.
   Hem "Görevler" sayfası hem "Genel Bakış" tarafından kullanılır.
   ========================================================= */

import store from "./store.js";
import { modalAc, onayIste } from "./modal.js";
import bildir from "./toast.js";
import {
  kacis, bugunISO, teslimEtiketi, oncelikBilgi, ONCELIKLER, kisalt,
} from "./utils.js";

/* ---------- Ortak HTML parçaları ---------- */

export function oncelikChip(oncelik) {
  const bilgi = oncelikBilgi(oncelik);
  return `<span class="chip ${bilgi.chip}"><i class="nokta" aria-hidden="true"></i>${kacis(bilgi.ad)}</span>`;
}

export function kategoriChip(kategoriId) {
  const kat = store.kategoriBilgi(kategoriId);
  return `<span class="chip chip-notr"><i class="nokta" style="background:${kacis(kat.renk)}" aria-hidden="true"></i>${kacis(kat.ad)}</span>`;
}

export function teslimChip(iso, tamam) {
  if (!iso) return "";
  const { metin, durum } = teslimEtiketi(iso);
  if (tamam) return `<span class="chip chip-notr">${kacis(metin)}</span>`;
  const sinif = durum === "gecikti" ? "chip-acil" : durum === "bugun" ? "chip-orta" : "chip-notr";
  return `<span class="chip ${sinif}">${durum === "gecikti" ? "⚠ " : "📅 "}${kacis(metin)}</span>`;
}

/** Tek görev satırı (liste öğesi) */
export function gorevSatiri(gorev, secenek = {}) {
  const kat = store.kategoriBilgi(gorev.kategori);
  const aciklama = gorev.aciklama && secenek.aciklamaGoster !== false
    ? `<p class="og-e-aciklama">${kacis(kisalt(gorev.aciklama, 160))}</p>`
    : "";

  return `
    <li class="liste-ogesi${gorev.tamam ? " tamam" : ""}" data-gorev-id="${kacis(gorev.id)}">
      <button class="onay${gorev.tamam ? " secili" : ""}" type="button"
              data-eylem="tamamla" data-id="${kacis(gorev.id)}"
              aria-pressed="${gorev.tamam ? "true" : "false"}"
              aria-label="${gorev.tamam ? "Tamamlanmadı olarak işaretle" : "Tamamlandı olarak işaretle"}: ${kacis(gorev.ad)}">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>
      </button>
      <div class="og-e-govde">
        <span class="og-e-ad">${kacis(gorev.ad)}</span>
        ${aciklama}
        <div class="og-e-meta">
          ${teslimChip(gorev.teslim, gorev.tamam)}
          ${oncelikChip(gorev.oncelik)}
          <span class="chip chip-notr"><i class="nokta" style="background:${kacis(kat.renk)}" aria-hidden="true"></i>${kacis(kat.ad)}</span>
        </div>
      </div>
      ${secenek.eylemGoster === false ? "" : `
      <div class="og-e-eylem">
        <button class="ikon-btn kucuk" type="button" data-eylem="duzenle" data-id="${kacis(gorev.id)}"
                aria-label="Görevi düzenle: ${kacis(gorev.ad)}" title="Düzenle">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
        </button>
        <button class="ikon-btn kucuk tehlike" type="button" data-eylem="sil" data-id="${kacis(gorev.id)}"
                aria-label="Görevi sil: ${kacis(gorev.ad)}" title="Sil">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14"/></svg>
        </button>
      </div>`}
    </li>
  `;
}

/** Kompakt görev satırı (Genel Bakış için) */
export function kompaktGorevSatiri(gorev) {
  return `
    <li class="gorev-satiri${gorev.tamam ? " tamam" : ""}" data-gorev-id="${kacis(gorev.id)}">
      <button class="onay${gorev.tamam ? " secili" : ""}" type="button"
              data-eylem="tamamla" data-id="${kacis(gorev.id)}"
              aria-pressed="${gorev.tamam ? "true" : "false"}"
              aria-label="${gorev.tamam ? "Tamamlanmadı olarak işaretle" : "Tamamlandı olarak işaretle"}: ${kacis(gorev.ad)}">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>
      </button>
      <div class="gorev-govde">
        <span class="gorev-ad">${kacis(gorev.ad)}</span>
        <div class="gorev-meta">
          ${teslimChip(gorev.teslim, gorev.tamam)}
          ${oncelikChip(gorev.oncelik)}
          ${kategoriChip(gorev.kategori)}
        </div>
      </div>
      <div class="gorev-sag">
        <button class="ikon-btn kucuk" type="button" data-eylem="duzenle" data-id="${kacis(gorev.id)}"
                aria-label="Görevi düzenle" title="Düzenle">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
        </button>
      </div>
    </li>
  `;
}

/* ---------- Görev formu ---------- */

function gorevFormHtml(gorev) {
  const kategoriler = store.kategoriListesi();
  const seciliOnce = gorev?.oncelik || "orta";
  const seciliKat = gorev?.kategori || "genel";

  return `
    <div class="form-satir">
      <label class="etiket" for="gorevAd">Görev adı <span aria-hidden="true">*</span></label>
      <input class="girdi" id="gorevAd" type="text" maxlength="140" autocomplete="off"
             placeholder="Örn. Haftalık raporu hazırla" value="${kacis(gorev?.ad || "")}" required />
    </div>
    <div class="form-satir">
      <label class="etiket" for="gorevAciklama">Açıklama</label>
      <textarea class="metin-alani" id="gorevAciklama" maxlength="600"
                placeholder="İsteğe bağlı kısa not...">${kacis(gorev?.aciklama || "")}</textarea>
    </div>
    <div class="form-izgara">
      <div class="form-satir">
        <label class="etiket" for="gorevOncelik">Öncelik</label>
        <select class="secim" id="gorevOncelik">
          ${ONCELIKLER.map((o) => `<option value="${o.id}"${o.id === seciliOnce ? " selected" : ""}>${o.ad}</option>`).join("")}
        </select>
      </div>
      <div class="form-satir">
        <label class="etiket" for="gorevTeslim">Son tarih</label>
        <input class="girdi" id="gorevTeslim" type="date" value="${kacis(gorev?.teslim || "")}" />
      </div>
    </div>
    <div class="form-satir">
      <label class="etiket" for="gorevKategori">Kategori</label>
      <select class="secim" id="gorevKategori">
        ${kategoriler.map((k) => `<option value="${kacis(k.id)}"${k.id === seciliKat ? " selected" : ""}>${kacis(k.ad)}</option>`).join("")}
      </select>
    </div>
    <div class="form-satir">
      <div class="kategori-secim-listesi">
        <button class="btn btn-kucuk btn-sade" type="button" id="yeniKategoriBtn">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>
          Yeni kategori
        </button>
      </div>
    </div>
    <p class="form-hata" id="gorevFormHata" role="alert"></p>
  `;
}

function kategoriEklemeAlaniniBagla(modalEl, selectId) {
  const btn = modalEl.querySelector("#yeniKategoriBtn");
  if (!btn) return;
  btn.addEventListener("click", () => {
    modalAc({
      baslik: "Yeni kategori",
      altBaslik: "Görevlerini gruplamak için kısa bir ad gir.",
      genislik: "dar",
      govde: `
        <div class="form-satir">
          <label class="etiket" for="yeniKatAd">Kategori adı</label>
          <input class="girdi" id="yeniKatAd" type="text" maxlength="28" placeholder="Örn. Finans" />
        </div>
        <p class="form-hata" id="yeniKatHata" role="alert"></p>
      `,
      onayMetni: "Ekle",
      onOnay: (m) => {
        const deger = m.querySelector("#yeniKatAd").value.trim();
        const hata = m.querySelector("#yeniKatHata");
        if (!deger) {
          hata.textContent = "Kategori adı boş olamaz.";
          m.querySelector("#yeniKatAd").focus();
          return false;
        }
        const yeni = store.kategoriEkle(deger);
        const select = document.getElementById(selectId);
        if (select && yeni) {
          const opt = document.createElement("option");
          opt.value = yeni.id;
          opt.textContent = yeni.ad;
          select.appendChild(opt);
          select.value = yeni.id;
        }
        bildir.basari(`"${deger}" kategorisi eklendi.`);
        return true;
      },
    });
  });
}

/**
 * Görev ekleme / düzenleme modalını açar.
 * @param {string|null} gorevId - null ise yeni görev
 * @param {Function} [basariSonrasi] - kayıt sonrası çağrılır
 */
export function gorevFormAc(gorevId = null, basariSonrasi) {
  const mevcut = gorevId ? store.al().gorevler.find((g) => g.id === gorevId) : null;
  const duzenlemeModu = Boolean(mevcut);

  modalAc({
    baslik: duzenlemeModu ? "Görevi düzenle" : "Yeni görev",
    altBaslik: duzenlemeModu
      ? "Değişiklikler hemen kaydedilir."
      : "Öncelik ve son tarih belirleyerek planını netleştir.",
    genislik: "genis",
    govde: gorevFormHtml(mevcut),
    onayMetni: duzenlemeModu ? "Kaydet" : "Görevi ekle",
    onOnay: (modalEl) => {
      const ad = modalEl.querySelector("#gorevAd").value.trim();
      const aciklama = modalEl.querySelector("#gorevAciklama").value;
      const oncelik = modalEl.querySelector("#gorevOncelik").value;
      const teslim = modalEl.querySelector("#gorevTeslim").value;
      const kategori = modalEl.querySelector("#gorevKategori").value;
      const hataKutu = modalEl.querySelector("#gorevFormHata");

      if (!ad) {
        hataKutu.textContent = "Görev adı boş olamaz.";
        modalEl.querySelector("#gorevAd").focus();
        return false;
      }

      if (duzenlemeModu) {
        store.gorevDuzenle(gorevId, { ad, aciklama, oncelik, teslim, kategori });
        bildir.basari("Görev güncellendi.", { baslik: "Kaydedildi" });
      } else {
        store.gorevEkle({ ad, aciklama, oncelik, teslim, kategori });
        bildir.basari(`"${kisalt(ad, 34)}" eklendi.`, { baslik: "Görev oluşturuldu" });
      }
      basariSonrasi?.(duzenlemeModu ? "duzenleme" : "ekleme");
      return true;
    },
    acildi: (modalEl) => {
      kategoriEklemeAlaniniBagla(modalEl, "gorevKategori");
      const adInput = modalEl.querySelector("#gorevAd");
      adInput.addEventListener("keydown", (olay) => {
        if (olay.key === "Enter") {
          olay.preventDefault();
          modalEl.querySelector("[data-onay]")?.click();
        }
      });
      const form = modalEl.querySelector(".modal-govde");
      ["gorevAd", "gorevAciklama", "gorevOncelik", "gorevTeslim", "gorevKategori"].forEach((id) => {
        form.querySelector(`#${id}`)?.addEventListener("input", () => {
          modalEl.querySelector("#gorevFormHata").textContent = "";
        });
      });
    },
  });
}

/* ---------- Silme + geri alma ---------- */

export async function gorevSilOnayli(id) {
  const gorev = store.al().gorevler.find((g) => g.id === id);
  if (!gorev) return;

  const onay = await onayIste({
    baslik: "Görevi sil",
    mesaj: `"${kisalt(gorev.ad, 70)}" kalıcı olarak silinecek. Silme sonrası kısa süre "Geri Al" seçeneği sunulur.`,
    onayMetni: "Sil",
    tehlike: true,
  });
  if (!onay) return;

  const indeks = store.gorevIndeks(id);
  const silinen = store.gorevSil(id);
  bildir.geriAl("Görev silindi.", () => {
    store.gorevGeriKoy(silinen, indeks);
    bildir.basari("Görev geri getirildi.");
  }, { baslik: kisalt(gorev.ad, 40), tur: "hata" });
}

export async function gorevTumunuTemizleOnayli() {
  const { gorevler } = store.al();
  const tamamlanan = gorevler.filter((g) => g.tamam);
  if (!tamamlanan.length) {
    bildir.bilgi("Temizlenecek tamamlanmış görev yok.");
    return;
  }

  const onay = await onayIste({
    baslik: "Tamamlananları temizle",
    mesaj: `${tamamlanan.length} tamamlanmış görev silinecek. Bu işlem geri alınamaz.`,
    onayMetni: `${tamamlanan.length} görevi sil`,
    tehlike: true,
  });
  if (!onay) return;

  const yedek = [...tamamlanan];
  tamamlanan.forEach((g) => store.gorevSil(g.id));
  bildir.geriAl(`${tamamlanan.length} görev silindi.`, () => {
    yedek.forEach((g, i) => store.gorevGeriKoy(g, i));
    bildir.basari("Görevler geri getirildi.");
  });
}

/* ---------- Olay bağlama (delege) ---------- */

/**
 * Bir konteyner içindeki görev eylemlerini bağlar.
 * data-eylem="tamamla|duzenle|sil"
 */
export function gorevEylemleriniBagla(kok, yenidenCiz) {
  if (!kok) return;

  // DİKKAT: Burada "bağlandı" bayrağı TUTMUYORUZ.
  // Sebebi: bayrak tutulduğunda, aynı köke ikinci kez bağlanma denemesi
  // sessizce atlanıyor; kök yeniden çizildiğinde (ör. görev eklendikten sonra)
  // yeni düğüm bayrağı miras alıp olayları hiç bağlamıyordu — görev
  // düzenle/sil/tamamla tıklamalarının "bazen hiç çalışmaması"nın kök nedeni.
  // Kök düğüm her çizimde tazelendiği için mükerrer bağlanma riski yok.
  kok.addEventListener("click", (olay) => {
    const hedef = olay.target.closest("[data-eylem]");
    if (!hedef || !kok.contains(hedef)) return;
    const eylem = hedef.dataset.eylem;
    const id = hedef.dataset.id;
    if (!id) return;

    if (eylem === "tamamla") {
      const gorev = store.al().gorevler.find((g) => g.id === id);
      const sonuc = store.gorevDegistir(id);
      if (sonuc?.tamam) {
        bildir.basari(`"${kisalt(sonuc.ad, 34)}" tamamlandı.`, { baslik: "Helal olsun 🎉" });
      } else if (gorev) {
        bildir.bilgi(`"${kisalt(gorev.ad, 34)}" tekrar açıldı.`);
      }
      yenidenCiz?.();
    } else if (eylem === "duzenle") {
      gorevFormAc(id, () => yenidenCiz?.());
    } else if (eylem === "sil") {
      gorevSilOnayli(id).then(() => yenidenCiz?.());
    }
  });
}

export default {
  gorevFormAc, gorevSatiri, kompaktGorevSatiri, gorevEylemleriniBagla,
  gorevSilOnayli, gorevTumunuTemizleOnayli, oncelikChip, kategoriChip, teslimChip,
};
