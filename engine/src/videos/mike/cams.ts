// Camera keys and lens blur per shot for the Headless Mike short (cameras mostly on +z looking -z: +x = screen right).
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
type MO = { fov?: number; push?: number; orbit?: number; rise?: number; roll?: number; punch?: number; T?: number; drift?: number };
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
    const person = L[1] >= 1.35, dmin = person ? 2.8 : 1.9;
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

// tracked subjects (same formulas as sets.ts STAGE)
const lloydX = (f: number) => Math.min(0.1, -2.6 + 0.8 * (f / FPS));
const mike3 = (f: number): V3 => { const u = Math.max(0, f / FPS - C.walked); return [1.08 + 0.7 * u, 0.3 + 0.5 * Math.max(0, 0.5 + 1.6 * u - 6 * u * u), -1.15]; };
const mike4 = (f: number): V3 => [-0.52 + 0.35 * (f / FPS - C.l3), 0.3, 0.2];
const off = (p: (f: number) => V3, d: V3) => (f: number): V3 => { const q = p(f); return [q[0] + d[0], q[1] + d[1], q[2] + d[2]]; };
const STUMPV: V3 = [1.08, 0.82, -1.2];

// 1 Lloyd heads out to get a chicken ready for dinner
const lloyd1 = (f: number): V3 => [lloydX(f), 1.35, -1.7];
seq(1, [
  [S(1), M([-0.2, 0.3, 0.9], [-1.9, 0.95, -2.0], S(1), { fov: 46, orbit: 0.004, push: 0.005 }), 5, [-0.8, 0.3, -2.15]],
  [W(0, "farmer"), M(off(lloyd1, [0.55, -0.75, 1.9]), lloyd1, W(0, "farmer"), { fov: 40, orbit: -0.004 }), 8, lloyd1],
  [W(0, "chicken"), M([2.45, 0.32, -0.75], [1.8, 0.3, -2.0], W(0, "chicken"), { fov: 40, orbit: 0.006, push: 0.008 }), 13, [1.8, 0.3, -2.0]],
  [W(0, "dinner"), M([0.45, 1.45, -0.05], [0.1, 1.55, -1.7], W(0, "dinner"), { fov: 38, roll: 0.05, punch: 0.012 }), 13, [0.1, 1.6, -1.7]],
]);
// 2 one swing of the axe. Done.
seq(2, [
  [S(2), M([0.75, 0.55, 0.35], [0.12, 1.5, -1.7], S(2), { fov: 42, orbit: -0.006, push: 0.009 }), 8, [0.12, 1.5, -1.7]],
  [W(1, "axe"), M([1.45, 0.8, 0.05], [0.95, 0.68, -1.2], W(1, "axe"), { fov: 40, push: 0.004, orbit: 0.003, roll: -0.06 }), 12, [0.95, 0.7, -1.2]],
  [W(1, "done"), M([0.35, 1.5, -0.42], [0.1, 1.6, -1.7], W(1, "done"), { fov: 38, roll: 0.04, punch: 0.012 }), 13, [0.1, 1.6, -1.7]],
]);
KICKS.push([C.axe1 + 0.02, 0.45]);
// 3 except... the chicken got up. And walked away.
seq(3, [
  [S(3), M([0.95, 1.15, 1.5], [0.6, 0.95, -1.4], S(3), { fov: 42, orbit: 0.005 }), 6, [0.7, 0.9, -1.4]],
  [W(2, "got"), M([1.45, 0.62, -0.1], [1.08, 0.82, -1.15], W(2, "got"), { fov: 38, punch: 0.012, orbit: -0.004 }), 13, [1.08, 0.82, -1.15]],
  [W(2, "up"), M([0.3, 1.5, -0.1], [0.1, 1.7, -1.7], W(2, "up"), { fov: 42, roll: -0.06, punch: 0.012, orbit: 0.004 }), 12, [0.1, 1.6, -1.7]],
  [W(2, "walked"), M(off(mike3, [-0.45, 0.2, 2.2]), off(mike3, [0.12, 0.05, 0]), W(2, "walked"), { fov: 42, orbit: 0.004, push: 0.003 }), 10, mike3],
]);
// 4 No head. Just vibes.
seq(4, [
  [S(4), M(off(mike4, [0.35, 0.1, 1.0]), off(mike4, [0.05, 0.05, 0]), S(4), { fov: 38, orbit: -0.006, push: 0.006 }), 14, mike4],
  [W(3, "just"), M(off(mike4, [0.4, 0.0, 2.0]), off(mike4, [0.2, 0.05, 0]), W(3, "just"), { fov: 42, orbit: 0.006, push: 0.006 }), 9, mike4],
]);
// 5 the apple box (barn), alive the next morning
seq(5, [
  [S(5), M([0.2, 1.45, -0.45], [0, 0.32, -1.0], S(5), { fov: 44, orbit: 0.004, keep: true }), 8, [0, 0.4, -1.0]],
  [W(4, "next"), M([0.3, 0.62, 0.25], [0, 0.48, -1.0], W(4, "next"), { fov: 40, orbit: -0.005, push: 0.006 }), 12, [0, 0.45, -1.0]],
  [W(4, "alive"), M([0.2, 0.75, 0.05], [0.05, 0.42, -1.0], W(4, "alive"), { fov: 38, punch: 0.012, roll: 0.03 }), 14, [0.05, 0.4, -1.0]],
]);
// 6 he gave him a name: Mike
seq(6, [
  [S(6), M([-0.35, 1.3, 1.9], [-0.45, 1.3, -2.0], S(6), { fov: 46, orbit: 0.006 }), 8, [-0.45, 1.3, -2.0]],
  [W(5, "farmer"), M([0.3, 1.5, -0.45], [0.1, 1.62, -1.8], W(5, "farmer"), { fov: 38, orbit: -0.004, roll: -0.03 }), 13, [0.1, 1.6, -1.8]],
  [W(5, "name"), M([1.4, 0.75, 0.0], STUMPV, W(5, "name"), { fov: 38, orbit: 0.005, push: 0.008 }), 13, STUMPV],
  [W(5, "mike"), M([0.55, 1.25, 1.6], [0.45, 1.25, -1.5], W(5, "mike"), { fov: 42, punch: 0.012, orbit: -0.004 }), 6, [0.5, 1.2, -1.5]],
]);
// 7 How? the axe missed most of his brain, and a blood clot stopped the bleeding
seq(7, [
  [S(7), M([1.35, 0.95, -0.25], STUMPV, S(7), { fov: 38, roll: 0.07, punch: 0.012 }), 14, STUMPV],
  [W(6, "axe"), M([0.75, 1.1, 0.45], [0.85, 0.95, -1.2], W(6, "axe"), { fov: 40, orbit: 0.006 }), 12, [0.85, 0.95, -1.2]],
  [W(6, "clot"), M([1.25, 0.92, -0.45], STUMPV, W(6, "clot"), { fov: 34, orbit: -0.006, punch: 0.01 }), 14, STUMPV],
]);
// 8 he carried on: peck, preen, crow
seq(8, [
  [S(8), M([0.7, 0.4, 1.9], [0.15, 0.32, 0], S(8), { fov: 42, orbit: 0.006 }), 9, [0.15, 0.3, 0]],
  [W(7, "peck"), M([0.7, 0.3, 1.15], [0.15, 0.28, 0], W(7, "peck"), { fov: 40, orbit: -0.006, push: 0.006 }), 13, [0.15, 0.35, 0]],
  [W(7, "preen"), M([-0.45, 0.5, 1.2], [0.12, 0.3, 0], W(7, "preen"), { fov: 40, orbit: 0.006, roll: 0.04 }), 13, [0.1, 0.5, 0]],
  [W(7, "crow"), M([0.5, 0.12, 1.25], [0.15, 0.42, 0], W(7, "crow"), { fov: 42, punch: 0.014, roll: -0.04 }), 13, [0.15, 0.35, 0]],
]);
// 9 it came out as a gurgle
seq(9, [
  [S(9), M([0.35, 0.45, 1.3], [0.12, 0.32, -0.2], S(9), { fov: 42, orbit: -0.006 }), 10, [0.12, 0.3, 0]],
  [W(8, "gurgle"), M([0.35, 0.5, 0.75], [0.17, 0.4, 0], W(8, "gurgle"), { fov: 36, punch: 0.012, roll: -0.06 }), 14, [0.17, 0.4, 0]],
]);
// 10 Lloyd fed him with an eyedropper, straight down the neck
seq(10, [
  [S(10), M([1.05, 1.25, 1.3], [0.7, 1.1, -1.45], S(10), { fov: 42, orbit: 0.006 }), 7, [0.7, 1.1, -1.45]],
  [W(9, "eyedropper"), M([0.62, 1.5, -0.35], [0.45, 1.45, -1.7], W(9, "eyedropper"), { fov: 38, orbit: -0.005, roll: 0.03 }), 13, [0.45, 1.45, -1.7]],
  [W(9, "straight"), M([1.2, 1.05, 0.0], STUMPV, W(9, "straight"), { fov: 36, punch: 0.01, orbit: 0.004 }), 13, [1.0, 1.1, -1.2]],
]);
// 11 then a sideshow promoter saw dollar signs
seq(11, [
  [S(11), M([0.35, 0.75, 0.7], [-0.15, 1.45, -1.8], S(11), { fov: 44, orbit: -0.006, push: 0.008 }), 7, [-0.25, 1.4, -1.8]],
  [W(10, "promoter"), M([-0.05, 1.58, -0.38], [-0.25, 1.62, -1.8], W(10, "promoter"), { fov: 38, orbit: 0.005 }), 13, [-0.25, 1.6, -1.8]],
  [W(10, "dollar"), M([-0.2, 1.63, -0.62], [-0.25, 1.6, -1.8], W(10, "dollar"), { fov: 38, punch: 0.014, roll: 0.04 }), 13, [-0.25, 1.6, -1.8]],
]);
// 12 Mike went on tour across America. Twenty-five cents a look.
seq(12, [
  [S(12), M([0.4, 3.0, 4.6], [0, 1.9, -2.5], S(12), { fov: 46, orbit: 0.005, rise: -0.8 }), 4, [0, 1.7, -2.6]],
  [W(11, "twentyfive"), M([1.2, 1.55, -1.25], [1.5, 1.65, -2.9], W(11, "twentyfive"), { fov: 38, orbit: -0.006 }), 13, [1.5, 1.6, -2.9]],
  [W(11, "cents"), M([3.0, 1.4, 3.6], [0.2, 1.6, -2.6], W(11, "cents"), { fov: 40, orbit: 0.004, punch: 0.01 }), 5, [0, 1.7, -2.6]],
]);
// 13 Life magazine wrote about him -> four and a half thousand dollars a month
seq(13, [
  [S(13), M([0.05, 1.95, -0.8], [0, 1.95, -2.4], S(13), { fov: 40, orbit: 0.008, push: 0.006, roll: -0.05, keep: true }), 8, [0, 1.95, -2.4]],
  [W(12, "made"), M([0.5, 1.7, 2.8], [0, 1.65, -2.5], W(12, "made"), { fov: 46, orbit: -0.005, punch: 0.01 }), 4, [0, 1.7, -2.6]],
  [W(12, "thousand"), M([1.25, 1.55, -1.3], [1.5, 1.62, -2.9], W(12, "thousand"), { fov: 38, orbit: 0.006, roll: 0.04 }), 13, [1.5, 1.6, -2.9]],
]);
// 14 a hay baler, two tractors... and a brand new pickup truck. All paid for by a chicken with no head.
seq(14, [
  [S(14), M([-0.2, 1.6, 2.4], [-0.9, 1.3, -0.8], S(14), { fov: 44, orbit: 0.005 }), 6, [-0.9, 1.3, -0.8]],
  [W(13, "baler"), M([1.9, 1.3, 1.0], [3.9, 0.7, -2.8], W(13, "baler"), { fov: 46, orbit: -0.007, punch: 0.01 }), 6, [4.4, 0.6, -2.8]],
  [W(13, "tractors"), M([-1.2, 2.4, 3.8], [-4.2, 0.9, -3.0], W(13, "tractors"), { fov: 46, orbit: 0.007, punch: 0.01 }), 5, [-3.2, 0.9, -2.6]],
  [W(13, "pickup"), M([-0.3, 1.9, 6.2], [-0.4, 1.0, -2.0], W(13, "pickup"), { fov: 48, orbit: -0.004, push: 0.005 }), 3, [-0.4, 1.2, -1.5]],
  [W(13, "paid"), M([2.3, 1.62, -0.95], [1.92, 1.72, -2.2], W(13, "paid"), { fov: 42, orbit: 0.006, roll: -0.05 }), 10, [1.9, 1.8, -2.2]],
]);
KICKS.push([C.pickup + 0.02, 0.25]);
// 15 one night in Phoenix, Mike started choking
seq(15, [
  [S(15), M([0.3, 1.15, 0.6], [0.62, 1.0, -1.5], S(15), { fov: 44, orbit: 0.004, push: 0.005 }), 8, [0.62, 1.0, -1.5]],
  [W(14, "mike"), M([0.95, 1.05, -0.45], [0.65, 1.05, -1.5], W(14, "mike"), { fov: 38, orbit: -0.006 }), 13, [0.65, 1.05, -1.5]],
  [W(14, "choking"), M([0.82, 1.1, -0.7], [0.65, 1.08, -1.5], W(14, "choking"), { fov: 36, roll: 0.09, punch: 0.016 }), 14, [0.65, 1.05, -1.5]],
]);
KICKS.push([C.choking + 0.02, 0.3]);
// 16 the syringe? left behind at the show
seq(16, [
  [S(16), M([0.1, 1.55, -0.8], [0, 1.42, -2.45], S(16), { fov: 40, orbit: 0.006, push: 0.006 }), 10, [0, 1.42, -2.45]],
  [W(15, "left"), M([0, 1.9, 3.6], [0, 1.6, -2.5], W(15, "left"), { fov: 44, push: 0.002, orbit: 0, drift: 0 }), 5, [0, 1.42, -2.5]],
]);
// 17 eighteen months on, Mike was gone (the one slow shot)
seq(17, [[S(17), M([0.95, 1.0, 0.35], [0.75, 0.9, -1.5], S(17), { fov: 40, push: 0.0025, orbit: 0.0015, T: 200, drift: 0 }), 12, [0.75, 0.9, -1.5]]]);
// 18 the town never forgot him: Fruita throws a festival
seq(18, [
  [S(18), M([0, 2.3, 7.0], [0, 2.0, -4], S(18), { fov: 46, push: 0.004, orbit: 0.003, rise: -1.0 }), 3, [0, 2.0, -4.5]],
  [W(17, "every"), M([-1.3, 1.25, 2.6], [-0.6, 1.55, -1.6], W(17, "every"), { fov: 44, orbit: 0.005, keep: true }), 7, [-1.0, 1.2, -0.6]],
  [W(17, "festival"), M([1.0, 1.0, 1.6], [0, 2.2, -4.7], W(17, "festival"), { fov: 46, orbit: -0.004, keep: true }), 4, [0, 2.6, -4.7]],
]);
// 19 proof that even without a head... you can still get ahead
seq(19, [
  [S(19), M([-0.4, 1.4, 2.0], [0.55, 1.25, -2.4], S(19), { fov: 46, orbit: -0.004, keep: true }), 10, [0.75, 0.35, -2.2]],
  [W(18, "you"), M([0.5, 1.4, 3.0], [0.3, 1.3, -2.0], W(18, "you"), { fov: 44, orbit: 0.005 }), 5, [0.5, 1.0, -2.2]],
  [W(18, "ahead"), M([1.6, 1.35, 2.0], [0.65, 1.3, -2.4], W(18, "ahead"), { fov: 46, roll: -0.04, orbit: 0.005, keep: true }), 10, [0.7, 0.8, -2.2]],
]);
KICKS.push([C.ahead + 0.02, 0.3]);

for (const id in CAMS) for (const k of CAMS[id]) if (k.cut) CUTS.push(k.f);

export const camAt = (id: number, f: number): Cam => applyKick(runKeys(CAMS[id], f), f / FPS);
export const dofAt = (id: number, f: number) => {
  const L = DOF[id];
  let i = 0; while (i + 1 < L.length && f >= L[i + 1].f) i++;
  const d = L[i], p = L[Math.max(0, i - 1)];
  const k = d.dur ? glide((f - d.f) / d.dur) : 1;
  return { cInf: p.cInf + (d.cInf - p.cInf) * k, focus: d.focus };
};
