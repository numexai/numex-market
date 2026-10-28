const express = require('express');
const router = express.Router();

// Döviz verileri (gerçek zamanlı simülasyon)
const dovizler = [
    { 
        id: 'usd', 
        ad: 'Amerikan Doları', 
        sembol: 'USD', 
        icon: '💵',
        kur: 32.45,
        degisim: +0.15,
        yon: 'yukari'
    },
    { 
        id: 'eur', 
        ad: 'Euro', 
        sembol: 'EUR', 
        icon: '💶',
        kur: 35.28,
        degisim: -0.08,
        yon: 'asagi'
    },
    { 
        id: 'gbp', 
        ad: 'İngiliz Sterlini', 
        sembol: 'GBP', 
        icon: '💷',
        kur: 41.12,
        degisim: +0.22,
        yon: 'yukari'
    },
    { 
        id: 'gold', 
        ad: 'Gram Altın', 
        sembol: 'XAU', 
        icon: '🪙',
        kur: 2450.75,
        degisim: +12.30,
        yon: 'yukari'
    }
];

// Tüm dövizleri getir
router.get('/dovizler', (req, res) => {
    // Küçük rastgele dalgalanma ekle (gerçek zamanlı hissi)
    const guncelDovizler = dovizler.map(d => {
        const dalgalanma = (Math.random() - 0.5) * 0.1;
        const yeniKur = parseFloat((d.kur + dalgalanma).toFixed(4));
        const yeniDegisim = parseFloat((d.degisim + dalgalanma).toFixed(2));
        return {
            ...d,
            kur: yeniKur,
            degisim: yeniDegisim,
            yon: yeniDegisim >= 0 ? 'yukari' : 'asagi'
        };
    });
    res.json(guncelDovizler);
});

// Tek döviz getir
router.get('/dovizler/:id', (req, res) => {
    const doviz = dovizler.find(d => d.id === req.params.id);
    if (doviz) {
        const dalgalanma = (Math.random() - 0.5) * 0.1;
        const yeniKur = parseFloat((doviz.kur + dalgalanma).toFixed(4));
        const yeniDegisim = parseFloat((doviz.degisim + dalgalanma).toFixed(2));
        res.json({
            ...doviz,
            kur: yeniKur,
            degisim: yeniDegisim,
            yon: yeniDegisim >= 0 ? 'yukari' : 'asagi'
        });
    } else {
        res.status(404).json({ error: 'Döviz bulunamadı' });
    }
});

module.exports = router;
