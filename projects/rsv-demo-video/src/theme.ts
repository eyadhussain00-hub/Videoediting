// The site's dark, Linear-style palette (src/app/globals.css, dark tokens), for everything around the
// footage. The footage itself is the dashboard in light mode.
export const ink = {
  bg: "#07090d",
  surface: "#0f1319",
  border: "rgba(255,255,255,0.08)",
  text: "#eef0f5",
  text2: "#a3abbd",
  text3: "#6b7386",
  accent: "#3538cd",
  accentSoft: "#6366f1",
  teal: "#0e7490",
  telegram: "#2aabee",
  whatsapp: "#25d366",
};

export type Lang = "ar" | "en";
export const isRtl = (lang: Lang) => lang === "ar";
