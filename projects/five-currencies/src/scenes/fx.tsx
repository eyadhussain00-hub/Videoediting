import { AbsoluteFill, useCurrentFrame } from "remotion";
import { FPS, T } from "../data";
import { Abs, inOutCubic, lerp, prog, rnd } from "../ui";
import { PUNCHES } from "./base";

/** Warm light leak that sweeps across on every section change. */
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
        return (
          <Abs
            key={i}
            style={{
              left: dir > 0 ? x - 600 : 1080 - x - 600,
              top: -200 + rnd(i) * 900,
              width: 1200,
              height: 1500,
              opacity: a * 0.55,
              background: "radial-gradient(ellipse 40% 50% at 50% 50%, rgba(255,150,60,0.95), rgba(255,90,30,0.45) 40%, rgba(255,60,20,0) 72%)",
              filter: "blur(40px)",
              transform: `rotate(${dir * 18}deg)`,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

/** Anamorphic flare streak on the big hits. */
const FLARES: [number, number][] = [
  [T.million + 0.1, 980],
  [T.yes, 1500],
];
export const Flares = () => {
  const t = useCurrentFrame() / FPS;
  return (
    <AbsoluteFill style={{ mixBlendMode: "screen", pointerEvents: "none" }}>
      {FLARES.map(([s, y], i) => {
        const k = prog(t, s - 0.02, 0.9);
        if (t < s - 0.02 || k >= 1) return null;
        const a = Math.min(1, (t - s + 0.02) / 0.05) * (1 - k);
        return (
          <div key={i}>
            <Abs style={{ left: -200, right: -200, top: y - 5, height: 10, opacity: a, background: "linear-gradient(90deg, rgba(255,200,120,0), rgba(255,236,200,1) 50%, rgba(255,200,120,0))", filter: "blur(3px)", transform: `scaleX(${lerp(0.4, 1.3, k)})` }} />
            <Abs style={{ left: -200, right: -200, top: y - 50, height: 100, opacity: a * 0.5, background: "linear-gradient(90deg, rgba(255,160,70,0), rgba(255,190,110,0.8) 50%, rgba(255,160,70,0))", filter: "blur(26px)" }} />
            <Abs style={{ left: 540 - 160, top: y - 160, width: 320, height: 320, borderRadius: "50%", opacity: a * 0.6, background: "radial-gradient(circle, rgba(255,240,210,0.9), rgba(255,190,110,0) 65%)" }} />
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

/** Cinematic letterbox for the proof beat. */
export const Letterbox = () => {
  const t = useCurrentFrame() / FPS;
  const p = Math.min(prog(t, T.proof - 0.05, 0.45, inOutCubic), 1 - prog(t, T.cta - 0.25, 0.4, inOutCubic));
  if (p <= 0) return null;
  const h = 150 * p;
  return (
    <>
      <Abs style={{ left: 0, right: 0, top: 0, height: h, background: "#050505" }} />
      <Abs style={{ left: 0, right: 0, bottom: 0, height: h, background: "#050505" }} />
    </>
  );
};

/** Chromatic fringe flicker on the punches: a red/cyan offset edge glow, very brief. */
export const ChromaKick = () => {
  const t = useCurrentFrame() / FPS;
  let a = 0;
  for (const p of PUNCHES) {
    const x = t - p + 0.05;
    if (x >= 0 && x < 0.16) a = Math.max(a, 1 - x / 0.16);
  }
  if (a <= 0) return null;
  return (
    <>
      <AbsoluteFill style={{ boxShadow: `inset ${14 * a}px 0 60px rgba(255,40,40,${0.35 * a}), inset ${-14 * a}px 0 60px rgba(40,220,255,${0.3 * a})`, mixBlendMode: "screen" }} />
    </>
  );
};
