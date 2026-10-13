import { AbsoluteFill } from "remotion";
import data from "./captions.json";
import { SANS, SERIF_I, goldText, inCubic, prog, useT } from "./theme";

type Group = { s: number; e: number; hide: boolean; words: { w: string; t: number; key: boolean }[] };
const GROUPS = data as Group[];

export const Captions = () => {
  const t = useT();
  const g = GROUPS.find((x) => !x.hide && t >= x.s - 0.06 && t < x.e);
  if (!g) return null;
  const out = prog(t, g.e - 0.1, g.e, inCubic);
  return (
    <AbsoluteFill style={{ top: 1250, height: 220, alignItems: "center", justifyContent: "center" }}>
      <div
        style={{
          display: "flex", flexWrap: "wrap", justifyContent: "center", alignItems: "baseline", columnGap: 16,
          maxWidth: 900, opacity: 1 - out, filter: `blur(${out * 8}px)`, transform: `translateY(${-out * 14}px)`,
        }}
      >
        {g.words.map((w, i) => {
          const p = prog(t, w.t - 0.05, w.t + 0.2);
          const pop = w.key ? 1 + (1 - prog(t, w.t - 0.02, w.t + 0.32)) * 0.18 : 1;
          return (
            <span
              key={i}
              style={{
                display: "inline-block",
                opacity: p,
                transform: `translateY(${(1 - p) * 18}px) scale(${pop})`,
                ...(w.key
                  ? { fontFamily: SERIF_I, fontSize: 92, lineHeight: 1.0, ...goldText, filter: `blur(${(1 - p) * 12}px) drop-shadow(0 0 18px rgba(233,194,122,0.45)) drop-shadow(0 4px 10px rgba(0,0,0,0.6))`, padding: "0 6px" }
                  : { fontFamily: SANS, fontWeight: 600, fontSize: 58, color: "#fff", letterSpacing: "-0.015em", textShadow: "0 3px 16px rgba(0,0,0,0.7)", filter: `blur(${(1 - p) * 12}px)` }),
              }}
            >
              {w.w}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
