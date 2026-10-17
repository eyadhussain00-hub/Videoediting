import words from "./words.json";

// Every timing comes from here. The words are faster-whisper on the source audio (plan/words.json → src/words.json,
// in SOURCE seconds); the cut list below tightens his pauses, and every word is remapped onto the edit's timeline,
// so beats stay locked to speech. Source footage is upscaled to 1080x1920 @ 30 fps (scripts/build_media.sh).
export const FPS = 30;

/** Kept source ranges, in source frames [from, to) at 30 fps. Cut points sit in his pauses (vocal-stem envelope). */
export const SEGMENTS: [number, number][] = [
  [7, 149], // Delayed gratification is the number one reason that businesses win.
  [170, 272], // You don't rush to charge customers, for example.
  [283, 365], // You let them help you succeed.
  [374, 515], // So the first customer I ever got in my agency, Fluid, I actually did the work for free.
  [528, 620], // Now a lot of people say don't do the work for free. I don't agree.
  [625, 749], // I built up a relationship with that customer, over-delivered when it was free.
  [760, 783], // And that meant,
  [790, 938], // once they were happy, not only did they use me forever for the sixteen years that I ran that company,
  [946, 1099], // they also recommended me to everybody. They felt like they were part of my early journey.
];
/** Output frame where each segment starts. */
let acc = 0;
export const SEG_OUT = SEGMENTS.map(([s, e]) => ((acc += e - s), acc - (e - s)));
export const CUT_END = acc;
export const END_HOLD = 66; // end card over a freeze of the last frame
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

// "The long game" palette: ink, bone paper, a warm gold for what compounds, a muted red for the short-term grab.
export const INK = "#0D0E11";
export const INK2 = "#16181D";
export const BONE = "#F3EEE4";
export const GOLD = "#E8B04B";
export const GOLD_HI = "#FFD685";
export const GOLD_DEEP = "#B9832A";
export const RED = "#E5484D";
export const MUTE = "#9A958C";

export const T = {
  delayed: at("delayed"),
  gratification: at("gratification"),
  number: at("number"),
  one: at("one"),
  reason: at("reason"),
  businesses: at("businesses"),
  win: at("win"),
  s2: segAt(1),
  dont1: at("don't", 1),
  rush: at("rush"),
  charge: at("charge"),
  customers: at("customers"),
  example: at("example"),
  s3: segAt(2),
  let: at("let"),
  help: at("help"),
  succeed: at("succeed"),
  s4: segAt(3),
  first: at("first"),
  customer1: at("customer", 1),
  agency: at("agency"),
  fluid: at("fluid"),
  actually: at("actually"),
  work1: at("work", 1),
  free1: at("free", 1),
  s5: segAt(4),
  lot: at("lot"),
  people: at("people"),
  dont2: at("don't", 2),
  free2: at("free", 2),
  dont3: at("don't", 3),
  agree: at("agree"),
  s6: segAt(5),
  built: at("built"),
  relationship: at("relationship"),
  customer2: at("customer", 2),
  over: at("over"),
  delivered: at("delivered"),
  free3: at("free", 3),
  meant: at("meant"),
  s7: segAt(7),
  happy: at("happy"),
  use: at("use"),
  forever: at("forever"),
  sixteen: at("sixteen"),
  years: at("years"),
  company: at("company"),
  s8: segAt(8),
  recommended: at("recommended"),
  everybody: at("everybody"),
  felt: at("felt"),
  part: at("part"),
  early: at("early"),
  journey: at("journey"),
  journeyEnd: end("journey"),
  endCard: CUT_END / FPS,
  end: (CUT_END + END_HOLD) / FPS,
};

// Captions hide while a graphic is already saying the words.
export const CAPTION_HIDE: [number, number][] = [
  [T.delayed - 0.1, T.number - 0.05],
  [T.dont3 - 0.08, T.s6 - 0.02],
  [T.sixteen - 0.05, T.company - 0.1],
  [T.part - 0.1, T.end],
];

export const KEYWORDS = new Set([
  "delayed", "gratification", "win", "rush", "charge", "help", "succeed", "first", "customer", "fluid", "free",
  "agree", "relationship", "delivered", "happy", "forever", "sixteen", "years", "recommended", "everybody", "journey",
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
