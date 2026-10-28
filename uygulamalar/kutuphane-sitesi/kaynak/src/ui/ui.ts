import {
  APARTMENTS, FLOORS, HERO_APARTMENT_ID, SYSTEM_LAYERS, type FloorDef, type SystemLayer,
  type ApartmentDef, type MaterialKey,
} from '../data/building';
import type { PickMeta } from '../core/geometry';
import type { SelectionInfo } from '../systems/interaction';
import type { CameraMode } from '../systems/camera';
import type * as THREE_NS from 'three';

type THREE = typeof THREE_NS;

/** Arayüz bağlama katmanı — DOM üretimi ve olay bağlama. */
export interface UIHandlers {
  onFloorSelect: (floorId: string) => void;
  onFloorToggleVisible: (floorId: string) => void;
  onApartmentSelect: (aptId: string) => void;
  onIsolateClear: () => void;
  onLayerToggle: (layer: SystemLayer, on: boolean) => void;
  onModeSelect: (mode: CameraMode) => void;
  onExplodeChange: (v: number) => void;
  onTimeChange: (h: number) => void;
  onWeatherChange: (w: 'sunny' | 'rain' | 'snow') => void;
  onXrayToggle: () => void;
  onCeilingToggle: () => void;
  onElevatorCall: (floorIndex: number) => void;
  onReset: () => void;
  onDoorToggle: (id: string) => void;
  onLightToggle: (id: string) => void;
  onMaterialSelect: (key: MaterialKey) => void;
  onFocusApartment: (aptId: string) => void;
  onIsolateFloor: (floorId: string) => void;
  onCinematicStop: () => void;
}

const MATERIAL_LABELS: Record<string, { name: string; css: string }> = {
  marble: { name: 'Mermer', css: 'linear-gradient(135deg,#f2efe9,#d8d2c6)' },
  wood: { name: 'Ahşap', css: 'linear-gradient(135deg,#c79a6a,#8a6039)' },
  concrete: { name: 'Beton', css: 'linear-gradient(135deg,#d3d0ca,#a9a59d)' },
  fabric: { name: 'Kumaş', css: 'linear-gradient(135deg,#8592a0,#5c6773)' },
  stone: { name: 'Taş', css: 'linear-gradient(135deg,#a8a294,#7c766a)' },
  woodDark: { name: 'Koyu Ahşap', css: 'linear-gradient(135deg,#7a5a42,#4a3428)' },
};

export class UIManager {
  private h: UIHandlers;
  /** Daire kapılarını sağlayan geri çağırma (bina sisteminden bağlanır) */
  doorProvider: (() => Array<{ id: string; label: string; open: boolean }>) | null = null;
  private activeFloor: string | null = null;
  private activeApt: string | null = null;
  private hiddenFloors = new Set<string>();
  private aptFilter = 'all';

  constructor(handlers: UIHandlers) {
    this.h = handlers;
    this.buildFloors();
    this.buildApartments();
    this.buildLayers();
    this.buildElevatorButtons();
    this.bindControls();
    this.bindMobileTabs();
  }

  private $(sel: string): HTMLElement {
    return document.querySelector(sel) as HTMLElement;
  }

  // ---------- KATLAR ----------
  private buildFloors(): void {
    const list = this.$('#floor-list');
    list.innerHTML = '';
    this.$('#floor-count').textContent = String(FLOORS.length);
    // Üstten alta: K5 → B1
    [...FLOORS].reverse().forEach((f) => {
      const li = document.createElement('li');
      const btn = document.createElement('button');
      btn.className = 'floor-item';
      btn.dataset.floor = f.id;
      const aptText = f.apartments > 0 ? `${f.apartments} daire` : (f.kind === 'basement' ? 'Otopark' : 'Lobi');
      btn.innerHTML = `
        <span class="fi-code">${f.shortName}</span>
        <span class="fi-body">
          <span class="fi-name">${f.name.split('—')[1]?.trim() ?? f.name}</span>
          <span class="fi-meta">${f.elevation >= 0 ? '+' : ''}${f.elevation.toFixed(2)} m · ${aptText}</span>
        </span>
        <span class="fi-eye" data-eye="${f.id}" title="Katı göster/gizle">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.8">
            <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="2.6"/>
          </svg>
        </span>`;
      btn.addEventListener('click', (e) => {
        const eye = (e.target as HTMLElement).closest('[data-eye]');
        if (eye) {
          e.stopPropagation();
          this.h.onFloorToggleVisible(f.id);
          return;
        }
        this.onFloorClick(f.id);
      });
      li.appendChild(btn);
      list.appendChild(li);
    });
  }

  onFloorClick(floorId: string): void {
    this.activeFloor = this.activeFloor === floorId ? null : floorId;
    this.$('#btn-isolate-clear').toggleAttribute('disabled', this.activeFloor === null);
    document.querySelectorAll('.floor-item').forEach((el) => {
      el.classList.toggle('active', (el as HTMLElement).dataset.floor === this.activeFloor);
    });
    this.h.onFloorSelect(this.activeFloor ?? '');
  }

  setFloorHidden(floorId: string, hidden: boolean): void {
    if (hidden) this.hiddenFloors.add(floorId);
    else this.hiddenFloors.delete(floorId);
    const eye = document.querySelector(`[data-eye="${floorId}"]`);
    eye?.classList.toggle('off', hidden);
    const item = document.querySelector(`.floor-item[data-floor="${floorId}"]`) as HTMLElement | null;
    if (item) item.style.opacity = hidden ? '0.45' : '1';
  }

  setActiveFloorUI(floorId: string | null): void {
    this.activeFloor = floorId;
    this.$('#btn-isolate-clear').toggleAttribute('disabled', floorId === null);
    document.querySelectorAll('.floor-item').forEach((el) => {
      el.classList.toggle('active', floorId !== null && (el as HTMLElement).dataset.floor === floorId);
    });
  }

  // ---------- DAİRELER ----------
  private buildApartments(): void {
    const list = this.$('#apt-list');
    list.innerHTML = '';
    this.$('#apt-count').textContent = String(APARTMENTS.length);
    const filtered = this.aptFilter === 'all' ? APARTMENTS : APARTMENTS.filter((a) => a.floorId === this.aptFilter);
    filtered.forEach((apt) => {
      const btn = document.createElement('button');
      btn.className = 'apt-item' + (apt.id === HERO_APARTMENT_ID ? ' hero' : '');
      btn.dataset.apt = apt.id;
      btn.innerHTML = `<span class="apt-no">${apt.no}</span><span class="apt-type">${apt.type}</span><span class="apt-area">${apt.area} m²</span>`;
      btn.addEventListener('click', () => {
        this.setActiveApartment(apt.id);
        this.h.onApartmentSelect(apt.id);
      });
      list.appendChild(btn);
    });
    // filtre olayları
    document.querySelectorAll('#apt-filter .chip').forEach((chip) => {
      chip.addEventListener('click', () => {
        document.querySelectorAll('#apt-filter .chip').forEach((c) => c.classList.remove('active'));
        chip.classList.add('active');
        this.aptFilter = (chip as HTMLElement).dataset.f ?? 'all';
        this.buildApartments();
      });
    });
  }

  setActiveApartment(aptId: string | null): void {
    this.activeApt = aptId;
    document.querySelectorAll('.apt-item').forEach((el) => {
      el.classList.toggle('active', (el as HTMLElement).dataset.apt === aptId);
    });
  }

  // ---------- KATMANLAR ----------
  private buildLayers(): void {
    const box = this.$('#layer-list');
    box.innerHTML = '';
    SYSTEM_LAYERS.forEach((layer) => {
      const item = document.createElement('div');
      item.className = 'layer-item off';
      item.dataset.layer = layer.key;
      item.setAttribute('role', 'checkbox');
      item.setAttribute('aria-checked', 'false');
      item.tabIndex = 0;
      item.innerHTML = `
        <span class="layer-swatch" style="background:${layer.color}"></span>
        <span class="layer-name">${layer.label}</span>
        <span class="layer-check"></span>`;
      const toggle = () => {
        const on = !item.classList.contains('on');
        item.classList.toggle('on', on);
        item.classList.toggle('off', !on);
        item.setAttribute('aria-checked', String(on));
        this.h.onLayerToggle(layer.key, on);
      };
      item.addEventListener('click', toggle);
      item.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); }
      });
      box.appendChild(item);
      // not satırı (yalnız kavramsal olanlar için)
      if (layer.key === 'structural' || layer.key === 'fire') {
        const note = document.createElement('div');
        note.className = 'layer-note';
        note.textContent = layer.note;
        box.appendChild(note);
      }
    });
  }

  setLayerUI(layer: SystemLayer, on: boolean): void {
    const item = document.querySelector(`.layer-item[data-layer="${layer}"]`);
    item?.classList.toggle('on', on);
    item?.classList.toggle('off', !on);
    item?.setAttribute('aria-checked', String(on));
  }

  // ---------- ASANSÖR ----------
  private buildElevatorButtons(): void {
    const box = this.$('#elev-btns');
    box.innerHTML = '';
    [...FLOORS].reverse().forEach((f) => {
      const b = document.createElement('button');
      b.className = 'elev-btn';
      b.textContent = f.shortName;
      b.title = `${f.name} — asansörü çağır`;
      b.addEventListener('click', () => this.h.onElevatorCall(f.index));
      box.appendChild(b);
    });
  }

  setElevatorStatus(a: { floor: string; moving: boolean }, b: { floor: string; moving: boolean }): void {
    const ea = document.querySelector('#elev-a') as HTMLElement | null;
    const eb = document.querySelector('#elev-b') as HTMLElement | null;
    if (ea) {
      ea.innerHTML = `A <b>${a.floor}</b>`;
      ea.classList.toggle('moving', a.moving);
    }
    if (eb) {
      eb.innerHTML = `B <b>${b.floor}</b>`;
      eb.classList.toggle('moving', b.moving);
    }
  }

  // ---------- KONTROLLER ----------
  private bindControls(): void {
    // Explode
    const ex = this.$('#explode') as HTMLInputElement;
    ex.addEventListener('input', () => {
      const v = Number(ex.value);
      this.$('#explode-value').textContent = `%${v}`;
      this.h.onExplodeChange(v / 100);
    });

    // Saat
    const tm = this.$('#time') as HTMLInputElement;
    tm.addEventListener('input', () => {
      const v = Number(tm.value);
      this.$('#time-value').textContent = fmtHour(v);
      this.h.onTimeChange(v);
    });
    this.$('#time-value').textContent = fmtHour(Number(tm.value));

    // Hava
    document.querySelectorAll('#weather-group .weather-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('#weather-group .weather-btn').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        this.h.onWeatherChange(((btn as HTMLElement).dataset.w ?? 'sunny') as any);
      });
    });

    // X-Ray / Tavan
    this.$('#btn-xray').addEventListener('click', () => this.h.onXrayToggle());
    this.$('#btn-ceiling').addEventListener('click', () => this.h.onCeilingToggle());

    // Mod
    document.querySelectorAll('.mode-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.mode-btn').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        const mode = ((btn as HTMLElement).dataset.mode ?? 'exterior') as CameraMode;
        this.setModeHint(mode);
        this.h.onModeSelect(mode);
      });
    });

    // Sıfırla
    this.$('#btn-reset-top').addEventListener('click', () => this.h.onReset());

    // İzolasyon kaldır
    this.$('#btn-isolate-clear').addEventListener('click', () => {
      this.setActiveFloorUI(null);
      this.h.onIsolateClear();
    });

    // Sinematik durdur
    this.$('#btn-cine-stop').addEventListener('click', () => this.h.onCinematicStop());

    // Panel daralt
    document.querySelectorAll('.collapse-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const target = (btn as HTMLElement).dataset.target;
        const app = this.$('#app');
        if (target === 'panel-left') app.classList.toggle('left-collapsed');
        else app.classList.toggle('right-collapsed');
      });
    });
  }

  private bindMobileTabs(): void {
    const left = document.createElement('button');
    left.className = 'mobile-tab-btn left';
    left.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 6h16M4 12h16M4 18h16"/></svg>';
    left.title = 'Katlar ve daireler';
    left.addEventListener('click', () => {
      this.$('#panel-left').classList.toggle('open');
      this.$('#panel-right').classList.remove('open');
    });

    const right = document.createElement('button');
    right.className = 'mobile-tab-btn right';
    right.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 8h.01M11 12h1v4h1"/></svg>';
    right.title = 'Seçim bilgisi';
    right.addEventListener('click', () => {
      this.$('#panel-right').classList.toggle('open');
      this.$('#panel-left').classList.remove('open');
    });

    const tabs = document.createElement('div');
    tabs.className = 'panel-mobile-tabs';
    tabs.appendChild(left);
    tabs.appendChild(right);
    this.$('#app').appendChild(tabs);
  }

  private setModeHint(mode: CameraMode): void {
    const map: Record<CameraMode, string> = {
      exterior: 'Fare ile döndür · tekerlek ile yaklaş · sağ tık ile kaydır',
      interior: 'WASD yürü · Shift koş · fare bak · duvarlardan geçmez',
      cinematic: 'Kamera otomatik olarak lobi → asansör → daire → teras turunu yapar',
    };
    this.$('#mode-hint').textContent = map[mode];
  }

  setModeUI(mode: CameraMode): void {
    document.querySelectorAll('.mode-btn').forEach((b) => {
      b.classList.toggle('active', (b as HTMLElement).dataset.mode === mode);
    });
    this.setModeHint(mode);
    this.$('#interior-help').toggleAttribute('hidden', mode !== 'interior');
    this.$('#cine-bar').toggleAttribute('hidden', mode !== 'cinematic');
    if (mode === 'interior') {
      // mobilde iç mekânda dokunmatik bakış için ipucu
      this.$('#interior-help').innerHTML = window.innerWidth < 640
        ? 'Dokunup sürükle = bak · ekranı çift dokun = kapı/ışık seç'
        : '<kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> yürü · <kbd>Fare</kbd> bak · <kbd>Shift</kbd> koş · <kbd>Q</kbd><kbd>E</kbd> dön · <kbd>Esc</kbd> çık';
    }
  }

  setCinematicProgress(t: number): void {
    this.$('#cine-fill').style.width = `${Math.round(t * 100)}%`;
  }

  setXrayUI(on: boolean): void {
    this.$('#btn-xray').classList.toggle('active', on);
    if (!on) {
      document.querySelectorAll('.layer-item').forEach((i) => {
        i.classList.remove('on');
        i.classList.add('off');
      });
    } else {
      document.querySelectorAll('.layer-item').forEach((i) => {
        const key = (i as HTMLElement).dataset.layer;
        if (key !== 'architectural') {
          i.classList.add('on');
          i.classList.remove('off');
        }
      });
    }
  }

  setCeilingUI(hidden: boolean, enabled: boolean): void {
    const btn = this.$('#btn-ceiling');
    btn.classList.toggle('active', hidden);
    btn.toggleAttribute('disabled', !enabled);
  }

  setFps(stats: { fps: number; minFps: number; drawCalls: number; triangles: number; pixelRatio: number }): void {
    const chip = this.$('#fps-chip');
    this.$('#fps-value').textContent = stats.fps.toFixed(0);
    chip.classList.remove('warn', 'bad');
    if (stats.fps < 40) chip.classList.add('bad');
    else if (stats.fps < 55) chip.classList.add('warn');
    this.$('#drawcall-value').textContent =
      `${stats.drawCalls} dc · ${(stats.triangles / 1000).toFixed(0)}k △ · ${stats.pixelRatio.toFixed(2)}x`;
    chip.title = `Gerçek ölçüm: ${stats.fps.toFixed(1)} FPS · min ${stats.minFps.toFixed(1)} FPS`;
  }

  setEnergy(watts: number, onCount: number, total: number): void {
    const pct = Math.min(100, (onCount / Math.max(1, total)) * 100);
    const fill = this.$('#energy-fill');
    fill.style.width = `${Math.max(4, pct)}%`;
    fill.classList.toggle('high', pct > 70);
    this.$('#energy-value').textContent = `${(watts / 1000).toFixed(2)} kW`;
    this.$('#energy-value').title = `${onCount}/${total} armatür açık · temsili 12 W/armatür`;
  }

  // ---------- SEÇİM PANELİ ----------
  renderSelection(info: SelectionInfo | null): void {
    const body = this.$('#inspect-body');
    const empty = this.$('#inspect-empty');
    const title = this.$('#inspect-title');

    if (!info) {
      body.hidden = true;
      empty.hidden = false;
      title.textContent = 'Seçim';
      return;
    }
    body.hidden = false;
    empty.hidden = true;

    const meta = info.meta;
    const kindLabels: Record<string, string> = {
      apartment: 'DAİRE', room: 'MEKÂN', door: 'KAPI', light: 'AYDINLATMA',
      window: 'PENCERE', elevator: 'ASANSÖR', floor: 'KAT/DÖŞEME', furniture: 'DONATI',
      material: 'MALZEME', system: 'TEKNİK SİSTEM',
    };
    title.textContent = kindLabels[meta.kind] ?? 'Seçim';

    const floor = FLOORS.find((f) => f.id === meta.floorId);
    const apt = APARTMENTS.find((a) => a.id === meta.apartmentId);

    let html = `<div class="ins-badge">${kindLabels[meta.kind] ?? 'OBJE'}</div>`;
    html += `<div class="ins-title">${meta.label}</div>`;
    html += `<div class="ins-sub">${meta.id}${floor ? ` · ${floor.shortName}` : ''}</div>`;

    // ölçü tablosu
    const cells: Array<[string, string, boolean?]> = [];
    if (meta.area) cells.push(['Alan', `${meta.area} m²`]);
    if (meta.info) meta.info.forEach(([k, v]) => cells.push([k, v]));
    if (cells.length > 0) {
      html += '<div class="ins-grid">';
      cells.forEach(([k, v, wide]) => {
        html += `<div class="ins-cell${wide ? ' wide' : ''}"><div class="k">${k}</div><div class="v">${v}</div></div>`;
      });
      html += '</div>';
    }

    if (apt) {
      html += `<div class="ins-section-title">Daire Bilgisi</div>`;
      html += `<div class="ins-grid">
        <div class="ins-cell"><div class="k">Daire No</div><div class="v">${apt.no}</div></div>
        <div class="ins-cell"><div class="k">Tip</div><div class="v">${apt.type}</div></div>
        <div class="ins-cell"><div class="k">Brüt</div><div class="v">${apt.area} m²</div></div>
        <div class="ins-cell"><div class="k">Net</div><div class="v">${apt.netArea} m²</div></div>
        <div class="ins-cell wide"><div class="k">Odalar</div><div class="v" style="font-size:10px;line-height:1.5">${apt.rooms.join(' · ')}</div></div>
      </div>`;
    }

    // aksiyonlar
    html += `<div class="ins-section-title">Etkileşimler</div><div class="ins-actions">`;
    if (meta.kind === 'door') {
      html += `<button class="act-btn primary" data-act="door">Kapıyı Aç / Kapat</button>`;
    }
    if (meta.kind === 'light') {
      html += `<button class="act-btn primary" data-act="light">Işığı Aç / Kapat</button>`;
    }
    if (meta.kind === 'window') {
      html += `<button class="act-btn primary" data-act="window">Pencereyi Aç / Kapat</button>`;
    }
    if (meta.kind === 'elevator') {
      html += `<button class="act-btn primary" data-act="elevate">Kat Seç ve Çağır</button>`;
    }
    if (meta.kind === 'apartment' || meta.kind === 'room') {
      html += `<button class="act-btn primary" data-act="focus">Odaya Odaklan</button>`;
    }
    if (meta.floorId) {
      html += `<button class="act-btn" data-act="isolate">Bu Katı İzole Et</button>`;
    }
    if (apt) {
      html += `<button class="act-btn" data-act="aptfocus">Daireye Git (3D)</button>`;
    }
    html += `<button class="act-btn" data-act="material">Malzeme Değiştir</button>`;
    html += `</div>`;

    // Daire seçiliyse içindeki KAPILARI listele (şartname: çalışan kapı sistemi)
    if (meta.apartmentId === HERO_APARTMENT_ID && this.doorProvider) {
      const doors = this.doorProvider();
      if (doors.length > 0) {
        html += `<div class="ins-section-title">Daire Kapıları (${doors.length})</div>`;
        html += `<div class="ins-actions">`;
        doors.forEach((d) => {
          html += `<button class="act-btn${d.open ? ' on' : ''}" data-door="${d.id}">${d.open ? '● ' : '○ '}${d.label}</button>`;
        });
        html += `</div>`;
      }
    }

    // malzeme paleti
    html += `<div class="ins-section-title">Malzeme</div>
      <div class="mat-row mat-row-wrap">`;
    Object.entries(MATERIAL_LABELS).forEach(([key, m]) => {
      html += `<button class="mat-swatch" data-mat="${key}" title="${m.name}" style="background:${m.css}"><span>${m.name}</span></button>`;
    });
    html += `</div>`;

    if (meta.layer === 'structural' || meta.layer === 'fire') {
      html += `<div class="ins-note">Konsept gösterimdir; taşıyıcı sistem ve yangın güvenliği mevzuat uygunluğu doğrulanmamıştır.</div>`;
    }
    if (meta.kind === 'apartment' && meta.apartmentId && meta.apartmentId !== HERO_APARTMENT_ID) {
      html += `<div class="ins-note">Bu daire performans için temsilî donatılmıştır. Tam iç mekân örneği: <b>K1-D1 (101)</b>.</div>`;
    }

    body.innerHTML = html;

    // olaylar
    body.querySelector('[data-act="door"]')?.addEventListener('click', () => this.h.onDoorToggle(meta.id));
    body.querySelector('[data-act="light"]')?.addEventListener('click', () => {
      this.h.onLightToggle(meta.id);
    });
    body.querySelector('[data-act="window"]')?.addEventListener('click', () => this.toast('Pencere durumu değiştirildi'));
    body.querySelector('[data-act="elevate"]')?.addEventListener('click', () => {
      const f = FLOORS.find((x) => x.id === meta.floorId);
      if (f) this.h.onElevatorCall(f.index);
      else this.h.onElevatorCall(0);
    });
    body.querySelector('[data-act="focus"]')?.addEventListener('click', () => {
      if (meta.apartmentId) this.h.onFocusApartment(meta.apartmentId);
    });
    body.querySelector('[data-act="aptfocus"]')?.addEventListener('click', () => {
      if (apt) this.h.onFocusApartment(apt.id);
    });
    body.querySelector('[data-act="isolate"]')?.addEventListener('click', () => {
      if (meta.floorId) this.h.onIsolateFloor(meta.floorId);
    });
    body.querySelectorAll('[data-door]').forEach((b) => {
      b.addEventListener('click', () => {
        this.h.onDoorToggle((b as HTMLElement).dataset.door as string);
      });
    });
    body.querySelectorAll('[data-mat]').forEach((sw) => {
      sw.addEventListener('click', () => {
        body.querySelectorAll('[data-mat]').forEach((s) => s.classList.remove('active'));
        sw.classList.add('active');
        this.h.onMaterialSelect(((sw as HTMLElement).dataset.mat ?? 'marble') as MaterialKey);
      });
    });
  }

  /**
   * Daire listesinden seçim: sağ panelde daire bilgisi + etkileşimler.
   * Not: 3D tıklaması değil, listeden seçim olduğu için sahte bir
   * SelectionInfo üretilir (object alanı null değil ama tıklama hedefi yok).
   */
  renderAparmentInfo(apt: ApartmentDef): void {
    // Not: listeden seçimde 3D tıklama hedefi yok; renderSelection nesne
    // kullanmıyor, bu yüzden null-geçerli bir yer tutucu ile çağrılır.
    const fake = {
      meta: {
        kind: 'apartment' as const, id: apt.id, label: `${apt.no} — ${apt.type}`,
        floorId: apt.floorId, apartmentId: apt.id, area: apt.area,
      },
      object: null,
      worldPos: null,
    } as unknown as SelectionInfo;
    this.renderSelection(fake);
  }

  // ---------- TOAST ----------
  private toastTimer: number | null = null;
  toast(msg: string): void {
    const el = this.$('#toast');
    el.textContent = msg;
    el.classList.add('show');
    if (this.toastTimer) window.clearTimeout(this.toastTimer);
    this.toastTimer = window.setTimeout(() => el.classList.remove('show'), 2400);
  }

  // ---------- YÜKLEME ----------
  setLoading(progress: number, step?: string): void {
    this.$('#loading-fill').style.width = `${Math.round(progress * 100)}%`;
    if (step) this.$('#loading-step').textContent = step;
  }

  finishLoading(): void {
    this.setLoading(1, 'Hazır');
    setTimeout(() => this.$('#loading').classList.add('done'), 260);
  }

  // ---------- SAAT ----------
  setTimeUI(hour: number): void {
    (this.$('#time') as HTMLInputElement).value = String(hour);
    this.$('#time-value').textContent = fmtHour(hour);
  }

  setExplodeUI(v: number): void {
    const ex = this.$('#explode') as HTMLInputElement;
    ex.value = String(Math.round(v * 100));
    this.$('#explode-value').textContent = `%${Math.round(v * 100)}`;
  }

  setElevatorButtonsCurrent(floorIndex: number): void {
    document.querySelectorAll('.elev-btn').forEach((b, i) => {
      const idx = FLOORS.length - 1 - i; // ters sıra
      b.classList.toggle('current', FLOORS[idx]?.index === floorIndex);
    });
  }
}

function fmtHour(h: number): string {
  const hh = Math.floor(((h % 24) + 24) % 24);
  const mm = Math.round((h - Math.floor(h)) * 60);
  return `${String(hh).padStart(2, '0')}:${String(mm === 60 ? 0 : mm).padStart(2, '0')}`;
}
