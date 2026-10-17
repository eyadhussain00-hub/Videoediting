// Dumps the edit's beat times + cut list for the audio script: npx tsx scripts/beats.ts > plan/beats.json
import { DURATION, FPS, SEGMENTS, SEG_OUT, T, WORDS } from "../src/data";
console.log(JSON.stringify({ fps: FPS, duration: DURATION, segments: SEGMENTS, segOut: SEG_OUT, T, words: WORDS }, null, 1));
