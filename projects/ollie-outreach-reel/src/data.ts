import words from "./words.json";
import cuts from "../plan/segments.json";

// Every timing comes from here. The words are faster-whisper on the source audio (plan/words.json → scripts/fix_words.py
// → src/words.json, in SOURCE seconds); the cut list (scripts/cuts.py → plan/segments.json) tightens his pauses, and
// every word is remapped onto the edit's timeline, so beats stay locked to speech.
export const FPS = 30;

/** Owner's rule (17 Oct): edit only the opening third to half of a video, ending on a natural sentence end.
 * Here that is chapters 01-03, ending on "…I admire what you do for people." (32.9 s of 60.9 s, just before the
 * pool shot). */
const END_SRC = Math.min(1000, Math.round(((words as Word[]).find((x) => x.w === "people.")!.e + 0.3) * 30)); // 1000 = pool shot
/** Kept source ranges, in source frames [from, to). */
export const SEGMENTS: [number, number][] = (cuts as [number, number][])
  .filter(([s]) => s < END_SRC)
  .map(([s, e]) => [s, Math.min(e, END_SRC)]);
let acc = 0;
/** Output frame where each segment starts. */
export const SEG_OUT = SEGMENTS.map(([s, e]) => ((acc += e - s), acc - (e - s)));
export const CUT_END = acc;
export const END_HOLD = 60; // end card over a freeze of the last frame
export const DURATION = (CUT_END + END_HOLD) / FPS;

/** Source seconds → edit seconds. Times inside a removed pause snap to the next kept segment. */
export const toOut = (src: number) => {
  const f = src * FPS;
  for (let i = 0; i < SEGMENTS.length; i++) {
    const [s, e] = SEGMENTS[i];
    if (f < s) return SEG_OUT[i] / FPS;
    if (f < e) return (SEG_OUT[i] + f - s) / FPS;
  }
  return CUT_END / FPS;
};

export type Word = { w: string; s: number; e: number };
export const WORDS: Word[] = (words as Word[]).map((x) => ({ w: x.w, s: toOut(x.s), e: toOut(x.e) }));

export const clean = (w: string) => w.toLowerCase().replace(/[^a-z0-9']/g, "");
/** Edit time (s) of the n-th occurrence of a spoken word. */
export const at = (word: string, nth = 1): number => {
  let k = 0;
  for (const x of WORDS) if (clean(x.w) === word.toLowerCase() && ++k === nth) return x.s;
  throw new Error(`word not found: ${word} #${nth}`);
};
export const end = (word: string, nth = 1): number => {
  let k = 0;
  for (const x of WORDS) if (clean(x.w) === word.toLowerCase() && ++k === nth) return x.e;
  throw new Error(`word not found: ${word} #${nth}`);
};

/** Source shot changes (scene detection), in edit seconds. */
export const SHOTS = [0, 3.3667, 11.0333, 33.3333, 52.4667].map(toOut);

// Night-villa luxe: ink glass, champagne gold, warm cream.
export const GOLD = "#E8C27A";
export const GOLD_HI = "#FFE3A6";
export const GOLD_DEEP = "#B98A3E";
export const CREAM = "#FBF4E8";
export const INK = "#0C0E12";
export const MINT = "#7EE2B0";
export const RED = "#FF5B57";

export const T = {
  // 01 the skill (hook + backstory)
  start: at("start"),
  k5: at("5k"),
  month: at("month"),
  online1: at("online", 1),
  exactly: at("exactly"),
  so: at("so", 1),
  six: at("six"),
  months: at("months"),
  high: at("high"),
  skill: at("skill"),
  appointment1: at("appointment", 1),
  setting: end("setting"),
  allowed: at("allowed"),
  money: at("money"),
  n19: at("19"),
  education: at("education"),
  educationEnd: end("education"),
  // 02 the outreach
  when: at("when"),
  first1: at("first", 1),
  role1: at("role", 1),
  outreaching: at("outreaching"),
  coaches1: at("coaches", 1),
  businesses1: at("businesses", 1),
  every1: at("every", 1),
  day1: at("day", 1),
  hundreds: at("hundreds"),
  times1: at("times", 1),
  role2: at("role", 2),
  // 03 the message
  way1: at("the", 2),
  structured: at("structured"),
  hi: at("hi"),
  commission: at("commission"),
  setter2: at("setter", 2),
  straight: at("straight"),
  point: at("point"),
  personalised: at("personalised"),
  about: at("about"),
  looked: at("looked"),
  account: at("account"),
  fitness1: at("fitness", 1),
  fitness2: at("fitness", 2),
  admire: at("admire"),
  people: end("people"),
  // 04 the system
  tips: at("tips"),
  targets: at("targets"),
  stay: at("stay"),
  consistent: at("consistent"),
  dont: at("don't"),
  up2: at("up", 2),
  n100: at("100"),
  messages1: at("messages", 1),
  coaches2: at("coaches", 2),
  track: at("track"),
  saying2: at("saying", 2),
  sent: at("sent"),
  response: at("response"),
  percentage: at("percentage"),
  narrow: at("narrow"),
  best: at("best"),
  results: at("results"),
  efficient: at("efficient"),
  outreach3: end("outreach", 3),
  // 05 the close
  always: at("always"),
  messages2: at("messages", 2),
  endW: at("end"),
  question: at("question"),
  opens: at("opens"),
  conversation: at("conversation"),
  not: at("not"),
  hard: at("hard"),
  no: at("no"),
  noEnd: end("no"),
  endCard: CUT_END / FPS,
  end: DURATION,
};

/** Chapters: the numbered tag that opens each part of his method. */
export const CHAPTERS: { n: string; title: string; t: number }[] = [
  { n: "01", title: "The skill", t: T.so },
  { n: "02", title: "The outreach", t: T.when },
  { n: "03", title: "The message", t: T.way1 },
];

// Captions hide while a graphic is already saying the words.
export const CAPTION_HIDE: [number, number][] = [
  [T.endCard - 0.02, T.end],
];

export const KEYWORDS = new Set(["5k", "month", "online", "appointment", "setting", "setter", "skill", "19", "coaches", "businesses", "hundreds", "commission", "personalised", "consistent", "100", "track", "response", "percentage", "best", "results", "question", "conversation", "no", "efficient"]);

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
