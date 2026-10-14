import type { CSSProperties, ReactNode } from "react";
import { Easing } from "remotion";
import { GOLD, GOLD_GRAD } from "./data";

export const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
export const outCubic = Easing.out(Easing.cubic);
export const outExpo = Easing.out(Easing.exp);
export const inOutCubic = Easing.inOut(Easing.cubic);
export const outBack = Easing.out(Easing.back(1.6));

/** 0→1 progress of an animation that starts at `start` seconds and lasts `dur` seconds. */
export const prog = (t: number, start: number, dur: number, ease: (x: number) => number = outCubic) =>
  ease(clamp01((t - start) / dur));
/** Visible window with fade in/out (s). */
export const win = (t: number, a: number, b: number, fin = 0.25, fout = 0.25) =>
  Math.min(prog(t, a, fin), 1 - prog(t, b - fout, fout, Easing.in(Easing.cubic)));
export const lerp = (a: number, b: number, p: number) => a + (b - a) * p;
export const rnd = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

export const glass: CSSProperties = {
  background: "linear-gradient(180deg, rgba(38,32,24,0.62) 0%, rgba(12,10,8,0.78) 100%)",
  backdropFilter: "blur(26px) saturate(1.25)",
  WebkitBackdropFilter: "blur(26px) saturate(1.25)",
  border: "1.5px solid rgba(255,226,170,0.24)",
  boxShadow: "0 30px 80px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.16), inset 0 0 40px rgba(255,200,120,0.05)",
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

/** A centred row at height y. */
export const Row = ({ y, children, style }: { y: number; children?: ReactNode; style?: CSSProperties }) => (
  <Abs style={{ left: 0, right: 0, top: y, display: "flex", justifyContent: "center", alignItems: "center", ...style }}>{children}</Abs>
);

export const Svg = ({ size, children, color = GOLD, sw = 1.7 }: { size: number; children: ReactNode; color?: string; sw?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    {children}
  </svg>
);
type IP = { size?: number; color?: string; sw?: number };
export const IconUser = ({ size = 40, color, sw }: IP) => (
  <Svg size={size} color={color} sw={sw}>
    <circle cx="12" cy="8" r="3.8" />
    <path d="M4.5 20.5c1.2-4 4-6 7.5-6s6.3 2 7.5 6" />
  </Svg>
);
export const IconStore = ({ size = 40, color, sw }: IP) => (
  <Svg size={size} color={color} sw={sw}>
    <path d="M3.5 9.5 5 4h14l1.5 5.5M3.5 9.5h17M3.5 9.5c0 1.6 1.3 2.8 2.8 2.8S9.2 11 9.2 9.5c0 1.6 1.2 2.8 2.8 2.8s2.8-1.3 2.8-2.8c0 1.6 1.3 2.8 2.9 2.8s2.8-1.3 2.8-2.8M5 12v8.5h14V12M10 20.5v-5h4v5" />
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
export const IconEye = ({ size = 40, color, sw }: IP) => (
  <Svg size={size} color={color} sw={sw}>
    <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" />
    <circle cx="12" cy="12" r="3" />
  </Svg>
);
export const IconShield = ({ size = 40, color, sw }: IP) => (
  <Svg size={size} color={color} sw={sw}>
    <path d="M12 2.8 4.5 5.6v5.6c0 4.8 3.1 8.6 7.5 10 4.4-1.4 7.5-5.2 7.5-10V5.6z" />
    <path d="m8.8 12 2.2 2.2 4.3-4.4" />
  </Svg>
);
export const IconAlert = ({ size = 40, color, sw }: IP) => (
  <Svg size={size} color={color} sw={sw}>
    <path d="M12 3.5 2.5 20h19zM12 10v4.5M12 17.2v.1" />
  </Svg>
);
export const IconHand = ({ size = 40, color, sw }: IP) => (
  <Svg size={size} color={color} sw={sw}>
    <path d="M7 11.5V6a1.5 1.5 0 0 1 3 0v5M10 10V4.5a1.5 1.5 0 0 1 3 0V10M13 10V5.5a1.5 1.5 0 0 1 3 0V12M16 9a1.5 1.5 0 0 1 3 0v5.5c0 4-2.7 6.5-6.5 6.5-2.6 0-4.3-1-5.8-3.2L4 13.5a1.5 1.5 0 0 1 2.4-1.8L7 12.5" />
  </Svg>
);
export const IconHeart = ({ size = 40, color, sw }: IP) => (
  <Svg size={size} color={color} sw={sw}>
    <path d="M12 20.5S3.5 15.5 3.5 9.3A4.6 4.6 0 0 1 12 7a4.6 4.6 0 0 1 8.5 2.3c0 6.2-8.5 11.2-8.5 11.2z" />
  </Svg>
);
