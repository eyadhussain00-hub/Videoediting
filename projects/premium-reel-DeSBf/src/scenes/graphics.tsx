import type { CSSProperties, ReactNode } from "react";
import { useCurrentFrame } from "remotion";
import { CHAPTERS, FPS, GOLD, IVORY, RED, T, at } from "../data";
import { MONO, SANS, SERIF } from "../fonts";
import { Abs, IconBook, IconCheck, IconCross, IconCrown, IconEye, IconMic, IconPen, clamp01, draw, glass, goldText, inOutCubic, lerp, outBack, outCubic, outExpo, prog, win } from "../ui";

const useT = () => useCurrentFrame() / FPS;
const label: CSSProperties = { fontFamily: MONO, fontSize: 20, letterSpacing: 6, color: "rgba(255,240,215,0.72)", textTransform: "uppercase" };
const Enter = ({ t, s, e, children, style, dy = 40 }: { t: number; s: number; e: number; children: ReactNode; style?: CSSProperties; dy?: number }) => {
  if (t < s - 0.05 || t > e + 0.05) return null;
  const p = prog(t, s, 0.45, outExpo), o = prog(t, e - 0.35, 0.35, inOutCubic);
  return (
    <Abs style={{ ...style, opacity: Math.min(p, 1 - o), transform: `${style?.transform ?? ""} translateY(${(1 - p) * dy + o * -20}px) scale(${lerp(0.96, 1, p)})`, filter: `blur(${(1 - p) * 10 + o * 8}px)` }}>
      {children}
    </Abs>
  );
};

/** $0 → $1,000,000 on "millionaire". */
export const MillionCounter = () => {
  const t = useT();
  const s = T.millionaire - 0.1, e = T.three - 0.15;
  if (t < s - 0.05 || t > e) return null;
  const n = Math.round(lerp(0, 1_000_000, prog(t, s + 0.1, 1.5, inOutCubic)));
  const done = t > s + 1.6 ? 1 - prog(t, s + 1.6, 0.8) : 0;
  return (
    <Enter t={t} s={s} e={e} style={{ left: 0, right: 0, top: 1110, textAlign: "center" }}>
      <div style={{ ...label, letterSpacing: 10, marginBottom: 6 }}>Net worth</div>
      <span style={{ fontFamily: SANS, fontWeight: 800, fontSize: 132, letterSpacing: -5, ...goldText, fontVariantNumeric: "tabular-nums", display: "inline-block", filter: `drop-shadow(0 0 ${20 + 50 * done}px rgba(235,194,122,${0.3 + 0.4 * done}))` }}>
        ${n.toLocaleString("en-US")}
      </span>
    </Enter>
  );
};

/** "three things": three numbered medallions. */
export const ThreeThings = () => {
  const t = useT();
  const s = T.three - 0.05, e = T.ch1 + 0.1;
  if (t < s - 0.05 || t > e) return null;
  const o = prog(t, e - 0.4, 0.4, inOutCubic);
  return (
    <Abs style={{ left: 0, right: 0, top: 1080, display: "flex", justifyContent: "center", gap: 46, opacity: 1 - o }}>
      {["Beliefs", "Leverage", "Attention"].map((w, i) => {
        const p = prog(t, s + i * 0.14, 0.5, outBack);
        return (
          <div key={i} style={{ textAlign: "center", opacity: clamp01(p * 1.5), transform: `translateY(${(1 - p) * 50 - o * 30}px) scale(${lerp(0.6, 1, p)})` }}>
            <div style={{ width: 150, height: 150, borderRadius: 75, ...glass, display: "flex", alignItems: "center", justifyContent: "center", border: `2px solid rgba(235,194,122,0.55)` }}>
              <span style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 110, lineHeight: 1, ...goldText, paddingRight: 8, marginTop: 8 }}>{i + 1}</span>
            </div>
            <div style={{ ...label, marginTop: 16, fontSize: 18, letterSpacing: 5, opacity: prog(t, s + 0.4 + i * 0.12, 0.4) }}>{w}</div>
          </div>
        );
      })}
    </Abs>
  );
};

/** Chapter tag on "Number one/two/three" (captions are hidden here). */
export const ChapterTag = () => {
  const t = useT();
  return (
    <>
      {CHAPTERS.map((c, i) => {
        const s = c.s, e = c.s + 1.9 + (i === 0 ? 0.9 : 0.4);
        if (t < s - 0.05 || t > e) return null;
        const p = prog(t, s + 0.15, 0.6, inOutCubic), o = prog(t, e - 0.35, 0.35, inOutCubic);
        return (
          <Abs key={i} style={{ left: 0, right: 0, top: 1240, textAlign: "center", opacity: 1 - o, filter: `blur(${o * 8}px)` }}>
            <div style={{ ...label, fontSize: 24, letterSpacing: 14, opacity: prog(t, s, 0.4), color: GOLD }}>Chapter {c.n} — 03</div>
            <div style={{ margin: "22px auto", width: 520 * p, height: 2, background: "linear-gradient(90deg, rgba(235,194,122,0), #EBC27A, rgba(235,194,122,0))" }} />
            <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 40, letterSpacing: 1, color: IVORY, opacity: prog(t, s + 0.35, 0.5), transform: `translateY(${(1 - prog(t, s + 0.35, 0.5)) * 16}px)` }}>{c.label.charAt(0) + c.label.slice(1).toLowerCase()}</div>
          </Abs>
        );
      })}
    </>
  );
};

/** Persistent top tracker: three segments, the current one filling in gold. */
export const Tracker = () => {
  const t = useT();
  const vis = win(t, T.ch1 + 4.1, T.listen + 0.2, 0.5, 0.5);
  if (vis <= 0) return null;
  return (
    <Abs style={{ left: 120, right: 120, top: 96, display: "flex", gap: 18, opacity: vis * 0.95 }}>
      {CHAPTERS.map((c, i) => {
        const f = clamp01((t - c.s) / (c.e - c.s));
        const active = t >= c.s && t < c.e;
        return (
          <div key={i} style={{ flex: 1 }}>
            <div style={{ height: 4, borderRadius: 2, background: "rgba(255,255,255,0.22)", overflow: "hidden" }}>
              <div style={{ width: `${f * 100}%`, height: "100%", background: active ? "linear-gradient(90deg, #B98A3E, #FFEBC2)" : IVORY }} />
            </div>
            <div style={{ ...label, fontSize: 16, letterSpacing: 4, marginTop: 12, color: active ? GOLD : "rgba(255,240,215,0.55)" }}>{c.n} {c.word}</div>
          </div>
        );
      })}
    </Abs>
  );
};

/** Don't follow ✕ / Don't copy ✕ / Respect ✓ */
export const FollowCopyRespect = () => {
  const t = useT();
  const s = T.follow - 0.35, e = T.respect + 1.15;
  if (t < s - 0.05 || t > e) return null;
  const rows: [string, number, boolean][] = [["Follow them", T.follow, false], ["Copy them", T.copy, false], ["Respect them", T.respect, true]];
  const o = prog(t, e - 0.35, 0.35, inOutCubic);
  return (
    <Abs style={{ left: 190, right: 190, top: 1010, display: "flex", flexDirection: "column", gap: 18, opacity: 1 - o }}>
      {rows.map(([w, at_, ok], i) => {
        const p = prog(t, at_ - 0.15, 0.45, outExpo);
        const tick = prog(t, at_ + 0.12, 0.35);
        const col = ok ? GOLD : RED;
        return (
          <div key={i} style={{ ...glass, borderRadius: 26, height: 104, display: "flex", alignItems: "center", gap: 26, padding: "0 34px", opacity: p, transform: `translateX(${(1 - p) * (i % 2 ? 60 : -60)}px)`, filter: `blur(${(1 - p) * 8}px)`, border: ok ? "2px solid rgba(235,194,122,0.6)" : "1.5px solid rgba(255,236,200,0.14)" }}>
            <div style={{ width: 54, height: 54, borderRadius: 27, border: `2px solid ${col}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              {ok ? <IconCheck size={30} color={col} p={tick} /> : <IconCross size={26} color={col} p={tick} />}
            </div>
            <div style={{ position: "relative" }}>
              {ok ? <span style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 64, ...goldText, paddingRight: 8 }}>{w}</span>
                : <span style={{ fontFamily: SANS, fontWeight: 700, fontSize: 46, color: "rgba(246,239,227,0.8)", letterSpacing: -0.5 }}>Don't {w.toLowerCase()}</span>}
              {!ok && <div style={{ position: "absolute", left: -4, top: "52%", height: 3, width: `${tick * 104}%`, background: RED, borderRadius: 2 }} />}
            </div>
          </div>
        );
      })}
    </Abs>
  );
};

/** Their playbook → Survival. Your playbook → Wealth. */
export const Playbooks = () => {
  const t = useT();
  const s = T.playbook - 0.2, e = T.ch2 - 0.05;
  if (t < s - 0.05 || t > e) return null;
  const o = prog(t, e - 0.4, 0.4, inOutCubic);
  // card A: centred over the B-roll, then moves to the left slot on the cut back to him
  const mv = prog(t, 25.3, 0.6, inOutCubic);
  const pa = prog(t, s, 0.5, outExpo);
  const pb = prog(t, T.different - 0.2, 0.55, outExpo);
  const surv = prog(t, T.survival - 0.05, 0.5, outExpo);
  const wl = prog(t, T.wealth - 0.05, 0.6, outExpo);
  const card = (gold: boolean): CSSProperties => ({ ...glass, borderRadius: 30, width: 420, height: 300, padding: "30px 34px", boxSizing: "border-box", border: gold ? "2px solid rgba(235,194,122,0.7)" : "1.5px solid rgba(255,236,200,0.14)" });
  const ax = lerp(330, 85, mv), ay = lerp(820, 1000, mv), as = lerp(1.25, 1, mv);
  return (
    <Abs style={{ left: 0, top: 0, width: 1080, height: 1920, opacity: 1 - o }}>
      <Abs style={{ left: ax, top: ay, transform: `scale(${as * lerp(0.9, 1, pa)})`, transformOrigin: "50% 50%", opacity: pa * lerp(1, 0.62, pb), filter: `blur(${(1 - pa) * 10}px) saturate(${lerp(1, 0.2, pb)})` }}>
        <div style={card(false)}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}><IconBook size={30} color="rgba(255,240,215,0.75)" p={pa} /><span style={{ ...label, fontSize: 18 }}>Their playbook</span></div>
          <div style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 96, color: IVORY, marginTop: 34, opacity: surv, transform: `translateY(${(1 - surv) * 30}px)`, position: "relative", display: "inline-block" }}>
            Survival
            <div style={{ position: "absolute", left: -6, right: -6, top: "55%", height: 4, background: RED, transformOrigin: "0 50%", transform: `scaleX(${prog(t, T.different + 0.3, 0.4)})` }} />
          </div>
          <div style={{ ...label, fontSize: 16, marginTop: 8, opacity: surv }}>Got them by</div>
        </div>
      </Abs>
      {t > T.different - 0.3 && (
        <Abs style={{ left: 575, top: 1000, opacity: pb, transform: `translateY(${(1 - pb) * 60}px) scale(${lerp(0.92, 1, pb)})`, filter: `blur(${(1 - pb) * 10}px)` }}>
          <div style={{ ...card(true), boxShadow: `0 30px 80px rgba(0,0,0,0.45), 0 0 ${60 * wl}px rgba(235,194,122,${0.35 * wl})` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}><IconBook size={30} color={GOLD} p={pb} /><span style={{ ...label, fontSize: 18, color: GOLD }}>Your playbook</span></div>
            <div style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 104, ...goldText, marginTop: 28, paddingRight: 10, opacity: wl, transform: `translateY(${(1 - wl) * 30}px) scale(${lerp(1.15, 1, wl)})`, display: "inline-block" }}>Wealth</div>
            <div style={{ ...label, fontSize: 16, marginTop: 4, opacity: wl, color: GOLD }}>Gets you to</div>
          </div>
        </Abs>
      )}
    </Abs>
  );
};

/** Farmer B-roll: sun arc and an hours counter. */
export const SunClock = () => {
  const t = useT();
  const s = T.farmer - 0.2, e = 39.74;
  if (t < s - 0.05 || t > e) return null;
  const p = prog(t, s, 0.8, inOutCubic);
  const h = lerp(0, 12, prog(t, s + 0.3, T.twelve - s - 0.3 + 0.3, inOutCubic));
  const k = h / 12;
  const o = prog(t, e - 0.35, 0.35, inOutCubic);
  const cx = 540, cy = 700, r = 380;
  const ang = Math.PI * (1 - k);
  const sx = cx + r * Math.cos(ang), sy = cy - r * Math.sin(ang);
  const hit = t > T.twelve ? 1 - prog(t, T.twelve, 0.8) : 0;
  return (
    <Abs style={{ left: 0, top: 0, width: 1080, height: 1920, opacity: 1 - o }}>
      <svg width={1080} height={1920} style={{ position: "absolute", overflow: "visible" }}>
        <path d={`M${cx - r} ${cy} A${r} ${r} 0 0 1 ${cx + r} ${cy}`} pathLength={1} stroke="rgba(255,240,215,0.35)" strokeWidth={2} strokeDasharray="0.006 0.012" fill="none" style={{ opacity: p }} />
        <path d={`M${cx - r} ${cy} A${r} ${r} 0 0 1 ${cx + r} ${cy}`} pathLength={1} stroke={GOLD} strokeWidth={4} fill="none" style={{ ...draw(k * 0.5 * 2 > 1 ? 1 : k) }} />
        <line x1={cx - r - 40} x2={cx + r + 40} y1={cy} y2={cy} stroke="rgba(255,240,215,0.4)" strokeWidth={1.5} style={{ opacity: p }} />
        <circle cx={sx} cy={sy} r={70} fill="url(#sunG)" style={{ opacity: p }} />
        <circle cx={sx} cy={sy} r={20} fill="#FFF2D6" style={{ opacity: p, filter: "drop-shadow(0 0 24px #FFD48A)" }} />
        <defs><radialGradient id="sunG"><stop offset="0" stopColor="rgba(255,214,140,0.9)" /><stop offset="1" stopColor="rgba(255,214,140,0)" /></radialGradient></defs>
      </svg>
      <Abs style={{ left: 0, right: 0, top: 500, textAlign: "center", opacity: p }}>
        <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 190, lineHeight: 1, letterSpacing: -8, ...goldText, fontVariantNumeric: "tabular-nums", display: "inline-block", transform: `scale(${1 + 0.08 * hit})`, filter: `drop-shadow(0 0 ${30 + 50 * hit}px rgba(235,194,122,0.45))` }}>
          {String(Math.floor(h)).padStart(2, "0")}
        </div>
        <div style={{ ...label, fontSize: 24, letterSpacing: 12, marginTop: 14, color: IVORY }}>Hours / day</div>
      </Abs>
      <Abs style={{ left: cx - r - 40, top: cy + 18, ...label, fontSize: 16, opacity: p }}>Sunrise</Abs>
      <Abs style={{ left: cx + r - 60, top: cy + 18, ...label, fontSize: 16, opacity: p }}>Sunset</Abs>
    </Abs>
  );
};

/** Effort vs result bars: real work, painful work, barely enough. */
export const EffortResult = () => {
  const t = useT();
  const s = T.real - 0.35, e = T.by + 0.75;
  if (t < s - 0.05 || t > e) return null;
  const eff = prog(t, T.real - 0.1, 2.2, inOutCubic);
  const res = prog(t, T.barely, 1.4, outCubic) * 0.07;
  const pain = prog(t, T.painful, 0.4);
  const rows: [string, number, string, boolean][] = [["Effort", eff, `${Math.round(eff * 100)}%`, true], ["Result", res, "barely enough", false]];
  return (
    <Enter t={t} s={s} e={e} style={{ left: 120, right: 120, top: 1010 }}>
      <div style={{ ...glass, borderRadius: 30, padding: "30px 36px 34px" }}>
        {rows.map(([name, v, txt, isE], i) => (
          <div key={i} style={{ marginTop: i ? 28 : 0, opacity: i ? prog(t, T.barely - 0.4, 0.4) : 1 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <span style={{ ...label, fontSize: 20, color: isE ? IVORY : "rgba(255,240,215,0.75)" }}>{name}</span>
              <span style={{ fontFamily: isE ? SANS : SERIF, fontStyle: isE ? "normal" : "italic", fontWeight: isE ? 700 : 400, fontSize: isE ? 34 : 40, color: isE ? IVORY : RED, fontVariantNumeric: "tabular-nums" }}>{txt}</span>
            </div>
            <div style={{ marginTop: 12, height: 22, borderRadius: 11, background: "rgba(255,255,255,0.1)", overflow: "hidden" }}>
              <div style={{ width: `${Math.max(v, i ? 0.012 : 0) * 100}%`, height: "100%", borderRadius: 11, background: isE ? `linear-gradient(90deg, rgba(246,239,227,0.8), ${lerp(0, 1, pain) > 0.5 ? "#F0A070" : IVORY})` : RED }} />
            </div>
          </div>
        ))}
      </div>
    </Enter>
  );
};

/** Strategy + Leverage, over the whiteboard and scale B-roll. */
export const StrategyLeverage = () => {
  const t = useT();
  const s = T.strategy - 0.15, e = 51.55;
  if (t < s - 0.05 || t > e) return null;
  const a = prog(t, s, 0.55, outExpo), b = prog(t, T.leverage - 0.1, 0.55, outExpo), pl = prog(t, T.leverage - 0.6, 0.4, outBack);
  const o = prog(t, e - 0.35, 0.35, inOutCubic);
  const word = (txt: string, p: number): CSSProperties => ({ fontFamily: SERIF, fontStyle: "italic", fontSize: 190, lineHeight: 1.02, ...goldText, paddingRight: 16, opacity: p, transform: `translateY(${(1 - p) * 60}px) scale(${lerp(1.12, 1, p)})`, filter: `blur(${(1 - p) * 14}px) drop-shadow(0 6px 30px rgba(0,0,0,0.55))`, display: "inline-block" });
  return (
    <Abs style={{ left: 0, right: 0, top: 560, textAlign: "center", opacity: 1 - o, filter: `blur(${o * 8}px)` }}>
      <Abs style={{ left: 0, right: 0, top: -280, height: 1100, background: "radial-gradient(ellipse 60% 45% at 50% 50%, rgba(8,6,4,0.62), rgba(8,6,4,0) 75%)" }} />
      <div style={{ position: "relative" }}>
        <div style={{ ...label, fontSize: 22, letterSpacing: 12, color: IVORY, opacity: a }}>What you need</div>
        <div style={word("Strategy", a)}>Strategy</div>
        <div style={{ fontFamily: SANS, fontWeight: 300, fontSize: 110, color: IVORY, opacity: pl, transform: `scale(${pl}) rotate(${(1 - pl) * 90}deg)`, lineHeight: 1 }}>+</div>
        <div style={word("Leverage", b)}>Leverage</div>
      </div>
    </Abs>
  );
};

/** Target reticle: strategy tells you where. */
export const Reticle = () => {
  const t = useT();
  const s = T.strategy2 - 0.1, e = T.leverage2 - 0.2;
  if (t < s - 0.05 || t > e) return null;
  const lock = prog(t, T.where - 0.1, 0.5, outBack);
  const p = prog(t, s, 0.6, outCubic);
  const rot = (1 - lock) * 120 + t * 6;
  const cx = 540, cy = 1130;
  return (
    <Enter t={t} s={s} e={e} style={{ left: 0, top: 0, width: 1080, height: 1920 }} dy={0}>
      <svg width={1080} height={1920} style={{ position: "absolute", overflow: "visible" }}>
        <g transform={`rotate(${rot} ${cx} ${cy})`}>
          <circle cx={cx} cy={cy} r={lerp(230, 150, lock)} pathLength={1} stroke="rgba(255,240,215,0.5)" strokeWidth={2} fill="none" strokeDasharray="0.06 0.02" style={{ opacity: p }} />
        </g>
        <circle cx={cx} cy={cy} r={lerp(150, 92, lock)} pathLength={1} stroke={GOLD} strokeWidth={4} fill="none" style={{ ...draw(p) }} />
        <circle cx={cx} cy={cy} r={10} fill={GOLD} style={{ opacity: lock }} />
        {[0, 90, 180, 270].map((d) => {
          const r0 = lerp(260, 120, lock), r1 = r0 + 60, a = (d * Math.PI) / 180;
          return <line key={d} x1={cx + r0 * Math.cos(a)} y1={cy + r0 * Math.sin(a)} x2={cx + r1 * Math.cos(a)} y2={cy + r1 * Math.sin(a)} stroke={GOLD} strokeWidth={4} strokeLinecap="round" style={{ opacity: p }} />;
        })}
      </svg>
      <Abs style={{ left: 0, right: 0, top: cy + 210, textAlign: "center", ...label, fontSize: 22, letterSpacing: 10, color: GOLD, opacity: lock }}>Where to put your effort</Abs>
    </Enter>
  );
};

/** Leverage: a lever on a fulcrum; a small effort lifts a 100× result. */
export const Lever = () => {
  const t = useT();
  const s = T.leverage2 - 0.1, e = T.ch3 - 0.15;
  if (t < s - 0.05 || t > e) return null;
  const tilt = lerp(-14, 12, prog(t, at("effort", 2) - 0.1, 1.1, inOutCubic));
  const grow = prog(t, T.hundred - 0.3, 0.8, outBack);
  const cx = 540, cy = 1210, L = 330;
  const rad = (tilt * Math.PI) / 180;
  const lx = cx - L * Math.cos(rad), ly = cy + 0 - L * Math.sin(rad) * -1;
  const rx = cx + L * Math.cos(rad), ry = cy - L * Math.sin(rad) * -1;
  void lx; void rx;
  return (
    <Enter t={t} s={s} e={e} style={{ left: 0, top: 0, width: 1080, height: 1920 }}>
      <Abs style={{ left: 110, right: 110, top: 990, height: 330, ...glass, borderRadius: 32 }} />
      <svg width={1080} height={1920} style={{ position: "absolute", overflow: "visible" }}>
        <g transform={`rotate(${tilt} ${cx} ${cy})`}>
          <rect x={cx - L - 20} y={cy - 6} width={2 * L + 40} height={12} rx={6} fill={IVORY} />
          {/* effort: small block on the long side */}
          <rect x={cx - L - 10} y={cy - 6 - 56} width={56} height={56} rx={8} fill="rgba(246,239,227,0.9)" />
          {/* result: grows on the short side */}
          <rect x={cx + L - 150} y={cy - 6 - lerp(70, 140, grow)} width={lerp(70, 140, grow)} height={lerp(70, 140, grow)} rx={12} fill="url(#lg)" style={{ filter: `drop-shadow(0 0 ${30 * grow}px rgba(235,194,122,0.6))` }} />
        </g>
        <path d={`M${cx} ${cy + 6} l-38 64 h76 z`} fill={GOLD} />
        <defs><linearGradient id="lg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FFEBC2" /><stop offset="1" stopColor="#B98A3E" /></linearGradient></defs>
      </svg>
      <Abs style={{ left: 150, top: 1015, ...label, fontSize: 18, color: IVORY }}>Effort ×1</Abs>
      <Abs style={{ right: 150, top: 1015, ...label, fontSize: 18, color: GOLD, opacity: 0.4 + 0.6 * grow }}>Result ×{Math.round(lerp(1, 100, grow))}</Abs>
    </Enter>
  );
};

const Stars = ({ n, p, color }: { n: number; p: number; color: string }) => (
  <div style={{ display: "flex", gap: 8 }}>
    {Array.from({ length: 5 }).map((_, i) => {
      const k = clamp01(p * 6 - i);
      return (
        <svg key={i} width={34} height={34} viewBox="0 0 24 24">
          <path d="m12 2.5 2.9 6 6.6.9-4.8 4.5 1.2 6.6L12 17.3l-5.9 3.2 1.2-6.6-4.8-4.5 6.6-.9z" fill={i < n ? color : "rgba(255,255,255,0.14)"} style={{ transformOrigin: "12px 12px", transform: `scale(${i < n ? k : 1})` }} />
        </svg>
      );
    })}
  </div>
);

/** Best product + zero attention LOSES to average product + lots of attention. */
export const AttentionVs = () => {
  const t = useT();
  const s = T.best - 0.25, e = 75.3;
  if (t < s - 0.05 || t > e) return null;
  const pA = prog(t, s, 0.5, outExpo), pB = prog(t, T.average - 0.2, 0.5, outExpo);
  const zero = prog(t, T.zero, 0.5);
  const lose = prog(t, T.lose, 0.45, outBack);
  const lots = prog(t, T.lots - 0.1, 1.0, inOutCubic);
  const win_ = prog(t, T.attention3, 0.5, outBack);
  const col = (gold: boolean, p: number, children: ReactNode, dim = 0): ReactNode => (
    <div style={{ ...glass, borderRadius: 30, width: 410, padding: "28px 30px 30px", boxSizing: "border-box", opacity: p * lerp(1, 0.55, dim), transform: `translateY(${(1 - p) * 60}px)`, filter: `blur(${(1 - p) * 10}px) saturate(${lerp(1, 0.3, dim)})`, border: gold ? "2px solid rgba(235,194,122,0.7)" : "1.5px solid rgba(255,236,200,0.14)", position: "relative" }}>
      {children}
    </div>
  );
  const meter = (v: number, gold: boolean) => (
    <div style={{ marginTop: 10, height: 18, borderRadius: 9, background: "rgba(255,255,255,0.1)", overflow: "hidden" }}>
      <div style={{ width: `${v * 100}%`, height: "100%", background: gold ? "linear-gradient(90deg, #B98A3E, #FFEBC2)" : IVORY }} />
    </div>
  );
  const tag = (txt: string, p: number, c: string) => (
    <div style={{ position: "absolute", right: 22, top: -26, padding: "8px 18px", borderRadius: 999, background: c, fontFamily: SANS, fontWeight: 800, fontSize: 24, letterSpacing: 3, color: "#120E0A", opacity: clamp01(p * 1.4), transform: `scale(${lerp(1.6, 1, p)}) rotate(${c === RED ? -4 : 3}deg)` }}>{txt}</div>
  );
  return (
    <Abs style={{ left: 0, right: 0, top: 960, display: "flex", justifyContent: "center", gap: 40, opacity: 1 - prog(t, e - 0.35, 0.35) }}>
      {col(false, pA, (
        <>
          <div style={{ ...label, fontSize: 18 }}>Best product</div>
          <div style={{ marginTop: 14 }}><Stars n={5} p={prog(t, T.best, 0.8)} color={IVORY} /></div>
          <div style={{ ...label, fontSize: 16, marginTop: 26 }}>Attention</div>
          {meter(0, false)}
          <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 64, color: IVORY, marginTop: 6, opacity: zero }}>0</div>
          {tag("LOSES", lose, RED)}
        </>
      ), lose)}
      {col(true, pB, (
        <>
          <div style={{ ...label, fontSize: 18, color: GOLD }}>Average product</div>
          <div style={{ marginTop: 14 }}><Stars n={3} p={prog(t, T.average, 0.8)} color={GOLD} /></div>
          <div style={{ ...label, fontSize: 16, marginTop: 26, color: GOLD }}>Attention</div>
          {meter(lots, true)}
          <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 64, ...goldText, marginTop: 6, opacity: prog(t, T.lots, 0.4), fontVariantNumeric: "tabular-nums", display: "inline-block" }}>{Math.round(lots * 100)}%</div>
          <div style={{ position: "absolute", left: "50%", top: -80, transform: `translateX(-50%) scale(${win_})`, opacity: win_ }}><IconCrown size={64} color={GOLD} p={win_} /></div>
          {tag("WINS", win_, GOLD)}
        </>
      ))}
    </Abs>
  );
};

/** Learn to speak / write / be seen — over the three B-roll shots. */
export const SpeakWriteSeen = () => {
  const t = useT();
  const s = T.speak - 0.75, e = T.listen - 0.05;
  if (t < s - 0.05 || t > e) return null;
  const items: [string, number, (p: { size?: number; color?: string; p?: number }) => ReactNode][] = [["Speak", T.speak, IconMic], ["Write", T.write, IconPen], ["Be seen", T.seen, IconEye]];
  return (
    <Enter t={t} s={s} e={e} style={{ left: 0, right: 0, top: 1040, display: "flex", justifyContent: "center", gap: 26 }}>
      <Abs style={{ left: 0, right: 0, top: -76, textAlign: "center", ...label, fontSize: 22, letterSpacing: 14, color: IVORY }}>Learn to</Abs>
      {items.map(([w, a, Icon], i) => {
        const on = prog(t, a - 0.15, 0.45, outBack);
        return (
          <div key={i} style={{ ...glass, borderRadius: 28, width: 290, height: 250, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 18,
            border: on > 0.05 ? `2px solid rgba(235,194,122,${0.7 * on})` : "1.5px solid rgba(255,236,200,0.14)", transform: `scale(${lerp(0.94, 1, on)})`, boxShadow: `0 30px 80px rgba(0,0,0,0.45), 0 0 ${50 * on}px rgba(235,194,122,${0.25 * on})` }}>
            <Icon size={78} color={on > 0.05 ? GOLD : "rgba(255,240,215,0.45)"} p={0.25 + 0.75 * on} />
            <span style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 62, lineHeight: 1, ...(on > 0.05 ? goldText : { color: "rgba(255,240,215,0.5)" }), paddingRight: 6 }}>{w}</span>
          </div>
        );
      })}
    </Enter>
  );
};

/** Closing sign-off under "You." */
export const SignOff = () => {
  const t = useT();
  const p = prog(t, T.you + 0.7, 0.8, inOutCubic);
  if (p <= 0) return null;
  return (
    <Abs style={{ left: 0, right: 0, top: 1290, textAlign: "center", opacity: p }}>
      <div style={{ margin: "0 auto 26px", width: 460 * p, height: 2, background: "linear-gradient(90deg, rgba(235,194,122,0), #EBC27A, rgba(235,194,122,0))" }} />
      <div style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 78, ...goldText, display: "inline-block", paddingRight: 8 }}>Let it be you.</div>
      <div style={{ ...label, fontSize: 20, letterSpacing: 12, marginTop: 18, opacity: prog(t, T.you + 1.2, 0.6) }}>Break the cycle</div>
    </Abs>
  );
};
