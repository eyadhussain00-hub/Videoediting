// Beats, part 1: hook → the gurus → "what I did changed my life forever" (edit 0–47 s).
import { AbsoluteFill } from "remotion";
import { EMBER, EMBER_SOFT, GRAPHITE, INK, IVORY, at, end } from "./data";
import { BehindType, Beat, Chip, Count, Kicker, Strike, Tick, Top, Well, pop, useT, SANS, SERIF, MONO } from "./kit";
import { Abs, IconBag, IconCap, IconCar, IconDumbbell, IconPlane, IconUser, enter, glass, inOutCubic, lerp, outExpo, paper, prog, spring } from "./ui";

/** Hook title: an ivory plate exactly over the source's own title pill (frames 0-102), $ counter, age chip. */
export const HookTitle = () => {
  const t = useT();
  const out = at("while") - 0.05;
  if (t > out + 0.4) return null;
  const q = prog(t, 3.43, 0.4, inOutCubic); // the source pill is gone from frame 103
  const settle = 1 - prog(t, 0, 0.6, outExpo);
  return (
    <Abs style={{ left: 64, top: 222, width: 952, height: 260, ...paper, borderRadius: 34, transform: `translateY(${-q * 60}px) scale(${1 + settle * 0.04 - q * 0.04})`, opacity: 1 - q, filter: q > 0 ? `blur(${q * 10}px)` : undefined, padding: "30px 46px", boxSizing: "border-box" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Kicker style={{ color: "#B5471A" }}>How I make</Kicker>
        <div style={{ ...pop(t, at("21")), fontFamily: MONO, fontSize: 24, fontWeight: 700, letterSpacing: 3, color: "#fff", background: EMBER, borderRadius: 999, padding: "8px 18px" }}>AT AGE 21</div>
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 18, marginTop: 4 }}>
        <Count t={t} s={0.15} dur={2.05} to={500000} prefix="$" style={{ fontFamily: SANS, fontWeight: 850, fontSize: 138, letterSpacing: -6, color: INK }} />
        <span style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 76, color: "#6E655A" }}>a year</span>
      </div>
    </Abs>
  );
};
export const Hook21 = () => <BehindType a={at("21") - 0.05} b={at("while") + 0.35} top={560} size={500} color="transparent" style={{ WebkitTextStroke: `4px ${EMBER}`, fontStyle: "normal", left: 640, right: -400, textAlign: "left" }}>21</BehindType>;

export const College = () => (
  <Beat a={at("go") - 0.15} b={at("now") - 0.05}>
    {(p, q, t) => (
      <Top top={190} style={{ gap: 22, ...enter(Math.min(1, p), q) }}>
        <div style={pop(t, at("college"))}>
          <Chip icon={<Well><IconCap size={38} /></Well>}>Full-time college</Chip>
        </div>
        <div style={pop(t, at("work"))}>
          <Chip icon={<Clock t={t} s={at("work")} />}>
            <span>
              <span style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 50, color: EMBER_SOFT }}>2–3 h</span> a day
            </span>
          </Chip>
        </div>
      </Top>
    )}
  </Beat>
);
const Clock = ({ t, s }: { t: number; s: number }) => {
  const k = prog(t, s, 0.9) * (2.5 / 24);
  const r = 26, c = 2 * Math.PI * r;
  return (
    <svg width={64} height={64} viewBox="0 0 64 64">
      <circle cx={32} cy={32} r={r} stroke="rgba(255,240,225,0.18)" strokeWidth={6} fill="none" />
      <circle cx={32} cy={32} r={r} stroke={EMBER} strokeWidth={6} fill="none" strokeDasharray={`${c * k} ${c}`} strokeLinecap="round" transform="rotate(-90 32 32)" />
    </svg>
  );
};

export const ThenNow = () => (
  <Beat a={at("now") - 0.05} b={at("travel") - 0.1}>
    {(p, q, t) => {
      const k = prog(t, at("now", 2), 0.6, inOutCubic);
      return (
        <Top top={200} style={enter(Math.min(1, p), q)}>
          <div style={{ ...glass, width: 820, padding: "30px 46px", boxSizing: "border-box" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <Kicker color={GRAPHITE}>A couple years ago</Kicker>
              <Kicker style={{ opacity: k }}>Now</Kicker>
            </div>
            <div style={{ position: "relative", height: 40, marginTop: 18 }}>
              <Abs style={{ left: 10, right: 10, top: 18, height: 4, background: "rgba(255,240,225,0.15)", borderRadius: 2 }} />
              <Abs style={{ left: 10, top: 18, height: 4, width: `calc(${k * 100}% - 20px)`, background: `linear-gradient(90deg, ${GRAPHITE}, ${EMBER})`, borderRadius: 2, boxShadow: `0 0 16px ${EMBER}` }} />
              <Abs style={{ left: 0, top: 10, width: 20, height: 20, borderRadius: 10, background: GRAPHITE }} />
              <Abs style={{ right: 0, top: 6, width: 28, height: 28, borderRadius: 14, background: EMBER, transform: `scale(${Math.min(1.2, spring(t, at("now", 2) + 0.5, 3, 8))})`, boxShadow: `0 0 26px ${EMBER}` }} />
            </div>
          </div>
        </Top>
      );
    }}
  </Beat>
);

const Tile = ({ icon, label, t, s, accent = false }: { icon: React.ReactNode; label: string; t: number; s: number; accent?: boolean }) => (
  <div style={{ ...pop(t, s, 50), ...glass, width: 250, height: 250, borderRadius: 40, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 18, ...(accent ? { border: `2px solid ${EMBER}` } : {}) }}>
    {icon}
    <div style={{ fontSize: 34, fontWeight: 650, letterSpacing: -0.5 }}>{label}</div>
  </div>
);
export const Freedom = () => (
  <Beat a={at("travel") - 0.12} b={at("complete") + 0.1} fout={0.35}>
    {(p, q, t) => (
      <Top top={160} style={{ gap: 26, opacity: 1 - q, transform: `translateY(${-q * 80}px)` }}>
        <Tile t={t} s={at("travel")} icon={<IconPlane size={84} />} label="Travel" />
        <Tile t={t} s={at("buy")} icon={<IconBag size={84} />} label="Buy anything" />
        <Tile t={t} s={at("dream")} icon={<IconCar size={84} color={EMBER} />} label="Dream car" accent />
      </Top>
    )}
  </Beat>
);
/** Covers the source's own car-photo inset (src frames 344-368) with a card in the same spot. */
export const DreamCar = () => (
  <Beat a={at("dream") - 0.12} b={at("life") + 0.05} fin={0.2} fout={0.2}>
    {(p, q, t) => (
      <Abs style={{ left: 220, top: 1100, width: 640, height: 600, ...enter(Math.min(1, p), q, 30) }}>
        <div style={{ ...glass, background: "linear-gradient(160deg, rgba(36,30,26,0.97), rgba(13,11,10,0.98))", width: "100%", height: "100%", boxSizing: "border-box", padding: "34px 40px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <Kicker>Unlocked</Kicker>
          <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
            <IconCar size={110} color={EMBER} sw={1.4} />
            <div style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 82, lineHeight: 0.95 }}>Dream car</div>
          </div>
          <div style={{ height: 6, borderRadius: 3, background: "rgba(255,240,225,0.12)" }}>
            <div style={{ width: `${prog(t, at("dream"), 0.7) * 100}%`, height: 6, borderRadius: 3, background: EMBER }} />
          </div>
        </div>
      </Abs>
    )}
  </Beat>
);
export const FreedomWord = () => <BehindType a={at("complete") - 0.05} b={at("promise") + 0.1} top={120} size={250}>freedom.</BehindType>;

export const Social = () => (
  <Beat a={at("i've") - 0.1} b={at("this", 4) - 0.1}>
    {(p, q, t) => (
      <Top top={200} style={enter(Math.min(1, p), q)}>
        <div style={{ ...glass, padding: "30px 44px", width: 820, boxSizing: "border-box" }}>
          <Kicker color={GRAPHITE}>Talent check</Kicker>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 14 }}>
            <div style={{ position: "relative", fontSize: 46, fontWeight: 700, letterSpacing: -1, opacity: t > at("don't") ? 0.45 : 1 }}>
              Good with social media
              <Strike t={t} s={at("don't")} />
            </div>
            <div style={pop(t, at("be") + 0.05)}>
              <div style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 50, color: EMBER_SOFT }}>optional</div>
            </div>
          </div>
        </div>
      </Top>
    )}
  </Beat>
);

export const Gym = () => (
  <Beat a={at("this", 4) - 0.1} b={end("gym") + 0.05} fout={0.2}>
    {(p, q, t) => {
      const s0 = at("learned");
      return (
        <Top top={200} style={enter(Math.min(1, p), q)}>
          <div style={{ ...glass, padding: "30px 44px", width: 820, boxSizing: "border-box", display: "flex", gap: 30, alignItems: "center" }}>
            <Well size={96} accent>
              <IconDumbbell size={60} color="#fff" sw={2.2} />
            </Well>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 58, lineHeight: 1 }}>A learned skill</div>
              <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
                {[0, 1, 2, 3, 4, 5].map((i) => {
                  const on = prog(t, s0 + 0.15 + i * 0.22, 0.12);
                  return <div key={i} style={{ flex: 1, height: 16, borderRadius: 8, background: on > 0 ? `rgba(255,106,43,${0.35 + 0.65 * on})` : "rgba(255,240,225,0.12)", boxShadow: on > 0.5 ? `0 0 12px ${EMBER}` : undefined }} />;
                })}
              </div>
              <Kicker color={GRAPHITE} style={{ marginTop: 14, fontSize: 19 }}>
                Reps → results
              </Kicker>
            </div>
          </div>
        </Top>
      );
    }}
  </Beat>
);

export const Years = () => (
  <Beat a={at("spent") - 0.1} b={at("iman") - 0.1}>
    {(p, q, t) => (
      <Top top={190} style={enter(Math.min(1, p), q)}>
        <div style={{ ...glass, padding: "28px 50px", display: "flex", alignItems: "center", gap: 34 }}>
          <div style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 150, lineHeight: 0.9, color: EMBER_SOFT }}>3</div>
          <div>
            <div style={{ fontSize: 52, fontWeight: 750, letterSpacing: -1.5 }}>years</div>
            <div style={{ fontFamily: MONO, fontSize: 26, color: GRAPHITE, marginTop: 6 }}>
              <Count t={t} s={at("3") + 0.1} dur={1.8} to={1095} /> days of study
            </div>
          </div>
        </div>
      </Top>
    )}
  </Beat>
);

const Guru = ({ name, t, s }: { name: string; t: number; s: number }) => (
  <div style={{ ...pop(t, s, 40), ...glass, borderRadius: 30, width: 280, padding: "26px 0 24px", display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
    <div style={{ width: 96, height: 96, borderRadius: 48, background: "linear-gradient(160deg, #3A332D, #1A1613)", border: "1.5px solid rgba(255,240,225,0.25)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <IconUser size={54} color={GRAPHITE} />
    </div>
    <div style={{ fontSize: 42, fontWeight: 750, letterSpacing: -1 }}>{name}</div>
    <Kicker color={GRAPHITE} style={{ fontSize: 18 }}>Guru</Kicker>
  </div>
);
export const Gurus = () => (
  <Beat a={at("iman") - 0.12} b={at("bought") - 0.05}>
    {(p, q, t) => (
      <Top top={170} style={{ gap: 22, opacity: 1 - q, transform: `translateY(${-q * 40}px)` }}>
        <Guru name="Iman" t={t} s={at("iman")} />
        <Guru name="Brez" t={t} s={at("brez")} />
        <Guru name="TJR" t={t} s={at("tjr")} />
      </Top>
    )}
  </Beat>
);

export const Receipt = () => (
  <Beat a={at("bought") - 0.1} b={at("realized") - 0.05}>
    {(p, q, t) => {
      const rows = ["Iman — course", "Brez — course", "TJR — course"];
      return (
        <Top top={150} style={enter(Math.min(1, p), q)}>
          <div style={{ ...paper, width: 700, padding: "28px 44px 26px", boxSizing: "border-box", borderRadius: 18, transform: "rotate(-1.5deg)" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <Kicker color="#B5471A">Receipt</Kicker>
              <Kicker color="#9A9184">Courses</Kicker>
            </div>
            {rows.map((r, i) => (
              <div key={i} style={{ ...pop(t, at("all") + i * 0.16, 14), display: "flex", justifyContent: "space-between", fontFamily: MONO, fontSize: 30, marginTop: 14, color: INK }}>
                <span>{r}</span>
                <span>PAID</span>
              </div>
            ))}
            <div style={{ borderTop: "2px dashed #C9BFAF", marginTop: 18, paddingTop: 14, display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <span style={{ fontFamily: MONO, fontSize: 26, color: "#6E655A" }}>TOTAL</span>
              <span style={{ ...pop(t, at("struggle")), fontFamily: SERIF, fontStyle: "italic", fontSize: 52, color: "#C2410C" }}>years of struggle</span>
            </div>
          </div>
        </Top>
      );
    }}
  </Beat>
);
export const SameThing = () => (
  <BehindType a={at("exact") - 0.1} b={at("each") + 0.05} top={110} size={170}>
    the exact
    <br />
    <span style={{ color: EMBER_SOFT }}>same thing.</span>
  </BehindType>
);

const Node = ({ label, t, s, last = false }: { label: string; t: number; s: number; last?: boolean }) => {
  const on = prog(t, s, 0.25);
  return (
    <div style={{ ...pop(t, s - 0.25, 20), flex: "none", width: last ? 290 : 220, padding: "22px 0", borderRadius: 26, textAlign: "center", background: on > 0 ? `rgba(255,106,43,${0.15 + 0.85 * on})` : "rgba(255,240,225,0.08)", border: `1.5px solid ${on > 0.5 ? "rgba(255,210,180,0.6)" : "rgba(255,240,225,0.18)"}`, boxShadow: on > 0.5 ? "0 18px 50px rgba(255,90,30,0.35)" : undefined, fontSize: last ? 34 : 36, fontWeight: 750, letterSpacing: -0.6, color: "#fff" }}>
      {label}
    </div>
  );
};
const Link = ({ t, s }: { t: number; s: number }) => (
  <div style={{ width: 44, height: 4, background: "rgba(255,240,225,0.15)", position: "relative", flex: "none" }}>
    <div style={{ position: "absolute", left: 0, top: 0, height: 4, width: `${prog(t, s, 0.35) * 100}%`, background: EMBER }} />
  </div>
);
export const Flow = () => (
  <Beat a={at("each") - 0.1} b={at("so") - 0.05}>
    {(p, q, t) => (
      <Top top={190} style={enter(Math.min(1, p), q)}>
        <div style={{ ...glass, padding: "28px 34px 30px", width: 960, boxSizing: "border-box" }}>
          <Kicker color={GRAPHITE} style={{ textAlign: "center", marginBottom: 20 }}>How they all make money</Kicker>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Node label="A skill" t={t} s={at("skill", 2)} />
            <Link t={t} s={at("monetized") - 0.2} />
            <Node label="Monetize" t={t} s={at("monetized")} />
            <Link t={t} s={at("high-ticket") - 0.2} />
            <Node label="High-ticket" t={t} s={at("high-ticket")} last />
          </div>
        </div>
      </Top>
    )}
  </Beat>
);

export const Without = () => (
  <Beat a={at("so") - 0.1} b={at("because") - 0.05}>
    {(p, q, t) => {
      const Row = ({ label, s }: { label: string; s: number }) => (
        <div style={{ ...pop(t, s - 0.2, 16), display: "flex", alignItems: "center", gap: 22, marginTop: 16 }}>
          <Tick t={t} s={s + 0.25} ok={false} />
          <div style={{ position: "relative", fontSize: 42, fontWeight: 700, letterSpacing: -1, opacity: t > s + 0.25 ? 0.55 : 1 }}>
            {label}
            <Strike t={t} s={s + 0.25} color={GRAPHITE} />
          </div>
        </div>
      );
      return (
        <Top top={170} style={enter(Math.min(1, p), q)}>
          <div style={{ ...glass, padding: "28px 44px 32px", width: 820, boxSizing: "border-box" }}>
            <div style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 52, lineHeight: 1 }}>The same, but without…</div>
            <Row label="Dancing on TikTok" s={at("dancing")} />
            <Row label="Being an expert" s={at("expert")} />
          </div>
        </Top>
      );
    }}
  </Beat>
);
export const Teach = () => (
  <BehindType a={at("what", 3) - 0.05} b={at("changed") - 0.05} top={380} size={760} color="transparent" italic style={{ WebkitTextStroke: `4px ${EMBER}`, left: 620, right: -400, textAlign: "left" }}>
    ?
  </BehindType>
);
export const Forever = () => (
  <BehindType a={at("changed") - 0.08} b={end("forever") + 0.25} top={110} size={170}>
    changed my
    <br />
    <span style={{ color: EMBER_SOFT }}>life forever.</span>
  </BehindType>
);

export const Behind1 = () => (
  <AbsoluteFill>
    <Hook21 />
    <FreedomWord />
    <SameThing />
    <Teach />
    <Forever />
  </AbsoluteFill>
);
export const Front1 = () => (
  <AbsoluteFill>
    <HookTitle />
    <College />
    <ThenNow />
    <Freedom />
    <DreamCar />
    <Social />
    <Gym />
    <Years />
    <Gurus />
    <Receipt />
    <Flow />
    <Without />
  </AbsoluteFill>
);
void IVORY;
void lerp;
