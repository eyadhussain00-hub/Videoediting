import { useCurrentFrame } from "remotion";
import { CAPTION_HIDE, FPS, GROUPS, IVORY, KEYWORDS, clean } from "../data";
import { SANS, SERIF } from "../fonts";
import { Abs, goldText, lerp, prog } from "../ui";

export const CAPTION_Y = 1520;

/** Word-by-word captions under the window; keywords in gold serif italic. Hidden while a graphic says the words. */
export const Captions = () => {
  const t = useCurrentFrame() / FPS;
  if (CAPTION_HIDE.some(([a, b]) => t >= a && t < b)) return null;
  const gi = GROUPS.findIndex((g, i) => t >= g.s - 0.08 && t < Math.min(GROUPS[i + 1]?.s ?? 99, g.e + 0.7) - 0.02);
  if (gi < 0) return null;
  const g = GROUPS[gi];
  const p = prog(t, g.s - 0.08, 0.22);
  return (
    <Abs style={{ left: 50, right: 50, top: CAPTION_Y, display: "flex", justifyContent: "center", alignItems: "baseline", flexWrap: "wrap", columnGap: 18 }}>
      {g.words.map((w, i) => {
        const key = KEYWORDS.has(clean(w.w));
        const spoken = t >= w.s - 0.03;
        const pp = prog(t, w.s - 0.03, 0.2);
        const txt = w.w.replace(/[.,]$/, "");
        const base = {
          display: "inline-block",
          opacity: p * (spoken ? 1 : 0.32),
          transform: `translateY(${(1 - p) * 22}px) scale(${key && spoken ? lerp(1.16, 1, pp) : 1})`,
          whiteSpace: "nowrap" as const,
        };
        return key ? (
          <span key={i} style={{ ...base, fontFamily: SERIF, fontStyle: "italic", fontSize: 96, lineHeight: "104px", paddingRight: 6, paddingLeft: 4,
            filter: `blur(${(1 - p) * 9}px) drop-shadow(0 4px 16px rgba(0,0,0,0.6)) drop-shadow(0 0 18px rgba(233,201,131,0.35))`,
            ...(spoken ? goldText : { color: IVORY }) }}>
            {txt}
          </span>
        ) : (
          <span key={i} style={{ ...base, filter: `blur(${(1 - p) * 9}px)`, fontFamily: SANS, fontWeight: 700, fontSize: 64, lineHeight: "104px", letterSpacing: -1.2, color: IVORY,
            textShadow: "0 4px 18px rgba(0,0,0,0.65)" }}>
            {txt}
          </span>
        );
      })}
    </Abs>
  );
};
