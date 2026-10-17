import { AbsoluteFill, useCurrentFrame } from "remotion";
import { BONE, FPS, GOLD, INK, MUTE, RED, T } from "../data";
import { MONO, SANS, SERIF } from "../fonts";
import { Abs, Check, IconCursor, IconUser, Star, bump, glass, goldText, inOutCubic, lerp, outBack, outCubic, outExpo, paper, prog, spring, win } from "../ui";

// Graphics in front of the speaker. Cards live on his chest (y ~900-1400), above the captions (y 1490).

const pop = (t: number, a: number, b: number) => {
  const w = win(t, a, b, 0.25, 0.22);
  const s = Math.min(1.08, spring(t, a, 2, 7));
  return { o: w, s: lerp(0.7, 1, s) * lerp(0.94, 1, w) };
};

/** Small mono kicker chip ("RULE 01 · DON'T RUSH"). */
const Kicker = ({ text, top, t, a, b, color = "#FFD685" }: { text: string; top: number; t: number; a: number; b: number; color?: string }) => {
  const w = win(t, a, b, 0.25, 0.2);
  if (w <= 0) return null;
  const n = Math.round(text.length * prog(t, a, 0.45, (x) => x));
  return (
    <Abs style={{ top, left: 0, right: 0, display: "flex", justifyContent: "center", opacity: w }}>
      <div style={{ ...glass, borderRadius: 999, padding: "14px 28px", fontFamily: MONO, fontSize: 30, letterSpacing: 4, color, display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{ width: 12, height: 12, borderRadius: 12, background: color, boxShadow: `0 0 14px ${color}` }} />
        {text.slice(0, n)}
        <span style={{ opacity: n < text.length ? 1 : 0 }}>▍</span>
      </div>
    </Abs>
  );
};

export const Kickers = () => {
  const t = useCurrentFrame() / FPS;
  return (
    <>
      <Kicker text="THE #1 REASON BUSINESSES WIN" top={760} t={t} a={T.number} b={T.s2 + 0.05} />
      <Kicker text="RULE 01 · DON'T RUSH" top={250} t={t} a={T.dont1 - 0.1} b={T.s3} />
      <Kicker text="RULE 02 · LET THEM HELP YOU" top={250} t={t} a={T.s3 + 0.05} b={T.s4} />
      <Kicker text="CLIENT ZERO" top={250} t={t} a={T.first - 0.1} b={T.s5} />
      <Kicker text="THE PLAY" top={250} t={t} a={T.built - 0.1} b={T.s7} />
      <Kicker text="THE PAYOFF" top={250} t={t} a={T.s7 + 0.05} b={T.sixteen - 0.15} />
      <Kicker text="THE COMPOUND EFFECT" top={1010} t={t} a={T.recommended - 0.1} b={T.felt - 0.05} />
    </>
  );
};

/** "You don't rush to charge customers": a payment card whose button gets a NOT YET stamp. */
export const ChargeCard = () => {
  const t = useCurrentFrame() / FPS;
  const { o, s } = pop(t, T.rush - 0.15, T.s3 + 0.05);
  if (o <= 0) return null;
  const hov = prog(t, T.charge - 0.1, 0.7, inOutCubic);
  const back = prog(t, T.example + 0.05, 0.4, inOutCubic);
  const cx = lerp(lerp(900, 640, hov), 980, back), cy = lerp(lerp(1420, 1235, hov), 1450, back);
  const press = bump(t - T.customers - 0.1, 0.18);
  const stamp = spring(t, T.example - 0.12, 2.2, 8);
  const st = T.example - 0.12;
  return (
    <Abs style={{ left: 190, top: 920, width: 700, opacity: o, transform: `scale(${s}) rotate(${lerp(-4, -1.5, s)}deg)` }}>
      <div style={{ ...paper, padding: "38px 44px 40px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontFamily: MONO, fontSize: 24, letterSpacing: 3, color: MUTE }}>
          <span>NEW CUSTOMER</span>
          <span>DAY 1</span>
        </div>
        <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 96, letterSpacing: -3, marginTop: 10 }}>$4,800</div>
        <div style={{ fontFamily: SANS, fontSize: 30, color: MUTE, marginTop: -4 }}>Website + launch package</div>
        <div style={{ position: "relative", marginTop: 30 }}>
          <div style={{ borderRadius: 22, padding: "26px 0", textAlign: "center", fontFamily: SANS, fontWeight: 800, fontSize: 42, color: "#fff",
            background: `linear-gradient(180deg, #F06A6E, ${RED})`, transform: `scale(${1 - press * 0.05})`, filter: `saturate(${lerp(1, 0.2, prog(t, st, 0.2))})`, opacity: lerp(1, 0.5, prog(t, st, 0.2)) }}>
            Charge now
          </div>
          {t > st && (
            <Abs style={{ left: 120, top: -26, width: 380, transform: `rotate(-9deg) scale(${lerp(2.2, 1, Math.min(1, stamp))})`, opacity: Math.min(1, stamp * 1.6),
              border: `7px solid ${GOLD_STAMP}`, borderRadius: 20, padding: "12px 0", textAlign: "center", fontFamily: SANS, fontWeight: 900, fontSize: 70, letterSpacing: 6, color: GOLD_STAMP, background: "rgba(251,248,242,0.88)" }}>
              NOT YET
            </Abs>
          )}
        </div>
      </div>
      <Abs style={{ left: cx - 190, top: cy - 920, transform: `scale(${1 - press * 0.15})`, filter: "drop-shadow(0 8px 14px rgba(0,0,0,0.45))" }}>
        <IconCursor size={86} />
      </Abs>
    </Abs>
  );
};
const GOLD_STAMP = "#C58A22";

/** "You let them help you succeed": YOU ⇄ THEM, then both lift on a rising curve. */
export const HelpLink = () => {
  const t = useCurrentFrame() / FPS;
  const o = win(t, T.s3 + 0.02, T.s4 + 0.05, 0.25, 0.2);
  if (o <= 0) return null;
  const line = prog(t, T.let - 0.05, 0.45, inOutCubic);
  const lift = prog(t, T.succeed - 0.15, 0.6, outBack);
  const y = 1150 - lift * 120;
  const node = (x: number, label: string, d: number, gold: boolean) => {
    const p = spring(t, T.s3 + d, 2.2, 7);
    return (
      <Abs style={{ left: x - 105, top: y - 105 + (label === "THEM" ? -lift * 40 : 0), width: 210, textAlign: "center", transform: `scale(${Math.min(1.1, p)})`, opacity: Math.min(1, p * 2) }}>
        <div style={{ width: 170, height: 170, margin: "0 auto", borderRadius: 170, display: "flex", alignItems: "center", justifyContent: "center",
          background: gold ? "radial-gradient(circle at 35% 30%, #FFE3A3, #E8B04B 60%, #9E6E22)" : "rgba(20,22,27,0.8)", border: gold ? "none" : `4px solid ${BONE}`,
          boxShadow: gold ? "0 0 50px rgba(232,176,75,0.6)" : "0 20px 50px rgba(0,0,0,0.5)" }}>
          <IconUser size={92} color={gold ? "#1A1206" : BONE} sw={2} />
        </div>
        <div style={{ fontFamily: MONO, fontSize: 30, letterSpacing: 6, color: BONE, marginTop: 14, textShadow: "0 3px 10px rgba(0,0,0,0.7)" }}>{label}</div>
      </Abs>
    );
  };
  const flow = (t - T.help) * 1.6;
  return (
    <AbsoluteFill style={{ opacity: o }}>
      <svg width={1080} height={1920} style={{ position: "absolute" }}>
        <line x1={300} y1={y - 10} x2={lerp(300, 780, line)} y2={y - 10 - lift * 40 * line} stroke={GOLD} strokeWidth={6} strokeDasharray="2 18" strokeLinecap="round" strokeDashoffset={-flow * 60} />
        {t > T.help && [0, 1, 2].map((k) => {
          const u = (flow + k / 3) % 1;
          return <circle key={k} cx={lerp(300, 780, u)} cy={y - 10 - lift * 40 * u} r={10} fill="#FFD685" style={{ filter: "drop-shadow(0 0 10px #E8B04B)" }} />;
        })}
      </svg>
      {node(230, "YOU", 0.05, false)}
      {node(850, "THEM", 0.18, true)}
      <Abs style={{ top: y + 150, left: 0, right: 0, textAlign: "center", fontFamily: SERIF, fontStyle: "italic", fontSize: 84, color: BONE, opacity: prog(t, T.succeed - 0.05, 0.3), transform: `translateY(${(1 - prog(t, T.succeed - 0.05, 0.4)) * 30}px)`, textShadow: "0 6px 30px rgba(0,0,0,0.7)" }}>
        <span style={goldText}>succeed</span> together
      </Abs>
    </AbsoluteFill>
  );
};

/** "The first customer I ever got in my agency, Fluid": CLIENT #001 ticket. */
export const ClientTicket = () => {
  const t = useCurrentFrame() / FPS;
  const { o, s } = pop(t, T.first - 0.1, T.work1 - 0.15);
  if (o <= 0) return null;
  const ag = prog(t, T.agency - 0.05, 0.4, outExpo);
  return (
    <Abs style={{ left: 170, top: 960, width: 740, opacity: o, transform: `scale(${s}) rotate(${lerp(3, 1.5, s)}deg)` }}>
      <div style={{ ...glass, borderRadius: 34, padding: "34px 44px", display: "flex", alignItems: "center", gap: 36 }}>
        <div>
          <div style={{ fontFamily: MONO, fontSize: 26, letterSpacing: 5, color: MUTE }}>CUSTOMER</div>
          <div style={{ fontFamily: SERIF, fontSize: 190, lineHeight: "180px", letterSpacing: -6, ...goldText }}>#001</div>
        </div>
        <div style={{ width: 2, alignSelf: "stretch", background: "repeating-linear-gradient(180deg, rgba(255,240,215,0.4) 0 10px, transparent 10px 20px)" }} />
        <div style={{ opacity: ag, transform: `translateX(${(1 - ag) * 40}px)` }}>
          <div style={{ fontFamily: MONO, fontSize: 24, letterSpacing: 4, color: MUTE }}>AGENCY</div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 6 }}>
            <svg width={56} height={56} viewBox="0 0 24 24"><path d="M12 2.5C9 7 6 10.2 6 14a6 6 0 0 0 12 0c0-3.8-3-7-6-11.5z" fill={GOLD} /></svg>
            <span style={{ fontFamily: SANS, fontWeight: 800, fontSize: 70, letterSpacing: -2, color: BONE }}>fluid</span>
          </div>
        </div>
      </div>
    </Abs>
  );
};

/** "I actually did the work for free": the invoice totals to $0.00 and gets a FREE stamp. */
export const Invoice = () => {
  const t = useCurrentFrame() / FPS;
  const { o, s } = pop(t, T.work1 - 0.2, T.s5 + 0.1);
  if (o <= 0) return null;
  const rows: [string, string, number][] = [
    ["Brand strategy", "$3,500", T.work1 - 0.05],
    ["Design + build", "$8,500", T.work1 + 0.1],
    ["Discount", "−$12,000", T.free1 - 0.25],
  ];
  const tot = prog(t, T.free1 - 0.1, 0.25);
  const stamp = spring(t, T.free1 + 0.05, 2.2, 8);
  return (
    <Abs style={{ left: 200, top: 880, width: 680, opacity: o, transform: `scale(${s}) rotate(${lerp(-4, -2, s)}deg)` }}>
      <div style={{ ...paper, padding: "36px 44px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <span style={{ fontFamily: SANS, fontWeight: 800, fontSize: 52, letterSpacing: -1.5 }}>Invoice</span>
          <span style={{ fontFamily: MONO, fontSize: 24, color: MUTE, letterSpacing: 2 }}>#0001 · FLUID</span>
        </div>
        <div style={{ height: 2, background: "#DDD3C2", margin: "18px 0 10px" }} />
        {rows.map(([a, b, at], i) => {
          const p = prog(t, at, 0.3, outCubic);
          return (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", fontFamily: SANS, fontSize: 36, padding: "10px 0", opacity: p, transform: `translateX(${(1 - p) * -30}px)`, color: i === 2 ? "#2E8A57" : INK, fontWeight: i === 2 ? 700 : 500 }}>
              <span>{a}</span>
              <span style={{ fontVariantNumeric: "tabular-nums" }}>{b}</span>
            </div>
          );
        })}
        <div style={{ height: 3, background: INK, margin: "12px 0 14px" }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", opacity: tot }}>
          <span style={{ fontFamily: MONO, fontSize: 28, letterSpacing: 4 }}>TOTAL DUE</span>
          <span style={{ fontFamily: SANS, fontWeight: 900, fontSize: 84, letterSpacing: -3 }}>$0.00</span>
        </div>
      </div>
      {t > T.free1 + 0.05 && (
        <Abs style={{ right: -40, top: -60, transform: `rotate(12deg) scale(${lerp(2.4, 1, Math.min(1, stamp))})`, opacity: Math.min(1, stamp * 1.6),
          border: `8px solid ${GOLD_STAMP}`, borderRadius: 24, padding: "10px 34px", fontFamily: SANS, fontWeight: 900, fontSize: 96, letterSpacing: 8, color: GOLD_STAMP, background: "rgba(251,248,242,0.9)", boxShadow: "0 20px 40px rgba(0,0,0,0.35)" }}>
          FREE
        </Abs>
      )}
    </Abs>
  );
};

/** "A lot of people say don't do the work for free": the internet's advice pops up, then gets blown away. */
const SAYS: [string, string, number, number, number][] = [
  // text, handle, x, y, rotation
  ["Never work for free.", "@growth.guru", 30, 240, -4],
  ["Know your worth.", "@ceo.mindset", 600, 300, 3],
  ["Charge from day one.", "@agency.tips", 40, 930, 2],
  ["Free clients are the worst clients.", "@freelance.facts", 520, 1060, -3],
  ["Exposure doesn't pay rent.", "@design.daily", 70, 1240, -2],
];
export const Bubbles = () => {
  const t = useCurrentFrame() / FPS;
  if (t < T.lot - 0.2 || t > T.agree + 0.6) return null;
  const gone = prog(t, T.dont3 - 0.08, 0.45, Easing_in);
  return (
    <AbsoluteFill>
      {SAYS.map(([txt, h, x, y, r], i) => {
        const a = T.lot - 0.1 + i * ((T.free2 - T.lot) / 5);
        const p = spring(t, a, 2.4, 8);
        if (t < a) return null;
        const dir = x < 300 ? -1 : 1;
        return (
          <Abs key={i} style={{ left: x, top: y, maxWidth: 500, opacity: Math.min(1, p * 2) * (1 - gone),
            transform: `translate(${gone * dir * 500}px, ${gone * 160}px) rotate(${r + gone * dir * 25}deg) scale(${lerp(0.6, 1, Math.min(1.08, p))})`, filter: `blur(${gone * 10}px)` }}>
            <div style={{ ...paper, borderRadius: 28, padding: "20px 28px 22px", display: "flex", gap: 18, alignItems: "flex-start" }}>
              <div style={{ width: 58, height: 58, borderRadius: 58, flex: "none", background: `hsl(${30 + i * 50} 30% 70%)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <IconUser size={36} color="#fff" sw={2.2} />
              </div>
              <div>
                <div style={{ fontFamily: SANS, fontSize: 24, color: MUTE, fontWeight: 600 }}>{h}</div>
                <div style={{ fontFamily: SANS, fontSize: 38, fontWeight: 700, letterSpacing: -0.8, lineHeight: "44px", marginTop: 2 }}>{txt}</div>
              </div>
            </div>
          </Abs>
        );
      })}
    </AbsoluteFill>
  );
};
const Easing_in = (x: number) => x * x * x;

/** "I don't agree." */
export const Disagree = () => {
  const t = useCurrentFrame() / FPS;
  const o = win(t, T.dont3 - 0.08, T.s6 + 0.02, 0.1, 0.2);
  if (o <= 0) return null;
  const a = prog(t, T.dont3 - 0.08, 0.3, outExpo);
  const b = spring(t, T.agree - 0.08, 2, 7);
  return (
    <AbsoluteFill style={{ opacity: o }}>
      <Abs style={{ top: 1040, left: 0, right: 0, textAlign: "center" }}>
        <div style={{ fontFamily: SANS, fontWeight: 900, fontSize: 170, letterSpacing: -6, lineHeight: "170px", color: BONE, transform: `scale(${lerp(1.5, 1, a)})`, opacity: a, filter: `blur(${(1 - a) * 12}px)`, textShadow: "0 20px 60px rgba(0,0,0,0.6)" }}>
          I DON'T
        </div>
        <div style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 220, lineHeight: "210px", letterSpacing: -4, ...goldText, transform: `translateY(${(1 - Math.min(1, b)) * 60}px) scale(${lerp(0.7, 1, Math.min(1.08, b))})`, opacity: Math.min(1, b * 2), filter: "drop-shadow(0 16px 40px rgba(0,0,0,0.6))" }}>
          agree.
        </div>
      </Abs>
    </AbsoluteFill>
  );
};

/** "I built up a relationship … over-delivered when it was free": a relationship meter and a checklist. */
export const Relationship = () => {
  const t = useCurrentFrame() / FPS;
  const { o, s } = pop(t, T.built - 0.1, T.s7 + 0.05);
  if (o <= 0) return null;
  const fill = prog(t, T.relationship - 0.1, T.free3 - T.relationship + 0.4, inOutCubic);
  const rows: [string, number][] = [
    ["Did the work", T.customer2],
    ["Went the extra mile", T.over],
    ["Over-delivered", T.delivered + 0.1],
  ];
  return (
    <Abs style={{ left: 170, top: 900, width: 740, opacity: o, transform: `scale(${s})` }}>
      <div style={{ ...glass, borderRadius: 34, padding: "34px 40px 30px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontFamily: MONO, fontSize: 26, letterSpacing: 4 }}>
          <span style={{ color: MUTE }}>RELATIONSHIP</span>
          <span style={{ color: "#FFD685", fontVariantNumeric: "tabular-nums" }}>{Math.round(fill * 100)}%</span>
        </div>
        <div style={{ height: 22, borderRadius: 22, background: "rgba(255,255,255,0.1)", marginTop: 16, overflow: "hidden" }}>
          <div style={{ width: `${fill * 100}%`, height: "100%", borderRadius: 22, background: `linear-gradient(90deg, #9E6E22, ${GOLD}, #FFE3A3)`, boxShadow: "0 0 24px rgba(232,176,75,0.7)" }} />
        </div>
        <div style={{ marginTop: 22 }}>
          {rows.map(([txt, at], i) => {
            const p = prog(t, at - 0.1, 0.3, outCubic);
            const c = prog(t, at, 0.3, inOutCubic);
            return (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 20, padding: "10px 0", opacity: lerp(0.25, 1, p) }}>
                <div style={{ width: 52, height: 52, borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", background: c > 0 ? GOLD : "rgba(255,255,255,0.08)", transform: `scale(${1 + bump(t - at, 0.25) * 0.2})` }}>
                  <Check size={38} color={INK} p={c} />
                </div>
                <span style={{ fontFamily: SANS, fontSize: 42, fontWeight: i === 2 ? 800 : 600, color: i === 2 ? "#FFD685" : BONE, letterSpacing: -0.6 }}>{txt}</span>
              </div>
            );
          })}
        </div>
      </div>
    </Abs>
  );
};

/** "Once they were happy … use me forever": five stars, then "client for life". */
export const Happy = () => {
  const t = useCurrentFrame() / FPS;
  const { o, s } = pop(t, T.happy - 0.25, T.sixteen - 0.1);
  if (o <= 0) return null;
  const life = prog(t, T.forever - 0.1, 0.35, outExpo);
  return (
    <Abs style={{ left: 0, right: 0, top: 1060, display: "flex", justifyContent: "center", opacity: o, transform: `scale(${s})` }}>
      <div style={{ ...glass, borderRadius: 999, padding: "24px 40px", display: "flex", alignItems: "center", gap: 26 }}>
        <div style={{ display: "flex", gap: 6 }}>
          {[0, 1, 2, 3, 4].map((i) => {
            const p = spring(t, T.happy - 0.15 + i * 0.07, 2.6, 8);
            return <div key={i} style={{ transform: `scale(${Math.min(1.2, p)}) rotate(${(1 - Math.min(1, p)) * -90}deg)` }}><Star size={58} /></div>;
          })}
        </div>
        <div style={{ position: "relative", width: 330, height: 60, overflow: "hidden" }}>
          <Abs style={{ top: 4 - life * 60, fontFamily: SANS, fontWeight: 800, fontSize: 44, color: BONE, letterSpacing: -1, whiteSpace: "nowrap" }}>Happy client</Abs>
          <Abs style={{ top: 64 - life * 60, fontFamily: SANS, fontWeight: 800, fontSize: 44, ...goldText, letterSpacing: -1, whiteSpace: "nowrap" }}>Client for life</Abs>
        </div>
      </div>
    </Abs>
  );
};

/** "Sixteen years that I ran that company": label + a 16-tick ruler under the giant numeral. */
export const YearRuler = () => {
  const t = useCurrentFrame() / FPS;
  const o = win(t, T.sixteen - 0.1, T.s8 + 0.1, 0.25, 0.25);
  if (o <= 0) return null;
  const p = prog(t, T.sixteen - 0.1, 0.75, outCubic);
  const lab = prog(t, T.years - 0.1, 0.4, outExpo);
  return (
    <AbsoluteFill style={{ opacity: o }}>
      <Abs style={{ top: 1050, left: 0, right: 0, textAlign: "center", fontFamily: SANS, fontWeight: 900, fontSize: 120, letterSpacing: 24, color: BONE, opacity: lab, transform: `translateY(${(1 - lab) * 40}px)`, textShadow: "0 10px 40px rgba(0,0,0,0.6)", paddingLeft: 24 }}>
        YEARS
      </Abs>
      <Abs style={{ top: 1230, left: 110, width: 860, height: 90 }}>
        <div style={{ position: "absolute", top: 40, left: 0, width: "100%", height: 3, background: "rgba(255,240,215,0.25)" }} />
        <div style={{ position: "absolute", top: 39, left: 0, width: `${p * 100}%`, height: 5, background: GOLD, boxShadow: "0 0 16px rgba(232,176,75,0.8)" }} />
        {Array.from({ length: 16 }, (_, i) => {
          const on = p * 15 >= i - 0.01;
          const x = (i / 15) * 860;
          return <div key={i} style={{ position: "absolute", left: x - 7, top: 34, width: 14, height: 14, borderRadius: 14, background: on ? "#FFD685" : "rgba(255,240,215,0.3)", boxShadow: on ? "0 0 12px #E8B04B" : "none" }} />;
        })}
        <div style={{ position: "absolute", left: -20, top: 62, fontFamily: MONO, fontSize: 24, color: MUTE, letterSpacing: 3 }}>YEAR 1</div>
        <div style={{ position: "absolute", right: -30, top: 62, fontFamily: MONO, fontSize: 24, color: "#FFD685", letterSpacing: 3, opacity: prog(t, T.sixteen + 0.6, 0.2) }}>YEAR 16</div>
      </Abs>
    </AbsoluteFill>
  );
};

/** "Recommended me to everybody": referral counter. */
export const Referrals = () => {
  const t = useCurrentFrame() / FPS;
  const { o, s } = pop(t, T.recommended - 0.05, T.felt - 0.05);
  if (o <= 0) return null;
  const n = Math.round(lerp(1, 24, prog(t, T.recommended + 0.1, T.everybody - T.recommended + 0.4, inOutCubic)));
  return (
    <Abs style={{ left: 0, right: 0, top: 1110, display: "flex", justifyContent: "center", opacity: o, transform: `scale(${s})` }}>
      <div style={{ ...glass, borderRadius: 34, padding: "22px 44px", display: "flex", alignItems: "baseline", gap: 22 }}>
        <span style={{ fontFamily: SANS, fontWeight: 900, fontSize: 110, letterSpacing: -4, ...goldText, fontVariantNumeric: "tabular-nums", minWidth: 170, textAlign: "right" }}>+{n}</span>
        <span style={{ fontFamily: SANS, fontWeight: 700, fontSize: 46, color: BONE, letterSpacing: -1 }}>referrals</span>
      </div>
    </Abs>
  );
};

/** "They felt like they were part of my early journey." */
export const Journey = () => {
  const t = useCurrentFrame() / FPS;
  const o = win(t, T.part - 0.15, T.endCard + 0.1, 0.3, 0.25);
  if (o <= 0) return null;
  const w = "part of my early journey.".split(" ");
  return (
    <Abs style={{ top: 1080, left: 80, right: 80, textAlign: "center", opacity: o }}>
      <div style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 128, lineHeight: "128px", letterSpacing: -3, color: BONE, textShadow: "0 10px 40px rgba(0,0,0,0.7)" }}>
        {w.map((x, i) => {
          const at = [T.part, T.part + 0.15, T.part + 0.28, T.early, T.journey][i];
          const p = prog(t, at - 0.1, 0.4, outExpo);
          const gold = i >= 3;
          return (
            <span key={i} style={{ display: "inline-block", marginRight: 26, opacity: p, transform: `translateY(${(1 - p) * 40}px)`, filter: `blur(${(1 - p) * 8}px)`, ...(gold ? goldText : {}) }}>
              {i === 0 ? "“" : ""}{x}{i === 4 ? "”" : ""}
            </span>
          );
        })}
      </div>
    </Abs>
  );
};
