import type { CSSProperties, ReactNode } from "react";
import { ORB_COLORS } from "./vendor/command-states";
import { mono, sans } from "./fonts";
import { Orb } from "./Orb";
import { clamp, colorOf, typedAt, weightsAt, type Beat, type Say } from "./timing";

// The Command Centre page, drawn at a given screen size with the same rules as its CSS
// (src/app/globals.css, .cc-*): the title, the orb in the largest square left, the typed word and the
// label under it, and optionally the prompt card, Jarvis's controls and TV mode's clock.

export const BG = "#080a0e";

export type Card = { label: string; tool: string; summary: string; left: number; out: number; tap: number | null };
export type Convo = { asked: string | null; reply: string | null; listening: boolean };

type RoomProps = {
  w: number;
  h: number;
  t: number;
  beats: Beat[];
  says: Say[];
  label: string | null;
  particles?: number;
  clock?: string;
  card?: Card | null;
  convo?: Convo | null;
  // The pan between pages: -1…1 moves the orb and its caption sideways, fading as it goes.
  pan?: number;
  titleIn?: number;
  orbIn?: number;
  nav?: boolean;
};

export function Room({ w, h, t, beats, says, label, particles, clock, card, convo, pan = 0, titleIn = 1, orbIn = 1, nav }: RoomProps) {
  const vh = h / 100;
  const vw = w / 100;
  const big = w >= 1800 && h >= 1000;
  const tall = w / h <= 3 / 4;
  const padTop = clamp(6 * vh, 22, 64);
  const padBottom = clamp(3 * vh, 12, 32);
  const titleSize = big ? 7.4 * vh : Math.max(26, Math.min(clamp(7 * vw, 34, 58), 8.5 * vh));
  const titleWidth = Math.min(w - 48, big ? 1180 : 672);
  const titleH = titleSize * 1.05;

  const cardH = card && card.out < 1 ? 206 : 0;
  const voiceH = convo ? 58 + (convo.asked || convo.reply ? 110 : 0) + 12 : 0;
  const stageTop = padTop + titleH;
  const stageH = h - padBottom - stageTop - cardH - voiceH;
  const frame = Math.min(w - 48, stageH - (tall ? 3 * vh : 0), big ? 1400 : 820);
  const frameTop = tall ? stageTop + 3 * vh : stageTop + (stageH - frame) / 2;
  const frameLeft = (w - frame) / 2;

  const weights = weightsAt(t, beats);
  const rgb = colorOf(weights);
  const word = typedAt(t, says);
  const wordSize = big ? frame * 0.03 : clamp(frame * 0.027, 13, 20);
  const labelSize = big ? frame * 0.019 : clamp(frame * 0.018, 11, 14);
  const blinkOn = word.typing || Math.floor(t / 0.53) % 2 === 0;

  return (
    <div style={{ position: "absolute", inset: 0, width: w, height: h, overflow: "hidden", background: BG, color: "#eeeff4", fontFamily: sans }}>
      <h1
        style={{
          position: "absolute",
          top: padTop,
          left: (w - titleWidth) / 2,
          width: titleWidth,
          margin: 0,
          fontWeight: 500,
          fontSize: titleSize,
          letterSpacing: big ? "-0.035em" : -2,
          lineHeight: 1.05,
          opacity: titleIn,
          transform: `translateY(${(1 - titleIn) * 14}px)`,
        }}
      >
        Command Centre.
      </h1>
      {clock && (
        <p style={{ position: "absolute", top: padTop, right: 28, margin: 0, fontFamily: mono, fontSize: clamp(2.6 * vh, 14, 34), letterSpacing: "0.08em", color: "#7f8390" }}>
          {clock}
        </p>
      )}

      <div
        style={{
          position: "absolute",
          top: frameTop,
          left: frameLeft,
          width: frame,
          height: frame,
          opacity: orbIn * (1 - Math.abs(pan)),
          transform: `translateX(${pan * frame * 0.22}px)`,
        }}
      >
        <Orb size={frame} time={t} weights={weights} particles={particles} />
        <div style={{ position: "absolute", left: 0, right: 0, top: "83.5%", display: "grid", justifyItems: "center", gap: "0.9em" }}>
          <p
            style={{
              margin: 0,
              whiteSpace: "nowrap",
              fontFamily: mono,
              fontWeight: 500,
              fontSize: wordSize,
              lineHeight: 1,
              letterSpacing: "0.16em",
              color: `rgb(${rgb})`,
              textShadow: `0 0 14px rgba(${rgb},0.55), 0 0 2px rgba(${rgb},0.4)`,
            }}
          >
            {word.text}
            <span
              style={{
                display: "inline-block",
                width: "0.58em",
                height: "1.05em",
                marginLeft: "0.08em",
                verticalAlign: "-0.17em",
                background: `rgb(${rgb})`,
                boxShadow: `0 0 12px rgba(${rgb},0.6)`,
                opacity: blinkOn ? 1 : 0,
              }}
            />
          </p>
          {label && (
            <p style={{ margin: 0, padding: "4px 8px", fontFamily: mono, fontSize: labelSize, letterSpacing: "0.08em", color: "#7f8390", whiteSpace: "nowrap" }}>
              {label}
            </p>
          )}
        </div>
      </div>
      {nav && (
        <>
          <NavButton side="left" top={frameTop + frame / 2} x={24} />
          <NavButton side="right" top={frameTop + frame / 2} x={24} />
        </>
      )}

      {card && card.out < 1 && <ApprovalCard card={card} w={w} bottom={padBottom + voiceH} />}
      {convo && <Voice convo={convo} w={w} bottom={padBottom} rgb={rgb} t={t} />}
    </div>
  );
}

function NavButton({ side, top, x }: { side: "left" | "right"; top: number; x: number }) {
  return (
    <div
      style={{
        position: "absolute",
        top: top - 22,
        [side]: x,
        width: 44,
        height: 44,
        borderRadius: "50%",
        background: "#ffffff0a",
        boxShadow: "0 0 0 1px #ffffff0d",
        display: "grid",
        placeItems: "center",
      }}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#a7aab6" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d={side === "left" ? "M15 5l-7 7 7 7" : "M9 5l7 7-7 7"} />
      </svg>
    </div>
  );
}

const WAITING = ORB_COLORS.waiting.join(",");

function ApprovalCard({ card, w, bottom }: { card: Card; w: number; bottom: number }) {
  const width = Math.min(w - 48, 560);
  const pressed = card.tap !== null && card.tap >= 0 && card.tap < 0.25;
  return (
    <div
      style={{
        position: "absolute",
        left: (w - width) / 2,
        bottom: bottom + 14,
        width,
        boxSizing: "border-box",
        display: "grid",
        gap: 10,
        padding: "14px 14px 12px",
        borderRadius: 18,
        background: `linear-gradient(rgba(${WAITING},0.07), rgba(${WAITING},0.03)), #0d1016`,
        boxShadow: `0 0 0 1px rgba(${WAITING},0.28), 0 18px 50px #0008, 0 0 40px rgba(${WAITING},0.08)`,
        opacity: 1 - card.out,
        transform: `translateY(${card.out * 24}px) scale(${1 - card.out * 0.02})`,
      }}
    >
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12 }}>
        <p style={{ margin: 0, fontSize: 14, fontWeight: 500 }}>
          {card.label} asks to use {card.tool}
        </p>
        <span style={{ fontFamily: mono, fontSize: 12, color: `rgb(${WAITING})` }}>{card.left}s</span>
      </div>
      <code style={{ display: "block", padding: "9px 11px", borderRadius: 10, background: BG, boxShadow: "0 0 0 1px #ffffff0d", fontFamily: mono, fontSize: 12, lineHeight: 1.6, color: "#bbc4dc" }}>
        {card.summary}
      </code>
      <div style={{ height: 2, borderRadius: 1, background: "#ffffff0a", overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${(card.left / 55) * 100}%`, background: `rgb(${WAITING})`, boxShadow: `0 0 10px rgba(${WAITING},0.7)` }} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <Btn style={{ background: "#ffffff0a", boxShadow: "0 0 0 1px #ffffff12", color: "#eeeff4" }}>Deny</Btn>
        <div style={{ position: "relative" }}>
          <Btn style={{ background: `rgb(${WAITING})`, color: "#0b0d12", boxShadow: `0 0 24px rgba(${WAITING},0.35)`, transform: pressed ? "scale(0.97)" : undefined }}>Allow</Btn>
          {card.tap !== null && card.tap >= 0 && card.tap < 0.6 && <Tap progress={card.tap / 0.6} />}
        </div>
      </div>
    </div>
  );
}

function Btn({ children, style }: { children: ReactNode; style: CSSProperties }) {
  return (
    <div style={{ minHeight: 46, borderRadius: 14, display: "grid", placeItems: "center", fontSize: 15, fontWeight: 500, ...style }}>
      {children}
    </div>
  );
}

// A finger's tap: a soft ring spreading from the middle of the button.
function Tap({ progress }: { progress: number }) {
  const r = 12 + progress * 46;
  return (
    <div
      style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        width: r * 2,
        height: r * 2,
        marginLeft: -r,
        marginTop: -r,
        borderRadius: "50%",
        background: `rgba(255,255,255,${0.35 * (1 - progress)})`,
        boxShadow: `0 0 0 2px rgba(255,255,255,${0.5 * (1 - progress)})`,
      }}
    />
  );
}

// Jarvis under the orb: the last exchange, then keyboard · microphone · close.
function Voice({ convo, w, bottom, rgb, t }: { convo: Convo; w: number; bottom: number; rgb: string; t: number }) {
  const width = Math.min(w - 48, 560);
  const breathe = convo.listening ? 0.5 + 0.5 * Math.sin(t * Math.PI * 1.25) : 0;
  return (
    <div style={{ position: "absolute", left: (w - width) / 2, bottom, width, display: "grid", justifyItems: "center", gap: 12 }}>
      {(convo.asked || convo.reply) && (
        <div style={{ display: "grid", gap: 8, width: "100%", textAlign: "center" }}>
          {convo.asked && <p style={{ margin: 0, fontFamily: mono, fontSize: 12, color: "#7f8390" }}>› {convo.asked}</p>}
          {convo.reply && <p style={{ margin: "0 auto", maxWidth: "36em", fontSize: 14.5, lineHeight: 1.55, textAlign: "left" }}>{convo.reply}</p>}
        </div>
      )}
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <Icon size={40} color="#7f8390">
          <rect x="3" y="6" width="18" height="12" rx="2" />
          <path d="M7 10h.01M11 10h.01M15 10h.01M7 14h10" />
        </Icon>
        <div
          style={{
            width: 58,
            height: 58,
            borderRadius: "50%",
            display: "grid",
            placeItems: "center",
            background: convo.listening ? `rgba(${rgb},0.16)` : "#ffffff0a",
            boxShadow: convo.listening ? `0 0 0 1px rgba(${rgb},${0.55 + breathe * 0.25}), 0 0 ${34 + breathe * 14}px rgba(${rgb},${0.35 + breathe * 0.15})` : "0 0 0 1px #ffffff12",
            color: convo.listening ? `rgb(${rgb})` : "#a7aab6",
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill={convo.listening ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
            <rect x="9" y="3" width="6" height="11" rx="3" />
            <path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21" fill="none" />
          </svg>
        </div>
        <Icon size={40} color="#7f8390">
          <path d="M7 7l10 10M17 7L7 17" />
        </Icon>
      </div>
    </div>
  );
}

function Icon({ size, color, children }: { size: number; color: string; children: ReactNode }) {
  return (
    <div style={{ width: size, height: size, display: "grid", placeItems: "center", color }}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        {children}
      </svg>
    </div>
  );
}
