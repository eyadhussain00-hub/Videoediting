// Beats, part 3: scripts → the math (30,000 → 3 people → 0.01%) → no ceiling → your skill → CTA → end card (edit 92 s–end).
import { AbsoluteFill, Img, staticFile } from "remotion";
import { EMBER, EMBER_SOFT, FPS, GRAPHITE, INK, IVORY, PIP, T, at, end } from "./data";
import { pipAt } from "./base";
import { BehindType, Beat, Caret, Chip, Count, Kicker, Strike, Tick, Top, Well, pop, typed, useT, SANS, SERIF, MONO } from "./kit";
import { DmCard } from "./beats2";
import { Abs, IconArrowUp, IconPlay, IconUser, bump, enter, glass, inOutCubic, lerp, outExpo, paper, prog, rnd, spring } from "./ui";

export const Script = () => (
  <Beat a={at("claude", 4) - 0.1} b={end("buyers", 2) + 0.15}>
    {(p, q, t) => {
      const s = at("scripted");
      const lines = ["HOOK: The 3 numbers that decide your price", "Most coaches undercharge because…", "Here's what my best client paid…"];
      return (
        <Top top={140} style={enter(Math.min(1, p), q)}>
          <div style={{ ...paper, width: 900, padding: "26px 40px 30px", boxSizing: "border-box" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Kicker color="#B5471A">Script · video 14</Kicker>
              <Kicker color="#9A9184">Written by Claude</Kicker>
            </div>
            {lines.map((l, i) => {
              const st = s + 0.1 + i * 0.75;
              return (
                <div key={i} style={{ fontFamily: i ? SANS : SANS, fontWeight: i ? 500 : 800, fontSize: i ? 30 : 34, color: i ? "#4A433B" : INK, marginTop: 14, minHeight: 40, letterSpacing: -0.4 }}>
                  {typed(t, st, l, 46)}
                  {t > st && t < st + l.length / 46 + 0.1 && <Caret t={t} />}
                </div>
              );
            })}
            <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
              {[
                ["micro-specific", at("micro-specific")],
                ["micro-niche", at("micro-niche")],
                ["attracts buyers", at("buyers", 2)],
              ].map(([l, st], i) => (
                <div key={i} style={{ ...pop(t, st as number, 14), fontFamily: MONO, fontSize: 22, fontWeight: 700, padding: "10px 18px", borderRadius: 999, background: i === 2 ? EMBER : "#E7DFD2", color: i === 2 ? "#fff" : "#4A433B" }}>
                  #{l as string}
                </div>
              ))}
            </div>
          </div>
        </Top>
      );
    }}
  </Beat>
);

export const PerDay = () => (
  <Beat a={at("two") - 0.1} b={at("over") - 0.05}>
    {(p, q, t) => (
      <Top top={200} style={{ ...enter(Math.min(1, p), q), gap: 18, alignItems: "center" }}>
        <div style={{ ...glass, padding: "24px 34px", textAlign: "center" }}>
          <div style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 96, lineHeight: 1, color: EMBER_SOFT }}>2</div>
          <Kicker color={GRAPHITE} style={{ marginTop: 6 }}>Videos / day</Kicker>
        </div>
        <div style={{ ...pop(t, at("will") - 0.05), fontFamily: SERIF, fontSize: 80, color: EMBER }}>→</div>
        <div style={{ ...pop(t, at("1,000") - 0.1), ...glass, padding: "24px 34px", textAlign: "center" }}>
          <Count t={t} s={at("1,000") - 0.1} dur={0.8} to={1000} style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 96, lineHeight: 1, color: IVORY }} />
          <Kicker color={GRAPHITE} style={{ marginTop: 6 }}>Views / day</Kicker>
        </div>
      </Top>
    )}
  </Beat>
);

export const Month = () => (
  <Beat a={at("over") - 0.1} b={at("all", 4) + 0.05} fout={0.3}>
    {(p, q, t) => (
      <Top top={160} style={enter(Math.min(1, p), q)}>
        <div style={{ ...glass, width: 880, padding: "26px 40px 30px", boxSizing: "border-box" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <Kicker>Over a month</Kicker>
            <Kicker color={GRAPHITE}>listening to you</Kicker>
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 20, marginTop: 4 }}>
            <Count t={t} s={at("30,000") - 0.15} dur={1.1} to={30000} style={{ fontFamily: SANS, fontWeight: 850, fontSize: 130, letterSpacing: -6 }} />
            <span style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 64, color: EMBER_SOFT }}>people</span>
          </div>
          <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
            {Array.from({ length: 30 }, (_, i) => (
              <div key={i} style={{ flex: 1, height: 14, borderRadius: 4, background: prog(t, at("month") + i * 0.035, 0.1) > 0.5 ? EMBER : "rgba(255,240,225,0.12)" }} />
            ))}
          </div>
        </div>
      </Top>
    )}
  </Beat>
);

/** Takeover: 30,000 dots, three light up — 0.01% replaces a 9-to-5. The footage sits in a card below. */
export const Dots = () => {
  const t = useT();
  const k = pipAt(t);
  if (k <= 0) return null;
  const [a] = PIP[0];
  const three = at("three");
  const pct = at("0.01%");
  const job = at("9-to-5");
  const COLS = 40, ROWS = 15; // 600 dots, each = 50 people
  const lit = [143, 318, 451];
  const shown = prog(t, a + 0.1, 0.9);
  const dim = prog(t, three, 0.4);
  const big = spring(t, pct - 0.05, 2.2, 7);
  return (
    <AbsoluteFill style={{ opacity: Math.min(1, k * 1.6) }}>
      <AbsoluteFill style={{ background: `radial-gradient(ellipse 90% 55% at 50% 28%, #2A211B, ${INK} 75%)` }} />
      <Abs style={{ left: 70, top: 130, width: 940, display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <Kicker>
          <Count t={t} s={a} dur={0.8} to={30000} /> people
        </Kicker>
        <Kicker color={GRAPHITE}>1 dot = 50</Kicker>
      </Abs>
      <Abs style={{ left: 70, top: 190, width: 940, height: 352 }}>
        {Array.from({ length: COLS * ROWS }, (_, i) => {
          const x = (i % COLS) * (940 / COLS) + 940 / COLS / 2;
          const y = Math.floor(i / COLS) * (352 / ROWS) + 352 / ROWS / 2;
          const order = rnd(i * 3.1);
          const on = prog(t, a + 0.1 + order * 0.8, 0.2);
          const li = lit.indexOf(i);
          const L = li >= 0 ? spring(t, three + li * 0.12, 2.6, 7) : 0;
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: x - 5,
                top: y - 5,
                width: 10,
                height: 10,
                borderRadius: 5,
                background: li >= 0 && L > 0 ? EMBER : IVORY,
                opacity: on * (li >= 0 && L > 0 ? 1 : lerp(0.55, 0.16, dim)),
                transform: `scale(${li >= 0 && L > 0 ? lerp(1, 2.2, Math.min(1.1, L)) : 1})`,
                boxShadow: li >= 0 && L > 0 ? `0 0 0 ${8 * (1 + 0.3 * Math.sin(t * 6))}px rgba(255,106,43,0.25), 0 0 20px ${EMBER}` : undefined,
              }}
            />
          );
        })}
      </Abs>
      <Abs style={{ left: 0, right: 0, top: 590, textAlign: "center", opacity: shown }}>
        <div style={{ ...pop(t, three), fontFamily: SANS, fontWeight: 700, fontSize: 40, color: IVORY, letterSpacing: -0.5 }}>
          convert just <span style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 56, color: EMBER_SOFT }}>3 people</span>
        </div>
      </Abs>
      {t > pct - 0.1 && (
        <Abs style={{ left: 0, right: 0, top: 660, display: "flex", justifyContent: "center", alignItems: "center", gap: 30 }}>
          <div style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 190, lineHeight: 1, color: EMBER, transform: `scale(${lerp(0.6, 1, Math.min(1.05, big))})`, opacity: Math.min(1, big * 2), textShadow: `0 0 60px rgba(255,106,43,0.5)` }}>0.01%</div>
        </Abs>
      )}
      {t > job - 0.25 && (
        <Abs style={{ left: 0, right: 0, top: 880, display: "flex", justifyContent: "center", gap: 16 }}>
          <div style={{ ...pop(t, job - 0.2), position: "relative" }}>
            <Chip style={{ fontSize: 34, opacity: t > job + 0.5 ? 0.6 : 1 }}>
              <span style={{ position: "relative" }}>
                Your 9-to-5 income
                <Strike t={t} s={job + 0.45} />
              </span>
            </Chip>
          </div>
          <div style={pop(t, job + 0.55)}>
            <Chip accent style={{ fontSize: 34 }}>Replaced</Chip>
          </div>
        </Abs>
      )}
    </AbsoluteFill>
  );
};

export const Ceiling = () => (
  <Beat a={at("best") - 0.1} b={at("already", 2) - 0.05}>
    {(p, q, t) => {
      const crack = at("ceiling");
      const br = prog(t, crack + 0.1, 0.35, outExpo);
      const up = prog(t, crack + 0.05, 0.6, outExpo);
      return (
        <Top top={130} style={enter(Math.min(1, p), q)}>
          <div style={{ position: "relative", width: 940, height: 330 }}>
            {/* the ceiling: a dashed line that splits where the arrow breaks through */}
            {[-1, 1].map((d) => (
              <Abs key={d} style={{ top: 120, left: d < 0 ? 0 : 490 + br * 60, width: 450 - br * 60, height: 0, borderTop: `4px dashed ${GRAPHITE}`, transform: `rotate(${d * br * 7}deg)`, transformOrigin: d < 0 ? "0 0" : "100% 0" }} />
            ))}
            <Abs style={{ top: 82, left: 0 }}>
              <Kicker color={GRAPHITE} style={{ opacity: 1 - br }}>Ceiling</Kicker>
            </Abs>
            <Abs style={{ left: 470 - 40, top: lerp(250, -10, up), opacity: Math.min(1, up * 3) }}>
              <div style={{ width: 80, height: 80, borderRadius: 40, background: EMBER, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 0 40px ${EMBER}` }}>
                <IconArrowUp size={46} color="#fff" sw={2.6} />
              </div>
            </Abs>
            <Abs style={{ left: 0, right: 0, top: 170, textAlign: "center", opacity: prog(t, at("million", 2) - 0.2, 0.3) }}>
              <Count t={t} s={at("million", 2) - 0.2} dur={0.9} to={1000000} prefix="$" style={{ fontFamily: SANS, fontWeight: 850, fontSize: 112, letterSpacing: -5, color: IVORY }} />
              <span style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 64, color: EMBER_SOFT, marginLeft: 14 }}>/ month</span>
            </Abs>
          </div>
        </Top>
      );
    }}
  </Beat>
);

export const SkillTypes = () => (
  <Beat a={at("already", 2) - 0.1} b={at("selling", 2) - 0.1}>
    {(p, q, t) => (
      <Top top={160} style={{ ...enter(Math.min(1, p), q), flexDirection: "column", alignItems: "center", gap: 18 }}>
        <div style={{ ...pop(t, at("already", 2)), fontFamily: SERIF, fontStyle: "italic", fontSize: 64, color: IVORY }}>You already have one</div>
        <div style={{ display: "flex", gap: 16 }}>
          <div style={pop(t, at("job"))}>
            <Chip>Your job</Chip>
          </div>
          <div style={pop(t, at("hobby"))}>
            <Chip>A hobby</Chip>
          </div>
          <div style={pop(t, at("above"))}>
            <Chip accent>Above average</Chip>
          </div>
        </div>
      </Top>
    )}
  </Beat>
);

export const Payments = () => (
  <Beat a={at("selling", 2) - 0.1} b={at("as", 2) - 0.05}>
    {(p, q, t) => {
      const times = [at("people", 5), at("willing"), at("pay")];
      return (
        <Top top={130} style={{ ...enter(Math.min(1, p), q), flexDirection: "column", alignItems: "center", gap: 12 }}>
          {times.map((s, i) => (
            <div key={i} style={{ ...pop(t, s - 0.1, -30), ...glass, background: "linear-gradient(180deg, rgba(40,34,30,0.82), rgba(20,17,15,0.88))", width: 760 - i * 0, padding: "18px 26px", boxSizing: "border-box", borderRadius: 30, display: "flex", alignItems: "center", gap: 20 }}>
              <div style={{ width: 62, height: 62, borderRadius: 16, background: EMBER, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: SERIF, fontStyle: "italic", fontSize: 44, color: "#fff" }}>$</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 30, fontWeight: 750 }}>Payment received</div>
                <div style={{ fontSize: 24, color: GRAPHITE, marginTop: 2 }}>New client · high-ticket offer</div>
              </div>
              <div style={{ fontFamily: MONO, fontSize: 32, fontWeight: 700, color: EMBER_SOFT }}>+${["1,500", "2,000", "3,000"][i]}</div>
            </div>
          ))}
          <div style={{ ...pop(t, at("selling", 2) + 0.1), order: -1, marginBottom: 6 }}>
            <Kicker>Sell a high-ticket product on it</Kicker>
          </div>
        </Top>
      );
    }}
  </Beat>
);

export const Cta2 = () => <DmCard a={at("as", 2) - 0.1} b={T.endCard} save={at("save", 2)} prompt={at("prompt", 3)} top={160} />;
export const PromptWord = () => (
  <BehindType a={at("prompt", 3) - 0.1} b={T.endCard + 0.1} top={600} size={230} color={EMBER} italic>
    “prompt”
  </BehindType>
);

/** End card over a frozen, darkened last frame. */
export const EndCard = () => {
  const t = useT();
  const a = T.endCard;
  if (t < a - 0.3) return null;
  const k = prog(t, a - 0.3, 0.6, inOutCubic);
  const w = spring(t, a + 0.1, 2, 7);
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ background: `rgba(13,11,10,${0.82 * k})`, backdropFilter: `blur(${k * 24}px)` }} />
      <AbsoluteFill style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, opacity: k }}>
        <Kicker color={IVORY} style={{ fontSize: 28, letterSpacing: 8, ...pop(t, a) }}>Want the prompt?</Kicker>
        <div style={{ fontFamily: SANS, fontWeight: 750, fontSize: 70, color: IVORY, letterSpacing: -2, ...pop(t, a + 0.08) }}>DM me the word</div>
        <div style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 260, lineHeight: 1, color: EMBER, transform: `scale(${lerp(0.7, 1, Math.min(1.04, w))})`, opacity: Math.min(1, w * 2), textShadow: "0 0 80px rgba(255,106,43,0.45)" }}>PROMPT</div>
        <div style={{ display: "flex", gap: 16, marginTop: 30, ...pop(t, a + 0.35) }}>
          <Chip icon={<IconUser size={34} />} style={{ fontSize: 32 }}>@andrilance</Chip>
          <Chip accent style={{ fontSize: 32 }}>Save this video</Chip>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export const Behind3 = () => (
  <AbsoluteFill>
    <PromptWord />
  </AbsoluteFill>
);
export const Front3 = () => (
  <AbsoluteFill>
    <Script />
    <PerDay />
    <Month />
    <Ceiling />
    <SkillTypes />
    <Payments />
    <Cta2 />
  </AbsoluteFill>
);
void [Img, staticFile, FPS, Tick, Well, IconPlay, bump, paper, end];
