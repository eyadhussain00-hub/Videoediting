import { useCurrentFrame } from "remotion";
import { CREAM, FPS, GOLD, MINT, T } from "../data";
import { MONO } from "../fonts";
import { Abs, IconCheck, IconDumbbell, IconEye, IconUser, glass, lerp, outBack, outExpo, prog, spring, win } from "../ui";

// Chapter 03 in the lounger shot: the DM he describes, written out as he says it, with his rules tagged above.
const S = () => T.structured - 0.25;
const E = () => T.tips - 0.12;

const type = (t: number, text: string, a: number, b: number) => text.slice(0, Math.round(prog(t, a, b - a, (x) => x) * text.length));

const Bubble = ({ text, full, t0, icon }: { text: string; full: string; t0: number; icon?: boolean }) => {
  const t = useCurrentFrame() / FPS;
  if (t < t0) return null;
  const p = spring(t, t0, 2.4, 8);
  const done = text.length >= full.length;
  return (
    <div style={{ display: "flex", justifyContent: "flex-end", transform: `translateY(${(1 - Math.min(1, p)) * 24}px) scale(${lerp(0.9, 1, Math.min(1, p))})`, transformOrigin: "100% 100%", opacity: Math.min(1, p * 2) }}>
      <div
        style={{
          maxWidth: 640,
          padding: "18px 26px",
          borderRadius: "30px 30px 8px 30px",
          background: `linear-gradient(180deg, #FFE7B0, ${GOLD} 70%, #D2A456)`,
          color: "#17120A",
          fontWeight: 650,
          fontSize: 36,
          lineHeight: "46px",
          boxShadow: "0 10px 26px rgba(200,150,60,0.3)",
          position: "relative",
        }}
      >
        {/* reserve the final size so the bubble doesn't reflow while typing */}
        <span style={{ visibility: "hidden" }}>{full}</span>
        <span style={{ position: "absolute", left: 26, top: 18, right: 26 }}>
          {text}
          {!done && <span style={{ opacity: Math.round(t * 4) % 2, fontWeight: 400 }}>|</span>}
          {done && icon && (
            <span style={{ display: "inline-block", verticalAlign: "-6px", marginLeft: 10 }}>
              <IconDumbbell size={36} color="#17120A" sw={2.2} />
            </span>
          )}
        </span>
      </div>
    </div>
  );
};

const RULES = [
  { label: "Straight to the point", t: () => T.straight },
  { label: "Personalised", t: () => T.personalised },
  { label: "About them", t: () => T.about },
];

export const DmCard = () => {
  const t = useCurrentFrame() / FPS;
  const s = S();
  const e = E();
  if (t < s || t > e + 0.3) return null;
  const a = win(t, s, e + 0.2, 0.2, 0.25);
  const card = spring(t, s, 1.6, 7);
  const B1 = "Hi! I'm a commission-based appointment setter.";
  const B2 = "I'm also into my fitness";
  const B3 = "I admire what you do for people.";
  const look = prog(t, T.looked - 0.1, 0.35, outExpo);
  return (
    <>
      <Abs style={{ left: 60, right: 60, top: 650, display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 14, opacity: a }}>
        {RULES.map((r, i) => {
          const p = prog(t, r.t() - 0.15, 0.35, outBack);
          if (t < r.t() - 0.15) return null;
          return (
            <div key={i} style={{ ...glass, borderRadius: 999, padding: "12px 24px 12px 14px", display: "flex", alignItems: "center", gap: 12, transform: `scale(${lerp(0.5, 1, p)})`, opacity: Math.min(1, p * 2) }}>
              <div style={{ width: 40, height: 40, borderRadius: 20, background: MINT, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <IconCheck size={26} color="#0C2A1C" sw={3} />
              </div>
              <span style={{ fontWeight: 700, fontSize: 32 }}>{r.label}</span>
            </div>
          );
        })}
      </Abs>
      <Abs style={{ left: 80, right: 80, top: 830, opacity: a, transform: `translateY(${(1 - Math.min(1, card)) * 140}px) scale(${lerp(0.9, 1, Math.min(1, card))})` }}>
        <div style={{ ...glass, borderRadius: 44, minHeight: 380, padding: "26px 30px 30px", display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 18, paddingBottom: 18, borderBottom: "1.5px solid rgba(255,255,255,0.12)" }}>
            <div style={{ width: 76, height: 76, borderRadius: 38, padding: 3, background: `conic-gradient(${GOLD}, #FFE3A6, #B98A3E, ${GOLD})` }}>
              <div style={{ width: "100%", height: "100%", borderRadius: 36, background: "#1B1D22", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <IconUser size={40} color={CREAM} sw={1.8} />
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 750, fontSize: 34 }}>Fitness coach</div>
              <div style={{ fontFamily: MONO, fontSize: 22, color: "rgba(251,244,232,0.55)" }}>New message · cold outreach</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 18px", borderRadius: 999, background: `rgba(126,226,176,${0.16 * look})`, border: `1.5px solid rgba(126,226,176,${0.6 * look})`, opacity: look, transform: `scale(${lerp(0.7, 1, look)})` }}>
              <IconEye size={30} color={MINT} sw={2} />
              <span style={{ fontWeight: 700, fontSize: 24, color: MINT }}>Profile checked</span>
            </div>
          </div>
          <Bubble t0={T.hi - 0.15} full={B1} text={type(t, B1, T.hi - 0.1, T.setter2 + 0.35)} />
          <Bubble t0={T.fitness1 - 0.3} full={B2} icon text={type(t, B2, T.fitness1 - 0.25, T.fitness2 + 0.3)} />
          <Bubble t0={T.admire - 0.35} full={B3} text={type(t, B3, T.admire - 0.3, T.people + 0.1)} />
        </div>
      </Abs>
    </>
  );
};
