// Veritabani semasi — kalici veri katmani (SQLite, WAL)
// Butunluk kurallari veritabanina GOMULU tutulur (CHECK + trigger), boylece
// uygulama hatasi olsa bile negatif stok / cift tahsilat diski uzerinde olusamaz.

export const SCHEMA_SQL = `
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS customers (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  ad            TEXT NOT NULL,
  telefon       TEXT NOT NULL,
  email         TEXT,
  adres         TEXT,
  olusturma     TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS products (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  sku           TEXT NOT NULL UNIQUE,
  ad            TEXT NOT NULL,
  birim_fiyat   INTEGER NOT NULL CHECK (birim_fiyat >= 0),   -- kurus
  stok          INTEGER NOT NULL CHECK (stok >= 0),          -- DB seviyesinde negatif stok imkansiz
  rezerve       INTEGER NOT NULL DEFAULT 0 CHECK (rezerve >= 0),
  tedarik_gun   INTEGER NOT NULL DEFAULT 3                  -- tedarikci termin suresi (gun)
);

-- Stok degismezleri: hicbir yazma yolu negatif stok ya da negatif rezerve uretemez.
-- (Kullanilabilir stok = stok - rezerve >= 0 kurali rezervasyon UPDATE'inin WHERE kosulunda uygulanir.)
CREATE TRIGGER IF NOT EXISTS trg_products_stok_guard
BEFORE UPDATE OF stok, rezerve ON products
WHEN NEW.stok < 0 OR NEW.rezerve < 0
BEGIN
  SELECT RAISE(ABORT, 'STOK_IHLALI');
END;

CREATE TABLE IF NOT EXISTS orders (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  musteri_id      INTEGER NOT NULL REFERENCES customers(id),
  durum           TEXT NOT NULL DEFAULT 'REZERVE',
  -- REZERVE | ODENDI | HAZIRLANIYOR | YOLDA | TESLIM_EDILDI | IPTAL
  toplam_kurus    INTEGER NOT NULL CHECK (toplam_kurus >= 0),
  idempotency_key TEXT UNIQUE,                               -- ayni istek iki kez siparis acamaz
  risk_seviyesi   TEXT NOT NULL DEFAULT 'YOK',               -- YOK | DUSUK | ORTA | YUKSEK
  risk_gerekce    TEXT,
  olusturma       TEXT NOT NULL,
  odeme_zamani    TEXT,
  teslim_tarihi   TEXT,
  hedef_teslim    TEXT
);

CREATE TABLE IF NOT EXISTS order_items (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id    INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id  INTEGER NOT NULL REFERENCES products(id),
  adet        INTEGER NOT NULL CHECK (adet > 0),
  birim_fiyat INTEGER NOT NULL CHECK (birim_fiyat >= 0)
);

CREATE TABLE IF NOT EXISTS payments (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id        INTEGER NOT NULL REFERENCES orders(id),
  tutar_kurus     INTEGER NOT NULL CHECK (tutar_kurus >= 0),
  durum           TEXT NOT NULL,                             -- BASLATILDI | BASARILI | BASARISIZ
  idempotency_key TEXT NOT NULL,
  islem_no        TEXT,
  olusturma       TEXT NOT NULL,
  guncelleme      TEXT
);
-- MUKERRER TAHSILAT KALKANI: ayni siparis icin BASARILI odeme yalniz bir tane olabilir.
CREATE UNIQUE INDEX IF NOT EXISTS ux_payments_basarili
  ON payments(order_id) WHERE durum = 'BASARILI';
-- Ayni idempotency anahtariyla ikinci odeme kaydi acilamaz.
CREATE UNIQUE INDEX IF NOT EXISTS ux_payments_idem
  ON payments(idempotency_key);

CREATE TABLE IF NOT EXISTS shipments (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id      INTEGER NOT NULL REFERENCES orders(id),
  durum         TEXT NOT NULL,                               -- HAZIRLANIYOR | YOLDA | TESLIM_EDILDI
  takip_no      TEXT,
  cikis         TEXT,
  tahmini_varis TEXT,
  teslim        TEXT
);

CREATE TABLE IF NOT EXISTS stock_moves (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL REFERENCES products(id),
  delta      INTEGER NOT NULL,                               -- -adet (rezerve) / +adet (iade)
  sebep      TEXT NOT NULL,                                  -- SIPARIS_REZERVE | IPTAL_IADE | TESLIM
  order_id   INTEGER,
  olusturma  TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS ops_log (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  zaman     TEXT NOT NULL,
  tur       TEXT NOT NULL,        -- AKTOR_ISLEM | RISK | YETKI_REDDI | KARAR | KURTARMA | IZLEME
  baslik    TEXT NOT NULL,
  detay     TEXT
);

CREATE TABLE IF NOT EXISTS decisions (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  zaman        TEXT NOT NULL,
  gozlem       TEXT NOT NULL,
  risk         TEXT NOT NULL,
  karar        TEXT NOT NULL,
  gerekce      TEXT NOT NULL,
  yetki        TEXT NOT NULL,
  yapilmayan   TEXT NOT NULL,
  dogrulama    TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS outbox (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  tur       TEXT NOT NULL,
  payload   TEXT NOT NULL,
  durum     TEXT NOT NULL DEFAULT 'BEKLIYOR',   -- BEKLIYOR | ISLENDI
  olusturma TEXT NOT NULL
);
`;
