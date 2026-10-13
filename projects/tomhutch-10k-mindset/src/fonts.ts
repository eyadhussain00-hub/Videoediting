import { continueRender, delayRender, staticFile } from "remotion";

const FONTS: [string, string, string?][] = [
  ["InterTight", "InterTight.ttf", "100 900"],
  ["InstrumentSerif", "InstrumentSerif-Regular.ttf"],
  ["InstrumentSerifItalic", "InstrumentSerif-Italic.ttf"],
  ["JetBrainsMono", "JetBrainsMono.ttf", "100 800"],
];

let started = false;
export const loadFonts = () => {
  if (started || typeof document === "undefined") return;
  started = true;
  const handle = delayRender("fonts");
  Promise.all(
    FONTS.map(([family, file, weight]) => {
      const f = new FontFace(family, `url(${staticFile(file)})`, weight ? { weight } : {});
      return f.load().then((l) => (document.fonts as unknown as Set<FontFace>).add(l));
    }),
  ).then(() => continueRender(handle), (e) => { console.error(e); continueRender(handle); });
};
