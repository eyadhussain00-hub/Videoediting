import words from "./words.json";

// Every timing in the edit comes from here; the words come from faster-whisper on the conformed (24 fps) source.
export const FPS = 24;
export const DURATION = 91.375;

export type Word = { w: string; s: number; e: number };
export const WORDS = words as Word[];
export const clean = (w: string) => w.toLowerCase().replace(/[^a-z0-9']/g, "");
/** Time (s) of the n-th occurrence of a spoken word (case/punctuation-insensitive). */
export const at = (word: string, nth = 1): number => {
  let k = 0;
  for (const x of WORDS) if (clean(x.w) === word.toLowerCase() && ++k === nth) return x.s;
  throw new Error(`word not found: ${word} #${nth}`);
};

export const GOLD = "#EBC27A";
export const GOLD_DEEP = "#B98A3E";
export const GOLD_GRAD = "linear-gradient(180deg, #FFEBC2 0%, #EBC27A 48%, #B98A3E 100%)";
export const IVORY = "#F6EFE3";
export const INK = "#0B0A09";
export const RED = "#E0564B";

// Stock B-roll windows in the source (s). No depth layer / behind-type over these.
export const BROLL: [number, number][] = [
  [23.583, 25.417], [34.792, 39.792], [48.25, 51.583], [65.583, 69.292], [75.375, 81.5],
];
export const isBroll = (t: number) => BROLL.some(([a, b]) => t >= a && t < b);

export const T = {
  first: at("first"),
  millionaire: at("millionaire"),
  family: at("family"),
  three: at("three"),
  ch1: 6.5,
  beliefs: at("beliefs"),
  wrong: at("wrong"),
  worked: at("worked"),
  rich: at("rich"),
  follow: at("follow"),
  copy: at("copy"),
  respect: at("respect"),
  playbook: at("playbook"),
  survival: at("survival"),
  different: at("different"),
  wealth: at("wealth"),
  ch2: 28.95,
  hard: at("hard"),
  not: at("not"),
  richTwo: at("rich", 2),
  farmer: at("farmer"),
  twelve: at("12"),
  day: at("day"),
  real: at("real"),
  painful: at("painful"),
  barely: at("barely"),
  by: at("by"),
  strategy: at("strategy"),
  leverage: at("leverage"),
  strategy2: at("strategy", 2),
  where: at("where"),
  effort: at("effort"),
  leverage2: at("leverage", 2),
  hundred: at("hundred"),
  more: at("more"),
  ch3: 61.55,
  attention: at("attention"),
  best: at("best"),
  zero: at("zero"),
  lose: at("lose"),
  average: at("average"),
  lots: at("lots"),
  attention3: at("attention", 3),
  speak: at("speak"),
  write: at("write"),
  seen: at("seen"),
  listen: at("listen"),
  somebody: at("somebody"),
  breakW: at("break"),
  cycle: at("cycle"),
  let: at("let"),
  you: at("you", 7),
  end: DURATION,
};

export const CHAPTERS = [
  { s: T.ch1, e: T.ch2, n: "01", word: "Beliefs", label: "UNLEARN THE OLD PLAYBOOK" },
  { s: T.ch2, e: T.ch3, n: "02", word: "Leverage", label: "WORK SMARTER, NOT LONGER" },
  { s: T.ch3, e: T.listen, n: "03", word: "Attention", label: "BE SEEN OR BE SKIPPED" },
] as const;

// Captions are hidden while a graphic is already saying the words.
export const CAPTION_HIDE: [number, number][] = [
  [T.ch1 - 0.05, T.beliefs - 0.15],
  [T.follow - 0.6, T.respect + 1.15],
  [T.playbook - 0.25, T.ch2],
  [T.ch2 - 0.05, T.hard - 0.1],
  [T.strategy - 0.4, 51.55],
  [T.strategy2 - 0.1, T.leverage2 - 0.2],
  [T.ch3 - 0.05, at("learn") - 0.1],
  [T.best - 0.3, T.listen - 0.1],
  [T.let - 0.1, 99],
];

export const KEYWORDS = new Set([
  "first", "millionaire", "three", "wrong", "rich", "follow", "copy", "respect", "survival", "wealth", "hard",
  "farmer", "12", "painful", "barely", "strategy", "leverage", "where", "hundred", "attention", "best", "zero",
  "lose", "average", "lots", "speak", "write", "seen", "cycle", "break", "playbook",
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
    if (cur.length && (cur.length >= 3 || /[.,?!]$/.test(prev.w) || w.s - prev.e > 0.3 || (KEYWORDS.has(clean(w.w)) && cur.length >= 2))) flush();
    cur.push(w);
  });
  flush();
  return out;
})();
