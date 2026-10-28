# PROJECT_MAP

> Numex tarafından üretildi · yaklaşık dosya (sığ tarama): 32

## Özet
- Paket: `envanter-stok-sistemi` @ 1.0.0
- Açıklama: Node/Express tabanlı envanter ve stok yönetim sistemi

## Dosya ağacı (2 seviye)
├── data/
│   ├── categories.json
│   ├── products.json
│   └── stockMovements.json
├── models/
│   ├── categoryModel.js
│   ├── productModel.js
│   └── stockModel.js
├── package-lock.json
├── package.json
├── PROJECT_MAP.md
├── public/
│   ├── css/
│   │   └── style.css
│   ├── index.html
│   └── js/
│       ├── categories.js
│       ├── products.js
│       └── reports.js
├── routes/
│   ├── categories.js
│   ├── products.js
│   ├── reports.js
│   └── stock.js
├── seed.js
├── server.js
├── services/
│   ├── lowStockService.js
│   └── reportService.js
├── syntaxcheck.js
└── views/
    ├── categories/
    │   ├── list.ejs
    │   └── new.ejs
    ├── index.ejs
    ├── layout.ejs
    ├── products/
    │   ├── detail.ejs
    │   ├── form.ejs
    │   └── list.ejs
    ├── reports/
    │   └── category.ejs
    └── stock/
        └── movements.ejs

## Üst dizinler
- `data/`
- `models/`
- `public/`
- `routes/`
- `services/`
- `views/`


## Giriş noktaları (aday)
- `server.js`

## Scriptler
- `npm run start`
- `npm run dev`
- `npm run seed`

## Son Değişiklikler
- `2026-08-19T02:43:18.088Z` · `C:/denemeler/test39/syntaxcheck.js` (write)
- `2026-08-19T02:40:55.284Z` · `C:/denemeler/test39/server.js` (write)
- `2026-08-19T02:40:34.363Z` · `C:/denemeler/test39/public/index.html` (write)
- `2026-08-19T02:40:34.355Z` · `C:/denemeler/test39/public/js/categories.js` (write)
- `2026-08-19T02:40:34.347Z` · `C:/denemeler/test39/public/js/reports.js` (write)
- `2026-08-19T02:40:34.337Z` · `C:/denemeler/test39/public/js/products.js` (write)
- `2026-08-19T02:39:51.364Z` · `C:/denemeler/test39/public/css/style.css` (write)
- `2026-08-19T02:39:38.537Z` · `C:/denemeler/test39/views/categories/new.ejs` (write)
- `2026-08-19T02:39:38.530Z` · `C:/denemeler/test39/views/categories/list.ejs` (write)
- `2026-08-19T02:39:38.523Z` · `C:/denemeler/test39/views/reports/category.ejs` (write)
- `2026-08-19T02:39:38.514Z` · `C:/denemeler/test39/views/stock/movements.ejs` (write)
- `2026-08-19T02:39:26.081Z` · `C:/denemeler/test39/views/products/detail.ejs` (write)
- `2026-08-19T02:39:26.071Z` · `C:/denemeler/test39/views/products/form.ejs` (write)
- `2026-08-19T02:39:26.063Z` · `C:/denemeler/test39/views/products/list.ejs` (write)
- `2026-08-19T02:39:08.067Z` · `C:/denemeler/test39/server.js` (write)
- `2026-08-19T02:38:45.172Z` · `C:/denemeler/test39/server.js` (write)
- `2026-08-19T02:38:45.141Z` · `C:/denemeler/test39/package.json` (write)
- `2026-08-19T02:38:37.886Z` · `C:/denemeler/test39/views/index.ejs` (write)
- `2026-08-19T02:38:37.875Z` · `C:/denemeler/test39/views/layout.ejs` (write)
- `2026-08-19T02:38:29.237Z` · `C:/denemeler/test39/seed.js` (write)

## Refactor notları
- Büyük değişiklik öncesi `proje_bilgi_ara` ile ilgili modülleri bul.
- Bağımsız işleri `alt_ajan_paralel` ile böl.
- Bu haritayı güncel tut: `numex harita` veya `proje_haritasi_uret`.
