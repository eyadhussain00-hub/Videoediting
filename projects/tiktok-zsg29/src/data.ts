import words from "./words.json";

// Every timing comes from here. Words are faster-whisper on the source audio (plan/words.json → src/words.json, SOURCE
// seconds); the cut list trims his longer pauses and every word is remapped onto the edit, so beats stay on the voice.
export const FPS = 30;

/** Kept source ranges, in source frames at 30 fps [from, to). Cuts sit inside his pauses (> .35 s). */
export const SEGMENTS: [number, number][] = [
  [0, 31], // 4 objections,
  [37, 97], // 4 closes, and 40 seconds.
  [112, 395], // Objection one … than the investment.
  [401, 510], // Objection two … I completely understand.
  [515, 727], // Usually when that happens … Which one feels closest?
  [731, 805], // Objection three, I need to talk to my spouse.
  [811, 1282], // Absolutely … they wish they'd started today.
];
let acc = 0;
export const SEG_OUT = SEGMENTS.map(([s, e]) => ((acc += e - s), acc - (e - s)));
export const CUT_END = acc;
export const END_HOLD = 108; // recap card over the last frame
export const DURATION = (CUT_END + END_HOLD) / FPS;

/** Source seconds → edit seconds. */
export const toOut = (src: number) => {
  const f = src * FPS;
  for (let i = SEGMENTS.length - 1; i >= 0; i--) if (f >= SEGMENTS[i][0] - 2) return (SEG_OUT[i] + f - SEGMENTS[i][0]) / FPS;
  return f / FPS;
};

export type Word = { w: string; s: number; e: number };
export const WORDS: Word[] = (words as Word[]).map((x) => ({ w: x.w, s: toOut(x.s), e: toOut(x.e) }));

export const clean = (w: string) => w.toLowerCase().replace(/[^a-z0-9']/g, "");
const find = (word: string, nth: number) => {
  let k = 0;
  for (const x of WORDS) if (clean(x.w) === word.toLowerCase() && ++k === nth) return x;
  throw new Error(`word not found: ${word} #${nth}`);
};
/** Edit time (s) of the n-th occurrence of a spoken word (start / end). */
export const at = (word: string, nth = 1) => find(word, nth).s;
export const end = (word: string, nth = 1) => find(word, nth).e;
export const segAt = (i: number) => SEG_OUT[i] / FPS;

// Palette: his studio is near-black with warm practicals; his own captions use an ember red-orange.
export const BG = "#0B0A09";
export const EMBER = "#FF5A2C";
export const EMBER_DEEP = "#E2401A";
export const CREAM = "#F5EFE6";
export const MUTED = "rgba(245,239,230,0.52)";
export const GOLD = "#E9B872";

export const T = {
  four1: at("4", 1),
  objections0: at("objections"),
  four2: at("4", 2),
  closes: at("closes"),
  forty: at("40"),
  seconds: at("seconds"),
  // 1 · too expensive
  o1: at("objection", 1),
  q1: at("it's"),
  sense: at("that"),
  compared: at("compared"),
  because1: at("because", 1),
  cost: at("cost"),
  moreExp: at("more", 1),
  investment: at("investment"),
  // 2 · think about it
  o2: at("objection", 2),
  q2: at("i", 2),
  understand: at("completely"),
  comes: at("comes"),
  timing1: at("timing", 1),
  money: at("money"),
  whether: at("whether"),
  work: at("work"),
  which: at("which"),
  // 3 · spouse
  o3: at("objection", 3),
  q3: at("i", 4),
  absolutely: at("absolutely"),
  ifSpouse: at("if"),
  whatTell: at("what", 3),
  them: end("them"),
  // 4 · not a good time
  o4: at("objection", 4),
  q4: at("now's"),
  hear: at("hear"),
  canAsk: at("can", 2),
  change: at("change"),
  because2: at("because", 2),
  six: at("six"),
  later: at("later"),
  wish: at("wish"),
  today: at("today"),
  todayEnd: end("today"),
  recap: CUT_END / FPS,
  end: DURATION,
};

/** The 40-second clock: 40 on "Objection one", 0 on the last word. */
export const clockAt = (t: number) => {
  if (t < T.o1) return 40;
  return Math.max(0, 40 * (1 - (t - T.o1) / (T.todayEnd - T.o1)));
};

export const BEATS = [
  { n: 1, s: T.o1, say: "It's too expensive.", close: "Compared to what?" },
  { n: 2, s: T.o2, say: "I need to think about it.", close: "Which one feels closest?" },
  { n: 3, s: T.o3, say: "I need to talk to my spouse.", close: "What would you tell them?" },
  { n: 4, s: T.o4, say: "Now's not a good time.", close: "What would need to change?" },
];
export const beatAt = (t: number) => {
  for (let i = BEATS.length - 1; i >= 0; i--) if (t >= BEATS[i].s - 0.25) return i;
  return -1;
};

// Captions hide while the hook type or the recap is already saying it.
export const CAPTION_HIDE: [number, number][] = [
  [0, T.o1 - 0.1],
  [T.recap - 0.05, T.end],
];
export const KEYWORDS = new Set(["expensive", "compared", "cost", "investment", "think", "timing", "money", "work", "closest", "spouse", "tell", "time", "change", "today", "started"]);

export type Group = { words: Word[]; s: number; e: number };
/** Caption groups: break on punctuation, gaps > .3 s, or 3 words. */
export const GROUPS: Group[] = (() => {
  const out: Group[] = [];
  let cur: Word[] = [];
  const flush = () => {
    if (cur.length) out.push({ words: cur, s: cur[0].s, e: cur[cur.length - 1].e });
    cur = [];
  };
  WORDS.forEach((w, i) => {
    const prev = WORDS[i - 1];
    if (cur.length && (cur.length >= 3 || /[.,?!]$/.test(prev.w) || w.s - prev.e > 0.3)) flush();
    cur.push(w);
  });
  flush();
  return out;
})();
