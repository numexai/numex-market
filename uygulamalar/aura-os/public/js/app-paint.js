/* ============================================================
   AURA OS — Uygulama C: Neon Paint
   HTML5 Canvas serbest çizim, 4 neon renk, temizle
   ============================================================ */

const PaintAppState = {};

function paintBuildContent() {
  const tpl = document.getElementById('tpl-paint');
  if (tpl && tpl.content) {
    return document.importNode(tpl.content, true).firstElementChild.innerHTML;
  }
  return [
    '<div class="paint-app">',
    '  <div class="paint-toolbar">',
    '    <div class="paint-tools">',
    '      <button class="color-btn active" data-color="#00ffcc" style="background:#00ffcc"></button>',
    '      <button class="color-btn" data-color="#ff00ff" style="background:#ff00ff"></button>',
    '      <button class="color-btn" data-color="#39ff14" style="background:#39ff14"></button>',
    '      <button class="color-btn" data-color="#ffaa00" style="background:#ffaa00"></button>',
    '    </div>',
    '    <button class="paint-clear-btn">🧹 Tuvali Temizle</button>',
    '  </div>',
    '  <div class="paint-canvas-wrap"><canvas class="paint-canvas" width="760" height="440"></canvas></div>',
    '</div>'
  ].join('');
}

/* Canvas çizim motoru */
function initPaintCanvas(bodyEl, canvas) {
  const ctx = canvas.getContext('2d');

  // Neon efekt için ikinci "glow" offscreen canvas
  const glowCanvas = document.createElement('canvas');
  glowCanvas.width = canvas.width;
  glowCanvas.height = canvas.height;
  const glowCtx = glowCanvas.getContext('2d');
  glowCanvas.style.display = 'none';
  bodyEl.appendChild(glowCanvas);

  // Durum
  const state = {
    drawing: false,
    color: '#00ffcc',
    lastX: 0,
    lastY: 0,
    lineWidth: 4,
    erasing: false,
  };

  // Canvas içindeki noktayı hesapla (konumlandırma)
  function getPos(e) {
    const r = canvas.getBoundingClientRect();
    const cx = canvas.width / r.width;  // ölçekleme
    const cy = canvas.height / r.height;
    let clientX, clientY;
    if (e.touches && e.touches.length) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    return {
      x: (clientX - r.left) * cx,
      y: (clientY - r.top) * cy,
    };
  }

  /* Neon ışık saçılımı: çizgiyi birden çok katman çiziyoruz */
  function neonStroke(x0, y0, x1, y1, color, width, erase) {
    if (erase) {
      // Silgi modu: ikisini de sil (normal ctx)
      ctx.save();
      ctx.globalCompositeOperation = 'destination-out';
      ctx.strokeStyle = 'rgba(0,0,0,1)';
      ctx.lineWidth = width;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x1, y1);
      ctx.stroke();
      ctx.restore();
      return;
    }

    // 1) Glow offscreen katmanı (geniş + düşük opaklık, blur ile bakılır)
    glowCtx.save();
    glowCtx.globalCompositeOperation = 'lighter';
    glowCtx.strokeStyle = color;
    glowCtx.shadowColor = color;
    glowCtx.shadowBlur = 18;
    glowCtx.lineWidth = width * 2.2;
    glowCtx.lineCap = 'round';
    glowCtx.lineJoin = 'round';
    glowCtx.beginPath();
    glowCtx.moveTo(x0, y0);
    glowCtx.lineTo(x1, y1);
    glowCtx.stroke();
    glowCtx.restore();

    // 2) Ana çizgiyi koyu neon tonda
    glowCtx.save();
    glowCtx.strokeStyle = color;
    glowCtx.shadowBlur = 6;
    glowCtx.lineWidth = width;
    glowCtx.lineCap = 'round';
    glowCtx.beginPath();
    glowCtx.moveTo(x0, y0);
    glowCtx.lineTo(x1, y1);
    glowCtx.stroke();
    glowCtx.restore();

    // 3) Parlak merkez
    glowCtx.save();
    glowCtx.globalCompositeOperation = 'lighter';
    glowCtx.strokeStyle = 'rgba(255,255,255,0.7)';
    glowCtx.lineWidth = Math.max(1, width * 0.35);
    glowCtx.lineCap = 'round';
    glowCtx.beginPath();
    glowCtx.moveTo(x0, y0);
    glowCtx.lineTo(x1, y1);
    glowCtx.stroke();
    glowCtx.restore();

    // 4) Glow canvas'ı ana canvas'a aktar
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(glowCanvas, 0, 0);
  }

  /* ---- Olaylar ---- */
  function pointerDown(e) {
    e.preventDefault();
    const p = getPos(e);
    state.drawing = true;
    state.lastX = p.x;
    state.lastY = p.y;
    // nokta
    neonStroke(p.x, p.y, p.x + 0.2, p.y + 0.2, state.color, state.lineWidth, state.erasing);
  }

  function pointerMove(e) {
    if (!state.drawing) return;
    e.preventDefault();
    const p = getPos(e);
    neonStroke(state.lastX, state.lastY, p.x, p.y, state.color, state.lineWidth, state.erasing);
    state.lastX = p.x;
    state.lastY = p.y;
  }

  function pointerEnd(e) {
    state.drawing = false;
  }

  // Fare
  canvas.addEventListener('mousedown', pointerDown);
  window.addEventListener('mousemove', pointerMove);
  window.addEventListener('mouseup', pointerEnd);

  // Dokunmatik
  canvas.addEventListener('touchstart', pointerDown, { passive: false });
  canvas.addEventListener('touchmove', pointerMove, { passive: false });
  canvas.addEventListener('touchend', pointerEnd);

  // Sağ lob fare: silgi modu (contextmenu bastır)
  canvas.addEventListener('contextmenu', (e) => e.preventDefault());

  // Renk seçim butonları
  const colorBtns = bodyEl.querySelectorAll('.color-btn');
  colorBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      state.color = btn.dataset.color;
      state.erasing = false;
      colorBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      // canvas imleci rengi
      canvas.style.cursor = 'crosshair';
    });
  });

  // Temizle butonu
  const clearBtn = bodyEl.querySelector('.paint-clear-btn');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      glowCtx.clearRect(0, 0, glowCanvas.width, glowCanvas.height);
    });
  }

  // Initial draw: boş arka planı
  ctx.fillStyle = '#05060f';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  glowCtx.fillStyle = '#05060f';
  glowCtx.fillRect(0, 0, canvas.width, canvas.height);

  // Shift silgiyi keskinleştir — imleç css
  state.color = '#00ffcc';
  canvas.style.cursor = 'crosshair';

  return state;
}

registerApp('paint', {
  name: 'Neon Paint',
  icon: '🎨',
  defaultWidth: 780,
  defaultHeight: 520,
  windowTitle: 'Neon Paint — Aura OS',
  windowProps: { width: 780, height: 520 },

  buildContent: paintBuildContent,

  onLaunch(record, bodyEl) {
    bodyEl.innerHTML = paintBuildContent();

    const canvas = bodyEl.querySelector('.paint-canvas');
    if (!canvas) return;

    initPaintCanvas(bodyEl, canvas);
  },
});
