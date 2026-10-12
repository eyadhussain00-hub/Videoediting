import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { B, ease, easeIO, env, lerp, ramp } from "../beats";
import { C, MONO, SANS, SERIF } from "../theme";
import { bigWordAt } from "./BigWords";
import { Center, glass, pop } from "./ui";

const W = 860;

/** 1.6–6.3 s: agree ↔ disagree slider; the middle goes grey and gets stamped IRRELEVANT. */
const Polarity = ({ t }: { t: number }) => {
  const a = 1.6;
  const b = B.views - 0.1;
  const v = env(t, a, b, 0.35, 0.25);
  if (v <= 0) return null;
  // knob position −1 (agree) … +1 (disagree) … 0 (in between)
  const pos =
    t < B.disagree
      ? lerp(0, -1, ramp(t, B.agree - 0.05, 0.35))
      : t < B.between
        ? lerp(-1, 1, ramp(t, B.disagree - 0.05, 0.4))
        : lerp(1, 0, ramp(t, B.between, 0.5, easeIO));
  const mid = ramp(t, B.between + 0.2, 0.3);
  const stamp = ramp(t, B.irrelevant, 0.22);
  const knobX = (W - 120) / 2 + pos * ((W - 160) / 2);
  const hot = Math.abs(pos) > 0.6 && mid < 0.5;
  return (
    <Center y={1270} style={pop(v)}>
      <div style={{ position: "relative", width: W }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontFamily: MONO, fontSize: 28, letterSpacing: "0.2em", color: C.dim, marginBottom: 18, padding: "0 10px" }}>
          <span style={{ color: pos < -0.6 && mid < 0.5 ? C.accent : C.dim }}>STRONGLY AGREE</span>
          <span style={{ color: pos > 0.6 && mid < 0.5 ? C.accent : C.dim }}>STRONGLY DISAGREE</span>
        </div>
        <div style={{ ...glass({ height: 110, borderRadius: 60, position: "relative", overflow: "hidden" }) }}>
          {/* ends glow, middle dead zone */}
          <div style={{ position: "absolute", inset: 0, background: `linear-gradient(90deg, ${C.accentSoft} 0%, rgba(0,0,0,0) 28%, rgba(0,0,0,0) 72%, ${C.accentSoft} 100%)` }} />
          <div
            style={{
              position: "absolute",
              top: 0,
              bottom: 0,
              left: "28%",
              right: "28%",
              background: "repeating-linear-gradient(135deg, rgba(255,255,255,0.10) 0 10px, rgba(255,255,255,0.02) 10px 20px)",
              opacity: mid,
            }}
          />
          <div
            style={{
              position: "absolute",
              top: 15,
              left: knobX + 20,
              width: 80,
              height: 80,
              borderRadius: 40,
              background: hot ? `radial-gradient(circle at 35% 30%, #FFB08A, ${C.accent})` : "radial-gradient(circle at 35% 30%, #9a9a9a, #555)",
              boxShadow: hot ? `0 0 40px ${C.accent}` : "0 6px 16px rgba(0,0,0,0.5)",
            }}
          />
        </div>
        {stamp > 0 && (
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: 70,
              transform: `translate(-50%, -50%) rotate(-7deg) scale(${lerp(1.8, 1, stamp)})`,
              opacity: stamp,
              fontFamily: SANS,
              fontWeight: 900,
              fontSize: 64,
              letterSpacing: "0.04em",
              color: C.no,
              border: `6px solid ${C.no}`,
              borderRadius: 14,
              padding: "6px 22px",
              background: "rgba(10,10,10,0.55)",
            }}
          >
            IRRELEVANT
          </div>
        )}
      </div>
    </Center>
  );
};

/** 6.3–7.5 s: views counter rolls down to zero. */
const Views = ({ t }: { t: number }) => {
  const v = env(t, B.views - 0.1, 7.55, 0.25, 0.2);
  if (v <= 0) return null;
  const n = Math.round(interpolate(t, [B.views, B.views + 0.55], [48213, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease }));
  const zero = n === 0;
  return (
    <Center y={1290} style={pop(v)}>
      <div style={{ ...glass({ borderRadius: 40, padding: "26px 50px", display: "flex", alignItems: "center", gap: 28 }) }}>
        <svg width="70" height="70" viewBox="0 0 24 24" fill="none" stroke={zero ? C.no : C.paper} strokeWidth="1.8">
          <path d="M1.5 12 C4 7 8 4.5 12 4.5 C16 4.5 20 7 22.5 12 C20 17 16 19.5 12 19.5 C8 19.5 4 17 1.5 12 Z" />
          <circle cx="12" cy="12" r="3.5" />
          {zero && <path d="M3 3 L21 21" strokeWidth="2.2" />}
        </svg>
        <span style={{ fontFamily: SANS, fontWeight: 900, fontSize: 96, color: zero ? C.no : C.paper, fontVariantNumeric: "tabular-nums", letterSpacing: "-0.03em" }}>
          {n.toLocaleString("en-US")}
        </span>
        <span style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 72, color: C.dim }}>views</span>
      </div>
    </Center>
  );
};

/** 9.9–11.4 s: three empty slots for the three reasons. */
const Slots = ({ t }: { t: number }) => {
  const v = env(t, 9.85, 11.45, 0.2, 0.3);
  if (v <= 0) return null;
  return (
    <Center y={1290} style={{ gap: 26, opacity: v }}>
      {["01", "02", "03"].map((s, i) => {
        const k = ramp(t, 9.9 + i * 0.12, 0.4);
        const lit = t > B.three + 0.05;
        return (
          <div
            key={s}
            style={{
              ...pop(k, 60),
              ...glass({ width: 230, height: 200, borderRadius: 34, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8 }),
              borderColor: lit ? C.accent : C.line,
              boxShadow: lit ? `0 0 50px ${C.accentSoft}, inset 0 1px 0 rgba(255,255,255,0.08)` : glass().boxShadow,
            }}
          >
            <span style={{ fontFamily: MONO, fontSize: 26, letterSpacing: "0.25em", color: lit ? C.accent : C.dim }}>REASON</span>
            <span style={{ fontFamily: SANS, fontWeight: 900, fontSize: 86, color: C.paper, letterSpacing: "-0.03em" }}>{s}</span>
          </div>
        );
      })}
    </Center>
  );
};

/** 11.1–33.6 s: chapter tracker at the top, the active reason fills over its section. */
const CH = [
  { n: "01", name: "RELEVANCE", a: B.ch1, b: B.ch2 },
  { n: "02", name: "PAIN", a: B.ch2, b: B.ch3 },
  { n: "03", name: "TRUST", a: B.ch3, b: 33.6 },
];
const Hud = ({ t }: { t: number }) => {
  // fades out while a chapter word fills the top of the frame
  const clear = Math.min(...[-0.2, -0.1, 0, 0.1, 0.2].map((d) => 1 - bigWordAt(t + d)));
  const v = env(t, B.ch1 + 0.2, 33.8, 0.4, 0.4) * (0.15 + 0.85 * clear);
  if (v <= 0) return null;
  return (
    <Center y={232} style={{ gap: 14, opacity: v, transform: `translateY(${(1 - v) * -30}px)` }}>
      {CH.map((c) => {
        const p = ramp(t, c.a, c.b - c.a, (x) => x);
        const active = t >= c.a && t < c.b;
        return (
          <div key={c.n} style={{ width: 290 }}>
            <div style={{ display: "flex", gap: 12, fontFamily: MONO, fontSize: 22, letterSpacing: "0.18em", color: active ? C.paper : C.dim, marginBottom: 10 }}>
              <span style={{ color: active || p >= 1 ? C.accent : C.dim }}>{c.n}</span>
              <span>{c.name}</span>
            </div>
            <div style={{ height: 6, borderRadius: 3, background: "rgba(244,239,230,0.2)", overflow: "hidden" }}>
              <div style={{ width: `${p * 100}%`, height: "100%", background: C.accent, boxShadow: `0 0 12px ${C.accent}` }} />
            </div>
          </div>
        );
      })}
    </Center>
  );
};

export const Hook = () => {
  const t = useCurrentFrame() / useVideoConfig().fps;
  return (
    <>
      <Polarity t={t} />
      <Views t={t} />
      <Slots t={t} />
      <Hud t={t} />
    </>
  );
};
