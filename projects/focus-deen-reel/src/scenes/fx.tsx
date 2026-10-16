import { AbsoluteFill, useCurrentFrame } from "remotion";
import { FPS, T } from "../data";
import { Abs, bump, inOutCubic, lerp, prog, rnd } from "../ui";

/** Short exposure flashes on the big moments. */
export const Flash = () => {
  const t = useCurrentFrame() / FPS;
  const a = Math.max(
    0.85 * (1 - prog(t, 0, 0.3)),
    bump(t - T.guess + 0.04, 0.16) * 0.35,
    bump(t - T.focusdeen1 + 0.04, 0.3) * 0.7,
    bump(t - T.endCard + 0.1, 0.3) * 0.4,
  );
  if (a <= 0.005) return null;
  return <AbsoluteFill style={{ background: "#FFF3EC", opacity: a }} />;
};

/** Warm light leaks that sweep across on section changes. */
const LEAKS = [0.05, T.s3 + 0.1, T.focusdeen1, T.s6, T.s7, T.endCard - 0.1];
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
              opacity: Math.sin(k * Math.PI) * 0.42,
              background: "radial-gradient(ellipse 40% 50% at 50% 50%, rgba(255,170,130,0.95), rgba(255,90,95,0.45) 40%, rgba(255,60,70,0) 72%)",
              filter: "blur(40px)",
              transform: `rotate(${dir * 20}deg)`,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};
