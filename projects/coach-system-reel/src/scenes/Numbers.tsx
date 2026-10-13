import React from "react";
import { C, F, ease, k, lerp, useT } from "../theme";
import { Count, Cutaway, Kicker, cardStyle } from "../ui";
import TL from "../timeline.json";

const [A, B] = TL.scenes.numbers;
const SNAP = 30.22; // "precise"

// 8 weeks of revenue, the real curve; the rough one is the same data seen through fog
const PTS = [0.22, 0.3, 0.27, 0.42, 0.48, 0.45, 0.63, 0.78];
const CW = 760, CH = 360;

function path(t: number, sharp: number) {
  return PTS.map((v, i) => {
    const wob = (1 - sharp) * (Math.sin(t * 7 + i * 1.7) * 0.08 + Math.sin(t * 3.1 + i) * 0.05);
    const x = (i / (PTS.length - 1)) * CW;
    const y = CH - (v + wob) * CH;
    return `${i ? "L" : "M"} ${x.toFixed(1)} ${y.toFixed(1)}`;
  }).join(" ");
}

const KPIS = [
  { label: "LEADS", to: 128, fmt: (n: number) => String(Math.round(n)) },
  { label: "CALLS BOOKED", to: 34, fmt: (n: number) => String(Math.round(n)) },
  { label: "CLOSE RATE", to: 29, fmt: (n: number) => `${Math.round(n)}%` },
  { label: "COST / CLIENT", to: 41, fmt: (n: number) => `$${Math.round(n)}` },
];

export const Numbers: React.FC = () => {
  const t = useT();
  const sharp = k(t, SNAP - 0.05, SNAP + 0.2, ease.out);
  const draw = k(t, 26.75, 27.6, ease.inOut);
  const scan = k(t, SNAP - 0.05, SNAP + 0.35, ease.inOut);

  return (
    <Cutaway from={A} to={B}>
      <Kicker text="02 · KNOW YOUR NUMBERS" at={A + 0.05} />

      <div style={{ ...cardStyle, left: 100, top: 340, width: 880, height: 640, padding: "40px 60px", overflow: "hidden" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontFamily: F.mono, fontSize: 24, letterSpacing: "0.14em", color: C.mute }}>REVENUE · 8 WEEKS</div>
          <div style={{ position: "relative", height: 48, width: 300 }}>
            <div
              style={{
                position: "absolute",
                right: 0,
                padding: "8px 18px",
                borderRadius: 999,
                fontFamily: F.mono,
                fontSize: 22,
                letterSpacing: "0.12em",
                color: C.ink,
                background: "rgba(255,255,255,0.08)",
                opacity: k(t, 27.32, 27.6) * (1 - sharp),
              }}
            >
              ≈ ROUGH IDEA
            </div>
            <div
              style={{
                position: "absolute",
                right: 0,
                padding: "8px 18px",
                borderRadius: 999,
                fontFamily: F.mono,
                fontSize: 22,
                letterSpacing: "0.12em",
                color: C.bg,
                background: C.volt,
                opacity: sharp,
                scale: String(lerp(1.3, 1, sharp)),
              }}
            >
              ▲ +38% · PRECISE
            </div>
          </div>
        </div>

        <div style={{ position: "relative", marginTop: 60, filter: `blur(${lerp(16, 0, sharp)}px)`, opacity: lerp(0.55, 1, sharp) }}>
          <svg width={CW} height={CH + 60} style={{ overflow: "visible" }}>
            {[0, 0.25, 0.5, 0.75, 1].map((g) => (
              <line key={g} x1={0} x2={CW} y1={CH * g} y2={CH * g} stroke="rgba(255,255,255,0.08)" strokeWidth={1.5} />
            ))}
            <path d={`${path(t, sharp)} L ${CW} ${CH} L 0 ${CH} Z`} fill="url(#fill)" opacity={sharp} />
            <defs>
              <linearGradient id="fill" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0" stopColor={C.volt} stopOpacity="0.28" />
                <stop offset="1" stopColor={C.volt} stopOpacity="0" />
              </linearGradient>
            </defs>
            <path
              d={path(t, sharp)}
              fill="none"
              stroke={sharp > 0.5 ? C.volt : C.ink}
              strokeWidth={sharp > 0.5 ? 7 : 10}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray={1400}
              strokeDashoffset={1400 * (1 - draw)}
            />
            {PTS.map((v, i) => (
              <circle key={i} cx={(i / (PTS.length - 1)) * CW} cy={CH - v * CH} r={11} fill={C.bg} stroke={C.volt} strokeWidth={5} opacity={k(t, SNAP + 0.05 + i * 0.03, SNAP + 0.2 + i * 0.03)} />
            ))}
            {PTS.map((_, i) => (
              <text key={i} x={(i / (PTS.length - 1)) * CW} y={CH + 52} fill={C.mute} fontFamily="JetBrains Mono" fontSize={22} textAnchor="middle" opacity={sharp}>
                W{i + 1}
              </text>
            ))}
          </svg>
          {/* question marks in the fog */}
          {[[120, 80], [420, 160], [640, 40]].map(([x, y], i) => (
            <div key={i} style={{ position: "absolute", left: x, top: y, fontFamily: F.serif, fontStyle: "italic", fontSize: 120, color: C.ink, opacity: (1 - sharp) * 0.6 * k(t, 27.4 + i * 0.25, 27.8 + i * 0.25), translate: `0 ${Math.sin(t * 2 + i) * 10}px` }}>
              ?
            </div>
          ))}
        </div>
        {/* the scan that brings it into focus */}
        {scan > 0 && scan < 1 && (
          <div style={{ position: "absolute", top: 0, bottom: 0, left: lerp(-80, 960, scan), width: 80, background: "linear-gradient(90deg, rgba(215,255,61,0), rgba(215,255,61,0.35), rgba(215,255,61,0))" }} />
        )}
      </div>

      <div style={{ position: "absolute", left: 100, top: 1020, width: 880, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        {KPIS.map((kp, i) => {
          const on = k(t, SNAP + 0.1 + i * 0.08, SNAP + 0.4 + i * 0.08);
          return (
            <div key={kp.label} style={{ ...cardStyle, position: "relative", height: 150, padding: "26px 32px", opacity: k(t, 26.8 + i * 0.08, 27.2 + i * 0.08) }}>
              <div style={{ fontFamily: F.mono, fontSize: 21, letterSpacing: "0.14em", color: C.mute }}>{kp.label}</div>
              <div style={{ position: "relative", height: 76, marginTop: 6 }}>
                <div style={{ position: "absolute", fontFamily: F.sans, fontWeight: 800, fontSize: 70, color: C.dim, filter: "blur(6px)", opacity: 1 - on }}>??</div>
                <div style={{ position: "absolute", fontFamily: F.sans, fontWeight: 800, fontSize: 70, letterSpacing: "-0.03em", color: i === 2 ? C.volt : C.ink, opacity: on }}>
                  <Count to={kp.to} a={SNAP + 0.1 + i * 0.08} b={SNAP + 0.9} fmt={kp.fmt} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Cutaway>
  );
};
