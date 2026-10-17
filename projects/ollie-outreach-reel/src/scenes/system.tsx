import { useCurrentFrame } from "remotion";
import { CREAM, FPS, GOLD, GOLD_HI, MINT, T } from "../data";
import { MONO, SERIF } from "../fonts";
import { Abs, IconBolt, IconCheck, eyebrow, glass, goldText, lerp, outBack, outExpo, prog, spring, win } from "../ui";

// Chapter 04 in the pool-edge shot: his body fills the middle, the water below holds the numbers.
const E = () => T.always - 0.12;

const TIPS = [
  { label: "Stay consistent", t: () => T.stay },
  { label: "Don't give up", t: () => T.dont },
];

/** "Stay consistent, don't give up": two ticked rules, top left. */
export const Rules = () => {
  const t = useCurrentFrame() / FPS;
  const s = T.stay - 0.2;
  const e = T.track - 0.1;
  if (t < s || t > e + 0.3) return null;
  return (
    <Abs style={{ left: 70, top: 290, display: "flex", flexDirection: "column", gap: 14, opacity: win(t, s, e + 0.2, 0.15, 0.25) }}>
      {TIPS.map((r, i) => {
        const p = prog(t, r.t() - 0.15, 0.4, outBack);
        const tick = prog(t, r.t() + 0.15, 0.3, outExpo);
        if (t < r.t() - 0.15) return null;
        return (
          <div key={i} style={{ ...glass, borderRadius: 24, padding: "14px 26px 14px 16px", display: "flex", alignItems: "center", gap: 16, transform: `translateX(${(1 - p) * -60}px)`, opacity: Math.min(1, p * 2) }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, border: `2px solid ${MINT}`, background: `rgba(126,226,176,${tick})`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ transform: `scale(${tick})` }}>
                <IconCheck size={32} color="#0C2A1C" sw={3} />
              </div>
            </div>
            <span style={{ fontWeight: 700, fontSize: 38 }}>{r.label}</span>
          </div>
        );
      })}
    </Abs>
  );
};

/** "Aim to do like 100 outreach messages a day": a gold ring fills to 100. */
export const Hundred = () => {
  const t = useCurrentFrame() / FPS;
  const s = T.n100 - 0.3;
  const e = T.track - 0.12;
  if (t < s || t > e + 0.3) return null;
  const p = spring(t, s, 1.8, 7);
  const fill = prog(t, T.n100 - 0.2, 1.1, (x) => 1 - Math.pow(1 - x, 3));
  const R = 150;
  const C = 2 * Math.PI * R;
  return (
    <Abs style={{ left: 0, right: 0, top: 1110, display: "flex", justifyContent: "center", alignItems: "center", gap: 40, opacity: win(t, s, e + 0.2, 0.15, 0.25), transform: `scale(${lerp(0.7, 1, Math.min(1.08, p))})` }}>
      <div style={{ position: "relative", width: 2 * R + 40, height: 2 * R + 40 }}>
        <svg width={2 * R + 40} height={2 * R + 40} style={{ position: "absolute" }}>
          <defs>
            <linearGradient id="rg" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor={GOLD_HI} />
              <stop offset="1" stopColor="#B98A3E" />
            </linearGradient>
          </defs>
          <circle cx={R + 20} cy={R + 20} r={R} fill="rgba(10,11,14,0.55)" stroke="rgba(255,255,255,0.14)" strokeWidth={16} />
          <circle cx={R + 20} cy={R + 20} r={R} fill="none" stroke="url(#rg)" strokeWidth={16} strokeLinecap="round" strokeDasharray={`${C * fill} ${C}`} transform={`rotate(-90 ${R + 20} ${R + 20})`} style={{ filter: "drop-shadow(0 0 10px rgba(232,194,122,0.6))" }} />
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <div style={{ fontFamily: SERIF, fontSize: 150, lineHeight: "130px", ...goldText }}>{Math.round(fill * 100)}</div>
          <div style={{ ...eyebrow, fontSize: 22, color: CREAM }}>per day</div>
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 64, lineHeight: "64px", color: CREAM }}>outreach</div>
        <div style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 64, lineHeight: "64px", color: CREAM }}>messages</div>
        <div style={{ fontFamily: MONO, fontSize: 22, color: GOLD, marginTop: 10, opacity: prog(t, T.coaches2 - 0.1, 0.3) }}>→ coaches & businesses</div>
      </div>
    </Abs>
  );
};

const ROWS = [
  { name: "Opener A", sent: 100, rep: 4 },
  { name: "Opener B", sent: 100, rep: 17 },
  { name: "Opener C", sent: 100, rep: 9 },
];
const BEST = 1;

/** "Track every single outreach message … response percentage … narrow down what is getting you the best results". */
export const Tracker = () => {
  const t = useCurrentFrame() / FPS;
  const s = T.track - 0.15;
  const e = E();
  if (t < s || t > e + 0.3) return null;
  const card = spring(t, s, 1.6, 7);
  const sent = prog(t, T.saying2 - 0.1, T.sent - T.saying2 + 0.5, (x) => 1 - Math.pow(1 - x, 2));
  const rep = prog(t, T.sent, T.response - T.sent + 0.3, (x) => 1 - Math.pow(1 - x, 2));
  const rate = prog(t, T.response - 0.1, 0.6, outExpo);
  const narrow = prog(t, T.narrow, 0.5, outExpo);
  const best = spring(t, T.best - 0.05, 2.4, 7);
  const eff = prog(t, T.efficient - 0.2, 0.4, outBack);
  const col = (w: number) => ({ width: w, textAlign: "right" as const });
  return (
    <Abs style={{ left: 70, right: 70, top: 1070, opacity: win(t, s, e + 0.2, 0.18, 0.25), transform: `translateY(${(1 - Math.min(1, card)) * 120}px)` }}>
      <div style={{ ...glass, borderRadius: 36, padding: "24px 32px 18px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <span style={eyebrow}>Outreach tracker</span>
          <div style={{ display: "flex", alignItems: "center", gap: 8, opacity: eff, transform: `scale(${lerp(0.6, 1, eff)})` }}>
            <IconBolt size={28} color={GOLD} sw={2} />
            <span style={{ fontWeight: 700, fontSize: 26, color: GOLD }}>Most efficient</span>
          </div>
        </div>
        <div style={{ display: "flex", fontFamily: MONO, fontSize: 21, color: "rgba(251,244,232,0.5)", letterSpacing: 2, padding: "8px 16px" }}>
          <span style={{ flex: 1 }}>MESSAGE</span>
          <span style={col(130)}>SENT</span>
          <span style={col(150)}>REPLIES</span>
          <span style={col(160)}>RESPONSE</span>
        </div>
        {ROWS.map((r, i) => {
          const isBest = i === BEST;
          const dim = isBest ? 1 : lerp(1, 0.35, narrow);
          const g = isBest ? Math.min(1, best) : 0;
          const pct = Math.round((r.rep / r.sent) * 100 * rate);
          return (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                padding: "14px 16px",
                borderRadius: 18,
                marginTop: 6,
                opacity: dim * prog(t, s + 0.15 + i * 0.1, 0.3),
                background: g ? `rgba(232,194,122,${0.16 * g})` : "rgba(255,255,255,0.04)",
                border: `1.5px solid rgba(232,194,122,${0.7 * g})`,
                transform: `scale(${1 + 0.03 * g})`,
              }}
            >
              <span style={{ flex: 1, fontWeight: 700, fontSize: 34, display: "flex", alignItems: "center", gap: 12 }}>
                {r.name}
                {isBest && g > 0.05 && (
                  <span style={{ fontFamily: MONO, fontSize: 18, fontWeight: 700, color: "#17120A", background: GOLD, borderRadius: 8, padding: "3px 10px", opacity: g }}>BEST</span>
                )}
              </span>
              <span style={{ ...col(130), fontFamily: MONO, fontSize: 32 }}>{Math.round(r.sent * sent)}</span>
              <span style={{ ...col(150), fontFamily: MONO, fontSize: 32 }}>{Math.round(r.rep * rep)}</span>
              <span style={{ ...col(160), fontFamily: MONO, fontSize: 34, fontWeight: 700, color: isBest && g ? GOLD_HI : rate > 0 ? MINT : CREAM }}>{rate > 0 ? `${pct}%` : "—"}</span>
            </div>
          );
        })}
      </div>
    </Abs>
  );
};
