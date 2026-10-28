/* products.js — ürün formu AJAX, silme, stok işlem modalı */

(function () {
  'use strict';

  function showError(el, msg) {
    el.textContent = msg;
    el.style.display = 'block';
  }
  function hideError(el) { el.style.display = 'none'; }

  /* ---- Ürün silme (list sayfası) ---- */
  document.querySelectorAll('.delete-product').forEach(function (btn) {
    btn.addEventListener('click', function () {
      const id = btn.dataset.id;
      if (!confirm('Bu ürünü silmek istediğinize emin misiniz?')) return;
      fetch('/api/products/' + id, { method: 'DELETE' })
        .then(function (res) {
          if (res.status === 204) { window.location.reload(); return; }
          return res.json().then(function (d) { throw new Error(d.error || 'Silinemedi'); });
        })
        .catch(function (err) { alert('Hata: ' + err.message); });
    });
  });

  /* ---- Ürün formu submit (form/edit sayfası) ---- */
  const prodForm = document.getElementById('productForm');
  if (prodForm) {
    prodForm.addEventListener('submit', function (e) {
      e.preventDefault();
      const errBox = document.getElementById('formError');
      hideError(errBox);

      const formData = new FormData(prodForm);
      const method = formData.get('_method') === 'PUT' ? 'PUT' : 'POST';
      const url = formData.get('_api') ? '/api/products' : prodForm.getAttribute('action');
      const body = {};
      formData.forEach(function (v, k) { if (k !== '_method' && k !== '_api') body[k] = v; });

      const actionUrl = prodForm.getAttribute('action');
      const finalUrl = method === 'PUT' ? actionUrl : '/api/products';

      fetch(finalUrl, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
        .then(function (res) {
          if (res.redirected) { window.location.href = res.url; return null; }
          return res.json().then(function (d) {
            if (!res.ok) throw new Error(d.error || 'Bir hata oluştu');
            return d;
          });
        })
        .then(function () {
          window.location.href = '/api/products';
        })
        .catch(function (err) { showError(errBox, err.message); });
    });
  }

  /* ---- Stok giriş/çıkış modalı (detay sayfası) ---- */
  const stockModal = document.getElementById('stockModal');
  const modalTitle = document.getElementById('modalTitle');
  const stockForm = document.getElementById('stockForm');

  function openModal(mode) {
    const isIn = mode === 'in';
    modalTitle.textContent = isIn ? 'Stok Girişi (+)' : 'Stok Çıkışı (−)';
    stockForm.querySelector('input[name="mode"]').value = mode;
    document.getElementById('stockSubmit').textContent = isIn ? 'Girişi Onayla' : 'Çıkışı Onayla';
    stockForm.reset();
    stockForm.querySelector('input[name="productId"]').value =
      stockForm.querySelector('input[name="productId"]').value;
    hideError(document.getElementById('stockError'));
    stockModal.style.display = 'flex';
    document.getElementById('stockQty').focus();
  }

  function closeModal() { stockModal.style.display = 'none'; }

  if (stockModal) {
    document.querySelectorAll('.stock-action').forEach(function (btn) {
      btn.addEventListener('click', function () { openModal(btn.dataset.mode); });
    });
    document.getElementById('modalClose').addEventListener('click', closeModal);
    stockModal.addEventListener('click', function (e) {
      if (e.target === stockModal) closeModal();
    });

    stockForm.addEventListener('submit', function (e) {
      e.preventDefault();
      const errBox = document.getElementById('stockError');
      hideError(errBox);
      const mode = stockForm.querySelector('input[name="mode"]').value;
      const productId = stockForm.querySelector('input[name="productId"]').value;
      const quantity = document.getElementById('stockQty').value;
      const note = document.getElementById('stockNote').value;

      fetch('/api/stock/' + mode, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: productId, quantity: quantity, note: note })
      })
        .then(function (res) {
          return res.json().then(function (d) {
            if (!res.ok) throw new Error(d.error || 'İşlem başarısız');
            return d;
          });
        })
        .then(function (data) {
          if (data.lowStock) alert('⚠️ Dikkat: Bu ürün artık düşük stok seviyesinde!');
          window.location.reload();
        })
        .catch(function (err) { showError(errBox, err.message); });
    });
  }
})();
