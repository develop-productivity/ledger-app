// 把 assets/source/ 里的 SVG 导出成 App 用的 PNG，再生成商店用的 512 图标。
// 改图标时只改 SVG，然后运行这个脚本。用法见 scripts/store/README.md。
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const { chromium } = require(process.env.PLAYWRIGHT_CORE || 'playwright-core');

const ROOT = path.resolve(__dirname, '../..');
const SRC = path.join(ROOT, 'assets/source');

// 文件名 → 导出尺寸（SVG 的 viewBox 都是 1024）
const SIZES = {
  'icon.svg': 1024,
  'android-icon-foreground.svg': 1024,
  'android-icon-background.svg': 1024,
  'android-icon-monochrome.svg': 1024,
  'splash-icon.svg': 1024,
  'favicon.svg': 48,
};

async function render(page, svgFile, size, outFile) {
  const svg = fs
    .readFileSync(svgFile, 'utf8')
    .replace(/width="\d+" height="\d+"/, `width="${size}" height="${size}"`);
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(`<html><body style="margin:0;background:transparent">${svg}</body></html>`);
  await page.screenshot({ path: outFile, omitBackground: true, clip: { x: 0, y: 0, width: size, height: size } });
}

// Chrome 把完全不透明的图存成 RGB（24 位）。Google Play 的图标要求 32 位带透明通道，这里转成 RGBA。
function toRgba(file) {
  const d = fs.readFileSync(file);
  let pos = 8;
  let w, h, colorType;
  const idat = [];
  while (pos < d.length) {
    const len = d.readUInt32BE(pos);
    const type = d.toString('ascii', pos + 4, pos + 8);
    const body = d.subarray(pos + 8, pos + 8 + len);
    if (type === 'IHDR') [w, h, colorType] = [body.readUInt32BE(0), body.readUInt32BE(4), body[9]];
    if (type === 'IDAT') idat.push(body);
    pos += 12 + len;
  }
  if (colorType === 6) return; // 已经是 RGBA
  if (colorType !== 2) throw new Error(`${file}: 不支持的颜色类型 ${colorType}`);
  const raw = zlib.inflateSync(Buffer.concat(idat));
  const stride = w * 3;
  const out = Buffer.alloc(h * (1 + w * 4));
  let prev = Buffer.alloc(stride);
  for (let y = 0; y < h; y++) {
    const filter = raw[y * (stride + 1)];
    const line = Buffer.from(raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1)));
    for (let x = 0; x < stride; x++) {
      const a = x >= 3 ? line[x - 3] : 0;
      const b = prev[x];
      const c = x >= 3 ? prev[x - 3] : 0;
      let add = 0;
      if (filter === 1) add = a;
      else if (filter === 2) add = b;
      else if (filter === 3) add = (a + b) >> 1;
      else if (filter === 4) {
        const p = a + b - c;
        const [pa, pb, pc] = [Math.abs(p - a), Math.abs(p - b), Math.abs(p - c)];
        add = pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
      }
      line[x] = (line[x] + add) & 255;
    }
    const o = y * (1 + w * 4);
    for (let x = 0; x < w; x++) {
      line.copy(out, o + 1 + x * 4, x * 3, x * 3 + 3);
      out[o + 1 + x * 4 + 3] = 255;
    }
    prev = line;
  }
  const chunk = (type, body) => {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(body.length);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(zlib.crc32(Buffer.concat([Buffer.from(type), body])) >>> 0);
    return Buffer.concat([len, Buffer.from(type), body, crc]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  fs.writeFileSync(
    file,
    Buffer.concat([
      d.subarray(0, 8),
      chunk('IHDR', ihdr),
      chunk('IDAT', zlib.deflateSync(out, { level: 9 })),
      chunk('IEND', Buffer.alloc(0)),
    ]),
  );
}

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROME || undefined, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  for (const [svg, size] of Object.entries(SIZES)) {
    await render(page, path.join(SRC, svg), size, path.join(ROOT, 'assets', svg.replace('.svg', '.png')));
  }
  const storeIcon = path.join(ROOT, 'docs/store/icon-512.png');
  await render(page, path.join(SRC, 'icon.svg'), 512, storeIcon);
  toRgba(storeIcon);
  await browser.close();
  console.log('assets/*.png、docs/store/icon-512.png 已更新');
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
