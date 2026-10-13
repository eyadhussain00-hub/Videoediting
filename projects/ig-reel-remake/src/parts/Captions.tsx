import { useCurrentFrame, useVideoConfig } from "remotion";
import words from "../words.json";
import { B, ramp } from "../beats";
import { C, SANS, SERIF } from "../theme";

type W = { w: string; s: number; e: number };

// Words that switch to the serif italic accent.
const KEY = new Set([
  "agree", "disagree", "irrelevant", "views", "buying", "three", "relevant", "simplistic", "dummies", "pain",
  "action", "trust", "money", "know", "like", "human", "passionate", "knowledge", "robot", "life", "expose",
  "connect", "beliefs", "bond", "emotion", "relate", "clone",
]);
const norm = (w: string) => w.toLowerCase().replace(/[^a-z']/g, "");

// Group into 1–3 words: break after punctuation, before a keyword, or at ~16 characters.
const groups: W[][] = [];
{
  let cur: W[] = [];
  for (const w of words as W[]) {
    const len = cur.reduce((n, x) => n + x.w.length + 1, 0);
    if (cur.length && (cur.length >= 3 || len + w.w.length > 16 || KEY.has(norm(w.w)))) {
      groups.push(cur);
      cur = [];
    }
    cur.push(w);
    if (/[.,?!]$/.test(w.w) || KEY.has(norm(w.w))) {
      groups.push(cur);
      cur = [];
    }
  }
  if (cur.length) groups.push(cur);
}

// Captions are hidden while a graphic already carries the words (question cards, end card).
const HIDE: [number, number][] = [
  [B.q1 - 0.05, B.expose - 0.1],
  [59.2, 99],
];

export const Captions = () => {
  const t = useCurrentFrame() / useVideoConfig().fps;
  if (HIDE.some(([a, b]) => t >= a && t < b)) return null;
  const i = groups.findIndex((g, k) => t >= g[0].s && t < (groups[k + 1]?.[0].s ?? g[g.length - 1].e + 0.4));
  if (i < 0) return null;
  const g = groups[i];
  const k = ramp(t, g[0].s, 0.16);
  return (
    <div
      style={{
        position: "absolute",
        left: 60,
        right: 60,
        top: 1000,
        display: "flex",
        justifyContent: "center",
        alignItems: "baseline",
        gap: 18,
        opacity: k,
        transform: `translateY(${(1 - k) * 18}px) scale(${0.94 + 0.06 * k})`,
        filter: `blur(${(1 - k) * 8}px)`,
      }}
    >
      {g.map((w, j) => {
        const key = KEY.has(norm(w.w));
        const on = t >= w.s - 0.02;
        return (
          <span
            key={j}
            style={{
              fontFamily: key ? SERIF : SANS,
              fontStyle: key ? "italic" : "normal",
              fontWeight: key ? 400 : 700,
              fontSize: key ? 92 : 66,
              letterSpacing: key ? "-0.01em" : "-0.025em",
              color: key ? C.accent : C.paper,
              opacity: on ? 1 : 0.35,
              textShadow: "0 4px 18px rgba(0,0,0,0.55), 0 1px 3px rgba(0,0,0,0.5)",
              lineHeight: 1,
              whiteSpace: "nowrap",
            }}
          >
            {w.w.replace(/[.,]$/, "")}
          </span>
        );
      })}
    </div>
  );
};
