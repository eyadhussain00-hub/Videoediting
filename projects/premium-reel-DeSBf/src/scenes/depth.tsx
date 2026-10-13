import { AbsoluteFill, useCurrentFrame } from "remotion";
import { CHAPTERS, FPS, GOLD, T, isBroll } from "../data";
import { MONO, SANS, SERIF } from "../fonts";
import { Abs, goldText, inOutCubic, lerp, outCubic, outExpo, prog, rnd, win } from "../ui";
import { Plate } from "./base";

// The depth layer: background plate → dim / light / type that sit *behind* the speaker → the speaker
// (clean plate + rembg matte → fg.webm with alpha) on top, framed by the same camera.
// Free space behind him: the top band above his hair (y < ~170), a left column (x < ~250) and a right column
// (x > ~800) down to the shoulders (y ~ 760). Type running past the columns tucks behind his head.

const BEHIND: [number, number, number][] = [
  // [start, end, dim strength]
  [T.first - 0.1, T.three - 0.2, 0.42],
  ...CHAPTERS.map((c) => [c.s - 0.05, c.s + 4.2, 0.4] as [number, number, number]),
  [T.not - 0.1, 34.7, 0.4],
  [T.hundred - 0.5, T.ch3 - 0.1, 0.48],
  [T.attention - 0.2, 65.55, 0.5],
  [T.somebody - 0.2, T.end, 0.5],
];

export const BgDim = () => {
  const t = useCurrentFrame() / FPS;
  if (isBroll(t)) return null;
  const d = Math.max(0, ...BEHIND.map(([a, b, k]) => win(t, a, b, 0.35, 0.35) * k));
  return d > 0 ? <AbsoluteFill style={{ background: `rgba(10,7,4,${d})` }} /> : null;
};

/** Slow rotating light rays from behind his head. */
export const Rays = () => {
  const t = useCurrentFrame() / FPS;
  if (isBroll(t)) return null;
  const a = Math.max(win(t, T.first - 0.05, T.three, 0.5, 0.5) * 0.8, win(t, T.hundred - 0.3, T.ch3, 0.4, 0.4), win(t, T.let - 0.3, T.end, 0.6, 0.6));
  if (a <= 0) return null;
  const burst = 1 + 0.6 * (t > T.you ? 1 - prog(t, T.you, 1.2) : 0);
  return (
    <Abs
      style={{
        left: 540 - 1300, top: 430 - 1300, width: 2600, height: 2600, opacity: a * 0.5 * burst,
        transform: `rotate(${t * 8}deg)`,
        background: "repeating-conic-gradient(from 0deg, rgba(255,214,140,0) 0deg, rgba(255,214,140,0.42) 4deg, rgba(255,214,140,0) 9deg, rgba(255,214,140,0) 17deg)",
        WebkitMaskImage: "radial-gradient(circle at 50% 50%, black 0%, rgba(0,0,0,0.6) 18%, transparent 46%)",
        maskImage: "radial-gradient(circle at 50% 50%, black 0%, rgba(0,0,0,0.6) 18%, transparent 46%)",
        filter: "blur(5px)", mixBlendMode: "screen",
      }}
    />
  );
};

/** Gold bokeh dust. `front` = a few big, soft motes in front of him (shallow depth of field). */
export const Dust = ({ front = false }: { front?: boolean }) => {
  const t = useCurrentFrame() / FPS;
  const n = front ? 6 : 40;
  const boost = 0.55 + 0.9 * Math.max(win(t, T.first, T.three, 0.4, 0.6), win(t, T.hundred - 0.3, T.ch3, 0.3, 0.5), win(t, T.let - 0.4, T.end, 0.5, 0.5));
  return (
    <AbsoluteFill style={{ mixBlendMode: "screen", pointerEvents: "none" }}>
      {Array.from({ length: n }).map((_, i) => {
        const k = i + (front ? 500 : 0);
        const size = front ? 40 + rnd(k) * 70 : 3 + rnd(k) ** 2 * 16;
        const speed = front ? 18 + rnd(k + 1) * 20 : 10 + rnd(k + 1) * 34;
        const x = rnd(k + 2) * 1080 + Math.sin(t * (0.3 + rnd(k + 3)) + k) * 26;
        const y = (((rnd(k + 4) * 2100 - t * speed) % 2100) + 2100) % 2100 - 90;
        const tw = 0.55 + 0.45 * Math.sin(t * (1.2 + rnd(k + 5) * 2.5) + k * 3);
        const op = (front ? 0.14 : 0.2 + 0.45 * rnd(k + 6)) * tw * boost;
        return (
          <div key={i} style={{
            position: "absolute", left: x, top: y, width: size, height: size, borderRadius: "50%", opacity: Math.min(1, op),
            background: front ? "radial-gradient(circle, rgba(255,220,150,0.9), rgba(255,200,120,0) 70%)" : "radial-gradient(circle, #FFE7B0 0%, rgba(235,194,122,0.6) 45%, rgba(235,194,122,0) 72%)",
            filter: front ? "blur(6px)" : size > 12 ? "blur(2px)" : undefined,
          }} />
        );
      })}
    </AbsoluteFill>
  );
};

/** Gold display word that rises out of blur. */
const Big = ({ t, s, e, text, size, left, top, align = "left", exitUp = 80, glow = 0.35 }: {
  t: number; s: number; e: number; text: string; size: number; left: number; top: number; align?: "left" | "center"; exitUp?: number; glow?: number;
}) => {
  if (t < s - 0.1 || t > e + 0.5) return null;
  const p = prog(t, s - 0.04, 0.55, outExpo);
  const out = prog(t, e - 0.3, 0.4, inOutCubic);
  return (
    <Abs style={{ left, top, width: align === "center" ? 1080 - 2 * left : undefined, textAlign: align, whiteSpace: "nowrap" }}>
      <span style={{
        display: "inline-block", fontFamily: SERIF, fontStyle: "italic", fontSize: size, lineHeight: 1, ...goldText,
        opacity: p * (1 - out), paddingRight: size * 0.08,
        transform: `translateY(${(1 - p) * 160 - out * exitUp}px) scale(${lerp(1.18, 1, p)})`, transformOrigin: "50% 60%",
        filter: `blur(${(1 - p) * 16 + out * 10}px) drop-shadow(0 0 40px rgba(235,194,122,${glow}))`,
      }}>{text}</span>
    </Abs>
  );
};

/** Big type behind the speaker. */
export const BehindType = () => {
  const t = useCurrentFrame() / FPS;
  if (isBroll(t)) return null;
  return (
    <>
      {/* hook: "the FIRST" across the top, tucked behind his head */}
      <Abs style={{ left: 0, right: 0, top: 46, textAlign: "center", fontFamily: MONO, fontSize: 26, letterSpacing: 14, color: "rgba(255,240,215,0.85)", opacity: win(t, T.first + 0.1, T.three, 0.4, 0.3) }}>
        YOUR FAMILY'S
      </Abs>
      <Big t={t} s={T.first} e={T.three - 0.1} text="First" size={400} left={60} top={60} align="center" />
      {CHAPTERS.map((c, i) => (t >= c.s - 0.2 && t < c.s + 4.6 ? <ChapterType key={i} c={c} t={t} /> : null))}
      <Big t={t} s={T.not} e={34.75} text="≠" size={600} left={60} top={-110} align="center" glow={0.5} />
      <HundredX t={t} />
      <Cycle t={t} />
      <Big t={t} s={T.you} e={T.end + 1} text="You." size={420} left={40} top={0} align="center" glow={0.6} />
    </>
  );
};

const ChapterType = ({ c, t }: { c: (typeof CHAPTERS)[number]; t: number }) => {
  const e = c.s + 4.2;
  const exit = prog(t, e - 0.3, 0.35, (x) => x * x);
  const letters = c.word.split("");
  const size = Math.min(230, 980 / (letters.length * 0.62));
  const nump = prog(t, c.s - 0.06, 0.5, outExpo);
  const labp = prog(t, c.s + 0.3, 0.4);
  return (
    <>
      <Abs style={{ left: 26, top: 150, opacity: nump * (1 - exit) }}>
        <div style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 270, lineHeight: 1, ...goldText, paddingRight: 24,
          transform: `translateY(${(1 - nump) * 80 - exit * 60}px)`, filter: `blur(${(1 - nump) * 12 + exit * 8}px) drop-shadow(0 0 30px rgba(235,194,122,0.35))` }}>
          {c.n}
        </div>
        <div style={{ fontFamily: MONO, fontSize: 22, letterSpacing: 6, color: "rgba(255,240,215,0.7)", marginTop: 6, marginLeft: 12, opacity: labp }}>/ 03</div>
      </Abs>
      <Abs style={{ left: 1080 - 40 - size * 1.02, top: 150, writingMode: "vertical-rl", fontFamily: SERIF, fontStyle: "italic", fontSize: size, lineHeight: 1, whiteSpace: "nowrap" }}>
        {letters.map((ch, i) => {
          const p = prog(t, c.s + i * 0.045, 0.42, outCubic);
          const x = prog(t, e - 0.3 + i * 0.025, 0.28, (v) => v * v);
          return (
            <span key={i} style={{ display: "inline-block", ...goldText, opacity: p * (1 - x), paddingBottom: 4,
              transform: `translateY(${(1 - p) * -90 + x * 80}px)`, filter: `blur(${(1 - p) * 10 + x * 8}px) drop-shadow(0 0 22px rgba(235,194,122,0.3))` }}>
              {ch}
            </span>
          );
        })}
      </Abs>
      <Abs style={{ left: 1080 - 40 - size * 1.02 - 44, top: 156, writingMode: "vertical-rl", fontFamily: MONO, fontSize: 19, letterSpacing: 7, color: GOLD, opacity: labp * (1 - exit) * 0.9 }}>
        {c.label}
      </Abs>
    </>
  );
};

/** "×1 → ×100" multiplier counter behind him on "a hundred times more". */
const HundredX = ({ t }: { t: number }) => {
  const s = T.hundred - 0.45;
  if (t < s - 0.1 || t > T.ch3 + 0.3) return null;
  const p = prog(t, s, 0.5, outExpo);
  const n = Math.round(lerp(1, 100, prog(t, s, 1.0, inOutCubic)));
  const out = prog(t, T.ch3 - 0.35, 0.35, inOutCubic);
  const land = t > s + 1.0 ? 1 - prog(t, s + 1.0, 0.6) : 0;
  return (
    <Abs style={{ left: 0, right: 0, top: 30, textAlign: "center", opacity: p * (1 - out) }}>
      <span style={{ display: "inline-block", fontFamily: SANS, fontWeight: 800, fontSize: 330, letterSpacing: -14, lineHeight: 1, ...goldText, fontVariantNumeric: "tabular-nums",
        transform: `scale(${lerp(0.8, 1, p) * (1 + 0.06 * land)}) translateY(${-out * 60}px)`, filter: `blur(${(1 - p) * 14 + out * 10}px) drop-shadow(0 0 ${40 + 60 * land}px rgba(235,194,122,0.5))` }}>
        ×{n}
      </span>
    </Abs>
  );
};

/** The family cycle: a ring of arrows circling behind his head that shatters on "break". */
const Cycle = ({ t }: { t: number }) => {
  const s = T.somebody - 0.1, b = T.breakW + 0.05;
  if (t < s || t > b + 1.6) return null;
  const p = prog(t, s, 0.9, outCubic);
  const rot = (t - s) * 40;
  const k = prog(t, b, 1.4, outCubic); // shatter
  const n = 12;
  const cx = 540, cy = 470, r = 400;
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
      <defs>
        <linearGradient id="cg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#FFEBC2" /><stop offset="1" stopColor="#B98A3E" /></linearGradient>
      </defs>
      {Array.from({ length: n }).map((_, i) => {
        const a0 = (i / n) * 360 + rot, a1 = a0 + 360 / n - 7;
        const mid = ((a0 + a1) / 2) * (Math.PI / 180);
        const fly = k * (180 + rnd(i) * 260);
        const dx = Math.cos(mid) * fly, dy = Math.sin(mid) * fly + k * k * 300;
        const arc = (deg: number) => [cx + r * Math.cos((deg * Math.PI) / 180), cy + r * Math.sin((deg * Math.PI) / 180)];
        const [x0, y0] = arc(a0), [x1, y1] = arc(a1);
        const [ax, ay] = arc(a1 + 2.5);
        const tang = a1 + 90;
        const vis = clampSeg(p * n - i);
        if (vis <= 0) return null;
        return (
          <g key={i} transform={`translate(${dx} ${dy}) rotate(${k * (rnd(i + 9) - 0.5) * 140} ${cx + r * Math.cos(mid)} ${cy + r * Math.sin(mid)})`} opacity={vis * (1 - k)}>
            <path d={`M${x0} ${y0} A${r} ${r} 0 0 1 ${x1} ${y1}`} stroke="url(#cg)" strokeWidth={12} fill="none" strokeLinecap="round" style={{ filter: "drop-shadow(0 0 14px rgba(235,194,122,0.6))" }} />
            <path d={`M${ax} ${ay} l${16 * Math.cos(((tang + 150) * Math.PI) / 180)} ${16 * Math.sin(((tang + 150) * Math.PI) / 180)} M${ax} ${ay} l${16 * Math.cos(((tang - 150) * Math.PI) / 180)} ${16 * Math.sin(((tang - 150) * Math.PI) / 180)}`}
              stroke="#FFEBC2" strokeWidth={8} strokeLinecap="round" fill="none" transform={`rotate(180 ${ax} ${ay})`} />
          </g>
        );
      })}
    </svg>
  );
};
const clampSeg = (x: number) => Math.min(1, Math.max(0, x));

/** The speaker on top of everything behind him. */
export const Person = () => <Plate src="fg.webm" transparent />;
