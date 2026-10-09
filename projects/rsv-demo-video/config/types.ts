// The app's sector keys, as in rsv-studio's src/lib/sectors.ts. Kept here so rendering needs nothing from
// the app; the recorder looks the sector up in the app itself, so a key it doesn't know fails there.
export type SectorKey = "clinic" | "property" | "sales" | "tamoula" | "shop";

// Everything a demo video needs to know about one business, kept apart from the code that records and
// renders it. A new client or the property vertical is a new file shaped like this, not a new pipeline.

export type Locale = "ar" | "en";
export type Bilingual = Record<Locale, string>;
export type ViewportKey = "desktop" | "mobile";

// One lead in the recording clinic's starting data. Days are relative to the moment of recording, so
// "last contact yesterday" stays true whenever the video is re-recorded.
export type FixtureLead = {
  name: Bilingual;
  phone: string;
  stage: string;
  subject: string | null;
  source: string | null;
  value: number;
  owner: Bilingual | null;
  note: Bilingual | null;
  createdDaysAgo: number;
  lastContactDaysAgo: number;
  nextActionInDays: number | null;
  firstResponseMins: number | null;
};

// Past months of closed leads, generated rather than listed, so the monthly report has a real trend,
// per-person figures and sources to show. Everything is derived from `seed`, so every take is identical.
export type History = {
  // Leads that arrived in each past month, oldest first; the last entry is last month.
  perMonth: number[];
  // Share of each month's leads that ended won; the rest are lost or went quiet.
  wonShare: number;
  // Typical minutes to first reply in each of those months, same order as perMonth. Individual leads vary
  // around it, so the report's median lands close to these and "vs last month" follows the trend.
  replyMinutes: number[];
  names: Bilingual[];
  owners: Bilingual[];
  seed: number;
};

// The lead that arrives during the recording, as a real Telegram update posted to the webhook.
export type TelegramArrival = {
  firstName: Bilingual;
  lastName: Bilingual;
  username: string;
  text: Bilingual;
};

// The lead the team adds by hand through the dashboard's own form.
export type ManualLead = {
  name: Bilingual;
  phone: string;
  subject: string;
  source: string;
  value: number;
};

// The steps a recording walks through, in order. Each writes a cue with the same id — its start and end,
// named moments inside it, and the screen area worth zooming into — which is what the video is cut from.
export type Beat =
  | "load" // the dashboard opens with its existing leads
  | "search" // a name is typed into the search and the list narrows
  | "arrive" // a Telegram message lands as a new lead
  | "add" // the team adds a walk-in through the form
  | "open" // the new lead's record panel opens and a note is written
  | "draft" // the assistant drafts a follow-up message for that lead
  | "move" // the lead moves along the stages: dragged on desktop, tapped in the panel on mobile
  | "ask" // the assistant is asked who to contact first, and answers
  | "language" // the whole dashboard switches language and back
  | "report"; // the monthly report opens and is scrolled through

export type Viewport = {
  width: number;
  height: number;
  // Device pixels per CSS pixel while the page renders. Playwright's video is always captured at
  // width × height, so this doesn't enlarge the footage; a phone at 390×844 is already close to 1:1 with
  // the phone mockup's screen in a 1080p frame.
  scale: number;
  mobile: boolean;
  beats: Beat[];
};

export type FootageSource = {
  // Names the output files: <key>-<locale>-<viewport>.webm
  key: string;
  sector: SectorKey;
  business: {
    // A separate business used only for recording: reset before every take, so the public demo is never
    // touched and every take starts from the same place.
    id: string;
    name: string;
    accent: string;
    plan: "Starter" | "Growth" | "Scale";
    city: string;
  };
  theme: "dark" | "light";
  locales: Locale[];
  // Stages the new lead is moved through during the "move" beat, in order.
  moveTo: string[];
  // Typed into the search during the "search" beat.
  search: Bilingual;
  // Written as a note on the new lead during the "open" beat.
  note: Bilingual;
  // How long to hold on each beat so a viewer can read what just happened, in milliseconds. The video is
  // cut and sped up afterwards, so these only need to be long enough to cut from.
  holdMs: Record<Beat, number>;
  viewports: Record<ViewportKey, Viewport>;
  leads: FixtureLead[];
  history: History;
  arrival: TelegramArrival;
  manual: ManualLead;
};
