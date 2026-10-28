'use strict';

/**
 * server.js
 * Envanter/Stok Yönetim Sistemi — uygulama giriş noktası.
 * Express + EJS server-render + REST API hibriti.
 */

const path = require('path');
const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// --- Middleware ---
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- View enjini (EJS) ---
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts);
app.set('layout', 'layout');

// --- Statik dosyalar ---
// index:false çünkü '/' route'u dashboard (views/index.ejs) olmalı.
// public/index.html API belgeleri olarak /index.html adresinde kalır.
app.use(express.static(path.join(__dirname, 'public'), { index: false }));

// --- Routes bağlama ---
app.use('/api/products', require('./routes/products'));
app.use('/api/stock', require('./routes/stock'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/reports', require('./routes/reports'));

// --- HTML sayfa rotaları ---
const productModel = require('./models/productModel');
const stockModel = require('./models/stockModel');
const categoryModel = require('./models/categoryModel');
const reportService = require('./services/reportService');
const lowStockService = require('./services/lowStockService');

/** Dashboard: genel istatistik + son hareketler. */
app.get('/', (req, res) => {
  const products = productModel.readAll();
  const categories = categoryModel.readAll();
  const totalStockValue = products.reduce(
    (s, p) => s + Number(p.stock) * Number(p.unitPrice),
    0
  );
  const totalStockCount = products.reduce((s, p) => s + Number(p.stock), 0);
  const lowStockCount = lowStockService.countLowStock();
  const lowStockProducts = lowStockService.findLowStock().map((x) => x.product).slice(0, 5);

  const recentMovements = stockModel.getAll().slice(0, 6).map((m) => {
    const prod = products.find((p) => p.id === Number(m.productId));
    return { ...m, productName: prod ? prod.name : 'Silinmiş Ürün' };
  });

  const categorySummary = reportService.allCategorySummary();

  res.render('index', {
    title: 'Panel',
    totalProducts: products.length,
    totalStockValue,
    totalStockCount,
    lowStockCount,
    lowStockProducts,
    recentMovements,
    categorySummary,
    bodyClass: 'dashboard'
  });
});

/** Ürünler sayfası (önceden tanımlı route köküne yönlendirir). */
app.get('/products', (req, res) => res.redirect('/api/products'));

/** Hareketler sayfası yönlendirmesi. */
app.get('/movements', (req, res) => res.redirect('/api/stock/movements'));

/** Kategoriler sayfası yönlendirmesi. */
app.get('/categories', (req, res) => res.redirect('/api/categories'));

/** Rapor sayfası. */
app.get('/reports', (req, res) => res.redirect('/api/reports/category'));

// --- 404 handler ---
app.use((req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'Uç bulunamadı' });
  }
  res.status(404).send('<h1>404 — Sayfa bulunamadı</h1><a href="/">Panele dön</a>');
});

// --- Sunucuyu başlat ---
app.listen(PORT, () => {
  // Veri dizinini hazırla (varsayılan kategoriler olsun)
  categoryModel.readAll();
  console.log(`✔ Envanter/Stok yönetim sistemi çalışıyor → http://localhost:${PORT}`);
  console.log(`  Panel   : http://localhost:${PORT}/`);
  console.log(`  API     : http://localhost:${PORT}/api/products`);
});
