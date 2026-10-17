import { useCurrentFrame } from "remotion";
import { CREAM, FPS, GOLD, SHOTS, T } from "../data";
import { MONO, SANS, SERIF } from "../fonts";
import { Abs, IconCalendar, IconCap, eyebrow, glass, goldText, lerp, outBack, outExpo, prog, spring, win } from "../ui";

const money = (n: number) => "$" + Math.round(n).toLocaleString("en-US");

/** Hook, behind his head: a gold $ counter rolls to $5,000 on "5k", "/ month online" settles under it. */
export const HookMoney = () => {
  const t = useCurrentFrame() / FPS;
  const end = SHOTS[1];
  if (t > end + 0.1) return null;
  const a = win(t, 0.02, end + 0.05, 0.25, 0.25);
  const roll = prog(t, 0.1, T.k5 + 0.1 - 0.1, (x) => 1 - Math.pow(1 - x, 3));
  const pop = spring(t, T.k5 - 0.02, 2.6, 7);
  const sub = prog(t, T.month - 0.05, 0.4, outExpo);
  return (
    <Abs style={{ left: 0, right: 0, top: 120, display: "flex", flexDirection: "column", alignItems: "center", opacity: a }}>
      <div style={{ ...eyebrow, fontSize: 26, opacity: prog(t, 0.15, 0.3), marginBottom: 6 }}>Up to</div>
      <div
        style={{
          fontFamily: SERIF,
          fontSize: 250,
          lineHeight: "230px",
          letterSpacing: -6,
          ...goldText,
          transform: `scale(${lerp(0.9, 1, Math.min(1.15, pop))})`,
          filter: "drop-shadow(0 10px 40px rgba(232,194,122,0.35))",
        }}
      >
        {money(roll * 5000)}
      </div>
      <div style={{ display: "flex", gap: 16, alignItems: "baseline", opacity: sub, transform: `translateY(${(1 - sub) * 20}px)` }}>
        <span style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 76, color: CREAM }}>a month</span>
        <span style={{ fontFamily: SANS, fontWeight: 800, fontSize: 40, color: CREAM, letterSpacing: 8, opacity: prog(t, T.online1 - 0.05, 0.3) }}>ONLINE</span>
      </div>
    </Abs>
  );
};

/** "This is exactly what I'd do": a playbook chip lands over the table. */
export const PlaybookChip = () => {
  const t = useCurrentFrame() / FPS;
  const s = T.exactly - 0.1;
  const e = SHOTS[1];
  if (t < s || t > e + 0.1) return null;
  const p = spring(t, s, 2.2, 7);
  return (
    <Abs style={{ left: 0, right: 0, top: 1330, display: "flex", justifyContent: "center", opacity: win(t, s, e + 0.05, 0.15, 0.2) }}>
      <div style={{ ...glass, borderRadius: 999, padding: "18px 34px", display: "flex", alignItems: "center", gap: 18, transform: `scale(${lerp(0.6, 1, Math.min(1.1, p))})` }}>
        <span style={{ fontFamily: MONO, fontSize: 24, color: GOLD, letterSpacing: 3 }}>3 STEPS</span>
        <span style={{ width: 2, height: 30, background: "rgba(255,255,255,0.25)" }} />
        <span style={{ fontWeight: 700, fontSize: 38 }}>The exact playbook</span>
      </div>
    </Abs>
  );
};

/** "Six months ago": calendar chip, months flip back from today. */
export const MonthsAgo = () => {
  const t = useCurrentFrame() / FPS;
  const s = T.six - 0.15;
  const e = T.high - 0.05;
  if (t < s || t > e + 0.3) return null;
  const p = spring(t, s, 2.2, 7);
  const n = Math.round(prog(t, s + 0.05, T.months + 0.3 - s, outExpo) * 6);
  return (
    <Abs style={{ left: 70, top: 300, opacity: win(t, s, e + 0.25, 0.15, 0.25), transform: `translateX(${(1 - Math.min(1, p)) * -80}px)` }}>
      <div style={{ ...glass, borderRadius: 28, padding: "20px 28px", display: "flex", alignItems: "center", gap: 20 }}>
        <IconCalendar size={56} color={GOLD} sw={1.8} />
        <div>
          <div style={{ fontFamily: SERIF, fontSize: 80, lineHeight: "76px", ...goldText }}>{n} months</div>
          <div style={{ ...eyebrow, fontSize: 22, color: CREAM, opacity: 0.8 }}>ago</div>
        </div>
      </div>
    </Abs>
  );
};

/** "The high value skill of appointment setting": the skill card with a gold underline sweep. */
export const SkillCard = () => {
  const t = useCurrentFrame() / FPS;
  const s = T.high - 0.12;
  const e = T.money - 0.1;
  if (t < s || t > e + 0.3) return null;
  const p = spring(t, s, 1.8, 7);
  const title = prog(t, T.appointment1 - 0.1, 0.45, outExpo);
  const line = prog(t, T.setting - 0.25, 0.5, outExpo);
  return (
    <Abs style={{ left: 90, right: 90, top: 1110, opacity: win(t, s, e + 0.25, 0.18, 0.25), transform: `translateY(${(1 - Math.min(1, p)) * 90}px) scale(${lerp(0.92, 1, Math.min(1, p))})` }}>
      <div style={{ ...glass, borderRadius: 36, padding: "30px 40px 34px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={eyebrow}>High-value skill</span>
          <span style={{ fontFamily: MONO, fontSize: 22, color: "rgba(251,244,232,0.6)" }}>{Math.round(prog(t, s, 0.8) * 100)}%</span>
        </div>
        <div style={{ height: 8, borderRadius: 4, background: "rgba(255,255,255,0.12)", marginTop: 14, overflow: "hidden" }}>
          <div style={{ width: `${prog(t, s, 0.8) * 100}%`, height: "100%", background: `linear-gradient(90deg, #B98A3E, ${GOLD}, #FFE3A6)` }} />
        </div>
        <div style={{ position: "relative", marginTop: 22, fontFamily: SERIF, fontStyle: "italic", fontSize: 96, lineHeight: "96px", color: CREAM, opacity: title, transform: `translateY(${(1 - title) * 30}px)`, whiteSpace: "nowrap" }}>
          Appointment <span style={goldText}>setting</span>
          <div style={{ position: "absolute", left: 0, bottom: -10, height: 5, width: `${line * 100}%`, borderRadius: 3, background: `linear-gradient(90deg, ${GOLD}, rgba(232,194,122,0))` }} />
        </div>
      </div>
    </Abs>
  );
};

/** "As a 19 year old, also still in education": the age block and a student chip. */
export const AgeBlock = () => {
  const t = useCurrentFrame() / FPS;
  const s = T.money - 0.1;
  const e = SHOTS[2];
  if (t < s || t > e + 0.1) return null;
  const card = spring(t, s, 1.8, 7);
  const n = spring(t, T.n19 - 0.06, 2.8, 7);
  const edu = prog(t, T.education - 0.25, 0.4, outBack);
  return (
    <Abs style={{ left: 90, right: 90, top: 1060, opacity: win(t, s, e + 0.05, 0.18, 0.2), display: "flex", flexDirection: "column", alignItems: "center", gap: 22 }}>
      <div style={{ ...glass, borderRadius: 36, padding: "26px 44px", display: "flex", alignItems: "center", gap: 32, transform: `scale(${lerp(0.85, 1, Math.min(1, card))})` }}>
        <div style={{ ...eyebrow, fontSize: 22, lineHeight: "34px" }}>
          Making money
          <br />
          online at
        </div>
        <div style={{ fontFamily: SERIF, fontSize: 190, lineHeight: "170px", ...goldText, transform: `scale(${lerp(0.4, 1, Math.min(1.15, n))})`, opacity: Math.min(1, n * 2) }}>19</div>
        <div style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 54, color: CREAM, opacity: prog(t, T.n19 + 0.3, 0.3) }}>years old</div>
      </div>
      <div style={{ ...glass, borderRadius: 999, padding: "14px 28px", display: "flex", alignItems: "center", gap: 14, opacity: edu, transform: `translateY(${(1 - edu) * 30}px)` }}>
        <IconCap size={40} color={GOLD} sw={1.8} />
        <span style={{ fontWeight: 700, fontSize: 34 }}>Still in education</span>
      </div>
    </Abs>
  );
};
