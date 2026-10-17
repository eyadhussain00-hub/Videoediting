import type { CSSProperties, ReactNode } from "react";
import { Easing } from "remotion";
import { BONE, GOLD, INK } from "./data";
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

/** Bone paper card (invoices, receipts, checklists). */
export const paper: CSSProperties = {
  background: "linear-gradient(180deg, #FBF8F2 0%, #F1EBDF 100%)",
  borderRadius: 30,
  boxShadow: "0 40px 90px rgba(0,0,0,0.5), 0 8px 24px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.9)",
  color: INK,
  fontFamily: SANS,
};

/** Smoked-glass panel for labels over footage. */
export const glass: CSSProperties = {
  background: "linear-gradient(180deg, rgba(24,26,32,0.62) 0%, rgba(10,11,14,0.74) 100%)",
  backdropFilter: "blur(22px) saturate(1.3)",
  WebkitBackdropFilter: "blur(22px) saturate(1.3)",
  border: "1.5px solid rgba(255,240,215,0.18)",
  boxShadow: "0 24px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.14)",
  color: BONE,
  fontFamily: SANS,
};

export const goldText: CSSProperties = {
  background: `linear-gradient(180deg, #FFE6AE 0%, ${GOLD} 55%, #B9832A 100%)`,
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  color: "transparent",
};

// Line icons, 24-unit viewBox.
export const Svg = ({ size, children, color = BONE, sw = 2 }: { size: number; children: ReactNode; color?: string; sw?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    {children}
  </svg>
);
type IP = { size?: number; color?: string; sw?: number };
/** Tick that draws on with `p` 0..1. */
export const Check = ({ size = 40, color = INK, sw = 2.6, p = 1 }: IP & { p?: number }) => (
  <Svg size={size} color={color} sw={sw}>
    <path d="M5 12.5l4.5 4.5L19 7.5" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - p} />
  </Svg>
);
export const IconUser = ({ size = 40, color, sw }: IP) => (
  <Svg size={size} color={color} sw={sw}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21c1.2-4.2 4.3-6 8-6s6.8 1.8 8 6" />
  </Svg>
);
export const IconCursor = ({ size = 40 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24">
    <path d="M5 3l14 8.2-6.2 1.4L9.6 19z" fill="#fff" stroke={INK} strokeWidth={1.4} strokeLinejoin="round" />
  </svg>
);
export const Star = ({ size = 22, color = GOLD }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24">
    <path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6-4.9-4.6 6.6-.8z" fill={color} />
  </svg>
);
