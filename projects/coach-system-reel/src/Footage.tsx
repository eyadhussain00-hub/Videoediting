import React from "react";
import { AbsoluteFill, OffthreadVideo, staticFile } from "remotion";
import { C, F, ease, k, lerp, spr, useT } from "./theme";
import TL from "./timeline.json";

/*
  The reel, graded (see README), with a virtual camera on it. Its original captions are burned
  into the picture at 73–85 % of the height, over the black T-shirt, so a black band that feathers
  in above them lives in footage space: it moves with every zoom and never lets them show.
*/

// Virtual cuts: each segment starts a little wide-of-mark and springs into place, then drifts.
const CUTS: { t: number; s0: number; s1: number; dur: number }[] = [
  { t: 0, s0: 1.1, s1: 1.16, dur: 4.45 },
  { t: 7.2, s0: 1.24, s1: 1.27, dur: 0.95 },
  { t: 12.4, s0: 1.08, s1: 1.14, dur: 2.6 },
  { t: 17.15, s0: 1.28, s1: 1.31, dur: 3.2 },
  { t: 43.35, s0: 1.18, s1: 1.22, dur: 0.95 },
];
const ORIGIN_Y = 700; // the camera scales about the face

function camera(t: number) {
  const cut = [...CUTS].reverse().find((c) => t >= c.t) ?? CUTS[0];
  const settle = spr(t, cut.t, 16, 120, 0.9);
  let s = lerp(cut.s0, cut.s1, Math.min(1, (t - cut.t) / cut.dur)) + (1 - settle) * 0.09;
  // a quick push on "specific"
  s += 0.05 * Math.max(0, spr(t, 18.1, 9, 220, 0.6) - k(t, 18.3, 19.4, ease.inOut));
  const tx = Math.sin(t * 0.7) * 4;
  const ty = Math.cos(t * 0.53) * 3;
  return { s, tx, ty };
}

// The split layout: the footage becomes a rounded window above a graphics panel.
export const WIN = { x: 100, y: 150, w: 880, h: 780, r: 48 };
export const splitAmount = (t: number) => {
  const [a, b] = TL.scenes.split;
  return k(t, a - 0.15, a + 0.3, ease.inOut) * (1 - k(t, b - 0.12, b + 0.05, ease.inOut));
};

export const Footage: React.FC = () => {
  const t = useT();
  const cam = camera(t);
  const m = splitAmount(t);
  const s = lerp(cam.s, 0.82, m);
  const tx = lerp(cam.tx, 0, m);
  const ty = lerp(cam.ty, -193, m);
  const inset = {
    top: lerp(0, WIN.y, m),
    right: lerp(0, 1080 - WIN.x - WIN.w, m),
    bottom: lerp(0, 1920 - WIN.y - WIN.h, m),
    left: lerp(0, WIN.x, m),
    r: lerp(0, WIN.r, m),
  };
  const open = k(t, 0, 0.28);

  return (
    <AbsoluteFill>
      <AbsoluteFill
        style={{
          clipPath: `inset(${inset.top}px ${inset.right}px ${inset.bottom}px ${inset.left}px round ${inset.r}px)`,
        }}
      >
        <AbsoluteFill
          style={{
            transformOrigin: `540px ${ORIGIN_Y}px`,
            scale: String(s),
            translate: `${tx}px ${ty}px`,
            filter: `blur(${lerp(9, 0, open)}px)`,
          }}
        >
          <OffthreadVideo src={staticFile("footage.mp4")} muted style={{ width: 1080, height: 1920 }} />
          {/* the band that hides the burned-in captions; opaque from 72.5 % of the height down */}
          <div
            style={{
              position: "absolute",
              left: -200,
              right: -200,
              top: 1229,
              height: 1400,
              background: `linear-gradient(to bottom, rgba(7,7,11,0) 0px, rgba(7,7,11,0.72) 90px, ${C.bg} 163px)`,
            }}
          />
          {/* grade: cool the wall, keep the skin warm */}
          <AbsoluteFill
            style={{
              background:
                "radial-gradient(ellipse 70% 45% at 50% 38%, rgba(255,190,140,0.07), rgba(0,0,0,0) 70%), linear-gradient(180deg, rgba(40,30,90,0.18), rgba(0,0,0,0) 40%)",
              mixBlendMode: "soft-light",
            }}
          />
        </AbsoluteFill>
      </AbsoluteFill>

      {/* window frame + name chip, only in the split layout */}
      {m > 0.01 && (
        <div
          style={{
            position: "absolute",
            left: WIN.x,
            top: WIN.y,
            width: WIN.w,
            height: WIN.h,
            borderRadius: WIN.r,
            boxShadow: `inset 0 0 0 1.5px rgba(255,255,255,${0.16 * m}), 0 40px 120px rgba(0,0,0,${0.6 * m})`,
            opacity: m,
          }}
        >
          <div
            style={{
              position: "absolute",
              left: 28,
              bottom: 28,
              display: "flex",
              alignItems: "center",
              gap: 14,
              padding: "14px 22px",
              borderRadius: 999,
              background: "rgba(7,7,11,0.62)",
              backdropFilter: "blur(14px)",
              boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.12)",
              translate: `0 ${lerp(20, 0, k(t, TL.scenes.split[0] + 0.25, TL.scenes.split[0] + 0.7))}px`,
              opacity: k(t, TL.scenes.split[0] + 0.25, TL.scenes.split[0] + 0.7),
            }}
          >
            <div style={{ width: 12, height: 12, borderRadius: 6, background: C.volt }} />
            <span style={{ fontFamily: F.sans, fontWeight: 700, fontSize: 30, color: C.ink }}>Steven Martin</span>
            <span style={{ fontFamily: F.mono, fontSize: 20, letterSpacing: "0.14em", color: C.mute }}>CONSULTANT</span>
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};
