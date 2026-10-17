import { AbsoluteFill, Img, OffthreadVideo, Sequence, staticFile, useCurrentFrame } from "remotion";
import { CAPTION_HIDE, CUT_END, DURATION, FPS, GOLD, GROUPS, ITEMS, KEYWORDS, SEGMENTS, SEG_OUT, T, cardWin, clean } from "../data";
import { ARABIC, SANS } from "../fonts";
import { Abs, bump, inOutCubic, lerp, outExpo, prog, spring } from "../ui";

// One camera for the clean plate and the speaker cut-out, so the two stay pixel-aligned.
// Hook: a fast push-out from a tight face. Every item comes back from its chapter card on a new framing (alternating
// wide / tight), drifts in slowly, and leans in a touch more while the Qur'an or hadith is quoted.
const FRAMES = [1.06, 1.16, 1.04, 1.14, 1.07, 1.17, 1.05];
export const zoomAt = (t: number) => {
  if (t < ITEMS[0].start) return lerp(1.34, 1.08, prog(t, 0, 0.7, outExpo)) + 0.03 * prog(t, 0.6, 3.2, inOutCubic);
  if (t >= T.recap) return lerp(1.1, 1.0, prog(t, T.recap, 1.2, inOutCubic));
  let k = 0;
  ITEMS.forEach((it, i) => t >= it.start && (k = i));
  const it = ITEMS[k];
  const [, out] = cardWin(it);
  const z0 = FRAMES[k];
  const lean = 0.05 * Math.min(prog(t, it.ref.at, 1.4, inOutCubic), 1 - prog(t, it.ref.until, 0.6, inOutCubic));
  return z0 + 0.025 * prog(t, out, 6, inOutCubic) + lean + 0.06 * (1 - prog(t, out - 0.1, 0.5, outExpo));
};
const CUTS = SEG_OUT.slice(1).map((f) => f / FPS);
export const camAt = (t: number) => {
  let blur = 0;
  for (const c of CUTS) blur = Math.max(blur, bump(t - c + 0.03, 0.16) * 4);
  for (const it of ITEMS) blur = Math.max(blur, bump(t - cardWin(it)[1] + 0.05, 0.3) * 8);
  const sh = bump(t - T.seven + 0.02, 0.3) * 6 + bump(t - T.rizq, 0.3) * 8;
  return { z: zoomAt(t), blur, dx: Math.sin(t * 90) * sh, dy: Math.cos(t * 77) * sh };
};

/** The room falls back (shallow focus + emerald dim) while the Qur'an or a hadith is on screen. */
export const sacredAt = (t: number) => {
  let a = 0;
  for (const it of ITEMS) a = Math.max(a, Math.min(prog(t, it.ref.at - 0.1, 0.7, inOutCubic), 1 - prog(t, it.ref.until - 0.1, 0.5, inOutCubic)));
  return a;
};

export const Plate = ({ src, still, transparent = false, dof = false }: { src: string; still: string; transparent?: boolean; dof?: boolean }) => {
  const t = useCurrentFrame() / FPS;
  const { z, blur, dx, dy } = camAt(t);
  const b = blur + (dof ? sacredAt(t) * 14 : 0);
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          transform: `translate(${dx}px, ${dy}px) scale(${z})`,
          transformOrigin: "50% 40%",
          filter: [b > 0.05 ? `blur(${b}px)` : "", "contrast(1.07) saturate(0.96) brightness(0.97)"].join(" "),
        }}
      >
        {SEGMENTS.map(([s, e], i) => (
          <Sequence key={i} from={SEG_OUT[i]} durationInFrames={e - s} layout="none">
            <OffthreadVideo src={staticFile(src)} startFrom={s} muted transparent={transparent} style={{ position: "absolute", width: 1080, height: 1920 }} />
          </Sequence>
        ))}
        <Sequence from={CUT_END} layout="none">
          <Img src={staticFile(still)} style={{ position: "absolute", width: 1080, height: 1920 }} />
        </Sequence>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export const Footage = () => <Plate src="clean.mp4" still="img/last.png" dof />;
export const Person = () => <Plate src="fg.webm" still="img/last_fg.png" transparent />;

/** Emerald dim behind the speaker during the quotes (the pattern world shows through it). */
export const BgDim = () => {
  const t = useCurrentFrame() / FPS;
  const a = Math.max(0.62 * sacredAt(t), 0.45 * prog(t, T.recap, 0.6));
  return <AbsoluteFill style={{ background: `rgba(3,20,15,${a})` }} />;
};

/** Grade: warm-gold highlights / emerald shadows, top and bottom falloff for type, vignette. */
export const Shade = () => (
  <>
    <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(255,214,150,0.14), rgba(10,70,52,0.22))", mixBlendMode: "soft-light" }} />
    <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(3,16,12,0.62) 0%, rgba(3,16,12,0.3) 18%, rgba(0,0,0,0) 30%, rgba(0,0,0,0) 56%, rgba(2,12,9,0.35) 70%, rgba(2,12,9,0.78) 100%)" }} />
    <AbsoluteFill style={{ background: "radial-gradient(ellipse 90% 66% at 50% 42%, rgba(0,0,0,0) 55%, rgba(2,12,9,0.5) 100%)" }} />
  </>
);

export const Grain = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ mixBlendMode: "overlay", opacity: 0.1, pointerEvents: "none" }}>
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

export const CAPTION_Y = 1520;

/** Word-by-word captions: ivory, the spoken word lifts into a gold foil pill; keywords stay gold once said. */
export const Captions = () => {
  const t = useCurrentFrame() / FPS;
  if (t >= DURATION || CAPTION_HIDE.some(([a, b]) => t >= a && t < b)) return null;
  const gi = GROUPS.findIndex((g, i) => t >= g.s - 0.08 && t < Math.min(GROUPS[i + 1]?.s ?? 99, g.e + 0.6) - 0.02);
  if (gi < 0) return null;
  const g = GROUPS[gi];
  const p = prog(t, g.s - 0.08, 0.2);
  return (
    <Abs style={{ left: 50, right: 50, top: CAPTION_Y, display: "flex", justifyContent: "center", alignItems: "center", flexWrap: "wrap", columnGap: 12, rowGap: 6 }}>
      {g.words.map((w, i) => {
        const next = g.words[i + 1];
        const active = t >= w.s - 0.04 && t < (next ? next.s - 0.04 : g.e + 0.6);
        const spoken = t >= w.s - 0.04;
        const pop = spring(t, w.s - 0.04, 3, 9);
        const key = KEYWORDS.has(clean(w.w));
        const salawat = w.w === "ﷺ";
        const txt = w.w.replace(/[.,]$/, "");
        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              padding: salawat ? "0 14px 0" : "2px 16px 8px",
              borderRadius: 18,
              fontFamily: salawat ? ARABIC : SANS,
              fontWeight: salawat ? 700 : 800,
              fontSize: salawat ? 84 : 66,
              letterSpacing: salawat ? 0 : -1.5,
              lineHeight: "78px",
              color: active ? "#1B1406" : spoken && key ? GOLD : "#FFF9EE",
              opacity: p * (spoken ? 1 : 0.42),
              transform: `translateY(${(1 - p) * 26}px) scale(${active ? lerp(0.86, 1.06, Math.min(1.2, pop)) : 1}) rotate(${active ? -1.5 : 0}deg)`,
              background: active ? "linear-gradient(176deg, #FFF0C6 0%, #EFCB80 45%, #C99A45 100%)" : "transparent",
              boxShadow: active ? "0 10px 30px rgba(201,154,69,0.45), inset 0 1px 0 rgba(255,255,255,0.6)" : "none",
              textShadow: active ? "none" : "0 4px 18px rgba(0,0,0,0.7), 0 2px 4px rgba(0,0,0,0.45)",
              filter: `blur(${(1 - p) * 8}px)`,
              whiteSpace: "nowrap",
            }}
          >
            {txt}
          </span>
        );
      })}
    </Abs>
  );
};
