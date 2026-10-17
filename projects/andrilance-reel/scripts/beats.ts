// Dumps the edit's timings for the audio script: npx tsx scripts/beats.ts > plan/beats.json
import { DURATION, FPS, PIP, COVER, SEGMENTS, SEG_OUT, SENTENCES, T, WORDS, at } from "../src/data";
const w = (s: string, n = 1) => at(s, n);
const cues = {
  hook: 0, college: w("college"), work: w("work"), now2: w("now", 2), travel: w("travel"), buy: w("buy"), dream: w("dream"),
  complete: w("complete"), dont: w("don't"), learned: w("learned"), end: w("end"), spent: w("spent"), iman: w("iman"), brez: w("brez"),
  tjr: w("tjr"), all: w("all"), struggle: w("struggle"), exact: w("exact"), skill2: w("skill", 2), monetized: w("monetized"),
  highticket: w("high-ticket"), dancing: w("dancing"), expert: w("expert"), what3: w("what", 3), changed: w("changed"), put: w("put"),
  majority: w("majority"), claude1: w("claude"), agent: w("agent"), did3: w("did", 3), step1: w("step"), copy: w("copy"),
  pasted: w("pasted"), claude2: w("claude", 2), interviewed: w("interviewed"), couple2: w("couple", 2), packaged: w("packaged"),
  skills: w("skills"), knowledge: w("knowledge"), expertise: w("expertise"), into2: w("into", 2), k1: w("$1,000"), every2: w("every", 2),
  if2: w("if", 2), save1: w("save"), prompt2: w("prompt", 2), step2: w("now", 3), asked2: w("asked", 3), ideal: w("ideal"),
  viral: w("viral"), buyers: w("buyers"), million: w("million"), less: w("less"), k3: w("3,000"), its: w("it's"), claude4: w("claude", 4),
  scripted: w("scripted"), mspec: w("micro-specific"), mniche: w("micro-niche"), buyers2: w("buyers", 2), two: w("two"), k1v: w("1,000"),
  over: w("over"), k30: w("30,000"), month: w("month"), three: w("three"), pct: w("0.01%"), job95: w("9-to-5"), best: w("best"),
  ceiling: w("ceiling"), million2: w("million", 2), already2: w("already", 2), job: w("job"), hobby: w("hobby"), above: w("above"),
  selling2: w("selling", 2), people5: w("people", 5), willing: w("willing"), pay: w("pay"), as2: w("as", 2), save2: w("save", 2),
  prompt3: w("prompt", 3), endCard: T.endCard,
};
console.log(JSON.stringify({ fps: FPS, duration: DURATION, segments: SEGMENTS, segOut: SEG_OUT, sentences: SENTENCES, pip: PIP, cover: COVER, cues, words: WORDS }, null, 1));
