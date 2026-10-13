import { AbsoluteFill, OffthreadVideo, Sequence, staticFile, useCurrentFrame } from "remotion";
import { FPS, T, at } from "../data";
import { MONO, SANS } from "../fonts";
import { Abs, lerp, outBack, prog, rnd, step } from "../ui";

const PAPER = "#E2B13C";
const CREAM = "#F3EAD7";
const RED = "#C8312B";

// Torn edge as a polygon (seeded) for the photo cut-out.
const torn = (seed: number, n = 28, amp = 1.6) => {
  const pts: string[] = [];
  for (let i = 0; i <= n; i++) pts.push(`${(i / n) * 100}% ${rnd(seed + i) * amp}%`);
  for (let i = 0; i <= n; i++) pts.push(`${100 - rnd(seed + 50 + i) * amp}% ${(i / n) * 100}%`);
  for (let i = n; i >= 0; i--) pts.push(`${(i / n) * 100}% ${100 - rnd(seed + 100 + i) * amp}%`);
  for (let i = n; i >= 0; i--) pts.push(`${rnd(seed + 150 + i) * amp}% ${(i / n) * 100}%`);
  return `polygon(${pts.join(",")})`;
};

const WORDS = [
  { w: "WHO", k: "who", x: 60, y: 1050, r: -5, bg: "#111", fg: CREAM, fs: 170 },
  { w: "THEY", k: "they", n: 4, x: 520, y: 1085, r: 4, bg: CREAM, fg: "#111", fs: 120 },
  { w: "GET", k: "get", x: 100, y: 1250, r: 3, bg: RED, fg: CREAM, fs: 150 },
  { w: "TO", k: "to", n: 2, x: 440, y: 1275, r: -6, bg: CREAM, fg: "#111", fs: 115 },
  { w: "BE", k: "be", x: 660, y: 1235, r: 5, bg: "#111", fg: PAPER, fs: 170 },
];

/** Collage B-roll beat: mustard paper, halftone photo of the speaker, ransom-note words, a red YES stamp. */
export const Collage = () => {
  const t = useCurrentFrame() / FPS;
  if (t < T.collageIn - 0.05 || t > T.collageOut + 0.3) return null;
  const ts = step(t, 12);
  const enter = prog(ts, T.collageIn, 0.25);
  const exit = prog(ts, T.collageOut - 0.12, 0.3, (x) => x * x);
  const yes = prog(t, T.yes - 0.02, 0.12);
  const shake = t > T.yes && t < T.yes + 0.2 ? (rnd(Math.floor(t * 30)) - 0.5) * 22 : 0;
  return (
    <AbsoluteFill style={{ transform: `translateY(${(1 - enter) * 1920 + exit * 1920}px) translateX(${shake}px)` }}>
      <AbsoluteFill style={{ background: PAPER }} />
      <Abs style={{ left: 60, top: 150, fontFamily: MONO, fontSize: 26, letterSpacing: 6, color: "#1A1408", opacity: 0.85 }}>CURRENCY 02 — IDENTITY</Abs>
      {/* halftone cut-out, baked onto the paper by scripts/halftone.py */}
      <Abs style={{ left: 0, top: 110, width: 1080, height: 1080, transform: `rotate(${Math.sin(ts * 9) * 0.3}deg)` }}>
        <Sequence from={Math.round(T.collageIn * FPS) - 2} layout="none">
          <OffthreadVideo src={staticFile("halftone.mp4")} muted style={{ width: 1080, height: 1080 }} />
        </Sequence>
      </Abs>
      {/* paper fibre */}
      <AbsoluteFill style={{ opacity: 0.3, mixBlendMode: "multiply" }}>
        <svg width="1080" height="1920">
          <filter id="paper">
            <feTurbulence type="fractalNoise" baseFrequency="0.035 0.6" numOctaves="3" seed={3} />
            <feColorMatrix type="matrix" values="0 0 0 0 0.55  0 0 0 0 0.42  0 0 0 0 0.2  0 0 0 0.5 0" />
          </filter>
          <rect width="1080" height="1920" filter="url(#paper)" />
        </svg>
      </AbsoluteFill>
      {WORDS.map((w, i) => {
        const ws = at(w.k, w.n ?? 1);
        const p = prog(ts, ws - 0.04, 0.17, outBack);
        if (p <= 0) return null;
        return (
          <Abs key={i} style={{ left: w.x, top: w.y + (1 - p) * 120, transform: `rotate(${w.r + (rnd(Math.floor(ts * 12) + i) - 0.5) * 1.2}deg) scale(${lerp(1.25, 1, p)})`, background: w.bg, color: w.fg, fontFamily: SANS, fontWeight: 800, fontSize: w.fs, lineHeight: 1, padding: "6px 22px 10px", letterSpacing: -3, boxShadow: "0 10px 16px rgba(60,30,0,0.35)", clipPath: torn(i * 31 + 5, 10, 3.5) }}>
            {w.w}
          </Abs>
        );
      })}
      <Abs style={{ left: 90, top: 1450, opacity: prog(ts, at("once") - 0.04, 0.1), background: "#111", color: CREAM, fontFamily: MONO, fontWeight: 700, fontSize: 34, padding: "8px 18px", letterSpacing: 4, transform: "rotate(-1.5deg)" }}>
        ONCE THEY SAY
      </Abs>
      {/* YES stamp */}
      {yes > 0 && (
        <Abs style={{ left: 540, top: 1400, transform: `rotate(-10deg) scale(${lerp(2.2, 1, outBack(yes))})`, opacity: yes, border: `10px solid ${RED}`, borderRadius: 18, padding: "0 30px", color: RED, fontFamily: SANS, fontWeight: 800, fontSize: 170, lineHeight: 1.05, letterSpacing: -4, mixBlendMode: "multiply" }}>
          YES.
        </Abs>
      )}
    </AbsoluteFill>
  );
};
