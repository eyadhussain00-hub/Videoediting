import { useCurrentFrame, useVideoConfig } from "remotion";
import { B, easeIO, env, lerp, ramp } from "../beats";
import { C, MONO, SANS, SERIF } from "../theme";
import { Center, Cursor, glass, pop } from "./ui";

/** 17.6–19.2 s: "make your content a book for dummies" — a paperback flips up in 3D. */
const Book = ({ t }: { t: number }) => {
  const v = env(t, 17.55, 19.25, 0.5, 0.25);
  if (v <= 0) return null;
  const spin = lerp(-38, -14, ramp(t, 17.55, 1.6, easeIO));
  return (
    <Center y={1125} style={{ perspective: 1400, opacity: Math.min(1, v * 1.5) }}>
      <div
        style={{
          width: 360,
          height: 480,
          transformStyle: "preserve-3d",
          transform: `translateY(${(1 - v) * 200}px) rotateY(${spin}deg) rotateX(8deg) rotateZ(${lerp(-12, -4, v)}deg)`,
          position: "relative",
        }}
      >
        {/* page block (thickness) */}
        <div style={{ position: "absolute", inset: 0, transform: "translateZ(-34px)", background: "#e9e2cf", borderRadius: 8, boxShadow: "0 50px 90px rgba(0,0,0,0.55)" }} />
        {[...Array(6)].map((_, i) => (
          <div key={i} style={{ position: "absolute", inset: 0, transform: `translateZ(${-5 - i * 5}px)`, background: i % 2 ? "#f3eddc" : "#ddd5bf", borderRadius: 8 }} />
        ))}
        <div style={{ position: "absolute", inset: 0, borderRadius: 8, overflow: "hidden", background: "#FFD21F", boxShadow: "inset -14px 0 30px rgba(0,0,0,0.18)" }}>
          <div style={{ background: "#111", padding: "34px 30px 26px" }}>
            <div style={{ fontFamily: SANS, fontWeight: 900, fontSize: 70, lineHeight: 0.9, color: "#FFD21F", letterSpacing: "-0.03em" }}>CONTENT</div>
            <div style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 54, color: "#fff", marginTop: 6 }}>for Dummies</div>
          </div>
          <div style={{ padding: "26px 28px", fontFamily: SANS, fontWeight: 700, fontSize: 27, lineHeight: 1.25, color: "#111" }}>
            Say it so simply
            <br />a stranger gets it
            <br />in three seconds.
          </div>
          <div style={{ position: "absolute", bottom: 26, left: 30, right: 30, display: "flex", justifyContent: "space-between", fontFamily: MONO, fontSize: 20, color: "#111", letterSpacing: "0.12em" }}>
            <span>RULE 01</span>
            <span>RELEVANCE</span>
          </div>
          {/* glossy sweep */}
          <div style={{ position: "absolute", inset: 0, background: `linear-gradient(115deg, rgba(255,255,255,0) ${lerp(-20, 80, ramp(t, 17.9, 0.9))}%, rgba(255,255,255,0.45) ${lerp(-10, 90, ramp(t, 17.9, 0.9))}%, rgba(255,255,255,0) ${lerp(0, 100, ramp(t, 17.9, 0.9))}%)` }} />
        </div>
      </div>
    </Center>
  );
};

/** 14.4–17.0 s: "the most simplistic way possible" — a tangled scribble pulls straight. */
const Simplify = ({ t }: { t: number }) => {
  const v = env(t, 14.4, 17.1, 0.35, 0.3);
  if (v <= 0) return null;
  const k = ramp(t, B.simplistic, 0.9, easeIO);
  const draw = ramp(t, 14.45, 0.9, easeIO);
  const pts: string[] = [];
  const n = 90;
  for (let i = 0; i <= n; i++) {
    const u = i / n;
    const x = 40 + u * 700;
    const mess = Math.sin(u * 37) * 70 + Math.sin(u * 13 + 1) * 45 + Math.cos(u * 61) * 25;
    const loop = Math.sin(u * 23) * 60;
    pts.push(`${(x + loop * (1 - k)).toFixed(1)},${(110 + mess * (1 - k)).toFixed(1)}`);
  }
  return (
    <Center y={1250} style={pop(v)}>
      <div style={{ ...glass({ width: 860, borderRadius: 40, padding: "26px 40px 30px" }) }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontFamily: MONO, fontSize: 24, letterSpacing: "0.2em", marginBottom: 6 }}>
          <span style={{ color: k < 0.5 ? C.no : C.dim, textDecoration: k > 0.5 ? "line-through" : "none" }}>COMPLICATED</span>
          <span style={{ color: k > 0.5 ? C.accent : C.dim }}>SIMPLE</span>
        </div>
        <svg width="780" height="220" viewBox="0 0 780 220">
          <polyline points={pts.join(" ")} fill="none" stroke={k > 0.5 ? C.accent : C.paper} strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray="1" strokeDashoffset={1 - draw} />
          {k > 0.95 && <circle cx="740" cy="110" r="14" fill={C.accent} />}
        </svg>
      </div>
    </Center>
  );
};

/** 20.2–23.2 s: information gets wired to a pain. */
const Link = ({ t }: { t: number }) => {
  const v = env(t, B.info - 0.15, 23.2, 0.3, 0.25);
  if (v <= 0) return null;
  const draw = ramp(t, 21.4, 0.7, easeIO);
  const hit = ramp(t, B.pain, 0.3);
  const pill = (label: string, hot: boolean, k: number) => (
    <div
      style={{
        ...pop(k),
        ...glass({ borderRadius: 50, padding: "26px 40px", fontFamily: SANS, fontWeight: 900, fontSize: 50, letterSpacing: "0.02em" }),
        color: hot ? C.paper : C.paper,
        borderColor: hot ? C.no : C.line,
        boxShadow: hot ? `0 0 60px rgba(255,77,61,0.45)` : glass().boxShadow,
        background: hot ? "linear-gradient(180deg, rgba(120,20,14,0.8), rgba(60,10,8,0.8))" : glass().background,
      }}
    >
      {label}
    </div>
  );
  return (
    <Center y={1300} style={{ alignItems: "center", gap: 0, opacity: v }}>
      {pill("INFO", false, ramp(t, B.info - 0.15, 0.4))}
      <svg width="300" height="60" style={{ margin: "0 -6px" }}>
        <line x1="10" y1="30" x2={10 + 280 * draw} y2="30" stroke={hit > 0 ? C.accent : C.paper} strokeWidth="6" strokeDasharray={hit > 0 ? "0" : "14 12"} strokeLinecap="round" />
        {hit > 0 && <circle cx="150" cy="30" r={10 + hit * 40} fill="none" stroke={C.accent} strokeWidth={4 * (1 - hit)} opacity={1 - hit} />}
      </svg>
      {pill("PAIN", hit > 0, ramp(t, 21.2, 0.4))}
    </Center>
  );
};

/** 23.3–28.7 s: the "take action" button nobody presses, then "that's nice to know". */
const Shrug = ({ t }: { t: number }) => {
  const vb = env(t, 23.3, B.nice - 0.15, 0.35, 0.25);
  const vc = env(t, B.nice - 0.2, 28.7, 0.35, 0.3);
  const cx = lerp(820, 600, ramp(t, 23.9, 0.7, easeIO)) + Math.sin(t * 9) * 6 * ramp(t, 24.6, 0.3);
  const cy = lerp(1500, 1370, ramp(t, 23.9, 0.7, easeIO));
  const away = ramp(t, 25.4, 0.5, easeIO);
  return (
    <>
      {vb > 0 && (
        <Center y={1300} style={pop(vb)}>
          <div style={{ position: "relative" }}>
            <div style={{ ...glass({ borderRadius: 999, padding: "34px 70px", fontFamily: SANS, fontWeight: 900, fontSize: 58, color: "rgba(244,239,230,0.45)", display: "flex", gap: 22, alignItems: "center" }) }}>
              Take action <span style={{ fontFamily: SERIF, fontStyle: "italic", fontWeight: 400 }}>→</span>
            </div>
            <div style={{ position: "absolute", left: 0, top: 0, transform: `translate(${lerp(cx - 260, cx + 40, away) - 260}px, ${lerp(cy - 1300, cy - 1100, away)}px)` }}>
              <Cursor x={0} y={0} />
            </div>
          </div>
        </Center>
      )}
      {vc > 0 && (
        <Center y={1250} style={pop(vc)}>
          <div style={{ display: "flex", flexDirection: "column", gap: 18, alignItems: "flex-start" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
              <div style={{ width: 84, height: 84, borderRadius: 42, background: "linear-gradient(135deg,#6b6b70,#2b2b30)", border: `3px solid ${C.line}` }} />
              <div style={{ ...glass({ borderRadius: "34px 34px 34px 8px", padding: "24px 36px" }) }}>
                <div style={{ fontFamily: MONO, fontSize: 22, color: C.dim, letterSpacing: "0.1em", marginBottom: 6 }}>your viewer</div>
                <div style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 64, color: C.paper }}>“that’s nice to know”</div>
              </div>
            </div>
            <div
              style={{
                marginLeft: 106,
                fontFamily: SANS,
                fontWeight: 700,
                fontSize: 34,
                color: C.dim,
                opacity: ramp(t, 27.3, 0.3),
                transform: `translateY(${(1 - ramp(t, 27.3, 0.3)) * 14}px)`,
              }}
            >
              …scrolls on. <span style={{ color: C.no }}>0 sales.</span>
            </div>
          </div>
        </Center>
      )}
    </>
  );
};

/** 29.3–31.6 s: the payment they won't make. */
const Pay = ({ t }: { t: number }) => {
  const v = env(t, B.trust - 0.3, 31.7, 0.4, 0.3);
  if (v <= 0) return null;
  const k = ramp(t, 29.9, 0.8, easeIO);
  const back = ramp(t, 31.0, 0.5, easeIO);
  const cx = lerp(lerp(700, 470, k), 760, back) + Math.sin(t * 11) * 5 * k * (1 - back);
  const cy = lerp(lerp(560, 420, k), 600, back);
  return (
    <Center y={1135} style={{ ...pop(v, 80), transform: `${pop(v, 80).transform} scale(0.9)`, transformOrigin: "50% 0" }}>
      <div style={{ position: "relative", ...glass({ width: 700, borderRadius: 44, padding: "36px 44px" }) }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontFamily: MONO, fontSize: 24, color: C.dim, letterSpacing: "0.14em" }}>
          <span>SEND MONEY</span>
          <span>● SECURE</span>
        </div>
        <div style={{ fontFamily: SANS, fontWeight: 900, fontSize: 130, color: C.paper, letterSpacing: "-0.04em", margin: "12px 0 4px" }}>$997</div>
        <div style={{ fontFamily: SANS, fontWeight: 500, fontSize: 32, color: C.dim, marginBottom: 30 }}>to a stranger on the internet</div>
        <div style={{ height: 116, borderRadius: 30, background: `linear-gradient(180deg, #FF8A55, ${C.accent})`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: SANS, fontWeight: 900, fontSize: 48, color: "#1a0d06" }}>
          Pay now
        </div>
        <div style={{ position: "absolute", left: 0, top: 0, transform: `translate(${cx}px, ${cy}px)` }}>
          <Cursor x={0} y={0} />
        </div>
      </div>
    </Center>
  );
};

/** 32.5–33.7 s: know · like · trust light up on the words. */
const KLT = ({ t }: { t: number }) => {
  const v = env(t, 31.9, 33.7, 0.3, 0.3);
  if (v <= 0) return null;
  const items: [string, number][] = [["KNOW", B.know], ["LIKE", B.like], ["TRUST", B.trustK]];
  return (
    <Center y={1290} style={{ gap: 22, opacity: v }}>
      {items.map(([w, at]) => {
        const on = ramp(t, at - 0.04, 0.2);
        return (
          <div
            key={w}
            style={{
              ...glass({ borderRadius: 999, padding: "26px 44px", fontFamily: SANS, fontWeight: 900, fontSize: 52 }),
              color: on > 0.5 ? "#1a0d06" : C.dim,
              background: on > 0 ? `linear-gradient(180deg, #FF8A55, ${C.accent})` : glass().background,
              boxShadow: on > 0 ? `0 0 ${50 * on}px ${C.accentSoft}` : glass().boxShadow,
              transform: `scale(${1 + Math.sin(on * Math.PI) * 0.12})`,
            }}
          >
            {w}
          </div>
        );
      })}
    </Center>
  );
};

/** 36.5–38.4 s: what to talk about. */
const Tags = ({ t }: { t: number }) => {
  const v = env(t, B.passionate - 0.1, 38.45, 0.3, 0.25);
  if (v <= 0) return null;
  return (
    <Center y={1300} style={{ gap: 22, opacity: v }}>
      {[["♥", "Passions", B.passionate], ["◆", "Deep knowledge", B.knowledge]].map(([ic, w, at]) => (
        <div key={w as string} style={{ ...pop(ramp(t, (at as number) - 0.1, 0.4)), ...glass({ borderRadius: 999, padding: "24px 40px", display: "flex", gap: 18, alignItems: "center" }) }}>
          <span style={{ color: C.accent, fontSize: 40 }}>{ic}</span>
          <span style={{ fontFamily: SANS, fontWeight: 700, fontSize: 46, color: C.paper }}>{w}</span>
        </div>
      ))}
    </Center>
  );
};

/** 38.6–42.6 s: robot-speak gets decoded, then struck out. */
const JARGON = "Leverage synergistic paradigms to optimise your holistic value funnel.";
const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ#%&/<>*+=0123456789";
const Robot = ({ t }: { t: number }) => {
  const v = env(t, 38.6, 42.6, 0.3, 0.3);
  if (v <= 0) return null;
  const dec = ramp(t, 38.7, 1.3, (x) => x);
  const n = Math.floor(dec * JARGON.length);
  const frame = Math.floor(t * 30);
  const shown = [...JARGON].map((ch, i) => (i < n || ch === " " ? ch : GLYPHS[(i * 7 + frame * 13) % GLYPHS.length])).join("");
  const strike = ramp(t, B.robot, 0.35, easeIO);
  return (
    <Center y={1240} style={pop(v)}>
      <div style={{ ...glass({ width: 860, borderRadius: 30, padding: "30px 40px" }) }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontFamily: MONO, fontSize: 22, letterSpacing: "0.18em", color: C.dim, marginBottom: 14 }}>
          <span>&gt; ROBOT.EXE</span>
          <span style={{ color: strike > 0 ? C.no : C.dim }}>{strike > 0 ? "✕ CONFUSING" : "TRANSMITTING…"}</span>
        </div>
        <div style={{ position: "relative", fontFamily: MONO, fontSize: 40, lineHeight: 1.35, color: strike > 0 ? "rgba(244,239,230,0.5)" : C.paper }}>
          {shown}
          <div style={{ position: "absolute", left: 0, top: "34%", height: 6, width: `${strike * 100}%`, background: C.no, boxShadow: `0 0 16px ${C.no}`, transform: "rotate(-2deg)" }} />
          <div style={{ position: "absolute", left: 0, top: "78%", height: 6, width: `${ramp(t, B.robot + 0.12, 0.35, easeIO) * 70}%`, background: C.no, boxShadow: `0 0 16px ${C.no}`, transform: "rotate(-1deg)" }} />
        </div>
      </div>
    </Center>
  );
};

/** 45.0–48.8 s: the questions stack up as cards (captions are hidden here). */
const QS: [string, number, number][] = [
  ["What are your habits?", B.q1, -4],
  ["What do you enjoy?", B.q2, 3],
  ["What do you dislike?", B.q3, -2.5],
  ["What do you do every day?", B.q4, 4],
];
const Questions = ({ t }: { t: number }) => {
  const v = env(t, B.q1 - 0.1, B.expose - 0.05, 0.2, 0.3);
  if (v <= 0) return null;
  return (
    <div style={{ position: "absolute", inset: 0, opacity: v }}>
      {QS.map(([q, at, rot], i) => {
        const k = ramp(t, at - 0.08, 0.38);
        if (k <= 0) return null;
        const depth = QS.filter(([, a2]) => t >= a2 - 0.08).length - 1 - i; // how many cards landed on top
        return (
          <div
            key={q}
            style={{
              position: "absolute",
              left: 120,
              right: 120,
              top: 1040 + i * 18,
              transform: `translateY(${(1 - k) * 260 - depth * 36}px) rotate(${rot * k}deg) scale(${1 - depth * 0.04})`,
              opacity: Math.min(1, k * 2) * (1 - depth * 0.18),
              filter: depth > 0 ? `blur(${depth * 1.2}px)` : undefined,
            }}
          >
            <div style={{ background: C.paper, borderRadius: 34, padding: "40px 46px", boxShadow: "0 40px 80px rgba(0,0,0,0.5)" }}>
              <div style={{ fontFamily: MONO, fontSize: 22, color: C.accent, letterSpacing: "0.2em", marginBottom: 10 }}>Q{String(i + 1).padStart(2, "0")}</div>
              <div style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 76, lineHeight: 1.02, color: C.ink, letterSpacing: "-0.01em" }}>{q}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

/** 48.9–51.2 s: expose yourself → people connect. A ring of connection nodes. */
const Connect = ({ t }: { t: number }) => {
  const v = env(t, 49.7, 51.3, 0.4, 0.3);
  if (v <= 0) return null;
  const k = ramp(t, 49.8, 1.1, easeIO);
  const nodes = 9;
  return (
    <svg width="1080" height="700" style={{ position: "absolute", left: 0, top: 1130, opacity: v }}>
      {[...Array(nodes)].map((_, i) => {
        const ang = Math.PI * (0.08 + (0.84 * i) / (nodes - 1));
        const r = 360;
        const x = 540 - Math.cos(ang) * r;
        const y = 330 - Math.sin(ang) * r * 0.55;
        const kk = ramp(t, 49.8 + i * 0.06, 0.5);
        return (
          <g key={i} opacity={kk}>
            <line x1="540" y1="330" x2={lerp(540, x, k)} y2={lerp(330, y, k)} stroke={C.accent} strokeWidth="2.5" opacity="0.7" />
            <circle cx={x} cy={y} r={20 * kk} fill={i % 3 === 1 ? C.accent : C.paper} />
          </g>
        );
      })}
      <circle cx="540" cy="330" r="34" fill={C.accent} />
      <circle cx="540" cy="330" r={34 + 60 * ((t * 1.2) % 1)} fill="none" stroke={C.accent} strokeWidth="3" opacity={1 - ((t * 1.2) % 1)} />
    </svg>
  );
};

export const Story = () => {
  const t = useCurrentFrame() / useVideoConfig().fps;
  return (
    <>
      <Simplify t={t} />
      <Book t={t} />
      <Link t={t} />
      <Shrug t={t} />
      <Pay t={t} />
      <KLT t={t} />
      <Tags t={t} />
      <Robot t={t} />
      <Questions t={t} />
      <Connect t={t} />
    </>
  );
};

