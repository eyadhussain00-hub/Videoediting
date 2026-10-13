import type { ReactNode } from "react";
import { useCurrentFrame } from "remotion";
import { DAWN, FPS, STEPS, T } from "../data";
import { MONO, SANS, SERIF } from "../fonts";
import {
  Abs, IconAlarm, IconBan, IconBook, IconBolt, IconCheck, IconDumbbell, IconMosque, IconPhone, IconPill, IconShield, IconSun, IconTimer,
  dawnText, frost, iceText, lerp, outBack, outCubic, outExpo, prog, win,
} from "../ui";
import { dawnAt } from "./base";

const CARD_TOP = 1215;
const ICONS = [IconMosque, IconPhone, IconAlarm, IconSun, IconBolt, IconShield];

/** One frosted card per step: icon, STEP 0n, title, sub-line. Slides up on the step, out at the next. */
export const StepCards = () => {
  const t = useCurrentFrame() / FPS;
  return (
    <>
      {STEPS.map((s, i) => {
        const end = s.n === 6 ? T.listIn - 0.35 : s.e;
        const a = win(t, s.s - 0.05, end + 0.05, 0.3, 0.25);
        if (a <= 0) return null;
        const p = prog(t, s.s - 0.05, 0.55, outExpo);
        const warm = dawnAt(t) > 0.5;
        const accent = warm ? DAWN : "#CDEBFF";
        const Icon = ICONS[i];
        return (
          <Abs key={i} style={{ left: 90, right: 90, top: CARD_TOP, opacity: a, transform: `translateY(${(1 - p) * 70}px) scale(${lerp(0.94, 1, p)})`, filter: `blur(${(1 - p) * 8}px)` }}>
            <div style={{ ...frost, borderRadius: 34, padding: "26px 34px", display: "flex", alignItems: "center", gap: 28 }}>
              <div
                style={{
                  width: 104,
                  height: 104,
                  borderRadius: 28,
                  flex: "none",
                  display: "grid",
                  placeItems: "center",
                  background: warm ? "linear-gradient(180deg, rgba(255,200,140,0.22), rgba(255,160,90,0.08))" : "linear-gradient(180deg, rgba(170,220,255,0.22), rgba(120,190,255,0.06))",
                  border: `1.5px solid ${warm ? "rgba(255,210,160,0.35)" : "rgba(190,230,255,0.3)"}`,
                }}
              >
                <Icon size={58} color={accent} />
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 22, letterSpacing: 7, color: accent, opacity: prog(t, s.s + 0.1, 0.4) }}>STEP 0{s.n}</div>
                <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 50, letterSpacing: -1.2, lineHeight: 1.08, color: "#fff", marginTop: 6 }}>
                  <Reveal t={t} s={s.s + 0.05} text={s.title} />
                </div>
                <div style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 36, lineHeight: 1.1, marginTop: 6, ...(warm ? dawnText : iceText), opacity: prog(t, s.s + 0.45, 0.5), paddingRight: 6 }}>{s.sub}</div>
              </div>
            </div>
          </Abs>
        );
      })}
      <NoExcuses t={t} />
      <NoScroll t={t} at={T.noScroll} until={T.plan - 0.05} />
      <NoScroll t={t} at={T.scroll - 0.05} until={T.s6 - 0.05} />
      <Choices t={t} />
    </>
  );
};

/** Word-by-word rise. */
const Reveal = ({ t, s, text }: { t: number; s: number; text: string }) => (
  <>
    {text.split(" ").map((w, i) => {
      const p = prog(t, s + i * 0.05, 0.4, outCubic);
      return (
        <span key={i} style={{ display: "inline-block", marginRight: 12, opacity: p, transform: `translateY(${(1 - p) * 22}px)`, filter: `blur(${(1 - p) * 6}px)` }}>
          {w}
        </span>
      );
    })}
  </>
);

/** "No excuses" — an ice stamp slammed over the step-1 card. */
const NoExcuses = ({ t }: { t: number }) => {
  const a = win(t, T.noExcuses - 0.04, T.s2 - 0.05, 0.06, 0.2);
  if (a <= 0) return null;
  const p = prog(t, T.noExcuses - 0.04, 0.22, outBack);
  return (
    <Abs style={{ right: 70, top: CARD_TOP - 70, opacity: a, transform: `rotate(-8deg) scale(${lerp(2.2, 1, p)})`, transformOrigin: "50% 50%" }}>
      <div style={{ padding: "10px 26px", border: "5px solid #DDF2FF", borderRadius: 14, fontFamily: SANS, fontWeight: 900, fontSize: 52, letterSpacing: 4, color: "#EAF7FF", background: "rgba(20,60,110,0.55)", boxShadow: "0 0 40px rgba(150,210,255,0.55), inset 0 0 20px rgba(150,210,255,0.25)", backdropFilter: "blur(6px)" }}>
        NO EXCUSES
      </div>
    </Abs>
  );
};

/** Phone with a slash through it ("no scrolling" / "you're not going to scroll"). */
const NoScroll = ({ t, at, until }: { t: number; at: number; until: number }) => {
  const a = win(t, at - 0.05, until, 0.15, 0.25);
  if (a <= 0) return null;
  const p = prog(t, at - 0.05, 0.4, outBack);
  const slash = prog(t, at + 0.15, 0.25);
  const feed = (t - at) * 340;
  return (
    <Abs style={{ left: 70, top: CARD_TOP - 360, width: 190, height: 330, opacity: a, transform: `rotate(${lerp(-14, -6, p)}deg) scale(${lerp(0.6, 1, p)})` }}>
      <div style={{ ...frost, position: "absolute", inset: 0, borderRadius: 36, overflow: "hidden", border: "3px solid rgba(220,240,255,0.55)" }}>
        {/* the feed, scrolling until the slash lands, then frozen */}
        <div style={{ position: "absolute", left: 16, right: 16, top: 26 - (slash < 1 ? feed % 120 : 0) }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} style={{ height: 100, marginBottom: 14, borderRadius: 14, background: `linear-gradient(135deg, rgba(150,200,255,${0.22 + (i % 3) * 0.08}), rgba(80,120,180,0.12))` }} />
          ))}
        </div>
        <div style={{ position: "absolute", inset: 0, background: `rgba(4,10,20,${0.55 * slash})` }} />
      </div>
      <svg width="190" height="330" style={{ position: "absolute", inset: 0, overflow: "visible" }}>
        <line x1="-10" y1="345" x2={-10 + 210 * slash} y2={345 - 360 * slash} stroke="#FF5A6E" strokeWidth="14" strokeLinecap="round" style={{ filter: "drop-shadow(0 0 12px rgba(255,80,100,0.8))" }} />
      </svg>
    </Abs>
  );
};

/** Step 5: two chips — DEEP WORK / QUR'AN — light up as he says them. */
const Choices = ({ t }: { t: number }) => {
  const a = win(t, T.deep - 0.1, T.s6 - 0.05, 0.25, 0.25);
  if (a <= 0) return null;
  const chip = (label: string, s: number, icon: ReactNode, i: number) => {
    const p = prog(t, s - 0.05, 0.4, outBack);
    return (
      <div style={{ ...frost, borderRadius: 999, padding: "16px 30px", display: "flex", alignItems: "center", gap: 14, transform: `translateY(${(1 - p) * 40}px) scale(${lerp(0.8, 1, p)})`, opacity: p, border: "1.5px solid rgba(255,214,160,0.45)", boxShadow: `0 0 ${30 * p}px rgba(255,190,110,0.35)` }} key={i}>
        {icon}
        <span style={{ fontFamily: SANS, fontWeight: 800, fontSize: 36, letterSpacing: 1, color: "#FFF4E2" }}>{label}</span>
      </div>
    );
  };
  return (
    <Abs style={{ left: 0, right: 0, top: CARD_TOP + 215, display: "flex", justifyContent: "center", gap: 22, opacity: a }}>
      {chip("DEEP WORK", T.deep, <IconBolt size={36} color={DAWN} />, 0)}
      <span style={{ alignSelf: "center", fontFamily: SERIF, fontStyle: "italic", fontSize: 40, color: "#FFE2B8", opacity: prog(t, T.quran - 0.3, 0.3) }}>or</span>
      {chip("QUR'AN", T.quran, <IconBook size={36} color={DAWN} />, 1)}
    </Abs>
  );
};

/** Step 6: the daily non-negotiables checklist (captions hidden; the card says the words). */
export const NonNegotiables = () => {
  const t = useCurrentFrame() / FPS;
  const a = win(t, T.listIn - 0.15, T.payoff + 0.05, 0.35, 0.35);
  if (a <= 0) return null;
  const p = prog(t, T.listIn - 0.15, 0.6, outExpo);
  const rows: { s: number; icon: ReactNode; label: string; tag: string }[] = [
    { s: T.workout, icon: <IconDumbbell size={46} color="#CDEBFF" />, label: "45-minute workout", tag: "MIN" },
    { s: T.corn, icon: <IconBan size={46} color="#CDEBFF" />, label: "No “corn”", tag: "ZERO" },
    { s: T.drugs, icon: <IconPill size={46} color="#CDEBFF" />, label: "No drugs", tag: "ZERO" },
    { s: T.social, icon: <IconTimer size={46} color="#CDEBFF" />, label: "≤ 1 hour social media", tag: "MAX" },
  ];
  return (
    <Abs style={{ left: 80, right: 80, top: 1150, opacity: a, transform: `translateY(${(1 - p) * 80}px) scale(${lerp(0.95, 1, p)})` }}>
      <div style={{ ...frost, borderRadius: 38, padding: "30px 36px 20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 22, letterSpacing: 7, color: "#CDEBFF" }}>STEP 06</div>
          <div style={{ fontFamily: MONO, fontSize: 20, letterSpacing: 5, color: "rgba(220,240,255,0.6)" }}>EVERY DAY · 90/90</div>
        </div>
        <div style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 72, lineHeight: 1.05, ...iceText, marginTop: 6, paddingRight: 8 }}>Daily non-negotiables</div>
        <div style={{ height: 1.5, background: "rgba(200,235,255,0.2)", margin: "16px 0 6px" }} />
        {rows.map((r, i) => {
          const rp = prog(t, r.s - 0.12, 0.45, outExpo);
          const chk = prog(t, r.s + 0.25, 0.35, outBack);
          return (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 22, padding: "14px 0", opacity: lerp(0.18, 1, rp), transform: `translateX(${(1 - rp) * 40}px)`, borderBottom: i < 3 ? "1px solid rgba(200,235,255,0.1)" : undefined }}>
              <div style={{ width: 66, display: "grid", placeItems: "center" }}>{r.icon}</div>
              <div style={{ flex: 1, fontFamily: SANS, fontWeight: 700, fontSize: 46, letterSpacing: -0.8, color: "#fff" }}>{r.label}</div>
              <div style={{ fontFamily: MONO, fontSize: 18, letterSpacing: 4, color: "rgba(205,235,255,0.7)", marginRight: 6 }}>{r.tag}</div>
              <div
                style={{
                  width: 54,
                  height: 54,
                  borderRadius: 16,
                  display: "grid",
                  placeItems: "center",
                  border: "2px solid rgba(205,235,255,0.5)",
                  background: `rgba(140,205,255,${0.85 * chk})`,
                  boxShadow: `0 0 ${24 * chk}px rgba(150,210,255,0.8)`,
                  transform: `scale(${lerp(0.7, 1, chk)})`,
                }}
              >
                <span style={{ opacity: chk, transform: `scale(${chk})`, display: "inline-block" }}>
                  <IconCheck size={36} color="#05121F" sw={3} />
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </Abs>
  );
};

