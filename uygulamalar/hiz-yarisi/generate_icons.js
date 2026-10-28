const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// Standard CRC32 calculation for PNG chunk checksums
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

function createPNG(width, height) {
  // Signature
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // bit depth
  ihdrData[9] = 6; // color type RGBA
  ihdrData[10] = 0; // compression
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // interlace
  const ihdr = makeChunk('IHDR', ihdrData);

  // IDAT - Pixel generation (Car Icon: MSN Teal/Blue background with Red Sports Car outline)
  const rawLines = [];
  const cx = width / 2;
  const cy = height / 2;

  for (let y = 0; y < height; y++) {
    const line = Buffer.alloc(1 + width * 4);
    line[0] = 0; // filter type 0 (None)
    for (let x = 0; x < width; x++) {
      const idx = 1 + x * 4;
      const dx = (x - cx) / (width / 2);
      const dy = (y - cy) / (height / 2);
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Background rounded square / circle gradient
      if (dist <= 0.85) {
        // MSN Blue / Dark gradient background
        line[idx] = 15;     // R
        line[idx + 1] = 23; // G
        line[idx + 2] = 42; // B
        line[idx + 3] = 255;// A

        // Draw Car body shapes
        const carX = Math.abs(dx);
        const carY = dy;
        if (carX < 0.45 && carY > -0.6 && carY < 0.6) {
          // Car body red/neon
          line[idx] = 244;
          line[idx + 1] = 63;
          line[idx + 2] = 94;

          // Windshield (dark cyan)
          if (carY > -0.3 && carY < 0.0 && carX < 0.3) {
            line[idx] = 56;
            line[idx + 1] = 189;
            line[idx + 2] = 248;
          }
          // Yellow headlights
          if (carY < -0.45 && carX > 0.2) {
            line[idx] = 250;
            line[idx + 1] = 204;
            line[idx + 2] = 21;
          }
        }
      } else {
        // Transparent border
        line[idx] = 0;
        line[idx + 1] = 0;
        line[idx + 2] = 0;
        line[idx + 3] = 0;
      }
    }
    rawLines.push(line);
  }

  const uncompressed = Buffer.concat(rawLines);
  const compressed = zlib.deflateSync(uncompressed);
  const idat = makeChunk('IDAT', compressed);

  // IEND
  const iend = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([sig, ihdr, idat, iend]);
}

const sizes = [16, 48, 128];
const targetDir = __dirname;

sizes.forEach(sz => {
  const fileBuf = createPNG(sz, sz);
  const filePath = path.join(targetDir, `icon${sz}.png`);
  fs.writeFileSync(filePath, fileBuf);
  console.log(`Created ${filePath} (${sz}x${sz})`);
});
