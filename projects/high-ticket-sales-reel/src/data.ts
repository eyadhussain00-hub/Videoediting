import words from "./words.json";

// Every timing comes from here. Words are faster-whisper on the source (plan/words.json → scripts/fix_words.py →
// src/words.json, SOURCE seconds); the cut list trims his longest pauses and every word is remapped onto the edit.
export const FPS = 30;

/** Kept source ranges, in source frames [from, to). Cuts sit in his pauses (envelope, plan/storyboard.md). */
export const SEGMENTS: [number, number][] = [
  [0, 276], // What is high ticket sales? … from $1,000 upwards.
  [289, 455], // The reason why you need human intervention … most
  [461, 553], // people cannot spend that amount of money
  [558, 643], // without having to rationalize whether it makes sense or not.
  [651, 1179], // So you need human intervention … a setter and a closer.
];
let acc = 0;
export const SEG_OUT = SEGMENTS.map(([s, e]) => ((acc += e - s), acc - (e - s)));
export const CUT_END = acc;
export const END_HOLD = 54; // end card over a freeze of the last frame
export const DURATION = (CUT_END + END_HOLD) / FPS;

/** Source seconds → edit seconds. */
export const toOut = (src: number) => {
  const f = src * FPS;
  for (let i = SEGMENTS.length - 1; i >= 0; i--) if (f >= SEGMENTS[i][0] - 2) return (SEG_OUT[i] + Math.min(f, SEGMENTS[i][1]) - SEGMENTS[i][0]) / FPS;
  return f / FPS;
};

export type Word = { w: string; s: number; e: number };
export const WORDS: Word[] = (words as Word[]).map((x) => ({ w: x.w, s: toOut(x.s), e: toOut(x.e) }));

export const clean = (w: string) => w.toLowerCase().replace(/[^a-z0-9'$,]/g, "").replace(/,$/, "");
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

// Palette: deep ink, champagne gold for money, mint for "yes", signal red for remorse.
export const INK = "#0B0E14";
export const GOLD = "#F4C760";
export const GOLD_DEEP = "#D99A2B";
export const MINT = "#43E0A0";
export const RED = "#FF4D4F";
export const PAPER = "#FBF8F2";

export const T = {
  high1: at("high", 1),
  sales1: at("sales", 1),
  high2: at("high", 2),
  sell: at("sell"),
  product: at("product"),
  service: at("service"),
  online: at("online"),
  priced: at("priced"),
  k1: at("$1,000", 1),
  upwards: at("upwards"),
  s2: segAt(1),
  reason: at("reason"),
  human1: at("human", 1),
  k2: at("$1,000", 2),
  plus: at("plus"),
  most: at("most"),
  cannot: at("cannot"),
  spend1: at("spend", 1),
  money1: at("money", 1),
  rationalize: at("rationalize"),
  sense: at("sense"),
  not: at("not"),
  so1: at("so", 1),
  human2: at("human", 2),
  qualify: at("qualify"),
  right: at("right"),
  decision1: at("decision", 1),
  one: at("one"),
  two: at("two"),
  buyers: at("buyer's"),
  remorse: at("remorse"),
  they2: at("they", 2),
  lot: at("lot"),
  back: at("back"),
  decision2: at("decision", 2),
  scared: at("scared"),
  money3: end("money", 3),
  so3: at("so", 3),
  setter: at("setter"),
  closer: at("closer"),
  endCard: CUT_END / FPS,
  end: DURATION,
};

// Captions hide while a graphic already says the words. The last line is mumbled ("So you('ve) … sales …"),
// so the two-roles graphic carries it until "a setter and a closer".
export const CAPTION_HIDE: [number, number][] = [
  [T.so3 - 0.05, T.setter - 0.25],
  [T.endCard - 0.02, T.end],
];

export const KEYWORDS = new Set(["high", "ticket", "sales", "$1,000", "upwards", "human", "intervention", "plus", "rationalize", "sense", "qualify", "prospect", "right", "decision", "remorse", "scared", "money", "setter", "closer", "one", "two"]);

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
    if (cur.length && (cur.length >= 3 || /[.?!]$/.test(prev.w) || /,$/.test(prev.w) && !/^\$/.test(prev.w) || w.s - prev.e > 0.3)) flush();
    cur.push(w);
  });
  flush();
  return out;
})();
