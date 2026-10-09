import type { Clip, Point, Storyboard } from "../config/video";

// Turns a storyboard (which moments to use) and the recorder's cue sheets (when those moments happened)
// into frame-exact pieces of video. Pure data in, pure data out: the composition only draws what this says.

export type Rect = { x: number; y: number; w: number; h: number };

export type CueSheet = {
  video: string;
  width: number;
  height: number;
  duration: number;
  // Seconds the video file runs ahead of the times below (measured by the recorder's sync frame).
  offset?: number;
  locale: string;
  arrival: { name: string; username: string; text: string };
  cues: {
    id: string;
    start: number;
    end: number;
    marks: Record<string, number>;
    focus: Record<string, Rect & { at: number }>;
    gaps?: [number, number][];
  }[];
};

// One continuous run of source video, played at the clip's speed.
export type Piece = { srcFrom: number; outFrom: number; frames: number };

export type BuiltClip = {
  from: number; // output frame, relative to its device track
  frames: number;
  speed: number;
  pieces: Piece[];
  zooms: { frame: number; rect: Rect; scale?: number }[];
  caption?: string;
  telegram?: number; // output frame, relative to the track
};

export type Track = { clips: BuiltClip[]; frames: number; sheet: CueSheet };

export type Timeline = {
  fps: number;
  intro: { from: number; frames: number };
  laptop: { from: number; track: Track };
  transition: { from: number; frames: number };
  phone: { from: number; track: Track };
  end: { from: number; frames: number };
  total: number;
  captions: { from: number; frames: number; key: string; device: "laptop" | "phone" }[];
  telegram: { from: number; device: "laptop" | "phone" }[];
};

function point(cue: CueSheet["cues"][number], p: Point | undefined, fallback: "start" | "end"): number {
  const name = p ?? fallback;
  if (name === "start") return cue.start;
  if (name === "end") return cue.end;
  return cue.marks[name] ?? (fallback === "start" ? cue.start : cue.end);
}

// [a, b] minus every gap, as the stretches that remain.
function subtract(a: number, b: number, gaps: [number, number][]): [number, number][] {
  let parts: [number, number][] = [[a, b]];
  for (const [g0, g1] of gaps) {
    parts = parts.flatMap(([s, e]): [number, number][] => {
      if (g1 <= s || g0 >= e) return [[s, e]];
      const out: [number, number][] = [];
      if (g0 > s) out.push([s, g0]);
      if (g1 < e) out.push([g1, e]);
      return out;
    });
  }
  return parts.filter(([s, e]) => e - s > 0.05);
}

function buildClip(clip: Clip, sheet: CueSheet, fps: number, from: number): BuiltClip | null {
  const cue = sheet.cues.find((c) => c.id === clip.beat);
  if (!cue) return null;
  const a = Math.max(0, point(cue, clip.from, "start") - (clip.pre ?? 0));
  const b = Math.min(sheet.duration, point(cue, clip.to, "end") + (clip.post ?? 0));
  if (b <= a) return null;

  const gaps = sheet.cues.flatMap((c) => c.gaps ?? []);
  const offset = sheet.offset ?? 0;
  let out = 0;
  // Cut in the recorder's clock; srcFrom is where that moment actually is in the video file.
  const spans = subtract(a, b, gaps);
  const pieces: Piece[] = spans.map(([s, e]) => {
    const frames = Math.max(1, Math.round(((e - s) / clip.speed) * fps));
    const piece = { srcFrom: s + offset, outFrom: out, frames };
    out += frames;
    return piece;
  });
  if (!pieces.length) return null;

  // Where a moment in the source lands in the clip's output; a moment inside a removed gap lands at the
  // start of whatever plays next.
  const toOut = (t: number): number => {
    for (let i = 0; i < spans.length; i++) {
      const [s, e] = spans[i];
      if (t < s) return pieces[i].outFrom;
      if (t <= e) return pieces[i].outFrom + Math.round(((t - s) / clip.speed) * fps);
    }
    return out;
  };
  // Anything the camera is aimed at has to be on the screen.
  const onScreen = (r: Rect): Rect | null => {
    const x = Math.max(0, r.x);
    const y = Math.max(0, r.y);
    const w = Math.min(sheet.width, r.x + r.w) - x;
    const h = Math.min(sheet.height, r.y + r.h) - y;
    return w > 8 && h > 8 ? { x, y, w, h } : null;
  };

  const zooms = (clip.zooms ?? [])
    .map((z) => {
      const raw = cue.focus[z.focus];
      const rect = raw ? onScreen(raw) : null;
      return rect ? { frame: z.at ? toOut(point(cue, z.at, "start")) : 0, rect, scale: z.scale } : null;
    })
    .filter((z): z is NonNullable<typeof z> => z !== null)
    .sort((x, y) => x.frame - y.frame);

  return {
    from,
    frames: out,
    speed: clip.speed,
    pieces,
    zooms,
    caption: clip.caption,
    telegram: clip.telegramAt ? toOut(point(cue, clip.telegramAt, "start")) : undefined,
  };
}

function buildTrack(clips: Clip[], sheet: CueSheet, fps: number): Track {
  const built: BuiltClip[] = [];
  let at = 0;
  for (const clip of clips) {
    const b = buildClip(clip, sheet, fps, at);
    if (!b) continue;
    built.push(b);
    at += b.frames;
  }
  return { clips: built, frames: at, sheet };
}

export function buildTimeline(story: Storyboard, desktop: CueSheet, mobile: CueSheet): Timeline {
  const fps = story.fps;
  const f = (s: number) => Math.round(s * fps);
  const intro = { from: 0, frames: f(story.intro) };
  const laptopTrack = buildTrack(story.laptop, desktop, fps);
  const phoneTrack = buildTrack(story.phone, mobile, fps);
  const laptopFrom = intro.from + intro.frames;
  const transition = { from: laptopFrom + laptopTrack.frames, frames: f(story.transition) };
  const phoneFrom = transition.from;
  const end = { from: phoneFrom + phoneTrack.frames, frames: f(story.end) };

  const captions: Timeline["captions"] = [];
  const telegram: Timeline["telegram"] = [];
  for (const [device, from, track] of [
    ["laptop", laptopFrom, laptopTrack],
    ["phone", phoneFrom, phoneTrack],
  ] as const) {
    for (const clip of track.clips) {
      if (clip.telegram !== undefined) telegram.push({ from: from + clip.from + clip.telegram, device });
      if (!clip.caption) continue;
      const last = captions[captions.length - 1];
      // Consecutive clips with the same caption keep one caption on screen rather than flashing it.
      if (last && last.key === clip.caption && last.device === device && last.from + last.frames === from + clip.from) {
        last.frames += clip.frames;
      } else {
        captions.push({ from: from + clip.from, frames: clip.frames, key: clip.caption, device });
      }
    }
  }

  return {
    fps,
    intro,
    laptop: { from: laptopFrom, track: laptopTrack },
    transition,
    phone: { from: phoneFrom, track: phoneTrack },
    end,
    total: end.from + end.frames,
    captions,
    telegram,
  };
}
