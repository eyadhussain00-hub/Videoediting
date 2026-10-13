import type { CSSProperties, ReactNode } from "react";
import { Easing, interpolate } from "remotion";
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
export const win = (t: number, a: number, b: number, fin = 0.2, fout = 0.2) =>
  Math.min(prog(t, a, fin), 1 - prog(t, b - fout, fout, Easing.in(Easing.cubic)));
export const lerp = (a: number, b: number, p: number) => a + (b - a) * p;
export const step = (t: number, fps = 12) => Math.floor(t * fps) / fps; // stop-motion clock

/** Seeded hash noise in [0,1). */
export const rnd = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

export const glass: CSSProperties = {
  background: "linear-gradient(180deg, rgba(28,28,32,0.72) 0%, rgba(12,12,14,0.78) 100%)",
  backdropFilter: "blur(26px) saturate(1.25)",
  WebkitBackdropFilter: "blur(26px) saturate(1.25)",
  border: "1.5px solid rgba(255,255,255,0.13)",
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

// Line icons, 24-unit viewBox, drawn in gold.
const Svg = ({ size, children, color = GOLD, sw = 1.7 }: { size: number; children: ReactNode; color?: string; sw?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    {children}
  </svg>
);
export const IconTime = ({ size = 40, color }: { size?: number; color?: string }) => (
  <Svg size={size} color={color}>
    <path d="M6 3h12M6 21h12M7 3c0 5 10 5 10 9s-10 4-10 9M17 3c0 5-10 5-10 9s10 4 10 9" />
  </Svg>
);
export const IconIdentity = ({ size = 40, color }: { size?: number; color?: string }) => (
  <Svg size={size} color={color}>
    <circle cx="12" cy="8.5" r="3.6" />
    <path d="M4.5 20.5c1.2-3.8 4-5.6 7.5-5.6s6.3 1.8 7.5 5.6" />
  </Svg>
);
export const IconMoney = ({ size = 40, color }: { size?: number; color?: string }) => (
  <Svg size={size} color={color}>
    <circle cx="12" cy="12" r="9" />
    <path d="M14.8 8.6c-.6-.9-1.6-1.4-2.8-1.4-1.6 0-2.8.9-2.8 2.2 0 3 5.8 1.6 5.8 4.6 0 1.3-1.3 2.3-3 2.3-1.3 0-2.4-.6-3-1.6M12 5.6v1.6M12 16.8v1.6" />
  </Svg>
);
export const IconEnergy = ({ size = 40, color }: { size?: number; color?: string }) => (
  <Svg size={size} color={color}>
    <path d="M13 2.5 4.5 13.5H12l-1 8 8.5-11H12z" />
  </Svg>
);
export const IconReputation = ({ size = 40, color }: { size?: number; color?: string }) => (
  <Svg size={size} color={color}>
    <path d="m12 3 2.7 5.6 6.1.8-4.5 4.2 1.1 6.1L12 16.8l-5.4 2.9 1.1-6.1-4.5-4.2 6.1-.8z" />
  </Svg>
);
export const ICONS = [IconTime, IconIdentity, IconMoney, IconEnergy, IconReputation];

export const Star = ({ size, fill }: { size: number; fill: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24">
    <defs>
      <linearGradient id={`sg${size}`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#FFE3A3" />
        <stop offset="1" stopColor="#C8902E" />
      </linearGradient>
    </defs>
    <path d="m12 2.5 2.9 6 6.6.9-4.8 4.5 1.2 6.6L12 17.3l-5.9 3.2 1.2-6.6-4.8-4.5 6.6-.9z" fill="rgba(255,255,255,0.12)" />
    <path
      d="m12 2.5 2.9 6 6.6.9-4.8 4.5 1.2 6.6L12 17.3l-5.9 3.2 1.2-6.6-4.8-4.5 6.6-.9z"
      fill={`url(#sg${size})`}
      style={{ transformOrigin: "12px 12px", transform: `scale(${fill})`, opacity: fill }}
    />
  </svg>
);

export const interp = interpolate;
