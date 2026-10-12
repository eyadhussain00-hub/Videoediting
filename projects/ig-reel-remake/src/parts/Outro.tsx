import { AbsoluteFill, Img, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { B, TALK_END, easeIO, lerp, ramp } from "../beats";
import { C, MONO, SANS, SERIF } from "../theme";
import { glass, pop } from "./ui";

/** 57.9 s: "a clone of everybody else" — grey copies fill the 3×3 grid around the live centre tile. */
export const Clones = () => {
  const t = useCurrentFrame() / useVideoConfig().fps;
  if (t < B.clone) return null;
  const tiles = [0, 1, 2, 3, 5, 6, 7, 8]; // 4 = centre (the live frame)
  return (
    <AbsoluteFill>
      {tiles.map((cell, i) => {
        const col = cell % 3;
        const row = Math.floor(cell / 3);
        const dist = Math.abs(col - 1) + Math.abs(row - 1);
        const k = ramp(t, B.clone + 0.25 + dist * 0.09 + (i % 2) * 0.03, 0.45);
        return (
          <div
            key={cell}
            style={{
              position: "absolute",
              left: col * 360 + 8,
              top: row * 640 + 8,
              width: 344,
              height: 624,
              borderRadius: 26,
              overflow: "hidden",
              opacity: k,
              transform: `scale(${lerp(1.25, 1, k)})`,
            }}
          >
            <Img src={staticFile(`clones/c${cell}.jpg`)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            <div style={{ position: "absolute", inset: 0, background: "rgba(10,10,12,0.35)" }} />
            <div style={{ position: "absolute", left: 18, bottom: 16, fontFamily: MONO, fontSize: 20, color: C.dim, letterSpacing: "0.18em" }}>
              CLONE_{String(i + 1).padStart(2, "0")}
            </div>
          </div>
        );
      })}
      <div
        style={{
          position: "absolute",
          left: 360 + 8,
          top: 640 - 52,
          fontFamily: MONO,
          fontSize: 22,
          letterSpacing: "0.2em",
          color: C.accent,
          opacity: ramp(t, B.clone + 0.5, 0.3),
        }}
      >
        ● THE REAL YOU
      </div>
    </AbsoluteFill>
  );
};

/** 59.2–62 s: CTA end card — comment COACH. */
const WORD = "COACH";
export const EndCard = () => {
  const t = useCurrentFrame() / useVideoConfig().fps;
  const a = TALK_END + 0.03;
  if (t < a) return null;
  const v = ramp(t, a, 0.45, easeIO);
  const typed = Math.min(WORD.length, Math.floor(Math.max(0, t - (a + 0.55)) / 0.09));
  const sent = ramp(t, a + 0.55 + WORD.length * 0.09 + 0.15, 0.3);
  return (
    <AbsoluteFill style={{ background: C.ink }}>
      <Img src={staticFile("last.jpg")} style={{ position: "absolute", inset: -40, width: 1160, height: 2000, objectFit: "cover", filter: `blur(${lerp(0, 34, v)}px) brightness(${lerp(1, 0.38, v)}) saturate(0.7)` }} />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 34, paddingBottom: 120 }}>
        <div style={{ ...pop(ramp(t, a + 0.1, 0.45)), fontFamily: SERIF, fontStyle: "italic", fontSize: 110, color: C.paper, lineHeight: 1 }}>Comment</div>
        <div
          style={{
            ...pop(ramp(t, a + 0.2, 0.5)),
            fontFamily: SANS,
            fontWeight: 900,
            fontSize: 250,
            lineHeight: 0.9,
            letterSpacing: "-0.05em",
            backgroundImage: `linear-gradient(180deg, #FF9A6A, ${C.accent} 60%, #C9441A)`,
            WebkitBackgroundClip: "text",
            color: "transparent",
          }}
        >
          COACH
        </div>
        <div style={{ ...pop(ramp(t, a + 0.35, 0.45)), ...glass({ width: 820, borderRadius: 999, padding: "20px 22px 20px 34px", display: "flex", alignItems: "center", gap: 22, marginTop: 30 }) }}>
          <div style={{ width: 64, height: 64, borderRadius: 32, background: "linear-gradient(135deg,#FF9A6A,#C9441A)" }} />
          <div style={{ flex: 1, fontFamily: SANS, fontWeight: 600, fontSize: 42, color: typed ? C.paper : C.dim }}>
            {typed ? WORD.slice(0, typed) : "Add a comment…"}
            {sent < 1 && <span style={{ opacity: Math.floor(t * 3) % 2 ? 0 : 1, color: C.accent }}>|</span>}
          </div>
          <div
            style={{
              width: 92,
              height: 92,
              borderRadius: 46,
              background: typed === WORD.length ? C.accent : "rgba(255,255,255,0.12)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transform: `scale(${1 + Math.sin(sent * Math.PI) * 0.25})`,
            }}
          >
            <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#1a0d06" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 19 V5 M5 12 L12 5 L19 12" />
            </svg>
          </div>
        </div>
        <div style={{ ...pop(ramp(t, a + 0.6, 0.45)), fontFamily: SANS, fontWeight: 500, fontSize: 38, color: C.dim, textAlign: "center", lineHeight: 1.3 }}>
          to scale your online fitness
          <br />
          coaching business
        </div>
        <div style={{ opacity: ramp(t, a + 0.9, 0.4), fontFamily: MONO, fontSize: 28, letterSpacing: "0.2em", color: C.paper, marginTop: 20 }}>@COLELUISDASILVA</div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
