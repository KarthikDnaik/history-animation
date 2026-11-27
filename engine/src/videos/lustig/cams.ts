// Camera keys and lens blur per shot for the Lustig long-form (cameras mostly on +z looking -z: +x = screen right).
// v2 "RicksClips pacing": 2-5 setups per line, hard cuts on words, every setup pushes in fast AND orbits the subject
// (parallax), low / dutch angles, big subjects.
import { C } from "./cues";
import { SHOTS, Key, Shot, V3, fr, runKeys, pushK, applyKick, KICKS, Cam, glide, FPS, at, atN } from "./story";

const S = (id: number) => SHOTS[id - 1].a;
const F = fr;
/** cut frame for a narration word: 2 f before its onset */
const W = (line: number, word: string, n = 0) => F(n ? atN(line, word, n) : at(line, word)) - 2;
type DKey = { f: number; dur?: number; cInf: number; focus?: (f: number) => V3 };
const CAMS: Record<number, Key[]> = {}, DOF: Record<number, DKey[]> = {};
type P = V3 | ((f: number) => V3);
const val = (p: P, f: number) => (typeof p === "function" ? p(f) : p);
type MO = { dmin?: number; fov?: number; push?: number; orbit?: number; rise?: number; roll?: number; punch?: number; T?: number; drift?: number };
const ease = (x: number, T: number) => T * (1 - Math.exp(-x / T));
/** moving camera: fast push-in toward `look` (subject grows ~1.4x in 1.5 s, easing out) + orbit about the vertical through
 *  `look` (rad/frame, + = camera swings toward screen right... i.e. counter-clockwise from above) + optional crane + a faint
 *  handheld roll drift. pos / look may be functions of the frame (tracking). */
/** v3 (after feedback "every frame is an eye or a head"): no punch-zoom, only a barely-there drift in, and a minimum
 *  distance so people are framed waist-up or wider (look lowered from face to chest) and Mike always has room around him.
 *  o.keep skips the clamp (text / object inserts). */
const M = (pos: P, look: P, f0: number, o: MO & { keep?: boolean } = {}) => (f: number): Shot => {
  let L = val(look, f), P0 = val(pos, f);
  if (!o.keep) {
    const person = L[1] >= 1.35, dmin = o.dmin ?? (person ? 2.8 : 1.9);
    if (person) { L = [L[0], L[1] - 0.3, L[2]]; P0 = [P0[0], P0[1] - 0.3, P0[2]]; }
    const d: V3 = [P0[0] - L[0], P0[1] - L[1], P0[2] - L[2]], n = Math.hypot(...d);
    if (n < dmin) P0 = [L[0] + (d[0] * dmin) / n, L[1] + (d[1] * dmin) / n, L[2] + (d[2] * dmin) / n];
  }
  const x = Math.max(0, f - f0), T = o.T ?? 60;
  const k = Math.exp(-Math.min(o.push ?? 0.007, 0.0015) * ease(x, T));
  const a = (o.orbit ?? 0.005) * 0.6 * ease(x, T * 1.6);
  const dx = P0[0] - L[0], dz = P0[2] - L[2], ca = Math.cos(a), sa = Math.sin(a);
  return {
    pos: [L[0] + (dx * ca - dz * sa) * k, L[1] + (P0[1] - L[1]) * k + (o.rise ?? 0) * ease(x, T) / T, L[2] + (dx * sa + dz * ca) * k],
    look: L, fov: o.fov ?? 42, roll: (o.roll ?? 0) * 0.5 + (o.drift ?? 0.006) * 0.5 * Math.sin(f * 0.06 + f0),
  };
};
/** one setup: from frame f, camera fn, lens blur (cInf) and focus point */
type Setup = [number, (f: number) => Shot, number, P?, number?];
/** foreground framing element per setup: 0 none, +-1 = screen side (world.ts places a set-appropriate object there) */
const FG: Record<number, { f: number; side: number }[]> = {};
const seq = (id: number, list: Setup[]) => {
  CAMS[id] = list.map(([f, s], i) => (i ? { f, cut: true, s } : { f, s }));
  DOF[id] = list.map(([f, , cInf, fp]) => ({ f, cInf, focus: fp ? (g: number) => val(fp, g) : undefined }));
  FG[id] = list.map(([f, , , , fg]) => ({ f, side: fg ?? 0 }));
};
export const fgAt = (id: number, f: number) => { const L = FG[id] ?? []; let i = 0; while (i + 1 < L.length && f >= L[i + 1].f) i++; return L[i]?.side ?? 0; };
const gl = (u: number) => { const x = Math.max(0, Math.min(1, u)); return x * x * x * (x * (6 * x - 15) + 10); };
/** production grammar around a subject centre (x, z): establishing crane, eye-level drift, low hero angle, three-quarter,
 *  high angle, lateral dolly, telephoto past a foreground element. No push-ins: every move is lateral / vertical. */
type G = "est" | "front" | "low" | "threeq" | "high" | "truck" | "tele";
const grammar = (g: G, f0: number, x: number, z: number, d0: number, sg: number, wide: boolean): Setup => {
  const lk: V3 = [x, 1.15, z], focus: V3 = [x, 1.05, z];
  switch (g) {
    case "est": return [f0, M((f: number) => { const u = gl((f - f0) / 110); return [x + 1.6 * sg - 0.6 * sg * u, 4.4 - 2.2 * u, z + d0 + 3.2 - 0.8 * u]; }, [x, 1.0, z], f0, { fov: 42, orbit: 0, push: 0, ...K }), 3, focus, 0];
    case "front": return [f0, M((f: number) => [x - 0.5 * sg + 0.004 * sg * Math.min(240, f - f0), 1.45, z + d0], lk, f0, { fov: 42, orbit: 0, push: 0, ...K }), 4, focus, 0];
    case "low": return [f0, M((f: number) => [x + 0.7 * sg, 0.62 + 0.0012 * Math.min(200, f - f0), z + d0 - 0.3], [x, 1.5, z], f0, { fov: 46, orbit: 0.0015 * sg, push: 0, ...K }), 4, focus, 0];
    case "threeq": return [f0, M([x + (wide ? 3.4 : 2.6) * sg, 1.35, z + d0 * 0.78], [x - 0.3 * sg, 1.15, z], f0, { fov: 40, orbit: 0.0022 * sg, push: 0, ...K }), 4, focus, -sg];
    case "high": return [f0, M([x + 0.5 * sg, 3.5, z + d0 + 0.8], [x, 0.85, z], f0, { fov: 44, orbit: 0.0018 * sg, push: 0, ...K }), 3, focus, 0];
    case "truck": return [f0, M((f: number) => [x + sg * (-1.3 + 2.6 * gl((f - f0) / 170)), 1.32, z + d0 + 0.6], (f: number) => [x + sg * (-0.4 + 0.8 * gl((f - f0) / 170)), 1.15, z], f0, { fov: 38, orbit: 0, push: 0, ...K }), 5, focus, sg];
    case "tele": return [f0, M((f: number) => [x + 1.1 * sg - 0.002 * sg * Math.min(200, f - f0), 1.42, z + d0 * 1.9], lk, f0, { fov: 27, orbit: 0, push: 0, ...K }), 7, focus, sg];
  }
};
const ORDER: G[][] = [["front", "threeq", "low", "tele", "high", "truck"], ["threeq", "tele", "front", "low", "truck", "high"], ["low", "truck", "threeq", "front", "tele", "high"]];
export const CUTS: number[] = [];

const INS = (f0: number, d = 2.8, dy = 0.22, dx = 0) => M([6 + dx, 1.6 - dy, d], [6, 1.6 - dy, 0], f0, { fov: 40, orbit: 0.0015, keep: true });
const K = { keep: true };
import WJ from "./words.json";
const WORDS = (WJ as unknown as { words: { w: string; s: number; e: number; line: number }[] }).words;
/** in-shot cut frames: on word onsets roughly every `every` seconds inside [a, b) (frames) */
const cutsIn = (a: number, b: number, every = 5.5) => {
  const out: number[] = [];
  let next = a / FPS + every;
  for (const w of WORDS) { const f = Math.round(w.s * FPS) - 2; if (w.s >= next && f < b - FPS * 1.6) { out.push(f); next = w.s + every; } }
  return out;
};
type Kind = ["stage", number, number] | ["hotel"] | ["ins", number?, number?] | ["tower", number?] | ["wide", number, number] | ["car"] | ["escape"] | ["alca"];
const KIND: Record<number, Kind> = {
  1: ["hotel"], 2: ["tower"], 3: ["hotel"], 4: ["wide", 0, -2.6], 5: ["stage", 0, -1.8], 6: ["wide", 0, -2.2], 7: ["stage", 0, -2.0], 8: ["wide", 0, -2.2],
  9: ["ins", 1.15], 10: ["stage", 0.3, -2.3], 11: ["stage", 0.3, -2.0], 12: ["ins", 1.15], 13: ["stage", 0, -2.0], 14: ["stage", -3.0, -2.1], 15: ["tower"], 16: ["tower", 0],
  17: ["stage", 0, -2.2], 18: ["ins", 1.0], 19: ["wide", 0, -2.3], 20: ["stage", 0, -1.9], 21: ["ins", 1.0, 1.28], 22: ["ins", 1.5, 0.57], 23: ["wide", -0.6, -2.4],
  24: ["hotel"], 25: ["hotel"], 26: ["stage", 0, -1.8], 27: ["hotel"], 28: ["hotel"], 29: ["car"], 30: ["hotel"],
  31: ["stage", -0.6, -2.0], 32: ["stage", 0, -1.8], 33: ["stage", 0, -1.9], 34: ["stage", 0, -1.8], 35: ["stage", 0, -1.9], 36: ["stage", 0, -1.8], 37: ["stage", 0, -1.9],
  38: ["wide", -0.8, -2.0], 39: ["wide", 0, -2.2], 40: ["stage", 0, -1.8], 41: ["stage", 0, -2.0], 42: ["tower", 0], 43: ["hotel"], 44: ["wide", 0, -2.2], 45: ["ins", 1.15],
  46: ["stage", 0, -2.2], 47: ["stage", 0, -2.3], 48: ["wide", 0.3, -2.3], 49: ["wide", 0.6, -2.3], 50: ["wide", 0.3, -2.3], 51: ["stage", 0, -1.9], 52: ["wide", 0.4, -2.4],
  53: ["wide", -2.4, -2.0], 54: ["stage", 0, -2.1], 55: ["ins", 1.3, 0.75], 56: ["stage", 0, -2.1], 57: ["wide", 0, -2.3], 58: ["stage", 0, -1.8], 59: ["stage", -0.8, -1.9],
  60: ["wide", 0, -2.1], 61: ["stage", 0, -2.2], 62: ["stage", 0, -1.9], 63: ["wide", 0, -2.1], 64: ["stage", 0, -2.2], 65: ["escape"], 66: ["wide", 0, -2.1],
  67: ["wide", -0.4, -2.6], 68: ["alca"], 69: ["stage", -0.6, -2.4], 70: ["ins", 1.15], 71: ["tower", 0],
};
const setups = (id: number): Setup[] => {
  const a = S(id), b = SHOTS[id - 1].b, k = KIND[id], cs = cutsIn(a, b), all = [a, ...cs];
  const pick = <T,>(arr: T[], i: number) => arr[i % arr.length];
  const sgn = (i: number) => (i % 2 ? -1 : 1);
  switch (k[0]) {
    case "ins": { const w = k[1] ?? 1.15, h = w * (k[2] ?? 1.27), d = Math.max(1.6, 1.75 * h, 1.05 * w); return all.map((f, i) => [f, INS(f, d * (i % 2 ? 0.95 : 1), 0, 0), 2, [6, 1.6, 0]] as Setup); }
    case "hotel": {
      const V: [V3, V3, V3][] = [[[0, 1.75, 3.6], [-0.5, 1.25, -2.7], [-0.5, 1.1, -2.7]], [[-1.0, 1.45, 0.9], [-3.3, 1.3, -1.9], [-3.3, 1.1, -1.9]], [[-2.0, 1.5, 1.3], [0.5, 1.25, -3.0], [0.5, 1.1, -3.0]]];
      const X: Setup[] = [];
      const extra = (f: number, j: number): Setup => {
        switch (j % 4) {
          case 0: return [f, M([0.4, 3.5, 2.0], [0, 0.85, -2.5], f, { fov: 46, orbit: 0.0016, push: 0, ...K }), 3, [0, 0.9, -2.5], 0];                       // high over the table
          case 1: return [f, M((g: number) => [-2.4 + 4.8 * gl((g - f) / 200), 1.32, 1.5], (g: number) => [-1.2 + 2.4 * gl((g - f) / 200), 1.2, -2.8], f, { fov: 40, orbit: 0, push: 0, ...K }), 5, [0, 1.1, -2.8], 1]; // dolly along the table
          case 2: return [f, M([-4.7, 0.75, 0.4], [-0.5, 1.45, -2.7], f, { fov: 44, orbit: -0.0012, push: 0, ...K }), 4, [-1.5, 1.1, -2.5], 0];             // low from the table end
          default: return [f, M([2.2, 1.45, 5.6], [-0.6, 1.2, -2.6], f, { fov: 27, orbit: 0, push: 0, ...K }), 7, [-0.6, 1.1, -2.6], -1];                     // telephoto past a palm
        }
      };
      all.forEach((f, i) => {
        if (i === 0 && (id === 1 || SHOTS[id - 2].set !== "hotel")) { X.push([f, M((g: number) => { const u = gl((g - f) / 110); return [1.4 - 0.6 * u, 4.2 - 2.0 * u, 5.4 - 1.0 * u]; }, [-0.4, 1.1, -2.6], f, { fov: 44, orbit: 0, push: 0, ...K }), 3, [-0.4, 1.0, -2.6], 0]); return; }
        if (i % 2 === 1) { X.push(extra(f, (i >> 1) + id)); return; }
        const v = pick(V, i >> 1); X.push([f, M(v[0], v[1], f, { fov: i % 3 ? 42 : 46, orbit: 0.002 * sgn(i), push: 0, ...K }), 4, v[2], 0]);
      });
      return X;
    }
    case "tower": {
      const x = k[1];
      // look-up at the tower from far enough back that the people stand whole in the lower third (not heads poking in)
      const list: Setup[] = [[a, M([(x ?? 0) + 0.6, 1.35, 7.0], [0, 8, -55], a, { fov: 54, orbit: 0.0008, ...K }), 2, [0, 20, -55]]];
      cs.forEach((f, i) => list.push(i % 2 === 0 && x !== undefined ? [f, M([x + 0.4, 1.4, 1.6], [x, 1.2, -2.3], f, { fov: 42, orbit: 0.003, ...K }), 4, [x, 1.1, -2.2]] : [f, M([(x ?? 0) - 1.6, 1.3, 7.2], [0, 8.5, -55], f, { fov: 54, orbit: -0.0008, ...K }), 2, [0, 20, -55]]));
      return list;
    }
    case "car": return [[a, M((f: number) => [-4 + 3.2 * Math.min(1.6, f / FPS - a / FPS) + 0.6, 1.4, 2.4], (f: number) => [-4 + 3.2 * Math.min(1.6, f / FPS - a / FPS) + 0.4, 1.4, -2.4], a, { fov: 44, orbit: 0, ...K }), 4, [0, 1.2, -2.4]],
      ...cs.map((f, i) => [f, M([0, 1.0, 3.6], [0, 12, -55], f, { fov: 50, orbit: 0.001 * sgn(i), ...K }), 2, [0, 20, -55]] as Setup)];
    case "escape": return [[a, M([0.6, 2.0, -1.4], [0.6, 3.3, -6.4], a, { fov: 46, orbit: 0.0015, ...K }), 3, [0.6, 3.2, -6.3]], ...cs.map((f, i) => [f, M([-1.2, 1.4, -2.0], [0.6, 2.6, -6.3], f, { fov: 44, orbit: -0.002, ...K }), 3, [0.6, 2.4, -6.3]] as Setup)];
    case "alca": { const pf = F(at(73, "prisoner")) - 2; return [[a, M([0, 2.4, 6], [0, 14, -100], a, { fov: 46, orbit: 0.001, ...K }), 1.5, [0, 14, -100]], [pf, M([0.2, 1.4, 1.9], [0, 1.2, -1.8], pf, { fov: 42, orbit: 0.003, ...K }), 4, [0, 1.1, -1.7]]]; }
    default: {
      const [, x, z] = k as ["stage" | "wide", number, number], wide = k[0] === "wide";
      const d0 = wide ? 4.6 : 3.4, ord = ORDER[id % 3], est = id === 1 || SHOTS[id - 2].set !== SHOTS[id - 1].set;
      const set = SHOTS[id - 1].set, tight = set === "cell";
      return all.map((f, i) => {
        let g: G = i === 0 && est ? "est" : ord[(i + id) % ord.length];
        if (tight && (g === "threeq" || g === "truck" || g === "tele" || g === "est")) g = i % 2 ? "front" : "low";
        return grammar(g, f, x, z, d0, sgn(i + id), wide);
      });
    }
  }
};
for (let id = 1; id <= SHOTS.length; id++) seq(id, setups(id));

for (const id in CAMS) for (const k of CAMS[id]) if (k.cut) CUTS.push(k.f);

export const camAt = (id: number, f: number): Cam => applyKick(runKeys(CAMS[id], f), f / FPS);
export const dofAt = (id: number, f: number) => {
  const L = DOF[id];
  let i = 0; while (i + 1 < L.length && f >= L[i + 1].f) i++;
  const d = L[i], p = L[Math.max(0, i - 1)];
  const k = d.dur ? glide((f - d.f) / d.dur) : 1;
  return { cInf: p.cInf + (d.cInf - p.cInf) * k, focus: d.focus };
};
