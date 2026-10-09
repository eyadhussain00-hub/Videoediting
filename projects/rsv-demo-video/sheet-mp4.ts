import { readdirSync, readFileSync } from "node:fs";
import { chromium } from "playwright";
const files = readdirSync("out/frames").filter((f) => f.endsWith(".png")).sort((a, b) => parseFloat(a.slice(2)) - parseFloat(b.slice(2)));
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 4 * 650 + 10, height: 400 } });
await p.setContent(`<body style="margin:0;background:#222;display:grid;grid-template-columns:repeat(4,640px);gap:10px;padding:5px;font:14px sans-serif;color:#ccc">${files
  .map((f) => `<div><img src="data:image/png;base64,${readFileSync("out/frames/" + f).toString("base64")}" style="display:block;width:640px"><div>${f.slice(2, -4)}s</div></div>`).join("")}</body>`);
await p.screenshot({ path: process.argv[2], fullPage: true });
await b.close();
