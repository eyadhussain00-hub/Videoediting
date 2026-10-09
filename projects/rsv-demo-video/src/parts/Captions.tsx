import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import type { Captions as CaptionText } from "../../config/video";
import type { Timeline } from "../timeline";
import { ink, isRtl, type Lang } from "../theme";

// One short line per moment, timed to the clip it describes. Above the laptop they sit in a dark glass
// panel, so they stay readable when the camera pushes the light screen up behind them; beside the phone
// they are bigger, and free.
export function Captions({ timeline, text, lang }: { timeline: Timeline; text: CaptionText; lang: Lang }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const active = timeline.captions.find((c) => frame >= c.from && frame < c.from + c.frames);
  if (!active) return null;
  const line = text.lines[active.key];
  if (!line) return null;

  const local = frame - active.from;
  const out = interpolate(local, [active.frames - 7, active.frames], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const words = line.text[lang].split(" ");
  const phone = active.device === "phone";
  const rtl = isRtl(lang);
  const panelIn = spring({ frame: local, fps, config: { damping: 200, mass: 0.5 } });

  const body = (
    <div style={{ display: "flex", flexDirection: "column", alignItems: phone ? "flex-start" : "center", gap: phone ? 18 : 10 }}>
      {line.kicker && (
        <div
          style={{
            fontSize: phone ? 24 : 19, fontWeight: 700, color: "#c7c9ff", padding: "5px 14px", borderRadius: 999,
            background: `${ink.accent}55`, border: `1px solid ${ink.accentSoft}66`,
            opacity: panelIn, letterSpacing: lang === "ar" ? 0 : "0.02em",
          }}
        >
          {line.kicker[lang]}
        </div>
      )}
      <div
        style={{
          fontSize: phone ? 64 : 46, fontWeight: 800, lineHeight: 1.18, color: ink.text, textAlign: phone ? "start" : "center",
          letterSpacing: lang === "ar" ? 0 : "-0.025em", maxWidth: phone ? 640 : 1400, textWrap: "balance",
        }}
      >
        {words.map((word, i) => {
          const s = spring({ frame: local - i * 2, fps, config: { damping: 200, mass: 0.55 } });
          return (
            <span
              key={i}
              style={{
                display: "inline-block", opacity: s, filter: `blur(${(1 - s) * 6}px)`,
                transform: `translateY(${(1 - s) * 22}px)`, marginInlineEnd: "0.26em",
              }}
            >
              {word}
            </span>
          );
        })}
      </div>
    </div>
  );

  if (phone) {
    return (
      <AbsoluteFill
        style={{
          // flex-start is the reading side in both directions (the frame is dir="rtl" in Arabic); the
          // phone stands on the other side.
          justifyContent: "center", paddingInline: 150, alignItems: "flex-start",
          opacity: out, transform: `translateY(${(1 - out) * -16}px)`,
        }}
      >
        <div style={{ width: 660 }}>{body}</div>
      </AbsoluteFill>
    );
  }

  return (
    <AbsoluteFill style={{ alignItems: "center", paddingTop: 54, opacity: out, transform: `translateY(${(1 - out) * -14}px)` }}>
      <div
        style={{
          padding: line.kicker ? "18px 40px 22px" : "20px 40px", borderRadius: 26,
          background: "rgba(10,13,19,0.78)", backdropFilter: "blur(14px)", border: `1px solid ${ink.border}`,
          boxShadow: "0 20px 50px rgba(0,0,0,0.45)",
          transform: `scale(${0.96 + 0.04 * panelIn})`, opacity: panelIn,
        }}
      >
        {body}
      </div>
    </AbsoluteFill>
  );
}
