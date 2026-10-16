import type { CSSProperties, ReactNode } from "react";
import { Easing, Img, staticFile } from "remotion";
import { CORAL, CREAM, INK } from "./data";
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

/** Warm cream card like the app's own UI panels. */
export const card: CSSProperties = {
  background: "linear-gradient(180deg, #FFFDF9 0%, #FFF6EC 100%)",
  borderRadius: 38,
  boxShadow: "0 40px 90px rgba(40,10,16,0.38), 0 8px 24px rgba(40,10,16,0.18), inset 0 1px 0 rgba(255,255,255,0.9)",
  color: INK,
  fontFamily: SANS,
};

/** Glassy dark chip for labels over footage. */
export const glass: CSSProperties = {
  background: "linear-gradient(180deg, rgba(36,22,27,0.62) 0%, rgba(20,10,14,0.72) 100%)",
  backdropFilter: "blur(22px) saturate(1.4)",
  WebkitBackdropFilter: "blur(22px) saturate(1.4)",
  border: "1.5px solid rgba(255,235,225,0.22)",
  boxShadow: "0 24px 60px rgba(20,5,10,0.45), inset 0 1px 0 rgba(255,255,255,0.16)",
};

/** The real FocusDeen app icon (App Store artwork). */
export const AppIcon = ({ size, style }: { size: number; style?: CSSProperties }) => (
  <Img
    src={staticFile("img/icon.png")}
    style={{ width: size, height: size, borderRadius: size * 0.225, boxShadow: `0 ${size * 0.12}px ${size * 0.3}px rgba(40,10,20,0.35)`, ...style }}
  />
);
/** The heart mascot, cut out of the icon. */
export const Heart = ({ size, style }: { size: number; style?: CSSProperties }) => (
  <Img src={staticFile("img/heart.png")} style={{ width: size, height: size * (914 / 890), ...style }} />
);

// Line icons, 24-unit viewBox.
export const Svg = ({ size, children, color = CREAM, sw = 2 }: { size: number; children: ReactNode; color?: string; sw?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    {children}
  </svg>
);
type IP = { size?: number; color?: string; sw?: number };
/** Padlock; `open` 0..1 lifts the shackle. */
export const Lock = ({ size = 40, color = "#fff", open = 0, body = CORAL }: { size?: number; color?: string; open?: number; body?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24">
    <path d={`M7.5 11V7.6a4.5 4.5 0 0 1 9 0V${11 - open * 3.6}`} fill="none" stroke={color} strokeWidth={2.4} strokeLinecap="round" transform={`translate(0 ${-open * 2.2})`} />
    <rect x="4.2" y="10.4" width="15.6" height="11.6" rx="3" fill={body} stroke={color} strokeWidth={1.6} />
    <circle cx="12" cy="15.4" r="1.6" fill={color} />
    <path d="M12 16.4v2.2" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
  </svg>
);
export const IconSearch = ({ size = 40, color, sw }: IP) => (
  <Svg size={size} color={color} sw={sw}>
    <circle cx="10.5" cy="10.5" r="6.5" />
    <path d="m15.5 15.5 5 5" />
  </Svg>
);
export const IconLink = ({ size = 40, color, sw }: IP) => (
  <Svg size={size} color={color} sw={sw}>
    <path d="M10 14a4.5 4.5 0 0 0 6.4 0l3-3a4.5 4.5 0 0 0-6.4-6.4l-1.2 1.2M14 10a4.5 4.5 0 0 0-6.4 0l-3 3a4.5 4.5 0 0 0 6.4 6.4l1.2-1.2" />
  </Svg>
);
export const IconMoon = ({ size = 40, color, sw }: IP) => (
  <Svg size={size} color={color} sw={sw}>
    <path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5z" />
  </Svg>
);
export const IconArrow = ({ size = 40, color, sw }: IP) => (
  <Svg size={size} color={color} sw={sw}>
    <path d="M7 17 17 7M9 7h8v8" />
  </Svg>
);
export const Star = ({ size = 22, color = "#FF9F0A" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24">
    <path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6-4.9-4.6 6.6-.8z" fill={color} />
  </svg>
);
