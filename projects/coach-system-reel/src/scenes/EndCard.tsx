import React from "react";
import { AbsoluteFill } from "remotion";
import { C, F, ease, k, lerp, useT } from "../theme";
import { Cutaway, Rise } from "../ui";
import TL from "../timeline.json";

const [A, B] = TL.scenes.end;
const MOVES = ["Niche down", "Know your numbers", "Build a social funnel"];

export const EndCard: React.FC = () => {
  const t = useT();
  const black = k(t, B - 0.45, B, ease.inOut);
  return (
    <>
      <Cutaway from={A} to={B + 1}>
        <div style={{ position: "absolute", top: 300, left: 100, right: 100 }}>
          <Rise at={A + 0.15}>
            <div style={{ fontFamily: F.mono, fontSize: 26, letterSpacing: "0.18em", color: C.volt }}>THE RECAP</div>
          </Rise>
          <Rise at={A + 0.25} style={{ marginTop: 30 }}>
            <div style={{ fontFamily: F.sans, fontWeight: 800, fontSize: 104, letterSpacing: "-0.045em", color: C.ink, lineHeight: 1 }}>3 moves to</div>
          </Rise>
          <Rise at={A + 0.4} dur={0.6}>
            <div style={{ fontFamily: F.serif, fontStyle: "italic", fontSize: 168, color: C.volt, lineHeight: 1.0, letterSpacing: "-0.02em" }}>predictable</div>
          </Rise>
          <Rise at={A + 0.55} dur={0.6}>
            <div style={{ fontFamily: F.serif, fontStyle: "italic", fontSize: 168, color: C.volt, lineHeight: 1.0, letterSpacing: "-0.02em" }}>income.</div>
          </Rise>
        </div>

        <div style={{ position: "absolute", top: 940, left: 100, right: 100 }}>
          {MOVES.map((m, i) => {
            const at = 48.9 + i * 0.18;
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
                <span style={{ fontFamily: F.mono, fontWeight: 700, fontSize: 30, color: C.volt, letterSpacing: "0.08em" }}>0{i + 1}</span>
                <span style={{ fontFamily: F.sans, fontWeight: 700, fontSize: 58, color: C.ink, letterSpacing: "-0.03em" }}>{m}</span>
              </div>
            );
          })}
        </div>

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
            opacity: k(t, 49.8, 50.2),
            translate: `0 ${lerp(24, 0, k(t, 49.8, 50.3))}px`,
          }}
        >
          <div style={{ padding: "18px 34px", borderRadius: 999, background: C.volt, fontFamily: F.mono, fontWeight: 700, fontSize: 34, color: C.bg, letterSpacing: "0.04em" }}>
            @stevemartnjr
          </div>
          <div style={{ fontFamily: F.sans, fontWeight: 500, fontSize: 34, color: C.mute }}>Follow for more</div>
        </div>
      </Cutaway>
      <AbsoluteFill style={{ background: "#000", opacity: black }} />
    </>
  );
};
