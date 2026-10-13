import React from "react";
import { C, F, k, lerp, rng, spr, useT } from "../theme";
import { Cutaway, Kicker, cardStyle } from "../ui";
import TL from "../timeline.json";

const [A, B] = TL.scenes.funnel;
const TIERS = [
  { top: 920, bot: 760, y: 360, title: "Run ads", tag: "REACH", at: 44.32 },
  { top: 740, bot: 580, y: 590, title: "Nurture on Instagram", tag: "DMS · STORIES", at: 45.26 },
  { top: 560, bot: 400, y: 820, title: "Close", tag: "BOOKED CALL", at: 47.28 },
];
const TH = 200;

// prospects: each one drops in from the top and gets as far as its luck allows
const R = rng(42);
const DROPS = Array.from({ length: 46 }, (_, i) => ({
  t0: 44.35 + i * 0.075,
  x: (R() - 0.5) * 700,
  depth: i % 7 === 3 ? 3 : i % 3 === 0 ? 2 : 1, // how many tiers it passes
  side: R() > 0.5 ? 1 : -1,
}));
const FALL = 700; // px / s

export const Funnel: React.FC = () => {
  const t = useT();
  const won = spr(t, 47.5, 13, 170, 0.8);

  return (
    <Cutaway from={A} to={B}>
      <Kicker text="03 · THE SOCIAL FUNNEL" at={A + 0.05} />

      {TIERS.map((tr, i) => {
        const p = spr(t, A + 0.05 + i * 0.08, 15, 180, 0.8);
        const on = k(t, tr.at - 0.04, tr.at + 0.12);
        const inset = (tr.top - tr.bot) / 2;
        return (
          <div
            key={tr.title}
            style={{
              position: "absolute",
              left: 540 - tr.top / 2,
              top: tr.y,
              width: tr.top,
              height: TH,
              clipPath: `polygon(0 0, 100% 0, ${tr.top - inset}px 100%, ${inset}px 100%)`,
              background: on > 0 ? `rgba(215,255,61,${0.12 + on * 0.88})` : "rgba(255,255,255,0.06)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              opacity: Math.min(1, p * 1.5),
              translate: `0 ${lerp(60, 0, p)}px`,
              scale: String(1 + (spr(t, tr.at, 9, 260, 0.6) - k(t, tr.at, tr.at + 0.6)) * 0.04 * (t > tr.at ? 1 : 0)),
            }}
          >
            <span style={{ fontFamily: F.mono, fontWeight: 700, fontSize: 22, letterSpacing: "0.16em", color: on > 0.5 ? C.bg : C.mute }}>
              0{i + 1} · {tr.tag}
            </span>
            <span style={{ fontFamily: F.sans, fontWeight: 800, fontSize: i === 1 ? 52 : 66, letterSpacing: "-0.035em", color: on > 0.5 ? C.bg : C.ink }}>{tr.title}</span>
          </div>
        );
      })}

      {/* prospects */}
      {DROPS.map((d, i) => {
        if (t < d.t0) return null;
        const y0 = 300;
        const y = y0 + (t - d.t0) * FALL;
        const stop = d.depth === 3 ? 1100 : TIERS[d.depth].y; // where it leaves the funnel
        // narrow with the funnel as it falls
        const w = y < 360 ? 920 : y > 1020 ? 400 : lerp(920, 400, (y - 360) / 660);
        const x = 540 + (d.x / 700) * (w - 120);
        const out = Math.max(0, y - stop);
        const alive = d.depth === 3 ? Math.max(0, 1 - out / 60) : Math.max(0, 1 - out / 120);
        if (alive <= 0) return null;
        const dx = d.depth === 3 ? (540 - x) * Math.min(1, out / 60) : d.side * out * 1.6;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x + dx - 9,
              top: Math.min(y, stop + (d.depth === 3 ? out * 0.5 : out * 0.4)) - 9,
              width: 18,
              height: 18,
              borderRadius: 9,
              background: d.depth === 3 ? C.volt : C.ink,
              opacity: alive * (d.depth === 3 ? 1 : 0.75),
              boxShadow: d.depth === 3 ? `0 0 18px ${C.volt}` : "none",
              mixBlendMode: "difference",
            }}
          />
        );
      })}

      {/* the result */}
      <div
        style={{
          ...cardStyle,
          left: 190,
          top: 1110,
          width: 700,
          height: 170,
          padding: "0 34px",
          display: "flex",
          alignItems: "center",
          gap: 26,
          background: "rgba(18,18,24,0.95)",
          opacity: t >= 47.5 ? Math.min(1, won * 1.5) : 0,
          translate: `0 ${lerp(70, 0, won)}px`,
          scale: String(lerp(0.9, 1, won)),
        }}
      >
        <div style={{ width: 96, height: 96, borderRadius: 28, background: C.volt, display: "grid", placeItems: "center", boxShadow: "0 0 40px rgba(215,255,61,0.45)" }}>
          <svg width={50} height={50} viewBox="0 0 30 30">
            <path d="M6 15 L12.5 21.5 L24 9" stroke={C.bg} strokeWidth={4} fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div>
          <div style={{ fontFamily: F.mono, fontSize: 22, letterSpacing: "0.14em", color: C.mute }}>JUST NOW</div>
          <div style={{ fontFamily: F.sans, fontWeight: 800, fontSize: 50, color: C.ink, letterSpacing: "-0.02em", marginTop: 4 }}>New client signed</div>
        </div>
      </div>
    </Cutaway>
  );
};
