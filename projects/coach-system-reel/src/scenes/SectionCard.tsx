import React from "react";
import { AbsoluteFill } from "remotion";
import { C, F, ease, k, lerp, useT } from "../theme";
import { Rise } from "../ui";

/** A volt chapter card: wipes up from the bottom, holds, wipes off the top. */
export const SectionCard: React.FC<{
  from: number;
  to: number;
  n: string;
  lines: { text: string; at: number }[];
  sub: string;
  subAt: number;
  size?: number;
}> = ({ from, to, n, lines, sub, subAt, size = 200 }) => {
  const t = useT();
  if (t < from || t > to + 0.02) return null;
  const inP = k(t, from, from + 0.32, ease.out);
  const outP = k(t, to - 0.28, to, ease.in);
  const numP = k(t, from + 0.04, from + 0.6);
  // a slow drift so the hold never sits dead still
  const drift = (t - from) * 14;

  return (
    <AbsoluteFill
      style={{
        clipPath: `inset(${lerp(100, 0, inP)}% 0 ${lerp(0, 100, outP)}% 0)`,
        background: C.volt,
      }}
    >
      {/* giant numeral */}
      <div
        style={{
          position: "absolute",
          left: 60,
          top: 140,
          fontFamily: F.sans,
          fontWeight: 900,
          fontSize: 640,
          lineHeight: 0.8,
          letterSpacing: "-0.07em",
          color: C.bg,
          translate: `${-drift * 0.5}px ${lerp(260, 0, numP)}px`,
        }}
      >
        {n}
      </div>
      <div
        style={{
          position: "absolute",
          right: 80,
          top: 190,
          textAlign: "right",
          fontFamily: F.mono,
          fontWeight: 700,
          fontSize: 26,
          letterSpacing: "0.18em",
          color: C.bg,
          opacity: k(t, from + 0.2, from + 0.5),
        }}
      >
        MOVE
        <br />
        {n} / 03
      </div>

      <div style={{ position: "absolute", left: 70, right: 70, top: 830, translate: `${drift * 0.3}px 0` }}>
        {lines.map((l) => (
          <Rise key={l.text} at={l.at} dur={0.42}>
            <div
              style={{
                fontFamily: F.sans,
                fontWeight: 900,
                fontSize: size,
                lineHeight: 0.92,
                letterSpacing: "-0.055em",
                color: C.bg,
                textTransform: "uppercase",
              }}
            >
              {l.text}
            </div>
          </Rise>
        ))}
        <Rise at={subAt} dur={0.5} style={{ marginTop: 36 }}>
          <div style={{ fontFamily: F.serif, fontStyle: "italic", fontSize: 76, color: C.bg, lineHeight: 1.1 }}>{sub}</div>
        </Rise>
      </div>

      {/* chapter progress */}
      <div style={{ position: "absolute", left: 70, right: 70, bottom: 360, height: 6, background: "rgba(7,7,11,0.15)", borderRadius: 3 }}>
        <div style={{ height: 6, borderRadius: 3, background: C.bg, width: `${100 * k(t, from + 0.1, to - 0.1, ease.lin)}%` }} />
      </div>
    </AbsoluteFill>
  );
};
