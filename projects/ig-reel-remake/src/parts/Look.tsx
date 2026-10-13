import { AbsoluteFill, useCurrentFrame } from "remotion";
import { B, env } from "../beats";

/** Finishing layers over everything: split-tone, vignette, light leak, film grain. */
export const Look = () => {
  const f = useCurrentFrame();
  const t = f / 30;
  const leak = env(t, B.expose, 51.6, 0.8, 1.0) * 0.55 + env(t, B.bond, 55.4, 0.3, 0.8) * 0.35;
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {/* split tone: warm highlights from the top, cool shadows from the bottom */}
      <AbsoluteFill
        style={{
          background: "linear-gradient(180deg, rgba(255,170,110,0.10) 0%, rgba(0,0,0,0) 45%, rgba(20,60,80,0.16) 100%)",
          mixBlendMode: "soft-light",
        }}
      />
      <AbsoluteFill
        style={{ background: "radial-gradient(ellipse 85% 70% at 50% 38%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.55) 100%)" }}
      />
      {leak > 0 && (
        <AbsoluteFill
          style={{
            opacity: leak,
            mixBlendMode: "screen",
            background: `radial-gradient(ellipse 60% 45% at ${10 + ((t - B.expose) / 7) * 80}% 22%, rgba(255,140,60,0.75) 0%, rgba(255,90,40,0.25) 40%, rgba(0,0,0,0) 70%)`,
          }}
        />
      )}
      <svg width="1080" height="1920" style={{ position: "absolute", inset: 0, opacity: 0.11, mixBlendMode: "overlay" }}>
        <filter id="grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed={f % 12} stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#grain)" />
      </svg>
    </AbsoluteFill>
  );
};
