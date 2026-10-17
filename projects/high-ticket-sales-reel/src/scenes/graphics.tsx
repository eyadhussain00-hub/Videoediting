import type { ReactNode } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { FPS, GOLD, GOLD_DEEP, INK, MINT, RED, T } from "../data";
import { MONO, SANS, SERIF } from "../fonts";
import { Abs, Svg, bump, card, clamp01, glass, inOutCubic, lerp, outBack, outExpo, prog, rnd, spring, win } from "../ui";

// Every graphic lives in the clean wall band above his head (y ≈ 90-560) or floats on a dimmed frame, so the
// whiteboard he is drawing on stays readable underneath.

const useT = () => useCurrentFrame() / FPS;
const pop = (t: number, at: number) => clamp01(spring(t, at, 2.2, 7));

const Kicker = ({ children, color = GOLD }: { children: ReactNode; color?: string }) => (
  <div style={{ fontFamily: MONO, fontSize: 26, letterSpacing: 7, color, textTransform: "uppercase", fontWeight: 600 }}>{children}</div>
);

// ---------- icons
const IconBox = ({ size = 56, color = INK }) => (
  <Svg size={size} color={color} sw={1.9}>
    <path d="M3.5 7.5 12 3l8.5 4.5v9L12 21l-8.5-4.5z" />
    <path d="M3.5 7.5 12 12l8.5-4.5M12 12v9" />
  </Svg>
);
const IconGear = ({ size = 56, color = INK }) => (
  <Svg size={size} color={color} sw={1.9}>
    <circle cx="12" cy="12" r="3.2" />
    <path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1" />
  </Svg>
);
const IconGlobe = ({ size = 56, color = INK }) => (
  <Svg size={size} color={color} sw={1.9}>
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h18M12 3c2.6 2.8 3.8 5.8 3.8 9s-1.2 6.2-3.8 9c-2.6-2.8-3.8-5.8-3.8-9S9.4 5.8 12 3z" />
  </Svg>
);
const IconUser = ({ size = 56, color = INK }) => (
  <Svg size={size} color={color} sw={2}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21c.8-4.2 4-6.5 8-6.5s7.2 2.3 8 6.5" />
  </Svg>
);
const IconCal = ({ size = 56, color = INK }) => (
  <Svg size={size} color={color} sw={1.9}>
    <rect x="3.5" y="5" width="17" height="15.5" rx="3" />
    <path d="M3.5 10h17M8 3v4M16 3v4" />
    <path d="m9 15 2 2 4-4" />
  </Svg>
);
const IconPen = ({ size = 56, color = INK }) => (
  <Svg size={size} color={color} sw={1.9}>
    <path d="M4 20l1.2-4.6L15.6 5a2.1 2.1 0 0 1 3 3L8.2 18.4z" />
    <path d="M13.8 6.8l3 3M3 21.5h8" />
  </Svg>
);
const Check = ({ p, size = 52, color = MINT }: { p: number; size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="11" fill={color} opacity={clamp01(p * 3)} transform={`scale(${lerp(0.6, 1, outBack(clamp01(p * 2)))})`} style={{ transformOrigin: "12px 12px" }} />
    <path d="m7 12.4 3.2 3.2L17.2 8.6" fill="none" stroke="#06140D" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={16} strokeDashoffset={16 * (1 - clamp01(p * 1.4 - 0.3))} />
  </svg>
);

// ---------- 1. hook: "What is HIGH TICKET SALES?" set big in the wall band, behind his head
export const HookTitle = () => {
  const t = useT();
  if (t > T.high2 + 0.4) return null;
  const out = prog(t, T.high2 - 0.15, 0.35, inOutCubic);
  const a = spring(t, 0.02, 2, 7);
  const b = spring(t, T.high1 - 0.05, 2, 7);
  const c = spring(t, T.sales1 - 0.06, 2.4, 6);
  return (
    <Abs style={{ left: 0, right: 0, top: 120, textAlign: "center", opacity: 1 - out, transform: `translateY(${-out * 80}px)`, filter: `blur(${out * 10}px)` }}>
      <div style={{ opacity: clamp01(a), transform: `translateY(${(1 - Math.min(1, a)) * 30}px)` }}>
        <Kicker>What is</Kicker>
      </div>
      <div style={{ fontFamily: SANS, fontWeight: 900, fontSize: 168, letterSpacing: -7, lineHeight: "160px", color: "#fff", marginTop: 14, opacity: clamp01(b * 1.5), transform: `scale(${lerp(1.3, 1, Math.min(1, b))})`, textShadow: "0 18px 60px rgba(0,0,0,0.45)" }}>
        HIGH TICKET
      </div>
      <div style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 190, lineHeight: "170px", color: GOLD, letterSpacing: -3, opacity: clamp01(c * 1.5), transform: `translateY(${(1 - Math.min(1, c)) * 60}px) rotate(${lerp(-6, -2, Math.min(1, c))}deg)`, textShadow: "0 12px 50px rgba(217,154,43,0.45)" }}>
        Sales?
      </div>
    </Abs>
  );
};

// ---------- 2. definition: product or service, sold online
const Chip = ({ t, at, icon, label, x, y }: { t: number; at: number; icon: ReactNode; label: string; x: number; y: number }) => {
  const p = pop(t, at);
  if (p <= 0) return null;
  return (
    <Abs style={{ left: x, top: y, ...card, borderRadius: 30, padding: "18px 30px 18px 22px", display: "flex", alignItems: "center", gap: 16, opacity: clamp01(p * 2), transform: `translateY(${(1 - p) * 40}px) scale(${lerp(0.7, 1, p)})` }}>
      {icon}
      <span style={{ fontSize: 52, fontWeight: 800, letterSpacing: -1.5 }}>{label}</span>
    </Abs>
  );
};
export const Definition = () => {
  const t = useT();
  if (t < T.high2 - 0.2 || t > T.priced + 0.4) return null;
  const v = win(t, T.high2 - 0.1, T.priced + 0.3, 0.3, 0.35);
  return (
    <AbsoluteFill style={{ opacity: v, transform: `translateY(${(1 - v) * -30}px)` }}>
      <Abs style={{ left: 64, top: 128 }}>
        <Kicker>High ticket sale /ˈhaɪ ˈtɪkɪt/</Kicker>
      </Abs>
      <Chip t={t} at={T.product - 0.12} icon={<IconBox size={60} />} label="A product" x={64} y={196} />
      <Abs style={{ left: 470, top: 222, fontFamily: SERIF, fontStyle: "italic", fontSize: 72, color: "#fff", opacity: prog(t, T.service - 0.35, 0.2), textShadow: "0 6px 24px rgba(0,0,0,.5)" }}>or</Abs>
      <Chip t={t} at={T.service - 0.12} icon={<IconGear size={60} />} label="Service" x={600} y={196} />
      <Chip t={t} at={T.online - 0.12} icon={<IconGlobe size={60} color={GOLD_DEEP} />} label="sold online" x={300} y={340} />
    </AbsoluteFill>
  );
};

// ---------- 3. price: a counter that rolls to $1,000, then the "+" and an arrow going up
export const Price = () => {
  const t = useT();
  if (t < T.priced - 0.2 || t > T.s2 + 0.5) return null;
  const v = win(t, T.priced - 0.1, T.s2 + 0.35, 0.3, 0.35);
  const roll = prog(t, T.priced + 0.1, T.k1 + 0.25 - T.priced - 0.1, inOutCubic);
  const val = Math.round(roll * 1000);
  const plus = pop(t, T.upwards - 0.1);
  const land = bump(t - T.k1 - 0.15, 0.3);
  const rise = prog(t, T.upwards - 0.05, 0.9, outExpo);
  return (
    <AbsoluteFill style={{ opacity: v }}>
      <Abs style={{ left: 0, right: 0, top: 130, textAlign: "center" }}>
        <Kicker>Priced at</Kicker>
        <div style={{ display: "inline-flex", alignItems: "flex-start", marginTop: 10, transform: `scale(${1 + land * 0.08})` }}>
          <span
            style={{
              fontFamily: SANS,
              fontWeight: 900,
              fontSize: 230,
              letterSpacing: -10,
              lineHeight: "230px",
              fontVariantNumeric: "tabular-nums",
              background: "linear-gradient(180deg, #FFF1C2 0%, #F4C760 45%, #C9851D 100%)",
              WebkitBackgroundClip: "text",
              color: "transparent",
              filter: "drop-shadow(0 16px 40px rgba(217,154,43,0.45))",
            }}
          >
            ${val.toLocaleString("en-US")}
          </span>
          <span style={{ fontFamily: SANS, fontWeight: 900, fontSize: 170, color: GOLD, marginLeft: 8, lineHeight: "200px", opacity: clamp01(plus * 2), transform: `scale(${lerp(0.3, 1, plus)}) rotate(${(1 - plus) * 90}deg)`, display: "inline-block" }}>+</span>
        </div>
        <div style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 64, color: "#fff", marginTop: -6, opacity: plus, textShadow: "0 6px 24px rgba(0,0,0,.6)" }}>and upwards</div>
      </Abs>
      {/* gold sparks rising off the number */}
      {Array.from({ length: 22 }).map((_, i) => {
        const k = rise - rnd(i) * 0.3;
        if (k <= 0 || k >= 1) return null;
        return <Abs key={i} style={{ left: 200 + rnd(i + 9) * 680, top: 420 - k * (260 + rnd(i + 3) * 200), width: 8, height: 8, borderRadius: 4, background: GOLD, opacity: Math.sin(k * Math.PI), boxShadow: `0 0 14px ${GOLD}` }} />;
      })}
    </AbsoluteFill>
  );
};

// ---------- 4. human intervention: a price slider; past $1,000 checkout hands over to a human
export const Threshold = () => {
  const t = useT();
  if (t < T.s2 - 0.1 || t > T.most + 0.3) return null;
  const v = win(t, T.s2, T.most + 0.2, 0.35, 0.3);
  const knob = lerp(0.08, 0.86, prog(t, T.human1 - 0.2, T.plus - T.human1 + 0.3, inOutCubic));
  const crossed = knob > 0.55;
  const hp = pop(t, T.k2 + 0.05);
  const W = 860;
  return (
    <Abs style={{ left: 110, top: 118, width: W, opacity: v, transform: `translateY(${(1 - v) * -40}px)` }}>
      <Kicker>Why a human?</Kicker>
      <div style={{ ...glass, borderRadius: 36, marginTop: 18, padding: "34px 40px 38px", width: W }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontFamily: SANS, fontSize: 34, fontWeight: 700, color: "rgba(255,255,255,.75)" }}>
          <span>$97</span>
          <span style={{ color: GOLD }}>$1,000+</span>
        </div>
        <div style={{ position: "relative", height: 20, marginTop: 22, borderRadius: 10, background: "rgba(255,255,255,.14)" }}>
          <div style={{ position: "absolute", left: 0, width: `${knob * 100}%`, top: 0, bottom: 0, borderRadius: 10, background: crossed ? `linear-gradient(90deg, ${MINT}, ${GOLD})` : MINT }} />
          <div style={{ position: "absolute", left: "55%", top: -16, bottom: -16, width: 3, background: "rgba(255,255,255,.5)" }} />
          <div style={{ position: "absolute", left: `calc(${knob * 100}% - 22px)`, top: -12, width: 44, height: 44, borderRadius: 22, background: "#fff", boxShadow: "0 6px 18px rgba(0,0,0,.4)" }} />
        </div>
        <div style={{ display: "flex", gap: 22, marginTop: 34, alignItems: "center" }}>
          <div style={{ fontFamily: SANS, fontSize: 40, fontWeight: 700, color: crossed ? "rgba(255,255,255,.35)" : "#fff", textDecoration: crossed ? "line-through" : "none" }}>Buy now button</div>
          <div style={{ flex: 1 }} />
          <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 26px 12px 16px", borderRadius: 40, background: `linear-gradient(180deg, #FFE08A, ${GOLD} 55%, ${GOLD_DEEP})`, opacity: clamp01(hp * 2), transform: `scale(${lerp(0.6, 1, hp)})` }}>
            <IconUser size={50} color="#1A1203" />
            <span style={{ fontFamily: SANS, fontSize: 40, fontWeight: 900, color: "#1A1203", letterSpacing: -1 }}>A human</span>
          </div>
        </div>
      </div>
    </Abs>
  );
};

// ---------- 5. rationalize: a checkout he hovers over, doubts popping around it
const DOUBTS: [string, number, number, number][] = [
  ["Is it worth it?", 0, 600, 106],
  ["Can I afford this?", 1, 64, 470],
  ["Does it make sense?", 2, 520, 500],
];
export const Checkout = () => {
  const t = useT();
  if (t < T.most - 0.2 || t > T.so1 + 0.4) return null;
  const v = win(t, T.most - 0.1, T.so1 + 0.3, 0.35, 0.35);
  const inP = spring(t, T.most - 0.1, 1.8, 7.5);
  const hover = Math.sin(t * 5) * 6;
  const doubtAt = [T.rationalize - 0.2, T.rationalize + 0.35, T.sense - 0.3];
  return (
    <AbsoluteFill style={{ opacity: v }}>
      <Abs style={{ left: 170, top: 190, width: 740, ...card, padding: "36px 40px", transform: `translateY(${(1 - Math.min(1, inP)) * -80}px) rotate(-2deg)` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <span style={{ fontFamily: MONO, fontSize: 24, letterSpacing: 5, color: "#857F75" }}>CHECKOUT</span>
          <span style={{ fontFamily: MONO, fontSize: 24, color: "#857F75" }}>1 item</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginTop: 16 }}>
          <span style={{ fontSize: 44, fontWeight: 700, letterSpacing: -1 }}>Coaching program</span>
          <span style={{ fontSize: 60, fontWeight: 900, letterSpacing: -2 }}>$2,500</span>
        </div>
        <div style={{ marginTop: 26, height: 96, borderRadius: 24, background: INK, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 42, fontWeight: 800, letterSpacing: -0.5, transform: `scale(${1 - 0.03 * bump((t * 1.3) % 1, 0.3)})` }}>
          Pay now
        </div>
        {/* hesitant cursor */}
        <svg width="70" height="70" viewBox="0 0 24 24" style={{ position: "absolute", left: 470 + hover * 2, top: 210 + hover, filter: "drop-shadow(0 4px 8px rgba(0,0,0,.4))" }}>
          <path d="M5 3l14 8-6 1.5L10 19z" fill="#fff" stroke={INK} strokeWidth={1.5} strokeLinejoin="round" />
        </svg>
      </Abs>
      {DOUBTS.map(([txt, i, x, y]) => {
        const p = pop(t, doubtAt[i]);
        if (p <= 0) return null;
        return (
          <Abs key={i} style={{ left: x, top: y, ...glass, borderRadius: 30, padding: "16px 28px", fontFamily: SANS, fontSize: 42, fontWeight: 800, color: "#fff", letterSpacing: -1, opacity: clamp01(p * 2), transform: `scale(${lerp(0.5, 1, p)}) rotate(${(i - 1) * 3}deg) translateY(${Math.sin(t * 2 + i) * 6}px)` }}>
            <span style={{ color: GOLD, marginRight: 10 }}>?</span>
            {txt}
          </Abs>
        );
      })}
    </AbsoluteFill>
  );
};

// ---------- 6. the two jobs of the human: 01 qualify / right decision, 02 no buyer's remorse
const Row = ({ t, at, done, n, title, sub }: { t: number; at: number; done: number; n: string; title: string; sub: string }) => {
  const p = pop(t, at);
  if (p <= 0) return null;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 26, padding: "22px 0", borderTop: "1.5px solid rgba(0,0,0,.08)", opacity: clamp01(p * 2), transform: `translateX(${(1 - p) * -60}px)` }}>
      <span style={{ fontFamily: MONO, fontSize: 30, color: GOLD_DEEP, fontWeight: 700 }}>{n}</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 48, fontWeight: 800, letterSpacing: -1.4, lineHeight: "54px" }}>{title}</div>
        <div style={{ fontSize: 30, color: "#7A746B", fontWeight: 500, marginTop: 4 }}>{sub}</div>
      </div>
      <Check p={prog(t, done, 0.5)} size={64} />
    </div>
  );
};
export const Reasons = () => {
  const t = useT();
  if (t < T.so1 - 0.2 || t > T.they2 + 0.4) return null;
  const v = win(t, T.so1, T.they2 + 0.3, 0.3, 0.35);
  const inP = spring(t, T.so1, 1.8, 7.5);
  return (
    <Abs style={{ left: 64, top: 110, width: 952, ...card, padding: "30px 44px 18px", opacity: v, transform: `translateY(${(1 - Math.min(1, inP)) * -80}px)` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 6 }}>
        <IconUser size={40} color={GOLD_DEEP} />
        <span style={{ fontFamily: MONO, fontSize: 24, letterSpacing: 5, color: "#857F75" }}>THE HUMAN'S JOB</span>
      </div>
      <Row t={t} at={T.qualify - 0.15} done={T.one - 0.1} n="01" title="Qualify the prospect" sub="Is it the right decision for them?" />
      <Row t={t} at={T.two - 0.15} done={T.remorse} n="02" title="No buyer's remorse" sub="They stay sure after they pay" />
    </Abs>
  );
};

// ---------- 7. remorse: a paid receipt, then REFUND REQUESTED slams on it
export const Refund = () => {
  const t = useT();
  if (t < T.they2 - 0.2 || t > T.so3 + 0.4) return null;
  const v = win(t, T.they2 - 0.1, T.so3 + 0.3, 0.3, 0.35);
  const inP = spring(t, T.they2 - 0.1, 1.8, 7.5);
  const stamp = prog(t, T.back - 0.08, 0.16, outExpo);
  const shake = bump(t - T.back + 0.02, 0.25) * 10 + bump(t - T.scared, 0.3) * 8;
  const red = bump(t - T.scared + 0.1, 0.9) * 0.5;
  return (
    <AbsoluteFill style={{ opacity: v }}>
      <AbsoluteFill style={{ background: `radial-gradient(ellipse 80% 60% at 50% 30%, rgba(0,0,0,0) 40%, rgba(255,40,50,${red * 0.6}) 100%)` }} />
      <Abs style={{ left: 200, top: 120, width: 680, ...card, borderRadius: 18, padding: "34px 42px 40px", transform: `translateY(${(1 - Math.min(1, inP)) * -90}px) rotate(${2 + Math.sin(t * 70) * shake * 0.1}deg) translateX(${Math.sin(t * 80) * shake}px)` }}>
        <div style={{ fontFamily: MONO, fontSize: 24, letterSpacing: 5, color: "#857F75", textAlign: "center" }}>RECEIPT · #20491</div>
        <div style={{ borderTop: "2px dashed rgba(0,0,0,.18)", margin: "20px 0" }} />
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 40, fontWeight: 600 }}>
          <span>Program</span>
          <span>$2,500.00</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 40, fontWeight: 600, marginTop: 10, color: "#857F75" }}>
          <span>Status</span>
          <span style={{ color: stamp > 0.5 ? RED : "#1D9E62", fontWeight: 800 }}>{stamp > 0.5 ? "Disputed" : "Paid ✓"}</span>
        </div>
        <div style={{ borderTop: "2px dashed rgba(0,0,0,.18)", margin: "20px 0" }} />
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 46, fontWeight: 900 }}>
          <span>Total</span>
          <span>$2,500.00</span>
        </div>
        {stamp > 0 && (
          <Abs
            style={{
              left: 150,
              top: 150,
              padding: "10px 28px",
              border: `7px solid ${RED}`,
              borderRadius: 16,
              color: RED,
              background: "rgba(255,250,250,0.92)",
              fontFamily: SANS,
              fontWeight: 900,
              fontSize: 64,
              letterSpacing: 1,
              lineHeight: "70px",
              textAlign: "center",
              opacity: stamp * 0.95,
              transform: `rotate(-11deg) scale(${lerp(2.4, 1, stamp)})`,
            }}
          >
            REFUND
            <br />
            REQUESTED
          </Abs>
        )}
      </Abs>
    </AbsoluteFill>
  );
};

// ---------- 8. two sales roles: SETTER → CLOSER
const Role = ({ t, at, icon, name, job, x }: { t: number; at: number; icon: ReactNode; name: string; job: string; x: number }) => {
  const p = pop(t, at);
  if (p <= 0) return null;
  return (
    <Abs style={{ left: x, top: 230, width: 420, ...card, padding: "30px 32px 32px", opacity: clamp01(p * 2), transform: `translateY(${(1 - p) * 70}px) rotate(${(1 - p) * 8}deg)` }}>
      <div style={{ width: 92, height: 92, borderRadius: 26, background: `linear-gradient(180deg, #FFE08A, ${GOLD} 55%, ${GOLD_DEEP})`, display: "flex", alignItems: "center", justifyContent: "center" }}>{icon}</div>
      <div style={{ fontSize: 66, fontWeight: 900, letterSpacing: -2.5, marginTop: 20, lineHeight: "70px" }}>{name}</div>
      <div style={{ fontSize: 32, fontWeight: 500, color: "#7A746B", marginTop: 8 }}>{job}</div>
    </Abs>
  );
};
export const Roles = () => {
  const t = useT();
  if (t < T.so3 - 0.2 || t > T.endCard + 0.2) return null;
  const v = win(t, T.so3 - 0.1, T.endCard + 0.15, 0.3, 0.3);
  const head = pop(t, T.so3);
  const arrow = prog(t, T.closer - 0.35, 0.4, inOutCubic);
  return (
    <AbsoluteFill style={{ opacity: v }}>
      <Abs style={{ left: 0, right: 0, top: 110, textAlign: "center", opacity: clamp01(head * 2), transform: `translateY(${(1 - head) * -30}px)` }}>
        <span style={{ fontFamily: SANS, fontSize: 76, fontWeight: 900, color: "#fff", letterSpacing: -2.5, textShadow: "0 8px 30px rgba(0,0,0,.5)" }}>
          <span style={{ color: GOLD }}>2</span> sales roles
        </span>
      </Abs>
      <Role t={t} at={T.setter - 0.2} icon={<IconCal size={56} color="#1A1203" />} name="Setter" job="Qualifies & books the call" x={64} />
      <Role t={t} at={T.closer - 0.2} icon={<IconPen size={56} color="#1A1203" />} name="Closer" job="Runs the call, closes the deal" x={596} />
      <svg width="120" height="60" viewBox="0 0 120 60" style={{ position: "absolute", left: 480, top: 360, opacity: arrow }}>
        <path d="M10 30h90M84 14l18 16-18 16" fill="none" stroke={GOLD} strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={140} strokeDashoffset={140 * (1 - arrow)} />
      </svg>
    </AbsoluteFill>
  );
};

// ---------- end card
export const EndCard = () => {
  const t = useT();
  if (t < T.endCard - 0.15) return null;
  const a = prog(t, T.endCard - 0.15, 0.4);
  const b = spring(t, T.endCard + 0.05, 1.8, 7);
  const c = pop(t, T.endCard + 0.45);
  return (
    <AbsoluteFill style={{ background: `rgba(6,8,14,${0.72 * a})`, alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center", opacity: clamp01(b * 1.5), transform: `scale(${lerp(1.15, 1, Math.min(1, b))})` }}>
        <Kicker>Sales 101</Kicker>
        <div style={{ fontFamily: SANS, fontWeight: 900, fontSize: 130, letterSpacing: -5, color: "#fff", lineHeight: "130px", marginTop: 20 }}>HIGH TICKET</div>
        <div style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 150, color: GOLD, lineHeight: "140px", marginTop: -4 }}>Sales</div>
        <div style={{ display: "inline-flex", gap: 18, alignItems: "center", marginTop: 50, fontFamily: SANS, fontSize: 46, fontWeight: 800, color: "#fff", opacity: clamp01(c * 2), transform: `translateY(${(1 - c) * 30}px)` }}>
          <span style={{ ...glass, borderRadius: 40, padding: "12px 30px" }}>$1,000+</span>
          <span style={{ ...glass, borderRadius: 40, padding: "12px 30px" }}>Setter → Closer</span>
        </div>
        <div style={{ fontFamily: MONO, fontSize: 30, color: "rgba(255,255,255,.7)", marginTop: 40, letterSpacing: 2, opacity: c }}>@mousaibn3ssa</div>
      </div>
    </AbsoluteFill>
  );
};

/** Exposure flashes on the big beats. */
export const Flash = () => {
  const t = useT();
  const a = Math.max(0.8 * (1 - prog(t, 0, 0.3)), bump(t - T.k1 - 0.12, 0.2) * 0.3, bump(t - T.back + 0.02, 0.16) * 0.35, bump(t - T.endCard + 0.1, 0.3) * 0.35);
  if (a <= 0.005) return null;
  return <AbsoluteFill style={{ background: "#FFF6E4", opacity: a }} />;
};

/** Warm light sweeps on section changes. */
export const LightLeaks = () => {
  const t = useT();
  const LEAKS = [0.05, T.high2, T.priced, T.s2, T.most, T.so1, T.they2, T.so3, T.endCard - 0.1];
  return (
    <AbsoluteFill style={{ mixBlendMode: "screen", pointerEvents: "none" }}>
      {LEAKS.map((p, i) => {
        const k = (t - (p - 0.15)) / 0.8;
        if (k < 0 || k > 1) return null;
        const dir = i % 2 ? -1 : 1;
        const x = lerp(-500, 1580, inOutCubic(k));
        return (
          <Abs
            key={i}
            style={{
              left: dir > 0 ? x - 600 : 1080 - x - 600,
              top: -300 + rnd(i) * 700,
              width: 1200,
              height: 1500,
              opacity: Math.sin(k * Math.PI) * 0.32,
              background: "radial-gradient(ellipse 40% 50% at 50% 50%, rgba(255,214,140,0.95), rgba(255,170,60,0.4) 40%, rgba(255,150,40,0) 72%)",
              filter: "blur(40px)",
              transform: `rotate(${dir * 20}deg)`,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};
