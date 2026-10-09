import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig } from "remotion";
import type { Captions } from "../../config/video";
import { ink, type Lang } from "../theme";

// The close: the brand, the promise again, and one way to act on it.
export function EndCard({ text, lang }: { text: Captions; lang: Lang }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const at = (delay: number) => spring({ frame: frame - delay, fps, config: { damping: 200, mass: 0.6 } });
  const rise = (delay: number) => {
    const s = at(delay);
    return { opacity: s, transform: `translateY(${(1 - s) * 26}px)`, filter: `blur(${(1 - s) * 6}px)` };
  };
  const logo = spring({ frame, fps, config: { damping: 12, stiffness: 140, mass: 0.7 } });
  const e = text.end;

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", textAlign: "center" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18, transform: `scale(${logo})`, opacity: Math.min(1, logo) }}>
          <div
            style={{
              width: 76, height: 76, borderRadius: 20, background: `linear-gradient(145deg, ${ink.accentSoft}, ${ink.accent})`,
              color: "#fff", fontWeight: 800, fontSize: 24, letterSpacing: "0.02em", display: "flex", alignItems: "center",
              justifyContent: "center", boxShadow: `0 16px 40px ${ink.accent}66`, fontFamily: "inherit",
            }}
          >
            RSV
          </div>
          <div style={{ fontSize: 40, fontWeight: 800, color: ink.text, letterSpacing: "-0.02em" }}>{e.brand}</div>
        </div>
        <div style={{ marginTop: 46, fontSize: 84, fontWeight: 800, color: ink.text, letterSpacing: lang === "ar" ? 0 : "-0.035em", ...rise(6) }}>
          {e.title[lang]}
        </div>
        <div style={{ marginTop: 18, fontSize: 32, fontWeight: 500, color: ink.text2, ...rise(12) }}>{e.sub[lang]}</div>
        <div
          style={{
            marginTop: 48, display: "flex", alignItems: "center", gap: 16, padding: "18px 30px", borderRadius: 999,
            background: "rgba(37,211,102,0.12)", border: "1px solid rgba(37,211,102,0.4)", ...rise(18),
          }}
        >
          <svg width="30" height="30" viewBox="0 0 24 24" aria-hidden="true">
            <path
              fill={ink.whatsapp}
              d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.8 11.9 11.9 0 0 0 4.6 4c1.7.7 2.4.8 3.2.7.5-.1 1.5-.6 1.8-1.2.2-.6.2-1.1.1-1.2l-.5-.3Z"
            />
          </svg>
          <span style={{ fontSize: 30, fontWeight: 700, color: ink.text }}>{e.cta[lang]}</span>
          <span style={{ fontSize: 30, fontWeight: 600, color: ink.text2, direction: "ltr", unicodeBidi: "isolate" }}>{e.contact}</span>
        </div>
      </div>
    </AbsoluteFill>
  );
}
