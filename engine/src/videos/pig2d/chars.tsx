// Puppet cast, drawn in the reference style. Each character is posed by plain numbers so it can be animated per frame.
import React from "react";
import { Part, Tube, Head, Glove, Floor, ell, INK, Expr, shadeOf, sleeve, HandPose } from "./art";

type V = [number, number];
/** 2-bone IK: shoulder -> hand with segment lengths, elbow bends to side `bend` (+1 / -1) */
export const ik = (s: V, h: V, l1: number, l2: number, bend = 1): V => {
  const dx = h[0] - s[0], dy = h[1] - s[1], d = Math.min(Math.hypot(dx, dy), l1 + l2 - 1);
  const a = Math.atan2(dy, dx), c = Math.acos(Math.max(-1, Math.min(1, (l1 * l1 + d * d - l2 * l2) / (2 * l1 * d))));
  return [s[0] + Math.cos(a - bend * c) * l1, s[1] + Math.sin(a - bend * c) * l1];
};
const limb = (s: V, h: V, l: number, bend: number) => { const e = ik(s, h, l, l, bend); return { d: `M${s[0]},${s[1]} Q${e[0] * 2 - (s[0] + h[0]) / 2},${e[1] * 2 - (s[1] + h[1]) / 2} ${h[0]},${h[1]}`, e }; };
const ang = (a: V, b: V) => (Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI;

export type Pose = {
  x: number; y: number; s?: number; flip?: boolean;
  expr?: Expr; look?: number; tilt?: number; talk?: number; blink?: boolean;
  lh?: V; rh?: V; lpose?: HandPose; rpose?: HandPose;
  lean?: number; legs?: boolean; step?: number; idle?: number;
};

/** generic bean body. outfit draws over the torso (clipped) and supplies colours */
export type Outfit = {
  shirt: string; sleeve?: string; pants: string; shoe?: string;
  torso?: (T: string) => React.ReactNode; hat?: (r: number) => React.ReactNode; collar?: React.ReactNode; headFx?: React.ReactNode;
};
// chibi proportions like the references: big ball head (r 150), short rounded torso
export const TORSO = "M-96,-196 C-128,-120 -122,-34 -96,0 C-44,18 44,18 96,0 C122,-34 128,-120 96,-196 C58,-232 -58,-232 -96,-196 Z";

export const Bean: React.FC<Pose & { o: Outfit }> = (p) => {
  const { o } = p, s = p.s ?? 1, sl = o.sleeve ?? o.shirt;
  const L: V = [-84, -176], R: V = [84, -176];
  const ph = (p.x * 0.013) % 7, I = p.idle ?? 0, swy = (k: number) => (p.idle === undefined ? 0 : Math.sin(I / 17 + ph + k) * 7);
  const lh0 = p.lh ?? [-112, 10], rh0 = p.rh ?? [112, 10];
  const lh: V = [lh0[0] + swy(1) * 0.5, lh0[1] + swy(2)], rh: V = [rh0[0] + swy(3) * 0.5, rh0[1] + swy(4)];
  const le = ik(L, lh, 96, 96, -1), re = ik(R, rh, 96, 96, 1);
  const st = p.step ?? 0;
  const lf: V = [-46 + st * 40, 150 - Math.max(0, st) * 30], rf: V = [46 - st * 40, 150 - Math.max(0, -st) * 30];
  const arm = (sh: V, e: V, h: V) => {
    const d = sleeve(sh, e, h, 70, 82);
    const fold = (t: number) => { const x = sh[0] + (h[0] - sh[0]) * t, y = sh[1] + (h[1] - sh[1]) * t; return `M${x - 14},${y - 6} q14,10 26,-2`; };
    return <Part d={d} fill={sl} off={[20, 22]} soft={8}>
      <path d={`${fold(0.45)} ${fold(0.62)}`} stroke={shadeOf(sl, 0.45)} strokeWidth={5} fill="none" strokeLinecap="round" />
    </Part>;
  };
  return (
    <g transform={`translate(${p.x},${p.y}) scale(${s * (p.flip ? -1 : 1)},${s}) rotate(${p.lean ?? 0})`}>
      {p.legs !== false && <g>
        <Floor x={0} y={176} rx={150} o={0.3} />
        <Part d={sleeve([-44, -10], [-45 + st * 20, 70], lf, 64, 58)} fill={o.pants} off={[10, 10]} />
        <Part d={sleeve([44, -10], [45 - st * 20, 70], rf, 64, 58)} fill={o.pants} off={[10, 10]} />
        <Part d={`M${lf[0] - 46},${lf[1] + 22} C${lf[0] - 50},${lf[1] - 14} ${lf[0] + 20},${lf[1] - 18} ${lf[0] + 30},${lf[1] + 4} C${lf[0] + 34},${lf[1] + 24} ${lf[0] - 10},${lf[1] + 30} ${lf[0] - 46},${lf[1] + 22} Z`} fill={o.shoe ?? "#3b2c2a"} off={[6, 6]} />
        <Part d={`M${rf[0] - 30},${rf[1] + 22} C${rf[0] - 34},${rf[1] - 14} ${rf[0] + 36},${rf[1] - 18} ${rf[0] + 46},${rf[1] + 4} C${rf[0] + 50},${rf[1] + 24} ${rf[0] + 10},${rf[1] + 30} ${rf[0] - 30},${rf[1] + 22} Z`} fill={o.shoe ?? "#3b2c2a"} off={[6, 6]} />
      </g>}
      {arm(L, le, lh)}
      <Part d={TORSO} fill={o.shirt} off={[46, 40]} soft={16}>
        {o.torso?.(TORSO)}
        <path d="M-60,-40 q20,14 40,4 M30,-150 q16,20 10,44" stroke={shadeOf(o.shirt, 0.45)} strokeWidth={5} fill="none" strokeLinecap="round" opacity={0.8} />
      </Part>
      {o.collar}
      {arm(R, re, rh)}
      <Glove x={lh[0]} y={lh[1]} a={ang(le, lh)} s={0.9} pose={p.lpose ?? "rest"} flip />
      <Glove x={rh[0]} y={rh[1]} a={ang(re, rh)} s={0.9} pose={p.rpose ?? "rest"} />
      <Head x={0} y={-330 + swy(5) * 0.4} r={150} expr={p.expr} look={p.look} tilt={(p.tilt ?? 0) + swy(6) * 0.25} talk={p.talk} blink={p.blink} hat={o.hat?.(150)}>{o.headFx}</Head>
    </g>
  );
};

/* ---------------- outfits ---------------- */
const strawHat = (r: number) => (
  <g transform={`translate(0,${-r * 0.62}) rotate(-6)`}>
    <Part d={`M${-r * 1.45},${r * 0.12} C${-r * 1.2},${-r * 0.2} ${r * 1.2},${-r * 0.2} ${r * 1.45},${r * 0.12} C${r * 1.1},${r * 0.36} ${-r * 1.1},${r * 0.36} ${-r * 1.45},${r * 0.12} Z`} fill="#e2b866" off={[10, 14]} />
    <Part d={`M${-r * 0.72},${r * 0.06} C${-r * 0.8},${-r * 0.5} ${-r * 0.5},${-r * 0.72} 0,${-r * 0.74} C${r * 0.5},${-r * 0.72} ${r * 0.8},${-r * 0.5} ${r * 0.72},${r * 0.06} C${r * 0.4},${r * 0.16} ${-r * 0.4},${r * 0.16} ${-r * 0.72},${r * 0.06} Z`} fill="#e9c274" off={[18, 16]} soft={6}>
      {[-0.5, -0.2, 0.1, 0.4].map((k) => <path key={k} d={`M${r * k},${-r * 0.7} Q${r * (k + 0.1)},${-r * 0.3} ${r * (k + 0.05)},${r * 0.1}`} stroke="#b88c40" strokeWidth={4} fill="none" opacity={0.5} />)}
    </Part>
    <Part d={`M${-r * 0.74},${-r * 0.1} C${-r * 0.4},${-r * 0.02} ${r * 0.4},${-r * 0.02} ${r * 0.74},${-r * 0.1} L${r * 0.73},${r * 0.04} C${r * 0.4},${r * 0.14} ${-r * 0.4},${r * 0.14} ${-r * 0.73},${r * 0.04} Z`} fill="#b8423a" off={[4, 4]} sw={6} />
  </g>
);
export const CUTLAR: Outfit = {
  shirt: "#d9a441", pants: "#4e74b0",
  torso: () => (<g>
    <Part d="M-66,-120 L66,-120 L88,24 L-88,24 Z" fill="#4e74b0" off={[20, 16]} soft={6} sw={7} />
    <path d="M-58,-120 L-72,-214 M58,-120 L72,-214" stroke={INK} strokeWidth={30} strokeLinecap="round" />
    <path d="M-58,-120 L-72,-214 M58,-120 L72,-214" stroke="#4e74b0" strokeWidth={18} strokeLinecap="round" />
    <circle cx={-54} cy={-108} r={9} fill="#e9d38c" stroke={INK} strokeWidth={4} /><circle cx={54} cy={-108} r={9} fill="#e9d38c" stroke={INK} strokeWidth={4} />
    <rect x={-30} y={-84} width={60} height={42} rx={6} fill="#43679e" stroke={INK} strokeWidth={5} />
    {[-40, 20].map((y) => <path key={y} d={`M-100,${y - 120} Q0,${y - 110} 100,${y - 120}`} stroke="#b9862e" strokeWidth={5} fill="none" opacity={0.0} />)}
  </g>),
  collar: <Part d="M-46,-222 L0,-178 L46,-222 L24,-230 L0,-206 L-24,-230 Z" fill="#e8b85a" sw={6} off={[4, 4]} />,
  hat: strawHat,
};

/* ---------------- the pig ---------------- */
export const Pig: React.FC<{ x: number; y: number; s?: number; flip?: boolean; chew?: number; expr?: "happy" | "munch" | "shock" | "dead"; headDip?: number; tail?: number; halo?: boolean }> = ({ x, y, s = 1, flip, chew = 0, expr = "munch", headDip = 0, tail = 0, halo }) => {
  const P = "#f4a3b4", PS = "#d27590";
  const hx = 150, hy = -60 + headDip * 40;
  return (
    <g transform={`translate(${x},${y}) scale(${s * (flip ? -1 : 1)},${s})`}>
      <Floor x={0} y={88} rx={230} o={0.3} />
      {[-120, -50, 60, 130].map((lx, i) => <Part key={i} d={`M${lx - 26},20 L${lx - 22},86 C${lx - 10},96 ${lx + 12},96 ${lx + 22},86 L${lx + 26},20 Z`} fill={i % 2 ? P : PS} shade={shadeOf(PS, 0.2)} off={[6, 6]} />)}
      {[-120, -50, 60, 130].map((lx, i) => <path key={i} d={`M${lx - 20},84 L${lx + 20},84`} stroke={INK} strokeWidth={6} />)}
      <path d={`M-205,-30 C-250,${-40 - tail * 10} -250,${-90} -222,-88 C-196,-86 -210,-56 -236,-60`} stroke={INK} strokeWidth={14} fill="none" strokeLinecap="round" />
      <path d={`M-205,-30 C-250,${-40 - tail * 10} -250,${-90} -222,-88 C-196,-86 -210,-56 -236,-60`} stroke={P} strokeWidth={6} fill="none" strokeLinecap="round" />
      <Part d="M-210,-20 C-220,-110 -120,-150 0,-150 C110,-150 190,-110 196,-30 C200,40 120,70 0,70 C-120,70 -205,50 -210,-20 Z" fill={P} off={[30, 30]} soft={10} hi />
      <ellipse cx={-60} cy={-40} rx={34} ry={22} fill="#e58aa0" opacity={0.6} /><ellipse cx={40} cy={10} rx={22} ry={14} fill="#e58aa0" opacity={0.6} />
      <g transform={`translate(${hx},${hy}) rotate(${headDip * 18})`}>
        <Part d="M-30,-100 C-40,-150 -10,-170 10,-140 L20,-96 Z" fill={P} off={[6, 6]} />
        <Part d={ell(0, 0, 110, 96)} fill={P} off={[18, 18]} soft={7} />
        <Part d="M60,-96 C70,-160 110,-150 104,-110 L84,-70 Z" fill={P} off={[6, 6]} />
        <Part d={ell(96, 30, 44, 40)} fill="#f7b4c2" off={[8, 8]} soft={4} />
        <ellipse cx={84} cy={30} rx={8} ry={12} fill={INK} /><ellipse cx={110} cy={30} rx={8} ry={12} fill={INK} />
        {expr === "dead" ? <g stroke={INK} strokeWidth={8} strokeLinecap="round"><path d="M10,-40 L36,-14 M36,-40 L10,-14" /><path d="M56,-46 L80,-22 M80,-46 L56,-22" /></g>
          : expr === "shock" ? <g><circle cx={22} cy={-26} r={18} fill="#fff" stroke={INK} strokeWidth={6} /><circle cx={24} cy={-24} r={7} fill={INK} /><circle cx={68} cy={-32} r={16} fill="#fff" stroke={INK} strokeWidth={6} /><circle cx={70} cy={-30} r={6} fill={INK} /></g>
          : expr === "happy" ? <g stroke={INK} strokeWidth={8} fill="none" strokeLinecap="round"><path d="M8,-22 Q22,-42 36,-22" /><path d="M54,-28 Q68,-48 82,-28" /></g>
          : <g><ellipse cx={24} cy={-26} rx={9} ry={12} fill={INK} /><ellipse cx={68} cy={-32} rx={8} ry={11} fill={INK} /><path d="M8,-46 L40,-40 M54,-50 L84,-48" stroke={INK} strokeWidth={6} strokeLinecap="round" /></g>}
        <path d={`M40,${74 + chew * 6} Q70,${84 + chew * 14} 104,${72 + chew * 4}`} stroke={INK} strokeWidth={7} fill="none" strokeLinecap="round" />
      </g>
      {halo && <ellipse cx={hx} cy={hy - 160} rx={70} ry={18} fill="none" stroke="#ffd94a" strokeWidth={12} />}
    </g>
  );
};

/** a potato */
export const Potato: React.FC<{ x: number; y: number; s?: number; a?: number; bite?: boolean }> = ({ x, y, s = 1, a = 0, bite }) => (
  <g transform={`translate(${x},${y}) rotate(${a}) scale(${s})`}>
    <Part d={bite ? "M-46,-6 C-50,-30 -10,-38 20,-30 C34,-26 30,-14 38,-12 C30,-6 40,4 34,10 C44,14 40,26 30,28 C0,36 -40,26 -46,-6 Z" : "M-46,-6 C-50,-30 -10,-38 20,-30 C48,-22 52,20 30,28 C0,36 -40,26 -46,-6 Z"} fill="#c99a5b" off={[8, 8]} soft={3} sw={6} />
    {[[-20, -8], [8, 6], [-4, 18]].map(([px, py], i) => <circle key={i} cx={px} cy={py} r={3.5} fill="#7a5530" />)}
    {bite && <path d="M38,-12 C30,-6 40,4 34,10 C44,14 40,26 30,28" fill="#f2e2a8" />}
  </g>
);

/* ---------------- more outfits ---------------- */
const btns = (xs: number[], ys: number[], c = "#e9c35a") => xs.flatMap((x) => ys.map((y) => <circle key={`${x}_${y}`} cx={x} cy={y} r={9} fill={c} stroke={INK} strokeWidth={4} />));
const belt = (c = "#2b2329", buckle = "#e9c35a") => (<g><rect x={-130} y={-46} width={260} height={30} fill={c} stroke={INK} strokeWidth={6} /><rect x={-20} y={-50} width={40} height={38} rx={5} fill={buckle} stroke={INK} strokeWidth={5} /></g>);
export const mustache = (c = "#5a3d2b", big = 1) => (
  <Part d={`M0,${36} C${-30 * big},${18} ${-82 * big},${24} ${-96 * big},${58} C${-70 * big},${52} ${-40 * big},${62} 0,${52} C${40 * big},${62} ${70 * big},${52} ${96 * big},${58} C${82 * big},${24} ${30 * big},${18} 0,${36} Z`} fill={c} sw={6} off={[4, 6]} soft={3} />
);
const kepi = (c: string) => (r: number) => (
  <g transform={`translate(${-r * 0.05},${-r * 0.6}) rotate(-4)`}>
    <Part d={`M${-r * 0.72},${r * 0.12} L${-r * 0.6},${-r * 0.5} C${-r * 0.2},${-r * 0.62} ${r * 0.4},${-r * 0.62} ${r * 0.62},${-r * 0.4} L${r * 0.74},${r * 0.12} Z`} fill={c} off={[16, 14]} soft={6} />
    <path d={`M${-r * 0.7},${r * 0.02} L${r * 0.72},${r * 0.02}`} stroke="#e9c35a" strokeWidth={10} />
    <Part d={`M${r * 0.1},${r * 0.1} C${r * 0.5},${r * 0.06} ${r * 0.9},${r * 0.1} ${r * 1.0},${r * 0.24} C${r * 0.7},${r * 0.3} ${r * 0.3},${r * 0.26} ${r * 0.1},${r * 0.2} Z`} fill="#1f1d24" sw={6} off={[4, 4]} />
    <circle cx={0} cy={-r * 0.2} r={r * 0.09} fill="#e9c35a" stroke={INK} strokeWidth={5} />
  </g>
);
const shako = (r: number) => (
  <g transform={`translate(0,${-r * 0.66}) rotate(-3)`}>
    <Part d={`M${-r * 0.6},${r * 0.14} L${-r * 0.5},${-r * 0.78} L${r * 0.5},${-r * 0.78} L${r * 0.6},${r * 0.14} Z`} fill="#1f1d24" off={[16, 14]} soft={6} />
    <Part d={`M${-r * 0.2},${-r * 0.5} L0,${-r * 0.66} L${r * 0.2},${-r * 0.5} L${r * 0.16},${-r * 0.2} L${-r * 0.16},${-r * 0.2} Z`} fill="#e9c35a" sw={5} off={[3, 3]} />
    <Part d={`M${-r * 0.1},${-r * 0.78} C${-r * 0.16},${-r * 1.02} ${r * 0.16},${-r * 1.02} ${r * 0.1},${-r * 0.78} Z`} fill="#f4f1ea" sw={5} off={[3, 3]} />
    <Part d={`M${-r * 0.2},${r * 0.1} C${r * 0.2},${r * 0.04} ${r * 0.7},${r * 0.1} ${r * 0.8},${r * 0.26} C${r * 0.5},${r * 0.3} ${r * 0.1},${r * 0.24} ${-r * 0.2},${r * 0.2} Z`} fill="#1f1d24" sw={6} off={[3, 3]} />
  </g>
);
const topHat = (r: number) => (
  <g transform={`translate(${r * 0.04},${-r * 0.68}) rotate(5)`}>
    <Part d={`M${-r * 0.92},${r * 0.12} C${-r * 0.6},${-r * 0.06} ${r * 0.6},${-r * 0.06} ${r * 0.92},${r * 0.12} C${r * 0.6},${r * 0.3} ${-r * 0.6},${r * 0.3} ${-r * 0.92},${r * 0.12} Z`} fill="#25232b" off={[8, 10]} />
    <Part d={`M${-r * 0.56},${r * 0.1} L${-r * 0.5},${-r * 0.92} C${-r * 0.2},${-r * 1.0} ${r * 0.2},${-r * 1.0} ${r * 0.5},${-r * 0.92} L${r * 0.56},${r * 0.1} Z`} fill="#2d2a33" off={[18, 14]} soft={6} />
    <path d={`M${-r * 0.55},${-r * 0.1} L${r * 0.55},${-r * 0.1}`} stroke="#3a6a3e" strokeWidth={22} /><path d={`M${-r * 0.55},${-r * 0.1} L${r * 0.55},${-r * 0.1}`} stroke={INK} strokeWidth={22} strokeOpacity={0} />
  </g>
);
const bicorne = (r: number) => (
  <g transform={`translate(0,${-r * 0.7})`}>
    <Part d={`M${-r * 1.2},${r * 0.14} C${-r * 0.9},${-r * 0.7} ${r * 0.9},${-r * 0.7} ${r * 1.2},${r * 0.14} C${r * 0.6},${r * 0.02} ${-r * 0.6},${r * 0.02} ${-r * 1.2},${r * 0.14} Z`} fill="#1d1c26" off={[20, 16]} soft={6} />
    <path d={`M${-r * 1.12},${r * 0.08} C${-r * 0.6},${-r * 0.04} ${r * 0.6},${-r * 0.04} ${r * 1.12},${r * 0.08}`} stroke="#e9c35a" strokeWidth={9} fill="none" />
    <circle cx={r * 0.1} cy={-r * 0.22} r={r * 0.11} fill="#c8323a" stroke={INK} strokeWidth={5} />
  </g>
);
const pickel = (r: number) => (
  <g transform={`translate(0,${-r * 0.56})`}>
    <Part d={`M${-r * 0.8},${r * 0.16} C${-r * 0.8},${-r * 0.7} ${r * 0.8},${-r * 0.7} ${r * 0.8},${r * 0.16} C${r * 0.4},${r * 0.26} ${-r * 0.4},${r * 0.26} ${-r * 0.8},${r * 0.16} Z`} fill="#2a2a30" off={[20, 18]} soft={6} hi />
    <Part d={`M${-r * 0.1},${-r * 0.48} L0,${-r * 0.98} L${r * 0.1},${-r * 0.48} Z`} fill="#e9c35a" sw={6} off={[3, 3]} />
    <Part d={`M${-r * 0.22},${-r * 0.3} L0,${-r * 0.42} L${r * 0.22},${-r * 0.3} L${r * 0.16},${r * 0.02} L${-r * 0.16},${r * 0.02} Z`} fill="#e9c35a" sw={5} off={[3, 3]} />
  </g>
);
export const REDCOAT: Outfit = {
  shirt: "#c4352f", pants: "#2d2f3f", shoe: "#1f1d24",
  torso: () => (<g><path d="M-100,-190 L90,0 M100,-190 L-90,0" stroke={INK} strokeWidth={34} /><path d="M-100,-190 L90,0 M100,-190 L-90,0" stroke="#f1ece0" strokeWidth={22} />{btns([0], [-160, -110, -60])}{belt("#f1ece0", "#e9c35a")}</g>),
  collar: <Part d="M-50,-224 L50,-224 L46,-196 L-46,-196 Z" fill="#1f2a4a" sw={6} off={[3, 3]} />,
  hat: shako,
};
export const BLUECOAT: Outfit = {
  shirt: "#3a5596", pants: "#6f84ae", shoe: "#1f1d24",
  torso: () => (<g>{btns([-28, 28], [-170, -120, -70])}{belt()}</g>),
  collar: <Part d="M-50,-224 L50,-224 L46,-198 L-46,-198 Z" fill="#2c4278" sw={6} off={[3, 3]} />,
  hat: kepi("#2f467e"),
};
export const PICKETT: Outfit = { ...BLUECOAT, headFx: <g>{mustache("#7a5232", 1.1)}<Part d="M-18,70 C-14,110 14,110 18,70 Z" fill="#7a5232" sw={5} off={[2, 3]} /></g>,
  torso: () => (<g>{btns([-28, 28], [-170, -120, -70])}{belt()}<path d="M-90,-200 L-50,-160" stroke="#e9c35a" strokeWidth={14} /><path d="M90,-200 L50,-160" stroke="#e9c35a" strokeWidth={14} /></g>) };
export const GRIFFIN: Outfit = {
  shirt: "#3f7a4a", pants: "#4a4a52",
  torso: () => (<g><Part d="M-40,-224 L0,-120 L40,-224 Z" fill="#f4f1ea" sw={6} off={[3, 3]} /><Part d="M-22,-210 L0,-196 L22,-210 L22,-186 L0,-196 L-22,-186 Z" fill="#c8323a" sw={4} off={[2, 2]} />{btns([-50, 50], [-100, -50], "#d9d2c0")}</g>),
  hat: topHat,
  headFx: <Part d="M-120,40 C-110,120 -50,150 0,150 C50,150 110,120 120,40 C90,90 50,100 0,100 C-50,100 -90,90 -120,40 Z" fill="#c4682e" sw={6} off={[6, 8]} soft={3} />,
};
export const ADMIRAL: Outfit = {
  shirt: "#22305a", pants: "#f1ece0", shoe: "#1f1d24",
  torso: () => (<g>{btns([-34, 34], [-170, -120, -70, -20])}<path d="M-96,-150 L80,-10" stroke="#e9c35a" strokeWidth={8} opacity={0} /></g>),
  collar: <g><Part d="M-50,-226 L50,-226 L46,-198 L-46,-198 Z" fill="#e9c35a" sw={6} off={[3, 3]} />
    <Part d="M-150,-214 C-150,-246 -80,-250 -70,-214 C-80,-200 -140,-196 -150,-214 Z" fill="#e9c35a" sw={6} off={[4, 4]} />
    <Part d="M150,-214 C150,-246 80,-250 70,-214 C80,-200 140,-196 150,-214 Z" fill="#e9c35a" sw={6} off={[4, 4]} /></g>,
  hat: bicorne,
  headFx: mustache("#cfcbd6", 0.9),
};
export const KAISER: Outfit = {
  shirt: "#3b4558", pants: "#2a2a30", shoe: "#1f1d24",
  torso: () => (<g>{btns([-30, 30], [-170, -120, -70])}<g transform="translate(-50,-120)"><circle r={18} fill="#e9c35a" stroke={INK} strokeWidth={5} /><path d="M-10,-30 L10,-30 L0,-14 Z" fill="#c8323a" stroke={INK} strokeWidth={4} /></g><path d="M-100,-196 L70,-10" stroke="#e9c35a" strokeWidth={16} opacity={0.9} /></g>),
  collar: <Part d="M-50,-226 L50,-226 L46,-198 L-46,-198 Z" fill="#c8323a" sw={6} off={[3, 3]} />,
  hat: pickel,
  headFx: <g>{mustache("#e6e3ea", 1.3)}<Part d="M-150,-10 C-180,60 -150,140 -90,140 C-80,100 -90,60 -60,50 C-90,40 -120,20 -130,-10 Z" fill="#e6e3ea" sw={6} off={[4, 6]} /><Part d="M150,-10 C180,60 150,140 90,140 C80,100 90,60 60,50 C90,40 120,20 130,-10 Z" fill="#e6e3ea" sw={6} off={[4, 6]} /></g>,
};

/** ghost of the pig: translucent, floating, halo */
export const GhostPig: React.FC<{ x: number; y: number; s?: number; f: number; flip?: boolean; expr?: "happy" | "munch" | "shock" | "dead" }> = ({ x, y, s = 1, f, flip, expr = "happy" }) => (
  <g opacity={0.82} transform={`translate(0,${Math.sin(f * 0.12) * 14})`}>
    <g filter="url(#ghost)"><Pig x={x} y={y} s={s} flip={flip} expr={expr} halo tail={Math.sin(f * 0.3)} /></g>
  </g>
);
