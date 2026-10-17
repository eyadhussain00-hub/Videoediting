import { AbsoluteFill, useCurrentFrame } from "remotion";
import { CH, FPS, T } from "../data";
import { Abs, bump, inOutCubic, lerp, prog, rnd } from "../ui";

/** Short exposure flashes on the big moments. */
export const Flash = () => {
  const t = useCurrentFrame() / FPS;
  const a = Math.max(
    0.8 * (1 - prog(t, 0, 0.3)),
    bump(t - CH.isa + 0.04, 0.2) * 0.3,
    bump(t - CH.sipp + 0.04, 0.2) * 0.3,
    bump(t - T.catch + 0.06, 0.16) * 0.45,
    bump(t - T.both2 + 0.06, 0.25) * 0.5,
    bump(t - T.endCard + 0.1, 0.3) * 0.35,
  );
  if (a <= 0.005) return null;
  return <AbsoluteFill style={{ background: "#FFF6E6", opacity: a }} />;
};

/** Light leaks that sweep across on chapter changes: gold for the ISA, sapphire for the SIPP. */
const LEAKS: [number, string][] = [
  [0.05, "255,190,90"],
  [CH.isa, "255,190,90"],
  [CH.sipp, "90,150,255"],
  [T.when, "90,150,255"],
  [T.both2, "255,190,90"],
  [CH.outro, "255,190,90"],
  [T.endCard - 0.1, "255,190,90"],
];
export const LightLeaks = () => {
  const t = useCurrentFrame() / FPS;
  return (
    <AbsoluteFill style={{ mixBlendMode: "screen", pointerEvents: "none" }}>
      {LEAKS.map(([p, c], i) => {
        const k = (t - (p - 0.15)) / 0.8;
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
              opacity: Math.sin(k * Math.PI) * 0.4,
              background: `radial-gradient(ellipse 40% 50% at 50% 50%, rgba(${c},0.95), rgba(${c},0.4) 40%, rgba(${c},0) 72%)`,
              filter: "blur(40px)",
              transform: `rotate(${dir * 20}deg)`,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};
