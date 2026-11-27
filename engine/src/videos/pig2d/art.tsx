// 2D illustration kit matching the reference reels: thick warm-dark ink outlines, flat fills with one soft cel
// shadow (lower-right), a soft lit side (upper-left), white ball heads, white cartoon gloves, painted backgrounds.
// Every primitive is pure SVG so it renders identically in Remotion and in the fast still harness.
import React, { useId } from "react";

export const INK = "#2b2329";
import { GRAIN } from "./grain";
const clamp = (x: number) => Math.max(0, Math.min(255, Math.round(x)));
const hex = (c: string) => { const n = parseInt(c.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
export const mix = (a: string, b: string, k: number) => {
  const A = hex(a), B = hex(b); return "#" + A.map((x, i) => clamp(x + (B[i] - x) * k).toString(16).padStart(2, "0")).join("");
};
/** cel shadow tone: darker, slightly cooler/more saturated, like the references */
export const shadeOf = (c: string, k = 0.48) => mix(mix(c, "#3a2a55", k * 0.55), "#000000", k * 0.45);
export const lightOf = (c: string, k = 0.25) => mix(c, "#ffffff", k);
const uid = () => useId().replace(/[^a-zA-Z0-9]/g, "");

/** global filters, once per frame */
export const Defs: React.FC = () => (
  <defs>
    {[1.5, 3, 5, 8, 12, 20].map((s) => (
      <filter key={s} id={`blur${String(s).replace(".", "_")}`} x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation={s} /></filter>
    ))}
    <pattern id="halftone" width="34" height="34" patternUnits="userSpaceOnUse" patternTransform="rotate(30)">
      <circle cx="8" cy="8" r="5" fill="#ffffff" opacity="0.22" />
    </pattern>
    <linearGradient id="form" x1="0" y1="0" x2="0.35" y2="1"><stop offset="0" stopColor="#fff" stopOpacity="0.16" /><stop offset="0.5" stopColor="#fff" stopOpacity="0" /><stop offset="1" stopColor="#1a1030" stopOpacity="0.22" /></linearGradient>
    <pattern id="grain" width="256" height="256" patternUnits="userSpaceOnUse"><image href={GRAIN} width="256" height="256" /></pattern>
    <radialGradient id="headg" cx="0.38" cy="0.3" r="0.78"><stop offset="0.3" stopColor="#ffffff" stopOpacity="0" /><stop offset="0.68" stopColor="#8f8ea8" stopOpacity="0.32" /><stop offset="1" stopColor="#5f5e7c" stopOpacity="0.7" /></radialGradient>
    <filter id="ghost" colorInterpolationFilters="sRGB"><feColorMatrix type="saturate" values="0.12" /><feComponentTransfer><feFuncR type="linear" slope="0.6" intercept="0.42" /><feFuncG type="linear" slope="0.6" intercept="0.44" /><feFuncB type="linear" slope="0.6" intercept="0.5" /></feComponentTransfer></filter>
    <filter id="grade" colorInterpolationFilters="sRGB"><feColorMatrix type="saturate" values="0.82" /><feComponentTransfer><feFuncR type="linear" slope="1.02" intercept="0.01" /><feFuncB type="linear" slope="0.96" intercept="0.0" /></feComponentTransfer></filter>
    <radialGradient id="vign" cx="50%" cy="45%" r="75%"><stop offset="60%" stopColor="#000" stopOpacity="0" /><stop offset="100%" stopColor="#120a18" stopOpacity="0.5" /></radialGradient>
  </defs>
);
const B = (s: number) => `url(#blur${String(s).replace(".", "_")})`;

/** a filled, shaded, outlined shape. Shadow sits lower-right; lit fill is the shape shifted up-left, soft-edged. */
export const Part: React.FC<{
  d: string; fill: string; shade?: string; sw?: number; off?: [number, number]; soft?: number; ink?: string;
  hi?: boolean; children?: React.ReactNode; opacity?: number;
}> = ({ d, fill, shade, sw = 8, off = [22, 26], soft = 5, ink = INK, hi = false, children, opacity }) => {
  const id = uid();
  return (
    <g opacity={opacity}>
      <clipPath id={`c${id}`}><path d={d} /></clipPath>
      <path d={d} fill={shade ?? shadeOf(fill)} />
      <g clipPath={`url(#c${id})`}>
        <path d={d} fill={fill} stroke={fill} strokeWidth={soft * 2} transform={`translate(${-off[0]},${-off[1]})`} filter={soft ? B(soft) : undefined} />
        {hi && <path d={d} fill="none" stroke={lightOf(fill, 0.55)} strokeWidth={10} opacity={0.6} transform={`translate(${off[0] * 0.5},${off[1] * 0.5})`} filter={B(5)} />}
        {children}
        <path d={d} fill="url(#form)" />
      </g>
      {sw > 0 && <path d={d} fill="none" stroke={ink} strokeWidth={sw} strokeLinejoin="round" strokeLinecap="round" />}
    </g>
  );
};

/** a bendable limb (sleeve / leg): outlined tube with a soft lit stripe */
export const Tube: React.FC<{ d: string; w: number; fill: string; sw?: number; cap?: "round" | "butt" }> = ({ d, w, fill, sw = 8, cap = "round" }) => {
  const id = uid(), sh = shadeOf(fill);
  return (
    <g>
      <path d={d} fill="none" stroke={INK} strokeWidth={w + sw * 2} strokeLinecap={cap} strokeLinejoin="round" />
      <mask id={`m${id}`} maskUnits="userSpaceOnUse" x="-2000" y="-2000" width="6000" height="6000"><path d={d} fill="none" stroke="#fff" strokeWidth={w} strokeLinecap={cap} strokeLinejoin="round" /></mask>
      <g mask={`url(#m${id})`}>
        <path d={d} fill="none" stroke={sh} strokeWidth={w + 4} strokeLinecap={cap} strokeLinejoin="round" />
        <path d={d} fill="none" stroke={fill} strokeWidth={w * 0.72} strokeLinecap={cap} strokeLinejoin="round" transform={`translate(${-w * 0.16},${-w * 0.2})`} filter={B(3)} />
      </g>
    </g>
  );
};

/** ellipse helper path */
export const ell = (cx: number, cy: number, rx: number, ry = rx) =>
  `M${cx - rx},${cy} a${rx},${ry} 0 1,0 ${rx * 2},0 a${rx},${ry} 0 1,0 ${-rx * 2},0 Z`;

/** soft contact shadow on the ground */
export const Floor: React.FC<{ x: number; y: number; rx: number; ry?: number; o?: number }> = ({ x, y, rx, ry = rx * 0.22, o = 0.28 }) => (
  <ellipse cx={x} cy={y} rx={rx} ry={ry} fill="#1c1420" opacity={o} filter={B(5)} />
);

/** cartoon hand like the references: one merged white silhouette (fingers touch, slim and tapered), outline only on
 *  the outside, finger separations as short inner lines, soft grey shading. Wrist at origin, fingers toward +x. */
export type HandPose = "open" | "fist" | "point" | "thumb" | "ok" | "wave" | "rest";
const cap = (x0: number, y0: number, ang: number, len: number, w0: number, w1 = w0 * 0.82) => {
  const r = (ang * Math.PI) / 180, c = Math.cos(r), s = Math.sin(r), x1 = x0 + c * len, y1 = y0 + s * len;
  const n0x = -s * w0 / 2, n0y = c * w0 / 2, n1x = -s * w1 / 2, n1y = c * w1 / 2;
  return { d: `M${x0 + n0x},${y0 + n0y} L${x1 + n1x},${y1 + n1y} A${w1 / 2},${w1 / 2} 0 0,0 ${x1 - n1x},${y1 - n1y} L${x0 - n0x},${y0 - n0y} Z`, tip: [x1, y1] as [number, number], base: [x0, y0] as [number, number] };
};
const HANDS: Record<HandPose, { parts: string[]; lines: string[] }> = (() => {
  const palm = "M-4,-30 C24,-38 56,-34 64,-12 C70,8 64,30 40,36 C16,40 -4,32 -6,10 Z";
  const mk = (fing: [number, number, number, number, number][], thumb: [number, number, number, number, number]) => {
    const F = fing.map(([x, y, a, l, w]) => cap(x, y, a, l, w)), T = cap(...thumb);
    const lines = F.slice(0, -1).map((f, i) => {
      const g = F[i + 1], bx = (f.base[0] + g.base[0]) / 2 + 8, by = (f.base[1] + g.base[1]) / 2, tx = (f.tip[0] + g.tip[0]) / 2, ty = (f.tip[1] + g.tip[1]) / 2;
      const k = 0.62; return `M${bx},${by} L${bx + (tx - bx) * k},${by + (ty - by) * k}`;
    });
    return { parts: [palm, ...F.map((f) => f.d), T.d], lines };
  };
  return {
    rest: mk([[50, -18, -6, 50, 24], [54, -4, -1, 56, 24], [54, 10, 4, 54, 24], [48, 23, 10, 44, 22]], [22, -24, -36, 36, 24]),
    open: mk([[48, -22, -14, 58, 25], [52, -6, -3, 66, 25], [52, 10, 8, 62, 25], [46, 24, 20, 48, 23]], [18, -24, -62, 44, 25]),
    wave: mk([[46, -24, -30, 60, 24], [52, -8, -10, 68, 24], [52, 10, 10, 64, 24], [44, 26, 30, 50, 22]], [16, -26, -80, 44, 24]),
    point: mk([[50, -18, -4, 84, 25], [60, 0, 60, 14, 26], [56, 16, 70, 12, 26], [48, 28, 80, 10, 24]], [30, -26, -8, 30, 24]),
    fist: mk([[58, -20, 40, 14, 26], [62, -2, 50, 14, 26], [60, 14, 60, 12, 26], [52, 28, 72, 10, 24]], [26, -24, 10, 36, 24]),
    thumb: mk([[58, -16, 40, 14, 26], [62, 0, 50, 14, 26], [60, 15, 60, 12, 26], [52, 28, 72, 10, 24]], [22, -26, -90, 50, 26]),
    ok: mk([[48, -22, -40, 58, 24], [52, -8, -20, 64, 24], [52, 10, 30, 22, 25], [46, 24, 45, 16, 23]], [26, -24, 6, 40, 24]),
  };
})();
export const Glove: React.FC<{ x: number; y: number; a?: number; s?: number; pose?: HandPose; flip?: boolean }> = ({ x, y, a = 0, s = 1, pose = "open", flip }) => {
  const id = uid(), H = HANDS[pose];
  return (
    <g transform={`translate(${x},${y}) rotate(${a}) scale(${s},${s * (flip ? -1 : 1)})`}>
      {H.parts.map((d, i) => <path key={i} d={d} fill={INK} stroke={INK} strokeWidth={13} strokeLinejoin="round" />)}
      <clipPath id={`h${id}`}>{H.parts.map((d, i) => <path key={i} d={d} />)}</clipPath>
      <g clipPath={`url(#h${id})`}>
        <rect x={-60} y={-120} width={260} height={240} fill="#bdbccd" />
        <g transform="translate(-7,-9)" filter={B(4)}>{H.parts.map((d, i) => <path key={i} d={d} fill="#f8f7fb" stroke="#f8f7fb" strokeWidth={6} />)}</g>
      </g>
      {H.lines.map((d, i) => <path key={i} d={d} stroke={INK} strokeWidth={5} strokeLinecap="round" fill="none" opacity={0.85} />)}
      <path d="M8,-10 C14,0 14,12 8,20" stroke="#9e9db2" strokeWidth={4} fill="none" strokeLinecap="round" />
    </g>
  );
};

/** tapered sleeve/leg along a bend: s -> elbow e -> h, width w0 at s, w1 at h; returns closed path */
export const sleeve = (s: [number, number], e: [number, number], h: [number, number], w0: number, w1: number) => {
  const c: [number, number] = [e[0] * 2 - (s[0] + h[0]) / 2, e[1] * 2 - (s[1] + h[1]) / 2];
  const P = (t: number) => [(1 - t) ** 2 * s[0] + 2 * (1 - t) * t * c[0] + t * t * h[0], (1 - t) ** 2 * s[1] + 2 * (1 - t) * t * c[1] + t * t * h[1]];
  const D = (t: number) => { const dx = 2 * (1 - t) * (c[0] - s[0]) + 2 * t * (h[0] - c[0]), dy = 2 * (1 - t) * (c[1] - s[1]) + 2 * t * (h[1] - c[1]); const n = Math.hypot(dx, dy) || 1; return [dx / n, dy / n]; };
  const N = 14, L: number[][] = [], R: number[][] = [];
  for (let i = 0; i <= N; i++) { const t = i / N, p = P(t), d = D(t), w = (w0 + (w1 - w0) * t ** 1.6) / 2; L.push([p[0] - d[1] * w, p[1] + d[0] * w]); R.push([p[0] + d[1] * w, p[1] - d[0] * w]); }
  const d0 = D(0), d1 = D(1), p0 = P(0), p1 = P(1);
  const cap0 = `Q${p0[0] - d0[0] * w0 * 0.6},${p0[1] - d0[1] * w0 * 0.6} `, cap1 = `Q${p1[0] + d1[0] * w1 * 0.25},${p1[1] + d1[1] * w1 * 0.25} `;
  return "M" + L.map((p) => p.map((v) => v.toFixed(1)).join(",")).join(" L") + " " + cap1 + R[N].map((v) => v.toFixed(1)).join(",") + " L" + R.slice().reverse().map((p) => p.map((v) => v.toFixed(1)).join(",")).join(" L") + " " + cap0 + L[0].map((v) => v.toFixed(1)).join(",") + " Z";
};

export type Expr = "neutral" | "angry" | "squint" | "happy" | "shock" | "smug" | "sad" | "bored" | "grin" | "yell";
/** white ball head with a minimal face; look = face offset (-1..1) toward a side (3/4 view) */
export const Head: React.FC<{ x: number; y: number; r: number; expr?: Expr; look?: number; tilt?: number; talk?: number; blink?: boolean; children?: React.ReactNode; hat?: React.ReactNode }> = ({ x, y, r, expr = "neutral", look = 0.35, tilt = 0, talk = 0, blink, children, hat }) => {
  const fx = look * r * 0.4, ex = r * 0.3, ey = r * 0.02, er = r * 0.095, lw = r * 0.055;
  const E = (side: -1 | 1) => {
    const cx = fx + side * ex * (1 - Math.abs(look) * 0.35 * (side * Math.sign(look) < 0 ? 1 : 0)), cy = ey;
    if (blink || expr === "happy" || expr === "grin") return <path d={`M${cx - er * 1.6},${cy + er * 0.4} Q${cx},${cy - er * 1.8} ${cx + er * 1.6},${cy + er * 0.4}`} stroke={INK} strokeWidth={lw} fill="none" strokeLinecap="round" />;
    if (expr === "squint" || expr === "bored") return <g><path d={`M${cx - er * 1.7},${cy - er * 0.1} L${cx + er * 1.7},${cy - er * 0.1}`} stroke={INK} strokeWidth={lw} strokeLinecap="round" /><ellipse cx={cx + look * er} cy={cy + er * 0.5} rx={er * 0.85} ry={er * 0.6} fill={INK} /></g>;
    if (expr === "shock") return <g><ellipse cx={cx} cy={cy} rx={er * 1.7} ry={er * 2} fill="#fff" stroke={INK} strokeWidth={lw * 0.8} /><circle cx={cx} cy={cy} r={er * 0.6} fill={INK} /></g>;
    const lid = expr === "smug" || expr === "sad";
    return <g><ellipse cx={cx} cy={cy} rx={er} ry={er * 1.25} fill={INK} />
      {lid && <path d={`M${cx - er * 1.8},${cy - er * (expr === "sad" ? 0.2 : 0.3)} L${cx + er * 1.8},${cy - er * (expr === "sad" ? 0.2 : 0.3)}`} stroke={INK} strokeWidth={lw} strokeLinecap="round" />}
      {(expr === "angry" || expr === "yell") && <path d={`M${cx + er * 2 * side},${cy - er * 2.8} L${cx - er * 1.4 * side},${cy - er * 1.5}`} stroke={INK} strokeWidth={lw * 1.1} strokeLinecap="round" />}
      {expr === "sad" && <path d={`M${cx + er * 1.8 * side},${cy - er * 1.6} L${cx - er * 1.4 * side},${cy - er * 2.6}`} stroke={INK} strokeWidth={lw} strokeLinecap="round" />}
    </g>;
  };
  const mx = fx + look * r * 0.12, my = r * 0.44, mw = r * 0.3;
  const open = Math.max(talk, expr === "shock" || expr === "yell" ? 0.8 : expr === "grin" ? 0.55 : 0);
  let mouth: React.ReactNode;
  if (open > 0.05) {
    const h = r * 0.32 * open + r * 0.04, w = mw * (expr === "yell" ? 1.3 : 1);
    const d = `M${mx - w},${my - h * 0.3} Q${mx},${my - h * 0.55} ${mx + w},${my - h * 0.3} Q${mx + w * 0.8},${my + h} ${mx},${my + h} Q${mx - w * 0.8},${my + h} ${mx - w},${my - h * 0.3} Z`;
    mouth = <g><path d={d} fill="#3a2530" stroke={INK} strokeWidth={lw} strokeLinejoin="round" />
      <ellipse cx={mx + w * 0.15} cy={my + h * 0.72} rx={w * 0.55} ry={h * 0.3} fill="#c4606c" /></g>;
  } else {
    const c = expr === "happy" || expr === "smug" ? r * 0.12 : expr === "sad" || expr === "angry" ? -r * 0.1 : expr === "bored" ? 0 : r * 0.03;
    mouth = <path d={`M${mx - mw * 0.75},${my} Q${mx},${my + c} ${mx + mw * 0.75},${my - (expr === "smug" ? r * 0.08 : 0)}`} stroke={INK} strokeWidth={lw} fill="none" strokeLinecap="round" />;
  }
  return (
    <g transform={`translate(${x},${y}) rotate(${tilt})`}>
      <Part d={ell(0, 0, r)} fill="#f7f6fa" shade="#a9a8bd" off={[r * 0.26, r * 0.34]} soft={Math.max(5, r * 0.13)} sw={Math.max(7, r * 0.045)}>
        <circle cx={0} cy={0} r={r} fill="url(#headg)" />
        {hat && <ellipse cx={r * 0.1} cy={-r * 0.5} rx={r * 1.1} ry={r * 0.26} fill="#4a3a58" opacity={0.38} filter={B(8)} />}
      </Part>
      <ellipse cx={-r * 0.4} cy={-r * 0.45} rx={r * 0.22} ry={r * 0.13} fill="#fff" opacity={0.75} transform={`rotate(-35,${-r * 0.4},${-r * 0.45})`} filter={B(3)} />
      {E(-1)}{E(1)}{mouth}{children}{hat}
    </g>
  );
};

/** generic outlined background element: thinner ink, optional depth blur */
export const Far: React.FC<{ blur?: number; children: React.ReactNode; o?: number }> = ({ blur = 0, children, o = 1 }) => (
  <g filter={blur ? B(blur) : undefined} opacity={o}>{children}</g>
);

/** deterministic random */
export const rnd = (seed: number) => { let x = Math.sin(seed * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
