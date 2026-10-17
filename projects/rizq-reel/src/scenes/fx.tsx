import { AbsoluteFill, useCurrentFrame } from "remotion";
import { FPS, ITEMS, T, cardWin } from "../data";
import { Abs, bump, inOutCubic, lerp, prog, rnd } from "../ui";

/** Short warm exposure flashes on the big moments. */
export const Flash = () => {
  const t = useCurrentFrame() / FPS;
  const a = Math.max(
    0.8 * (1 - prog(t, 0, 0.3)),
    bump(t - T.seven + 0.04, 0.18) * 0.3,
    bump(t - T.rizq + 0.04, 0.3) * 0.45,
    ...ITEMS.map((it) => bump(t - cardWin(it)[1] + 0.06, 0.22) * 0.35),
    bump(t - T.endCard + 0.1, 0.3) * 0.35,
  );
  if (a <= 0.005) return null;
  return <AbsoluteFill style={{ background: "#FFF4DC", opacity: a }} />;
};

/** Gold light leaks sweeping across on the section changes. */
const LEAKS = [0.05, T.rizq - 0.1, ...ITEMS.map((it) => cardWin(it)[0] + 0.05), T.recap, T.endCard - 0.1];
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
              background: "radial-gradient(ellipse 40% 50% at 50% 50%, rgba(255,214,140,0.95), rgba(226,160,70,0.45) 40%, rgba(200,130,40,0) 72%)",
              filter: "blur(40px)",
              transform: `rotate(${dir * 20}deg)`,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

/** Darkens the speaker under the recap panel. */
export const RecapDim = () => {
  const t = useCurrentFrame() / FPS;
  const a = 0.55 * prog(t, T.recap, 0.5);
  return a > 0 ? <AbsoluteFill style={{ background: `rgba(2,14,10,${a})`, backdropFilter: `blur(${a * 10}px)` }} /> : null;
};
