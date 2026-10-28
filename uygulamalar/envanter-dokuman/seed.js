'use strict';

/**
 * seed.js
 * İsteğe bağlı örnek veri yükleyici — npm run seed ile çalışır.
 * Dashboard'u dolu göstermek için örnek ürünler ve hareketler oluşturur.
 */

const productModel = require('./models/productModel');
const stockModel = require('./models/stockModel');
const categoryModel = require('./models/categoryModel');

const sampleProducts = [
  { name: 'Ultrabook Laptop', categoryId: 1, unitPrice: 25000, stock: 8, minimumStock: 10 },
  { name: 'Kablosuz Kulaklık', categoryId: 1, unitPrice: 1500, stock: 3, minimumStock: 8 },
  { name: 'Mekanik Klavye', categoryId: 1, unitPrice: 2200, stock: 12, minimumStock: 5 },
  { name: 'Zeytinyağı 5L', categoryId: 2, unitPrice: 850, stock: 20, minimumStock: 15 },
  { name: 'Fındık 1kg', categoryId: 2, unitPrice: 180, stock: 2, minimumStock: 10 },
  { name: 'Tişört (S)', categoryId: 3, unitPrice: 350, stock: 40, minimumStock: 20 },
  { name: 'Kot Pantolon', categoryId: 3, unitPrice: 1200, stock: 9, minimumStock: 12 },
  { name: 'Ofis Koltuğu', categoryId: 4, unitPrice: 4500, stock: 6, minimumStock: 6 },
  { name: 'Maske Kutusu', categoryId: 4, unitPrice: 90, stock: 60, minimumStock: 30 }
];

function run() {
  categoryModel.readAll(); // varsayılan kategorileri oluştur

  const created = sampleProducts.map((p) => productModel.create(p));

  // Bazı örnek giriş/çıkış hareketleri
  const samples = [
    { pi: created[0], type: 'out', qty: 2, note: 'Satış' },
    { pi: created[2], type: 'in', qty: 5, note: 'Tedarikçi sevkiyatı' },
    { pi: created[1], type: 'out', qty: 1, note: 'Satış' },
    { pi: created[4], type: 'in', qty: 8, note: 'Toptan alım' },
    { pi: created[5], type: 'in', qty: 25, note: 'Sezon stoku' },
    { pi: created[7], type: 'out', qty: 3, note: 'Ofis kullanımı' }
  ];

  for (const s of samples) {
    const qty = s.qty;
    const newStock =
      s.type === 'in' ? Number(s.pi.stock) + qty : Number(s.pi.stock) - qty;
    productModel.update(s.pi.id, { stock: newStock });
    stockModel.addMovement({
      productId: s.pi.id,
      type: s.type,
      quantity: qty,
      note: s.note,
      remainingStock: newStock
    });
  }

  console.log(`✔ Seed tamam: ${created.length} ürün ve örnek hareketler eklendi.`);
}

run();
