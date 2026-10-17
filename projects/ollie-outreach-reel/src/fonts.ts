import { continueRender, delayRender, staticFile } from "remotion";

// Fonts are bundled in public/fonts (OFL, see LICENSES.md): the render browser can't reach Google Fonts
// through the cloud proxy, and local files keep renders reproducible.
const FACES: [string, string, string, string][] = [
  ["Inter Tight", "fonts/InterTight.woff2", "normal", "100 900"],
  ["Instrument Serif", "fonts/InstrumentSerif-Italic.woff2", "italic", "400"],
  ["Instrument Serif", "fonts/InstrumentSerif-Regular.woff2", "normal", "400"],
  ["JetBrains Mono", "fonts/JetBrainsMono.woff2", "normal", "100 800"],
];

const handle = delayRender("fonts");
Promise.all(
  FACES.map(([family, file, style, weight]) => {
    const f = new FontFace(family, `url(${staticFile(file)}) format("woff2")`, { style, weight });
    (document.fonts as unknown as { add: (f: FontFace) => void }).add(f);
    return f.load();
  }),
).then(() => continueRender(handle));

export const SANS = `"Inter Tight", sans-serif`;
export const SERIF = `"Instrument Serif", serif`;
export const MONO = `"JetBrains Mono", monospace`;
