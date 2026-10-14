import { AbsoluteFill, useCurrentFrame } from "remotion";
import { CARD_IN, FPS, SINS, T } from "../data";
import { Abs, inOutCubic, lerp, prog, rnd } from "../ui";

/** Warm light leaks sweeping across on the big transitions. */
const LEAKS = [0.02, ...SINS.map((s) => s.at - CARD_IN), T.blessed, T.provider, T.dunya - 0.35, T.cta];
export const LightLeaks = () => {
  const t = useCurrentFrame() / FPS;
  return (
    <AbsoluteFill style={{ mixBlendMode: "screen", pointerEvents: "none" }}>
      {LEAKS.map((p, i) => {
        const k = (t - (p - 0.1)) / 0.85;
        if (k < 0 || k > 1) return null;
        const dir = i % 2 ? -1 : 1;
        const x = lerp(-500, 1580, inOutCubic(k));
        return (
          <Abs key={i} style={{ left: dir > 0 ? x - 600 : 1080 - x - 600, top: -200 + rnd(i) * 900, width: 1200, height: 1500, opacity: Math.sin(k * Math.PI) * 0.45,
            background: "radial-gradient(ellipse 40% 50% at 50% 50%, rgba(255,196,110,0.95), rgba(255,130,50,0.45) 40%, rgba(255,90,30,0) 72%)",
            filter: "blur(40px)", transform: `rotate(${dir * 18}deg)` }} />
        );
      })}
    </AbsoluteFill>
  );
};

/** Anamorphic flare streaks on the big hits. */
const FLARES: [number, number][] = [[T.blessed, 650], [T.provider, 620], [T.heart2, 600], [T.cta + 0.5, 960]];
export const Flares = () => {
  const t = useCurrentFrame() / FPS;
  return (
    <AbsoluteFill style={{ mixBlendMode: "screen", pointerEvents: "none" }}>
      {FLARES.map(([s, y], i) => {
        const k = prog(t, s - 0.02, 0.9);
        if (t < s - 0.02 || k >= 1) return null;
        const a = Math.min(1, (t - s + 0.02) / 0.05) * (1 - k);
        return (
          <div key={i}>
            <Abs style={{ left: -200, right: -200, top: y - 5, height: 10, opacity: a, background: "linear-gradient(90deg, rgba(0,0,0,0), rgba(255,240,205,1) 50%, rgba(0,0,0,0))", filter: "blur(3px)", transform: `scaleX(${lerp(0.4, 1.3, k)})` }} />
            <Abs style={{ left: -200, right: -200, top: y - 50, height: 100, opacity: a * 0.5, background: "linear-gradient(90deg, rgba(0,0,0,0), rgba(255,196,110,0.8) 50%, rgba(0,0,0,0))", filter: "blur(26px)" }} />
            <Abs style={{ left: 380, top: y - 160, width: 320, height: 320, borderRadius: "50%", opacity: a * 0.6, background: "radial-gradient(circle, rgba(255,240,205,1), rgba(0,0,0,0) 65%)" }} />
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

/** Dust motes drifting in the light, all the way through. */
export const Motes = () => {
  const t = useCurrentFrame() / FPS;
  return (
    <AbsoluteFill style={{ pointerEvents: "none", mixBlendMode: "screen" }}>
      {Array.from({ length: 34 }, (_, i) => {
        const sp = 18 + rnd(i) * 30;
        const y = (1980 - ((t * sp + rnd(i + 1) * 1980) % 2040));
        const x = rnd(i + 2) * 1080 + Math.sin(t * 0.5 + i) * 30;
        const r = 2 + rnd(i + 3) * 4;
        return <Abs key={i} style={{ left: x, top: y, width: r, height: r, borderRadius: "50%", background: "#FFE6B5", opacity: 0.25 + 0.35 * rnd(i + 4), filter: r > 4 ? "blur(1.5px)" : undefined }} />;
      })}
    </AbsoluteFill>
  );
};

export const Grain = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ mixBlendMode: "overlay", opacity: 0.13, pointerEvents: "none" }}>
      <svg width="1080" height="1920">
        <filter id="g">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed={f % 12} stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="1080" height="1920" filter="url(#g)" />
      </svg>
    </AbsoluteFill>
  );
};

export const Vignette = () => (
  <AbsoluteFill style={{ background: "radial-gradient(ellipse 85% 70% at 50% 45%, rgba(0,0,0,0) 60%, rgba(0,0,0,0.45) 100%)", pointerEvents: "none" }} />
);
