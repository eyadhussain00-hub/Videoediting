import { AbsoluteFill, useCurrentFrame } from "remotion";
import { FPS, T } from "../data";
import { Abs, bump, inOutCubic, lerp, prog, rnd } from "../ui";

/** Short exposure flashes on the big moments (hot flashes early, a cool one at the breath). */
export const Flash = () => {
  const t = useCurrentFrame() / FPS;
  const hot = Math.max(0.7 * (1 - prog(t, 0, 0.28)), bump(t - T.boom + 0.04, 0.22) * 0.85, bump(t - T.anxious + 0.04, 0.14) * 0.3, bump(t - T.fight + 0.04, 0.16) * 0.35);
  const cool = Math.max(bump(t - T.three + 0.04, 0.24) * 0.35, bump(t - T.endCard + 0.1, 0.3) * 0.35);
  return (
    <>
      {hot > 0.005 && <AbsoluteFill style={{ background: "#FFE2CF", opacity: hot }} />}
      {cool > 0.005 && <AbsoluteFill style={{ background: "#E2F8FF", opacity: cool }} />}
    </>
  );
};

/** Light leaks that sweep across on section changes: warm before the breath, cool after. */
const LEAKS = [0.05, T.thats, T.listen, T.explain, T.boom + 0.05, T.brain, T.trouble - 0.2, T.three, T.first, T.second, T.third, T.remember - 0.2, T.elite, T.endCard - 0.1];
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
        const cool = p >= T.second;
        return (
          <Abs
            key={i}
            style={{
              left: dir > 0 ? x - 600 : 1080 - x - 600, top: -200 + rnd(i) * 900, width: 1200, height: 1500,
              opacity: Math.sin(k * Math.PI) * 0.38,
              background: cool
                ? "radial-gradient(ellipse 40% 50% at 50% 50%, rgba(140,230,255,0.9), rgba(60,170,255,0.4) 40%, rgba(40,120,255,0) 72%)"
                : "radial-gradient(ellipse 40% 50% at 50% 50%, rgba(255,170,110,0.95), rgba(255,80,40,0.45) 40%, rgba(255,50,30,0) 72%)",
              filter: "blur(40px)", transform: `rotate(${dir * 20}deg)`,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};
