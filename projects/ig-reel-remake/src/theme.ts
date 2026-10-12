import { continueRender, delayRender, staticFile } from "remotion";

// Fonts ship in public/fonts (OFL, from Google Fonts) so renders never depend on the network.
const FACES: [string, string, FontFaceDescriptors][] = [
  ["Inter Tight", "fonts/InterTight-var.woff2", { weight: "100 900" }],
  ["Instrument Serif", "fonts/InstrumentSerif-400i.woff2", { style: "italic", weight: "400" }],
  ["JetBrains Mono", "fonts/JetBrainsMono-500.woff2", { weight: "500" }],
  ["Anton", "fonts/Anton-400.woff2", { weight: "400" }],
];
const handle = delayRender("fonts");
Promise.all(
  FACES.map(([family, file, desc]) =>
    new FontFace(family, `url(${staticFile(file)}) format("woff2")`, desc).load().then((f) => document.fonts.add(f)),
  ),
).then(() => continueRender(handle));

export const SANS = "'Inter Tight', sans-serif";
export const SERIF = "'Instrument Serif', serif";
export const MONO = "'JetBrains Mono', monospace";
export const DISPLAY = "Anton, 'Inter Tight', sans-serif";

// One accent carries every emphasis; everything else is paper on ink.
export const C = {
  ink: "#0B0B0C",
  paper: "#F4EFE6",
  dim: "rgba(244,239,230,0.55)",
  accent: "#FF6B2C",
  accentSoft: "rgba(255,107,44,0.35)",
  glass: "rgba(18,18,20,0.55)",
  line: "rgba(244,239,230,0.18)",
  no: "#FF4D3D",
};
