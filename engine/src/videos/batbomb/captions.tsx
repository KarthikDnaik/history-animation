// Captions in the reference-reel style (2026-11-10): a phrase builds up word by word (1-2 short lines), small heavy
// uppercase in white with a dark outline; each new word pops in; key words are coloured (red = the stakes,
// yellow = names and numbers). A few punch words take the screen alone, big.
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import WJ from "./words.json";
import { FPS } from "./story";

type W = { w: string; s: number; e: number; line: number };
const WORDS = (WJ as unknown as { words: W[] }).words;
const n = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
const RED = new Set(["bomb", "bats", "warheads", "millions", "pearl", "harbor", "nut", "eighteen", "escaped", "burned", "ground", "ten", "cancelled", "atomic"]);
const YEL = new Set(["america", "dentist", "lytle", "adams", "1941", "new", "mexico", "white", "house", "roosevelt", "fourteen", "grams", "thousand", "parachute", "timer", "attics", "may", "1943", "tower", "barracks", "fuel", "1944"]);
const SOLO = new Set<string>([]);   // punch words, shown alone and big
const colOf = (w: string) => (RED.has(n(w)) ? "#ff3b3b" : YEL.has(n(w)) ? "#ffd23a" : "#ffffff");

type P = { words: W[]; a: number; b: number; solo: boolean };
const PHRASES: P[] = (() => {
  const out: P[] = []; let cur: W[] = [];
  const flush = (next?: W) => {
    if (!cur.length) return;
    const last = cur[cur.length - 1];
    out.push({ words: cur, a: cur[0].s, b: next && next.s - last.e < 0.5 ? next.s : last.e + 0.3, solo: cur.length === 1 && SOLO.has(n(cur[0].w)) });
    cur = [];
  };
  WORDS.forEach((w, i) => {
    const nx = WORDS[i + 1];
    if (SOLO.has(n(w.w))) { flush(w); cur = [w]; flush(nx); return; }
    cur.push(w);
    const len = cur.map((x) => x.w).join(" ").length;
    const brk = !nx || /[.!?…:;]$/.test(w.w) || (/,$/.test(w.w) && len > 12) || len >= 26 || nx.s - w.e > 0.3 || nx.line !== w.line
      || SOLO.has(n(nx.w)) || (cur.map((x) => x.w).join(" ") + " " + nx.w).length > 30;
    if (brk) flush(nx);
  });
  return out;
})();

export const Captions: React.FC<{ y?: number }> = ({ y = 0.73 }) => {
  const f = useCurrentFrame(), t = f / FPS + 1 / FPS;
  const p = PHRASES.find((x) => t >= x.a && t < x.b);
  if (!p) return null;
  const shown = p.words.filter((w) => t >= w.s);
  const big = p.solo;
  return (
    <AbsoluteFill style={{ alignItems: "center", pointerEvents: "none" }}>
      <div style={{
        position: "absolute", top: `${y * 100}%`, width: big ? "92%" : "74%", textAlign: "center", transform: "translateY(-50%)",
        fontFamily: "'Inter Display', 'Inter', sans-serif", fontWeight: 900, fontSize: big ? 150 : 64, lineHeight: 1.08,
        textTransform: "uppercase", letterSpacing: big ? 1 : 0.5,
        WebkitTextStroke: big ? "22px #0c0a0e" : "11px #0c0a0e", paintOrder: "stroke fill",
        textShadow: big ? "0 8px 0 rgba(0,0,0,0.8)" : "0 4px 0 rgba(0,0,0,0.75), 0 6px 14px rgba(0,0,0,0.35)",
      }}>
        {shown.map((w, i) => {
          const k = f - Math.round((w.s - 1 / FPS) * FPS);
          const sc = k >= 3 ? 1 : big ? [1.4, 0.93, 1.03][Math.max(0, k)] : [1.28, 1.08, 1.02][Math.max(0, k)];
          const hot = !big && RED.has(n(w.w)); // two-size captions (2026-11-23 reel): the stakes word is set ~1.45x
          return <span key={i} style={{ display: "inline-block", color: colOf(w.w), transform: `scale(${sc})`, margin: big ? 0 : "0 0.14em", fontSize: hot ? "1.45em" : undefined, lineHeight: hot ? 1.0 : undefined }}>{w.w.replace(/[,]$/, "")}</span>;
        })}
      </div>
    </AbsoluteFill>
  );
};
