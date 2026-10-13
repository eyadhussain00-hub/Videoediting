import React, { useMemo } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { F, k, lerp, rng, spr, useReel, useT } from "./theme";

const pill: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 16,
  padding: "16px 30px",
  borderRadius: 999,
  background: "rgba(7,7,11,0.55)",
  backdropFilter: "blur(16px)",
  boxShadow: "inset 0 0 0 1.5px rgba(255,255,255,0.16)",
};

/** The hook tag over the first seconds. */
export const HookTag: React.FC = () => {
  const t = useT();
  const { hook, theme: C } = useReel();
  if (!hook.tag || t > hook.until + 0.1) return null;
  const p = spr(t, 0.35, 14, 200, 0.7);
  const q = k(t, hook.until - 0.3, hook.until);
  return (
    <div style={{ position: "absolute", top: hook.y, left: 0, right: 0, display: "flex", justifyContent: "center", opacity: Math.min(1, p * 1.4) * (1 - q), translate: `0 ${lerp(-30, 0, p)}px` }}>
      <div style={pill}>
        <div style={{ width: 12, height: 12, borderRadius: 6, background: C.accent, boxShadow: `0 0 16px ${C.accent}` }} />
        <span style={{ fontFamily: F.mono, fontWeight: 500, fontSize: 28, letterSpacing: "0.16em", color: C.ink }}>{hook.tag}</span>
      </div>
    </div>
  );
};

/** Name and role, for a few seconds after the hook. */
export const SpeakerChip: React.FC = () => {
  const t = useT();
  const { speaker, hook, theme: C } = useReel();
  if (!speaker) return null;
  const a = hook.until + 0.2;
  const b = a + 2.8;
  if (t < a || t > b) return null;
  const p = spr(t, a, 14, 200, 0.7);
  const q = k(t, b - 0.3, b);
  return (
    <div style={{ position: "absolute", top: hook.y, left: 0, right: 0, display: "flex", justifyContent: "center", opacity: Math.min(1, p * 1.4) * (1 - q), translate: `0 ${lerp(-20, 0, p)}px` }}>
      <div style={pill}>
        <div style={{ width: 12, height: 12, borderRadius: 6, background: C.accent }} />
        <span style={{ fontFamily: F.sans, fontWeight: 700, fontSize: 30, color: C.ink }}>{speaker.name}</span>
        {speaker.role && <span style={{ fontFamily: F.mono, fontSize: 20, letterSpacing: "0.14em", color: C.mute }}>{speaker.role.toUpperCase()}</span>}
      </div>
    </div>
  );
};

/** One mark per chapter card under the captions, filling as the film goes. */
export const ChapterRail: React.FC = () => {
  const t = useT();
  const { cards, chapters, end, captions, theme: C } = useReel();
  if (!chapters || cards.length < 2) return null;
  const start = cards[0].from - 2;
  if (t < start || t >= end.from || cards.some((c) => t >= c.from - 0.05 && t < c.to + 0.05)) return null;
  return (
    <div style={{ position: "absolute", left: 140, right: 140, top: captions.y + 170, display: "flex", gap: 18 }}>
      {cards.map((c, i) => {
        const b = cards[i + 1]?.from ?? end.from;
        const appear = spr(t, start + i * 0.18, 14, 220, 0.7);
        const fill = k(t, c.from, b, (x) => x);
        const cur = t >= c.from && t < b;
        return (
          <div key={c.n} style={{ flex: 1, opacity: Math.min(1, appear * 1.4), translate: `0 ${lerp(20, 0, appear)}px` }}>
            <div style={{ height: 5, borderRadius: 3, background: "rgba(255,255,255,0.14)" }}>
              <div style={{ height: 5, borderRadius: 3, width: `${fill * 100}%`, background: C.accent }} />
            </div>
            <div style={{ marginTop: 12, fontFamily: F.mono, fontSize: 21, letterSpacing: "0.14em", color: cur ? C.accent : C.mute, whiteSpace: "nowrap", overflow: "hidden" }}>
              {c.n} {c.lines.map((l) => l.text).join(" ").replace(/[.,!?]/g, "").toUpperCase()}
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
      {tile && <AbsoluteFill style={{ backgroundImage: `url(${tile})`, backgroundSize: "256px 256px", opacity: 0.055, mixBlendMode: "overlay" }} />}
      <AbsoluteFill style={{ background: "radial-gradient(ellipse 85% 70% at 50% 45%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.42) 100%)" }} />
    </>
  );
};
