import React from "react";
import { C, F, ease, k, lerp, spr, useT } from "../theme";
import { Count, Cutaway, Kicker, Rise, cardStyle } from "../ui";
import TL from "../timeline.json";

const [A, B] = TL.scenes.system;
const NODES = [
  { x: 220, label: "CONTENT", at: 9.0 },
  { x: 540, label: "FUNNEL", at: 9.15 },
  { x: 860, label: "CALLS", at: 9.3 },
];
const NY = 760;

const Icon: React.FC<{ i: number; on: number }> = ({ i, on }) => {
  const stroke = on > 0.5 ? C.bg : C.ink;
  return (
    <svg width="84" height="84" viewBox="0 0 84 84" fill="none" stroke={stroke} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round">
      {i === 0 && (
        <>
          <rect x="10" y="16" width="64" height="52" rx="12" />
          <path d="M36 32 L52 42 L36 52 Z" fill={stroke} />
        </>
      )}
      {i === 1 && <path d="M12 18 H72 L50 44 V66 L34 58 V44 Z" />}
      {i === 2 && (
        <>
          <rect x="12" y="18" width="60" height="54" rx="10" />
          <path d="M12 34 H72 M28 12 V24 M56 12 V24" />
          <path d="M32 52 L40 60 L54 44" />
        </>
      )}
    </svg>
  );
};

export const System: React.FC = () => {
  const t = useT();
  const line = k(t, 9.1, 9.6, ease.inOut);
  // prospects arrive at a steady beat: that's the point
  const dots = Array.from({ length: 14 }, (_, i) => 9.5 + i * 0.26).filter((s) => t >= s && t <= s + 1.3);
  const pulse = (x: number) => dots.some((s) => Math.abs(lerp(220, 860, (t - s) / 1.3) - x) < 30);

  return (
    <Cutaway from={A} to={B}>
      <Kicker text="THE NEW WAY" at={A + 0.05} />

      <div style={{ position: "absolute", top: 330, left: 0, right: 0, textAlign: "center" }}>
        <Rise at={8.12}>
          <div style={{ fontFamily: F.sans, fontWeight: 800, fontSize: 94, letterSpacing: "-0.04em", color: C.ink }}>A predictable</div>
        </Rise>
        <Rise at={8.52} dur={0.6} style={{ marginTop: -24 }}>
          <div style={{ fontFamily: F.serif, fontStyle: "italic", fontSize: 190, lineHeight: 1, color: C.volt, letterSpacing: "-0.02em" }}>
            system.
          </div>
        </Rise>
      </div>

      {/* pipeline */}
      <div
        style={{
          position: "absolute",
          left: 220,
          top: NY - 2,
          height: 4,
          width: 640 * line,
          background: `linear-gradient(90deg, ${C.volt}, rgba(215,255,61,0.35))`,
          borderRadius: 2,
        }}
      />
      {dots.map((s) => {
        const p = (t - s) / 1.3;
        return (
          <div
            key={s}
            style={{
              position: "absolute",
              left: lerp(220, 860, p) - 11,
              top: NY - 11,
              width: 22,
              height: 22,
              borderRadius: 11,
              background: C.volt,
              boxShadow: `0 0 24px ${C.volt}, 0 0 60px rgba(215,255,61,0.5)`,
              opacity: Math.min(1, p * 8, (1 - p) * 8),
            }}
          />
        );
      })}
      {NODES.map((n, i) => {
        const p = spr(t, n.at, 12, 220, 0.7);
        const on = pulse(n.x) ? 1 : 0;
        return (
          <div key={n.label}>
            <div
              style={{
                position: "absolute",
                left: n.x - 105,
                top: NY - 105,
                width: 210,
                height: 210,
                borderRadius: 52,
                display: "grid",
                placeItems: "center",
                background: on ? C.volt : "#15151C",
                boxShadow: on
                  ? `0 0 60px rgba(215,255,61,0.45)`
                  : "inset 0 0 0 1.5px rgba(255,255,255,0.14), 0 20px 60px rgba(0,0,0,0.5)",
                scale: String(t >= n.at ? lerp(0.4, 1, p) * (on ? 1.05 : 1) : 0),
                opacity: t >= n.at ? 1 : 0,
              }}
            >
              <Icon i={i} on={on} />
            </div>
            <div
              style={{
                position: "absolute",
                left: n.x - 150,
                width: 300,
                top: NY + 128,
                textAlign: "center",
                fontFamily: F.mono,
                fontWeight: 500,
                fontSize: 26,
                letterSpacing: "0.16em",
                color: C.mute,
                opacity: k(t, n.at + 0.1, n.at + 0.4),
              }}
            >
              {n.label}
            </div>
          </div>
        );
      })}

      {/* steady leads */}
      <div
        style={{
          ...cardStyle,
          left: 100,
          top: 1000,
          width: 880,
          height: 360,
          padding: "40px 48px",
          opacity: k(t, 10.3, 10.6),
          translate: `0 ${lerp(60, 0, k(t, 10.3, 10.75))}px`,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
        }}
      >
        <div>
          <div style={{ fontFamily: F.mono, fontSize: 24, letterSpacing: "0.14em", color: C.mute }}>NEW LEADS / WEEK</div>
          <div style={{ fontFamily: F.sans, fontWeight: 900, fontSize: 168, letterSpacing: "-0.05em", color: C.ink, lineHeight: 1, marginTop: 18 }}>
            <Count to={48} a={10.66} b={11.5} />
          </div>
          <div
            style={{
              display: "inline-block",
              marginTop: 14,
              padding: "8px 16px",
              borderRadius: 999,
              background: "rgba(215,255,61,0.12)",
              color: C.volt,
              fontFamily: F.mono,
              fontSize: 22,
              letterSpacing: "0.1em",
              opacity: k(t, 11.5, 11.7),
            }}
          >
            ▲ EVERY WEEK
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 14, height: 250 }}>
          {[0.42, 0.48, 0.52, 0.58, 0.63, 0.7, 0.76, 0.84, 0.92, 1].map((h, i) => {
            const p = spr(t, 10.66 + i * 0.07, 14, 200, 0.7);
            return (
              <div
                key={i}
                style={{
                  width: 30,
                  height: 250 * h * p,
                  borderRadius: 8,
                  background: i === 9 ? C.volt : `rgba(215,255,61,${0.22 + i * 0.05})`,
                }}
              />
            );
          })}
        </div>
      </div>
    </Cutaway>
  );
};
