// Deterministic frame renderer. Usage:
//   node src/render.js --from <s> --to <s> --fps <n> --scale <0-1> --out <dir> [--jpg]
// Frames are named 00000.jpg/png… starting at --from.
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { extname, join, resolve } from 'node:path';

const a = process.argv.slice(2);
const opt = (k, d) => { const i = a.indexOf('--' + k); return i >= 0 ? a[i + 1] : d; };
const from = +opt('from', 0), to = +opt('to', 22), fps = +opt('fps', 30), scale = +opt('scale', 1);
const out = opt('out', 'cache/frames'), jpg = a.includes('--jpg');
const root = resolve(new URL('..', import.meta.url).pathname);

const types = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.ttf': 'font/ttf' };
const server = createServer(async (req, res) => {
  try { const p = join(root, decodeURIComponent(req.url.split('?')[0]));
    if (!p.startsWith(root)) throw new Error('outside');
    res.writeHead(200, { 'content-type': types[extname(p)] || 'application/octet-stream' }); res.end(await readFile(p));
  } catch { res.writeHead(404); res.end(); }
}).listen(0);
const port = server.address().port;

await mkdir(out, { recursive: true });
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const W = Math.round(1080 * scale), H = Math.round(1920 * scale);
const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
page.on('console', m => { if (m.type() === 'error') console.error('[page]', m.text()); });
page.on('pageerror', e => console.error('[page]', e.message));
await page.goto(`http://localhost:${port}/src/index.html`);
await page.waitForFunction(() => typeof window.setup === 'function');
const info = await page.evaluate(s => window.setup(s), scale);
console.log('scene', JSON.stringify(info));

const n = Math.round((to - from) * fps), t0 = Date.now();
for (let i = 0; i < n; i++) {
  const t = from + i / fps;
  await page.evaluate(t => window.drawFrame(t), t);
  const buf = await page.screenshot(jpg ? { type: 'jpeg', quality: 92 } : { type: 'png' });
  await writeFile(join(out, String(i).padStart(5, '0') + (jpg ? '.jpg' : '.png')), buf);
  if (i % 30 === 0) console.log(`frame ${i}/${n}  t=${t.toFixed(2)}  ${((Date.now() - t0) / (i + 1)).toFixed(0)} ms/frame`);
}
await browser.close(); server.close();
console.log(`rendered ${n} frames in ${((Date.now() - t0) / 1000).toFixed(1)} s`);
