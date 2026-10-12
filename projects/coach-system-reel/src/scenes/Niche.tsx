import React from "react";
import { interpolateColors } from "remotion";
import { C, F, ease, k, lerp, spr, useT } from "../theme";
import { Cutaway, Kicker, cardStyle } from "../ui";
import TL from "../timeline.json";

const [A, B] = TL.scenes.niche;
const COLS = 9, ROWS = 9, DX = 96, DY = 84, X0 = 540 - 4 * DX, Y0 = 600;
const TARGET = { c: 6, r: 3 };
const tx = X0 + TARGET.c * DX, ty = Y0 + TARGET.r * DY;

const EVERY = 21.6, NOONE = 23.84, LOCK = 24.76;

const Line: React.FC<{ a: number; b: number; children: React.ReactNode }> = ({ a, b, children }) => {
  const t = useT();
  const p = k(t, a, a + 0.4);
  const q = b ? k(t, b - 0.05, b + 0.2, ease.in) : 0;
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top: 0,
        textAlign: "center",
        opacity: p * (1 - q),
        translate: `0 ${lerp(30, 0, p) + lerp(0, -30, q)}px`,
        filter: `blur(${(1 - p) * 8 + q * 8}px)`,
      }}
    >
      {children}
    </div>
  );
};

export const Niche: React.FC = () => {
  const t = useT();
  const lock = spr(t, LOCK, 13, 140, 0.9);
  const wave = (t - EVERY) * 1400; // ring radius of the "everyone" pulse

  return (
    <Cutaway from={A} to={B}>
      <Kicker text="01 · NICHE DOWN" at={A + 0.05} />

      <div style={{ position: "absolute", top: 360, left: 0, right: 0, height: 140 }}>
        <Line a={A + 0.1} b={EVERY - 0.05}>
          <span style={{ fontFamily: F.sans, fontWeight: 800, fontSize: 86, letterSpacing: "-0.04em", color: C.mute }}>Who is it for?</span>
        </Line>
        <Line a={EVERY - 0.05} b={NOONE - 0.05}>
          <span style={{ fontFamily: F.sans, fontWeight: 800, fontSize: 86, letterSpacing: "-0.04em", color: C.ink }}>Talk to </span>
          <span style={{ fontFamily: F.serif, fontStyle: "italic", fontSize: 116, color: C.ink }}>everyone…</span>
        </Line>
        <Line a={NOONE - 0.05} b={LOCK - 0.05}>
          <span style={{ fontFamily: F.sans, fontWeight: 800, fontSize: 86, letterSpacing: "-0.04em", color: C.mute }}>…reach </span>
          <span style={{ fontFamily: F.serif, fontStyle: "italic", fontSize: 116, color: C.red }}>no one.</span>
        </Line>
        <Line a={LOCK - 0.05} b={0}>
          <span style={{ fontFamily: F.sans, fontWeight: 800, fontSize: 86, letterSpacing: "-0.04em", color: C.ink }}>Speak to </span>
          <span style={{ fontFamily: F.serif, fontStyle: "italic", fontSize: 116, color: C.volt }}>one.</span>
        </Line>
      </div>

      {/* the crowd */}
      {Array.from({ length: COLS * ROWS }, (_, i) => {
        const c = i % COLS, r = Math.floor(i / COLS);
        const x = X0 + c * DX, y = Y0 + r * DY;
        const d = Math.hypot(x - 540, y - 940);
        const appear = spr(t, 20.42 + d * 0.0009, 14, 220, 0.6);
        const hit = k(t, EVERY + d / 1400 - 0.02, EVERY + d / 1400 + 0.12) * (1 - k(t, NOONE - 0.1, NOONE + 0.3));
        const fade = k(t, NOONE + d * 0.0004, NOONE + d * 0.0004 + 0.35);
        const isT = c === TARGET.c && r === TARGET.r;
        const tOn = isT ? k(t, LOCK, LOCK + 0.25) : 0;
        const base = interpolateColors(hit, [0, 1], ["#3A3A46", "#F4F4F6"]);
        const col = isT ? interpolateColors(tOn, [0, 1], [base, C.volt]) : interpolateColors(fade, [0, 1], [base, "#1E1E26"]);
        const sz = 26 * (1 + hit * 0.25) * (isT ? 1 + tOn * 0.9 : 1 - fade * 0.25);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x - sz / 2,
              top: y - sz / 2 + fade * (isT ? 0 : 8),
              width: sz,
              height: sz,
              borderRadius: sz / 2,
              background: col,
              scale: String(t >= 20.42 ? appear : 0),
              boxShadow: isT && tOn > 0 ? `0 0 ${50 * tOn}px rgba(215,255,61,${0.8 * tOn})` : hit > 0.5 ? "0 0 18px rgba(255,255,255,0.35)" : "none",
            }}
          />
        );
      })}

      {/* the "everyone" pulse */}
      {t > EVERY && t < EVERY + 0.9 && (
        <div
          style={{
            position: "absolute",
            left: 540 - wave,
            top: 940 - wave,
            width: wave * 2,
            height: wave * 2,
            borderRadius: "50%",
            boxShadow: `inset 0 0 0 3px rgba(255,255,255,${0.5 * (1 - (t - EVERY) / 0.9)})`,
          }}
        />
      )}

      {/* crosshair locks on */}
      {t >= LOCK && (
        <div
          style={{
            position: "absolute",
            left: tx,
            top: ty,
            width: 0,
            height: 0,
            rotate: `${lerp(-120, 0, lock)}deg`,
          }}
        >
          {(() => {
            const r = lerp(520, 62, lock);
            return (
              <>
                <div
                  style={{
                    position: "absolute",
                    left: -r,
                    top: -r,
                    width: r * 2,
                    height: r * 2,
                    borderRadius: "50%",
                    boxShadow: `inset 0 0 0 3px ${C.volt}`,
                    opacity: Math.min(1, lock * 2),
                  }}
                />
                {[0, 90, 180, 270].map((a) => (
                  <div
                    key={a}
                    style={{
                      position: "absolute",
                      left: -2,
                      top: -r - 26,
                      width: 4,
                      height: 34,
                      background: C.volt,
                      transformOrigin: `2px ${r + 26}px`,
                      rotate: `${a}deg`,
                    }}
                  />
                ))}
              </>
            );
          })()}
        </div>
      )}

      {/* the ideal client callout */}
      <div
        style={{
          ...cardStyle,
          left: 100,
          top: 1080,
          width: 520,
          padding: "30px 36px",
          background: "rgba(16,16,22,0.92)",
          opacity: k(t, LOCK + 0.3, LOCK + 0.6),
          translate: `${lerp(-40, 0, k(t, LOCK + 0.3, LOCK + 0.7))}px 0`,
        }}
      >
        <div style={{ fontFamily: F.mono, fontSize: 22, letterSpacing: "0.16em", color: C.volt }}>YOUR IDEAL CLIENT</div>
        <div style={{ fontFamily: F.sans, fontWeight: 800, fontSize: 50, color: C.ink, marginTop: 12, letterSpacing: "-0.02em" }}>Busy dads, 35+</div>
        <div style={{ fontFamily: F.sans, fontWeight: 500, fontSize: 34, color: C.mute, marginTop: 6 }}>Fat loss · 3 workouts a week</div>
      </div>
      {/* connector from the dot to the card */}
      <svg style={{ position: "absolute", left: 0, top: 0 }} width={1080} height={1920}>
        <path
          d={`M ${tx} ${ty + 70} L ${tx} ${1040} L 620 ${1040} L 620 1080`}
          stroke={C.volt}
          strokeWidth={2.5}
          fill="none"
          strokeDasharray={900}
          strokeDashoffset={900 * (1 - k(t, LOCK + 0.2, LOCK + 0.6))}
        />
      </svg>
    </Cutaway>
  );
};
