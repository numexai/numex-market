/**
 * Sayfa üretim katmanı — bölüm bölüm HTML üretir, olayları bağlar.
 */

import {
  projeler,
  projeBul,
  hizmetler,
  surec,
  teknikCizimler,
  iletisimBilgi,
  type Proje,
} from './data/content';
import { planCiz } from './draw/svgPlan';
import { kesitCiz, cepheCiz, vaziyetCiz, elektrikCiz, kapiPencereCiz } from './draw/svgEk';
import { planKatlar, modernVillaKatlar } from './scene/planData';

const NAV = [
  { ad: 'Ana Sayfa', yol: '#/' },
  { ad: 'Hakkımızda', yol: '#/hakkimizda' },
  { ad: 'Projeler', yol: '#/projeler' },
  { ad: 'Teknik Çizimler', yol: '#/cizimler' },
  { ad: 'Hizmetler', yol: '#/hizmetler' },
  { ad: 'Süreç', yol: '#/surec' },
  { ad: 'İletişim', yol: '#/iletisim' },
];

/* ------------------------------------------------------------------ */
/* YARDIMCILAR                                                        */
/* ------------------------------------------------------------------ */
/**
 * Proje görseli — mimari plan çizimi (2D).
 *
 * NUMEX-DÜZELTME (2026-10-26, kullanıcı kararı): kart görsellerinde 3B maket
 * denendi, sonuç vasat kaldı. Kullanıcının önerisiyle kartlara mimari PLAN
 * konuyor: plan zaten gerçek plan verisinden üretiliyor, okunur ve bir mimarlık
 * portfolyosuna yakışıyor. 3B deneyim keşif sayfasında (kesif.html) duruyor.
 */
const PLAN_AYAR: Record<string, { olcek: string; renk: 'krem' | 'antrasit' }> = {
  'modern-villa': { olcek: '1/100', renk: 'krem' },
  'luks-konut': { olcek: '1/50', renk: 'krem' },
  'bes-katli-apartman': { olcek: '1/200', renk: 'antrasit' },
  'ticari-ofis': { olcek: '1/200', renk: 'antrasit' },
  'butik-otel': { olcek: '1/200', renk: 'krem' },
  'kafe-restoran': { olcek: '1/50', renk: 'krem' },
  'dubleks-ev': { olcek: '1/100', renk: 'antrasit' },
  'karma-kullanimli-yapi': { olcek: '1/200', renk: 'antrasit' },
};

function projeGorsel(p: Proje): string {
  const katlar = planKatlar(p.slug);
  const a = PLAN_AYAR[p.slug] ?? { olcek: '1/100', renk: 'krem' as const };
  const plan = planCiz(katlar[0], {
    olcu: true,
    akslar: true,
    etiket: true,
    dolgu: true,
    olcek: a.olcek,
  });
  return `<div class="proje-gorsel proje-gorsel--${a.renk}">
  <div class="proje-gorsel__ic">${plan}</div>
  <span class="proje-gorsel__pafta">${a.olcek} · MİMARİ PLAN · TEMSİLÎ</span>
</div>`;
}


function header(aktifYol: string, heroUstunde = false): string {
  return `<header class="ust${heroUstunde ? ' ust--hero' : ''}" id="ust">
    <a class="marka" href="#/" aria-label="ATELIER MİMARLIK ana sayfa">
      <strong>Atelier</strong>
      <span>Mimarlık · Teknik Çizim</span>
    </a>
    <div class="ust__sag">
      <nav aria-label="Ana menü">
        <ul class="menu" id="anaMenu">
          ${NAV.map(
            (n) =>
              `<li><a href="${n.yol}"${
                n.yol === aktifYol ? ' aria-current="page"' : ''
              }>${n.ad}</a></li>`
          ).join('')}
          <li><a href="kesif.html">3D Keşif</a></li>
        </ul>
      </nav>
      <button class="menu-ac" id="menuAc" aria-expanded="false" aria-controls="anaMenu" aria-label="Menüyü aç">
        <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true"><path d="M2 5h16M2 10h16M2 15h16" stroke="currentColor" stroke-width="1.4"/></svg>
      </button>
    </div>
  </header>`;
}

function footer(): string {
  return `<footer class="altbilgi">
    <div class="kap">
      <div class="altbilgi__izgara">
        <div>
          <div class="marka" style="color:var(--krem);margin-bottom:0.8rem">
            <strong style="color:var(--krem)">Atelier</strong>
            <span style="color:rgba(244,240,233,0.5)">Mimarlık · Teknik Çizim</span>
          </div>
          <p style="max-width:34ch;font-size:0.88rem">
            AutoCAD ile profesyonel teknik çizim, mimari tasarım ve 3D sunum.
            Temsilî portfolyo sitesi.
          </p>
        </div>
        <div>
          <h4>Bölümler</h4>
          <ul>
            ${NAV.slice(1).map((n) => `<li><a href="${n.yol}">${n.ad}</a></li>`).join('')}
          </ul>
        </div>
        <div>
          <h4>İletişim</h4>
          <ul>
            <li><a href="mailto:${iletisimBilgi.eposta}">${iletisimBilgi.eposta}</a></li>
            <li>${iletisimBilgi.telefon}</li>
            <li>${iletisimBilgi.adres}</li>
            <li><a href="kesif.html">3D Proje Gezintisi</a></li>
          </ul>
        </div>
      </div>
      <div class="altbilgi__alt">
        <span>© ${new Date().getFullYear()} ATELIER MİMARLIK — Temsilî portfolyo</span>
        <span>Bu sitede yer alan projeler ve çizimler temsilîdir; gerçek müşteri işi değildir.</span>
      </div>
    </div>
  </footer>`;
}

/* ------------------------------------------------------------------ */
/* ANA SAYFA                                                          */
/* ------------------------------------------------------------------ */
export function anaSayfa(): string {
  const secilmis = projeler.slice(0, 4);
  return `${header('#/', true)}
  <main id="icerik">
    <section class="hero" aria-labelledby="heroBaslik">
      <div class="hero__tuval" id="heroTuval" aria-hidden="true"></div>
      <div class="hero__perde"></div>
      <div class="hero__ic kap">
        <p class="ustbaslik ustbaslik--acik">Atelier Mimarlık · Mimari Tasarım ve Teknik Çizim</p>
        <h1 id="heroBaslik">Çizgiden <em>Mekâna.</em></h1>
        <p class="hero__alt">Hayal edilen yaşam alanlarını teknik doğruluk, estetik ve işlevsellikle buluşturuyoruz.</p>
        <div class="hero__btnler">
          <a class="btn btn--dolu" href="#/projeler">Projelerimizi Keşfedin</a>
          <a class="btn btn--acik" href="kesif.html">3D Proje Gezintisi</a>
        </div>
      </div>
      <div class="hero__serit" aria-hidden="true">
        <span>AutoCAD · 1/50 Pafta</span>
        <span>3D Modelleme</span>
        <span>İstanbul</span>
      </div>
    </section>

    <section class="bolum kap" aria-labelledby="studyoBaslik">
      <div class="detay-izgara gorunum">
        <div>
          <p class="ustbaslik">Stüdyo</p>
          <h2 id="studyoBaslik">Her çizgi bir karar;<br/>her karar bir mekân.</h2>
        </div>
        <div>
          <p>
            Atelier Mimarlık, mimari tasarımı teknik çizim disipliniyle birlikte yürütür.
            Ön tasarımdan uygulama projesine kadar her aşamada ölçek, ölçü ve malzeme kararı
            aynı masada verilir.
          </p>
          <p class="ince">
            Çalışma biçimimiz sade: önce ihtiyacı netleştiririz, sonra iki üç yönü karşılaştırırız,
            en sonunda seçilen yönü ölçekli paftalara dönüştürürüz. Kullanıcı her adımda neyin
            neden değiştiğini görür.
          </p>
          <a class="btn btn--kucuk" href="#/hakkimizda">Yaklaşımımız</a>
        </div>
      </div>

      <div class="izgara-cizgi gorunum" style="margin-top:3rem">
        <div><p class="ustbaslik" style="margin-bottom:0.3rem">01</p><h3>Ölçekli Doğruluk</h3><p class="ince" style="font-size:0.9rem;margin:0.5rem 0 0">Her pafta 1/50 veya 1/100 ölçekte, ölçü zinciriyle birlikte üretilir.</p></div>
        <div><p class="ustbaslik" style="margin-bottom:0.3rem">02</p><h3>Temsil ve Gerçeklik</h3><p class="ince" style="font-size:0.9rem;margin:0.5rem 0 0">3D model, plandan türetilir; sunumdaki ile uygulamadaki aynı olur.</p></div>
        <div><p class="ustbaslik" style="margin-bottom:0.3rem">03</p><h3>Malzeme Disiplini</h3><p class="ince" style="font-size:0.9rem;margin:0.5rem 0 0">Sınırlı sayıda malzeme, tutarlı bir bütün kurar.</p></div>
        <div><p class="ustbaslik" style="margin-bottom:0.3rem">04</p><h3>Şeffaf Süreç</h3><p class="ince" style="font-size:0.9rem;margin:0.5rem 0 0">Her revizyon gerekçesiyle birlikte belgelenir.</p></div>
      </div>
    </section>

    <section class="bolum kap" aria-labelledby="seciliBaslik">
      <div class="baslik-satir">
        <div>
          <p class="ustbaslik">Seçilmiş Çalışmalar</p>
          <h2 id="seciliBaslik">Projeler</h2>
        </div>
        <p class="ince">Sekiz temsilî proje: konuttan cephe tasarımına, iç mekândan uygulama projesine.</p>
      </div>
      <div class="proje-izgara">
        ${secilmis
          .map(
            (p) => `<a class="proje-kart gorunum" href="#/proje/${p.slug}">
          <span class="etiket">Temsilî örnek</span>
          <div class="proje-kart__gorsel">${projeGorsel(p)}</div>
          <div class="proje-kart__govde">
            <span class="proje-kart__ad">${p.ad}</span>
            <span class="proje-kart__tur">${p.tur}</span>
          </div>
        </a>`
          )
          .join('')}
      </div>
      <div style="margin-top:2.2rem">
        <a class="btn" href="#/projeler">Tüm projeleri görün</a>
      </div>
    </section>

    <section class="bolum--koyu bolum" id="karsilastir" aria-labelledby="karsBaslik">
      <div class="kap" id="karsilastirKok">
        <div class="baslik-satir">
          <div>
            <p class="ustbaslik ustbaslik--acik">2D / 3D Karşılaştırma</p>
            <h2 id="karsBaslik">Plan ile model aynı veriden.</h2>
          </div>
          <p class="ince">Solda ölçekli plan, sağda aynı planın üç boyutlu karşılığı. Kat seçin, duvarları kapatın, kamerayı döndürün.</p>
        </div>
        <div class="kontrol-cubugu">
          <div class="kontrol-grubu">
            <span class="kontrol-etiket">Kat</span>
            <button class="cip" data-kat="0" aria-pressed="true">Zemin</button>
            <button class="cip" data-kat="1" aria-pressed="false">Üst</button>
          </div>
          <div class="kontrol-grubu">
            <button class="cip" id="duvarBtn" aria-pressed="false">Duvarları gizle</button>
          </div>
          <div class="kontrol-grubu">
            <span class="kontrol-etiket">Kamera</span>
            <button class="cip" data-gorunum="dis" aria-pressed="true">Dış</button>
            <button class="cip" data-gorunum="ic" aria-pressed="false">İç</button>
            <button class="cip" data-gorunum="ust" aria-pressed="false">Üstten</button>
          </div>
          <div class="kontrol-grubu">
            <span class="kontrol-etiket">Cephe</span>
            <button class="cip" data-cephe="krem-siva" aria-pressed="true">Krem sıva</button>
            <button class="cip" data-cephe="antrasit-tas" aria-pressed="false">Antrasit taş</button>
            <button class="cip" data-cephe="meşe-panel" aria-pressed="false">Meşe panel</button>
          </div>
        </div>
        <div class="karsilastir">
          <div class="karsilastir__panel">
            <span class="karsilastir__etiket">2D · Plan</span>
            <div class="karsilastir__govde" id="k2d"></div>
          </div>
          <div class="karsilastir__panel">
            <span class="karsilastir__etiket">3D · Model</span>
            <div class="karsilastir__govde" id="k3d"></div>
          </div>
        </div>
        <p class="ince" style="font-size:0.78rem;margin-top:0.9rem">
          Not: 3D sahne ile 2D plan aynı geometriden üretilir; hiçbir hazır model dosyası kullanılmaz.
        </p>
      </div>
    </section>

    <section class="bolum--koyu bolum" aria-labelledby="hizmetOzet">
      <div class="kap">
        <div class="baslik-satir">
          <div>
            <p class="ustbaslik ustbaslik--acik">Hizmetler</p>
            <h2 id="hizmetOzet">Tasarımdan paftaya</h2>
          </div>
          <p class="ince">Mimari proje tasarımı, AutoCAD teknik çizimi, 3D modelleme, iç mimari, renovasyon ve proje takibi.</p>
        </div>
        <div class="izgara-cizgi">
          ${hizmetler
            .slice(0, 4)
            .map(
              (h) => `<div><h3 style="font-size:1.15rem;font-family:var(--font-metin);font-weight:500">${h.ad}</h3>
            <p class="ince" style="font-size:0.88rem;margin:0.5rem 0 0">${h.aciklama}</p></div>`
            )
            .join('')}
        </div>
        <div style="margin-top:2rem;display:flex;gap:0.8rem;flex-wrap:wrap">
          <a class="btn btn--acik" href="#/hizmetler">Hizmetlerin tamamı</a>
          <a class="btn btn--acik" href="#/cizimler">Teknik çizim galerisi</a>
        </div>
      </div>
    </section>

    <section class="bolum kap" aria-labelledby="cagri">
      <div class="cagri-blok gorunum">
        <div>
          <p class="ustbaslik">İletişim</p>
          <h2 id="cagri">Projenizi konuşalım.</h2>
          <p class="ince" style="max-width:52ch;margin-top:0.8rem">
            Proje türü, yaklaşık alan ve ihtiyaçlarınızı paylaşın; ilk görüşme için size dönüş yapalım.
          </p>
        </div>
        <a class="btn btn--dolu" href="#/iletisim">İletişim formu</a>
      </div>
    </section>
  </main>
  ${footer()}`;
}

/* ------------------------------------------------------------------ */
/* HAKKIMIZDA                                                         */
/* ------------------------------------------------------------------ */
export function hakkimizdaSayfa(): string {
  return `${header('#/hakkimizda')}
  <main id="icerik">
    <section class="detay-baslik kap">
      <p class="ustbaslik">Hakkımızda</p>
      <h1>Çizgi, ölçü ve<br/><em style="font-style:italic;color:var(--bronz)">mekân</em> üzerine.</h1>
      <p class="ince" style="max-width:58ch;margin-top:1.2rem">
        Atelier Mimarlık; mimari tasarımı AutoCAD tabanlı teknik çizim disipliniyle birlikte
        yürüten, konut ve ticari ölçekte proje üreten bir stüdyodur.
      </p>
    </section>

    <section class="bolum--dar kap">
      <div class="detay-izgara">
        <div>
          <h2 style="margin-bottom:1rem">Yaklaşım</h2>
          <p>
            Tasarımı, çizimden bağımsız bir "hayal etme" işi olarak görmüyoruz. Bir duvarın kalınlığı,
            bir pencerenin denizlik kotu, bir kapının açılım yönü — bunlar tasarımın kendisidir.
            Bu yüzden pafta ile mekânı aynı süreçte, birlikte üretiyoruz.
          </p>
          <p>
            Her projeye üç soruyla başlıyoruz: Kim kullanacak? Günün hangi saatinde nerede olacak?
            Bu mekânı beş yıl sonra ne değiştirecek? Cevaplar netleşmeden plan kararı almıyoruz.
          </p>
        </div>
        <div>
          <h2 style="margin-bottom:1rem">Felsefe</h2>
          <p class="ince">
            "Az ama doğru" — malzeme sayısını sınırlı tutmak, detayı ise sonuna kadar çözmek.
            Gösterişli bir görsel yerine, uygulanabilir bir detay tercih ederiz.
          </p>
          <ul style="list-style:none;padding:0;margin:1.2rem 0 0;display:grid;gap:0.7rem">
            <li style="border-left:2px solid var(--bronz);padding-left:0.9rem">Ölçek, kararın kendisidir.</li>
            <li style="border-left:2px solid var(--bronz);padding-left:0.9rem">Işık, plan kararıyla gelir; aydınlatma sonradan eklenmez.</li>
            <li style="border-left:2px solid var(--bronz);padding-left:0.9rem">Uygulanmayan detay çizilmemiş sayılır.</li>
          </ul>
        </div>
      </div>
    </section>

    <section class="bolum--koyu bolum">
      <div class="kap">
        <div class="baslik-satir">
          <div><p class="ustbaslik ustbaslik--acik">Teknik Uzmanlık</p><h2>Kullandığımız araçlar ve çıktılar</h2></div>
        </div>
        <div class="izgara-cizgi">
          <div><h3 style="font-size:1.05rem;font-family:var(--font-metin);font-weight:500">AutoCAD</h3><p class="ince" style="font-size:0.88rem;margin:0.4rem 0 0">Katmanlı, ölçülendirilmiş 2D pafta üretimi (plan, kesit, görünüş, detay).</p></div>
          <div><h3 style="font-size:1.05rem;font-family:var(--font-metin);font-weight:500">3D Modelleme</h3><p class="ince" style="font-size:0.88rem;margin:0.4rem 0 0">Kütle ve iç mekân modelleri; malzeme ve ışık denemeleri.</p></div>
          <div><h3 style="font-size:1.05rem;font-family:var(--font-metin);font-weight:500">Metraj</h3><p class="ince" style="font-size:0.88rem;margin:0.4rem 0 0">Pafta üzerinden malzeme ve mahal listesi çıkarımı.</p></div>
          <div><h3 style="font-size:1.05rem;font-family:var(--font-metin);font-weight:500">Koordinasyon</h3><p class="ince" style="font-size:0.88rem;margin:0.4rem 0 0">Statik ve mekanik projelerle çakışma kontrolü.</p></div>
        </div>
      </div>
    </section>

    <section class="bolum kap">
      <div class="baslik-satir">
        <div><p class="ustbaslik">Proje Yönetimi</p><h2>Süreç nasıl işliyor</h2></div>
        <p class="ince">Yedi adım, her adımda tek bir teslim ve tek bir onay noktası.</p>
      </div>
      <ol class="surec">
        ${surec
          .map((s) => `<li><div><h3>${s.ad}</h3><p>${s.aciklama}</p></div></li>`)
          .join('')}
      </ol>
    </section>
  </main>
  ${footer()}`;
}

/* ------------------------------------------------------------------ */
/* PROJELER                                                           */
/* ------------------------------------------------------------------ */
export function projelerSayfa(): string {
  return `${header('#/projeler')}
  <main id="icerik">
    <section class="detay-baslik kap">
      <p class="ustbaslik">Portfolyo</p>
      <h1>Projeler</h1>
      <p class="ince" style="max-width:60ch;margin-top:1.1rem">
        Sekiz temsilî proje. Her biri kendi detay sayfasında: yaklaşım, örnek alan ölçüleri,
        kullanılan teknikler ve çalışma aşamaları.
      </p>
      <p class="bilgi-notu" style="margin-top:1.4rem">
        Bu projeler gerçek müşteri işi değildir; stüdyo yaklaşımını göstermek için hazırlanmış temsilî örneklerdir.
      </p>
    </section>

    <section class="bolum--dar kap">
      <div class="proje-izgara">
        ${projeler
          .map(
            (p) => `<a class="proje-kart gorunum" href="#/proje/${p.slug}">
          <span class="etiket">Temsilî örnek</span>
          <div class="proje-kart__gorsel">${projeGorsel(p)}</div>
          <div class="proje-kart__govde">
            <span class="proje-kart__ad">${p.ad}</span>
            <span class="proje-kart__tur">${p.tur}</span>
          </div>
        </a>`
          )
          .join('')}
      </div>
    </section>
  </main>
  ${footer()}`;
}

/* ------------------------------------------------------------------ */
/* PROJE DETAY                                                        */
/* ------------------------------------------------------------------ */
export function projeDetaySayfa(slug: string): string | null {
  const p = projeBul(slug);
  if (!p) return null;
  const sira = projeler.findIndex((x) => x.slug === slug);
  const sonraki = projeler[(sira + 1) % projeler.length];
  const kat = planKatlar(slug)[0];

  return `${header('#/projeler')}
  <main id="icerik">
    <section class="detay-baslik kap">
      <a class="geri" href="#/projeler">
        <svg width="14" height="10" viewBox="0 0 14 10" aria-hidden="true"><path d="M13 5H1M5 1L1 5l4 4" stroke="currentColor" stroke-width="1.4" fill="none"/></svg>
        Tüm projeler
      </a>
      <p class="ustbaslik" style="margin-top:1.4rem">${p.tur} · Temsilî örnek</p>
      <h1>${p.ad}</h1>
      <dl class="detay-meta">
        <div><dt>Konum</dt><dd>${p.konum}</dd></div>
        <div><dt>Yıl</dt><dd>${p.yil}</dd></div>
        <div><dt>Alan</dt><dd>${p.alan}</dd></div>
        <div><dt>Kat</dt><dd>${p.kat}</dd></div>
      </dl>
    </section>

    <section class="kap">
      <div class="detay-gorsel detay-gorsel--buyuk">${projeGorsel(p)}</div>
      <p class="bilgi-notu" style="margin-top:0.7rem">
        Görsel temsilîdir — fotoğraf değil; yapının kendi plan duvarlarından üretilmiş izometrik maket görünümüdür.
      </p>
    </section>

    <section class="bolum--dar kap">
      <div class="detay-izgara">
        <div>
          <h2 style="margin-bottom:1rem">Proje açıklaması</h2>
          <p>${p.ozet}</p>
          <h3 style="margin-top:2rem;font-size:1.2rem;font-family:var(--font-metin);font-weight:500">Tasarım yaklaşımı</h3>
          <ul style="list-style:none;padding:0;margin:0.8rem 0 0;display:grid;gap:0.9rem">
            ${p.yaklasim
              .map(
                (y, i) =>
                  `<li style="display:grid;grid-template-columns:2rem 1fr;gap:0.6rem"><b style="color:var(--bronz);font-weight:500">0${
                    i + 1
                  }</b><span>${y}</span></li>`
              )
              .join('')}
          </ul>
        </div>
        <aside>
          <h3 style="font-size:1.05rem;font-family:var(--font-metin);font-weight:500;margin-bottom:0.7rem">Örnek alan ölçüleri</h3>
          <table class="olcu-tablo">
            <caption class="skip-link">Örnek alan ölçüleri tablosu</caption>
            <thead><tr><th scope="col">Mahal</th><th scope="col">Ölçü</th></tr></thead>
            <tbody>
              ${p.olculer.map((o) => `<tr><td>${o.ad}</td><td>${o.deger}</td></tr>`).join('')}
            </tbody>
          </table>

          <h3 style="font-size:1.05rem;font-family:var(--font-metin);font-weight:500;margin:2rem 0 0.7rem">Kullanılan teknikler</h3>
          <ul style="list-style:none;padding:0;margin:0;display:grid;gap:0.45rem;font-size:0.9rem">
            ${p.teknikler.map((t) => `<li style="border-bottom:1px dotted var(--cizgi);padding-bottom:0.45rem">${t}</li>`).join('')}
          </ul>
        </aside>
      </div>
    </section>

    <section class="bolum--dar kap">
      <h2 style="margin-bottom:1rem">Çalışma aşamaları</h2>
      <ul class="asama-listesi">
        ${p.asamalar
          .map(
            (a, i) =>
              `<li><b style="color:var(--bronz)">${String(i + 1).padStart(2, '0')}</b><span><b>${a.ad}</b> — ${a.aciklama}</span><em>${a.durum}</em></li>`
          )
          .join('')}
      </ul>
    </section>

    <section class="bolum--dar kap">
      <h2 style="margin-bottom:0.6rem">Temsilî plan</h2>
      <p class="ince" style="margin-bottom:1rem;font-size:0.9rem">
        Aşağıdaki plan, projenin yaklaşımını gösteren temsilî bir çizimdir (${kat.ad} · 1/50 · ölçülendirilmiş).
      </p>
      <div class="detay-gorsel">${planCiz(kat, { olcek: '1/50' })}</div>
      <div style="margin-top:1.4rem;display:flex;gap:0.8rem;flex-wrap:wrap">
        <a class="btn btn--kucuk" href="kesif.html">3D olarak keşfet</a>
        <a class="btn btn--kucuk" href="#/cizimler">Teknik çizim galerisi</a>
      </div>
    </section>

    <section class="kap" style="padding-bottom:var(--bosluk)">
      <div class="sonraki-proje">
        <div>
          <p class="ustbaslik" style="margin-bottom:0.3rem">Sonraki proje</p>
          <strong>${sonraki.ad}</strong>
        </div>
        <a class="btn btn--kucuk" href="#/proje/${sonraki.slug}">Görüntüle</a>
      </div>
    </section>
  </main>
  ${footer()}`;
}

/* ------------------------------------------------------------------ */
/* TEKNİK ÇİZİMLER                                                    */
/* ------------------------------------------------------------------ */
export function cizimlerSayfa(): string {
  const kat = modernVillaKatlar[0];
  const ust = modernVillaKatlar[1];
  const cizimler: Record<string, string> = {
    'kat-plani': planCiz(kat, { olcek: '1/50' }),
    'vaziyet-plani': vaziyetCiz(),
    kesit: kesitCiz(),
    cephe: cepheCiz(),
    olculendirme: planCiz(ust, { olcu: true, akslar: true, etiket: false, olcek: '1/50' }),
    'kapi-pencere': kapiPencereCiz(),
    'mobilya-plani': planCiz(kat, { olcu: false, akslar: false, etiket: true, olcek: '1/50' }),
    elektrik: elektrikCiz(),
  };

  return `${header('#/cizimler')}
  <main id="icerik">
    <section class="detay-baslik kap">
      <p class="ustbaslik">Teknik Çizimler</p>
      <h1>Paftalar</h1>
      <p class="ince" style="max-width:60ch;margin-top:1.1rem">
        AutoCAD tarzında hazırlanmış temsilî mimari çizim galerisi. Ölçü çizgileri, aks çemberleri,
        katman renkleri ve çizgi kalınlıklarıyla birlikte. Büyütmek için çizime dokunun.
      </p>
      <p class="bilgi-notu" style="margin-top:1.4rem">
        Bu çizimler tarayıcıda SVG olarak üretilir; gerçek bir AutoCAD (.dwg) dosyası değildir.
      </p>
    </section>

    <section class="bolum--dar kap">
      <div class="cizim-filtre" role="group" aria-label="Çizim türüne göre filtrele">
        <button class="cip" data-filtre="hepsi" aria-pressed="true">Hepsi</button>
        ${[...new Set(teknikCizimler.map((c) => c.tur))]
          .map((t) => `<button class="cip" data-filtre="${t}" aria-pressed="false">${t}</button>`)
          .join('')}
      </div>

      <div class="cizim-izgara" id="cizimIzgara">
        ${teknikCizimler
          .map(
            (c) => `<article class="cizim-kart gorunum" data-tur="${c.tur}">
          <div class="cizim-kart__tuval" data-cizim="${c.id}" data-ad="${c.ad}" tabindex="0" role="button" aria-label="${c.ad} çizimini büyüt">
            ${cizimler[c.id] ?? planCiz(kat)}
          </div>
          <div class="cizim-kart__alt">
            <div>
              <h3>${c.ad}</h3>
              <p class="ince" style="font-size:0.8rem;margin:0.2rem 0 0">${c.aciklama}</p>
            </div>
            <span>${c.tur}</span>
          </div>
        </article>`
          )
          .join('')}
      </div>
    </section>
  </main>
  <div id="buyutecKok"></div>
  ${footer()}`;
}

/* ------------------------------------------------------------------ */
/* HİZMETLER                                                          */
/* ------------------------------------------------------------------ */
export function hizmetlerSayfa(): string {
  return `${header('#/hizmetler')}
  <main id="icerik">
    <section class="detay-baslik kap">
      <p class="ustbaslik">Hizmetler</p>
      <h1>Ne yapıyoruz?</h1>
      <p class="ince" style="max-width:58ch;margin-top:1.1rem">
        Dokuz başlıkta tanımlı hizmet; tek tek alınabildiği gibi baştan sona bütün bir proje
        olarak da yürütülebilir.
      </p>
    </section>

    <section class="bolum--dar kap">
      ${hizmetler
        .map(
          (h, i) => `<div class="hizmet gorunum">
        <div style="display:flex;gap:1rem;align-items:baseline">
          <span style="color:var(--bronz);font-family:var(--font-baslik);font-size:1.1rem">${String(i + 1).padStart(
            2,
            '0'
          )}</span>
          <h3>${h.ad}</h3>
        </div>
        <p>${h.aciklama}</p>
      </div>`
        )
        .join('')}
      <div class="hizmet gorunum">
        <div style="display:flex;gap:1rem;align-items:baseline">
          <span style="color:var(--bronz);font-family:var(--font-baslik);font-size:1.1rem">09</span>
          <h3>Danışmanlık ve Proje Takibi</h3>
        </div>
        <p>Ruhsat sürecinde pafta kontrolü, şantiye uyum takibi ve tasarım kararlarında ikinci görüş.</p>
      </div>
    </section>

    <section class="bolum--koyu bolum">
      <div class="kap" style="display:grId;gap:2rem;grid-template-columns:repeat(auto-fit,minmax(260px,1fr))">
        <div>
          <p class="ustbaslik ustbaslik--acik">Çıktılar</p>
          <h2>Ne teslim ediyoruz?</h2>
        </div>
        <div>
          <ul style="list-style:none;padding:0;margin:0;display:grid;gap:0.8rem;font-size:0.92rem">
            <li>Pafta seti — plan, kesit, görünüş, detay (PDF + DWG)</li>
            <li>Mahal listesi ve metraj tablosu</li>
            <li>Malzeme ve renk föyü</li>
            <li>3D model ve sunum görselleri</li>
            <li>Revizyon gerekçe notları</li>
          </ul>
          <a class="btn btn--acik" style="margin-top:1.4rem" href="#/iletisim">Teklif isteyin</a>
        </div>
      </div>
    </section>
  </main>
  ${footer()}`;
}

/* ------------------------------------------------------------------ */
/* SÜREÇ                                                              */
/* ------------------------------------------------------------------ */
export function surecSayfa(): string {
  return `${header('#/surec')}
  <main id="icerik">
    <section class="detay-baslik kap">
      <p class="ustbaslik">Tasarım Sürecimiz</p>
      <h1>Yedi adımda<br/>çizgiden mekâna.</h1>
      <p class="ince" style="max-width:56ch;margin-top:1.1rem">
        Her adımın bir teslimi ve bir onay noktası var. Sizin onayınız olmadan bir sonraki
        adıma geçilmiyor.
      </p>
    </section>

    <section class="bolum--dar kap">
      <ol class="surec">
        ${surec
          .map((s) => `<li class="gorunum"><div><h3>${s.ad}</h3><p>${s.aciklama}</p></div></li>`)
          .join('')}
      </ol>
    </section>

    <section class="bolum--dar kap">
      <div class="detay-izgara">
        <div>
          <h2>Süre beklentisi</h2>
          <p class="ince" style="margin-top:0.8rem">
            Süreler proje kapsamına göre değişir. Aşağıdaki aralıklar temsilî bir konut projesi
            için tipik değerlerdir; kesin takvim ilk görüşmede netleşir.
          </p>
        </div>
        <table class="olcu-tablo">
          <thead><tr><th scope="col">Aşama</th><th scope="col">Tipik süre</th></tr></thead>
          <tbody>
            <tr><td>İhtiyaç analizi</td><td>3–5 gün</td></tr>
            <tr><td>Ön tasarım</td><td>7–10 gün</td></tr>
            <tr><td>Teknik çizim</td><td>10–15 gün</td></tr>
            <tr><td>3D sunum</td><td>5–7 gün</td></tr>
            <tr><td>Revizyon</td><td>3–7 gün</td></tr>
            <tr><td>Uygulama projesi</td><td>15–25 gün</td></tr>
          </tbody>
        </table>
      </div>
    </section>
  </main>
  ${footer()}`;
}

/* ------------------------------------------------------------------ */
/* İLETİŞİM                                                            */
/* ------------------------------------------------------------------ */
export function iletisimSayfa(): string {
  return `${header('#/iletisim')}
  <main id="icerik">
    <section class="detay-baslik kap">
      <p class="ustbaslik">İletişim</p>
      <h1>Projenizi anlatın.</h1>
      <p class="ince" style="max-width:56ch;margin-top:1.1rem">
        Formu doldurun; proje türü, yaklaşık alan ve ihtiyaçlarınızı birlikte değerlendirelim.
      </p>
    </section>

    <section class="bolum--dar kap">
      <div class="detay-izgara">
        <div>
          <form class="form" id="iletisimForm" novalidate>
            <div class="alan">
              <label for="ad">Ad Soyad</label>
              <input id="ad" name="ad" type="text" autocomplete="name" required placeholder="Adınız ve soyadınız" />
            </div>
            <div class="alan">
              <label for="eposta">E-posta</label>
              <input id="eposta" name="eposta" type="email" autocomplete="email" required placeholder="ornek@eposta.com" />
            </div>
            <div class="alan">
              <label for="telefon">Telefon (opsiyonel)</label>
              <input id="telefon" name="telefon" type="tel" autocomplete="tel" placeholder="05xx xxx xx xx" />
            </div>
            <div class="alan">
              <label for="tur">Proje türü</label>
              <select id="tur" name="tur" required>
                <option value="">Seçiniz</option>
                <option>Konut / Villa</option>
                <option>İç Mimari</option>
                <option>Ticari / Ofis</option>
                <option>Otel / Konaklama</option>
                <option>Renovasyon / Tadilat</option>
                <option>Cephe Tasarımı</option>
                <option>Diğer</option>
              </select>
            </div>
            <div class="alan">
              <label for="alan">Tahmini alan (m²)</label>
              <input id="alan" name="alan" type="number" min="10" max="100000" step="1" placeholder="Örn. 240" />
            </div>
            <div class="alan">
              <label for="konum">Proje konumu</label>
              <input id="konum" name="konum" type="text" placeholder="İl / ilçe" />
            </div>
            <div class="alan alan--tam">
              <label for="aciklama">Açıklama</label>
              <textarea id="aciklama" name="aciklama" required placeholder="İhtiyaçlarınız, arsa/yapı durumu, hedeflediğiniz takvim…" minlength="20"></textarea>
              <small>En az 20 karakter.</small>
            </div>
            <div class="alan alan--tam">
              <label for="dosya">Dosya yükleme alanı (demo)</label>
              <input id="dosya" name="dosya" type="file" accept=".pdf,.dwg,.dxf,.jpg,.jpeg,.png" />
              <small>Gerçek yükleme yapılmaz — bu alan arayüz demosudur. Kabul edilen türler: PDF, DWG, DXF, JPG, PNG.</small>
            </div>
            <div class="alan alan--tam">
              <label for="onay" style="display:flex;gap:0.6rem;align-items:flex-start;text-transform:none;letter-spacing:0;font-size:0.85rem;color:var(--antrasit)">
                <input id="onay" name="onay" type="checkbox" required style="width:20px;height:20px;min-height:20px;margin-top:2px" />
                <span>Bilgilerimin yalnızca bu talep için işlenmesini onaylıyorum. (Demo formu)</span>
              </label>
            </div>
            <div class="alan alan--tam">
              <button class="btn btn--dolu" type="submit" style="justify-self:start">Talebi Gönder</button>
            </div>
          </form>
          <div id="formSonuc" role="status" aria-live="polite"></div>
          <div class="uyari-kutu">
            <strong>Bu form bir demodur.</strong> Gerçek bir sunucuya bağlı değildir; gönderdiğiniz
            bilgi hiçbir yere iletilmez, yalnızca tarayıcınızda doğrulanır. Gerçek iletişim için
            <a href="mailto:${iletisimBilgi.eposta}" style="text-decoration:underline">${iletisimBilgi.eposta}</a>
            adresini kullanın.
          </div>
        </div>

        <aside>
          <h3 style="font-size:0.68rem;letter-spacing:0.22em;text-transform:uppercase;color:var(--bronz);font-family:var(--font-metin);margin-bottom:0.9rem">Stüdyo</h3>
          <ul style="list-style:none;padding:0;margin:0;display:grid;gap:0.8rem;font-size:0.92rem">
            <li>${iletisimBilgi.adres}</li>
            <li><a href="mailto:${iletisimBilgi.eposta}">${iletisimBilgi.eposta}</a></li>
            <li>${iletisimBilgi.telefon}</li>
            <li class="ince">${iletisimBilgi.saatler}</li>
          </ul>
          <p class="bilgi-notu" style="margin-top:1.4rem">İletişim bilgileri de temsilîdir.</p>
        </aside>
      </div>
    </section>
  </main>
  ${footer()}`;
}

export { projeGorsel };
