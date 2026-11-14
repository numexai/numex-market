/* =========================================================
   NUMEX CORE — Flow Engine
   Güvenlik: HTTP düğümü için hedef doğrulama ve sınırlı istek.
   Özel/yerel ağ adresleri (SSRF) engellenir, yanıt boyutu ve
   süre sınırlanır.
   ========================================================= */

const YASAK_ADRESLER = [
  /^localhost$/i,
  /^0\.0\.0\.0$/,
  /^127\./,
  /^10\./,
  /^192\.168\./,
  /^169\.254\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^\[?::1\]?$/i,
  /^\[?fc/i,   // ULA IPv6
  /^\[?fe80/i, // link-local IPv6
  /^\[?::ffff:/i // IPv4-mapped
];

/** Adresin özel/yerel olup olmadığını tespit eder */
function yerelMi(hostname) {
  return YASAK_ADRESLER.some(r => r.test(hostname));
}

/**
 * Hedef URL'yi doğrular. Geçersizse hata fırlatır.
 * NUMEX: yalnız http/https; özel ağ ve loopback reddedilir.
 */
export async function hedefDogrula(url) {
  let u;
  try {
    u = new URL(url);
  } catch {
    throw new Error("Geçersiz URL");
  }
  if (u.protocol !== "http:" && u.protocol !== "https:") {
    throw new Error("Yalnızca http/https adreslerine izin verilir");
  }
  const host = u.hostname.toLowerCase();
  if (!host) throw new Error("URL'de host yok");
  if (host === "metadata.google.internal" || yerelMi(host)) {
    throw new Error("Özel/yerel ağ adreslerine istek engellendi");
  }
  return u;
}

/**
 * Zaman aşımı ve boyut sınırlı fetch.
 * @returns {Promise<{durum:number, sonUrl:string, icerikTuru:string, boyut:number, veri:any}>}
 */
export async function guvenliIstek({ url, method = "GET", headers = {}, body, timeout = 8000, maxBoyut = 262144 }) {
  const ctrl = new AbortController();
  const zil = setTimeout(() => ctrl.abort(new Error("İstek zaman aşımına uğradı")), timeout);

  try {
    const yanit = await fetch(url, {
      method,
      headers,
      body,
      signal: ctrl.signal,
      redirect: "follow",
      credentials: "omit"
    });

    // Yönlendirme sonrası hedefi yeniden doğrula (iç ağa sıçrama koruması)
    await hedefDogrula(yanit.url);

    const icerikTuru = yanit.headers.get("content-type") || "";

    // Akış hâlinde oku, boyut sınırını aşarsa kes
    const okuyucu = yanit.body?.getReader();
    let boyut = 0;
    const parcalar = [];
    if (okuyucu) {
      while (true) {
        const { done, value } = await okuyucu.read();
        if (done) break;
        boyut += value.byteLength;
        if (boyut > maxBoyut) {
          await okuyucu.cancel();
          throw new Error(`Yanıt boyutu sınırı aştı (${maxBoyut} bayt)`);
        }
        parcalar.push(value);
      }
    }

    const metin = new TextDecoder().decode(birlestir(parcalar));
    let veri = metin;
    if (icerikTuru.includes("json")) {
      try { veri = JSON.parse(metin); } catch { veri = metin; }
    }

    return { durum: yanit.status, sonUrl: yanit.url, icerikTuru, boyut, veri };
  } finally {
    clearTimeout(zil);
  }
}

function birlestir(parcalar) {
  const toplam = parcalar.reduce((a, p) => a + p.byteLength, 0);
  const birlesik = new Uint8Array(toplam);
  let konum = 0;
  for (const p of parcalar) {
    birlesik.set(p, konum);
    konum += p.byteLength;
  }
  return birlesik;
}
