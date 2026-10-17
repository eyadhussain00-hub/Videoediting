import { AbsoluteFill } from "remotion";
import { T, at } from "./data";
import { useT } from "./kit";
import { Abs, bump, inOutCubic, lerp, prog, rnd } from "./ui";

/** Short exposure flashes on the big moments. */
export const Flash = () => {
  const t = useT();
  const hits = [at("changed"), at("step"), at("now", 3), at("0.01%"), T.endCard];
  const a = Math.max(0.7 * (1 - prog(t, 0, 0.35)), ...hits.map((h) => bump(t - h + 0.05, 0.22) * 0.35));
  if (a <= 0.005) return null;
  return <AbsoluteFill style={{ background: "#FFF1E6", opacity: a }} />;
};

/** Warm light leaks that sweep across on section changes. */
export const LightLeaks = () => {
  const t = useT();
  const leaks = [0.1, at("complete"), at("exact"), at("changed"), at("step"), at("every", 2), at("now", 3), at("it's"), at("best"), at("as", 2), T.endCard - 0.1];
  return (
    <AbsoluteFill style={{ mixBlendMode: "screen", pointerEvents: "none" }}>
      {leaks.map((p, i) => {
        const d = 0.9;
        const k = (t - (p - 0.15)) / d;
        if (k < 0 || k > 1) return null;
        const dir = i % 2 ? -1 : 1;
        const x = lerp(-500, 1580, inOutCubic(k));
        return (
          <Abs key={i} style={{ left: dir > 0 ? x - 600 : 1080 - x - 600, top: -200 + rnd(i) * 900, width: 1200, height: 1500, opacity: Math.sin(k * Math.PI) * 0.36, background: "radial-gradient(ellipse 40% 50% at 50% 50%, rgba(255,190,140,0.95), rgba(255,106,43,0.42) 40%, rgba(255,80,30,0) 72%)", filter: "blur(40px)", transform: `rotate(${dir * 20}deg)` }} />
        );
      })}
    </AbsoluteFill>
  );
};
