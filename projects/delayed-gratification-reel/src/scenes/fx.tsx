import { AbsoluteFill, useCurrentFrame } from "remotion";
import { FPS, T } from "../data";
import { Abs, bump, inOutCubic, lerp, prog, rnd } from "../ui";

/** Short exposure flashes on the big moments. */
export const Flash = () => {
  const t = useCurrentFrame() / FPS;
  const a = Math.max(
    0.8 * (1 - prog(t, 0, 0.3)),
    bump(t - T.free1 - 0.02, 0.18) * 0.3,
    bump(t - T.dont3 + 0.04, 0.16) * 0.35,
    bump(t - T.sixteen + 0.04, 0.22) * 0.3,
    bump(t - T.endCard + 0.1, 0.3) * 0.35,
  );
  if (a <= 0.005) return null;
  return <AbsoluteFill style={{ background: "#FFF4E0", opacity: a }} />;
};

/** Warm gold light leaks that sweep across on section changes. */
const LEAKS = [0.05, T.s4 + 0.05, T.s6, T.sixteen, T.s8 + 0.1, T.endCard - 0.1];
export const LightLeaks = () => {
  const t = useCurrentFrame() / FPS;
  return (
    <AbsoluteFill style={{ mixBlendMode: "screen", pointerEvents: "none" }}>
      {LEAKS.map((p, i) => {
        const d = 0.8;
        const k = (t - (p - 0.15)) / d;
        if (k < 0 || k > 1) return null;
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
              opacity: Math.sin(k * Math.PI) * 0.38,
              background: "radial-gradient(ellipse 40% 50% at 50% 50%, rgba(255,214,140,0.95), rgba(232,150,60,0.45) 40%, rgba(232,120,40,0) 72%)",
              filter: "blur(40px)",
              transform: `rotate(${dir * 20}deg)`,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

/** Gold dust drifting up through the payoff (16 years → referrals → journey). */
export const Dust = () => {
  const t = useCurrentFrame() / FPS;
  const a = Math.min(prog(t, T.sixteen - 0.2, 0.6), 1 - prog(t, T.endCard + 1.2, 0.6));
  if (a <= 0) return null;
  return (
    <AbsoluteFill style={{ mixBlendMode: "screen", opacity: a }}>
      {Array.from({ length: 40 }, (_, i) => {
        const sp = 40 + rnd(i) * 80;
        const y = 1950 - (((t - T.sixteen) * sp + rnd(i + 50) * 1950) % 1950);
        const x = rnd(i + 9) * 1080 + Math.sin(t * 0.8 + i) * 30;
        const s = 3 + rnd(i + 20) * 7;
        return <Abs key={i} style={{ left: x, top: y, width: s, height: s, borderRadius: s, background: "#FFD685", opacity: 0.25 + rnd(i + 3) * 0.5, boxShadow: "0 0 12px #E8B04B", filter: `blur(${rnd(i + 7) * 2}px)` }} />;
      })}
    </AbsoluteFill>
  );
};
