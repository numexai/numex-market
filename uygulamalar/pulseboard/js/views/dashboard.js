/* =========================================================
   PulseBoard — Genel Bakış (dashboard)
   Bugünün görevleri, metrikler, alışkanlık özeti, haftalık grafik.
   ========================================================= */

import store from "../store.js";
import bildir from "../toast.js";
import { sutunGrafik, alanGrafik, sparkline } from "../charts.js";
import {
  gorevEylemleriniBagla, gorevFormAc, kompaktGorevSatiri,
} from "../tasks.js";
import { aliskanlikFormAc } from "./habits.js";
import {
  kacis, bugunISO, buHafta, kisalt, gunKisa, kisaTarih, gunFarki, uzunTarih,
} from "../utils.js";

/* ---------- Metrik kartı ---------- */

function metrikKart({ etiket, deger, alt, ikon, renkSinif, ilerleme, spark }) {
  return `
    <article class="kart metrik">
      <div class="metrik-ust">
        <span class="metrik-etiket">${kacis(etiket)}</span>
        <span class="metrik-ikon ${renkSinif || ""}" aria-hidden="true">
          <svg viewBox="0 0 24 24">${ikon}</svg>
        </span>
      </div>
      <div class="metrik-deger">${deger}</div>
      ${alt ? `<div class="metrik-alt">${alt}</div>` : ""}
      ${Number.isFinite(ilerleme)
        ? `<div class="metrik-cizgi" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${ilerleme}">
             <span style="width:${Math.max(0, Math.min(100, ilerleme))}%"></span>
           </div>`
        : ""}
      ${spark || ""}
    </article>
  `;
}

/* ---------- Bugünün görevleri ---------- */

function bugunGorevleriBolumu() {
  const bugun = bugunISO();
  const tumu = store.al().gorevler.filter((g) => {
    if (g.tamam) return false;
    if (!g.teslim) return true;
    return g.teslim <= bugun;
  });

  const gecikmis = tumu.filter((g) => g.teslim && g.teslim < bugun);
  const bugunluk = tumu.filter((g) => !g.teslim || g.teslim === bugun);

  if (!tumu.length) {
    const bugunTamamlanan = store.gundeTamamlananGorev(bugun);
    return `
      <div class="bos-durum">
        <span class="bos-ikon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg></span>
        <h3>${bugunTamamlanan > 0 ? "Bugünün görevleri tamam! 🎉" : "Bugün için görev yok"}</h3>
        <p>${bugunTamamlanan > 0
          ? `Bugün ${bugunTamamlanan} görevi tamamladın. Yeni bir tane eklemek ister misin?`
          : "Küçük bir görevle başla — momentum en önemli şey."}</p>
        <button class="btn btn-ana" type="button" data-eylem="yeni-gorev">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>
          Görev ekle
        </button>
      </div>`;
  }

  return `
    <ul class="gorev-grup" role="list">
      ${[...gecikmis, ...bugunluk].slice(0, 6).map((g) => kompaktGorevSatiri(g)).join("")}
    </ul>
    ${tumu.length > 6
      ? `<p style="margin-top:12px;font-size:.84rem;color:var(--metin-3)">
           +${tumu.length - 6} görev daha · <a href="#/gorevler" style="color:var(--teal);font-weight:600">Tümünü gör</a>
         </p>`
      : ""}
  `;
}

/* ---------- Alışkanlık özeti ---------- */

function aliskanlikOzeti() {
  const { aliskanliklar } = store.al();
  const bugun = bugunISO();

  if (!aliskanliklar.length) {
    return `
      <div class="bos-durum" style="padding:var(--bosluk-5) var(--bosluk-3)">
        <span class="bos-ikon" style="width:46px;height:46px;padding:12px" aria-hidden="true">
          <svg viewBox="0 0 24 24"><path d="M12 21s-7-4.4-7-9.6A4.4 4.4 0 0 1 12 8a4.4 4.4 0 0 1 7 3.4C19 16.6 12 21 12 21Z"/></svg>
        </span>
        <h3 style="font-size:.98rem">Henüz alışkanlık yok</h3>
        <p style="font-size:.86rem">Günlük rutinlerini takip etmek için bir alışkanlık ekle.</p>
        <button class="btn btn-sade btn-kucuk" type="button" data-eylem="yeni-aliskanlik">Alışkanlık ekle</button>
      </div>`;
  }

  const satirlar = aliskanliklar.slice(0, 5).map((a) => {
    const yapildi = a.yapilanGunler.includes(bugun);
    const seri = store.seri(a.id);
    const hafta = buHafta();
    const haftaSayi = store.haftaTamam(a.id, hafta);
    const oran = Math.min(100, Math.round((haftaSayi / (a.hedefHafta || 7)) * 100));

    return `
      <li class="gorev-satiri" style="align-items:center">
        <button class="onay${yapildi ? " secili" : ""}" type="button"
                data-eylem="aliskanlik-isaretle" data-id="${kacis(a.id)}"
                aria-pressed="${yapildi}"
                aria-label="${yapildi ? "İşareti kaldır" : "Bugün yaptım"}: ${kacis(a.ad)}">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>
        </button>
        <div class="gorev-govde">
          <span class="gorev-ad">${kacis(a.emoji)} ${kacis(a.ad)}</span>
          <div class="gorev-meta">
            <span class="chip chip-notr">${haftaSayi}/${a.hedefHafta || 7} bu hafta</span>
            <span class="chip ${seri > 0 ? "chip-orta" : "chip-notr"}">🔥 ${seri} gün</span>
          </div>
        </div>
        <span style="font-size:.85rem;color:var(--metin-2);font-variant-numeric:tabular-nums;flex:none">${oran}%</span>
      </li>`;
  });

  return `
    <ul class="gorev-grup" role="list" style="gap:8px">${satirlar.join("")}</ul>
    ${aliskanliklar.length > 5
      ? `<p style="margin-top:10px;font-size:.84rem;color:var(--metin-3)">
           +${aliskanliklar.length - 5} alışkanlık · <a href="#/aliskanliklar" style="color:var(--teal);font-weight:600">Tümünü gör</a>
         </p>`
      : ""}
  `;
}

/* ---------- Haftalık aktivite ---------- */

function haftalikAktiviteGrafik() {
  const gunler = buHafta();
  const bugun = bugunISO();
  const seri = gunler.map((iso) => ({
    tarih: iso,
    adet: store.gundeTamamlananGorev(iso),
  }));

  const toplam = seri.reduce((t, g) => t + g.adet, 0);
  const doluGun = seri.filter((g) => g.adet > 0).length;

  return `
    <section class="kart" aria-labelledby="haftalikBaslik">
      <div class="kart-baslik">
        <h3 id="haftalikBaslik">Haftalık aktivite</h3>
        <span class="ipucu">Bu hafta ${toplam} görev · ${doluGun}/7 aktif gün</span>
      </div>
      ${sutunGrafik(seri, { yukseklik: 208, etiket: "Bu hafta tamamlanan görevler" })}
      ${toplam === 0
        ? `<div class="ipucu-serit" style="margin-top:var(--bosluk-4)">
             <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8v.5"/></svg>
             <span>Bu hafta henüz görev tamamlamadın. Bir görevi işaretlediğinde grafik dolmaya başlar.</span>
           </div>`
        : ""}
    </section>
  `;
}

/* ---------- Günlük ilerleme özeti ---------- */

function gunlukOzetKart() {
  const ilerleme = store.gunlukIlerleme();
  const ist = store.gorevIstatistigi();
  const seri = store.sonGunSerisi(7).map((g) => g.adet);

  return `
    <section class="kart hero" aria-labelledby="gunlukBaslik">
      <div class="hero-icerik">
        <div>
          <h2 id="gunlukBaslik">Bugünün planı</h2>
          <p>${uzunTarih()}</p>
        </div>
        <div class="ilerleme-bar" role="progressbar" aria-valuemin="0" aria-valuemax="100"
             aria-valuenow="${ilerleme.oran}" aria-label="Bugünkü görev tamamlama oranı" style="max-width:440px">
          <span class="ilerleme-dolgu" style="width:${ilerleme.oran}%"></span>
        </div>
        <div class="hero-istatistikler">
          <div class="hero-istatistik">
            <strong>%${ilerleme.oran}</strong><span>bugünkü ilerleme</span>
          </div>
          <div class="hero-istatistik">
            <strong>${ilerleme.tamamlanan}/${ilerleme.toplam}</strong><span>tamamlanan görev</span>
          </div>
          <div class="hero-istatistik">
            <strong>${ist.acik}</strong><span>açık görev</span>
          </div>
          <div class="hero-istatistik">
            <strong>${ist.gecikmis}</strong><span>gecikmiş</span>
          </div>
        </div>
        <div style="max-width:300px">${sparkline(seri, { renk: "#38bdf8" })}</div>
      </div>
    </section>
  `;
}

/* ---------- Boş panel ---------- */

function ilkKullanimPaneli() {
  return `
    <section class="kart kart-vurgulu" aria-labelledby="baslangicBaslik">
      <div class="bos-durum" style="border-style:solid;border-color:transparent;padding:var(--bosluk-6) var(--bosluk-4)">
        <span class="bos-ikon" aria-hidden="true">
          <svg viewBox="0 0 24 24"><path d="M13 2 4.5 13H11l-1 9 8.5-11H12l1-9Z"/></svg>
        </span>
        <h3 id="baslangicBaslik" style="font-size:1.22rem">PulseBoard'a hoş geldin</h3>
        <p style="font-size:.94rem;max-width:52ch">
          Burası senin kişisel çalışma panelin. Görevlerini planla, alışkanlıklarını takip et,
          ilerlemeni grafiklerle izle. Tüm verilerin yalnızca bu tarayıcıda saklanır.
        </p>
        <div style="display:flex;gap:10px;flex-wrap:wrap;justify-content:center;margin-top:var(--bosluk-3)">
          <button class="btn btn-ana" type="button" data-eylem="yeni-gorev">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>
            İlk görevini ekle
          </button>
          <button class="btn" type="button" data-eylem="yeni-aliskanlik">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-7-4.4-7-9.6A4.4 4.4 0 0 1 12 8a4.4 4.4 0 0 1 7 3.4C19 16.6 12 21 12 21Z"/></svg>
            Alışkanlık ekle
          </button>
          <button class="btn btn-sade" type="button" data-eylem="ornek-veri">
            Örnek veriyle gez
          </button>
        </div>
      </div>
    </section>
  `;
}

/* ---------- Render ---------- */

export function render() {
  const veri = store.al();
  const ist = store.istatistikOzeti();
  const gs = store.gorevIstatistigi();
  const ilerleme = store.gunlukIlerleme();
  const bugun = bugunISO();

  if (store.bosMu()) {
    return `<div class="gorunum-girisi">${ilkKullanimPaneli()}</div>`;
  }

  const bugunAliskanlik = veri.aliskanliklar.filter((a) => a.yapilanGunler.includes(bugun)).length;
  const alisOran = veri.aliskanliklar.length
    ? Math.round((bugunAliskanlik / veri.aliskanliklar.length) * 100)
    : 0;

  const haftaSeri = store.sonGunSerisi(7).map((g) => g.adet);
  const sonHaftaToplam = haftaSeri.reduce((t, n) => t + n, 0);

  const metrikler = [
    metrikKart({
      etiket: "Bugünkü ilerleme",
      deger: `%${ilerleme.oran}`,
      alt: `<span>${ilerleme.tamamlanan}/${ilerleme.toplam} görev tamamlandı</span>`,
      ikon: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4"/><circle cx="12" cy="12" r="3.4"/>',
      ilerleme: ilerleme.oran,
    }),
    metrikKart({
      etiket: "Açık görev",
      deger: `${gs.acik}`,
      alt: gs.bugunTeslim > 0
        ? `<span class="ok-yukari">● ${gs.bugunTeslim} tanesi bugün teslim</span>`
        : `<span>${gs.gecikmis > 0 ? `${gs.gecikmis} gecikmiş` : "Gecikme yok, harika"}</span>`,
      ikon: '<path d="M9 6h11M9 12h11M9 18h11M4 6l1.2 1.2L7.5 4.9M4 12l1.2 1.2L7.5 10.9M4 18l1.2 1.2L7.5 16.9"/>',
      renkSinif: "mavi",
    }),
    metrikKart({
      etiket: "Bu hafta tamamlanan",
      deger: `${sonHaftaToplam}`,
      alt: `<span>günlük ortalama ${ist.gunlukOrtalama}</span>`,
      ikon: '<path d="M5 20V10M12 20V4M19 20v-6"/>',
      renkSinif: "mor",
      spark: sparkline(haftaSeri, { renk: "#a855f7" }),
    }),
    metrikKart({
      etiket: "Bugünkü alışkanlık",
      deger: `${bugunAliskanlik}<small>/${veri.aliskanliklar.length}</small>`,
      alt: veri.aliskanliklar.length
        ? `<span>%${alisOran} tamamlandı</span>`
        : `<span>Henüz alışkanlık eklenmedi</span>`,
      ikon: '<path d="M12 21s-7-4.4-7-9.6A4.4 4.4 0 0 1 12 8a4.4 4.4 0 0 1 7 3.4C19 16.6 12 21 12 21Z"/>',
      renkSinif: "sari",
      ilerleme: alisOran,
    }),
  ];

  return `
    <div class="gorunum-girisi">
      <div class="izgara izgara-2-1" style="margin-bottom:var(--bosluk-5)">
        ${gunlukOzetKart()}
        <section class="kart" aria-labelledby="bugunGorevBaslik">
          <div class="kart-baslik">
            <h3 id="bugunGorevBaslik">Bugünün görevleri</h3>
            <button class="ikon-btn kucuk" type="button" data-eylem="yeni-gorev"
                    aria-label="Yeni görev ekle" title="Yeni görev">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>
            </button>
          </div>
          ${bugunGorevleriBolumu()}
        </section>
      </div>

      <div class="izgara izgara-4" style="margin-bottom:var(--bosluk-5)">
        ${metrikler.join("")}
      </div>

      <div class="izgara izgara-2-1">
        ${haftalikAktiviteGrafik()}
        <section class="kart" aria-labelledby="aliskanlikOzetBaslik">
          <div class="kart-baslik">
            <h3 id="aliskanlikOzetBaslik">Alışkanlık özeti</h3>
            <a href="#/aliskanliklar" class="ipucu" style="color:var(--teal)">Tümü →</a>
          </div>
          ${aliskanlikOzeti()}
        </section>
      </div>

      <section class="kart" style="margin-top:var(--bosluk-5)" aria-labelledby="egilimBaslik">
        <div class="kart-baslik">
          <h3 id="egilimBaslik">Son 14 günün eğilimi</h3>
          <span class="ipucu">Tamamlanan görev sayısı</span>
        </div>
        ${alanGrafik(
          store.sonGunSerisi(14),
          { yukseklik: 168, etiket: "Son 14 günde tamamlanan görevler" },
        )}
      </section>
    </div>
  `;
}

/* ---------- Olaylar ---------- */

export function bagla(kok, yenidenCiz) {
  gorevEylemleriniBagla(kok, yenidenCiz);

  kok.addEventListener("click", (olay) => {
    const hedef = olay.target.closest("[data-eylem]");
    if (!hedef || !kok.contains(hedef)) return;
    const eylem = hedef.dataset.eylem;
    const id = hedef.dataset.id;

    if (eylem === "yeni-gorev") {
      gorevFormAc(null, yenidenCiz);
    } else if (eylem === "yeni-aliskanlik") {
      aliskanlikFormAc(null, yenidenCiz);
    } else if (eylem === "aliskanlik-isaretle") {
      const sonuc = store.aliskanlikIsaretle(id);
      if (sonuc?.yapildi) {
        const seri = store.seri(id);
        const a = store.al().aliskanliklar.find((x) => x.id === id);
        bildir.basari(seri > 1 ? `${seri} günlük seri 🔥` : "Bugünkü kayıt eklendi.", {
          baslik: a ? a.ad : "Tamamlandı",
        });
      }
      yenidenCiz?.();
    } else if (eylem === "ornek-veri") {
      store.ornekVeriYukle();
      bildir.basari("Örnek veriler yüklendi. Dilediğin zaman Ayarlar'dan sıfırlayabilirsin.");
      yenidenCiz?.();
    }
  });
}

export default { render, bagla };
