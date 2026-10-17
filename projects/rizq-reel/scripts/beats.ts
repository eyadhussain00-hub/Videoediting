// Dumps the edit's beat times + cut list for the audio script: npx tsx scripts/beats.ts > plan/beats.json
import { DURATION, FPS, ITEMS, SEGMENTS, SEG_OUT, T, cardWin } from "../src/data";
const items = ITEMS.map((it) => ({ n: it.n, card: cardWin(it), ref: [it.ref.at, it.ref.until] }));
console.log(JSON.stringify({ fps: FPS, duration: DURATION, segments: SEGMENTS, segOut: SEG_OUT, T, items }, null, 1));
