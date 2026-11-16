/* NUMEX FLOORPLAN — arayüz ve uygulama akışı */
(function (global) {
  'use strict';
  const NF = global.NF;
  const G = NF.G;

  const $ = s => document.querySelector(s);
  const $$ = s => Array.prototype.slice.call(document.querySelectorAll(s));
  const cm = m => Math.round(m * 1000) / 10;      // metre -> cm (1 ondalık)
  const mFromCm = v => v / 100;
  const fmt = (v, d) => (isFinite(v) ? v : 0).toFixed(d === undefined ? 2 : d).replace('.', ',');
  // <input type="number"> değeri nokta ister; virgüllü değer tarayıcıda reddedilir
  const fmtv = (v, d) => (isFinite(v) ? v : 0).toFixed(d === undefined ? 2 : d);
  const esc = t => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  const APP = {
    stage: null, props: null, toastEl: null, toastTimer: null,

    init() {
      this.stage = $('#stage');
      this.props = $('#props');
      this.toastEl = $('#toast');

      /* tema */
      const savedTheme = NF.loadTheme() || 'dark';
      this.setTheme(savedTheme, true);

      /* proje: yerel kayıt varsa geri yükle */
      const local = NF.loadLocal();
      const start = local || NF.SAMPLES[1].make();
      NF.reset(start);
      $('#projName').value = start.name || 'Proje';

      ED.init($('#c2d'));
      V3.init($('#c3d'));
      ED.theme = document.body.dataset.theme;

      // sayı alanlarına virgüllü değer yazılmasın (tarayıcı type=number'ı reddeder)
      if (window.MutationObserver) {
        new MutationObserver(() => {
          this.props.querySelectorAll('input[type="number"]').forEach(inp => {
            const attr = inp.getAttribute('value');
            const raw = attr !== null && attr !== undefined ? attr : inp.value;
            const clean = String(raw === null || raw === undefined ? '' : raw).replace(',', '.');
            if (inp.value !== clean) inp.value = clean;
          });
        }).observe(this.props, { childList: true, subtree: true });
      }

      this.buildPalette();
      this.buildSamples();
      this.bindTop();
      this.bindTools();
      this.bindKeys();
      this.bindStatus();
      this.renderProps();
      if (global.EXAM) global.EXAM.init();

      ED.fit();
      requestAnimationFrame(() => { ED.fit(); });

      setTimeout(() => {
        if (!local) this.toast('Hazır proje yüklendi: ' + start.name + ' — duvar çizmek için W');
        else this.toast('Son çalışman geri yüklendi: ' + start.name);
      }, 400);

      NF.on('change', () => { this.renderProps(); this.updateStatus(); });
      NF.on('model', () => { this.renderProps(); this.updateStatus(); $('#projName').value = NF.project.name; });
      NF.on('history', () => this.updateHistoryButtons());
      NF.on('select', () => this.renderProps());
      NF.on('tool', () => this.syncTool());
      NF.on('view', () => this.updateZoom());
      NF.on('pointer', d => this.onPointer(d));
      NF.on('toast', d => this.toast(d.text, d.error));
      NF.on('saved', d => this.onSaved(d));
      this.updateHistoryButtons();
      this.updateStatus();
    },

    /* ---------------- tema ---------------- */
    setTheme(t, silent) {
      document.body.dataset.theme = t;
      ED.theme = t;
      NF.saveTheme(t);
      if (global.V3 && V3.scene) {
        V3.scene.background = new THREE.Color(t === 'dark' ? 0x0f141b : 0xeef1f5);
        V3.update();
      }
      if (!silent) ED.invalidate();
    },

    /* ---------------- palet ---------------- */
    buildPalette() {
      const box = $('#palette');
      const maxD = Math.max.apply(null, NF.CATALOG.map(c => Math.max(c.w, c.d)));
      box.innerHTML = NF.CATALOG.map(c => {
        const w = Math.max(10, c.w / maxD * 30), d = Math.max(6, c.d / maxD * 22);
        return '<button class="pal" data-type="' + c.type + '" title="' + esc(c.name) + ' — ' + Math.round(c.w * 100) + ' × ' + Math.round(c.d * 100) + ' cm">' +
          '<svg width="34" height="26" viewBox="0 0 34 26"><rect x="' + (17 - w / 2) + '" y="' + (13 - d / 2) + '" width="' + w + '" height="' + d + '" rx="2.5" fill="currentColor" opacity=".28" stroke="currentColor" stroke-width="1.2"/></svg>' +
          '<span>' + esc(c.name) + '</span></button>';
      }).join('');
      box.addEventListener('click', e => {
        const b = e.target.closest('.pal');
        if (!b) return;
        NF.tool = 'place:' + b.dataset.type;
        this.syncTool();
        this.toast((NF.CAT[b.dataset.type] || {}).name + ' — tuvale tıklayın');
      });
    },

    buildSamples() {
      const box = $('#sampleBox');
      box.innerHTML = '<button data-sample="empty">Boş Proje <small>sıfırdan</small></button>' +
        NF.SAMPLES.map(s => '<button data-sample="' + s.id + '">' + esc(s.label) + ' <small>düzenlenebilir</small></button>').join('');
      box.addEventListener('click', e => {
        const b = e.target.closest('button'); if (!b) return;
        const id = b.dataset.sample;
        if (id === 'empty') {
          NF.reset(NF.newProject('Yeni Proje'));
          this.toast('Boş proje hazır');
        } else {
          const s = NF.SAMPLES.find(x => x.id === id);
          if (!s) return;
          NF.reset(s.make());
          this.toast('Hazır proje açıldı: ' + s.label);
        }
        $('#projName').value = NF.project.name;
        if (NF.mode === '3d') V3.update(); else ED.fit();
      });
    },

    /* ---------------- üst bar ---------------- */
    bindTop() {
      $('#projName').addEventListener('input', e => { NF.project.name = e.target.value; });
      $('#projName').addEventListener('change', () => NF.commit());

      $('#modeSeg').addEventListener('click', e => {
        const b = e.target.closest('button'); if (!b) return;
        this.setMode(b.dataset.mode);
      });

      $('#btnUndo').addEventListener('click', () => this.undo());
      $('#btnRedo').addEventListener('click', () => this.redo());
      $('#btnTheme').addEventListener('click', () => {
        this.setTheme(document.body.dataset.theme === 'dark' ? 'light' : 'dark');
        this.toast('Tema: ' + (document.body.dataset.theme === 'dark' ? 'koyu' : 'açık'));
      });

      $('#btnSave').addEventListener('click', () => this.saveJSON());
      $('#btnOpen').addEventListener('click', () => $('#fileOpen').click());
      $('#fileOpen').addEventListener('change', e => this.openJSON(e.target.files[0]));

      $('#btnExport').addEventListener('click', e => {
        e.stopPropagation();
        $('#exportMenu').classList.toggle('open');
      });
      document.addEventListener('click', () => $('#exportMenu').classList.remove('open'));
      $('#exportMenu').addEventListener('click', e => {
        const b = e.target.closest('button'); if (!b) return;
        if (b.dataset.exp === 'svg') this.saveSVG();
        if (b.dataset.exp === 'png') this.savePNG();
        $('#exportMenu').classList.remove('open');
      });

      $('#btnNew').addEventListener('click', () => {
        if (NF.project.walls.length && !confirm('Yeni proje açılsın mı? Kaydedilmemiş değişiklikler JSON olarak indirilebilir.')) return;
        NF.reset(NF.newProject('Yeni Proje'));
        $('#projName').value = NF.project.name;
        ED.fit();
        this.toast('Yeni proje');
      });

      $('#zoomIn').addEventListener('click', () => { ED.zoomAt(1.2); });
      $('#zoomOut').addEventListener('click', () => { ED.zoomAt(1 / 1.2); });
      $('#zoomFit').addEventListener('click', () => { if (NF.mode === '3d') V3.fitCamera(); else ED.fit(); });
    },

    setMode(mode) {
      NF.mode = mode;
      const is3d = mode === '3d';
      this.stage.classList.toggle('mode3d', is3d);
      $$('#modeSeg button').forEach(b => b.classList.toggle('active', b.dataset.mode === mode));
      $('#stageTag').textContent = is3d ? '3D GÖRÜNÜM' : '2D PLAN';
      $('#stMode').textContent = is3d ? '3D' : '2D';
      if (is3d) {
        V3.setVisible(true);
        V3.update();
        this.toast('3D: sol tık döndür, sağ tık kaydır, tekerlek yaklaştır');
      } else {
        V3.setVisible(false);
        ED.resize();
        ED.invalidate();
      }
      NF.emit('history');
    },

    /* ---------------- araçlar ---------------- */
    bindTools() {
      $('#toolBox').addEventListener('click', e => {
        const b = e.target.closest('.tool'); if (!b) return;
        NF.tool = b.dataset.tool;
        ED.drawStart = null; ED.drawEnd = null;
        this.syncTool();
        if (NF.tool === 'wall') this.toast('Duvar: tıkla–bırak ya da tıkla–tıkla. Zincir devam eder, ESC bitirir.');
        if (NF.tool === 'door' || NF.tool === 'window') this.toast('Bir duvara tıklayın');
        ED.invalidate();
      });
    },

    syncTool() {
      $$('#toolBox .tool').forEach(b => b.classList.toggle('active', b.dataset.tool === NF.tool));
      $$('#palette .pal').forEach(b => b.classList.toggle('active', NF.tool === 'place:' + b.dataset.type));
    },

    /* ---------------- klavye ---------------- */
    bindKeys() {
      window.addEventListener('keydown', e => {
        const t = e.target;
        if (t && (t.tagName === 'INPUT' || t.tagName === 'SELECT' || t.tagName === 'TEXTAREA')) {
          if (e.key === 'Escape') t.blur();
          return;
        }
        const ctrl = e.ctrlKey || e.metaKey;
        if (ctrl && e.key.toLowerCase() === 'z') { e.preventDefault(); e.shiftKey ? this.redo() : this.undo(); return; }
        if (ctrl && e.key.toLowerCase() === 'y') { e.preventDefault(); this.redo(); return; }
        if (ctrl && e.key.toLowerCase() === 's') { e.preventDefault(); this.saveJSON(); return; }
        if (ctrl && e.key.toLowerCase() === 'd') { e.preventDefault(); this.duplicate(); return; }

        switch (e.key) {
          case 'v': case 'V': NF.tool = 'select'; this.syncTool(); break;
          case 'w': case 'W': NF.tool = 'wall'; this.syncTool(); break;
          case 'd': case 'D': if (!ctrl) { NF.tool = 'door'; this.syncTool(); } break;
          case 'p': case 'P': NF.tool = 'window'; this.syncTool(); break;
          case 'r': case 'R': this.rotate(e.shiftKey ? -90 : 90); break;
          case 'f': case 'F': if (NF.mode === '3d') V3.fitCamera(); else ED.fit(); break;
          case 'Escape':
            ED.drawStart = null; ED.drawEnd = null; NF.tool = 'select'; NF.sel = null;
            this.syncTool(); NF.emit('select'); ED.invalidate();
            break;
          case 'Delete': case 'Backspace': this.removeSelected(); break;
          default: return;
        }
        e.preventDefault();
      });
    },

    /* ---------------- düzenleme komutları ---------------- */
    undo() { if (!NF.undo()) this.toast('Geri alınacak adım yok', true); ED.invalidate(); },
    redo() { if (!NF.redo()) this.toast('Yinelenecek adım yok', true); ED.invalidate(); },

    removeSelected() {
      if (!NF.sel) return;
      const id = NF.sel.id;
      if (NF.removeById(NF.project, id)) {
        NF.sel = null;
        NF.commit();
        this.toast('Silindi');
        ED.invalidate();
      }
    },

    duplicate() {
      const sel = NF.sel;
      if (!sel || sel.kind !== 'furniture') { this.toast('Çoğaltmak için bir mobilya seçin', true); return; }
      const f = NF.project.furniture.find(x => x.id === sel.id);
      if (!f) return;
      const copy = NF.addFurniture(NF.project, f.type, f.x + 0.35, f.y + 0.35, f.rot);
      copy.w = f.w; copy.d = f.d;
      NF.sel = { kind: 'furniture', id: copy.id };
      NF.commit();
      this.toast('Çoğaltıldı');
      ED.invalidate();
    },

    rotate(deg) {
      const sel = NF.sel;
      if (!sel) { this.toast('Döndürmek için bir nesne seçin', true); return; }
      if (sel.kind === 'furniture') {
        const f = NF.project.furniture.find(x => x.id === sel.id);
        if (!f) return;
        f.rot = +(f.rot + deg * Math.PI / 180).toFixed(4);
        NF.commit();
        ED.invalidate();
      } else if (sel.kind === 'wall') {
        const wl = NF.project.walls.find(x => x.id === sel.id);
        if (!wl) return;
        const cx = (wl.ax + wl.bx) / 2, cy = (wl.ay + wl.by) / 2;
        const rot = (p, deg) => {
          const a = deg * Math.PI / 180, c = Math.cos(a), s = Math.sin(a);
          const dx = p.x - cx, dy = p.y - cy;
          return { x: +(cx + dx * c - dy * s).toFixed(3), y: +(cy + dx * s + dy * c).toFixed(3) };
        };
        const a = rot({ x: wl.ax, y: wl.ay }, deg), b = rot({ x: wl.bx, y: wl.by }, deg);
        wl.ax = a.x; wl.ay = a.y; wl.bx = b.x; wl.by = b.y;
        NF.commit();
        ED.invalidate();
      }
    },

    /* ---------------- özellik paneli ---------------- */
    renderProps() {
      const box = this.props;
      const activeTag = document.activeElement ? document.activeElement.tagName : '';
      if (activeTag === 'INPUT' && box.contains(document.activeElement)) return; // yazarken paneli yenileme

      const sel = NF.sel;
      const found = sel ? NF.findById(NF.project, sel.id) : null;

      if (!found) {
        const rooms = NF.rooms(NF.project);
        const total = rooms.reduce((s, r) => s + r.area, 0);
        box.innerHTML =
          '<div class="props-head"><div class="kind">PROJE</div><div class="title">' + esc(NF.project.name) + '</div>' +
          '<div class="sub">' + NF.project.walls.length + ' duvar · ' + NF.project.openings.length + ' boşluk · ' + NF.project.furniture.length + ' mobilya</div></div>' +
          '<div class="field"><label>Duvar yüksekliği</label><input type="number" data-f="wallHeight" step="0.1" value="' + fmtv(NF.project.wallHeight, 2) + '"></div>' +
          '<div class="field"><label>Izgara (hizalama)</label><select data-f="snap">' +
            [0.05, 0.10, 0.25, 0.50].map(s => '<option value="' + s + '"' + (Math.abs(NF.snapStep - s) < 1e-6 ? ' selected' : '') + '>' + Math.round(s * 100) + ' cm</option>').join('') +
          '</select></div>' +
          '<div class="props-head" style="border-top:1px solid var(--line)"><div class="kind">ODALAR</div>' +
          '<div class="sub">Kapalı duvar döngülerinden hesaplanır</div></div>' +
          '<div class="roomlist">' + (rooms.length
            ? rooms.map(r => '<div><span>' + esc(r.name) + '</span><b>' + fmt(r.area, 2) + ' m²</b></div>').join('')
            : '<div><span>Kapalı oda yok</span><b>—</b></div>') + '</div>' +
          '<div class="field"><label>Toplam alan</label><input value="' + fmt(total, 2) + ' m²" readonly></div>' +
          '<div class="note">Bir duvara veya mobilyaya tıklayın; özellikleri burada düzenleyin. Duvar çizmek için <kbd>W</kbd>.</div>';

        const wh = box.querySelector('[data-f="wallHeight"]');
        wh.addEventListener('change', () => {
          const v = parseFloat(wh.value.replace(',', '.'));
          if (isFinite(v) && v >= 1.8 && v <= 6) { NF.project.wallHeight = +v.toFixed(2); NF.commit(); }
        });
        const sg = box.querySelector('[data-f="snap"]');
        sg.addEventListener('change', () => { NF.snapStep = parseFloat(sg.value); ED.invalidate(); NF.emit('toast', { text: 'Izgara: ' + Math.round(NF.snapStep * 100) + ' cm' }); });
        return;
      }

      const o = found.obj;
      if (found.kind === 'wall') {
        const L = G.len(o);
        box.innerHTML =
          '<div class="props-head"><div class="kind">DUVAR</div><div class="title">' + fmt(L, 2) + ' m</div>' +
          '<div class="sub">kalınlık ' + Math.round(o.t * 100) + ' cm · yükseklik ' + fmt(NF.project.wallHeight, 2) + ' m</div></div>' +
          '<div class="field"><label>Uzunluk (m)</label><input type="number" step="0.05" min="0.1" data-f="len" value="' + fmtv(L, 2) + '"></div>' +
          '<div class="field"><label>Kalınlık (cm)</label><input type="number" step="1" min="5" max="60" data-f="t" value="' + fmt(o.t * 100, 0) + '"></div>' +
          '<div class="field"><label>Başlangıç X (cm)</label><input type="number" step="1" data-f="ax" value="' + fmtv(o.ax * 100, 1) + '"></div>' +
          '<div class="field"><label>Başlangıç Y (cm)</label><input type="number" step="1" data-f="ay" value="' + fmtv(o.ay * 100, 1) + '"></div>' +
          '<div class="field"><label>Bitiş X (cm)</label><input type="number" step="1" data-f="bx" value="' + fmtv(o.bx * 100, 1) + '"></div>' +
          '<div class="field"><label>Bitiş Y (cm)</label><input type="number" step="1" data-f="by" value="' + fmtv(o.by * 100, 1) + '"></div>' +
          '<div class="btn-row">' +
          '<button data-act="door">+ Kapı</button><button data-act="window">+ Pencere</button>' +
          '<button data-act="rot90">90° çevir</button><button class="danger" data-act="del">Sil</button></div>' +
          '<div class="note">Bu duvarda ' + NF.openingsOf(NF.project, o.id).length + ' boşluk var. Uç noktalarından sürükleyerek de düzenleyebilirsin.</div>';

        this.wireWall(o, L);
        return;
      }

      if (found.kind === 'opening') {
        const wl = NF.project.walls.find(w => w.id === o.wallId);
        const WL = wl ? G.len(wl) : 0;
        box.innerHTML =
          '<div class="props-head"><div class="kind">' + (o.type === 'door' ? 'KAPI' : 'PENCERE') + '</div>' +
          '<div class="title">' + fmt(o.w, 2) + ' × ' + fmt(o.h, 2) + ' m</div>' +
          '<div class="sub">duvar: ' + fmt(WL, 2) + ' m · konum ' + fmt(o.d, 2) + ' m</div></div>' +
          '<div class="field"><label>Tür</label><select data-f="type"><option value="door"' + (o.type === 'door' ? ' selected' : '') + '>Kapı</option><option value="window"' + (o.type === 'window' ? ' selected' : '') + '>Pencere</option></select></div>' +
          '<div class="field"><label>Genişlik (cm)</label><input type="number" step="5" data-f="w" value="' + fmt(o.w * 100, 0) + '"></div>' +
          '<div class="field"><label>Yükseklik (cm)</label><input type="number" step="5" data-f="h" value="' + fmt(o.h * 100, 0) + '"></div>' +
          (o.type === 'window' ? '<div class="field"><label>Denizlik (cm)</label><input type="number" step="5" data-f="sill" value="' + fmt(o.sill * 100, 0) + '"></div>' : '') +
          '<div class="field"><label>Konum (cm)</label><input type="number" step="5" data-f="d" value="' + fmt(o.d * 100, 0) + '"></div>' +
          '<div class="btn-row"><button class="danger" data-act="del">Sil</button></div>' +
          '<div class="note">Konum, duvarın başlangıç ucundan ölçülür. Duvarla birlikte hareket eder.</div>';

        const set = (f, cb) => {
          const el = box.querySelector('[data-f="' + f + '"]');
          if (!el) return;
          el.addEventListener('change', () => {
            const v = parseFloat(el.value.replace(',', '.'));
            if (isFinite(v)) { cb(v); NF.commit(); this.renderProps(); ED.invalidate(); }
          });
        };
        set('w', v => { o.w = G.clamp(v / 100, 0.3, Math.max(0.4, WL - 0.05)); o.d = G.clamp(o.d, o.w / 2 + 0.02, WL - o.w / 2 - 0.02); });
        set('h', v => { o.h = G.clamp(v / 100, 0.5, 4); });
        set('sill', v => { o.sill = G.clamp(v / 100, 0, 2.4); });
        set('d', v => { o.d = G.clamp(v / 100, o.w / 2 + 0.02, Math.max(o.w / 2 + 0.03, WL - o.w / 2 - 0.02)); });
        const ty = box.querySelector('[data-f="type"]');
        ty.addEventListener('change', () => { o.type = ty.value; NF.commit(); this.renderProps(); ED.invalidate(); });
        box.querySelector('[data-act="del"]').addEventListener('click', () => this.removeSelected());
        return;
      }

      /* mobilya */
      const cat = NF.CAT[o.type] || { name: o.type };
      box.innerHTML =
        '<div class="props-head"><div class="kind">MOBİLYA</div><div class="title">' + esc(cat.name) + '</div>' +
        '<div class="sub">' + fmt(o.w, 2) + ' × ' + fmt(o.d, 2) + ' m · ' + Math.round(o.rot * 180 / Math.PI) + '°</div></div>' +
        '<div class="field"><label>Tür</label><select data-f="type">' +
        NF.CATALOG.map(c => '<option value="' + c.type + '"' + (c.type === o.type ? ' selected' : '') + '>' + esc(c.name) + '</option>').join('') +
        '</select></div>' +
        '<div class="field"><label>Genişlik (cm)</label><input type="number" step="5" data-f="w" value="' + fmt(o.w * 100, 0) + '"></div>' +
        '<div class="field"><label>Derinlik (cm)</label><input type="number" step="5" data-f="d" value="' + fmt(o.d * 100, 0) + '"></div>' +
        '<div class="field"><label>X (cm)</label><input type="number" step="5" data-f="x" value="' + fmtv(o.x * 100, 1) + '"></div>' +
        '<div class="field"><label>Y (cm)</label><input type="number" step="5" data-f="y" value="' + fmtv(o.y * 100, 1) + '"></div>' +
        '<div class="field"><label>Açı (°)</label><input type="number" step="15" data-f="rot" value="' + fmt(o.rot * 180 / Math.PI, 0) + '"></div>' +
        '<div class="btn-row"><button data-act="rotl">−90°</button><button data-act="rotr">+90°</button><button data-act="dup">Çoğalt</button><button class="danger" data-act="del">Sil</button></div>';

      const set = (f, cb) => {
        const el = box.querySelector('[data-f="' + f + '"]');
        if (!el) return;
        el.addEventListener('change', () => {
          const v = parseFloat(el.value.replace(',', '.'));
          if (isFinite(v)) { cb(v); NF.commit(); ED.invalidate(); this.renderProps(); }
        });
      };
      set('w', v => { o.w = G.clamp(v / 100, 0.1, 8); });
      set('d', v => { o.d = G.clamp(v / 100, 0.1, 8); });
      set('x', v => { o.x = +(v / 100).toFixed(3); });
      set('y', v => { o.y = +(v / 100).toFixed(3); });
      set('rot', v => { o.rot = +(v * Math.PI / 180).toFixed(4); });
      const ty = box.querySelector('[data-f="type"]');
      ty.addEventListener('change', () => {
        const c = NF.CAT[ty.value];
        if (c) { o.type = c.type; o.w = c.w; o.d = c.d; }
        NF.commit(); this.renderProps(); ED.invalidate();
      });
      box.querySelector('[data-act="rotl"]').addEventListener('click', () => this.rotate(-90));
      box.querySelector('[data-act="rotr"]').addEventListener('click', () => this.rotate(90));
      box.querySelector('[data-act="dup"]').addEventListener('click', () => this.duplicate());
      box.querySelector('[data-act="del"]').addEventListener('click', () => this.removeSelected());
    },

    wireWall(o, L) {
      const box = this.props;
      const dirOf = () => {
        const a = G.angle(o);
        return { x: Math.cos(a), y: Math.sin(a) };
      };
      const set = (f, cb) => {
        const el = box.querySelector('[data-f="' + f + '"]');
        if (!el) return;
        el.addEventListener('change', () => {
          const v = parseFloat(el.value.replace(',', '.'));
          if (isFinite(v)) { cb(v); NF.commit(); this.renderProps(); ED.invalidate(); }
        });
      };
      set('len', v => {
        const d = dirOf();
        const len = G.clamp(v, 0.1, 60);
        o.bx = +(o.ax + d.x * len).toFixed(3);
        o.by = +(o.ay + d.y * len).toFixed(3);
        ED.fixOpenings(o);
      });
      set('t', v => { o.t = G.clamp(v / 100, 0.05, 0.6); });
      set('ax', v => { o.ax = +(v / 100).toFixed(3); ED.fixOpenings(o); });
      set('ay', v => { o.ay = +(v / 100).toFixed(3); ED.fixOpenings(o); });
      set('bx', v => { o.bx = +(v / 100).toFixed(3); ED.fixOpenings(o); });
      set('by', v => { o.by = +(v / 100).toFixed(3); ED.fixOpenings(o); });

      box.querySelector('[data-act="door"]').addEventListener('click', () => {
        const op = NF.addOpening(NF.project, o, L / 2, 'door');
        if (op) { NF.sel = { kind: 'opening', id: op.id }; NF.commit(); this.renderProps(); ED.invalidate(); }
        else this.toast('Duvar kapı için kısa', true);
      });
      box.querySelector('[data-act="window"]').addEventListener('click', () => {
        const op = NF.addOpening(NF.project, o, L / 2, 'window');
        if (op) { NF.sel = { kind: 'opening', id: op.id }; NF.commit(); this.renderProps(); ED.invalidate(); }
        else this.toast('Duvar pencere için kısa', true);
      });
      box.querySelector('[data-act="rot90"]').addEventListener('click', () => this.rotate(90));
      box.querySelector('[data-act="del"]').addEventListener('click', () => this.removeSelected());
    },

    /* ---------------- kaydet / aç / dışa aktar ---------------- */
    fileName(ext) {
      const base = (NF.project.name || 'proje').trim().replace(/[\\/:*?"<>|]+/g, '-').replace(/\s+/g, '-').toLowerCase();
      return (base || 'proje') + '.' + ext;
    },

    download(data, name, type) {
      const blob = data instanceof Blob ? data : new Blob([data], { type: type || 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = name;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
    },

    saveJSON() {
      const payload = {
        app: 'numex-floorplan', version: 1, savedAt: new Date().toISOString(),
        project: NF.project
      };
      this.download(JSON.stringify(payload, null, 2), this.fileName('json'), 'application/json');
      this.toast('Proje JSON olarak indirildi');
    },

    openJSON(file) {
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const data = JSON.parse(String(reader.result));
          const p = data.project || data;
          if (!p || !Array.isArray(p.walls) || !Array.isArray(p.furniture)) throw new Error('Geçersiz proje dosyası');
          p.openings = Array.isArray(p.openings) ? p.openings : [];
          if (typeof p.wallHeight !== 'number') p.wallHeight = NF.DEFAULTS.wallHeight;
          if (typeof p.grid !== 'number') p.grid = 0.5;
          NF.reset(p);
          $('#projName').value = p.name || 'Proje';
          ED.fit();
          this.toast('Proje açıldı: ' + (p.name || 'isimsiz'));
        } catch (err) {
          this.toast('Dosya okunamadı: ' + err.message, true);
        }
      };
      reader.readAsText(file);
      // NUMEX-DÜZELTME (2026-11-16): APP nesnesinde `$` alanı yok; bu satır JSON açma akışını TypeError ile kesiyordu (dosya okunduktan sonra çöküyordu). Gereksiz satır kaldırıldı.
      $('#fileOpen').value = '';
    },

    saveSVG() {
      try {
        const svg = ED.exportSVG();
        this.download(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }), this.fileName('svg'));
        this.toast('SVG indirildi (2D plan)');
      } catch (e) { this.toast('SVG dışa aktarılamadı: ' + e.message, true); }
    },

    savePNG() {
      try {
        const url = ED.exportPNG();
        const a = document.createElement('a');
        a.href = url; a.download = this.fileName('png');
        document.body.appendChild(a); a.click(); a.remove();
        this.toast('PNG indirildi (2D plan)');
      } catch (e) { this.toast('PNG dışa aktarılamadı: ' + e.message, true); }
    },

    /* ---------------- durum çubuğu ---------------- */
    bindStatus() {
      this.updateStatus();
    },

    onPointer(d) {
      $('#stCoord').textContent = 'x ' + fmt(d.x, 2) + ' · y ' + fmt(d.y, 2) + ' m';
      if (d.snap) $('#stSnap').textContent = d.snap;
    },

    updateStatus() {
      const rooms = NF.rooms(NF.project);
      const total = rooms.reduce((s, r) => s + r.area, 0);
      $('#stRooms').textContent = rooms.length + ' oda';
      $('#stArea').textContent = fmt(total, 2) + ' m²';
      this.updateZoom();
    },

    updateZoom() {
      $('#zoomPct').textContent = Math.round(ED.view.scale / 70 * 100) + '%';
    },

    updateHistoryButtons() {
      $('#btnUndo').disabled = !NF.canUndo;
      $('#btnRedo').disabled = !NF.canRedo;
    },

    onSaved(d) {
      const el = $('#stSave');
      if (d.error) { el.textContent = 'kayıt hatası'; el.className = 'save-wait'; return; }
      const t = new Date();
      el.textContent = 'kaydedildi ' + String(t.getHours()).padStart(2, '0') + ':' + String(t.getMinutes()).padStart(2, '0') + ':' + String(t.getSeconds()).padStart(2, '0');
      el.className = 'save-ok';
    },

    toast(text, error) {
      if (!this.toastEl) return;
      this.toastEl.textContent = text;
      this.toastEl.classList.toggle('err', !!error);
      this.toastEl.classList.add('show');
      clearTimeout(this.toastTimer);
      this.toastTimer = setTimeout(() => this.toastEl.classList.remove('show'), 2800);
    }
  };

  global.APP = APP;

  document.addEventListener('DOMContentLoaded', () => {
    try {
      APP.init();
    } catch (e) {
      console.error(e);
      const box = document.getElementById('toast');
      if (box) { box.textContent = 'Başlatma hatası: ' + e.message; box.classList.add('show', 'err'); }
    }
  });
})(window);
