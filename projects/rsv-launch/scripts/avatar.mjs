import { createRequire } from 'node:module'; const { chromium } = createRequire(import.meta.url)('/opt/node-tools/node_modules/playwright');
import { readFileSync } from 'node:fs';
const svg = readFileSync('/home/user/rsv-studio/public/brand/rsv-app-icon.svg', 'utf8').replace('rx="22"', 'rx="0"');
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1080, height: 1080 } });
await p.setContent(`<style>*{margin:0}svg{width:1080px;height:1080px;display:block}</style>${svg}`);
await p.screenshot({ path: process.argv[2] }); await b.close();
