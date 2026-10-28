async function havaGuncelle() {
    try {
        const response = await fetch('/api/hava');
        const data = await response.json();
        
        data.forEach(function(item) {
            const sicaklikElement = document.getElementById(item.id + '-sicaklik');
            const nemElement = document.getElementById(item.id + '-nem');
            const ruzgarElement = document.getElementById(item.id + '-ruzgar');
            
            if (sicaklikElement) {
                sicaklikElement.textContent = Math.round(item.sicaklik) + '°C';
            }
            
            if (nemElement) {
                nemElement.textContent = '%' + Math.round(item.nem);
            }
            
            if (ruzgarElement) {
                ruzgarElement.textContent = Math.round(item.ruzgar) + ' km/s';
            }
        });
        
        const now = new Date();
        const timeStr = now.toLocaleTimeString('tr-TR');
        document.getElementById('son-guncelleme').textContent = timeStr;
        
    } catch (error) {
        console.error('Hava durumu güncelleme hatası:', error);
    }
}

window.addEventListener('DOMContentLoaded', function() {
    havaGuncelle();
    setInterval(havaGuncelle, 3000);
});
