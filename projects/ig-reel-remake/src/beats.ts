// Every timing in the video lives here (seconds, from the word timestamps in words.json).
// Retiming = edit this file. scripts/mix.py reads SFX cues from the same numbers via beats.json.
import { Easing, interpolate } from "remotion";

export const FPS = 30;
export const TALK_END = 59.17; // source reel length
export const TOTAL = 62.0; // + CTA end card

export const B = {
  agree: 2.2,
  disagree: 3.26,
  between: 4.34,
  irrelevant: 4.78,
  views: 6.4,
  posting: 7.16,
  three: 10.52,
  ch1: 11.1,
  relevantViewer: 13.58,
  simplistic: 15.46,
  book: 18.3,
  ch2: 19.1,
  info: 20.36,
  pain: 22.08,
  action: 24.42,
  nice: 26.54,
  ch3: 28.76,
  trust: 29.66,
  money: 30.64,
  know: 32.7,
  like: 32.86,
  trustK: 33.12,
  human: 34.74,
  passionate: 36.64,
  knowledge: 37.62,
  robot: 40.58,
  life: 42.72,
  q1: 45.04,
  q2: 45.72,
  q3: 46.38,
  q4: 47.32,
  expose: 48.84,
  beliefs: 52.74,
  bond: 53.96,
  clone: 57.9,
} as const;

export const ease = Easing.bezier(0.22, 1, 0.36, 1); // easeOutQuint-ish: entrances
export const easeIn = Easing.bezier(0.55, 0, 1, 0.45); // exits
export const easeIO = Easing.bezier(0.65, 0, 0.35, 1);

/** 0→1 over [a, a+d] with easing, clamped. */
export const ramp = (t: number, a: number, d: number, e = ease) =>
  interpolate(t, [a, a + d], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: e });

/** Visibility envelope: fades in at a, out at b. */
export const env = (t: number, a: number, b: number, inD = 0.25, outD = 0.2) =>
  Math.min(ramp(t, a, inD), 1 - ramp(t, b - outD, outD, easeIn));

export const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
