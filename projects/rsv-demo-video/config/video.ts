import type { Beat, Bilingual } from "./types";

// The editorial half of a demo video: which moments of the recordings to use, how fast to play them,
// where to zoom, and what the captions say. Kept apart from the footage config (config/clinic.ts), which
// only says what gets recorded, and from the mockups (config/mockups.ts), which only say what the devices
// look like — so the next client changes words and cuts here without touching either.

// A point inside a beat: "start", "end", or one of the marks the recorder wrote (e.g. "answered").
export type Point = string;

export type Zoom = {
  // A focus area the recorder saved for this beat (e.g. "drawer", "assistant").
  focus: string;
  // How far to push in. Left out, it's worked out from the size of the focus area.
  scale?: number;
  // When the push starts, as a point in the beat; defaults to the start of the clip.
  at?: Point;
};

export type Clip = {
  beat: Beat;
  from?: Point;
  to?: Point;
  // Seconds added before `from` / after `to`, to catch a lead-in or let a moment breathe. May be negative.
  pre?: number;
  post?: number;
  // Playback speed. Typing and waiting are sped up; results play near real time so they can be read.
  speed: number;
  // One or more pushes into the screen; several play one after another across the clip.
  zooms?: Zoom[];
  // Key into the caption lines. Consecutive clips with the same key share one caption.
  caption?: string;
  // Shows the incoming Telegram message beside the device, from this point in the beat.
  telegramAt?: Point;
};

export type Storyboard = {
  fps: number;
  // Seconds.
  intro: number;
  transition: number;
  end: number;
  laptop: Clip[];
  phone: Clip[];
};

export type CaptionLine = { kicker?: Bilingual; text: Bilingual };

export type Captions = {
  intro: { lines: Bilingual[]; sub: Bilingual };
  lines: Record<string, CaptionLine>;
  telegram: { label: Bilingual; now: Bilingual };
  end: { title: Bilingual; sub: Bilingual; cta: Bilingual; contact: string; brand: string };
};
