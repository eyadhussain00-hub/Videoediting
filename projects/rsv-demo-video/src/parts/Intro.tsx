import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import type { Captions } from "../../config/video";
import { ink, type Lang } from "../theme";

// The opening line, big, one phrase at a time, then out of the way as the laptop arrives.
export function Intro({ captions, lang, frames }: { captions: Captions; lang: Lang; frames: number }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const exit = interpolate(frame, [frames - 12, frames], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", opacity: exit, transform: `translateY(${(1 - exit) * -40}px)` }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
        {captions.intro.lines.map((line, i) => {
          const s = spring({ frame: frame - 4 - i * 9, fps, config: { damping: 200, mass: 0.7 } });
          return (
            <div
              key={i}
              style={{
                fontSize: 96, fontWeight: 800, lineHeight: 1.1, letterSpacing: lang === "ar" ? 0 : "-0.035em",
                color: i === 0 ? ink.text : "transparent",
                backgroundImage: i === 0 ? undefined : `linear-gradient(90deg, ${ink.accentSoft}, #8b8ff8)`,
                backgroundClip: i === 0 ? undefined : "text",
                WebkitBackgroundClip: i === 0 ? undefined : "text",
                opacity: s, transform: `translateY(${(1 - s) * 40}px)`, filter: `blur(${(1 - s) * 10}px)`,
              }}
            >
              {line[lang]}
            </div>
          );
        })}
        <div
          style={{
            marginTop: 22, fontSize: 32, fontWeight: 500, color: ink.text2,
            opacity: spring({ frame: frame - 26, fps, config: { damping: 200 } }),
          }}
        >
          {captions.intro.sub[lang]}
        </div>
      </div>
    </AbsoluteFill>
  );
}
