// A visible pointer for the recording. Headless browsers draw no cursor, so without this every click in
// the video would happen by itself. It is drawn from the real input events Playwright sends, never
// positioned by hand, so it is always exactly where the interaction happened.
//
// Plain browser JavaScript on purpose: it is injected into the page as-is (addInitScript with a path).
// A TypeScript function passed through tsx would carry compiler helpers the page doesn't have.
// record.ts sets window.__demoPointerKind to "mouse" or "touch" before this runs.
(() => {
  const kind = window.__demoPointerKind === "touch" ? "touch" : "mouse";
  const KEY = "__demoPointer";
  const read = () => {
    try {
      return JSON.parse(sessionStorage.getItem(KEY) || "null");
    } catch {
      return null;
    }
  };
  let pos = read() || { x: window.innerWidth * 0.62, y: window.innerHeight * 0.58 };
  let cursor = null;

  const place = () => {
    if (!cursor) return;
    // React hydrates the whole document and drops nodes it didn't render, this one included.
    if (!cursor.isConnected) document.documentElement.appendChild(cursor);
    cursor.style.transform = `translate(${pos.x}px, ${pos.y}px)`;
  };
  const move = (x, y) => {
    // Chromium reports 0,0 on the last event of a drag; ignore it rather than jump to the corner.
    if (x === 0 && y === 0) return;
    pos = { x, y };
    try {
      sessionStorage.setItem(KEY, JSON.stringify(pos));
    } catch {}
    place();
  };

  const ripple = (x, y) => {
    const size = kind === "touch" ? 46 : 34;
    const dot = document.createElement("div");
    Object.assign(dot.style, {
      position: "fixed", left: `${x - size / 2}px`, top: `${y - size / 2}px`, width: `${size}px`, height: `${size}px`,
      borderRadius: "50%", pointerEvents: "none", zIndex: "2147483646",
      background: kind === "touch" ? "rgba(255,255,255,0.28)" : "rgba(99,102,241,0.25)",
      border: kind === "touch" ? "2px solid rgba(255,255,255,0.85)" : "2px solid rgba(129,140,248,0.9)",
      boxShadow: "0 2px 10px rgba(0,0,0,0.35)",
    });
    document.documentElement.appendChild(dot);
    const anim = dot.animate(
      [
        { transform: "scale(0.5)", opacity: 1 },
        { transform: "scale(1.25)", opacity: 0 },
      ],
      { duration: 520, easing: "cubic-bezier(0.23, 1, 0.32, 1)" },
    );
    anim.onfinish = () => dot.remove();
  };

  const setup = () => {
    if (kind !== "mouse" || document.getElementById("__demo_cursor")) return;
    cursor = document.createElement("div");
    cursor.id = "__demo_cursor";
    Object.assign(cursor.style, {
      position: "fixed", left: "0", top: "0", width: "22px", height: "22px", pointerEvents: "none",
      zIndex: "2147483647", willChange: "transform", filter: "drop-shadow(0 2px 3px rgba(0,0,0,0.45))",
    });
    // A standard arrow with its tip at the element's top-left, which is where the event happened.
    cursor.innerHTML =
      '<svg width="22" height="22" viewBox="0 0 22 22" xmlns="http://www.w3.org/2000/svg">' +
      '<path d="M2 1.5 L2 17.5 L6.3 13.4 L9.2 20 L12 18.8 L9.1 12.3 L15 12.3 Z" fill="#ffffff" stroke="#0b0e14" stroke-width="1.4" stroke-linejoin="round"/>' +
      "</svg>";
    document.documentElement.appendChild(cursor);
    place();
    // Put it back promptly after hydration, not only on the next mouse move.
    setInterval(place, 200);
  };

  window.addEventListener("mousemove", (e) => move(e.clientX, e.clientY), true);
  window.addEventListener("dragover", (e) => move(e.clientX, e.clientY), true);
  window.addEventListener(
    "pointerdown",
    (e) => {
      move(e.clientX, e.clientY);
      ripple(e.clientX, e.clientY);
    },
    true,
  );

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", setup);
  else setup();
})();
