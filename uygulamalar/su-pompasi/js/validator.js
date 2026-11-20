/* Numex Atlas — bağımsız doğrulayıcı
   Hidrolik çözücünün ürettiği sonucu, çözücüden BAĞIMSIZ olarak yeniden denetler:
   kütle korunumu, hat yasası, basınç tanımı, kapalı hat ve sayısal sağlık. */
(function (global) {
  'use strict';

  function validate(net, result, opts) {
    opts = opts || {};
    const tol = opts.tol == null ? 1e-6 : opts.tol;
    const checks = [];
    const H = global.NumexHydraulics;
    if (!result) {
      return { ok: false, checks: [{ name: 'Sonuç var mı', value: 0, pass: false }] };
    }

    const supplied = {};
    result.nodes.forEach(n => { supplied[n.id] = n.supplied; });

    /* 1) düğümlerde kütle korunumu (rezervuar hariç) */
    let maxNodeResidual = 0;
    net.nodes.forEach(nd => {
      if (nd.type === 'reservoir' || !supplied[nd.id]) return;
      let inflow = 0;
      net.edges.forEach(e => {
        const q = result.flows.get(e.id) || 0;
        if (e.to === nd.id) inflow += q;
        if (e.from === nd.id) inflow -= q;
      });
      const delivered = result.nodeById[nd.id] ? result.nodeById[nd.id].delivered : 0;
      maxNodeResidual = Math.max(maxNodeResidual, Math.abs(inflow - delivered));
    });
    checks.push({ name: 'Düğümlerde kütle korunumu', value: maxNodeResidual, pass: maxNodeResidual < 1e-6 });

    /* 2) hat yasası: Q = g (ha - hb + s) */
    let maxEdgeError = 0;
    net.edges.forEach(e => {
      const r = result.edgeById[e.id];
      if (!r || !r.active) return;
      const g = H.conductanceOf(e);
      if (!(g > 0)) return;
      const ha = result.heads.get(e.from), hb = result.heads.get(e.to);
      if (!isFinite(ha) || !isFinite(hb)) return;
      const expected = g * (ha - hb + H.edgeSource(e));
      maxEdgeError = Math.max(maxEdgeError, Math.abs(expected - r.q));
    });
    checks.push({ name: 'Hat yasası Q = g·(Δh + s)', value: maxEdgeError, pass: maxEdgeError < 1e-6 });

    /* 3) basınç tanımı p = h - z */
    let maxPressureError = 0;
    result.nodes.forEach(n => {
      if (!isFinite(n.head) || !isFinite(n.pressure)) return;
      maxPressureError = Math.max(maxPressureError, Math.abs((n.head - n.elevation) - n.pressure));
    });
    checks.push({ name: 'Basınç tanımı p = h − z', value: maxPressureError, pass: maxPressureError < 1e-9 });

    /* 4) kapalı hatlarda debi sıfır */
    let closedFlow = 0;
    net.edges.forEach(e => {
      if (e.open) return;
      const q = Math.abs(result.edgeById[e.id] ? result.edgeById[e.id].q : 0);
      closedFlow = Math.max(closedFlow, q);
    });
    checks.push({ name: 'Kapalı hat/vanada debi = 0', value: closedFlow, pass: closedFlow < 1e-12 });

    /* 5) sayısal sağlık: NaN / sonsuz yok */
    let bad = 0;
    result.nodes.forEach(n => { if (n.supplied && !isFinite(n.head)) bad += 1; });
    result.edges.forEach(e => { if (!isFinite(e.q)) bad += 1; });
    checks.push({ name: 'Sayısal sağlık (NaN / sonsuz yok)', value: bad, pass: bad === 0 });

    /* 6) rezervuar çıkışı = toplam tüketim */
    const massErr = Math.abs(result.totals.outflow - result.totals.delivered);
    checks.push({ name: 'Depo çıkışı = toplam tüketim', value: massErr, pass: massErr < 1e-6 });

    /* 7) beslemesiz düğümlerde yük uydurulmamış */
    let faked = 0;
    result.nodes.forEach(n => { if (!n.supplied && isFinite(n.head)) faked += 1; });
    checks.push({ name: 'Beslemesiz düğümde yük uydurulmamış', value: faked, pass: faked === 0 });

    return {
      ok: checks.every(c => c.pass),
      checks: checks,
      maxNodeResidual: maxNodeResidual,
      maxEdgeError: maxEdgeError
    };
  }

  global.NumexValidator = { validate: validate };
})(window);
