// shared: static server over a build dir + Playwright chromium.
// playwright-core / playwright is resolved from this repo's node_modules (npm install), or from ZV_PLAYWRIGHT_FROM=/path/to/package.json.
// ZV_CHROMIUM=/path/to/chrome uses an existing Chromium/Chrome instead of the Playwright-downloaded one.
import http from 'http'; import fs from 'fs'; import path from 'path'; import { createRequire } from 'module';
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.otf': 'font/otf', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml' };
export function loadChromium() {
  const here = path.dirname(new URL(import.meta.url).pathname);
  const tries = [process.env.ZV_PLAYWRIGHT_FROM, path.join(here, '..', 'package.json'), path.join(process.cwd(), 'package.json')].filter(Boolean);
  for (const t of tries) { try { const req = createRequire(t); try { return req('playwright-core').chromium; } catch { return req('playwright').chromium; } } catch {} }
  throw new Error('playwright-core not found — run `npm install` in the repo root (or set ZV_PLAYWRIGHT_FROM=/path/to/package.json of an install that has it)');
}
export async function serve(root) {
  root = path.resolve(root);
  const srv = http.createServer((q, r) => { const p = path.join(root, decodeURIComponent(q.url.split('?')[0])); if (!p.startsWith(root) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { r.writeHead(404); return r.end(); }
    r.writeHead(200, { 'Content-Type': MIME[path.extname(p)] || 'application/octet-stream' }); fs.createReadStream(p).pipe(r); });
  await new Promise(r => srv.listen(0, '127.0.0.1', r));
  return { srv, base: `http://127.0.0.1:${srv.address().port}/` };
}
export const LAUNCH = Object.assign({ args: ['--font-render-hinting=none', '--force-color-profile=srgb'] }, process.env.ZV_CHROMIUM ? { executablePath: process.env.ZV_CHROMIUM } : {});
