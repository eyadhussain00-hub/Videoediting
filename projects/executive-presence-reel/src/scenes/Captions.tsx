import React from "react";
import data from "../data.json";
import { C, P, E, SANS, SERIF, goldText, clamp01 } from "../theme";

type G = { start: number; end: number; strike: number | null; words: { t: number; w: string; key: boolean }[] };
const groups = data.groups as G[];

export const CAPTION_Y = 1168;

/** Kinetic captions: quiet sans filler, gold serif-italic keyword; words blur in on their spoken syllable. */
export const Captions: React.FC<{ t: number }> = ({ t }) => {
  const g = groups.find((g) => t >= g.start - 0.04 && t < g.end);
  if (!g) return null;
  const out = clamp01((g.end - t) / 0.12);
  const sp = g.strike ? P(t, g.strike, 0.32, E.inOutCubic) : 0;
  return (
    <div style={{
      position: "absolute", left: 0, right: 0, top: CAPTION_Y, height: 150, display: "flex",
      justifyContent: "center", alignItems: "center", opacity: out, filter: `blur(${(1 - out) * 8}px)`,
    }}>
      <div style={{ position: "relative", display: "flex", alignItems: "baseline", gap: 20, flexWrap: "wrap", justifyContent: "center", maxWidth: 900 }}>
        {g.words.map((w, i) => {
          const p = P(t, w.t - 0.05, 0.24);
          const base: React.CSSProperties = {
            display: "inline-block", opacity: p * (sp > 0 ? 1 - 0.45 * sp : 1),
            transform: `translateY(${(1 - p) * 22}px) scale(${0.96 + 0.04 * p})`,
          };
          return w.key ? (
            <span key={i} style={{
              ...base, ...goldText, fontFamily: SERIF, fontStyle: "italic", fontSize: 104, lineHeight: 1,
              padding: "0 6px", letterSpacing: -1,
              filter: `blur(${(1 - p) * 12}px) drop-shadow(0 6px 22px rgba(0,0,0,0.55))`,
            }}>{w.w.toLowerCase()}</span>
          ) : (
            <span key={i} style={{
              ...base, fontFamily: SANS, fontWeight: 600, fontSize: 62, color: C.cream, letterSpacing: -1,
              filter: `blur(${(1 - p) * 10}px)`, textShadow: "0 4px 24px rgba(0,0,0,0.6)",
            }}>{w.w}</span>
          );
        })}
        {sp > 0 && (
          <div style={{
            position: "absolute", left: -10, top: "52%", height: 6, borderRadius: 3, background: C.gold,
            width: `calc((100% + 20px) * ${sp})`, boxShadow: `0 0 18px ${C.gold}`,
          }} />
        )}
      </div>
    </div>
  );
};
