import { continueRender, delayRender, staticFile } from "remotion";

// The Command Centre's typefaces (src/app/command/layout.tsx): Inter for the title, JetBrains Mono for
// the state word and everything terminal-like. Served from public/fonts (both SIL Open Font Licence,
// variable, Latin), so a render needs no network.
const FACES = [
  ["CC Inter", "fonts/inter-latin.woff2"],
  ["CC Mono", "fonts/jetbrains-mono-latin.woff2"],
] as const;

if (typeof document !== "undefined") {
  const handle = delayRender("Loading the Command Centre fonts");
  Promise.all(
    FACES.map(([family, file]) =>
      new FontFace(family, `url(${staticFile(file)}) format("woff2")`, { weight: "100 900" }).load().then((face) => {
        (document.fonts as unknown as { add: (f: FontFace) => void }).add(face);
      }),
    ),
  )
    .then(() => continueRender(handle))
    .catch((err) => {
      console.error(err);
      continueRender(handle);
    });
}

export const sans = `"CC Inter", ui-sans-serif, system-ui, sans-serif`;
export const mono = `"CC Mono", ui-monospace, monospace`;
