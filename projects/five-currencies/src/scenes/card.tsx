import { useCurrentFrame } from "remotion";
import { CURRENCIES, FPS, GOLD, T, at } from "../data";
import { MONO, SANS, SERIF } from "../fonts";
import { Abs, ICONS, Star, glass, goldText, inOutCubic, lerp, outBack, outCubic, outExpo, prog, rnd, win } from "../ui";

const IdIcon = ICONS[1];
const LEFT = 90;
const TOP = 880;
const W = 900;
const STARTS = [T.time, T.identity, T.money, T.energy, T.reputation, T.proof];
const HEIGHTS = [460, 400, 440, 400, 440];

const sectionAt = (t: number) => {
  let i = 0;
  while (i + 1 < 5 && t >= STARTS[i + 1]) i++;
  return i;
};

/** One card carries the whole middle of the reel; header, height and content morph per currency. */
export const SectionCard = () => {
  const t = useCurrentFrame() / FPS;
  if (t < T.time - 0.3 || t > T.proof + 0.5) return null;
  const s = sectionAt(t);
  const inP = prog(t, T.time - 0.15, 0.4, outCubic);
  const outP = prog(t, T.proof - 0.05, 0.4, inOutCubic);
  const prevH = HEIGHTS[Math.max(0, s - 1)];
  const h = lerp(prevH, HEIGHTS[s], prog(t, STARTS[s], 0.4, inOutCubic));
  const sweep = prog(t, STARTS[s] - 0.02, 0.7, inOutCubic);
  const c = CURRENCIES[s];
  const Icon = ICONS[s];
  const hp = prog(t, STARTS[s], 0.35);
  return (
    <Abs
      style={{
        ...glass,
        left: LEFT,
        top: TOP,
        width: W,
        height: h,
        borderRadius: 44,
        overflow: "hidden",
        opacity: inP * (1 - outP),
        transform: `translateY(${(1 - inP) * 30 + outP * 40}px) scale(${1 - outP * 0.06})`,
        filter: `blur(${outP * 10}px)`,
      }}
    >
      {/* shine sweep on every section change */}
      <Abs style={{ left: lerp(-500, 1100, sweep), top: -200, width: 260, height: 900, transform: "rotate(18deg)", background: "linear-gradient(90deg, rgba(255,226,160,0), rgba(255,226,160,0.16), rgba(255,226,160,0))", opacity: sweep < 1 ? 1 : 0 }} />
      {/* header */}
      <Abs style={{ left: 40, top: 34, right: 40, height: 60, display: "flex", alignItems: "center", gap: 18 }}>
        <div style={{ width: 60, height: 60, borderRadius: 18, background: "linear-gradient(180deg,#FFE3A3,#E9B85C 55%,#C8902E)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 26px rgba(242,196,109,0.45)" }}>
          <Icon size={34} color="#1A1408" />
        </div>
        <div style={{ opacity: hp, transform: `translateY(${(1 - hp) * 14}px)` }}>
          <div style={{ fontFamily: MONO, fontSize: 19, letterSpacing: 4, color: GOLD }}>CURRENCY 0{c.n} / 05</div>
          <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 40, color: "#fff", letterSpacing: -1, marginTop: -2 }}>{c.name}</div>
        </div>
        <div style={{ flex: 1 }} />
        {CURRENCIES.map((_, k) => (
          <div key={k} style={{ width: k === s ? 44 : 12, height: 12, borderRadius: 6, background: k <= s ? GOLD : "rgba(255,255,255,0.18)", opacity: k === s ? 1 : 0.8 }} />
        ))}
      </Abs>
      <Abs style={{ left: 40, right: 40, top: 122, height: 1, background: "rgba(255,255,255,0.1)" }} />
      <Abs style={{ left: 0, top: 130, width: W, bottom: 0 }}>
        {[TimeBody, IdentityBody, MoneyBody, EnergyBody, ReputationBody].map((B, k) => {
          const a = win(t, STARTS[k] + 0.05, STARTS[k + 1] + 0.05, 0.3, 0.18);
          if (a <= 0) return null;
          return (
            <Abs key={k} style={{ inset: 0, opacity: a, transform: `translateY(${(1 - a) * 16}px)` }}>
              <B t={t} />
            </Abs>
          );
        })}
      </Abs>
    </Abs>
  );
};

const Big = ({ children, p, size = 88 }: { children: string; p: number; size?: number }) => (
  <div style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: size, lineHeight: 1, ...goldText, opacity: p, transform: `translateX(${(1 - p) * 30}px)`, filter: `blur(${(1 - p) * 6}px)`, paddingRight: 8 }}>{children}</div>
);

// 01 TIME: stopwatch that whips on "speed"; a winding route cut short by a straight gold line on "shortcut".
const TimeBody = ({ t }: { t: number }) => {
  const spin = t < T.speed ? (t - T.time) * 40 : (T.speed - T.time) * 40 + outExpo(Math.min(1, (t - T.speed) / 1.2)) * 1080;
  const sp = prog(t, T.speed, 0.35);
  const sc = prog(t, T.shortcut, 0.5, inOutCubic);
  const scP = prog(t, T.shortcut - 0.05, 0.35);
  const route = "M30 150 C 60 40, 130 40, 150 110 S 230 190, 260 90 S 330 20, 370 130";
  return (
    <>
      <Abs style={{ left: 50, top: 30 }}>
        <svg width="230" height="230" viewBox="0 0 230 230">
          <circle cx="115" cy="122" r="92" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.22)" strokeWidth="3" />
          <rect x="103" y="10" width="24" height="16" rx="4" fill={GOLD} />
          {Array.from({ length: 12 }).map((_, k) => {
            const a = (k / 12) * Math.PI * 2;
            return <line key={k} x1={115 + Math.sin(a) * 78} y1={122 - Math.cos(a) * 78} x2={115 + Math.sin(a) * 86} y2={122 - Math.cos(a) * 86} stroke="rgba(255,255,255,0.5)" strokeWidth="3" strokeLinecap="round" />;
          })}
          {/* motion trail when whipping */}
          {[1, 2, 3, 4, 5].map((k) => (
            <line key={k} x1="115" y1="122" x2={115 + Math.sin(((spin - k * 9 * sp * (1 - prog(t, T.speed + 0.9, 0.4))) * Math.PI) / 180) * 74} y2={122 - Math.cos(((spin - k * 9 * sp * (1 - prog(t, T.speed + 0.9, 0.4))) * Math.PI) / 180) * 74} stroke={GOLD} strokeWidth="5" strokeLinecap="round" opacity={0.16 * sp} />
          ))}
          <line x1="115" y1="122" x2={115 + Math.sin((spin * Math.PI) / 180) * 74} y2={122 - Math.cos((spin * Math.PI) / 180) * 74} stroke={GOLD} strokeWidth="5" strokeLinecap="round" />
          <circle cx="115" cy="122" r="8" fill={GOLD} />
        </svg>
      </Abs>
      <Abs style={{ left: 330, top: 26 }}>
        <Big p={sp}>Speed</Big>
      </Abs>
      <Abs style={{ left: 330, top: 128, opacity: scP }}>
        <svg width="420" height="140" viewBox="0 0 400 180">
          <path d={route} stroke="rgba(255,255,255,0.35)" strokeWidth="5" fill="none" strokeDasharray="4 14" strokeLinecap="round" />
          <line x1="30" y1="150" x2={lerp(30, 370, sc)} y2={lerp(150, 130, sc)} stroke={GOLD} strokeWidth="7" strokeLinecap="round" style={{ filter: "drop-shadow(0 0 8px rgba(242,196,109,0.8))" }} />
          <circle cx="30" cy="150" r="11" fill="#fff" />
          <circle cx="370" cy="130" r="13" fill={sc > 0.98 ? GOLD : "rgba(255,255,255,0.4)"} />
        </svg>
        <div style={{ fontFamily: MONO, fontSize: 21, letterSpacing: 4, color: "rgba(255,255,255,0.6)", marginTop: -14, marginLeft: 18 }}>SHORTCUT TO THE SOLUTION</div>
      </Abs>
    </>
  );
};

// 02 IDENTITY: a name tag whose title decodes through who they could become.
const TITLES = ["THE CUSTOMER", "THE OWNER", "THE LEADER", "THE EXPERT", "THE ONE WHO SAID YES"];
const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ#%&*/<>";
const IdentityBody = ({ t }: { t: number }) => {
  const k = Math.min(TITLES.length - 1, Math.max(0, Math.floor((t - at("identity", 2)) / 0.32)));
  const target = TITLES[k];
  const since = t - (at("identity", 2) + k * 0.32);
  const shown = target
    .split("")
    .map((ch, j) => (ch === " " || since * 34 > j ? ch : GLYPHS[Math.floor(rnd(j * 7 + Math.floor(t * 30)) * GLYPHS.length)]))
    .join("");
  const p = prog(t, T.identity + 0.05, 0.4, outBack);
  return (
    <Abs style={{ left: 50, top: 34, right: 50, height: 200, display: "flex", alignItems: "center", gap: 34 }}>
      <div style={{ width: 170, height: 170, borderRadius: 85, background: "radial-gradient(circle at 50% 35%, #3a3a40, #121214)", border: `3px solid ${GOLD}`, boxShadow: "0 0 40px rgba(242,196,109,0.35)", display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${p})` }}>
        <IdIcon size={110} color="rgba(255,255,255,0.85)" />
      </div>
      <div>
        <div style={{ fontFamily: MONO, fontSize: 20, letterSpacing: 4, color: "rgba(255,255,255,0.5)" }}>WHO THEY GET TO BE</div>
        <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 40, color: "#fff", marginTop: 12, letterSpacing: 1, whiteSpace: "nowrap" }}>{shown}</div>
        <div style={{ marginTop: 18, width: 420, height: 6, borderRadius: 3, background: "rgba(255,255,255,0.12)", overflow: "hidden" }}>
          <div style={{ width: `${((k + Math.min(1, since / 0.32)) / TITLES.length) * 100}%`, height: 6, background: GOLD }} />
        </div>
      </div>
    </Abs>
  );
};

// 03 MONEY: ROI line draws up; a cost line drops on "cost savings".
const MoneyBody = ({ t }: { t: number }) => {
  const pts = [0, 0.08, 0.05, 0.2, 0.17, 0.36, 0.33, 0.55, 0.62, 0.86, 1].map((v, i, a) => [40 + (i / (a.length - 1)) * 720, 250 - v * 200]);
  const draw = prog(t, at("money", 2) - 0.05, 1.7, inOutCubic);
  const n = Math.max(2, Math.ceil(draw * pts.length));
  const vis = pts.slice(0, n).map((p, i) => (i === n - 1 ? [lerp(pts[i - 1][0], p[0], (draw * (pts.length - 1)) % 1 || 1), lerp(pts[i - 1][1], p[1], (draw * (pts.length - 1)) % 1 || 1)] : p));
  const line = vis.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" ");
  const last = vis[vis.length - 1];
  const area = `${line} L${last[0]} 260 L40 260 Z`;
  const cost = prog(t, T.savings - 0.05, 0.8, inOutCubic);
  const roi = prog(t, T.ret, 0.4, outBack);
  return (
    <>
      <Abs style={{ left: 40, top: 20 }}>
        <svg width="820" height="280">
          <defs>
            <linearGradient id="ar" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="rgba(242,196,109,0.45)" />
              <stop offset="1" stopColor="rgba(242,196,109,0)" />
            </linearGradient>
          </defs>
          {[60, 120, 180, 240].map((y) => (
            <line key={y} x1="40" x2="760" y1={y} y2={y} stroke="rgba(255,255,255,0.07)" strokeWidth="2" />
          ))}
          <path d={`M40 70 C 260 80, 420 150, 760 ${lerp(70, 230, cost)}`} stroke="rgba(255,120,110,0.75)" strokeWidth="4" fill="none" strokeDasharray="10 10" opacity={cost} />
          <path d={area} fill="url(#ar)" />
          <path d={line} stroke={GOLD} strokeWidth="6" fill="none" strokeLinejoin="round" strokeLinecap="round" style={{ filter: "drop-shadow(0 0 10px rgba(242,196,109,0.7))" }} />
          <circle cx={last[0]} cy={last[1]} r={9 + 6 * Math.abs(Math.sin(t * 6))} fill="rgba(242,196,109,0.25)" />
          <circle cx={last[0]} cy={last[1]} r="8" fill="#fff" />
        </svg>
      </Abs>
      <Abs style={{ left: 70, top: 26, transform: `scale(${roi})`, transformOrigin: "left center", padding: "10px 22px", borderRadius: 16, background: "rgba(242,196,109,0.14)", border: "1.5px solid rgba(242,196,109,0.5)", fontFamily: MONO, fontSize: 24, fontWeight: 700, color: GOLD, letterSpacing: 2 }}>
        ↗ RETURN ON INVESTMENT
      </Abs>
      <Abs style={{ right: 60, top: 228, opacity: cost, fontFamily: MONO, fontSize: 22, color: "rgba(255,150,140,0.95)", letterSpacing: 3 }}>COSTS ↓</Abs>
    </>
  );
};

// 04 ENERGY: battery charges to full on "relief".
const EnergyBody = ({ t }: { t: number }) => {
  const charge = lerp(0.12, 1, prog(t, T.relief - 0.05, 0.7, inOutCubic));
  const full = charge > 0.97;
  const col = charge < 0.35 ? "#FF6B5E" : GOLD;
  const rp = prog(t, T.relief, 0.4);
  return (
    <Abs style={{ left: 60, top: 40, right: 60, display: "flex", alignItems: "center", gap: 44 }}>
      <div style={{ position: "relative", width: 320, height: 150, borderRadius: 30, border: "4px solid rgba(255,255,255,0.55)", padding: 10 }}>
        <div style={{ position: "absolute", right: -22, top: 48, width: 14, height: 46, borderRadius: 6, background: "rgba(255,255,255,0.55)" }} />
        <div style={{ width: `${charge * 100}%`, height: "100%", borderRadius: 20, background: charge < 0.35 ? col : "linear-gradient(90deg,#C8902E,#F2C46D,#FFE3A3)", boxShadow: full ? "0 0 40px rgba(242,196,109,0.8)" : "none" }} />
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: MONO, fontWeight: 700, fontSize: 44, color: charge > 0.5 ? "#1A1408" : "#fff" }}>{Math.round(charge * 100)}%</div>
      </div>
      <div>
        <div style={{ fontFamily: MONO, fontSize: 20, letterSpacing: 4, color: "rgba(255,255,255,0.5)", opacity: 1 - rp * 0.3 }}>THEY'RE BUYING</div>
        <Big p={rp} size={104}>Relief</Big>
      </div>
    </Abs>
  );
};

// 05 REPUTATION: stars fill, flash on "look", peers pop in on "peers".
const ReputationBody = ({ t }: { t: number }) => {
  const peers = at("front");
  return (
    <>
      <Abs style={{ left: 50, top: 30, display: "flex", alignItems: "center", gap: 30 }}>
        <div style={{ width: 130, height: 130, borderRadius: 65, background: "radial-gradient(circle at 50% 35%, #3a3a40, #121214)", border: `3px solid ${GOLD}`, boxShadow: `0 0 ${30 + 40 * prog(t, T.look, 0.2) * (1 - prog(t, T.look + 0.3, 0.8))}px rgba(242,196,109,0.6)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <IdIcon size={84} color="rgba(255,255,255,0.85)" />
        </div>
        <div>
          <div style={{ display: "flex", gap: 8 }}>
            {[0, 1, 2, 3, 4].map((k) => (
              <Star key={k} size={66} fill={prog(t, at("reputation", 2) + 0.15 + k * 0.1, 0.35, outBack)} />
            ))}
          </div>
          <div style={{ fontFamily: MONO, fontSize: 20, letterSpacing: 3, color: "rgba(255,255,255,0.6)", marginTop: 10, opacity: prog(t, at("solution", 2), 0.3) }}>THE SMART CHOICE — SEEN BY EVERYONE</div>
        </div>
      </Abs>
      <Abs style={{ left: 50, top: 190, display: "flex", alignItems: "center" }}>
        {[0, 1, 2, 3, 4, 5].map((k) => {
          const p = prog(t, peers + k * 0.06, 0.35, outBack);
          const hue = [28, 200, 340, 150, 260, 45][k];
          return (
            <div key={k} style={{ width: 84, height: 84, borderRadius: 42, marginLeft: k ? -18 : 0, border: "3px solid #141416", background: `linear-gradient(160deg, hsl(${hue} 30% 62%), hsl(${hue} 25% 30%))`, transform: `scale(${p})`, opacity: Math.min(1, p * 1.5), display: "flex", alignItems: "flex-end", justifyContent: "center", overflow: "hidden" }}>
              <div style={{ width: 44, height: 30, borderRadius: "22px 22px 0 0", background: "rgba(255,255,255,0.35)" }} />
            </div>
          );
        })}
        <div style={{ marginLeft: 24, fontFamily: SERIF, fontStyle: "italic", fontSize: 54, ...goldText, opacity: prog(t, T.peers, 0.35), paddingRight: 6 }}>in front of their peers</div>
      </Abs>
    </>
  );
};

// Notifications that pile up on "pulling their attention" and get blown away on "away".
const NOTES = [
  { app: "Mail", txt: "27 unread emails", x: 70, y: 800, r: -6 },
  { app: "Calendar", txt: "Meeting in 5 min", x: 520, y: 860, r: 5 },
  { app: "Phone", txt: "3 missed calls", x: 120, y: 1030, r: 4 },
  { app: "Slack", txt: "@you — urgent??", x: 470, y: 1080, r: -4 },
  { app: "Bank", txt: "Invoice overdue", x: 60, y: 1250, r: -3 },
  { app: "Tasks", txt: "Follow up (x12)", x: 520, y: 1300, r: 6 },
];
export const Notifications = () => {
  const t = useCurrentFrame() / FPS;
  if (t < T.pulling - 0.6 || t > T.away + 1) return null;
  const away = prog(t, T.away - 0.05, 0.55, (x) => x * x * x);
  return (
    <>
      {NOTES.map((n, k) => {
        const p = prog(t, T.pulling - 0.55 + k * 0.17, 0.32, outBack);
        if (p <= 0) return null;
        const jit = Math.sin(t * 22 + k) * 2 * (1 - away);
        const dx = away * (900 + k * 120) * (k % 2 ? 1 : -1);
        return (
          <Abs key={k} style={{ ...glass, left: n.x + dx, top: n.y + jit - away * 120, width: 470, height: 112, borderRadius: 28, transform: `rotate(${n.r + away * (k % 2 ? 25 : -25)}deg) scale(${p})`, opacity: 1 - prog(t, T.away + 0.3, 0.3), filter: `blur(${away * 14}px)`, display: "flex", alignItems: "center", gap: 18, padding: "0 22px", boxSizing: "border-box" }}>
            <div style={{ width: 62, height: 62, borderRadius: 16, background: ["#3B82F6", "#EF4444", "#22C55E", "#A855F7", "#F59E0B", "#64748B"][k], display: "flex", alignItems: "center", justifyContent: "center", fontFamily: SANS, fontWeight: 800, fontSize: 28, color: "#fff" }}>{n.app[0]}</div>
            <div>
              <div style={{ fontFamily: SANS, fontWeight: 600, fontSize: 22, color: "rgba(255,255,255,0.55)" }}>{n.app} · now</div>
              <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 32, color: "#fff", letterSpacing: -0.5 }}>{n.txt}</div>
            </div>
            <div style={{ position: "absolute", right: 18, top: 16, width: 30, height: 30, borderRadius: 15, background: "#FF3B30", fontFamily: SANS, fontWeight: 700, fontSize: 18, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>{k + 2}</div>
          </Abs>
        );
      })}
    </>
  );
};
