import { AbsoluteFill, OffthreadVideo, staticFile, useCurrentFrame } from "remotion";
import { CAPTION_HIDE, DURATION, FPS, GROUPS, KEYWORDS, T, clean } from "../data";
import { SANS, SERIF } from "../fonts";
import { Abs, goldText, inOutCubic, lerp, prog } from "../ui";

// Framing: each beat gets its own scale, drifting slowly; a 3-frame eased snap between them (cuts without a cut).
const ZOOM: [number, number, number][] = [
  [0, 1.0, 1.04], [T.first, 1.09, 1.11], [T.three, 1.02, 1.05],
  [T.ch1, 1.0, 1.03], [T.wrong, 1.12, 1.13], [12.292, 1.02, 1.05], [T.follow, 1.06, 1.08], [T.respect, 1.11, 1.12],
  [21.75, 1.02, 1.04], [23.583, 1.0, 1.06], [25.417, 1.07, 1.1],
  [T.ch2, 1.0, 1.03], [T.hard, 1.05, 1.07], [T.richTwo, 1.12, 1.13], [34.792, 1.0, 1.08], [39.792, 1.02, 1.04],
  [T.painful, 1.1, 1.11], [43.542, 1.03, 1.05], [46.833, 1.06, 1.08], [48.25, 1.0, 1.05], [51.583, 1.02, 1.04],
  [T.where, 1.08, 1.1], [55.458, 1.0, 1.04], [T.hundred, 1.13, 1.15],
  [T.ch3, 1.0, 1.03], [T.attention, 1.06, 1.08], [65.583, 1.0, 1.05], [69.292, 1.02, 1.04], [T.lose, 1.1, 1.11],
  [T.average, 1.03, 1.05], [75.375, 1.0, 1.04], [77.375, 1.0, 1.04], [79.083, 1.0, 1.04],
  [T.listen, 1.03, 1.1], [T.somebody, 1.06, 1.09], [T.breakW, 1.13, 1.15], [T.let, 1.02, 1.1],
];
const zoomAt = (t: number) => {
  let i = 0;
  while (i + 1 < ZOOM.length && t >= ZOOM[i + 1][0]) i++;
  const [a, s0, s1] = ZOOM[i];
  const b = ZOOM[i + 1]?.[0] ?? DURATION;
  const cur = lerp(s0, s1, (t - a) / (b - a));
  if (i === 0) return cur;
  return lerp(ZOOM[i - 1][2], cur, prog(t, a - 0.02, 0.12, inOutCubic));
};

// Big hits get a blur/scale kick on top of the framing snap.
export const PUNCHES = [T.first, T.ch1, T.wrong, T.ch2, T.richTwo, T.hundred, T.ch3, T.lose, T.breakW, T.you];
const bump = (x: number, d: number) => (x < 0 || x > d ? 0 : Math.sin((x / d) * Math.PI));
export const camAt = (t: number) => {
  let blur = 0, kick = 0;
  for (const p of PUNCHES) {
    blur = Math.max(blur, bump(t - p + 0.06, 0.22) * 5);
    kick = Math.max(kick, bump(t - p + 0.06, 0.3) * 0.035);
  }
  return { z: zoomAt(t) * (1 + kick), blur };
};

/** Footage (or the person-only alpha layer) framed by the shared camera, so both stay pixel-aligned. */
export const Plate = ({ src, transparent = false }: { src: string; transparent?: boolean }) => {
  const t = useCurrentFrame() / FPS;
  const { z, blur } = camAt(t);
  const lb = Math.min(prog(t, T.listen - 0.1, 0.5), 1 - prog(t, T.end - 0.3, 0.3)); // moodier for the close
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <AbsoluteFill style={{ transform: `scale(${z})`, transformOrigin: "50% 28%", filter: blur > 0.05 ? `blur(${blur}px)` : undefined }}>
        <OffthreadVideo
          src={staticFile(src)}
          muted
          transparent={transparent}
          style={{ width: 1080, height: 1920, filter: `contrast(${1.07 + 0.05 * lb}) saturate(${0.92 - 0.14 * lb}) brightness(${0.99 - 0.05 * lb})` }}
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export const Footage = () => (
  <AbsoluteFill style={{ background: "#000" }}>
    <Plate src="clean.mp4" />
  </AbsoluteFill>
);

/** Grade: warm highlights / cool shadows, top+bottom falloff for type, vignette. */
export const Shade = () => (
  <>
    <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(255,175,95,0.07), rgba(18,36,58,0.12))", mixBlendMode: "soft-light" }} />
    <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.42) 0%, rgba(0,0,0,0) 13%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.32) 70%, rgba(0,0,0,0.66) 100%)" }} />
    <AbsoluteFill style={{ background: "radial-gradient(ellipse 88% 66% at 50% 36%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.5) 100%)" }} />
  </>
);

export const Grain = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ mixBlendMode: "overlay", opacity: 0.15, pointerEvents: "none" }}>
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

export const CAPTION_Y = 1330;
export const Captions = () => {
  const t = useCurrentFrame() / FPS;
  if (CAPTION_HIDE.some(([a, b]) => t >= a && t < b)) return null;
  const gi = GROUPS.findIndex((g, i) => t >= g.s - 0.08 && t < Math.min(GROUPS[i + 1]?.s ?? 999, g.e + 0.7) - 0.02);
  if (gi < 0) return null;
  const g = GROUPS[gi];
  const p = prog(t, g.s - 0.08, 0.22);
  return (
    <Abs style={{ left: 70, right: 70, top: CAPTION_Y, display: "flex", justifyContent: "center", alignItems: "baseline", flexWrap: "wrap", columnGap: 16 }}>
      {g.words.map((w, i) => {
        const key = KEYWORDS.has(clean(w.w));
        const spoken = t >= w.s - 0.03;
        const pop = prog(t, w.s - 0.03, 0.2);
        const txt = w.w.replace(/[.,]$/, "");
        const base = {
          display: "inline-block",
          opacity: p * (spoken ? 1 : 0.34),
          transform: `translateY(${(1 - p) * 22}px) scale(${key && spoken ? lerp(1.14, 1, pop) : 1})`,
          filter: `blur(${(1 - p) * 9}px)`,
          textShadow: key ? "none" : "0 4px 18px rgba(0,0,0,0.6)",
          whiteSpace: "nowrap" as const,
        };
        return key ? (
          <span key={i} style={{ ...base, fontFamily: SERIF, fontStyle: "italic", fontSize: 92, lineHeight: "100px", filter: `${base.filter} drop-shadow(0 4px 16px rgba(0,0,0,0.55))`, ...(spoken ? goldText : { color: "#fff" }), paddingRight: 6 }}>
            {txt}
          </span>
        ) : (
          <span key={i} style={{ ...base, fontFamily: SANS, fontWeight: 700, fontSize: 62, lineHeight: "100px", letterSpacing: -1.2, color: "#fff" }}>
            {txt}
          </span>
        );
      })}
    </Abs>
  );
};
