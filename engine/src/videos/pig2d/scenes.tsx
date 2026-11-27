// Scenes for the 2D Pig War. Each takes the frame number within its shot.
import React from "react";
import { Defs, Part, Far, ell, INK, shadeOf, Floor, Glove, Head, rnd } from "./art";
import { Bean, CUTLAR, Pig, Potato, REDCOAT, BLUECOAT, PICKETT, GRIFFIN, ADMIRAL, KAISER, GhostPig } from "./chars";
import { Flag, Cannon, Ship, Bubble, Burst, Label, Paper, Bill, Sign, Grave, Rifle } from "./props";

export const W = 1080, H = 1920;
const Frame: React.FC<{ children: React.ReactNode; cam?: { x?: number; y?: number; z?: number } }> = ({ children, cam = {} }) => {
  const z = cam.z ?? 1;
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ display: "block" }}>
      <Defs />
      <g filter="url(#grade)"><g transform={`translate(${W / 2},${H / 2}) scale(${z}) translate(${-W / 2 + (cam.x ?? 0)},${-H / 2 + (cam.y ?? 0)})`}>{children}</g></g>
      <linearGradient id="sun" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#fff2c8" stopOpacity="0.28" /><stop offset="0.5" stopColor="#fff2c8" stopOpacity="0" /><stop offset="1" stopColor="#2a1838" stopOpacity="0.28" /></linearGradient>
      <rect width={W} height={H} fill="url(#sun)" />
      <rect width={W} height={H} fill="url(#vign)" />
      <rect width={W} height={H} fill="url(#grain)" opacity={0.06} style={{ mixBlendMode: "overlay" }} />
    </svg>
  );
};

/* ---------- reusable painted backdrops ---------- */
const Sky: React.FC<{ top?: string; bot?: string; id: string }> = ({ top = "#7fb6ee", bot = "#cfe6f6", id }) => (
  <g><linearGradient id={id} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={top} /><stop offset="1" stopColor={bot} /></linearGradient>
    <rect x={-400} y={-400} width={W + 800} height={H + 800} fill={`url(#${id})`} /></g>
);
const Cloud: React.FC<{ x: number; y: number; s?: number }> = ({ x, y, s = 1 }) => (
  <g transform={`translate(${x},${y}) scale(${s})`}>
    <Part d="M-160,30 C-190,30 -196,-14 -160,-20 C-160,-60 -100,-74 -80,-40 C-60,-90 20,-90 30,-40 C60,-70 120,-50 110,-10 C150,-10 160,30 120,30 Z" fill="#ffffff" shade="#d7e3f3" off={[0, -18]} soft={6} sw={6} ink="#8fa6c4" />
  </g>
);
const Pine: React.FC<{ x: number; y: number; s?: number; c?: string }> = ({ x, y, s = 1, c = "#3f8a4a" }) => (
  <g transform={`translate(${x},${y}) scale(${s})`}>
    <rect x={-14} y={-20} width={28} height={60} fill="#6b4a33" stroke={INK} strokeWidth={6} />
    {[0, 1, 2].map((i) => <Part key={i} d={`M0,${-300 + i * 90} L${90 + i * 26},${-110 + i * 70} C${40 + i * 10},${-96 + i * 70} ${-40 - i * 10},${-96 + i * 70} ${-90 - i * 26},${-110 + i * 70} Z`} fill={c} off={[18, 10]} soft={6} sw={6} />)}
  </g>
);

/* ---------- STYLE TEST: "found a pig eating his potatoes" ---------- */
export const FarmPig: React.FC<{ f: number }> = ({ f }) => {
  const t = f / 30;
  const chew = (Math.sin(t * 14) + 1) / 2, dip = 0.5 + 0.5 * Math.sin(t * 7);
  return (
    <Frame cam={{ z: 1 + t * 0.01 }}>
      <Sky id="sky1" />
      <Cloud x={250} y={210} s={1.1} /><Cloud x={860} y={130} s={0.8} />
      {/* far hills + treeline (soft) */}
      <Far blur={3}>
        <path d="M-200,820 C100,700 300,760 520,720 C760,680 900,740 1300,700 L1300,1000 L-200,1000 Z" fill="#8fbf86" />
        {[...Array(12)].map((_, i) => <Pine key={i} x={-60 + i * 105} y={830 + (i % 3) * 14} s={0.55 + (i % 2) * 0.12} c="#4b8a5a" />)}
      </Far>
      {/* log cabin behind, slightly soft */}
      <Far blur={1.5}>
        <g transform="translate(860,820)">
          <Part d="M-170,-10 L-170,-150 L170,-150 L170,-10 Z" fill="#9a6a42" off={[20, 14]} sw={6}>
            {[-130, -100, -70, -40].map((y) => <path key={y} d={`M-170,${y} L170,${y}`} stroke="#6e4a2c" strokeWidth={6} />)}
          </Part>
          <Part d="M-200,-140 L0,-260 L200,-140 Z" fill="#7a4e33" sw={6} />
          <Part d="M-40,-10 L-40,-100 L30,-100 L30,-10 Z" fill="#5b3a26" sw={6} />
          <Part d="M70,-120 L130,-120 L130,-70 L70,-70 Z" fill="#f2d98a" sw={6} />
        </g>
      </Far>
      {/* fence */}
      <g>
        {[...Array(9)].map((_, i) => <Part key={i} d={`M${-30 + i * 140},770 l26,-6 l4,170 l-30,4 Z`} fill="#b9895a" sw={6} off={[6, 6]} />)}
        <Part d="M-40,800 L1120,790 L1120,816 L-40,826 Z" fill="#c49463" sw={6} off={[4, 6]} />
        <Part d="M-40,860 L1120,850 L1120,876 L-40,886 Z" fill="#c49463" sw={6} off={[4, 6]} />
      </g>
      {/* field: tilled dirt with leafy potato plants in loose rows (irregular, not a pattern) */}
      <linearGradient id="dirt" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#8d6a4a" /><stop offset="1" stopColor="#5e4030" /></linearGradient>
      <path d="M-200,925 C300,915 800,915 1300,920 L1300,2200 L-200,2200 Z" fill="url(#dirt)" />
      <path d="M-200,925 C300,915 800,915 1300,920 L1300,950 C800,945 300,945 -200,955 Z" fill="#6f9a46" />
      {[...Array(7)].map((_, i) => {
        const y = 975 + i * i * 21 + i * 44, sc = 0.32 + i * 0.13, n = Math.round(9 - i * 0.7);
        return <g key={i}>
          <path d={`M-200,${y + 18 * sc} C300,${y + 8 * sc} 800,${y + 8 * sc} 1300,${y + 18 * sc}`} stroke="#4a3122" strokeWidth={10 * sc + 3} fill="none" opacity={0.55} />
          <path d={`M-200,${y + 6 * sc} C300,${y - 4 * sc} 800,${y - 4 * sc} 1300,${y + 6 * sc}`} stroke="#a07c58" strokeWidth={8 * sc + 2} fill="none" opacity={0.5} />
          {[...Array(n)].map((_, j) => {
            const r1 = rnd(i * 31 + j), x = -80 + (j + 0.5 * (i % 2) + (r1 - 0.5) * 0.5) * (1300 / n), s2 = sc * (0.8 + r1 * 0.45);
            return <g key={j} transform={`translate(${x},${y}) scale(${s2})`}>
              <ellipse cx={0} cy={6} rx={80} ry={14} fill="#3a2418" opacity={0.35} />
              {[-62, -30, -4, 26, 58].map((a, k) => <g key={k} transform={`rotate(${a + (rnd(i * 7 + j * 3 + k) - 0.5) * 16}) scale(${k === 2 ? 1.15 : 0.9 + rnd(k + j) * 0.2})`}>
                <Part d="M0,0 C-38,-36 -46,-96 -8,-132 C30,-98 34,-40 0,0 Z" fill={["#5a9c45", "#4f9140", "#66a84e"][(k + j) % 3]} sw={7} off={[10, 12]} soft={4}>
                  <path d="M0,-6 L-6,-110" stroke="#3d7a32" strokeWidth={5} fill="none" />
                </Part></g>)}
            </g>;
          })}
        </g>;
      })}
      {/* Cutlar, framed big on the right, catching the culprit */}
      <Bean x={800} y={1560} s={1.75} o={CUTLAR} expr="angry" look={-0.65} tilt={-5 + Math.sin(t * 2) * 1.5} lh={[-225, -185]} lpose="point" rh={[120, 40]} legs={false} blink={f % 90 > 86} />
      {/* foreground: pig munching */}
      <Pig x={290} y={1690} s={1.35} chew={chew} headDip={dip} tail={Math.sin(t * 9)} />
      <Potato x={560} y={1730} s={1.2} a={-12} bite />
      <Potato x={90} y={1770} s={1} a={20} />
      {/* foreground leaves, soft (depth) */}
      <Far blur={5}>
        {[[-20, 1900, 1.6, -20], [1040, 1880, 1.8, 25]].map(([x, y, s, a], i) => <g key={i} transform={`translate(${x},${y}) rotate(${a}) scale(${s})`}>
          {[-40, 0, 40].map((r, k) => <g key={k} transform={`rotate(${r})`}><Part d="M0,0 C-30,-40 -40,-90 -10,-120 C10,-90 30,-50 0,0 Z" fill="#3f8a38" sw={7} /></g>)}
        </g>)}
      </Far>
    </Frame>
  );
};

export const Sheet: React.FC<{ f: number }> = () => (
  <Frame>
    <rect x={-100} y={-100} width={1300} height={2200} fill="#9ab" />
    {(["open", "fist", "point", "thumb", "ok", "wave"] as const).map((p, i) => <g key={p}><Glove x={120 + (i % 3) * 340} y={200 + Math.floor(i / 3) * 300} pose={p} s={2.2} a={i === 3 ? 0 : -20} /></g>)}
    {(["neutral", "angry", "squint", "happy", "shock", "smug", "sad", "bored", "grin", "yell"] as const).map((e, i) => <Head key={e} x={170 + (i % 3) * 370} y={820 + Math.floor(i / 3) * 330} r={140} expr={e} look={0.3} />)}
  </Frame>
);

export const Cast: React.FC<{ f: number }> = ({ f }) => (
  <Frame>
    <rect x={-100} y={-100} width={1300} height={2200} fill="#8fa3b8" />
    {[CUTLAR, GRIFFIN, REDCOAT, BLUECOAT, PICKETT, ADMIRAL, KAISER].map((o, i) => <Bean key={i} x={190 + (i % 3) * 350} y={460 + Math.floor(i / 3) * 640} s={0.62} o={o} expr={(["happy", "smug", "angry", "neutral", "grin", "sad", "bored"] as const)[i]} look={0.3} />)}
    <GhostPig x={760} y={1700} s={0.6} f={f} />
    <Bubble x={820} y={1400} w={300} h={170} text="$100!" />
  </Frame>
);
export const Props: React.FC<{ f: number }> = ({ f }) => (
  <Frame>
    <rect x={-100} y={-100} width={1300} height={2200} fill="#8fa3b8" />
    <Flag x={60} y={80} kind="us" f={f} /><Flag x={400} y={80} kind="uk" f={f} /><Flag x={740} y={80} kind="hbc" f={f} />
    <Cannon x={250} y={600} /><Ship x={760} y={760} s={0.55} f={f} />
    <Burst x={260} y={950} r={140} text="BANG!" /><Paper x={800} y={1080} s={0.8} title="ARREST" sub="WARRANT" stamp="GUILTY" />
    <Bill x={250} y={1250} amt="10" /><Sign x={300} y={1450} w={460} text="HUDSON'S BAY CO." size={44} />
    <Grave x={800} y={1700} s={0.9} /><Rifle x={60} y={1700} /><Label x={300} y={1850} text="LYMAN CUTLAR" size={72} />
  </Frame>
);
