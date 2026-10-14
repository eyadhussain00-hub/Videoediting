import { AbsoluteFill, OffthreadVideo, staticFile, useCurrentFrame } from "remotion";
import { CAPTION_HIDE, DURATION, FPS, GROUPS, KEYWORDS, T, clean } from "../data";
import { SANS, SERIF } from "../fonts";
import { Abs, iceText, dawnText, inOutCubic, lerp, prog } from "../ui";

// Punch-in "cuts": each section gets its own framing, drifting slowly; a short eased snap between them.
const ZOOM: [number, number, number][] = [
  [0, 1.12, 1.03],
  [T.s1, 1.0, 1.03],
  [T.s2, 1.08, 1.1],
  [T.s3, 1.0, 1.03],
  [T.s4, 1.07, 1.1],
  [T.s5, 1.0, 1.03],
  [T.s6, 1.08, 1.1],
  [T.payoff, 1.02, 1.12],
  [T.offer, 1.0, 1.03],
  [T.ihsan, 1.08, 1.1],
  [T.youGet, 1.0, 1.02],
  [T.choice, 1.06, 1.09],
  [T.or, 1.0, 1.06],
  [T.cta, 1.06, 1.09],
];
const zoomAt = (t: number) => {
  let i = 0;
  while (i + 1 < ZOOM.length && t >= ZOOM[i + 1][0]) i++;
  const [a, s0, s1] = ZOOM[i];
  const b = ZOOM[i + 1]?.[0] ?? DURATION;
  const cur = lerp(s0, s1, (t - a) / (b - a));
  if (i === 0) return cur;
  const prevEnd = ZOOM[i - 1][2];
  return lerp(prevEnd, cur, prog(t, a - 0.03, 0.13, inOutCubic));
};

// Section changes get a short punch: blur/scale kick on top of the framing snap.
export const PUNCHES = [T.s1, T.s2, T.s3, T.s4, T.s5, T.s6, T.payoff, T.unrec, T.offer, T.ihsan, T.youGet, T.choice, T.or, T.cta];
const bump = (x: number, d: number) => (x < 0 || x > d ? 0 : Math.sin((x / d) * Math.PI));
export const camAt = (t: number) => {
  let blur = 0;
  let kick = 0;
  for (const p of PUNCHES) {
    blur = Math.max(blur, bump(t - p + 0.07, 0.22) * 5);
    kick = Math.max(kick, bump(t - p + 0.07, 0.3) * 0.035);
  }
  return { z: zoomAt(t) * (1 + kick), blur };
};

/** How much the picture is pushed toward the dawn grade (warm) vs the night grade (cool). */
export const dawnAt = (t: number) => Math.min(prog(t, T.s4 + 0.3, 1.6, inOutCubic), 1 - prog(t, T.s6 - 0.3, 0.6, inOutCubic));

/** Clean plate (or the person-only alpha layer) framed by the shared camera, so both stay pixel-aligned. */
export const Plate = ({ src, transparent = false, grade = true }: { src: string; transparent?: boolean; grade?: boolean }) => {
  const t = useCurrentFrame() / FPS;
  const { z, blur } = camAt(t);
  const d = dawnAt(t);
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <AbsoluteFill style={{ transform: `scale(${z})`, transformOrigin: "50% 38%", filter: blur > 0.05 ? `blur(${blur}px)` : undefined }}>
        <OffthreadVideo
          src={staticFile(src)}
          muted
          transparent={transparent}
          style={{
            width: 1080,
            height: 1920,
            filter: grade ? `contrast(1.12) saturate(${lerp(0.72, 0.95, d)}) brightness(${lerp(0.93, 1.0, d)})` : undefined,
          }}
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

/** Grade over background and speaker alike: cold blue night, warmed during the Fajr / barakah beat. */
export const Shade = () => {
  const t = useCurrentFrame() / FPS;
  const d = dawnAt(t);
  return (
    <>
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(60,130,210,0.30), rgba(10,30,60,0.32))", mixBlendMode: "soft-light", opacity: 1 - d }} />
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(255,170,90,0.28), rgba(120,50,20,0.20))", mixBlendMode: "soft-light", opacity: d }} />
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(2,8,16,0.42) 0%, rgba(0,0,0,0) 15%, rgba(0,0,0,0) 52%, rgba(2,6,12,0.34) 68%, rgba(2,6,12,0.74) 100%)" }} />
      <AbsoluteFill style={{ background: "radial-gradient(ellipse 85% 65% at 50% 40%, rgba(0,0,0,0) 55%, rgba(0,6,14,0.5) 100%)" }} />
    </>
  );
};

export const Grain = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ mixBlendMode: "overlay", opacity: 0.14, pointerEvents: "none" }}>
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

export const CAPTION_Y = 1560;

export const Captions = () => {
  const t = useCurrentFrame() / FPS;
  if (CAPTION_HIDE.some(([a, b]) => t >= a && t < b)) return null;
  const gi = GROUPS.findIndex((g, i) => t >= g.s - 0.08 && t < Math.min(GROUPS[i + 1]?.s ?? 99, g.e + 0.7) - 0.02);
  if (gi < 0) return null;
  const g = GROUPS[gi];
  const p = prog(t, g.s - 0.08, 0.22);
  const warm = dawnAt(t) > 0.5;
  return (
    <Abs style={{ left: 50, right: 50, top: CAPTION_Y, display: "flex", justifyContent: "center", alignItems: "baseline", flexWrap: "wrap", columnGap: 18, rowGap: 0 }}>
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
          <span
            key={i}
            style={{
              ...base,
              fontFamily: SERIF,
              fontStyle: "italic",
              fontSize: 92,
              lineHeight: "100px",
              filter: `${base.filter} drop-shadow(0 4px 16px rgba(0,0,0,0.55)) drop-shadow(0 0 18px ${warm ? "rgba(255,190,110,0.35)" : "rgba(140,200,255,0.35)"})`,
              ...(spoken ? (warm ? dawnText : iceText) : { color: "#fff" }),
              paddingRight: 6,
              paddingLeft: 4,
            }}
          >
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
