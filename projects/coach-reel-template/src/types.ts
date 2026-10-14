// The props the composition renders from. scripts/props.mjs builds them from a job file (jobs/*.json)
// and the word-level transcript; every time is in seconds from the start of the trimmed clip.

/** One spoken word: [text, start, end]. */
export type Word = [string, number, number];

/** A virtual camera cut: from t on, the frame springs from a little wide of `scale` and drifts in. */
export type Cut = { t: number; scale: number };

/** A region of the source picture to hide (burned-in captions, a title box), in 1080×1920 footage space. */
export type Cover = {
  mode: "band" | "blur" | "patch";
  /** band: everything from y down turns to the background, through a soft feather. */
  y: number;
  /** blur: a feathered, darkened blur over the box x, y, w, h. patch: a feathered solid box (color, or the background). */
  x?: number;
  color?: string;
  w?: number;
  h?: number;
  from?: number;
  to?: number;
};

/** A full-screen chapter card in the accent colour. Line times are when each line rises in. */
export type Card = {
  from: number;
  to: number;
  n: string;
  lines: { text: string; at: number }[];
  sub?: string;
  subAt: number;
  size: number;
};

export type Sfx = { t: number; kind: string; g?: number; d?: number };

export type ReelProps = {
  name: string;
  fps: number;
  /** Length of the trimmed clip; the end card plays after it. */
  clipDuration: number;
  duration: number;
  footage: string;
  theme: { bg: string; ink: string; mute: string; accent: string };
  focusY: number;
  hook: { tag?: string; until: number; y: number };
  cuts: Cut[];
  covers: Cover[];
  words: Word[];
  emphasis: string[];
  captions: { y: number; maxWords: number; maxChars: number };
  cards: Card[];
  cardLabel: string;
  chapters: boolean;
  speaker?: { name: string; role?: string };
  end: {
    from: number;
    to: number;
    kicker: string;
    title: string;
    accent: string[];
    points: string[];
    pointsAt: number;
    handleAt: number;
    handle?: string;
    cta?: string;
  };
  sfx: Sfx[];
  audio?: { music: boolean; musicGain: number; bpm: number; sfxGain: number };
};
