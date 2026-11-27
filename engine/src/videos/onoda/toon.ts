// Our own flat 2D cartoon cast (riflemen, officer, townsfolk, kid, parent) + 2D effects, drawn on a canvas.
// Construction v2 (characters.md, our own cast): superellipse heads (pointed crown 1.75 / full jaw 2.3, chin taper,
// seeded side bulge + tilt), bean torsos, single-stroke limbs with ink-dot hands, a thick-thin plum outline weighted
// away from the light, soft painted crescents, deadpan lidded eyes, no blush, no catchlights.
// Design space 600 x 1000 units (soles at y = 975); the canvas transform scales it.
export const INK = "#241726";
export const SKIN = "#ffe2c2";
const WHITE = "#ffffff";
const MOUTH = "#5a1e28";
const TONGUE = "#e86e78";
type C3 = [number, number, number];
const SH_SKIN: C3 = [0.96, 0.86, 0.84]; // measured shadow/lit ratio on skin heads
const SH_CLOTH: C3 = [0.64, 0.66, 0.74]; // torsos: lit side -> far side ~0.65
const SH_FELT: C3 = [0.62, 0.62, 0.7];

export type Build = "adult" | "stout" | "kid";
export type Outfit = {
  jacket: string; pants: string; boots: string; hat?: string | null; belt?: string | null; buttons?: string; rifle?: boolean;
  sash?: string; sword?: boolean; moustache?: string; skin?: string; head?: number; cap?: string; hair?: string; dress?: string;
  build?: Build; stripes?: string; hatCol?: string; trim?: string;
  /** WWI gas mask over the face; a puppy's head peeking out of the coat */
  mask?: boolean; pup?: boolean;
  /** backpack (straps over the chest, pack showing at the sides); patched, faded uniform */
  pack?: string; patches?: boolean;
};
type P2 = [number, number];

const rad = (d: number) => (d * Math.PI) / 180;
const clamp = (x: number, a: number, b: number) => Math.max(a, Math.min(b, x));
export const mul = (c: string, m: C3) => {
  const n = parseInt(c.slice(1), 16);
  const ch = (v: number, k: number) => Math.min(255, Math.round(v * k)).toString(16).padStart(2, "0");
  return `#${ch((n >> 16) & 255, m[0])}${ch((n >> 8) & 255, m[1])}${ch(n & 255, m[2])}`;
};
export const shade = (c: string, k: number) => mul(c, [k, k, k]);
export const mix = (a: string, b: string, t: number) => {
  const A = parseInt(a.slice(1), 16), B = parseInt(b.slice(1), 16);
  const ch = (s: number) => Math.round(((A >> s) & 255) * (1 - t) + ((B >> s) & 255) * t).toString(16).padStart(2, "0");
  return `#${ch(16)}${ch(8)}${ch(0)}`;
};
/** deterministic per-character random in [0, 1) */
const rnd = (seed: number, k: number) => { const x = Math.sin(seed * 127.1 + k * 311.7) * 43758.5453; return x - Math.floor(x); };
const rotPts = (pts: P2[], a: number, cx: number, cy: number): P2[] =>
  pts.map(([x, y]) => [cx + (x - cx) * Math.cos(a) - (y - cy) * Math.sin(a), cy + (x - cx) * Math.sin(a) + (y - cy) * Math.cos(a)]);
const rotAbout = (q: P2, a: number, c: P2): P2 => rotPts([q], a, c[0], c[1])[0];
const lerp2 = (a: P2, b: P2, t: number): P2 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
/** smooth curve from a through (near) k to b, as a polyline */
const curve = (a: P2, k: P2, b: P2, n = 10): P2[] => {
  const c: P2 = [2 * k[0] - (a[0] + b[0]) / 2, 2 * k[1] - (a[1] + b[1]) / 2], out: P2[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n, s = 1 - t;
    out.push([s * s * a[0] + 2 * s * t * c[0] + t * t * b[0], s * s * a[1] + 2 * s * t * c[1] + t * t * b[1]]);
  }
  return out;
};

export const RIFLEMAN: Outfit = { jacket: "#357650", pants: "#3d4440", boots: INK, hat: "shako", belt: "#f1efe6", buttons: "#d9dde0", rifle: true };
export const OFFICER: Outfit = { ...RIFLEMAN, hat: "shako_tall", buttons: "#e8c45a", sash: "#c0353a", sword: true, moustache: "#4a3020", rifle: false, belt: null, build: "stout" };
export const KID: Outfit = { jacket: "#f08a2c", pants: "#3b5b9a", boots: "#f4f1ea", hat: "cap", cap: "#e2453c", build: "kid" };
export const PARENT: Outfit = { jacket: "#7b5ac9", pants: "#3b3f52", boots: "#5a3b2a", hat: "hair", hair: "#5a3b2a" };
export const SKINS = [SKIN, "#f5c9a0", "#ecd0b6", "#c99067"];

export const soldier = (v = 0, extra: Partial<Outfit> = {}): Outfit => {
  const o: Outfit = { ...RIFLEMAN, skin: SKINS[v % 4] };
  if (v % 4 === 1) o.moustache = "#4a3426";
  if (v % 4 === 3) o.moustache = "#2a201a";
  return { ...o, ...extra };
};

export const townsfolk = (v = 0): Outfit => {
  const coats = ["#3f6fb5", "#8c3b4a", "#5d7a3a", "#b5653f", "#2f5f6a", "#7b5ac9"];
  const o: Outfit = { jacket: coats[v % 6], pants: "#3b3f52", boots: "#4a3426", skin: SKINS[v % 4] };
  return v % 2 ? { ...o, hat: "bonnet", dress: ["#d9a441", "#c25a7a", "#5a8fc2"][v % 3] } : { ...o, hat: "tophat" };
};

export class Pen {
  g: CanvasRenderingContext2D;
  ol = 12;
  /** [angle, cx, cy] rotation about (cx, cy), optional post-translation [.., dx, dy] */
  rot: number[] | null = null;
  constructor(g: CanvasRenderingContext2D) { this.g = g; }
  P(x: number, y: number): P2 {
    if (!this.rot) return [x, y];
    const r = this.rot, a = r[0], cx = r[1], cy = r[2], dx = r.length > 3 ? r[3] : 0, dy = r.length > 4 ? r[4] : 0, c = Math.cos(a), s = Math.sin(a);
    return [cx + (x - cx) * c - (y - cy) * s + dx, cy + (x - cx) * s + (y - cy) * c + dy];
  }
  path(pts: P2[], close: boolean) {
    const g = this.g;
    g.beginPath();
    pts.forEach((p, i) => { const [x, y] = this.P(p[0], p[1]); if (i) g.lineTo(x, y); else g.moveTo(x, y); });
    if (close) g.closePath();
  }
  /** filled shape with an ink outline; fill=null draws the outline only */
  poly(pts: P2[], fill: string | null, ol?: number) {
    const g = this.g, w = ol ?? this.ol;
    this.path(pts, true);
    if (fill) { g.fillStyle = fill; g.fill(); }
    if (w) { g.lineWidth = w; g.strokeStyle = INK; g.lineJoin = "round"; g.stroke(); }
  }
  ell(cx: number, cy: number, rx: number, ry: number, fill: string | null, ol?: number, a0 = 0, a1 = 360, rot = 0) {
    this.poly(ellPts(cx, cy, rx, ry, a0, a1, rot), fill, ol);
  }
  /** thick round-capped limb with an ink rim (effects, rope) */
  line(pts: P2[], fill: string, w: number, ink = true) {
    const g = this.g;
    g.lineCap = "round"; g.lineJoin = "round";
    if (ink) { this.path(pts, false); g.strokeStyle = INK; g.lineWidth = w + 2 * this.ol * 0.9; g.stroke(); }
    this.path(pts, false); g.strokeStyle = fill; g.lineWidth = w; g.stroke();
  }
  stroke(pts: P2[], w: number, fill = INK) {
    const g = this.g;
    g.lineCap = "round"; g.lineJoin = "round";
    this.path(pts, false); g.strokeStyle = fill; g.lineWidth = w; g.stroke();
  }
  arc(cx: number, cy: number, rx: number, ry: number, a0: number, a1: number, w: number, fill = INK) {
    const pts: P2[] = [];
    for (let i = 0; i <= 24; i++) pts.push([cx + rx * Math.cos(rad(a0 + ((a1 - a0) * i) / 24)), cy + ry * Math.sin(rad(a0 + ((a1 - a0) * i) / 24))]);
    this.stroke(pts, w, fill);
  }
  dot(cx: number, cy: number, r: number, fill = INK) {
    const [x, y] = this.P(cx, cy);
    this.g.beginPath(); this.g.arc(x, y, r, 0, Math.PI * 2); this.g.fillStyle = fill; this.g.fill();
  }
  /** draw with a closed shape as clip */
  clip(pts: P2[], fn: () => void) { const g = this.g; g.save(); this.path(pts, true); g.clip(); fn(); g.restore(); }
  /** flat fill + soft crescent on the side away from the light (light = canvas angle the light comes FROM).
   *  Radial ramp centred `shift` R toward the light: flat out to ~0.6 R on the far side, full shadow by ~0.8 R. */
  shadedFill(pts: P2[], base: string, shadow: string, light: number, R: number, shift = 0.45, r0 = 1.05, r1 = 1.25) {
    const g = this.g, n = pts.length;
    let cx = 0, cy = 0;
    for (const [x, y] of pts) { cx += x / n; cy += y / n; }
    const [gx, gy] = this.P(cx + Math.cos(light) * shift * R, cy + Math.sin(light) * shift * R);
    const gr = g.createRadialGradient(gx, gy, 0, gx, gy, r1 * R);
    gr.addColorStop(0, base); gr.addColorStop(r0 / r1, base); gr.addColorStop(1, shadow);
    this.path(pts, true); g.fillStyle = gr; g.fill();
  }
  /** broad gradient across a shape along the light: lit edge = base, far edge = shadow (torsos, coats) */
  gradFill(pts: P2[], base: string, shadow: string, light: number, flat = 0.22) {
    const g = this.g, dx = Math.cos(light), dy = Math.sin(light), n = pts.length;
    let cx = 0, cy = 0, lo = Infinity, hi = -Infinity;
    for (const [x, y] of pts) { cx += x / n; cy += y / n; const d = x * dx + y * dy; lo = Math.min(lo, d); hi = Math.max(hi, d); }
    const dc = cx * dx + cy * dy;
    const [ax, ay] = this.P(cx + dx * (hi - dc), cy + dy * (hi - dc)), [bx, by] = this.P(cx + dx * (lo - dc), cy + dy * (lo - dc));
    const gr = g.createLinearGradient(ax, ay, bx, by);
    gr.addColorStop(0, base); gr.addColorStop(flat, base); gr.addColorStop(1, shadow);
    this.path(pts, true); g.fillStyle = gr; g.fill();
  }
  /** thick-thin ink ring: w(θ) = w0 (1 + k cos(θ − thick)), θ from the contour centroid (canvas angles) */
  inkRing(pts: P2[], w0: number, thick: number, k = 0.45, col = INK) {
    const n = pts.length;
    let cx = 0, cy = 0;
    for (const [x, y] of pts) { cx += x / n; cy += y / n; }
    const out: P2[] = [], inn: P2[] = [];
    pts.forEach((q, i) => {
      const a = pts[(i + n - 1) % n], b = pts[(i + 1) % n];
      let nx = b[1] - a[1], ny = a[0] - b[0]; // outward normal for clockwise-on-screen contours
      const l = Math.hypot(nx, ny) || 1; nx /= l; ny /= l;
      const h = 0.5 * w0 * (1 + k * Math.cos(Math.atan2(q[1] - cy, q[0] - cx) - thick));
      out.push([q[0] + nx * h, q[1] + ny * h]); inn.push([q[0] - nx * h, q[1] - ny * h]);
    });
    const g = this.g;
    const trace = (r: P2[]) => { r.forEach(([x0, y0], i) => { const [x, y] = this.P(x0, y0); if (i) g.lineTo(x, y); else g.moveTo(x, y); }); g.closePath(); };
    g.beginPath(); trace(out); trace(inn.reverse());
    g.fillStyle = col; g.fill("evenodd");
  }
  /** flat strap with a thin ink rim (cross belts, sash, rifle, handles) */
  band(pts: P2[], fill: string, w: number, rim: number, cap: CanvasLineCap = "butt") {
    const g = this.g; g.lineCap = cap; g.lineJoin = "round";
    this.path(pts, false); g.strokeStyle = INK; g.lineWidth = w + 2 * rim; g.stroke();
    this.path(pts, false); g.strokeStyle = fill; g.lineWidth = w; g.stroke();
    g.lineCap = "round";
  }
}

const ellPts = (cx: number, cy: number, rx: number, ry: number, a0 = 0, a1 = 360, rot = 0, n = 48): P2[] => {
  const r = rad(rot), pts: P2[] = [];
  for (let i = 0; i <= n; i++) {
    const a = rad(a0 + ((a1 - a0) * i) / n), x = rx * Math.cos(a), y = ry * Math.sin(a);
    pts.push([cx + x * Math.cos(r) - y * Math.sin(r), cy + x * Math.sin(r) + y * Math.cos(r)]);
  }
  return pts;
};

const rrect = (x0: number, y0: number, x1: number, y1: number, r: number, n = 8): P2[] => {
  const pts: P2[] = [];
  for (const [cx, cy, a] of [[x1 - r, y0 + r, -90], [x1 - r, y1 - r, 0], [x0 + r, y1 - r, 90], [x0 + r, y0 + r, 180]])
    for (let i = 0; i <= n; i++) pts.push([cx + r * Math.cos(rad(a + (90 * i) / n)), cy + r * Math.sin(rad(a + (90 * i) / n))]);
  return pts;
};

/** tapered stroke, thick end at a: brows, moustache halves */
const taper = (p: Pen, a: P2, b: P2, wa: number, wb: number, col = INK) => {
  const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1, nx = -dy / l, ny = dx / l;
  p.poly([[a[0] + nx * wa / 2, a[1] + ny * wa / 2], [b[0] + nx * wb / 2, b[1] + ny * wb / 2],
    [b[0] - nx * wb / 2, b[1] - ny * wb / 2], [a[0] - nx * wa / 2, a[1] - ny * wa / 2]], col, 0);
  p.dot(a[0], a[1], wa / 2, col); p.dot(b[0], b[1], wb / 2, col);
};

// ---------------- contours ----------------
export type Blob = { a: number; b: number; nTop: number; nBot: number; egg: number; asym: number; rot: number; noise: number; seed: number };

/** superellipse "bean": separate crown / jaw exponents, egg taper (neg = narrower chin), one-side bulge, soft noise.
 *  Points run right -> down -> left -> up (clockwise on screen). */
export const blobPts = (cx: number, cy: number, B: Blob, n = 72): P2[] => {
  const ph = [rnd(B.seed, 11), rnd(B.seed, 12), rnd(B.seed, 13)].map((v) => v * Math.PI * 2);
  const pts: P2[] = [];
  for (let i = 0; i < n; i++) {
    const t = (i / n) * Math.PI * 2, c = Math.cos(t), s = Math.sin(t), e = 2 / (s < 0 ? B.nTop : B.nBot);
    let X = Math.sign(c) * Math.abs(c) ** e;
    const Y = Math.sign(s) * Math.abs(s) ** e;
    X *= (1 + B.egg * Y) * (1 + B.asym * Math.sign(X));
    const r = 1 + B.noise * (Math.cos(2 * t + ph[0]) + 0.7 * Math.cos(3 * t + ph[1]) + 0.5 * Math.cos(4 * t + ph[2]));
    const x = B.a * X * r, y = B.b * Y * r;
    pts.push([cx + x * Math.cos(B.rot) - y * Math.sin(B.rot), cy + x * Math.sin(B.rot) + y * Math.cos(B.rot)]);
  }
  return pts;
};

/** measured head: H/W 0.94, slightly pointed crown (1.75), fuller jaw (2.3), chin taper -0.12, 8 % bulge to the facing side */
export const headBlob = (seed: number, a = 118, facing = 0): Blob => ({
  a, b: a * (0.94 + 0.08 * (rnd(seed, 1) - 0.5)),
  nTop: 1.75 + 0.3 * (rnd(seed, 2) - 0.5), nBot: 2.3 + 0.3 * (rnd(seed, 3) - 0.5),
  egg: -0.12 + 0.06 * (rnd(seed, 4) - 0.5),
  asym: (0.06 + 0.04 * rnd(seed, 5)) * (facing || (rnd(seed, 6) < 0.5 ? -1 : 1)),
  rot: rad(8 * (rnd(seed, 7) - 0.5)), noise: 0.008, seed,
});

/** thickest outline direction: away from the light, pulled toward the ground (64 deg measured for upper-left light) */
export const thickAngle = (light: number) => Math.atan2(-Math.sin(light) + 0.8, -Math.cos(light));
const DEF_LIGHT = rad(-120);

// ---------------- faces ----------------
export type Expr = "neutral" | "stern" | "grin" | "laugh" | "whistle" | "nervous" | "shock" | "relief" | "relief_open" | "dazed"
  | "pained" | "smile" | "smile_closed" | "lick" | "sing" | "awe" | "innocent" | "smug" | "sad";
type EyeK = "dot" | "small" | "lid" | "slit" | "happy" | "dash" | "squeeze" | "shock" | "shockHalf" | "spiral";
type MouthK = "dash" | "frown" | "smirk" | "smile" | "smileWide" | "grin" | "laugh" | "o" | "O" | "wave" | "teeth" | "lick";
/** eyes [back, front], brows [inner, outer] offsets in u (+ = down), mouth kind */
const FACE: Record<Expr, { eye: [EyeK, EyeK]; brow: [number, number]; mouth: MouthK }> = {
  neutral: { eye: ["lid", "lid"], brow: [0, -1], mouth: "dash" },
  stern: { eye: ["lid", "lid"], brow: [3, -2], mouth: "frown" },
  grin: { eye: ["happy", "happy"], brow: [-3, -3], mouth: "grin" },
  laugh: { eye: ["squeeze", "squeeze"], brow: [-4, -4], mouth: "laugh" },
  whistle: { eye: ["dash", "dash"], brow: [-2, -4], mouth: "o" },
  nervous: { eye: ["small", "small"], brow: [-3, 2], mouth: "wave" },
  shock: { eye: ["shock", "shock"], brow: [-7, -6], mouth: "O" },
  relief: { eye: ["happy", "happy"], brow: [-2, 1], mouth: "smileWide" },
  relief_open: { eye: ["happy", "happy"], brow: [-2, 1], mouth: "grin" },
  dazed: { eye: ["spiral", "spiral"], brow: [-3, 2], mouth: "wave" },
  pained: { eye: ["squeeze", "lid"], brow: [-3, 2], mouth: "teeth" },
  smile: { eye: ["dot", "dot"], brow: [0, -1], mouth: "smirk" },
  smile_closed: { eye: ["happy", "happy"], brow: [0, -1], mouth: "smile" },
  lick: { eye: ["dot", "dot"], brow: [0, -1], mouth: "lick" },
  sing: { eye: ["happy", "happy"], brow: [-3, -4], mouth: "O" },
  awe: { eye: ["dot", "dot"], brow: [-6, -7], mouth: "o" },
  innocent: { eye: ["happy", "happy"], brow: [-5, -2], mouth: "smile" },
  smug: { eye: ["lid", "lid"], brow: [1, -3], mouth: "smirk" },
  sad: { eye: ["lid", "lid"], brow: [-5, 3], mouth: "frown" },
};
const halfLid = (k: EyeK): EyeK => (k === "dot" || k === "small" ? "lid" : k === "lid" ? "slit" : k === "shock" ? "shockHalf" : k);
const eyeKind = (k: EyeK, lid: number): EyeK =>
  lid >= 1 && k !== "happy" && k !== "squeeze" && k !== "spiral" ? "dash" : lid > 0 ? halfLid(k) : k;
const lidOf = (b: boolean | number | undefined) => (b === true ? 1 : Number(b) || 0);

const eye = (p: Pen, kind: EyeK, x: number, ey: number, u: number, side: number, look: number, skin: string) => {
  const lx = x + look * 3 * u, lw = 3.8 * u;
  switch (kind) {
    case "dot": p.ell(lx, ey, 3.8 * u, 5.5 * u, INK, 0); break;
    case "small": p.ell(lx, ey, 3 * u, 4.4 * u, INK, 0); break;
    case "lid": p.ell(lx, ey - u, 7 * u, 6 * u, INK, 0, 0, 180); p.stroke([[x - 9 * u, ey - u], [x + 9 * u, ey - u]], lw); break;
    case "slit": p.ell(lx, ey, 7 * u, 2.6 * u, INK, 0, 0, 180); p.stroke([[x - 9 * u, ey], [x + 9 * u, ey]], lw); break;
    case "happy": p.arc(x, ey + 3 * u, 8 * u, 6 * u, 200, 340, lw); break;
    case "dash": p.stroke([[x - 8.5 * u, ey], [x + 8.5 * u, ey]], lw); break;
    case "squeeze": p.stroke([[x + 6 * u * side, ey - 5 * u], [x - 6 * u * side, ey], [x + 6 * u * side, ey + 5 * u]], lw); break;
    case "shock": case "shockHalf":
      p.ell(x, ey, 11 * u, 11 * u, WHITE, 2.6 * u); p.dot(lx - side * 1.5 * u, ey + 1.5 * u, 3 * u);
      if (kind === "shockHalf") { p.ell(x, ey, 11 * u, 11 * u, skin, 0, 180, 360); p.stroke([[x - 11 * u, ey], [x + 11 * u, ey]], 2.6 * u); }
      break;
    default: {
      const s: P2[] = [];
      for (let t = 1; t < 15; t++) s.push([x + Math.cos(t * 0.9) * t * 0.55 * u, ey + Math.sin(t * 0.9) * t * 0.55 * u]);
      p.stroke(s, 2.4 * u);
    }
  }
};

/** open "D" mouth with a white teeth band (+ tongue) */
const dmouth = (p: Pen, mx: number, y: number, rx: number, ry: number, u: number, tongue = false) => {
  p.ell(mx, y, rx, ry, MOUTH, 0, 0, 180);
  p.clip([[mx - rx, y], [mx + rx, y], [mx + rx, y + 3 * u], [mx - rx, y + 3 * u]], () => p.ell(mx, y, rx, ry, WHITE, 0, 0, 180));
  if (tongue) p.ell(mx + 2 * u, y + 0.62 * ry, 0.4 * rx, 0.28 * ry, TONGUE, 0);
  p.ell(mx, y, rx, ry, null, 3 * u, 0, 180);
};

const mouth = (p: Pen, kind: MouthK, mx: number, my: number, u: number, k = 1) => {
  const mw = 4 * u;
  switch (kind) {
    case "dash": p.stroke([[mx - 5.5 * u * k, my], [mx + 5.5 * u * k, my - 0.8 * u]], mw); break;
    case "frown": p.arc(mx, my + 3 * u, 6.5 * u * k, 3.5 * u, 200, 340, mw); break;
    case "smirk": p.arc(mx + u, my - 3 * u, 7 * u * k, 4 * u, 10, 150, mw); break;
    case "smile": p.arc(mx, my - 3 * u, 8 * u * k, 4.5 * u, 20, 160, mw); break;
    case "smileWide": p.arc(mx, my - 4 * u, 11 * u * k, 6 * u, 15, 165, mw); break;
    case "grin": dmouth(p, mx, my - u, 12 * u * k, 8 * u, u); break;
    case "laugh": dmouth(p, mx, my, 16 * u * k, 11 * u, u, true); break;
    case "o": p.ell(mx + 4 * u, my, 3.5 * u, 4 * u, MOUTH, 2.8 * u); break;
    case "O": p.ell(mx, my + 2 * u, 9 * u * k, 11 * u, MOUTH, 3.2 * u); break;
    case "wave": { const s: P2[] = []; for (let i = 0; i <= 12; i++) s.push([mx - 9 * u * k + i * 1.5 * u * k, my + 1.5 * u * Math.sin(i * 1.3)]); p.stroke(s, 3 * u); break; }
    case "teeth":
      p.poly([[mx - 12 * u * k, my - 4 * u], [mx + 12 * u * k, my - 4 * u], [mx + 11 * u * k, my + 4 * u], [mx - 11 * u * k, my + 4 * u]], WHITE, 3 * u);
      for (const j of [-1, 0, 1]) p.stroke([[mx + j * 6 * u * k, my - 4 * u], [mx + j * 6 * u * k, my + 4 * u]], 1.5 * u);
      break;
    case "lick": p.arc(mx, my - 3 * u, 8 * u * k, 4.5 * u, 20, 160, mw); p.ell(mx + 6 * u * k, my + 3 * u, 3.6 * u, 4.6 * u, TONGUE, 2.4 * u); break;
  }
};

/** face v2 (front / 3-4). u = 1 % of the head path width W. Eyes 26u apart on the centre line, brows 20u up, mouth 20u
 *  down, everything slid toward the facing side. No blush, no catchlights. */
const faceFront = (p: Pen, cx: number, cy: number, W: number, expr: Expr, facing: number, look: number, lid: number, brim: boolean,
  skin: string, moustache?: string, stout = false) => {
  const u = W / 100, F = FACE[expr], fx = cx + 7 * u * facing;
  const ex = (F.eye[0] === "shock" ? 12 : 13) * u, ey = cy;
  for (const side of [-1, 1]) {
    const x = fx + side * ex;
    const kind = eyeKind(F.eye[(facing ? side === facing : side > 0) ? 1 : 0], lid);
    eye(p, kind, x, ey, u, side, look, skin);
    const [dI, dO] = F.brow, by = ey - (brim ? 17 : 20) * u;
    if (kind === "shock" || kind === "shockHalf") p.arc(x, by - 6 * u, 9 * u, 3 * u, 200, 340, 4 * u);
    else taper(p, [x - side * 8.5 * u, by + dI * u], [x + side * 8.5 * u, by + dO * u], 5 * u, 2.5 * u);
  }
  const mx = cx + 8 * u * facing, my = cy + 20 * u;
  mouth(p, F.mouth, mx, my, u);
  if (moustache) for (const s of [-1, 1])
    taper(p, [mx + s * 1.5 * u, cy + 12.5 * u], [mx + s * (stout ? 19 : 15) * u, cy + (stout ? 10.5 : 15) * u], stout ? 5.5 * u : 4.5 * u, 1.6 * u, moustache);
  if (expr === "nervous") p.ell(cx + 40 * u * (facing || 1), cy - 22 * u, 3 * u, 5 * u, "#9fd4ff", 2 * u);
};

/** profile face (facing screen-right): one eye, brow, nose tick, mouth near the front edge; no skin bump nose, no ear */
const faceSide = (p: Pen, hx: number, hy: number, W: number, expr: Expr, lid: number, brim: boolean, skin: string, moustache?: string, stout = false) => {
  const u = W / 100, F = FACE[expr], ex = hx + 27 * u, ey = hy;
  const kind = eyeKind(F.eye[1], lid);
  eye(p, kind, ex, ey, u, 1, 0.6, skin);
  const by = ey - (brim ? 17 : 20) * u, [dI, dO] = F.brow;
  if (kind === "shock" || kind === "shockHalf") p.arc(ex, by - 6 * u, 9 * u, 3 * u, 200, 340, 4 * u);
  else taper(p, [ex + 8 * u, by + dI * u], [ex - 7 * u, by - u + dO * u], 5 * u, 2.5 * u);
  p.stroke([[hx + 44 * u, hy + 4 * u], [hx + 47.5 * u, hy + 9 * u], [hx + 43 * u, hy + 10 * u]], 3 * u);
  mouth(p, F.mouth, hx + 33 * u, hy + 21 * u, u, 0.62);
  if (moustache) taper(p, [hx + 41 * u, hy + 13.5 * u], [hx + 25 * u, hy + (stout ? 11.5 : 16) * u], stout ? 5.5 * u : 4.5 * u, 1.6 * u, moustache);
  if (expr === "nervous") p.ell(hx - 30 * u, hy - 24 * u, 3 * u, 5 * u, "#9fd4ff", 2 * u);
};

// ---------------- hats ----------------
const star5 = (p: Pen, x: number, y: number, r: number, col: string, lw: number) => {
  const pts: P2[] = []; for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5, rr = i % 2 ? 0.45 * r : r; pts.push([x + rr * Math.cos(a), y + rr * Math.sin(a)]); }
  p.poly(pts, col, lw);
};
const BONNET = "#e9cf8f", BONNET_BRIM = "#d6b46a";
/** parts of a hat that sit behind the head (bonnet) */
const hatBehind = (p: Pen, o: Outfit, H: Blob, cx: number, hc: number, light: number, thick: number, ow: number, side: boolean) => {
  if (o.hat === "jcap" && !side) { // IJA field cap: cloth neck flaps hanging behind the ears
    const W = 2 * H.a, HH = 2 * H.b, u = W / 100, col = o.hatCol ?? "#8a7d4e";
    for (const s2 of [-1, 1]) {
      const x0 = cx + s2 * 0.4 * W, x1 = cx + s2 * 0.53 * W, y0 = hc - 0.12 * HH, y1 = hc + 0.3 * HH;
      const fl: P2[] = [[x0, y0], [x1, y0], [x1 + s2 * 4 * u, y1], [x0 + s2 * 0.02 * W, y1 - 2 * u]];
      p.shadedFill(fl, col, mul(col, SH_CLOTH), light, 0.2 * W, 0.4); p.inkRing(fl, ow * 0.8, thick);
    }
    return;
  }
  if (o.hat !== "bonnet") return;
  const bb = blobPts(cx - (side ? 12 : 0) * (H.a / 50), hc - 0.07 * 2 * H.b, { ...H, a: H.a * 1.17, b: H.b * 1.13, asym: 0, egg: 0.04, seed: H.seed + 3 });
  p.shadedFill(bb, BONNET, mul(BONNET, SH_CLOTH), light, H.a * 1.17);
  p.inkRing(bb, ow * 0.85, thick);
};

const hatOn = (p: Pen, o: Outfit, hp: P2[], H: Blob, cx: number, hc: number, light: number, seed: number, facing: number, side: boolean) => {
  const W = 2 * H.a, HH = 2 * H.b, u = W / 100, crown = hc - H.b, ow = 0.85 * 5 * u;
  const a = H.rot + rad(4 * (rnd(seed, 20) - 0.5)); // tilt with the head, +-2 deg extra
  const R = (pts: P2[]) => rotPts(pts, a, cx, hc);
  const sag = (yb: number, wb: number): P2[] => {
    const base: P2[] = [];
    for (let i = 0; i <= 12; i++) { const t = i / 12; base.push([cx + wb * (2 * t - 1), yb + 3 * u * (1 - (2 * t - 1) ** 2)]); }
    return base;
  };
  if (o.hat === "shako" || o.hat === "shako_tall") {
    const tall = o.hat === "shako_tall", yb = crown + 0.25 * HH, ht = (tall ? 0.66 : 0.56) * HH, wb = 46 * u, wt = 52 * u;
    const body = R([...sag(yb, wb).reverse(), [cx - wt, yb - ht], [cx + wt, yb - ht]]);
    p.shadedFill(body, "#3a3d47", "#24262d", light, wt, 0.4);
    if (tall) p.clip(body, () => p.band(R([[cx - wt - 5 * u, yb - ht + 0.07 * HH], [cx + wt + 5 * u, yb - ht + 0.07 * HH]]), "#e8c45a", 0.06 * HH, 1.5 * u));
    p.poly(body, null, ow);
    const deg = (a * 180) / Math.PI;
    if (side) {
      p.poly(R([[cx + 36 * u, yb - 1 * u], [cx + 60 * u, yb + 8 * u], [cx + 34 * u, yb + 6 * u]]), "#16171b", 2.5 * u);
      const [tx, ty] = R([[cx + 24 * u, yb - ht - 6 * u]])[0];
      p.ell(tx, ty, 7 * u, 7 * u, "#2b7a4b", 2.5 * u);
    } else {
      const [px, py] = R([[cx + 3 * u * facing, yb + 3 * u]])[0];
      p.ell(px, py, 34 * u, 0.045 * HH, "#16171b", 2.5 * u, 0, 180, deg); // peak
      const [bx, by] = R([[cx, yb - 0.45 * ht]])[0];
      p.ell(bx, by, 7 * u, 6 * u, tall ? "#e8c45a" : "#c9ccd2", 2 * u, 0, 360, deg); // badge plate
      p.arc(bx, by, 3.5 * u, 2.8 * u, 200, 500, 1.6 * u);
      const [tx, ty] = R([[cx, yb - ht - 6 * u]])[0];
      p.ell(tx, ty, 7 * u, 7 * u, "#2b7a4b", 2.5 * u); // green tuft
    }
  } else if (o.hat === "cap" || o.hat === "hair" || o.hat === "jcap") {
    const jc = o.hat === "jcap", cut = crown + (o.hat === "cap" ? 0.3 : jc ? 0.33 : 0.42) * HH;
    const keep = (x: number, y: number) => y < cut || (side && o.hat === "hair" && x < cx - 6 * u && y < hc + 0.42 * H.b);
    // start the arc at the first kept point after a dropped one, so the kept run is contiguous and the cut closes it
    const n = hp.length, startIdx = Math.max(0, hp.findIndex(([x, y], i) => keep(x, y) && !keep(hp[(i + n - 1) % n][0], hp[(i + n - 1) % n][1])));
    const arc = [...hp.slice(startIdx), ...hp.slice(0, startIdx)].filter(([x, y]) => keep(x, y))
      .map(([x, y]) => [cx + (x - cx) * 1.03, hc + (y - hc) * 1.03] as P2);
    if (arc.length < 3) return;
    if (o.hat === "hair") { // scalloped lower edge
      const [x0, y0] = arc[arc.length - 1], [x1, y1] = arc[0];
      for (let i = 1; i < 6; i++) arc.push([x0 + ((x1 - x0) * i) / 6, y0 + ((y1 - y0) * i) / 6 + (i % 2 ? 4 * u : 0)]);
    }
    const col = o.hat === "cap" ? o.cap! : jc ? (o.hatCol ?? "#8a7d4e") : o.hair!;
    if (jc) { const top = Math.min(...arc.map((q) => q[1])); for (const q of arc) if (q[1] < top + 0.12 * HH) q[1] -= 0.06 * HH * Math.max(0, 1 - Math.abs(q[0] - cx) / (0.55 * W)); }
    p.shadedFill(arc, col, mul(col, SH_FELT), light, H.a, 0.35);
    p.poly(arc, null, ow);
    if (o.hat === "hair") {
      const s = side ? -1 : facing || 1;
      p.stroke([[cx + s * 10 * u, cut - 30 * u], [cx + s * 2 * u, cut - 12 * u]], 1.2 * u);
    }
    if (o.hat === "cap" || jc) {
      const deg = (a * 180) / Math.PI;
      if (jc && !side) { const [sx, sy] = R([[cx + 4 * u * (facing || 0), cut - 0.12 * HH]])[0]; star5(p, sx, sy, 7.5 * u, "#e8c45a", 1.6 * u); }
      if (jc && side) { const [sx, sy] = R([[cx + 22 * u, cut - 0.12 * HH]])[0]; star5(p, sx, sy, 6.5 * u, "#e8c45a", 1.4 * u); }
      if (side) p.poly(R([[cx + 40 * u, cut - 2 * u], [cx + 74 * u, cut + 4 * u], [cx + 40 * u, cut + 6 * u]]), shade(col, 0.8), ow);
      else {
        const s = facing || (rnd(seed, 21) < 0.5 ? -1 : 1), [px, py] = R([[cx + s * 4 * u, cut + 1.5 * u]])[0];
        p.ell(px, py, 32 * u, 0.06 * HH, shade(col, 0.8), ow, 0, 180, deg);
      }
    }
  } else if (o.hat === "tophat") {
    const yb = crown + 0.22 * HH, ht = 0.8 * HH, wb = 0.31 * W, wt = 0.33 * W, col = "#2e2a36";
    const body = R([...sag(yb, wb).reverse(), [cx - wt, yb - ht], [cx + wt, yb - ht]]);
    p.shadedFill(body, col, mul(col, SH_FELT), light, wt, 0.4);
    p.clip(body, () => p.band(R([[cx - wt - 4 * u, yb - 0.13 * HH], [cx + wt + 4 * u, yb - 0.13 * HH]]), shade(o.jacket, 0.9), 0.14 * HH, 0.8 * u));
    p.poly(body, null, ow);
    const [bx, by] = R([[cx, yb + 1 * u]])[0];
    p.ell(bx, by, 0.45 * W, 0.05 * HH, "#1d1b22", ow, 0, 360, (a * 180) / Math.PI);
  } else if (o.hat === "turban") {
    // wrapped cloth dome a little wider than the skull, three wrap folds, a knot at the side
    const col = o.hatCol ?? "#f1ead8", tr = o.trim;
    const dome = R(ellPts(cx + (side ? -4 * u : 0), crown + 0.1 * HH, 0.56 * W, 0.27 * HH, 180, 360).concat(
      ellPts(cx + (side ? -4 * u : 0), crown + 0.1 * HH, 0.56 * W, 0.08 * HH, 0, 180).map(([x, y]) => [x, y + 0.14 * HH] as P2)));
    p.shadedFill(dome, col, mul(col, SH_CLOTH), light, 0.56 * W, 0.4);
    for (let k = 0; k < 3; k++) {
      const y = crown + (0.02 + 0.09 * k) * HH, rx = 0.5 * W - k * 2 * u;
      p.clip(dome, () => p.stroke(R(curve([cx - rx, y + 0.05 * HH], [cx + (k - 1) * 6 * u, y - 0.04 * HH], [cx + rx, y + 0.09 * HH])), 2.2 * u, mul(col, SH_CLOTH)));
    }
    if (tr) p.clip(dome, () => p.band(R([[cx - 0.6 * W, crown + 0.21 * HH], [cx + 0.6 * W, crown + 0.21 * HH]]), tr, 0.045 * HH, 0.8 * u));
    p.poly(dome, null, ow);
    const [kx, ky] = R([[cx + (side ? -0.48 : 0.36) * W, crown + 0.05 * HH]])[0];
    if (side) p.ell(kx, ky, 7 * u, 6 * u, col, ow * 0.6);
  } else if (o.hat === "slouch") {
    // Australian slouch hat: wide brim, rounded crown with a band, left brim pinned up
    const col = o.hatCol ?? "#8a7650", yb = crown + 0.26 * HH, ht = 0.36 * HH;
    const brim = R(ellPts(cx, yb, 0.78 * W, 0.075 * HH));
    const crownP = R([...curve([cx - 0.4 * W, yb], [cx, yb - ht * 1.5], [cx + 0.4 * W, yb])]);
    p.shadedFill(crownP, col, mul(col, SH_FELT), light, 0.4 * W, 0.4); p.poly(crownP, null, ow);
    p.clip(crownP, () => p.band(R([[cx - 0.5 * W, yb - 0.06 * HH], [cx + 0.5 * W, yb - 0.06 * HH]]), o.trim ?? "#4a3a26", 0.07 * HH, 0.8 * u));
    p.poly(brim, mul(col, [0.92, 0.92, 0.92]), ow);
    if (!side) p.poly(R([[cx - 0.78 * W, yb], [cx - 0.42 * W, yb - 0.02 * HH], [cx - 0.52 * W, yb - 0.3 * HH]]), col, ow * 0.9);
  } else if (o.hat === "tricorne") {
    const col = "#22202a", yb = crown + 0.24 * HH, ht = 0.34 * HH;
    // three-cornered: two upturned side corners, a front point dipping over the brow, a low crown behind the brim
    const crownP = R([...curve([cx - 0.36 * W, yb - 0.1 * HH], [cx, yb - ht * 1.35], [cx + 0.36 * W, yb - 0.1 * HH])]);
    p.shadedFill(crownP, "#2e2b36", "#16141b", light, 0.4 * W, 0.4); p.poly(crownP, null, ow);
    const body = side
      ? R([[cx - 0.62 * W, yb - 0.16 * HH], ...curve([cx - 0.62 * W, yb - 0.16 * HH], [cx, yb + 0.04 * HH], [cx + 0.66 * W, yb + 0.02 * HH]), [cx + 0.5 * W, yb - 0.14 * HH], ...curve([cx + 0.5 * W, yb - 0.14 * HH], [cx, yb - 0.12 * HH], [cx - 0.5 * W, yb - 0.24 * HH])])
      : R([[cx - 0.74 * W, yb - 0.22 * HH], ...curve([cx - 0.74 * W, yb - 0.22 * HH], [cx - 0.3 * W, yb + 0.02 * HH], [cx, yb + 0.07 * HH]), ...curve([cx, yb + 0.07 * HH], [cx + 0.3 * W, yb + 0.02 * HH], [cx + 0.74 * W, yb - 0.22 * HH]),
        ...curve([cx + 0.74 * W, yb - 0.22 * HH], [cx + 0.3 * W, yb - 0.1 * HH], [cx, yb - 0.12 * HH]), ...curve([cx, yb - 0.12 * HH], [cx - 0.3 * W, yb - 0.1 * HH], [cx - 0.74 * W, yb - 0.22 * HH])]);
    p.shadedFill(body, col, "#141218", light, 0.6 * W, 0.4);
    if (o.trim) p.clip(body, () => { p.path(body, true); p.g.strokeStyle = o.trim!; p.g.lineWidth = 7 * u; p.g.stroke(); });
    p.poly(body, null, ow);
    if (!side) { const [rx, ry] = R([[cx - 0.46 * W, yb - 0.14 * HH]])[0]; p.ell(rx, ry, 4.5 * u, 4.5 * u, o.trim ?? "#c4312e", 1.4 * u); }
  } else if (o.hat === "nonla") {
    // Vietnamese conical palm-leaf hat: wide shallow cone, rim shadow line, leaf ribs
    const col = o.hatCol ?? "#e6cf8e", yb = crown + 0.3 * HH, ht = 0.62 * HH, wb = 0.98 * W;
    const cone = R([[cx - wb, yb], [cx, yb - ht], [cx + wb, yb], ...curve([cx + wb, yb], [cx, yb + 0.1 * HH], [cx - wb, yb])]);
    p.shadedFill(cone, col, mul(col, SH_FELT), light, wb, 0.35);
    for (let k = 1; k < 4; k++) p.clip(cone, () => p.stroke(R(curve([cx - wb * (k / 4), yb - ht * (1 - k / 4)], [cx, yb - ht * (1 - k / 4) + 0.03 * HH * k], [cx + wb * (k / 4), yb - ht * (1 - k / 4)])), 1.4 * u, mul(col, [0.82, 0.78, 0.7])));
    p.poly(cone, null, ow);
  } else if (o.hat === "pith") {
    // colonial pith helmet: white dome, band, sloping brim
    const col = o.hatCol ?? "#f1ead8", yb = crown + 0.28 * HH;
    const brim = R(ellPts(cx, yb, 0.72 * W, 0.09 * HH));
    p.poly(brim, mul(col, [0.9, 0.9, 0.88]), ow);
    const dome = R([...ellPts(cx, yb - 0.02 * HH, 0.5 * W, 0.42 * HH, 180, 360)]);
    p.shadedFill(dome, col, mul(col, SH_FELT), light, 0.5 * W, 0.4);
    p.clip(dome, () => p.band(R([[cx - 0.6 * W, yb - 0.07 * HH], [cx + 0.6 * W, yb - 0.07 * HH]]), o.trim ?? "#6b5a40", 0.06 * HH, 0.8 * u));
    p.poly(dome, null, ow);
    const [tx, ty] = R([[cx, yb - 0.44 * HH]])[0]; p.ell(tx, ty, 5 * u, 4 * u, col, 1.6 * u);
  } else if (o.hat === "fedora") {
    // 1960s fedora: pinched crown, dark band, brim snapped down a little at the front
    const col = o.hatCol ?? "#3a3a42", yb = crown + 0.27 * HH, ht = 0.36 * HH;
    const crownP = R([[cx - 0.44 * W, yb], ...curve([cx - 0.44 * W, yb], [cx - 0.42 * W, yb - ht * 1.1], [cx - 0.1 * W, yb - ht]), ...curve([cx - 0.1 * W, yb - ht], [cx, yb - ht * 0.82], [cx + 0.1 * W, yb - ht]), ...curve([cx + 0.1 * W, yb - ht], [cx + 0.42 * W, yb - ht * 1.1], [cx + 0.44 * W, yb])]);
    p.shadedFill(crownP, col, mul(col, SH_FELT), light, 0.44 * W, 0.4);
    p.clip(crownP, () => p.band(R([[cx - 0.5 * W, yb - 0.07 * HH], [cx + 0.5 * W, yb - 0.07 * HH]]), o.trim ?? "#1c1c22", 0.08 * HH, 0.8 * u));
    p.poly(crownP, null, ow);
    const brim = R([...curve([cx - 0.74 * W, yb - 0.02 * HH], [cx, yb - 0.1 * HH], [cx + 0.74 * W, yb - 0.02 * HH]), ...curve([cx + 0.74 * W, yb - 0.02 * HH], [cx, yb + 0.12 * HH], [cx - 0.74 * W, yb - 0.02 * HH])]);
    p.poly(brim, mul(col, [0.82, 0.82, 0.86]), ow);
  } else if (o.hat === "ushanka") {
    // fur hat with ear flaps
    const col = o.hatCol ?? "#5a4636", fur = mul(col, [1.25, 1.2, 1.15]), yb = crown + 0.3 * HH;
    for (const s2 of [-1, 1]) { const fl = R(rrect(cx + s2 * 0.5 * W - 0.13 * W, yb - 0.05 * HH, cx + s2 * 0.5 * W + 0.13 * W, yb + 0.32 * HH, 10 * u)); p.shadedFill(fl, fur, mul(fur, SH_FELT), light, 0.15 * W, 0.4); p.poly(fl, null, ow); }
    const dome = R(ellPts(cx, yb - 0.02 * HH, 0.52 * W, 0.4 * HH, 180, 360));
    p.shadedFill(dome, col, mul(col, SH_FELT), light, 0.52 * W, 0.4); p.poly(dome, null, ow);
    const band = R(rrect(cx - 0.6 * W, yb - 0.14 * HH, cx + 0.6 * W, yb + 0.04 * HH, 12 * u));
    p.shadedFill(band, fur, mul(fur, SH_FELT), light, 0.6 * W, 0.4); p.poly(band, null, ow);
    const [sx, sy] = R([[cx, yb - 0.05 * HH]])[0]; p.ell(sx, sy, 6 * u, 6 * u, "#c0353a", 1.4 * u);
  } else if (o.hat === "brodie") {
    // WWI 'soup bowl' helmet: shallow dome on a wide flat brim, olive drab
    const col = o.hatCol ?? "#66703f", yb = crown + 0.3 * HH;
    const dome = R(ellPts(cx, yb, 0.5 * W, 0.4 * HH, 180, 360));
    p.shadedFill(dome, col, mul(col, SH_FELT), light, 0.5 * W, 0.4); p.poly(dome, null, ow);
    const brim = R(ellPts(cx, yb, 0.8 * W, 0.075 * HH));
    p.poly(brim, mul(col, [0.86, 0.86, 0.84]), ow);
  } else if (o.hat === "beret") {
    // WWII beret: soft disc pulled to one side, cap badge over the brow
    const col = o.hatCol ?? "#6b6a42", yb = crown + 0.22 * HH;
    const disc = R([...curve([cx - 0.5 * W, yb + 0.02 * HH], [cx - 0.62 * W, yb - 0.34 * HH], [cx + 0.1 * W, yb - 0.3 * HH]), ...curve([cx + 0.1 * W, yb - 0.3 * HH], [cx + 0.66 * W, yb - 0.26 * HH], [cx + 0.52 * W, yb - 0.02 * HH]), ...curve([cx + 0.52 * W, yb - 0.02 * HH], [cx, yb + 0.06 * HH], [cx - 0.5 * W, yb + 0.02 * HH])]);
    p.shadedFill(disc, col, mul(col, SH_FELT), light, 0.6 * W, 0.4); p.poly(disc, null, ow);
    p.band(R([[cx - 0.5 * W, yb], [cx + 0.52 * W, yb - 0.02 * HH]]), mul(col, [0.8, 0.8, 0.78]), 0.05 * HH, 0.6 * u);
    const [bx, by] = R([[cx + 0.18 * W * (facing || 1), yb - 0.1 * HH]])[0]; p.ell(bx, by, 6 * u, 7 * u, "#d9dde0", 1.6 * u);
  } else if (o.hat === "pickel") {
    // German Pickelhaube: black leather dome, brass eagle plate, spike
    const col = "#24232b", yb = crown + 0.27 * HH;
    const [sx, sy] = R([[cx, yb - 0.5 * HH]])[0], [tx, ty] = R([[cx, yb - 0.86 * HH]])[0];
    p.poly(R([[cx - 6 * u, yb - 0.46 * HH], [cx, yb - 0.88 * HH], [cx + 6 * u, yb - 0.46 * HH]]), "#e0b84a", 2.4 * u);
    p.ell(sx, sy, 9 * u, 4 * u, "#e0b84a", 2 * u); void tx; void ty;
    const dome = R(ellPts(cx, yb, 0.52 * W, 0.46 * HH, 180, 360));
    p.shadedFill(dome, col, "#111015", light, 0.52 * W, 0.4); p.poly(dome, null, ow);
    const [px, py] = R([[cx + 4 * u * facing, yb - 0.17 * HH]])[0];
    p.ell(px, py, 13 * u, 15 * u, "#e0b84a", 2.4 * u);
    const brim = R([...curve([cx - 0.56 * W, yb], [cx, yb + 0.1 * HH], [cx + 0.56 * W, yb]), ...curve([cx + 0.56 * W, yb], [cx, yb + 0.03 * HH], [cx - 0.56 * W, yb])]);
    p.poly(brim, "#15141a", ow);
  } else if (o.hat === "peaked") {
    // officer's peaked service cap: wide flat crown, dark band, black visor
    const col = o.hatCol ?? "#6f6b45", yb = crown + 0.24 * HH, deg = (a * 180) / Math.PI;
    const body = R([[cx - 0.46 * W, yb], [cx - 0.62 * W, yb - 0.3 * HH], [cx + 0.62 * W, yb - 0.3 * HH], [cx + 0.46 * W, yb]]);
    p.shadedFill(body, col, mul(col, SH_FELT), light, 0.6 * W, 0.4); p.poly(body, null, ow);
    const top = R(ellPts(cx, yb - 0.3 * HH, 0.62 * W, 0.07 * HH)); p.poly(top, mul(col, [1.08, 1.08, 1.06]), ow);
    p.clip(body, () => p.band(R([[cx - 0.7 * W, yb - 0.06 * HH], [cx + 0.7 * W, yb - 0.06 * HH]]), "#3a3826", 0.1 * HH, 0.8 * u));
    const [bx, by] = R([[cx, yb - 0.16 * HH]])[0]; p.ell(bx, by, 7 * u, 6 * u, "#e8c45a", 2 * u, 0, 360, deg);
    const [vx, vy] = R([[cx + 3 * u * facing, yb + 2 * u]])[0]; p.ell(vx, vy, 40 * u, 0.06 * HH, "#16171b", 2.5 * u, 0, 180, deg);
  } else if (o.hat === "bonnet") {
    const [bx, by] = R([[cx + (side ? 6 * u : 0), crown + 0.16 * HH]])[0];
    p.arc(bx, by, 0.5 * W, 0.2 * HH, 200, 340, 7 * u, BONNET_BRIM);
    p.arc(bx, by, 0.5 * W + 3.5 * u, 0.2 * HH + 3.5 * u, 200, 340, 1.2 * u);
    const cy = hc + H.b * 0.98;
    p.stroke([[cx - 14 * u, cy - 4 * u], [cx, cy + 2 * u], [cx + 14 * u, cy - 4 * u]], 2 * u, BONNET_BRIM);
  }
};

// ---------------- bodies ----------------
export type Arms = [P2[], P2[]];
/** held prop; for the hammer the number is the strike 0 (raised) .. 1 (struck) */
export type Prop = null | "icecream" | "shako" | ["hammer", number] | ["rocket", number] | ["torch", number] | "heart" | "quill" | "hose" | "rope" | "crate" | "shrug" | "point" | "rat" | "tail" | "coin" | "scissors" | "stamp" | "axe" | "axeUp" | "dropper" | "magazine" | "salute" | "banana" | "leaflet" | "photo" | "book" | "rifleH" | "rice";
const TWO_HANDS = new Set(["quill", "hose", "rope", "crate", "shrug", "rifleH", "rice"]);
const SMALL = new Set(["rat", "tail", "coin", "scissors", "stamp", "axe", "dropper", "axeUp", "magazine", "banana", "leaflet", "photo", "book"]);
const pname = (pr: Prop) => (Array.isArray(pr) ? pr[0] : pr);

const BUILD: Record<Build, { a: number; torso: number; legs: number; tw: number }> = {
  adult: { a: 118, torso: 1.1, legs: 1.4, tw: 0.8 },
  stout: { a: 118, torso: 1.15, legs: 1.32, tw: 0.92 },
  kid: { a: 112, torso: 0.85, legs: 1.0, tw: 0.72 },
};

export type FrontOpts = {
  phase?: number; expr?: Expr; mode?: "march" | "stroll" | "stand" | "sit" | "fall"; look?: number; blink?: boolean | number; lift?: number;
  prop?: Prop; tilt?: number; headTilt?: number; wave?: number;
  /** canvas angle the key light comes FROM (painted crescent + thick outline side) */
  light?: number; facing?: -1 | 0 | 1; seed?: number;
};

const footStroke = (p: Pen, a: P2, b: P2, w: number, col: string) => {
  if (col !== INK) p.stroke([a, b], w + 3, INK);
  p.stroke([a, b], w, col);
};

export const bodyFront = (p: Pen, o: Outfit, opts: FrontOpts) => {
  const { phase = 0, expr = "neutral", mode = "march", look = 0, blink = false, lift = 60, prop = null, tilt = 0, headTilt = 0, wave,
    light = DEF_LIGHT, facing = 0, seed = 1 } = opts;
  const Bd = BUILD[o.build ?? "adult"], skin = o.skin ?? SKIN, two = Math.PI * 2, lid = lidOf(blink);
  const H = headBlob(seed, Bd.a, facing), W = 2 * H.a, HH = 2 * H.b, u = W / 100;
  const tall = (1 + Bd.torso + Bd.legs) * HH, sole = 975;
  // body bob 5 % (march) / 3 % (stroll) of the height, lowest at contact (phase 0 and 0.5)
  const bob = mode === "march" ? 0.025 * tall * Math.cos(2 * two * phase) : mode === "stroll" ? 0.015 * tall * Math.cos(2 * two * phase) : 0;
  const torsoBot = mode === "sit" ? sole - 0.2 * HH : sole - Bd.legs * HH + bob;
  const chin = torsoBot - Bd.torso * HH, hc = chin - H.b, crown = hc - H.b, hipY = torsoBot - 0.12 * HH;
  const thick = thickAngle(light), ow = 5 * u;
  const legCol = mix(o.pants, INK, 0.55), armCol = mix(o.jacket, INK, 0.5), footCol = o.boots;
  const legW = 5.8 * u, footW = 7.5 * u;
  // ---- legs + feet (not rotated) ----
  p.rot = null;
  if (mode === "sit") {
    for (const side of [-1, 1]) {
      const h: P2 = [300 + side * 15 * u, hipY], k: P2 = [300 + side * 36 * u, hipY + 0.2 * HH], f: P2 = [300 + side * 44 * u, sole - 8 * u];
      p.stroke(curve(h, k, f), legW, legCol);
      footStroke(p, [f[0] - side * 2 * u, f[1]], [f[0] + side * 12 * u, f[1] - 5 * u], footW, footCol);
    }
  } else if (mode === "fall") {
    const legs: [P2, P2, P2][] = [
      [[300 - 15 * u, hipY], [300 - 46 * u, hipY + 0.5 * HH], [300 - 70 * u, hipY + 0.72 * HH]],
      [[300 + 15 * u, hipY], [300 + 50 * u, hipY + 0.45 * HH], [300 + 76 * u, hipY + 0.22 * HH]],
    ];
    legs.forEach(([h, k, f], i) => {
      p.stroke(curve(h, k, f), legW, legCol);
      footStroke(p, f, [f[0] + (i ? 14 : -14) * u, f[1] + (i ? -6 : 4) * u], footW, footCol);
    });
  } else if (o.dress) {
    for (const side of [-1, 1]) {
      const fx = 300 + side * 12 * u, fy = sole - 4 * u;
      p.stroke([[fx, sole - 0.4 * HH], [fx + side * u, fy]], legW, legCol);
      footStroke(p, [fx - side * 3 * u, fy], [fx + side * 12 * u, fy + u], footW, footCol);
    }
  } else {
    const L = mode === "march" ? lift * 1.25 : mode === "stroll" ? lift * 0.55 : 0;
    for (const [side, ph] of [[-1, 0], [1, 0.5]] as const) {
      const up = Math.max(0, Math.sin(two * (phase + ph))) * L;
      const hx = 300 + side * 15 * u, fx = 300 + side * 22 * u, fy = sole - 4 * u - up;
      const k: P2 = [(hx + fx) / 2 + side * (1.5 * u + up * 0.16), (hipY + fy) / 2 - up * 0.08];
      p.stroke(curve([hx, hipY], k, [fx, fy]), legW, legCol);
      footStroke(p, [fx - side * 3 * u, fy], [fx + side * 13 * u, fy + 0.5 * u], footW, footCol);
    }
  }
  // ---- upper body: rotates about the hips (tilt + a small weight-shift sway on every step) ----
  const sway = mode === "march" ? 1.6 * Math.sin(two * phase) : mode === "stroll" ? 1.0 * Math.sin(two * phase) : 0;
  const A = tilt + sway;
  p.rot = A ? [rad(A), 300, hipY] : null;
  const dress = !!o.dress && mode !== "sit" && mode !== "fall";
  const T: Blob = { a: ((Bd.tw / 2) * W) / 1.06, b: 0.5 * (torsoBot - (chin - 0.25 * HH)), nTop: 2.2, nBot: 2.6, egg: o.build === "stout" ? 0.17 : 0.12,
    asym: 0.04 * facing, rot: 0, noise: 0.006, seed: seed + 7 };
  const tcx = 300 + 3 * u * facing, tcy = torsoBot - T.b, tp = blobPts(tcx, tcy, T);
  const sh = (side: number): P2 => [tcx + side * 0.85 * T.a, chin + 0.12 * HH];
  const hang = (side: number, fwd: number): [P2, P2, P2] => {
    const S = sh(side), ex = tcx + side * (1.12 * T.a + 4 * u);
    const hx = ex + side * 3 * u - side * 6 * u * Math.max(0, fwd) + side * 4 * u * Math.max(0, -fwd);
    return [S, [ex, S[1] + 0.48 * HH], [hx, chin + 1.04 * HH - Math.abs(fwd) * 9 * u]];
  };
  const sw = mode === "march" || mode === "stroll" ? Math.sin(two * phase) : 0;
  // rifle at the order: butt by the right hip, held by the hanging right hand, muzzle past the crown
  const R0: P2 = [300 + 47 * u, torsoBot + 0.12 * HH], R1: P2 = [300 + 64 * u, crown - 0.32 * HH];
  const rifle = !!o.rifle && (mode === "march" || mode === "stand" || mode === "stroll");
  type Arm = { pts: [P2, P2, P2]; front: boolean };
  const arms: Arm[] = [];
  if (mode === "sit") for (const side of [-1, 1]) arms.push({ pts: [sh(side), [tcx + side * (1.1 * T.a + 6 * u), sh(side)[1] + 0.4 * HH], [tcx + side * (1.2 * T.a + 10 * u), torsoBot + 0.04 * HH]], front: false });
  else if (mode === "fall") for (const side of [-1, 1]) arms.push({ pts: [sh(side), [tcx + side * (1.15 * T.a + 12 * u), sh(side)[1] - 0.25 * HH], [tcx + side * (1.3 * T.a + 24 * u), sh(side)[1] - 0.68 * HH]], front: false });
  else {
    arms.push({ pts: prop === "shako" ? hang(-1, 0) : hang(-1, -sw), front: false });
    if (rifle) {
      const G = lerp2(R0, R1, 0.1);
      arms.push({ pts: [sh(1), [tcx + 1.12 * T.a + 5 * u, sh(1)[1] + 0.45 * HH], G], front: false });
    } else if (wave !== undefined) {
      const S = sh(1);
      arms.push({ pts: [S, [tcx + 1.1 * T.a + 10 * u + 3 * u * wave, S[1] - 0.22 * HH], [tcx + 1.18 * T.a + 16 * u + 12 * u * wave, S[1] - 0.6 * HH]], front: false });
    } else if (prop === "icecream") {
      const S = sh(1);
      arms.push({ pts: [S, [tcx + 1.05 * T.a + 4 * u, S[1] + 0.45 * HH], [tcx + 0.5 * T.a, S[1] + 0.4 * HH]], front: true });
    } else if (pname(prop) === "rocket") {
      arms.push({ pts: hang(1, 0), front: true });
    } else if (pname(prop) === "torch") {
      const S = sh(1), k = clamp((prop as [string, number])[1], 0, 1); // 0 raised .. 1 reaching down to the fuse
      arms.push({ pts: [S, [tcx + 1.15 * T.a + 10 * u, S[1] + (0.06 + 0.2 * k) * HH], [tcx + 1.25 * T.a + 28 * u, S[1] + (-0.28 + 0.62 * k) * HH]], front: true });
    } else if (prop === "heart") {
      const S = sh(1);
      arms.push({ pts: [S, [tcx + 0.95 * T.a, S[1] + 0.4 * HH], [tcx - 0.22 * T.a, S[1] + 0.16 * HH]], front: true });
    } else if (typeof prop === "string" && SMALL.has(prop)) {
      const S = sh(1), hi = prop === "coin" ? 0.12 : prop === "stamp" ? 0.0 : prop === "banana" ? -0.1 : prop === "leaflet" || prop === "photo" || prop === "book" ? -0.05 : -0.32;
      arms.push({ pts: [S, [tcx + 1.15 * T.a + 12 * u, S[1] + (0.14 + hi * 0.4) * HH], [tcx + 1.28 * T.a + 26 * u, S[1] + hi * HH]], front: true });
    } else if (prop === "salute") {
      // drawn after the head (below) so the hand sits on the brim
    } else if (prop === "point") {
      const S = sh(1);
      arms.push({ pts: [S, [tcx + 1.3 * T.a + 20 * u, S[1] + 0.06 * HH], [tcx + 1.5 * T.a + 50 * u, S[1] - 0.02 * HH]], front: false });
    } else if (prop && TWO_HANDS.has(pname(prop) as string)) {
      const S1 = sh(1), S0 = sh(-1);
      let hL: P2, hR: P2, eL: P2, eR: P2, fr = true;
      if (prop === "shrug") { hR = [tcx + 1.35 * T.a + 30 * u, S1[1] + 0.06 * HH]; hL = [tcx - 1.35 * T.a - 30 * u, S0[1] + 0.06 * HH]; eR = [tcx + 1.2 * T.a + 12 * u, S1[1] + 0.42 * HH]; eL = [tcx - 1.2 * T.a - 12 * u, S0[1] + 0.42 * HH]; fr = false; }
      else if (prop === "rope") { hR = [tcx + 6 * u, S1[1] - 0.05 * HH]; hL = [tcx + 4 * u, S1[1] + 0.32 * HH]; eR = [tcx + 1.1 * T.a + 6 * u, S1[1] + 0.2 * HH]; eL = [tcx - 1.1 * T.a - 6 * u, S0[1] + 0.42 * HH]; }
      else if (prop === "crate") { hR = [tcx + 0.62 * T.a, S1[1] + 0.62 * HH]; hL = [tcx - 0.62 * T.a, S0[1] + 0.62 * HH]; eR = [tcx + 1.15 * T.a + 4 * u, S1[1] + 0.45 * HH]; eL = [tcx - 1.15 * T.a - 4 * u, S0[1] + 0.45 * HH]; }
      else if (prop === "rifleH") { hR = [tcx + 0.9 * T.a, S1[1] + 0.5 * HH]; hL = [tcx - 0.9 * T.a, S0[1] + 0.5 * HH]; eR = [tcx + 1.2 * T.a + 6 * u, S1[1] + 0.4 * HH]; eL = [tcx - 1.2 * T.a - 6 * u, S0[1] + 0.4 * HH]; }
      else if (prop === "rice") { hR = [tcx + 0.7 * T.a, S1[1] + 0.66 * HH]; hL = [tcx - 0.7 * T.a, S0[1] + 0.66 * HH]; eR = [tcx + 1.15 * T.a + 4 * u, S1[1] + 0.45 * HH]; eL = [tcx - 1.15 * T.a - 4 * u, S0[1] + 0.45 * HH]; }
      else if (prop === "quill") { hR = [tcx + 0.35 * T.a, S1[1] + 0.3 * HH]; hL = [tcx - 0.45 * T.a, S0[1] + 0.42 * HH]; eR = [tcx + 1.1 * T.a + 6 * u, S1[1] + 0.42 * HH]; eL = [tcx - 1.1 * T.a - 6 * u, S0[1] + 0.48 * HH]; }
      else { hR = [tcx + 0.75 * T.a, torsoBot - 0.18 * HH]; hL = [tcx + 0.15 * T.a, torsoBot - 0.12 * HH]; eR = [tcx + 1.12 * T.a + 4 * u, S1[1] + 0.42 * HH]; eL = [tcx - 1.12 * T.a - 4 * u, S0[1] + 0.45 * HH]; } // hose
      arms[0] = { pts: [S0, eL, hL], front: fr };
      arms.push({ pts: [S1, eR, hR], front: fr });
    } else if (Array.isArray(prop)) {
      const S = sh(1), k = clamp(prop[1], 0, 1);
      const E = lerp2([tcx + 1.1 * T.a + 10 * u, S[1] - 0.15 * HH], [tcx + 1.2 * T.a + 10 * u, S[1] + 0.3 * HH], k);
      const Hd = lerp2([tcx + 1.15 * T.a + 14 * u, S[1] - 0.55 * HH], [tcx + 1.45 * T.a + 22 * u, S[1] + 0.35 * HH], k);
      arms.push({ pts: [S, E, Hd], front: true });
    } else arms.push({ pts: hang(1, sw), front: false });
  }
  const drawArm = (a: Arm) => { p.stroke(curve(a.pts[0], a.pts[1], a.pts[2]), 5.2 * u, armCol); p.dot(a.pts[2][0], a.pts[2][1], 5.5 * u); };
  // behind the body: rifle, sword, arms
  if (rifle) {
    p.band([R0, R1], "#7a4b2a", 5 * u, 1.5 * u, "round");
    p.band([lerp2(R0, R1, 0.6), R1], "#8d949c", 2.4 * u, 1.2 * u, "round");
  }
  if (o.sword && mode !== "sit") {
    const s0: P2 = [tcx - 0.75 * T.a, torsoBot - 0.2 * HH];
    p.band([s0, [s0[0] - Math.sin(rad(25)) * 0.8 * HH, s0[1] + Math.cos(rad(25)) * 0.8 * HH]], "#c9ccd2", 3 * u, 1.2 * u, "round");
  }
  if (o.pack && mode !== "fall") { // backpack showing either side of the torso + a bedroll on top
    const pk = o.pack, top = chin + 0.02 * HH, bot = torsoBot - 0.08 * HH;
    const B = rrect(tcx - 1.22 * T.a, top, tcx + 1.22 * T.a, bot, 18 * u);
    p.shadedFill(B, pk, mul(pk, SH_CLOTH), light, 1.2 * T.a, 0.4); p.inkRing(B, ow, thick);
    const R2 = rrect(tcx - 1.1 * T.a, top - 0.2 * HH, tcx + 1.1 * T.a, top + 0.02 * HH, 14 * u);
    p.shadedFill(R2, "#c2462e", mul("#c2462e", SH_CLOTH), light, 1.1 * T.a, 0.4); p.inkRing(R2, ow * 0.9, thick);
  }
  for (const a of arms) if (!a.front) drawArm(a);
  // torso / dress: shaded fill -> clothing clipped to it -> thick-thin ink ring
  if (dress) {
    const D: Blob = { a: 0.5 * W * 0.98, b: 0.5 * ((sole - 0.35 * HH) - (chin - 0.2 * HH)), nTop: 2.0, nBot: 3.0, egg: 0.35, asym: 0.03 * facing, rot: 0, noise: 0.006, seed: seed + 9 };
    const dp = blobPts(300, sole - 0.35 * HH - D.b, D);
    p.gradFill(dp, o.dress!, mul(o.dress!, SH_CLOTH), light);
    p.inkRing(dp, ow, thick);
    const Sw: Blob = { a: 0.37 * W, b: 0.3 * HH, nTop: 2.2, nBot: 2.4, egg: 0.1, asym: 0, rot: 0, noise: 0.006, seed: seed + 8 };
    const sp = blobPts(300, chin + 0.12 * HH, Sw);
    p.gradFill(sp, o.jacket, mul(o.jacket, SH_CLOTH), light);
    p.inkRing(sp, ow * 0.9, thick);
  } else {
    p.gradFill(tp, o.jacket, mul(o.jacket, SH_CLOTH), light);
    p.clip(tp, () => {
      if (o.belt) {
        for (const s of [-1, 1]) p.band([[tcx - s * 0.75 * T.a, chin - 0.05 * HH], [tcx + s * 0.8 * T.a, torsoBot - 0.1 * HH]], o.belt!, 5.5 * u, 1.8 * u);
        const xc = tcx + 0.025 * T.a, yc = chin - 0.05 * HH + (torsoBot - 0.1 * HH - (chin - 0.05 * HH)) * (0.75 / 1.55);
        p.poly([[xc - 3.5 * u, yc - 3.5 * u], [xc + 3.5 * u, yc - 3.5 * u], [xc + 3.5 * u, yc + 3.5 * u], [xc - 3.5 * u, yc + 3.5 * u]], "#d9dde0", 1.5 * u);
      }
      if (o.stripes) tigerStripes(p, tcx, chin, torsoBot, T.a, u, o.stripes, seed);
      if (o.patches) for (const [px, py, pw, ph, pc] of [[-0.55, 0.35, 0.36, 0.22, "#a89c6a"], [0.35, 0.72, 0.34, 0.2, "#6e6a48"]] as [number, number, number, number, string][]) {
        const x = tcx + px * T.a, y = chin + py * HH, Pt = rrect(x, y, x + pw * T.a, y + ph * HH, 3 * u);
        p.poly(Pt, pc, 1.4 * u); for (let k = 0; k < 4; k++) p.stroke([[x + (k + 0.5) * pw * T.a / 4, y - 2 * u], [x + (k + 0.5) * pw * T.a / 4, y + 3 * u]], 1.2 * u);
      }
      if (o.pack) for (const s2 of [-1, 1]) p.band([[tcx + s2 * 0.62 * T.a, chin - 0.04 * HH], [tcx + s2 * 0.55 * T.a, torsoBot - 0.05 * HH]], shade(o.pack, 0.75), 5 * u, 1.4 * u);
      if (o.sash) p.band([[tcx - 1.3 * T.a, torsoBot - 0.32 * HH], [tcx + 1.3 * T.a, torsoBot - 0.32 * HH]], o.sash, 0.13 * HH, 1.8 * u);
      for (let i = 0; i < 4; i++) {
        const y = chin + 0.12 * HH + i * 0.2 * HH;
        if (o.sash && Math.abs(y - (torsoBot - 0.32 * HH)) < 0.08 * HH) continue;
        p.dot(tcx + 2 * u * facing, y, 2.2 * u + 0.8 * u, INK); p.dot(tcx + 2 * u * facing, y, 2.2 * u, o.buttons ?? shade(o.jacket, 0.7));
      }
    });
    if (o.sash) { const s = facing || 1; p.poly([[tcx + s * 0.55 * T.a, torsoBot - 0.3 * HH], [tcx + s * 0.75 * T.a, torsoBot + 0.05 * HH], [tcx + s * 0.45 * T.a, torsoBot + 0.02 * HH]], o.sash, 1.6 * u); }
    p.inkRing(tp, ow, thick);
    if (o.pup) { // Stubby peeking out between the coat buttons
      const save = p.rot; p.rot = null; const g = p.g; g.save(); g.translate(tcx - 6 * u, chin + 0.42 * HH); g.scale(0.42 * u, 0.42 * u);
      dogHead(p, 0, 0, { eye: "dot", ears: 0.5 }, light); g.restore(); p.rot = save;
    }
  }
  // in front of the body: hands holding props
  for (const a of arms) if (a.front) {
    drawArm(a);
    const [hx, hy] = a.pts[2];
    if (prop === "icecream") {
      p.poly([[hx - 8 * u, hy - 12 * u], [hx + 8 * u, hy - 12 * u], [hx, hy + 7 * u]], "#e0a35a", 1.8 * u);
      p.ell(hx, hy - 19 * u, 11 * u, 10 * u, "#f7c6d9", 2.2 * u);
      p.dot(hx, hy, 5.5 * u);
    } else if (Array.isArray(prop) && prop[0] === "hammer") {
      const ang = rad(-70 + 105 * clamp(prop[1], 0, 1));
      const Rh = (pts: P2[]) => rotPts(pts, ang, hx, hy);
      p.band(Rh([[hx, hy + 12 * u], [hx, hy - 44 * u]]), "#8a5a34", 5 * u, 1.5 * u, "round");
      p.poly(Rh([[hx - 12 * u, hy - 58 * u], [hx + 20 * u, hy - 58 * u], [hx + 20 * u, hy - 42 * u], [hx - 12 * u, hy - 42 * u]]), "#7d848c", 2.2 * u);
      p.dot(hx, hy, 5.5 * u);
    }
  }
  if (typeof prop === "string" && SMALL.has(prop)) {
    const [hx, hy] = arms[arms.length - 1].pts[2];
    heldSmall(p, prop, hx, hy, u, opts.phase ?? 0);
    p.dot(hx, hy, 5.5 * u);
  }
  if (prop && !Array.isArray(prop) && TWO_HANDS.has(prop)) drawHeld(p, prop, arms[0].pts[2], arms[arms.length - 1].pts[2], u, HH, sole);
  if (pname(prop) === "rocket" || pname(prop) === "torch") {
    const [hx, hy] = arms[arms.length - 1].pts[2];
    if (pname(prop) === "rocket") heldRocket(p, hx, hy, u, (prop as [string, number])[1], sole, crown);
    else { p.band([[hx - 6 * u, hy + 14 * u], [hx + 22 * u, hy - 40 * u]], "#7a4b2a", 4 * u, 1.4 * u, "round"); fxFlameAt(p, hx + 24 * u, hy - 46 * u, 12 * u); }
    p.dot(hx, hy, 5.5 * u);
  }
  if (prop === "shako") { // carried by the left hand
    const [hx, hy] = arms[0].pts[2];
    p.poly([[hx - 14 * u, hy + 3 * u], [hx + 14 * u, hy + 3 * u], [hx + 16 * u, hy + 30 * u], [hx - 16 * u, hy + 30 * u]], "#3a3d47", 2.2 * u);
    p.ell(hx, hy + 31 * u, 3.5 * u, 3.5 * u, "#2b7a4b", 1.5 * u);
    p.dot(hx, hy, 5.5 * u);
  }
  // ---- head: rotates with the body, plus its own tilt about the chin ----
  const Ah = A + headTilt, [cpx, cpy] = rotAbout([300, chin], rad(A), [300, hipY]);
  p.rot = Ah ? [rad(Ah), 300, chin, cpx - 300, cpy - chin] : null;
  hatBehind(p, o, H, 300, hc, light, thick, ow, false);
  const hp = blobPts(300, hc, H);
  p.shadedFill(hp, skin, mul(skin, SH_SKIN), light, H.a);
  p.inkRing(hp, ow, thick);
  hatOn(p, o, hp, H, 300, hc, light, seed, facing, false);
  const brim = !!o.hat && o.hat !== "hair" && o.hat !== "bonnet" && o.hat !== "cap" && o.hat !== "jcap";
  faceFront(p, 300, hc, W, expr, facing, look, lid, brim, skin, o.moustache, o.build === "stout");
  if (o.mask) gasMask(p, 300 + 7 * u * facing, hc, u);
  if (prop === "salute") {
    p.rot = A ? [rad(A), 300, hipY] : null;
    const S = sh(1), [hx2, hy2] = rotAbout([300 + 0.62 * H.a, hc - 0.5 * H.b], rad(headTilt), [300, chin]);
    const pts: [P2, P2, P2] = [S, [tcx + 1.25 * T.a + 22 * u, S[1] - 0.18 * HH], [hx2, hy2]];
    p.stroke(curve(pts[0], pts[1], pts[2]), 5.2 * u, armCol);
    p.poly([[hx2 - 9 * u, hy2 - 3 * u], [hx2 + 10 * u, hy2 - 8 * u], [hx2 + 11 * u, hy2 + 2 * u], [hx2 - 7 * u, hy2 + 6 * u]], skin, 1.6 * u); // flat hand
  }
  p.rot = null;
};
/** WWI box respirator over the face: khaki hood, two round goggles, snout with a filter can */
const gasMask = (p: Pen, x: number, y: number, u: number) => {
  const M = ellPts(x, y + 4 * u, 36 * u, 33 * u);
  p.poly(M, "#7d7f5a", 4.5 * u);
  for (const s of [-1, 1]) { p.ell(x + s * 13 * u, y - 2 * u, 10 * u, 10 * u, "#d6e8ec", 3.5 * u); p.ell(x + s * 15 * u, y - 5 * u, 3 * u, 3 * u, "#ffffff", 0); }
  p.ell(x, y + 21 * u, 10 * u, 9 * u, "#4e523a", 3 * u);
  p.poly(rrect(x - 7 * u, y + 28 * u, x + 7 * u, y + 44 * u, 3 * u), "#5e6248", 3 * u);
};

export type SideOpts = {
  phase?: number; expr?: Expr; mode?: "march" | "stand" | "swing" | "push"; blink?: boolean | number; stomp?: number; pose?: number;
  /** step length as a multiple of 0.8 m (370 units): matches 1.6 m/s at 2 steps/s; scale by the view's foreshortening */
  stride?: number; light?: number; seed?: number;
  /** push mode: where the hands land at pose 1, in final canvas units (e.g. the swing kid's back) */
  hand?: [number, number];
};

/** two-bone leg, knee bending forward (+x) */
const ik = (hip: P2, ank: P2, l1: number, l2: number): P2 => {
  const dx = ank[0] - hip[0], dy = ank[1] - hip[1], d = clamp(Math.hypot(dx, dy), 1, l1 + l2 - 0.01);
  const A = Math.acos(clamp((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d), -1, 1)), k = Math.atan2(dy, dx) - A;
  return [hip[0] + l1 * Math.cos(k), hip[1] + l1 * Math.sin(k)];
};

/** hip height of the seated kid in `swing` mode (design units); swingKid seats the torso bottom on the plank */
const SWING_HIP = 733;

/** side view facing screen-right; march footfalls land at phase 0 (near foot) and 0.5 (far foot), like the front view.
 *  The stance foot is planted: it slides back at exactly the walking speed while the hip rises and falls over it. */
export const bodySide = (p: Pen, o: Outfit, opts: SideOpts) => {
  const { phase = 0, expr = "neutral", mode = "march", blink = false, stomp = 1, pose = 0, stride = 1, light = DEF_LIGHT, seed = 1 } = opts;
  const Bd = BUILD[o.build ?? "adult"], skin = o.skin ?? SKIN, two = Math.PI * 2, lid = lidOf(blink);
  const H: Blob = { ...headBlob(seed, Bd.a, 1), asym: 0.12, rot: rad(3 + 3 * (rnd(seed, 7) - 0.5)) };
  const W = 2 * H.a, HH = 2 * H.b, u = W / 100, sole = 975, ankY = sole - 4 * u;
  const thick = thickAngle(light), ow = 5 * u;
  const legLen = (Bd.legs + 0.12) * HH - 4 * u, l1 = legLen / 2, l2 = legLen / 2;
  const nearCol = mix(o.pants, INK, 0.55), farCol = mix(o.pants, INK, 0.75), footCol = o.boots;
  type LegS = { ank: P2; pitch: number; near: boolean };
  const legs: LegS[] = [];
  let hipY = ankY - legLen * 0.995, lean = 0, nearFwd = 0;
  if (mode === "march") {
    const S = 370 * stride, liftH = Math.max(22, 40 + 70 * (stomp - 1));
    const st = (ph: number) => {
      const c = (((phase + ph) % 1) + 1) % 1;
      if (c < 0.5) { const s = c / 0.5; return { x: S / 2 - S * s, h: 0, stance: true, s }; }
      const s = (c - 0.5) / 0.5; // swing: cycloid in world space, so the foot leaves and lands at zero ground speed
      return { x: -S / 2 + S * s - (S / Math.PI) * Math.sin(2 * Math.PI * s), h: liftH * Math.sin(Math.PI * s), stance: false, s };
    };
    const nL = st(0), fL = st(0.5), stance = nL.stance ? nL : fL;
    const Leff = legLen * (1 - 0.035 * Math.sin(Math.PI * stance.s));
    hipY = ankY - Math.sqrt(Math.max(1, Leff * Leff - stance.x * stance.x));
    for (const [L, near] of [[fL, false], [nL, true]] as const)
      legs.push({ ank: [300 + L.x, ankY - L.h], pitch: L.stance ? 0 : rad(35 * Math.sin(Math.PI * L.s) * (1 - 1.6 * L.s)), near });
    lean = 4 + 3 * Math.cos(2 * two * phase); // 7 deg at contact, 1 deg at passing
    nearFwd = nL.x / (S / 2);
  } else if (mode === "push") {
    hipY = ankY - 0.87 * legLen;
    legs.push({ ank: [300 - 0.5 * legLen, ankY], pitch: rad(-8), near: false }, { ank: [300 + 0.32 * legLen, ankY], pitch: 0, near: true });
    lean = 14 * pose;
  } else if (mode === "swing") {
    hipY = SWING_HIP;
    const a = rad(60 * pose);
    for (const [dx, near] of [[-6, false], [0, true]] as const) {
      const knee: P2 = [300 + l1 * 0.98 + dx * u, hipY + 6 * u];
      legs.push({ ank: [knee[0] + l2 * Math.sin(a), knee[1] + l2 * Math.cos(a)], pitch: -a * 0.5, near });
    }
  } else {
    legs.push({ ank: [300 - 4 * u, ankY], pitch: 0, near: false }, { ank: [300 + 4 * u, ankY], pitch: 0, near: true });
  }
  const torsoBot = hipY + 0.12 * HH, chin = torsoBot - Bd.torso * HH, hc = chin - H.b, crown = hc - H.b, hip: P2 = [300, hipY];
  p.rot = null;
  for (const L of legs) {
    const knee = mode === "swing" ? ([300 + l1 * 0.98 + (L.near ? 0 : -6 * u), hipY + 6 * u] as P2) : ik(hip, L.ank, l1, l2);
    const hp0: P2 = [300 + (L.near ? 0 : -5 * u), hipY];
    p.stroke([hp0, knee, L.ank], 5.8 * u, L.near ? nearCol : farCol);
    const c = Math.cos(L.pitch), s = Math.sin(L.pitch);
    footStroke(p, [L.ank[0] - 3 * u * c, L.ank[1] - 3 * u * s], [L.ank[0] + 13 * u * c, L.ank[1] + 13 * u * s + 0.5 * u],
      7.5 * u, L.near ? footCol : footCol === INK ? INK : shade(footCol, 0.82));
  }
  // ---- upper body leans about the hip ----
  p.rot = lean ? [rad(lean), 300, hipY] : null;
  const T: Blob = { a: (o.build === "stout" ? 0.36 : 0.31) * W, b: 0.5 * (torsoBot - (chin - 0.25 * HH)), nTop: 2.2, nBot: 2.5, egg: 0.1, asym: 0.06,
    rot: 0, noise: 0.006, seed: seed + 7 };
  const tcx = 300 + 2 * u, tcy = torsoBot - T.b, tp = blobPts(tcx, tcy, T);
  const armCol = mix(o.jacket, INK, 0.5), farArm = mix(o.jacket, INK, 0.68);
  const S: P2 = [tcx + 0.05 * T.a, chin + 0.14 * HH], aLen = 0.95 * HH;
  const swingArm = (ang: number): [P2, P2, P2] => {
    const e: P2 = [S[0] + Math.sin(ang) * aLen * 0.5, S[1] + Math.cos(ang) * aLen * 0.5], a2 = ang + rad(16) * Math.sign(ang || 1);
    return [S, e, [e[0] + Math.sin(a2) * aLen * 0.5, e[1] + Math.cos(a2) * aLen * 0.5]];
  };
  const rifle = !!o.rifle && (mode === "march" || mode === "stand");
  const B0: P2 = [tcx + 0.72 * T.a, chin + 0.58 * HH], B1: P2 = [tcx - 0.95 * T.a - 22 * u, crown - 0.4 * HH];
  let near: [P2, P2, P2], far: [P2, P2, P2] | null;
  if (mode === "swing") { near = [S, [S[0] + 12 * u, S[1] - 0.16 * HH], [300 + 6 * u, chin - 0.3 * HH]]; far = [S, [S[0] + 8 * u, S[1] - 0.18 * HH], [300 + 2 * u, chin - 0.36 * HH]]; }
  else if (mode === "push") {
    const reach = 0.55 * HH + 0.45 * HH * pose;
    let hN: P2 = [S[0] + reach, S[1] + 0.06 * HH];
    if (opts.hand) {
      // target is in final canvas units; the arm is drawn inside the lean rotation, so undo it
      const th = -rad(lean), dx = opts.hand[0] - 300, dy = opts.hand[1] - hipY;
      const tg: P2 = [300 + dx * Math.cos(th) - dy * Math.sin(th), hipY + dx * Math.sin(th) + dy * Math.cos(th)];
      hN = [hN[0] + (tg[0] - hN[0]) * pose, hN[1] + (tg[1] - hN[1]) * pose];
    }
    near = [S, [(S[0] + hN[0]) / 2, (S[1] + hN[1]) / 2 + 0.06 * HH], hN];
    far = [S, [(S[0] + hN[0]) / 2 - 4 * u, (S[1] + hN[1]) / 2 - 0.02 * HH], [hN[0] - 6 * u, hN[1] - 0.08 * HH]];
  } else if (rifle) { near = [S, [S[0] - 4 * u, S[1] + 0.42 * HH], B0]; far = mode === "march" ? swingArm(rad(30) * nearFwd) : swingArm(0); }
  else { near = swingArm(rad(-30) * nearFwd); far = mode === "march" ? swingArm(rad(30) * nearFwd) : null; }
  if (far) { p.stroke(curve(far[0], far[1], far[2]), 5.2 * u, farArm); p.dot(far[2][0], far[2][1], 5.5 * u); }
  p.gradFill(tp, o.jacket, mul(o.jacket, SH_CLOTH), light);
  p.clip(tp, () => {
    if (o.stripes) tigerStripes(p, tcx, chin, torsoBot, T.a, u, o.stripes, seed);
    if (o.belt) p.band([[tcx - 0.65 * T.a, chin - 0.05 * HH], [tcx + 0.75 * T.a, torsoBot - 0.1 * HH]], o.belt!, 5.5 * u, 1.8 * u);
    if (o.sash) p.band([[tcx - 1.3 * T.a, torsoBot - 0.32 * HH], [tcx + 1.3 * T.a, torsoBot - 0.32 * HH]], o.sash, 0.13 * HH, 1.8 * u);
    if (!o.dress) for (let i = 0; i < 3; i++) { const y = chin + 0.16 * HH + i * 0.24 * HH; p.dot(tcx + 0.8 * T.a, y, 3 * u, INK); p.dot(tcx + 0.8 * T.a, y, 2.2 * u, o.buttons ?? shade(o.jacket, 0.7)); }
  });
  p.inkRing(tp, ow, thick);
  if (rifle) {
    p.band([B0, B1], "#7a4b2a", 5 * u, 1.5 * u, "round");
    p.band([lerp2(B0, B1, 0.6), B1], "#8d949c", 2.4 * u, 1.2 * u, "round");
  }
  p.stroke(curve(near[0], near[1], near[2]), 5.2 * u, armCol); p.dot(near[2][0], near[2][1], 5.5 * u);
  // ---- head ----
  const hx = 300 + 4 * u;
  hatBehind(p, o, H, hx, hc, light, thick, ow, true);
  const hp = blobPts(hx, hc, H);
  p.shadedFill(hp, skin, mul(skin, SH_SKIN), light, H.a);
  p.inkRing(hp, ow, thick);
  hatOn(p, o, hp, H, hx, hc, light, seed, 1, true);
  const brim = !!o.hat && o.hat !== "hair" && o.hat !== "bonnet" && o.hat !== "cap" && o.hat !== "jcap";
  faceSide(p, hx, hc, W, expr, lid, brim, skin, o.moustache, o.build === "stout");
  p.rot = null;
};

/** rope + seat + seated kid on a 700 x 2300 canvas; the pivot is design (350, 20); kid drawn at 0.92 scale */
export const swingKid = (p: Pen, o: Outfit, kick: number, expr: Expr, light = DEF_LIGHT, blink: number = 0) => {
  const rope = 1830, k = 1.1, HH = 2 * headBlob(5, BUILD[o.build ?? "adult"].a, 1).b;
  // two ropes from the pivot to the ends of a wide plank, the kid framed between them: a single rope behind the kid
  // ended at the cap and read as a hanging. Far rope behind the kid, near rope drawn over (clear of the face).
  const seat = rope + 18, x0 = 150, x1 = 550;
  p.line([[350, 20], [x0 + 16, seat + 4]], "#a07a4c", 10);
  p.poly(rrect(x0, seat, x1, seat + 36, 10), "#b5653f", 9);
  const g = p.g;
  g.save();
  g.translate(350 - 300 * k, rope + 18 - (SWING_HIP + 0.12 * HH) * k);
  g.scale(k, k);
  bodySide(new Pen(g), o, { expr, mode: "swing", pose: kick, light, seed: 5, blink });
  g.restore();
  p.line([[350, 20], [x1 - 16, seat + 4]], "#a07a4c", 10);
};

// ---------------- effects ----------------
export const fxNote = (p: Pen, kind: number, col = "#1f2a44") => {
  p.ell(70, 200, 46, 34, col, 8, 0, 360, -20);
  p.stroke([[110, 190], [110, 40]], 14);
  if (kind === 0) p.poly([[110, 40], [170, 70], [170, 110], [110, 82]], col, 8);
  else {
    p.ell(150, 170, 40, 30, col, 8, 0, 360, -20);
    p.stroke([[186, 160], [186, 20]], 14);
    p.poly([[110, 40], [186, 20], [186, 50], [110, 70]], col, 8);
  }
};

/** spark / impact star on a 500 x 500 canvas; t in 0..1 */
export const fxBurst = (p: Pen, t: number, col = "#fff3b0", rays = 10, r0 = 40, r1 = 230) => {
  const c = 250, e = 1 - (1 - t) ** 3;
  for (let i = 0; i < rays; i++) {
    const a = rad((i * 360) / rays + 7 * (i % 2)), ra = r0 + (r1 - r0) * e * (0.75 + 0.25 * (i % 2));
    p.poly([[c + r0 * 0.5 * Math.cos(a + 0.18), c + r0 * 0.5 * Math.sin(a + 0.18)], [c + ra * Math.cos(a), c + ra * Math.sin(a)],
      [c + r0 * 0.5 * Math.cos(a - 0.18), c + r0 * 0.5 * Math.sin(a - 0.18)]], col, Math.max(3, 8 * (1 - t)));
  }
  if (t < 0.5) p.ell(c, c, r0 * (1.4 - t), r0 * (1.4 - t), WHITE, 8);
};

/** water splash crown on an 800 x 800 canvas; t in 0..1 */
export const fxSplash = (p: Pen, t: number) => {
  const c = 400, size = 800, rise = Math.sin(Math.min(1, t * 1.3) * Math.PI);
  const blue = "#bfe8ff", deep = "#6cc0f0";
  if (rise > 0.02) {
    const pts: P2[] = [];
    for (let i = 0; i < 19; i++) {
      const h = (i % 2 ? 260 : 130) * rise * (0.7 + 0.3 * Math.sin(i * 1.7));
      pts.push([c - 330 + (660 * i) / 18, size - 120 - h]);
    }
    p.poly([...pts, [c + 330, size - 90], [c - 330, size - 90]], blue, 10);
    p.ell(c, size - 100, 360, 46, deep, 10);
  }
  for (let i = 0; i < 8; i++) {
    const a = rad(200 + i * 18), d = 120 + 380 * t, y = size - 160 + d * Math.sin(a) + 520 * t * t, r = 26 * (1 - t) + 6;
    if (t > 0.08 && y < size - 40) p.ell(c + d * Math.cos(a), y, r, r * 1.25, blue, 7);
  }
};

/** dust puff on a 300 x 300 canvas; t in 0..1 */
export const fxPuff = (p: Pen, t: number) => {
  for (let i = 0; i < 5; i++) {
    const a = rad(160 + i * 55), d = 40 + 70 * t, r = (34 + 20 * (i % 2)) * (1 - 0.6 * t);
    p.ell(150 + d * Math.cos(a), 180 + d * 0.45 * Math.sin(a), r, r * 0.8, `rgba(238,225,205,${(1 - t).toFixed(3)})`, 0);
  }
};

/** circling stars on a 420 x 210 canvas */
export const fxStars = (p: Pen, t: number) => {
  for (let i = 0; i < 4; i++) {
    const a = t * Math.PI * 2 + (i * Math.PI) / 2, x = 210 + 150 * Math.cos(a), y = 110 + 40 * Math.sin(a), pts: P2[] = [];
    for (let k = 0; k < 10; k++) { const r = k % 2 ? 14 : 34, b = rad(k * 36 - 90); pts.push([x + r * Math.cos(b), y + r * Math.sin(b)]); }
    p.poly(pts, "#ffd84a", 6);
  }
};

/** three jittering strain ticks on a 300 x 300 canvas */
export const fxCreak = (p: Pen, t: number) => {
  const j = 6 * Math.sin(t * 40);
  for (const a of [-30, 0, 30]) {
    const b = rad(a - 90);
    p.stroke([[150 + 70 * Math.cos(b) + j, 230 + 70 * Math.sin(b)], [150 + 100 * Math.cos(b) + 10 + j, 230 + 100 * Math.sin(b)],
      [150 + 130 * Math.cos(b) + j, 230 + 130 * Math.sin(b)]], 10);
  }
};

/** flat water ring (drawn top-down) on a 600 x 600 canvas; t in 0..1 */
export const fxRing = (p: Pen, t: number) => {
  // thin light water rings (white crest, pale blue trailing rings), thinning as they spread
  const g = p.g;
  for (let k = 0; k < 3; k++) {
    const u = t - k * 0.22;
    if (u <= 0 || u >= 1) continue;
    g.beginPath(); g.ellipse(300, 300, 60 + 230 * u, 60 + 230 * u, 0, 0, Math.PI * 2);
    g.strokeStyle = k === 0 ? "#f6fcff" : "#cfe8fa"; g.lineWidth = 9 * (1 - u) + 3; g.stroke();
  }
};

/** text-free sign on a 700 x 520 canvas: "no marching in step on the bridge". A bridge (deck + arch + piers), four
 *  identical pairs of marching legs in the same stride (in step), a bold red X over all of it. */
export const fxSign = (p: Pen) => {
  const g = p.g, RED = "#d42f2f";
  p.poly(rrect(14, 14, 686, 506, 40), "#f6ecd2", 0);
  p.poly(rrect(14, 14, 686, 506, 40), null, 14);
  // bridge: deck, stone arch underneath, two piers
  p.poly(rrect(70, 352, 630, 384, 8), "#8a5a3a", 9);
  g.beginPath(); g.moveTo(112, 470); g.quadraticCurveTo(350, 300, 588, 470);
  g.strokeStyle = INK; g.lineWidth = 16; g.lineCap = "round"; g.stroke();
  for (const x of [88, 612]) p.poly(rrect(x - 16, 384, x + 16, 470, 4), "#8a5a3a", 9);
  // four identical soldiers' legs mid-stride: same leg forward on every one = in step
  for (const x of [150, 278, 406, 534]) {
    p.poly(rrect(x - 30, 150, x + 30, 214, 14), "#357650", 9);                  // coat hem
    p.stroke([[x - 8, 210], [x + 34, 262], [x + 46, 338]], 15, INK);           // front leg
    p.stroke([[x + 6, 210], [x - 12, 274], [x - 36, 336]], 15, INK);           // back leg
    p.poly(rrect(x + 30, 330, x + 74, 350, 9), INK, 0);                          // boots point forward
    p.poly(rrect(x - 52, 328, x - 8, 348, 9), INK, 0);
  }
  // big red X
  for (const [a, b] of [[[96, 70], [604, 452]], [[604, 70], [96, 452]]] as [[number, number], [number, number]][]) {
    p.stroke([a, b], 58, "#ffffff");
    p.stroke([a, b], 42, RED);
  }
};

/** soft cartoon cloud on a 600 x 300 canvas */
export const fxCloud = (p: Pen, seed: number) => {
  const blobs: [number, number, number][] = [[150, 190, 80], [250, 150, 105], [360, 160, 95], [450, 195, 70], [300, 210, 90]];
  for (const [x, y, r] of blobs) p.ell(x + ((seed * 37) % 20) - 10, y, r, r * 0.8, "#ffffff", 0);
  p.ell(300, 235, 230, 40, "#ffffff", 0);
};

/** cast shadow on a 128 x 256 canvas: dark soft contact pool at the feet (y 205) and a softer tail that runs up the
 *  canvas = away from the sun, fading with distance; multiply colour (sRGB-encoded linear ratio), white = no change */
export const fxShadow = (p: Pen, col: string) => {
  const g = p.g;
  g.fillStyle = WHITE; g.fillRect(0, 0, 128, 256);
  g.save(); g.filter = "blur(9px)";
  const lg = g.createLinearGradient(0, 205, 0, 22);
  lg.addColorStop(0, mix(col, WHITE, 0.08)); lg.addColorStop(0.55, mix(col, WHITE, 0.3)); lg.addColorStop(1, mix(col, WHITE, 0.85));
  g.fillStyle = lg;
  g.beginPath(); g.moveTo(40, 205); g.bezierCurveTo(36, 120, 46, 50, 64, 30); g.bezierCurveTo(82, 50, 92, 120, 88, 205); g.closePath(); g.fill();
  g.fillStyle = col; g.beginPath(); g.ellipse(64, 205, 30, 17, 0, 0, Math.PI * 2); g.fill();
  g.restore();
};

/** tight contact shadow right under the feet on a 128 x 128 canvas: dark core, short fall-off (multiply colour) */
export const fxContact = (p: Pen, col: string) => {
  const g = p.g;
  g.fillStyle = WHITE; g.fillRect(0, 0, 128, 128);
  const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  for (const [r, k] of [[0, 0], [0.32, 0.02], [0.5, 0.22], [0.66, 0.58], [0.82, 0.88], [1, 1]] as const) gr.addColorStop(r, mix(col, WHITE, k));
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
};

/** floating wooden plank, side-on, on a 320 x 110 canvas */
export const fxPlank = (p: Pen) => {
  p.poly(rrect(14, 30, 306, 78, 10), "#a8744a", 9);
  p.line([[40, 46], [150, 44], [270, 50]], "#7d5234", 4);
  p.line([[60, 62], [200, 64], [284, 60]], "#7d5234", 4);
  p.dot(36, 54, 5, INK); p.dot(284, 54, 5, INK);
};

/** floating marching drum (no text) on a 260 x 240 canvas: white shell, red hoops, ink zig-zag cord */
export const fxDrum = (p: Pen) => {
  p.poly(rrect(40, 70, 220, 190, 16), "#f1ece0", 9);
  p.poly(rrect(32, 58, 228, 86, 12), "#c9373a", 8);
  p.poly(rrect(32, 176, 228, 204, 12), "#c9373a", 8);
  p.line([[52, 88], [82, 172], [112, 88], [142, 172], [172, 88], [202, 172]], INK, 6);
  p.ell(130, 58, 98, 18, "#f7f3ea", 8);
};

/** soft ground contact blob on a 128 x 128 canvas, multiply colour (sRGB-encoded linear ratio) in the centre */
export const fxBlob = (p: Pen, col: string) => {
  const g = p.g;
  g.fillStyle = WHITE; g.fillRect(0, 0, 128, 128);
  // soft contact shadow: flat core, then a long smooth (roughly gaussian) fall-off to white = no change
  const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  for (const [r, k] of [[0, 0], [0.5, 0.04], [0.64, 0.18], [0.76, 0.42], [0.87, 0.72], [0.95, 0.92], [1, 1]] as const) gr.addColorStop(r, mix(col, WHITE, k));
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
};

// ---------------- rocket-short additions ----------------
/** wavy tiger stripes across a jacket (Tipu's soldiers wore tiger-striped tunics), drawn inside the torso clip */
const tigerStripes = (p: Pen, tcx: number, chin: number, bot: number, ta: number, u: number, col: string, seed: number) => {
  const n = 6, h = bot - chin;
  for (let i = 0; i < n; i++) {
    const y = chin + (h * (i + 0.6)) / n, s = i % 2 ? 1 : -1, l = (0.45 + 0.35 * rnd(seed, 40 + i)) * ta;
    for (const side of [-1, 1]) {
      const x0 = tcx + side * 1.15 * ta, x1 = tcx + side * (1.15 * ta - l);
      const pts: P2[] = [[x0, y - 7 * u], [x1 + side * 0.3 * l, y - 2 * u + s * 3 * u], [x1, y + 1.5 * u], [x1 + side * 0.35 * l, y + 3 * u], [x0, y + 5 * u]];
      p.poly(pts, col, 0);
    }
  }
};
/** small flame (stick torch / fuse) centred at (x, y), radius r */
export const fxFlameAt = (p: Pen, x: number, y: number, r: number, t = 0) => {
  const f = 1 + 0.12 * Math.sin(t * 37);
  p.poly(curve([x - r, y + 0.6 * r], [x, y - 2.4 * r * f], [x + r, y + 0.6 * r], 10).concat(ellPts(x, y + 0.6 * r, r, 0.7 * r, 0, 180)), "#ff8a2a", 0.25 * r);
  p.poly(curve([x - 0.55 * r, y + 0.7 * r], [x, y - 1.3 * r * f], [x + 0.55 * r, y + 0.7 * r], 8).concat(ellPts(x, y + 0.7 * r, 0.55 * r, 0.4 * r, 0, 180)), "#ffe27a", 0);
};
/** rocket held upright at the hand: kind 0 = Mysore (iron tube lashed to a ~1.2 m bamboo pole), 1 = Congreve (iron case,
 *  cone nose, long guide stick) */
const heldRocket = (p: Pen, hx: number, hy: number, u: number, kind: number, sole: number, crown: number) => {
  const x = hx + 2 * u;
  if (kind < 0.5) {
    const top = crown - 18 * u, tube = 40 * u;
    p.band([[x, sole - 30 * u], [x, top + tube * 0.6]], "#c9a35a", 4.2 * u, 1.4 * u, "round");
    for (let k = 0; k < 6; k++) p.stroke([[x - 2 * u, sole - 30 * u - k * 70 * u], [x + 2 * u, sole - 30 * u - k * 70 * u]], 1.4 * u, "#8a6a34");
    p.poly(rrect(x - 7 * u, top, x + 7 * u, top + tube, 3 * u), "#4a4e58", 2 * u);
    p.stroke([[x - 4 * u, top + 4 * u], [x - 4 * u, top + tube - 4 * u]], 1.6 * u, "#8d949c");
    for (const yy of [top + 10 * u, top + tube - 12 * u]) p.band([[x - 9 * u, yy], [x + 9 * u, yy]], "#d9c08a", 2.2 * u, 0.8 * u); // lashings
    p.stroke([[x, top + tube], [x + 6 * u, top + tube + 10 * u]], 1.4 * u, INK); // fuse
  } else {
    const top = crown - 70 * u, tube = 70 * u;
    p.band([[x, sole - 10 * u], [x, top + tube]], "#a07a48", 3.4 * u, 1.2 * u, "round");
    p.poly(rrect(x - 11 * u, top, x + 11 * u, top + tube, 3 * u), "#3d414c", 2.2 * u);
    p.poly([[x - 11 * u, top + 1 * u], [x, top - 26 * u], [x + 11 * u, top + 1 * u]], "#2f323a", 2.2 * u);
    for (const yy of [top + 16 * u, top + 46 * u]) p.stroke([[x - 10 * u, yy], [x + 10 * u, yy]], 1.6 * u, "#8d949c");
  }
};
/** two-handed props, drawn in front of the torso; hL / hR = the hands */
const drawHeld = (p: Pen, kind: string, hL: P2, hR: P2, u: number, HH: number, sole: number) => {
  if (kind === "crate") {
    const x0 = hL[0] - 14 * u, x1 = hR[0] + 14 * u, y0 = hL[1] - 30 * u, y1 = hL[1] + 26 * u;
    for (let k = 0; k < 4; k++) { const x = x0 + 12 * u + k * (x1 - x0 - 24 * u) / 3; p.poly(rrect(x - 5 * u, y0 - 26 * u, x + 5 * u, y0 + 4 * u, 2 * u), "#4a4e58", 1.8 * u); }
    p.poly(rrect(x0, y0, x1, y1, 3 * u), "#b07a48", 2.6 * u);
    p.stroke([[x0 + 3 * u, (y0 + y1) / 2], [x1 - 3 * u, (y0 + y1) / 2]], 2 * u, "#7d5234");
  } else if (kind === "rifleH") { // rifle held flat across both hands (offered)
    const y = (hL[1] + hR[1]) / 2 - 4 * u, x0 = hL[0] - 46 * u, x1 = hR[0] + 60 * u;
    p.band([[x0, y + 3 * u], [x0 + (x1 - x0) * 0.55, y]], "#7a4b2a", 6 * u, 1.6 * u, "round");
    p.poly([[x0 - 4 * u, y - 2 * u], [x0 + 22 * u, y - 4 * u], [x0 + 22 * u, y + 12 * u], [x0 - 6 * u, y + 14 * u]], "#6a3f22", 1.6 * u);
    p.band([[x0 + (x1 - x0) * 0.5, y], [x1, y - 2 * u]], "#8d949c", 2.8 * u, 1.2 * u, "round");
  } else if (kind === "rice") { // sack of rice hugged to the chest
    const x0 = hL[0] - 18 * u, x1 = hR[0] + 18 * u, y0 = hL[1] - 50 * u, y1 = hL[1] + 22 * u;
    const S: P2[] = [...curve([x0 + 6 * u, y1], [x0 - 10 * u, (y0 + y1) / 2], [x0 + 10 * u, y0], 8), [(x0 + x1) / 2 - 8 * u, y0 - 12 * u], [(x0 + x1) / 2 + 8 * u, y0 - 12 * u], ...curve([x1 - 10 * u, y0], [x1 + 10 * u, (y0 + y1) / 2], [x1 - 6 * u, y1], 8)];
    p.poly(S, "#e2d3a8", 2.4 * u);
    p.stroke([[(x0 + x1) / 2 - 12 * u, y0 + 2 * u], [(x0 + x1) / 2 + 12 * u, y0 + 2 * u]], 2.4 * u, "#8a6a3a");
    p.clip(S, () => { p.stroke([[x0 - 10 * u, (y0 + y1) / 2 + 2 * u], [x1 + 10 * u, (y0 + y1) / 2 + 2 * u]], 5 * u, "#3f6a9a"); p.stroke([[x0 - 10 * u, (y0 + y1) / 2 + 10 * u], [x1 + 10 * u, (y0 + y1) / 2 + 10 * u]], 2.4 * u, "#c0353a"); });
  } else if (kind === "quill") {
    p.poly([[hL[0] - 34 * u, hL[1] - 30 * u], [hL[0] + 24 * u, hL[1] - 38 * u], [hL[0] + 30 * u, hL[1] + 12 * u], [hL[0] - 28 * u, hL[1] + 18 * u]], "#f6efdc", 2.2 * u);
    for (let k = 0; k < 4; k++) p.stroke([[hL[0] - 24 * u, hL[1] - 22 * u + k * 9 * u], [hL[0] + 18 * u, hL[1] - 27 * u + k * 9 * u]], 1.2 * u, "#8a8a9a");
    p.poly([[hR[0], hR[1]], [hR[0] + 14 * u, hR[1] - 52 * u], [hR[0] + 22 * u, hR[1] - 40 * u], [hR[0] + 4 * u, hR[1] + 2 * u]], "#f4f1ea", 1.8 * u);
  } else if (kind === "hose") {
    p.line(curve([hR[0] + 20 * u, hR[1] - 2 * u], [hL[0] - 30 * u, sole - 40 * u], [hL[0] - 120 * u, sole - 6 * u], 14), "#3f9a52", 7 * u);
    p.poly(rrect(hR[0] - 4 * u, hR[1] - 8 * u, hR[0] + 30 * u, hR[1] + 4 * u, 3 * u), "#e8c45a", 1.8 * u);
  } else if (kind === "rope") {
    p.band([[hR[0] + 2 * u, 0], [hR[0] + 2 * u, hL[1] + 40 * u]], "#c9a35a", 4 * u, 1.2 * u);
  }
  p.dot(hL[0], hL[1], 5.5 * u); p.dot(hR[0], hR[1], 5.5 * u);
};

// ---------------- rocket-short effects (all unlit cards) ----------------
/** a flying Mysore rocket, side-on, nose to the right, on a 480 x 120 canvas (bamboo pole trailing left) */
export const fxRocket = (p: Pen, kind = 0) => {
  if (kind === 1) {
    p.band([[20, 60], [330, 60]], "#a07a48", 9, 3, "round");
    p.poly(rrect(300, 36, 420, 84, 8), "#3d414c", 7);
    p.poly([[418, 38], [470, 60], [418, 82]], "#2f323a", 7);
  } else if (kind === 3) { // paper case (European)
    p.band([[40, 60], [350, 60]], "#b89a62", 8, 3, "round");
    p.poly(rrect(330, 40, 450, 80, 10), "#eadcb4", 7);
    for (const x of [360, 420]) p.band([[x, 38], [x, 82]], "#c0353a", 6, 2);
  } else if (kind === 2) { // rusty, in the bucket
    p.band([[40, 60], [340, 60]], "#8a6a44", 9, 3, "round");
    p.poly(rrect(330, 38, 440, 82, 10), "#8a4a2a", 7);
    for (let k = 0; k < 7; k++) p.dot(345 + k * 14, 50 + (k % 3) * 10, 4, "#5a2e1a");
  } else {
    p.band([[20, 60], [360, 60]], "#c9a35a", 10, 3, "round");
    p.poly(rrect(340, 40, 460, 80, 10), "#4a4e58", 7);
    p.stroke([[352, 50], [450, 50]], 4, "#8d949c");
    for (const x of [365, 435]) p.band([[x, 34], [x, 86]], "#d9c08a", 7, 2);
  }
};
/** rocket exhaust: flame + sparks, nose to the right (flame trails left), on a 300 x 160 canvas; t animates flicker */
export const fxExhaust = (p: Pen, t: number) => {
  const f = 1 + 0.18 * Math.sin(t * 53) + 0.1 * Math.sin(t * 31);
  p.poly([[300, 50], [300 - 260 * f, 80], [300, 110]], "#ff7a1f", 6);
  p.poly([[300, 62], [300 - 160 * f, 80], [300, 98]], "#ffd34a", 0);
  p.poly([[300, 70], [300 - 70 * f, 80], [300, 90]], "#fffbe0", 0);
  for (let k = 0; k < 5; k++) { const a = rnd(Math.floor(t * 20) + k, 3); p.dot(300 - 120 - 150 * a, 80 + 60 * (rnd(Math.floor(t * 20) + k, 4) - 0.5), 6, "#ffe27a"); }
};
/** smoke puff (grey, ink-free) on a 300 x 300 canvas; t = age 0..1 */
export const fxSmoke = (p: Pen, t: number, col = [215, 212, 222]) => {
  const a = Math.max(0, 1 - t) ** 1.3;
  for (let i = 0; i < 5; i++) {
    const ang = rad(i * 72 + 20), d = 26 + 40 * t, r = (46 + 14 * (i % 2)) * (0.55 + 0.45 * t);
    p.ell(150 + d * Math.cos(ang), 150 + d * 0.8 * Math.sin(ang), r, r * 0.9, `rgba(${col[0]},${col[1]},${col[2]},${(0.92 * a).toFixed(3)})`, 0);
  }
};
/** explosion on an 800 x 800 canvas; t = age 0..1: hot core, ink-rimmed fireball lobes, flying debris */
export const fxBoom = (p: Pen, t: number) => {
  const c = 400, e = easeO(t), fade = 1 - smoothU((t - 0.55) / 0.45);
  if (fade <= 0) return;
  // one merged cloud: every lobe stroked thick first, then every lobe filled on top -> a single union outline
  const lobes: [number, number, number][] = [];
  for (let i = 0; i < 11; i++) {
    const a = rad(i * 33 + 10), d = (i < 3 ? 20 : 60 + 150 * e) , r = (135 - 30 * (i % 3)) * (0.55 + 0.55 * e) * fade;
    lobes.push([c + d * Math.cos(a), c + d * 0.8 * Math.sin(a) - 70 * e, r]);
  }
  const smoke = t < 0.3 ? "#ff8a2a" : mix("#ff8a2a", "#6f6a78", smoothU((t - 0.3) / 0.25));
  for (const [x, y, r] of lobes) p.ell(x, y, r, r * 0.92, INK, 0, 0, 360);
  for (const [x, y, r] of lobes) p.ell(x, y, Math.max(1, r - 10 * fade), Math.max(1, r * 0.92 - 10 * fade), smoke, 0);
  if (t < 0.55) for (const [x, y, r] of lobes.slice(0, 7)) p.ell(x + 8, y + 10, r * 0.62 * (1 - t / 0.55), r * 0.56 * (1 - t / 0.55), "#ffc23a", 0);
  if (t < 0.3) p.ell(c, c - 20, 130 * (1 - t / 0.3) + 30, 110 * (1 - t / 0.3) + 25, "#fff6c8", 0);
  for (let k = 0; k < 8; k++) {
    const a = rad(k * 45 + 22), d = 120 + 330 * e, x = c + d * Math.cos(a), y = c + d * Math.sin(a) - 200 * e + 300 * t * t;
    p.poly(rrect(x - 16, y - 8, x + 16, y + 8, 3), "#8a5a34", 5);
  }
};
const easeO = (t: number) => 1 - (1 - clamp(t, 0, 1)) ** 3;
const smoothU = (x: number) => { const v = clamp(x, 0, 1); return v * v * (3 - 2 * v); };
/** paper rocket tearing open: scraps flying out, on a 400 x 400 canvas; t = age 0..1 */
export const fxScraps = (p: Pen, t: number) => {
  for (let k = 0; k < 10; k++) {
    const a = rad(k * 36 + 15 * rnd(k, 1)), d = 30 + 150 * easeO(t) * (0.6 + 0.4 * rnd(k, 2)), x = 200 + d * Math.cos(a), y = 200 + d * Math.sin(a) + 120 * t * t;
    const r = 16 + 10 * rnd(k, 3), ang = a + t * 6;
    p.poly([[x + r * Math.cos(ang), y + r * Math.sin(ang)], [x + r * Math.cos(ang + 2.2), y + r * Math.sin(ang + 2.2)], [x + 0.7 * r * Math.cos(ang + 4), y + 0.7 * r * Math.sin(ang + 4)]], k % 3 ? "#efe2c0" : "#d9c391", 4);
  }
};
/** the moon on a 512 x 512 canvas: pale disc, soft maria, no ink */
export const fxMoon = (p: Pen) => {
  p.ell(256, 256, 240, 240, "#f4f1e4", 0);
  for (const [x, y, r] of [[190, 200, 60], [300, 170, 40], [280, 300, 70], [170, 320, 34], [340, 260, 26]] as const) p.ell(x, y, r, r * 0.85, "#d9d4c4", 0);
};
/** hose water: a parabolic jet leaving (0, 150) to the right, `len` 0..1 of the 1000 px canvas (1000 x 300), droplets */
export const fxWater = (p: Pen, len: number, t: number) => {
  const L = 60 + 900 * len, drop = 40 + 90 * (1 - len), pts: P2[] = [], w = 11 - 5 * len;
  for (let i = 0; i <= 20; i++) { const x = (L * i) / 20; pts.push([x, 150 - 20 * (x / L) + drop * (x / L) ** 2]); }
  p.stroke(pts, w * 2 + 6, "#3d6f9a");
  p.stroke(pts, w * 2, "#bfe8ff");
  p.stroke(pts.map(([x, y]) => [x, y - w * 0.4] as P2), w * 0.6, "#ffffff");
  for (let k = 0; k < 7; k++) { const u = (t * 2.3 + k / 7) % 1, x = L * (0.9 + 0.12 * u), y = 150 + drop + 70 * u * u + 20 * (k % 3); p.ell(x, y, 9, 11, "#bfe8ff", 4); }
};
/** red rocket glare: a bright red-orange star with a long fading tail to the left, on a 600 x 200 canvas */
export const fxGlare = (p: Pen, t: number) => {
  const g = p.g, gr = g.createLinearGradient(40, 100, 520, 100);
  gr.addColorStop(0, "rgba(255,90,60,0)"); gr.addColorStop(1, "rgba(255,120,70,0.95)");
  g.fillStyle = gr; g.beginPath(); g.moveTo(40, 100); g.lineTo(520, 82); g.lineTo(520, 118); g.closePath(); g.fill();
  p.ell(530, 100, 34 + 4 * Math.sin(t * 40), 34, "#ffd0a0", 0); p.ell(530, 100, 18, 18, "#ffffff", 0);
};
/** sky full of tiny stars (no ink) on a 1024 x 512 canvas */
export const fxStarfield = (p: Pen) => {
  for (let k = 0; k < 160; k++) { const r = 1.2 + 2.2 * rnd(k, 7) ** 3; p.dot(1024 * rnd(k, 5), 512 * rnd(k, 6), r, `rgba(255,255,240,${(0.5 + 0.5 * rnd(k, 8)).toFixed(2)})`); }
};

// ---------------- emu-short additions ----------------
export type EmuOpts = { phase?: number; mode?: "stand" | "run" | "eat" | "march"; eye?: "dot" | "smug" | "shock" | "happy" | "blink"; medal?: boolean; helmet?: boolean; beak?: number; light?: number };
/** a cartoon emu, side view facing screen-right, in the 600 x 1000 person design space (feet on y = 975, ~1.7 m tall) */
export const emuSide = (p: Pen, o: EmuOpts = {}) => {
  const { phase = 0, mode = "stand", eye = "dot", medal = false, helmet = false, beak = 0, light = DEF_LIGHT } = o;
  const two = Math.PI * 2, run = mode === "run" || mode === "march";
  const bob = run ? 14 * Math.cos(2 * two * phase) : mode === "eat" ? 0 : 3 * Math.sin(two * phase);
  const lean = mode === "run" ? 14 : 0;
  const hip: P2 = [290, 640 + bob];
  // legs (far first): thigh hidden in the body, shin back to a reversed "knee" (ankle), tarsus to the foot
  const legs: [number, string][] = [[0.5, "#6f6a62"], [0, "#8c8478"]];
  for (const [ph, col] of legs) {
    let fx = 300, fy = 975, kx = 270, ky = 800;
    if (run) {
      const c = ((phase + ph) % 1 + 1) % 1, S = mode === "run" ? 230 : 120;
      if (c < 0.5) { fx = 300 + S / 2 - S * (c / 0.5); fy = 975; }
      else { const u = (c - 0.5) / 0.5; fx = 300 - S / 2 + S * u; fy = 975 - 90 * Math.sin(Math.PI * u); }
      kx = (hip[0] + fx) / 2 - 40; ky = (hip[1] + fy) / 2 + 10;
    } else { fx = 300 + (ph ? -40 : 30); kx = fx - 30; }
    p.stroke([[hip[0], hip[1] + 20], [kx, ky], [fx, fy - 10]], 16, INK); p.stroke([[hip[0], hip[1] + 20], [kx, ky], [fx, fy - 10]], 10, col);
    for (const a of [-0.5, 0, 0.5]) { p.stroke([[fx, fy - 10], [fx + 38 * Math.cos(a), fy - 4 + 10 * Math.sin(a)]], 9, INK); }
  }
  p.rot = lean ? [rad(lean), hip[0], hip[1]] : null;
  // shaggy body
  const B: P2[] = [];
  for (let i = 0; i < 64; i++) {
    const t = (i / 64) * two, r = 1 + (Math.sin(t) > 0.1 ? 0.08 * Math.sin(i * 2.7) : 0);
    B.push([280 + 160 * Math.cos(t) * r, 560 + bob + 118 * Math.sin(t) * r * (Math.cos(t) < -0.6 ? 0.85 : 1)]);
  }
  p.shadedFill(B, "#6e5c49", "#4e4136", light, 160, 0.4);
  for (let k = 0; k < 14; k++) { const x = 170 + 16 * k, y = 520 + bob + 18 * Math.sin(k * 1.9); p.stroke([[x, y], [x - 14, y + 40]], 4, "#4a3c30"); }
  p.inkRing(B, 12, thickAngle(light));
  if (medal) { p.band([[395, 470 + bob], [410, 560 + bob]], "#c0353a", 14, 3); p.ell(412, 585 + bob, 26, 26, "#e8c45a", 6); p.ell(412, 585 + bob, 12, 12, "#f6dc80", 0); }
  // neck + head (eating: bent down to the ground)
  const eat = mode === "eat" ? 0.5 + 0.5 * Math.sin(two * phase * 2) : 0;
  const hx = mode === "eat" ? 470 : mode === "run" ? 500 : 455, hy = mode === "eat" ? 860 + 40 * eat : mode === "run" ? 300 + bob : 220 + bob;
  const neck = curve([395, 500 + bob], [mode === "eat" ? 480 : 430, mode === "eat" ? 560 : 360 + bob], [hx - 10, hy + 20], 12);
  p.stroke(neck, 50, INK); p.stroke(neck, 38, "#7d8a96");
  p.stroke(neck.map(([x, y]) => [x - 6, y] as P2), 10, "#5d6a78");
  const H = ellPts(hx, hy, 46, 38);
  p.shadedFill(H, "#76757f", "#5a5962", light, 46, 0.4); p.poly(H, null, 9);
  if (helmet) p.poly(ellPts(hx - 4, hy - 18, 54, 34, 180, 360).concat([[hx + 50, hy - 18], [hx - 58, hy - 18]]), "#55623a", 8);
  const bo = 10 * beak;
  p.poly([[hx + 30, hy + 4], [hx + 96, hy + 12 + bo * 0.3], [hx + 30, hy + 18]], "#3a3330", 6);
  if (beak > 0) p.poly([[hx + 30, hy + 18], [hx + 86, hy + 26 + bo], [hx + 30, hy + 26]], "#3a3330", 6);
  const ex = hx + 12, ey = hy - 6;
  if (eye === "shock") { p.ell(ex, ey, 20, 20, WHITE, 5); p.dot(ex + 4, ey, 7); }
  else if (eye === "happy") p.arc(ex, ey + 4, 13, 9, 200, 340, 6);
  else if (eye === "blink") p.stroke([[ex - 12, ey], [ex + 12, ey]], 6);
  else if (eye === "smug") { p.ell(ex, ey, 13, 11, INK, 0, 0, 180); p.stroke([[ex - 16, ey], [ex + 16, ey]], 6); }
  else { p.ell(ex, ey, 14, 14, WHITE, 5); p.dot(ex + 4, ey + 1, 7); }
  p.rot = null;
};
/** pigeon on a 300 x 300 canvas, side view facing right; flap 0..1 (0 = walking, wings folded) */
export const fxPigeon = (p: Pen, flap: number, peck = 0) => {
  const fly = flap > 0;
  const by = fly ? 150 : 170;
  if (!fly) for (const dx of [-10, 12]) p.stroke([[150 + dx, 200], [150 + dx, 240]], 7, "#d9735a");
  p.ell(140, by, 70, 46, "#8e95a6", 8);
  p.ell(185, by - 30 + 30 * peck, 30, 28, "#7c8496", 7);
  p.ell(160, by - 4, 22, 14, "#5f8f7a", 0);
  p.poly([[212, by - 32 + 30 * peck], [238, by - 26 + 30 * peck], [212, by - 20 + 30 * peck]], "#f1d9b0", 4);
  p.dot(196, by - 36 + 30 * peck, 5, INK);
  p.poly([[72, by], [30, by - 14], [30, by + 18]], "#6f7686", 6);
  if (fly) { const a = (flap - 0.5) * 2; p.poly([[120, by - 10], [70, by - 10 - 90 * a], [175, by - 10]], "#a3aabb", 7); }
  else p.poly([[105, by - 15], [185, by - 10], [120, by + 15]], "#a3aabb", 6);
};
/** muzzle flash, gun pointing right, on a 300 x 200 canvas */
export const fxMuzzle = (p: Pen, t: number) => {
  const f = 0.7 + 0.3 * Math.sin(t * 61);
  p.poly([[0, 100], [120, 40 * f], [300 * f, 100], [120, 160], [60, 100]], "#ffcf4a", 6);
  p.poly([[20, 100], [110, 70], [200 * f, 100], [110, 130]], "#fff6c8", 0);
};
/** a stylised national-arms style emblem (generic: quartered shield, a kangaroo and an emu as supporters, a star) on 800 x 700 */
export const fxArms = (p: Pen) => {
  p.poly([[260, 160], [540, 160], [540, 400], [400, 520], [260, 400]], "#e8c45a", 10);
  for (const [x, y, c] of [[265, 165, "#c0353a"], [400, 165, "#2f5fb5"], [265, 280, "#2f7a4b"], [400, 280, "#f4f1ea"]] as const) p.poly([[x, y], [x + 135, y], [x + 135, y + 110], [x, y + 110]], c, 0);
  p.poly([[260, 160], [540, 160], [540, 400], [400, 520], [260, 400]], null, 10);
  const star: P2[] = []; for (let k = 0; k < 14; k++) { const a = (k * Math.PI) / 7 - Math.PI / 2, r = k % 2 ? 22 : 50; star.push([400 + r * Math.cos(a), 95 + r * Math.sin(a)]); }
  p.poly(star, "#e8c45a", 8);
  // kangaroo (left)
  p.ell(170, 360, 70, 110, "#b5653f", 9); p.ell(200, 220, 38, 32, "#b5653f", 8); p.poly([[180, 195], [170, 150], [195, 190]], "#b5653f", 6);
  p.stroke([[120, 450], [40, 560]], 22, INK); p.stroke([[120, 450], [40, 560]], 14, "#b5653f"); p.stroke([[150, 470], [150, 600], [220, 600]], 16, "#b5653f"); p.dot(212, 214, 6);
  // emu (right)
  p.ell(630, 400, 90, 70, "#6e5c49", 9); p.stroke([[580, 360], [570, 220]], 34, INK); p.stroke([[580, 360], [570, 220]], 24, "#7d8a96");
  p.ell(565, 205, 30, 25, "#76757f", 7); p.poly([[540, 200], [500, 210], [540, 215]], "#3a3330", 5); p.dot(560, 200, 5);
  for (const x of [610, 650]) p.stroke([[x, 460], [x - 10, 600], [x + 20, 605]], 12, "#8c8478");
  // wattle sprigs
  for (let k = 0; k < 9; k++) p.ell(260 + k * 35, 600 + 12 * Math.sin(k), 18, 18, "#f3d35a", 4);
};

// ---------------- rat-short additions ----------------
const RAT = { fur: "#8a8494", furS: "#625c6e", belly: "#c4bccb", pink: "#eaa3ab", pinkS: "#c97f8a" };
/** small one-hand props at hand (hx, hy); u = design unit of the holder */
const heldSmall = (p: Pen, kind: string, hx: number, hy: number, u: number, ph: number) => {
  if (kind === "rat" || kind === "tail") {
    // dangling by the tail: tail from the fist down, the rat (if any) hanging head-down, swinging a little
    const sw = 6 * u * Math.sin(ph * Math.PI * 2);
    const t = curve([hx, hy + 4 * u], [hx + 6 * u + sw * 0.3, hy + 26 * u], [hx + sw, hy + 50 * u], 10);
    p.stroke(t, 5 * u, INK); p.stroke(t, 3 * u, RAT.pink);
    if (kind === "rat") {
      const bx = hx + sw, by = hy + 50 * u;
      const B = ellPts(bx, by + 22 * u, 14 * u, 24 * u);
      p.shadedFill(B, RAT.fur, RAT.furS, -2, 24 * u, 0.4); p.poly(B, null, 2.2 * u);
      p.ell(bx, by + 50 * u, 11 * u, 10 * u, RAT.fur, 2 * u);
      p.ell(bx - 9 * u, by + 44 * u, 5 * u, 5 * u, RAT.pink, 1.6 * u); p.ell(bx + 9 * u, by + 44 * u, 5 * u, 5 * u, RAT.pink, 1.6 * u);
      p.dot(bx, by + 61 * u, 2.5 * u, RAT.pinkS);
      for (const s2 of [-1, 1]) { p.stroke([[bx - 4 * u, by + 50 * u], [bx - 4 * u, by + 54 * u]], 1.2 * u); p.stroke([[bx + s2 * 10 * u, by + 14 * u], [bx + s2 * 16 * u, by + 22 * u]], 2.4 * u); }
      p.stroke([[bx - 5 * u, by + 52 * u], [bx - 2 * u, by + 52 * u]], 1.2 * u); p.stroke([[bx + 2 * u, by + 52 * u], [bx + 5 * u, by + 52 * u]], 1.2 * u);
    }
  } else if (kind === "coin") {
    p.ell(hx + 4 * u, hy - 10 * u, 9 * u, 9 * u, "#e8c45a", 2 * u); p.ell(hx + 4 * u, hy - 10 * u, 5 * u, 5 * u, "#f6dc80", 0);
  } else if (kind === "scissors") {
    for (const a of [-0.35, 0.35]) p.band([[hx, hy], [hx + 30 * u * Math.cos(-1.2 + a), hy + 30 * u * Math.sin(-1.2 + a)]], "#c9ccd2", 2.6 * u, 1.1 * u, "round");
    p.ell(hx - 4 * u, hy + 6 * u, 5 * u, 4 * u, null, 2 * u); p.ell(hx + 5 * u, hy + 6 * u, 5 * u, 4 * u, null, 2 * u);
  } else if (kind === "axe" || kind === "axeUp") {
    // axe held by the handle end; axeUp = raised over the shoulder (head up and back)
    const a = kind === "axeUp" ? -2.55 : -1.75, L = 74 * u;
    const ex = hx + L * Math.cos(a), ey = hy + L * Math.sin(a);
    p.band([[hx - 6 * u * Math.cos(a), hy - 6 * u * Math.sin(a)], [ex, ey]], "#9a6a3e", 5 * u, 1.4 * u, "round");
    const nx = -Math.sin(a), ny = Math.cos(a);
    const ca = Math.cos(a), sa = Math.sin(a);
    p.poly([[ex - 14 * u * ca - 6 * u * nx, ey - 14 * u * sa - 6 * u * ny], [ex + 6 * u * ca - 6 * u * nx, ey + 6 * u * sa - 6 * u * ny], [ex + 14 * u * ca + 30 * u * nx, ey + 14 * u * sa + 30 * u * ny], [ex - 22 * u * ca + 30 * u * nx, ey - 22 * u * sa + 30 * u * ny]], "#aab3bd", 2.4 * u);
    p.stroke([[ex + 12 * u * ca + 28 * u * nx, ey + 12 * u * sa + 28 * u * ny], [ex - 20 * u * ca + 28 * u * nx, ey - 20 * u * sa + 28 * u * ny]], 2 * u, "#e9eef0");
  } else if (kind === "dropper") {
    p.band([[hx, hy - 4 * u], [hx + 4 * u, hy + 30 * u]], "#d8eef2", 4 * u, 1.2 * u, "round");
    p.ell(hx - 1 * u, hy - 8 * u, 5 * u, 6 * u, "#c0353a", 1.4 * u);
    p.dot(hx + 5 * u, hy + 36 * u, 2.4 * u, "#f4f1ea");
  } else if (kind === "magazine") {
    p.poly([[hx - 26 * u, hy - 40 * u], [hx + 14 * u, hy - 44 * u], [hx + 16 * u, hy + 8 * u], [hx - 24 * u, hy + 10 * u]], "#f4f1ea", 2 * u);
    p.poly([[hx - 22 * u, hy - 36 * u], [hx + 10 * u, hy - 39 * u], [hx + 11 * u, hy - 30 * u], [hx - 21 * u, hy - 27 * u]], "#c0353a", 0);
    p.ell(hx - 5 * u, hy - 10 * u, 10 * u, 11 * u, "#f6f0dc", 1.4 * u);
  } else if (kind === "banana") { // a bunch of bananas, held by the stalk
    p.band([[hx, hy + 4 * u], [hx + 4 * u, hy - 10 * u]], "#6a8a3a", 3.4 * u, 1.2 * u, "round");
    for (let k = 0; k < 4; k++) { const a = -0.5 + 0.35 * k; p.poly(curve([hx + 2 * u, hy + 4 * u], [hx + 30 * u * Math.cos(a) - 10 * u, hy + 30 * u + 6 * u * k], [hx + 36 * u * Math.cos(a), hy + 18 * u + 12 * u * k], 8).concat(curve([hx + 36 * u * Math.cos(a), hy + 18 * u + 12 * u * k], [hx + 22 * u * Math.cos(a), hy + 18 * u + 4 * u * k], [hx + 4 * u, hy + 2 * u], 8)), k % 2 ? "#f2d24a" : "#f7dc5c", 1.8 * u); }
  } else if (kind === "leaflet" || kind === "photo") {
    const ph = kind === "photo", x0 = hx - 30 * u, y0 = hy - 48 * u, x1 = hx + 22 * u, y1 = hy + 6 * u;
    p.poly([[x0, y0 + 2 * u], [x1, y0], [x1 + 2 * u, y1], [x0 + 2 * u, y1 + 2 * u]], ph ? "#fbf8ee" : "#f6efda", 1.8 * u);
    if (ph) { p.poly(rrect(x0 + 5 * u, y0 + 5 * u, x1 - 4 * u, y1 - 12 * u, 2 * u), "#9ab8c8", 0); for (let k = 0; k < 3; k++) p.ell(x0 + 15 * u + 12 * u * k, y0 + 22 * u + (k === 1 ? 4 * u : 0), 4 * u, 4 * u, "#5a4636", 0); }
    else for (let k = 0; k < 4; k++) p.stroke([[x0 + 6 * u, y0 + 10 * u + 10 * u * k], [x1 - 6 * u, y0 + 9 * u + 10 * u * k]], 2 * u, k === 0 ? "#c0353a" : "#8a8a9a");
  } else if (kind === "book") {
    p.poly(rrect(hx - 26 * u, hy - 34 * u, hx + 18 * u, hy + 6 * u, 2 * u), "#3f6a9a", 2 * u);
    p.stroke([[hx - 20 * u, hy - 30 * u], [hx - 20 * u, hy + 2 * u]], 2 * u, "#f6efda");
  } else if (kind === "stamp") {
    p.band([[hx, hy + 2 * u], [hx, hy - 16 * u]], "#7a4b2a", 4 * u, 1.2 * u, "round");
    p.poly(rrect(hx - 11 * u, hy + 2 * u, hx + 11 * u, hy + 10 * u, 2 * u), "#3a3a44", 1.6 * u);
  }
};
export type RatOpts = { phase?: number; mode?: "run" | "stand" | "up" | "dead" | "eat"; eye?: "dot" | "smug" | "shock" | "happy" | "blink" | "x"; tail?: boolean; light?: number; coin?: boolean; sick?: boolean };
/** a cartoon rat facing screen-right, in the 600 x 1000 person design space (feet on y = 975). Placed at scale ~0.3. */
export const ratSide = (p: Pen, o: RatOpts = {}) => {
  const { phase = 0, mode = "stand", eye = "dot", tail = true, light = DEF_LIGHT, coin = false, sick = false } = o;
  p.g.save(); p.g.translate(300, 975); p.g.scale(0.9, 0.9); p.g.translate(-297, -975);
  try { ratBody(p, phase, mode, eye, tail, light, coin, sick); } finally { p.g.restore(); }
};
const ratBody = (p: Pen, phase: number, mode: string, eye: string, tail: boolean, light: number, coin: boolean, sick: boolean) => {
  const two = Math.PI * 2, fur = sick ? "#8f9a86" : RAT.fur, furS = sick ? "#66705e" : RAT.furS;
  if (mode === "dead") { // flat on its back, feet up, x eyes
    const B = ellPts(330, 905, 170, 70);
    if (tail) { const t = curve([170, 915], [80, 960], [30, 900], 14); p.stroke(t, 22, INK); p.stroke(t, 12, RAT.pink); }
    p.shadedFill(B, fur, furS, light, 170, 0.4); p.inkRing(B, 12, thickAngle(light));
    p.ell(330, 880, 110, 34, RAT.belly, 0);
    for (const x of [240, 290, 380, 420]) { p.stroke([[x, 850], [x + 6, 790]], 16, INK); p.stroke([[x, 850], [x + 6, 790]], 8, RAT.pink); }
    const H = ellPts(520, 905, 70, 52); p.shadedFill(H, fur, furS, light, 70, 0.4); p.poly(H, null, 10);
    p.dot(588, 915, 11, RAT.pinkS);
    for (const [x, y] of [[520, 890], [550, 895]]) { p.stroke([[x - 9, y - 9], [x + 9, y + 9]], 6); p.stroke([[x - 9, y + 9], [x + 9, y - 9]], 6); }
    p.ell(480, 860, 30, 26, RAT.pink, 8);
    return;
  }
  const run = mode === "run", up = mode === "up";
  const bob = run ? 16 * Math.abs(Math.sin(two * phase)) : 4 * Math.sin(two * phase);
  // tail (behind), or a bandaged stub
  const tw = run ? 30 * Math.sin(two * phase + 1) : 14 * Math.sin(two * phase * 0.5);
  if (tail) {
    const t = up ? curve([230, 950], [80, 990], [30, 900 + tw], 16) : curve([170, 880 - bob], [70, 950], [25, 860 + tw], 16);
    p.stroke(t, 24, INK); p.stroke(t, 13, RAT.pink);
  } else {
    const sx = up ? 190 : 122, sy = up ? 945 : 868 - bob;
    p.poly(ellPts(sx - 16, sy, 26, 16), RAT.pink, 8);
    p.stroke([[sx - 30, sy - 12], [sx - 4, sy + 12]], 9, "#f4f1ea"); p.stroke([[sx - 30, sy + 12], [sx - 4, sy - 12]], 9, "#f4f1ea");
  }
  // feet (far pair first)
  const feet = (far: boolean) => {
    const col = far ? RAT.pinkS : RAT.pink;
    const xs = up ? [250, 330] : [210, 420];
    xs.forEach((x0, i) => {
      let x = x0 + (far ? -18 : 0), y = 975;
      if (run) { const c = (phase + (i ? 0.5 : 0) + (far ? 0.25 : 0)) % 1; x += 50 * Math.cos(two * c); y -= 26 * Math.max(0, Math.sin(two * c)); }
      p.ell(x + 14, y - 10, 26, 12, col, 7);
    });
  };
  feet(true);
  // body
  const B = up ? ellPts(290, 790 - bob, 125, 175) : ellPts(320, 860 - bob, 190, 108, 0, 360, run ? -4 : 0);
  p.shadedFill(B, fur, furS, light, up ? 175 : 190, 0.4);
  p.clip(B, () => p.ell(up ? 330 : 340, up ? 830 - bob : 930 - bob, up ? 80 : 150, up ? 130 : 50, RAT.belly, 0));
  p.inkRing(B, 12, thickAngle(light));
  feet(false);
  if (up) for (const s2 of [0, 1]) { const x = 360 + 30 * s2, y = 700 - bob; p.stroke([[x - 40, y - 20], [x, y]], 18, INK); p.ell(x + 4, y, 16, 12, RAT.pink, 6); }
  // head: teardrop toward the nose
  const hx = up ? 330 : 500, hy = up ? 590 - bob : 800 - bob + (mode === "eat" ? 70 : 0);
  const Hd: P2[] = [];
  for (let i = 0; i < 48; i++) { const a = (i / 48) * two, r = 1 + 0.55 * Math.max(0, Math.cos(a)) ** 3; Hd.push([hx + 70 * r * Math.cos(a) + 20, hy + 58 * Math.sin(a) * (1 - 0.25 * Math.max(0, Math.cos(a)))]); }
  // ears
  for (const [ex, ey, col] of [[hx - 20, hy - 58, RAT.pinkS], [hx + 8, hy - 62, RAT.pink]] as const) { p.ell(ex, ey, 40, 44, fur, 10); p.ell(ex + 2, ey + 4, 24, 28, col, 0); }
  p.shadedFill(Hd, fur, furS, light, 70, 0.4); p.inkRing(Hd, 10, thickAngle(light));
  const nx = hx + 128, ny = hy + 4;
  p.ell(nx, ny, 15, 13, RAT.pinkS, 6);
  for (const k of [-1, 0, 1]) { p.stroke([[nx - 22, ny + 6], [nx + 36, ny + 6 + 18 * k]], 3.5); }
  p.stroke(curve([nx - 28, ny + 26], [nx - 18, ny + 34], [nx - 4, ny + 24]), 6);
  if (eye === "smug") p.poly([[nx - 14, ny + 26], [nx - 4, ny + 36], [nx - 22, ny + 36]], "#f6f1e4", 4); // buck teeth
  const ex = hx + 50, ey = hy - 12;
  if (eye === "shock") { p.ell(ex, ey, 22, 24, "#ffffff", 6); p.dot(ex + 6, ey, 8); }
  else if (eye === "happy") p.arc(ex, ey + 4, 14, 10, 200, 340, 7);
  else if (eye === "blink") p.stroke([[ex - 13, ey], [ex + 13, ey]], 7);
  else if (eye === "x") { p.stroke([[ex - 10, ey - 10], [ex + 10, ey + 10]], 7); p.stroke([[ex - 10, ey + 10], [ex + 10, ey - 10]], 7); }
  else if (eye === "smug") { p.ell(ex, ey, 15, 13, INK, 0, 0, 180); p.stroke([[ex - 18, ey], [ex + 18, ey]], 7); }
  else { p.ell(ex, ey, 16, 16, "#ffffff", 6); p.dot(ex + 5, ey + 1, 8); }
  if (sick) { p.ell(ex - 4, ey + 30, 20, 8, "#9bbf6a", 0); }
  if (coin) { const cx2 = up ? 395 : nx - 10, cy2 = up ? 690 - bob : ny + 46; p.ell(cx2, cy2, 30, 30, "#e8c45a", 7); p.ell(cx2, cy2, 16, 16, "#f6dc80", 0); }
};
/** a cobra rising out of a wicker basket, swaying; 600 x 1000 design space (basket base on 975) */
export const cobraFx = (p: Pen, sway: number, rise: number, eye: "smug" | "dot" = "dot") => {
  const top = 975 - 160 - 560 * rise;
  const sx = 300 + 40 * sway;
  const body = curve([300, 860], [300 - 90 * sway, (860 + top) / 2 + 40], [sx, top + 120], 22);
  p.stroke(body, 86, INK); p.stroke(body, 66, "#5f8a3e"); p.stroke(body.map(([x, y]) => [x + 10, y] as P2), 26, "#d9c27a");
  // hood
  const hood: P2[] = [];
  for (let i = 0; i <= 40; i++) { const a = (i / 40) * Math.PI * 2; hood.push([sx + 120 * Math.sin(a) * (0.75 + 0.25 * Math.cos(a)), top + 120 - 150 * Math.cos(a) * 0.9]); }
  p.shadedFill(hood, "#6f9a48", "#4c7030", -2, 120, 0.4); p.inkRing(hood, 12, thickAngle(-2));
  p.ell(sx, top + 140, 46, 70, "#e6d08a", 0);
  for (const s2 of [-1, 1]) p.ell(sx + s2 * 60, top + 80, 16, 22, "#2e3a24", 0);
  // head
  const hy = top - 20;
  p.ell(sx, hy, 70, 52, "#6f9a48", 10);
  for (const s2 of [-1, 1]) { if (eye === "smug") { p.ell(sx + s2 * 26, hy - 6, 14, 12, INK, 0, 0, 180); p.stroke([[sx + s2 * 26 - 16, hy - 6], [sx + s2 * 26 + 16, hy - 6]], 6); } else { p.ell(sx + s2 * 26, hy - 6, 15, 16, "#ffd84a", 5); p.ell(sx + s2 * 26, hy - 6, 4, 12, INK, 0); } }
  const tf = Math.sin(sway * 9) > 0;
  if (tf) { p.stroke([[sx, hy + 46], [sx, hy + 90]], 6, "#c0353a"); p.stroke([[sx, hy + 90], [sx - 10, hy + 104]], 5, "#c0353a"); p.stroke([[sx, hy + 90], [sx + 10, hy + 104]], 5, "#c0353a"); }
  // basket
  const bk: P2[] = [[150, 800], [450, 800], [420, 975], [180, 975]];
  p.shadedFill(bk, "#c99a52", "#8f6a36", -2, 200, 0.3);
  p.clip(bk, () => { for (let y = 815; y < 975; y += 26) p.stroke([[140, y], [460, y]], 6, "#9a7240"); for (let x = 160; x < 450; x += 34) p.stroke([[x, 800], [x + 4, 975]], 4, "#b68848"); });
  p.poly(bk, null, 12);
  p.ell(300, 800, 156, 30, "#b68848", 10);
  p.ell(300, 800, 120, 18, "#3a2a1e", 0);
};
/** a rat tail lying loose (pile of tails), on a 300 x 120 canvas */
export const fxTail = (p: Pen, k: number) => {
  const t = curve([20, 60 + 20 * Math.sin(k)], [150, 20 + 40 * Math.cos(k * 1.7)], [280, 70 + 20 * Math.sin(k * 2.3)], 14);
  p.stroke(t, 26, INK); p.stroke(t, 15, RAT.pink); p.ell(18, 60 + 20 * Math.sin(k), 14, 14, "#8a8494", 6);
};
/** a pile of tails heaped up (for the desk / baskets), 600 x 400 canvas */
export const fxTailPile = (p: Pen, seed: number, n = 40) => {
  let s = seed;
  const r = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
  for (let i = 0; i < n; i++) {
    const cx = 300 + (r() - 0.5) * 520 * (1 - i / n * 0.6), cy = 360 - 260 * (i / n) * (0.6 + 0.4 * r()), a = r() * 6.28, L = 90 + 60 * r();
    const t = curve([cx - L * Math.cos(a), cy - 0.4 * L * Math.sin(a)], [cx + 30 * (r() - 0.5), cy - 30 * r()], [cx + L * Math.cos(a), cy + 0.4 * L * Math.sin(a)], 10);
    p.stroke(t, 22, INK); p.stroke(t, 12, i % 3 ? RAT.pink : RAT.pinkS);
  }
};
/** green plague miasma blob (soft), 300 x 300 */
export const fxGerm = (p: Pen, t: number) => {
  p.ell(150, 150, 60 + 10 * Math.sin(t * 6), 56, "#8fc25a", 8);
  for (let k = 0; k < 6; k++) { const a = (k / 6) * 6.28 + t; p.stroke([[150 + 60 * Math.cos(a), 150 + 56 * Math.sin(a)], [150 + 92 * Math.cos(a), 150 + 88 * Math.sin(a)]], 10, INK); p.dot(150 + 96 * Math.cos(a), 150 + 92 * Math.sin(a), 13, "#8fc25a"); }
  p.ell(128, 136, 12, 14, "#ffffff", 4); p.ell(172, 136, 12, 14, "#ffffff", 4); p.dot(132, 140, 6); p.dot(176, 140, 6);
  p.arc(150, 168, 24, 14, 20, 160, 7);
};

// ---------------- acoustic-kitty additions ----------------
const CAT = { fur: "#ec9a4e", furS: "#b5622c", cream: "#fbe6c6", creamS: "#d9b98f", stripe: "#c26a2c", pink: "#f2a3ab", nose: "#d46d7c", iris: "#a8c94a" };
export type CatOpts = {
  phase?: number; mode?: "sit" | "walk" | "eat" | "lie" | "lick" | "back"; eye?: "dot" | "smug" | "shock" | "happy" | "blink" | "stare";
  mic?: boolean; tx?: boolean; wire?: boolean; shades?: boolean; light?: number; led?: boolean; ears?: number; bandage?: boolean;
};
const catEye = (p: Pen, kind: string, x: number, y: number, s: number, lid: string) => {
  if (kind === "happy") { p.arc(x, y + 4 * s, 15 * s, 11 * s, 200, 340, 7 * s); return; }
  if (kind === "blink") { p.arc(x, y + 2 * s, 15 * s, 6 * s, 20, 160, 6.5 * s); return; }
  const big = kind === "shock" ? 1.25 : 1;
  const E = ellPts(x, y, 19 * s * big, 25 * s * big);
  p.poly(E, "#ffffff", 0);
  if (kind === "shock") { p.dot(x + 4 * s, y, 6 * s); }
  else {
    p.clip(E, () => { p.ell(x + 5 * s, y + 2 * s, 15 * s, 21 * s, CAT.iris, 0); p.ell(x + 6 * s, y + 2 * s, kind === "stare" ? 3 * s : 6.5 * s, 17 * s, INK, 0); p.dot(x + 1 * s, y - 8 * s, 4.5 * s, "#ffffff"); });
  }
  if (kind === "smug") { p.clip(E, () => p.poly([[x - 30 * s, y - 40 * s], [x + 30 * s, y - 40 * s], [x + 30 * s, y - 1 * s], [x - 30 * s, y + 3 * s]], lid, 0)); p.stroke([[x - 21 * s, y + 3 * s], [x + 21 * s, y - 1 * s]], 6 * s); }
  p.poly(E, null, 5.5 * s);
};
const catHead = (p: Pen, hx: number, hy: number, o: CatOpts, light: number, tongue = false) => {
  const { eye = "dot", mic = false, tx = false, shades = false, ears = 0, led = false, bandage = false } = o;
  const th = thickAngle(light);
  // ears (back ear first); `ears` > 0 perks them up/forward
  const e = ears * 10;
  for (const [pts, inner] of [
    [[[hx - 62, hy - 48], [hx - 44 - e, hy - 132 - e], [hx - 2, hy - 74]], "#d98a94"],
    [[[hx + 4, hy - 76], [hx + 48 + e, hy - 138 - e], [hx + 74, hy - 56]], CAT.pink],
  ] as [P2[], string][]) {
    p.shadedFill(pts, CAT.fur, CAT.furS, light, 60, 0.4); p.poly(pts, null, 9);
    const c: P2 = [(pts[0][0] + pts[1][0] + pts[2][0]) / 3, (pts[0][1] + pts[1][1] + pts[2][1]) / 3 + 6];
    p.poly(pts.map(([x, y]) => [c[0] + (x - c[0]) * 0.55, c[1] + (y - c[1]) * 0.55] as P2), inner, 0);
  }
  if (mic) { p.ell(hx + 40, hy - 70, 13, 11, "#5a5f6a", 5); p.dot(hx + 40, hy - 72, 4.5, "#ff5a4a"); }
  // head: round with cheek fluff
  const H: P2[] = [];
  for (let i = 0; i < 60; i++) { const a = (i / 60) * Math.PI * 2, fl = Math.sin(a) > 0.3 && Math.abs(Math.cos(a)) > 0.55 ? 1 + 0.07 * Math.abs(Math.sin(i * 1.7)) : 1; H.push([hx + 100 * Math.cos(a) * fl, hy + 84 * Math.sin(a) * fl]); }
  p.shadedFill(H, CAT.fur, CAT.furS, light, 100, 0.4);
  p.clip(H, () => {
    for (const k of [-1, 0, 1]) p.stroke([[hx + 18 + 16 * k, hy - 84], [hx + 22 + 12 * k, hy - 52 + 4 * Math.abs(k)]], 9, CAT.stripe);
    p.ell(hx + 58, hy + 36, 52, 36, CAT.cream, 0);
    p.stroke([[hx - 98, hy + 6], [hx - 70, hy + 2]], 8, CAT.stripe); p.stroke([[hx - 96, hy + 26], [hx - 70, hy + 24]], 8, CAT.stripe);
  });
  p.inkRing(H, 10, th);
  if (tx) { const r = rrect(hx - 108, hy + 30, hx - 64, hy + 62, 6); p.poly(r, "#3a3d46", 5); p.dot(hx - 76, hy + 40, 5, led ? "#ff4a3a" : "#7a2a24"); p.stroke([[hx - 100, hy + 54], [hx - 80, hy + 54]], 3, "#9aa0aa"); }
  if (bandage) { p.band([[hx - 70, hy - 70], [hx - 10, hy - 88]], "#f4f1ea", 16, 4); }
  // eyes (far eye smaller), nose, mouth, whiskers
  if (shades) {
    p.poly([[hx - 4, hy - 34], [hx + 92, hy - 40], [hx + 88, hy - 4], [hx + 52, hy + 2], [hx + 42, hy - 14], [hx + 30, hy + 2], [hx, hy - 4]], "#14141a", 5);
    p.stroke([[hx + 50, hy - 30], [hx + 74, hy - 32]], 4, "#5a5f6a");
    p.stroke([[hx - 4, hy - 30], [hx - 60, hy - 36]], 6);
  } else {
    catEye(p, eye, hx + 6, hy - 14, 0.82, CAT.fur);
    catEye(p, eye, hx + 62, hy - 16, 1, CAT.fur);
  }
  const nx = hx + 92, ny = hy + 16;
  p.poly([[nx - 12, ny - 6], [nx + 8, ny - 7], [nx - 2, ny + 6]], CAT.nose, 4);
  p.stroke(curve([nx - 2, ny + 6], [nx - 6, ny + 20], [nx - 20, ny + 20]), 5); p.stroke(curve([nx - 2, ny + 6], [nx + 2, ny + 20], [nx + 12, ny + 18]), 5);
  if (tongue) p.ell(nx - 3, ny + 28, 10, 12, CAT.pink, 4);
  if (eye === "shock") p.ell(nx - 4, ny + 30, 11, 13, "#5a1e28", 4);
  for (const k of [-1, 0, 1]) p.stroke([[nx - 18, ny + 14 + 4 * k], [nx + 58, ny + 6 + 16 * k]], 3);
  for (const k of [0, 1]) p.stroke([[hx + 16, hy + 28 + 8 * k], [hx - 30, hy + 30 + 16 * k]], 2.5);
};
/** a cartoon cat facing screen-right, in the 600 x 1000 person design space (feet on y = 975); place at scale ~0.45 */
export const catSide = (p: Pen, o: CatOpts = {}) => {
  const { phase = 0, mode = "sit", wire = false, light = DEF_LIGHT } = o;
  const two = Math.PI * 2, th = thickAngle(light);
  const leg = (a: P2, b: P2, w: number, col: string) => { p.stroke([a, b], w + 16, INK); p.stroke([a, b], w, col); p.ell(b[0] + 8, b[1] - 6, w * 0.75, w * 0.42, col, 7); };
  const tailStroke = (pts: P2[]) => { p.stroke(pts, 46, INK); p.stroke(pts, 32, CAT.fur); const n = pts.length; for (let i = 3; i < n - 1; i += 3) { const [x, y] = pts[i]; p.dot(x, y, 9, CAT.stripe); } p.stroke(pts.slice(n - 3), 32, CAT.stripe); };
  const wireAlong = (pts: P2[]) => { if (wire) { p.stroke(pts, 4, "#2a2a30"); p.dot(pts[pts.length - 1][0], pts[pts.length - 1][1], 5, "#2a2a30"); } };
  if (mode === "sit" || mode === "lick" || mode === "back") {
    const sw = 18 * Math.sin(two * phase);
    const back = mode === "back";
    const tail = back ? curve([150, 900], [40, 760], [90 + sw, 600], 14) : curve([150, 940], [200, 1000 + 0.3 * sw], [420 + sw, 968], 14);
    if (back) tailStroke(tail);
    leg([360, 800], [360, 962], 40, CAT.furS);
    const Hn = ellPts(220, 860, 130, 118);
    p.shadedFill(Hn, CAT.fur, CAT.furS, light, 130, 0.4);
    p.clip(Hn, () => { for (let k = 0; k < 3; k++) p.stroke(curve([150 + 40 * k, 760], [130 + 40 * k, 820], [150 + 40 * k, 880]), 12, CAT.stripe); });
    p.inkRing(Hn, 12, th);
    const T = ellPts(320, 760, 92, 150, 0, 360, -14);
    p.shadedFill(T, CAT.fur, CAT.furS, light, 150, 0.4);
    p.clip(T, () => p.ell(370, 760, 60, 120, CAT.cream, 0));
    p.inkRing(T, 12, th);
    if (!back) tailStroke(tail);
    if (mode === "lick") { const L = curve([400, 800], [460, 700], [440, 640], 8); p.stroke(L, 56, INK); p.stroke(L, 40, CAT.fur); p.ell(442, 630, 30, 24, CAT.cream, 7); }
    else leg([400, 800], [405, 962], 40, CAT.fur);
    wireAlong(curve([250, 640], [140, 720], [130, 860], 10));
    catHead(p, 360, 560, o, light, mode === "lick");
    return;
  }
  if (mode === "lie") {
    const sw = 10 * Math.sin(two * phase * 0.5), br = 6 * Math.sin(two * phase);
    tailStroke(curve([90, 930], [80, 1000], [330 + sw, 985], 14));
    const B = ellPts(260, 895 - br * 0.3, 185, 78 + br);
    p.shadedFill(B, CAT.fur, CAT.furS, light, 185, 0.4);
    p.clip(B, () => { for (let k = 0; k < 4; k++) p.stroke(curve([150 + 50 * k, 820], [140 + 50 * k, 870], [160 + 50 * k, 910]), 12, CAT.stripe); });
    p.inkRing(B, 12, th);
    p.ell(470, 955, 44, 22, CAT.fur, 8); p.ell(420, 960, 40, 20, CAT.fur, 8);
    wireAlong(curve([380, 830], [250, 815], [100, 860], 10));
    catHead(p, 440, 860, o, light);
    return;
  }
  // walk / eat: body horizontal, four legs
  const walk = mode === "walk", bob = walk ? 6 * Math.abs(Math.sin(two * phase)) : 0;
  const tw = 20 * Math.sin(two * phase + 0.7);
  const tail = curve([110, 760 - bob], [20, 640], [70 + tw, 520], 14);
  tailStroke(tail);
  const legs = (far: boolean) => {
    const col = far ? CAT.furS : CAT.fur;
    [[180, 0], [380, 0.5]].forEach(([x0, ph]) => {
      let x = x0 + (far ? -26 : 0), y = 962;
      if (walk) { const c = (phase + ph + (far ? 0.5 : 0)) % 1; x += 40 * Math.cos(two * c); y -= 22 * Math.max(0, Math.sin(two * c)); }
      leg([x0 + (far ? -20 : 0), 820 - bob], [x, y], 38, col);
    });
  };
  legs(true);
  const B = ellPts(260, 800 - bob, 180, 84, 0, 360, mode === "eat" ? 6 : 0);
  p.shadedFill(B, CAT.fur, CAT.furS, light, 180, 0.4);
  p.clip(B, () => { for (let k = 0; k < 4; k++) p.stroke(curve([160 + 50 * k, 720], [150 + 50 * k, 770], [170 + 50 * k, 810]), 12, CAT.stripe); p.ell(300, 860, 140, 30, CAT.cream, 0); });
  p.inkRing(B, 12, th);
  legs(false);
  wireAlong(curve([400, 735 - bob], [250, 715], [110, 760], 10).concat(tail.slice(1)));
  const eat = mode === "eat" ? 0.5 + 0.5 * Math.sin(two * phase * 2) : 0;
  catHead(p, mode === "eat" ? 455 : 440, mode === "eat" ? 860 + 14 * eat : 680 - bob, o, light);
};
/** idea light bulb, 300 x 400 */
export const fxBulb = (p: Pen, k: number) => {
  for (let i = 0; i < 9; i++) { const a = -Math.PI + (i / 8) * Math.PI, r0 = 130, r1 = 165 + 15 * k; p.stroke([[150 + r0 * Math.cos(a), 160 + r0 * Math.sin(a)], [150 + r1 * Math.cos(a), 160 + r1 * Math.sin(a)]], 9, "#f6c83a"); }
  p.ell(150, 160, 100, 104, "#fff1a0", 9);
  p.poly(rrect(105, 250, 195, 330, 10), "#9aa0aa", 8);
  for (const y of [272, 300]) p.stroke([[108, y], [192, y]], 6);
  p.stroke(curve([120, 210], [150, 150], [180, 210]), 6, "#e0a020");
  p.ell(115, 120, 18, 26, "#ffffff", 0);
};
/** big question mark, 300 x 400 */
export const fxQuestion = (p: Pen) => {
  const q = curve([80, 130], [150, 10], [220, 120], 12).concat(curve([220, 120], [230, 190], [150, 230], 8)).concat([[150, 280]]);
  p.stroke(q, 70, INK); p.stroke(q, 46, "#ffffff"); p.ell(150, 350, 34, 34, "#ffffff", 12);
};
/** sleepy Z, 200 x 200 */
export const fxZ = (p: Pen) => { const z: P2[] = [[40, 50], [160, 50], [40, 160], [160, 160]]; p.stroke(z, 46, INK); p.stroke(z, 26, "#ffffff"); };
/** heart, 300 x 300 */
export const fxHeartFx = (p: Pen) => {
  const H: P2[] = []; for (let i = 0; i < 60; i++) { const t = (i / 60) * Math.PI * 2; H.push([150 + 110 * Math.sin(t) ** 3, 140 - (90 * Math.cos(t) - 35 * Math.cos(2 * t) - 14 * Math.cos(3 * t) - 6 * Math.cos(4 * t))]); }
  p.poly(H, "#e8505a", 12); p.ell(105, 100, 18, 24, "#ff9aa0", 0);
};
/** radio waves from a point at the left, 300 x 300; k 0..1 animates outward */
export const fxWaves = (p: Pen, k: number) => {
  for (let i = 0; i < 3; i++) { const r = 60 + 80 * ((i / 3 + k) % 1); p.arc(40, 150, r, r, -50, 50, 12, `rgba(120,230,255,${(1 - ((i / 3 + k) % 1)).toFixed(2)})`); }
};
/** speed lines (motion streaks), 800 x 300 */
export const fxSpeed = (p: Pen) => { for (let i = 0; i < 9; i++) { const y = 30 + 30 * i, x0 = 40 + 120 * rnd(i, 3), L = 200 + 400 * rnd(i, 4); p.stroke([[x0, y], [x0 + L, y]], 8 + 6 * rnd(i, 5), "rgba(255,255,255,0.85)"); } };
/** food bowl with a fish, 400 x 260 */
export const fxBowl = (p: Pen, eaten: number) => {
  if (eaten < 1) { const fx = 200, fy = 110; p.poly([[fx - 90, fy], ...curve([fx - 90, fy], [fx, fy - 60], [fx + 70, fy]), ...curve([fx + 70, fy], [fx, fy + 60], [fx - 90, fy])], "#8fb6d8", 7); p.poly([[fx + 60, fy], [fx + 110, fy - 40], [fx + 110, fy + 40]], "#8fb6d8", 7); p.dot(fx - 55, fy - 8, 8); }
  p.poly([[40, 120], [360, 120], [320, 230], [80, 230]], "#3f7ab8", 10);
  p.ell(200, 120, 160, 22, "#2f5f94", 8);
};
/** coffee mug, 200 x 200 */
export const fxMug = (p: Pen) => {
  p.arc(150, 110, 34, 36, -80, 80, 16, INK); p.arc(150, 110, 34, 36, -80, 80, 9, "#f4f1ea");
  p.poly(rrect(40, 40, 150, 180, 14), "#f4f1ea", 9); p.ell(95, 46, 54, 12, "#5a3a26", 6);
  p.dot(70, 100, 14, "#c0353a"); p.dot(110, 120, 10, "#c0353a");
};
/** the memo, 600 x 800 paper */
export const fxMemo = (p: Pen, stamp: number, big = true) => {
  const g = p.g;
  p.poly([[30, 30], [570, 22], [578, 780], [26, 772]], "#f6f0dc", 10);
  g.fillStyle = "#2a2630"; g.textAlign = "center"; g.font = "bold 44px 'Courier New', monospace"; g.fillText("MEMORANDUM", 300, 110);
  g.font = "bold 22px 'Courier New', monospace"; g.fillText("SUBJECT: VIEWS ON TRAINED CATS", 300, 165);
  g.fillText("MARCH 1967", 300, 200);
  for (let i = 0; i < 6; i++) { const w = 380 - 60 * rnd(i, 2); p.stroke([[300 - w / 2, 250 + 34 * i], [300 + w / 2, 250 + 34 * i]], 10, "#bdb6a2"); }
  if (big) { g.font = "bold 56px 'Courier New', monospace"; g.fillStyle = "#14121a"; g.fillText("WOULD NOT BE", 300, 540); g.fillText("PRACTICAL.", 300, 610); }
  if (stamp > 0) {
    g.save(); g.translate(330, 690); g.rotate(-0.18); const s = 1 + 0.6 * (1 - stamp); g.scale(s, s);
    g.globalAlpha = 0.85; g.strokeStyle = "#c0262c"; g.lineWidth = 9; g.strokeRect(-170, -48, 340, 96);
    g.fillStyle = "#c0262c"; g.font = "bold 64px 'Courier New', monospace"; g.fillText("CANCELLED", 0, 22); g.restore();
  }
};
/** money stack (strapped bills), 300 x 200 */
export const fxCash = (p: Pen) => {
  for (let k = 0; k < 5; k++) { const y = 150 - 22 * k; p.poly([[40, y], [260, y], [270, y + 26], [30, y + 26]], k % 2 ? "#8fbf7a" : "#7aab66", 6); }
  p.poly([[135, 50], [165, 50], [175, 176], [125, 176]], "#f4f1ea", 5);
  p.g.fillStyle = "#2f5a2a"; p.g.font = "bold 40px sans-serif"; p.g.textAlign = "center"; p.g.fillText("$", 150, 132);
};

// ---------------- headless-mike additions ----------------
const HEN = { body: "#f6efe0", bodyS: "#d8ccb4", wing: "#efe4cc", tail: "#3a3a44", tailS: "#5a5a6a", leg: "#f2a23a", comb: "#d8323a", beak: "#f2b23a", stump: "#f2b6a8" };
export type HenOpts = {
  phase?: number; mode?: "stand" | "walk" | "peck" | "preen" | "crow" | "sit" | "choke" | "lie";
  head?: boolean; eye?: "dot" | "shock" | "blink"; hat?: boolean; bandage?: boolean; light?: number; col?: string; colS?: string; gurgle?: number;
};
/** a cartoon chicken facing screen-right in the 600 x 1000 design space (feet on y = 975); place at scale ~0.42.
 *  head:false = Mike (a tidy neck stump, optional bandage and tiny top hat) */
export const henSide = (p: Pen, o: HenOpts = {}) => {
  const { phase = 0, mode = "stand", head = false, eye = "dot", hat = false, bandage = false, light = DEF_LIGHT, gurgle = 0 } = o;
  const body = o.col ?? HEN.body, bodyS = o.colS ?? HEN.bodyS;
  const two = Math.PI * 2, th = thickAngle(light);
  const walk = mode === "walk", sit = mode === "sit" || mode === "lie";
  const shake = mode === "choke" ? 8 * Math.sin(two * phase * 6) : 0;
  const bob = walk ? 10 * Math.abs(Math.sin(two * phase)) : 0;
  const by = sit ? 860 : 760 - bob, bx = 270 + shake;
  // legs + toes
  if (!sit) for (const [ph, col] of [[0.5, "#d8862a"], [0, HEN.leg]] as [number, string][]) {
    let fx = bx + (ph ? -30 : 20), fy = 972;
    if (walk) { const c = (phase + ph) % 1; fx += 50 * Math.cos(two * c); fy -= 30 * Math.max(0, Math.sin(two * c)); }
    const hip: P2 = [bx + (ph ? -10 : 20), by + 90];
    p.stroke([hip, [fx, fy - 8]], 22, INK); p.stroke([hip, [fx, fy - 8]], 12, col);
    for (const a of [-0.4, 0.15, 0.7]) p.stroke([[fx, fy - 6], [fx + 40 * Math.cos(a), fy - 4 + 14 * Math.sin(a)]], 9, INK);
    p.stroke([[fx, fy - 6], [fx - 22, fy - 2]], 9, INK);
  }
  // tail feathers (behind)
  for (let k = 0; k < 4; k++) {
    const a = -2.2 + 0.28 * k + 0.05 * Math.sin(two * phase + k), L = 150 + 25 * (k % 2);
    const t = curve([bx - 110, by - 20], [bx - 110 + 0.6 * L * Math.cos(a) - 30, by - 20 + 0.6 * L * Math.sin(a)], [bx - 110 + L * Math.cos(a), by - 20 + L * Math.sin(a) + 30], 10);
    p.stroke(t, 46, INK); p.stroke(t, 32, k % 2 ? HEN.tail : HEN.tailS);
  }
  // body
  const B: P2[] = [];
  for (let i = 0; i < 64; i++) { const a = (i / 64) * two, r = 1 + (Math.sin(a) > 0.5 ? 0.04 * Math.sin(i * 3.1) : 0); B.push([bx + 165 * Math.cos(a) * r * (Math.cos(a) > 0 ? 1.0 : 0.95), by + 125 * Math.sin(a) * r * (Math.sin(a) < 0 ? 0.92 : 1)]); }
  const puff = mode === "crow" ? 1.08 : 1;
  const Bp = B.map(([x, y]) => [bx + (x - bx) * puff, by + (y - by) * puff] as P2);
  p.shadedFill(Bp, body, bodyS, light, 165, 0.4); p.inkRing(Bp, 12, th);
  // neck + head/stump
  let nx = bx + 140, ny = by - 165, nk: P2 = [bx + 128, by - 105];
  if (mode === "peck") { const d = 0.5 + 0.5 * Math.sin(two * phase * 2); nx = bx + 230; ny = by + 60 * d - 20; nk = [bx + 190, by - 40]; }
  if (mode === "preen") { nx = bx + 20; ny = by - 120; nk = [bx + 110, by - 150]; }
  if (mode === "crow") { nx = bx + 160; ny = by - 215; nk = [bx + 150, by - 140]; }
  if (sit) { nx = bx + 135; ny = by - 150; }
  if (mode === "lie") { nx = bx + 210; ny = by - 40; nk = [bx + 190, by - 60]; }
  nx += shake * 1.5;
  const neck = curve([bx + 95, by - 50], nk, [nx, ny], 12);
  p.stroke(neck, 124, INK); p.stroke(neck, 102, body);
  p.stroke(neck.map(([x, y]) => [x - 14, y + 6] as P2), 26, bodyS);
  for (let k = 0; k < 6; k++) { const [x, y] = neck[2 + k]; p.stroke([[x - 30, y + 6], [x - 16, y + 18]], 4, bodyS); }
  // wing (over body)
  const wl = mode === "crow" ? -0.5 : mode === "preen" ? -0.2 : 0;
  const W: P2[] = [[bx - 70, by - 40], ...curve([bx - 70, by - 40], [bx + 30, by - 70 + 60 * wl], [bx + 100, by - 10 + 80 * wl], 8), ...curve([bx + 100, by - 10 + 80 * wl], [bx + 10, by + 70], [bx - 90, by + 30], 8)];
  p.shadedFill(W, HEN.wing, bodyS, light, 100, 0.4); p.poly(W, null, 8);
  for (let k = 0; k < 3; k++) p.stroke(curve([bx - 50 + 40 * k, by + 10], [bx - 20 + 40 * k, by + 40], [bx + 10 + 40 * k, by + 30]), 5);
  const ang = Math.atan2(ny - nk[1], nx - nk[0]);
  if (head) {
    const hx = nx + 20 * Math.cos(ang), hy = ny + 20 * Math.sin(ang);
    for (let k = 0; k < 3; k++) p.ell(hx - 30 + 26 * k, hy - 68 - 8 * Math.sin(k * 1.4), 22, 26, HEN.comb, 7);
    p.ell(hx, hy - 20, 62, 58, body, 10);
    p.poly([[hx + 50, hy - 34], [hx + 104, hy - 18], [hx + 50, hy - 2]], HEN.beak, 7);
    p.ell(hx + 42, hy + 20, 15, 24, HEN.comb, 6);
    if (eye === "shock") { p.ell(hx + 14, hy - 34, 17, 19, "#ffffff", 5); p.dot(hx + 17, hy - 34, 5); }
    else if (eye === "blink") p.stroke([[hx + 2, hy - 32], [hx + 26, hy - 32]], 6);
    else { p.ell(hx + 14, hy - 34, 13, 15, "#ffffff", 5); p.dot(hx + 18, hy - 33, 7); }
  } else {
    // the stump: a neat rounded neck end
    const sx = nx, sy = ny;
    const rot = (ang * 180) / Math.PI + 90, ca = Math.cos(ang + Math.PI / 2), sa = Math.sin(ang + Math.PI / 2);
    // feather ruff around a flat, neat neck end
    const ruff: P2[] = [];
    for (let i = 0; i <= 14; i++) { const u = i / 14 * 2 - 1, r = i % 2 ? 62 : 50, up = i % 2 ? 22 : 8; ruff.push([sx + u * r * ca + up * Math.cos(ang), sy + u * r * sa + up * Math.sin(ang)]); }
    p.poly([...ruff, [sx + 50 * ca - 20 * Math.cos(ang), sy + 50 * sa - 20 * Math.sin(ang)], [sx - 50 * ca - 20 * Math.cos(ang), sy - 50 * sa - 20 * Math.sin(ang)]], body, 7);
    p.ell(sx + 6 * Math.cos(ang), sy + 6 * Math.sin(ang), 46, 16, "#e6dac2", 6, 0, 360, rot);
    if (bandage) { p.band([[sx - 44 * Math.cos(ang + Math.PI / 2), sy - 44 * Math.sin(ang + Math.PI / 2)], [sx + 44 * Math.cos(ang + Math.PI / 2), sy + 44 * Math.sin(ang + Math.PI / 2)]], "#f4f1ea", 22, 5); p.stroke([[sx - 8, sy - 6], [sx + 8, sy + 6]], 3, "#c9b8a0"); p.stroke([[sx - 8, sy + 6], [sx + 8, sy - 6]], 3, "#c9b8a0"); }
    if (hat) {
      const hb = sy - 14;
      p.poly([[sx - 34, hb - 70], [sx + 34, hb - 70], [sx + 30, hb], [sx - 30, hb]], "#2e2a36", 7);
      p.band([[sx - 32, hb - 14], [sx + 32, hb - 14]], "#c0353a", 12, 3);
      p.ell(sx, hb, 54, 10, "#1d1b22", 6);
    }
    if (gurgle > 0) for (let k = 0; k < 4; k++) { const u = (gurgle + k / 4) % 1; p.ell(sx + 18 * Math.sin(k * 2.3) + 10, sy - 30 - 120 * u, 10 + 8 * u, 10 + 8 * u, "rgba(220,240,255,0.9)", 4); }
  }
};
/** burst of loose feathers, 400 x 400; t 0..1 */
export const fxFeathers = (p: Pen, t: number) => {
  for (let k = 0; k < 9; k++) {
    const a = (k / 9) * Math.PI * 2 + 0.4, r = 40 + 150 * t, x = 200 + r * Math.cos(a), y = 200 + r * Math.sin(a) + 80 * t * t;
    const rot = a + 3 * t + k;
    const L = 34, c = Math.cos(rot), s = Math.sin(rot);
    p.poly([[x - L * c, y - L * s], [x + 10 * s, y - 10 * c], [x + L * c, y + L * s], [x - 10 * s, y + 10 * c]], "#f6efe0", 5);
  }
};
/** cartoon brain with a tick, 400 x 300 */
export const fxBrain = (p: Pen, ok: boolean) => {
  p.ell(170, 150, 120, 90, "#f2a6b4", 10);
  for (let k = 0; k < 5; k++) p.stroke(curve([90 + 35 * k, 90], [110 + 35 * k, 150], [80 + 35 * k, 200]), 7, "#c9707e");
  p.stroke([[250, 210], [280, 270]], 30, INK); p.stroke([[250, 210], [280, 270]], 18, "#f2a6b4");
  if (ok) { p.stroke([[300, 110], [330, 150], [390, 60]], 30, INK); p.stroke([[300, 110], [330, 150], [390, 60]], 18, "#4ab84a"); }
};
/** dollar signs (for a promoter's eyes), 200 x 200 */
export const fxDollar = (p: Pen) => {
  p.ell(100, 100, 80, 80, "#4ab84a", 8);
  p.g.fillStyle = "#ffffff"; p.g.textAlign = "center"; p.g.font = "bold 120px sans-serif"; p.g.fillText("$", 100, 142);
};
/** an illustrated weekly magazine cover (generic), 600 x 800 */
export const fxMagazine = (p: Pen) => {
  const g = p.g;
  p.poly([[20, 20], [580, 20], [580, 780], [20, 780]], "#f6f0dc", 10);
  p.poly([[40, 40], [560, 40], [560, 150], [40, 150]], "#1f3f6a", 0);
  g.fillStyle = "#f6f0dc"; g.textAlign = "center"; g.font = "bold 70px Georgia, serif"; g.fillText("PICTURE WEEKLY", 300, 120);
  p.poly([[60, 180], [540, 180], [540, 620], [60, 620]], "#9cc6dc", 6);
  const save = p.g.getTransform(); g.translate(150, 230); g.scale(0.5, 0.5); henSide(p, { mode: "stand", hat: true }); g.setTransform(save);
  g.fillStyle = "#14121a"; g.font = "bold 50px Georgia, serif"; g.fillText("THE CHICKEN", 300, 690); g.fillText("WITH NO HEAD", 300, 745);
};
/** syringe lying down, 400 x 120 */
export const fxSyringe = (p: Pen) => {
  p.poly(rrect(60, 40, 280, 80, 10), "#e6f4f8", 6); p.poly(rrect(70, 48, 190, 72, 6), "#f2c0c8", 0);
  p.stroke([[280, 60], [370, 60]], 6); p.stroke([[20, 60], [60, 60]], 14); p.stroke([[20, 36], [20, 84]], 12);
};
/** candle, 200 x 400 */
export const fxCandle = (p: Pen, k: number) => {
  p.poly(rrect(70, 200, 130, 390, 8), "#f6efe0", 7);
  p.ell(100, 160 + 6 * Math.sin(k * 6.28), 22, 44, "#ffcf4a", 5); p.ell(100, 170, 9, 20, "#fff6c8", 0);
};
/** confetti pieces, 600 x 600, t 0..1 (falling) */
export const fxConfetti = (p: Pen, t: number) => {
  const cols = ["#e8505a", "#f6c83a", "#4ab84a", "#3f7ab8", "#c94ac9"];
  for (let k = 0; k < 40; k++) { const x = 600 * rnd(k, 1), y = (600 * rnd(k, 2) + 500 * t) % 600, a = rnd(k, 3) * 6 + 8 * t; p.poly([[x - 12 * Math.cos(a), y - 6 * Math.sin(a)], [x + 12 * Math.cos(a), y - 6 * Math.sin(a) + 4], [x + 12 * Math.cos(a), y + 6 * Math.sin(a) + 8], [x - 12 * Math.cos(a), y + 6 * Math.sin(a)]], cols[k % 5], 0); }
};
/** exclamation mark, 200 x 400 */
export const fxBang = (p: Pen) => { p.poly([[70, 30], [130, 30], [115, 270], [85, 270]], "#ffffff", 10); p.ell(100, 340, 30, 30, "#ffffff", 10); };
/** banner with text, 1000 x 240 */
export const fxBanner = (p: Pen, text: string, col = "#c0353a") => {
  p.poly([[20, 40], [980, 40], [940, 120], [980, 200], [20, 200], [60, 120]], col, 10);
  p.g.fillStyle = "#fff6d8"; p.g.textAlign = "center"; p.g.font = "bold 92px Georgia, serif"; p.g.fillText(text, 500, 152);
};

// ---------------- Sergeant Stubby ----------------
const DOG = { fur: "#7a5238", furS: "#4e3322", white: "#f7f0e6", whiteS: "#d8ccbc", ear: "#e7a2a8", nose: "#1e1a1c", iris: "#4a2c18", coat: "#d2ad72", coatS: "#9c7a46", trim: "#7a2a24", chev: "#e8c45a" };
export type DogOpts = {
  phase?: number; mode?: "sit" | "salute" | "walk" | "run" | "bark" | "bite" | "push" | "lie" | "beg";
  eye?: "dot" | "happy" | "blink" | "shock" | "smug" | "stern" | "proud"; ears?: number; light?: number;
  /** 0 none, 1 chamois coat, 2 + sergeant chevrons, 3 + medals */
  coat?: number; mask?: boolean; tongue?: boolean; wag?: number; scrap?: boolean;
};
const dogEye = (p: Pen, kind: string, x: number, y: number, s: number) => {
  if (kind === "happy" || kind === "proud") { p.arc(x, y + 4 * s, 15 * s, 11 * s, 200, 340, 7 * s); if (kind === "proud") p.stroke([[x - 16 * s, y - 20 * s], [x + 14 * s, y - 26 * s]], 6 * s); return; }
  if (kind === "blink") { p.arc(x, y + 2 * s, 15 * s, 6 * s, 20, 160, 6.5 * s); return; }
  const big = kind === "shock" ? 1.25 : 1, E = ellPts(x, y, 18 * s * big, 21 * s * big);
  p.poly(E, "#ffffff", 0);
  if (kind === "shock") p.dot(x + 3 * s, y, 5.5 * s);
  else p.clip(E, () => { p.ell(x + 5 * s, y + 2 * s, 13 * s, 15 * s, DOG.iris, 0); p.dot(x + 6 * s, y + 3 * s, 7 * s, INK); p.dot(x + 1 * s, y - 6 * s, 4.5 * s, "#ffffff"); });
  if (kind === "smug") { p.clip(E, () => p.poly([[x - 30 * s, y - 40 * s], [x + 30 * s, y - 40 * s], [x + 30 * s, y - 2 * s], [x - 30 * s, y + 2 * s]], DOG.fur, 0)); p.stroke([[x - 20 * s, y + 2 * s], [x + 20 * s, y - 2 * s]], 6 * s); }
  p.poly(E, null, 5.5 * s);
  if (kind === "stern") p.stroke([[x - 20 * s, y - 34 * s], [x + 20 * s, y - 20 * s]], 9 * s);
};
/** dog head facing screen-right, skull centred on (hx, hy) (dog design units: skull ~200 wide) */
export const dogHead = (p: Pen, hx: number, hy: number, o: DogOpts, light: number, mouthK: "smile" | "bark" | "bite" | "pant" = "smile") => {
  const { eye = "dot", ears = 0, mask = false, scrap = false } = o;
  const th = thickAngle(light), e = ears * 14;
  // bat ears (far ear first); ears > 0 perks them up, < 0 folds them back
  for (const [pts, inner, col] of [
    [curve([hx - 70, hy - 40], [hx - 92 - e * 0.6, hy - 148 - e], [hx - 16, hy - 76], 12), "#c98890", DOG.furS],
    [curve([hx - 8, hy - 78], [hx + 26 + e * 0.4, hy - 172 - e], [hx + 62, hy - 58], 12), DOG.ear, DOG.fur],
  ] as [P2[], string, string][]) {
    p.shadedFill(pts, col, DOG.furS, light, 60, 0.4); p.poly(pts, null, 9);
    const c: P2 = [(pts[0][0] + pts[6][0] + pts[12][0]) / 3, (pts[0][1] + pts[6][1] + pts[12][1]) / 3 + 8];
    p.poly(pts.map(([x, y]) => [c[0] + (x - c[0]) * 0.55, c[1] + (y - c[1]) * 0.55] as P2), inner, 0);
  }
  const H = ellPts(hx, hy, 98, 86);
  p.shadedFill(H, DOG.fur, DOG.furS, light, 98, 0.4);
  p.clip(H, () => { p.band([[hx + 38, hy - 100], [hx + 52, hy + 20]], DOG.white, 30, 0); p.ell(hx + 70, hy + 60, 70, 40, DOG.white, 0); });
  p.inkRing(H, 10, th);
  // muzzle
  const Mz = ellPts(hx + 84, hy + 30, 56, 42);
  p.shadedFill(Mz, DOG.white, DOG.whiteS, light, 56, 0.4);
  p.inkRing(Mz, 9, th);
  if (mouthK === "bark" || mouthK === "pant") {
    const open = mouthK === "bark" ? 1 : 0.55, J: P2[] = [[hx + 136, hy + 44], [hx + 90, hy + 44 + 46 * open], [hx + 58, hy + 40]];
    p.poly([[hx + 140, hy + 36], ...curve(J[0], J[1], J[2], 8)], "#5a1e28", 7);
    p.ell(hx + 104, hy + 54 + 22 * open, 20, 14 * open + 6, "#e86e78", 4);
  } else if (mouthK === "bite") {
    p.stroke(curve([hx + 138, hy + 40], [hx + 100, hy + 52], [hx + 64, hy + 42]), 7);
    if (scrap) { p.poly([[hx + 120, hy + 34], [hx + 196, hy + 22], [hx + 206, hy + 74], [hx + 128, hy + 66]], "#5d6a7e", 7); p.stroke([[hx + 150, hy + 30], [hx + 160, hy + 68]], 3, "#3e4656"); }
    for (const x of [hx + 106, hx + 126]) p.poly([[x - 7, hy + 38], [x + 7, hy + 38], [x, hy + 52]], "#ffffff", 3);
  } else p.stroke(curve([hx + 132, hy + 38], [hx + 100, hy + 60], [hx + 66, hy + 46]), 6);
  // nose
  p.ell(hx + 132, hy + 12, 20, 15, DOG.nose, 0); p.ell(hx + 128, hy + 6, 6, 4, "#6a6670", 0);
  if (mask) {
    p.poly(rrect(hx + 64, hy - 6, hx + 150, hy + 74, 22), "#7d7f5a", 8);
    p.ell(hx + 150, hy + 34, 20, 26, "#4e523a", 6);
    for (const [x, y, r] of [[hx + 14, hy - 18, 26], [hx + 66, hy - 26, 30]] as [number, number, number][]) { p.ell(x, y, r, r, "#d6e8ec", 7); p.ell(x + 6, y - 7, r * 0.3, r * 0.3, "#ffffff", 0); }
    p.band([[hx - 80, hy - 40], [hx - 10, hy - 30]], "#5e6248", 12, 3);
    return;
  }
  dogEye(p, eye, hx + 12, hy - 18, 0.84);
  dogEye(p, eye, hx + 64, hy - 24, 1);
};
/** a cartoon Boston-terrier mutt facing screen-right, in the 600 x 1000 design space (feet on y = 975); place at
 *  scale ~0.42 (puppy ~0.3) */
export const dogSide = (p: Pen, o: DogOpts = {}) => {
  const { phase = 0, mode = "sit", light = DEF_LIGHT, coat = 0, wag = 0 } = o;
  const two = Math.PI * 2, th = thickAngle(light);
  const leg = (a: P2, b: P2, w: number, col: string, paw = DOG.white) => { p.stroke([a, b], w + 16, INK); p.stroke([a, b], w, col); p.ell(b[0] + 10, b[1] - 6, w * 0.8, w * 0.45, paw, 7); };
  const nub = (x: number, y: number, up = 1) => { const a = -0.9 * up + 0.35 * Math.sin(two * wag); const t: P2 = [x + 34 * Math.cos(Math.PI + a), y + 34 * Math.sin(Math.PI + a)]; p.stroke([[x, y], t], 46, INK); p.stroke([[x, y], t], 30, DOG.fur); };
  const chevrons = (cx: number, cy: number, s = 1) => { for (let k = 0; k < 3; k++) { const y = cy + k * 20 * s; p.stroke([[cx - 34 * s, y + 18 * s], [cx, y], [cx + 34 * s, y + 18 * s]], 22 * s, INK); p.stroke([[cx - 34 * s, y + 18 * s], [cx, y], [cx + 34 * s, y + 18 * s]], 12 * s, DOG.chev); } };
  const medals = (cx: number, cy: number) => { ["#c0353a", "#3f6fb5", "#3f9a5a"].forEach((c, k) => { const x = cx + k * 30; p.poly(rrect(x - 11, cy, x + 11, cy + 26, 3), c, 4); p.ell(x, cy + 42, 13, 13, "#e8c45a", 5); }); };
  // the coat is a blanket ON the body: clipped to the body silhouette so it never reads as a separate oval
  const coatOn = (C: P2[], cx: number, cy: number, body: P2[][]) => {
    if (!coat) return;
    for (const Bd of body) p.clip(Bd, () => p.clip(C, () => {
      p.shadedFill(C, DOG.coat, DOG.coatS, light, 120, 0.4);
      p.stroke(C.slice(Math.floor(C.length * 0.05), Math.floor(C.length * 0.5)), 16, DOG.trim);
      p.poly(C, null, 9);
    }));
    if (coat >= 2) chevrons(cx + 30, cy - 50, 1.0);
    if (coat >= 3) medals(cx - 96, cy - 20);
  };
  if (mode === "sit" || mode === "salute" || mode === "beg") {
    const sal = mode === "salute", beg = mode === "beg";
    nub(118, 930, 0.3);
    leg([350, 800], [352, 962], 40, DOG.furS);
    // ONE body silhouette (back slope -> rump -> belly -> chest), not two stacked ovals
    const lift = beg ? 30 : 0;
    const Bd: P2[] = [
      ...curve([318, 610 - lift], [170, 660 - lift], [104, 890], 16),
      ...curve([104, 890], [100, 968], [214, 968], 10).slice(1),
      ...curve([214, 968], [300, 972], [376, 966], 6).slice(1),
      ...curve([376, 966], [446, 840], [424, 700 - lift], 14).slice(1),
      ...curve([424, 700 - lift], [412, 626 - lift], [360, 604 - lift], 8).slice(1),
    ];
    p.inkRing(Bd, 24, th);
    p.shadedFill(Bd, DOG.fur, DOG.furS, light, 150, 0.4);
    p.clip(Bd, () => p.ell(392, 790, 54, 150, DOG.white, 0));
    p.stroke(curve([150, 820], [292, 790], [300, 950], 14), 7); // haunch line: an open stroke only
    // coat drapes over the back: outer edges are the body outline (clip), only the hem line shows
    coatOn([...curve([60, 952], [250, 930], [410, 690 - lift], 14), [480, 690 - lift], [480, 460], [-80, 460], [-80, 952]], 236, 822, [Bd]);
    const hx = 372, hy = sal ? 560 : beg ? 520 : 566;
    if (beg) { leg([380, 700], [450, 640], 36, DOG.fur); leg([400, 720], [470, 670], 36, DOG.fur); }
    else if (!sal) leg([392, 800], [400, 962], 40, DOG.fur);
    else leg([392, 800], [400, 962], 40, DOG.furS);
    dogHead(p, hx, hy, o, light, o.tongue ? "pant" : "smile");
    if (sal) { // near front paw up to the brow
      const P = curve([396, 720], [500, 640], [436, 520], 10);
      p.stroke(P, 56, INK); p.stroke(P, 40, DOG.fur); p.ell(440, 512, 30, 22, DOG.white, 8);
    }
    return;
  }
  if (mode === "lie") {
    const br = 6 * Math.sin(two * phase);
    nub(90, 900, 0.2);
    const B = ellPts(262, 892 - br * 0.3, 182, 80 + br);
    p.shadedFill(B, DOG.fur, DOG.furS, light, 182, 0.4); p.inkRing(B, 12, th);
    coatOn(ellPts(250, 870, 150, 66, 180, 360), 250, 860, [B]);
    p.ell(470, 955, 44, 22, DOG.white, 8); p.ell(420, 960, 40, 20, DOG.white, 8);
    dogHead(p, 448, 850, o, light);
    return;
  }
  // standing modes: body horizontal, four legs
  const run = mode === "run", walk = mode === "walk" || run, bob = walk ? (run ? 14 : 6) * Math.abs(Math.sin(two * phase)) : 0;
  const bite = mode === "bite", push = mode === "push", bark = mode === "bark";
  const lean = bite ? -10 : push ? 8 : 0;
  nub(96, 760 - bob, 1);
  const legs = (far: boolean) => {
    const col = far ? DOG.furS : DOG.fur;
    [[170, 0], [372, 0.5]].forEach(([x0, ph]) => {
      let x = x0 + (far ? -24 : 0) + (bite ? -30 : 0), y = 962;
      if (walk) { const c = (phase + ph + (far ? 0.5 : 0)) % 1, A = run ? 70 : 40; x += A * Math.cos(two * c); y -= (run ? 40 : 22) * Math.max(0, Math.sin(two * c)); }
      if (bite && x0 > 300) x += 60;
      leg([x0 + (far ? -20 : 0), 820 - bob], [x, y], 38, col);
    });
  };
  legs(true);
  const hx = push ? 470 : bite ? 478 : 446, hy = push ? 860 : bite ? 720 : bark ? 640 - bob : 668 - bob;
  const B = ellPts(262, 800 - bob, 178, 90, 0, 360, lean);
  const neck: P2[] = [[362, 790 - bob], [hx + 10, hy + 30]];
  p.stroke(neck, 104, INK); // neck joins body and head into one silhouette
  p.inkRing(B, 24, th);
  p.shadedFill(B, DOG.fur, DOG.furS, light, 178, 0.4);
  p.stroke(neck, 80, DOG.fur);
  p.clip(B, () => p.ell(330, 870, 150, 40, DOG.white, 0));
  coatOn(ellPts(250, 790 - bob, 156, 84, 180, 360, lean), 250, 770 - bob, [B]);
  legs(false);
  dogHead(p, hx, hy, o, light, bark ? "bark" : bite ? "bite" : run || o.tongue ? "pant" : "smile");
};

/** artillery shell diving in with whistle lines, 300 x 300 */
export const fxShell = (p: Pen) => {
  for (let i = 0; i < 3; i++) p.stroke(curve([30 + 20 * i, 40 + 40 * i], [80 + 20 * i, 60 + 30 * i], [120 + 10 * i, 110 + 20 * i]), 7, "#ffffff");
  const S: P2[] = [[110, 60], [190, 100], [270, 220], [250, 280], [180, 270], [80, 130]];
  p.poly(S, "#5a5f52", 12);
  p.band([[120, 150], [230, 210]], "#c9a14a", 26, 6);
};
/** green poison-gas cloud, 600 x 400, soft */
export const fxGas = (p: Pen, k: number) => {
  for (let i = 0; i < 9; i++) {
    const a = rnd(i, 1) * Math.PI * 2, r = 60 + 110 * rnd(i, 2), x = 300 + Math.cos(a) * 170 * rnd(i, 3), y = 220 + Math.sin(a) * 90 * rnd(i, 4) + 10 * Math.sin(k * 6 + i);
    p.g.globalAlpha = 0.55; p.ell(x, y, r * 1.2, r * 0.8, i % 2 ? "#a6c84a" : "#8db83a", 0); p.g.globalAlpha = 1;
  }
};
/** sergeant chevrons, 300 x 300 */
export const fxChevrons = (p: Pen) => {
  p.poly(rrect(30, 20, 270, 280, 30), "#556b3a", 10);
  for (let k = 0; k < 3; k++) { const y = 70 + k * 62; p.stroke([[60, y + 60], [150, y], [240, y + 60]], 44, INK); p.stroke([[60, y + 60], [150, y], [240, y + 60]], 28, "#e8c45a"); }
};
/** leather football, 300 x 200 */
export const fxFootball = (p: Pen) => {
  p.ell(150, 100, 120, 70, "#8a4a26", 10); p.stroke([[80, 100], [220, 100]], 6, "#f4f1ea");
  for (let k = 0; k < 5; k++) p.stroke([[110 + 20 * k, 88], [110 + 20 * k, 112]], 6, "#f4f1ea");
};
/** big comic word (WOOF!, GRRR...) with a burst behind, 600 x 300 */
export const fxWord = (p: Pen, text: string, col = "#fff3b0") => {
  const pts: P2[] = []; for (let i = 0; i < 24; i++) { const a = (i / 24) * Math.PI * 2, r = i % 2 ? 1 : 0.78; pts.push([300 + 280 * r * Math.cos(a), 150 + 130 * r * Math.sin(a)]); }
  p.poly(pts, col, 10);
  const g = p.g; g.font = "900 120px 'Inter Display', 'Inter', sans-serif"; g.textAlign = "center"; g.textBaseline = "middle";
  g.lineWidth = 18; g.strokeStyle = INK; g.lineJoin = "round"; g.strokeText(text, 300, 156); g.fillStyle = "#e8423a"; g.fillText(text, 300, 156);
};
/** 'NO DOGS' sign on a post, 400 x 500 */
export const fxNoDogs = (p: Pen) => {
  p.band([[200, 300], [200, 495]], "#8a5a36", 26, 7);
  p.poly(rrect(20, 20, 380, 320, 24), "#f6ecd2", 12);
  const g = p.g; g.font = "900 86px 'Inter Display', 'Inter', sans-serif"; g.textAlign = "center"; g.fillStyle = "#c0353a"; g.fillText("NO", 200, 120); g.fillText("DOGS", 200, 220);
  p.stroke([[60, 270], [340, 270]], 10, "#c0353a");
};
/** little cloth scrap torn from trousers, 200 x 160 */
export const fxScrap = (p: Pen) => { p.poly([[20, 40], [170, 20], [186, 120], [40, 140]], "#5d6a7e", 8); p.stroke([[80, 30], [92, 130]], 4, "#3e4656"); };
/** US flag (1917, simplified), 600 x 380 */
export const fxFlag = (p: Pen) => {
  for (let k = 0; k < 13; k++) p.poly([[0, k * 29], [600, k * 29], [600, (k + 1) * 29 + 1], [0, (k + 1) * 29 + 1]], k % 2 ? "#f4f1ea" : "#c0353a", 0);
  p.poly([[0, 0], [250, 0], [250, 203], [0, 203]], "#2f3f7a", 0);
  for (let r = 0; r < 6; r++) for (let c = 0; c < 8; c++) p.dot(18 + c * 30, 18 + r * 33, 6, "#ffffff");
  p.poly([[0, 0], [600, 0], [600, 377], [0, 377]], null, 8);
};
/** photographer's flash bulb pop, 300 x 300 */
export const fxFlashPop = (p: Pen) => { fxBurst(p, 0.3, "#ffffff", 12, 30, 140); p.ell(150, 150, 40, 40, "#ffffff", 0); };

// ---------------- Wojtek the bear ----------------
const BEAR = { fur: "#8a5a34", furS: "#5a3a22", belly: "#a8784c", muz: "#dcb488", muzS: "#a8845c", ear: "#c4936a", nose: "#1e1a1c", pad: "#3e2818", khaki: "#6b6a42", chev: "#e8c45a" };
export type BearProp = null | "bottle" | "beer" | "cig" | "crate" | "tin" | "sausage" | "soap";
export type BearOpts = {
  phase?: number; mode?: "sit" | "stand" | "walk" | "carry" | "wrestle" | "shower" | "salute" | "sitSalute";
  eye?: "dot" | "happy" | "blink" | "shock" | "smug" | "stern" | "proud"; light?: number;
  mouth?: "smile" | "grin" | "chew" | "o" | "drink";
  /** held prop; toMouth lifts the near paw (and prop) to the mouth */
  prop?: BearProp; toMouth?: number; cub?: boolean;
  cap?: null | "beret" | "helmet"; stripes?: number; wet?: boolean;
};
const bearHead = (p: Pen, hx: number, hy: number, o: BearOpts, light: number) => {
  const { eye = "dot", mouth = "smile", cub = false, cap = null } = o;
  const th = thickAngle(light), s = cub ? 1.22 : 1;
  const g = p.g; g.save(); g.translate(hx, hy); g.scale(s, s); g.translate(-hx, -hy);
  // round ears (far first)
  for (const [x, y, r, col] of [[hx - 62, hy - 78, 36, BEAR.furS], [hx + 18, hy - 94, 38, BEAR.fur]] as [number, number, number, string][]) {
    const E = ellPts(x, y, r, r);
    p.shadedFill(E, col, BEAR.furS, light, r, 0.4); p.poly(E, null, 9); p.ell(x + 4, y + 4, r * 0.5, r * 0.5, BEAR.ear, 0);
  }
  const H = ellPts(hx, hy, 112, 100);
  p.shadedFill(H, BEAR.fur, BEAR.furS, light, 112, 0.4);
  p.inkRing(H, 11, th);
  const Mz = ellPts(hx + 92, hy + 32, 64, 46);
  p.shadedFill(Mz, BEAR.muz, BEAR.muzS, light, 64, 0.4); p.inkRing(Mz, 9, th);
  if (mouth === "grin" || mouth === "o") {
    const open = mouth === "o" ? 1 : 0.6;
    if (mouth === "o") p.ell(hx + 112, hy + 58, 22, 22 * open + 4, "#5a1e28", 7);
    else { p.poly([[hx + 146, hy + 40], ...curve([hx + 140, hy + 46], [hx + 98, hy + 46 + 44 * open], [hx + 62, hy + 44], 8)], "#5a1e28", 7); p.ell(hx + 104, hy + 64, 18, 10, "#e86e78", 0); }
  } else if (mouth === "chew") {
    p.stroke(curve([hx + 140, hy + 44], [hx + 108, hy + 64], [hx + 70, hy + 50]), 7);
    p.stroke([[hx + 96, hy + 60], [hx + 102, hy + 70]], 5);
  } else if (mouth !== "drink") p.stroke(curve([hx + 138, hy + 44], [hx + 104, hy + 66], [hx + 70, hy + 50]), 6);
  p.ell(hx + 146, hy + 12, 26, 19, BEAR.nose, 0); p.ell(hx + 140, hy + 4, 8, 5, "#6a6670", 0);
  const es = cub ? 1.12 : 1;
  dogEye(p, eye, hx + 6, hy - 24, 0.84 * es);
  dogEye(p, eye, hx + 58, hy - 30, 1 * es);
  if (cap === "beret") {
    const B = ellPts(hx - 14, hy - 92, 96, 34, 0, 360, -8);
    p.shadedFill(B, BEAR.khaki, "#4a4930", light, 96, 0.4); p.poly(B, null, 8);
    p.ell(hx + 40, hy - 96, 13, 15, "#d9dde0", 5);
  } else if (cap === "helmet") {
    const yb = hy - 62, D = ellPts(hx - 6, yb, 108, 70, 180, 360);
    p.shadedFill(D, "#5e6540", "#40452c", light, 108, 0.4); p.poly(D, null, 9);
    p.poly(ellPts(hx - 6, yb, 150, 16), "#4f5536", 8);
  }
  g.restore();
};
/** prop held at paw (x, y) */
const bearProp = (p: Pen, pr: BearProp, x: number, y: number, tilt = 0) => {
  if (!pr) return;
  const save = p.rot; p.rot = [tilt, x, y];
  if (pr === "bottle") { // old vodka bottle full of milk
    p.poly(rrect(x - 26, y - 70, x + 26, y + 60, 12), "#eef4f4", 8); p.poly(rrect(x - 10, y - 110, x + 10, y - 66, 4), "#dfe9ea", 7);
    p.poly(rrect(x - 26, y - 14, x + 26, y + 24, 2), "#c0353a", 5); p.g.fillStyle = "#fff6d8"; p.g.font = "bold 22px Georgia, serif"; p.g.textAlign = "center"; p.g.fillText("VODKA", x, y + 12);
  } else if (pr === "beer") {
    p.poly(rrect(x - 22, y - 60, x + 22, y + 56, 10), "#7a4416", 8); p.poly(rrect(x - 8, y - 104, x + 8, y - 56, 4), "#7a4416", 7);
    p.poly(rrect(x - 22, y - 16, x + 22, y + 22, 2), "#f2e6c2", 5); p.ell(x - 10, y - 40, 5, 14, "#c98a4a", 0);
  } else if (pr === "cig") {
    p.poly([[x - 8, y - 6], [x + 70, y - 14], [x + 72, y + 4], [x - 6, y + 12]], "#ffffff", 5); p.poly([[x - 8, y - 6], [x + 14, y - 8], [x + 16, y + 10], [x - 6, y + 12]], "#e0a050", 0);
  } else if (pr === "tin") {
    p.poly(rrect(x - 40, y - 34, x + 40, y + 34, 8), "#c9ccd2", 8); p.poly(rrect(x - 40, y - 14, x + 40, y + 14, 2), "#c0353a", 4);
  } else if (pr === "sausage") {
    p.line(curve([x - 60, y + 10], [x, y - 30], [x + 60, y + 6]), "#c06a4a", 30);
  } else if (pr === "soap") { p.poly(rrect(x - 30, y - 20, x + 30, y + 20, 10), "#f4c6d8", 7); }
  p.rot = save;
};
/** wooden ammunition crate, top-left (x, y), w x h */
const crateAt = (p: Pen, x: number, y: number, w: number, h: number) => {
  p.poly(rrect(x, y, x + w, y + h, 6), "#9a7046", 9);
  p.stroke([[x + 10, y + h * 0.33], [x + w - 10, y + h * 0.33]], 5, "#6a4a2a"); p.stroke([[x + 10, y + h * 0.66], [x + w - 10, y + h * 0.66]], 5, "#6a4a2a");
  p.g.fillStyle = "#2a2010"; p.g.font = `900 ${Math.round(h * 0.28)}px 'Inter', sans-serif`; p.g.textAlign = "center"; p.g.fillText("25 PDR", x + w / 2, y + h * 0.58);
};
/** a cartoon brown bear facing screen-right in the 600 x 1000 design space (feet on y = 975).
 *  Adult ~ scale 1.0-1.1 (stands about as tall as a soldier); cub ~0.32 with cub: true (bigger head). */
export const bearSide = (p: Pen, o: BearOpts = {}) => {
  const { phase = 0, mode = "sit", light = DEF_LIGHT, prop = null, toMouth = 0, cub = false, stripes = 0 } = o;
  const two = Math.PI * 2, th = thickAngle(light);
  const limb = (pts: P2[], w: number, col: string) => { p.stroke(pts, w + 18, INK); p.stroke(pts, w, col); };
  const chevs = (cx: number, cy: number) => { for (let k = 0; k < stripes; k++) { const y = cy + k * 22; p.stroke([[cx - 30, y + 16], [cx, y], [cx + 30, y + 16]], 22, INK); p.stroke([[cx - 30, y + 16], [cx, y], [cx + 30, y + 16]], 12, BEAR.chev); } };
  const lerp = (a: P2, b: P2, k: number): P2 => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];
  if (mode === "sit" || mode === "sitSalute") {
    // ONE silhouette: back -> rump -> seat -> belly -> chest
    const Bd: P2[] = [
      ...curve([330, 500], [140, 560], [96, 860], 16),
      ...curve([96, 860], [90, 972], [240, 974], 10).slice(1),
      ...curve([240, 974], [420, 976], [474, 900], 8).slice(1),
      ...curve([474, 900], [520, 720], [440, 540], 14).slice(1),
      ...curve([440, 540], [400, 496], [330, 500], 6).slice(1),
    ];
    limb([[300, 900], [330, 950]], 60, BEAR.furS); // far foot
    p.inkRing(Bd, 24, th);
    p.shadedFill(Bd, BEAR.fur, BEAR.furS, light, 220, 0.4);
    p.clip(Bd, () => p.ell(420, 780, 84, 170, BEAR.belly, 0));
    p.stroke(curve([150, 800], [300, 760], [330, 930], 14), 7); // haunch line
    // near hind leg forward, sole showing
    limb([[300, 900], [452, 930]], 76, BEAR.fur); p.ell(476, 924, 34, 50, BEAR.fur, 9); p.ell(482, 928, 20, 32, BEAR.pad, 0);
    const hx = 380, hy = 420;
    bearHead(p, hx, hy, o, light);
    if (mode === "sitSalute") { const P = curve([400, 600], [560, 470], [hx + 70, hy - 92], 10); limb(P, 60, BEAR.fur); p.ell(hx + 72, hy - 98, 34, 26, BEAR.fur, 9, 0, 360, -20); chevs(452, 600); return; }
    // near arm: resting on the belly, or lifting the paw (and prop) to the mouth
    const hs = cub ? 1.22 : 1, mouthAt: P2 = [hx + 122 * hs, hy + 56 * hs];
    const drink = prop === "bottle" || prop === "beer";
    // drinking: bottle tipped up, neck in the mouth, paw round its middle
    const rest: P2 = [470, 790], mouthP: P2 = drink ? [mouthAt[0] + 70, mouthAt[1] - 70] : [hx + 104 * hs, hy + 72 * hs], paw = lerp(rest, mouthP, toMouth);
    const elbow: P2 = lerp([490, 700], [560, 640], toMouth);
    limb(curve([400, 590], elbow, paw, 10), 62, BEAR.fur);
    if (drink) bearProp(p, prop, paw[0], paw[1], -0.3 - 2.06 * toMouth);
    p.ell(paw[0], paw[1], 36, 30, BEAR.fur, 9);
    if (prop && !drink) bearProp(p, prop, paw[0] + (prop === "cig" ? 10 : 0), paw[1] - 30, prop === "cig" ? -0.2 : 0);
    chevs(452, 590);
    return;
  }
  if (mode === "walk") {
    const bob = 8 * Math.abs(Math.sin(two * phase));
    const legs = (far: boolean) => {
      [[170, 0], [400, 0.5]].forEach(([x0, ph]) => {
        const c = (phase + ph + (far ? 0.5 : 0)) % 1;
        const x = x0 + (far ? -26 : 0) + 46 * Math.cos(two * c), y = 960 - 26 * Math.max(0, Math.sin(two * c));
        limb([[x0 + (far ? -24 : 0), 800 - bob], [x, y]], 70, far ? BEAR.furS : BEAR.fur); p.ell(x + 14, y - 4, 40, 20, far ? BEAR.furS : BEAR.fur, 8);
      });
    };
    legs(true);
    const B: P2[] = [
      ...curve([90, 820 - bob], [70, 650 - bob], [220, 620 - bob], 12),
      ...curve([220, 620 - bob], [340, 560 - bob], [420, 640 - bob], 10).slice(1),
      ...curve([420, 640 - bob], [500, 720 - bob], [470, 840 - bob], 10).slice(1),
      ...curve([470, 840 - bob], [300, 900 - bob], [110, 860 - bob], 12).slice(1),
    ];
    p.inkRing(B, 24, th); p.shadedFill(B, BEAR.fur, BEAR.furS, light, 220, 0.4);
    legs(false);
    bearHead(p, 500, 690 - bob, o, light);
    return;
  }
  // upright modes: stand, carry, wrestle, shower, salute
  const sway = mode === "carry" ? 10 * Math.sin(two * phase) : 0, step = mode === "carry" ? 14 * Math.sin(two * phase) : 0;
  limb([[250, 760], [240 - step, 945]], 80, BEAR.furS); p.ell(262 - step, 952, 64, 26, BEAR.furS, 9);
  const farArm = (end: P2) => { limb(curve([300, 430], [lerp([300, 430], end, 0.5)[0] - 20, lerp([300, 430], end, 0.5)[1] + 30], end, 10), 58, BEAR.furS); p.ell(end[0], end[1], 32, 28, BEAR.furS, 9); };
  if (mode === "wrestle") farArm([470, 330]);
  if (mode === "shower") farArm([330, 160]);
  if (mode === "carry") farArm([470, 560 + sway]);
  const Bs: P2[] = [
    ...curve([330, 330], [170, 380], [160, 600], 14),
    ...curve([160, 600], [150, 800], [250, 836], 10).slice(1),
    ...curve([250, 836], [340, 850], [410, 800], 8).slice(1),
    ...curve([410, 800], [470, 620], [440, 420], 12).slice(1),
    ...curve([440, 420], [410, 330], [330, 330], 8).slice(1),
  ];
  p.inkRing(Bs, 24, th); p.shadedFill(Bs, BEAR.fur, BEAR.furS, light, 240, 0.4);
  p.clip(Bs, () => p.ell(400, 620, 70, 170, BEAR.belly, 0));
  limb([[330, 780], [350 + step, 948]], 84, BEAR.fur); p.ell(372 + step, 956, 68, 26, BEAR.fur, 9);
  const hx = 370, hy = 270;
  bearHead(p, hx, hy, o, light);
  if (mode === "carry") { crateAt(p, 370, 450 + sway, 240, 180); }
  const sh: P2 = [390, 440];
  const end: P2 = mode === "carry" ? [560, 560 + sway] : mode === "wrestle" ? [540, 380] : mode === "shower" ? [470, 640] : mode === "salute" ? [hx + 70, hy - 92] : [450, 700];
  limb(curve(sh, mode === "stand" ? [470, 560] : mode === "salute" ? [520, 360] : [lerp(sh, end, 0.5)[0] + 30, lerp(sh, end, 0.5)[1] + 40], end, 10), 62, BEAR.fur);
  p.ell(end[0], end[1], 34, 28, BEAR.fur, 9);
  if (mode === "shower" && prop === "soap") bearProp(p, "soap", end[0] + 6, end[1] + 4);
  if (mode === "stand" && prop) bearProp(p, prop, end[0] + 10, end[1] - 30, -0.3);
  chevs(420, 480);
};

/** shower water streaks + drops falling (k 0..1 cycles), 400 x 600 */
export const fxShower = (p: Pen, k: number) => {
  p.poly(rrect(150, 0, 250, 40, 10), "#9aa4ae", 8);
  for (let i = 0; i < 14; i++) { const x = 160 + 80 * rnd(i, 1) + (i - 7) * 14, y = ((rnd(i, 2) + k) % 1) * 560 + 40; p.stroke([[x, y], [x + (i - 7) * 2, y + 40]], 7, "#bfe6ff"); }
};
/** soap bubbles, 300 x 300 */
export const fxBubbles = (p: Pen, k: number) => {
  for (let i = 0; i < 7; i++) { const x = 40 + 220 * rnd(i, 1), y = 260 - ((rnd(i, 2) + k) % 1) * 240, r = 14 + 18 * rnd(i, 3); p.ell(x, y, r, r, "rgba(255,255,255,0.55)", 4); p.dot(x - r * 0.35, y - r * 0.35, r * 0.2, "#ffffff"); }
};
/** the 22nd Company badge: a bear carrying an artillery shell, 600 x 600 */
export const fxBadge = (p: Pen) => {
  p.ell(300, 300, 280, 280, "#f2e6c2", 14); p.ell(300, 300, 240, 240, null, 6);
  const S = (x: number, y: number) => [x, y] as P2;
  // simplified bear silhouette walking upright, hugging a shell
  p.poly([S(200, 470), S(210, 360), S(180, 260), S(230, 170), S(300, 150), S(330, 190), S(340, 250), S(380, 330), S(370, 470), S(320, 470), S(300, 380), S(260, 400), S(250, 470)], "#5a3a22", 6);
  p.ell(310, 165, 52, 44, "#5a3a22", 6); p.ell(290, 122, 18, 18, "#5a3a22", 6); p.ell(360, 180, 22, 16, "#5a3a22", 6);
  p.poly([S(330, 250), S(430, 200), S(470, 240), S(370, 300)], "#c9a14a", 6); p.poly([S(430, 200), S(470, 190), S(480, 230), S(470, 240)], "#8a6a2a", 5);
};
/** corporal's two stripes on a khaki patch, 300 x 300 */
export const fxStripes = (p: Pen) => {
  p.poly(rrect(30, 40, 270, 260, 30), "#6b6a42", 10);
  for (let k = 0; k < 2; k++) { const y = 90 + k * 70; p.stroke([[60, y + 60], [150, y], [240, y + 60]], 44, INK); p.stroke([[60, y + 60], [150, y], [240, y + 60]], 28, "#e8c45a"); }
};
/** enlistment paper with a stamp (k 0..1 stamp in), 500 x 360 */
export const fxPaper = (p: Pen, stamp: number) => {
  p.poly(rrect(20, 20, 480, 340, 10), "#f6efd8", 10);
  const g = p.g; g.fillStyle = "#2a2010"; g.textAlign = "left"; g.font = "bold 40px Georgia, serif"; g.fillText("ENLISTMENT", 50, 80);
  g.font = "34px Georgia, serif"; g.fillText("Name: WOJTEK", 50, 140); g.fillText("Rank: PRIVATE", 50, 190); g.fillText("Species: bear", 50, 240);
  for (let k = 0; k < 2; k++) p.stroke([[50, 280 + 22 * k], [300, 280 + 22 * k]], 4, "#b8ab8a");
  if (stamp > 0) { const s = 1 + 0.6 * (1 - stamp); p.g.globalAlpha = Math.min(1, stamp * 1.5); p.ell(380, 250, 70 * s, 70 * s, null, 9); p.g.fillStyle = "#c0353a"; g.font = `900 ${Math.round(30 * s)}px 'Inter', sans-serif`; g.textAlign = "center"; g.fillText("OK!", 380, 262); p.g.globalAlpha = 1; }
};
/** sign on a post: two lines of text, 400 x 500 */
export const fxSign2 = (p: Pen, a: string, b: string, col = "#c0353a", bg = "#f6ecd2") => {
  p.band([[200, 300], [200, 495]], "#8a5a36", 26, 7);
  p.poly(rrect(20, 20, 380, 320, 24), bg, 12);
  const g = p.g; g.font = "900 80px 'Inter Display', 'Inter', sans-serif"; g.textAlign = "center"; g.fillStyle = col; g.fillText(a, 200, 130); g.font = "900 70px 'Inter Display', 'Inter', sans-serif"; g.fillText(b, 200, 230);
  p.stroke([[60, 270], [340, 270]], 10, col);
};
/** food tins stack, 300 x 200 */
export const fxTins = (p: Pen) => { for (const [x, y] of [[90, 140], [210, 140], [150, 60]]) { p.poly(rrect(x - 55, y - 45, x + 55, y + 45, 10), "#c9ccd2", 8); p.poly(rrect(x - 55, y - 14, x + 55, y + 16, 2), "#3f7ab8", 4); } };
/** a cigarette flying (thrown), 200 x 80 */
export const fxCigFly = (p: Pen) => { p.poly([[10, 30], [180, 22], [182, 46], [12, 54]], "#ffffff", 6); p.poly([[10, 30], [50, 28], [52, 52], [12, 54]], "#e0a050", 0); };
/** Polish flag, 600 x 380 */
export const fxFlagPL = (p: Pen) => {
  p.poly([[0, 0], [600, 0], [600, 190], [0, 190]], "#f4f1ea", 0); p.poly([[0, 190], [600, 190], [600, 380], [0, 380]], "#d4213d", 0);
  p.poly([[0, 0], [600, 0], [600, 380], [0, 380]], null, 8);
};
/** Scottish saltire, 600 x 380 */
export const fxFlagSC = (p: Pen) => {
  p.poly([[0, 0], [600, 0], [600, 380], [0, 380]], "#1f5aa8", 0);
  p.stroke([[0, 0], [600, 380]], 70, "#ffffff"); p.stroke([[600, 0], [0, 380]], 70, "#ffffff");
  p.poly([[0, 0], [600, 0], [600, 380], [0, 380]], null, 8);
};
/** light bulb idea, 300 x 400 */
export const fxIdea = (p: Pen) => { fxBurst(p, 0.25, "#fff3b0", 10, 30, 140); p.ell(150, 150, 80, 90, "#ffe066", 10); p.poly(rrect(110, 230, 190, 300, 10), "#9aa4ae", 8); };

// ---------------- Onoda short: animals + effect cards ----------------
export type CowOpts = { phase?: number; mode?: "stand" | "walk" | "graze"; eye?: "dot" | "happy" | "blink"; light?: number; spots?: number; moo?: boolean };
/** a cartoon cow facing screen-right, 600 x 1000 design space (hooves on y = 975). ONE body silhouette, head joined by a neck. */
export const cowSide = (p: Pen, o: CowOpts = {}) => {
  const { phase = 0, mode = "stand", eye = "dot", light = DEF_LIGHT, spots = 0, moo = false } = o;
  const th = thickAngle(light), two = Math.PI * 2;
  const W = "#f4efe6", WS = "#c9c0b8", BK = "#2e2a2c", PK = "#f2a6a8";
  const limb = (pts: P2[], w: number, col: string) => { p.stroke(pts, w + 16, INK); p.stroke(pts, w, col); };
  const legs: [number, number][] = [[150, 0], [205, 0.5], [400, 0.5], [455, 0]];
  const swing = (ph: number) => (mode === "walk" ? Math.sin(two * (phase + ph)) : 0);
  // far legs first (darker), then body, then near legs
  for (const [k, [x, ph]] of legs.entries()) if (k % 2 === 1) { const s = swing(ph); limb([[x, 700], [x + 6 + 18 * s, 840], [x + 30 * s, 960]], 46, WS); p.ell(x + 30 * s, 962, 30, 16, BK, 8); }
  const body: P2[] = [...curve([110, 540], [300, 470], [500, 520], 14), ...curve([500, 520], [560, 620], [500, 740], 10), ...curve([500, 740], [300, 790], [120, 740], 14), ...curve([120, 740], [60, 640], [110, 540], 10)];
  // tail
  const tw = 0.15 * Math.sin(two * phase * 0.7);
  p.stroke(curve([118, 560], [40 - 30 * tw, 650], [62, 800], 10), 24, INK); p.stroke(curve([118, 560], [40 - 30 * tw, 650], [62, 800], 10), 10, W);
  p.ell(62, 812, 18, 26, BK, 7);
  p.shadedFill(body, W, WS, light, 260, 0.4);
  p.clip(body, () => {
    const S = [[200, 560, 70, 52, 0.2], [360, 690, 60, 44, -0.3], [440, 560, 46, 38, 0.5], [150, 700, 40, 34, 0], [290, 600, 34, 28, 0.4]];
    for (let k = 0; k < 3 + (spots % 3); k++) { const [x, y, rx, ry, r] = S[k]; p.poly(ellPts(x, y, rx, ry, 0, 360, r * 57), BK, 0); }
    p.ell(330, 772, 46, 22, PK, 0); // udder hint
  });
  p.inkRing(body, 12, th);
  for (const [k, [x, ph]] of legs.entries()) if (k % 2 === 0) { const s = swing(ph); limb([[x, 700], [x + 6 + 18 * s, 840], [x + 30 * s, 960]], 50, W); p.ell(x + 30 * s, 962, 32, 18, BK, 8); }
  // neck + head (graze: head down)
  const g = mode === "graze" ? 1 : 0, hx = 560 + 10 * g, hy = 470 + 330 * g;
  p.stroke(curve([470, 560], [530, 520 + 120 * g], [hx - 20, hy + 10]), 120, INK); p.stroke(curve([470, 560], [530, 520 + 120 * g], [hx - 20, hy + 10]), 96, W);
  for (const s of [-1, 1]) { const hp: P2[] = curve([hx - 30 + 24 * s, hy - 70], [hx - 40 + 70 * s, hy - 130], [hx - 20 + 90 * s, hy - 120], 8); p.stroke(hp, 26, INK); p.stroke(hp, 13, "#efe3c4"); }
  p.poly(ellPts(hx - 95, hy - 40, 52, 24, 0, 360, -25), WS, 9); // ear
  const H = ellPts(hx, hy, 82, 92);
  p.shadedFill(H, W, WS, light, 90, 0.4); p.clip(H, () => p.poly(ellPts(hx - 40, hy - 50, 50, 40, 0, 360, 20), BK, 0)); p.inkRing(H, 10, th);
  const Mz = ellPts(hx + 30, hy + 62, 70, 46);
  p.shadedFill(Mz, PK, "#d88488", light, 70, 0.4); p.inkRing(Mz, 9, th);
  p.ell(hx + 10, hy + 58, 9, 12, "#7a3e44", 0); p.ell(hx + 56, hy + 56, 9, 12, "#7a3e44", 0);
  if (moo) p.ell(hx + 34, hy + 92, 22, 14, "#5a1e28", 6);
  if (eye === "happy") { p.arc(hx + 4, hy - 4, 16, 12, 200, 340, 8); p.arc(hx + 52, hy - 8, 16, 12, 200, 340, 8); }
  else if (eye === "blink") { p.stroke([[hx - 12, hy - 2], [hx + 18, hy - 2]], 8); p.stroke([[hx + 38, hy - 6], [hx + 66, hy - 6]], 8); }
  else { p.ell(hx + 4, hy - 4, 15, 18, "#ffffff", 6); p.dot(hx + 8, hy - 2, 7); p.ell(hx + 52, hy - 8, 15, 18, "#ffffff", 6); p.dot(hx + 56, hy - 6, 7); }
};
const txt = (p: Pen, s: string, x: number, y: number, px: number, col: string, font = "900", align: CanvasTextAlign = "center", family = "'Inter Display', 'Inter', sans-serif") => {
  const g = p.g; g.font = `${font} ${px}px ${family}`; g.textAlign = align; g.textBaseline = "middle"; g.fillStyle = col; g.fillText(s, x, y);
};
/** a propaganda leaflet, 300 x 400 */
export const fxLeaflet = (p: Pen) => {
  p.poly([[16, 20], [284, 12], [290, 384], [10, 390]], "#f6efda", 9);
  txt(p, "THE WAR", 150, 90, 52, "#c0353a"); txt(p, "IS OVER", 150, 150, 52, "#c0353a");
  p.stroke([[50, 195], [250, 192]], 6, "#c0353a");
  for (let k = 0; k < 5; k++) p.stroke([[50, 235 + 28 * k], [250 - 30 * (k % 2), 233 + 28 * k]], 6, "#9a9488");
};
/** an envelope with a family photo sticking out, 400 x 360 */
export const fxLetter = (p: Pen) => {
  p.poly([[70, 30], [330, 20], [340, 230], [80, 240]], "#fbf8ee", 9);
  p.poly(rrect(92, 44, 318, 200, 6), "#9ab8c8", 0);
  for (let k = 0; k < 4; k++) { const x = 130 + 52 * k, h = k === 3 ? 30 : 0; p.ell(x, 110 + h, 20, 20, "#f5c9a0", 6); p.poly(rrect(x - 26, 132 + h, x + 26, 200, 14), ["#7a5a9a", "#3f6a9a", "#c0353a", "#e8a03a"][k], 6); }
  p.poly([[20, 170], [380, 160], [380, 340], [20, 350]], "#e9dcbc", 10);
  p.stroke([[20, 172], [200, 270], [380, 162]], 9);
  p.ell(200, 270, 22, 22, "#c0353a", 7);
};
/** a propeller plane, side view, nose right, 600 x 240 */
export const fxPlane = (p: Pen, spin = 0) => {
  const body: P2[] = [...curve([40, 110], [300, 70], [520, 100], 12), ...curve([520, 100], [560, 125], [520, 150], 6), ...curve([520, 150], [300, 160], [60, 130], 12)];
  p.poly([[60, 112], [20, 40], [70, 40], [130, 108]], "#8a9aa2", 9);
  p.poly(body, "#b8c4ca", 10);
  p.poly([[230, 120], [350, 122], [300, 210], [240, 210]], "#8a9aa2", 9);
  for (let k = 0; k < 4; k++) p.ell(330 + 34 * k, 108, 12, 11, "#5a7a8a", 5);
  p.ell(150, 118, 24, 24, "#ffffff", 6);
  const a = spin * Math.PI * 2;
  p.stroke([[566, 125 + 70 * Math.cos(a)], [566, 125 - 70 * Math.cos(a)]], 14);
  p.ell(566, 125, 14, 14, "#4a4e58", 6);
};
/** Suzuki's list, 500 x 640. marks: 0 none, 1 tick, 2 cross */
export const fxList = (p: Pen, marks: number[], n = 3) => {
  p.poly([[30, 40], [470, 30], [480, 620], [24, 630]], "#fffbe8", 10);
  for (let k = 0; k < 8; k++) p.stroke([[50, 150 + 62 * k], [455, 148 + 62 * k]], 3, "#b9d4ea");
  p.stroke([[100, 40], [100, 625]], 3, "#e8a0a0");
  txt(p, "LOOKING FOR:", 270, 100, 48, "#2a2a44", "900");
  const items = ["ONODA", "PANDA", "YETI"];
  for (let k = 0; k < n; k++) {
    const y = 220 + 130 * k;
    txt(p, `${k + 1}. ${items[k]}`, 125, y, 62, "#2a2a44", "800", "left", "'Comic Sans MS', 'Inter', sans-serif");
    if (marks[k] === 1) { p.stroke([[380, y], [410, y + 34], [460, y - 40]], 26); p.stroke([[380, y], [410, y + 34], [460, y - 40]], 14, "#3aa04a"); }
    if (marks[k] === 2) for (const s of [[[380, y - 34], [450, y + 34]], [[450, y - 34], [380, y + 34]]] as P2[][]) { p.stroke(s, 26); p.stroke(s, 14, "#d23a3a"); }
  }
};
/** thought bubble with an icon: kind 0 panda, 1 yeti, 2 soldier's cap. 400 x 400 */
export const fxThink = (p: Pen, kind: number) => {
  const C: P2[] = []; for (let i = 0; i < 40; i++) { const a = (i / 40) * Math.PI * 2, r = 150 + 14 * Math.cos(i * 2 * Math.PI / 5 * 2); C.push([200 + r * Math.cos(a), 180 + 0.85 * r * Math.sin(a)]); }
  p.poly(C, "#ffffff", 9); p.ell(120, 360, 22, 18, "#ffffff", 7); p.ell(80, 392, 12, 10, "#ffffff", 6);
  if (kind === 0) {
    for (const s of [-1, 1]) p.ell(200 + 72 * s, 104, 34, 34, "#222024", 0);
    p.ell(200, 180, 100, 88, "#ffffff", 9);
    for (const s of [-1, 1]) { p.poly(ellPts(200 + 38 * s, 172, 26, 34, 0, 360, 30 * s), "#222024", 0); p.ell(200 + 36 * s, 168, 9, 10, "#ffffff", 0); p.dot(200 + 36 * s, 170, 5); }
    p.ell(200, 214, 16, 11, "#222024", 0); p.arc(200, 222, 18, 10, 20, 160, 5);
  } else if (kind === 1) {
    const B: P2[] = []; for (let i = 0; i < 36; i++) { const a = (i / 36) * Math.PI * 2, r = 98 + (i % 2 ? 10 : -4); B.push([200 + r * Math.cos(a), 190 + r * 1.05 * Math.sin(a)]); }
    p.poly(B, "#e8eef4", 9);
    p.ell(200, 196, 56, 48, "#9aa8c0", 6);
    for (const s of [-1, 1]) { p.ell(200 + 22 * s, 186, 10, 12, "#ffffff", 5); p.dot(200 + 22 * s, 188, 5); }
    p.ell(200, 222, 16, 9, "#4a3a5a", 4);
  } else if (kind === 2) { // an officer's peaked cap with a star
    p.poly([[110, 200], [80, 120], [320, 120], [290, 200]], "#7d7046", 9);
    p.poly(ellPts(200, 120, 122, 26), "#8a7d52", 9);
    p.band([[110, 180], [290, 180]], "#c0353a", 22, 6);
    p.poly(ellPts(210, 210, 110, 24, 0, 180), "#1e1e22", 8);
    star5(p, 200, 150, 24, "#e8c45a", 5);
  }
};
/** official paper, 500 x 360: title, lines, stamp text (stamp 0..1 slams in) */
export const fxDoc = (p: Pen, title: string, lines: string[], stampTxt: string, stamp: number, stampCol = "#c0353a") => {
  p.poly(rrect(20, 20, 480, 340, 10), "#f6efd8", 10);
  const g = p.g; g.fillStyle = "#2a2010"; g.textAlign = "left"; g.textBaseline = "alphabetic"; g.font = "bold 40px Georgia, serif"; g.fillText(title, 50, 80);
  g.font = "32px Georgia, serif"; lines.forEach((l, k) => g.fillText(l, 50, 140 + 48 * k));
  for (let k = 0; k < 2; k++) p.stroke([[50, 280 + 22 * k], [260, 280 + 22 * k]], 4, "#b8ab8a");
  if (stamp > 0) {
    const s = 1 + 0.6 * (1 - stamp); g.save(); g.globalAlpha = Math.min(1, stamp * 1.5); g.translate(360, 250); g.rotate(-0.22); g.scale(s, s);
    p.poly(rrect(-110, -42, 110, 42, 10), null, 9); g.strokeStyle = stampCol; g.lineWidth = 8; g.strokeRect(-104, -36, 208, 72);
    g.fillStyle = stampCol; g.font = "900 46px 'Inter Display', 'Inter', sans-serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(stampTxt, 0, 2); g.restore();
  }
};
/** map insert, 600 x 760: Philippines-ish islands, Lubang ringed */
export const fxMap = (p: Pen, ring: number) => {
  p.poly(rrect(20, 20, 580, 740, 22), "#8fc6e0", 10);
  const g = p.g; g.save(); p.clip(rrect(20, 20, 580, 740, 22), () => {
    for (let k = 0; k < 9; k++) p.stroke([[20, 70 + 80 * k], [580, 60 + 80 * k]], 2, "rgba(255,255,255,0.35)");
    const isl: [number, number, number, number, number][] = [[330, 210, 90, 170, 0.3], [400, 470, 70, 60, -0.2], [470, 560, 60, 90, 0.4], [300, 520, 40, 26, 0.6], [470, 380, 34, 50, 0.1], [360, 640, 110, 60, 0.1]];
    for (const [x, y, rx, ry, r] of isl) p.poly(ellPts(x, y, rx, ry, 0, 360, r * 57, 24).map(([a, b], i) => [a + 6 * Math.sin(i * 1.7), b + 6 * Math.cos(i * 2.3)] as P2), "#9cc46a", 7);
    p.poly(ellPts(215, 410, 18, 11, 0, 360, -20), "#9cc46a", 6);
  });
  g.restore();
  if (ring > 0) { const r = 34 + 30 * (1 - ring); g.globalAlpha = Math.min(1, ring * 2); p.arc(215, 410, r, r * 0.9, 0, 360, 16); p.arc(215, 410, r, r * 0.9, 0, 360, 9, "#e8423a"); g.globalAlpha = 1;
    g.save(); g.font = "900 54px 'Inter Display', 'Inter', sans-serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.lineWidth = 14; g.strokeStyle = "#ffffff"; g.lineJoin = "round"; g.strokeText("LUBANG", 190, 335); g.fillStyle = "#e8423a"; g.fillText("LUBANG", 190, 335); g.restore(); }
  txt(p, "PHILIPPINES", 300, 80, 44, "#1f3a5a");
};
/** calendar page with a year, 300 x 340 */
export const fxCal = (p: Pen, year: string, red = false) => {
  p.poly(rrect(20, 40, 280, 320, 16), "#fffdf6", 9);
  p.poly(rrect(20, 40, 280, 110, 16), red ? "#d23a3a" : "#3f6a9a", 9);
  for (const x of [90, 210]) p.ell(x, 40, 12, 22, "#c9ccd2", 6);
  txt(p, year, 150, 215, 96, "#2a2a44");
};
/** "BOOKS" shop sign, 600 x 200 */
export const fxShopSign = (p: Pen, a: string) => { p.poly(rrect(14, 20, 586, 180, 18), "#2f5a4a", 10); p.poly(rrect(34, 38, 566, 162, 10), null, 4); txt(p, a, 300, 104, 92, "#f3e2b0", "900", "center", "Georgia, serif"); };
/** a 3-cell comic panel '1 / 3' counter, 400 x 220 */
export const fxScore = (p: Pen, s: string) => { p.poly(rrect(20, 20, 380, 200, 30), "#fff3b0", 10); txt(p, s, 200, 112, 110, "#e8423a"); };
