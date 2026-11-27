// Camera keys and lens blur per shot for the Pig War short (9:16) (cameras mostly on +z looking -z: +x = screen right).
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
  list = list.map((x) => [x[0], x[1], x[2], x[3], 0] as Setup); // no foreground props: they covered the subject in 9:16
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
const SO_POS: V3 = [-7.0, 2.6, 8.0], SO_LOOK: V3 = [6.0, 1.6, -16];
const PIG: V3 = [-0.6, 0.5, -3.0];

// 1 In 1859, America and Britain almost went to war... over a pig.   (opens on the same frame shot 21 ends on: loop)
seq(1, [
  [S(1), STILL(SO_POS, SO_LOOK, S(1), 52), 1.5, [-0.6, 0.6, -3.0]],
  [W(0, "over"), D([-1.8, 0.55, -0.4], PIG, W(0, "over"), { fov: 40, dx: 0.15 }), 4, PIG],
]);
// 2 On a tiny island between the US and Canada,
seq(2, [[S(2), CR([0, 19, 27], [0, 12, 15], [0, 0, -8], S(2), 110, 46), 1, [0, 0, -5]]]);
// 3 an American farmer named Lyman Cutlar
seq(3, [[S(3), D([0.5, 1.45, 1.6], [-1.0, 1.55, -2.1], S(3), { fov: 46, dx: -0.35 }), 4, [-1.0, 1.1, -2.1]]]);
// 4 found a pig eating his potatoes. Again.
seq(4, [
  [S(4), D([1.7, 0.85, -0.9], [0.5, 0.5, -3.5], S(4), { fov: 44, dx: -0.25 }), 4, [0.5, 0.5, -3.5]],
  [W(1, "again,"), D([-0.2, 1.35, 0.9], [-1.4, 1.55, -2.0], W(1, "again,"), { fov: 46, dx: 0.25 }), 4, [-1.4, 1.2, -2.0]],
]);
// 5 So he shot it.
seq(5, [[S(5), D([-2.6, 1.3, 1.0], [-0.3, 0.95, -3.0], S(5), { fov: 50, dx: 0.25 }), 4, [0.3, 0.7, -3.4]]]);
// 6 The pig belonged to an Irishman, working for a British company.
seq(6, [
  [S(6), CR([7.6, 1.2, 1.4], [7.0, 1.45, 0.9], [6.4, 1.6, -3.4], S(6), 110, 46), 4, [6.2, 1.2, -3.4]],
  [W(2, "british"), D([4.2, 1.9, 2.6], [7.4, 2.6, -7.5], W(2, "british"), { fov: 50, dx: 0.3 }), 3, [6.6, 1.6, -4]],
]);
// 7 Cutlar offered ten dollars. The owner said, "A hundred." Cutlar said, "No."
seq(7, [
  [S(7), D([1.7, 1.7, 2.6], [3.35, 1.35, -2.75], S(7), { fov: 52, dx: 0.15 }), 4, [3.4, 1.2, -2.7]],
  [W(3, "100"), D([2.2, 1.5, 0.5], [4.6, 1.6, -2.9], W(3, "100"), { fov: 46, dx: -0.2 }), 4, [4.6, 1.2, -2.9]],
  [W(3, "no."), D([4.6, 1.4, 0.4], [2.3, 1.6, -2.6], W(3, "no."), { fov: 46, dx: 0.2 }), 4, [2.3, 1.2, -2.6]],
]);
// 8 The British threatened to arrest him.
seq(8, [[S(8), D([-0.4, 1.5, 2.3], [-0.5, 1.55, -2.7], S(8), { fov: 48, dx: 0.35 }), 4, [-0.6, 1.2, -2.5]]]);
// 9 So the US Army sent in sixty-four soldiers.
seq(9, [[S(9), D([-1.4, 0.9, 5.2], [-3.6, 1.6, -3.0], S(9), { fov: 50, dx: 0.9 }), 3, [-3.5, 1.2, -2.8]]]);
// 10 Britain answered with three warships.
seq(10, [[S(10), D([-4.4, 2.3, 3.2], [12, 4.0, -30], S(10), { fov: 46, dx: 0.4 }), 1.2, [14, 4, -30]]]);
// 11 Within weeks, it was 460 Americans with 14 cannons...
seq(11, [
  [S(11), CR([0.4, 1.6, 2.4], [0, 7.5, 12], [0, 1.2, -8], S(11), 120, 50), 2, [0, 1.2, -6]],
  [W(5, "14"), D([-9.0, 2.2, -14.0], [4, 0.8, -16.0], W(5, "14"), { fov: 46, dx: 1.0 }), 2, [-2, 0.8, -15.6]],
]);
// 12 versus over 2,000 British troops, and five warships.
seq(12, [[S(12), D([1.5, 1.2, 4.0], [16, 5.0, -40], S(12), { fov: 50, dx: 0.6 }), 1.2, [16, 4, -36]]]);
// 13 All pointing at each other. Over a pig.
seq(13, [
  [S(13), D([-7.2, 2.7, 2.2], [12, 3.0, -26], S(13), { fov: 46, dx: 0.4 }), 1.5, [-4.5, 1.5, -6]],
  [W(6, "over"), CR([-1.6, 0.9, 1.4], [-1.5, 1.2, 1.0], [-0.6, 1.4, -3.0], W(6, "over"), 60, 46), 3, [-0.6, 1.2, -3.0]],
]);
// 14 Then the British admiral was ordered to attack.
seq(14, [[S(14), D([0.9, 1.6, 1.9], [0.0, 1.55, -2.6], S(14), { fov: 46, dx: -0.35 }), 4, [0.1, 1.3, -2.5]]]);
// 15 He refused.
seq(15, [[S(15), D([-0.9, 1.0, 0.7], [0.1, 1.75, -2.6], S(15), { fov: 48, dx: 0.2 }), 4, [0.1, 1.3, -2.6]]]);
// 16 He said he would not start a war between two great nations... over a squabble about a pig.
seq(16, [
  [S(16), D([0.2, 1.5, 2.4], [0.0, 1.55, -2.6], S(16), { fov: 46, dx: 0.3 }), 4, [0.0, 1.3, -2.6]],
  [W(8, "over"), D([1.7, 1.3, 0.8], [0.1, 1.65, -2.6], W(8, "over"), { fov: 46, dx: -0.2 }), 4, [0.3, 1.4, -2.4]],
]);
// 17 So both armies just... stayed. For twelve years.
seq(17, [[S(17), CR([-8.2, 3.6, 9.4], [-7.4, 3.1, 8.4], [5, 1.4, -14], S(17), 120, 52), 2, [-2, 1.4, -4]]]);
// 18 They threw parties, and held sports days together.
seq(18, [[S(18), D([-1.0, 1.8, 5.4], [-0.7, 1.4, -4.6], S(18), { fov: 54, dx: 0.45 }), 4, [-0.6, 1.2, -4.6]]]);
// 19 In 1872, the German Kaiser was asked to settle it... and he gave the island to America.
seq(19, [
  [S(19), CR([0, 2.8, 7.4], [0, 2.1, 5.2], [0, 2.0, -4], S(19), 120, 48), 3, [0, 1.4, -3.4]],
  [W(10, "settle"), D([0.4, 1.7, 1.4], [0, 1.6, -2.6], W(10, "settle"), { fov: 46, dx: -0.3 }), 4, [0, 1.5, -2.2]],
]);
// 20 Total casualties of the war? One pig.
seq(20, [[S(20), D([0.7, 1.5, 2.4], [0.5, 1.4, -3.3], S(20), { fov: 52, dx: -0.3 }), 4, [0.5, 1.1, -3.2]]]);
// 21 Send this to the friend who overreacts about everything.   (ends on shot 1's opening frame)
seq(21, [
  [S(21), D([-2.4, 1.9, 2.6], [0.2, 1.8, -6], S(21), { fov: 50, dx: 0.4 }), 3, [-0.6, 1.2, -3.0]],
  [W(12, "about"), STILL(SO_POS, SO_LOOK, W(12, "about"), 52), 1.5, [-0.6, 0.6, -3.0]],
]);
KICKS.push([at(0, "war,"), 0.12], [at(1, "again,"), 0.1], [at(1, "shot"), 0.16], [at(3, "no."), 0.08], [at(7, "refused."), 0.12], [at(10, "gave"), 0.12]);

for (const id in CAMS) for (const k of CAMS[id]) if (k.cut) CUTS.push(k.f);

export const camAt = (id: number, f: number): Cam => applyKick(runKeys(CAMS[id], f), f / FPS);
export const dofAt = (id: number, f: number) => {
  const L = DOF[id];
  let i = 0; while (i + 1 < L.length && f >= L[i + 1].f) i++;
  const d = L[i], p = L[Math.max(0, i - 1)];
  const k = d.dur ? glide((f - d.f) / d.dur) : 1;
  return { cInf: p.cInf + (d.cInf - p.cInf) * k, focus: d.focus };
};
