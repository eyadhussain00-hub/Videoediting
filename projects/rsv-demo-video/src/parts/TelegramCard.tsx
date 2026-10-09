import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import type { Captions } from "../../config/video";
import type { CueSheet } from "../timeline";
import { ink, type Lang } from "../theme";

// The patient's actual message, beside the device, at the moment it was sent to the clinic's Telegram:
// the same name and words the recorder posted to the webhook, so the card matches the lead that appears.
export function TelegramCard({
  sheet,
  text,
  lang,
  frames,
  position,
}: {
  sheet: CueSheet;
  text: Captions;
  lang: Lang;
  frames: number;
  position: { left: number; top: number };
}) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame, fps, config: { damping: 15, mass: 0.8, stiffness: 120 } });
  const out = interpolate(frame, [frames - 9, frames], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const initials = sheet.arrival.name.split(/\s+/).map((w) => w[0]).slice(0, 2).join("");

  return (
    <div
      style={{
        position: "absolute", left: position.left, top: position.top, width: 390, padding: 20, borderRadius: 24,
        background: "rgba(15,19,25,0.94)", border: `1px solid ${ink.border}`, boxShadow: "0 30px 70px rgba(0,0,0,0.55)",
        opacity: Math.min(s, out), transform: `translateY(${(1 - s) * 40}px) scale(${0.9 + 0.1 * s})`,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <div style={{ width: 30, height: 30, borderRadius: 999, background: ink.telegram, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="17" height="17" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M3 11.5 L20.5 4 L17.5 20 L11.8 15.6 L9.4 18.5 L9.8 13.9 L17 7.8 L8.2 12.8 Z" fill="#fff" />
          </svg>
        </div>
        <div style={{ fontSize: 19, fontWeight: 700, color: ink.text }}>{text.telegram.label[lang]}</div>
        <div style={{ marginInlineStart: "auto", fontSize: 16, color: ink.text3 }}>{text.telegram.now[lang]}</div>
      </div>
      <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
        <div
          style={{
            width: 44, height: 44, borderRadius: 999, flex: "0 0 auto", background: "linear-gradient(135deg, #f59e0b, #ec4899)",
            color: "#fff", fontWeight: 700, fontSize: 17, display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          {initials}
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 19, fontWeight: 700, color: ink.text }}>{sheet.arrival.name}</div>
          <div
            style={{
              marginTop: 8, fontSize: 18, lineHeight: 1.5, color: "#dfe3ea", background: "rgba(255,255,255,0.06)",
              padding: "10px 14px", borderRadius: 16, borderStartStartRadius: 4,
            }}
          >
            {sheet.arrival.text}
          </div>
        </div>
      </div>
    </div>
  );
}
