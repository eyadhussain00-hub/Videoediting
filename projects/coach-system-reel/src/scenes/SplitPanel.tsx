import React from "react";
import { AbsoluteFill } from "remotion";
import { C, F, ease, k, lerp, spr, useT } from "../theme";
import { Count, Ground, cardStyle } from "../ui";
import { splitAmount } from "../Footage";
import TL from "../timeline.json";

const [A, B] = TL.scenes.split;
const SWAP = 37.45; // "Same with onboarding…"
const ROWS = [
  { label: "Instagram content", v: 46, at: 33.7, good: true },
  { label: "Referrals", v: 24, at: 33.9, good: true },
  { label: "Paid ads", v: 18, at: 34.1, good: true },
  { label: "No-show calls", v: 31, at: 35.96, good: false },
];
const CHECKS = [
  { label: "Welcome call", at: 38.05 },
  { label: "Training plan", at: 38.3 },
  { label: "Check-in app", at: 38.55 },
];

const Working: React.FC = () => {
  const t = useT();
  const out = k(t, SWAP - 0.1, SWAP + 0.2, ease.in);
  return (
    <div style={{ position: "absolute", left: 100, top: 1100, width: 880, opacity: (1 - out) * k(t, A + 0.4, A + 0.8), translate: `0 ${lerp(0, -40, out)}px`, filter: `blur(${out * 10}px)` }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontFamily: F.mono, fontSize: 24, letterSpacing: "0.14em", marginBottom: 22 }}>
        <span style={{ color: C.ink }}>WHERE CLIENTS COME FROM</span>
        <span style={{ color: C.mute }}>30 DAYS</span>
      </div>
      {ROWS.map((r) => {
        const p = spr(t, r.at, 16, 150, 0.8);
        const shake = r.good ? 0 : Math.sin((t - r.at) * 80) * 10 * Math.max(0, 1 - (t - r.at) / 0.35) * (t > r.at ? 1 : 0);
        const col = r.good ? C.volt : C.red;
        return (
          <div key={r.label} style={{ ...cardStyle, position: "relative", height: 96, marginBottom: 14, padding: "0 30px", display: "flex", alignItems: "center", gap: 24, opacity: t >= r.at - 0.05 ? Math.min(1, p * 1.5) : 0.18, translate: `${shake}px 0`, boxShadow: !r.good && t > r.at ? `inset 0 0 0 2px ${C.red}, 0 0 40px rgba(255,82,71,0.25)` : cardStyle.boxShadow }}>
            <span style={{ width: 330, fontFamily: F.sans, fontWeight: 700, fontSize: 38, color: C.ink, letterSpacing: "-0.02em" }}>{r.label}</span>
            <div style={{ flex: 1, height: 14, borderRadius: 7, background: "rgba(255,255,255,0.07)" }}>
              <div style={{ height: 14, borderRadius: 7, width: `${(r.v / 50) * 100 * p}%`, background: col, boxShadow: `0 0 20px ${col}` }} />
            </div>
            <span style={{ width: 130, textAlign: "right", fontFamily: F.mono, fontWeight: 700, fontSize: 32, color: col }}>
              {r.good ? "▲" : "▼"} <Count to={r.v} a={r.at} b={r.at + 0.5} />%
            </span>
          </div>
        );
      })}
    </div>
  );
};

const Ring: React.FC = () => {
  const t = useT();
  const p = k(t, 39.38, 40.1, ease.inOut);
  const R = 120, L = 2 * Math.PI * R;
  return (
    <svg width={300} height={300} viewBox="0 0 300 300">
      <circle cx={150} cy={150} r={R} stroke="rgba(255,255,255,0.08)" strokeWidth={22} fill="none" />
      <circle cx={150} cy={150} r={R} stroke={C.volt} strokeWidth={22} fill="none" strokeLinecap="round" strokeDasharray={L} strokeDashoffset={L * (1 - 0.92 * p)} transform="rotate(-90 150 150)" style={{ filter: `drop-shadow(0 0 14px rgba(215,255,61,0.6))` }} />
      <text x={150} y={168} textAnchor="middle" fill={C.ink} fontFamily="Inter Tight" fontWeight={900} fontSize={70} letterSpacing="-2">
        {Math.round(92 * p)}%
      </text>
    </svg>
  );
};

const Keep: React.FC = () => {
  const t = useT();
  const inP = k(t, SWAP, SWAP + 0.4);
  return (
    <div style={{ position: "absolute", left: 100, top: 1100, width: 880, display: "flex", gap: 20, opacity: inP, translate: `0 ${lerp(50, 0, inP)}px` }}>
      <div style={{ ...cardStyle, position: "relative", flex: 1.1, height: 460, padding: "34px 34px" }}>
        <div style={{ fontFamily: F.mono, fontSize: 22, letterSpacing: "0.14em", color: C.mute }}>ONBOARDING</div>
        {CHECKS.map((c) => {
          const p = spr(t, c.at, 12, 260, 0.6);
          const on = t >= c.at;
          return (
            <div key={c.label} style={{ display: "flex", alignItems: "center", gap: 20, marginTop: 34 }}>
              <div style={{ width: 54, height: 54, borderRadius: 16, display: "grid", placeItems: "center", background: on ? C.volt : "transparent", boxShadow: on ? "0 0 26px rgba(215,255,61,0.5)" : "inset 0 0 0 2px rgba(255,255,255,0.2)", scale: String(on ? lerp(0.6, 1, p) : 1) }}>
                {on && (
                  <svg width={30} height={30} viewBox="0 0 30 30">
                    <path d="M6 15 L12.5 21.5 L24 9" stroke={C.bg} strokeWidth={4.5} fill="none" strokeLinecap="round" strokeLinejoin="round" strokeDasharray={30} strokeDashoffset={30 * (1 - k(t, c.at, c.at + 0.18))} />
                  </svg>
                )}
              </div>
              <span style={{ fontFamily: F.sans, fontWeight: 700, fontSize: 38, color: on ? C.ink : C.mute }}>{c.label}</span>
            </div>
          );
        })}
      </div>
      <div style={{ ...cardStyle, position: "relative", flex: 1, height: 460, padding: "34px 30px", display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div style={{ alignSelf: "flex-start", fontFamily: F.mono, fontSize: 22, letterSpacing: "0.14em", color: C.mute }}>CLIENT RETENTION</div>
        <div style={{ marginTop: 22 }}>
          <Ring />
        </div>
        <div style={{ fontFamily: F.mono, fontSize: 20, letterSpacing: "0.12em", color: C.volt, opacity: k(t, 40.0, 40.2) }}>▲ STAY 6+ MONTHS</div>
      </div>
    </div>
  );
};

/** The graphics half of the split layout: the ground shows around the footage window. */
export const SplitGround: React.FC = () => {
  const t = useT();
  const m = splitAmount(t);
  if (m <= 0) return null;
  return (
    <AbsoluteFill style={{ opacity: m }}>
      <Ground />
    </AbsoluteFill>
  );
};

export const SplitPanel: React.FC = () => {
  const t = useT();
  if (t < A || t > B) return null;
  const fadeOut = 1 - k(t, B - 0.2, B, ease.in);
  return (
    <AbsoluteFill style={{ opacity: fadeOut }}>
      <Working />
      {t >= SWAP && <Keep />}
    </AbsoluteFill>
  );
};
