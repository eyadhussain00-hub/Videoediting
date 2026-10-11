// Resumable chunked render (for slow GPU-less machines): renders <film> in chunks of N frames into
// <out>/chunks/c_00000.mp4 …, skipping chunks already on disk, then joins them into <out>/video.mp4.
// Run detached so a session restart can't kill it; re-run the same command to resume.
//   LIB=~/lemo-opuscar node shared/chunks.mjs <film dir> --size 1080x1920 --q 'noev&ssaa=1.25' --workers 2 --chunk 96
import fs from 'fs'; import path from 'path'; import { spawn, execFileSync } from 'child_process';
const LIB = process.env.LIB || path.join(process.env.HOME, 'lemo-opuscar');
const { openDemo, closeServer, takeSize } = await import(path.join(LIB, 'core/render/page.mjs'));
const args = process.argv.slice(2), { w: W, h: H } = takeSize(args), opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const dir = path.resolve(args[0]), FPS = +opt('--fps', 24), WK = +opt('--workers', 2), CH = +opt('--chunk', 96), Q = opt('--q', '');
const outDir = path.resolve(opt('--out', path.join(dir, 'out'))), cdir = path.join(outDir, 'chunks'); fs.mkdirSync(cdir, { recursive: true });
const probe = await openDemo(dir, { w: W, h: H, q: Q }); const DUR = await probe.page.evaluate(() => window.DUR); await probe.browser.close();
const TOTAL = Math.round(DUR * FPS), chunks = []; for (let a = 0; a < TOTAL; a += CH) chunks.push(a);
const name = a => path.join(cdir, `c_${String(a).padStart(5, '0')}.mp4`);
const todo = chunks.filter(a => !fs.existsSync(name(a))); const t0 = Date.now();
console.log(`${TOTAL} frames, ${chunks.length} chunks, ${todo.length} to render`);
await Promise.all([...Array(WK)].map(async (_, w) => {
  let br = null, pg = null;
  while (todo.length) {
    const a = todo.shift(), b = Math.min(TOTAL, a + CH), part = name(a).replace('.mp4', '.part.mp4');
    if (!pg) ({ browser: br, page: pg } = await openDemo(dir, { w: W, h: H, q: Q }));
    const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-', '-c:v', 'libx264', '-preset', 'medium', '-crf', '14', '-pix_fmt', 'yuv420p', path.basename(part)], { cwd: cdir, stdio: ['pipe', 'inherit', 'inherit'] });
    const closed = new Promise(r => ff.on('close', r));
    for (let f = a; f < b; f++) {
      await pg.evaluate(t => window.render(t), f / FPS);
      const buf = await pg.screenshot({ type: 'jpeg', quality: 95, timeout: 180000 });
      if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    }
    ff.stdin.end(); const code = await closed;
    if (code !== 0) { console.error(`chunk ${a} failed`); process.exit(1); }
    fs.renameSync(part, name(a));
    console.log(`w${w} chunk ${a}-${b} done  ${((Date.now() - t0) / 1000).toFixed(0)}s  (${chunks.filter(c => fs.existsSync(name(c))).length}/${chunks.length})`);
  }
  if (br) await br.close();
}));
fs.writeFileSync(path.join(cdir, 'list.txt'), chunks.map(a => `file '${path.basename(name(a))}'`).join('\n'));
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', 'list.txt', '-c', 'copy', path.join(outDir, 'video.mp4')], { cwd: cdir, stdio: 'inherit' });
console.log('done', path.join(outDir, 'video.mp4'), TOTAL, 'frames', ((Date.now() - t0) / 1000).toFixed(0) + 's');
closeServer();
