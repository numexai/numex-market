const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

function crc32(buf) {
  let c;
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    c = n;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[n] = c;
  }
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = table[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crcBuf = Buffer.alloc(4);
  const crcVal = crc32(Buffer.concat([typeBuf, data]));
  crcBuf.writeUInt32BE(crcVal, 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function create24BitPNG(width, height, drawFn) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // bit depth
  ihdrData[9] = 2; // color type RGB (24-bit no alpha as requested by Chrome Web Store!)
  ihdrData[10] = 0;
  ihdrData[11] = 0;
  ihdrData[12] = 0;
  const ihdr = makeChunk('IHDR', ihdrData);

  const rawLines = [];
  for (let y = 0; y < height; y++) {
    const line = Buffer.alloc(1 + width * 3);
    line[0] = 0; // Filter 0
    for (let x = 0; x < width; x++) {
      const rgb = drawFn(x, y, width, height);
      const idx = 1 + x * 3;
      line[idx] = rgb[0];
      line[idx + 1] = rgb[1];
      line[idx + 2] = rgb[2];
    }
    rawLines.push(line);
  }

  const uncompressed = Buffer.concat(rawLines);
  const compressed = zlib.deflateSync(uncompressed);
  const idat = makeChunk('IDAT', compressed);
  const iend = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([sig, ihdr, idat, iend]);
}

const targetDir = __dirname;

// 1. Icon 128x128 (RGBA 32-bit PNG)
function create32BitPNG(width, height, drawFn) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8;
  ihdrData[9] = 6; // RGBA
  ihdrData[10] = 0;
  ihdrData[11] = 0;
  ihdrData[12] = 0;
  const ihdr = makeChunk('IHDR', ihdrData);

  const rawLines = [];
  for (let y = 0; y < height; y++) {
    const line = Buffer.alloc(1 + width * 4);
    line[0] = 0;
    for (let x = 0; x < width; x++) {
      const rgba = drawFn(x, y, width, height);
      const idx = 1 + x * 4;
      line[idx] = rgba[0];
      line[idx + 1] = rgba[1];
      line[idx + 2] = rgba[2];
      line[idx + 3] = rgba[3];
    }
    rawLines.push(line);
  }

  const uncompressed = Buffer.concat(rawLines);
  const compressed = zlib.deflateSync(uncompressed);
  const idat = makeChunk('IDAT', compressed);
  const iend = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([sig, ihdr, idat, iend]);
}

// 1. Icon 128x128
const iconBuf = create32BitPNG(128, 128, (x, y, w, h) => {
  const cx = w / 2;
  const cy = h / 2;
  const dx = (x - cx) / (w / 2);
  const dy = (y - cy) / (h / 2);
  const dist = Math.sqrt(dx * dx + dy * dy);

  if (dist <= 0.85) {
    if (Math.abs(dx) < 0.4 && dy > -0.5 && dy < 0.5) {
      if (dy > -0.3 && dy < 0.0 && Math.abs(dx) < 0.25) return [56, 189, 248, 255]; // Glass
      return [239, 68, 68, 255]; // Red Sports Car
    }
    return [15, 23, 42, 255]; // Dark background
  }
  return [0, 0, 0, 0];
});
fs.writeFileSync(path.join(targetDir, 'magaza_simgesi_128x128.png'), iconBuf);

// 2. Screenshot 640x400 (24-bit PNG no alpha channel as required by Chrome Web Store!)
const ssBuf = create24BitPNG(640, 400, (x, y, w, h) => {
  // Highway road preview
  if (x > 150 && x < 490) {
    // Asphalt
    if ((x > 225 && x < 229) || (x > 315 && x < 319) || (x > 405 && x < 409)) {
      if ((y % 40) < 22) return [255, 255, 255]; // Dashed lines
    }
    // Player Red Car
    if (Math.abs(x - 320) < 20 && Math.abs(y - 300) < 36) {
      return [239, 68, 68];
    }
    // Traffic Car
    if (Math.abs(x - 230) < 20 && Math.abs(y - 120) < 36) {
      return [2, 132, 199];
    }
    return [51, 65, 85]; // Dark Road
  }
  return [21, 128, 61]; // Grass sides
});
fs.writeFileSync(path.join(targetDir, 'ekran_goruntusu_640x400.png'), ssBuf);

// 3. Promo Tile 440x280 (24-bit PNG)
const promoBuf = create24BitPNG(440, 280, (x, y, w, h) => {
  // Vibrant Super Racing Gradient
  const ratio = (x + y) / (w + h);
  const r = Math.floor(185 * (1 - ratio) + 2 * ratio);
  const g = Math.floor(28 * (1 - ratio) + 132 * ratio);
  const b = Math.floor(28 * (1 - ratio) + 199 * ratio);
  return [r, g, b];
});
fs.writeFileSync(path.join(targetDir, 'kucuk_tanitim_440x280.png'), promoBuf);

console.log('Store images created successfully!');
