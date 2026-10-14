import React, { useMemo } from "react";
import { AbsoluteFill } from "remotion";
import { F, k, lerp, spr, useReel, useT } from "./theme";
import type { Word } from "./types";

type Page = { start: number; end: number; words: number[] };

const bare = (w: string) => w.toLowerCase().replace(/[^\p{L}\p{N}$%']/gu, "");

// Up to maxWords words or ~maxChars characters a page; a pause or a full stop always starts a new one.
function paginate(words: Word[], maxWords: number, maxChars: number): Page[] {
  const pages: Page[] = [];
  let cur: number[] = [];
  const flush = () => {
    if (cur.length) pages.push({ start: words[cur[0]][1], end: words[cur[cur.length - 1]][2], words: cur });
    cur = [];
  };
  words.forEach(([w, s], i) => {
    const prev = words[i - 1];
    const chars = cur.reduce((n, j) => n + words[j][0].length + 1, 0) + w.length;
    if (cur.length && (s - prev[2] > 0.28 || /[.?!,]$/.test(prev[0]) || cur.length >= maxWords || chars > maxChars)) flush();
    cur.push(i);
  });
  flush();
  // each page holds until the next one starts (or a short tail after a long pause)
  pages.forEach((p, i) => {
    const next = pages[i + 1];
    p.end = next ? Math.min(next.start, p.end + 0.6) : p.end + 0.5;
  });
  return pages;
}

export const Captions: React.FC = () => {
  const t = useT();
  const P = useReel();
  const pages = useMemo(() => paginate(P.words, P.captions.maxWords, P.captions.maxChars), [P]);
  const emph = useMemo(() => new Set(P.emphasis.map(bare)), [P]);

  const page = pages.find((p) => t >= p.start - 0.06 && t < p.end);
  if (!page || t >= P.end.from) return null;
  if (P.cards.some((c) => t >= c.from && t < c.to)) return null;
  const out = k(t, page.end - 0.1, page.end);
  const C = P.theme;

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div
        style={{
          position: "absolute",
          left: 70,
          right: 70,
          top: P.captions.y,
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
          const [w, s, e] = P.words[i];
          const em = emph.has(bare(w));
          const pop = spr(t, s - 0.05, 13, 260, 0.6);
          const active = t >= s - 0.05 && t < e + 0.08;
          const shown = t >= s - 0.05;
          return (
            <span
              key={i}
              style={{
                fontFamily: em ? F.serif : F.sans,
                fontStyle: em ? "italic" : "normal",
                fontWeight: em ? 400 : 800,
                fontSize: em ? 96 : 74,
                letterSpacing: em ? "-0.01em" : "-0.025em",
                lineHeight: 1.05,
                color: em ? C.accent : C.ink,
                opacity: shown ? Math.min(1, pop * 1.4) : 0,
                translate: `0 ${lerp(26, 0, pop)}px`,
                scale: String(shown ? lerp(0.86, 1, pop) * (active && !em ? 1.04 : 1) : 0.86),
                textShadow: "0 4px 24px rgba(0,0,0,0.65), 0 2px 6px rgba(0,0,0,0.5)",
                filter: active || em ? "none" : "brightness(0.92)",
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
