import type { CSSProperties, ReactNode } from "react";

// Social app icons drawn in code (simplified glyphs, 24-unit viewBox) for the "block all your social media" beat.
const Tile = ({ size, bg, children, style }: { size: number; bg: string; children: ReactNode; style?: CSSProperties }) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: size * 0.225,
      background: bg,
      overflow: "hidden",
      position: "relative",
      boxShadow: `0 ${size * 0.1}px ${size * 0.26}px rgba(30,6,12,0.4), inset 0 1px 0 rgba(255,255,255,0.25)`,
      ...style,
    }}
  >
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ position: "absolute", inset: 0 }}>
      {children}
    </svg>
  </div>
);

const TT = "M16.2 6.6a3.9 3.9 0 0 1-.9-2.5h-2.8v11.3a2.4 2.4 0 1 1-1.7-2.3V10.2a5.2 5.2 0 1 0 4.5 5.2V9.6a6.6 6.6 0 0 0 3.9 1.3V8.1a3.9 3.9 0 0 1-3-1.5z";
export const TikTok = ({ size, style }: { size: number; style?: CSSProperties }) => (
  <Tile size={size} bg="#0B0B0F" style={style}>
    <path d={TT} fill="#25F4EE" transform="translate(-0.45 -0.45)" />
    <path d={TT} fill="#FE2C55" transform="translate(0.45 0.45)" />
    <path d={TT} fill="#fff" />
  </Tile>
);
export const Instagram = ({ size, style }: { size: number; style?: CSSProperties }) => (
  <Tile size={size} bg="radial-gradient(circle at 30% 107%, #fdf497 0%, #fdf497 5%, #fd5949 45%, #d6249f 60%, #285AEB 90%)" style={style}>
    <rect x="5.2" y="5.2" width="13.6" height="13.6" rx="4" fill="none" stroke="#fff" strokeWidth="1.7" />
    <circle cx="12" cy="12" r="3.3" fill="none" stroke="#fff" strokeWidth="1.7" />
    <circle cx="16.1" cy="7.9" r="0.95" fill="#fff" />
  </Tile>
);
export const YouTube = ({ size, style }: { size: number; style?: CSSProperties }) => (
  <Tile size={size} bg="#fff" style={style}>
    <rect x="3" y="6.4" width="18" height="11.2" rx="3.4" fill="#FF0033" />
    <path d="M10.2 9.4v5.2l4.6-2.6z" fill="#fff" />
  </Tile>
);
export const Snapchat = ({ size, style }: { size: number; style?: CSSProperties }) => (
  <Tile size={size} bg="#FFFC00" style={style}>
    <path
      d="M12 4.6c2.6 0 4.3 1.9 4.3 4.4v2l1.5-.5.4.8-1.8 1c.5 1.5 1.5 2.4 2.9 2.9-.3.6-1.3.8-2.2.9-.2.5-.3.9-.5 1.1-.8-.2-1.7-.1-2.4.4-.7.4-1.3.8-2.2.8s-1.5-.4-2.2-.8c-.7-.5-1.6-.6-2.4-.4-.2-.2-.3-.6-.5-1.1-.9-.1-1.9-.3-2.2-.9 1.4-.5 2.4-1.4 2.9-2.9l-1.8-1 .4-.8 1.5.5V9c0-2.5 1.7-4.4 4.3-4.4z"
      fill="#fff"
      stroke="#111"
      strokeWidth="0.75"
      strokeLinejoin="round"
    />
  </Tile>
);
export const XApp = ({ size, style }: { size: number; style?: CSSProperties }) => (
  <Tile size={size} bg="#0B0B0F" style={style}>
    <path d="M6 5.6h3.6l8.4 12.8h-3.6z" fill="#fff" />
    <path d="M17.6 5.6 6.4 18.4" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
  </Tile>
);
export const Facebook = ({ size, style }: { size: number; style?: CSSProperties }) => (
  <Tile size={size} bg="#1877F2" style={style}>
    <path d="M13.5 21v-7.3h2.4l.4-2.9h-2.8V9c0-.8.3-1.4 1.4-1.4h1.5V5c-.3 0-1.1-.1-2.1-.1-2.2 0-3.6 1.3-3.6 3.7v2.1H8.3v2.9h2.4V21z" fill="#fff" />
  </Tile>
);

export const SOCIAL = [TikTok, Instagram, YouTube, Snapchat, XApp, Facebook];
