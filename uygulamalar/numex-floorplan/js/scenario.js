/* NUMEX FLOORPLAN — bina senaryo sınavı
 * Planının içinde "yaşayan insanların" sorunlarını ölçer: tahliye, çıkış, havalandırma,
 * kapı genişliği, ıslak hacim. Her sonuç bir ölçüme dayanır; uydurma yok.
 * Girdi: NF.project (duvar / boşluk / mobilya) — 3D ile aynı tek koordinat sistemi.
 */
(function (global) {
  'use strict';
  const NF = global.NF;
  const G = NF.G;

  function pointInPoly(p, poly) {
    let inside = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const a = poly[i], b = poly[j];
      if (((a.y > p.y) !== (b.y > p.y)) &&
          (p.x < (b.x - a.x) * (p.y - a.y) / (b.y - a.y) + a.x)) inside = !inside;
    }
    return inside;
  }

  function dist(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }

  function distToPoly(p, poly) {
    if (pointInPoly(p, poly)) return 0;
    let m = Infinity;
    for (let i = 0; i < poly.length; i++) {
      const a = poly[i], b = poly[(i + 1) % poly.length];
      const dx = b.x - a.x, dy = b.y - a.y;
      const L2 = dx * dx + dy * dy || 1e-9;
      let t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / L2;
      t = Math.max(0, Math.min(1, t));
      m = Math.min(m, Math.hypot(p.x - (a.x + dx * t), p.y - (a.y + dy * t)));
    }
    return m;
  }

  /** Kapının iki yanındaki odalar + dış cephede mi */
  function doorSides(project, op, wall, rooms) {
    const L = G.len(wall);
    const pt = G.pointAt(wall, G.clamp(op.d, 0, L));
    const nx = -Math.sin(G.angle(wall)), ny = Math.cos(G.angle(wall));
    const off = (wall.t || 0.2) / 2 + 0.12;
    const left = { x: pt.x + nx * off, y: pt.y + ny * off };
    const right = { x: pt.x - nx * off, y: pt.y - ny * off };
    const sideOf = p => {
      for (let i = 0; i < rooms.length; i++) if (pointInPoly(p, rooms[i].poly)) return i;
      return -1;
    };
    return { pt, a: sideOf(left), b: sideOf(right) };
  }

  function analyse(project) {
    const rooms = NF.rooms(project);
    const walls = project.walls || [];
    const ops = project.openings || [];
    const furn = project.furniture || [];

    const doors = ops.filter(o => o.type === 'door')
      .map(o => {
        const w = walls.find(x => x.id === o.wallId);
        if (!w) return null;
        const s = doorSides(project, o, w, rooms);
        return { id: o.id, w: o.w, d: o.d, pt: s.pt, a: s.a, b: s.b, wall: w };
      })
      .filter(Boolean);

    const windows = ops.filter(o => o.type === 'window')
      .map(o => {
        const w = walls.find(x => x.id === o.wallId);
        if (!w) return null;
        const s = doorSides(project, o, w, rooms);
        return { id: o.id, w: o.w, pt: s.pt, a: s.a, b: s.b };
      })
      .filter(Boolean);

    /* dış çıkış: bir yanı oda, diğer yanı hiçbir oda değil (= dışarısı) */
    const exits = doors.filter(d => (d.a >= 0) !== (d.b >= 0));

    /* odalara ait mobilya: ıslak hacim / yatak tespiti */
    const roomInfo = rooms.map((r, i) => {
      const inside = furn.filter(f => pointInPoly({ x: f.x, y: f.y }, r.poly));
      const types = inside.map(f => f.type);
      const label = types.some(t => t === 'toilet' || t === 'shower') ? 'Banyo'
        : types.includes('bed') ? 'Yatak Odası'
        : (types.includes('sofa') || types.includes('tv')) ? (types.includes('counter') ? 'Salon + Mutfak' : 'Salon')
        : types.includes('counter') ? 'Mutfak'
        : null;
      return {
        i, room: r,
        label: label || r.name,
        wet: types.some(t => t === 'toilet' || t === 'shower'),   // lavabo tek başına ıslak hacim yapmaz (mutfakta da var)
        bed: types.includes('bed'),
        kitchen: types.includes('counter'),
        furn: inside.length,
        doors: doors.filter(d => d.a === i || d.b === i),
        windows: windows.filter(wd => wd.a === i || wd.b === i),
        exits: exits.filter(d => d.a === i || d.b === i)
      };
    });

    /* --- tahliye: oda ↔ kapı grafı (kapı iki odaya açılıyorsa iki yana da bağ) --- */
    const roomDoors = roomInfo.map(ri => ri.doors);
    const exitSet = new Set(exits.map(d => d.id));

    /** Yol düğümlerini ('p' başlangıç, 'd<kapı>', 'r<oda>') metre koordinatlarına çevirir. */
    function pathToPoints(path, from) {
      return (path || []).map(k => {
        if (k === 'p') return { x: from.x, y: from.y };
        if (k.charAt(0) === 'd') {
          const d = doors.find(x => 'd' + x.id === k);
          return d ? { x: d.pt.x, y: d.pt.y } : null;
        }
        const r = rooms[+k.slice(1)];
        return r ? { x: r.cx, y: r.cy } : null;
      }).filter(Boolean);
    }

    function evacuationFrom(i0, startPt) {
      // düğüm: 'r<oda>' | 'd<kapı>'
      const start = startPt ? 'p' : 'r' + i0;
      // NUMEX-DÜZELTME (2026-11-16): evacuationFrom içindeki yerel "dist" nesnesi, modül düzeyindeki dist(a,b) fonksiyonunu gölgeliyordu (TypeError: dist is not a function); mesafe haritasının adı distMap yapıldı, fonksiyon adı serbest kaldı.
      const distMap = { [start]: 0 };
      const prev = {};
      const queue = [start];
      const visited = new Set();
      while (queue.length) {
        queue.sort((x, y) => distMap[x] - distMap[y]);
        const cur = queue.shift();
        if (visited.has(cur)) continue;
        visited.add(cur);
        if (cur[0] === 'd') {
          const d = doors.find(x => 'd' + x.id === cur);
          if (d && exitSet.has(d.id)) {
            // çıkışa ulaştı: yolu geri sar
            const path = [];
            let k = cur;
            while (k) { path.unshift(k); k = prev[k]; }
            return { found: true, total: distMap[cur], path, from: startPt || { x: rooms[i0].cx, y: rooms[i0].cy } };
          }
        }
        if (cur === 'p') {
          roomDoors[i0].forEach(d => {
            const nd = 'd' + d.id;
            const cost = dist(startPt, d.pt);
            if (distMap[nd] === undefined || distMap[cur] + cost < distMap[nd]) {
              distMap[nd] = distMap[cur] + cost;
              prev[nd] = cur;
              queue.push(nd);
            }
          });
          continue;
        }
        if (cur[0] === 'r') {
          const i = +cur.slice(1);
          const r = rooms[i];
          const c = { x: r.cx, y: r.cy };
          roomDoors[i].forEach(d => {
            const nd = 'd' + d.id;
            const cost = dist(c, d.pt);
            if (distMap[nd] === undefined || distMap[cur] + cost < distMap[nd]) {
              distMap[nd] = distMap[cur] + cost;
              prev[nd] = cur;
              queue.push(nd);
            }
          });
        } else {
          const d = doors.find(x => 'd' + x.id === cur);
          if (!d) continue;
          [d.a, d.b].forEach(j => {
            if (j < 0) return;
            const nd = 'r' + j;
            const c = { x: rooms[j].cx, y: rooms[j].cy };
            const cost = dist(d.pt, c);
            if (distMap[nd] === undefined || distMap[cur] + cost < distMap[nd]) {
              distMap[nd] = distMap[cur] + cost;
              prev[nd] = cur;
              queue.push(nd);
            }
          });
        }
      }
      return { found: false, total: Infinity, path: [] };
    }

    /* --- ölçümler --- */
    const issues = [];
    const metrics = {};

    metrics.oda = rooms.length;
    metrics.duvar = walls.length;
    metrics.kapi = doors.length;
    metrics.pencere = windows.length;
    metrics.cikis = exits.length;
    metrics.alan = +rooms.reduce((s, r) => s + r.area, 0).toFixed(2);

    // 0) kapalı oda yoksa hiçbir senaryo ölçülemez
    if (rooms.length === 0) {
      return {
        metrics,
        issues: [{ level: 'kritik', code: 'ODA_YOK', text: 'Kapalı oda yok — duvarları kapatmadan bina senaryosu ölçülemez.', at: null }],
        rooms: roomInfo, doors, exits, evac: []
      };
    }

    // 1) tahliye mesafesi
    const evac = roomInfo.map(ri => {
      const e = evacuationFrom(ri.i);
      // Gerçek hesap odanın EN UZAK köşesinden yapılır (yangın yönetmeliği mantığı).
      // Merkez iyimserdir; her köşe denenir, en kötü sonuç esas alınır.
      let worst = null, worstPath = null, worstFrom = null;
      ri.room.poly.forEach(p => {
        const r2 = evacuationFrom(ri.i, p);
        if (r2.found && (worst === null || r2.total > worst)) { worst = r2.total; worstPath = r2.path; worstFrom = p; }
      });
      const m = e.found ? e.total : Infinity;
      metrics['tahliye_' + (ri.i + 1)] = isFinite(m) ? +m.toFixed(2) : null;
      metrics['tahliyeKose_' + (ri.i + 1)] = worst === null ? null : +worst.toFixed(2);
      const bestPath = worstPath || e.path;
      const bestFrom = worstFrom || e.from || { x: ri.room.cx, y: ri.room.cy };
      return {
        room: ri.room, i: ri.i,
        m: e.found ? +m.toFixed(2) : null,
        worst: worst === null ? (e.found ? +m.toFixed(2) : null) : +worst.toFixed(2),
        path: bestPath,
        from: bestFrom,
        pts: pathToPoints(bestPath, bestFrom)   // haritada çizilecek tahliye yolu (metre)
      };
    });
    const evacMax = evac.reduce((m, e) => Math.max(m, e.worst === null ? Infinity : e.worst), 0);
    metrics.enUzunTahliye = isFinite(evacMax) ? +evacMax.toFixed(2) : null;

    evac.forEach(e => {
      if (e.m === null) {
        const ri = roomInfo[e.i];
        issues.push({
          level: 'kritik', code: 'CIKIS_YOK',
          text: ri.room.name + ' (' + ri.room.area.toFixed(2) + ' m²) için çıkışa giden kapı yolu yok — bu odaya hapsolan kişi dışarı çıkamaz.',
          at: { x: ri.room.cx, y: ri.room.cy }, room: e.i
        });
      } else if (e.worst > 20) {
        issues.push({
          level: 'kritik', code: 'UZUN_TAHLIYE',
          text: ri2(e.i).name + ' en uzak köşesinden çıkış ' + e.worst.toFixed(2) + ' m (yönetmelik sınırı 20 m).',
          at: { x: roomInfo[e.i].room.cx, y: roomInfo[e.i].room.cy }, room: e.i
        });
      } else if (e.worst > 14) {
        issues.push({
          level: 'uyarı', code: 'TAHLIYE_UZUN',
          text: ri2(e.i).name + ' en uzak köşesinden çıkış ' + e.worst.toFixed(2) + ' m — sınırda, duman altında riskli.',
          at: { x: roomInfo[e.i].room.cx, y: roomInfo[e.i].room.cy }, room: e.i
        });
      }
    });
    function ri2(i) { return roomInfo[i].room; }

    // 2) tek çıkış
    if (exits.length === 0) {
      issues.push({ level: 'kritik', code: 'CIKIS_KAPI_YOK', text: 'Binada dışarıya açılan tek kapı yok — hiçbir oda tahliye edilemez.', at: null });
    } else if (exits.length === 1) {
      issues.push({
        level: 'uyarı', code: 'TEK_CIKIS',
        text: 'Tek dış kapı var (' + exits[0].w.toFixed(2) + ' m) — yangında o kapı tıkanırsa alternatif yok.',
        at: { x: exits[0].pt.x, y: exits[0].pt.y }
      });
    }

    // 3) kapı genişliği (erişilebilirlik)
    doors.forEach(d => {
      if (d.w < 0.80) {
        issues.push({
          level: 'uyarı', code: 'DAR_KAPI',
          text: 'Bir kapı ' + (d.w * 100).toFixed(0) + ' cm — tekerlekli sandalye ve sedye geçmez (en az 80 cm).',
          at: d.pt
        });
      }
    });

    // 4) penceresiz yaşam odası (havalandırma / gün ışığı)
    roomInfo.forEach(ri => {
      if (ri.room.area < 3 || ri.wet) return;   // ıslak hacimler ve kiler hariç
      if (ri.windows.length === 0) {
        issues.push({
          level: 'uyarı', code: 'PENCERE_YOK',
          text: ri.room.name + ' (' + ri.room.area.toFixed(2) + ' m²) — penceresi yok: havalandırma ve gün ışığı alamaz.',
          at: { x: ri.room.cx, y: ri.room.cy }, room: ri.i
        });
      }
    });

    // 5) ıslak hacim kapısı doğrudan mutfak/salon ağzına mı (basit hijyen ölçüsü: ıslak hacmin kapısı yok)
    roomInfo.forEach(ri => {
      if (ri.wet && ri.doors.length === 0) {
        issues.push({
          level: 'kritik', code: 'ISLAK_KAPISIZ',
          text: ri.room.name + ' ıslak hacim ama kapısı yok — lavabo/klozet doğrudan yaşam alanına açık.',
          at: { x: ri.room.cx, y: ri.room.cy }, room: ri.i
        });
      }
    });

    // 6) yatak odası ile ıslak hacim arasında duvar var mı (mahremiyet/ses)
    const beds = roomInfo.filter(r => r.bed);
    beds.forEach(b => {
      const shares = roomInfo.filter(o => o !== b && o.wet);
      shares.forEach(o => {
        // iki odanın sınır noktaları 0,35 m'den yakınsa ortak duvar var
        let min = Infinity;
        b.room.poly.forEach(p => o.room.poly.forEach(q => { min = Math.min(min, dist(p, q)); }));
        if (min < 0.02) {
          issues.push({
            level: 'bilgi', code: 'ORTAK_DUVAR',
            text: b.room.name + ' ile ' + o.room.name + ' ortak duvar paylaşıyor — tesisat sesi yatak odasına gelir.',
            at: { x: b.room.cx, y: b.room.cy }, room: b.i
          });
        }
      });
    });

    // 7) çıkışa en yakın oda tahliye sırasında tıkanıklık riski
    if (exits.length && evac.length) {
      const nearest = evac.filter(e => e.m !== null).sort((a, b) => a.m - b.m)[0];
      if (nearest && nearest.m < 1.5) {
        issues.push({
          level: 'bilgi', code: 'CIKIS_ONU',
          text: roomInfo[nearest.i].room.name + ' çıkışın hemen önünde (' + nearest.m.toFixed(2) + ' m) — kapı önünü boş tut.',
          at: { x: roomInfo[nearest.i].room.cx, y: roomInfo[nearest.i].room.cy }, room: nearest.i
        });
      }
    }

    const order = { kritik: 0, uyarı: 1, bilgi: 2 };
    issues.sort((a, b) => order[a.level] - order[b.level]);

    const res = { metrics, issues, rooms: roomInfo, doors, exits, evac };
    res.senaryolar = buildScenarios(res);
    return res;
  }

  /* ---------------- beş senaryo ----------------
   * Her senaryo kendi bulgu kodlarını toplar; kritik veya uyarı varsa "kaldı".
   */
  const SEN = [
    { id: 'yangin', ad: 'Yangın tahliyesi', kodlar: ['CIKIS_YOK', 'UZUN_TAHLIYE', 'TAHLIYE_UZUN'] },
    { id: 'cikis', ad: 'Çıkış yeterliliği', kodlar: ['CIKIS_KAPI_YOK', 'TEK_CIKIS', 'CIKIS_ONU'] },
    { id: 'erisim', ad: 'Erişilebilirlik (kapı genişliği)', kodlar: ['DAR_KAPI'] },
    { id: 'isik', ad: 'Gün ışığı ve havalandırma', kodlar: ['PENCERE_YOK'] },
    { id: 'islak', ad: 'Islak hacim hijyeni ve ses', kodlar: ['ISLAK_KAPISIZ', 'ORTAK_DUVAR'] }
  ];

  function buildScenarios(res) {
    return SEN.map(s => {
      const bulgular = (res.issues || []).filter(i => s.kodlar.indexOf(i.code) >= 0);
      const kritik = bulgular.filter(i => i.level === 'kritik').length;
      const uyari = bulgular.filter(i => i.level === 'uyarı').length;
      return { id: s.id, ad: s.ad, ok: kritik === 0 && uyari === 0, kritik, uyari, bulgular };
    });
  }

  /** Sonucu insan diline çevirir: "kürsüde kaldı" / "kürsüyü bıraktı" */
  function verdict(res) {
    const k = res.issues.filter(i => i.level === 'kritik').length;
    const u = res.issues.filter(i => i.level === 'uyarı').length;
    const sen = res.senaryolar || buildScenarios(res);
    const kalan = sen.filter(s => !s.ok);
    if (!res.metrics.oda) return { ok: false, level: 'kritik', text: 'Sınav koşulamadı: ölçülecek kapalı oda yok.' };
    if (!k && !u) return { ok: true, level: 'temiz', text: 'Bina sınavı geçti: 5 senaryonun hepsi temiz, bulgu yok.' };
    if (!k) {
      return {
        ok: false, level: 'uyarı',
        text: kalan.length + '/5 senaryo kaldı (' + kalan.map(s => s.ad).join(', ') + ') — ' + u + ' uyarı, kritik yok: yaşanır ama sınırda.'
      };
    }
    return {
      ok: false, level: 'kritik',
      text: k + ' kritik, ' + u + ' uyarı — ' + kalan.length + '/5 senaryo kaldı; bu binada insanlar yangında sıkışır.'
    };
  }

  global.SCENARIO = { analyse, verdict, pointInPoly, buildScenarios, SEN };
})(window);
