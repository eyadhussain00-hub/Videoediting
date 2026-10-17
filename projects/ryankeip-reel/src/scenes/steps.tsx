import { useCurrentFrame } from "remotion";
import { CYAN, FPS, T, TEAL, calmAt } from "../data";
import { MONO, SANS, SERIF } from "../fonts";
import { Abs, AMBER, BONE, EMBER, IconCheck, IconHeart, IconX, RED, glass, inOutCubic, lerp, mix, outBack, outExpo, prog, win } from "../ui";
import { Ecg, LitLine, Tag } from "./hud";
import { bpmAt } from "./hook";

const useT = () => useCurrentFrame() / FPS;
const STEP_COL = [EMBER, AMBER, CYAN];

/** "Three steps. Recognize, regulate, redirect." — full-frame stack over a darkened room. */
export const ThreeSteps = () => {
  const t = useT();
  const a = T.three - 0.1, b = T.first - 0.1;
  const v = win(t, a, b, 0.2, 0.25);
  if (v <= 0.001) return null;
  const items: [string, number][] = [["Recognize", T.recognize1], ["Regulate", T.regulate1], ["Redirect", T.redirect1]];
  return (
    <Abs style={{ inset: 0, opacity: v }}>
      <Abs style={{ inset: 0, background: "radial-gradient(ellipse 80% 60% at 50% 45%, rgba(6,7,9,0.55), rgba(6,7,9,0.88))" }} />
      <Abs style={{ left: 0, right: 0, top: 300, textAlign: "center", fontFamily: MONO, fontSize: 30, letterSpacing: 8, color: "rgba(244,239,230,0.7)", opacity: prog(t, a, 0.3) }}>
        HOW TO INTERRUPT IT
      </Abs>
      <Abs style={{ left: 90, right: 90, top: 420, display: "flex", flexDirection: "column", gap: 34 }}>
        {items.map(([w, at], i) => {
          const p = prog(t, at - 0.12, 0.45, outExpo);
          const live = t >= at - 0.12 && (i === 2 || t < items[i + 1][1] - 0.12);
          return (
            <div key={w} style={{ display: "flex", alignItems: "baseline", gap: 30, opacity: lerp(0.15, live ? 1 : 0.55, p), transform: `translateX(${(1 - p) * 120}px)` }}>
              <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 44, color: STEP_COL[i] }}>0{i + 1}</div>
              <div style={{ fontFamily: SERIF, fontStyle: live ? "italic" : "normal", fontSize: 168, lineHeight: 1, letterSpacing: -2, color: live ? BONE : "rgba(244,239,230,0.75)", textShadow: live ? `0 0 50px ${STEP_COL[i]}66` : undefined }}>{w}</div>
            </div>
          );
        })}
      </Abs>
      <Abs style={{ left: 90, right: 90, top: 1300, height: 8, borderRadius: 8, background: "rgba(255,255,255,0.1)", overflow: "hidden" }}>
        <div style={{ height: 8, width: `${prog(t, T.recognize1, T.redirect1 + 0.3 - T.recognize1, inOutCubic) * 100}%`, background: `linear-gradient(90deg, ${EMBER}, ${AMBER}, ${CYAN})` }} />
      </Abs>
    </Abs>
  );
};

/** Step tags, top-left, for the three chapters. */
export const StepTags = () => {
  const t = useT();
  return (
    <>
      <Tag t={t} a={T.first - 0.1} b={T.second - 0.1} n="01" label="RECOGNIZE" color={EMBER} />
      <Tag t={t} a={T.second - 0.1} b={T.third - 0.1} n="02" label="REGULATE" color={AMBER} />
      <Tag t={t} a={T.third - 0.1} b={T.remember - 0.3} n="03" label="REDIRECT" color={CYAN} />
    </>
  );
};

/** "Tell yourself: this is adrenaline, not danger." */
export const Recognize = () => {
  const t = useT();
  const a = T.tell - 0.15, b = T.second - 0.1;
  const v = win(t, a, b, 0.25, 0.25);
  if (v <= 0.001) return null;
  const adr = prog(t, T.adrenaline2 - 0.08, 0.4, outBack);
  const dan = prog(t, T.not - 0.08, 0.4, outBack);
  const strike = prog(t, T.danger + 0.1, 0.3, inOutCubic);
  const card = (txt: string, ok: boolean, p: number) => (
    <div style={{ ...glass, flex: 1, padding: "26px 24px", borderRadius: 30, display: "flex", flexDirection: "column", alignItems: "center", gap: 14, opacity: p, transform: `translateY(${(1 - p) * 40}px) scale(${lerp(0.85, 1, p)})`, borderColor: ok ? "rgba(43,212,167,0.6)" : "rgba(255,46,58,0.5)" }}>
      <div style={{ width: 64, height: 64, borderRadius: 64, background: ok ? TEAL : RED, display: "flex", alignItems: "center", justifyContent: "center" }}>
        {ok ? <IconCheck size={40} color="#06251c" sw={3.2} /> : <IconX size={36} color="#fff" sw={3.2} />}
      </div>
      <div style={{ position: "relative", fontFamily: SANS, fontWeight: 900, fontSize: 56, letterSpacing: -1, color: BONE }}>
        {txt}
        {!ok && <div style={{ position: "absolute", left: -6, top: "52%", height: 6, width: `${(strike * 104).toFixed(1)}%`, background: RED, borderRadius: 6 }} />}
      </div>
      <div style={{ fontFamily: MONO, fontSize: 22, letterSpacing: 3, color: "rgba(244,239,230,0.6)" }}>{ok ? "WHAT IT IS" : "WHAT IT ISN'T"}</div>
    </div>
  );
  return (
    <Abs style={{ left: 50, right: 50, top: 1060, opacity: v }}>
      <div style={{ textAlign: "center", fontFamily: SERIF, fontStyle: "italic", fontSize: 60, color: BONE, opacity: prog(t, a, 0.35), marginBottom: 24, textShadow: "0 6px 30px rgba(0,0,0,0.6)" }}>Tell yourself:</div>
      <div style={{ display: "flex", gap: 24 }}>
        {card("Adrenaline", true, adr)}
        {card("Danger", false, dan)}
      </div>
    </Abs>
  );
};

const regWin = (t: number) => win(t, T.slow - 0.15, T.third - 0.1, 0.25, 0.3);
const breathScale = (t: number) => {
  const inhale = prog(t, T.breath - 0.3, T.longer - T.breath + 0.3, inOutCubic);
  const exhale = prog(t, T.longer, T.third - 0.3 - T.longer, inOutCubic);
  return lerp(0.55, 1, inhale) - lerp(0, 0.45, exhale);
};

/** "Slow down. Take one controlled breath with a longer exhale." — a breath ring behind his head (render before <Person/>). */
export const RegulateRing = () => {
  const t = useT();
  const v = regWin(t);
  if (v <= 0.001) return null;
  const s = breathScale(t);
  const col = mix(AMBER, CYAN, calmAt(t));
  return (
    <Abs style={{ left: 540 - 450, top: 560 - 450, width: 900, height: 900, opacity: v, display: "flex", alignItems: "center", justifyContent: "center" }}>
      {[1, 0.8, 0.62].map((k, i) => (
        <div key={i} style={{ position: "absolute", width: 860 * s * k, height: 860 * s * k, borderRadius: 999, border: `${i ? 3 : 6}px solid ${col}`, opacity: i ? 0.35 : 0.95, boxShadow: i ? undefined : `0 0 80px ${col}, inset 0 0 80px ${mix(AMBER, CYAN, calmAt(t), 0.35)}` }} />
      ))}
    </Abs>
  );
};
/** Front readouts for the breath: the phase pill and the heart rate settling. */
export const Regulate = () => {
  const t = useT();
  const v = regWin(t);
  if (v <= 0.001) return null;
  const c = calmAt(t);
  const col = mix(AMBER, CYAN, c);
  const phase = t < T.take - 0.1 ? "SLOW DOWN" : t < T.longer ? "INHALE" : "EXHALE · LONGER";
  const bpm = bpmAt(t);
  return (
    <>
      <Abs style={{ left: 0, right: 0, top: 230, display: "flex", justifyContent: "center", opacity: v }}>
        <div style={{ ...glass, padding: "14px 30px", borderRadius: 40, fontFamily: MONO, fontWeight: 700, fontSize: 30, letterSpacing: 4, color: BONE, borderColor: col }}>{phase}</div>
      </Abs>
      <Abs style={{ left: 44, top: 1120, ...glass, display: "flex", alignItems: "center", gap: 18, padding: "14px 26px", borderRadius: 30, opacity: v * prog(t, T.take, 0.4) }}>
        <IconHeart size={40} color={col} sw={2.4} />
        <div style={{ fontFamily: SANS, fontWeight: 900, fontSize: 56, color: BONE, fontVariantNumeric: "tabular-nums" }}>{bpm}</div>
        <div style={{ fontFamily: MONO, fontSize: 24, color: col }}>BPM {c > 0.5 ? "▼" : ""}</div>
        <Ecg t={t} w={260} h={60} rate={bpm / 60} color={col} amp={lerp(1, 0.6, c)} />
      </Abs>
    </>
  );
};

/** "Stop thinking 'how do I get this deal?' and start thinking 'what does the prospect still need clarity on?'" */
export const Redirect = () => {
  const t = useT();
  const a = T.stop - 0.15, b = T.now2 - 0.1;
  const v = win(t, a, b, 0.25, 0.25);
  if (v <= 0.001) return null;
  const q1 = prog(t, T.how2 - 0.1, 0.4, outBack);
  const kill = prog(t, T.start2 - 0.1, 0.4, inOutCubic);
  const q2 = prog(t, T.what2 - 0.1, 0.45, outBack);
  return (
    <Abs style={{ left: 54, right: 54, top: 1080, display: "flex", flexDirection: "column", gap: 26, opacity: v }}>
      <div style={{ ...glass, padding: "26px 30px", borderRadius: "36px 36px 36px 8px", borderColor: "rgba(255,46,58,0.5)", opacity: lerp(q1, 0.45, kill), transform: `scale(${lerp(0.85, 1, q1) - kill * 0.06})`, transformOrigin: "left center" }}>
        <div style={{ fontFamily: MONO, fontSize: 22, letterSpacing: 3, color: RED, marginBottom: 8 }}>STOP THINKING</div>
        <div style={{ position: "relative", display: "inline-block", fontFamily: SERIF, fontStyle: "italic", fontSize: 62, color: BONE }}>
          “How do I get this deal?”
          <div style={{ position: "absolute", left: -8, top: "54%", height: 6, borderRadius: 6, width: `${kill * 104}%`, background: RED }} />
        </div>
      </div>
      <div style={{ ...glass, alignSelf: "flex-end", padding: "26px 30px", borderRadius: "36px 36px 8px 36px", borderColor: "rgba(79,227,255,0.6)", opacity: q2, transform: `scale(${lerp(0.85, 1, q2)})`, transformOrigin: "right center", boxShadow: `0 0 50px rgba(79,227,255,${0.25 * q2})` }}>
        <div style={{ fontFamily: MONO, fontSize: 22, letterSpacing: 3, color: CYAN, marginBottom: 8 }}>START THINKING</div>
        <LitLine t={t} words={["“What", "does", "the", "prospect", "still", "need", "clarity", "on?”"]} times={[T.what2, T.what2 + 0.2, T.what2 + 0.32, T.what2 + 0.48, T.clarity - 0.6, T.clarity - 0.3, T.clarity, T.on - 0.2]} size={62} color={(i) => (i === 6 ? CYAN : BONE)} style={{ justifyContent: "flex-start" }} />
      </div>
    </Abs>
  );
};

/** "Now you're back in discovery instead of self-preservation." */
export const Discovery = () => {
  const t = useT();
  const a = T.now2 - 0.1, b = T.remember - 0.3;
  const v = win(t, a, b, 0.25, 0.25);
  if (v <= 0.001) return null;
  const d = prog(t, T.discovery - 0.08, 0.4, outBack);
  const s = prog(t, T.selfp - 0.08, 0.4, outBack);
  const pill = (txt: string, ok: boolean, p: number) => (
    <div style={{ ...glass, display: "flex", alignItems: "center", gap: 16, padding: "18px 30px 18px 18px", borderRadius: 60, opacity: ok ? p : lerp(0, 0.6, p), transform: `scale(${lerp(0.8, ok ? 1.06 : 0.92, p)})`, borderColor: ok ? CYAN : undefined, boxShadow: ok ? `0 0 50px rgba(79,227,255,${0.3 * p})` : undefined }}>
      <div style={{ width: 56, height: 56, borderRadius: 56, background: ok ? CYAN : "rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        {ok ? <IconCheck size={36} color="#03222b" sw={3.2} /> : <IconX size={32} color={RED} sw={3} />}
      </div>
      <div style={{ fontFamily: SANS, fontWeight: 900, fontSize: 52, letterSpacing: -1, color: ok ? BONE : "rgba(244,239,230,0.6)", textDecoration: ok ? "none" : "line-through", textDecorationColor: RED }}>{txt}</div>
    </div>
  );
  return (
    <Abs style={{ left: 0, right: 0, top: 220, display: "flex", flexDirection: "column", alignItems: "center", gap: 22, opacity: v }}>
      <div style={{ fontFamily: MONO, fontSize: 24, letterSpacing: 5, color: "rgba(244,239,230,0.65)" }}>BACK IN</div>
      {pill("Discovery", true, d)}
      {pill("Self-preservation", false, s)}
    </Abs>
  );
};

/** "Your prospect didn't necessarily create that anxiety. Your anticipation of rejection did." */
export const Remember = () => {
  const t = useT();
  const a = T.remember - 0.3, b = T.elite - 0.12;
  const v = win(t, a, b, 0.25, 0.25);
  if (v <= 0.001) return null;
  const strike = prog(t, T.anticipation - 0.2, 0.35, inOutCubic);
  return (
    <Abs style={{ left: 50, right: 50, top: 160, display: "flex", flexDirection: "column", alignItems: "center", gap: 18, opacity: v }}>
      <div style={{ fontFamily: MONO, fontSize: 24, letterSpacing: 6, color: CYAN, opacity: prog(t, a, 0.3) }}>REMEMBER</div>
      <div style={{ position: "relative", opacity: prog(t, T.prospect3 - 0.1, 0.3) * lerp(1, 0.45, strike) }}>
        <LitLine t={t} words={["Your", "prospect", "didn't", "create", "the", "anxiety."]} times={[T.prospect3 - 0.05, T.prospect3, T.create - 0.6, T.create, T.create + 0.4, T.anxiety2 - 0.5]} size={70} color={BONE} italic={false} />
        <div style={{ position: "absolute", left: 0, top: "50%", height: 5, borderRadius: 5, width: `${strike * 100}%`, background: "rgba(244,239,230,0.8)" }} />
      </div>
      <div style={{ opacity: prog(t, T.anticipation - 0.15, 0.3), transform: `translateY(${(1 - prog(t, T.anticipation - 0.15, 0.5, outExpo)) * 30}px)` }}>
        <LitLine t={t} words={["Your", "anticipation", "did."]} times={[T.anticipation - 0.15, T.anticipation, T.did - 0.25]} size={104} color={(i) => (i === 1 ? CYAN : BONE)} />
      </div>
    </Abs>
  );
};

/** Finale: letterbox, quote lit word by word, then the end card over the freeze. */
export const Finale = () => {
  const t = useT();
  const a = T.elite - 0.12;
  if (t < a) return null;
  const lb = prog(t, a, 0.6, inOutCubic) * (1 - prog(t, T.endCard - 0.1, 0.4));
  const l1 = ["Elite", "salespeople", "don't", "eliminate", "the", "fear."];
  const l2 = ["They", "stop", "letting", "it", "control", "the", "conversation."];
  const t1 = [T.elite, T.elite + 0.12, T.eliminate - 0.45, T.eliminate, T.fear1 - 0.25, T.fear1];
  const t2 = [T.they3, T.stop2, T.stop2 + 0.3, T.fear2 - 0.2, T.control2, T.control2 + 0.35, T.control2 + 0.5];
  const qv = 1 - prog(t, T.endCard - 0.05, 0.35);
  return (
    <>
      <Abs style={{ left: 0, right: 0, top: 0, height: 150 * lb, background: "#000" }} />
      <Abs style={{ left: 0, right: 0, bottom: 0, height: 150 * lb, background: "#000" }} />
      <Abs style={{ left: 0, right: 0, top: 1120, height: 650, opacity: qv * lb, background: "linear-gradient(180deg, rgba(0,0,0,0), rgba(0,0,0,0.7) 35%, rgba(0,0,0,0.75))" }} />
      <Abs style={{ left: 60, right: 60, top: 1250, opacity: qv }}>
        <LitLine t={t} words={l1} times={t1} size={78} color={(i) => (i === 3 ? CYAN : BONE)} dim={0.15} />
        <div style={{ height: 18 }} />
        <LitLine t={t} words={l2} times={t2} size={78} color={(i) => (i === 4 ? CYAN : BONE)} dim={0.15} />
      </Abs>
    </>
  );
};

export const EndCard = () => {
  const t = useT();
  const a = T.endCard - 0.05;
  if (t < a) return null;
  const p = prog(t, a, 0.6, outExpo);
  const p2 = prog(t, a + 0.35, 0.5, outBack);
  return (
    <Abs style={{ inset: 0 }}>
      <Abs style={{ inset: 0, background: `rgba(6,7,9,${0.72 * p})`, backdropFilter: `blur(${12 * p}px)` }} />
      <Abs style={{ left: 0, right: 0, top: 640, display: "flex", flexDirection: "column", alignItems: "center", gap: 26, opacity: p, transform: `translateY(${(1 - p) * 40}px)` }}>
        <div style={{ fontFamily: MONO, fontSize: 26, letterSpacing: 8, color: CYAN }}>SAVE THIS FOR YOUR NEXT CALL</div>
        <div style={{ fontFamily: SANS, fontWeight: 900, fontSize: 132, letterSpacing: 4, color: BONE, lineHeight: 1 }}>RYAN KEIP</div>
        <div style={{ width: 380 * p, height: 3, background: `linear-gradient(90deg, rgba(79,227,255,0), ${CYAN}, rgba(79,227,255,0))` }} />
        <div style={{ fontFamily: MONO, fontSize: 32, letterSpacing: 10, color: "rgba(244,239,230,0.7)" }}>COACHING</div>
        <div style={{ ...glass, marginTop: 40, padding: "18px 40px", borderRadius: 60, fontFamily: SANS, fontWeight: 800, fontSize: 44, color: BONE, transform: `scale(${lerp(0.7, 1, p2)})`, opacity: p2, borderColor: CYAN }}>
          Follow <span style={{ color: CYAN }}>@theryankeip</span>
        </div>
      </Abs>
    </Abs>
  );
};

