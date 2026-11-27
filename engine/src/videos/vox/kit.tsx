// Vox-style 2.5D collage kit: a CSS-3D stage (perspective camera, layers at depth, depth-of-field blur), paper cut
// plates with white borders + soft shadows, sticker cutouts, tape labels, highlighter sweeps, hand-drawn strokes that
// draw on, pop-ins with overshoot, idle "alive" wobble on twos, film grain. Everything is a pure function of time.
import React from "react";
import { Img, staticFile } from "remotion";

export const W = 1080, H = 1920, PERSP = 1500;
export const INK = "#1d2a44", CREAM = "#f1e7d0", YEL = "#ffd23a", RED = "#e23b2e", TEAL = "#2f6f7e";
export const SERIF = "'Lora', 'DejaVu Serif', serif", SANS = "'Inter Display', 'Inter', sans-serif", MONO = "'Courier 10 Pitch', 'Courier', monospace";
export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const smooth = (x: number) => { const u = clamp01(x); return u * u * (3 - 2 * u); };
export const glide = (u: number) => { const x = clamp01(u); return x * x * x * (x * (6 * x - 15) + 10); };
export const easeOut = (u: number) => 1 - (1 - clamp01(u)) ** 3;
export const TW = (t: number) => Math.floor(t * 15) / 15;            // animate on twos
export const hh = (i: number, k: number) => { const s = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return s - Math.floor(s); };
/** pop-in scale with overshoot (0 before t0) */
export const pop = (t: number, t0: number, d = 0.38) => { if (t < t0) return 0; const u = (t - t0) / d; return u >= 2.2 ? 1 : 1 - Math.exp(-5.5 * u) * Math.cos(9 * u); };
/** idle life: a slow bob + tilt, quantised on twos */
export const alive = (t: number, seed: number, amp = 1) => { const q = TW(t); return { dy: amp * 7 * Math.sin(q * 1.7 + seed * 2.1), rot: amp * 0.7 * Math.sin(q * 1.3 + seed * 3.7) }; };
export const img = (n: string) => staticFile(`vox/${n}`);

// ---------------- camera + stage ----------------
export type Cam = { x: number; y: number; z: number; roll: number; focus?: number };
export const CamCtx = React.createContext<Cam>({ x: 0, y: 0, z: 0, roll: 0 });
export const Stage: React.FC<{ cam: Cam; bg: string; children: React.ReactNode; tint?: string }> = ({ cam, bg, children, tint }) => (
  <div style={{ position: "absolute", inset: 0, overflow: "hidden", background: "#111", perspective: PERSP, perspectiveOrigin: "50% 50%" }}>
    <CamCtx.Provider value={cam}>
      <div style={{ position: "absolute", left: W / 2, top: H / 2, width: 0, height: 0, transformStyle: "preserve-3d",
        transform: `rotateZ(${cam.roll}deg) translate3d(${-cam.x}px, ${-cam.y}px, ${cam.z}px)` }}>
        <Layer z={-2600} x={cam.x} y={cam.y} w={W * 3.0} h={H * 3.0} sharp><Img src={img(bg)} style={{ width: "100%", height: "100%", objectFit: "cover" }} /></Layer>
        {children}
      </div>
    </CamCtx.Provider>
    {tint && <div style={{ position: "absolute", inset: 0, background: tint, mixBlendMode: "multiply" }} />}
  </div>
);
/** a layer at depth z (px; negative = farther), centred at (x, y), with automatic depth-of-field blur */
export const Layer: React.FC<{ z: number; x?: number; y?: number; w?: number; h?: number; rot?: number; s?: number; children: React.ReactNode; sharp?: boolean; o?: number }> =
  ({ z, x = 0, y = 0, w, h, rot = 0, s = 1, children, sharp, o = 1 }) => {
    const cam = React.useContext(CamCtx);
    const dist = PERSP - (z + cam.z), focus = cam.focus ?? PERSP - cam.z;
    const blur = sharp ? 0 : Math.min(9, Math.abs(dist - focus) * 0.0055);
    return (
      <div style={{ position: "absolute", left: 0, top: 0, width: w, height: h, transformStyle: "preserve-3d", opacity: o,
        transform: `translate3d(${x}px, ${y}px, ${z}px) translate(-50%, -50%) rotateZ(${rot}deg) scale(${s})`, filter: blur > 0.4 ? `blur(${blur.toFixed(1)}px)` : undefined }}>
        {children}
      </div>
    );
  };

// ---------------- paper pieces ----------------
const SHADOW = "0 28px 48px rgba(10,14,28,0.38), 0 6px 10px rgba(10,14,28,0.25)";
/** a printed plate with a white border (and optional tape on the top corners) */
export const Plate: React.FC<{ src: string; w: number; h: number; border?: number; tape?: boolean; children?: React.ReactNode }> = ({ src, w, h, border = 16, tape = true, children }) => (
  <div style={{ position: "relative", width: w, height: h, background: "#fbf7ee", padding: border, boxSizing: "border-box", boxShadow: SHADOW }}>
    <Img src={img(src)} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
    {children}
    {tape && [[-0.06, -20, -14], [0.94, -20, 12]].map(([fx, dy, r], i) => (
      <div key={i} style={{ position: "absolute", left: fx * w, top: dy, width: 0.16 * w + 40, height: 46, background: "rgba(233,220,180,0.82)", transform: `rotate(${r}deg)`, boxShadow: "0 2px 4px rgba(0,0,0,0.12)" }} />
    ))}
  </div>
);
/** a cut-out sticker (alpha PNG) with a white outline and soft shadow */
export const Cut: React.FC<{ src: string; w: number; flip?: boolean }> = ({ src, w, flip }) => (
  <Img src={img(src)} style={{ width: w, display: "block", transform: flip ? "scaleX(-1)" : undefined,
    filter: "drop-shadow(5px 0 0 #fbf7ee) drop-shadow(-5px 0 0 #fbf7ee) drop-shadow(0 5px 0 #fbf7ee) drop-shadow(0 -5px 0 #fbf7ee) drop-shadow(0 22px 22px rgba(10,14,28,0.4))" }} />
);
/** a strip of tape / paper label with text */
export const Tape: React.FC<{ text: string; size?: number; col?: string; bg?: string; font?: string; pad?: number }> = ({ text, size = 46, col = INK, bg = "#efe3bf", font = SANS, pad = 26 }) => (
  <div style={{ padding: `${pad * 0.55}px ${pad}px`, background: bg, color: col, fontFamily: font, fontWeight: 800, fontSize: size, letterSpacing: 1.5, whiteSpace: "nowrap",
    boxShadow: "0 10px 18px rgba(10,14,28,0.3)", clipPath: "polygon(0 6%, 3% 0, 97% 4%, 100% 0, 99% 50%, 100% 100%, 96% 95%, 3% 100%, 0 96%, 1% 50%)" }}>{text}</div>
);
/** text with a yellow highlighter sweep behind it (p 0..1) */
export const Hi: React.FC<{ p: number; children: React.ReactNode; col?: string }> = ({ p, children, col = YEL }) => (
  <span style={{ backgroundImage: `linear-gradient(${col}, ${col})`, backgroundRepeat: "no-repeat", backgroundPosition: "0 78%", backgroundSize: `${(clamp01(p) * 100).toFixed(1)}% 46%`, padding: "0 6px" }}>{children}</span>
);
/** a hand-drawn stroke (SVG path) that draws on over [t0, t0+d] */
export const Stroke: React.FC<{ d: string; w: number; h: number; t: number; t0: number; dur?: number; col?: string; sw?: number; len?: number }> = ({ d, w, h, t, t0, dur = 0.45, col = RED, sw = 10, len = 3000 }) => {
  const p = easeOut((t - t0) / dur);
  if (p <= 0) return null;
  return <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ overflow: "visible" }}><path d={d} fill="none" stroke={col} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={len} strokeDashoffset={len * (1 - p)} /></svg>;
};
/** a rough circle path around a w x h box */
export const ring = (w: number, h: number, seed = 1) => {
  const pts: string[] = [];
  for (let i = 0; i <= 40; i++) { const a = -0.4 + (i / 40) * Math.PI * 2.15, r = 1 + 0.05 * Math.sin(i * 0.9 + seed); pts.push(`${(w / 2 + (w / 2) * r * Math.cos(a)).toFixed(1)},${(h / 2 + (h / 2) * r * Math.sin(a)).toFixed(1)}`); }
  return "M" + pts.join(" L");
};
/** film grain + vignette overlay */
export const Grain: React.FC<{ f: number; k?: number }> = ({ f, k = 0.16 }) => (
  <>
    <Img src={img(`grain${Math.floor(f / 2) % 4}.png`)} style={{ position: "absolute", inset: 0, width: W, height: H, opacity: k, mixBlendMode: "overlay", pointerEvents: "none" }} />
    <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 55%, rgba(8,10,20,0.42) 100%)", pointerEvents: "none" }} />
  </>
);
/** floating dust specks at several depths (parallax + life) */
export const Dust: React.FC<{ t: number; n?: number; col?: string }> = ({ t, n = 26, col = "rgba(255,248,230,0.55)" }) => (
  <>{Array.from({ length: n }, (_, i) => {
    const z = -1400 + 1600 * hh(i, 1), x = -900 + 1800 * hh(i, 2) + 40 * Math.sin(t * 0.3 + i), y = -1500 + 3000 * ((hh(i, 3) + t * 0.012 * (1 + hh(i, 4))) % 1);
    return <Layer key={i} z={z} x={x} y={y} sharp><div style={{ width: 6 + 8 * hh(i, 5), height: 6 + 8 * hh(i, 5), borderRadius: 99, background: col, filter: "blur(1.5px)" }} /></Layer>;
  })}</>
);
