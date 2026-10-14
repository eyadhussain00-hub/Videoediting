import type { CSSProperties, ReactNode } from "react";
import { Easing } from "remotion";
import { DAWN_GRAD, ICE, ICE_GRAD } from "./data";

export const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
export const outCubic = Easing.out(Easing.cubic);
export const outExpo = Easing.out(Easing.exp);
export const inOutCubic = Easing.inOut(Easing.cubic);
export const outBack = Easing.out(Easing.back(1.7));

/** 0→1 progress of an animation that starts at `start` seconds and lasts `dur` seconds. */
export const prog = (t: number, start: number, dur: number, ease: (x: number) => number = outCubic) =>
  ease(clamp01((t - start) / dur));
/** Visible window with fade in/out (s). */
export const win = (t: number, a: number, b: number, fin = 0.2, fout = 0.2) =>
  Math.min(prog(t, a, fin), 1 - prog(t, b - fout, fout, Easing.in(Easing.cubic)));
export const lerp = (a: number, b: number, p: number) => a + (b - a) * p;

/** Seeded hash noise in [0,1). */
export const rnd = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

/** Frosted glass panel. */
export const frost: CSSProperties = {
  background: "linear-gradient(180deg, rgba(30,44,60,0.62) 0%, rgba(8,16,26,0.74) 100%)",
  backdropFilter: "blur(28px) saturate(1.3)",
  WebkitBackdropFilter: "blur(28px) saturate(1.3)",
  border: "1.5px solid rgba(200,235,255,0.22)",
  boxShadow: "0 30px 80px rgba(0,8,20,0.5), inset 0 1px 0 rgba(255,255,255,0.18), inset 0 0 40px rgba(140,200,255,0.06)",
};

const clip = (grad: string): CSSProperties => ({
  backgroundImage: grad,
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  color: "transparent",
});
export const iceText = clip(ICE_GRAD);
export const dawnText = clip(DAWN_GRAD);

export const Abs = ({ style, children }: { style?: CSSProperties; children?: ReactNode }) => (
  <div style={{ position: "absolute", ...style }}>{children}</div>
);

// Line icons, 24-unit viewBox.
export const Svg = ({ size, children, color = ICE, sw = 1.7 }: { size: number; children: ReactNode; color?: string; sw?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    {children}
  </svg>
);
type IP = { size?: number; color?: string; sw?: number };
export const IconSnow = ({ size = 40, color, sw }: IP) => (
  <Svg size={size} color={color} sw={sw}>
    <path d="M12 2v20M3.3 7l17.4 10M3.3 17 20.7 7M12 2l-2 2.2M12 2l2 2.2M12 22l-2-2.2M12 22l2-2.2M3.3 7l2.9.6M3.3 7l.9-2.8M20.7 17l-2.9-.6M20.7 17l-.9 2.8M3.3 17l.9 2.8M3.3 17l2.9-.6M20.7 7l-.9-2.8M20.7 7l-2.9.6" />
  </Svg>
);
export const IconMoon = ({ size = 40, color, sw }: IP) => (
  <Svg size={size} color={color} sw={sw}>
    <path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5z" />
  </Svg>
);
export const IconMosque = ({ size = 40, color, sw }: IP) => (
  <Svg size={size} color={color} sw={sw}>
    <path d="M5 21v-7a7 7 0 0 1 14 0v7M3 21h18M12 7V4.5M10.8 3.5a1.4 1.4 0 1 0 2.4 1.2M9.5 21v-3.5a2.5 2.5 0 0 1 5 0V21M2 21V11M2 11l.9-2 .9 2M22 21V11M22 11l-.9-2-.9 2" />
  </Svg>
);
export const IconPhone = ({ size = 40, color, sw }: IP) => (
  <Svg size={size} color={color} sw={sw}>
    <rect x="6" y="2.5" width="12" height="19" rx="2.6" />
    <path d="M10.5 18.5h3" />
  </Svg>
);
export const IconAlarm = ({ size = 40, color, sw }: IP) => (
  <Svg size={size} color={color} sw={sw}>
    <circle cx="12" cy="13" r="7.5" />
    <path d="M12 9v4l2.5 2M4 4.5 6.5 2.5M20 4.5 17.5 2.5M6.5 19.5 5 21.5M17.5 19.5 19 21.5" />
  </Svg>
);
export const IconSun = ({ size = 40, color, sw }: IP) => (
  <Svg size={size} color={color} sw={sw}>
    <path d="M3 17h18M5.5 17a6.5 6.5 0 0 1 13 0M12 6.5V4M5.6 9.6 3.9 7.9M18.4 9.6l1.7-1.7M7 21h10" />
  </Svg>
);
export const IconBook = ({ size = 40, color, sw }: IP) => (
  <Svg size={size} color={color} sw={sw}>
    <path d="M12 6.5C10 5 7 4.5 3.5 5v13.5c3.5-.5 6.5 0 8.5 1.5 2-1.5 5-2 8.5-1.5V5C17 4.5 14 5 12 6.5zM12 6.5V20" />
  </Svg>
);
export const IconBolt = ({ size = 40, color, sw }: IP) => (
  <Svg size={size} color={color} sw={sw}>
    <path d="M13 2.5 4.5 13.5H12l-1 8 8.5-11H12z" />
  </Svg>
);
export const IconDumbbell = ({ size = 40, color, sw }: IP) => (
  <Svg size={size} color={color} sw={sw}>
    <path d="M6.5 6.5v11M17.5 6.5v11M3.5 9v6M20.5 9v6M6.5 12h11" />
  </Svg>
);
export const IconBan = ({ size = 40, color, sw }: IP) => (
  <Svg size={size} color={color} sw={sw}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="m6 6 12 12" />
  </Svg>
);
export const IconPill = ({ size = 40, color, sw }: IP) => (
  <Svg size={size} color={color} sw={sw}>
    <rect x="3" y="8.5" width="18" height="7" rx="3.5" transform="rotate(-35 12 12)" />
    <path d="m9.9 9 4.2 6" />
  </Svg>
);
export const IconTimer = ({ size = 40, color, sw }: IP) => (
  <Svg size={size} color={color} sw={sw}>
    <circle cx="12" cy="13.5" r="7.5" />
    <path d="M12 13.5V9.5M10 2.5h4M12 2.5V6" />
  </Svg>
);
export const IconUsers = ({ size = 40, color, sw }: IP) => (
  <Svg size={size} color={color} sw={sw}>
    <circle cx="9" cy="8.5" r="3.3" />
    <path d="M2.8 20c.9-3.4 3.3-5.2 6.2-5.2s5.3 1.8 6.2 5.2M15.5 5.3a3.3 3.3 0 0 1 0 6.4M17.6 14.9c1.9.6 3.1 2.3 3.6 5.1" />
  </Svg>
);
export const IconLeaf = ({ size = 40, color, sw }: IP) => (
  <Svg size={size} color={color} sw={sw}>
    <path d="M5 19c0-8 5-13 15-14-1 10-6 15-14 15M5 19l7-7" />
  </Svg>
);
export const IconShield = ({ size = 40, color, sw }: IP) => (
  <Svg size={size} color={color} sw={sw}>
    <path d="M12 2.8 4.5 5.6v5.6c0 4.8 3.1 8.6 7.5 10 4.4-1.4 7.5-5.2 7.5-10V5.6z" />
    <path d="m8.8 12 2.2 2.2 4.3-4.4" />
  </Svg>
);
export const IconCheck = ({ size = 40, color, sw }: IP) => (
  <Svg size={size} color={color} sw={sw}>
    <path d="m5 12.5 4.5 4.5L19 7.5" />
  </Svg>
);
export const IconLock = ({ size = 40, color, sw, open = 0 }: IP & { open?: number }) => (
  <Svg size={size} color={color} sw={sw}>
    <rect x="4.5" y="10.5" width="15" height="11" rx="2.4" />
    <path d={`M8 10.5V7.5a4 4 0 0 1 8 0v${3 - open * 3.4}`} />
    <circle cx="12" cy="16" r="1.3" />
  </Svg>
);
export const IconSend = ({ size = 40, color, sw }: IP) => (
  <Svg size={size} color={color} sw={sw}>
    <path d="M21.5 2.5 10.5 13.5M21.5 2.5l-7 19-4-8-8-4z" />
  </Svg>
);
