import { loadFont as loadArabic } from "@remotion/google-fonts/IBMPlexSansArabic";
import { loadFont as loadJakarta } from "@remotion/google-fonts/PlusJakartaSans";
import type { Lang } from "./theme";

// The site's own typefaces: Plus Jakarta Sans for English, IBM Plex Sans Arabic for Arabic.
const jakarta = loadJakarta("normal", { weights: ["500", "600", "700", "800"], subsets: ["latin"] });
const arabic = loadArabic("normal", { weights: ["400", "500", "600", "700"], subsets: ["arabic", "latin"] });

export const fontFor = (lang: Lang) =>
  lang === "ar" ? `"${arabic.fontFamily}", "${jakarta.fontFamily}", sans-serif` : `"${jakarta.fontFamily}", sans-serif`;
