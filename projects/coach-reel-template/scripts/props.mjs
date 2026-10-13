// Job file + word-level transcript → the composition's props (and the sound cues that go with them).
//   node scripts/props.mjs jobs/<name>.json work/<name>/words.json work/<name>/props.json
// Everything the job leaves out gets the coach-reel default; see README.md for the job format.
import { readFileSync, writeFileSync } from 'node:fs';

const [jobPath, wordsPath, outPath, footageDur] = process.argv.slice(2);
if (!outPath) { console.error('usage: props.mjs <job.json> <words.json> <props.json> [footage seconds]'); process.exit(1); }
const job = JSON.parse(readFileSync(jobPath, 'utf8'));
const r2 = x => Math.round(x * 100) / 100;

// ── words ───────────────────────────────────────────────────────────────
// accepts [{w,s,e}] (scripts/transcribe.py) or [[w,s,e]]; times are in source seconds
const [t0, t1] = job.trim ?? [0, Infinity];
const fixes = job.fixes ?? {};
let words = JSON.parse(readFileSync(wordsPath, 'utf8'))
  .map(x => Array.isArray(x) ? x : [x.w ?? x.word, x.s ?? x.start, x.e ?? x.end])
  .map(([w, s, e]) => [String(w).trim(), s - t0, e - t0])
  .filter(([w, s, e]) => w && s >= -0.05 && e <= t1 - t0 + 0.05)
  .map(([w, s, e]) => [fixes[w] ?? fixes[w.replace(/[.,!?]$/, '')] ?? w, r2(Math.max(0, s)), r2(e)]);
if (!words.length) throw new Error('no words in the trimmed range');

// the clip ends a breath after the last word, never past the end of the footage
const clipDuration = r2(job.clipDuration ?? Math.min(Number.isFinite(t1) ? t1 - t0 : words.at(-1)[2] + 0.4, Number(footageDur) || Infinity));
const bare = w => w.toLowerCase().replace(/[^\p{L}\p{N}$%']/gu, '');

// sentence and pause boundaries: where a cut, or the end of the hook, can land
const boundaries = re => words.map(([, s], i) => i > 0 && (re.test(words[i - 1][0]) || s - words[i - 1][2] > 0.35) ? s : null).filter(x => x !== null);
const sentences = boundaries(/[.?!]$/);
const breaks = boundaries(/[.?!,;:]$/);

// ── hook ────────────────────────────────────────────────────────────────
const hook = {
  tag: job.hook?.tag,
  until: job.hook?.until ?? (sentences.find(b => b > 1.5) ?? 3),
  y: job.hook?.y ?? 210,
};

// ── cards ───────────────────────────────────────────────────────────────
// Each line rises in on the word it names, if it is said during the card; otherwise on a steady stagger.
const cards = (job.cards ?? []).map((c, i) => {
  const from = c.at, to = r2(c.at + (c.dur ?? 2.2));
  const texts = Array.isArray(c.lines) ? c.lines : String(c.lines).split('\n');
  let last = from + 0.1;
  const lines = texts.map((text, j) => {
    const said = words.find(([w, s]) => s >= last && s < to - 0.4 && bare(w) === bare(text.split(' ')[0]));
    const at = said ? said[1] : from + 0.3 + j * 0.2;
    last = Math.max(last, at + 0.05);
    return { text, at: r2(Math.max(at, from + 0.15)) };
  });
  const maxLen = Math.max(...texts.map(x => x.length));
  return {
    from, to, n: c.n ?? String(i + 1).padStart(2, '0'), lines,
    sub: c.sub, subAt: r2(c.subAt ?? Math.max(...lines.map(l => l.at)) + 0.3),
    size: c.size ?? (maxLen > 7 ? 150 : 200),
  };
});
const inCard = t => cards.some(c => t >= c.from - 0.3 && t < c.to + 0.3);

// ── cuts ────────────────────────────────────────────────────────────────
// Default: a punch-in at a sentence or pause boundary every ~2.5 s, alternating wide and tight,
// and a tight one as each card wipes off.
let cuts = job.cuts;
if (!cuts) {
  const scales = job.cutScales ?? [1.12, 1.26, 1.16, 1.3];
  const gap = job.cutEvery ?? 2.2;
  const ts = [0, ...cards.map(c => c.to)];
  for (const b of breaks) if (!inCard(b) && ts.every(t => Math.abs(b - t) >= gap)) ts.push(b);
  cuts = ts.sort((a, b) => a - b).filter(t => t < clipDuration - 0.5).map((t, i) => ({ t: r2(t), scale: scales[i % scales.length] }));
  cuts[0].scale = job.hook?.scale ?? 1.16;
}

// ── end card ────────────────────────────────────────────────────────────
const e = job.end ?? {};
const endFrom = clipDuration;
const accent = Array.isArray(e.accent) ? e.accent : e.accent ? [e.accent] : [];
const points = e.points ?? cards.map(c => c.lines.map(l => l.text).join(' ').replace(/\.$/, ''));
const pointsAt = r2(endFrom + 0.75 + accent.length * 0.15);
const handleAt = r2(pointsAt + points.length * 0.18 + 0.35);
const end = {
  from: endFrom, to: r2(endFrom + (e.dur ?? 3.5)),
  kicker: e.kicker ?? 'The recap', title: e.title ?? '', accent, points, pointsAt, handleAt,
  handle: e.handle, cta: e.cta ?? (e.handle ? 'Follow for more' : undefined),
};

// ── sound cues ──────────────────────────────────────────────────────────
const sfx = [{ t: 0, kind: 'impact', g: 0.7 }];
if (hook.tag) sfx.push({ t: 0.4, kind: 'tick', g: 0.5 });
for (const c of cuts.slice(1)) if (!cards.some(k => Math.abs(k.to - c.t) < 0.2)) sfx.push({ t: r2(c.t - 0.06), kind: 'whoosh', d: 0.3, g: 0.45 });
for (const c of cards) {
  sfx.push({ t: r2(c.from - 0.62), kind: 'riser', d: 0.62 }, { t: c.from + 0.02, kind: 'impact' });
  for (const l of c.lines) sfx.push({ t: l.at + 0.02, kind: 'tick', g: 0.7 });
  sfx.push({ t: r2(c.to - 0.08), kind: 'whoosh', d: 0.4 });
}
sfx.push({ t: r2(endFrom - 0.08), kind: 'whoosh', d: 0.4 }, { t: r2(endFrom + 0.08), kind: 'impact' });
points.forEach((_, i) => sfx.push({ t: r2(pointsAt + i * 0.18), kind: 'tick' }));
if (end.handle) sfx.push({ t: handleAt, kind: 'shimmer' });
sfx.push(...(job.sfx ?? []));

const props = {
  name: job.name,
  fps: job.fps ?? 30,
  clipDuration,
  duration: end.to,
  footage: `jobs/${job.name}/footage.mp4`,
  theme: { bg: '#07070B', ink: '#F4F4F6', mute: '#8B8B99', accent: '#D7FF3D', ...job.theme },
  focusY: job.focusY ?? 700,
  hook,
  cuts,
  covers: job.covers ?? [],
  words,
  emphasis: job.emphasis ?? [],
  captions: { y: 1385, maxWords: 3, maxChars: 17, ...job.captions },
  cards,
  cardLabel: job.cardLabel ?? 'Part',
  chapters: job.chapters ?? true,
  speaker: job.speaker,
  end,
  sfx: sfx.sort((a, b) => a.t - b.t),
  // read by sound.mjs and the mix, not the picture
  audio: { music: job.music?.on ?? true, musicGain: job.music?.gain ?? 0.38, bpm: job.music?.bpm ?? 96, sfxGain: job.sfxGain ?? 0.5 },
};
writeFileSync(outPath, JSON.stringify(props, null, 1));
console.log(`${job.name}: ${words.length} words, ${cuts.length} cuts, ${cards.length} cards, ${sfx.length} cues, ${props.duration} s`);
