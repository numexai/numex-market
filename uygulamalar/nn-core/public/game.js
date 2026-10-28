/* Neon sinir ışıkları evren gibi hareket ediyor */
const canvas = document.getElementById('neon-canvas');
const ctx = canvas.getContext('2d');

let stars = [];
for (let i = 0; i < 200; i++) {
  stars.push({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    size: Math.random() * 2 + 1,
    speed: Math.random() * 0.5 + 0.2
  });
}

function animate() {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  stars.forEach(star => {
    ctx.fillStyle = `hsl(${Math.random() * 360}, 100%, 50%)`;
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
    ctx.fill();
    
    star.y += star.speed;
    if (star.y > canvas.height) {
      star.y = -star.size;
      star.x = Math.random() * canvas.width;
    }
  });
  
  requestAnimationFrame(animate);
}

// Neon sinir efektleri
function drawNeonLines() {
  ctx.strokeStyle = 'hsl(200, 100%, 80%)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  
  let x = Math.random() * canvas.width;
  let y = Math.random() * canvas.height;
  
  for (let i = 0; i < 10; i++) {
    ctx.moveTo(x, y);
    x += Math.random() * 20 - 10;
    y += Math.random() * 20 - 10;
    ctx.lineTo(x, y);
  }
  
  ctx.stroke();
  
  requestAnimationFrame(drawNeonLines);
}

animate();
requestAnimationFrame(drawNeonLines);

// Neon pulsing effect
setInterval(() => {
  canvas.style.filter = `contrast(${Math.random() * 0.3 + 0.7}) brightness(${Math.random() * 0.2 + 0.8})`;
}, 100);
