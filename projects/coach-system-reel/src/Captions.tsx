import React from "react";
import { AbsoluteFill } from "remotion";
import { WORDS } from "./transcript";
import { C, F, k, lerp, spr, useT } from "./theme";
import TL from "./timeline.json";

// Words set in the serif italic, in volt: the ones the argument hangs on.
const EMPHASIS = new Set([
  "income", "system", "consistent", "specific", "everyone", "no", "one.", "precise",
  "harming", "retention.", "Instagram", "close",
]);
// "no one" is one idea: keep both words styled together.
const isEmph = (i: number) => {
  const w = WORDS[i][0].replace(/[,?]/g, "");
  if (w === "no") return WORDS[i + 1]?.[0] === "one.";
  if (w === "one.") return WORDS[i - 1]?.[0] === "no";
  return EMPHASIS.has(w);
};

type Page = { start: number; end: number; words: number[] };

// Up to three words or ~17 characters a page; a pause or a full stop always starts a new one.
const PAGES: Page[] = (() => {
  const pages: Page[] = [];
  let cur: number[] = [];
  const flush = () => {
    if (cur.length) pages.push({ start: WORDS[cur[0]][1], end: WORDS[cur[cur.length - 1]][2], words: cur });
    cur = [];
  };
  WORDS.forEach(([w, s], i) => {
    const prev = WORDS[i - 1];
    const chars = cur.reduce((n, j) => n + WORDS[j][0].length + 1, 0) + w.length;
    if (cur.length && (s - prev[2] > 0.28 || /[.?,]$/.test(prev[0]) || cur.length >= 3 || chars > 17)) flush();
    cur.push(i);
  });
  flush();
  // each page holds until the next one starts (or a short tail after a long pause)
  pages.forEach((p, i) => {
    const next = pages[i + 1];
    p.end = next ? Math.min(next.start, p.end + 0.6) : p.end + 0.5;
  });
  return pages;
})();

const S = TL.scenes;
const inside = (t: number, [a, b]: number[]) => t >= a && t < b;

// Where the captions sit: over the face, between the split windows, or under a graphic.
function slot(t: number) {
  if (inside(t, S.card1) || inside(t, S.card2) || inside(t, S.card3) || t >= S.end[0]) return null;
  if (inside(t, S.split)) return 1012;
  if ([S.oldWay, S.system, S.niche, S.numbers, S.funnel].some((r) => inside(t, r))) return 1500;
  return 1385;
}

export const Captions: React.FC = () => {
  const t = useT();
  const page = PAGES.find((p) => t >= p.start - 0.06 && t < p.end);
  if (!page) return null;
  const y = slot(page.start + 0.01) ?? null;
  if (y === null || slot(t) === null) return null;
  const out = k(t, page.end - 0.1, page.end);

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div
        style={{
          position: "absolute",
          left: 70,
          right: 70,
          top: y,
          translate: "0 -50%",
          display: "flex",
          justifyContent: "center",
          alignItems: "baseline",
          flexWrap: "wrap",
          columnGap: 20,
          opacity: 1 - out,
        }}
      >
        {page.words.map((i) => {
          const [w, s, e] = WORDS[i];
          const emph = isEmph(i);
          const pop = spr(t, s - 0.05, 13, 260, 0.6);
          const active = t >= s - 0.05 && t < e + 0.08;
          const shown = t >= s - 0.05;
          return (
            <span
              key={i}
              style={{
                fontFamily: emph ? F.serif : F.sans,
                fontStyle: emph ? "italic" : "normal",
                fontWeight: emph ? 400 : 800,
                fontSize: emph ? 96 : 74,
                letterSpacing: emph ? "-0.01em" : "-0.025em",
                lineHeight: 1.05,
                color: emph ? C.volt : C.ink,
                opacity: shown ? Math.min(1, pop * 1.4) : 0,
                translate: `0 ${lerp(26, 0, pop)}px`,
                scale: String(shown ? lerp(0.86, 1, pop) * (active && !emph ? 1.04 : 1) : 0.86),
                textShadow: "0 4px 24px rgba(0,0,0,0.65), 0 2px 6px rgba(0,0,0,0.5)",
                filter: active || emph ? "none" : "brightness(0.92)",
              }}
            >
              {w}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
