// Fast preview loop (skill §2b): render only <from>-<to> seconds, small, and tile it into one contact sheet.
// usage: node scripts/preview.mjs <from> <to> [--fps 6] [--scale 0.25] [--cols 6] [--mp4]
import { execSync } from "node:child_process";
import { mkdirSync, rmSync, readdirSync } from "node:fs";
const a = process.argv.slice(2);
const opt = (k, d) => { const i = a.indexOf(k); return i >= 0 ? a[i + 1] : d; };
const from = +a[0], to = +a[1], fps = +opt("--fps", 6), scale = +opt("--scale", 0.25), cols = +opt("--cols", 6);
const F = 24, f0 = Math.round(from * F), f1 = Math.round(to * F) - 1;
const dir = `cache/pv_${f0}_${f1}`;
rmSync(dir, { recursive: true, force: true }); mkdirSync(dir, { recursive: true }); mkdirSync("renders/previews", { recursive: true });
const props = JSON.stringify({ audio: a.includes("--mp4") && process.env.PV_AUDIO === "1", fg: process.env.PV_NOFG !== "1" });
if (a.includes("--mp4")) {
  execSync(`npx remotion render Reel renders/previews/clip_${from}-${to}.mp4 --frames=${f0}-${f1} --scale=${scale} --props='${props}' --log=error`, { stdio: "inherit" });
} else {
  execSync(`npx remotion render Reel ${dir} --sequence --image-format=jpeg --frames=${f0}-${f1} --scale=${scale} --props='${props}' --log=error`, { stdio: "inherit" });
  const step = Math.max(1, Math.round(F / fps));
  const files = readdirSync(dir).filter((f) => f.endsWith(".jpeg")).sort();
  const pick = files.filter((_, i) => i % step === 0);
  const list = pick.map((f, i) => `-i ${dir}/${f}`).join(" ");
  const lab = pick.map((f, i) => `[${i}:v]drawtext=text='${((f0 + i * step) / F).toFixed(2)}':x=6:y=h-30:fontsize=22:fontcolor=yellow:box=1:boxcolor=black@0.6[v${i}]`).join(";");
  const rows = Math.ceil(pick.length / cols);
  const ins = pick.map((_, i) => `[v${i}]`).join("");
  execSync(`ffmpeg -v error -y ${list} -filter_complex "${lab};${ins}xstack=inputs=${pick.length}:layout=${layout(pick.length, cols)}:fill=black" renders/previews/sheet_${from}-${to}.jpg`);
  console.log(`renders/previews/sheet_${from}-${to}.jpg (${pick.length} frames, ${rows} rows)`);
}
function layout(n, c) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const x = i % c, y = Math.floor(i / c);
    out.push(`${x === 0 ? "0" : Array.from({ length: x }, () => "w0").join("+")}_${y === 0 ? "0" : Array.from({ length: y }, () => "h0").join("+")}`);
  }
  return out.join("|");
}
