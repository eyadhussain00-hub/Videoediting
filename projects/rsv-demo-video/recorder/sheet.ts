import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

// Contact sheets for checking a take without scrubbing through it: frames at every beat's start, middle
// and end, labelled with the beat and the time, laid out on one image per recording.
//
//   npm run sheet                     every recording
//   npm run sheet -- clinic-ar-mobile one recording

const here = dirname(fileURLToPath(import.meta.url));
const DIR = resolve(here, "../public/recordings");

type Sheet = {
  video: string;
  width: number;
  height: number;
  duration: number;
  cues: { id: string; start: number; end: number }[];
};

async function sheetFor(browser: import("playwright").Browser, name: string) {
  const meta = JSON.parse(readFileSync(join(DIR, `${name}.json`), "utf8")) as Sheet;
  const frames: { t: number; label: string }[] = [{ t: 0.5, label: "start" }];
  for (const cue of meta.cues) {
    const mid = (cue.start + cue.end) / 2;
    frames.push({ t: cue.start + 0.4, label: `${cue.id} ▸` }, { t: mid, label: `${cue.id} ·` }, { t: cue.end - 0.3, label: `${cue.id} ◂` });
  }
  frames.push({ t: meta.duration - 0.2, label: "end" });

  const portrait = meta.height > meta.width;
  const thumbW = portrait ? 260 : 480;
  const thumbH = Math.round((thumbW * meta.height) / meta.width);
  const cols = portrait ? 6 : 4;
  const page = await browser.newPage({ viewport: { width: cols * (thumbW + 12) + 12, height: 800 } });
  const src = `data:video/webm;base64,${readFileSync(join(DIR, meta.video)).toString("base64")}`;

  await page.setContent(`<!doctype html><html><body style="margin:0;background:#0b0e14;font:12px system-ui;color:#e9ebf1">
    <div style="padding:12px 12px 4px;font-weight:700">${name} · ${meta.width}×${meta.height} · ${meta.duration.toFixed(1)}s</div>
    <div id="grid" style="display:grid;grid-template-columns:repeat(${cols}, ${thumbW}px);gap:12px;padding:12px"></div>
    <video id="v" muted preload="auto" style="display:none"></video></body></html>`);
  await page.evaluate(
    async ({ src, frames, thumbW, thumbH }) => {
      const v = document.getElementById("v") as HTMLVideoElement;
      v.src = src;
      await new Promise((r) => v.addEventListener("loadeddata", r, { once: true }));
      const grid = document.getElementById("grid")!;
      for (const f of frames) {
        v.currentTime = Math.max(0, f.t);
        await new Promise((r) => v.addEventListener("seeked", r, { once: true }));
        const cell = document.createElement("div");
        const canvas = document.createElement("canvas");
        canvas.width = thumbW;
        canvas.height = thumbH;
        canvas.style.cssText = "display:block;border-radius:6px;border:1px solid #262d3d";
        canvas.getContext("2d")!.drawImage(v, 0, 0, thumbW, thumbH);
        const label = document.createElement("div");
        label.textContent = `${f.label}  ${f.t.toFixed(1)}s`;
        label.style.cssText = "padding:4px 2px;color:#9aa2b5";
        cell.append(canvas, label);
        grid.append(cell);
      }
    },
    { src, frames, thumbW, thumbH },
  );
  const out = join(DIR, `${name}.sheet.png`);
  await page.screenshot({ path: out, fullPage: true });
  await page.close();
  console.log(`  ${out}`);
}

// Single frames at the recording's own resolution, for judging sharpness rather than layout.
//   npm run sheet -- clinic-ar-desktop --at 12.5,40
async function framesAt(browser: import("playwright").Browser, name: string, times: number[]) {
  const meta = JSON.parse(readFileSync(join(DIR, `${name}.json`), "utf8")) as Sheet;
  const page = await browser.newPage({ viewport: { width: meta.width, height: meta.height } });
  const src = `data:video/webm;base64,${readFileSync(join(DIR, meta.video)).toString("base64")}`;
  await page.setContent(`<body style="margin:0;background:#000"><video id="v" muted style="display:block;width:${meta.width}px;height:${meta.height}px"></video></body>`);
  await page.evaluate(async (src) => {
    const v = document.getElementById("v") as HTMLVideoElement;
    v.src = src;
    await new Promise((r) => v.addEventListener("loadeddata", r, { once: true }));
  }, src);
  for (const t of times) {
    await page.evaluate(async (t) => {
      const v = document.getElementById("v") as HTMLVideoElement;
      v.currentTime = t;
      await new Promise((r) => v.addEventListener("seeked", r, { once: true }));
    }, t);
    const out = join(DIR, `${name}@${t}.png`);
    await page.screenshot({ path: out });
    console.log(`  ${out}`);
  }
  await page.close();
}

async function main() {
  const atIndex = process.argv.indexOf("--at");
  if (atIndex > 0) {
    const browser = await chromium.launch();
    try {
      await framesAt(browser, process.argv[2], process.argv[atIndex + 1].split(",").map(Number));
    } finally {
      await browser.close();
    }
    return;
  }
  const only = process.argv[2];
  const names = readdirSync(DIR)
    .filter((f) => f.endsWith(".json"))
    .map((f) => f.replace(/\.json$/, ""))
    .filter((n) => !only || n === only);
  const browser = await chromium.launch();
  try {
    for (const name of names) await sheetFor(browser, name);
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
