// Kuaför randevu sunucusu — harici bağımlılık yok (saf Node http + fs).
// Veriler data.json içinde tutulur. Yazma akışı serileştirilir: aynı anda gelen iki randevu isteği
// sıraya girer, aksi halde ikisi de "boş" görüp aynı saati çakabilirdi.
import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import {
  HIZMETLER,
  CALISANLAR,
  bosSaatler,
  randevuOlustur,
  gunRandevulari,
  bugunYerel,
  tarihGecerliMi,
  hizmetBul,
  calisanBul,
} from "./lib/randevu.js";

const KOK = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC = path.join(KOK, "public");
// Yol her okumada/yazmada değerlendirilir: testler geçici veri dosyasını kendi sürecinde ayarlar.
const veriYolu = () => process.env.VERI_YOLU || path.join(KOK, "data.json");
const PORT = Number(process.env.PORT || 4174);

// ---------- kalıcılık ----------
async function veriOku() {
  try {
    const metin = await fs.readFile(veriYolu(), "utf8");
    const veri = JSON.parse(metin);
    return { randevular: Array.isArray(veri.randevular) ? veri.randevular : [] };
  } catch (hata) {
    if (hata.code === "ENOENT") return { randevular: [] };
    throw hata;
  }
}

async function veriYaz(veri) {
  const hedef = veriYolu();
  const gecici = `${hedef}.tmp-${process.pid}-${Date.now()}`;
  await fs.writeFile(gecici, JSON.stringify(veri, null, 2), "utf8");
  await fs.rename(gecici, hedef); // atomik: yarım yazılmış JSON kalmaz
}

// Yazma kilidi: işler zincir halinde sırayla çalışır
let kuyruk = Promise.resolve();
function kilitli(is) {
  const sonuc = kuyruk.then(is, is);
  kuyruk = sonuc.catch(() => {});
  return sonuc;
}

export function yeniId() {
  return `r-${Date.now().toString(36)}-${crypto.randomBytes(3).toString("hex")}`;
}

// ---------- yardımcılar ----------
const TIPLER = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

function jsonCevapla(res, kod, govde) {
  const metin = JSON.stringify(govde);
  res.writeHead(kod, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  res.end(metin);
}

async function govdeOku(req) {
  const parcalar = [];
  let boyut = 0;
  for await (const parca of req) {
    boyut += parca.length;
    if (boyut > 100_000) throw Object.assign(new Error("Gövde çok büyük"), { kod: 413 });
    parcalar.push(parca);
  }
  if (!parcalar.length) return {};
  try {
    return JSON.parse(Buffer.concat(parcalar).toString("utf8"));
  } catch {
    throw Object.assign(new Error("Geçersiz JSON gövdesi"), { kod: 400 });
  }
}

/** URL path traversal denetimi: çözülmüş yol PUBLIC içinde kalmalı */
function publicYolu(istekYolu) {
  // NUMEX-DÜZELTME (2026-11-20): Bozuk yüzde kodlaması içeren istek yolu (ör. /..%2f..%2fserver.js) decodeURIComponent'te URIError fırlatıp 500 veriyor ve konsola yığın izi basıyordu; artık 400 ile sessizce reddediliyor.
  let temiz;
  try {
    temiz = decodeURIComponent(istekYolu.split("?")[0]);
  } catch {
    return null; // bozuk yüzde kodlaması → geçersiz yol
  }
  const istenen = temiz === "/" ? "/index.html" : temiz;
  const tam = path.resolve(PUBLIC, "." + istenen);
  if (!tam.startsWith(PUBLIC + path.sep) && tam !== path.join(PUBLIC, "index.html")) return null;
  return tam;
}

// ---------- API ----------
async function apiIstek(req, res, url) {
  const yol = url.pathname.replace(/\/+$/, "") || "/api";

  if (req.method === "GET" && yol === "/api/hizmetler") {
    return jsonCevapla(res, 200, { hizmetler: HIZMETLER, calisanlar: CALISANLAR });
  }

  // GET /api/saatler?calisan=ayse&tarih=2026-11-20&hizmet=boya
  if (req.method === "GET" && yol === "/api/saatler") {
    const calisan = url.searchParams.get("calisan");
    const tarih = url.searchParams.get("tarih");
    const hizmet = url.searchParams.get("hizmet");
    if (!calisanBul(calisan)) return jsonCevapla(res, 400, { hata: "Geçersiz çalışan." });
    if (!hizmetBul(hizmet)) return jsonCevapla(res, 400, { hata: "Geçersiz hizmet." });
    if (!tarihGecerliMi(tarih)) return jsonCevapla(res, 400, { hata: "Geçersiz tarih." });
    const veri = await veriOku();
    return jsonCevapla(res, 200, { saatler: bosSaatler(veri.randevular, { calisan, tarih, hizmet }) });
  }

  // POST /api/randevu
  if (req.method === "POST" && yol === "/api/randevu") {
    const govde = await govdeOku(req);
    const sonuc = await kilitli(async () => {
      const veri = await veriOku();
      const cevap = randevuOlustur(veri.randevular, govde, { bugun: bugunYerel(), yeniId });
      if (cevap.hata) return cevap;
      veri.randevular.push(cevap.randevu);
      await veriYaz(veri);
      return cevap;
    });
    if (sonuc.hata) return jsonCevapla(res, 409, { hata: sonuc.hata, kod: sonuc.kod });
    return jsonCevapla(res, 201, { randevu: sonuc.randevu });
  }

  // GET /api/randevular?tarih=2026-11-20  → yönetici ekranı (saat sırasıyla)
  if (req.method === "GET" && yol === "/api/randevular") {
    const tarih = url.searchParams.get("tarih") || bugunYerel();
    if (!tarihGecerliMi(tarih)) return jsonCevapla(res, 400, { hata: "Geçersiz tarih." });
    const veri = await veriOku();
    const liste = gunRandevulari(veri.randevular, tarih);
    return jsonCevapla(res, 200, { tarih, randevular: liste });
  }

  // DELETE /api/randevu/:id → iptal (kayıt silinmez, iptal işareti konur; saat yeniden boşa düşer)
  const silme = yol.match(/^\/api\/randevu\/([^/]+)$/);
  if (req.method === "DELETE" && silme) {
    const id = decodeURIComponent(silme[1]);
    const sonuc = await kilitli(async () => {
      const veri = await veriOku();
      const r = veri.randevular.find((x) => x.id === id);
      if (!r) return { kod: 404, hata: "Randevu bulunamadı." };
      if (r.iptal) return { kod: 409, hata: "Bu randevu zaten iptal edilmiş." };
      r.iptal = true;
      r.iptalTarihi = new Date().toISOString();
      await veriYaz(veri);
      return { kod: 200, randevu: r };
    });
    if (sonuc.hata) return jsonCevapla(res, sonuc.kod, { hata: sonuc.hata });
    return jsonCevapla(res, 200, { randevu: sonuc.randevu });
  }

  return jsonCevapla(res, 404, { hata: "Bilinmeyen API yolu." });
}

// ---------- statik dosyalar ----------
async function statikIstek(req, res, url) {
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.writeHead(405, { Allow: "GET, HEAD" });
    return res.end("Yöntem desteklenmiyor");
  }
  const tam = publicYolu(url.pathname);
  if (!tam) {
    res.writeHead(400, { "Content-Type": "text/plain; charset=utf-8" });
    return res.end("Geçersiz yol");
  }
  try {
    const icerik = await fs.readFile(tam);
    const tip = TIPLER[path.extname(tam).toLowerCase()] || "application/octet-stream";
    res.writeHead(200, { "Content-Type": tip, "Cache-Control": "no-cache" });
    res.end(req.method === "HEAD" ? undefined : icerik);
  } catch (hata) {
    if (hata.code === "ENOENT" || hata.code === "EISDIR") {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      return res.end("Bulunamadı");
    }
    res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Sunucu hatası");
  }
}

// ---------- sunucu ----------
export function sunucuOlustur() {
  return http.createServer(async (req, res) => {
    const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
    try {
      // İstekler HTTP katmanında paralel; çakışma yazma kilidi + atomik rename ile önlenir.
      if (url.pathname === "/api" || url.pathname.startsWith("/api/")) {
        await apiIstek(req, res, url);
      } else {
        await statikIstek(req, res, url);
      }
    } catch (hata) {
      const kod = hata.kod && hata.kod >= 400 ? hata.kod : 500;
      if (kod === 500) console.error("Sunucu hatası:", hata);
      if (!res.headersSent) jsonCevapla(res, kod, { hata: hata.message || "Sunucu hatası" });
    }
  });
}

// Doğrudan çalıştırıldığında dinlemeye başla (testler sunucuOlustur'u kendisi kullanır)
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const sunucu = sunucuOlustur();
  const dene = (port) => {
    sunucu.once("error", (hata) => {
      if (hata.code === "EADDRINUSE") {
        console.warn(`Port ${port} dolu, ${port + 1} deneniyor...`);
        dene(port + 1);
      } else throw hata;
    });
    sunucu.listen(port, () => {
      console.log(`Kuaför randevu sunucusu: http://localhost:${port}`);
      console.log(`Yönetici ekranı: http://localhost:${port}/#yonetici`);
    });
  };
  dene(PORT);
}
