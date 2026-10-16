import { AbsoluteFill, useCurrentFrame } from "remotion";
import { CORAL, CREAM, FPS, INK, T } from "../data";
import { MONO, SANS, SERIF } from "../fonts";
import { Abs, AppIcon, Heart, IconLink, IconSearch, Star, bump, card, clamp01, glass, inOutCubic, lerp, outExpo, prog, rnd, spring } from "../ui";

// "search FocusDeen on the App Store or the link is in my bio": an App Store search that types itself, the real
// listing (icon, name, 5.0 rating), GET pressed and downloading; then a link-in-bio pill; then the end card.
const IOS_BLUE = "#0A84FF";

export const AppStore = () => {
  const t = useCurrentFrame() / FPS;
  if (t < T.try - 0.4 || t > T.endCard + 0.1) return null;
  const inP = spring(t, T.try - 0.35, 1.7, 7.5);
  const query = "FocusDeen";
  const typed = Math.round(clamp01((t - T.search + 0.02) / 0.62) * query.length);
  const res = spring(t, T.store - 0.42, 1.8, 8);
  const press = bump(t - T.store - 0.02, 0.22);
  const dl = prog(t, T.store + 0.2, 0.9, inOutCubic);
  const opened = t > T.store + 1.15;
  const H = lerp(150, 400, clamp01(res));
  const caret = Math.floor(t * 2.4) % 2 === 0 && !(res > 0.2);
  return (
    <Abs
      style={{
        left: 52,
        top: 96,
        width: 976,
        height: H,
        ...card,
        borderRadius: 42,
        background: "rgba(255,255,255,0.97)",
        overflow: "hidden",
        opacity: clamp01(inP * 2),
        transform: `translateY(${(1 - Math.min(1, inP)) * -90}px)`,
      }}
    >
      {/* search field */}
      <Abs style={{ left: 30, right: 30, top: 30, height: 90, borderRadius: 24, background: "#F0EEF2", display: "flex", alignItems: "center", padding: "0 26px", gap: 18 }}>
        <IconSearch size={44} color="#8E8A93" sw={2.6} />
        <span style={{ fontSize: 44, fontWeight: 500, letterSpacing: -0.8, color: typed ? INK : "#A19DA6" }}>
          {typed ? query.slice(0, typed) : "Games, Apps and more"}
          <span style={{ display: "inline-block", width: 4, height: 50, marginLeft: 3, verticalAlign: -8, background: IOS_BLUE, opacity: caret ? 1 : 0 }} />
        </span>
        <span style={{ marginLeft: "auto", fontFamily: MONO, fontSize: 22, letterSpacing: 4, color: "#A19DA6" }}>APP STORE</span>
      </Abs>
      {/* result */}
      <Abs style={{ left: 30, right: 30, top: 150, height: 220, display: "flex", alignItems: "center", gap: 30, opacity: clamp01(res * 1.5), transform: `translateY(${(1 - clamp01(res)) * 30}px)` }}>
        <AppIcon size={170} style={{ boxShadow: "0 10px 26px rgba(40,10,20,0.22)" }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 44, fontWeight: 700, letterSpacing: -1, lineHeight: "50px" }}>FocusDeen</div>
          <div style={{ fontSize: 31, fontWeight: 500, color: "#7C7680", lineHeight: "40px", marginTop: 2 }}>Muslim Screen Time</div>
          <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 10 }}>
            {[0, 1, 2, 3, 4].map((i) => (
              <Star key={i} size={30} color="#FF9F0A" />
            ))}
            <span style={{ fontSize: 28, color: "#7C7680", marginLeft: 10, fontWeight: 600 }}>5.0</span>
          </div>
        </div>
        {/* GET → progress ring → OPEN */}
        <div style={{ width: 190, height: 84, position: "relative", transform: `scale(${1 - press * 0.12})` }}>
          {dl > 0 && !opened ? (
            <svg width="84" height="84" viewBox="0 0 84 84" style={{ position: "absolute", left: 53 }}>
              <circle cx="42" cy="42" r="34" fill="none" stroke="#E6E3EA" strokeWidth="7" />
              <circle cx="42" cy="42" r="34" fill="none" stroke={IOS_BLUE} strokeWidth="7" strokeDasharray={214} strokeDashoffset={214 * (1 - dl)} transform="rotate(-90 42 42)" strokeLinecap="round" />
              <rect x="33" y="33" width="18" height="18" rx="3" fill={IOS_BLUE} />
            </svg>
          ) : (
            <div
              style={{
                width: 190,
                height: 84,
                borderRadius: 42,
                background: "#EDEBF2",
                color: IOS_BLUE,
                fontWeight: 800,
                fontSize: 38,
                letterSpacing: 0.5,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {opened ? "OPEN" : "GET"}
            </div>
          )}
        </div>
      </Abs>
      {/* tap ripple on GET */}
      <Abs
        style={{
          left: 976 - 30 - 95 - 70,
          top: 150 + 110 - 70,
          width: 140,
          height: 140,
          borderRadius: "50%",
          background: "rgba(10,132,255,0.25)",
          transform: `scale(${lerp(0.2, 1.4, prog(t, T.store - 0.02, 0.4))})`,
          opacity: 1 - prog(t, T.store - 0.02, 0.4),
          display: t > T.store - 0.02 ? "block" : "none",
        }}
      />
    </Abs>
  );
};

export const LinkInBio = () => {
  const t = useCurrentFrame() / FPS;
  if (t < T.link - 0.3 || t > T.endCard + 0.1) return null;
  const p = spring(t, T.link - 0.25, 2, 7.5);
  const tap = prog(t, T.link + 0.35, 0.45);
  return (
    <Abs style={{ left: 0, right: 0, top: 1360, display: "flex", justifyContent: "center", opacity: clamp01(p * 2), transform: `translateY(${(1 - Math.min(1, p)) * 50}px) scale(${1 - bump(t - T.link - 0.33, 0.2) * 0.06})` }}>
      <div style={{ ...glass, borderRadius: 60, padding: "18px 40px 18px 22px", display: "flex", alignItems: "center", gap: 22, fontFamily: SANS, color: "#fff", position: "relative" }}>
        <div style={{ width: 76, height: 76, borderRadius: 38, background: CORAL, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <IconLink size={44} color="#fff" sw={2.6} />
        </div>
        <div>
          <div style={{ fontSize: 44, fontWeight: 800, letterSpacing: -1 }}>Link in bio</div>
          <div style={{ fontFamily: MONO, fontSize: 24, letterSpacing: 3, color: "#FFCFCB" }}>@buildwithcheick</div>
        </div>
        <Abs style={{ right: 60, top: 40, width: 60, height: 60, borderRadius: 30, border: "3px solid #fff", transform: `scale(${lerp(0.3, 2.2, tap)})`, opacity: (1 - tap) * (tap > 0 ? 1 : 0) }} />
      </div>
    </Abs>
  );
};

/** End card: coral wipe, the mascot, the name, the tagline, where to get it. */
export const EndCard = () => {
  const t = useCurrentFrame() / FPS;
  const s = T.endCard - 0.12;
  if (t < s) return null;
  const wipe = prog(t, s, 0.45, inOutCubic);
  const heart = spring(t, s + 0.2, 1.6, 6);
  const name = prog(t, s + 0.32, 0.45, outExpo);
  const tag = prog(t, s + 0.45, 0.45, outExpo);
  const pill = prog(t, s + 0.6, 0.45, outExpo);
  return (
    <AbsoluteFill style={{ clipPath: `circle(${lerp(0, 2300, wipe)}px at 540px 960px)` }}>
      <AbsoluteFill style={{ background: `radial-gradient(ellipse 85% 60% at 50% 42%, #FF8A8C 0%, ${CORAL} 48%, #D3303B 100%)` }} />
      {Array.from({ length: 14 }).map((_, i) => {
        const sz = 30 + rnd(i * 4.4) * 120;
        return (
          <Abs
            key={i}
            style={{
              left: rnd(i * 1.7) * 1080,
              top: rnd(i * 8.1) * 1920 - (t - s) * (30 + rnd(i) * 50),
              width: sz,
              height: sz,
              borderRadius: "50%",
              background: "rgba(255,240,232,0.15)",
              filter: `blur(${6 + rnd(i) * 10}px)`,
            }}
          />
        );
      })}
      <Abs style={{ left: 540 - 170, top: 470 + Math.sin((t - s) * 3) * 8, transform: `scale(${Math.max(0, heart)}) rotate(${(1 - Math.min(1, heart)) * -12}deg)`, filter: "drop-shadow(0 30px 40px rgba(90,8,20,0.45))" }}>
        <Heart size={340} />
      </Abs>
      <Abs style={{ left: 0, right: 0, top: 880, textAlign: "center", fontFamily: SANS, fontWeight: 800, fontSize: 160, letterSpacing: -6, color: "#fff", opacity: name, transform: `translateY(${(1 - name) * 40}px)`, textShadow: "0 12px 36px rgba(110,8,22,0.4)" }}>
        Focus<span style={{ fontWeight: 400, fontFamily: SERIF, fontStyle: "italic", letterSpacing: -2 }}>Deen</span>
      </Abs>
      <Abs style={{ left: 0, right: 0, top: 1080, textAlign: "center", fontFamily: SERIF, fontStyle: "italic", fontSize: 76, color: CREAM, opacity: tag, transform: `translateY(${(1 - tag) * 30}px)` }}>
        Pray first. Unlock after.
      </Abs>
      <Abs style={{ left: 0, right: 0, top: 1250, display: "flex", justifyContent: "center", opacity: pill, transform: `translateY(${(1 - pill) * 30}px)` }}>
        <div style={{ background: "#fff", color: INK, borderRadius: 60, padding: "22px 44px", fontFamily: SANS, fontWeight: 700, fontSize: 40, letterSpacing: -0.6, display: "flex", alignItems: "center", gap: 16, boxShadow: "0 20px 50px rgba(110,8,22,0.35)" }}>
          <IconSearch size={40} color={INK} sw={2.6} /> Search “FocusDeen” on the App Store
        </div>
      </Abs>
    </AbsoluteFill>
  );
};
