/* ============================================================
   NUMEX KAŞE — KANVAS EDİTÖRÜ
   Doğrudan tabla üzerinde yazı yaz / taşı / büyüt / döndür.
   Sol panelde sıkışmadan, "video oyunu gibi" canlı düzenleme.
   ============================================================ */
'use strict';

/* ---------- Tutamak tanımı ---------- */
const TUTAMAK_R  = 6;      // px yarıçap
const DONME_R    = 16;     // döndürme okunun tepeden uzaklığı (mm)
const MIN_BOY    = 1.5;    // mm — en küçük yazı boyu
const MAX_BOY    = 300;    // mm

/**
 * Editör durumu — çekirdek S nesnesine bağlanır, ayrı kopya tutmaz.
 * @param {object} ctx0  { S, PX, MM, mmPxAl, ciz, arayuzGuncelle, nesneKutu, sinirla, renk }
 */
function EditoKur(ctx0){
  const { S, PX, MM, ciz, arayuzGuncelle, nesneKutu, sinirla, renk } = ctx0;

  /* Aktif sürükleme işlemi */
  let islem = null;   // { tur:'tas'|'boyut'|'dondur', ... }
  /* Canlı yazma durumu */
  let yazim = null;   // { nesne, imlecGorunur, zamanlayici }

  /* ----------------------------------------------------------
     YARDIMCI: bir nesnenin döndürülmüş kutusunda köşe noktaları
     ---------------------------------------------------------- */
  function koseNoktalari(o){
    const k = nesneKutu(o);
    const a = (o.aci || 0) * Math.PI / 180;
    const cx = k.cx, cy = k.cy;
    const hw = k.w / 2, hh = k.h / 2;
    const koseler = [
      { id:'tl', x:-hw, y:-hh },
      { id:'tr', x: hw, y:-hh },
      { id:'br', x: hw, y: hh },
      { id:'bl', x:-hw, y: hh }
    ];
    return koseler.map(p => ({
      id: p.id,
      x: cx + p.x * Math.cos(a) - p.y * Math.sin(a),
      y: cy + p.x * Math.sin(a) + p.y * Math.cos(a)
    }));
  }

  /* Döndürme okunun ucunun mm konumu (kutunun üst ortasından yukarı) */
  function donmeNoktasi(o){
    const k = nesneKutu(o);
    const a = (o.aci || 0) * Math.PI / 180;
    const uzak = Math.max(10, Math.min(40, k.h * 0.5 + 12));
    const lx = 0, ly = -(k.h / 2 + uzak);
    return {
      x: k.cx + lx * Math.cos(a) - ly * Math.sin(a),
      y: k.cy + lx * Math.sin(a) + ly * Math.cos(a)
    };
  }

  /* ----------------------------------------------------------
     İSABET TESTİ — fare mm konumu hangi tutamağa/nesneye denk
     ---------------------------------------------------------- */
  function tutamakBul(p){
    const o = S.nesneler.find(n => n.id === S.seciliId);
    if (!o) return null;
    const pay = 6 / Math.max(0.3, ctx0.mmPxAl());  // px toleransı → mm
    for (const kn of koseNoktalari(o)){
      if (Math.abs(p.x - kn.x) <= pay && Math.abs(p.y - kn.y) <= pay)
        return { tur:'boyut', nesne:o, kose:kn.id };
    }
    const dn = donmeNoktasi(o);
    if (Math.hypot(p.x - dn.x, p.y - dn.y) <= pay * 1.4)
      return { tur:'dondur', nesne:o };
    return null;
  }

  function nesneBul(p){
    for (let i = S.nesneler.length - 1; i >= 0; i--){
      const o = S.nesneler[i];
      const k = nesneKutu(o);
      // döndürülmüş kutu isabeti: noktayı ters döndürüp eksen-hizalı kutuya bak
      const a = -(o.aci || 0) * Math.PI / 180;
      const dx = p.x - k.cx, dy = p.y - k.cy;
      const lx = dx * Math.cos(a) - dy * Math.sin(a);
      const ly = dx * Math.sin(a) + dy * Math.cos(a);
      if (Math.abs(lx) <= k.w / 2 + 1 && Math.abs(ly) <= k.h / 2 + 1) return o;
    }
    return null;
  }

  /* ----------------------------------------------------------
     CANLI YAZMA — kanvasa çift tıkla veya boş yere tıkla
     ---------------------------------------------------------- */
  function yazimBasla(o, ilkMi){
    if (yazim && yazim.nesne === o && yazim.aktif) return;   // zaten yazılıyorsa tekrar başlatma
    if (yazim && yazim.zamanlayici) clearInterval(yazim.zamanlayici);
    yazim = { nesne:o, imlecGorunur:true, aktif:true };
    yazim.zamanlayici = setInterval(() => {
      if (!yazim || !yazim.aktif) return;
      yazim.imlecGorunur = !yazim.imlecGorunur;
      window._numexImlec = yazim.imlecGorunur;
      ciz();
    }, 520);
    window._numexImlec = true;
    // içerik boşsa kullanıcı yazmaya hazır olsun
    if (ilkMi && o.icerik == null) o.icerik = '';
    arayuzGuncelle();
    ciz();
  }

  function yazimBitir(){
    if (!yazim) return null;
    const o = yazim.nesne;
    yazim.aktif = false;
    if (yazim.zamanlayici) clearInterval(yazim.zamanlayici);
    yazim = null;
    window._numexImlec = true;
    // boş kalan yazıyı sil — kazara tıklama kalıntı bırakmasın
    if (o && o.tip === 'metin' && !String(o.icerik || '').trim()){
      const i = S.nesneler.indexOf(o);
      if (i >= 0) S.nesneler.splice(i, 1);
      if (S.seciliId === o.id) S.seciliId = null;
    }
    arayuzGuncelle();
    ciz();
    return o;
  }

  function yazimAktifMi(){ return !!(yazim && yazim.aktif); }

  /* ----------------------------------------------------------
     FARE OLAYLARI — ana etkileşim girişi
     ---------------------------------------------------------- */
  function bas(ev, p){
    // 1) Önce tutamak var mı?
    const t = tutamakBul(p);
    if (t){
      if (t.tur === 'dondur'){
        const k = nesneKutu(t.nesne);
        islem = {
          tur:'dondur', nesne:t.nesne,
          merkez:{ x:k.cx, y:k.cy },
          baslangicAci: t.nesne.aci || 0,
          fareAci: Math.atan2(p.y - k.cy, p.x - k.cx) * 180 / Math.PI
        };
      } else {
        const k = nesneKutu(t.nesne);
        islem = {
          tur:'boyut', nesne:t.nesne, kose:t.kose,
          merkez:{ x:k.cx, y:k.cy },
          baslangicBoy: t.nesne.boy || 10,
          baslangicG: t.nesne.g, baslangicH: t.nesne.h,
          baslangicW: k.w, baslangicH2: k.h,
          fareMm: p
        };
      }
      ciz();
      return true;
    }

    // 2) Nesneye denk geldi mi? → seç + canlı yazma başlat
    const n = nesneBul(p);
    if (n){
      yazimBitir();
      S.seciliId = n.id;
      if (ev && ev.detail >= 2){          // çift tık → doğrudan düzenle
        yazimBasla(n, false);
      } else {
        islem = { tur:'tas', nesne:n, baslangic:p, basla:{ x:n.x, y:n.y } };
      }
      arayuzGuncelle();
      ciz();
      return true;
    }

    // 3) Boş alan — yazı yazmaya başla (sol panele gitmeye gerek yok)
    //    NOT: nesneOlustur zaten seçim yapar; burada tekrar yazım başlatılır.
    yazimBitir();
    const yeni = ctx0.nesneOlustur('metin', {
      x: Math.round(p.x * 2) / 2,
      y: Math.round(p.y * 2) / 2,
      icerik: ''
    });
    yazimBasla(yeni, true);
    return true;
  }

  function hareket(ev, p){
    if (!islem) return false;
    const o = islem.nesne;

    if (islem.tur === 'tas'){
      o.x = Math.round((islem.basla.x + (p.x - islem.baslangic.x)) * 10) / 10;
      o.y = Math.round((islem.basla.y + (p.y - islem.baslangic.y)) * 10) / 10;
      sinirla(o);
    }
    else if (islem.tur === 'boyut'){
      // Merkeze uzaklık oranı → boy ölçeği (orantılı büyüt/küçült)
      const k = nesneKutu(o);
      const r0 = Math.hypot(islem.fareMm.x - islem.merkez.x, islem.fareMm.y - islem.merkez.y) || 1;
      const r1 = Math.hypot(p.x - islem.merkez.x, p.y - islem.merkez.y);
      const oran = Math.max(0.08, r1 / r0);

      if (o.tip === 'metin'){
        o.boy = Math.max(MIN_BOY, Math.min(MAX_BOY, islem.baslangicBoy * oran));
      } else {
        o.g = Math.max(1, islem.baslangicG * oran);
        o.h = Math.max(1, islem.baslangicH * oran);
      }
      sinirla(o);
    }
    else if (islem.tur === 'dondur'){
      const simdiki = Math.atan2(p.y - islem.merkez.y, p.x - islem.merkez.x) * 180 / Math.PI;
      let aci = islem.baslangicAci + (simdiki - islem.fareAci);
      // Shift ile 15° kilit
      if (ev && ev.shiftKey) aci = Math.round(aci / 15) * 15;
      o.aci = Math.round(aci * 10) / 10;
    }
    ciz();
    return true;
  }

  function birak(){
    if (!islem) return false;
    islem = null;
    arayuzGuncelle();
    ciz();
    return true;
  }

  /* ----------------------------------------------------------
     KLAVYE — yazı yazma + kısayollar
     ---------------------------------------------------------- */
  function tus(ev){
    // Yazı yazma modundaysak: harfleri metne ekle
    if (yazim){
      const o = yazim.nesne;
      if (ev.key === 'Escape'){ yazimBitir(); return true; }
      if (ev.key === 'Enter'){
        if (ev.shiftKey){ o.icerik += '\n'; }   // Shift+Enter = alt satır
        else { yazimBitir(); }
        arayuzGuncelle(); ciz(); return true;
      }
      if (ev.key === 'Backspace'){
        o.icerik = String(o.icerik || '').slice(0, -1);
        arayuzGuncelle(); ciz(); return true;
      }
      // tek karakter → ekle
      if (ev.key.length === 1 && !ev.ctrlKey && !ev.metaKey && !ev.altKey){
        o.icerik = String(o.icerik || '') + ev.key;
        arayuzGuncelle();          // iş listesi + ölçü paneli canlı güncellensin
        ciz();
        return true;
      }
      return false;
    }

    // Normal kısayollar
    const sec = S.nesneler.find(n => n.id === S.seciliId);
    if (!sec) return false;

    if (ev.key === 'Delete'){ ctx0.nesneSil(sec.id); return true; }
    if (ev.key === 'ArrowUp')   { sec.y -= ev.shiftKey ? 5 : 1; sinirla(sec); ciz(); ev.preventDefault(); return true; }
    if (ev.key === 'ArrowDown') { sec.y += ev.shiftKey ? 5 : 1; sinirla(sec); ciz(); ev.preventDefault(); return true; }
    if (ev.key === 'ArrowLeft') { sec.x -= ev.shiftKey ? 5 : 1; sinirla(sec); ciz(); ev.preventDefault(); return true; }
    if (ev.key === 'ArrowRight'){ sec.x += ev.shiftKey ? 5 : 1; sinirla(sec); ciz(); ev.preventDefault(); return true; }
    if (ev.key === 'r' || ev.key === 'R'){
      sec.aci = ((sec.aci || 0) + 15) % 360; ciz(); arayuzGuncelle(); return true;
    }
    if (ev.key === 'Enter' || ev.key === 'F2'){
      yazimBasla(sec, false); return true;
    }
    return false;
  }

  /* ----------------------------------------------------------
     İMLEÇ ŞEKLİ — tutamağın üstünde farklı imleç
     ---------------------------------------------------------- */
  function imlec(p){
    if (islem) return 'grabbing';
    const t = tutamakBul(p);
    if (t){
      if (t.tur === 'dondur') return 'grab';
      const m = { tl:'nwse-resize', br:'nwse-resize', tr:'nesw-resize', bl:'nesw-resize' };
      return m[t.kose] || 'nwse-resize';
    }
    if (nesneBul(p)) return 'move';
    return 'text';
  }

  return {
    bas, hareket, birak, tus, imlec,
    yazimBasla, yazimBitir, yazimAktifMi,
    koseNoktalari, donmeNoktasi, nesneBul,
    TUTAMAK_R, DONME_R
  };
}

window.EditoKur = EditoKur;
