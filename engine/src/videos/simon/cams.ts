// Camera keys and lens blur per shot for the Simon short (9:16) (cameras mostly on +z looking -z: +x = screen right).
// v2 "RicksClips pacing": 2-5 setups per line, hard cuts on words, every setup pushes in fast AND orbits the subject
// (parallax), low / dutch angles, big subjects.
import { tcam } from "./theatre";
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
  // repo camera rule: every hold creeps in continuously (0.15 %/f), capped at -22 % distance so it never ends on a face
  const k = o.drift === 0 ? 1 : Math.max(0.78, Math.exp(-0.0015 * x)); // locked loop setups (STILL) stay put
  const a = (o.orbit ?? 0.005) * 0.6 * ease(x, T * 1.6);
  const dx = P0[0] - L[0], dz = P0[2] - L[2], ca = Math.cos(a), sa = Math.sin(a);
  return {
    pos: [L[0] + (dx * ca - dz * sa) * k, L[1] + (P0[1] - L[1]) * k + (o.rise ?? 0) * ease(x, T) / T, L[2] + (dx * sa + dz * ca) * k],
    look: L, fov: o.fov ?? 42, roll: (o.roll ?? 0) * 0.5, // repo: no hand-held float
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
export const CUTS: number[] = [];
const K = { keep: true, drift: 0.003 };
/** static-ish setup: lateral drift d (m over 200 f) along x, optional rise */
const D = (pos: V3, look: V3, f0: number, o: { fov?: number; dx?: number; dy?: number; dz?: number; still?: boolean } = {}) =>
  M((f: number) => { const u = gl((f - f0) / 200); return [pos[0] + (o.dx ?? 0.25) * u, pos[1] + (o.dy ?? 0) * u, pos[2] + (o.dz ?? 0) * u]; }, look, f0, { fov: o.fov ?? 44, orbit: 0, push: 0, ...K, ...(o.still ? { drift: 0 } : {}) });
/** crane: from a to b over n frames (glide), looking at L */
const CR = (a: V3, b: V3, L: V3 | ((f: number) => V3), f0: number, n = 90, fov = 44) =>
  M((f: number) => { const u = gl((f - f0) / n); return [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, a[2] + (b[2] - a[2]) * u]; }, L, f0, { fov, orbit: 0, push: 0, ...K });
/** locked-off setup (no drift, no roll): used for the loop frame */
const STILL = (pos: V3, look: V3, f0: number, fov = 46) => M(pos, look, f0, { fov, orbit: 0, push: 0, keep: true, drift: 0 });
// geography (sets.ts): DECK the ship along x (bow +x), deck y 1.6; the ceremony crate at CER (-6.5, 1.6, 0) with the cat
// on it (y 2.2) facing -z, the admiral at (-5.5, 1.6, -0.5), the crew ranks at z 1.6 / 2.7 facing -z, so cameras sit on
// the -z side. DOCK gangway GANG0 (-3, 0.9, 6) -> GANG1 (-3, 2.1, 2.7). CABIN bunk BUNK (0.6, 0.62, -0.8), blast wall x -2.4,
// chart CHART (-1, 1.55, -1.47). HOLD rats run +x along z -1.2..1, ration crate RATC (1.2, 0, 0.9), tally TALLY (-1.6, 1.5,
// -1.93), the giant rat at (1.6, 0, 0.3); the post room desk MAILD (14, 0, 0).
// Camera rule (learned 2026-11-23): the camera moves only on a story event. Gentle push / pan / pull (0.6-1.5 s,
// ease-in-out) for transitions; a fast push (~0.28 s, ease-out) only for a reveal or a key number, then pull out or pan.
const HOOK_POS: V3 = [-5.4, 3.0, -3.9], HOOK_LOOK: V3 = [-6.4, 2.3, 0.6];
const HOOK = (f0: number) => STILL(HOOK_POS, HOOK_LOOK, f0, 50);
const L = (line: number, w: string, n = 0) => (n ? atN(line, w, n) : at(line, w));
const r = (id: number, t: number) => t - S(id) / FPS;
type TK = Parameters<typeof tcam>[2][number];
const tc = (id: number, keys: TK[], name = "") => tcam("s" + id + name, S(id), keys);
const sh = (id: number) => r(id, SHOTS[id - 1].b / FPS);
void CR; void D; void W;

seq(1, [[S(1), tc(1, [
  { t: 0, pos: HOOK_POS, look: HOOK_LOOK, fov: 50 },
  { t: r(1, L(0, "medal")) - 0.05, pos: HOOK_POS, look: HOOK_LOOK, fov: 50, ease: "lin" },
  { t: r(1, L(0, "medal")) + 0.28, pos: [-6.2, 2.55, -1.3], look: [-6.5, 2.35, 0.0], fov: 44, ease: "out" },          // the medal: fast push
  { t: sh(1) + 1, pos: [-6.0, 2.65, -1.7], look: [-6.5, 2.35, 0.0], fov: 46, ease: "io" },                             // then ease back
]), 2, [-6.5, 2.35, 0]]]);
seq(2, [[S(2), tc(2, [
  { t: 0, pos: [-6.3, 2.55, -1.6], look: [-6.5, 2.45, 0.4], fov: 46 },
  { t: sh(2) + 1, pos: [-6.35, 2.5, -1.3], look: [-6.5, 2.45, 0.4], fov: 46, ease: "io" },
]), 2.5, [-6.5, 2.4, 0]]]);
seq(3, [[S(3), tc(3, [
  { t: 0, pos: [-3.4, 3.9, -0.9], look: [-3.0, 1.4, 5.2], fov: 46 },
  { t: sh(3) + 1, pos: [-3.35, 3.7, -0.6], look: [-3.0, 2.1, 3.4], fov: 46, ease: "io" },                                // tilt with him up the gangway
]), 1.5, [-3, 1.6, 4.5]]]);
seq(4, [[S(4), tc(4, [
  { t: 0, pos: [14, 5.5, -24], look: [0, 2.5, 0], fov: 46 },
  { t: r(4, L(2, "fire")) - 0.05, pos: [12, 5.0, -21], look: [0, 2.5, 0], fov: 46, ease: "io" },
  { t: r(4, L(2, "fire")) + 0.25, pos: [10, 4.2, -15], look: [0, 2.6, 0], fov: 44, ease: "out" },
  { t: sh(4) + 1, pos: [9.6, 4.3, -15.6], look: [-2, 2.8, -10], fov: 48, ease: "io" },                                // pan to the bank guns
]), 1, [0, 2.5, 0]]]);
seq(5, [[S(5), tc(5, [
  { t: 0, pos: [1.3, 1.25, 1.3], look: [0.75, 0.72, -0.85], fov: 46 },
  { t: r(5, L(3, "tore")) - 0.05, pos: [1.25, 1.2, 1.15], look: [0.75, 0.72, -0.85], fov: 46, ease: "lin" },
  { t: r(5, L(3, "tore")) + 0.9, pos: [1.8, 1.6, 1.4], look: [-0.6, 1.1, -0.4], fov: 52, ease: "io" },                 // whip round to the blast
  { t: sh(5) + 1, pos: [1.8, 1.6, 1.42], look: [-0.6, 1.1, -0.4], fov: 52, ease: "lin" },
]), 2, [1.3, 0.7, -1]]]);
seq(6, [[S(6), tc(6, [                                                                                                   // reaction close-up
  { t: 0, pos: [1.45, 1.2, 1.1], look: [1.0, 1.02, -0.7], fov: 42 },
  { t: sh(6) + 1, pos: [1.42, 1.18, 1.0], look: [1.0, 1.02, -0.7], fov: 42, ease: "lin" },
]), 3, [1.2, 0.8, -0.75]]]);
seq(7, [[S(7), tc(7, [
  { t: 0, pos: [-1.0, 1.55, 1.2], look: [-1.0, 1.55, -1.47], fov: 44 },
  { t: sh(7) + 1, pos: [-1.0, 1.55, 1.05], look: [-1.0, 1.55, -1.47], fov: 44, ease: "io" },
]), 0, [-1, 1.55, -1.47]]]);
seq(8, [[S(8), tc(8, [
  { t: 0, pos: [0.6, 1.5, 3.8], look: [-0.8, 0.5, 0], fov: 50 },
  { t: r(8, L(6, "attacked")) - 0.1, pos: [0.7, 1.4, 3.5], look: [-0.2, 0.5, 0], fov: 50, ease: "io" },
  { t: r(8, L(6, "attacked")) + 0.6, pos: [1.6, 1.3, 2.9], look: [2.1, 1.1, 0.5], fov: 46, ease: "io" },                // pan to the sailor on the crate
  { t: sh(8) + 1, pos: [1.6, 1.3, 2.92], look: [2.1, 1.1, 0.5], fov: 46, ease: "lin" },
]), 1.5, [0, 0.4, 0]]]);
seq(9, [[S(9), tc(9, [
  { t: 0, pos: [1.55, 1.05, 2.7], look: [1.25, 0.5, 0.9], fov: 42 },
  { t: sh(9) + 1, pos: [1.5, 0.95, 2.45], look: [1.25, 0.5, 0.9], fov: 42, ease: "io" },
]), 2.5, [1.2, 0.5, 0.9]]]);
seq(10, [[S(10), tc(10, [
  { t: 0, pos: [-1.0, 1.0, 3.0], look: [-1.8, 0.7, -0.4], fov: 50 },
  { t: r(10, L(8, "another")) - 0.3, pos: [-0.7, 0.85, 3.1], look: [-1.2, 0.6, -0.4], fov: 50, ease: "io" },
  { t: r(10, L(8, "another")) + 0.6, pos: [-1.2, 1.4, 2.6], look: [-1.6, 1.4, -1.93], fov: 48, ease: "io" },          // tilt up to the tally
  { t: sh(10) + 1, pos: [-1.2, 1.42, 2.55], look: [-1.6, 1.4, -1.93], fov: 48, ease: "lin" },
]), 1.5, [-1.6, 0.8, -0.5]]]);
seq(11, [[S(11), tc(11, [
  { t: 0, pos: [0.1, 0.6, 1.9], look: [0.1, 0.4, -0.75], fov: 50 },
  { t: r(11, L(9, "giant")) - 0.05, pos: [0.1, 0.6, 1.85], look: [0.1, 0.4, -0.75], fov: 50, ease: "lin" },
  { t: r(11, L(9, "giant")) + 0.28, pos: [0.25, 0.7, 0.55], look: [1.0, 0.5, -0.75], fov: 44, ease: "out" },   // reveal: fast push
  { t: r(11, L(9, "mao")) + 0.6, pos: [0.1, 0.62, 1.8], look: [0.1, 0.45, -0.75], fov: 50, ease: "io" },       // then pull out: the stand-off
  { t: sh(11) + 1, pos: [0.1, 0.62, 1.82], look: [0.1, 0.45, -0.75], fov: 50, ease: "lin" },
]), 2, [0.1, 0.4, -0.75]]]);
seq(12, [[S(12), tc(12, [
  { t: 0, pos: [-5.6, 2.8, -2.9], look: [-6.3, 2.4, 0.3], fov: 48 },
  { t: r(12, L(10, "able")) - 0.05, pos: [-5.7, 2.75, -2.6], look: [-6.3, 2.4, 0.3], fov: 48, ease: "io" },
  { t: r(12, L(10, "able")) + 0.28, pos: [-5.85, 2.75, -2.3], look: [-6.2, 2.55, 0.1], fov: 46, ease: "out" },
  { t: sh(12) + 1, pos: [-5.8, 2.8, -2.2], look: [-6.2, 2.5, 0.2], fov: 48, ease: "io" },
]), 2, [-6.3, 2.4, 0]]]);
seq(13, [[S(13), tc(13, [
  { t: 0, pos: [14.6, 1.7, 2.9], look: [14.4, 0.9, -0.4], fov: 50 },
  { t: sh(13) + 1, pos: [14.4, 1.4, 2.2], look: [14.2, 0.85, -0.3], fov: 48, ease: "io" },
]), 2, [14.2, 0.9, -0.3]]]);
seq(14, [[S(14), tc(14, [
  { t: 0, pos: [-5.5, 2.9, -3.4], look: [-6.4, 2.9, 0.8], fov: 50 },
  { t: sh(14) + 1, pos: [-5.6, 3.0, -3.8], look: [-6.4, 3.0, 0.8], fov: 50, ease: "io" },
]), 1.5, [-6.4, 2.8, 0.6]]]);
seq(15, [
  [S(15), tc(15, [
    { t: 0, pos: [-6.2, 2.6, -1.5], look: [-6.5, 2.4, 0.2], fov: 46 },
    { t: sh(15) + 1, pos: [-6.0, 2.8, -2.3], look: [-6.5, 2.4, 0.3], fov: 48, ease: "io" },
  ]), 2, [-6.5, 2.4, 0]],
  [W(13, "your"), HOOK(W(13, "your")), 2, [-6.5, 2.35, 0]],
]);
KICKS.push([at(2, "fire"), 0.05], [at(3, "tore") + 0.1, 0.07]);

for (const id in CAMS) for (const k of CAMS[id]) if (k.cut) CUTS.push(k.f);

export const camAt = (id: number, f: number): Cam => applyKick(runKeys(CAMS[id], f), f / FPS);
export const dofAt = (id: number, f: number) => {
  const L = DOF[id];
  let i = 0; while (i + 1 < L.length && f >= L[i + 1].f) i++;
  const d = L[i], p = L[Math.max(0, i - 1)];
  const k = d.dur ? glide((f - d.f) / d.dur) : 1;
  return { cInf: p.cInf + (d.cInf - p.cInf) * k, focus: d.focus };
};
