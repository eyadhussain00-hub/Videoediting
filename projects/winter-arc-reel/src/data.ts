import words from "./words.json";

// Every timing in the edit comes from here; the words come from faster-whisper on the source audio
// (plan/words.json), with spellings fixed for the screen by scripts/fix_words.py → src/words.json.
export const FPS = 30;
export const DURATION = 69.7;

export type Word = { w: string; s: number; e: number };
export const WORDS = words as Word[];

export const clean = (w: string) => w.toLowerCase().replace(/[^a-z0-9']/g, "");
/** Time (s) of the n-th occurrence of a spoken word (case/punctuation-insensitive). */
export const at = (word: string, nth = 1): number => {
  let k = 0;
  for (const x of WORDS) {
    if (clean(x.w) === word.toLowerCase() && ++k === nth) return x.s;
  }
  throw new Error(`word not found: ${word} #${nth}`);
};

// Winter palette: frost white + glacier blue; one warm accent only for the dawn / barakah beat.
export const ICE = "#BFE6FF";
export const ICE_DEEP = "#5FAEEA";
export const ICE_GRAD = "linear-gradient(180deg, #FFFFFF 0%, #DDF2FF 40%, #8CCBF5 100%)";
export const DAWN = "#FFC98A";
export const DAWN_GRAD = "linear-gradient(180deg, #FFF3DC 0%, #FFD08A 45%, #E9964A 100%)";
export const NIGHT = "#06101C";

export const T = {
  hook: 0,
  next: at("for"),
  doIt: at("this"),
  s1: at("number"),
  noExcuses: at("no", 1),
  s2: at("after"),
  noScroll: at("no", 2),
  plan: at("plan"),
  sleep: at("sleep"),
  s3: at("wake"),
  four: at("4"),
  five: at("5"),
  tahajjud: at("tahajjud"),
  s4: at("pray", 3),
  fajr: at("fajr"),
  notSleep: at("not"),
  barakah: at("barakah"),
  s5: at("you're", 2),
  deep: at("deep"),
  quran: at("qur'an"),
  scroll: at("scroll"),
  s6: at("number", 2),
  execute: at("execute"),
  nonneg: at("nonnegotiables"),
  listIn: at("that", 2),
  workout: at("45"),
  corn: at("no", 3),
  drugs: at("no", 4),
  social: at("aim"),
  hour: at("one", 2),
  payoff: at("imagine"),
  ninety: at("90", 3),
  locked: at("locked"),
  unrec: at("unrecognisable"),
  offer: at("unrecognisable") + 0.98,
  brotherhood: at("brotherhood"),
  grind: at("grind"),
  opened: at("opened"),
  ihsan: at("ihsan"),
  hosting: at("hosting"),
  winterArc: at("winter"),
  challenge: at("challenge"),
  youGet: at("get"),
  training: at("multiple"),
  nutrition: at("nutrition"),
  accountability: at("accountability"),
  community: at("community", 2),
  choice: at("now"),
  waste: at("waste"),
  january: at("january"),
  newYear: at("new"),
  nonsense: at("nonsense"),
  or: at("or", 3),
  momentum: at("build"),
  become: at("become"),
  cta: at("comment"),
  link: at("link"),
  end: DURATION,
};

/** The six steps of the playbook. */
export const STEPS = [
  { n: 1, s: T.s1, e: T.s2, title: "Pray Isha in the masjid", word: "ISHA", sub: "Night prayer · in congregation" },
  { n: 2, s: T.s2, e: T.s3, title: "After Isha, no scrolling", word: "OFFLINE", sub: "Plan tomorrow · sleep early" },
  { n: 3, s: T.s3, e: T.s4, title: "Wake at 4–5 AM", word: "TAHAJJUD", sub: "Pray Tahajjud · daily" },
  { n: 4, s: T.s4, e: T.s5, title: "Pray Fajr in the masjid", word: "FAJR", sub: "No sleeping after Fajr" },
  { n: 5, s: T.s5, e: T.s6, title: "Use the barakah", word: "BARAKAH", sub: "Deep work · Qur'an" },
  { n: 6, s: T.s6, e: T.payoff, title: "Daily non-negotiables", word: "DISCIPLINE", sub: "Every single day" },
] as const;

// Captions are hidden while a graphic is already saying the words.
export const CAPTION_HIDE: [number, number][] = [
  [T.deep - 0.1, T.quran + 0.35],
  [T.listIn - 0.05, T.payoff - 0.02],
  [T.unrec - 0.05, T.offer],
  [T.youGet - 0.05, T.choice - 0.02],
  [T.cta - 0.05, T.end],
];

export const KEYWORDS = new Set([
  "90", "isha", "masjid", "excuses", "scrolling", "sleep", "tahajjud", "fajr", "barakah", "morning", "deep", "work",
  "qur'an", "scroll", "execute", "nonnegotiables", "locked", "brotherhood", "grind", "ihsan", "blueprint",
  "winter", "arc", "challenge", "waste", "january", "nonsense", "momentum", "man", "4", "5", "am", "unrecognisable",
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
    if (cur.length && (cur.length >= 3 || /[.,?!]$/.test(prev.w) || w.s - prev.e > 0.3 || /^[A-Z]/.test(w.w) && !/^(I|I've|I'm|Isha|Ihsan|Fajr|Tahajjud|Qur'an|Blueprint|Arc|Challenge|January|Year|Me|“WINTER”)$/.test(w.w))) flush();
    cur.push(w);
  });
  flush();
  return out;
})();
