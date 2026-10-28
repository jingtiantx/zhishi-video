// node covers.mjs <build_dir> <outdir> <prefix> 3x4 4x3 [9x16] -> <outdir>/<prefix>cover_3x4.png
import fs from 'fs'; import path from 'path'; import { loadChromium, serve, LAUNCH } from './_serve.mjs';
const [root, out, prefix, ...kinds] = process.argv.slice(2);
const chromium = loadChromium(); const { srv, base } = await serve(root); fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch(LAUNCH);
const page = await browser.newPage({ viewport: { width: 1920, height: 1920 } });
page.on('pageerror', e => { console.error('[pageerror]', e.message); process.exit(1); });
await page.goto(base + 'cover.html');
for (const k of (kinds.length ? kinds : ['3x4', '4x3'])) {
  const url = await page.evaluate(k => window.drawCover(k), k), f = path.join(out, `${prefix}cover_${k}.png`);
  fs.writeFileSync(f, Buffer.from(url.split(',')[1], 'base64')); console.log(f);
}
await browser.close(); srv.close();
