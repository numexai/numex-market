/* categories.js — kategori silme + kategori ekleme formu */

(function () {
  'use strict';

  /* ---- Kategori silme (list sayfası) ---- */
  document.querySelectorAll('.delete-category').forEach(function (btn) {
    btn.addEventListener('click', function () {
      const id = btn.dataset.id;
      const name = btn.dataset.name;
      if (!confirm('"' + name + '" kategorisini silmek istediğinize emin misiniz?')) return;
      fetch('/api/categories/' + id, { method: 'DELETE' })
        .then(function (res) {
          if (res.status === 204) { window.location.reload(); return; }
          return res.json().then(function (d) { throw new Error(d.error || 'Silinemedi'); });
        })
        .catch(function (err) { alert('Hata: ' + err.message); });
    });
  });

  /* ---- Kategori ekleme formu (new sayfası) ---- */
  const catForm = document.getElementById('categoryForm');
  if (catForm) {
    catForm.addEventListener('submit', function (e) {
      e.preventDefault();
      const errBox = document.getElementById('categoryError');
      errBox.style.display = 'none';
      const name = document.getElementById('catName').value;

      fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name })
      })
        .then(function (res) {
          return res.json().then(function (d) {
            if (!res.ok) throw new Error(d.error || 'Ekleme başarısız');
            return d;
          });
        })
        .then(function () { window.location.href = '/api/categories'; })
        .catch(function (err) {
          errBox.textContent = err.message;
          errBox.style.display = 'block';
        });
    });
  }
})();
