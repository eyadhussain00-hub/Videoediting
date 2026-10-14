// QA stills at given times (s): node scripts/stills.mjs out.jpg 1.5 7.2 ...  → one tiled contact sheet (scale 0.3)
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import { execFileSync } from "node:child_process";
import { mkdirSync } from "node:fs";
const [out, ...ts] = process.argv.slice(2);
const browserExecutable = "/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell";
const serveUrl = await bundle({ entryPoint: "src/index.ts" });
const comp = await selectComposition({ serveUrl, id: "Reel", browserExecutable });
mkdirSync("cache/stills", { recursive: true });
const files = [];
for (const t of ts) {
  const f = `cache/stills/${t}.jpeg`;
  await renderStill({ composition: comp, serveUrl, frame: Math.round(Number(t) * 24), output: f, imageFormat: "jpeg", scale: 0.3, browserExecutable });
  execFileSync("ffmpeg", ["-v", "error", "-y", "-i", f, "-vf", `drawtext=text='${t}':fontcolor=yellow:fontsize=18:x=4:y=4:box=1:boxcolor=black`, f + ".jpg"]);
  files.push(f + ".jpg");
}
const cols = Math.min(6, files.length), rows = Math.ceil(files.length / cols);
const inputs = files.flatMap((f) => ["-i", f]);
const layout = files.map((_, i) => `${(i % cols) * 324}_${Math.floor(i / cols) * 576}`).join("|");
execFileSync("ffmpeg", ["-v", "error", "-y", ...inputs, "-filter_complex", files.length > 1 ? `xstack=inputs=${files.length}:layout=${layout}:fill=black` : "null", out]);
console.log(out, files.length, rows);
