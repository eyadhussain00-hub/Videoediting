import raw from "./words.json";

// Every timing comes from here. Words are faster-whisper on the source audio (plan/words.json → src/words.json, SOURCE
// seconds), fixed below; the cut list trims his three longest pauses, and every word is remapped onto the edit.
export const FPS = 30;

/** Kept source ranges in source frames [from, to). Cuts sit inside his pauses (silencedetect on the vocal stem). */
export const SEGMENTS: [number, number][] = [
  [0, 590], // hook … items 1-3 up to "maintaining family ties."
  [600, 1106], // "The Prophet ﷺ said whoever wants to expand…" … "Number five, gratitude."
  [1118, 1193], // "Allah says if you are grateful, I will give you more."
  [1204, 1758], // "You're so focused…" … "the transaction is blessed."
];
let acc = 0;
export const SEG_OUT = SEGMENTS.map(([s, e]) => ((acc += e - s), acc - (e - s)));
export const CUT_END = acc;
export const RECAP = 108; // all seven, ticked off, over the speaker
export const END_HOLD = 66; // end card
export const DURATION = (CUT_END + RECAP + END_HOLD) / FPS;

export const toOut = (src: number) => {
  const f = src * FPS;
  for (let i = SEGMENTS.length - 1; i >= 0; i--) if (f >= SEGMENTS[i][0] - 2) return (SEG_OUT[i] + Math.min(f, SEGMENTS[i][1]) - SEGMENTS[i][0]) / FPS;
  return f / FPS;
};

export type Word = { w: string; s: number; e: number };
/** Transcript fixes: Whisper heard "Nuh" as "Noor"; the salawat becomes one ﷺ token; a zero-length "Muslim". */
const fixed: Word[] = [];
(raw as Word[]).forEach((x) => {
  const w = { ...x };
  if (w.w === "Noor.") w.w = "Nuh.";
  if (w.w === "Muslim." && w.e - w.s < 0.05) (w.s = 3.1), (w.e = 3.6);
  const prev = fixed[fixed.length - 1];
  if (/^(Alaihi|Wasallam)$/.test(w.w) && prev?.w === "ﷺ") return void (prev.e = w.e);
  if (w.w === "SallAllahu") w.w = "ﷺ";
  fixed.push(w);
});
export const WORDS: Word[] = fixed.map((x) => ({ w: x.w, s: toOut(x.s), e: toOut(x.e) }));

export const clean = (w: string) => w.toLowerCase().replace(/[^a-z0-9'ﷺ]/g, "");
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

// Palette: night emerald + illuminated-manuscript gold + ivory.
export const NIGHT = "#04140F";
export const EMERALD = "#0B3B2E";
export const EMERALD_HI = "#15624B";
export const GOLD = "#E2BC72";
export const GOLD_HI = "#F7E2AE";
export const GOLD_DEEP = "#A9792F";
export const IVORY = "#F7F0E1";

export type Ref = { kind: "QURAN" | "HADITH"; src: string; ar: string; en: string; at: number; until: number };
export type Item = { n: number; name: string; ar: string; tr: string; meaning: string; start: number; nameEnd: number; ref: Ref };

const recapAt = CUT_END / FPS;
export const ITEMS: Item[] = [
  {
    n: 1, name: "Istighfaar", ar: "اِسْتِغْفَار", tr: "istighfār", meaning: "Seeking forgiveness from Allah",
    start: at("number", 1), nameEnd: end("istighfaar"),
    ref: { kind: "QURAN", src: "Surah Nuh · 71:10–12", ar: "وَيُمْدِدْكُم بِأَمْوَالٍ وَبَنِينَ", en: "“…and He will provide you with wealth and children.”", at: at("tells"), until: end("children") + 0.35 },
  },
  {
    n: 2, name: "Taqwa", ar: "تَقْوَى", tr: "taqwā", meaning: "Doing the obligations, leaving the haraam",
    start: at("number", 2), nameEnd: end("allah", 3),
    ref: { kind: "QURAN", src: "Surah At-Talaq · 65:2–3", ar: "وَيَرْزُقْهُ مِنْ حَيْثُ لَا يَحْتَسِبُ", en: "“And He will provide for him from where he does not expect.”", at: at("promises"), until: end("expect") + 0.3 },
  },
  {
    n: 3, name: "Family Ties", ar: "صِلَةُ الرَّحِم", tr: "ṣilat ar-raḥim", meaning: "Keeping the bonds of kinship",
    start: at("third"), nameEnd: end("ties", 1),
    ref: { kind: "HADITH", src: "Sahih al-Bukhari · 5986", ar: "فَلْيَصِلْ رَحِمَهُ", en: "“Whoever wants his provision expanded, let him maintain his ties of kinship.”", at: at("prophet", 1), until: end("kinship") + 0.25 },
  },
  {
    n: 4, name: "Charity", ar: "صَدَقَة", tr: "ṣadaqah", meaning: "Giving for the sake of Allah",
    start: at("number", 3), nameEnd: end("charity", 1),
    ref: { kind: "HADITH", src: "Sahih Muslim · 2588", ar: "مَا نَقَصَتْ صَدَقَةٌ مِنْ مَالٍ", en: "“Charity does not decrease wealth.”", at: at("prophet", 2), until: end("wealth", 2) + 0.35 },
  },
  {
    n: 5, name: "Gratitude", ar: "شُكْر", tr: "shukr", meaning: "Thanking Allah for what you have",
    start: at("number", 4), nameEnd: end("gratitude"),
    ref: { kind: "QURAN", src: "Surah Ibrahim · 14:7", ar: "لَئِن شَكَرْتُمْ لَأَزِيدَنَّكُمْ", en: "“If you are grateful, I will surely give you more.”", at: at("says"), until: end("more", 2) + 0.3 },
  },
  {
    n: 6, name: "Tawakkul", ar: "تَوَكُّل", tr: "tawakkul", meaning: "Reliance upon Allah",
    start: at("number", 5), nameEnd: end("tawakkul"),
    ref: { kind: "HADITH", src: "Jami at-Tirmidhi · 2517", ar: "اعْقِلْهَا وَتَوَكَّلْ", en: "“Tie it, and trust in Allah.”", at: at("trust", 1), until: end("camel") + 0.35 },
  },
  {
    n: 7, name: "Honesty in Business", ar: "الصِّدْق", tr: "ṣidq", meaning: "Truthful buying and selling",
    start: at("number", 6), nameEnd: end("business"),
    ref: { kind: "HADITH", src: "Sahih al-Bukhari · 2079", ar: "فَإِنْ صَدَقَا وَبَيَّنَا بُورِكَ لَهُمَا", en: "“If they are truthful and clear, their deal is blessed.”", at: at("prophet", 3), until: recapAt - 0.1 },
  },
];
/** The chapter card covers "Number N, <name>" and lifts a beat after the name. */
export const cardWin = (it: Item): [number, number] => [it.start - 0.16, it.nameEnd + 0.22];
/** Which item is current at t (0 before item 1). */
export const itemAt = (t: number) => {
  let k = 0;
  for (const it of ITEMS) if (t >= it.start - 0.16) k = it.n;
  return k;
};

export const T = {
  seven: at("seven"),
  things: at("things"),
  right: at("right"),
  increase: at("increase"),
  rizq: at("rizq"),
  muslim: at("muslim", 1),
  wealth1: at("wealth", 1),
  children: at("children"),
  expect: at("expect"),
  where: at("where"),
  kinship: at("kinship"),
  dont: at("don't"),
  break: at("break"),
  decrease: at("decrease"),
  releasing: at("releasing"),
  more1: at("more", 1),
  grateful: at("grateful"),
  more2: at("more", 2),
  focused: at("focused"),
  forgotten: at("forgotten"),
  given: at("given"),
  reliance: at("reliance"),
  tie: at("tie"),
  camel: at("camel"),
  work: at("work"),
  result: at("result"),
  buyer: at("buyer"),
  seller: at("seller"),
  blessed: at("blessed"),
  recap: recapAt,
  endCard: (CUT_END + RECAP) / FPS,
  end: DURATION,
};

/** Captions hide under the hook title, the chapter cards, the recap and the end card. */
export const CAPTION_HIDE: [number, number][] = [[T.increase - 0.1, cardWin(ITEMS[0])[0]], ...ITEMS.map(cardWin), [T.recap - 0.05, T.end]];

export const KEYWORDS = new Set([
  "rizq", "muslim", "istighfaar", "forgiveness", "allah", "wealth", "children", "taqwa", "provide", "expect", "family", "ties",
  "kinship", "sadaqah", "charity", "decrease", "gratitude", "grateful", "more", "tawakkul", "reliance", "trust", "camel",
  "work", "result", "honesty", "truthful", "blessed", "ﷺ", "nuh",
]);

export type Group = { words: Word[]; s: number; e: number };
/** Caption groups: break on punctuation, gaps > .3 s, or 3 words; ﷺ always closes a group. */
export const GROUPS: Group[] = (() => {
  const out: Group[] = [];
  let cur: Word[] = [];
  const flush = () => {
    if (cur.length) out.push({ words: cur, s: cur[0].s, e: cur[cur.length - 1].e });
    cur = [];
  };
  WORDS.forEach((w, i) => {
    const prev = WORDS[i - 1];
    if (cur.length && (cur.length >= 3 || /[.,?!]$/.test(prev.w) || prev.w === "ﷺ" || w.s - prev.e > 0.3)) flush();
    cur.push(w);
  });
  flush();
  return out;
})();
