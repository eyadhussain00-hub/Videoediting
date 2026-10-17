// Stills at edit times (s), one bundle: node scripts/stills.mjs 1 2.5 … → cache/stills/s_<t>.png + cache/stills/sheet.jpg
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import { execSync } from "node:child_process";
import { mkdirSync, rmSync } from "node:fs";
import path from "node:path";

const times = process.argv.slice(2).map(Number);
const out = path.resolve("cache/stills");
rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });
const browserExecutable = "/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell";
const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts"), publicDir: path.resolve("public") });
const composition = await selectComposition({ serveUrl, id: "Reel", browserExecutable });
for (const t of times) {
  const f = Math.round(t * 30);
  await renderStill({ serveUrl, composition, frame: f, output: `${out}/s_${t.toFixed(2).padStart(7, "0")}.png`, browserExecutable, scale: 0.5 });
  console.log("still", t);
}
const rows = Math.ceil(times.length / 6);
execSync(`ffmpeg -v error -y -pattern_type glob -i '${out}/s_*.png' -vf "scale=270:480,tile=6x${rows}" -frames:v 1 ${out}/sheet.jpg`);
