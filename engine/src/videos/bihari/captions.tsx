// Word-by-word captions in the RicksClips style: 1-2 words at a time, chunky white type with a thick black outline,
// popping in (overshoot) on each new group, centred a little below the middle of the frame.
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import WJ from "./words.json";
import { FPS } from "./story";

type W = { w: string; s: number; e: number; line: number };
const WORDS = (WJ as unknown as { words: W[] }).words;
type G = { text: string; a: number; b: number };

const groups = (() => {
  const out: G[] = [];
  let cur: W[] = [];
  const flush = (next?: W) => {
    if (!cur.length) return;
    const a = cur[0].s, last = cur[cur.length - 1];
    out.push({ text: cur.map((w) => w.w).join(" "), a, b: next && next.s - last.e < 0.6 ? next.s : last.e + 0.25 });
    cur = [];
  };
  WORDS.forEach((w, i) => {
    cur.push(w);
    const nx = WORDS[i + 1];
    const chars = cur.map((x) => x.w).join(" ").length;
    const brk = !nx || /[.,!?…:;]$/.test(w.w) || cur.length >= 2 || chars >= 11 || nx.s - w.e > 0.25 || nx.line !== w.line
      || (nx && (cur.map((x) => x.w).join(" ") + " " + nx.w).length > 13);
    if (brk) flush(nx);
  });
  return out;
})();

export const Captions: React.FC<{ y?: number }> = ({ y = 0.73 }) => {
  const f = useCurrentFrame(), t = f / FPS + 1 / FPS;
  const g = groups.find((x) => t >= x.a && t < x.b);
  if (!g) return null;
  const k = Math.max(0, f - Math.round((g.a - 1 / FPS) * FPS));
  const sc = k >= 4 ? 1 : [0.7, 1.12, 1.05, 1.0][k];
  return (
    <AbsoluteFill style={{ alignItems: "center", pointerEvents: "none" }}>
      <div style={{
        position: "absolute", top: `${y * 100}%`, width: "92%", textAlign: "center", transform: `translateY(-50%) scale(${sc})`,
        fontFamily: "'Inter Display', 'Inter', sans-serif", fontWeight: 900, fontSize: 124, lineHeight: 1.0, color: "#ffffff",
        WebkitTextStroke: "26px #000000", paintOrder: "stroke fill", letterSpacing: -1,
        textShadow: "0 8px 0 rgba(0,0,0,0.85), 0 10px 24px rgba(0,0,0,0.45)",
      }}>{g.text}</div>
    </AbsoluteFill>
  );
};
