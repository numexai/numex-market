/* NUMEX FLOORPLAN — bina sınav paneli
 * SCENARIO motorunu plan üzerinde canlı koşar: 5 senaryo, karar, kanıt satırları.
 * Her satır analyse() çıktısından gelir — ölçülmeyen hiçbir şey "geçti" yazmaz.
 */
(function (global) {
  'use strict';
  const NF = global.NF;

  /* bulgu kodlarının insan dilindeki kısa adı */
  const KOD = {
    ODA_YOK: 'Ölçülecek oda yok',
    CIKIS_YOK: 'Çıkış yolu yok',
    UZUN_TAHLIYE: 'Tahliye 20 m üstü',
    TAHLIYE_UZUN: 'Tahliye sınırda',
    CIKIS_KAPI_YOK: 'Dış kapı yok',
    TEK_CIKIS: 'Tek dış kapı',
    DAR_KAPI: 'Dar kapı',
    PENCERE_YOK: 'Pencere yok',
    ISLAK_KAPISIZ: 'Islak hacim kapısız',
    ORTAK_DUVAR: 'Ortak duvar',
    CIKIS_ONU: 'Çıkış önü'
  };

  const fmt = (v, d) => (v === null || v === undefined || !isFinite(v))
    ? '—' : Number(v).toFixed(d === undefined ? 2 : d).replace('.', ',');
  const esc = t => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  const EXAM = {
    res: null, err: null, filter: null, timer: null, open: false,
    panel: null, body: null, btn: null,

    init() {
      this.panel = document.getElementById('examPanel');
      this.body = document.getElementById('examBody');
      this.btn = document.getElementById('btnExam');
      if (!this.panel || !this.body || !this.btn) return;

      this.btn.addEventListener('click', () => this.toggle());
      document.getElementById('examClose').addEventListener('click', () => this.toggle(false));
      document.getElementById('examRerun').addEventListener('click', () => {
        this.run();
        NF.emit('toast', {
          text: this.res
            ? 'Sınav yeniden koşuldu — ' + this.res.metrics.oda + ' oda, ' + this.res.issues.length + ' bulgu'
            : 'Sınav koşulamadı: ' + (this.err || 'bilinmeyen hata'),
          error: !this.res
        });
      });
      document.getElementById('examPaths').addEventListener('change', e => {
        global.ED.examShowPaths = e.target.checked;
        global.ED.invalidate();
      });

      /* canlı ölçüm: her model değişiminde kısa bir gecikmeyle yeniden koş */
      ['change', 'model', 'history'].forEach(ev => NF.on(ev, () => this.schedule()));
      NF.on('examFocus', d => this.focus(d.index, true));

      this.run();
      this.toggle(true);
    },

    schedule() {
      clearTimeout(this.timer);
      this.timer = setTimeout(() => this.run(), 130);
    },

    run() {
      const S = global.SCENARIO;
      if (!S) { this.res = null; this.err = 'Senaryo motoru (scenario.js) yüklenmedi'; this.render(); return; }
      try {
        this.res = S.analyse(NF.project);
        this.err = null;
      } catch (e) {
        this.res = null;
        this.err = e.message;
        console.error('[NUMEX FLOORPLAN] bina sınavı çöktü:', e);
      }
      global.ED.exam = this.res;
      global.ED.examFocus = null;
      global.ED.invalidate();
      this.render();
    },

    toggle(force) {
      this.open = force === undefined ? !this.open : !!force;
      this.panel.hidden = !this.open;
      /* panel açıkken 2D planı panelin kapatmadığı alana sığdır */
      const genislik = this.panel.offsetWidth || 314;
      global.ED.insetRight = this.open ? genislik + 22 : 0;
      global.ED.fit();
      if (this.open) { this.run(); this.render(); }
    },

    karar() {
      const r = this.res;
      if (!r) return { ok: false, text: this.err || 'Ölçüm yapılamadı.' };
      return global.SCENARIO.verdict(r);
    },

    liste() {
      const r = this.res;
      if (!r || !r.issues) return [];
      const all = r.issues.map((is, i) => ({ is, i }));
      if (!this.filter) return all;
      const s = (r.senaryolar || []).find(x => x.id === this.filter);
      if (!s) return all;
      return all.filter(o => s.bulgular.indexOf(o.is) >= 0);
    },

    render() {
      if (!this.panel) return;
      const r = this.res;
      const v = this.karar();
      const kritik = r ? r.issues.filter(i => i.level === 'kritik').length : 0;

      /* üst bardaki düğme her zaman güncel sayıyı taşısın */
      this.btn.textContent = 'Bina Sınavı' + (r ? ' · ' + r.issues.length : '');
      this.btn.classList.toggle('has-critical', kritik > 0);
      this.btn.title = r
        ? (kritik ? kritik + ' kritik bulgu' : 'kritik bulgu yok') + ' · ' + r.issues.length + ' bulgu'
        : 'Ölçüm yapılamadı';

      if (!this.open) return;

      if (!r) {
        this.body.innerHTML = '<div class="exam-verdict bad"><div class="v-title">ÖLÇÜM YOK</div>' +
          '<div class="v-sub">' + esc(this.err || 'Senaryo motoru çalışmadı.') + '</div></div>';
        return;
      }

      const m = r.metrics;
      const list = this.liste();
      const out = [];

      const durum = v.ok ? 'ok' : (v.level === 'uyarı' ? 'warn' : 'bad');
      const baslik = v.ok ? 'SINAVI GEÇTİ' : (v.level === 'uyarı' ? 'KOŞULLU GEÇTİ' : 'SINAVDA KALDI');
      out.push('<div class="exam-verdict ' + durum + '">' +
        '<div class="v-title">' + baslik + '</div>' +
        '<div class="v-sub">' + esc(v.text) + '</div></div>');

      out.push('<div class="exam-metrics">' +
        '<span>oda <b>' + m.oda + '</b></span>' +
        '<span>dış çıkış <b>' + m.cikis + '</b></span>' +
        '<span>en uzun tahliye <b>' + fmt(m.enUzunTahliye) + (m.enUzunTahliye === null ? '' : ' m') + '</b></span>' +
        '<span>alan <b>' + fmt(m.alan) + ' m²</b></span>' +
        '</div>');

      out.push('<div class="exam-scenarios">' + (r.senaryolar || []).map(s =>
        '<button class="sc ' + (s.ok ? 'ok' : 'bad') + (this.filter === s.id ? ' active' : '') + '" data-sen="' + s.id + '">' +
        '<span class="sc-name">' + esc(s.ad) + '</span>' +
        '<span class="sc-tag">' + (s.ok ? 'GEÇTİ' : 'KALDI') + '</span>' +
        '<span class="sc-n">' + s.kritik + ' kritik · ' + s.uyari + ' uyarı' +
          (this.filter === s.id ? ' · filtre açık (kapatmak için tıkla)' : '') + '</span>' +
        '</button>').join('') + '</div>');

      out.push('<h3>KANIT SATIRLARI <span>' + list.length + '</span></h3>');

      out.push('<div class="exam-issues">' + (list.length
        ? list.map(o =>
          '<button class="ev lv-' + o.is.level + '" data-i="' + o.i + '">' +
          '<i>' + (o.i + 1) + '</i>' +
          '<span><b>' + esc(KOD[o.is.code] || o.is.code) + '</b> — ' + esc(o.is.text) + '</span></button>').join('')
        : '<div class="ev temiz"><i>&#10003;</i><span><b>Temiz</b> — bu filtrede bulgu yok.</span></div>') +
        '</div>');

      this.body.innerHTML = out.join('');

      this.body.onclick = e => {
        const sen = e.target.closest('[data-sen]');
        if (sen) {
          this.filter = this.filter === sen.dataset.sen ? null : sen.dataset.sen;
          this.render();
          return;
        }
        const b = e.target.closest('[data-i]');
        if (b) this.focus(+b.dataset.i);
      };
    },

    /** Paneldeki satır ya da haritadaki işaret: o bulguya odaklan. */
    focus(i, haritadan) {
      const r = this.res;
      if (!r || !r.issues[i]) return;
      const is = r.issues[i];
      global.ED.examFocus = i;
      if (is.at) global.ED.centerOn(is.at.x, is.at.y);

      if (this.open) {
        if (haritadan && this.filter) {
          /* haritadan seçildi: filtre satırı gizliyorsa filtreyi kaldır */
          this.filter = null;
          this.render();
        }
        this.body.querySelectorAll('.ev.sel').forEach(el => el.classList.remove('sel'));
        const el = this.body.querySelector('[data-i="' + i + '"]');
        if (el) {
          el.classList.add('sel');
          if (el.scrollIntoView) el.scrollIntoView({ block: 'nearest' });
        }
      }
      global.ED.invalidate();
    }
  };

  global.EXAM = EXAM;
})(window);
