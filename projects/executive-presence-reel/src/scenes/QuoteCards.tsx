import React from "react";
import { C, P, E, SANS, SERIF, W, glass, goldText, win, wt, clamp01 } from "../theme";

// Three examples of the move, each as a premium card: the quote fills in word by word (karaoke)
// and a small diagram underneath makes the structure of the sentence visible.
type Card = { a: number; b: number; from: number; to: number; gold: number[]; n: string };
const CARDS: Card[] = [
  { a: 9.8, b: 12.5, from: 35, to: 45, gold: [44, 45], n: "01" },   // (skips "you know,")
  { a: 12.55, b: 17.3, from: 47, to: 59, gold: [51, 56], n: "02" },
  { a: 17.3, b: 21.95, from: 61, to: 73, gold: [67, 73], n: "03" },
];
const clean = (s: string) => s.replace(/^[,]/, "");

const Chip: React.FC<{ label: string; mark: "ok" | "q"; p: number; x?: number }> = ({ label, mark, p, x = 0 }) => (
  <div style={{
    display: "flex", alignItems: "center", gap: 14, padding: "12px 22px 12px 14px", borderRadius: 999,
    border: `1.5px solid ${mark === "ok" ? "rgba(233,184,114,0.8)" : "rgba(255,255,255,0.25)"}`,
    background: mark === "ok" ? "rgba(233,184,114,0.12)" : "rgba(255,255,255,0.05)",
    opacity: p, transform: `translateX(${x}px) translateY(${(1 - p) * 16}px) scale(${0.9 + 0.1 * p})`,
  }}>
    <div style={{
      width: 34, height: 34, borderRadius: 17, display: "flex", alignItems: "center", justifyContent: "center",
      background: mark === "ok" ? C.gold : "rgba(255,255,255,0.14)", color: mark === "ok" ? C.ink : C.cream,
      fontFamily: SANS, fontWeight: 800, fontSize: 22,
    }}>{mark === "ok" ? "✓" : "?"}</div>
    <span style={{ fontFamily: SANS, fontWeight: 600, fontSize: 30, color: C.cream, letterSpacing: 0.2 }}>{label}</span>
  </div>
);

const Diagram: React.FC<{ i: number; t: number }> = ({ i, t }) => {
  if (i === 0) {
    const p = P(t, wt(44) - 0.05, 0.45, E.outBack);
    const split = P(t, wt(45), 0.5, E.outCubic);
    return (
      <div style={{ display: "flex", justifyContent: "center", gap: 18 + 60 * split }}>
        <Chip label="Thing one" mark="ok" p={p} />
        <Chip label="Thing two" mark="ok" p={P(t, wt(45) - 0.05, 0.45, E.outBack)} />
      </div>
    );
  }
  const rows = i === 1
    ? [{ l: "Goal · aligned", m: "ok" as const, at: wt(54) }, { l: "Path · uncertain", m: "q" as const, at: wt(59) - 0.1 }]
    : [{ l: "Direction · agreed", m: "ok" as const, at: wt(67) }, { l: "Timing · open", m: "q" as const, at: wt(73) - 0.1 }];
  return (
    <div style={{ display: "flex", justifyContent: "center", gap: 18 }}>
      {rows.map((r, k) => <Chip key={k} label={r.l} mark={r.m} p={P(t, r.at, 0.45, E.outBack)} />)}
    </div>
  );
};

export const QuoteCards: React.FC<{ t: number }> = ({ t }) => {
  const i = CARDS.findIndex((c) => t >= c.a && t < c.b);
  if (i < 0) return null;
  const c = CARDS[i];
  const o = win(t, c.a, c.b, 0.3, 0.22);
  const pin = P(t, c.a, 0.5, E.outExpo);
  const pout = P(t, c.b - 0.22, 0.22, E.inCubic);
  const words = [];
  for (let k = c.from; k <= c.to; k++) words.push(k);
  return (
    <div style={{
      position: "absolute", left: 64, right: 64, top: 1060, borderRadius: 34, padding: "34px 44px 38px", ...glass,
      opacity: o, transform: `translateY(${(1 - pin) * 70 - pout * 40}px) scale(${0.96 + 0.04 * pin})`,
      filter: `blur(${pout * 10}px)`,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
        <span style={{ fontFamily: SANS, fontWeight: 600, fontSize: 22, letterSpacing: "0.24em", color: C.gold }}>
          WHAT IT SOUNDS LIKE
        </span>
        <span style={{ fontFamily: SANS, fontWeight: 500, fontSize: 22, letterSpacing: "0.18em", color: "rgba(244,237,226,0.5)" }}>
          {c.n} / 03
        </span>
      </div>
      <div style={{ height: 1, background: "linear-gradient(90deg, rgba(233,184,114,0.6), rgba(233,184,114,0))", marginBottom: 22 }} />
      <div style={{ fontFamily: SERIF, fontSize: 64, lineHeight: 1.08, color: C.cream, letterSpacing: -0.5, minHeight: 140 }}>
        <span style={{ ...goldText, fontStyle: "italic", fontSize: 80, lineHeight: 0, marginRight: 6 }}>“</span>
        {words.map((k) => {
          const on = P(t, W[k].t - 0.04, 0.18);
          const g = c.gold.includes(k);
          const txt = (k === c.from ? W[k].w.charAt(0).toUpperCase() + W[k].w.slice(1) : clean(W[k].w));
          return (
            <span key={k} style={{
              opacity: 0.22 + 0.78 * on, marginRight: 14, display: "inline-block",
              ...(g ? { ...goldText, fontStyle: "italic" } : {}),
              transform: `translateY(${(1 - on) * 6}px)`,
            }}>{txt}{k === c.to && <span style={{ ...goldText, fontStyle: "italic", opacity: clamp01((t - W[c.to].e) * 4) }}>”</span>}</span>
          );
        })}
      </div>
      <div style={{ marginTop: 26 }}><Diagram i={i} t={t} /></div>
    </div>
  );
};
