// Camera keys and lens blur per shot for the Onoda short (cameras mostly on +z looking -z: +x = screen right).
// v2 "RicksClips pacing": 2-5 setups per line, hard cuts on words, every setup pushes in fast AND orbits the subject
// (parallax), low / dutch angles, big subjects.
import { C } from "./cues";
import { SHOTS, Key, Shot, V3, fr, runKeys, pushK, applyKick, KICKS, Cam, glide, FPS, at } from "./story";

const S = (id: number) => SHOTS[id - 1].a;
const F = fr;
/** cut frame for a narration word: 2 f before its onset */
const W = (line: number, word: string) => F(at(line, word)) - 2;
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
type Setup = [number, (f: number) => Shot, number, P?];
const seq = (id: number, list: Setup[]) => {
  CAMS[id] = list.map(([f, s], i) => (i ? { f, cut: true, s } : { f, s }));
  DOF[id] = list.map(([f, , cInf, fp]) => ({ f, cInf, focus: fp ? (g: number) => val(fp, g) : undefined }));
};
export const CUTS: number[] = [];

import { walk13X, march14X } from "./sets";
const tr = (fx: (t: number) => number, y: number, z: number, dx = 0) => (f: number): V3 => [fx(f / FPS) + dx, y, z];
/** insert card camera: cards hang at (6, 1.6, 0) */
const INS = (f0: number, d = 2.8, dy = 0.22) => M([6, 1.6 - dy, d], [6, 1.6 - dy, 0], f0, { fov: 42, orbit: 0.0015, keep: true });
const K = { keep: true };

// 1 World War Two. Tanks.
seq(1, [
  [S(1), M([0.0, 1.1, 4.4], [0.0, 1.7, -3.5], S(1), { fov: 50, orbit: 0.003, ...K }), 3, [0, 1.5, -3]],
  [W(0, "tanks."), M([-1.2, 0.55, 2.2], [0.6, 1.0, -4.2], W(0, "tanks."), { fov: 50, orbit: -0.004, ...K }), 4, [0.5, 0.9, -4.2]],
]);
// 2 Machine guns.
seq(2, [[S(2), M([4.6, 1.15, -1.4], [2.8, 1.0, -7.0], S(2), { fov: 50, orbit: 0.004, ...K }), 3, [3.6, 0.8, -4.6]]]);
// 3 Bombers.
seq(3, [[S(3), M([0.0, 0.6, 3.0], [0.5, 7.0, -10], S(3), { fov: 58, orbit: 0.002, ...K }), 2, [0, 8, -10]]]);
// 4 And then there was Jack Churchill... who brought a bow and arrow.
seq(4, [
  [S(4), M([0.0, 1.4, 3.6], [0.0, 1.2, -1.85], S(4), { fov: 48, orbit: 0.003, ...K }), 5, [0, 1.0, -1.8]],
  [W(1, "who"), M([-0.7, 1.05, 2.5], [0.05, 1.2, -1.75], W(1, "who"), { fov: 48, orbit: 0.004, ...K }), 6, [0, 1.0, -1.7]],
]);
// 5 Seriously. In France, he shot a German soldier with a longbow.
seq(5, [
  [S(5), M([-0.3, 1.3, 2.7], [-0.8, 1.2, -1.7], S(5), { fov: 48, orbit: 0.003, ...K }), 6, [-1.0, 1.0, -1.7]],
  [W(2, "he"), M([-2.2, 1.2, 1.5], [-0.6, 1.25, -1.8], W(2, "he"), { fov: 48, orbit: -0.003, ...K }), 6, [-1.0, 1.1, -1.7]],
  [W(2, "with"), M([-2.0, 1.6, 2.2], [1.6, 1.1, -4.0], W(2, "with"), { fov: 52, orbit: 0.002, ...K }), 2, [1.6, 1.1, -4.0]],
  [W(2, "longbow."), M([2.4, 1.3, -2.4], [4.2, 0.9, -6.2], W(2, "longbow."), { fov: 48, orbit: 0.004, ...K }), 5, [4.2, 0.8, -6.2]],
]);
KICKS.push([C.longbow2 + 0.02, 0.18]);
// 6 It's the only known longbow kill of the entire war.
seq(6, [
  [S(6), INS(S(6), 3.3), 2, [6, 1.6, 0]],
  [W(3, "entire"), M([0.4, 1.35, 3.2], [0.0, 1.15, -1.85], W(3, "entire"), { fov: 48, orbit: -0.003, ...K }), 5, [0, 1.0, -1.8]],
]);
// 7 In Norway, he jumped off the landing boat wearing a kilt... playing the bagpipes.
seq(7, [
  [S(7), M([0.3, 2.1, 3.8], [0.0, 1.1, -3.6], S(7), { fov: 52, orbit: 0.003, ...K }), 3, [0, 1.1, -3.2]],
  [W(4, "kilt…"), M([0.7, 0.85, 1.6], [0.0, 0.95, -1.6], W(4, "kilt…"), { fov: 50, orbit: -0.004, ...K }), 6, [0, 0.8, -1.6]],
  [W(4, "playing"), M([-0.6, 1.4, 2.5], [0.0, 1.35, -1.6], W(4, "playing"), { fov: 50, orbit: 0.004, ...K }), 6, [0, 1.2, -1.6]],
]);
// 8 Then he went to fight.
seq(8, [[S(8), M([-0.8, 1.25, 2.8], [0.9, 1.2, -1.9], S(8), { fov: 52, orbit: 0.005, ...K }), 4, [0.8, 1.0, -1.8]]]);
// 9 His rule? "Any officer ... improperly dressed." And he meant it.
seq(9, [
  [S(9), M([0.1, 1.35, 3.0], [0.1, 1.25, -1.8], S(9), { fov: 48, orbit: 0.003, ...K }), 5, [0, 1.1, -1.8]],
  [W(6, "improperly"), M([1.2, 1.3, 2.3], [0.6, 1.3, -1.9], W(6, "improperly"), { fov: 48, orbit: -0.003, ...K }), 6, [0.7, 1.2, -1.9]],
  [W(7, "and"), M([-0.9, 1.25, 2.5], [-0.45, 1.3, -1.7], W(7, "and"), { fov: 48, orbit: 0.004, ...K }), 6, [-0.5, 1.2, -1.7]],
]);
// 10 Italy: sword, one corporal, 42 prisoners
seq(10, [
  [S(10), M([-0.6, 1.4, 2.9], [-0.7, 1.3, -1.9], S(10), { fov: 48, orbit: 0.003, ...K }), 5, [-0.8, 1.1, -1.9]],
  [W(7, "captured"), M([0.4, 1.7, 3.9], [0.7, 1.2, -2.8], W(7, "captured"), { fov: 54, orbit: 0.002, ...K }), 3, [1.2, 1.1, -2.6]],
  [W(7, "forty-two"), M([0.4, 2.0, 4.6], [1.3, 1.6, -3.0], W(7, "forty-two"), { fov: 56, orbit: -0.003, ...K }), 3, [1.3, 1.4, -2.8]],
]);
// 11 caught, prison camp
seq(11, [
  [S(11), M([0.0, 1.35, 4.8], [0.0, 1.2, 0.0], S(11), { fov: 52, orbit: 0.003, ...K }), 4, [0, 1.0, 0.1]],
  [W(8, "put"), M([-0.5, 1.45, 2.6], [-0.6, 1.4, -1.6], W(8, "put"), { fov: 50, orbit: -0.003, ...K }), 4, [-1.0, 1.2, -2.0]],
]);
// 12 tunneled out; caught again
seq(12, [
  [S(12), M([0.1, 0.95, 4.0], [-0.3, 0.8, 0.4], S(12), { fov: 50, orbit: 0.004, ...K }), 5, [-0.6, 0.6, 0.5]],
  [W(9, "they"), M([0.0, 1.45, 5.2], [0.0, 1.15, 0.3], W(9, "they"), { fov: 52, orbit: -0.003, ...K }), 4, [0, 1.0, 0.3]],
]);
// 13 escaped again; walked into an American patrol
seq(13, [
  [S(13), M(tr(walk13X, 1.3, 3.0, 0.3), tr(walk13X, 1.15, -1.9, 0.2), S(13), { fov: 48, orbit: 0, ...K }), 5, tr(walk13X, 1.0, -1.85)],
  [W(9, "american"), M([0.7, 1.35, 3.3], [0.9, 1.15, -2.0], W(9, "american"), { fov: 50, orbit: 0.004, ...K }), 4, [0.8, 1.0, -2.0]],
]);
// 14 Burma; the war ended before he got there
seq(14, [
  [S(14), M(tr(march14X, 1.3, 2.8, 0.4), tr(march14X, 1.15, -1.7, 0.2), S(14), { fov: 48, orbit: 0, ...K }), 5, tr(march14X, 1.0, -1.7)],
  [W(10, "ended"), M([0.0, 2.0, 3.0], [0.2, 10.5, -12], W(10, "ended"), { fov: 56, orbit: 0.001, ...K }), 2, [0.2, 11, -12]],
  [W(10, "before"), M([0.5, 1.3, 2.7], [0.1, 1.2, -1.7], W(10, "before"), { fov: 48, orbit: -0.004, ...K }), 6, [0.1, 1.0, -1.7]],
]);
KICKS.push([C.ended10 + 0.02, 0.14]);
// 15 his reaction: those damned Yanks; another ten years
seq(15, [
  [S(15), M([0.2, 1.35, 3.2], [0.2, 1.2, -2.0], S(15), { fov: 48, orbit: 0.003, ...K }), 5, [0, 1.0, -1.9]],
  [W(11, "yanks,"), M([1.5, 1.3, 2.6], [0.5, 1.2, -2.2], W(11, "yanks,"), { fov: 48, orbit: -0.004, ...K }), 5, [0.6, 1.0, -2.2]],
  [W(11, "another"), M([-0.8, 1.45, 2.7], [-0.7, 1.55, -1.6], W(11, "another"), { fov: 48, orbit: 0.003, ...K }), 6, [-0.9, 1.4, -1.6]],
]);

for (const id in CAMS) for (const k of CAMS[id]) if (k.cut) CUTS.push(k.f);

export const camAt = (id: number, f: number): Cam => applyKick(runKeys(CAMS[id], f), f / FPS);
export const dofAt = (id: number, f: number) => {
  const L = DOF[id];
  let i = 0; while (i + 1 < L.length && f >= L[i + 1].f) i++;
  const d = L[i], p = L[Math.max(0, i - 1)];
  const k = d.dur ? glide((f - d.f) / d.dur) : 1;
  return { cInf: p.cInf + (d.cInf - p.cInf) * k, focus: d.focus };
};
