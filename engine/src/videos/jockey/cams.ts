// Camera keys and lens blur per shot for the Dead Jockey short (9:16) (cameras mostly on +z looking -z: +x = screen right).
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
// geography (sets.ts / race.ts): the course runs along x (horses gallop to +x) between rails at z = +-4.6; finish post x = 34;
// grandstand front z = -11. Trackside people stand outside the near rail (z ~ 5.6). Stable: Frank (0.2, -0.6), stalls at
// z -3; the horse stands at (0.2, -2). Grave: headstone (0, -2.2).
import { FINISH, kissAt } from "./race";
/** tracking camera: rides along with Sweet Kiss in race shot `id` (offsets are relative to her x) */
const TRK = (id: number, off: V3, look: V3, f0: number, fov = 50) =>
  M((f: number) => { const x = kissAt(id, f / FPS); return [x + off[0], off[1], off[2]]; }, (f: number) => { const x = kissAt(id, f / FPS); return [x + look[0], look[1], look[2]]; }, f0, { fov, orbit: 0, push: 0, keep: true, drift: 0 });
const HOOK_POS: V3 = [FINISH - 3, 2.2, 9.5], HOOK_LOOK: V3 = [FINISH - 3, 2.6, -2];

// 1 In 1923, a man won a horse race... while dead.   (slow-motion finish; opens on the frame shot 23 ends on: loop)
seq(1, [[S(1), STILL(HOOK_POS, HOOK_LOOK, S(1), 52), 1.2, [FINISH - 3, 1.5, 0]]]);
// 2 And he wasn't even a jockey.
seq(2, [[S(2), D([0.6, 1.8, 11.2], [0, 1.8, 5.4], S(2), { fov: 48, dx: -0.2 }), 4, [0, 1.4, 5.6]]]);
// 3 Meet Frank Hayes. 22 years old. He cleans the stables at a racetrack in New York.
seq(3, [[S(3), D([1.4, 1.8, 4.6], [-0.6, 1.6, -1.6], S(3), { fov: 50, dx: -0.3 }), 4, [0.2, 1.3, -0.6]]]);
// 4 His dream? To ride in a real race.
seq(4, [[S(4), D([0.8, 1.6, 3.4], [0, 1.9, -0.8], S(4), { fov: 50, dx: 0.2 }), 4, [0.3, 1.3, -0.6]]]);
// 5 June 4th. Belmont Park. Somebody finally gives him a horse.
seq(5, [[S(5), CR([10, 2.6, 16], [10, 4.5, 13], [10, 4.4, -12], S(5), 120, 52), 1.5, [10, 3, -11]]]);
// 6 Her name? Sweet Kiss.
seq(6, [[S(6), D([0.9, 1.6, 3.4], [0.4, 1.6, -2.0], S(6), { fov: 50, dx: -0.2 }), 4, [0.2, 1.3, -2.0]]]);
// 7 A 20-to-1 outsider. Nobody expects anything.
seq(7, [[S(7), D([0.4, 2.0, 11.4], [0, 2.4, 5.4], S(7), { fov: 50, dx: 0.2 }), 4, [0, 2, 5.6]]]);
// 8 To make the weight, Frank reportedly starves himself and runs for hours.
seq(8, [[S(8), D([0.9, 1.6, 3.8], [0, 1.6, -0.9], S(8), { fov: 50, dx: -0.3 }), 4, [0.2, 1.3, -0.6]]]);
// 9 Not a great plan.
seq(9, [[S(9), D([-0.6, 1.6, 3.4], [0.2, 1.6, -0.8], S(9), { fov: 50, dx: 0.2 }), 4, [0.2, 1.3, -0.6]]]);
// 10 The race starts. Frank and Sweet Kiss fly over fence after fence...   (tracking, wide)
seq(10, [[S(10), TRK(10, [-1.5, 3.2, 14], [1.5, 1.8, 0], S(10), 52), 1.5, [0, 1.5, 0]]]);
// 11 and somewhere in the middle... Frank's heart stops.   (tracking, closer)
seq(11, [[S(11), TRK(11, [0.2, 2.2, 7.2], [0.2, 2.4, 0], S(11), 50), 3, [0, 2, 0.4]]]);
// 12 But he doesn't fall. He stays slumped in the saddle.
seq(12, [[S(12), TRK(12, [1.6, 1.6, 6.6], [0.2, 2.0, 0], S(12), 50), 3, [0, 2, 0.4]]]);
// 13 And Sweet Kiss... just keeps running.   (wide, the field falling behind)
seq(13, [[S(13), TRK(13, [-3.5, 4.0, 16], [-1.5, 1.6, 0], S(13), 52), 1.5, [0, 1.5, 0]]]);
// 14 Fence. Fence. Final stretch. Sweet Kiss crosses the line first!
seq(14, [[S(14), TRK(14, [-0.5, 2.6, 12], [1.0, 2.0, 0], S(14), 52), 2, [0, 1.6, 0]]]);
// 15 The crowd goes wild.
seq(15, [[S(15), D([30, 3.0, 5], [30, 4.4, -12], S(15), { fov: 52, dx: -0.4 }), 1.5, [30, 3, -11]]]);
// 16 The owner rushes over to congratulate her new jockey...
seq(16, [[S(16), D([40.2, 1.9, 9.2], [40, 1.7, 0.8], S(16), { fov: 50, dx: -0.3 }), 3, [39.5, 1.4, 1]]]);
// 17 and Frank slides off the horse.
seq(17, [[S(17), D([38.6, 1.6, 8.0], [39.4, 1.4, 0.8], S(17), { fov: 50, dx: 0.3 }), 3, [39.5, 1.2, 1]]]);
// 18 Nobody had noticed.   (under the impact card)
seq(18, [[S(18), D([30, 3.0, 5], [30, 4.4, -12], S(18), { fov: 52, dx: 0.3 }), 1.5, [30, 3, -11]]]);
// 19 Three days later, Frank was buried in his racing silks.   (slow, still)
seq(19, [[S(19), CR([0.3, 1.5, 4.4], [0.2, 1.3, 3.2], [0, 0.85, -2], S(19), 150, 46), 2, [0, 0.7, -2]]]);
// 20 His first win. His only win.
seq(20, [[S(20), D([0.1, 1.15, 2.4], [0, 0.95, -2.0], S(20), { fov: 46, dx: 0.15 }), 3, [0, 0.8, -2]]]);
// 21 And Sweet Kiss? Legend says she never raced again, and got a new nickname.
seq(21, [[S(21), D([1.2, 1.6, 3.6], [0.3, 1.5, -2.0], S(21), { fov: 50, dx: -0.2 }), 4, [0.2, 1.2, -2.0]]]);
// 22 Sweet Kiss of Death.   (night)
seq(22, [[S(22), D([-0.4, 1.4, 3.0], [0.3, 1.7, -2.0], S(22), { fov: 50, dx: 0.2 }), 4, [0.2, 1.2, -2.0]]]);
// 23 Send this to the friend who says they'll finish, even if it kills them.   (ends on shot 1)
seq(23, [
  [S(23), D([FINISH - 1, 3.0, 13], [FINISH - 3, 2.6, -2], S(23), { fov: 52, dx: -0.4 }), 1.2, [FINISH - 3, 1.5, 0]],
  [W(10, "even"), STILL(HOOK_POS, HOOK_LOOK, W(10, "even"), 52), 1.2, [FINISH - 3, 1.5, 0]],
]);
KICKS.push([at(4, "stops."), 0.1], [at(6, "first!"), 0.12], [at(7, "slides"), 0.1]);

for (const id in CAMS) for (const k of CAMS[id]) if (k.cut) CUTS.push(k.f);

export const camAt = (id: number, f: number): Cam => applyKick(runKeys(CAMS[id], f), f / FPS);
export const dofAt = (id: number, f: number) => {
  const L = DOF[id];
  let i = 0; while (i + 1 < L.length && f >= L[i + 1].f) i++;
  const d = L[i], p = L[Math.max(0, i - 1)];
  const k = d.dur ? glide((f - d.f) / d.dur) : 1;
  return { cInf: p.cInf + (d.cInf - p.cInf) * k, focus: d.focus };
};
