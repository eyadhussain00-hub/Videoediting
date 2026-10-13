import React, { useMemo } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { C, F, k, lerp, rng, spr, useT } from "./theme";
import TL from "./timeline.json";

const S = TL.scenes;
const fullFootage = (t: number) =>
  ![S.oldWay, S.system, S.card1, S.niche, S.card2, S.numbers, S.split, S.card3, S.funnel, S.end].some(
    ([a, b]) => t >= a - 0.05 && t < b + 0.05,
  );

/** The hook tag over the first seconds. */
export const HookTag: React.FC = () => {
  const t = useT();
  if (t > 4.5) return null;
  const p = spr(t, 0.35, 14, 200, 0.7);
  const q = k(t, 4.1, 4.4);
  return (
    <div style={{ position: "absolute", top: 210, left: 0, right: 0, display: "flex", justifyContent: "center", opacity: Math.min(1, p * 1.4) * (1 - q), translate: `0 ${lerp(-30, 0, p)}px` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "16px 30px", borderRadius: 999, background: "rgba(7,7,11,0.55)", backdropFilter: "blur(16px)", boxShadow: "inset 0 0 0 1.5px rgba(255,255,255,0.16)" }}>
        <div style={{ width: 12, height: 12, borderRadius: 6, background: C.volt, boxShadow: `0 0 16px ${C.volt}` }} />
        <span style={{ fontFamily: F.mono, fontWeight: 500, fontSize: 28, letterSpacing: "0.16em", color: C.ink }}>FOR ONLINE FITNESS COACHES</span>
      </div>
    </div>
  );
};

/** Three chapter marks on the black band under his face, filling as the film goes. */
const CHAPTERS = [
  { label: "NICHE", a: S.card1[0], b: S.card2[0] },
  { label: "NUMBERS", a: S.card2[0], b: S.card3[0] },
  { label: "FUNNEL", a: S.card3[0], b: S.end[0] },
];
export const ChapterRail: React.FC = () => {
  const t = useT();
  if (t < 12.8 || t > S.end[0]) return null;
  const vis = fullFootage(t) ? 1 : 0;
  if (!vis) return null;
  return (
    <div style={{ position: "absolute", left: 140, right: 140, top: 1560, display: "flex", gap: 18 }}>
      {CHAPTERS.map((c, i) => {
        const appear = spr(t, 13.42 + i * 0.18, 14, 220, 0.7);
        const fill = k(t, c.a, c.b, (x) => x);
        const cur = t >= c.a && t < c.b;
        return (
          <div key={c.label} style={{ flex: 1, opacity: Math.min(1, appear * 1.4), translate: `0 ${lerp(20, 0, appear)}px` }}>
            <div style={{ height: 5, borderRadius: 3, background: "rgba(255,255,255,0.14)" }}>
              <div style={{ height: 5, borderRadius: 3, width: `${fill * 100}%`, background: C.volt }} />
            </div>
            <div style={{ marginTop: 12, fontFamily: F.mono, fontSize: 21, letterSpacing: "0.14em", color: cur ? C.volt : C.mute }}>
              0{i + 1} {c.label}
            </div>
          </div>
        );
      })}
    </div>
  );
};

/** Film grain (four seeded tiles, cycled) and a soft vignette. */
export const Finish: React.FC = () => {
  const frame = useCurrentFrame();
  const tiles = useMemo(() => {
    if (typeof document === "undefined") return [];
    return [1, 2, 3, 4].map((seed) => {
      const cv = document.createElement("canvas");
      cv.width = cv.height = 256;
      const g = cv.getContext("2d")!;
      const img = g.createImageData(256, 256);
      const r = rng(seed * 97);
      for (let i = 0; i < img.data.length; i += 4) {
        const v = r() * 255;
        img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
        img.data[i + 3] = 255;
      }
      g.putImageData(img, 0, 0);
      return cv.toDataURL("image/png");
    });
  }, []);
  const tile = tiles[frame % 4];
  return (
    <>
      {tile && (
        <AbsoluteFill style={{ backgroundImage: `url(${tile})`, backgroundSize: "256px 256px", opacity: 0.055, mixBlendMode: "overlay" }} />
      )}
      <AbsoluteFill style={{ background: "radial-gradient(ellipse 85% 70% at 50% 45%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.42) 100%)" }} />
    </>
  );
};
