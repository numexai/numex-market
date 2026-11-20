/* Numex Atlas — hidrolik çözüm motoru
   ------------------------------------------------------------------
   Model:  Q = g . (h_a - h_b + s)      [L/s]
     g : iletkenlik (L/s per metre)
         boru : g = K_PIPE * D_mm^2.5 / (L_m * k)
         vana : açıkken K_VALVE, kapalıyken 0
         pompa: açıkken K_PUMP, s = basma yüksekliği (m)
   Düğümlerde kütle korunumu:  sum(Q_out) - sum(Q_in) = -talep
   Rezervuarlar sabit hidrolik yük sınır koşulu.
   Sistem DOĞRUSAL -> Gauss eliminasyonu (kısmi pivotlama).
   Talep basınca bağlıdır: f = clamp(p / p_min, 0, 1), kendini doğrulayan
   yinelemeli çözüm (gevşetmeli).
   ------------------------------------------------------------------
   UYARI: Bu, Hazen-Williams gibi doğrusal olmayan bir boru yasasının
   yerine geçmez. Açıkça belirtilmiş lineer yaklaşımdır. */
(function (global) {
  'use strict';

  const K_PIPE = 0.005;    // L/s per m  (D mm, L m)
  const K_VALVE = 200;     // açık vana iletkenliği
  const K_PUMP = 150;      // pompa hattı iletkenliği

  function conductanceOf(edge) {
    if (!edge || !edge.open) return 0;
    if (edge.type === 'pipe') {
      const L = Math.max(1, Number(edge.length) || 0);
      const D = Math.max(1, Number(edge.diameter) || 0);
      const k = (Number(edge.coeff) > 0) ? Number(edge.coeff) : 1;
      return K_PIPE * Math.pow(D, 2.5) / (L * k);
    }
    if (edge.type === 'valve') return K_VALVE;
    if (edge.type === 'pump') return K_PUMP;
    return 0;
  }

  function edgeSource(edge) {
    if (edge && edge.type === 'pump' && edge.open) return Number(edge.pumpHead) || 0;
    return 0;
  }

  /* Gauss eliminasyonu, kısmi pivotlama. Tekilse null döner. */
  function solveLinear(A, b) {
    const n = b.length;
    if (n === 0) return [];
    const M = new Array(n);
    for (let i = 0; i < n; i++) {
      M[i] = new Float64Array(n + 1);
      for (let j = 0; j < n; j++) M[i][j] = A[i][j];
      M[i][n] = b[i];
    }
    for (let c = 0; c < n; c++) {
      let p = c;
      for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r;
      if (Math.abs(M[p][c]) < 1e-12) return null;   // tekil
      if (p !== c) { const t = M[p]; M[p] = M[c]; M[c] = t; }
      const piv = M[c][c];
      for (let r = c + 1; r < n; r++) {
        const f = M[r][c] / piv;
        if (f === 0) continue;
        for (let j = c; j <= n; j++) M[r][j] -= f * M[c][j];
      }
    }
    const x = new Float64Array(n);
    for (let i = n - 1; i >= 0; i--) {
      let s = M[i][n];
      for (let j = i + 1; j < n; j++) s -= M[i][j] * x[j];
      x[i] = s / M[i][i];
    }
    return x;
  }

  function statusOf(p, pmin, supplied) {
    if (!supplied) return 'unsupplied';
    if (!isFinite(p)) return 'unsupplied';
    if (p < -1e-9) return 'negative';
    if (p < pmin - 1e-9) return 'low';
    return 'ok';
  }

  /* Ana çözüm */
  function solve(net, options) {
    options = Object.assign({ maxIter: 80, tol: 1e-4, demandScale: true }, options || {});
    const warnings = [];
    const nodeById = {};
    net.nodes.forEach(n => { nodeById[n.id] = n; });

    /* 1) akış taşıyan kenarlar */
    const active = [];
    net.edges.forEach(e => {
      if (!nodeById[e.from] || !nodeById[e.to] || e.from === e.to) return;
      const g = conductanceOf(e);
      if (!(g > 0)) return;
      active.push({ edge: e, g: g, s: edgeSource(e) });
    });

    /* 2) besleme yayılımı (rezervuardan erişilebilen düğümler) */
    const adj = new Map();
    net.nodes.forEach(n => adj.set(n.id, []));
    active.forEach(o => {
      adj.get(o.edge.from).push(o.edge.to);
      adj.get(o.edge.to).push(o.edge.from);
    });
    const supplied = new Set();
    const queue = [];
    net.nodes.forEach(n => { if (n.type === 'reservoir') { supplied.add(n.id); queue.push(n.id); } });
    if (queue.length === 0) warnings.push('Şebekede rezervuar yok: hidrolik yük için sınır koşulu tanımsız.');
    for (let i = 0; i < queue.length; i++) {
      const cur = queue[i];
      (adj.get(cur) || []).forEach(nb => {
        if (!supplied.has(nb)) { supplied.add(nb); queue.push(nb); }
      });
    }

    const fixedHead = new Map();
    net.nodes.forEach(n => { if (n.type === 'reservoir') fixedHead.set(n.id, Number(n.head) || 0); });

    const unknowns = net.nodes.filter(n => n.type !== 'reservoir' && supplied.has(n.id));
    const idx = new Map();
    unknowns.forEach((n, i) => idx.set(n.id, i));
    const n = unknowns.length;

    /* 3) talep (başlangıçta nominal) */
    const delivered = new Map();
    net.nodes.forEach(nd => {
      delivered.set(nd.id, (nd.type === 'neighborhood' && supplied.has(nd.id))
        ? Math.max(0, Number(nd.demand) || 0) : 0);
    });

    let heads = new Map();
    fixedHead.forEach((h, id) => heads.set(id, h));
    net.nodes.forEach(nd => { if (!heads.has(nd.id)) heads.set(nd.id, NaN); });

    let singular = false, iterations = 0, converged = false;

    if (n > 0) {
      for (iterations = 0; iterations < options.maxIter; iterations++) {
        const A = [];
        for (let i = 0; i < n; i++) A.push(new Float64Array(n));
        const rhs = new Float64Array(n);
        unknowns.forEach((nd, i) => { rhs[i] = -delivered.get(nd.id); });

        for (let k = 0; k < active.length; k++) {
          const o = active[k];
          const ia = idx.has(o.edge.from) ? idx.get(o.edge.from) : -1;
          const ib = idx.has(o.edge.to) ? idx.get(o.edge.to) : -1;
          const g = o.g, s = o.s;
          if (ia >= 0 && ib >= 0) {
            A[ia][ia] += g; A[ia][ib] -= g;
            A[ib][ib] += g; A[ib][ia] -= g;
            rhs[ia] -= g * s;
            rhs[ib] += g * s;
          } else if (ia >= 0) {
            A[ia][ia] += g;
            rhs[ia] += g * fixedHead.get(o.edge.to) - g * s;
          } else if (ib >= 0) {
            A[ib][ib] += g;
            rhs[ib] += g * fixedHead.get(o.edge.from) + g * s;
          }
        }

        const x = solveLinear(A, rhs);
        if (!x) {
          singular = true;
          warnings.push('Denklem sistemi tekil: düğüm bağlantıları çözüm üretmiyor.');
          break;
        }
        unknowns.forEach((nd, i) => heads.set(nd.id, x[i]));

        if (!options.demandScale) { converged = true; break; }

        let maxDelta = 0;
        net.nodes.forEach(nd => {
          if (nd.type !== 'neighborhood' || !supplied.has(nd.id)) return;
          const p = heads.get(nd.id) - (Number(nd.elevation) || 0);
          const pmin = Math.max(0.1, Number(nd.minPressure) || 0);
          const factor = Math.max(0, Math.min(1, p / pmin));
          const target = Math.max(0, Number(nd.demand) || 0) * factor;
          const cur = delivered.get(nd.id);
          const next = cur + 0.45 * (target - cur);
          maxDelta = Math.max(maxDelta, Math.abs(next - cur));
          delivered.set(nd.id, next);
        });
        if (maxDelta < options.tol) { converged = true; break; }
      }
    } else {
      converged = true;
    }

    /* 4) debiler */
    const flows = new Map();
    net.edges.forEach(e => flows.set(e.id, 0));
    active.forEach(o => {
      const ha = heads.get(o.edge.from), hb = heads.get(o.edge.to);
      if (!isFinite(ha) || !isFinite(hb)) return;
      flows.set(o.edge.id, o.g * (ha - hb + o.s));
    });

    /* 5) sonuç nesneleri */
    const nodeList = [], nodeByIdRes = {}, edgeList = [], edgeByIdRes = {};
    let totalDemand = 0, totalDelivered = 0, totalUnmet = 0, critical = 0, unsupplied = 0, minP = Infinity;

    net.nodes.forEach(nd => {
      const sup = supplied.has(nd.id);
      const head = sup ? heads.get(nd.id) : NaN;
      const pressure = (nd.type === 'reservoir') ? (head - (Number(nd.elevation) || 0)) : (head - (Number(nd.elevation) || 0));
      const nominal = nd.type === 'neighborhood' ? Math.max(0, Number(nd.demand) || 0) : 0;
      const got = nd.type === 'neighborhood' ? (sup ? delivered.get(nd.id) : 0) : 0;
      const pmin = nd.type === 'neighborhood' ? Math.max(0.1, Number(nd.minPressure) || 0) : 0;
      const status = nd.type === 'neighborhood' ? statusOf(pressure, pmin, sup) : (sup ? 'ok' : 'unsupplied');
      if (nd.type === 'neighborhood') {
        totalDemand += nominal;
        totalDelivered += got;
        totalUnmet += Math.max(0, nominal - got);
        if (status === 'low' || status === 'negative') critical += 1;
        if (status === 'unsupplied') { unsupplied += 1; critical += 1; }
        if (sup && isFinite(pressure)) minP = Math.min(minP, pressure);
      }
      const rec = {
        id: nd.id, name: nd.name, type: nd.type,
        head: head, pressure: pressure, elevation: Number(nd.elevation) || 0,
        demand: nominal, delivered: got, minPressure: pmin,
        status: status, supplied: sup,
        x: nd.x, y: nd.y
      };
      nodeList.push(rec);
      nodeByIdRes[nd.id] = rec;
    });

    let outflow = 0;
    net.edges.forEach(e => {
      const q = flows.get(e.id) || 0;
      const a = nodeById[e.from], b = nodeById[e.to];
      const isActive = !!(a && b && conductanceOf(e) > 0 && supplied.has(e.from) && supplied.has(e.to));
      const rec = {
        id: e.id, type: e.type, from: e.from, to: e.to, q: q, active: isActive,
        open: !!e.open, length: e.length, diameter: e.diameter, coeff: e.coeff, pumpHead: e.pumpHead,
        title: net.edgeTitle(e)
      };
      edgeList.push(rec);
      edgeByIdRes[e.id] = rec;
      if (a && a.type === 'reservoir') outflow += q;
      if (b && b.type === 'reservoir') outflow -= q;
    });

    const massError = outflow - totalDelivered;

    if (unsupplied > 0) warnings.push(unsupplied + ' mahalle beslemesiz: bu düğümlerde hidrolik yük tanımsız (matematiksel olarak belirsiz), sıfır basınç varsayılmadı.');
    if (critical > 0 && unsupplied === 0) warnings.push(critical + ' mahalle minimum basıncın altında.');
    if (massError !== 0 && Math.abs(massError) > 0.05) warnings.push('Kütle dengesi hatası yüksek: ' + massError.toFixed(3) + ' L/s.');
    if (minP === Infinity) minP = NaN;

    return {
      ok: !singular,
      singular: singular,
      converged: converged,
      iterations: iterations,
      heads: heads,
      flows: flows,
      nodes: nodeList,
      edges: edgeList,
      nodeById: nodeByIdRes,
      edgeById: edgeByIdRes,
      totals: {
        demand: totalDemand,
        delivered: totalDelivered,
        unmet: totalUnmet,
        critical: critical,
        unsupplied: unsupplied,
        outflow: outflow,
        massError: massError,
        minPressure: minP
      },
      warnings: warnings
    };
  }

  /* Müdahale önerisi — sınırlı sayıda vana aç/kapat + kapalı hat açma
     kombinasyonu dener. Sezgiseldir, OPTİMAL OLDUĞU İDDİA EDİLMEZ. */
  function proposeIntervention(net, currentResult, options) {
    options = Object.assign({ maxCombo: 120, maxActions: 6 }, options || {});
    const base = currentResult || solve(net);
    const baseScore = scoreOf(base);

    const actions = [];
    net.edges.forEach(e => {
      if (e.type === 'valve') actions.push({ kind: 'valve', id: e.id, label: net.edgeTitle(e) + ' (vana)' });
      else if (e.type === 'pipe' && !e.open) actions.push({ kind: 'pipe', id: e.id, label: net.edgeTitle(e) + ' (kapalı hat)' });
    });
    const pool = actions.slice(0, options.maxActions);
    const combos = [];
    const limit = Math.min(pool.length, 4);
    const nCombos = Math.pow(2, limit) - 1;
    for (let mask = 1; mask <= nCombos && combos.length < options.maxCombo; mask++) {
      const set = [];
      for (let i = 0; i < limit; i++) if (mask & (1 << i)) set.push(pool[i]);
      if (set.length) combos.push(set);
    }

    let best = null, tried = 0;
    for (let ci = 0; ci < combos.length; ci++) {
      const combo = combos[ci];
      const clone = net.clone();
      combo.forEach(a => {
        const ed = clone.getEdge(a.id);
        if (!ed) return;
        if (a.kind === 'valve') ed.open = !ed.open;
        else ed.open = true;
      });
      let r;
      try { r = solve(clone); } catch (err) { continue; }
      tried += 1;
      if (!r || !r.ok) continue;
      const sc = scoreOf(r);
      if (sc.total > baseScore.total + 1e-9 && (!best || sc.total > best.score.total)) {
        best = { score: sc, actions: combo, result: r };
      }
    }

    return {
      found: !!best,
      tried: tried,
      candidates: combos.length,
      baseScore: baseScore,
      bestScore: best ? best.score : null,
      actions: best ? best.actions.map(a => ({ kind: a.kind, id: a.id, label: a.label })) : [],
      note: 'Sezgisel arama: sınırlı kombinasyon denendi, optimal olduğu iddia edilmez.'
    };
  }

  function scoreOf(r) {
    let served = 0, unmet = 0, sumP = 0;
    r.nodes.forEach(nd => {
      if (nd.type !== 'neighborhood') return;
      if (nd.status === 'ok') served += 1;
      unmet += Math.max(0, nd.demand - nd.delivered);
      if (isFinite(nd.pressure)) sumP += nd.pressure;
    });
    return {
      served: served,
      unmet: unmet,
      sumPressure: sumP,
      delivered: r.totals.delivered,
      minPressure: r.totals.minPressure,
      total: served * 100000 - unmet * 100 + sumP * 0.001
    };
  }

  global.NumexHydraulics = {
    K_PIPE: K_PIPE, K_VALVE: K_VALVE, K_PUMP: K_PUMP,
    conductanceOf: conductanceOf,
    edgeSource: edgeSource,
    solveLinear: solveLinear,
    solve: solve,
    proposeIntervention: proposeIntervention,
    scoreOf: scoreOf,
    statusOf: statusOf
  };
})(window);
