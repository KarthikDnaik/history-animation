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

import { sneak6X } from "./sets";
const tr = (fx: (t: number) => number, y: number, z: number, dx = 0) => (f: number): V3 => [fx(f / FPS) + dx, y, z];
/** insert card camera: cards hang at (6, 1.6, 0) */
const INS = (f0: number, d = 2.8, dy = 0.22) => M([6, 1.6 - dy, d], [6, 1.6 - dy, 0], f0, { fov: 42, orbit: 0.0015, keep: true });

// 1 hook: still fighting, 29 years after the war
seq(1, [
  [S(1), M([-0.4, 0.95, 3.2], [0.1, 1.05, -1.6], S(1), { fov: 44, orbit: 0.003, keep: true }), 6, [0.15, 1.0, -1.7]],
  [W(0, "twenty-nine"), M([-1.0, 1.45, 1.7], [-0.3, 1.3, -1.4], W(0, "twenty-nine"), { fov: 46, orbit: -0.003, keep: true }), 8, [-0.75, 1.5, -1.2]],
]);
// 2 1944: sent to Lubang. Never surrender.
seq(2, [
  [S(2), M([0.2, 1.5, 3.4], [0.0, 1.15, -1.8], S(2), { fov: 46, orbit: 0.003, keep: true }), 4, [0, 1.0, -1.8]],
  [W(1, "tiny"), INS(W(1, "tiny")), 2, [6, 1.6, 0]],
  [W(1, "with"), M([-0.6, 1.3, 2.5], [0.0, 1.1, -1.8], W(1, "with"), { fov: 46, orbit: 0.004, keep: true }), 6, [0, 1.0, -1.8]],
  [W(1, "never"), M([0.4, 0.55, 2.3], [0.0, 1.55, -1.8], W(1, "never"), { fov: 52, orbit: -0.003, keep: true }), 5, [0, 1.2, -1.8]],
]);
KICKS.push([C.never1 + 0.02, 0.12]);
// 3 a year later the war ended; nobody told Onoda
seq(3, [
  [S(3), M([0.4, 1.25, 2.7], [-0.1, 0.7, -2.0], S(3), { fov: 48, orbit: 0.003, keep: true }), 6, [0, 0.6, -2.0]],
  [W(2, "ended."), M([0.0, 2.0, 3.0], [0.2, 10.5, -12], W(2, "ended."), { fov: 56, orbit: 0.001, keep: true }), 2, [0.2, 11, -12]],
  [W(2, "nobody"), M([0.7, 1.15, 2.4], [0.0, 0.75, -1.9], W(2, "nobody"), { fov: 48, orbit: -0.004, keep: true }), 8, [0.3, 0.7, -1.8]],
]);
// 4 leaflets: the war is over. Nice try.
seq(4, [
  [S(4), M([0.2, 0.75, 2.9], [0.0, 3.0, -3.0], S(4), { fov: 56, orbit: 0.003, keep: true }), 3, [0, 2.5, -2.5]],
  [W(3, "saying"), M([0.5, 1.35, 1.5], [0.1, 1.1, -1.6], W(3, "saying"), { fov: 46, orbit: -0.003, keep: true }), 8, [0.1, 1.0, -1.6]],
  [W(3, "nice"), M([-0.4, 1.4, 2.9], [0.1, 1.1, -1.85], W(3, "nice"), { fov: 48, orbit: 0.003, keep: true }), 6, [0.1, 1.0, -1.8]],
]);
// 5 letters and photos from his family. Clever fakes.
seq(5, [
  [S(5), M([0.3, 1.45, 2.8], [0.2, 1.3, -1.6], S(5), { fov: 48, orbit: 0.003, keep: true }), 6, [0.5, 1.2, -1.5]],
  [W(4, "photos"), INS(W(4, "photos"), 3.3), 2, [6, 1.6, 0]],
  [W(4, "onoda"), M([0.0, 1.3, 2.7], [0.0, 1.1, -1.8], W(4, "onoda"), { fov: 48, orbit: -0.003, keep: true }), 6, [0, 1.0, -1.7]],
  [W(4, "clever"), M([0.9, 1.2, 2.1], [0.0, 1.1, -1.7], W(4, "clever"), { fov: 46, orbit: 0.004, keep: true }), 8, [0, 1.0, -1.6]],
]);
// 6 stealing rice and bananas; farmers; fighting
seq(6, [
  [S(6), M(tr(sneak6X, 1.3, 2.7, 0.2), tr(sneak6X, 1.0, -1.8, -0.4), S(6), { fov: 48, orbit: 0, keep: true }), 7, tr(sneak6X, 1.0, -1.8, -0.4)],
  [W(5, "farmers,"), M([-1.0, 1.4, 3.0], [-1.3, 1.0, -2.6], W(5, "farmers,"), { fov: 50, orbit: 0.003, keep: true }), 5, [-1.8, 1.0, -2.6]],
  [W(5, "fighting"), M([0.1, 1.2, 3.1], [-0.25, 1.0, -2.2], W(5, "fighting"), { fov: 50, orbit: -0.003, keep: true }), 5, [0, 1.0, -2.0]],
]);
// 7 for the islanders it was no joke (night, candles)
seq(7, [
  [S(7), M([0.0, 1.05, 2.5], [0.0, 0.85, -1.8], S(7), { fov: 46, orbit: 0.0015, keep: true }), 6, [0, 0.8, -1.8]],
  [W(5, "people"), M([0.25, 0.65, 1.5], [0.0, 0.75, -1.7], W(5, "people"), { fov: 44, orbit: -0.0015, keep: true }), 9, [0, 0.2, -1.3]],
]);
// 8 one by one his men were gone; one-man army
seq(8, [
  [S(8), M([0.1, 1.35, 3.1], [-0.4, 1.0, -2.0], S(8), { fov: 48, orbit: 0.003, keep: true }), 5, [-0.4, 1.0, -2.0]],
  [W(6, "1972,"), M([0.3, 1.25, 2.4], [-0.2, 1.15, -1.6], W(6, "1972,"), { fov: 46, orbit: -0.003, keep: true }), 7, [0, 1.0, -1.7]],
  [W(6, "one-man"), M([0.4, 0.5, 2.0], [0.0, 1.45, -1.7], W(6, "one-man"), { fov: 52, orbit: 0.004, keep: true }), 6, [0, 1.2, -1.7]],
]);
// 9 1974: Norio Suzuki, college dropout, backpacking trip
seq(9, [
  [S(9), M([3.4, 1.6, 2.8], [-1.6, 1.4, -2.6], S(9), { fov: 50, orbit: 0.002, keep: true }), 3, [-0.8, 1.0, -2.0]],
  [W(7, "suzuki"), M([0.3, 1.3, 2.5], [0.0, 1.15, -2.0], W(7, "suzuki"), { fov: 46, orbit: -0.003, keep: true }), 6, [0, 1.0, -2.0]],
]);
// 10 three things: Onoda, a panda, the Abominable Snowman. In that order.
seq(10, [
  [S(10), M([0.0, 1.45, 3.7], [0.0, 1.2, -1.9], S(10), { fov: 48, orbit: 0.003, keep: true }), 5, [0, 1.0, -1.8]],
  [W(8, "three"), INS(W(8, "three")), 2, [6, 1.6, 0]],
  [W(8, "abominable"), M([0.4, 1.4, 3.0], [0.0, 1.55, -1.9], W(8, "abominable"), { fov: 50, orbit: -0.003, keep: true }), 5, [0, 1.4, -1.8]],
  [W(8, "in"), M([-0.5, 1.3, 3.2], [0.0, 1.2, -1.9], W(8, "in"), { fov: 48, orbit: 0.004, keep: true }), 6, [0, 1.0, -1.8]],
]);
// 11 and somehow he actually found Onoda
seq(11, [
  [S(11), M([-0.5, 1.3, 3.3], [-1.1, 1.0, -1.9], S(11), { fov: 50, orbit: 0.003, keep: true }), 5, [-0.8, 1.0, -1.8]],
  [W(9, "found"), M([0.1, 1.2, 2.5], [0.1, 1.15, -1.9], W(9, "found"), { fov: 50, orbit: -0.004, keep: true }), 6, [0.1, 1.0, -1.9]],
]);
KICKS.push([C.found9 + 0.02, 0.2]);
// 12 refused; only his commanding officer could order that
seq(12, [
  [S(12), M([0.3, 1.3, 2.8], [0.0, 1.1, -1.85], S(12), { fov: 48, orbit: 0.003, keep: true }), 6, [0, 1.0, -1.85]],
  [W(10, "only"), M([1.0, 0.9, 1.9], [0.75, 1.6, -1.85], W(10, "only"), { fov: 50, orbit: -0.003, keep: true }), 6, [0.6, 1.4, -1.8]],
]);
// 13 his old commander... now selling books
seq(13, [
  [S(13), M([0.7, 1.7, 4.4], [0.3, 1.7, -4.0], S(13), { fov: 50, orbit: 0.002, keep: true }), 3, [-0.5, 1.2, -3.3]],
  [W(11, "who"), M([0.0, 1.3, 0.4], [-0.6, 1.15, -3.3], W(11, "who"), { fov: 46, orbit: -0.003, keep: true }), 6, [-0.6, 1.0, -3.3]],
]);
// 14 the bookseller flew in, read the order; Onoda handed over his rifle
seq(14, [
  [S(14), M([0.3, 0.95, 3.4], [0.0, 2.4, -3.0], S(14), { fov: 52, orbit: 0.003, keep: true }), 3, [0, 1.6, -2.4]],
  [W(12, "read"), INS(W(12, "read"), 3.4), 2, [6, 1.6, 0]],
  [W(12, "and"), M([0.0, 1.3, 2.8], [-0.1, 1.1, -1.8], W(12, "and"), { fov: 48, orbit: 0.003, keep: true }), 6, [-0.1, 1.0, -1.8]],
  [W(12, "handed"), M([1.0, 1.2, 2.2], [0.1, 1.0, -1.75], W(12, "handed"), { fov: 48, orbit: -0.003, keep: true }), 7, [0.3, 1.0, -1.7]],
  [W(12, "still"), M([0.8, 1.15, 1.9], [0.5, 1.0, -1.7], W(12, "still"), { fov: 46, orbit: 0.003, keep: true }), 8, [0.5, 1.0, -1.7]],
]);
// 15 the Philippine president pardoned him
seq(15, [[S(15), M([0.2, 1.4, 3.2], [0.25, 1.2, -1.5], S(15), { fov: 46, orbit: 0.003, keep: true }), 6, [0, 1.2, -1.4]]]);
// 16 Brazil: raise cattle
seq(16, [
  [S(16), M([0.3, 1.35, 3.4], [0.0, 0.9, -2.4], S(16), { fov: 50, orbit: 0.003, keep: true }), 5, [0, 0.9, -2.3]],
  [W(13, "cattle."), M([1.5, 1.05, 1.8], [0.55, 0.9, -2.2], W(13, "cattle."), { fov: 48, orbit: -0.004, keep: true }), 7, [1.1, 0.8, -2.3]],
]);
// 17 never found the panda. One out of three. Not bad for a gap year.
seq(17, [
  [S(17), M([0.0, 1.3, 2.7], [0.2, 1.2, -1.6], S(17), { fov: 48, orbit: 0.003, keep: true }), 6, [0.2, 1.1, -1.6]],
  [W(14, "one"), M([0.9, 1.65, 1.2], [0.75, 1.65, -1.5], W(14, "one"), { fov: 44, orbit: -0.003, keep: true }), 9, [0.75, 1.7, -1.5]],
  [W(14, "not"), M([-0.4, 1.3, 3.0], [0.1, 1.2, -1.7], W(14, "not"), { fov: 48, orbit: 0.003, keep: true }), 5, [0, 1.1, -1.7]],
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
