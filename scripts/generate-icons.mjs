import fs from 'fs';
import zlib from 'zlib';

function createPNG(width, height, drawFn) {
  // RGBA buffer
  const buffer = Buffer.alloc(width * height * 4);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const [r, g, b, a] = drawFn(x, y, width, height);
      buffer[idx] = r;
      buffer[idx + 1] = g;
      buffer[idx + 2] = b;
      buffer[idx + 3] = a;
    }
  }

  // Scanlines with filter byte 0 (None)
  const scanlines = Buffer.alloc(height * (width * 4 + 1));
  let scanlineIdx = 0;
  for (let y = 0; y < height; y++) {
    scanlines[scanlineIdx++] = 0; // Filter byte
    const rowStart = y * width * 4;
    buffer.copy(scanlines, scanlineIdx, rowStart, rowStart + width * 4);
    scanlineIdx += width * 4;
  }

  const deflated = zlib.deflateSync(scanlines);

  // PNG Signature
  const pngSignature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  function makeChunk(type, data) {
    const len = data.length;
    const buf = Buffer.alloc(len + 12);
    buf.writeUInt32BE(len, 0);
    buf.write(type, 4, 4, 'ascii');
    data.copy(buf, 8);
    // CRC
    const crc = crc32(buf.subarray(4, len + 8));
    buf.writeUInt32BE(crc >>> 0, len + 8);
    return buf;
  }

  const ihdrChunk = makeChunk('IHDR', ihdr);
  const idatChunk = makeChunk('IDAT', deflated);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([pngSignature, ihdrChunk, idatChunk, iendChunk]);
}

// CRC32 implementation
const crcTable = [];
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    if (c & 1) c = 0xedb88320 ^ (c >>> 1);
    else c = c >>> 1;
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

// FINANGENCY Icon painter
function finangencyPainter(x, y, w, h) {
  const nx = x / w;
  const ny = y / h;

  // Background: Deep dark navy #070B14 to #0E1E2A
  let r = Math.floor(7 + nx * 5);
  let g = Math.floor(11 + ny * 18);
  let b = Math.floor(20 + (nx + ny) * 15);
  let a = 255;

  // Rounded squircle mask
  const cornerR = 0.22;
  const dx = Math.max(0, Math.abs(nx - 0.5) - (0.5 - cornerR));
  const dy = Math.max(0, Math.abs(ny - 0.5) - (0.5 - cornerR));
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist > cornerR) {
    return [0, 0, 0, 0];
  }

  // Border glow
  if (dist > cornerR - 0.02) {
    return [16, 185, 129, 200];
  }

  // Top Arm of F
  if (ny >= 0.20 && ny <= 0.35 && nx >= 0.30 && nx <= 0.72) {
    return [240, 253, 244, 255];
  }

  // Middle Arm of F
  if (ny >= 0.44 && ny <= 0.56 && nx >= 0.30 && nx <= 0.62) {
    return [230, 250, 240, 255];
  }

  // Left vertical Stem of F
  if (ny >= 0.20 && ny <= 0.80 && nx >= 0.30 && nx <= 0.44) {
    return [245, 255, 250, 255];
  }

  // Bar 1 (Lowest)
  if (nx >= 0.48 && nx <= 0.53 && ny >= 0.68 && ny <= 0.80) {
    return [16, 185, 129, 255];
  }

  // Bar 2
  if (nx >= 0.56 && nx <= 0.61 && ny >= 0.62 && ny <= 0.80) {
    return [20, 200, 140, 255];
  }

  // Bar 3
  if (nx >= 0.64 && nx <= 0.69 && ny >= 0.54 && ny <= 0.80) {
    return [34, 211, 153, 255];
  }

  // Bar 4 (Highest)
  if (nx >= 0.72 && nx <= 0.77 && ny >= 0.46 && ny <= 0.80) {
    return [52, 230, 170, 255];
  }

  return [r, g, b, a];
}

fs.writeFileSync('public/pwa-192x192.png', createPNG(192, 192, finangencyPainter));
fs.writeFileSync('public/pwa-512x512.png', createPNG(512, 512, finangencyPainter));
fs.writeFileSync('public/apple-touch-icon.png', createPNG(180, 180, finangencyPainter));
console.log('PNG Icons successfully generated!');
