import type { CSSProperties, ReactNode } from "react";
import { AbsoluteFill, interpolate } from "remotion";
import {
  GOLD, GOLD_SOLID, MONO, SANS, SERIF, SERIF_I, blurIn, env, glass, goldText, inCubic, mono, outBack, outExpo, prog, rnd, useT,
} from "../theme";

const Abs = ({ style, children }: { style: CSSProperties; children?: ReactNode }) => (
  <div style={{ position: "absolute", ...style }}>{children}</div>
);

/* ---------- 0.0–2.4  Hook: $10,000/month counter → "means absolutely nothing." ---------- */
export const Hook = () => {
  const t = useT();
  if (t > 2.5) return null;
  const out = prog(t, 2.22, 2.45, inCubic);
  const n = Math.min(10000, Math.round(10040 * prog(t, 0.02, 0.62, outExpo)) );
  const strike = prog(t, 1.68, 1.95, outExpo);
  const dim = prog(t, 1.68, 1.9);
  const exit: CSSProperties = { opacity: 1 - out, filter: `blur(${out * 16}px)`, transform: `translateY(${-out * 40}px)` };
  const nothing = prog(t, 1.66, 1.9, outExpo);
  return (
    <AbsoluteFill style={exit}>
      <Abs style={{ top: 250, left: 0, right: 0, textAlign: "center", ...blurIn(prog(t, 0, 0.28), 30) }}>
        <div style={{ position: "relative", display: "inline-block" }}>
          <div style={{ fontFamily: SERIF, fontSize: 210, lineHeight: 1, letterSpacing: "-0.02em", ...goldText,
            filter: `drop-shadow(0 0 30px rgba(233,194,122,${0.5 * (1 - dim)})) grayscale(${dim * 0.85})`, opacity: 1 - dim * 0.45 }}>
            ${n.toLocaleString("en-US")}
          </div>
          <div style={{ position: "absolute", left: -20, top: "54%", height: 7, width: `${strike * 108}%`, borderRadius: 4,
            background: "linear-gradient(90deg,#fff,#F1CF86)", boxShadow: "0 0 20px rgba(255,220,150,0.8)", transform: "rotate(-4deg)" }} />
        </div>
        <div style={{ ...mono(30, { color: "rgba(255,238,210,0.78)" }), marginTop: 10 }}>per month</div>
      </Abs>
      {/* bottom line: "means absolutely" → "nothing." */}
      <Abs style={{ top: 1250, left: 0, right: 0, height: 240, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ position: "absolute", display: "flex", gap: 16, opacity: 1 - prog(t, 1.6, 1.72) }}>
          {[["means", 0.66], ["absolutely", 0.98]].map(([w, s]) => (
            <span key={w as string} style={{ fontFamily: SANS, fontWeight: 300, fontSize: 64, color: "#fff", textShadow: "0 3px 16px rgba(0,0,0,0.7)", ...blurIn(prog(t, (s as number) - 0.05, (s as number) + 0.2), 18) }}>{w}</span>
          ))}
        </div>
        <div style={{ position: "absolute", fontFamily: SERIF_I, fontSize: 170, color: "#fff", lineHeight: 1,
          opacity: nothing, filter: `blur(${(1 - nothing) * 18}px) drop-shadow(0 0 26px rgba(255,255,255,0.35))`,
          transform: `scale(${1.35 - 0.35 * nothing})`, letterSpacing: "-0.01em" }}>
          nothing.
        </div>
      </Abs>
    </AbsoluteFill>
  );
};

/* ---------- 2.45–8.5  Reel title kicker (replaces the original white title box) ---------- */
export const Kicker = () => {
  const t = useT();
  const o = env(t, 2.45, 8.5, 0.5, 0.3);
  if (o <= 0) return null;
  const line = prog(t, 2.5, 3.1, outExpo);
  return (
    <Abs style={{ top: 236, left: 0, right: 0, display: "flex", alignItems: "center", justifyContent: "center", gap: 18, opacity: o }}>
      <div style={{ width: 60 * line, height: 1.5, background: GOLD_SOLID }} />
      <div style={{ ...mono(25, { color: "rgba(255,240,215,0.92)", letterSpacing: "0.2em" }), ...blurIn(o, 10) }}>
        The only mindset to <span style={{ color: GOLD_SOLID }}>$10K/month</span>
      </div>
      <div style={{ width: 60 * line, height: 1.5, background: GOLD_SOLID }} />
    </Abs>
  );
};

/* ---------- 3.5–8.5  "Same bed / same partner / same clients" glass tiles ---------- */
const Icon = ({ d, vb = "0 0 64 64", size = 58 }: { d: string; vb?: string; size?: number }) => (
  <svg width={size} height={size} viewBox={vb} fill="none" stroke={GOLD_SOLID} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);
const BED = "M6 48V18 M6 38h52v10 M58 48V34a6 6 0 0 0-6-6H30v10 M12 32a5 5 0 1 0 10 0a5 5 0 1 0-10 0";
const HEART = "M32 52 L12 32 A11 11 0 0 1 32 16 A11 11 0 0 1 52 32 Z";
const CASE = "M8 22h48v30H8z M24 22v-6h16v6 M8 34h48";

export const SameTiles = () => {
  const t = useT();
  if (t < 3.5 || t > 8.6) return null;
  const tiles = [
    { s: 3.66, icon: BED, word: "bed", sub: "next morning" },
    { s: 5.0, icon: HEART, word: "love", sub: "same partner" },
    { s: 6.86, icon: CASE, word: "clients", sub: "maybe a few extra" },
  ];
  return (
    <Abs style={{ top: 296, left: 66, right: 66, display: "flex", gap: 22 }}>
      {tiles.map((x, i) => {
        const p = prog(t, x.s - 0.04, x.s + 0.42, outBack);
        const q = prog(t, x.s - 0.04, x.s + 0.3);
        const out = prog(t, 8.3 + i * 0.05, 8.5 + i * 0.05, inCubic);
        return (
          <div key={i} style={{ ...glass, flex: 1, height: 236, padding: "26px 22px", display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 10,
            opacity: q * (1 - out), transform: `translateY(${(1 - p) * 50 - out * 30}px) scale(${0.85 + 0.15 * p})`, filter: `blur(${(1 - q) * 10 + out * 10}px)`, position: "relative" }}>
            <Icon d={x.icon} />
            <div style={{ fontFamily: SERIF_I, fontSize: 52, lineHeight: 1, color: "#fff" }}>
              <span style={goldText}>Same</span> {x.word}
            </div>
            <div style={mono(15, { color: "rgba(255,240,215,0.6)", letterSpacing: "0.2em" })}>{x.sub}</div>
            {i === 2 && (
              <div style={{ position: "absolute", top: -18, right: -14, width: 74, height: 74, borderRadius: 37, background: GOLD, display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: SANS, fontWeight: 800, fontSize: 30, color: "#1a1206", boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
                transform: `scale(${prog(t, 8.1, 8.4, outBack)})` }}>+2</div>
            )}
          </div>
        );
      })}
    </Abs>
  );
};

/* ---------- 8.6–11.75  Give: gold coins rise, Family / Friends chips ---------- */
export const Give = () => {
  const t = useT();
  if (t < 9.4 || t > 11.85) return null;
  const out = prog(t, 11.55, 11.8, inCubic);
  const coins = Array.from({ length: 18 }, (_, i) => i);
  const chip = (label: string, s: number, left: number) => {
    const p = prog(t, s - 0.05, s + 0.4, outBack);
    const q = prog(t, s - 0.05, s + 0.25);
    return (
      <div style={{ ...glass, position: "absolute", top: 420, left, height: 96, padding: "0 34px", borderRadius: 48, display: "flex", alignItems: "center", gap: 16,
        opacity: q, transform: `translateY(${(1 - p) * 40}px) scale(${0.8 + 0.2 * p})`, filter: `blur(${(1 - q) * 10}px)` }}>
        <Icon d={HEART} size={44} />
        <span style={{ fontFamily: SERIF_I, fontSize: 56, color: "#fff", lineHeight: 1 }}>{label}</span>
      </div>
    );
  };
  return (
    <AbsoluteFill style={{ opacity: 1 - out, filter: `blur(${out * 12}px)` }}>
      {coins.map((i) => {
        const s = 9.55 + rnd(i) * 0.7;
        const p = prog(t, s, s + 1.7, (x) => 1 - Math.pow(1 - x, 2));
        if (p <= 0) return null;
        const x0 = 110 + rnd(i + 40) * 860;
        const y = interpolate(p, [0, 1], [640, 230 + rnd(i + 9) * 80]);
        const spin = Math.cos((t - s) * (5 + rnd(i + 3) * 5) + i);
        const size = 40 + rnd(i + 7) * 30;
        return (
          <div key={i} style={{ position: "absolute", left: x0 + Math.sin(p * 3 + i) * 30, top: y, width: size, height: size, borderRadius: "50%",
            background: "radial-gradient(circle at 35% 30%, #FFF4D2 0%, #F1CF86 35%, #B98A3E 80%)", border: "2px solid rgba(255,236,190,0.8)",
            transform: `scaleX(${Math.max(0.12, Math.abs(spin))})`, opacity: Math.min(1, p * 6) * (1 - prog(p, 0.75, 1)),
            boxShadow: "0 0 18px rgba(241,207,134,0.55)", display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: SERIF, fontSize: size * 0.62, color: "#8A5E1F" }}>$</div>
        );
      })}
      {chip("Family", 10.18, 120)}
      {chip("Friends", 11.46, 560)}
    </AbsoluteFill>
  );
};

/* ---------- 12.45–15.7  Business-class boarding pass → posted-on-Instagram card + LARP stamp ---------- */
const bez = (p: number) => {   // quadratic bezier for the flight arc in a 360×110 box
  const [x0, y0, cx, cy, x1, y1] = [10, 95, 180, -25, 350, 95];
  const x = (1 - p) ** 2 * x0 + 2 * (1 - p) * p * cx + p * p * x1;
  const y = (1 - p) ** 2 * y0 + 2 * (1 - p) * p * cy + p * p * y1;
  const dx = 2 * (1 - p) * (cx - x0) + 2 * p * (x1 - cx);
  const dy = 2 * (1 - p) * (cy - y0) + 2 * p * (y1 - cy);
  return { x, y, a: (Math.atan2(dy, dx) * 180) / Math.PI };
};

export const Flight = () => {
  const t = useT();
  if (t < 12.4 || t > 15.75) return null;
  const inP = prog(t, 12.45, 12.95, outExpo);
  const flip = prog(t, 14.06, 14.24, inCubic);       // pass turns away
  const flipIn = prog(t, 14.22, 14.5, outExpo);      // post turns in
  const out = prog(t, 15.5, 15.72, inCubic);
  const fly = prog(t, 13.25, 14.05, (x) => x * x * (3 - 2 * x));
  const pl = bez(fly);
  const likes = Math.round(12408 * prog(t, 14.45, 15.15, outExpo));
  const stamp = prog(t, 14.28, 14.46, outExpo);
  return (
    <AbsoluteFill style={{ perspective: 1400, opacity: 1 - out, filter: `blur(${out * 12}px)` }}>
      {flip < 1 && (
        <div style={{ ...glass, position: "absolute", top: 270, left: 80, width: 920, height: 300, padding: "28px 40px",
          opacity: inP, transform: `translateY(${(1 - inP) * 60}px) rotateX(${(1 - inP) * 28}deg) rotateY(${flip * 90}deg)`, transformOrigin: "50% 50%" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={mono(18, { color: GOLD_SOLID })}>Boarding pass</div>
            <div style={{ ...mono(16, { color: "#1a1206", letterSpacing: "0.22em", fontWeight: 700 }), background: GOLD, padding: "8px 16px", borderRadius: 20 }}>Business class</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 14 }}>
            <div style={{ fontFamily: SERIF, fontSize: 104, color: "#fff", lineHeight: 1 }}>LHR</div>
            <svg width={360} height={110} style={{ overflow: "visible" }}>
              <path d="M10 95 Q180 -25 350 95" stroke="rgba(255,236,200,0.28)" strokeWidth={2.5} strokeDasharray="4 10" fill="none" strokeLinecap="round" />
              <path d="M10 95 Q180 -25 350 95" stroke={GOLD_SOLID} strokeWidth={3} fill="none" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - fly} strokeLinecap="round" />
              <g transform={`translate(${pl.x} ${pl.y}) rotate(${pl.a})`} opacity={prog(t, 13.1, 13.3)}>
                <path d="M-14 0 L14 0 M4 0 L-6 -12 M4 0 L-6 12 M-12 0 L-16 -6 M-12 0 L-16 6" stroke="#fff" strokeWidth={3.5} strokeLinecap="round" />
              </g>
            </svg>
            <div style={{ fontFamily: SERIF, fontSize: 104, color: "#fff", lineHeight: 1 }}>DXB</div>
          </div>
          <div style={{ borderTop: "2px dashed rgba(255,236,200,0.22)", marginTop: 18, paddingTop: 16, display: "flex", justifyContent: "space-between" }}>
            {["Seat 2A", "Gate B12", "Boarding 21:40"].map((x) => <div key={x} style={mono(17, { color: "rgba(255,240,215,0.72)", letterSpacing: "0.2em" })}>{x}</div>)}
          </div>
        </div>
      )}
      {flipIn > 0 && (
        <div style={{ position: "absolute", top: 300, left: 110, width: 860, height: 230 }}>
          <div style={{ ...glass, position: "absolute", inset: 0, padding: "0 40px", display: "flex", alignItems: "center", gap: 28,
            opacity: flipIn, transform: `rotateY(${(1 - flipIn) * -90}deg)` }}>
            <div style={{ width: 118, height: 118, borderRadius: 59, padding: 5, background: GOLD, flexShrink: 0 }}>
              <div style={{ width: "100%", height: "100%", borderRadius: "50%", background: "radial-gradient(circle at 40% 35%, #3a4566, #121827)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: SERIF_I, fontSize: 60, color: "#fff" }}>T</div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 40, color: "#fff" }}>tomhutchmove</div>
              <div style={{ fontFamily: SANS, fontWeight: 400, fontSize: 27, color: "rgba(255,240,215,0.7)", marginTop: 6 }}>posted from seat 2A ✈</div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <svg width={54} height={54} viewBox="0 0 64 64"><path d={HEART} fill="#F25C6E" /></svg>
              <div style={{ fontFamily: MONO, fontSize: 24, color: "#fff", fontWeight: 600 }}>{likes.toLocaleString("en-US")}</div>
            </div>
          </div>
          {stamp > 0 && (
            <div style={{ position: "absolute", right: 40, top: -62, padding: "4px 26px 10px", border: `5px solid ${GOLD_SOLID}`, borderRadius: 18,
              fontFamily: SERIF_I, fontSize: 96, lineHeight: 1, color: GOLD_SOLID, background: "rgba(10,12,20,0.55)",
              opacity: stamp, transform: `rotate(-9deg) scale(${2.2 - 1.2 * stamp})`, boxShadow: "0 0 30px rgba(233,194,122,0.35)" }}>LARP</div>
          )}
        </div>
      )}
    </AbsoluteFill>
  );
};
