/**
 * Numex Quantum Lab — UI yardımcıları.
 * DOM üretimi, bildirimler ve küçük biçimlendirme fonksiyonları.
 */

/** Güvenli DOM elemanı üretir. */
export function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === null || v === undefined || v === false) continue;
    if (k === 'class') node.className = v;
    else if (k === 'text') node.textContent = v;
    else if (k === 'html') node.innerHTML = v;
    else if (k === 'style' && typeof v === 'object') Object.assign(node.style, v);
    else if (k.startsWith('on') && typeof v === 'function') {
      node.addEventListener(k.slice(2).toLowerCase(), v);
    } else if (k === 'dataset' && typeof v === 'object') {
      Object.assign(node.dataset, v);
    } else node.setAttribute(k, v);
  }
  const list = Array.isArray(children) ? children : [children];
  for (const ch of list) {
    if (ch === null || ch === undefined) continue;
    node.appendChild(typeof ch === 'string' ? document.createTextNode(ch) : ch);
  }
  return node;
}

/** id ile eleman bulur. */
export function $(id) {
  return document.getElementById(id);
}

/* ------------------------------------------------------------------ */
/* Toast bildirimleri                                                  */
/* ------------------------------------------------------------------ */

let toastKonteyner = null;

export function toast(mesaj, tip = 'info', sure = 3200) {
  if (!toastKonteyner) {
    toastKonteyner = el('div', { id: 'toasts' });
    document.body.appendChild(toastKonteyner);
  }
  const t = el('div', { class: `toast ${tip}`, text: mesaj });
  toastKonteyner.appendChild(t);
  setTimeout(() => {
    t.style.transition = 'opacity .25s, transform .25s';
    t.style.opacity = '0';
    t.style.transform = 'translateX(20px)';
    setTimeout(() => t.remove(), 260);
  }, sure);
  return t;
}

/* ------------------------------------------------------------------ */
/* Biçimlendirme yardımcıları                                          */
/* ------------------------------------------------------------------ */

/** Sayıyı kısa ondalıklı yazar (0.7071). */
export function num(v, d = 4) {
  return Number(v).toFixed(d);
}

/** Yüzde metni. */
export function pct(v, d = 1) {
  return `${(v * 100).toFixed(d)}%`;
}

/** Açı radyanını okunabilir yazar: "π/2", "π/4", "0.7854". */
export function aciMetni(theta) {
  if (theta === null || theta === undefined) return '';
  const piKat = theta / Math.PI;
  const yaygin = [
    [1, 'π'], [-1, '-π'],
    [0.5, 'π/2'], [-0.5, '-π/2'],
    [0.25, 'π/4'], [-0.25, '-π/4'],
    [2, '2π'], [-2, '-2π'],
    [1.5, '3π/2'], [-1.5, '-3π/2'],
  ];
  for (const [k, s] of yaygin) {
    if (Math.abs(piKat - k) < 1e-9) return `${s}`;
  }
  return theta.toFixed(4);
}

/** Dereceyi okunabilir yazar. */
export function derece(rad) {
  const d = (rad * 180) / Math.PI;
  return `${d.toFixed(1)}°`;
}

/** Kapı kategorisi → CSS renk sınıfı. */
export function gateCategory(type) {
  if (['x', 'y', 'z'].includes(type)) return 'pauli';
  if (type === 'h') return 'hadamard';
  if (['s', 't'].includes(type)) return 'phase';
  if (['rx', 'ry', 'rz', 'i'].includes(type)) return 'rot';
  if (['cnot', 'cz'].includes(type)) return 'cnot';
  if (type === 'swap') return 'swap';
  return 'rot';
}

/** Kapı üzerinde gösterilecek kısa etiket (parametreliyse açı ile). */
export function gateDisplay(type, params) {
  if (params && params.theta !== undefined && ['rx', 'ry', 'rz'].includes(type)) {
    return `${type.charAt(0).toUpperCase()}${type.charAt(1)}`;
  }
  if (type === 'cnot') return 'X';
  if (type === 'cz') return 'Z';
  if (type === 'swap') return '⇄';
  return type.toUpperCase();
}

/* ------------------------------------------------------------------ */
/* Dosya indir / yükle                                                 */
/* ------------------------------------------------------------------ */

export function dosyaIndir(icerik, dosyaAdi, mime = 'application/json') {
  const blob = new Blob([icerik], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = el('a', { href: url, download: dosyaAdi });
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function dosyaSec(accept = '.json') {
  return new Promise((resolve) => {
    const input = el('input', { type: 'file', accept, style: { display: 'none' } });
    document.body.appendChild(input);
    input.addEventListener('change', () => {
      const f = input.files?.[0];
      if (!f) {
        input.remove();
        resolve(null);
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        input.remove();
        resolve({ ad: f.name, icerik: String(reader.result) });
      };
      reader.onerror = () => {
        input.remove();
        resolve(null);
      };
      reader.readAsText(f);
    });
    input.click();
  });
}

/* ------------------------------------------------------------------ */
/* Modal                                                               */
/* ------------------------------------------------------------------ */

/**
 * Basit modal — açıklama + girdi + hızlı seçenekler.
 * Promise<string|null> döner.
 */
export function aciliModal({ baslik, aciklama, varsayilan = '', hizliSecenekler = [] }) {
  return new Promise((resolve) => {
    const input = el('input', { type: 'text', value: String(varsayilan) });

    const kapat = (sonuc) => {
      backdrop.remove();
      document.removeEventListener('keydown', escHandler);
      resolve(sonuc);
    };

    const escHandler = (e) => {
      if (e.key === 'Escape') kapat(null);
      if (e.key === 'Enter' && document.activeElement === input) kapat(input.value);
    };

    const hizli = el('div', { class: 'quick' },
      hizliSecenekler.map((h) =>
        el('button', {
          type: 'button',
          text: h.etiket,
          onclick: () => {
            input.value = h.deger;
            input.focus();
          },
        })
      )
    );

    const modal = el('div', { class: 'modal' }, [
      el('h3', { text: baslik }),
      aciklama ? el('p', { text: aciklama }) : null,
      el('div', { class: 'row' }, [input]),
      hizliSecenekler.length ? hizli : null,
      el('div', { class: 'modal-actions' }, [
        el('button', { class: 'btn', text: 'İptal', onclick: () => kapat(null) }),
        el('button', { class: 'btn btn-primary', text: 'Uygula', onclick: () => kapat(input.value) }),
      ]),
    ]);

    const backdrop = el('div', {
      class: 'modal-backdrop',
      onclick: (e) => {
        if (e.target === backdrop) kapat(null);
      },
    }, [modal]);

    document.body.appendChild(backdrop);
    document.addEventListener('keydown', escHandler);
    setTimeout(() => {
      input.focus();
      input.select();
    }, 40);
  });
}
