/* ============================================================
   AURA OS — Uygulama A: Siber Not Defteri
   POST/GET /api/notes ile backend'e bağlanır
   ============================================================ */

const NotesApp = {
  _textarea: null,
  _listEl: null,
  _msgEl: null,
  _saveBtn: null,
};

/* API Yardımcıları */
async function apiGetNotes() {
  const res = await fetch('/api/notes', { method: 'GET' });
  if (!res.ok) throw new Error('GET /api/notes -> ' + res.status);
  const data = await res.json();
  return data.notes || [];
}

async function apiPostNote(text) {
  const res = await fetch('/api/notes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err && err.error) || 'POST /api/notes -> ' + res.status);
  }
  return await res.json();
}

/* Not listesini render eder */
function notesRenderList(notes) {
  const listEl = NotesApp._listEl;
  if (!listEl) return;

  if (!notes || notes.length === 0) {
    listEl.innerHTML = '<div class="note-item"><div class="ni-empty">Henüz kayıtlı not yok.</div></div>';
    return;
  }

  listEl.innerHTML = '';
  notes.forEach(n => {
    const time = n.createdAt ? new Date(n.createdAt) : null;
    let dateText = '';
    if (time) {
      const days = ['Pazar','Pazartesi','Salı','Çarşamba','Perşembe','Cuma','Cumartesi'];
      dateText =
        days[time.getDay()] + ' ' +
        String(time.getDate()).padStart(2,'0') + '.' +
        String(time.getMonth()+1).padStart(2,'0') + '.' +
        time.getFullYear() + ' ' +
        String(time.getHours()).padStart(2,'0') + ':' +
        String(time.getMinutes()).padStart(2,'0');
    }

    const item = document.createElement('div');
    item.className = 'note-item';
    item.innerHTML =
      '<div class="ni-text"></div>' +
      (dateText ? '<div class="ni-date">▸ ' + dateText + '</div>' : '');
    item.querySelector('.ni-text').textContent = n.text;
    listEl.appendChild(item);
  });
}

/* Notları yükle */
async function refreshNotesList() {
  try {
    const notes = await apiGetNotes();
    notesRenderList(notes);
    return notes;
  } catch (err) {
    notesRenderList([]);
    return [];
  }
}

/* Kaydet butonu */
async function saveCurrentNote() {
  const textarea = NotesApp._textarea;
  const msgEl = NotesApp._msgEl;
  const btn = NotesApp._saveBtn;

  const text = textarea ? textarea.value : '';
  if (!text.trim()) {
    flashMsg(msgEl, '⚠ Boş not kaydedilemez!', true);
    if (textarea) textarea.focus();
    return;
  }

  if (btn) { btn.disabled = true; btn.textContent = '⏳ Kaydediliyor...'; }

  try {
    const result = await apiPostNote(text);
    flashMsg(msgEl, '✓ Not kaydedildi! (' + result.notes.length + ' not)', false);
    if (textarea) textarea.value = '';
    notesRenderList(result.notes);
  } catch (err) {
    flashMsg(msgEl, '✗ Hata: ' + err.message, true);
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = '💾 Kaydet'; }
  }
}

function flashMsg(el, text, isErr) {
  if (!el) return;
  el.textContent = text;
  el.style.color = isErr ? '#ff6b6b' : '#39ff14';
  setTimeout(() => { if (el) el.textContent = ''; }, 4000);
}

/* Uygulama başlat şablonu: DOM'daki <template> yapısını kullanır */
function notesBuildContent() {
  const tpl = document.getElementById('tpl-note-editor');
  if (tpl && tpl.content) {
    return document.importNode(tpl.content, true).firstElementChild.innerHTML;
  }
  // Yedek HTML (template yoksa)
  return [
    '<div class="note-app">',
    '  <textarea class="note-textarea" placeholder="Siber notunu yaz..."></textarea>',
    '  <div class="note-toolbar"><button class="note-save-btn">💾 Kaydet</button></div>',
    '  <div class="note-list"></div>',
    '</div>'
  ].join('');
}

/* registerApp kaydı — pencere içerik gövde şablonu + onLaunch hook */
registerApp('notes', {
  name: 'Siber Not Defteri',
  icon: '📝',
  defaultWidth: 540,
  defaultHeight: 480,
  windowTitle: 'Siber Not Defteri — Aura OS',
  windowProps: { width: 540, height: 480 },

  buildContent: notesBuildContent,

  onLaunch(record, bodyEl) {
    // Body'ye template'i yerleştir
    const html = notesBuildContent();
    bodyEl.innerHTML = html;

    NotesApp._textarea = bodyEl.querySelector('.note-textarea');
    NotesApp._listEl = bodyEl.querySelector('.note-list');
    NotesApp._saveBtn = bodyEl.querySelector('.note-save-btn');
    NotesApp._msgEl = bodyEl.querySelector('.note-saved-msg');

    // Kaydet butonu olayı
    if (NotesApp._saveBtn) {
      NotesApp._saveBtn.addEventListener('click', saveCurrentNote);
    }

    // Ctrl+S kısayolu
    bodyEl.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        saveCurrentNote();
      }
    });

    // Mevcut notları listele
    refreshNotesList();
  },
});
