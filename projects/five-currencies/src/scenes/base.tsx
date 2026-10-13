import { AbsoluteFill, OffthreadVideo, staticFile, useCurrentFrame } from "remotion";
import { CAPTION_HIDE, FPS, GROUPS, KEYWORDS, T, clean } from "../data";
import { SANS, SERIF } from "../fonts";
import { Abs, goldText, inOutCubic, lerp, prog } from "../ui";

// Punch-in "cuts": each section gets its own framing, drifting slowly; 4-frame eased snap between them.
const ZOOM: [number, number, number][] = [
  [0, 1.0, 1.045],
  [T.listIn, 1.09, 1.11],
  [T.time, 1.0, 1.03],
  [T.identity, 1.1, 1.12],
  [T.money, 1.02, 1.05],
  [T.energy, 1.1, 1.12],
  [T.reputation, 1.02, 1.05],
  [T.proof, 1.13, 1.18],
  [T.cta, 1.03, 1.06],
];
const zoomAt = (t: number) => {
  let i = 0;
  while (i + 1 < ZOOM.length && t >= ZOOM[i + 1][0]) i++;
  const [a, s0, s1] = ZOOM[i];
  const b = ZOOM[i + 1]?.[0] ?? 37;
  const cur = lerp(s0, s1, (t - a) / (b - a));
  if (i === 0) return cur;
  const [pa, ps0, ps1] = ZOOM[i - 1];
  const prevEnd = ps1;
  void pa; void ps0;
  return lerp(prevEnd, cur, prog(t, a - 0.03, 0.13, inOutCubic));
};

export const Footage = () => {
  const t = useCurrentFrame() / FPS;
  const z = zoomAt(t);
  // proof beat: slightly cooler, punchier
  const p = Math.min(prog(t, T.proof, 0.2), 1 - prog(t, T.cta - 0.1, 0.25));
  return (
    <AbsoluteFill style={{ overflow: "hidden", background: "#000" }}>
      <AbsoluteFill style={{ transform: `scale(${z})`, transformOrigin: "50% 27%" }}>
        <OffthreadVideo
          src={staticFile("clean.mp4")}
          muted
          style={{
            width: 1080,
            height: 1920,
            filter: `contrast(${1.07 + 0.06 * p}) saturate(${0.9 - 0.25 * p}) brightness(${0.97 - 0.08 * p})`,
          }}
        />
      </AbsoluteFill>
      {/* warm/teal split grade */}
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(255,170,90,0.06), rgba(20,40,60,0.10))", mixBlendMode: "soft-light" }} />
    </AbsoluteFill>
  );
};

export const Shade = () => (
  <>
    <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0) 14%, rgba(0,0,0,0) 52%, rgba(0,0,0,0.38) 72%, rgba(0,0,0,0.7) 100%)" }} />
    <AbsoluteFill style={{ background: "radial-gradient(ellipse 85% 65% at 50% 38%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.45) 100%)" }} />
  </>
);

export const Grain = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ mixBlendMode: "overlay", opacity: 0.16, pointerEvents: "none" }}>
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

export const Captions = () => {
  const t = useCurrentFrame() / FPS;
  if (CAPTION_HIDE.some(([a, b]) => t >= a && t < b)) return null;
  const gi = GROUPS.findIndex((g, i) => t >= g.s - 0.08 && t < Math.min(GROUPS[i + 1]?.s ?? 99, g.e + 0.7) - 0.02);
  if (gi < 0) return null;
  const g = GROUPS[gi];
  const p = prog(t, g.s - 0.08, 0.22);
  const y = T.cta <= t ? 1410 : 1370;
  return (
    <Abs style={{ left: 60, right: 60, top: y, display: "flex", justifyContent: "center", alignItems: "baseline", flexWrap: "wrap", columnGap: 18, rowGap: 0 }}>
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
          textShadow: key ? "none" : "0 4px 18px rgba(0,0,0,0.55)",
          whiteSpace: "nowrap" as const,
        };
        return key ? (
          <span key={i} style={{ ...base, fontFamily: SERIF, fontStyle: "italic", fontSize: 92, lineHeight: "100px", filter: `${base.filter} drop-shadow(0 4px 16px rgba(0,0,0,0.5))`, ...(spoken ? goldText : { color: "#fff" }), paddingRight: 6 }}>
            {txt}
          </span>
        ) : (
          <span key={i} style={{ ...base, fontFamily: SANS, fontWeight: 700, fontSize: 64, lineHeight: "100px", letterSpacing: -1.2, color: "#fff" }}>
            {txt}
          </span>
        );
      })}
    </Abs>
  );
};
