// Dumps the edit's beat times + cut list for the audio script: npx tsx scripts/beats.ts > plan/beats.json
import { CHAPTERS, DURATION, FPS, SEGMENTS, SEG_OUT, T, WORDS } from "../src/data";
console.log(JSON.stringify({ fps: FPS, duration: DURATION, segments: SEGMENTS, segOut: SEG_OUT, T, chapters: CHAPTERS.map((c) => c.t), words: WORDS }, null, 1));
