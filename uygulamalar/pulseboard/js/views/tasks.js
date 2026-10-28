/* =========================================================
   PulseBoard — Görevler sayfası
   Arama, filtre, sıralama, aktif/tamamlanan grupları.
   ========================================================= */

import store from "../store.js";
import bildir from "../toast.js";
import {
  kacis, normalize, bugunISO, ONCELIKLER, bugunISO as bugun,
} from "../utils.js";
import {
  gorevSatiri, gorevEylemleriniBagla, gorevFormAc, gorevTumunuTemizleOnayli,
} from "../tasks.js";

/* Sayfa durumu (oturum içi) */
const durum = {
  arama: "",
  oncelik: "hepsi",
  kategori: "hepsi",
  siralama: "teslim",
  gorunum: "aktif", // aktif | tamamlanan | hepsi
};

export function durumSifirla() {
  durum.arama = "";
  durum.oncelik = "hepsi";
  durum.kategori = "hepsi";
  durum.siralama = "teslim";
  durum.gorunum = "aktif";
}

/* ---------- Filtre + sıralama ---------- */

function gorevleriFiltrele(liste) {
  const aramMetni = normalize(durum.arama);

  let sonuc = liste.filter((g) => {
    if (durum.oncelik !== "hepsi" && g.oncelik !== durum.oncelik) return false;
    if (durum.kategori !== "hepsi" && g.kategori !== durum.kategori) return false;
    if (aramMetni) {
      const havuz = normalize(`${g.ad} ${g.aciklama} ${store.kategoriBilgi(g.kategori).ad}`);
      if (!havuz.includes(aramMetni)) return false;
    }
    return true;
  });

  const oncelikAgirlik = { yuksek: 3, orta: 2, dusuk: 1 };

  if (durum.siralama === "teslim") {
    sonuc = sonuc.sort((a, b) => {
      if (!a.teslim && !b.teslim) return 0;
      if (!a.teslim) return 1;
      if (!b.teslim) return -1;
      return a.teslim.localeCompare(b.teslim);
    });
  } else if (durum.siralama === "oncelik") {
    sonuc = sonuc.sort((a, b) => oncelikAgirlik[b.oncelik] - oncelikAgirlik[a.oncelik]);
  } else if (durum.siralama === "yeni") {
    sonuc = sonuc.sort((a, b) => String(b.olusturmaTarihi).localeCompare(String(a.olusturmaTarihi)));
  } else if (durum.siralama === "ad") {
    sonuc = sonuc.sort((a, b) => a.ad.localeCompare(b.ad, "tr"));
  }

  return sonuc;
}

function gecikmisMi(g) {
  return !g.tamam && g.teslim && g.teslim < bugunISO();
}

function bugunMu(g) {
  return g.teslim === bugunISO();
}

/* ---------- Boş durumlar ---------- */

function bosDurumHtml() {
  const veri = store.al();
  if (!veri.gorevler.length) {
    return `
      <div class="bos-durum">
        <span class="bos-ikon" aria-hidden="true">
          <svg viewBox="0 0 24 24"><path d="M9 6h11M9 12h11M9 18h11M4 6l1.2 1.2L7.5 4.9M4 12l1.2 1.2L7.5 10.9M4 18l1.2 1.2L7.5 16.9"/></svg>
        </span>
        <h3>Henüz görev eklemedin</h3>
        <p>İlk görevini ekleyerek gününü planlamaya başla. Öncelik ve son tarih belirleyebilirsin.</p>
        <button class="btn btn-ana" type="button" data-eylem="yeni-gorev">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>
          İlk görevini ekle
        </button>
      </div>`;
  }
  if (durum.gorunum === "tamamlanan") {
    return `
      <div class="bos-durum">
        <span class="bos-ikon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg></span>
        <h3>Henüz tamamlanan görev yok</h3>
        <p>Görevleri tamamladıkça burada birikecek. Aktif görevlerden başlayabilirsin.</p>
        <button class="btn btn-sade" type="button" data-eylem="gorunum-aktif">Aktif görevleri göster</button>
      </div>`;
  }
  return `
    <div class="bos-durum">
      <span class="bos-ikon" aria-hidden="true"><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.6-3.6"/></svg></span>
      <h3>Sonuç bulunamadı</h3>
      <p>Arama veya filtre ölçütlerine uyan görev yok. Filtreleri sıfırlayıp tekrar deneyebilirsin.</p>
      <button class="btn btn-sade" type="button" data-eylem="filtre-sifirla">Filtreleri sıfırla</button>
    </div>`;
}

/* ---------- Render ---------- */

export function render() {
  const veri = store.al();
  const kategoriler = store.kategoriListesi();
  const tumGorevler = veri.gorevler;
  const ist = store.gorevIstatistigi();

  const tamamlananlar = tumGorevler.filter((g) => g.tamam);
  const aktifler = tumGorevler.filter((g) => !g.tamam);

  const havuz = durum.gorunum === "aktif"
    ? aktifler
    : durum.gorunum === "tamamlanan"
      ? tamamlananlar
      : tumGorevler;

  const filtrelenmis = gorevleriFiltrele(havuz);

  // Aktif görünümde gruplama
  let listeGovdesi = "";
  if (durum.gorunum === "aktif" && filtrelenmis.length) {
    const gecikmisler = filtrelenmis.filter(gecikmisMi);
    const bugunler = filtrelenmis.filter((g) => !gecikmisMi(g) && bugunMu(g));
    const gelecekler = filtrelenmis.filter((g) => !gecikmisMi(g) && !bugunMu(g) && g.teslim);
    const tarihsizler = filtrelenmis.filter((g) => !g.teslim);

    const grup = (baslik, ogeler) => {
      if (!ogeler.length) return "";
      return `
        <div class="bolum-ayrac">${kacis(baslik)} · ${ogeler.length}</div>
        <ul class="gorev-grup" role="list">
          ${ogeler.map((g) => gorevSatiri(g)).join("")}
        </ul>`;
    };

    listeGovdesi =
      grup("Gecikmiş", gecikmisler) +
      grup("Bugün", bugunler) +
      grup("Yaklaşan", gelecekler) +
      grup("Tarihsiz", tarihsizler);
  } else if (filtrelenmis.length) {
    listeGovdesi = `
      <ul class="gorev-grup" role="list">
        ${filtrelenmis.map((g) => gorevSatiri(g)).join("")}
      </ul>`;
  } else {
    listeGovdesi = bosDurumHtml();
  }

  const segmentBtn = (deger, etiket, adet) => `
    <button type="button" data-eylem="gorunum" data-deger="${deger}"
            class="${durum.gorunum === deger ? "aktif" : ""}"
            aria-pressed="${durum.gorunum === deger}">${etiket}${adet !== undefined ? ` (${adet})` : ""}</button>`;

  return `
    <div class="gorunum-girisi">
      <div class="bolum-basligi">
        <div>
          <h2>Görevler</h2>
          <p>Planını oluştur, önceliklendir ve tamamladıkça ilerlemeni izle.</p>
        </div>
        <button class="btn btn-ana" type="button" data-eylem="yeni-gorev">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>
          Yeni görev
        </button>
      </div>

      <section class="kart" aria-label="Görev araçları">
        <div class="arac-cubugu" style="padding:0 0 var(--bosluk-4)">
          <div class="arama-kutu">
            <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.6-3.6"/></svg>
            <label class="gorunmez-metin" for="gorevArama">Görevlerde ara</label>
            <input class="girdi" id="gorevArama" type="search" placeholder="Görevlerde ara..."
                   value="${kacis(durum.arama)}" autocomplete="off" />
          </div>

          <div class="segmentli" role="group" aria-label="Görünüm filtresi">
            ${segmentBtn("aktif", "Aktif", aktifler.length)}
            ${segmentBtn("tamamlanan", "Tamamlanan", tamamlananlar.length)}
            ${segmentBtn("hepsi", "Tümü", tumGorevler.length)}
          </div>
        </div>

        <div class="arac-cubugu" style="padding:var(--bosluk-4) 0 0;border-top:1px solid var(--cizgi)">
          <label class="gorunmez-metin" for="filtreOncelik">Önceliğe göre filtrele</label>
          <select class="secim" id="filtreOncelik">
            <option value="hepsi"${durum.oncelik === "hepsi" ? " selected" : ""}>Tüm öncelikler</option>
            ${ONCELIKLER.map((o) => `<option value="${o.id}"${durum.oncelik === o.id ? " selected" : ""}>${o.ad} öncelik</option>`).join("")}
          </select>

          <label class="gorunmez-metin" for="filtreKategori">Kategoriye göre filtrele</label>
          <select class="secim" id="filtreKategori">
            <option value="hepsi"${durum.kategori === "hepsi" ? " selected" : ""}>Tüm kategoriler</option>
            ${kategoriler.map((k) => `<option value="${kacis(k.id)}"${durum.kategori === k.id ? " selected" : ""}>${kacis(k.ad)}</option>`).join("")}
          </select>

          <label class="gorunmez-metin" for="filtreSirala">Sıralama</label>
          <select class="secim" id="filtreSirala">
            <option value="teslim"${durum.siralama === "teslim" ? " selected" : ""}>Son tarihe göre</option>
            <option value="oncelik"${durum.siralama === "oncelik" ? " selected" : ""}>Önceliğe göre</option>
            <option value="yeni"${durum.siralama === "yeni" ? " selected" : ""}>En yeni</option>
            <option value="ad"${durum.siralama === "ad" ? " selected" : ""}>İsme göre (A-Z)</option>
          </select>

          <div style="flex:1"></div>
          <button class="btn btn-kucuk btn-sade" type="button" data-eylem="tamamlananlari-temizle">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14"/></svg>
            Tamamlananları temizle
          </button>
        </div>

        <div class="istatistik-seridi" style="margin-top:var(--bosluk-4);padding-left:0;padding-right:0">
          <span>Aktif: <b>${ist.acik}</b></span>
          <span>Tamamlanan: <b>${ist.tamamlanan}</b></span>
          <span>Bugün teslim: <b>${ist.bugunTeslim}</b></span>
          <span>Gecikmiş: <b>${ist.gecikmis}</b></span>
          <span>Genel oran: <b>%${ist.oran}</b></span>
          ${filtrelenmis.length !== havuz.length ? `<span>Gösterilen: <b>${filtrelenmis.length}</b></span>` : ""}
        </div>
      </section>

      <section aria-label="Görev listesi" style="margin-top:var(--bosluk-5)">
        ${listeGovdesi}
      </section>
    </div>
  `;
}

/* ---------- Olaylar ---------- */

export function bagla(kok) {
  gorevEylemleriniBagla(kok, () => kok.dispatchEvent(new CustomEvent("pb:yenile")));

  // Kök düğüm her çizimde `innerHTML` ile baştan yazıldığı için eski
  // dinleyiciler yok olur; burada kalan dinleyici de her seferinde taze
  // düğüme eklenen tek dinleyicidir.
  kok.addEventListener("click", (olay) => {
    const hedef = olay.target.closest("[data-eylem]");
    if (!hedef) return;
    const eylem = hedef.dataset.eylem;

    if (eylem === "yeni-gorev") {
      gorevFormAc(null, () => kok.dispatchEvent(new CustomEvent("pb:yenile")));
    } else if (eylem === "gorunum") {
      durum.gorunum = hedef.dataset.deger;
      kok.dispatchEvent(new CustomEvent("pb:yenile"));
    } else if (eylem === "gorunum-aktif") {
      durum.gorunum = "aktif";
      kok.dispatchEvent(new CustomEvent("pb:yenile"));
    } else if (eylem === "filtre-sifirla") {
      durum.arama = "";
      durum.oncelik = "hepsi";
      durum.kategori = "hepsi";
      bildir.bilgi("Filtreler sıfırlandı.");
      kok.dispatchEvent(new CustomEvent("pb:yenile"));
    } else if (eylem === "tamamlananlari-temizle") {
      gorevTumunuTemizleOnayli().then(() => kok.dispatchEvent(new CustomEvent("pb:yenile")));
    }
  });

  kok.addEventListener("input", (olay) => {
    const hedef = olay.target;
    if (hedef.id === "gorevArama") {
      durum.arama = hedef.value;
      // Sadece listeyi yenilemek için tüm görünümü tazele (odak kaybını önlemek adına
      // arama alanının değeri render'da korunur ve odak geri verilir)
      const konum = hedef.selectionStart;
      kok.dispatchEvent(new CustomEvent("pb:yenile", { detail: { aramaOdak: true, konum } }));
    }
  });

  kok.addEventListener("change", (olay) => {
    const hedef = olay.target;
    if (hedef.id === "filtreOncelik") durum.oncelik = hedef.value;
    else if (hedef.id === "filtreKategori") durum.kategori = hedef.value;
    else if (hedef.id === "filtreSirala") durum.siralama = hedef.value;
    else return;
    kok.dispatchEvent(new CustomEvent("pb:yenile"));
  });
}

export default { render, bagla, durumSifirla };
