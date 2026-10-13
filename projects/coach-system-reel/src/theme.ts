import { Easing, interpolate, spring, useCurrentFrame } from "remotion";

export const FPS = 30;
export const W = 1080;
export const H = 1920;
export const DURATION = 51.5; // seconds: 47.9 s of speech, then the end card

export const C = {
  bg: "#07070B",
  ink: "#F4F4F6",
  mute: "#8B8B99",
  dim: "#3A3A46",
  line: "rgba(255,255,255,0.09)",
  card: "rgba(255,255,255,0.035)",
  volt: "#D7FF3D",
  red: "#FF5247",
};

export const F = {
  sans: "'Inter Tight', sans-serif",
  serif: "'Instrument Serif', serif",
  mono: "'JetBrains Mono', monospace",
};

export const ease = {
  out: Easing.bezier(0.16, 1, 0.3, 1),
  inOut: Easing.bezier(0.65, 0, 0.35, 1),
  in: Easing.bezier(0.7, 0, 0.84, 0),
  lin: Easing.linear,
};

/** Seconds since the start of the film. Every layer is a pure function of this. */
export const useT = () => useCurrentFrame() / FPS;

/** 0 → 1 between a and b (seconds), clamped and eased. */
export const k = (t: number, a: number, b: number, e = ease.out) =>
  interpolate(t, [a, b], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: e,
  });

export const lerp = (a: number, b: number, p: number) => a + (b - a) * p;

/** A damped spring released at t0 (seconds). Overshoots a little. */
export const spr = (t: number, t0: number, damping = 14, stiffness = 170, mass = 0.8) =>
  t < t0 ? 0 : spring({ frame: (t - t0) * FPS, fps: FPS, config: { damping, stiffness, mass } });

/** Visible window with eased enter/exit: returns {p, q} and a combined alpha. */
export const span = (t: number, a: number, b: number, inDur = 0.3, outDur = 0.25) => {
  const p = k(t, a, a + inDur);
  const q = k(t, b - outDur, b, ease.in);
  return { p, q, on: t >= a && t <= b, a: p * (1 - q) };
};

export function rng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let x = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x;
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}
