/**
 * Kart DOM bileşeni — gerçek kart tasarımı.
 * Engine'den gelen Card nesnesini görsel bir karta çevirir.
 * UI/motor ayrımı: bu modül SADECE görsel üretir, oyun mantığı içermez.
 */
import { isRed, SUIT_SYMBOLS } from '../engine/deck';
import { cardPoints } from '../engine/scoring';
import type { Card } from '../engine/types';

/** Kart elemanına eklenen veri öznitelikleri */
export const CARD_DATA = {
  id: 'data-card-id',
  owner: 'data-owner',
  playable: 'data-playable',
} as const;

/**
 * Bir kart DOM elemanı üretir.
 * @param card     kart nesnesi
 * @param opts     faceDown = kapalı kart, playable = tıklanabilir, owner = sahip id
 */
export interface CardElOptions {
  faceDown?: boolean;
  playable?: boolean;
  owner?: number;
  /** küçük boyut (rakip elleri) */
  small?: boolean;
}

export function createCardElement(card: Card, opts: CardElOptions = {}): HTMLElement {
  const el = document.createElement('div');
  el.className = 'card';
  el.dataset['cardId'] = card.id;
  if (opts.owner !== undefined) el.dataset['owner'] = String(opts.owner);
  if (opts.faceDown) el.classList.add('card--down');
  if (opts.small) el.classList.add('card--small');
  if (!opts.faceDown) el.classList.add(isRed(card) ? 'card--red' : 'card--black');
  if (opts.playable) {
    el.classList.add('card--playable');
    el.dataset['playable'] = '1';
    el.setAttribute('role', 'button');
    el.setAttribute('tabindex', '0');
    el.setAttribute('aria-label', `${card.name} oyna`);
  }

  if (opts.faceDown) {
    el.innerHTML = '<div class="card__back"></div>';
    el.setAttribute('aria-label', 'Kapalı kart');
    return el;
  }

  const symbol = SUIT_SYMBOLS[card.suit];
  const pts = cardPoints(card);
  el.innerHTML = `
    <div class="card__corner card__corner--tl">
      <span class="card__rank">${card.short}</span>
      <span class="card__suit">${symbol}</span>
    </div>
    <div class="card__center">${symbol}</div>
    <div class="card__corner card__corner--br">
      <span class="card__rank">${card.short}</span>
      <span class="card__suit">${symbol}</span>
    </div>
    ${pts > 0 ? `<div class="card__points" title="${pts} puan">${pts}</div>` : ''}
  `;
  el.title = pts > 0 ? `${card.name} — ${pts} puan` : card.name;
  return el;
}

/** Kapalı kart (deste/rakip eli) */
export function createCardBack(small = false): HTMLElement {
  const el = document.createElement('div');
  el.className = `card card--down${small ? ' card--small' : ''}`;
  el.innerHTML = '<div class="card__back"></div>';
  el.setAttribute('aria-label', 'Kapalı kart');
  return el;
}

/** Yerdeki kartları üst üste hafif kaydırarak dizer */
export function layoutTableCards(container: HTMLElement, cards: readonly Card[]): void {
  container.innerHTML = '';
  const maxVisible = 8;
  const shown = cards.length > maxVisible ? cards.slice(cards.length - maxVisible) : cards;
  shown.forEach((card, i) => {
    const el = createCardElement(card);
    el.classList.add('card--table');
    el.style.setProperty('--stack-index', String(i));
    container.appendChild(el);
  });
  const count = document.createElement('div');
  count.className = 'table-count';
  count.textContent = cards.length > 0 ? `Yerde: ${cards.length} kart` : 'Masa boş';
  container.appendChild(count);
}
