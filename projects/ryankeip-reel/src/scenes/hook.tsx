import { useCurrentFrame } from "remotion";
import { FPS, T, heatAt } from "../data";
import { MONO, SANS, SERIF } from "../fonts";
import { Abs, AMBER, BONE, EMBER, IconBookmark, IconBrain, IconCheck, IconDrop, IconHand, IconHeart, IconSend, RED, glass, lerp, outBack, outExpo, prog, spring, win } from "../ui";
import { BigType, Blink, Chip, Ecg, Embers } from "./hud";

const useT = () => useCurrentFrame() / FPS;

/** Heart rate the HUD shows: resting 72, up to ~138 at the peak, back to 68 after the breath. */
export const bpmAt = (t: number) => Math.round(lerp(72, 138, heatAt(t)) + Math.sin(t * 3.1) * 1.5);

/** Hook, top: a live "sales call" bar with a body-scan readout. */
export const CallBar = () => {
  const t = useT();
  const v = win(t, 0.05, T.thats + 0.1, 0.3, 0.3);
  if (v <= 0.001) return null;
  const p = prog(t, 0.05, 0.6, outExpo);
  const secs = 14 * 60 + 32 + Math.floor(t);
  const h = heatAt(t);
  return (
    <Abs style={{ left: 54, right: 54, top: 112, height: 96, borderRadius: 30, ...glass, opacity: v, transform: `translateY(${(1 - p) * -60}px)`, display: "flex", alignItems: "center", padding: "0 28px", gap: 18 }}>
      <div style={{ width: 16, height: 16, borderRadius: 16, background: RED, boxShadow: `0 0 16px ${RED}`, opacity: Math.sin(t * 6) > 0 ? 1 : 0.35 }} />
      <div style={{ fontFamily: MONO, fontSize: 26, letterSpacing: 4, color: BONE }}>SALES CALL</div>
      <div style={{ fontFamily: MONO, fontSize: 26, color: "rgba(244,239,230,0.55)" }}>{`${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, "0")}`}</div>
      <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ fontFamily: MONO, fontSize: 22, letterSpacing: 3, color: "rgba(244,239,230,0.55)" }}>BODY TEMP</div>
        <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 34, color: h > 0.3 ? EMBER : BONE }}>{(36.6 + h * 1.6).toFixed(1)}°</div>
      </div>
    </Abs>
  );
};

/** "rush of heat" — the word HEAT behind him, ember gradient, rising embers. */
export const HeatType = () => {
  const t = useT();
  return (
    <>
      <BigType t={t} a={T.heat - 0.12} b={T.palms + 0.1} text="HEAT" y={250} size={400} color="rgba(255,90,31,1)" spacing={-14} stagger={0.05} />
      <Embers t={t} amount={win(t, T.heat - 0.2, T.thats, 0.5, 0.6) * 0.9} />
    </>
  );
};

/** Symptom readouts on cue: palms, upper lip, heart rate, "anxious". */
export const Symptoms = () => {
  const t = useT();
  const off = T.thats + 0.05;
  const bpm = bpmAt(t);
  const hb = spring(t % (60 / bpm), 0, 2, 9); // pulse per beat
  return (
    <>
      <Chip t={t} a={T.palms - 0.1} b={off} x={626} y={1080} side="right" width={410} color="rgba(255,176,32,1)" icon={<IconHand size={40} color={AMBER} />} label="PALMS" value="clammy" />
      <Chip t={t} a={T.sweaty - 0.1} b={off} x={44} y={300} side="left" width={380} color="rgba(255,176,32,1)" icon={<IconDrop size={40} color={AMBER} />} label="UPPER LIP" value="sweating" />
      {/* heart rate: the big one */}
      {(() => {
        const v = win(t, T.heart - 0.1, off, 0.25, 0.3);
        if (v <= 0.001) return null;
        const p = prog(t, T.heart - 0.1, 0.5, outExpo);
        return (
          <Abs style={{ left: 44, top: 1040, width: 470, padding: "22px 26px 18px", borderRadius: 30, ...glass, borderColor: "rgba(255,46,58,0.5)", opacity: v, transform: `translateX(${(1 - p) * -140}px)` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ transform: `scale(${1 + 0.18 * (1 - Math.min(1, hb))})` }}>
                <IconHeart size={44} color={RED} sw={2.4} />
              </div>
              <div style={{ fontFamily: MONO, fontSize: 21, letterSpacing: 3, color: "rgba(244,239,230,0.62)" }}>HEART RATE</div>
              <Blink t={t} color={RED} />
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginTop: 4 }}>
              <div style={{ fontFamily: SANS, fontWeight: 900, fontSize: 96, letterSpacing: -3, color: BONE, fontVariantNumeric: "tabular-nums" }}>{bpm}</div>
              <div style={{ fontFamily: MONO, fontSize: 26, color: RED }}>BPM ▲</div>
            </div>
            <Ecg t={t} w={418} h={70} rate={bpm / 60} color={RED} />
          </Abs>
        );
      })()}
      {/* anxious: red alert stamp */}
      {(() => {
        const v = win(t, T.anxious - 0.06, off, 0.08, 0.25);
        if (v <= 0.001) return null;
        const p = spring(t, T.anxious - 0.06, 2.6, 7);
        const jit = (Math.sin(t * 140) > 0.6 ? 6 : 0) * (1 - prog(t, T.anxious, 0.6));
        return (
          <Abs style={{ right: 60, top: 250, opacity: v, transform: `translateX(${jit}px) rotate(-4deg) scale(${lerp(1.6, 1, Math.min(1, p))})`, padding: "14px 30px", border: `5px solid ${RED}`, borderRadius: 16, background: "rgba(255,46,58,0.14)" }}>
            <div style={{ fontFamily: SANS, fontWeight: 900, fontSize: 72, letterSpacing: 4, color: RED, textShadow: `0 0 30px rgba(255,46,58,0.7)` }}>ANXIOUS</div>
          </Abs>
        );
      })()}
    </>
  );
};

/** "your nervous system reacting to a threat that hasn't even happened yet" */
export const Threat = () => {
  const t = useT();
  const a = T.nervous1 - 0.1, b = T.psychological - 0.05;
  const v = win(t, a, b, 0.2, 0.25);
  if (v <= 0.001) return null;
  const scan = ((t - a) * 0.9) % 1;
  return (
    <>
      <Abs style={{ left: 0, right: 0, top: 150, display: "flex", flexDirection: "column", alignItems: "center", opacity: v }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, ...glass, padding: "14px 26px", borderRadius: 40, transform: `translateY(${(1 - prog(t, a, 0.4, outExpo)) * -40}px)` }}>
          <IconBrain size={40} color={BONE} />
          <div style={{ fontFamily: MONO, fontSize: 26, letterSpacing: 4, color: BONE }}>NERVOUS SYSTEM</div>
          <Blink t={t} color={RED} />
        </div>
      </Abs>
      <Abs style={{ left: 60, right: 60, top: 1180, opacity: win(t, T.hasnt - 0.05, b, 0.2, 0.25) }}>
        <div style={{ textAlign: "center", fontFamily: SERIF, fontStyle: "italic", fontSize: 76, color: BONE, textShadow: "0 6px 30px rgba(0,0,0,0.7)", transform: `translateY(${(1 - prog(t, T.hasnt - 0.05, 0.4)) * 20}px)` }}>
          that hasn't even happened yet.
        </div>
      </Abs>
      {/* radar sweep line across the frame */}
      <Abs style={{ left: 0, right: 0, top: lerp(260, 1100, scan), height: 2, background: `linear-gradient(90deg, rgba(255,46,58,0), rgba(255,46,58,${0.7 * v}), rgba(255,46,58,0))`, boxShadow: "0 0 18px rgba(255,46,58,0.8)" }} />
    </>
  );
};
export const ThreatType = () => {
  const t = useT();
  return <BigType t={t} a={T.threat - 0.1} b={T.psychological - 0.05} text="THREAT" y={300} size={300} color="rgba(255,46,58,1)" spacing={-8} stagger={0.035} />;
};

/** "a psychological reason why … how to get control of it" — the promise, as two lines with ticks. */
export const Promise = () => {
  const t = useT();
  const b = T.listen - 0.05;
  const items: [string, number][] = [["Why it happens", T.psychological], ["How to control it", T.show]];
  return (
    <Abs style={{ left: 0, right: 0, top: 150, display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>
      {items.map(([txt, a], i) => {
        const v = win(t, a - 0.1, b, 0.25, 0.25);
        if (v <= 0.001) return null;
        const p = prog(t, a - 0.1, 0.5, outBack);
        const done = prog(t, i ? T.control1 : T.why - 0.2, 0.3, outBack);
        return (
          <div key={i} style={{ ...glass, display: "flex", alignItems: "center", gap: 18, padding: "16px 34px 16px 18px", borderRadius: 50, opacity: v, transform: `translateY(${(1 - p) * 40}px) scale(${lerp(0.9, 1, p)})` }}>
            <div style={{ width: 54, height: 54, borderRadius: 54, background: done > 0.01 ? EMBER : "rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${lerp(0.6, 1, done)})` }}>
              {done > 0.01 && <IconCheck size={34} color="#fff" sw={3} />}
            </div>
            <div style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 58, color: BONE }}>{txt}</div>
          </div>
        );
      })}
    </Abs>
  );
};

/** "save this one and share it with someone on your team" — save + share buttons. */
export const SaveShare = () => {
  const t = useT();
  const a = T.sell - 0.15, b = T.explain;
  const v = win(t, a, b, 0.25, 0.3);
  if (v <= 0.001) return null;
  const saved = prog(t, T.save, 0.25, outBack);
  const sent = prog(t, T.share, 0.6, outExpo);
  const btn = (k: number) => ({
    width: 150, height: 150, borderRadius: 150, ...glass, display: "flex", alignItems: "center", justifyContent: "center",
    transform: `scale(${lerp(0.5, 1, prog(t, a + k * 0.12, 0.45, outBack))})`,
  });
  return (
    <Abs style={{ left: 0, right: 0, top: 150, display: "flex", flexDirection: "column", alignItems: "center", gap: 26, opacity: v }}>
      <div style={{ fontFamily: MONO, fontSize: 26, letterSpacing: 5, color: "rgba(244,239,230,0.7)" }}>IF YOU SELL ANYTHING FOR A LIVING</div>
      <div style={{ display: "flex", gap: 60 }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
          <div style={{ ...btn(0), background: saved > 0.01 ? "rgba(255,90,31,0.25)" : glass.background, borderColor: saved > 0.01 ? "rgba(255,90,31,0.7)" : undefined }}>
            <div style={{ transform: `scale(${1 + 0.25 * Math.sin(saved * Math.PI)})` }}>
              <IconBookmark size={70} color={saved > 0.01 ? EMBER : BONE} fill={saved > 0.01 ? EMBER : "none"} />
            </div>
          </div>
          <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 36, color: saved > 0.01 ? EMBER : BONE }}>{saved > 0.5 ? "Saved" : "Save"}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
          <div style={btn(1)}>
            <div style={{ transform: `translate(${sent * 60}px, ${-sent * 60}px)`, opacity: 1 - prog(t, T.share + 0.25, 0.25) + prog(t, T.share + 0.7, 0.3) }}>
              <IconSend size={64} color={BONE} />
            </div>
          </div>
          <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 36, color: BONE }}>{t > T.team ? "Send to your team" : "Share"}</div>
        </div>
      </div>
    </Abs>
  );
};
