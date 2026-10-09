// The Command Centre's states, shared by the orb (browser) and the event API (server).
// The first four and their colours are Ship Notes' Signal Orb; editing, running and waiting are ours,
// drawn in the same style (src/components/command/signal-orb.ts).
export const ORB_STATES = ["listening", "thinking", "searching", "done", "editing", "running", "waiting"] as const;
export type OrbState = (typeof ORB_STATES)[number];

export const ORB_COLORS: Record<OrbState, readonly [number, number, number]> = {
  listening: [255, 185, 105],
  thinking: [178, 151, 255],
  searching: [97, 219, 249],
  done: [136, 239, 194],
  editing: [255, 140, 212],
  running: [218, 236, 112],
  waiting: [255, 112, 120],
};

export function isOrbState(value: unknown): value is OrbState {
  return typeof value === "string" && (ORB_STATES as readonly string[]).includes(value);
}

// When the orb follows several sources at once it shows the one that matters most: something waiting
// on you first, then whatever is actively changing things, down to idle.
const PRIORITY: OrbState[] = ["waiting", "running", "editing", "searching", "thinking", "done", "listening"];

export function mostUrgent(states: OrbState[]): OrbState {
  for (const state of PRIORITY) if (states.includes(state)) return state;
  return "listening";
}

// One thing reporting in: a Claude Code session, or an API key at work (src/lib/command.ts).
export type SourceKind = "session" | "key";
export type Source = {
  id: string;
  kind: SourceKind;
  label: string;
  state: OrbState;
  updatedAt: number;
  // The tool it last used (Claude Code sessions), when it was first heard from, and when its current
  // run of work began (null while idle or done).
  tool: string | null;
  startedAt: number;
  busySince: number | null;
};

// A Claude Code permission prompt waiting for the operator's answer from the Command Centre
// (src/lib/command-approvals.ts). `summary` is one line: the command, the file or the site.
export type Approval = { id: string; sourceId: string; label: string; tool: string; summary: string; createdAt: number };

// How long a prompt waits for that answer before Claude Code asks at the keyboard instead.
export const APPROVAL_WAIT_MS = 55_000;
