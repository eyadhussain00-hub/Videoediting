import type React from "react";
import { useCurrentFrame } from "remotion";
import { FPS, T, TEAL } from "../data";
import { MONO, SANS, SERIF } from "../fonts";
import { Abs, AMBER, BONE, EMBER, IconBolt, IconBrain, IconDrop, IconHeart, IconSearch, IconShield, IconX, RED, bump, glass, inOutCubic, lerp, outBack, outExpo, prog, rnd, spring, win } from "../ui";
import { BigType, Blink, Chip, Ecg } from "./hud";
import { bpmAt } from "./hook";

const useT = () => useCurrentFrame() / FPS;


/** "a great sales conversation, everything's flowing … price … decision … boom" — the call's waveform. */
export const CallFlow = () => {
  const t = useT();
  const a = T.great - 0.2, b = T.fight - 0.05;
  const v = win(t, a, b, 0.3, 0.2);
  if (v <= 0.001) return null;
  const boom = prog(t, T.boom - 0.03, 0.12);
  const tension = prog(t, T.present, T.boom - T.present, inOutCubic);
  const W = 920, H = 220;
  const pts: string[] = [];
  for (let i = 0; i <= 160; i++) {
    const x = (i / 160) * W;
    const k = i / 160;
    const calm = Math.sin(k * 14 + t * 5) * 0.35 + Math.sin(k * 31 - t * 7) * 0.12;
    const jag = (rnd(i + Math.floor(t * 20) * 3) - 0.5) * 2.2;
    const y = lerp(calm * lerp(1, 0.25, tension), jag, boom) * (H * 0.42) * (0.35 + 0.65 * Math.sin(k * Math.PI));
    pts.push(`${x.toFixed(1)},${(H / 2 + y).toFixed(1)}`);
  }
  const col = boom > 0.5 ? RED : tension > 0.4 ? AMBER : TEAL;
  const steps: [string, number][] = [["RAPPORT", T.great], ["FLOW", T.flowing], ["PRICE", T.price], ["DECISION?", T.decision]];
  return (
    <Abs style={{ left: 50, right: 50, top: 120, padding: "24px 30px 26px", borderRadius: 36, ...glass, borderColor: boom > 0.5 ? "rgba(255,46,58,0.6)" : "rgba(244,239,230,0.16)", opacity: v, transform: `translateY(${(1 - prog(t, a, 0.5, outExpo)) * -60}px) translateX(${Math.sin(t * 90) * bump(t - T.boom, 0.4) * 14}px)` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{ fontFamily: MONO, fontSize: 24, letterSpacing: 4, color: BONE }}>LIVE CALL</div>
        <Blink t={t} color={col} />
      </div>
      <svg width={W - 60} height={H} viewBox={`0 0 ${W} ${H}`} style={{ marginTop: 6, overflow: "visible" }}>
        <polyline points={pts.join(" ")} fill="none" stroke={col} strokeWidth={5} strokeLinejoin="round" style={{ filter: `drop-shadow(0 0 10px ${col})` }} />
      </svg>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
        {steps.map(([s, at], i) => {
          const p = prog(t, at - 0.1, 0.35, outBack);
          const last = i >= 2;
          return (
            <div key={s} style={{ padding: "8px 18px", borderRadius: 30, fontFamily: MONO, fontWeight: 700, fontSize: 24, letterSpacing: 2, opacity: lerp(0.25, 1, p), transform: `scale(${lerp(0.85, 1, p)})`, color: p > 0.5 ? (last ? "#111" : "#06251c") : BONE, background: p > 0.5 ? (last ? AMBER : TEAL) : "rgba(255,255,255,0.06)" }}>
              {s}
            </div>
          );
        })}
      </div>
    </Abs>
  );
};

/** BOOM: shockwave ring + word. */
export const Boom = () => {
  const t = useT();
  const k = t - T.boom + 0.04;
  if (k < 0 || k > 1.0) return null;
  const r = lerp(40, 1300, outExpo(Math.min(1, k / 0.8)));
  const o = 1 - k;
  return (
    <>
      <Abs style={{ left: 540 - r, top: 900 - r, width: r * 2, height: r * 2, borderRadius: r * 2, border: `${lerp(30, 2, k)}px solid rgba(255,90,31,${o})`, boxShadow: `0 0 80px rgba(255,46,58,${o})` }} />
      <Abs style={{ left: 0, right: 0, top: 640, textAlign: "center", fontFamily: SANS, fontWeight: 900, fontSize: 260, letterSpacing: -10, color: "#fff", opacity: Math.min(1, 3 * (1 - k)), transform: `scale(${lerp(1.5, 1, prog(k, 0, 0.25, outExpo)) + k * 0.15})`, textShadow: `0 0 80px ${RED}, 0 0 20px ${EMBER}` }}>
        BOOM
      </Abs>
    </>
  );
};

/** "fight or flight mode" behind him, then the definition card for "anticipatory anxiety". */
export const FightFlightType = () => {
  const t = useT();
  return (
    <>
      <BigType t={t} a={T.fight - 0.08} b={T.anticipatory - 0.1} text="FIGHT" y={190} size={290} color="rgba(255,46,58,1)" spacing={-8} />
      <BigType t={t} a={T.flight - 0.1} b={T.anticipatory - 0.1} text="FLIGHT" y={470} size={290} color="rgba(244,239,230,1)" stroke spacing={-6} glow={false} />
    </>
  );
};
export const FightFlightTag = () => {
  const t = useT();
  const v = win(t, T.or - 0.05, T.anticipatory - 0.1, 0.2, 0.2);
  if (v <= 0.001) return null;
  return (
    <Abs style={{ left: 0, right: 0, top: 1460, textAlign: "center", opacity: v }}>
      <span style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 84, color: BONE, textShadow: "0 6px 30px rgba(0,0,0,0.7)" }}>
        or <span style={{ color: EMBER }}>flight</span> mode.
      </span>
    </Abs>
  );
};
export const Definition = () => {
  const t = useT();
  const a = T.anticipatory - 0.12, b = T.brain - 0.1;
  const v = win(t, a, b, 0.25, 0.25);
  if (v <= 0.001) return null;
  const p = prog(t, a, 0.55, outExpo);
  return (
    <Abs style={{ left: 60, right: 60, top: 1300, padding: "34px 40px", borderRadius: 34, ...glass, opacity: v, transform: `translateY(${(1 - p) * 80}px)` }}>
      <div style={{ fontFamily: SERIF, fontSize: 80, lineHeight: 1, color: BONE }}>
        anticipatory <span style={{ fontStyle: "italic", color: EMBER }}>anxiety</span>
      </div>
      <div style={{ fontFamily: MONO, fontSize: 24, letterSpacing: 2, color: "rgba(244,239,230,0.55)", marginTop: 12 }}>/ an·tic·i·pa·to·ry  anx·i·e·ty /  noun</div>
      <div style={{ height: 2, background: "rgba(244,239,230,0.14)", margin: "20px 0" }} />
      <div style={{ fontFamily: SANS, fontWeight: 500, fontSize: 40, lineHeight: 1.25, color: BONE, opacity: prog(t, a + 0.35, 0.4) }}>
        Fear of something that <span style={{ fontWeight: 800 }}>hasn't happened yet.</span>
      </div>
    </Abs>
  );
};

/** "your brain is predicting rejection before rejection has even happened" — a timeline with NOW and a ghost marker. */
export const Prediction = () => {
  const t = useT();
  const a = T.brain - 0.15, b = T.sympathetic - 0.05;
  const v = win(t, a, b, 0.25, 0.25);
  if (v <= 0.001) return null;
  const p = prog(t, a, 0.5, outExpo);
  const line = prog(t, a + 0.1, 0.7, inOutCubic);
  const pred = prog(t, T.predicting - 0.05, 0.4, outBack);
  const before = prog(t, T.before - 0.05, 0.4);
  const W = 860;
  return (
    <Abs style={{ left: 50, right: 50, top: 120, padding: "26px 30px 34px", borderRadius: 36, ...glass, opacity: v, transform: `translateY(${(1 - p) * -60}px)` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <IconBrain size={40} color={EMBER} />
        <div style={{ fontFamily: MONO, fontSize: 24, letterSpacing: 4, color: BONE }}>YOUR BRAIN · PREDICTING</div>
        <Blink t={t} color={EMBER} />
      </div>
      <div style={{ position: "relative", height: 210, marginTop: 20 }}>
        <div style={{ position: "absolute", left: 0, top: 120, width: W * line, height: 4, background: "linear-gradient(90deg, rgba(244,239,230,0.9), rgba(244,239,230,0.25))" }} />
        {/* NOW */}
        <div style={{ position: "absolute", left: 90, top: 98, display: "flex", flexDirection: "column", alignItems: "center", opacity: line }}>
          <div style={{ width: 48, height: 48, borderRadius: 48, background: BONE, boxShadow: "0 0 20px rgba(255,255,255,0.6)" }} />
          <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 26, color: BONE, marginTop: 12 }}>NOW</div>
        </div>
        {/* predicted rejection, in the future, dashed */}
        <div style={{ position: "absolute", left: 560, top: 0, display: "flex", flexDirection: "column", alignItems: "center", opacity: pred, transform: `scale(${lerp(0.7, 1, pred)})` }}>
          <div style={{ padding: "10px 22px", borderRadius: 16, border: `3px dashed ${RED}`, fontFamily: SANS, fontWeight: 900, fontSize: 40, letterSpacing: 2, color: RED, background: "rgba(255,46,58,0.1)" }}>REJECTION</div>
          <div style={{ width: 3, height: 60, background: `repeating-linear-gradient(180deg, ${RED} 0 8px, transparent 8px 14px)` }} />
          <div style={{ width: 30, height: 30, borderRadius: 30, border: `4px dashed ${RED}` }} />
          <div style={{ fontFamily: MONO, fontSize: 24, color: "rgba(244,239,230,0.6)", marginTop: 10 }}>{before > 0.5 ? "hasn't happened" : "predicted"}</div>
        </div>
        {/* the brain jumping ahead */}
        <svg width={W} height={210} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
          <path d={`M114 100 C 260 ${-10} 470 ${-10} 600 40`} fill="none" stroke={EMBER} strokeWidth={4} strokeDasharray="600" strokeDashoffset={600 * (1 - pred)} style={{ filter: `drop-shadow(0 0 8px ${EMBER})` }} />
        </svg>
      </div>
    </Abs>
  );
};

/** "sympathetic nervous system kicks in: adrenaline, increased heart rate, sweaty palms" */
export const Vitals = () => {
  const t = useT();
  const a = T.sympathetic - 0.1, b = T.trouble - 0.3;
  const v = win(t, a, b, 0.2, 0.25);
  if (v <= 0.001) return null;
  const on = prog(t, T.kicks - 0.05, 0.3, outBack);
  const bpm = bpmAt(t);
  return (
    <>
      <Abs style={{ left: 0, right: 0, top: 130, display: "flex", justifyContent: "center", opacity: v }}>
        <div style={{ ...glass, display: "flex", alignItems: "center", gap: 18, padding: "16px 28px", borderRadius: 40, transform: `scale(${lerp(0.9, 1, prog(t, a, 0.4, outBack))})` }}>
          <div style={{ fontFamily: MONO, fontSize: 24, letterSpacing: 3, color: BONE }}>SYMPATHETIC NERVOUS SYSTEM</div>
          <div style={{ padding: "6px 16px", borderRadius: 20, fontFamily: MONO, fontWeight: 700, fontSize: 24, background: on > 0.5 ? RED : "rgba(255,255,255,0.1)", color: "#fff", transform: `scale(${lerp(0.8, 1, on)})` }}>{on > 0.5 ? "ON" : "OFF"}</div>
        </div>
      </Abs>
      <Chip t={t} a={T.adrenaline1 - 0.08} b={b} x={44} y={290} side="left" width={420} color="rgba(255,176,32,1)" icon={<IconBolt size={40} color={AMBER} />} label="ADRENALINE" value="surging ▲" />
      <Chip t={t} a={T.increased - 0.08} b={b} x={616} y={420} side="right" width={420} color="rgba(255,46,58,1)" icon={<IconHeart size={40} color={RED} />} label="HEART RATE" value={<span>{bpm} <span style={{ fontSize: 26, color: RED }}>BPM</span></span>} />
      <Chip t={t} a={T.sweaty2 - 0.08} b={b} x={44} y={550} side="left" width={420} color="rgba(255,176,32,1)" icon={<IconDrop size={40} color={AMBER} />} label="PALMS" value="sweaty" />
    </>
  );
};

/** "here's where salespeople get themselves in trouble" — warning, then the three mistakes. */
export const Trouble = () => {
  const t = useT();
  const a = T.trouble - 0.15, b = T.understanding - 0.1;
  const v = win(t, a, b, 0.15, 0.25);
  if (v <= 0.001) return null;
  const items: [string, number, string][] = [
    ["Talking faster", T.talking, "1.5×"],
    ["Over-explaining", T.over, "+400 words"],
    ["Filling every silence", T.filling, "0.0 s pause"],
  ];
  const tape = prog(t, a, 0.35, outExpo);
  return (
    <Abs style={{ left: 0, right: 0, top: 110, opacity: v }}>
      <div style={{ margin: "0 auto", width: 1300, marginLeft: -110, height: 70, background: `repeating-linear-gradient(-45deg, ${AMBER} 0 34px, #111 34px 68px)`, transform: `rotate(-3deg) translateX(${(1 - tape) * -1300}px)`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 10px 40px rgba(0,0,0,0.5)" }}>
        <div style={{ background: "#111", padding: "4px 28px", fontFamily: SANS, fontWeight: 900, fontSize: 46, letterSpacing: 6, color: AMBER }}>TROUBLE</div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 16, marginTop: 40, marginLeft: 60 }}>
        {items.map(([txt, at, stat], i) => {
          const p = prog(t, at - 0.1, 0.4, outExpo);
          if (p <= 0.001) return null;
          return (
            <div key={i} style={{ ...glass, display: "flex", alignItems: "center", gap: 18, padding: "14px 26px 14px 16px", borderRadius: 26, opacity: p, transform: `translateX(${(1 - p) * -160}px)` }}>
              <div style={{ width: 50, height: 50, borderRadius: 14, background: "rgba(255,46,58,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <IconX size={32} color={RED} sw={3} />
              </div>
              <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 44, color: BONE }}>{txt}</div>
              <div style={{ fontFamily: MONO, fontSize: 24, color: AMBER, marginLeft: 8 }}>{stat}</div>
            </div>
          );
        })}
      </div>
    </Abs>
  );
};

/** "they go from understanding the prospect to protecting themselves from rejection" — the mode flips. */
export const ModeFlip = () => {
  const t = useT();
  const a = T.understanding - 0.12, b = T.interrupt - 0.3;
  const v = win(t, a, b, 0.2, 0.25);
  if (v <= 0.001) return null;
  const flip = prog(t, T.protecting - 0.08, 0.45, outBack);
  const row = (on: boolean, icon: React.ReactNode, txt: string, col: string, k: number) => (
    <div style={{ ...glass, display: "flex", alignItems: "center", gap: 20, padding: "18px 28px", borderRadius: 30, width: 760, opacity: lerp(on ? 0.35 : 1, on ? 1 : 0.35, k), transform: `scale(${lerp(on ? 0.94 : 1, on ? 1.04 : 0.94, k)})`, borderColor: k > 0.5 === on ? col : undefined }}>
      {icon}
      <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 44, color: BONE, textDecoration: !on && k > 0.5 ? "line-through" : "none", textDecorationColor: RED }}>{txt}</div>
    </div>
  );
  return (
    <Abs style={{ left: 0, right: 0, top: 140, display: "flex", flexDirection: "column", alignItems: "center", gap: 16, opacity: v, transform: `translateY(${(1 - prog(t, a, 0.5, outExpo)) * -50}px)` }}>
      <div style={{ fontFamily: MONO, fontSize: 24, letterSpacing: 4, color: "rgba(244,239,230,0.65)" }}>MODE</div>
      {row(false, <IconSearch size={48} color={"#2BD4A7"} />, "Understanding the prospect", "#2BD4A7", flip)}
      <div style={{ fontFamily: SANS, fontSize: 40, color: RED, transform: `rotate(${flip * 180}deg)` }}>↓</div>
      {row(true, <IconShield size={48} color={RED} />, "Protecting yourself", RED, flip)}
    </Abs>
  );
};
