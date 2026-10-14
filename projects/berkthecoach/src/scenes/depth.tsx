import { AbsoluteFill, useCurrentFrame } from "remotion";
import { CARD_IN, CRIMSON, EMERALD, FPS, GOLD, IVORY, SINS, T } from "../data";
import { ARABIC, SANS, SERIF } from "../fonts";
import { Abs, Row, goldText, inOutCubic, lerp, outBack, outExpo, prog, rnd, win } from "../ui";

// Everything here sits BEHIND the speaker: it's drawn between the plate and his alpha layer.

const rise = (t: number, a: number, d = 0.5) => {
  const p = prog(t, a, d, outExpo);
  return { opacity: prog(t, a, d * 0.6), transform: `translateY(${(1 - p) * 60}px)`, filter: `blur(${(1 - p) * 14}px)` };
};

/** Hook: "3 SINS" lands above the window; "destroy" cracks it red. */
const Hook = ({ t }: { t: number }) => {
  const out = SINS[0].at - CARD_IN;
  if (t > out + 0.1) return null;
  const hit = prog(t, 0.02, 0.5, outBack);
  const crack = t >= T.destroy ? Math.max(0, 1 - (t - T.destroy) / 0.5) : 0;
  const f = Math.floor(t * FPS);
  const slice = crack > 0 ? (rnd(f) - 0.5) * 24 * crack : 0;
  return (
    <Abs style={{ left: 0, right: 0, top: 268, textAlign: "center", transform: `scale(${lerp(1.4, 1, hit)})`, transformOrigin: "50% 50%" }}>
      <div style={{ position: "relative", display: "inline-block", fontFamily: SANS, fontWeight: 900, fontSize: 180, letterSpacing: -7, lineHeight: "190px", ...goldText,
        filter: `drop-shadow(0 10px 40px rgba(0,0,0,0.6)) drop-shadow(0 0 ${24 + 36 * crack}px rgba(${crack > 0 ? "226,87,63" : "233,201,131"},${0.3 + 0.4 * crack}))`,
        opacity: prog(t, 0, 0.2) }}>
        3 SINS
        {crack > 0 && (
          <Abs style={{ inset: 0, color: CRIMSON, WebkitTextFillColor: CRIMSON, clipPath: `inset(${30 + rnd(f + 3) * 40}% 0 ${20 + rnd(f + 5) * 30}% 0)`, transform: `translateX(${slice}px)`, opacity: crack }}>
            3 SINS
          </Abs>
        )}
      </div>
    </Abs>
  );
};

/** Buyer ⟷ seller: the deal line runs behind his head. */
const Deal = ({ t }: { t: number }) => {
  const a = win(t, T.buyer - 0.15, T.blessed + 0.1, 0.3, 0.35);
  if (a <= 0) return null;
  const y = 790;
  const draw = prog(t, T.seller + 0.1, 0.7, inOutCubic);
  const glow = win(t, T.transaction - 0.1, T.blessed + 0.1, 0.3, 0.2);
  return (
    <AbsoluteFill style={{ opacity: a }}>
      <svg width={1080} height={1920} style={{ position: "absolute" }}>
        <defs>
          <linearGradient id="deal" x1="0" x2="1">
            <stop offset="0" stopColor={GOLD} stopOpacity="0.2" />
            <stop offset="0.5" stopColor="#FFF1CC" />
            <stop offset="1" stopColor={GOLD} stopOpacity="0.2" />
          </linearGradient>
        </defs>
        <line x1={270} y1={y} x2={lerp(270, 810, draw)} y2={y} stroke="url(#deal)" strokeWidth={4 + glow * 4} strokeDasharray="2 14" strokeLinecap="round" />
        <line x1={270} y1={y} x2={lerp(270, 810, draw)} y2={y} stroke={GOLD} strokeOpacity={0.25 + glow * 0.5} strokeWidth={22} style={{ filter: "blur(10px)" }} />
        {[0, 1, 2].map((k) => {
          const p = ((t * 0.9 + k / 3) % 1);
          return draw >= 1 ? <circle key={k} cx={lerp(270, 810, p)} cy={y} r={6} fill="#FFF3D2" opacity={Math.sin(p * Math.PI)} /> : null;
        })}
      </svg>
    </AbsoluteFill>
  );
};

/** "Blessed": a big serif word with an emerald-gold bloom and rising motes. */
const Blessed = ({ t }: { t: number }) => {
  const a = win(t, T.blessed - 0.08, SINS[1].at - CARD_IN + 0.05, 0.35, 0.2);
  if (a <= 0) return null;
  const p = prog(t, T.blessed - 0.08, 0.8, outExpo);
  return (
    <>
      <Abs style={{ left: 140, right: 140, top: 470, height: 400, borderRadius: "50%", background: `radial-gradient(ellipse at 50% 50%, ${EMERALD}55, rgba(0,0,0,0) 65%)`, opacity: a * 0.9, filter: "blur(30px)" }} />
      <Row y={575} style={{ opacity: a }}>
        <div style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 260, lineHeight: "300px", letterSpacing: -4, ...goldText, paddingRight: 20,
          transform: `scale(${lerp(1.25, 1, p)})`, filter: `blur(${(1 - p) * 16}px) drop-shadow(0 0 36px rgba(233,201,131,0.5))` }}>
          Blessed
        </div>
      </Row>
      {Array.from({ length: 26 }, (_, i) => {
        const life = (t - T.blessed + rnd(i) * 1.2) / 1.6;
        if (life < 0 || life > 1) return null;
        return (
          <Abs key={i} style={{ left: 160 + rnd(i + 7) * 760, top: 860 - life * 420, width: 6 + rnd(i + 3) * 6, height: 6 + rnd(i + 3) * 6, borderRadius: "50%",
            background: i % 3 ? "#FFE7B0" : EMERALD, opacity: Math.sin(life * Math.PI) * a, boxShadow: "0 0 14px #FFE2A6" }} />
        );
      })}
    </>
  );
};

/** الرزّاق: Allah is the Provider. God-rays fall from above, the name glows behind him. */
const Provider = ({ t }: { t: number }) => {
  const a = win(t, T.provider - 0.1, SINS[2].at - CARD_IN + 0.05, 0.4, 0.2);
  if (a <= 0) return null;
  const p = prog(t, T.provider - 0.1, 1.0, outExpo);
  return (
    <>
      <AbsoluteFill style={{ opacity: a * 0.8, mixBlendMode: "screen" }}>
        {[-26, -12, 0, 13, 27].map((r, i) => (
          <Abs key={i} style={{ left: 540 - 70, top: -300, width: 140 + (i % 2) * 60, height: 1400, transformOrigin: "50% 0%",
            transform: `rotate(${r + Math.sin(t * 0.7 + i) * 2}deg)`, background: "linear-gradient(180deg, rgba(255,220,150,0.55), rgba(255,200,120,0) 85%)", filter: "blur(22px)" }} />
        ))}
      </AbsoluteFill>
      <Abs style={{ left: 0, right: 0, top: 430, textAlign: "center", direction: "rtl", fontFamily: ARABIC, fontWeight: 700, fontSize: 270, lineHeight: "480px", ...goldText,
        opacity: a, transform: `scale(${lerp(1.18, 1, p)})`, filter: `blur(${(1 - p) * 14}px) drop-shadow(0 0 50px rgba(255,214,140,0.55))` }}>
        الرزّاق
      </Abs>
    </>
  );
};

/** "Wealth has your heart": a heart drawn in gold behind him; it floods crimson on "heart". */
const Heart = ({ t }: { t: number }) => {
  const a = win(t, T.problem2 + 0.2, T.dunya - 0.3, 0.3, 0.35);
  if (a <= 0) return null;
  const draw = prog(t, T.problem2 + 0.2, 1.4, inOutCubic);
  const fill = prog(t, T.heart - 0.05, 0.5);
  const beat = t > T.heart ? 1 + 0.06 * Math.max(0, Math.sin((t - T.heart) * 7.5)) ** 8 : 1;
  const L = 1500;
  return (
    <AbsoluteFill style={{ opacity: a }}>
      <svg width={1080} height={1920} style={{ position: "absolute", transform: `scale(${beat})`, transformOrigin: "540px 700px" }}>
        <defs>
          <linearGradient id="hg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#FFF0CC" />
            <stop offset="1" stopColor={GOLD} />
          </linearGradient>
          <radialGradient id="hf" cx="50%" cy="45%" r="60%">
            <stop offset="0" stopColor={CRIMSON} stopOpacity="0.55" />
            <stop offset="1" stopColor={CRIMSON} stopOpacity="0" />
          </radialGradient>
        </defs>
        <g transform="translate(540 470) scale(23) translate(-12 -4)">
          <path d="M12 20.5S3.5 15.5 3.5 9.3A4.6 4.6 0 0 1 12 7a4.6 4.6 0 0 1 8.5 2.3c0 6.2-8.5 11.2-8.5 11.2z" fill="url(#hf)" opacity={fill} />
          <path d="M12 20.5S3.5 15.5 3.5 9.3A4.6 4.6 0 0 1 12 7a4.6 4.6 0 0 1 8.5 2.3c0 6.2-8.5 11.2-8.5 11.2z" fill="none"
            stroke={fill > 0.5 ? CRIMSON : "url(#hg)"} strokeWidth={0.32} strokeDasharray={`${(L / 23) * draw} ${L}`} strokeLinecap="round"
            style={{ filter: `drop-shadow(0 0 0.6px ${fill > 0.5 ? CRIMSON : GOLD})` }} />
        </g>
      </svg>
    </AbsoluteFill>
  );
};

/** Finale lockup behind him: the dunya — in your hands, not in your heart. */
const Finale = ({ t }: { t: number }) => {
  if (t < T.dunya - 0.2 || t > T.cta + 0.4) return null;
  const out = 1 - prog(t, T.cta - 0.1, 0.4);
  const l0 = rise(t, T.dunya + 0.25);
  const l1 = rise(t, T.hands - 0.15);
  const l2 = rise(t, T.but + 0.1);
  const hp = prog(t, T.heart2 - 0.05, 0.45, outBack);
  return (
    <AbsoluteFill style={{ opacity: out }}>
      <Row y={262} style={l0}>
        <span style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 92, color: IVORY, letterSpacing: -1 }}>
          Have the <span style={{ ...goldText, paddingRight: 8 }}>dunya</span>
        </span>
      </Row>
      <Row y={392} style={l1}>
        <span style={{ fontFamily: SANS, fontWeight: 900, fontSize: 100, color: IVORY, letterSpacing: -3, whiteSpace: "nowrap" }}>IN YOUR HANDS</span>
      </Row>
      <Row y={512} style={l2}>
        <span style={{ fontFamily: SANS, fontWeight: 900, fontSize: 92, letterSpacing: -3, whiteSpace: "nowrap", ...goldText,
          filter: `drop-shadow(0 0 ${20 + 40 * hp}px rgba(233,201,131,${0.3 + 0.3 * hp}))` }}>NOT IN YOUR HEART</span>
      </Row>
    </AbsoluteFill>
  );
};

export const Behind = () => {
  const t = useCurrentFrame() / FPS;
  return (
    <AbsoluteFill>
      <Hook t={t} />
      <Deal t={t} />
      <Blessed t={t} />
      <Provider t={t} />
      <Heart t={t} />
      <Finale t={t} />
    </AbsoluteFill>
  );
};

