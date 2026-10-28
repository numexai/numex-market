const express = require('express');
const router = express.Router();

const sehirler = [
    { id: 'istanbul', ad: 'İstanbul', sicaklik: 22, nem: 65, ruzgar: 12, ikon: '⛅' },
    { id: 'ankara', ad: 'Ankara', sicaklik: 18, nem: 55, ruzgar: 8, ikon: '☀️' },
    { id: 'izmir', ad: 'İzmir', sicaklik: 25, nem: 60, ruzgar: 15, ikon: '☀️' },
    { id: 'antalya', ad: 'Antalya', sicaklik: 28, nem: 70, ruzgar: 10, ikon: '☀️' }
];

router.get('/hava', (req, res) => {
    const guncel = sehirler.map(s => ({
        ...s,
        sicaklik: s.sicaklik + (Math.random() - 0.5),
        nem: Math.max(0, Math.min(100, s.nem + (Math.random() - 0.5) * 5)),
        ruzgar: Math.max(0, s.ruzgar + (Math.random() - 0.5) * 3)
    }));
    res.json(guncel);
});

router.get('/hava/:id', (req, res) => {
    const sehir = sehirler.find(s => s.id === req.params.id);
    if (!sehir) return res.status(404).json({ hata: 'Şehir bulunamadı' });
    
    const guncel = {
        ...sehir,
        sicaklik: sehir.sicaklik + (Math.random() - 0.5),
        nem: Math.max(0, Math.min(100, sehir.nem + (Math.random() - 0.5) * 5)),
        ruzgar: Math.max(0, sehir.ruzgar + (Math.random() - 0.5) * 3)
    };
    res.json(guncel);
});

module.exports = router;
