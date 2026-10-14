import type { ReactNode } from "react";
import { AbsoluteFill, Freeze, OffthreadVideo, staticFile, useCurrentFrame } from "remotion";
import { CARD_IN, FPS, GOLD, SINS, SRC_END, T } from "../data";
import { Abs, inOutCubic, lerp, prog, rnd } from "../ui";

// The source is a 1080×864 landscape band (letterboxed by the original edit). It's placed on the 1080×1920 canvas at
// FOOT and seen through a rounded "window". In the hook and the finale the window drops low and the speaker
// (alpha layer fg.webm, same placement) breaks out of its top edge, in front of the type.
const FOOT = { ox: -260, oy: 440, s: 1.24, w: 1080, h: 864 };

type Win = { x: number; y: number; w: number; h: number; z: number; fx: number; fy: number; br: number };
const OPEN: Win = { x: 60, y: 470, w: 960, h: 1000, z: 1, fx: 540, fy: 760, br: 0 };
const POP: Win = { x: 60, y: 900, w: 960, h: 570, z: 1.28, fx: 534, fy: 1000, br: 1 };
const KEYS: [number, Win, number][] = [
  [0, POP, 0],
  [SINS[0].at - CARD_IN + 0.12, OPEN, 0.4],
  [T.dunya - 0.35, POP, 0.6],
];
const lerpWin = (a: Win, b: Win, p: number): Win => ({
  x: lerp(a.x, b.x, p), y: lerp(a.y, b.y, p), w: lerp(a.w, b.w, p), h: lerp(a.h, b.h, p),
  z: lerp(a.z, b.z, p), fx: lerp(a.fx, b.fx, p), fy: lerp(a.fy, b.fy, p), br: lerp(a.br, b.br, p),
});

// Punch-ins: a quick eased snap to a tighter or wider framing at sentence beats, then a slow drift in.
const PUNCH: [number, number][] = [
  [0, 1],
  [T.s1, 1.0], [T.trustful - 0.12, 1.13], [T.transaction - 0.2, 1.03],
  [T.s2, 1.0], [T.provide - 0.1, 1.12], [T.yourBusiness - 0.1, 1.0], [T.provider - 0.06, 1.16],
  [T.s3, 1.0], [T.children - 0.1, 1.1], [T.notHaving - 0.05, 1.0], [T.disclaimer - 0.1, 1.17], [T.problem2 - 0.05, 1.04],
  [T.heart - 0.08, 1.15], [T.dunya - 0.35, 1.0], [T.but - 0.08, 1.07],
];
export const PUNCH_TIMES = PUNCH.slice(1).map(([t]) => t);
const punchAt = (t: number) => {
  let i = 0;
  while (i + 1 < PUNCH.length && t >= PUNCH[i + 1][0]) i++;
  const [a, m] = PUNCH[i];
  const b = PUNCH[i + 1]?.[0] ?? T.end;
  const drift = lerp(1, 1.035, (t - a) / (b - a));
  const prev = i ? PUNCH[i - 1][1] * 1.035 : m;
  return lerp(prev, m, prog(t, a - 0.02, 0.16, inOutCubic)) * drift;
};

export const winAt = (t: number): Win => {
  let w = KEYS[0][1];
  for (const [at, k, d] of KEYS) {
    if (t < at) break;
    w = d ? lerpWin(w, k, prog(t, at, d, inOutCubic)) : k;
  }
  // hook: the opening frame springs in from wide and blurred
  const open = prog(t, 0, 0.7, inOutCubic);
  const z = w.z * punchAt(t) * lerp(1.22, 1, open);
  return { ...w, z };
};
export const blurAt = (t: number) => lerp(14, 0, prog(t, 0, 0.45)) + (t > T.cta ? 0 : 0);

/** Shake on "destroy". */
const shakeAt = (t: number) => {
  const k = t - T.destroy;
  if (k < 0 || k > 0.45) return [0, 0];
  const a = (1 - k / 0.45) * 14;
  const f = Math.floor(t * FPS);
  return [(rnd(f) - 0.5) * a, (rnd(f + 99) - 0.5) * a];
};

const Plate = ({ src, transparent = false }: { src: string; transparent?: boolean }) => {
  const frame = useCurrentFrame();
  const last = Math.floor(SRC_END * FPS) - 3;
  const v = (
    <OffthreadVideo
      src={staticFile(src)}
      muted
      transparent={transparent}
      style={{ position: "absolute", left: FOOT.ox, top: FOOT.oy, width: FOOT.w * FOOT.s, height: FOOT.h * FOOT.s }}
    />
  );
  return frame > last ? <Freeze frame={last}>{v}</Freeze> : v;
};

/** Canvas-space camera: both the plate and the speaker layer go through it, so they stay pixel-aligned. */
const Cam = ({ t, children }: { t: number; children: ReactNode }) => {
  const w = winAt(t);
  const [sx, sy] = shakeAt(t);
  const b = blurAt(t);
  return (
    <AbsoluteFill
      style={{
        transform: `translate(${sx}px, ${sy}px) scale(${w.z})`,
        transformOrigin: `${w.fx}px ${w.fy}px`,
        filter: b > 0.1 ? `blur(${b}px)` : undefined,
      }}
    >
      {children}
    </AbsoluteFill>
  );
};

const R = 42;
const inset = (w: Win, top: number) => `inset(${top}px ${1080 - (w.x + w.w)}px ${1920 - (w.y + w.h)}px ${w.x}px round ${R}px)`;

/** Backdrop: the blurred plate, an ink wash, a slow Islamic star lattice in gold, and a glow behind the window. */
export const Backdrop = () => {
  const t = useCurrentFrame() / FPS;
  const w = winAt(t);
  return (
    <AbsoluteFill style={{ background: "#07060A" }}>
      <OffthreadVideo src={staticFile("bg.mp4")} muted style={{ width: 1080, height: 1920, opacity: 0.55 }} />
      <AbsoluteFill style={{ background: "radial-gradient(ellipse 90% 60% at 50% 45%, rgba(20,15,10,0.35), rgba(5,4,6,0.92) 75%)" }} />
      <Lattice t={t} />
      <Abs
        style={{
          left: w.x - 80, top: w.y - 80, width: w.w + 160, height: w.h + 160, borderRadius: 120,
          background: "radial-gradient(ellipse 50% 50% at 50% 50%, rgba(233,201,131,0.16), rgba(233,201,131,0) 70%)",
          filter: "blur(30px)",
        }}
      />
    </AbsoluteFill>
  );
};

/** Eight-point star lattice (khatam), drawn once and drifting slowly upward. */
const Lattice = ({ t }: { t: number }) => {
  const S = 120;
  const star = (cx: number, cy: number, r: number) => {
    const pts: string[] = [];
    for (let i = 0; i < 16; i++) {
      const a = (i * Math.PI) / 8 - Math.PI / 2;
      const rr = i % 2 ? r * 0.62 : r;
      pts.push(`${cx + Math.cos(a) * rr},${cy + Math.sin(a) * rr}`);
    }
    return pts.join(" ");
  };
  return (
    <AbsoluteFill style={{ opacity: 0.11, transform: `translateY(${-(t * 6) % S}px)` }}>
      <svg width={1080} height={1920 + S}>
        <defs>
          <pattern id="khatam" width={S} height={S} patternUnits="userSpaceOnUse">
            <polygon points={star(S / 2, S / 2, S * 0.36)} fill="none" stroke={GOLD} strokeWidth={1.2} />
            <rect x={S / 2 - S * 0.17} y={S / 2 - S * 0.17} width={S * 0.34} height={S * 0.34} fill="none" stroke={GOLD} strokeWidth={0.8}
              transform={`rotate(45 ${S / 2} ${S / 2})`} />
            <path d={`M0 0 L${S * 0.14} ${S * 0.14} M${S} 0 L${S * 0.86} ${S * 0.14} M0 ${S} L${S * 0.14} ${S * 0.86} M${S} ${S} L${S * 0.86} ${S * 0.86}`}
              stroke={GOLD} strokeWidth={0.8} />
          </pattern>
          <radialGradient id="fadeL" cx="50%" cy="45%" r="70%">
            <stop offset="0.25" stopColor="white" stopOpacity="0.15" />
            <stop offset="1" stopColor="white" stopOpacity="1" />
          </radialGradient>
          <mask id="mL"><rect width={1080} height={1920 + S} fill="url(#fadeL)" /></mask>
        </defs>
        <rect width={1080} height={1920 + S} fill="url(#khatam)" mask="url(#mL)" />
      </svg>
    </AbsoluteFill>
  );
};

/** The plate, clipped to the window, with an in-window grade (warm highlights, ink low end, soft vignette). */
export const Footage = () => {
  const t = useCurrentFrame() / FPS;
  const w = winAt(t);
  return (
    <AbsoluteFill style={{ clipPath: inset(w, w.y) }}>
      <Cam t={t}>
        <Plate src="graded.mp4" />
      </Cam>
      <Abs style={{ left: w.x, top: w.y, width: w.w, height: w.h, background: "linear-gradient(180deg, rgba(255,190,110,0.10), rgba(40,20,10,0.16))", mixBlendMode: "soft-light" }} />
      <Abs style={{ left: w.x, top: w.y, width: w.w, height: w.h, background: "radial-gradient(ellipse 75% 70% at 50% 40%, rgba(0,0,0,0) 55%, rgba(4,3,6,0.55) 100%)" }} />
      <Abs style={{ left: w.x, top: w.y + w.h * 0.62, width: w.w, height: w.h * 0.38, background: "linear-gradient(180deg, rgba(5,4,6,0), rgba(5,4,6,0.55))" }} />
    </AbsoluteFill>
  );
};

/** The speaker alone (alpha), same camera; above the window when it breaks out. */
export const Person = () => {
  const t = useCurrentFrame() / FPS;
  const w = winAt(t);
  const top = Math.max(0, w.y - w.br * 900);
  return (
    <AbsoluteFill style={{ clipPath: inset(w, top) }}>
      <Cam t={t}>
        <Plate src="fg.webm" transparent />
      </Cam>
      {/* the bit of him outside the window gets the same warm grade and a rim so he sits on the backdrop */}
      <AbsoluteFill style={{ clipPath: `inset(${top}px 0 ${1920 - w.y}px 0)`, background: "linear-gradient(180deg, rgba(255,190,110,0.10), rgba(40,20,10,0.10))", mixBlendMode: "soft-light" }} />
    </AbsoluteFill>
  );
};

/** Hairline gold frame + soft shadow. Drawn under the speaker so his breakout sits over the edge. */
export const WindowShadow = () => {
  const t = useCurrentFrame() / FPS;
  const w = winAt(t);
  return <Abs style={{ left: w.x, top: w.y, width: w.w, height: w.h, borderRadius: R, boxShadow: "0 40px 120px rgba(0,0,0,0.75), 0 0 0 1px rgba(0,0,0,0.6)" }} />;
};
export const WindowEdge = () => {
  const t = useCurrentFrame() / FPS;
  const w = winAt(t);
  return (
    <Abs
      style={{
        left: w.x, top: w.y, width: w.w, height: w.h, borderRadius: R,
        border: "2px solid transparent",
        background: "linear-gradient(160deg, rgba(255,236,190,0.75), rgba(233,201,131,0.12) 35%, rgba(233,201,131,0.05) 65%, rgba(255,226,170,0.55)) border-box",
        WebkitMask: "linear-gradient(#000 0 0) padding-box, linear-gradient(#000 0 0)",
        WebkitMaskComposite: "xor",
        maskComposite: "exclude",
      }}
    />
  );
};
