import type { ReactNode } from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { ORB_COLORS, type OrbState } from "./vendor/command-states";
import { mono, sans } from "./fonts";
import { Orb } from "./Orb";
import { BG, Room } from "./Room";
import { ease, stateAt, weightsAt, type Beat, type Say } from "./timing";

// A 50-second showcase of the Command Centre, drawn with the app's own orb rather than recorded, so
// it's smooth at any size: the seven states as Claude Code works, answering a prompt and swiping
// between sessions on a phone, the TV, talking to Jarvis, and the address.
// npm run render:command → out/command-centre.mp4 (entry: src/command/index.tsx)

export const SHOWCASE_SECONDS = 50;

const says = (beats: Beat[], lead = 0): Say[] => beats.map((b, i) => ({ at: i === 0 ? b.at + lead : b.at, text: b.state }));
const window_ = (t: number, from: number, to: number, fade = 0.6) => Math.min(ease(t, from, from + fade), 1 - ease(t, to - fade, to));

export function CommandShowcase() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;

  return (
    <AbsoluteFill style={{ background: BG }}>
      {t < 19.6 && <States t={t} />}
      {t >= 19 && t < 31.4 && <Phone t={t - 19} fade={window_(t, 19, 31.4)} />}
      {t >= 30.8 && t < 38.8 && <Tv t={t - 30.8} fade={window_(t, 30.8, 38.8)} />}
      {t >= 38.2 && t < 46.2 && <Jarvis t={t - 38.2} fade={window_(t, 38.2, 46.2)} />}
      {t >= 45.6 && <End t={t - 45.6} fade={window_(t, 45.6, SHOWCASE_SECONDS + 1, 0.6) * (1 - ease(t, SHOWCASE_SECONDS - 0.8, SHOWCASE_SECONDS))} />}
    </AbsoluteFill>
  );
}

// ---- 1. The seven states, as a Claude Code session works ---------------------------------------------

const WORK: Beat[] = [
  { at: 0, state: "listening" },
  { at: 3.2, state: "thinking" },
  { at: 5.6, state: "searching" },
  { at: 8.0, state: "editing" },
  { at: 10.4, state: "running" },
  { at: 12.8, state: "waiting" },
  { at: 15.2, state: "done" },
];

const HOOKS: Partial<Record<OrbState, [string, string]>> = {
  thinking: ["UserPromptSubmit", "you ask"],
  searching: ["PreToolUse · Read, Grep", "it looks around"],
  editing: ["PreToolUse · Edit, Write", "it writes the code"],
  running: ["PreToolUse · Bash", "it runs the commands"],
  waiting: ["PermissionRequest", "it needs you"],
  done: ["Stop", "the turn is over"],
};

function States({ t }: { t: number }) {
  const label = t < 0.9 ? null : t < 3.0 ? "good evening, eyad" : "rsv-studio";
  const beat = [...WORK].reverse().find((b) => b.at <= t)!;
  const hook = HOOKS[beat.state];
  const since = t - beat.at;
  const until = (WORK.find((b) => b.at > t)?.at ?? 19.0) - t;
  const show = Math.min(ease(since, 0.15, 0.55), ease(until, 0, 0.35));
  const rgb = ORB_COLORS[beat.state].join(",");
  return (
    <AbsoluteFill style={{ opacity: 1 - ease(t, 19.0, 19.6) }}>
      <Room
        w={1920}
        h={1080}
        t={t}
        beats={WORK}
        says={says(WORK, 1.1)}
        label={label}
        titleIn={ease(t, 0.2, 1.1)}
        orbIn={ease(t, 0.5, 1.9)}
      />
      {hook && (
        <div style={{ position: "absolute", left: 72, bottom: 64, opacity: show, transform: `translateY(${(1 - show) * 8}px)`, fontFamily: mono }}>
          <p style={{ margin: 0, display: "flex", alignItems: "center", gap: 12, fontSize: 20, letterSpacing: "0.04em", color: `rgb(${rgb})` }}>
            <span style={{ width: 9, height: 9, borderRadius: "50%", background: `rgb(${rgb})`, boxShadow: `0 0 10px rgba(${rgb},0.8)` }} />
            {hook[0]}
          </p>
          <p style={{ margin: "8px 0 0 21px", fontSize: 16, color: "#7f8390", letterSpacing: "0.04em" }}>Claude Code hook · {hook[1]}</p>
        </div>
      )}
    </AbsoluteFill>
  );
}

// ---- 2. The phone: a prompt answered, then the next session -------------------------------------------

const PHONE: Beat[] = [
  { at: 0, state: "waiting" },
  { at: 4.7, state: "running" },
  { at: 7.1, state: "editing" },
  { at: 9.8, state: "done" },
];

function Phone({ t, fade }: { t: number; fade: number }) {
  const slide = ease(t, 0, 1.0);
  const pan = t < 6.85 ? 0 : t < 7.1 ? -ease(t, 6.85, 7.1) : 1 - ease(t, 7.1, 7.5);
  const second = ease(t, 6.5, 7.1);
  return (
    <AbsoluteFill style={{ opacity: fade }}>
      <Headline
        x={190}
        y={392}
        a={["Answer from", "anywhere."]}
        b={["Every session,", "one swipe apart."]}
        subA="Allow or deny Claude Code from your phone."
        subB="Side buttons, a swipe, or the arrow keys."
        mix={second}
        enter={ease(t, 0.3, 1.2)}
      />
      <Device x={1060 + (1 - slide) * 260} y={98} w={390} h={844} radius={54} bezel={12}>
        <Room
          w={390}
          h={844}
          t={t}
          beats={PHONE}
          says={says(PHONE, -1)}
          label={t < 7.1 ? "rsv-studio" : "egns-shop"}
          particles={6000}
          pan={pan}
          nav
          card={{
            label: "rsv-studio",
            tool: "Bash",
            summary: "npm run build && git push",
            left: Math.max(0, 51 - Math.floor(t)),
            out: ease(t, 4.55, 4.95),
            tap: t >= 4.2 ? t - 4.2 : null,
          }}
          convo={{ asked: null, reply: null, listening: false }}
        />
      </Device>
    </AbsoluteFill>
  );
}

// ---- 3. On the TV --------------------------------------------------------------------------------------

const WALL: Beat[] = [
  { at: 0, state: "thinking" },
  { at: 2.4, state: "searching" },
  { at: 4.8, state: "running" },
];

function Tv({ t, fade }: { t: number; fade: number }) {
  const scale = 0.66;
  const w = 1920 * scale;
  const h = 1080 * scale;
  const grow = 0.97 + 0.03 * ease(t, 0, 1.2);
  return (
    <AbsoluteFill style={{ opacity: fade }}>
      <div style={{ position: "absolute", left: (1920 - w) / 2 - 14, top: 70, transform: `scale(${grow})`, transformOrigin: "50% 40%" }}>
        <div style={{ padding: 14, borderRadius: 20, background: "#101217", boxShadow: "0 0 0 1px #ffffff10, 0 40px 120px #000c" }}>
          <div style={{ position: "relative", width: w, height: h, overflow: "hidden", borderRadius: 6 }}>
            <div style={{ position: "absolute", left: 0, top: 0, transform: `scale(${scale})`, transformOrigin: "0 0" }}>
              <Room w={1920} h={1080} t={t} beats={WALL} says={says(WALL, -1)} label="everything · 4" clock="21:45" />
            </div>
          </div>
        </div>
        <div style={{ margin: "0 auto", width: 180, height: 26, background: "linear-gradient(#15181e, #0c0e12)", clipPath: "polygon(22% 0, 78% 0, 100% 100%, 0 100%)" }} />
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 58, textAlign: "center", opacity: ease(t, 0.5, 1.3) }}>
        <p style={{ margin: 0, fontFamily: sans, fontWeight: 500, fontSize: 40, letterSpacing: "-0.02em", color: "#eeeff4" }}>Cast it to the TV.</p>
        <p style={{ margin: "10px 0 0", fontFamily: mono, fontSize: 17, letterSpacing: "0.06em", color: "#7f8390" }}>
          the screen stays on · pages turn by themselves · stops on anything that needs you
        </p>
      </div>
    </AbsoluteFill>
  );
}

// ---- 4. Talking to Jarvis --------------------------------------------------------------------------------

const TALK: Beat[] = [
  { at: 0, state: "done" },
  { at: 0.6, state: "listening" },
  { at: 2.4, state: "thinking" },
  { at: 3.9, state: "running" },
  { at: 6.4, state: "done" },
];

const ASK = "what needs me today";

function Jarvis({ t, fade }: { t: number; fade: number }) {
  const scale = 1.2;
  const listening = t >= 0.6 && t < 2.4;
  const heard = ASK.slice(0, Math.max(0, Math.floor((t - 0.9) / 0.06)));
  const label = t < 0.6 ? "rsv-studio" : listening ? (heard ? `${heard}…` : "listening…") : "Jarvis";
  const reply = "Two leads are waiting on a reply, and Nile Smile's payment is three days overdue. Everything else is on track.";
  const shown = t >= 3.9 ? reply.slice(0, Math.floor((t - 3.9) / 0.018)) : null;
  return (
    <AbsoluteFill style={{ opacity: fade }}>
      <div style={{ position: "absolute", left: 0, top: 0, transform: `scale(${scale})`, transformOrigin: "0 0" }}>
        <Room
          w={1600}
          h={900}
          t={t}
          beats={TALK}
          says={says(TALK, -1)}
          label={label}
          convo={{ asked: t >= 2.4 ? "What needs me today?" : null, reply: t >= 2.4 ? (shown ?? "Jarvis is thinking…") : null, listening }}
        />
      </div>
      <div style={{ position: "absolute", left: 72, bottom: 64, fontFamily: mono, opacity: ease(t, 0.4, 1.0) * (1 - ease(t, 7.2, 7.8)) }}>
        <p style={{ margin: 0, fontSize: 20, letterSpacing: "0.04em", color: "#eeeff4" }}>Talk to Jarvis</p>
        <p style={{ margin: "8px 0 0", fontSize: 16, color: "#7f8390", letterSpacing: "0.04em" }}>space bar · or type with /</p>
      </div>
    </AbsoluteFill>
  );
}

// ---- 5. The end ---------------------------------------------------------------------------------------------

const REST: Beat[] = [
  { at: 0, state: "done" },
  { at: 1.6, state: "listening" },
];

function End({ t, fade }: { t: number; fade: number }) {
  const size = 420;
  return (
    <AbsoluteFill style={{ opacity: fade, display: "grid", placeItems: "center" }}>
      <div style={{ display: "grid", justifyItems: "center" }}>
        <div style={{ position: "relative", width: size, height: size, marginBottom: -30 }}>
          <Orb size={size} time={t + 40} weights={weightsAt(t, REST)} particles={9000} />
        </div>
        <h1 style={{ margin: 0, fontFamily: sans, fontWeight: 500, fontSize: 92, letterSpacing: "-0.035em", color: "#eeeff4", opacity: ease(t, 0.2, 1.0) }}>
          Command Centre.
        </h1>
        <p style={{ margin: "22px 0 0", fontFamily: mono, fontSize: 22, letterSpacing: "0.08em", color: `rgb(${ORB_COLORS[stateAt(t, REST)].join(",")})`, opacity: ease(t, 0.8, 1.6) }}>
          rsv-studio-vercel.vercel.app/command
        </p>
      </div>
    </AbsoluteFill>
  );
}

// ---- Parts ------------------------------------------------------------------------------------------------

function Device({ x, y, w, h, radius, bezel, children }: { x: number; y: number; w: number; h: number; radius: number; bezel: number; children: ReactNode }) {
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        padding: bezel,
        borderRadius: radius + bezel,
        background: "linear-gradient(145deg, #1b1e25, #0e1014)",
        boxShadow: "0 0 0 1px #ffffff14, 0 50px 120px #000d, inset 0 0 0 1px #ffffff08",
      }}
    >
      <div style={{ position: "relative", width: w, height: h, borderRadius: radius, overflow: "hidden" }}>
        {children}
        <div style={{ position: "absolute", top: 11, left: "50%", width: 104, height: 30, marginLeft: -52, borderRadius: 16, background: "#000" }} />
      </div>
    </div>
  );
}

function Headline({ x, y, a, b, subA, subB, mix, enter }: { x: number; y: number; a: string[]; b: string[]; subA: string; subB: string; mix: number; enter: number }) {
  const block = (lines: string[], sub: string, o: number, dy: number) => (
    <div style={{ position: "absolute", left: 0, top: 0, opacity: o, transform: `translateY(${dy}px)` }}>
      <p style={{ margin: 0, fontFamily: sans, fontWeight: 500, fontSize: 76, lineHeight: 1.04, letterSpacing: "-0.035em", color: "#eeeff4", whiteSpace: "nowrap" }}>
        {lines.map((l) => (
          <span key={l} style={{ display: "block" }}>
            {l}
          </span>
        ))}
      </p>
      <p style={{ margin: "26px 0 0", fontFamily: mono, fontSize: 18, letterSpacing: "0.04em", color: "#7f8390", whiteSpace: "nowrap" }}>{sub}</p>
    </div>
  );
  return (
    <div style={{ position: "absolute", left: x, top: y, opacity: enter, transform: `translateY(${(1 - enter) * 16}px)` }}>
      {block(a, subA, 1 - mix, -mix * 10)}
      {block(b, subB, mix, (1 - mix) * 10)}
    </div>
  );
}
