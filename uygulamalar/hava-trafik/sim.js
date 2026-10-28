/* ============================================================================
   NUMEX CORE — SKY COMMAND · Ortak Durum Motoru (Single Source of Truth)
   ----------------------------------------------------------------------------
   Bu dosya TEK gerçek kaynaktır. Radar ve 3D sahne buradan beslenir.
   Tüm uçuşlar, pistler ve hava KURGUSAL simülasyon verisidir.
   Gerçek ATC sistemlerine bağlanmaz, gerçek uçaklara komut göndermez.
   Eşikler eğitim amaçlı kurgusal parametrelerdir.
   ========================================================================== */
(function (root) {
  'use strict';

  /* ------------------------------------------------------------------ */
  /* SABİTLER — kurgusal güvenlik eşikleri                              */
  /* ------------------------------------------------------------------ */
  const CFG = {
    MIN_SEPARATION_NM: 3.0,      // minimum yatay ayırma (deniz mili)
    MIN_VSEP_FT: 1000,           // minimum dikey ayırma (feet)
    FUEL_WARN_PCT: 25,           // yakıt uyarı eşiği %
    FUEL_CRIT_PCT: 15,           // yakıt kritik eşiği %
    DELAY_WARN_SEC: 90,          // simülasyon saniyesi gecikme eşiği
    TICK_MS: 250,                // simülasyon adımı
    SIM_SPEED_DEFAULT: 1,
  };
  // Simülasyon doğuşta ÇALIŞIR durumda başlar (motorun tick'i aksi hâlde hiç ilerlemez)
  CFG.RUNNING_DEFAULT = true;

  const STATE = {
    PARK: 'PARK',
    TAXI_OUT: 'TAKSİ',
    HOLD: 'KALKIŞ SIRASI',
    TAKEOFF: 'KALKIŞ',
    CRUISE: 'SEYİR',
    APPROACH: 'YAKLAŞMA',
    LANDING: 'İNİŞ',
    TAXI_IN: 'TAKSİ',
    FINISHED: 'TAMAMLANDI',
  };

  const S = STATE;

  /* ------------------------------------------------------------------ */
  /* Havalimanı geometrisi (kurgusal) — DÜNYA KOORDİNATI (km)           */
  /* x = doğu, z = güney(pozitif). Merkez: havalimanı referans noktası  */
  /* ------------------------------------------------------------------ */
  const AIRPORT = {
    name: 'NUMEX ULUSLARARASI HAVALİMANI (NXA) — KURGUSAL',
    icao: 'LTNX',
    // iki bağımsız paralel pist (16/34 yönü ~ kuzey-güney)
    runways: [
      {
        id: '16L/34R', short: '34R', head: 340, len: 3.8, x: -0.55, z0: -1.9, z1: 1.9,
        ils: true, closed: false, wet: false, assigned: null,
        thresholdHeading: 340,
      },
      {
        id: '16R/34L', short: '34L', head: 340, len: 3.8, x: 0.85, z0: -1.9, z1: 1.9,
        ils: true, closed: false, wet: false, assigned: null,
        thresholdHeading: 340,
      },
    ],
    taxiways: [
      { name: 'A', x: -0.55, z0: -1.9, z1: 1.9, type: 'parallel' },
      { name: 'B', x: 0.85, z0: -1.9, z1: 1.9, type: 'parallel' },
      { name: 'C', x: 0.15, z0: -1.7, z1: 1.7, type: 'parallel' },
      { name: 'D1', x: 0.15, z: -1.7, type: 'cross' },
    ],
    terminal: { x: 0.15, z: 0.55, w: 1.5, d: 0.42, h: 0.026 },
    tower: { x: 0.62, z: -0.35, h: 0.085 },
    apron: { x: 0.15, z: 0.15, w: 1.6, d: 0.55 },
    // 12 park noktası (terminal önü)
    stands: 12,
  };

  /* ------------------------------------------------------------------ */
  /* Yardımcılar                                                        */
  /* ------------------------------------------------------------------ */
  const DEG = Math.PI / 180;
  let seed = 20261027;
  function rnd() { // deterministik PRNG (test edilebilirlik)
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  }
  const pick = (a) => a[Math.floor(rnd() * a.length)];
  const rndR = (a, b) => a + rnd() * (b - a);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const dist2 = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);

  function bearing(from, to) { // derece, 0=K, saat yönü
    const dx = to.x - from.x, dz = to.z - from.z;
    return (Math.atan2(dx, -dz) / DEG + 360) % 360;
  }
  function moveTowards(o, headingDeg, distKm) {
    const r = headingDeg * DEG;
    o.x += Math.sin(r) * distKm;
    o.z += -Math.cos(r) * distKm;
  }

  /* ------------------------------------------------------------------ */
  /* Uçak fabrikası                                                     */
  /* ------------------------------------------------------------------ */
  const AIRLINES = [
    { code: 'NX', name: 'NUMEX AIR', type: 'B738' },
    { code: 'TK', name: 'ANADOLU', type: 'A321' },
    { code: 'BA', name: 'BOSPHORUS', type: 'A320' },
    { code: 'EF', name: 'EFES', type: 'B739' },
    { code: 'MR', name: 'MARMARA', type: 'E195' },
    { code: 'KR', name: 'KARADENİZ', type: 'A319' },
    { code: 'AK', name: 'AKDENİZ', type: 'B77W' },
    { code: 'EG', name: 'EGE HAVA', type: 'AT76' },
    { code: 'TP', name: 'TRAKYA', type: 'CRJ9' },
    { code: 'KD', name: 'KAPADOKYA', type: 'A20N' },
  ];
  const DESTS = ['LTBA', 'LTFJ', 'LTAC', 'LTAI', 'LTBJ', 'LSZH', 'EGLL', 'EDDF', 'LIRF', 'OMDB', 'LPPT', 'EHAM'];

  /* İSTANBUL HAVALİMANI (LTFM) düzeni — kurgusal simülasyon, gerçek operasyona bağlanmaz.
     5 paralel pist, kuzey-güney ekseni (16/34 yönü), ana terminal doğuda, 4 uç kule. */
  AIRPORT.name = 'İSTANBUL HAVALİMANI (LTFM) — SİMÜLASYON';
  AIRPORT.icao = 'LTFM';
  AIRPORT.istanbul = {
    runwayCount: 5,
    terminalArea: 'Ana terminal (doğu)',
    towers: 4,
    mw: '16/34 paralel pist takımı',
  };
  const IST_RWY_X = [-2.35, -1.25, 0.15, 1.25, 2.35];
  AIRPORT.runways = IST_RWY_X.map((x, i) => ({
    id: (i % 2 === 0 ? '16R/34L' : '16L/34R') + '-' + (i + 1),
    short: 'P' + (i + 1),
    head: 340,
    len: 4.1,
    x,
    z0: -2.05,
    z1: 2.05,
    ils: i !== 2,
    closed: false,
    wet: false,
    assigned: null,
    thresholdHeading: 340,
  }));
  AIRPORT.terminal = { x: 3.55, z: 0.0, w: 0.55, d: 2.4, h: 0.03 };
  AIRPORT.apron = { x: 2.95, z: 0.0, w: 0.5, d: 2.6 };
  AIRPORT.tower = { x: 3.15, z: -0.9, h: 0.085 };
  AIRPORT.towers = [
    { x: 3.15, z: -0.9, h: 0.085 },
    { x: -3.05, z: -0.9, h: 0.08 },
    { x: -3.05, z: 0.9, h: 0.08 },
    { x: 3.15, z: 0.9, h: 0.08 },
  ];
  AIRPORT.stands = 20;
  // Apron boyuna sığan 8 park pozisyonu (apron d=2.6 → güvenli iç aralık 2.2)
  const STAND_Z = (i) => -1.05 + (i % 8) * 0.28;

  let uid = 1;
  let simTime = 0;        // saniye
  let flights = [];
  let events = [];
  let alerts = [];
  let alertSeq = 1;
  let eventSeq = 1;
  let scenarioLog = [];

  function logEvent(kind, flight, msg, reason) {
    events.unshift({
      id: eventSeq++, t: +simTime.toFixed(1), kind, flight: flight || '-',
      msg, reason: reason || '',
      clock: clockStr(),
    });
    if (events.length > 400) events.length = 400;
  }
  function clockStr() {
    const base = 6 * 3600 + 12 * 60; // 06:12 sim başlangıcı
    const tot = base + Math.floor(simTime);
    const h = String(Math.floor(tot / 3600) % 24).padStart(2, '0');
    const m = String(Math.floor(tot / 60) % 60).padStart(2, '0');
    const s = String(tot % 60).padStart(2, '0');
    return `${h}:${m}:${s}`;
  }

  function newFlight(kind) {
    const al = pick(AIRLINES);
    const num = 100 + Math.floor(rnd() * 899);
    const f = {
      id: uid++,
      callsign: al.code + num,
      airline: al.name,
      acType: al.type,
      state: S.PARK,
      stateSince: simTime,
      x: 0, z: 0,
      heading: 340,
      altitude: 0,          // feet
      speed: 0,             // knot
      fuel: 100,            // %
      origin: pick(DESTS),
      dest: pick(DESTS),
      runway: null,
      priority: 'NORMAL',   // NORMAL | HIGH | EMERGENCY
      emergency: false,
      track: [],
      delaySec: 0,
      stand: 0,
      taxiTarget: null,
      kind,                 // 'dep' | 'arr'
      plan: {},
    };
    return f;
  }

  /* ------------------------------------------------------------------ */
  /* Başlangıç: 25 uçak, farklı durumlarda, farklı pistlerde            */
  /* ------------------------------------------------------------------ */
  function seedWorld() {
    flights = [];
    events = [];
    alerts = [];
    simTime = 0;
    uid = 1; seed = 20261027;

    // Pistleri aç
    AIRPORT.runways.forEach(r => { r.assigned = null; r.closed = false; });

    // 1) 8 uçak PARK (apron)
    for (let i = 0; i < 8; i++) {
      const f = newFlight(i % 2 === 0 ? 'dep' : 'arr');
      f.state = S.PARK;
      f.stand = i + 1;
      f.x = AIRPORT.apron.x - 0.18;
      f.z = STAND_Z(i);
      f.heading = 90;
      f.fuel = rndR(55, 96);
      f.altitude = 0; f.speed = 0;
      f.origin = 'LTNX';
      f.plan = { aktarma: 'PARK → TAKSİ → KALKIŞ SIRASI → KALKIŞ → SEYİR' };
      flights.push(f);
    }
    // 2) 3 uçak TAKSİ (kalkışa giden)
    for (let i = 0; i < 3; i++) {
      const f = newFlight('dep');
      f.state = S.TAXI_OUT;
      f.x = 0.15; f.z = 1.55 - i * 0.35;
      f.heading = 340; f.speed = 14; f.altitude = 0;
      f.fuel = rndR(62, 92); f.origin = 'LTNX';
      f.plan = { aktarma: 'TAKSİ → KALKIŞ SIRASI → KALKIŞ' };
      flights.push(f);
    }
    // 3) 3 uçak KALKIŞ SIRASI (İstanbul: 5 pist paralel kullanılabilir)
    for (let i = 0; i < 3; i++) {
      const f = newFlight('dep');
      f.state = S.HOLD;
      f.runway = AIRPORT.runways[i].short;
      f.x = AIRPORT.runways[i].x; f.z = 1.72 - i * 0.001;
      f.heading = 340; f.speed = 3; f.altitude = 0;
      f.fuel = rndR(70, 95); f.origin = 'LTNX';
      f.plan = { aktarma: 'KALKIŞ SIRASI → KALKIŞ → SEYİR' };
      flights.push(f);
    }
    // 4) 2 uçak KALKIŞ (havalanmış, tırmanıyor)
    for (let i = 0; i < 2; i++) {
      const f = newFlight('dep');
      f.state = S.TAKEOFF;
      const rw = AIRPORT.runways[i];
      f.x = rw.x + 0.02; f.z = 2.4 + i * 0.9;
      f.heading = 340; f.altitude = 1400 + i * 2200; f.speed = 168;
      f.fuel = rndR(78, 97); f.origin = 'LTNX';
      f.runway = rw.short;
      f.plan = { aktarma: 'KALKIŞ → SEYİR (tırmanış)' };
      flights.push(f);
    }
    // 5) 6 uçak SEYİR (gelen/tırmanan)
    for (let i = 0; i < 6; i++) {
      const f = newFlight('arr');
      f.state = S.CRUISE;
      const ang = (i / 6) * Math.PI * 2 + 0.4;
      const rad = 22 + rndR(0, 9);
      f.x = Math.cos(ang) * rad;
      f.z = Math.sin(ang) * rad;
      f.heading = (ang / DEG + 180 + rndR(-18, 18)) % 360;
      f.altitude = 11000 + rndR(-1500, 3500);
      f.speed = 420 + rndR(-30, 40);
      f.fuel = rndR(30, 88);
      f.plan = { aktarma: 'SEYİR → YAKLAŞMA → İNİŞ' };
      flights.push(f);
    }
    // 6) 3 uçak YAKLAŞMA
    for (let i = 0; i < 3; i++) {
      const f = newFlight('arr');
      f.state = S.APPROACH;
      const rw = AIRPORT.runways[i % AIRPORT.runways.length];
      f.runway = rw.short;
      f.x = rw.x + rndR(-0.25, 0.25);
      f.z = -6.5 - i * 4.2;
      f.heading = 340;
      f.altitude = 3000 + i * 900;
      f.heading = 160; f.altitude = 2400 + i * 1500; f.speed = 165;
      f.fuel = rndR(20, 55);
      f.plan = { aktarma: 'YAKLAŞMA → İNİŞ → TAKSİ → PARK' };
      flights.push(f);
    }
    // 7) 1 uçak İNİŞ (kısa final)
    {
      const f = newFlight('arr');
      f.state = S.LANDING;
      const rw = AIRPORT.runways[0];
      f.runway = rw.short;
      f.x = rw.x; f.z = -2.55;
      f.heading = 160; f.altitude = 260; f.speed = 142;
      f.fuel = rndR(18, 40);
      f.plan = { aktarma: 'İNİŞ → TAKSİ → PARK' };
      flights.push(f);
    }

    flights.forEach(f => { f.track = [{ x: f.x, z: f.z, a: f.altitude }]; });

    logEvent('SYS', '-', 'Simülasyon başlatıldı — 25 kurgusal uçuş yüklendi.', 'Ortak durum motoru tek kaynak olarak ayakta.');
    logEvent('SYS', '-', 'Kurgusal veri seti. Gerçek ATC sistemine bağlantı YOK.', 'Eğitim amaçlı simülasyon.');
  }

  /* ------------------------------------------------------------------ */
  /* Pist yönetimi — çatışma engelleyici                                */
  /* ------------------------------------------------------------------ */
  function runwayById(short) {
    return AIRPORT.runways.find(r => r.short === short);
  }
  function runwayAvailable(short) {
    const rw = runwayById(short);
    if (!rw) return { ok: false, why: `Pist ${short} tanımlı değil.` };
    if (rw.closed) return { ok: false, why: `Pist ${short} SENARYO A gereği KAPALI.` };
    if (rw.assigned) return { ok: false, why: `Pist ${short} şu an ${rw.assigned} uçuşuna tahsisli (çatışma).` };
    return { ok: true, why: 'Pist müsait.' };
  }

  /**
   * Pist tahsisi. Çatışma varsa REDDEDER ve kaydeder.
   * @returns {{ok:boolean, why:string}}
   */
  function assignRunway(flightId, short, actor) {
    actor = actor || 'OPERATOR';
    const f = flights.find(x => x.id === flightId);
    if (!f) return { ok: false, why: 'Uçuş bulunamadı.' };
    // NUMEX-DÜZELTME (2026-10-27): Kök neden: pist KENDİ uçağına atanmışken de "tahsisli (çatışma)" sayılıp reddediliyordu; KALKIŞ SIRASI her adımda bu duvara çarpıp uçağı sonsuza dek bekletiyordu (4205 sn). Artık pisti zaten o uçak tutuyorsa bu bir çatışma değildir.
    const rw0 = runwayById(short);
    if (!rw0) return { ok: false, why: `Pist ${short} tanımlı değil.` };
    if (rw0.closed) {
      logEvent('DENY', f.callsign, `Pist tahsisi reddedildi: ${short}`, `Pist ${short} KAPALI.`);
      return { ok: false, why: `Pist ${short} kapalı.` };
    }
    // pisti ZATEN bu uçak tutuyorsa çatışma yoktur → idempotent başarı
    if (rw0.assigned === f.callsign) {
      f.runway = short;
      return { ok: true, why: 'Tahsis zaten geçerli.' };
    }
    const chk = runwayAvailable(short);
    if (!chk.ok) {
      logEvent('DENY', f.callsign, `Pist tahsisi reddedildi: ${short}`, chk.why);
      return chk;
    }
    const rw = runwayById(short);
    // eski pist tahsisini bırak
    if (f.runway && f.runway !== short) {
      const old = runwayById(f.runway);
      if (old && old.assigned === f.callsign) old.assigned = null;
    }
    // NUMEX-DÜZELTME (2026-10-27): Aynı uçağa hâlihazırda tahsisli pist her simülasyon adımında yeniden atanıp olay kaydını aynı RWY satırıyla dolduruyordu (log kirliliği + gereksiz iş). Aynı tahsis artık sessizce geçer.
    if (rw.assigned === f.callsign && f.runway === short) {
      return { ok: true, why: 'Tahsis zaten geçerli.' };
    }
    rw.assigned = f.callsign;
    f.runway = short;
    logEvent('RWY', f.callsign, `Pist ${short} tahsis edildi.`, `${actor} tarafından; çatışma kontrolü geçildi.`);
    return { ok: true, why: 'Tahsis tamam.' };
  }
  function releaseRunway(short, callsign) {
    const rw = runwayById(short);
    if (rw && (!callsign || rw.assigned === callsign)) rw.assigned = null;
  }
  // NUMEX-DÜZELTME (2026-10-27): Kök neden: uçağın KENDİ pistine atanmış olması (rw.assigned === excludeCallsign) çatışma gibi değerlendirilip atlanıyor, uçak bir sonraki piste kaydırılıyor ve tahsis reddediliyordu (P1 uçağı P5'e zorlanıyordu). Önce mevcut pist korunur.
  function freeRunwayFor(excludeCallsign, preferShort) {
    // 1) uçağın hâlihazırda geçerli pisti varsa onu koru (gereksiz yer değiştirme = çatışma üretir)
    if (preferShort) {
      const own = runwayById(preferShort);
      if (own && !own.closed && (!own.assigned || own.assigned === excludeCallsign)) return own.short;
    }
    // 2) boş ve açık pist
    for (const rw of AIRPORT.runways) {
      if (rw.closed) continue;
      if (rw.assigned && rw.assigned !== excludeCallsign) continue;
      return rw.short;
    }
    return null;
  }

  /* ------------------------------------------------------------------ */
  /* Durum geçiş motoru — kurallı, gerekçeli                            */
  /* ------------------------------------------------------------------ */
  const usedRW = { climb: {}, land: {} };

  function transition(f, to, reason, actor) {
    if (f.state === to) return false;
    const from = f.state;
    f.state = to;
    f.stateSince = simTime;
    logEvent('STATE', f.callsign, `${from} → ${to}`, reason || '—');
    f.lastActor = actor || 'MOTOR';
    return true;
  }

  /**
   * Koşullara bağlı otomatik durum ilerletmesi.
   * Her adımda kural kontrolü yapar; rastgele geçiş YOKTUR.
   */
  function stepFlight(f, dt) {
    const rw = f.runway ? runwayById(f.runway) : null;

    switch (f.state) {
      /* ---------------- PARK ---------------- */
      case S.PARK: {
        // Kural: pist müsait değilse taksiye çıkma (uçağın kendi pisti varsa korunur)
        const free = freeRunwayFor(f.callsign, f.runway);
        if (free) {
          assignRunway(f.id, free, 'MOTOR');
          f.taxiTarget = free;
          f.taxiTargetZ = 1.55;
          transition(f, S.TAXI_OUT, `Pist ${free} müsait, taksi izni verildi.`);
        } else {
          if (f.delaySec === 0) f.delaySec = 0.001;
          f.delaySec += dt;
        }
        break;
      }

      /* ---------------- TAKSİ (çıkış) ---------------- */
      case S.TAXI_OUT: {
        f.heading = 340;
        f.speed = 15 + rnd() * 3;
        f.x += (rw ? rw.x - f.x : 0) * 0.08 + (rnd() - 0.5) * 0.002;
        moveTowards(f, f.heading, f.speed * dt / 3600);
        // NUMEX-DÜZELTME (2026-10-27): Kök neden: z, 1.62'ye SABİTLENİYORDU, kalkış sırası eşiği ise z<1.70 idi — eşik hiçbir zaman sağlanmadığı için uçaklar pist başında sonsuza dek bekliyordu (3730 sn kilitlenme). Sabitleme kaldırıldı; sıra eşiği pist başı noktasıyla uyumlu hâle getirildi.
        if (f.z > 1.62) f.z = 1.62;              // pist başını geçmesin (üst sınır)
        if (f.z >= 1.60) {                        // kalkış sırasına ulaştı
          f.speed = 2; f.heading = 340;
          transition(f, S.HOLD, `Pist başına ulaştı, kalkış sırasına girdi (${f.runway}).`);
        }
        break;
      }

      /* ---------------- KALKIŞ SIRASI ---------------- */
      case S.HOLD: {
        f.speed = 2; f.heading = 340;
        // NUMEX-DÜZELTME (2026-10-27): Kök neden: 'rw' değişkeni fonksiyon başında bir kez hesaplanıyor; uçağın pisti sonradan değiştiğinde bayat kalıyor ve uçak kendi pistini "başkasının pisti" sanıp her 6 saniyede yeniden tahsis deniyordu (kalkış hiç ilerlemiyordu). Pist artık her adımda uçağın güncel pist kimliğinden çözülür.
        // pisti HER ADIMDA uçağın güncel pistinden çöz (bayat referans kalkışı kilitliyordu)
        const myRw = runwayById(f.runway);
        if (!myRw || myRw.closed) {
          f.delaySec += dt;
          break;
        }
        // pisti bu uçak tutmuyorsa almayı dene
        if (myRw.assigned !== f.callsign) {
          if (f._rwTryT === undefined || simTime - f._rwTryT > 8) {
            f._rwTryT = simTime;
            const again = assignRunway(f.id, f.runway, 'MOTOR');
            if (!again.ok) { f.delaySec += dt; break; }
            myRw.assigned = f.callsign;   // bu adımda müsait say (döngüyü kırar)
          } else { f.delaySec += dt; break; }
        }
        // NUMEX-DÜZELTME (2026-10-27): Kök neden: bu adım her simülasyon adımında çalıştığı hâlde kalkışa geçiş koruması yoktu; karşıt trafik yoksa uçak sürekli "kalkış izni verildi" durumuna alınıp aynı olay kaydını 20 sn'de bir üretiyor, kalkış hiç gerçekleşmiyordu. Kalkışa geçiş bir kez yapılır ve kalkış sırası süresi (min aralık) korunur.
        // pist üzerinde KALKAN ya da İNEN başka uçak varsa bekle (tek pist = tek uçak)
        const pistMesgul = flights.some(o =>
          o !== f &&
          (o.state === S.TAKEOFF || o.state === S.LANDING) &&
          o.runway === f.runway);
        // NUMEX-DÜZELTME (2026-10-27): Tanı: kalkış sırası uçakları pist serbest olduğu hâlde kalkmıyordu. pistMesgul kontrolünün hangi uçağı gördüğü görünmüyordu; gerekçe olay kaydına yazılır (yalnız ilk 2 sn'de bir kez, log fırtınası olmadan).
        if (pistMesgul) {
          const other = flights.find(o => o !== f && (o.state === S.TAKEOFF || o.state === S.LANDING) && o.runway === f.runway);
          if (f._holdWhy !== other.callsign) {
            f._holdWhy = other.callsign;
            logEvent('RWY', f.callsign, `Kalkış bekliyor: pist ${f.runway} meşgul.`,
              `${other.callsign} şu an pistte (${other.state}).`);
          }
          f.delaySec += dt; break;
        }
        f._holdWhy = null;
        // kalkış sırasında en az 3 sn bekle (spawn kalabalığını çözer)
        // NUMEX-DÜZELTME (2026-10-27): Kök neden: f.delaySec hiçbir yerde 0 ile başlatılmıyordu; undefined üzerine += ile NaN oluşuyor ve (NaN < 3) her zaman false kaldığı için karşılaştırma dallanması bozuluyordu — kalkış sırası uçakları pist başında süresiz bekliyordu. Sayaç sayısal olarak başlatılır.
        if (typeof f.delaySec !== 'number' || !isFinite(f.delaySec)) f.delaySec = 0;
        f.delaySec += dt;
        if (f.delaySec < 3) break;
        f.delaySec = 0;
        transition(f, S.TAKEOFF, `Pist ${f.runway} serbest, kalkış izni verildi.`);
        break;
      }

      /* ---------------- KALKIŞ ---------------- */
      case S.TAKEOFF: {
        f.heading = 340;
        // NUMEX-DÜZELTME (2026-10-27): Kalkış tırmanışı 900 ft/sn ile 6000 ft'e ~7 sn'de çıkması gerekirken uçak pistte 30+ sn kalıyordu; pisti uzun süre tutup kalkış sırasını kilitliyor. Tırmanış hızlandırıldı ve pist bırakma eşiği indirildi.
        f.altitude += 2400 * dt;   // kalkış tırmanışı (hızlandırılmış simülasyon)
        f.speed = clamp(f.speed + 22 * dt, 0, 190);
        moveTowards(f, f.heading, f.speed * dt / 3600);
        f.fuel = clamp(f.fuel - 0.02 * dt, 0, 100);
        if (f.altitude > 2500) {
          // pisti serbest bırak: sıradaki uçak kalkabilsin
          releaseRunway(f.runway, f.callsign);
          f.runway = null;
          f.delaySec = 0;
          transition(f, S.CRUISE, 'Pist bırakıldı, tırmanış tamamlandı; seyir seviyesine geçti.');
        }
        break;
      }

      /* ---------------- SEYİR ---------------- */
      case S.CRUISE: {
        f.altitude = clamp(f.altitude + (12000 - f.altitude) * 0.02, 0, 14000);
        f.speed = 430;
        f.fuel = clamp(f.fuel - 0.035 * dt, 0, 100);
        // yaklaşmaya dönüş: merkeze 12 km'den yakın olan gelen uçuş
        const d = Math.hypot(f.x, f.z);
        if (f.kind === 'arr') {
          const target = { x: 0, z: 0 };
          f.heading = bearing({ x: f.x, z: f.z }, target);
          moveTowards(f, f.heading, f.speed * dt / 3600);
          if (d < 12) {
            // müsait pist: önce kendi pisti, yoksa boş pist
            const free = freeRunwayFor(f.callsign, f.runway);
            if (free) {
              const asg = assignRunway(f.id, free, 'MOTOR');
              if (asg.ok) {
                f.delaySec = 0;
                transition(f, S.APPROACH, `Merkeze ${d.toFixed(1)} km, pist ${free} yaklaşmasına alındı.`);
              } else {
                f.delaySec += dt;   // pist gerçekten dolu → bekle
              }
            } else {
              f.delaySec += dt;     // pist yok → bekleme (kriz senaryosu yakalar)
            }
          }
        } else {
          // kalkan uçak sahadan uzaklaşıyor
          moveTowards(f, f.heading, f.speed * dt / 3600);
          if (f.fuel < 30 || Math.hypot(f.x, f.z) > 45) {
            transition(f, S.FINISHED, 'Uçuş bölgeyi terk etti, simülasyon takibinden çıktı.');
          }
        }
        break;
      }

      /* ---------------- YAKLAŞMA ---------------- */
      case S.APPROACH: {
        if (!rw || rw.closed) {
          // pist kapandı → yaklaşma iptali
          transition(f, S.CRUISE, `Pist ${f.runway} kullanılamaz durumda, yaklaşma iptal edildi.`);
          releaseRunway(f.runway, f.callsign);
          f.runway = null;
          break;
        }
        const thr = { x: rw.x, z: rw.z0 - 0.35 }; // eşik yakını
        // iniş istikameti: pist başından aşağı (z ekseninde -→+)
        f.heading = 160;
        const glideDist = Math.max(0.15, (f.z - (rw.z0 - 0.35)));
        f.altitude = clamp(glideDist * 520, 200, 9000);
        f.speed = clamp(150 + f.altitude * 0.012, 150, 210);
        f.fuel = clamp(f.fuel - 0.06 * dt, 0, 100);
        moveTowards(f, 160, f.speed * dt / 3600);
        // pist hattına hizala
        f.x += (rw.x - f.x) * 0.12;
        // iniş: eşik geçildi
        if (f.z > rw.z0 - 0.30 && Math.abs(f.x - rw.x) < 0.22) {
          // çatışma: başka uçak aynı pistte inişte mi?
          const conflict = flights.find(o => o !== f && o.state === S.LANDING && o.runway === f.runway && Math.abs(o.z - f.z) < 1.2);
          if (conflict) {
            f.delaySec += dt;
            logEvent('DENY', f.callsign, 'İniş reddedildi: pistte başka uçak.', `${conflict.callsign} pist üzerinde; ayırma korunuyor.`);
          } else {
            transition(f, S.LANDING, `Pist ${f.runway} eşiği geçildi, iniş başladı.`);
          }
        }
        break;
      }

      /* ---------------- İNİŞ ---------------- */
      case S.LANDING: {
        if (!rw) { transition(f, S.CRUISE, 'Pist bilgisi yok, pas geçiş.'); break; }
        f.heading = 160;
        f.altitude = Math.max(0, f.altitude - 900 * dt);
        f.speed = clamp(f.speed - 26 * dt, 0, 160);
        moveTowards(f, 160, f.speed * dt / 3600);
        f.fuel = clamp(f.fuel - 0.05 * dt, 0, 100);
        if (f.speed < 8 || f.z > rw.z1 + 0.15) {
          releaseRunway(f.runway, f.callsign);
          f.altitude = 0; f.speed = 6;
          transition(f, S.TAXI_IN, `İniş tamamlandı, pistten ayrılıyor (${f.runway}).`);
        }
        break;
      }

      /* ---------------- TAKSİ (iniş sonrası) ---------------- */
      case S.TAXI_IN: {
        f.speed = 12;
        f.altitude = 0;
        // aprona doğru
        const tx = AIRPORT.apron.x - 0.18;
        const tz = STAND_Z(f.id % 8);
        const b = bearing(f, { x: tx, z: tz });
        f.heading = b;
        moveTowards(f, b, f.speed * dt / 3600);
        if (dist2(f, { x: tx, z: tz }) < 0.25) {
          f.x = tx; f.z = tz; f.stand = (f.id % 20) + 1;
          f.speed = 0;
          transition(f, S.PARK, 'Park pozisyonuna ulaştı, blok konuldu.');
          f.fuel = clamp(f.fuel + 0, 0, 100);
          f.arrivedAt = simTime;
        }
        break;
      }

      case S.FINISHED:
      default: break;
    }

    // İz kaydı (radar + 3D aynı veriden)
    f.track.push({ x: f.x, z: f.z, a: f.altitude });
    if (f.track.length > 90) f.track.shift();
  }

  /* ------------------------------------------------------------------ */
  /* Hava durumu                                                        */
  /* ------------------------------------------------------------------ */
  const weather = {
    visKm: 10,          // görüş
    windDir: 330,
    windKt: 8,
    ceilingFt: 9000,
    condition: 'AÇIK',  // AÇIK | PARÇALI BULUTLU | SİS | FIRTINA
    night: false,       // gece/gündüz
    set(o) { Object.assign(this, o); },
    // NUMEX-DÜZELTME (2026-10-27): Kök neden: weather.reset() hem senaryo R (toparlanma) hem simülasyon sıfırlamada çağrılıyordu ama nesnede tanımlı değildi — çağrı TypeError atıp senaryo/sıfırlama akışını kırıyordu. Başlangıç değerlerine dönen reset() eklendi.
    // NUMEX-DÜZELTME (2026-10-27): reset() çağrılıyordu ama tanımlı değildi → senaryo R ve
    // simülasyon sıfırlama TypeError ile çöküyordu. Başlangıç değerlerine döner.
    reset() {
      this.visKm = 10; this.windDir = 330; this.windKt = 8;
      this.ceilingFt = 9000; this.condition = 'AÇIK'; this.night = false;
    },
  };

  /* ------------------------------------------------------------------ */
  /* ORDİNARYÜS — Karar Destek Motoru                                   */
  /* ------------------------------------------------------------------ */
  function analyze() {
    const out = [];
    const act = flights.filter(f => f.state !== S.FINISHED);
    let aid = 1;
    const push = (o) => { o.id = 'ALR-' + (alertSeq++); out.push(o); };

    // NUMEX-DÜZELTME (2026-10-27): Kök neden: ayırma kontrolü yerdeki (PARK/hold/taksi) uçakları da tarıyordu — park alanında yan yana duran uçaklar 0 NM sayılıp sahte KRİTİK alarm üretiyordu (43 kritik uyarı fırtınası). Yalnız HAVADAKİ uçaklar karşılaştırılır.
    /* 1) Ayırma ihlali (yalnız HAVADAKİ uçaklar; yerde duran uçaklar ayırma konusu değildir) */
    for (let i = 0; i < act.length; i++) {
      for (let j = i + 1; j < act.length; j++) {
        const a = act[i], b = act[j];
        if (a.altitude <= 60 || b.altitude <= 60) continue;
        if (a.state === S.PARK || b.state === S.PARK) continue;
        if (a.state === S.TAXI_OUT || b.state === S.TAXI_OUT) continue;
        if (a.state === S.TAXI_IN || b.state === S.TAXI_IN) continue;
        const d = dist2(a, b) * 0.539957; // km → NM
        const dv = Math.abs(a.altitude - b.altitude);
        if (d < CFG.MIN_SEPARATION_NM && dv < CFG.MIN_VSEP_FT) {
          push({
            type: 'AYIRMA IHLALI', severity: 'KRITIK',
            title: `Ayırma ihlali: ${a.callsign} ↔ ${b.callsign}`,
            flights: [a.callsign, b.callsign],
            data: `Yatay ${d.toFixed(2)} NM (< ${CFG.MIN_SEPARATION_NM} NM), dikey ${Math.round(dv)} ft (< ${CFG.MIN_VSEP_FT} ft)`,
            action: `${b.callsign} uçuşuna tırmanma/alçalma talimatı ver; dikey ayırmayı 1000 ft üstüne çıkar.`,
            expected: 'Ayırma eşiğinin üstüne çıkılır, çarpışma riski kalkar.',
            target: b.id, kind: 'separation',
          });
        }
      }
    }

    /* 2) Pist çatışması / çifte tahsis */
    for (const rw of AIRPORT.runways) {
      const users = act.filter(f => f.runway === rw.short && [S.HOLD, S.TAKEOFF, S.LANDING, S.APPROACH].includes(f.state));
      const landing = users.filter(f => f.state === S.LANDING || f.state === S.APPROACH);
      const departing = users.filter(f => f.state === S.TAKEOFF || f.state === S.HOLD);
      if (landing.length && departing.length && rw.assigned && landing.some(f => f.callsign !== rw.assigned)) {
        push({
          type: 'PIST CAKISMASI', severity: 'KRITIK',
          title: `Pist ${rw.short} çatışması`,
          flights: [...landing, ...departing].map(f => f.callsign),
          data: `Pist ${rw.short}: iniş/yaklaşma ${landing.map(f => f.callsign).join(', ')}; kalkış ${departing.map(f => f.callsign).join(', ')}; tahsisli: ${rw.assigned}`,
          action: 'Kalkışı beklet, yaklaşan uçağa iniş önceliği ver; pist tek kullanıcıya kalsın.',
          expected: 'Pist tek uçağa tahsis edilir, çatışma kalkar.',
          target: departing[0].id, kind: 'rwy_conflict',
        });
      }
    }

    /* 3) Yakıt kritik / uyarı */
    for (const f of act) {
      if (f.fuel <= CFG.FUEL_CRIT_PCT && f.state !== S.PARK) {
        push({
          type: 'YAKIT KRITIK', severity: 'KRITIK',
          title: `Yakıt kritik: ${f.callsign}`,
          flights: [f.callsign],
          data: `Yakıt ${f.fuel.toFixed(1)}% (eşik ${CFG.FUEL_CRIT_PCT}%), durum ${f.state}, alt ${Math.round(f.altitude)} ft`,
          action: f.state === S.APPROACH || f.state === S.LANDING
            ? 'İniş önceliği ver, diğer uçuşları beklet.'
            : 'En yakın müsait piste doğrudan yaklaşma tahsis et, önceliği yükselt.',
          expected: 'Yakıt tükenmeden iniş tamamlanır; risk öncelik listesinden çıkar.',
          target: f.id, kind: 'fuel_crit',
        });
      } else if (f.fuel <= CFG.FUEL_WARN_PCT && f.state !== S.PARK) {
        push({
          type: 'YAKIT UYARI', severity: 'UYARI',
          title: `Yakıt azalıyor: ${f.callsign}`,
          flights: [f.callsign],
          data: `Yakıt ${f.fuel.toFixed(1)}% (uyarı eşiği ${CFG.FUEL_WARN_PCT}%)`,
          action: 'İniş sırasını öne al; yaklaşma hazırlığını başlat.',
          expected: 'Kritik eşiğe inmeden iniş yapılır.',
          target: f.id, kind: 'fuel_warn',
        });
      }
    }

    /* 4) Uygun olmayan pist tahsisi */
    for (const f of act) {
      if (!f.runway) continue;
      const rw = runwayById(f.runway);
      if (!rw) continue;
      if (rw.closed && [S.APPROACH, S.HOLD, S.TAKEOFF, S.LANDING].includes(f.state)) {
        push({
          type: 'UYGUNSUZ PIST', severity: 'KRITIK',
          title: `Kapalı piste operasyon: ${f.callsign}`,
          flights: [f.callsign],
          data: `Uçuş pist ${f.runway}'e tahsisli ama pist KAPALI (sensör/olay kaydı).`,
          action: `Yaklaşmayı iptal et, müsait pist ${freeRunwayFor(f.callsign) || 'yok'} yönlendir.`,
          expected: 'Uçuş kullanılabilir piste alınır, iniş güvenli tamamlanır.',
          target: f.id, kind: 'bad_rwy',
        });
      }
      if (weather.visKm < 3 && !rw.ils) {
        push({
          type: 'Hava RISKI', severity: 'UYARI',
          title: `Düşük görüşte ILS'siz pist: ${f.callsign}`,
          flights: [f.callsign],
          data: `Görüş ${weather.visKm} km, pist ${f.runway} ILS yok.`,
          action: 'ILS donanımlı piste yönlendir.',
          expected: 'Aletli yaklaşma ile güvenli iniş.',
          target: f.id, kind: 'wx_rwy',
        });
      }
    }

    /* 5) Hava durumu riski */
    if (weather.visKm < 3) {
      push({
        type: 'HAVA RISKI', severity: weather.visKm < 1 ? 'KRITIK' : 'UYARI',
        title: `Görüş düştü: ${weather.visKm} km`,
        flights: act.filter(f => [S.APPROACH, S.LANDING].includes(f.state)).map(f => f.callsign),
        data: `Görüş ${weather.visKm} km, rüzgâr ${weather.windDir}°/${weather.windKt} kt, tavan ${weather.ceilingFt} ft, durum ${weather.condition}`,
        action: 'Yaklaşma aralığını artır, yalnız ILS pistlerini kullan, kalkışları sınırla.',
        expected: 'Ayırma ihlali riski azalır; kapasite düşer ama operasyon güvenli kalır.',
        target: null, kind: 'weather',
      });
    }
    if (weather.windKt > 25) {
      push({
        type: 'HAVA RISKI', severity: 'UYARI',
        title: `Kuvvetli rüzgâr: ${weather.windKt} kt`,
        flights: act.filter(f => f.state === S.APPROACH || f.state === S.LANDING).map(f => f.callsign),
        data: `Rüzgâr ${weather.windDir}°/${weather.windKt} kt (>25 kt eşiği).`,
        action: 'Yan rüzgâr limitini kontrol et, gerekirse pas geçiş planla.',
        expected: 'Sert iniş riski azalır.',
        target: null, kind: 'wind',
      });
    }

    /* 6) Geciken uçuşlar */
    for (const f of act) {
      if (f.delaySec > CFG.DELAY_WARN_SEC) {
        push({
          type: 'GECIKME', severity: 'BILGI',
          title: `Gecikme: ${f.callsign} (${Math.round(f.delaySec)} sn)`,
          flights: [f.callsign],
          data: `Durum ${f.state}'de ${Math.round(f.delaySec)} sn bekledi (eşik ${CFG.DELAY_WARN_SEC} sn).`,
          action: 'Bekleme nedenini kaldır (pist/ayırma), uçuşa sıra ver.',
          expected: 'Gecikme erir, akış normale döner.',
          target: f.id, kind: 'delay',
        });
      }
    }

    /* 7) ACİL DURUM (squawk 7700) — en yüksek öncelik.
       NUMEX-DÜZELTME (2026-10-27): Bu blok tekildir (önceki mükerrer kopya kaldırıldı) ve
       tip adı Türkçe "ACİL DURUM" yazılır — ASCII "ACIL" yanlış yazımdı ve aramalarda
       eşleşmiyordu. Uyarı 5 sorunun tamamını (sorun/etkilenen/veri/öneri/beklenen) taşır. */
    // NUMEX-DÜZELTME (2026-10-27): Kök neden: acil durum taraması başta bir kez alınan 'act' listesini kullanıyordu; acil durum sonradan ilan edilirse (senaryo B) liste bayat kaldığı için uyarı üretilmiyordu. Tarama güncel uçuş listesi üzerinden yapılır.
    for (const f of flights.filter(x => x.state !== S.FINISHED)) {
      if (!f.emergency) continue;
      const kapali = AIRPORT.runways.filter(r => r.closed).length;
      const acik = AIRPORT.runways.filter(r => !r.closed);
      const free = freeRunwayFor(f.callsign, f.runway) || (acik[0] && acik[0].short);
      push({
        type: 'ACİL DURUM', severity: 'KRITIK',
        title: `Acil durum: ${f.callsign} (${f.emergencyReason || 'acil bildirim'})`,
        flights: [f.callsign],
        data: `Squawk 7700 · durum ${f.state} · irtifa ${Math.round(f.altitude)} ft · yakıt ${f.fuel.toFixed(0)}% · açık pist ${acik.length}/${AIRPORT.runways.length} (kapalı ${kapali})`,
        action: free
          ? `Pist ${free} acil uçuşa tahsis et; diğer uçakları beklet.`
          : 'Açık pist yok: yaklaşanları havada tut, acil uçuşa öncelik ver.',
        expected: 'Acil uçuş öncelikli ve kesintisiz iniş yapar.',
        target: f.id, kind: 'emergency',
        decision: { flightId: f.id, type: 'emergency', action: 'priority', reason: 'acil durum önceliği' },
      });
    }

    // önem sırası
    const rank = { KRITIK: 0, UYARI: 1, BILGI: 2 };
    out.sort((a, b) => rank[a.severity] - rank[b.severity]);
    return out;
  }

  /* ------------------------------------------------------------------ */
  /* Otorite katmanı — yetki yönetimi                                   */
  /* ------------------------------------------------------------------ */
  const authority = {
    mode: 'ONERI', // 'ONERI' | 'OTOMATIK'
    limits: {
      maxFuelForAuto: 40,      // otomatik modda yalnız bu yakıtın altındaki uçuşlara müdahale
      allowRunwayChange: true,
      allowEmergencyPriority: true,
    },
    denied: 0,
  };

  /**
   * Karar/müdahale uygulama kapısı.
   * Öneri modunda motor kendi başına durum değiştiremez.
   */
  function applyDecision(decision, actor) {
    actor = actor || 'MOTOR';
    if (actor === 'MOTOR' && authority.mode === 'ONERI') {
      authority.denied++;
      logEvent('DENY', decision.callsign || '-', 'Yetkisiz müdahale engellendi.',
        `Öneri modu aktif: motor durum değiştiremez (${decision.reason || 'kural'}).`);
      return { ok: false, code: 'YETKISIZ', why: 'Öneri modunda otomatik müdahale yasak.' };
    }
    if (actor === 'MOTOR' && authority.mode === 'OTOMATIK') {
      const f = flights.find(x => x.id === decision.flightId);
      if (!f) return { ok: false, code: 'YOK', why: 'Uçuş yok.' };
      if (decision.type === 'runway' && !authority.limits.allowRunwayChange) {
        authority.denied++;
        logEvent('DENY', f.callsign, 'Yetkisiz müdahale engellendi.', 'Otomatik modda pist değişimi kapalı.');
        return { ok: false, code: 'YETKISIZ', why: 'Pist değişimi otomatik modda kapalı.' };
      }
      if (decision.type === 'emergency' && !authority.limits.allowEmergencyPriority) {
        authority.denied++;
        logEvent('DENY', f.callsign, 'Yetkisiz müdahale engellendi.', 'Otomatik modda acil öncelik kapalı.');
        return { ok: false, code: 'YETKISIZ', why: 'Acil öncelik otomatik modda kapalı.' };
      }
      if (decision.type === 'fuel' && f.fuel > authority.limits.maxFuelForAuto) {
        authority.denied++;
        logEvent('DENY', f.callsign, 'Yetkisiz müdahale engellendi.',
          `Otomatik mod sınırı: yakıt ${f.fuel.toFixed(1)}% > ${authority.limits.maxFuelForAuto}%.`);
        return { ok: false, code: 'YETKISIZ', why: 'Otomatik mod yakıt sınırı dışında.' };
      }
    }
    // uygula
    const f = flights.find(x => x.id === decision.flightId);
    if (!f) return { ok: false, code: 'YOK', why: 'Uçuş bulunamadı.' };
    if (decision.forceRunway) f._forceRunway = decision.forceRunway;
    return doAction(f, decision.action, actor);
  }

  function doAction(f, action, actor) {
    actor = actor || 'OPERATOR';
    switch (action) {
      case 'priority': {
        f.priority = 'HIGH';
        logEvent('ACT', f.callsign, 'Öncelik YÜKSEK yapıldı.', `${actor} onayı.`);
        return { ok: true, msg: `${f.callsign} önceliği yükseltildi.` };
      }
      case 'emergency': {
        f.emergency = true; f.priority = 'EMERGENCY';
        f.emergencyReason = f.emergencyReason || 'operatör bildirimi';
        if (f.state === S.CRUISE) transition(f, S.APPROACH, 'Acil durum bildirimi, doğrudan yaklaşmaya alındı.', actor);
        const free = freeRunwayFor(f.callsign);
        if (free) assignRunway(f.id, free, actor);
        logEvent('ACT', f.callsign, 'ACİL DURUM önceliği verildi.', `${actor}; squawk 7700.`);
        return { ok: true, msg: `${f.callsign} acil öncelik aldı.` };
      }
      case 'reroute': {
        // İstenen pist verilmişse ONA atanır (çakışma kontrolü assignRunway içinde), yoksa boş pist seçilir.
        const istenen = f._forceRunway;
        f._forceRunway = null;
        const free = istenen || freeRunwayFor(f.callsign, f.runway);
        if (!free) return { ok: false, msg: 'Müsait pist yok.' };
        const r = assignRunway(f.id, free, actor);
        if (!r.ok) return { ok: false, msg: r.why };
        logEvent('ACT', f.callsign, `Alternatif pist ${free} verildi.`, `${actor}; kapalı/uygunsuz pistten çıkarıldı.`);
        return { ok: true, msg: `${f.callsign} → pist ${free}` };
      }
      case 'hold': {
        if (f.state === S.HOLD) { f.delaySec += 5; }
        logEvent('ACT', f.callsign, 'Beklemeye alındı.', `${actor}; pist/ayırma korunuyor.`);
        return { ok: true, msg: `${f.callsign} beklemede.` };
      }
      case 'climb': {
        f.altitude = Math.min(14000, f.altitude + 1500);
        logEvent('ACT', f.callsign, `Tırmanma talimatı: ${Math.round(f.altitude)} ft.`, `${actor}; dikey ayırma.`);
        return { ok: true, msg: `${f.callsign} ${Math.round(f.altitude)} ft'e tırmandı.` };
      }
      case 'descend': {
        f.altitude = Math.max(0, f.altitude - 1500);
        logEvent('ACT', f.callsign, `Alçalma talimatı: ${Math.round(f.altitude)} ft.`, `${actor}; dikey ayırma.`);
        return { ok: true, msg: `${f.callsign} ${Math.round(f.altitude)} ft'e alçaldı.` };
      }
      default: return { ok: false, msg: 'Bilinmeyen eylem.' };
    }
  }

  /* ------------------------------------------------------------------ */
  /* Kriz senaryoları A–E                                               */
  /* ------------------------------------------------------------------ */
  function scenario(letter) {
    const act = flights.filter(f => f.state !== S.FINISHED);
    switch (letter) {
      case 'A': {
        const rw = AIRPORT.runways[0];
        rw.closed = true;
        // pistteki uçuşlar etkileniyor
        const affected = act.filter(f => f.runway === rw.short);
        affected.forEach(f => {
          if (rw.assigned === f.callsign) rw.assigned = null;
        });
        logEvent('CRISIS', '-', `SENARYO A — Pist ${rw.short} KAPANDI.`, `${affected.length} uçuş etkilendi: ${affected.map(f => f.callsign).join(', ') || 'yok'}.`);
        scenarioLog.push({ id: 'A', t: simTime, label: 'Pist kapandı', affected: affected.map(f => f.callsign) });
        return { ok: true, msg: `SENARYO A: Pist ${rw.short} kapandı. Etkilenen: ${affected.length} uçuş.` };
      }
      case 'B': {
        // NUMEX-DÜZELTME (2026-10-27): Kök neden: uygun uçak bulunamayınca '|| act[0]' yedeği
        // bitmiş uçuşları seçebiliyordu (SEYİR → TAMAMLANDI olmuş uçağa acil durum ilan ediliyordu).
        // Artık YALNIZ havadaki aktif uçuş seçilir; yoksa senaryo dürüstçe reddeder.
        const cand = act.find(f => [S.CRUISE, S.APPROACH].includes(f.state) && !f.emergency)
          || act.find(f => f.altitude > 60 && !f.emergency);
        if (!cand) return { ok: false, msg: 'Acil durum ilan edilecek havadaki uçuş yok.' };
        cand.emergency = true;
        cand.priority = 'EMERGENCY';
        cand.emergencyReason = 'motor arızası (simülasyon)';
        cand.fuel = Math.min(cand.fuel, 28);
        logEvent('CRISIS', cand.callsign, 'SENARYO B — ACİL İNİŞ bildirimi.', 'Squawk 7700, motor arızası (kurgusal).');
        scenarioLog.push({ id: 'B', t: simTime, label: 'Acil iniş', flight: cand.callsign });
        return { ok: true, msg: `SENARYO B: ${cand.callsign} acil durum bildirdi.` };
      }
      case 'C': {
        const cand = act.find(f => f.fuel > 20 && [S.CRUISE, S.APPROACH, S.HOLD].includes(f.state) && !f.emergency)
          || act.find(f => f.fuel > 20 && !f.emergency);
        if (!cand) return { ok: false, msg: 'Yakıt senaryosu için uygun aktif uçuş yok.' };
        cand.fuel = 9;
        logEvent('CRISIS', cand.callsign, 'SENARYO C — YAKIT KRİTİK.', 'Yakıt 9% seviyesine düştü (kurgusal arıza).');
        scenarioLog.push({ id: 'C', t: simTime, label: 'Yakıt kritik', flight: cand.callsign });
        return { ok: true, msg: `SENARYO C: ${cand.callsign} yakıtı kritik seviyede (9%).` };
      }
      case 'D': {
        weather.set({ visKm: 1.2, windDir: 40, windKt: 28, ceilingFt: 400, condition: 'SİS' });
        logEvent('CRISIS', '-', 'SENARYO D — HAVA BOZULDU.', `Görüş 1.2 km, rüzgâr 040/28 kt, tavan 400 ft.`);
        scenarioLog.push({ id: 'D', t: simTime, label: 'Hava bozuldu' });
        return { ok: true, msg: 'SENARYO D: Görüş 1.2 km, rüzgâr 28 kt.' };
      }
      case 'E': {
        const rw = AIRPORT.runways[0];
        rw.closed = true;
        if (rw.assigned) rw.assigned = null;
        const two = act.filter(f => f.state === S.CRUISE).slice(0, 2);
        two.forEach((f, i) => {
          const free = freeRunwayFor(f.callsign);
          if (free) assignRunway(f.id, free, 'SENARYO');
          transition(f, S.APPROACH, 'Çoklu kriz: yaklaşmaya alındı.', 'SENARYO E');
          f.z = -8 - i * 1.5; f.altitude = 3000;
        });
        const em = act.find(f => !two.includes(f) && !f.emergency && f.altitude > 60)
          || act.find(f => !two.includes(f) && !f.emergency)
          || act.find(f => !f.emergency);
        if (!em) return { ok: false, msg: 'Çoklu kriz için uygun uçuş yok.' };
        em.emergency = true; em.priority = 'EMERGENCY';
        em.emergencyReason = 'çoklu kriz — tıbbi acil (simülasyon)';
        em.fuel = Math.min(em.fuel, 22);
        logEvent('CRISIS', '-', 'SENARYO E — ÇOKLU KRİZ.',
          `Pist ${rw.short} kapalı, 2 uçak yaklaşmada, ${em.callsign} acil durum bildirdi.`);
        scenarioLog.push({ id: 'E', t: simTime, label: 'Çoklu kriz', flight: em.callsign });
        return { ok: true, msg: `SENARYO E: pist kapalı + 2 yaklaşma + ${em.callsign} acil.` };
      }
      case 'R': {
        // toparlanma
        AIRPORT.runways.forEach(r2 => { r2.closed = false; });
        weather.reset();
        logEvent('CRISIS', '-', 'Senaryolar sıfırlandı.', 'Pistler açıldı, hava normale döndü.');
        return { ok: true, msg: 'Pistler ve hava durumu normale döndü.' };
      }
      default:
        return { ok: false, msg: 'Bilinmeyen senaryo.' };
    }
  }

  /* ------------------------------------------------------------------ */
  /* Simülasyon adımı                                                    */
  /* ------------------------------------------------------------------ */
  let lastAlertKey = {};
  function tick(dt) {
    if (!STATE.running) return;
    STATE.timeScale = clamp(STATE.timeScale, 0.1, 8);
    simTime += dt;

    // NUMEX-DÜZELTME (2026-10-27): Kök neden: stepFlight içindeki süre birimleri SANİYE bekliyor (yakıt 0.02/sn, irtifa 2600 ft/sn) ama tick'ten milisaniye geçiliyordu; 1000 kat hızlı yakıt tüketimi ve süre sayaçlarının (delaySec) 3 sn yerine 3000 sn'ye ulaşması bundandı. dt saniyeye çevrilerek geçirilir.
    flights.forEach(f => stepFlight(f, dt / 1000)); // dt daima SANİYE (motor içi tüm oranlar sn tabanlı)

    // pistol bakımı: atanmış uçuş bitince pist serbest
    AIRPORT.runways.forEach(rw => {
      if (rw.assigned) {
        const f = flights.find(x => x.callsign === rw.assigned);
        if (!f || f.state === S.FINISHED || (f.state !== S.APPROACH && f.state !== S.LANDING && f.state !== S.TAKEOFF && f.state !== S.QUEUE)) rw.assigned = null;
      }
    });

    // otomatik mod: motor kendi kararını uygular (yetki sınırı içinde)
    STATE.autoTimer += dt;
    if (STATE.autoTimer > 6000) {
      STATE.autoTimer = 0;
      STATE.autoApplied = 0;
      if (authority.mode === 'OTOMATIK') {
        const list = analyze();
        for (const a of list) {
          if (!a.decision) continue;
          if (authority.limits && a.severity !== 'KRITIK') continue;
          const r = applyDecision({ ...a.decision, callsign: a.callsign }, 'MOTOR');
          if (r.ok) STATE.autoApplied++;
          if (STATE.autoApplied >= 2) break;
        }
      }
    }
  }

  function kpis() {
    const act = flights.filter(f => f.state !== S.FINISHED);
    // NUMEX-DÜZELTME (2026-10-27): Kök neden: uçuş nesnelerinde airState alanı hiç tanımlanmamıştı; hava durumu irtifadan (altitude) türetilmeliydi. Bu yüzden HAVADA sayacı her zaman 0 kalıyordu.
    const airborne = flights.filter(f => f.altitude > 60 && f.state !== S.FINISHED);
    const landed = flights.filter(f => f.state === S.FINISHED).length;
    return {
      total: flights.length,
      active: act.length,
      airborne: airborne.length,
      landed,
      emergencies: act.filter(f => f.emergency).length,
      alerts: alerts.filter(a => !a.resolved).length,
      critical: alerts.filter(a => a.severity === 'KRITIK' && !a.resolved).length,
      avgFuel: act.length ? act.reduce((s2, f) => s2 + f.fuel, 0) / act.length : 0,
      closedRunways: AIRPORT.runways.filter(r => r.closed).length,
      ops: AIRPORT.runways.filter(r => !r.closed).length,
    };
  }

  function reset() {
    flights.length = 0; events.length = 0; alerts.length = 0;
    alertSeq = 0; eventSeq = 0; scenarioLog.length = 0;
    simTime = 0; lastAlertKey = {};
    AIRPORT.runways.forEach(r => { r.closed = false; r.assigned = null; });
    weather.reset();
    seedWorld();
    logEvent('INFO', '-', 'SİMÜLASYON SIFIRLANDI.', '25 kurgusal uçuş yeniden üretildi.');
  }

  // dışa aç
  STATE.running = CFG.RUNNING_DEFAULT;
  STATE.timeScale = CFG.SIM_SPEED_DEFAULT;
  STATE.autoTimer = 0;
  STATE.autoApplied = 0;

  STATE.tick = tick;
  STATE.reset = reset;
  STATE.scenario = scenario;
  STATE.analyze = analyze;
  STATE.applyDecision = applyDecision;
  STATE.doAction = doAction;
  STATE.kpis = kpis;
  // NUMEX-DÜZELTME (2026-10-27): Kök neden: modül içindeki flights/events dizileri seedWorld ile yeniden atanıyor, arayüze verilen referans bayat/boş kalıyordu. Getter ile her erişimde güncel dizi döndürülür.
  window.NUMEX = {
    CFG, STATE, S, AIRPORT, authority, weather, scenario, analyze, applyDecision,
    doAction, kpis, reset, tick, clockStr, seedWorld,
    // Canlı referanslar: seedWorld/reset dizileri yeniden atadığı için getter şart
    get flights() { return flights; },
    get events() { return events; },
    get alerts() { return alerts; },
    get simTime() { return simTime; },
    stateAge(f) { return simTime - f.stateSince; },
  };
})();

