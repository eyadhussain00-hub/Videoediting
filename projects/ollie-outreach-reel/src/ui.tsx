import type { CSSProperties, ReactNode } from "react";
import { Easing } from "remotion";
import { CREAM, GOLD, GOLD_DEEP, GOLD_HI } from "./data";
import { MONO, SANS } from "./fonts";

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

/** Smoked-glass card for graphics over the footage. */
export const glass: CSSProperties = {
  background: "linear-gradient(180deg, rgba(28,30,36,0.66) 0%, rgba(12,13,17,0.78) 100%)",
  backdropFilter: "blur(26px) saturate(1.5)",
  WebkitBackdropFilter: "blur(26px) saturate(1.5)",
  border: "1.5px solid rgba(255,236,200,0.2)",
  boxShadow: "0 30px 80px rgba(0,0,0,0.5), 0 6px 18px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.14)",
  color: CREAM,
  fontFamily: SANS,
};

/** Champagne-gold text fill. */
export const goldText: CSSProperties = {
  background: `linear-gradient(180deg, ${GOLD_HI} 0%, ${GOLD} 48%, ${GOLD_DEEP} 100%)`,
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  color: "transparent",
};

/** Small mono eyebrow label. */
export const eyebrow: CSSProperties = {
  fontFamily: MONO,
  fontSize: 24,
  fontWeight: 600,
  letterSpacing: 5,
  textTransform: "uppercase",
  color: GOLD,
};

// Line icons, 24-unit viewBox.
export const Svg = ({ size, children, color = CREAM, sw = 2 }: { size: number; children: ReactNode; color?: string; sw?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" style={{ display: "block" }}>
    {children}
  </svg>
);
type IP = { size?: number; color?: string; sw?: number };
export const IconCalendar = ({ size = 40, color, sw }: IP) => (
  <Svg size={size} color={color} sw={sw}>
    <rect x="3.5" y="5" width="17" height="15.5" rx="3" />
    <path d="M3.5 10h17M8 3v4M16 3v4" />
    <path d="m9 15 2 2 4-4" />
  </Svg>
);
export const IconCap = ({ size = 40, color, sw }: IP) => (
  <Svg size={size} color={color} sw={sw}>
    <path d="m2.5 9 9.5-4.5L21.5 9 12 13.5z" />
    <path d="M6.5 11v4.6c0 1.6 2.5 2.9 5.5 2.9s5.5-1.3 5.5-2.9V11M21.5 9v5.5" />
  </Svg>
);
export const IconSend = ({ size = 40, color, sw }: IP) => (
  <Svg size={size} color={color} sw={sw}>
    <path d="M21 3 10.2 13.8M21 3l-6.8 18-4-7.2L3 9.8z" />
  </Svg>
);
export const IconUser = ({ size = 40, color, sw }: IP) => (
  <Svg size={size} color={color} sw={sw}>
    <circle cx="12" cy="8.5" r="4" />
    <path d="M4.5 20.5c1.2-3.6 4-5.5 7.5-5.5s6.3 1.9 7.5 5.5" />
  </Svg>
);
export const IconBriefcase = ({ size = 40, color, sw }: IP) => (
  <Svg size={size} color={color} sw={sw}>
    <rect x="3" y="7.5" width="18" height="12.5" rx="2.5" />
    <path d="M8.5 7.5V5.5a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v2M3 13h18" />
  </Svg>
);
export const IconTarget = ({ size = 40, color, sw }: IP) => (
  <Svg size={size} color={color} sw={sw}>
    <circle cx="12" cy="12" r="8.5" />
    <circle cx="12" cy="12" r="4.5" />
    <circle cx="12" cy="12" r="1" />
  </Svg>
);
export const IconCheck = ({ size = 40, color, sw }: IP) => (
  <Svg size={size} color={color} sw={sw}>
    <path d="m5 12.5 4.5 4.5L19 7.5" />
  </Svg>
);
export const IconDumbbell = ({ size = 40, color, sw }: IP) => (
  <Svg size={size} color={color} sw={sw}>
    <path d="M6.5 7v10M3.5 9.5v5M17.5 7v10M20.5 9.5v5M6.5 12h11" />
  </Svg>
);
export const IconEye = ({ size = 40, color, sw }: IP) => (
  <Svg size={size} color={color} sw={sw}>
    <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" />
    <circle cx="12" cy="12" r="3" />
  </Svg>
);
export const IconBolt = ({ size = 40, color, sw }: IP) => (
  <Svg size={size} color={color} sw={sw}>
    <path d="M13 2.5 4.5 13.5H12l-1 8 8.5-11H12z" />
  </Svg>
);
export const IconFlame = ({ size = 40, color, sw }: IP) => (
  <Svg size={size} color={color} sw={sw}>
    <path d="M12 21.5c-3.9 0-7-2.8-7-6.6 0-4.4 4.2-6.1 4.5-11.4 2.8 1.8 4.4 4.3 4.6 6.7 1-.8 1.6-2 1.8-3.3 1.9 1.7 3.1 4.4 3.1 7.2 0 4.4-3.1 7.4-7 7.4z" />
  </Svg>
);
