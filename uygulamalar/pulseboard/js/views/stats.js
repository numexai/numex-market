/* =========================================================
   PulseBoard — İstatistikler sayfası
   Son 7 gün, tamamlama oranı, en yoğun gün, kategori/öncelik dağılımı,
   ısı haritası ve özet tablo.
   ========================================================= */

import store from "../store.js";
import { sutunGrafik, alanGrafik, yuzdeHalkasi, dagilimCubuklari, isiHaritasi, sparkline } from "../charts.js";
import {
  kacis, bugunISO, gunKisa, kisaTarih, uzunTarih, sonNGun, yuzde,
} from "../utils.js";

/* ---------- Yardımcı kutular ---------- */

function istatistikKutusu({ etiket, deger, alt, ikon, sinif }) {
  return `
    <article class="kart metrik">
      <div class="metrik-ust">
        <span class="metrik-etiket">${kacis(etiket)}</span>
        <span class="metrik-ikon ${sinif || ""}" aria-hidden="true"><svg viewBox="0 0 24 24">${ikon}</svg></span>
      </div>
      <div class="metrik-deger">${deger}</div>
      ${alt ? `<div class="metrik-alt">${alt}</div>` : ""}
    </article>
  `;
}

/* ---------- Bölümler ---------- */

function son7GunGrafik() {
  const seri = store.sonGunSerisi(7);
  const toplam = seri.reduce((t, g) => t + g.adet, 0);
  const ortalama = (toplam / 7).toFixed(1);
  const enIyi = seri.reduce((a, b) => (b.adet > a.adet ? b : a), seri[0]);

  return `
    <section class="kart" aria-labelledby="s7Baslik">
      <div class="kart-baslik">
        <h3 id="s7Baslik">Son 7 günde tamamlanan görevler</h3>
        <span class="ipucu">Toplam ${toplam} · ortalama ${ortalama}/gün</span>
      </div>
      ${sutunGrafik(seri, { yukseklik: 220, etiket: "Son 7 günde tamamlanan görevler" })}
      <div class="istatistik-seridi" style="border-top:none;padding-bottom:0">
        <span>En verimli gün: <b>${enIyi.adet > 0 ? `${gunKisa(enIyi.tarih)} (${enIyi.adet})` : "—"}</b></span>
        <span>Bugün: <b>${store.gundeTamamlananGorev(bugunISO())}</b></span>
      </div>
    </section>
  `;
}

function tamamlamaOraniBolumu() {
  const gs = store.gorevIstatistigi();
  const ilerleme = store.gunlukIlerleme();

  return `
    <section class="kart" aria-labelledby="oranBaslik">
      <div class="kart-baslik">
        <h3 id="oranBaslik">Görev tamamlama oranı</h3>
        <span class="ipucu">Tüm zamanlar</span>
      </div>
      ${yuzdeHalkasi(gs.oran, { altMetin: `${gs.tamamlanan}/${gs.toplam} görev` })}
      <div class="dagilim" style="margin-top:var(--bosluk-4)">
        <div class="dagilim-satir">
          <div class="dagilim-ust">
            <span class="ad"><i class="nokta" style="display:inline-block;width:8px;height:8px;border-radius:50%;background:var(--yesil)"></i> Tamamlanan</span>
            <strong>${gs.tamamlanan}</strong>
          </div>
          <div class="ilerleme-bar ince"><span class="ilerleme-dolgu" style="width:${yuzde(gs.tamamlanan, gs.toplam)}%"></span></div>
        </div>
        <div class="dagilim-satir">
          <div class="dagilim-ust">
            <span class="ad"><i class="nokta" style="display:inline-block;width:8px;height:8px;border-radius:50%;background:var(--mavi)"></i> Açık</span>
            <strong>${gs.acik}</strong>
          </div>
          <div class="ilerleme-bar ince"><span class="ilerleme-dolgu" style="width:${yuzde(gs.acik, gs.toplam)}%;background:var(--mavi)"></span></div>
        </div>
        <div class="dagilim-satir">
          <div class="dagilim-ust">
            <span class="ad"><i class="nokta" style="display:inline-block;width:8px;height:8px;border-radius:50%;background:var(--kirmizi)"></i> Gecikmiş</span>
            <strong>${gs.gecikmis}</strong>
          </div>
          <div class="ilerleme-bar ince"><span class="ilerleme-dolgu" style="width:${yuzde(gs.gecikmis, gs.toplam)}%;background:var(--kirmizi)"></span></div>
        </div>
      </div>
      <div class="mini-metrik" style="margin-top:var(--bosluk-4)">
        <span class="mini-ikon" aria-hidden="true"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 8v4l3 2"/></svg></span>
        <div class="mini-govde">
          <strong>%${ilerleme.oran}</strong>
          <span>bugünkü ilerleme (${ilerleme.tamamlanan}/${ilerleme.toplam})</span>
        </div>
      </div>
    </section>
  `;
}

function enYogunGunBolumu() {
  const son30 = sonNGun(30);
  const gunluk = son30.map((iso) => ({
    tarih: iso,
    adet: store.gundeTamamlananGorev(iso) + store.gundeTamamlananAliskanlik(iso),
  }));
  const enYogun = gunluk.reduce((a, b) => (b.adet > a.adet ? b : a), { tarih: null, adet: 0 });
  const aktifGunler = gunluk.filter((g) => g.adet > 0).length;

  // Haftanın günlerine göre dağılım (Pzt..Paz)
  const gunToplamlar = [0, 0, 0, 0, 0, 0, 0];
  const gunSayilari = [0, 0, 0, 0, 0, 0, 0];
  gunluk.forEach((g) => {
    const d = new Date(`${g.tarih}T12:00:00`);
    const idx = (d.getDay() + 6) % 7; // Pazartesi = 0
    gunToplamlar[idx] += g.adet;
    gunSayilari[idx] += 1;
  });
  const enVerimliGunIdx = gunToplamlar.indexOf(Math.max(...gunToplamlar));
  const gunAdlari = ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"];

  return `
    <section class="kart" aria-labelledby="yogunBaslik">
      <div class="kart-baslik">
        <h3 id="yogunBaslik">En yoğun gün</h3>
        <span class="ipucu">Son 30 gün</span>
      </div>
      <div class="metrik-deger" style="font-size:1.5rem">
        ${enYogun.tarih ? kacis(uzunTarih(new Date(`${enYogun.tarih}T12:00:00`))) : "Veri yok"}
      </div>
      <p style="margin-top:8px;color:var(--metin-2);font-size:.9rem">
        ${enYogun.adet > 0
          ? `Bu günde toplam <b>${enYogun.adet}</b> aktivite tamamladın (görev + alışkanlık).`
          : "Henüz yeterli veri yok. Görev tamamladıkça burada öne çıkacak."}
      </p>
      <div class="mini-metrik">
        <span class="mini-ikon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M5 20V10M12 20V4M19 20v-6"/></svg></span>
        <div class="mini-govde">
          <strong>${aktifGunler}/30</strong>
          <span>aktif gün (son 30 günde)</span>
        </div>
      </div>
      <div class="mini-metrik">
        <span class="mini-ikon" style="color:var(--mor);background:rgba(168,85,247,.12)" aria-hidden="true">
          <svg viewBox="0 0 24 24"><path d="M12 3v3M12 18v3M3 12h3M18 12h3"/><circle cx="12" cy="12" r="4"/></svg>
        </span>
        <div class="mini-govde">
          <strong>${enVerimliGunIdx >= 0 && gunToplamlar[enVerimliGunIdx] > 0 ? kacis(gunAdlari[enVerimliGunIdx]) : "—"}</strong>
          <span>haftanın en verimli günü</span>
        </div>
      </div>
    </section>
  `;
}

function aktifAliskanlikBolumu() {
  const { aliskanliklar } = store.al();
  const bugun = bugunISO();
  const son7 = sonNGun(7);

  const aktif = aliskanliklar.filter((a) => son7.some((g) => a.yapilanGunler.includes(g)));
  const toplamIsaret = aliskanliklar.reduce((t, a) => t + a.yapilanGunler.length, 0);
  const bugunIsaret = aliskanliklar.filter((a) => a.yapilanGunler.includes(bugun)).length;

  const sirali = [...aliskanliklar]
    .map((a) => ({
      ad: a.ad,
      emoji: a.emoji,
      renk: a.renk,
      seri: store.seri(a.id),
      rekor: store.enUzunSeri(a.id),
      toplam: a.yapilanGunler.length,
      son7: son7.filter((g) => a.yapilanGunler.includes(g)).length,
    }))
    .sort((a, b) => b.son7 - a.son7 || b.seri - a.seri);

  return `
    <section class="kart" aria-labelledby="alisStatBaslik">
      <div class="kart-baslik">
        <h3 id="alisStatBaslik">Alışkanlık performansı</h3>
        <span class="ipucu">${aktif.length}/${aliskanliklar.length} aktif (son 7 gün)</span>
      </div>

      ${aliskanliklar.length === 0
        ? `<div class="bos-durum" style="padding:var(--bosluk-5) var(--bosluk-3)">
             <p>Henüz alışkanlık eklenmedi. <a href="#/aliskanliklar" style="color:var(--teal);font-weight:600">Alışkanlık ekle →</a></p>
           </div>`
        : `
          <div class="izgara izgara-3" style="margin-bottom:var(--bosluk-5)">
            <div class="metrik" style="padding:0">
              <span class="metrik-etiket">Aktif alışkanlık</span>
              <span class="metrik-deger" style="font-size:1.5rem">${aktif.length}</span>
            </div>
            <div class="metrik" style="padding:0">
              <span class="metrik-etiket">Bugün işaretli</span>
              <span class="metrik-deger" style="font-size:1.5rem">${bugunIsaret}/${aliskanliklar.length}</span>
            </div>
            <div class="metrik" style="padding:0">
              <span class="metrik-etiket">Toplam kayıt</span>
              <span class="metrik-deger" style="font-size:1.5rem">${toplamIsaret}</span>
            </div>
          </div>

          <div class="tablo-sarmal">
            <table class="tablo">
              <caption class="gorunmez-metin">Alışkanlık başına seri ve kayıt sayıları</caption>
              <thead>
                <tr>
                  <th scope="col">Alışkanlık</th>
                  <th scope="col">Son 7 gün</th>
                  <th scope="col">Aktif seri</th>
                  <th scope="col">Rekor</th>
                  <th scope="col">Toplam</th>
                </tr>
              </thead>
              <tbody>
                ${sirali.map((a) => `
                  <tr>
                    <td>${kacis(a.emoji)} ${kacis(a.ad)}</td>
                    <td class="sayi">
                      <span style="display:inline-flex;align-items:center;gap:8px">
                        <span class="ilerleme-bar ince" style="width:64px;display:inline-block;vertical-align:middle">
                          <span class="ilerleme-dolgu" style="width:${Math.round((a.son7 / 7) * 100)}%;background:${kacis(a.renk)}"></span>
                        </span>
                        ${a.son7}/7
                      </span>
                    </td>
                    <td class="sayi">${a.seri > 0 ? `🔥 ${a.seri}` : "0"}</td>
                    <td class="sayi">${a.rekor}</td>
                    <td class="sayi">${a.toplam}</td>
                  </tr>`).join("")}
              </tbody>
            </table>
          </div>
        `}
    </section>
  `;
}

function dagilimBolumu() {
  const ist = store.istatistikOzeti();

  const oncelikListesi = ist.oncelikDagilim.map((o) => ({
    ad: o.id === "dusuk" ? "Düşük" : o.id === "orta" ? "Orta" : "Yüksek",
    adet: o.adet,
    renk: o.id === "dusuk" ? "#38bdf8" : o.id === "orta" ? "#fbbf24" : "#fb923c",
  }));

  return `
    <section class="kart" aria-labelledby="dagilimBaslik">
      <div class="kart-baslik">
        <h3 id="dagilimBaslik">Öncelik dağılımı</h3>
        <span class="ipucu">Tüm görevler</span>
      </div>
      ${dagilimCubuklari(oncelikListesi, { bosMesaj: "Henüz görev eklenmedi." })}
    </section>

    <section class="kart" aria-labelledby="kategoriBaslik">
      <div class="kart-baslik">
        <h3 id="kategoriBaslik">Kategori dağılımı</h3>
        <span class="ipucu">${ist.kategoriDagilim.length} kategori</span>
      </div>
      ${dagilimCubuklari(ist.kategoriDagilim, { bosMesaj: "Kategorilere göre veri oluşmadı." })}
    </section>
  `;
}

function isiHaritasiBolumu() {
  const gunler = store.isiHaritasi();
  return `
    <section class="kart" aria-labelledby="isiBaslik">
      <div class="kart-baslik">
        <h3 id="isiBaslik">Aktivite haritası</h3>
        <span class="ipucu">Son 12 hafta · görev + alışkanlık</span>
      </div>
      ${isiHaritasi(gunler)}
    </section>
  `;
}

function ozetTablosu() {
  const ist = store.istatistikOzeti();
  const gs = store.gorevIstatistigi();
  const bugun = bugunISO();

  const satirlar = [
    ["Toplam görev", gs.toplam],
    ["Tamamlanan görev", gs.tamamlanan],
    ["Açık görev", gs.acik],
    ["Gecikmiş görev", gs.gecikmis],
    ["Bugün teslim edilecek", gs.bugunTeslim],
    ["Genel tamamlama oranı", `%${gs.oran}`],
    ["Bugün tamamlanan", store.gundeTamamlananGorev(bugun)],
    ["Son 7 günde tamamlanan", ist.toplamTamam],
    ["Günlük ortalama (7 gün)", ist.gunlukOrtalama],
    ["Toplam alışkanlık", ist.toplamAliskanlik],
    ["Aktif alışkanlık (7 gün)", ist.aktifAliskanlik],
  ];

  return `
    <section class="kart" aria-labelledby="tabloBaslik">
      <div class="kart-baslik">
        <h3 id="tabloBaslik">Özet tablo</h3>
        <span class="ipucu">${kacis(uzunTarih())}</span>
      </div>
      <div class="tablo-sarmal">
        <table class="tablo">
          <caption class="gorunmez-metin">PulseBoard genel istatistik özeti</caption>
          <tbody>
            ${satirlar.map(([ad, deger]) => `
              <tr><td>${kacis(ad)}</td><td class="sayi">${kacis(String(deger))}</td></tr>`).join("")}
          </tbody>
        </table>
      </div>
    </section>
  `;
}

/* ---------- Boş durum ---------- */

function istatistikBosDurum() {
  return `
    <div class="gorunum-girisi">
      <div class="bolum-basligi">
        <div>
          <h2>İstatistikler</h2>
          <p>İlerlemeni sayılarla takip et.</p>
        </div>
      </div>
      <div class="kart">
        <div class="bos-durum">
          <span class="bos-ikon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M5 20V10M12 20V4M19 20v-6"/></svg></span>
          <h3>Henüz istatistik oluşturacak veri yok</h3>
          <p>Görev tamamla ve alışkanlıklarını işaretle — bu sayfa otomatik olarak dolmaya başlar.</p>
          <div style="display:flex;gap:10px;flex-wrap:wrap;justify-content:center;margin-top:var(--bosluk-2)">
            <button class="btn btn-ana" type="button" data-eylem="yeni-gorev">Görev ekle</button>
            <button class="btn btn-sade" type="button" data-eylem="ornek-veri">Örnek veriyle doldur</button>
          </div>
        </div>
      </div>
    </div>
  `;
}

/* ---------- Render ---------- */

export function render() {
  if (store.bosMu()) return istatistikBosDurum();

  const ist = store.istatistikOzeti();
  const gs = store.gorevIstatistigi();
  const gunler14 = store.sonGunSerisi(14).map((g) => g.adet);

  return `
    <div class="gorunum-girisi">
      <div class="bolum-basligi">
        <div>
          <h2>İstatistikler</h2>
          <p>Son 7 gün, tamamlama oranı, en yoğun gün ve kategori dağılımı.</p>
        </div>
        <span class="chip chip-notr">${kacis(uzunTarih())}</span>
      </div>

      <div class="izgara izgara-4 kompakt-mobil" style="margin-bottom:var(--bosluk-5)">
        ${istatistikKutusu({
          etiket: "Son 7 günde tamamlanan",
          deger: `${ist.toplamTamam}`,
          alt: `<span>günlük ortalama <b>${ist.gunlukOrtalama}</b></span>`,
          ikon: '<path d="M20 6 9 17l-5-5"/>',
        })}
        ${istatistikKutusu({
          etiket: "Tamamlama oranı",
          deger: `%${gs.oran}`,
          alt: `<span>${gs.tamamlanan}/${gs.toplam} görev</span>`,
          ikon: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
          sinif: "mavi",
        })}
        ${istatistikKutusu({
          etiket: "En yoğun gün",
          deger: ist.enYogun.adet > 0 ? `${ist.enYogun.adet}` : "—",
          alt: `<span>${ist.enYogun.tarih && ist.enYogun.adet > 0 ? kacis(kisaTarih(ist.enYogun.tarih)) : "veri yok"}</span>`,
          ikon: '<path d="M13 2 4.5 13H11l-1 9 8.5-11H12l1-9Z"/>',
          sinif: "mor",
        })}
        ${istatistikKutusu({
          etiket: "Aktif alışkanlık",
          deger: `${ist.aktifAliskanlik}<small>/${ist.toplamAliskanlik}</small>`,
          alt: `<span>son 7 günde işaretlenen</span>`,
          ikon: '<path d="M12 21s-7-4.4-7-9.6A4.4 4.4 0 0 1 12 8a4.4 4.4 0 0 1 7 3.4C19 16.6 12 21 12 21Z"/>',
          sinif: "sari",
        })}
      </div>

      <div class="izgara izgara-2-1" style="margin-bottom:var(--bosluk-5)">
        ${son7GunGrafik()}
        ${tamamlamaOraniBolumu()}
      </div>

      <div class="izgara izgara-2-1" style="margin-bottom:var(--bosluk-5)">
        ${enYogunGunBolumu()}
        <section class="kart" aria-labelledby="egilim14Baslik">
          <div class="kart-baslik">
            <h3 id="egilim14Baslik">14 günlük eğilim</h3>
            <span class="ipucu">Tamamlanan görev</span>
          </div>
          ${alanGrafik(store.sonGunSerisi(14), { yukseklik: 152, etiket: "14 günlük tamamlama eğilimi" })}
          <div style="margin-top:var(--bosluk-4)">${sparkline(gunler14, { renk: "#a855f7" })}</div>
        </section>
      </div>

      <div class="izgara izgara-2" style="margin-bottom:var(--bosluk-5)">
        ${dagilimBolumu()}
      </div>

      ${isiHaritasiBolumu()}

      <div style="margin-top:var(--bosluk-5)">
        ${ozetTablosu()}
      </div>
    </div>
  `;
}

/* ---------- Olaylar ---------- */

export function bagla(kok, yenidenCiz) {
  kok.addEventListener("click", (olay) => {
    const hedef = olay.target.closest("[data-eylem]");
    if (!hedef || !kok.contains(hedef)) return;
    const eylem = hedef.dataset.eylem;

    if (eylem === "yeni-gorev") {
      // app.js'te global hızlı ekleme ile aynı davranış
      document.getElementById("hizliEkleBtn")?.click();
    } else if (eylem === "ornek-veri") {
      store.ornekVeriYukle();
      yenidenCiz?.();
    }
  });
}

export default { render, bagla, istatistikKutusu };
