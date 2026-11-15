/* Numex Core — Analiz Motoru
   Kural: en çok görünen hata kök neden değildir. Kök neden = en ERKEN anomali +
   nedensel olarak AŞAĞIDA duran servis (kendisi başkasına bağımlı olmayan) + yayılan etki.
   Motor kayıtları alır; üreticinin cevap anahtarını GÖRMEZ. */
(function (global) {
  'use strict';

  const ESIK = { anomaliHiz: 3 }; // dakikada bu kadar HATA → anomali başlangıcı

  function norm(s) { return String(s == null ? '' : s).trim(); }
  function escServis(s) { return String(s == null ? '' : s); }
  function ts(x) {
    if (typeof x === 'number') return x;
    const n = Date.parse(x);
    return isNaN(n) ? null : n;
  }

  // --- CSV / JSON içe aktarma ---
  function csvAyikla(metin) {
    const satirlar = [];
    let alan = '', satir = [], tirnak = false;
    for (let i = 0; i < metin.length; i++) {
      const c = metin[i];
      if (tirnak) {
        if (c === '"' && metin[i + 1] === '"') { alan += '"'; i++; }
        else if (c === '"') tirnak = false;
        else alan += c;
      } else if (c === '"') tirnak = true;
      else if (c === ',' || c === ';') { satir.push(alan); alan = ''; }
      else if (c === '\n') { satir.push(alan); satirlar.push(satir); satir = []; alan = ''; }
      else if (c !== '\r') alan += c;
    }
    if (alan !== '' || satir.length) { satir.push(alan); satirlar.push(satir); }
    return satirlar.filter(s => s.some(v => norm(v) !== ''));
  }

  function kayitNormalize(o) {
    return {
      id: norm(o.id || o.eventId || o.olay || ''),
      ts: ts(o.ts || o.timestamp || o.zaman || o.time),
      servis: norm(o.servis || o.service || o.source || o.kaynak || 'bilinmeyen'),
      seviye: norm(o.seviye || o.level || '').toUpperCase(),
      kod: norm(o.kod || o.code || o.errorCode || o.hata || ''),
      mesaj: norm(o.mesaj || o.message || o.msg || ''),
      istekId: norm(o.istekId || o.requestId || o.traceId || o.correlationId || '') || null,
      sureMs: o.sureMs != null && o.sureMs !== '' ? Number(o.sureMs) || 0 : (o.durationMs != null ? Number(o.durationMs) || 0 : null),
      dugum: norm(o.dugum || o.node || '')
    };
  }

  function iceAktar(metin) {
    const temiz = norm(metin);
    if (!temiz) return { kayitlar: [], hatali: 0, toplam: 0 };
    let ham = [];
    if (temiz[0] === '{' || temiz[0] === '[') {
      const j = JSON.parse(temiz);
      ham = Array.isArray(j) ? j : (Array.isArray(j.kayitlar) ? j.kayitlar : Array.isArray(j.records) ? j.records : [j]);
    } else {
      const rows = csvAyikla(temiz);
      const bas = rows.shift() || [];
      const baslik = bas.map(h => norm(h).toLowerCase());
      ham = rows.map(r => {
        const o = {};
        baslik.forEach((h, i) => { o[h] = r[i]; });
        return o;
      });
    }
    let hatali = 0;
    const kayitlar = [];
    ham.forEach(o => {
      if (!o || typeof o !== 'object' || Array.isArray(o)) { hatali++; return; }
      const k = kayitNormalize(o);
      if (k.ts == null) { hatali++; return; }   // zaman damgası yoksa analize alınmaz
      kayitlar.push(k);
    });
    return { kayitlar: kayitlar, hatali: hatali, toplam: ham.length };
  }

  // --- Yardımcı istatistik ---
  function dakikaAnahtari(ms) { return Math.floor(ms / 60000) * 60000; }
  function sayi(v) { const n = Number(v); return isFinite(n) ? n : 0; }

  function analizEt(kayitlar) {
    // savunmalı temizlik: bozuk kayıt analizi çökertmesin
    // NUMEX-DÜZELTME (2026-11-14): Üreteç ve içe aktarma ISO tarih metni veriyor; savunma filtresi yalnız number kabul ettiği için neredeyse tüm kayıtlar eleniyordu. ts artık metin de olabilir, sayıya çevriliyor.
    const K = (kayitlar || []).filter(k => k && k.servis != null && ts(k.ts) != null)
      // NUMEX-DÜZELTME (2026-11-14): "ts ISO metin olarak kalıyordu; rapor ve grafiklerde tarih boş çıkıyordu" — artık her kayıtta ts sayı
      .map(k => Object.assign({}, k, { ts: ts(k.ts) }))
      .sort((a, b) => a.ts - b.ts || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
    const sonuc = {
      toplam: K.length,
      servisler: [],
      zamanCizelgesi: [],
      hataYogunlugu: [],
      saglik: [],
      ilkAnomali: null,
      supheliler: [],
      adaylar: [],
      ag: { dugumler: [], kenarlar: [] },
      zincir: [],
      istatistik: {}
    };
    if (!K.length) return sonuc;

    const servisSet = {};
    K.forEach(k => { (servisSet[k.servis] = servisSet[k.servis] || []).push(k); });
    const servisler = Object.keys(servisSet);

    // 1) Servis başına dakikalık hata hızı ve anomali başlangıcı
    const servisDakika = {};
    servisler.forEach(s => {
      servisDakika[s] = {};
      servisSet[s].forEach(k => {
        const d = dakikaAnahtari(k.ts);
        servisDakika[s][d] = servisDakika[s][d] || { hata: 0, uyari: 0, toplam: 0, sureToplam: 0, sureAdet: 0, sureler: [] };
        servisDakika[s][d].toplam++;
        if (typeof k.sureMs === 'number' && k.sureMs > 0) { servisDakika[s][d].sureToplam += k.sureMs; servisDakika[s][d].sureAdet++; servisDakika[s][d].sureler.push(k.sureMs); }
        if (k.seviye === 'ERROR') servisDakika[s][d].hata++;
        else if (k.seviye === 'WARN') servisDakika[s][d].uyari++;
      });
    });

    // Taban çizgisi: pencere başının ilk %15'lik diliminde (arıza henüz başlamamışken) o servisin dakikalık HATA hızı.
    // Böylece gürültü servislerinin her zaman süregelen ilgisiz hataları "anomali" sayılmaz.
    const pencereBas = K[0].ts;
    const tabanHiz = (s) => {
      const esik = pencereBas + Math.max(60000, (K[K.length - 1].ts - pencereBas) * 0.12);
      let hata = 0;
      servisSet[s].forEach(k => { if (k.ts <= esik && k.seviye === 'ERROR') hata++; });
      const dkSayisi = Math.max(1, Math.round((esik - pencereBas) / 60000));
      return hata / dkSayisi;
    };

    // 2) Her servisin anomali başlangıcı (taban hızının belirgin üstüne çıktığı ilk dakika)
    const servisBilgi = servisler.map(s => {
      const ds = Object.keys(servisDakika[s]).map(Number).sort((a, b) => a - b);
      const taban = tabanHiz(s);
      // NUMEX-DÜZELTME (2026-11-14): Kök neden: hata-hızı sıçraması tek başına kullanılıyordu; gürültü servislerinin (ör. 09:13'te 14 hata) tek dakikalık dalgalanması, sürekli yüksek gecikmeli gerçek arızadan (db-pool 09:10'dan itibaren medyan 3000ms) önce sayılıyordu.
      // Düzeltme: anomali = gecikmenin KALICI sıçraması (3 dakika üst üste ≥1.5×) VE hata sıçraması aynı noktada.
      let baslangic = null;
      const dakikaSure = (d) => (servisDakika[s][d] && servisDakika[s][d].sureAdet ? servisDakika[s][d].sureToplam / servisDakika[s][d].sureAdet : null);
      const servisSureGenel = (() => {
        let t = 0, n = 0;
        servisSet[s].forEach(k => { if (typeof k.sureMs === 'number' && k.sureMs > 0) { t += k.sureMs; n++; } });
        return n ? t / n : null;
      })();
      const medyan = (arr) => { if (!arr || !arr.length) return null; const x = arr.slice().sort((a, b) => a - b); return x[Math.floor(x.length / 2)]; };
      const gecikmeMedyan = (d) => medyan((servisDakika[s][d] || {}).sureler);
      // Referans: pencere başında (arıza öncesi) servisin tipik hata yoğunluğu ve tipik yanıt süresi.
      const referansNoktasi = ds.length ? ds[Math.floor(ds.length * 0.1)] : null;
      let refHata = 0, refSayi = 0;
      ds.forEach(d => { if (d <= referansNoktasi) { refHata += servisDakika[s][d].hata; refSayi++; } });
      const refYoğunluk = refSayi ? refHata / refSayi : taban;
      let refSureler = [];
      ds.forEach(d => { if (d <= referansNoktasi) refSureler = refSureler.concat(servisDakika[s][d].sureler); });
      const refSure = medyan(refSureler) || servisSureGenel;

      const gecikmeYuksek = (d) => { const m = gecikmeMedyan(d); return refSure != null && m != null && m >= refSure * 1.5; };
      const hataVar = (d) => { const h = servisDakika[s][d]; return h && h.hata >= 1; };
      for (const d of ds) {
        // kalıcı gecikme: bu dakika ve sonraki iki dakika üst üste yüksek gecikmeli
        const kaliciGecikme = gecikmeYuksek(d) && gecikmeYuksek(d + 60000) && gecikmeYuksek(d + 120000);
        // bir önceki dakika normal olmalı: arızanın BAŞLANGICI aranıyor, süregelen durum değil
        const oncekiNormal = !gecikmeYuksek(d - 60000);
        if (kaliciGecikme && oncekiNormal && hataVar(d)) { baslangic = d; break; }
      }
      // Gecikme kanıtı yoksa: çok belirgin ve en az 3 dakika süren hata sıçraması
      if (baslangic == null) {
        for (const d of ds) {
          const h = servisDakika[s][d];
          // gecikme kanıtı yok → yalnız ÇOK belirgin, 4 dakika süren ve referansın en az 5 katı hata sıçraması
          const s1 = servisDakika[s][d + 60000], s2 = servisDakika[s][d + 120000], s3 = servisDakika[s][d + 180000];
          const sureli = [s1, s2, s3].filter(x => x && x.hata >= Math.max(2, refYoğunluk * 2)).length;
          if (h && h.hata >= Math.max(8, refYoğunluk * 5 + 5) && sureli >= 3) { baslangic = d; break; }
        }
      }
      // Hiçbir servis gerçek sıçrama göstermediyse: gürültüyü kök neden ilan etmek yerine
      // "ilk anomali yok" demek dürüst sonuçtur (kanıt yetersiz).
      // NUMEX-DÜZELTME (2026-11-14): Kök neden: `hata` değişkeni kendi tanımından önce (satır 133) kullanılıyordu, TDZ hatası analiz motorunu tamamen çökertiyordu. Tanım yukarı alındı, geç başlangıç ataması da mevcut değişken adlarıyla ve null güvenli yazıldı.
      const toplam = servisSet[s].length;
      const hata = servisSet[s].filter(k => k.seviye === 'ERROR').length;
      const uyari = servisSet[s].filter(k => k.seviye === 'WARN').length;
      // Gecikme ve hız sıçraması yoksa: yalnız SUSTÜRÜLÜSK HATA varsa kesin tarih verme, 'anomali yok' kabul et.
      // Gürültü servisini (ör. her gün süren indeks gecikmesi) kök neden ilan etmemek için bilinçli tercih.
      const sureler = servisSet[s].map(k => k.sureMs).filter(v => typeof v === 'number' && v > 0);
      const ortSure = sureler.length ? Math.round(sureler.reduce((a, b) => a + b, 0) / sureler.length) : null;
      // etki penceresindeki hata artışı (başlangıç ms cinsinden olabilir)
      let artis = 0;
      if (baslangic != null) {
        const basDak = dakikaAnahtari(baslangic);
        ds.forEach(d => { if (d >= basDak) artis += servisDakika[s][d].hata; });
      }
      const servisHata = servisSet[s].filter(k => k.seviye === 'ERROR').length;
      const dakikaSayisi = servisSet[s].length ? Math.max(1, Math.round((servisSet[s][servisSet[s].length - 1].ts - servisSet[s][0].ts) / 60000)) : 1;
      const tabanHata = Math.round(taban * dakikaSayisi);
      const tabanSonrasi = Math.max(0, servisHata - tabanHata);
      return { servis: s, tabanHiz: taban, baslangic: baslangic, toplam: toplam, hata: hata, uyari: uyari, ortSureMs: ortSure, artis: artis };
    }).sort((a, b) => (a.baslangic == null ? Infinity : a.baslangic) - (b.baslangic == null ? Infinity : b.baslangic) || b.hata - a.hata);

    sonuc.servisler = servisBilgi;

    // 3) İlk anomali: en erken başlayan servis + o servisin ilk ERROR kaydı
    const ilkS = servisBilgi.find(s => s.baslangic != null);
    if (ilkS) {
      const esik = ilkS.baslangic;
      // servis içinde o dakikadaki ilk kritik kayıt
      const servisKayit = servisSet[ilkS.servis];
      const esikDak = dakikaAnahtari(esik);
      const aday = servisKayit.find(k => k.seviye === 'ERROR' && dakikaAnahtari(k.ts) >= esikDak)
        || servisKayit.find(k => k.seviye === 'ERROR')
        || servisKayit.find(k => dakikaAnahtari(k.ts) >= esikDak) || servisKayit[0];
      sonuc.ilkAnomali = {
        servis: ilkS.servis,
        zaman: aday.ts,
        kayitId: aday.id,
        kod: aday.kod,
        mesaj: aday.mesaj,
        neden: ilkS.servis + ' servisinde hata hızı dakikada ' + ilkS.tabanHiz + ' tabanından itibaren sıçradı; bu servisin anomalisi diğer servislerden ' +
          Math.round((servisBilgi.filter(x => x.baslangic != null && x.baslangic > esik).reduce((m, x) => m + (x.baslangic - esik), 0) / Math.max(1, servisBilgi.filter(x => x.baslangic != null && x.baslangic > esik).length || 1)) / 60000) + ' dakika önce'
      };
    }

    // 4) istek kimliği paylaşımı → servis ilişki grafiği
    const istekGruplari = {};
    K.forEach(k => { if (k.istekId) (istekGruplari[k.istekId] = istekGruplari[k.istekId] || []).push(k); });
    const kenarMap = {};
    Object.keys(istekGruplari).forEach(rid => {
      const g = istekGruplari[rid];
      const servisSirali = [];
      g.slice().sort((a, b) => a.ts - b.ts).forEach(k => { if (servisSirali[servisSirali.length - 1] !== k.servis) servisSirali.push(k.servis); });
      for (let i = 0; i < servisSirali.length - 1; i++) {
        const a = servisSirali[i], b = servisSirali[i + 1];
        if (a === b) continue;
        const anahtar = a + '→' + b;
        kenarMap[anahtar] = kenarMap[anahtar] || { kaynak: a, hedef: b, adet: 0, istekler: [] };
        kenarMap[anahtar].adet++;
        if (kenarMap[anahtar].istekler.length < 5) kenarMap[anahtar].istekler.push(rid);
      }
    });
    const kenarlar = Object.keys(kenarMap).map(k => kenarMap[k]).filter(e => e.adet >= 3).sort((a, b) => b.adet - a.adet).slice(0, 24);
    sonuc.ag = { dugumler: servisler, kenarlar: kenarlar };

    const hedefMap = {}; // servis -> kendisine gelen bağımlılık (yukarı akış)
    const kaynakMap = {};
    kenarlar.forEach(e => {
      hedefMap[e.hedef] = (hedefMap[e.hedef] || 0) + e.adet;
      kaynakMap[e.kaynak] = (kaynakMap[e.kaynak] || 0) + e.adet;
    });
    sonuc.istatistik.bagimliSayisi = hedefMap;
    sonuc.istatistik.besleyenSayisi = kaynakMap;

    // 5) Tekrarlayan hata örüntüleri
    const oruntuler = {};
    K.forEach(k => { if (k.seviye === 'ERROR' || k.seviye === 'WARN') { const key = k.servis + '|' + k.kod; oruntuler[key] = oruntuler[key] || { servis: k.servis, kod: k.kod, adet: 0, ilk: k.ts, son: k.ts, mesaj: k.mesaj, kayitId: k.id }; const o = oruntuler[key]; o.adet++; if (k.ts < o.ilk) o.ilk = k.ts; if (k.ts > o.son) o.son = k.ts; } });
    sonuc.oruntuler = Object.values(oruntuler).sort((a, b) => b.adet - a.adet);

    // 6) Kök neden adayları: erken başlangıç + düşük bağımlılık (başka servise bağımlı değil) + yüksek etki
    const adaylar = servisBilgi.filter(s => s.baslangic != null).map(s => {
      const erkenlik = sonuc.ilkAnomali ? Math.max(0, (dakikaAnahtari(s.baslangic) - dakikaAnahtari(sonuc.ilkAnomali.zaman)) / 60000) : 0;
      const besleyen = kaynakMap[s.servis] || 0;      // bu servisten çıkan etki
      const bagimli = hedefMap[s.servis] || 0;        // bu servise gelen bağımlılık (üst katman)
      // NUMEX-DÜZELTME (2026-11-14): erken olmak tek başına yeterli değil; etki yoğunluğu ve ilişki ağındaki konum daha çok ağırlık taşımalı, yoksa gürültü servisi başta olduğu için birinci çıkıyordu.
      const erkenPuan = Math.max(0, 22 - erkenlik * 3);
      const yayilimPuan = (besleyen > 0 ? Math.min(10, besleyen / 3) : 0);
      const etkiPuan = Math.min(30, Math.round(s.artis / 6));
      const kokPuan = Math.min(20, Math.round((Number(s.hata) || 0) / 3));
      // İlişki ağında kendisine bağımlı olan servis sayısı kadar puân; kendisi bağımlıysa (üst katman) düşer
      const enAltPuan = besleyen > bagimli ? 14 : (besleyen > 0 ? 9 : 4);
      const skor = Math.max(0, Math.min(100, erkenPuan + yayilimPuan + etkiPuan + kokPuan + enAltPuan));
      const gerekce = [];
      // NUMEX-DÜZELTME (2026-11-14): "diğerlerinden önce bozuldu" ifadesi sıralamaya göre kendiliğinden yazılıyordu; artık gerçek zaman karşılaştırmasıyla (aradaki dakika farkı) ve sonuç servisine göre yazılıyor.
      const sirasi = sonuc.ilkAnomali ? (dakikaAnahtari(s.baslangic) === dakikaAnahtari(sonuc.ilkAnomali.zaman) ? 0 : 1) : 0;
      const farkDk = sonuc.ilkAnomali ? Math.round((dakikaAnahtari(s.baslangic) - dakikaAnahtari(sonuc.ilkAnomali.zaman)) / 60000) : 0;
      const ayni = sonuc.ilkAnomali && dakikaAnahtari(s.baslangic) === dakikaAnahtari(sonuc.ilkAnomali.zaman);
      gerekce.push(ayni ? 'İlk anomali servisiyle aynı dakikada bozuldu; ilişki ağında ondan beslendiği için sonuç konumunda' : (farkDk > 0
        ? 'Bozulma ' + farkDk + ' dk sonra başladı (ilk anomali: ' + escServis(sonuc.ilkAnomali.servis) + ') → neden değil, sonuç olma ihtimali yüksek'
        : 'İlk anomali servisiyle aynı anda görünür oldu'));
      gerekce.push('Etki penceresinde ' + s.artis + ' hata kaydı birikti (' + s.hata + ' toplam hata)');
      if (besleyen > bagimli) gerekce.push('ilişki ağında etkisi yukarı akışa yayılıyor (' + besleyen + ' zincir bağlantısı)');
      else if (bagimli > 0) gerekce.push('başka servislerin ona bağımlı olduğu görülüyor (' + bagimli + ')');
      return { servis: s.servis, skor: skor, baslangic: typeof s.baslangic === 'number' ? s.baslangic : null, hata: s.hata, artis: s.hata, gerekce: gerekce, oruntuler: sonuc.oruntuler.filter(o => o.servis === s.servis && o.adet > 1).slice(0, 3) };
    }).sort((a, b) => b.skor - a.skor);
    // NUMEX-DÜZELTME (2026-11-14): puanlamada bir alan tanımsız kalırsa skor NaN'a dönüşüp sıralamayı bozuyordu; her skor sayıya sabitleniyor.
    adaylar.forEach(a => { a.skor = Math.round(sayi(a.skor)); a.hata = sayi(a.hata); a.artis = sayi(a.artis); });
    sonuc.adaylar = adaylar;

    // 7) Şüpheli olaylar: ilk anomali servisin ilk kayıtları + sıra dışı kod (tekrar eden ilgisiz düşük sayılılar dışında)
    const supheli = [];
    if (sonuc.ilkAnomali) {
      const ilkServis = sonuc.ilkAnomali.servis;
      const z = sonuc.ilkAnomali.zaman;
      supheli.push({ tip: 'İLK ANOMALİ', kayit: servisSet[ilkServis].find(k => k.ts === z) || servisSet[ilkServis][0], aciklama: 'Sistemde zaman çizelgesinde ilk kez bozulan servis kaydı.' });
    }
    // yüksek gecikmeli kayıtlar
    const gecikmeli = K.filter(k => typeof k.sureMs === 'number' && k.sureMs >= 4000).slice(0, 5);
    gecikmeli.forEach(k => supheli.push({ tip: 'YÜKSEK GECİKME', kayit: k, aciklama: 'Eşik üstü yanıt süresi (' + k.sureMs + ' ms).' }));
    // restart
    K.filter(k => /RESTART/i.test(k.kod)).slice(0, 4).forEach(k => supheli.push({ tip: 'SERVİS RESTART', kayit: k, aciklama: 'Servis sağlık kontrolünü geçemedi, yeniden başlatıldı.' }));
    sonuc.supheliler = supheli.slice(0, 10);

    // 8) Zincir (nedensel yol): ilk anomali servisinden ağ üzerinden yayılan sıra
    const ziyaret = {};
    const zincir = [];
    if (sonuc.ilkAnomali) {
      const kuyruk = [sonuc.ilkAnomali.servis];
      while (kuyruk.length) {
        const s = kuyruk.shift();
        if (ziyaret[s]) continue;
        ziyaret[s] = 1;
        const bilgi = servisBilgi.find(x => x.servis === s);
        if (bilgi) zincir.push(bilgi);
        kenarlar.filter(e => e.kaynak === s).forEach(e => { if (!ziyaret[e.hedef]) kuyruk.push(e.hedef); });
      }
    }
    sonuc.zincir = zincir;

    // 9) Zaman çizelgesi (dakikalık yoğunluk)
    const dakMap = {};
    K.forEach(k => {
      const d = dakikaAnahtari(k.ts);
      dakMap[d] = dakMap[d] || { t: d, hata: 0, uyari: 0, normal: 0, toplam: 0 };
      dakMap[d].toplam++;
      if (k.seviye === 'ERROR') dakMap[d].hata++;
      else if (k.seviye === 'WARN') dakMap[d].uyari++;
      else dakMap[d].normal++;
    });
    sonuc.hataYogunlugu = Object.keys(dakMap).map(Number).sort((a, b) => a - b).map(d => dakMap[d]);

    // 10) Sağlık göstergeleri (anomali öncesi/sonrası oran)
    sonuc.saglik = servisBilgi.map(s => {
      const kritik = s.hata > 0 ? Math.min(1, (s.hata / Math.max(1, s.toplam)) * 3) : 0;
      const durum = s.baslangic == null ? 'saglikli' : (kritik > 0.55 ? 'cokuntu' : kritik > 0.25 ? 'bozuk' : 'riskli');
      return { servis: s.servis, durum: durum, hataOrani: s.toplam ? Math.round((s.hata / s.toplam) * 100) : 0, baslangic: s.baslangic, ortSureMs: s.ortSureMs };
    }).sort((a, b) => (a.durum === 'cokuntu' ? -1 : 0) - (b.durum === 'cokuntu' ? -1 : 0));

    sonuc.toplamSaat = { bas: K[0].ts, son: K[K.length - 1].ts };
    return sonuc;
  }

  // Cevap anahtarına dokunmadan sonucu anahtarla kıyasla (yalnız test/rapor katmanı çağırır)
  // NUMEX-DÜZELTME (2026-11-14): 'beklenen' servis adı cevap anahtarının servis listesinde tek kelimeyle tutuluyor.
  function anahtarlaKiyasla(sonuc, anahtar) {
    const ilkAday = sonuc.adaylar[0];
    return {
      kokServisBulundu: !!(ilkAday && ilkAday.servis === anahtar.kokServis),
      kokHataKoduBulundu: sonuc.adaylar.slice(0, 3).some(a => a.oruntuler.some(o => o.kod === anahtar.kokHataKodu)),
      ilkAnomaliDogru: !!(sonuc.ilkAnomali && sonuc.ilkAnomali.servis === anahtar.kokServis),
      ilgisizYanlisIsaret: sonuc.adaylar.filter(a => anahtar.ilgisizler.some(kod => a.oruntuler.some(o => o.kod === kod)) && a.skor > 40).map(a => a.servis)
    };
  }

  global.NumexAnalyzer = { iceAktar: iceAktar, analizEt: analizEt, anahtarlaKiyasla: anahtarlaKiyasla };
})(window);
