// Playwright renderer: calls window.draw(t) per frame and saves JPGs. Viewport = timeline W×H.
//   node render.mjs <build_dir> stills <outdir> t1 t2 ...              -> <outdir>/t_<t>.jpg
//   node render.mjs <build_dir> frames <outdir> [workers] [from] [to]  -> <outdir>/f_000001.jpg ... (frame n = (n-1)/fps); resumable
import fs from 'fs'; import path from 'path'; import { loadChromium, serve, LAUNCH } from './_serve.mjs';
const [root, mode, out, ...rest] = process.argv.slice(2);
const T = JSON.parse(fs.readFileSync(path.join(root, 'timeline.json'))); const VW = T.W, VH = T.H;
const chromium = loadChromium(); const { srv, base } = await serve(root); fs.mkdirSync(out, { recursive: true });
async function open() {
  const browser = await chromium.launch(LAUNCH);
  const page = await browser.newPage({ viewport: { width: VW, height: VH }, deviceScaleFactor: 1 });
  page.on('pageerror', e => { console.error('[pageerror]', e.message); process.exit(1); });
  page.on('console', m => { if (m.type() === 'error') console.error('[page]', m.text()); });
  await page.goto(base + 'index.html'); await page.evaluate(() => window.ready);
  return { browser, page };
}
const shot = async (page, t, file) => { await page.evaluate(t => window.draw(t), t); fs.writeFileSync(file, await page.screenshot({ type: 'jpeg', quality: 93 })); };
if (mode === 'stills') {
  const { browser, page } = await open();
  for (const t of rest) await shot(page, +t, path.join(out, `t_${t}.jpg`));
  await browser.close();
} else {
  const N = Math.round(T.dur * T.fps);
  const WK = +(rest[0] || 3), A = +(rest[1] || 0), Bn = +(rest[2] || N), per = Math.ceil((Bn - A) / WK), t0 = Date.now();
  await Promise.all([...Array(WK)].map(async (_, w) => {
    const a = A + w * per, b = Math.min(Bn, a + per); if (a >= b) return;
    const { browser, page } = await open();
    for (let f = a; f < b; f++) {
      const file = path.join(out, `f_${String(f + 1).padStart(6, '0')}.jpg`);
      if (!fs.existsSync(file)) await shot(page, f / T.fps, file);
      if ((f - a) % 150 === 0) console.log(`w${w} ${f - a}/${b - a} ${((Date.now() - t0) / 1000).toFixed(0)}s`);
    }
    await browser.close();
  }));
  console.log('frames done', N, ((Date.now() - t0) / 1000).toFixed(0) + 's');
}
srv.close();
