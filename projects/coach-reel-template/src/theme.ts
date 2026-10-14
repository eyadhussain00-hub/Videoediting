import { createContext, useContext } from "react";
import { Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import type { ReelProps } from "./types";

export const W = 1080;
export const H = 1920;

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

/** The job's props, for any layer that needs them. */
export const ReelContext = createContext<ReelProps | null>(null);
export const useReel = () => useContext(ReelContext)!;

/** Seconds since the start of the film. Every layer is a pure function of this. */
export const useT = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return frame / fps;
};

/** 0 → 1 between a and b (seconds), clamped and eased. */
export const k = (t: number, a: number, b: number, e = ease.out) =>
  interpolate(t, [a, b], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: e });

export const lerp = (a: number, b: number, p: number) => a + (b - a) * p;

/** A damped spring released at t0 (seconds). Overshoots a little. */
export const spr = (t: number, t0: number, damping = 14, stiffness = 170, mass = 0.8) =>
  t < t0 ? 0 : spring({ frame: (t - t0) * 30, fps: 30, config: { damping, stiffness, mass } });

/** #RRGGBB → rgba() with the given alpha. */
export const alpha = (hex: string, a: number) => {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
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
