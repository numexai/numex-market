/* ================= NUMEX FLOW — görsel otomasyon motoru ================= */
'use strict';

/* ---------------------------------------------------------------- sabitler */
const NODE_W = 208;
const STORE_KEY = 'numex-flow:v1';
const THEME_KEY = 'numex-flow:theme';

const TYPES = {
  start: {
    label:'Başlangıç', icon:'▶', color:'#22c55e', inputs:0, outputs:['out'],
    desc:'Akış buradan başlar. Akışta tek bir Başlangıç düğümü olmalıdır. Girişi yoktur.',
    params:[{k:'value', label:'Başlangıç değeri', type:'text', def:'merhaba'}]
  },
  text: {
    label:'Metin Oluştur', icon:'T', color:'#38bdf8', inputs:1, outputs:['out'],
    desc:'Sabit bir metin üretir; gelen veriyi yok sayar.',
    params:[{k:'text', label:'Metin', type:'textarea', def:'Merhaba dünya'}]
  },
  number: {
    label:'Sayı Oluştur', icon:'#', color:'#a78bfa', inputs:1, outputs:['out'],
    desc:'Sabit bir sayı üretir (ondalık için nokta kullanın).',
    params:[{k:'value', label:'Sayı', type:'number', def:'10'}]
  },
  math: {
    label:'Matematik İşlem', icon:'÷', color:'#f472b6', inputs:1, outputs:['out'],
    desc:'Gelen sayıyı ikinci sayıyla işleme sokar. Örn: gelen 70, işlem + 85 → 155.',
    params:[
      {k:'op', label:'İşlem', type:'select', def:'+', options:[
        ['+','Topla (+)'],['-','Çıkar (−)'],['*','Çarp (×)'],['/','Böl (÷)'],['%','Mod (%)'],['^','Üs (^)']]},
      {k:'b', label:'İkinci sayı', type:'number', def:'0'},
      {k:'round', label:'Ondalık basamak', type:'number', def:'2'}
    ]
  },
  cond: {
    label:'Koşul (IF/ELSE)', icon:'?', color:'#f59e0b', inputs:1, outputs:['true','false'],
    desc:'Karşılaştırma yapar. Doğruysa yalnızca yeşil "Doğru" kolu, değilse yalnızca kırmızı "Yanlış" kolu çalışır. Değeri olduğu gibi geçirir.',
    params:[
      {k:'op', label:'Karşılaştırma', type:'select', def:'>=', options:[
        ['>','> büyük'],['>=','≥ büyük/eşit'],['<','< küçük'],['<=','≤ küçük/eşit'],
        ['==','== eşit'],['!=','!= eşit değil'],['contains','içerir'],['startsWith','ile başlar']]},
      {k:'right', label:'Karşılaştırılacak değer', type:'text', def:'60'}
    ]
  },
  transform: {
    label:'Metin Dönüştür', icon:'Aa', color:'#2dd4bf', inputs:1, outputs:['out'],
    desc:'Değeri metne çevirip dönüştürür. Şablonda {v} = gelen değer, {n} = uzunluk.',
    params:[
      {k:'mode', label:'Dönüşüm', type:'select', def:'template', options:[
        ['template','Şablon'],['upper','BÜYÜK harf'],['lower','küçük harf'],['trim','Boşluk temizle'],
        ['reverse','Ters çevir'],['length','Uzunluk'],['join','Dizi birleştir'],['replace','Değiştir']]},
      {k:'arg', label:'Argüman (şablon / ayraç / aranan)', type:'textarea', def:'Sonuç: {v}'},
      {k:'arg2', label:'Yeni değer (Değiştir için)', type:'text', def:''}
    ]
  },
  filter: {
    label:'Veri Filtrele', icon:'⛃', color:'#818cf8', inputs:1, outputs:['out'],
    desc:'Gelen metni ayırıcıdan bölüp koşula uyan öğeleri dizi olarak geçirir.',
    params:[
      {k:'split', label:'Ayırıcı (boşsa gelen dizi kullanılır)', type:'text', def:','},
      {k:'op', label:'Koşul', type:'select', def:'>=', options:[
        ['>=','≥'],['>','>'],['<=','≤'],['<','<'],['==','=='],['!=','!='],['contains','içerir']]},
      {k:'value', label:'Eşik değer', type:'text', def:'50'},
      {k:'field', label:'Nesne alanı (opsiyonel)', type:'text', def:''}
    ]
  },
  delay: {
    label:'Gecikme', icon:'⏱', color:'#94a3b8', inputs:1, outputs:['out'],
    desc:'Belirtilen süre kadar bekler, değeri aynen geçirir.',
    params:[{k:'ms', label:'Süre (ms)', type:'number', def:'500'}]
  },
  setvar: {
    label:'Değişken Ata', icon:'=', color:'#fb923c', inputs:1, outputs:['out'],
    desc:'Gelen değeri bir değişkene yazar ve değeri sonraki düğüme geçirir.',
    params:[{k:'name', label:'Değişken adı', type:'text', def:'deger'}]
  },
  result: {
    label:'Sonuç Göster', icon:'◎', color:'#e879f9', inputs:1, outputs:[],
    desc:'Gelen değeri sonuç olarak gösterir. Akış burada biter, çıkışı yoktur.',
    params:[]
  }
};

/* ---------------------------------------------------------------- yardımcı */
const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const uid = (p = 'n') => p + Math.random().toString(36).slice(2, 8);
const sleep = ms => new Promise(r => setTimeout(r, ms));
const clone = o => JSON.parse(JSON.stringify(o));
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

function fmt(v){
  if (v === undefined) return '—';
  if (v === null) return 'null';
  if (typeof v === 'number') return Number.isInteger(v) ? String(v) : String(Math.round(v * 1000) / 1000);
  if (Array.isArray(v)) return v.map(fmt).join(', ');
  if (typeof v === 'object') return JSON.stringify(v);
  if (typeof v === 'boolean') return v ? 'true' : 'false';
  return String(v);
}
function escapeHTML(s){ return esc(s); }

/* ---------------------------------------------------------------- durum */
const state = { nodes: [], edges: [] };
const view  = { x: 90, y: 70, z: 1 };
let selected = null;          // {kind:'node'|'edge', id}
let running = false;
let runToken = 0;
let baseline = null;
const undoStack = [];
const redoStack = [];
const heights = new Map();
const activeEdges = new Set();
let logLines = [];
let lastResults = [];
let lastStats = { steps: 0, ms: 0 };

/* ---------------------------------------------------------------- DOM */
const stage = $('#stage');
const world = $('#world');
const wires = $('#wires');
const nodesLayer = $('#nodes');
const inspector = $('#inspector');
const logsEl = $('#logs');
const runstat = $('#runstat');

/* ---------------------------------------------------------------- temel */
function getNode(id){ return state.nodes.find(n => n.id === id); }
function outEdgesOf(id){ return state.edges.filter(e => e.from === id); }
function inEdgeOf(id){ return state.edges.find(e => e.to === id); }
function lbl(n){ return n ? TYPES[n.type].label : '(silinmiş)'; }
function defaults(type){
  const o = {};
  for (const p of TYPES[type].params) o[p.k] = p.def;
  return o;
}
function heightOf(id){ return heights.get(id) || 78; }

function previewOf(n){
  const p = n.params || {};
  switch (n.type){
    case 'start':     return p.value || '(boş)';
    case 'text':      return '"' + String(p.text || '').slice(0, 46) + '"';
    case 'number':    return String(p.value);
    case 'math':      return p.op + ' ' + p.b + (Number(p.round) !== 2 ? '  ·  ' + p.round + ' hane' : '');
    case 'cond':      return 'Gelen ' + p.op + ' ' + p.right;
    case 'transform': return p.mode === 'template' ? String(p.arg || '').slice(0, 46) : p.mode;
    case 'filter':    return p.op + ' ' + p.value + (p.split ? '  ·  "' + p.split + '"' : '');
    case 'delay':     return (p.ms || 0) + ' ms bekle';
    case 'setvar':    return '→ ' + (p.name || 'deger');
    case 'result':    return 'sonuç paneli';
  }
  return '';
}

/* ---------------------------------------------------------------- tema */
function applyTheme(t){
  document.documentElement.dataset.theme = t;
  localStorage.setItem(THEME_KEY, t);
  $('#btn-theme').textContent = t === 'dark' ? '🌙' : '☀️';
}

/* ---------------------------------------------------------------- görünüm */
function applyView(){
  world.style.transform = `translate(${view.x}px, ${view.y}px) scale(${view.z})`;
  const g = Math.max(4, 24 * view.z);
  const G = Math.max(20, 120 * view.z);
  stage.style.backgroundSize = `${G}px ${G}px, ${G}px ${G}px, ${g}px ${g}px, ${g}px ${g}px`;
  stage.style.backgroundPosition = `${view.x}px ${view.y}px`;
  $('#zoom-label').textContent = Math.round(view.z * 100) + '%';
}
/* Kaydedilmiş görünümde ekranda görünen düğüm var mı? (geri yükleme güvenliği) */
function anyNodeVisible(){
  if (!state.nodes.length) return true;
  const r = stage.getBoundingClientRect();
  return state.nodes.some(n => {
    const x = n.x * view.z + view.x, y = n.y * view.z + view.y;
    const w = NODE_W * view.z, h = heightOf(n.id) * view.z;
    return x + w > 8 && x < r.width - 8 && y + h > 8 && y < r.height - 8;
  });
}
function screenToWorld(cx, cy){
  const r = stage.getBoundingClientRect();
  return { x: (cx - r.left - view.x) / view.z, y: (cy - r.top - view.y) / view.z };
}
function portPos(node, port){
  const h = heightOf(node.id);
  let frac = 0.5;
  if (node.type === 'cond' && port !== 'in') frac = port === 'true' ? 0.40 : 0.74;
  const y = node.y + h * frac;
  return port === 'in' ? { x: node.x, y } : { x: node.x + NODE_W, y };
}
function edgePath(ax, ay, bx, by){
  const dx = Math.max(46, Math.abs(bx - ax) * 0.45);
  return `M ${ax} ${ay} C ${ax + dx} ${ay}, ${bx - dx} ${by}, ${bx} ${by}`;
}

/* ---------------------------------------------------------------- çizim */
function nodeEl(n){
  const t = TYPES[n.type];
  const el = document.createElement('div');
  el.className = 'node';
  el.dataset.id = n.id;
  el.dataset.type = n.type;
  el.style.transform = `translate(${n.x}px, ${n.y}px)`;
  el.style.setProperty('--nc', t.color);
  if (n.status) el.classList.add('st-' + n.status);
  if (selected && selected.kind === 'node' && selected.id === n.id) el.classList.add('selected');

  const body = n.last ? fmt(n.last.out) : previewOf(n);
  let ports = '';
  if (t.inputs) ports += `<div class="port in" data-id="${n.id}" data-port="in" title="Giriş"></div>`;
  if (t.outputs.length === 1){
    ports += `<div class="port out" data-id="${n.id}" data-port="${t.outputs[0]}" title="Çıkış"></div>`;
  } else if (t.outputs.length === 2){
    ports += `<div class="port out p-true"  data-id="${n.id}" data-port="true"  style="top:40%" title="Doğru dal"></div>`;
    ports += `<div class="port out p-false" data-id="${n.id}" data-port="false" style="top:74%" title="Yanlış dal"></div>`;
  }

  el.innerHTML =
    `<div class="nhead">
       <span class="nicon">${esc(t.icon)}</span>
       <span class="ntitle">${esc(t.label)}</span>
       <span class="nstate"></span>
     </div>
     <div class="nbody${n.last ? ' out' : ''}">${esc(body || '—')}</div>
     ${ports}`;
  return el;
}

function renderNodes(){
  nodesLayer.innerHTML = '';
  heights.clear();
  for (const n of state.nodes){
    const el = nodeEl(n);
    nodesLayer.appendChild(el);
    heights.set(n.id, el.offsetHeight || 78);
  }
  renderWires();
}

function renderWires(){
  const out = [];
  for (const e of state.edges){
    const a = getNode(e.from), b = getNode(e.to);
    if (!a || !b) continue;
    const p1 = portPos(a, e.fromPort || 'out');
    const p2 = portPos(b, 'in');
    const cls = ['wire'];
    if (a.type === 'cond') cls.push(e.fromPort === 'true' ? 'p-true' : 'p-false');
    if (selected && selected.kind === 'edge' && selected.id === e.id) cls.push('selected');
    if (activeEdges.has(e.id)) cls.push('active');
    out.push(`<path class="${cls.join(' ')}" data-eid="${e.id}" d="${edgePath(p1.x, p1.y, p2.x, p2.y)}"><title>${esc(lbl(a))} → ${esc(lbl(b))}</title></path>`);
  }
  wires.innerHTML = out.join('');
}

function renderInspector(){
  if (!selected){
    inspector.innerHTML = `
      <div class="itop"><div class="ibadge" style="--nc:var(--accent)">◈</div>
        <div><div class="ititle">Akış</div><div class="isub">genel bakış</div></div></div>
      <div class="isection">
        <div class="ilabel">Durum</div>
        <div class="kv"><span>Düğüm</span><b>${state.nodes.length}</b></div>
        <div class="kv"><span>Bağlantı</span><b>${state.edges.length}</b></div>
        <div class="kv"><span>Son çalışma</span><b>${lastStats.steps} düğüm · ${lastStats.ms} ms</b></div>
      </div>
      <div class="isection">
        <div class="ilabel">Sonuçlar</div>
        ${lastResults.length
          ? `<div class="reslist">${lastResults.map(r => `<div class="resitem">${esc(fmt(r))}</div>`).join('')}</div>`
          : `<div class="empty-note">Henüz çalıştırılmadı. ▶ Çalıştır ile akışı başlatın.</div>`}
      </div>
      <div class="isection">
        <div class="ilabel">Kısayollar</div>
        <div class="kbdrow"><span>Çalıştır</span><kbd>Ctrl</kbd>+<kbd>Enter</kbd></div>
        <div class="kbdrow"><span>Durdur</span><kbd>Esc</kbd></div>
        <div class="kbdrow"><span>Geri al / Yinele</span><kbd>Ctrl</kbd>+<kbd>Z</kbd> / <kbd>Ctrl</kbd>+<kbd>Y</kbd></div>
        <div class="kbdrow"><span>Sil (seçili)</span><kbd>Del</kbd></div>
        <div class="kbdrow"><span>Kaydır</span><kbd>Boş alanı sürükle</kbd></div>
        <div class="kbdrow"><span>Yakınlaştır</span><kbd>Tekerlek</kbd></div>
      </div>
      <div class="isection">
        <div class="ilabel">İpucu</div>
        <div class="empty-note">Bir düğüme tıklayın: özellikleri, giriş ve çıkış verisi burada görünür.</div>
      </div>`;
    return;
  }

  if (selected.kind === 'edge'){
    const e = state.edges.find(x => x.id === selected.id);
    if (!e){ selected = null; return renderInspector(); }
    const a = getNode(e.from), b = getNode(e.to);
    inspector.innerHTML = `
      <div class="itop"><div class="ibadge" style="--nc:var(--accent)">↔</div>
        <div><div class="ititle">Bağlantı</div><div class="isub">seçili tel</div></div></div>
      <div class="isection">
        <div class="kv"><span>Kaynak</span><b>${esc(lbl(a))}</b></div>
        <div class="kv"><span>Hedef</span><b>${esc(lbl(b))}</b></div>
        ${a && a.type === 'cond' ? `<div class="kv"><span>Dal</span><b>${e.fromPort === 'true' ? 'Doğru' : 'Yanlış'}</b></div>` : ''}
        <button class="btn danger" id="insp-del-edge" style="width:100%;margin-top:10px;justify-content:center">Bağlantıyı kopar</button>
      </div>`;
    $('#insp-del-edge').onclick = () => removeEdge(e.id);
    return;
  }

  const n = getNode(selected.id);
  if (!n){ selected = null; return renderInspector(); }
  const t = TYPES[n.type];

  const fields = t.params.map(p => {
    const val = n.params[p.k] ?? '';
    let input;
    if (p.type === 'select'){
      input = `<select data-pk="${p.k}">${p.options.map(([v, l]) =>
        `<option value="${esc(v)}"${String(val) === String(v) ? ' selected' : ''}>${esc(l)}</option>`).join('')}</select>`;
    } else if (p.type === 'textarea'){
      input = `<textarea data-pk="${p.k}" rows="3">${esc(val)}</textarea>`;
    } else {
      input = `<input type="${p.type === 'number' ? 'number' : 'text'}" data-pk="${p.k}" value="${esc(val)}">`;
    }
    return `<div class="field"><label>${esc(p.label)}</label>${input}</div>`;
  }).join('');

  inspector.innerHTML = `
    <div class="itop"><div class="ibadge" style="--nc:${t.color}">${esc(t.icon)}</div>
      <div><div class="ititle">${esc(t.label)}</div><div class="isub">düğüm özellikleri</div></div></div>
    <div class="isection">
      <div class="desc">${esc(t.desc)}</div>
      ${fields || '<div class="empty-note">Bu düğümün ayarı yok.</div>'}
    </div>
    <div class="isection">
      <div class="ilabel">Giriş verisi</div>
      <div class="io ${n.last ? '' : 'empty'}">${n.last ? esc(JSON.stringify(n.last.in === undefined ? null : n.last.in, null, 1)) : 'henüz veri almadı'}</div>
    </div>
    <div class="isection">
      <div class="ilabel">Çıkış verisi</div>
      <div class="io ${n.last ? '' : 'empty'}">${n.last ? esc(JSON.stringify(n.last.out === undefined ? null : n.last.out, null, 1)) : 'henüz üretmedi'}</div>
    </div>
    <div class="isection">
      <button class="btn danger" id="insp-del-node" style="width:100%;justify-content:center">Düğümü sil</button>
    </div>`;

  $$('[data-pk]', inspector).forEach(el => {
    const key = el.dataset.pk;
    el.addEventListener('input', () => {
      n.params[key] = el.value;
      const bodyEl = nodesLayer.querySelector(`.node[data-id="${n.id}"] .nbody`);
      if (bodyEl && !n.last) bodyEl.textContent = previewOf(n);
      save();
    });
    el.addEventListener('change', () => { save(); });
  });
  $('#insp-del-node').onclick = () => removeNode(n.id);
}

function render(){
  renderNodes();
  renderInspector();
  updateStats();
}
function updateStats(){
  if (!running){
    runstat.textContent = lastStats.steps ? `${lastStats.steps} düğüm · ${lastStats.ms} ms` : 'hazır';
    runstat.className = 'runstat' + (lastStats.steps ? ' ok' : '');
  }
}

/* ---------------------------------------------------------------- seçim */
function selectSel(sel){
  selected = sel || null;
  $$('.node.selected', nodesLayer).forEach(el => el.classList.remove('selected'));
  $$('.wire.selected', wires).forEach(el => el.classList.remove('selected'));
  if (selected && selected.kind === 'node'){
    const el = nodesLayer.querySelector(`.node[data-id="${selected.id}"]`);
    if (el) el.classList.add('selected');
  }
  if (selected && selected.kind === 'edge'){
    const el = wires.querySelector(`[data-eid="${selected.id}"]`);
    if (el) el.classList.add('selected');
  }
  renderInspector();
}

/* ---------------------------------------------------------------- geçmiş */
function snapshot(){ return JSON.stringify({ nodes: state.nodes.map(n => ({ id:n.id, type:n.type, x:n.x, y:n.y, params:n.params })), edges: state.edges }); }
function save(){
  const s = snapshot();
  if (baseline !== null && s !== baseline){
    undoStack.push(baseline);
    if (undoStack.length > 80) undoStack.shift();
    redoStack.length = 0;
    baseline = s;
  } else if (baseline === null){
    baseline = s;
  }
  scheduleStore();
}
let storeTimer = null;
function scheduleStore(){
  clearTimeout(storeTimer);
  storeTimer = setTimeout(() => {
    try { localStorage.setItem(STORE_KEY, serialize()); } catch (e) { /* kota dolu olabilir */ }
  }, 350);
}
function applySnapshot(str){
  const d = JSON.parse(str);
  state.nodes = d.nodes.map(n => ({ ...n, params: clone(n.params), status:null, last:null }));
  state.edges = d.edges;
  if (selected && selected.kind === 'node' && !getNode(selected.id)) selected = null;
  if (selected && selected.kind === 'edge' && !state.edges.some(e => e.id === selected.id)) selected = null;
  render();
}
function undo(){
  if (!undoStack.length) return;
  const target = undoStack.pop();
  redoStack.push(snapshot());
  baseline = target;
  applySnapshot(target);
  scheduleStore();
  log('info', '↶ Geri alındı');
}
function redo(){
  if (!redoStack.length) return;
  const target = redoStack.pop();
  undoStack.push(snapshot());
  baseline = target;
  applySnapshot(target);
  scheduleStore();
  log('info', '↷ Yinelendi');
}

/* ---------------------------------------------------------------- kayıt */
function serialize(){
  return JSON.stringify({
    app:'numex-flow', version:1, savedAt:new Date().toISOString(), view,
    nodes: state.nodes.map(n => ({ id:n.id, type:n.type, x:n.x, y:n.y, params:n.params })),
    edges: state.edges
  }, null, 2);
}
function loadJSON(data, quiet){
  if (!data || !Array.isArray(data.nodes)) throw new Error('Geçersiz akış dosyası: "nodes" dizisi yok.');
  const nodes = data.nodes.filter(n => n && TYPES[n.type]).map(n => ({
    id: n.id || uid(), type: n.type,
    x: Number(n.x) || 0, y: Number(n.y) || 0,
    params: Object.assign(defaults(n.type), n.params || {}),
    status: null, last: null
  }));
  const ids = new Set(nodes.map(n => n.id));
  const edges = (Array.isArray(data.edges) ? data.edges : [])
    .filter(e => e && ids.has(e.from) && ids.has(e.to))
    .map(e => ({ id: e.id || uid('e'), from: e.from, fromPort: e.fromPort || 'out', to: e.to, toPort: 'in' }));
  if (data.view && typeof data.view.z === 'number'){ view.x = data.view.x; view.y = data.view.y; view.z = data.view.z; }
  state.nodes = nodes;
  state.edges = edges;
  selected = null;
  render();
  // NUMEX-DÜZELTME (2026-11-16): Geri yüklenen kayıtlı görünüm (view) düğümlerin hiçbirini görünür alana sokmuyorsa tuval boş görünüyordu. Görünür düğüm yoksa akışın başına odaklan.
  if (!anyNodeVisible()) focusStart(); else applyView();
  save();
  if (!quiet) log('ok', `Akış yüklendi: ${nodes.length} düğüm, ${edges.length} bağlantı.`);
}

/* ---------------------------------------------------------------- düğüm/bağlantı işlemleri */
function addNode(type, x, y, params){
  const n = { id: uid(), type, x: Math.round(x), y: Math.round(y),
    params: Object.assign(defaults(type), params || {}), status:null, last:null };
  state.nodes.push(n);
  render(); save();
  return n;
}
function addNodeAtCenter(type){
  const r = stage.getBoundingClientRect();
  const c = screenToWorld(r.left + r.width / 2, r.top + r.height / 2);
  const n = addNode(type, c.x - NODE_W / 2, c.y - 40);
  selectSel({ kind:'node', id:n.id });
  log('info', `${lbl(n)} eklendi.`);
}
function removeNode(id){
  const n = getNode(id);
  if (!n) return;
  state.nodes = state.nodes.filter(x => x.id !== id);
  state.edges = state.edges.filter(e => e.from !== id && e.to !== id);
  if (selected && selected.id === id) selected = null;
  render(); save();
  log('warn', `${lbl(n)} silindi.`);
}
function addEdge(from, fromPort, to){
  if (from === to){ log('warn', 'Bir düğüm kendine bağlanamaz.'); return false; }
  const a = getNode(from), b = getNode(to);
  if (!a || !b) return false;
  if (TYPES[b.type].inputs === 0){ log('warn', `${lbl(b)} giriş kabul etmiyor.`); return false; }
  const existing = state.edges.find(e => e.to === to);
  if (existing){
    if (existing.from === from && existing.fromPort === fromPort) return false;
    state.edges = state.edges.filter(e => e !== existing);
    log('warn', `${lbl(b)} girişindeki eski bağlantı değiştirildi.`);
  }
  const ed = { id: uid('e'), from, fromPort: fromPort || 'out', to, toPort:'in' };
  state.edges.push(ed);
  const cyc = detectCycles();
  if (cyc.size){
    log('error', '⛔ Döngü oluştu: ' + [...cyc].map(i => lbl(getNode(i))).join(' → ') + ' — bu akış çalıştırılamaz.');
  } else {
    log('ok', `Bağlantı kuruldu: ${lbl(a)} → ${lbl(b)}${a.type === 'cond' ? ' (' + (fromPort === 'true' ? 'doğru' : 'yanlış') + ')' : ''}`);
  }
  render(); save();
  return true;
}
function removeEdge(id){
  const e = state.edges.find(x => x.id === id);
  if (!e) return;
  state.edges = state.edges.filter(x => x.id !== id);
  if (selected && selected.id === id) selected = null;
  render(); save();
  log('warn', `Bağlantı koparıldı: ${lbl(getNode(e.from))} → ${lbl(getNode(e.to))}`);
}

/* ---------------------------------------------------------------- döngü tespiti */
function detectCycles(){
  const color = new Map();
  const cycleNodes = new Set();
  const adj = new Map();
  for (const n of state.nodes) adj.set(n.id, outEdgesOf(n.id).map(e => e.to));

  for (const startNode of state.nodes){
    if (color.get(startNode.id)) continue;
    color.set(startNode.id, 1);
    const stack = [{ id: startNode.id, i: 0 }];
    const path = [startNode.id];
    while (stack.length){
      const top = stack[stack.length - 1];
      const kids = adj.get(top.id) || [];
      if (top.i < kids.length){
        const k = kids[top.i++];
        const c = color.get(k) || 0;
        if (c === 1){
          const idx = path.indexOf(k);
          if (idx >= 0) path.slice(idx).forEach(id => cycleNodes.add(id));
          cycleNodes.add(top.id);
        } else if (c === 0){
          color.set(k, 1); path.push(k); stack.push({ id:k, i:0 });
        }
      } else {
        color.set(top.id, 2); stack.pop(); path.pop();
      }
    }
  }
  return cycleNodes;
}

/* ---------------------------------------------------------------- karşılaştırma / dönüşüm */
function toNum(v){
  if (typeof v === 'number' && !Number.isNaN(v)) return v;
  const s = String(v === undefined || v === null ? '' : v).trim().replace(',', '.');
  const n = Number(s);
  if (s === '' || Number.isNaN(n)) throw new Error('Sayı bekleniyordu, gelen: ' + fmt(v));
  return n;
}
function compare(a, op, b){
  if (op === 'contains')   return String(fmt(a)).toLocaleLowerCase('tr-TR').includes(String(fmt(b)).toLocaleLowerCase('tr-TR'));
  if (op === 'startsWith') return String(fmt(a)).toLocaleLowerCase('tr-TR').startsWith(String(fmt(b)).toLocaleLowerCase('tr-TR'));
  const sa = String(fmt(a)).trim(), sb = String(fmt(b)).trim();
  const na = Number(sa.replace(',', '.')), nb = Number(sb.replace(',', '.'));
  const numeric = sa !== '' && sb !== '' && !Number.isNaN(na) && !Number.isNaN(nb);
  const A = numeric ? na : sa.toLocaleLowerCase('tr-TR');
  const B = numeric ? nb : sb.toLocaleLowerCase('tr-TR');
  switch (op){
    case '>':  return A > B;
    case '>=': return A >= B;
    case '<':  return A < B;
    case '<=': return A <= B;
    case '==': return A === B;
    case '!=': return A !== B;
  }
  return false;
}

/* ---------------------------------------------------------------- yürütücü */
async function execNode(n, input, ctx, myToken){
  const p = n.params;

  switch (n.type){
    case 'start':
      return (p.value === undefined || p.value === '') ? 'başladı' : p.value;

    case 'text':
      return String(p.text ?? '');

    case 'number':
      return toNum(p.value);

    case 'math': {
      const a = toNum(input);
      const b = toNum(p.b);
      let r;
      switch (p.op){
        case '+': r = a + b; break;
        case '-': r = a - b; break;
        case '*': r = a * b; break;
        case '/': if (b === 0) throw new Error('Sıfıra bölme hatası'); r = a / b; break;
        case '%': if (b === 0) throw new Error('Sıfıra mod hatası'); r = a % b; break;
        case '^': r = Math.pow(a, b); break;
        default:  throw new Error('Bilinmeyen işlem: ' + p.op);
      }
      const rd = Math.max(0, Math.min(8, Number(p.round) || 0));
      return Math.round(r * Math.pow(10, rd)) / Math.pow(10, rd);
    }

    case 'cond': {
      const ok = compare(input, p.op, p.right);
      n._branch = ok ? 'true' : 'false';   // motor hangi dalı yürüteceğini bundan bilir
      return input;
    }

    case 'transform': {
      const mode = p.mode, arg = p.arg ?? '';
      if (mode === 'template'){
        return String(arg)
          .replace(/\{v\}/g, fmt(input))
          .replace(/\{n\}/g, Array.isArray(input) ? String(input.length) : String(fmt(input).length));
      }
      if (mode === 'join') return Array.isArray(input) ? input.map(fmt).join(arg || ', ') : fmt(input);
      if (mode === 'length') return Array.isArray(input) ? input.length : String(fmt(input)).length;
      const s = String(fmt(input));
      switch (mode){
        case 'upper':   return s.toLocaleUpperCase('tr-TR');
        case 'lower':   return s.toLocaleLowerCase('tr-TR');
        case 'trim':    return s.trim().replace(/\s+/g, ' ');
        case 'reverse': return s.split('').reverse().join('');
        case 'replace': return s.split(String(arg)).join(String(p.arg2 ?? ''));
        default:        return s;
      }
    }

    case 'filter': {
      let arr;
      const sep = String(p.split ?? '');
      if (sep !== '') arr = String(fmt(input)).split(sep).map(s => s.trim()).filter(s => s !== '');
      else if (Array.isArray(input)) arr = input.slice();
      else arr = [input];
      const field = String(p.field ?? '').trim();
      const out = arr.filter(item => {
        const v = field ? (item && typeof item === 'object' ? item[field] : undefined) : item;
        return compare(v, p.op, p.value);
      });
      return out;
    }

    case 'delay': {
      const ms = Math.max(0, Number(p.ms) || 0);
      for (let t = 0; t < ms; t += 50){
        if (myToken !== runToken) throw new Error('Durduruldu');
        await sleep(Math.min(50, ms - t));
      }
      if (myToken !== runToken) throw new Error('Durduruldu');
      return input;
    }

    case 'setvar': {
      const name = String(p.name ?? '').trim() || 'deger';
      ctx.vars[name] = input;
      return input;
    }

    case 'result':
      ctx.results.push(input);
      return input;
  }
  throw new Error('Bilinmeyen düğüm tipi: ' + n.type);
}

/* ---------------------------------------------------------------- doğrulama + çalıştırma */
function validate(){
  const errs = [], warns = [];
  const starts = state.nodes.filter(n => n.type === 'start');
  if (state.nodes.length === 0) errs.push('Tuval boş. Önce düğüm ekleyin.');
  else if (starts.length === 0) errs.push('Başlangıç düğümü yok. Soldaki panelden "Başlangıç" ekleyin.');
  else if (starts.length > 1) warns.push(`${starts.length} Başlangıç düğümü var; ilki kullanılacak.`);

  const cycles = detectCycles();
  if (cycles.size) errs.push('Döngü tespit edildi: ' + [...cycles].map(i => lbl(getNode(i))).join(' → ') + ' — geçersiz akış çalıştırılmaz.');

  if (state.nodes.length && !state.nodes.some(n => n.type === 'result'))
    warns.push('Sonuç Göster düğümü yok; sonuçlar yalnızca kayıtlarda görünür.');

  return { errs, warns, cycles, starts };
}

function setRunState(on){
  running = on;
  $('#btn-run').disabled = on;
  $('#btn-stop').disabled = !on;
  if (on){
    runstat.textContent = 'çalışıyor…';
    runstat.className = 'runstat running';
  }
}

function clearStatus(){
  for (const n of state.nodes){ n.status = null; n.last = null; n._branch = null; }
  activeEdges.clear();
}

async function runFlow(){
  if (running) return false;
  clearStatus();
  lastResults = [];
  renderNodes();

  const { errs, warns, cycles, starts } = validate();
  warns.forEach(w => log('warn', w));
  if (errs.length){
    errs.forEach(e => log('error', e));
    cycles.forEach(id => { const n = getNode(id); if (n) n.status = 'error'; });
    renderNodes();
    runstat.textContent = 'geçersiz akış';
    runstat.className = 'runstat err';
    setRunState(false);
    return false;
  }

  setRunState(true);
  const my = ++runToken;
  const t0 = performance.now();
  const ctx = { vars:{}, results:[], steps:0 };
  log('info', '▶ Akış başladı');
  logLines.push('▶ Akış başladı');

  const executed = new Set();
  const queue = [{ node: starts[0], value: undefined, edge: null }];

  while (queue.length){
    if (my !== runToken){ log('warn', '⏹ Akış kullanıcı tarafından durduruldu.'); break; }
    const item = queue.shift();
    const n = item.node;

    if (executed.has(n.id)){ log('warn', `${lbl(n)} ikinci kez tetiklendi, atlandı (tek çalıştırma kuralı).`); continue; }
    executed.add(n.id);

    n.status = 'running';
    if (item.edge) activeEdges.add(item.edge.id);
    renderNodes();
    await sleep(190);
    if (my !== runToken){ n.status = null; renderNodes(); break; }

    try {
      const out = await execNode(n, item.value, ctx, my);
      n.last = { in: item.value, out };
      n.status = 'done';
      ctx.steps++;
      if (item.edge) activeEdges.delete(item.edge.id);
      log('ok', `${lbl(n)} → ${fmt(out)}`);
      if (n.type === 'result') log('result', `★ Sonuç: ${fmt(out)}`);

      for (const e of outEdgesOf(n.id)){
        if (n.type === 'cond' && e.fromPort !== n._branch) continue;   // yalnızca seçilen dal
        queue.push({ node: getNode(e.to), value: out, edge: e });
      }
      renderNodes();
    } catch (err){
      // NUMEX-DÜZELTME (2026-11-16): Durdurma isteği, gecikme düğümünün içinde 'Durduruldu' hatası fırlatıyordu; catch bloğu bunu gerçek hata sanıp düğümü kırmızı işaretliyor ve 'hata' durumu yazıyordu. Durdurma ayrı ele alınmalı: düğüm temizlenir, akış sessizce biter.
      // Kullanıcı durdurduysa bu bir HATA değildir: düğümü temiz bırak ve çık.
      if (my !== runToken || err.message === 'Durduruldu'){
        n.status = null;
        if (item.edge) activeEdges.delete(item.edge.id);
        renderNodes();
        break;
      }
      n.status = 'error';
      if (item.edge) activeEdges.delete(item.edge.id);
      log('error', `${lbl(n)} hata: ${err.message}`);
      renderNodes();
      lastResults = ctx.results.slice();
      lastStats = { steps: ctx.steps, ms: Math.round(performance.now() - t0) };
      running = false; setRunState(false);
      runstat.textContent = 'hata';
      runstat.className = 'runstat err';
      renderInspector();
      return false;
    }
  }

  if (my !== runToken){
    lastStats = { steps: ctx.steps, ms: Math.round(performance.now() - t0) };
    lastResults = ctx.results.slice();
    running = false; setRunState(false);
    runstat.textContent = 'durduruldu';
    runstat.className = 'runstat';
    renderInspector();
    return false;
  }

  lastResults = ctx.results.slice();
  lastStats = { steps: ctx.steps, ms: Math.round(performance.now() - t0) };
  running = false; setRunState(false);
  runstat.textContent = `bitti · ${ctx.steps} düğüm · ${lastStats.ms} ms`;
  runstat.className = 'runstat ok';
  log('ok', `✔ Akış tamamlandı — ${ctx.steps} düğüm, ${lastStats.ms} ms.`);
  if (Object.keys(ctx.vars).length) log('info', 'Değişkenler: ' + Object.entries(ctx.vars).map(([k, v]) => `${k}=${fmt(v)}`).join(', '));
  render();
  return true;
}

function stopFlow(){
  if (!running) return;
  runToken++;            // yürüyen döngü bir sonraki adımda kesilir
  log('warn', '⏹ Durdurma isteği gönderildi.');
}

/* ---------------------------------------------------------------- kayıt çubuğu */
function log(level, msg){
  const t = new Date().toLocaleTimeString('tr-TR', { hour12:false });
  logLines.push(`[${level}] ${msg}`);
  if (logLines.length > 400) logLines.shift();
  const el = document.createElement('div');
  el.className = 'log-line ' + level;
  el.innerHTML = `<span class="lt">${t}</span><span class="lm">${escapeHTML(msg)}</span>`;
  logsEl.appendChild(el);
  while (logsEl.children.length > 400) logsEl.removeChild(logsEl.firstChild);
  logsEl.scrollTop = logsEl.scrollHeight;
}

/* ---------------------------------------------------------------- dışa aktarma */
function trunc(s, n){ s = String(s); return s.length > n ? s.slice(0, n - 1) + '…' : s; }

function flowToSVG(){
  if (!state.nodes.length) return '';
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const n of state.nodes){
    minX = Math.min(minX, n.x); minY = Math.min(minY, n.y);
    maxX = Math.max(maxX, n.x + NODE_W); maxY = Math.max(maxY, n.y + heightOf(n.id));
  }
  const pad = 48, ox = pad - minX, oy = pad - minY;
  const W = Math.round(maxX - minX + pad * 2), H = Math.round(maxY - minY + pad * 2);
  const P = [];
  P.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" font-family="Segoe UI, Arial, sans-serif">`);
  P.push(`<rect width="100%" height="100%" fill="#0b0f17"/>`);

  for (const e of state.edges){
    const a = getNode(e.from), b = getNode(e.to);
    if (!a || !b) continue;
    const h1 = heightOf(a.id), h2 = heightOf(b.id);
    const fr = a.type === 'cond' ? (e.fromPort === 'true' ? 0.40 : 0.74) : 0.5;
    const ax = a.x + ox + NODE_W, ay = a.y + oy + h1 * fr;
    const bx = b.x + ox,          by = b.y + oy + h2 * 0.5;
    const col = a.type === 'cond' ? (e.fromPort === 'true' ? '#22c55e' : '#ef4444') : '#4f8cff';
    P.push(`<path d="${edgePath(ax, ay, bx, by)}" fill="none" stroke="${col}" stroke-width="2" opacity="0.85"/>`);
  }

  for (const n of state.nodes){
    const t = TYPES[n.type];
    const x = n.x + ox, y = n.y + oy, h = heightOf(n.id);
    P.push(`<rect x="${x}" y="${y}" width="${NODE_W}" height="${h}" rx="12" fill="#151d2c" stroke="${t.color}" stroke-width="1.5"/>`);
    P.push(`<rect x="${x}" y="${y}" width="4" height="${h}" rx="2" fill="${t.color}"/>`);
    P.push(`<text x="${x + 16}" y="${y + 24}" fill="#e6edf7" font-size="13" font-weight="600">${esc(t.label)}</text>`);
    const sub = n.last ? '→ ' + fmt(n.last.out) : previewOf(n);
    P.push(`<text x="${x + 16}" y="${y + 48}" fill="#8b9bb4" font-size="12">${esc(trunc(sub, 28))}</text>`);
  }

  P.push(`<text x="${pad}" y="${H - 16}" fill="#4b5a72" font-size="11">Numex Flow — ${new Date().toLocaleString('tr-TR')}</text>`);
  P.push('</svg>');
  return P.join('');
}

function download(name, content, mime){
  const blob = content instanceof Blob ? content : new Blob([content], { type: mime || 'text/plain;charset=utf-8' });
  const a = document.createElement('a');
  const url = URL.createObjectURL(blob);
  a.href = url; a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

function exportSVG(){
  const svg = flowToSVG();
  if (!svg){ log('warn', 'Tuvalde düğüm yok, dışa aktarılacak bir şey yok.'); return; }
  download('numex-flow.svg', svg, 'image/svg+xml;charset=utf-8');
  log('ok', 'SVG dışa aktarıldı.');
}

function exportPNG(){
  const svg = flowToSVG();
  if (!svg){ log('warn', 'Tuvalde düğüm yok, dışa aktarılacak bir şey yok.'); return; }
  const blob = new Blob([svg], { type:'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const img = new Image();
  img.onload = () => {
    const scale = 2;
    const c = document.createElement('canvas');
    c.width = img.width * scale; c.height = img.height * scale;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#0b0f17';
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.drawImage(img, 0, 0, c.width, c.height);
    URL.revokeObjectURL(url);
    c.toBlob(b => { if (b) download('numex-flow.png', b); log('ok', 'PNG dışa aktarıldı.'); }, 'image/png');
  };
  img.onerror = () => { URL.revokeObjectURL(url); log('error', 'PNG oluşturulamadı (SVG yüklenemedi).'); };
  img.src = url;
}

/* ---------------------------------------------------------------- örnekler */
const EXAMPLES = {
  gpa(){
    const N = (type, x, y, params) => {
      const n = { id: uid(), type, x, y, params: Object.assign(defaults(type), params || {}), status:null, last:null };
      state.nodes.push(n); return n;
    };
    const E = (from, fromPort, to) => state.edges.push({ id: uid('e'), from: from.id, fromPort, to: to.id, toPort:'in' });

    const s  = N('start',      40, 300, { value:'öğrenci: Ayşe' });
    const v  = N('number',    300, 300, { value:'70' });
    const m1 = N('math',      560, 300, { op:'+', b:'85', round:'2' });
    const m2 = N('math',      820, 300, { op:'+', b:'90', round:'2' });
    const m3 = N('math',     1080, 300, { op:'/', b:'3',  round:'2' });
    const c  = N('cond',     1340, 300, { op:'>=', right:'60' });
    const tf = N('transform',1600, 170, { mode:'template', arg:'Ortalama: {v} → BAŞARILI' });
    const ff = N('transform',1600, 430, { mode:'template', arg:'Ortalama: {v} → BAŞARISIZ' });
    const rf = N('result',   1860, 170);
    const rn = N('result',   1860, 430);

    E(s, 'out', v); E(v, 'out', m1); E(m1, 'out', m2); E(m2, 'out', m3); E(m3, 'out', c);
    E(c, 'true', tf); E(tf, 'out', rf);
    E(c, 'false', ff); E(ff, 'out', rn);
  },

  order(){
    const N = (type, x, y, params) => {
      const n = { id: uid(), type, x, y, params: Object.assign(defaults(type), params || {}), status:null, last:null };
      state.nodes.push(n); return n;
    };
    const E = (from, fromPort, to) => state.edges.push({ id: uid('e'), from: from.id, fromPort, to: to.id, toPort:'in' });

    const s  = N('start',     40, 300, { value:'sipariş #1042' });
    const t  = N('number',   300, 300, { value:'1250' });
    const c  = N('cond',     560, 300, { op:'>=', right:'1000' });
    const d  = N('math',     820, 170, { op:'*', b:'0.9', round:'2' });
    const sv = N('setvar',  1080, 170, { name:'odenecek' });
    const tf = N('transform',1340, 170, { mode:'template', arg:'Ödenecek: {v} TL (%10 indirim uygulandı)' });
    const rf = N('result',  1600, 170);
    const tn = N('transform',820, 430, { mode:'template', arg:'İndirim yok. Toplam: {v} TL' });
    const rn = N('result',  1080, 430);

    E(s, 'out', t); E(t, 'out', c);
    E(c, 'true', d); E(d, 'out', sv); E(sv, 'out', tf); E(tf, 'out', rf);
    E(c, 'false', tn); E(tn, 'out', rn);
  },

  filter(){
    const N = (type, x, y, params) => {
      const n = { id: uid(), type, x, y, params: Object.assign(defaults(type), params || {}), status:null, last:null };
      state.nodes.push(n); return n;
    };
    const E = (from, fromPort, to) => state.edges.push({ id: uid('e'), from: from.id, fromPort, to: to.id, toPort:'in' });

    const s  = N('start',    40, 300, { value:'8A sınıfı notları' });
    const t  = N('text',    300, 300, { text:'45, 82, 17, 93, 56, 8, 71, 64' });
    const f  = N('filter',  560, 300, { split:',', op:'>=', value:'50', field:'' });
    const d  = N('delay',   820, 300, { ms:'400' });
    const sv = N('setvar', 1080, 300, { name:'gecenler' });
    const tf = N('transform',1340, 300, { mode:'template', arg:'Geçen notlar: {v}  ({n} öğrenci)' });
    const r  = N('result', 1600, 300);

    E(s, 'out', t); E(t, 'out', f); E(f, 'out', d); E(d, 'out', sv); E(sv, 'out', tf); E(tf, 'out', r);
  },

  /* IF/ELSE'in iki çıkışı AYNI Sonuç düğümünde birleşir (merge).
     Doğru koşulda yalnızca yeşil dal yürür; sonuç düğümü o dalın verisini alır. */
  merge(){
    const N = (type, x, y, params) => {
      const n = { id: uid(), type, x, y, params: Object.assign(defaults(type), params || {}), status:null, last:null };
      state.nodes.push(n); return n;
    };
    const E = (from, fromPort, to) => state.edges.push({ id: uid('e'), from: from.id, fromPort, to: to.id, toPort:'in' });

    const s  = N('start',     40, 300, { value:'puan: 85' });
    const nm = N('number',   300, 300, { value:'85' });
    const c  = N('cond',     560, 300, { op:'>=', right:'60' });
    const tf = N('transform',820, 160, { mode:'template', arg:'GEÇTİ · puan {v}' });
    const ff = N('transform',820, 440, { mode:'template', arg:'KALDI · puan {v}' });
    const r  = N('result', 1120, 300);   // ← iki dal da buraya bağlanır

    E(s, 'out', nm); E(nm, 'out', c);
    E(c, 'true', tf);  E(tf, 'out', r);
    E(c, 'false', ff); E(ff, 'out', r);
  }
};

const EXAMPLE_LABELS = {
  gpa:'Not ortalaması & başarı',
  order:'Sipariş toplamı & indirim',
  filter:'Veri filtreleme & rapor',
  merge:'IF/ELSE birleşen dallar',
  blank:'Boş tuval'
};

function loadExample(name){
  state.nodes = []; state.edges = []; selected = null;
  clearStatus();
  if (name && EXAMPLES[name]) EXAMPLES[name]();
  else if (name === 'blank'){ /* boş */ }
  render();
  // NUMEX-DÜZELTME (2026-11-16): loadExample, akışın tamamını kadraja sığdırmak için zoom'u %35-40'a düşürüyor, düğüm yazıları okunmaz hale geliyordu. İlk izlenimde okunabilir ölçek (%80) ve akışın başına odak doğru; tümünü görmek isteyen ⌂ (sığdır) butonunu kullanır.
  focusStart();
  save();
  log('info', `Örnek yüklendi: ${EXAMPLE_LABELS[name] || 'boş tuval'}`);
}

/* Örnek açılışında okunabilir ölçek: akışın başına odaklan (%80). */
function focusStart(){
  const s = state.nodes.find(n => n.type === 'start') || state.nodes[0];
  if (!s){ view.x = 90; view.y = 70; view.z = 1; applyView(); return; }
  view.z = 0.8;
  view.x = 90 - s.x * view.z;
  view.y = 110 - s.y * view.z;
  applyView();
}

function fitView(){
  if (!state.nodes.length){ view.x = 90; view.y = 70; view.z = 1; applyView(); return; }
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const n of state.nodes){
    minX = Math.min(minX, n.x); minY = Math.min(minY, n.y);
    maxX = Math.max(maxX, n.x + NODE_W); maxY = Math.max(maxY, n.y + heightOf(n.id));
  }
  const r = stage.getBoundingClientRect();
  const pad = 60;
  // Okunabilirlik tabanı: çok geniş akışlarda 0.30'a kadar küçültmek yerine
  // 0.55'te dur, kalanı kullanıcı kaydırsın (başlıklar okunur kalsın).
  const z = Math.min(1.4, Math.max(0.55, Math.min((r.width - pad * 2) / (maxX - minX), (r.height - pad * 2) / (maxY - minY))));
  view.z = z;
  view.x = (r.width - (maxX - minX) * z) / 2 - minX * z;
  view.y = (r.height - (maxY - minY) * z) / 2 - minY * z;
  applyView();
}

/* ---------------------------------------------------------------- etkileşim */
let nodeDrag = null, panDrag = null, linkDrag = null;

stage.addEventListener('pointerdown', e => {
  if (e.button === 2) return;
  if (e.target.closest('.node') || e.target.closest('.wire')) return;
  selectSel(null);
  panDrag = { sx:e.clientX, sy:e.clientY, ox:view.x, oy:view.y };
  stage.classList.add('panning');
});

nodesLayer.addEventListener('pointerdown', e => {
  const port = e.target.closest('.port');
  if (port){
    e.stopPropagation(); e.preventDefault();
    if (port.classList.contains('in')) return;      // girişten bağlantı başlatılmaz
    const node = getNode(port.dataset.id);
    if (!node) return;
    const p = portPos(node, port.dataset.port);
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('class', 'wire temp');
    path.setAttribute('d', edgePath(p.x, p.y, p.x + 30, p.y));
    wires.appendChild(path);
    linkDrag = { from: node.id, fromPort: port.dataset.port, ax:p.x, ay:p.y, path, target:null };
    return;
  }
  const el = e.target.closest('.node');
  if (!el) return;
  const n = getNode(el.dataset.id);
  if (!n) return;
  selectSel({ kind:'node', id:n.id });
  nodeDrag = { id:n.id, sx:e.clientX, sy:e.clientY, ox:n.x, oy:n.y, moved:false, el };
  e.preventDefault();
});

window.addEventListener('pointermove', e => {
  if (panDrag){
    view.x = panDrag.ox + (e.clientX - panDrag.sx);
    view.y = panDrag.oy + (e.clientY - panDrag.sy);
    applyView();
    return;
  }
  if (nodeDrag){
    const dx = (e.clientX - nodeDrag.sx) / view.z;
    const dy = (e.clientY - nodeDrag.sy) / view.z;
    if (Math.abs(dx) > 1 || Math.abs(dy) > 1) nodeDrag.moved = true;
    const n = getNode(nodeDrag.id);
    if (!n) return;
    n.x = Math.round(nodeDrag.ox + dx);
    n.y = Math.round(nodeDrag.oy + dy);
    nodeDrag.el.style.transform = `translate(${n.x}px, ${n.y}px)`;
    renderWires();
    return;
  }
  if (linkDrag){
    const c = screenToWorld(e.clientX, e.clientY);
    linkDrag.path.setAttribute('d', edgePath(linkDrag.ax, linkDrag.ay, c.x, c.y));
    const over = document.elementFromPoint(e.clientX, e.clientY);
    const tp = over && over.closest ? over.closest('.port.in') : null;
    linkDrag.target = tp ? tp.dataset.id : null;
    linkDrag.path.style.stroke = linkDrag.target ? '#22c55e' : '';
    return;
  }
});

window.addEventListener('pointerup', e => {
  if (panDrag){
    panDrag = null;
    stage.classList.remove('panning');
    return;
  }
  if (nodeDrag){
    const moved = nodeDrag.moved;
    nodeDrag = null;
    if (moved) save();
    render();
    return;
  }
  if (linkDrag){
    const over = document.elementFromPoint(e.clientX, e.clientY);
    const tp = over && over.closest ? over.closest('.port.in') : null;
    linkDrag.path.remove();
    const drag = linkDrag;
    linkDrag = null;
    if (tp && tp.dataset.id !== drag.from) addEdge(drag.from, drag.fromPort, tp.dataset.id);
    else if (tp) log('warn', 'Bir düğüm kendine bağlanamaz.');
    renderWires();
  }
});

stage.addEventListener('wheel', e => {
  e.preventDefault();
  const r = stage.getBoundingClientRect();
  const mx = e.clientX - r.left, my = e.clientY - r.top;
  const factor = Math.exp(-e.deltaY * 0.0016);
  const z2 = Math.min(2.5, Math.max(0.22, view.z * factor));
  const k = z2 / view.z;
  view.x = mx - (mx - view.x) * k;
  view.y = my - (my - view.y) * k;
  view.z = z2;
  applyView();
}, { passive:false });

wires.addEventListener('click', e => {
  const p = e.target.closest('path[data-eid]');
  if (!p) return;
  selectSel({ kind:'edge', id:p.dataset.eid });
});

/* ---------------------------------------------------------------- klavye */
window.addEventListener('keydown', e => {
  const tag = (e.target.tagName || '').toLowerCase();
  const typing = tag === 'input' || tag === 'textarea' || tag === 'select';

  if (e.ctrlKey && e.key === 'Enter'){ e.preventDefault(); runFlow(); return; }
  if (e.key === 'Escape'){ stopFlow(); if (linkDrag){ linkDrag.path.remove(); linkDrag = null; } selectSel(null); return; }
  if (e.ctrlKey && (e.key === 'z' || e.key === 'Z')){ e.preventDefault(); undo(); return; }
  if (e.ctrlKey && (e.key === 'y' || e.key === 'Y')){ e.preventDefault(); redo(); return; }
  if (e.ctrlKey && (e.key === 's' || e.key === 'S')){ e.preventDefault(); $('#btn-save').click(); return; }
  if (typing) return;
  if (e.key === 'Delete' || e.key === 'Backspace'){
    if (!selected) return;
    e.preventDefault();
    if (selected.kind === 'node') removeNode(selected.id); else removeEdge(selected.id);
  }
});

/* ---------------------------------------------------------------- palet + düğmeler */
function buildPalette(){
  const list = $('#palette-list');
  list.innerHTML = Object.entries(TYPES).map(([key, t]) => `
    <div class="pitem" data-type="${key}" title="${esc(t.desc)}">
      <span class="pdot" style="--c:${t.color}">${esc(t.icon)}</span>
      <span class="pl">${esc(t.label)}</span>
    </div>`).join('');
  list.addEventListener('click', e => {
    const it = e.target.closest('.pitem');
    if (!it) return;
    addNodeAtCenter(it.dataset.type);
  });
}

$('#btn-run').onclick = () => runFlow();
$('#btn-stop').onclick = () => stopFlow();
$('#btn-undo').onclick = () => undo();
$('#btn-redo').onclick = () => redo();
$('#btn-theme').onclick = () => applyTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark');
$('#btn-clear').onclick = () => {
  if (!state.nodes.length) return;
  state.nodes = []; state.edges = []; selected = null; lastResults = []; lastStats = { steps:0, ms:0 };
  render(); save();
  log('warn', 'Tuval temizlendi.');
};
$('#btn-save').onclick = () => {
  download('numex-flow.json', serialize(), 'application/json;charset=utf-8');
  log('ok', 'Akış JSON olarak kaydedildi.');
};
$('#btn-load').onclick = () => $('#file-input').click();
$('#file-input').addEventListener('change', e => {
  const f = e.target.files && e.target.files[0];
  if (!f) return;
  const rd = new FileReader();
  rd.onload = () => {
    try { loadJSON(JSON.parse(rd.result)); }
    catch (err){ log('error', 'Dosya yüklenemedi: ' + err.message); }
  };
  rd.readAsText(f);
  e.target.value = '';
});
$('#btn-svg').onclick = () => exportSVG();
$('#btn-png').onclick = () => exportPNG();
$('#zoom-in').onclick = () => { view.z = Math.min(2.5, view.z * 1.2); applyView(); };
$('#zoom-out').onclick = () => { view.z = Math.max(0.22, view.z / 1.2); applyView(); };
$('#zoom-fit').onclick = () => fitView();
$('#btn-clearlog').onclick = () => { logsEl.innerHTML = ''; logLines = []; };
$('#btn-togglelog').onclick = () => {
  const app = $('.app');
  app.classList.toggle('logcollapsed');
  $('#btn-togglelog').textContent = app.classList.contains('logcollapsed') ? '+' : '−';
};
$('#example-select').addEventListener('change', e => {
  const v = e.target.value;
  if (!v) return;
  loadExample(v);
  e.target.value = '';
});

window.addEventListener('resize', () => applyView());

/* ---------------------------------------------------------------- başlat */
function boot(){
  buildPalette();
  applyTheme(localStorage.getItem(THEME_KEY) || 'dark');

  let restored = false;
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw){
      const d = JSON.parse(raw);
      if (d && Array.isArray(d.nodes) && d.nodes.length){ loadJSON(d, true); restored = true; }
    }
  } catch (err){ /* bozuk kayıt: örneğe düş */ }

  if (!restored) loadExample('gpa');
  else log('info', 'Tarayıcıdaki otomatik kayıt geri yüklendi.');

  baseline = snapshot();
  render(); applyView(); updateStats();
  log('info', 'Numex Flow hazır. Düğüm ekle, bağla, ▶ Çalıştır.');
}

/* test/teşhis köprüsü — yalnızca okuma ve programatik doğrulama için */
window.__flow = {
  get state(){ return state; },
  get logs(){ return logLines.slice(); },
  get lastResults(){ return lastResults.slice(); },
  get stats(){ return { ...lastStats }; },
  get running(){ return running; },
  get selected(){ return selected; },
  get undoDepth(){ return undoStack.length; },
  get redoDepth(){ return redoStack.length; },
  TYPES, addNode, addEdge, removeNode, removeEdge, runFlow, stopFlow, undo, redo,
  loadExample, loadJSON, serialize, fitView, flowToSVG, detectCycles,
  getNode: id => getNode(id),
  select: sel => selectSel(sel),
  nodeSummary: () => state.nodes.map(n => ({
    id:n.id, type:n.type, status:n.status, hasIn: !!inEdgeOf(n.id),
    out: n.last ? n.last.out : undefined, in: n.last ? n.last.in : undefined
  })),
  edgeSummary: () => state.edges.map(e => ({ id:e.id, from:e.from, fromPort:e.fromPort, to:e.to }))
};

boot();
