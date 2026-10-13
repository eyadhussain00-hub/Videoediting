import { useCurrentFrame } from "remotion";
import { CURRENCIES, FPS, GOLD, T } from "../data";
import { MONO, SANS } from "../fonts";
import { Abs, ICONS, glass, inOutCubic, lerp, outBack, outCubic, prog } from "../ui";

export const ROW_TOP = 880;
export const ROW_H = 104;
export const ROW_GAP = 14;
const LEFT = 90;
const WIDTH = 900;

/** Five numbered chips pop in on "five", then fly into the list as its number circles; each row unrolls on its word. */
export const FiveList = () => {
  const t = useCurrentFrame() / FPS;
  if (t < T.five - 0.1 || t > T.time + 0.6) return null;
  const toList = prog(t, T.listIn, 0.45, inOutCubic);
  return (
    <>
      {CURRENCIES.map((c, i) => {
        const Icon = ICONS[i];
        // chip position: row of 5 squares at y 1010 → number circle of row i
        const pop = prog(t, T.five + i * 0.06, 0.42, outBack);
        const cx0 = 540 + (i - 2) * 106;
        const cy0 = 1060;
        const cx1 = LEFT + 18 + 34;
        const cy1 = ROW_TOP + i * (ROW_H + ROW_GAP) + ROW_H / 2;
        const lt = Math.max(0, toList - i * 0.06) / (1 - i * 0.06);
        const cx = lerp(cx0, cx1, inOutCubic(Math.min(1, lt)));
        const cy = lerp(cy0, cy1, inOutCubic(Math.min(1, lt)));
        const size = lerp(88, 68, lt);
        const radius = lerp(20, 34, lt);
        // row unroll
        const wt = T.list[i];
        const un = prog(t, wt - 0.12, 0.45, outCubic);
        const out = prog(t, T.time - 0.25 + (4 - i) * 0.035, 0.35, inOutCubic);
        const lit = t >= wt - 0.05;
        const exitX = i === 0 ? 0 : out * 140;
        const alpha = i === 0 ? 1 - prog(t, T.time, 0.2) : 1 - out;
        return (
          <div key={c.n}>
            {un > 0 && (
              <Abs
                style={{
                  ...glass,
                  left: LEFT + exitX,
                  top: cy1 - ROW_H / 2,
                  width: lerp(ROW_H, WIDTH, un),
                  height: ROW_H,
                  borderRadius: 30,
                  opacity: alpha,
                  overflow: "hidden",
                  borderColor: lit ? "rgba(242,196,109,0.38)" : "rgba(255,255,255,0.13)",
                }}
              >
                <Abs style={{ left: 120, top: 0, height: ROW_H, display: "flex", alignItems: "center", gap: 18, opacity: prog(t, wt, 0.3), transform: `translateX(${(1 - prog(t, wt, 0.4)) * -24}px)` }}>
                  <span style={{ fontFamily: SANS, fontWeight: 700, fontSize: 50, color: "#fff", letterSpacing: -1.5 }}>{c.name}</span>
                </Abs>
                <Abs style={{ right: 34, top: 0, height: ROW_H, display: "flex", alignItems: "center", gap: 18, opacity: prog(t, wt + 0.08, 0.3) }}>
                  <span style={{ fontFamily: MONO, fontSize: 22, color: "rgba(255,255,255,0.45)", letterSpacing: 2 }}>CURRENCY 0{c.n}</span>
                  <Icon size={44} />
                </Abs>
              </Abs>
            )}
            {/* chip / number circle */}
            <Abs
              style={{
                ...glass,
                background: lit ? "linear-gradient(180deg,#FFE3A3,#E9B85C 55%,#C8902E)" : "rgba(245,245,245,0.94)",
                border: "none",
                left: cx - size / 2 + exitX,
                top: cy - size / 2,
                width: size,
                height: size,
                borderRadius: radius,
                transform: `scale(${pop})`,
                opacity: Math.min(pop * 1.4, 1) * alpha,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: MONO,
                fontWeight: 700,
                fontSize: 36,
                color: "#111",
                boxShadow: lit ? `0 0 34px rgba(242,196,109,0.55), 0 10px 30px rgba(0,0,0,0.35)` : "0 0 30px rgba(255,214,140,0.35), 0 10px 30px rgba(0,0,0,0.35)",
              }}
            >
              {c.n}
            </Abs>
          </div>
        );
      })}
      {/* "5 things" label under the chips during the hook */}
      <Abs style={{ left: 0, right: 0, top: 1130, textAlign: "center", fontFamily: MONO, fontSize: 24, letterSpacing: 6, color: GOLD, opacity: Math.min(prog(t, T.five + 0.35, 0.3), 1 - prog(t, T.listIn - 0.1, 0.2)) }}>
        THE ONLY 5 THINGS PEOPLE BUY
      </Abs>
    </>
  );
};
