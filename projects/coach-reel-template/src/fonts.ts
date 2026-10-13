import { continueRender, delayRender, staticFile } from "remotion";

// Google Fonts (SIL Open Font License), served from public/fonts so rendering needs no network.
const FACES: [string, string, FontFaceDescriptors][] = [
  ["Inter Tight", "InterTight.woff2", { weight: "100 900" }],
  ["Instrument Serif", "InstrumentSerif.woff2", { style: "normal" }],
  ["Instrument Serif", "InstrumentSerif-Italic.woff2", { style: "italic" }],
  ["JetBrains Mono", "JetBrainsMono.woff2", { weight: "100 800" }],
];

const handle = delayRender("Loading fonts");
Promise.all(
  FACES.map(([family, file, desc]) => {
    const face = new FontFace(family, `url(${staticFile(`fonts/${file}`)}) format('woff2')`, desc);
    document.fonts.add(face);
    return face.load();
  }),
)
  .then(() => continueRender(handle))
  .catch((err) => {
    console.error(err);
    continueRender(handle);
  });
