/* reports.js — kategori bazlı rapor AJAX ile dinamik doldurma */

(function () {
  'use strict';

  const form = document.getElementById('reportForm');
  if (!form) return;

  const inEl = document.getElementById('repIn');
  const outEl = document.getElementById('repOut');
  const netEl = document.getElementById('repNet');

  function fmtNumber(n) {
    return (Number(n) || 0).toLocaleString('tr-TR');
  }

  function fmtMoney(n) {
    return fmtNumber(n) + ' ₺';
  }

  function renderMovements(list) {
    const wrap = document.getElementById('reportMovements');
    if (!list || list.length === 0) {
      wrap.innerHTML = '<p class="muted center">Seçilen kriterlerde hareket yok.</p>';
      return;
    }
    const rows = list.map(function (m) {
      const cls = m.type === 'in' ? 'tag-in' : 'tag-out';
      const label = m.type === 'in' ? 'Giriş +' : 'Çıkış −';
      const sign = m.type === 'in' ? '+ ' : '− ';
      return '<tr>' +
        '<td>' + m.id + '</td>' +
        '<td><span class="tag ' + cls + '">' + label + '</span></td>' +
        '<td class="' + (m.type === 'out' ? 'text-danger' : 'text-ok') + '">' + sign + m.quantity + '</td>' +
        '<td>' + m.remainingStock + '</td>' +
        '<td class="muted">' + (m.note || '—') + '</td>' +
        '<td class="muted">' + new Date(m.date).toLocaleString('tr-TR') + '</td>' +
        '</tr>';
    }).join('');
    wrap.innerHTML =
      '<table class="table"><thead><tr>' +
      '<th>#</th><th>Tip</th><th>Miktar</th><th>Kalan</th><th>Not</th><th>Tarih</th>' +
      '</tr></thead><tbody>' + rows + '</tbody></table>';
  }

  function loadReport(categoryId, from, to) {
    const q = new URLSearchParams();
    if (from) q.set('from', from);
    if (to) q.set('to', to);
    const url = '/api/reports/api/category/' + categoryId + '?' + q.toString();

    fetch(url)
      .then(function (res) {
        if (!res.ok) throw new Error('Rapor alınamadı');
        return res.json();
      })
      .then(function (rep) {
        document.getElementById('repCategory').textContent = rep.category ? rep.category.name : '—';
        document.getElementById('repProducts').textContent = fmtNumber(rep.totalProducts);
        document.getElementById('repValue').textContent = fmtMoney(rep.totalStockValue);
        inEl.textContent = fmtNumber(rep.incomingQty);
        outEl.textContent = fmtNumber(rep.outgoingQty);
        netEl.textContent = fmtNumber(rep.netQty);
        renderMovements(rep.movements);
      })
      .catch(function (err) { alert('Hata: ' + err.message); });
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    const cat = document.getElementById('reportCategory').value;
    const from = document.getElementById('fromDate').value;
    const to = document.getElementById('toDate').value;
    loadReport(cat, from, to);
  });

  // İlk yüklemede tüm kategoriler için otomatik rapor göster
  loadReport('all', '', '');
})();
