import words from "./words.json";

// Every timing comes from here. The words are faster-whisper on the source audio (plan/words.json → scripts/fix_words.py
// → src/words.json, in SOURCE seconds); the cut list below tightens his pauses, and every word is remapped onto the
// edit's timeline, so beats stay locked to speech.
export const FPS = 30;

/** Kept source ranges, in source frames [from, to). Cut points sit in his pauses (vocal-stem envelope, plan/storyboard.md). */
export const SEGMENTS: [number, number][] = [
  [0, 114], // Imagine if TikTok locked itself at salah time.
  [135, 182], // You would probably pray for us, right?
  [216, 281], // Well, guess what? That's exactly what I built.
  [291, 329], // I built FocusDeen.
  [338, 443], // And FocusDeen will block all of your social media at salah time.
  [453, 543], // So you can focus on salah and pray with concentration.
  [557, 713], // If you want to give it a try, search FocusDeen on the App Store or the link is in my bio.
];
/** Output frame where each segment starts. */
let acc = 0;
export const SEG_OUT = SEGMENTS.map(([s, e]) => ((acc += e - s), acc - (e - s)));
export const CUT_END = acc;
export const END_HOLD = 36; // end card over a freeze of the last frame
export const DURATION = (CUT_END + END_HOLD) / FPS;

/** Source seconds → edit seconds (inside a kept segment). */
export const toOut = (src: number) => {
  const f = src * FPS;
  for (let i = SEGMENTS.length - 1; i >= 0; i--) if (f >= SEGMENTS[i][0] - 2) return (SEG_OUT[i] + f - SEGMENTS[i][0]) / FPS;
  return f / FPS;
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
export const segAt = (i: number) => SEG_OUT[i] / FPS;

// FocusDeen's own palette (App Store screens): coral, warm cream UI, pink heart mascot on lavender.
export const CORAL = "#FF5A5F";
export const CORAL_DEEP = "#E9434C";
export const CREAM = "#FFF8EF";
export const INK = "#24161B";
export const LAV = "#B5A3F2";
export const PINK = "#F7858C";

export const T = {
  tiktok: at("tiktok"),
  locked: at("locked"),
  salah1: at("salah", 1),
  s2: segAt(1),
  pray: at("pray", 1),
  right: at("right"),
  s3: segAt(2),
  guess: at("guess"),
  what: at("what", 1),
  thats: at("that's"),
  built1: at("built", 1),
  s4: segAt(3),
  focusdeen1: at("focusdeen", 1),
  s5: segAt(4),
  block: at("block"),
  social: at("social"),
  salah2: at("salah", 2),
  time2: at("time", 2),
  s6: segAt(5),
  focus: at("focus"),
  salah3: at("salah", 3),
  pray2: at("pray", 2),
  concentration: at("concentration"),
  s7: segAt(6),
  try: at("try"),
  search: at("search"),
  store: at("store"),
  link: at("link"),
  bio: end("bio"),
  endCard: CUT_END / FPS,
  end: DURATION,
};

// Captions hide while a graphic is already saying the words.
export const CAPTION_HIDE: [number, number][] = [
  [T.focusdeen1 - 0.05, T.s5 + 0.02],
  [T.endCard - 0.02, T.end],
];

export const KEYWORDS = new Set(["tiktok", "salah", "pray", "built", "focusdeen", "block", "social", "media", "focus", "concentration", "try", "app", "store", "bio"]);

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
