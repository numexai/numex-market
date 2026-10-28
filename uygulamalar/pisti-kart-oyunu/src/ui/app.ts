/**
 * Ana uygulama — kart masasının çizimi ve etkileşim bağlantıları.
 *
 * Düzen (gerçek pişti masası):
 *          [PARTNER — üstte]
 *   [RAKIP 2 — sol]   [MASA]   [RAKIP 1 — sağ]
 *          [SEN — altta]
 *
 * Kenar panel: skor tablosu, deste sayacı, tur bilgisi, oyun günlüğü.
 */
import './styles.css';
import { createCardBack, createCardElement, layoutTableCards } from './cardView';
import { PistiController, type Extras, type GameSettings } from './controller';
import {
  playCaptureSound,
  playCardSound,
  playErrorSound,
  playPistiSound,
  playRoundEndSound,
  playWinSound,
  setSoundEnabled,
  isSoundEnabled,
} from './sound';
import { SUIT_SYMBOLS } from '../engine/deck';
import { cardPoints } from '../engine/scoring';
import type { EngineEvent } from '../engine/engine';
import type { GameState, PlayerId, RoundSummary, TeamScores } from '../engine/types';

/** DOM elemanlarını tip güvenli şekilde alır */
function el<T extends HTMLElement>(id: string): T {
  const found = document.getElementById(id);
  if (!found) throw new Error(`#${id} bulunamadı`);
  return found as T;
}

const dom = {
  table: el<HTMLDivElement>('table'),
  humanHand: el<HTMLDivElement>('human-hand'),
  partnerHand: el<HTMLDivElement>('partner-hand'),
  rakip1Hand: el<HTMLDivElement>('rakip1-hand'),
  rakip2Hand: el<HTMLDivElement>('rakip2-hand'),
  humanInfo: el<HTMLDivElement>('human-info'),
  partnerInfo: el<HTMLDivElement>('partner-info'),
  rakip1Info: el<HTMLDivElement>('rakip1-info'),
  rakip2Info: el<HTMLDivElement>('rakip2-info'),
  scoreA: el<HTMLSpanElement>('score-a'),
  scoreB: el<HTMLSpanElement>('score-b'),
  deckCount: el<HTMLSpanElement>('deck-count'),
  roundNum: el<HTMLSpanElement>('round-num'),
  turnLabel: el<HTMLSpanElement>('turn-label'),
  logList: el<HTMLDivElement>('log-list'),
  btnStart: el<HTMLButtonElement>('btn-start'),
  btnReset: el<HTMLButtonElement>('btn-reset'),
  btnSound: el<HTMLButtonElement>('btn-sound'),
  modal: el<HTMLDivElement>('modal'),
  modalTitle: el<HTMLHeadingElement>('modal-title'),
  modalBody: el<HTMLDivElement>('modal-body'),
  modalClose: el<HTMLButtonElement>('modal-close'),
  toast: el<HTMLDivElement>('toast'),
  lastMove: el<HTMLDivElement>('last-move'),
  captureBanner: el<HTMLDivElement>('capture-banner'),
  difficultySel: el<HTMLSelectElement>('difficulty'),
  modeSel: el<HTMLSelectElement>('mode'),
  playerNameInput: el<HTMLInputElement>('player-name'),
  statusChip: el<HTMLDivElement>('status-chip'),
};

let controller: PistiController;

// ─────────────────────────────── RENDER ───────────────────────────────

/** Sıra göstergesi + bilgi kartı üretir */
function playerInfoHtml(state: GameState, id: PlayerId, extras: Extras): string {
  const p = state.players[id];
  if (!p) return '';
  const active = state.turn === id && state.started && !state.finished;
  const isHuman = p.kind === 'human';
  const cardCount = extras.captured[id].length;
  const pts = extras.captured[id].reduce((s, c) => s + cardPoints(c), 0);
  const team = p.team;
  const won = state.finished && state.winner === team;
  return `
    <div class="pin__name">${p.name}${isHuman ? ' <span class="badge badge--you">SEN</span>' : ''}${
      won ? ' <span class="badge badge--win">🏆</span>' : ''
    }</div>
    <div class="pin__meta">
      <span title="Eldeki kart">🃏 ${p.hand.length}</span>
      <span title="Toplanan kart">📥 ${cardCount}</span>
      <span title="Pişti">★ ${p.stats.pistiCount}</span>
      <span title="Kart puanı">${pts} p</span>
    </div>
    ${active ? '<div class="pin__turn">SIRA BURADA</div>' : ''}
  `;
}

/** AI elini kapalı kartlar olarak dizer */
function renderHiddenHand(container: HTMLElement, count: number, owner: PlayerId): void {
  container.innerHTML = '';
  const shown = Math.min(count, 6);
  for (let i = 0; i < shown; i++) {
    const back = createCardBack(true);
    back.dataset['owner'] = String(owner);
    container.appendChild(back);
  }
  if (count > shown) {
    const more = document.createElement('div');
    more.className = 'hand-more';
    more.textContent = `+${count - shown}`;
    container.appendChild(more);
  }
}

/** İnsan elini render eder ve tıklama bağlar */
function renderHumanHand(state: GameState): void {
  dom.humanHand.innerHTML = '';
  const me = state.players[0];
  if (!me) return;
  const canPlay = controller.isHumanTurn();

  for (const card of me.hand) {
    const playable = canPlay && controller.canPlayCard(card);
    const cardEl = createCardElement(card, { playable, owner: 0 });
    if (playable) {
      const handler = (): void => {
        const ok = controller.playHuman(card);
        if (ok) {
          playCardSound();
        } else {
          playErrorSound();
          showToast('Bu kartı şu an oynayamazsın.');
        }
      };
      cardEl.addEventListener('click', handler);
      cardEl.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handler();
        }
      });
    }
    dom.humanHand.appendChild(cardEl);
  }

  if (me.hand.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'hand-empty';
    empty.textContent = state.finished ? 'Oyun bitti' : 'El boş — yeni kart bekleniyor';
    dom.humanHand.appendChild(empty);
  }
}

/** Durum etiketi */
function renderStatus(state: GameState): void {
  if (!state.started) {
    dom.statusChip.textContent = 'Hazır';
    dom.statusChip.className = 'chip chip--idle';
    dom.turnLabel.textContent = '—';
    return;
  }
  if (state.finished) {
    const w = state.winner;
    dom.statusChip.textContent = w === 'A' ? 'Bizim takım kazandı' : w === 'B' ? 'Rakipler kazandı' : 'Berabere';
    dom.statusChip.className = 'chip chip--end';
    dom.turnLabel.textContent = 'Oyun bitti';
    return;
  }
  const p = state.players[state.turn];
  dom.statusChip.textContent = p ? `Sıra: ${p.name}` : '—';
  dom.statusChip.className = state.turn === 0 ? 'chip chip--you' : 'chip chip--ai';
  dom.turnLabel.textContent = `${p?.name ?? ''}`;
}

/** Skor tablosu */
function renderScores(state: GameState, extras: Extras): void {
  dom.scoreA.textContent = String(extras.totals.A);
  dom.scoreB.textContent = String(extras.totals.B);
  dom.deckCount.textContent = String(state.deck.length);
  dom.roundNum.textContent = String(Math.max(state.round.number, 0));

  const aCaptured =
    extras.captured[0].length + extras.captured[2].length;
  const bCaptured =
    extras.captured[1].length + extras.captured[3].length;
  const elA = document.getElementById('score-a-cards');
  const elB = document.getElementById('score-b-cards');
  if (elA) elA.textContent = `${aCaptured} kart`;
  if (elB) elB.textContent = `${bCaptured} kart`;
}

/** Son hamle göstergesi */
function renderLastMove(state: GameState, extras: Extras): void {
  if (!extras.lastMove) {
    dom.lastMove.innerHTML = '<span class="muted">Henüz hamle yok</span>';
    return;
  }
  const lm = extras.lastMove;
  const p = state.players[lm.player];
  const red = lm.card.suit === 'kupa' || lm.card.suit === 'karo';
  dom.lastMove.innerHTML = `
    <span class="lm__who">${p?.name ?? ''}</span>
    <span class="lm__card ${red ? 'is-red' : 'is-black'}">${lm.card.short}${SUIT_SYMBOLS[lm.card.suit]}</span>
    <span class="lm__name">${lm.card.name}</span>
  `;
}

/** Tüm arayüzü çizer */
function render(state: GameState, extras: Extras): void {
  // Masadaki kartlar
  layoutTableCards(dom.table, state.round.table);

  // Eller
  renderHumanHand(state);
  renderHiddenHand(dom.partnerHand, state.players[1]?.hand.length ?? 0, 1);
  renderHiddenHand(dom.rakip1Hand, state.players[2]?.hand.length ?? 0, 2);
  renderHiddenHand(dom.rakip2Hand, state.players[3]?.hand.length ?? 0, 3);

  // Oyuncu bilgileri
  dom.humanInfo.innerHTML = playerInfoHtml(state, 0, extras);
  dom.partnerInfo.innerHTML = playerInfoHtml(state, 1, extras);
  dom.rakip1Info.innerHTML = playerInfoHtml(state, 2, extras);
  dom.rakip2Info.innerHTML = playerInfoHtml(state, 3, extras);

  // Sıra vurgusu (aktif koltuk)
  ([[0, dom.humanInfo], [1, dom.partnerInfo], [2, dom.rakip1Info], [3, dom.rakip2Info]] as const).forEach(
    ([id, node]) => {
      const seat = node.closest('.seat');
      if (!seat) return;
      seat.classList.toggle('seat--active', state.started && !state.finished && state.turn === id);
    },
  );

  renderScores(state, extras);
  renderStatus(state);
  renderLastMove(state, extras);

  dom.btnStart.disabled = state.started && !state.finished;
  dom.btnStart.textContent = state.finished ? 'Yeni Oyun' : state.started ? 'Oyun Sürüyor' : 'Oyunu Başlat';
}

// ─────────────────────────────── GÜNLÜK ───────────────────────────────

let logSeq = 0;
function addLog(text: string, kind = 'info'): void {
  logSeq++;
  const line = document.createElement('div');
  line.className = `log__line log__line--${kind}`;
  line.innerHTML = `<span class="log__seq">${logSeq}</span><span class="log__text">${text}</span>`;
  dom.logList.appendChild(line);
  dom.logList.scrollTop = dom.logList.scrollHeight;
  while (dom.logList.children.length > 200) {
    dom.logList.removeChild(dom.logList.firstChild as Node);
  }
}

// ──────────────────────────── BİLDİRİMLER ────────────────────────────

let toastTimer: number | null = null;
/** Kısa uyarı balonu */
function showToast(message: string, duration = 1800): void {
  dom.toast.textContent = message;
  dom.toast.classList.add('toast--show');
  if (toastTimer !== null) window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => {
    dom.toast.classList.remove('toast--show');
  }, duration);
}

let bannerTimer: number | null = null;
/** Ortada büyük pişti/alma bildirimi */
function showBanner(text: string, variant: 'pisti' | 'capture'): void {
  dom.captureBanner.textContent = text;
  dom.captureBanner.className = `banner banner--${variant} banner--show`;
  if (bannerTimer !== null) window.clearTimeout(bannerTimer);
  bannerTimer = window.setTimeout(() => {
    dom.captureBanner.classList.remove('banner--show');
  }, 1500);
}

// ─────────────────────────────── MODAL ───────────────────────────────

function openModal(title: string, bodyHtml: string): void {
  dom.modalTitle.textContent = title;
  dom.modalBody.innerHTML = bodyHtml;
  dom.modal.classList.add('modal--open');
  dom.modal.setAttribute('aria-hidden', 'false');
}

function closeModal(): void {
  dom.modal.classList.remove('modal--open');
  dom.modal.setAttribute('aria-hidden', 'true');
}

/** Tur sonu özeti */
function showSummaryModal(summary: RoundSummary, totals: TeamScores): void {
  const rows = summary.perPlayer
    .map(
      (r) =>
        `<tr><td>${r.name}</td><td class="num">${r.capturedCount}</td><td class="num">${r.pistiCount}</td><td class="num">${r.rawPoints}</td></tr>`,
    )
    .join('');
  const majority =
    summary.majorityTeam === null
      ? 'Kart çoğunluğu: eşitlik (bonus verilmedi)'
      : `Kart çoğunluğu bonusu (+3) → ${summary.majorityTeam === 'A' ? 'Bizim Takım' : 'Rakipler'}`;
  openModal(
    `${summary.round}. Tur Sonu`,
    `
    <table class="summary-table">
      <thead><tr><th>Oyuncu</th><th class="num">Kart</th><th class="num">Pişti</th><th class="num">Puan</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <div class="summary-breakdown">
      <div>Kart puanı → Bizim: <b>${summary.teamPoints.A}</b> | Rakipler: <b>${summary.teamPoints.B}</b></div>
      <div>Pişti puanı → Bizim: <b>${summary.pistiPoints.A}</b> | Rakipler: <b>${summary.pistiPoints.B}</b></div>
      <div>${majority}</div>
      <div class="summary-total">TOPLAM SKOR → Bizim: <b>${totals.A}</b> | Rakipler: <b>${totals.B}</b></div>
    </div>
  `,
  );
}

/** Oyun sonu */
function showGameEndModal(totals: TeamScores, winner: 'A' | 'B' | null): void {
  const title = winner === 'A' ? '🏆 Bizim Takım Kazandı!' : winner === 'B' ? 'Rakipler Kazandı' : 'Berabere!';
  openModal(
    title,
    `
    <div class="end-score">
      <div class="end-score__row"><span>Bizim Takım (Sen + Partner)</span><b>${totals.A}</b></div>
      <div class="end-score__row"><span>Rakipler (Rakip 1 + Rakip 2)</span><b>${totals.B}</b></div>
    </div>
    <p class="muted">Yeni oyun için "Yeniden Oyna"ya bas.</p>
    <button class="btn btn--primary" id="modal-replay">Yeniden Oyna</button>
  `,
  );
  const replay = document.getElementById('modal-replay');
  replay?.addEventListener('click', () => {
    closeModal();
    restartGame();
  });
  if (winner === 'A') playWinSound();
}

// ───────────────────────────── OLAY BAĞLAMA ─────────────────────────────

/** Motor olaylarını ses/animasyon bildirimlerine çevirir */
function handleEngineEvent(ev: EngineEvent): void {
  switch (ev.type) {
    case 'play':
      break;
    case 'capture':
      if (ev.pisti) {
        playPistiSound();
        showBanner('★ PİŞTİ! +10', 'pisti');
      } else {
        playCaptureSound();
        showBanner(`${ev.cards.length} kart alındı`, 'capture');
      }
      break;
    case 'roundEnd':
      playRoundEndSound();
      break;
    case 'lastHand':
      showToast(`Son elde kalan ${ev.cards.length} kart ${ev.player === 0 ? 'sana' : 'oyuncuya'} verildi.`, 2200);
      break;
    default:
      break;
  }
}

/** Oyunu başlat */
function startGame(): void {
  dom.logList.innerHTML = '';
  logSeq = 0;
  addLog('Oyun başladı. Bol şans!', 'round');
  controller.start();
}

/** Yeniden başlat */
function restartGame(): void {
  dom.logList.innerHTML = '';
  logSeq = 0;
  addLog('Yeni oyun kuruldu.', 'round');
  controller.restart();
}

/** Ayarları oku */
function readSettings(): Partial<GameSettings> {
  const mode = dom.modeSel.value;
  const diff = dom.difficultySel.value as 'kolay' | 'normal' | 'zor';
  const name = dom.playerNameInput.value.trim() || 'Sen';
  return {
    soloVsAi: mode === 'solo',
    playerName: name,
    difficulties: { 0: 'normal', 1: diff, 2: diff, 3: diff },
  };
}

/** Motor günlüğünü UI günlüğüne senkronize eder (yeni satırları akıtır) */
function syncLog(): void {
  const st = controller.getEngine().getState();
  if (st.log.length === 0) return;
  for (const entry of st.log) {
    if (entry.seq > lastLoggedSeq) {
      addLog(entry.text, entry.kind);
      lastLoggedSeq = entry.seq;
    }
  }
}

/** Uygulamayı kur */
function init(): void {
  controller = new PistiController(
    {
      onRender: (state, extras) => {
        render(state, extras);
        syncLog();
      },
      onEvent: handleEngineEvent,
      onSummary: (summary: RoundSummary) => {
        const totals = controller.getEngine().getExtras().totals;
        showSummaryModal(summary, totals);
      },
      onGameEnd: (totals: TeamScores, winner: 'A' | 'B' | null) => {
        showGameEndModal(totals, winner);
      },
      onLog: (text: string) => addLog(text, 'info'),
    },
    {
      soloVsAi: false,
      difficulties: { 0: 'normal', 1: 'normal', 2: 'normal', 3: 'normal' },
      playerName: 'Sen',
      aiDelay: 900,
    },
  );

  controller.applySettings(readSettings());
  controller.render();

  // Butonlar
  dom.btnStart.addEventListener('click', () => {
    const st = controller.getEngine().getState();
    if (st.finished || !st.started) startGame();
  });
  dom.btnReset.addEventListener('click', () => {
    dom.logList.innerHTML = '';
    logSeq = 0;
    lastLoggedSeq = 0;
    controller.reset();
    addLog('Oyun sıfırlandı.', 'info');
  });
  dom.btnSound.addEventListener('click', () => {
    const next = !isSoundEnabled();
    setSoundEnabled(next);
    dom.btnSound.textContent = next ? '🔊' : '🔇';
  });
  dom.modalClose.addEventListener('click', closeModal);
  dom.modal.addEventListener('click', (e) => {
    if (e.target === dom.modal) closeModal();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
  });

  dom.modeSel.addEventListener('change', () => {
    controller.applySettings(readSettings());
    addLog('Mod değişti. "Oyunu Başlat"a bas.', 'info');
  });
  dom.difficultySel.addEventListener('change', () => {
    controller.applySettings(readSettings());
    addLog('Zorluk değişti. "Oyunu Başlat"a bas.', 'info');
  });
  dom.playerNameInput.addEventListener('change', () => {
    controller.applySettings(readSettings());
  });

  addLog('Hoş geldin! Ayarları seçip "Oyunu Başlat"a bas.', 'round');
}

/** Günlük senkronizasyon sayacı (modül seviyesinde) */
let lastLoggedSeq = 0;

document.addEventListener('DOMContentLoaded', init);
