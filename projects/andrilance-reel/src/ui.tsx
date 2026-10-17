import type { CSSProperties, ReactNode } from "react";
import { Easing } from "remotion";
import { EMBER, INK, IVORY } from "./data";
import { MONO, SANS } from "./fonts";

export const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
export const outCubic = Easing.out(Easing.cubic);
export const outExpo = Easing.out(Easing.exp);
export const inCubic = Easing.in(Easing.cubic);
export const inOutCubic = Easing.inOut(Easing.cubic);
export const outBack = Easing.out(Easing.back(1.7));
export const outBackSoft = Easing.out(Easing.back(1.2));

/** 0→1 progress of an animation that starts at `start` seconds and lasts `dur` seconds. */
export const prog = (t: number, start: number, dur: number, ease: (x: number) => number = outCubic) =>
  ease(clamp01((t - start) / dur));
/** Visible window with fade in/out (s). */
export const win = (t: number, a: number, b: number, fin = 0.25, fout = 0.22) =>
  Math.min(prog(t, a, fin), 1 - prog(t, b - fout, fout, inCubic));
export const lerp = (a: number, b: number, p: number) => a + (b - a) * p;
/** Damped spring 0→1 (overshoots once or twice), for pops. */
export const spring = (t: number, start: number, freq = 2.4, damp = 6) => {
  const x = t - start;
  if (x <= 0) return 0;
  return 1 - Math.exp(-damp * x) * Math.cos(2 * Math.PI * freq * x);
};
export const bump = (x: number, d: number) => (x < 0 || x > d ? 0 : Math.sin((x / d) * Math.PI));
export const rnd = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};
export const fmt = (n: number) => Math.round(n).toLocaleString("en-US");

export const Abs = ({ style, children }: { style?: CSSProperties; children?: ReactNode }) => (
  <div style={{ position: "absolute", ...style }}>{children}</div>
);

/** Entrance transform for a block: rises, de-blurs, settles. `p` 0..1 in, `q` 0..1 out. */
export const enter = (p: number, q = 0, dy = 40): CSSProperties => ({
  opacity: Math.min(p, 1 - q),
  transform: `translateY(${(1 - p) * dy - q * 24}px) scale(${lerp(0.94, 1, p) - q * 0.03})`,
  filter: p < 0.999 || q > 0.001 ? `blur(${(1 - p) * 10 + q * 8}px)` : undefined,
});

/** Smoked-glass panel over footage. */
export const glass: CSSProperties = {
  background: "linear-gradient(180deg, rgba(28,24,21,0.66) 0%, rgba(13,11,10,0.78) 100%)",
  backdropFilter: "blur(26px) saturate(1.3)",
  WebkitBackdropFilter: "blur(26px) saturate(1.3)",
  border: "1.5px solid rgba(255,240,225,0.16)",
  boxShadow: "0 30px 70px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.12)",
  borderRadius: 34,
  color: IVORY,
  fontFamily: SANS,
};
/** Ivory paper card (the hook title, receipts, documents). */
export const paper: CSSProperties = {
  background: "linear-gradient(180deg, #FFFDF8 0%, #F3EDE1 100%)",
  borderRadius: 34,
  boxShadow: "0 40px 90px rgba(0,0,0,0.42), 0 8px 24px rgba(0,0,0,0.2), inset 0 1px 0 #fff",
  color: INK,
  fontFamily: SANS,
};
/** Small mono kicker label. */
export const kicker = (color = EMBER): CSSProperties => ({
  fontFamily: MONO,
  fontSize: 24,
  letterSpacing: 4,
  textTransform: "uppercase",
  color,
  fontWeight: 600,
});

// Line icons, 24-unit viewBox.
export const Svg = ({ size, children, color = IVORY, sw = 1.8 }: { size: number; children: ReactNode; color?: string; sw?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    {children}
  </svg>
);
type IP = { size?: number; color?: string; sw?: number };
export const IconPlane = (p: IP) => (
  <Svg size={p.size ?? 48} color={p.color} sw={p.sw}>
    <path d="M21 15.5 13.5 11V5a1.5 1.5 0 0 0-3 0v6L3 15.5v2l7.5-2.3V19l-2 1.5V22l3.5-1 3.5 1v-1.5l-2-1.5v-3.8l7.5 2.3z" />
  </Svg>
);
export const IconBag = (p: IP) => (
  <Svg size={p.size ?? 48} color={p.color} sw={p.sw}>
    <path d="M5 8h14l-1 13H6zM9 8V6a3 3 0 0 1 6 0v2" />
  </Svg>
);
export const IconCar = (p: IP) => (
  <Svg size={p.size ?? 48} color={p.color} sw={p.sw}>
    <path d="M3 16v-3l2-5a2 2 0 0 1 1.9-1.4h10.2A2 2 0 0 1 19 8l2 5v3a1 1 0 0 1-1 1h-1M5 17H4a1 1 0 0 1-1-1M3 13h18M9 17h6" />
    <circle cx="7" cy="17" r="2" />
    <circle cx="17" cy="17" r="2" />
  </Svg>
);
export const IconCap = (p: IP) => (
  <Svg size={p.size ?? 48} color={p.color} sw={p.sw}>
    <path d="M2 9l10-5 10 5-10 5zM6 11v5c0 1.5 3 3 6 3s6-1.5 6-3v-5M22 9v6" />
  </Svg>
);
export const IconCheck = (p: IP) => (
  <Svg size={p.size ?? 40} color={p.color} sw={p.sw ?? 2.6}>
    <path d="M5 12.5l4.5 4.5L19 7.5" />
  </Svg>
);
export const IconX = (p: IP) => (
  <Svg size={p.size ?? 40} color={p.color} sw={p.sw ?? 2.6}>
    <path d="M6 6l12 12M18 6 6 18" />
  </Svg>
);
export const IconBookmark = (p: IP & { fill?: string }) => (
  <svg width={p.size ?? 48} height={p.size ?? 48} viewBox="0 0 24 24" fill={p.fill ?? "none"} stroke={p.color ?? IVORY} strokeWidth={p.sw ?? 1.8} strokeLinejoin="round">
    <path d="M6 3h12v18l-6-4.5L6 21z" />
  </svg>
);
export const IconSend = (p: IP) => (
  <Svg size={p.size ?? 40} color={p.color} sw={p.sw}>
    <path d="M21 3 10 14M21 3l-7 18-4-7-7-4z" />
  </Svg>
);
export const IconSpark = ({ size = 40, color = EMBER }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24">
    <path d="M12 1.5c.6 5.6 4.9 9.9 10.5 10.5-5.6.6-9.9 4.9-10.5 10.5C11.4 16.9 7.1 12.6 1.5 12 7.1 11.4 11.4 7.1 12 1.5z" fill={color} />
  </svg>
);
export const IconPlay = (p: IP) => (
  <Svg size={p.size ?? 40} color={p.color} sw={p.sw}>
    <rect x="2.5" y="5" width="19" height="14" rx="4" />
    <path d="M10 9.2v5.6l4.6-2.8z" fill={p.color ?? IVORY} />
  </Svg>
);
export const IconUser = (p: IP) => (
  <Svg size={p.size ?? 40} color={p.color} sw={p.sw}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21c0-4 3.6-6.5 8-6.5s8 2.5 8 6.5" />
  </Svg>
);
export const IconArrowUp = (p: IP) => (
  <Svg size={p.size ?? 40} color={p.color} sw={p.sw}>
    <path d="M12 20V4M5 11l7-7 7 7" />
  </Svg>
);
export const IconDumbbell = (p: IP) => (
  <Svg size={p.size ?? 48} color={p.color} sw={p.sw}>
    <path d="M6.5 6.5v11M17.5 6.5v11M3.5 9v6M20.5 9v6M6.5 12h11" />
  </Svg>
);
