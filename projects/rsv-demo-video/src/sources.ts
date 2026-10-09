import { clinicCaptions } from "../config/captions/clinic";
import { clinicStoryboard } from "../config/storyboard/clinic";
import type { Captions, Storyboard } from "../config/video";

// Every business a demo video can be rendered for: its cut list and its words. The footage is found by
// the same key: public/recordings/<key>-<lang>-<desktop|mobile>.webm.
export const sources: Record<string, { storyboard: Storyboard; captions: Captions }> = {
  clinic: { storyboard: clinicStoryboard, captions: clinicCaptions },
};
