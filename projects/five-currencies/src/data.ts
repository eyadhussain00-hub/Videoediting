import words from "./words.json";

// Every timing in the edit comes from here; the words come from faster-whisper on the source audio.
export const FPS = 30;
export const DURATION = 37;

export type Word = { w: string; s: number; e: number };
export const WORDS = words as Word[];

/** Time (s) of the n-th occurrence of a spoken word (case/punctuation-insensitive). */
export const at = (word: string, nth = 1): number => {
  let k = 0;
  for (const x of WORDS) {
    if (clean(x.w) === word.toLowerCase() && ++k === nth) return x.s;
  }
  throw new Error(`word not found: ${word} #${nth}`);
};
export const clean = (w: string) => w.toLowerCase().replace(/[^a-z0-9']/g, "");

export const GOLD = "#F2C46D";
export const GOLD_DEEP = "#C8902E";
export const GOLD_GRAD = "linear-gradient(180deg, #FFE3A3 0%, #F2C46D 45%, #C8902E 100%)";
export const INK = "#0B0B0C";

export const CURRENCIES = [
  { n: 1, name: "Time", key: "time" },
  { n: 2, name: "Identity", key: "identity" },
  { n: 3, name: "Money", key: "money" },
  { n: 4, name: "Energy", key: "energy" },
  { n: 5, name: "Reputation", key: "reputation" },
] as const;

// Section boundaries (s)
export const T = {
  five: at("five"),
  listIn: 2.36,
  list: [at("time"), at("identity"), at("money"), at("energy"), at("reputation")],
  time: 5.45,
  speed: at("speed"),
  shortcut: at("shortcut"),
  identity: 9.35,
  collageIn: 11.05,
  who: at("who"),
  yes: at("yes"),
  collageOut: 13.6,
  money: 13.62,
  ret: at("return"),
  savings: at("cost"),
  energy: 17.95,
  relief: at("relief"),
  pulling: at("pulling"),
  away: at("away"),
  reputation: 22.75,
  look: at("look"),
  peers: at("peers"),
  proof: 27.75,
  m23: at("23"),
  million: at("million"),
  fiveExact: at("five", 2),
  cta: 32.2,
  comment: at("comment"),
  coach: at("coach"),
  below: at("below"),
  send: at("send"),
};

// Captions are hidden while a graphic is already saying the words.
export const CAPTION_HIDE: [number, number][] = [
  [T.listIn - 0.05, T.time + 0.05],
  [T.collageIn, T.collageOut],
  [T.m23 - 0.1, T.million + 0.9],
];

export const KEYWORDS = new Set([
  "five", "time", "identity", "money", "energy", "reputation", "speed", "shortcut", "yes",
  "return", "investment", "savings", "relief", "away", "look", "peers", "currencies", "coach", "who",
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
    if (cur.length && (cur.length >= 3 || /[.,?!]$/.test(prev.w) || w.s - prev.e > 0.3 || KEYWORDS.has(clean(w.w)) && cur.length >= 2)) flush();
    cur.push(w);
  });
  flush();
  return out;
})();
