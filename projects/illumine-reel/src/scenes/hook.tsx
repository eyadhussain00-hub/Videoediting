import { useCurrentFrame } from "remotion";
import { BLUE, CH, CREAM, FPS, GOLD, RED, T } from "../data";
import { MONO, SANS, SERIF } from "../fonts";
import { Abs, Kicker, Lock, bump, inCubic, lerp, metal, outBack, outExpo, prog, spring } from "../ui";
import { Cam } from "./base";

/** "ISA vs SIPP" in huge metallic type behind him (he stands in front of it), built word by word. */
export const TitleBehind = () => {
  const t = useCurrentFrame() / FPS;
  if (t > CH.isa + 0.6) return null;
  const out = prog(t, CH.isa - 0.12, 0.45, inCubic);
  const a = spring(t, T.isa1 - 0.12, 1.8, 6);
  const b = spring(t, T.sipp1 - 0.12, 1.8, 6);
  const vs = prog(t, T.sipp1 - 0.3, 0.3);
  const word = (p: number, extra = {}) => ({
    opacity: Math.min(1, p * 1.4) * (1 - out),
    transform: `translateY(${(1 - Math.min(1, p)) * 120 - out * 260}px) scale(${lerp(0.7, 1, Math.min(1.1, p))})`,
    filter: `blur(${Math.max(0, 1 - p) * 18 + out * 20}px)`,
    ...extra,
  });
  return (
    <>
      <Abs style={{ right: 70, top: 190, fontFamily: SERIF, fontSize: 290, lineHeight: "270px", letterSpacing: -6, transformOrigin: "80% 80%", ...metal("gold"), ...word(a) }}>ISA</Abs>
      <Abs style={{ right: 440, top: 420, fontFamily: SERIF, fontStyle: "italic", fontSize: 110, color: CREAM, opacity: vs * (1 - out), transform: `translateY(${-out * 200}px)`, textShadow: "0 4px 20px rgba(0,0,0,0.5)" }}>vs</Abs>
      <Abs style={{ right: 40, top: 470, fontFamily: SERIF, fontSize: 250, lineHeight: "240px", letterSpacing: -5, transformOrigin: "80% 80%", ...metal("blue"), ...word(b) }}>SIPP</Abs>
    </>
  );
};

// The two glasses (source pixels): the clear one holds £50s = the ISA, the blue one £10s = the SIPP.
export const GLASS = { isa: { x: 437, y: 1600 }, sipp: { x: 817, y: 1600 } };

/** Name tags pinned to the glasses for the whole video; the one being talked about lights up. */
export const GlassTags = () => {
  const t = useCurrentFrame() / FPS;
  if (t >= T.endCard) return null;
  const focus = (k: "isa" | "sipp") => {
    if (t < CH.isa) return 1;
    if (t < CH.sipp) return k === "isa" ? 1 : 0.35;
    if (t < CH.verdict) return k === "sipp" ? 1 : 0.35;
    if (t < T.use) return 1;
    if (t < T.sipp4 - 0.1) return k === "isa" ? 1 : 0.35;
    if (t < CH.outro) return k === "sipp" ? 1 : 0.35;
    return 0.7;
  };
  const tag = (k: "isa" | "sipp", label: string, start: number, col: string) => {
    const p = spring(t, start - 0.08, 2.2, 7);
    if (p <= 0) return null;
    const f = focus(k);
    const ping = bump(t - start + 0.05, 0.5) + bump(t - T.both2, 0.45) + (k === "isa" ? bump(t - T.isa3, 0.45) : bump(t - T.sipp4, 0.45));
    const { x, y } = GLASS[k];
    return (
      <Abs key={k} style={{ left: x, top: y, transform: `translate(-50%, -50%) scale(${lerp(0.4, 1, Math.min(1.1, p)) * (0.92 + 0.08 * f)})`, opacity: Math.min(1, p * 2) * (0.45 + 0.55 * f) }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "12px 22px 12px 16px",
            borderRadius: 999,
            background: "rgba(8,10,20,0.62)",
            backdropFilter: "blur(14px)",
            border: `2px solid ${col}${f > 0.5 ? "" : "55"}`,
            boxShadow: `0 0 ${20 + 40 * ping}px ${col}${f > 0.5 ? "88" : "22"}, 0 12px 30px rgba(0,0,0,0.45)`,
            whiteSpace: "nowrap",
          }}
        >
          <div style={{ width: 16, height: 16, borderRadius: 8, background: col, boxShadow: `0 0 12px ${col}` }} />
          <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 30, letterSpacing: 1, color: CREAM }}>{label}</div>
        </div>
      </Abs>
    );
  };
  return (
    <Cam>
      {tag("isa", "STOCKS & SHARES ISA", T.isa1, GOLD)}
      {tag("sipp", "SIPP", T.sipp1, BLUE)}
    </Cam>
  );
};

/** The SIPP glass gets padlocked on "you can't touch the money", and unlocks again on "when you do". */
export const GlassLock = () => {
  const t = useCurrentFrame() / FPS;
  if (t < T.cant - 0.3 || t > T.first25 + 0.8) return null;
  const p = spring(t, T.cant - 0.1, 2, 7);
  const open = prog(t, T.when - 0.05, 0.3, outBack);
  const gone = prog(t, T.first25, 0.6, inCubic);
  const { x } = GLASS.sipp;
  const band = prog(t, T.cant, 0.35, outExpo);
  return (
    <Cam>
      {/* chain band around the glass */}
      <Abs style={{ left: x - 140, top: 1660, width: 280 * band, height: 22, borderRadius: 11, opacity: 1 - gone, background: `repeating-linear-gradient(90deg, ${RED} 0 22px, #7a1d17 22px 30px)`, boxShadow: `0 0 24px ${RED}88`, transform: "rotate(-4deg)" }} />
      <Abs style={{ left: x, top: 1600, transform: `translate(-50%, -50%) scale(${lerp(2.2, 1, Math.min(1, p))}) rotate(${(1 - Math.min(1, p)) * -25}deg)`, opacity: Math.min(1, p * 2) * (1 - gone) }}>
        <div style={{ width: 150, height: 150, borderRadius: 40, background: "rgba(20,6,6,0.75)", border: `3px solid ${RED}`, display: "grid", placeItems: "center", boxShadow: `0 0 50px ${RED}aa` }}>
          <Lock size={104} color={open > 0.02 ? GOLD : "#FFE5E0"} open={open} sw={2.2} />
        </div>
      </Abs>
    </Cam>
  );
};

/** Chapter bar along the top: 01 ISA → 02 SIPP → THE CATCH → 03 VERDICT. */
export const ChapterBar = () => {
  const t = useCurrentFrame() / FPS;
  const items: [number, number, string, string, string][] = [
    [CH.isa, CH.sipp, "01", "Stocks & Shares ISA", GOLD],
    [CH.sipp, CH.catch, "02", "SIPP · Personal pension", BLUE],
    [CH.catch, T.when - 0.1, "!!", "The catch", RED],
    [T.when - 0.1, CH.verdict, "02", "SIPP · Taking it out", BLUE],
    [CH.verdict, CH.outro, "03", "The verdict", CREAM],
  ];
  return (
    <>
      {items.map(([a, b, n, label, col], i) => {
        if (t < a - 0.1 || t > b + 0.5) return null;
        const pin = prog(t, a, 0.5, outExpo);
        const pout = prog(t, b - 0.05, 0.35, inCubic);
        return (
          <Abs key={i} style={{ left: 56, top: 118, display: "flex", alignItems: "center", gap: 18, opacity: pin * (1 - pout), transform: `translateX(${(1 - pin) * -60 + pout * 40}px)`, filter: `blur(${(1 - pin) * 10 + pout * 10}px)` }}>
            <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 30, color: "#0B1020", background: col, borderRadius: 10, padding: "4px 12px" }}>{n}</div>
            <div style={{ width: 70 * pin, height: 3, background: col, borderRadius: 2 }} />
            <Kicker color={CREAM} style={{ fontSize: 28, letterSpacing: 4, textShadow: "0 2px 10px rgba(0,0,0,0.6)" }}>
              {label}
            </Kicker>
          </Abs>
        );
      })}
    </>
  );
};
