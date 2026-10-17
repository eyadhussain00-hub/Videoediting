import type { ReactNode } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { BEATS, CREAM, EMBER, EMBER_DEEP, FPS, MUTED, T, beatAt } from "../data";
import { MONO, SANS, SERIF } from "../fonts";
import { Abs, glass, inOutCubic, lerp, outBack, outBackSoft, outExpo, prog, spring, win } from "../ui";

// The graphics stage under the clock (y ≈ 1090–1500): the hook's kinetic title, then one card per objection —
// what the prospect says (serif quote), what you say (the close), and a small visual for the close's logic.

const STAGE_TOP = 1040;

/** Hook: "4 OBJECTIONS / 4 CLOSES / 40 SECONDS", each row landing on its word. */
export const HookTitle = () => {
  const t = useCurrentFrame() / FPS;
  const out = prog(t, T.o1 - 0.32, 0.3, inOutCubic);
  if (out >= 1) return null;
  const rows: [number, string, string][] = [
    [T.four1, "4", "OBJECTIONS"],
    [T.four2, "4", "CLOSES"],
    [T.forty, "40", "SECONDS"],
  ];
  return (
    <Abs style={{ left: 0, right: 0, top: STAGE_TOP + 20, opacity: 1 - out, transform: `translateY(${-out * 40}px) scale(${1 - out * 0.06})` }}>
      {rows.map(([s, n, w], i) => {
        const p = prog(t, s - 0.06, 0.4, outExpo);
        const sp = spring(t, s - 0.06, 2.4, 7);
        return (
          <div key={i} style={{ display: "flex", alignItems: "baseline", justifyContent: "center", gap: 26, height: 128, opacity: p, transform: `translateX(${(1 - p) * -90}px)`, filter: `blur(${(1 - p) * 10}px)` }}>
            <span style={{ fontFamily: SANS, fontWeight: 900, fontSize: 136, letterSpacing: -5, color: EMBER, display: "inline-block", transform: `scale(${lerp(1.4, 1, Math.min(1, sp))})`, textShadow: "0 0 40px rgba(255,90,44,0.45)" }}>{n}</span>
            <span style={{ fontFamily: SANS, fontWeight: 800, fontSize: 96, letterSpacing: -2, color: CREAM }}>{w}</span>
          </div>
        );
      })}
    </Abs>
  );
};

type Line = [number, ReactNode];
/** "You say" lines per beat: the empathy line first, then the close question. */
const LINES: Line[][] = [
  [[T.sense, "That totally makes sense."], [T.compared - 0.25, <>Compared to <Hi>what?</Hi></>]],
  [[T.understand, "I completely understand."], [T.comes - 0.1, "It comes down to 1 of 3:"], [T.which - 0.05, <>Which one feels <Hi>closest?</Hi></>]],
  [[T.absolutely, "Absolutely."], [T.whatTell - 0.15, <>What would you <Hi>tell them?</Hi></>]],
  [[T.hear, "I hear you."], [T.canAsk - 0.05, <>What would need to <Hi>change?</Hi></>]],
];
const CLOSE_START = [T.sense, T.understand, T.absolutely, T.hear];

function Hi({ children }: { children: ReactNode }) {
  return <span style={{ color: EMBER, textShadow: "0 0 30px rgba(255,90,44,0.35)" }}>{children}</span>;
}

const Label = ({ children, color = MUTED }: { children: ReactNode; color?: string }) => (
  <div style={{ fontFamily: MONO, fontSize: 22, letterSpacing: 5, color, marginBottom: 6 }}>{children}</div>
);

export const Beats = () => {
  const t = useCurrentFrame() / FPS;
  const i = beatAt(t);
  if (i < 0 || t >= T.recap) return null;
  const b = BEATS[i];
  const next = BEATS[i + 1]?.s ?? T.recap;
  const life = win(t, b.s - 0.25, next - 0.15, 0.3, 0.25);
  const chip = prog(t, b.s - 0.2, 0.45, outBack);
  const qStart = [T.q1, T.q2, T.q3, T.q4][i];
  const wipe = prog(t, qStart - 0.08, 0.75, inOutCubic);
  const shrink = prog(t, CLOSE_START[i] - 0.1, 0.45, outExpo);
  const lines = LINES[i];
  let li = -1;
  lines.forEach(([s], k) => t >= s && (li = k));
  return (
    <Abs style={{ left: 60, right: 60, top: STAGE_TOP, height: 420, opacity: life, transform: `translateY(${(1 - life) * 24}px)` }}>
      {/* objection chip */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, opacity: chip, transform: `translateX(${(1 - chip) * -30}px)` }}>
        <div style={{ padding: "8px 20px", borderRadius: 30, border: `2px solid ${EMBER}`, fontFamily: MONO, fontWeight: 700, fontSize: 24, letterSpacing: 4, color: EMBER, background: "rgba(255,90,44,0.08)" }}>
          OBJECTION 0{b.n}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {BEATS.map((_, k) => (
            <div key={k} style={{ width: k === i ? 34 : 12, height: 12, borderRadius: 6, background: k <= i ? EMBER : "rgba(255,255,255,0.18)", opacity: k < i ? 0.5 : 1 }} />
          ))}
        </div>
      </div>
      {/* they say */}
      <div style={{ position: "absolute", top: 56, left: 0, right: 0, transformOrigin: "0% 0%", transform: `scale(${lerp(1, 0.6, shrink)})` }}>
        <Label>THEY SAY</Label>
        <div
          style={{
            fontFamily: SERIF,
            fontStyle: "italic",
            fontSize: 92,
            lineHeight: "100px",
            color: CREAM,
            opacity: lerp(1, 0.7, shrink),
            clipPath: `inset(-20px ${(1 - wipe) * 100}% -20px -20px)`,
            whiteSpace: "nowrap",
          }}
        >
          “{b.say}”
        </div>
      </div>
      {/* you say */}
      {li >= 0 && (
        <div style={{ position: "absolute", top: 160, left: 0, right: 0 }}>
          <Label color={EMBER}>YOU SAY</Label>
          <div style={{ position: "relative", height: 90 }}>
            {lines.map(([s, txt], k) => {
              const a = prog(t, s - 0.05, 0.35, outExpo);
              const gone = k < lines.length - 1 ? prog(t, lines[k + 1][0] - 0.05, 0.25) : 0;
              if (a <= 0 || gone >= 1) return null;
              return (
                <div
                  key={k}
                  style={{
                    position: "absolute",
                    left: 0,
                    right: 0,
                    fontFamily: SANS,
                    fontWeight: 800,
                    fontSize: 70,
                    letterSpacing: -1.8,
                    lineHeight: "84px",
                    color: CREAM,
                    whiteSpace: "nowrap",
                    opacity: a * (1 - gone),
                    transform: `translateY(${(1 - a) * 30 - gone * 30}px)`,
                    filter: `blur(${(1 - a) * 8 + gone * 6}px)`,
                  }}
                >
                  {txt}
                </div>
              );
            })}
          </div>
        </div>
      )}
      {/* the close's logic */}
      <div style={{ position: "absolute", top: 276, left: 0, right: 0, height: 140 }}>
        {i === 0 && <CostBars t={t} />}
        {i === 1 && <ThreeThings t={t} />}
        {i === 2 && <Chat t={t} />}
        {i === 3 && <Timeline t={t} />}
      </div>
    </Abs>
  );
};

/** 1 · the cost of not doing it outgrows the investment. */
const CostBars = ({ t }: { t: number }) => {
  const a = prog(t, T.because1 - 0.1, 0.4);
  const inv = prog(t, T.because1, 0.5, outExpo);
  const cost = prog(t, T.cost - 0.05, T.investment - T.cost + 0.2, inOutCubic);
  const bar = (w: number, label: string, hot: boolean, o: number) => (
    <div style={{ display: "flex", alignItems: "center", gap: 18, height: 58, opacity: o }}>
      <div
        style={{
          width: w,
          height: 46,
          borderRadius: 12,
          background: hot ? `linear-gradient(90deg, ${EMBER_DEEP}, ${EMBER})` : "rgba(245,239,230,0.22)",
          boxShadow: hot ? "0 0 26px rgba(255,90,44,0.45)" : "none",
        }}
      />
      <span style={{ fontFamily: MONO, fontSize: 24, letterSpacing: 3, color: hot ? EMBER : MUTED, whiteSpace: "nowrap" }}>{label}</span>
    </div>
  );
  return (
    <div style={{ opacity: a, display: "flex", flexDirection: "column", gap: 14, paddingTop: 6 }}>
      {bar(lerp(0, 230, inv), "THE INVESTMENT", false, inv)}
      {bar(lerp(20, 560, cost), "COST OF WAITING", true, Math.min(1, cost * 4))}
    </div>
  );
};

/** 2 · timing, money, or certainty — then "which one?" cycles through them. */
const ThreeThings = ({ t }: { t: number }) => {
  const items: [number, string][] = [
    [T.timing1, "TIMING"],
    [T.money, "MONEY"],
    [T.whether, "WILL IT WORK?"],
  ];
  const cyc = t > T.which + 0.1 ? Math.floor((t - T.which - 0.1) / 0.28) : -1;
  const sel = cyc >= 0 ? (cyc < 6 ? cyc % 3 : 2) : -1;
  return (
    <div style={{ display: "flex", gap: 18, paddingTop: 14 }}>
      {items.map(([s, label], k) => {
        const p = spring(t, s - 0.06, 2.6, 8);
        const on = sel === k;
        return (
          <div
            key={k}
            style={{
              ...glass,
              padding: "20px 28px",
              borderRadius: 22,
              fontFamily: SANS,
              fontWeight: 800,
              fontSize: 38,
              letterSpacing: 0.5,
              color: on ? "#fff" : CREAM,
              background: on ? `linear-gradient(180deg, #FF7A50, ${EMBER} 60%, ${EMBER_DEEP})` : glass.background,
              boxShadow: on ? "0 14px 34px rgba(226,64,26,0.5)" : glass.boxShadow,
              opacity: Math.min(1, p * 1.5),
              transform: `scale(${lerp(0.6, 1, Math.min(1.1, p))})`,
              whiteSpace: "nowrap",
            }}
          >
            <span style={{ fontFamily: MONO, fontSize: 24, opacity: 0.7, marginRight: 12 }}>{k + 1}</span>
            {label}
          </div>
        );
      })}
    </div>
  );
};

/** 3 · the spouse asks; you're the one typing the answer. */
const Chat = ({ t }: { t: number }) => {
  const a = prog(t, T.ifSpouse - 0.05, 0.4, outBackSoft);
  const r = prog(t, T.whatTell - 0.1, 0.4, outBackSoft);
  const dots = (k: number) => 0.35 + 0.65 * Math.max(0, Math.sin((t * 7 - k * 0.9) % (Math.PI * 2)));
  return (
    <div style={{ position: "relative", height: 150 }}>
      <div style={{ position: "absolute", left: 0, top: 4, opacity: a, transform: `translateY(${(1 - a) * 20}px) scale(${lerp(0.9, 1, a)})`, transformOrigin: "0% 100%" }}>
        <div style={{ fontFamily: MONO, fontSize: 20, letterSpacing: 4, color: MUTED, marginBottom: 6, marginLeft: 8 }}>YOUR SPOUSE</div>
        <div style={{ ...glass, padding: "16px 28px", borderRadius: "28px 28px 28px 8px", fontFamily: SANS, fontWeight: 600, fontSize: 38, color: CREAM }}>So what did you think?</div>
      </div>
      <div
        style={{
          position: "absolute",
          right: 0,
          top: 70,
          padding: "18px 30px",
          borderRadius: "28px 28px 8px 28px",
          background: `linear-gradient(180deg, #FF7A50, ${EMBER})`,
          display: "flex",
          gap: 10,
          opacity: r,
          transform: `translateY(${(1 - r) * 20}px) scale(${lerp(0.9, 1, r)})`,
          transformOrigin: "100% 100%",
          boxShadow: "0 12px 30px rgba(226,64,26,0.45)",
        }}
      >
        {[0, 1, 2].map((k) => (
          <div key={k} style={{ width: 16, height: 16, borderRadius: 8, background: "#fff", opacity: dots(k) }} />
        ))}
      </div>
    </div>
  );
};

/** 4 · today vs six months later, and the regret pointing back at today. */
const Timeline = ({ t }: { t: number }) => {
  const draw = prog(t, T.because2 - 0.1, T.six - T.because2 + 0.4, inOutCubic);
  const right = prog(t, T.six - 0.05, 0.4, outBack);
  const wish = prog(t, T.wish - 0.1, 0.4, outExpo);
  const today = spring(t, T.today - 0.05, 2.4, 6);
  const W = 960;
  return (
    <div style={{ position: "relative", height: 150, opacity: prog(t, T.because2 - 0.15, 0.3) }}>
      <svg width={W} height={150} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        <line x1={30} y1={60} x2={30 + (W - 60) * draw} y2={60} stroke="rgba(245,239,230,0.35)" strokeWidth={4} strokeDasharray="2 12" strokeLinecap="round" />
        {/* regret arc: from six months later back to today */}
        <path d={`M ${W - 30} 48 C ${W - 220} 0, 220 0, 30 48`} fill="none" stroke={EMBER} strokeWidth={4} strokeLinecap="round" pathLength={1} strokeDasharray="1" strokeDashoffset={1 - wish} opacity={0.9} />
        <circle cx={30} cy={60} r={lerp(12, 18, Math.min(1, today))} fill={today > 0 ? EMBER : CREAM} />
        {today > 0 && <circle cx={30} cy={60} r={18 + (today > 0 ? (t - T.today) * 120 : 0)} fill="none" stroke={EMBER} strokeWidth={3} opacity={Math.max(0, 1 - (t - T.today) * 1.6)} />}
        <circle cx={W - 30} cy={60} r={12 * right} fill="rgba(245,239,230,0.6)" />
      </svg>
      <div style={{ position: "absolute", left: 0, top: 88, fontFamily: SANS, fontWeight: 800, fontSize: 40, color: today > 0 ? EMBER : CREAM, transform: `scale(${lerp(1, 1.12, Math.min(1, today))})`, transformOrigin: "0% 50%" }}>TODAY</div>
      <div style={{ position: "absolute", right: 0, top: 88, fontFamily: SANS, fontWeight: 800, fontSize: 40, color: MUTED, opacity: right, textAlign: "right" }}>6 MONTHS LATER</div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 92, textAlign: "center", fontFamily: SERIF, fontStyle: "italic", fontSize: 38, color: CREAM, opacity: wish }}>“I wish I’d started…”</div>
    </div>
  );
};

/** End: the four closes as a cheat sheet over the last frame. */
export const Recap = () => {
  const t = useCurrentFrame() / FPS;
  if (t < T.recap - 0.1) return null;
  const a = prog(t, T.recap - 0.05, 0.45, outExpo);
  return (
    <AbsoluteFill>
      <Abs style={{ left: 50, right: 50, top: 720, ...glass, borderRadius: 40, padding: "40px 46px", opacity: a, transform: `translateY(${(1 - a) * 60}px)` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 64, color: CREAM, lineHeight: "70px" }}>4 objections, 4 closes</div>
          <div style={{ padding: "8px 18px", borderRadius: 24, background: EMBER, fontFamily: MONO, fontWeight: 700, fontSize: 22, letterSpacing: 3, color: "#fff" }}>SAVE THIS</div>
        </div>
        <div style={{ height: 2, background: "rgba(255,255,255,0.1)", margin: "26px 0 10px" }} />
        {BEATS.map((b, k) => {
          const p = prog(t, T.recap + 0.2 + k * 0.14, 0.45, outExpo);
          return (
            <div key={k} style={{ display: "flex", gap: 26, padding: "18px 0", borderBottom: k < 3 ? "1.5px solid rgba(255,255,255,0.07)" : "none", opacity: p, transform: `translateX(${(1 - p) * 40}px)` }}>
              <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 34, color: EMBER, width: 54, paddingTop: 4 }}>0{b.n}</div>
              <div>
                <div style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 40, color: MUTED, lineHeight: "46px" }}>“{b.say.replace(/\.$/, "")}”</div>
                <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 46, color: CREAM, letterSpacing: -1, lineHeight: "56px" }}>→ {b.close}</div>
              </div>
            </div>
          );
        })}
      </Abs>
    </AbsoluteFill>
  );
};
