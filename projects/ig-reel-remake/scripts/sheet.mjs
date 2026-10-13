// Fast preview loop (skill §2b): bundle once, render small stills over a time range, tile them into one contact sheet.
// Usage: node scripts/sheet.mjs <from_s> <to_s> [fps=4] [scale=0.25] [cols=6]  → renders/previews/sheet_<from>-<to>.jpg
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import { execFileSync } from "node:child_process";
import { mkdirSync, rmSync } from "node:fs";
import path from "node:path";

const [from = 0, to = 5, fps = 4, scale = 0.25, cols = 6] = process.argv.slice(2).map(Number);
const browserExecutable = "/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell";
const root = path.resolve(import.meta.dirname, "..");
const tmp = path.join(root, "cache/sheet");
rmSync(tmp, { recursive: true, force: true });
mkdirSync(tmp, { recursive: true });
mkdirSync(path.join(root, "renders/previews"), { recursive: true });

const serveUrl = await bundle({ entryPoint: path.join(root, "src/index.ts"), publicDir: path.join(root, "public") });
const composition = await selectComposition({ serveUrl, id: "Reel", browserExecutable });
const times = [];
for (let t = from; t <= to + 1e-6; t += 1 / fps) times.push(+t.toFixed(3));
let i = 0;
for (const t of times) {
  const frame = Math.min(composition.durationInFrames - 1, Math.round(t * composition.fps));
  await renderStill({ serveUrl, composition, frame, output: path.join(tmp, `f${String(i++).padStart(4, "0")}.jpg`), imageFormat: "jpeg", scale, browserExecutable, chromiumOptions: { gl: "swangle" } });
}
const out = path.join(root, `renders/previews/sheet_${from}-${to}.jpg`);
const rows = Math.ceil(times.length / cols);
execFileSync("ffmpeg", ["-v", "error", "-y", "-framerate", "1", "-i", path.join(tmp, "f%04d.jpg"),
  "-vf", `drawtext=text='%{eif\\:${from}*100+n*${100 / fps}\\:d}':x=6:y=6:fontsize=16:fontcolor=yellow:box=1:boxcolor=black@0.6,tile=${cols}x${rows}:padding=4`,
  "-frames:v", "1", out]);
console.log(`${times.length} frames → ${out}  (timestamps in centiseconds)`);
