import React from "react";
import { AbsoluteFill, OffthreadVideo, staticFile } from "remotion";
import { alpha, k, lerp, spr, useReel, useT } from "./theme";
import type { Cover, Cut } from "./types";

/*
  The clip (graded and cleaned by scripts/reel.sh) under a virtual camera. Each cut springs in from a
  little wide of its mark, then drifts tighter; the first one, with the blur-in, is the snap-zoom hook.
  Covers for burned-in text live in footage space, so they ride every zoom.
*/

function camera(t: number, cuts: Cut[], first: number) {
  const i = cuts.findLastIndex((c) => t >= c.t);
  const cut = cuts[Math.max(0, i)];
  const next = cuts[i + 1]?.t ?? cut.t + 4;
  const settle = spr(t, cut.t, 16, 120, 0.9);
  // the hook snaps harder than the cuts after it
  const kick = i <= 0 ? 0.16 : 0.09;
  let s = lerp(cut.scale, cut.scale + 0.03, Math.min(1, (t - cut.t) / Math.max(0.5, next - cut.t))) + (1 - settle) * kick;
  if (i <= 0 && t < first) s = cut.scale + kick;
  return { s, tx: Math.sin(t * 0.7) * 4, ty: Math.cos(t * 0.53) * 3 };
}

const CoverLayer: React.FC<{ c: Cover; t: number; bg: string }> = ({ c, t, bg }) => {
  const on = k(t, (c.from ?? 0) - 0.15, c.from ?? 0) * (1 - k(t, c.to ?? 1e9, (c.to ?? 1e9) + 0.15));
  if (on <= 0) return null;
  if (c.mode === "band") {
    return (
      <div
        style={{
          position: "absolute",
          left: -200,
          right: -200,
          top: c.y - 163,
          height: 2400,
          opacity: on,
          background: `linear-gradient(to bottom, ${alpha(bg, 0)} 0px, ${alpha(bg, 0.72)} 90px, ${bg} 163px)`,
        }}
      />
    );
  }
  const box = { position: "absolute" as const, left: c.x ?? 0, top: c.y, width: c.w ?? 1080, height: c.h ?? 160, opacity: on };
  // a patch is a solid box softened by its own blur
  if (c.mode === "patch") return <div style={{ ...box, background: c.color ?? bg, borderRadius: 40, filter: "blur(18px)" }} />;
  // full-width strips feather top and bottom; boxes feather all round
  const mask = (c.w ?? 1080) >= 1080 ? "linear-gradient(to bottom, transparent, black 30%, black 70%, transparent)" : "radial-gradient(farthest-side, black 55%, transparent)";
  return (
    <div
      style={{
        ...box,
        background: alpha(bg, 0.25),
        backdropFilter: "blur(34px) brightness(0.6)",
        WebkitBackdropFilter: "blur(34px) brightness(0.6)",
        maskImage: mask,
        WebkitMaskImage: mask,
      }}
    />
  );
};

export const Footage: React.FC = () => {
  const t = useT();
  const P = useReel();
  if (t > P.end.from + 0.6) return null;
  const cam = camera(t, P.cuts, 0.12);
  const open = k(t, 0, 0.28);

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          transformOrigin: `540px ${P.focusY}px`,
          scale: String(cam.s),
          translate: `${cam.tx}px ${cam.ty}px`,
          filter: `blur(${lerp(9, 0, open)}px)`,
        }}
      >
        <OffthreadVideo src={staticFile(P.footage)} muted style={{ width: 1080, height: 1920 }} />
        {P.covers.map((c, i) => (
          <CoverLayer key={i} c={c} t={t} bg={P.theme.bg} />
        ))}
        {/* grade: cool the shadows, keep the skin warm */}
        <AbsoluteFill
          style={{
            background: `radial-gradient(ellipse 70% 45% at 50% ${(P.focusY / 1920) * 100}%, rgba(255,190,140,0.07), rgba(0,0,0,0) 70%), linear-gradient(180deg, rgba(40,30,90,0.18), rgba(0,0,0,0) 40%)`,
            mixBlendMode: "soft-light",
          }}
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
