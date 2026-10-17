import type { CSSProperties, ReactNode } from "react";
import { Easing } from "remotion";

export const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
export const outCubic = Easing.out(Easing.cubic);
export const outExpo = Easing.out(Easing.exp);
export const inOutCubic = Easing.inOut(Easing.cubic);
export const outBack = Easing.out(Easing.back(1.7));
export const outBackSoft = Easing.out(Easing.back(1.2));

/** 0→1 progress of an animation that starts at `start` seconds and lasts `dur` seconds. */
export const prog = (t: number, start: number, dur: number, ease: (x: number) => number = outCubic) =>
  ease(clamp01((t - start) / dur));
/** Visible window with fade in/out (s). */
export const win = (t: number, a: number, b: number, fin = 0.2, fout = 0.2) =>
  Math.min(prog(t, a, fin), 1 - prog(t, b - fout, fout, Easing.in(Easing.cubic)));
export const lerp = (a: number, b: number, p: number) => a + (b - a) * p;
/** Damped spring 0→1 (overshoots once or twice), for pops. */
export const spring = (t: number, start: number, freq = 2.4, damp = 6) => {
  const x = t - start;
  if (x <= 0) return 0;
  return 1 - Math.exp(-damp * x) * Math.cos(2 * Math.PI * freq * x);
};
export const bump = (x: number, d: number) => (x < 0 || x > d ? 0 : Math.sin((x / d) * Math.PI));

/** Seeded hash noise in [0,1). */
export const rnd = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

export const Abs = ({ style, children }: { style?: CSSProperties; children?: ReactNode }) => (
  <div style={{ position: "absolute", ...style }}>{children}</div>
);

/** Dark emerald glass for panels over footage, with a fine gold hairline. */
export const glass: CSSProperties = {
  background: "linear-gradient(180deg, rgba(8,34,27,0.72) 0%, rgba(3,16,12,0.82) 100%)",
  backdropFilter: "blur(26px) saturate(1.3)",
  WebkitBackdropFilter: "blur(26px) saturate(1.3)",
  border: "1.5px solid rgba(226,188,114,0.38)",
  boxShadow: "0 30px 80px rgba(0,8,5,0.55), inset 0 1px 0 rgba(247,226,174,0.18)",
};

/** Gold foil text fill. */
export const foil: CSSProperties = {
  background: "linear-gradient(176deg, #FFF2CC 0%, #F2D492 28%, #C9973F 55%, #F4DA9C 78%, #B8873A 100%)",
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  color: "transparent",
};
