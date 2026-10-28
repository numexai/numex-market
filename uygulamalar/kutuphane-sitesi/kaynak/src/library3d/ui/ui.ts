import { CATEGORIES, SHELVES, FLOOR_LABELS, type ShelfMeta } from '../data/catalog';
import { injectStyles } from './styles';

/**
 * Kütüphane arayüzü — DOM kurulumu ve olay bağlama.
 *
 * Sorumluluk ayrımı: bu sınıf HİÇBİR three.js nesnesine dokunmaz; yalnız
 * DOM üretir ve callback çağırır. Sahne mantığı library.ts'te kalır.
 */

export interface UIHandlers {
  onCameraMode: (mode: 'exterior' | 'interior') => void;
  onFloor: (floor: number) => void;
  onRoofToggle: (visible: boolean) => void;
  onHour: (hour: number) => void;
  onReset: () => void;
}

/** Bilgi katmanı sekmeleri — kullanıcı şartındaki 5 bölüm. */
type InfoTab = 'about' | 'services' | 'collections' | 'visit' | 'events';

export class LibraryUI {
  private root: HTMLElement;
  private fpsValue!: HTMLElement;
  private fpsMin!: HTMLElement;
  private fpsChip!: HTMLElement;
  private drawValue!: HTMLElement;
  private triValue!: HTMLElement;
  private hourValue!: HTMLElement;
  private card!: HTMLElement;
  private cardBody!: HTMLElement;
  private helpBar!: HTMLElement;
  private loading!: HTMLElement;
  private loadingBar!: HTMLElement;
  private loadingStep!: HTMLElement;

  private modeButtons: HTMLButtonElement[] = [];
  private floorButtons: HTMLButtonElement[] = [];
  private infoEl!: HTMLElement;
  private infoBody!: HTMLElement;

  constructor(private handlers: UIHandlers) {
    injectStyles();
    this.root = document.createElement('div');
    this.root.id = 'nx-lib-ui';
    document.body.appendChild(this.root);
    this.build();
  }

  private build(): void {
    /* ---------------- ÜST BAR ---------------- */
    const top = document.createElement('header');
    top.className = 'nx-lib-top';
    top.innerHTML = `
      <div class="nx-lib-brand">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true">
          <path d="M3 4.5h5v15H3zM10 4.5h4v15h-4z"/>
          <path d="M16.2 5.2l4.3 1.1-3.6 13.4-4.3-1.1z"/>
        </svg>
        <div>
          <h1>ATAŞEHİR <span>KÜTÜPHANESİ</span> 3D</h1>
          <p>Dijital kütüphane · 32 × 22 m · 2 kat · 12 kitaplık</p>
        </div>
      </div>
      <div class="nx-lib-stats" id="nx-stats">
        <div class="nx-lib-chip" id="nx-fps-chip" title="Kare süresinden ölçülen gerçek FPS">
          <span class="dot"></span><b id="nx-fps">--</b> FPS
        </div>
        <div class="nx-lib-chip nx-lib-mono opt" title="Çizim çağrısı / üçgen">
          <span id="nx-draw">--</span> call · <span id="nx-tri">--</span> tri
        </div>
        <div class="nx-lib-chip nx-lib-mono opt" title="Son 20 örneğin en düşük FPS değeri">
          min <b id="nx-fps-min">--</b>
        </div>
      </div>
    `;
    this.root.appendChild(top);

    /* ---------------- SOL PANEL ---------------- */
    const panel = document.createElement('aside');
    panel.className = 'nx-lib-panel';
    panel.innerHTML = `
      <div class="nx-lib-sec">
        <h3>Kamera Modu</h3>
        <div class="nx-lib-btn-row" id="nx-cam-row">
          <button class="nx-lib-btn active" data-cam="exterior">Dış Mekân</button>
          <button class="nx-lib-btn" data-cam="interior">İç Mekân</button>
        </div>
      </div>

      <div class="nx-lib-sec">
        <h3>Katlar</h3>
        <div class="nx-lib-btn-row" id="nx-floor-row">
          <button class="nx-lib-btn active" data-floor="0">Zemin Kat</button>
          <button class="nx-lib-btn" data-floor="1">Birinci Kat</button>
        </div>
        <div class="nx-lib-btn-row" style="margin-top:6px">
          <button class="nx-lib-btn" id="nx-roof">Çatıyı Gizle</button>
        </div>
      </div>

      <div class="nx-lib-sec">
        <h3>Gün / Gece</h3>
        <div class="nx-lib-slider-wrap">
          <div class="nx-lib-slider-head"><span>Saat</span><b id="nx-hour" class="nx-lib-mono">17:30</b></div>
          <input type="range" class="nx-lib-slider" id="nx-hour-slider" min="0" max="24" step="0.1" value="17.5" aria-label="Saat" />
        </div>
        <div class="nx-lib-btn-row" style="margin-top:8px">
          <button class="nx-lib-btn" data-hour="8">Sabah</button>
          <button class="nx-lib-btn" data-hour="17.6">Akşam</button>
          <button class="nx-lib-btn" data-hour="22">Gece</button>
        </div>
      </div>

      <div class="nx-lib-sec">
        <h3>Koleksiyonlar</h3>
        <div class="nx-lib-legend" id="nx-legend"></div>
      </div>

      <div class="nx-lib-sec">
        <h3>Sahne</h3>
        <div class="nx-lib-btn-row">
          <button class="nx-lib-btn" id="nx-reset">Görünümü Sıfırla</button>
        </div>
      </div>
    `;
    this.root.appendChild(panel);

    /* ---------------- BİLGİ KATMANI (5 bölüm) ----------------
     * Kullanıcı şartı: Hakkında · Hizmetler · Koleksiyonlar · Ziyaret · Etkinlikler.
     * Sahnenin ÜSTÜNDE açılır, kapanınca sahne tam genişliğe döner — 3D ana
     * odak kalır. Adres/telefon/saatler TEMSİLİDİR (istekte "temsili olabilir"). */
    const info = document.createElement('section');
    info.className = 'nx-lib-info';
    info.id = 'nx-info';
    info.innerHTML = `
      <div class="nx-lib-info-head">
        <nav class="nx-lib-info-tabs" id="nx-info-tabs">
          <button class="nx-lib-btn active" data-info="about">Hakkında</button>
          <button class="nx-lib-btn" data-info="services">Hizmetler</button>
          <button class="nx-lib-btn" data-info="collections">Koleksiyonlar</button>
          <button class="nx-lib-btn" data-info="visit">Ziyaret</button>
          <button class="nx-lib-btn" data-info="events">Etkinlikler</button>
        </nav>
        <button class="nx-lib-close" id="nx-info-close" aria-label="Kapat">×</button>
      </div>
      <div class="nx-lib-info-body" id="nx-info-body"></div>
    `;
    this.root.appendChild(info);
    this.infoEl = info;
    this.infoBody = info.querySelector('#nx-info-body') as HTMLElement;

    const infoRow = document.createElement('div');
    infoRow.className = 'nx-lib-info-launch';
    infoRow.innerHTML = `<button class="nx-lib-btn nx-lib-info-open" id="nx-info-open">Kütüphane Bilgileri</button>`;
    this.root.appendChild(infoRow);

    const closeBtn = info.querySelector('#nx-info-close') as HTMLElement;
    closeBtn.addEventListener('click', () => this.hideInfo());
    info.querySelector('#nx-info-tabs')?.addEventListener('click', (ev) => {
      const btn = (ev.target as HTMLElement).closest('button[data-info]') as HTMLElement | null;
      if (!btn) return;
      info.querySelectorAll('#nx-info-tabs .nx-lib-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      this.showInfo(btn.dataset.info as InfoTab);
    });
    (document.getElementById('nx-info-open') as HTMLElement).addEventListener('click', () => {
      this.showInfo('about');
    });

    /* ---------------- SAĞ SEÇİM KARTI ---------------- */
    const card = document.createElement('div');
    card.className = 'nx-lib-card';
    card.innerHTML = `
      <button class="nx-lib-close" id="nx-card-close" aria-label="Kapat">×</button>
      <div id="nx-card-body"></div>
    `;
    this.root.appendChild(card);
    this.card = card;
    this.cardBody = card.querySelector('#nx-card-body') as HTMLElement;

    /* ---------------- ALT İPUCU ---------------- */
    const help = document.createElement('div');
    help.className = 'nx-lib-help';
    help.id = 'nx-help';
    help.innerHTML = `
      <span><kbd>Fare</kbd> döndür · <kbd>Tekerlek</kbd> yaklaş</span>
      <span style="opacity:.35">|</span>
      <span><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> yürü · <kbd>Shift</kbd> koş · <kbd>Q</kbd>/<kbd>E</kbd> dön</span>
      <span style="opacity:.35">|</span>
      <span>Kitaplığa tıkla → kategori</span>
    `;
    this.root.appendChild(help);
    this.helpBar = help;

    /* ---------------- YÜKLEME ---------------- */
    const loading = document.createElement('div');
    loading.className = 'nx-lib-loading';
    loading.innerHTML = `
      <h2>ATAŞEHİR KÜTÜPHANESİ 3D</h2>
      <div class="nx-lib-bar"><i id="nx-load-fill"></i></div>
      <small id="nx-load-step">Sahne hazırlanıyor…</small>
    `;
    this.root.appendChild(loading);
    this.loading = loading;
    this.loadingBar = loading.querySelector('#nx-load-fill') as HTMLElement;
    this.loadingStep = loading.querySelector('#nx-load-step') as HTMLElement;

    /* ---------------- ÖNBELLEK ---------------- */
    this.fpsValue = this.root.querySelector('#nx-fps') as HTMLElement;
    this.fpsMin = this.root.querySelector('#nx-fps-min') as HTMLElement;
    this.fpsChip = this.root.querySelector('#nx-fps-chip') as HTMLElement;
    this.drawValue = this.root.querySelector('#nx-draw') as HTMLElement;
    this.triValue = this.root.querySelector('#nx-tri') as HTMLElement;
    this.hourValue = this.root.querySelector('#nx-hour') as HTMLElement;

    /* ---------------- OLAYLAR ---------------- */
    this.bindEvents();
    this.buildLegend();
  }

  private bindEvents(): void {
    // Kamera modu
    this.modeButtons = Array.from(this.root.querySelectorAll('[data-cam]')) as HTMLButtonElement[];
    for (const b of this.modeButtons) {
      b.addEventListener('click', () => {
        const m = b.dataset.cam as 'exterior' | 'interior';
        this.setCameraMode(m);
        this.handlers.onCameraMode(m);
      });
    }

    // Kat
    this.floorButtons = Array.from(this.root.querySelectorAll('[data-floor]')) as HTMLButtonElement[];
    for (const b of this.floorButtons) {
      b.addEventListener('click', () => {
        const f = Number(b.dataset.floor);
        this.setFloorActive(f);
        this.handlers.onFloor(f);
      });
    }

    // Çatı
    const roofBtn = this.root.querySelector('#nx-roof') as HTMLButtonElement;
    roofBtn.addEventListener('click', () => {
      const hidden = roofBtn.classList.toggle('active');
      roofBtn.textContent = hidden ? 'Çatıyı Göster' : 'Çatıyı Gizle';
      this.handlers.onRoofToggle(!hidden);
    });

    // Saat
    const slider = this.root.querySelector('#nx-hour-slider') as HTMLInputElement;
    slider.addEventListener('input', () => {
      const h = Number(slider.value);
      this.setHourLabel(h);
      this.handlers.onHour(h);
    });
    for (const b of Array.from(this.root.querySelectorAll('[data-hour]')) as HTMLButtonElement[]) {
      b.addEventListener('click', () => {
        const h = Number(b.dataset.hour);
        slider.value = String(h);
        this.setHourLabel(h);
        this.handlers.onHour(h);
      });
    }

    // Sıfırla
    (this.root.querySelector('#nx-reset') as HTMLButtonElement)
      .addEventListener('click', () => this.handlers.onReset());

    // Kartı kapat
    (this.root.querySelector('#nx-card-close') as HTMLButtonElement)
      .addEventListener('click', () => this.hideCard());
  }

  private buildLegend(): void {
    const legend = this.root.querySelector('#nx-legend') as HTMLElement;
    for (const c of CATEGORIES) {
      const row = document.createElement('div');
      row.className = 'nx-lib-leg';
      const hex = `#${c.color.toString(16).padStart(6, '0')}`;
      row.innerHTML = `<i style="background:${hex}"></i><span>${c.label}</span>`;
      legend.appendChild(row);
    }
  }

  /* ---------------- GENEL API ---------------- */

  setCameraMode(mode: 'exterior' | 'interior'): void {
    for (const b of this.modeButtons) b.classList.toggle('active', b.dataset.cam === mode);
    this.helpBar.innerHTML = mode === 'interior'
      ? `<span><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> yürü · <kbd>Fare</kbd> bak · <kbd>Shift</kbd> koş · <kbd>Q</kbd>/<kbd>E</kbd> dön · <kbd>Esc</kbd> fareyi bırak</span>`
      : `<span><kbd>Fare</kbd> 360° döndür · <kbd>Tekerlek</kbd> yaklaş · <kbd>Sağ tık</kbd> kaydır · Kitaplığa tıkla</span>`;
  }

  setFloorActive(floor: number): void {
    for (const b of this.floorButtons) b.classList.toggle('active', Number(b.dataset.floor) === floor);
  }

  setHourLabel(hour: number): void {
    const hh = Math.floor(hour) % 24;
    const mm = Math.floor((hour - Math.floor(hour)) * 60);
    this.hourValue.textContent = `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
  }

  updateFps(fps: number, drawCalls: number, triangles: number, minFps = 0): void {
    this.fpsValue.textContent = fps.toFixed(0);
    this.fpsMin.textContent = minFps > 0 ? minFps.toFixed(0) : '--';
    this.drawValue.textContent = String(drawCalls);
    this.triValue.textContent = triangles > 1000
      ? `${(triangles / 1000).toFixed(0)}k`
      : String(triangles);

    this.fpsChip.classList.remove('warn', 'bad');
    if (fps < 30) this.fpsChip.classList.add('bad');
    else if (fps < 50) this.fpsChip.classList.add('warn');
  }

  showCard(meta: ShelfMeta): void {
    const hex = `#${meta.categoryColor.toString(16).padStart(6, '0')}`;
    this.cardBody.innerHTML = `
      <span class="nx-lib-cat" style="background:${hex}22;color:${hex}">
        <i style="width:7px;height:7px;border-radius:50%;background:${hex};display:inline-block"></i>
        ${meta.categoryLabel}
      </span>
      <h2>${meta.label}</h2>
      <p>${meta.desc}</p>
      <div class="nx-lib-rows">
        <div class="nx-lib-row"><span>Raf kodu</span><b>${meta.id}</b></div>
        <div class="nx-lib-row"><span>Kat</span><b>${FLOOR_LABELS[meta.floor]}</b></div>
        <div class="nx-lib-row"><span>Dewey aralığı</span><b>${meta.range}</b></div>
        <div class="nx-lib-row"><span>Kitap</span><b>${meta.books} adet</b></div>
        <div class="nx-lib-row"><span>Bölme</span><b>${meta.compartments}</b></div>
      </div>
    `;
    this.card.classList.add('show');
  }

  /**
   * Bilgi katmanını açar. İçerik kullanıcının şartındaki 5 bölümü karşılar;
   * adres, telefon ve saatler TEMSİLİDİR (istekte "temsili olabilir" dendi).
   */
  showInfo(tab: InfoTab): void {
    const shelfTotal = SHELVES.length;
    const content: Record<InfoTab, string> = {
      about: `
        <h2>Ataşehir Kütüphanesi</h2>
        <p class="nx-lib-lead">Mahallenin okuma salonu: iki katlı, cam cepheli, gün ışığını
        içeri alan bir halk kütüphanesi. ${shelfTotal} kitaplıkta sekiz binden fazla kitap,
        sessiz çalışma alanı, çocuk bölümü ve dijital erişim noktaları bir arada.</p>
        <p>Bu sayfa kütüphanenin <b>dijital vitrini</b>: binayı dışarıdan gezebilir,
        içine girip rafların arasında dolaşabilir, bir kitaplığa tıklayıp hangi
        koleksiyona ait olduğunu okuyabilirsiniz.</p>
        <dl class="nx-lib-facts">
          <div><dt>Bina</dt><dd>32 × 22 m · 2 kat</dd></div>
          <div><dt>Kitaplık</dt><dd>${shelfTotal}</dd></div>
          <div><dt>Kitap</dt><dd>8.573</dd></div>
          <div><dt>Okuma yeri</dt><dd>78 kişi</dd></div>
        </dl>`,
      services: `
        <h2>Hizmetler</h2>
        <ul class="nx-lib-list">
          <li><b>Sessiz çalışma alanı</b> — zemin katta pencere boyunca uzanan okuma masaları,
              her masada okuma lambası ve priz.</li>
          <li><b>Çocuk bölümü</b> — alt raf yüksekliğinde, renkli sırtlı kitaplarla ayrılmış
              okuma köşesi ve minderler.</li>
          <li><b>Referans kaynaklar</b> — ansiklopedi, sözlük ve atlas rafları; yerinde kullanım.</li>
          <li><b>Dijital erişim</b> — üst kattaki bilgisayar alanında 6 istasyon, katalog tarama
              ve e-kitap erişimi.</li>
          <li><b>Etkinlik alanı</b> — üst kat balkonunun arkasında, seminer ve atölye için
              esnek oturma düzeni.</li>
        </ul>`,
      collections: `
        <h2>Koleksiyonlar</h2>
        <p class="nx-lib-lead">Sahnede her kitaplığa tıklayarak hangi kategoriye ait olduğunu
        ve kaç kitap barındırdığını görebilirsiniz.</p>
        <ul class="nx-lib-list">
          <li><b>Edebiyat</b> — roman, öykü, şiir.</li>
          <li><b>Tarih</b> — Osmanlı'dan Cumhuriyet'e kronolojik raflar.</li>
          <li><b>Bilim &amp; Teknoloji</b> — temel bilimler, mühendislik, bilişim.</li>
          <li><b>Çocuk Kitapları</b> — anasınıfından ortaokula göre ayrılmış.</li>
          <li><b>Sanat &amp; Tasarım</b> — görsel sanatlar, mimarlık, grafik.</li>
          <li><b>Referans</b> — ansiklopedi, sözlük, atlas, yıllık.</li>
        </ul>`,
      visit: `
        <h2>Ziyaret Bilgisi</h2>
        <dl class="nx-lib-facts">
          <div><dt>Hafta içi</dt><dd>09.00 – 21.00</dd></div>
          <div><dt>Cumartesi</dt><dd>10.00 – 18.00</dd></div>
          <div><dt>Pazar</dt><dd>Kapalı</dd></div>
        </dl>
        <p><b>Adres</b> (temsilî)<br>Ataşehir Merkez, Kütüphane Caddesi No: 1, 34746 İstanbul</p>
        <p><b>İletişim</b> (temsilî)<br>Telefon: 0216 000 00 00<br>E-posta: iletisim@atasehirkutuphanesi.example</p>
        <p class="nx-lib-note">Adres, telefon ve saatler bu tanıtım için temsilîdir;
        gerçek bilgi için kütüphanenin resmî kanallarını kontrol edin.</p>`,
      events: `
        <h2>Etkinlikler</h2>
        <ul class="nx-lib-list">
          <li><b>Yazar buluşması</b> — her ayın ikinci cumartesi, üst kat etkinlik alanı.</li>
          <li><b>Çocuk okuma saati</b> — her çarşamba 16.00, çocuk bölümü.</li>
          <li><b>Atölye</b> — iki haftada bir perşembe: yazı atölyesi ve kitap tamiri.</li>
          <li><b>Seminer</b> — ayda bir cuma: bilgi okuryazarlığı ve dijital araçlar.</li>
        </ul>
        <p class="nx-lib-note">Etkinlik programı (temsilî) — kayıt için danışma bankosundaki
        karşılama alanından bilgi alınabilir.</p>`,
    };
    this.infoBody.innerHTML = content[tab];
    this.infoEl.classList.add('show');
    this.root.classList.add('info-open');
  }

  hideInfo(): void {
    this.infoEl.classList.remove('show');
    this.root.classList.remove('info-open');
  }

  showGenericCard(label: string, info: Array<[string, string]>): void {
    const rows = info.map(([k, v]) => `<div class="nx-lib-row"><span>${k}</span><b>${v}</b></div>`).join('');
    this.cardBody.innerHTML = `
      <span class="nx-lib-cat">Donanım</span>
      <h2>${label}</h2>
      <div class="nx-lib-rows">${rows}</div>
    `;
    this.card.classList.add('show');
  }

  hideCard(): void {
    this.card.classList.remove('show');
  }

  setLoading(progress: number, step?: string): void {
    this.loadingBar.style.width = `${Math.round(progress * 100)}%`;
    if (step) this.loadingStep.textContent = step;
  }

  finishLoading(): void {
    this.loading.classList.add('hide');
    setTimeout(() => this.loading.remove(), 450);
  }

  /** Toplam kitaplık / kitap sayısını göster (başlık altı) */
  setCollectionSummary(totalBooks: number): void {
    const p = this.root.querySelector('.nx-lib-brand p');
    if (p) {
      p.textContent = `Dijital kütüphane · 32 × 22 m · 2 kat · ${SHELVES.length} kitaplık · ${totalBooks.toLocaleString('tr-TR')} kitap`;
    }
  }
}
