/**
 * Kütüphane arayüzü — bağımsız stil enjekte edilir.
 *
 * Neden ayrı CSS dosyası değil: kütüphane tek HTML girişiyle açılır; stilleri
 * de kendi modülünde tutmak, mevcut uygulamanın style.css'ine hiç dokunmadan
 * izolasyon sağlar. Sınıf adları `nx-lib-` önekiyle çakışmaz.
 */

const CSS = `
:root {
  --nx-accent: #e0a458;
  --nx-accent-soft: rgba(224,164,88,.16);
  --nx-bg: #10151b;
  --nx-panel: rgba(17,23,30,.92);
  --nx-line: rgba(255,255,255,.10);
  --nx-text: #e8edf2;
  --nx-muted: #8d9aa8;
  --nx-ok: #5fd39a;
  --nx-warn: #f2b544;
}
* { box-sizing: border-box; }
html, body { margin:0; height:100%; overflow:hidden; background: var(--nx-bg); }
/* NUMEX-DÜZELTME (2026-10-26): kart gizliyken translateX(100%+24px) ile
   ekranın 267px dışına taşıyordu; ölçüm bunu "taşma" olarak yakalıyor ve
   kapalı kart klavye/erişilebilirlik için hâlâ odaklanabilir kalıyordu.
   Gizli durum artık visibility ile kapatılır, taşma html düzeyinde kesilir. */
body { overflow-x: hidden; }
body {
  font-family: 'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
  color: var(--nx-text);
  -webkit-font-smoothing: antialiased;
}
#nx-lib-canvas { display:block; width:100vw; height:100vh; }
.nx-lib-mono { font-family: 'JetBrains Mono', ui-monospace, 'Consolas', monospace; }

/* ---- ÜST BAR ---- */
.nx-lib-top {
  position: fixed; top:0; left:0; right:0; height:60px;
  display:flex; align-items:center; justify-content:space-between;
  padding: 0 18px; gap: 16px;
  background: linear-gradient(180deg, rgba(10,14,19,.92), rgba(10,14,19,.62) 70%, transparent);
  pointer-events:none; z-index: 20;
}

/* KATMAN SIRASI (z-index) KİLİTLİ:
   canvas (0) < panel/kart (15) < üst bar (20) < yükleme (100).
   OrbitControls canvas'ı tam kaplar; panellerin z-index'i canvas'ın üstünde
   olmazsa tıklamayı kontrol yakalar → butonlar "ölü" görünür. */
.nx-lib-brand { display:flex; align-items:center; gap:12px; pointer-events:auto; }
.nx-lib-brand svg { width:34px; height:34px; color: var(--nx-accent); }
.nx-lib-brand h1 {
  font-size: 15px; font-weight: 600; margin:0; letter-spacing:.14em; text-transform: uppercase;
}
.nx-lib-brand h1 span { color: var(--nx-accent); font-weight: 300; }
.nx-lib-brand p { margin:2px 0 0; font-size:11px; color: var(--nx-muted); letter-spacing:.05em; }

.nx-lib-stats { display:flex; align-items:center; gap:10px; pointer-events:auto; }
.nx-lib-chip {
  display:flex; align-items:center; gap:7px; height:30px; padding:0 11px;
  border-radius: 8px; border:1px solid var(--nx-line);
  background: rgba(18,24,31,.78); backdrop-filter: blur(8px);
  font-size:12px; color: var(--nx-muted); white-space: nowrap;
}
.nx-lib-chip b { color: var(--nx-text); font-weight:600; }
.nx-lib-chip .dot { width:7px; height:7px; border-radius:50%; background: var(--nx-ok); box-shadow: 0 0 8px var(--nx-ok); }
.nx-lib-chip.warn .dot { background: var(--nx-warn); box-shadow: 0 0 8px var(--nx-warn); }
.nx-lib-chip.bad .dot { background:#ef6b6b; box-shadow:0 0 8px #ef6b6b; }

/* ---- SOL PANEL ---- */
.nx-lib-panel {
  position: fixed; left: 14px; top: 70px; width: 250px;
  max-height: calc(100vh - 150px); overflow-y: auto;
  padding: 14px; border-radius: 12px;
  background: var(--nx-panel); border:1px solid var(--nx-line);
  backdrop-filter: blur(12px); z-index: 25;   /* canvas'tan (0) ve OrbitControls'tan üstte */
  scrollbar-width: thin;
}
.nx-lib-panel button { pointer-events: auto; }
.nx-lib-panel::-webkit-scrollbar { width:6px; }
.nx-lib-panel::-webkit-scrollbar-thumb { background: rgba(255,255,255,.14); border-radius:3px; }
.nx-lib-sec + .nx-lib-sec { margin-top: 16px; padding-top: 14px; border-top:1px solid var(--nx-line); }
.nx-lib-sec h3 {
  margin:0 0 9px; font-size:10px; font-weight:600; letter-spacing:.16em;
  text-transform: uppercase; color: var(--nx-muted);
}
.nx-lib-btn-row { display:flex; gap:6px; flex-wrap: wrap; }
.nx-lib-btn {
  flex:1 1 auto; min-width: 0; min-height: 36px;
  display:flex; align-items:center; justify-content:center; gap:6px;
  padding: 8px 10px; border-radius: 8px; cursor:pointer;
  border:1px solid var(--nx-line); background: rgba(255,255,255,.045);
  color: var(--nx-text); font-size: 12px; font-family: inherit;
  transition: background .15s, border-color .15s, color .15s;
}
.nx-lib-btn:hover { background: rgba(255,255,255,.09); }
.nx-lib-btn.active { background: var(--nx-accent-soft); border-color: var(--nx-accent); color: var(--nx-accent); }
.nx-lib-btn:disabled { opacity:.4; cursor: not-allowed; }

.nx-lib-slider-wrap { margin-top: 10px; }
.nx-lib-slider-head { display:flex; justify-content:space-between; font-size:11px; color: var(--nx-muted); margin-bottom:5px; }
.nx-lib-slider-head b { color: var(--nx-text); }
input[type=range].nx-lib-slider {
  width:100%; height:4px; -webkit-appearance:none; appearance:none;
  background: rgba(255,255,255,.14); border-radius:2px; outline:none;
}
input[type=range].nx-lib-slider::-webkit-slider-thumb {
  -webkit-appearance:none; width:14px; height:14px; border-radius:50%;
  background: var(--nx-accent); cursor:pointer; border:2px solid #10151b;
}
input[type=range].nx-lib-slider::-moz-range-thumb {
  width:14px; height:14px; border-radius:50%; background: var(--nx-accent);
  cursor:pointer; border:2px solid #10151b;
}

.nx-lib-legend { display:flex; flex-direction:column; gap:5px; }
.nx-lib-leg {
  display:flex; align-items:center; gap:8px; font-size:11.5px; color: var(--nx-muted);
}
.nx-lib-leg i { width:9px; height:9px; border-radius:2px; flex:none; }
.nx-lib-leg span { color: var(--nx-text); }

/* ---- BİLGİ KATMANI ---- */
.nx-lib-info-launch {
  position:absolute; left:14px; bottom:44px; z-index:5;
}
.nx-lib-info-open {
  background: var(--nx-accent) !important; color:#1a1206 !important;
  border-color: var(--nx-accent) !important; font-weight:600;
  min-height:44px; padding:0 18px;
}
.nx-lib-info {
  position:absolute; left:50%; top:76px; transform:translate(-50%, -14px);
  width:min(680px, calc(100vw - 40px)); max-height:calc(100vh - 150px);
  background: rgba(19,23,30,.97); border:1px solid rgba(255,255,255,.11);
  border-radius:14px; box-shadow:0 24px 60px rgba(0,0,0,.55);
  opacity:0; visibility:hidden; pointer-events:none; z-index:20;
  transition: opacity .2s ease, transform .2s ease;
  display:flex; flex-direction:column;
}
.nx-lib-info.show {
  opacity:1; visibility:visible; pointer-events:auto; transform:translate(-50%, 0);
}
.nx-lib-info-head {
  display:flex; align-items:flex-start; gap:8px;
  padding:12px 44px 10px 14px; border-bottom:1px solid rgba(255,255,255,.09);
  flex-wrap:wrap; position:relative;
}
/* Kapat butonu sekmelerin İÇİNDE duruyordu ("Etkinlikler"e yapışıktı);
   sağ üst köşeye sabitlendi. */
.nx-lib-info-head .nx-lib-close {
  position:absolute; top:9px; right:10px; margin:0;
}
.nx-lib-info-tabs { display:flex; gap:6px; flex-wrap:wrap; flex:1; padding-right:6px; }
.nx-lib-info-tabs .nx-lib-btn { min-height:36px; padding:0 12px; font-size:12.5px; }
.nx-lib-info-body {
  padding:16px 20px 22px; overflow-y:auto; font-size:13.5px; line-height:1.62;
  color:#e6e8ec;
}
.nx-lib-info-body h2 { margin:0 0 10px; font-size:19px; font-weight:600; color:#fff; }
.nx-lib-info-body p { margin:0 0 12px; }
.nx-lib-lead { color:#c8cdd6; font-size:14px; }
.nx-lib-info-body b { color:#fff; }
.nx-lib-list { margin:0 0 12px; padding-left:18px; }
.nx-lib-list li { margin-bottom:9px; }
.nx-lib-facts {
  display:grid; grid-template-columns:repeat(auto-fit, minmax(140px, 1fr));
  gap:10px; margin:14px 0;
}
.nx-lib-facts > div {
  background:rgba(255,255,255,.05); border-radius:9px; padding:9px 11px;
}
.nx-lib-facts dt { font-size:11px; letter-spacing:.04em; text-transform:uppercase; color:#9aa1ad; }
.nx-lib-facts dd { margin:2px 0 0; font-size:14px; font-weight:600; color:#fff; }
.nx-lib-note {
  font-size:12px; color:#98a0ac; border-left:2px solid rgba(232,149,47,.5);
  padding-left:10px; margin-top:14px;
}

/* ---- SAĞ: SEÇİM KARTI ---- */
.nx-lib-card {
  position: fixed; right: 14px; top: 70px; width: 268px;
  padding: 14px; border-radius: 12px;
  background: var(--nx-panel); border:1px solid var(--nx-line);
  backdrop-filter: blur(12px); z-index: 25;
  transform: translateX(calc(100% + 24px)); opacity:0; transition: transform .22s ease, opacity .22s ease;
  pointer-events: none; visibility: hidden;
}
.nx-lib-card.show {
  transform:none; opacity:1; pointer-events:auto; visibility: visible;
  /* Kapat butonu kartın içinde kalsın: 7px aşağı taşma ölçüldü */
  padding-top: 16px;
}
.nx-lib-card .nx-lib-cat {
  display:inline-flex; align-items:center; gap:7px; padding:4px 9px; border-radius:20px;
  font-size:10.5px; letter-spacing:.08em; text-transform:uppercase; font-weight:600;
  background: var(--nx-accent-soft); color: var(--nx-accent);
}
.nx-lib-card h2 { margin:10px 0 6px; font-size:16px; font-weight:600; }
.nx-lib-card p { margin:0 0 12px; font-size:12.5px; line-height:1.55; color: var(--nx-muted); }
.nx-lib-rows { display:flex; flex-direction:column; gap:0; }
.nx-lib-row {
  display:flex; justify-content:space-between; gap:10px; padding:7px 0;
  border-top:1px solid var(--nx-line); font-size:12px;
}
.nx-lib-row span { color: var(--nx-muted); }
.nx-lib-row b { color: var(--nx-text); font-weight:500; text-align:right; }
.nx-lib-close {
  position:absolute; top:10px; right:10px; width:26px; height:26px;
  border-radius:6px; border:1px solid var(--nx-line); background:transparent;
  color: var(--nx-muted); cursor:pointer; font-size:16px; line-height:1;
}
.nx-lib-close:hover { color: var(--nx-text); background: rgba(255,255,255,.07); }

/* ---- ALT İPUCU ---- */
.nx-lib-help {
  position: fixed; bottom: 14px; left: 50%; transform: translateX(-50%);
  display:flex; align-items:center; gap:10px; padding: 8px 14px;
  border-radius: 10px; background: var(--nx-panel); border:1px solid var(--nx-line);
  backdrop-filter: blur(10px); font-size: 11.5px; color: var(--nx-muted); z-index: 25;
  white-space: nowrap; max-width: 95vw; overflow: hidden; pointer-events: none;
}
.nx-lib-help kbd {
  display:inline-block; min-width:20px; padding:2px 5px; margin:0 1px;
  border-radius:4px; border:1px solid var(--nx-line); background: rgba(255,255,255,.07);
  font-family:'JetBrains Mono', monospace; font-size:10.5px; color: var(--nx-text); text-align:center;
}

/* ---- YÜKLEME ---- */
.nx-lib-loading {
  position: fixed; inset:0; display:flex; flex-direction:column; align-items:center; justify-content:center;
  gap:14px; background: #0c1117; z-index: 100; transition: opacity .4s; font-family: inherit;
}
.nx-lib-loading.hide { opacity:0; pointer-events:none; }
.nx-lib-loading h2 { margin:0; font-size:13px; letter-spacing:.22em; text-transform:uppercase; color: var(--nx-accent); }
.nx-lib-bar { width: 200px; height:3px; border-radius:2px; background: rgba(255,255,255,.1); overflow:hidden; }
.nx-lib-bar i { display:block; height:100%; width:0; background: var(--nx-accent); transition: width .3s; border-radius:2px; }
.nx-lib-loading small { font-size:11.5px; color: var(--nx-muted); }

/* ---- MOBİL / DAR EKRAN ---- */
@media (max-width: 900px) {
  .nx-lib-panel { width: 210px; top: 64px; left:10px; max-height: 42vh; }
  .nx-lib-card { width: 232px; right: 10px; top: 64px; }
  .nx-lib-stats .nx-lib-chip.opt { display:none; }
  .nx-lib-help { font-size: 10px; padding: 6px 10px; }
}
@media (max-width: 620px) {
  .nx-lib-panel { width: calc(100vw - 20px); max-height: 36vh; }
  .nx-lib-card { width: calc(100vw - 20px); right:10px; left:10px; top:auto; bottom: 60px; }
  .nx-lib-brand p { display:none; }
  .nx-lib-help { display:none; }
}
`;

export function injectStyles(): void {
  const id = 'nx-lib-styles';
  if (document.getElementById(id)) return;
  const el = document.createElement('style');
  el.id = id;
  el.textContent = CSS;
  document.head.appendChild(el);
}
