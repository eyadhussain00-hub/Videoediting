import type { ReactNode } from "react";
import { useCurrentFrame } from "remotion";
import { BLUE, BLUE_PALE, CH, CREAM, FPS, GOLD, GOLD_PALE, INK, RED, T } from "../data";
import { MONO, SANS, SERIF } from "../fonts";
import { Abs, IconCheck, IconGift, IconPerson, IconPound, IconShield, Kicker, Lock, bump, glass, inCubic, lerp, metal, money, outBack, outExpo, prog, spring, win } from "../ui";

// Right-hand zone (the stairwell wall, clear of his head): x 580-1040.
const ZX = 580;
const ZW = 460;

/** A hero block in the right zone: springs in, holds, collapses up-right (into the checklist). */
const Hero = ({ a, b, children, top = 330 }: { a: number; b: number; children: ReactNode; top?: number }) => {
  const t = useCurrentFrame() / FPS;
  if (t < a - 0.1 || t > b + 0.5) return null;
  const p = spring(t, a, 1.9, 7);
  const q = prog(t, b - 0.1, 0.4, inCubic);
  return (
    <Abs
      style={{
        left: ZX,
        top,
        width: ZW,
        opacity: Math.min(1, p * 2) * (1 - q),
        transform: `translateY(${(1 - Math.min(1, p)) * 80 - q * 60}px) scale(${lerp(0.85, 1, Math.min(1.05, p)) * (1 - 0.25 * q)})`,
        transformOrigin: "100% 0%",
        filter: `blur(${Math.max(0, 1 - p) * 12 + q * 14}px)`,
      }}
    >
      {children}
    </Abs>
  );
};

const Big = ({ children, c, size = 150 }: { children: ReactNode; c: "gold" | "blue" | "white"; size?: number }) => (
  <div style={{ fontFamily: SERIF, fontSize: size, lineHeight: 1, letterSpacing: -3, ...metal(c), filter: "drop-shadow(0 10px 30px rgba(0,0,0,0.5))", whiteSpace: "nowrap" }}>{children}</div>
);

/** £20,000 counting up. */
export const IsaAllowance = () => {
  const t = useCurrentFrame() / FPS;
  const v = 20000 * prog(t, T.k20 - 0.1, 0.9, outExpo);
  return (
    <Hero a={T.k20 - 0.2} b={T.all + 0.1}>
      <Kicker color={GOLD} style={{ marginBottom: 14 }}>Invest up to</Kicker>
      <Big c="gold">{money(v)}</Big>
      <div style={{ marginTop: 18, display: "inline-block", ...glass, borderRadius: 999, padding: "10px 24px", fontFamily: MONO, fontSize: 26, letterSpacing: 3, opacity: prog(t, T.per1 - 0.05, 0.3) }}>PER TAX YEAR</div>
    </Hero>
  );
};

type Item = { at: number; icon: (c: string) => ReactNode; text: string; sub?: string };

/** The account's checklist card (replaces his burned-in list): items tick in as he says them. */
const Checklist = ({ a, b, title, col, items, top = 330 }: { a: number; b: number; title: string; col: string; items: Item[]; top?: number }) => {
  const t = useCurrentFrame() / FPS;
  if (t < a - 0.1 || t > b + 0.5) return null;
  const p = prog(t, a, 0.55, outExpo);
  const q = prog(t, b - 0.05, 0.4, inCubic);
  return (
    <Abs style={{ left: ZX, top, width: ZW, opacity: p * (1 - q), transform: `translateX(${(1 - p) * 120 + q * 140}px)`, filter: `blur(${q * 10}px)` }}>
      <div style={{ ...glass, padding: "26px 28px 14px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 10 }}>
          <div style={{ width: 14, height: 14, borderRadius: 7, background: col, boxShadow: `0 0 14px ${col}` }} />
          <Kicker color={col} style={{ fontSize: 24 }}>
            {title}
          </Kicker>
        </div>
        {items.map((it, i) => {
          const ip = prog(t, it.at - 0.1, 0.45, outExpo);
          const ck = prog(t, it.at + 0.15, 0.35);
          const flash = bump(t - it.at + 0.1, 0.5);
          return (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 18, padding: "14px 0", borderTop: i ? "1px solid rgba(255,245,225,0.1)" : "none", opacity: lerp(0.0, 1, ip), transform: `translateY(${(1 - ip) * 20}px)`, height: ip > 0 ? undefined : 0, overflow: "hidden" }}>
              <div style={{ width: 58, height: 58, borderRadius: 18, flex: "none", display: "grid", placeItems: "center", background: `${col}22`, border: `1.5px solid ${col}66`, boxShadow: `0 0 ${30 * flash}px ${col}` }}>{it.icon(col)}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: SANS, fontWeight: 750, fontSize: 32, lineHeight: "38px", color: CREAM }}>{it.text}</div>
                {it.sub && <div style={{ fontFamily: SANS, fontWeight: 500, fontSize: 24, color: "rgba(255,247,234,0.6)", marginTop: 2 }}>{it.sub}</div>}
              </div>
              <div style={{ width: 40, height: 40, borderRadius: 20, flex: "none", background: ck > 0 ? col : "transparent", display: "grid", placeItems: "center", transform: `scale(${lerp(0.5, 1, outBack(Math.min(1, ck)))})` }}>
                <IconCheck size={26} color={INK} p={ck} />
              </div>
            </div>
          );
        })}
      </div>
    </Abs>
  );
};

export const IsaList = () => (
  <Checklist
    a={T.all + 0.05}
    b={CH.sipp}
    title="Stocks & Shares ISA"
    col={GOLD}
    items={[
      { at: T.all + 0.1, icon: (c) => <IconPound color={c} />, text: "£20k a tax year", sub: "your yearly allowance" },
      { at: T.completely, icon: (c) => <IconShield color={c} />, text: "Returns 100% tax-free", sub: "no tax on the growth" },
      { at: T.withdraw, icon: (c) => <Lock size={30} color={c} open={1} />, text: "Withdraw any time", sub: "it's your money" },
      { at: T.n18, icon: (c) => <IconPerson color={c} />, text: "Anyone 18+ in the UK", sub: "can open one" },
    ]}
  />
);

/** "TAX-FREE" stamp slammed onto the ISA glass's side of the frame. */
export const TaxFreeStamp = () => {
  const t = useCurrentFrame() / FPS;
  const a = T.completely + 0.25;
  if (t < a - 0.1 || t > T.withdraw) return null;
  const p = prog(t, a, 0.22, outExpo);
  const q = prog(t, T.withdraw - 0.35, 0.3, inCubic);
  return (
    <Abs style={{ left: 120, top: 1040, transform: `rotate(-9deg) scale(${lerp(2.4, 1, p)})`, opacity: p * (1 - q) }}>
      <div style={{ border: `6px solid ${GOLD}`, borderRadius: 18, padding: "6px 26px", fontFamily: SANS, fontWeight: 900, fontSize: 88, letterSpacing: 4, color: GOLD, textShadow: `0 0 30px ${GOLD}88`, background: "rgba(10,10,18,0.35)", boxShadow: `0 0 40px ${GOLD}55` }}>TAX-FREE</div>
    </Abs>
  );
};

/** S·I·P·P spelled out as he says "self-invested personal pension". */
export const Acronym = () => {
  const t = useCurrentFrame() / FPS;
  const rows: [string, string, number][] = [
    ["S", "elf-", T.self],
    ["I", "nvested", T.self + 0.3],
    ["P", "ersonal", T.personal],
    ["P", "ension", T.pension],
  ];
  return (
    <Hero a={T.self - 0.45} b={T.contribute - 0.05} top={300}>
      {rows.map(([l, rest, s], i) => {
        const p = spring(t, s - 0.25, 2, 7);
        const typed = Math.floor(rest.length * prog(t, s - 0.05, 0.35, (x) => x));
        return (
          <div key={i} style={{ display: "flex", alignItems: "baseline", height: 128, opacity: 0.4 + 0.6 * Math.min(1, p * 1.5) }}>
            <div style={{ width: 110, fontFamily: SANS, fontWeight: 900, fontSize: 120, lineHeight: "128px", ...metal("blue"), transform: `scale(${lerp(0.7, 1, Math.min(1.05, p))})` }}>{l}</div>
            <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 56, color: CREAM, textShadow: "0 3px 14px rgba(0,0,0,0.6)" }}>{rest.slice(0, typed)}</div>
          </div>
        );
      })}
    </Hero>
  );
};

/** £60,000 or 100% of earnings, whichever is lower. */
export const SippAllowance = () => {
  const t = useCurrentFrame() / FPS;
  const v = 60000 * prog(t, T.k60 - 0.1, 0.9, outExpo);
  const o = prog(t, T.or100 - 0.3, 0.4, outExpo);
  const l = spring(t, T.lower - 0.1, 2, 7);
  return (
    <Hero a={T.k60 - 0.2} b={T.lower + 0.75}>
      <Kicker color={BLUE} style={{ marginBottom: 14 }}>Contribute up to</Kicker>
      <Big c="blue">{money(v)}</Big>
      <div style={{ marginTop: 20, opacity: o, transform: `translateY(${(1 - o) * 20}px)`, fontFamily: SANS, fontWeight: 700, fontSize: 46, color: CREAM, textShadow: "0 3px 14px rgba(0,0,0,0.6)" }}>
        or <span style={{ color: BLUE_PALE }}>100%</span> of your earnings
      </div>
      <div style={{ marginTop: 18, display: "inline-block", padding: "10px 22px", borderRadius: 999, background: BLUE, color: INK, fontFamily: MONO, fontWeight: 700, fontSize: 24, letterSpacing: 2, opacity: Math.min(1, l * 2), transform: `scale(${lerp(0.6, 1, Math.min(1.1, l))})` }}>
        WHICHEVER IS LOWER
      </div>
    </Hero>
  );
};

/** Tax relief: pay in £80, the government tops it up to £100. */
export const TaxRelief = () => {
  const t = useCurrentFrame() / FPS;
  const fill = prog(t, T.taxRelief - 0.1, 0.8, outExpo);
  const top = prog(t, T.thats20 - 0.15, 0.6, outBack);
  const higher = spring(t, T.higher - 0.1, 2, 7);
  const H = 420;
  return (
    <Hero a={T.get - 0.25} b={T.claim + 0.8} top={300}>
      <Kicker color={BLUE} style={{ marginBottom: 18 }}>Tax relief on top</Kicker>
      <div style={{ display: "flex", gap: 26, alignItems: "flex-end" }}>
        <div style={{ position: "relative", width: 120, flex: "none", height: H, borderRadius: 26, background: "rgba(255,255,255,0.06)", border: "1.5px solid rgba(255,255,255,0.15)", overflow: "hidden" }}>
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: H * 0.8 * fill, background: "linear-gradient(180deg, #B9CFF5, #6F93CF)" }} />
          <div style={{ position: "absolute", bottom: H * 0.8 * fill, left: 0, right: 0, height: H * 0.2 * top, background: `linear-gradient(180deg, #8FC0FF, ${BLUE})`, boxShadow: `0 0 40px ${BLUE}` }} />
          <div style={{ position: "absolute", bottom: 18, width: "100%", textAlign: "center", fontFamily: SANS, fontWeight: 800, fontSize: 34, color: INK, opacity: fill }}>£80</div>
        </div>
        <div style={{ paddingBottom: 10, flex: 1, minWidth: 0 }}>
          <div style={{ opacity: top, transform: `translateX(${(1 - top) * 30}px)` }}>
            <div style={{ fontFamily: SERIF, fontSize: 130, lineHeight: 1, ...metal("blue") }}>+20%</div>
            <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 32, color: CREAM, marginTop: 6 }}>basic-rate payer</div>
            <div style={{ fontFamily: SANS, fontWeight: 500, fontSize: 26, color: "rgba(255,247,234,0.65)", marginTop: 6 }}>£80 in → £100 invested</div>
          </div>
          <div style={{ marginTop: 26, display: "flex", alignItems: "center", gap: 12, opacity: Math.min(1, higher * 2), transform: `translateY(${(1 - Math.min(1, higher)) * 20}px)` }}>
            <IconGift color={GOLD} size={38} />
            <div style={{ fontFamily: SANS, fontWeight: 750, fontSize: 30, color: GOLD_PALE, lineHeight: "36px" }}>
              Higher rate?
              <br />
              Claim even more
            </div>
          </div>
        </div>
      </div>
    </Hero>
  );
};

export const SippList = () => (
  <Checklist
    a={T.claim + 0.75}
    b={CH.catch}
    title="SIPP"
    col={BLUE}
    top={360}
    items={[
      { at: T.claim + 0.8, icon: (c) => <IconPound color={c} />, text: "£60k a tax year", sub: "or 100% of earnings" },
      { at: T.claim + 1.1, icon: (c) => <IconGift color={c} />, text: "Tax relief: +20%", sub: "more for higher rate" },
    ]}
  />
);

/** "THE CATCH" slam, then the access age: 55, rolling to 57 from 2028. */
export const TheCatch = () => {
  const t = useCurrentFrame() / FPS;
  if (t < T.catch - 0.2 || t > T.when + 0.4) return null;
  const s = prog(t, T.catch - 0.12, 0.2, outExpo);
  const sOut = prog(t, T.cant - 0.15, 0.3, inCubic);
  const roll = prog(t, T.n57 - 0.12, 0.45, outBack);
  const age = spring(t, T.until, 1.9, 7);
  const ageOut = prog(t, T.when - 0.1, 0.4, inCubic);
  const tag = spring(t, T.y2028 - 0.15, 2, 7);
  return (
    <>
      <Abs style={{ left: 0, right: 0, top: 380, display: "flex", justifyContent: "center", opacity: s * (1 - sOut), transform: `scale(${lerp(2.2, 1, s) * (1 + 0.2 * sOut)}) rotate(-4deg)`, filter: `blur(${sOut * 12}px)` }}>
        <div style={{ fontFamily: SANS, fontWeight: 900, fontSize: 150, letterSpacing: -3, color: "#fff", background: RED, padding: "0 34px 10px", borderRadius: 24, boxShadow: `0 20px 80px ${RED}88` }}>THE CATCH</div>
      </Abs>
      <Abs style={{ left: ZX, top: 320, width: ZW, opacity: Math.min(1, age * 2) * (1 - ageOut), transform: `translateY(${(1 - Math.min(1, age)) * 60}px)`, filter: `blur(${ageOut * 12}px)` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <Lock size={40} color={RED} />
          <Kicker color="#FFB4AC">Locked until age</Kicker>
        </div>
        <div style={{ position: "relative", height: 300, overflow: "hidden", marginTop: 6 }}>
          {[55, 57].map((n, i) => (
            <div key={n} style={{ position: "absolute", top: (i - roll) * 300, fontFamily: SERIF, fontSize: 330, lineHeight: "300px", letterSpacing: -8, ...metal(i ? "gold" : "white"), filter: "drop-shadow(0 12px 30px rgba(0,0,0,0.5))" }}>
              {n}
            </div>
          ))}
        </div>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 12, padding: "10px 22px", borderRadius: 999, background: GOLD, color: INK, fontFamily: MONO, fontWeight: 700, fontSize: 28, letterSpacing: 2, opacity: Math.min(1, tag * 2), transform: `scale(${lerp(0.6, 1, Math.min(1.1, tag))})` }}>
          FROM 2028
        </div>
      </Abs>
    </>
  );
};

/** Taking it out: 25% tax-free, the rest taxed as income. */
export const Donut = () => {
  const t = useCurrentFrame() / FPS;
  const g = prog(t, T.first25 - 0.1, 0.7, outExpo);
  const r = prog(t, T.rest - 0.1, 0.8, outExpo);
  const R = 150;
  const C = 2 * Math.PI * R;
  return (
    <Hero a={T.when - 0.05} b={CH.verdict} top={320}>
      <Kicker color={BLUE} style={{ marginBottom: 18 }}>When you take it out</Kicker>
      <div style={{ position: "relative", width: 380, height: 380 }}>
        <svg width={380} height={380} viewBox="0 0 380 380" style={{ transform: "rotate(-90deg)" }}>
          <circle cx={190} cy={190} r={R} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={44} />
          <circle cx={190} cy={190} r={R} fill="none" stroke="#7E94BD" strokeWidth={44} strokeDasharray={`${C * 0.75 * r} ${C}`} strokeDashoffset={-C * 0.25} />
          <circle cx={190} cy={190} r={R} fill="none" stroke={GOLD} strokeWidth={48} strokeDasharray={`${C * 0.25 * g} ${C}`} style={{ filter: `drop-shadow(0 0 14px ${GOLD})` }} />
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", textAlign: "center" }}>
          <div>
            <div style={{ fontFamily: SERIF, fontSize: 130, lineHeight: 1, ...metal("gold"), opacity: g }}>25%</div>
            <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 30, color: GOLD_PALE, opacity: prog(t, T.taxfree2 - 0.1, 0.3) }}>TAX-FREE</div>
          </div>
        </div>
      </div>
      <div style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 14, opacity: r }}>
        <div style={{ width: 22, height: 22, borderRadius: 6, background: "#7E94BD" }} />
        <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 34, color: CREAM }}>The rest: taxed as income</div>
      </div>
    </Hero>
  );
};

/** "BOTH." behind him, half gold, half sapphire. */
export const BothBehind = () => {
  const t = useCurrentFrame() / FPS;
  if (t < T.ideally - 0.3 || t > T.use + 0.6) return null;
  const p = spring(t, T.both2 - 0.12, 1.7, 6);
  const q = prog(t, T.use - 0.1, 0.5, inCubic);
  return (
    <Abs style={{ right: 40, top: 330, textAlign: "right", fontFamily: SERIF, fontSize: 250, lineHeight: "240px", letterSpacing: -6, transformOrigin: "100% 50%", opacity: Math.min(1, p * 2) * (1 - q), transform: `scale(${lerp(0.6, 1, Math.min(1.08, p)) * (1 + q * 0.15)})`, filter: `blur(${Math.max(0, 1 - p) * 20 + q * 16}px)` }}>
      <div style={{ fontFamily: MONO, fontSize: 28, letterSpacing: 6, color: CREAM, marginBottom: 8, textShadow: "0 2px 10px rgba(0,0,0,0.6)" }}>IDEALLY</div>
      <span style={{ ...metal("gold"), filter: "drop-shadow(0 10px 30px rgba(0,0,0,0.5))" }}>BO</span>
      <span style={{ ...metal("blue"), filter: "drop-shadow(0 10px 30px rgba(0,0,0,0.5))" }}>TH.</span>
    </Abs>
  );
};

/** The verdict as a life timeline: the ISA covers now → retirement, the SIPP takes over from 57. */
export const Timeline = () => {
  const t = useCurrentFrame() / FPS;
  const isa = prog(t, T.isa3 - 0.1, 0.9, outExpo);
  const sipp = prog(t, T.sipp4 - 0.1, 0.9, outExpo);
  const H = 520;
  const mark = (y: number, label: string, p: number) => (
    <div style={{ position: "absolute", left: 0, top: y, display: "flex", alignItems: "center", gap: 14, opacity: p }}>
      <div style={{ width: 18, height: 18, borderRadius: 9, background: CREAM, boxShadow: "0 0 12px rgba(255,255,255,0.6)" }} />
      <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 24, letterSpacing: 2, color: CREAM }}>{label}</div>
    </div>
  );
  return (
    <Hero a={T.use - 0.2} b={CH.outro + 0.1} top={300}>
      <div style={{ ...glass, padding: "28px 30px", height: H + 70, position: "relative" }}>
        <div style={{ position: "absolute", left: 38, top: 40, width: 3, height: H - 20, background: "rgba(255,247,234,0.25)" }} />
        <div style={{ position: "absolute", left: 30, top: 28, width: 400, height: H }}>
          {mark(0, "NOW", 1)}
          {mark(H * 0.55, "AGE 57", Math.max(isa, sipp))}
          {mark(H - 30, "RETIREMENT", sipp)}
          {/* ISA bar: now → before retirement */}
          <div style={{ position: "absolute", left: 190, top: 6, width: 26, height: (H * 0.55 - 6) * isa, borderRadius: 13, background: `linear-gradient(180deg, ${GOLD_PALE}, ${GOLD})`, boxShadow: `0 0 26px ${GOLD}88` }} />
          <div style={{ position: "absolute", left: 236, top: 30, opacity: isa, fontFamily: SANS }}>
            <div style={{ fontWeight: 800, fontSize: 40, color: GOLD }}>ISA</div>
            <div style={{ fontWeight: 600, fontSize: 26, color: CREAM, lineHeight: "32px" }}>
              money you need
              <br />
              before retirement
            </div>
          </div>
          {/* SIPP bar: locked until 57, then retirement */}
          <div style={{ position: "absolute", left: 190, top: H * 0.55 + 6, width: 26, height: (H * 0.45 - 20) * sipp, borderRadius: 13, background: `linear-gradient(180deg, ${BLUE_PALE}, ${BLUE})`, boxShadow: `0 0 26px ${BLUE}88` }} />
          <div style={{ position: "absolute", left: 236, top: H * 0.55 + 30, opacity: sipp, fontFamily: SANS }}>
            <div style={{ fontWeight: 800, fontSize: 40, color: BLUE }}>SIPP</div>
            <div style={{ fontWeight: 600, fontSize: 26, color: CREAM, lineHeight: "32px" }}>
              long-term
              <br />
              retirement savings
            </div>
          </div>
        </div>
      </div>
    </Hero>
  );
};

/** Follow card: the button gets tapped on "drop a follow". */
export const Follow = () => {
  const t = useCurrentFrame() / FPS;
  const tap = T.follow + 0.15;
  const pressed = prog(t, tap, 0.25);
  const press = bump(t - tap + 0.05, 0.2);
  const sub = prog(t, T.finance - 0.4, 0.4, outExpo);
  const cursor = prog(t, T.drop - 0.2, 0.55, outExpo);
  return (
    <Hero a={T.drop - 0.5} b={T.stay - 0.1} top={360}>
      <div style={{ ...glass, padding: "28px 28px 26px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div style={{ width: 92, height: 92, borderRadius: 46, flex: "none", display: "grid", placeItems: "center", background: `radial-gradient(circle at 35% 30%, ${GOLD_PALE}, ${GOLD} 45%, #A86E12)`, boxShadow: `0 0 30px ${GOLD}66` }}>
            <div style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 64, color: INK, marginTop: -6 }}>i</div>
          </div>
          <div>
            <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 34, color: CREAM }}>@officialillumine</div>
            <div style={{ fontFamily: SANS, fontWeight: 500, fontSize: 24, color: "rgba(255,247,234,0.6)", marginTop: 4 }}>UK personal finance</div>
          </div>
        </div>
        <div style={{ marginTop: 22, height: 74, borderRadius: 18, display: "grid", placeItems: "center", transform: `scale(${1 - 0.06 * press})`, background: pressed > 0.5 ? "rgba(255,255,255,0.1)" : `linear-gradient(180deg, ${GOLD_PALE}, ${GOLD})`, border: pressed > 0.5 ? "1.5px solid rgba(255,255,255,0.25)" : "none", fontFamily: SANS, fontWeight: 800, fontSize: 34, color: pressed > 0.5 ? CREAM : INK }}>
          {pressed > 0.5 ? "Following ✓" : "Follow"}
        </div>
        <div style={{ overflow: "hidden", height: 90 * sub, opacity: sub }}>
          <div style={{ marginTop: 22, display: "flex", gap: 10, flexWrap: "wrap" }}>
            {["Personal finance", "Investing"].map((x) => (
              <div key={x} style={{ padding: "8px 18px", borderRadius: 999, border: `1.5px solid ${GOLD}88`, color: GOLD_PALE, fontFamily: SANS, fontWeight: 700, fontSize: 24 }}>{x}</div>
            ))}
          </div>
        </div>
      </div>
      {/* tap cursor */}
      <Abs style={{ left: lerp(520, 300, cursor), top: lerp(420, 196, cursor), opacity: win(t, T.drop - 0.2, tap + 0.6, 0.2, 0.3) }}>
        <div style={{ width: 54, height: 54, borderRadius: 27, background: "rgba(255,255,255,0.85)", transform: `scale(${1 - 0.25 * press})`, boxShadow: `0 0 0 ${18 * press}px rgba(255,255,255,0.25)` }} />
      </Abs>
    </Hero>
  );
};

/** "Stay invested." sign-off, then the end card over a freeze. */
export const EndCard = () => {
  const t = useCurrentFrame() / FPS;
  if (t < T.stay - 0.2) return null;
  const s = prog(t, T.stay - 0.1, 0.6, outExpo);
  const e = prog(t, T.endCard - 0.1, 0.5, outExpo);
  const rows: [string, string, string][] = [
    ["ISA", "flexible · tax-free growth", GOLD],
    ["SIPP", "tax relief · locked till 57", BLUE],
  ];
  return (
    <>
      <Abs style={{ inset: 0, background: `rgba(5,7,16,${0.72 * e})`, backdropFilter: e > 0.01 ? `blur(${e * 14}px)` : undefined }} />
      <Abs style={{ left: 0, right: 0, top: lerp(250, 520, e), textAlign: "center", opacity: s, transform: `scale(${lerp(0.9, 1, s)})`, filter: `blur(${(1 - s) * 10}px)` }}>
        <div style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 150, lineHeight: 1, ...metal("gold"), filter: "drop-shadow(0 10px 30px rgba(0,0,0,0.6))" }}>Stay invested.</div>
      </Abs>
      <Abs style={{ left: 120, right: 120, top: 760, opacity: e, transform: `translateY(${(1 - e) * 40}px)` }}>
        {rows.map(([k, v, c], i) => {
          const p = prog(t, T.endCard + 0.15 + i * 0.15, 0.5, outExpo);
          return (
            <div key={k} style={{ display: "flex", alignItems: "center", gap: 22, padding: "22px 0", borderTop: i ? "1px solid rgba(255,255,255,0.12)" : "none", opacity: p, transform: `translateX(${(1 - p) * 40}px)` }}>
              <div style={{ width: 150, fontFamily: SANS, fontWeight: 900, fontSize: 52, color: c }}>{k}</div>
              <div style={{ fontFamily: SANS, fontWeight: 600, fontSize: 36, color: CREAM }}>{v}</div>
            </div>
          );
        })}
        <div style={{ marginTop: 50, textAlign: "center", fontFamily: SANS, fontWeight: 800, fontSize: 40, color: CREAM, opacity: prog(t, T.endCard + 0.5, 0.4) }}>@officialillumine</div>
        <div style={{ marginTop: 14, textAlign: "center", fontFamily: MONO, fontSize: 20, letterSpacing: 2, color: "rgba(255,247,234,0.45)", opacity: prog(t, T.endCard + 0.6, 0.4) }}>GENERAL INFO, NOT FINANCIAL ADVICE</div>
      </Abs>
    </>
  );
};
