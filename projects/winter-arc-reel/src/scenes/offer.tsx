import type { ReactNode } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { DURATION, FPS, T } from "../data";
import { MONO, SANS, SERIF } from "../fonts";
import {
  Abs, IconDumbbell, IconLeaf, IconLock, IconSend, IconShield, IconSnow, IconUsers, frost, iceText, inOutCubic, lerp, outBack, outExpo, prog, rnd, win,
} from "../ui";

/** Payoff: a lock snaps shut on "locked in", then UNRECOGNISABLE lands in frosted type. */
export const Payoff = () => {
  const t = useCurrentFrame() / FPS;
  const la = win(t, T.locked - 0.35, T.unrec + 0.1, 0.2, 0.15);
  const ua = win(t, T.unrec - 0.04, T.offer + 0.1, 0.08, 0.3);
  const close = prog(t, T.locked + 0.05, 0.18, outBack);
  const lp = prog(t, T.locked - 0.35, 0.35, outBack);
  return (
    <>
      {la > 0 && (
        <Abs style={{ left: 0, right: 0, top: 1240, display: "flex", justifyContent: "center", opacity: la }}>
          <div style={{ ...frost, width: 170, height: 170, borderRadius: 48, display: "grid", placeItems: "center", transform: `scale(${lerp(0.6, 1, lp) * (1 + 0.08 * Math.sin(close * Math.PI))})`, boxShadow: `0 0 ${50 * close}px rgba(150,210,255,0.6)` }}>
            <IconLock size={110} color="#DDF2FF" sw={1.6} open={1 - close} />
          </div>
        </Abs>
      )}
      {ua > 0 && (
        <Abs style={{ left: 0, right: 0, top: 1300, textAlign: "center", opacity: ua }}>
          <div style={{ fontFamily: SANS, fontWeight: 900, fontSize: 112, letterSpacing: -2, lineHeight: 1, whiteSpace: "nowrap" }}>
            {"UNRECOGNISABLE".split("").map((ch, i) => {
              const p = prog(t, T.unrec - 0.04 + i * 0.022, 0.38, outExpo);
              const j = (1 - p) * (rnd(i) - 0.5) * 60;
              return (
                <span key={i} style={{ display: "inline-block", ...iceText, opacity: p, transform: `translate(${j}px, ${(1 - p) * 60}px) scale(${lerp(1.6, 1, p)})`, filter: `blur(${(1 - p) * 16}px) drop-shadow(0 0 26px rgba(160,215,255,0.55))` }}>
                  {ch}
                </span>
              );
            })}
          </div>
          <div style={{ fontFamily: MONO, fontSize: 26, letterSpacing: 12, color: "rgba(225,242,255,0.85)", marginTop: 16, opacity: prog(t, T.unrec + 0.35, 0.4) }}>DAY 01 → DAY 90</div>
        </Abs>
      )}
    </>
  );
};

/** The offer: IHSAN BLUEPRINT lockup, then the 90-day Winter Arc Challenge badge. */
export const Offer = () => {
  const t = useCurrentFrame() / FPS;
  const a = win(t, T.ihsan - 0.15, T.youGet + 0.05, 0.35, 0.3);
  if (a <= 0) return null;
  const p = prog(t, T.ihsan - 0.15, 0.7, outExpo);
  const open = prog(t, T.ihsan + 0.7, 0.4, outBack);
  const badge = prog(t, T.winterArc - 0.15, 0.7, outBack);
  const ring = prog(t, T.hosting, 2.6, inOutCubic);
  return (
    <Abs style={{ left: 70, right: 70, top: 1150, opacity: a, transform: `translateY(${(1 - p) * 70}px)` }}>
      <div style={{ ...frost, borderRadius: 40, padding: "30px 36px", display: "flex", alignItems: "center", gap: 30 }}>
        {/* challenge badge: a frosted ring that draws itself around a snowflake */}
        <div style={{ position: "relative", width: 190, height: 190, flex: "none", transform: `scale(${lerp(0.75, 1, badge)}) rotate(${(1 - badge) * -40}deg)` }}>
          <svg width="190" height="190" viewBox="0 0 190 190" style={{ position: "absolute", inset: 0 }}>
            <circle cx="95" cy="95" r="84" fill="none" stroke="rgba(200,235,255,0.18)" strokeWidth="6" />
            <circle cx="95" cy="95" r="84" fill="none" stroke="url(#rg)" strokeWidth="6" strokeLinecap="round" strokeDasharray={`${528 * ring} 600`} transform="rotate(-90 95 95)" style={{ filter: "drop-shadow(0 0 8px rgba(170,220,255,0.9))" }} />
            <defs>
              <linearGradient id="rg" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#FFFFFF" />
                <stop offset="1" stopColor="#7FC2F2" />
              </linearGradient>
            </defs>
          </svg>
          <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", textAlign: "center", opacity: prog(t, T.hosting - 0.1, 0.4) }}>
            <div>
              <div style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 84, lineHeight: 0.9, ...iceText, paddingRight: 6 }}>{Math.round(90 * ring)}</div>
              <div style={{ fontFamily: MONO, fontSize: 16, letterSpacing: 5, color: "#CDEBFF" }}>DAYS</div>
            </div>
          </div>
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 10, padding: "6px 16px", borderRadius: 999, background: "rgba(120,255,190,0.14)", border: "1.5px solid rgba(140,255,200,0.45)", transform: `scale(${open})`, transformOrigin: "0 50%" }}>
            <div style={{ width: 12, height: 12, borderRadius: 6, background: "#7CFFB8", boxShadow: "0 0 12px #7CFFB8", opacity: 0.6 + 0.4 * Math.sin(t * 8) }} />
            <span style={{ fontFamily: MONO, fontWeight: 700, fontSize: 20, letterSpacing: 5, color: "#B8FFDA" }}>NOW OPEN</span>
          </div>
          <div style={{ fontFamily: SANS, fontWeight: 900, fontSize: 64, letterSpacing: -1, lineHeight: 1, color: "#fff", marginTop: 14 }}>IHSAN</div>
          <div style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 64, lineHeight: 1, ...iceText, paddingRight: 8 }}>Blueprint</div>
          <div style={{ fontFamily: MONO, fontSize: 21, letterSpacing: 4, color: "rgba(220,240,255,0.8)", marginTop: 14, opacity: badge }}>WINTER ARC CHALLENGE</div>
        </div>
      </div>
    </Abs>
  );
};

/** "You get": four feature rows. */
export const Features = () => {
  const t = useCurrentFrame() / FPS;
  const a = win(t, T.youGet - 0.1, T.choice + 0.05, 0.3, 0.35);
  if (a <= 0) return null;
  const rows: { s: number; icon: ReactNode; title: string; sub: string }[] = [
    { s: T.training, icon: <IconDumbbell size={50} color="#CDEBFF" />, title: "Training programs", sub: "Gym & home" },
    { s: T.nutrition, icon: <IconLeaf size={50} color="#CDEBFF" />, title: "Nutrition guidance", sub: "Bulk or cut" },
    { s: T.accountability, icon: <IconShield size={50} color="#CDEBFF" />, title: "Accountability", sub: "Daily protocols" },
    { s: T.community, icon: <IconUsers size={50} color="#CDEBFF" />, title: "The brotherhood", sub: "Keeps you locked in" },
  ];
  return (
    <Abs style={{ left: 70, right: 70, top: 1080, opacity: a }}>
      <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 24, letterSpacing: 10, color: "#DDF2FF", textAlign: "center", marginBottom: 18, opacity: prog(t, T.youGet - 0.1, 0.3) }}>YOU GET</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
        {rows.map((r, i) => {
          const p = prog(t, r.s - 0.12, 0.5, outExpo);
          const lit = prog(t, r.s, 0.3);
          return (
            <div
              key={i}
              style={{
                ...frost,
                borderRadius: 30,
                padding: "26px 26px 24px",
                opacity: p,
                transform: `translateY(${(1 - p) * 60}px) scale(${lerp(0.9, 1, p)})`,
                boxShadow: `${frost.boxShadow}, 0 0 ${36 * lit * (1 - prog(t, r.s + 0.4, 0.8))}px rgba(150,210,255,0.55)`,
              }}
            >
              {r.icon}
              <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 40, letterSpacing: -0.8, lineHeight: 1.05, color: "#fff", marginTop: 14 }}>{r.title}</div>
              <div style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 32, ...iceText, marginTop: 4, paddingRight: 6 }}>{r.sub}</div>
            </div>
          );
        })}
      </div>
    </Abs>
  );
};

/** "Start on January 1st ... New Year, New Me nonsense": a calendar page, then the cliché gets struck out. */
export const Choice = () => {
  const t = useCurrentFrame() / FPS;
  const a = win(t, T.january - 0.15, T.or + 0.05, 0.3, 0.3);
  if (a <= 0) return null;
  const p = prog(t, T.january - 0.15, 0.6, outBack);
  const quote = prog(t, T.newYear - 0.05, 0.4, outExpo);
  const strike = prog(t, T.nonsense, 0.3, inOutCubic);
  const drop = prog(t, T.nonsense + 0.3, 0.5, (x) => x * x);
  return (
    <Abs style={{ left: 0, right: 0, top: 1150, display: "flex", alignItems: "center", justifyContent: "center", gap: 34, opacity: a }}>
      <div style={{ width: 200, borderRadius: 30, overflow: "hidden", transform: `rotate(${lerp(-14, -5, p) + drop * -20}deg) translateY(${drop * 260}px) scale(${lerp(0.6, 1, p)})`, boxShadow: "0 30px 60px rgba(0,0,0,0.5)", opacity: 1 - drop }}>
        <div style={{ background: "#E5484D", padding: "12px 0", textAlign: "center", fontFamily: SANS, fontWeight: 800, fontSize: 30, letterSpacing: 6, color: "#fff" }}>JAN</div>
        <div style={{ background: "#F5F7FA", textAlign: "center", fontFamily: SANS, fontWeight: 900, fontSize: 130, lineHeight: 1.2, color: "#111" }}>1</div>
      </div>
      <div style={{ position: "relative", opacity: quote * (1 - drop), transform: `translateX(${(1 - quote) * 40}px) translateY(${drop * 200}px) rotate(${drop * 8}deg)` }}>
        <div style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 84, lineHeight: 1, color: "#fff", whiteSpace: "nowrap" }}>“New Year,</div>
        <div style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 84, lineHeight: 1, color: "#fff", whiteSpace: "nowrap" }}>New Me”</div>
        <div style={{ position: "absolute", left: -10, top: 80, height: 10, width: `${strike * 108}%`, background: "#FF5A6E", borderRadius: 5, transform: "rotate(-6deg)", boxShadow: "0 0 18px rgba(255,80,100,0.8)" }} />
      </div>
    </Abs>
  );
};

/** "Use them to build momentum": rising bars + arrow. */
export const Momentum = () => {
  const t = useCurrentFrame() / FPS;
  const a = win(t, T.momentum - 0.3, T.cta - 0.05, 0.3, 0.3);
  if (a <= 0) return null;
  const bars = 12;
  return (
    <Abs style={{ left: 120, right: 120, top: 1180, height: 300, opacity: a }}>
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, display: "flex", alignItems: "flex-end", gap: 12, height: 260 }}>
        {Array.from({ length: bars }).map((_, i) => {
          const p = prog(t, T.momentum - 0.2 + i * 0.07, 0.5, outBack);
          const h = 30 + (i / (bars - 1)) ** 1.6 * 220;
          return (
            <div
              key={i}
              style={{
                flex: 1,
                height: h * p,
                borderRadius: 10,
                background: `linear-gradient(180deg, rgba(255,255,255,${0.5 + i * 0.04}), rgba(120,190,245,${0.25 + i * 0.03}))`,
                boxShadow: i === bars - 1 ? "0 0 30px rgba(170,220,255,0.9)" : undefined,
              }}
            />
          );
        })}
      </div>
      <div style={{ position: "absolute", right: -20, top: -70, fontFamily: MONO, fontWeight: 700, fontSize: 26, letterSpacing: 8, color: "#DDF2FF", opacity: prog(t, T.momentum + 0.6, 0.4) }}>MOMENTUM ↗</div>
    </Abs>
  );
};

/** CTA: an Instagram-style comment box types WINTER and sends. */
export const CTA = () => {
  const t = useCurrentFrame() / FPS;
  const a = win(t, T.cta - 0.1, DURATION + 1, 0.3, 0.3);
  if (a <= 0) return null;
  const p = prog(t, T.cta - 0.1, 0.6, outExpo);
  const word = "WINTER";
  const typed = Math.floor(word.length * prog(t, T.cta + 0.2, 0.6, (x) => x));
  const sent = prog(t, T.link - 0.2, 0.35, outBack);
  const caret = Math.floor(t * 2.5) % 2 === 0;
  return (
    <Abs style={{ left: 70, right: 70, top: 1210, opacity: a, transform: `translateY(${(1 - p) * 80}px)` }}>
      <div style={{ ...frost, borderRadius: 999, padding: "18px 20px 18px 22px", display: "flex", alignItems: "center", gap: 20 }}>
        <div style={{ width: 70, height: 70, borderRadius: 35, background: "linear-gradient(135deg, #DDF2FF, #5FAEEA)", display: "grid", placeItems: "center", flex: "none" }}>
          <IconSnow size={40} color="#06101C" sw={2} />
        </div>
        <div style={{ flex: 1, fontFamily: SANS, fontWeight: 800, fontSize: 52, letterSpacing: 2, color: "#fff" }}>
          {word.slice(0, typed)}
          <span style={{ opacity: typed < word.length && caret ? 1 : 0, color: "#9FD8FF" }}>|</span>
        </div>
        <div style={{ width: 84, height: 84, borderRadius: 42, display: "grid", placeItems: "center", background: `rgba(120,200,255,${0.25 + 0.75 * sent})`, transform: `scale(${lerp(1, 1.12, Math.sin(sent * Math.PI))}) rotate(${sent * 15}deg)`, boxShadow: `0 0 ${40 * sent}px rgba(150,210,255,0.8)` }}>
          <IconSend size={44} color={sent > 0.5 ? "#06101C" : "#DDF2FF"} sw={2} />
        </div>
      </div>
      <div style={{ textAlign: "center", marginTop: 26, fontFamily: SERIF, fontStyle: "italic", fontSize: 50, ...iceText, opacity: prog(t, T.link, 0.5), paddingRight: 6 }}>…and I'll send you the link</div>
    </Abs>
  );
};

/** End: a cold white flash as the clip closes out on the CTA. */
export const Flash = () => {
  const t = useCurrentFrame() / FPS;
  const hit = (s: number, d: number, m: number) => (t >= s ? (1 - prog(t, s, d)) * m : 0);
  const a = Math.max(hit(T.s1 - 0.02, 0.3, 0.35), hit(T.unrec, 0.4, 0.7), hit(T.ihsan, 0.3, 0.3), hit(T.cta, 0.35, 0.45));
  if (a <= 0.001) return null;
  return <AbsoluteFill style={{ background: "#EAF6FF", opacity: a, mixBlendMode: "screen" }} />;
};

