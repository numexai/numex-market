// Kontrol paneli + KPI
export function kpiGuncelle(durum, plan) {
  const set = (id, v) => { const e = document.getElementById(id); if (e) e.textContent = v; };
  const toplam = durum.sehir.bolgeler.reduce((s, b) => s + b.nufus, 0);
  const kullanilan = Object.values(plan.alanDoluluk || {}).filter(v => v > 0).length;
  set('kpiToplam', toplam.toLocaleString('tr-TR'));
  set('kpiYerlesen', plan.yerlesen.toLocaleString('tr-TR'));
  set('kpiYerlesemeyen', plan.yerlesemeyen.toLocaleString('tr-TR'));
  set('kpiAlan', `${kullanilan} / ${durum.sehir.alanlar.length}`);
  set('kpiKapali', durum.sehir.yollar.filter(y => y.kapali).length);
  set('kpiSure', (plan.ortSure || 0).toFixed(1) + ' dk');
  set('kpiReplan', durum.yenidenPlanlamaSayisi);
  const uyari = document.getElementById('uyariAlani');
  if (uyari) {
    uyari.innerHTML = (plan.uyarilar || []).map(u => `<div class="uyari">${u}</div>`).join('');
  }
}

export function detayGoster(yol) {
  const k = document.getElementById('yolDetay');
  if (!k) return;
  if (!yol) { k.innerHTML = '<p class="soluk">Haritadan bir yol seçin.</p>'; return; }
  k.innerHTML = `
    <h4>${yol.id}</h4>
    <div class="satir"><span>Bağlantı</span><b>${yol.a} → ${yol.b}</b></div>
    <div class="satir"><span>Uzunluk</span><b>${yol.uzunluk} km</b></div>
    <div class="satir"><span>Geçiş süresi</span><b>${yol.sure} dk</b></div>
    <div class="satir"><span>Kapasite</span><b>${yol.kapasite} kişi/dk</b></div>
    <div class="satir"><span>Durum</span><b class="${yol.kapali ? 'kirmizi' : 'turkuaz'}">${yol.kapali ? 'KAPALI' : 'AÇIK'}</b></div>`;
}

export function tabloDoldur(plan) {
  const tb = document.getElementById('atamaGovde');
  if (!tb) return;
  tb.innerHTML = plan.atamalar.map(a =>
    `<tr class="rota-hucre"><td>${a.bolgeAd || a.bolgeId}</td><td>${a.alanAd || a.alanId}</td><td>${a.kisi.toLocaleString('tr-TR')}</td><td>${a.sure.toFixed(1)}</td></tr>`
  ).join('') || '<tr><td colspan="4" class="soluk">Atama yok</td></tr>';
  const ub = document.getElementById('ulasilamayanGovde');
  if (ub) {
    ub.innerHTML = plan.ulasilamayan.map(u =>
      `<tr><td>${u.ad}</td><td>${u.kisi.toLocaleString('tr-TR')}</td><td class="kirmizi">${u.neden}</td></tr>`
    ).join('') || '<tr><td colspan="3" class="soluk">Yok</td></tr>';
  }
}

export function panelKur(durum, eylemler) {
  const q = id => document.getElementById(id);
  const sen = q('senaryoSec');
  if (sen) {
    sen.value = durum.senaryoId;
    sen.addEventListener('change', e => eylemler.senaryoSec(e.target.value));
  }
  q('btnBaslat')?.addEventListener('click', () => eylemler.simulasyonBaslat());
  q('btnDurdur')?.addEventListener('click', () => eylemler.simulasyonDurdur());
  q('btnReplan')?.addEventListener('click', () => eylemler.planla());
  q('hizSec')?.addEventListener('change', e => eylemler.hizAyarla(parseFloat(e.target.value)));
  q('btnYolDegistir')?.addEventListener('click', () => {
    if (durum.seciliYol) eylemler.yolDegistir(durum.seciliYol);
  });
  q('btnJsonKaydet')?.addEventListener('click', () => eylemler.jsonKaydet());
  q('jsonYukle')?.addEventListener('change', e => { if (e.target.files[0]) eylemler.jsonYukle(e.target.files[0]); });
  q('btnCsv')?.addEventListener('click', () => eylemler.csvAktar());
  q('btnSvg')?.addEventListener('click', () => eylemler.svgAktar());
  q('btnRapor')?.addEventListener('click', () => eylemler.rapor());
  // nüfus ve kapasite girişleri
  const nb = q('nufusAlanlari'), kb = q('kapasiteAlanlari');
  if (nb) nb.innerHTML = durum.sehir.bolgeler.map(b =>
    `<label class="ayar"><span>${b.ad}</span><input type="number" min="0" step="100" value="${b.nufus}" data-bolge="${b.id}"></label>`).join('');
  if (kb) kb.innerHTML = durum.sehir.alanlar.map(a =>
    `<label class="ayar"><span>${a.ad}</span><input type="number" min="0" step="100" value="${a.kapasite}" data-alan="${a.id}"></label>`).join('');
  nb?.querySelectorAll('input').forEach(i => i.addEventListener('change', e => eylemler.nufusAyarla(e.target.dataset.bolge, parseInt(e.target.value, 10) || 0)));
  kb?.querySelectorAll('input').forEach(i => i.addEventListener('change', e => eylemler.kapasiteAyarla(e.target.dataset.alan, parseInt(e.target.value, 10) || 0)));
}
