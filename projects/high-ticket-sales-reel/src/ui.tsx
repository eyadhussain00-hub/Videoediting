import type { CSSProperties, ReactNode } from "react";
import { Easing } from "remotion";
import { INK, PAPER } from "./data";
import { SANS } from "./fonts";

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

/** Paper card for UI panels. */
export const card: CSSProperties = {
  background: `linear-gradient(180deg, #FFFFFF 0%, ${PAPER} 100%)`,
  borderRadius: 38,
  boxShadow: "0 40px 90px rgba(5,8,14,0.38), 0 8px 24px rgba(5,8,14,0.18), inset 0 1px 0 rgba(255,255,255,0.9)",
  color: INK,
  fontFamily: SANS,
};

/** Glassy dark chip for labels over footage. */
export const glass: CSSProperties = {
  background: "linear-gradient(180deg, rgba(22,26,36,0.62) 0%, rgba(10,12,18,0.74) 100%)",
  backdropFilter: "blur(22px) saturate(1.4)",
  WebkitBackdropFilter: "blur(22px) saturate(1.4)",
  border: "1.5px solid rgba(255,240,210,0.2)",
  boxShadow: "0 24px 60px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.16)",
};


// Line icons, 24-unit viewBox.
export const Svg = ({ size, children, color = PAPER, sw = 2 }: { size: number; children: ReactNode; color?: string; sw?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    {children}
  </svg>
);
