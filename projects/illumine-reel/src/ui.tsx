import type { CSSProperties, ReactNode } from "react";
import { Easing } from "remotion";
import { BLUE, CREAM, GOLD } from "./data";
import { MONO, SANS } from "./fonts";

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
export const rnd = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};
/** £ with thousands separators. */
export const money = (v: number) => "£" + Math.round(v).toLocaleString("en-GB");

export const Abs = ({ style, children }: { style?: CSSProperties; children?: ReactNode }) => (
  <div style={{ position: "absolute", ...style }}>{children}</div>
);

/** Dark smoked-glass panel. */
export const glass: CSSProperties = {
  background: "linear-gradient(180deg, rgba(18,22,38,0.66) 0%, rgba(8,10,20,0.78) 100%)",
  backdropFilter: "blur(24px) saturate(1.3)",
  WebkitBackdropFilter: "blur(24px) saturate(1.3)",
  border: "1.5px solid rgba(255,245,225,0.18)",
  boxShadow: "0 30px 70px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.14)",
  borderRadius: 34,
  color: CREAM,
  fontFamily: SANS,
};

/** Metallic fill for big type: gold for the ISA, sapphire for the SIPP. */
export const metal = (c: "gold" | "blue" | "white"): CSSProperties => ({
  backgroundImage:
    c === "gold"
      ? "linear-gradient(180deg, #FFF1C4 0%, #F7CD6A 38%, #D99A2B 62%, #FFE3A0 100%)"
      : c === "blue"
        ? "linear-gradient(180deg, #E4EEFF 0%, #8DB8FF 38%, #3D7BEA 64%, #C6DBFF 100%)"
        : "linear-gradient(180deg, #FFFFFF 0%, #F3EBDD 55%, #CFC4B2 100%)",
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  color: "transparent",
});

export const accent = (c: "gold" | "blue") => (c === "gold" ? GOLD : BLUE);

/** Small mono kicker label. */
export const Kicker = ({ children, color = CREAM, style }: { children: ReactNode; color?: string; style?: CSSProperties }) => (
  <div style={{ fontFamily: MONO, fontWeight: 600, fontSize: 26, letterSpacing: 5, textTransform: "uppercase", color, ...style }}>{children}</div>
);

// Line icons, 24-unit viewBox.
export const Svg = ({ size, children, color = CREAM, sw = 2 }: { size: number; children: ReactNode; color?: string; sw?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    {children}
  </svg>
);
type IP = { size?: number; color?: string; sw?: number };
export const IconCheck = ({ size = 30, color, sw = 3, p = 1 }: IP & { p?: number }) => (
  <Svg size={size} color={color} sw={sw}>
    <path d="M5 12.5l4.5 4.5L19 7.5" strokeDasharray={22} strokeDashoffset={22 * (1 - p)} />
  </Svg>
);
export const IconPound = ({ size = 30, color, sw }: IP) => (
  <Svg size={size} color={color} sw={sw}>
    <path d="M16.5 6.5A4 4 0 0 0 9 8.5V19M6 13h8M6 19h12" />
  </Svg>
);
export const IconShield = ({ size = 30, color, sw }: IP) => (
  <Svg size={size} color={color} sw={sw}>
    <path d="M12 3l7.5 3v5.5c0 4.6-3.2 8.2-7.5 9.5-4.3-1.3-7.5-4.9-7.5-9.5V6z" />
    <path d="M8.8 12.2l2.2 2.2 4.2-4.4" />
  </Svg>
);
export const IconPerson = ({ size = 30, color, sw }: IP) => (
  <Svg size={size} color={color} sw={sw}>
    <circle cx="12" cy="8" r="3.8" />
    <path d="M4.5 20.5c1.2-3.8 4-5.6 7.5-5.6s6.3 1.8 7.5 5.6" />
  </Svg>
);
export const IconGift = ({ size = 30, color, sw }: IP) => (
  <Svg size={size} color={color} sw={sw}>
    <rect x="4" y="9" width="16" height="11.5" rx="1.5" />
    <path d="M3 9h18M12 9v11.5M12 9c-2.5 0-5-.6-5-3a2.3 2.3 0 0 1 4.3-1.2L12 6l.7-1.2A2.3 2.3 0 0 1 17 6c0 2.4-2.5 3-5 3" />
  </Svg>
);
/** Padlock; `open` 0..1 lifts the shackle. */
export const Lock = ({ size = 40, color = CREAM, open = 0, body = "transparent", sw = 2 }: { size?: number; color?: string; open?: number; body?: string; sw?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24">
    <g transform={`translate(${open * 3.2} ${-open * 2.2})`}>
      <path d={`M7.5 11V7.6a4.5 4.5 0 0 1 9 0V${11 - open * 3.6}`} fill="none" stroke={color} strokeWidth={sw * 1.15} strokeLinecap="round" />
    </g>
    <rect x="4.2" y="10.4" width="15.6" height="11.6" rx="3" fill={body} stroke={color} strokeWidth={sw * 0.8} />
    <circle cx="12" cy="15.4" r="1.5" fill={color} />
    <path d="M12 16.4v2.1" stroke={color} strokeWidth={sw * 0.9} strokeLinecap="round" />
  </svg>
);
export { GOLD, BLUE };
