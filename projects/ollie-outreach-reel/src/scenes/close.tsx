import { AbsoluteFill, useCurrentFrame } from "remotion";
import { CHAPTERS, CREAM, FPS, GOLD, MINT, RED, T } from "../data";
import { MONO, SANS, SERIF } from "../fonts";
import { Abs, eyebrow, glass, goldText, lerp, outBack, outExpo, prog, spring, win } from "../ui";

// Chapter 05 in the garden shot: he lies low in frame, the conversation plays out above him.
const type = (t: number, text: string, a: number, b: number) => text.slice(0, Math.round(prog(t, a, b - a, (x) => x) * text.length));

export const Conversation = () => {
  const t = useCurrentFrame() / FPS;
  const s = T.always - 0.15;
  const e = T.endCard;
  if (t < s || t > e + 0.2) return null;
  const a = win(t, s, e + 0.1, 0.2, 0.2);
  const MSG = "Love what you do for your clients. Open to a quick chat";
  const out = spring(t, s, 2.2, 8);
  const typed = type(t, MSG, s + 0.1, T.question - 0.05);
  const q = spring(t, T.question - 0.05, 2.6, 6);
  const ring = prog(t, T.question - 0.05, 0.7, outExpo);
  const lbl = prog(t, T.endW - 0.15, 0.35, outBack);
  const inc = spring(t, T.opens - 0.1, 2.2, 8);
  const reply = T.conversation + 0.15;
  const no = prog(t, T.hard - 0.15, 0.35, outBack);
  const strike = prog(t, T.no + 0.05, 0.3, outExpo);
  return (
    <Abs style={{ left: 80, right: 80, top: 300, opacity: a, display: "flex", flexDirection: "column", gap: 22 }}>
      <div style={{ ...eyebrow, alignSelf: "flex-end", opacity: lbl, transform: `translateY(${(1 - lbl) * 14}px)` }}>Always end on a question</div>
      <div style={{ display: "flex", justifyContent: "flex-end", transform: `scale(${lerp(0.85, 1, Math.min(1, out))})`, transformOrigin: "100% 100%", opacity: Math.min(1, out * 2) }}>
        <div style={{ position: "relative", maxWidth: 760, padding: "22px 30px", borderRadius: "34px 34px 8px 34px", background: `linear-gradient(180deg, #FFE7B0, ${GOLD} 70%, #D2A456)`, color: "#17120A", fontWeight: 650, fontSize: 40, lineHeight: "52px", boxShadow: "0 14px 34px rgba(200,150,60,0.35)" }}>
          <span style={{ visibility: "hidden" }}>{MSG}?</span>
          <span style={{ position: "absolute", left: 30, top: 22, right: 30 }}>
            {typed}
            {t >= T.question - 0.05 && (
              <span style={{ position: "relative", display: "inline-block", fontFamily: SERIF, fontSize: 70, lineHeight: "40px", color: "#5A3A08", transform: `scale(${lerp(0.3, 1, Math.min(1.25, q))})`, marginLeft: 4 }}>
                ?
                <span style={{ position: "absolute", left: "50%", top: "50%", width: 120, height: 120, marginLeft: -60, marginTop: -64, borderRadius: 60, border: "3px solid #FFF3D6", opacity: 1 - ring, transform: `scale(${lerp(0.3, 1.6, ring)})` }} />
              </span>
            )}
          </span>
        </div>
      </div>
      {t >= T.opens - 0.1 && (
        <div style={{ display: "flex", alignItems: "center", gap: 18, transform: `scale(${lerp(0.85, 1, Math.min(1, inc))})`, transformOrigin: "0% 100%", opacity: Math.min(1, inc * 2) }}>
          <div style={{ ...glass, padding: "22px 30px", borderRadius: "34px 34px 34px 8px", fontWeight: 600, fontSize: 40, lineHeight: "52px" }}>
            {t < reply ? (
              <span style={{ display: "inline-flex", gap: 10, padding: "10px 4px" }}>
                {[0, 1, 2].map((k) => (
                  <span key={k} style={{ width: 16, height: 16, borderRadius: 8, background: CREAM, opacity: 0.35 + 0.65 * Math.max(0, Math.sin(t * 9 - k * 0.9)) }} />
                ))}
              </span>
            ) : (
              <span>{type(t, "Sure, tell me more!", reply, reply + 0.45)}</span>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, opacity: prog(t, T.conversation, 0.3) }}>
            <span style={{ width: 14, height: 14, borderRadius: 7, background: MINT, boxShadow: `0 0 12px ${MINT}` }} />
            <span style={{ fontFamily: MONO, fontSize: 22, color: MINT, letterSpacing: 2 }}>CONVERSATION OPEN</span>
          </div>
        </div>
      )}
      {t >= T.hard - 0.15 && (
        <div style={{ display: "flex", alignItems: "center", gap: 18, opacity: Math.min(1, no * 2) * lerp(1, 0.75, strike), transform: `scale(${lerp(0.7, 1, no)})`, transformOrigin: "0% 50%" }}>
          <div style={{ position: "relative", padding: "16px 28px", borderRadius: "30px 30px 30px 8px", background: "rgba(255,91,87,0.16)", border: `1.5px solid rgba(255,91,87,0.6)`, color: RED, fontWeight: 800, fontSize: 38 }}>
            Hard no.
            <div style={{ position: "absolute", left: 18, top: "52%", height: 5, borderRadius: 3, width: `calc(${strike} * (100% - 36px))`, background: CREAM, boxShadow: "0 0 8px rgba(0,0,0,0.5)" }} />
          </div>
          <span style={{ fontFamily: MONO, fontSize: 22, color: "rgba(251,244,232,0.7)", letterSpacing: 2, opacity: strike }}>NOT ANYMORE</span>
        </div>
      )}
    </Abs>
  );
};

const RECAP = ["Learn appointment setting", "Outreach every single day", "Short, personal DMs"];

/** End card: the three steps, then "save this". */
export const EndCard = () => {
  const t = useCurrentFrame() / FPS;
  const s = T.endCard - 0.15;
  if (t < s) return null;
  const bg = prog(t, s, 0.4);
  const title = prog(t, s + 0.05, 0.5, outExpo);
  const save = spring(t, s + 1.2, 2.2, 7);
  return (
    <AbsoluteFill style={{ fontFamily: SANS }}>
      <AbsoluteFill style={{ background: `rgba(6,7,10,${0.62 * bg})` }} />
      <Abs style={{ left: 90, right: 90, top: 470, display: "flex", flexDirection: "column", gap: 18 }}>
        <div style={{ ...eyebrow, opacity: title }}>Appointment setting</div>
        <div style={{ fontFamily: SERIF, fontSize: 112, lineHeight: "106px", color: CREAM, opacity: title, transform: `translateY(${(1 - title) * 30}px)` }}>
          The outreach <span style={{ ...goldText, fontStyle: "italic" }}>playbook</span>
        </div>
        <div style={{ height: 2, background: `linear-gradient(90deg, ${GOLD}, rgba(232,194,122,0))`, width: `${title * 100}%`, margin: "12px 0 10px" }} />
        {RECAP.map((r, i) => {
          const p = prog(t, s + 0.3 + i * 0.12, 0.4, outExpo);
          return (
            <div key={i} style={{ display: "flex", alignItems: "baseline", gap: 24, opacity: p, transform: `translateX(${(1 - p) * -40}px)` }}>
              <span style={{ fontFamily: MONO, fontWeight: 700, fontSize: 28, color: GOLD, width: 50 }}>{CHAPTERS[i].n}</span>
              <span style={{ fontWeight: 700, fontSize: 46, color: CREAM }}>{r}</span>
            </div>
          );
        })}
      </Abs>
      <Abs style={{ left: 0, right: 0, top: 1300, display: "flex", justifyContent: "center", opacity: Math.min(1, save * 2) }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "20px 40px", borderRadius: 999, background: `linear-gradient(180deg, #FFE7B0, ${GOLD} 60%, #C99A4C)`, color: "#17120A", fontWeight: 800, fontSize: 40, transform: `scale(${lerp(0.6, 1, Math.min(1.1, save))})`, boxShadow: "0 16px 40px rgba(200,150,60,0.4)" }}>
          <svg width={36} height={36} viewBox="0 0 24 24" fill="none" stroke="#17120A" strokeWidth={2.4} strokeLinejoin="round">
            <path d="M6 3.5h12v17l-6-4.2-6 4.2z" />
          </svg>
          Save this for later
        </div>
      </Abs>
    </AbsoluteFill>
  );
};
