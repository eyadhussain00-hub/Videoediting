import { AbsoluteFill, useCurrentFrame } from "remotion";
import { inCubic, prog, useT } from "./theme";

/** Grade: warm highlights / cool shadows wash + vignette. */
export const Grade = () => (
  <>
    <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(255,170,110,0.10) 0%, rgba(20,40,70,0.0) 45%, rgba(10,30,60,0.18) 100%)", mixBlendMode: "soft-light" }} />
    <AbsoluteFill style={{ background: "radial-gradient(ellipse 75% 62% at 50% 44%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.62) 100%)" }} />
    <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(4,6,12,0.55) 0%, rgba(4,6,12,0) 22%)" }} />
  </>
);

/** Film grain: SVG turbulence, new seed every frame. */
export const Grain = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ opacity: 0.09, mixBlendMode: "overlay" }}>
      <svg width="1080" height="1920">
        <filter id="g">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed={f % 97} />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="1080" height="1920" filter="url(#g)" />
      </svg>
    </AbsoluteFill>
  );
};

/** Warm light leak sweeping across at section changes. */
const LEAKS = [8.58, 11.8, 17.4, 24.12, 27.34];
export const LightLeaks = () => {
  const t = useT();
  return (
    <>
      {LEAKS.map((a) => {
        if (t < a || t > a + 0.6) return null;
        const p = prog(t, a, a + 0.6, (x) => x);
        const o = Math.sin(p * Math.PI);
        return (
          <AbsoluteFill key={a} style={{ mixBlendMode: "screen", opacity: o * 0.85 }}>
            <AbsoluteFill style={{ background: `radial-gradient(ellipse 50% 70% at ${-20 + p * 140}% 35%, rgba(255,170,90,0.75) 0%, rgba(255,110,60,0.35) 35%, rgba(0,0,0,0) 70%)` }} />
            <AbsoluteFill style={{ background: `radial-gradient(ellipse 30% 40% at ${110 - p * 120}% 70%, rgba(255,220,160,0.45) 0%, rgba(0,0,0,0) 70%)` }} />
          </AbsoluteFill>
        );
      })}
    </>
  );
};

/** Full-frame flashes (zoom-through, hook hit). */
const FLASHES: [number, number, number][] = [[1.68, 0.22, 0.35], [23.42, 0.26, 1], [31.66, 0.3, 0.5]];
export const Flashes = () => {
  const t = useT();
  const o = Math.max(0, ...FLASHES.map(([a, d, peak]) => (t >= a && t <= a + d ? peak * (1 - prog(t, a, a + d, inCubic)) * prog(t, a - 0.001, a + 0.04) : 0)));
  return o > 0 ? <AbsoluteFill style={{ background: "radial-gradient(circle at 50% 40%, #FFF6E2 0%, #F3D9A4 60%, #E2B66A 100%)", opacity: o }} /> : null;
};

/** Cinematic letterbox on "nothing really changes". */
export const Letterbox = () => {
  const t = useT();
  const h = 150 * Math.min(prog(t, 16.34, 16.62), 1 - prog(t, 17.28, 17.46, inCubic));
  if (h <= 0) return null;
  return (
    <>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: h, background: "#000" }} />
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: h, background: "#000" }} />
    </>
  );
};
