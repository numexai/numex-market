// Basit doviz guncelleyici
async function dovizGuncelle() {
    try {
        const response = await fetch('/api/dovizler');
        const data = await response.json();
        
        data.forEach(function(item) {
            // Kur guncelle
            const kurElement = document.getElementById(item.id + '-kur');
            if (kurElement) {
                kurElement.textContent = '₺' + item.kur.toFixed(4);
            }
            
            // Degisim guncelle
            const degisimElement = document.getElementById(item.id + '-degisim');
            if (degisimElement) {
                const isUp = item.degisim >= 0;
                degisimElement.className = 'doviz-degisim ' + (isUp ? 'yukari' : 'asagi');
                degisimElement.innerHTML = '<span class="ok">' + (isUp ? '▲' : '▼') + '</span><span>' + (isUp ? '+' : '') + item.degisim.toFixed(2) + '%</span>';
            }
        });
        
        // Son guncelleme zamanini guncelle
        const now = new Date();
        const timeStr = now.toLocaleTimeString('tr-TR');
        document.getElementById('sonGuncelleme').textContent = timeStr;
        
    } catch (error) {
        console.error('Doviz guncelleme hatasi:', error);
    }
}

// Sayfa yuklendiginde baslat
window.addEventListener('DOMContentLoaded', function() {
    dovizGuncelle(); // Ilk yuklemede hemen guncelle
    setInterval(dovizGuncelle, 3000); // Her 3 saniyede bir guncelle
});
