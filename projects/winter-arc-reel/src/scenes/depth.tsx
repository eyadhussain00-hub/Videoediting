import { AbsoluteFill, useCurrentFrame } from "remotion";
import { FPS, STEPS, T } from "../data";
import { MONO, SANS, SERIF } from "../fonts";
import { Abs, dawnText, iceText, inOutCubic, lerp, outCubic, outExpo, prog, rnd, win } from "../ui";
import { Plate, dawnAt } from "./base";

// The depth layer: background plate, then sky / light / type that sit *behind* the speaker, then the speaker
// himself (clean plate + rembg matte → fg.webm with alpha) on top, framed by the same camera.
// Free wall behind him: the full width above his head (y < ~560) and side columns (x < ~270, x > ~810)
// down to the shoulders. Type that runs into his head tucks behind it, which sells the depth.

/** How strongly the background is pushed back (dimmed) at time t. */
const dimAt = (t: number) => {
  const hook = (1 - prog(t, T.s1 - 0.2, 0.5)) * 0.42;
  const steps = Math.min(prog(t, T.s1 - 0.1, 0.4), 1 - prog(t, T.payoff - 0.2, 0.4)) * 0.4;
  const payoff = Math.min(prog(t, T.payoff - 0.1, 0.4), 1 - prog(t, T.offer + 0.3, 0.4)) * 0.6;
  const rest = prog(t, T.offer, 0.5) * 0.36;
  return Math.max(hook, steps * (1 - 0.5 * dawnAt(t)), payoff, rest, 0);
};

export const BgDim = () => {
  const t = useCurrentFrame() / FPS;
  return <AbsoluteFill style={{ background: `rgba(3,9,18,${dimAt(t)})` }} />;
};

/** Night sky over the wall during the night steps (Isha → Tahajjud): stars and a crescent. */
export const NightSky = () => {
  const t = useCurrentFrame() / FPS;
  const a = Math.min(prog(t, T.s1 - 0.1, 0.8), 1 - prog(t, T.s4 + 0.2, 1.4, inOutCubic));
  if (a <= 0) return null;
  const moonP = prog(t, T.s1, 1.2, outExpo);
  const moonA = 1 - win(t, T.s3 - 0.2, T.s4 + 0.3, 0.3, 0.3); // clear of the 04:00 clock
  return (
    <AbsoluteFill style={{ opacity: a }}>
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(6,18,40,0.78) 0%, rgba(8,26,54,0.55) 30%, rgba(8,26,54,0) 58%)" }} />
      {Array.from({ length: 70 }).map((_, i) => {
        const x = rnd(i * 3.1) * 1080;
        const y = rnd(i * 7.7) ** 1.4 * 900;
        const s = 1.5 + rnd(i * 1.3) * 3.2;
        const tw = 0.45 + 0.55 * Math.sin(t * (1.5 + rnd(i) * 3) + i);
        const birth = prog(t, T.s1 + rnd(i * 5) * 1.2, 0.4);
        return <Abs key={i} style={{ left: x, top: y, width: s, height: s, borderRadius: "50%", background: "#EAF6FF", opacity: tw * birth * (1 - y / 1100), boxShadow: `0 0 ${s * 3}px rgba(200,230,255,0.9)` }} />;
      })}
      {/* crescent: a lit disc with a darker disc offset over it */}
      <Abs style={{ left: 470, top: 250 + (1 - moonP) * 60, width: 150, height: 150, opacity: moonP * moonA, filter: "drop-shadow(0 0 40px rgba(190,225,255,0.65))" }}>
        <svg width="150" height="150" viewBox="0 0 150 150">
          <defs>
            <mask id="cres">
              <rect width="150" height="150" fill="white" />
              <circle cx="102" cy="58" r="58" fill="black" />
            </mask>
            <radialGradient id="mg" cx="40%" cy="45%">
              <stop offset="0" stopColor="#FFFFFF" />
              <stop offset="1" stopColor="#BFE3FF" />
            </radialGradient>
          </defs>
          <circle cx="75" cy="75" r="62" fill="url(#mg)" mask="url(#cres)" />
        </svg>
      </Abs>
    </AbsoluteFill>
  );
};

/** Sunrise behind him for Fajr → barakah: a warm horizon glow rising up the wall. */
export const Dawn = () => {
  const t = useCurrentFrame() / FPS;
  const d = dawnAt(t);
  if (d <= 0) return null;
  const rise = prog(t, T.s4, 3.5, outCubic);
  const burst = Math.min(prog(t, T.barakah - 0.1, 0.5), 1 - prog(t, T.s6 - 0.5, 0.6));
  return (
    <AbsoluteFill style={{ opacity: d, mixBlendMode: "screen" }}>
      <AbsoluteFill style={{ background: `radial-gradient(ellipse 90% 45% at 50% ${lerp(78, 44, rise)}%, rgba(255,170,90,0.75), rgba(255,120,60,0.35) 35%, rgba(255,90,40,0) 70%)` }} />
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(255,214,160,0.18), rgba(255,140,80,0))", opacity: rise }} />
      {/* barakah: god rays from behind his head */}
      <Abs
        style={{
          left: 540 - 1300,
          top: 520 - 1300,
          width: 2600,
          height: 2600,
          opacity: burst * 0.6,
          transform: `rotate(${t * 7}deg)`,
          background: "repeating-conic-gradient(from 0deg, rgba(255,214,150,0) 0deg, rgba(255,220,160,0.5) 4deg, rgba(255,214,150,0) 9deg, rgba(255,214,150,0) 16deg)",
          WebkitMaskImage: "radial-gradient(circle at 50% 50%, black 0%, rgba(0,0,0,0.6) 18%, transparent 46%)",
          maskImage: "radial-gradient(circle at 50% 50%, black 0%, rgba(0,0,0,0.6) 18%, transparent 46%)",
          filter: "blur(5px)",
        }}
      />
    </AbsoluteFill>
  );
};

/** Cold light rays behind him for the hook, the payoff and the CTA. */
export const Rays = () => {
  const t = useCurrentFrame() / FPS;
  const a = Math.max(
    (1 - prog(t, T.s1 - 0.3, 0.6)) * 0.85,
    Math.min(prog(t, T.ninety - 0.4, 0.8), 1 - prog(t, T.offer + 0.2, 0.5)),
    Math.min(prog(t, T.winterArc - 0.2, 0.6), 1 - prog(t, T.youGet, 0.5)) * 0.7,
    prog(t, T.cta - 0.1, 0.6) * 0.8,
  );
  if (a <= 0) return null;
  const burst = 1 + 0.6 * (t > T.unrec ? 1 - prog(t, T.unrec, 1) : 0);
  return (
    <Abs
      style={{
        left: 540 - 1300,
        top: 520 - 1300,
        width: 2600,
        height: 2600,
        opacity: a * 0.48 * burst,
        transform: `rotate(${-t * 8}deg)`,
        background: "repeating-conic-gradient(from 0deg, rgba(170,220,255,0) 0deg, rgba(190,230,255,0.45) 4deg, rgba(170,220,255,0) 9deg, rgba(170,220,255,0) 17deg)",
        WebkitMaskImage: "radial-gradient(circle at 50% 50%, black 0%, rgba(0,0,0,0.6) 18%, transparent 46%)",
        maskImage: "radial-gradient(circle at 50% 50%, black 0%, rgba(0,0,0,0.6) 18%, transparent 46%)",
        filter: "blur(5px)",
        mixBlendMode: "screen",
      }}
    />
  );
};

/** Falling snow. `front` = a few big, soft flakes in front of him (shallow depth of field). */
export const Snow = ({ front = false }: { front?: boolean }) => {
  const t = useCurrentFrame() / FPS;
  const n = front ? 9 : 90;
  // heavier on the hook, the payoff and the CTA; lighter (and warm-lit) at dawn
  const heavy = Math.max(1 - prog(t, T.s1, 1), Math.min(prog(t, T.unrec - 0.2, 0.4), 1 - prog(t, T.offer + 1, 1)), prog(t, T.cta - 0.3, 0.8));
  const amount = (0.55 + 0.45 * heavy) * (1 - 0.55 * dawnAt(t));
  const wind = 30 + 25 * Math.sin(t * 0.4);
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {Array.from({ length: n }).map((_, i) => {
        const k = i + (front ? 900 : 0);
        if (rnd(k + 9) > amount + 0.05) return null;
        const size = front ? 34 + rnd(k) * 50 : 3 + rnd(k) ** 2 * 11;
        const speed = front ? 160 + rnd(k + 1) * 90 : 50 + rnd(k + 1) * 120 + size * 6;
        const y = ((rnd(k + 4) * 2100 + t * speed) % 2100) - 90;
        const x = (((rnd(k + 2) * 1300 + t * wind * (0.5 + size / 14) + Math.sin(t * (0.6 + rnd(k + 3)) + k) * 30) % 1300) + 1300) % 1300 - 110;
        const op = front ? 0.32 : 0.35 + 0.55 * rnd(k + 6);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: y,
              width: size,
              height: size,
              borderRadius: "50%",
              background: front ? "radial-gradient(circle, rgba(240,250,255,0.85), rgba(220,240,255,0) 70%)" : "radial-gradient(circle, #FFFFFF 0%, rgba(230,245,255,0.75) 45%, rgba(220,240,255,0) 72%)",
              opacity: op,
              filter: front ? "blur(7px)" : size > 9 ? "blur(1.5px)" : undefined,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

/** Big type behind the speaker. */
export const BehindType = () => {
  const t = useCurrentFrame() / FPS;
  return (
    <>
      <HookNinety t={t} />
      {STEPS.map((s, i) => (t >= s.s - 0.2 && t < s.e + 0.4 ? <StepType key={i} n={s.n} word={s.word} s={s.s} e={s.e} t={t} /> : null))}
      <AlarmDigits t={t} />
      <DayCounter t={t} />
      <VerticalWord t={t} word="BROTHERHOOD" s={T.brotherhood - 0.1} e={T.ihsan - 0.1} />
      <BigWinter t={t} />
    </>
  );
};

const HookNinety = ({ t }: { t: number }) => {
  if (t > T.s1 + 0.4) return null;
  const p = prog(t, 0, 0.9, outExpo);
  const out = prog(t, T.s1 - 0.25, 0.4, inOutCubic);
  const glow = 1 - prog(t, 0.1, 1.6);
  const lab = prog(t, 0.55, 0.5);
  return (
    <>
      <Abs
        style={{
          left: 0,
          right: 0,
          top: 40,
          textAlign: "center",
          fontFamily: SERIF,
          fontStyle: "italic",
          fontSize: 860,
          lineHeight: 1,
          letterSpacing: -30,
          ...iceText,
          opacity: p * (1 - out),
          transform: `translateY(${(1 - p) * 200 - out * 140}px) scale(${lerp(1.3, 1, p) * lerp(1, 1.06, t / 4)})`,
          transformOrigin: "50% 60%",
          filter: `blur(${(1 - p) * 20 + out * 12}px) drop-shadow(0 0 ${30 + 60 * glow}px rgba(160,215,255,${0.35 + 0.35 * glow}))`,
          paddingRight: 40,
        }}
      >
        90
      </Abs>
      <Abs style={{ left: 0, right: 0, top: 58, textAlign: "center", fontFamily: MONO, fontWeight: 700, fontSize: 28, letterSpacing: 14, color: "rgba(225,242,255,0.9)", opacity: lab * (1 - out) }}>
        DAYS LEFT THIS YEAR
      </Abs>
    </>
  );
};

const StepType = ({ n, word, s, e, t }: { n: number; word: string; s: number; e: number; t: number }) => {
  const exit = prog(t, e - 0.28, 0.32, (x) => x * x);
  const warm = dawnAt(t) > 0.5;
  const txt = warm ? dawnText : iceText;
  const glowC = warm ? "rgba(255,190,110,0.35)" : "rgba(150,210,255,0.35)";
  const nump = prog(t, s - 0.06, 0.45, outExpo);
  const labp = prog(t, s + 0.25, 0.4);
  const letters = word.split("");
  const size = Math.min(200, 820 / (letters.length * 0.62));
  const showWord = n !== 3; // step 3 shows the alarm digits instead
  return (
    <>
      <Abs style={{ left: 34, top: 210, opacity: nump * (1 - exit) }}>
        <div
          style={{
            fontFamily: SERIF,
            fontStyle: "italic",
            fontSize: 250,
            lineHeight: 1,
            ...txt,
            transform: `translateY(${(1 - nump) * 80 - exit * 60}px)`,
            filter: `blur(${(1 - nump) * 12 + exit * 8}px) drop-shadow(0 0 30px ${glowC})`,
            paddingRight: 20,
          }}
        >
          0{n}
        </div>
        <div style={{ fontFamily: MONO, fontSize: 22, letterSpacing: 6, color: "rgba(225,242,255,0.75)", marginTop: 4, marginLeft: 12, opacity: labp }}>STEP / 06</div>
      </Abs>
      {showWord && (
        <Abs style={{ left: 1080 - 52 - size * 1.0, top: 150, writingMode: "vertical-rl", fontFamily: SANS, fontWeight: 800, fontSize: size, lineHeight: 1, letterSpacing: size * 0.04, whiteSpace: "nowrap" }}>
          {letters.map((ch, i) => {
            const p = prog(t, s + i * 0.04, 0.42, outCubic);
            const x = prog(t, e - 0.3 + i * 0.02, 0.28, (v) => v * v);
            return (
              <span
                key={i}
                style={{
                  display: "inline-block",
                  ...txt,
                  opacity: p * (1 - x) * 0.92,
                  transform: `translateY(${(1 - p) * -90 + x * 80}px)`,
                  filter: `blur(${(1 - p) * 10 + x * 8}px) drop-shadow(0 0 22px ${glowC})`,
                }}
              >
                {ch}
              </span>
            );
          })}
        </Abs>
      )}
    </>
  );
};

/** Step 3: "4 or 5 am" as big flip-clock digits above his head. */
const AlarmDigits = ({ t }: { t: number }) => {
  const a = win(t, T.s3 - 0.05, T.s4 + 0.1, 0.35, 0.3);
  if (a <= 0) return null;
  const hour = t < T.five - 0.05 ? "04" : "05";
  const flip = prog(t, T.five - 0.05, 0.22);
  const blink = Math.floor(t * 2) % 2 === 0 ? 1 : 0.25;
  const ring = t > T.four - 0.05 && t < T.tahajjud ? Math.sin(t * 90) * 3 * (1 - prog(t, T.four, 1.2)) : 0;
  return (
    <Abs style={{ left: 0, right: 50, top: 150, display: "flex", justifyContent: "flex-end", opacity: a, transform: `translateY(${(1 - prog(t, T.s3, 0.5, outExpo)) * 80}px) rotate(${ring}deg)` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, fontFamily: MONO, fontWeight: 700, fontSize: 200, lineHeight: 1, filter: "drop-shadow(0 0 40px rgba(150,210,255,0.45))" }}>
        <span style={{ ...iceText, display: "inline-block", transform: `scaleY(${t > T.five - 0.05 ? lerp(0.1, 1, flip) : 1})` }}>{hour}</span>
        <span style={{ ...iceText, opacity: blink }}>:</span>
        <span style={iceText}>00</span>
      </div>
      <Abs style={{ top: 220, left: 0, right: 0, textAlign: "right", fontFamily: MONO, fontSize: 26, letterSpacing: 14, color: "rgba(225,242,255,0.85)" }}>AM · BEFORE FAJR</Abs>
    </Abs>
  );
};

/** Payoff: "who you'd be in 90 days" — the day counter rolls 01 → 90 above his head. */
const DayCounter = ({ t }: { t: number }) => {
  const a = win(t, T.payoff - 0.1, T.unrec + 0.05, 0.4, 0.15);
  if (a <= 0) return null;
  const k = prog(t, T.payoff + 0.3, T.ninety + 0.45 - T.payoff - 0.3, inOutCubic);
  const day = Math.max(1, Math.round(k * 90));
  const done = prog(t, T.ninety + 0.45, 0.3);
  const lock = prog(t, T.locked, 0.18);
  return (
    <Abs style={{ left: 0, right: 0, top: 150, textAlign: "center", opacity: a }}>
      <div style={{ fontFamily: MONO, fontSize: 30, letterSpacing: 16, color: "rgba(225,242,255,0.9)" }}>DAY</div>
      <div
        style={{
          fontFamily: SERIF,
          fontStyle: "italic",
          fontSize: 420,
          lineHeight: 1,
          ...iceText,
          filter: `drop-shadow(0 0 ${30 + done * 40}px rgba(160,215,255,${0.4 + done * 0.3}))`,
          transform: `scale(${1 + done * 0.06 - lock * 0.03})`,
          paddingRight: 30,
        }}
      >
        {String(day).padStart(2, "0")}
      </div>
      {/* progress bar under the number */}
      <div style={{ margin: "0 auto", width: 520, height: 6, borderRadius: 3, background: "rgba(200,235,255,0.18)" }}>
        <div style={{ width: `${k * 100}%`, height: 6, borderRadius: 3, background: "linear-gradient(90deg, #8CCBF5, #FFFFFF)", boxShadow: "0 0 18px rgba(170,220,255,0.8)" }} />
      </div>
    </Abs>
  );
};

const VerticalWord = ({ t, word, s, e }: { t: number; word: string; s: number; e: number }) => {
  if (t < s - 0.1 || t > e + 0.5) return null;
  const letters = word.split("");
  const size = 118;
  return (
    <Abs style={{ left: 1080 - 40 - size, top: 90, writingMode: "vertical-rl", fontFamily: SANS, fontWeight: 800, fontSize: size, lineHeight: 1, letterSpacing: 4, whiteSpace: "nowrap" }}>
      {letters.map((ch, i) => {
        const p = prog(t, s + i * 0.035, 0.4);
        const x = prog(t, e - 0.2 + i * 0.02, 0.28, (v) => v * v);
        return (
          <span key={i} style={{ display: "inline-block", ...iceText, opacity: p * (1 - x) * 0.9, transform: `translateY(${(1 - p) * -80 + x * 70}px)`, filter: `blur(${(1 - p) * 10 + x * 8}px) drop-shadow(0 0 20px rgba(150,210,255,0.35))` }}>
            {ch}
          </span>
        );
      })}
    </Abs>
  );
};

/** CTA: giant WINTER behind him. */
const BigWinter = ({ t }: { t: number }) => {
  if (t < T.cta - 0.2) return null;
  const letters = "WINTER".split("");
  return (
    <Abs style={{ left: 0, right: 0, top: 150, textAlign: "center", fontFamily: SANS, fontWeight: 900, fontSize: 250, letterSpacing: 6, lineHeight: 1, whiteSpace: "nowrap" }}>
      {letters.map((ch, i) => {
        const p = prog(t, T.cta - 0.05 + i * 0.05, 0.5, outExpo);
        return (
          <span key={i} style={{ display: "inline-block", ...iceText, opacity: p, transform: `translateY(${(1 - p) * 120}px) scale(${lerp(1.4, 1, p)})`, filter: `blur(${(1 - p) * 14}px) drop-shadow(0 0 30px rgba(160,215,255,0.5))` }}>
            {ch}
          </span>
        );
      })}
      <div style={{ fontFamily: MONO, fontSize: 28, letterSpacing: 14, color: "rgba(225,242,255,0.9)", marginTop: 18, opacity: prog(t, T.cta + 0.5, 0.4) }}>COMMENT THE WORD</div>
    </Abs>
  );
};

/** The speaker on top of everything behind him. */
export const Person = () => <Plate src="fg.webm" transparent />;

