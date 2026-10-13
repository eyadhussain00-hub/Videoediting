import { AbsoluteFill, useCurrentFrame } from "remotion";
import { FPS, GOLD, T } from "../data";
import { MONO, SERIF } from "../fonts";
import { Abs, goldText, inOutCubic, lerp, outCubic, outExpo, prog, rnd } from "../ui";
import { Plate } from "./base";

// The depth layer: the background plate, then type and light that sit *behind* the speaker, then the
// speaker himself (clean plate + rembg matte → fg.webm with alpha) on top, framed by the same camera.
// Free space behind him: a left column (x < ~230) and a right column (x > ~790) from the top down to the
// shoulders (y ~ 760). Type that runs a little past the columns tucks behind his head, which sells the depth.

type Beat = { s: number; e: number; num: string; word: string; label: string };
export const BEATS: Beat[] = [
  { s: T.time, e: T.identity, num: "01", word: "Time", label: "SPEED · SHORTCUT" },
  { s: T.identity, e: T.collageIn, num: "02", word: "Identity", label: "WHO THEY BECOME" },
  { s: T.money, e: T.energy, num: "03", word: "Money", label: "ROI · SAVINGS" },
  { s: T.energy, e: T.reputation, num: "04", word: "Energy", label: "RELIEF" },
  { s: T.reputation, e: T.proof, num: "05", word: "Reputation", label: "STATUS · PEERS" },
  { s: T.cta, e: 37.5, num: "", word: "Coach", label: "COMMENT BELOW" },
];

/** How strongly the background is pushed back (dimmed) at time t. */
const dimAt = (t: number) => {
  const hook = Math.min(prog(t, T.five - 0.15, 0.35), 1 - prog(t, T.listIn, 0.4)) * 0.5;
  const beats = Math.max(...BEATS.map((b) => Math.min(prog(t, b.s - 0.1, 0.35), 1 - prog(t, b.e - 0.2, 0.3)))) * 0.36;
  const proof = Math.min(prog(t, T.proof - 0.1, 0.4), 1 - prog(t, T.cta - 0.2, 0.3)) * 0.55;
  return Math.max(hook, beats, proof, 0);
};

export const BgDim = () => {
  const t = useCurrentFrame() / FPS;
  const d = dimAt(t);
  return <AbsoluteFill style={{ background: `rgba(10,7,4,${d})` }} />;
};

/** Slow rotating light rays from behind his head (hook and proof). */
export const Rays = () => {
  const t = useCurrentFrame() / FPS;
  const a = Math.max(
    Math.min(prog(t, T.five - 0.05, 0.5), 1 - prog(t, T.listIn + 0.2, 0.5)) * 0.9,
    Math.min(prog(t, T.m23 - 0.4, 0.6), 1 - prog(t, T.cta - 0.2, 0.4)),
    Math.min(prog(t, T.coach - 0.1, 0.6), 1 - prog(t, 36.6, 0.4)) * 0.55,
  );
  if (a <= 0) return null;
  const rot = t * 9;
  const burst = 1 + 0.5 * (1 - prog(t, T.million + 0.1, 0.9)) * (t > T.million ? 1 : 0);
  return (
    <Abs
      style={{
        left: 540 - 1300,
        top: 400 - 1300,
        width: 2600,
        height: 2600,
        opacity: a * 0.5 * burst,
        transform: `rotate(${rot}deg)`,
        background:
          "repeating-conic-gradient(from 0deg, rgba(255,214,140,0.0) 0deg, rgba(255,214,140,0.42) 4deg, rgba(255,214,140,0.0) 9deg, rgba(255,214,140,0.0) 17deg)",
        WebkitMaskImage: "radial-gradient(circle at 50% 50%, black 0%, rgba(0,0,0,0.6) 18%, transparent 46%)",
        maskImage: "radial-gradient(circle at 50% 50%, black 0%, rgba(0,0,0,0.6) 18%, transparent 46%)",
        filter: "blur(5px)",
        mixBlendMode: "screen",
      }}
    />
  );
};

/** Gold bokeh dust. `front` = a few big, soft motes in front of him (shallow depth of field). */
export const Dust = ({ front = false }: { front?: boolean }) => {
  const t = useCurrentFrame() / FPS;
  const n = front ? 7 : 46;
  const boost = 1 + 1.4 * Math.min(prog(t, T.m23 - 0.3, 0.5), 1 - prog(t, T.cta, 0.5));
  return (
    <AbsoluteFill style={{ mixBlendMode: "screen", pointerEvents: "none" }}>
      {Array.from({ length: n }).map((_, i) => {
        const k = i + (front ? 500 : 0);
        const size = front ? 40 + rnd(k) * 70 : 3 + rnd(k) ** 2 * 16;
        const speed = front ? 18 + rnd(k + 1) * 20 : 10 + rnd(k + 1) * 34;
        const x = rnd(k + 2) * 1080 + Math.sin(t * (0.3 + rnd(k + 3)) + k) * 26;
        const y = ((rnd(k + 4) * 2100 - t * speed) % 2100 + 2100) % 2100 - 90;
        const tw = 0.55 + 0.45 * Math.sin(t * (1.2 + rnd(k + 5) * 2.5) + k * 3);
        const op = (front ? 0.16 : 0.22 + 0.5 * rnd(k + 6)) * tw * Math.min(1, boost);
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
              background: front ? "radial-gradient(circle, rgba(255,220,150,0.9), rgba(255,200,120,0) 70%)" : "radial-gradient(circle, #FFE7B0 0%, rgba(242,196,109,0.6) 45%, rgba(242,196,109,0) 72%)",
              opacity: op * boost,
              filter: front ? "blur(6px)" : size > 12 ? "blur(2px)" : undefined,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

/** Big type behind the speaker: the hook's giant 5, then per currency a numeral (left) and a vertical word (right). */
export const BehindType = () => {
  const t = useCurrentFrame() / FPS;
  return (
    <>
      <HookFive t={t} />
      {BEATS.map((b, i) => (t >= b.s - 0.2 && t < b.e + 0.4 ? <BeatType key={i} b={b} t={t} /> : null))}
    </>
  );
};

const HookFive = ({ t }: { t: number }) => {
  if (t < T.five - 0.2 || t > T.time + 0.3) return null;
  const p = prog(t, T.five - 0.04, 0.5, outExpo);
  const settle = prog(t, T.listIn, 0.6, inOutCubic); // recedes while the list builds
  const out = prog(t, T.time - 0.3, 0.35, inOutCubic);
  const glow = 1 - prog(t, T.five + 0.1, 1.2);
  return (
    <>
      <Abs
        style={{
          left: 590,
          top: -40,
          fontFamily: SERIF,
          fontStyle: "italic",
          fontSize: 940,
          lineHeight: 1,
          ...goldText,
          opacity: p * lerp(1, 0.4, settle) * (1 - out),
          transform: `translateY(${(1 - p) * 220 - out * 120}px) scale(${lerp(1.25, 1, p)})`,
          transformOrigin: "50% 60%",
          filter: `blur(${(1 - p) * 18 + out * 10}px) drop-shadow(0 0 ${30 + 60 * glow}px rgba(242,196,109,${0.35 + 0.35 * glow}))`,
          paddingRight: 40,
        }}
      >
        5
      </Abs>
      <Abs
        style={{
          left: 70,
          top: 140,
          writingMode: "vertical-rl",
          fontFamily: MONO,
          fontWeight: 700,
          fontSize: 30,
          letterSpacing: 12,
          color: "rgba(255,240,215,0.85)",
          opacity: prog(t, T.five + 0.25, 0.4) * (1 - prog(t, T.listIn - 0.1, 0.3)),
        }}
      >
        THE 5 CURRENCIES
      </Abs>
    </>
  );
};

const BeatType = ({ b, t }: { b: Beat; t: number }) => {
  const exit = prog(t, b.e - 0.28, 0.32, (x) => x * x);
  const letters = b.word.split("");
  const size = Math.min(250, 700 / (letters.length * 0.43));
  const nump = prog(t, b.s - 0.06, 0.45, outExpo);
  const labp = prog(t, b.s + 0.25, 0.4);
  return (
    <>
      {/* numeral, left column */}
      {b.num && (
        <Abs style={{ left: 22, top: 110, opacity: nump * (1 - exit) }}>
          <div
            style={{
              fontFamily: SERIF,
              fontStyle: "italic",
              fontSize: 270,
              lineHeight: 1,
              ...goldText,
              transform: `translateY(${(1 - nump) * 80 - exit * 60}px)`,
              filter: `blur(${(1 - nump) * 12 + exit * 8}px) drop-shadow(0 0 30px rgba(242,196,109,0.35))`,
              paddingRight: 20,
            }}
          >
            {b.num}
          </div>
          <div style={{ fontFamily: MONO, fontSize: 22, letterSpacing: 6, color: "rgba(255,240,215,0.7)", marginTop: 6, marginLeft: 10, opacity: labp }}>/ 05</div>
        </Abs>
      )}
      {/* vertical word, right column, letters drop in one by one */}
      <Abs
        style={{
          left: 1080 - 40 - size * 1.02,
          top: 110,
          writingMode: "vertical-rl",
          fontFamily: SERIF,
          fontStyle: "italic",
          fontSize: size,
          lineHeight: 1,
          whiteSpace: "nowrap",
        }}
      >
        {letters.map((ch, i) => {
          const p = prog(t, b.s + i * 0.045, 0.42, outCubic);
          const x = prog(t, b.e - 0.3 + i * 0.025, 0.28, (v) => v * v);
          return (
            <span
              key={i}
              style={{
                display: "inline-block",
                ...goldText,
                opacity: p * (1 - x),
                transform: `translateY(${(1 - p) * -90 + x * 80}px)`,
                filter: `blur(${(1 - p) * 10 + x * 8}px) drop-shadow(0 0 22px rgba(242,196,109,0.3))`,
                paddingBottom: 4,
              }}
            >
              {ch}
            </span>
          );
        })}
      </Abs>
      {/* thin label under the word column */}
      <Abs
        style={{
          left: 1080 - 40 - size * 1.02 - 46,
          top: 116,
          writingMode: "vertical-rl",
          fontFamily: MONO,
          fontSize: 20,
          letterSpacing: 8,
          color: GOLD,
          opacity: labp * (1 - exit) * 0.9,
        }}
      >
        {b.label}
      </Abs>
    </>
  );
};

/** The speaker on top of everything behind him. */
export const Person = () => <Plate src="fg.webm" transparent />;
