// The device frames the footage sits inside. Each is an SVG in public/mockups with a transparent screen
// hole; `screen` is where that hole is, in the SVG's own units, and the recording is scaled to fill it
// exactly. Swapping in new artwork only needs a new file and its screen rectangle.
//
// Stage 2 ships simple stand-ins; stage 3 replaces the artwork, keeping this shape.

export type Mockup = {
  src: string; // path under public/
  width: number;
  height: number;
  screen: { x: number; y: number; w: number; h: number };
};

export const mockups: Record<"laptop" | "phone", Mockup> = {
  // 1360×850 is 1440×900 at 16:10, the desktop recording's own ratio.
  laptop: { src: "mockups/laptop.svg", width: 1480, height: 940, screen: { x: 60, y: 30, w: 1360, h: 850 } },
  // 390×844, the mobile recording at 1:1.
  phone: { src: "mockups/phone.svg", width: 430, height: 880, screen: { x: 20, y: 18, w: 390, h: 844 } },
};
