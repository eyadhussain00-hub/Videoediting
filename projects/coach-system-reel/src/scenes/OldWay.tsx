import React from "react";
import { C, F, k, lerp, spr, useT } from "../theme";
import { Cutaway, Kicker, cardStyle } from "../ui";
import TL from "../timeline.json";

const [A, B] = TL.scenes.oldWay;

const Bubble: React.FC<{ at: number; text: string }> = ({ at, text }) => {
  const t = useT();
  const p = spr(t, at, 13, 240, 0.6);
  return (
    <div
      style={{
        alignSelf: "flex-end",
        maxWidth: 600,
        padding: "20px 28px",
        borderRadius: "30px 30px 8px 30px",
        background: "#24242E",
        color: C.ink,
        fontFamily: F.sans,
        fontWeight: 500,
        fontSize: 36,
        opacity: t >= at ? Math.min(1, p * 1.5) : 0,
        scale: String(lerp(0.7, 1, p)),
        transformOrigin: "right bottom",
      }}
    >
      {text}
    </div>
  );
};

const Stamp: React.FC<{ at: number }> = ({ at }) => {
  const t = useT();
  const p = spr(t, at, 11, 320, 0.7);
  if (t < at) return null;
  return (
    <div
      style={{
        position: "absolute",
        right: 44,
        top: 150,
        rotate: "-9deg",
        scale: String(lerp(1.9, 1, p)),
        opacity: Math.min(1, p * 2),
        padding: "12px 22px",
        borderRadius: 14,
        boxShadow: `inset 0 0 0 4px ${C.red}`,
        color: C.red,
        fontFamily: F.mono,
        fontWeight: 700,
        fontSize: 34,
        letterSpacing: "0.12em",
        background: "rgba(255,82,71,0.08)",
      }}
    >
      ✕ NOT NEEDED
    </div>
  );
};

const Strike: React.FC<{ at: number; width: number }> = ({ at, width }) => {
  const t = useT();
  return (
    <div
      style={{
        position: "absolute",
        left: -8,
        top: "52%",
        height: 6,
        borderRadius: 3,
        width: width * k(t, at - 0.08, at + 0.14),
        background: C.red,
        boxShadow: `0 0 20px ${C.red}`,
      }}
    />
  );
};

export const OldWay: React.FC = () => {
  const t = useT();
  const deadA = k(t, 5.28, 5.6);
  const deadB = k(t, 6.6, 6.9);
  const cardB = spr(t, 5.9, 15, 170, 0.8);
  return (
    <Cutaway from={A} to={B}>
      <Kicker text="THE OLD WAY" color={C.red} at={A + 0.05} />

      {/* cold outreach */}
      <div
        style={{
          ...cardStyle,
          left: 100,
          top: 340,
          width: 880,
          height: 500,
          padding: 44,
          display: "flex",
          flexDirection: "column",
          gap: 18,
          filter: `saturate(${1 - deadA}) brightness(${1 - deadA * 0.35})`,
          translate: `${Math.sin(t * 90) * 6 * (k(t, 5.28, 5.32) - k(t, 5.32, 5.5))}px 0`,
        }}
      >
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 12 }}>
          <div style={{ position: "relative", fontFamily: F.sans, fontWeight: 800, fontSize: 60, color: C.ink, letterSpacing: "-0.03em" }}>
            Cold outreach
            <Strike at={5.28} width={420} />
          </div>
          <span style={{ fontFamily: F.mono, fontSize: 24, color: C.mute, letterSpacing: "0.1em" }}>DM #47</span>
        </div>
        <Bubble at={4.55} text="Hey bro, quick question" />
        <Bubble at={4.72} text="Are you trying to get in shape?" />
        <Bubble at={4.9} text="Just bumping this ↑" />
        <div
          style={{
            alignSelf: "flex-end",
            fontFamily: F.mono,
            fontSize: 24,
            color: C.mute,
            letterSpacing: "0.08em",
            opacity: k(t, 5.05, 5.25),
          }}
        >
          SEEN · NO REPLY
        </div>
      </div>
      <div style={{ position: "absolute", left: 100, top: 340, width: 880 }}>
        <Stamp at={5.28} />
      </div>

      {/* facebook groups */}
      <div
        style={{
          ...cardStyle,
          left: 100,
          top: 880,
          width: 880,
          height: 470,
          padding: 44,
          opacity: t >= 5.9 ? Math.min(1, cardB * 1.4) : 0,
          translate: `0 ${lerp(80, 0, cardB)}px`,
          filter: `saturate(${1 - deadB}) brightness(${1 - deadB * 0.35})`,
        }}
      >
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
          <div style={{ position: "relative", fontFamily: F.sans, fontWeight: 800, fontSize: 60, color: C.ink, letterSpacing: "-0.03em" }}>
            Facebook groups
            <Strike at={6.6} width={500} />
          </div>
          <span style={{ fontFamily: F.mono, fontSize: 24, color: C.mute, letterSpacing: "0.1em" }}>12K MEMBERS</span>
        </div>
        <div style={{ display: "flex", gap: 22, alignItems: "center", marginTop: 34 }}>
          <div style={{ width: 76, height: 76, borderRadius: 38, background: "linear-gradient(135deg,#3b3b4a,#22222b)" }} />
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ width: 240, height: 18, borderRadius: 9, background: "#33333f" }} />
            <div style={{ width: 150, height: 14, borderRadius: 7, background: "#26262f" }} />
          </div>
        </div>
        <div style={{ marginTop: 28, fontFamily: F.sans, fontWeight: 600, fontSize: 40, color: C.ink, lineHeight: 1.25 }}>
          FREE 30-day challenge! Comment "ME" below
        </div>
        <div style={{ marginTop: 26, fontFamily: F.mono, fontSize: 24, color: C.mute, letterSpacing: "0.08em" }}>
          0 COMMENTS · 2 LIKES
        </div>
      </div>
      <div style={{ position: "absolute", left: 100, top: 880, width: 880 }}>
        <Stamp at={6.6} />
      </div>
    </Cutaway>
  );
};
