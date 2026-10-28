/**
 * Kütüphane veri katmanı — kategoriler, raf bölümleri, masa yerleşimi.
 *
 * NOT: Bu dosya saf veridir; three.js import etmez. Geometri üreticileri
 * buradan okur, böylece yerleşimi değiştirmek için tek yer yeter.
 */

export interface Category {
  id: string;
  label: string;
  /** Hutbe/etiket rengi (hex) */
  color: number;
  /** Dewey benzeri kod aralığı */
  range: string;
  /** Kısa açıklama — tıklanınca panelde görünür */
  desc: string;
}

export const CATEGORIES: Category[] = [
  { id: 'edebiyat', label: 'Edebiyat', color: 0xc0392b, range: '800–899', desc: 'Roman, öykü, şiir ve deneme rafı. Türk ve dünya edebiyatı bir arada.' },
  { id: 'tarih', label: 'Tarih', color: 0x8e5a2b, range: '900–999', desc: 'Osmanlı, Cumhuriyet ve dünya tarihi; kronikler ve biyografiler.' },
  { id: 'bilim', label: 'Bilim & Teknik', color: 0x2471a3, range: '500–599', desc: 'Matematik, fizik, biyoloji ve mühendislik temel kaynakları.' },
  { id: 'felsefe', label: 'Felsefe', color: 0x6c3483, range: '100–199', desc: 'Antik çağdan çağdaş düşünceye felsefe klasikleri.' },
  { id: 'sanat', label: 'Sanat & Tasarım', color: 0xb9770e, range: '700–799', desc: 'Resim, mimarlık, müzik ve grafik tasarım albümleri.' },
  { id: 'cografya', label: 'Coğrafya & Seyahat', color: 0x1e8449, range: '910–919', desc: 'Atlaslar, haritalar, gezi notları ve bölge incelemeleri.' },
  { id: 'cocuk', label: 'Çocuk Kitapları', color: 0xd35400, range: 'Ç-000', desc: 'Okul öncesi ve ilkokul; resimli kitaplar, masal ve etkinlik.' },
  { id: 'hukuk', label: 'Hukuk & Sosyal', color: 0x566573, range: '340–349', desc: 'Mevzuat, anayasa, sosyoloji ve kamu yönetimi.' },
  { id: 'tip', label: 'Tıp & Sağlık', color: 0x148f77, range: '610–619', desc: 'Anatomi atlasları, halk sağlığı ve ilk yardım el kitapları.' },
  { id: 'dil', label: 'Dil & Sözlük', color: 0x9a7d0a, range: '400–499', desc: 'Sözlükler, dil bilgisi ve çeviri kuramı.' },
  { id: 'dijital', label: 'Bilişim', color: 0x2e4053, range: '004–006', desc: 'Yazılım, veri, yapay zekâ ve dijital okuryazarlık.' },
  { id: 'referans', label: 'Referans', color: 0x7d6608, range: '030–039', desc: 'Ansiklopediler, yıllıklar ve başvuru kaynakları (yalnız yerinde okunur).' },
];

export interface ShelfSlot {
  id: string;
  /** Raf ekseninin merkezi */
  x: number;
  z: number;
  /** 0 = z eksenine paralel (kuzey-güney), Math.PI/2 = x eksenine paralel */
  rotY: number;
  floor: 0 | 1;
  categoryIndex: number;
  /** Rafın uzunluğu (m) — kitap sığdırma hesabı bunu kullanır */
  length: number;
  /** Görünen etiket */
  label: string;
}

/**
 * 12 kitaplığın yerleşimi.
 *
 * Zemin katta 8, üst katta 4 kitaplık. Hepsi koridorlardan erişilebilir;
 * hiçbir raf bir kapının ya da merdivenin önünü kapatmaz.
 */
export const SHELVES: ShelfSlot[] = [
  // ---- ZEMİN KAT: sol blok (x = -8 ile -2 arası, z eksenine paralel) ----
  { id: 'S1', x: -11.5, z: 3.2, rotY: 0, floor: 0, categoryIndex: 0, length: 6.0, label: 'Edebiyat A' },
  { id: 'S2', x: -8.3, z: 3.2, rotY: 0, floor: 0, categoryIndex: 0, length: 6.0, label: 'Edebiyat B' },
  { id: 'S3', x: -5.1, z: 3.2, rotY: 0, floor: 0, categoryIndex: 1, length: 6.0, label: 'Tarih A' },
  { id: 'S4', x: -1.9, z: 3.2, rotY: 0, floor: 0, categoryIndex: 1, length: 6.0, label: 'Tarih B' },

  // ---- ZEMİN KAT: sağ kanat duvar rafları ----
  { id: 'S5', x: 13.4, z: 5.0, rotY: 0, floor: 0, categoryIndex: 2, length: 6.4, label: 'Bilim & Teknik' },
  { id: 'S6', x: 13.4, z: -1.8, rotY: 0, floor: 0, categoryIndex: 3, length: 6.4, label: 'Felsefe' },
  { id: 'S7', x: 13.4, z: -8.2, rotY: 0, floor: 0, categoryIndex: 7, length: 5.6, label: 'Hukuk & Sosyal' },
  { id: 'S8', x: 5.0, z: -9.4, rotY: Math.PI / 2, floor: 0, categoryIndex: 6, length: 6.0, label: 'Çocuk Kitapları' },

  // ---- ÜST KAT: atrium çevresi ----
  { id: 'S9', x: -11.6, z: -6.4, rotY: Math.PI / 2, floor: 1, categoryIndex: 4, length: 5.4, label: 'Sanat & Tasarım' },
  { id: 'S10', x: -11.0, z: 8.4, rotY: 0, floor: 1, categoryIndex: 5, length: 6.0, label: 'Coğrafya & Seyahat' },
  { id: 'S11', x: 11.4, z: 8.4, rotY: 0, floor: 1, categoryIndex: 10, length: 6.0, label: 'Bilişim' },
  { id: 'S12', x: 11.4, z: -8.6, rotY: Math.PI / 2, floor: 1, categoryIndex: 11, length: 5.0, label: 'Referans' },
];

export interface DeskSlot {
  id: string;
  x: number;
  z: number;
  rotY: number;
  floor: 0 | 1;
}

export const DESKS: DeskSlot[] = [
  // Zemin kat okuma salonu (girişin sağı)
  { id: 'D1', x: -1.0, z: -6.0, rotY: 0, floor: 0 },
  { id: 'D2', x: 3.2, z: -6.0, rotY: 0, floor: 0 },
  { id: 'D3', x: -1.0, z: -1.2, rotY: 0, floor: 0 },
  { id: 'D4', x: 3.2, z: -1.2, rotY: 0, floor: 0 },
  // Üst kat balkon okuma bölümü
  { id: 'D5', x: -1.2, z: 7.4, rotY: 0, floor: 1 },
  { id: 'D6', x: 3.4, z: 7.4, rotY: 0, floor: 1 },
  { id: 'D7', x: 7.6, z: 7.4, rotY: 0, floor: 1 },
];

/** Kat etiketleri (UI) */
export const FLOOR_LABELS = ['Zemin Kat', 'Birinci Kat'] as const;

/** Tıklanabilir kitaplık meta biçimi */
export interface ShelfMeta {
  kind: 'shelf';
  id: string;
  label: string;
  categoryId: string;
  categoryLabel: string;
  categoryColor: number;
  range: string;
  desc: string;
  floor: number;
  /** Bu raftaki kitap sayısı (üretimde ölçülür) */
  books: number;
  /** Raf bölme sayısı */
  compartments: number;
}
