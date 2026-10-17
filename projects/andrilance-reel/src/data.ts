import words from "./words.json";

// Every timing comes from here. Words are faster-whisper on the source audio (plan/words.json → scripts/fix_words.py →
// src/words.json, in SOURCE seconds); the cut list drops one line ("There's not going to be any fancy edits in this
// video, but"), and every word is remapped onto the edit's timeline so graphics stay locked to speech.
export const FPS = 30;

/** Kept source ranges, in source frames [from, to). */
export const SEGMENTS: [number, number][] = [
  [0, 617], // … just like training in the gym.
  [678, 4024], // if you really do want to change your life … so you can start this today.
];
let acc = 0;
export const SEG_OUT = SEGMENTS.map(([s, e]) => ((acc += e - s), acc - (e - s)));
export const CUT_END = acc;
export const END_HOLD = 54; // end card over a freeze of the last frame
export const DURATION = (CUT_END + END_HOLD) / FPS;

/** Source seconds → edit seconds. */
export const toOut = (src: number) => {
  const f = src * FPS;
  for (let i = SEGMENTS.length - 1; i >= 0; i--) if (f >= SEGMENTS[i][0] - 2) return (SEG_OUT[i] + f - SEGMENTS[i][0]) / FPS;
  return f / FPS;
};

export type Word = { w: string; s: number; e: number };
const inCut = (x: Word) => SEGMENTS.some(([a, b]) => x.s * FPS >= a - 2 && x.s * FPS < b);
export const WORDS: Word[] = (words as Word[]).filter(inCut).map((x) => ({ w: x.w, s: toOut(x.s), e: toOut(x.e) }));

export const clean = (w: string) => w.toLowerCase().replace(/[^a-z0-9$%'.,–-]/g, "").replace(/[.,?!]+$/, "");
/** Edit time (s) of the n-th occurrence of a spoken word (punctuation ignored). */
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

// Palette: warm ink + ivory, one ember accent (money, the system, the call to action), graphite for what's crossed out.
export const INK = "#0D0B0A";
export const IVORY = "#F6F1E7";
export const EMBER = "#FF6A2B";
export const EMBER_SOFT = "#FFB18A";
export const GRAPHITE = "#8C8478";

export const T = {
  endCard: CUT_END / FPS,
  end: DURATION,
};

/** Full-screen takeovers: the footage shrinks into a card at the bottom while a graphic owns the frame. */
export const PIP: [number, number][] = [
  [at("all", 4) - 0.1, at("best") - 0.25], // 30,000 → 3 people → 0.01% → 9-to-5
];
/** Fully opaque graphics (the footage under them is never seen). */
export const COVER: [number, number][] = [
  [at("copy") - 0.05, at("it", 3) - 0.05], // copy-paste into Claude (hides the source's own prompt screenshot)
];

// Captions hide while a graphic is already saying the words.
export const CAPTION_HIDE: [number, number][] = [
  [0, at("while", 1) - 0.05],
  [at("dream") - 0.1, at("life") + 0.05],
  [T.endCard - 0.05, 999],
];

export const KEYWORDS = new Set([
  "$500,000", "21", "college", "freedom", "skill", "skill,", "learned", "gym", "life", "end", "3", "courses", "struggle",
  "same", "monetized", "high-ticket", "product", "ai", "system", "claude", "free", "step", "1", "interviewed",
  "skills", "knowledge", "expertise", "$1,000", "monetize", "prompt", "save", "dm", "buyers", "viral", "million",
  "3,000", "quality", "micro-specific", "micro-niche", "1,000", "30,000", "three", "0.01%", "9-to-5", "ceiling",
  "job", "hobby", "pay", "today",
]);

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

/** Sentence starts (edit s): the camera re-frames on each one. */
export const SENTENCES: number[] = WORDS.filter((w, i) => i === 0 || /[.?!]$/.test(WORDS[i - 1].w)).map((w) => w.s);
