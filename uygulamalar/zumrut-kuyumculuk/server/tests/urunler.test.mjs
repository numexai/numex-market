import { describe, it, expect } from 'vitest';
import { urunleriGetir, urunGetir, KATEGORILER } from '../data/urunler.js';

describe('urunleriGetir', () => {
  it('kategorisiz çağrıda tüm ürünleri döner', () => {
    const liste = urunleriGetir();
    expect(liste.length).toBeGreaterThanOrEqual(10);
  });

  it('"tumu" parametresi tüm listeyi döner', () => {
    expect(urunleriGetir('tumu').length).toBe(urunleriGetir().length);
  });

  it('kategori filtresini uygular', () => {
    const bilezikler = urunleriGetir('bilezik');
    expect(bilezikler.length).toBeGreaterThan(0);
    expect(bilezikler.every((u) => u.kategori === 'bilezik')).toBe(true);
  });

  it('dönen kopya mutasyondan bağımsızdır', () => {
    const ilk = urunleriGetir();
    ilk[0].ad = 'DEĞİŞTİRİLDİ';
    const ikinci = urunleriGetir();
    expect(ikinci[0].ad).not.toBe('DEĞİŞTİRİLDİ');
  });

  it('her ürünün id değeri benzersizdir', () => {
    const idler = urunleriGetir().map((u) => u.id);
    expect(new Set(idler).size).toBe(idler.length);
  });

  it('tüm kategoriler KATEGORILER listesinde tanımlı', () => {
    const anahtarlar = KATEGORILER.map((k) => k.anahtar);
    for (const urun of urunleriGetir()) {
      expect(anahtarlar).toContain(urun.kategori);
    }
  });
});

describe('urunGetir', () => {
  it('var olan id ile ürünü döner', () => {
    const urun = urunGetir(1);
    expect(urun).not.toBeNull();
    expect(urun.id).toBe(1);
  });

  it('string id değerini kabul eder', () => {
    expect(urunGetir('2').id).toBe(2);
  });

  it('olmayan id için null döner', () => {
    expect(urunGetir(99999)).toBeNull();
  });

  it('geçersiz id için null döner', () => {
    expect(urunGetir('abc')).toBeNull();
    expect(urunGetir(undefined)).toBeNull();
  });
});
