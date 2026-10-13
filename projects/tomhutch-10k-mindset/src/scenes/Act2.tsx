import type { CSSProperties } from "react";
import { AbsoluteFill, interpolate } from "remotion";
import {
  CORAL, GOLD, GOLD_SOLID, MONO, SANS, SERIF, SERIF_I, SRC_END, blurIn, env, glass, goldText, inCubic, inOut, mono, outBack, outExpo, prog, rnd, useT,
} from "../theme";

/* ---------- 16.4–17.4  "nothing really / changes." (B&W + letterbox) ---------- */
export const Changes = () => {
  const t = useT();
  const o = env(t, 16.36, 17.42, 0.05, 0.14);
  if (o <= 0) return null;
  const w = (s: number) => prog(t, s - 0.04, s + 0.24);
  const c = prog(t, 16.9, 17.15, outExpo);
  return (
    <AbsoluteFill style={{ top: 290, height: 380, alignItems: "center", opacity: o }}>
      <div style={{ display: "flex", gap: 22 }}>
        {[["nothing", 16.4], ["really", 16.64]].map(([x, s]) => (
          <span key={x as string} style={{ fontFamily: SANS, fontWeight: 200, fontSize: 74, color: "#fff", letterSpacing: "0.02em", ...blurIn(w(s as number), 20) }}>{x}</span>
        ))}
      </div>
      <div style={{ fontFamily: SERIF_I, fontSize: 200, lineHeight: 0.95, color: "#fff", opacity: c, filter: `blur(${(1 - c) * 20}px) drop-shadow(0 0 30px rgba(255,255,255,0.3))`,
        transform: `scale(${1.25 - 0.25 * c})`, letterSpacing: "-0.015em" }}>changes.</div>
    </AbsoluteFill>
  );
};

/* ---------- 17.45–18.65  Game HUD: XP bar fills, flashes, resets — same level ---------- */
export const GameHud = () => {
  const t = useT();
  const o = env(t, 17.45, 18.68, 0.3, 0.2);
  if (o <= 0) return null;
  const fill = t < 18.22 ? prog(t, 17.6, 18.12, inOut) : 1 - prog(t, 18.22, 18.36, outExpo);
  const flash = Math.max(0, 1 - Math.abs(t - 18.15) / 0.09);
  const reset = t >= 18.22;
  return (
    <div style={{ ...glass, position: "absolute", top: 320, left: 140, width: 800, height: 150, padding: "0 36px", display: "flex", alignItems: "center", gap: 30, ...blurIn(o, 30) }}>
      <div>
        <div style={mono(15, { color: "rgba(255,240,215,0.6)" })}>Level</div>
        <div style={{ fontFamily: SERIF, fontSize: 70, lineHeight: 1, ...goldText }}>$10K</div>
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
          <span style={mono(15, { color: "#fff" })}>{reset ? "Same game ↻" : "Level up"}</span>
          <span style={mono(15, { color: GOLD_SOLID })}>{reset ? "+0" : `${Math.round(fill * 100)}%`}</span>
        </div>
        <div style={{ height: 16, borderRadius: 8, background: "rgba(255,255,255,0.1)", overflow: "hidden" }}>
          <div style={{ width: `${fill * 100}%`, height: "100%", background: GOLD, boxShadow: `0 0 ${10 + flash * 30}px rgba(241,207,134,${0.5 + flash * 0.5})` }} />
        </div>
      </div>
    </div>
  );
};

/* ---------- 19.0–23.6  $10K on a pedestal → pedestal sinks → it comes to you (zoom-through) ---------- */
export const Pedestal = () => {
  const t = useT();
  if (t < 18.95 || t > 23.62) return null;
  const draw = prog(t, 19.0, 19.75, inOut);
  const solid = prog(t, 19.55, 19.95);
  const sink = prog(t, 20.9, 21.45, inCubic);
  const drop = prog(t, 19.45, 19.85, outBack);
  const glow = Math.min(prog(t, 19.95, 20.25), 1 - prog(t, 20.9, 21.3));
  const lower = prog(t, 22.0, 22.9, inOut);          // "stop looking up to it"
  const come = prog(t, 23.0, 23.5, (x) => x * x * x); // "it comes to you"
  const enter = prog(t, 18.95, 19.3);
  const moneyY = 248 + (1 - drop) * -60 + sink * 50 + lower * 50;
  const moneyStyle: CSSProperties = {
    position: "absolute", left: 0, right: 0, top: moneyY, textAlign: "center", fontFamily: SERIF, fontSize: 140, lineHeight: 1,
    opacity: Math.min(drop * 1.5, 1) * (1 - prog(t, 23.35, 23.5)),
    transform: `scale(${(1 - sink * 0.15) * (1 + come * 7)})`, transformOrigin: "50% 60%",
    filter: `blur(${come * 10}px) drop-shadow(0 0 ${12 + glow * 36}px rgba(241,207,134,${0.35 + glow * 0.5}))`,
    ...goldText,
  };
  return (
    <AbsoluteFill style={{ opacity: enter }}>
      {/* spotlight */}
      <div style={{ position: "absolute", left: 310, top: 200, width: 460, height: 350, opacity: glow * 0.9,
        background: "linear-gradient(180deg, rgba(255,236,190,0.0) 0%, rgba(255,236,190,0.22) 100%)", clipPath: "polygon(42% 0, 58% 0, 100% 100%, 0 100%)", filter: "blur(6px)" }} />
      {/* pedestal */}
      <svg width={320} height={200} viewBox="0 0 320 200" style={{ position: "absolute", left: 420, top: 392, width: 240, height: 150, transform: `translateY(${sink * 260}px)`, opacity: 1 - sink }}>
        <defs>
          <linearGradient id="ped" x1="0" x2="1">
            <stop offset="0" stopColor="#1b2133" /><stop offset="0.5" stopColor="#3a425a" /><stop offset="1" stopColor="#141a29" />
          </linearGradient>
        </defs>
        <path d="M70 8 H250 V30 H70 Z M95 30 V165 M125 30 V165 M160 30 V165 M195 30 V165 M225 30 V165 M95 165 H225 M50 165 H270 V192 H50 Z M95 30 H225 V165 H95 Z"
          fill="url(#ped)" fillOpacity={solid * 0.95} stroke={GOLD_SOLID} strokeWidth={2.5} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - draw} strokeLinejoin="round" />
      </svg>
      <div style={moneyStyle}>$10K</div>
      {/* rays on "pedestalizing" */}
      {glow > 0 && Array.from({ length: 10 }, (_, i) => (
        <div key={i} style={{ position: "absolute", left: 539, top: 320, width: 3, height: 90 + rnd(i) * 60, background: "linear-gradient(180deg, rgba(255,230,170,0.9), rgba(255,230,170,0))",
          transformOrigin: "50% 0", transform: `rotate(${i * 36 + t * 30}deg) translateY(${110 + glow * 30}px)`, opacity: glow * 0.7 }} />
      ))}
      <div style={{ position: "absolute", top: 228, left: 0, right: 0, textAlign: "center", ...mono(18, { color: "rgba(255,240,215,0.75)" }), opacity: Math.min(prog(t, 19.8, 20.1), 1 - sink) }}>
        Stop pedestalizing it
      </div>
    </AbsoluteFill>
  );
};

/* ---------- 24.2–27.35  Mind (outline) → Reality (solid gold) ---------- */
export const MindReality = () => {
  const t = useT();
  const o = env(t, 24.2, 27.38, 0.3, 0.22);
  if (o <= 0) return null;
  const wipe = prog(t, 24.45, 25.4, inOut);
  const real = prog(t, 26.2, 26.55, outExpo);
  const chip = t < 26.5 ? "In your mind" : "In your reality";
  const chipIn = t < 26.5 ? prog(t, 24.5, 24.8) : prog(t, 26.5, 26.75);
  const base: CSSProperties = { position: "absolute", left: 0, right: 0, top: 250, textAlign: "center", fontFamily: SERIF, fontSize: 240, lineHeight: 1, letterSpacing: "-0.02em" };
  return (
    <AbsoluteFill style={{ opacity: o }}>
      <div style={{ ...base, color: "transparent", WebkitTextStroke: `2px ${GOLD_SOLID}`, clipPath: `inset(0 ${(1 - wipe) * 100}% 0 0)`, opacity: 1 - real * 0.9 }}>$10K</div>
      {wipe > 0 && wipe < 1 && (
        <div style={{ position: "absolute", top: 260, height: 230, left: 300 + wipe * 480, width: 3, background: "linear-gradient(180deg, transparent, #FFE7B0, transparent)", boxShadow: "0 0 20px #F1CF86" }} />
      )}
      <div style={{ ...base, ...goldText, opacity: real, transform: `scale(${1.08 - 0.08 * real})`, filter: `drop-shadow(0 0 ${40 * real}px rgba(241,207,134,0.6))` }}>$10K</div>
      {real > 0 && Array.from({ length: 9 }, (_, i) => {
        const p = prog(t, 26.25 + rnd(i) * 0.4, 26.85 + rnd(i) * 0.4);
        const s = Math.sin(p * Math.PI);
        return (
          <svg key={i} width={40} height={40} viewBox="-10 -10 20 20" style={{ position: "absolute", left: 260 + rnd(i + 5) * 540, top: 240 + rnd(i + 11) * 230, transform: `scale(${s}) rotate(${p * 90}deg)`, opacity: s }}>
            <path d="M0 -10 Q1 -1 10 0 Q1 1 0 10 Q-1 1 -10 0 Q-1 -1 0 -10Z" fill="#FFF0C8" />
          </svg>
        );
      })}
      <div style={{ position: "absolute", top: 512, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
        <div style={{ ...mono(18, { color: t < 26.5 ? "#fff" : "#1a1206", fontWeight: 700 }), padding: "12px 24px", borderRadius: 30,
          background: t < 26.5 ? "rgba(10,13,22,0.6)" : GOLD, border: `1.5px solid ${GOLD_SOLID}`, ...blurIn(chipIn, 12) }}>{chip}</div>
      </div>
    </AbsoluteFill>
  );
};

/* ---------- 27.4–30.9  Emotional state line: volatile → regulated ---------- */
const W = 860, Hh = 150;
const yAt = (x: number) => {
  const calm = Math.min(1, Math.max(0, (x - 260) / 360));
  const k = calm * calm * (3 - 2 * calm);
  const amp = 62 * (1 - k) + 7;
  const m = x % 105;
  const spike = Math.exp(-((m - 52) ** 2) / 18) * 1.6 - Math.exp(-((m - 62) ** 2) / 14) * 0.9;
  const wobble = Math.sin(x * 0.11) * 0.35 + Math.sin(x * 0.31 + 1.3) * 0.25;
  return Hh / 2 - amp * ((1 - k) * (spike + wobble) + k * Math.sin(x * 0.045));
};
export const Emotions = () => {
  const t = useT();
  const o = env(t, 27.4, 30.9, 0.35, 0.25);
  if (o <= 0) return null;
  const head = W * prog(t, 27.5, 30.4, (x) => x);
  const pts: string[] = [];
  for (let x = 0; x <= head; x += 3) pts.push(`${x.toFixed(1)},${yAt(x).toFixed(1)}`);
  const calm = t > 28.75;
  const bpm = Math.round(interpolate(t, [27.5, 29.6], [128, 68], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
  return (
    <div style={{ ...glass, position: "absolute", top: 290, left: 70, width: 940, height: 280, padding: "24px 40px", ...blurIn(o, 30) }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={mono(16, { color: "rgba(255,240,215,0.65)" })}>Emotional state</div>
        <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
          <span style={{ fontFamily: MONO, fontSize: 22, color: "#fff", fontWeight: 600 }}>{bpm}<span style={{ fontSize: 14, opacity: 0.6 }}> BPM</span></span>
          <span style={{ ...mono(16, { fontWeight: 700, color: calm ? "#1a1206" : "#fff" }), padding: "8px 16px", borderRadius: 20, background: calm ? GOLD : CORAL }}>
            {calm ? "Regulated" : "Volatile"}
          </span>
        </div>
      </div>
      <svg width={W} height={Hh + 20} style={{ marginTop: 18, overflow: "visible" }}>
        <defs>
          <linearGradient id="ecg" x1="0" x2={W} gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor={CORAL} /><stop offset="0.45" stopColor={CORAL} /><stop offset="0.75" stopColor={GOLD_SOLID} /><stop offset="1" stopColor="#FFF0C8" />
          </linearGradient>
        </defs>
        <line x1={0} x2={W} y1={Hh / 2} y2={Hh / 2} stroke="rgba(255,255,255,0.08)" strokeWidth={1.5} />
        <polyline points={pts.join(" ")} fill="none" stroke="url(#ecg)" strokeWidth={4} strokeLinejoin="round" strokeLinecap="round" style={{ filter: "drop-shadow(0 0 6px rgba(241,207,134,0.5))" }} />
        {head > 0 && <circle cx={head} cy={yAt(head)} r={8} fill="#FFF0C8" style={{ filter: "drop-shadow(0 0 10px #F1CF86)" }} />}
      </svg>
    </div>
  );
};

/* ---------- 30.96–33.1  "You're welcome." + end card on the frozen frame ---------- */
export const End = () => {
  const t = useT();
  if (t < 30.9) return null;
  const a = prog(t, 30.94, 31.2);
  const b = prog(t, 31.0, 31.35, outExpo);
  const card = prog(t, SRC_END + 0.15, SRC_END + 0.6, outExpo);
  const click = t > 32.45;
  const press = 1 - 0.08 * Math.max(0, 1 - Math.abs(t - 32.42) / 0.08);
  const shimmer = interpolate(t, [31.1, 32.2], [-60, 160], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const lift = prog(t, SRC_END, SRC_END + 0.6, inOut);
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", top: 300 + lift * 330, left: 0, right: 0, textAlign: "center" }}>
        <div style={{ fontFamily: SANS, fontWeight: 300, fontSize: 70, color: "#fff", ...blurIn(a, 20) }}>You're</div>
        <div style={{ fontFamily: SERIF_I, fontSize: 210, lineHeight: 0.95, opacity: b, transform: `scale(${1.2 - 0.2 * b})`, filter: `blur(${(1 - b) * 18}px) drop-shadow(0 0 30px rgba(241,207,134,0.45))`,
          backgroundImage: `linear-gradient(100deg, rgba(0,0,0,0) ${shimmer - 20}%, rgba(255,255,255,0.95) ${shimmer}%, rgba(0,0,0,0) ${shimmer + 20}%), ${GOLD}`,
          WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>welcome.</div>
      </div>
      {card > 0 && (
        <div style={{ position: "absolute", top: 1080, left: 0, right: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 26, ...blurIn(card, 40) }}>
          <div style={{ width: 120 * card, height: 1.5, background: GOLD_SOLID }} />
          <div style={{ fontFamily: SANS, fontWeight: 600, fontSize: 56, color: "#fff", letterSpacing: "-0.01em" }}>@tomhutchmove</div>
          <div style={mono(19, { color: "rgba(255,240,215,0.7)" })}>Follow for the mindset</div>
          <div style={{ marginTop: 10, padding: "22px 64px", borderRadius: 50, transform: `scale(${press * (0.9 + 0.1 * prog(t, SRC_END + 0.3, SRC_END + 0.7, outBack))})`,
            background: click ? "rgba(10,13,22,0.7)" : GOLD, border: `2px solid ${GOLD_SOLID}`, fontFamily: SANS, fontWeight: 700, fontSize: 38,
            color: click ? GOLD_SOLID : "#1a1206", boxShadow: "0 10px 40px rgba(241,207,134,0.3)" }}>
            {click ? "Following ✓" : "Follow"}
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};
