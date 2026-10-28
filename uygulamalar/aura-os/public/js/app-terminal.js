/* ============================================================
   AURA OS — Uygulama B: Hacker Terminali (CRT konsol)
   Komutlar: help, date, notes, clear
   ============================================================ */

const TermAppState = {};

function termEscape(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function termWrite(outputEl, html, cls) {
  if (!outputEl) return;
  const div = document.createElement('div');
  if (cls) div.className = cls;
  div.innerHTML = html;
  outputEl.appendChild(div);
  outputEl.scrollTop = outputEl.scrollHeight;
}

function termWriteRawText(outputEl, text) {
  if (!outputEl) return;
  const div = document.createElement('div');
  div.textContent = text;
  outputEl.appendChild(div);
  outputEl.scrollTop = outputEl.scrollHeight;
}

/* CRT açılış banner'ı */
function termBanner(outputEl) {
  termWrite(outputEl, '<span class="term-success">   ▄▄▄▄   ▄▄▄  ▄▄▄▄▄     ▄▄▄▄  ▄  ▄ ▄▄▄▄▄</span>');
  termWrite(outputEl, '<span class="term-success">   █    ▀ █▄  █ █▀▄▀ ▀▄▄ █    ▀▄▀▀▄▀ █▀▄▀▀</span>');
  termWrite(outputEl, '');
  termWrite(outputEl, '<span class="term-info">AURA OS • Hacker Terminali v1.0 • CRT-720p</span>');
  termWrite(outputEl, '<span class="term-dim">Güvenli kanal kuruldu. Yardım için "help" yaz.</span>');
  termWrite(outputEl, '');
}

/* Komut işleyici */
async function termRunCommand(outputEl, rawCommand) {
  const cmd = (rawCommand || '').trim();
  const lower = cmd.toLowerCase();

  if (cmd === '') return;

  switch (lower) {
    case 'help':
      termWrite(outputEl, '<span class="term-success">━━ KULLANILABİLİR KOMUTLAR ━━</span>');
      termHelp(outputEl);
      break;

    case 'clear':
      outputEl.innerHTML = '';
      termBanner(outputEl);
      break;

    case 'date':
      termWrite(outputEl, '<span class="term-info">Sistem saati: ' + termEscape(new Date().toString()) + '</span>');
      break;

    case 'notes':
      await termNotes(outputEl);
      break;

    default:
      termWrite(outputEl, '<span class="term-error">zsh: komut bulunamadı: ' + termEscape(cmd) +
        '</span> <span class="term-dim">("help" ile komutlara bak)</span>');
  }
}

function termHelp(outputEl) {
  const rows = [
    ['help',  'Kullanılabilir komutları listeler'],
    ['date',  'Canlı sistem saatini yazar'],
    ['notes', 'Backend API\'den alınan kayıtlı notları terminale döker'],
    ['clear', 'Ekranı temizler ve başlığı yeniden basar'],
    ['banner','Açılış banner\'ını yeniden gösterir'],
    ['echo &lt;metin&gt;', 'Yazdığın metni geri basar'],
  ];
  rows.forEach(r => {
    termWrite(outputEl,
      '<span style="color:#39ff14">  ' + termEscape(r[0]).padEnd(14, ' ') + '</span>' +
      '<span style="color:#2c8f55">' + termEscape('— ' + r[1]) + '</span>');
  });
  termWrite(outputEl, '');
}

async function termNotes(outputEl) {
  try {
    const res = await fetch('/api/notes', { method: 'GET' });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    const notes = data.notes || [];

    termWrite(outputEl, '<span class="term-warn">▸ GET /api/notes — backend yanıtı alındı (' + notes.length + ' kayıt)</span>');

    if (notes.length === 0) {
      termWrite(outputEl, '<span class="term-dim">Kayıtlı not bulunamadı. Not defteri uygulamasından not ekleyin.</span>');
      termWrite(outputEl, '');
      return;
    }

    notes.forEach((n, i) => {
      const time = n.createdAt ? new Date(n.createdAt) : null;
      let stamp = '';
      if (time) {
        stamp = String(time.getDate()).padStart(2,'0') + '.' +
                String(time.getMonth()+1).padStart(2,'0') + '.' +
                time.getFullYear() + ' ' +
                String(time.getHours()).padStart(2,'0') + ':' +
                String(time.getMinutes()).padStart(2,'0');
      }
      termWrite(outputEl,
        '<span class="term-info">[' + String(i + 1) + ']</span> ' +
        '<span class="term-success">' + termEscape(n.text) + '</span>');
      if (stamp) termWrite(outputEl, '   <span class="term-dim">▸ ' + stamp + '</span>');
    });
    termWrite(outputEl, '');
  } catch (err) {
    termWrite(outputEl, '<span class="term-error">api' + 'nı çekerken hata: ' + termEscape(err.message) + '</span>');
  }
}

/* Term'de kullanılacak özel komutlar için echo desteği */
async function termRunExtended(outputEl, cmd) {
  const lower = cmd.toLowerCase();
  if (cmd.startsWith('echo ')) {
    termWriteRawText(outputEl, cmd.slice(5));
    return true;
  }
  if (lower === 'banner') {
    termBanner(outputEl);
    return true;
  }
  if (lower === 'whoami') {
    termWrite(outputEl, '<span class="term-success">root@aura-os (yetkili operatör)</span>');
    return true;
  }
  if (lower === 'clear') return false; // handled
  return false;
}

/* Uygulama başlatma */
function termBuildContent() {
  const tpl = document.getElementById('tpl-terminal');
  if (tpl && tpl.content) {
    return document.importNode(tpl.content, true).firstElementChild.innerHTML;
  }
  return [
    '<div class="term-app"><div class="term-crt">',
    '  <div class="term-output"></div>',
    '  <div class="term-inputline"><span class="term-prompt">root@aura:~$</span>',
    '  <input type="text" class="term-input"></div>',
    '</div></div>'
  ].join('');
}

registerApp('terminal', {
  name: 'Hacker Terminali',
  icon: '⌨️',
  defaultWidth: 600,
  defaultHeight: 420,
  windowTitle: 'Hacker Terminali — Aura OS',
  windowProps: { width: 600, height: 420 },

  buildContent: termBuildContent,

  onLaunch(record, bodyEl) {
    bodyEl.innerHTML = termBuildContent();

    const outputEl = bodyEl.querySelector('.term-output');
    const inputEl = bodyEl.querySelector('.term-input');

    if (!outputEl || !inputEl) return;

    // Banner göster
    termBanner(outputEl);

    // Odak inputa
    setTimeout(() => inputEl.focus(), 60);

    // Enter tuşu
    inputEl.addEventListener('keydown', async (e) => {
      if (e.key === 'Enter') {
        const cmd = inputEl.value;
        // komutu göster
        termWrite(outputEl, '<span class="term-success">root@aura:~$</span> ' + termEscape(cmd));

        const extendedHandled = await termRunExtended(outputEl, cmd);
        if (!extendedHandled) {
          await termRunCommand(outputEl, cmd);
        }

        inputEl.value = '';
        outputEl.scrollTop = outputEl.scrollHeight;
      }
    });

    // Pencere odaklanınca inputa odaklan
    record.el.addEventListener('mousedown', (ev) => {
      if (!ev.target.closest('.term-input')) {
        setTimeout(() => inputEl.focus(), 40);
      }
    });
  },
});
