/* Numex Data Story
 * CSV/XLSX içe aktarma · düzenlenebilir tablo · veri kalitesi · grafikler · sürükle-bırak rapor paneli
 * Tüm parasal toplamlar KURUŞ (tam sayı) üzerinden hesaplanır — bir kuruş kaybolmaz.
 */
(function () {
  'use strict';

  const SAVE_KEY = 'numex.datastory.v1';
  const state = {
    columns: [],
    kinds: {},        // { kolon: 'number' | 'text' }
    rows: [],
    widgets: [],
    savedAt: null,
    dirty: false,
    duplicates: new Set(), // yinelenen (ilk hariç) satır indeksleri
    search: ''
  };

  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));

  /* ---------------- biçim & sayı ---------------- */
  function parseNum(v) {
    if (v == null) return null;
    if (typeof v === 'number') return isFinite(v) ? v : null;
    let s = String(v).trim();
    if (!s) return null;
    s = s.replace(/[\s\u00A0₺$€]/g, '').replace(/%$/, '');
    if (s === '' || s === '-') return null;
    if (s.indexOf(',') > -1) s = s.replace(/\./g, '').replace(',', '.');     // 1.234,56
    else if ((s.match(/\./g) || []).length > 1) s = s.replace(/\./g, '');    // 1.234.567
    const n = Number(s);
    return isFinite(n) ? n : null;
  }
  const nf = new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 2 });
  const fmtNum = v => (v == null || v === '' ? '' : nf.format(v));
  // para kolonları her zaman iki haneli gösterilir (muhasebe kuruşu sever)
  const paraKolonu = k => /tutar|fiyat|toplam|ciro|maliyet|ücret|tahsilat|total/i.test(String(k));
  const pf = new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const fmtPara = v => (v == null || v === '' ? '' : pf.format(v));
  const hucreMetni = (k, v) => (state.kinds[k] === 'number' ? (paraKolonu(k) ? fmtPara(v) : fmtNum(v)) : (v == null ? '' : v));
  const kurus = v => Math.round(Number(v) * 100);   // kuruş cinsinden tam sayı

  /* ---------------- kimlik kolonları ---------------- */
  // Telefon, sipariş no, TCKN, IBAN gibi alanlar sayı gibi görünse de TOPLANMAZ.
  // Kırılım (X) olarak kullanılabilir; değer olarak seçilirse kayıt sayısı hesaplanır.
  const ID_ADLARI = ['telefon', 'tel', 'gsm', 'cep', 'phone', 'mobile', 'faks', 'fax', 'tckn',
    'tckimlik', 'kimlik', 'vergi', 'vkn', 'iban', 'hesap', 'posta', 'postal', 'zip', 'plaka',
    'siparis', 'order', 'fatura', 'invoice', 'kod', 'code', 'id', 'uuid', 'seri', 'serino', 'numara', 'no'];
  function idAdi(k) {
    const jetonlar = String(k).toLocaleLowerCase('tr').replace(/[^\p{L}\p{N}]+/gu, ' ').trim().split(' ');
    return jetonlar.some(j => ID_ADLARI.indexOf(j) > -1);
  }
  function idDegerMi(degerler) {
    const dolu = degerler.filter(v => v != null && String(v).trim() !== '').map(v => String(v).trim());
    if (!dolu.length) return false;
    // tarihler telefon sanılmasın
    const tarih = dolu.filter(v => /^\d{4}-\d{2}-\d{2}/.test(v) || /^\d{1,2}[./]\d{1,2}[./]\d{2,4}$/.test(v));
    if (tarih.length / dolu.length >= 0.8) return false;
    const tel = dolu.filter(v => /^[+\d][\d\s\-().]{6,}$/.test(v));
    if (tel.length / dolu.length >= 0.9) {
      if (/^0/.test(dolu[0]) || /^\+/.test(dolu[0]) || /[\s\-()]/.test(dolu[0]) || dolu.every(v => v.length >= 10)) return true;
    }
    const iban = dolu.filter(v => /^[A-Z]{2}\d{2}[A-Z0-9\s]{10,}$/.test(v));
    if (iban.length / dolu.length >= 0.9) return true;
    const hepsiRakam = dolu.every(v => /^\d+$/.test(v));
    if (hepsiRakam && new Set(dolu).size === dolu.length && dolu.every(v => v.length >= 9)) return true;
    return false;
  }

  /* ---------------- CSV / XLSX okuma ---------------- */
  function detectDelimiter(line) {
    const say = { ',': 0, ';': 0, '\t': 0 };
    let tirnak = false;
    for (const ch of line) {
      if (ch === '"') tirnak = !tirnak;
      else if (!tirnak && ch in say) say[ch]++;
    }
    return Object.keys(say).sort((a, b) => say[b] - say[a])[0];
  }

  function parseCSV(text) {
    text = String(text).replace(/^\uFEFF/, '');
    const d = detectDelimiter(text.split(/\r?\n/)[0] || '');
    const satirlar = [];
    let alan = '', satir = [], tirnak = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (tirnak) {
        if (c === '"') {
          if (text[i + 1] === '"') { alan += '"'; i++; } else tirnak = false;
        } else alan += c;
      } else if (c === '"') tirnak = true;
      else if (c === d) { satir.push(alan); alan = ''; }
      else if (c === '\n') { satir.push(alan); satirlar.push(satir); satir = []; alan = ''; }
      else if (c !== '\r') alan += c;
    }
    if (alan !== '' || satir.length) { satir.push(alan); satirlar.push(satir); }
    return satirlar.filter(s => s.some(x => String(x).trim() !== ''));
  }

  function jsonToState(matrix) {
    if (!matrix.length) throw new Error('Dosya boş görünüyor.');
    const basliklar = matrix[0].map((h, i) => {
      const t = String(h == null ? '' : h).trim();
      return t || 'Kolon ' + (i + 1);
    });
    // yinelenen başlıkları tekilleştir
    const gorulen = {};
    const kolonlar = basliklar.map(b => {
      if (gorulen[b] == null) { gorulen[b] = 1; return b; }
      gorulen[b]++;
      return b + ' (' + gorulen[b] + ')';
    });
    const rows = matrix.slice(1).map(g => {
      const o = {};
      kolonlar.forEach((k, i) => { o[k] = g[i] === undefined ? '' : g[i]; });
      return o;
    });
    // tip çıkarımı: number | text | id  (id = kimlik: telefon, sipariş no, TCKN… toplanmaz)
    const kinds = {};
    kolonlar.forEach(k => {
      const degerler = rows.map(r => r[k]);
      if (!paraKolonu(k) && (idAdi(k) || idDegerMi(degerler))) { kinds[k] = 'id'; return; }
      let dolu = 0, sayisal = 0;
      degerler.forEach(v => {
        if (v == null || String(v).trim() === '') return;
        dolu++;
        if (typeof v === 'number' || parseNum(v) != null) sayisal++;
      });
      // tarih benzeri metinler sayıya dönüşmesin
      const tarihMi = degerler.slice(0, 20).some(v => /^\d{4}-\d{2}-\d{2}/.test(String(v || '')));
      kinds[k] = dolu > 0 && sayisal / dolu >= 0.8 && !tarihMi ? 'number' : 'text';
    });
    // sayısal hücreleri gerçek sayıya çevir (kimlik kolonları metin kalır: baştaki 0 kaybolmaz)
    rows.forEach(r => kolonlar.forEach(k => {
      if (kinds[k] === 'id') { r[k] = r[k] == null ? '' : String(r[k]); return; }
      if (kinds[k] !== 'number') { if (r[k] == null) r[k] = ''; return; }
      const n = parseNum(r[k]);
      r[k] = n == null ? '' : n;
    }));
    state.columns = kolonlar;
    state.kinds = kinds;
    state.rows = rows;
  }

  function readFile(file) {
    const ad = (file.name || '').toLowerCase();
    const oku = new FileReader();
    oku.onerror = () => toast('Dosya okunamadı.', 'err');
    oku.onload = () => {
      try {
        if (ad.endsWith('.xlsx') || ad.endsWith('.xls')) {
          const wb = XLSX.read(new Uint8Array(oku.result), { type: 'array', cellDates: false });
          const ws = wb.Sheets[wb.SheetNames[0]];
          jsonToState(XLSX.utils.sheet_to_json(ws, { header: 1, raw: true, defval: '' }));
        } else if (ad.endsWith('.json')) {
          const veri = JSON.parse(oku.result);
          if (veri && veri.columns && veri.rows) { yukleState(veri); }
          else if (Array.isArray(veri)) { jsonToState([Object.keys(veri[0] || {})].concat(veri.map(o => Object.values(o)))); }
          else throw new Error('Tanınmayan JSON biçimi.');
        } else {
          jsonToState(parseCSV(oku.result));
        }
        state.widgets = state.widgets.length ? state.widgets : [];
        onVeriDegisti('“' + file.name + '” yüklendi');
      } catch (e) {
        console.error(e);
        toast('İçe aktarma hatası: ' + e.message, 'err');
      }
    };
    if (ad.endsWith('.xlsx') || ad.endsWith('.xls')) oku.readAsArrayBuffer(file);
    else oku.readAsText(file, 'utf-8');
  }

  /* ---------------- örnek veri (100 satır) ---------------- */
  function ornekVeri() {
    let seed = 42;
    const rnd = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
    const pick = a => a[Math.floor(rnd() * a.length)];
    const bolge = ['Marmara', 'Ege', 'Akdeniz', 'İç Anadolu', 'Karadeniz', 'Doğu Anadolu', 'Güneydoğu'];
    const urun = ['Kahve Makinesi', 'Blender', 'Tost Makinesi', 'Su Isıtıcısı', 'Ekmek Kızartma', 'Mikser'];
    const kanal = ['Mağaza', 'Online', 'Toptan'];
    const rows = [];
    for (let i = 0; i < 100; i++) {
      const ay = String((i % 12) + 1).padStart(2, '0');
      const gun = String((i % 27) + 1).padStart(2, '0');
      const adet = 1 + Math.floor(rnd() * 25);
      const fiyat = Math.round((149.9 + rnd() * 850) * 100) / 100;
      rows.push({
        'Tarih': '2026-' + ay + '-' + gun,
        'Bölge': pick(bolge),
        'Ürün': pick(urun),
        'Kanal': pick(kanal),
        'Adet': adet,
        'Birim Fiyat': fiyat,
        'Tutar': Math.round(kurus(fiyat) * adet) / 100
      });
    }
    rows[7]['Bölge'] = '';
    rows[23]['Birim Fiyat'] = '';
    rows[61]['Kanal'] = '';
    state.columns = ['Tarih', 'Bölge', 'Ürün', 'Kanal', 'Adet', 'Birim Fiyat', 'Tutar'];
    state.kinds = { 'Tarih': 'text', 'Bölge': 'text', 'Ürün': 'text', 'Kanal': 'text', 'Adet': 'number', 'Birim Fiyat': 'number', 'Tutar': 'number' };
    state.rows = rows;
    state.widgets = [];
    onVeriDegisti('Örnek 100 satırlık satış verisi hazır');
  }

  /* ---------------- türetilmiş hesaplar ---------------- */
  const hazir = () => state.columns.length > 0;

  function tutarKolonu() {
    return state.columns.find(c => /tutar|toplam|ciro|total/i.test(c)) || null;
  }
  // satır düzenlenince Tutar = Adet × Birim Fiyat
  function formulluGuncelle(row) {
    const t = tutarKolonu();
    if (!t) return;
    const adetK = state.columns.find(c => /adet|miktar|quantity|qty/i.test(c));
    const fiyatK = state.columns.find(c => /fiyat|price/i.test(c));
    if (!adetK || !fiyatK) return;
    const a = parseNum(row[adetK]), f = parseNum(row[fiyatK]);
    if (a != null && f != null) row[t] = Math.round(kurus(f) * a) / 100;
  }

  function kolonToplami(k) {
    if (state.kinds[k] !== 'number') return null;
    let t = 0;
    for (const r of state.rows) { const n = parseNum(r[k]); if (n != null) t += kurus(n); }
    return t / 100;
  }
  // kimlik kolonunda toplam yerine tekil değer sayısı raporlanır
  function kolonTekil(k) {
    const kume = new Set();
    state.rows.forEach(r => {
      const v = r[k];
      if (v != null && String(v).trim() !== '') kume.add(String(v).trim());
    });
    return kume.size;
  }

  // alt bilgi satırı: sayı kolonları toplanır, kimlik kolonları ASLA toplanmaz
  function footSatiri() {
    let foot = '<tr><td class="rowno">Σ</td>';
    for (const k of state.columns) {
      if (state.kinds[k] === 'id') {
        foot += '<td class="idcell" title="Kimlik kolonu — toplanmaz">' + kolonTekil(k) + ' tekil</td>';
        continue;
      }
      const t = kolonToplami(k);
      const buyuk = /tutar|toplam|ciro|total/i.test(k);
      foot += '<td class="' + (t == null ? '' : 'num ' + (buyuk ? 'grand' : '')) + '">' +
        (t == null ? '' : (paraKolonu(k) ? fmtPara(t) : fmtNum(t))) + '</td>';
    }
    return foot + '</tr>';
  }

  function eksikler() {
    const harita = {};
    state.columns.forEach(k => {
      let adet = 0; const ornek = [];
      state.rows.forEach((r, i) => {
        const v = r[k];
        if (v == null || String(v).trim() === '') { adet++; if (ornek.length < 4) ornek.push(i + 1); }
      });
      if (adet) harita[k] = { adet, ornek };
    });
    return harita;
  }
  function yinelenenleriBul() {
    const gorulen = new Map();
    const dup = new Set();
    state.rows.forEach((r, i) => {
      const anahtar = state.columns.map(k => String(r[k] == null ? '' : r[k]).trim().toLowerCase()).join('\u0001');
      if (gorulen.has(anahtar)) dup.add(i); else gorulen.set(anahtar, i);
    });
    state.duplicates = dup;
    return dup;
  }

  /* ---------------- tablo ---------------- */
  function renderTable() {
    const tbl = $('#dataTable');
    const thead = tbl.querySelector('thead'), tbody = tbl.querySelector('tbody'), tfoot = tbl.querySelector('tfoot');
    if (!hazir()) {
      thead.innerHTML = ''; tbody.innerHTML = ''; tfoot.innerHTML = '';
      $('#tableEmpty').style.display = 'block';
      return;
    }
    $('#tableEmpty').style.display = 'none';

    thead.innerHTML = '<tr><th class="rowno">#</th>' + state.columns.map(k =>
      '<th class="' + (state.kinds[k] === 'number' ? 'num' : '') + '">' + kacis(k) + '</th>').join('') + '</tr>';

    const q = state.search.toLowerCase();
    let html = '';
    state.rows.forEach((r, i) => {
      if (q) {
        const hepsi = state.columns.map(k => String(r[k] == null ? '' : r[k]).toLowerCase()).join(' ');
        if (hepsi.indexOf(q) === -1) return;
      }
      const dupmu = state.duplicates.has(i);
      html += '<tr data-row="' + i + '" class="' + (dupmu ? 'dup' : '') + '"><td class="rowno">' + (i + 1) + '</td>';
      for (const k of state.columns) {
        const v = r[k];
        const bos = v == null || String(v).trim() === '';
        const num = state.kinds[k] === 'number';
        html += '<td contenteditable="true" data-col="' + kacis(k) + '" class="' +
          (num ? 'num ' : '') + (bos ? 'missing' : '') + '">' + kacis(bos ? '' : hucreMetni(k, v)) + '</td>';
      }
      html += '</tr>';
    });
    tbody.innerHTML = html || '<tr><td colspan="' + (state.columns.length + 1) + '" class="empty">Aramaya uyan satır yok.</td></tr>';

    tfoot.innerHTML = footSatiri();
    $('#brandSub').textContent = state.rows.length + ' satır · ' + state.columns.length + ' kolon · toplamlar canlı';
  }

  function kacis(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // hücre düzenleme — tabloyu yeniden çizmeden sadece toplamları tazeler
  function hucreDuzenle(td, deger) {
    const tr = td.closest('tr');
    const i = Number(tr.getAttribute('data-row'));
    const k = td.getAttribute('data-col');
    const row = state.rows[i];
    if (!row) return;
    let yeni = String(deger).replace(/\s+/g, ' ').trim();
    if (state.kinds[k] === 'number') {
      const n = parseNum(yeni);
      row[k] = n == null ? '' : n;
    } else row[k] = yeni;
    formulluGuncelle(row);
    tazeleToplamlar();
    isaretle();
  }

  function tazeleToplamlar() {
    const tfoot = $('#dataTable tfoot');
    if (!hazir() || !tfoot) return;
    tfoot.innerHTML = footSatiri();
    $('#brandSub').textContent = state.rows.length + ' satır · ' + state.columns.length + ' kolon · toplamlar canlı';
  }

  /* ---------------- kalite ---------------- */
  function renderQuality() {
    const eks = eksikler();
    const dup = yinelenenleriBul();
    const adetEksik = Object.values(eks).reduce((a, b) => a + b.adet, 0);
    $('#chipMissing').textContent = adetEksik + ' hücre';
    $('#chipDup').textContent = dup.size + ' satır';
    $('#badgeQuality').textContent = (adetEksik ? 1 : 0) + (dup.size ? 1 : 0);

    const list = $('#missingList');
    if (!adetEksik) list.innerHTML = '<div class="item ok"><span class="k">Eksik değer yok 🎉</span><span class="m">Tüm hücreler dolu.</span></div>';
    else {
      list.innerHTML = Object.keys(eks).map(k => {
        const e = eks[k];
        return '<div class="item warn"><div><div class="k">' + kacis(k) + '</div><div class="m">satır: ' +
          e.ornek.join(', ') + (e.adet > e.ornek.length ? '…' : '') + '</div></div><span class="v">' + e.adet + ' eksik</span></div>';
      }).join('');
    }

    const dl = $('#dupList');
    if (!dup.size) dl.innerHTML = '<div class="item ok"><span class="k">Yinelenen satır yok 🎉</span><span class="m">Her satır benzersiz.</span></div>';
    else {
      dl.innerHTML = Array.from(dup).sort((a, b) => a - b).slice(0, 30).map(i =>
        '<div class="item warn"><div><div class="k">Satır ' + (i + 1) + ' yineleniyor</div><div class="m">' +
        kacis(state.columns.slice(0, 3).map(k => state.rows[i][k]).join(' · ')) + '</div></div><span class="v">kopya</span></div>'
      ).join('');
    }
  }

  /* ---------------- grafikler (SVG) ---------------- */
  function topla(xk, yk, agg) {
    // kimlik/metin kolonları toplanmaz: Y sayısal değilse kayıt sayısına düşer
    const etkin = state.kinds[yk] === 'number' ? agg : 'count';
    const harita = new Map();
    state.rows.forEach(r => {
      const x = String(r[xk] == null || r[xk] === '' ? '(boş)' : r[xk]);
      // NUMEX-DÜZELTME (2026-11-17): Ortalama hesabı kalan bir 'say()' yardımcısına bağlıydı ve o yardımcı anlamsız bir döngü içeriyordu (her zaman 1 dönebilirdi). Ortalamayı doğrudan grup içindeki sayısal değer adedine böldüm.
      const g = harita.get(x) || { adet: 0, kurus: 0, sayi: 0 };
      if (etkin === 'count') g.adet++;
      else {
        const n = parseNum(r[yk]);
        if (n != null) { g.kurus += kurus(n); g.sayi++; }
      }
      harita.set(x, g);
    });
    const dizi = Array.from(harita.entries()).map(([ad, g]) => ({
      ad,
      deger: etkin === 'count' ? g.adet : etkin === 'avg' ? (g.sayi ? g.kurus / g.sayi / 100 : 0) : g.kurus / 100
    }));
    dizi.sort((a, b) => b.deger - a.deger);
    return dizi.slice(0, 12);
  }

  const PALET = ['#FF6B5B', '#0FC2B4', '#FFA24B', '#3DA5D9', '#F45B8B', '#7ED6A5', '#8E7CFF', '#FFC94D', '#2BB3A3', '#FF8A7A', '#63C7E8', '#B48CFF'];

  function grafikSVG(svgId, veri, tip, birimEtiket) {
    const W = 720, H = 300, P = { l: 62, r: 16, t: 16, b: 62 };
    const icW = W - P.l - P.r, icH = H - P.t - P.b;
    const max = Math.max.apply(null, veri.map(d => d.deger).concat([1]));
    const ns = 'http://www.w3.org/2000/svg';
    let s = '<svg id="' + svgId + '" viewBox="0 0 ' + W + ' ' + H + '" width="100%" height="' + H + '" role="img">';
    s += '<defs><linearGradient id="gBar" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#FF6B5B"/><stop offset="100%" stop-color="#0FC2B4"/></linearGradient></defs>';

    if (tip === 'pie') {
      const cx = W / 2, cy = H / 2, r = 92;
      const total = veri.reduce((a, d) => a + Math.abs(d.deger), 0) || 1;
      let aci = -Math.PI / 2;
      veri.forEach((d, i) => {
        const dilim = Math.abs(d.deger) / total * Math.PI * 2;
        const x1 = cx + r * Math.cos(aci), y1 = cy + r * Math.sin(aci);
        aci += dilim;
        const x2 = cx + r * Math.cos(aci), y2 = cy + r * Math.sin(aci);
        const buyuk = dilim > Math.PI ? 1 : 0;
        s += '<path d="M' + cx + ' ' + cy + ' L' + x1.toFixed(1) + ' ' + y1.toFixed(1) +
          ' A' + r + ' ' + r + ' 0 ' + buyuk + ' 1 ' + x2.toFixed(1) + ' ' + y2.toFixed(1) + ' Z" fill="' +
          PALET[i % PALET.length] + '" stroke="#fff" stroke-width="2"/>';
        const lx = cx + (r + 26) * Math.cos(aci - dilim / 2), ly = cy + (r + 26) * Math.sin(aci - dilim / 2);
        s += '<text x="' + lx.toFixed(1) + '" y="' + ly.toFixed(1) + '" font-size="11" fill="#6B7A8C" text-anchor="middle">' +
          kacis(d.ad.slice(0, 12)) + '</text>';
      });
      s += '</svg>';
      return s;
    }

    // eksen ızgarası
    for (let i = 0; i <= 4; i++) {
      const y = P.t + icH - (icH * i / 4);
      s += '<line x1="' + P.l + '" y1="' + y.toFixed(1) + '" x2="' + (W - P.r) + '" y2="' + y.toFixed(1) + '" stroke="#EEF3F8"/>';
      s += '<text x="' + (P.l - 8) + '" y="' + (y + 4).toFixed(1) + '" font-size="10" fill="#8A99A8" text-anchor="end">' +
        kacis(kisaSay(max * i / 4)) + '</text>';
    }

    const adim = icW / Math.max(1, veri.length);
    if (tip === 'line') {
      const pts = veri.map((d, i) => [P.l + adim * i + adim / 2, P.t + icH - (Math.abs(d.deger) / max) * icH]);
      s += '<polyline fill="none" stroke="#FF6B5B" stroke-width="3" stroke-linejoin="round" points="' +
        pts.map(p => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ') + '"/>';
      pts.forEach((p, i) => {
        s += '<circle cx="' + p[0].toFixed(1) + '" cy="' + p[1].toFixed(1) + '" r="4.5" fill="#fff" stroke="#0FC2B4" stroke-width="3"/>';
        s += '<text x="' + p[0].toFixed(1) + '" y="' + (H - 40) + '" font-size="10" fill="#6B7A8C" text-anchor="middle">' +
          kacis(veri[i].ad.slice(0, 10)) + '</text>';
      });
    } else {
      veri.forEach((d, i) => {
        const h = (Math.abs(d.deger) / max) * icH;
        const x = P.l + adim * i + adim * 0.18;
        const w = Math.max(6, adim * 0.64);
        s += '<rect x="' + x.toFixed(1) + '" y="' + (P.t + icH - h).toFixed(1) + '" width="' + w.toFixed(1) +
          '" height="' + Math.max(1, h).toFixed(1) + '" rx="5" fill="url(#gBar)"><title>' +
          kacis(d.ad + ': ' + fmtNum(d.deger)) + '</title></rect>';
        s += '<text x="' + (x + w / 2).toFixed(1) + '" y="' + (H - 40) + '" font-size="10" fill="#6B7A8C" text-anchor="middle">' +
          kacis(d.ad.slice(0, 10)) + '</text>';
        s += '<text x="' + (x + w / 2).toFixed(1) + '" y="' + (P.t + icH - h - 6).toFixed(1) +
          '" font-size="9.5" fill="#17212E" text-anchor="middle">' + kacis(kisaSay(d.deger)) + '</text>';
      });
    }
    s += '</svg>';
    return s;
  }
  function kisaSay(n) {
    n = Number(n) || 0;
    if (Math.abs(n) >= 1e6) return (n / 1e6).toFixed(1) + 'M';
    if (Math.abs(n) >= 1e3) return (n / 1e3).toFixed(1) + 'B';
    return String(Math.round(n * 100) / 100);
  }

  /* ---------------- grafik sekmesi ---------------- */
  function renderChartForm() {
    const xsel = $('#chartX'), ysel = $('#chartY');
    if (!hazir()) { xsel.innerHTML = ''; ysel.innerHTML = ''; $('#chartPreview').innerHTML = '<span class="muted">Veri yok.</span>'; return; }
    const oncekiX = xsel.value, oncekiY = ysel.value;
    xsel.innerHTML = state.columns.map(k => '<option>' + kacis(k) + '</option>').join('');
    ysel.innerHTML = state.columns.filter(k => state.kinds[k] === 'number').map(k => '<option>' + kacis(k) + '</option>').join('')
      || state.columns.map(k => '<option>' + kacis(k) + '</option>').join('');
    const tercihX = ['Bölge', 'Kanal', 'Ürün'].find(c => state.columns.indexOf(c) > -1) || state.columns[0];
    const tercihY = tutarKolonu() || state.columns.find(c => state.kinds[c] === 'number') || state.columns[0];
    xsel.value = state.columns.indexOf(oncekiX) > -1 ? oncekiX : tercihX;
    ysel.value = state.columns.indexOf(oncekiY) > -1 ? oncekiY : tercihY;
    cizOnizleme();
  }
  function cizOnizleme() {
    if (!hazir()) return;
    const xk = $('#chartX').value, yk = $('#chartY').value;
    const veri = topla(xk, yk, $('#chartAgg').value);
    $('#chartPreview').innerHTML = grafikSVG('previewSvg', veri, $('#chartType').value);
    const hint = $('#chartHint');
    if (hint) {
      const kimlik = state.columns.filter(c => state.kinds[c] === 'id');
      hint.textContent = kimlik.indexOf(xk) > -1
        ? '“' + xk + '” bir kimlik kolonu — toplanmaz; kırılım olarak kullanılır ve kayıt sayısı gösterilir.'
        : (kimlik.length ? 'Kimlik kolonları (' + kimlik.join(', ') + ') toplanmaz; yalnız kırılım olur.' : '');
    }
  }

  /* ---------------- rapor paneli ---------------- */
  function widgetCiz(w, i) {
    const veri = topla(w.x, w.y, w.agg);
    const islem = w.agg === 'sum' ? 'Toplam' : w.agg === 'avg' ? 'Ortalama' : 'Kayıt sayısı';
    return '<div class="card" draggable="true" data-i="' + i + '">' +
      '<div class="card-head"><div><div class="card-title">' + kacis(w.title || w.y + ' / ' + w.x) + '</div>' +
      '<div class="card-sub">' + kacis(w.x) + ' · ' + islem + '</div></div>' +
      '<div class="card-tools"><span class="grab" title="Sürükle">⠿</span><button class="x" data-remove="' + i + '" title="Kaldır">×</button></div></div>' +
      grafikSVG('w' + i, veri, w.type) + '</div>';
  }
  function renderDash() {
    const g = $('#dashGrid');
    $('#badgeDash').textContent = state.widgets.length;
    if (!state.widgets.length) { g.innerHTML = ''; $('#dashEmpty').style.display = 'block'; return; }
    $('#dashEmpty').style.display = 'none';
    g.innerHTML = state.widgets.map(widgetCiz).join('');
  }

  function surukleBagla() {
    const g = $('#dashGrid');
    let kaynak = null;
    g.addEventListener('dragstart', e => {
      const c = e.target.closest('.card'); if (!c) return;
      kaynak = Number(c.getAttribute('data-i'));
      c.classList.add('dragging');
      if (e.dataTransfer) { e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', String(kaynak)); }
    });
    g.addEventListener('dragend', e => {
      $$('.card', g).forEach(c => c.classList.remove('dragging', 'over'));
      kaynak = null;
    });
    g.addEventListener('dragover', e => {
      const c = e.target.closest('.card'); if (!c || kaynak == null) return;
      e.preventDefault();
      $$('.card', g).forEach(x => x.classList.remove('over'));
      c.classList.add('over');
    });
    g.addEventListener('drop', e => {
      const c = e.target.closest('.card'); if (!c || kaynak == null) return;
      e.preventDefault();
      const hedef = Number(c.getAttribute('data-i'));
      if (hedef !== kaynak) {
        const [w] = state.widgets.splice(kaynak, 1);
        state.widgets.splice(hedef, 0, w);
        renderDash(); isaretle();
        toast('Kart taşındı', 'ok');
      }
    });
  }

  /* ---------------- dışa aktarma ---------------- */
  function csvMetni() {
    const d = ';'; // Türkçe Excel
    const satir = [state.columns.join(d)];
    state.rows.forEach(r => satir.push(state.columns.map(k => {
      let v = r[k] == null ? '' : r[k];
      if (typeof v === 'number') v = String(v).replace('.', ',');
      v = String(v);
      return /[";\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v;
    }).join(d)));
    // toplam satırı
    satir.push('');
    satir.push('TOPLAMLAR' + state.columns.slice(1).map(k => {
      const t = kolonToplami(k);
      return d + (t == null ? '' : String(t).replace('.', ','));
    }).join(''));
    return '\uFEFF' + satir.join('\r\n');
  }
  function indir(adi, icerik, tip) {
    const blob = icerik instanceof Blob ? icerik : new Blob([icerik], { type: tip || 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = adi;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  }

  // NUMEX-DÜZELTME (2026-11-17): Kullanıcı PDF'in HAM TABLO ağırlıklı kalmasını istedi; panel özeti bloğunu kaldırıp dökümü tam satır sayısıyla, kendi TOPLAM satırıyla ve sayfa numaralı alt bilgiyle yeniden kurdum (eski sürüm 300 satırda kesiyordu).
  // PDF = ham tablo dökümü. Süs yok: her satır olduğu gibi, sonunda TOPLAM satırı.
  function pdfTanim() {
    const govde = [state.columns.map(k => ({
      text: k, bold: true, fontSize: 7.5, fillColor: '#FFF0ED', color: '#B33A2B',
      alignment: state.kinds[k] === 'number' ? 'right' : 'left'
    }))];
    state.rows.forEach(r => govde.push(state.columns.map(k => {
      const bos = r[k] == null || String(r[k]).trim() === '';
      return {
        text: bos ? '' : (state.kinds[k] === 'number' ? hucreMetni(k, r[k]) : String(r[k])),
        fontSize: 6.8,
        color: bos ? '#B26A00' : '#17212E',
        alignment: state.kinds[k] === 'number' ? 'right' : 'left'
      };
    })));
    // ham tablonun kendi toplam satırı (kimlik kolonları toplanmaz)
    govde.push(state.columns.map((k, i) => {
      if (i === 0) return { text: 'TOPLAM', bold: true, fontSize: 7, fillColor: '#E7FAF8' };
      if (state.kinds[k] === 'id') return { text: kolonTekil(k) + ' tekil', fontSize: 6.5, fillColor: '#E7FAF8', color: '#6B7A8C' };
      const t = kolonToplami(k);
      return {
        text: t == null ? '' : (paraKolonu(k) ? fmtPara(t) : fmtNum(t)),
        bold: true, fontSize: 7, fillColor: '#E7FAF8',
        alignment: t == null ? 'left' : 'right'
      };
    }));

    return {
      pageOrientation: 'landscape',
      pageMargins: [16, 22, 16, 24],
      defaultStyle: { font: 'Roboto' },
      info: { title: 'Numex Data Story — ham veri dökümü' },
      content: [
        { text: 'Numex Data Story — ham veri dökümü', fontSize: 12, bold: true, color: '#FF6B5B' },
        {
          text: state.rows.length + ' satır · ' + state.columns.length + ' kolon · oluşturma: ' +
            new Date().toLocaleString('tr-TR') + ' · kimlik kolonları (telefon, sipariş no) toplanmaz',
          fontSize: 7.5, color: '#6B7A8C', margin: [0, 2, 0, 7]
        },
        { table: { headerRows: 1, widths: state.columns.map(() => '*'), body: govde }, layout: 'lightHorizontalLines' }
      ],
      footer: (sayfa, toplam) => ({
        text: 'Numex Data Story · sayfa ' + sayfa + ' / ' + toplam,
        fontSize: 6.5, color: '#9AA9B8', alignment: 'center', margin: [0, 6, 0, 0]
      })
    };
  }

  function pdfUret() {
    return new Promise((resolve, reject) => {
      if (typeof pdfMake === 'undefined') { reject(new Error('PDF motoru yüklenemedi')); return; }
      try {
        const pdf = pdfMake.createPdf(pdfTanim());
        // NUMEX-DÜZELTME (2026-11-17): PDF kütüphanesinin yeni sürümü getBuffer'ı söz (Promise) döndürüyor ve callback'i yutuyordu; üretim sessizce askıda kalıp 0 bayt dönüyordu. Kodu hem callback hem Promise API'sini destekleyecek, ayrıca 15 sn'de zaman aşımına düşecek biçimde yazdım.
        let bitti = false;
        const bitir = buf => { if (!bitti) { bitti = true; resolve(buf); } };
        const s = pdf.getBuffer(bitir);                       // 0.2 callback API
        if (s && typeof s.then === 'function') s.then(bitir).catch(reject);  // 0.3 promise API
        setTimeout(() => { if (!bitti) reject(new Error('PDF üretimi zaman aşımına düştü')); }, 15000);
      } catch (e) { reject(e); }
    });
  }

  /* ---------------- kaydet / yükle ---------------- */
  function kaydet() {
    if (!hazir()) { toast('Kaydedilecek veri yok.', 'err'); return; }
    const veri = { v: 1, columns: state.columns, kinds: state.kinds, rows: state.rows, widgets: state.widgets, savedAt: new Date().toISOString() };
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(veri));
      state.savedAt = veri.savedAt; state.dirty = false; durumYaz();
      toast('Kaydedildi — tarayıcıda korunuyor.', 'ok');
    } catch (e) {
      toast('Kaydedilemedi: ' + e.message, 'err');
    }
  }
  function yukleState(veri) {
    state.columns = veri.columns || [];
    state.kinds = veri.kinds || {};
    state.rows = veri.rows || [];
    state.widgets = veri.widgets || [];
    state.savedAt = veri.savedAt || null;
    state.dirty = false;
    renderTable(); renderQuality(); renderChartForm(); renderDash(); durumYaz();
  }
  function yereldenYukle() {
    try {
      const ham = localStorage.getItem(SAVE_KEY);
      if (!ham) return false;
      yukleState(JSON.parse(ham));
      return true;
    } catch (e) { return false; }
  }

  /* ---------------- durum & bildirim ---------------- */
  function isaretle() {
    state.dirty = true; durumYaz();
    renderQuality();
  }
  function durumYaz() {
    const el = $('#saveState');
    if (!hazir()) { el.textContent = ''; el.className = 'save-state'; return; }
    if (state.dirty) { el.textContent = '● Kaydedilmemiş değişiklik'; el.className = 'save-state dirty'; }
    else if (state.savedAt) {
      const d = new Date(state.savedAt);
      el.textContent = '✓ Kaydedildi · ' + d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
      el.className = 'save-state';
    } else { el.textContent = 'Kayıt yok'; el.className = 'save-state dirty'; }
  }
  let toastZaman = null;
  function toast(mesaj, tur) {
    const t = $('#toast');
    t.textContent = mesaj;
    t.className = 'toast show ' + (tur || '');
    clearTimeout(toastZaman);
    toastZaman = setTimeout(() => { t.className = 'toast ' + (tur || ''); }, 2600);
  }
  function onVeriDegisti(mesaj) {
    state.search = '';
    const s = $('#searchInput'); if (s) s.value = '';
    state.dirty = true;
    renderTable(); renderQuality(); renderChartForm(); renderDash(); durumYaz();
    $('#statusText').innerHTML = '<strong>' + kacis(mesaj) + '</strong> · ' + state.rows.length + ' satır, ' + state.columns.length + ' kolon';
    if (mesaj) toast(mesaj, 'ok');
  }

  /* ---------------- olaylar ---------------- */
  function olaylar() {
    // sekmeler
    $$('.tab').forEach(t => t.addEventListener('click', () => {
      $$('.tab').forEach(x => x.classList.remove('active'));
      $$('.view').forEach(v => v.classList.remove('active'));
      t.classList.add('active');
      $('#view-' + t.getAttribute('data-view')).classList.add('active');
      if (t.getAttribute('data-view') === 'charts') { renderChartForm(); }
      if (t.getAttribute('data-view') === 'quality') { renderQuality(); }
      if (t.getAttribute('data-view') === 'dash') { renderDash(); }
    }));

    // dosya girişleri
    $('#fileInput').addEventListener('change', e => { const f = e.target.files[0]; if (f) readFile(f); e.target.value = ''; });
    $('#jsonInput').addEventListener('change', e => { const f = e.target.files[0]; if (f) readFile(f); e.target.value = ''; });

    // bırakma
    const dz = $('#dropzone');
    ['dragenter', 'dragover'].forEach(ev => dz.addEventListener(ev, e => { e.preventDefault(); dz.classList.add('hot'); }));
    ['dragleave', 'drop'].forEach(ev => dz.addEventListener(ev, e => { e.preventDefault(); dz.classList.remove('hot'); }));
    dz.addEventListener('drop', e => {
      const f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
      if (f) readFile(f);
    });
    dz.addEventListener('click', () => $('#fileInput').click());
    // sayfanın tamamına bırakma
    window.addEventListener('dragover', e => { if (e.dataTransfer && e.dataTransfer.types.indexOf('Files') > -1) e.preventDefault(); });
    window.addEventListener('drop', e => {
      if (e.target.closest && e.target.closest('#dropzone')) return;
      const f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
      if (f) { e.preventDefault(); readFile(f); }
    });

    // hücre düzenleme
    const tbl = $('#dataTable');
    tbl.addEventListener('input', e => {
      const td = e.target.closest('td[contenteditable]');
      if (td) hucreDuzenle(td, td.textContent);
    });
    tbl.addEventListener('blur', e => {
      const td = e.target.closest && e.target.closest('td[contenteditable]');
      if (!td) return;
      const i = Number(td.closest('tr').getAttribute('data-row'));
      const k = td.getAttribute('data-col');
      const v = state.rows[i][k];
      td.textContent = state.kinds[k] === 'number' ? (paraKolonu(k) ? fmtPara(v) : fmtNum(v)) : (v == null ? '' : v);
      td.classList.toggle('missing', v == null || String(v).trim() === '');
    }, true);
    tbl.addEventListener('keydown', e => {
      if (e.key === 'Enter' && e.target.closest('td[contenteditable]')) { e.preventDefault(); e.target.blur(); }
    });

    // arama
    $('#searchInput').addEventListener('input', e => { state.search = e.target.value; renderTable(); });

    // butonlar
    $('#btnSample').addEventListener('click', () => { ornekVeri(); });
    $('#btnSave').addEventListener('click', kaydet);
    $('#btnAddRow').addEventListener('click', () => {
      if (!hazir()) { toast('Önce veri yükle.', 'err'); return; }
      const r = {}; state.columns.forEach(k => r[k] = '');
      state.rows.push(r); state.dirty = true;
      renderTable(); tazeleToplamlar(); renderQuality(); isaretle(); durumYaz();
      toast('Satır eklendi', 'ok');
    });
    $('#btnFillZero').addEventListener('click', () => {
      if (!hazir()) return;
      let n = 0;
      state.rows.forEach(r => state.columns.forEach(k => {
        if (state.kinds[k] === 'number' && (r[k] == null || String(r[k]).trim() === '')) { r[k] = 0; n++; }
      }));
      renderTable(); isaretle(); toast(n + ' hücre 0 yapıldı', 'ok');
    });
    $('#btnFillCoklu').addEventListener('click', () => {
      if (!hazir()) return;
      let n = 0;
      state.rows.forEach(r => state.columns.forEach(k => {
        if (state.kinds[k] === 'text' && (r[k] == null || String(r[k]).trim() === '')) { r[k] = '(belirtilmedi)'; n++; }
      }));
      renderTable(); isaretle(); toast(n + ' hücre dolduruldu', 'ok');
    });
    $('#btnDedup').addEventListener('click', () => {
      const dup = yinelenenleriBul();
      if (!dup.size) { toast('Yinelenen satır yok.', 'ok'); return; }
      state.rows = state.rows.filter((_, i) => !dup.has(i));
      renderTable(); isaretle(); toast(dup.size + ' yinelenen satır silindi', 'ok');
    });

    // grafik
    ['chartType', 'chartX', 'chartY', 'chartAgg'].forEach(id =>
      $('#' + id).addEventListener('change', cizOnizleme));
    $('#btnAddChart').addEventListener('click', () => {
      if (!hazir()) { toast('Önce veri yükle.', 'err'); return; }
      state.widgets.push({
        type: $('#chartType').value, x: $('#chartX').value, y: $('#chartY').value,
        agg: $('#chartAgg').value, title: $('#chartX').value + ' — ' + $('#chartY').value
      });
      renderDash(); isaretle();
      $$('.tab').find(t => t.getAttribute('data-view') === 'dash').click();
      toast('Panele eklendi — kartı sürükleyerek yerini değiştir', 'ok');
    });
    $('#dashGrid').addEventListener('click', e => {
      const b = e.target.closest('[data-remove]');
      if (!b) return;
      state.widgets.splice(Number(b.getAttribute('data-remove')), 1);
      renderDash(); isaretle();
    });
    surukleBagla();

    // dışa aktarma
    $('#btnCsv').addEventListener('click', () => {
      if (!hazir()) { toast('Önce veri yükle.', 'err'); return; }
      indir('numex-data-story.csv', csvMetni(), 'text/csv;charset=utf-8');
      toast('CSV indirildi', 'ok');
    });
    $('#btnPdf').addEventListener('click', () => {
      if (!hazir()) { toast('Önce veri yükle.', 'err'); return; }
      pdfUret().then(() => {
        pdfMake.createPdf(pdfTanim()).download('numex-data-story.pdf');
        toast('PDF indirildi', 'ok');
      }).catch(e => toast('PDF hatası: ' + e.message, 'err'));
    });

    // kısayol: Ctrl+S kaydet
    window.addEventListener('keydown', e => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') { e.preventDefault(); kaydet(); }
    });
  }

  /* ---------------- başlat ---------------- */
  function baslat() {
    olaylar();
    const geri = yereldenYukle();
    if (geri) {
      $('#statusText').innerHTML = '<strong>Son kayıt geri yüklendi</strong> · ' + state.rows.length + ' satır, ' + state.columns.length + ' kolon';
      toast('Son kaydın geri yüklendi', 'ok');
    } else {
      renderChartForm(); renderDash(); durumYaz();
    }
  }
  // testler için iç API
  window.App = {
    state, parseCSV, jsonToState, ornekVeri, csvMetni, pdfTanim, pdfUret, topla,
    kolonToplami, kolonTekil, footSatiri, idAdi, idDegerMi, eksikler, yinelenenleriBul,
    kaydet, yukleState, renderTable, renderQuality, renderChartForm, renderDash,
    parseNum, fmtNum, paraKolonu
  };
  document.addEventListener('DOMContentLoaded', baslat);
  if (document.readyState !== 'loading') baslat();
})();
