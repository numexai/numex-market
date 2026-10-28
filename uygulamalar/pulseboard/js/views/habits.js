/* =========================================================
   PulseBoard — Alışkanlıklar sayfası
   Günlük işaretleme, ardışık seri, haftalık şerit görünümü.
   ========================================================= */

import store from "../store.js";
import { modalAc, onayIste } from "../modal.js";
import bildir from "../toast.js";
import {
  kacis, bugunISO, buHafta, gunKisa, gunBasHarf, ALISKANLIK_EMOJILERI,
  ALISKANLIK_RENKLERI, kisaTarih,
} from "../utils.js";

/* ---------- Seri etiketi ---------- */

export function seriEtiketi(seri) {
  if (!seri || seri <= 0) {
    return `<span class="seri-kutu sifir" title="Bugün işaretle, seriyi başlat">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3c1 3-2 4-2 7a2 2 0 1 0 4 0c0-1-.5-2-1-2.5 3 1.5 4 4 4 6.5a5 5 0 0 1-10 0c0-4 3-6 5-11Z"/></svg>
      0 gün</span>`;
  }
  const metin = seri === 1 ? "1 gün" : `${seri} gün`;
  return `<span class="seri-kutu" title="Ardışık ${seri} gün">
    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3c1 3-2 4-2 7a2 2 0 1 0 4 0c0-1-.5-2-1-2.5 3 1.5 4 4 4 6.5a5 5 0 0 1-10 0c0-4 3-6 5-11Z"/></svg>
    ${metin}</span>`;
}

/* ---------- Form modalı ---------- */

function formHtml(aliskanlik) {
  const seciliEmoji = aliskanlik?.emoji || "🎯";
  const seciliRenk = aliskanlik?.renk || "#2dd4bf";
  const hedef = aliskanlik?.hedefHafta || 7;

  return `
    <div class="form-satir">
      <label class="etiket" for="aliskanlikAd">Alışkanlık adı <span aria-hidden="true">*</span></label>
      <input class="girdi" id="aliskanlikAd" type="text" maxlength="80" autocomplete="off"
             placeholder="Örn. Günde 20 sayfa oku" value="${kacis(aliskanlik?.ad || "")}" />
    </div>

    <div class="form-satir">
      <span class="etiket" id="emojiEtiket">Simge</span>
      <div class="emoji-izgara" role="radiogroup" aria-labelledby="emojiEtiket" id="emojiIzgara">
        ${ALISKANLIK_EMOJILERI.map(
          (e) => `<button class="emoji-secim${e === seciliEmoji ? " secili" : ""}" type="button"
                    role="radio" aria-checked="${e === seciliEmoji}" data-emoji="${e}"
                    aria-label="Simge ${e}">${e}</button>`,
        ).join("")}
      </div>
      <input type="hidden" id="aliskanlikEmoji" value="${kacis(seciliEmoji)}" />
    </div>

    <div class="form-satir">
      <span class="etiket" id="renkEtiket">Renk</span>
      <div class="renk-nokta-secim" role="radiogroup" aria-labelledby="renkEtiket" id="renkSecim">
        ${ALISKANLIK_RENKLERI.map(
          (r) => `<button class="renk-secim${r === seciliRenk ? " secili" : ""}" type="button"
                    style="background:${r}" role="radio" aria-checked="${r === seciliRenk}"
                    data-renk="${r}" aria-label="Renk ${r}"></button>`,
        ).join("")}
      </div>
      <input type="hidden" id="aliskanlikRenk" value="${kacis(seciliRenk)}" />
    </div>

    <div class="form-satir">
      <label class="etiket" for="aliskanlikHedef">Haftalık hedef (gün)</label>
      <select class="secim" id="aliskanlikHedef">
        ${[1, 2, 3, 4, 5, 6, 7]
          .map((n) => `<option value="${n}"${n === hedef ? " selected" : ""}>${n} gün / hafta</option>`)
          .join("")}
      </select>
    </div>

    <p class="form-hata" id="aliskanlikFormHata" role="alert"></p>
  `;
}

function formOlaylariniBagla(modalEl) {
  const emojiIzgara = modalEl.querySelector("#emojiIzgara");
  const renkAlan = modalEl.querySelector("#renkSecim");
  const emojiInput = modalEl.querySelector("#aliskanlikEmoji");
  const renkInput = modalEl.querySelector("#aliskanlikRenk");

  emojiIzgara?.addEventListener("click", (olay) => {
    const btn = olay.target.closest("[data-emoji]");
    if (!btn) return;
    emojiIzgara.querySelectorAll(".emoji-secim").forEach((b) => {
      b.classList.remove("secili");
      b.setAttribute("aria-checked", "false");
    });
    btn.classList.add("secili");
    btn.setAttribute("aria-checked", "true");
    emojiInput.value = btn.dataset.emoji;
  });

  renkAlan?.addEventListener("click", (olay) => {
    const btn = olay.target.closest("[data-renk]");
    if (!btn) return;
    renkAlan.querySelectorAll(".renk-secim").forEach((b) => {
      b.classList.remove("secili");
      b.setAttribute("aria-checked", "false");
    });
    btn.classList.add("secili");
    btn.setAttribute("aria-checked", "true");
    renkInput.value = btn.dataset.renk;
  });

  const adInput = modalEl.querySelector("#aliskanlikAd");
  adInput?.addEventListener("keydown", (olay) => {
    if (olay.key === "Enter") {
      olay.preventDefault();
      modalEl.querySelector("[data-onay]")?.click();
    }
  });
  adInput?.addEventListener("input", () => {
    modalEl.querySelector("#aliskanlikFormHata").textContent = "";
  });
}

export function aliskanlikFormAc(aliskanlikId = null, basariSonrasi) {
  const mevcut = aliskanlikId
    ? store.al().aliskanliklar.find((a) => a.id === aliskanlikId)
    : null;
  const duzenlemeModu = Boolean(mevcut);

  modalAc({
    baslik: duzenlemeModu ? "Alışkanlığı düzenle" : "Yeni alışkanlık",
    altBaslik: duzenlemeModu
      ? "Simge, renk ve hedefi güncelleyebilirsin."
      : "Küçük ve sürdürülebilir alışkanlıklarla başla.",
    genislik: "genis",
    govde: formHtml(mevcut),
    onayMetni: duzenlemeModu ? "Kaydet" : "Alışkanlık ekle",
    onOnay: (modalEl) => {
      const ad = modalEl.querySelector("#aliskanlikAd").value.trim();
      const emoji = modalEl.querySelector("#aliskanlikEmoji").value;
      const renk = modalEl.querySelector("#aliskanlikRenk").value;
      const hedefHafta = Number(modalEl.querySelector("#aliskanlikHedef").value);
      const hata = modalEl.querySelector("#aliskanlikFormHata");

      if (!ad) {
        hata.textContent = "Alışkanlık adı boş olamaz.";
        modalEl.querySelector("#aliskanlikAd").focus();
        return false;
      }
      if (store.al().aliskanliklar.some((a) => a.id !== aliskanlikId && a.ad.toLowerCase() === ad.toLowerCase())) {
        hata.textContent = "Bu adda bir alışkanlık zaten var.";
        return false;
      }

      if (duzenlemeModu) {
        store.aliskanlikDuzenle(aliskanlikId, { ad, emoji, renk, hedefHafta });
        bildir.basari("Alışkanlık güncellendi.");
      } else {
        store.aliskanlikEkle({ ad, emoji, renk, hedefHafta });
        bildir.basari(`"${ad}" takibe alındı.`, { baslik: "Yeni alışkanlık" });
      }
      basariSonrasi?.();
      return true;
    },
    acildi: formOlaylariniBagla,
  });
}

/* ---------- Kart ---------- */

function haftaSeridi(aliskanlik) {
  const gunler = buHafta();
  const bugun = bugunISO();
  const kume = new Set(aliskanlik.yapilanGunler);

  return `
    <div class="hafta-seridi" role="list" aria-label="Bu haftanın kaydı">
      ${gunler
        .map((iso) => {
          const dolu = kume.has(iso);
          const gelecek = iso > bugun;
          return `
            <div class="hafta-gunu" role="listitem">
              <span class="gun-adi">${gunBasHarf(iso)}</span>
              <span class="hafta-nokta${dolu ? " dolu" : ""}${iso === bugun ? " bugun" : ""}${gelecek ? " gelecek" : ""}"
                    title="${kacis(kisaTarih(iso))}${dolu ? " — yapıldı" : ""}${gelecek ? " — henüz gelmedi" : ""}">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>
              </span>
            </div>`;
        })
        .join("")}
    </div>
  `;
}

function aliskanlikKart(aliskanlik) {
  const bugun = bugunISO();
  const bugunYapildi = aliskanlik.yapilanGunler.includes(bugun);
  const seri = store.seri(aliskanlik.id);
  const enUzun = store.enUzunSeri(aliskanlik.id);
  const hafta = buHafta();
  const haftaSayi = store.haftaTamam(aliskanlik.id, hafta);
  const hedefOran = Math.min(100, Math.round((haftaSayi / (aliskanlik.hedefHafta || 7)) * 100));

  return `
    <article class="kart aliskanlik-kart" data-aliskanlik-id="${kacis(aliskanlik.id)}">
      <header class="aliskanlik-ust">
        <span class="aliskanlik-emoji" style="border-color:${kacis(aliskanlik.renk)}55;background:${kacis(aliskanlik.renk)}1f"
              aria-hidden="true">${kacis(aliskanlik.emoji)}</span>
        <div class="aliskanlik-bilgi">
          <h3 class="aliskanlik-ad">${kacis(aliskanlik.ad)}</h3>
          <p class="aliskanlik-alt-yazi">Bu hafta ${haftaSayi}/${aliskanlik.hedefHafta || 7} gün · rekor ${enUzun} gün</p>
        </div>
        <div class="og-e-eylem">
          <button class="ikon-btn kucuk" type="button" data-eylem="duzenle" data-id="${kacis(aliskanlik.id)}"
                  aria-label="Alışkanlığı düzenle: ${kacis(aliskanlik.ad)}" title="Düzenle">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
          </button>
          <button class="ikon-btn kucuk tehlike" type="button" data-eylem="sil" data-id="${kacis(aliskanlik.id)}"
                  aria-label="Alışkanlığı sil: ${kacis(aliskanlik.ad)}" title="Sil">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14"/></svg>
          </button>
        </div>
      </header>

      <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap">
        ${seriEtiketi(seri)}
        <span class="chip chip-notr" title="Haftalık hedef ilerlemesi">${hedefOran}% hedef</span>
      </div>

      <div class="ilerleme-bar ince" role="progressbar" aria-valuemin="0" aria-valuemax="100"
           aria-valuenow="${hedefOran}" aria-label="${kacis(aliskanlik.ad)} haftalık hedefi">
        <span class="ilerleme-dolgu" style="width:${hedefOran}%;background:${kacis(aliskanlik.renk)}"></span>
      </div>

      ${haftaSeridi(aliskanlik)}

      <div class="aliskanlik-aksiyon">
        <button class="btn ${bugunYapildi ? "btn-sade" : "btn-ana"}" type="button"
                data-eylem="isaretle" data-id="${kacis(aliskanlik.id)}"
                aria-pressed="${bugunYapildi}"
                style="${bugunYapildi ? "" : `background:${kacis(aliskanlik.renk)};color:#04191b;border-color:transparent`}">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>
          ${bugunYapildi ? "Bugün işaretlendi" : "Bugün yaptım"}
        </button>
      </div>
    </article>
  `;
}

/* ---------- Render ---------- */

export function render() {
  const { aliskanliklar } = store.al();
  const bugun = bugunISO();
  const bugunYapilan = aliskanliklar.filter((a) => a.yapilanGunler.includes(bugun)).length;
  const oran = aliskanliklar.length ? Math.round((bugunYapilan / aliskanliklar.length) * 100) : 0;

  if (!aliskanliklar.length) {
    return `
      <div class="gorunum-girisi">
        <div class="bolum-basligi">
          <div>
            <h2>Alışkanlıklar</h2>
            <p>Her gün işaretle, serini büyüt.</p>
          </div>
          <button class="btn btn-ana" type="button" data-eylem="yeni-aliskanlik">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>
            Yeni alışkanlık
          </button>
        </div>

        <div class="kart">
          <div class="bos-durum">
            <span class="bos-ikon" aria-hidden="true">
              <svg viewBox="0 0 24 24"><path d="M12 21s-7-4.4-7-9.6A4.4 4.4 0 0 1 12 8a4.4 4.4 0 0 1 7 3.4C19 16.6 12 21 12 21Z"/></svg>
            </span>
            <h3>Takip edecek bir alışkanlık ekle</h3>
            <p>Su içmek, kitap okumak, yürüyüş yapmak... Küçük başla, seriyi koru. İlerleme otomatik hesaplanır.</p>
            <button class="btn btn-ana" type="button" data-eylem="yeni-aliskanlik">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>
              İlk alışkanlığını ekle
            </button>
          </div>
        </div>
      </div>`;
  }

  // Bugünkü durum kartları da ekleyelim
  return `
    <div class="gorunum-girisi">
      <div class="bolum-basligi">
        <div>
          <h2>Alışkanlıklar</h2>
          <p>Her gün işaretle, serini büyüt.</p>
        </div>
        <button class="btn btn-ana" type="button" data-eylem="yeni-aliskanlik">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>
          Yeni alışkanlık
        </button>
      </div>

      <div class="kart hero" style="margin-bottom:var(--bosluk-5)">
        <div class="hero-icerik">
          <div>
            <h2>Bugün ${bugunYapilan}/${aliskanliklar.length} alışkanlık tamam</h2>
            <p>Günlük tutarlılık, uzun vadeli sonucu belirler. Küçük adımlar birikir.</p>
          </div>
          <div class="ilerleme-bar" role="progressbar" aria-valuemin="0" aria-valuemax="100"
               aria-valuenow="${oran}" aria-label="Bugünkü alışkanlık ilerlemesi" style="max-width:420px">
            <span class="ilerleme-dolgu" style="width:${oran}%"></span>
          </div>
          <div class="hero-istatistikler">
            <div class="hero-istatistik"><strong>%${oran}</strong><span>bugünkü oran</span></div>
            <div class="hero-istatistik"><strong>${aliskanliklar.length}</strong><span>toplam alışkanlık</span></div>
            <div class="hero-istatistik"><strong>${aliskanliklar.reduce((t, a) => Math.max(t, store.seri(a.id)), 0)}</strong><span>en uzun aktif seri</span></div>
            <div class="hero-istatistik"><strong>${aliskanliklar.reduce((t, a) => Math.max(t, store.enUzunSeri(a.id)), 0)}</strong><span>tüm zamanlar rekoru</span></div>
          </div>
        </div>
      </div>

      <div class="aliskanlik-izgara">
        ${aliskanliklar.map(aliskanlikKart).join("")}
      </div>
    </div>
  `;
}

/* ---------- Olaylar ---------- */

function aliskanlikSil(id) {
  const a = store.al().aliskanliklar.find((x) => x.id === id);
  if (!a) return;
  onayIste({
    baslik: "Alışkanlığı sil",
    mesaj: `"${a.ad}" ve ${a.yapilanGunler.length} günlük kaydı silinecek. Kısa süre "Geri Al" seçeneği sunulur.`,
    onayMetni: "Sil",
    tehlike: true,
  }).then((onay) => {
    if (!onay) return;
    const indeks = store.aliskanlikIndeks(id);
    const silinen = store.aliskanlikSil(id);
    bildir.geriAl("Alışkanlık silindi.", () => {
      store.aliskanlikGeriKoy(silinen, indeks);
      bildir.basari("Alışkanlık geri getirildi.");
    }, { baslik: a.ad, tur: "hata" });
  });
}

export function bagla(kok, yenidenCiz) {
  kok.addEventListener("click", (olay) => {
    const hedef = olay.target.closest("[data-eylem]");
    if (!hedef || !kok.contains(hedef)) return;
    const eylem = hedef.dataset.eylem;
    const id = hedef.dataset.id;

    if (eylem === "yeni-aliskanlik") {
      aliskanlikFormAc(null, yenidenCiz);
    } else if (eylem === "isaretle") {
      const sonuc = store.aliskanlikIsaretle(id);
      if (sonuc?.yapildi) {
        const seri = store.seri(id);
        const a = store.al().aliskanliklar.find((x) => x.id === id);
        bildir.basari(
          seri > 1 ? `${seri} günlük seri! Böyle devam 🔥` : "Bugünkü kayıt eklendi.",
          { baslik: a ? a.ad : "Tamamlandı" },
        );
      }
      yenidenCiz?.();
    } else if (eylem === "duzenle") {
      aliskanlikFormAc(id, yenidenCiz);
    } else if (eylem === "sil") {
      aliskanlikSil(id);
      setTimeout(() => yenidenCiz?.(), 60);
    }
  });
}

export default { render, bagla, aliskanlikFormAc, seriEtiketi };
