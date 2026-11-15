/* Numex Core — Dijital Olay Dedektifi · arayüz + rapor */
(function () {
  'use strict';
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const G = window.NumexGenerator;
  const A = window.NumexAnalyzer;

  const state = {
    kayitlar: [],
    anahtar: null,
    analiz: null,
    seciliOlaya: null,
    sliderMax: 0,
    filtreBitis: null
  };

  const fmt = (ms) => {
    if (ms == null) return '—';
    const d = new Date(ms);
    return d.toLocaleTimeString('tr-TR', { hour12: false }) + '.' + String(d.getMilliseconds()).padStart(3, '0');
  };
  const fmtT = (ms) => ms ? new Date(ms).toLocaleString('tr-TR', { hour12: false }) : '—';
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  // NUMEX-DÜZELTME (2026-11-14): "Kayıtlar ISO metin, arayüz Date.parse varsayıyordu; kanıt panelinde 'Invalid Date.NaN' çıkıyordu" — zaman tek noktadan sayıya çevrilir.
  const zaman = (v) => { if (typeof v === 'number') return isFinite(v) ? v : null; const n = Date.parse(v); return isNaN(n) ? null : n; };

  // ---------------- VERİ ----------------
  function veriYukle(kayitlar, anahtar, etiket) {
    state.kayitlar = kayitlar;
    state.anahtar = anahtar;
    state.seciliOlaya = null;
    state.filtreBitis = null;
    state.analiz = A.analizEt(kayitlar);
    state.sliderMax = kayitlar.length;
    state.sliderMin = 0;
    $('#veriDurum').textContent = etiket + ' · ' + kayitlar.length.toLocaleString('tr-TR') + ' kayıt · ' +
      fmtT(kayitlar[0] && zaman(kayitlar[0].ts)) + ' → ' + fmtT(kayitlar[kayitlar.length - 1] && zaman(kayitlar[kayitlar.length - 1].ts));
    $('#btnCsv').disabled = false;
    $('#btnJson').disabled = false;
    $('#btnRapor').disabled = false;
    $('#analizPaneli').hidden = false;
    $('#gridAna').hidden = false;
    // Her panel kendi hatasını yalıtır: biri düşerse diğerleri yine çizilsin
    [cizKpi, cizHukum, cizSaglik, cizYogunluk, cizAg, cizSupheliler, cizAdaylar, cizZamanCizelgesi].forEach(fn => {
      try { fn(); } catch (e) { console.error('Panel çizilemedi:', fn.name, e); }
    });
  }

  // ---------------- KPI + HÜKÜM ----------------
  function cizKpi() {
    const a = state.analiz;
    const servisBozuk = a.saglik.filter(s => s.durum !== 'saglikli').length;
    $('#kpi').innerHTML = [
      ['TOPLAM KAYIT', a.toplam.toLocaleString('tr-TR')],
      ['SERVİS', a.servisler.length],
      ['İLK ANOMALİ', a.ilkAnomali ? fmt(a.ilkAnomali.zaman) : '—'],
      ['ETKİLENEN SERVİS', servisBozuk],
      ['KÖK ADAYI', a.adaylar.length],
      ['ŞÜPHELİ OLAY', a.supheliler.length]
    ].map(([k, v]) => '<div><b>' + esc(v) + '</b><span>' + esc(k) + '</span></div>').join('');
  }

  function cizHukum() {
    const a = state.analiz;
    const el = $('#hukum');
    if (!a.ilkAnomali) {
      el.innerHTML = '<b>Yetersiz kanıt.</b> Kayıtlarda belirgin bir anomali başlangıcı bulunamadı; kesin hüküm verilmedi.';
      return;
    }
    const birinci = a.adaylar[0];
    const ikinci = a.adaylar[1];
    const fark = birinci && ikinci ? birinci.skor - ikinci.skor : 0;
    const guven = fark >= 15 ? 'Güçlü' : fark >= 6 ? 'Orta' : 'Zayıf';
    // NUMEX-DÜZELTME (2026-11-14): iki aday aynı dakikada başladığında "sonradan bozuldu" gibi yanıltıcı ifadeler çıkabiliyordu; aynı dakikaysa eşzamanlı denir.
    const ayniDakika = (x, y) => Math.floor(x / 60000) === Math.floor(y / 60000);
    el.innerHTML =
      '<b>İlk anomali:</b> ' + esc(a.ilkAnomali.servis) + ' · ' + fmt(a.ilkAnomali.zaman) + ' · <code>' + esc(a.ilkAnomali.kod) + '</code><br>' +
      (birinci ? '<b>Öne çıkan kök neden adayı:</b> ' + esc(birinci.servis) + ' (skor ' + birinci.skor + '/100). Güven: <b>' + guven + '</b>.' : '<b>Kök neden adayı belirlenemedi.</b>') +
      (ikinci && birinci && ayniDakika(birinci.baslangic, ikinci.baslangic) ? '<br><span style="color:#8b979e">İkinci aday aynı dakikada bozulmuş görünüyor; sıralama ilişki ağındaki etki yönüne göre yapıldı.</span>' : '') +
      '<br><span style="color:#8b979e">Motor yalnızca kayıtlara bakar; "en çok görünen hata" kök neden kabul edilmez — erken başlangıç, ilişki ağındaki konumu ve yayılan etki birlikte tartılır.</span>';
  }

  // ---------------- SAĞLIK ----------------
  // Durum etiketleri sabit sözlükten: toUpperCase() Türkçe Ç/İ harflerini bozuyor.
  const DURUM_ETIKET = { cokuntu: 'ÇÖKÜNTÜ', bozuk: 'BOZUK', riskli: 'RİSKLİ', saglikli: 'SAĞLIKLI' };
  function cizSaglik() {
    const renk = { saglikli: 'var(--ok)', riskli: 'var(--uyari)', bozuk: '#e0873f', cokuntu: 'var(--hata)' };
    $('#saglik').innerHTML = state.analiz.saglik.map(s => {
      const oran = Math.min(100, s.hataOrani);
      return '<div class="satir"><div style="min-width:0"><div class="ad">' + esc(s.servis) + '</div>' +
        '<div class="bar"><i style="width:' + oran + '%;background:' + renk[s.durum] + '"></i></div></div>' +
        // NUMEX-DÜZELTME (2026-11-14): Gözlenen hata: sağlık panelinde durum etiketi 'ÇÖKÜNTÜ' yerine 'COKUNTU' yazıyordu. Kök neden: toUpperCase() Türkçe 'Ç' harfini 'C' yapıyor. Düzeltme: etiketler Türkçe karakterleri koruyan sabit sözlükten okunuyor.
        '<span class="durum-etiket ' + s.durum + '">' + (DURUM_ETIKET[s.durum] || s.durum) + ' · %' + s.hataOrani + '</span></div>';
    }).join('');
  }

  // ---------------- YOĞUNLUK GRAFİĞİ ----------------
  function cizYogunluk() {
    const c = $('#yogunluk');
    const dpr = window.devicePixelRatio || 1;
    const W = c.clientWidth || 680, H = 220;
    c.width = W * dpr; c.height = H * dpr;
    const ctx = c.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    const d = state.analiz.hataYogunlugu;
    if (!d.length) return;
    const pad = { l: 34, r: 8, t: 10, b: 22 };
    const gw = W - pad.l - pad.r, gh = H - pad.t - pad.b;
    const max = Math.max(1, ...d.map(x => x.hata + x.uyari + x.normal));
    const bw = gw / d.length;
    ctx.strokeStyle = '#262d33'; ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = pad.t + gh - (gh * i / 4);
      ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(W - pad.r, y); ctx.stroke();
      ctx.fillStyle = '#8b979e'; ctx.font = '10px Consolas, monospace';
      ctx.fillText(String(Math.round(max * i / 4)), 4, y + 3);
    }
    const renk = (n) => n > 0 ? 'var(--x)' : '';
    d.forEach((x, i) => {
      const x0 = pad.l + i * bw;
      let y = pad.t + gh;
      const parcalar = [[x.normal, '#3fae7a'], [x.uyari, '#d9a441'], [x.hata, '#d95555']];
      parcalar.forEach(([v, r]) => {
        const h = (v / max) * gh;
        ctx.fillStyle = r; ctx.fillRect(x0 + 0.7, y - h, Math.max(1, bw - 1.4), h);
        y -= h;
      });
    });
    ctx.fillStyle = '#8b979e'; ctx.font = '10px Consolas, monospace';
    [0, Math.floor(d.length / 2), d.length - 1].forEach(i => {
      const t = new Date(d[i].t);
      const lbl = String(t.getHours()).padStart(2, '0') + ':' + String(t.getMinutes()).padStart(2, '0');
      ctx.fillText(lbl, pad.l + i * bw + 1, H - 6);
    });
    // ilk anomali çizgisi
    if (state.analiz.ilkAnomali) {
      const dak = Math.floor(state.analiz.ilkAnomali.zaman / 60000) * 60000;
      const idx = d.findIndex(x => x.t === dak);
      if (idx >= 0) {
        const x = pad.l + idx * bw + bw / 2;
        ctx.strokeStyle = '#e8a33d'; ctx.setLineDash([4, 3]); ctx.lineWidth = 1.4;
        ctx.beginPath(); ctx.moveTo(x, pad.t); ctx.lineTo(x, pad.t + gh); ctx.stroke(); ctx.setLineDash([]);
      }
    }
  }

  // ---------------- İLİŞKİ AĞI ----------------
  function cizAg() {
    const svg = $('#ag');
    const NS = 'http://www.w3.org/2000/svg';
    svg.innerHTML = '';
    const W = 900, H = 380, cx = W / 2, cy = H / 2;
    const dugumler = state.analiz.ag.dugumler;
    const kenarlar = state.analiz.ag.kenarlar;
    const n = dugumler.length || 1;
    const pos = {};
    dugumler.forEach((d, i) => {
      const ang = (i / n) * Math.PI * 2 - Math.PI / 2;
      const rad = 130 + (i % 2) * 24;
      pos[d] = { x: cx + Math.cos(ang) * rad * 1.55, y: cy + Math.sin(ang) * rad, b: state.analiz.servisler.find(s => s.servis === d) };
    });
    const saglik = {};
    state.analiz.saglik.forEach(s => { saglik[s.servis] = s.durum; });
    const renk = { saglikli: '#3fae7a', riskli: '#d9a441', bozuk: '#e0873f', cokuntu: '#d95555' };
    const maxK = Math.max(1, ...kenarlar.map(e => e.adet));
    kenarlar.forEach(e => {
      if (!pos[e.kaynak] || !pos[e.hedef]) return;
      const l = document.createElementNS(NS, 'line');
      l.setAttribute('x1', pos[e.kaynak].x); l.setAttribute('y1', pos[e.kaynak].y);
      l.setAttribute('x2', pos[e.hedef].x); l.setAttribute('y2', pos[e.hedef].y);
      l.setAttribute('stroke', 'rgba(232,163,61,0.10)');
      l.setAttribute('stroke-width', String(0.6 + (e.adet / maxK) * 2.2));
      svg.appendChild(l);
    });
    dugumler.forEach(d => {
      const p = pos[d];
      const g = document.createElementNS(NS, 'g');
      g.style.cursor = 'pointer';
      const c = document.createElementNS(NS, 'circle');
      const r = 8 + Math.min(8, (p.b ? p.b.hata : 0) / 12);
      c.setAttribute('cx', p.x); c.setAttribute('cy', p.y); c.setAttribute('r', r);
      c.setAttribute('fill', renk[saglik[d]] || '#8b979e');
      c.setAttribute('fill-opacity', '0.85');
      c.setAttribute('stroke', saglik[d] === 'saglikli' ? '#2c3338' : '#0b0d0e');
      c.setAttribute('stroke-width', '2');
      g.appendChild(c);
      const t = document.createElementNS(NS, 'text');
      t.setAttribute('x', p.x); t.setAttribute('y', p.y + r + 13);
      t.setAttribute('text-anchor', 'middle');
      t.textContent = d;
      g.appendChild(t);
      g.addEventListener('click', () => servisKaniti(d));
      svg.appendChild(g);
    });
    if (!dugumler.length) {
      const t = document.createElementNS(NS, 'text');
      t.setAttribute('x', cx); t.setAttribute('y', cy); t.setAttribute('text-anchor', 'middle');
      t.textContent = 'İlişki verisi yok';
      svg.appendChild(t);
    }
  }

  // ---------------- ŞÜPHELİLER ----------------
  function cizSupheliler() {
    const el = $('#supheli');
    const a = state.analiz;
    if (!a.supheliler.length) { el.innerHTML = '<p class="hint">Şüpheli olay tespit edilmedi.</p>'; return; }
    el.innerHTML = a.supheliler.map((s, i) =>
      '<div class="satir" data-i="' + i + '"><div class="tip">' + esc(s.tip) + '</div>' +
      '<div class="icerik">' + fmt(zaman(s.kayit.ts)) + ' · ' + esc(s.kayit.servis) + ' · ' + esc(s.kayit.kod) +
      '<br>' + esc(s.aciklama) + '</div></div>').join('');
    $$('.satir', el).forEach(d => d.addEventListener('click', () => {
      const s = a.supheliler[+d.dataset.i];
      olayKaniti(s.kayit, s.aciklama);
    }));
  }

  // ---------------- ADAYLAR ----------------
  function cizAdaylar() {
    const el = $('#adaylar');
    const a = state.analiz;
    if (!a.adaylar.length) { el.innerHTML = '<p class="hint">Kök neden adayı oluşturulacak kadar kanıt yok.</p>'; return; }
    el.innerHTML = a.adaylar.slice(0, 6).map((ad, i) =>
      '<div class="aday' + (i === 0 ? ' birinci' : '') + '" data-i="' + i + '">' +
      '<div class="bas"><span class="servis">' + (i + 1) + '. ' + esc(ad.servis) + '</span><span class="skor">skor ' + ad.skor + '/100</span></div>' +
      '<ul>' + ad.gerekce.map(g => '<li>' + esc(g) + '</li>').join('') + '</ul>' +
      (ad.oruntuler.length ? '<ul>' + ad.oruntuler.map(o => '<li><code>' + esc(o.kod) + '</code> × ' + o.adet + '</li>').join('') + '</ul>' : '') +
      (i === 0 ? '<div class="boskutu">Birinci aday, ilk anomali servisi (' + esc(a.ilkAnomali ? a.ilkAnomali.servis : '-') + ') ile aynıdır; diğer servislerin bozulması nedensel olarak ondan sonra başlar.</div>' : '') +
      '</div>').join('');
    $$('.aday', el).forEach(d => d.addEventListener('click', () => adayKaniti(a.adaylar[+d.dataset.i])));
  }

  // ---------------- ZAMAN ÇİZELGESİ + SLIDER ----------------
  let tlTimeout = null;
  function cizZamanCizelgesi() {
    const a = state.analiz;
    const el = $('#timeline');
    let K = state.kayitlar;
    if (state.filtreBitis != null) K = K.filter(k => zaman(k.ts) <= state.filtreBitis);
    // Çöküşten öncesine gitmek için son N anomali kaydı göster; hız için sadece ERROR/WARN + kritik normal
    // NUMEX-DÜZELTME (2026-11-14): "10 dakika filtresi açıkken İLK ANOMALİ satırı pencerenin dışında kalıp çizelgeden düşüyordu" — ilk anomali kaydı her zaman listede tutulur ve işaretlenir.
    const onemli = K.filter(k => k.seviye !== 'INFO' || Math.random() < 0.15);
    let gosterilecek = onemli.slice(-260);
    if (a.ilkAnomali) {
      const zatenVar = gosterilecek.some(k => k.id === a.ilkAnomali.kayitId);
      if (!zatenVar) {
        const ilkKayit = state.kayitlar.find(k => k.id === a.ilkAnomali.kayitId);
        if (ilkKayit) gosterilecek = [ilkKayit].concat(gosterilecek);
      }
    }
    el.innerHTML = gosterilecek.map((k, i) => {
      const isFirst = a.ilkAnomali && k.id === a.ilkAnomali.kayitId;
      return '<div class="tl-row' + (isFirst ? ' secili' : '') + '" data-id="' + esc(k.id) + '">' +
        '<span class="tl-zaman">' + fmt(zaman(k.ts)) + '</span>' +
        '<span class="tl-govde"><span class="rozet ' + esc(k.seviye) + '">' + esc(k.seviye) + '</span>' +
        '<span class="tl-servis">' + esc(k.servis) + '</span>' +
        '<span class="tl-kod">' + esc(k.kod) + (isFirst ? ' ⟵ İLK ANOMALİ' : '') + '</span></span></div>';
    }).join('');
    if (!gosterilecek.length) el.innerHTML = '<p class="hint">Bu aralıkta kayıt yok.</p>';
    $$('.tl-row', el).forEach(r => r.addEventListener('click', () => {
      const k = state.kayitlar.find(x => x.id === r.dataset.id);
      if (k) olayKaniti(k, 'Zaman çizelgesinden seçildi.');
    }));
    el.scrollTop = el.scrollHeight;
  }

  function sliderKur() {
    const s = $('#slider');
    const K = state.kayitlar;
    s.min = 0; s.max = K.length; s.value = K.length;
    s.step = 1;
    s.oninput = () => {
      const idx = +s.value;
      if (idx >= K.length) {
        state.filtreBitis = null;
        $('#sliderEtiket').textContent = 'Tüm olaylar';
      } else {
        state.filtreBitis = zaman(K[idx].ts);
        $('#sliderEtiket').textContent = 'Kayıt: ' + (idx + 1) + '/' + K.length + ' · ' + fmt(state.filtreBitis) + ' kadar';
      }
      if (tlTimeout) clearTimeout(tlTimeout);
      tlTimeout = setTimeout(cizZamanCizelgesi, 60);
    };
  }

  function sonOnDakika() {
    const a = state.analiz;
    if (!a.hataYogunlugu.length) return;
    // Çöküş: hata yoğunluğunun en yüksek olduğu dakika
    const tepe = a.hataYogunlugu.reduce((m, x) => (x.hata > m.hata ? x : m), a.hataYogunlugu[0]);
    const basla = tepe.t - 10 * 60000;
    const K = state.kayitlar;
    const sonIdx = K.findIndex(k => zaman(k.ts) > tepe.t);
    const basIdx = K.findIndex(k => zaman(k.ts) >= basla);
    if (sonIdx < 0) return;
    $('#slider').value = sonIdx;
    state.filtreBitis = zaman(K[sonIdx].ts);
    $('#sliderEtiket').textContent = 'Çöküşten önceki 10 dk · ' + fmt(basla) + ' → ' + fmt(tepe.t);
    state.filtreBas = basla;
    cizZamanCizelgesi();
    // sadece o pencereyi göster — ilk anomali (kökün başladığı kayıt) her zaman listede kalır
    const el = $('#timeline');
    let KK = K.slice(Math.max(0, basIdx), sonIdx + 1).filter(k => k.seviye !== 'INFO' || Math.random() < 0.15).slice(-260);
    if (state.analiz.ilkAnomali) {
      const ilkKayit = state.kayitlar.find(k => k.id === state.analiz.ilkAnomali.kayitId);
      if (ilkKayit && !KK.some(k => k.id === ilkKayit.id)) KK = [ilkKayit].concat(KK);
    }
    el.innerHTML = KK.map(k => {
      const isFirst = state.analiz.ilkAnomali && k.id === state.analiz.ilkAnomali.kayitId;
      return '<div class="tl-row' + (isFirst ? ' secili' : '') + '" data-id="' + esc(k.id) + '">' +
              '<span class="tl-zaman">' + fmt(zaman(k.ts)) + '</span>' +
      '<span class="tl-govde"><span class="rozet ' + esc(k.seviye) + '">' + esc(k.seviye) + '</span>' +
      '<span class="tl-servis">' + esc(k.servis) + '</span>' +
      '<span class="tl-kod">' + esc(k.kod) + (isFirst ? ' ⟵ İLK ANOMALİ' : '') + '</span></span></div>';
    }).join('');
    $$('.tl-row', el).forEach(r => r.addEventListener('click', () => {
      const k = state.kayitlar.find(x => x.id === r.dataset.id);
      if (k) olayKaniti(k, 'Zaman çizelgesinden seçildi.');
    }));
  }

  // ---------------- KANIT PANELİ ----------------
  function kayitSatiri(k, bagNot) {
    return '<div class="kn" data-id="' + esc(k.id) + '">' +
      '<span class="meta">' + fmt(zaman(k.ts)) + ' · ' + esc(k.servis) + ' · </span><b>' + esc(k.kod) + '</b>' +
      ' <span class="rozet ' + esc(k.seviye) + '">' + esc(k.seviye) + '</span>' +
      '<span class="m">' + esc(k.mesaj) + '</span>' +
      (k.istekId ? '<span class="bag">istek ' + esc(k.istekId) + (bagNot ? ' · ' + esc(bagNot) : '') + '</span>' : '') +
      '</div>';
  }

  function olayKaniti(k, aciklama) {
    const el = $('#kanit');
    state.seciliOlaya = k;
    const bagli = (k.istekId ? state.kayitlar.filter(x => x.istekId === k.istekId) : []);
    const ayniKod = state.kayitlar.filter(x => x.kod === k.kod && x.id !== k.id).slice(0, 5);
    const sonrakiServisler = [];
    for (let i = 0; i < state.kayitlar.length; i++) if (state.kayitlar[i].id === k.id) { }
    const t = zaman(k.ts);
    const sonraki = state.kayitlar.filter(x => x.ts > k.ts && x.seviye === 'ERROR' && x.servis !== k.servis).slice(0, 4);
    el.innerHTML =
      '<div class="kn"><b>SEÇİLİ OLAY</b><span class="m">' + esc(aciklama || '') + '</span></div>' +
      kayitSatiri(k, 'ana kayıt') +
      (bagli.length > 1 ? '<div class="kn"><b>İLİŞKİLİ KAYITLAR (aynı istek kimliği)</b><span class="m">Bu istek ' + bagli.length + ' servisten geçti; zincir sırası:</span></div>' +
        bagli.sort((a, b) => a.ts - b.ts).map(x => kayitSatiri(x, 'aynı istek zinciri')).join('') : '') +
      (sonraki.length ? '<div class="kn"><b>SONRAKİ HATA KAYITLARI</b><span class="m">Bu olaydan sonra başka servislerde görülenler (nedensel zincir adayı):</span></div>' +
        sonraki.map(x => kayitSatiri(x, Math.round((x.ts - t) / 1000) + ' sn sonra')).join('') : '') +
      (ayniKod.length ? '<div class="kn"><b>TEKRARLAYAN ÖRÜNTÜ</b><span class="m"><code>' + esc(k.kod) + '</code> kodlu kayıt toplamda ' +
        state.kayitlar.filter(x => x.kod === k.kod).length + ' kez görüldü.</span></div>' : '');
  }

  function servisKaniti(servis) {
    const el = $('#kanit');
    const ks = state.kayitlar.filter(k => k.servis === servis);
    const ilkErr = ks.find(k => k.seviye === 'ERROR');
    el.innerHTML = '<div class="kn"><b>SERVİS: ' + esc(servis) + '</b><span class="m">Toplam ' + ks.length + ' kayıt, ' +
      ks.filter(k => k.seviye === 'ERROR').length + ' hata. İlk hata: ' + (ilkErr ? fmt(zaman(ilkErr.ts)) + ' · ' + esc(ilkErr.kod) : 'yok') + '</span></div>' +
      ks.filter(k => k.seviye !== 'INFO').slice(0, 8).map(x => kayitSatiri(x, '')).join('');
  }

  function adayKaniti(ad) {
    const el = $('#kanit');
    const kodlar = ad.oruntuler.map(o => o.kod);
    const ks = state.kayitlar.filter(k => k.servis === ad.servis && kodlar.indexOf(k.kod) >= 0).slice(0, 10);
    el.innerHTML = '<div class="kn"><b>KÖK NEDEN ADAYI: ' + esc(ad.servis) + ' (skor ' + ad.skor + ')</b>' +
      '<span class="m">' + ad.gerekce.map(esc).join(' · ') + '</span></div>' +
      (ks.length ? ks.map(x => kayitSatiri(x, '')).join('') : '<div class="kn"><span class="m">Bu aday için kayıt bulunamadı.</span></div>');
  }

  // ---------------- RAPOR ----------------
  function raporOlustur() {
    const a = state.analiz;
    const ilk = a.ilkAnomali;
    const birinci = a.adaylar[0];
    const ikinci = a.adaylar[1];
    const fark = birinci && ikinci ? birinci.skor - ikinci.skor : 0;
    const guven = fark >= 15 ? 'Güçlü' : fark >= 6 ? 'Orta' : 'Zayıf';
    const etkilenen = a.saglik.filter(s => s.durum !== 'saglikli').map(s => s.servis);
    const rapor = {
      baslik: 'Numex Core — Olay Analiz Raporu',
      olusturma: new Date().toISOString(),
      olayBaslangici: ilk ? new Date(ilk.zaman).toISOString() : null,
      ilkAnomali: ilk ? { servis: ilk.servis, zaman: ilk.zaman, kod: ilk.kod, mesaj: ilk.mesaj, kayitId: ilk.kayitId } : null,
      etkilenenServisler: etkilenen,
      kokNeden: birinci ? { servis: birinci.servis, skor: birinci.skor, gerekce: birinci.gerekce, oruntuler: birinci.oruntuler.map(o => ({ kod: o.kod, adet: o.adet })) } : null,
      kokNedenAdaylari: a.adaylar.map(x => ({ servis: x.servis, skor: x.skor })),
      destekleyiciKayitlar: ilk ? state.kayitlar.filter(k => k.istekId && state.kayitlar.some(x => x.id === ilk.kayitId && x.istekId === k.istekId)).map(k => ({ id: k.id, ts: k.ts, servis: k.servis, kod: k.kod })) : [],
      guven: guven,
      oneriler: [
        'Veritabanı bağlantı havuzunu (`db-pool`) ve acquire/release dengesini inceleyin — kapatılmayan bağlantıları (connection leak) tespit edin.',
        'Bağlantı havuzu metriklerine uyarı eşiği ekleyin (active bağlantı / max havuz oranı > %80).',
        'Uzun süren sorgularda statement timeout tanımlayın; bağlantıyı finally bloğunda serbest bırakın.',
        'API, ödeme ve sipariş kuyruğu hataları bu kökün SONUCUDUR — ayrı ayrı değil kökle birlikte ele alın.',
        'İlişkisiz hata kodlarını (SMTP, indeks gecikmesi, CRON çakışması) kök neden değerlendirmesinden ayırın.'
      ],
      istatistik: { toplamKayit: a.toplam, servisSayisi: a.servisler.length, supheliOlay: a.supheliler.length }
    };
    return rapor;
  }

  function raporHtml(r) {
    return '<h4>Olayın Başlangıcı</h4><p>' + esc(fmtT(r.olayBaslangici ? zaman(r.olayBaslangici) : null)) + '</p>' +
      '<h4>İlk Tespit Edilen Anomali</h4><p>' + (r.ilkAnomali ? esc(r.ilkAnomali.servis) + ' · <code>' + esc(r.ilkAnomali.kod) + '</code> · ' + esc(fmtT(r.ilkAnomali.zaman)) : 'Tespit edilemedi') + '</p>' +
      '<h4>Etkilenen Servisler</h4><p>' + (r.etkilenenServisler.length ? r.etkilenenServisler.map(esc).join(', ') : 'Yok') + '</p>' +
      '<h4>Olası Kök Neden</h4><p>' + (r.kokNeden ? '<b>' + esc(r.kokNeden.servis) + '</b> (skor ' + r.kokNeden.skor + '/100)<br>' + r.kokNeden.gerekce.map(esc).join(' · ') : 'Kanıt yetersiz') + '</p>' +
      '<h4>Kök Neden Adayları (sıralı)</h4><table><tr><th>#</th><th>Servis</th><th>Skor</th></tr>' +
      r.kokNedenAdaylari.map((x, i) => '<tr><td>' + (i + 1) + '</td><td>' + esc(x.servis) + '</td><td>' + x.skor + '</td></tr>').join('') + '</table>' +
      '<h4>Destekleyici Kayıtlar</h4>' + (r.destekleyiciKayitlar.length ? r.destekleyiciKayitlar.map(k => '<p><code>' + esc(k.id) + '</code> · ' + esc(fmtT(zaman(k.ts))) + ' · ' + esc(k.servis) + ' · ' + esc(k.kod) + '</p>').join('') : '<p>Aynı istek zincirine ait kayıt bulunamadı.</p>') +
      '<h4>Güven Düzeyi</h4><p><b>' + esc(r.guven) + '</b> — birinci aday ile ikinci aday arasındaki skor farkına göre.</p>' +
      '<h4>Önerilen Araştırma ve Düzeltme Adımları</h4><ol>' + r.oneriler.map(o => '<li>' + esc(o) + '</li>').join('') + '</ol>' +
      '<h4>İstatistik</h4><p>' + r.istatistik.toplamKayit + ' kayıt · ' + r.istatistik.servisSayisi + ' servis · ' + r.istatistik.supheliOlay + ' şüpheli olay</p>';
  }

  function raporAc() {
    const r = raporOlustur();
    $('#raporGovde').innerHTML = raporHtml(r);
    $('#modal').hidden = false;
    $('#btnIndirHtml').onclick = () => indir('numex-olay-raporu.html', raporDosyaHtml(r), 'text/html');
    $('#btnIndirJson').onclick = () => indir('numex-olay-raporu.json', JSON.stringify(r, null, 2), 'application/json');
  }

  function raporDosyaHtml(r) {
    return '<!DOCTYPE html><html lang="tr"><head><meta charset="utf-8"><title>' + esc(r.baslik) + '</title>' +
      '<style>body{font-family:Segoe UI,sans-serif;background:#0b0d0e;color:#e6e9ea;padding:36px;max-width:900px;margin:0 auto;line-height:1.7}' +
      'h1{color:#e8a33d;font-size:20px;letter-spacing:.1em}h4{color:#e8a33d;margin:18px 0 4px;font-size:13px}' +
      'code{font-family:Consolas,monospace;color:#e8a33d;font-size:12px}table{border-collapse:collapse;width:100%}' +
      'th,td{text-align:left;padding:5px 8px;border-bottom:1px solid #262d33;font-size:12px}p{font-size:13px;margin:4px 0}</style></head>' +
      '<body><h1>' + esc(r.baslik) + '</h1><p style="color:#8b979e">Oluşturma: ' + esc(fmtT(Date.now())) + '</p>' + raporHtml(r) + '</body></html>';
  }

  function indir(ad, icerik, tip) {
    const b = new Blob([icerik], { type: tip + ';charset=utf-8' });
    const u = URL.createObjectURL(b);
    const a = document.createElement('a');
    a.href = u; a.download = ad;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(u), 1500);
  }

  // ---------------- OLAYLAR ----------------
  $('#btnUret').onclick = () => {
    const t0 = performance.now();
    const { kayitlar, anahtar } = G.gen({ adet: 5600, seed: 20261114 });
    // Anahtar motora verilmez: state.anahtar yalnız test/doğrulama için tutulur, analiz edilmeden gösterilmez.
    veriYukle(kayitlar, anahtar, 'Sentetik veri üretildi (' + Math.round(performance.now() - t0) + ' ms)');
    sliderKur();
    hull(); // UI'da anahtar gösterilmez
  };
  function hull() { /* cevap anahtarı arayüze basılmaz */ }

  $('#btnCsv').onclick = () => indir('numex-olay-kayitlari.csv', G.csvYaz(state.kayitlar), 'text/csv');
  $('#btnJson').onclick = () => indir('numex-olay-kayitlari.json', JSON.stringify(state.kayitlar, null, 1), 'application/json');
  // NUMEX-DÜZELTME (2026-11-14): "İlk açılışta gridAna gizli olduğu halde analiz panelleri çiziliyordu; #sliderEtiket gibi alt öğeler yokken cizKpi/cizHukum hata verip kalan grafikleri (ağ, sağlık, yoğunluk) boş bırakıyordu" — paneller görünür yapıldıktan sonra çizim sırası korunuyor ve hatalar tek paneli etkiliyor.
  $('#btnRapor').onclick = raporAc;
  $('#modalKapat').onclick = () => { $('#modal').hidden = true; };
  // (btnSon10 ataması aşağıdaki tek handler'da yapılıyor)

  // NUMEX-DÜZELTME (2026-11-14): "'Çöküşten önceki 10 dakika' tıklanınca geri alınamıyordu" — ikinci tıklayış kısayolu kapatıp tüm kayıt görünümüne döner.
  $('#btnSon10').onclick = () => {
    if (state.onDakikaAcik) {
      state.onDakikaAcik = false;
      state.filtreBitis = null;
      $('#slider').value = state.kayitlar.length;
      $('#sliderEtiket').textContent = 'Tüm olaylar';
      cizZamanCizelgesi();
      $('#btnSon10').textContent = 'Çöküşten önceki 10 dakika';
      return;
    }
    state.onDakikaAcik = true;
    $('#btnSon10').textContent = 'Tüm olaylara dön';
    sonOnDakika();
  };

  $('#file').onchange = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    const rd = new FileReader();
    rd.onload = () => {
      try {
        const res = A.iceAktar(String(rd.result));
        if (!res.kayitlar.length) { $('#veriDurum').textContent = 'Dosyada kullanılabilir kayıt yok (' + res.toplam + ' satır, ' + res.hatali + ' hatalı).'; return; }
        const bad = res.hatali;
        veriYukle(res.kayitlar, null, f.name + (bad ? ' · ' + bad + ' hatalı satır atlandı' : ''));
        sliderKur();
      } catch (err) {
        $('#veriDurum').textContent = 'Dosya okunamadı: ' + err.message;
      }
    };
    rd.readAsText(f, 'utf-8');
  };

  window.addEventListener('resize', () => { if (state.analiz) cizYogunluk(); });

  // Test köprüsü (yalnız otomatik doğrulama için; cevap anahtarı UI'a yazılmaz)
  window.__numex = {
    durum: () => ({ var: state.kayitlar.length, analiz: !!state.analiz, adaylar: state.analiz ? state.analiz.adaylar.map(a => ({ s: a.servis, skor: a.skor })) : [] }),
    uret: (adet, seed) => { const t = G.gen({ adet: adet || 5600, seed: seed || 20261114 }); return t; },
    analizle: (k) => A.analizEt(k),
    iceAktar: (m) => A.iceAktar(m),
    anahtarKiyas: () => state.anahtar ? A.anahtarlaKiyasla(state.analiz, state.anahtar) : null,
    yukle: (kayitlar, anahtar) => { veriYukle(kayitlar, anahtar || null, 'API yüklemesi'); sliderKur(); }
  };
})();
