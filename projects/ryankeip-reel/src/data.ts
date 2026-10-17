import segments from "./segments.json";
import words from "./words.json";

// Every timing comes from here. The words are faster-whisper on the source audio (plan/words.json → scripts/fix_words.py
// → src/words.json, in SOURCE seconds); the cut list (scripts/cuts.py → src/segments.json) trims his longer pauses, and
// every word is remapped onto the edit's timeline, so beats stay locked to speech.
export const FPS = 30;

/** Kept source ranges, in source frames [from, to). */
export const SEGMENTS = segments as [number, number][];
let acc = 0;
/** Output frame where each segment starts. */
export const SEG_OUT = SEGMENTS.map(([s, e]) => ((acc += e - s), acc - (e - s)));
export const CUT_END = acc;
export const END_HOLD = 60; // end card over a freeze of the last frame
export const DURATION = (CUT_END + END_HOLD) / FPS;

/** Source seconds → edit seconds. */
export const toOut = (src: number) => {
  const f = src * FPS;
  for (let i = SEGMENTS.length - 1; i >= 0; i--) if (f >= SEGMENTS[i][0] - 2) return (SEG_OUT[i] + Math.max(0, f - SEGMENTS[i][0])) / FPS;
  return f / FPS;
};

export type Word = { w: string; s: number; e: number };
export const WORDS: Word[] = (words as Word[]).map((x) => ({ w: x.w, s: toOut(x.s), e: toOut(x.e) }));

export const clean = (w: string) => w.toLowerCase().replace(/[^a-z0-9'-]/g, "").replace(/^-|-$/g, "");
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

// Palette: a biometric HUD. Ember/red while his body panics, cyan once he regulates; bone white type on charcoal.
export const INK = "#0A0C0F";
export const BONE = "#F4EFE6";
export const EMBER = "#FF5A1F";
export const RED = "#FF2E3A";
export const AMBER = "#FFB020";
export const CYAN = "#4FE3FF";
export const TEAL = "#2BD4A7";

export const T = {
  heat: at("heat"),
  body: at("body"),
  palms: at("palms", 1),
  clammy: at("clammy"),
  sweaty: at("sweaty", 1),
  lip: at("lip"),
  heart: at("heart", 1),
  racing: at("racing"),
  nowhere: at("nowhere"),
  anxious: at("anxious"),
  thats: at("that's"),
  nervous1: at("nervous", 1),
  threat: at("threat"),
  hasnt: at("hasn't"),
  yet: end("yet"),
  psychological: at("psychological"),
  why: end("why"),
  importantly: at("importantly"),
  show: at("show"),
  control1: at("control", 1),
  it1: end("it", 1),
  listen: at("listen"),
  sell: at("sell"),
  save: at("save"),
  share: at("share"),
  team: at("team"),
  hear: end("it", 3),
  explain: at("explain"),
  great: at("great"),
  conversation1: at("conversation"),
  flowing: at("flowing"),
  present: at("present"),
  price: at("price"),
  decision: at("decision"),
  boom: at("boom"),
  fight: at("fight", 1),
  or: at("or"),
  flight: at("flight"),
  mode: end("mode"),
  anticipatory: at("anticipatory"),
  anxiety1: end("anxiety"),
  brain: at("brain"),
  predicting: at("predicting"),
  rejection1: at("rejection", 1),
  before: at("before"),
  rejection2: at("rejection", 2),
  happened2: end("happened", 2),
  sympathetic: at("sympathetic"),
  kicks: at("kicks"),
  adrenaline1: at("adrenaline", 1),
  increased: at("increased"),
  rate: end("rate"),
  sweaty2: at("sweaty", 2),
  palms2: end("palms", 2),
  trouble: at("trouble"),
  troubleEnd: end("trouble"),
  talking: at("talking"),
  faster: at("faster"),
  over: at("over-explaining"),
  filling: at("filling"),
  silence: end("silence"),
  understanding: at("understanding"),
  protecting: at("protecting"),
  rejection3: end("rejection", 3),
  interrupt: at("interrupt"),
  three: at("three"),
  recognize1: at("recognize"),
  regulate1: at("regulate"),
  redirect1: at("redirect", 1),
  first: at("first"),
  tell: at("tell"),
  adrenaline2: at("adrenaline", 2),
  not: at("not"),
  danger: at("danger"),
  dangerEnd: end("danger"),
  second: at("second", 2),
  slow: at("slow"),
  take: at("take"),
  breath: at("breath"),
  longer: at("longer"),
  exhale: at("exhale"),
  exhaleEnd: end("exhale"),
  third: at("third"),
  stop: at("stop"),
  how2: at("how", 3),
  deal: end("deal"),
  start2: at("start", 2),
  what2: at("what", 1),
  clarity: at("clarity"),
  on: end("on", 3),
  now2: at("now", 2),
  discovery: at("discovery"),
  selfp: at("self-preservation"),
  selfpEnd: end("self-preservation"),
  remember: at("remember"),
  prospect3: at("prospect", 3),
  create: at("create"),
  anxiety2: end("anxiety", 2),
  anticipation: at("anticipation"),
  did: end("did"),
  elite: at("elite"),
  eliminate: at("eliminate"),
  fear1: at("fear", 1),
  rejection4: end("rejection", 5),
  they3: at("they", 3),
  stop2: at("stop", 2),
  fear2: at("fear", 2),
  control2: at("control", 2),
  conversation2: end("conversation", 2),
  endCard: CUT_END / FPS,
  end: DURATION,
};

/** Calm 0 (panic) → 1 (regulated): drives the HUD colour and the grade. */
export const calmAt = (t: number) => {
  const a = Math.min(1, Math.max(0, (t - T.breath) / (T.exhaleEnd + 0.4 - T.breath)));
  return a * a * (3 - 2 * a);
};
/** Heat 0..1: the panic, built in the hook, peaks on "boom", gone after "regulate". */
export const heatAt = (t: number) => {
  const up = (a: number, d: number) => Math.min(1, Math.max(0, (t - a) / d));
  let h: number;
  if (t < T.boom - 0.05) h = (0.6 * up(T.heat - 0.2, 0.8) + 0.4 * up(T.racing, 0.5)) * (1 - 0.75 * up(T.listen, 0.8)) + 0.3 * up(T.price, 1.2);
  else h = 1 - 0.3 * up(T.boom + 0.3, 5) - 0.3 * up(T.interrupt, 2);
  return Math.min(1, h) * (1 - calmAt(t));
};

// Captions hide while a graphic is already saying the words.
export const CAPTION_HIDE: [number, number][] = [
  [T.hasnt - 0.05, T.yet + 0.3],
  [T.fight - 0.05, T.anxiety1 + 0.35],
  [T.three - 0.05, T.redirect1 + 0.6],
  [T.how2 - 0.1, T.on + 0.3],
  [T.elite - 0.1, T.end],
];

export const KEYWORDS = new Set([
  "heat", "palms", "clammy", "sweaty", "heart", "racing", "anxious", "nervous", "threat", "control", "save", "share",
  "price", "decision", "boom", "rejection", "adrenaline", "trouble", "faster", "over-explaining", "silence",
  "protecting", "recognize", "regulate", "redirect", "danger", "breath", "exhale", "deal", "clarity", "discovery",
  "anxiety", "anticipation", "elite", "fear",
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
