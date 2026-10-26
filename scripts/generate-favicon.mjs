import fs from 'fs';
import path from 'path';

// Generate a valid 32x32 32-bit ICO file for Adversoft
function generateAdversoftIco() {
  const width = 32;
  const height = 32;
  const bpp = 32;

  // ICO header (6 bytes) + 1 Dir Entry (16 bytes) = 22 bytes
  const headerSize = 6;
  const dirEntrySize = 16;
  const bmiHeaderSize = 40;
  const xorSize = width * height * 4; // 32-bit BGRA
  const andRowSize = Math.ceil(width / 32) * 4; // 4 bytes per row
  const andSize = andRowSize * height; // 32 rows * 4 bytes = 128 bytes
  const imageSize = bmiHeaderSize + xorSize + andSize;
  const totalSize = headerSize + dirEntrySize + imageSize;

  const buf = Buffer.alloc(totalSize);

  // 1. ICONDIR
  buf.writeUInt16LE(0, 0); // reserved
  buf.writeUInt16LE(1, 2); // 1 = ICO
  buf.writeUInt16LE(1, 4); // 1 image

  // 2. ICONDIRENTRY
  buf.writeUInt8(width, 6); // width
  buf.writeUInt8(height, 7); // height
  buf.writeUInt8(0, 8); // color count
  buf.writeUInt8(0, 9); // reserved
  buf.writeUInt16LE(1, 10); // color planes
  buf.writeUInt16LE(bpp, 12); // bits per pixel
  buf.writeUInt32LE(imageSize, 14); // image size
  buf.writeUInt32LE(22, 18); // image offset

  // 3. BITMAPINFOHEADER
  let offset = 22;
  buf.writeUInt32LE(bmiHeaderSize, offset); offset += 4;
  buf.writeInt32LE(width, offset); offset += 4;
  buf.writeInt32LE(height * 2, offset); offset += 4; // double height for ICO
  buf.writeUInt16LE(1, offset); offset += 2; // planes
  buf.writeUInt16LE(bpp, offset); offset += 2; // bit count
  buf.writeUInt32LE(0, offset); offset += 4; // compression (BI_RGB)
  buf.writeUInt32LE(xorSize + andSize, offset); offset += 4;
  buf.writeInt32LE(0, offset); offset += 4; // XPelsPerMeter
  buf.writeInt32LE(0, offset); offset += 4; // YPelsPerMeter
  buf.writeUInt32LE(0, offset); offset += 4; // ClrUsed
  buf.writeUInt32LE(0, offset); offset += 4; // ClrImportant

  // Draw 32x32 Adversoft Billboard Icon (Bottom-to-Top in BMP!)
  // Colors (BGRA):
  // Indigo: 0x4F, 0x46, 0xE5 -> B: 0xE5, G: 0x46, R: 0x4F, A: 0xFF
  // Dark Screen: 0x0F, 0x17, 0x2A -> B: 0x2A, G: 0x17, R: 0x0F, A: 0xFF
  // Cyan Accent: 0x38, 0xBD, 0xF8 -> B: 0xF8, G: 0xBD, R: 0x38, A: 0xFF
  // White: B: 0xFF, G: 0xFF, R: 0xFF, A: 0xFF
  // Pillar / Steel: B: 0xEE, G: 0xE8, R: 0xE0, A: 0xFF

  const xorBuffer = Buffer.alloc(xorSize);
  const andBuffer = Buffer.alloc(andSize, 0); // 0 = opaque, 1 = transparent

  // Helper to set pixel in BMP (y is bottom-up: y=0 is bottom, y=31 is top)
  function setPixel(x, y, b, g, r, a = 255) {
    if (x < 0 || x >= width || y < 0 || y >= height) return;
    const bmpY = 31 - y; // convert top-down to bottom-up
    const idx = (bmpY * width + x) * 4;
    xorBuffer[idx + 0] = b;
    xorBuffer[idx + 1] = g;
    xorBuffer[idx + 2] = r;
    xorBuffer[idx + 3] = a;

    if (a < 128) {
      // Mark transparent in AND mask
      const andByteIdx = bmpY * andRowSize + Math.floor(x / 8);
      const bitIdx = 7 - (x % 8);
      andBuffer[andByteIdx] |= (1 << bitIdx);
    }
  }

  // Draw background squircle (rounded rect with radius 6)
  for (let y = 0; y < 32; y++) {
    for (let x = 0; x < 32; x++) {
      // Rounded corner check
      let inBounds = true;
      const r = 6;
      if (x < r && y < r && Math.hypot(x - r, y - r) > r) inBounds = false;
      if (x >= 32 - r && y < r && Math.hypot(x - (31 - r), y - r) > r) inBounds = false;
      if (x < r && y >= 32 - r && Math.hypot(x - r, y - (31 - r)) > r) inBounds = false;
      if (x >= 32 - r && y >= 32 - r && Math.hypot(x - (31 - r), y - (31 - r)) > r) inBounds = false;

      if (inBounds) {
        // Gradient from Indigo (top) to Violet (bottom)
        const t = y / 31;
        const red = Math.round(79 * (1 - t) + 124 * t);
        const green = Math.round(70 * (1 - t) + 58 * t);
        const blue = Math.round(229 * (1 - t) + 237 * t);
        setPixel(x, y, blue, green, red, 255);
      } else {
        setPixel(x, y, 0, 0, 0, 0); // transparent
      }
    }
  }

  // Draw Billboard Screen: x=4..27, y=4..19 (16 rows high, 24 cols wide)
  for (let y = 4; y <= 19; y++) {
    for (let x = 4; x <= 27; x++) {
      const isBorder = (x === 4 || x === 27 || y === 4 || y === 19);
      if (isBorder) {
        // White / Silver border
        setPixel(x, y, 255, 255, 255, 255);
      } else {
        // Dark screen background
        setPixel(x, y, 0x2A, 0x17, 0x0F, 255);
      }
    }
  }

  // Draw "A" inside screen:
  // Apex at x=15..16, y=7
  // Left leg to x=9, y=16
  // Right leg to x=22, y=16
  // Crossbar at y=13, x=11..20
  const aCoords = [
    // Top apex & beacon
    [15, 6], [16, 6], [15, 7], [16, 7],
    // Left diagonal
    [14, 8], [14, 9], [13, 10], [13, 11], [12, 12], [11, 13], [11, 14], [10, 15], [9, 16], [10, 16],
    // Right diagonal
    [17, 8], [17, 9], [18, 10], [18, 11], [19, 12], [20, 13], [20, 14], [21, 15], [22, 16], [21, 16],
    // Crossbar
    [12, 13], [13, 13], [14, 13], [15, 13], [16, 13], [17, 13], [18, 13], [19, 13],
  ];

  for (const [x, y] of aCoords) {
    setPixel(x, y, 0xF8, 0xBD, 0x38, 255); // Vibrant Cyan
  }
  // Sparkling apex
  setPixel(15, 6, 255, 255, 255, 255);
  setPixel(16, 6, 255, 255, 255, 255);

  // Billboard Pillar (central support): x=14..17, y=20..27
  for (let y = 20; y <= 27; y++) {
    for (let x = 14; x <= 17; x++) {
      if (x === 14 || x === 15) {
        setPixel(x, y, 250, 240, 230, 255); // Highlight
      } else {
        setPixel(x, y, 210, 190, 175, 255); // Shadow
      }
    }
  }

  // Ground base plate: x=9..22, y=27..28
  for (let y = 27; y <= 28; y++) {
    for (let x = 9; x <= 22; x++) {
      setPixel(x, y, 240, 235, 230, 255);
    }
  }

  // Copy XOR buffer and AND buffer into result buffer
  xorBuffer.copy(buf, 62);
  andBuffer.copy(buf, 62 + xorSize);

  return buf;
}

const icoBuffer = generateAdversoftIco();
fs.writeFileSync(path.resolve('public/favicon.ico'), icoBuffer);
fs.writeFileSync(path.resolve('app/favicon.ico'), icoBuffer);
console.log('Successfully generated public/favicon.ico and app/favicon.ico (32x32 multi-bit ICO).');
