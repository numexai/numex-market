/**
 * Router + etkileşim katmanı.
 * Hash tabanlı yönlendirme: #/proje/modern-villa gibi derin bağlantılar çalışır.
 */

import './style.css';
import {
  anaSayfa,
  hakkimizdaSayfa,
  projelerSayfa,
  projeDetaySayfa,
  cizimlerSayfa,
  hizmetlerSayfa,
  surecSayfa,
  iletisimSayfa,
} from './pages';
import { MimariSahne, katEkle, catiEkle, type MalzemeSecim, type Gorunum } from './scene/motor';
import { modernVillaKatlar } from './scene/planData';
import { planCiz } from './draw/svgPlan';

const kok = document.getElementById('app')!;
let heroSahne: MimariSahne | null = null;
let karsilastirSahne: MimariSahne | null = null;

/* ------------------------------------------------------------------ */
/* YÖNLENDİRME                                                        */
/* ------------------------------------------------------------------ */
function yonlendir(): void {
  const hash = window.location.hash || '#/';
  const temizle = () => {
    heroSahne?.yokEt();
    heroSahne = null;
    karsilastirSahne?.yokEt();
    karsilastirSahne = null;
  };

  const [_, rota, parametre] = hash.split('/');

  let html = '';
  if (rota === undefined || rota === '') html = anaSayfa();
  else if (rota === 'hakkimizda') html = hakkimizdaSayfa();
  else if (rota === 'projeler') html = projelerSayfa();
  else if (rota === 'proje' && parametre) {
    html = projeDetaySayfa(parametre) ?? bulunamadi();
  } else if (rota === 'cizimler') html = cizimlerSayfa();
  else if (rota === 'hizmetler') html = hizmetlerSayfa();
  else if (rota === 'surec') html = surecSayfa();
  else if (rota === 'iletisim') html = iletisimSayfa();
  else html = bulunamadi();

  temizle();
  kok.innerHTML = html;
  window.scrollTo(0, 0);

  baglantilariKur();
  gorunumAnimasyonu();

  if (rota === undefined || rota === '') {
    heroKur();
    karsilastirKur();
  }
  document.title =
    rota === undefined || rota === ''
      ? 'ATELIER MİMARLIK | Mimari Tasarım ve Teknik Çizim'
      : `${baslikBul(rota, parametre)} | ATELIER MİMARLIK`;
}

function baslikBul(rota: string, param?: string): string {
  const harita: Record<string, string> = {
    hakkimizda: 'Hakkımızda',
    projeler: 'Projeler',
    cizimler: 'Teknik Çizimler',
    hizmetler: 'Hizmetler',
    surec: 'Tasarım Sürecimiz',
    iletisim: 'İletişim',
  };
  if (rota === 'proje' && param) {
    const ad = param
      .split('-')
      .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
      .join(' ');
    return ad;
  }
  return harita[rota] ?? 'Sayfa';
}

function bulunamadi(): string {
  return `<main id="icerik" class="kap" style="padding-top:8rem;min-height:60vh">
    <p class="ustbaslik">404</p>
    <h1>Aradığınız sayfa bulunamadı.</h1>
    <p class="ince" style="margin-top:1rem">Bağlantı taşınmış ya da yanlış yazılmış olabilir.</p>
    <a class="btn" style="margin-top:1.5rem" href="#/">Ana sayfaya dön</a>
  </main>`;
}

/* ------------------------------------------------------------------ */
/* ORTAK OLAYLAR                                                      */
/* ------------------------------------------------------------------ */
function baglantilariKur(): void {
  // üst menü kaydırma efekti
  const ust = document.getElementById('ust');
  const kaydir = () => {
    if (!ust) return;
    ust.classList.toggle('ust--kaydi', window.scrollY > 40);
  };
  kaydir();
  window.removeEventListener('scroll', kaydir);
  window.addEventListener('scroll', kaydir, { passive: true });

  // mobil menü
  const acBtn = document.getElementById('menuAc');
  const menu = document.getElementById('anaMenu');
  if (acBtn && menu) {
    acBtn.addEventListener('click', () => {
      const acik = menu.classList.toggle('menu--acik');
      acBtn.setAttribute('aria-expanded', String(acik));
      acBtn.setAttribute('aria-label', acik ? 'Menüyü kapat' : 'Menüyü aç');
    });
    menu.querySelectorAll('a').forEach((a) =>
      a.addEventListener('click', () => {
        menu.classList.remove('menu--acik');
        acBtn.setAttribute('aria-expanded', 'false');
      })
    );
  }
}

function gorunumAnimasyonu(): void {
  const ogeler = document.querySelectorAll('.gorunum');
  if (!('IntersectionObserver' in window)) {
    ogeler.forEach((o) => o.classList.add('gorunum--girdi'));
    return;
  }
  const io = new IntersectionObserver(
    (girisler) => {
      girisler.forEach((g) => {
        if (g.isIntersecting) {
          g.target.classList.add('gorunum--girdi');
          io.unobserve(g.target);
        }
      });
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.08 }
  );
  ogeler.forEach((o) => io.observe(o));
}

/* ------------------------------------------------------------------ */
/* HERO 3D ARKA PLAN                                                  */
/* ------------------------------------------------------------------ */
function heroKur(): void {
  const kap = document.getElementById('heroTuval');
  if (!kap) return;
  const dusuk = window.matchMedia('(max-width: 760px)').matches;
  try {
    heroSahne = new MimariSahne({ kap, arka: 0x1b1a18, golge: !dusuk, don: true });
    const mat = heroSahne.malzemeler();
    for (let i = 0; i < modernVillaKatlar.length; i++) {
      const kat = modernVillaKatlar[i];
      heroSahne.ekle(katEkle(kat, mat, 'krem-siva', i * 3.05, { doseme: true }));
    }
    // NUMEX-DÜZELTME (2026-10-27, kullanıcı: "çatının altı hâlâ açık"): hero sahnesi katEkle()
    // ile kuruluyordu ama ÇATI hiç eklenmiyordu — ekranda çatısız, üstü açık bir kütle
    // görünüyordu (ölçüm: sahne 24×6.34×24, bina 6.32 → çatı yüksekliğe dahil değil).
    // Çatı artık motorda (catiEkle) ve iki sahne de aynı geometriyi kullanıyor.
    const toplamYuk = modernVillaKatlar.length * 3.05;
    heroSahne.ekle(catiEkle(modernVillaKatlar[0], mat, 'krem-siva', toplamYuk));
    // NUMEX-DÜZELTME (2026-10-26): mobilde sahne yukarıda kalıp bina kadrajın dışına çıkıyordu;
    // dar ekranda kamera daha uzağa alınıp hedef bina merkezine çekildi.
    const dar = window.matchMedia('(max-width: 760px)').matches;
    heroSahne.kamera.position.set(dar ? -26 : -22, dar ? 18 : 13, dar ? 40 : 26);
    heroSahne.kontroller.target.set(7, dar ? 4.2 : 3.2, 5.5);
    heroSahne.kontroller.autoRotate = true;
    heroSahne.kontroller.enableZoom = false;
    heroSahne.kontroller.enablePan = false;
    heroSahne.gece(true);
    window.addEventListener('resize', () => heroSahne?.boyutla());
  } catch (e) {
    // WebGL yoksa sessizce degrade: perde rengi kalır
    console.warn('3D arka plan başlatılamadı:', e);
  }
}

/* ------------------------------------------------------------------ */
/* 2D / 3D KARŞILAŞTIRMA                                              */
/* ------------------------------------------------------------------ */
function karsilastirKur(): void {
  const root = document.getElementById('karsilastirKok');
  if (!root) return;

  let aktifKat = 0;
  let duvarlarAcik = true;
  let gorunum: Gorunum = 'dis';
  let cephe: MalzemeSecim = 'krem-siva';

  const panel3d = root.querySelector<HTMLElement>('#k3d')!;
  const panel2d = root.querySelector<HTMLElement>('#k2d')!;

  try {
    karsilastirSahne = new MimariSahne({ kap: panel3d, arka: 0x24221f, golge: true });
    karsilastirSahne.kontroller.target.set(7, 1.5, 5.5);
    karsilastirSahne.kameraAyarla('dis');
    window.addEventListener('resize', () => karsilastirSahne?.boyutla());
  } catch (e) {
    panel3d.innerHTML =
      '<p style="padding:2rem;color:#c9c1b4;font-size:0.85rem">Tarayıcınız WebGL desteklemiyor; 3D görünüm kullanılamıyor. Soldaki plan görüntülenmeye devam eder.</p>';
    console.warn('Karşılaştırma sahnesi başlatılamadı:', e);
  }

  const yenile = () => {
    const kat = modernVillaKatlar[aktifKat];
    panel2d.innerHTML = planCiz(kat, { olcu: false, akslar: true, olcek: '1/100' });

    if (!karsilastirSahne) return;
    karsilastirSahne.bosalt();
    const mat = karsilastirSahne.malzemeler();
    if (duvarlarAcik) {
      karsilastirSahne.ekle(katEkle(kat, mat, cephe, 0, { icDuvar: true }));
    } else {
      // yalnızca döşeme + mobilya
      karsilastirSahne.ekle(katEkle(kat, mat, cephe, 0, { icDuvar: false }));
    }
    karsilastirSahne.kameraAyarla(gorunum);
  };

  root.querySelectorAll<HTMLButtonElement>('[data-kat]').forEach((b) => {
    b.addEventListener('click', () => {
      aktifKat = Number(b.dataset.kat);
      root.querySelectorAll('[data-kat]').forEach((x) =>
        x.setAttribute('aria-pressed', String(x === b))
      );
      yenile();
    });
  });

  const duvarBtn = root.querySelector<HTMLButtonElement>('#duvarBtn')!;
  duvarBtn?.addEventListener('click', () => {
    duvarlarAcik = !duvarlarAcik;
    duvarBtn.setAttribute('aria-pressed', String(!duvarlarAcik));
    duvarBtn.textContent = duvarlarAcik ? 'Duvarları gizle' : 'Duvarları göster';
    yenile();
  });

  root.querySelectorAll<HTMLButtonElement>('[data-gorunum]').forEach((b) => {
    b.addEventListener('click', () => {
      gorunum = b.dataset.gorunum as Gorunum;
      root.querySelectorAll('[data-gorunum]').forEach((x) =>
        x.setAttribute('aria-pressed', String(x === b))
      );
      karsilastirSahne?.kameraAyarla(gorunum);
    });
  });

  root.querySelectorAll<HTMLButtonElement>('[data-cephe]').forEach((b) => {
    b.addEventListener('click', () => {
      cephe = b.dataset.cephe as MalzemeSecim;
      root.querySelectorAll('[data-cephe]').forEach((x) =>
        x.setAttribute('aria-pressed', String(x === b))
      );
      yenile();
    });
  });

  yenile();
}

/* ------------------------------------------------------------------ */
/* ÇİZİM GALERİSİ                                                     */
/* ------------------------------------------------------------------ */
function cizimGalerisiKur(): void {
  const izgara = document.getElementById('cizimIzgara');
  if (!izgara) return;

  izgara.querySelectorAll<HTMLButtonElement>('.cip').forEach(() => void 0);

  document.querySelectorAll<HTMLButtonElement>('.cizim-filtre .cip').forEach((cip) => {
    cip.addEventListener('click', () => {
      const filtre = cip.dataset.filtre ?? 'hepsi';
      document
        .querySelectorAll('.cizim-filtre .cip')
        .forEach((c) => c.setAttribute('aria-pressed', String(c === cip)));
      izgara.querySelectorAll<HTMLElement>('.cizim-kart').forEach((kart) => {
        const uygun = filtre === 'hepsi' || kart.dataset.tur === filtre;
        kart.style.display = uygun ? '' : 'none';
      });
    });
  });

  const ac = (tuval: HTMLElement) => {
    const kokEl = document.getElementById('buyutecKok');
    if (!kokEl) return;
    const ad = tuval.dataset.ad ?? 'Çizim';
    kokEl.innerHTML = `<div class="buyutec" role="dialog" aria-modal="true" aria-label="${ad} büyük görünüm">
      <button class="buyutec__kapat" aria-label="Kapat">✕</button>
      <div class="buyutec__ic">${tuval.innerHTML}</div>
    </div>`;
    const kap = kokEl.querySelector('.buyutec')!;
    const kapat = () => {
      kokEl.innerHTML = '';
      document.removeEventListener('keydown', escKapat);
      (tuval as HTMLElement).focus();
    };
    const escKapat = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape') kapat();
    };
    kap.addEventListener('click', (ev) => {
      if (ev.target === kap) kapat();
    });
    kokEl.querySelector('.buyutec__kapat')!.addEventListener('click', kapat);
    document.addEventListener('keydown', escKapat);
    (kokEl.querySelector('.buyutec__kapat') as HTMLElement).focus();
  };

  izgara.querySelectorAll<HTMLElement>('.cizim-kart__tuval').forEach((t) => {
    t.addEventListener('click', () => ac(t));
    t.addEventListener('keydown', (ev) => {
      if (ev.key === 'Enter' || ev.key === ' ') {
        ev.preventDefault();
        ac(t);
      }
    });
  });
}

/* ------------------------------------------------------------------ */
/* DEMO FORM                                                          */
/* ------------------------------------------------------------------ */
function formKur(): void {
  const form = document.getElementById('iletisimForm') as HTMLFormElement | null;
  if (!form) return;
  const sonuc = document.getElementById('formSonuc')!;

  form.addEventListener('submit', (ev) => {
    ev.preventDefault();
    const gecerli = form.checkValidity();
    if (!gecerli) {
      sonuc.innerHTML = `<div class="uyari-kutu" role="alert" style="border-left-color:#b4543f">
        Lütfen zorunlu alanları doldurun. Açıklama en az 20 karakter olmalıdır.
      </div>`;
      const ilk = form.querySelector<HTMLElement>(':invalid');
      ilk?.focus();
      return;
    }
    sonuc.innerHTML = `<div class="uyari-kutu" role="status" style="border-left-color:#5b7f5b">
      <strong>Demo:</strong> Talebiniz tarayıcıda doğrulandı. Bu form gerçek bir sunucuya bağlı olmadığı için
      hiçbir yere gönderilmedi. Gerçek iletişim için e-posta adresimizi kullanabilirsiniz.
    </div>`;
    form.reset();
  });
}

/* ------------------------------------------------------------------ */
/* BAŞLAT                                                             */
/* ------------------------------------------------------------------ */
function baslat(): void {
  yonlendir();
  window.addEventListener('hashchange', () => {
    yonlendir();
    cizimGalerisiKur();
    formKur();
  });
  // ilk yüklemede sayfaya özgü kurulumlar
  cizimGalerisiKur();
  formKur();
}

baslat();

// dışa açık yardımcı (test/doğrulama için)
declare global {
  interface Window {
    atelierDurum?: () => { rota: string; baslik: string };
  }
}
window.atelierDurum = () => ({
  rota: window.location.hash || '#/',
  baslik: document.title,
});
