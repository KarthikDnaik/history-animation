// Props, signs and comic graphics in the reference style.
import React from "react";
import { Part, ell, INK, shadeOf, Floor, rnd } from "./art";

export const COMIC = "'Luckiest', 'Inter Display', sans-serif";

/** in-scene title text (reference "ENVER HOXHA" / "ALBANIA"): heavy white letters, dark outline, pops in */
export const Label: React.FC<{ x: number; y: number; text: string; size?: number; col?: string; k?: number; rot?: number; anchor?: "start" | "middle" | "end" }> = ({ x, y, text, size = 84, col = "#ffffff", k = 1, rot = 0, anchor = "middle" }) =>
  k <= 0 ? null : (
    <g transform={`translate(${x},${y}) rotate(${rot}) scale(${k})`}>
      {text.split("\n").map((t, i) => (
        <text key={i} x={0} y={i * size * 0.98} textAnchor={anchor} fontFamily={COMIC} fontSize={size} fill={col} stroke={INK} strokeWidth={size * 0.16} paintOrder="stroke" strokeLinejoin="round" style={{ letterSpacing: 1 }}>{t}</text>
      ))}
    </g>
  );

/** speech bubble with tail toward (tx,ty) relative to bubble centre */
export const Bubble: React.FC<{ x: number; y: number; w: number; h: number; text: string; size?: number; tx?: number; ty?: number; k?: number; col?: string; shout?: boolean }> = ({ x, y, w, h, text, size = 70, tx = -60, ty = 140, k = 1, col = INK, shout }) => {
  if (k <= 0) return null;
  const tail = `M${-w * 0.12},${h * 0.32} L${tx},${ty} L${w * 0.1},${h * 0.4} Z`;
  let body = ell(0, 0, w / 2, h / 2);
  if (shout) {
    const n = 18; let d = "";
    for (let i = 0; i <= n * 2; i++) { const a = (i / (n * 2)) * Math.PI * 2, r = i % 2 ? 0.82 : 1.05; d += (i ? "L" : "M") + (Math.cos(a) * w / 2 * r).toFixed(1) + "," + (Math.sin(a) * h / 2 * r).toFixed(1); }
    body = d + "Z";
  }
  return (
    <g transform={`translate(${x},${y}) scale(${k})`}>
      <path d={tail} fill="#fff" stroke={INK} strokeWidth={9} strokeLinejoin="round" />
      <path d={body} fill="#fff" stroke={INK} strokeWidth={9} strokeLinejoin="round" />
      <path d={tail} fill="#fff" />
      <text x={0} y={size * 0.36} textAnchor="middle" fontFamily={COMIC} fontSize={size} fill={col}>{text}</text>
    </g>
  );
};

/** comic impact burst (BANG!) */
export const Burst: React.FC<{ x: number; y: number; r: number; text: string; k?: number; rot?: number }> = ({ x, y, r, text, k = 1, rot = -8 }) => {
  if (k <= 0) return null;
  let d = ""; const n = 14;
  for (let i = 0; i <= n * 2; i++) { const a = (i / (n * 2)) * Math.PI * 2, rr = i % 2 ? r * 0.62 : r * (1 + rnd(i) * 0.18); d += (i ? "L" : "M") + (Math.cos(a) * rr * 1.25).toFixed(1) + "," + (Math.sin(a) * rr * 0.85).toFixed(1); }
  return (
    <g transform={`translate(${x},${y}) rotate(${rot}) scale(${k})`}>
      <path d={d + "Z"} fill="#ffd23a" stroke={INK} strokeWidth={10} strokeLinejoin="round" />
      <path d={d + "Z"} fill="#ff6a2a" transform="scale(0.62)" />
      <text x={0} y={r * 0.2} textAnchor="middle" fontFamily={COMIC} fontSize={r * 0.62} fill="#fff" stroke={INK} strokeWidth={r * 0.1} paintOrder="stroke">{text}</text>
    </g>
  );
};

/** flags (simplified period flags) with a waving cloth */
export const Flag: React.FC<{ x: number; y: number; s?: number; kind: "us" | "uk" | "hbc" | "de"; f?: number; pole?: number }> = ({ x, y, s = 1, kind, f = 0, pole = 300 }) => {
  const w = 240, h = 150, wv = (u: number, v: number) => [u * w, v * h + Math.sin(u * 5 + f * 0.25) * 10 * u];
  const P = (pts: [number, number][]) => "M" + pts.map(([u, v]) => wv(u, v).map((n) => n.toFixed(1)).join(",")).join(" L") + " Z";
  const rect = (u0: number, v0: number, u1: number, v1: number) => { const pts: [number, number][] = []; for (let i = 0; i <= 8; i++) pts.push([u0 + (u1 - u0) * i / 8, v0]); for (let i = 8; i >= 0; i--) pts.push([u0 + (u1 - u0) * i / 8, v1]); return P(pts); };
  const id = `fl${kind}${Math.round(x)}${Math.round(y)}`;
  let inner: React.ReactNode = null, base = "#fff";
  if (kind === "us") { base = "#f4f1ea"; inner = <g>{[0, 2, 4, 6, 8, 10, 12].map((i) => <path key={i} d={rect(0, i / 13, 1, (i + 1) / 13)} fill="#c8323a" />)}<path d={rect(0, 0, 0.42, 7 / 13)} fill="#2d3f86" />{[...Array(12)].map((_, i) => { const [px, py] = wv(0.06 + (i % 4) * 0.1, 0.08 + Math.floor(i / 4) * 0.16); return <circle key={i} cx={px} cy={py} r={5} fill="#fff" />; })}</g>; }
  if (kind === "uk") {
    base = "#2a3d86";
    const ln = (u0: number, v0: number, u1: number, v1: number) => { const pts = [...Array(9)].map((_, i) => wv(u0 + (u1 - u0) * i / 8, v0 + (v1 - v0) * i / 8)); return "M" + pts.map((p) => p.map((n) => n.toFixed(1)).join(",")).join(" L"); };
    inner = <g fill="none" strokeLinecap="butt">
      <path d={ln(0, 0, 1, 1)} stroke="#fff" strokeWidth={30} /><path d={ln(0, 1, 1, 0)} stroke="#fff" strokeWidth={30} />
      <path d={ln(0, 0, 1, 1)} stroke="#cc2b34" strokeWidth={10} /><path d={ln(0, 1, 1, 0)} stroke="#cc2b34" strokeWidth={10} />
      <path d={rect(0, 0.36, 1, 0.64)} fill="#fff" /><path d={rect(0.42, 0, 0.58, 1)} fill="#fff" /><path d={rect(0, 0.42, 1, 0.58)} fill="#cc2b34" /><path d={rect(0.46, 0, 0.54, 1)} fill="#cc2b34" />
    </g>;
  }
  if (kind === "hbc") { base = "#c8323a"; inner = <g><path d={rect(0, 0, 0.42, 0.5)} fill="#2a3d86" /><path d={rect(0, 0.2, 0.42, 0.3)} fill="#fff" /><path d={rect(0.18, 0, 0.24, 0.5)} fill="#fff" />{(() => { const [px, py] = wv(0.7, 0.62); return <text x={px} y={py} textAnchor="middle" fontFamily={COMIC} fontSize={44} fill="#fff">HBC</text>; })()}</g>; }
  if (kind === "de") { base = "#1d1d1f"; inner = <g><path d={rect(0, 0.333, 1, 0.666)} fill="#f4f1ea" /><path d={rect(0, 0.666, 1, 1)} fill="#c8323a" /></g>; }
  return (
    <g transform={`translate(${x},${y}) scale(${s})`}>
      <Part d={`M-8,-10 L8,-10 L8,${pole} L-8,${pole} Z`} fill="#6b4a33" sw={6} off={[3, 3]} />
      <circle cx={0} cy={-14} r={12} fill="#e9c35a" stroke={INK} strokeWidth={5} />
      <clipPath id={id}><path d={rect(0, 0, 1, 1)} /></clipPath>
      <g transform="translate(8,0)">
        <path d={rect(0, 0, 1, 1)} fill={base} />
        <g clipPath={`url(#${id})`}>{inner}{[0.2, 0.5, 0.8].map((u) => { const [px] = wv(u, 0); return <rect key={u} x={px - 20} y={-20} width={40} height={h + 40} fill="#000" opacity={0.12 * (1 + Math.sin(u * 5 + f * 0.25))} />; })}</g>
        <path d={rect(0, 0, 1, 1)} fill="none" stroke={INK} strokeWidth={7} strokeLinejoin="round" />
      </g>
    </g>
  );
};

/** muzzle-loading rifle, held across (local: stock at 0, barrel to +x) */
export const Rifle: React.FC<{ x: number; y: number; a?: number; s?: number }> = ({ x, y, a = 0, s = 1 }) => (
  <g transform={`translate(${x},${y}) rotate(${a}) scale(${s})`}>
    <Part d="M300,-14 L470,-14 L470,-2 L300,-2 Z" fill="#5d6270" sw={6} off={[2, 3]} />
    <Part d="M-10,-6 C30,-26 90,-24 130,-18 L310,-18 L310,6 L140,10 C110,30 60,44 10,34 C-10,30 -16,10 -10,-6 Z" fill="#8a5a36" sw={7} off={[6, 8]} />
    <rect x={150} y={8} width={40} height={10} fill="#c9a24a" stroke={INK} strokeWidth={4} />
  </g>
);

/** field cannon on a wooden carriage, barrel pointing +x */
export const Cannon: React.FC<{ x: number; y: number; s?: number; flip?: boolean; recoil?: number }> = ({ x, y, s = 1, flip, recoil = 0 }) => (
  <g transform={`translate(${x},${y}) scale(${s * (flip ? -1 : 1)},${s})`}>
    <Floor x={0} y={70} rx={190} o={0.3} />
    <Part d="M-150,40 L60,-10 L80,10 L-140,64 Z" fill="#7a5233" sw={7} off={[6, 8]} />
    <g transform={`translate(${-recoil * 30},0) rotate(-8)`}>
      <Part d="M-90,-40 C-120,-40 -130,30 -90,34 L180,18 C196,16 196,-22 180,-24 Z" fill="#3f434e" sw={8} off={[10, 12]} hi />
      <Part d={ell(-104, -3, 26, 34)} fill="#3a3d47" sw={7} off={[4, 6]} />
      <path d="M40,-30 L40,26 M120,-26 L120,22" stroke={INK} strokeWidth={5} />
      <Part d={ell(184, -3, 10, 22)} fill="#1b1c22" sw={6} off={[2, 2]} />
    </g>
    <g transform="translate(-10,40)">
      <Part d={ell(0, 0, 70)} fill="#9a6a3e" sw={8} off={[10, 12]} />
      {[0, 45, 90, 135].map((a) => <path key={a} d="M-64,0 L64,0" stroke={INK} strokeWidth={8} transform={`rotate(${a})`} />)}
      <Part d={ell(0, 0, 18)} fill="#5b3a26" sw={6} off={[3, 3]} />
    </g>
  </g>
);

/** three-masted warship (side view), facing +x */
export const Ship: React.FC<{ x: number; y: number; s?: number; flip?: boolean; f?: number; flag?: "uk" | "us" }> = ({ x, y, s = 1, flip, f = 0, flag = "uk" }) => {
  const r = Math.sin(f * 0.06) * 1.6;
  return (
    <g transform={`translate(${x},${y}) scale(${s * (flip ? -1 : 1)},${s}) rotate(${r})`}>
      {[-170, 10, 180].map((mx, i) => <g key={i}>
        <Part d={`M${mx - 7},-560 L${mx + 7},-560 L${mx + 9},-40 L${mx - 9},-40 Z`} fill="#6b4a33" sw={6} off={[2, 3]} />
        {[0, 1, 2].map((k) => { const y0 = -520 + k * 150 + (i === 1 ? -20 : 0), w2 = 90 + k * 22; return <Part key={k} d={`M${mx - w2},${y0} Q${mx},${y0 - 18} ${mx + w2},${y0} Q${mx + w2 + 14},${y0 + 60} ${mx + w2 - 6},${y0 + 118} Q${mx},${y0 + 104} ${mx - w2 + 6},${y0 + 118} Q${mx - w2 - 14},${y0 + 60} ${mx - w2},${y0} Z`} fill="#f2ead6" sw={6} off={[12, 14]} soft={5} />; })}
      </g>)}
      <Part d="M-380,-60 L400,-80 C420,-80 440,-70 450,-60 L380,60 C200,90 -200,90 -330,60 C-370,40 -390,-20 -380,-60 Z" fill="#26232a" sw={9} off={[20, 22]} soft={6} />
      <path d="M-370,-22 L430,-40" stroke="#e7c35a" strokeWidth={22} />
      <path d="M-370,-22 L430,-40" stroke={INK} strokeWidth={4} transform="translate(0,-11)" /><path d="M-370,-22 L430,-40" stroke={INK} strokeWidth={4} transform="translate(0,11)" />
      {[...Array(9)].map((_, i) => <rect key={i} x={-320 + i * 78} y={-34 - i * 2} width={30} height={22} fill="#1a1416" stroke={INK} strokeWidth={4} />)}
      <path d="M440,-62 L560,-120" stroke={INK} strokeWidth={10} strokeLinecap="round" />
      <Flag x={-372} y={-200} s={0.55} kind={flag === "uk" ? "uk" : "us"} f={f} pole={160} />
    </g>
  );
};

/** paper sheet with a heading (orders / warrant) */
export const Paper: React.FC<{ x: number; y: number; s?: number; a?: number; title: string; sub?: string; col?: string; stamp?: string; k?: number }> = ({ x, y, s = 1, a = 0, title, sub, col = "#c22a30", stamp, k = 1 }) =>
  k <= 0 ? null : (
    <g transform={`translate(${x},${y}) rotate(${a}) scale(${s * k})`}>
      <Part d="M-150,-200 L150,-206 L156,196 L-146,204 Z" fill="#f3ead2" sw={8} off={[10, 12]} soft={4} />
      <text x={0} y={-120} textAnchor="middle" fontFamily={COMIC} fontSize={title.length > 8 ? 46 : 62} fill={col}>{title}</text>
      {sub && <text x={0} y={-74} textAnchor="middle" fontFamily={COMIC} fontSize={26} fill={INK} opacity={0.75}>{sub}</text>}
      {[...Array(6)].map((_, i) => <path key={i} d={`M-110,${-30 + i * 34} L${90 - (i % 3) * 30},${-30 + i * 34}`} stroke="#9a8e78" strokeWidth={8} strokeLinecap="round" />)}
      {stamp && <g transform="translate(70,150) rotate(-14)"><rect x={-80} y={-34} width={160} height={68} rx={8} fill="none" stroke="#c22a30" strokeWidth={8} /><text x={0} y={16} textAnchor="middle" fontFamily={COMIC} fontSize={40} fill="#c22a30">{stamp}</text></g>}
    </g>
  );

/** dollar bill */
export const Bill: React.FC<{ x: number; y: number; s?: number; a?: number; amt: string }> = ({ x, y, s = 1, a = 0, amt }) => (
  <g transform={`translate(${x},${y}) rotate(${a}) scale(${s})`}>
    <Part d="M-130,-62 L130,-62 L130,62 L-130,62 Z" fill="#9cc58a" sw={7} off={[8, 8]} />
    <rect x={-112} y={-46} width={224} height={92} rx={6} fill="none" stroke="#4d7a44" strokeWidth={5} />
    <circle cx={0} cy={0} r={34} fill="#bfe0ad" stroke="#4d7a44" strokeWidth={5} />
    <text x={0} y={16} textAnchor="middle" fontFamily={COMIC} fontSize={44} fill="#2f5a2a">$</text>
    <text x={-84} y={-14} textAnchor="middle" fontFamily={COMIC} fontSize={34} fill="#2f5a2a">{amt}</text>
    <text x={84} y={40} textAnchor="middle" fontFamily={COMIC} fontSize={34} fill="#2f5a2a">{amt}</text>
  </g>
);

/** wooden sign board with lettering */
export const Sign: React.FC<{ x: number; y: number; w: number; h?: number; text: string; size?: number; a?: number; col?: string; bg?: string; k?: number }> = ({ x, y, w, h = 110, text, size = 60, a = 0, col = "#f6ecd2", bg = "#8a5a36", k = 1 }) =>
  k <= 0 ? null : (
    <g transform={`translate(${x},${y}) rotate(${a}) scale(${k})`}>
      <Part d={`M${-w / 2},${-h / 2} L${w / 2},${-h / 2 - 6} L${w / 2 + 4},${h / 2} L${-w / 2 + 2},${h / 2 + 4} Z`} fill={bg} sw={8} off={[8, 10]} soft={4}>
        <path d={`M${-w / 2},${-h / 6} L${w / 2},${-h / 6 - 4} M${-w / 2},${h / 6} L${w / 2},${h / 6 - 2}`} stroke={shadeOf(bg, 0.5)} strokeWidth={4} />
      </Part>
      <text x={0} y={size * 0.36} textAnchor="middle" fontFamily={COMIC} fontSize={size} fill={col} stroke={INK} strokeWidth={size * 0.08} paintOrder="stroke">{text}</text>
    </g>
  );

/** tombstone */
export const Grave: React.FC<{ x: number; y: number; s?: number; text?: string }> = ({ x, y, s = 1, text = "PIG" }) => (
  <g transform={`translate(${x},${y}) scale(${s})`}>
    <Floor x={0} y={6} rx={170} o={0.35} />
    <Part d="M-120,0 L-120,-210 C-120,-300 120,-300 120,-210 L120,0 Z" fill="#9a9aa6" sw={9} off={[22, 22]} soft={7} />
    <text x={0} y={-170} textAnchor="middle" fontFamily={COMIC} fontSize={54} fill="#4d4d5a">R.I.P.</text>
    <text x={0} y={-100} textAnchor="middle" fontFamily={COMIC} fontSize={44} fill="#4d4d5a">{text}</text>
    <text x={0} y={-50} textAnchor="middle" fontFamily={COMIC} fontSize={30} fill="#4d4d5a">1859</text>
    <path d="M-150,6 C-80,-30 80,-30 150,6 Z" fill="#6c9c46" stroke={INK} strokeWidth={7} />
  </g>
);

/** potato plant clump (field filler) */
export const Leafy: React.FC<{ x: number; y: number; s?: number; seed?: number; c?: string[] }> = ({ x, y, s = 1, seed = 0, c = ["#5a9c45", "#4f9140", "#66a84e"] }) => (
  <g transform={`translate(${x},${y}) scale(${s})`}>
    <ellipse cx={0} cy={6} rx={80} ry={14} fill="#3a2418" opacity={0.3} />
    {[-62, -30, -4, 26, 58].map((a, k) => <g key={k} transform={`rotate(${a + (rnd(seed * 7 + k) - 0.5) * 16}) scale(${k === 2 ? 1.15 : 0.9 + rnd(k + seed) * 0.2})`}>
      <Part d="M0,0 C-38,-36 -46,-96 -8,-132 C30,-98 34,-40 0,0 Z" fill={c[(k + seed) % 3]} sw={7} off={[10, 12]} soft={4}>
        <path d="M0,-6 L-6,-110" stroke="#3d7a32" strokeWidth={5} fill="none" />
      </Part></g>)}
  </g>
);
