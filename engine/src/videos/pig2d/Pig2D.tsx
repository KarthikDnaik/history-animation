// 2D Pig War: the reference-reel drawing style (SVG puppets) with the same voice, captions and editing layer.
import React, { useEffect, useState } from "react";
import { AbsoluteFill, continueRender, delayRender, getInputProps, staticFile, useCurrentFrame } from "remotion";
import { TOTAL } from "../pig/story";
import { Captions } from "../pig/captions";
import { transAt, TAGS, IMPACT, MOOD } from "../pig/edit";
import { ShotAt } from "./shots";

export const PIG2D_FRAMES = TOTAL;
const useFonts = () => {
  const [h] = useState(() => delayRender("fonts"));
  useEffect(() => {
    const ff = [new FontFace("Luckiest", `url(${staticFile("fonts/Luckiest.woff2")})`)];
    Promise.all(ff.map((x) => x.load())).then((l) => { l.forEach((x) => (document as any).fonts.add(x)); continueRender(h); }).catch(() => continueRender(h));
  }, [h]);
};

/** cut transitions (edit.ts): directional motion-blur whip (SVG blur on one axis) or a spin-blur, both scaled past the
 *  frame edge so the background never shows */
const transStyle = (f: number): { st: React.CSSProperties; blur: number } => {
  const t = transAt(f);
  if (!t) return { st: {}, blur: 0 };
  const s = (t.out ? 1 : -1) * t.dir;
  if (t.kind === "whip") return { st: { transform: `translateX(${s * 90 * t.u}px) scale(${1 + 0.2 * t.u})`, filter: "url(#whipblur)" }, blur: 70 * t.u };
  return { st: { transform: `rotate(${s * 32 * t.u}deg) scale(${1.2 + 0.5 * t.u})`, filter: `blur(${16 * t.u}px)` }, blur: 0 };
};
const moodFilter = (f: number) => {
  const k = f < MOOD.a || f >= MOOD.b ? 0 : Math.min(1, (f - MOOD.a + 1) / 5);
  return k ? `saturate(${1 - 0.5 * k}) brightness(${1 - 0.2 * k}) contrast(${1 + 0.1 * k}) hue-rotate(${-8 * k}deg)` : "";
};
/** lower third in the caption slot (reference "POPE INNOCENT IV"): a thin line draws out (3 f), opens into the bar
 *  (3 f), holds, collapses back to a line (3 f). Captions give way while it is up. */
const NameTag: React.FC<{ f: number }> = ({ f }) => {
  const g = TAGS.find((x) => f >= x.a && f < x.b);
  if (!g) return null;
  const k = f - g.a, left = g.b - f - 1;
  const wide = Math.min(1, (k + 1) / 3) * Math.min(1, (left + 1) / 2), tall = Math.max(0, Math.min(1, (k - 2) / 3, left / 3));
  return (
    <AbsoluteFill style={{ alignItems: "center", pointerEvents: "none" }}>
      <div style={{ position: "absolute", top: "73%", transform: "translateY(-50%)", display: "flex", alignItems: "center", gap: 12, width: `${78 * wide}%`, justifyContent: "center" }}>
        <div style={{ width: 14, height: 8 + 70 * tall, background: g.col, borderRadius: 2, flex: "none" }} />
        <div style={{ flex: 1, background: "rgba(12,14,22,0.9)", height: 8 + 92 * tall, borderRadius: 4, overflow: "hidden", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <div style={{ opacity: tall, fontFamily: "'Inter Display','Inter',sans-serif", fontWeight: 900, fontSize: 48, letterSpacing: 6, color: "#ffffff", lineHeight: 1.05, whiteSpace: "nowrap" }}>{g.name}</div>
          <div style={{ opacity: tall, fontFamily: "'Inter Display','Inter',sans-serif", fontWeight: 700, fontSize: 24, letterSpacing: 8, color: "#cfdcff", marginTop: 2 }}>{g.sub}</div>
        </div>
        <div style={{ width: 14, height: 8 + 70 * tall, background: g.col, borderRadius: 2, flex: "none" }} />
      </div>
    </AbsoluteFill>
  );
};
/** dip to black with the red punchline caption (edit.ts IMPACT) */
const Impact: React.FC<{ f: number }> = ({ f }) => {
  if (f < IMPACT.a || f >= IMPACT.b + IMPACT.up) return null;
  const k = f - IMPACT.a, black = f < IMPACT.b ? Math.min(1, (k + 1) / IMPACT.out) : 1 - (f - IMPACT.b + 1) / (IMPACT.up + 1);
  const kp = f >= IMPACT.pig ? f - IMPACT.pig : k, sc = kp < 3 ? [1.3, 0.95, 1.02][kp] : 1;
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <AbsoluteFill style={{ background: "#040304", opacity: black }} />
      {f < IMPACT.b && (
        <AbsoluteFill style={{ alignItems: "center" }}>
          <div style={{ position: "absolute", top: "73%", transform: `translateY(-50%) scale(${sc})`, fontFamily: "'Inter Display','Inter',sans-serif", fontWeight: 900, fontSize: 132,
            color: "#e8262f", WebkitTextStroke: "16px #0c0a0e", paintOrder: "stroke fill", letterSpacing: 1 }}>{f < IMPACT.pig ? "ONE" : IMPACT.text}</div>
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};
export const Pig2DShort: React.FC = () => {
  const f = useCurrentFrame();
  useFonts();
  const tr = transStyle(f), mood = moodFilter(f);
  const impact = (f >= IMPACT.a && f < IMPACT.b) || TAGS.some((x) => f >= x.a && f < x.b);
  return (
    <AbsoluteFill style={{ background: "#0b0a10" }}>
      <svg width="0" height="0" style={{ position: "absolute" }}>
        <filter id="whipblur" x="-20%" y="0" width="140%" height="100%"><feGaussianBlur stdDeviation={`${tr.blur.toFixed(1)} 0`} edgeMode="duplicate" /></filter>
      </svg>
      <AbsoluteFill style={{ ...tr.st, ...(mood ? { filter: [tr.st.filter, mood].filter(Boolean).join(" ") } : {}) }}>
        <ShotAt F={f} />
      </AbsoluteFill>
      <NameTag f={f} />
      <Impact f={f} />
      {(getInputProps() as { caps?: boolean }).caps === false || impact ? null : <Captions />}
    </AbsoluteFill>
  );
};
