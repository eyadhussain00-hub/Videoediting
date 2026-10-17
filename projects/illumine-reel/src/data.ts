import words from "./words.json";

// Every timing comes from here. The words are faster-whisper on the source audio (plan/words.json → scripts/fix_words.py
// → src/words.json, in SOURCE seconds); the cut list below trims his four longest pauses, and every word is remapped
// onto the edit's timeline, so beats stay locked to speech.
export const FPS = 30;

/** Kept source ranges, in source frames [from, to). Cut points sit in his pauses (vocal-stem envelope). */
export const SEGMENTS: [number, number][] = [
  [0, 95], // Should you invest into your stocks and shares ISA,
  [100, 161], // or you invest into your SIPP,
  [171, 1340], // let's talk about it. … until you are 55
  [1345, 1779], // for SIPP … Ideally, both.
  [1784, 2250], // Use your ISA … Stay invested, my friend.
];
let acc = 0;
export const SEG_OUT = SEGMENTS.map(([s, e]) => ((acc += e - s), acc - (e - s)));
export const CUT_END = acc;
export const END_HOLD = 66; // end card over a freeze of the last frame
export const DURATION = (CUT_END + END_HOLD) / FPS;

/** Source seconds → edit seconds (inside a kept segment). */
export const toOut = (src: number) => {
  const f = src * FPS;
  for (let i = SEGMENTS.length - 1; i >= 0; i--) if (f >= SEGMENTS[i][0] - 2) return (SEG_OUT[i] + Math.min(f, SEGMENTS[i][1]) - SEGMENTS[i][0]) / FPS;
  return f / FPS;
};

export type Word = { w: string; s: number; e: number };
export const WORDS: Word[] = (words as Word[]).map((x) => ({ w: x.w, s: toOut(x.s), e: toOut(x.e) }));

export const clean = (w: string) => w.toLowerCase().replace(/[^a-z0-9'£%]/g, "");
/** Edit time (s) of the n-th occurrence of a spoken word. */
export const at = (word: string, nth = 1): number => {
  let k = 0;
  for (const x of WORDS) if (clean(x.w) === clean(word) && ++k === nth) return x.s;
  throw new Error(`word not found: ${word} #${nth}`);
};
export const end = (word: string, nth = 1): number => {
  let k = 0;
  for (const x of WORDS) if (clean(x.w) === clean(word) && ++k === nth) return x.e;
  throw new Error(`word not found: ${word} #${nth}`);
};

// Two accounts, two colours, the same as his two glasses: the clear ISA glass (warm £50s) is gold,
// the blue SIPP glass is sapphire. Ink and cream for everything else.
export const GOLD = "#F4C25B";
export const GOLD_DEEP = "#D99A2B";
export const GOLD_PALE = "#FFE6A8";
export const BLUE = "#5B9BFF";
export const BLUE_DEEP = "#2F6BE0";
export const BLUE_PALE = "#BCD6FF";
export const INK = "#0B1020";
export const CREAM = "#FFF7EA";
export const RED = "#FF5B4D";

export const T = {
  stocks: at("stocks", 1),
  isa1: at("isa", 1),
  sipp1: at("sipp", 1),
  lets: at("let's"),
  first: at("first", 1),
  invest3: at("invest", 3),
  k20: at("£20,000"),
  per1: at("per", 1),
  all: at("all"),
  completely: at("completely"),
  taxfree1: at("tax-free", 1),
  withdraw: at("withdraw"),
  anyone: at("anyone"),
  n18: at("18"),
  uk: at("uk"),
  account: at("account"),
  however: at("however"),
  self: at("self-invested"),
  personal: at("personal", 1),
  pension: at("pension"),
  contribute: at("contribute"),
  k60: at("£60,000"),
  or100: at("100%"),
  earnings: at("earnings"),
  lower: at("lower"),
  taxRelief: at("relief"),
  get: at("get"),
  thats20: at("20%"),
  basic: at("basic"),
  higher: at("higher"),
  claim: at("claim"),
  now: at("now"),
  catch: at("catch"),
  cant: at("can't"),
  touch: at("touch"),
  until: at("until"),
  n55: at("55"),
  rising: at("rising"),
  n57: at("57"),
  y2028: at("2028"),
  when: at("when"),
  first25: at("first", 2),
  p25: at("25%"),
  taxfree2: at("tax-free", 2),
  rest: at("rest"),
  income: at("income"),
  so: at("so"),
  which2: at("which", 2),
  ideally: at("ideally"),
  both2: at("both", 2),
  use: at("use"),
  isa3: at("isa", 3),
  before: at("before"),
  sipp4: at("sipp", 4),
  longterm: at("long-term"),
  savings: at("savings"),
  hope: at("hope"),
  drop: at("drop"),
  follow: at("follow"),
  finance: at("finance"),
  catchYou: at("catch", 2),
  stay: at("stay"),
  friend: end("friend"),
  endCard: CUT_END / FPS,
  end: DURATION,
};

/** Chapters: hook → ISA → SIPP → verdict → outro. */
export const CH = {
  isa: T.first - 0.08,
  sipp: T.however - 0.06,
  catch: T.now - 0.05,
  verdict: T.so - 0.06,
  outro: T.hope - 0.2,
};

// Captions hide while a graphic is already saying the words.
export const CAPTION_HIDE: [number, number][] = [
  [T.endCard - 0.05, T.end],
];

export const KEYWORDS = new Set(
  [
  "isa", "sipp", "£20,000", "£60,000", "tax-free", "withdraw", "18", "uk", "self-invested", "personal", "pension",
  "100%", "earnings", "relief", "20%", "basic", "higher", "catch", "can't", "touch", "55", "57", "2028", "25%", "income",
  "both", "retirement", "long-term", "follow", "invested", "finance",
  ].map(clean),
);

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
