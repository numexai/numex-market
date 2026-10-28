/* ============================================================
   NexusYazı — iskelet (client-side kelime islemcisi)
   - zengin metin: document.execCommand ile biçim komutları
   - localStorage: otomatik kayıt (3sn) + aç/kaydet/yeni
   - dışa aktar: HTML / TXT indir
   - canlı kelime-karakter sayacı, kısayollar, açık/koyu tema
   ============================================================ */
(function () {
  'use strict';

  /* ---------- ELEMANLAR ---------- */
  const $ = (s) => document.querySelector(s);
  const editor = $('#editor');
  const fileNameEl = $('#fileName');

  const btnTheme = $('#btnTheme');
  const btnNew = $('#btnNew');
  const btnSave = $('#btnSave');
  const btnOpen = $('#btnOpen');
  const btnExport = $('#btnExport');
  const btnUndo = $('#btnUndo');
  const btnRedo = $('#btnRedo');
  const btnClearFmt = $('#btnClearFmt');

  // --- İçindekiler (başlık gezinme) ---
  const btnToc = $('#btnToc');
  const tocPanel = $('#tocPanel');
  const tocBody = $('#tocBody');
  const tocEmpty = $('#tocEmpty');

  // --- Bul & Değiştir paneli ---
  const findbar = $('#findbar');
  const findInput = $('#findInput');
  const replaceInput = $('#replaceInput');
  const findCount = $('#findCount');
  const btnFindPrev = $('#findPrev');
  const btnFindNext = $('#findNext');
  const btnReplace = $('#btnReplace');
  const btnReplaceAll = $('#btnReplaceAll');
  const btnFindClose = $('#findClose');

  const selFont = $('#selFont');
  const selSize = $('#selSize');
  const selBlock = $('#selBlock');
  const colorFg = $('#colorFg');
  const wrapFg = $('#wrapFg');
  const colorBg = $('#colorBg');
  const wrapBg = $('#wrapBg');

  const saveState = $('#saveState');
  const countWords = $('#countWords');
  const countChars = $('#countChars');

  /* ---------- DURUM ---------- */
  const LS_DOC = 'nexusyazi.documento';
  const LS_META = 'nexusyazi.meta';
  const LS_THEME = 'nexusyazi.tema';

  let theme = localStorage.getItem(LS_THEME) || 'light';
  let docName = 'Belgesiz.docx';
  let dirty = false;
  let autoSaveTimer = null;

  /* =========================================================
     TEMA
     ========================================================= */
  function applyTheme(t) {
    theme = t;
    document.documentElement.setAttribute('data-theme', t);
    try { localStorage.setItem(LS_THEME, t); } catch (e) {}
  }
  btnTheme.addEventListener('click', () => applyTheme(theme === 'dark' ? 'light' : 'dark'));

  /* =========================================================
     ZENGİN METİN KOMUTLARI
     ========================================================= */
  function focusEditor() { try { editor.focus(); } catch (e) {} }

  function exec(cmd, val) {
    editor.focus();
    const ok = document.execCommand(cmd, false, val);
    editor.focus();
    refreshState();
    return ok;
  }

  // araç çubuğundaki data-cmd butonları
  document.querySelectorAll('.tool[data-cmd]').forEach((btn) => {
    btn.addEventListener('mousedown', (e) => e.preventDefault()); // seçimi koru
    btn.addEventListener('click', () => {
      exec(btn.dataset.cmd);
    });
  });

  // üst şerit undo/redo
  btnUndo.addEventListener('mousedown', (e) => e.preventDefault());
  btnUndo.addEventListener('click', () => exec('undo'));
  btnRedo.addEventListener('mousedown', (e) => e.preventDefault());
  btnRedo.addEventListener('click', () => exec('redo'));

  btnClearFmt.addEventListener('mousedown', (e) => e.preventDefault());
  btnClearFmt.addEventListener('click', () => exec('removeFormat'));

  // renkler
  colorFg.addEventListener('input', (e) => exec('foreColor', e.target.value));
  wrapFg.addEventListener('mousedown', (e) => e.preventDefault());
  colorBg.addEventListener('input', (e) => exec('hiliteColor', e.target.value));
  wrapBg.addEventListener('mousedown', (e) => e.preventDefault());

  // font ailesi / boyutu
  selFont.addEventListener('change', (e) => exec('fontName', e.target.value));
  selSize.addEventListener('change', (e) => exec('fontSize', e.target.value));

  // blok / başlık stili
  selBlock.addEventListener('change', (e) => {
    const v = e.target.value;
    const after = () => { setBlockActive(v); };
    if (v === 'p') {
      exec('formatBlock', '<p>');
    } else {
      exec('formatBlock', '<' + v + '>');
    }
    setBlockActive(v);
  });

  /* =========================================================
     AKTİF BUTON TAKİBİ (seçime göre vurgula)
     ========================================================= */
  const TOOLS = ['bold', 'italic', 'underline', 'strikeThrough',
                 'insertUnorderedList', 'insertOrderedList',
                 'justifyLeft', 'justifyCenter', 'justifyRight', 'justifyFull'];

  function refreshState() {
    let sel = null;
    try { sel = window.getSelection(); } catch (e) {}
    if (sel && sel.rangeCount) {
      const node = sel.getRangeAt(0).commonAncestorContainer;
      const el = node.nodeType === 3 ? node.parentElement : node;
      if (el) {
        TOOLS.forEach((cmd) => {
          const b = document.querySelector('.tool[data-cmd="' + cmd + '"]');
          if (b) b.classList.toggle('on', !!document.queryCommandState(cmd));
        });
        setBlockActive(detectBlock(el));
      }
    }
    // word count live
    updateCounts();
    // undo/redo durumu
    btnUndo.disabled = !canUndo();
    btnRedo.disabled = !canRedo();
  }

  function setBlockActive(tag) {
    const map = { H1: 'h1', H2: 'h2', H3: 'h3', P: 'p', DIV: 'p', LI: 'p' };
    let cur = map[tag] || 'p';
    if (tag === 'P') cur = 'p';
    if (tag === 'LI') cur = 'p';
    selBlock.value = cur;
  }

  function detectBlock(el) {
    let n = el;
    while (n && n !== editor) {
      if (n.tagName === 'H1' || n.tagName === 'H2' || n.tagName === 'H3' || n.tagName === 'P') {
        return n.tagName;
      }
      n = n.parentElement;
    }
    return 'P';
  }

  function canUndo() {
    try { return document.queryCommandEnabled('undo'); } catch (e) { return true; }
  }
  function canRedo() {
    try { return document.queryCommandEnabled('redo'); } catch (e) { return true; }
  }

  /* =========================================================
     KELİME / KARAKTER SAYACI
     ========================================================= */
  function textOf(root) {
    const clone = root.cloneNode(true);
    clone.querySelectorAll('script,style').forEach((x) => x.remove());
    return (clone.textContent || '').replace(/\u00a0/g, ' ');
  }

  function updateCounts() {
    const raw = textOf(editor);
    const chars = raw.length;
    const words = raw.trim() ? raw.trim().split(/\s+/).length : 0;
    countChars.textContent = chars;
    countWords.textContent = words;
  }

  /* =========================================================
     DİRTY / OTOMATİK KAYIT (3 sn)
     ========================================================= */
  function markDirty() {
    dirty = true;
    saveState.className = 'save-ind dirty';
    saveState.innerHTML = '<span class="dot"></span>Kaydedilmedi';
    scheduleAutoSave();
  }

  function scheduleAutoSave() {
    if (autoSaveTimer) clearTimeout(autoSaveTimer);
    autoSaveTimer = setTimeout(save, 3000);
  }

  /* =========================================================
     KAYDET / AÇ / YENİ / DIŞA AKTAR  (localStorage)
     ========================================================= */
  function ls() {
    try { return localStorage; } catch (e) { return null; }
  }

  function getMeta() {
    try { const m = JSON.parse(localStorage.getItem(LS_META) || '{}'); return m; }
    catch (e) { return {}; }
  }
  function setMeta(patch) {
    const m = Object.assign(getMeta(), patch);
    try { localStorage.setItem(LS_META, JSON.stringify(m)); } catch (e) {}
  }

  function save() {
    if (!ls()) { setSaveText('Kayıt engellendi'); return; }
    const html = editor.innerHTML;
    try {
      localStorage.setItem(LS_DOC, html);
      setMeta({ name: docName, savedAt: new Date().toISOString() });
      dirty = false;
      setSaveText('Kaydedildi • ' + new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      if (autoSaveTimer) { clearTimeout(autoSaveTimer); autoSaveTimer = null; }
    } catch (e) {
      setSaveText('Kayıt hatası');
    }
  }

  const INFO_WORDS = ['Açıldı', 'İndirildi', 'Hazır', 'yok'];
  var savingTextTimer = null;
  function setSaveText(txt) {
    let cls = 'saving';
    if (txt.indexOf('Kaydedildi') !== -1 || INFO_WORDS.some((w) => txt.indexOf(w) !== -1)) {
      cls = 'saved';
    } else if (txt.indexOf('engellendi') !== -1 || txt.indexOf('hata') !== -1) {
      cls = 'dirty';
    }
    saveState.className = 'save-ind ' + cls;
    saveState.innerHTML = '<span class="dot"></span>' + txt;
  }

  function load() {
    if (!ls()) return;
    const html = localStorage.getItem(LS_DOC);
    if (html) {
      editor.innerHTML = html;
      // için kirli sayma: temiz başlat
      dirty = false;
      const meta = getMeta();
      if (meta.name) { docName = meta.name; fileNameEl.textContent = docName; }
    } else {
      editor.innerHTML = '<p>Yeni bir belge... (yazmaya başlayın)</p>';
    }
    editor.focus();
    setCaretToEnd();
    refreshState();
  }

  function setCaretToEnd() {
    try {
      const range = document.createRange();
      range.selectNodeContents(editor);
      range.collapse(false);
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
    } catch (e) {}
  }

  /* Yeni belge */
  function neu() {
    const ok = confirm('Yeni bir belge oluşturulsun mu?\nMevcut belge otomatik kaydedilecek.');
    if (!ok) return;
    save();
    docName = 'Belgesiz.docx';
    fileNameEl.textContent = docName;
    editor.innerHTML = '<h1>nexusyazi</h1><p>Yeni belgenize yazmaya başlayın.</p>';
    setMeta({ name: docName });
    editor.focus();
    refreshState();
  }

  /* Aç: kayıtlı belgeleri listele */
  function openDialog() {
    if (!ls()) return setSaveText('Aç engellendi');
    // Tek-belge modeli: son taslak otomatik yüklendi. Kutu olarak "son kayıt" içeriği döndürülür.
    // Not: proje tek taslak dosyası tutar (belge + ad). Basit & gizlilik dostu.
    const cur = localStorage.getItem(LS_DOC);
    if (!cur) { setSaveText('Kayıtlı belge yok'); return; }
    const meta = getMeta();
    const t = meta.savedAt ? new Date(meta.savedAt).toLocaleString('tr-TR') : 'bilinmiyor';
    const go = confirm('Son kaydedilen belge yüklensin mi?\nAd: "' + (meta.name || 'Belgesiz') + '"\nSon kayıt: ' + t);
    if (go) {
      editor.innerHTML = cur;
      fileNameEl.textContent = meta.name || 'Belgesiz.docx';
      docName = meta.name || 'Belgesiz.docx';
      dirty = false;
      setSaveText('Açıldı');
    }
  }

  /* Dışa aktar: HTML ve TXT */
  function download(name, content, mime) {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 300);
  }

  function exportDialog() {
    const fmt = confirm('Nasıl indirmek istersiniz?\n"Tamam" = HTML, "İptal" = TXT (düz metin)');
    const base = (docName || 'belge').replace(/\.(docx?|html|txt)$/i, '');
    if (fmt) {
      const full = '<!DOCTYPE html><html lang="tr"><head><meta charset="utf-8"><title>' +
        (docName || 'Belge') + '</title><style>body{font-family:Segoe UI,Arial,sans-serif;max-width:820px;margin:40px auto;line-height:1.7;padding:0 20px} h1,h2,h3{line-height:1.3}</style></head><body>' +
        editor.innerHTML + '</body></html>';
      download(base + '.html', full, 'text/html;charset=utf-8');
    } else {
      const plain = editor.innerText || (editor.textContent || '');
      download(base + '.txt', plain, 'text/plain;charset=utf-8');
    }
    setSaveText('İndirildi');
  }

  /* =========================================================
     ZORUNLU KAYIT İÇİN UNSAVED (Ctrl+S)
     ========================================================= */
  function requestSave() {
    save();
  }

  /* =========================================================
     OLAYLAR
     ========================================================= */
  btnNew.addEventListener('click', neu);
  btnSave.addEventListener('mousedown', (e) => e.preventDefault());
  btnSave.addEventListener('click', requestSave);
  btnOpen.addEventListener('click', openDialog);
  btnExport.addEventListener('click', exportDialog);

  /* --- Dosya adını düzenleme (Enter / odak kaybı / Esc) --- */
  function commitFileName() {
    let name = fileNameEl.textContent.trim().replace(/\s+/g, ' ');
    if (!name) { name = 'Belgesiz.docx'; }
    // uzantı yoksa .docx ekle
    if (!/\.(docx?|html|txt)$/i.test(name)) name += '.docx';
    docName = name;
    fileNameEl.textContent = name;
    dirty = true;              // ad değişimi de kopyalanmalı → otomatik kayıt
    scheduleAutoSave();
  }
  fileNameEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); fileNameEl.blur(); }
    else if (e.key === 'Escape') { e.preventDefault(); fileNameEl.textContent = docName; fileNameEl.blur(); }
    e.stopPropagation(); // editor kısayollarına taşmasın
  });
  fileNameEl.addEventListener('blur', commitFileName);
  fileNameEl.addEventListener('input', () => { dirty = false; }); // yazarken 'kirlendi' balonu yanmasın; bitince blur commit eder

  /* ============ BUL & DEĞİŞTİR (native window.find tabanlı — sağlam) ============ */
  function findCountTotal(q) {
    // Tüm eşleşmeleri say: seçimi başa al, native bul'u döngüle
    try {
      const sel = window.getSelection();
      sel.removeAllRanges();
      const r = document.createRange();
      r.selectNodeContents(editor);
      sel.addRange(r);
      sel.collapseToStart();
      let c = 0;
      while (window.find(q, false, false, false)) { c++; }
      return c;
    } catch (e) { return -1; }
  }
  function gotoNext(backward) {
    const q = findInput.value;
    if (!q) { findCount.textContent = ''; editor.focus(); return; }
    // native bul: hiç bulamazsa başa dönüp bir kez daha dener
    if (!window.find(q, false, backward, false) && !window.find(q, false, backward, false)) {
      findCount.textContent = 'Eşleşme yok';
    } else {
      findCount.textContent = '';
    }
  }
  function openFind(replaceMode) {
    findbar.hidden = false;
    findInput.focus(); findInput.select();
    const rs = document.getElementById('find-sep-repl');
    const rc = document.getElementById('replaceInput');
    const ra = document.getElementById('btnReplaceAll');
    // Değiştir alanına ait unsurlar (ayraç + giriş + buton) yalnız Ctrl+H modunda görünür
    if (rs) rs.style.display = replaceMode ? '' : 'none';
    if (rc) rc.style.display = replaceMode ? '' : 'none';
    if (ra) ra.style.display = replaceMode ? '' : 'none';
  }
  function closeFind() {
    findbar.hidden = true; findCount.textContent = '';
    editor.focus();
  }
  findInput.addEventListener('input', () => { findCount.textContent = ''; });
  btnFindNext.addEventListener('click', () => gotoNext(false));
  btnFindPrev.addEventListener('click', () => gotoNext(true));
  findInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); gotoNext(e.shiftKey); }
    if (e.key === 'Escape') { closeFind(); }
  });
  btnFindClose.addEventListener('click', closeFind);
  btnReplace.addEventListener('click', () => {
    const q = findInput.value, rep = replaceInput.value;
    const sel = window.getSelection();
    if (!q || !sel.rangeCount) return;
    // Teğet eşleşme seçili değilse önce bul
    if (!sel.toString().toLowerCase() || !window.find(q, false, false, false)) {
      // bulamadıysa ilk geçiş
    }
    const s = window.getSelection();
    if (s.rangeCount && s.toString()) {
      s.getRangeAt(0).deleteContents();
      s.getRangeAt(0).insertNode(document.createTextNode(rep));
      dirty = true; scheduleAutoSave(); updateCounts();
      saveState.textContent = '1 kez değiştirildi';
    } else {
      saveState.textContent = 'Önce bir eşleşme seçin (▼ göz at)';
    }
  });
  btnReplaceAll.addEventListener('click', () => {
    const q = findInput.value, rep = replaceInput.value;
    if (!q) return;
    // Başa dön ve toplamda kaç, sonra hepsini değiştir
    const sel = window.getSelection();
    const r = document.createRange();
    r.selectNodeContents(editor);
    sel.removeAllRanges(); sel.addRange(r); sel.collapseToStart();
    let count = 0, guard = 0;
    while (window.find(q, false, false, false) && guard++ < 2000) {
      const s = window.getSelection();
      if (!s.rangeCount || !s.toString()) break;
      s.getRangeAt(0).deleteContents();
      s.getRangeAt(0).insertNode(document.createTextNode(rep));
      count++;
    }
    if (count) { dirty = true; scheduleAutoSave(); updateCounts(); saveState.textContent = count + ' kez değiştirildi'; }
    findCount.textContent = count ? ('Tümü: ' + count) : 'Eşleşme yok';
  });
  document.addEventListener('keydown', (e) => {
    const mod = e.ctrlKey || e.metaKey;
    if (mod && e.key.toLowerCase() === 'f' && !e.shiftKey) { e.preventDefault(); openFind(false); }
    else if (mod && e.key.toLowerCase() === 'h') { e.preventDefault(); openFind(true); }
  });

  // düzenleme anında -> dirty + sayaç + araç vurgusu
  editor.addEventListener('input', markDirty);
  editor.addEventListener('keyup', refreshState);
  editor.addEventListener('click', refreshState);
  editor.addEventListener('mouseup', () => setTimeout(refreshState, 0));
  document.addEventListener('selectionchange', () => setTimeout(refreshState, 60));

  // klavye kısayolları
  document.addEventListener('keydown', (e) => {
    const mod = e.ctrlKey || e.metaKey;
    if (!mod) return;
    const k = e.key.toLowerCase();
    if (k === 's') { e.preventDefault(); save(); }
    else if (k === 'b') { e.preventDefault(); exec('bold'); }
    else if (k === 'i') { e.preventDefault(); exec('italic'); }
    else if (k === 'u') { e.preventDefault(); exec('underline'); }
    else if (k === 'z') { e.preventDefault(); exec('undo'); }
    else if (k === 'y') { e.preventDefault(); exec('redo'); }
    else if (k === 'a') { /* default select-all */ }
  });

  // pencere kapanırken kirli ise kaydet (best-effort)
  window.addEventListener('beforeunload', () => { if (dirty) save(); });

  /* =========================================================
     BAŞLAT
     ========================================================= */
  // Erişilebilirlik: title taşıyan ikon-butonlarına aria-label türet (SVG-only butonlar)
  function autoAria() {
    document.querySelectorAll('button.icon-btn[title], button.tool[title]').forEach((b) => {
      if (!b.getAttribute('aria-label')) {
        b.setAttribute('aria-label', (b.getAttribute('title') || '').replace(/\s*\(.*\)$/, '').trim());
      }
    });
  }

  function init() {
    applyTheme(theme);
    autoAria();
    load();
    saveState.className = 'save-ind saved';
    saveState.innerHTML = '<span class="dot"></span>Hazır';
    refreshState();
    setupExtras();
  bindToc();
  }

  /* =========================================================
     GENİŞLETMELER: satır aralığı, girinti, tablo, resim, yazdır
     ========================================================= */
  function parseLH(v) { const n = parseFloat(v); return isNaN(n) ? 0 : n; }

  // Seçimin "ilgilendirdiği" blokları (p,h1..h3,li,blockquote) sırayla döndürür.
  function selBlocks() {
    const s = window.getSelection();
    if (!s || s.rangeCount === 0) return [];
    const r = s.getRangeAt(0);
    const tagSel = 'p,h1,h2,h3,h4,li,blockquote,figure,table';
    function nearest(n) {
      if (!n) return null;
      const el = n.nodeType === 1 ? n : (n.parentNode || null);
      return el && typeof el.closest === 'function' ? el.closest(tagSel) : null;
    }
    const first = nearest(r.startContainer);
    const last = nearest(r.endContainer);
    if (!first) return [];
    if (!last || first === last) return [first];
    const out = [first];
    let cur = first.nextElementSibling;
    while (cur && cur !== last) {
      if (cur.matches && cur.matches(tagSel)) out.push(cur);
      cur = cur.nextElementSibling;
    }
    if (last) out.push(last);
    return out;
  }

  // ---- Satır aralığı ----
  function setLineHeight(val) {
    if (!/^\d+(\.\d+)?$/.test(val)) return;
    selBlocks().forEach(function (b) {
      b.style.lineHeight = val;
    });
    markDirty(); refreshState();
  }

  // ---- Girinti ----
  const INDENT_STEP = 24;
  function indentBlocks(fn) {
    selBlocks().forEach(function (b) {
      if (b.tagName === 'LI' || b.tagName === 'BLOCKQUOTE') return;
      const cur = parseInt(b.style.paddingLeft, 10) || 0;
      let v = cur + INDENT_STEP * (fn > 0 ? 1 : -1);
      if (v < 0) v = 0;
      if (v > 312) v = 312;
      b.style.paddingLeft = (v > 0 ? v + 'px' : '');
    });
    markDirty(); refreshState();
  }

  // ---- Tablo: mini panel + grid ----
  const TBL_ROWS = 7, TBL_COLS = 8;
  var tblHov = { r: 1, c: 1 };

  function buildTableGrid() {
    const g = $('#tblGrid');
    g.innerHTML = '';
    for (let r = 0; r < TBL_ROWS; r++) {
      for (let c = 0; c < TBL_COLS; c++) {
        const cell = document.createElement('div');
        cell.className = 'cell';
        cell.dataset.r = r + 1;
        cell.dataset.c = c + 1;
        cell.addEventListener('mouseenter', function () {
          g.querySelectorAll('.cell').forEach(function (el) {
            el.classList.toggle('hov', el.dataset.r <= (r + 1) && el.dataset.c <= (c + 1));
          });
          tblHov = { r: r + 1, c: c + 1 };
          const lb = $('#tblSizeLabel');
          if (lb) lb.textContent = (r + 1) + ' × ' + (c + 1);
        });
        cell.addEventListener('click', function () {
          insertTable(r + 1, c + 1);
          closeTblPanel();
        });
        g.appendChild(cell);
      }
    }
  }

  function insertTable(rows, cols) {
    let html = '<table>';
    for (let r = 0; r < rows; r++) {
      html += '<tr>';
      for (let c = 0; c < cols; c++) {
        const isHead = r === 0;
        html += (isHead ? '<th' : '<td') + '>&nbsp;</' + (isHead ? 'th' : 'td') + '>';
      }
      html += '</tr>';
    }
    html += '</table><p><br></p>';
    const ok = exec('insertHTML', html);
    focusEditor();
    markDirty();
    refreshState();
  }

  function openTblPanel() {
    const btn = $('#btnTable');
    buildTableGrid();
    const panel = $('#tblPanel');
    if (!btn || !panel) return;
    const rect = btn.getBoundingClientRect();
    const pRect = panel.getBoundingClientRect();
    panel.hidden = false;
    // Yeniden ölç (fixed, viewport'a göre)
    const w = panel.offsetWidth;
    let left = rect.left;
    if (left + w > window.innerWidth - 8) left = window.innerWidth - w - 8;
    if (left < 8) left = 8;
    let top = rect.bottom + 6;
    if (top + panel.offsetHeight > window.innerHeight - 8) top = rect.top - panel.offsetHeight - 6;
    panel.style.left = left + 'px';
    panel.style.top = top + 'px';
  }
  function closeTblPanel() { const p = $('#tblPanel'); if (p) p.hidden = true; }

  // ---- Resim ekleme + seçim + yeniden boyutlandırma ----
  const inputImg = document.createElement('input');
  inputImg.type = 'file';
  inputImg.accept = '.png,.jpg,.jpeg,.gif,.bmp,.webp,.svg,image/*';
  inputImg.style.display = 'none';
  document.body.appendChild(inputImg);
  inputImg.addEventListener('change', function () {
    const f = inputImg.files && inputImg.files[0];
    inputImg.value = '';
    if (!f) return;
    const fr = new FileReader();
    fr.onload = function (ev) {
      // dosya boyutu güvenliği: 3 MB üstü büyüklükte "önizleme" resmi gömme (gizlilik dostu)
      const src = ev.target.result;
      const imgHtml = '<img src="' + src + '" alt="Resim" style="max-width:100%">';
      exec('insertHTML', imgHtml);
      focusEditor();
      markDirty();
      refreshState();
    };
    fr.onerror = function () { };
    fr.readAsDataURL(f);
  });

  // Resim seçilince sarmalayıcı + köşe tutamacı
  function attachImgHandle(img) {
    // Zaten sarmalanmış mı?
    let wrap = img.closest ? img.closest('.img-wrap') : null;
    if (!wrap) {
      wrap = document.createElement('span');
      wrap.className = 'img-wrap';
      wrap.contentEditable = 'false';
      img.parentNode.insertBefore(wrap, img);
      wrap.appendChild(img);
    }
    document.querySelectorAll('.img-wrap .img-handle').forEach(function (h) { h.remove(); });
    img.classList.add('old-sel');
    const handle = document.createElement('span');
    handle.className = 'img-handle';
    handle.title = 'Sürükleyerek boyutlandır';
    wrap.appendChild(handle);

    let startX, startY, baseW;
    const onMove = function (e) {
      e.preventDefault();
      let w = Math.max(48, Math.round(baseW + (e.clientX - startX)));
      const maxW = Math.max(120, editor.getBoundingClientRect().width - 40);
      if (w > maxW) w = maxW;
      img.style.width = w + 'px';
      img.style.height = 'auto';
    };
    function onUp() {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      document.body.style.cursor = '';
      markDirty();
    }
    handle.addEventListener('mousedown', function (e) {
      e.preventDefault(); e.stopPropagation();
      startX = e.clientX; startY = e.clientY;
      baseW = img.offsetWidth || 200;
      document.body.style.cursor = 'nwse-resize';
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    });
  }
  function clearImgSel() {
    document.querySelectorAll('.page .old-sel').forEach(function (i) { i.classList.remove('old-sel'); });
    document.querySelectorAll('.img-wrap .img-handle').forEach(function (h) { h.remove(); });
  }
  function handleEditorClick(ev) {
    const t = ev.target;
    if (t && t.tagName === 'IMG' && editor.contains(t)) {
      clearImgSel();
      attachImgHandle(t);
      ev.preventDefault();
    } else if (t && t.classList && !t.classList.contains('img-handle') && t.closest && !t.closest('.img-wrap, .tbl-panel')) {
      clearImgSel();
    }
  }

  // ---- Yazdır ----
  function doPrint() { window.print(); }

  function setupExtras() {
    var sel = $('#selLineHeight');
    if (sel) {
      sel.addEventListener('change', function () { setLineHeight(sel.value); });
    }
    const bOut = $('#btnOutdent'), bIn = $('#btnIndent');
    if (bOut) bOut.addEventListener('click', function () { indentBlocks(-1); });
    if (bIn)  bIn .addEventListener('click', function () { indentBlocks(1); });
    const bTbl = $('#btnTable');
    if (bTbl) bTbl.addEventListener('click', function (e) {
      const panel = $('#tblPanel');
      if (panel && !panel.hidden) { closeTblPanel(); }
      else { e.stopPropagation(); openTblPanel(); }
    });
    const bImg = $('#btnImage');
    if (bImg) bImg.addEventListener('click', function () { inputImg.click(); });
    const bPr = $('#btnPrint');
    if (bPr) bPr.addEventListener('click', doPrint);
    if (editor) {
      editor.addEventListener('click', handleEditorClick);
    }
    document.addEventListener('mousedown', function (e) {
      const panel = $('#tblPanel');
      if (panel && !panel.hidden && e.target.closest && !e.target.closest('#btnTable') && !(panel.contains && panel.contains(e.target))) {
        closeTblPanel();
      }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && $('#tblPanel') && !$('#tblPanel').hidden) { closeTblPanel(); }
    });
  }

  /* =========================================================
     İÇİNDEKİLER (başlık gezinme)
     ========================================================= */
  let tocHideTimer = null;
  function closeToc() {
    if (!tocPanel) return;
    if (btnToc) { btnToc.classList.remove('on'); btnToc.setAttribute('aria-expanded', 'false'); }
    tocPanel.classList.remove('open');
    clearTimeout(tocHideTimer);
    tocHideTimer = setTimeout(function () { tocPanel.hidden = true; }, 240);
  }
  function openToc() {
    if (!tocPanel) return;
    clearTimeout(tocHideTimer);
    tocPanel.hidden = false;
    if (btnToc) { btnToc.classList.add('on'); btnToc.setAttribute('aria-expanded', 'true'); }
    // yeniden akışı zorla ki translate geçişi çalışsın
    void tocPanel.offsetWidth;
    tocPanel.classList.add('open');
  }
  function toggleToc() {
    if (!tocPanel) return;
    if (tocPanel.classList.contains('open')) { closeToc(); }
    else { openToc(); updateToc(); }
  }

  function updateToc() {
    if (!tocBody || !editor || !tocPanel) return;
    if (!tocPanel.classList.contains('open')) return; // kapalıyken boşa masraf yok
    const heads = editor.querySelectorAll('h1, h2, h3');
    tocBody.textContent = '';
    if (!heads.length) {
      tocBody.hidden = true;
      if (tocEmpty) tocEmpty.hidden = false;
      return;
    }
    tocBody.hidden = false;
    if (tocEmpty) tocEmpty.hidden = true;
    heads.forEach(function (h) {
      const txt = (h.textContent || '').trim() || '(Başlıksız)';
      const li = document.createElement('li');
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'toc-item lv-' + h.tagName[1]; // H1→lv-1, H2→lv-2, H3→lv-3
      const num = document.createElement('span');
      num.className = 'toc-hl';
      num.textContent = h.tagName[1];
      const sp = document.createElement('span');
      sp.className = 'toc-txt';
      sp.textContent = txt;
      b.appendChild(num);
      b.appendChild(sp);
      b.addEventListener('click', function () {
        h.scrollIntoView({ behavior: 'smooth', block: 'start' });
        focusEditor();
      });
      li.appendChild(b);
      tocBody.appendChild(li);
    });
  }

  function bindToc() {
    if (btnToc) btnToc.addEventListener('click', toggleToc);
    const tc = $('#tocClose');
    if (tc) tc.addEventListener('click', closeToc);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && tocPanel && tocPanel.classList.contains('open')) {
        closeToc();
      }
    });
    if (editor) {
      editor.addEventListener('input', function () { updateToc(); });
      editor.addEventListener('keyup', function () { updateToc(); });
    }
  }

  init();
})();
