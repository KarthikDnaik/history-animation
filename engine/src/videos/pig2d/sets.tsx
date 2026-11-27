// Painted backdrops in the reference style: soft gradients, thinner ink on far layers, depth blur, warm/cool light.
import React from "react";
import { Part, Far, INK, rnd, ell, shadeOf } from "./art";
import { Flag, Leafy, Sign, COMIC, Ship } from "./props";

export const W = 1080, H = 1920;
export const Sky: React.FC<{ top?: string; bot?: string; id: string }> = ({ top = "#7fb6ee", bot = "#cfe6f6", id }) => (
  <g><linearGradient id={id} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={top} /><stop offset="1" stopColor={bot} /></linearGradient>
    <rect x={-600} y={-600} width={W + 1200} height={H + 1200} fill={`url(#${id})`} /></g>
);
export const Cloud: React.FC<{ x: number; y: number; s?: number; c?: string }> = ({ x, y, s = 1, c = "#ffffff" }) => (
  <g transform={`translate(${x},${y}) scale(${s})`}>
    <Part d="M-160,30 C-190,30 -196,-14 -160,-20 C-160,-60 -100,-74 -80,-40 C-60,-90 20,-90 30,-40 C60,-70 120,-50 110,-10 C150,-10 160,30 120,30 Z" fill={c} shade={shadeOf(c, 0.15)} off={[0, -18]} soft={6} sw={6} ink="#8fa6c4" />
  </g>
);
export const Pine: React.FC<{ x: number; y: number; s?: number; c?: string }> = ({ x, y, s = 1, c = "#3f8a4a" }) => (
  <g transform={`translate(${x},${y}) scale(${s})`}>
    <rect x={-14} y={-20} width={28} height={60} fill="#6b4a33" stroke={INK} strokeWidth={6} />
    {[0, 1, 2].map((i) => <Part key={i} d={`M0,${-300 + i * 90} L${90 + i * 26},${-110 + i * 70} C${40 + i * 10},${-96 + i * 70} ${-40 - i * 10},${-96 + i * 70} ${-90 - i * 26},${-110 + i * 70} Z`} fill={c} off={[18, 10]} soft={6} sw={6} />)}
  </g>
);
const Hills: React.FC<{ y: number; c?: string; trees?: boolean; blur?: number }> = ({ y, c = "#8fbf86", trees = true, blur = 3 }) => (
  <Far blur={blur}>
    <path d={`M-600,${y} C100,${y - 120} 300,${y - 60} 520,${y - 100} C760,${y - 140} 900,${y - 80} 1700,${y - 120} L1700,${y + 500} L-600,${y + 500} Z`} fill={c} />
    {trees && [...Array(16)].map((_, i) => <Pine key={i} x={-300 + i * 105} y={y + 10 + (i % 3) * 14} s={0.5 + (i % 2) * 0.12} c="#4b8a5a" />)}
  </Far>
);

/** potato farm: sky, cabin, fence, tilled rows of plants */
export const FarmBG: React.FC<{ f: number; horizon?: number }> = ({ horizon = 925 }) => {
  const y0 = horizon;
  return (
    <g>
      <Sky id="skyF" />
      <Cloud x={250} y={y0 - 715} s={1.1} /><Cloud x={860} y={y0 - 795} s={0.8} />
      <Hills y={y0 - 95} />
      <Far blur={1.5}>
        <g transform={`translate(860,${y0 - 105})`}>
          <Part d="M-170,-10 L-170,-150 L170,-150 L170,-10 Z" fill="#9a6a42" off={[20, 14]} sw={6}>
            {[-130, -100, -70, -40].map((y) => <path key={y} d={`M-170,${y} L170,${y}`} stroke="#6e4a2c" strokeWidth={6} />)}
          </Part>
          <Part d="M-200,-140 L0,-260 L200,-140 Z" fill="#7a4e33" sw={6} />
          <Part d="M-40,-10 L-40,-100 L30,-100 L30,-10 Z" fill="#5b3a26" sw={6} />
          <Part d="M70,-120 L130,-120 L130,-70 L70,-70 Z" fill="#f2d98a" sw={6} />
        </g>
      </Far>
      {[...Array(13)].map((_, i) => <Part key={i} d={`M${-310 + i * 140},${y0 - 155} l26,-6 l4,170 l-30,4 Z`} fill="#b9895a" sw={6} off={[6, 6]} />)}
      <Part d={`M-340,${y0 - 125} L1420,${y0 - 135} L1420,${y0 - 109} L-340,${y0 - 99} Z`} fill="#c49463" sw={6} off={[4, 6]} />
      <Part d={`M-340,${y0 - 65} L1420,${y0 - 75} L1420,${y0 - 49} L-340,${y0 - 39} Z`} fill="#c49463" sw={6} off={[4, 6]} />
      <linearGradient id="dirt" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#8d6a4a" /><stop offset="1" stopColor="#5e4030" /></linearGradient>
      <path d={`M-600,${y0} C300,${y0 - 10} 800,${y0 - 10} 1700,${y0 - 5} L1700,2600 L-600,2600 Z`} fill="url(#dirt)" />
      <path d={`M-600,${y0} C300,${y0 - 10} 800,${y0 - 10} 1700,${y0 - 5} L1700,${y0 + 25} C800,${y0 + 20} 300,${y0 + 20} -600,${y0 + 30} Z`} fill="#6f9a46" />
      {[...Array(8)].map((_, i) => {
        const y = y0 + 50 + i * i * 21 + i * 44, sc = 0.32 + i * 0.13, n = Math.round(11 - i * 0.8);
        return <g key={i}>
          <path d={`M-600,${y + 18 * sc} C300,${y + 8 * sc} 800,${y + 8 * sc} 1700,${y + 18 * sc}`} stroke="#4a3122" strokeWidth={10 * sc + 3} fill="none" opacity={0.55} />
          <path d={`M-600,${y + 6 * sc} C300,${y - 4 * sc} 800,${y - 4 * sc} 1700,${y + 6 * sc}`} stroke="#a07c58" strokeWidth={8 * sc + 2} fill="none" opacity={0.5} />
          {[...Array(n)].map((_, j) => { const r1 = rnd(i * 31 + j); return <Leafy key={j} x={-380 + (j + 0.5 * (i % 2) + (r1 - 0.5) * 0.5) * (1900 / n)} y={y} s={sc * (0.8 + r1 * 0.45)} seed={i * 5 + j} />; })}
        </g>;
      })}
    </g>
  );
};

/** stylised map of the strait: Vancouver Island (British), mainland, San Juan Island in between */
export const MapBG: React.FC<{ f: number; hl?: number }> = ({ f, hl = 0 }) => (
  <g>
    <rect x={-600} y={-600} width={W + 1200} height={H + 1200} fill="#6aa6d8" />
    <rect x={-600} y={-600} width={W + 1200} height={H + 1200} fill="url(#halftone)" />
    {/* wave marks */}
    {[...Array(14)].map((_, i) => <path key={i} d={`M${rnd(i) * 1100 - 60},${200 + rnd(i + 9) * 1500} q20,-14 40,0 q20,14 40,0`} stroke="#4d86bd" strokeWidth={6} fill="none" strokeLinecap="round" />)}
    {/* Vancouver Island (left) */}
    <g transform="translate(110,0)"><Part d="M-400,-200 C-100,-120 60,120 120,420 C160,640 120,900 40,1180 C-20,1400 -160,1600 -400,1700 Z" fill="#d9c79a" off={[24, 24]} soft={8} sw={9} /></g>
    {/* mainland (right + top) */}
    <g transform="translate(-150,0)"><Part d="M380,-400 C420,-100 520,40 700,120 C800,170 780,320 860,420 C960,560 900,760 980,900 C1040,1020 1000,1260 1060,1500 C1100,1700 1200,1900 1500,2000 L1500,-400 Z" fill="#d9c79a" off={[24, 24]} soft={8} sw={9} /></g>
    {/* border (49th parallel + water line) */}
    <path d="M380,560 L1500,560" stroke="#c22a30" strokeWidth={10} strokeDasharray="30 22" />
    <path d="M380,560 C430,700 520,800 520,960 C520,1100 380,1300 330,1600 C300,1800 300,2000 300,2200" stroke="#c22a30" strokeWidth={10} strokeDasharray="30 22" fill="none" opacity={0.25 + 0.75 * (1 - hl)} />
    {/* San Juan Island */}
    <g transform={`translate(560,1040) scale(${1 + hl * 0.25})`}>
      <circle r={200} fill="none" stroke="#ffd23a" strokeWidth={14} strokeDasharray="26 18" opacity={hl} />
      <Part d="M-130,-60 C-110,-120 -20,-140 40,-110 C110,-80 150,-20 120,40 C100,90 40,130 -20,120 C-90,110 -150,40 -130,-60 Z" fill={hl > 0.5 ? "#f2c94c" : "#d9c79a"} off={[12, 12]} soft={5} sw={9} />
    </g>
    
  </g>
);

/** Hudson's Bay Company trading post */
export const StoreBG: React.FC<{ f: number }> = ({ f }) => (
  <g>
    <Sky id="skyS" top="#86b9ea" bot="#d8eaf4" />
    <Cloud x={200} y={240} s={1.1} /><Cloud x={900} y={420} s={0.8} />
    <Hills y={1000} />
    <Flag x={-60} y={300} s={1.1} kind="hbc" f={f} pole={760} />
    <g transform="translate(640,1180)">
      <Part d="M-460,0 L-460,-560 L460,-560 L460,0 Z" fill="#b5472f" off={[40, 30]} soft={10} sw={9}>
        {[...Array(13)].map((_, i) => <path key={i} d={`M-460,${-520 + i * 42} L460,${-520 + i * 42}`} stroke="#8e3523" strokeWidth={6} />)}
      </Part>
      <Part d="M-520,-540 L0,-800 L520,-540 Z" fill="#5d3a2a" sw={9} off={[20, 20]} />
      <Part d="M-110,0 L-110,-300 L110,-300 L110,0 Z" fill="#5b3a26" sw={8} />
      <path d="M0,-300 L0,0" stroke={INK} strokeWidth={6} />
      <Part d="M-380,-380 L-200,-380 L-200,-230 L-380,-230 Z" fill="#f2d98a" sw={8} /><path d="M-290,-380 L-290,-230 M-380,-305 L-200,-305" stroke={INK} strokeWidth={6} />
      <Part d="M200,-380 L380,-380 L380,-230 L200,-230 Z" fill="#f2d98a" sw={8} /><path d="M290,-380 L290,-230 M200,-305 L380,-305" stroke={INK} strokeWidth={6} />
      <Sign x={0} y={-470} w={640} h={110} text="HUDSON'S BAY CO." size={62} />
    </g>
    <linearGradient id="grassS" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#7fb052" /><stop offset="1" stopColor="#4f7c36" /></linearGradient>
    <path d="M-600,1170 C200,1150 800,1160 1700,1150 L1700,2600 L-600,2600 Z" fill="url(#grassS)" />
    {[...Array(9)].map((_, i) => <Part key={i} d={`M${-40 + i * 150},1290 l90,0 l0,70 l-90,0 Z`} fill="#a77b4a" sw={6} off={[6, 6]} opacity={i % 3 === 1 ? 1 : 0} />)}
  </g>
);

/** army camp: tents, stacked rifles, flag */
export const CampBG: React.FC<{ f: number; flag?: "us" | "uk"; tint?: string }> = ({ f, flag = "us" }) => (
  <g>
    <Sky id={`skyC${flag}`} top="#8dbde9" bot="#e2eef2" />
    <Cloud x={300} y={300} s={1.2} /><Cloud x={880} y={180} s={0.7} />
    <Hills y={980} />
    {[[-80, 1060, 0.8], [260, 1040, 0.7], [620, 1050, 0.75], [980, 1060, 0.8], [1300, 1050, 0.8]].map(([x, y, s], i) => (
      <Far key={i} blur={1}><g transform={`translate(${x},${y}) scale(${s})`}>
        <Part d="M-200,0 L0,-260 L200,0 Z" fill="#efe6cf" off={[30, 20]} soft={8} sw={8} />
        <Part d="M-40,0 L0,-150 L40,0 Z" fill="#6b5a44" sw={6} />
      </g></Far>
    ))}
    <Flag x={540} y={560} kind={flag} f={f} pole={460} />
    <linearGradient id="grassC" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#86b55a" /><stop offset="1" stopColor="#4a7834" /></linearGradient>
    <path d="M-600,1080 C200,1060 800,1070 1700,1060 L1700,2600 L-600,2600 Z" fill="url(#grassC)" />
    {[...Array(26)].map((_, i) => <path key={i} d={`M${rnd(i) * 1400 - 160},${1150 + rnd(i + 3) * 760} l8,-26 l8,26 l8,-18 l6,18`} stroke="#3d6a2c" strokeWidth={5} fill="none" strokeLinejoin="round" />)}
  </g>
);

/** open water with distant island coast */
export const BayBG: React.FC<{ f: number; dusk?: boolean; horizon?: number }> = ({ f, dusk, horizon = 900 }) => (
  <g>
    <Sky id={dusk ? "skyBd" : "skyB"} top={dusk ? "#3b3f6e" : "#7fb3e6"} bot={dusk ? "#e09a6e" : "#d6e9f3"} />
    {!dusk && <><Cloud x={220} y={260} s={1.2} /><Cloud x={860} y={380} s={0.9} /></>}
    <Far blur={2}><path d={`M-600,${horizon} C-200,${horizon - 160} 200,${horizon - 120} 420,${horizon - 30} L420,${horizon + 20} L-600,${horizon + 20} Z`} fill={dusk ? "#3d4a5e" : "#6f9a74"} /></Far>
    <linearGradient id="sea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={dusk ? "#5a6a92" : "#5d9fd0"} /><stop offset="1" stopColor={dusk ? "#2a3150" : "#2d6aa0"} /></linearGradient>
    <rect x={-600} y={horizon} width={W + 1200} height={H + 1200} fill="url(#sea)" />
    {[...Array(22)].map((_, i) => { const y = horizon + 40 + rnd(i) * 1000, x = rnd(i + 7) * 1500 - 200 + Math.sin(f * 0.05 + i) * 20; return <path key={i} d={`M${x},${y} q24,-16 48,0 q24,16 48,0`} stroke="#bfe0f4" strokeWidth={5 + (y - horizon) / 160} fill="none" strokeLinecap="round" opacity={0.7} />; })}
  </g>
);

/** admiral's cabin: wood panels, stern windows with sea, lantern, desk */
export const CabinBG: React.FC<{ f: number }> = ({ f }) => (
  <g>
    <rect x={-600} y={-600} width={W + 1200} height={H + 1200} fill="#7a4e30" />
    {[...Array(20)].map((_, i) => <path key={i} d={`M${-600 + i * 120},-600 L${-600 + i * 120},2400`} stroke="#5f3a22" strokeWidth={8} />)}
    <rect x={-600} y={200} width={W + 1200} height={60} fill="#5a3620" stroke={INK} strokeWidth={8} />
    {[-160, 240, 640, 1040].map((x, i) => (
      <g key={i} transform={`translate(${x},380)`}>
        <Part d="M0,0 L320,0 L320,420 L0,420 Z" fill="#9ccbe6" off={[0, 30]} soft={10} sw={10} shade="#6fa8cf">
          <path d={`M0,${300 + Math.sin(f * 0.05 + i) * 8} C80,${280} 240,${320} 320,${290 + Math.sin(f * 0.05 + i) * 8} L320,420 L0,420 Z`} fill="#3f7fb5" />
        </Part>
        <path d="M160,0 L160,420 M0,210 L320,210" stroke="#5a3620" strokeWidth={18} />
      </g>
    ))}
    <rect x={-600} y={800} width={W + 1200} height={60} fill="#5a3620" stroke={INK} strokeWidth={8} />
    <g transform={`translate(540,40) rotate(${Math.sin(f * 0.06) * 4})`}>
      <path d="M0,0 L0,90" stroke={INK} strokeWidth={8} />
      <Part d="M-50,90 L50,90 L60,200 L-60,200 Z" fill="#f6dc8a" sw={8} off={[0, 0]} soft={0} />
      <circle cx={0} cy={150} r={180} fill="#ffe08a" opacity={0.18} filter="url(#blur20)" />
    </g>
    {/* desk */}
    <Part d="M-600,1460 L1700,1460 L1700,2600 L-600,2600 Z" fill="#6a4128" off={[0, 40]} soft={12} sw={10} />
    <Part d="M-600,1420 L1700,1420 L1700,1480 L-600,1480 Z" fill="#8a5a36" sw={9} off={[0, 10]} />
    <Part d="M100,1500 L700,1490 L740,1720 L60,1740 Z" fill="#e8d9b0" sw={8} off={[10, 14]}>
      <path d="M200,1560 C300,1530 420,1600 520,1560 M260,1640 C360,1620 460,1680 600,1640" stroke="#7aa8c9" strokeWidth={10} fill="none" />
    </Part>
  </g>
);

/** palace throne room for the Kaiser */
export const PalaceBG: React.FC<{ f: number }> = () => (
  <g>
    <rect x={-600} y={-600} width={W + 1200} height={H + 1200} fill="#5a1e24" />
    {[...Array(12)].map((_, i) => <path key={i} d={`M${-600 + i * 160},-600 C${-560 + i * 160},400 ${-640 + i * 160},900 ${-600 + i * 160},1400`} stroke="#3e1217" strokeWidth={30} fill="none" opacity={0.6} />)}
    {[60, 1020].map((x, i) => <g key={i} transform={`translate(${x},0)`}><Part d="M-70,-200 L70,-200 L70,1500 L-70,1500 Z" fill="#e9dcc0" off={[30, 0]} soft={12} sw={9} /><Part d="M-100,1440 L100,1440 L100,1520 L-100,1520 Z" fill="#d8c8a6" sw={8} /></g>)}
    <path d="M-600,1400 L1700,1400 L1700,2600 L-600,2600 Z" fill="#8a2a30" />
    {[...Array(10)].map((_, i) => <path key={i} d={`M${-600 + i * 260},2600 L${300 + i * 60},1400`} stroke="#6d1f24" strokeWidth={10} />)}
    <path d="M-600,1400 L1700,1400" stroke="#e9c35a" strokeWidth={16} />
    <g transform="translate(540,560)"><circle r={260} fill="#ffe08a" opacity={0.16} filter="url(#blur20)" />
      <Part d="M-260,700 L-260,-120 C-260,-300 260,-300 260,-120 L260,700 Z" fill="#c9a04a" off={[40, 30]} soft={12} sw={10}>
        <path d="M-200,680 L-200,-100 C-200,-230 200,-230 200,-100 L200,680 Z" fill="#a0262d" />
      </Part>
    </g>
  </g>
);

/** party: bunting over the shared camp */
export const Bunting: React.FC<{ y: number; f: number; cols?: string[] }> = ({ y, f, cols = ["#c8323a", "#f4f1ea", "#2d3f86", "#e9c35a"] }) => (
  <g>
    <path d={`M-200,${y} Q540,${y + 140} 1280,${y}`} stroke={INK} strokeWidth={6} fill="none" />
    {[...Array(15)].map((_, i) => { const u = i / 14, x = -200 + u * 1480, yy = y + 4 * 140 * u * (1 - u) * 1.0, sw2 = Math.sin(f * 0.2 + i) * 4; return <Part key={i} d={`M${x - 36},${yy} L${x + 36},${yy} L${x + sw2},${yy + 80} Z`} fill={cols[i % cols.length]} sw={6} off={[4, 6]} soft={2} />; })}
  </g>
);

/** dusk hill for the pig's funeral */
export const GraveBG: React.FC<{ f: number }> = () => (
  <g>
    <Sky id="skyG" top="#3a3a68" bot="#e7a679" />
    <circle cx={760} cy={880} r={150} fill="#ffd9a0" opacity={0.85} filter="url(#blur8)" />
    <Hills y={1020} c="#5a6a58" blur={3} />
    <linearGradient id="grassG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#5f7f46" /><stop offset="1" stopColor="#2f4428" /></linearGradient>
    <path d="M-600,1130 C200,1080 800,1090 1700,1110 L1700,2600 L-600,2600 Z" fill="url(#grassG)" />
  </g>
);
