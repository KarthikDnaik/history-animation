// Camera keys and lens blur per shot for the Operation Mincemeat short (9:16) (cameras mostly on +z looking -z: +x = screen right).
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
// geography (sets.ts): OFFICE back wall z -4 (map board x -3.8..0.8), Martin at the hook spot (0.1, 0.3), a foreground
// desk + lamp near the lens at (-1.5, 5.0); HQ map table at (0, -0.6), chair backs at z 3.6; SEA water y 0, HMS Seraph
// at (6, -7), the fishing boat at (1.6, -1.8), the town at z -56; BEACH landing craft at z -9, wire at z 6.6; GRAVE stone at (0, -1.35).
const HOOK_POS: V3 = [0.45, 1.75, 6.2], HOOK_LOOK: V3 = [0.1, 1.6, 0];
const HOOK = (f0: number) => M(HOOK_POS, HOOK_LOOK, f0, { fov: 40, orbit: 0, push: 0, keep: true, drift: 0 });
const BL = 4; // stronger lens blur for depth

seq(1, [[S(1), HOOK(S(1)), BL, [0.1, 1.5, 0.3]]]);
seq(2, [[S(2), D([0.5, 1.8, 4.4], [-0.9, 1.9, -3.9], S(2), { fov: 42, dx: -0.4 }), BL, [-0.8, 1.8, -3.6]]]);
seq(3, [[S(3), D([1.0, 1.9, 6.2], [-0.6, 1.7, -2.4], S(3), { fov: 42, dx: 0.4 }), BL, [-0.4, 1.4, -2.2]]]);
seq(4, [[S(4), D([0.7, 1.75, 5.0], [0.25, 1.65, 0.2], S(4), { fov: 40, dx: -0.3 }), BL, [0.2, 1.4, 0.2]]]);
seq(5, [[S(5), D([-0.7, 1.75, 7.4], [0.1, 1.6, 0], S(5), { fov: 40, dx: 0.4 }), BL, [0.1, 1.4, 0.1]]]);
seq(6, [[S(6), D([0.3, 1.75, 4.4], [-0.15, 1.8, -0.9], S(6), { fov: 42, dx: -0.3 }), BL, [-0.2, 1.6, -0.8]]]);
seq(7, [[S(7), D([1.0, 1.8, 5.4], [0.2, 1.85, 0.3], S(7), { fov: 40, dx: -0.3 }), BL, [0.2, 1.5, 0.3]]]);
seq(8, [[S(8), D([0.6, 1.85, 5.0], [0.05, 1.9, 0.2], S(8), { fov: 42, dx: 0.3 }), BL, [0.0, 1.6, 0.3]]]);
seq(9, [[S(9), D([-0.3, 1.8, 4.8], [0.1, 1.85, 0.2], S(9), { fov: 42, dx: 0.3 }), BL, [0.1, 1.6, 0.3]]]);
seq(10, [[S(10), D([0.9, 1.9, 5.2], [0.1, 1.95, 0.2], S(10), { fov: 42, dx: -0.4 }), BL, [0.1, 1.6, 0.3]]]);
seq(11, [[S(11), D([-0.8, 1.35, 4.8], [0.2, 1.55, 0.2], S(11), { fov: 42, dx: 0.4 }), BL, [0.1, 1.3, 0.2]]]);
seq(12, [[S(12), CR([-2.2, 1.6, 8.4], [-1.6, 1.5, 7.4], [2.6, 1.3, -5], S(12), 100, 50), BL, [2.6, 0.8, -3.5]]]);
seq(13, [[S(13), D([-0.7, 1.45, 5.8], [0.5, 1.0, -1.2], S(13), { fov: 44, dx: 0.4 }), BL, [0.4, 0.8, -1.0]]]);
seq(14, [[S(14), D([0.2, 1.75, 6.6], [0.0, 1.6, -0.3], S(14), { fov: 40, dx: -0.4 }), BL, [0, 1.4, -0.3]]]);
seq(15, [[S(15), D([0.3, 3.5, 3.8], [0.1, 0.95, -0.7], S(15), { fov: 46, dx: 0.5 }), BL, [0.2, 0.95, -0.7]]]);
seq(16, [[S(16), D([0.4, 1.85, 5.6], [0.05, 1.8, 0], S(16), { fov: 40, dx: -0.3 }), BL, [0, 1.6, 0.2]]]);
seq(17, [[S(17), CR([0.6, 1.7, 9.8], [0.2, 1.6, 8.8], [0, 1.3, -3], S(17), 100, 46), BL, [0, 1.2, -1]]]);
seq(18, [[S(18), D([0.35, 1.2, 6.6], [0, 0.95, -1.3], S(18), { fov: 38, dx: 0.2 }), BL, [0, 0.8, -1.3]]]);
seq(19, [
  [S(19), D([1.0, 1.9, 9.2], [0.1, 1.6, 0], S(19), { fov: 42, dx: -0.4 }), BL, [0.1, 1.4, 0.3]],
  [W(10, "with"), HOOK(W(10, "with")), BL, [0.1, 1.5, 0.3]],
]);
KICKS.push([at(4, "chained"), 0.08], [at(6, "bought"), 0.08], [at(8, "hit"), 0.1]);

for (const id in CAMS) for (const k of CAMS[id]) if (k.cut) CUTS.push(k.f);

export const camAt = (id: number, f: number): Cam => applyKick(runKeys(CAMS[id], f), f / FPS);
export const dofAt = (id: number, f: number) => {
  const L = DOF[id];
  let i = 0; while (i + 1 < L.length && f >= L[i + 1].f) i++;
  const d = L[i], p = L[Math.max(0, i - 1)];
  const k = d.dur ? glide((f - d.f) / d.dur) : 1;
  return { cInf: p.cInf + (d.cInf - p.cInf) * k, focus: d.focus };
};
