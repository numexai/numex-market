/* =========================================================
   PulseBoard — Ayarlar sayfası
   Tema, veri dışa/içe aktarma, örnek veri, sıfırlama, kısayollar.
   ========================================================= */

import store from "../store.js";
import { modalAc, onayIste } from "../modal.js";
import bildir from "../toast.js";
import { kacis, bugunISO } from "../utils.js";

/* ---------- Yardımcılar ---------- */

function dosyaIndir(icerik, dosyaAdi) {
  const blob = new Blob([icerik], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = dosyaAdi;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1200);
}

/* ---------- Bölümler ---------- */

function temaBolumu() {
  const tema = store.temaAl();
  return `
    <section class="kart" aria-labelledby="temaBaslik">
      <div class="kart-baslik">
        <h3 id="temaBaslik">Görünüm</h3>
        <span class="ipucu">Tercih tarayıcıda saklanır</span>
      </div>

      <div class="ayar-satir">
        <div class="ayar-bilgi">
          <strong>Tema</strong>
          <span>Koyu tema varsayılandır. Açık tema düşük ışıklı ortamlarda daha rahat olabilir.</span>
        </div>
        <div class="segmentli" role="group" aria-label="Tema seçimi">
          <button type="button" data-eylem="tema-sec" data-deger="koyu"
                  class="${tema === "koyu" ? "aktif" : ""}" aria-pressed="${tema === "koyu"}">Koyu</button>
          <button type="button" data-eylem="tema-sec" data-deger="acik"
                  class="${tema === "acik" ? "aktif" : ""}" aria-pressed="${tema === "acik"}">Açık</button>
        </div>
      </div>

      <div class="ayar-satir">
        <div class="ayar-bilgi">
          <strong>Sistem tercihine saygı göster</strong>
          <span>İşletim sistemin açık/koyu moda geçtiğinde PulseBoard da uyum sağlar.</span>
        </div>
        <div class="ayar-eylem">
          <button class="btn btn-kucuk btn-sade" type="button" data-eylem="tema-sistem">
            Sisteme uy
          </button>
        </div>
      </div>
    </section>
  `;
}

function veriBolumu() {
  const bilgi = store.depolamaBilgisi();
  return `
    <section class="kart" aria-labelledby="veriBaslik">
      <div class="kart-baslik">
        <h3 id="veriBaslik">Veriler</h3>
        <span class="ipucu">Yalnızca bu tarayıcıda (localStorage)</span>
      </div>

      <div class="ayar-satir">
        <div class="ayar-bilgi">
          <strong>Kullanılan depolama</strong>
          <span>${bilgi.kb} KB · ${bilgi.gorev} görev, ${bilgi.aliskanlik} alışkanlık kaydı</span>
          <div class="depolama-bar" role="progressbar" aria-valuemin="0" aria-valuemax="100"
               aria-valuenow="${bilgi.yuzde}" aria-label="Yerel depolama kullanımı">
            <span style="width:${Math.max(1, Math.min(100, bilgi.yuzde))}%"></span>
          </div>
        </div>
      </div>

      <div class="ayar-satir">
        <div class="ayar-bilgi">
          <strong>Yedek al (dışa aktar)</strong>
          <span>Tüm görev, alışkanlık ve kategorilerini JSON dosyası olarak indir.</span>
        </div>
        <div class="ayar-eylem">
          <button class="btn btn-kucuk" type="button" data-eylem="veri-disa">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12M8 11l4 4 4-4"/><path d="M4 19h16"/></svg>
            Dışa aktar
          </button>
        </div>
      </div>

      <div class="ayar-satir">
        <div class="ayar-bilgi">
          <strong>Yedekten geri yükle (içe aktar)</strong>
          <span>Bir JSON yedeğini yükle. Mevcut verinin üzerine yazılır veya birleştirilir.</span>
        </div>
        <div class="ayar-eylem">
          <button class="btn btn-kucuk" type="button" data-eylem="veri-ice">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 15V3M8 7l4-4 4 4"/><path d="M4 19h16"/></svg>
            İçe aktar
          </button>
        </div>
      </div>

      <div class="ayar-satir">
        <div class="ayar-bilgi">
          <strong>Örnek veri yükle</strong>
          <span>Uygulamayı tanımak için hazır görev ve alışkanlık setini yükle. Mevcut verilerin yerine geçer.</span>
        </div>
        <div class="ayar-eylem">
          <button class="btn btn-kucuk btn-sade" type="button" data-eylem="ornek-veri">Örnek veri yükle</button>
        </div>
      </div>
    </section>
  `;
}

function tehlikeBolumu() {
  return `
    <section class="kart tehlike-kutu" aria-labelledby="tehlikeBaslik">
      <div class="kart-baslik">
        <h3 id="tehlikeBaslik">Tehlikeli bölge</h3>
        <span class="ipucu">Geri alınamaz</span>
      </div>

      <div class="ayar-satir">
        <div class="ayar-bilgi">
          <strong>Tüm verileri sıfırla</strong>
          <span>Tüm görevler, alışkanlıklar ve ayarlar silinir; uygulama ilk haline döner. Önce yedek almanı öneririz.</span>
        </div>
        <div class="ayar-eylem">
          <button class="btn btn-kucuk btn-tehlike" type="button" data-eylem="veri-sifirla">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14"/></svg>
            Her şeyi sıfırla
          </button>
        </div>
      </div>
    </section>
  `;
}

function kisayolBolumu() {
  const kisayollar = [
    ["Yeni görev ekle", "N"],
    ["Görevler sayfası", "G"],
    ["Genel bakış", "1"],
    ["Alışkanlıklar", "2"],
    ["İstatistikler", "3"],
    ["Ayarlar", "4"],
    ["Aramaya odaklan", "/"],
    ["Açık modalı kapat", "Esc"],
  ];

  return `
    <section class="kart" aria-labelledby="kisayolBaslik">
      <div class="kart-baslik">
        <h3 id="kisayolBaslik">Klavye kısayolları</h3>
        <span class="ipucu">Form alanlarında yazarken devre dışı kalır</span>
      </div>
      <div class="kisayol-liste">
        ${kisayollar.map(([ad, tus]) => `
          <div class="kisayol-ogesi">
            <span>${kacis(ad)}</span>
            <kbd>${kacis(tus)}</kbd>
          </div>`).join("")}
      </div>
      <div class="rozet-satiri">
        <span class="chip chip-basarili">Sürüm 1.0.0</span>
        <span class="chip chip-notr">Bağımlılık yok</span>
        <span class="chip chip-notr">Çevrimdışı çalışır</span>
        <span class="chip chip-notr">Veriler cihazında</span>
      </div>
    </section>
  `;
}

function hakkindaBolumu() {
  const { gorevler, aliskanliklar } = store.al();
  return `
    <section class="kart" aria-labelledby="hakkindaBaslik">
      <div class="kart-baslik">
        <h3 id="hakkindaBaslik">PulseBoard hakkında</h3>
        <span class="ipucu">Kişisel çalışma paneli</span>
      </div>
      <div class="ipucu-serit">
        <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8v.5"/></svg>
        <span>
          PulseBoard, günlük görevlerini ve alışkanlıklarını tek ekranda toplar.
          Sunucu kullanmaz; tüm veriler tarayıcının yerel depolamasında tutulur, bu yüzden gizliliğin korunur.
          Farklı bir tarayıcıda kullanmak istersen yedek dosyanı dışa aktarıp oradan içe aktarabilirsin.
        </span>
      </div>
      <div class="istatistik-seridi" style="padding-left:0;padding-right:0;margin-top:var(--bosluk-4)">
        <span>Toplam görev: <b>${gorevler.length}</b></span>
        <span>Toplam alışkanlık: <b>${aliskanliklar.length}</b></span>
        <span>Bugün: <b>${kacis(bugunISO())}</b></span>
      </div>
    </section>
  `;
}

/* ---------- Render ---------- */

export function render() {
  return `
    <div class="gorunum-girisi">
      <div class="bolum-basligi">
        <div>
          <h2>Ayarlar</h2>
          <p>Görünüm, veri yönetimi ve klavye kısayolları.</p>
        </div>
      </div>

      <div class="izgara izgara-1-2">
        ${temaBolumu()}
        ${veriBolumu()}
      </div>

      <div class="izgara izgara-2" style="margin-top:var(--bosluk-5)">
        ${tehlikeBolumu()}
        ${kisayolBolumu()}
      </div>

      <div style="margin-top:var(--bosluk-5)">
        ${hakkindaBolumu()}
      </div>
    </div>
  `;
}

/* ---------- İçe aktarma modalı ---------- */

function iceAktarModalA() {
  modalAc({
    baslik: "Yedekten geri yükle",
    altBaslik: "Daha önce dışa aktardığın JSON dosyasını seç.",
    genislik: "genis",
    govde: `
      <div class="form-satir">
        <label class="etiket" for="yedekDosya">JSON dosyası</label>
        <input class="girdi" id="yedekDosya" type="file" accept="application/json,.json" />
      </div>
      <div class="form-satir">
        <span class="etiket">Veya dosya içeriğini yapıştır</span>
        <textarea class="metin-alani" id="yedekMetin" placeholder='{"veri": {...}}' style="min-height:120px"></textarea>
      </div>
      <div class="form-satir">
        <label style="display:flex;align-items:center;gap:9px;color:var(--metin-2);font-size:.9rem">
          <input type="checkbox" id="birlestirMi" />
          Mevcut verilerle birleştir (üzerine yazma)
        </label>
      </div>
      <p class="form-hata" id="iceAktarHata" role="alert"></p>
    `,
    onayMetni: "Geri yükle",
    onOnay: (modalEl) => {
      const hata = modalEl.querySelector("#iceAktarHata");
      const dosya = modalEl.querySelector("#yedekDosya").files?.[0];
      const metin = modalEl.querySelector("#yedekMetin").value.trim();
      const birles = modalEl.querySelector("#birlestirMi").checked;

      const isle = (icerik) => {
        try {
          const sonuc = store.iceAktar(icerik, birles);
          bildir.basari(
            `${sonuc.gorev} görev ve ${sonuc.aliskanlik} alışkanlık ${birles ? "birleştirildi" : "yüklendi"}.`,
            { baslik: "Geri yükleme tamam" },
          );
          document.dispatchEvent(new CustomEvent("pb:yeniden-ciz"));
        } catch (e) {
          hata.textContent = `Yükleme başarısız: ${e.message}`;
        }
      };

      if (dosya) {
        const okuyucu = new FileReader();
        okuyucu.onload = () => isle(String(okuyucu.result));
        okuyucu.onerror = () => {
          hata.textContent = "Dosya okunamadı.";
        };
        okuyucu.readAsText(dosya);
        return true;
      }

      if (metin) {
        isle(metin);
        return !hata.textContent;
      }

      hata.textContent = "Bir dosya seç veya içeriği yapıştır.";
      return false;
    },
  });
}

/* ---------- Olaylar ---------- */

export function bagla(kok, yenidenCiz) {
  kok.addEventListener("click", async (olay) => {
    const hedef = olay.target.closest("[data-eylem]");
    if (!hedef || !kok.contains(hedef)) return;
    const eylem = hedef.dataset.eylem;

    switch (eylem) {
      case "tema-sec": {
        const tema = hedef.dataset.deger;
        store.temaAyarla(tema);
        bildir.bilgi(tema === "acik" ? "Açık temaya geçildi." : "Koyu temaya geçildi.");
        yenidenCiz?.();
        break;
      }

      case "tema-sistem": {
        const koyuMu = window.matchMedia?.("(prefers-color-scheme: dark)").matches;
        store.temaAyarla(koyuMu ? "koyu" : "acik");
        bildir.basari(`Sistem tercihi uygulandı: ${koyuMu ? "koyu" : "açık"} tema.`);
        yenidenCiz?.();
        break;
      }

      case "veri-disa": {
        const icerik = store.disaAktar();
        const tarih = bugunISO();
        dosyaIndir(icerik, `pulseboard-yedek-${tarih}.json`);
        bildir.basari("Yedek dosyası indirildi.", { baslik: "Dışa aktarma" });
        break;
      }

      case "veri-ice": {
        iceAktarModalA();
        break;
      }

      case "ornek-veri": {
        const onay = await onayIste({
          baslik: "Örnek veri yükle",
          mesaj: "Mevcut görev ve alışkanlıkların örnek veriyle değiştirilecek. Devam etmek istiyor musun?",
          onayMetni: "Yükle ve devam et",
        });
        if (!onay) return;
        store.ornekVeriYukle();
        bildir.basari("Örnek veriler yüklendi.");
        yenidenCiz?.();
        break;
      }

      case "veri-sifirla": {
        const onay = await onayIste({
          baslik: "Her şeyi sıfırla",
          mesaj: "Bu işlem tüm görevleri, alışkanlıkları ve kategorileri kalıcı olarak siler. Bu adım geri alınamaz — önce yedek almayı düşün.",
          onayMetni: "Evet, tümünü sil",
          tehlike: true,
          ekstraHtml: `<div class="ipucu-serit" style="margin-top:var(--bosluk-4)">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 9v4M12 17v.5"/><path d="M10.3 3.9 2.5 17.4A2 2 0 0 0 4.2 20.4h15.6a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"/></svg>
            <span>Güvenlik ağı yok: silinen veriler geri getirilemez.</span>
          </div>`,
        });
        if (!onay) return;
        store.tumunuSifirla();
        document.documentElement.setAttribute("data-tema", store.temaAl());
        bildir.basari("Tüm veriler sıfırlandı. Temiz bir başlangıç!");
        location.hash = "#/genel-bakis";
        yenidenCiz?.();
        break;
      }

      default:
        break;
    }
  });

  kok.addEventListener("change", (olay) => {
    if (olay.target.id === "yedekDosya" && olay.target.files?.length) {
      const hata = olay.target.closest(".modal")?.querySelector("#iceAktarHata");
      if (hata) hata.textContent = "";
    }
  });
}

export default { render, bagla };
