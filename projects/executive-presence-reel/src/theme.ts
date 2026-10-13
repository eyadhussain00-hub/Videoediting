import { continueRender, delayRender, staticFile } from "remotion";
import data from "./data.json";

export const FPS = 24;
export const SRC_END = 1578 / 24;          // 65.75 s of footage
export const TOTAL = SRC_END + 2.9;         // + end card
export const W = data.words;
export const wt = (i: number) => W[i].t;    // start time of transcript word i

export const C = {
  gold: "#E9B872",
  goldHi: "#FBE7C2",
  goldLo: "#C98B3E",
  cream: "#F4EDE2",
  ink: "#120C08",
  glass: "rgba(18,12,8,0.55)",
  line: "rgba(255,255,255,0.16)",
};
export const GOLD_GRAD = `linear-gradient(180deg, ${C.goldHi} 0%, ${C.gold} 52%, ${C.goldLo} 100%)`;
export const SERIF = "'Instrument Serif', serif";
export const SANS = "'Inter', sans-serif";

export const goldText: React.CSSProperties = {
  backgroundImage: GOLD_GRAD, WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent",
};
export const glass: React.CSSProperties = {
  background: "linear-gradient(160deg, rgba(40,28,20,0.62), rgba(14,10,7,0.72))",
  border: `1px solid ${C.line}`,
  boxShadow: "0 20px 60px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.08)",
  backdropFilter: "blur(18px)",
};

// ---------- timing helpers (everything is a pure function of t) ----------
export const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
export const E = {
  linear: (x: number) => x,
  outCubic: (x: number) => 1 - Math.pow(1 - x, 3),
  inCubic: (x: number) => x * x * x,
  outExpo: (x: number) => (x >= 1 ? 1 : 1 - Math.pow(2, -10 * x)),
  inOutCubic: (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2),
  inOutSine: (x: number) => -(Math.cos(Math.PI * x) - 1) / 2,
  outBack: (x: number) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); },
};
/** 0→1 progress of a move that starts at a and lasts d seconds. */
export const P = (t: number, a: number, d: number, e = E.outCubic) => e(clamp01((t - a) / d));
/** opacity window: fades in at a, out at b. */
export const win = (t: number, a: number, b: number, fi = 0.25, fo = 0.2) =>
  Math.min(P(t, a, fi), 1 - P(t, b - fo, fo, E.inCubic));
export const lerp = (a: number, b: number, p: number) => a + (b - a) * p;
/** seeded random in [0,1) */
export const rnd = (i: number) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

// ---------- fonts (block the first frame until loaded) ----------
const h = delayRender("fonts");
const faces = [
  new FontFace("Instrument Serif", `url(${staticFile("fonts/InstrumentSerif-Italic.ttf")})`, { style: "italic" }),
  new FontFace("Instrument Serif", `url(${staticFile("fonts/InstrumentSerif-Regular.ttf")})`, { style: "normal" }),
  new FontFace("Inter", `url(${staticFile("fonts/Inter.ttf")})`, { weight: "100 900" }),
];
Promise.all(faces.map((f) => f.load())).then((fs) => { fs.forEach((f) => (document.fonts as unknown as { add: (f: FontFace) => void }).add(f)); continueRender(h); });
