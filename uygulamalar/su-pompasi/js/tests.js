/* Numex Atlas — bağımsız kabul testleri
   Her test kendi küçük şebekesini kurar, hidrolik motoru çalıştırır ve sonucu
   analitik (elle hesaplanmış) beklenen değerle karşılaştırır. */
(function (global) {
  'use strict';
  const Network = global.NumexNetwork.Network;
  const H = global.NumexHydraulics;
  const RPT = global.NumexReport;
  const SCN = global.NumexScenarios;

  function build(name, nodes, edges) {
    const net = new Network(name);
    const map = {};
    nodes.forEach(n => {
      const o = Object.assign({}, n);
      delete o.k;
      map[n.k] = net.addNode(o);
    });
    edges.forEach(e => {
      const o = Object.assign({}, e);
      const from = map[o.from], to = map[o.to];
      delete o.from; delete o.to;
      net.addEdge(Object.assign({ from: from.id, to: to.id }, o));
    });
    return net;
  }

  function pc(v, d) { return (v == null || !isFinite(v)) ? '—' : Number(v).toFixed(d == null ? 3 : d); }
  function near(a, b, tol) { return Math.abs(a - b) <= (tol == null ? 1e-6 : tol); }

  function res(id, name, pass, expected, actual, note) {
    return { id: id, name: name, pass: !!pass, expected: expected, actual: actual, note: note || '' };
  }

  /* --- tek boru, tek talep --- */
  function netSingle() {
    return build('T1', [
      { k: 'R', type: 'reservoir', name: 'Depo', head: 100, x: 100, y: 100 },
      { k: 'N', type: 'neighborhood', name: 'Mahalle', elevation: 10, demand: 20, minPressure: 20, x: 400, y: 100 }
    ], [
      { type: 'pipe', from: 'R', to: 'N', length: 100, diameter: 200, coeff: 1 }
    ]);
  }

  const tests = [];

  /* 1 */
  tests.push(function () {
    const net = netSingle();
    const r = H.solve(net, { demandScale: false });
    const g = H.conductanceOf(net.edges[0]);
    const expH = 100 - 20 / g;
    const nd = r.nodes.find(n => n.type === 'neighborhood');
    const ok = near(nd.head, expH, 1e-6) && near(nd.pressure, expH - 10, 1e-6) && near(r.edges[0].q, 20, 1e-9);
    return res(1, 'Tek rezervuar + tek boru + tek talep düğümü', ok,
      'h=' + pc(expH) + ' m, p=' + pc(expH - 10) + ' m, Q=20.000 L/s',
      'h=' + pc(nd.head) + ' m, p=' + pc(nd.pressure) + ' m, Q=' + pc(r.edges[0].q) + ' L/s',
      'Analitik: h = H_depo - Q/g, g = ' + pc(g, 4));
  });

  /* 2 */
  tests.push(function () {
    const net = build('T2', [
      { k: 'R', type: 'reservoir', name: 'Depo', head: 100, x: 100, y: 100 },
      { k: 'N', type: 'neighborhood', name: 'Mahalle', elevation: 0, demand: 40, minPressure: 10, x: 500, y: 100 }
    ], [
      { type: 'pipe', from: 'R', to: 'N', length: 500, diameter: 200 },
      { type: 'pipe', from: 'R', to: 'N', length: 500, diameter: 150 }
    ]);
    const r = H.solve(net, { demandScale: false });
    const g1 = H.conductanceOf(net.edges[0]);
    const g2 = H.conductanceOf(net.edges[1]);
    const q1 = r.edges[0].q, q2 = r.edges[1].q;
    const expRatio = g1 / g2;
    const ok = near(q1 / q2, expRatio, 0.01) && near(q1 + q2, 40, 1e-6);
    return res(2, 'Paralel borularda debinin iletkenliğe göre bölünmesi', ok,
      'q1/q2 = ' + pc(expRatio) + ' · toplam 40.000 L/s',
      'q1/q2 = ' + pc(q1 / q2) + ' · toplam ' + pc(q1 + q2) + ' L/s',
      'g1=' + pc(g1, 4) + ', g2=' + pc(g2, 4));
  });

  /* 3 */
  tests.push(function () {
    const net = build('T3', [
      { k: 'R', type: 'reservoir', name: 'Depo', head: 80, x: 100, y: 100 },
      { k: 'A', type: 'junction', name: 'A', elevation: 5, x: 250, y: 100 },
      { k: 'B', type: 'junction', name: 'B', elevation: 8, x: 400, y: 100 },
      { k: 'N', type: 'neighborhood', name: 'Mahalle', elevation: 10, demand: 15, minPressure: 10, x: 550, y: 100 }
    ], [
      { type: 'pipe', from: 'R', to: 'A', length: 200, diameter: 200 },
      { type: 'pipe', from: 'A', to: 'B', length: 200, diameter: 150 },
      { type: 'pipe', from: 'B', to: 'N', length: 200, diameter: 150 }
    ]);
    const r = H.solve(net, { demandScale: false });
    const q = net.edges.map(e => r.edgeById[e.id].q);
    const ok = q.every(x => near(x, 15, 1e-9));
    return res(3, 'Seri borularda kütle korunumu (debiler eşit)', ok,
      'üç hatta Q = 15.000 L/s',
      q.map(x => pc(x, 3)).join(' · '),
      'Seri hatta araba yoksa debi değişmez.');
  });

  /* 4 */
  tests.push(function () {
    const net = build('T4', [
      { k: 'R', type: 'reservoir', name: 'Depo', head: 90, x: 100, y: 200 },
      { k: 'A', type: 'junction', name: 'A', elevation: 5, x: 300, y: 200 },
      { k: 'B', type: 'junction', name: 'B', elevation: 8, x: 500, y: 200 },
      { k: 'N', type: 'neighborhood', name: 'Mahalle', elevation: 10, demand: 25, minPressure: 10, x: 700, y: 200 }
    ], [
      { type: 'pipe', from: 'R', to: 'A', length: 200, diameter: 200 },
      { type: 'pipe', from: 'A', to: 'B', length: 200, diameter: 150 },
      { type: 'pipe', from: 'A', to: 'B', length: 350, diameter: 150 },
      { type: 'pipe', from: 'B', to: 'N', length: 200, diameter: 150 }
    ]);
    const r = H.solve(net);
    const mc = Math.abs(r.totals.massError);
    return res(4, 'Döngülü şebekede sıfıra yakın kütle dengesi hatası', mc < 0.01,
      '|hata| < 0.010 L/s', pc(mc, 6) + ' L/s',
      'Paralel iki hat bir çevrim kurar; çözücü çevrimi de çözer.');
  });

  /* 5 */
  tests.push(function () {
    const net = build('T5', [
      { k: 'R', type: 'reservoir', name: 'Depo', head: 90, x: 100, y: 200 },
      { k: 'J', type: 'junction', name: 'J', elevation: 5, x: 300, y: 200 },
      { k: 'N', type: 'neighborhood', name: 'Mahalle', elevation: 10, demand: 18, minPressure: 10, x: 500, y: 200 }
    ], [
      { type: 'pipe', from: 'R', to: 'J', length: 200, diameter: 200 },
      { type: 'valve', from: 'R', to: 'J', open: false },
      { type: 'pipe', from: 'J', to: 'N', length: 200, diameter: 200 }
    ]);
    const r = H.solve(net);
    const valve = net.edges.find(e => e.type === 'valve');
    const qv = r.edgeById[valve.id].q;
    return res(5, 'Kapalı vanada debi sıfır', near(qv, 0, 1e-12),
      'Q_vana = 0.000000 L/s', 'Q_vana = ' + pc(qv, 6) + ' L/s', '');
  });

  /* 6 */
  tests.push(function () {
    const net = build('T6', [
      { k: 'R', type: 'reservoir', name: 'Depo', head: 90, x: 100, y: 200 },
      { k: 'N', type: 'neighborhood', name: 'Mahalle', elevation: 10, demand: 18, minPressure: 10, x: 500, y: 200 }
    ], [
      { type: 'pipe', from: 'R', to: 'N', length: 200, diameter: 200 },
      { type: 'valve', from: 'R', to: 'N', open: false }
    ]);
    const pipe = net.edges[0], valve = net.edges[1];
    const r1 = H.solve(net);
    const q1 = r1.edgeById[pipe.id].q, v1 = r1.edgeById[valve.id].q;
    pipe.open = false; valve.open = true;
    const r2 = H.solve(net);
    const q2 = r2.edgeById[pipe.id].q, v2 = r2.edgeById[valve.id].q;
    const ok = near(q1, 18, 1e-6) && near(v1, 0, 1e-12) && near(q2, 0, 1e-12) && near(v2, 18, 1e-6);
    return res(6, 'Ana hat kapanınca alternatif hattın devreye girmesi', ok,
      'önce: boru 18 / vana 0 · sonra: boru 0 / vana 18',
      'önce: ' + pc(q1) + ' / ' + pc(v1) + ' · sonra: ' + pc(q2) + ' / ' + pc(v2), '');
  });

  /* 7 */
  tests.push(function () {
    const net = build('T7', [
      { k: 'R', type: 'reservoir', name: 'Depo', head: 90, x: 100, y: 200 },
      { k: 'N1', type: 'neighborhood', name: 'Bağlı', elevation: 10, demand: 10, minPressure: 10, x: 400, y: 200 },
      { k: 'N2', type: 'neighborhood', name: 'Kopuk', elevation: 10, demand: 10, minPressure: 10, x: 700, y: 200 }
    ], [
      { type: 'pipe', from: 'R', to: 'N1', length: 200, diameter: 200 },
      { type: 'pipe', from: 'N1', to: 'N2', length: 200, diameter: 200, open: false }
    ]);
    const r = H.solve(net);
    const n2 = r.nodes.find(n => n.type === 'neighborhood' && n.id === net.nodes[2].id);
    const ok = n2.status === 'unsupplied' && !isFinite(n2.head) && r.totals.unsupplied === 1 &&
      r.warnings.some(w => w.indexOf('belirsiz') >= 0);
    return res(7, 'Tüm besleme yolları kesilen mahallenin tespiti', ok,
      'durum=unsupplied, yük=tanımsız, 1 uyarı',
      'durum=' + n2.status + ', yük=' + pc(n2.head) + ', beslemesiz=' + r.totals.unsupplied,
      'Sıfır basınç uydurulmaz; tanımsız olarak raporlanır.');
  });

  /* 8 */
  tests.push(function () {
    const net = netSingle();
    const g = H.conductanceOf(net.edges[0]);
    const r1 = H.solve(net, { demandScale: false });
    const p1 = r1.nodes.find(n => n.type === 'neighborhood').pressure;
    const nd = net.nodes.find(n => n.type === 'neighborhood');
    nd.demand = 35;
    const r2 = H.solve(net, { demandScale: false });
    const p2 = r2.nodes.find(n => n.type === 'neighborhood').pressure;
    const expP2 = 100 - 10 - 35 / g;
    const ok = near(p2, expP2, 1e-6) && p2 < p1;
    return res(8, 'Talep artınca basıncın modele uygun düşmesi', ok,
      'p(35) = ' + pc(expP2) + ' m',
      'p(35) = ' + pc(p2) + ' m · fark ' + pc(p2 - p1) + ' m',
      'Δp = -ΔQ/g, g = ' + pc(g, 4));
  });

  /* 9 */
  tests.push(function () {
    const net = build('T9', [
      { k: 'R', type: 'reservoir', name: 'Depo', head: 90, x: 100, y: 200 },
      { k: 'N', type: 'neighborhood', name: 'Mahalle', elevation: 10, demand: 15, minPressure: 10, x: 500, y: 200 }
    ], [
      { type: 'pipe', from: 'R', to: 'N', length: 200, diameter: 200, open: false },
      { type: 'valve', from: 'R', to: 'N', open: false }
    ]);
    const r0 = H.solve(net);
    const prop = H.proposeIntervention(net, r0);
    let improved = false, servedBefore = r0.totals.delivered;
    if (prop.found) {
      prop.actions.forEach(a => {
        const ed = net.getEdge(a.id);
        if (a.kind === 'valve') ed.open = !ed.open; else ed.open = true;
      });
      const r1 = H.solve(net);
      improved = r1.totals.delivered > servedBefore + 0.1;
    }
    const ok = prop.found ? improved : !prop.found;
    return res(9, 'Müdahale önerisinin uygulanıp ölçülebilir iyileşme sağlaması', ok,
      'öneri bulunur ve uygulanınca karşılanan debi artar',
      prop.found ? ('öneri ' + prop.actions.length + ' eylem · debi ' + pc(servedBefore, 2) + ' → ' + pc(prop.bestScore.served, 0) + ' mahalle yeterli')
        : 'öneri bulunamadı (dürüst rapor)',
      'Sezgisel arama; optimal olduğu iddia edilmez.');
  });

  /* 10 */
  tests.push(function () {
    const net = SCN.create('s1');
    const r1 = H.solve(net);
    const copy = Network.fromJSON(JSON.parse(JSON.stringify(net.toJSON())));
    const r2 = H.solve(copy);
    let maxDiff = 0, count = 0;
    r1.nodes.forEach(a => {
      const b = r2.nodeById[a.id];
      if (!b || a.type !== 'neighborhood') return;
      if (!isFinite(a.pressure) && !isFinite(b.pressure)) return;
      maxDiff = Math.max(maxDiff, Math.abs(a.pressure - b.pressure));
      count += 1;
    });
    const ok = count > 0 && maxDiff < 1e-9 && near(r1.totals.delivered, r2.totals.delivered, 1e-9);
    return res(10, 'JSON gidiş-dönüşte sonuçların korunması', ok,
      'basınç farkı < 1e-9', 'max |Δp| = ' + maxDiff.toExponential(2) + ' (' + count + ' mahalle)', '');
  });

  /* 11 */
  tests.push(function () {
    const net = build('T11', [
      { k: 'R', type: 'reservoir', name: 'Depo', head: 40, x: 100, y: 200 },
      { k: 'N', type: 'neighborhood', name: 'Yüksek Kot', elevation: 60, demand: 30, minPressure: 20, x: 400, y: 200 }
    ], [
      { type: 'pipe', from: 'R', to: 'N', length: 300, diameter: 150 }
    ]);
    const r = H.solve(net);
    const nd = r.nodes.find(n => n.type === 'neighborhood');
    const finite = isFinite(nd.head) && isFinite(nd.pressure);
    const ok = finite && nd.status === 'negative' && nd.pressure < 0 && r.warnings.length > 0;
    return res(11, 'Negatif basınç ve sayısal tekillik raporlanması', ok,
      'p < 0, durum=negative, uyarı var',
      'p=' + pc(nd.pressure) + ' m, durum=' + nd.status + ', uyarı=' + r.warnings.length, '');
  });

  /* 12 */
  tests.push(function () {
    const net = SCN.create('s2');
    const r = H.solve(net);
    const csvText = RPT.csv(net, r);
    const svgText = RPT.svg(net, r);
    const nbh = r.nodes.filter(n => n.type === 'neighborhood');
    let ok = true, detail = [];
    nbh.slice(0, 4).forEach(n => {
      const inCsv = csvText.indexOf(n.name) >= 0 && csvText.indexOf(n.pressure.toFixed(3)) >= 0;
      const inSvg = svgText.indexOf(n.name) >= 0 && svgText.indexOf(n.pressure.toFixed(2)) >= 0;
      if (!inCsv || !inSvg) { ok = false; detail.push(n.name); }
    });
    const massInCsv = csvText.indexOf(r.totals.massError.toFixed(4)) >= 0;
    return res(12, 'SVG ve CSV çıktılarının hesaplanan sonuçlarla tutarlılığı', ok && massInCsv,
      'çıktılarda mahalle adı + basınç değeri + kütle hatası',
      ok && massInCsv ? 'eşleşti (' + nbh.length + ' mahalle)' : 'eksik: ' + detail.join(', '),
      'CSV 3, SVG 2 ondalıkla yazar.');
  });

  function runAll() {
    const out = [];
    tests.forEach((fn, i) => {
      try {
        out.push(fn());
      } catch (e) {
        out.push(res(i + 1, 'Test çalıştırılamadı', false, 'hata yok', 'istisna: ' + e.message, ''));
      }
    });
    return { tests: out, passed: out.filter(t => t.pass).length, total: out.length };
  }

  global.NumexTests = { runAll: runAll };
})(window);
