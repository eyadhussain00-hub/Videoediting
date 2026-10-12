import { useCurrentFrame, useVideoConfig } from "remotion";
import { B, ease, easeIn, ramp } from "../beats";
import { C, DISPLAY, MONO } from "../theme";

// Huge condensed words on the wall, behind his head (the cut-out subject is drawn over them).
type Word = { text: string; a: number; b: number; label?: string; accent?: boolean; size?: number };
const WORDS: Word[] = [
  { text: "AGREE", a: 1.84, b: 3.1 },
  { text: "DISAGREE", a: 3.1, b: 4.25, accent: true },
  { text: "3", a: B.three - 0.08, b: B.ch1, accent: true, size: 560 },
  { text: "RELEVANCE", a: B.ch1, b: 13.9 },
  { text: "PAIN", a: B.ch2, b: 21.7 },
  { text: "TRUST", a: B.ch3, b: 31.4 },
  { text: "HUMAN", a: B.human - 0.1, b: 36.4 },
  { text: "LIFE", a: 43.4, b: 44.9 },
  { text: "BELIEFS", a: B.beliefs - 0.1, b: B.bond - 0.05, accent: true },
  { text: "BOND", a: B.bond - 0.05, b: 55.2 },
];

const CENTER_Y = 440; // wall band between the top of his head and the couch back

export const BigWords = () => {
  const t = useCurrentFrame() / useVideoConfig().fps;
  const w = WORDS.find((x) => t >= x.a && t < x.b);
  if (!w) return null;
  const size = w.size ?? Math.min(400, 1900 / w.text.length);
  const out = ramp(t, w.b - 0.18, 0.18, easeIn);
  const letters = [...w.text];
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top: Math.max(300, CENTER_Y - size * 0.62),
        textAlign: "center",
        opacity: 1 - out,
        transform: `scale(${1 + out * 0.06})`,
        filter: `blur(${out * 10}px)`,
      }}
    >
      {w.label && (
        <div
          style={{
            fontFamily: MONO,
            fontSize: 30,
            letterSpacing: "0.3em",
            color: C.accent,
            marginBottom: -size * 0.06,
            opacity: ramp(t, w.a + 0.1, 0.3),
          }}
        >
          {w.label}
        </div>
      )}
      <div style={{ display: "inline-flex", overflow: "hidden", padding: `0 0 ${size * 0.04}px` }}>
        {letters.map((ch, i) => {
          const k = ramp(t, w.a + i * 0.035, 0.42, ease);
          return (
            <span
              key={i}
              style={{
                display: "inline-block",
                fontFamily: DISPLAY,
                fontSize: size,
                lineHeight: 1.08,
                letterSpacing: "-0.01em",
                transform: `translateY(${(1 - k) * 105}%)`,
                backgroundImage: w.accent
                  ? `linear-gradient(180deg, #FF8A55 0%, ${C.accent} 55%, #C9441A 100%)`
                  : `linear-gradient(180deg, #FFFFFF 0%, ${C.paper} 50%, rgba(244,239,230,0.72) 100%)`,
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
                filter: `drop-shadow(0 10px 30px rgba(0,0,0,0.35))`,
              }}
            >
              {ch}
            </span>
          );
        })}
      </div>
    </div>
  );
};
