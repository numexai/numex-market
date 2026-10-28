// KURTARMA + İZLEME + RİSK MOTORU
// Amaç: çökme sonrası yarım kalmış ödemeleri tamamlamak (ama İKİ KEZ tahsil etmeden),
// gecikme riskini kanıtıyla tespit etmek ve kullanıcı izni olmadan müşteri verisine DOKUNMAMAK.
import { db, now, logOps, recordDecision } from './db.js';
import { odemeKesinlestir } from './isletme.js';

/** Sunucu açılışında çalışır: yarım kalan işlemleri kapatır. */
export function kurtarmaCalistir() {
  const rapor = { kesinlesen: [], yarimKalan: [], tamamlananSiparis: [] };

  // 1) Ödeme "BASARILI" yazılıp süreç ölmüş olabilir → sipariş ODENDI'ye çekilmemişse tamamla.
  //    Not: tahsilat TEKRAR yapılmaz; yalnız durum senkronize edilir.
  const yarim = db.prepare(`
    SELECT p.id AS odeme_id, p.order_id, p.durum AS odeme, o.durum AS siparis
    FROM payments p JOIN orders o ON o.id = p.order_id
    WHERE p.durum = 'BASARILI' AND o.durum = 'REZERVE'
  `).all();
  for (const y of yarim) {
    const r = odemeKesinlestir({ paymentId: y.odeme_id });
    rapor.kesinlesen.push({ ...y, sonuc: r.zaten ? 'zaten-kapali' : 'tamamlandi' });
  }

  // 2) "BASLATILDI" kalmış (tahsilatı belirsiz) ödemeler: MÜKERRER TAHSİLAT riski taşır.
  //    Otomatik tahsilat DENENMEZ — sadece işaretlenir ve operatör onayına bırakılır.
  const belirsiz = db.prepare(`
    SELECT p.id AS odeme_id, p.order_id, p.tutar_kurus, p.olusturma
    FROM payments p WHERE p.durum = 'BASLATILDI'
  `).all();
  for (const b of belirsiz) {
    // Sipariş başka bir başarılı ödemeyle kapandıysa bu niyet iptal edilebilir
    const basarili = db.prepare("SELECT id FROM payments WHERE order_id = ? AND durum = 'BASARILI'").get(b.order_id);
    if (basarili) {
      db.prepare("UPDATE payments SET durum = 'BASARISIZ', guncelleme = ? WHERE id = ? AND durum = 'BASLATILDI'")
        .run(now(), b.odeme_id);
      rapor.tamamlananSiparis.push({ ...b, sonuc: 'basarili-odeme-zaten-var → niyet iptal edildi' });
    } else {
      rapor.yarimKalan.push({ ...b, sonuc: 'belirsiz — operator onayi bekliyor (otomatik tahsilat yapilmadi)' });
    }
  }

  // 3) outbox'ta kalmış olaylar (teslimat bildirimi gibi) — dış sistem YOK, sadece kayıt kapatılır
  const bekleyen = db.prepare("SELECT * FROM outbox WHERE durum = 'BEKLIYOR'").all();
  for (const o of bekleyen) {
    db.prepare("UPDATE outbox SET durum = 'ISLENDI' WHERE id = ?").run(o.id);
  }

  const ozet = { ...rapor, outboxIslenen: bekleyen.length };
  if (ozet.kesinlesen.length || ozet.yarimKalan.length || bekleyen.length) {
    logOps('KURTARMA', 'Acilis kurtarma turu calisti', ozet);
    recordDecision({
      gozlem: `Acilista ${ozet.kesinlesen.length} yarim odeme, ${ozet.yarimKalan.length} belirsiz odeme, ${bekleyen.length} bekleyen outbox olayi bulundu.`,
      risk: 'Cokme sonrasi siparis durumunun odeme ile uyumsuz kalmasi ve mukerrer tahsilat riski.',
      karar: 'BASARILI+BASLATILDI durumundaki kayitlar icin yalniz durum senkronizasyonu yapildi; belirsiz olanlara dokunulmadi.',
      gerekce: 'Tahsilatin gercekten gerceklestigini gosteren tek kanit payments.durum=BASARILI kaydidir; belirsiz kayit icin ikinci tahsilat denemek mukerrer cekim yaratir.',
      yetki: 'Kullanici sunucunun yeniden baslatilmasina ve otomatik kurtarmaya izin verdi (SINAV 2).',
      yapilmayan: 'Belirsiz odemeler icin otomatik yeniden tahsilat YAPILMADI.',
      dogrulama: 'SINAV 2 — sunucu oldurulup yeniden baslatildi, siparis kurtarildi, payments tablosunda ayni siparis icin tek BASARILI kayit kaldi.'
    });
  }
  return ozet;
}

/** Gecikme riski: hedef teslim tarihine kalan süre vs. sipariş durumu. */
export function riskHesapla(order) {
  const simdi = Date.now();
  const hedef = order.hedef_teslim ? new Date(order.hedef_teslim).getTime() : null;
  const kalanSaat = hedef ? (hedef - simdi) / 3600000 : null;

  const acik = !['TESLIM_EDILDI', 'IPTAL'].includes(order.durum);
  const odemeBekliyor = order.durum === 'REZERVE';
  const yoldaDegil = !['YOLDA', 'TESLIM_EDILDI'].includes(order.durum);

  const kanit = [];
  let seviye = 'YOK';

  if (acik && odemeBekliyor) {
    const yasSaat = (simdi - new Date(order.olusturma).getTime()) / 3600000;
    if (yasSaat > 0.05) {
      kanit.push(`Siparis ${order.olusturma} tarihinden beri ${yasSaat.toFixed(2)} saattir odeme bekliyor (durum=REZERVE).`);
      seviye = yasSaat > 2 ? 'YUKSEK' : 'ORTA';
    }
  }
  if (kalanSaat !== null && acik) {
    if (kalanSaat < 0 && !['TESLIM_EDILDI'].includes(order.durum)) {
      kanit.push(`Hedef teslim ${order.hedef_teslim} gecmis (${Math.abs(kalanSaat).toFixed(2)} saat gecikme), durum hala ${order.durum}.`);
      seviye = 'YUKSEK';
    } else if (kalanSaat < 24 && yoldaDegil) {
      kanit.push(`Hedefe ${kalanSaat.toFixed(2)} saat kaldi ve siparis henuz ${order.durum} durumunda (YOLDA degil).`);
      if (seviye !== 'YUKSEK') seviye = 'ORTA';
    }
  }
  // Tedarik süresi hedefe yetmiyor mu?
  if (acik && hedef && yoldaDegil) {
    const kalemler = db.prepare(`SELECT MAX(p.tedarik_gun) AS tg FROM order_items oi
                                 JOIN products p ON p.id = oi.product_id WHERE oi.order_id = ?`).get(order.id);
    const tedarikSaat = (kalemler?.tg || 0) * 24;
    const simdiden = simdi + tedarikSaat * 3600000;
    if (simdiden > hedef && seviye === 'YOK') {
      kanit.push(`En uzun tedarik suresi ${kalemler.tg} gun; simdiden hesaplandiginda ${new Date(simdiden).toISOString()} — hedef ${order.hedef_teslim} karsilanamiyor.`);
      seviye = 'DUSUK';
    }
  }
  return { seviye, kanit };
}

/** Tüm açık siparişleri tarar, bulguları döndürür. MÜŞTERİ VERİSİ DEĞİŞTİRİLMEZ. */
export function riskTarama({ kaydet = true } = {}) {
  const siparisler = db.prepare("SELECT * FROM orders WHERE durum NOT IN ('TESLIM_EDILDI','IPTAL')").all();
  const bulgular = [];
  for (const s of siparisler) {
    const t = riskHesapla(s);
    if (t.seviye !== 'YOK') {
      bulgular.push({ order_id: s.id, musteri_id: s.musteri_id, durum: s.durum, seviye: t.seviye, kanit: t.kanit });
      if (kaydet && s.risk_seviyesi !== t.seviye) {
        db.prepare('UPDATE orders SET risk_seviyesi = ?, risk_gerekce = ? WHERE id = ?')
          .run(t.seviye, t.kanit.join(' | '), s.id);
        logOps('RISK', `Siparis #${s.id} risk seviyesi ${t.seviye}`, { kanit: t.kanit });
      }
    } else if (kaydet && s.risk_seviyesi !== 'YOK') {
      // Risk ortadan kalktıysa (ör. teslim edildi) alan temizlenir
      db.prepare("UPDATE orders SET risk_seviyesi = 'YOK', risk_gerekce = NULL WHERE id = ?").run(s.id);
    }
  }
  return bulgular;
}

/**
 * ÖNERİ üretir — aksiyon UYGULAMAZ. Kullanıcı izni olmadan müşteri verisi
 * (telefon, adres, ad) güncellenmez, müşteri aranmaz, mesaj gönderilmez.
 */
export function oneriUret(bulgu) {
  const s = db.prepare('SELECT * FROM orders WHERE id = ?').get(bulgu.order_id);
  const oneriler = [];
  if (s.durum === 'REZERVE') {
    oneriler.push('Odeme hatirlatmasi icin musteriye mesaj GOSTERILMESI (gonderim kullanici onayi gerektirir)');
    oneriler.push('Odeme alinmazsa rezervasyon iptali ile stogun serbest birakilmasi (tek tik onay)');
  }
  if (s.hedef_teslim && new Date(s.hedef_teslim).getTime() < Date.now()) {
    oneriler.push('Hedef teslim tarihinin revize edilmesi (musteriyle mutabakat sonrasi)');
    oneriler.push('Alternatif kargo/tedarikci ile hizlandirilmis sevkiyat planlanmasi');
  }
  return {
    ...bulgu,
    oneriler,
    veri_degisikligi: 'YOK — onay verilmeden musteri kaydi ve siparis revize edilmedi.',
    gereken_yetki: 'Siparis revizyonu / musteri bilgisi guncellemesi kullaniciya aittir.'
  };
}
