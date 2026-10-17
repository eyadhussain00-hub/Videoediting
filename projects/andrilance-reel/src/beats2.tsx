// Beats, part 2: the AI system → step 1 (prompt) → CTA → step 2 (topics, buyers not viewers, quality) (edit 47–98 s).
import { AbsoluteFill } from "remotion";
import { COVER, EMBER, EMBER_SOFT, GRAPHITE, INK, IVORY, at, end } from "./data";
import { BehindType, Beat, Caret, Chip, Count, Kicker, Strike, Tick, Top, Well, pop, typed, useT, SANS, SERIF, MONO } from "./kit";
import { Abs, IconBookmark, IconPlay, IconSend, IconSpark, IconUser, enter, glass, inOutCubic, lerp, outExpo, paper, prog, spring } from "./ui";

export const AISystem = () => (
  <Beat a={at("put") - 0.1} b={at("combined") - 0.05}>
    {(p, q, t) => {
      const k = prog(t, at("majority"), 0.9, inOutCubic);
      return (
        <Top top={190} style={enter(Math.min(1, p), q)}>
          <div style={{ ...glass, padding: "28px 44px 32px", width: 860, boxSizing: "border-box" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <IconSpark size={38} />
              <div style={{ fontSize: 46, fontWeight: 750, letterSpacing: -1.2 }}>My AI system</div>
            </div>
            <div style={{ display: "flex", height: 64, borderRadius: 18, overflow: "hidden", marginTop: 22, background: "rgba(255,240,225,0.08)" }}>
              <div style={{ width: `${k * 82}%`, background: `linear-gradient(90deg, #FF8A55, ${EMBER})`, display: "flex", alignItems: "center", paddingLeft: 22, boxSizing: "border-box", fontFamily: MONO, fontSize: 26, fontWeight: 700, color: "#fff", whiteSpace: "nowrap", overflow: "hidden" }}>
                AI · {Math.round(k * 82)}%
              </div>
              <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "flex-end", paddingRight: 22, fontFamily: MONO, fontSize: 26, color: GRAPHITE }}>ME · {100 - Math.round(k * 82)}%</div>
            </div>
            <Kicker color={GRAPHITE} style={{ marginTop: 16, fontSize: 19 }}>Share of the work</Kicker>
          </div>
        </Top>
      );
    }}
  </Beat>
);

export const Combine = () => (
  <Beat a={at("combined") - 0.1} b={at("step") - 0.05}>
    {(p, q, t) => {
      const m = prog(t, at("did", 3), 0.55, inOutCubic);
      const Card = ({ side, s, icon, title, sub }: { side: -1 | 1; s: number; icon: React.ReactNode; title: string; sub: string }) => (
        <div style={{ ...pop(t, s, 30), transform: `${pop(t, s, 30).transform} translateX(${side * -m * 120}px)`, opacity: Math.min(1, prog(t, s - 0.03, 0.14)) * (1 - m), ...glass, width: 400, padding: "26px 30px", boxSizing: "border-box", display: "flex", alignItems: "center", gap: 20 }}>
          <Well size={78}>{icon}</Well>
          <div>
            <div style={{ fontSize: 40, fontWeight: 750, letterSpacing: -1 }}>{title}</div>
            <div style={{ fontFamily: MONO, fontSize: 20, color: GRAPHITE, marginTop: 4, letterSpacing: 1 }}>{sub}</div>
          </div>
        </div>
      );
      return (
        <Top top={200} style={enter(Math.min(1, p), q)}>
          <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 20 }}>
            <Card side={-1} s={at("claude")} icon={<IconSpark size={44} />} title="Claude" sub="AI ASSISTANT" />
            <div style={{ fontFamily: SERIF, fontSize: 80, color: EMBER, opacity: (t > at("with", 4) ? 1 : 0) * (1 - m) }}>+</div>
            <Card side={1} s={at("agent")} icon={<IconPlay size={44} color={EMBER_SOFT} />} title="Free AI agent" sub="FOUND ON YOUTUBE" />
            {m > 0 && (
              <Abs style={{ left: 0, right: 0, top: 0, bottom: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ ...pop(t, at("did", 3) + 0.35), }}>
                  <Chip accent icon={<IconSpark size={40} color="#fff" />} style={{ fontSize: 46, padding: "24px 44px 24px 30px" }}>
                    One AI system
                  </Chip>
                </div>
              </Abs>
            )}
          </div>
        </Top>
      );
    }}
  </Beat>
);
export const Step1 = () => (
  <BehindType a={at("step") - 0.08} b={at("copy") + 0.1} top={110} size={420} font={SERIF} color={EMBER} ls={-20}>
    <div style={{ fontFamily: MONO, fontStyle: "normal", fontSize: 54, letterSpacing: 18, color: IVORY, marginBottom: -40 }}>STEP</div>
    01
  </BehindType>
);

/** Opaque takeover: the prompt pasted into a chat (hides the source's own screenshot of it). */
export const Paste = () => {
  const [a, b] = COVER[0];
  return (
    <Beat a={a} b={b + 0.3} fin={0.3} fout={0.35}>
      {(p, q, t) => {
        const paste = spring(t, at("pasted") - 0.05, 2.2, 7);
        const sent = prog(t, at("claude", 2) + 0.1, 0.45, inOutCubic);
        const bg = Math.min(prog(t, a, 0.22), 1 - q);
        return (
          <AbsoluteFill>
            <AbsoluteFill style={{ background: `radial-gradient(ellipse 80% 60% at 50% 35%, #2A211B, ${INK})`, opacity: bg }} />
            <Abs style={{ left: 70, top: 230, width: 940, height: 900, ...paper, background: "#F7F3EC", borderRadius: 40, overflow: "hidden", ...enter(Math.min(1, p), q, 60) }}>
              <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "30px 40px", borderBottom: "1.5px solid #E5DDD0" }}>
                <IconSpark size={40} color="#D97757" />
                <div style={{ fontFamily: SERIF, fontSize: 48, color: INK }}>Claude</div>
                <div style={{ marginLeft: "auto", fontFamily: MONO, fontSize: 20, color: "#9A9184", letterSpacing: 2 }}>NEW CHAT</div>
              </div>
              {/* the pasted prompt: rises from the composer into the thread */}
              <Abs style={{ left: 40, right: 40, top: lerp(470, 120, sent), opacity: Math.min(1, paste * 1.4) }}>
                <div style={{ marginLeft: lerp(0, 120, sent), background: sent > 0.5 ? "#EDE6DA" : "#fff", border: "1.5px solid #E2D9CB", borderRadius: 26, padding: "26px 30px", transform: `scale(${lerp(0.9, 1, Math.min(1, paste))})`, transformOrigin: "50% 100%" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ fontFamily: SANS, fontWeight: 750, fontSize: 32, color: INK }}>High-ticket offer prompt</div>
                    <div style={{ fontFamily: MONO, fontSize: 18, color: "#fff", background: "#C2410C", borderRadius: 8, padding: "4px 10px" }}>PASTED</div>
                  </div>
                  {[0.94, 0.88, 0.97, 0.7, 0.9, 0.82, 0.6].map((w, i) => (
                    <div key={i} style={{ height: 14, width: `${w * 100}%`, borderRadius: 7, background: "#D9D0C2", marginTop: i ? 14 : 22 }} />
                  ))}
                  <div style={{ fontFamily: MONO, fontSize: 20, color: "#9A9184", marginTop: 18 }}>1,248 words</div>
                </div>
              </Abs>
              {/* composer */}
              <Abs style={{ left: 30, right: 30, bottom: 30, height: 120, borderRadius: 30, background: "#fff", border: "1.5px solid #E2D9CB", display: "flex", alignItems: "center", padding: "0 30px", boxSizing: "border-box" }}>
                <div style={{ fontFamily: SANS, fontSize: 30, color: "#9A9184" }}>{paste > 0.3 && sent < 0.5 ? "" : "Reply to Claude…"}</div>
                <div style={{ marginLeft: "auto", width: 66, height: 66, borderRadius: 18, background: sent > 0 ? "#C2410C" : "#D97757", display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${1 - 0.15 * Math.sin(Math.min(1, sent * 3) * Math.PI)})` }}>
                  <IconSend size={34} color="#fff" sw={2.2} />
                </div>
              </Abs>
              {/* cursor */}
              <Abs style={{ left: lerp(700, 870, prog(t, at("copy"), 0.7, outExpo)) - (sent > 0 ? 0 : 0), top: lerp(560, 805, prog(t, at("into", 1) - 0.25, 0.4, inOutCubic)), opacity: 1 - prog(t, at("claude", 2) + 0.5, 0.2) }}>
                <svg width="44" height="44" viewBox="0 0 24 24">
                  <path d="M4 2l14 9-6.5 1.4L15 20l-3 1.4-3.6-7.6L4 18z" fill={INK} stroke="#fff" strokeWidth={1.4} />
                </svg>
              </Abs>
            </Abs>
          </AbsoluteFill>
        );
      }}
    </Beat>
  );
};

export const Interview = () => (
  <Beat a={at("it", 3) + 0.1} b={at("packaged") - 0.15}>
    {(p, q, t) => {
      const Q = ({ s, text }: { s: number; text: string }) => (
        <div style={{ ...pop(t, s, 20), display: "flex", gap: 16, alignItems: "flex-start", marginTop: 16 }}>
          <IconSpark size={34} />
          <div style={{ background: "rgba(255,240,225,0.1)", borderRadius: "6px 26px 26px 26px", padding: "16px 24px", fontSize: 34, fontWeight: 550, letterSpacing: -0.4 }}>
            {typed(t, s, text, 40)}
            {t < s + text.length / 40 + 0.2 && <Caret t={t} />}
          </div>
        </div>
      );
      return (
        <Top top={170} style={enter(Math.min(1, p), q)}>
          <div style={{ ...glass, padding: "26px 36px 30px", width: 900, boxSizing: "border-box" }}>
            <Kicker>Claude is interviewing you</Kicker>
            <Q s={at("interviewed")} text="What do people come to you for?" />
            <Q s={at("couple", 2)} text="What results have you got them?" />
          </div>
        </Top>
      );
    }}
  </Beat>
);

export const Package = () => (
  <Beat a={at("packaged") - 0.1} b={at("every", 2) - 0.05}>
    {(p, q, t) => {
      const fly = prog(t, at("into", 2) - 0.05, 0.5, inOutCubic);
      const card = spring(t, at("into", 2) + 0.3, 2.2, 7);
      const items: [string, number][] = [
        ["Skills", at("skills")],
        ["Knowledge", at("knowledge")],
        ["Expertise", at("expertise")],
      ];
      return (
        <Top top={150} style={{ ...enter(Math.min(1, p), q), flexDirection: "column", alignItems: "center" }}>
          <div style={{ display: "flex", gap: 16, height: 100 }}>
            {items.map(([l, s], i) => (
              <div key={l} style={{ ...pop(t, s, 20), transform: `${pop(t, s, 20).transform} translate(${(1 - i) * fly * 290}px, ${fly * 150}px) scale(${1 - fly * 0.5})`, opacity: Math.min(prog(t, s - 0.03, 0.14), 1 - fly) }}>
                <Chip>{l}</Chip>
              </div>
            ))}
          </div>
          {t > at("into", 2) + 0.25 && (
            <div style={{ ...paper, marginTop: -90, width: 720, padding: "30px 44px", boxSizing: "border-box", transform: `scale(${lerp(0.6, 1, Math.min(1.04, card))})`, opacity: Math.min(1, card * 2), display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <Kicker color="#B5471A">Your offer</Kicker>
                <div style={{ fontSize: 50, fontWeight: 800, letterSpacing: -1.6, marginTop: 6 }}>High-ticket product</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <Count t={t} s={at("$1,000")} dur={0.8} to={1000} prefix="$" style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 92, color: "#C2410C", lineHeight: 1 }} />
                <div style={{ ...pop(t, at("up")), fontFamily: MONO, fontSize: 22, color: "#6E655A", letterSpacing: 2 }}>AND UP ↑</div>
              </div>
            </div>
          )}
        </Top>
      );
    }}
  </Beat>
);
export const YourSkill = () => (
  <BehindType a={at("every", 2) - 0.08} b={at("if", 2) + 0.05} top={110} size={190}>
    your skill
    <br />
    <span style={{ color: EMBER_SOFT, fontFamily: SANS, fontStyle: "normal", fontWeight: 800, fontSize: 170, letterSpacing: -8 }}>= $</span>
  </BehindType>
);

/** Save + DM "PROMPT" card. */
export const DmCard = ({ a, b, save, prompt, top = 170 }: { a: number; b: number; save: number; prompt: number; top?: number }) => (
  <Beat a={a} b={b}>
    {(p, q, t) => {
      const saved = t > save;
      const sk = spring(t, save, 3, 8);
      const word = typed(t, prompt - 0.2, "PROMPT", 16);
      const sent = prog(t, prompt + 0.4, 0.3);
      return (
        <Top top={top} style={enter(Math.min(1, p), q)}>
          <div style={{ ...glass, width: 900, padding: "26px 34px", boxSizing: "border-box" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
              <div style={{ transform: `scale(${saved ? Math.min(1.25, sk) : 1})` }}>
                <IconBookmark size={60} color={saved ? EMBER : IVORY} fill={saved ? EMBER : "none"} />
              </div>
              <div style={{ fontSize: 40, fontWeight: 700, letterSpacing: -1 }}>{saved ? "Saved" : "Save this video"}</div>
              <div style={{ marginLeft: "auto" }}>
                <Tick t={t} s={save + 0.1} size={50} />
              </div>
            </div>
            <div style={{ height: 1.5, background: "rgba(255,240,225,0.14)", margin: "22px 0" }} />
            <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
              <div style={{ width: 64, height: 64, borderRadius: 32, background: "linear-gradient(160deg, #3A332D, #1A1613)", border: "1.5px solid rgba(255,240,225,0.25)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <IconUser size={36} color={GRAPHITE} />
              </div>
              <div style={{ flex: 1, height: 74, borderRadius: 37, border: "1.5px solid rgba(255,240,225,0.2)", display: "flex", alignItems: "center", padding: "0 28px", fontFamily: MONO, fontSize: 36, fontWeight: 700, letterSpacing: 4, color: word ? EMBER_SOFT : GRAPHITE }}>
                {word || <span style={{ fontFamily: SANS, fontWeight: 500, letterSpacing: 0, fontSize: 30 }}>Message…</span>}
                {t > prompt - 0.2 && sent < 1 && <Caret t={t} />}
              </div>
              <div style={{ width: 74, height: 74, borderRadius: 37, background: word.length === 6 ? EMBER : "rgba(255,240,225,0.1)", display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${1 + 0.18 * Math.sin(sent * Math.PI)})` }}>
                <IconSend size={36} color="#fff" sw={2.2} />
              </div>
            </div>
          </div>
        </Top>
      );
    }}
  </Beat>
);
export const Cta1 = () => <DmCard a={at("if", 2) - 0.1} b={at("now", 3) - 0.05} save={at("save")} prompt={at("prompt", 2)} />;

export const Step2 = () => (
  <BehindType a={at("now", 3) - 0.08} b={at("needed") - 0.05} top={110} size={420} font={SERIF} color={EMBER} ls={-20}>
    <div style={{ fontFamily: MONO, fontStyle: "normal", fontSize: 54, letterSpacing: 18, color: IVORY, marginBottom: -40 }}>STEP</div>
    02
  </BehindType>
);

export const Topics = () => (
  <Beat a={at("needed") - 0.1} b={at("i'm") - 0.05}>
    {(p, q, t) => {
      const ask = at("asked", 3);
      const text = "What topics should I talk about to attract my ideal client?";
      const ans = at("ideal");
      return (
        <Top top={150} style={enter(Math.min(1, p), q)}>
          <div style={{ ...glass, padding: "26px 36px 30px", width: 900, boxSizing: "border-box" }}>
            <Kicker>Step 2 · find buyers</Kicker>
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 16, opacity: t > ask - 0.1 ? 1 : 0 }}>
              <div style={{ background: EMBER, color: "#fff", borderRadius: "26px 26px 6px 26px", padding: "16px 24px", fontSize: 32, fontWeight: 600, maxWidth: 680, minHeight: 40 }}>
                {typed(t, ask, text, 30)}
              </div>
            </div>
            <div style={{ display: "flex", gap: 16, marginTop: 16, alignItems: "flex-start" }}>
              <div style={{ opacity: t > ans ? 1 : 0 }}>
                <IconSpark size={34} />
              </div>
              <div style={{ flex: 1 }}>
                {[0.86, 0.72, 0.8].map((w, i) => (
                  <div key={i} style={{ ...pop(t, ans + i * 0.18, 10), display: "flex", alignItems: "center", gap: 12, marginTop: i ? 12 : 4 }}>
                    <div style={{ width: 12, height: 12, borderRadius: 6, background: EMBER }} />
                    <div style={{ height: 16, width: `${w * 100}%`, borderRadius: 8, background: "rgba(255,240,225,0.22)" }} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Top>
      );
    }}
  </Beat>
);

export const BuyersViewers = () => (
  <Beat a={at("i'm") - 0.1} b={at("i've", 2) - 0.05}>
    {(p, q, t) => {
      const Side = ({ ok, title, sub, s }: { ok: boolean; title: string; sub: string; s: number }) => (
        <div style={{ ...pop(t, s - 0.15, 30), ...glass, width: 400, padding: "28px 30px", boxSizing: "border-box", ...(ok ? { border: `2px solid ${EMBER}`, boxShadow: "0 30px 70px rgba(255,90,30,0.25)" } : {}) }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Kicker color={ok ? EMBER : GRAPHITE}>{sub}</Kicker>
            <Tick t={t} s={s + 0.2} ok={ok} size={48} />
          </div>
          <div style={{ position: "relative", fontFamily: ok ? SERIF : SANS, fontStyle: ok ? "italic" : "normal", fontSize: ok ? 92 : 64, fontWeight: ok ? 400 : 750, letterSpacing: ok ? -1 : -2, marginTop: 8, color: ok ? EMBER_SOFT : IVORY, opacity: ok ? 1 : t > s + 0.2 ? 0.5 : 1, display: "inline-block" }}>
            {title}
            {!ok && <Strike t={t} s={s + 0.2} color={GRAPHITE} />}
          </div>
        </div>
      );
      return (
        <Top top={190} style={{ ...enter(Math.min(1, p), q), gap: 22 }}>
          <Side ok={false} title="Viewers" sub="Going viral" s={at("viral")} />
          <Side ok title="Buyers" sub="The goal" s={at("buyers")} />
        </Top>
      );
    }}
  </Beat>
);

export const ViewsVsMoney = () => (
  <Beat a={at("i've", 2) - 0.1} b={at("it's") - 0.05}>
    {(p, q, t) => {
      const Row = ({ label, views, vw, mw, sv, sm, accent }: { label: string; views: number; vw: number; mw: number; sv: number; sm: number; accent: boolean }) => (
        <div style={{ marginTop: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <div style={{ fontSize: 30, fontWeight: 700, color: "#3A332D" }}>{label}</div>
            <Count t={t} s={sv} dur={0.7} to={views} suffix=" views" style={{ fontFamily: MONO, fontSize: 26, color: "#6E655A" }} />
          </div>
          <div style={{ height: 22, borderRadius: 11, background: "#E7DFD2", marginTop: 10, overflow: "hidden" }}>
            <div style={{ height: 22, width: `${prog(t, sv, 0.7) * vw * 100}%`, background: "#A39A8C", borderRadius: 11 }} />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 8 }}>
            <div style={{ height: 22, flex: "none", width: `${prog(t, sm, 0.7) * mw * 520}px`, background: accent ? `linear-gradient(90deg, #FF8A55, ${EMBER})` : "#C9BFAF", borderRadius: 11 }} />
            <div style={{ opacity: prog(t, sm + 0.4, 0.2), fontFamily: SERIF, fontStyle: "italic", fontSize: 40, color: accent ? "#C2410C" : "#9A9184" }}>{accent ? "$$$" : "$"}</div>
          </div>
        </div>
      );
      return (
        <Top top={140} style={enter(Math.min(1, p), q)}>
          <div style={{ ...paper, width: 880, padding: "28px 44px 32px", boxSizing: "border-box" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <Kicker color="#B5471A">Views vs. money</Kicker>
              <div style={{ display: "flex", gap: 16, fontFamily: MONO, fontSize: 18, color: "#6E655A" }}>
                <span>▬ VIEWS</span>
                <span style={{ color: "#C2410C" }}>▬ MONEY</span>
              </div>
            </div>
            <Row label="Viral video" views={3000000} vw={1} mw={0.18} sv={at("million")} sm={at("less")} accent={false} />
            <Row label="Niche video" views={3000} vw={0.04} mw={1} sv={at("3,000")} sm={at("3,000") + 0.3} accent />
          </div>
        </Top>
      );
    }}
  </Beat>
);
export const Quality = () => (
  <BehindType a={at("it's") - 0.08} b={at("claude", 4) + 0.1} top={110} size={240}>
    quality
    <div style={{ fontFamily: SANS, fontStyle: "normal", fontWeight: 700, fontSize: 80, letterSpacing: -2, color: GRAPHITE, marginTop: 30, textDecoration: "line-through", textDecorationColor: EMBER, textDecorationThickness: 6 }}>quantity</div>
  </BehindType>
);

export const Behind2 = () => (
  <AbsoluteFill>
    <Step1 />
    <YourSkill />
    <Step2 />
    <Quality />
  </AbsoluteFill>
);
export const Front2 = () => (
  <AbsoluteFill>
    <AISystem />
    <Combine />
    <Interview />
    <Package />
    <Cta1 />
    <Topics />
    <BuyersViewers />
    <ViewsVsMoney />
  </AbsoluteFill>
);
export const Cover2 = () => <Paste />;
void Strike;
void end;
void INK;
