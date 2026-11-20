// Alan (domain) testleri — sunucudan bağımsız saf mantık.
import test from "node:test";
import assert from "node:assert/strict";
import {
  bosSaatler,
  cakismaVarMi,
  randevuOlustur,
  gunRandevulari,
  dakikaOku,
  saatYaz,
  tarihGecerliMi,
  bugunYerel,
  gunDilimleri,
  HIZMETLER,
} from "../lib/randevu.js";

const TARIH = "2026-11-20"; // Cuma
const PAZAR = "2026-11-22";
let sayac = 0;
const yeniId = () => `t-${++sayac}`;

function olustur(liste, veri) {
  // Varsayılanlar önce, çağıranın değerleri sonra: geçilen tarih/saat ezilmesin.
  const sonuc = randevuOlustur(liste, { tarih: TARIH, ...veri, saat: veri.saat ?? "10:00" }, { bugun: "2026-11-01", yeniId });
  if (sonuc.randevu) liste.push(sonuc.randevu);
  return sonuc;
}

test("saat yardımcıları", () => {
  assert.equal(dakikaOku("09:15"), 555);
  assert.equal(dakikaOku("09:10"), null, "15'in katı olmayan saat reddedilir");
  assert.equal(dakikaOku("24:00"), 1440);
  assert.equal(dakikaOku("abc"), null);
  assert.equal(saatYaz(600), "10:00");
  assert.equal(saatYaz(555), "09:15");
});

test("tarih doğrulaması", () => {
  assert.equal(tarihGecerliMi(TARIH), true);
  assert.equal(tarihGecerliMi("2026-02-30"), false, "olmayan gün");
  assert.equal(tarihGecerliMi("20.11.2026"), false);
  assert.match(bugunYerel(), /^\d{4}-\d{2}-\d{2}$/);
});

test("gün 09:00–19:00 arası 15 dakikalık dilimler; Pazar kapalı", () => {
  const dilimler = gunDilimleri(TARIH);
  assert.equal(dilimler[0], 540);
  assert.equal(dilimler.at(-1), 1125);
  assert.equal(dilimler.length, 40);
  assert.equal(gunDilimleri(PAZAR).length, 0);
});

test("boş saat listesi hizmet süresine göre kısalır", () => {
  const kesim = bosSaatler([], { calisan: "ayse", tarih: TARIH, hizmet: "sac-kesimi" });
  const boya = bosSaatler([], { calisan: "ayse", tarih: TARIH, hizmet: "boya" });
  assert.equal(kesim.length, 39, "30 dk'lık hizmet en geç 18:30'da başlar (18:45 → 19:15 sarkar)");
  assert.equal(boya.length, 35, "90 dk'lık hizmet en geç 17:30'da başlar (09:00–17:30 arası 35 dilim)");
  assert.equal(boya.at(-1), "17:30");
});

test("randevu alınınca saat dolu düşer", () => {
  const liste = [];
  const s = olustur(liste, { musteri: "Elif", calisan: "ayse", hizmet: "boya", saat: "10:00" });
  assert.ok(s.randevu, "randevu oluşmalı");
  const bos = bosSaatler(liste, { calisan: "ayse", tarih: TARIH, hizmet: "sac-kesimi" });
  for (const dolu of ["09:45", "10:00", "11:15"]) assert.ok(!bos.includes(dolu), `${dolu} dolu olmalı`);
  assert.ok(bos.includes("09:30"));
  assert.ok(bos.includes("11:30"));
});

test("AYNI ÇALIŞANA çakışan randevu verilemez (başlangıç + kesişen aralık)", () => {
  const liste = [];
  olustur(liste, { musteri: "Elif", calisan: "ayse", hizmet: "boya", saat: "10:00" }); // 10:00–11:30

  const ayni = olustur(liste, { musteri: "Ali", calisan: "ayse", hizmet: "sac-kesimi", saat: "10:00" });
  assert.equal(ayni.kod, "CAKISMA");

  const kesisen = olustur(liste, { musteri: "Zeynep", calisan: "ayse", hizmet: "sac-kesimi", saat: "11:15" });
  assert.equal(kesisen.kod, "CAKISMA", "11:15–11:45 aralığı 11:30'da kesişir");

  const onceki = olustur(liste, { musteri: "Veli", calisan: "ayse", hizmet: "fon", saat: "09:30" });
  assert.equal(onceki.kod, "CAKISMA", "9:30+45dk → 10:15, boyaya girer");

  const bitisik = olustur(liste, { musteri: "Ayşe", calisan: "ayse", hizmet: "sac-kesimi", saat: "11:30" });
  assert.ok(bitisik.randevu, "tam dibe bitişik randevu serbesttir");
});

test("farklı çalışan aynı saatte randevu alabilir", () => {
  const liste = [];
  olustur(liste, { musteri: "Elif", calisan: "ayse", hizmet: "boya", saat: "10:00" });
  const digeri = olustur(liste, { musteri: "Ali", calisan: "mehmet", hizmet: "boya", saat: "10:00" });
  assert.ok(digeri.randevu, "çalışan ayrıysa çakışma yok");
});

test("farklı gün aynı saat çakışmaz", () => {
  const liste = [];
  olustur(liste, { musteri: "Elif", calisan: "ayse", hizmet: "boya", saat: "10:00" });
  const yarin = olustur(liste, { musteri: "Ali", calisan: "ayse", hizmet: "boya", saat: "10:00", tarih: "2026-11-21" });
  assert.ok(yarin.randevu);
});

test("geçersiz girişler reddedilir", () => {
  const liste = [];
  assert.equal(olustur(liste, { musteri: "A", calisan: "ayse", hizmet: "fon" }).kod, "MUSTERI");
  assert.equal(olustur(liste, { musteri: "Elif", calisan: "yok", hizmet: "fon" }).kod, "CALISAN");
  assert.equal(olustur(liste, { musteri: "Elif", calisan: "ayse", hizmet: "yok" }).kod, "HIZMET");
  assert.equal(olustur(liste, { musteri: "Elif", calisan: "ayse", hizmet: "fon", saat: "10:10" }).kod, "SAAT");
  assert.equal(olustur(liste, { musteri: "Elif", calisan: "ayse", hizmet: "fon", tarih: PAZAR }).kod, "KAPALI");
  assert.equal(olustur(liste, { musteri: "Elif", calisan: "ayse", hizmet: "boya", saat: "18:00" }).kod, "SIgMIYOR");
  assert.equal(liste.length, 0, "hiçbiri kaydedilmemeli");
});

test("geçmiş tarihe randevu alınamaz", () => {
  const sonuc = randevuOlustur(
    [],
    { musteri: "Elif", calisan: "ayse", hizmet: "fon", tarih: "2026-11-19", saat: "10:00" },
    { bugun: TARIH, yeniId }
  );
  assert.equal(sonuc.kod, "GECMIS_TARIH");
});

test("çakışma kontrolü iptal edilen randevuyu yok sayar", () => {
  const liste = [];
  const ilk = olustur(liste, { musteri: "Elif", calisan: "ayse", hizmet: "boya", saat: "10:00" });
  liste.find((r) => r.id === ilk.randevu.id).iptal = true;
  const yeni = olustur(liste, { musteri: "Ali", calisan: "ayse", hizmet: "boya", saat: "10:00" });
  assert.ok(yeni.randevu, "iptal edilen saat boşa döner");
  assert.equal(cakismaVarMi(liste.filter((r) => !r.iptal), {
    calisan: "ayse", tarih: TARIH, saat: "10:00", hizmet: "boya",
  }), true);
});

test("günün listesi saat sırasıyla ve iptaller hariç", () => {
  const liste = [];
  // NUMEX-DÜZELTME (2026-11-20): Testteki kısa müşteri adları ("A", "B", "C") alan kuralına takılıyordu (en az 2 karakter), bu yüzden iptal testi kurulacak kaydı bulamıyordu; geçerli adlar kullanıldı ve tekrar eden düzeltme notları temizlendi.
  olustur(liste, { musteri: "Ceren", calisan: "ayse", hizmet: "fon", saat: "14:00" });
  olustur(liste, { musteri: "Ahmet", calisan: "mehmet", hizmet: "fon", saat: "09:00" });
  const orta = olustur(liste, { musteri: "Banu", calisan: "zeynep", hizmet: "fon", saat: "15:00" });
  assert.ok(orta.randevu, "iptal edilecek randevu oluşmalı");
  liste.find((r) => r.id === orta.randevu.id).iptal = true;
  const gun = gunRandevulari(liste, TARIH);
  assert.deepEqual(gun.map((r) => r.musteri), ["Ahmet", "Ceren"]);
});

test("hizmet süreleri tanımlı", () => {
  assert.deepEqual(HIZMETLER.map((h) => h.dakika), [30, 90, 45]);
  assert.ok(HIZMETLER.every((h) => h.dakika % 15 === 0));
});
