import React from "react";
import { AbsoluteFill } from "remotion";
import { F, ease, k, lerp, useReel, useT } from "./theme";
import { Cutaway, Rise } from "./ui";

/** Recap: kicker, a sans line over an accent serif line or two, numbered points, the handle, fade to black. */
export const EndCard: React.FC = () => {
  const t = useT();
  const { end, theme: C } = useReel();
  const { from: A, to: B } = end;
  if (t < A - 0.05) return null;
  const black = k(t, B - 0.45, B, ease.inOut);
  const { pointsAt, handleAt } = end;

  return (
    <>
      <Cutaway from={A} to={B + 1}>
        <div style={{ position: "absolute", top: 300, left: 100, right: 100 }}>
          <Rise at={A + 0.15}>
            <div style={{ fontFamily: F.mono, fontSize: 26, letterSpacing: "0.18em", color: C.accent }}>{end.kicker.toUpperCase()}</div>
          </Rise>
          <Rise at={A + 0.25} style={{ marginTop: 30 }}>
            <div style={{ fontFamily: F.sans, fontWeight: 800, fontSize: 104, letterSpacing: "-0.045em", color: C.ink, lineHeight: 1 }}>{end.title}</div>
          </Rise>
          {end.accent.map((line, i) => (
            <Rise key={line} at={A + 0.4 + i * 0.15} dur={0.6}>
              <div style={{ fontFamily: F.serif, fontStyle: "italic", fontSize: 168, color: C.accent, lineHeight: 1.0, letterSpacing: "-0.02em" }}>{line}</div>
            </Rise>
          ))}
        </div>

        <div style={{ position: "absolute", top: 940, left: 100, right: 100 }}>
          {end.points.map((m, i) => {
            const at = pointsAt + i * 0.18;
            const p = k(t, at, at + 0.5);
            return (
              <div
                key={m}
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  gap: 30,
                  padding: "30px 0",
                  borderTop: `1.5px solid rgba(255,255,255,${0.1 * p})`,
                  opacity: p,
                  translate: `${lerp(-40, 0, p)}px 0`,
                }}
              >
                <span style={{ fontFamily: F.mono, fontWeight: 700, fontSize: 30, color: C.accent, letterSpacing: "0.08em" }}>{String(i + 1).padStart(2, "0")}</span>
                <span style={{ fontFamily: F.sans, fontWeight: 700, fontSize: 58, color: C.ink, letterSpacing: "-0.03em" }}>{m}</span>
              </div>
            );
          })}
        </div>

        {end.handle && (
          <div
            style={{
              position: "absolute",
              top: 1440,
              left: 0,
              right: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 18,
              opacity: k(t, handleAt, handleAt + 0.4),
              translate: `0 ${lerp(24, 0, k(t, handleAt, handleAt + 0.5))}px`,
            }}
          >
            <div style={{ padding: "18px 34px", borderRadius: 999, background: C.accent, fontFamily: F.mono, fontWeight: 700, fontSize: 34, color: C.bg, letterSpacing: "0.04em" }}>{end.handle}</div>
            {end.cta && <div style={{ fontFamily: F.sans, fontWeight: 500, fontSize: 34, color: C.mute }}>{end.cta}</div>}
          </div>
        )}
      </Cutaway>
      <AbsoluteFill style={{ background: "#000", opacity: black }} />
    </>
  );
};
