// Camera keys and lens blur per shot for the Dancing Plague short (9:16) (cameras mostly on +z looking -z: +x = screen right).
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
// geography (sets.ts): street lane x -3.2..3.2 along -z, Troffea's door (-3.2, -2.5), cathedral front z -82; market crowd
// around (0, -1.5), stage z -10 (deck 1.1), cathedral (6, -58) spire to 73; council table z -1.9, councillors z -3.2, doctor
// z -0.6; shrine chapel front z -9 (x -6..0), wagon (3.1, -4.2).
const HOOK_POS: V3 = [5, 5.5, 16], HOOK_LOOK: V3 = [-1, 5, -14];

// 1 In 1518, an entire city caught a disease... that made people dance.   (opens on the frame shot 27 ends on: loop)
seq(1, [[S(1), STILL(HOOK_POS, HOOK_LOOK, S(1), 52), 1.2, [0, 2, -2]]]);
// 2 And the doctors' cure?
seq(2, [[S(2), D([1.0, 1.7, 4.2], [-0.3, 1.5, -1.4], S(2), { fov: 48, dx: -0.3 }), 4, [0.4, 1.3, -0.6]]]);
// 3 More dancing.
seq(3, [[S(3), D([3.0, 2.6, 8.5], [0, 2.2, -4], S(3), { fov: 50, dx: -0.4 }), 2, [0, 1.4, -2]]]);
// 4 It's July, in the city of Strasbourg.
seq(4, [[S(4), CR([0.3, 13, 16], [0.3, 7, 11], [0, 7, -40], S(4), 110, 50), 1, [0, 3, -20]]]);
// 5 A woman named Frau Troffea steps into the street... and starts dancing.
seq(5, [
  [S(5), D([2.2, 1.8, 4.6], [-1.7, 1.4, -2.6], S(5), { fov: 48, dx: -0.25 }), 4, [-1.8, 1.3, -2.4]],
  [W(1, "dancing."), D([0.6, 1.4, 2.6], [-1.4, 1.5, -2.4], W(1, "dancing."), { fov: 46, dx: 0.2 }), 4, [-1.4, 1.3, -2.4]],
]);
// 6 No music. No reason. She just... doesn't stop.
seq(6, [[S(6), D([1.6, 1.0, 2.6], [-1.2, 1.7, -2.4], S(6), { fov: 50, dx: 0.3 }), 4, [-1.2, 1.4, -2.4]]]);
// 7 Her husband begs her to stop. She dances all night.   (night)
seq(7, [[S(7), D([2.4, 1.6, 3.4], [-0.3, 1.5, -2.3], S(7), { fov: 48, dx: -0.3 }), 4, [-0.3, 1.3, -2.3]]]);
// 8 Collapses. Wakes up. And dances again. For days.
seq(8, [[S(8), D([1.7, 1.7, 3.2], [-0.3, 1.3, -2.4], S(8), { fov: 48, dx: 0.3 }), 4, [-0.6, 1.0, -2.4]]]);
// 9 Within a week, more than thirty people have joined her.
seq(9, [[S(9), D([2.2, 2.8, 6.0], [0, 1.6, -6], S(9), { fov: 50, dx: -0.4 }), 2.5, [-0.4, 1.3, -3]]]);
// 10 By the end of the month? Around four hundred.
seq(10, [[S(10), CR([0, 7.5, 15], [0, 9.5, 12.5], [0, 1.2, -3], S(10), 120, 54), 1, [0, 1, -2]]]);
// 11 The city council calls in the doctors. Their diagnosis?
seq(11, [[S(11), D([0.7, 1.9, 4.2], [0.3, 1.6, -2.2], S(11), { fov: 52, dx: -0.3 }), 4, [0, 1.4, -2.6]]]);
// 12 Hot blood.   (mostly under the impact card)
seq(12, [[S(12), D([0.5, 1.6, 2.8], [0, 1.6, -0.6], S(12), { fov: 48, dx: 0.2 }), 4, [0, 1.4, -0.6]]]);
// 13 The treatment? Dance it out.
seq(13, [[S(13), D([1.0, 1.7, 3.4], [0.5, 1.5, -1.0], S(13), { fov: 50, dx: -0.3 }), 4, [0.3, 1.3, -0.6]]]);
// 14 So the city does the logical thing. They clear the markets, build a stage...
seq(14, [[S(14), D([4.0, 3.2, 8.0], [0, 1.6, -8], S(14), { fov: 50, dx: -0.5 }), 2, [0, 1.2, -8]]]);
// 15 and hire a band.
seq(15, [[S(15), D([0.8, 3.0, -0.6], [0, 2.6, -10.4], S(15), { fov: 48, dx: -0.3 }), 3, [0, 2.2, -10.4]]]);
// 16 They even pay healthy dancers to keep everyone going.
seq(16, [[S(16), D([2.4, 3.4, 6.5], [0, 2.4, -7], S(16), { fov: 52, dx: 0.4 }), 2, [0, 2, -6]]]);
// 17 It did not go well.
seq(17, [[S(17), D([6, 5.5, 15], [0, 3, -6], S(17), { fov: 52, dx: -0.5 }), 1.5, [0, 1.5, -2]]]);
// 18 More people joined. Some danced until they collapsed... and some reports say people died.   (slow, still, no gag)
seq(18, [[S(18), CR([4.5, 3.6, 9.5], [3.6, 3.2, 8.0], [0, 1.2, -3], S(18), 200, 50), 2, [0, 0.8, -2]]]);
// 19 So the council panics and does a full U-turn.
seq(19, [[S(19), D([0.4, 1.9, 3.2], [0, 1.7, -2.6], S(19), { fov: 50, dx: 0.3 }), 4, [0, 1.5, -3.0]]]);
// 20 The stage is torn down. Music is banned.
seq(20, [[S(20), D([5, 3.2, 8.5], [0, 1.6, -7.5], S(20), { fov: 52, dx: -0.4 }), 2, [0, 1.2, -7]]]);
// 21 No drums. Not even at weddings.
seq(21, [[S(21), D([0.8, 1.6, 2.4], [-0.2, 1.5, -3.0], S(21), { fov: 50, dx: -0.25 }), 4, [-0.2, 1.3, -3]]]);
// 22 The worst dancers are loaded onto wagons, taken to a shrine of Saint Vitus, and given little red shoes.
seq(22, [
  [S(22), D([6, 2.8, 7], [0, 2.6, -6], S(22), { fov: 52, dx: -0.4 }), 1.5, [0, 2, -6]],
  [W(8, "given"), D([5.0, 2.0, 2.6], [3.2, 1.9, -3.4], W(8, "given"), { fov: 48, dx: -0.2 }), 4, [3.2, 1.6, -3.4]],
]);
// 23 And slowly, finally, the dancing stopped.
seq(23, [[S(23), D([4.8, 1.8, 1.8], [3.2, 1.4, -3.6], S(23), { fov: 48, dx: -0.2 }), 4, [3.2, 1.2, -3.6]]]);
// 24 To this day, nobody knows exactly why it happened.   (golden, the empty lane)
seq(24, [[S(24), CR([0, 1.8, 7], [0, 2.4, 3.5], [0, 5, -40], S(24), 160, 48), 2, [0, 2, -10]]]);
// 25 Mass panic? Poisoned bread? A curse?
seq(25, [[S(25), D([0.6, 2.2, 3.4], [0, 2.9, -5], S(25), { fov: 52, dx: -0.3 }), 3, [0, 2.6, -5]]]);
// 26 We still don't know.
seq(26, [[S(26), CR([0, 2.2, 5], [0, 7, 9], [0, 9, -60], S(26), 120, 50), 1.5, [0, 4, -10]]]);
// 27 Send this to the friend who never leaves the dance floor. Historically, that's a warning sign.   (ends on shot 1)
seq(27, [
  [S(27), D([7, 6.4, 18.5], [-1, 5, -14], S(27), { fov: 52, dx: -0.5 }), 1.2, [0, 2, -2]],
  [W(10, "that's"), STILL(HOOK_POS, HOOK_LOOK, W(10, "that's"), 52), 1.2, [0, 2, -2]],
]);
KICKS.push([at(4, "hot"), 0.1], [at(7, "panics"), 0.1], [at(7, "torn"), 0.15], [at(2, "collapses."), 0.08]);

for (const id in CAMS) for (const k of CAMS[id]) if (k.cut) CUTS.push(k.f);

export const camAt = (id: number, f: number): Cam => applyKick(runKeys(CAMS[id], f), f / FPS);
export const dofAt = (id: number, f: number) => {
  const L = DOF[id];
  let i = 0; while (i + 1 < L.length && f >= L[i + 1].f) i++;
  const d = L[i], p = L[Math.max(0, i - 1)];
  const k = d.dur ? glide((f - d.f) / d.dur) : 1;
  return { cInf: p.cInf + (d.cInf - p.cInf) * k, focus: d.focus };
};
