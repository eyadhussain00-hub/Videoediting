import type { CSSProperties, ReactNode } from "react";
import { Easing } from "remotion";
import { AMBER, BONE, CYAN, EMBER, RED, calmAt } from "./data";

export const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
export const outCubic = Easing.out(Easing.cubic);
export const outExpo = Easing.out(Easing.exp);
export const inCubic = Easing.in(Easing.cubic);
export const inOutCubic = Easing.inOut(Easing.cubic);
export const outBack = Easing.out(Easing.back(1.7));

/** 0→1 progress of an animation that starts at `start` seconds and lasts `dur` seconds. */
export const prog = (t: number, start: number, dur: number, ease: (x: number) => number = outCubic) =>
  ease(clamp01((t - start) / dur));
/** Visible window with fade in/out (s). */
export const win = (t: number, a: number, b: number, fin = 0.2, fout = 0.2) =>
  Math.min(prog(t, a, fin), 1 - prog(t, b - fout, fout, inCubic));
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

const hex = (c: string) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
/** Mix two #rrggbb colours, returns rgba(). */
export const mix = (a: string, b: string, p: number, alpha = 1) => {
  const A = hex(a), B = hex(b);
  return `rgba(${A.map((x, i) => Math.round(lerp(x, B[i], clamp01(p)))).join(",")},${alpha})`;
};
/** The HUD accent at time t: ember while he panics, cyan once he has regulated. */
export const accent = (t: number, alpha = 1) => mix(EMBER, CYAN, calmAt(t), alpha);

export const Abs = ({ style, children }: { style?: CSSProperties; children?: ReactNode }) => (
  <div style={{ position: "absolute", ...style }}>{children}</div>
);

/** Dark smoked-glass panel for HUD labels over footage. */
export const glass: CSSProperties = {
  background: "linear-gradient(180deg, rgba(18,20,24,0.62) 0%, rgba(8,9,12,0.74) 100%)",
  backdropFilter: "blur(20px) saturate(1.3)",
  WebkitBackdropFilter: "blur(20px) saturate(1.3)",
  border: "1.5px solid rgba(244,239,230,0.16)",
  boxShadow: "0 24px 60px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.12)",
};

export { AMBER, BONE, CYAN, EMBER, RED };

// Line icons, 24-unit viewBox.
export const Svg = ({ size, children, color = BONE, sw = 2 }: { size: number; children: ReactNode; color?: string; sw?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    {children}
  </svg>
);
type IP = { size?: number; color?: string; sw?: number };
export const IconHeart = ({ size = 40, color, sw }: IP) => (
  <Svg size={size} color={color} sw={sw}>
    <path d="M12 20.5s-7.5-4.6-9.2-9.4C1.6 7.6 4 4.5 7.2 4.5c2 0 3.6 1.1 4.8 2.8 1.2-1.7 2.8-2.8 4.8-2.8 3.2 0 5.6 3.1 4.4 6.6-1.7 4.8-9.2 9.4-9.2 9.4z" />
  </Svg>
);
export const IconDrop = ({ size = 40, color, sw }: IP) => (
  <Svg size={size} color={color} sw={sw}>
    <path d="M12 3s6 6.6 6 11a6 6 0 0 1-12 0c0-4.4 6-11 6-11z" />
  </Svg>
);
export const IconHand = ({ size = 40, color, sw }: IP) => (
  <Svg size={size} color={color} sw={sw}>
    <path d="M8 13V5.5a1.5 1.5 0 0 1 3 0V11M11 10.5V4a1.5 1.5 0 0 1 3 0v6.5M14 10.5V5.5a1.5 1.5 0 0 1 3 0V13M17 9.5a1.5 1.5 0 0 1 3 0V14a7 7 0 0 1-7 7h-1.2a6 6 0 0 1-4.6-2.2L4 15a1.6 1.6 0 0 1 2.4-2l1.6 1.6" />
  </Svg>
);
export const IconBolt = ({ size = 40, color, sw }: IP) => (
  <Svg size={size} color={color} sw={sw}>
    <path d="M13 2 4.5 13.5H12L11 22l8.5-11.5H12z" />
  </Svg>
);
export const IconBrain = ({ size = 40, color, sw }: IP) => (
  <Svg size={size} color={color} sw={sw}>
    <path d="M9 4.5A2.5 2.5 0 0 0 6.5 7 2.8 2.8 0 0 0 4 9.8a2.8 2.8 0 0 0 .8 2A3 3 0 0 0 4 14a3 3 0 0 0 2.5 3A2.6 2.6 0 0 0 9 19.5a2.5 2.5 0 0 0 3-1V6a2.5 2.5 0 0 0-3-1.5z" />
    <path d="M15 4.5A2.5 2.5 0 0 1 17.5 7 2.8 2.8 0 0 1 20 9.8a2.8 2.8 0 0 1-.8 2A3 3 0 0 1 20 14a3 3 0 0 1-2.5 3 2.6 2.6 0 0 1-2.5 2.5 2.5 2.5 0 0 1-3-1V6a2.5 2.5 0 0 1 3-1.5z" />
  </Svg>
);
export const IconBookmark = ({ size = 40, color, sw, fill = "none" }: IP & { fill?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={color ?? BONE} strokeWidth={sw ?? 2} strokeLinejoin="round">
    <path d="M6 3.5h12v17l-6-4.2-6 4.2z" />
  </svg>
);
export const IconSend = ({ size = 40, color, sw }: IP) => (
  <Svg size={size} color={color} sw={sw}>
    <path d="M21 3 10 14M21 3l-7 18-4-7-7-4z" />
  </Svg>
);
export const IconShield = ({ size = 40, color, sw }: IP) => (
  <Svg size={size} color={color} sw={sw}>
    <path d="M12 2.8 4.5 5.6v6c0 4.6 3.2 8.2 7.5 9.6 4.3-1.4 7.5-5 7.5-9.6v-6z" />
  </Svg>
);
export const IconSearch = ({ size = 40, color, sw }: IP) => (
  <Svg size={size} color={color} sw={sw}>
    <circle cx="10.5" cy="10.5" r="6.5" />
    <path d="m15.5 15.5 5 5" />
  </Svg>
);
export const IconCheck = ({ size = 40, color, sw }: IP) => (
  <Svg size={size} color={color} sw={sw}>
    <path d="m5 12.5 4.5 4.5L19 7.5" />
  </Svg>
);
export const IconX = ({ size = 40, color, sw }: IP) => (
  <Svg size={size} color={color} sw={sw}>
    <path d="M6 6l12 12M18 6 6 18" />
  </Svg>
);
