// Dışa aktarma: JSON, CSV, SVG, rapor
export function indir(icerik, ad, tip = 'application/json') {
  const blob = new Blob([icerik], { type: tip + ';charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = ad; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export function jsonKaydet(durum) {
  const veri = {
    surum: 1, senaryoId: durum.senaryoId, sekil: durum.sehir,
    seciliYol: durum.seciliYol, yenidenPlanlamaSayisi: durum.yenidenPlanlamaSayisi,
  };
  indir(JSON.stringify(veri, null, 2), 'numex-afet-proje.json');
}

export function jsonYukle(dosya) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => {
      try {
        const v = JSON.parse(r.result);
        if (!v.sekil || !v.sekil.kavsaklar) throw new Error('Geçersiz proje dosyası');
        res(v);
      } catch (e) { rej(e); }
    };
    r.onerror = () => rej(r.error);
    r.readAsText(dosya, 'utf-8');
  });
}

export function csvAktar(plan) {
  const satir = [['Bolge', 'Toplanma Alani', 'Kisi', 'Tahmini Sure (dk)', 'Rota']];
  for (const a of plan.atamalar) satir.push([a.bolgeAd || a.bolgeId, a.alanAd || a.alanId, a.kisi, a.sure.toFixed(1), (a.rota || []).join('-')]);
  const csv = '\uFEFF' + satir.map(s => s.map(v => `"${String(v).replace(/"/g, '""')}"`).join(';')).join('\r\n');
  indir(csv, 'numex-afet-tahliye-plani.csv', 'text/csv');
}

export function svgAktar(svgEl) {
  const kopya = svgEl.cloneNode(true);
  kopya.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  kopya.insertAdjacentHTML('afterbegin', '<rect width="100%" height="100%" fill="#15181c"/>');
  indir(new XMLSerializer().serializeToString(kopya), 'numex-afet-harita.svg', 'image/svg+xml');
}

export function raporOlustur(durum, plan) {
  const toplam = durum.sehir.bolgeler.reduce((s, b) => s + b.nufus, 0);
  const kapali = durum.sehir.yollar.filter(y => y.kapali);
  const L = [];
  L.push('NUMEX AFET — OPERASYON RAPORU');
  L.push('Tarih: ' + new Date().toLocaleString('tr-TR'));
  L.push('Senaryo: ' + (durum.senaryolar[durum.senaryoId] || {}).ad);
  L.push('');
  L.push(`Toplam nüfus: ${toplam}`);
  L.push(`Yerleştirilen: ${plan.yerlesen}`);
  L.push(`Yerleştirilemeyen: ${plan.yerlesemeyen}`);
  L.push(`Ortalama tahmini rota süresi: ${(plan.ortSure || 0).toFixed(1)} dk`);
  L.push(`Yeniden planlama sayısı: ${durum.yenidenPlanlamaSayisi}`);
  L.push(`Kapalı yol: ${kapali.length} (${kapali.map(y => y.id).join(', ') || '-'})`);
  L.push('');
  L.push('ATAMALAR');
  for (const a of plan.atamalar) L.push(`- ${a.bolgeAd} → ${a.alanAd}: ${a.kisi} kişi, ${a.sure.toFixed(1)} dk, rota ${(a.rota || []).join('-')}`);
  L.push('');
  L.push('ULAŞILAMAYAN / YERLEŞTİRİLEMEYEN');
  if (!plan.ulasilamayan.length) L.push('- Yok');
  for (const u of plan.ulasilamayan) L.push(`- ${u.ad}: ${u.kisi} kişi (${u.neden})`);
  L.push('');
  L.push('SINIR: Bu rapor kurgusal veriyle çalışan bir simülasyon laboratuvarı çıktısıdır.');
  L.push('Gerçek afet güvenliği, bina tahliyesi veya resmî acil durum yönetimi için kullanılamaz.');
  return L.join('\n');
}

export function raporIndir(durum, plan) { indir(raporOlustur(durum, plan), 'numex-afet-rapor.txt', 'text/plain'); }
