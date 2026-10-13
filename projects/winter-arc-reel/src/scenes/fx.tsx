import { AbsoluteFill, useCurrentFrame } from "remotion";
import { FPS, T } from "../data";
import { Abs, inOutCubic, lerp, prog, rnd } from "../ui";
import { PUNCHES, dawnAt } from "./base";

/** Cold light leak sweeping across on every section change (warm during the dawn beat). */
export const LightLeaks = () => {
  const t = useCurrentFrame() / FPS;
  return (
    <AbsoluteFill style={{ mixBlendMode: "screen", pointerEvents: "none" }}>
      {PUNCHES.map((p, i) => {
        const d = 0.75;
        const k = (t - (p - 0.12)) / d;
        if (k < 0 || k > 1) return null;
        const a = Math.sin(k * Math.PI);
        const dir = i % 2 ? -1 : 1;
        const x = lerp(-500, 1580, inOutCubic(k));
        const warm = dawnAt(p) > 0.5;
        const c = warm
          ? "radial-gradient(ellipse 40% 50% at 50% 50%, rgba(255,170,80,0.95), rgba(255,110,40,0.45) 40%, rgba(255,80,30,0) 72%)"
          : "radial-gradient(ellipse 40% 50% at 50% 50%, rgba(150,210,255,0.9), rgba(70,140,255,0.45) 40%, rgba(40,100,255,0) 72%)";
        return (
          <Abs
            key={i}
            style={{
              left: dir > 0 ? x - 600 : 1080 - x - 600,
              top: -200 + rnd(i) * 900,
              width: 1200,
              height: 1500,
              opacity: a * 0.5,
              background: c,
              filter: "blur(40px)",
              transform: `rotate(${dir * 18}deg)`,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

/** Anamorphic flare streaks on the big hits. */
const FLARES: [number, number][] = [
  [T.unrec, 1360],
  [T.ihsan, 1180],
  [T.barakah, 600],
  [T.cta, 330],
];
export const Flares = () => {
  const t = useCurrentFrame() / FPS;
  return (
    <AbsoluteFill style={{ mixBlendMode: "screen", pointerEvents: "none" }}>
      {FLARES.map(([s, y], i) => {
        const k = prog(t, s - 0.02, 0.9);
        if (t < s - 0.02 || k >= 1) return null;
        const a = Math.min(1, (t - s + 0.02) / 0.05) * (1 - k);
        const warm = dawnAt(s) > 0.5;
        const core = warm ? "rgba(255,236,200,1)" : "rgba(225,242,255,1)";
        const halo = warm ? "rgba(255,190,110,0.8)" : "rgba(140,200,255,0.8)";
        return (
          <div key={i}>
            <Abs style={{ left: -200, right: -200, top: y - 5, height: 10, opacity: a, background: `linear-gradient(90deg, rgba(0,0,0,0), ${core} 50%, rgba(0,0,0,0))`, filter: "blur(3px)", transform: `scaleX(${lerp(0.4, 1.3, k)})` }} />
            <Abs style={{ left: -200, right: -200, top: y - 50, height: 100, opacity: a * 0.5, background: `linear-gradient(90deg, rgba(0,0,0,0), ${halo} 50%, rgba(0,0,0,0))`, filter: "blur(26px)" }} />
            <Abs style={{ left: 540 - 160, top: y - 160, width: 320, height: 320, borderRadius: "50%", opacity: a * 0.6, background: `radial-gradient(circle, ${core}, rgba(0,0,0,0) 65%)` }} />
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

/** Cinematic letterbox for the payoff. */
export const Letterbox = () => {
  const t = useCurrentFrame() / FPS;
  const p = Math.min(prog(t, T.payoff - 0.05, 0.45, inOutCubic), 1 - prog(t, T.offer - 0.1, 0.4, inOutCubic));
  if (p <= 0) return null;
  const h = 130 * p;
  return (
    <>
      <Abs style={{ left: 0, right: 0, top: 0, height: h, background: "#03070C" }} />
      <Abs style={{ left: 0, right: 0, bottom: 0, height: h, background: "#03070C" }} />
    </>
  );
};

/** Chromatic fringe flicker on the punches. */
export const ChromaKick = () => {
  const t = useCurrentFrame() / FPS;
  let a = 0;
  for (const p of PUNCHES) {
    const x = t - p + 0.05;
    if (x >= 0 && x < 0.16) a = Math.max(a, 1 - x / 0.16);
  }
  if (a <= 0) return null;
  return <AbsoluteFill style={{ boxShadow: `inset ${14 * a}px 0 60px rgba(255,40,80,${0.3 * a}), inset ${-14 * a}px 0 60px rgba(40,200,255,${0.35 * a})`, mixBlendMode: "screen" }} />;
};

/** Frost creeping in from the frame edges (hook, payoff, CTA). */
export const FrostEdges = () => {
  const t = useCurrentFrame() / FPS;
  const a = 0.6 * Math.max(1 - prog(t, T.s1 - 0.2, 0.8), Math.min(prog(t, T.unrec - 0.1, 0.4), 1 - prog(t, T.offer + 0.5, 0.8)), prog(t, T.cta, 1.2)) * (1 - dawnAt(t));
  if (a <= 0.01) return null;
  return (
    <AbsoluteFill style={{ opacity: a, pointerEvents: "none" }}>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse 75% 60% at 50% 48%, rgba(0,0,0,0) 62%, rgba(200,232,255,0.30) 88%, rgba(235,248,255,0.55) 100%)", mixBlendMode: "screen" }} />
      <AbsoluteFill style={{ mixBlendMode: "screen", opacity: 0.35 }}>
        <svg width="1080" height="1920">
          <filter id="frost">
            <feTurbulence type="fractalNoise" baseFrequency="0.012 0.03" numOctaves="4" seed="7" />
            <feColorMatrix type="matrix" values="0 0 0 0 0.85  0 0 0 0 0.93  0 0 0 0 1  0 0 0 1.6 -0.75" />
          </filter>
          <mask id="edge">
            <rect width="1080" height="1920" fill="url(#eg)" />
          </mask>
          <radialGradient id="eg" cx="50%" cy="48%" r="70%">
            <stop offset="0.6" stopColor="black" />
            <stop offset="1" stopColor="white" />
          </radialGradient>
          <rect width="1080" height="1920" filter="url(#frost)" mask="url(#edge)" />
        </svg>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
