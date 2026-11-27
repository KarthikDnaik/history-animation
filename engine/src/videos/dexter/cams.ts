// Camera keys and lens blur per shot for the Dexter short (cameras mostly on +z looking -z: +x = screen right).
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
type Setup = [number, (f: number) => Shot, number, P?];
const seq = (id: number, list: Setup[]) => {
  CAMS[id] = list.map(([f, s], i) => (i ? { f, cut: true, s } : { f, s }));
  DOF[id] = list.map(([f, , cInf, fp]) => ({ f, cInf, focus: fp ? (g: number) => val(fp, g) : undefined }));
};
export const CUTS: number[] = [];

const INS = (f0: number, d = 2.8, dy = 0.22) => M([6, 1.6 - dy, d], [6, 1.6 - dy, 0], f0, { fov: 42, orbit: 0.0015, keep: true });
const K = { keep: true };
/** standard medium two/three-shot of the stage around x (people at z -1.7..-2.4) */
const MID = (f0: number, x = 0, o: { dx?: number; d?: number; h?: number; orbit?: number; fov?: number; ly?: number; lz?: number } = {}) =>
  M([x + (o.dx ?? 0), o.h ?? 1.35, o.d ?? 3.2], [x, o.ly ?? 1.2, o.lz ?? -1.9], f0, { fov: o.fov ?? 48, orbit: o.orbit ?? 0.003, ...K });

// 1 This man was the worst businessman in America, and it made him rich.
seq(1, [
  [S(1), MID(S(1), 0, { d: 3.6, h: 1.5, orbit: 0.003, fov: 50 }), 4, [0, 1.0, -1.8]],
  [W(0, "and"), MID(W(0, "and"), 0, { dx: -0.9, d: 2.9, h: 1.15, orbit: -0.004 }), 5, [0, 1.0, -1.7]],
]);
// 2 Timothy Dexter, Massachusetts, 1780s. He buys a huge pile of money everyone says is worthless.
seq(2, [
  [S(2), MID(S(2), -0.3, { d: 3.4, h: 1.4, orbit: 0.003 }), 5, [-0.5, 1.0, -1.8]],
  [W(1, "he"), MID(W(1, "he"), 0.15, { dx: 0.4, d: 3.4, h: 1.05, orbit: -0.003, ly: 1.0 }), 5, [0.3, 0.8, -1.7]],
  [W(1, "everyone"), M([1.2, 1.4, 1.2], [2.6, 1.35, -3.0], W(1, "everyone"), { fov: 48, orbit: 0.004, ...K }), 5, [2.6, 1.2, -3.0]],
]);
// 3 Then the government decides to honour it. Dexter is rich.
seq(3, [
  [S(3), INS(S(3), 3.3), 2, [6, 1.6, 0]],
  [W(2, "dexter"), MID(W(2, "dexter"), 0.2, { d: 3.6, h: 1.4, orbit: 0.004, fov: 50 }), 4, [0, 1.0, -1.8]],
]);
// 4 His rivals want him broke. So, as the story goes, they give him the worst advice they can think of.
seq(4, [
  [S(4), MID(S(4), 0.0, { d: 3.2, h: 1.35, orbit: 0.003 }), 5, [0, 1.0, -1.8]],
  [W(3, "they"), MID(W(3, "they"), 0.0, { dx: 0.7, d: 2.7, h: 1.2, orbit: -0.004, ly: 1.35 }), 6, [0, 1.2, -1.8]],
]);
// 5 "Sell warming pans... in the Caribbean."
seq(5, [
  [S(5), MID(S(5), 0.05, { dx: -0.7, d: 3.0, h: 1.25, orbit: 0.003 }), 5, [-0.6, 1.0, -1.7]],
  [W(4, "in"), MID(W(4, "in"), 0.05, { d: 3.4, h: 1.3, orbit: -0.003 }), 5, [0, 1.0, -1.8]],
]);
// 6 Hot pans. In the tropics. He does it.
seq(6, [
  [S(6), MID(S(6), -0.3, { d: 3.0, h: 1.3, orbit: 0.004 }), 5, [-0.3, 1.0, -1.7]],
  [W(4, "he"), M([0.8, 1.6, 2.6], [-1.4, 1.0, -2.4], W(4, "he"), { fov: 50, orbit: -0.003, ...K }), 4, [-1.4, 0.9, -2.4]],
]);
// 7 The sugar farmers use them as ladles for molasses. Sold out.
seq(7, [
  [S(7), M([2.4, 1.5, 1.4], [1.4, 1.1, -2.4], S(7), { fov: 48, orbit: 0.004, ...K }), 5, [1.4, 1.0, -2.3]],
  [W(5, "sold"), MID(W(5, "sold"), 0.4, { d: 3.6, h: 1.4, orbit: -0.003, fov: 52 }), 4, [0, 1.0, -2.0]],
]);
// 8 "Ship coal to Newcastle." Newcastle is a coal town.
seq(8, [
  [S(8), MID(S(8), 0.1, { d: 3.0, h: 1.3, orbit: 0.003 }), 5, [0, 1.0, -1.7]],
  [W(6, "newcastle", 1), M([0.0, 1.8, 3.4], [0.2, 2.6, -8.0], W(6, "newcastle", 1), { fov: 56, orbit: 0.002, ...K }), 2, [0.2, 2, -8]],
]);
// 9 He does it. The miners are on strike. Sold out.
seq(9, [
  [S(9), MID(S(9), -0.4, { d: 3.0, h: 1.2, orbit: 0.004 }), 5, [-0.5, 0.9, -1.7]],
  [W(6, "the"), M([0.2, 1.5, 1.4], [2.2, 1.4, -2.6], W(6, "the"), { fov: 48, orbit: 0.003, ...K }), 5, [2.2, 1.2, -2.5]],
  [W(6, "sold"), MID(W(6, "sold"), 0.4, { d: 3.8, h: 1.4, orbit: -0.003, fov: 52 }), 4, [0.4, 1.0, -2.0]],
]);
// 10 "Send wool mittens to the tropics." Traders buy them all...
seq(10, [
  [S(10), MID(S(10), -0.6, { d: 2.9, h: 1.3, orbit: 0.004 }), 5, [-0.7, 1.0, -1.7]],
  [W(7, "traders"), MID(W(7, "traders"), 0.4, { dx: -0.6, d: 3.4, h: 1.3, orbit: -0.003, fov: 50 }), 4, [0.4, 1.0, -2.0]],
]);
// 11 ...for Siberia.
seq(11, [[S(11), MID(S(11), 0.0, { d: 3.4, h: 1.4, orbit: 0.005, fov: 50 }), 4, [0, 1.0, -1.8]]]);
// 12 Now rich, he gives himself a title: Lord Timothy Dexter.
seq(12, [
  [S(12), MID(S(12), 0.0, { d: 3.6, h: 1.4, orbit: 0.003, fov: 50 }), 4, [0, 1.0, -1.8]],
  [W(8, "lord"), MID(W(8, "lord"), 0.0, { dx: 0.6, d: 2.9, h: 1.05, orbit: -0.004, ly: 1.45 }), 5, [0, 1.3, -1.7]],
]);
// 13 He fakes his own funeral just to see who shows up. About three thousand people do.
seq(13, [
  [S(13), INS(S(13), 3.3), 2, [6, 1.6, 0]],
  [W(9, "see"), M([0.6, 1.5, 2.6], [-0.9, 1.1, -2.4], W(9, "see"), { fov: 56, orbit: 0.003, ...K }), 4, [-0.9, 1.0, -2.4]],
  [W(9, "about"), M([0.6, 2.4, 4.2], [0.3, 1.2, -3.0], W(9, "about"), { fov: 54, orbit: -0.003, ...K }), 3, [0.3, 1.0, -3.0]],
]);
// 14 Then he writes a book. No punctuation. None. Readers complain.
seq(14, [
  [S(14), MID(S(14), -0.9, { d: 2.9, h: 1.3, orbit: 0.004 }), 5, [-0.9, 1.0, -1.7]],
  [W(10, "book."), INS(W(10, "book."), 3.5), 2, [6, 1.6, 0]],
  [W(10, "readers"), MID(W(10, "readers"), 1.1, { dx: -0.4, d: 3.0, h: 1.3, orbit: -0.004 }), 5, [1.2, 1.0, -2.1]],
]);
// 15 So in the next edition, he adds a whole page of commas and full stops at the back... and tells readers to put them wherever they please.
seq(15, [
  [S(15), MID(S(15), -0.9, { d: 2.9, h: 1.3, orbit: 0.004 }), 5, [-0.9, 1.0, -1.7]],
  [W(11, "page"), INS(W(11, "page"), 3.5), 2, [6, 1.6, 0]],
  [W(11, "and"), MID(W(11, "and"), 0.4, { d: 3.8, h: 1.4, orbit: -0.003, fov: 52 }), 4, [0.3, 1.0, -1.9]],
]);
// 16 Genius? Fool? Either way, he died rich.
seq(16, [
  [S(16), MID(S(16), 0.0, { d: 3.2, h: 1.35, orbit: 0.003 }), 5, [0, 1.1, -1.7]],
  [W(12, "either"), MID(W(12, "either"), 0.0, { dx: -0.6, d: 3.8, h: 1.5, orbit: 0.004, fov: 52 }), 4, [0, 1.0, -1.8]],
]);
KICKS.push([C.rich0 + 0.02, 0.12], [C.sold5 + 0.02, 0.12], [C.sold6 + 0.02, 0.12], [C.lord + 0.02, 0.1], [C.died + 0.02, 0.12]);

for (const id in CAMS) for (const k of CAMS[id]) if (k.cut) CUTS.push(k.f);

export const camAt = (id: number, f: number): Cam => applyKick(runKeys(CAMS[id], f), f / FPS);
export const dofAt = (id: number, f: number) => {
  const L = DOF[id];
  let i = 0; while (i + 1 < L.length && f >= L[i + 1].f) i++;
  const d = L[i], p = L[Math.max(0, i - 1)];
  const k = d.dur ? glide((f - d.f) / d.dur) : 1;
  return { cInf: p.cInf + (d.cInf - p.cInf) * k, focus: d.focus };
};
