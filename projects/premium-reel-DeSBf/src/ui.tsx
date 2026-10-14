import type { CSSProperties, ReactNode } from "react";
import { Easing } from "remotion";
import { GOLD, GOLD_GRAD } from "./data";

export const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
export const outCubic = Easing.out(Easing.cubic);
export const outExpo = Easing.out(Easing.exp);
export const inOutCubic = Easing.inOut(Easing.cubic);
export const outBack = Easing.out(Easing.back(1.7));
export const inQuad = (x: number) => x * x;

/** 0→1 progress of an animation that starts at `start` seconds and lasts `dur` seconds. */
export const prog = (t: number, start: number, dur: number, ease: (x: number) => number = outCubic) =>
  ease(clamp01((t - start) / dur));
/** Visible window [a, b] with fade in/out (s). */
export const win = (t: number, a: number, b: number, fin = 0.25, fout = 0.25) =>
  Math.min(prog(t, a, fin), 1 - prog(t, b - fout, fout, Easing.in(Easing.cubic)));
export const lerp = (a: number, b: number, p: number) => a + (b - a) * p;

/** Seeded hash noise in [0,1). */
export const rnd = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

export const glass: CSSProperties = {
  background: "linear-gradient(180deg, rgba(30,27,24,0.66) 0%, rgba(12,11,10,0.76) 100%)",
  backdropFilter: "blur(28px) saturate(1.2)",
  WebkitBackdropFilter: "blur(28px) saturate(1.2)",
  border: "1.5px solid rgba(255,236,200,0.14)",
  boxShadow: "0 30px 80px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.12)",
};

export const goldText: CSSProperties = {
  backgroundImage: GOLD_GRAD,
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  color: "transparent",
};

export const Abs = ({ style, children }: { style?: CSSProperties; children?: ReactNode }) => (
  <div style={{ position: "absolute", ...style }}>{children}</div>
);

/** Animated line drawing: pathLength-normalised stroke reveal (0..1). */
export const draw = (p: number): CSSProperties => ({ strokeDasharray: 1, strokeDashoffset: 1 - clamp01(p) });

// Line icons, 24-unit viewBox.
const Svg = ({ size, children, color = GOLD, sw = 1.6, p = 1 }: { size: number; children: ReactNode; color?: string; sw?: number; p?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" style={{ overflow: "visible" }}>
    <g style={{ ...draw(p) }}>{children}</g>
  </svg>
);
type IP = { size?: number; color?: string; p?: number };
const P = ({ d }: { d: string }) => <path d={d} pathLength={1} />;
export const IconMic = ({ size = 40, color, p }: IP) => (
  <Svg size={size} color={color} p={p}><P d="M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3z" /><P d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v3M9 21h6" /></Svg>
);
export const IconPen = ({ size = 40, color, p }: IP) => (
  <Svg size={size} color={color} p={p}><P d="M4 20l1.2-4.6L16.6 4a2 2 0 0 1 2.8 0l.6.6a2 2 0 0 1 0 2.8L8.6 18.8z M14.5 6l3.5 3.5" /></Svg>
);
export const IconEye = ({ size = 40, color, p }: IP) => (
  <Svg size={size} color={color} p={p}><P d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" /><P d="M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z" /></Svg>
);
export const IconCheck = ({ size = 40, color, p }: IP) => <Svg size={size} color={color} p={p} sw={2.4}><P d="M5 12.5l4.5 4.5L19 7.5" /></Svg>;
export const IconCross = ({ size = 40, color, p }: IP) => <Svg size={size} color={color} p={p} sw={2.4}><P d="M6 6l12 12M18 6L6 18" /></Svg>;
export const IconCrown = ({ size = 40, color, p }: IP) => (
  <Svg size={size} color={color} p={p}><P d="M3.5 8l4.2 4L12 5l4.3 7 4.2-4-1.8 10H5.3z M5.5 20.5h13" /></Svg>
);
export const IconBook = ({ size = 40, color, p }: IP) => (
  <Svg size={size} color={color} p={p}><P d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5zM4 20.5A2.5 2.5 0 0 0 6.5 23H20v-5" /></Svg>
);
