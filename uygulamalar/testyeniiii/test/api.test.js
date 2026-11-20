// HTTP uçtan uca testleri — gerçek sunucu, geçici veri dosyası (projenin data.json'ına dokunmaz).
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { sunucuOlustur } from "../server.js";
import { bugunYerel } from "../lib/randevu.js";

async function baslat() {
  const klasor = await fs.mkdtemp(path.join(os.tmpdir(), "kuafor-test-"));
  const veriYolu = path.join(klasor, "data.json");
  process.env.VERI_YOLU = veriYolu;
  const sunucu = sunucuOlustur();
  await new Promise((k) => sunucu.listen(0, "127.0.0.1", k));
  const kok = `http://127.0.0.1:${sunucu.address().port}`;
  return {
    kok,
    async kapat() {
      delete process.env.VERI_YOLU;
      // Açık keep-alive bağlantıları close()'u bekletmesin: testte asılı kalmayı önler.
      sunucu.closeAllConnections();
      await new Promise((k) => sunucu.close(k));
      await fs.rm(klasor, { recursive: true, force: true });
    },
  };
}

const yarin = () => {
  const t = new Date();
  t.setDate(t.getDate() + 1);
  const p = (n) => String(n).padStart(2, "0");
  return `${t.getFullYear()}-${p(t.getMonth() + 1)}-${p(t.getDate())}`;
};

test("API: hizmetler, randevu al, çakışma, yönetici listesi, iptal ve saatin boşa dönmesi", async () => {
  const s = await baslat();
  const tarih = yarin();
  const istek = (yol, secenek) => fetch(s.kok + yol, secenek);

  try {
    // 1) hizmet + çalışan listesi
    const hizmetler = await (await istek("/api/hizmetler")).json();
    assert.deepEqual(hizmetler.hizmetler.map((h) => h.id), ["sac-kesimi", "boya", "fon"]);
    assert.equal(hizmetler.calisanlar.length, 3);

    // 2) boş saatler
    const q = new URLSearchParams({ calisan: "ayse", tarih, hizmet: "boya" });
    const saatCevap = await (await istek("/api/saatler?" + q)).json();
    assert.ok(saatCevap.saatler.includes("10:00"));

    // 3) randevu al
    const govde = { musteri: "Test Müşteri", telefon: "0555 111 22 33", calisan: "ayse", hizmet: "boya", tarih, saat: "10:00" };
    const yarat = await istek("/api/randevu", { method: "POST", body: JSON.stringify(govde) });
    assert.equal(yarat.status, 201);
    const { randevu } = await yarat.json();
    assert.equal(randevu.saat, "10:00");
    assert.equal(randevu.sure, 90);

    // 4) aynı çalışana çakışan randevu → 409 ve JSON hata
    const cakisan = await istek("/api/randevu", {
      method: "POST",
      body: JSON.stringify({ ...govde, musteri: "Başka Biri", saat: "10:30", hizmet: "sac-kesimi" }),
    });
    assert.equal(cakisan.status, 409);
    assert.equal((await cakisan.json()).kod, "CAKISMA");

    // 5) saat dolu görünüyor
    const doluSonra = await (await istek("/api/saatler?" + q)).json();
    assert.ok(!doluSonra.saatler.includes("10:00"));
    assert.ok(!doluSonra.saatler.includes("11:15"), "boya 90 dk sürdüğü için 11:15 de dolu");

    // 6) yönetici listesi
    const gun = await (await istek("/api/randevular?tarih=" + tarih)).json();
    assert.equal(gun.randevular.length, 1);
    assert.equal(gun.randevular[0].musteri, "Test Müşteri");

    // 7) iptal → 200
    const iptal = await istek("/api/randevu/" + encodeURIComponent(randevu.id), { method: "DELETE" });
    assert.equal(iptal.status, 200);

    // 8) listeden düştü
    const sonra = await (await istek("/api/randevular?tarih=" + tarih)).json();
    assert.equal(sonra.randevular.length, 0);

    // 9) saat yeniden boşa düştü
    const bosSonra = await (await istek("/api/saatler?" + q)).json();
    assert.ok(bosSonra.saatler.includes("10:00"), "iptal edilen saat yeniden boş olmalı");

    // 10) aynı saat yeniden alınabiliyor
    const tekrar = await istek("/api/randevu", { method: "POST", body: JSON.stringify(govde) });
    assert.equal(tekrar.status, 201);

    // 11) aynı randevuyu tekrar iptal etmek 409
    const ikinci = await istek("/api/randevu/" + encodeURIComponent(randevu.id), { method: "DELETE" });
    assert.equal(ikinci.status, 409);

    // 12) olmayan randevu 404
    const yok = await istek("/api/randevu/olmayan-id", { method: "DELETE" });
    assert.equal(yok.status, 404);

    // 13) kalıcılık: dosyada kayıt var
    const icerik = JSON.parse(await fs.readFile(process.env.VERI_YOLU, "utf8"));
    assert.equal(icerik.randevular.filter((r) => !r.iptal).length, 1);
  } finally {
    await s.kapat();
  }
});

test("API: paralel istekler aynı saati ÇAKMAZ (eşzamanlılık)", async () => {
  const s = await baslat();
  const tarih = yarin();
  try {
    const govde = (ad) =>
      JSON.stringify({ musteri: ad, calisan: "mehmet", hizmet: "fon", tarih, saat: "12:00" });
    const sonuclar = await Promise.all(
      Array.from({ length: 6 }, (_, i) =>
        fetch(s.kok + "/api/randevu", { method: "POST", body: govde("Müşteri " + i) }).then((r) => r.status)
      )
    );
    assert.equal(sonuclar.filter((k) => k === 201).length, 1, "yalnızca bir randevu başarılı olmalı");
    assert.equal(sonuclar.filter((k) => k === 409).length, 5);
  } finally {
    await s.kapat();
  }
});

test("API: geçersiz girişler 400/409 döner, sayfa servis edilir", async () => {
  const s = await baslat();
  try {
    const sahte = await fetch(s.kok + "/api/randevu", { method: "POST", body: "{bozuk json" });
    assert.equal(sahte.status, 400);

    const eksik = await fetch(s.kok + "/api/randevu", {
      method: "POST",
      body: JSON.stringify({ musteri: "X", calisan: "ayse", hizmet: "fon", tarih: "2026-01-01", saat: "10:00" }),
    });
    assert.equal(eksik.status, 409);

    const bugun = await fetch(s.kok + "/api/randevular?tarih=" + bugunYerel());
    assert.equal(bugun.status, 200);

    const bozukTarih = await fetch(s.kok + "/api/randevular?tarih=2026-13-40");
    assert.equal(bozukTarih.status, 400);

    const sayfa = await fetch(s.kok + "/");
    assert.equal(sayfa.status, 200);
    const html = await sayfa.text();
    assert.match(html, /Kuaför/);
    assert.match(html, /Randevuyu Onayla/);

    const bilinmeyenApi = await fetch(s.kok + "/api/yok");
    assert.equal(bilinmeyenApi.status, 404);

    const kacis = await fetch(s.kok + "/..%2f..%2fserver.js");
    assert.notEqual(kacis.status, 200, "path traversal engellenmeli");
  } finally {
    await s.kapat();
  }
});
