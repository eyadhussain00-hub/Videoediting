import words from "./words.json";

// Every timing in the edit comes from here. Words: faster-whisper on the Demucs-free source audio (plan/words.json),
// spellings fixed for the screen by scripts/fix_words.py → src/words.json.
export const FPS = 30;
export const SRC_END = 52.3; // the source footage ends here; the end card holds on its last frame
export const DURATION = 55.5;

export type Word = { w: string; s: number; e: number };
export const WORDS = words as Word[];

export const clean = (w: string) => w.toLowerCase().replace(/[^a-z0-9']/g, "");
/** Time (s) of the n-th occurrence of a spoken word (case/punctuation-insensitive). */
export const at = (word: string, nth = 1): number => {
  let k = 0;
  for (const x of WORDS) if (clean(x.w) === word && ++k === nth) return x.s;
  throw new Error(`word not found: ${word} #${nth}`);
};
export const endOf = (word: string, nth = 1): number => {
  let k = 0;
  for (const x of WORDS) if (clean(x.w) === word && ++k === nth) return x.e;
  throw new Error(`word not found: ${word} #${nth}`);
};

// Palette: night ink, warm gold, ivory. Crimson only for "destroy" / the heart, emerald only for "blessed".
export const INK = "#08070A";
export const GOLD = "#E9C983";
export const GOLD_DEEP = "#B9893A";
export const GOLD_GRAD = "linear-gradient(180deg, #FFF4D6 0%, #F2D18C 42%, #C4913F 100%)";
export const IVORY = "#F6EFE1";
export const CRIMSON = "#E2573F";
export const EMERALD = "#6FD9A8";

export const T = {
  destroy: at("destroy"),
  barakah: at("barakah"),
  rizq: at("rizq"),
  business: at("business"),
  coach: at("coach"),
  s1: at("the", 1),
  peace: at("peace"),
  buyer: at("buyer"),
  seller: at("seller"),
  trustful: at("trustful"),
  transparent: at("transparent"),
  transaction: at("transaction"),
  blessed: at("blessed"),
  s2: at("allah", 1),
  weDo: at("we", 1),
  provision: at("provision"),
  provide: at("provide"),
  quoteEnd2: endOf("you", 2),
  yourBusiness: at("your", 2),
  means: at("means"),
  provider: at("allah", 2),
  providerWord: at("provider"),
  s3: at("and", 4),
  quran: at("qur'an"),
  letNot: at("let"),
  wealth: at("wealth", 1),
  children: at("children"),
  remembrance: at("remembrance"),
  quoteEnd3: endOf("allah", 4),
  notHaving: at("and", 5),
  having: at("having"),
  disclaimer: at("wantto"),
  problem2: at("the", 6),
  hasHeart: at("has"),
  heart: at("heart", 1),
  dunya: at("have"),
  hands: at("hands"),
  but: at("but"),
  heart2: at("heart", 2),
  voiceEnd: endOf("heart", 2),
  cta: 52.15,
  end: DURATION,
};

/** The three sins (they're never said: the original showed them as title pills). */
export const SINS = [
  { n: 1, at: T.s1, title: "Dishonesty in Trade", sub: "", ar: "الغش" },
  { n: 2, at: T.s2, title: "Neglecting Salah", sub: "", ar: "الصلاة" },
  { n: 3, at: T.s3, title: "Chasing the Dunya", sub: "at the expense of your Ākhirah", ar: "الدنيا" },
] as const;
export const CARD_IN = 0.32; // a sin card opens this long before its line starts
export const CARD_OUT = 0.95; // …and hands over to the header this long after

// Captions are hidden while a card or a quote card is already saying the words.
export const CAPTION_HIDE: [number, number][] = [
  ...SINS.map((s) => [s.at - CARD_IN, s.at + CARD_OUT] as [number, number]),
  [T.weDo - 0.1, T.quoteEnd2 + 0.25],
  [T.letNot - 0.1, T.quoteEnd3 + 0.25],
  [T.cta - 0.1, T.end],
];

export const KEYWORDS = new Set([
  "sins", "destroy", "barakah", "rizq", "muslim", "prophet", "trustful", "transparent", "blessed", "provision",
  "means", "provider", "qur'an", "wealth", "heart", "dunya", "hands", "disclaimer", "remembrance",
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
