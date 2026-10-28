'use strict';

/**
 * Sürükle-bırak — Kanban kolonları arası görev taşıma.
 * HTML5 Drag&Drop API kullanılır. Bırakıldığında:
 *   1) kart iyimser (optimistic) olarak taşınır  → arayüz beklemez
 *   2) sunucuya PATCH atılır
 *   3) hata olursa kart ESKİ yerine geri alınır ve kullanıcıya bildirilir
 * Klavye erişilebilirliği: kart seçili iken ← → tuşlarıyla da taşınabilir.
 */

const DnD = (() => {
  let draggingId = null;
  let selectedId = null;

  function attach(root, opts) {
    root.addEventListener('dragstart', (e) => {
      const card = e.target.closest('.kanban-card');
      if (!card) return;
      draggingId = card.dataset.id;
      card.classList.add('is-dragging');
      e.dataTransfer.effectAllowed = 'move';
      try { e.dataTransfer.setData('text/plain', draggingId); } catch (_) { /* bazı tarayıcılar kısıtlar */ }
    });

    root.addEventListener('dragend', (e) => {
      const card = e.target.closest('.kanban-card');
      if (card) card.classList.remove('is-dragging');
      root.querySelectorAll('.kanban-col').forEach((c) => c.classList.remove('is-over'));
      draggingId = null;
    });

    root.addEventListener('dragover', (e) => {
      const col = e.target.closest('.kanban-col');
      if (!col || !draggingId) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      root.querySelectorAll('.kanban-col').forEach((c) => c.classList.toggle('is-over', c === col));
    });

    root.addEventListener('dragleave', (e) => {
      const col = e.target.closest('.kanban-col');
      if (col && !col.contains(e.relatedTarget)) col.classList.remove('is-over');
    });

    root.addEventListener('drop', (e) => {
      const col = e.target.closest('.kanban-col');
      if (!col) return;
      e.preventDefault();
      const id = draggingId || e.dataTransfer.getData('text/plain');
      const status = col.dataset.status;
      root.querySelectorAll('.kanban-col').forEach((c) => c.classList.remove('is-over'));
      if (!id || !status) return;
      opts.onDrop(id, status);
    });

    /* --- Klavye ile taşıma --- */
    root.addEventListener('click', (e) => {
      const card = e.target.closest('.kanban-card');
      if (!card) return;
      if (e.target.closest('[data-action]')) return; // düzenle/sil butonları
      selectedId = card.dataset.id === selectedId ? null : card.dataset.id;
      root.querySelectorAll('.kanban-card').forEach((c) => {
        c.classList.toggle('is-selected', c.dataset.id === selectedId);
      });
    });

    root.addEventListener('keydown', (e) => {
      if (!selectedId) return;
      const order = ['todo', 'in_progress', 'done'];
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      const card = root.querySelector(`.kanban-card[data-id="${selectedId}"]`);
      if (!card) return;
      e.preventDefault();
      const current = order.indexOf(card.dataset.status);
      const next = e.key === 'ArrowRight' ? current + 1 : current - 1;
      if (next < 0 || next >= order.length) return;
      opts.onDrop(selectedId, order[next]);
    });
  }

  function clearSelection(root) {
    selectedId = null;
    root.querySelectorAll('.kanban-card.is-selected').forEach((c) => c.classList.remove('is-selected'));
  }

  return { attach, clearSelection };
})();
