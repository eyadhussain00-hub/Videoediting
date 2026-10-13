import type { CSSProperties } from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";

export const FPS = 30;
export const SRC_END = 31.633;          // last source frame (950 frames)
export const TOTAL = 33.1;              // + end-card hold on the frozen last frame

export const GOLD = "linear-gradient(176deg, #FFF1CC 0%, #F1CF86 38%, #D9A94F 70%, #A9772F 100%)";
export const GOLD_SOLID = "#E9C27A";
export const CORAL = "#E8735A";
export const SANS = "InterTight";
export const SERIF = "InstrumentSerif";
export const SERIF_I = "InstrumentSerifItalic";
export const MONO = "JetBrainsMono";

export const useT = () => useCurrentFrame() / FPS;

export const outCubic = Easing.out(Easing.cubic);
export const outExpo = Easing.out(Easing.exp);
export const inCubic = Easing.in(Easing.cubic);
export const inOut = Easing.inOut(Easing.cubic);
export const outBack = Easing.out(Easing.back(1.6));

/** 0→1 between a and b with easing, clamped. */
export const prog = (t: number, a: number, b: number, ease: (x: number) => number = outCubic) =>
  interpolate(t, [a, b], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease });

/** Visibility envelope: rises over `inD` from a, falls over `outD` ending at b. */
export const env = (t: number, a: number, b: number, inD = 0.35, outD = 0.25) =>
  Math.min(prog(t, a, a + inD), 1 - prog(t, b - outD, b, inCubic));

/** Blur-in style for a 0..1 progress: opacity, blur 14→0 px, rise y px. */
export const blurIn = (p: number, rise = 24): CSSProperties => ({
  opacity: p,
  filter: `blur(${(1 - p) * 14}px)`,
  transform: `translateY(${(1 - p) * rise}px)`,
});

export const goldText: CSSProperties = {
  backgroundImage: GOLD,
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  color: "transparent",
};

export const glass: CSSProperties = {
  background: "linear-gradient(160deg, rgba(34,40,58,0.66) 0%, rgba(9,12,20,0.78) 100%)",
  border: "1.5px solid rgba(255,228,180,0.20)",
  boxShadow: "0 24px 70px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.10)",
  backdropFilter: "blur(16px)",
  borderRadius: 30,
};

export const mono = (size: number, extra: CSSProperties = {}): CSSProperties => ({
  fontFamily: MONO, fontSize: size, letterSpacing: "0.28em", textTransform: "uppercase", fontWeight: 500, ...extra,
});

/** Deterministic pseudo-random in [0,1) from an integer seed. */
export const rnd = (i: number) => {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};
