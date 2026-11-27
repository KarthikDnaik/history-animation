// Flat Vox-style vector icons (ink + cream + one accent), drawn as SVG so they stay crisp at any depth.
import React from "react";
import { INK, RED, YEL, CREAM, SANS, SERIF, clamp01 } from "./kit";

export const Chef: React.FC<{ s?: number; col?: string; loaf?: boolean; step?: number }> = ({ s = 1, col = INK, loaf, step = 0 }) => (
  <svg width={90 * s} height={170 * s} viewBox="0 0 90 170" style={{ overflow: "visible" }}>
    <path d="M27 30 C10 30 12 8 30 12 C34 0 56 0 60 12 C78 8 80 30 63 30 Z" fill="#fbf7ee" stroke={col} strokeWidth={4} />
    <rect x={28} y={28} width={34} height={12} fill="#fbf7ee" stroke={col} strokeWidth={4} />
    <circle cx={45} cy={54} r={16} fill="#f2d6b8" stroke={col} strokeWidth={4} />
    <path d="M37 60 Q45 66 53 60" stroke={col} strokeWidth={3} fill="none" />
    <path d="M24 74 Q45 66 66 74 L70 122 L20 122 Z" fill="#fbf7ee" stroke={col} strokeWidth={4} />
    <path d={`M32 122 L${30 + step * 8} 162 M58 122 L${60 - step * 8} 162`} stroke={col} strokeWidth={7} strokeLinecap="round" />
    {loaf && [0, 1, 2, 3].map((k) => <ellipse key={k} cx={45 + (k % 2 ? 11 : -11)} cy={92 - (k >> 1) * 16} rx={16} ry={9} fill="#d08a3e" stroke={col} strokeWidth={3} />)}
  </svg>
);
export const Loaf: React.FC<{ s?: number }> = ({ s = 1 }) => (
  <svg width={120 * s} height={70 * s} viewBox="0 0 120 70"><ellipse cx={60} cy={38} rx={55} ry={28} fill="#d08a3e" stroke={INK} strokeWidth={5} />
    {[30, 55, 80].map((x) => <path key={x} d={`M${x} 20 L${x + 12} 50`} stroke="#f6d7a0" strokeWidth={6} strokeLinecap="round" />)}</svg>
);
export const Thermo: React.FC<{ level: number }> = ({ level }) => (
  <svg width={300} height={760} viewBox="0 0 300 760">
    <rect x={20} y={10} width={260} height={740} rx={40} fill={CREAM} stroke={INK} strokeWidth={8} />
    <rect x={120} y={60} width={60} height={540} rx={30} fill="#fff" stroke={INK} strokeWidth={6} />
    <circle cx={150} cy={650} r={64} fill="#3a8ad8" stroke={INK} strokeWidth={6} />
    <rect x={132} y={80 + 500 * (1 - clamp01(level))} width={36} height={570 - (80 + 500 * (1 - clamp01(level)))} fill="#3a8ad8" />
    {Array.from({ length: 11 }, (_, k) => <line key={k} x1={192} x2={k % 5 ? 222 : 240} y1={80 + 50 * k} y2={80 + 50 * k} stroke={INK} strokeWidth={5} />)}
  </svg>
);
export const Clock: React.FC<{ hours: number; label?: string }> = ({ hours, label }) => {
  const am = (hours % 1) * 360, ah = (hours / 12) * 360;
  return (
    <svg width={480} height={560} viewBox="0 0 480 560">
      <circle cx={240} cy={240} r={220} fill={CREAM} stroke={INK} strokeWidth={10} />
      {Array.from({ length: 12 }, (_, k) => { const a = (k / 12) * Math.PI * 2; return <line key={k} x1={240 + 180 * Math.sin(a)} y1={240 - 180 * Math.cos(a)} x2={240 + 200 * Math.sin(a)} y2={240 - 200 * Math.cos(a)} stroke={INK} strokeWidth={k % 3 ? 5 : 12} />; })}
      <path d={`M240 240 L${240 + 120 * Math.sin((ah * Math.PI) / 180)} ${240 - 120 * Math.cos((ah * Math.PI) / 180)}`} stroke={INK} strokeWidth={14} strokeLinecap="round" />
      <path d={`M240 240 L${240 + 170 * Math.sin((am * Math.PI) / 180)} ${240 - 170 * Math.cos((am * Math.PI) / 180)}`} stroke={RED} strokeWidth={8} strokeLinecap="round" />
      <circle cx={240} cy={240} r={14} fill={INK} />
      {label && <text x={240} y={540} textAnchor="middle" fontFamily={SANS} fontWeight={900} fontSize={62} fill={RED}>{label}</text>}
    </svg>
  );
};
/** elevator floor indicator: arrow + floor number; lit = the DING */
export const Elevator: React.FC<{ floor: string; lit: number }> = ({ floor, lit }) => (
  <svg width={360} height={300} viewBox="0 0 360 300">
    <rect x={10} y={10} width={340} height={280} rx={24} fill="#c9a24a" stroke={INK} strokeWidth={8} />
    <rect x={40} y={40} width={280} height={150} rx={12} fill="#1a1416" />
    <path d="M90 80 L130 80 L110 120 Z" fill={lit ? YEL : "#ff7a3a"} />
    <text x={220} y={160} textAnchor="middle" fontFamily={SANS} fontWeight={900} fontSize={110} fill={lit ? YEL : "#ff7a3a"}>{floor}</text>
    <circle cx={180} cy={240} r={30} fill={lit ? YEL : "#e8dcc0"} stroke={INK} strokeWidth={6} />
    {lit > 0 && <circle cx={180} cy={240} r={30 + 40 * lit} fill="none" stroke={YEL} strokeWidth={6} opacity={1 - lit} />}
  </svg>
);
export const Feet: React.FC<{ k: number }> = ({ k }) => (
  <svg width={520} height={360} viewBox="0 0 520 360">
    {[[150, 1], [370, -1]].map(([x, s]) => (
      <g key={x} transform={`translate(${x},190) scale(${1 + 0.18 * k},${1 + 0.12 * k})`}>
        <ellipse cx={0} cy={40} rx={95} ry={110} fill="#f2b8a0" stroke={INK} strokeWidth={8} />
        {[0, 1, 2, 3, 4].map((j) => <ellipse key={j} cx={s * (-62 + j * 30)} cy={-78 + 6 * Math.abs(j - 2)} rx={20 - j * 1.5} ry={24 - j * 1.5} fill="#f2b8a0" stroke={INK} strokeWidth={6} />)}
      </g>
    ))}
  </svg>
);
export const Clapper: React.FC<{ open: number; text: string }> = ({ open, text }) => (
  <svg width={560} height={470} viewBox="0 0 560 470" style={{ overflow: "visible" }}>
    <rect x={20} y={130} width={520} height={320} rx={16} fill="#1e1e22" stroke={INK} strokeWidth={6} />
    <g transform={`rotate(${-18 * open} 20 130)`}><rect x={20} y={64} width={520} height={66} fill="#f2f2f2" stroke={INK} strokeWidth={6} />
      {Array.from({ length: 6 }, (_, k) => <path key={k} d={`M${44 + 88 * k} 64 L${88 + 88 * k} 64 L${64 + 88 * k} 130 L${20 + 88 * k} 130 Z`} fill="#1e1e22" />)}</g>
    <text x={280} y={260} textAnchor="middle" fontFamily={SANS} fontWeight={900} fontSize={58} fill="#fff">{text}</text>
    <text x={280} y={340} textAnchor="middle" fontFamily={SERIF} fontStyle="italic" fontWeight={700} fontSize={38} fill={YEL}>the stern rail scene</text>
  </svg>
);
export const Stamp: React.FC<{ text: string; col?: string; size?: number }> = ({ text, col = RED, size = 70 }) => (
  <div style={{ border: `8px solid ${col}`, color: col, fontFamily: SANS, fontWeight: 900, fontSize: size, padding: "8px 26px", borderRadius: 14, letterSpacing: 4, opacity: 0.92, mixBlendMode: "multiply" }}>{text}</div>
);
export const Sticky: React.FC<{ lines: string[]; w?: number; col?: string }> = ({ lines, w = 520, col = "#ffe27a" }) => (
  <div style={{ width: w, padding: "40px 34px", background: col, boxShadow: "0 24px 36px rgba(10,14,28,0.35)", fontFamily: SANS, color: INK }}>
    {lines.map((l, i) => <div key={i} style={{ fontSize: i ? 44 : 54, fontWeight: i ? 700 : 900, lineHeight: 1.2, fontFamily: i ? SERIF : SANS, fontStyle: i ? "italic" : undefined }}>{l}</div>)}
  </div>
);
/** a band of stylised waves (front water layer) */
export const Waves: React.FC<{ t: number; w?: number; col?: string; amp?: number; ph?: number }> = ({ t, w = 2400, col = "#18305a", amp = 26, ph = 0 }) => {
  const pts: string[] = [];
  for (let x = 0; x <= w; x += 40) pts.push(`${x},${60 + amp * Math.sin(x / 120 + t * 1.6 + ph) + 0.4 * amp * Math.sin(x / 47 - t * 2.3)}`);
  return <svg width={w} height={600} viewBox={`0 0 ${w} 600`}><path d={`M0,600 L${pts.join(" L")} L${w},600 Z`} fill={col} />
    <path d={`M${pts.join(" L")}`} fill="none" stroke="rgba(230,240,255,0.55)" strokeWidth={6} /></svg>;
};
export const DeckChair: React.FC<{ s?: number }> = ({ s = 1 }) => (
  <svg width={300 * s} height={220 * s} viewBox="0 0 300 220" style={{ overflow: "visible" }}>
    <path d="M30 170 L250 120 L262 140 L40 192 Z" fill="#c08a52" stroke={INK} strokeWidth={7} strokeLinejoin="round" />
    <path d="M220 128 L270 20 L292 30 L244 136 Z" fill="#b07a48" stroke={INK} strokeWidth={7} strokeLinejoin="round" />
    <path d="M48 168 L238 126 L240 138 L50 180 Z" fill="#3a5a8a" />
    <path d="M60 186 L48 216 M226 150 L236 210" stroke={INK} strokeWidth={9} strokeLinecap="round" />
  </svg>
);
