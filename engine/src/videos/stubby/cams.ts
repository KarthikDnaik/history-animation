// Camera keys and lens blur per shot for the Sergeant Stubby short (cameras mostly on +z looking -z: +x = screen right).
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

import { pup1X, run9X, spy10X, push16X } from "./sets";
const tr = (fx: (t: number) => number, y: number, z: number, dx = 0) => (f: number): V3 => [fx(f / FPS) + dx, y, z];

// 1 a stray puppy wanders onto an army camp
seq(1, [
  [S(1), M([0.6, 2.3, 6.6], [0.4, 1.7, -5.0], S(1), { fov: 46, orbit: 0.003, keep: true }), 3, [0, 1.2, -4]],
  [W(0, "puppy"), M(tr(pup1X, 0.3, 0.55, 0.45), tr(pup1X, 0.2, -1.4, 0.15), W(0, "puppy"), { fov: 40, orbit: -0.003, dmin: 1.6 }), 10, tr(pup1X, 0.2, -1.4)],
  [W(0, "army"), M([0.5, 1.05, 2.7], [0.6, 0.85, -1.8], W(0, "army"), { fov: 44, orbit: 0.004 }), 6, [0.2, 0.6, -1.6]],
]);
// 2 named him Stubby. Mostly because of the tail.
seq(2, [
  [S(2), M([0.1, 1.25, 2.5], [0, 0.95, -1.8], S(2), { fov: 44, orbit: 0.004 }), 6, [0, 0.8, -1.6]],
  [W(1, "stubby"), M([0.6, 0.9, 1.4], [0.35, 0.75, -1.4], W(1, "stubby"), { fov: 46, orbit: -0.004, keep: true }), 8, [0.1, 0.4, -1.3]],
  [W(1, "tail"), M([-0.55, 0.32, 0.55], [-0.08, 0.22, -1.2], W(1, "tail"), { fov: 40, orbit: 0.003, keep: true }), 11, [-0.1, 0.2, -1.2]],
]);
// 3 the troops shipped out; dogs weren't allowed
seq(3, [
  [S(3), M([-2.6, 1.7, 5.6], [-1.8, 2.0, -4.0], S(3), { fov: 48, orbit: 0.003, keep: true }), 3, [-2.5, 1.2, -3]],
  [W(2, "dogs"), M([1.3, 0.75, 1.6], [2.0, 0.55, -0.8], W(2, "dogs"), { fov: 44, orbit: -0.004, keep: true }), 10, [1.9, 0.4, -0.75]],
]);
// 4 a private hid him under his coat. Very professional.
seq(4, [
  [S(4), M([0.35, 1.1, 2.5], [0.35, 0.95, -1.3], S(4), { fov: 44, orbit: 0.004 }), 7, [0.3, 0.9, -1.3]],
  [W(2, "hid"), M([-0.6, 1.45, 1.7], [0.1, 1.35, -1.4], W(2, "hid"), { fov: 42, orbit: 0.004 }), 9, [0.1, 1.3, -1.4]],
  [W(2, "very"), M([0.7, 1.5, 1.5], [0.1, 1.5, -1.4], W(2, "very"), { fov: 40, orbit: -0.004, roll: 0.03 }), 10, [0.1, 1.5, -1.4]],
]);
// 5 on the ship, the commanding officer found him
seq(5, [
  [S(5), M([0.25, 1.6, 3.4], [0.2, 1.3, -1.6], S(5), { fov: 46, orbit: 0.004 }), 5, [0, 1.2, -1.6]],
  [W(3, "officer"), M([-1.3, 1.5, 0.9], [0.9, 1.6, -1.8], W(3, "officer"), { fov: 42, orbit: -0.004, roll: -0.03 }), 10, [0.9, 1.5, -1.8]],
  [W(3, "found"), M([-0.2, 1.45, 1.6], [-0.35, 1.5, -1.5], W(3, "found"), { fov: 42, orbit: 0.004 }), 10, [-0.4, 1.4, -1.5]],
]);
KICKS.push([C.found + 0.02, 0.2]);
// 6 Stubby looked up... and saluted
seq(6, [
  [S(6), M([-0.7, 0.55, 1.4], [0.2, 0.95, -1.4], S(6), { fov: 46, orbit: 0.003, keep: true }), 8, [-0.35, 0.4, -1.0]],
  [W(4, "up"), M([0.15, 0.85, 1.9], [0.15, 0.9, -1.3], W(4, "up"), { fov: 46, orbit: -0.004 }), 6, [0.1, 0.7, -1.2]],
  [W(4, "saluted"), M([0.55, 0.42, 0.55], [-0.3, 0.45, -1.0], W(4, "saluted"), { fov: 40, orbit: 0.004, dmin: 1.7, roll: 0.03 }), 11, [-0.3, 0.45, -1.0]],
]);
// 7 the officer let him stay
seq(7, [
  [S(7), M([0.2, 1.0, 2.3], [0.2, 0.95, -1.4], S(7), { fov: 46, orbit: 0.004 }), 6, [0.2, 0.9, -1.4]],
  [W(5, "stay"), M([-0.5, 1.2, 2.7], [-0.75, 1.0, -1.6], W(5, "stay"), { fov: 46, orbit: -0.004 }), 6, [-0.8, 0.9, -1.6]],
]);
// 8 the trenches: Stubby hears the shells first
seq(8, [
  [S(8), M([5.2, 1.5, 1.4], [-3.0, 1.1, 0.2], S(8), { fov: 48, orbit: 0.002, keep: true }), 4, [0, 1.0, 0.4]],
  [W(6, "he"), M([1.7, 0.55, 2.35], [0.85, 0.42, 0.85], W(6, "he"), { fov: 42, orbit: -0.004, keep: true }), 10, [1.0, 0.42, 0.9]],
  [W(6, "before"), M([3.6, 1.0, 1.9], [-3.0, 2.2, -0.8], W(6, "before"), { fov: 52, orbit: 0.003, keep: true }), 4, [-1, 1.6, -1]],
]);
KICKS.push([C.shells + 1.22, 0.3]);
// 9 he could smell gas: runs down the trench barking until everyone put their masks on
seq(9, [
  [S(9), M([2.6, 1.3, 2.3], [-1.0, 1.9, -2.0], S(9), { fov: 48, orbit: 0.003, keep: true }), 5, [-1.0, 1.3, -0.9]],
  [W(6, "run"), M(tr(run9X, 0.75, 2.35, 1.0), tr(run9X, 0.55, 0.9, -0.4), W(6, "run"), { fov: 46, orbit: 0, keep: true }), 9, tr(run9X, 0.5, 0.9)],
  [W(6, "everyone"), M([4.6, 1.6, 2.0], [-3.0, 1.2, 0.3], W(6, "everyone"), { fov: 48, orbit: 0.002, keep: true }), 4, [-1, 1.1, 0.3]],
  [W(6, "masks"), M([1.2, 1.15, 2.35], [-1.6, 1.0, -0.6], W(6, "masks"), { fov: 48, orbit: -0.003, keep: true }), 6, [-1.2, 1.0, -0.5]],
]);
// 10 a stranger sneaking around the camp; Stubby didn't like him
seq(10, [
  [S(10), M([0.0, 1.5, 4.6], [-0.2, 1.1, -2.0], S(10), { fov: 46, orbit: 0.003 }), 5, tr(spy10X, 1.2, -2.4)],
  [W(7, "stubby"), M([1.9, 0.6, 1.4], [0.5, 0.75, -1.4], W(7, "stubby"), { fov: 46, orbit: -0.004, keep: true }), 9, [1.0, 0.4, -0.6]],
]);
// 11 turns out, he was a German spy
seq(11, [
  [S(11), M([0.25, 1.5, 1.2], [0.2, 1.6, -2.0], S(11), { fov: 42, orbit: 0.004 }), 9, [0.2, 1.6, -2.0]],
  [W(8, "german"), M([0.9, 1.25, 2.7], [0.6, 1.35, -1.6], W(8, "german"), { fov: 46, orbit: -0.004 }), 6, [0.4, 1.2, -1.8]],
]);
KICKS.push([C.german + 0.02, 0.25]);
// 12 Stubby grabbed him by the seat of his pants... until the soldiers arrived
seq(12, [
  [S(12), M([0.7, 1.3, 2.7], [0.0, 1.0, -1.6], S(12), { fov: 46, orbit: 0.004 }), 6, [0, 0.9, -1.6]],
  [W(9, "seat"), M([-1.7, 0.9, 1.9], [-0.1, 0.8, -1.5], W(9, "seat"), { fov: 44, orbit: 0.004, keep: true }), 9, [-0.1, 0.55, -1.5]],
  [W(9, "soldiers"), M([1.2, 1.5, 5.0], [1.25, 1.0, -1.7], W(9, "soldiers"), { fov: 52, orbit: -0.003 }), 5, [0.9, 1.0, -1.7]],
]);
KICKS.push([C.grabbed + 0.02, 0.3]);
// 13 promoted. To Sergeant.
seq(13, [
  [S(13), M([0, 1.3, 3.5], [0, 1.0, -1.8], S(13), { fov: 46, orbit: 0.003 }), 5, [0, 0.8, -1.6]],
  [W(10, "promoted"), M([0.65, 0.6, 1.0], [0.05, 0.6, -1.0], W(10, "promoted"), { fov: 42, orbit: -0.004, dmin: 1.8 }), 10, [0.05, 0.55, -1.0]],
  [W(10, "sergeant"), M([0.25, 1.0, 1.6], [0.05, 1.0, -1.0], W(10, "sergeant"), { fov: 44, orbit: 0.004, keep: true }), 9, [0.05, 0.9, -1.0]],
]);
// 14 technically, he outranked the guy who smuggled him in
seq(14, [
  [S(14), M([0.1, 1.1, 2.5], [0.0, 0.9, -1.4], S(14), { fov: 46, orbit: 0.004 }), 6, [0, 0.8, -1.3]],
  [W(11, "outranked"), M([1.35, 0.45, 0.75], [0.4, 0.5, -1.1], W(11, "outranked"), { fov: 42, orbit: -0.004, keep: true }), 10, [0.5, 0.45, -1.0]],
  [W(11, "smuggled"), M([-0.4, 1.4, 1.4], [-0.5, 1.5, -1.6], W(11, "smuggled"), { fov: 42, orbit: 0.004 }), 10, [-0.5, 1.4, -1.6]],
]);
// 15 three American presidents
seq(15, [
  [S(15), M([0, 1.45, 3.7], [0, 1.3, -2.0], S(15), { fov: 46, orbit: 0.003 }), 5, [0, 1.0, -1.8]],
  [W(12, "presidents"), M([0.9, 1.15, 3.3], [-0.1, 1.05, -1.7], W(12, "presidents"), { fov: 46, orbit: -0.004 }), 7, [-0.1, 0.8, -1.4]],
]);
// 16 football mascot, pushing the ball at halftime
seq(16, [
  [S(16), M([0.4, 1.5, 4.4], [-0.3, 1.4, -5.0], S(16), { fov: 48, orbit: 0.003, keep: true }), 3, [-0.6, 0.6, -1]],
  [W(12, "pushing"), M(tr(push16X, 0.75, 2.2, 0.25), tr(push16X, 0.6, -0.4, 0.2), W(12, "pushing"), { fov: 44, orbit: 0, keep: true }), 9, tr(push16X, 0.3, -0.4, 0.25)],
  [W(12, "halftime"), M([-0.4, 2.2, 5.6], [0.2, 1.2, -4.0], W(12, "halftime"), { fov: 48, orbit: 0.003, keep: true }), 3, [0, 0.6, -1]],
]);
// 17 not bad... for a stray
seq(17, [
  [S(17), M([0.6, 0.8, 2.3], [0.0, 0.65, -0.8], S(17), { fov: 44, orbit: 0.003, keep: true }), 9, [0, 0.5, -0.8]],
  [W(13, "stray"), M([-0.5, 0.6, 1.6], [0.0, 0.55, -0.8], W(13, "stray"), { fov: 42, orbit: -0.003, keep: true }), 10, [0, 0.5, -0.8]],
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
