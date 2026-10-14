import type { ReactNode } from "react";
import { AbsoluteFill, Easing, useCurrentFrame } from "remotion";
import { CARD_IN, CARD_OUT, FPS, GOLD, INK, IVORY, SINS, T, WORDS, clean } from "../data";
import { ARABIC, MONO, SANS, SERIF } from "../fonts";
import { Abs, IconAlert, IconEye, IconShield, IconStore, IconUser, Row, glass, goldText, inOutCubic, lerp, outBack, outExpo, prog, win } from "../ui";

// Everything here sits IN FRONT of the speaker.

const Pill = ({ children, style }: { children: ReactNode; style?: React.CSSProperties }) => (
  <div style={{ ...glass, borderRadius: 999, padding: "14px 30px", fontFamily: MONO, fontSize: 25, fontWeight: 600, letterSpacing: 5, color: GOLD,
    display: "flex", alignItems: "center", gap: 14, whiteSpace: "nowrap", ...style }}>
    {children}
  </div>
);
const pop = (t: number, a: number, b = 99, d = 0.4) => {
  const p = prog(t, a, d, outBack);
  const o = win(t, a, b, 0.18, 0.25);
  return { opacity: o, transform: `scale(${lerp(0.7, 1, p)}) translateY(${(1 - p) * 20}px)`, filter: `blur(${(1 - prog(t, a, 0.25)) * 8}px)` };
};

/** Hook kicker + the hook subtitle. */
const HookTags = ({ t }: { t: number }) => {
  const out = SINS[0].at - CARD_IN;
  if (t > out) return null;
  return (
    <>
      <Row y={248} style={pop(t, 0.15, out)}>
        <Pill><span style={{ width: 10, height: 10, borderRadius: 5, background: GOLD, boxShadow: `0 0 12px ${GOLD}` }} />FOR MUSLIM COACHES</Pill>
      </Row>
    </>
  );
};

/** Full-screen chapter card for each sin; it folds up into the header. */
const SinCard = ({ t, i }: { t: number; i: number }) => {
  const s = SINS[i];
  const a = s.at - CARD_IN;
  const b = s.at + CARD_OUT;
  if (t < a - 0.05 || t > b + 0.45) return null;
  const open = prog(t, a, 0.34, inOutCubic);
  const fold = prog(t, b - 0.05, 0.45, Easing.inOut(Easing.cubic));
  // opens from a gold seam in the middle, folds up toward the header
  const top = lerp(960, 0, open) + fold * 0;
  const bot = lerp(960, 0, open) + fold * 1920;
  const local = t - a;
  const num = prog(t, a + 0.12, 0.6, outExpo);
  const ttl = prog(t, a + 0.25, 0.5, outExpo);
  return (
    <AbsoluteFill style={{ clipPath: `inset(${top}px 0 ${Math.min(1920 - top, bot)}px 0)` }}>
      <AbsoluteFill style={{ background: `radial-gradient(ellipse 80% 55% at 50% 45%, #2A2015 0%, ${INK} 70%)` }} />
      <AbsoluteFill style={{ opacity: 0.16 }}>
        <svg width={1080} height={1920}>
          {Array.from({ length: 14 }, (_, k) => (
            <circle key={k} cx={540} cy={860} r={120 + k * 70 + local * 30} fill="none" stroke={GOLD} strokeWidth={1} opacity={1 - k / 14} />
          ))}
        </svg>
      </AbsoluteFill>
      <Abs style={{ left: 0, right: 0, top: 360, textAlign: "center", direction: "rtl", fontFamily: ARABIC, fontWeight: 700, fontSize: 380, color: GOLD,
        opacity: 0.08 * num, transform: `scale(${lerp(1.2, 1, num)})` }}>
        {s.ar}
      </Abs>
      <Row y={470} style={{ opacity: prog(t, a + 0.1, 0.3) }}>
        <div style={{ fontFamily: MONO, fontSize: 30, letterSpacing: 12, color: GOLD }}>SIN {String(s.n).padStart(2, "0")} / 03</div>
      </Row>
      <Row y={540}>
        <div style={{ fontFamily: SANS, fontWeight: 900, fontSize: 480, lineHeight: "480px", letterSpacing: -24, color: "transparent",
          WebkitTextStroke: `3px ${GOLD}`, opacity: num, transform: `translateY(${(1 - num) * 80}px) scale(${lerp(1.3, 1, num)})`,
          filter: `drop-shadow(0 0 30px rgba(233,201,131,0.35)) blur(${(1 - num) * 10}px)` }}>
          {String(s.n).padStart(2, "0")}
        </div>
      </Row>
      <Row y={1080} style={{ opacity: ttl, transform: `translateY(${(1 - ttl) * 50}px)`, filter: `blur(${(1 - ttl) * 10}px)` }}>
        <div style={{ fontFamily: SERIF, fontSize: 132, lineHeight: "140px", color: IVORY, letterSpacing: -2, textAlign: "center" }}>
          {s.title.split(" ").slice(0, -1).join(" ")}{" "}
          <span style={{ fontStyle: "italic", ...goldText, paddingRight: 10 }}>{s.title.split(" ").slice(-1)}</span>
        </div>
      </Row>
      {s.sub && (
        <Row y={1250} style={{ opacity: prog(t, a + 0.45, 0.4) }}>
          <div style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 58, color: "rgba(246,239,225,0.7)" }}>({s.sub})</div>
        </Row>
      )}
      <Abs style={{ left: lerp(540, 200, ttl), right: lerp(540, 200, ttl), top: 1400, height: 2, background: `linear-gradient(90deg, rgba(0,0,0,0), ${GOLD}, rgba(0,0,0,0))` }} />
      {/* the seam */}
      <Abs style={{ left: 0, right: 0, top: 958, height: 4, background: `linear-gradient(90deg, rgba(0,0,0,0), #FFF1CC, rgba(0,0,0,0))`, opacity: 1 - open, boxShadow: `0 0 30px ${GOLD}` }} />
    </AbsoluteFill>
  );
};

/** Header: which sin we're on, with a three-step rail. */
const Header = ({ t }: { t: number }) => {
  const start = SINS[0].at + CARD_OUT - 0.1;
  const end = T.dunya - 0.35;
  if (t < start || t > end + 0.3) return null;
  let i = 0;
  while (i + 1 < SINS.length && t >= SINS[i + 1].at + CARD_OUT - 0.1) i++;
  const s = SINS[i];
  const p = prog(t, s.at + CARD_OUT - 0.1, 0.5, outExpo);
  const o = win(t, start, end + 0.3, 0.3, 0.3);
  return (
    <AbsoluteFill style={{ opacity: o }}>
      <Row y={236} style={{ opacity: p }}>
        <div style={{ fontFamily: MONO, fontSize: 24, letterSpacing: 9, color: GOLD }}>SIN {String(s.n).padStart(2, "0")} / 03</div>
      </Row>
      <Row y={276} style={{ opacity: p, transform: `translateY(${(1 - p) * 30}px)`, filter: `blur(${(1 - p) * 8}px)` }}>
        <div style={{ fontFamily: SERIF, fontSize: 84, lineHeight: "96px", color: IVORY, letterSpacing: -1, textShadow: "0 6px 30px rgba(0,0,0,0.6)" }}>
          {s.title.split(" ").slice(0, -1).join(" ")} <span style={{ fontStyle: "italic", ...goldText, paddingRight: 6 }}>{s.title.split(" ").slice(-1)}</span>
        </div>
      </Row>
      <Row y={392} style={{ gap: 12 }}>
        {SINS.map((x, k) => {
          const f = k < i ? 1 : k === i ? prog(t, x.at + CARD_OUT - 0.1, 0.6) : 0;
          return (
            <div key={k} style={{ width: 110, height: 5, borderRadius: 3, background: "rgba(233,201,131,0.2)", overflow: "hidden" }}>
              <div style={{ width: `${f * 100}%`, height: "100%", background: GOLD, boxShadow: `0 0 10px ${GOLD}` }} />
            </div>
          );
        })}
      </Row>
    </AbsoluteFill>
  );
};

/** Sin 1: the hadith label, buyer / seller and the two conditions. */
const DealChips = ({ t }: { t: number }) => {
  const end = T.blessed - 0.05;
  const cite = T.blessed + 0.2;
  const chip = (icon: ReactNode, label: string) => (
    <div style={{ ...glass, borderRadius: 26, padding: "18px 28px", display: "flex", alignItems: "center", gap: 14, fontFamily: SANS, fontWeight: 800, fontSize: 36, letterSpacing: 1, color: IVORY }}>
      {icon}{label}
    </div>
  );
  const tag = (label: string, icon: ReactNode) => (
    <div style={{ borderRadius: 999, padding: "10px 22px", display: "flex", alignItems: "center", gap: 10, fontFamily: MONO, fontWeight: 700, fontSize: 24, letterSpacing: 4,
      color: INK, background: `linear-gradient(180deg, #FFF0C8, ${GOLD})`, boxShadow: "0 10px 30px rgba(0,0,0,0.45), 0 0 24px rgba(233,201,131,0.4)" }}>
      {icon}{label}
    </div>
  );
  return (
    <>
      <Row y={500} style={pop(t, SINS[0].at + CARD_OUT - 0.05, SINS[1].at - CARD_IN)}>
        <Pill>{t < cite ? <>THE PROPHET <span style={{ fontFamily: ARABIC, fontSize: 34, letterSpacing: 0 }}>ﷺ</span> SAID</> : <>SAHIH AL-BUKHARI · 2079</>}</Pill>
      </Row>
      <Abs style={{ left: 70, top: 740, width: 400, display: "flex", justifyContent: "center", ...pop(t, T.buyer - 0.05, end) }}>{chip(<IconUser size={40} />, "BUYER")}</Abs>
      <Abs style={{ right: 70, top: 740, width: 400, display: "flex", justifyContent: "center", ...pop(t, T.seller - 0.05, end) }}>{chip(<IconStore size={40} />, "SELLER")}</Abs>
      <Abs style={{ left: 70, top: 862, width: 400, display: "flex", justifyContent: "center", ...pop(t, T.trustful - 0.03, end) }}>{tag("TRUSTFUL", <IconShield size={28} color={INK} sw={2.2} />)}</Abs>
      <Abs style={{ right: 70, top: 862, width: 400, display: "flex", justifyContent: "center", ...pop(t, T.transparent - 0.03, end) }}>{tag("TRANSPARENT", <IconEye size={28} color={INK} sw={2.2} />)}</Abs>
    </>
  );
};

/** A Qur'an quote card: the ayah in Arabic, the meaning lighting up word by word as he says it. */
const Quote = ({ t, a, b, ref_, ar, from, to }: { t: number; a: number; b: number; ref_: string; ar: string; from: number; to: number }) => {
  const o = win(t, a, b, 0.35, 0.3);
  if (o <= 0) return null;
  const p = prog(t, a, 0.6, outExpo);
  const words = WORDS.filter((w) => w.s >= from - 0.01 && w.e <= to + 0.01);
  return (
    <Abs style={{ left: 80, right: 80, top: 1000, opacity: o, transform: `translateY(${(1 - p) * 70}px)`, filter: `blur(${(1 - p) * 10}px)` }}>
      <div style={{ ...glass, borderRadius: 36, padding: "34px 44px 40px", display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>
        <div style={{ fontFamily: MONO, fontSize: 22, letterSpacing: 7, color: GOLD, display: "flex", alignItems: "center", gap: 14 }}>
          <span style={{ width: 40, height: 1.5, background: GOLD }} />{ref_}<span style={{ width: 40, height: 1.5, background: GOLD }} />
        </div>
        <div style={{ fontFamily: ARABIC, fontWeight: 700, fontSize: 60, lineHeight: "104px", direction: "rtl", textAlign: "center", ...goldText,
          opacity: prog(t, a + 0.15, 0.6) }}>{ar}</div>
        <div style={{ fontFamily: SERIF, fontSize: 52, lineHeight: "62px", textAlign: "center", color: IVORY }}>
          “{words.map((w, i) => {
            const lit = prog(t, w.s - 0.05, 0.25);
            let txt = i === words.length - 1 ? w.w.replace(/[.,]$/, "") : w.w;
            if (i === 0) txt = txt[0].toUpperCase() + txt.slice(1);
            return (
              <span key={i} style={{ opacity: lerp(0.28, 1, lit), color: lit > 0.5 && ["provide", "provision", "remembrance", "wealth", "children", "allah"].includes(clean(w.w)) ? GOLD : IVORY,
                fontStyle: lit > 0.5 && ["provide", "remembrance"].includes(clean(w.w)) ? "italic" : "normal" }}>
                {txt}{i < words.length - 1 ? " " : ""}
              </span>
            );
          })}.”
        </div>
      </div>
    </Abs>
  );
};

/** Sin 2: "your business is a means". */
const Means = ({ t }: { t: number }) => {
  const b = T.provider - 0.1;
  const p = prog(t, T.means - 0.05, 0.5, outBack);
  return (
    <Row y={1250} style={{ ...pop(t, T.yourBusiness - 0.05, b), gap: 22 }}>
      <div style={{ ...glass, borderRadius: 24, padding: "18px 28px", fontFamily: SANS, fontWeight: 800, fontSize: 38, color: IVORY, letterSpacing: 1 }}>YOUR BUSINESS</div>
      <svg width={70} height={30} style={{ opacity: p }}><path d="M2 15h60M50 4l12 11-12 11" stroke={GOLD} strokeWidth={3} fill="none" strokeLinecap="round" /></svg>
      <div style={{ ...glass, borderRadius: 24, padding: "10px 30px", fontFamily: SERIF, fontStyle: "italic", fontSize: 64, ...{ color: GOLD }, opacity: p, transform: `scale(${lerp(0.6, 1, p)})` }}>
        a means
      </div>
    </Row>
  );
};
const ProviderTag = ({ t }: { t: number }) => (
  <Row y={1300} style={pop(t, T.providerWord - 0.1, SINS[2].at - CARD_IN)}>
    <Pill>AR-RAZZĀQ · THE PROVIDER</Pill>
  </Row>
);

/** Sin 3: having wealth isn't the problem; a disclaimer stamp; where wealth sits is. */
const WealthChip = ({ t }: { t: number }) => {
  const b = T.disclaimer - 0.1;
  const x = prog(t, T.having - 0.05, 0.4, outBack);
  return (
    <Row y={1240} style={{ ...pop(t, T.notHaving + 0.4, b), gap: 18 }}>
      <div style={{ ...glass, borderRadius: 24, padding: "18px 30px", fontFamily: SANS, fontWeight: 800, fontSize: 40, color: IVORY, display: "flex", gap: 14, alignItems: "center" }}>
        <Coin /> HAVING WEALTH
      </div>
      <div style={{ fontFamily: SANS, fontWeight: 900, fontSize: 60, color: GOLD, opacity: x, transform: `scale(${lerp(0.4, 1, x)})` }}>≠</div>
      <div style={{ borderRadius: 24, padding: "18px 28px", fontFamily: SANS, fontWeight: 800, fontSize: 40, color: INK, background: `linear-gradient(180deg, #FFF0C8, ${GOLD})`,
        opacity: x, transform: `scale(${lerp(0.6, 1, x)})` }}>THE PROBLEM</div>
    </Row>
  );
};
const Coin = () => (
  <svg width={44} height={44} viewBox="0 0 24 24"><circle cx={12} cy={12} r={9} fill={GOLD} /><circle cx={12} cy={12} r={6.4} fill="none" stroke="#9A6E26" strokeWidth={1.2} /><path d="M12 8.5v7M10 10.2c0-.9.9-1.5 2-1.5s2 .6 2 1.5-1 1.3-2 1.6-2 .7-2 1.6.9 1.5 2 1.5 2-.6 2-1.5" stroke="#7A5418" strokeWidth={1.1} fill="none" /></svg>
);
const Disclaimer = ({ t }: { t: number }) => {
  const a = T.disclaimer - 0.05;
  const p = prog(t, a, 0.32, outBack);
  const o = win(t, a, T.problem2 - 0.05, 0.1, 0.25);
  if (o <= 0) return null;
  return (
    <Row y={1230} style={{ opacity: o }}>
      <div style={{ transform: `rotate(-4deg) scale(${lerp(2.2, 1, p)})`, border: `4px solid ${GOLD}`, borderRadius: 14, padding: "12px 30px", fontFamily: MONO, fontWeight: 800,
        fontSize: 46, letterSpacing: 10, color: GOLD, display: "flex", alignItems: "center", gap: 18, background: "rgba(10,8,6,0.55)", boxShadow: "0 20px 60px rgba(0,0,0,0.5)" }}>
        <IconAlert size={46} sw={2.2} /> DISCLAIMER
      </div>
    </Row>
  );
};

/** End card: the original's call to action, set properly. */
const EndCard = ({ t }: { t: number }) => {
  const a = T.cta;
  if (t < a - 0.05) return null;
  const o = prog(t, a, 0.5, inOutCubic);
  const p1 = prog(t, a + 0.25, 0.6, outExpo);
  const p2 = prog(t, a + 0.5, 0.6, outBack);
  const p3 = prog(t, a + 0.9, 0.5, outExpo);
  const fade = 1 - prog(t, T.end - 0.45, 0.45);
  return (
    <AbsoluteFill style={{ opacity: fade }}>
      <AbsoluteFill style={{ background: "rgba(6,5,8,0.62)", backdropFilter: `blur(${o * 26}px)`, WebkitBackdropFilter: `blur(${o * 26}px)`, opacity: o }} />
      <Row y={560} style={{ opacity: p1, transform: `translateY(${(1 - p1) * 40}px)` }}>
        <div style={{ fontFamily: ARABIC, fontWeight: 700, fontSize: 150, direction: "rtl", ...goldText, opacity: 0.9 }}>بركة</div>
      </Row>
      <Row y={790} style={{ opacity: p1 }}>
        <div style={{ fontFamily: MONO, fontSize: 30, letterSpacing: 12, color: IVORY }}>COMMENT</div>
      </Row>
      <Row y={850} style={{ opacity: Math.min(1, p2 * 2), transform: `scale(${lerp(0.7, 1, p2)})` }}>
        <div style={{ ...glass, borderRadius: 40, padding: "18px 60px 30px", fontFamily: SERIF, fontStyle: "italic", fontSize: 170, lineHeight: "180px", ...{ color: GOLD },
          boxShadow: "0 30px 90px rgba(0,0,0,0.6), 0 0 80px rgba(233,201,131,0.25), inset 0 1px 0 rgba(255,255,255,0.2)" }}>
          “Barakah”
        </div>
      </Row>
      <Row y={1110} style={{ opacity: p3, transform: `translateY(${(1 - p3) * 30}px)` }}>
        <div style={{ fontFamily: SANS, fontWeight: 600, fontSize: 46, color: IVORY, textAlign: "center", lineHeight: "60px" }}>
          for a free quiz: what’s blocking<br />your <span style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 58, color: GOLD }}>rizq</span>?
        </div>
      </Row>
      <Row y={1300} style={{ opacity: prog(t, a + 1.2, 0.5) }}>
        <Pill style={{ color: IVORY }}>@BERKTHECOACH</Pill>
      </Row>
    </AbsoluteFill>
  );
};

export const Front = () => {
  const t = useCurrentFrame() / FPS;
  return (
    <AbsoluteFill>
      <HookTags t={t} />
      <Header t={t} />
      <DealChips t={t} />
      <Quote t={t} a={T.weDo - 0.15} b={T.quoteEnd2 + 0.4} ref_="QUR'AN 20:132" ar="لَا نَسْأَلُكَ رِزْقًا ۖ نَحْنُ نَرْزُقُكَ" from={T.weDo} to={T.quoteEnd2} />
      <Means t={t} />
      <ProviderTag t={t} />
      <Quote t={t} a={T.letNot - 0.15} b={T.quoteEnd3 + 0.4} ref_="QUR'AN 63:9" ar="لَا تُلْهِكُمْ أَمْوَالُكُمْ وَلَا أَوْلَادُكُمْ عَن ذِكْرِ ٱللَّهِ" from={T.letNot} to={T.quoteEnd3} />
      <WealthChip t={t} />
      <Disclaimer t={t} />
      {SINS.map((_, i) => <SinCard key={i} t={t} i={i} />)}
      <EndCard t={t} />
    </AbsoluteFill>
  );
};

